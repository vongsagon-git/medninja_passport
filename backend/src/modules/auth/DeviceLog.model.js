const { lmsConn } = require('../../shared/config/db')
const { Schema } = require('mongoose')

/**
 * DeviceLog — เก็บ device fingerprint เพื่อวิเคราะห์ว่าใครใช้กี่เครื่อง
 * ไม่ block ไม่แจ้ง — เก็บเงียบๆ
 */
const deviceLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },

  // ─── 3 Hash ───
  fpHash: { type: String, default: '' },         // FingerprintJS (per browser)
  hwHash: { type: String, default: '' },          // Hardware Hash (Screen+GPU+Cores+TZ+Lang+Platform)
  hwOnlyHash: { type: String, default: '' },      // Hardware-Only (GPU+Cores+Mem+Arch+Touch+Math)

  // ─── Hardware-Only Signals (แก้ไม่ได้) ───
  gpu: { type: String, default: '' },
  cores: { type: Number, default: 0 },
  memory: { type: String, default: '' },
  architecture: { type: String, default: '' },
  touchPoints: { type: Number, default: 0 },

  // ─── Soft Signals (แก้ได้) ───
  screen: { type: String, default: '' },
  timezone: { type: String, default: '' },
  language: { type: String, default: '' },
  platform: { type: String, default: '' },

  // ─── Browser Info ───
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  userAgent: { type: String, default: '' },

  // ─── Tracking ───
  ip: { type: String, default: '' },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 },
  heartbeatCount: { type: Number, default: 0 }
})

// ซ้ำ hwOnlyHash เดียวกัน = เครื่องเดียว → upsert
deviceLogSchema.index({ userId: 1, hwOnlyHash: 1 }, { unique: true })

module.exports = lmsConn.model('DeviceLog', deviceLogSchema)
