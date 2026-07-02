/**
 * ย้าย "อรนลิน" จาก NL MASTERY → PRECLINIC
 * (NL2 ที่ลงไว้ ถูกแล้ว — ไม่แตะ)
 *
 * รัน: node move-oranalin-to-preclinic.js
 * Dry-run (ดูก่อนไม่แก้จริง): node move-oranalin-to-preclinic.js --dry
 */
const path = require('path')
// .env อยู่ที่ medninja-app/.env (parent ของ backend)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const { passportConn, lmsConn, connectDB } = require('./src/shared/config/db')

const DRY = process.argv.includes('--dry')

const User = require('./src/modules/user/User.model')
const Package = require('./src/modules/content/Package.model')
const Activation = require('./src/modules/activation/Activation.model')

const SEARCH_FIRST = 'อรนลิน'
const SEARCH_LAST = 'จันทร์น้อย'
const FROM_PACKAGE = 'NL MASTERY (FULL)'
const TO_PACKAGE = 'PRE-CLINIC'

async function run() {
  await connectDB()
  console.log(`\n=== ${DRY ? '[DRY RUN] ' : ''}ย้าย ${SEARCH_FIRST} ${SEARCH_LAST}: ${FROM_PACKAGE} → ${TO_PACKAGE} ===\n`)

  // 1) หา user — เน้น first+last ตรงคู่กัน ถ้าไม่เจอค่อย fallback แค่ first
  let users = await User.find({
    firstName: { $regex: SEARCH_FIRST, $options: 'i' },
    lastName: { $regex: SEARCH_LAST, $options: 'i' }
  }).lean()

  if (!users.length) {
    console.log(`ไม่พบคู่ "${SEARCH_FIRST} ${SEARCH_LAST}" — ลองหาแค่ firstName="${SEARCH_FIRST}"`)
    users = await User.find({
      $or: [
        { firstName: { $regex: SEARCH_FIRST, $options: 'i' } },
        { name: { $regex: SEARCH_FIRST, $options: 'i' } }
      ]
    }).lean()
  }

  if (!users.length) {
    console.log(`ไม่พบ user`)
    process.exit(1)
  }
  console.log(`พบ user ${users.length} คน:`)
  users.forEach(u => console.log(`  - ${u._id} | ${u.firstName || ''} ${u.lastName || ''} | ${u.email || ''}`))

  if (users.length > 1) {
    console.log('\nมีหลายคน — แก้ script ระบุ _id ตรงๆ ก่อนค่อยรัน')
    process.exit(1)
  }
  const user = users[0]

  // 2) หา package ทั้งสอง — ใช้ exact match กัน NL MASTERY (FULL) ชนกับ (Part1/Part2)
  const [fromPkg, toPkg] = await Promise.all([
    Package.findOne({ title: FROM_PACKAGE }).lean(),
    Package.findOne({ title: TO_PACKAGE }).lean()
  ])
  if (!fromPkg) { console.log(`ไม่พบ package "${FROM_PACKAGE}"`); process.exit(1) }
  if (!toPkg) { console.log(`ไม่พบ package "${TO_PACKAGE}"`); process.exit(1) }
  console.log(`\nFROM: ${fromPkg._id} | ${fromPkg.title}`)
  console.log(`TO:   ${toPkg._id} | ${toPkg.title}`)

  // 3) หา activation ปัจจุบันของ user คนนี้ทั้งหมด
  const acts = await Activation.find({ userId: user._id }).lean()
  console.log(`\nActivations ทั้งหมดของ user นี้: ${acts.length} ใบ`)
  for (const a of acts) {
    const pkg = await Package.findById(a.packageId).lean()
    console.log(`  - ${a._id} | pkg=${pkg ? pkg.title : '?'} | active=${a.isActive} | exp=${a.expiresAt}`)
  }

  // 4) target activation = ใบที่ผูก NL MASTERY
  const target = acts.find(a => String(a.packageId) === String(fromPkg._id))
  if (!target) {
    console.log(`\nไม่พบ activation ผูกกับ "${FROM_PACKAGE}" — ไม่ต้องย้าย`)
    process.exit(0)
  }

  // กันลงซ้ำ — เช็คว่ามี PRECLINIC อยู่แล้วไหม
  const dup = acts.find(a => String(a.packageId) === String(toPkg._id))
  if (dup) {
    console.log(`\n⚠️  user มี "${TO_PACKAGE}" อยู่แล้ว (${dup._id}) — จะแค่ลบใบ ${FROM_PACKAGE} ไม่สร้างซ้ำ`)
    if (!DRY) {
      await Activation.deleteOne({ _id: target._id })
      console.log(`✅ ลบ activation ${FROM_PACKAGE} (${target._id}) แล้ว`)
    } else {
      console.log(`[DRY] จะลบ ${target._id}`)
    }
    process.exit(0)
  }

  // 5) เปลี่ยน packageId ของใบเดิมเป็น PRECLINIC (เก็บ expiresAt + flags เดิมไว้)
  console.log(`\nจะเปลี่ยน activation ${target._id}: packageId ${target.packageId} → ${toPkg._id}`)
  if (!DRY) {
    await Activation.updateOne(
      { _id: target._id },
      { $set: { packageId: toPkg._id } }
    )
    console.log(`✅ ย้ายเรียบร้อย`)
  } else {
    console.log(`[DRY] ยังไม่แก้จริง — ลบ --dry ออกเพื่อรันจริง`)
  }

  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
