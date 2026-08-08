/**
 * In-memory metrics collector — track latency + status per endpoint
 *
 * Ring buffer 1000 requests ล่าสุด (memory-safe)
 * Expose via GET /api/observability/metrics
 *
 * Usage:
 *   const { metricsMiddleware, getMetrics } = require('./observability/metrics')
 *   app.use(metricsMiddleware)
 *   app.get('/api/observability/metrics', (req, res) => res.json(getMetrics()))
 */
const APP_ID = process.env.APP_ID || 'unknown'
const RING_SIZE = 1000

const ring = new Array(RING_SIZE)
let ringIdx = 0
let ringCount = 0

// aggregated stats
const stats = new Map()  // key: "GET:/api/x" → { count, totalMs, min, max, statusCodes: {200:5, 500:1} }

function metricsMiddleware(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const ms = Date.now() - start
    const key = `${req.method}:${normalizeUrl(req.route?.path || req.originalUrl)}`
    const entry = {
      t: start,
      m: req.method,
      p: req.originalUrl,
      s: res.statusCode,
      ms,
      rid: req.id?.slice(0, 8) || null,
      uid: req.user?._id?.toString().slice(-6) || null
    }
    ring[ringIdx] = entry
    ringIdx = (ringIdx + 1) % RING_SIZE
    ringCount = Math.min(ringCount + 1, RING_SIZE)

    let s = stats.get(key)
    if (!s) {
      s = { count: 0, totalMs: 0, min: Infinity, max: 0, statusCodes: {} }
      stats.set(key, s)
    }
    s.count++
    s.totalMs += ms
    s.min = Math.min(s.min, ms)
    s.max = Math.max(s.max, ms)
    s.statusCodes[res.statusCode] = (s.statusCodes[res.statusCode] || 0) + 1
  })

  next()
}

function normalizeUrl(url) {
  return (url || '')
    .split('?')[0]
    .replace(/\/[a-f0-9]{24}(?=\/|$)/g, '/:id')    // MongoDB ObjectId
    .replace(/\/\d+(?=\/|$)/g, '/:num')
}

function getMetrics() {
  const endpoints = []
  for (const [key, s] of stats.entries()) {
    endpoints.push({
      endpoint: key,
      count: s.count,
      avgMs: Math.round(s.totalMs / s.count),
      minMs: s.min,
      maxMs: s.max,
      statusCodes: s.statusCodes
    })
  }
  endpoints.sort((a, b) => b.count - a.count)

  // Recent requests
  const recent = []
  for (let i = 0; i < ringCount; i++) {
    const entry = ring[(ringIdx - 1 - i + RING_SIZE) % RING_SIZE]
    if (entry) recent.push(entry)
  }

  return {
    app: APP_ID,
    uptime: Math.round(process.uptime()),
    memMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    totalRequests: ringCount,
    endpoints: endpoints.slice(0, 50),
    recent: recent.slice(0, 50)
  }
}

function resetMetrics() {
  ring.fill(undefined)
  ringIdx = 0
  ringCount = 0
  stats.clear()
}

module.exports = { metricsMiddleware, getMetrics, resetMetrics }
