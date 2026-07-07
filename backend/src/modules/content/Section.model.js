const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const videoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  bunnyVideoId: { type: String, default: '' },
  bunnyDrmVideoId: { type: String, default: '' },
  bunnyLibraryId: { type: String, default: '' },
  // ⭐ Alibaba VOD (China) — passport-only, LMS ไม่รู้จัก (ignore)
  aliVideoId: { type: String, default: '' },       // Ali NoDRM (encryptType 0)
  aliDrmVideoId: { type: String, default: '' },    // Ali DRM (Widevine)
  duration: { type: String, default: '' },
  order: { type: Number, default: 0 },
  topic: { type: String, default: '' },
  subtopic: { type: String, default: '' },
  topicId: { type: String, default: '' },       // stable id (rename ชื่อไม่กระทบ Self Check binding)
  subtopicId: { type: String, default: '' },
  pdfFileUrl: { type: String, default: '' },
  pdfFileName: { type: String, default: '' },
  pdfFile: { type: String, default: '' },      // filename ใน Bunny Storage (ระบบใหม่)
  pdfEnabled: { type: Boolean, default: true },
  // VDO พิเศษ — ผูก 1:1 กับ VDO หลัก ย้ายตามอัตโนมัติ
  bonusLabel: { type: String, default: '' },  // ชื่อหมวด เช่น BRIDGING, ADVANCE, BONUS
  bonusTitle: { type: String, default: '' },
  bonusBunnyVideoId: { type: String, default: '' },
  bonusBunnyDrmVideoId: { type: String, default: '' },
  bonusDuration: { type: String, default: '' },
  bonusPdfFile: { type: String, default: '' },
  bonusPdfFileName: { type: String, default: '' },
  requiredTier: { type: Number, enum: [1, 2, 3, 4, 5, 6], default: 6 }
}, { _id: false })

const sectionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'กรุณากรอกรหัส Section'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ Section']
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  videos: [videoSchema],
  // Topic/Subtopic PDF mapping — { "Bacteria": "bacteria-summary.pdf", ... }
  topicPdfMap: { type: Map, of: String, default: {} },
  subtopicPdfMap: { type: Map, of: String, default: {} },
  bunnyLibraryId: {
    type: String,
    default: ''
  },
}, {
  timestamps: true
})

module.exports = lmsConn.model('Section', sectionSchema)
