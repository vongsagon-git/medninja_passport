/**
 * Migration: PreRegistration.status legacy → demoExpiresAt flag-based
 * 2026-08-15
 *
 * Rules:
 *   - user มี paid activation active           → status='approved', demoExpiresAt=null  (derive=student)
 *   - user มี demo activation active           → status='approved', demoExpiresAt=activation.expiresAt (derive=demo)
 *   - user มี demo activation หมดอายุ (ล่าสุด)  → status='approved', demoExpiresAt=activation.expiresAt (derive=demo_expired)
 *   - user.isBanned=true                       → status='banned'
 *   - status='rejected' เดิม                   → status='banned' + user.isBanned=true
 *   - status='reviewed' เดิม                   → status='pending_approval'
 *   - else                                     → status='pending_approval'
 *
 * WARNING: ไม่ลบ demo activation เดิม — backward compat
 *
 * Run: cd backend && node src/scripts/migrate-to-demo-expires.js
 */

// Try passport .env first, fallback to LMS .env (shared cluster)
const path = require('path')
const fs = require('fs')
const passportEnv = path.resolve(__dirname, '../../.env')
const lmsEnv = path.resolve(__dirname, '../../../../medninja-app/.env')
if (fs.existsSync(passportEnv)) require('dotenv').config({ path: passportEnv })
else if (fs.existsSync(lmsEnv)) require('dotenv').config({ path: lmsEnv })

const { MongoClient } = require('mongodb')

const PASSPORT_URI = process.env.MONGODB_URI_PASSPORT
const LMS_URI = process.env.MONGODB_URI_LMS || process.env.MONGODB_URI

if (!PASSPORT_URI || !LMS_URI) {
  console.error('Missing MONGODB_URI_PASSPORT or MONGODB_URI_LMS')
  console.error('  passport .env:', passportEnv, fs.existsSync(passportEnv) ? '(found)' : '(missing)')
  console.error('  lms .env:', lmsEnv, fs.existsSync(lmsEnv) ? '(found)' : '(missing)')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const pClient = new MongoClient(PASSPORT_URI)
  const lClient = new MongoClient(LMS_URI)
  await pClient.connect()
  await lClient.connect()
  const pdb = pClient.db()
  const ldb = lClient.db()

  console.log(`\n=== Migration to demoExpiresAt (${DRY_RUN ? 'DRY RUN' : 'LIVE'}) ===\n`)

  // 1) demo package IDs (จาก LMS)
  const demoPkgs = await ldb.collection('packages').find({ isDemo: true }).project({ _id: 1 }).toArray()
  const demoIds = new Set(demoPkgs.map(d => d._id.toString()))
  console.log(`demo packages (LMS isDemo:true): ${demoIds.size}`)
  demoIds.forEach(id => console.log(`  - ${id}`))

  // 2) ทุก preReg
  const pres = await pdb.collection('preregistrations').find({}).toArray()
  console.log(`\ntotal preregs: ${pres.length}\n`)

  const bucket = { student: 0, demo: 0, demo_expired: 0, pending: 0, banned: 0, noUserFound: 0 }
  const ops = []       // preregistrations updates
  const userOps = []   // users updates
  const actOps = []    // activations updates (ปิด demo ของ paid user)

  const now = new Date()

  for (const pre of pres) {
    const user = await pdb.collection('users').findOne({ nationalId: pre.nationalId })
    if (!user) {
      bucket.noUserFound++
      // set pending_approval to be safe
      if (pre.status !== 'pending_approval') {
        ops.push({
          filter: { _id: pre._id },
          update: { $set: { status: 'pending_approval', demoExpiresAt: null } }
        })
      }
      continue
    }

    // rejected เดิม → banned
    if (pre.status === 'rejected') {
      ops.push({
        filter: { _id: pre._id },
        update: {
          $set: {
            status: 'banned',
            demoExpiresAt: null,
            bannedAt: now,
            bannedBy: 'migration',
            banReason: pre.rejectReason || 'legacy rejected'
          }
        }
      })
      userOps.push({
        filter: { _id: user._id },
        update: { $set: { isBanned: true, bannedReason: pre.rejectReason || 'legacy rejected' } }
      })
      bucket.banned++
      continue
    }

    // user.isBanned already
    if (user.isBanned) {
      ops.push({
        filter: { _id: pre._id },
        update: { $set: { status: 'banned', demoExpiresAt: null } }
      })
      bucket.banned++
      continue
    }

    // ทุก activation ของ user
    const acts = await pdb.collection('activations')
      .find({ userId: user._id, isActive: true })
      .toArray()

    const paidActs = acts.filter(a => {
      if (a.expiresAt && new Date(a.expiresAt) <= now) return false
      return !demoIds.has(a.packageId.toString())
    })
    const demoActsActive = acts.filter(a => {
      if (a.expiresAt && new Date(a.expiresAt) <= now) return false
      return demoIds.has(a.packageId.toString())
    })
    const demoActsAny = acts.filter(a => demoIds.has(a.packageId.toString()))
      .sort((a, b) => new Date(b.expiresAt || 0) - new Date(a.expiresAt || 0))

    // Case: มี paid → student
    // ⭐ ถ้าเคยมี demo activation → เก็บ demoExpiresAt เป็น history (ไม่ null)
    //    เพราะ helper computeUserState เช็ค paid ก่อน demoExpiresAt แล้ว → return student อยู่ดี
    // ⭐ ปิด demo activation ที่ยัง active (ห้ามใช้ระบบ demo ต่อ ถ้าเป็น student แล้ว)
    if (paidActs.length > 0) {
      const setFields = { status: 'approved' }
      if (demoActsAny.length > 0) {
        // เก็บ history: expiresAt ของ demo ตัวล่าสุด
        setFields.demoExpiresAt = demoActsAny[0].expiresAt
        setFields.approveMode = pre.approveMode || 'student'
      } else {
        setFields.demoExpiresAt = null
      }
      ops.push({
        filter: { _id: pre._id },
        update: { $set: setFields }
      })

      // ปิด demo activation ที่ยัง active (student ไม่ควรใช้ระบบ demo ได้)
      const demoActIdsToClose = demoActsAny
        .filter(a => a.isActive)
        .map(a => a._id)
      if (demoActIdsToClose.length > 0) {
        actOps.push({
          filter: { _id: { $in: demoActIdsToClose } },
          update: {
            $set: {
              isActive: false,
              note: (demoActsAny[0].note || '') + ' | closed by migration (paid customer)'
            }
          }
        })
      }
      bucket.student++
      continue
    }

    // Case: มี demo active → demo (copy expiresAt)
    if (demoActsActive.length > 0) {
      // เลือกที่หมดหลังสุด
      const bestDemo = demoActsActive.sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0]
      ops.push({
        filter: { _id: pre._id },
        update: {
          $set: {
            status: 'approved',
            demoExpiresAt: bestDemo.expiresAt,
            approveMode: 'trial',
            approvedAt: pre.approvedAt || bestDemo.activatedAt || now,
            approvedBy: pre.approvedBy || 'migration'
          }
        }
      })
      bucket.demo++
      continue
    }

    // Case: มี demo expired → demo_expired (copy expiresAt ล่าสุด)
    if (demoActsAny.length > 0) {
      const latestExpired = demoActsAny[0]
      ops.push({
        filter: { _id: pre._id },
        update: {
          $set: {
            status: 'approved',
            demoExpiresAt: latestExpired.expiresAt,
            approveMode: 'trial',
            approvedAt: pre.approvedAt || latestExpired.activatedAt || now,
            approvedBy: pre.approvedBy || 'migration'
          }
        }
      })
      bucket.demo_expired++
      continue
    }

    // ไม่มี activation เลย → pending_approval
    ops.push({
      filter: { _id: pre._id },
      update: { $set: { status: 'pending_approval', demoExpiresAt: null } }
    })
    bucket.pending++
  }

  // Print summary
  console.log('=== SUMMARY ===')
  console.log(JSON.stringify(bucket, null, 2))
  console.log(`\nprereg updates: ${ops.length}`)
  console.log(`user updates: ${userOps.length}`)
  console.log(`activation updates (close demo of paid): ${actOps.length}`)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] no writes')
    console.log('\nsample 5 ops:')
    ops.slice(0, 5).forEach(o => console.log(JSON.stringify(o)))
  } else {
    console.log('\n=== APPLYING ===')
    let modP = 0
    for (const op of ops) {
      const r = await pdb.collection('preregistrations').updateOne(op.filter, op.update)
      modP += r.modifiedCount
    }
    console.log(`preregistrations modified: ${modP}`)

    let modU = 0
    for (const op of userOps) {
      const r = await pdb.collection('users').updateOne(op.filter, op.update)
      modU += r.modifiedCount
    }
    console.log(`users modified: ${modU}`)

    let modA = 0
    for (const op of actOps) {
      const r = await pdb.collection('activations').updateMany(op.filter, op.update)
      modA += r.modifiedCount
    }
    console.log(`activations closed (demo of paid): ${modA}`)

    // verify
    const verify = await pdb.collection('preregistrations').aggregate([
      { $group: {
        _id: {
          status: '$status',
          hasDemoExpires: { $cond: [{ $ifNull: ['$demoExpiresAt', false] }, true, false] }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.status': 1 } }
    ]).toArray()
    console.log('\n=== VERIFY (post-migration) ===')
    verify.forEach(v => console.log(`  status=${v._id.status} hasDemoExpires=${v._id.hasDemoExpires} → ${v.count}`))
  }

  await pClient.close()
  await lClient.close()
  console.log('\nDONE')
}

main().catch(err => {
  console.error('MIGRATION ERROR:', err)
  process.exit(1)
})
