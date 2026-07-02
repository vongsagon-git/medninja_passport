const MeqCase = require('./MeqCase.model')
const MeqAttempt = require('./MeqAttempt.model')

/**
 * GET /api/admin/meq — list all cases
 */
exports.listCases = async (req, res) => {
  try {
    const cases = await MeqCase.find()
      .select('title category difficulty tags totalPoints estimatedMinutes isPublished steps createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()

    // Get attempt counts per case
    const caseIds = cases.map(c => c._id)
    const attemptCounts = await MeqAttempt.aggregate([
      { $match: { caseId: { $in: caseIds } } },
      { $group: {
        _id: '$caseId',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgScore: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, '$percentScore', null] } }
      }}
    ])

    const countMap = {}
    for (const a of attemptCounts) countMap[a._id.toString()] = a

    const result = cases.map(c => {
      const stats = countMap[c._id.toString()]
      return {
        ...c,
        totalSteps: c.steps?.length || 0,
        attemptCount: stats?.total || 0,
        completedCount: stats?.completed || 0,
        avgScore: stats?.avgScore ? Math.round(stats.avgScore) : null
      }
    })

    res.json(result)
  } catch (err) {
    console.error('[MEQ Admin] listCases error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/admin/meq/:id — get full case with all steps
 */
exports.getCase = async (req, res) => {
  try {
    const meqCase = await MeqCase.findById(req.params.id).lean()
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })
    res.json(meqCase)
  } catch (err) {
    console.error('[MEQ Admin] getCase error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/admin/meq — create case
 */
exports.createCase = async (req, res) => {
  try {
    const { title, scenario, category, difficulty, tags, approachId, steps, estimatedMinutes, isPublished } = req.body

    const meqCase = new MeqCase({
      title,
      scenario,
      category,
      difficulty,
      tags,
      approachId: approachId || null,
      steps: steps || [],
      estimatedMinutes,
      isPublished: isPublished || false,
      createdBy: req.user._id
    })

    await meqCase.save()
    res.status(201).json(meqCase)
  } catch (err) {
    console.error('[MEQ Admin] createCase error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * PUT /api/admin/meq/:id — update case
 */
exports.updateCase = async (req, res) => {
  try {
    const meqCase = await MeqCase.findById(req.params.id)
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })

    const allowed = ['title', 'scenario', 'category', 'difficulty', 'tags', 'approachId', 'steps', 'estimatedMinutes', 'isPublished']
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        meqCase[key] = req.body[key]
      }
    }

    await meqCase.save() // triggers pre-save totalPoints recalc
    res.json(meqCase)
  } catch (err) {
    console.error('[MEQ Admin] updateCase error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * DELETE /api/admin/meq/:id — delete case
 */
exports.deleteCase = async (req, res) => {
  try {
    const meqCase = await MeqCase.findById(req.params.id)
    if (!meqCase) return res.status(404).json({ message: 'ไม่พบ case' })

    // Check for active attempts
    const activeCount = await MeqAttempt.countDocuments({
      caseId: meqCase._id,
      status: 'in_progress'
    })
    if (activeCount > 0) {
      return res.status(403).json({
        message: `มีนักเรียน ${activeCount} คนกำลังทำอยู่ ลบไม่ได้`
      })
    }

    await MeqCase.findByIdAndDelete(req.params.id)
    // Also clean up completed attempts
    await MeqAttempt.deleteMany({ caseId: meqCase._id })

    res.json({ message: 'ลบ case เรียบร้อย' })
  } catch (err) {
    console.error('[MEQ Admin] deleteCase error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/admin/meq/analytics — overall case stats
 */
exports.getAnalytics = async (req, res) => {
  try {
    const totalCases = await MeqCase.countDocuments()
    const publishedCases = await MeqCase.countDocuments({ isPublished: true })
    const totalAttempts = await MeqAttempt.countDocuments()
    const completedAttempts = await MeqAttempt.countDocuments({ status: 'completed' })

    // Per-case stats
    const perCase = await MeqAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: '$caseId',
        attempts: { $sum: 1 },
        avgScore: { $avg: '$percentScore' },
        avgTime: { $avg: '$timeTakenSec' },
        uniqueUsers: { $addToSet: '$userId' }
      }},
      { $project: {
        attempts: 1,
        avgScore: { $round: ['$avgScore', 1] },
        avgTime: { $round: ['$avgTime', 0] },
        uniqueUsers: { $size: '$uniqueUsers' }
      }},
      { $sort: { attempts: -1 } }
    ])

    // Enrich with case titles
    const caseIds = perCase.map(p => p._id)
    const cases = await MeqCase.find({ _id: { $in: caseIds } })
      .select('title category difficulty')
      .lean()
    const caseMap = {}
    for (const c of cases) caseMap[c._id.toString()] = c

    const perCaseEnriched = perCase.map(p => ({
      caseId: p._id,
      title: caseMap[p._id.toString()]?.title || '(ลบแล้ว)',
      category: caseMap[p._id.toString()]?.category || '',
      difficulty: caseMap[p._id.toString()]?.difficulty || '',
      attempts: p.attempts,
      uniqueUsers: p.uniqueUsers,
      avgScore: p.avgScore,
      avgTimeSec: p.avgTime
    }))

    // Score distribution
    const scoreDistribution = await MeqAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $bucket: {
        groupBy: '$percentScore',
        boundaries: [0, 20, 40, 60, 80, 101],
        default: 'other',
        output: { count: { $sum: 1 } }
      }}
    ])

    res.json({
      totalCases,
      publishedCases,
      totalAttempts,
      completedAttempts,
      completionRate: totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0,
      perCase: perCaseEnriched,
      scoreDistribution
    })
  } catch (err) {
    console.error('[MEQ Admin] getAnalytics error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}
