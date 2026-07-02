const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const viewerTabSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tabId: { type: String, required: true },
  status: { type: String, enum: ['watching', 'blocked'], default: 'blocked' },
  sectionName: { type: String, default: '' },
  videoTitle: { type: String, default: '' },
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
})

// unique: 1 user + 1 tabId = 1 document
viewerTabSchema.index({ userId: 1, tabId: 1 }, { unique: true })
// TTL: auto-delete หลัง 90 วินาทีไม่มี heartbeat
viewerTabSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 })

module.exports = lmsConn.model('ViewerTab', viewerTabSchema)
