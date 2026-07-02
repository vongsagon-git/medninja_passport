const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const approachAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ต้องระบุ userId']
  },
  approachId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ต้องระบุ approachId']
  },
  mode: {
    type: String,
    enum: ['free-recall', 'multiple-choice'],
    required: true
  },
  answeredDiagnoses: [{ type: String }],
  score: {
    type: Number,
    required: [true, 'ต้องระบุ score'],
    min: 0,
    max: 100
  },
  correctCount: { type: Number, default: 0 },
  totalExpected: { type: Number, default: 0 },
  timeTakenSec: { type: Number, default: 0 },
  quality: { type: Number, min: 0, max: 5 }
}, {
  timestamps: true
})

// Query by user's recent attempts
approachAttemptSchema.index({ userId: 1, createdAt: -1 })
// Query by approach's recent attempts
approachAttemptSchema.index({ approachId: 1, createdAt: -1 })
// TTL: auto-delete after 180 days
approachAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 })

module.exports = passportConn.model('ApproachAttempt', approachAttemptSchema)
