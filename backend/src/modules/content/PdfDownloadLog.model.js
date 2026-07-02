const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const pdfDownloadLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  nationalId: { type: String, default: '' },
  phone: { type: String, default: '' },
  university: { type: String, default: '' },
  sectionId: { type: mongoose.Schema.Types.ObjectId },
  sectionCode: { type: String, default: '' },
  sectionName: { type: String, default: '' },
  videoTitle: { type: String, default: '' },
  bunnyVideoId: { type: String, default: '' },
  refId: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  emailSent: { type: Boolean, default: false },
  emailError: { type: String, default: '' },
  fileSize: { type: Number, default: 0 }
}, { timestamps: true })

pdfDownloadLogSchema.index({ userId: 1, createdAt: -1 })
pdfDownloadLogSchema.index({ refId: 1 })

module.exports = lmsConn.model('PdfDownloadLog', pdfDownloadLogSchema)
