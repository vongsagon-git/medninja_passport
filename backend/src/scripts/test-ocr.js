/**
 * ทดสอบ OCR accuracy — ส่งรูปตัวอย่าง 7 ใบเข้า DO Gradient AI
 * เทียบผลกับ ground truth ที่ Claude Opus อ่านได้
 *
 * Usage: node backend/src/scripts/test-ocr.js
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const { scanIdCard } = require('../modules/passport/ocr.service')

// Ground truth จาก Claude Opus 4.6 อ่านเอง
const SAMPLES = [
  {
    file: '552000014648101.jpg',
    type: 'บัตรประชาชน (เอียง, ถือมือ)',
    expected: { nationalId: '1101401166838', dateOfBirth: '30/01/2531', firstName: 'ศตาเมศ', lastName: 'เรืองธุรกิจ' }
  },
  {
    file: '555000009077401.jpg',
    type: 'บัตรประชาชน (ชัด)',
    expected: { nationalId: '3301000145788', dateOfBirth: '08/05/2492', firstName: 'ฐิตินันท์', lastName: 'แก้วจันทรานนท์' }
  },
  {
    file: '07E49BE4-4755-41FB-AA29-08F02CA8221C.jpeg',
    type: 'บัตรประชาชน (มืด, เอียง)',
    expected: { nationalId: '1610100065743', dateOfBirth: '26/07/2531', firstName: 'จิรศักดิ์', lastName: 'สิงห์ชัย' }
  },
  {
    file: 'FAY6YgMVEAg9Kna.jpg',
    type: 'บัตรประชาชน (ชัดมาก)',
    expected: { nationalId: '1720900255678', dateOfBirth: '19/05/2543', firstName: 'กาญจนา', lastName: 'แผนสมบูรณ์' }
  },
  {
    file: 'qkn6ctpqayUcV1JlrSl-o.jpg',
    type: 'บัตรประชาชน (ชัด, ตรง)',
    expected: { nationalId: '1409700121865', dateOfBirth: '10/09/2537', firstName: 'รัชนิกร', lastName: 'ชนะพันธ์' }
  },
  {
    file: 'image2.jpg',
    type: 'พาสปอร์ต (ชัด, MRZ ชัด) — เลขปลอม checksum ไม่ผ่าน',
    expected: { nationalId: '0012345678913', dateOfBirth: '10/07/2536', firstName: 'มัณฑนิฎาส์', lastName: 'โปษณะสวัสดิ์วงศ์', checksumFail: true }
  },
  {
    file: 'passport-thai-mrp.jpg',
    type: 'พาสปอร์ต (เบลอ, ถ่ายจากหน้าจอ)',
    expected: { nationalId: '3100601111111', dateOfBirth: '01/05/2518', firstName: 'สิริกร', lastName: 'สุทธิวรรณ' }
  }
]

const SAMPLE_DIR = path.join(__dirname, '../../../ตัวอย่าง บัตรประชาชน และ พาสปอต')

function compare(field, expected, actual) {
  if (!actual) return '❌ ไม่มีค่า'
  if (expected === actual) return '✅'
  return `❌ ได้ "${actual}" (คาด "${expected}")`
}

async function runTest() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  OCR Accuracy Test — DO Gradient AI (GPT-4o)')
  console.log('  เทียบกับ Claude Opus 4.6 ground truth')
  console.log('═══════════════════════════════════════════════════\n')

  let pass = 0, fail = 0, total = 0

  for (const sample of SAMPLES) {
    const filePath = path.join(SAMPLE_DIR, sample.file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ไม่พบไฟล์: ${sample.file}\n`)
      continue
    }

    const buffer = fs.readFileSync(filePath)
    const ext = sample.file.split('.').pop().toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

    console.log(`─── ${sample.file} ───`)
    console.log(`ประเภท: ${sample.type}`)

    try {
      const result = await scanIdCard(buffer, mimeType)

      if (!result.success) {
        // checksum fail expected?
        if (sample.expected.checksumFail) {
          console.log(`ผลลัพธ์: ❌ error (คาดว่า checksum fail) → ✅ ถูกต้อง`)
          console.log(`ข้อความ: ${result.error}`)

          // ดูว่าอ่านเลขถูกไหม ก่อน checksum reject
          if (result.data?.nationalId) {
            const nidMatch = result.data.nationalId.replace(/\D/g, '') === sample.expected.nationalId
            console.log(`เลขที่อ่านได้: ${result.data.nationalId} ${nidMatch ? '✅ ตรง' : '❌ ไม่ตรง'}`)
          }
          pass++
        } else {
          console.log(`ผลลัพธ์: ❌ FAIL — ${result.error}`)
          fail++
        }
        total++
        console.log()
        continue
      }

      const d = result.data
      const checks = {
        nationalId: compare('nationalId', sample.expected.nationalId, d.nationalId),
        dateOfBirth: compare('dateOfBirth', sample.expected.dateOfBirth, d.dateOfBirth),
        firstName: compare('firstName', sample.expected.firstName, d.firstName),
        lastName: compare('lastName', sample.expected.lastName, d.lastName)
      }

      const allPass = Object.values(checks).every(v => v === '✅')
      if (allPass) pass++; else fail++
      total++

      console.log(`ผลลัพธ์: ${allPass ? '✅ PASS' : '❌ FAIL'}`)
      console.log(`  เลขบัตร:  ${checks.nationalId}  (${d.nationalId})`)
      console.log(`  วันเกิด:  ${checks.dateOfBirth}  (${d.dateOfBirth})`)
      console.log(`  ชื่อ:     ${checks.firstName}  (${d.firstName})`)
      console.log(`  นามสกุล:  ${checks.lastName}  (${d.lastName})`)
      if (d.firstNameEn) console.log(`  ชื่อ EN:  ${d.firstNameEn} ${d.lastNameEn}`)

    } catch (err) {
      console.log(`ผลลัพธ์: 💥 ERROR — ${err.message}`)
      fail++
      total++
    }

    console.log()
  }

  console.log('═══════════════════════════════════════════════════')
  console.log(`  สรุป: ${pass}/${total} ผ่าน | ${fail}/${total} ไม่ผ่าน`)
  console.log(`  ความแม่น: ${total > 0 ? ((pass / total * 100).toFixed(0)) : 0}%`)
  console.log('═══════════════════════════════════════════════════')
}

runTest().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
