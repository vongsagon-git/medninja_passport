const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

// ⭐ China Landing Lead — เก็บข้อมูลนักเรียนแพทย์ไทยในจีนที่กรอกฟอร์ม
//    เพื่อขอ PDF checklist "เตรียมกลับไทย" + สิทธิ์ปรึกษาหมอแตม 30 นาที ฟรี
//    ใช้ในสัมมนา + ต่อเนื่อง marketing ทีหลัง
const chinaLandingLeadSchema = new mongoose.Schema({
  // ─── ข้อมูลส่วนตัว ───
  fullName: { type: String, trim: true, maxlength: 120 },
  year: { type: String, trim: true, maxlength: 20 },       // ปี 1, ปี 2, ... จบแล้ว, ฝึกงาน
  university: { type: String, trim: true, maxlength: 200 }, // มหาลัย/เมืองในจีน

  // ─── ช่องทางติดต่อ (ต้องมีอย่างน้อย 1) ───
  email: { type: String, trim: true, lowercase: true, maxlength: 200 },
  phoneTh: { type: String, trim: true, maxlength: 30 },
  lineId: { type: String, trim: true, maxlength: 60 },
  wechatId: { type: String, trim: true, maxlength: 60 },

  // ─── Assessment (30 ข้อ) ───
  //   answers = array 30 ตัว, ค่า 0/1/2 (ยังไม่ได้เริ่ม / พอทำได้ / มั่นใจ)
  answers: { type: [Number], default: [] },
  totalScore: { type: Number, default: 0 },     // 0-60
  scoresByCategory: {
    officialPath: { type: Number, default: 0 },      // 0-10 (5 ข้อ x 2)
    knowledgeNL: { type: Number, default: 0 },       // 0-10
    clinicalThinking: { type: Number, default: 0 },  // 0-10
    labAndWard: { type: Number, default: 0 },        // 0-10
    languageOsce: { type: Number, default: 0 },      // 0-10
    confidence: { type: Number, default: 0 }         // 0-10
  },
  scoreBand: { type: String, enum: ['0-20', '21-35', '36-48', '49-60', 'skipped'], default: 'skipped' },

  // ─── Lead Tier (แยกกลุ่ม lead ตาม intent) ───
  //   pdf  = แค่กรอกข้อมูล ดาวน์โหลด PDF (fast lane ตอนบรรยาย)
  //   full = ทำแบบทดสอบ 30 ข้อ ครบ ได้ 4 สิทธิ์
  leadTier: { type: String, enum: ['pdf', 'full'], default: 'pdf', index: true },

  // ─── Interests (user กด service อะไรบ้าง) ───
  //   ค่า: 'pdf' (โหลด PDF), 'wechat' (ทัก WeChat), 'vdocall' (นัด VDO Call), 'discount' (ใช้ส่วนลด)
  interests: [{ type: String }],
  interestClicks: {                   // นับจำนวนคลิกแต่ละ interest
    pdf: { type: Number, default: 0 },
    wechat: { type: Number, default: 0 },
    vdocall: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  },

  // ─── สถานะการติดต่อ (admin ใช้ track) ───
  contactStatus: {
    type: String,
    enum: ['new', 'pdf_sent', 'consulted', 'converted', 'no_response'],
    default: 'new'
  },
  adminNote: { type: String, trim: true, maxlength: 500 },

  // ─── metadata ───
  source: { type: String, default: 'china-landing' },  // future: อาจมี landing ที่อื่น
  seminarBatch: { type: String, trim: true },           // เช่น "2026-07-18-china-seminar"
  ip: { type: String, trim: true, maxlength: 50 },
  country: { type: String, trim: true, maxlength: 10 },
  userAgent: { type: String, trim: true, maxlength: 300 }
}, { timestamps: true })

chinaLandingLeadSchema.index({ createdAt: -1 })
chinaLandingLeadSchema.index({ contactStatus: 1, createdAt: -1 })
chinaLandingLeadSchema.index({ seminarBatch: 1 })
// ⭐ WeChat = de-facto unique key (case-insensitive lookup for upsert)
chinaLandingLeadSchema.index({ wechatId: 1 })

module.exports = lmsConn.model('ChinaLandingLead', chinaLandingLeadSchema)
