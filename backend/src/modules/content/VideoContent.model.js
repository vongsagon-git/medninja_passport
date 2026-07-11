/**
 * VideoContent — Library ของ video ที่มี 4 fields ครบ (bunny×2 + ali×2)
 * ═══════════════════════════════════════════════════════════
 * Reuse: admin เลือกจาก library ได้เลย ไม่ต้องกรอก 4 fields ซ้ำ
 * ═══════════════════════════════════════════════════════════
 */
const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const videoContentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  tagLv1: { type: String, default: '', trim: true, index: true },
  tagLv2: { type: String, default: '', trim: true, index: true },
  tagLv3: { type: String, default: '', trim: true, index: true },

  // 3 videoIds — ครบทั้ง 3 fields = เข้า library
  // Bunny: 2 IDs (NoDRM + Widevine) · Ali: 1 ID (dual encryption ในตัว)
  bunnyVideoId: { type: String, required: true },
  bunnyDrmVideoId: { type: String, required: true },
  aliVideoId: { type: String, required: true },

  duration: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' }
}, { timestamps: true })

// Unique title (upsert ตาม title)
videoContentSchema.index({ title: 1 }, { unique: true })

module.exports = lmsConn.model('VideoContent', videoContentSchema, 'videocontents')
