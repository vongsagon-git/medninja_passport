/**
 * Observability routes — expose ต่อ app
 *
 *   GET  /api/observability/health   → { app, uptime, memMB, db, redis }
 *   GET  /api/observability/metrics  → in-memory metrics (public หรือ auth ก็ได้)
 *   POST /api/observability/inspect  → decode + verify JWT (admin only)
 *   GET  /api/observability/errors   → recent errors (admin only, query SystemError)
 *
 * Usage:
 *   const observabilityRoutes = require('./shared/observability/observabilityRoutes')
 *   app.use('/api/observability', observabilityRoutes({ appId, lmsConn, dbConns }))
 */
const express = require('express')
const { getMetrics } = require('./metrics')
const { inspectJwt } = require('./jwtHelper')
const { getSystemErrorModel } = require('./SystemError.model')

module.exports = function observabilityRoutes({ appId, lmsConn, dbConns = {} }) {
  const router = express.Router()

  // ─── HEALTH ───
  router.get('/health', async (req, res) => {
    const health = {
      app: appId,
      status: 'ok',
      uptime: Math.round(process.uptime()),
      memMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      time: new Date().toISOString(),
      dbs: {}
    }

    // check DB connections
    for (const [name, conn] of Object.entries(dbConns)) {
      health.dbs[name] = conn?.readyState === 1 ? 'connected' : 'disconnected'
    }

    res.json(health)
  })

  // ─── METRICS (no auth — read-only stats) ───
  router.get('/metrics', (req, res) => {
    res.json(getMetrics())
  })

  // ─── INSPECT JWT (admin only) ───
  router.post('/inspect', requireAdmin, (req, res) => {
    const { token } = req.body
    if (!token) return res.status(400).json({ code: 'MISSING_TOKEN', message: 'token required' })
    res.json(inspectJwt(token))
  })

  // ─── RECENT ERRORS (admin only) ───
  router.get('/errors', requireAdmin, async (req, res) => {
    if (!lmsConn) return res.status(503).json({ code: 'NO_LMS_CONN', message: 'lmsConn not available' })

    try {
      const SystemError = getSystemErrorModel(lmsConn)
      const { app, userId, endpoint, statusCode, limit = 100 } = req.query
      const q = {}
      if (app) q.app = app
      if (userId) q.userId = userId
      if (endpoint) q.endpoint = new RegExp(endpoint, 'i')
      if (statusCode) q.statusCode = parseInt(statusCode)

      const errors = await SystemError.find(q)
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit), 500))
        .lean()

      res.json({ count: errors.length, errors })
    } catch (err) {
      res.status(500).json({ code: 'QUERY_ERROR', message: err.message })
    }
  })

  return router
}

// helper: require admin (ต้อง apply auth middleware ก่อน)
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin only' })
  }
  next()
}
