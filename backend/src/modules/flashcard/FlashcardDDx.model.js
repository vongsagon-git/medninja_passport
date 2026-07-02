const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

// DDx → CC cards: เปิดมาเห็นชื่อโรค พลิกเห็นว่ามาจาก CC ไหน + clue ช่วยจำ
const flashcardDDxSchema = new mongoose.Schema({
  ddx: { type: String, required: true },             // ชื่อโรค เช่น "Appendicitis"
  ddxTh: { type: String, default: '' },               // ชื่อไทย เช่น "ไส้ติ่งอักเสบ"
  relatedCC: [{ type: String }],                      // CC ที่เกี่ยวข้อง เช่น ["ปวดท้อง", "ไข้"]
  clue: { type: String, default: '' },                // จุดสังเกต/ตัวช่วยจำ เช่น "สะดือ → ขวาล่าง"
  history: { type: String, default: '' },             // ประวัติสำคัญ เช่น "ปวดรอบสะดือ → ย้ายไป RLQ"
  pe: { type: String, default: '' },                  // PE สำคัญ เช่น "McBurney tenderness, Rebound+"
  investigation: { type: String, default: '' },       // Ix สำคัญ เช่น "WBC สูง, CT: dilated appendix"
  category: { type: String, default: '' },            // หมวด เช่น GI, Cardio, Neuro
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = lmsConn.model('FlashcardDDx', flashcardDDxSchema)
