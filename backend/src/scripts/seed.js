/**
 * MedNinja LMS — Seed Script (DEV ONLY)
 * Usage: node backend/src/scripts/seed.js
 *
 * ⚠️ DEV ONLY — ห้ามรันบน production!
 * ⚠️ ลบ User + Course ทั้งหมดแล้วสร้างใหม่
 *
 * Production: User สร้างผ่าน Ninja Passport เท่านั้น
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

if (process.env.NODE_ENV === 'production') {
  console.error('❌ seed.js ห้ามรันบน production! User ต้องสร้างผ่าน Passport เท่านั้น')
  process.exit(1)
}

const User = require('../modules/user/User.model')
const Course = require('../modules/catalog/Course.model')
const { connectDB, passportConn, lmsConn } = require('../shared/config/db')

async function seed() {
  await connectDB()
  console.log('✅ Connected to MongoDB (passport + lms)')
  console.log('⚠️  DEV MODE — กำลังลบข้อมูลเดิมทั้งหมด...')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({})
  ])
  console.log('🗑️  Cleared existing data')

  // ─── Users ───────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin MedNinja',
    email: 'admin@medninja.co.th',
    password: 'admin1234',
    nationalId: '1234567890121',
    role: 'admin',
    emailVerified: true
  })

  // Passport-style student: login ด้วย nationalId, password = วันเกิด (ddmmyyyy พ.ศ.)
  const student = await User.create({
    name: 'สมชาย ใจดี',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'student@medninja.co.th',
    password: '01012540',              // DOB: 01/01/2540
    nationalId: '1234567890123',
    dateOfBirth: '01/01/2540',
    phone: '0812345678',
    university: 'จุฬาลงกรณ์มหาวิทยาลัย',
    role: 'student',
    authProvider: 'local',
    profileLocked: true,
    emailVerified: true,
    profileCompletedAt: new Date()
  })
  console.log('👤 Created users:', admin.nationalId, '(admin) |', student.nationalId, '(student)')

  // ─── Real MedNinja Courses (9 คอร์ส) ─────────────────────
  const nl1 = await Course.create({
    title: 'NL1 Crash Course',
    description: 'ติวเข้มครบทุกสาขา สำหรับสอบ NLE Part 1 ครบ 73 ชั่วโมง ดูวีดีโอย้อนหลังได้ทันที เหมาะสำหรับนักศึกษาแพทย์ปี 4-5 และผู้เตรียมสอบ NL1',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    thumbnail: 'https://medninja.b-cdn.net/PRE-CLINIC.png',
    price: 34900,
    durationHours: 73,
    totalLessons: 18,
    enrollmentCount: 521,
    isPublished: true,
    order: 2,
    learningPoints: [
      'ครบทุกสาขาสำหรับ NL Part 1',
      'Internal Medicine, Pediatrics, OB-GYN, Surgery',
      'ER, Orthopedics, ENT, Ophthalmology, Psychiatry',
      'High-yield topics + Past papers',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  })

  const nl2Full = await Course.create({
    title: 'NL2 FULL',
    description: 'ติวสดครบทั้งหมดสำหรับ NLE Part 2 รวม 60 ชั่วโมง ครอบคลุมทุกสาขา ดูวีดีโอย้อนหลังได้ทุกครั้ง',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    thumbnail: 'https://medninja.b-cdn.net/NL2.png',
    price: 59900,
    durationHours: 60,
    totalLessons: 16,
    enrollmentCount: 298,
    isPublished: true,
    order: 3,
    subCourses: [
      { title: 'NL2 Part A', price: 39900, durationHours: 30, description: 'INT, PED, OBG, SUR (~30 ชม.)' },
      { title: 'NL2 Part B', price: 29900, durationHours: 30, description: 'ER, ORTHO, ENT, Ophth, Psych (~30 ชม.)' }
    ],
    learningPoints: [
      'ครบทุกสาขาสำหรับ NL Part 2',
      'Internal Medicine, Pediatrics, OB-GYN, Surgery',
      'ER, Orthopedics, Forensic, ENT, Ophthalmology, Psychiatry',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี',
      'เทียบเท่า NL2 Part A + Part B'
    ]
  })

  const nl2PartA = await Course.create({
    title: 'NL2 Part A',
    description: 'ติวสดเฉพาะสาขา Internal Medicine, Pediatrics, OB-GYN, Surgery ประมาณ 30 ชั่วโมง ดูวีดีโอย้อนหลังได้',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    price: 39900,
    durationHours: 30,
    totalLessons: 8,
    enrollmentCount: 187,
    isPublished: false,
    order: 90,
    learningPoints: [
      'Internal Medicine ครบทุก subspecialty',
      'Pediatrics — เด็กแรกเกิดถึงวัยรุ่น',
      'OB-GYN — สูติ + นรีเวช',
      'Surgery — General + GI Surgery',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  })

  await Course.create({
    title: 'NL2 Part B',
    description: 'ติวสดเฉพาะสาขา ER, Orthopedics, ENT, Ophthalmology, Psychiatry ประมาณ 30 ชั่วโมง ดูวีดีโอย้อนหลังได้',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    price: 29900,
    durationHours: 30,
    totalLessons: 8,
    enrollmentCount: 142,
    isPublished: false,
    order: 91,
    learningPoints: [
      'Emergency Medicine + Trauma',
      'Orthopedics + Forensic Medicine',
      'ENT — หู คอ จมูก',
      'Ophthalmology — จักษุ',
      'Psychiatry — จิตเวช'
    ]
  })

  await Course.create({
    title: 'NL1+2 Integrated (ระบบใหม่ 2570)',
    description: 'คอร์สบูรณาการ NL1+2 ตามระบบใหม่ 2570 สอนแบบ Integrated ข้ามสาขา ครบ 153 ชั่วโมง ออกแบบเฉพาะสำหรับข้อสอบระบบใหม่',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    thumbnail: 'https://medninja.b-cdn.net/nl1+2.png',
    price: 69900,
    durationHours: 153,
    totalLessons: 36,
    enrollmentCount: 389,
    isPublished: true,
    order: 1,
    system: 'new_2570',
    subCourses: [
      { title: 'NL1+2 Part 1: Major', price: 34900, durationHours: 50, description: 'INT, PED, OBG, SUR รวม NL1+2 (50 ชม.)' },
      { title: 'NL1+2 Part 2: Minor', price: 35000, durationHours: 30, description: 'Surgery, ER, ORTHO, ENT, Ophth รวม NL1+2 (30 ชม.)' }
    ],
    learningPoints: [
      'รวม NL1 Crash Course (73 ชั่วโมง)',
      'รวม NL2 FULL (80 ชั่วโมง)',
      'ครบทุกสาขา NL Part 1 + Part 2',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี',
      'ประหยัดกว่าซื้อแยก ฿24,900'
    ]
  })

  await Course.create({
    title: 'NL1+2 Part 1: Core Systems',
    description: 'ติวสดเฉพาะสาขา Internal Medicine, Pediatrics, OB-GYN, Surgery รวม 50 ชั่วโมง ครอบคลุมทั้ง NL1 + NL2',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    price: 34900,
    durationHours: 50,
    totalLessons: 12,
    enrollmentCount: 156,
    isPublished: false,
    order: 92,
    system: 'new_2570',
    learningPoints: [
      'Internal Medicine รวม NL1+2',
      'Pediatrics รวม NL1+2',
      'OB-GYN รวม NL1+2',
      'Surgery รวม NL1+2',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  })

  await Course.create({
    title: 'NL1+2 Part 2: Action',
    description: 'ติวสดเฉพาะสาขา Surgery, ER, Orthopedics, Forensic, ENT, Ophthalmology รวม 30 ชั่วโมง ครอบคลุมทั้ง NL1 + NL2',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    price: 35000,
    durationHours: 30,
    totalLessons: 8,
    enrollmentCount: 98,
    isPublished: false,
    order: 93,
    system: 'new_2570',
    learningPoints: [
      'Surgery + ER รวม NL1+2',
      'Orthopedics + Forensic',
      'ENT + Ophthalmology รวม NL1+2',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  })

  const meq = await Course.create({
    title: 'MEQ',
    description: 'ติวสดเขียนตอบ MEQ (Modified Essay Question) ครบ Major + Minor Cases 25 ชั่วโมง เจาะประเด็น keyword scoring อัตราผ่านของนักเรียน MedNinja สูงกว่า 90%',
    instructor: 'ทีมอาจารย์แพทย์ MedNinja',
    thumbnail: 'https://medninja.b-cdn.net/MEQ.jpg',
    price: 39900,
    durationHours: 25,
    totalLessons: 8,
    enrollmentCount: 415,
    isPublished: true,
    order: 4,
    learningPoints: [
      'MEQ Major + Minor Cases ครบ',
      'เทคนิค keyword scoring สูงสุด',
      'วีดีโอเฉลยทุก Case',
      'อัตราผ่านนักเรียน MedNinja > 90%',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  })

  await Course.create({
    title: 'OSCE',
    description: 'ติวสดทักษะปฏิบัติ OSCE 15 ชั่วโมง ฝึก Physical Examination, Communication Skills, Clinical Reasoning กับอาจารย์แพทย์เฉพาะทาง',
    instructor: 'ทีมอาจารย์ OSCE MedNinja',
    thumbnail: 'https://medninja.b-cdn.net/OSCE.png',
    price: 27900,
    durationHours: 15,
    totalLessons: 6,
    enrollmentCount: 198,
    isPublished: true,
    order: 5,
    learningPoints: [
      'OSCE Stations ครบทุกประเภท',
      'Physical Examination Technique',
      'Communication Skills กับผู้ป่วย',
      'Clinical Reasoning & Presentation',
      'Mock OSCE + Feedback'
    ]
  })

  console.log('📚 Created 9 courses')

  // ─── Summary ──────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n')
  console.log('📋 Login credentials (ใช้เลขบัตรประชาชน + รหัสผ่าน):')
  console.log('  Admin:   1234567890121 / admin1234')
  console.log('  Student: 1234567890123 / 01012540 (DOB: 01/01/2540)')
  console.log('\n📚 Courses (9):')
  console.log('  NL1+2 Integrated  — ฿69,900 | 153h (order: 1)')
  console.log('  NL1 Crash Course  — ฿34,900 | 73h  (order: 2)')
  console.log('  NL2 FULL          — ฿59,900 | 60h  (order: 3)')
  console.log('  MEQ               — ฿39,900 | 25h  (order: 4)')
  console.log('  OSCE              — ฿27,900 | 15h  (order: 5)')
  console.log('  NL2 Part A/B, NL1+2 Part 1/2 — sub-courses (unpublished)')

  await Promise.all([passportConn.close(), lmsConn.close()])
  console.log('\n🔌 Disconnected from MongoDB')
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
