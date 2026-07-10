/**
 * Origin Check Middleware
 *
 * Code-level defense in depth — verify Origin/Referer = *.medninja.academy
 * ใช้กับ endpoint ที่ sensitive (Ali STS, video license, etc.)
 *
 * ไม่พึ่ง CORS อย่างเดียว — attacker ที่ curl/script spoof CORS ยาก
 * แต่ปลอม Origin/Referer ยังทำได้ (browser ปลอมไม่ได้ แต่ non-browser ปลอมได้)
 * ต้องใช้ร่วมกับ rate limit + auth + chromeOnly = defense in depth
 */

const { ALLOWED_ORIGINS, isAllowedDomain } = require('./domainCheck')

function extractHostname (url) {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function originCheck (req, res, next) {
  const origin = req.headers.origin
  const referer = req.headers.referer

  // ถ้าไม่มีทั้ง Origin และ Referer → non-browser (curl/script) → block
  if (!origin && !referer) {
    return res.status(403).json({
      code: 'ORIGIN_MISSING',
      message: 'Missing Origin/Referer — direct API access not allowed'
    })
  }

  // เช็ค Origin ก่อน (XHR/fetch จาก browser จะมี)
  if (origin) {
    const originHost = extractHostname(origin)
    if (!isAllowedDomain(originHost)) {
      return res.status(403).json({
        code: 'ORIGIN_NOT_ALLOWED',
        message: `Origin '${originHost}' not in whitelist`
      })
    }
    return next()
  }

  // ถ้าไม่มี Origin แต่มี Referer (navigation หรือ same-origin)
  if (referer) {
    const refererHost = extractHostname(referer)
    if (!isAllowedDomain(refererHost)) {
      return res.status(403).json({
        code: 'REFERER_NOT_ALLOWED',
        message: `Referer '${refererHost}' not in whitelist`
      })
    }
    return next()
  }

  next()
}

module.exports = originCheck
