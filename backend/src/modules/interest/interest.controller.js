const Interest = require('./Interest.model')
const { notifyAdmins } = require('./line.service')

const ALLOWED_COURSES = ['NL1+2', 'MEQ', 'OSCE']

exports.submit = async (req, res, next) => {
  try {
    const { firstName, lastName, university, phone, email, courses } = req.body

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !university?.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
    }
    if (!phone?.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเบอร์โทร' })
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลให้ถูกต้อง' })
    }
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกคอร์สที่สนใจอย่างน้อย 1 คอร์ส' })
    }
    if (courses.some(c => !ALLOWED_COURSES.includes(c))) {
      return res.status(400).json({ message: 'คอร์สที่เลือกไม่ถูกต้อง' })
    }

    // Save to MongoDB
    const record = await Interest.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      university: university.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      courses,
      ipAddress: req.ip
    })

    // Send LINE notification (fire-and-forget)
    const submittedAt = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      dateStyle: 'medium',
      timeStyle: 'short'
    })
    notifyAdmins({
      firstName: record.firstName,
      lastName: record.lastName,
      university: record.university,
      phone: record.phone,
      email: record.email,
      courses: record.courses,
      submittedAt
    }).catch(err => console.error('[LINE] notifyAdmins error:', err))

    res.status(201).json({
      success: true,
      message: 'ส่งข้อมูลสำเร็จ ทีมงานจะติดต่อกลับโดยเร็ว'
    })
  } catch (err) {
    next(err)
  }
}
