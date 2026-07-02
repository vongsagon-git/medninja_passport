const Approach = require('./Approach.model')
const ApproachProgress = require('./ApproachProgress.model')
const ApproachAttempt = require('./ApproachAttempt.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const { fuzzyMatch, calculateScore, updateSM2 } = require('./approach.scoring')

const User = require('../user/User.model')

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้า DDx ไหม
 * ทุกคนเท่าเทียม (admin ไม่ bypass)
 * เงื่อนไข: 1) มี VISA + ddxEnabled  2) เชื่อม LINE แล้ว
 */
async function checkDdxAccess(userId) {
  // 1. เช็ค LINE — ต้องเชื่อมแล้ว
  const user = await User.findById(userId).select('lineUserId').lean()
  if (!user?.lineUserId) return { ok: false, reason: 'LINE_REQUIRED' }

  // 2. เช็ค Activation
  const activations = await Activation.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).lean()

  if (!activations.length) return { ok: false, reason: 'NO_VISA' }

  // 3. เช็ค ddxEnabled — เฉพาะ Activation รายคนเท่านั้น (ไม่ fallback Package)
  if (activations.some(a => a.ddxEnabled)) return { ok: true }

  return { ok: false, reason: 'DDX_DISABLED' }
}

/**
 * GET /api/my/approaches — list all published approaches with user's progress
 */
exports.listApproaches = async (req, res) => {
  try {
    const access = await checkDdxAccess(req.user._id)
    if (!access.ok) {
      const msgs = { LINE_REQUIRED: 'กรุณาเชื่อม LINE ก่อนใช้ DDx', NO_VISA: 'คุณยังไม่มี VISA', DDX_DISABLED: 'DDx ยังไม่ได้เปิดให้คุณ' }
      return res.status(403).json({ message: msgs[access.reason] || 'ไม่มีสิทธิ์เข้าถึง DDx', reason: access.reason })
    }

    const approaches = await Approach.find({ isPublished: true })
      .populate('category', 'code name nameEn icon color')
      .select('code symptom symptomEn category order differentials practiceConfig mnemonics')
      .sort({ order: 1 })
      .lean()

    // Fetch user's progress for all approaches
    const progressList = await ApproachProgress.find({
      userId: req.user._id
    }).lean()

    const progressMap = {}
    for (const p of progressList) {
      progressMap[p.approachId.toString()] = p
    }

    const result = approaches.map(a => ({
      _id: a._id,
      code: a.code,
      symptom: a.symptom,
      symptomEn: a.symptomEn,
      category: a.category,
      order: a.order,
      differentialCount: a.differentials?.length || 0,
      practiceConfig: a.practiceConfig,
      mnemonicCount: a.mnemonics?.length || 0,
      progress: progressMap[a._id.toString()] || null
    }))

    res.json(result)
  } catch (err) {
    console.error('[Approach] listApproaches error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/my/approaches/review-queue — approaches due for review today
 */
exports.getReviewQueue = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const now = new Date()

    const dueProgress = await ApproachProgress.find({
      userId: req.user._id,
      nextReviewAt: { $lte: now },
      mastery: { $ne: 'new' }
    })
      .sort({ nextReviewAt: 1 })
      .lean()

    // Fetch approach details
    const approachIds = dueProgress.map(p => p.approachId)
    const approaches = await Approach.find({
      _id: { $in: approachIds },
      isPublished: true
    })
      .populate('category', 'code name nameEn icon color')
      .select('code symptom symptomEn category order differentials practiceConfig')
      .lean()

    const approachMap = {}
    for (const a of approaches) {
      approachMap[a._id.toString()] = a
    }

    const result = dueProgress
      .filter(p => approachMap[p.approachId.toString()])
      .map(p => {
        const a = approachMap[p.approachId.toString()]
        return {
          _id: a._id,
          code: a.code,
          symptom: a.symptom,
          symptomEn: a.symptomEn,
          category: a.category,
          differentialCount: a.differentials?.length || 0,
          practiceConfig: a.practiceConfig,
          progress: p
        }
      })

    res.json(result)
  } catch (err) {
    console.error('[Approach] getReviewQueue error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/my/approaches/stats — user's overall DDx stats
 */
exports.getStats = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const userId = req.user._id

    const [progressList, totalApproaches, recentAttempts] = await Promise.all([
      ApproachProgress.find({ userId }).lean(),
      Approach.countDocuments({ isPublished: true }),
      ApproachAttempt.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ])

    const masteryCount = { new: 0, learning: 0, reviewing: 0, mastered: 0 }
    let totalAttempts = 0
    let totalCorrect = 0
    let bookmarked = 0

    for (const p of progressList) {
      masteryCount[p.mastery] = (masteryCount[p.mastery] || 0) + 1
      totalAttempts += p.totalAttempts || 0
      totalCorrect += p.correctAttempts || 0
      if (p.bookmarked) bookmarked++
    }

    // Not started = total published - those with progress
    masteryCount.new = totalApproaches - progressList.length + (masteryCount.new || 0)

    const now = new Date()
    const dueCount = progressList.filter(p =>
      p.nextReviewAt <= now && p.mastery !== 'new'
    ).length

    res.json({
      totalApproaches,
      studied: progressList.length,
      mastery: masteryCount,
      totalAttempts,
      totalCorrect,
      accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      bookmarked,
      dueForReview: dueCount,
      recentAttempts: recentAttempts.map(a => ({
        approachId: a.approachId,
        mode: a.mode,
        score: a.score,
        quality: a.quality,
        timeTakenSec: a.timeTakenSec,
        createdAt: a.createdAt
      }))
    })
  } catch (err) {
    console.error('[Approach] getStats error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/my/approaches/:id — single approach with full content
 */
exports.getApproach = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const approach = await Approach.findOne({
      _id: req.params.id,
      isPublished: true
    })
      .populate('category', 'code name nameEn icon color')
      .lean()

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    // Sort differentials by order
    if (approach.differentials) {
      approach.differentials.sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    // Get user's progress
    const progress = await ApproachProgress.findOne({
      userId: req.user._id,
      approachId: approach._id
    }).lean()

    res.json({ approach, progress })
  } catch (err) {
    console.error('[Approach] getApproach error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/approaches/:id/read — record a read
 */
exports.recordRead = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const approach = await Approach.findOne({
      _id: req.params.id,
      isPublished: true
    }).lean()

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    const progress = await ApproachProgress.findOneAndUpdate(
      { userId: req.user._id, approachId: approach._id },
      {
        $inc: { readCount: 1 },
        $set: { lastReadAt: new Date() }
      },
      { upsert: true, new: true }
    )

    res.json({ progress })
  } catch (err) {
    console.error('[Approach] recordRead error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/approaches/:id/practice — submit practice attempt
 * Body: { mode, answeredDiagnoses, timeTakenSec, quality? }
 */
exports.submitPractice = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const approach = await Approach.findOne({
      _id: req.params.id,
      isPublished: true
    }).lean()

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    const { mode, answeredDiagnoses = [], timeTakenSec = 0 } = req.body

    if (!mode || !['free-recall', 'multiple-choice'].includes(mode)) {
      return res.status(400).json({ message: 'mode ต้องเป็น free-recall หรือ multiple-choice' })
    }

    // Score the attempt
    const { matched, unmatched, extra } = fuzzyMatch(answeredDiagnoses, approach.differentials)
    const score = calculateScore(matched, approach.differentials)
    const correctCount = matched.length
    const totalExpected = approach.differentials.length

    // Auto-calculate quality from score if not provided
    let quality = req.body.quality
    if (quality === undefined || quality === null) {
      if (score >= 90) quality = 5
      else if (score >= 70) quality = 4
      else if (score >= 50) quality = 3
      else if (score >= 30) quality = 2
      else if (score >= 10) quality = 1
      else quality = 0
    }

    // Save attempt
    const attempt = await ApproachAttempt.create({
      userId: req.user._id,
      approachId: approach._id,
      mode,
      answeredDiagnoses,
      score,
      correctCount,
      totalExpected,
      timeTakenSec,
      quality
    })

    // Get or create progress, then update SM-2
    let progress = await ApproachProgress.findOne({
      userId: req.user._id,
      approachId: approach._id
    })

    if (!progress) {
      progress = await ApproachProgress.create({
        userId: req.user._id,
        approachId: approach._id
      })
    }

    // Update SM-2
    const sm2Updates = updateSM2(progress, quality)

    // Calculate new average time
    const prevTotal = (progress.averageTimeSec || 0) * (progress.totalAttempts || 0)
    const newTotalAttempts = (progress.totalAttempts || 0) + 1
    const newAverageTime = Math.round((prevTotal + timeTakenSec) / newTotalAttempts)

    // Update progress
    progress.set({
      ...sm2Updates,
      totalAttempts: newTotalAttempts,
      lastScore: score,
      bestScore: Math.max(progress.bestScore || 0, score),
      averageTimeSec: newAverageTime
    })
    await progress.save()

    res.json({
      attempt: {
        _id: attempt._id,
        score,
        correctCount,
        totalExpected,
        quality,
        mode,
        timeTakenSec
      },
      scoring: {
        matched: matched.map(m => m.original),
        unmatched: unmatched.map(m => m.original),
        extra
      },
      progress
    })
  } catch (err) {
    console.error('[Approach] submitPractice error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/approaches/:id/bookmark — toggle bookmark
 */
exports.toggleBookmark = async (req, res) => {
  try {
    const hasAccess = await checkDdxAccess(req.user._id)
    if (!hasAccess) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง DDx' })
    }

    const approach = await Approach.findOne({
      _id: req.params.id,
      isPublished: true
    }).lean()

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    let progress = await ApproachProgress.findOne({
      userId: req.user._id,
      approachId: approach._id
    })

    if (!progress) {
      progress = await ApproachProgress.create({
        userId: req.user._id,
        approachId: approach._id,
        bookmarked: true
      })
    } else {
      progress.bookmarked = !progress.bookmarked
      await progress.save()
    }

    res.json({ bookmarked: progress.bookmarked })
  } catch (err) {
    console.error('[Approach] toggleBookmark error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}
