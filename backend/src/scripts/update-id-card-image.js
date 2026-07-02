/**
 * อัพรูปบัตรใส่ PreRegistration record (ตามเลข NID)
 *
 * Run: node backend/src/scripts/update-id-card-image.js <NID> <imagePath>
 * Example: node backend/src/scripts/update-id-card-image.js 1103703898647 "C:/path/to/idcard.jpg"
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const fs = require('fs')
const PreRegistration = require('../modules/preregister/PreRegistration.model')
const { passportConn } = require('../shared/config/db')

async function main() {
  const [nid, imagePath] = process.argv.slice(2)
  if (!nid || !imagePath) {
    console.error('Usage: node update-id-card-image.js <NID> <imagePath>')
    process.exit(1)
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`✗ ไม่พบไฟล์: ${imagePath}`)
    process.exit(1)
  }

  // รอ DB connect
  await new Promise((resolve, reject) => {
    if (passportConn.readyState === 1) return resolve()
    passportConn.once('connected', resolve)
    passportConn.once('error', reject)
    setTimeout(() => reject(new Error('DB connect timeout')), 15000)
  })

  const ext = path.extname(imagePath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
  const buffer = fs.readFileSync(imagePath)
  const base64 = buffer.toString('base64')
  const dataUri = `data:${mime};base64,${base64}`

  const sizeKB = Math.round(buffer.length / 1024)
  console.log(`อ่านรูป: ${imagePath} (${sizeKB} KB, ${mime})`)

  const reg = await PreRegistration.findOneAndUpdate(
    { nationalId: nid },
    { idCardImage: dataUri },
    { new: true }
  )

  if (!reg) {
    console.error(`✗ ไม่พบ PreRegistration nationalId=${nid}`)
    process.exit(1)
  }

  console.log(`✓ อัพรูปบัตรให้ ${reg.firstName} ${reg.lastName} (${reg.email}) สำเร็จ`)
  process.exit(0)
}

main().catch(e => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
