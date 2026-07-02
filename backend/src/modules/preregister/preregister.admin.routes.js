const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const PreRegistration = require('./PreRegistration.model')
const User = require('../user/User.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const { generateVerifyToken, sendVerificationEmail } = require('../auth/email.service')
const LineFollower = require('../line/LineFollower.model')
const cmaService = require('./cma.service')

// GET /api/admin/passport — ดึงรายการ preregistration ทั้งหมด
router.get('/', auth, admin, async (req, res) => {
  try {
    const registrations = await PreRegistration
      .find()
      .select('-idCardImage -ocrRawResponse -cmaProfileImage')
      .sort({ createdAt: -1 })
      .lean()

    // เพิ่ม LINE info + role จาก User
    const nids = registrations.map(r => r.nationalId).filter(Boolean)
    const users = await User.find({ nationalId: { $in: nids } })
      .select('nationalId lineUserId lineDisplayName linePictureUrl role')
      .lean()
    const userMap = new Map(users.map(u => [u.nationalId, u]))

    // ดึง activations ทั้งหมด (active + ยังไม่หมดอายุ)
    const userIds = users.map(u => u._id)
    const allPackages = await Package.find().select('_id title isDemo').lean()
    const pkgMap = new Map(allPackages.map(p => [p._id.toString(), p]))
    const allActivations = await Activation.find({
      userId: { $in: userIds },
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).lean()

    // แยก map: คอร์สจริง vs ทดลอง
    const actMap = new Map()    // คอร์สจริง
    const demoMap = new Map()   // ทดลอง
    for (const act of allActivations) {
      const uid = act.userId.toString()
      const pkg = pkgMap.get(act.packageId.toString())
      const entry = {
        packageName: pkg?.title || 'ไม่ทราบ',
        expiresAt: act.expiresAt,
        daysLeft: Math.ceil((act.expiresAt - new Date()) / 86400000),
        isDemo: pkg?.isDemo || false
      }
      if (pkg?.isDemo) {
        if (!demoMap.has(uid)) demoMap.set(uid, [])
        demoMap.get(uid).push(entry)
      } else {
        if (!actMap.has(uid)) actMap.set(uid, [])
        actMap.get(uid).push(entry)
      }
    }

    // ดึง demo ที่หมดอายุแล้วด้วย (สำหรับคนยังไม่ลงคอร์ส)
    const demoPackageIds = allPackages.filter(p => p.isDemo).map(p => p._id)
    if (demoPackageIds.length) {
      const expiredDemos = await Activation.find({
        userId: { $in: userIds },
        isActive: true,
        packageId: { $in: demoPackageIds },
        expiresAt: { $lte: new Date() }
      }).lean()
      for (const act of expiredDemos) {
        const uid = act.userId.toString()
        const pkg = pkgMap.get(act.packageId.toString())
        if (!demoMap.has(uid)) demoMap.set(uid, [])
        demoMap.get(uid).push({
          packageName: pkg?.title || 'ไม่ทราบ',
          expiresAt: act.expiresAt,
          daysLeft: Math.ceil((act.expiresAt - new Date()) / 86400000),
          isDemo: true,
          expired: true
        })
      }
    }

    // ดึง follow status จาก LineFollower สำหรับ user ที่เชื่อม LINE แล้ว
    const linkedLineUids = users.filter(u => u.lineUserId).map(u => u.lineUserId)
    const followMap = new Map()
    if (linkedLineUids.length) {
      const followers = await LineFollower.find({ lineUserId: { $in: linkedLineUids } })
        .select('lineUserId isFollowing unfollowedAt')
        .lean()
      for (const f of followers) {
        followMap.set(f.lineUserId, { isFollowing: f.isFollowing, unfollowedAt: f.unfollowedAt })
      }
    }

    for (const reg of registrations) {
      const u = userMap.get(reg.nationalId)
      if (u) {
        const uid = u._id.toString()
        reg.lineUserId = u.lineUserId || null
        reg.lineDisplayName = u.lineDisplayName || null
        reg.linePictureUrl = u.linePictureUrl || null
        reg.role = u.role || 'student'
        reg.activations = actMap.get(uid) || []
        reg.demoActivations = demoMap.get(uid) || []
        // follow status
        if (u.lineUserId && followMap.has(u.lineUserId)) {
          const fInfo = followMap.get(u.lineUserId)
          reg.lineFollowing = fInfo.isFollowing !== false
          reg.lineUnfollowedAt = fInfo.unfollowedAt || null
        } else if (u.lineUserId) {
          reg.lineFollowing = null // ไม่มีข้อมูลใน LineFollower
        }
      } else {
        reg.role = null
        reg.activations = []
        reg.demoActivations = []
      }
    }

    res.json({ registrations })
  } catch (err) {
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// GET /api/admin/passport/line-candidates — LINE followers ที่ยังไม่ได้เชื่อมกับ User
router.get('/line-candidates', auth, admin, async (req, res) => {
  try {
    const linkedUsers = await User.find({ lineUserId: { $exists: true, $ne: null } })
      .select('lineUserId')
      .lean()
    const linkedUids = new Set(linkedUsers.map(u => u.lineUserId))

    const followers = await LineFollower.find({ isFollowing: true })
      .select('lineUserId displayName pictureUrl tag')
      .sort({ displayName: 1 })
      .lean()

    const candidates = followers
      .filter(f => !linkedUids.has(f.lineUserId))
      .map(f => ({
        lineUserId: f.lineUserId,
        displayName: f.displayName || '(ไม่มีชื่อ)',
        pictureUrl: f.pictureUrl || '',
        tag: f.tag || ''
      }))

    res.json({ candidates })
  } catch (err) {
    res.status(500).json({ message: 'โหลดไม่สำเร็จ' })
  }
})

// GET /api/admin/passport/:id — ดึงข้อมูลเต็ม (รวมรูปบัตร + OCR raw)
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    // ดึง emailVerified จาก User
    const user = await User.findOne({ nationalId: reg.nationalId }).select('emailVerified').lean()
    reg._emailVerified = user?.emailVerified || false
    res.json({ registration: reg })
  } catch (err) {
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// PATCH /api/admin/passport/:id/status — เปลี่ยนสถานะ
router.patch('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body
    if (!['pending', 'reviewed'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' })
    }
    const reg = await PreRegistration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-idCardImage -ocrRawResponse')

    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    res.json({ registration: reg })
  } catch (err) {
    res.status(500).json({ message: 'อัปเดตไม่สำเร็จ' })
  }
})

// PATCH /api/admin/passport/:id/sex — ใส่/แก้เพศแบบเร็ว (1 คลิกในแถว)
router.patch('/:id/sex', auth, admin, async (req, res) => {
  try {
    const { sex } = req.body
    if (!['M', 'F', ''].includes(sex)) {
      return res.status(400).json({ message: 'เพศไม่ถูกต้อง' })
    }
    const reg = await PreRegistration.findByIdAndUpdate(
      req.params.id,
      { sex },
      { new: true }
    ).select('-idCardImage -ocrRawResponse')
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

    // sync ไป User
    const user = await User.findOne({ nationalId: reg.nationalId })
    if (user) {
      user.sex = sex
      await user.save()
    }

    res.json({ registration: reg })
  } catch (err) {
    res.status(500).json({ message: 'อัปเดตเพศไม่สำเร็จ' })
  }
})

// PUT /api/admin/passport/:id — แก้ไขข้อมูล pre-registration + sync User
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id)
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

    const allowedFields = [
      'firstName', 'lastName', 'firstNameEn', 'lastNameEn',
      'nationalId', 'dateOfBirth', 'sex', 'phone', 'email', 'university'
    ]

    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field]
      }
    }

    // sex ต้องเป็น M/F/'' เท่านั้น
    if (updates.sex !== undefined && !['M', 'F', ''].includes(updates.sex)) {
      return res.status(400).json({ message: 'เพศไม่ถูกต้อง' })
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'ไม่มีข้อมูลที่จะอัปเดต' })
    }

    // validate nationalId format + uniqueness ถ้าเปลี่ยน
    if (updates.nationalId && updates.nationalId !== reg.nationalId) {
      if (!/^\d{13}$/.test(updates.nationalId)) {
        return res.status(400).json({ message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' })
      }
      const dup = await PreRegistration.findOne({
        nationalId: updates.nationalId,
        _id: { $ne: reg._id }
      })
      if (dup) {
        return res.status(409).json({ message: 'เลขบัตรนี้มีผู้ลงทะเบียนแล้ว' })
      }
    }

    // อัปเดต PreRegistration
    const oldNationalId = reg.nationalId
    Object.assign(reg, updates)
    await reg.save()

    // Sync ไปยัง User record ที่สร้างจาก PreRegistration
    const user = await User.findOne({ nationalId: oldNationalId })
    if (user) {
      if (updates.firstName || updates.lastName) {
        user.name = `${updates.firstName || reg.firstName} ${updates.lastName || reg.lastName}`
      }
      if (updates.firstName) user.firstName = updates.firstName
      if (updates.lastName) user.lastName = updates.lastName
      if (updates.nationalId) user.nationalId = updates.nationalId
      if (updates.dateOfBirth) user.dateOfBirth = updates.dateOfBirth
      if (updates.sex !== undefined) user.sex = updates.sex
      if (updates.phone) user.phone = updates.phone
      if (updates.email) user.email = updates.email
      if (updates.university) user.university = updates.university
      await user.save()
    }

    // ส่ง response (ไม่รวม idCardImage + ocrRawResponse)
    const result = reg.toObject()
    delete result.idCardImage
    delete result.ocrRawResponse

    res.json({ registration: result, userSynced: !!user })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'ข้อมูลซ้ำ (เลขบัตรหรืออีเมล)' })
    }
    res.status(500).json({ message: 'อัปเดตไม่สำเร็จ' })
  }
})

// POST /api/admin/passport/:id/resend-verify — ส่งอีเมลยืนยันอีกครั้ง
router.post('/:id/resend-verify', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' })
    if (user.emailVerified) return res.status(400).json({ message: 'อีเมลยืนยันแล้ว' })

    const { token: verifyToken, expires: verifyExpires } = generateVerifyToken()
    user.verifyToken = verifyToken
    user.verifyExpires = verifyExpires
    await user.save()

    await sendVerificationEmail(user.email, user.name, verifyToken)
    res.json({ message: `ส่งอีเมลยืนยันไปที่ ${user.email} เรียบร้อย` })
  } catch (err) {
    res.status(500).json({ message: 'ส่งอีเมลไม่สำเร็จ: ' + err.message })
  }
})

// POST /api/admin/passport/:id/link-line — Admin เชื่อม LINE ให้ user
router.post('/:id/link-line', auth, admin, async (req, res) => {
  try {
    const { lineUserId } = req.body
    if (!lineUserId) return res.status(400).json({ message: 'ไม่มี lineUserId' })

    const reg = await PreRegistration.findById(req.params.id).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล Passport' })

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' })

    // เช็คว่า lineUserId นี้เชื่อมกับ user อื่นอยู่หรือไม่
    const existing = await User.findOne({ lineUserId, _id: { $ne: user._id } }).lean()
    if (existing) return res.status(409).json({ message: 'LINE นี้เชื่อมกับบัญชีอื่นอยู่แล้ว' })

    // ดึงข้อมูล LINE จาก LineFollower
    const follower = await LineFollower.findOne({ lineUserId }).lean()
    const lineDisplayName = follower?.displayName || ''
    const linePictureUrl = follower?.pictureUrl || ''

    // บันทึกลง User
    user.lineUserId = lineUserId
    user.lineDisplayName = lineDisplayName
    user.linePictureUrl = linePictureUrl
    user.lineLinkedAt = new Date()
    await user.save()

    // อัปเดต LineFollower.linkedUserId
    if (follower) {
      await LineFollower.findOneAndUpdate(
        { lineUserId },
        { linkedUserId: user._id, tagUpdatedAt: new Date(), tagUpdatedBy: 'admin-passport' }
      )
    }

    res.json({ ok: true, lineUserId, lineDisplayName, linePictureUrl })
  } catch (err) {
    res.status(500).json({ message: 'เชื่อม LINE ไม่สำเร็จ' })
  }
})

// POST /api/admin/passport/:id/unlink-line — Admin ยกเลิกเชื่อม LINE
router.post('/:id/unlink-line', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล Passport' })

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' })

    const oldLineUserId = user.lineUserId

    await User.findByIdAndUpdate(user._id, {
      $unset: { lineUserId: '', lineDisplayName: '', linePictureUrl: '', lineLinkedAt: '' }
    })

    // ลบ linkedUserId จาก LineFollower
    if (oldLineUserId) {
      await LineFollower.findOneAndUpdate(
        { lineUserId: oldLineUserId },
        { linkedUserId: null }
      )
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'ยกเลิกเชื่อม LINE ไม่สำเร็จ' })
  }
})

// DELETE /api/admin/passport/:id — ลบ record
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findByIdAndDelete(req.params.id)
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    res.json({ message: 'ลบสำเร็จ' })
  } catch (err) {
    res.status(500).json({ message: 'ลบไม่สำเร็จ' })
  }
})

// POST /api/admin/passport/sync-cma — sync สถานะ ศรว. สำหรับคนที่ยังไม่เคยเช็คว่าเคยสมัคร
// body: { force?: boolean } — force=true จะ sync ทุกคน (รวมคนที่ cmaRegistered=true แล้ว)
// ข้าม admin + staff อัตโนมัติ (ไม่ใช่กลุ่มเป้าหมาย)
router.post('/sync-cma', auth, admin, async (req, res) => {
  try {
    const { force = false } = req.body || {}

    // หาเลขบัตรของ admin + staff เพื่อ exclude
    const skipUsers = await User.find({ role: { $in: ['admin', 'staff'] } })
      .select('nationalId')
      .lean()
    const skipNids = skipUsers.map(u => u.nationalId).filter(Boolean)

    const baseQuery = force
      ? {}
      : { $or: [{ cmaRegistered: { $exists: false } }, { cmaRegistered: false }] }

    const query = skipNids.length
      ? { ...baseQuery, nationalId: { $nin: skipNids } }
      : baseQuery

    const targets = await PreRegistration.find(query)
      .select('_id nationalId firstName lastName cmaRegistered')
      .lean()

    const results = {
      total: targets.length,
      registered: 0,
      notRegistered: 0,
      errors: 0,
      detail: []
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    for (const t of targets) {
      try {
        const r = await cmaService.syncOne(t.nationalId, { fetchImage: true })
        const update = {
          cmaRegistered: !!r.registered,
          cmaSyncedAt: new Date()
        }
        if (r.registered) {
          results.registered++
          if (r.nameTh) update.cmaNameTh = r.nameTh
          if (r.nameEn) update.cmaNameEn = r.nameEn
          if (r.profileImageUrl) update.cmaProfileImageUrl = r.profileImageUrl
          if (r.cmaProfileImage) update.cmaProfileImage = r.cmaProfileImage
          update.cmaPassedAll = !!r.passedAll
        } else {
          results.notRegistered++
        }
        await PreRegistration.findByIdAndUpdate(t._id, update)
        results.detail.push({
          id: t._id,
          nationalId: t.nationalId,
          name: `${t.firstName} ${t.lastName}`,
          registered: !!r.registered,
          passedAll: !!r.passedAll,
          hasImage: !!(r.cmaProfileImage)
        })
      } catch (e) {
        results.errors++
        results.detail.push({
          id: t._id,
          nationalId: t.nationalId,
          name: `${t.firstName} ${t.lastName}`,
          error: e.message
        })
      }
      await sleep(400) // กัน rate limit
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ message: 'Sync ไม่สำเร็จ: ' + err.message })
  }
})

// POST /api/admin/passport/:id/sync-cma-one — sync เฉพาะคนเดียว (ใช้ตอน admin กดในหน้า detail)
router.post('/:id/sync-cma-one', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id)
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

    const r = await cmaService.syncOne(reg.nationalId, { fetchImage: true })
    reg.cmaRegistered = !!r.registered
    reg.cmaSyncedAt = new Date()
    if (r.registered) {
      if (r.nameTh) reg.cmaNameTh = r.nameTh
      if (r.nameEn) reg.cmaNameEn = r.nameEn
      if (r.profileImageUrl) reg.cmaProfileImageUrl = r.profileImageUrl
      if (r.cmaProfileImage) reg.cmaProfileImage = r.cmaProfileImage
      reg.cmaPassedAll = !!r.passedAll
    }
    await reg.save()

    res.json({
      ok: true,
      registered: !!r.registered,
      passedAll: !!r.passedAll,
      nameTh: r.nameTh || '',
      nameEn: r.nameEn || '',
      hasImage: !!r.cmaProfileImage
    })
  } catch (err) {
    res.status(500).json({ message: 'Sync ไม่สำเร็จ: ' + err.message })
  }
})

module.exports = router
