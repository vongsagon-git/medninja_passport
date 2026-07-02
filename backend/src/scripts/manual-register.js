/**
 * Manual register — ลงทะเบียน Passport ตรง DB (เลี่ยง OCR)
 * เหตุผล: DO Gradient AI tier ถูกตัด (gpt-4o หาย) → /api/passport/scan พัง
 *
 * Run: node backend/src/scripts/manual-register.js <json-file>
 * Example: node backend/src/scripts/manual-register.js backend/src/scripts/_input.json
 *
 * JSON schema:
 * {
 *   "firstName": "ชื่อไทย",
 *   "lastName": "นามสกุลไทย",
 *   "firstNameEn": "FirstEn",
 *   "lastNameEn": "LastEn",
 *   "nationalId": "1234567890123",
 *   "dateOfBirth": "dd/mm/yyyy (พ.ศ.)",
 *   "sex": "M" | "F",
 *   "phone": "08xxxxxxxx",
 *   "email": "x@y.z",
 *   "university": "ชื่อมหาลัย",
 *   "idCardPath": "C:/path/to/idcard.jpg"
 * }
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const fs = require('fs')

const PreRegistration = require('../modules/preregister/PreRegistration.model')
const User = require('../modules/user/User.model')
const Activation = require('../modules/activation/Activation.model')
const Package = require('../modules/content/Package.model')
const { validateNationalId } = require('../modules/passport/validation')
const { passportConn } = require('../shared/config/db')

async function main() {
  const inputFile = process.argv[2]
  if (!inputFile || !fs.existsSync(inputFile)) {
    console.error('Usage: node manual-register.js <json-file>')
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'))
  console.log(`═══ Manual Register: ${data.firstName} ${data.lastName} ═══\n`)

  // Validate NID
  const nidResult = validateNationalId(data.nationalId)
  if (!nidResult.valid) {
    console.error(`✗ NID invalid: ${nidResult.error}`)
    process.exit(1)
  }
  const cleanNid = nidResult.cleaned

  // Encode image
  if (!fs.existsSync(data.idCardPath)) {
    console.error(`✗ ไม่พบรูปบัตร: ${data.idCardPath}`)
    process.exit(1)
  }
  const ext = path.extname(data.idCardPath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
  const buffer = fs.readFileSync(data.idCardPath)
  const idCardImage = `data:${mime};base64,${buffer.toString('base64')}`
  console.log(`✓ อ่านรูป: ${Math.round(buffer.length / 1024)} KB`)

  // รอ DB connect
  await new Promise((resolve, reject) => {
    if (passportConn.readyState === 1) return resolve()
    passportConn.once('connected', resolve)
    passportConn.once('error', reject)
    setTimeout(() => reject(new Error('DB connect timeout')), 15000)
  })
  console.log('✓ DB connected')

  const emailClean = data.email.trim().toLowerCase()

  // เช็คซ้ำ
  const existPre = await PreRegistration.findOne({ nationalId: cleanNid }).lean()
  if (existPre) {
    console.log(`⚠ PreRegistration มีอยู่แล้ว: ${existPre.firstName} ${existPre.lastName} (${existPre.email})`)
    process.exit(0)
  }
  const existUser = await User.findOne({
    $or: [{ nationalId: cleanNid }, { email: emailClean }]
  }).lean()
  if (existUser) {
    console.log(`⚠ User มีอยู่แล้ว: ${existUser.name} (${existUser.email})`)
    process.exit(0)
  }

  const defaultPassword = data.dateOfBirth.replace(/\//g, '')

  const reg = await PreRegistration.create({
    firstName: data.firstName,
    lastName: data.lastName,
    firstNameEn: data.firstNameEn || '',
    lastNameEn: data.lastNameEn || '',
    nationalId: cleanNid,
    dateOfBirth: data.dateOfBirth,
    sex: ['M', 'F'].includes(data.sex) ? data.sex : '',
    phone: data.phone,
    email: emailClean,
    university: data.university,
    idCardImage,
    idCardType: 'national_id',
    status: 'pending',
    ocrRawResponse: 'MANUAL_REGISTRATION — OCR service down (DO Gradient AI tier removed)'
  })
  console.log(`✓ PreRegistration: ${reg._id}`)

  try {
    const user = await User.create({
      name: `${data.firstName} ${data.lastName}`,
      email: emailClean,
      password: defaultPassword,
      phone: data.phone,
      nationalId: cleanNid,
      dateOfBirth: data.dateOfBirth,
      sex: ['M', 'F'].includes(data.sex) ? data.sex : '',
      firstName: data.firstName,
      lastName: data.lastName,
      university: data.university,
      authProvider: 'local',
      emailVerified: true,
      profileLocked: true,
      profileCompletedAt: new Date()
    })
    console.log(`✓ User: ${user._id}`)
  } catch (e) {
    await PreRegistration.findByIdAndDelete(reg._id).catch(() => {})
    console.error('✗ User.create failed → rolled back PreReg:', e.message)
    process.exit(1)
  }

  // Demo VISA
  try {
    const demoPkg = await Package.findOne({ isDemo: true }).lean()
    if (demoPkg) {
      const u = await User.findOne({ nationalId: cleanNid }).select('_id').lean()
      const expires = new Date()
      expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
      await Activation.create({
        userId: u._id,
        packageId: demoPkg._id,
        expiresAt: expires,
        isActive: true,
        note: 'Auto: VISA ทดลองเรียนฟรี (manual register)'
      })
      console.log(`✓ Demo VISA: ${demoPkg.durationDays || 30} วัน`)
    }
  } catch (e) {
    console.warn(`⚠ Demo VISA fail: ${e.message}`)
  }

  console.log(`\n═══ สำเร็จ ═══`)
  console.log(`Login: ${emailClean} หรือ ${cleanNid}`)
  console.log(`Password: ${defaultPassword}`)
  process.exit(0)
}

main().catch(e => {
  console.error('FATAL:', e.message)
  console.error(e.stack)
  process.exit(1)
})
