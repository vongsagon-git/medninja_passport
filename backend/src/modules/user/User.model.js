const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { passportConn } = require('../../shared/config/db')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'กรุณากรอกอีเมล'],
    lowercase: true,
    trim: true
    // ไม่ใช้ unique index — ใช้ application-level check ใน submit endpoint แทน
    // เหตุผล: กัน race condition แล้ว User.create fail → เหลือ PreReg orphan
  },
  password: {
    type: String,
    minlength: 6
    // ไม่ required แล้ว — Google OAuth ไม่มี password
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'staff'],
    default: 'student'
  },

  // ─── Auth Provider ───
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },

  // ─── Email Verification ───
  emailVerified: {
    type: Boolean,
    default: false
  },
  verifyToken: String,
  verifyExpires: Date,

  // ─── Passport Profile ───
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  university: { type: String, trim: true },
  nationalId: { type: String, trim: true },
  dateOfBirth: { type: String, trim: true }, // dd/mm/yyyy พ.ศ.
  sex: { type: String, enum: ['M', 'F', ''], default: '' }, // เพศ
  profileLocked: { type: Boolean, default: false },
  profileCompletedAt: Date,

  // ─── Ban ───
  isBanned: { type: Boolean, default: false },
  bannedAt: Date,
  bannedReason: { type: String, default: '' },

  // ─── LINE Link ───
  lineUserId: { type: String, sparse: true, unique: true },
  lineDisplayName: String,
  linePictureUrl: String,
  lineLinkedAt: Date
}, {
  timestamps: true
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = passportConn.model('User', userSchema)
