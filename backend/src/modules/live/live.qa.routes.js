const express = require('express')
const LiveQuestion = require('./LiveQuestion.model')
const Activation = require('../activation/Activation.model')

const router = express.Router()

// ═══ Student routes ═══

// GET /api/my/qa/:packageId — ดึงคำถามทั้งหมดของคอร์ส
router.get('/my/qa/:packageId', async (req, res) => {
  try {
    const userId = req.user._id
    const packageId = req.params.packageId

    // ตรวจสิทธิ์: ต้องลงคอร์ส + qaEnabled
    if (req.user.role !== 'admin') {
      const activation = await Activation.findOne({
        userId, packageId, isActive: true, expiresAt: { $gt: new Date() }
      }).lean()
      if (!activation) return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
      if (!activation.qaEnabled) return res.status(403).json({ message: 'ไม่มีสิทธิ์ Q&A — ติดต่อ Admin', code: 'QA_DISABLED' })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const total = await LiveQuestion.countDocuments({ packageId })
    const questions = await LiveQuestion.find({ packageId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

    const isAdmin = req.user.role === 'admin'
    const result = questions.map(q => ({
      _id: q._id,
      question: q.question,
      source: q.source || 'general',
      sessionTitle: q.sessionTitle || '',
      videoTimeSec: q.videoTimeSec,
      answer: q.answer || '',
      answeredAt: q.answeredAt,
      createdAt: q.createdAt,
      isOwn: q.userId.toString() === userId.toString(),
      displayName: isAdmin ? q.userName : 'นักเรียน',
      userId: isAdmin ? q.userId : undefined
    }))

    res.json({ questions: result, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('qa list error:', err.message)
    res.status(500).json({ message: 'โหลดคำถามไม่สำเร็จ' })
  }
})

// POST /api/my/qa/:packageId — ส่งคำถาม
router.post('/my/qa/:packageId', async (req, res) => {
  try {
    const userId = req.user._id
    const packageId = req.params.packageId
    const { question, videoTimeSec, sessionId, source } = req.body
    if (!question || !question.trim()) return res.status(400).json({ message: 'กรุณาพิมพ์คำถาม' })

    // ตรวจสิทธิ์: ต้องลงคอร์ส + qaEnabled
    if (req.user.role !== 'admin') {
      const activation = await Activation.findOne({
        userId, packageId, isActive: true, expiresAt: { $gt: new Date() }
      }).lean()
      if (!activation) return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
      if (!activation.qaEnabled) return res.status(403).json({ message: 'ไม่มีสิทธิ์ Q&A — ติดต่อ Admin', code: 'QA_DISABLED' })
    }

    const u = req.user
    const userName = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.name || '')

    // ดึง session title ถ้ามี
    let sessionTitle = ''
    if (sessionId) {
      const LiveSession = require('./LiveSession.model')
      const sess = await LiveSession.findById(sessionId).select('title').lean()
      sessionTitle = sess?.title || ''
    }

    const doc = await LiveQuestion.create({
      packageId,
      sessionId: sessionId || null,
      sessionTitle,
      userId,
      userName,
      question: question.trim(),
      source: source || 'general',
      videoTimeSec: videoTimeSec != null ? videoTimeSec : null
    })

    // LINE แจ้ง admin
    const timeLabel = videoTimeSec != null
      ? `${Math.floor(videoTimeSec / 60)}:${String(videoTimeSec % 60).padStart(2, '0')}`
      : source === 'live' ? 'ระหว่างไลฟ์' : 'ทั่วไป'

    const Package = require('../content/Package.model')
    const pkg = await Package.findById(packageId).select('title').lean()

    try {
      const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
      const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'
      if (lineToken) {
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
          body: JSON.stringify({
            to: ADMIN_UID,
            messages: [{ type: 'flex', altText: `❓ คำถามจาก ${userName}`, contents: {
              type: 'bubble', size: 'kilo',
              header: { type: 'box', layout: 'vertical', backgroundColor: '#1e40af', paddingAll: '14px', contents: [
                { type: 'text', text: '❓ คำถามจากนักเรียน', color: '#FFFFFF', size: 'sm', weight: 'bold' }
              ]},
              body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', contents: [
                { type: 'text', text: userName, size: 'md', weight: 'bold', color: '#1e293b' },
                { type: 'separator', color: '#e2e8f0' },
                { type: 'box', layout: 'horizontal', contents: [
                  { type: 'text', text: 'คอร์ส', size: 'xs', color: '#94a3b8', flex: 2 },
                  { type: 'text', text: pkg?.title || packageId, size: 'xs', flex: 5, wrap: true }
                ]},
                { type: 'box', layout: 'horizontal', contents: [
                  { type: 'text', text: 'จาก', size: 'xs', color: '#94a3b8', flex: 2 },
                  { type: 'text', text: `${source === 'live' ? 'ไลฟ์' : 'ห้อง Q&A'} ${timeLabel}`, size: 'xs', flex: 5 }
                ]},
                { type: 'separator', color: '#e2e8f0', margin: 'sm' },
                { type: 'text', text: question.trim(), size: 'sm', wrap: true, margin: 'sm' }
              ]}
            }}]
          })
        }).catch(() => {})
      }
    } catch {}

    res.status(201).json({
      question: {
        _id: doc._id,
        question: doc.question,
        source: doc.source,
        sessionTitle: doc.sessionTitle,
        videoTimeSec: doc.videoTimeSec,
        answer: '',
        answeredAt: null,
        createdAt: doc.createdAt,
        isOwn: true,
        displayName: 'นักเรียน'
      }
    })
  } catch (err) {
    console.error('qa create error:', err.message)
    res.status(500).json({ message: 'ส่งคำถามไม่สำเร็จ' })
  }
})

// ═══ Admin routes ═══

// GET /api/admin/qa/:packageId — admin ดูคำถามทั้งหมดของคอร์ส
router.get('/admin/qa/:packageId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'เฉพาะ admin' })
    const questions = await LiveQuestion.find({ packageId: req.params.packageId })
      .sort({ createdAt: -1 }).lean()
    res.json({ questions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/qa/:questionId/answer — admin ตอบ/แก้ไขคำถาม+คำตอบ
router.post('/admin/qa/:questionId/answer', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'เฉพาะ admin' })
    const { answer, question } = req.body
    const update = {}
    if (answer !== undefined && answer.trim()) {
      update.answer = answer.trim()
      update.answeredAt = new Date()
      update.answeredBy = req.user._id
    }
    if (question !== undefined && question.trim()) {
      update.question = question.trim()
    }
    if (!Object.keys(update).length) return res.status(400).json({ message: 'ไม่มีข้อมูลให้อัพเดท' })

    const doc = await LiveQuestion.findByIdAndUpdate(req.params.questionId, update, { new: true }).lean()
    if (!doc) return res.status(404).json({ message: 'ไม่พบคำถาม' })
    res.json({ ok: true, question: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/admin/qa/:questionId — ลบคำถามไม่เหมาะสม
router.delete('/admin/qa/:questionId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'เฉพาะ admin' })
    await LiveQuestion.findByIdAndDelete(req.params.questionId)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/qa/:packageId/summary — สรุปส่ง LINE ทุกคนในคอร์ส
router.post('/admin/qa/:packageId/summary', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'เฉพาะ admin' })

    const packageId = req.params.packageId
    const questions = await LiveQuestion.find({
      packageId, answer: { $ne: '' }
    }).lean()
    if (!questions.length) return res.status(400).json({ message: 'ยังไม่มีคำตอบ' })

    const activations = await Activation.find({
      packageId, isActive: true, expiresAt: { $gt: new Date() }, qaEnabled: true
    }).select('userId').lean()

    const userIds = activations.map(a => a.userId)
    const User = require('../user/User.model')
    const users = await User.find({ _id: { $in: userIds }, lineUserId: { $ne: null } })
      .select('lineUserId').lean()

    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!lineToken) return res.status(500).json({ message: 'LINE token not configured' })

    const Package = require('../content/Package.model')
    const pkg = await Package.findById(packageId).select('title').lean()

    const LMS_DOMAIN = process.env.LMS_DOMAIN || 'medninja.academy'
    const qaUrl = `https://${LMS_DOMAIN}/qa/${packageId}`

    let sent = 0
    for (const u of users) {
      if (!u.lineUserId) continue
      try {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
          body: JSON.stringify({
            to: u.lineUserId,
            messages: [{ type: 'flex', altText: `📋 สรุป Q&A: ${pkg?.title || 'คอร์ส'}`, contents: {
              type: 'bubble', size: 'mega',
              header: { type: 'box', layout: 'vertical', backgroundColor: '#1e40af', paddingAll: '16px', contents: [
                { type: 'text', text: '📋 สรุปคำถาม-คำตอบ', color: '#FFFFFF', size: 'md', weight: 'bold' },
                { type: 'text', text: pkg?.title || 'คอร์ส', color: '#93c5fd', size: 'sm', margin: 'sm' }
              ]},
              body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px', contents: [
                { type: 'text', text: `${questions.length} คำถาม · ตอบครบแล้ว`, size: 'sm', color: '#475569' },
                { type: 'text', text: 'กดดูสรุปคำถาม-คำตอบทั้งหมด', size: 'xs', color: '#94a3b8', margin: 'sm' }
              ]},
              footer: { type: 'box', layout: 'vertical', paddingAll: '12px', contents: [
                { type: 'button', action: { type: 'uri', label: 'ดูสรุป Q&A', uri: qaUrl }, style: 'primary', color: '#2563eb' }
              ]}
            }}]
          })
        })
        sent++
      } catch {}
    }

    res.json({ ok: true, sent, total: users.length })
  } catch (err) {
    console.error('qa summary error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
