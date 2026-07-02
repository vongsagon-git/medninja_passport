require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sec = await Section.findOne({ code: /^NL2/i }).lean()

  // ลบ duplicate โดยเช็ค bunnyVideoId
  const seen = new Set()
  const unique = []
  for (const v of sec.videos) {
    const key = v.bunnyVideoId || `${v.topic}|${v.subtopic}|${v.title}`
    if (seen.has(key)) {
      console.log(`ลบ duplicate: "${v.title}" (${v.bunnyVideoId})`)
    } else {
      seen.add(key)
      unique.push(v)
    }
  }

  unique.forEach((v, i) => { v.order = i })
  console.log(`\nBefore: ${sec.videos.length} → After: ${unique.length}`)

  await Section.updateOne({ _id: sec._id }, { $set: { videos: unique } })
  console.log('✅ Saved!')
  await conn.close()
}

main().catch(console.error)
