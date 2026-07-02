require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

async function main() {
  const conn = await mongoose.createConnection(process.env.MONGODB_URI_LMS || process.env.MONGODB_URI).asPromise()
  const Section = conn.model('Section', new mongoose.Schema({}, { strict: false }), 'sections')

  const result = await Section.updateOne(
    { code: /^NL2/i, 'videos.title': 'Cardiology (VHD)' },
    { $set: { 'videos.$.bunnyDrmVideoId': '1ab74e39-2123-4634-b0e4-090cc74b88a3' } }
  )
  console.log('Updated:', result.modifiedCount)
  await conn.close()
}

main().catch(console.error)
