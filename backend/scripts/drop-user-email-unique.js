// One-off: ลบ unique index ของ email ใน users collection
// รัน: node scripts/drop-user-email-unique.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')

const PASSPORT_URI = process.env.MONGODB_URI_PASSPORT
if (!PASSPORT_URI) {
  console.error('MONGODB_URI_PASSPORT not set')
  process.exit(1)
}

;(async () => {
  console.log('Connecting...')
  const conn = await mongoose.createConnection(PASSPORT_URI).asPromise()
  console.log(`Connected: ${conn.host}`)

  const users = conn.collection('users')
  const indexes = await users.indexes()
  console.log('Current indexes:')
  for (const idx of indexes) {
    console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`)
  }

  const emailIndex = indexes.find(i => i.key && i.key.email && i.unique)
  if (emailIndex) {
    console.log(`\nDropping unique index: ${emailIndex.name}`)
    await users.dropIndex(emailIndex.name)
    console.log('✅ Dropped')
  } else {
    console.log('\nNo unique email index found — already clean')
  }

  await conn.close()
  process.exit(0)
})().catch(e => { console.error('FATAL:', e); process.exit(1) })
