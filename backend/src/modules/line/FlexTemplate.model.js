/**
 * FlexTemplate — เก็บข้อมูล Flex ที่แก้ไขได้จาก admin UI
 * แต่ละ template มี key unique + fields เป็น JSON object
 */
const { lmsConn } = require('../../shared/config/db')

const flexTemplateSchema = new lmsConn.base.Schema({
  key:         { type: String, required: true, unique: true },  // เช่น 'trial', 'howto', 'nl2'
  label:       { type: String, default: '' },                   // ชื่อแสดง เช่น "ทดลองเรียนฟรี"
  category:    { type: String, enum: ['sales', 'course', 'payment', 'info', 'custom'], default: 'info' },
  fields:      { type: Object, default: {} },                   // ข้อมูลที่แก้ได้ เช่น { title, price, url... }
  enabled:     { type: Boolean, default: true },
  updatedBy:   { type: String, default: '' },
  // Custom Flex (paste JSON)
  flexJson:    { type: Object, default: null },                 // raw Flex JSON สำหรับ custom
  altText:     { type: String, default: '' },                   // alt text สำหรับ LINE notification
  // AI Tool integration
  aiToolEnabled:     { type: Boolean, default: false },         // AI เรียกใช้ได้?
  aiToolInstruction: { type: String, default: '' }              // คำอธิบายให้ AI รู้ว่าใช้เมื่อไหร่
}, { timestamps: true })

const FlexTemplate = lmsConn.model('FlexTemplate', flexTemplateSchema)

// ═══ Default Templates — seed ครั้งแรก ═══
const DEFAULT_TEMPLATES = [
  {
    key: 'trial', label: 'ทดลองเรียนฟรี', category: 'sales',
    fields: {
      title: 'ทดลองเรียนฟรี',
      subtitle: 'เลือกได้ 2 ช่องทาง ไม่มีค่าใช้จ่าย',
      option1_title: 'ดูคลิปตัวอย่างฟรี',
      option1_desc: 'ไม่ต้องสมัครสมาชิก กดดูได้ทันที',
      option2_title: 'สมัคร Ninja Passport',
      option2_desc: 'ทดลองเรียนคอร์สจริงฟรี 7 วัน',
      btn1_label: 'ดูคลิปตัวอย่างฟรี',
      btn1_url: 'https://medninja.academy/demo/watch/0',
      btn2_label: 'สมัคร Ninja Passport (ฟรี 7 วัน)',
      btn2_url: 'https://liff.line.me/2009259048-OK5LlGhE',
      footer: 'สมัครง่าย ใช้แค่บัตรประชาชน ไม่มีค่าใช้จ่าย'
    }
  },
  {
    key: 'register', label: 'สมัครเรียน', category: 'sales',
    fields: {
      title: 'สมัครเรียน',
      subtitle: 'พร้อมเริ่มเรียนแล้ว',
      description: 'สมัคร Ninja Passport เพื่อเข้าสู่ระบบเรียน\nทีมงานจะเปิดคอร์สให้ทันทีหลังชำระเงิน',
      step1_title: 'สมัคร Ninja Passport',
      step1_desc: 'กดปุ่มด้านล่าง กรอกข้อมูลบัตรประชาชน',
      step2_title: 'ชำระค่าคอร์ส',
      step2_desc: 'แจ้งชำระเงินทาง LINE นี้',
      step3_title: 'เข้าเรียนได้ทันที',
      step3_desc: 'ทีมงานเปิดระบบให้ เข้าเว็บเรียนได้เลย',
      btn1_label: 'สมัคร Ninja Passport',
      btn1_url: 'https://liff.line.me/2009259048-OK5LlGhE',
      footer: 'สมัครง่าย ใช้แค่บัตรประชาชน ไม่มีค่าสมัคร Passport'
    }
  },
  {
    key: 'howto', label: 'วิธีเข้าเรียน', category: 'info',
    fields: {
      title: 'วิธีเข้าเรียน',
      step1_title: 'เข้าเว็บไซต์ medninja.academy',
      step1_desc: 'ผ่าน browser มือถือหรือคอมพิวเตอร์',
      step2_title: 'Login เข้าสู่ระบบ',
      step2_desc: 'Login ID = เลขบัตรประชาชน 13 หลัก\nรหัสผ่าน = วันเดือนปีเกิด พ.ศ. (ddmmyyyy)\nเช่น เกิด 5 ม.ค. 2543 → 05012543',
      step3_title: 'เข้าหน้าเรียน',
      step3_desc: 'คอร์สของคุณจะอยู่ในส่วน VISA\nกดเข้าไปเลือกบทเรียน แล้วดูวีดีโอได้เลยค่ะ',
      tips: '• ส่งคำถามถึงผู้สอนได้ที่ใต้วีดีโอ\n• ดูได้ทีละ 1 จอเท่านั้น\n• ใช้ Chrome หรือ Safari จะดีที่สุด',
      troubleshoot: 'กดปุ่มสีแดง "ดูไม่ได้?" มุมบนขวาของหน้าวีดีโอ ระบบจะตรวจสอบให้อัตโนมัติ'
    }
  },
  {
    key: 'payment', label: 'เลขบัญชีชำระเงิน', category: 'payment',
    fields: {
      title: 'ชำระค่าเรียนผ่านบัญชี',
      bank_name: 'กสิกรไทย (KBANK)',
      account_number: '228-1-44959-4',
      account_name: 'บจก. เมดนินจา',
      note: 'โอนแล้วแจ้งสลิปทาง LINE นี้ได้เลยค่ะ'
    }
  },
  {
    key: 'nlmastery', label: 'NL MASTERY (NL1+2)', category: 'course',
    fields: {
      title: 'NL MASTERY',
      subtitle: '1+2 ศรว.ระบบใหม่',
      total_hours: '153 ชั่วโมง ++',
      description: 'เพื่อสอบใบประกอบวิชาชีพแพทย์ ศรว.',
      highlight1: 'เรียนครบทั้ง 80 ชม. (Major + Minor)',
      highlight2: 'ดูย้อนหลังได้นาน 6 เดือนเต็ม',
      highlight3: 'ต่ออายุฟรีทุก 6 เดือนจนกว่าจะสอบผ่าน',
      preclinic_hours: '73 ชั่วโมง',
      live_schedule: 'จ-พ-ศ 18.00-20.00 น. เริ่ม พ.ค. 69',
      original_price: '69,900 บาท',
      promo_price: '64,900 บาท',
      discount_label: 'ลด 5,000'
    }
  },
  {
    key: 'nl2', label: 'NL2 by MedNinja', category: 'course',
    fields: {
      title: 'NL2',
      subtitle: 'by MedNinja',
      badge: 'ศรว. ระบบใหม่',
      subjects: 'Internal Medicine, OBGYN, Pediatrics, Surgery, ER/Ortho/Trauma, Forensic/ENT/Eye',
      rewatch: 'ดูย้อนหลังได้จนกว่าจะสอบผ่าน',
      option1_name: 'Option 1 — รวมทุกหัวข้อ',
      option1_desc: 'Major + Minor ครบทุกวิชา',
      option1_price: '45,000',
      option2_name: 'Option 2 — เฉพาะ Major',
      option2_desc: 'Internal Med, Ped, OB-GYN, Surgery',
      option2_price: '34,900',
      option3_name: 'Option 3 — เฉพาะ Minor',
      option3_desc: 'ER/Ortho/Trauma, Forensic, ENT, Eye',
      option3_price: '15,000'
    }
  },
  {
    key: 'ddx', label: 'DDx ARENA', category: 'course',
    fields: {
      title: 'DDx ARENA',
      subtitle: 'เปิดสนามประลองแล้ววันนี้!',
      mode1: 'DDx Buzzwords — อ่าน clue เดา DDx',
      mode2: 'Pattern → DDx — จำ pattern ได้ไหม',
      mode3: 'Odd One Out — หาตัวที่ไม่เข้าพวก',
      prize: 'ที่ 1 ของเดือน รับรางวัลพิเศษ!',
      url: 'https://ddx.medninja.academy',
      btn_label: 'เข้าสนามประลอง'
    }
  }
]

// ═══ Cache ═══
let templateCache = { data: null, fetchedAt: 0 }

async function getAllTemplates() {
  if (templateCache.data && Date.now() - templateCache.fetchedAt < 60 * 1000) {
    return templateCache.data
  }
  let templates = await FlexTemplate.find().lean()
  if (!templates.length) {
    // Seed defaults
    await FlexTemplate.insertMany(DEFAULT_TEMPLATES)
    templates = await FlexTemplate.find().lean()
  }
  templateCache = { data: templates, fetchedAt: Date.now() }
  return templates
}

async function getTemplate(key) {
  const all = await getAllTemplates()
  return all.find(t => t.key === key) || null
}

function clearTemplateCache() {
  templateCache = { data: null, fetchedAt: 0 }
}

module.exports = { FlexTemplate, getAllTemplates, getTemplate, clearTemplateCache, DEFAULT_TEMPLATES }
