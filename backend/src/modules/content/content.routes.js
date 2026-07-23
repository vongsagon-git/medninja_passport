const express = require('express')
const router = express.Router()
const { getSection, getVideo, heartbeat, clearHeartbeat, clientLog } = require('./content.controller')
const chromeOnly = require('../../shared/middleware/chromeOnly')

// auth + profileGuard + requireLine ถูก apply แล้วที่ app.use('/api/my', ...) ใน app.js
router.get('/sections/:id', getSection)
// chromeOnly: ไม่ส่ง Bunny embedUrl ถ้า browser ไม่ใช่ Chrome บน Desktop
router.get('/sections/:id/videos/:idx', chromeOnly, getVideo)
router.post('/heartbeat', heartbeat)
router.delete('/heartbeat', clearHeartbeat)
router.post('/client-log', clientLog)

// ── PDF (queue-based flow: submit → poll → download พร้อมลายน้ำ) ──
// ทุก PDF (video / bonus / topic / subtopic) ต้องผ่าน consent modal → pdf-start → poll → download
const { startPdfJob, startGroupPdfJob, getPdfJobStatus, downloadPdfJob, cancelPdfJob } = require('./pdf.controller')
router.post('/sections/:id/videos/:idx/pdf-start', startPdfJob)
router.post('/sections/:id/group-pdf-start/:type/:groupName', startGroupPdfJob)
router.get('/pdf-job/:jobId/status', getPdfJobStatus)
router.get('/pdf-job/:jobId/download', downloadPdfJob)
router.post('/pdf-job/:jobId/cancel', cancelPdfJob)

// ── Watch Progress (resume + mark as studied) ──
const WatchProgress = require('./WatchProgress.model')
const Activation = require('../activation/Activation.model')
const Package = require('./Package.model')

// helper: เช็คว่า user มีสิทธิ์เข้า section นี้ (admin bypass)
async function hasAccessToSection(user, sectionId) {
  if (user.role === 'admin') return true
  const activations = await Activation.find({
    userId: user._id, isActive: true, expiresAt: { $gt: new Date() }
  }).select('packageId').lean()
  if (!activations.length) return false
  const hasAccess = await Package.exists({
    _id: { $in: activations.map(a => a.packageId) },
    sections: sectionId
  })
  return !!hasAccess
}

// POST /api/my/watch-progress — บันทึก progress (เรียกจาก heartbeat)
router.post('/watch-progress', async (req, res) => {
  try {
    const { sectionId, videoIndex, currentTime, watched, isBonus } = req.body
    if (!sectionId || videoIndex === undefined) return res.status(400).json({ message: 'missing fields' })

    // ตรวจสิทธิ์ — ต้องมี activation สำหรับ section นี้
    if (!(await hasAccessToSection(req.user, sectionId))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }

    const update = {}
    if (currentTime !== undefined) update.currentTime = currentTime
    if (watched !== undefined) update.watched = watched

    await WatchProgress.findOneAndUpdate(
      { userId: req.user._id, sectionId, videoIndex, isBonus: !!isBonus },
      { $set: update },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('watch-progress save error:', err.message)
    res.json({ ok: false })
  }
})

// GET /api/my/watch-progress/:sectionId — ดึง progress ทั้ง section
router.get('/watch-progress/:sectionId', async (req, res) => {
  try {
    // ตรวจสิทธิ์
    if (!(await hasAccessToSection(req.user, req.params.sectionId))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }

    const progress = await WatchProgress.find({
      userId: req.user._id,
      sectionId: req.params.sectionId
    }).select('videoIndex currentTime watched isBonus').lean()
    res.json({ progress })
  } catch (err) {
    console.error('watch-progress get error:', err.message)
    res.json({ progress: [] })
  }
})

module.exports = router
