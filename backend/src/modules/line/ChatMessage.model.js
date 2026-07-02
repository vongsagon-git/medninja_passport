/**
 * ChatMessage — เก็บทุกข้อความ LINE (user + AI + admin)
 * สำหรับ chat history + AI context + admin review
 */
const { lmsConn } = require('../../shared/config/db')

const chatMessageSchema = new lmsConn.base.Schema({
  lineUserId:   { type: String, required: true, index: true },
  role:         { type: String, enum: ['user', 'assistant', 'admin'], required: true },
  contentType:  { type: String, enum: ['text', 'image', 'flex', 'sticker'], default: 'text' },
  text:         { type: String, default: '' },
  imageUrl:     { type: String, default: '' },
  flexTemplate: { type: String, default: '' },
  toolCalls:    [{ name: String, args: Object }],
  isEscalated:  { type: Boolean, default: false },
  metadata:     { type: Object, default: {} },
  createdAt:    { type: Date, default: Date.now, index: true }
})

// Compound index for chat history queries
chatMessageSchema.index({ lineUserId: 1, createdAt: -1 })

// Auto-delete after 180 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 })

module.exports = lmsConn.model('ChatMessage', chatMessageSchema)
