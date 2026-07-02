/**
 * ลบ topicPdfMap / subtopicPdfMap entries ที่ไม่มี video อยู่ใน topic/subtopic นั้นแล้ว
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sections = await Section.find({}).lean()
  let fixed = 0

  for (const sec of sections) {
    const activeTopics = new Set((sec.videos || []).map(v => (v.topic || '').trim()).filter(Boolean))
    const activeSubs = new Set((sec.videos || []).map(v => (v.subtopic || '').trim()).filter(Boolean))

    const tMap = sec.topicPdfMap || {}
    const stMap = sec.subtopicPdfMap || {}
    let changed = false

    // ลบ topic ที่ไม่มี video
    const cleanedT = {}
    for (const [k, v] of Object.entries(tMap)) {
      if (activeTopics.has(k)) {
        cleanedT[k] = v
      } else {
        console.log(`  ${sec.code}: ลบ topicPdfMap["${k}"] = "${v}" (ไม่มี video แล้ว)`)
        changed = true
      }
    }

    // ลบ subtopic ที่ไม่มี video
    const cleanedSt = {}
    for (const [k, v] of Object.entries(stMap)) {
      if (activeSubs.has(k)) {
        cleanedSt[k] = v
      } else {
        console.log(`  ${sec.code}: ลบ subtopicPdfMap["${k}"] = "${v}" (ไม่มี video แล้ว)`)
        changed = true
      }
    }

    if (changed) {
      await Section.updateOne({ _id: sec._id }, { $set: { topicPdfMap: cleanedT, subtopicPdfMap: cleanedSt } })
      fixed++
    }
  }

  console.log(`\n✅ Fixed ${fixed} sections`)
  await conn.close()
}

main().catch(console.error)
