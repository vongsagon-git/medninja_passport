/**
 * Typhoon OCR 1.5 vs GPT-4o — Thai ID/Passport OCR Comparison
 *
 * ใช้ official Typhoon OCR library format (ดูจาก Python source code):
 * - user-only message (NO system message)
 * - Official v1.5 prompt
 * - max_tokens: 16384
 * - extra_body: { repetition_penalty: 1.1, temperature: 0.1, top_p: 0.6 }
 * - Resize image to max 1800px
 *
 * Usage: node backend/src/scripts/test-ocr-typhoon.js [-v]
 */
const path = require('path')
const fs = require('fs')
const OpenAI = require('openai')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const { validateNationalId, cleanThaiName } = require('../modules/passport/validation')

// ─── API Clients ───
const TYPHOON_API_KEY = process.env.TYPHOON_API_KEY || ''

const typhoonClient = new OpenAI({
  baseURL: 'https://api.opentyphoon.ai/v1',
  apiKey: TYPHOON_API_KEY
})

const gptClient = new OpenAI({
  baseURL: 'https://inference.do-ai.run/v1/',
  apiKey: process.env.MODEL_ACCESS_KEY
})

const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v')

// ─── Official Typhoon OCR v1.5 Prompt (from Python library source) ───
const TYPHOON_OCR_PROMPT = `Extract all text from the image.


Instructions:
- Only return the clean Markdown.
- Do not include any explanation or extra text.
- You must include all information on the page.


Formatting Rules:
- Tables: Render tables using <table>...</table> in clean HTML format.
- Equations: Render equations using LaTeX syntax with inline ($...$) and block ($$...$$).
- Images/Charts/Diagrams: Wrap any clearly defined visual areas (e.g. charts, diagrams, pictures) in:


<figure>
Describe the image's main elements (people, objects, text), note any contextual clues (place, event, culture), mention visible text and its meaning, provide deeper analysis when relevant (especially for financial charts, graphs, or documents), comment on style or architecture if relevant, then give a concise overall summary. Describe in Thai.
</figure>


- Page Numbers: Wrap page numbers in <page_number>...</page_number> (e.g., <page_number>14</page_number>).
- Checkboxes: Use ☐ for unchecked and ☑ for checked boxes.`

// ─── Parsing Prompt (for step 2) ───
const PARSE_SYSTEM_PROMPT = `คุณเป็นระบบสกัดข้อมูลจากเอกสารราชการไทย สำหรับระบบลงทะเบียนนักเรียนแพทย์

สิ่งที่ต้องสกัด:
1. firstName — ชื่อภาษาไทย (ไม่รวมคำนำหน้า นาย/นาง/นางสาว/น.ส./ด.ช./ด.ญ. ไม่รวมชื่อกลาง)
2. lastName — นามสกุลภาษาไทย
3. nationalId — เลขประจำตัวประชาชน 13 หลัก
4. dateOfBirth — วันเกิดรูปแบบ dd/mm/yyyy ปี พ.ศ. เสมอ
   - บัตรประชาชน: อ่านจาก "เกิดวันที่" (เดือนไทย ม.ค.=01 ก.พ.=02 มี.ค.=03 เม.ย.=04 พ.ค.=05 มิ.ย.=06 ก.ค.=07 ส.ค.=08 ก.ย.=09 ต.ค.=10 พ.ย.=11 ธ.ค.=12)
   - พาสปอร์ต: "Date of Birth" เป็น ค.ศ. → แปลงเป็น พ.ศ. (+543)
   - ถ้าปีน้อยกว่า 2400 ให้บวก 543

หมายเหตุ:
- ถ้าเป็นพาสปอร์ต ให้อ่าน "Identification No." หรือ MRZ สำหรับเลข 13 หลัก
- ตอบ JSON เท่านั้น ไม่มีข้อความอื่น ไม่มี markdown`

const GPT_USER_PROMPT = `สกัดข้อมูลจากภาพเอกสารนี้สำหรับระบบลงทะเบียนนักเรียน

ถ้าอ่านได้:
{"firstName":"ชื่อไทย","lastName":"สกุลไทย","nationalId":"1234567890123","dateOfBirth":"dd/mm/yyyy"}

ถ้าอ่านไม่ได้:
{"error":"เหตุผล"}

สำคัญ: dateOfBirth ต้องเป็นปี พ.ศ. (25xx) เสมอ — ถ้าเห็นปี ค.ศ. (19xx/20xx) ให้บวก 543`

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

// ─── Helpers ───
function ensureBuddhistYear(dob) {
  if (!dob) return dob
  const parts = dob.split('/')
  if (parts.length !== 3) return dob
  let year = parseInt(parts[2], 10)
  if (year > 0 && year < 2400) year += 543
  return `${parts[0]}/${parts[1]}/${year}`
}

function parseOcrResult(aiText) {
  try {
    const cleaned = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned)

    if (parsed.error && typeof parsed.error === 'string') {
      return { success: false, error: parsed.error.substring(0, 80) }
    }

    let firstName = parsed.firstName
    let lastName = parsed.lastName
    let nationalId = parsed.nationalId
    let dateOfBirth = parsed.dateOfBirth

    if (!firstName || !nationalId) return { success: false, error: 'ข้อมูลไม่ครบ' }

    // Clean nationalId (remove spaces/dashes)
    if (nationalId) nationalId = nationalId.replace(/[\s\-]/g, '')

    const thName = cleanThaiName(String(firstName), String(lastName || ''))
    const dob = ensureBuddhistYear(dateOfBirth)
    const nidResult = validateNationalId(nationalId)

    return {
      success: true,
      checksumValid: nidResult.valid,
      data: {
        firstName: thName.firstName || String(firstName),
        lastName: thName.lastName || String(lastName || ''),
        nationalId: nidResult.cleaned || nationalId.replace(/\D/g, ''),
        dateOfBirth: dob
      }
    }
  } catch (e) {
    if (VERBOSE) console.log(`\n     [Parse error] ${e.message}`)
    return { success: false, error: 'JSON parse failed' }
  }
}

function compareFields(expected, actual) {
  if (!actual) return { match: false, detail: 'ไม่มีค่า' }
  if (expected === actual) return { match: true }
  return { match: false, detail: `"${actual}" (คาด "${expected}")` }
}

// ═══ METHOD 1: Typhoon OCR 1.5 — official library format ═══
// Step 1: OCR (user-only, official prompt, official params)
// Step 2: Parse with text model → JSON
async function scanTyphoon15(base64Image, mimeType) {
  const dataUri = `data:${mimeType};base64,${base64Image}`
  const start = Date.now()

  // Step 1: OCR — ใช้ format ตรงตาม Python library
  // - user-only (NO system message!)
  // - Official v1.5 prompt
  // - max_tokens: 16384
  // - extra_body: repetition_penalty, temperature, top_p
  const ocrResponse = await typhoonClient.chat.completions.create({
    model: 'typhoon-ocr',
    max_tokens: 16384,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: TYPHOON_OCR_PROMPT },
        { type: 'image_url', image_url: { url: dataUri } }
      ]
    }],
    // @ts-ignore — extra params ตาม library source
    repetition_penalty: 1.1,
    temperature: 0.1,
    top_p: 0.6,
  })

  const rawText = ocrResponse.choices[0]?.message?.content || ''
  const ocrMs = Date.now() - start

  if (!rawText) throw new Error('OCR returned empty text')
  if (VERBOSE) console.log(`\n     [OCR v1.5 text] ${rawText.substring(0, 300)}...`)

  // Step 2: Parse with Typhoon text model (raw fetch เพราะ SDK มีปัญหา max_tokens)
  const parseStart = Date.now()
  const parseBody = JSON.stringify({
    model: 'typhoon-v2.5-30b-a3b-instruct',
    temperature: 0,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      { role: 'user', content: `ข้อมูลที่ OCR อ่านได้จากเอกสารราชการไทย (บัตรประชาชนหรือพาสปอร์ต):\n\n${rawText.substring(0, 3000)}\n\nสกัดข้อมูลเป็น JSON: {"firstName":"ชื่อไทย","lastName":"สกุลไทย","nationalId":"13หลัก","dateOfBirth":"dd/mm/yyyy"}` }
    ]
  })

  const parseRes = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TYPHOON_API_KEY}`
    },
    body: parseBody
  })

  if (!parseRes.ok) {
    const errText = await parseRes.text()
    throw new Error(`Parse ${parseRes.status}: ${errText.substring(0, 120)}`)
  }

  const parseData = await parseRes.json()
  const parseMs = Date.now() - parseStart
  const aiText = parseData.choices?.[0]?.message?.content || ''

  if (VERBOSE) console.log(`\n     [Parse result] ${aiText.substring(0, 200)}`)

  return { aiText, rawText, elapsed: ocrMs + parseMs, ocrMs, parseMs }
}

// ═══ METHOD 2: GPT-4o (baseline) ═══
async function scanGpt4o(base64Image, mimeType) {
  const dataUri = `data:${mimeType};base64,${base64Image}`
  const start = Date.now()

  const response = await gptClient.chat.completions.create({
    model: 'openai-gpt-4o',
    temperature: 0,
    max_tokens: 800,
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: GPT_USER_PROMPT },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } }
        ]
      }
    ]
  })

  const elapsed = Date.now() - start
  const aiText = response.choices[0]?.message?.content || ''

  return { aiText, elapsed }
}

// ═══ Score a result ═══
function scoreResult(img, aiText) {
  const result = parseOcrResult(aiText)

  if (!result.success) {
    if (img.expected.checksumFail && result.error !== 'JSON parse failed') {
      return { pass: true, detail: 'checksum reject ตามคาด' }
    }
    return { pass: false, detail: result.error, rawResponse: aiText?.substring(0, 120) }
  }

  if (img.expected.checksumFail) {
    return result.checksumValid
      ? { pass: false, detail: 'checksum ควร fail แต่ผ่าน' }
      : { pass: true, detail: 'checksum reject ตามคาด' }
  }

  const checks = {
    nid: compareFields(img.expected.nationalId, result.data.nationalId),
    dob: compareFields(img.expected.dateOfBirth, result.data.dateOfBirth),
    fn: compareFields(img.expected.firstName, result.data.firstName),
    ln: compareFields(img.expected.lastName, result.data.lastName),
  }

  const allMatch = Object.values(checks).every(c => c.match)
  if (allMatch) return { pass: true, detail: 'ALL MATCH' }

  const fails = Object.entries(checks)
    .filter(([, c]) => !c.match)
    .map(([k, c]) => `${k}: ${c.detail}`)
    .join(' | ')
  return { pass: false, detail: fails }
}

// ═══ Run tests ═══
async function runTests(name, images, scanFn) {
  console.log('═'.repeat(60))
  console.log(`  ${name}`)
  console.log('═'.repeat(60))

  let pass = 0, fail = 0, totalTime = 0

  for (const img of images) {
    const label = `${img.type}`.padEnd(35)
    process.stdout.write(`  ${label}`)

    try {
      const result = await scanFn(img)
      totalTime += result.elapsed

      const score = scoreResult(img, result.aiText)
      if (score.pass) {
        const timeInfo = result.ocrMs
          ? `OCR:${result.ocrMs}ms + Parse:${result.parseMs}ms`
          : `${result.elapsed}ms`
        console.log(`✅ ${score.detail} (${timeInfo})`)
        pass++
      } else {
        console.log(`❌ ${score.detail} (${result.elapsed}ms)`)
        if (score.rawResponse && !VERBOSE) console.log(`     ↳ Raw: ${score.rawResponse}`)
        fail++
      }
    } catch (err) {
      console.log(`💥 ${(err.message || String(err)).substring(0, 120)}`)
      fail++
    }
  }

  const total = pass + fail
  const acc = total > 0 ? (pass / total * 100).toFixed(0) : 0
  const avgTime = total > 0 ? (totalTime / total / 1000).toFixed(1) : 0
  console.log(`\n  สรุป: ${pass}/${total} (${acc}%) | เฉลี่ย ${avgTime}s/ภาพ\n`)

  return { pass, total, acc: parseInt(acc), avgTime }
}

// ═══ Main ═══
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  Typhoon OCR 1.5 vs GPT-4o — Official API Format           ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  if (VERBOSE) console.log('  (verbose mode: -v)')
  console.log()

  // Pre-load images
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
    images.push({ ...sample, base64, mime, filePath })
  }
  console.log(`โหลดรูป: ${images.length} ภาพ\n`)

  // ─── Test 1: Typhoon OCR 1.5 (official format) ───
  const typhoon = await runTests(
    '🌊 Typhoon OCR 1.5 → typhoon-v2.5-30b (official format)',
    images,
    (img) => scanTyphoon15(img.base64, img.mime)
  )

  // ─── Test 2: GPT-4o baseline ───
  const gpt4o = await runTests(
    '🤖 GPT-4o (openai-gpt-4o via DO AI)',
    images,
    (img) => scanGpt4o(img.base64, img.mime)
  )

  // ─── Final Comparison ───
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                    🏆 ผลเปรียบเทียบ                         ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  Typhoon OCR 1.5:  ${String(typhoon.pass).padStart(1)}/${typhoon.total} (${String(typhoon.acc).padStart(2)}%) | ${typhoon.avgTime}s | ฿ฟรี        ║`)
  console.log(`║  GPT-4o:           ${String(gpt4o.pass).padStart(1)}/${gpt4o.total} (${String(gpt4o.acc).padStart(2)}%) | ${gpt4o.avgTime}s | ~฿0.09/ภาพ   ║`)
  console.log('╚══════════════════════════════════════════════════════════════╝')

  if (typhoon.acc > gpt4o.acc) {
    console.log('\n🌊 Typhoon OCR 1.5 ชนะ! แม่นกว่า + ฟรี')
  } else if (typhoon.acc === gpt4o.acc) {
    console.log('\n🤝 เสมอกัน! แต่ Typhoon ฟรี')
  } else {
    console.log(`\n🤖 GPT-4o ยังแม่นกว่า (${gpt4o.acc}% vs ${typhoon.acc}%)`)
  }
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
