/**
 * หา user จากชื่อ (regex)
 * Usage: node backend/src/scripts/find-by-name.js "สุภาพร"
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const User = require('../modules/user/User.model')
const { passportConn } = require('../shared/config/db')

;(async () => {
  const q = process.argv[2]
  if (!q) { console.error('Usage: node find-by-name.js <name>'); process.exit(1) }

  await new Promise((resolve, reject) => {
    if (passportConn.readyState === 1) return resolve()
    passportConn.once('connected', resolve)
    passportConn.once('error', reject)
    setTimeout(() => reject(new Error('DB timeout')), 15000)
  })
  console.log('✓ DB connected')

  const users = await User.find({ name: new RegExp(q, 'i') })
    .select('name email emailVerified createdAt authProvider verifyExpires phone nationalId')
    .sort({ createdAt: -1 })
    .lean()

  console.log(`พบ ${users.length} รายการ:\n`)
  users.forEach((u, i) => {
    console.log(`[${i + 1}] ${u.name}`)
    console.log(`    email:         ${u.email}`)
    console.log(`    verified:      ${u.emailVerified}`)
    console.log(`    authProvider:  ${u.authProvider}`)
    console.log(`    phone:         ${u.phone || '-'}`)
    console.log(`    nationalId:    ${u.nationalId || '-'}`)
    console.log(`    createdAt:     ${u.createdAt}`)
    console.log(`    verifyExpires: ${u.verifyExpires || '-'}`)
    console.log('')
  })
  process.exit(0)
})().catch(e => { console.error('ERR:', e.message); console.error(e.stack); process.exit(1) })
