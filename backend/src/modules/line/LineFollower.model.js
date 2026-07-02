const { lmsConn } = require('../../shared/config/db')

const lineFollowerSchema = new lmsConn.base.Schema({
  lineUserId:      { type: String, required: true, unique: true, index: true },
  displayName:     { type: String, default: '' },
  pictureUrl:      { type: String, default: '' },
  isFollowing:     { type: Boolean, default: true },
  followedAt:      { type: Date, default: Date.now },
  unfollowedAt:    { type: Date, default: null },
  lastMessageAt:   { type: Date, default: null },
  lastMessageText: { type: String, default: '' },

  // CRM Tag / Pipeline
  tag:             { type: String, enum: ['new', 'incoming', 'inquired', 'interested', 'closing', 'student', 'trial', 'admin', 'staff'], default: 'new' },
  tagUpdatedAt:    { type: Date, default: null },
  tagUpdatedBy:    { type: String, default: '' },
  linkedUserId:    { type: lmsConn.base.Schema.Types.ObjectId, ref: 'User', default: null },

  // CRM Extra
  nickname:        { type: String, default: '' },
  passedExams:     { type: [String], default: [] },  // ['nl1', 'nl2', 'nl1+2', 'meq', 'osce']
  segment:         { type: [String], default: [] },  // ['nl-new70', 'nl2', 'meq', 'osce'] — กำลังเตรียมอะไร (จาก survey)
  familyUids:      { type: [String], default: [] },  // lineUserId[] ของผปค. (ตั้งที่นักเรียน)

  // AI Chatbot
  aiMode:          { type: String, enum: ['ai', 'human'], default: 'human' },
  aiPaused:        { type: Boolean, default: false },
  hasEscalation:   { type: Boolean, default: false },
  lastEscalatedAt: { type: Date, default: null },
  adminNote:       { type: String, default: '' },
  positiveNote:    { type: String, default: '' },  // สิ่งที่ AI ควรเน้น/ทำ
  negativeNote:    { type: String, default: '' },  // สิ่งที่ AI ห้ามพูด/หลีกเลี่ยง
  // Payment override per UID — ถ้าไม่ set ใช้ default จาก AI Config
  paymentOverride: {
    type: [{
      courseName:      { type: String },
      amount:          { type: Number },
      enableTransfer:  { type: Boolean },
      enableCard:      { type: Boolean },
      installment3:    { type: Boolean },
      installment6:    { type: Boolean },
      enabled:         { type: Boolean, default: true }
    }],
    default: undefined  // undefined = ใช้ default, [] = ไม่ให้ AI คิดเงินเลย
  }
}, { timestamps: true })

module.exports = lmsConn.model('LineFollower', lineFollowerSchema)
