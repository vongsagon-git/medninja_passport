const router = require('express').Router()
const FlashcardPattern = require('./FlashcardPattern.model')
const FlashcardCC = require('./FlashcardCC.model')
const NinjaProgress = require('./NinjaProgress.model')

// Chapter config — ดึงจาก category ของ Pattern Cards
const CHAPTER_ORDER = ['GI','Cardio','Neuro','Pulmo','ID','Hemato','Endo','MSK','Renal','Emergency','Skin','Golden Rule']
const CHAPTER_NAMES = {
  GI:'Gastrointestinal',Cardio:'Cardiovascular',Neuro:'Neurology',Pulmo:'Pulmonology',
  ID:'Infectious Disease',Hemato:'Hematology',Endo:'Endocrinology',MSK:'Musculoskeletal',
  Renal:'Renal',Emergency:'Emergency',Skin:'Dermatology','Golden Rule':'Golden Rule'
}
const CHAPTER_EMOJI = {
  GI:'🫁',Cardio:'❤️',Neuro:'🧠',Pulmo:'🫁',ID:'🦠',Hemato:'🩸',
  Endo:'⚡',MSK:'🦴',Renal:'💧',Emergency:'🚨',Skin:'🩹','Golden Rule':'📜'
}
const CARDS_PER_STAGE = 3
const BOSS_CARDS = 5
const BOSS_PASS_PCT = 80

// GET /api/flashcard/path/chapters?lineUserId=xxx
router.get('/chapters', async (req, res) => {
  try {
    const { lineUserId } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })

    // นับการ์ดแต่ละ category
    const patternCounts = await FlashcardPattern.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    const countMap = {}
    patternCounts.forEach(p => { countMap[p._id] = p.count })

    // CC ที่มี — จับคู่กับ chapter จาก seed order
    // ดึง progress ของ user
    const progress = await NinjaProgress.find({ lineUserId }).lean()
    const progressMap = {}
    progress.forEach(p => { progressMap[p.chapter] = p })

    const chapters = CHAPTER_ORDER
      .filter(ch => (countMap[ch] || 0) >= CARDS_PER_STAGE) // ต้องมีการ์ดพอ
      .map((ch, i) => {
        const totalCards = countMap[ch] || 0
        const totalStages = Math.ceil(totalCards / CARDS_PER_STAGE)
        const prog = progressMap[ch] || {}
        const prevChapter = i > 0 ? CHAPTER_ORDER[i - 1] : null
        const prevCleared = !prevChapter || (progressMap[prevChapter]?.bossCleared === true)
        return {
          id: ch,
          name: CHAPTER_NAMES[ch] || ch,
          emoji: CHAPTER_EMOJI[ch] || '📋',
          totalCards,
          totalStages: totalStages + 1, // +1 for boss
          clearedStages: prog.stage || 0,
          bossCleared: prog.bossCleared || false,
          badgeEarned: prog.badgeEarned || false,
          locked: !prevCleared && i > 0,
        }
      })

    res.json({ chapters })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/flashcard/path/stage?lineUserId=xxx&chapter=GI&stage=1
router.get('/stage', async (req, res) => {
  try {
    const { lineUserId, chapter, stage } = req.query
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })
    const stageNum = parseInt(stage)

    // ดึงการ์ดของ chapter เรียงตาม order
    const allCards = await FlashcardPattern.find({ category: chapter, isActive: true }).sort({ order: 1 }).lean()
    const totalStages = Math.ceil(allCards.length / CARDS_PER_STAGE)

    // Boss round
    if (stageNum > totalStages) {
      // สุ่มจากทั้ง chapter
      const shuffled = allCards.sort(() => Math.random() - 0.5).slice(0, BOSS_CARDS)
      const cards = shuffled.map(c => ({ id: c._id, pattern: c.pattern, category: c.category }))
      return res.json({ cards, isBoss: true, total: cards.length, passPercent: BOSS_PASS_PCT })
    }

    // ด่านปกติ
    const start = (stageNum - 1) * CARDS_PER_STAGE
    const stageCards = allCards.slice(start, start + CARDS_PER_STAGE)
    const cards = stageCards.map(c => ({ id: c._id, pattern: c.pattern, category: c.category }))
    // สรุปก่อนเล่น — mnemonic หรือ pattern→answer ถ้าไม่มี mnemonic
    const hints = stageCards.map(c => c.mnemonic || (c.pattern.slice(0, 30) + ' → ' + c.answer))

    res.json({ cards, isBoss: false, total: cards.length, stageNum, totalStages: totalStages + 1, hints })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/flashcard/path/complete — จบด่าน
router.post('/complete', async (req, res) => {
  try {
    const { lineUserId, chapter, stage, correct, total } = req.body
    if (!lineUserId) return res.status(401).json({ error: 'ต้อง login LINE ก่อน' })
    const stageNum = parseInt(stage)
    const pct = total ? Math.round(correct / total * 100) : 0

    const allCards = await FlashcardPattern.find({ category: chapter, isActive: true }).lean()
    const totalStages = Math.ceil(allCards.length / CARDS_PER_STAGE)
    const isBoss = stageNum > totalStages

    // ด่านปกติ ต้องถูกหมด, Boss ต้องถูก 80%+
    if (!isBoss && correct < total) {
      return res.json({ ok: false, passed: false, pct, needed: 100, message: 'ต้องตอบถูกทุกข้อถึงจะผ่านด่าน' })
    }
    if (isBoss && pct < BOSS_PASS_PCT) {
      return res.json({ ok: false, passed: false, pct, needed: BOSS_PASS_PCT, message: `ต้องถูก ${BOSS_PASS_PCT}%+ ถึงจะผ่าน Boss` })
    }

    // อัปเดต progress
    const update = {
      $max: { stage: stageNum },
      $push: { stageScores: { stage: stageNum, correct, total, date: new Date() } }
    }
    if (isBoss) {
      update.$set = { bossCleared: true, badgeEarned: true }
    }

    await NinjaProgress.findOneAndUpdate(
      { lineUserId, chapter },
      update,
      { upsert: true, new: true }
    )

    // เช็คว่าผ่าน boss → ปลดล็อค chapter ถัดไป
    const chapterIdx = CHAPTER_ORDER.indexOf(chapter)
    const nextChapter = chapterIdx < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[chapterIdx + 1] : null
    const emoji = CHAPTER_EMOJI[chapter] || '📋'
    const badgeName = `${emoji} ${chapter} Ninja`

    // ส่ง LINE Flex
    try {
      const { pushMessage } = require('../line/line.webhook.service')
      const liffUrl = 'https://liff.line.me/2009259048-lwEXYc0q'
      const bodyContents = [
        { type: 'box', layout: 'horizontal', justifyContent: 'center', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: isBoss ? '#f59e0b' : '#16a34a', cornerRadius: '8px', paddingAll: '3px', paddingStart: '10px', paddingEnd: '10px', contents: [
            { type: 'text', text: isBoss ? 'Boss Cleared!' : 'ผ่านด่าน!', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'text', text: `${emoji} ${chapter} — ${isBoss ? 'Boss Round' : 'ด่าน ' + stageNum}`, size: 'md', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'md' },
        { type: 'text', text: `ถูก ${correct}/${total}`, size: 'sm', color: '#16a34a', align: 'center', margin: 'sm' },
      ]
      if (isBoss) {
        bodyContents.push({ type: 'box', layout: 'vertical', backgroundColor: 'rgba(251,191,36,.1)', cornerRadius: '10px', paddingAll: '10px', margin: 'lg', contents: [
          { type: 'text', text: `🎖 ${badgeName}`, size: 'sm', weight: 'bold', color: '#f59e0b', align: 'center' },
          ...(nextChapter ? [{ type: 'text', text: `ปลดล็อค ${nextChapter} แล้ว!`, size: 'xxs', color: '#94a3b8', align: 'center', margin: 'sm' }] : [{ type: 'text', text: 'ผ่านครบทุกบทแล้ว!', size: 'xxs', color: '#f59e0b', align: 'center', margin: 'sm' }])
        ]})
      }
      const flexMsg = {
        type: 'flex', altText: `NINJA Path — ${isBoss ? 'Boss Cleared!' : 'ผ่านด่าน!'} ${chapter}`,
        contents: {
          type: 'bubble', size: 'kilo',
          body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: bodyContents },
          footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
            { type: 'button', action: { type: 'uri', label: 'เล่นด่านถัดไป', uri: liffUrl + '?page=path' }, style: 'primary', color: '#7c3aed', height: 'sm' }
          ]}
        }
      }
      await pushMessage(lineUserId, [flexMsg])
    } catch (e) { console.error('[Path] Flex error:', e.message) }

    res.json({
      ok: true,
      passed: true,
      pct,
      isBoss,
      badgeEarned: isBoss,
      badgeName: isBoss ? `${CHAPTER_EMOJI[chapter] || ''} ${chapter} Ninja` : null,
      nextChapter: isBoss ? nextChapter : null,
      nextChapterName: nextChapter ? (CHAPTER_NAMES[nextChapter] || nextChapter) : null,
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
