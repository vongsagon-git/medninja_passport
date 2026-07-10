/**
 * Geo Middleware — Country Detection
 *
 * Detect ประเทศจาก IP address
 * Priority:
 *   1. Cloudflare header (cf-ipcountry) — ถ้ามี (ฟรี, เร็วสุด)
 *   2. ipinfo.io /lite endpoint — ฟรีไม่นับ quota (ต้องตั้ง IPINFO_TOKEN)
 *   3. geoip-lite (offline DB) — fallback
 *   4. 'unknown' — สุดท้าย
 *
 * Attach req.geo = {
 *   country: 'TH' | 'CN' | 'US' | 'unknown',
 *   ip, isChina, isThai, detectedBy, asn, isp
 * }
 */

const geoip = require('geoip-lite')

const IPINFO_TOKEN = process.env.IPINFO_TOKEN || 'c9a5fa81b94123'
const IPINFO_TIMEOUT_MS = 3000

// ─── Cache: IP → geo data (24 hr TTL) ───
const geoCache = new Map()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX = 5000

function cacheGet (ip) {
  const entry = geoCache.get(ip)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    geoCache.delete(ip)
    return null
  }
  return entry.data
}

function cacheSet (ip, data) {
  if (geoCache.size >= CACHE_MAX) {
    // Simple eviction: ลบ 500 ตัวแรก (FIFO)
    let n = 0
    for (const k of geoCache.keys()) {
      geoCache.delete(k)
      if (++n >= 500) break
    }
  }
  geoCache.set(ip, { data, ts: Date.now() })
}

// ─── Cloudflare IPv4 ranges (เช็คว่า upstream เป็น CF จริง) ───
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
  const upstreamIp = req.ip || req.socket?.remoteAddress || ''

  // 1. cf-connecting-ip (มาจาก Cloudflare — trust ที่สุด ถ้ามี)
  const cfIp = req.headers['cf-connecting-ip']
  if (cfIp) return String(cfIp).trim()

  // 2. ถ้า upstream = Cloudflare แต่ไม่มี cf-connecting-ip
  //    → อ่าน x-forwarded-for แล้วเอา LEFTMOST (IP client จริง)
  //    Format: "<client-ip>, <cloudflare-ip>"
  if (isFromCloudflare(upstreamIp)) {
    const xff = req.headers['x-forwarded-for']
    if (xff) {
      const first = String(xff).split(',')[0].trim()
      if (first) return first
    }
  }

  // 3. req.ip (Express + trust proxy: 1) — direct hit DO (ไม่ผ่าน CF)
  if (req.ip) return req.ip

  // 4. Fallback socket
  return req.socket?.remoteAddress || ''
}

// ─── ipinfo.io /lite lookup (ฟรีไม่นับ quota) ───
async function ipinfoLookup (ip) {
  if (!IPINFO_TOKEN) return null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), IPINFO_TIMEOUT_MS)
    const res = await fetch(`https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`, {
      headers: { Authorization: `Bearer ${IPINFO_TOKEN}` },
      signal: ctrl.signal
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const j = await res.json()
    if (!j.country_code) return null
    return {
      country: String(j.country_code).toUpperCase(),
      countryName: j.country || null,
      asn: j.asn || null,
      isp: j.as_name || null,
      continent: j.continent || null,
      detectedBy: 'ipinfo'
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('[geo] ipinfo lookup error:', e.message)
    }
    return null
  }
}

// ─── geoip-lite lookup (offline fallback) ───
function geoipLookup (ip) {
  try {
    const g = geoip.lookup(ip)
    if (!g?.country) return null
    return {
      country: g.country.toUpperCase(),
      region: g.region || null,
      city: g.city || null,
      detectedBy: 'geoip-lite'
    }
  } catch (e) {
    console.error('[geo] geoip-lite lookup error:', e.message)
    return null
  }
}

// ─── Main detection (async — เพราะเรียก ipinfo) ───
async function detectCountry (req, ip) {
  // Priority 1: Cloudflare header (ถ้ามี — เร็วสุด)
  const cfCountry = req.headers['cf-ipcountry']
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    return {
      country: cfCountry.toUpperCase(),
      detectedBy: 'cloudflare'
    }
  }

  if (!ip) return { country: 'unknown', detectedBy: 'no-ip' }

  // Priority 2: ipinfo /lite (แม่นสุด, ฟรีไม่นับ quota)
  const ipinfo = await ipinfoLookup(ip)
  if (ipinfo) return ipinfo

  // Priority 3: geoip-lite offline fallback
  const glite = geoipLookup(ip)
  if (glite) return glite

  return { country: 'unknown', detectedBy: 'fallback' }
}

// ─── Middleware ───
async function geoMiddleware (req, res, next) {
  const ip = extractIp(req)

  let detected = ip ? cacheGet(ip) : null
  if (!detected) {
    detected = await detectCountry(req, ip)
    if (ip && detected.country !== 'unknown') cacheSet(ip, detected)
  }

  req.geo = {
    ip,
    country: detected.country,
    countryName: detected.countryName || null,
    isChina: detected.country === 'CN',
    isThai: detected.country === 'TH',
    isHK: detected.country === 'HK',
    isTaiwan: detected.country === 'TW',
    isSingapore: detected.country === 'SG',
    region: detected.region || null,
    city: detected.city || null,
    asn: detected.asn || null,
    isp: detected.isp || null,
    detectedBy: detected.detectedBy,
    cfRay: req.headers['cf-ray'] || null
  }

  next()
}

// ─── Endpoint: GET /api/geo/whoami ───
function whoamiEndpoint (req, res) {
  res.json({
    ip: req.geo.ip,
    country: req.geo.country,
    countryName: req.geo.countryName,
    isChina: req.geo.isChina,
    isThai: req.geo.isThai,
    region: req.geo.region,
    city: req.geo.city,
    asn: req.geo.asn,
    isp: req.geo.isp,
    detectedBy: req.geo.detectedBy,
    debug: {
      reqIp: req.ip,
      cfConnectingIp: req.headers['cf-connecting-ip'] || null,
      cfIpCountry: req.headers['cf-ipcountry'] || null,
      cfRay: req.headers['cf-ray'] || null,
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      upstreamIsCloudflare: isFromCloudflare(req.ip || req.socket?.remoteAddress || ''),
      cacheSize: geoCache.size,
      hasIpinfoToken: !!IPINFO_TOKEN
    }
  })
}

// ─── Endpoint: GET /api/geo/all-sources ───
// Query ทั้ง 3 source แบบ parallel — แสดงผลคู่กัน (ไม่ผ่าน priority chain)
async function allSourcesEndpoint (req, res) {
  const ip = extractIp(req)
  const cfCountry = req.headers['cf-ipcountry'] || null

  // Source 1: Cloudflare header (sync — อ่านจาก header ตรงๆ)
  const cfResult = cfCountry
    ? {
        source: 'cloudflare',
        country: cfCountry.toUpperCase(),
        available: cfCountry !== 'XX' && cfCountry !== 'T1',
        raw: cfCountry,
        latencyMs: 0,
        cost: 'free',
        notes: cfCountry === 'XX' ? 'Unknown country'
             : cfCountry === 'T1' ? 'Tor exit node'
             : 'OK'
      }
    : {
        source: 'cloudflare',
        country: null,
        available: false,
        raw: null,
        latencyMs: 0,
        cost: 'free',
        notes: 'No CF header (CF proxy off or direct hit)'
      }

  // Source 2: ipinfo.io (async — call external API)
  const ipinfoStart = Date.now()
  let ipinfoResult = null
  try {
    if (!IPINFO_TOKEN) {
      ipinfoResult = {
        source: 'ipinfo',
        country: null,
        available: false,
        latencyMs: 0,
        cost: 'paid-after-50k',
        notes: 'No IPINFO_TOKEN configured'
      }
    } else {
      const data = await ipinfoLookup(ip)
      const latency = Date.now() - ipinfoStart
      if (data) {
        ipinfoResult = {
          source: 'ipinfo',
          country: data.country,
          countryName: data.countryName,
          asn: data.asn,
          isp: data.isp,
          continent: data.continent,
          available: true,
          latencyMs: latency,
          cost: 'paid-after-50k',
          notes: 'OK'
        }
      } else {
        ipinfoResult = {
          source: 'ipinfo',
          country: null,
          available: false,
          latencyMs: latency,
          cost: 'paid-after-50k',
          notes: 'API failed / timeout / invalid response'
        }
      }
    }
  } catch (e) {
    ipinfoResult = {
      source: 'ipinfo',
      country: null,
      available: false,
      latencyMs: Date.now() - ipinfoStart,
      cost: 'paid-after-50k',
      notes: 'Error: ' + e.message
    }
  }

  // Source 3: geoip-lite (offline)
  const geoipStart = Date.now()
  const geoipData = geoipLookup(ip)
  const geoipResult = geoipData
    ? {
        source: 'geoip-lite',
        country: geoipData.country,
        region: geoipData.region,
        city: geoipData.city,
        available: true,
        latencyMs: Date.now() - geoipStart,
        cost: 'free-offline',
        notes: 'OK (accuracy ~85-90%)'
      }
    : {
        source: 'geoip-lite',
        country: null,
        available: false,
        latencyMs: Date.now() - geoipStart,
        cost: 'free-offline',
        notes: 'IP not in offline DB'
      }

  // Consensus + Winner
  const availableCountries = [cfResult, ipinfoResult, geoipResult]
    .filter(r => r.available && r.country)
    .map(r => r.country)
  const consensus = availableCountries.length > 0
    ? availableCountries.every(c => c === availableCountries[0])
      ? 'agree'
      : 'disagree'
    : 'no-data'

  const winner = req.geo?.detectedBy || 'none'

  res.json({
    ip,
    sources: {
      cloudflare: cfResult,
      ipinfo: ipinfoResult,
      geoipLite: geoipResult
    },
    consensus,
    winner,
    winnerCountry: req.geo?.country || null,
    debug: {
      reqIp: req.ip,
      cfConnectingIp: req.headers['cf-connecting-ip'] || null,
      cfIpCountry: cfCountry,
      cfRay: req.headers['cf-ray'] || null,
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      upstreamIsCloudflare: isFromCloudflare(req.ip || req.socket?.remoteAddress || ''),
      cacheSize: geoCache.size,
      hasIpinfoToken: !!IPINFO_TOKEN,
      userAgent: req.headers['user-agent'] || null
    }
  })
}

module.exports = geoMiddleware
module.exports.whoamiEndpoint = whoamiEndpoint
module.exports.allSourcesEndpoint = allSourcesEndpoint
