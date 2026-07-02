const router = require('express').Router()
const FlashcardPattern = require('./FlashcardPattern.model')
const FlashcardAttempt = require('./FlashcardAttempt.model')

// GET /api/flashcard/cards?mode=10|20|all&lineUserId=xxx
// ส่งเฉพาะ pattern (หน้าการ์ด) ไม่ส่งคำตอบ — ป้องกัน copy
router.get('/cards', async (req, res) => {
  try {
    const { mode, lineUserId } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const all = await FlashcardPattern.find({ isActive: true }).sort({ order: 1 }).lean()
    const n = parseInt(mode)
    const count = (n > 0) ? n : all.length

    // สุ่ม
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count)

    // ส่งแค่หน้าการ์ด ไม่ส่งคำตอบ
    const cards = shuffled.map(p => ({
      id: p._id,
      pattern: p.pattern,
      category: p.category
    }))

    res.json({ cards, total: cards.length })
  } catch (err) {
    console.error('[Flashcard] cards error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/reveal — เปิดคำตอบทีละใบ
router.post('/reveal', async (req, res) => {
  try {
    const { cardId, lineUserId } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const card = await FlashcardPattern.findById(cardId).lean()
    if (!card) return res.status(404).json({ error: 'ไม่พบการ์ด' })

    res.json({
      id: card._id,
      answer: card.answer,
      mnemonic: card.mnemonic
    })
  } catch (err) {
    console.error('[Flashcard] reveal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/result — บันทึกว่าใครมาเล่น (upsert + increment)
router.post('/result', async (req, res) => {
  try {
    const { lineUserId, displayName, pictureUrl, totalCardsRevealed, totalSessions } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const update = {
      displayName,
      pictureUrl,
      lastPlayedAt: new Date(),
    }
    const inc = {}
    if (totalCardsRevealed > 0) inc.totalCardsRevealed = totalCardsRevealed
    if (totalSessions > 0) inc.totalSessions = totalSessions

    const setOnInsert = { firstPlayedAt: new Date() }

    const player = await FlashcardAttempt.findOneAndUpdate(
      { lineUserId },
      { $set: update, $inc: inc, $setOnInsert: setOnInsert },
      { upsert: true, new: true }
    )

    res.json({ ok: true, stars: player.stars || 0, level: player.level || 'NINJA Beginner' })
  } catch (err) {
    console.error('[Flashcard] result error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══ โหมด 2: CC → DDx ═══
const FlashcardCC = require('./FlashcardCC.model')

// GET /api/flashcard/cc-cards?mode=10|20|all&lineUserId=xxx
router.get('/cc-cards', async (req, res) => {
  try {
    const { mode, lineUserId } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const all = await FlashcardCC.find({ isActive: true }).sort({ order: 1 }).lean()
    const n = parseInt(mode); const count = (n > 0) ? n : all.length
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count)

    // ส่งแค่หน้าการ์ด (ชื่อ CC + จำนวน DDx) ไม่ส่ง DDx list
    const cards = shuffled.map(c => ({
      id: c._id,
      cc: c.cc,
      ccEn: c.ccEn,
      ddxCount: c.ddxCount
    }))
    res.json({ cards, total: cards.length })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/cc-reveal — เปิดดู DDx ของ CC นั้น
router.post('/cc-reveal', async (req, res) => {
  try {
    const { cardId, lineUserId } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const card = await FlashcardCC.findById(cardId).lean()
    if (!card) return res.status(404).json({ error: 'ไม่พบการ์ด' })

    res.json({ id: card._id, ddxList: card.ddxList, ddxCount: card.ddxCount })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══ โหมด 3: DDx → CC (ใช้ FlashcardDDx model แยก) ═══
const FlashcardDDx = require('./FlashcardDDx.model')

// GET /api/flashcard/ddx-cards?mode=10|20|all&lineUserId=xxx
router.get('/ddx-cards', async (req, res) => {
  try {
    const { mode, lineUserId } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const all = await FlashcardDDx.find({ isActive: true }).sort({ order: 1 }).lean()
    const n = parseInt(mode); const count = (n > 0) ? n : all.length
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, count)

    // ส่งแค่ชื่อ DDx ไม่ส่ง relatedCC/clue
    const cards = shuffled.map(d => ({
      id: d._id,
      ddx: d.ddx,
      category: d.category
    }))
    res.json({ cards, total: cards.length })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/ddx-reveal — เปิดดูรายละเอียด DDx
router.post('/ddx-reveal', async (req, res) => {
  try {
    const { ddx, cardId, lineUserId } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    let card
    if (cardId) {
      card = await FlashcardDDx.findById(cardId).lean()
    } else {
      card = await FlashcardDDx.findOne({ ddx, isActive: true }).lean()
    }
    if (!card) return res.status(404).json({ error: 'ไม่พบ DDx' })

    res.json({
      ddx: card.ddx,
      ddxTh: card.ddxTh,
      relatedCC: card.relatedCC,
      clue: card.clue,
      history: card.history,
      pe: card.pe,
      investigation: card.investigation
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/complete-round — จบรอบ +1 ดาว + ส่ง LINE Flex
router.post('/complete-round', async (req, res) => {
  try {
    const { lineUserId, score } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    // เช็คคะแนน — Beginner ได้ดาวเสมอ, level อื่นต้องถูกครึ่ง
    const pct = (score && score.total) ? Math.round(score.correct / score.total * 100) : 100
    const currentPlayer = await FlashcardAttempt.findOne({ lineUserId }).lean()
    const currentStars = currentPlayer?.stars || 0
    const earnStar = currentStars < 5 ? true : pct >= 50

    const updateSet = { lastPlayedAt: new Date() }
    if (score) {
      updateSet.lastScore = score
    }
    const inc = earnStar ? { stars: 1 } : {}
    const player = await FlashcardAttempt.findOneAndUpdate(
      { lineUserId },
      { $inc: inc, $set: updateSet, $push: score ? { scoreHistory: { $each: [{ ...score, date: new Date() }], $slice: -50 } } : undefined },
      { new: true }
    )
    if (!player) return res.status(404).json({ error: 'ไม่พบผู้เล่น' })

    // คำนวณ level
    const s = player.stars
    const levels = [
      { min: 100, name: 'NINJA Legend', emoji: '👑', color: '#f59e0b' },
      { min: 50, name: 'NINJA Master', emoji: '💎', color: '#8b5cf6' },
      { min: 30, name: 'NINJA Warrior', emoji: '⚔️', color: '#dc2626' },
      { min: 15, name: 'NINJA Fighter', emoji: '🔥', color: '#f97316' },
      { min: 5, name: 'NINJA Apprentice', emoji: '🌟', color: '#3b82f6' },
      { min: 0, name: 'NINJA Beginner', emoji: '🌱', color: '#64748b' },
    ]
    const lvl = levels.find(l => s >= l.min)
    const prevLevel = player.level
    player.level = lvl.name
    await player.save()

    const leveledUp = prevLevel !== lvl.name

    // คำนวณ rank — ดาวเท่ากัน ดู updatedAt (ถึงก่อนอันดับดีกว่า)
    const LineFollower = require('../line/LineFollower.model')
    const totalFollowers = await LineFollower.countDocuments({ isFollowing: true })
    const aboveMe = await FlashcardAttempt.countDocuments({
      $or: [
        { stars: { $gt: s } },
        { stars: s, updatedAt: { $lt: player.updatedAt } }
      ]
    })
    const myRank = aboveMe + 1

    // ส่ง LINE Flex
    try {
      const { pushMessage } = require('../line/line.webhook.service')
      const liffUrl = 'https://liff.line.me/2009259048-lwEXYc0q'

      // หาจุดอ่อน (หมวดที่ถูกน้อยกว่า 50%)
      const weakCats = []
      if (score && score.categories) {
        for (const [cat, v] of Object.entries(score.categories)) {
          const pct = v.total ? Math.round(v.correct / v.total * 100) : 0
          if (pct < 50) weakCats.push(cat)
        }
      }

      // สร้าง Flex — กว้าง กระชับ ปุ่มเล่นต่อเด่น
      const scorePct = (score && score.total) ? Math.round(score.correct / score.total * 100) : 0
      const scoreText = score ? `นึกออก ${score.correct}/${score.total}` : ''
      const wrongCards = (score && score.wrongCards) || []
      const reviewText = wrongCards.length > 0 ? `📖 ควรทบทวน: ${wrongCards.slice(0, 5).join(', ')} เป็นต้น` : ''

      // คำให้กำลังใจ random
      const perfectPhrases = [
        '\u{1F3C6} สุดยอดเลยค่ะ! เต็มทุกข้อ! \u{2014} พี่หมอแตม',
        '\u{1F31F} Perfect! คุณคือ NINJA ตัวจริง! \u{2014} พี่หมอแตม',
        '\u{1F451} เก่งมากค่ะ! ไม่พลาดแม้แต่ข้อเดียว! \u{2014} พี่หมอแตม',
        '\u{1F389} ยอดเยี่ยมค่ะ! พี่ภูมิใจมาก! \u{2014} พี่หมอแตม',
        '\u{2B50} คะแนนเต็ม! พร้อมสอบแล้วค่ะ! \u{2014} พี่หมอแตม',
        '\u{1F525} แม่นมากค่ะ! เก็บได้หมดเลย! \u{2014} พี่หมอแตม',
        '\u{1F48E} สมกับเป็น NINJA ค่ะ! \u{2014} พี่หมอแตม',
        '\u{1F947} เยี่ยมไปเลยค่ะ! Full Score! \u{2014} พี่หมอแตม',
        '\u{1F3AF} แม่นทุกข้อค่ะ! ฝึกมาดี! \u{2014} พี่หมอแตม',
        '\u{1F4AA} ทำได้ดีที่สุดเลยค่ะ! \u{2014} พี่หมอแตม',
      ]
      const goodPhrases = [
        '\u{1F4AA} เก่งมากค่ะ! ฝึกต่อไปนะคะ \u{2014} พี่หมอแตม',
        '\u{1F525} ดีมากค่ะ! ยิ่งเล่นยิ่งแม่น \u{2014} พี่หมอแตม',
        '\u{1F44F} เก่งขึ้นเรื่อยๆ เลยค่ะ! \u{2014} พี่หมอแตม',
        '\u{2728} พี่เห็นพัฒนาการเลยค่ะ สู้ต่อไป! \u{2014} พี่หมอแตม',
        '\u{1F31F} ใกล้เต็มแล้วค่ะ! อีกนิดเดียว! \u{2014} พี่หมอแตม',
        '\u{1F4A1} คิดได้เร็วขึ้นเรื่อยๆ ค่ะ! \u{2014} พี่หมอแตม',
        '\u{1F680} ไปได้สวยค่ะ! เก่งมาก! \u{2014} พี่หมอแตม',
        '\u{1F3C5} ทำได้ดีค่ะ! พี่ชื่นชมเลย! \u{2014} พี่หมอแตม',
        '\u{2705} เยี่ยมค่ะ! ความรู้แน่นขึ้นมาก! \u{2014} พี่หมอแตม',
        '\u{1F33F} ดีค่ะ! ฝึกอีกนิดจะเต็มแล้ว! \u{2014} พี่หมอแตม',
      ]
      const encouragePhrases = [
        '\u{1F4AA} สู้ๆ นะคะ ฝึกอีกนิดจะเก่งขึ้นค่ะ! \u{2014} พี่หมอแตม',
        '\u{1F4DA} ทบทวนแล้วลองใหม่นะคะ พี่เชื่อว่าทำได้! \u{2014} พี่หมอแตม',
        '\u{1F331} เริ่มต้นดีค่ะ ยิ่งเล่นยิ่งจำได้! \u{2014} พี่หมอแตม',
        '\u{1F525} อย่าท้อนะคะ ทุกคนเริ่มจากตรงนี้! \u{2014} พี่หมอแตม',
        '\u{2764} พี่เป็นกำลังใจให้ค่ะ ลองอีกรอบนะคะ! \u{2014} พี่หมอแตม',
        '\u{1F4A1} ผิดไม่เป็นไรค่ะ ผิดแล้วจำได้ดีกว่า! \u{2014} พี่หมอแตม',
        '\u{1F3AF} ค่อยๆ ฝึกนะคะ แม่นขึ้นแน่นอนค่ะ! \u{2014} พี่หมอแตม',
        '\u{1F4D6} อ่านเพิ่มแล้วกลับมาเล่นใหม่นะคะ! \u{2014} พี่หมอแตม',
        '\u{1F91D} ไม่ต้องกังวลค่ะ เล่นบ่อยๆ จะดีขึ้นเอง! \u{2014} พี่หมอแตม',
        '\u{1F33C} ทำได้ดีแล้วค่ะ รอบหน้าจะดีกว่านี้! \u{2014} พี่หมอแตม',
      ]
      let encourageText
      if (scorePct === 100) encourageText = perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)]
      else if (scorePct >= 50) encourageText = goodPhrases[Math.floor(Math.random() * goodPhrases.length)]
      else encourageText = encouragePhrases[Math.floor(Math.random() * encouragePhrases.length)]

      // ดึง profile picture
      const pic = player.pictureUrl || ''

      const bodyContents = [
        // หัว: รูปโปรไฟล์ + NINJA ชื่อ + ระดับ
        { type: 'box', layout: 'horizontal', spacing: 'md', alignItems: 'center', contents: [
          ...(pic ? [{ type: 'image', url: pic, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 }] : []),
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: `NINJA ${player.displayName || ''}`, size: 'sm', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: `ระดับ ${lvl.name.replace('NINJA ','')}`, size: 'xxs', color: lvl.color }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'md' },
        // คะแนน + ดาว
        { type: 'box', layout: 'horizontal', margin: 'md', contents: [
          { type: 'text', text: scoreText, size: 'sm', weight: 'bold', color: scorePct >= 50 ? '#16a34a' : '#dc2626', flex: 1 },
          { type: 'text', text: earnStar ? `คุณมีดาวสะสม ${s} ดวง` : `คุณมีดาวสะสม ${s} ดวง`, size: 'xs', color: '#f59e0b', align: 'end', flex: 1 }
        ]},
      ]

      // คำให้กำลังใจ
      bodyContents.push({ type: 'text', text: encourageText, size: 'xs', color: scorePct >= 50 ? '#34d399' : '#fbbf24', margin: 'sm', wrap: true })

      if (!earnStar) {
        bodyContents.push({ type: 'text', text: 'รอบนี้ยังไม่ได้ดาว', size: 'xxs', color: '#fca5a5', margin: 'sm', wrap: true })
      }

      if (leveledUp) {
        bodyContents.push({ type: 'text', text: `🎉 Level Up! → ${lvl.name}`, size: 'sm', weight: 'bold', color: '#a78bfa', margin: 'md' })
      }

      if (reviewText) {
        bodyContents.push({ type: 'text', text: reviewText, size: 'xxs', color: '#fca5a5', margin: 'md', wrap: true })
      }

      // ไม่แสดงลำดับใน Flex — ให้กดดูที่หน้า profile
      bodyContents.push({ type: 'text', text: '* ระดับจะเพิ่มขึ้นจากประสบการณ์', size: 'xxs', color: '#475569', margin: 'md', wrap: true })

      const flexMsg = {
        type: 'flex', altText: `NINJA DDx — ${lvl.name} ⭐ ${s} | ${scoreText}`,
        contents: {
          type: 'bubble', size: 'mega',
          body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: bodyContents },
          footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
            { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
              { type: 'button', action: { type: 'uri', label: 'เล่นต่อ', uri: liffUrl }, style: 'primary', color: '#7c3aed', height: 'sm', flex: 2 },
              { type: 'button', action: { type: 'message', label: 'แชร์', text: 'มาฝึกวิเคราะห์ C/C และ DDx กัน! NINJA DDx ฟรี 700+ การ์ด 🎮\nhttps://medninja.academy/ddx-arena' }, style: 'secondary', height: 'sm', flex: 1 }
            ]},
            { type: 'button', action: { type: 'uri', label: 'ดูลำดับในยุทธจักร', uri: 'https://liff.line.me/2009259048-lwEXYc0q?page=profile' }, style: 'primary', color: '#1e293b', height: 'sm' }
          ]}
        }
      }
      await pushMessage(lineUserId, [flexMsg])
    } catch (e) { console.error('[Flashcard] LINE flex error:', e.message) }

    res.json({ ok: true, stars: player.stars, level: lvl.name, leveledUp, emoji: lvl.emoji, earnStar, myRank, totalFollowers })
  } catch (err) {
    console.error('[Flashcard] complete-round error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/flashcard/leaderboard?lineUserId=xxx
router.get('/leaderboard', async (req, res) => {
  try {
    const { lineUserId } = req.query
    const top = await FlashcardAttempt.find({ stars: { $gt: 0 } })
      .sort({ stars: -1 }).limit(20).lean()

    // ซ่อนตัวตน — แสดงแค่ชื่อย่อ (ไม่ส่ง lineUserId ออกไป)
    const masked = top.map(p => ({
      displayName: maskName(p.displayName),
      stars: p.stars || 0,
      level: p.level || 'NINJA Beginner',
      isMe: !!(lineUserId && p.lineUserId === lineUserId),
    }))

    // หาอันดับของผู้เล่น
    let myRank = null
    if (lineUserId) {
      const totalAbove = await FlashcardAttempt.countDocuments({
        stars: { $gt: (top.find(t => t.lineUserId === lineUserId)?.stars || 0) }
      })
      const me = await FlashcardAttempt.findOne({ lineUserId }).lean()
      if (me) myRank = totalAbove + 1
    }

    res.json({ top: masked, myRank })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

function maskName(name) {
  if (!name) return 'ผู้เล่น'
  // แสดง 2 ตัวแรก + *** เช่น "สม***"
  if (name.length <= 2) return name + '***'
  return name.slice(0, 2) + '***'
}

// GET /api/flashcard/my-profile?lineUserId=xxx — NINJA Profile + rank + จุดอ่อนรวม
router.get('/my-profile', async (req, res) => {
  try {
    const { lineUserId } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    const player = await FlashcardAttempt.findOne({ lineUserId }).lean()
    if (!player) return res.status(404).json({ error: 'ไม่พบข้อมูล' })

    // rank
    const s = player.stars || 0
    const LineFollower = require('../line/LineFollower.model')
    const totalFollowers = await LineFollower.countDocuments({ isFollowing: true })
    const aboveMe = await FlashcardAttempt.countDocuments({
      $or: [
        { stars: { $gt: s } },
        { stars: s, updatedAt: { $lt: player.updatedAt } }
      ]
    })
    const myRank = aboveMe + 1

    // level
    const levels = [
      { min: 100, name: 'NINJA Legend', emoji: '👑', color: '#f59e0b' },
      { min: 50, name: 'NINJA Master', emoji: '💎', color: '#8b5cf6' },
      { min: 30, name: 'NINJA Warrior', emoji: '⚔️', color: '#dc2626' },
      { min: 15, name: 'NINJA Fighter', emoji: '🔥', color: '#f97316' },
      { min: 5, name: 'NINJA Apprentice', emoji: '🌟', color: '#3b82f6' },
      { min: 0, name: 'NINJA Beginner', emoji: '🌱', color: '#64748b' },
    ]
    const lvl = levels.find(l => s >= l.min)
    const nextLvl = levels.find(l => l.min > s) ? levels.filter(l => l.min > s).pop() : null
    const nextLevelAt = levels.filter(l => l.min > s).length ? Math.min(...levels.filter(l => l.min > s).map(l => l.min)) : null

    // จุดอ่อนรวมทุกรอบ (จาก scoreHistory)
    const wrongCount = {}
    const catStats = {}
    let totalRounds = 0, totalCorrect = 0, totalQuestions = 0
    for (const round of (player.scoreHistory || [])) {
      totalRounds++
      totalCorrect += round.correct || 0
      totalQuestions += round.total || 0
      for (const card of (round.wrongCards || [])) {
        wrongCount[card] = (wrongCount[card] || 0) + 1
      }
      for (const [cat, v] of Object.entries(round.categories || {})) {
        if (!catStats[cat]) catStats[cat] = { correct: 0, total: 0 }
        catStats[cat].correct += v.correct || 0
        catStats[cat].total += v.total || 0
      }
    }

    const topWrong = Object.entries(wrongCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([card, count]) => ({ card, count }))

    const categoryBreakdown = Object.entries(catStats)
      .map(([cat, v]) => ({ cat, correct: v.correct, total: v.total, pct: v.total ? Math.round(v.correct / v.total * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct)

    const overallPct = totalQuestions ? Math.round(totalCorrect / totalQuestions * 100) : 0

    res.json({
      displayName: player.displayName,
      pictureUrl: player.pictureUrl,
      stars: s,
      level: lvl.name,
      emoji: lvl.emoji,
      color: lvl.color,
      myRank,
      totalFollowers,
      totalRounds,
      overallPct,
      nextLevelAt,
      topWrong,
      categoryBreakdown,
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/mindmap-view — track การใช้ mindmap
router.post('/mindmap-view', async (req, res) => {
  try {
    const { lineUserId, action, cc } = req.body
    if (!lineUserId) return res.json({ ok: true })
    await FlashcardAttempt.findOneAndUpdate(
      { lineUserId },
      { $inc: { mindmapViews: 1 }, $set: { lastMindmapAt: new Date() } },
      { upsert: false }
    )
    res.json({ ok: true })
  } catch (err) { res.json({ ok: true }) }
})

// GET /api/flashcard/total — จำนวนการ์ดทั้งหมด
router.get('/total', async (req, res) => {
  try {
    const patterns = await FlashcardPattern.countDocuments({ isActive: true })
    const ccCards = await FlashcardCC.countDocuments({ isActive: true })
    const ddxCards = await FlashcardDDx.countDocuments({ isActive: true })
    res.json({ patterns, ccCards, ddxCards })
  } catch (err) {
    res.json({ patterns: 50, ccCards: 35, ddxCards: 0 })
  }
})

module.exports = router
