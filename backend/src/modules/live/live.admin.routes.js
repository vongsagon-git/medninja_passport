const express = require('express')
const LiveSession = require('./LiveSession.model')
const LiveContent = require('./LiveContent.model')

const WS_URL = process.env.WS_URL || 'https://ws.medninja.academy'
const WS_API_KEY = process.env.INTERNAL_API_KEY

// Broadcast kick ไป WS server → ทุกคนใน package ถูก kick
async function broadcastLiveKick(packageId) {
  try {
    await fetch(`${WS_URL}/api/live-kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': WS_API_KEY || '' },
      body: JSON.stringify({ packageId: packageId?.toString() })
    })
  } catch {}
}

const router = express.Router()
const liveRoutes = require('./live.routes')

// ═══════════════════════════════════════════════
// LIVE CONTENT (Preset เนื้อหา)
// ════════════════════════════════════��══════════

// GET /api/admin/live/content — รายการเนื้อหาทั้งหมด
router.get('/content', async (req, res) => {
  try {
    const contents = await LiveContent.find().sort({ updatedAt: -1 }).lean()
    // count sessions ที่ใช้ content แต่ละตัว
    const sessionCounts = await LiveSession.aggregate([
      { $group: { _id: '$liveContentId', count: { $sum: 1 } } }
    ])
    const countMap = {}
    sessionCounts.forEach(s => { countMap[s._id?.toString()] = s.count })
    const result = contents.map(c => ({ ...c, sessionCount: countMap[c._id.toString()] || 0 }))
    res.json({ contents: result })
  } catch (err) {
    console.error('admin live content list error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// POST /api/admin/live/content — สร้างเนื้อหาใหม่
router.post('/content', async (req, res) => {
  try {
    const { title, bunnyVideoId, bunnyDrmVideoId, pdfFiles } = req.body
    if (!title || !bunnyVideoId || !bunnyDrmVideoId) return res.status(400).json({ message: 'กรุณากรอก title + Video NO DRM + Video DRM' })

    // auto-fetch duration จาก Bunny API
    let videoDurationSec = 0
    try {
      const demoApiKey = process.env.BUNNY_DEMO_API_KEY
      const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'
      if (demoApiKey) {
        const resp = await fetch(`https://video.bunnycdn.com/library/${demoLibId}/videos/${bunnyVideoId}`, {
          headers: { AccessKey: demoApiKey }
        })
        if (resp.ok) {
          const data = await resp.json()
          videoDurationSec = Math.round(data.length || 0)
        }
      }
    } catch (e) { console.warn('Bunny duration fetch failed:', e.message) }

    const cleanTitle = title.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i, '').trim()
    const content = await LiveContent.create({
      title: cleanTitle,
      bunnyVideoId,
      bunnyDrmVideoId,
      videoDurationSec,
      pdfFiles: pdfFiles || []
    })

    res.status(201).json({ content })
  } catch (err) {
    console.error('admin live content create error:', err.message)
    res.status(500).json({ message: 'สร้างไม่สำเร็จ' })
  }
})

// PATCH /api/admin/live/content/:id — toggle enabled
router.patch('/content/:id', async (req, res) => {
  try {
    const { enabled } = req.body
    await LiveContent.findByIdAndUpdate(req.params.id, { enabled })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/admin/live/content/:id — แก้ไขเนื้อหา
router.put('/content/:id', async (req, res) => {
  try {
    const { title, bunnyVideoId, bunnyDrmVideoId, pdfFiles } = req.body
    const update = {}
    if (title) update.title = title.replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i, '').trim()
    if (bunnyDrmVideoId !== undefined) update.bunnyDrmVideoId = bunnyDrmVideoId || ''
    if (pdfFiles !== undefined) update.pdfFiles = pdfFiles

    // ถ้าเปลี่ยน video → fetch duration ใ��ม่
    if (bunnyVideoId) {
      update.bunnyVideoId = bunnyVideoId
      try {
        const demoApiKey = process.env.BUNNY_DEMO_API_KEY
        const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'
        if (demoApiKey) {
          const resp = await fetch(`https://video.bunnycdn.com/library/${demoLibId}/videos/${bunnyVideoId}`, {
            headers: { AccessKey: demoApiKey }
          })
          if (resp.ok) {
            const data = await resp.json()
            update.videoDurationSec = Math.round(data.length || 0)
          }
        }
      } catch (e) { console.warn('Bunny duration fetch failed:', e.message) }
    }

    const content = await LiveContent.findByIdAndUpdate(req.params.id, update, { new: true }).lean()
    if (!content) return res.status(404).json({ message: 'ไม่พบเนื้อหา' })

    // อัพเดท title + duration ใน sessions ที่อ้าง content นี้ (denormalized)
    if (update.title || update.videoDurationSec !== undefined) {
      const sessionUpdate = {}
      if (update.title) sessionUpdate.title = update.title
      if (update.videoDurationSec !== undefined) sessionUpdate.videoDurationSec = update.videoDurationSec
      await LiveSession.updateMany({ liveContentId: req.params.id }, sessionUpdate)
    }

    res.json({ content })
  } catch (err) {
    console.error('admin live content update error:', err.message)
    res.status(500).json({ message: 'แ��้ไขไม่สำเร็จ' })
  }
})

// DELETE /api/admin/live/content/:id — ลบเน���้อหา
router.delete('/content/:id', async (req, res) => {
  try {
    // เช็คว่ามี session อ้างอยู่ไหม
    const usedCount = await LiveSession.countDocuments({ liveContentId: req.params.id })
    if (usedCount > 0) return res.status(400).json({ message: `ลบไม่ได้ — ��ี ${usedCount} ตารางที่ใช้เนื้อหานี้อยู่` })

    await LiveContent.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('admin live content delete error:', err.message)
    res.status(500).json({ message: 'ลบไม่สำเร็จ' })
  }
})

// ═══���═════════════════════════════��═════════════
// LIVE SESSION (ตาราง — schedule)
// ════════���═════════════════��════════════════════

// GET /api/admin/live — รายการตารางทั้งหมด
router.get('/', async (req, res) => {
  try {
    const sessions = await LiveSession.find().sort({ scheduledAt: -1 }).populate('liveContentId').lean()
    const Package = require('../content/Package.model')
    const pkgIds = [...new Set(sessions.map(s => s.packageId?.toString()).filter(Boolean))]
    const pkgs = await Package.find({ _id: { $in: pkgIds } }).select('title').lean()
    const pkgMap = {}
    pkgs.forEach(p => { pkgMap[p._id.toString()] = p.title })

    const result = sessions.map(s => ({
      ...s,
      packageName: pkgMap[s.packageId?.toString()] || 'ไม่ทราบ',
      computedStatus: computeStatus(s)
    }))

    res.json({ sessions: result })
  } catch (err) {
    console.error('admin live list error:', err.message)
    res.status(500).json({ message: 'โหลดข้อ��ูลไม่สำเร็จ' })
  }
})

// POST /api/admin/live — สร้างตาราง (เลือก preset + คอร์ส + เวลา)
router.post('/', async (req, res) => {
  try {
    const { liveContentId, scheduledAt, packageId } = req.body
    if (!liveContentId || !scheduledAt || !packageId) {
      return res.status(400).json({ message: 'กรุณาเลือกเนื้อหา + คอร์ส + เวลา' })
    }

    // ดึง content เพื่อ denormalize
    const content = await LiveContent.findById(liveContentId).lean()
    if (!content) return res.status(404).json({ message: 'ไม���พบเนื้อหาที่เลือก' })

    const videoDurationSec = content.videoDurationSec || 0

    // เช็คซ้อนเวลา (คอร์สเดียวกัน)
    const newStart = new Date(scheduledAt).getTime()
    const newEnd = newStart + (videoDurationSec || 3600) * 1000
    const samePkgLives = await LiveSession.find({ packageId }).lean()
    const conflict = samePkgLives.find(s => {
      const sStart = new Date(s.scheduledAt).getTime()
      const sEnd = sStart + (s.videoDurationSec || 3600) * 1000
      return newStart < sEnd && newEnd > sStart
    })
    if (conflict) {
      const cTime = new Date(conflict.scheduledAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      return res.status(400).json({ message: `ช่องนี้มีไลฟ์ซ้อน "${conflict.title}" (${cTime})` })
    }

    const session = await LiveSession.create({
      liveContentId,
      packageId,
      scheduledAt: new Date(scheduledAt),
      title: content.title,
      videoDurationSec
    })

    // kick ทุกคนในห้อง → เข้าใหม่เพื่อเจอตารางใหม่
    broadcastLiveKick(packageId)
    res.status(201).json({ session })
  } catch (err) {
    console.error('admin live create error:', err.message)
    res.status(500).json({ message: 'สร้างไม่สำเร็จ' })
  }
})

// PUT /api/admin/live/:id — แก้ไขตาราง (เปลี่ยน content, คอร์ส, เวลา)
router.put('/:id', async (req, res) => {
  try {
    const { liveContentId, scheduledAt, packageId } = req.body
    const update = {}
    if (scheduledAt) update.scheduledAt = new Date(scheduledAt)
    if (packageId) update.packageId = packageId

    // ถ้าเปลี่ยน content → denormalize ใหม่
    if (liveContentId) {
      update.liveContentId = liveContentId
      const content = await LiveContent.findById(liveContentId).lean()
      if (content) {
        update.title = content.title
        update.videoDurationSec = content.videoDurationSec || 0
      }
    }

    // เช็ค conflict
    if (scheduledAt || packageId || liveContentId) {
      const existing = await LiveSession.findById(req.params.id).lean()
      if (existing) {
        const dur = update.videoDurationSec || existing.videoDurationSec || 3600
        const eStart = new Date(scheduledAt || existing.scheduledAt).getTime()
        const eEnd = eStart + dur * 1000
        const pkgId = packageId || existing.packageId
        const samePkgLives = await LiveSession.find({ packageId: pkgId, _id: { $ne: req.params.id } }).lean()
        const conflict = samePkgLives.find(s => {
          const sStart = new Date(s.scheduledAt).getTime()
          const sEnd = sStart + (s.videoDurationSec || 3600) * 1000
          return eStart < sEnd && eEnd > sStart
        })
        if (conflict) {
          const cTime = new Date(conflict.scheduledAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          return res.status(400).json({ message: `ช่องนี้มีไลฟ์ซ้อน "${conflict.title}" (${cTime})` })
        }
      }
    }

    // แก้ session ตรงๆ (ไม่ cancel + สร้างใหม่ เพื่อป้องกัน session หาย)
    const session = await LiveSession.findByIdAndUpdate(req.params.id, update, { new: true }).lean()
    if (!session) return res.status(404).json({ message: 'ไม่พบตาราง' })
    // kick ทุกคนในห้อง → เข้าใหม่เพื่อโหลด content ใหม่
    broadcastLiveKick(session.packageId)
    res.json({ session })
  } catch (err) {
    console.error('admin live update error:', err.message)
    res.status(500).json({ message: 'แก้���ขไม่สำเร็��' })
  }
})

// POST /api/admin/live/:id/cancel — ยกเลิกตารางกะทันหัน (ระหว่างสดหรือรอ)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body
    const session = await LiveSession.findByIdAndUpdate(req.params.id, {
      cancelled: true,
      cancelledAt: new Date(),
      cancelReason: reason || 'ยกเลิกโดย Admin'
    }, { new: true }).lean()
    if (!session) return res.status(404).json({ message: 'ไม่พบตาราง' })
    broadcastLiveKick(session.packageId)
    res.json({ ok: true, session })
  } catch (err) {
    console.error('admin live cancel error:', err.message)
    res.status(500).json({ message: 'ยกเลิกไม่สำเร็จ' })
  }
})

// POST /api/admin/live/:id/uncancel — ยกเลิกการ cancel (เปิดกลับ)
router.post('/:id/uncancel', async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(req.params.id, {
      cancelled: false, cancelledAt: null, cancelReason: ''
    }, { new: true }).lean()
    if (!session) return res.status(404).json({ message: 'ไม่พบตาราง' })
    broadcastLiveKick(session.packageId)
    res.json({ ok: true, session })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/admin/live/:id — ลบตาราง (cancel ก่อนลบ เพื่อ kick คนในห้อง)
router.delete('/:id', async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).lean()
    // socket kick ทันที
    if (session) broadcastLiveKick(session.packageId)
    await LiveSession.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('admin live delete error:', err.message)
    res.status(500).json({ message: 'ลบไม่สำเร็จ' })
  }
})

// GET /api/admin/live/stats — จำนวนคนดู live แต่ละช่อง (realtime)
router.get('/stats', async (req, res) => {
  try {
    const { getViewersList } = require('../content/content.socket')
    const allViewers = getViewersList()
    const liveViewers = {}
    for (const v of allViewers) {
      if (v.liveId) {
        if (!liveViewers[v.liveId]) liveViewers[v.liveId] = 0
        liveViewers[v.liveId]++
      }
    }
    const sessions = await LiveSession.find().lean()
    const pkgViewers = {}
    for (const s of sessions) {
      const pid = s.packageId?.toString() || ''
      const count = liveViewers[s._id?.toString()] || 0
      if (!pkgViewers[pid]) pkgViewers[pid] = 0
      pkgViewers[pid] += count
    }
    res.json({ liveViewers, pkgViewers, totalLiveViewers: allViewers.filter(v => v.liveId).length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/live/upload-pdf/:videoId — อ���พโหลด PDF สำหรับ video (ใช้ใน admin)
const multer = require('multer')
const uploadMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
router.post('/upload-pdf/:videoId', uploadMem.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไ���ล์ PDF' })
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.status(500).json({ message: 'Bunny Storage ยังไม่ได้ setup' })

    const fileName = `${req.params.videoId}.pdf`
    const uploadUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`
    const uploadResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'AccessKey': storageKey, 'Content-Type': 'application/pdf' },
      body: req.file.buffer
    })
    if (!uploadResp.ok) {
      const body = await uploadResp.text()
      return res.status(502).json({ message: `Upload ไม่สำเร็จ: ${body}` })
    }

    // อัพเดท Section ที่มี video UUID เดียวกัน (ถ้ามี)
    const Section = require('../content/Section.model')
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

    if (liveRoutes.clearPdfCache) liveRoutes.clearPdfCache()
    res.json({ ok: true })
  } catch (err) {
    console.error('live upload-pdf error:', err.message)
    res.status(500).json({ message: 'Upload ไม่สำเร็จ' })
  }
})

// GET /api/admin/live/check-pdf/:videoId — เช็คว่า video นี้มี PDF ��หม
router.get('/check-pdf/:videoId', async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (!storageKey) return res.json({ hasPdf: false })

    const checkUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${req.params.videoId}.pdf`
    const resp = await fetch(checkUrl, { method: 'HEAD', headers: { 'AccessKey': storageKey } })
    res.json({ hasPdf: resp.ok })
  } catch {
    res.json({ hasPdf: false })
  }
})

function computeStatus(s) {
  const now = Date.now()
  const start = new Date(s.scheduledAt).getTime()
  const end = start + (s.videoDurationSec || 0) * 1000
  if (now < start) return 'waiting'
  if (now > end) return 'ended'
  return 'live'
}

module.exports = router
