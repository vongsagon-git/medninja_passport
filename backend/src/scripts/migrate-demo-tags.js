#!/usr/bin/env node
/**
 * Migrate Demo Package + Demo Section — Phase A
 *
 * ทำ 4 อย่าง (idempotent — รันซ้ำได้):
 *   1. Force Demo package fields: durationDays=7, live/ai/orient = disabled
 *   2. Force Section code = DEMO-TRIAL (ถ้ายังไม่ใช่)
 *   3. Set videos.demoTags = ['all'] ให้ทุก video ที่ยังไม่มี tag
 *   4. Strip PDF/bonus/tier ออกจากทุก video + clear pdf maps
 *
 * Usage:
 *   node src/scripts/migrate-demo-tags.js         # dry-run (default = แค่รายงาน)
 *   node src/scripts/migrate-demo-tags.js --apply # apply จริง
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const mongoose = require('mongoose')

const APPLY = process.argv.includes('--apply')

async function main() {
  const uri = process.env.MONGODB_URI_LMS || process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ ไม่พบ MONGODB_URI_LMS หรือ MONGODB_URI ใน .env')
    process.exit(1)
  }

  console.log(`\n${APPLY ? '🚀 APPLY MODE' : '🔍 DRY-RUN MODE'} — connecting to DB...`)
  const conn = await mongoose.createConnection(uri).asPromise()
  console.log(`   ✓ ${conn.host}/${conn.name}\n`)

  const packages = conn.db.collection('packages')
  const sections = conn.db.collection('sections')

  // ─── 1. หา Demo package ───
  const demoPkg = await packages.findOne({ isDemo: true })
  if (!demoPkg) {
    console.error('❌ ไม่พบ Demo package (isDemo=true) — abort')
    process.exit(1)
  }
  console.log(`✅ Demo package: "${demoPkg.title}" (${demoPkg._id})`)
  console.log(`   sections: ${(demoPkg.sections || []).length}, durationDays: ${demoPkg.durationDays}\n`)

  // ─── 2. Force clean Demo package fields ───
  const pkgUpdate = {}
  if (demoPkg.durationDays !== 7) pkgUpdate.durationDays = 7
  if (demoPkg.liveEnabled) pkgUpdate.liveEnabled = false
  if (demoPkg.aiEnabled) pkgUpdate.aiEnabled = false
  if (demoPkg.aiInfo) pkgUpdate.aiInfo = ''
  if (demoPkg.orientBunnyDrmVideoId) pkgUpdate.orientBunnyDrmVideoId = ''
  if (demoPkg.orientBunnyNoDrmVideoId) pkgUpdate.orientBunnyNoDrmVideoId = ''
  if (demoPkg.orientAliVideoId) pkgUpdate.orientAliVideoId = ''

  if (Object.keys(pkgUpdate).length) {
    console.log(`📦 Package needs update:`, pkgUpdate)
    if (APPLY) {
      await packages.updateOne({ _id: demoPkg._id }, { $set: pkgUpdate })
      console.log(`   ✓ applied\n`)
    } else {
      console.log(`   (dry-run — not applied)\n`)
    }
  } else {
    console.log(`📦 Package fields already clean ✓\n`)
  }

  // ─── 3. Ensure exactly 1 demo package exists ───
  const otherDemos = await packages.find({ isDemo: true, _id: { $ne: demoPkg._id } }).toArray()
  if (otherDemos.length > 0) {
    console.error(`⚠️  พบ Demo package หลายตัว (${otherDemos.length + 1} ตัว):`)
    for (const d of otherDemos) console.error(`   - ${d.title} (${d._id})`)
    console.error(`❌ ต้องแก้ให้เหลือ 1 ตัวก่อน — abort\n`)
    process.exit(1)
  }

  // ─── 4. Process demo section(s) ───
  const sectionIds = (demoPkg.sections || []).filter(Boolean)
  const demoSections = await sections.find({ _id: { $in: sectionIds } }).toArray()

  console.log(`📁 Found ${demoSections.length} section(s) in demo package:\n`)

  for (const sec of demoSections) {
    console.log(`   • ${sec.code || '(no code)'} — ${sec.name}`)
    const secUpdate = {}

    // 4.1 Force code = DEMO-TRIAL (ถ้ามี section เดียว)
    if (demoSections.length === 1 && sec.code !== 'DEMO-TRIAL') {
      // check ว่าไม่มี section อื่นใช้ code DEMO-TRIAL อยู่แล้ว
      const conflict = await sections.findOne({ code: 'DEMO-TRIAL', _id: { $ne: sec._id } })
      if (conflict) {
        console.log(`     ⚠️  มี section อื่นใช้ code DEMO-TRIAL แล้ว (${conflict._id}) — skip rename`)
      } else {
        secUpdate.code = 'DEMO-TRIAL'
        console.log(`     → code: "${sec.code}" → "DEMO-TRIAL"`)
      }
    }

    // 4.2 Clear PDF maps
    if (sec.topicPdfMap && Object.keys(sec.topicPdfMap).length) {
      secUpdate.topicPdfMap = {}
      console.log(`     → clear topicPdfMap`)
    }
    if (sec.subtopicPdfMap && Object.keys(sec.subtopicPdfMap).length) {
      secUpdate.subtopicPdfMap = {}
      console.log(`     → clear subtopicPdfMap`)
    }

    // 4.3 Process videos: strip PDF/bonus + force tier=6 + default tags=['all']
    let videosChanged = false
    const cleanedVideos = []
    for (const v of (sec.videos || [])) {
      // ข้าม doc-only rows (ระบบใหม่ห้ามมี)
      if (v.docOnly === true) {
        console.log(`     → remove doc-only row: "${v.title || '(no title)'}"`)
        videosChanged = true
        continue
      }

      const newV = { ...v }

      // Default demoTags = ['all'] ถ้ายังไม่มี
      if (!Array.isArray(newV.demoTags) || newV.demoTags.length === 0) {
        newV.demoTags = ['all']
        console.log(`     → "${newV.title || '?'}" set demoTags=['all']`)
        videosChanged = true
      }

      // Strip PDF
      for (const f of ['pdfFileUrl', 'pdfFileName', 'pdfFile']) {
        if (newV[f]) { newV[f] = ''; videosChanged = true }
      }
      if (newV.pdfEnabled !== false) { newV.pdfEnabled = false; videosChanged = true }

      // Strip bonus
      for (const f of ['bonusLabel', 'bonusTitle', 'bonusBunnyVideoId', 'bonusBunnyDrmVideoId', 'bonusDuration', 'bonusPdfFile', 'bonusPdfFileName']) {
        if (newV[f]) { newV[f] = ''; videosChanged = true }
      }

      // Force tier=6
      if (newV.requiredTier !== 6) { newV.requiredTier = 6; videosChanged = true }

      cleanedVideos.push(newV)
    }

    if (videosChanged) {
      secUpdate.videos = cleanedVideos
    }

    if (Object.keys(secUpdate).length) {
      if (APPLY) {
        await sections.updateOne({ _id: sec._id }, { $set: secUpdate })
        console.log(`     ✓ applied ${Object.keys(secUpdate).length} field(s)\n`)
      } else {
        console.log(`     (dry-run — not applied)\n`)
      }
    } else {
      console.log(`     ✓ already clean\n`)
    }
  }

  console.log(`\n${APPLY ? '✅ Migration complete' : '🔍 Dry-run complete — add --apply to persist'}\n`)
  await conn.close()
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})
