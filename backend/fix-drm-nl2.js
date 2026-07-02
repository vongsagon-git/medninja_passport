/**
 * Fix NL2 — กู้ bunnyDrmVideoId (round 2)
 * เพิ่ม normalize: OBGYN→OB, Cardiology ตัดเลข, Ped ตัดออก, VHD วงเล็บ
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI_LMS || process.env.MONGODB_URI
const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_DEMO_API_KEY = process.env.BUNNY_DEMO_API_KEY
const DRM_LIBRARY_ID = '626874'
const NODRM_LIBRARY_ID = '628424'

function normalize(title) {
  return title
    .replace(/^B\d+\s+/i, '')         // strip "B1 " prefix
    .replace(/\.mov$/i, '')             // strip .mov
    .replace(/[🚀🆕✓]/g, '')           // strip emoji
    .replace(/\bOBGYN\b/gi, 'OB')      // OBGYN → OB
    .replace(/\bOB\b/gi, 'OB')         // normalize OB
    .replace(/\bPed\s+/gi, '')          // strip "Ped "
    .replace(/\bCardiology\s+\d+\s*/gi, 'Cardiology ')  // "Cardiology 2 " → "Cardiology "
    .replace(/\bGI\s+\d+\s*/gi, 'GI ') // "GI 1 " → "GI "
    .replace(/\bNeuro\s+\d+\s*/gi, 'Neuro ') // "Neuro 1 " → "Neuro "
    .replace(/\bRheumatology\s+\d+\s*/gi, 'Rheumatology ')
    .replace(/\bSx\s+GI\s*-?\s*/gi, 'Sx ')  // "Sx GI - " → "Sx "
    .replace(/\bSx\s+Intestinal/gi, 'Sx Intestinal')
    .replace(/\bLabo\b/gi, 'Labor')     // "Labo" → "Labor" (truncated in DRM)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function main() {
  console.log('Connecting to DB...')
  const conn = await mongoose.createConnection(MONGODB_URI).asPromise()
  console.log('Connected!')

  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')
  const sections = await Section.find({ code: /^NL2/i }).lean()
  console.log(`Found ${sections.length} NL2 sections`)

  // DRM library
  console.log('\nFetching DRM library (626874)...')
  let drmVideos = []
  let page = 1, totalPages = 1
  while (page <= totalPages) {
    const res = await fetch(`https://video.bunnycdn.com/library/${DRM_LIBRARY_ID}/videos?page=${page}&itemsPerPage=100`, {
      headers: { AccessKey: BUNNY_API_KEY }
    })
    const data = await res.json()
    drmVideos = drmVideos.concat(data.items || [])
    totalPages = Math.ceil((data.totalItems || 0) / 100)
    page++
  }
  console.log(`Got ${drmVideos.length} DRM videos`)

  const drmByNormTitle = {}
  for (const v of drmVideos) {
    const key = normalize(v.title)
    if (!drmByNormTitle[key]) drmByNormTitle[key] = { guid: v.guid, title: v.title }
  }

  for (const section of sections) {
    if (!section.videos?.length) continue
    console.log(`\n--- Section: ${section.code} (${section.videos.length} videos) ---`)

    let changed = false, matchCount = 0, failCount = 0

    for (const video of section.videos) {
      if (!video.bunnyVideoId) continue

      const res = await fetch(`https://video.bunnycdn.com/library/${NODRM_LIBRARY_ID}/videos/${video.bunnyVideoId}`, {
        headers: { AccessKey: BUNNY_DEMO_API_KEY }
      })
      if (!res.ok) { console.log(`  ✗ "${video.title}" — API ${res.status}`); failCount++; continue }

      const info = await res.json()
      const bunnyTitle = info.title || ''
      const key = normalize(bunnyTitle)
      const match = drmByNormTitle[key]

      if (match) {
        if (video.bunnyDrmVideoId !== match.guid) {
          console.log(`  ✓ "${video.title}" → "${match.title}" → ${match.guid}`)
          video.bunnyDrmVideoId = match.guid
          changed = true
        } else {
          console.log(`  = "${video.title}" — OK`)
        }
        matchCount++
      } else {
        console.log(`  ✗ "${video.title}" → bunny: "${bunnyTitle}" (norm: "${key}") — NO MATCH`)
        failCount++
      }
    }

    console.log(`\n  Matched: ${matchCount}/${section.videos.length} | Failed: ${failCount}`)

    if (changed) {
      await Section.updateOne({ _id: section._id }, { $set: { videos: section.videos } })
      console.log(`  → SAVED!`)
    }
  }

  await conn.close()
  console.log('\n✅ Done!')
}

main().catch(err => { console.error('ERROR:', err); process.exit(1) })
