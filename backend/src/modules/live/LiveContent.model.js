const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const liveContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  bunnyVideoId: { type: String, required: true },       // NO DRM (Library 628424) — fallback iOS/Safari
  bunnyDrmVideoId: { type: String, required: true },    // DRM (Library 626874) — บังคับ
  videoDurationSec: { type: Number, default: 0 },
  pdfFiles: [{
    name: { type: String, required: true },
    fileName: { type: String, required: true }           // ชื่อไฟล์ใน Bunny Storage (e.g. "abc123.pdf")
  }]
}, { timestamps: true })

module.exports = lmsConn.model('LiveContent', liveContentSchema)
