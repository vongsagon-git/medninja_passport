const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ Package']
  },
  description: {
    type: String,
    default: ''
  },
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  durationDays: {
    type: Number,
    default: 365
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  liveEnabled: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  // AI Chatbot
  aiEnabled: {
    type: Boolean,
    default: true  // AI เห็นคอร์สนี้ไหม (ปิด = AI จะไม่พูดถึง)
  },
  aiInfo: {
    type: String,
    default: ''  // รายละเอียด จุดเด่น ราคา ชั่วโมง ฯลฯ
  },
  // ═════ ORIENT VIDEOS (ปฐมนิเทศ) — 3 slots ═════
  orientBunnyDrmVideoId: {
    type: String,
    default: ''
  },
  orientBunnyNoDrmVideoId: {
    type: String,
    default: ''
  },
  orientAliVideoId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

packageSchema.pre('save', function(next) {
  const hasDrm = !!(this.orientBunnyDrmVideoId && this.orientBunnyDrmVideoId.trim())
  const hasNoDrm = !!(this.orientBunnyNoDrmVideoId && this.orientBunnyNoDrmVideoId.trim())
  if (hasDrm !== hasNoDrm) {
    return next(new Error('Bunny orient video ต้องใส่ครบคู่ (DRM + No-DRM) หรือเว้นทั้งคู่'))
  }
  next()
})

module.exports = lmsConn.model('Package', packageSchema)
