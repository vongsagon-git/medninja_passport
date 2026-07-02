require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sec = await Section.findOne({ code: /^NL2/i }).lean()

  const oldTopics = ['Internal Medicine - GI', 'Internal Medicine - ID', 'Internal Medicine - Neuro', 'Internal Medicine - Rheumatology', 'Internal Medicine - Respiratory']

  for (const t of oldTopics) {
    const vids = (sec.videos || []).filter(v => v.topic === t)
    console.log(`\n=== ${t} (${vids.length} videos) ===`)
    for (const v of vids) {
      console.log(`  ${v.title || '(เปล่า)'} | UUID: ${v.bunnyVideoId || '-'} | DRM: ${v.bunnyDrmVideoId || '-'}`)
    }
  }

  await conn.close()
}

main().catch(console.error)
