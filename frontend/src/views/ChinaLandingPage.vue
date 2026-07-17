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
// flow: landing → assess (30 ข้อ) → result-form (รวมหน้าเดียว) → thanks (PDF download)
const step = ref('landing')  // landing | assess | result-form | thanks
const currentQ = ref(0)      // 0-29
const answers = ref(Array(30).fill(null))

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
  const t = totalScore.value
  // ⭐ Monochromatic navy palette — ไม่ใช้สีสด (traffic light) เพื่อดูมืออาชีพ
  if (t >= 49) return { band: '49-60', label: 'มีระบบดีเยี่ยม', desc: 'พร้อมมาก เน้นแบบทดสอบจำลอง และปรับจุดเล็ก ๆ', color: '#0a1e3d' }
  if (t >= 36) return { band: '36-48', label: 'เริ่มพร้อมแล้ว', desc: 'ยังต้องปิดช่องว่างเฉพาะด้าน ทำ mock quiz และฝึก present case', color: '#1e3a8a' }
  if (t >= 21) return { band: '21-35', label: 'มีความรู้บางส่วน', desc: 'ยังไม่รู้จุดอ่อนชัด ทำแผน 30 วัน + MCQ + บันทึกข้อผิด', color: '#334155' }
  return { band: '0-20', label: 'ยังไม่มีระบบชัดเจน', desc: 'เริ่มจากเส้นทางทางการ วิชาที่สำคัญ และประเมินตัวเองซ้ำใน 30 วัน', color: '#475569' }
})

const weakCategories = computed(() => {
  return CATEGORIES
    .map(c => ({ ...c, score: scoresByCategory.value[c.key] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
})

const canSubmitForm = computed(() => {
  const f = form.value
  const hasName = f.fullName.trim().length >= 2
  const hasUniversity = resolvedUniversity.value.length >= 2
  const hasWechat = f.wechatId.trim().length >= 2   // ⭐ WeChat บังคับ = ช่องทางส่ง PDF
  return hasName && hasUniversity && hasWechat
})

// ─── Actions ───
function startAssessment() {
  step.value = 'assess'
  currentQ.value = 0
  scrollTop()
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

function finishAssessment() {
  resultScore.value = {
    totalScore: totalScore.value,
    scoresByCategory: scoresByCategory.value,
    scoreBand: scoreBand.value.band
  }
  // ⭐ ไป Result+Form รวมหน้าเดียว (ลด friction 1 click)
  step.value = 'result-form'
  scrollTop()
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

        <button class="cta-primary" @click="startAssessment">
          🚀 เริ่มทำแบบประเมิน
        </button>

        <button class="cta-contact" @click="openContact">
          💬 ติดต่อเรา
        </button>
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

    <!-- ═══════════════ STEP 3: RESULT + FORM (รวมหน้าเดียว) ═══════════════ -->
    <section v-if="step === 'result-form'" class="result">
      <!-- ⭐ STEP 1: กรอกฟอร์มก่อน — ต้องกรอกครบถึงจะเห็นผล + โหลด PDF -->
      <div class="lf-inline">
        <div class="lf-inline-badge">
          <span class="lf-badge-num">✓</span>
          <span>ทำแบบประเมินเสร็จแล้ว 30/30</span>
        </div>
        <h3 class="lf-inline-title">📮 กรอกข้อมูลเพื่อดูผล + รับ PDF</h3>
        <p class="lf-inline-sub">ทีมงานจะส่งคำแนะนำเพิ่มเติมทาง WeChat</p>

        <div class="lf-field">
          <label>ชื่อจริง <span class="req">*</span></label>
          <input v-model="form.fullName" type="text" placeholder="ชื่อ-นามสกุล" :disabled="submitting" />
        </div>

        <div class="lf-field">
          <label>มหาลัยที่กำลังเรียน <span class="req">*</span></label>
          <select v-model="form.universitySelect" :disabled="submitting">
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
            :disabled="submitting"
          />
        </div>

        <div class="lf-field">
          <label>ปีที่เรียน</label>
          <select v-model="form.year" :disabled="submitting">
            <option value="">— เลือก —</option>
            <option v-for="y in YEAR_OPTIONS" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="lf-field lf-wechat lf-primary">
          <label>💬 WeChat ID <span class="req">*</span> <span class="tag main">ช่องทางหลัก</span></label>
          <input v-model="form.wechatId" type="text" placeholder="wechat-id" :disabled="submitting" />
          <div class="lf-hint-inline">ทีมงานจะส่ง PDF + นัดปรึกษาให้ทาง WeChat</div>
        </div>

        <details class="lf-more">
          <summary>+ เพิ่มช่องทางสำรอง (ถ้าต้องการ)</summary>
          <div class="lf-more-body">
            <div class="lf-field lf-line">
              <label>💚 LINE ID</label>
              <input v-model="form.lineId" type="text" placeholder="line-id" :disabled="submitting" />
            </div>
            <div class="lf-field">
              <label>📱 เบอร์ไทย</label>
              <input v-model="form.phoneTh" type="tel" placeholder="08x-xxx-xxxx" :disabled="submitting" />
            </div>
            <div class="lf-field">
              <label>📧 Email</label>
              <input v-model="form.email" type="email" placeholder="you@example.com" :disabled="submitting" />
            </div>
          </div>
        </details>

        <div v-if="submitError" class="lf-error">⚠ {{ submitError }}</div>

        <button class="cta-primary lf-submit" :disabled="!canSubmitForm || submitting" @click="submitAndDownload">
          <span v-if="submitting">กำลังส่ง...</span>
          <span v-else-if="!canSubmitForm">🔒 กรอก ชื่อ + มหาลัย + WeChat ให้ครบ</span>
          <span v-else>🔓 ดูผลคะแนน + โหลด PDF</span>
        </button>

        <p class="lf-privacy">🔒 ใช้สำหรับส่ง PDF + นัดปรึกษาเท่านั้น</p>
      </div>

      <!-- ⭐ STEP 2: ผลคะแนน — ล็อคจนกว่าจะกรอกฟอร์มเสร็จ -->
      <div class="result-preview" :class="{ locked: !resultUnlocked }">
        <div v-if="!resultUnlocked" class="rp-lock">
          <div class="rp-lock-icon">🔒</div>
          <div class="rp-lock-title">ผลคะแนนของคุณถูกล็อคอยู่</div>
          <div class="rp-lock-desc">กรอกฟอร์มด้านบน → ปลดล็อคผล + PDF</div>
        </div>

        <div class="result-hero" :style="{ '--band-color': scoreBand.color }">
          <div class="r-score-circle">
            <svg viewBox="0 0 120 120" class="r-ring">
              <circle cx="60" cy="60" r="52" class="r-track" />
              <circle cx="60" cy="60" r="52" class="r-fill"
                :style="{ strokeDasharray: 326.7, strokeDashoffset: 326.7 - (326.7 * totalScore / 60), stroke: scoreBand.color }" />
            </svg>
            <div class="r-score-num">
              <div class="r-num">{{ totalScore }}</div>
              <div class="r-max">/ 60</div>
            </div>
          </div>

          <div class="r-band" :style="{ background: scoreBand.color }">
            {{ scoreBand.label }}
          </div>
          <p class="r-desc">{{ scoreBand.desc }}</p>
        </div>

        <div class="r-cats">
          <div class="r-cats-title">คะแนนแยกหมวด</div>
          <div v-for="cat in CATEGORIES" :key="cat.key" class="r-cat">
            <div class="r-cat-head">
              <span class="r-cat-name">{{ cat.name }}</span>
              <span class="r-cat-score">{{ scoresByCategory[cat.key] }}<span class="r-cat-max">/10</span></span>
            </div>
            <div class="r-cat-bar">
              <div class="r-cat-bar-fill" :style="{ width: `${(scoresByCategory[cat.key] / 10) * 100}%` }"></div>
            </div>
          </div>
        </div>

        <div class="r-recommend">
          <div class="r-rec-title">คำแนะนำจากหมอแตม</div>
          <div class="r-rec-sub">3 หมวดแรกที่ควรเริ่ม</div>
          <div v-for="(cat, i) in weakCategories" :key="cat.key" class="r-rec-item">
            <div class="r-rec-rank">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="r-rec-body">
              <div class="r-rec-name">{{ cat.name }}</div>
              <div class="r-rec-score">{{ cat.score }} / 10 คะแนน</div>
            </div>
          </div>
        </div>

        <div v-if="resultUnlocked" class="r-next-cta">
          <button v-if="pdfDownloadUrl" class="cta-primary" @click="downloadPdf">
            โหลด PDF อีกครั้ง
          </button>
          <button class="cta-outline" @click="step = 'thanks'; scrollTop()">
            ต่อไปที่ ติดต่อ / นัดปรึกษา →
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════ STEP 5: THANK YOU ═══════════════ -->
    <section v-if="step === 'thanks'" class="thanks">
      <div class="th-check">
        <svg viewBox="0 0 60 60" class="th-check-svg">
          <circle cx="30" cy="30" r="26" class="th-c-bg" />
          <path d="M18 30 L27 39 L44 22" class="th-c-tick" />
        </svg>
      </div>
      <h2 class="th-title">🎉 ได้รับข้อมูลแล้ว!</h2>
      <p class="th-sub">
        PDF Checklist การเตรียมความพร้อม ถูกดาวน์โหลดให้แล้ว<br />
        <b>ทีมงานจะติดต่อทาง WeChat ภายใน 24 ชม.</b><br />
        พร้อมนัดปรึกษาหมอแตมแบบส่วนตัว
      </p>

      <button v-if="pdfDownloadUrl" class="th-btn download" @click="downloadPdf">
        <span>📥</span> โหลด PDF อีกครั้ง (ถ้ายังไม่ได้)
      </button>

      <div class="th-contact">
        <div class="th-c-title">📞 สอบถามข้อมูลเพิ่มเติม</div>
        <div class="th-c-row">
          <div class="th-c-item line">
            <span class="th-c-label">LINE</span>
            <span class="th-c-id">@medninja</span>
          </div>
          <div class="th-c-item wechat">
            <span class="th-c-label">WeChat</span>
            <span class="th-c-id">medninja</span>
          </div>
        </div>
      </div>

      <div class="th-parent">
        <div class="th-p-title">👨‍👩‍👧 ผู้ปกครองสามารถฝากเบอร์ให้คุณหมอโทรกลับได้</div>

        <div v-if="parentSubmitted" class="th-p-success">
          ✅ ได้รับเบอร์แล้ว หมอแตมจะโทรกลับเร็ว ๆ นี้
        </div>

        <div v-else class="th-p-form">
          <input
            v-model="parentPhone"
            type="tel"
            placeholder="เบอร์ผู้ปกครอง เช่น 081-234-5678"
            class="th-p-input"
            :disabled="parentSubmitting"
          />
          <button
            class="th-p-btn"
            :disabled="!parentPhone.trim() || parentSubmitting"
            @click="submitParentPhone"
          >
            <span v-if="parentSubmitting">กำลังส่ง...</span>
            <span v-else>📞 ฝากเบอร์</span>
          </button>
        </div>
        <div v-if="parentError" class="th-p-error">⚠ {{ parentError }}</div>
      </div>

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
  height: clamp(140px, 30vh, 380px);   /* mobile 140 → desktop 380 */
  margin-bottom: -4px;
  max-width: 700px;                    /* กว้างสุด 700 กันเว่อบน 4K */
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.hv-side {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 100%;
}
.hv-mascot {
  align-items: flex-end;
}
.hero-mascot {
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;             /* ⭐ กัน distort — คง aspect ratio จริง */
  filter: drop-shadow(0 12px 24px rgba(30, 58, 138, 0.25));
  animation: floaty 3.5s ease-in-out infinite;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
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
.cta-contact {
  display: block;
  width: 100%;
  max-width: 380px;
  margin: 8px auto 0;
  padding: 10px 20px;
  background: transparent;
  color: #64748b;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
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

/* Level-specific colors (subtle bg tint) */
.q-opt.level-low   { background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); }
.q-opt.level-mid   { background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); }
.q-opt.level-high  { background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }

.q-opt:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 10px 24px rgba(10, 30, 61, 0.1);
}
.q-opt.level-low:hover   { border-color: #f97316; box-shadow: 0 10px 24px rgba(249, 115, 22, 0.2); }
.q-opt.level-mid:hover   { border-color: #3b82f6; box-shadow: 0 10px 24px rgba(59, 130, 246, 0.2); }
.q-opt.level-high:hover  { border-color: #16a34a; box-shadow: 0 10px 24px rgba(22, 163, 74, 0.2); }

.q-opt.selected {
  transform: translateY(-2px);
  border-width: 2px;
}
.q-opt.level-low.selected {
  border-color: #f97316;
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
  box-shadow: 0 12px 28px rgba(249, 115, 22, 0.25);
}
.q-opt.level-mid.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.25);
}
.q-opt.level-high.selected {
  border-color: #16a34a;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.25);
}

.q-opt-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  display: grid;
  place-items: center;
  font-size: 24px;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.06);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.q-opt:hover .q-opt-icon,
.q-opt.selected .q-opt-icon {
  transform: scale(1.15) rotate(-5deg);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
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
.q-opt.selected .q-opt-label { color: #0a1e3d; }
.q-opt.level-low.selected .q-opt-sub { color: #9a3412; font-weight: 700; }
.q-opt.level-mid.selected .q-opt-sub { color: #1e40af; font-weight: 700; }
.q-opt.level-high.selected .q-opt-sub { color: #14532d; font-weight: 700; }

.q-opt-arrow {
  flex-shrink: 0;
  font-size: 20px;
  font-weight: 900;
  color: #cbd5e1;
  transition: all 0.25s;
  opacity: 0;
  transform: translateX(-8px);
}
.q-opt:hover .q-opt-arrow {
  opacity: 1;
  transform: translateX(0);
  color: #94a3b8;
}
.q-opt.selected .q-opt-arrow {
  opacity: 1;
  transform: translateX(4px);
}
.q-opt.level-low.selected .q-opt-arrow  { color: #f97316; }
.q-opt.level-mid.selected .q-opt-arrow  { color: #3b82f6; }
.q-opt.level-high.selected .q-opt-arrow { color: #16a34a; }

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
