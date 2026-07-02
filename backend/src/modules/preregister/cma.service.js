// CMA (ศรว.) — cmathai.org public check
// 3-step flow:
//   1. GET  /Students/Auth                → warm session, get cookies
//   2. POST /Students/CheckUsernameSTD    → "1" = registered, "0" = not
//   3. GET  /Students/IdetifyYouID        → parse name + profile image URL

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const BASE = 'https://cmathai.org'

function mergeCookies(jar, setCookieArr) {
  if (!setCookieArr) return jar
  for (const c of setCookieArr) {
    const [pair] = c.split(';')
    const [name, ...val] = pair.split('=')
    if (name) jar[name.trim()] = val.join('=').trim()
  }
  return jar
}

function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

function cleanId(raw) {
  if (!raw) return ''
  return String(raw).replace(/[-\s]/g, '').trim()
}

// Step 1+2: เช็คว่าเลขนี้มีใน ศรว. ไหม → คืน { registered, jar }
async function checkRegistered(nationalId) {
  const id = cleanId(nationalId)
  if (!/^\d{13}$/.test(id)) {
    return { registered: false, jar: null, error: 'invalid_id_format' }
  }

  const jar = {}

  // Step 1: GET /Auth (warm session)
  const r1 = await fetch(`${BASE}/Students/Auth`, {
    headers: { 'User-Agent': UA }
  })
  mergeCookies(jar, r1.headers.getSetCookie?.() || [])

  // Step 2: POST /CheckUsernameSTD
  const r2 = await fetch(`${BASE}/Students/CheckUsernameSTD`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE}/Students/Auth`,
      'Cookie': cookieHeader(jar)
    },
    body: `username_id=${encodeURIComponent(id)}`
  })
  mergeCookies(jar, r2.headers.getSetCookie?.() || [])
  const body = (await r2.text()).trim()
  const registered = body === '1'

  return { registered, jar, raw: body }
}

// Step 3: ดึงรายละเอียดจาก /IdetifyYouID โดยใช้ jar เดิม
async function fetchDetail(jar) {
  const r = await fetch(`${BASE}/Students/IdetifyYouID`, {
    headers: {
      'User-Agent': UA,
      'Referer': `${BASE}/Students/Auth`,
      'Cookie': cookieHeader(jar)
    },
    redirect: 'manual'
  })
  if (r.status !== 200) {
    return { ok: false, reason: `http_${r.status}` }
  }
  const html = await r.text()

  // หากเปิด /IdetifyYouID ตรงโดยไม่ผ่าน check ก่อน → จะ redirect/HTML สั้น
  if (html.length < 5000) return { ok: false, reason: 'page_too_small' }

  const headings = [...html.matchAll(/<h([1-6])[^>]*>([^<]+)<\/h\1>/g)].map(m => m[2].trim()).filter(Boolean)

  // ชื่อไทย = heading ที่อยู่ก่อนชื่ออังกฤษ (มีพยัญชนะไทย)
  let nameTh = ''
  let nameEn = ''
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const hasThai = /[฀-๿]/.test(h)
    const isLikelyName = h.length > 3 && h.length < 80 &&
                         !['สมาชิก', 'เข้าสู่ระบบ', 'ID.', 'แผนผังเว็บไซต์', 'ข้อมูลติดต่อ', 'Login สมาชิก', 'กรณีสมัครสอบครั้งแรก'].includes(h)
    if (isLikelyName && hasThai && !nameTh) {
      nameTh = h
      // ดูถัดไปว่าเป็นชื่อ EN ไหม
      const next = headings[i + 1] || ''
      if (next && /^[A-Za-z\s.\-']+$/.test(next) && next.length > 2) {
        nameEn = next
      }
    }
  }

  // หา URL รูปโปรไฟล์
  let profileImageUrl = ''
  const imgMatch = html.match(/<img[^>]+src="(https?:\/\/cmathai\.org\/application_files\/[^"]+)"/i)
  if (imgMatch) profileImageUrl = imgMatch[1]

  // มี password input → ยังสอบไม่ครบ; ไม่มี → น่าจะสอบครบแล้ว (หรือ state อื่น)
  const hasPassword = /<input[^>]+type=["']password["']/i.test(html)
  const passedAll = !hasPassword && /สอบผ่านครบทุกขั้นตอน/.test(html)

  return {
    ok: true,
    nameTh,
    nameEn,
    profileImageUrl,
    passedAll,
    hasPassword
  }
}

// ดาวน์โหลดรูป → คืน data URI (เพื่อเก็บใน Mongo)
async function downloadImageAsDataUri(url, jar = null) {
  const headers = {
    'User-Agent': UA,
    'Referer': `${BASE}/Students/IdetifyYouID`
  }
  if (jar) headers['Cookie'] = cookieHeader(jar)
  const r = await fetch(url, { headers })
  if (!r.ok) return null
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length === 0 || buf.length > 5 * 1024 * 1024) return null  // > 5MB skip
  let ct = r.headers.get('content-type') || ''
  if (!ct.startsWith('image/')) {
    // เดาจาก url
    const ext = (url.split('.').pop() || '').toLowerCase().split('?')[0]
    const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
    ct = map[ext] || 'image/jpeg'
  }
  return `data:${ct};base64,${buf.toString('base64')}`
}

// ครบ flow: check + (ถ้าใช่) detail + รูป
async function syncOne(nationalId, opts = {}) {
  const { fetchImage = true } = opts
  const check = await checkRegistered(nationalId)
  if (!check.registered) {
    return {
      registered: false,
      raw: check.raw || null,
      error: check.error || null
    }
  }

  const detail = await fetchDetail(check.jar)
  if (!detail.ok) {
    return { registered: true, detailError: detail.reason }
  }

  let cmaProfileImage = ''
  if (fetchImage && detail.profileImageUrl) {
    try {
      cmaProfileImage = await downloadImageAsDataUri(detail.profileImageUrl, check.jar) || ''
    } catch (e) {
      cmaProfileImage = ''
    }
  }

  return {
    registered: true,
    nameTh: detail.nameTh,
    nameEn: detail.nameEn,
    profileImageUrl: detail.profileImageUrl,
    cmaProfileImage,
    passedAll: detail.passedAll
  }
}

module.exports = {
  cleanId,
  checkRegistered,
  fetchDetail,
  downloadImageAsDataUri,
  syncOne
}
