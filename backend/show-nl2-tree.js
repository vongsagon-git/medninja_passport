require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const sec = await Section.findOne({ code: /^NL2/i }).lean()
  console.log(`=== ${sec.code} — ${sec.name} (${sec.videos?.length || 0} videos) ===\n`)

  let currentTopic = null
  let currentSub = null
  let idx = 0

  for (const v of (sec.videos || [])) {
    const t = v.topic || ''
    const s = v.subtopic || ''

    if (t !== currentTopic) {
      currentTopic = t
      currentSub = null
      console.log(`\n📁 ${t || '(root)'}`)
    }
    if (s && s !== currentSub) {
      currentSub = s
      console.log(`  📂 ${s}`)
    }

    idx++
    const title = v.title || '(เปล่า)'
    const uuid = v.bunnyVideoId ? '✓' : '✗'
    const drm = v.bunnyDrmVideoId ? '✓' : '✗'
    const prefix = s ? '      ' : '    '
    console.log(`${prefix}${idx}. ${title}  [UUID:${uuid} DRM:${drm}]`)
  }

  await conn.close()
}

main().catch(console.error)
