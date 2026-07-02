/**
 * Back-fill tier=4 ให้ activation เก่า + requiredTier=4 ให้ video เก่า
 *
 * เป้าหมาย: ทุก activation และทุกวีดีโอ มี tier=4 ตั้งแต่แรก
 *           จะได้พร้อมใช้ tier system ในอนาคต โดยไม่กระทบใคร
 *
 * Idempotent — รันซ้ำได้ ไม่ทับของใหม่
 * รัน: node scripts/backfill-tier.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { passportConn, lmsConn } = require('../src/shared/config/db')
const Activation = require('../src/modules/activation/Activation.model')
const Section = require('../src/modules/content/Section.model')

async function waitConn(conn, name) {
  if (conn.readyState === 1) return
  await new Promise((resolve, reject) => {
    conn.once('connected', resolve)
    conn.once('error', reject)
    setTimeout(() => reject(new Error(`${name} connection timeout`)), 15000)
  })
}

async function main() {
  console.log('⏳ รอ connection...')
  await Promise.all([
    waitConn(passportConn, 'passport'),
    waitConn(lmsConn, 'lms')
  ])
  console.log('✅ เชื่อม Mongo สำเร็จ')

  // 1) Back-fill Activation — set tier=4 ถ้ายังไม่มี
  console.log('\n=== Phase 1: Activation ===')
  const actBefore = await Activation.countDocuments({})
  const actMissing = await Activation.countDocuments({ tier: { $exists: false } })
  console.log(`รวม Activation: ${actBefore} ใบ | ยังไม่มี tier: ${actMissing} ใบ`)

  if (actMissing > 0) {
    const actResult = await Activation.updateMany(
      { tier: { $exists: false } },
      { $set: { tier: 4 } }
    )
    console.log(`→ อัปเดตแล้ว ${actResult.modifiedCount} ใบ (tier=4)`)
  } else {
    console.log('→ ทุกใบมี tier อยู่แล้ว ไม่ต้องอัปเดต')
  }

  // 2) Back-fill Video sub-doc — set requiredTier=4 ทุก video ที่ยังไม่มี
  console.log('\n=== Phase 2: Video (sub-doc ใน Section) ===')
  const allSections = await Section.find({}).select('code name videos').lean()
  console.log(`รวม Section: ${allSections.length}`)

  let totalVideos = 0
  let videosMissing = 0
  for (const s of allSections) {
    for (const v of (s.videos || [])) {
      totalVideos++
      if (v.requiredTier === undefined || v.requiredTier === null) videosMissing++
    }
  }
  console.log(`รวม Video: ${totalVideos} | ยังไม่มี requiredTier: ${videosMissing}`)

  if (videosMissing > 0) {
    // ใช้ arrayFilter — set requiredTier=4 ให้ทุก element ใน videos[] ที่ยังไม่มี
    const secResult = await Section.updateMany(
      { 'videos.requiredTier': { $exists: false } },
      { $set: { 'videos.$[v].requiredTier': 4 } },
      { arrayFilters: [{ 'v.requiredTier': { $exists: false } }] }
    )
    console.log(`→ อัปเดต ${secResult.modifiedCount} sections`)
  } else {
    console.log('→ ทุก video มี requiredTier อยู่แล้ว ไม่ต้องอัปเดต')
  }

  // 3) Verify
  console.log('\n=== Phase 3: Verify ===')
  const actStillMissing = await Activation.countDocuments({ tier: { $exists: false } })
  console.log(`Activation ที่ยังไม่มี tier: ${actStillMissing}`)

  let videosStillMissing = 0
  const secCheck = await Section.find({}).select('videos').lean()
  for (const s of secCheck) {
    for (const v of (s.videos || [])) {
      if (v.requiredTier === undefined || v.requiredTier === null) videosStillMissing++
    }
  }
  console.log(`Video ที่ยังไม่มี requiredTier: ${videosStillMissing}`)

  if (actStillMissing === 0 && videosStillMissing === 0) {
    console.log('\n✅ Back-fill สำเร็จ — ทุก doc มี tier=4 แล้ว')
  } else {
    console.log('\n⚠️  ยังมี doc ที่ขาด tier — ตรวจสอบเพิ่ม')
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
