/**
 * Multi-Model OCR Comparison — เทียบความแม่นทุก vision model บน DO Gradient AI
 *
 * Usage: node backend/src/scripts/test-ocr-models.js
 */
const path = require('path')
const fs = require('fs')
const OpenAI = require('openai')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const { validateNationalId, cleanThaiName, cleanEnglishName } = require('../modules/passport/validation')

// ─── AI Client ───
const client = new OpenAI({
  baseURL: 'https://inference.do-ai.run/v1/',
  apiKey: process.env.MODEL_ACCESS_KEY
})

// ─── Prompt เดียวกับ production ───
const SYSTEM_PROMPT = `คุณเป็นระบบสกัดข้อมูลจากเอกสารราชการไทย สำหรับระบบลงทะเบียนนักเรียนแพทย์

สิ่งที่ต้องสกัด:
1. firstName — ชื่อภาษาไทย (ไม่รวมคำนำหน้า นาย/นาง/นางสาว/น.ส./ด.ช./ด.ญ. ไม่รวมชื่อกลาง)
2. lastName — นามสกุลภาษาไทย
3. firstNameEn — ชื่อภาษาอังกฤษ (ไม่รวม Mr./Mrs./Miss/Master ไม่รวมชื่อกลาง)
4. lastNameEn — นามสกุลอังกฤษ (ตัวแรกพิมพ์ใหญ่ ที่เหลือพิมพ์เล็ก)
5. nationalId — เลขประจำตัวประชาชน 13 หลัก
6. dateOfBirth — วันเกิดรูปแบบ dd/mm/yyyy ปี พ.ศ. เสมอ
   - บัตรประชาชน: อ่านจาก "เกิดวันที่" (เดือนไทย ม.ค.=01 ก.พ.=02 มี.ค.=03 เม.ย.=04 พ.ค.=05 มิ.ย.=06 ก.ค.=07 ส.ค.=08 ก.ย.=09 ต.ค.=10 พ.ย.=11 ธ.ค.=12)
   - พาสปอร์ต: "Date of Birth" เป็น ค.ศ. → แปลงเป็น พ.ศ. (+543)
   - ถ้าปีน้อยกว่า 2400 ให้บวก 543

หมายเหตุ:
- ถ้าเป็นพาสปอร์ต ให้อ่าน "Identification No." หรือ MRZ สำหรับเลข 13 หลัก
- ตอบ JSON เท่านั้น ไม่มีข้อความอื่น ไม่มี markdown`

const USER_PROMPT = `สกัดข้อมูลจากภาพเอกสารนี้สำหรับระบบลงทะเบียนนักเรียน

ถ้าอ่านได้:
{"firstName":"ชื่อไทย","lastName":"สกุลไทย","firstNameEn":"Name","lastNameEn":"Lastname","nationalId":"1234567890123","dateOfBirth":"dd/mm/yyyy"}

ถ้าอ่านไม่ได้:
{"error":"เหตุผล"}

สำคัญ: dateOfBirth ต้องเป็นปี พ.ศ. (25xx) เสมอ — ถ้าเห็นปี ค.ศ. (19xx/20xx) ให้บวก 543`

// ─── Cost guard: หยุดทันทีถ้าเกินงบ ───
const MAX_COST_PER_IMAGE_THB = 2.00

// ─── Models to test ───
// Full-size models ที่ยังไม่ได้ลอง — น่าจะแม่นกว่า mini/nano
const MODELS = [
  { id: 'openai-gpt-5', name: 'GPT-5', inputPrice: 1.25, outputPrice: 10.00 },
  { id: 'openai-gpt-5.4', name: 'GPT-5.4', inputPrice: 1.25, outputPrice: 10.00 },
  { id: 'openai-gpt-5.4-pro', name: 'GPT-5.4 Pro', inputPrice: 5.00, outputPrice: 20.00 },
]

// ─── Ground truth ───
const SAMPLES = [
  {
    file: '552000014648101.jpg',
    type: 'บัตร (เอียง, ถือมือ)',
    expected: { nationalId: '1101401166838', dateOfBirth: '30/01/2531', firstName: 'ศตาเมศ', lastName: 'เรืองธุรกิจ' }
  },
  {
    file: '555000009077401.jpg',
    type: 'บัตร (ชัด)',
    expected: { nationalId: '3301000145788', dateOfBirth: '08/05/2492', firstName: 'ฐิตินันท์', lastName: 'แก้วจันทรานนท์' }
  },
  {
    file: '07E49BE4-4755-41FB-AA29-08F02CA8221C.jpeg',
    type: 'บัตร (มืด, เอียง)',
    expected: { nationalId: '1610100065743', dateOfBirth: '26/07/2531', firstName: 'จิรศักดิ์', lastName: 'สิงห์ชัย' }
  },
  {
    file: 'FAY6YgMVEAg9Kna.jpg',
    type: 'บัตร (ชัดมาก)',
    expected: { nationalId: '1720900255678', dateOfBirth: '19/05/2543', firstName: 'กาญจนา', lastName: 'แผนสมบูรณ์' }
  },
  {
    file: 'qkn6ctpqayUcV1JlrSl-o.jpg',
    type: 'บัตร (ชัด, ตรง)',
    expected: { nationalId: '1409700121865', dateOfBirth: '10/09/2537', firstName: 'รัชนิกร', lastName: 'ชนะพันธ์' }
  },
  {
    file: 'image2.jpg',
    type: 'พาสปอร์ต (ชัด) — checksum ปลอม',
    expected: { nationalId: '0012345678913', dateOfBirth: '10/07/2536', firstName: 'มัณฑนิฎาส์', lastName: 'โปษณะสวัสดิ์วงศ์', checksumFail: true }
  },
  {
    file: 'passport-thai-mrp.jpg',
    type: 'พาสปอร์ต (เบลอ)',
    expected: { nationalId: '3100601111111', dateOfBirth: '01/05/2518', firstName: 'สิริกร', lastName: 'สุทธิวรรณ' }
  }
]

const SAMPLE_DIR = path.join(__dirname, '../../../ตัวอย่าง บัตรประชาชน และ พาสปอต')

// ─── Helper: แปลง ค.ศ. → พ.ศ. ───
function ensureBuddhistYear(dob) {
  if (!dob) return dob
  const parts = dob.split('/')
  if (parts.length !== 3) return dob
  let year = parseInt(parts[2], 10)
  if (year > 0 && year < 2400) year += 543
  return `${parts[0]}/${parts[1]}/${year}`
}

// ─── Scan with specific model ───
async function scanWithModel(modelId, base64Image, mimeType) {
  const dataUri = `data:${mimeType};base64,${base64Image}`

  // o3-mini ไม่รับ system message → merge เข้า user
  const isReasoning = modelId.includes('o3') || modelId.includes('o1')

  const messages = isReasoning
    ? [{
        role: 'user',
        content: [
          { type: 'text', text: SYSTEM_PROMPT + '\n\n' + USER_PROMPT },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } }
        ]
      }]
    : [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_PROMPT },
            { type: 'image_url', image_url: { url: dataUri, detail: 'high' } }
          ]
        }
      ]

  const params = {
    model: modelId,
    max_tokens: 800,
    messages
  }
  // reasoning models ไม่รับ temperature
  if (!isReasoning) params.temperature = 0

  const start = Date.now()
  const response = await client.chat.completions.create(params)
  const elapsed = Date.now() - start

  const aiText = response.choices[0]?.message?.content || ''
  const usage = response.usage || {}

  return { aiText, usage, elapsed }
}

// ─── Parse & validate OCR result ───
function parseOcrResult(aiText) {
  try {
    const cleaned = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned)

    if (parsed.error) return { success: false, error: parsed.error }
    if (!parsed.firstName || !parsed.nationalId) return { success: false, error: 'ข้อมูลไม่ครบ' }

    const thName = cleanThaiName(parsed.firstName, parsed.lastName)
    const dob = ensureBuddhistYear(parsed.dateOfBirth)
    const nidResult = validateNationalId(parsed.nationalId)

    return {
      success: true,
      checksumValid: nidResult.valid,
      data: {
        firstName: thName.firstName || parsed.firstName,
        lastName: thName.lastName || parsed.lastName,
        nationalId: nidResult.cleaned || parsed.nationalId?.replace(/\D/g, ''),
        dateOfBirth: dob
      }
    }
  } catch {
    return { success: false, error: 'JSON parse failed' }
  }
}

// ─── Compare fields ───
function compareFields(expected, actual) {
  if (!actual) return { match: false, detail: 'ไม่มีค่า' }
  if (expected === actual) return { match: true }
  return { match: false, detail: `"${actual}" (คาด "${expected}")` }
}

// ─── Estimate cost in THB ───
function estimateCost(usage, model) {
  const inputTokens = usage.prompt_tokens || 0
  const outputTokens = usage.completion_tokens || 0
  const costUSD = (inputTokens / 1e6) * model.inputPrice + (outputTokens / 1e6) * model.outputPrice
  const costTHB = costUSD * 34 // ~34 THB/USD
  return { inputTokens, outputTokens, costUSD, costTHB }
}

// ═══ Main Test Runner ═══
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  Multi-Model OCR Comparison — DO Gradient AI               ║')
  console.log('║  7 ตัวอย่าง × ' + MODELS.length + ' models                                    ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  // Pre-load all images
  const images = []
  for (const sample of SAMPLES) {
    const filePath = path.join(SAMPLE_DIR, sample.file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ไม่พบ: ${sample.file}`)
      continue
    }
    const buffer = fs.readFileSync(filePath)
    const base64 = buffer.toString('base64')
    const mime = sample.file.match(/\.png$/i) ? 'image/png' : 'image/jpeg'
    images.push({ ...sample, base64, mime })
  }

  console.log(`โหลดรูปสำเร็จ: ${images.length} ภาพ\n`)

  // Results per model
  const results = []

  for (const model of MODELS) {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`  🤖 ${model.name} (${model.id})`)
    console.log(`  💰 $${model.inputPrice}/$${model.outputPrice} per 1M tokens`)
    console.log('═'.repeat(60))

    let pass = 0, fail = 0, totalCostTHB = 0, totalTime = 0
    let modelFailed = false

    for (const img of images) {
      process.stdout.write(`  ${img.file.substring(0, 30).padEnd(32)}`)

      try {
        const { aiText, usage, elapsed } = await scanWithModel(model.id, img.base64, img.mime)
        totalTime += elapsed

        const result = parseOcrResult(aiText)
        const cost = estimateCost(usage, model)
        totalCostTHB += cost.costTHB

        // Cost guard — หยุดถ้าเกินงบ
        if (cost.costTHB > MAX_COST_PER_IMAGE_THB) {
          console.log(`🛑 ฿${cost.costTHB.toFixed(2)}/ภาพ เกินงบ ฿${MAX_COST_PER_IMAGE_THB}! หยุด.`)
          modelFailed = true
          break
        }

        if (!result.success) {
          // ถ้า expected checksum fail → ดูว่าอ่านเลขถูกไหม
          if (img.expected.checksumFail && result.error !== 'JSON parse failed') {
            console.log(`✅ (checksum reject ตามคาด) ${elapsed}ms ฿${cost.costTHB.toFixed(2)}`)
            pass++
          } else {
            console.log(`❌ ${result.error} ${elapsed}ms`)
            fail++
          }
          continue
        }

        // checksum fail expected → ดูว่า reject ได้ไหม
        if (img.expected.checksumFail) {
          if (!result.checksumValid) {
            console.log(`✅ (checksum reject ตามคาด) ${elapsed}ms ฿${cost.costTHB.toFixed(2)}`)
            pass++
          } else {
            console.log(`⚠️  checksum ควร fail แต่ผ่าน ${elapsed}ms`)
            fail++
          }
          continue
        }

        // Compare 4 fields
        const checks = {
          nid: compareFields(img.expected.nationalId, result.data.nationalId),
          dob: compareFields(img.expected.dateOfBirth, result.data.dateOfBirth),
          fn: compareFields(img.expected.firstName, result.data.firstName),
          ln: compareFields(img.expected.lastName, result.data.lastName),
        }

        const allMatch = Object.values(checks).every(c => c.match)
        if (allMatch) {
          console.log(`✅ ${elapsed}ms ฿${cost.costTHB.toFixed(2)}`)
          pass++
        } else {
          const fails = Object.entries(checks)
            .filter(([, c]) => !c.match)
            .map(([k, c]) => `${k}: ${c.detail}`)
            .join(' | ')
          console.log(`❌ ${fails} ${elapsed}ms`)
          fail++
        }
      } catch (err) {
        const errMsg = err.message || String(err)
        if (errMsg.includes('does not support') || errMsg.includes('not available') || errMsg.includes('400')) {
          console.log(`💥 Model ไม่รองรับ vision`)
          modelFailed = true
          break
        }
        console.log(`💥 ${errMsg.substring(0, 80)}`)
        fail++
      }
    }

    const total = pass + fail
    const accuracy = total > 0 ? (pass / total * 100).toFixed(0) : 0
    const avgCost = total > 0 ? (totalCostTHB / total) : 0
    const avgTime = total > 0 ? (totalTime / total / 1000).toFixed(1) : 0

    const modelResult = {
      name: model.name,
      id: model.id,
      accuracy: `${pass}/${total} (${accuracy}%)`,
      passCount: pass,
      totalCount: total,
      accuracyPct: total > 0 ? pass / total * 100 : 0,
      avgCostTHB: avgCost,
      avgTimeSec: parseFloat(avgTime),
      failed: modelFailed
    }
    results.push(modelResult)

    if (modelFailed) {
      console.log(`  ⛔ Model ไม่รองรับ vision — ข้าม`)
    } else {
      console.log(`  ─── สรุป: ${pass}/${total} (${accuracy}%) | เฉลี่ย ฿${avgCost.toFixed(2)}/ภาพ | ${avgTime}s/ภาพ`)
    }
  }

  // ═══ Final comparison table ═══
  console.log('\n\n')
  console.log('╔══════════════════════════════════════════════════════════════════════════╗')
  console.log('║                    🏆 สรุปเปรียบเทียบทุก Model                          ║')
  console.log('╠══════════════════════════════════════════════════════════════════════════╣')
  console.log('║ Model                   │ Accuracy    │ ฿/ภาพ    │ วินาที │ แนะนำ      ║')
  console.log('╠══════════════════════════════════════════════════════════════════════════╣')

  // Sort by accuracy desc, then cost asc
  const sorted = results
    .filter(r => !r.failed)
    .sort((a, b) => b.accuracyPct - a.accuracyPct || a.avgCostTHB - b.avgCostTHB)

  for (const r of sorted) {
    const name = r.name.padEnd(23)
    const acc = r.accuracy.padEnd(11)
    const cost = `฿${r.avgCostTHB.toFixed(2)}`.padEnd(8)
    const time = `${r.avgTimeSec}s`.padEnd(6)
    const isBest = r === sorted[0] ? '⭐ แม่นสุด' : r.avgCostTHB <= 0.05 ? '💰 ถูกสุด' : ''
    console.log(`║ ${name} │ ${acc} │ ${cost} │ ${time} │ ${isBest.padEnd(10)} ║`)
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════╝')

  // Best pick recommendation
  const bestAccuracy = sorted[0]
  const cheapest = [...sorted].sort((a, b) => a.avgCostTHB - b.avgCostTHB)[0]
  const bestValue = [...sorted].filter(r => r.accuracyPct >= 60).sort((a, b) => a.avgCostTHB - b.avgCostTHB)[0]

  console.log('\n📊 แนะนำ:')
  if (bestAccuracy) console.log(`  🏆 แม่นที่สุด: ${bestAccuracy.name} — ${bestAccuracy.accuracy} @ ฿${bestAccuracy.avgCostTHB.toFixed(2)}/ภาพ`)
  if (cheapest) console.log(`  💰 ถูกที่สุด:  ${cheapest.name} — ${cheapest.accuracy} @ ฿${cheapest.avgCostTHB.toFixed(2)}/ภาพ`)
  if (bestValue) console.log(`  ⚖️  คุ้มที่สุด: ${bestValue.name} — ${bestValue.accuracy} @ ฿${bestValue.avgCostTHB.toFixed(2)}/ภาพ`)
}

runAllTests().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
