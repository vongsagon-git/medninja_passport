#!/usr/bin/env node
/**
 * Migration Script: ย้าย packages collection กลับจาก passport → lms
 *
 * เหตุผล: Package model ย้ายไปใช้ lmsConn แล้ว (อยู่กับ Section ใน DB เดียวกัน)
 * Passport DB เหลือแค่: User + PreRegistration + Activation
 *
 * วิธีใช้:
 *   node backend/src/scripts/migrate-packages-to-lms.js
 */
const { MongoClient } = require('mongodb')

const BASE_URI = process.env.MONGODB_URI
  || 'mongodb+srv://doadmin:461KbE859Fhe02AL@db-mongodb-sgp1-medninja-57a9a153.mongo.ondigitalocean.com'

const SOURCE_DB = 'passport'
const TARGET_DB = 'lms'

async function migrate() {
  const baseUri = BASE_URI.replace(/\/[^/?]*(\?.*)?$/, '')
  const queryStr = BASE_URI.includes('?') ? '?' + BASE_URI.split('?')[1] : ''

  const sourceUri = `${baseUri}/${SOURCE_DB}${queryStr}`
  const targetUri = `${baseUri}/${TARGET_DB}${queryStr}`

  console.log(`\n🔄 Migration: ${SOURCE_DB}.packages → ${TARGET_DB}.packages`)

  const sourceClient = new MongoClient(sourceUri)
  const targetClient = new MongoClient(targetUri)

  try {
    await sourceClient.connect()
    await targetClient.connect()
    console.log('✅ Connected to both databases\n')

    const sourceDb = sourceClient.db(SOURCE_DB)
    const targetDb = targetClient.db(TARGET_DB)

    const sourceColl = sourceDb.collection('packages')
    const targetColl = targetDb.collection('packages')

    const sourceCount = await sourceColl.countDocuments()
    const targetCount = await targetColl.countDocuments()

    console.log(`📦 passport.packages: ${sourceCount} docs`)
    console.log(`📦 lms.packages: ${targetCount} docs`)

    if (sourceCount === 0) {
      console.log('\n⏭️  ไม่มี packages ใน passport DB — skip')
      return
    }

    if (targetCount > 0) {
      console.log(`\n⚠️  lms.packages มี data แล้ว (${targetCount} docs)`)
      console.log('   ถ้าต้องการ overwrite ให้ drop lms.packages ก่อน')
      return
    }

    // Copy packages (เฉพาะ content fields — ลบ marketing fields)
    const docs = await sourceColl.find({}).toArray()
    const cleaned = docs.map(doc => ({
      _id: doc._id,
      title: doc.title,
      description: doc.description || '',
      thumbnail: doc.thumbnail || '',
      sections: doc.sections || [],
      durationDays: doc.durationDays || 365,
      isPublished: doc.isPublished || false,
      order: doc.order || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }))

    const result = await targetColl.insertMany(cleaned)
    console.log(`\n✅ Copied ${result.insertedCount} packages → lms.packages (content fields only)`)
    console.log('   ลบ marketing fields: price, parentId, instructor, learningPoints, system, durationHours')

    // Verify
    const newCount = await targetColl.countDocuments()
    console.log(`\n─── Verification ───`)
    console.log(`${sourceCount === newCount ? '✅' : '❌'} passport.packages=${sourceCount}, lms.packages=${newCount}`)

    console.log('\n🎉 Migration complete!')
    console.log('\nหมายเหตุ:')
    console.log('- passport.packages ยังอยู่ (ไม่ได้ลบ — safety)')
    console.log('- Package model ใช้ lmsConn แล้ว → อ่านจาก lms.packages')
    console.log('- Activation.packageId ยังอ้าง ObjectId เดิม → ใช้ manual lookup ข้าม DB')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sourceClient.close()
    await targetClient.close()
  }
}

migrate()
