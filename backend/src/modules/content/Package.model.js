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

packageSchema.pre('save', async function(next) {
  const hasDrm = !!(this.orientBunnyDrmVideoId && this.orientBunnyDrmVideoId.trim())
  const hasNoDrm = !!(this.orientBunnyNoDrmVideoId && this.orientBunnyNoDrmVideoId.trim())
  if (hasDrm !== hasNoDrm) {
    return next(new Error('Bunny orient video ต้องใส่ครบคู่ (DRM + No-DRM) หรือเว้นทั้งคู่'))
  }

  // ═════ DEMO SINGLETON GUARD ═════
  if (this.isDemo) {
    try {
      const existing = await this.constructor.findOne({
        isDemo: true,
        _id: { $ne: this._id }
      }).select('_id title')
      if (existing) {
        return next(new Error(`มี Demo package อยู่แล้ว: "${existing.title}" — ระบบอนุญาต Demo package ได้แค่ 1 ตัวเท่านั้น`))
      }
    } catch (e) { /* ignore */ }

    this.durationDays = 7
    this.liveEnabled = false
    this.aiEnabled = false
    this.aiInfo = ''
    this.orientBunnyDrmVideoId = ''
    this.orientBunnyNoDrmVideoId = ''
    this.orientAliVideoId = ''
  }

  if (!this.isNew && this.isModified && this.isModified('isDemo') && !this.isDemo) {
    try {
      const prev = await this.constructor.findById(this._id).select('isDemo')
      if (prev?.isDemo) {
        return next(new Error('ไม่สามารถยกเลิกสถานะ Demo ของ package นี้ได้'))
      }
    } catch (e) { /* ignore */ }
  }

  next()
})

module.exports = lmsConn.model('Package', packageSchema)
