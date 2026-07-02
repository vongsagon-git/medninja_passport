const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const stepScoringSchema = new mongoose.Schema({
  maxPoints: { type: Number, default: 10 },
  partialCredit: { type: Boolean, default: true }
}, { _id: false })

const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  type: {
    type: String,
    enum: ['history', 'examination', 'investigation', 'diagnosis', 'ddx', 'treatment', 'management', 'followup'],
    required: true
  },
  question: { type: String, required: [true, 'ต้องระบุคำถาม'] },
  hints: [{ type: String }],
  expectedAnswers: [{ type: String }],
  keyPoints: [{ type: String }],
  revealText: { type: String, default: '' },
  revealImage: { type: String, default: '' },
  explanation: { type: String, default: '' },
  scoring: { type: stepScoringSchema, default: () => ({}) }
}, { _id: true })

const meqCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'ต้องระบุชื่อ case']
  },
  scenario: {
    type: String,
    required: [true, 'ต้องระบุ scenario']
  },
  category: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{ type: String }],
  approachId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  steps: [stepSchema],
  totalPoints: { type: Number, default: 0 },
  estimatedMinutes: { type: Number, default: 15 },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId }
}, {
  timestamps: true
})

// Auto-calculate totalPoints before save
meqCaseSchema.pre('save', function (next) {
  if (this.steps && this.steps.length > 0) {
    this.totalPoints = this.steps.reduce((sum, step) => {
      return sum + (step.scoring?.maxPoints || 10)
    }, 0)
  }
  next()
})

module.exports = lmsConn.model('MeqCase', meqCaseSchema)
