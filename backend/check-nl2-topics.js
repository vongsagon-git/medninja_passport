require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sec = await Section.findOne({ code: /^NL2/i }).lean()

  // นับ video per topic
  const topicCount = {}
  for (const v of (sec.videos || [])) {
    const t = v.topic || '(ไม่มี topic)'
    topicCount[t] = (topicCount[t] || 0) + 1
  }

  console.log('=== NL2 Topics ===')
  for (const [t, count] of Object.entries(topicCount)) {
    const hasUuid = (sec.videos || []).filter(v => v.topic === t && v.bunnyVideoId).length
    console.log(`  ${t}: ${count} videos (${hasUuid} มี UUID)`)
  }

  console.log('\n=== topicPdfMap ===')
  const tMap = sec.topicPdfMap || {}
  for (const [k, v] of Object.entries(tMap)) {
    const exists = topicCount[k] ? '✓' : '✗ ORPHAN'
    console.log(`  ${exists} "${k}" → ${v}`)
  }

  console.log('\n=== subtopicPdfMap ===')
  const stMap = sec.subtopicPdfMap || {}
  for (const [k, v] of Object.entries(stMap)) {
    const exists = (sec.videos || []).some(vi => vi.subtopic === k) ? '✓' : '✗ ORPHAN'
    console.log(`  ${exists} "${k}" → ${v}`)
  }

  // เช็คว่ามี topic เปล่าไหม (มีแค่ 1 video ที่ไม่มี title/UUID)
  console.log('\n=== Video เปล่า (ไม่มี title + ไม่มี UUID) ===')
  for (const v of (sec.videos || [])) {
    if (!v.title && !v.bunnyVideoId) {
      console.log(`  topic="${v.topic}" subtopic="${v.subtopic}"`)
    }
  }

  await conn.close()
}

main().catch(console.error)
