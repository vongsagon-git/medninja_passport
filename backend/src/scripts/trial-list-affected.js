/**
 * List affected — รายชื่อ 88 rows ที่ expiresAt ถูกแก้ผิด
 *
 * ก่อนแก้: expiresAt = อดีต (หมดไปแล้ว)
 * หลังแก้ผิด: expiresAt = 2026-06-26 (วันนี้)
 *
 * Run: node backend/src/scripts/trial-list-affected.js
 */
const path = require('path')
const fs = require('fs')
const envCandidates = [
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../../../.env')
]
const envPath = envCandidates.find(p => fs.existsSync(p))
require('dotenv').config({ path: envPath })

const Activation = require('../modules/activation/Activation.model')
const User = require('../modules/user/User.model')
const { passportConn, connectDB } = require('../shared/config/db')

async function main() {
  await connectDB()

  const today = new Date('2026-06-26T00:00:00.000Z')
  const tomorrow = new Date('2026-06-27T00:00:00.000Z')

  const affected = await Activation.find({
    isActive: true,
    expiresAt: { $gte: today, $lt: tomorrow }
  })
    .populate('userId', 'name email firstName lastName')
    .lean()

  console.log(`\n=== Affected: ${affected.length} rows ===`)
  console.log(`(expiresAt = วันนี้ 2026-06-26 — ค่าเดิมก่อนผมแตะ = อดีต)\n`)

  affected.forEach((a, i) => {
    const u = a.userId
    const name = u
      ? (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email)
      : '(no user)'
    const activatedAt = a.activatedAt ? new Date(a.activatedAt).toISOString().slice(0, 10) : '?'
    const pkgId = a.packageId ? String(a.packageId) : '(no pkg)'
    console.log(`${String(i + 1).padStart(3)}. ${name}  |  activated: ${activatedAt}  |  pkgId: ${pkgId}`)
  })

  console.log(`\n--- รายชื่อ user เฉพาะ (unique) ---`)
  const uniqueUsers = new Map()
  affected.forEach(a => {
    if (!a.userId) return
    const id = String(a.userId._id)
    if (!uniqueUsers.has(id)) {
      const u = a.userId
      const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
      uniqueUsers.set(id, { name, email: u.email, count: 0 })
    }
    uniqueUsers.get(id).count++
  })
  console.log(`Unique users: ${uniqueUsers.size}\n`)
  let i = 1
  for (const [, u] of uniqueUsers) {
    console.log(`${String(i++).padStart(3)}. ${u.name}  (${u.email})  — ${u.count} activation(s)`)
  }

  await passportConn.close()
  process.exit(0)
}

main().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
