/**
 * NL2 — จัดโครงสร้างใหม่
 * 1. ย้าย video จาก topic เก่า → Internal Medicine subtopic / Surgery subtopic
 * 2. ลบ video เปล่า (ไม่มี title + ไม่มี UUID)
 * 3. ย้าย topicPdfMap → subtopicPdfMap
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sec = await Section.findOne({ code: /^NL2/i }).lean()
  console.log(`Before: ${sec.videos.length} videos\n`)

  // === 1. ย้าย topic เก่า → subtopic ===
  const moveMap = {
    'Internal Medicine - GI': { topic: 'Internal Medicine', subtopic: 'GI' },
    'Internal Medicine - ID': { topic: 'Internal Medicine', subtopic: 'ID' },
    'Internal Medicine - Neuro': { topic: 'Internal Medicine', subtopic: 'Neuro' },
    'Internal Medicine - Rheumatology': { topic: 'Internal Medicine', subtopic: 'Rheumatology' },
    'Internal Medicine - Respiratory': { topic: 'Internal Medicine', subtopic: 'Respiratory' },
    'Surgery - Breast': { topic: 'Surgery', subtopic: 'Breast' },
    'Surgery - Vascular': { topic: 'Surgery', subtopic: 'Vascular' },
    'Surgery - GI': { topic: 'Surgery', subtopic: 'GI' },
    'Surgery - Neck': { topic: 'Surgery', subtopic: 'Neck' },
  }

  for (const v of sec.videos) {
    const m = moveMap[v.topic]
    if (m) {
      console.log(`  ย้าย "${v.title}" : ${v.topic} → ${m.topic} > ${m.subtopic}`)
      v.topic = m.topic
      v.subtopic = m.subtopic
    }
  }

  // === 2. ลบ video เปล่า ===
  const before = sec.videos.length
  sec.videos = sec.videos.filter(v => v.title || v.bunnyVideoId)
  console.log(`\n  ลบ video เปล่า: ${before - sec.videos.length} ตัว`)

  // === 3. จัดลำดับ — Internal Medicine subtopics เรียงตาม Hematology, Endocrine, Cardiology, GI, ID, Neuro, Rheumatology, Respiratory ===
  const subOrder = {
    'Internal Medicine': ['Hematology', 'Endocrine', 'Cardiology', 'GI', 'ID', 'Neuro', 'Rheumatology', 'Respiratory'],
    'OBGYN': ['OB', 'Gyne'],
    'Surgery': ['Breast', 'Vascular', 'GI', 'Neck'],
  }
  const topicOrder = ['Internal Medicine', 'OBGYN', 'Surgery', 'Pediatrics']

  const sorted = []
  for (const t of topicOrder) {
    const subs = subOrder[t] || ['']
    for (const s of subs) {
      const vids = sec.videos.filter(v => v.topic === t && (v.subtopic || '') === s)
      sorted.push(...vids)
    }
    // video ที่ไม่มี subtopic (เช่น Pediatrics)
    if (!subOrder[t]) {
      const vids = sec.videos.filter(v => v.topic === t)
      sorted.push(...vids)
    }
  }
  // เหลือที่ไม่ match
  const sortedIds = new Set(sorted.map(v => v.bunnyVideoId || v.title))
  for (const v of sec.videos) {
    const key = v.bunnyVideoId || v.title
    if (!sortedIds.has(key)) sorted.push(v)
  }

  // อัปเดต order
  sorted.forEach((v, i) => { v.order = i })

  // === 4. ย้าย topicPdfMap → subtopicPdfMap ===
  const tMap = sec.topicPdfMap instanceof Map ? Object.fromEntries(sec.topicPdfMap) : (sec.topicPdfMap || {})
  const stMap = sec.subtopicPdfMap instanceof Map ? Object.fromEntries(sec.subtopicPdfMap) : (sec.subtopicPdfMap || {})

  const pdfMoveMap = {
    'Internal Medicine - GI': 'GI',
    'Internal Medicine - ID': 'ID',
    'Internal Medicine - Neuro': 'Neuro',
    'Internal Medicine - Rheumatology': 'Rheumatology',
    'Surgery - Vascular': 'Vascular',
  }

  const newTopicPdfMap = {}
  for (const [k, v] of Object.entries(tMap)) {
    if (pdfMoveMap[k]) {
      console.log(`  PDF: topicPdfMap["${k}"] → subtopicPdfMap["${pdfMoveMap[k]}"] = ${v}`)
      stMap[pdfMoveMap[k]] = v
    } else {
      // เช็คว่า topic ยังมีอยู่ไหม
      const exists = sorted.some(vi => vi.topic === k)
      if (exists) newTopicPdfMap[k] = v
      else console.log(`  PDF: ลบ topicPdfMap["${k}"] (orphan)`)
    }
  }

  console.log(`\nAfter: ${sorted.length} videos`)
  console.log(`topicPdfMap: ${JSON.stringify(newTopicPdfMap)}`)
  console.log(`subtopicPdfMap: ${JSON.stringify(stMap)}`)

  // === 5. Save ===
  await Section.updateOne({ _id: sec._id }, {
    $set: {
      videos: sorted,
      topicPdfMap: newTopicPdfMap,
      subtopicPdfMap: stMap
    }
  })

  console.log('\n✅ Saved!')
  await conn.close()
}

main().catch(err => { console.error('ERROR:', err); process.exit(1) })
