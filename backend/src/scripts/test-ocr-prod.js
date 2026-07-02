/**
 * Debug OCR ด้วย production prompt จริง
 */
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const { scanIdCard } = require('../modules/passport/ocr.service')

const SAMPLE_DIR = path.join(__dirname, '../../../ตัวอย่าง บัตรประชาชน และ พาสปอต')

async function testOne(filename) {
  const filePath = path.join(SAMPLE_DIR, filename)
  const buffer = fs.readFileSync(filePath)
  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

  console.log(`\n═══ ${filename} ═══`)
  const result = await scanIdCard(buffer, mime)
  console.log('success:', result.success)
  if (result.data) console.log('data:', JSON.stringify(result.data, null, 2))
  if (result.error) console.log('error:', result.error)
  console.log('RAW (first 800 chars):')
  console.log((result.raw || '').substring(0, 800))
  console.log('─────')
}

async function run() {
  await testOne('FAY6YgMVEAg9Kna.jpg')
  await testOne('qkn6ctpqayUcV1JlrSl-o.jpg')
}

run().catch(e => console.error('Error:', e.message))
