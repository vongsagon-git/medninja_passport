/**
 * Structured logger — prefix ทุก log ด้วย app + requestId + level
 *
 * Usage:
 *   const log = require('./observability/logger')(req)
 *   log.info('User logged in', { userId, method: 'password' })
 *   log.error('DB timeout', err)
 */
const APP_ID = process.env.APP_ID || 'unknown'

function fmt(level, msg, meta) {
  const time = new Date().toISOString()
  const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
  return `[${time}] [${APP_ID}] [${level}]${msg}${metaStr}`
}

function createLogger(req) {
  const rid = req?.id ? `[${req.id.slice(0, 8)}] ` : ''

  return {
    debug: (msg, meta) => { if (process.env.NODE_ENV !== 'production') console.log(fmt('DEBUG', ` ${rid}${msg}`, meta)) },
    info:  (msg, meta) => console.log(fmt('INFO', ` ${rid}${msg}`, meta)),
    warn:  (msg, meta) => console.warn(fmt('WARN', ` ${rid}${msg}`, meta)),
    error: (msg, err)  => {
      const meta = err instanceof Error
        ? { message: err.message, stack: err.stack, code: err.code }
        : err
      console.error(fmt('ERROR', ` ${rid}${msg}`, meta))
    }
  }
}

// Global logger (สำหรับ code ที่ไม่มี req)
const global = createLogger(null)

module.exports = createLogger
module.exports.global = global
module.exports.APP_ID = APP_ID
