/**
 * PassportSystemConfig — 1 singleton record ใน DB
 *
 * ใช้เป็น circuit breaker สำหรับ passport (ไม่กระทบ LMS)
 *   - globalVideoMode: 'bunny' (default) | 'ali'
 *     ตัดสินว่า /my/watch/* ให้ serve Bunny หรือ Alibaba VOD
 *
 * ⚠️ ใช้ชื่อ 'PassportSystemConfig' + collection = 'passport_system_config'
 *    เพื่อกัน conflict ถ้า LMS เพิ่ม SystemConfig ในอนาคต
 */
const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const passportSystemConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },  // fixed key
  globalVideoMode: {
    type: String,
    enum: ['bunny', 'ali'],
    default: 'bunny'
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'passport_system_config',
  _id: false,  // ใช้ String _id
  versionKey: false
})

module.exports = lmsConn.model('PassportSystemConfig', passportSystemConfigSchema)
