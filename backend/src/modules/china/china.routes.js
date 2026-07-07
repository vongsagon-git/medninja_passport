const express = require('express')
const router = express.Router()
const { getPlayAuth, listVideos, getPlayInfo } = require('./china.controller')
const { pushLog, getLogs, clearLogs } = require('./china.logs')

router.use(express.json({ limit: '512kb' }))

// GET /api/china/playauth/:videoId — public (MVP)
router.get('/playauth/:videoId', getPlayAuth)

// GET /api/china/videos — list videos ใน Alibaba VOD account (สำหรับ AI debug)
router.get('/videos', listVideos)

// GET /api/china/playinfo/:videoId — get play URL + encryption status
router.get('/playinfo/:videoId', getPlayInfo)

// POST /api/china/log — frontend ส่ง log ทุก event
router.post('/log', (req, res) => {
  const { sessionId, level, msg, meta } = req.body || {}
  pushLog({
    sessionId: String(sessionId || 'unknown').substring(0, 32),
    level: String(level || 'info').substring(0, 10),
    msg: String(msg || '').substring(0, 1000),
    meta: meta || null,
    ua: (req.headers['user-agent'] || '').substring(0, 200),
    ip: req.headers['x-forwarded-for'] || req.ip
  })
  res.json({ ok: true })
})

// POST /api/china/log/batch — batch (efficient)
router.post('/log/batch', (req, res) => {
  const { sessionId, entries } = req.body || {}
  const sid = String(sessionId || 'unknown').substring(0, 32)
  const ua = (req.headers['user-agent'] || '').substring(0, 200)
  const ip = req.headers['x-forwarded-for'] || req.ip
  if (Array.isArray(entries)) {
    entries.forEach(e => pushLog({
      sessionId: sid,
      level: String(e.level || 'info').substring(0, 10),
      msg: String(e.msg || '').substring(0, 1000),
      meta: e.meta || null,
      ua,
      ip,
      clientTs: e.clientTs
    }))
  }
  res.json({ ok: true, saved: (entries || []).length })
})

// GET /api/china/logs?sessionId=xxx&since=ISO — for debugging by admin/AI
router.get('/logs', (req, res) => {
  const { sessionId, since, format } = req.query
  const list = getLogs({ sessionId, since })
  if (format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const txt = list.map(l =>
      `[${l.ts}] [${l.sessionId.substring(0,8)}] [${l.level}] ${l.msg}` +
      (l.meta ? ' ' + JSON.stringify(l.meta) : '') +
      (l.ua ? ` (UA: ${l.ua.substring(0, 60)}...)` : '')
    ).join('\n')
    return res.send(txt || '(ไม่มี log)')
  }
  res.json({ count: list.length, logs: list })
})

// GET /api/china/logs/sessions — list unique sessions
router.get('/logs/sessions', (req, res) => {
  const all = getLogs()
  const bySession = {}
  all.forEach(l => {
    if (!bySession[l.sessionId]) {
      bySession[l.sessionId] = {
        sessionId: l.sessionId,
        firstTs: l.ts,
        lastTs: l.ts,
        count: 0,
        ua: l.ua,
        errors: 0
      }
    }
    const s = bySession[l.sessionId]
    s.lastTs = l.ts
    s.count++
    if (l.level === 'error' || l.level === 'err') s.errors++
  })
  const sessions = Object.values(bySession).sort((a, b) => b.lastTs.localeCompare(a.lastTs))
  res.json({ count: sessions.length, sessions })
})

// DELETE /api/china/logs — clear all
router.delete('/logs', (req, res) => {
  clearLogs()
  res.json({ ok: true })
})

module.exports = router
