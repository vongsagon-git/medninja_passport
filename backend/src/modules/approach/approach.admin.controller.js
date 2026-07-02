const Approach = require('./Approach.model')
const ApproachCategory = require('./ApproachCategory.model')
const ApproachProgress = require('./ApproachProgress.model')
const ApproachAttempt = require('./ApproachAttempt.model')

// ═══════════════════════════════════════════
// Approach CRUD
// ═══════════════════════════════════════════

/**
 * GET /api/admin/approaches — list all approaches (admin sees unpublished too)
 */
exports.listApproaches = async (req, res) => {
  try {
    const approaches = await Approach.find()
      .populate('category', 'code name nameEn icon color')
      .sort({ order: 1, createdAt: -1 })
      .lean()

    // Count progress per approach
    const approachIds = approaches.map(a => a._id)
    const progressCounts = await ApproachProgress.aggregate([
      { $match: { approachId: { $in: approachIds } } },
      { $group: { _id: '$approachId', count: { $sum: 1 } } }
    ])

    const countMap = {}
    for (const pc of progressCounts) {
      countMap[pc._id.toString()] = pc.count
    }

    const result = approaches.map(a => ({
      ...a,
      differentialCount: a.differentials?.length || 0,
      studentCount: countMap[a._id.toString()] || 0
    }))

    res.json(result)
  } catch (err) {
    console.error('[Approach Admin] listApproaches error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * GET /api/admin/approaches/:id — single approach
 */
exports.getApproach = async (req, res) => {
  try {
    const approach = await Approach.findById(req.params.id)
      .populate('category', 'code name nameEn icon color')
      .lean()

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    res.json(approach)
  } catch (err) {
    console.error('[Approach Admin] getApproach error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/admin/approaches — create approach
 */
exports.createApproach = async (req, res) => {
  try {
    const approach = await Approach.create(req.body)
    res.status(201).json(approach)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'รหัส Approach ซ้ำ' })
    }
    console.error('[Approach Admin] createApproach error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * PUT /api/admin/approaches/:id — update approach
 */
exports.updateApproach = async (req, res) => {
  try {
    const approach = await Approach.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'code name nameEn icon color')

    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    res.json(approach)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'รหัส Approach ซ้ำ' })
    }
    console.error('[Approach Admin] updateApproach error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * DELETE /api/admin/approaches/:id — delete approach
 */
exports.deleteApproach = async (req, res) => {
  try {
    const approach = await Approach.findByIdAndDelete(req.params.id)
    if (!approach) {
      return res.status(404).json({ message: 'ไม่พบ Approach' })
    }

    // Cleanup: delete related progress and attempts
    await Promise.all([
      ApproachProgress.deleteMany({ approachId: req.params.id }),
      ApproachAttempt.deleteMany({ approachId: req.params.id })
    ])

    res.json({ message: 'ลบ Approach สำเร็จ' })
  } catch (err) {
    console.error('[Approach Admin] deleteApproach error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/admin/approaches/import — bulk import from JSON
 * Body: { approaches: [...] }
 */
exports.bulkImport = async (req, res) => {
  try {
    const { approaches } = req.body
    if (!Array.isArray(approaches) || !approaches.length) {
      return res.status(400).json({ message: 'ต้องส่ง approaches เป็น array' })
    }

    const results = { created: 0, updated: 0, errors: [] }

    for (const item of approaches) {
      try {
        if (!item.code) {
          results.errors.push({ code: item.code, error: 'ไม่มี code' })
          continue
        }

        const existing = await Approach.findOne({ code: item.code.toUpperCase() })
        if (existing) {
          await Approach.findByIdAndUpdate(existing._id, item, { runValidators: true })
          results.updated++
        } else {
          await Approach.create(item)
          results.created++
        }
      } catch (e) {
        results.errors.push({ code: item.code, error: e.message })
      }
    }

    res.json(results)
  } catch (err) {
    console.error('[Approach Admin] bulkImport error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

// ═══════════════════════════════════════════
// Category CRUD
// ═══════════════════════════════════════════

/**
 * GET /api/admin/approaches/categories — list categories
 */
exports.listCategories = async (req, res) => {
  try {
    const categories = await ApproachCategory.find().sort({ order: 1 }).lean()

    // Count approaches per category
    const counts = await Approach.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    const countMap = {}
    for (const c of counts) {
      if (c._id) countMap[c._id.toString()] = c.count
    }

    const result = categories.map(c => ({
      ...c,
      approachCount: countMap[c._id.toString()] || 0
    }))

    res.json(result)
  } catch (err) {
    console.error('[Approach Admin] listCategories error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * POST /api/admin/approaches/categories — create category
 */
exports.createCategory = async (req, res) => {
  try {
    const category = await ApproachCategory.create(req.body)
    res.status(201).json(category)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'รหัส Category ซ้ำ' })
    }
    console.error('[Approach Admin] createCategory error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * PUT /api/admin/approaches/categories/:id — update category
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await ApproachCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!category) {
      return res.status(404).json({ message: 'ไม่พบ Category' })
    }

    res.json(category)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'รหัส Category ซ้ำ' })
    }
    console.error('[Approach Admin] updateCategory error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

/**
 * DELETE /api/admin/approaches/categories/:id — delete category
 */
exports.deleteCategory = async (req, res) => {
  try {
    // Check if any approach uses this category
    const usageCount = await Approach.countDocuments({ category: req.params.id })
    if (usageCount > 0) {
      return res.status(403).json({
        message: `ไม่สามารถลบได้ มี ${usageCount} Approach ที่ใช้ Category นี้อยู่`
      })
    }

    const category = await ApproachCategory.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'ไม่พบ Category' })
    }

    res.json({ message: 'ลบ Category สำเร็จ' })
  } catch (err) {
    console.error('[Approach Admin] deleteCategory error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}

// ═══════════════════════════════════════════
// Analytics
// ═══════════════════════════════════════════

/**
 * GET /api/admin/approaches/analytics — student performance stats
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Overall stats
    const [
      totalApproaches,
      publishedCount,
      totalProgress,
      masteryAgg,
      attemptStats,
      recentAttempts
    ] = await Promise.all([
      Approach.countDocuments(),
      Approach.countDocuments({ isPublished: true }),
      ApproachProgress.countDocuments(),
      ApproachProgress.aggregate([
        { $group: { _id: '$mastery', count: { $sum: 1 } } }
      ]),
      ApproachAttempt.aggregate([
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$score' },
            avgTime: { $avg: '$timeTakenSec' }
          }
        }
      ]),
      ApproachAttempt.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ])

    const mastery = {}
    for (const m of masteryAgg) {
      mastery[m._id] = m.count
    }

    // Unique students
    const uniqueStudents = await ApproachProgress.distinct('userId')

    // Top difficult approaches (lowest avg score)
    const difficultApproaches = await ApproachAttempt.aggregate([
      { $group: {
        _id: '$approachId',
        avgScore: { $avg: '$score' },
        attempts: { $sum: 1 }
      }},
      { $match: { attempts: { $gte: 3 } } },
      { $sort: { avgScore: 1 } },
      { $limit: 10 }
    ])

    // Enrich with approach names
    const difficultIds = difficultApproaches.map(d => d._id)
    const difficultDetails = await Approach.find({ _id: { $in: difficultIds } })
      .select('code symptom symptomEn')
      .lean()
    const detailMap = {}
    for (const d of difficultDetails) {
      detailMap[d._id.toString()] = d
    }

    res.json({
      totalApproaches,
      publishedCount,
      totalProgressRecords: totalProgress,
      uniqueStudents: uniqueStudents.length,
      mastery,
      attemptStats: attemptStats[0] || { totalAttempts: 0, avgScore: 0, avgTime: 0 },
      difficultApproaches: difficultApproaches.map(d => ({
        ...d,
        approach: detailMap[d._id.toString()] || null
      })),
      recentAttempts: recentAttempts.slice(0, 20)
    })
  } catch (err) {
    console.error('[Approach Admin] getAnalytics error:', err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
}
