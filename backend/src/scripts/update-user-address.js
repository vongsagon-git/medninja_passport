/**
 * Update address ทีละคน (call จาก command line ทีละครั้งหลัง Claude อ่านรูปเสร็จ)
 *
 * Usage:
 *   node src/scripts/update-user-address.js <userId> '{"address":"...","subDistrict":"...","district":"...","province":"...","postalCode":"..."}'
 *
 * Example:
 *   node src/scripts/update-user-address.js 6858abcd... '{"address":"55/5 ถ.ฉลองกรุง","subDistrict":"ลาดกระบัง","district":"ลาดกระบัง","province":"กรุงเทพมหานคร","postalCode":"10520"}'
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const { passportConn, connectDB } = require('../shared/config/db')
const User = require('../modules/user/User.model')

const [, , userId, jsonStr] = process.argv

if (!userId || !jsonStr) {
  console.error('Usage: node update-user-address.js <userId> <json>')
  process.exit(1)
}

let data
try {
  data = JSON.parse(jsonStr)
} catch (e) {
  console.error('Invalid JSON:', e.message)
  process.exit(1)
}

;(async () => {
  await connectDB()

  const update = {}
  for (const k of ['address', 'subDistrict', 'district', 'province', 'postalCode']) {
    if (data[k] !== undefined) update[k] = String(data[k]).trim()
  }

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean()
  if (!user) {
    console.error('User not found:', userId)
    process.exit(1)
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '?'
  console.log(`✓ ${name} — ${update.province || ''} ${update.postalCode || ''}`)

  await passportConn.close()
  process.exit(0)
})().catch(err => {
  console.error('ERROR:', err.message)
  process.exit(1)
})
