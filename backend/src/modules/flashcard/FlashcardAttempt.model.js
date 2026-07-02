const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

// เก็บ profile + สถิติการเล่น เพื่อ remarketing + lead tracking
const flashcardAttemptSchema = new mongoose.Schema({
  lineUserId: { type: String, required: true },
  displayName: { type: String, default: '' },
  pictureUrl: { type: String, default: '' },
  totalCardsRevealed: { type: Number, default: 0 },  // จำนวนการ์ดที่เปิดดูทั้งหมด
  totalSessions: { type: Number, default: 0 },        // จำนวนครั้งที่เข้าเล่น
  stars: { type: Number, default: 0 },                 // ดาวสะสม (จบ 1 รอบ = +1 ดาว)
  level: { type: String, default: 'Beginner' },        // ระดับปัจจุบัน
  mindmapViews: { type: Number, default: 0 },             // จำนวนครั้งที่ใช้ mindmap
  lastMindmapAt: { type: Date, default: null },
  lastScore: { type: Object, default: null },           // คะแนนรอบล่าสุด {correct,total,categories}
  scoreHistory: [{ type: Object }],                     // ประวัติคะแนน (เก็บ 50 รอบล่าสุด)
  lastPlayedAt: { type: Date, default: Date.now },
  firstPlayedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// ไม่ซ้ำ — upsert เสมอ (เก็บแค่ record ล่าสุดต่อคน)
flashcardAttemptSchema.index({ lineUserId: 1 }, { unique: true })

module.exports = lmsConn.model('FlashcardAttempt', flashcardAttemptSchema)
