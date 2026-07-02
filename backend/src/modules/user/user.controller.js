const User = require('./User.model')

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -verifyToken -verifyExpires -nationalId')
    res.json({ user })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/users/profile — แก้ไขข้อมูลพื้นฐาน (ถ้ายังไม่ lock)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id)

    // ถ้า profile locked → ห้ามแก้ (ยกเว้น phone ที่ไม่ได้ lock)
    if (currentUser.profileLocked) {
      return res.status(403).json({
        message: 'ข้อมูลโปรไฟล์ถูกล็อคแล้ว กรุณาติดต่อ Admin หากต้องการแก้ไข'
      })
    }

    const { name, phone } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password -verifyToken -verifyExpires -nationalId')

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/users/complete-profile — กรอกข้อมูลบังคับครั้งเดียว แล้วล็อค
 * Required fields: firstName, lastName, university, nationalId, phone
 */
exports.completeProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.profileLocked) {
      return res.status(400).json({ message: 'ข้อมูลโปรไฟล์ถูกล็อคแล้ว' })
    }

    const { firstName, lastName, university, nationalId, phone } = req.body

    // Validate required fields
    if (!firstName || !lastName || !university || !nationalId || !phone) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' })
    }

    // Validate national ID (13 digits)
    const cleanId = nationalId.replace(/\D/g, '')
    if (cleanId.length !== 13) {
      return res.status(400).json({ message: 'เลขบัตรประชาชนต้องมี 13 หลัก' })
    }

    // Validate phone
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 9 || cleanPhone.length > 10) {
      return res.status(400).json({ message: 'เบอร์โทรไม่ถูกต้อง' })
    }

    user.firstName = firstName.trim()
    user.lastName = lastName.trim()
    user.university = university.trim()
    user.nationalId = cleanId
    user.phone = cleanPhone
    user.name = `${firstName.trim()} ${lastName.trim()}`
    user.profileLocked = true
    user.profileCompletedAt = new Date()

    await user.save()

    // ส่งกลับโดยไม่รวม sensitive fields
    const result = await User.findById(user._id)
      .select('-password -verifyToken -verifyExpires -nationalId')
      .lean()

    res.json({ user: result })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/users — Admin: ดูรายชื่อ users ทั้งหมด
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password -verifyToken -verifyExpires')
      .sort('-createdAt')
      .lean()
    res.json({ users })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/users/:id — Admin: แก้ไขข้อมูลนักเรียน (ข้าม lock)
 */
exports.adminUpdateUser = async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'university', 'nationalId', 'phone', 'name', 'email', 'role']
    const updates = {}

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    // ถ้าแก้ชื่อ-นามสกุล → อัพเดท name ด้วย
    if (updates.firstName || updates.lastName) {
      const user = await User.findById(req.params.id)
      if (user) {
        const fn = updates.firstName || user.firstName || ''
        const ln = updates.lastName || user.lastName || ''
        if (fn && ln) updates.name = `${fn} ${ln}`
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password -verifyToken -verifyExpires')

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}
