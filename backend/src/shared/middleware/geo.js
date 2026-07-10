/**
 * Geo Middleware — Country Detection
 *
 * Detect ประเทศจาก IP address
 * Priority:
 *   1. ipinfo.io /lite endpoint — ฟรีไม่นับ quota (ต้องตั้ง IPINFO_TOKEN)
 *   2. geoip-lite (offline DB) — fallback
 *   3. 'unknown' — สุดท้าย
 *
 * Note: เดิมมี Cloudflare header (cf-ipcountry) เป็น priority 1
 * แต่ passport ใช้ DO App Platform ที่ CF ของ DO เอง — ไม่ inject header ให้เรา
 * ตัดออก 2026-07-10 (verified curl test)
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

function extractIp (req) {
  // 1. x-forwarded-for LEFTMOST — IP client จริงที่ผ่าน DO edge
  //    Format: "<client-ip>, <do-edge-ip>"
  const xff = req.headers['x-forwarded-for']
  if (xff) {
    const first = String(xff).split(',')[0].trim()
    if (first) return first
  }

  // 2. req.ip (Express + trust proxy: 1)
  if (req.ip) return req.ip

  // 3. Fallback socket
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
  if (!ip) return { country: 'unknown', detectedBy: 'no-ip' }

  // Priority 1: ipinfo /lite (แม่นสุด, ฟรีไม่นับ quota)
  const ipinfo = await ipinfoLookup(ip)
  if (ipinfo) return ipinfo

  // Priority 2: geoip-lite offline fallback
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
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      cacheSize: geoCache.size,
      hasIpinfoToken: !!IPINFO_TOKEN
    }
  })
}

// ─── Endpoint: GET /api/geo/all-sources ───
// Query 2 sources แบบ parallel — แสดงผลคู่กัน (ไม่ผ่าน priority chain)
// Note: Cloudflare ถูกตัดออก 2026-07-10 เพราะ DO ใช้ CF ของตัวเอง ไม่ inject header ให้เรา
async function allSourcesEndpoint (req, res) {
  const ip = extractIp(req)

  // Source 1: ipinfo.io (async — call external API)
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

  // Consensus + Winner (4 states — แยก available vs agreement ให้ชัด)
  const allSources = [ipinfoResult, geoipResult]
  const availableSources = allSources.filter(r => r.available && r.country)
  const availableCountries = availableSources.map(r => r.country)
  const allAgree = availableCountries.length > 0
    && availableCountries.every(c => c === availableCountries[0])

  let consensus
  if (availableCountries.length === 0) {
    consensus = 'no-data'
  } else if (availableCountries.length === allSources.length && allAgree) {
    consensus = 'agree'            // ทั้ง 2 available + เห็นตรงกัน
  } else if (allAgree) {
    consensus = 'partial-agree'    // บางตัว unavailable แต่ที่มีเห็นตรง
  } else {
    consensus = 'disagree'         // เห็นไม่ตรง
  }

  const consensusDetail = {
    totalSources: allSources.length,
    availableSources: availableSources.length,
    unavailableSources: allSources.length - availableSources.length,
    countries: availableCountries
  }

  const winner = req.geo?.detectedBy || 'none'

  res.json({
    ip,
    sources: {
      ipinfo: ipinfoResult,
      geoipLite: geoipResult
    },
    consensus,
    consensusDetail,
    winner,
    winnerCountry: req.geo?.country || null,
    debug: {
      reqIp: req.ip,
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      cacheSize: geoCache.size,
      hasIpinfoToken: !!IPINFO_TOKEN,
      userAgent: req.headers['user-agent'] || null
    }
  })
}

module.exports = geoMiddleware
module.exports.whoamiEndpoint = whoamiEndpoint
module.exports.allSourcesEndpoint = allSourcesEndpoint
