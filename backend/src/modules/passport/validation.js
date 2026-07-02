// ─── Thai National ID + Name Validation Utilities ───

/**
 * ตรวจ checksum เลขบัตรประชาชนไทย 13 หลัก
 * สูตร: Σ(d[i] × (13-i)) สำหรับ i=0..11, check = (11 - sum%11) % 10 === d[12]
 * @param {string} nid — เลข 13 หลัก (ตัวเลขล้วน)
 * @returns {{ valid: boolean, error?: string }}
 */
function validateNationalId(nid) {
  const clean = (nid || '').replace(/\D/g, '')
  if (clean.length !== 13) {
    return { valid: false, error: 'เลขบัตรประชาชนไม่ครบ 13 หลัก' }
  }

  const digits = clean.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i)
  }
  const checkDigit = (11 - (sum % 11)) % 10
  if (checkDigit !== digits[12]) {
    return { valid: false, error: 'เลขบัตรประชาชนไม่ถูกต้อง (checksum ไม่ผ่าน)' }
  }

  return { valid: true, cleaned: clean }
}

/**
 * ตัดคำนำหน้า + ชื่อกลางออกจากชื่อ
 */
const TH_PREFIXES = /^(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง)\s*/i
const EN_PREFIXES = /^(Mr\.|Mrs\.|Ms\.|Miss|Master)\s*/i

function cleanThaiName(firstName, lastName) {
  let cleanFirst = (firstName || '').replace(TH_PREFIXES, '').trim()
  if (cleanFirst.includes(' ')) cleanFirst = cleanFirst.split(' ')[0]
  const cleanLast = (lastName || '').replace(TH_PREFIXES, '').trim()
  return { firstName: cleanFirst, lastName: cleanLast }
}

function cleanEnglishName(firstName, lastName) {
  let cleanFirst = (firstName || '').replace(EN_PREFIXES, '').trim()
  if (cleanFirst.includes(' ')) cleanFirst = cleanFirst.split(' ')[0]
  const cleanLast = (lastName || '').replace(EN_PREFIXES, '').trim()
  return { firstNameEn: cleanFirst, lastNameEn: cleanLast }
}

/**
 * แกะเลขบัตรประชาชน 13 หลักจาก MRZ line 2 ของพาสปอร์ตไทย
 * MRZ TD3 Line 2 format (44 chars):
 *   [0-8]   Passport number
 *   [9]     Check digit
 *   [10-12] Nationality
 *   [13-18] DOB YYMMDD
 *   [19]    Check digit
 *   [20]    Sex
 *   [21-26] Expiry YYMMDD
 *   [27]    Check digit
 *   [28-41] Personal number (เลข 13 หลัก + filler <)
 *   [42]    Check digit
 *   [43]    Overall check
 *
 * @param {string} mrzLine2 — MRZ บรรทัดที่ 2
 * @returns {{ nationalId?: string, dateOfBirth?: string } | null}
 */
function parseMrzLine2(mrzLine2) {
  if (!mrzLine2) return null

  // ทำความสะอาด: เอาเฉพาะตัวอักษร ตัวเลข และ <
  const clean = mrzLine2.replace(/[^A-Z0-9<]/gi, '').toUpperCase()
  if (clean.length < 44) return null

  const result = {}

  // ดึงเลข 13 หลักจาก personal number field (position 28-40)
  const personalField = clean.substring(28, 42) // 14 chars including filler
  const nidMatch = personalField.match(/(\d{13})/)
  if (nidMatch) {
    const nid = nidMatch[1]
    const nidResult = validateNationalId(nid)
    if (nidResult.valid) {
      result.nationalId = nidResult.cleaned
    }
  }

  // ดึงวันเกิดจาก DOB field (position 13-18, YYMMDD)
  const dobField = clean.substring(13, 19)
  if (/^\d{6}$/.test(dobField)) {
    const yy = parseInt(dobField.substring(0, 2), 10)
    const mm = dobField.substring(2, 4)
    const dd = dobField.substring(4, 6)
    // แปลง YY → YYYY (ค.ศ.) → พ.ศ.
    const yyyy = (yy > 50 ? 1900 + yy : 2000 + yy) + 543
    result.dateOfBirth = `${dd}/${mm}/${yyyy}`
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * แกะชื่อ-สกุล (อังกฤษ) จาก MRZ Line 1 ของพาสปอร์ต
 * MRZ TD3 Line 1 format (44 chars):
 *   P<THA[SURNAME]<<[GIVEN NAMES]<<<...
 *
 * @param {string} mrzLine1 — MRZ บรรทัดที่ 1
 * @returns {{ surname?: string, givenName?: string } | null}
 */
function parseMrzLine1(mrzLine1) {
  if (!mrzLine1) return null

  const clean = mrzLine1.replace(/[^A-Z<]/gi, '').toUpperCase()
  if (clean.length < 10) return null

  // ตัด P<THA ออก (5 chars) → เหลือ NAME part
  const namePart = clean.substring(5)

  // แยก surname กับ given names ด้วย <<
  const parts = namePart.split('<<').filter(Boolean)
  if (parts.length < 2) return null

  // แปลง < เป็น space, capitalize
  const toName = (s) => s.replace(/</g, ' ').trim()
    .toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

  const surname = toName(parts[0])
  const givenName = toName(parts[1])

  if (!surname || !givenName) return null
  return { surname, givenName }
}

/**
 * ตรวจวันเกิด — อายุต้อง 15-40 ปี
 * @param {string} dob — dd/mm/yyyy (พ.ศ.)
 * @returns {{ valid: boolean, age?: number, error?: string }}
 */
function validateDateOfBirth(dob) {
  if (!dob) return { valid: false, error: 'ไม่มีวันเกิด' }
  const parts = dob.split('/')
  if (parts.length !== 3) return { valid: false, error: 'รูปแบบวันเกิดไม่ถูกต้อง' }

  const dd = parseInt(parts[0], 10)
  const mm = parseInt(parts[1], 10)
  const yyyy = parseInt(parts[2], 10) // พ.ศ.

  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 2480 || yyyy > 2570) {
    return { valid: false, error: 'วันเกิดไม่ถูกต้อง' }
  }

  // คำนวณอายุ (ใช้ พ.ศ.)
  const now = new Date()
  const currentBE = now.getFullYear() + 543
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  let age = currentBE - yyyy
  if (mm > currentMonth || (mm === currentMonth && dd > currentDay)) {
    age-- // ยังไม่ถึงวันเกิดปีนี้
  }

  if (age < 15 || age > 40) {
    return { valid: false, age, error: `อายุ ${age} ปี ไม่อยู่ในช่วง 15-40 ปี` }
  }

  return { valid: true, age }
}

module.exports = {
  validateNationalId,
  validateDateOfBirth,
  cleanThaiName,
  cleanEnglishName,
  parseMrzLine1,
  parseMrzLine2
}
