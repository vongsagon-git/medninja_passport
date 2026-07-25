/**
 * Maintenance Mode — Emergency Kill Switch for /watch
 *
 * Blocks non-admin users from accessing /watch pages when enabled.
 * Admin bypass: always allowed (role check via Valkey ticket → User).
 *
 * Toggle:
 *   POST /api/admin/maintenance-toggle?key=<SPY_ADMIN_KEY>&on=1  → enable
 *   POST /api/admin/maintenance-toggle?key=<SPY_ADMIN_KEY>&on=0  → disable
 *   GET  /api/maintenance-status                                 → { enabled }
 *
 * State: in-memory (resets on server restart).
 * Persistence via Valkey `maintenance:enabled` so multi-instance stays in sync.
 */
const { getClient } = require('../config/valkey')
const { lookupTicket } = require('../../modules/auth/session.service')
const User = require('../../modules/user/User.model')

let cachedEnabled = false
let cachedAt = 0
const CACHE_TTL_MS = 5000

async function isMaintenanceOn () {
  const now = Date.now()
  if (now - cachedAt < CACHE_TTL_MS) return cachedEnabled

  try {
    const client = getClient()
    if (!client) return cachedEnabled
    const val = await client.get('maintenance:enabled')
    cachedEnabled = val === '1'
    cachedAt = now
    return cachedEnabled
  } catch {
    return cachedEnabled
  }
}

async function setMaintenance (enabled) {
  cachedEnabled = !!enabled
  cachedAt = Date.now()
  try {
    const client = getClient()
    if (client) {
      if (enabled) {
        await client.set('maintenance:enabled', '1')
      } else {
        await client.del('maintenance:enabled')
      }
    }
  } catch {}
}

const BLOCKED_PATH_PATTERNS = [
  /^\/my\/watch\//,
  /^\/my\/section\//,
  /^\/my$/,
  /^\/my-cn\/watch\//,
  /^\/my-cn\/section\//,
  /^\/my-cn$/,
  /^\/watch/,
  /^\/live\//,
  /^\/live$/
]

function matchesBlocked (reqPath) {
  return BLOCKED_PATH_PATTERNS.some(re => re.test(reqPath))
}

async function maintenanceMiddleware (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const accept = req.headers.accept || ''
  if (!accept.includes('text/html') && accept !== '' && accept !== '*/*') return next()
  if (req.path.startsWith('/api/')) return next()

  if (!matchesBlocked(req.path)) return next()

  const on = await isMaintenanceOn()
  if (!on) return next()

  const sid = req.cookies && req.cookies.sid
  if (sid) {
    try {
      const ticket = await lookupTicket(sid)
      if (ticket && ticket.userId) {
        const user = await User.findById(ticket.userId).select('role').lean()
        if (user && user.role === 'admin') return next()
      }
    } catch {}
  }

  const path = require('path')
  const fs = require('fs')
  try {
    const html = fs.readFileSync(path.join(__dirname, '../../pages/maintenance.html'), 'utf8')
    res.status(503)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Retry-After', '300')
    return res.send(html)
  } catch {
    return res.status(503).send('<h1>System maintenance</h1><p>กรุณากลับมาใหม่ในอีกสักครู่</p>')
  }
}

module.exports = { maintenanceMiddleware, isMaintenanceOn, setMaintenance }
