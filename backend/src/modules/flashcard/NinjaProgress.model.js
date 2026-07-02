const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

const ninjaProgressSchema = new mongoose.Schema({
  lineUserId: { type: String, required: true },
  chapter: { type: String, required: true },      // category เช่น "GI", "Cardio"
  stage: { type: Number, default: 0 },             // ด่านที่ผ่านล่าสุด (0 = ยังไม่เริ่ม)
  stageScores: [{ stage: Number, correct: Number, total: Number, date: Date }],
  bossCleared: { type: Boolean, default: false },   // ผ่าน boss แล้วหรือยัง
  badgeEarned: { type: Boolean, default: false },
}, { timestamps: true })

ninjaProgressSchema.index({ lineUserId: 1, chapter: 1 }, { unique: true })

module.exports = lmsConn.model('NinjaProgress', ninjaProgressSchema)
