/**
 * JWT Status Endpoint
 *
 * ตรวจสอบและ decode JWT — แสดงว่าเรารู้อะไรจาก token
 *
 * ใช้ที่หน้า /jwt — debug page
 */

const jwt = require('jsonwebtoken')
const User = require('../../modules/user/User.model')
const { validateSession } = require('../../modules/auth/session.service')

function base64UrlDecode (str) {
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  } catch {
    return null
  }
}

function decodeToken (token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signature] = parts
  const header = JSON.parse(base64UrlDecode(headerB64) || '{}')
  const payload = JSON.parse(base64UrlDecode(payloadB64) || '{}')

  return {
    header,
    payload,
    signaturePreview: signature.substring(0, 16) + '...',
    signatureLength: signature.length
  }
}

async function jwtStatusEndpoint (req, res) {
  const authHeader = req.headers.authorization || null
  const hasBearer = !!(authHeader && authHeader.startsWith('Bearer '))
  const token = hasBearer ? authHeader.split(' ')[1] : null

  // ─── ถ้าไม่มี token ───
  if (!token) {
    return res.json({
      timestamp: new Date().toISOString(),
      authenticated: false,
      hasAuthHeader: !!authHeader,
      authHeaderFormat: authHeader ? 'invalid (not Bearer)' : 'missing',
      token: null,
      decoded: null,
      validation: {
        signature: 'N/A',
        expiry: 'N/A',
        user: 'N/A',
        session: 'N/A',
        ban: 'N/A',
        lineFollow: 'N/A'
      },
      summary: {
        canAccess: false,
        reason: 'No Authorization header — user ยังไม่ได้ login'
      }
    })
  }

  // ─── Decode ตัว token ───
  const decoded = decodeToken(token)
  const tokenPreview = token.substring(0, 20) + '...' + token.substring(token.length - 8)

  const now = Math.floor(Date.now() / 1000)
  const exp = decoded?.payload?.exp || null
  const iat = decoded?.payload?.iat || null
  const isExpired = exp ? now > exp : null
  const secondsUntilExpire = exp ? exp - now : null
  const secondsSinceIssued = iat ? now - iat : null

  // ─── Verify signature ───
  let signatureValid = false
  let signatureError = null
  let verifiedPayload = null
  try {
    verifiedPayload = jwt.verify(token, process.env.JWT_SECRET)
    signatureValid = true
  } catch (e) {
    signatureError = e.message
  }

  // ─── User check ───
  let userStatus = { found: false, banned: null, id: null, email: null, role: null }
  if (verifiedPayload?.id) {
    try {
      const user = await User.findById(verifiedPayload.id).select('-password').lean()
      if (user) {
        userStatus = {
          found: true,
          banned: !!user.isBanned,
          id: user._id.toString(),
          email: user.email,
          role: user.role || 'user',
          lineUserId: user.lineUserId || null,
          name: user.name || null
        }
      } else {
        userStatus.notes = 'ID valid แต่ user ไม่อยู่ใน DB'
      }
    } catch (e) {
      userStatus.error = e.message
    }
  }

  // ─── Session check (Valkey) ───
  let sessionStatus = { valid: null, sid: null }
  if (verifiedPayload?.sid && userStatus.id) {
    try {
      const isValid = await validateSession(userStatus.id, verifiedPayload.sid)
      sessionStatus = {
        valid: isValid,
        sid: verifiedPayload.sid,
        notes: isValid ? '✅ Session ยัง active' : '❌ Session ถูก kick หรือหมดอายุ'
      }
    } catch (e) {
      sessionStatus.error = e.message
    }
  } else if (verifiedPayload) {
    sessionStatus.notes = 'Token ไม่มี sid (session ID) — legacy token'
  }

  // ─── Overall verdict ───
  const canAccess = signatureValid && userStatus.found && !userStatus.banned &&
    (!verifiedPayload?.sid || sessionStatus.valid !== false)

  res.json({
    timestamp: new Date().toISOString(),
    authenticated: hasBearer,
    hasAuthHeader: !!authHeader,
    authHeaderFormat: hasBearer ? 'Bearer <token>' : 'invalid',
    token: {
      preview: tokenPreview,
      length: token.length
    },
    decoded: decoded ? {
      header: decoded.header,
      payload: decoded.payload,
      signaturePreview: decoded.signaturePreview,
      signatureLength: decoded.signatureLength
    } : null,
    expiry: {
      iat,
      iatDate: iat ? new Date(iat * 1000).toISOString() : null,
      exp,
      expDate: exp ? new Date(exp * 1000).toISOString() : null,
      isExpired,
      secondsUntilExpire,
      secondsSinceIssued,
      humanReadable: exp
        ? isExpired
          ? `❌ หมดอายุแล้วเมื่อ ${Math.abs(secondsUntilExpire)} วิที่แล้ว`
          : `✅ เหลือ ${Math.floor(secondsUntilExpire / 3600)}h ${Math.floor((secondsUntilExpire % 3600) / 60)}m`
        : 'No expiration'
    },
    validation: {
      signature: {
        valid: signatureValid,
        error: signatureError,
        notes: signatureValid
          ? '✅ Signature ถูกต้อง (verified with JWT_SECRET)'
          : `❌ ${signatureError || 'Invalid signature'}`
      },
      user: userStatus,
      session: sessionStatus,
      ban: {
        checked: userStatus.found,
        banned: userStatus.banned,
        notes: userStatus.found
          ? userStatus.banned ? '❌ บัญชีถูกระงับ' : '✅ ไม่ถูกระงับ'
          : 'N/A (user not found)'
      }
    },
    summary: {
      canAccess,
      reason: !signatureValid ? 'Invalid signature'
        : !userStatus.found ? 'User not found'
        : userStatus.banned ? 'Account banned'
        : sessionStatus.valid === false ? 'Session kicked'
        : isExpired ? 'Token expired'
        : '✅ ผ่านทุก check — สามารถเข้าถึง API ได้'
    }
  })
}

module.exports = { jwtStatusEndpoint }
