<script setup>
import { ref, computed, onMounted } from 'vue'
import { UNIVERSITIES_CHINA } from '../data/chinaUniversities'

// ═══════════════════════════════════════════════════════════
// ChinaLanding — สำหรับสัมมนา 2026-07-18 (นักศึกษาแพทย์ไทยในจีน 300+ คน)
// Flow: Landing → Assessment 30 ข้อ → Result → Lead Form → Thank You
// Concept: ทำแบบประเมิน + รับ PDF + สิทธิ์ปรึกษาหมอแตม 30 นาที ฟรี
// ═══════════════════════════════════════════════════════════

const SEMINAR_BATCH = '2026-07-18-china-seminar'

// ─── Assessment data (30 ข้อ 6 หมวด จาก MedNinja_Thai_Return_Checklist) ───
const CATEGORIES = [
  {
    key: 'officialPath',
    icon: '',
    color: '#0a1e3d',
    name: 'เส้นทางทางการ',
    questions: [
      'ฉันรู้ว่าต้องตรวจสอบข้อมูลจาก แพทยสภา/ศ.ร.ว. ที่ไหน',
      'ฉันมีรายชื่อเอกสารที่ต้องเตรียม',
      'ฉันรู้กำหนดเวลาคร่าว ๆ ของตัวเอง',
      'ฉันแยกเรื่องเอกสารออกจากเรื่องอ่านหนังสือได้',
      'ฉันรู้ว่าควรถามใครเมื่อกรณีของฉันไม่ตรงกับคนอื่น'
    ]
  },
  {
    key: 'knowledgeNL',
    icon: '',
    color: '#0a1e3d',
    name: 'ความรู้และ NL',
    questions: [
      'ฉันรู้วิชาที่ต้องจัดลำดับความสำคัญ',
      'ฉันทำ MCQ แบบ clinical vignette ได้',
      'ฉันมีบันทึกข้อผิดของตัวเอง',
      'ฉันรู้ว่าวิชาที่อ่อนของฉันคืออะไร',
      'ฉันมีแผนอ่านรายสัปดาห์'
    ]
  },
  {
    key: 'clinicalThinking',
    icon: '',
    color: '#0a1e3d',
    name: 'Clinical Thinking',
    questions: [
      'ฉัน approach fever ได้',
      'ฉัน approach chest pain / dyspnea ได้',
      'ฉันแยก anemia pattern ได้',
      'ฉันเลือก investigation ตามบริบทได้',
      'ฉันรู้ emergency red flags'
    ]
  },
  {
    key: 'labAndWard',
    icon: '',
    color: '#0a1e3d',
    name: 'Lab และ Ward',
    questions: [
      'ฉันอ่าน CBC เบื้องต้นได้',
      'ฉันอ่าน LFT / RFT / electrolyte เบื้องต้นได้',
      'ฉัน approach ABG ได้',
      'ฉันสรุป problem list ได้',
      'ฉันรู้ว่าก่อน ward round ต้องเตรียมอะไร'
    ]
  },
  {
    key: 'languageOsce',
    icon: '',
    color: '#0a1e3d',
    name: 'ภาษาและ OSCE',
    questions: [
      'ฉัน present case เป็นภาษาไทยได้',
      'ฉัน report lab เป็นภาษาไทยได้',
      'ฉันพูด differential diagnosis เป็นระบบได้',
      'ฉันฝึก history taking เป็นภาษาไทยได้',
      'ฉันรู้รูปแบบ OSCE ที่ต้องเตรียม'
    ]
  },
  {
    key: 'confidence',
    icon: '',
    color: '#0a1e3d',
    name: 'ความมั่นใจและระบบ',
    questions: [
      'ฉันไม่อ่านมั่วตามความกังวล',
      'ฉันรู้ขั้นตอนถัดไปของ 30 วันข้างหน้า',
      'ฉันมีคนหรือกลุ่มให้ถามเมื่อหลงทาง',
      'ฉันมีแผนแบบทดสอบจำลอง',
      'ฉันรู้ว่าต้องแก้ weakness ไหนก่อน'
    ]
  }
]

const SCORE_OPTIONS = [
  { value: 0, label: 'ยังไม่ได้เริ่ม', sub: 'ต้องเริ่มจากศูนย์', level: 'low' },
  { value: 1, label: 'พอทำได้บ้าง', sub: 'รู้บางส่วน ไม่แน่นพอ', level: 'mid' },
  { value: 2, label: 'ทำได้มั่นใจ', sub: 'พร้อมเจอข้อสอบ', level: 'high' }
]

const YEAR_OPTIONS = [
  'ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'ปี 5', 'ปี 6',
  'จบแล้ว', 'ฝึกงาน', 'อื่น ๆ'
]

// ⭐ PDF ที่ให้ดาวน์โหลดหลังกรอก form (ไม่ต้องรอ WeChat)
const PDF_URL = '/pdf/MedNinja_Thai_Return_Checklist.docx'

// ─── State ───
// ⭐ Flow ใหม่ (เก็บ lead ก่อน) — เน้น conversion สัมมนา
//    landing → gate (form 3 fields ก่อน) → assess (30 ข้อ) → result (PDF + 3 services)
const step = ref('landing')  // landing | gate | assess | result | thanks
const currentQ = ref(0)      // 0-29
const answers = ref(Array(30).fill(null))
const gateSubmitting = ref(false)
const gateError = ref('')

const form = ref({
  fullName: '',
  year: '',
  university: '',       // ค่า final: ถ้าเลือก dropdown ปกติ = ชื่อมหาลัย, ถ้า "อื่น ๆ" = จาก universityOther
  universitySelect: '', // ค่าใน dropdown (name หรือ '__OTHER__')
  universityOther: '',  // ถ้าเลือก "อื่น ๆ" กรอกเอง
  email: '',
  phoneTh: '',
  lineId: '',
  wechatId: ''
})
const submitting = ref(false)
const submitError = ref('')
const resultScore = ref(null)   // { totalScore, scoresByCategory, scoreBand }
const pdfDownloadUrl = ref('')  // signed URL จาก backend หลัง save lead สำเร็จ
const currentLeadId = ref('')   // เก็บ leadId เพื่อใช้ตอนฝากเบอร์ผู้ปกครอง
const resultUnlocked = ref(false)  // ⭐ ปลดล็อคผลคะแนน + PDF หลังกรอกฟอร์ม
const isReturning = ref(false)     // ⭐ user เดิม (upsert แทน create)

// ⭐ ผู้ปกครองฝากเบอร์ให้หมอโทรกลับ
const parentPhone = ref('')
const parentSubmitting = ref(false)
const parentSubmitted = ref(false)
const parentError = ref('')

// ⭐ Contact modal (landing page) — ฝากเบอร์ + LINE/WeChat
const contactOpen = ref(false)
const contactPhone = ref('')
const contactSubmitting = ref(false)
const contactSubmitted = ref(false)
const contactError = ref('')

function openContact() {
  contactOpen.value = true
  contactSubmitted.value = false
  contactError.value = ''
  contactPhone.value = ''
}

async function submitContactPhone() {
  contactError.value = ''
  const phone = contactPhone.value.trim()
  if (!phone || phone.length < 6) {
    contactError.value = 'กรุณากรอกเบอร์ให้ถูกต้อง'
    return
  }
  contactSubmitting.value = true
  try {
    // ส่ง lead แบบเบา — ไม่มี assessment/name/wechat
    const res = await fetch('/api/china/landing-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'ติดต่อจาก landing',
        phoneTh: phone,
        answers: [],
        seminarBatch: SEMINAR_BATCH
      })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'ส่งไม่สำเร็จ')
    }
    contactSubmitted.value = true
  } catch (e) {
    contactError.value = e.message
  } finally {
    contactSubmitting.value = false
  }
}

// resolved university (ใช้ตอน submit)
const resolvedUniversity = computed(() => {
  if (form.value.universitySelect === '__OTHER__') return form.value.universityOther.trim()
  return form.value.universitySelect
})

// ─── Computed ───
const currentQuestion = computed(() => {
  const catIdx = Math.floor(currentQ.value / 5)
  const qIdx = currentQ.value % 5
  return {
    category: CATEGORIES[catIdx],
    text: CATEGORIES[catIdx].questions[qIdx],
    catNum: catIdx + 1,
    qInCat: qIdx + 1
  }
})

const progressPct = computed(() => Math.round(((currentQ.value + (answers.value[currentQ.value] !== null ? 1 : 0)) / 30) * 100))

const totalScore = computed(() => answers.value.reduce((s, v) => s + (v || 0), 0))

const scoresByCategory = computed(() => {
  const scores = {}
  CATEGORIES.forEach((cat, gi) => {
    const start = gi * 5
    scores[cat.key] = answers.value.slice(start, start + 5).reduce((s, v) => s + (v || 0), 0)
  })
  return scores
})

const scoreBand = computed(() => {
  const pct = (totalScore.value / 60) * 100
  // ⭐ Band ตาม % ความพร้อม — สีสื่อสาร (progress semantics)
  if (pct >= 80) return { band: '80-100%', label: '💎 พร้อมสอบระดับดีเยี่ยม', desc: 'คุณอยู่ในระดับ Top — เน้นแบบทดสอบจำลองและปรับ fine detail', color: '#16a34a' }
  if (pct >= 60) return { band: '60-79%', label: '✨ พร้อมมาก', desc: 'ยังต้องปิดช่องว่างเฉพาะด้าน ทำ mock quiz + ฝึก present case', color: '#2563eb' }
  if (pct >= 40) return { band: '40-59%', label: '🎯 เริ่มพร้อม', desc: 'มีพื้นฐานดี ต้องเสริมจุดอ่อนและวางแผนอ่านต่อ 30 วัน', color: '#f59e0b' }
  if (pct >= 20) return { band: '20-39%', label: '📚 เริ่มเตรียมตัว', desc: 'ยังไม่รู้จุดอ่อนชัด ทำแผนอ่าน + MCQ + บันทึกข้อผิด', color: '#f97316' }
  return { band: '0-19%', label: '🚀 เริ่มต้นจากศูนย์', desc: 'ยังต้องเริ่มจากรากฐาน — เส้นทางทางการ วิชาที่สำคัญ ประเมินซ้ำใน 30 วัน', color: '#dc2626' }
})

const weakCategories = computed(() => {
  return CATEGORIES
    .map(c => ({ ...c, score: scoresByCategory.value[c.key] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
})

// ⭐ Validation rules (กันกรอกมั่ว)
const nameError = computed(() => {
  const v = form.value.fullName.trim()
  if (!v) return ''
  if (v.length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
  if (/^\d+$/.test(v)) return 'ชื่อไม่ควรเป็นตัวเลขล้วน'
  if (/^([a-zA-Z0-9])\1+$/.test(v)) return 'กรุณากรอกชื่อจริง'
  if (/^(asdf|qwer|test|xxx|aaaa|1234)/i.test(v)) return 'กรุณากรอกชื่อจริง'
  return ''
})
const universityError = computed(() => {
  const v = resolvedUniversity.value.trim()
  if (!v) return ''
  if (v.length < 3) return 'กรุณาระบุชื่อมหาลัยให้ถูกต้อง'
  return ''
})
const wechatError = computed(() => {
  const v = form.value.wechatId.trim()
  if (!v) return ''
  if (v.length < 4) return 'WeChat ID ต้องมีอย่างน้อย 4 ตัว'
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'WeChat ID = อังกฤษ/ตัวเลข/_/- เท่านั้น'
  return ''
})

const canSubmitForm = computed(() => {
  const f = form.value
  const hasName = f.fullName.trim().length >= 2 && !nameError.value
  const hasUniversity = resolvedUniversity.value.length >= 3 && !universityError.value
  const hasWechat = f.wechatId.trim().length >= 4 && !wechatError.value
  return hasName && hasUniversity && hasWechat
})

// ─── Actions ───
// ⭐ Landing "เริ่มทำแบบประเมิน" → เปิด gate form ก่อน (บังคับเก็บ lead)
// ⭐ intent = 'pdf' (fast lane — ตอนบรรยาย) หรือ 'full' (ทำแบบทดสอบ + 4 สิทธิ์)
const intent = ref('full')

function startPdfOnly() {
  intent.value = 'pdf'
  step.value = 'gate'
  scrollTop()
}
function startAssessment() {
  intent.value = 'full'
  step.value = 'gate'
  scrollTop()
}

// ⭐ Gate form submit → save lead → เข้า assessment
async function submitGate() {
  gateError.value = ''
  if (!canSubmitForm.value) {
    gateError.value = 'กรุณากรอก ชื่อ + มหาลัย + WeChat ID ให้ครบก่อน'
    return
  }
  gateSubmitting.value = true
  try {
    const payload = {
      fullName: form.value.fullName.trim(),
      year: form.value.year,
      university: resolvedUniversity.value,
      email: form.value.email.trim(),
      phoneTh: form.value.phoneTh.trim(),
      lineId: form.value.lineId.trim(),
      wechatId: form.value.wechatId.trim(),
      answers: [],                                  // ยังไม่ได้ทำ assessment
      seminarBatch: SEMINAR_BATCH,
      leadTier: intent.value                        // ⭐ 'pdf' | 'full'
    }
    const res = await fetch('/api/china/landing-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'บันทึกไม่สำเร็จ')
    // เก็บ leadId + pdfUrl ไว้ใช้ตอน result
    currentLeadId.value = data.leadId || ''
    pdfDownloadUrl.value = data.pdfUrl || ''
    isReturning.value = !!data.isReturning
    try {
      localStorage.setItem('mn_china_lead_id', currentLeadId.value)
      localStorage.setItem('mn_china_lead_form', JSON.stringify({
        fullName: form.value.fullName,
        year: form.value.year,
        university: form.value.university,
        universitySelect: form.value.universitySelect,
        universityOther: form.value.universityOther,
        email: form.value.email,
        phoneTh: form.value.phoneTh,
        lineId: form.value.lineId,
        wechatId: form.value.wechatId
      }))
    } catch {}

    // ⭐ Branch flow: PDF-only (fast lane บรรยาย) หรือ Full (assessment)
    if (intent.value === 'pdf') {
      // Fast lane: auto download PDF + ไปหน้า thanks เลย
      if (pdfDownloadUrl.value) downloadPdf()
      step.value = 'thanks'
    } else {
      // Full lane: ทำแบบทดสอบ
      step.value = 'assess'
      currentQ.value = 0
    }
    scrollTop()
  } catch (e) {
    gateError.value = e.message
  } finally {
    gateSubmitting.value = false
  }
}

function selectAnswer(val) {
  answers.value[currentQ.value] = val
  // auto next after 300ms
  setTimeout(() => {
    if (currentQ.value < 29) currentQ.value++
    else finishAssessment()
    scrollTop()
  }, 300)
}

function prevQuestion() {
  if (currentQ.value > 0) {
    currentQ.value--
    scrollTop()
  }
}

async function finishAssessment() {
  resultScore.value = {
    totalScore: totalScore.value,
    scoresByCategory: scoresByCategory.value,
    scoreBand: scoreBand.value.band
  }
  resultUnlocked.value = true
  step.value = 'result'
  scrollTop()

  // ⭐ Fire-and-forget: PATCH answers ไปที่ lead เดิม (ไม่ block UX)
  if (currentLeadId.value) {
    fetch(`/api/china/landing-lead/${currentLeadId.value}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answers.value.map(v => v || 0) })
    }).catch(() => {})
  }
}

// ⭐ Track ตอน user กด service (WeChat / VDO Call / Discount)
async function trackInterest(kind) {
  if (!currentLeadId.value) return
  fetch(`/api/china/landing-lead/${currentLeadId.value}/interest`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind })
  }).catch(() => {})
}

// ⭐ Service action modal state
const serviceModal = ref(null)  // { kind, title, message, code? }
const copiedField = ref('')     // 'id' | 'code' | 'message' — สำหรับ toast

const WECHAT_ID = 'medninja'
const WECHAT_DEEP_LINKS = [
  `weixin://dl/chat?${WECHAT_ID}`,
  `weixin://dl/add?u=${WECHAT_ID}`,
  `weixin://dl/publicaccount/?username=${WECHAT_ID}`
]
const DISCOUNT_CODE = 'MEDNINJA-CHINA-10'

function openService(kind) {
  trackInterest(kind)
  const name = form.value.fullName || 'คุณ'
  const configs = {
    wechat: {
      kind: 'wechat',
      icon: '💬',
      title: 'ทัก WeChat หมอแตม',
      wechatId: WECHAT_ID,
      message: `สวัสดีค่ะ ${name} จากแบบทดสอบ /china ค่ะ`,
      note: 'ทักไปแล้วบอกชื่อ ทีมงานจะติดต่อกลับเร็ว ๆ นี้'
    },
    vdocall: {
      kind: 'vdocall',
      icon: '📹',
      title: 'ขอนัด Zoom ปรึกษา 30 นาที',
      wechatId: WECHAT_ID,
      message: `ขอนัด Zoom ปรึกษา 30 นาที\nชื่อ: ${name}\nจาก /china แบบทดสอบ`,
      note: 'ส่งข้อความนี้ใน WeChat ทีมงานจะนัดวันเวลาให้'
    },
    discount: {
      kind: 'discount',
      icon: '🎁',
      title: 'ส่วนลด 10% ทุกคอร์ส',
      wechatId: WECHAT_ID,
      code: DISCOUNT_CODE,
      message: `ขอใช้ส่วนลด 10%\nCode: ${DISCOUNT_CODE}\nชื่อ: ${name}`,
      note: 'ใช้ได้กับทุกคอร์ส (NL 1+2 / MEQ / OSCE) แจ้งชื่อกับทีมงาน WeChat',
      link: 'https://passport.medninja.academy'
    }
  }
  serviceModal.value = configs[kind]
  copiedField.value = ''
}
function closeService() { serviceModal.value = null }

async function tryDeepLink() {
  // Fire deep link (open WeChat app if installed)
  const link = WECHAT_DEEP_LINKS[0]
  const start = Date.now()
  window.location.href = link
  // ถ้า WeChat เปิด → visibilityState change → เราไม่ redirect
  // ถ้า fail → user เห็น popup QR ค้างต่อ (fallback in-place)
  setTimeout(() => {
    if (Date.now() - start < 1500 && document.visibilityState === 'visible') {
      // WeChat ไม่เปิด — popup ยังเปิดอยู่ user เห็น QR + copy อยู่แล้ว
    }
  }, 500)
}

async function copyToClipboard(text, field) {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => { copiedField.value = '' }, 2000)
  } catch {
    // fallback: create textarea
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    copiedField.value = field
    setTimeout(() => { copiedField.value = '' }, 2000)
  }
}

function downloadPdf() {
  if (!pdfDownloadUrl.value) return
  const a = document.createElement('a')
  a.href = pdfDownloadUrl.value
  a.download = 'MedNinja_Thai_Return_Checklist.docx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ⭐ กด "ส่ง + โหลด PDF" — validate → save lead → backend คืน pdfUrl → download + ไป thanks
async function submitAndDownload() {
  submitError.value = ''
  if (!canSubmitForm.value) {
    submitError.value = 'กรุณากรอก ชื่อ + มหาลัย + WeChat ID ให้ครบก่อน'
    return
  }
  submitting.value = true
  try {
    const payload = {
      fullName: form.value.fullName.trim(),
      year: form.value.year,
      university: resolvedUniversity.value,
      email: form.value.email.trim(),
      phoneTh: form.value.phoneTh.trim(),
      lineId: form.value.lineId.trim(),
      wechatId: form.value.wechatId.trim(),
      answers: answers.value.map(v => v || 0),
      seminarBatch: SEMINAR_BATCH
    }
    const res = await fetch('/api/china/landing-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'ส่งไม่สำเร็จ')

    // ⭐ ได้ pdfUrl signed จาก backend → unlock ผล + download PDF
    pdfDownloadUrl.value = data.pdfUrl || ''
    currentLeadId.value = data.leadId || ''
    resultUnlocked.value = true
    if (pdfDownloadUrl.value) downloadPdf()
    // scroll ไปที่ผลคะแนนที่เพิ่งปลดล็อค
    setTimeout(() => {
      const el = document.querySelector('.result-preview')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  } catch (e) {
    submitError.value = e.message
  } finally {
    submitting.value = false
  }
}

// ⭐ ผู้ปกครองฝากเบอร์ให้หมอโทรกลับ (Thank You page)
async function submitParentPhone() {
  parentError.value = ''
  const phone = parentPhone.value.trim()
  if (!phone || phone.length < 6) {
    parentError.value = 'กรุณากรอกเบอร์ให้ถูกต้อง'
    return
  }
  parentSubmitting.value = true
  try {
    const res = await fetch('/api/china/landing-parent-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: currentLeadId.value,
        parentPhone: phone
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'ส่งไม่สำเร็จ')
    parentSubmitted.value = true
  } catch (e) {
    parentError.value = e.message
  } finally {
    parentSubmitting.value = false
  }
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openLine() {
  window.open('https://lin.ee/nEEK4Kv', '_blank')
}

onMounted(() => {
  document.title = 'MedNinja — เตรียมกลับไทย สำหรับนักศึกษาแพทย์ไทยในจีน'
  // ⭐ Auto-fill จาก localStorage (user เดิม กลับมา ไม่ต้องกรอกซ้ำ)
  try {
    const cached = localStorage.getItem('mn_china_lead_form')
    if (cached) {
      const parsed = JSON.parse(cached)
      Object.assign(form.value, parsed)
    }
  } catch {}
})
</script>

<template>
  <div class="page" :class="`step-${step}`">

    <!-- ═══════════════ STEP 1: LANDING ═══════════════ -->
    <section v-if="step === 'landing'" class="landing">
      <div class="hero-bg"></div>

      <header class="topbar">
        <div class="brand">
          <span class="brand-name">MedNinja</span>
        </div>
        <div class="badge-cn">
          <span class="dot"></span>
          🇨🇳 เรียนได้ไม่ต้อง VPN
        </div>
      </header>

      <div class="hero">
        <div class="hero-visual">
          <div class="hv-side hv-mascot">
            <img src="/img/mascot.png" alt="MedNinja" class="hero-mascot" />
          </div>
          <div class="hv-side hv-china">
            <div class="china-emblem">
              <div class="china-flag">
                <div class="cn-star cn-star-big">★</div>
                <div class="cn-star cn-star-1">★</div>
                <div class="cn-star cn-star-2">★</div>
                <div class="cn-star cn-star-3">★</div>
                <div class="cn-star cn-star-4">★</div>
              </div>
              <div class="china-label">
                <span class="cn-hanzi">中国</span>
                <span class="cn-en">CHINA</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-badge">🎓 นักศึกษาแพทย์ไทยในจีน</div>

        <h1 class="hero-title">
          พร้อม<span class="hl-red">กลับไทย</span>หรือยัง?
        </h1>

        <p class="hero-sub">
          ประเมินตัวเอง <b>30 ข้อ</b> ใน 3 นาที<br />
          รับ <b class="nb">PDF Checklist การเตรียมความพร้อม</b>
          <br />
          <b class="nb">+ ปรึกษาหมอแตมแบบส่วนตัว</b>
        </p>

        <div class="products-row">
          <span class="p-word nl">NL 1+2</span>
          <span class="p-dot">·</span>
          <span class="p-word meq">MEQ</span>
          <span class="p-dot">·</span>
          <span class="p-word osce">OSCE</span>
        </div>

        <!-- ⭐ 2 ปุ่มธรรมดา (ไม่เทียบ — รายละเอียดไปโชว์ที่ gate) -->
        <div class="dual-cta">
          <button class="cta-pdf" @click="startPdfOnly">
            <span class="cta-icon">📥</span>
            <span class="cta-title">กรอกเพื่อรับ PDF</span>
          </button>
          <button class="cta-primary cta-full" @click="startAssessment">
            <span class="cta-icon">🎯</span>
            <span class="cta-title">ทำแบบสอบถาม รับสิทธิ์</span>
          </button>
        </div>

        <div class="cta-secondary-row">
          <button class="cta-contact" @click="openContact">
            ติดต่อเรา
          </button>
          <a class="cta-contact" href="https://passport.medninja.academy" rel="noopener">
            เข้าเว็บหลัก →
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════ Contact Modal — ฝากเบอร์ + LINE/WeChat ═══════════════ -->
    <div v-if="contactOpen" class="contact-modal" @click.self="contactOpen = false">
      <div class="cm-card">
        <button class="cm-close" @click="contactOpen = false">✕</button>
        <div class="cm-title">💬 ติดต่อเรา</div>
        <div class="cm-sub">ทีมงานจะโทรกลับ / ทัก LINE / WeChat</div>

        <!-- ฝากเบอร์ให้โทรกลับ -->
        <div class="cm-callback">
          <div class="cm-cb-title">📞 ฝากเบอร์ให้ทีมงานโทรกลับ</div>
          <div class="cm-cb-hint">ผู้ปกครอง หรือ นักเรียน — ใครก็ฝากได้</div>

          <div v-if="contactSubmitted" class="cm-cb-success">
            ✅ ได้รับเบอร์แล้ว ทีมงานจะโทรกลับเร็ว ๆ นี้
          </div>
          <div v-else>
            <div class="cm-cb-form">
              <input
                v-model="contactPhone"
                type="tel"
                placeholder="เบอร์โทร เช่น 081-234-5678"
                class="cm-cb-input"
                :disabled="contactSubmitting"
              />
              <button
                class="cm-cb-btn"
                :disabled="!contactPhone.trim() || contactSubmitting"
                @click="submitContactPhone"
              >
                <span v-if="contactSubmitting">...</span>
                <span v-else>ฝาก</span>
              </button>
            </div>
            <div v-if="contactError" class="cm-cb-error">⚠ {{ contactError }}</div>
          </div>
        </div>

        <div class="cm-or">— หรือทักหาเราโดยตรง —</div>

        <!-- QR WeChat -->
        <div class="cm-qr">
          <img src="/img/wechat-qr.png" alt="WeChat MedNinja QR" class="cm-qr-img" />
          <div class="cm-qr-label">📱 สแกน QR เพิ่ม WeChat</div>
        </div>

        <div class="cm-list">
          <div class="cm-item">
            <div class="cm-label">LINE</div>
            <div class="cm-id">@medninja</div>
          </div>
          <div class="cm-item">
            <div class="cm-label">WeChat</div>
            <div class="cm-id">medninja</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ STEP 1.5: GATE FORM (บังคับกรอกก่อน) ═══════════════ -->
    <section v-if="step === 'gate'" class="gate">
      <div class="gate-inner">
        <div class="gate-header">
          <div v-if="form.fullName && form.wechatId" class="gate-back-badge">
            ✓ ยินดีต้อนรับกลับมา {{ form.fullName }}
          </div>
          <div v-else class="gate-badge" :class="intent === 'pdf' ? 'badge-pdf' : 'badge-full'">
            {{ intent === 'pdf' ? '📥 กรอกเพื่อรับ PDF' : '🎯 ทำแบบสอบถาม รับสิทธิ์' }}
          </div>
          <h2 class="gate-title" v-if="intent === 'pdf'">
            กรอกข้อมูลเพื่อ<br />
            <span class="gate-highlight">รับ PDF ฟรี</span>
          </h2>
          <h2 class="gate-title" v-else>
            กรอกเพื่อทำแบบสอบถาม<br />
            รับ <span class="gate-highlight">4 สิทธิ์พิเศษ</span>
          </h2>
          <p class="gate-sub">
            <template v-if="intent === 'pdf'">15 วินาที · โหลด PDF ทันที</template>
            <template v-else>3 นาที · ทีมงานติดต่อคุณทาง WeChat</template>
          </p>
        </div>

        <!-- Perks ตาม intent -->
        <div class="gate-perks">
          <div class="perks-title">📌 คุณจะได้รับ:</div>
          <template v-if="intent === 'pdf'">
            <div class="perk-item"><span class="perk-dot">1</span> PDF Checklist การเตรียมความพร้อม (โหลดทันที)</div>
          </template>
          <template v-else>
            <div class="perk-item"><span class="perk-dot">1</span> PDF Checklist การเตรียมความพร้อม</div>
            <div class="perk-item"><span class="perk-dot">2</span> คะแนน 6 หมวด + จุดอ่อนของคุณ</div>
            <div class="perk-item"><span class="perk-dot">3</span> ปรึกษาหมอแตม <b>ตัวต่อตัว</b> 30 นาที ฟรี</div>
            <div class="perk-item highlight"><span class="perk-dot">4</span> <b>ส่วนลด 10%</b> (แสดงบัตร นศ.จีน + แจ้งงานสัมมนา)</div>
          </template>
        </div>

        <div class="gate-form">
          <div class="lf-field">
            <label>ชื่อจริง <span class="req">*</span></label>
            <input v-model="form.fullName" type="text" placeholder="ชื่อ นามสกุล" maxlength="80" :disabled="gateSubmitting" />
            <div v-if="nameError" class="field-error">{{ nameError }}</div>
          </div>
          <div class="lf-field">
            <label>มหาลัยที่กำลังเรียน <span class="req">*</span></label>
            <select v-model="form.universitySelect" :disabled="gateSubmitting">
              <option value="">— เลือกมหาลัย —</option>
              <option v-for="u in UNIVERSITIES_CHINA" :key="u.id" :value="u.name">
                {{ u.name }} ({{ u.city }})
              </option>
              <option value="__OTHER__">— อื่น ๆ (กรอกเอง) —</option>
            </select>
            <input
              v-if="form.universitySelect === '__OTHER__'"
              v-model="form.universityOther"
              type="text"
              placeholder="ชื่อมหาลัย + เมือง"
              class="lf-other-input"
              maxlength="120"
              :disabled="gateSubmitting"
            />
            <div v-if="universityError" class="field-error">{{ universityError }}</div>
          </div>
          <div class="lf-field">
            <label>ปีที่เรียน</label>
            <select v-model="form.year" :disabled="gateSubmitting">
              <option value="">— เลือก —</option>
              <option v-for="y in YEAR_OPTIONS" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="lf-field lf-primary">
            <label>💬 WeChat ID <span class="req">*</span> <span class="tag main">ช่องทางหลัก</span></label>
            <input v-model="form.wechatId" type="text" placeholder="wechat-id (a-z, 0-9, _)" maxlength="40" :disabled="gateSubmitting" />
            <div class="lf-hint-inline">ทีมงานจะติดต่อคุณผ่าน WeChat</div>
            <div v-if="wechatError" class="field-error">{{ wechatError }}</div>
          </div>

          <details class="lf-more">
            <summary>+ เพิ่มช่องทางสำรอง (ถ้าต้องการ)</summary>
            <div class="lf-more-body">
              <div class="lf-field lf-line">
                <label>💚 LINE ID</label>
                <input v-model="form.lineId" type="text" placeholder="line-id" :disabled="gateSubmitting" />
              </div>
              <div class="lf-field">
                <label>📱 เบอร์ไทย</label>
                <input v-model="form.phoneTh" type="tel" placeholder="08x-xxx-xxxx" :disabled="gateSubmitting" />
              </div>
              <div class="lf-field">
                <label>📧 Email</label>
                <input v-model="form.email" type="email" placeholder="you@example.com" :disabled="gateSubmitting" />
              </div>
            </div>
          </details>

          <div v-if="gateError" class="lf-error">⚠ {{ gateError }}</div>

          <button class="cta-primary" :disabled="!canSubmitForm || gateSubmitting" @click="submitGate">
            <span v-if="gateSubmitting">กำลังบันทึก...</span>
            <span v-else-if="!canSubmitForm">🔒 กรอก ชื่อ + มหาลัย + WeChat ให้ครบ</span>
            <span v-else-if="intent === 'pdf'">📥 บันทึก + โหลด PDF</span>
            <span v-else>🎯 เริ่มทำแบบสอบถาม 30 ข้อ</span>
          </button>

          <button class="q-back gate-back" @click="step = 'landing'; scrollTop()">← ย้อนกลับ</button>

          <p class="gate-privacy">🔒 ข้อมูลใช้สำหรับติดต่อทีมงานเท่านั้น</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════ STEP 2: ASSESSMENT ═══════════════ -->
    <section v-if="step === 'assess'" class="assess">
      <div class="assess-header">
        <div class="a-brand">
          <img src="/img/mascot.png" alt="MedNinja" class="a-mark" />
          <span>แบบประเมินความพร้อม</span>
        </div>
        <div class="a-progress-num">{{ currentQ + 1 }} / 30</div>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${progressPct}%`, background: currentQuestion.category.color }"></div>
      </div>

      <div class="q-container">
        <transition name="q-slide" mode="out-in">
          <div :key="currentQ" class="q-slide-wrap">
            <div class="q-cat" :style="{ color: currentQuestion.category.color }">
              <span class="q-cat-icon">{{ currentQuestion.category.icon }}</span>
              <span class="q-cat-name">{{ currentQuestion.category.name }}</span>
              <span class="q-cat-num">ข้อ {{ currentQuestion.qInCat }}/5</span>
            </div>

            <h2 class="q-text">{{ currentQuestion.text }}</h2>

            <div class="q-options">
              <button
                v-for="opt in SCORE_OPTIONS"
                :key="opt.value"
                class="q-opt"
                :class="[`level-${opt.level}`, { selected: answers[currentQ] === opt.value }]"
                @click="selectAnswer(opt.value)"
              >
                <span class="q-opt-dot"></span>
                <span class="q-opt-body">
                  <span class="q-opt-label">{{ opt.label }}</span>
                  <span class="q-opt-sub">{{ opt.sub }}</span>
                </span>
                <span class="q-opt-arrow">→</span>
              </button>
            </div>
          </div>
        </transition>

        <div class="q-nav">
          <button class="q-back" :disabled="currentQ === 0" @click="prevQuestion">
            ← ย้อนกลับ
          </button>
          <button v-if="currentQ === 29 && answers[29] !== null" class="q-finish" @click="finishAssessment">
            ดูผล →
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════ STEP 3: RESULT — % ความพร้อม + insights + 4 สิทธิ์ ═══════════════ -->
    <section v-if="step === 'result'" class="result">
      <div class="result-hero-v2" :style="{ '--band-color': scoreBand.color }">
        <div class="rh-hi">🎉 ทำเสร็จแล้ว, {{ form.fullName || 'คุณ' }}!</div>

        <div class="rh-percent-block">
          <div class="rh-percent-label">ความพร้อมของคุณ</div>
          <div class="rh-percent-num" :style="{ color: scoreBand.color }">
            <span class="rh-p-value">{{ Math.round((totalScore / 60) * 100) }}</span>
            <span class="rh-p-sign">%</span>
          </div>
          <div class="rh-band-chip" :style="{ background: scoreBand.color }">
            {{ scoreBand.label }}
          </div>
        </div>

        <!-- Progress bar % -->
        <div class="rh-progress">
          <div class="rh-progress-track">
            <div class="rh-progress-fill"
                 :style="{ width: `${(totalScore / 60) * 100}%`, background: scoreBand.color }">
              <div class="rh-progress-shine"></div>
            </div>
          </div>
          <div class="rh-progress-markers">
            <span :class="{ passed: (totalScore/60)*100 >= 25 }">25%</span>
            <span :class="{ passed: (totalScore/60)*100 >= 50 }">50%</span>
            <span :class="{ passed: (totalScore/60)*100 >= 75 }">75%</span>
            <span :class="{ passed: (totalScore/60)*100 >= 100 }">100%</span>
          </div>
        </div>

        <p class="rh-desc">{{ scoreBand.desc }}</p>

        <div class="rh-raw">คะแนนดิบ: <b>{{ totalScore }}/60</b></div>
      </div>

      <div class="r-cats">
        <div class="r-cats-title">📊 ความพร้อมแต่ละหมวด</div>
        <div v-for="cat in CATEGORIES" :key="cat.key" class="r-cat">
          <div class="r-cat-head">
            <span class="r-cat-name">{{ cat.name }}</span>
            <span class="r-cat-score">
              <b>{{ Math.round((scoresByCategory[cat.key] / 10) * 100) }}%</b>
              <span class="r-cat-max">({{ scoresByCategory[cat.key] }}/10)</span>
            </span>
          </div>
          <div class="r-cat-bar">
            <div class="r-cat-bar-fill" :style="{ width: `${(scoresByCategory[cat.key] / 10) * 100}%` }"></div>
          </div>
        </div>
      </div>

      <div class="r-recommend">
        <div class="r-rec-title">🎯 คำแนะนำจากหมอแตม</div>
        <div class="r-rec-sub">3 หมวดที่ควรเริ่มพัฒนาก่อน</div>
        <div v-for="(cat, i) in weakCategories" :key="cat.key" class="r-rec-item">
          <div class="r-rec-rank">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="r-rec-body">
            <div class="r-rec-name">{{ cat.name }}</div>
            <div class="r-rec-score">
              ความพร้อม <b>{{ Math.round((cat.score / 10) * 100) }}%</b>
              <span class="r-rec-gap">· ต้องปิดช่องว่างอีก {{ 100 - Math.round((cat.score / 10) * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ⭐ Simple rights section: 4 bullets สั้น + QR ใหญ่ -->
      <div class="simple-rights">
        <div class="sr-list">
          <div class="sr-item">📥 <b>PDF Checklist</b> การเตรียมความพร้อม</div>
          <div class="sr-item">📹 <b>ปรึกษาหมอแตม 30 นาที ฟรี</b> (ตัวต่อตัว)</div>
          <div class="sr-item">🎁 <b>ส่วนลด 10%</b> ทุกคอร์ส (NL 1+2 / MEQ / OSCE)</div>
          <div class="sr-item">💬 คำแนะนำเฉพาะคุณจากหมอแตม</div>
        </div>

        <div class="sr-qr-box">
          <div class="sr-qr-title">📱 แอด WeChat มารับสิทธิ์</div>
          <img
            src="/img/wechat-qr.png"
            alt="WeChat MedNinja"
            class="sr-qr-image"
            @click="trackInterest('wechat')"
          />
          <div class="sr-qr-id">
            หรือค้นหา ID: <b class="wc-highlight">medninja</b>
          </div>
          <div class="sr-qr-note">
            แจ้ง <b>ชื่อ "{{ form.fullName }}"</b> เพื่อรับสิทธิ์
          </div>
        </div>

        <button v-if="pdfDownloadUrl" class="sr-pdf-btn" @click="downloadPdf(); trackInterest('pdf')">
          📥 โหลด PDF อีกครั้ง
        </button>
      </div>
    </section>

    <!-- ═══════════════ STEP 5: THANK YOU (Simple) ═══════════════ -->
    <section v-if="step === 'thanks'" class="thanks">
      <div class="th-check">
        <svg viewBox="0 0 60 60" class="th-check-svg">
          <circle cx="30" cy="30" r="26" class="th-c-bg" />
          <path d="M18 30 L27 39 L44 22" class="th-c-tick" />
        </svg>
      </div>
      <h2 class="th-title">🎉 ได้รับข้อมูลแล้ว!</h2>
      <p class="th-sub">
        PDF ถูกดาวน์โหลดให้แล้ว<br />
        <b>แอด WeChat เพื่อรับสิทธิ์เพิ่มเติม</b>
      </p>

      <!-- QR ใหญ่ = จุดสำคัญเดียว -->
      <div class="th-qr-main">
        <img src="/img/wechat-qr.png" alt="WeChat MedNinja" class="th-qr-big" />
        <div class="th-qr-id">WeChat ID: <b>medninja</b></div>
        <div class="th-qr-msg">
          แจ้ง <b>ชื่อ "{{ form.fullName }}"</b> เพื่อรับสิทธิ์
        </div>
      </div>

      <button v-if="pdfDownloadUrl" class="th-restart" @click="downloadPdf">
        📥 โหลด PDF อีกครั้ง
      </button>
      <button class="th-restart" @click="step = 'landing'; scrollTop()">← กลับหน้าแรก</button>
    </section>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.page {
  height: 100vh;
  height: 100dvh;
  background:
    radial-gradient(ellipse at top, #eff6ff 0%, transparent 60%),
    linear-gradient(180deg, #f4f7fc 0%, #e2e8f0 100%);
  color: #0f172a;
  font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', -apple-system, sans-serif;
  overflow: hidden;
}

/* ═══════════════ LANDING — responsive fluid (scale ตามจอ) ═══════════════ */
.landing {
  position: relative;
  height: 100%;
  padding: clamp(10px, 2vw, 24px) clamp(14px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 1200px;                /* ⭐ กว้างสุด 1200px จอใหญ่ไม่ยืดเว่อ */
  margin: 0 auto;
  width: 100%;
}
.hero-bg {
  position: absolute;
  top: -60px;
  left: -60px;
  right: -60px;
  height: 360px;
  background:
    radial-gradient(ellipse at 30% 30%, rgba(56, 189, 248, 0.22), transparent 60%),
    radial-gradient(ellipse at 70% 20%, rgba(220, 38, 38, 0.13), transparent 60%),
    linear-gradient(180deg, #eff6ff 0%, transparent 100%);
  pointer-events: none;
}

.topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 6px; }
.brand-mark { width: 26px; height: 26px; border-radius: 6px; object-fit: cover; }
.brand-name {
  font-size: clamp(24px, 6.5vw, 32px);
  font-weight: 900;
  color: #0a1e3d;                /* navy เข้มจัด */
  letter-spacing: -0.5px;
  line-height: 1;
  text-shadow: 0 2px 6px rgba(10, 30, 61, 0.15);
}
.badge-cn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.25);
  white-space: nowrap;
}
.badge-cn .dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
}

.hero {
  position: relative;
  z-index: 2;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 0;
}
/* Hero split visual: mascot | china — scale ตามจอ */
.hero-visual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(12px, 3vw, 40px);
  height: clamp(140px, 24vh, 260px);   /* ⭐ cap ที่ 260px กันโตเกิน */
  margin: 0 auto;
  max-width: 640px;
  width: 100%;
  flex-shrink: 0;                       /* ⭐ ไม่ให้ยืด/หดใน flex parent */
  overflow: visible;
}
.hv-side {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 0;
  overflow: hidden;                     /* ⭐ กัน mascot ยื่นออก container */
}
.hero-mascot {
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 12px 24px rgba(30, 58, 138, 0.25));
  animation: floaty 3.5s ease-in-out infinite;
  will-change: transform;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }   /* ⭐ ลด translate กัน overflow */
}

/* China emblem: mini flag + label */
.hv-china {
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 6px;
}
.china-emblem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: floaty 3.5s ease-in-out infinite;
  animation-delay: -1.75s;
}
.china-flag {
  position: relative;
  width: clamp(110px, 20vw, 240px);
  aspect-ratio: 3 / 2;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border-radius: 10px;
  box-shadow:
    0 12px 28px rgba(220, 38, 38, 0.35),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  overflow: hidden;
}
.china-flag::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
  pointer-events: none;
}
.cn-star {
  position: absolute;
  color: #fde047;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  font-family: sans-serif;
}
.cn-star-big {
  top: 22%;
  left: 15%;
  font-size: clamp(22px, 4.5vw, 48px);
}
.cn-star-1 { top: 12%; left: 40%; font-size: clamp(10px, 2vw, 20px); }
.cn-star-2 { top: 26%; left: 48%; font-size: clamp(10px, 2vw, 20px); }
.cn-star-3 { top: 44%; left: 48%; font-size: clamp(10px, 2vw, 20px); }
.cn-star-4 { top: 58%; left: 40%; font-size: clamp(10px, 2vw, 20px); }

.china-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  gap: 2px;
}
.cn-hanzi {
  font-size: clamp(20px, 4.5vw, 44px);
  font-weight: 900;
  color: #dc2626;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}
.cn-en {
  font-size: clamp(10px, 1.4vw, 14px);
  font-weight: 800;
  color: #64748b;
  letter-spacing: 3px;
}
.hero-badge {
  align-self: center;
  background: white;
  color: #0b2b5b;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1.5px solid rgba(30, 58, 138, 0.15);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}
.hero-title {
  font-size: clamp(28px, 6vw, 60px);
  line-height: 1.1;
  font-weight: 900;
  color: #0b2b5b;
  letter-spacing: -0.02em;
  margin: 0;
  white-space: nowrap;
}
.hl-red { color: #dc2626; }
.hero-sub {
  font-size: clamp(14px, 2vw, 20px);
  line-height: 1.55;
  color: #475569;
  margin: 0 auto;
  max-width: 560px;
}
.hero-sub b { color: #0b2b5b; font-weight: 800; }
.hero-sub .nb {
  display: inline-block;
  word-break: keep-all;
  overflow-wrap: normal;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
.pill {
  background: white;
  color: #334155;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}
.pill-gift {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #f59e0b;
  color: #92400e;
  font-weight: 800;
}

.products-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 8px 0 6px;
  font-family: 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  letter-spacing: 1px;
}
.p-word {
  font-size: clamp(26px, 5vw, 48px);
  font-weight: 900;
  color: var(--to);
  text-transform: uppercase;
  line-height: 1;
  letter-spacing: -0.5px;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.15),
    0 3px 6px rgba(0, 0, 0, 0.2);
}
.p-word.nl,
.p-word.meq,
.p-word.osce { --to: #0a1e3d; }      /* navy เข้มจัด — เดียวกันหมด match MedNinja topbar */
.p-dot {
  color: #94a3b8;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
  opacity: 0.5;
}

/* ═══════════════ Dual CTA (PDF only + Assessment full) ═══════════════ */
.dual-cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}
.cta-pdf,
.cta-full {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s;
  text-align: left;
  border: none;
  width: 100%;
}
.cta-pdf {
  background: white;
  color: #0a1e3d;
  border: 2px solid #0a1e3d;
  box-shadow: 0 4px 12px rgba(10, 30, 61, 0.1);
}
.cta-pdf:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(10, 30, 61, 0.2);
  background: #f8fafc;
}
.cta-full {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.35);
}
.cta-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(220, 38, 38, 0.45);
}
.cta-icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
}
.cta-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.cta-title {
  font-size: 15.5px;
  font-weight: 900;
  line-height: 1.2;
}
.cta-sub {
  font-size: 11.5px;
  opacity: 0.85;
  font-weight: 600;
}

.cta-primary {
  display: block;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: clamp(14px, 2vw, 20px) 22px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: clamp(15px, 2vw, 18px);
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.35), 0 0 0 4px rgba(220, 38, 38, 0.08);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.cta-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(220, 38, 38, 0.45);
}
.cta-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.hero-footnote {
  font-size: 11px;
  color: #64748b;
  margin: 0;
}

/* Secondary contact CTA */
.cta-secondary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-width: 480px;
  margin: 8px auto 0;
  width: 100%;
}
.cta-contact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: transparent;
  color: #64748b;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  text-decoration: none;
  text-align: center;
}
.cta-contact:hover {
  background: white;
  color: #0a1e3d;
  border-color: #0a1e3d;
}

/* Contact modal */
.contact-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(10, 30, 61, 0.5);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 20px;
}
.cm-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 28px 24px 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.cm-close {
  position: absolute;
  top: 10px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  font-family: inherit;
}
.cm-close:hover { color: #dc2626; background: #fef2f2; }
.cm-title {
  font-size: 20px;
  font-weight: 900;
  color: #0a1e3d;
  margin-bottom: 4px;
}
.cm-sub {
  font-size: 12.5px;
  color: #64748b;
  margin-bottom: 16px;
}

/* Callback form (ฝากเบอร์) */
.cm-callback {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1.5px solid #f97316;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  text-align: left;
}
.cm-cb-title {
  font-size: 13px;
  font-weight: 800;
  color: #9a3412;
  margin-bottom: 2px;
}
.cm-cb-hint {
  font-size: 11px;
  color: #c2410c;
  margin-bottom: 10px;
}
.cm-cb-form {
  display: flex;
  gap: 6px;
}
.cm-cb-input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1.5px solid #fdba74;
  border-radius: 9px;
  font-size: 14px;
  font-family: inherit;
  background: white;
}
.cm-cb-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}
.cm-cb-btn {
  padding: 9px 16px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.cm-cb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cm-cb-success {
  background: white;
  border: 1.5px solid #22c55e;
  color: #16a34a;
  padding: 10px;
  border-radius: 9px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
}
.cm-cb-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
}
.cm-or {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 10px 0;
  font-weight: 600;
}
.cm-list {
  display: grid;
  gap: 10px;
}
.cm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
}
.cm-label {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.cm-id {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 17px;
  font-weight: 900;
  color: #0a1e3d;
  letter-spacing: 0.5px;
}

/* ═══════════════ ASSESSMENT — fit viewport ═══════════════ */
.assess {
  height: 100%;
  padding: 12px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f4f7fc 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.assess-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.a-brand { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: #0b2b5b; }
.a-mark { width: 28px; height: 28px; border-radius: 6px; }
.a-progress-num { font-size: 13px; font-weight: 800; color: #64748b; }

.progress-track {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease, background 0.3s ease;
}

.q-container {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}
.q-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 800;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.q-cat-icon { font-size: 18px; }
.q-cat-name { flex: 1; }
.q-cat-num {
  font-size: 10.5px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 999px;
}
.q-text {
  font-size: clamp(18px, 5vw, 22px);
  line-height: 1.4;
  font-weight: 800;
  color: #0b2b5b;
  margin: 0 0 18px;
  flex-shrink: 0;
}

.q-options {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.q-opt {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-align: left;
  overflow: hidden;
}

/* Clean minimal — no bg tint, no selected highlight (avoid carry-over animation) */
.q-opt {
  transition: border-color 0.1s, transform 0.1s;
}
.q-opt:hover {
  border-color: #0a1e3d;
}

/* Selected: subtle border only (no bg change → no visual carry-over ข้อถัดไป) */
.q-opt.selected {
  border-color: #0a1e3d;
}

.q-opt-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.q-opt-label {
  font-size: 15.5px;
  font-weight: 800;
  color: #0a1e3d;
  line-height: 1.2;
}
.q-opt-sub {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* Dot indicator (แทน emoji/icon) */
.q-opt-dot {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: white;
  transition: all 0.1s;
}
.q-opt.selected .q-opt-dot {
  border-color: #0a1e3d;
  background: #0a1e3d;
  box-shadow: inset 0 0 0 3px white;
}

.q-opt-arrow {
  display: none;   /* ไม่ต้องมี arrow */
}

/* Slide + fade transition ระหว่างข้อ (ให้เห็นชัดว่าข้อเปลี่ยน) */
.q-slide-enter-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.q-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease-in;
}
.q-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.q-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.q-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.q-back {
  padding: 10px 16px;
  background: transparent;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
}
.q-back:disabled { opacity: 0.3; cursor: not-allowed; }
.q-finish {
  padding: 10px 20px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 6px 14px rgba(22, 163, 74, 0.35);
}

/* ═══════════════ RESULT ═══════════════ */
.result {
  height: 100%;
  padding: 12px 14px;
  max-width: 480px;
  margin: 0 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
/* ═══════════════ GATE (Form-first) ═══════════════ */
.gate {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 14px 40px;
  max-width: 520px;
  margin: 0 auto;
}
.gate-inner { width: 100%; }
.gate-header { text-align: center; margin-bottom: 18px; }
.gate-badge {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 10px;
}
.gate-badge.badge-pdf {
  background: #f1f5f9;
  color: #0a1e3d;
  border: 1px solid #cbd5e1;
}
.gate-badge.badge-full {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1px solid #f59e0b;
}
.perks-title {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.gate-back-badge {
  display: inline-block;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #14532d;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid #22c55e;
  margin-bottom: 10px;
}
.gate-title {
  font-size: clamp(22px, 5vw, 32px);
  font-weight: 900;
  color: #0a1e3d;
  line-height: 1.2;
  margin: 0 0 8px;
}
.gate-highlight {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  padding: 2px 10px;
  border-radius: 8px;
  display: inline-block;
}
.gate-sub { font-size: 13.5px; color: #64748b; margin: 0; }

.gate-perks {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
  display: grid;
  gap: 8px;
}
.perk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #334155;
}
.perk-item.highlight { color: #dc2626; font-weight: 800; }
.perk-dot {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0a1e3d;
  color: white;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 900;
}
.perk-item.highlight .perk-dot { background: #dc2626; }

.gate-form {
  background: white;
  border-radius: 16px;
  padding: 18px 16px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.gate-back {
  width: 100%;
  margin-top: 8px;
}
.gate-privacy {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  margin: 10px 0 0;
}

/* ═══════════════ RIGHTS SECTION (Result step) ═══════════════ */
.r-hi {
  font-size: 15px;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 10px;
  text-align: center;
}

.rights-section {
  margin-top: 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%);
  border: 2px solid #f59e0b;
  border-radius: 18px;
  padding: 18px 14px;
  box-shadow: 0 12px 28px rgba(245, 158, 11, 0.15);
}
.rights-title {
  font-size: 18px;
  font-weight: 900;
  color: #92400e;
  text-align: center;
  margin-bottom: 6px;
}
.rights-sub {
  font-size: 13px;
  color: #78350f;
  text-align: center;
  line-height: 1.55;
  margin-bottom: 14px;
}
.wc-highlight {
  background: #22c55e;
  color: white;
  padding: 1px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-weight: 900;
}

.right-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  transition: all 0.15s;
}
.right-card:hover {
  border-color: #0a1e3d;
  transform: translateY(-1px);
}
.right-card.highlight {
  background: linear-gradient(135deg, #fef2f2, #ffffff);
  border-color: #dc2626;
}
.rc-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0a1e3d;
  color: white;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 900;
}
.right-card.highlight .rc-num { background: #dc2626; }
.rc-body { flex: 1; min-width: 0; }
.rc-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0a1e3d;
  line-height: 1.25;
}
.rc-desc {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.4;
}
.rc-btn {
  flex-shrink: 0;
  padding: 7px 14px;
  background: white;
  color: #0a1e3d;
  border: 1.5px solid #0a1e3d;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
}
.rc-btn:hover { background: #0a1e3d; color: white; }
.rc-btn.primary {
  background: #0a1e3d;
  color: white;
}
.rc-btn.primary:hover { background: #050f28; }
.right-card.highlight .rc-btn.primary {
  background: #dc2626;
  border-color: #dc2626;
}
.right-card.highlight .rc-btn.primary:hover { background: #b91c1c; }

.rights-guide {
  background: white;
  border: 1px dashed #f59e0b;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 14px 0 12px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #78350f;
}
.rights-guide b { color: #92400e; }

/* ⭐ Simple rights section (redesign for clarity) */
.simple-rights {
  margin-top: 20px;
  background: linear-gradient(135deg, #fefce8 0%, #ffffff 100%);
  border: 2px solid #eab308;
  border-radius: 18px;
  padding: 20px 16px;
  box-shadow: 0 12px 28px rgba(234, 179, 8, 0.15);
}
.sr-list {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}
.sr-item {
  padding: 10px 14px;
  background: white;
  border-radius: 10px;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.5;
  border: 1px solid rgba(15, 23, 42, 0.06);
}
.sr-item b { color: #0a1e3d; font-weight: 800; }

.sr-qr-box {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 14px;
  padding: 16px 14px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15);
}
.sr-qr-title {
  font-size: 15px;
  font-weight: 900;
  color: #14532d;
  margin-bottom: 12px;
}
.sr-qr-image {
  width: clamp(200px, 60vw, 280px);
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  padding: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  object-fit: contain;
}
.sr-qr-id {
  font-size: 13px;
  color: #475569;
  margin-top: 10px;
}
.sr-qr-note {
  font-size: 12.5px;
  color: #64748b;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  line-height: 1.5;
}
.sr-qr-note b { color: #14532d; }

.sr-pdf-btn {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 14px auto 0;
  padding: 10px 20px;
  background: white;
  color: #0a1e3d;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.sr-pdf-btn:hover {
  border-color: #0a1e3d;
  background: #f8fafc;
}

/* ⭐ QR block at Result step (legacy — unused ตอนนี้) */
.rights-qr-block {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 14px;
  padding: 16px 14px;
  margin: 14px 0 12px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15);
}
.rqr-title {
  font-size: 14px;
  font-weight: 800;
  color: #14532d;
  margin-bottom: 10px;
}
.rqr-image {
  width: clamp(160px, 45vw, 220px);
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: white;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  object-fit: contain;
}
.rqr-id {
  font-size: 13px;
  color: #14532d;
  margin-top: 10px;
  margin-bottom: 12px;
}
.rqr-steps {
  text-align: left;
  font-size: 12px;
  line-height: 1.65;
  color: #475569;
  padding: 10px 12px;
  background: #f0fdf4;
  border-radius: 8px;
}
.rqr-steps b { color: #14532d; }

/* ⭐ QR at Contact modal */
.cm-qr {
  text-align: center;
  padding: 12px 0;
}
.cm-qr-img {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  padding: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}
.cm-qr-label {
  font-size: 11.5px;
  color: #64748b;
  font-weight: 700;
  margin-top: 6px;
}

/* ⭐ QR at Thank You */
.th-qr-wrap {
  text-align: center;
  padding: 10px 0;
}
.th-qr-img {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  padding: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}
.th-qr-caption {
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
  margin-top: 4px;
}

/* ═══════════════ Result Hero V2 — % Ready + Progress Bar ═══════════════ */
.result-hero-v2 {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px 18px;
  margin-bottom: 14px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}
.result-hero-v2::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: var(--band-color);
}
.rh-hi {
  font-size: 14.5px;
  font-weight: 800;
  color: #16a34a;
  margin-bottom: 16px;
}
.rh-percent-block {
  margin-bottom: 20px;
}
.rh-percent-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 4px;
}
.rh-percent-num {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1;
  font-weight: 900;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}
.rh-p-value {
  font-size: clamp(64px, 15vw, 96px);
  letter-spacing: -3px;
  font-family: 'SF Pro Display', system-ui, sans-serif;
}
.rh-p-sign {
  font-size: clamp(28px, 6vw, 40px);
  margin-left: 4px;
}
.rh-band-chip {
  display: inline-block;
  color: white;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  margin-top: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}

/* Progress bar */
.rh-progress {
  margin: 20px auto 14px;
  max-width: 340px;
}
.rh-progress-track {
  position: relative;
  height: 14px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}
.rh-progress-fill {
  position: relative;
  height: 100%;
  border-radius: 999px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fillPulse 0.6s ease-out 1.2s both;
  overflow: hidden;
}
@keyframes fillPulse {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.15); }
  100% { transform: scaleY(1); }
}
.rh-progress-shine {
  position: absolute;
  top: 0; left: -50%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  animation: shine 2.5s ease-in-out 1.5s infinite;
}
@keyframes shine {
  0% { left: -50%; }
  100% { left: 150%; }
}
.rh-progress-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  color: #cbd5e1;
}
.rh-progress-markers .passed {
  color: #0a1e3d;
}

.rh-desc {
  font-size: 13.5px;
  color: #475569;
  line-height: 1.6;
  margin: 8px 0 6px;
  max-width: 340px;
  margin-left: auto;
  margin-right: auto;
}
.rh-raw {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}
.rh-raw b { color: #64748b; }

/* Category rows show % + raw score */
.r-cat-max {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-left: 4px;
}

/* Recommendation gap indicator */
.r-rec-gap {
  color: #dc2626;
  font-weight: 700;
}

.result-hero {
  text-align: center;
  padding: 16px 14px 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  margin-bottom: 12px;
}
.r-score-circle {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 0 auto 10px;
}
.r-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.r-track { fill: none; stroke: #e2e8f0; stroke-width: 10; }
.r-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease-out;
}
.r-score-num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}
.r-num { font-size: 44px; font-weight: 900; color: var(--band-color); line-height: 1; }
.r-max { font-size: 14px; color: #94a3b8; font-weight: 700; margin-top: 4px; }

.r-band {
  display: inline-block;
  color: white;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}
.r-desc { font-size: 14px; color: #475569; line-height: 1.6; margin: 0; }

.r-cats {
  background: white;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}
.r-cats-title { font-size: 14px; font-weight: 800; color: #0b2b5b; margin-bottom: 14px; }
.r-cat { margin-bottom: 12px; }
.r-cat:last-child { margin-bottom: 0; }
.r-cat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
}
.r-cat-icon { font-size: 16px; }
.r-cat-name { flex: 1; font-weight: 700; color: #334155; }
.r-cat-score { font-weight: 800; color: #0b2b5b; }
.r-cat-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.r-cat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease-out;
}

.r-recommend {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1.5px solid #f59e0b;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 24px;
}
.r-rec-title { font-size: 14px; font-weight: 800; color: #92400e; margin-bottom: 12px; }
.r-rec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(146, 64, 14, 0.15);
}
.r-rec-item:first-of-type { border-top: none; padding-top: 0; }
.r-rec-rank {
  width: 32px; height: 32px;
  border-radius: 50%;
  color: white;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 14px;
  flex-shrink: 0;
}
.r-rec-name { font-size: 14px; font-weight: 800; color: #78350f; }
.r-rec-score { font-size: 12px; color: #92400e; margin-top: 2px; }

.r-cta-wrap { text-align: center; }
.r-cta-note {
  font-size: 12.5px;
  color: #64748b;
  margin: 12px 0 0;
  line-height: 1.5;
}

/* ═══════════════ LEAD FORM ═══════════════ */
.lead-form {
  height: 100%;
  padding: 12px 14px;
  max-width: 480px;
  margin: 0 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.lf-header { text-align: center; margin-bottom: 20px; }
.lf-score-mini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  color: #475569;
  margin-bottom: 12px;
}
.lf-band-chip {
  color: white;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}
.lf-title { font-size: 24px; font-weight: 900; color: #0b2b5b; margin: 0 0 6px; }
.lf-sub { font-size: 14px; color: #64748b; margin: 0; }

.lf-form {
  background: white;
  border-radius: 20px;
  padding: 22px 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}
.lf-field { margin-bottom: 14px; }
.lf-field label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #0b2b5b;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}
.lf-field .req { color: #dc2626; }
.lf-field .tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
  font-weight: 800;
  vertical-align: middle;
}
.lf-field .tag.rec { background: #dcfce7; color: #16a34a; }
.lf-field input, .lf-field select {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  color: #0f172a;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.lf-field input:focus, .lf-field select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.lf-field input:disabled, .lf-field select:disabled {
  background: #f8fafc;
  color: #94a3b8;
}
.lf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lf-line label { color: #16a34a; }
.lf-wechat label { color: #16a34a; }
.lf-line input:focus, .lf-wechat input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

/* WeChat primary field — เน้นชัด */
.lf-primary {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1.5px solid #22c55e;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 6px 0;
}
.lf-primary label { color: #14532d !important; font-size: 12.5px; }
.lf-primary input {
  border-color: #22c55e;
  background: white;
}
.tag.main {
  background: #22c55e;
  color: white;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
}

/* Inline form (merged into result step) */
.lf-inline {
  background: white;
  border-radius: 18px;
  padding: 18px 16px;
  margin-top: 0;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}
.lf-inline-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #14532d;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  border: 1px solid #22c55e;
  margin-bottom: 10px;
}
.lf-badge-num {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  font-size: 10px;
  font-weight: 900;
}

/* Locked result preview */
.result-preview {
  margin-top: 16px;
  position: relative;
  transition: filter 0.4s, opacity 0.4s;
}
.result-preview.locked {
  filter: blur(6px);
  opacity: 0.4;
  pointer-events: none;
  user-select: none;
}
.rp-lock {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  filter: none !important;
  opacity: 1 !important;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9));
  border-radius: 18px;
  padding: 40px 20px;
}
.rp-lock-icon {
  font-size: 44px;
  margin-bottom: 4px;
  filter: drop-shadow(0 4px 8px rgba(10, 30, 61, 0.2));
}
.rp-lock-title {
  font-size: 15px;
  font-weight: 900;
  color: #0a1e3d;
}
.rp-lock-desc {
  font-size: 12.5px;
  color: #475569;
  text-align: center;
}

/* Next CTA after unlock */
.r-next-cta {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}
.cta-outline {
  display: block;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 14px 20px;
  background: white;
  color: #0a1e3d;
  border: 1.5px solid #0a1e3d;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.cta-outline:hover {
  background: #0a1e3d;
  color: white;
}
.lf-inline-title {
  font-size: 18px;
  font-weight: 900;
  color: #0b2b5b;
  margin: 0 0 4px;
  text-align: center;
}
.lf-inline-sub {
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 14px;
  text-align: center;
}
.lf-other-input {
  margin-top: 6px;
}
.lf-hint-inline {
  font-size: 11px;
  color: #16a34a;
  margin-top: 4px;
  font-weight: 600;
}
.field-error {
  font-size: 11.5px;
  color: #dc2626;
  margin-top: 5px;
  font-weight: 700;
  padding: 4px 8px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

/* Accordion for optional contacts */
.lf-more {
  margin: 6px 0;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  padding: 0;
}
.lf-more summary {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  color: #64748b;
  list-style: none;
  user-select: none;
}
.lf-more summary::-webkit-details-marker { display: none; }
.lf-more[open] summary {
  border-bottom: 1px dashed #cbd5e1;
}
.lf-more-body {
  padding: 12px 14px 4px;
}

.lf-divider {
  position: relative;
  text-align: center;
  margin: 18px 0 14px;
}
.lf-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0; right: 0;
  height: 1px;
  background: #e2e8f0;
}
.lf-divider span {
  position: relative;
  background: white;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.lf-hint {
  font-size: 12.5px;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 4px 0 14px;
}
.lf-error {
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}
.lf-submit { margin-top: 6px; }
.lf-privacy {
  text-align: center;
  font-size: 11.5px;
  color: #94a3b8;
  margin: 12px 0 0;
}

/* ═══════════════ THANKS ═══════════════ */
.thanks {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 24px 18px;
  max-width: 460px;
  margin: 0 auto;
  text-align: center;
}
.th-check {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
}
.th-check-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 8px 24px rgba(22, 163, 74, 0.35));
}
.th-c-bg { fill: #22c55e; }
.th-c-tick {
  fill: none;
  stroke: white;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: th-draw 0.8s 0.3s ease-out forwards;
}
@keyframes th-draw { to { stroke-dashoffset: 0; } }

.th-title { font-size: 28px; font-weight: 900; color: #0b2b5b; margin: 0 0 10px; }
.th-sub { font-size: 15px; color: #64748b; line-height: 1.7; margin: 0 0 28px; }
.th-sub b { color: #0b2b5b; font-weight: 800; }

.th-next {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1.5px solid #22c55e;
  border-radius: 18px;
  padding: 20px 16px;
  margin-bottom: 20px;
}
.th-next-title { font-size: 13.5px; font-weight: 800; color: #14532d; margin-bottom: 14px; }
.th-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  margin-bottom: 12px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}
.th-btn.line {
  background: linear-gradient(135deg, #06c755, #04a648);
  color: white;
}
.th-btn.download {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  box-shadow: 0 10px 22px rgba(220, 38, 38, 0.35);
}

.th-wechat { margin-top: 8px; }
.th-w-title { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.th-w-id {
  display: inline-block;
  background: white;
  color: #0b2b5b;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 20px;
  font-weight: 900;
  padding: 8px 20px;
  border-radius: 10px;
  border: 2px dashed #22c55e;
  letter-spacing: 1px;
}

.th-tips {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  padding: 18px;
  text-align: left;
  margin-bottom: 20px;
}
.th-t-title { font-size: 13.5px; font-weight: 800; color: #0b2b5b; margin-bottom: 10px; }
.th-t-list { margin: 0; padding-left: 20px; }
.th-t-list li {
  font-size: 13.5px;
  color: #475569;
  line-height: 1.8;
}

/* Contact section — LINE + WeChat */
.th-contact {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
}
.th-c-title {
  font-size: 13px;
  font-weight: 800;
  color: #0b2b5b;
  margin-bottom: 10px;
  text-align: center;
}
.th-c-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.th-c-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 10px;
  border: 1.5px solid;
}
.th-c-item.line {
  background: #f0fdf4;
  border-color: #22c55e;
}
.th-c-item.wechat {
  background: #ecfdf5;
  border-color: #10b981;
}
.th-c-label {
  font-size: 10.5px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.th-c-id {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 15px;
  font-weight: 900;
  color: #0b2b5b;
}

/* Parent phone form */
.th-parent {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  border: 1.5px solid #f97316;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.th-p-title {
  font-size: 13px;
  font-weight: 800;
  color: #9a3412;
  margin-bottom: 10px;
  line-height: 1.5;
}
.th-p-form {
  display: flex;
  gap: 6px;
}
.th-p-input {
  flex: 1;
  padding: 10px 12px;
  border: 1.5px solid #fdba74;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  color: #0f172a;
  min-width: 0;
}
.th-p-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}
.th-p-input:disabled {
  background: #fef3c7;
  color: #94a3b8;
}
.th-p-btn {
  padding: 10px 14px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(249, 115, 22, 0.35);
}
.th-p-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.th-p-success {
  background: white;
  color: #16a34a;
  font-weight: 800;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  border: 1.5px solid #22c55e;
}
.th-p-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
}

/* Simple thank you QR block */
.th-qr-main {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 18px;
  padding: 22px 16px;
  margin: 20px auto;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.15);
}
.th-qr-big {
  width: clamp(220px, 70vw, 300px);
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  padding: 4px;
  background: white;
  object-fit: contain;
}
.th-qr-main .th-qr-id {
  font-size: 14px;
  color: #14532d;
  margin-top: 12px;
  font-family: 'SF Mono', 'Menlo', monospace;
}
.th-qr-main .th-qr-id b { color: #16a34a; font-weight: 900; }
.th-qr-msg {
  font-size: 13px;
  color: #475569;
  margin-top: 10px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 8px;
}
.th-qr-msg b { color: #14532d; }

.th-restart {
  background: transparent;
  border: 1.5px solid #cbd5e1;
  color: #64748b;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  margin: 4px;
}

/* ═══════════════ RESPONSIVE ═══════════════ */
@media (min-width: 640px) {
  .hero-title { font-size: 52px; }
  .hero-sub { font-size: 17px; max-width: 420px; }
  .q-text { font-size: 26px; }
  .lf-title { font-size: 28px; }
  .th-title { font-size: 32px; }
}
</style>
