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

// POST /api/admin/passport/:id/bypass-verify — ข้ามการยืนยันอีเมล (admin only)
router.post('/:id/bypass-verify', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' })
    if (user.emailVerified) return res.status(400).json({ message: 'อีเมลยืนยันแล้ว' })

    user.emailVerified = true
    user.verifyToken = undefined
    user.verifyExpires = undefined
    await user.save()

    console.log(`[Passport] Admin bypass email verify → ${user.email} by ${req.user?.email || 'unknown'}`)
    res.json({ message: `ยืนยันอีเมล ${user.email} สำเร็จ (bypass)`, email: user.email })
  } catch (err) {
    res.status(500).json({ message: 'Bypass ไม่สำเร็จ: ' + err.message })
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

// POST /api/admin/passport/manual-register — Admin สร้าง registration เอง + bypass email verify
// ใช้จาก skill: ส่งข้อมูลจากรูปบัตร + email + phone
router.post('/manual-register', auth, admin, async (req, res) => {
  try {
    const { validateNationalId } = require('../passport/validation')
    const {
      firstName, lastName, firstNameEn, lastNameEn,
      nationalId, dateOfBirth, sex, phone, email,
      university, idCardImage
    } = req.body

    if (!firstName || !lastName || !nationalId || !dateOfBirth || !phone || !email) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบ (firstName, lastName, nationalId, dateOfBirth, phone, email)' })
    }

    const emailClean = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' })
    }

    const nidResult = validateNationalId(nationalId)
    if (!nidResult.valid) return res.status(400).json({ message: nidResult.error })

    const existingReg = await PreRegistration.findOne({ nationalId: nidResult.cleaned }).lean()
    if (existingReg) return res.status(409).json({ message: `เลขบัตรนี้ลงทะเบียนแล้ว (${existingReg.firstName} ${existingReg.lastName})` })

    const existingUser = await User.findOne({ $or: [{ nationalId: nidResult.cleaned }, { email: emailClean }] }).lean()
    if (existingUser) {
      if (existingUser.email === emailClean) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })
      return res.status(409).json({ message: 'เลขบัตรประชาชนนี้ลงทะเบียนแล้ว' })
    }

    const sexClean = ['M', 'F'].includes(sex) ? sex : ''
    const uniClean = university ? university.trim().toUpperCase() : undefined

    // Sync ศรว. best-effort (5s timeout)
    let cmaData = { cmaRegistered: false, cmaPassedAll: false, cmaSyncedAt: null }
    try {
      const sync = await Promise.race([
        cmaService.syncOne(nidResult.cleaned, { fetchImage: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('cma_timeout')), 5000))
      ])
      cmaData.cmaSyncedAt = new Date()
      if (sync.registered) {
        cmaData.cmaRegistered = true
        cmaData.cmaPassedAll = !!sync.passedAll
        cmaData.cmaNameTh = sync.nameTh || ''
        cmaData.cmaNameEn = sync.nameEn || ''
        cmaData.cmaProfileImage = sync.cmaProfileImage || ''
      }
    } catch (e) {
      console.log(`[manual-register] CMA sync skipped: ${e.message}`)
    }

    // สร้าง PreRegistration
    const registration = await PreRegistration.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      firstNameEn: (firstNameEn || '').trim(),
      lastNameEn: (lastNameEn || '').trim(),
      nationalId: nidResult.cleaned,
      dateOfBirth,
      sex: sexClean,
      phone: phone.trim(),
      email: emailClean,
      university: uniClean,
      idCardImage: idCardImage || '',
      ocrRawResponse: 'manual-register-by-admin',
      status: 'reviewed',
      ...cmaData
    })

    // สร้าง User + bypass email verify ทันที
    const defaultPassword = dateOfBirth.replace(/\//g, '')
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    try {
      await User.create({
        name: fullName,
        email: emailClean,
        password: defaultPassword,
        phone: phone.trim(),
        nationalId: nidResult.cleaned,
        dateOfBirth,
        sex: sexClean,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        university: uniClean,
        authProvider: 'local',
        emailVerified: true,  // ← bypass ทันที
        profileLocked: true,
        profileCompletedAt: new Date()
      })
    } catch (userErr) {
      await PreRegistration.findByIdAndDelete(registration._id).catch(() => {})
      if (userErr.code === 11000) return res.status(409).json({ message: 'ข้อมูลซ้ำ' })
      return res.status(500).json({ message: 'สร้าง User ไม่สำเร็จ: ' + userErr.message })
    }

    // Auto-assign VISA demo (skip ถ้า passedAll)
    if (!cmaData.cmaPassedAll) {
      try {
        const demoPkg = await Package.findOne({ isDemo: true }).lean()
        if (demoPkg) {
          const u = await User.findOne({ nationalId: nidResult.cleaned }).select('_id').lean()
          const expires = new Date()
          expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
          await Activation.create({
            userId: u._id,
            packageId: demoPkg._id,
            expiresAt: expires,
            isActive: true,
            note: 'Manual register by admin'
          })
        }
      } catch (e) {
        console.error('[manual-register] demo VISA failed:', e.message)
      }
    }

    console.log(`[Passport] Manual register + bypass → ${emailClean} by ${req.user?.email || 'admin'}`)
    res.status(201).json({
      success: true,
      message: `ลงทะเบียน ${fullName} สำเร็จ (bypass email verify)`,
      data: {
        id: registration._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: nidResult.cleaned,
        email: emailClean,
        loginId: nidResult.cleaned,
        defaultPassword,
        emailVerified: true
      }
    })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'ข้อมูลซ้ำ' })
    console.error('[manual-register] error:', err)
    res.status(500).json({ message: 'ลงทะเบียนไม่สำเร็จ: ' + err.message })
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

// ═══════════════════════════════════════════════════════════════
// APPROVAL GATE ENDPOINTS (2026-08-06)
// user สมัคร → login ได้ แต่โดน gate จนกว่า admin จะ approve
// admin ได้ LINE flex + link `/admin/approve/:token` → กด Approve/Reject
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/passport/pending — รายการที่รออนุมัติ
router.get('/pending/list', auth, admin, async (req, res) => {
  try {
    const pending = await PreRegistration
      .find({ status: 'pending_approval' })
      .select('-idCardImage -ocrRawResponse -cmaProfileImage -approveToken')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ pending, count: pending.length })
  } catch (err) {
    res.status(500).json({ message: 'โหลดไม่สำเร็จ' })
  }
})

// GET /api/admin/passport/rejected — รายการที่โดน reject (audit hack)
router.get('/rejected/list', auth, admin, async (req, res) => {
  try {
    const rejected = await PreRegistration
      .find({ status: 'rejected' })
      .select('-idCardImage -ocrRawResponse -cmaProfileImage -approveToken')
      .sort({ rejectedAt: -1 })
      .limit(200)
      .lean()
    res.json({ rejected, count: rejected.length })
  } catch (err) {
    res.status(500).json({ message: 'โหลดไม่สำเร็จ' })
  }
})

// GET /api/admin/passport/approve/:token — โหลดข้อมูลสำหรับหน้า approve (ต้อง login admin)
// return: registration เต็ม (มีรูปบัตร + CMA image + IP/UA/LINE)
router.get('/approve/:token', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findOne({ approveToken: req.params.token }).lean()
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล หรือ token ถูกใช้ไปแล้ว' })

    if (reg.approveTokenExpires && new Date() > new Date(reg.approveTokenExpires)) {
      return res.status(410).json({ message: 'Token หมดอายุแล้ว (7 วัน) — เข้า dashboard เพื่อจัดการ' })
    }

    // Enrich: user + line follower info
    const user = await User.findOne({ nationalId: reg.nationalId })
      .select('lineUserId lineDisplayName linePictureUrl approvalStatus emailVerified role isBanned')
      .lean()

    let lineFollower = null
    if (user?.lineUserId) {
      lineFollower = await LineFollower.findOne({ lineUserId: user.lineUserId })
        .select('displayName pictureUrl tag isFollowing inChina isSpy')
        .lean()
    }

    // เช็คว่ามีคนอื่นเคยใช้ LINE UID นี้สมัครมั้ย (spy pattern)
    let otherRegsWithSameLine = []
    if (reg.submitLineUserId) {
      otherRegsWithSameLine = await PreRegistration
        .find({ submitLineUserId: reg.submitLineUserId, _id: { $ne: reg._id } })
        .select('firstName lastName nationalId status createdAt')
        .lean()
    }

    // เช็คว่า IP นี้เคยสมัครกี่ครั้ง (rate abuse pattern)
    let otherRegsWithSameIp = []
    if (reg.submitIp) {
      otherRegsWithSameIp = await PreRegistration
        .find({ submitIp: reg.submitIp, _id: { $ne: reg._id } })
        .select('firstName lastName nationalId status createdAt')
        .limit(20)
        .lean()
    }

    res.json({
      registration: reg,
      user,
      lineFollower,
      audit: {
        otherRegsWithSameLine,
        otherRegsWithSameIp
      }
    })
  } catch (err) {
    console.error('[approve/:token GET] error:', err)
    res.status(500).json({ message: 'โหลดไม่สำเร็จ' })
  }
})

// POST /api/admin/passport/approve/:token — กดอนุมัติ (bypass email verify + auto demo VISA)
router.post('/approve/:token', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findOne({ approveToken: req.params.token })
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล หรือ token ถูกใช้ไปแล้ว' })

    if (reg.status === 'approved') {
      return res.status(400).json({ message: `อนุมัติไปแล้วโดย ${reg.approvedBy || 'admin'}`, alreadyApproved: true })
    }
    if (reg.status === 'rejected') {
      return res.status(400).json({ message: 'record นี้ถูก reject ไปแล้ว' })
    }

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชี User' })

    const adminName = req.user?.name || req.user?.email || 'admin'
    const now = new Date()

    // 1) Mark PreReg + User approved
    reg.status = 'approved'
    reg.approvedBy = adminName
    reg.approvedAt = now
    reg.approveToken = undefined // invalidate token
    await reg.save()

    user.approvalStatus = 'approved'
    user.approvedBy = adminName
    user.approvedAt = now
    user.emailVerified = true // approve = bypass email verify (admin เห็นบัตรแล้ว)
    user.verifyToken = undefined
    user.verifyExpires = undefined
    await user.save()

    // 2) Auto-assign demo VISA (ย้ายมาจาก submit)
    ;(async () => {
      try {
        const demoPkg = await Package.findOne({ isDemo: true }).lean()
        if (!demoPkg) return
        // เช็คว่ามี demo activation อยู่แล้วมั้ย (กัน double assign)
        const existingDemo = await Activation.findOne({
          userId: user._id,
          packageId: demoPkg._id
        }).lean()
        if (existingDemo) return
        const expires = new Date()
        expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
        await Activation.create({
          userId: user._id,
          packageId: demoPkg._id,
          expiresAt: expires,
          isActive: true,
          note: `Auto: VISA ทดลองเรียนฟรี (approved by ${adminName})`
        })
      } catch (e) {
        console.error('[approve] demo VISA assign failed:', e.message)
      }
    })()

    // 3) แจ้ง user ทาง LINE (ถ้า link แล้ว)
    if (user.lineUserId) {
      ;(async () => {
        try {
          const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
          if (!token) return
          const flex = {
            type: 'flex',
            altText: '🎉 Ninja Passport อนุมัติแล้ว',
            contents: {
              type: 'bubble',
              header: { type: 'box', layout: 'vertical', backgroundColor: '#16a34a', paddingAll: '16px', contents: [
                { type: 'text', text: '🎉 อนุมัติเรียบร้อย', color: '#FFFFFF', size: 'lg', weight: 'bold' }
              ]},
              body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
                { type: 'text', text: `สวัสดีคุณ ${reg.firstName} ${reg.lastName}`, size: 'md', weight: 'bold' },
                { type: 'text', text: 'บัญชี Ninja Passport ของคุณผ่านการตรวจสอบแล้ว เข้าเรียนได้เลย!', size: 'sm', color: '#475569', wrap: true }
              ]},
              footer: { type: 'box', layout: 'vertical', paddingAll: '12px', contents: [
                { type: 'button', action: { type: 'uri', label: 'เข้าใช้งาน', uri: 'https://passport.medninja.academy/my' }, style: 'primary', color: '#16a34a', height: 'sm' }
              ]}
            }
          }
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ to: user.lineUserId, messages: [flex] })
          }).catch(() => {})
        } catch (e) { console.error('[approve] LINE notify user failed:', e.message) }
      })()
    }

    console.log(`[Passport approve] ${reg.firstName} ${reg.lastName} (${reg.nationalId}) approved by ${adminName}`)
    res.json({ ok: true, message: `อนุมัติ ${reg.firstName} ${reg.lastName} สำเร็จ`, approvedBy: adminName })
  } catch (err) {
    console.error('[approve POST] error:', err)
    res.status(500).json({ message: 'อนุมัติไม่สำเร็จ: ' + err.message })
  }
})

// POST /api/admin/passport/reject/:token — reject (ban user + audit)
router.post('/reject/:token', auth, admin, async (req, res) => {
  try {
    const { reason = '' } = req.body || {}
    const reg = await PreRegistration.findOne({ approveToken: req.params.token })
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล หรือ token ถูกใช้ไปแล้ว' })

    if (reg.status === 'approved') return res.status(400).json({ message: 'อนุมัติไปแล้ว — reject ไม่ได้' })
    if (reg.status === 'rejected') return res.status(400).json({ message: 'ถูก reject ไปแล้ว' })

    const user = await User.findOne({ nationalId: reg.nationalId })
    const adminName = req.user?.name || req.user?.email || 'admin'
    const now = new Date()

    reg.status = 'rejected'
    reg.rejectedBy = adminName
    reg.rejectedAt = now
    reg.rejectReason = reason.slice(0, 500)
    reg.approveToken = undefined
    await reg.save()

    if (user) {
      user.approvalStatus = 'rejected'
      user.rejectedBy = adminName
      user.rejectedAt = now
      user.rejectReason = reason.slice(0, 500)
      user.isBanned = true
      user.bannedAt = now
      user.bannedReason = `Passport rejected: ${reason || 'no reason given'}`
      await user.save()
    }

    console.log(`[Passport reject] ${reg.firstName} ${reg.lastName} (${reg.nationalId}) rejected by ${adminName} — ${reason}`)
    res.json({ ok: true, message: `ปฏิเสธและ ban ${reg.firstName} ${reg.lastName} เรียบร้อย`, rejectedBy: adminName })
  } catch (err) {
    console.error('[reject POST] error:', err)
    res.status(500).json({ message: 'Reject ไม่สำเร็จ: ' + err.message })
  }
})

// POST /api/admin/passport/:id/approve-direct — approve จาก dashboard (ไม่ใช้ token — ใช้ id)
router.post('/:id/approve-direct', auth, admin, async (req, res) => {
  try {
    const reg = await PreRegistration.findById(req.params.id)
    if (!reg) return res.status(404).json({ message: 'ไม่พบข้อมูล' })
    if (reg.status === 'approved') return res.status(400).json({ message: 'อนุมัติไปแล้ว', alreadyApproved: true })

    const user = await User.findOne({ nationalId: reg.nationalId })
    if (!user) return res.status(404).json({ message: 'ไม่พบบัญชี User' })

    const adminName = req.user?.name || req.user?.email || 'admin'
    const now = new Date()

    reg.status = 'approved'
    reg.approvedBy = adminName
    reg.approvedAt = now
    reg.approveToken = undefined
    await reg.save()

    user.approvalStatus = 'approved'
    user.approvedBy = adminName
    user.approvedAt = now
    user.emailVerified = true
    user.verifyToken = undefined
    user.verifyExpires = undefined
    await user.save()

    // Auto demo VISA
    ;(async () => {
      try {
        const demoPkg = await Package.findOne({ isDemo: true }).lean()
        if (!demoPkg) return
        const existingDemo = await Activation.findOne({ userId: user._id, packageId: demoPkg._id }).lean()
        if (existingDemo) return
        const expires = new Date()
        expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
        await Activation.create({
          userId: user._id,
          packageId: demoPkg._id,
          expiresAt: expires,
          isActive: true,
          note: `Auto: VISA ทดลองเรียนฟรี (approved by ${adminName})`
        })
      } catch (e) { console.error('[approve-direct] demo VISA failed:', e.message) }
    })()

    console.log(`[Passport approve-direct] ${reg.firstName} ${reg.lastName} approved by ${adminName}`)
    res.json({ ok: true, message: `อนุมัติ ${reg.firstName} ${reg.lastName} สำเร็จ` })
  } catch (err) {
    res.status(500).json({ message: 'อนุมัติไม่สำเร็จ: ' + err.message })
  }
})

module.exports = router
