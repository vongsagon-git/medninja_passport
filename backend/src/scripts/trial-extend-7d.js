/**
 * Trial Extend +7 วัน — แจกฟรีให้ทุกคนยกเว้นที่โดน ban
 *
 * เงื่อนไข:
 *   - Activation.isActive = true
 *   - Activation.bannedAt = null   (activation นี้ไม่โดน ban)
 *   - User.isBanned = false        (เจ้าของไม่โดน ban)
 *
 * ผลลัพธ์ (เลือกอัน "ไกลกว่า"):
 *   - ถ้า expiresAt + 7d > วันนี้ + 7d → expiresAt += 7d        (ยังไม่หมด → ต่อ 7 วัน)
 *   - ถ้า expiresAt + 7d <= วันนี้ + 7d → expiresAt = วันนี้ + 7d (หมดไปแล้ว → reset ให้ใช้ได้ 7 วันจากวันนี้)
 *   - extendedDays += 7
 *
 * Run:
 *   DRY RUN   : node backend/src/scripts/trial-extend-7d.js
 *   APPLY     : node backend/src/scripts/trial-extend-7d.js --apply
 *   ROLLBACK  : node backend/src/scripts/trial-extend-7d.js --rollback --apply  (เอา 7 วันออก)
 */
const path = require('path')
const fs = require('fs')
const envCandidates = [
  path.join(__dirname, '../../../.env'),       // backend/.env
  path.join(__dirname, '../../../../.env')     // medninja-app/.env (root)
]
const envPath = envCandidates.find(p => fs.existsSync(p))
require('dotenv').config({ path: envPath })
console.log(`ENV file: ${envPath || '(not found — using process env)'}`)

const Activation = require('../modules/activation/Activation.model')
const User = require('../modules/user/User.model')
const { passportConn, connectDB } = require('../shared/config/db')

const DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000
const APPLY = process.argv.includes('--apply')
const ROLLBACK = process.argv.includes('--rollback')

async function main() {
  await connectDB()
  console.log(`\n=== Trial ${ROLLBACK ? `ROLLBACK -${DAYS}` : `Extend +${DAYS}`} วัน ===`)
  console.log(`MODE: ${APPLY ? 'APPLY (เขียน DB จริง)' : 'DRY RUN (preview)'}\n`)

  const bannedUsers = await User.find({ isBanned: true }).select('_id name email').lean()
  const bannedUserIds = new Set(bannedUsers.map(u => String(u._id)))
  console.log(`User ที่โดน ban: ${bannedUsers.length} คน`)

  const activations = await Activation.find({
    isActive: true,
    $or: [{ bannedAt: null }, { bannedAt: { $exists: false } }]
  }).populate('userId', 'name email isBanned').lean()

  console.log(`Activation ที่ active + ไม่โดน ban: ${activations.length} แถว`)

  const targets = activations.filter(a => {
    if (!a.userId) return false
    return !bannedUserIds.has(String(a.userId._id))
  })

  const skippedByUserBan = activations.length - targets.length
  console.log(`ตัด activation ของคนที่โดน ban: ${skippedByUserBan} แถว`)
  console.log(`เหลือ activation ที่จะ extend: ${targets.length} แถว\n`)

  if (targets.length === 0) {
    console.log('ไม่มี target')
    await passportConn.close()
    process.exit(0)
  }

  const now = Date.now()
  const minExpiresAfter = now + DAYS * MS_PER_DAY  // วันนี้ + 7

  const computeNew = (oldExp) => {
    if (ROLLBACK) return oldExp.getTime() - DAYS * MS_PER_DAY
    const plus7 = oldExp.getTime() + DAYS * MS_PER_DAY
    return Math.max(plus7, minExpiresAfter)  // เลือกที่ไกลกว่า
  }

  let expiredCount = 0
  console.log('ตัวอย่าง 10 รายแรก:')
  targets.slice(0, 10).forEach((a, i) => {
    const oldExp = new Date(a.expiresAt)
    const newExp = new Date(computeNew(oldExp))
    const wasExpired = oldExp.getTime() < now
    if (wasExpired) expiredCount++
    const mark = wasExpired ? ' [หมดแล้ว → reset]' : ''
    console.log(
      `  ${i + 1}. ${a.userId.name || a.userId.email}` +
      ` | ${oldExp.toISOString().slice(0, 10)} → ${newExp.toISOString().slice(0, 10)}${mark}`
    )
  })

  const allExpired = targets.filter(a => new Date(a.expiresAt).getTime() < now).length
  console.log(`\nสรุป: ${allExpired}/${targets.length} แถวหมดอายุไปแล้ว → reset เป็นวันนี้+7`)
  console.log(`        ${targets.length - allExpired}/${targets.length} แถวยังไม่หมด → +7 วันจากเดิม`)

  if (!APPLY) {
    console.log('\n--- DRY RUN — ไม่ได้เขียน DB ---')
    console.log('เพิ่ม --apply เพื่อ commit')
    await passportConn.close()
    process.exit(0)
  }

  console.log('\nกำลัง update...')
  const targetIds = targets.map(a => a._id)

  let result
  if (ROLLBACK) {
    result = await Activation.updateMany(
      { _id: { $in: targetIds } },
      [
        {
          $set: {
            expiresAt: { $subtract: ['$expiresAt', DAYS * MS_PER_DAY] },
            extendedDays: { $subtract: [{ $ifNull: ['$extendedDays', 0] }, DAYS] }
          }
        }
      ]
    )
  } else {
    result = await Activation.updateMany(
      { _id: { $in: targetIds } },
      [
        {
          $set: {
            expiresAt: {
              $max: [
                { $add: ['$expiresAt', DAYS * MS_PER_DAY] },
                new Date(minExpiresAfter)
              ]
            },
            extendedDays: { $add: [{ $ifNull: ['$extendedDays', 0] }, DAYS] }
          }
        }
      ]
    )
  }

  console.log(`\n=== DONE ===`)
  console.log(`Matched: ${result.matchedCount} | Modified: ${result.modifiedCount}`)

  await passportConn.close()
  process.exit(0)
}

main().catch(err => {
  console.error('ERROR:', err)
  process.exit(1)
})
