// ─── Mock Data for MedNinja LMS ──────────────────────────────────────────────
// ใช้เมื่อ VITE_USE_MOCK=true — ไม่ต้องมี backend หรือ MongoDB

// ─── Section-based system (v2) ───────────────────────────────────────────────

// ─── Demo section (public — no login required) ──────────────────────────────
// Bunny Library: 626874 | CDN: vz-308ca9b7-bbf.b-cdn.net
export const MOCK_DEMO_SECTION = {
  _id: 'sec_demo',
  code: 'DEMO',
  name: 'Demo Class — ทดลองเรียนฟรี',
  description: 'ตัวอย่างบทเรียนจริงจาก MedNinja — ดูฟรี ไม่ต้องสมัคร',
  order: 0,
  videos: [
    {
      title: 'Demo — ตัวอย่างการสอน MedNinja',
      bunnyVideoId: '2e7f385d-4caa-40d9-bc11-e807aa0b6d57',
      duration: '15:00',
      order: 1,
      embedUrl: 'https://player.mediadelivery.net/embed/626874/2e7f385d-4caa-40d9-bc11-e807aa0b6d57?autoplay=false&preload=true&playsinline=true&showSpeed=true'
    }
  ]
}

export const MOCK_SECTIONS = [
  {
    _id: 'sec_int', code: 'INT', name: 'Internal Medicine',
    description: 'อายุรศาสตร์ — Cardiology, Pulmonology, GI, Nephrology, Endocrine',
    order: 1,
    videos: [
      { title: 'Hematology — Anemia: Definition, Signs & Symptoms', bunnyVideoId: '3e1c54eb-d014-41fd-b424-cd38df70fedd', duration: '45:00', order: 1, embedUrl: 'https://player.mediadelivery.net/embed/626874/3e1c54eb-d014-41fd-b424-cd38df70fedd?autoplay=false&preload=true&playsinline=true&showSpeed=true' },
      { title: 'Cardiology — Heart Failure & Valvular Disease', bunnyVideoId: 'vid_001', duration: '45:00', order: 2 },
      { title: 'Pulmonology — Asthma & COPD', bunnyVideoId: 'vid_002', duration: '38:00', order: 3 },
      { title: 'GI & Hepatobiliary', bunnyVideoId: 'vid_003', duration: '42:00', order: 4 },
      { title: 'Nephrology — AKI & CKD', bunnyVideoId: 'vid_004', duration: '40:00', order: 5 },
      { title: 'Endocrine — DM & Thyroid', bunnyVideoId: 'vid_005', duration: '36:00', order: 6 }
    ]
  },
  {
    _id: 'sec_ped', code: 'PED', name: 'Pediatrics',
    description: 'กุมารเวชศาสตร์ — Neonatology, Growth, Infectious Disease',
    order: 2,
    videos: [
      { title: 'Neonatology — Newborn Assessment', bunnyVideoId: 'vid_010', duration: '40:00', order: 1 },
      { title: 'Growth & Development', bunnyVideoId: 'vid_011', duration: '35:00', order: 2 },
      { title: 'Common Childhood Infections', bunnyVideoId: 'vid_012', duration: '42:00', order: 3 },
      { title: 'Pediatric Emergency', bunnyVideoId: 'vid_013', duration: '38:00', order: 4 }
    ]
  },
  {
    _id: 'sec_obg', code: 'OBG', name: 'OB-GYN',
    description: 'สูติ-นรีเวชวิทยา — Obstetrics, Gynecology, High Risk Pregnancy',
    order: 3,
    videos: [
      { title: 'Normal Pregnancy & ANC', bunnyVideoId: 'vid_020', duration: '45:00', order: 1 },
      { title: 'High Risk Pregnancy', bunnyVideoId: 'vid_021', duration: '40:00', order: 2 },
      { title: 'Labor & Delivery', bunnyVideoId: 'vid_022', duration: '38:00', order: 3 },
      { title: 'Gynecology — Common Problems', bunnyVideoId: 'vid_023', duration: '35:00', order: 4 }
    ]
  },
  {
    _id: 'sec_sur', code: 'SUR', name: 'Surgery',
    description: 'ศัลยศาสตร์ — General Surgery, GI Surgery, Trauma',
    order: 4,
    videos: [
      { title: 'Acute Abdomen', bunnyVideoId: 'vid_030', duration: '42:00', order: 1 },
      { title: 'GI Surgery — Appendicitis & Cholecystitis', bunnyVideoId: 'vid_031', duration: '38:00', order: 2 },
      { title: 'Trauma — Primary & Secondary Survey', bunnyVideoId: 'vid_032', duration: '45:00', order: 3 }
    ]
  },
  {
    _id: 'sec_er', code: 'ER', name: 'Emergency Medicine',
    description: 'เวชศาสตร์ฉุกเฉิน — CPR, Shock, Poisoning',
    order: 5,
    videos: [
      { title: 'CPR & ACLS', bunnyVideoId: 'vid_040', duration: '40:00', order: 1 },
      { title: 'Shock Management', bunnyVideoId: 'vid_041', duration: '35:00', order: 2 },
      { title: 'Poisoning & Toxicology', bunnyVideoId: 'vid_042', duration: '38:00', order: 3 }
    ]
  },
  {
    _id: 'sec_ortho', code: 'ORTHO', name: 'Orthopedics',
    description: 'ออร์โธปิดิกส์ — Fracture, Joint Disease',
    order: 6,
    videos: [
      { title: 'Common Fractures', bunnyVideoId: 'vid_050', duration: '38:00', order: 1 },
      { title: 'Joint Disease — OA & RA', bunnyVideoId: 'vid_051', duration: '35:00', order: 2 }
    ]
  },
  {
    _id: 'sec_ent', code: 'ENT', name: 'ENT + Ophthalmology',
    description: 'หู คอ จมูก + จักษุวิทยา',
    order: 7,
    videos: [
      { title: 'ENT — Common Problems', bunnyVideoId: 'vid_060', duration: '35:00', order: 1 },
      { title: 'Ophthalmology — Red Eye & Visual Loss', bunnyVideoId: 'vid_061', duration: '32:00', order: 2 }
    ]
  },
  {
    _id: 'sec_quiz', code: 'QUIZ', name: 'ตะลุยโจทย์',
    description: 'ฝึกทำโจทย์ข้อสอบจริง + เฉลยละเอียด',
    order: 8,
    videos: [
      { title: 'โจทย์ชุดที่ 1 — Mixed Topics', bunnyVideoId: 'vid_070', duration: '60:00', order: 1 },
      { title: 'โจทย์ชุดที่ 2 — Internal + Pediatrics', bunnyVideoId: 'vid_071', duration: '55:00', order: 2 },
      { title: 'โจทย์ชุดที่ 3 — Surgery + OB-GYN', bunnyVideoId: 'vid_072', duration: '50:00', order: 3 }
    ]
  },
  {
    _id: 'sec_meq', code: 'MEQ', name: 'MEQ Cases',
    description: 'Modified Essay Question — ฝึกเขียนตอบ Major + Minor Cases',
    order: 9,
    videos: [
      { title: 'MEQ — Internal Medicine Cases', bunnyVideoId: 'vid_080', duration: '45:00', order: 1 },
      { title: 'MEQ — Pediatrics Cases', bunnyVideoId: 'vid_081', duration: '40:00', order: 2 },
      { title: 'MEQ — OB-GYN & Surgery Cases', bunnyVideoId: 'vid_082', duration: '42:00', order: 3 },
      { title: 'MEQ — Minor Subject Cases', bunnyVideoId: 'vid_083', duration: '38:00', order: 4 }
    ]
  },
  {
    _id: 'sec_osce', code: 'OSCE', name: 'OSCE Stations',
    description: 'ฝึก OSCE — History Taking, PE, Communication',
    order: 10,
    videos: [
      { title: 'History Taking Techniques', bunnyVideoId: 'vid_090', duration: '35:00', order: 1 },
      { title: 'Physical Examination — Cardio & Pulmo', bunnyVideoId: 'vid_091', duration: '40:00', order: 2 },
      { title: 'Communication Skills', bunnyVideoId: 'vid_092', duration: '30:00', order: 3 }
    ]
  }
]

export const MOCK_PACKAGES = [
  {
    _id: 'pkg_nl12_full',
    title: 'NL1+2 Integrated Full',
    description: 'คอร์สบูรณาการ NL1+2 ครบทุก Section + ตะลุยโจทย์',
    price: 69900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774575279254-00-FULL_NINJA_PASS.png',
    sections: ['sec_int', 'sec_ped', 'sec_obg', 'sec_sur', 'sec_er', 'sec_ortho', 'sec_ent', 'sec_quiz'],
    durationDays: 180, isPublished: true, order: 1
  },
  {
    _id: 'pkg_nl12_major',
    title: 'NL1+2 Part 1: Major',
    description: 'Internal Medicine, Pediatrics, OB-GYN, Surgery',
    price: 34900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774575279254-00-FULL_NINJA_PASS.png',
    sections: ['sec_int', 'sec_ped', 'sec_obg', 'sec_sur'],
    durationDays: 180, isPublished: true, order: 2
  },
  {
    _id: 'pkg_nl12_minor',
    title: 'NL1+2 Part 2: Minor',
    description: 'ER, Orthopedics, ENT + Ophthalmology',
    price: 35000,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774575279254-00-FULL_NINJA_PASS.png',
    sections: ['sec_er', 'sec_ortho', 'sec_ent'],
    durationDays: 180, isPublished: true, order: 3
  },
  {
    _id: 'pkg_nl1',
    title: 'NL1 Crash Course',
    description: 'ติวเข้มครบทุกสาขา สำหรับสอบ NLE Part 1',
    price: 34900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1771947314970-00-Gemini_Generated_Image_fesp6bfesp6bfesp.jpg',
    sections: ['sec_int', 'sec_ped', 'sec_obg', 'sec_sur', 'sec_er', 'sec_ortho', 'sec_ent'],
    durationDays: 180, isPublished: true, order: 4
  },
  {
    _id: 'pkg_nl2_full',
    title: 'NL2 Full Live',
    description: 'ติวสดครบทั้งหมดสำหรับ NLE Part 2',
    price: 59900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774577362904-00-NL2_FULL.png',
    sections: ['sec_int', 'sec_ped', 'sec_obg', 'sec_sur', 'sec_er', 'sec_ortho', 'sec_ent'],
    durationDays: 180, isPublished: true, order: 5
  },
  {
    _id: 'pkg_meq',
    title: 'MEQ by MedNinja',
    description: 'ติวเขียนตอบ MEQ ครบ Major + Minor Cases',
    price: 39900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1769215734963-00-Gemini_Generated_Image_vm73qcvm73qcvm73.jpg',
    sections: ['sec_meq'],
    durationDays: 180, isPublished: true, order: 6
  },
  {
    _id: 'pkg_osce',
    title: 'OSCE Mastery',
    description: 'ฝึก OSCE ทุก Station',
    price: 27900,
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774587117535-00-OSCE_Mastery.png',
    sections: ['sec_osce'],
    durationDays: 180, isPublished: true, order: 7
  }
]

// Mock: student has NL1+2 Full activated 38 days ago
const _now = new Date()
const _activated = new Date(_now.getTime() - 38 * 24 * 3600 * 1000)
const _expires = new Date(_activated.getTime() + 180 * 24 * 3600 * 1000)

export const MOCK_ACTIVATIONS = [
  {
    _id: 'act_001',
    userId: 'user_student_001',
    packageId: 'pkg_nl12_full',
    activatedAt: _activated.toISOString(),
    expiresAt: _expires.toISOString(),
    extendedDays: 0,
    isActive: true,
    activatedBy: 'user_admin_001',
    note: ''
  }
]

// Key = nationalId (ใช้เลขบัตรประชาชน login แบบ Passport)
export const MOCK_USERS = {
  '1234567890123': {
    _id: 'user_student_001',
    name: 'สมชาย ใจดี',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'student@medninja.co.th',
    nationalId: '1234567890123',
    dateOfBirth: '01/01/2540',
    phone: '0812345678',
    university: 'จุฬาลงกรณ์มหาวิทยาลัย',
    role: 'student',
    profileLocked: true,
    emailVerified: true,
    authProvider: 'local',
    createdAt: '2025-01-15T00:00:00.000Z'
  },
  '1234567890121': {
    _id: 'user_admin_001',
    name: 'Admin MedNinja',
    email: 'admin@medninja.co.th',
    nationalId: '1234567890121',
    role: 'admin',
    emailVerified: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
}

export const MOCK_COURSES = [
  {
    _id: 'nl1',
    title: 'NL1 Crash Course',
    description: 'ติวเข้มครบทุกสาขา สำหรับสอบ NLE Part 1 ครบ 73 ชั่วโมง ดูวีดีโอย้อนหลังได้ทันที เหมาะสำหรับนักศึกษาแพทย์ปี 4-5 และผู้เตรียมสอบ NL1',
    price: 34900,
    durationHours: 73,
    order: 2,
    instructor: 'Vasita Wongsirikul',
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1771947314970-00-Gemini_Generated_Image_fesp6bfesp6bfesp.jpg',
    totalLessons: 18,
    enrollmentCount: 521,
    isPublished: true,
    learningPoints: [
      'ครบทุกสาขาสำหรับ NL Part 1',
      'Internal Medicine, Pediatrics, OB-GYN, Surgery',
      'ER, Orthopedics, ENT, Ophthalmology, Psychiatry',
      'High-yield topics + Past papers',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  },
  {
    _id: 'nl2_full',
    title: 'NL2 Full Live (2026)',
    description: 'ติวสดครบทั้งหมดสำหรับ NLE Part 2 รวม 60 ชั่วโมง ครอบคลุมทุกสาขา ดูวีดีโอย้อนหลังได้ทุกครั้ง',
    price: 59900,
    durationHours: 60,
    order: 3,
    instructor: 'Vasita Wongsirikul',
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774577362904-00-NL2_FULL.png',
    totalLessons: 16,
    enrollmentCount: 298,
    isPublished: true,
    learningPoints: [
      'ครบทุกสาขาสำหรับ NL Part 2',
      'Internal Medicine, Pediatrics, OB-GYN, Surgery',
      'ER, Orthopedics, Forensic, ENT, Ophthalmology, Psychiatry',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี',
      'เทียบเท่า NL2 Part A + Part B'
    ],
    subCourses: [
      { _id: 'nl2_parta', title: 'NL2 Part A', price: 39900, durationHours: 30,
        description: 'Internal Medicine, Pediatrics, OB-GYN, Surgery (~30 ชม.)' },
      { _id: 'nl2_partb', title: 'NL2 Part B', price: 29900, durationHours: 30,
        description: 'ER, Orthopedics, ENT, Ophthalmology, Psychiatry (~30 ชม.)' }
    ]
  },
  {
    _id: 'ninja_pass',
    title: 'NL1+2 Integrated (ระบบใหม่ 2570)',
    description: 'คอร์สบูรณาการ NL1+2 ตามระบบใหม่ 2570 สอนแบบ Integrated ข้ามสาขา ครบ 153 ชั่วโมง ออกแบบเฉพาะสำหรับข้อสอบระบบใหม่',
    price: 69900,
    durationHours: 153,
    order: 1,
    instructor: 'Vasita Wongsirikul',
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774575279254-00-FULL_NINJA_PASS.png',
    totalLessons: 36,
    enrollmentCount: 389,
    isPublished: true,
    learningPoints: [
      'Integrated ตามระบบ NLE ใหม่ 2570',
      'สอนแบบบูรณาการข้ามสาขา ไม่ใช่แยก NL1/NL2',
      'ครอบคลุมทุก System ที่ออกสอบ',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี',
      'เหมาะสำหรับผู้เตรียมสอบระบบใหม่โดยเฉพาะ'
    ],
    subCourses: [
      { _id: 'nl12_part1', title: 'NL1+2 Part 1: Major', price: 34900, durationHours: 50,
        description: 'Internal Medicine, Pediatrics, OB-GYN, Surgery รวม NL1+2 (50 ชม.)' },
      { _id: 'nl12_part2', title: 'NL1+2 Part 2: Minor', price: 35000, durationHours: 30,
        description: 'Surgery, ER, Orthopedics, Forensic, ENT, Ophthalmology รวม NL1+2 (30 ชม.)' }
    ]
  },
  {
    _id: 'meq',
    title: 'MEQ by MedNinja',
    description: 'ติวสดเขียนตอบ MEQ (Modified Essay Question) ครบ Major + Minor Cases 25 ชั่วโมง เจาะประเด็น keyword scoring อัตราผ่านของนักเรียน MedNinja สูงกว่า 90%',
    price: 39900,
    durationHours: 25,
    order: 4,
    instructor: 'Vasita Wongsirikul',
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1769215734963-00-Gemini_Generated_Image_vm73qcvm73qcvm73.jpg',
    totalLessons: 8,
    enrollmentCount: 415,
    isPublished: true,
    learningPoints: [
      'MEQ Major + Minor Cases ครบ',
      'เทคนิค keyword scoring สูงสุด',
      'วีดีโอเฉลยทุก Case',
      'อัตราผ่านนักเรียน MedNinja > 90%',
      'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี'
    ]
  },
  {
    _id: 'osce',
    title: 'OSCE Mastery',
    description: 'ติวสดทักษะปฏิบัติ OSCE 15 ชั่วโมง ฝึก Physical Examination, Communication Skills, Clinical Reasoning กับอาจารย์แพทย์เฉพาะทาง',
    price: 27900,
    durationHours: 15,
    order: 5,
    instructor: 'Vasita Wongsirikul',
    thumbnail: 'https://www.medninja.co.th:8443/uploads/1774587117535-00-OSCE_Mastery.png',
    totalLessons: 6,
    enrollmentCount: 198,
    isPublished: true,
    learningPoints: [
      'OSCE Stations ครบทุกประเภท',
      'Physical Examination Technique',
      'Communication Skills กับผู้ป่วย',
      'Clinical Reasoning & Presentation',
      'Mock OSCE + Feedback'
    ]
  }
]

// ─── Mock token storage (in-memory + localStorage) ───────────────────────────

const TOKEN_KEY = '__medninja_mock_tokens__'

export function saveToken(token, email) {
  const tokens = getTokens()
  tokens[token] = email
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}')
  } catch {}
  return {}
}

export function getEmailFromToken(token) {
  return getTokens()[token] || null
}
