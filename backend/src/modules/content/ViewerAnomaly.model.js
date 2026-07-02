const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const viewerAnomalySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  type: { type: String, enum: ['concurrent_view', 'rapid_switch'], default: 'concurrent_view' },
  detail: { type: String, default: '' },
  // ข้อมูลตอนตรวจพบ
  currentSection: { type: String, default: '' },
  currentVideo: { type: String, default: '' },
  conflictSection: { type: String, default: '' },
  conflictVideo: { type: String, default: '' },
  resolved: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = lmsConn.model('ViewerAnomaly', viewerAnomalySchema)
