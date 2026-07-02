/**
 * Manual register: ศุภานิช วงศ์เสริมสิน
 * เหตุผล: DO Gradient AI (gpt-4o) tier ถูกตัด → OCR ใช้ไม่ได้
 * Workaround: เขียน PreRegistration + User ตรง DB
 *
 * Run: node backend/src/scripts/manual-register-supanich.js
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const fs = require('fs')

const PreRegistration = require('../modules/preregister/PreRegistration.model')
const User = require('../modules/user/User.model')
const Activation = require('../modules/activation/Activation.model')
const Package = require('../modules/content/Package.model')
const { passportConn } = require('../shared/config/db')

const DATA = {
  firstName: 'ศุภานิช',
  lastName: 'วงศ์เสริมสิน',
  firstNameEn: 'Supanich',
  lastNameEn: 'Wongsermsin',
  nationalId: '1103703898647',
  dateOfBirth: '24/12/2547',
  sex: 'F',
  phone: '0970520372',
  email: 'afternoon.haruka@gmail.com',
  university: 'มหาวิทยาลัยบูรพา',
  // 1x1 transparent PNG placeholder — รูปจริงค่อยอัพเดททีหลังถ้าจำเป็น
  idCardImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  idCardType: 'national_id'
}

async function main() {
  console.log('═══ Manual Register: ศุภานิช วงศ์เสริมสิน ═══\n')

  // รอ DB connect
  await new Promise((resolve, reject) => {
    if (passportConn.readyState === 1) return resolve()
    passportConn.once('connected', resolve)
    passportConn.once('error', reject)
    setTimeout(() => reject(new Error('DB connect timeout')), 15000)
  })
  console.log('✓ DB connected\n')

  // เช็คซ้ำ
  const existPre = await PreRegistration.findOne({ nationalId: DATA.nationalId }).lean()
  if (existPre) {
    console.log('⚠ PreRegistration มีอยู่แล้ว:')
    console.log(`  - ${existPre.firstName} ${existPre.lastName} (${existPre.email})`)
    console.log(`  - registered: ${existPre.createdAt}`)
    process.exit(0)
  }

  const existUser = await User.findOne({
    $or: [{ nationalId: DATA.nationalId }, { email: DATA.email }]
  }).lean()
  if (existUser) {
    console.log('⚠ User มีอยู่แล้ว:')
    console.log(`  - ${existUser.name} (${existUser.email})`)
    process.exit(0)
  }

  // Default password = ddmmyyyy
  const defaultPassword = DATA.dateOfBirth.replace(/\//g, '')

  // ─── สร้าง PreRegistration ───
  const reg = await PreRegistration.create({
    firstName: DATA.firstName,
    lastName: DATA.lastName,
    firstNameEn: DATA.firstNameEn,
    lastNameEn: DATA.lastNameEn,
    nationalId: DATA.nationalId,
    dateOfBirth: DATA.dateOfBirth,
    sex: DATA.sex,
    phone: DATA.phone,
    email: DATA.email,
    university: DATA.university,
    idCardImage: DATA.idCardImage,
    idCardType: DATA.idCardType,
    status: 'pending',
    ocrRawResponse: 'MANUAL_REGISTRATION — OCR service down (DO Gradient AI tier removed gpt-4o)'
  })
  console.log(`✓ PreRegistration created: ${reg._id}`)

  // ─── สร้าง User ───
  try {
    const user = await User.create({
      name: `${DATA.firstName} ${DATA.lastName}`,
      email: DATA.email,
      password: defaultPassword,
      phone: DATA.phone,
      nationalId: DATA.nationalId,
      dateOfBirth: DATA.dateOfBirth,
      sex: DATA.sex,
      firstName: DATA.firstName,
      lastName: DATA.lastName,
      university: DATA.university,
      authProvider: 'local',
      emailVerified: true, // skip verify email — admin ลงให้
      profileLocked: true,
      profileCompletedAt: new Date()
    })
    console.log(`✓ User created: ${user._id}`)
    console.log(`  email: ${user.email}`)
    console.log(`  password (raw): ${defaultPassword}`)
  } catch (e) {
    // rollback
    await PreRegistration.findByIdAndDelete(reg._id).catch(() => {})
    console.error('✗ User.create failed → rolled back PreReg')
    throw e
  }

  // ─── Auto-assign demo VISA ───
  try {
    const demoPkg = await Package.findOne({ isDemo: true }).lean()
    if (demoPkg) {
      const u = await User.findOne({ nationalId: DATA.nationalId }).select('_id').lean()
      const expires = new Date()
      expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
      await Activation.create({
        userId: u._id,
        packageId: demoPkg._id,
        expiresAt: expires,
        isActive: true,
        note: 'Auto: VISA ทดลองเรียนฟรี (manual register)'
      })
      console.log(`✓ Demo VISA assigned (${demoPkg.durationDays || 30} วัน)`)
    } else {
      console.log('— ไม่มี demo package, ข้าม')
    }
  } catch (e) {
    console.warn(`⚠ Demo VISA fail: ${e.message}`)
  }

  console.log('\n═══ สำเร็จ ═══')
  console.log(`Login: ${DATA.email} หรือ ${DATA.nationalId}`)
  console.log(`Password: ${defaultPassword}`)
  process.exit(0)
}

main().catch(e => {
  console.error('FATAL:', e.message)
  console.error(e.stack)
  process.exit(1)
})
