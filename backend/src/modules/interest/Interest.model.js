const { lmsConn } = require('../../shared/config/db')
const mongoose = require('mongoose')

const interestSchema = new mongoose.Schema({
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  university: { type: String, required: true, trim: true },
  phone:      { type: String, trim: true },
  email:      { type: String, trim: true },
  courses:    [{ type: String, enum: ['NL1+2', 'MEQ', 'OSCE'] }],
  ipAddress:  { type: String }
}, { timestamps: true })

module.exports = lmsConn.model('Interest', interestSchema)
