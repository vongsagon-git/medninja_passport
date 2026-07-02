const router = require('express').Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const FlashcardPattern = require('./FlashcardPattern.model')
const FlashcardAttempt = require('./FlashcardAttempt.model')
const FlashcardCC = require('./FlashcardCC.model')
const FlashcardDDx = require('./FlashcardDDx.model')

// ═══ Static routes FIRST (ก่อน /:id) ═══

// GET /api/admin/flashcard — ดู pattern cards ทั้งหมด
router.get('/', auth, admin, async (req, res) => {
  try {
    const patterns = await FlashcardPattern.find().sort({ order: 1 }).lean()
    const totalAttempts = await FlashcardAttempt.countDocuments()
    const uniquePlayers = await FlashcardAttempt.distinct('lineUserId')
    res.json({ patterns, stats: { totalPatterns: patterns.length, totalAttempts, uniquePlayers: uniquePlayers.length } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard — เพิ่ม pattern card
router.post('/', auth, admin, async (req, res) => {
  try {
    const { pattern, answer, mnemonic, category } = req.body
    if (!pattern || !answer) return res.status(400).json({ error: 'ต้องมี pattern และ answer' })
    const maxOrder = await FlashcardPattern.findOne().sort({ order: -1 }).lean()
    const order = (maxOrder?.order || 0) + 1
    const card = await FlashcardPattern.create({ pattern, answer, mnemonic: mnemonic || '', category: category || '', order })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/seed — seed pattern data
router.post('/seed', auth, admin, async (req, res) => {
  try {
    const { seedFlashcards } = require('./flashcard.seed')
    await seedFlashcards({ force: true })
    const count = await FlashcardPattern.countDocuments()
    res.json({ ok: true, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══ CC Cards CRUD ═══

// GET /api/admin/flashcard/cc
router.get('/cc', auth, admin, async (req, res) => {
  try {
    const cards = await FlashcardCC.find().sort({ order: 1 }).lean()
    res.json({ cards })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/cc
router.post('/cc', auth, admin, async (req, res) => {
  try {
    const { cc, ccEn, ddxList } = req.body
    if (!cc) return res.status(400).json({ error: 'ต้องมี CC' })
    const maxOrder = await FlashcardCC.findOne().sort({ order: -1 }).lean()
    const order = (maxOrder?.order || 0) + 1
    const list = Array.isArray(ddxList) ? ddxList : (ddxList || '').split(',').map(s => s.trim()).filter(Boolean)
    const card = await FlashcardCC.create({ cc, ccEn: ccEn || '', ddxList: list, ddxCount: list.length, order })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/cc/seed
router.post('/cc/seed', auth, admin, async (req, res) => {
  try {
    const { seedFlashcardCC } = require('./flashcardCC.seed')
    await seedFlashcardCC({ force: true })
    const count = await FlashcardCC.countDocuments()
    res.json({ ok: true, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/flashcard/cc/:id
router.put('/cc/:id', auth, admin, async (req, res) => {
  try {
    const { cc, ccEn, ddxList, isActive, order } = req.body
    const list = Array.isArray(ddxList) ? ddxList : (ddxList || '').split(',').map(s => s.trim()).filter(Boolean)
    const card = await FlashcardCC.findByIdAndUpdate(req.params.id, { cc, ccEn, ddxList: list, ddxCount: list.length, isActive, order }, { new: true })
    if (!card) return res.status(404).json({ error: 'ไม่พบ CC card' })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/flashcard/cc/:id
router.delete('/cc/:id', auth, admin, async (req, res) => {
  try {
    await FlashcardCC.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══ Players / Analytics ═══

// GET /api/admin/flashcard/players
router.get('/players', auth, admin, async (req, res) => {
  try {
    const players = await FlashcardAttempt.find().sort({ lastPlayedAt: -1 }).lean()

    // เพิ่ม Path progress ของแต่ละคน
    const NinjaProgress = require('./NinjaProgress.model')
    const allProgress = await NinjaProgress.find().lean()
    const progressMap = {}
    allProgress.forEach(p => {
      if (!progressMap[p.lineUserId]) progressMap[p.lineUserId] = { chapters: 0, bosses: 0, badges: [] }
      progressMap[p.lineUserId].chapters++
      if (p.bossCleared) {
        progressMap[p.lineUserId].bosses++
        progressMap[p.lineUserId].badges.push(p.chapter)
      }
    })

    const enriched = players.map(p => ({
      ...p,
      pathProgress: progressMap[p.lineUserId] || { chapters: 0, bosses: 0, badges: [] },
    }))

    res.json({ players: enriched, total: enriched.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/flashcard/analytics — วิเคราะห์การ์ดที่คนจำไม่ได้
router.get('/analytics', auth, admin, async (req, res) => {
  try {
    const totalPlayers = await FlashcardAttempt.countDocuments()
    const players = await FlashcardAttempt.find({ scoreHistory: { $exists: true, $ne: [] } }).select('scoreHistory').lean()

    // รวม wrongCards ทุกคนทุกรอบ นับจำนวนครั้ง
    const wrongCount = {}
    let totalRounds = 0
    for (const p of players) {
      for (const round of (p.scoreHistory || [])) {
        totalRounds++
        for (const card of (round.wrongCards || [])) {
          wrongCount[card] = (wrongCount[card] || 0) + 1
        }
      }
    }

    // เรียงจากผิดมากสุด
    const topWrong = Object.entries(wrongCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([card, count]) => ({ card, count, pct: totalRounds ? Math.round(count / totalRounds * 100) : 0 }))

    res.json({ totalPlayers, totalRounds, topWrong })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/reset-scores — ล้างคะแนน + scoreHistory (ดาว/level ยังอยู่)
router.post('/reset-scores', auth, admin, async (req, res) => {
  try {
    await FlashcardAttempt.updateMany({}, { $set: { lastScore: null, scoreHistory: [] } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/flashcard/toggle/:id — toggle publish/unpublish pattern
router.patch('/toggle/:id', auth, admin, async (req, res) => {
  try {
    const card = await FlashcardPattern.findById(req.params.id)
    if (!card) return res.status(404).json({ error: 'ไม่พบการ์ด' })
    card.isActive = !card.isActive
    await card.save()
    res.json({ ok: true, isActive: card.isActive })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/flashcard/cc/toggle/:id — toggle publish/unpublish CC
router.patch('/cc/toggle/:id', auth, admin, async (req, res) => {
  try {
    const card = await FlashcardCC.findById(req.params.id)
    if (!card) return res.status(404).json({ error: 'ไม่พบ CC card' })
    card.isActive = !card.isActive
    await card.save()
    res.json({ ok: true, isActive: card.isActive })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/flashcard/publish-all — publish ทั้งหมด
router.patch('/publish-all', auth, admin, async (req, res) => {
  try {
    const { type } = req.body // 'pattern' | 'cc' | 'ddx'
    if (type === 'cc') {
      await FlashcardCC.updateMany({}, { isActive: true })
    } else if (type === 'ddx') {
      await FlashcardDDx.updateMany({}, { isActive: true })
    } else {
      await FlashcardPattern.updateMany({}, { isActive: true })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/flashcard/unpublish-all — unpublish ทั้งหมด
router.patch('/unpublish-all', auth, admin, async (req, res) => {
  try {
    const { type } = req.body
    if (type === 'cc') {
      await FlashcardCC.updateMany({}, { isActive: false })
    } else if (type === 'ddx') {
      await FlashcardDDx.updateMany({}, { isActive: false })
    } else {
      await FlashcardPattern.updateMany({}, { isActive: false })
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══ DDx Cards CRUD ═══

// GET /api/admin/flashcard/ddx
router.get('/ddx', auth, admin, async (req, res) => {
  try {
    const cards = await FlashcardDDx.find().sort({ order: 1 }).lean()
    res.json({ cards })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/ddx
router.post('/ddx', auth, admin, async (req, res) => {
  try {
    const { ddx, ddxTh, relatedCC, clue, history, pe, investigation, category } = req.body
    if (!ddx) return res.status(400).json({ error: 'ต้องมีชื่อ DDx' })
    const maxOrder = await FlashcardDDx.findOne().sort({ order: -1 }).lean()
    const order = (maxOrder?.order || 0) + 1
    const ccList = Array.isArray(relatedCC) ? relatedCC : (relatedCC || '').split(',').map(s => s.trim()).filter(Boolean)
    const card = await FlashcardDDx.create({ ddx, ddxTh: ddxTh || '', relatedCC: ccList, clue: clue || '', history: history || '', pe: pe || '', investigation: investigation || '', category: category || '', order })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/flashcard/ddx/seed — seed DDx จาก CC
router.post('/ddx/seed', auth, admin, async (req, res) => {
  try {
    const { seedFlashcardDDx } = require('./flashcardDDx.seed')
    await seedFlashcardDDx({ force: true })
    const count = await FlashcardDDx.countDocuments()
    res.json({ ok: true, count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/flashcard/ddx/:id
router.put('/ddx/:id', auth, admin, async (req, res) => {
  try {
    const { ddx, ddxTh, relatedCC, clue, history, pe, investigation, category, isActive, order } = req.body
    const ccList = Array.isArray(relatedCC) ? relatedCC : (relatedCC || '').split(',').map(s => s.trim()).filter(Boolean)
    const card = await FlashcardDDx.findByIdAndUpdate(req.params.id, { ddx, ddxTh, relatedCC: ccList, clue, history, pe, investigation, category, isActive, order }, { new: true })
    if (!card) return res.status(404).json({ error: 'ไม่พบ DDx card' })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/flashcard/ddx/:id
router.delete('/ddx/:id', auth, admin, async (req, res) => {
  try {
    await FlashcardDDx.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/flashcard/ddx/toggle/:id
router.patch('/ddx/toggle/:id', auth, admin, async (req, res) => {
  try {
    const card = await FlashcardDDx.findById(req.params.id)
    if (!card) return res.status(404).json({ error: 'ไม่พบ DDx card' })
    card.isActive = !card.isActive
    await card.save()
    res.json({ ok: true, isActive: card.isActive })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══ Pattern /:id routes LAST ═══

// PUT /api/admin/flashcard/:id — แก้ไข pattern card
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { pattern, answer, mnemonic, category, isActive, order } = req.body
    const card = await FlashcardPattern.findByIdAndUpdate(req.params.id, { pattern, answer, mnemonic, category, isActive, order }, { new: true })
    if (!card) return res.status(404).json({ error: 'ไม่พบการ์ด' })
    res.json(card)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/flashcard/:id — ลบ pattern card
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await FlashcardPattern.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
