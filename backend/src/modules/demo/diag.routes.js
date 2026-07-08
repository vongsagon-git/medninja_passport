const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const { getDemoEmbedUrl, bunnyConfig } = require('../../shared/config/bunny')

const ADMIN_UIDS = [
  'U2b0de81f0ec73e8561197393683a9e95', // เติ้ล
  'Ue6b6c4daf46d1765f1af71b292fe6fc9', // chertam
  'U398ec17f9dbf5917c2fd83bec6fe24ef'  // ฝน
]

/**
 * POST /api/diag
 * รับผล diagnostic จาก frontend แล้วส่ง LINE ให้ admin
 */
router.post('/', async (req, res) => {
  try {
    const { userAgent, os, browser, screenSize, dpr, videoTest, timestamp, userName, userEmail, httpStatus, hasToken: clientHasToken, cdn, api, adBlock, netType, downlink, diagSteps, videoTitle, sectionName, sectionCode } = req.body

    // ดึง IP + ประเทศ
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown'
    let country = '?', city = '?', isp = '?'
    try {
      const geo = await fetch(`http://ip-api.com/json/${clientIp}?fields=country,city,isp,query`)
      if (geo.ok) {
        const g = await geo.json()
        country = g.country || '?'; city = g.city || '?'; isp = g.isp || '?'
      }
    } catch {}

    // ส่ง LINE notification
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) {
      console.warn('[Diag] LINE_CHANNEL_ACCESS_TOKEN not set')
      return res.json({ ok: true, line: 'no token' })
    }

    const statusIcon = videoTest === 'pass' ? '✅' : videoTest === 'fail' ? '❌' : '⚠️'

    // สร้าง step rows จาก diagSteps (ถ้ามี)
    const stepIcon = { ok: '✅', no: '❌', info: '⚠️', run: '🔄', wait: '⏳' }
    const stepColor = { ok: '#059669', no: '#dc2626', info: '#f59e0b' }
    const stepRows = []
    if (Array.isArray(diagSteps)) {
      diagSteps.forEach(st => {
        const icon = stepIcon[st.status] || '❓'
        const color = stepColor[st.status] || '#94a3b8'
        stepRows.push(
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: `${icon} ${st.title || '?'}`, size: 'xxs', color, flex: 4, wrap: true },
            { type: 'text', text: `${st.detail || ''}`, size: 'xxs', color: '#94a3b8', flex: 5, wrap: true }
          ]}
        )
      })
    }

    const message = {
      type: 'flex',
      altText: `${statusIcon} ${userName || '?'} — ${videoTitle || 'Diag'} — ${videoTest}`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box', layout: 'vertical', backgroundColor: videoTest === 'pass' ? '#1e293b' : '#dc2626', paddingAll: '14px',
            contents: [
              { type: 'text', text: `${statusIcon} ${userName || 'ไม่ทราบ'}`, color: '#FFFFFF', size: 'sm', weight: 'bold' },
              ...(videoTitle ? [{ type: 'text', text: `📺 ${videoTitle}`, color: '#a78bfa', size: 'xs', weight: 'bold', margin: 'sm', wrap: true }] : []),
              ...(sectionName ? [{ type: 'text', text: `${sectionCode || ''} ${sectionName}`, color: '#94a3b8', size: 'xxs' }] : []),
              { type: 'text', text: videoTest === 'pass' ? 'ระบบปกติ — ดูได้' : 'พบปัญหา', color: videoTest === 'pass' ? '#4ade80' : '#FFFFFFCC', size: 'xxs', margin: 'sm' }
            ]
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', backgroundColor: '#0f172a',
            contents: [
              // ข้อมูลนักเรียน
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'Device', size: 'xs', color: '#64748b', flex: 3 },
                { type: 'text', text: `${browser || '?'} · ${os || '?'}`, size: 'xs', color: '#cbd5e1', flex: 5 }
              ]},
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'IP', size: 'xs', color: '#64748b', flex: 3 },
                { type: 'text', text: `${clientIp} · ${city}, ${country}`, size: 'xxs', color: '#94a3b8', flex: 5, wrap: true }
              ]},
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'ISP', size: 'xs', color: '#64748b', flex: 3 },
                { type: 'text', text: `${isp}`, size: 'xxs', color: '#94a3b8', flex: 5, wrap: true }
              ]},
              { type: 'separator', color: '#334155', margin: 'md' },
              // Diagnostic steps ทุกข้อ
              ...stepRows,
              { type: 'separator', color: '#334155', margin: 'md' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'เวลา', size: 'xxs', color: '#64748b', flex: 3 },
                { type: 'text', text: timestamp || new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#64748b', flex: 5 }
              ]}
            ]
          }
        }
      }

    const results = await Promise.allSettled(
      ADMIN_UIDS.map(uid =>
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ to: uid, messages: [message] })
        }).then(async r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`)
        })
      )
    )
    const lineOk = results.some(r => r.status === 'fulfilled')
    const lineErrors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message)
    if (lineErrors.length) console.error('[Diag LINE]', lineErrors)

    res.json({ ok: true, line: lineOk ? 'sent' : 'failed', lineErrors })
  } catch (error) {
    res.json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/diag/doctor
 * จำลอง flow เดียวกับ WatchPage เป๊ะ ทุกบรรทัด พร้อม raw data ทุก byte
 * ใช้ demo video (คอร์สฟรี) เพื่อไม่กระทบคอร์สจริง
 */
router.post('/doctor', auth, async (req, res) => {
  const crypto = require('crypto')
  const DemoConfig = require('./DemoConfig.model')
  const { validateSession } = require('../auth/session.service')

  const journey = [] // ทุก step ของ journey
  const t0 = Date.now()

  // helper: เพิ่ม step พร้อม raw data
  const step = (id, phase, title, ok, detail, raw) => {
    journey.push({ id, phase, title, ok, detail, raw: raw || null, ts: Date.now() - t0 })
  }

  // helper: fetch + จับทุก byte
  async function tracedFetch(url, opts = {}) {
    const t = Date.now()
    try {
      const r = await fetch(url, opts)
      const body = await r.text()
      return {
        ok: true,
        status: r.status,
        headers: Object.fromEntries(r.headers.entries()),
        bodyLength: body.length,
        bodyPreview: body.slice(0, 500),
        ms: Date.now() - t,
        requestUrl: url,
        requestHeaders: opts.headers || {}
      }
    } catch (e) {
      return { ok: false, status: 0, error: e.message, ms: Date.now() - t, requestUrl: url, requestHeaders: opts.headers || {} }
    }
  }

  // ════════════════════════════════════════════════════════════
  // PHASE 1: นักเรียนเปิด /my/watch/{sectionId}/{videoIndex}
  // ════════════════════════════════════════════════════════════
  step('1.1', 'ROUTER', 'Vue Router รับ URL', true,
    'URL: /my/watch/{sectionId}/{videoIndex} → match route "WatchPage"',
    { route: '/my/watch/:sectionId/:videoIndex', component: 'WatchPage.vue', meta: { requiresAuth: true, immersive: true } })

  step('1.2', 'ROUTER', 'Router Guard: requiresAuth', true,
    'มี token ใน localStorage → ผ่าน',
    { check: 'authStore.isLoggedIn', result: true })

  step('1.3', 'ROUTER', 'WatchPage mounted() → loadVideo()', true,
    'เรียก fetchSection() + fetchVideo() พร้อมกัน', null)

  // ════════════════════════════════════════════════════════════
  // PHASE 1.5: Request headers จาก browser นักเรียน
  // ════════════════════════════════════════════════════════════
  const clientReferer = req.headers.referer || req.headers.referrer || '(ไม่ส่ง!)'
  const clientOrigin = req.headers.origin || '(ไม่ส่ง)'
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '?'
  step('1.5', 'HEADERS', 'Headers ที่ browser นักเรียนส่งมาจริง', !!req.headers.referer,
    `Referer: ${clientReferer} | Origin: ${clientOrigin} | IP: ${clientIP}`,
    {
      referer: clientReferer,
      origin: clientOrigin,
      ip: clientIP,
      userAgent: req.headers['user-agent'] || '?',
      host: req.headers.host || '?',
      acceptLanguage: req.headers['accept-language'] || '?',
      allHeaders: Object.fromEntries(
        Object.entries(req.headers).filter(([k]) => !['authorization', 'cookie'].includes(k))
      )
    })

  // ════════════════════════════════════════════════════════════
  // PHASE 2: Frontend → Backend API (auth middleware)
  // ════════════════════════════════════════════════════════════
  step('2.1', 'AUTH', 'ส่ง Authorization: Bearer {JWT}', true,
    `Header ที่ส่ง: Authorization: Bearer ${req.headers.authorization?.slice(0, 20)}...`,
    { header: 'Authorization: Bearer ***', tokenLength: req.headers.authorization?.length || 0 })

  step('2.2', 'AUTH', 'jwt.verify(token, JWT_SECRET)', true,
    `decode สำเร็จ → userId: ${req.user._id}`,
    { decoded: { id: req.user._id, email: req.user.email, role: req.user.role, sid: req.sessionId || null } })

  step('2.3', 'AUTH', 'User.findById() → หา user ใน DB', true,
    `พบ: ${req.user.firstName || ''} ${req.user.lastName || ''} (${req.user.email}) role=${req.user.role}`,
    { user: { _id: req.user._id, email: req.user.email, firstName: req.user.firstName, lastName: req.user.lastName, role: req.user.role } })

  // Valkey session
  if (req.sessionId) {
    const t = Date.now()
    try {
      const valid = await validateSession(req.user._id.toString(), req.sessionId)
      step('2.4', 'AUTH', 'validateSession() → Valkey', valid,
        valid ? `session valid (${Date.now()-t}ms)` : `INVALID — ถูก kick! (${Date.now()-t}ms)`,
        { sessionId: req.sessionId, valid, ms: Date.now()-t })
    } catch (e) {
      step('2.4', 'AUTH', 'validateSession() → Valkey', true,
        `Valkey error แต่ allow (${Date.now()-t}ms): ${e.message}`,
        { error: e.message, ms: Date.now()-t })
    }
  } else {
    step('2.4', 'AUTH', 'validateSession() → Valkey', true, 'ไม่มี sid ใน token (skip Valkey)', null)
  }

  // ════════════════════════════════════════════════════════════
  // PHASE 3: Backend getVideo() — DB queries (ใช้ demo video)
  // ════════════════════════════════════════════════════════════
  let t = Date.now()
  let config
  try {
    config = await DemoConfig.findOne({ key: 'demo' }).lean()
    step('3.1', 'DB', 'DemoConfig.findOne({ key: "demo" })', !!config,
      config ? `พบ config — ${config.videos?.length} videos (${Date.now()-t}ms)` : `NOT FOUND (${Date.now()-t}ms)`,
      { found: !!config, sectionName: config?.sectionName, videoCount: config?.videos?.length, videos: config?.videos?.map(v => ({ title: v.title, bunnyVideoId: v.bunnyVideoId })), ms: Date.now()-t })
  } catch (e) {
    step('3.1', 'DB', 'DemoConfig.findOne()', false, e.message, { error: e.message, ms: Date.now()-t })
    return res.json({ journey, totalMs: Date.now()-t0 })
  }
  if (!config?.videos?.length) {
    step('3.2', 'DB', 'Demo videos exist?', false, 'ไม่มี demo video', null)
    return res.json({ journey, totalMs: Date.now()-t0 })
  }

  const sorted = [...config.videos].sort((a, b) => (a.order||0) - (b.order||0))
  const video = sorted[0]

  step('3.2', 'DB', 'เลือก video[0] จาก demo', true,
    `"${video.title}" — bunnyVideoId: ${video.bunnyVideoId}`,
    { video: { title: video.title, bunnyVideoId: video.bunnyVideoId, duration: video.duration, order: video.order } })

  // ════════════════════════════════════════════════════════════
  // PHASE 4: Backend สร้าง signed embed URL
  // ════════════════════════════════════════════════════════════
  const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID || ''
  const demoSecKey = process.env.BUNNY_DEMO_SECURITY_KEY || ''

  step('4.1', 'ENV', 'อ่าน BUNNY_DEMO_LIBRARY_ID', !!demoLibId,
    demoLibId || 'ไม่ได้ตั้ง!',
    { BUNNY_DEMO_LIBRARY_ID: demoLibId || '(empty)', BUNNY_DEMO_SECURITY_KEY: demoSecKey ? `${demoSecKey.slice(0,4)}...${demoSecKey.slice(-4)}` : '(empty)', BUNNY_DEMO_API_KEY: process.env.BUNNY_DEMO_API_KEY ? 'set' : '(empty)' })

  step('4.2', 'ENV', 'อ่าน BUNNY_DEMO_SECURITY_KEY', !!demoSecKey,
    demoSecKey ? `มี (${demoSecKey.length} chars)` : 'ไม่ได้ตั้ง! → unsigned URL → 403', null)

  const expires = Math.floor(Date.now() / 1000) + 7200
  const hashInput = demoSecKey + video.bunnyVideoId + String(expires)
  const token = demoSecKey ? crypto.createHash('sha256').update(hashInput).digest('hex') : ''

  step('4.3', 'TOKEN', 'SHA256(secKey + videoId + expires)', !!token,
    token ? `${token.slice(0,16)}...` : 'ไม่มี token',
    { formula: 'SHA256(BUNNY_DEMO_SECURITY_KEY + bunnyVideoId + expires)', videoId: video.bunnyVideoId, expires, expiresDate: new Date(expires*1000).toISOString(), tokenPreview: token.slice(0,32) || '(none)' })

  const embedUrl = demoSecKey && demoLibId
    ? `https://player.mediadelivery.net/embed/${demoLibId}/${video.bunnyVideoId}?token=${token}&expires=${expires}&_t=${Date.now()}`
    : demoLibId ? `https://player.mediadelivery.net/embed/${demoLibId}/${video.bunnyVideoId}` : ''

  step('4.4', 'URL', 'สร้าง embed URL สำเร็จ', !!embedUrl,
    embedUrl ? `lib=${demoLibId} token=${token?'YES':'NO'} expires=${expires}` : 'FAIL',
    { embedUrl: embedUrl.replace(/token=[^&]+/, 'token=***') })

  if (!embedUrl) return res.json({ journey, totalMs: Date.now()-t0 })

  step('5.1', 'RESPONSE', 'Backend ส่ง { video: { embedUrl } } กลับ frontend', true,
    'frontend ได้ embedUrl → ใส่ iframe', null)

  step('5.2', 'IFRAME', '<iframe :src="embedUrl"> → browser โหลด URL นี้', true,
    `Browser ส่ง GET ไป player.mediadelivery.net + Referer: https://medninja.academy/`, null)

  // ════════════════════════════════════════════════════════════
  // PHASE 6: Server จำลอง Browser → CDN (4 test)
  // ════════════════════════════════════════════════════════════
  const tests = [
    { id: '6.1', title: 'CDN: Signed URL + Referer ถูก (เหมือน browser จริง)', url: embedUrl, headers: { 'Referer': 'https://medninja.academy/', 'Origin': 'https://medninja.academy' } },
    { id: '6.2', title: 'CDN: Signed URL + ไม่มี Referer (test Hotlink)', url: embedUrl, headers: {} },
    { id: '6.3', title: 'CDN: Signed URL + Referer ผิด (test Domain Lock)', url: embedUrl, headers: { 'Referer': 'https://evil.com/' } },
    { id: '6.4', title: 'CDN: Unsigned URL (test Token Auth)', url: embedUrl.replace(/\?.*$/, ''), headers: { 'Referer': 'https://medninja.academy/' } },
  ]

  for (const test of tests) {
    const r = await tracedFetch(test.url, { headers: test.headers })
    const expectMap = { '6.1': r.status === 200, '6.2': true, '6.3': r.status === 403, '6.4': r.status === 403 }
    step(test.id, 'CDN', test.title, expectMap[test.id] ?? (r.status === 200),
      r.ok !== false ? `HTTP ${r.status} (${r.ms}ms, ${r.bodyLength} bytes)` : `ERROR: ${r.error} (${r.ms}ms)`,
      { request: { method: 'GET', url: r.requestUrl.replace(/token=[^&]+/, 'token=***'), headers: r.requestHeaders },
        response: { status: r.status, ms: r.ms, headers: r.headers || {}, bodyLength: r.bodyLength, bodyPreview: r.bodyPreview } })
  }

  // ════════════════════════════════════════════════════════════
  // PHASE 7: Bunny API — video มีจริงไหม
  // ════════════════════════════════════════════════════════════
  const apiKey = process.env.BUNNY_DEMO_API_KEY || process.env.BUNNY_API_KEY
  if (apiKey) {
    const libId = demoLibId || '628424'
    const apiUrl = `https://video.bunnycdn.com/library/${libId}/videos/${video.bunnyVideoId}`
    t = Date.now()
    try {
      const r = await fetch(apiUrl, { headers: { 'AccessKey': apiKey } })
      const body = await r.json()
      step('7.1', 'API', `Bunny API: video มีใน library ${libId}?`, r.ok,
        r.ok ? `"${body.title}" status=${body.status === 4 ? 'ready' : body.status} ${body.length}s (${Date.now()-t}ms)` : `HTTP ${r.status}`,
        { request: { url: apiUrl }, response: { status: r.status, ms: Date.now()-t, body: r.ok ? { guid: body.guid, title: body.title, status: body.status, length: body.length, width: body.width, height: body.height } : body } })
    } catch (e) {
      step('7.1', 'API', 'Bunny API', false, e.message, { error: e.message })
    }
  }

  // ════════════════════════════════════════════════════════════
  // Save result + return
  // ════════════════════════════════════════════════════════════
  const DoctorResult = require('./DoctorResult.model')
  const resultId = crypto.randomUUID()
  // เก็บลง MongoDB (auto-delete 24 ชม. ด้วย TTL index)
  try {
    await DoctorResult.create({
      resultId,
      journey,
      embedUrl,
      videoTitle: video.title,
      userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      userEmail: req.user.email,
      userAgent: req.headers['user-agent'],
      totalMs: Date.now()-t0
    })
  } catch (e) { console.error('[doctor] save error:', e.message) }

  res.json({ journey, embedUrl, videoTitle: video.title, resultId, totalMs: Date.now()-t0 })
})

/**
 * POST /api/diag/doctor-line
 * ส่ง Flex LINE ให้เติ้ล มีปุ่ม "ดูรายละเอียด" เปิด URL + plain text ต่อ
 */
// ⚠️ ห้าม require auth — ต้องส่ง flex ได้แม้ token หาย/expired (จะได้รู้ว่ามีนักเรียนเปิดไม่ได้)
router.post('/doctor-line', async (req, res) => {
  const {
    plainText, userName, userEmail, failCount, resultId,
    videoTitle, sectionName, sectionCode, page, url,
    clientReferer, clientHost, clientOS, clientBrowser,
    browserBlocked, browserBlockReason,
    // ⭐ new: player + device precision (iPad detection) + bucket
    player = 'bunny',         // 'ali' | 'bunny'
    watchUrl = '',            // URL ที่ user กดปุ่มมา (referrer)
    deviceType = '',          // 'iPhone' | 'iPad' | 'Android' | 'Mac' | 'Windows' | 'Linux'
    bucket = '',              // ⭐ CDN bucket ที่ serve จริง (Ali region / Bunny library ID)
    videoId = '',             // Alibaba videoId or Bunny GUID
    routingReason = ''        // ⭐ เหตุผลที่ route ไป bucket นี้ ("country=CN" / "iOS→NoDRM" / etc)
  } = req.body
  // IP จาก request headers (server-side)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '?'
  const clientCountry = req.headers['cf-ipcountry'] || ''  // Cloudflare
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return res.json({ ok: false, reason: 'no LINE token' })

  // ดึง LINE info — best-effort (decode JWT ถ้ามี ไม่ fail ถ้าไม่มี)
  let lineDisplayName = ''
  let linePictureUrl = ''
  let resolvedUserName = userName
  let resolvedUserEmail = userEmail
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
      const User = require('../user/User.model')
      const u = await User.findById(decoded.id).select('lineDisplayName linePictureUrl firstName lastName name email').lean()
      if (u) {
        lineDisplayName = u.lineDisplayName || ''
        linePictureUrl = u.linePictureUrl || ''
        if (!resolvedUserName) resolvedUserName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || '')
        if (!resolvedUserEmail) resolvedUserEmail = u.email || ''
      }
    }
  } catch { /* token expired/invalid — ส่ง flex ต่อไปได้ ใช้ค่าจาก body */ }

  const baseUrl = process.env.FRONTEND_URL || 'https://medninja.academy'
  const resultUrl = `${baseUrl}/doctor-result/${resultId}`

  // สีตาม status (browser block = ส้ม ไม่ใช่แดง — ไม่ใช่ bug)
  const isBlocked = !!browserBlocked
  const isFail = failCount > 0
  const isAli = player === 'ali'
  // ⭐ Player color: Ali = แดง (China), Bunny = ฟ้า
  const playerColor = isAli ? '#dc2626' : '#0ea5e9'
  const playerLabel = isAli ? 'Alibaba VOD' : 'Bunny CDN'
  const playerEmoji = isAli ? '🇨🇳' : '🌍'
  const headerColor = isBlocked ? '#f97316' : (isFail ? '#dc2626' : playerColor)
  const statusText = isBlocked
    ? `ปิดกั้น Browser`
    : (isFail ? `พบปัญหา ${failCount} จุด` : `ระบบปกติ`)
  const statusIcon = isBlocked ? '⚠️' : (isFail ? '❌' : '✅')
  const statusBg = isBlocked ? '#fff7ed' : (isFail ? '#fef2f2' : '#f0fdf4')
  const statusFg = isBlocked ? '#c2410c' : (isFail ? '#991b1b' : '#166534')

  // ⭐ Device precision — ใช้ deviceType ถ้า frontend ส่งมา ไม่งั้น fallback UA
  const ua = req.headers['user-agent'] || ''
  let precisionDevice = deviceType
  if (!precisionDevice) {
    if (/iPhone|iPod/.test(ua)) precisionDevice = 'iPhone'
    else if (/iPad/.test(ua)) precisionDevice = 'iPad'
    else if (/Android/.test(ua)) precisionDevice = 'Android'
    else if (/Windows/.test(ua)) precisionDevice = 'Windows'
    else if (/Macintosh|Mac OS X/.test(ua)) precisionDevice = 'Mac'  // อาจเป็น iPad ปลอม UA — frontend ควรส่ง deviceType
    else precisionDevice = clientOS || 'Unknown'
  }
  // Device emoji
  const devEmoji = precisionDevice === 'iPhone' ? '📱' :
                   precisionDevice === 'iPad' ? '📱' :
                   precisionDevice === 'Android' ? '🤖' :
                   precisionDevice === 'Mac' ? '🍎' :
                   precisionDevice === 'Windows' ? '🪟' : '💻'

  // helper row — เหลี่ยม ไม่โค้ง
  const row = (label, value, valueColor = '#0f172a', size = 'sm') => ({
    type: 'box', layout: 'horizontal', spacing: 'md', contents: [
      { type: 'text', text: label, size: 'xs', color: '#94a3b8', flex: 3 },
      { type: 'text', text: value || '-', size, weight: 'bold', flex: 7, wrap: true, color: valueColor }
    ]
  })

  // Header: avatar + ชื่อ LINE + Player badge
  const headerContents = [
    { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
      ...(linePictureUrl ? [{
        type: 'image', url: linePictureUrl, size: '48px', aspectMode: 'cover', aspectRatio: '1:1',
        flex: 0, action: { type: 'uri', uri: resultUrl }
      }] : []),
      { type: 'box', layout: 'vertical', flex: 1, contents: [
        { type: 'text', text: lineDisplayName || resolvedUserName || 'นักเรียน', color: '#FFFFFF', size: 'md', weight: 'bold', wrap: true },
        { type: 'text', text: `Doctor Diagnostic`, color: '#FFFFFFCC', size: 'xxs', margin: 'xs' }
      ]}
    ]}
  ]

  // Flex Message — เหลี่ยม (cornerRadius: '0px' ทุกจุด) + Player badge + Device precision
  const flex = {
    type: 'flex',
    altText: `${statusIcon} ${lineDisplayName || resolvedUserName || 'นักเรียน'} · ${playerLabel} · ${precisionDevice}`,
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: headerColor, paddingAll: '16px',
        contents: headerContents
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px',
        contents: [
          // ⭐ Player + Bucket + Reason (เหลี่ยม เด่นชัด)
          // Bucket ชื่อย่อ (Ali: sg/cn/tk / Bunny: library ID สั้น)
          { type: 'box', layout: 'vertical', backgroundColor: playerColor, paddingAll: '10px', spacing: 'xs',
            contents: [
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: playerEmoji, size: 'md', flex: 0, color: '#FFFFFF' },
                { type: 'text', text: playerLabel, size: 'sm', weight: 'bold', color: '#FFFFFF', flex: 1, margin: 'md' },
                ...(bucket ? [{ type: 'text', text: bucket, size: 'xxs', color: '#FFFFFFCC', align: 'end', gravity: 'center' }] : [])
              ]},
              ...(routingReason ? [{
                type: 'text', text: `เนื่องด้วย: ${routingReason}`, size: 'xxs', color: '#FFFFFFCC', wrap: true
              }] : [])
            ]
          },
          // Status banner (เหลี่ยม)
          { type: 'box', layout: 'horizontal', backgroundColor: statusBg, paddingAll: '10px',
            contents: [
              { type: 'text', text: statusIcon, size: 'md', flex: 0 },
              { type: 'text', text: statusText, size: 'sm', weight: 'bold', color: statusFg, flex: 1, margin: 'md' }
            ]
          },
          ...(isBlocked && browserBlockReason ? [{
            type: 'text', text: browserBlockReason, size: 'xxs', color: statusFg, wrap: true
          }] : []),
          // Device precision box (เน้น iPad detection)
          { type: 'box', layout: 'horizontal', backgroundColor: '#f8fafc', paddingAll: '10px',
            contents: [
              { type: 'text', text: devEmoji, size: 'md', flex: 0 },
              { type: 'box', layout: 'vertical', flex: 1, margin: 'md', contents: [
                { type: 'text', text: precisionDevice, size: 'sm', weight: 'bold', color: '#0f172a' },
                { type: 'text', text: `${clientBrowser || '?'} · ${clientOS || '?'}`, size: 'xxs', color: '#64748b', margin: 'xs' }
              ]}
            ]
          },
          // Details (rows)
          { type: 'separator', color: '#e2e8f0', margin: 'sm' },
          row('นักเรียน', userName),
          { type: 'separator', color: '#f1f5f9' },
          row('อีเมล', userEmail, '#0f172a', 'xs'),
          ...(videoTitle && videoTitle !== 'Demo' ? [
            { type: 'separator', color: '#f1f5f9' },
            row('Video', videoTitle, '#0f172a', 'xs')
          ] : []),
          ...(sectionCode || sectionName ? [
            { type: 'separator', color: '#f1f5f9' },
            row('Section', `${sectionCode || ''} ${sectionName || ''}`.trim(), '#0f172a', 'xs')
          ] : []),
          ...(watchUrl ? [
            { type: 'separator', color: '#f1f5f9' },
            row('URL', watchUrl.replace(/^https?:\/\/[^/]+/, ''), '#0369a1', 'xs')
          ] : []),
          { type: 'separator', color: '#f1f5f9' },
          row('IP', `${clientIp}${clientCountry ? ' · ' + clientCountry : ''}`, '#475569', 'xs'),
          { type: 'separator', color: '#f1f5f9' },
          row('Host', clientHost || '?', clientHost?.includes('www.') ? '#ef4444' : '#10b981', 'xs'),
          { type: 'separator', color: '#f1f5f9' },
          row('เวลา', new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), '#94a3b8', 'xxs')
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px',
        contents: [
          { type: 'button', action: { type: 'uri', label: 'ดูรายละเอียดทุก byte', uri: resultUrl }, style: 'primary', color: playerColor, height: 'sm' }
        ]
      },
      styles: {
        header: { separator: false },
        body: { separator: false },
        footer: { separator: false }
      }
    }
  }

  // ส่งแค่ Flex (เฉพาะเติ้ลคนเดียว)
  const TITLE_UID = 'U2b0de81f0ec73e8561197393683a9e95'
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: TITLE_UID, messages: [flex] })
    })
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: false, error: e.message })
  }
})

// doctor-result route ย้ายไปที่ app.js (ก่อน SPA catch-all)

/**
 * GET /api/diag/test-video
 * Return signed embed URL สำหรับทดสอบ
 */
router.get('/test-video', auth, async (req, res) => {
  const testVideoId = 'ef8f4e09-0d4b-498e-86fc-e65f74510e1d'
  const noToken = req.query.notoken === '1'
  const libId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'

  let embedUrl
  if (noToken) {
    embedUrl = `https://player.mediadelivery.net/embed/${libId}/${testVideoId}`
  } else {
    embedUrl = getDemoEmbedUrl(testVideoId)
  }

  // Server-side fetch เช็คว่า embed URL ใช้ได้ไหม
  let httpStatus = 0
  try {
    const resp = await fetch(embedUrl, {
      headers: { 'Referer': 'https://medninja.academy/', 'Origin': 'https://medninja.academy' }
    })
    httpStatus = resp.status
  } catch { httpStatus = 0 }

  res.json({ embedUrl, noToken: !!noToken, httpStatus })
})

/**
 * GET /api/diag/check-403
 * เช็คละเอียดว่า 403 เกิดจากอะไร — ทดสอบทุกเคส
 */
router.get('/check-403', auth, async (req, res) => {
  const testVideoId = 'ef8f4e09-0d4b-498e-86fc-e65f74510e1d'
  const libId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'
  const signedUrl = getDemoEmbedUrl(testVideoId)
  const unsignedUrl = `https://player.mediadelivery.net/embed/${libId}/${testVideoId}`
  const fakeVideoUrl = `https://player.mediadelivery.net/embed/${libId}/00000000-0000-0000-0000-000000000000`
  const correctReferer = 'https://medninja.academy/'
  const wrongReferer = 'https://evil-site.com/'

  const checks = {}

  // Helper: fetch + return status
  async function probe(url, headers = {}) {
    try {
      const r = await fetch(url, { headers, redirect: 'follow' })
      return r.status
    } catch { return 0 }
  }

  // 1) Signed URL + Referer ที่ถูกต้อง (ควรได้ 200)
  checks.signedWithReferer = await probe(signedUrl, {
    'Referer': correctReferer, 'Origin': 'https://medninja.academy'
  })

  // 2) Signed URL + ไม่มี Referer (ถ้า 403 = Referer protection เปิดอยู่)
  checks.signedNoReferer = await probe(signedUrl)

  // 3) Signed URL + Referer ผิด (ถ้า 403 = Hotlink protection block domain อื่น)
  checks.signedWrongReferer = await probe(signedUrl, {
    'Referer': wrongReferer, 'Origin': 'https://evil-site.com'
  })

  // 4) ไม่มี Token + Referer ถูก (ถ้า 403 = Token auth ทำงาน, ถ้า 200 = Token auth ปิด)
  checks.unsignedWithReferer = await probe(unsignedUrl, {
    'Referer': correctReferer, 'Origin': 'https://medninja.academy'
  })

  // 5) Video ID ที่ไม่มีอยู่จริง (ถ้า 403 = ดูเหมือน video not found ก็คืน 403)
  checks.fakeVideoId = await probe(fakeVideoUrl, {
    'Referer': correctReferer, 'Origin': 'https://medninja.academy'
  })

  // 6) เช็คว่า video มีอยู่จริงใน Bunny API
  let videoExists = false
  try {
    const apiKey = process.env.BUNNY_DEMO_API_KEY || process.env.BUNNY_API_KEY
    if (apiKey) {
      const r = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${testVideoId}`, {
        headers: { 'AccessKey': apiKey }
      })
      videoExists = r.ok
      checks.bunnyApiStatus = r.status
    } else {
      checks.bunnyApiStatus = 'no-key'
    }
  } catch { checks.bunnyApiStatus = 0 }
  checks.videoExists = videoExists

  // วิเคราะห์สาเหตุ
  const diagnosis = []

  if (checks.signedWithReferer === 200) {
    diagnosis.push('ปกติ — Signed URL + Referer ถูกต้อง ได้ 200')
  } else if (checks.signedWithReferer === 403) {
    // 403 แม้ signed + referer ถูก
    if (!videoExists) {
      diagnosis.push('Video ID ไม่มีอยู่ใน library หรือถูกลบ')
    }
    if (checks.signedNoReferer === 200) {
      diagnosis.push('Referer protection: server ส่ง Referer ไม่ตรง domain ที่ตั้งไว้')
    }
    if (checks.signedNoReferer === 403 && checks.signedWrongReferer === 403) {
      diagnosis.push('Token อาจหมดอายุ หรือ Security Key ไม่ตรง')
    }
  }

  if (checks.unsignedWithReferer === 200) {
    diagnosis.push('Token Auth ปิดอยู่ — ใครก็เข้าได้โดยไม่ต้อง sign')
  } else if (checks.unsignedWithReferer === 403) {
    diagnosis.push('Token Auth เปิดอยู่ (ดี) — ต้อง sign URL')
  }

  if (checks.signedNoReferer === 403 && checks.signedWithReferer === 200) {
    diagnosis.push('Hotlink Protection เปิดอยู่ — ต้องส่ง Referer medninja.academy')
  }

  if (checks.signedWrongReferer === 403 && checks.signedWithReferer === 200) {
    diagnosis.push('Domain อื่นถูก block — Hotlink Protection ทำงานปกติ')
  }

  if (diagnosis.length === 0) {
    diagnosis.push('ไม่สามารถระบุสาเหตุได้ — ลองเช็ค Bunny Dashboard')
  }

  res.json({ checks, diagnosis, testVideoId, libId })
})

/**
 * POST /api/diag/video-error
 * นักเรียนเจอ video error → ส่ง LINE แจ้งเติ้ลอัตโนมัติ
 */
router.post('/video-error', async (req, res) => {
  try {
    const { error, videoTitle, sectionName, userName, userEmail, os, browser, userAgent, raw } = req.body

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) return res.json({ ok: false, reason: 'no LINE token' })

    // ── สรุป raw error สำหรับ LINE (ถ้ามี) ──
    const rawSummary = []
    if (raw && typeof raw === 'object') {
      if (raw.code != null) rawSummary.push(`code=${raw.code}`)
      if (raw.name) rawSummary.push(`name=${raw.name}`)
      if (raw.type) rawSummary.push(`type=${raw.type}`)
      if (Array.isArray(raw.keys) && raw.keys.length) rawSummary.push(`keys=[${raw.keys.join(',')}]`)
      if (raw.ctxExtra) {
        const c = raw.ctxExtra
        rawSummary.push(`net=${c.netType} online=${c.online}`)
        rawSummary.push(`t=${c.currentTime}s/${c.duration}s msSinceReady=${c.msSincePlayerReady}`)
        rawSummary.push(`vis=${c.visibility}`)
      }
    }
    const rawText = rawSummary.join(' | ').slice(0, 300) || ''
    const rawJson = (raw?.rawJson || '').slice(0, 200)
    const lastMsgs = Array.isArray(raw?.msgRing) ? raw.msgRing.slice(-3).map(m => `[${m.t}]${m.data}`).join(' / ').slice(0, 250) : ''

    const message = {
      type: 'flex',
      altText: `Video Error: ${userName || 'ไม่ทราบชื่อ'} — ${error}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box', layout: 'vertical', backgroundColor: '#dc2626', paddingAll: '14px',
          contents: [
            { type: 'text', text: '❌ Video Error — นักเรียนดูไม่ได้', color: '#FFFFFF', size: 'sm', weight: 'bold' },
            { type: 'text', text: 'แจ้งเตือนอัตโนมัติจากระบบ', color: '#FFFFFFCC', size: 'xxs', margin: 'sm' }
          ]
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
          contents: [
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'นักเรียน', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${userName || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'อีเมล', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${userEmail || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'Video', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${videoTitle || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'Section', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${sectionName || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'Error', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${error || '-'}`, size: 'xs', weight: 'bold', color: '#dc2626', flex: 5, wrap: true }
            ]},
            ...(rawText ? [
              { type: 'separator', color: '#f1f5f9' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'Raw', size: 'xs', color: '#94a3b8', flex: 3 },
                { type: 'text', text: rawText, size: 'xxs', color: '#0f172a', flex: 5, wrap: true }
              ]}
            ] : []),
            ...(rawJson ? [
              { type: 'separator', color: '#f1f5f9' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'JSON', size: 'xs', color: '#94a3b8', flex: 3 },
                { type: 'text', text: rawJson, size: 'xxs', color: '#475569', flex: 5, wrap: true }
              ]}
            ] : []),
            ...(lastMsgs ? [
              { type: 'separator', color: '#f1f5f9' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'Last msg', size: 'xs', color: '#94a3b8', flex: 3 },
                { type: 'text', text: lastMsgs, size: 'xxs', color: '#475569', flex: 5, wrap: true }
              ]}
            ] : []),
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'Device', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${os || '?'} · ${browser || '?'}`, size: 'xs', weight: 'bold', flex: 5 }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'เวลา', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#94a3b8', flex: 5 }
            ]}
          ]
        }
      }
    }

    // ส่งทั้งเติ้ล + แตม
    await Promise.allSettled(
      ADMIN_UIDS.map(uid =>
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ to: uid, messages: [message] })
        })
      )
    )

    res.json({ ok: true })
  } catch (error) {
    res.json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/diag/ask-doctor
 * นักเรียนถามคำถามคุณหมอ → ส่ง LINE ไปแตม (chertam)
 */
router.post('/ask-doctor', async (req, res) => {
  try {
    const { question, userName, userEmail, lineUserId, videoTitle, sectionName, sectionCode, videoIndex } = req.body

    if (!question || !question.trim()) {
      return res.status(400).json({ ok: false, message: 'ไม่มีคำถาม' })
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) return res.json({ ok: false, reason: 'no LINE token' })

    // สร้าง footer ปุ่มตอบ (ถ้ามี lineUserId)
    const replyUrl = lineUserId
      ? `https://medninja.academy/reply?uid=${encodeURIComponent(lineUserId)}&name=${encodeURIComponent(userName || '')}&q=${encodeURIComponent(question.trim().slice(0, 200))}&video=${encodeURIComponent(videoTitle || '')}`
      : null
    const footer = replyUrl ? {
      type: 'box', layout: 'vertical', paddingAll: '12px',
      contents: [
        { type: 'button', action: { type: 'uri', label: 'ตอบนักเรียนทาง LINE', uri: replyUrl }, style: 'primary', color: '#3b82f6', height: 'sm' }
      ]
    } : undefined

    const message = {
      type: 'flex',
      altText: `คำถาม: ${userName || 'นักเรียน'} — ${question.slice(0, 50)}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box', layout: 'vertical', backgroundColor: '#3b82f6', paddingAll: '14px',
          contents: [
            { type: 'text', text: '❓ คำถามจากนักเรียน', color: '#FFFFFF', size: 'sm', weight: 'bold' },
            { type: 'text', text: 'กดปุ่มด้านล่างเพื่อตอบทาง LINE', color: '#FFFFFFCC', size: 'xxs', margin: 'sm' }
          ]
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
          contents: [
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'นักเรียน', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${userName || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'กำลังดู', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${videoTitle || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'Section', size: 'xs', color: '#94a3b8', flex: 3 },
              { type: 'text', text: `${sectionCode || ''} ${sectionName || '-'}`, size: 'xs', weight: 'bold', flex: 5, wrap: true }
            ]},
            { type: 'separator', color: '#f1f5f9' },
            { type: 'text', text: 'คำถาม:', size: 'xs', color: '#3b82f6', weight: 'bold', margin: 'md' },
            { type: 'text', text: question.trim(), size: 'sm', color: '#1e293b', wrap: true, margin: 'sm' },
            { type: 'separator', color: '#f1f5f9', margin: 'md' },
            { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#94a3b8', margin: 'sm' }
          ]
        },
        ...(footer ? { footer } : {})
      }
    }

    // ส่งทั้งเติ้ล + แตม
    await Promise.allSettled(
      ADMIN_UIDS.map(uid =>
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ to: uid, messages: [message] })
        })
      )
    )

    res.json({ ok: true })
  } catch (error) {
    res.json({ ok: false, error: error.message })
  }
})

/**
 * POST /api/diag/reply-student
 * แตม/เติ้ลตอบคำถามนักเรียน → ส่ง LINE push ไปหานักเรียน
 */
router.post('/reply-student', async (req, res) => {
  try {
    const { lineUserId, studentName, question, answer, video } = req.body
    if (!lineUserId || !answer) return res.status(400).json({ ok: false })

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) return res.json({ ok: false, reason: 'no LINE token' })

    const message = {
      type: 'flex',
      altText: `คำตอบจากคุณหมอ: ${answer.slice(0, 50)}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box', layout: 'vertical', backgroundColor: '#3b82f6', paddingAll: '14px',
          contents: [
            { type: 'text', text: '💊 คำตอบจากคุณหมอ', color: '#FFFFFF', size: 'sm', weight: 'bold' },
            { type: 'text', text: 'MedNinja Academy', color: '#FFFFFFCC', size: 'xxs', margin: 'sm' }
          ]
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
          contents: [
            ...(video ? [
              { type: 'text', text: `📺 ${video}`, size: 'xxs', color: '#94a3b8', wrap: true }
            ] : []),
            { type: 'text', text: 'คำถามของคุณ:', size: 'xxs', color: '#94a3b8', margin: 'md' },
            { type: 'text', text: question || '-', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' },
            { type: 'separator', color: '#e2e8f0', margin: 'md' },
            { type: 'text', text: 'คำตอบ:', size: 'xs', color: '#3b82f6', weight: 'bold', margin: 'md' },
            { type: 'text', text: answer, size: 'sm', color: '#1e293b', wrap: true, margin: 'sm' }
          ]
        }
      }
    }

    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages: [message] })
    })

    res.json({ ok: true })
  } catch (error) {
    res.json({ ok: false, error: error.message })
  }
})

module.exports = router
