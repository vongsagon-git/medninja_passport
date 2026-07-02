const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const liveQuestionSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  // sessionId optional — null = ถามนอกเวลาไลฟ์ (ดูวีดีโอย้อนหลัง)
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', default: null },
  sessionTitle: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, default: '' },
  // คำถาม
  question: { type: String, required: true },
  // context: ถามจากไหน
  source: { type: String, enum: ['live', 'replay', 'general'], default: 'general' },
  // timestamp วินาทีที่ถามตอนไลฟ์ (null = ไม่ได้อยู่ในไลฟ์)
  videoTimeSec: { type: Number, default: null },
  // คำตอบ (admin ตอบหลังจบ)
  answer: { type: String, default: '' },
  answeredAt: { type: Date, default: null },
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true })

liveQuestionSchema.index({ sessionId: 1, createdAt: 1 })
liveQuestionSchema.index({ packageId: 1 })

module.exports = lmsConn.model('LiveQuestion', liveQuestionSchema)
