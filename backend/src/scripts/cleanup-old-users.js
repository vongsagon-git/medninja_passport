/**
 * MedNinja LMS — Cleanup Old Users
 * ลบ user ที่ไม่ได้มาจาก Ninja Passport (ไม่มี nationalId จริง หรือเป็น test data)
 *
 * Usage: node backend/src/scripts/cleanup-old-users.js [--delete]
 *   ไม่ใส่ --delete = แค่แสดงรายการ (dry run)
 *   ใส่ --delete   = ลบจริง
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const User = require('../modules/user/User.model')
const PreRegistration = require('../modules/preregister/PreRegistration.model')
const Activation = require('../modules/activation/Activation.model')
const { connectDB, passportConn, lmsConn } = require('../shared/config/db')

async function cleanup() {
  const shouldDelete = process.argv.includes('--delete')

  await connectDB()
  console.log('✅ Connected to MongoDB (passport + lms)\n')

  // ─── ดึง user ทั้งหมด ───
  const allUsers = await User.find().select('-password -verifyToken -verifyExpires').lean()
  console.log(`📊 Users ทั้งหมดใน DB: ${allUsers.length}\n`)

  // ─── แยก Passport users vs Old users ───
  const passportUsers = []
  const oldUsers = []
  const testEmails = ['admin@medninja.co.th', 'student@medninja.co.th']

  for (const user of allUsers) {
    const isTestAccount = testEmails.includes(user.email)
    const hasFakeNid = user.nationalId && user.nationalId.startsWith('123456789')

    if (isTestAccount || hasFakeNid) {
      oldUsers.push(user)
    } else if (user.nationalId && user.nationalId.length === 13) {
      passportUsers.push(user)
    } else {
      oldUsers.push(user)
    }
  }

  console.log('── Passport Users (เก็บไว้) ──')
  if (passportUsers.length === 0) {
    console.log('  (ไม่มี)')
  }
  for (const u of passportUsers) {
    console.log(`  ✅ ${u.name} | ${u.nationalId} | ${u.email} | role: ${u.role}`)
  }

  console.log('\n── Old / Test Users (จะลบ) ──')
  if (oldUsers.length === 0) {
    console.log('  (ไม่มี — สะอาดแล้ว!)')
  }
  for (const u of oldUsers) {
    console.log(`  ❌ ${u.name} | nid: ${u.nationalId || 'ไม่มี'} | ${u.email} | role: ${u.role}`)
  }

  // ─── ดึง PreRegistration + Activation ───
  const preRegs = await PreRegistration.find().lean()
  const activations = await Activation.find().lean()
  console.log(`\n📋 PreRegistrations: ${preRegs.length}`)
  console.log(`🔑 Activations: ${activations.length}`)

  // ─── ลบจริง ───
  if (shouldDelete && oldUsers.length > 0) {
    const oldIds = oldUsers.map(u => u._id)

    // ลบ Activation ที่ผูกกับ old users
    const delActivations = await Activation.deleteMany({ userId: { $in: oldIds } })
    console.log(`\n🗑️  Deleted ${delActivations.deletedCount} activations ของ old users`)

    // ลบ old users
    const delUsers = await User.deleteMany({ _id: { $in: oldIds } })
    console.log(`🗑️  Deleted ${delUsers.deletedCount} old users`)

    // แสดงสรุป
    const remaining = await User.countDocuments()
    console.log(`\n✅ เหลือ User ใน DB: ${remaining}`)
  } else if (oldUsers.length > 0) {
    console.log('\n💡 Dry run — ใส่ --delete เพื่อลบจริง:')
    console.log('   node backend/src/scripts/cleanup-old-users.js --delete')
  } else {
    console.log('\n✅ DB สะอาดแล้ว ไม่ต้องลบอะไร')
  }

  await Promise.all([passportConn.close(), lmsConn.close()])
  console.log('\n🔌 Disconnected')
}

cleanup().catch(err => {
  console.error('\n❌ Cleanup failed:', err.message)
  process.exit(1)
})
