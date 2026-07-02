const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const answerSchema = new mongoose.Schema({
  stepIndex: { type: Number, required: true },
  answer: { type: String, default: '' },
  score: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now }
}, { _id: false })

const meqAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ต้องระบุ userId']
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ต้องระบุ caseId']
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  currentStep: { type: Number, default: 0 },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentScore: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeTakenSec: { type: Number, default: 0 }
}, {
  timestamps: true
})

// Indexes
meqAttemptSchema.index({ userId: 1, caseId: 1 })
meqAttemptSchema.index({ userId: 1, status: 1 })

module.exports = passportConn.model('MeqAttempt', meqAttemptSchema)
