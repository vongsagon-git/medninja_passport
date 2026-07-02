const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const approachProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ต้องระบุ userId']
  },
  approachId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ต้องระบุ approachId']
  },
  // SM-2 spaced repetition
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 1 },
  repetitions: { type: Number, default: 0 },
  nextReviewAt: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date },
  // Stats
  totalAttempts: { type: Number, default: 0 },
  correctAttempts: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  lastScore: { type: Number, default: 0 },
  averageTimeSec: { type: Number, default: 0 },
  // Mastery
  mastery: {
    type: String,
    enum: ['new', 'learning', 'reviewing', 'mastered'],
    default: 'new'
  },
  // Read tracking
  readCount: { type: Number, default: 0 },
  lastReadAt: { type: Date },
  bookmarked: { type: Boolean, default: false }
}, {
  timestamps: true
})

// Compound unique: 1 progress per user per approach
approachProgressSchema.index({ userId: 1, approachId: 1 }, { unique: true })
// Fast lookup for review queue
approachProgressSchema.index({ userId: 1, nextReviewAt: 1 })
// Fast lookup by mastery level
approachProgressSchema.index({ userId: 1, mastery: 1 })

module.exports = passportConn.model('ApproachProgress', approachProgressSchema)
