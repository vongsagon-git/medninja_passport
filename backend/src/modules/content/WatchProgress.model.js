const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const watchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  videoIndex: { type: Number, required: true },
  currentTime: { type: Number, default: 0 }, // วินาทีที่ดูถึง (สำหรับ resume)
  watched: { type: Boolean, default: false }, // กด "เรียนแล้ว"
  isBonus: { type: Boolean, default: false } // VDO พิเศษแยก progress จาก VDO หลัก
}, { timestamps: true })

// 1 user + 1 section + 1 video + bonus flag = 1 record
watchProgressSchema.index({ userId: 1, sectionId: 1, videoIndex: 1, isBonus: 1 }, { unique: true })
// query ทั้ง section
watchProgressSchema.index({ userId: 1, sectionId: 1 })

module.exports = lmsConn.model('WatchProgress', watchProgressSchema)
