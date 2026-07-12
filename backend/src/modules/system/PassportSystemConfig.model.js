/**
 * PassportSystemConfig — singleton record
 *
 * ⭐ IP BASE Circuit: 3 groups × 1 dimension (SERV only)
 *   ipBaseTh    → country === 'TH'
 *   ipBaseCn    → country === 'CN'
 *   ipBaseOther → country ≠ TH, CN
 *
 *   SERV = Bunny หรือ Ali
 *   UI = ไม่แยก (ภาษาไทยทั้งหมด + LINE)
 */
const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const passportSystemConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },

  // ⭐ IP BASE — 3 groups (Serv + Browser Allow ต่อ group)
  ipBaseThVideoMode: {
    type: String, enum: ['bunny', 'ali'], default: 'bunny'
  },
  ipBaseCnVideoMode: {
    type: String, enum: ['bunny', 'ali'], default: 'ali'
  },
  ipBaseOtherVideoMode: {
    type: String, enum: ['bunny', 'ali'], default: 'bunny'
  },
  // ⭐ Browser allow list per group
  //    Values: 'Chrome', 'Safari', 'Firefox', 'Edge', 'Others'
  ipBaseThAllowedBrowsers: {
    type: [String], default: ['Chrome', 'Safari', 'Firefox', 'Edge']
  },
  ipBaseCnAllowedBrowsers: {
    type: [String], default: ['Chrome']  // จีน = Chrome only (Widevine)
  },
  ipBaseOtherAllowedBrowsers: {
    type: [String], default: ['Chrome', 'Safari', 'Firefox', 'Edge']
  },

  // ⭐ Legacy fields (backward compat)
  nonCnVideoMode: { type: String, enum: ['bunny', 'ali'], default: 'bunny' },
  cnVideoMode:    { type: String, enum: ['bunny', 'ali'], default: 'ali' },
  nonCnUiMode:    { type: String, enum: ['global', 'cn'], default: 'global' },
  cnUiMode:       { type: String, enum: ['global', 'cn'], default: 'cn' },
  globalVideoMode: { type: String, enum: ['bunny', 'ali'], default: 'bunny' },
  globalUiMode:    { type: String, enum: ['global', 'cn'], default: 'global' },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'passport_system_config',
  _id: false,
  versionKey: false
})

module.exports = lmsConn.model('PassportSystemConfig', passportSystemConfigSchema)
