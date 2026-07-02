/**
 * Bypass email verification — set emailVerified = true ตรง DB
 *
 * Run: node backend/src/scripts/bypass-email-verify.js <email>
 * Example: node backend/src/scripts/bypass-email-verify.js mosskhunanon@gmail.com
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const User = require('../modules/user/User.model')
const { passportConn } = require('../shared/config/db')

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: node bypass-email-verify.js <email-or-nationalId>')
    process.exit(1)
  }

  await new Promise((resolve, reject) => {
    if (passportConn.readyState === 1) return resolve()
    passportConn.once('connected', resolve)
    passportConn.once('error', reject)
    setTimeout(() => reject(new Error('DB connect timeout')), 15000)
  })
  console.log('✓ DB connected')

  const query = arg.includes('@')
    ? { email: arg.trim().toLowerCase() }
    : { nationalId: arg.replace(/-/g, '').trim() }

  const user = await User.findOne(query)
  if (!user) {
    console.error(`✗ ไม่พบ user: ${arg}`)
    process.exit(1)
  }

  console.log(`พบ: ${user.name} (${user.email})`)
  console.log(`  emailVerified เดิม: ${user.emailVerified}`)

  user.emailVerified = true
  user.verifyToken = undefined
  user.verifyExpires = undefined
  await user.save()

  console.log(`✓ Bypass สำเร็จ — emailVerified = true`)
  process.exit(0)
}

main().catch(e => {
  console.error('FATAL:', e.message)
  console.error(e.stack)
  process.exit(1)
})
