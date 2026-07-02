const router = require('express').Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const ArenaCard = require('./ArenaCard.model')
const ArenaPlayer = require('./ArenaPlayer.model')
const FlashcardPattern = require('../flashcard/FlashcardPattern.model')
const FlashcardCC = require('../flashcard/FlashcardCC.model')

router.use(auth, admin)

// GET /api/admin/arena/cards — ดูทั้งหมด (filter by cc, audit status)
router.get('/cards', async (req, res) => {
  try {
    const filter = {}
    if (req.query.cc) filter.relatedCC = req.query.cc
    if (req.query.audited === 'true') filter.isAudited = true
    if (req.query.audited === 'false') filter.isAudited = false
    if (['pending','approved','flagged','rejected'].includes(req.query.audited)) filter.auditStatus = req.query.audited
    const cards = await ArenaCard.find(filter).sort({ relatedCC: 1, ddx: 1 }).lean()
    const ccGroups = await ArenaCard.distinct('relatedCC', { relatedCC: { $ne: '' } })
    res.json({ ok: true, cards, ccGroups, total: cards.length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/cards — สร้างการ์ดใหม่
router.post('/cards', async (req, res) => {
  try {
    const card = await ArenaCard.create(req.body)
    res.json({ ok: true, card })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// PUT /api/admin/arena/cards/:id — แก้ไขการ์ด
router.put('/cards/:id', async (req, res) => {
  try {
    const card = await ArenaCard.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!card) return res.status(404).json({ ok: false, error: 'ไม่พบการ์ด' })
    res.json({ ok: true, card })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// DELETE /api/admin/arena/cards/:id — ลบการ์ด
router.delete('/cards/:id', async (req, res) => {
  try {
    await ArenaCard.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/cards/:id/audit — toggle audit
// POST /api/admin/arena/cards/:id/audit — toggle audit (backward compat)
router.post('/cards/:id/audit', async (req, res) => {
  try {
    const card = await ArenaCard.findById(req.params.id)
    if (!card) return res.status(404).json({ ok: false, error: 'ไม่พบการ์ด' })
    card.isAudited = !card.isAudited
    card.auditStatus = card.isAudited ? 'approved' : 'pending'
    await card.save()
    res.json({ ok: true, card })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/cards/:id/status — เปลี่ยน auditStatus
router.post('/cards/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['pending', 'approved', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'status ไม่ถูกต้อง' })
    }
    const card = await ArenaCard.findByIdAndUpdate(req.params.id, {
      auditStatus: status,
      isAudited: status === 'approved'
    }, { new: true })
    if (!card) return res.status(404).json({ ok: false, error: 'ไม่พบการ์ด' })
    res.json({ ok: true, card })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/audit-all
router.post('/audit-all', async (req, res) => {
  try {
    const filter = req.body.cc
      ? { relatedCC: req.body.cc, buzzwords: { $ne: '' }, auditStatus: { $ne: 'approved' } }
      : { buzzwords: { $ne: '' }, auditStatus: { $ne: 'approved' } }
    const result = await ArenaCard.updateMany(filter, { isAudited: true, auditStatus: 'approved' })
    res.json({ ok: true, modified: result.modifiedCount })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/unaudit-all — reset audit status กลับเป็น pending
router.post('/unaudit-all', async (req, res) => {
  try {
    const { type } = req.body // 'ddx' | 'pattern' | 'cc'
    let modified = 0
    if (type === 'pattern') {
      const result = await FlashcardPattern.updateMany({ isActive: true }, { isActive: false })
      modified = result.modifiedCount
    } else if (type === 'cc') {
      const result = await FlashcardCC.updateMany({ isActive: true }, { isActive: false })
      modified = result.modifiedCount
    } else {
      // default: DDx cards — match ทั้ง auditStatus:'approved' และ isAudited:true
      const base = req.body.cc ? { relatedCC: req.body.cc } : {}
      const filter = { ...base, $or: [{ auditStatus: 'approved' }, { isAudited: true }] }
      const result = await ArenaCard.updateMany(filter, { isAudited: false, auditStatus: 'pending' })
      modified = result.modifiedCount
    }
    res.json({ ok: true, modified })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/admin/arena/pending-play — ดึง pending DDx มาทดสอบ (สำหรับ audit)
router.get('/pending-play', async (req, res) => {
  try {
    const questions = []
    const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] } }
    const buildChoices = (correctDdx, correctDdxTh, decoys) => {
      const d = [...(decoys || [])]; shuffle(d)
      const choices = [{ ddx: correctDdx, ddxTh: correctDdxTh || '', _c: true }, ...d.slice(0, 3).map(name => ({ ddx: name, ddxTh: '' }))]
      shuffle(choices)
      const ci = choices.findIndex(c => c._c); choices.forEach(c => delete c._c)
      return { choices, _a: Buffer.from(String(ci)).toString('base64') }
    }

    // DDx pending — 5 ข้อ
    const pendingCards = await ArenaCard.find({
      auditStatus: { $in: ['pending', null] },
      isAudited: { $ne: true },
      relatedCC: { $ne: '' },
      'decoys.2': { $exists: true },
      $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }]
    }).lean()
    shuffle(pendingCards)
    for (const card of pendingCards.slice(0, 5)) {
      const { choices, _a } = buildChoices(card.ddx, card.ddxTh, card.decoys)
      questions.push({
        id: card._id, mode: 'ddx',
        history: card.history || [], pe: card.pe || [], investigation: card.investigation || [],
        relatedCC: card.relatedCC, relatedCCEn: card.relatedCCEn,
        choices, _a
      })
    }

    shuffle(questions)
    res.json({ ok: true, questions, pending: pendingCards.length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// POST /api/admin/arena/seed — seed จาก Excel (manual trigger)
router.post('/seed', async (req, res) => {
  try {
    const { seedArenaCards } = require('./arena.seed')
    await seedArenaCards({ force: req.body.force || false })
    const total = await ArenaCard.countDocuments()
    res.json({ ok: true, total })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// GET /api/admin/arena/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, audited, active] = await Promise.all([
      ArenaCard.countDocuments(),
      ArenaCard.countDocuments({ isAudited: true }),
      ArenaCard.countDocuments({ isActive: true })
    ])
    const ccStats = await ArenaCard.aggregate([
      { $match: { relatedCC: { $ne: '' } } },
      { $group: { _id: '$relatedCC', total: { $sum: 1 }, audited: { $sum: { $cond: ['$isAudited', 1, 0] } } } },
      { $sort: { _id: 1 } }
    ])
    res.json({ ok: true, total, audited, active, ccStats })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// PLAYERS — ดูผู้เล่นทั้งหมด (admin เห็น lineUserId เต็ม)
// GET /api/admin/arena/players?month=2026-04
// ═══════════════════════════════════════════
router.get('/players', async (req, res) => {
  try {
    const month = req.query.month // "2026-04" or empty = current
    const currentMonth = new Date().toISOString().slice(0, 7)
    const targetMonth = month || currentMonth

    const players = await ArenaPlayer.find().lean()

    // สร้าง list พร้อม score ตามเดือน
    const list = players.map(p => {
      let score = 0, games = 0
      if (targetMonth === p.monthlyMonth) {
        // เดือนปัจจุบันของ player
        score = p.monthlyScore || 0
        games = p.monthlyGames || 0
      } else {
        // ดูจาก monthlyHistory
        const hist = (p.monthlyHistory || []).find(h => h.month === targetMonth)
        if (hist) { score = hist.score || 0; games = hist.games || 0 }
      }
      return {
        _id: p._id,
        lineUserId: p.lineUserId,
        displayName: p.displayName,
        pictureUrl: p.pictureUrl,
        totalGames: p.totalGames,
        totalCorrect: p.totalCorrect,
        bestScore: p.bestScore,
        bestStreak: p.bestStreak,
        monthlyScore: score,
        monthlyGames: games,
        lastPlayedAt: p.lastPlayedAt
      }
    }).filter(p => p.monthlyScore > 0 || !month) // ถ้าเลือกเดือน → เฉพาะคนที่มีคะแนน
      .sort((a, b) => month ? (b.monthlyScore - a.monthlyScore) : (b.bestScore - a.bestScore))

    // available months สำหรับ dropdown
    const monthSet = new Set()
    monthSet.add(currentMonth)
    players.forEach(p => {
      if (p.monthlyMonth) monthSet.add(p.monthlyMonth)
      ;(p.monthlyHistory || []).forEach(h => { if (h.month) monthSet.add(h.month) })
    })
    const months = [...monthSet].sort().reverse()

    res.json({ ok: true, players: list, total: list.length, months, currentMonth: targetMonth })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// PATTERNS — ดู FlashcardPattern ทั้งหมด + toggle publish
// GET /api/admin/arena/patterns
// ═══════════════════════════════════════════
router.get('/patterns', async (req, res) => {
  try {
    const cards = await FlashcardPattern.find().sort({ category: 1, order: 1 }).lean()
    res.json({ ok: true, cards, total: cards.length, active: cards.filter(c => c.isActive).length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

router.post('/patterns/:id/toggle', async (req, res) => {
  try {
    const card = await FlashcardPattern.findById(req.params.id)
    if (!card) return res.status(404).json({ ok: false })
    card.isActive = !card.isActive
    await card.save()
    res.json({ ok: true, isActive: card.isActive })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// CC — ดู FlashcardCC ทั้งหมด + toggle publish
// GET /api/admin/arena/cc
// ═══════════════════════════════════════════
router.get('/cc', async (req, res) => {
  try {
    const cards = await FlashcardCC.find().sort({ order: 1 }).lean()
    res.json({ ok: true, cards, total: cards.length, active: cards.filter(c => c.isActive).length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

router.post('/cc/:id/toggle', async (req, res) => {
  try {
    const card = await FlashcardCC.findById(req.params.id)
    if (!card) return res.status(404).json({ ok: false })
    card.isActive = !card.isActive
    await card.save()
    res.json({ ok: true, isActive: card.isActive })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// MAINTENANCE MODE
// ═══════════════════════════════════════════
const arenaState = require('./arena.state')

router.get('/maintenance', (req, res) => {
  res.json({ ok: true, maintenance: arenaState.maintenance, message: arenaState.maintenanceMsg })
})

router.post('/maintenance', (req, res) => {
  arenaState.maintenance = !!req.body.enabled
  arenaState.maintenanceMsg = req.body.message || ''
  res.json({ ok: true, maintenance: arenaState.maintenance, message: arenaState.maintenanceMsg })
})

// ═══ Broadcast Winner Announcement ═══
router.post('/broadcast-winner', async (req, res) => {
  try {
    const { mode, month, winnerName, prize, prizeIcon, prizeNote } = req.body
    if (!winnerName || !month || !prize) return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })

    const { pushMessage, broadcastMessage } = require('../line/line.webhook.service')
    const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'

    const flexMsg = {
      type: 'flex',
      altText: `🏆 ผู้ชนะ DDx ARENA ${month} — ${winnerName}!`,
      contents: {
        type: 'bubble',
        size: 'giga',
        header: {
          type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: 'MEDNINJA', weight: 'bold', size: 'md', color: '#a855f7' },
            { type: 'text', text: 'DDx', weight: 'bold', size: 'md', color: '#f97316', flex: 0 },
            { type: 'text', text: 'ARENA', weight: 'bold', size: 'md', color: '#FFFFFF', flex: 0 }
          ],
          spacing: 'sm', backgroundColor: '#1e1b4b', paddingAll: '16px'
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a',
          contents: [
            { type: 'text', text: '🏆 ผู้ชนะประจำเดือน', size: 'sm', color: '#fbbf24', weight: 'bold', align: 'center' },
            { type: 'text', text: month, size: 'xs', color: '#94a3b8', align: 'center' },
            {
              type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '16px', paddingAll: '20px', margin: 'lg',
              contents: [
                { type: 'text', text: '🎉', size: '3xl', align: 'center' },
                { type: 'text', text: winnerName, size: 'xxl', weight: 'bold', color: '#fbbf24', align: 'center', margin: 'md' },
                { type: 'text', text: 'อันดับ 1 — DDx Arena', size: 'md', color: '#FFFFFF', align: 'center', margin: 'sm', weight: 'bold' }
              ]
            },
            {
              type: 'box', layout: 'vertical', backgroundColor: '#162236', cornerRadius: '12px', paddingAll: '16px', margin: 'lg',
              contents: [
                { type: 'text', text: '🎁 รางวัล', size: 'sm', color: '#60a5fa', weight: 'bold' },
                {
                  type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md',
                  contents: [
                    {
                      type: 'box', layout: 'vertical', width: '32px', height: '32px', backgroundColor: '#1e3a8a', cornerRadius: '16px',
                      contents: [{ type: 'text', text: prizeIcon || '📘', size: 'sm', align: 'center', gravity: 'center' }],
                      justifyContent: 'center', alignItems: 'center', flex: 0
                    },
                    {
                      type: 'box', layout: 'vertical', flex: 1, justifyContent: 'center',
                      contents: [
                        { type: 'text', text: prize, size: 'md', weight: 'bold', color: '#34d399', wrap: true },
                        ...(prizeNote ? [{ type: 'text', text: `(${prizeNote})`, size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }] : [])
                      ]
                    }
                  ]
                }
              ]
            },
            { type: 'separator', color: '#1e3a5f', margin: 'xl' },
            {
              type: 'box', layout: 'vertical', margin: 'xl',
              contents: [
                { type: 'text', text: '🔥 เดือนนี้ใครจะเป็นเบอร์ 1?', size: 'md', weight: 'bold', color: '#f97316', align: 'center' },
                { type: 'text', text: 'เล่นฟรี! สะสมคะแนน ลุ้นรางวัลทุกเดือน', size: 'xs', color: '#94a3b8', align: 'center', margin: 'sm', wrap: true },
                { type: 'text', text: '* รางวัลแต่ละเดือนไม่เหมือนกัน', size: 'xxs', color: '#64748b', align: 'center', margin: 'sm', style: 'italic' }
              ]
            }
          ]
        },
        footer: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a',
          contents: [{
            type: 'button',
            action: { type: 'uri', label: '🎮 เข้าเล่น DDx Arena เลย!', uri: 'https://ddx.medninja.academy' },
            style: 'primary', color: '#f97316', height: 'md'
          }]
        }
      }
    }

    if (mode === 'broadcast') {
      await broadcastMessage([flexMsg])
      console.log(`[Arena] Broadcast winner: ${winnerName} (${month})`)
    } else {
      await pushMessage(ADMIN_UID, [flexMsg])
      console.log(`[Arena] Preview winner: ${winnerName} (${month}) → admin`)
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[Arena] broadcast-winner error:', err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
