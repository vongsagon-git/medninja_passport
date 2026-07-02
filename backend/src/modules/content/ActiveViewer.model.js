const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const activeViewerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  tabId: { type: String, default: '' },
  sectionId: { type: String, default: '' },
  videoIndex: { type: Number, default: 0 },
  sectionName: { type: String, default: '' },
  videoTitle: { type: String, default: '' },
  liveId: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  currentTime: { type: Number, default: 0 },
  videoDuration: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  playerError: { type: String, default: '' },
  appVersion: { type: String, default: '' },
  kicked: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
})

// TTL index — auto-delete หลัง 60 วินาทีไม่มี heartbeat
activeViewerSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 })

module.exports = lmsConn.model('ActiveViewer', activeViewerSchema)
