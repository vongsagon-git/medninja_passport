const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const activationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ต้องระบุ userId']
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: [true, 'ต้องระบุ packageId']
  },
  activatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: [true, 'ต้องระบุวันหมดอายุ']
  },
  extendedDays: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
    default: ''
  },
  banReason: {
    type: String,
    default: ''
  },
  bannedAt: {
    type: Date,
    default: null
  },
  synapseEnabled: {
    type: Boolean,
    default: false
  },
  ddxEnabled: {
    type: Boolean,
    default: false
  },
  nlexEnabled: {
    type: Boolean,
    default: false
  },
  osceEnabled: {
    type: Boolean,
    default: false
  },
  ddxExtraEnabled: {
    type: Boolean,
    default: false
  },
  meqexEnabled: {
    type: Boolean,
    default: false
  },
  atlasEnabled: {
    type: Boolean,
    default: false
  },
  longexEnabled: {
    type: Boolean,
    default: false
  },
  skill15Enabled: {
    type: Boolean,
    default: false
  },
  liveEnabled: {
    type: Boolean,
    default: false
  },
  qaEnabled: {
    type: Boolean,
    default: false
  },
  tier: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6],
    default: 6
  },
  // ═════ ORIENT TRACKING (per-activation) ═════
  orientCompletedAt: {
    type: Date,
    default: null
  },
  orientWatchedSeconds: {
    type: Number,
    default: 0
  },
  orientDurationSeconds: {
    type: Number,
    default: 0
  },
  orientVideoIdUsed: {
    type: String,
    default: ''
  },
  orientResetCount: {
    type: Number,
    default: 0
  },
  orientLastResetBy: {
    type: String,
    default: ''  // 'self' | 'admin:{userId}'
  },
  orientLastResetAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Compound index สำหรับ query ที่ใช้บ่อย
activationSchema.index({ userId: 1, isActive: 1 })
activationSchema.index({ expiresAt: 1 })

module.exports = passportConn.model('Activation', activationSchema)
