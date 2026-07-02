/**
 * Debug OCR — ดู raw AI response
 */
const path = require('path')
const fs = require('fs')
const OpenAI = require('openai')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const client = new OpenAI({
  baseURL: 'https://inference.do-ai.run/v1/',
  apiKey: process.env.MODEL_ACCESS_KEY
})

const SAMPLE_DIR = path.join(__dirname, '../../../ตัวอย่าง บัตรประชาชน และ พาสปอต')

async function testOne(filename) {
  const filePath = path.join(SAMPLE_DIR, filename)
  const buffer = fs.readFileSync(filePath)
  const base64 = buffer.toString('base64')
  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

  console.log(`\n═══ ${filename} ═══`)
  console.log('ส่งไป DO AI...')

  const response = await client.chat.completions.create({
    model: 'openai-gpt-4o',
    max_tokens: 1500,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'อ่านข้อมูลจากบัตรประชาชนไทยหรือพาสปอร์ตไทย ตอบเป็น JSON: {"firstName":"ชื่อไทย","lastName":"สกุลไทย","firstNameEn":"Name","lastNameEn":"Lastname","nationalId":"1234567890123","dateOfBirth":"dd/mm/yyyy"} ถ้าอ่านไม่ได้ตอบ {"error":"เหตุผล"}'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'อ่านข้อมูลจากภาพนี้' },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' } }
        ]
      }
    ]
  })

  const text = response.choices[0]?.message?.content || ''
  console.log('RAW RESPONSE:')
  console.log(text)
  console.log('─────────────')
}

async function run() {
  // ทดสอบ 2 ใบ: ชัดสุด + พาสปอร์ต
  await testOne('FAY6YgMVEAg9Kna.jpg')    // บัตรชัดมาก
  await testOne('image2.jpg')               // พาสปอร์ตชัด
}

run().catch(e => console.error('Error:', e.message))
