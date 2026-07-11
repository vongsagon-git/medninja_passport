/**
 * หา user จากชื่อ (raw mongodb driver, ไม่พึ่ง mongoose connection)
 * Usage: node backend/src/scripts/find-by-name-raw.js "สุภาพร"
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const { MongoClient } = require('mongodb')

;(async () => {
  const q = process.argv[2]
  if (!q) { console.error('Usage: node find-by-name-raw.js <name>'); process.exit(1) }

  const passportUri = process.env.MONGODB_URI_PASSPORT
  const lmsUri = process.env.MONGODB_URI_LMS

  for (const [label, uri] of [['PASSPORT', passportUri], ['LMS', lmsUri]]) {
    console.log(`\n===== ${label} =====`)
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
    try {
      await client.connect()
      const db = client.db()
      const users = await db.collection('users')
        .find({ name: new RegExp(q, 'i') })
        .project({ name: 1, email: 1, emailVerified: 1, authProvider: 1, phone: 1, nationalId: 1, createdAt: 1, verifyExpires: 1 })
        .sort({ createdAt: -1 })
        .toArray()

      console.log(`พบ ${users.length} รายการ:\n`)
      users.forEach((u, i) => {
        console.log(`[${i + 1}] ${u.name}`)
        console.log(`    _id:           ${u._id}`)
        console.log(`    email:         ${u.email}`)
        console.log(`    verified:      ${u.emailVerified}`)
        console.log(`    authProvider:  ${u.authProvider}`)
        console.log(`    phone:         ${u.phone || '-'}`)
        console.log(`    nationalId:    ${u.nationalId || '-'}`)
        console.log(`    createdAt:     ${u.createdAt}`)
        console.log(`    verifyExpires: ${u.verifyExpires || '-'}`)
        console.log('')
      })
    } catch (e) {
      console.error(`✗ ${label} error:`, e.message)
    } finally {
      await client.close().catch(() => {})
    }
  }
  process.exit(0)
})().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
