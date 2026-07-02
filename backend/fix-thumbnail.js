/**
 * แก้ thumbnail ใน DB
 * รัน: node backend/fix-thumbnail.js (จาก root)
 */
require('dotenv').config()
const { connectDB } = require('./src/shared/config/db')

async function run() {
  await connectDB()
  const Course = require('./src/modules/catalog/Course.model')

  // 1) PRE-CLINIC.jpg → PRE-CLINIC.png (นามสกุลผิด)
  let r = await Course.updateMany(
    { thumbnail: /PRE-CLINIC\.jpg/i },
    { $set: { thumbnail: 'https://medninja.b-cdn.net/PRE-CLINIC.png' } }
  )
  console.log(`PRE-CLINIC.jpg → .png: ${r.modifiedCount}`)

  // 2) old banner URL → top_banner.png
  r = await Course.updateMany(
    { thumbnail: /medninja\.co\.th.*banner/i },
    { $set: { thumbnail: 'https://medninja.b-cdn.net/top_banner.png' } }
  )
  console.log(`old banner → top_banner.png: ${r.modifiedCount}`)

  // เช็คผลลัพธ์
  const all = await Course.find({}, { title: 1, thumbnail: 1 }).lean()
  for (const c of all) console.log(`  ${c.title}: ${c.thumbnail}`)

  console.log('Done!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
