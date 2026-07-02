require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI_LMS || process.env.MONGODB_URI

async function main() {
  const conn = await mongoose.createConnection(MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sections = await Section.find({ code: /^NL2/i }).lean()
  for (const section of sections) {
    console.log(`\n=== ${section.code} — ${section.title} (${section.videos?.length || 0} videos) ===\n`)
    console.log('# | Title | bunnyVideoId (noDRM) | bunnyDrmVideoId')
    console.log('--|-------|---------------------|----------------')
    for (let i = 0; i < (section.videos || []).length; i++) {
      const v = section.videos[i]
      console.log(`${i+1} | ${v.title} | ${v.bunnyVideoId || '-'} | ${v.bunnyDrmVideoId || 'EMPTY'}`)
    }
  }
  await conn.close()
}

main().catch(console.error)
