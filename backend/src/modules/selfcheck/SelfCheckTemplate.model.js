const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true, trim: true }
}, { _id: false })

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  items: [itemSchema]
}, { _id: false })

const selfCheckTemplateSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'slug ต้องเป็น kebab-case (a-z, 0-9, -)']
  },
  name: { type: String, required: true, trim: true },
  tagline: { type: String, default: '', trim: true },
  icon: { type: String, default: '📋' },
  color: { type: String, default: '#3b82f6' },
  sections: [sectionSchema],
  isPublished: { type: Boolean, default: false }
}, { timestamps: true })

selfCheckTemplateSchema.virtual('totalItems').get(function () {
  return this.sections.reduce((sum, s) => sum + (s.items?.length || 0), 0)
})

module.exports = lmsConn.model('SelfCheckTemplate', selfCheckTemplateSchema)
