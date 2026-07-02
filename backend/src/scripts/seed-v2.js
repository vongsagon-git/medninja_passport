/**
 * MedNinja LMS — Seed v2 (Sections + Packages + Activation) — DEV ONLY
 * Usage: node backend/src/scripts/seed-v2.js
 *
 * ⚠️ DEV ONLY — ห้ามรันบน production!
 * ⚠️ ลบ Sections, Packages, Activations แล้วสร้างใหม่
 * ⚠️ ต้องรัน seed.js ก่อน (สร้าง users + courses)
 *
 * Production: Sections/Packages จัดการผ่าน Admin Panel
 *             Activations สร้างผ่านระบบ Passport
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

if (process.env.NODE_ENV === 'production') {
  console.error('❌ seed-v2.js ห้ามรันบน production! ใช้ Admin Panel จัดการแทน')
  process.exit(1)
}

const User = require('../modules/user/User.model')
const Section = require('../modules/content/Section.model')
const Package = require('../modules/content/Package.model')
const Activation = require('../modules/activation/Activation.model')
const { connectDB, passportConn, lmsConn } = require('../shared/config/db')

async function seedV2() {
  await connectDB()
  console.log('✅ Connected to MongoDB (passport + lms)')
  console.log('⚠️  DEV MODE — กำลังลบ v2 data เดิม...')

  // ─── Clear v2 data ──────────────────────────────────────────
  await Promise.all([
    Section.deleteMany({}),
    Package.deleteMany({}),
    Activation.deleteMany({})
  ])
  console.log('🗑️  Cleared v2 data (sections, packages, activations)')

  // ─── Sections (10 สาขา) ─────────────────────────────────────
  const intSection = await Section.create({
    code: 'INT', name: 'Internal Medicine',
    description: 'อายุรศาสตร์ — Cardiology, Pulmonology, GI, Nephrology, Endocrine, Hematology',
    order: 1,
    videos: [
      { title: 'Hematology — Anemia: Definition, Signs & Symptoms', bunnyVideoId: '3e1c54eb-d014-41fd-b424-cd38df70fedd', duration: '45:00', order: 1 },
      { title: 'Cardiology — Heart Failure & Valvular Disease', bunnyVideoId: 'vid_001', duration: '45:00', order: 2 },
      { title: 'Pulmonology — Asthma & COPD', bunnyVideoId: 'vid_002', duration: '38:00', order: 3 },
      { title: 'GI & Hepatobiliary', bunnyVideoId: 'vid_003', duration: '42:00', order: 4 },
      { title: 'Nephrology — AKI & CKD', bunnyVideoId: 'vid_004', duration: '40:00', order: 5 },
      { title: 'Endocrine — DM & Thyroid', bunnyVideoId: 'vid_005', duration: '36:00', order: 6 }
    ]
  })

  const pedSection = await Section.create({
    code: 'PED', name: 'Pediatrics',
    description: 'กุมารเวชศาสตร์ — Neonatology, Growth, Infectious Disease',
    order: 2,
    videos: [
      { title: 'Neonatology — Newborn Assessment', bunnyVideoId: 'vid_010', duration: '40:00', order: 1 },
      { title: 'Growth & Development', bunnyVideoId: 'vid_011', duration: '35:00', order: 2 },
      { title: 'Common Childhood Infections', bunnyVideoId: 'vid_012', duration: '42:00', order: 3 },
      { title: 'Pediatric Emergency', bunnyVideoId: 'vid_013', duration: '38:00', order: 4 }
    ]
  })

  const obgSection = await Section.create({
    code: 'OBG', name: 'OB-GYN',
    description: 'สูติ-นรีเวชวิทยา — Obstetrics, Gynecology, High Risk Pregnancy',
    order: 3,
    videos: [
      { title: 'Normal Pregnancy & ANC', bunnyVideoId: 'vid_020', duration: '45:00', order: 1 },
      { title: 'High Risk Pregnancy', bunnyVideoId: 'vid_021', duration: '40:00', order: 2 },
      { title: 'Labor & Delivery', bunnyVideoId: 'vid_022', duration: '38:00', order: 3 },
      { title: 'Gynecology — Common Problems', bunnyVideoId: 'vid_023', duration: '35:00', order: 4 }
    ]
  })

  const surSection = await Section.create({
    code: 'SUR', name: 'Surgery',
    description: 'ศัลยศาสตร์ — General Surgery, GI Surgery, Trauma',
    order: 4,
    videos: [
      { title: 'Acute Abdomen', bunnyVideoId: 'vid_030', duration: '42:00', order: 1 },
      { title: 'GI Surgery — Appendicitis & Cholecystitis', bunnyVideoId: 'vid_031', duration: '38:00', order: 2 },
      { title: 'Trauma — Primary & Secondary Survey', bunnyVideoId: 'vid_032', duration: '45:00', order: 3 }
    ]
  })

  const erSection = await Section.create({
    code: 'ER', name: 'Emergency Medicine',
    description: 'เวชศาสตร์ฉุกเฉิน — CPR, Shock, Poisoning',
    order: 5,
    videos: [
      { title: 'CPR & ACLS', bunnyVideoId: 'vid_040', duration: '40:00', order: 1 },
      { title: 'Shock Management', bunnyVideoId: 'vid_041', duration: '35:00', order: 2 },
      { title: 'Poisoning & Toxicology', bunnyVideoId: 'vid_042', duration: '38:00', order: 3 }
    ]
  })

  const orthoSection = await Section.create({
    code: 'ORTHO', name: 'Orthopedics',
    description: 'ออร์โธปิดิกส์ — Fracture, Joint Disease',
    order: 6,
    videos: [
      { title: 'Common Fractures', bunnyVideoId: 'vid_050', duration: '38:00', order: 1 },
      { title: 'Joint Disease — OA & RA', bunnyVideoId: 'vid_051', duration: '35:00', order: 2 }
    ]
  })

  const entSection = await Section.create({
    code: 'ENT', name: 'ENT + Ophthalmology',
    description: 'หู คอ จมูก + จักษุวิทยา',
    order: 7,
    videos: [
      { title: 'ENT — Common Problems', bunnyVideoId: 'vid_060', duration: '35:00', order: 1 },
      { title: 'Ophthalmology — Red Eye & Visual Loss', bunnyVideoId: 'vid_061', duration: '32:00', order: 2 }
    ]
  })

  const quizSection = await Section.create({
    code: 'QUIZ', name: 'ตะลุยโจทย์',
    description: 'ฝึกทำโจทย์ข้อสอบจริง + เฉลยละเอียด',
    order: 8,
    videos: [
      { title: 'โจทย์ชุดที่ 1 — Mixed Topics', bunnyVideoId: 'vid_070', duration: '60:00', order: 1 },
      { title: 'โจทย์ชุดที่ 2 — INT + PED', bunnyVideoId: 'vid_071', duration: '55:00', order: 2 },
      { title: 'โจทย์ชุดที่ 3 — SUR + OBG', bunnyVideoId: 'vid_072', duration: '50:00', order: 3 }
    ]
  })

  const meqSection = await Section.create({
    code: 'MEQ', name: 'MEQ Cases',
    description: 'Modified Essay Question — ฝึกเขียนตอบ Major + Minor Cases',
    order: 9,
    videos: [
      { title: 'MEQ — Internal Medicine Cases', bunnyVideoId: 'vid_080', duration: '45:00', order: 1 },
      { title: 'MEQ — Pediatrics Cases', bunnyVideoId: 'vid_081', duration: '40:00', order: 2 },
      { title: 'MEQ — OB-GYN & Surgery Cases', bunnyVideoId: 'vid_082', duration: '42:00', order: 3 },
      { title: 'MEQ — Minor Subject Cases', bunnyVideoId: 'vid_083', duration: '38:00', order: 4 }
    ]
  })

  const osceSection = await Section.create({
    code: 'OSCE', name: 'OSCE Stations',
    description: 'ฝึก OSCE — History Taking, PE, Communication',
    order: 10,
    videos: [
      { title: 'History Taking Techniques', bunnyVideoId: 'vid_090', duration: '35:00', order: 1 },
      { title: 'Physical Examination — Cardio & Pulmo', bunnyVideoId: 'vid_091', duration: '40:00', order: 2 },
      { title: 'Communication Skills', bunnyVideoId: 'vid_092', duration: '30:00', order: 3 }
    ]
  })

  console.log('📂 Created 10 sections')

  // ─── Packages (7 published) ─────────────────────────────────
  const majorSections = [intSection._id, pedSection._id, obgSection._id, surSection._id]
  const minorSections = [erSection._id, orthoSection._id, entSection._id]
  const allMainSections = [...majorSections, ...minorSections, quizSection._id]

  const pkgFull = await Package.create({
    title: 'NL1+2 Integrated Full',
    description: 'คอร์สบูรณาการ NL1+2 ครบทุก Section + ตะลุยโจทย์',
    price: 69900,
    thumbnail: 'https://medninja.b-cdn.net/nl1+2.png',
    sections: allMainSections,
    durationDays: 365,
    isPublished: true,
    order: 1
  })

  await Package.create({
    title: 'NL1+2 Part 1: Major',
    description: 'INT, PED, OBG, SUR',
    price: 34900,
    thumbnail: 'https://medninja.b-cdn.net/nl1+2.png',
    sections: majorSections,
    durationDays: 365,
    isPublished: true,
    order: 2
  })

  await Package.create({
    title: 'NL1+2 Part 2: Minor',
    description: 'ER, Orthopedics, ENT + Ophthalmology',
    price: 35000,
    thumbnail: 'https://medninja.b-cdn.net/nl1+2.png',
    sections: minorSections,
    durationDays: 365,
    isPublished: true,
    order: 3
  })

  await Package.create({
    title: 'NL1 Crash Course',
    description: 'ติวเข้มครบทุกสาขา NLE Part 1',
    price: 34900,
    thumbnail: 'https://medninja.b-cdn.net/PRE-CLINIC.png',
    sections: [...majorSections, ...minorSections],
    durationDays: 365,
    isPublished: true,
    order: 4
  })

  await Package.create({
    title: 'NL2 Full Live',
    description: 'ติวสดครบทุกสาขา NLE Part 2',
    price: 59900,
    thumbnail: 'https://medninja.b-cdn.net/NL2.png',
    sections: [...majorSections, ...minorSections],
    durationDays: 365,
    isPublished: true,
    order: 5
  })

  await Package.create({
    title: 'MEQ by MedNinja',
    description: 'ติวเขียนตอบ MEQ ครบ Major + Minor Cases',
    price: 39900,
    thumbnail: 'https://medninja.b-cdn.net/MEQ.jpg',
    sections: [meqSection._id],
    durationDays: 365,
    isPublished: true,
    order: 6
  })

  await Package.create({
    title: 'OSCE Mastery',
    description: 'ฝึก OSCE ทุก Station',
    price: 27900,
    thumbnail: 'https://medninja.b-cdn.net/OSCE.png',
    sections: [osceSection._id],
    durationDays: 365,
    isPublished: true,
    order: 7
  })

  console.log('📦 Created 7 packages')

  // ─── Activation: student → NL1+2 Full ──────────────────────
  const student = await User.findOne({ nationalId: '1234567890123' })
  const admin = await User.findOne({ role: 'admin' })

  if (student && admin) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    await Activation.create({
      userId: student._id,
      packageId: pkgFull._id,
      activatedAt: now,
      expiresAt,
      isActive: true,
      activatedBy: admin._id,
      note: 'Test activation — NL1+2 Full (seed-v2)'
    })
    console.log(`🔑 Activated ${student.nationalId} → NL1+2 Full (expires: ${expiresAt.toISOString().slice(0, 10)})`)
  } else {
    console.log('⚠️  Student/Admin not found — ต้องรัน seed.js ก่อน!')
  }

  // ─── Summary ────────────────────────────────────────────────
  console.log('\n✅ Seed v2 complete!')
  console.log('📂 Sections (10): INT, PED, OBG, SUR, ER, ORTHO, ENT, QUIZ, MEQ, OSCE')
  console.log('📦 Packages (7): NL1+2 Full/Part1/Part2, NL1, NL2, MEQ, OSCE')
  console.log('🔑 Activation: 1234567890123 (สมชาย ใจดี) → NL1+2 Full (1 year)')
  console.log('\n💡 INT section มี Hematology video จริง (Bunny ID: 3e1c54eb-d014-41fd-b424-cd38df70fedd)')

  await Promise.all([passportConn.close(), lmsConn.close()])
  console.log('🔌 Disconnected from MongoDB')
}

seedV2().catch(err => {
  console.error('\n❌ Seed v2 failed:', err.message)
  process.exit(1)
})
