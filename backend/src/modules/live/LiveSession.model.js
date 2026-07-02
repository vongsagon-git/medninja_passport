const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const liveSessionSchema = new mongoose.Schema({
  liveContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveContent', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  scheduledAt: { type: Date, required: true },
  // denormalized จาก LiveContent — ใช้แสดง MyDashboard + เช็ค overlap
  title: { type: String, default: '' },
  videoDurationSec: { type: Number, default: 0 },
  cancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: '' }
}, { timestamps: true })

// 1 คอร์ส ซ้อนเวลาไม่ไ���้
liveSessionSchema.index({ packageId: 1, scheduledAt: 1 })

module.exports = lmsConn.model('LiveSession', liveSessionSchema)
