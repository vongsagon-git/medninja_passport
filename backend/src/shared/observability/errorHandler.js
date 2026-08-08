/**
 * Error handler middleware — unified response + persist to SystemError DB
 *
 * Response format (ทุก app ใช้เหมือนกัน):
 *   { code, message, requestId }
 *
 * Codes:
 *   VALIDATION_ERROR, DUPLICATE_KEY, CAST_ERROR
 *   UNAUTHORIZED, FORBIDDEN, NOT_FOUND
 *   INTERNAL_ERROR (default)
 *   + custom (IX_NOT_ACTIVATED, LINE_UNFOLLOW, SESSION_KICKED)
 *
 * Usage in app.js:
 *   const { errorHandler } = require('./shared/observability/errorHandler')
 *   const { lmsConn } = require('./shared/config/db')
 *   app.use(errorHandler({ appId: 'ix', lmsConn }))
 */
const { getSystemErrorModel } = require('./SystemError.model')

/**
 * sanitize req.body — ตัด field sensitive ก่อน save
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  const clone = { ...body }
  const sensitive = ['password', 'newPassword', 'oldPassword', 'idToken', 'accessToken', 'token', 'apiKey', 'secret', 'code', 'otp']
  for (const key of sensitive) {
    if (clone[key]) clone[key] = '[REDACTED]'
  }
  return clone
}

/**
 * decodeAuthorization → extract JWT metadata (best-effort, no verify)
 */
function extractJwtMeta(req) {
  try {
    const jwt = require('jsonwebtoken')
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return {}
    const decoded = jwt.decode(header.split(' ')[1]) || {}
    return {
      jwtIss: decoded.iss,
      jwtAud: decoded.aud,
      jwtSrc: decoded.src,
      jwtJti: decoded.jti
    }
  } catch { return {} }
}

/**
 * mapError — err → { statusCode, code, message }
 */
function mapError(err) {
  if (err.name === 'ValidationError') {
    return { statusCode: 400, code: 'VALIDATION_ERROR', message: Object.values(err.errors || {}).map(e => e.message).join(', ') || err.message }
  }
  if (err.code === 11000) {
    return { statusCode: 400, code: 'DUPLICATE_KEY', message: 'ข้อมูลซ้ำในระบบ' }
  }
  if (err.name === 'CastError') {
    return { statusCode: 400, code: 'CAST_ERROR', message: 'ข้อมูลไม่ถูกต้อง' }
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return { statusCode: 401, code: 'INVALID_TOKEN', message: 'Token ไม่ถูกต้อง' }
  }
  const statusCode = err.statusCode || err.status || 500
  return {
    statusCode,
    code: err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR'),
    message: err.message || 'เกิดข้อผิดพลาด'
  }
}

/**
 * errorHandler({ appId, lmsConn })
 */
function errorHandler({ appId, lmsConn }) {
  return async (err, req, res, next) => {
    const { statusCode, code, message } = mapError(err)
    const requestId = req.id || null

    // Log to console (always)
    const prefix = `[${appId}] [${requestId ? requestId.slice(0, 8) : 'no-req'}] ERROR ${statusCode} ${req.method} ${req.originalUrl}:`
    console.error(prefix, err.message)
    if (statusCode >= 500) console.error(err.stack)

    // Persist to DB (only 500 + selected 4xx)
    const shouldPersist = statusCode >= 500 || ['FORBIDDEN', 'INVALID_TOKEN'].includes(code)
    if (shouldPersist && lmsConn) {
      try {
        const SystemError = getSystemErrorModel(lmsConn)
        await SystemError.create({
          app: appId,
          requestId,
          method: req.method,
          endpoint: req.originalUrl,
          statusCode,
          errorMessage: err.message,
          errorName: err.name,
          errorCode: code,
          errorStack: (err.stack || '').slice(0, 2000),
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          isTrial: !!req.isTrial,
          ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
          userAgent: (req.headers['user-agent'] || '').slice(0, 500),
          referer: req.headers.referer,
          ...extractJwtMeta(req),
          requestBody: sanitizeBody(req.body),
          extra: err.extra || null
        })
      } catch (saveErr) {
        console.error(`${prefix} [SystemError save failed]`, saveErr.message)
      }
    }

    // Response
    const body = { code, message, requestId }
    // Production: hide 500 detail
    if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
      body.message = 'เกิดข้อผิดพลาดภายในระบบ'
    }
    res.status(statusCode).json(body)
  }
}

module.exports = { errorHandler, mapError, sanitizeBody }
