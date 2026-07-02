/**
 * Import MedNinja_USMLE_Flashcards_462.xlsx → FlashcardDDx
 * ลบข้อมูลเก่าทั้งหมด → import ใหม่จาก Buzzwords อย่างเดียว
 * จัดระเบียบ clue: แยก comma → บรรทัดละ keyword
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const XLSX = require('xlsx')
const { connectDB } = require('../shared/config/db')
const FlashcardDDx = require('../modules/flashcard/FlashcardDDx.model')

function formatClue(raw) {
  if (!raw) return ''
  // แยก comma → แต่ละบรรทัด, trim, ลบว่าง
  return raw.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => '• ' + s)
    .join('\n')
}

async function run() {
  await connectDB()
  console.log('Connected to DB')

  // ลบข้อมูลเก่าทั้งหมด
  const deleted = await FlashcardDDx.deleteMany({})
  console.log(`Deleted ${deleted.deletedCount} old cards`)

  const wb = XLSX.readFile(path.join(__dirname, '../../../MedNinja_USMLE_Flashcards_462.xlsx'))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws)
  console.log(`Read ${rows.length} rows from Excel`)

  const docs = []
  for (const row of rows) {
    const ddx = (row['Disease / Condition'] || '').trim()
    const buzzwords = (row['USMLE Buzzwords / Keywords'] || '').trim()
    const order = row['#'] || 0

    if (!ddx) continue

    docs.push({
      ddx,
      ddxTh: '',
      relatedCC: [],
      clue: formatClue(buzzwords),
      history: '',
      pe: '',
      investigation: '',
      category: '',
      order,
      isActive: true
    })
  }

  await FlashcardDDx.insertMany(docs)
  console.log(`Inserted ${docs.length} cards`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
