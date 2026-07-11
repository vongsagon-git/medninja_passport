/**
 * Watch Debug Controller
 * ═══════════════════════════════════════════════════════════
 * รับ trace log จาก client (แม้ main thread ค้าง — via sendBeacon)
 * ═══════════════════════════════════════════════════════════
 */
const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

// In-memory store (last 500 events per session, TTL 1 hour)
// เก็บใน DB ด้วยเผื่อ debug ย้อนหลัง
const traceSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, default: '', index: true },
  userEmail: { type: String, default: '' },
  route: { type: String, default: '' },
  ua: { type: String, default: '' },
  ip: { type: String, default: '' },
  country: { type: String, default: '' },
  events: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 }  // TTL 24h
}, { strict: false, minimize: false })
const WatchTrace = lmsConn.model('WatchTrace', traceSchema, 'watchtraces')

// POST /api/debug/watch-trace (public — no auth so beacon works even without token)
exports.pushTrace = async (req, res) => {
  try {
    // sendBeacon ส่งเป็น text/plain (Content-Type ไม่สำคัญ) — parse manual
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }
    const { sessionId, events, route, userEmail } = body || {}
    if (!sessionId || !Array.isArray(events)) {
      return res.status(400).json({ error: 'sessionId + events required' })
    }
    const ip = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()
    const ua = req.headers['user-agent'] || ''
    const country = req.headers['cf-ipcountry'] || ''

    // Upsert — append events
    await WatchTrace.findOneAndUpdate(
      { sessionId },
      {
        $set: { route, userEmail, ua, ip, country, userId: req.user?._id?.toString() || '' },
        $push: { events: { $each: events.slice(0, 50) } }  // cap per push
      },
      { upsert: true, new: true }
    )
    // 204 — no body needed (sendBeacon ignores response)
    res.status(204).end()
  } catch (err) {
    console.error('[watch-debug.pushTrace]', err.message)
    res.status(500).json({ error: err.message })
  }
}

// GET /api/debug/watch-beacon?sid=&t=&type=&data= — image pixel beacon fallback
// ทำงานได้แม้ main thread ค้าง 100% (browser fetch image ผ่าน network thread)
const PIXEL_1x1 = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
exports.pixelBeacon = async (req, res) => {
  try {
    const { sid, t, type, data } = req.query
    if (sid && type) {
      const parsedData = data ? (() => { try { return JSON.parse(data) } catch { return data } })() : null
      await WatchTrace.findOneAndUpdate(
        { sessionId: sid },
        {
          $set: {
            ua: req.headers['user-agent'] || '',
            ip: (req.headers['cf-connecting-ip'] || req.ip || '').split(',')[0].trim(),
            country: req.headers['cf-ipcountry'] || ''
          },
          $push: { events: { t: Number(t) || Date.now(), type, data: parsedData } }
        },
        { upsert: true }
      )
    }
  } catch (err) {
    console.error('[watch-debug.pixel]', err.message)
  }
  res.set('Content-Type', 'image/gif')
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.send(PIXEL_1x1)
}

// GET /api/admin/watch-debug/sessions — recent sessions
exports.listSessions = async (req, res) => {
  try {
    const sessions = await WatchTrace.find({}, { events: 0 })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    // Attach event count
    const withCount = await Promise.all(sessions.map(async (s) => {
      const doc = await WatchTrace.findById(s._id, { events: 1 }).lean()
      return { ...s, eventCount: (doc?.events || []).length }
    }))
    res.json({ ok: true, sessions: withCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/watch-debug/sessions/:sessionId
exports.getSession = async (req, res) => {
  try {
    const s = await WatchTrace.findOne({ sessionId: req.params.sessionId }).lean()
    if (!s) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true, session: s })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
