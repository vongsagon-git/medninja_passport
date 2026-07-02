const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const clientLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  // ประเภท event
  type: {
    type: String,
    enum: [
      'error',        // JS error, API error
      'video_error',  // video 403, load fail
      'devtools',     // เปิด F12
      'behavior',     // พฤติกรรมแปลก เช่น screenshot attempt
      'replaced',     // ถูกแทนที่โดย tab อื่น
      'info',         // ข้อมูลทั่วไป
      'live_event'    // event timeline ของ live player (init/ready/play/pause/error/stuck/...)
    ],
    default: 'error'
  },
  message: { type: String, default: '' },
  detail: { type: String, default: '' },
  // context
  url: { type: String, default: '' },
  sectionId: { type: String, default: '' },
  videoIndex: { type: Number },
  videoTitle: { type: String, default: '' },
  // device info
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  screenSize: { type: String, default: '' },
  // live debug — เฉพาะ type = 'live_event'
  liveId: { type: String, default: '' },         // sessionId / packageId
  tabId: { type: String, default: '' },          // จับคู่ session ของ tab
  event: { type: String, default: '' },          // ชื่อ event: init, ready, play, pause, timeupdate, error, ws_connect, ws_disconnect, stuck, iframe_reload, ...
  currentTime: { type: Number },                 // วินาที VDO ปัจจุบัน
  bufferedEnd: { type: Number },                 // วินาทีที่ buffer ถึง
  isPlaying: { type: Boolean },
  liveReady: { type: Boolean },
  needUnmute: { type: Boolean },
  wsConnected: { type: Boolean },
  errorCount: { type: Number },                  // จำนวน error สะสมใน session
  resolved: { type: Boolean, default: false }
}, { timestamps: true })

// index ช่วย query live debug เร็ว
clientLogSchema.index({ type: 1, userId: 1, createdAt: -1 })
clientLogSchema.index({ type: 1, liveId: 1, createdAt: -1 })

// auto-delete หลัง 30 วัน
clientLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 86400 })

module.exports = lmsConn.model('ClientLog', clientLogSchema)
