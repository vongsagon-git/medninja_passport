const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const differentialSchema = new mongoose.Schema({
  diagnosis: { type: String, required: true },
  diagnosisTh: { type: String, default: '' },
  keyClues: [{ type: String }],
  redFlags: [{ type: String }],
  investigation: [{ type: String }],
  treatment: { type: String, default: '' },
  firstLine: { type: String, default: '' },
  dontMiss: { type: String, default: '' },
  examTip: { type: String, default: '' },
  frequency: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  order: { type: Number, default: 0 }
}, { _id: true })

const approachSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'กรุณากรอกรหัส Approach'],
    unique: true,
    trim: true,
    uppercase: true
  },
  symptom: {
    type: String,
    required: [true, 'กรุณากรอกชื่ออาการ']
  },
  symptomEn: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApproachCategory'
  },
  order: {
    type: Number,
    default: 0
  },
  differentials: [differentialSchema],
  summary: {
    type: String,
    default: ''
  },
  mnemonics: [{ type: String }],
  practiceConfig: {
    timeLimit: { type: Number, default: 120 },
    passingScore: { type: Number, default: 60 }
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports = lmsConn.model('Approach', approachSchema)
