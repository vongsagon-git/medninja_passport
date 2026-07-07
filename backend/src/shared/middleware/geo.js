/**
 * Geo Middleware — Country Detection
 *
 * ตรวจ country จาก IP address (DO-only, ไม่พึ่ง Cloudflare)
 * ใช้ geoip-lite (offline DB — ฟรี + ถาวร)
 *
 * Attach req.geo = {
 *   country: 'TH' | 'CN' | 'US' | 'unknown',
 *   ip: '1.2.3.4',
 *   isChina: bool,
 *   isThai: bool,
 *   detectedBy: 'cloudflare' | 'geoip-lite' | 'fallback',
 *   region, city (optional)
 * }
 *
 * ใช้ตัวอย่าง:
 *   app.use(geoMiddleware)
 *   → route จะได้ req.geo ใช้เลย
 */

const geoip = require('geoip-lite')

// Fallback country ถ้า detect ไม่ได้
const FALLBACK_COUNTRY = 'TH'

// Log rate limiter — log tuk ip แค่ 1 ครั้ง/ชม.
const logCache = new Map()
const LOG_CACHE_MS = 60 * 60 * 1000 // 1 hour

function shouldLog (ip) {
  const now = Date.now()
  const last = logCache.get(ip)
  if (last && now - last < LOG_CACHE_MS) return false
  logCache.set(ip, now)
  // Cleanup old entries (simple)
  if (logCache.size > 1000) {
    const cutoff = now - LOG_CACHE_MS
    for (const [k, v] of logCache) {
      if (v < cutoff) logCache.delete(k)
    }
  }
  return true
}

// Cloudflare IPv4 ranges — ใช้เช็คว่า upstream เป็น CF จริงไหม
// ref: https://www.cloudflare.com/ips-v4
const CF_IPV4_PREFIXES = [
  '103.21.244.', '103.22.200.', '103.31.4.',
  '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.',
  '104.24.', '104.25.', '104.26.', '104.27.', '104.28.',
  '108.162.',
  '131.0.72.',
  '141.101.',
  '162.158.',
  '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.',
  '173.245.',
  '188.114.',
  '190.93.',
  '197.234.',
  '198.41.'
]
function isFromCloudflare (ip) {
  if (!ip) return false
  return CF_IPV4_PREFIXES.some(prefix => ip.startsWith(prefix))
}

function extractIp (req) {
  // ⭐ Priority: cf-connecting-ip ถ้า upstream = Cloudflare
  //    passport.medninja.academy อยู่หลัง Cloudflare → req.ip = CF IP (172.71.x.x)
  //    IP จริงของ client อยู่ใน cf-connecting-ip (CF ใส่เอง — user spoof ไม่ได้
  //    เพราะ CF จะทับ header นี้เสมอถ้า request ผ่าน CF)
  const upstreamIp = req.ip || req.socket?.remoteAddress || ''
  if (isFromCloudflare(upstreamIp)) {
    const cfIp = req.headers['cf-connecting-ip']
    if (cfIp) return String(cfIp).trim()
  }

  // Priority 2: req.ip (Express + trust proxy: 1)
  //    ใช้กรณี direct hit DO (ไม่ผ่าน CF) — spoof ไม่ได้เพราะ DO ทับ X-Forwarded-For
  if (req.ip) return req.ip

  // Fallback: dev/localhost
  const sock = req.socket?.remoteAddress
  if (sock) return sock

  return ''
}

function detectCountry (req, ip) {
  // Priority 1: Cloudflare header (ถ้า enable ในอนาคต)
  const cfCountry = req.headers['cf-ipcountry']
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return { country: cfCountry.toUpperCase(), detectedBy: 'cloudflare' }
  }

  // Priority 2: geoip-lite (offline DB)
  if (ip) {
    try {
      const geo = geoip.lookup(ip)
      if (geo?.country) {
        return {
          country: geo.country.toUpperCase(),
          region: geo.region,
          city: geo.city,
          detectedBy: 'geoip-lite'
        }
      }
    } catch (e) {
      console.error('[geo] geoip-lite lookup error:', e.message)
    }
  }

  // Priority 3: Fallback
  return { country: FALLBACK_COUNTRY, detectedBy: 'fallback' }
}

function geoMiddleware (req, res, next) {
  const ip = extractIp(req)
  const detected = detectCountry(req, ip)

  const geo = {
    ip,
    country: detected.country,
    isChina: detected.country === 'CN',
    isThai: detected.country === 'TH',
    isHK: detected.country === 'HK',
    isTaiwan: detected.country === 'TW',
    isSingapore: detected.country === 'SG',
    region: detected.region || null,
    city: detected.city || null,
    detectedBy: detected.detectedBy,
    // Original headers สำหรับ debug
    cfRay: req.headers['cf-ray'] || null,
    ua: req.headers['user-agent'] || ''
  }

  req.geo = geo

  // Log ครั้งแรกที่เจอ IP นี้ (rate-limited)
  if (process.env.NODE_ENV !== 'production' || geo.isChina) {
    if (shouldLog(ip)) {
      console.log(`[geo] ${ip} → ${geo.country} (${geo.detectedBy})`)
    }
  }

  next()
}

/**
 * Endpoint helper — ให้ frontend เรียกเช็ค country ของตัวเอง
 * GET /api/geo/whoami
 */
function whoamiEndpoint (req, res) {
  res.json({
    country: req.geo.country,
    isChina: req.geo.isChina,
    isThai: req.geo.isThai,
    ip: req.geo.ip,
    region: req.geo.region,
    city: req.geo.city,
    detectedBy: req.geo.detectedBy,
    // Debug (ช่วย diagnose เวลาผลไม่ตรง)
    debug: {
      reqIp: req.ip,
      cfConnectingIp: req.headers['cf-connecting-ip'] || null,
      cfIpCountry: req.headers['cf-ipcountry'] || null,
      cfRay: req.headers['cf-ray'] || null,
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      upstreamIsCloudflare: isFromCloudflare(req.ip || req.socket?.remoteAddress || '')
    }
  })
}

module.exports = geoMiddleware
module.exports.whoamiEndpoint = whoamiEndpoint
