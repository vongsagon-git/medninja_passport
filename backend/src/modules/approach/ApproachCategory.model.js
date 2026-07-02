const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const approachCategorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'กรุณากรอกรหัส Category'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ Category']
  },
  nameEn: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

module.exports = lmsConn.model('ApproachCategory', approachCategorySchema)
