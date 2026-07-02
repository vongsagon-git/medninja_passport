const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const preRegistrationSchema = new mongoose.Schema({
  // ข้อมูลจาก OCR (ห้ามกรอกเอง)
  firstName: { type: String, required: true, trim: true },     // ชื่อไทย
  lastName: { type: String, required: true, trim: true },      // นามสกุลไทย
  firstNameEn: { type: String, trim: true, default: '' },      // ชื่ออังกฤษ
  lastNameEn: { type: String, trim: true, default: '' },       // นามสกุลอังกฤษ
  nationalId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: v => /^\d{13}$/.test(v),
      message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
    }
  },
  dateOfBirth: { type: String, required: true }, // dd/mm/yyyy พ.ศ.
  sex: { type: String, enum: ['M', 'F', ''], default: '' }, // เพศ — ใช้กับ Virtual Patient

  // ข้อมูลกรอกเอง
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  university: { type: String, trim: true },

  // รูปบัตร (base64 data URI — เหมาะกับ DO App Platform ที่ไม่มี persistent disk)
  idCardImage: { type: String, required: true },
  idCardType: { type: String, enum: ['national_id', 'passport'], default: 'national_id' },

  // สถานะ (ตรวจสอบข้อมูลเท่านั้น ไม่ใช่การอนุมัติ)
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },

  // ข้อมูล OCR ดิบ (debug/audit)
  ocrRawResponse: { type: String },

  // ─── CMA (ศรว.) Sync Status ───
  // เช็คผ่าน cmathai.org ว่าเลขบัตรนี้สมัครสอบ ศรว. แล้วหรือยัง
  cmaRegistered: { type: Boolean, default: false },        // เคยสมัคร ศรว. แล้ว
  cmaNameTh: { type: String, default: '' },                 // ชื่อไทยจาก ศรว.
  cmaNameEn: { type: String, default: '' },                 // ชื่อ EN จาก ศรว.
  cmaProfileImage: { type: String, default: '' },           // base64 data URI ของรูปจาก ศรว.
  cmaProfileImageUrl: { type: String, default: '' },        // URL ต้นทาง (เก็บไว้อ้างอิง)
  cmaPassedAll: { type: Boolean, default: false },          // สอบครบทุกขั้นแล้ว (ไม่มีช่อง password)
  cmaSyncedAt: { type: Date }                                // sync ล่าสุดเมื่อไหร่
}, { timestamps: true })

module.exports = passportConn.model('PreRegistration', preRegistrationSchema)
