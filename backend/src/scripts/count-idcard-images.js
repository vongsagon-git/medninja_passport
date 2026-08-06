/**
 * Count นักเรียนที่มีรูปบัตรใน DB
 *   node src/scripts/count-idcard-images.js
 *
 * แสดง:
 * - จำนวน PreRegistration ทั้งหมด
 * - จำนวนที่มี idCardImage
 * - จำนวน User ที่ยังไม่มี address (ต้อง backfill)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const { passportConn, connectDB } = require('../shared/config/db')
const PreRegistration = require('../modules/preregister/PreRegistration.model')
const User = require('../modules/user/User.model')

;(async () => {
  await connectDB()
  console.log('MongoDB connected\n')

  const totalPreReg = await PreRegistration.countDocuments()
  const withImage = await PreRegistration.countDocuments({ idCardImage: { $exists: true, $ne: '' } })

  // ─── เฉพาะ role = student ───
  const totalStudent = await User.countDocuments({ role: 'student' })
  const studentWithNid = await User.countDocuments({ role: 'student', nationalId: { $exists: true, $ne: '' } })
  const studentWithAddress = await User.countDocuments({ role: 'student', address: { $exists: true, $ne: '' } })
  const studentNoAddress = await User.countDocuments({
    role: 'student',
    nationalId: { $exists: true, $ne: '' },
    $or: [{ address: { $exists: false } }, { address: '' }]
  })

  console.log('═══════════════════════════════════════')
  console.log('  PreRegistration (รูปบัตร)')
  console.log('═══════════════════════════════════════')
  console.log(`  Total:                ${totalPreReg}`)
  console.log(`  With idCardImage:     ${withImage}`)
  console.log('')
  console.log('═══════════════════════════════════════')
  console.log('  Student (role=student)')
  console.log('═══════════════════════════════════════')
  console.log(`  Total students:       ${totalStudent}`)
  console.log(`  With nationalId:      ${studentWithNid}`)
  console.log(`  With address:         ${studentWithAddress}`)
  console.log(`  Need backfill (nid ✓, addr ✗): ${studentNoAddress}`)
  console.log('')

  // Match: PreReg → Student via nationalId
  const preRegs = await PreRegistration.find({ idCardImage: { $exists: true, $ne: '' } })
    .select('nationalId firstName lastName')
    .lean()
  let matched = 0
  let matchedNoAddress = 0
  let noStudent = 0
  for (const p of preRegs) {
    const u = await User.findOne({ role: 'student', nationalId: p.nationalId }).select('_id address').lean()
    if (!u) { noStudent++; continue }
    matched++
    if (!u.address) matchedNoAddress++
  }
  console.log('═══════════════════════════════════════')
  console.log('  PreReg → Student matching (via nationalId)')
  console.log('═══════════════════════════════════════')
  console.log(`  Matched (มี Student):         ${matched}`)
  console.log(`  Matched ที่ยังไม่มี address:   ${matchedNoAddress}  ← ต้องอ่านรูป`)
  console.log(`  Orphan (ไม่มี Student):        ${noStudent}`)
  console.log('')

  await passportConn.close()
  process.exit(0)
})().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
