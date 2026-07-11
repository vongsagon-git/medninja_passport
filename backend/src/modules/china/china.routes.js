const express = require('express')
const router = express.Router()
const { getPlayAuth, getStsToken, listVideos, getPlayInfo, listTemplateGroups, submitTranscode, getTemplateGroup, getTranscodeStatus } = require('./china.controller')
const { pushLog, getLogs, clearLogs, pushTestResult, getTestResults } = require('./china.logs')
const auth = require('../../shared/middleware/auth')
const chromeOnly = require('../../shared/middleware/chromeOnly')
const originCheck = require('../../shared/middleware/originCheck')

router.use(express.json({ limit: '512kb' }))

// ═══════════════════════════════════════════════════════════
// Sensitive endpoints (Ali STS + PlayAuth + PlayInfo)
// Guard chain: originCheck + chromeOnly + auth
// เพื่อให้ Ali ปลอดภัยเท่า Bunny (Bunny handles ทุกอย่าง built-in)
// ═══════════════════════════════════════════════════════════

// GET /api/china/playauth/:videoId — สำหรับ video ไม่มี DRM
router.get('/playauth/:videoId', originCheck, chromeOnly, auth, getPlayAuth)

// ⭐ Landing page playauth — public (no auth, no chrome guard) สำหรับหน้าขาย /china
// Whitelist เฉพาะ video ID ที่ตั้งไว้ (แสดง demo เท่านั้น)
const LANDING_ALLOWED_VIDEOS = new Set([
  '00bef48a7d1071f18224e6f6c55a0102' // Introduce.mov — DRM + Ali Prop dual encryption
])
router.get('/landing-playauth/:videoId', originCheck, (req, res, next) => {
  if (!LANDING_ALLOWED_VIDEOS.has(req.params.videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED', message: 'Video ID นี้ไม่อยู่ในรายการ landing demo' })
  }
  next()
}, getPlayAuth)

// ⭐ Test PlayAuth — return playAuth ตรง ๆ (frontend ตัดสิน encryptType เอง)
router.get('/test-playauth/:videoId', originCheck, async (req, res) => {
  const { videoId } = req.params
  if (!LANDING_ALLOWED_VIDEOS.has(videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED' })
  }

  try {
    const RPCClient = require('@alicloud/pop-core').RPCClient
    const client = new RPCClient({
      accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
      endpoint: `https://vod.${process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
      apiVersion: '2017-03-21'
    })
    const result = await client.request('GetVideoPlayAuth', {
      VideoId: videoId,
      AuthInfoTimeout: 3000
    }, { method: 'POST' })

    return res.json({
      playAuth: result.PlayAuth,
      videoMeta: result.VideoMeta,
      requestId: result.RequestId
    })
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN'
    })
  }
})

// GET /api/china/sts/:videoId — สำหรับ Widevine/FairPlay DRM video
router.get('/sts/:videoId', originCheck, chromeOnly, auth, getStsToken)

// GET /api/china/whoami — server-side IP + country detection
// ใช้ req.geo จาก geoMiddleware (ipinfo → geoip-lite)
// Note: Cloudflare header ถูกตัดออก 2026-07-10 เพราะ DO ไม่ inject ให้เรา
router.get('/whoami', (req, res) => {
  res.json({
    ip: req.geo?.ip || null,
    country: req.geo?.country || 'unknown',
    countryName: req.geo?.countryName || null,
    isChina: req.geo?.isChina || false,
    isThai: req.geo?.isThai || false,
    asn: req.geo?.asn || null,
    isp: req.geo?.isp || null,
    userAgent: req.headers['user-agent'] || '',
    detectedBy: req.geo?.detectedBy || 'unknown'
  })
})

// POST /api/china/log/test-result — บันทึกผล DRM test (device + browser + step results)
router.post('/log/test-result', (req, res) => {
  const body = req.body || {}
  const ip = req.geo?.ip || (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()
  const country = req.geo?.country || 'unknown'
  pushTestResult({
    sessionId: String(body.sessionId || 'unknown').substring(0, 32),
    buildVer: String(body.buildVer || '').substring(0, 40),
    status: String(body.status || 'unknown').substring(0, 20),
    device: body.device || null,
    stepStatus: body.stepStatus || null,
    details: body.details || null,
    ip,
    country,
    ua: (req.headers['user-agent'] || '').substring(0, 200)
  })
  res.json({ ok: true })
})

// GET /api/china/log/test-results — admin/AI ดูผลรวมทั้งหมด
router.get('/log/test-results', (req, res) => {
  const list = getTestResults({ sessionId: req.query.sessionId, status: req.query.status })
  if (req.query.format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const txt = list.map(r => {
      const dev = r.device || {}
      const steps = r.stepStatus || {}
      const passCount = Object.values(steps).filter(v => v === 'pass').length
      const failCount = Object.values(steps).filter(v => v === 'fail').length
      const totalSteps = Object.keys(steps).length
      return [
        `[${r.ts}] session=${(r.sessionId || '').substring(0, 8)} country=${r.country} ip=${r.ip}`,
        `  Device: ${dev.devType || '?'} · ${dev.os || '?'} · ${dev.browser || '?'} ${dev.browserVer || ''}`,
        `  Status: ${r.status} · steps: ${passCount}✅ / ${failCount}❌ / ${totalSteps}`,
        `  Build: ${r.buildVer}`,
        r.details && Object.keys(r.details).length ? `  Details: ${JSON.stringify(r.details)}` : null
      ].filter(Boolean).join('\n')
    }).join('\n\n')
    return res.send(txt || '(no test results yet)')
  }
  res.json({ count: list.length, results: list })
})

// GET /api/china/videos — list videos ใน Alibaba VOD account (สำหรับ AI debug)
router.get('/videos', listVideos)

// GET /api/china/playinfo/:videoId — get play URL + encryption status
router.get('/playinfo/:videoId', originCheck, chromeOnly, auth, getPlayInfo)

// GET /api/china/templates — list transcoding template groups
router.get('/templates', listTemplateGroups)

// GET /api/china/transcode?videoId=xxx&templateGroupId=xxx — trigger re-transcode
router.get('/transcode', submitTranscode)

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
