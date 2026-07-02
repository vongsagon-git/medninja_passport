const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const pageVisitSchema = new mongoose.Schema({
  // หน้าที่เข้าชม
  page: { type: String, default: '/' },
  // ข้อมูล visitor
  ip: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  // device
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  device: { type: String, default: '' }, // desktop, mobile, tablet
  userAgent: { type: String, default: '' },
  screenSize: { type: String, default: '' },
  // traffic source
  referrer: { type: String, default: '' },
  utmSource: { type: String, default: '' },
  utmMedium: { type: String, default: '' },
  utmCampaign: { type: String, default: '' },
  // user (ถ้า login อยู่)
  userId: { type: mongoose.Schema.Types.ObjectId },
  userName: { type: String, default: '' }
}, { timestamps: true })

// index สำหรับ query ตามวัน
pageVisitSchema.index({ createdAt: 1 })
// auto-delete หลัง 90 วัน
pageVisitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 })

module.exports = lmsConn.model('PageVisit', pageVisitSchema)
