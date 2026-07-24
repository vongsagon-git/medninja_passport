const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false })

const receiptSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  customer: {
    name: { type: String, required: true, trim: true },
    nationalId: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    subDistrict: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    province: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' }
  },

  items: { type: [itemSchema], required: true, validate: v => v.length > 0 },
  total: { type: Number, required: true, min: 0 },

  paymentMethod: { type: String, default: 'เงินสด', trim: true },
  notes: { type: String, default: '', trim: true },

  issuedAt: { type: Date, default: Date.now, index: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issuedByName: { type: String, default: '', trim: true },

  voided: { type: Boolean, default: false },
  voidedAt: { type: Date, default: null },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  voidReason: { type: String, default: '', trim: true }
}, { timestamps: true })

receiptSchema.index({ issuedAt: -1 })

module.exports = passportConn.model('Receipt', receiptSchema)
