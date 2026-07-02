const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

// CC → DDx cards: เปิดมาเห็นอาการ พลิกเห็น DDx ทั้งหมด
const flashcardCCSchema = new mongoose.Schema({
  cc: { type: String, required: true },           // ชื่ออาการไทย เช่น "ปวดท้อง"
  ccEn: { type: String, default: '' },             // English เช่น "Abdominal Pain"
  ddxList: [{ type: String }],                     // รายชื่อ DDx เช่น ["Appendicitis", "Pancreatitis", ...]
  ddxCount: { type: Number, default: 0 },
  decoys: [{ type: String }],                    // ตัวแปลก 6 ตัว (DDx จาก CC อื่น สุ่มมา 1)
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = lmsConn.model('FlashcardCC', flashcardCCSchema)
