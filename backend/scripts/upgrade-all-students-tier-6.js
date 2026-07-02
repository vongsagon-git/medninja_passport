/**
 * อัปเกรด Activation ทุกใบ → tier=6 (ระดับสูงสุดในระบบ 6 tier)
 *
 * บริบท: เปลี่ยนระบบ tier จาก 4 ระดับ → 6 ระดับ
 * → นักเรียนปัจจุบันให้ขึ้น lv 6 ทันที (สูงสุด) เพื่อไม่ให้ใครเสียสิทธิ์
 * → admin ค่อยทยอย downgrade รายบุคคลผ่านหน้า ManageActivations
 *
 * รัน: node scripts/upgrade-all-students-tier-6.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { passportConn } = require('../src/shared/config/db')
const Activation = require('../src/modules/activation/Activation.model')

async function waitConn(conn, name) {
  if (conn.readyState === 1) return
  await new Promise((resolve, reject) => {
    conn.once('connected', resolve)
    conn.once('error', reject)
    setTimeout(() => reject(new Error(`${name} connection timeout`)), 15000)
  })
}

async function main() {
  console.log('⏳ รอ connection passport...')
  await waitConn(passportConn, 'passport')
  console.log('✅ เชื่อม Mongo สำเร็จ\n')

  const totalAct = await Activation.countDocuments({})
  const not6 = await Activation.countDocuments({ tier: { $ne: 6 } })

  console.log(`=== ก่อนอัปเกรด ===`)
  console.log(`Activation ทั้งหมด: ${totalAct}`)
  console.log(`ที่ยังไม่ใช่ tier 6: ${not6}`)

  const dist = await Activation.aggregate([
    { $group: { _id: '$tier', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])
  console.log('\nแยกตาม tier เดิม:')
  for (const r of dist) console.log(`  tier ${r._id || '(null)'}: ${r.count} ใบ`)

  console.log('\n=== อัปเกรด ===')
  const result = await Activation.updateMany(
    { tier: { $ne: 6 } },
    { $set: { tier: 6 } }
  )
  console.log(`→ อัปเดต ${result.modifiedCount} ใบ → tier=6`)

  const stillBad = await Activation.countDocuments({ tier: { $ne: 6 } })
  if (stillBad === 0) {
    console.log('\n✅ สำเร็จ — Activation ทุกใบเป็น tier 6')
  } else {
    console.log(`\n⚠️  ยังมี ${stillBad} ใบที่ไม่ใช่ tier 6 — ตรวจเพิ่ม`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
