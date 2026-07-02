require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')
  const Package = conn.model('Package', new mongoose.Schema({}, { strict: false }), 'packages')

  const pkg = await Package.findOne({ title: /NL2 FULL/i }).lean()
  if (!pkg) {
    console.log('NL2 FULL package not found — fall back to all sections starting with NL2')
    const sections = await Section.find({ code: /^NL2/i }).select('code name').lean()
    for (const s of sections) console.log('  ', s.code, '—', s.name)
    await conn.close()
    return
  }

  console.log('=== Package NL2 FULL ===')
  console.log('  id:', pkg._id.toString())
  console.log('  title:', pkg.title)
  console.log('  sections:', (pkg.sections || []).length)

  const sections = await Section.find({ _id: { $in: pkg.sections || [] } }).lean()
  for (const sec of sections) {
    console.log(`\n=== Section: ${sec.code} — ${sec.name} ===`)
    console.log(`   videos: ${(sec.videos || []).length}`)

    const topicCount = {}
    for (const v of (sec.videos || [])) {
      const t = v.topic || '(no topic)'
      if (!topicCount[t]) topicCount[t] = { count: 0, withPdf: 0, pdfs: new Set() }
      topicCount[t].count++
      if (v.pdfFile) {
        topicCount[t].withPdf++
        topicCount[t].pdfs.add(v.pdfFile)
      }
    }
    console.log('   Topics:')
    for (const [t, info] of Object.entries(topicCount)) {
      console.log(`     - ${t}: ${info.count} videos, PDFs:`)
      for (const p of info.pdfs) console.log(`         · ${p}`)
    }

    console.log('   topicPdfMap:')
    for (const [k, v] of Object.entries(sec.topicPdfMap || {})) {
      console.log(`     - "${k}" → ${v}`)
    }
    console.log('   subtopicPdfMap:')
    for (const [k, v] of Object.entries(sec.subtopicPdfMap || {})) {
      console.log(`     - "${k}" → ${v}`)
    }
  }

  await conn.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
