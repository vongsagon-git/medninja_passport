/**
 * JWT Helper — สร้าง + verify JWT พร้อม observability metadata
 *
 * ทุก JWT ในระบบ MedNinja จะมี field พิเศษ:
 *   iss = app ที่สร้าง (lms, passport, ix, ...)
 *   aud = app ปลายทาง (สำหรับ handoff)
 *   src = วิธีสร้าง (login, handoff, liff, bypass, ...)
 *   jti = unique JWT ID (uuid v4) — สำหรับ track/revoke
 *   createdBy = ใครสร้าง (userId ของ admin สำหรับ bypass/manual)
 */
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const APP_ID = process.env.APP_ID || 'unknown'
const SECRET = process.env.JWT_SECRET

/**
 * signJwt(payload, options)
 *
 * @param {object} payload   - user data (id, sid, type, playerId, ...)
 * @param {object} options
 *   @param {string} src           - required — login|handoff|liff|bypass|manual|api|refresh|totp|otp
 *   @param {string} [aud]         - app ปลายทาง (สำหรับ handoff)
 *   @param {string} [createdBy]   - userId ของ admin (สำหรับ bypass/manual)
 *   @param {string} [parentJti]   - jti ของ token ต้นทาง (chain handoff)
 *   @param {string} [expiresIn]   - default '7d'
 *   @param {string} [iss]         - override issuer (default = APP_ID)
 * @returns {string} JWT
 */
function signJwt(payload, options = {}) {
  const {
    src = 'unknown',
    aud,
    createdBy,
    parentJti,
    expiresIn = '7d',
    iss = APP_ID
  } = options

  if (!SECRET) throw new Error('[jwtHelper] JWT_SECRET not set')

  const enriched = {
    ...payload,
    iss,
    src,
    jti: crypto.randomUUID(),
    ...(aud && { aud }),
    ...(createdBy && { createdBy }),
    ...(parentJti && { parentJti })
  }

  return jwt.sign(enriched, SECRET, { expiresIn })
}

/**
 * verifyJwt — throws on invalid
 */
function verifyJwt(token) {
  return jwt.verify(token, SECRET)
}

/**
 * inspectJwt — decode + verify + คืน metadata อ่านง่าย
 * ไม่ throw — ส่ง { ok:false, error } ถ้าไม่ valid
 */
function inspectJwt(token) {
  try {
    const decoded = jwt.verify(token, SECRET)
    const now = Math.floor(Date.now() / 1000)

    return {
      ok: true,
      valid: true,
      // ─ meta ─
      iss: decoded.iss || null,
      aud: decoded.aud || null,
      src: decoded.src || null,
      jti: decoded.jti || null,
      createdBy: decoded.createdBy || null,
      parentJti: decoded.parentJti || null,
      // ─ user ─
      id: decoded.id || null,
      sid: decoded.sid || null,
      type: decoded.type || null,
      playerId: decoded.playerId || null,
      // ─ timing ─
      iat: decoded.iat,
      exp: decoded.exp,
      iatDate: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
      expDate: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      isExpired: decoded.exp ? decoded.exp < now : false,
      secondsLeft: decoded.exp ? decoded.exp - now : null,
      // ─ raw ─
      raw: decoded
    }
  } catch (err) {
    // ยังลอง decode (ไม่ verify) เพื่อ show payload
    let decoded = null
    try { decoded = jwt.decode(token) } catch {}

    return {
      ok: false,
      valid: false,
      error: err.message,
      errorName: err.name,
      raw: decoded
    }
  }
}

module.exports = { signJwt, verifyJwt, inspectJwt, APP_ID }
