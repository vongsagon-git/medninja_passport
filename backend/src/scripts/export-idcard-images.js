/**
 * Export idCardImage base64 → .jpg files
 *   node src/scripts/export-idcard-images.js
 *
 * Output: _idcards/{userId}.jpg + _idcards/manifest.json
 * (folder อยู่ที่ project root ของ passport, ขึ้นต้น _ = ไม่ push git)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const fs = require('fs')
const path = require('path')
const { passportConn, connectDB } = require('../shared/config/db')
const PreRegistration = require('../modules/preregister/PreRegistration.model')
const User = require('../modules/user/User.model')

const OUT_DIR = path.join(__dirname, '../../../_idcards')

;(async () => {
  await connectDB()
  console.log('MongoDB connected')

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const preRegs = await PreRegistration.find({ idCardImage: { $exists: true, $ne: '' } })
    .select('nationalId firstName lastName idCardImage idCardType')
    .lean()

  const manifest = []
  let exported = 0
  let skipped = 0
  let noStudent = 0

  for (const p of preRegs) {
    // match student by nationalId + role=student + no address
    const user = await User.findOne({
      role: 'student',
      nationalId: p.nationalId
    }).select('_id name firstName lastName address').lean()

    if (!user) { noStudent++; continue }
    if (user.address) { skipped++; continue }  // มี address แล้ว ไม่ export

    // parse data URI: data:image/jpeg;base64,xxx
    const m = p.idCardImage.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!m) {
      console.log(`  skip ${user._id} — invalid image format`)
      continue
    }
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
    const buf = Buffer.from(m[2], 'base64')

    const fileName = `${user._id}.${ext}`
    const filePath = path.join(OUT_DIR, fileName)
    fs.writeFileSync(filePath, buf)

    manifest.push({
      userId: String(user._id),
      file: fileName,
      nationalId: p.nationalId,
      idCardType: p.idCardType || 'national_id',
      nameTh: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '',
      sizeKB: Math.round(buf.length / 1024)
    })
    exported++
    if (exported % 20 === 0) console.log(`  exported ${exported}...`)
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  )

  console.log('')
  console.log(`✓ exported:      ${exported}`)
  console.log(`  skipped (has address): ${skipped}`)
  console.log(`  no student:    ${noStudent}`)
  console.log(`  manifest:      ${path.join(OUT_DIR, 'manifest.json')}`)
  console.log('')

  await passportConn.close()
  process.exit(0)
})().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
