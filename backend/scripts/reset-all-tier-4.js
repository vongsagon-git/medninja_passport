/**
 * Reset ทุก Activation + ทุก VDO เป็น tier=4
 * ใช้กรณีฉุกเฉิน — ให้ทุกคนดูได้หมด
 *
 * รัน: node scripts/reset-all-tier-4.js
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
  console.log('✅ เชื่อม Mongo สำเร็จ\n')

  // 1) Activation → tier=4 ทุกใบ (รวมที่ < 4)
  console.log('=== Phase 1: Activation ===')
  const actBefore = await Activation.countDocuments({ tier: { $ne: 4 } })
  console.log(`Activation ที่ไม่ใช่ tier 4: ${actBefore}`)
  const actResult = await Activation.updateMany({}, { $set: { tier: 4 } })
  console.log(`→ อัปเดต ${actResult.modifiedCount} ใบ → tier=4`)

  // 2) Video → requiredTier=4 ทุกตัว
  console.log('\n=== Phase 2: Video ===')
  let totalVideos = 0
  let videosNotFour = 0
  const allSections = await Section.find({}).select('videos').lean()
  for (const s of allSections) {
    for (const v of (s.videos || [])) {
      totalVideos++
      if (v.requiredTier !== 4) videosNotFour++
    }
  }
  console.log(`Video ทั้งหมด: ${totalVideos} | ที่ไม่ใช่ tier 4: ${videosNotFour}`)

  const secResult = await Section.updateMany(
    {},
    { $set: { 'videos.$[].requiredTier': 4 } }
  )
  console.log(`→ อัปเดต ${secResult.modifiedCount} sections (ทุก VDO → requiredTier=4)`)

  // 3) Verify
  console.log('\n=== Phase 3: Verify ===')
  const actStillBad = await Activation.countDocuments({ tier: { $ne: 4 } })
  console.log(`Activation ที่ยังไม่ใช่ tier 4: ${actStillBad}`)

  let vidStillBad = 0
  const check = await Section.find({}).select('videos').lean()
  for (const s of check) {
    for (const v of (s.videos || [])) {
      if (v.requiredTier !== 4) vidStillBad++
    }
  }
  console.log(`Video ที่ยังไม่ใช่ tier 4: ${vidStillBad}`)

  if (actStillBad === 0 && vidStillBad === 0) {
    console.log('\n✅ Reset สำเร็จ — ทุกคน ทุก VDO = tier 4')
  } else {
    console.log('\n⚠️  ยังมีของไม่ใช่ tier 4 — ตรวจเพิ่ม')
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
