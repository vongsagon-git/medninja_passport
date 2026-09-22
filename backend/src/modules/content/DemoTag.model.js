const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

/**
 * DemoTag — tag ที่ admin แปะให้ video ใน demo section
 * (ระบบเดิม hardcoded 7 tags — เปลี่ยนเป็น dynamic ให้ admin แก้เอง)
 */
const demoTagSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'กรุณากรอก code (a-z, 0-9, -)'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'code ต้องเป็นตัวเล็กพร้อม a-z / 0-9 / - เท่านั้น']
  },
  label: {
    type: String,
    required: [true, 'กรุณากรอก label (แสดงใน chip)'],
    trim: true
  },
  color: {
    type: String,
    default: '#0ea5e9',   // sky-500 default
    match: [/^#[0-9A-Fa-f]{6}$/, 'color ต้องเป็น hex format #RRGGBB']
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  // isSystem = ห้ามลบ (สำหรับ tag 'all' เป็นต้น)
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// ─── Guard: ห้ามลบ system tag ───
demoTagSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystem) return next(new Error(`🔒 Tag "${this.code}" เป็น system tag ห้ามลบ`))
  next()
})

// ─── Guard: ห้ามเปลี่ยน code ของ system tag ───
demoTagSchema.pre('save', async function(next) {
  if (!this.isNew && this.isModified('code')) {
    try {
      const prev = await this.constructor.findById(this._id).select('isSystem code')
      if (prev?.isSystem) {
        return next(new Error(`🔒 ไม่สามารถเปลี่ยน code ของ system tag "${prev.code}" ได้`))
      }
    } catch (e) { /* ignore */ }
  }
  next()
})

module.exports = lmsConn.model('DemoTag', demoTagSchema)
