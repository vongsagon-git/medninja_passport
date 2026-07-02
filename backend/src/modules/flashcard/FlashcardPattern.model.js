const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

const flashcardPatternSchema = new mongoose.Schema({
  pattern: { type: String, required: true },    // หน้าการ์ด เช่น "ปวดรอบสะดือ → ย้ายไปท้องขวาล่าง"
  answer: { type: String, required: true },      // คำตอบ เช่น "Appendicitis | ไส้ติ่งอักเสบ"
  mnemonic: { type: String, default: '' },       // ตัวช่วยจำ เช่น "สะดือ → ขวาล่าง = ไส้ติ่ง"
  category: { type: String, default: '' },       // หมวด เช่น GI, Cardio, Neuro
  decoys: [{ type: String }],                    // choice หลอก 6 ตัว (สุ่มมา 3)
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = lmsConn.model('FlashcardPattern', flashcardPatternSchema)
