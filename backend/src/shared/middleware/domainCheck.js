/**
 * Domain Check Endpoint
 *
 * ตรวจสอบ 3 Layer defense ของ Domain lock:
 *   L1: CORS whitelist (Origin header check)
 *   L2: Bunny referrer whitelist (dashboard config)
 *   L3: CSP frame-ancestors (browser enforce)
 *
 * ใช้ที่หน้า /domain — debug page
 */

const ALLOWED_ORIGINS = [
  'medninja.academy',
  'www.medninja.academy',
  'passport.medninja.academy',
  'synapse.medninja.academy',
  'atlas.medninja.academy',
  'nlex.medninja.academy',
  'meq.medninja.academy',
  'ddx.medninja.academy',
  'osce.medninja.academy',
  '15-skill.medninja.academy',
  'longex.medninja.academy',
  'infra.medninja.academy',
  'comm.medninja.academy',
  'ws.medninja.academy',
  'wm.medninja.academy'
]

function extractHostname (url) {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function isAllowedDomain (hostname) {
  if (!hostname) return false
  return ALLOWED_ORIGINS.some(allowed =>
    hostname === allowed || hostname.endsWith('.' + allowed)
  )
}

function domainStatusEndpoint (req, res) {
  const origin = req.headers.origin || null
  const referer = req.headers.referer || null
  const host = req.headers.host || null

  const originHostname = extractHostname(origin)
  const refererHostname = extractHostname(referer)

  // Layer 1: CORS check (Origin header)
  const layer1 = {
    name: 'CORS Whitelist',
    priority: 1,
    location: 'Backend (app.js:181-183)',
    check: 'Origin header ↔ ALLOWED_ORIGINS',
    input: origin,
    hostname: originHostname,
    passed: !origin || isAllowedDomain(originHostname),
    notes: !origin
      ? 'No Origin header (direct navigation หรือ same-origin request)'
      : isAllowedDomain(originHostname)
        ? '✅ Origin อยู่ใน whitelist'
        : '❌ Origin ไม่อยู่ใน whitelist → CORS reject'
  }

  // Layer 2: Referer check (Bunny referrer whitelist mimicry)
  const layer2 = {
    name: 'Referer Check',
    priority: 2,
    location: 'Bunny Dashboard + Backend logic',
    check: 'Referer header ↔ *.medninja.academy',
    input: referer,
    hostname: refererHostname,
    passed: !referer || isAllowedDomain(refererHostname),
    notes: !referer
      ? 'No Referer header (fresh visit หรือ privacy-mode browser)'
      : isAllowedDomain(refererHostname)
        ? '✅ Referer อยู่ใน whitelist'
        : '❌ Referer ไม่อยู่ใน whitelist → Bunny CDN reject'
  }

  // Layer 3: CSP frame-ancestors
  const cspHeader = res.getHeader('content-security-policy') || ''
  const hasFrameAncestors = /frame-ancestors\s+'self'/.test(cspHeader)
  const layer3 = {
    name: 'CSP frame-ancestors',
    priority: 3,
    location: 'Browser + Backend (app.js:161)',
    check: "CSP header contains frame-ancestors 'self'",
    input: cspHeader ? 'CSP header set' : 'No CSP header',
    hostname: null,
    passed: hasFrameAncestors,
    notes: hasFrameAncestors
      ? "✅ frame-ancestors 'self' — browser จะ block iframe จาก domain อื่น"
      : "❌ CSP frame-ancestors missing"
  }

  const allPassed = layer1.passed && layer2.passed && layer3.passed

  res.json({
    timestamp: new Date().toISOString(),
    request: {
      host,
      origin,
      referer,
      userAgent: req.headers['user-agent'] || null
    },
    allowedDomains: ALLOWED_ORIGINS,
    layers: {
      layer1,
      layer2,
      layer3
    },
    summary: {
      allPassed,
      passedCount: [layer1, layer2, layer3].filter(l => l.passed).length,
      totalLayers: 3
    },
    verdict: allPassed
      ? 'SECURE — ผ่านทุกชั้น'
      : 'WARN — บาง layer ไม่ผ่าน'
  })
}

module.exports = { domainStatusEndpoint, isAllowedDomain, ALLOWED_ORIGINS }
