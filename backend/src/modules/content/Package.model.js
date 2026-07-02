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
  }
}, {
  timestamps: true
})

module.exports = lmsConn.model('Package', packageSchema)
