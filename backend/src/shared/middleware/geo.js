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

function extractIp (req) {
  // ⭐ Priority: req.ip (Express + trust proxy: 1) — ปลอมไม่ได้จาก DevTools
  //    เพราะ Express อ่าน rightmost IP ใน X-Forwarded-For ที่ DO append เอง
  //    User ส่ง X-Forwarded-For มาเอง = DO ทับด้วย IP จริงตัวขวาสุด
  //
  // ห้าม trust: x-forwarded-for (raw), x-real-ip → attacker set ผ่าน DevTools ได้
  // ห้าม trust: socket.remoteAddress → เป็น IP ของ DO ไม่ใช่ client
  if (req.ip) return req.ip

  // Fallback: ถ้า req.ip ไม่มี (dev/localhost) → socket
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
    detectedBy: req.geo.detectedBy
  })
}

module.exports = geoMiddleware
module.exports.whoamiEndpoint = whoamiEndpoint
