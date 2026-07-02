/**
 * MedNinja LMS — Make Admin Script
 * สร้าง/promote user เป็น admin ด้วย nationalId
 *
 * Usage:
 *   node backend/src/scripts/make-admin.js <nationalId> <password>
 *   node backend/src/scripts/make-admin.js 1101401196681 13022531
 *
 * ถ้ามี User อยู่แล้ว → promote เป็น admin
 * ถ้ายังไม่มี → สร้าง User ใหม่ (role: admin)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const User = require('../modules/user/User.model')
const { connectDB, passportConn, lmsConn } = require('../shared/config/db')

async function makeAdmin() {
  const nationalId = process.argv[2]
  const password = process.argv[3]

  if (!nationalId) {
    console.error('❌ Usage: node make-admin.js <nationalId> [password]')
    console.error('   Example: node make-admin.js 1101401196681 13022531')
    process.exit(1)
  }

  await connectDB()
  console.log('✅ Connected to MongoDB (passport + lms)')

  // หา User ที่มี nationalId นี้
  let user = await User.findOne({ nationalId })

  if (user) {
    // Promote existing user
    if (user.role === 'admin') {
      console.log(`ℹ️  ${user.name || user.email} is already admin`)
    } else {
      user.role = 'admin'
      await user.save()
      console.log(`✅ Promoted "${user.name || user.email}" to admin`)
    }
  } else {
    // Create new admin user
    if (!password) {
      console.error('❌ User not found — password is required to create new admin')
      console.error('   Usage: node make-admin.js <nationalId> <password>')
      process.exit(1)
    }

    user = await User.create({
      name: 'Admin',
      email: `admin-${nationalId.slice(-4)}@medninja.co.th`,
      password,
      nationalId,
      role: 'admin',
      emailVerified: true,
      authProvider: 'local'
    })
    console.log(`✅ Created admin user`)
    console.log(`   nationalId: ${nationalId}`)
    console.log(`   email: ${user.email}`)
    console.log(`   Login with nationalId + password`)
  }

  await Promise.all([passportConn.close(), lmsConn.close()])
  console.log('✅ Done')
}

makeAdmin().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
