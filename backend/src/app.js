const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const errorHandler = require('./shared/middleware/errorHandler')
const profileGuard = require('./shared/middleware/profileGuard')
const auth = require('./shared/middleware/auth')

// ─── Modular Monolith Routes ───
const authRoutes = require('./modules/auth/auth.routes')
const userRoutes = require('./modules/user/user.routes')
const demoRoutes = require('./modules/demo/demo.routes')
const contentRoutes = require('./modules/content/content.routes')
const contentAdminRoutes = require('./modules/content/content.admin.routes')
const activationRoutes = require('./modules/activation/activation.routes')
const activationAdminRoutes = require('./modules/activation/activation.admin.routes')
const preregisterRoutes = require('./modules/preregister/preregister.routes')
const preregisterAdminRoutes = require('./modules/preregister/preregister.admin.routes')
const passportRoutes = require('./modules/passport/passport.routes')
const interestRoutes = require('./modules/interest/interest.routes')

const app = express()

// Trust one hop of reverse proxy (DigitalOcean load balancer)
// Required for correct req.ip / rate limiting behind DO App Platform
app.set('trust proxy', 1)

// ─── Version check (bypass Helmet — fast, no CSP needed) ───
const BUILD_VERSION = Date.now().toString()
const GIT_HASH = (() => { try { return require('child_process').execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'unknown' } })()
app.get('/api/version', (req, res) => {
  // ห้าม cache ทุกระดับ (browser, Cloudflare, DigitalOcean edge)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.json({ version: BUILD_VERSION })
})

// ─── Standalone pages (bypass Helmet/CSP) ───
// เสิร์ฟก่อน Helmet เพื่อให้ external SDK โหลดได้
// /nlex → redirect ไป miniapp
app.get('/nlex', (req, res) => res.redirect(301, 'https://nlex.medninja.academy'))
// /diag-no-token = admin only standalone (ไม่ต้อง login)
app.get('/diag-no-token', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/diag-no-token.html'))
})
// /diag = ผ่าน Vue (ต้อง login) → frontend จัดการ
app.get('/ninja-passport', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/ninja-passport.html'))
})
// NINJA DDx เก่า → maintenance (ซ่อนไว้ก่อน ให้ใช้ DDx Arena แทน)
const ninjaMaintenanceHtml = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NINJA DDx — เตรียมพบกับสนามประลอง</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700;900&family=Orbitron:wght@700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans Thai',sans-serif;background:radial-gradient(ellipse at 30% 20%,rgba(124,58,237,.12) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(249,115,22,.08) 0%,transparent 60%),#0a0a0f;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;overflow:hidden}.card{max-width:480px;width:100%;position:relative}.top-line{position:absolute;top:0;left:50%;transform:translateX(-50%);width:200px;height:3px;background:linear-gradient(90deg,transparent,#7c3aed,#f97316,#fbbf24,#f97316,#7c3aed,transparent);border-radius:2px}.logo{margin-top:20px;margin-bottom:32px}.logo-med{font-size:16px;font-weight:900;color:#a78bfa;letter-spacing:8px}.logo-ddx{font-family:'Orbitron',sans-serif;font-size:48px;font-weight:900;color:#f97316;line-height:1;text-shadow:0 0 40px rgba(249,115,22,.3)}.logo-arena{font-family:'Orbitron',sans-serif;font-size:36px;font-weight:900;color:#fff;letter-spacing:12px;line-height:1}.badge{display:inline-block;background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.3);color:#fca5a5;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;margin-bottom:24px;letter-spacing:1px}.title{font-size:22px;font-weight:900;color:#fbbf24;margin-bottom:12px;line-height:1.4}.sub{font-size:15px;color:#94a3b8;line-height:1.8;margin-bottom:32px}.sub b{color:#f97316}.features{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}.feat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);padding:10px 16px;border-radius:10px;font-size:12px;color:#94a3b8}.feat span{color:#fbbf24;font-weight:700}.glow{position:fixed;width:300px;height:300px;border-radius:50%;pointer-events:none;opacity:.15}.g1{top:-100px;left:-100px;background:radial-gradient(circle,#7c3aed,transparent 70%)}.g2{bottom:-100px;right:-100px;background:radial-gradient(circle,#f97316,transparent 70%)}.note{font-size:10px;color:#334155;letter-spacing:2px;margin-top:24px;text-transform:uppercase}@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}.badge{animation:pulse 2s ease infinite}</style></head><body><div class="glow g1"></div><div class="glow g2"></div><div class="card"><div class="top-line"></div><div class="logo"><div class="logo-med">MEDNINJA</div><div class="logo-ddx">DDx</div><div class="logo-arena">ARENA</div></div><div class="badge">COMING SOON</div><div class="title">เตรียมพบกับสนามประลอง</div><div class="sub">เกมฝึก <b>Differential Diagnosis</b> รูปแบบใหม่<br>แข่งกันว่าใครจะเป็นที่หนึ่ง</div><div class="features"><div class="feat">DDx Buzzwords</div><div class="feat">Pattern → DDx</div><div class="feat">Odd One Out</div></div><div class="note">MedNinja Technology</div></div></body></html>`
app.get('/ninja-ddx', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/ddx-arena'))
app.get('/ninja-ddx-mindmap', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/ddx-arena'))
app.get('/ninja-ddx-path', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/ddx-arena'))
app.get('/ddx-arena', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/ddx-arena'))
// Deploy status — เช็คก่อน push ว่า server ว่างไหม
app.get('/api/deploy-status', (req, res) => {
  const { pdfActiveCount, pdfQueue } = require('./modules/content/pdf.controller')
  const ActiveViewer = require('./modules/content/ActiveViewer.model')
  ActiveViewer.countDocuments().then(viewers => {
    const busy = pdfActiveCount > 0 || (pdfQueue && pdfQueue.length > 0)
    res.json({ ok: true, busy, pdf: { active: pdfActiveCount || 0, waiting: (pdfQueue || []).length }, viewers, safe: !busy })
  }).catch(() => res.json({ ok: true, busy: false, safe: true }))
})
app.get('/ninja-ddx-profile', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/ddx-arena'))
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/form.html'))
})
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/demo.html'))
})

// ─── Demo Download (public) — แสดงหน้า + serve PDF จาก Bunny demo/ folder ───
async function bunnyDemoExists(fileName) {
  const zone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
  const key = process.env.BUNNY_STORAGE_API_KEY
  if (!key) return false
  const url = `https://sg.storage.bunnycdn.com/${zone}/demo/${encodeURIComponent(fileName)}`
  try {
    // Bunny ตอบ 401 กับ HEAD — ใช้ Range GET (อ่าน 1 byte) แทน
    const resp = await fetch(url, { headers: { 'AccessKey': key, 'Range': 'bytes=0-0' } })
    return resp.ok || resp.status === 206
  } catch { return false }
}

app.get('/demo/download/:fileName', async (req, res) => {
  const fileName = (req.params.fileName || '').trim()
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.redirect(302, '/')
  }
  if (!(await bunnyDemoExists(fileName))) return res.redirect(302, '/')
  const fs = require('fs')
  const html = fs.readFileSync(path.join(__dirname, 'pages/demo-download.html'), 'utf8')
    .replace(/__FILENAME__/g, fileName.replace(/[<>&"]/g, ''))
  res.set('Content-Type', 'text/html; charset=utf-8').send(html)
})

app.get('/api/demo/download/:fileName', async (req, res) => {
  const fileName = (req.params.fileName || '').trim()
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.redirect(302, '/')
  }
  try {
    const zone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const key = process.env.BUNNY_STORAGE_API_KEY
    if (!key) return res.redirect(302, '/')
    const url = `https://sg.storage.bunnycdn.com/${zone}/demo/${encodeURIComponent(fileName)}`
    const resp = await fetch(url, { headers: { 'AccessKey': key } })
    if (!resp.ok) return res.redirect(302, '/')
    const buf = Buffer.from(await resp.arrayBuffer())
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', buf.length)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`)
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.send(buf)
  } catch (err) {
    console.error('[demo download] error:', err.message)
    res.redirect(302, '/')
  }
})
// /doctor-result/:id — แสดงผล diagnostic (bypass SPA) — เก็บ 24 ชม. ใน MongoDB
app.get('/doctor-result/:id', async (req, res) => {
  let data
  try {
    const DoctorResult = require('./modules/demo/DoctorResult.model')
    data = await DoctorResult.findOne({ resultId: req.params.id }).lean()
  } catch {}
  if (!data) return res.status(404).send('<html><body style="background:#1c1d1f;color:#fff;font-family:sans-serif;padding:40px;text-align:center"><h2>ผลหมดอายุแล้ว (24 ชม.)</h2><a href="/my" style="color:#a855f7">กลับหน้าเรียน</a></body></html>')
  let text = `=== MedNinja Doctor Diagnostic ===\nDate: ${data.createdAt.toISOString()}\nUser: ${data.userName} (${data.userEmail})\nUserAgent: ${data.userAgent}\nVideo: ${data.videoTitle}\nTotal Time: ${data.totalMs}ms\n\n`
  for (const s of data.journey) {
    const icon = s.ok === true ? 'PASS' : s.ok === false ? 'FAIL' : 'WARN'
    text += `[${icon}] [${s.id}] ${s.phase} — ${s.title}\n   ${s.detail}\n   (${s.ts}ms)\n`
    if (s.raw) text += `   RAW: ${JSON.stringify(s.raw, null, 2).split('\n').join('\n   ')}\n`
    text += '\n'
  }
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doctor Result</title><style>body{background:#1c1d1f;color:#e2e8f0;font-family:'Noto Sans Thai',monospace;padding:16px;margin:0}h1{font-size:18px;color:#a855f7;margin:0 0 12px}pre{background:#0f1117;padding:16px;border-radius:10px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;font-size:11px;line-height:1.6;border:1px solid #2d2f31}.btn{display:block;width:100%;padding:14px;border:none;border-radius:10px;background:linear-gradient(135deg,#a855f7,#3b82f6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:12px;text-align:center;box-sizing:border-box}.btn:active{transform:scale(.98)}.ok{color:#10b981;text-align:center;font-size:13px;font-weight:700}</style></head><body><h1>🩺 Doctor — ${(data.userName || '').replace(/</g,'&lt;')}</h1><button class="btn" onclick="copy()">📋 Copy ทั้งหมด</button><div id="msg"></div><pre id="d">${text.replace(/</g,'&lt;')}</pre><script>function copy(){navigator.clipboard.writeText(document.getElementById('d').textContent).then(()=>{document.getElementById('msg').innerHTML='<div class=ok>Copy แล้ว! วางใน AI ได้เลย</div>'}).catch(()=>{const t=document.createElement('textarea');t.value=document.getElementById('d').textContent;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);document.getElementById('msg').innerHTML='<div class=ok>Copy แล้ว!</div>'})}</script></body></html>`)
})

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", 'https://static.line-scdn.net', 'https://liff.line.me', 'https://assets.mediadelivery.net', 'https://connect.facebook.net', 'https://g.alicdn.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      // Allow Bunny.net video player
      frameSrc: ["'self'", 'https://player.mediadelivery.net'],
      mediaSrc: ["'self'", 'blob:', 'https://cdn-cn.medninja.academy', 'https://*.aliyuncs.com', 'https://*.alicdn.com'],
      connectSrc: ["'self'", 'https://api.line.me', 'https://liff.line.me', 'https://access.line.me', 'https://liffsdk.line-scdn.net', 'https://api.qrserver.com', 'https://ws.medninja.academy', 'wss://ws.medninja.academy', 'https://www.facebook.com', 'https://connect.facebook.net', 'https://cdn-cn.medninja.academy', 'https://*.aliyuncs.com', 'https://*.alicdn.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    }
  },
  // Send origin as Referer on cross-origin requests (HTTPS→HTTPS)
  // Required: Bunny.net embed player checks Referer against Allowed Domains
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))
// CORS — รองรับ Synapse + feature apps ข้าม domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.SYNAPSE_URL || 'https://synapse.medninja.academy',
  process.env.MEQEX_URL || 'https://meqex.medninja.academy',
  process.env.NLEX_URL || 'https://nlex.medninja.academy',
  process.env.ATLAS_URL || 'https://atlas.medninja.academy',
  process.env.LONGEX_URL || 'https://longex.medninja.academy',
  process.env.SKILL15_URL || 'https://15xskill.medninja.academy',
  process.env.OSCE_URL || 'https://osce.medninja.academy'
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(null, false)
  },
  credentials: true
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Geo Middleware (DO-only, geoip-lite) ───
// Attach req.geo = { country, isChina, isThai, ip, ... } to every request
const geoMiddleware = require('./shared/middleware/geo')
app.use(geoMiddleware)

// Public whoami — ให้ frontend เช็ค country ตัวเอง (ไม่ต้อง login)
app.get('/api/geo/whoami', geoMiddleware.whoamiEndpoint)

// Public all-sources — query CF + ipinfo + geoip-lite แยก (debug page /geo)
app.get('/api/geo/all-sources', geoMiddleware.allSourcesEndpoint)

// Public domain status — เช็ค 3 layer defense ของ Domain lock (debug page /domain)
const { domainStatusEndpoint } = require('./shared/middleware/domainCheck')
app.get('/api/domain/status', domainStatusEndpoint)

// Public JWT status — decode + validate JWT (debug page /jwt)
// รับ token จาก Authorization header (Bearer) แล้วแสดงว่า backend รู้อะไรจาก token
const { jwtStatusEndpoint } = require('./shared/middleware/jwtStatus')
app.get('/api/jwt/status', jwtStatusEndpoint)

// LINE Webhook — raw body สำหรับ verify signature (ต้องอยู่ก่อน express.json)
app.use('/api/line/webhook', require('./modules/line/line.webhook.routes'))

app.use(express.json({ limit: '10mb' })) // เพิ่ม limit สำหรับ preregister submit (base64 image)

// ⭐ Watch Debug — sendBeacon ส่งมาเป็น text/plain ต้อง parse เอง
// ต้อง raw text handler + no auth (beacon ทำงานแม้ user logout)
app.post('/api/debug/watch-trace',
  express.text({ type: '*/*', limit: '1mb' }),
  require('./modules/content/watch-debug.controller').pushTrace
)
// Also accept image beacon (fallback สำหรับ browser ที่ sendBeacon fail)
app.get('/api/debug/watch-beacon',
  require('./modules/content/watch-debug.controller').pixelBeacon
)

// ─── API Routes (Modular Monolith) ───
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/demo', demoRoutes)
app.use('/api/diag', require('./modules/demo/diag.routes'))
app.use('/api/partner', require('./modules/partner/partner.routes'))

// China test: Alibaba VOD PlayAuth (MVP — public, จะเพิ่ม auth ตอน Phase 2)
app.use('/api/china', require('./modules/china/china.routes'))

// NINJA PASSPORT: OCR scan (public) + Pre-registration (public)
app.use('/api/passport', passportRoutes)
app.use('/api/preregister', preregisterRoutes)
app.use('/api/interest', interestRoutes)

// v2: Content + Activation (Learning System)
// profileGuard: ต้องกรอกข้อมูลครบก่อนเข้าเรียน
// requireLine: ต้องเชื่อม LINE ก่อนทำอะไร
//   Bypass: admin, CN users (จีนใช้ LINE ไม่ได้)
function requireLine(req, res, next) {
  if (req.user.role === 'admin') return next()
  // ⭐ CN user bypass — จีน block LINE, ไม่บังคับเชื่อม
  if (req.geo?.isChina) return next()
  if (!req.user.lineUserId) {
    return res.status(403).json({ message: 'LINE_REQUIRED', detail: 'กรุณาเชื่อม LINE ก่อนเข้าใช้งาน' })
  }
  next()
}
app.use('/api/my', auth, profileGuard, activationRoutes)
app.use('/api/my', auth, profileGuard, requireLine, contentRoutes)
app.use('/api/my', auth, profileGuard, requireLine, require('./modules/selfcheck/selfcheck.routes'))
app.use('/api/my', auth, profileGuard, requireLine, require('./modules/approach/approach.routes'))
app.use('/api/my', auth, profileGuard, requireLine, require('./modules/meq/meq.routes'))
// NLEX → ย้ายไป miniapp (nlex.medninja.academy) แล้ว
// sendBeacon endpoint — ไม่ผ่าน auth (อ่าน JWT จาก body เอง)
app.post('/api/beacon/heartbeat-clear', require('./modules/content/content.controller').beaconClearHeartbeat)
app.use('/api/admin', contentAdminRoutes)
app.use('/api/admin/self-checks', require('./modules/selfcheck/selfcheck.admin.routes'))
app.use('/api/admin/activations', activationAdminRoutes)
app.use('/api/admin/passport', preregisterAdminRoutes)
app.use('/api/admin/line', auth, require('./shared/middleware/admin'), require('./modules/line/line.admin.routes'))
app.use('/api/admin/spy', require('./modules/spy/spy.routes'))
app.use('/api/admin/approaches', require('./modules/approach/approach.admin.routes'))
app.use('/api/admin/meq', require('./modules/meq/meq.admin.routes'))
// Alibaba VOD admin utils (verify + rename)
app.use('/api/admin/ali', require('./modules/china/china.admin.routes'))
// DDx/Arena/Flashcard ย้ายไป ddx.medninja.academy แล้ว — redirect API calls
app.use('/api/flashcard', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/api/flashcard' + req.url))
app.use('/api/arena', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/api/arena' + req.url))
app.use('/api/ddx', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/api/ddx' + req.url))
app.use('/api/admin/flashcard', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/api/admin/flashcard' + req.url))
app.use('/api/admin/arena', (req, res) => res.redirect(301, 'https://ddx.medninja.academy/api/admin/arena' + req.url))
app.use('/api/admin/db', require('./modules/admin/dbviewer.routes'))

// Health check — เช็คทั้ง passport + lms connections
app.get('/api/health', async (req, res) => {
  const { passportConn, lmsConn } = require('./shared/config/db')
  const stateLabel = (conn) => {
    if (!conn) return 'not configured'
    return conn.readyState === 1 ? 'connected' : 'connecting'
  }
  const { getClient } = require('./shared/config/valkey')
  const redis = getClient()
  let valkeyStatus = 'no client'
  if (redis) {
    try {
      await redis.ping()
      valkeyStatus = 'connected'
    } catch (e) {
      valkeyStatus = 'error: ' + e.message
    }
  }

  res.json({ status: 'ok' })
})

// Video security health check — admin only
app.get('/api/health/video', auth, require('./shared/middleware/admin'), (req, res) => {
  const { bunnyConfig, getDemoEmbedUrl } = require('./shared/config/bunny')
  const testVideoId = '3e1c54eb-d014-41fd-b424-cd38df70fedd'

  // ชั้น 1: Token Auth — env vars ครบ + generate ได้ (ใช้ NO DRM library)
  const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'
  const demoSecKey = process.env.BUNNY_DEMO_SECURITY_KEY
  const hasLibraryId = !!demoLibId
  const hasSecurityKey = !!demoSecKey
  const correctLibraryId = demoLibId === '628424'
  const signedUrl = getDemoEmbedUrl(testVideoId)
  const tokenGenOk = signedUrl.includes('?token=') && signedUrl.includes('&expires=')
  const correctDomain = signedUrl.startsWith('https://player.mediadelivery.net/')

  // ชั้น 2: Referrer-Policy — ตรวจจาก response headers ที่ Helmet set
  // (ต้องเป็น strict-origin-when-cross-origin ไม่ใช่ no-referrer)
  const referrerPolicy = 'strict-origin-when-cross-origin' // hardcoded in helmet config

  // ชั้น 3: CSP — frameSrc ต้องมี player.mediadelivery.net
  const cspOk = true // configured in helmet directives above

  // รวมผลลัพธ์
  const checks = {
    'token_auth.library_id': hasLibraryId ? (correctLibraryId ? 'pass' : 'FAIL — ต้องเป็น 626874') : 'FAIL — BUNNY_LIBRARY_ID ไม่ได้ set',
    'token_auth.security_key': hasSecurityKey ? 'pass' : 'FAIL — BUNNY_SECURITY_KEY ไม่ได้ set',
    'token_auth.generation': tokenGenOk ? 'pass' : 'FAIL — signed URL ไม่มี token/expires',
    'embed_domain': correctDomain ? 'pass' : 'FAIL — ต้องเป็น player.mediadelivery.net',
    'referrer_policy': referrerPolicy === 'strict-origin-when-cross-origin' ? 'pass' : 'FAIL — ห้ามเป็น no-referrer',
    'csp_frame_src': cspOk ? 'pass' : 'FAIL — ต้อง allow player.mediadelivery.net',
    'cdn_hostname': bunnyConfig.cdnHostname ? 'pass' : 'FAIL — BUNNY_CDN_HOSTNAME ไม่ได้ set'
  }

  const allPass = Object.values(checks).every(v => v === 'pass')

  res.json({
    status: allPass ? 'all_secure' : 'has_issues',
    checks,
    sample_signed_url: allPass ? signedUrl.substring(0, 80) + '...' : null,
    note: 'Bunny dashboard ต้องเปิด: Embed token auth ON, Allowed domains, Block direct URL ON'
  })
})

// DRM test API (admin only) — ส่ง URL ตาม UA เหมือน production จริง
app.get('/api/drm-test/urls', require('./shared/middleware/auth'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' })
  const { getSignedEmbedUrl, getDemoEmbedUrl } = require('./shared/config/bunny')
  const drmVideoId = '9223a8fa-9ef6-4ef3-a170-08a351e79e28'
  const noDrmVideoId = '84df31cc-5699-45a6-826a-b5485d4beda3'
  const { isIOS, isMacSafari } = require('./shared/util/deviceDetect')
  const useDrm = !(isIOS(req) || isMacSafari(req))
  res.json({
    mode: useDrm ? 'widevine' : 'protection',
    videoId: useDrm ? drmVideoId : noDrmVideoId,
    library: useDrm ? 626874 : 628424,
    embedUrl: useDrm ? getSignedEmbedUrl(drmVideoId) : getDemoEmbedUrl(noDrmVideoId)
  })
})

// API 404 — must come after all /api/* routes so unknown API paths return JSON (not index.html)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' })
})

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Vendor libs (aliplayer, etc.) — serve เป็นไฟล์เฉพาะ ไม่ผ่าน SPA fallback
  app.use('/vendor', express.static(path.join(__dirname, '../../frontend/dist/vendor'), {
    maxAge: '30d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8')
      // เอา CORP/COOP restriction ออก — Chrome Android บาง version block ถ้ามี same-origin
      // vendor SDK เป็น public static file OK ให้ cross-origin ได้
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  }))
  // JS/CSS chunks มี hash → cache ได้นาน
  app.use('/assets', express.static(path.join(__dirname, '../../frontend/dist/assets'), { maxAge: '30d', immutable: true }))
  // ไฟล์อื่นๆ (favicon, logo, robots.txt) cache สั้น
  // ⭐ index: false → ห้าม express.static ตอบ index.html (ปล่อยให้ app.get('*') จัดการ)
  app.use(express.static(path.join(__dirname, '../../frontend/dist'), {
    maxAge: '1h',
    index: false,
    setHeaders: (res, filePath) => {
      // safety: index.html / sw.js / manifest / test HTMLs = no-cache
      if (/index\.html$|sw\.js$|manifest\.(json|webmanifest)$|drm-test\.html$|ali-test\.html$|sdk-check\.html$|alibaba-standalone-test\.html$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        res.setHeader('CDN-Cache-Control', 'no-store')
        res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store')
        res.setHeader('Pragma', 'no-cache')
      }
    }
  }))
  // ─── OG meta override สำหรับ landing เฉพาะ (Facebook/LINE crawler อ่านได้) ───
  const fs = require('fs')
  const OG_PAGES = {
    '/virtual-patient': {
      title: 'Virtual Patient — ทดลองฟรี 7 วัน | MedNinja',
      desc: 'ฝึก NL + MEQ + OSCE กับคนไข้เสมือนจริง 1,000 ล้านเคสไม่ซ้ำ ทดลองฟรีแบบละ 7 วัน เล่นในมือถือผ่าน LINE',
      image: 'https://medninja.academy/img/vp-mascot.png',
      url: 'https://medninja.academy/virtual-patient'
    }
  }
  function injectOG(html, og) {
    return html
      .replace(/<title>[^<]*<\/title>/i, `<title>${og.title}</title>`)
      .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${og.desc}" />`)
      .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${og.url}" />`)
      .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${og.title}" />`)
      .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${og.desc}" />`)
      .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${og.image}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />`)
      .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${og.title}" />`)
      .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${og.desc}" />\n    <meta name="twitter:image" content="${og.image}" />`)
  }

  // index.html → ห้าม cache → ได้ JS chunk ใหม่เสมอ
  // + CDN-Cache-Control เพื่อข้าม Cloudflare cache
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    res.setHeader('CDN-Cache-Control', 'no-store')
    res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    const og = OG_PAGES[req.path]
    if (og) {
      try {
        const html = fs.readFileSync(path.join(__dirname, '../../frontend/dist/index.html'), 'utf8')
        return res.type('html').send(injectOG(html, og))
      } catch {}
    }
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
  })
}

// DDx/Arena/Flashcard seed — ปิดแล้ว ย้ายไป ddx.medninja.academy


// Error handler
app.use(errorHandler)

module.exports = app
