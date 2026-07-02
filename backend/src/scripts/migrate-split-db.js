#!/usr/bin/env node
/**
 * Migration Script: แยก DB lms → passport
 *
 * Copy collections: users, preregistrations, activations, packages
 * จาก DB "lms" → DB "passport"
 *
 * วิธีใช้:
 *   node backend/src/scripts/migrate-split-db.js
 *
 * ต้องตั้ง MONGODB_URI ก่อน (หรือแก้ URI ข้างล่าง)
 */
const { MongoClient } = require('mongodb')

const BASE_URI = process.env.MONGODB_URI
  || 'mongodb+srv://doadmin:461KbE859Fhe02AL@db-mongodb-sgp1-medninja-57a9a153.mongo.ondigitalocean.com'

const SOURCE_DB = 'lms'
const TARGET_DB = 'passport'

// Collections ที่ต้อง migrate ไป passport DB
const COLLECTIONS = ['users', 'preregistrations', 'activations', 'packages']

async function migrate() {
  // Parse base URI (ตัด DB name + query ออก)
  const baseUri = BASE_URI.replace(/\/[^/?]*(\?.*)?$/, '')
  const queryStr = BASE_URI.includes('?') ? '?' + BASE_URI.split('?')[1] : ''

  const sourceUri = `${baseUri}/${SOURCE_DB}${queryStr}`
  const targetUri = `${baseUri}/${TARGET_DB}${queryStr}`

  console.log(`\n🔄 Migration: ${SOURCE_DB} → ${TARGET_DB}`)
  console.log(`   Collections: ${COLLECTIONS.join(', ')}\n`)

  const sourceClient = new MongoClient(sourceUri)
  const targetClient = new MongoClient(targetUri)

  try {
    await sourceClient.connect()
    await targetClient.connect()
    console.log('✅ Connected to both databases\n')

    const sourceDb = sourceClient.db(SOURCE_DB)
    const targetDb = targetClient.db(TARGET_DB)

    for (const collName of COLLECTIONS) {
      const sourceColl = sourceDb.collection(collName)
      const targetColl = targetDb.collection(collName)

      const sourceCount = await sourceColl.countDocuments()
      const targetCount = await targetColl.countDocuments()

      console.log(`📦 ${collName}: ${sourceCount} docs in ${SOURCE_DB}, ${targetCount} docs in ${TARGET_DB}`)

      if (sourceCount === 0) {
        console.log(`   ⏭️  ไม่มี data ใน source — skip\n`)
        continue
      }

      if (targetCount > 0) {
        console.log(`   ⚠️  ${TARGET_DB}.${collName} มี data แล้ว (${targetCount} docs) — skip เพื่อความปลอดภัย`)
        console.log(`   ถ้าต้องการ overwrite ให้ drop collection ก่อน\n`)
        continue
      }

      // Copy all documents
      const docs = await sourceColl.find({}).toArray()
      const result = await targetColl.insertMany(docs)
      console.log(`   ✅ Copied ${result.insertedCount} docs → ${TARGET_DB}.${collName}`)

      // Copy indexes
      const indexes = await sourceColl.indexes()
      for (const idx of indexes) {
        if (idx.name === '_id_') continue // skip default index
        try {
          const { key, ...options } = idx
          delete options.v
          delete options.ns
          await targetColl.createIndex(key, options)
          console.log(`   📋 Index: ${idx.name}`)
        } catch (err) {
          console.log(`   ⚠️  Index ${idx.name}: ${err.message}`)
        }
      }
      console.log()
    }

    // Verify
    console.log('─── Verification ───')
    for (const collName of COLLECTIONS) {
      const sc = await sourceDb.collection(collName).countDocuments()
      const tc = await targetDb.collection(collName).countDocuments()
      const match = sc === tc ? '✅' : '❌'
      console.log(`${match} ${collName}: source=${sc}, target=${tc}`)
    }

    console.log('\n🎉 Migration complete!')
    console.log('\nขั้นตอนถัดไป:')
    console.log('1. ตั้ง MONGODB_URI_PASSPORT + MONGODB_URI_LMS ใน .env')
    console.log('2. restart server')
    console.log('3. ทดสอบ login + ดูคอร์ส')
    console.log('4. (อนาคต) ลบ collections เก่าจาก lms DB')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sourceClient.close()
    await targetClient.close()
  }
}

migrate()
