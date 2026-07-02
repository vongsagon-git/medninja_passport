/**
 * Activation Admin Controller
 * Admin: สร้าง, extend, revoke activations
 *
 * NOTE: Activation (passportConn) → Package (lmsConn) ข้าม DB
 *       ใช้ manual lookup แทน .populate('packageId')
 */
const Activation = require('./Activation.model')
const ConsentLog = require('./ConsentLog.model')
const { CURRENT_TERMS_VERSION } = require('./activation.controller')
const Package = require('../content/Package.model')
const User = require('../user/User.model')
const LineFollower = require('../line/LineFollower.model')
const PreRegistration = require('../preregister/PreRegistration.model')

/**
 * Helper: enrich activations ด้วย package data จาก lmsConn
 * ใช้แทน .populate('packageId') ที่ข้าม DB ไม่ได้
 */
async function enrichWithPackages(activations) {
  const pkgIds = [...new Set(
    activations.map(a => (a.packageId?._id || a.packageId)?.toString()).filter(Boolean)
  )]
  if (pkgIds.length === 0) return activations

  const packages = await Package.find({ _id: { $in: pkgIds } })
    .select('title durationDays')
    .lean()
  const pkgMap = new Map(packages.map(p => [p._id.toString(), p]))

  return activations.map(a => ({
    ...a,
    packageId: pkgMap.get((a.packageId?._id || a.packageId)?.toString()) || null
  }))
}

/**
 * GET /api/admin/activations
 * ดูทุก activation + filter by userId, packageId, status
 */
exports.getAllActivations = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.userId) filter.userId = req.query.userId
    if (req.query.packageId) filter.packageId = req.query.packageId
    if (req.query.active === 'true') filter.isActive = true
    if (req.query.active === 'false') filter.isActive = false

    const activations = await Activation.find(filter)
      .populate('userId', 'name email phone nationalId firstName lastName role university lineUserId lineDisplayName linePictureUrl')
      .populate('activatedBy', 'name email')
      .sort('-createdAt')
      .lean()

    // Manual lookup: Package (lmsConn)
    const enriched = await enrichWithPackages(activations)

    // ดึง consent status ทุก activation
    const activationIds = enriched.map(a => a._id)
    const consentLogs = await ConsentLog.find({
      activationId: { $in: activationIds },
      termsVersion: CURRENT_TERMS_VERSION
    }).select('activationId acceptedAt').lean()
    const consentMap = new Map(consentLogs.map(c => [c.activationId.toString(), c.acceptedAt]))

    // ดึง LINE follow status
    const linkedLineUids = enriched
      .map(a => a.userId?.lineUserId)
      .filter(Boolean)
    const followMap = new Map()
    if (linkedLineUids.length) {
      const followers = await LineFollower.find({ lineUserId: { $in: [...new Set(linkedLineUids)] } })
        .select('lineUserId isFollowing')
        .lean()
      for (const f of followers) {
        followMap.set(f.lineUserId, f.isFollowing !== false)
      }
    }

    // ดึงสถานะ CMA (ศรว.) จาก PreRegistration — lookup โดย nationalId
    const nids = [...new Set(enriched.map(a => a.userId?.nationalId).filter(Boolean))]
    const cmaMap = new Map()
    if (nids.length) {
      const preRegs = await PreRegistration.find({ nationalId: { $in: nids } })
        .select('nationalId cmaRegistered cmaPassedAll cmaSyncedAt cmaNameTh cmaNameEn')
        .lean()
      for (const p of preRegs) {
        cmaMap.set(p.nationalId, {
          cmaRegistered: !!p.cmaRegistered,
          cmaPassedAll: !!p.cmaPassedAll,
          cmaSyncedAt: p.cmaSyncedAt || null,
          cmaNameTh: p.cmaNameTh || '',
          cmaNameEn: p.cmaNameEn || ''
        })
      }
    }

    // เพิ่ม computed status + consent + lineFollowing + CMA
    const now = new Date()
    const result = enriched.map(a => {
      const obj = {
        ...a,
        status: !a.isActive ? 'revoked' : new Date(a.expiresAt) < now ? 'expired' : 'active',
        consentAcceptedAt: consentMap.get(a._id.toString()) || null
      }
      if (a.userId?.lineUserId) {
        obj.lineFollowing = followMap.has(a.userId.lineUserId) ? followMap.get(a.userId.lineUserId) : null
      }
      // CMA — ใส่ flag ลงไปทุกแถวถ้ามี nationalId
      const nid = a.userId?.nationalId
      if (nid) {
        const cma = cmaMap.get(nid)
        if (cma) {
          obj.cmaRegistered = cma.cmaRegistered
          obj.cmaPassedAll = cma.cmaPassedAll
          obj.cmaSyncedAt = cma.cmaSyncedAt
          obj.cmaNameTh = cma.cmaNameTh
        } else {
          // ไม่มี PreRegistration → ไม่เคย sync เลย
          obj.cmaSyncedAt = null
        }
      }
      return obj
    })

    res.json({ activations: result })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/admin/activations
 * สร้าง activation ให้ user
 * Body: { userId, packageId, durationDays?, note? }
 */
exports.createActivation = async (req, res, next) => {
  try {
    const { userId, packageId, durationDays, note } = req.body

    // ตรวจว่า user (passportConn) + package (lmsConn) มีจริง
    const [user, pkg] = await Promise.all([
      User.findById(userId).select('name email'),
      Package.findById(packageId).select('title durationDays')
    ])

    if (!user) return res.status(404).json({ message: 'ไม่พบ User' })
    if (!pkg) return res.status(404).json({ message: 'ไม่พบ Package' })

    // คำนวณวันหมดอายุ
    const days = durationDays || pkg.durationDays || 365
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    const tier = typeof req.body.tier === 'number' && [1, 2, 3, 4, 5, 6].includes(req.body.tier)
      ? req.body.tier
      : 6

    const activation = await Activation.create({
      userId,
      packageId,
      expiresAt,
      activatedBy: req.user._id,
      note: note || `Activated by admin: ${req.user.name}`,
      tier
    })

    // Populate user + activatedBy (same DB) → manual lookup package (cross-DB)
    const populated = await Activation.findById(activation._id)
      .populate('userId', 'name email')
      .populate('activatedBy', 'name email')
      .lean()

    populated.packageId = { _id: pkg._id, title: pkg.title, durationDays: pkg.durationDays }

    res.status(201).json({ activation: populated })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/admin/activations/:id
 * แก้ไข activation (extend, toggle active, note)
 * Body: { extendDays?, isActive?, note? }
 */
exports.updateActivation = async (req, res, next) => {
  try {
    const activation = await Activation.findById(req.params.id)
    if (!activation) {
      return res.status(404).json({ message: 'ไม่พบ Activation' })
    }

    // Extend expiry
    if (req.body.extendDays) {
      const days = parseInt(req.body.extendDays, 10)
      if (days > 0) {
        const currentExpiry = new Date(activation.expiresAt)
        const now = new Date()
        // ถ้าหมดอายุแล้ว → ต่อจากวันนี้ | ยังไม่หมด → ต่อจากวันเดิม
        const baseDate = currentExpiry < now ? now : currentExpiry
        baseDate.setDate(baseDate.getDate() + days)
        activation.expiresAt = baseDate
        activation.extendedDays = (activation.extendedDays || 0) + days
      }
    }

    // Toggle active
    if (typeof req.body.isActive === 'boolean') {
      activation.isActive = req.body.isActive
    }

    // Note
    if (req.body.note) {
      activation.note = req.body.note
    }

    // Tier — แก้ได้ตลอดเวลา แต่ต้องใส่รหัสยืนยัน
    if (typeof req.body.tier === 'number' && [1, 2, 3, 4, 5, 6].includes(req.body.tier)) {
      if (req.body.tierConfirm !== 'medninja') {
        return res.status(403).json({ message: 'ต้องใส่รหัสยืนยันเพื่อแก้ tier', code: 'TIER_CONFIRM_REQUIRED' })
      }
      activation.tier = req.body.tier
    }

    await activation.save()

    // Populate user (same DB) + manual lookup package (cross-DB)
    const populated = await Activation.findById(activation._id)
      .populate('userId', 'name email')
      .populate('activatedBy', 'name email')
      .lean()

    const enriched = await enrichWithPackages([populated])

    res.json({ activation: enriched[0] })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/admin/activations/:id
 * แบนชั่วคราว (soft — set isActive: false)
 * นักเรียนจะไม่เห็น activation นี้ → features ของใบนี้ดับหมดอัตโนมัติ
 * (getMyActivations filter isActive: true)
 */
exports.deleteActivation = async (req, res, next) => {
  try {
    const { reason } = req.body || {}
    const cleanReason = (reason || '').trim()
    const banNote = `Banned by admin ${req.user.name}${cleanReason ? ` — เหตุผล: ${cleanReason}` : ''}`
    const activation = await Activation.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        note: banNote,
        banReason: cleanReason,
        bannedAt: new Date()
      },
      { new: true }
    )
    if (!activation) {
      return res.status(404).json({ message: 'ไม่พบ Activation' })
    }
    res.json({ message: 'แบนเรียบร้อย', activation })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/admin/activations/:id/unban
 * ปลดแบน — set isActive: true กลับ (เก็บ feature flags เดิม)
 */
exports.unbanActivation = async (req, res, next) => {
  try {
    const activation = await Activation.findById(req.params.id)
    if (!activation) {
      return res.status(404).json({ message: 'ไม่พบ Activation' })
    }
    if (activation.isActive) {
      return res.status(400).json({ message: 'Activation นี้ไม่ได้ถูกแบน' })
    }
    activation.isActive = true
    const prevReason = activation.banReason
    const prevNote = activation.note ? `${activation.note} | ` : ''
    activation.note = `${prevNote}Unbanned by admin ${req.user.name}${prevReason ? ` (เหตุผลเดิม: ${prevReason})` : ''}`
    activation.banReason = ''
    activation.bannedAt = null
    await activation.save()
    res.json({ message: 'ปลดแบนเรียบร้อย', activation })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/admin/activations/:id/permanent
 * Hard delete — ลบออกจาก DB ถาวร (ลบได้ทันที ไม่ต้องแบนก่อน)
 */
exports.hardDeleteActivation = async (req, res, next) => {
  try {
    const activation = await Activation.findById(req.params.id)
    if (!activation) {
      return res.status(404).json({ message: 'ไม่พบ Activation' })
    }
    await Activation.deleteOne({ _id: activation._id })
    res.json({ message: 'ลบ activation ถาวรเรียบร้อย', _id: activation._id })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/admin/activations/:id/move
 * ย้ายคอร์ส — เปลี่ยน packageId (เก็บ expiresAt + flags เดิม)
 * Body: { newPackageId, resetExpiry? }
 *   - resetExpiry: true → ตั้งวันหมดอายุใหม่ตาม durationDays ของ package ใหม่
 *                  false (default) → คงวันหมดอายุเดิม
 */
exports.moveActivation = async (req, res, next) => {
  try {
    const { newPackageId, resetExpiry } = req.body
    if (!newPackageId) {
      return res.status(400).json({ message: 'ต้องระบุ newPackageId' })
    }

    const activation = await Activation.findById(req.params.id)
    if (!activation) return res.status(404).json({ message: 'ไม่พบ Activation' })

    if (String(activation.packageId) === String(newPackageId)) {
      return res.status(400).json({ message: 'คอร์สปลายทางเหมือนกับคอร์สปัจจุบัน' })
    }

    const newPkg = await Package.findById(newPackageId).select('title durationDays')
    if (!newPkg) return res.status(404).json({ message: 'ไม่พบ Package ปลายทาง' })

    // กันซ้ำ — user มี activation ของ package ใหม่อยู่แล้วไหม
    const dup = await Activation.findOne({
      userId: activation.userId,
      packageId: newPackageId,
      _id: { $ne: activation._id }
    })
    if (dup) {
      return res.status(400).json({
        message: `นักเรียนคนนี้มีสิทธิ์ "${newPkg.title}" อยู่แล้ว`
      })
    }

    const oldPackageId = activation.packageId
    activation.packageId = newPackageId
    if (resetExpiry) {
      const days = newPkg.durationDays || 365
      const exp = new Date()
      exp.setDate(exp.getDate() + days)
      activation.expiresAt = exp
    }
    const prevNote = activation.note ? `${activation.note} | ` : ''
    activation.note = `${prevNote}Moved by admin ${req.user.name}: ${oldPackageId} → ${newPackageId}`
    await activation.save()

    const populated = await Activation.findById(activation._id)
      .populate('userId', 'name email firstName lastName')
      .populate('activatedBy', 'name email')
      .lean()
    const enriched = await enrichWithPackages([populated])

    res.json({ activation: enriched[0] })
  } catch (error) {
    next(error)
  }
}
