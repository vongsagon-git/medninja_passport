const MeqCase = require('./MeqCase.model')
const MeqAttempt = require('./MeqAttempt.model')
const Activation = require('../activation/Activation.model')
const { scoreAnswer } = require('./meq.scoring')

/**
 * ตรวจสอบว่า user มี VISA ที่ active อยู่ (ไม่ต้องเช็ค feature flag เพราะ MEQ ผูกกับ VISA ตรง)
 */
async function checkMeqAccess(userId) {
  const activation = await Activation.findOne({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).lean()
  return !!activation
}

/**
 * GET /api/my/meq — list available MEQ cases (published)
 * Include user's attempt status for each case
 */
exports.listCases = async (req, res) => {
  try {
    const userId = req.user._id

    // ตรวจสิทธิ์ — ต้องมี VISA ที่ active (admin bypass)
    if (req.user.role !== 'admin' && !(await checkMeqAccess(userId))) {
      return res.status(403).json({ message: 'คุณยังไม่มี VISA หรือ VISA หมดอายุแล้ว' })
    }

    // Get published cases (exclude full step details)
    const cases = await MeqCase.find({ isPublished: true })
      .select('title scenario category difficulty tags totalPoints estimatedMinutes steps.order steps.type createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // Get user's attempts for these cases
    const caseIds = cases.map(c => c._id)
    const attempts = await MeqAttempt.find({
      userId,
      caseId: { $in: caseIds }
    }).select('caseId status currentStep totalScore percentScore completedAt').lean()

    // Map attempts by caseId
    const attemptMap = {}
    for (const a of attempts) {
      const key = a.caseId.toString()
      if (!attemptMap[key]) attemptMap[key] = []
      attemptMap[key].push(a)
    }

    const result = cases.map(c => ({
      _id: c._id,
      title: c.title,
      scenario: c.scenario.substring(0, 200) + (c.scenario.length > 200 ? '...' : ''),
      category: c.category,
      difficulty: c.difficulty,
      tags: c.tags,
      totalPoints: c.totalPoints,
      estimatedMinutes: c.estimatedMinutes,
      totalSteps: c.steps?.length || 0,
      stepTypes: c.steps?.map(s => s.type) || [],
      attempts: attemptMap[c._id.toString()] || [],
      bestScore: (() => {
        const completed = (attemptMap[c._id.toString()] || []).filter(a => a.status === 'completed')
        if (completed.length === 0) return null
        return Math.max(...completed.map(a => a.percentScore))
      })()
    }))

    res.json(result)
  } catch (err) {
    console.error('[MEQ] listCases error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/my/meq/:id — get case info
 * Only reveal steps up to user's current step in active attempt
 */
exports.getCase = async (req, res) => {
  try {
    const userId = req.user._id

    if (req.user.role !== 'admin' && !(await checkMeqAccess(userId))) {
      return res.status(403).json({ message: 'คุณยังไม่มี VISA หรือ VISA หมดอายุแล้ว' })
    }

    const meqCase = await MeqCase.findOne({ _id: req.params.id, isPublished: true }).lean()
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })

    // Find active attempt
    const attempt = await MeqAttempt.findOne({
      userId,
      caseId: meqCase._id,
      status: 'in_progress'
    }).lean()

    const currentStep = attempt ? attempt.currentStep : -1

    // Reveal steps up to currentStep (inclusive)
    // For steps beyond currentStep: only show order and type
    const steps = meqCase.steps.map((step, idx) => {
      if (idx <= currentStep) {
        // Already answered — show everything including reveal
        const answered = attempt?.answers?.find(a => a.stepIndex === idx)
        return {
          ...step,
          answered: answered || null,
          isRevealed: !!answered
        }
      } else if (idx === currentStep + 1) {
        // Current question — show question, hints, but NOT answers/reveal
        return {
          order: step.order,
          type: step.type,
          question: step.question,
          hints: step.hints,
          scoring: { maxPoints: step.scoring?.maxPoints || 10 },
          answered: null,
          isRevealed: false
        }
      } else {
        // Future — only show order and type
        return {
          order: step.order,
          type: step.type,
          answered: null,
          isRevealed: false
        }
      }
    })

    res.json({
      _id: meqCase._id,
      title: meqCase.title,
      scenario: meqCase.scenario,
      category: meqCase.category,
      difficulty: meqCase.difficulty,
      tags: meqCase.tags,
      totalPoints: meqCase.totalPoints,
      estimatedMinutes: meqCase.estimatedMinutes,
      totalSteps: meqCase.steps.length,
      steps,
      attempt: attempt ? {
        _id: attempt._id,
        status: attempt.status,
        currentStep: attempt.currentStep,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        startedAt: attempt.startedAt
      } : null
    })
  } catch (err) {
    console.error('[MEQ] getCase error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/meq/:id/start — start a new attempt
 */
exports.startAttempt = async (req, res) => {
  try {
    const userId = req.user._id
    const caseId = req.params.id

    if (req.user.role !== 'admin' && !(await checkMeqAccess(userId))) {
      return res.status(403).json({ message: 'คุณยังไม่มี VISA หรือ VISA หมดอายุแล้ว' })
    }

    const meqCase = await MeqCase.findOne({ _id: caseId, isPublished: true })
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })

    // Check for existing in-progress attempt
    const existing = await MeqAttempt.findOne({ userId, caseId, status: 'in_progress' })
    if (existing) {
      return res.status(400).json({
        message: 'มี attempt ที่ยังทำไม่เสร็จอยู่',
        attemptId: existing._id
      })
    }

    const attempt = await MeqAttempt.create({
      userId,
      caseId,
      status: 'in_progress',
      currentStep: 0,
      answers: [],
      totalScore: 0,
      maxScore: meqCase.totalPoints,
      startedAt: new Date()
    })

    res.status(201).json({
      attemptId: attempt._id,
      currentStep: 0,
      totalSteps: meqCase.steps.length,
      maxScore: meqCase.totalPoints
    })
  } catch (err) {
    console.error('[MEQ] startAttempt error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/meq/:id/answer — submit answer for current step
 * Body: { answer: String }
 */
exports.submitAnswer = async (req, res) => {
  try {
    const userId = req.user._id
    const caseId = req.params.id
    const { answer } = req.body

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'กรุณาตอบคำถาม' })
    }

    // Find active attempt
    const attempt = await MeqAttempt.findOne({ userId, caseId, status: 'in_progress' })
    if (!attempt) {
      return res.status(400).json({ message: 'ไม่มี attempt ที่กำลังทำอยู่ กรุณาเริ่มใหม่' })
    }

    // Get case
    const meqCase = await MeqCase.findById(caseId).lean()
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })

    const stepIndex = attempt.currentStep
    if (stepIndex >= meqCase.steps.length) {
      return res.status(400).json({ message: 'ตอบครบทุกข้อแล้ว กรุณากด complete' })
    }

    // Check if already answered this step
    const alreadyAnswered = attempt.answers.find(a => a.stepIndex === stepIndex)
    if (alreadyAnswered) {
      return res.status(400).json({ message: 'ตอบข้อนี้ไปแล้ว' })
    }

    // Score the answer
    const step = meqCase.steps[stepIndex]
    const result = scoreAnswer(answer, step)

    // Save answer
    attempt.answers.push({
      stepIndex,
      answer: answer.trim(),
      score: result.score,
      answeredAt: new Date()
    })

    // Update totals
    attempt.totalScore = attempt.answers.reduce((sum, a) => sum + a.score, 0)
    attempt.currentStep = stepIndex + 1

    // Check if last step
    const isLastStep = attempt.currentStep >= meqCase.steps.length

    await attempt.save()

    // Build response with reveal
    const response = {
      stepIndex,
      score: result.score,
      maxPoints: result.maxPoints,
      feedback: result.feedback,
      matchedAnswers: result.matchedAnswers,
      matchedKeyPoints: result.matchedKeyPoints,
      // Reveal information
      revealText: step.revealText,
      revealImage: step.revealImage,
      explanation: step.explanation,
      expectedAnswers: step.expectedAnswers,
      keyPoints: step.keyPoints,
      // Progress
      currentStep: attempt.currentStep,
      totalSteps: meqCase.steps.length,
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      isLastStep
    }

    // If there's a next step, include its question
    if (!isLastStep) {
      const nextStep = meqCase.steps[attempt.currentStep]
      response.nextStep = {
        order: nextStep.order,
        type: nextStep.type,
        question: nextStep.question,
        hints: nextStep.hints,
        scoring: { maxPoints: nextStep.scoring?.maxPoints || 10 }
      }
    }

    res.json(response)
  } catch (err) {
    console.error('[MEQ] submitAnswer error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/my/meq/:id/complete — mark attempt as completed
 */
exports.completeAttempt = async (req, res) => {
  try {
    const userId = req.user._id
    const caseId = req.params.id

    const attempt = await MeqAttempt.findOne({ userId, caseId, status: 'in_progress' })
    if (!attempt) {
      return res.status(400).json({ message: 'ไม่มี attempt ที่กำลังทำอยู่' })
    }

    const meqCase = await MeqCase.findById(caseId).lean()

    // Calculate final scores
    attempt.status = 'completed'
    attempt.completedAt = new Date()
    attempt.timeTakenSec = Math.round((attempt.completedAt - attempt.startedAt) / 1000)
    attempt.totalScore = attempt.answers.reduce((sum, a) => sum + a.score, 0)
    attempt.maxScore = meqCase ? meqCase.totalPoints : attempt.maxScore
    attempt.percentScore = attempt.maxScore > 0
      ? Math.round((attempt.totalScore / attempt.maxScore) * 100)
      : 0

    await attempt.save()

    res.json({
      status: 'completed',
      totalScore: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentScore: attempt.percentScore,
      timeTakenSec: attempt.timeTakenSec,
      answers: attempt.answers
    })
  } catch (err) {
    console.error('[MEQ] completeAttempt error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/my/meq/history — user's completed attempts
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id

    const attempts = await MeqAttempt.find({
      userId,
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean()

    // Enrich with case info
    const caseIds = [...new Set(attempts.map(a => a.caseId.toString()))]
    const cases = await MeqCase.find({ _id: { $in: caseIds } })
      .select('title category difficulty totalPoints')
      .lean()
    const caseMap = {}
    for (const c of cases) caseMap[c._id.toString()] = c

    const result = attempts.map(a => ({
      _id: a._id,
      caseId: a.caseId,
      caseTitle: caseMap[a.caseId.toString()]?.title || '(ลบแล้ว)',
      category: caseMap[a.caseId.toString()]?.category || '',
      difficulty: caseMap[a.caseId.toString()]?.difficulty || '',
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      percentScore: a.percentScore,
      timeTakenSec: a.timeTakenSec,
      completedAt: a.completedAt,
      answersCount: a.answers.length
    }))

    res.json(result)
  } catch (err) {
    console.error('[MEQ] getHistory error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}
