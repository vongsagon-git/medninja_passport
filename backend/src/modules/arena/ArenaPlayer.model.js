const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

const arenaPlayerSchema = new mongoose.Schema({
  lineUserId: { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },
  pictureUrl: { type: String, default: '' },
  totalGames: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalWrong: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastMode: { type: String, default: '' },
  lastPlayedAt: { type: Date },
  // Monthly score
  monthlyScore: { type: Number, default: 0 },       // คะแนนรวมเดือนนี้
  monthlyMonth: { type: String, default: '' },       // "2026-04" format
  monthlyGames: { type: Number, default: 0 },        // จำนวนเกมเดือนนี้
  monthlyHistory: [{                                  // คะแนนย้อนหลังทุกเดือน
    month: String,                                    // "2026-04"
    score: Number,
    games: Number
  }],
  // Referral system
  refCode: { type: String, default: '', index: true },  // ref code ของตัวเอง
  referredBy: { type: String, default: '' },             // ref code ของคนที่ชวนมา
  hasPlayed: { type: Boolean, default: false },          // เล่นจบ ≥1 รอบ
}, { timestamps: true })

arenaPlayerSchema.index({ bestScore: -1 })
arenaPlayerSchema.index({ monthlyScore: -1 })
arenaPlayerSchema.index({ lastPlayedAt: -1 })

module.exports = lmsConn.model('ArenaPlayer', arenaPlayerSchema)
