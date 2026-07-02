const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const selfCheckBindingSchema = new mongoose.Schema({
  scope: { type: String, enum: ['topic', 'subtopic'], required: true },
  refId: { type: String, required: true },                    // topicId หรือ subtopicId (stable)
  templateSlug: { type: String, required: true, lowercase: true },
  refNameSnapshot: { type: String, default: '' },             // ชื่อ ณ ตอน bind (เก็บไว้ debug + กัน orphan)
  sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isOrphan: { type: Boolean, default: false }                 // true เมื่อ refId ไม่มี video ใช้แล้ว
}, { timestamps: true })

selfCheckBindingSchema.index({ scope: 1, refId: 1 }, { unique: true })
selfCheckBindingSchema.index({ templateSlug: 1 })
selfCheckBindingSchema.index({ sectionId: 1 })

module.exports = lmsConn.model('SelfCheckBinding', selfCheckBindingSchema)
