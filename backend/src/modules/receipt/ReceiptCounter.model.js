const mongoose = require('mongoose')
const { passportConn } = require('../../shared/config/db')

const receiptCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { versionKey: false })

const ReceiptCounter = passportConn.model('ReceiptCounter', receiptCounterSchema)

async function nextReceiptNo(issuedAt = new Date()) {
  const mm = String(issuedAt.getMonth() + 1).padStart(2, '0')
  const yyyy = issuedAt.getFullYear()
  const key = `RC-${yyyy}-${mm}`

  const doc = await ReceiptCounter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )

  const seqStr = String(doc.seq).padStart(4, '0')
  return `RC-${mm}-${seqStr}`
}

module.exports = { ReceiptCounter, nextReceiptNo }
