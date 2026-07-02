const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'กรุณากรอกชื่อคอร์ส'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  instructor: {
    type: String,
    default: ''
  },
  learningPoints: [{
    type: String
  }],
  system: {
    type: String,
    enum: ['new_2570', 'legacy'],
    default: 'legacy'
  },
  durationHours: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  subjects: [{
    type: String  // รายวิชา เช่น "Internal Medicine", "Pediatrics"
  }],
  // ระบบการเรียนที่รวมอยู่ (แสดงเป็น badge หน้าเว็บ)
  features: {
    live:    { type: Boolean, default: false },  // เรียนสด
    lms:     { type: Boolean, default: false },  // VDO ย้อนหลัง
    synapse: { type: Boolean, default: false },  // ระบบ SYNAPSE
    atlas:   { type: Boolean, default: false },  // NL1+2 E-Learning
    nlex:    { type: Boolean, default: false },  // ข้อสอบ 10,000+
    meqex:   { type: Boolean, default: false },  // MEQ Exam Simulation
    ddx:     { type: Boolean, default: false },  // DDx Arena
    osce:    { type: Boolean, default: false }   // OSCE ตัวต่อตัว
  },
  subCourses: [{
    title: { type: String },
    durationHours: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    description: { type: String, default: '' },
    subjects: [{ type: String }]  // รายวิชาเฉพาะของ sub-course
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// getCourses: { isPublished: true } sorted by order — covers CoursesPage + HomePage
courseSchema.index({ isPublished: 1, order: 1 })

module.exports = lmsConn.model('Course', courseSchema)
