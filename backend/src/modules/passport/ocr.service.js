const OpenAI = require('openai')
const { validateNationalId, cleanThaiName, cleanEnglishName, parseMrzLine1, parseMrzLine2 } = require('./validation')

// ─── OpenAI Client (ตรง ไม่ผ่าน DO) ───
// 2026-06-20: ย้ายจาก DO Gradient (tier limit) → OpenAI ตรง
function getAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// ─── Prompt: อ่านทุกอย่าง + MRZ ───
const SYSTEM_PROMPT = `คุณเป็นระบบสกัดข้อมูลจากเอกสารราชการไทย สำหรับระบบลงทะเบียนนักเรียนแพทย์

สิ่งที่ต้องสกัด:
1. firstName — ชื่อจริง (Given Name) ภาษาไทย (ไม่รวมคำนำหน้า นาย/นาง/นางสาว/น.ส./ด.ช./ด.ญ. ไม่รวมชื่อกลาง)
2. lastName — นามสกุล (Surname/Family Name) ภาษาไทย
3. firstNameEn — ชื่อจริง (Given Name) ภาษาอังกฤษ (ไม่รวม Mr./Mrs./Miss/Master ไม่รวมชื่อกลาง)
4. lastNameEn — นามสกุล (Surname) ภาษาอังกฤษ (ตัวแรกพิมพ์ใหญ่ ที่เหลือพิมพ์เล็ก)
   ⚠️ พาสปอร์ตจะเรียง "นามสกุล/Surname" ก่อน "ชื่อ/Given Names" — อย่าสลับ!
   - Surname → lastName/lastNameEn
   - Given Names → firstName/firstNameEn
5. nationalId — เลขประจำตัวประชาชน 13 หลัก (ต้องครบ 13 หลัก!)
   - บัตรประชาชน: อ่านจากบรรทัดบนสุดของบัตร รูปแบบ x-xxxx-xxxxx-xx-x
   - พาสปอร์ต: อ่านจาก "Identification No." หรือจาก MRZ
6. dateOfBirth — วันเกิดรูปแบบ dd/mm/yyyy ปี พ.ศ. เสมอ
   - บัตรประชาชน: อ่านจาก "เกิดวันที่" (ม.ค.=01 ก.พ.=02 มี.ค.=03 เม.ย.=04 พ.ค.=05 มิ.ย.=06 ก.ค.=07 ส.ค.=08 ก.ย.=09 ต.ค.=10 พ.ย.=11 ธ.ค.=12)
   - พาสปอร์ต: "Date of Birth" เป็น ค.ศ. → บวก 543
7. mrzLine1 — ถ้าเป็นพาสปอร์ต ให้อ่าน MRZ บรรทัดที่ 1 (บรรทัดที่ขึ้นต้นด้วย P<THA แล้วตามด้วยนามสกุล<<ชื่อ)
8. mrzLine2 — ถ้าเป็นพาสปอร์ต ให้อ่าน MRZ บรรทัดที่ 2 (บรรทัดล่างสุดที่มีตัวเลขและ < เยอะ) ใส่ครบทุกตัวอักษร

ตอบ JSON เท่านั้น ไม่มีข้อความอื่น ไม่มี markdown`

const USER_PROMPT = `สกัดข้อมูลจากภาพเอกสารนี้สำหรับระบบลงทะเบียนนักเรียน

ถ้าเป็นบัตรประชาชน:
{"firstName":"ชื่อไทย","lastName":"สกุลไทย","firstNameEn":"Name","lastNameEn":"Lastname","nationalId":"1234567890123","dateOfBirth":"dd/mm/yyyy"}

ถ้าเป็นพาสปอร์ต (ต้องมี mrzLine1 + mrzLine2):
{"firstName":"ชื่อไทย","lastName":"สกุลไทย","firstNameEn":"Name","lastNameEn":"Lastname","nationalId":"1234567890123","dateOfBirth":"dd/mm/yyyy","mrzLine1":"P<THALASTNAME<<FIRSTNAME<<<<<<<<<<<<<<<<<<<<<","mrzLine2":"AC12345674THA8802130M34031851101401196681<38"}

ถ้าอ่านไม่ได้:
{"error":"เหตุผล"}

สำคัญ: nationalId ต้องครบ 13 หลัก, dateOfBirth ต้องเป็นปี พ.ศ. (25xx)`

/**
 * แปลง ค.ศ. → พ.ศ. (safety net)
 */
function ensureBuddhistYear(dob) {
  if (!dob) return dob
  const parts = dob.split('/')
  if (parts.length !== 3) return dob
  let year = parseInt(parts[2], 10)
  if (year > 0 && year < 2400) year += 543
  return `${parts[0]}/${parts[1]}/${year}`
}

/**
 * Parse JSON จาก AI response
 */
function parseAiJson(aiText) {
  try {
    const cleaned = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleaned)
  } catch {
    return null
  }
}

/**
 * พยายามหา nationalId ที่ถูกต้อง:
 * 1. AI อ่านตรง → validate checksum
 * 2. MRZ parsing จาก mrzLine2 (ฟรี, ไม่เสียเงิน)
 */
function resolveNationalId(parsed) {
  // แหล่งที่ 1: AI อ่านตรง
  if (parsed.nationalId) {
    const result = validateNationalId(parsed.nationalId)
    if (result.valid) return { nid: result.cleaned, source: 'ai-direct' }
  }

  // แหล่งที่ 2: MRZ parsing (เฉพาะพาสปอร์ต)
  if (parsed.mrzLine2) {
    const mrzData = parseMrzLine2(parsed.mrzLine2)
    if (mrzData?.nationalId) {
      return { nid: mrzData.nationalId, source: 'mrz-parsed', mrzDob: mrzData.dateOfBirth }
    }
  }

  return null
}

/**
 * สแกนภาพบัตรประชาชน/พาสปอร์ต → สกัดข้อมูล
 * ถ้า checksum ไม่ผ่าน → ส่งข้อมูลอื่นกลับ + needsManualNid = true
 */
async function scanIdCard(imageBuffer, mimeType) {
  const base64Image = imageBuffer.toString('base64')
  const dataUri = `data:${mimeType};base64,${base64Image}`
  const client = getAIClient()

  // ═══ AI อ่านภาพ (OpenAI ตรง — gpt-4o vision) ═══
  const response = await client.chat.completions.create({
    model: process.env.PASSPORT_OCR_MODEL || 'gpt-4o',
    max_tokens: 800,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: USER_PROMPT },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } }
        ]
      }
    ]
  })

  const aiText = response.choices[0]?.message?.content || ''
  const parsed = parseAiJson(aiText)

  if (!parsed) {
    return { success: false, error: 'ไม่สามารถอ่านข้อมูลจากรูปได้ กรุณาถ่ายรูปใหม่ให้ชัดเจน', raw: aiText }
  }

  if (parsed.error) {
    return { success: false, error: parsed.error, raw: aiText }
  }

  if (!parsed.firstName || !parsed.lastName || !parsed.dateOfBirth) {
    return { success: false, error: 'อ่านข้อมูลไม่ครบ กรุณาถ่ายรูปใหม่ให้ชัดเจน', data: parsed, raw: aiText }
  }

  // Clean ชื่อ
  const thName = cleanThaiName(parsed.firstName, parsed.lastName)
  const enName = cleanEnglishName(parsed.firstNameEn, parsed.lastNameEn)
  const dob = ensureBuddhistYear(parsed.dateOfBirth)

  const baseData = {
    firstName: thName.firstName || parsed.firstName,
    lastName: thName.lastName || parsed.lastName,
    firstNameEn: enName.firstNameEn || parsed.firstNameEn || '',
    lastNameEn: enName.lastNameEn || parsed.lastNameEn || '',
    dateOfBirth: dob
  }

  // ═══ MRZ Line 1: cross-check ชื่อ (ไม่มีทางสลับ) ═══
  if (parsed.mrzLine1) {
    const mrzName = parseMrzLine1(parsed.mrzLine1)
    if (mrzName) {
      // ตรวจว่า AI สลับชื่อ-สกุลไหม (เทียบ AI firstNameEn กับ MRZ surname)
      const aiFirstEn = (baseData.firstNameEn || '').toLowerCase()
      const mrzSurname = (mrzName.surname || '').toLowerCase()
      const namesSwapped = aiFirstEn && mrzSurname &&
        (aiFirstEn === mrzSurname || mrzSurname.startsWith(aiFirstEn) || aiFirstEn.startsWith(mrzSurname))

      if (namesSwapped) {
        // AI สลับชื่อ-สกุล → swap Thai names ด้วย
        const tmpFirst = baseData.firstName
        baseData.firstName = baseData.lastName
        baseData.lastName = tmpFirst
        console.log(`[OCR] MRZ detected name swap → swapped Thai names`)
      }

      // MRZ ให้ชื่อถูกเสมอ → override ชื่ออังกฤษ
      if (mrzName.givenName) baseData.firstNameEn = mrzName.givenName
      if (mrzName.surname) baseData.lastNameEn = mrzName.surname
      console.log(`[OCR] MRZ Line 1 → ${mrzName.givenName} ${mrzName.surname}`)
    }
  }

  // ═══ หาเลข 13 หลักที่ถูกต้อง ═══
  const nidResolved = resolveNationalId(parsed)

  if (nidResolved) {
    // ใช้ DOB จาก MRZ ถ้ามี (แม่นกว่า)
    if (nidResolved.mrzDob) baseData.dateOfBirth = nidResolved.mrzDob

    console.log(`[OCR] สำเร็จ — NID: ${nidResolved.nid} (${nidResolved.source})`)

    return {
      success: true,
      data: { ...baseData, nationalId: nidResolved.nid },
      idCardImage: dataUri,
      raw: aiText,
      nidSource: nidResolved.source
    }
  }

  // ═══ Checksum ไม่ผ่าน → ส่งข้อมูลอื่นกลับ ให้ user กรอกเลขเอง ═══
  console.log(`[OCR] NID checksum ไม่ผ่าน — ส่งข้อมูลอื่นกลับ ให้ user กรอกเอง`)

  return {
    success: true,
    needsManualNid: true,
    data: { ...baseData, nationalId: '' },
    idCardImage: dataUri,
    raw: aiText
  }
}

module.exports = { scanIdCard }
