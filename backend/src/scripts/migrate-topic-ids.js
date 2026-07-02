/**
 * Migration: เติม topicId/subtopicId ให้ video ที่ยังไม่มี
 * ใช้ครั้งแรกหลัง deploy Self Check system
 *
 * Usage:
 *   node backend/src/scripts/migrate-topic-ids.js [--dry-run]
 *
 * - กลุ่ม video ตาม `topic` (name) ใน section เดียวกัน → ได้ topicId เดียวกัน
 * - กลุ่มตาม `topic + subtopic` → ได้ subtopicId เดียวกัน
 * - ถ้ามี topicId อยู่แล้ว → ไม่แตะ
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const crypto = require('crypto')
const { connectDB, lmsConn } = require('../shared/config/db')
const Section = require('../modules/content/Section.model')

const DRY_RUN = process.argv.includes('--dry-run')

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`
}

async function run() {
  await connectDB()
  console.log(`[migrate-topic-ids] ${DRY_RUN ? '🧪 DRY RUN' : '🔥 LIVE'} mode`)

  const sections = await Section.find().lean()
  console.log(`[migrate-topic-ids] ${sections.length} sections to scan`)

  let updatedSections = 0
  let updatedVideos = 0

  for (const sec of sections) {
    const topicNameToId = {}
    const subKeyToId = {}
    let changed = false

    // pass 1: collect existing IDs
    for (const v of (sec.videos || [])) {
      const t = (v.topic || '').trim()
      const s = (v.subtopic || '').trim()
      if (t && v.topicId && !topicNameToId[t]) topicNameToId[t] = v.topicId
      if (t && s && v.subtopicId && !subKeyToId[`${t}|${s}`]) subKeyToId[`${t}|${s}`] = v.subtopicId
    }

    // pass 2: assign missing
    for (const v of (sec.videos || [])) {
      const t = (v.topic || '').trim()
      const s = (v.subtopic || '').trim()
      if (t && !v.topicId) {
        if (!topicNameToId[t]) topicNameToId[t] = genId('tpc')
        v.topicId = topicNameToId[t]
        changed = true
        updatedVideos++
      }
      if (t && s && !v.subtopicId) {
        const k = `${t}|${s}`
        if (!subKeyToId[k]) subKeyToId[k] = genId('sub')
        v.subtopicId = subKeyToId[k]
        changed = true
      }
    }

    if (changed) {
      updatedSections++
      if (!DRY_RUN) {
        await Section.updateOne({ _id: sec._id }, { videos: sec.videos })
      }
      console.log(`  ✓ ${sec.code} — ${(sec.videos || []).filter(v => v.topicId).length} videos with topicId`)
    }
  }

  console.log(`\n[migrate-topic-ids] ✅ Done`)
  console.log(`  • Sections updated: ${updatedSections}`)
  console.log(`  • Videos assigned new topicId: ${updatedVideos}`)
  console.log(`  • Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`)

  process.exit(0)
}

run().catch(err => {
  console.error('[migrate-topic-ids] ❌ ERROR:', err)
  process.exit(1)
})
