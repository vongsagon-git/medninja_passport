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
  '00bef48a7d1071f18224e6f6c55a0102', // Introduce.mov — DRM + Ali Prop dual encryption
  'c0e75fef7d3371f18224e6f6c55a0102', // B1 Microbiology 1.mov — DRM + Ali Prop dual encryption
  '60985cb97db271f1976fe7e7c7690102'  // Introduce (48s, 4K mov) — ORIGINAL สำหรับ /china landing (ไม่ encrypt, มี HD m3u8 backup Ali Private + DRM)
])
router.get('/landing-playauth/:videoId', originCheck, (req, res, next) => {
  if (!LANDING_ALLOWED_VIDEOS.has(req.params.videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED', message: 'Video ID นี้ไม่อยู่ในรายการ landing demo' })
  }
  next()
}, getPlayAuth)

// ⭐ Landing STS — public สำหรับ iOS/Safari (FairPlay DRM stream)
//   iOS ไม่รองรับ Ali Prop (AliyunVoDEncryption) → ต้องใช้ FairPlay + STS
router.get('/landing-sts/:videoId', originCheck, (req, res, next) => {
  if (!LANDING_ALLOWED_VIDEOS.has(req.params.videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED', message: 'Video ID นี้ไม่อยู่ในรายการ landing demo' })
  }
  next()
}, getStsToken)

// ⭐ Upload logs from mobile test client — เก็บใน memory 30 นาที
// ให้ dev fetch ดู log จาก /api/china/test-logs โดยตรง
const _testLogsCache = { latest: null, all: [] }
router.post('/test-logs-upload', express.json({ limit: '2mb' }), (req, res) => {
  const body = req.body || {}
  const entry = {
    ts: new Date().toISOString(),
    ip: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
    ua: (req.headers['user-agent'] || '').substring(0, 200),
    device: body.device || null,
    serveInfo: body.serveInfo || null,
    logs: body.logs || []
  }
  _testLogsCache.latest = entry
  _testLogsCache.all.push(entry)
  // เก็บล่าสุด 20 sessions
  if (_testLogsCache.all.length > 20) _testLogsCache.all.shift()
  console.log(`[test-logs-upload] session logged: ${entry.logs.length} lines from ${entry.ip} (${entry.ua.substring(0, 60)}...)`)
  return res.json({ ok: true, id: _testLogsCache.all.length - 1 })
})

// GET latest logs (สำหรับ dev)
router.get('/test-logs', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  if (req.query.format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const latest = _testLogsCache.latest
    if (!latest) return res.send('(ยังไม่มี test log)')
    let txt = `═══ Latest Test Log ═══\n`
    txt += `Uploaded: ${latest.ts}\n`
    txt += `IP: ${latest.ip}\n`
    txt += `UA: ${latest.ua}\n`
    if (latest.device) txt += `Device: ${JSON.stringify(latest.device)}\n`
    if (latest.serveInfo) txt += `Serve: ${JSON.stringify(latest.serveInfo)}\n`
    txt += `\n─── Logs (${latest.logs.length}) ───\n`
    latest.logs.forEach(l => {
      txt += `[${l.time || '?'}] [${l.type || 'info'}] ${l.msg || ''}\n`
    })
    return res.send(txt)
  }
  res.json({ latest: _testLogsCache.latest, sessionCount: _testLogsCache.all.length })
})

// ⭐ Deep diagnose — ยิงทุก endpoint Alibaba ที่เกี่ยวข้อง + fetch manifest จริง
// ดูว่า Alibaba throttle หรือ segment expire
router.get('/test-diagnose/:videoId', originCheck, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const { videoId } = req.params
  if (!LANDING_ALLOWED_VIDEOS.has(videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED' })
  }
  const results = []
  const traceId = 'diag-' + Date.now()

  try {
    const RPCClient = require('@alicloud/pop-core').RPCClient
    const client = new RPCClient({
      accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
      endpoint: `https://vod.${process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
      apiVersion: '2017-03-21'
    })

    // 1. GetVideoInfo
    let t = Date.now()
    try {
      const info = await client.request('GetVideoInfo', { VideoId: videoId }, { method: 'POST' })
      results.push({ step: 'GetVideoInfo', ok: true, ms: Date.now()-t, status: info.Video?.Status })
    } catch (e) {
      results.push({ step: 'GetVideoInfo', ok: false, ms: Date.now()-t, error: e.message, code: e.code })
    }

    // 2. GetPlayInfo
    t = Date.now()
    let playInfo
    try {
      playInfo = await client.request('GetPlayInfo', {
        VideoId: videoId,
        Formats: 'm3u8,mpd',
        StreamType: 'video',
        ResultType: 'Multiple',
        AuthTimeout: 3000
      }, { method: 'POST' })
      const streams = (playInfo.PlayInfoList?.PlayInfo || [])
      results.push({ step: 'GetPlayInfo', ok: true, ms: Date.now()-t, streamCount: streams.length,
        streams: streams.map(s => ({ format: s.Format, def: s.Definition, encType: s.EncryptType, urlHost: (s.PlayURL||'').match(/https?:\/\/[^/]+/)?.[0] }))
      })
    } catch (e) {
      results.push({ step: 'GetPlayInfo', ok: false, ms: Date.now()-t, error: e.message, code: e.code })
    }

    // 3. Fetch manifest URL จริง (backend → Alibaba CDN)
    if (playInfo?.PlayInfoList?.PlayInfo?.[0]?.PlayURL) {
      const manifestUrl = playInfo.PlayInfoList.PlayInfo[0].PlayURL
      t = Date.now()
      try {
        const r = await fetch(manifestUrl, { method: 'HEAD' })
        results.push({ step: 'FetchManifest', ok: r.ok, ms: Date.now()-t, httpStatus: r.status, url: manifestUrl.substring(0,120) })
      } catch (e) {
        results.push({ step: 'FetchManifest', ok: false, ms: Date.now()-t, error: e.message })
      }
    }

    return res.json({ traceId, ts: new Date().toISOString(), results })
  } catch (err) {
    return res.status(500).json({ traceId, error: err.message, results })
  }
})

// ⭐ Test video status — เช็คว่า video ยังพร้อมเล่นไหม (Normal/Transcoding/Failed)
router.get('/test-status/:videoId', originCheck, async (req, res) => {
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
    const info = await client.request('GetVideoInfo', { VideoId: videoId }, { method: 'POST' })
    const playInfo = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'mp4,m3u8,mpd',
      StreamType: 'video',
      ResultType: 'Multiple',
      AuthTimeout: 3000
    }, { method: 'POST' })

    const v = info.Video || {}
    const streams = (playInfo.PlayInfoList && playInfo.PlayInfoList.PlayInfo) || []
    return res.json({
      videoId: v.VideoId,
      title: v.Title,
      status: v.Status,
      duration: v.Duration,
      streamCount: streams.length,
      streams: streams.map(s => ({
        definition: s.Definition,
        format: s.Format,
        encrypt: s.Encrypt,
        encryptType: s.EncryptType,
        size: s.Size,
        bitrate: s.Bitrate,
        playUrlHost: (s.PlayURL || '').split('/').slice(0, 3).join('/'),
        urlExpireHint: (s.PlayURL || '').match(/Expires=\d+/)?.[0]
      }))
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, code: err.code })
  }
})

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

// ⭐ Test STS — return STS token สำหรับ Widevine DRM
router.get('/test-sts/:videoId', originCheck, async (req, res) => {
  const { videoId } = req.params
  if (!LANDING_ALLOWED_VIDEOS.has(videoId)) {
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED' })
  }

  const roleArn = process.env.ALIBABA_VOD_ROLE_ARN
  if (!roleArn) {
    return res.status(500).json({
      error: 'ALIBABA_VOD_ROLE_ARN not configured',
      hint: 'Create RAM role with AliyunVODReadOnlyAccess and set ARN in env'
    })
  }

  try {
    const RPCClient = require('@alicloud/pop-core').RPCClient
    const stsClient = new RPCClient({
      accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
      endpoint: 'https://sts.aliyuncs.com',
      apiVersion: '2015-04-01'
    })
    const result = await stsClient.request('AssumeRole', {
      RoleArn: roleArn,
      RoleSessionName: 'mn-test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      DurationSeconds: 3600
    }, { method: 'POST' })

    return res.json({
      accessKeyId: result.Credentials.AccessKeyId,
      accessKeySecret: result.Credentials.AccessKeySecret,
      securityToken: result.Credentials.SecurityToken,
      expiration: result.Credentials.Expiration,
      region: process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'
    })
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN'
    })
  }
})

// ⭐ Serve endpoint — backend เลือก mode ตาม User-Agent
// 1 video ID เดียว → serve ไฟล์ + auth ให้ตรง device
// - iOS → PlayAuth + encryptType 1 (Ali Prop stream)
// - อื่น ๆ → STS + encryptType 1 (Widevine stream, permissive mode)
// ⭐ Test PlayInfo proxy — backend เรียก Alibaba ให้ (บายพาส IP throttle)
// ตอบ playUrl ตรง ๆ → Aliplayer set video.src = playUrl ได้เลย ไม่ต้องเรียก Alibaba
router.get('/test-playinfo/:videoId', originCheck, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
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
    const result = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'm3u8,mpd',
      StreamType: 'video',
      ResultType: 'Multiple',
      AuthTimeout: 3600
    }, { method: 'POST' })

    const streams = (result.PlayInfoList?.PlayInfo || []).map(s => ({
      format: s.Format,
      definition: s.Definition,
      encryptType: s.EncryptType,
      bitrate: s.Bitrate,
      duration: s.Duration,
      size: s.Size,
      playUrl: s.PlayURL,
      streamType: s.StreamType
    }))
    return res.json({
      videoBase: result.VideoBase,
      streams,
      requestId: result.RequestId
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, code: err.code || 'UNKNOWN' })
  }
})

router.get('/test-serve/:videoId', originCheck, async (req, res) => {
  // ⭐ ห้าม cache ทุกระดับ (browser, DO, Cloudflare) — STS ต้องสด
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  const startTs = Date.now()
  const { videoId } = req.params
  const ua = req.headers['user-agent'] || ''
  const deviceHint = (req.headers['x-mn-device'] || '').toLowerCase()
  const isIOS = deviceHint === 'ios' || /iPad|iPhone|iPod/.test(ua)
  const mode = isIOS ? 'ali' : 'wv'
  const traceId = 'srv-' + startTs + '-' + Math.random().toString(36).substring(2, 6)

  console.log(`[${traceId}] test-serve START videoId=${videoId} mode=${mode} ua="${ua.substring(0, 80)}"`)

  if (!LANDING_ALLOWED_VIDEOS.has(videoId)) {
    console.log(`[${traceId}] REJECT video not whitelisted`)
    return res.status(403).json({ code: 'VIDEO_NOT_WHITELISTED' })
  }
  if (!process.env.ALIBABA_VOD_ROLE_ARN) {
    console.log(`[${traceId}] REJECT no role arn`)
    return res.status(500).json({ error: 'ALIBABA_VOD_ROLE_ARN not configured' })
  }

  try {
    const RPCClient = require('@alicloud/pop-core').RPCClient
    const stsClient = new RPCClient({
      accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
      endpoint: 'https://sts.aliyuncs.com',
      apiVersion: '2015-04-01'
    })

    const sessionName = 'mn-' + mode + '-' + startTs + '-' + Math.random().toString(36).substring(2, 8)
    console.log(`[${traceId}] AssumeRole session=${sessionName}`)

    const stsStart = Date.now()
    const result = await stsClient.request('AssumeRole', {
      RoleArn: process.env.ALIBABA_VOD_ROLE_ARN,
      RoleSessionName: sessionName,
      DurationSeconds: 3600
    }, { method: 'POST' })
    const stsMs = Date.now() - stsStart

    console.log(`[${traceId}] STS OK ${stsMs}ms accessKeyId=${result.Credentials.AccessKeyId.substring(0,10)}... expires=${result.Credentials.Expiration}`)

    const totalMs = Date.now() - startTs
    console.log(`[${traceId}] test-serve DONE totalMs=${totalMs}`)

    return res.json({
      mode,
      authType: 'sts',
      accessKeyId: result.Credentials.AccessKeyId,
      accessKeySecret: result.Credentials.AccessKeySecret,
      securityToken: result.Credentials.SecurityToken,
      region: process.env.ALIBABA_VOD_REGION || 'ap-southeast-1',
      encryptType: 1,
      deviceServed: isIOS ? 'iOS' : 'Chrome/Android/PC/Mac',
      reason: isIOS
        ? 'iOS → STS + encryptType 1 (Ali Prop stream)'
        : 'อื่น ๆ → STS + encryptType 1 (Widevine stream)',
      expiration: result.Credentials.Expiration,
      traceId,
      timingMs: { sts: stsMs, total: totalMs },
      uaSample: ua.substring(0, 120)
    })
  } catch (err) {
    console.error(`[${traceId}] ERROR ${err.code || 'UNKNOWN'}: ${err.message}`)
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN',
      traceId
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

// ═══════════════════════════════════════════════════════════
// PDF Lead — เก็บ lead จากหน้า /china (email/เบอร์) เพื่อส่ง PDF ทีหลัง
// ⭐ ยังไม่ integrate email service — เก็บใน memory + console log ก่อน
// ═══════════════════════════════════════════════════════════
const _pdfLeads = []
router.post('/pdf-lead', (req, res) => {
  const body = req.body || {}
  const name = String(body.name || '').trim().substring(0, 100)
  const email = String(body.email || '').trim().substring(0, 200)
  const phone = String(body.phone || '').trim().substring(0, 30)
  const wechat = String(body.wechat || '').trim().substring(0, 60)
  const note = String(body.note || '').trim().substring(0, 500)

  // ต้องมี email หรือ phone หรือ wechat อย่างน้อย 1 ช่อง
  if (!email && !phone && !wechat) {
    return res.status(400).json({ code: 'MISSING_CONTACT', message: 'กรุณากรอก email, เบอร์โทร หรือ WeChat ID อย่างน้อย 1 ช่อง' })
  }
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()
  const country = req.geo?.country || 'unknown'
  const entry = {
    ts: new Date().toISOString(),
    name, email, phone, wechat, note,
    ip, country,
    ua: (req.headers['user-agent'] || '').substring(0, 200)
  }
  _pdfLeads.push(entry)
  if (_pdfLeads.length > 500) _pdfLeads.shift()
  console.log(`[pdf-lead] ${country} ${ip} name="${name}" email="${email}" phone="${phone}" wechat="${wechat}"`)
  return res.json({ ok: true })
})

// GET admin ดู leads
router.get('/pdf-leads', (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  if (req.query.format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const txt = _pdfLeads.map(l =>
      `[${l.ts}] ${l.country} ${l.ip}\n  name: ${l.name}\n  email: ${l.email}\n  phone: ${l.phone}\n  wechat: ${l.wechat}\n  note: ${l.note}`
    ).join('\n\n')
    return res.send(txt || '(ยังไม่มี lead)')
  }
  res.json({ count: _pdfLeads.length, leads: _pdfLeads })
})

module.exports = router
