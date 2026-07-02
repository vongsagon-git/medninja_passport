const mongoose = require('mongoose')

/**
 * Multi-DB Connection — passport + lms
 *
 * ลำดับ resolve URI:
 * 1. ถ้ามี MONGODB_URI_PASSPORT / MONGODB_URI_LMS → ใช้เลย
 * 2. ถ้ามีแค่ MONGODB_URI (เดิม) → เปลี่ยน DB name อัตโนมัติ
 * 3. ไม่มีเลย → localhost fallback
 */
function resolveUri(envKey, dbName) {
  if (process.env[envKey]) return process.env[envKey]
  // ถ้ามีแค่ MONGODB_URI ตัวเดียว → ใช้ DB เดิม (ยังไม่แยก)
  // จะแยกจริงเมื่อตั้ง MONGODB_URI_PASSPORT + MONGODB_URI_LMS
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI
  return `mongodb://localhost:27017/${dbName}`
}

const passportConn = mongoose.createConnection(resolveUri('MONGODB_URI_PASSPORT', 'passport'))
const lmsConn = mongoose.createConnection(resolveUri('MONGODB_URI_LMS', 'lms'))
const nlexConn = mongoose.createConnection(resolveUri('MONGODB_URI_NLEX', 'nlex'))

passportConn.on('connected', () => console.log(`MongoDB [passport] connected: ${passportConn.host}`))
passportConn.on('error', err => console.error('MongoDB [passport] error:', err.message))

lmsConn.on('connected', () => console.log(`MongoDB [lms] connected: ${lmsConn.host}`))
lmsConn.on('error', err => console.error('MongoDB [lms] error:', err.message))

nlexConn.on('connected', () => console.log(`MongoDB [nlex] connected: ${nlexConn.host}`))
nlexConn.on('error', err => console.error('MongoDB [nlex] error:', err.message))

/**
 * รอให้ทุก connection พร้อม — เรียกใน server.js ก่อน listen
 */
const connectDB = async () => {
  await Promise.all([
    passportConn.asPromise(),
    lmsConn.asPromise(),
    nlexConn.asPromise()
  ])
}

module.exports = { passportConn, lmsConn, nlexConn, connectDB }
