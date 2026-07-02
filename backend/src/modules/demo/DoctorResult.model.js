const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const doctorResultSchema = new mongoose.Schema({
  resultId: { type: String, required: true, unique: true, index: true },
  journey: { type: Array, default: [] },
  embedUrl: { type: String, default: '' },
  videoTitle: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  totalMs: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

// TTL index — auto-delete หลัง 24 ชม.
doctorResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

module.exports = lmsConn.model('DoctorResult', doctorResultSchema)
