const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const consentLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activation',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  termsVersion: {
    type: String,
    required: true
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  packageTitle: { type: String, default: '' },
  emailSent: { type: Boolean, default: false },
  emailError: { type: String, default: '' }
}, {
  timestamps: true
})

// 1 consent ต่อ 1 activation ต่อ 1 terms version
consentLogSchema.index({ activationId: 1, termsVersion: 1 }, { unique: true })
consentLogSchema.index({ userId: 1 })

module.exports = passportConn.model('ConsentLog', consentLogSchema)
