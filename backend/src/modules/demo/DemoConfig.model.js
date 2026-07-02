const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const demoVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  bunnyVideoId: { type: String, required: true },
  bunnyDrmVideoId: { type: String, default: '' },
  duration: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: false })

const demoConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'demo', unique: true },
  sectionName: { type: String, default: 'วีดีโอตัวอย่าง — ดูได้เลย' },
  sectionDescription: { type: String, default: 'ตัวอย่างบทเรียนจริงจาก MedNinja — ดูฟรี ไม่ต้องสมัคร' },
  introVideoId: { type: String, default: 'ef8f4e09-0d4b-498e-86fc-e65f74510e1d' },
  introDrmVideoId: { type: String, default: '' },
  videos: [demoVideoSchema]
}, { timestamps: true })

module.exports = lmsConn.model('DemoConfig', demoConfigSchema)
