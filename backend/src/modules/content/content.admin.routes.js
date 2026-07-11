const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const {
  getAllSections, getSection, createSection, updateSection, deleteSection, cloneSection,
  getAllPackages, getPackage, createPackage, updatePackage, deletePackage,
  getBunnyVideoInfo, getBunnyVideoEmbed, getBunnyVideoNames, renameBunnyVideo,
  getDemoSection, upsertDemoSection, getDemoBunnyVideoInfo, getDemoConfig, setupDemoPackage, assignAdminVisa,
  getActiveViewers, getAnomalyLog, resolveAnomaly,
  kickViewer, kickAllViewers,
  getClientLogs, resolveClientLog,
  liveDebugTimeline, liveDebugNow, liveDebugErrors,
  getAnomalyReport,
  refreshDurations
} = require('./content.admin.controller')
// Admin: VideoContent Library (reusable 4-field video presets)
const {
  saveContent, listContents, getTags, deleteContent, getUsage
} = require('./video-content.controller')
router.get('/video-contents', auth, admin, listContents)
router.get('/video-contents/tags', auth, admin, getTags)
router.get('/video-contents/:id/usage', auth, admin, getUsage)
router.post('/video-contents', auth, admin, saveContent)
router.delete('/video-contents/:id', auth, admin, deleteContent)

// Admin: CRUD Sections
router.get('/sections', auth, admin, getAllSections)
router.get('/sections/:id', auth, admin, getSection)
router.post('/sections', auth, admin, createSection)
router.put('/sections/:id', auth, admin, updateSection)
router.post('/sections/:id/clone', auth, admin, cloneSection)
router.delete('/sections/:id', auth, admin, deleteSection)

// Admin: PDF upload/delete per section
const multer = require('multer')
const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (req, file, cb) => { cb(null, file.mimetype === 'application/pdf') } })
const { uploadPdf, deletePdf } = require('./pdf.controller')
router.post('/sections/:id/videos/:idx/upload-pdf', auth, admin, pdfUpload.single('pdf'), uploadPdf)
router.delete('/sections/:id/videos/:idx/pdf', auth, admin, deletePdf)

// Admin: PDF Download Logs
const PdfDownloadLog = require('./PdfDownloadLog.model')
router.get('/pdf-logs', auth, admin, async (req, res) => {
  try {
    const { search, dateFrom, dateTo, page = 1, limit = 30 } = req.query
    const query = {}
    if (search) {
      const re = new RegExp(search, 'i')
      query.$or = [{ userName: re }, { userEmail: re }, { refId: re }, { nationalId: re }]
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59')
    }
    const total = await PdfDownloadLog.countDocuments(query)
    const logs = await PdfDownloadLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean()
    res.json({ logs, total, page: Number(page), limit: Number(limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})
router.get('/pdf-logs/stats', auth, admin, async (req, res) => {
  try {
    const total = await PdfDownloadLog.countDocuments()
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const today = await PdfDownloadLog.countDocuments({ createdAt: { $gte: todayStart } })
    const uniqueUsers = await PdfDownloadLog.distinct('userId')
    const emailSent = await PdfDownloadLog.countDocuments({ emailSent: true })
    res.json({ total, today, uniqueUsers: uniqueUsers.length, emailRate: total > 0 ? Math.round(emailSent / total * 100) : 0 })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Admin: CRUD Packages
router.get('/packages', auth, admin, getAllPackages)
router.get('/packages/:id', auth, admin, getPackage)
router.post('/packages', auth, admin, createPackage)
router.put('/packages/:id', auth, admin, updatePackage)
router.delete('/packages/:id', auth, admin, deletePackage)

// Admin: Bunny Video Utils
router.get('/bunny/video-names', auth, admin, getBunnyVideoNames)
router.put('/bunny/video/:videoId/rename', auth, admin, renameBunnyVideo)
router.get('/bunny/video/:videoId', auth, admin, getBunnyVideoInfo)
router.get('/bunny/video/:videoId/embed', auth, admin, getBunnyVideoEmbed)

// Admin: Demo / Trial
router.get('/demo/section', auth, admin, getDemoSection)
router.put('/demo/section', auth, admin, upsertDemoSection)
router.get('/demo/bunny/video/:videoId', auth, admin, getDemoBunnyVideoInfo)
router.get('/demo/config', auth, admin, getDemoConfig)
router.post('/demo/setup-package', auth, admin, setupDemoPackage)
router.post('/demo/assign-visa', auth, admin, assignAdminVisa)

// Admin: Valkey Debug (read-only)
router.get('/valkey-debug', auth, admin, async (req, res) => {
  try {
    const { getClient } = require('../../shared/config/valkey')
    const redis = getClient()
    if (!redis) return res.json({ status: 'no client', keys: [] })

    const allKeys = await redis.keys('*')
    const items = []
    for (const key of allKeys.slice(0, 200)) {
      const type = await redis.type(key)
      const ttl = await redis.ttl(key)
      let value = null
      if (type === 'string') value = await redis.get(key)
      else if (type === 'zset') {
        const members = await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')
        const arr = []
        for (let i = 0; i < members.length; i += 2) arr.push({ member: members[i], score: members[i + 1] })
        value = arr
      } else if (type === 'list') value = await redis.lrange(key, 0, 20)
      else if (type === 'set') value = await redis.smembers(key)
      else if (type === 'hash') value = await redis.hgetall(key)
      items.push({ key, type, ttl, value })
    }
    items.sort((a, b) => a.key.localeCompare(b.key))
    res.json({ status: 'connected', total: allKeys.length, keys: items })
  } catch (err) {
    res.json({ status: 'error', error: err.message, keys: [] })
  }
})

// Admin: Active Viewers + Anomaly
router.get('/viewers', auth, admin, getActiveViewers)
router.post('/viewers/kick-all', auth, admin, kickAllViewers)
router.post('/viewers/:userId/kick', auth, admin, kickViewer)
router.get('/anomalies', auth, admin, getAnomalyLog)
router.patch('/anomalies/:id/resolve', auth, admin, resolveAnomaly)

// Admin: Client Logs (error/behavior tracking)
router.get('/client-logs', auth, admin, getClientLogs)
router.patch('/client-logs/:id/resolve', auth, admin, resolveClientLog)

// Admin: Live debug — Claude เข้าไปอ่านเพื่อ debug live player
router.get('/live-debug/timeline', auth, admin, liveDebugTimeline)  // ?userId= &liveId= &limit=200
router.get('/live-debug/now', auth, admin, liveDebugNow)            // ?liveId= &minutes=5
router.get('/live-debug/errors', auth, admin, liveDebugErrors)      // ?hours=1
router.get('/anomaly-report', auth, admin, getAnomalyReport)
router.post('/refresh-durations', auth, admin, refreshDurations)

// ═══ Video-PDF Map — แสดง video ทั้งหมดจาก Bunny + PDF status ═══
router.get('/video-pdf-map', auth, admin, async (req, res) => {
  try {
    const demoApiKey = process.env.BUNNY_DEMO_API_KEY
    const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY

    // 1. ดึง video ทั้งหมดจาก Bunny library (paginate ได้สูงสุด 500)
    let videos = []
    if (demoApiKey) {
      let page = 1
      while (true) {
        const resp = await fetch(`https://video.bunnycdn.com/library/${demoLibId}/videos?page=${page}&itemsPerPage=500&orderBy=date`, {
          headers: { AccessKey: demoApiKey }
        })
        if (!resp.ok) break
        const data = await resp.json()
        const items = data.items || data
        if (!items.length) break
        for (const v of items) {
          videos.push({
            guid: v.guid,
            title: v.title || '',
            length: v.length || 0,
            status: v.status,
            dateUploaded: v.dateUploaded
          })
        }
        if (items.length < 500) break
        page++
      }
    }

    // 2. ดึง PDF list จาก Bunny Storage
    const pdfSet = new Set()
    if (storageKey) {
      try {
        const listResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/`, {
          headers: { AccessKey: storageKey }
        })
        if (listResp.ok) {
          const files = await listResp.json()
          for (const f of files) {
            if (f.ObjectName && f.ObjectName.endsWith('.pdf')) {
              pdfSet.add(f.ObjectName.replace('.pdf', ''))
            }
          }
        }
      } catch { /* ignore */ }
    }

    // 3. Cross-match
    const videoGuids = new Set(videos.map(v => v.guid))
    const result = videos.map(v => ({
      ...v,
      hasPdf: pdfSet.has(v.guid)
    }))

    // 4. PDF กำพร้า — ไฟล์ PDF ที่ไม่ตรงกับ video ไหน
    const orphanPdfs = []
    for (const uuid of pdfSet) {
      if (!videoGuids.has(uuid)) {
        orphanPdfs.push(uuid + '.pdf')
      }
    }

    const withPdf = result.filter(v => v.hasPdf).length
    res.json({
      videos: result,
      orphanPdfs,
      stats: {
        totalVideos: result.length,
        withPdf,
        withoutPdf: result.length - withPdf,
        orphanPdfs: orphanPdfs.length
      }
    })
  } catch (err) {
    console.error('video-pdf-map error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// Upload PDF ผ่าน Video-PDF Map (by bunnyVideoId)
const pdfMapUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
router.post('/video-pdf-map/upload/:videoId', auth, admin, pdfMapUpload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'เลือกไฟล์ PDF' })
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.status(500).json({ message: 'Bunny Storage ยังไม่ setup' })

    const fileName = `${req.params.videoId}.pdf`
    const uploadResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`, {
      method: 'PUT',
      headers: { 'AccessKey': storageKey, 'Content-Type': 'application/pdf' },
      body: req.file.buffer
    })
    if (!uploadResp.ok) {
      const body = await uploadResp.text()
      return res.status(502).json({ message: `Upload ไม่สำเร็จ: ${body}` })
    }

    // Sync ไป Section ที่ใช้ video UUID เดียวกัน
    const Section = require('./Section.model')
    const cdnUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME || storageZone + '.b-cdn.net'}/${fileName}`
    const sections = await Section.find({ 'videos.bunnyVideoId': req.params.videoId })
    for (const sec of sections) {
      let changed = false
      for (const v of sec.videos) {
        if (v.bunnyVideoId === req.params.videoId) {
          v.pdfFileUrl = cdnUrl
          v.pdfFileName = v.title + '.pdf'
          changed = true
        }
      }
      if (changed) await sec.save()
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('video-pdf upload error:', err.message)
    res.status(500).json({ message: 'Upload ไม่สำเร็จ' })
  }
})

// ลบ PDF จาก Video-PDF Map
router.delete('/video-pdf-map/:videoId', auth, admin, async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.status(500).json({ message: 'Bunny Storage ยังไม่ setup' })

    await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${req.params.videoId}.pdf`, {
      method: 'DELETE', headers: { 'AccessKey': storageKey }
    })

    // ล้าง pdfFileUrl จาก Section ที่ใช้ UUID เดียวกัน
    const Section = require('./Section.model')
    const sections = await Section.find({ 'videos.bunnyVideoId': req.params.videoId })
    for (const sec of sections) {
      let changed = false
      for (const v of sec.videos) {
        if (v.bunnyVideoId === req.params.videoId) {
          v.pdfFileUrl = ''
          v.pdfFileName = ''
          changed = true
        }
      }
      if (changed) await sec.save()
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('video-pdf delete error:', err.message)
    res.status(500).json({ message: 'ลบไม่สำเร็จ' })
  }
})

// ลบ PDF กำพร้า
router.delete('/video-pdf-map/orphan/:fileName', auth, admin, async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${req.params.fileName}`, {
      method: 'DELETE', headers: { 'AccessKey': storageKey }
    })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: 'ลบไม่สำเร็จ' }) }
})

// ═══════════════════════════════════════════
// PDF LIBRARY — Bunny Storage เป็น library
// ═══════════════════════════════════════════

// GET /api/admin/pdf-library — list ไฟล์ PDF ทั้งหมด + mapping
router.get('/pdf-library', auth, admin, async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.json({ files: [] })

    const listResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/`, {
      headers: { AccessKey: storageKey }
    })
    if (!listResp.ok) return res.json({ files: [] })
    const allFiles = await listResp.json()
    const pdfFiles = allFiles.filter(f => f.ObjectName && f.ObjectName.endsWith('.pdf'))

    // หา mapping — PDF นี้ถูกใช้ที่ไหนบ้าง
    const Section = require('./Section.model')
    const sections = await Section.find({}).select('code name videos topicPdfMap subtopicPdfMap').lean()

    const files = pdfFiles.map(f => {
      const name = f.ObjectName
      const usedIn = []
      for (const sec of sections) {
        // topic-level
        const tMap = sec.topicPdfMap instanceof Map ? Object.fromEntries(sec.topicPdfMap) : (sec.topicPdfMap || {})
        for (const [topic, pdf] of Object.entries(tMap)) {
          if (pdf === name) usedIn.push({ section: sec.code, path: `${sec.code} → ${topic}`, type: 'topic', topic })
        }
        // subtopic-level
        const stMap = sec.subtopicPdfMap instanceof Map ? Object.fromEntries(sec.subtopicPdfMap) : (sec.subtopicPdfMap || {})
        for (const [st, pdf] of Object.entries(stMap)) {
          if (pdf === name) usedIn.push({ section: sec.code, path: `${sec.code} → ${st} (sub)`, type: 'subtopic', subtopic: st })
        }
        // video-level
        for (const v of (sec.videos || [])) {
          if (v.pdfFile === name || (v.pdfFileUrl && v.pdfFileUrl.includes(name.replace('.pdf', '')))) {
            const parts = [sec.code]
            if (v.topic) parts.push(v.topic)
            if (v.subtopic) parts.push(v.subtopic)
            parts.push(v.title || '(ไม่มีชื่อ)')
            usedIn.push({ section: sec.code, path: parts.join(' → '), type: 'video', topic: v.topic || '', subtopic: v.subtopic || '' })
          }
        }
      }
      return {
        name,
        size: f.Length || 0,
        date: f.DateCreated || '',
        usedIn,
        usedCount: usedIn.length
      }
    })

    res.json({ files })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/pdf-library/upload — upload PDF ตั้งชื่อเอง
const pdfLibUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
router.post('/pdf-library/upload', auth, admin, pdfLibUpload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'เลือกไฟล์ PDF' })
    let fileName = req.body.fileName || req.file.originalname
    if (!fileName.endsWith('.pdf')) fileName += '.pdf'
    // sanitize
    fileName = fileName.replace(/[^a-zA-Z0-9\u0E00-\u0E7F._-]/g, '_')

    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.status(500).json({ message: 'Bunny Storage ยังไม่ setup' })

    const uploadResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`, {
      method: 'PUT',
      headers: { 'AccessKey': storageKey, 'Content-Type': 'application/pdf' },
      body: req.file.buffer
    })
    if (!uploadResp.ok) return res.status(502).json({ message: 'Upload ไม่สำเร็จ' })

    res.json({ ok: true, fileName })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/pdf-library/rename — เปลี่ยนชื่อไฟล์
router.post('/pdf-library/rename', auth, admin, async (req, res) => {
  try {
    const { oldName, newName } = req.body
    if (!oldName || !newName) return res.status(400).json({ message: 'ต้องมี oldName และ newName' })

    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.status(500).json({ message: 'Bunny Storage ยังไม่ setup' })

    let safeName = newName
    if (!safeName.endsWith('.pdf')) safeName += '.pdf'
    safeName = safeName.replace(/[^a-zA-Z0-9\u0E00-\u0E7F._-]/g, '_')

    // Bunny Storage ไม่มี rename → download + upload ชื่อใหม่ + delete เก่า
    const dlResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${oldName}`, {
      headers: { AccessKey: storageKey }
    })
    if (!dlResp.ok) return res.status(404).json({ message: 'ไม่พบไฟล์เก่า' })
    const buf = Buffer.from(await dlResp.arrayBuffer())

    // upload ชื่อใหม่
    const upResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${safeName}`, {
      method: 'PUT',
      headers: { AccessKey: storageKey, 'Content-Type': 'application/pdf' },
      body: buf
    })
    if (!upResp.ok) return res.status(502).json({ message: 'Upload ชื่อใหม่ไม่สำเร็จ' })

    // ลบเก่า
    await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${oldName}`, {
      method: 'DELETE', headers: { AccessKey: storageKey }
    })

    // update reference ใน Section ทั้งหมด
    const Section = require('./Section.model')
    const sections = await Section.find({})
    for (const sec of sections) {
      let changed = false
      // section-level
      if (sec.sectionPdfFile === oldName) { sec.sectionPdfFile = safeName; changed = true }
      // video-level
      for (const v of sec.videos) {
        if (v.pdfFile === oldName) { v.pdfFile = safeName; changed = true }
        // fallback: pdfFileUrl มี oldName
        if (v.pdfFileUrl && v.pdfFileUrl.includes(oldName.replace('.pdf', ''))) {
          v.pdfFileUrl = v.pdfFileUrl.replace(oldName.replace('.pdf', ''), safeName.replace('.pdf', ''))
          v.pdfFile = safeName
          changed = true
        }
      }
      if (changed) await sec.save()
    }

    res.json({ ok: true, newName: safeName })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/admin/pdf-library/:fileName — ลบ PDF
router.delete('/pdf-library/:fileName', auth, admin, async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${req.params.fileName}`, {
      method: 'DELETE', headers: { AccessKey: storageKey }
    })

    // ล้าง reference
    const Section = require('./Section.model')
    const sections = await Section.find({})
    for (const sec of sections) {
      let changed = false
      if (sec.sectionPdfFile === req.params.fileName) { sec.sectionPdfFile = ''; sec.sectionPdfName = ''; changed = true }
      for (const v of sec.videos) {
        if (v.pdfFile === req.params.fileName) { v.pdfFile = ''; changed = true }
      }
      if (changed) await sec.save()
    }

    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ═══ PDF Service Test — ทดสอบเชื่อมต่อ PDF Watermark Service ═══
router.get('/pdf-service/health', auth, admin, async (req, res) => {
  try {
    const url = process.env.PDF_SERVICE_URL
    if (!url) return res.json({ ok: false, message: 'PDF_SERVICE_URL not set' })

    const apiKey = process.env.INTERNAL_API_KEY || ''
    const start = Date.now()
    const resp = await fetch(`${url}/health`)
    const data = await resp.json()
    data.latency = Date.now() - start
    data.url = url
    res.json(data)
  } catch (err) {
    res.json({ ok: false, message: err.message })
  }
})

// GET /api/admin/pdf-service/files — รายการไฟล์ใน Bunny
router.get('/pdf-service/files', auth, admin, async (req, res) => {
  try {
    const url = process.env.PDF_SERVICE_URL
    const apiKey = process.env.INTERNAL_API_KEY
    if (!url || !apiKey) return res.json({ files: [] })
    const resp = await fetch(`${url}/files`, { headers: { 'X-API-Key': apiKey } })
    const data = await resp.json()
    res.json(data)
  } catch (err) { res.json({ files: [] }) }
})

// POST /api/admin/pdf-service/test-watermark — ส่งงาน ได้ jobId
router.post('/pdf-service/test-watermark', auth, admin, async (req, res) => {
  try {
    const url = process.env.PDF_SERVICE_URL
    const apiKey = process.env.INTERNAL_API_KEY
    if (!url || !apiKey) return res.status(400).json({ message: 'PDF_SERVICE_URL or INTERNAL_API_KEY not set' })

    const { fileName } = req.body
    if (!fileName) return res.status(400).json({ message: 'fileName required' })

    const u = req.user
    const now = new Date()
    const dateStr = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const userName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Admin'
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip

    const resp = await fetch(`${url}/watermark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        fileName,
        blockLines: [userName, 'ADMIN TEST', u.email || '', dateStr, 'Ref: ADMTEST1'],
        microText: `${u.email || ''} ADMIN-TEST`,
        userName, refId: 'ADMTEST1', userId: (u._id || '').toString(),
        email: u.email || '', nationalId: '', phone: '',
        clientIp, dateStr, nameEn: 'ADMIN TEST', university: 'ADMIN',
        pdfTitle: `TEST — ${fileName}`
      })
    })

    const data = await resp.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message })
  }
})

// GET /api/admin/pdf-service/status/:jobId — poll สถานะ
router.get('/pdf-service/status/:jobId', auth, admin, async (req, res) => {
  try {
    const url = process.env.PDF_SERVICE_URL
    const apiKey = process.env.INTERNAL_API_KEY
    const resp = await fetch(`${url}/status/${req.params.jobId}`, { headers: { 'X-API-Key': apiKey } })
    const data = await resp.json()
    res.json(data)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/pdf-service/download/:jobId — ดาวน์โหลด PDF
router.get('/pdf-service/download/:jobId', auth, admin, async (req, res) => {
  try {
    const url = process.env.PDF_SERVICE_URL
    const apiKey = process.env.INTERNAL_API_KEY
    const resp = await fetch(`${url}/download/${req.params.jobId}`, { headers: { 'X-API-Key': apiKey } })
    if (!resp.ok) { const d = await resp.json().catch(() => ({})); return res.status(resp.status).json(d) }
    res.setHeader('Content-Type', 'application/pdf')
    const { Readable } = require('stream')
    Readable.fromWeb(resp.body).pipe(res)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
