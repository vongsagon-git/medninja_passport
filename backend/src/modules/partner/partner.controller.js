const User = require('../user/User.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')

/**
 * POST /api/partner/check-entitlement
 * NLEX เรียกมาเช็คว่า user มีสิทธิ์ NLEX ไหม
 * รับ: { lineUserId } หรือ { nationalId } (fallback)
 * คืน: { found, studentName, entitlements[] }
 */
exports.checkEntitlement = async (req, res) => {
  try {
    const { lineUserId, nationalId } = req.body

    if (!lineUserId && !nationalId) {
      return res.status(400).json({ error: 'missing_identifier', message: 'ต้องส่ง lineUserId หรือ nationalId' })
    }

    // 1) หา User
    const query = lineUserId
      ? { lineUserId: lineUserId.trim() }
      : { nationalId: nationalId.trim() }

    const user = await User.findOne(query)
      .select('_id firstName lastName name')
      .lean()

    if (!user) {
      return res.json({ found: false, entitlements: [] })
    }

    // 2) หา Activation ที่ active + ยังไม่หมดอายุ
    const now = new Date()
    const activations = await Activation.find({
      userId: user._id,
      isActive: true,
      expiresAt: { $gt: now }
    }).lean()

    if (activations.length === 0) {
      return res.json({
        found: true,
        studentName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || '',
        entitlements: []
      })
    }

    // 3) กรอง Activation ที่ nlexEnabled: true (per-student)
    const nlexActivations = activations.filter(a => a.nlexEnabled)
    const packageIds = [...new Set(nlexActivations.map(a => a.packageId?.toString()).filter(Boolean))]
    const packages = packageIds.length > 0
      ? await Package.find({ _id: { $in: packageIds } }).select('_id title').lean()
      : []
    const pkgMap = new Map(packages.map(p => [p._id.toString(), p]))

    // 4) สร้าง entitlements
    const entitlements = nlexActivations
      .map(a => {
        const pkg = pkgMap.get(a.packageId?.toString())
        const daysLeft = Math.ceil((new Date(a.expiresAt) - now) / (1000 * 60 * 60 * 24))
        return {
          hasAccess: true,
          packageName: pkg?.title || 'Unknown',
          activatedAt: a.activatedAt,
          expiresAt: a.expiresAt,
          daysLeft
        }
      })

    const studentName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || ''

    res.json({ found: true, studentName, entitlements })
  } catch (error) {
    console.error('[Partner] check-entitlement error:', error.message)
    res.status(500).json({ error: 'internal_error' })
  }
}
