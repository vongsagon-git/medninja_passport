const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

// ArenaCard — 1 document = 1 DDx ในเกม Arena
// ใช้ได้ทั้ง 3 โหมด:
//   Mode 1 (Case): CC → History → PE → Ix → เลือก DDx
//   Mode 2 (Pattern): Buzzwords → เลือก DDx
//   Mode 3 (Odd One Out): CC + DDx list → หาตัวที่ไม่เข้าพวก
const arenaCardSchema = new mongoose.Schema({
  ddx: { type: String, required: true },               // ชื่อโรค EN "ACS/MI"
  ddxTh: { type: String, default: '' },                // ชื่อโรค TH "กล้ามเนื้อหัวใจตาย"
  buzzwords: { type: String, default: '' },             // USMLE Buzzwords (Mode 2)
  relatedCC: { type: String, default: '' },             // CC ที่สังกัด "เจ็บหน้าอก"
  relatedCCEn: { type: String, default: '' },           // CC EN "Chest Pain"
  history: [{ type: String }],                            // ประวัติ แต่ละตัว = 1 clue (แสดงทีละตัว 3 วิ)
  pe: [{ type: String }],                                // PE แต่ละตัว = 1 finding
  investigation: [{ type: String }],                     // Ix แต่ละตัว = 1 result
  decoys: [{ type: String }],                            // choice หลอก 6 ตัว (สุ่มมา 3)
  isActive: { type: Boolean, default: true },
  isAudited: { type: Boolean, default: false },         // backward compat
  auditStatus: { type: String, enum: ['pending', 'approved', 'flagged', 'rejected'], default: 'pending' },
}, { timestamps: true })

arenaCardSchema.index({ relatedCC: 1, isActive: 1, isAudited: 1 })
arenaCardSchema.index({ ddx: 1 })

module.exports = lmsConn.model('ArenaCard', arenaCardSchema)
