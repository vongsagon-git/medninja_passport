<script setup>
import { ref, computed, onMounted } from 'vue'

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
    icon: '📋',
    color: '#3b82f6',
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
    icon: '📚',
    color: '#8b5cf6',
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
    icon: '🩺',
    color: '#ef4444',
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
    icon: '🧪',
    color: '#10b981',
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
    icon: '🗣️',
    color: '#f59e0b',
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
    icon: '💪',
    color: '#ec4899',
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
  { value: 0, label: 'ยังไม่ได้เริ่ม', emoji: '🔴' },
  { value: 1, label: 'พอทำได้บ้าง', emoji: '🟡' },
  { value: 2, label: 'ทำได้มั่นใจ', emoji: '🟢' }
]

const YEAR_OPTIONS = [
  'ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'ปี 5', 'ปี 6',
  'จบแล้ว', 'ฝึกงาน', 'อื่น ๆ'
]

// ─── State ───
const step = ref('landing')  // landing | assess | result | form | thanks
const currentQ = ref(0)      // 0-29
const answers = ref(Array(30).fill(null))

const form = ref({
  fullName: '',
  year: '',
  university: '',
  email: '',
  phoneTh: '',
  lineId: '',
  wechatId: ''
})
const submitting = ref(false)
const submitError = ref('')
const resultScore = ref(null)   // { totalScore, scoresByCategory, scoreBand }

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
  if (t >= 49) return { band: '49-60', label: 'มีระบบดีเยี่ยม', desc: 'พร้อมมาก! เน้นแบบทดสอบจำลอง + fine-tune จุดเล็ก ๆ', color: '#10b981' }
  if (t >= 36) return { band: '36-48', label: 'เริ่มพร้อมแล้ว', desc: 'ยังต้องปิดช่องว่างเฉพาะด้าน — ทำ mock quiz + ฝึก present case', color: '#3b82f6' }
  if (t >= 21) return { band: '21-35', label: 'มีความรู้บางส่วน', desc: 'ยังไม่รู้ weak point ชัด — ทำแผน 30 วัน + MCQ + บันทึกข้อผิด', color: '#f59e0b' }
  return { band: '0-20', label: 'ยังไม่มีระบบชัดเจน', desc: 'เริ่มจากเส้นทางทางการ + subject priority + แบบประเมินซ้ำใน 30 วัน', color: '#ef4444' }
})

const weakCategories = computed(() => {
  return CATEGORIES
    .map(c => ({ ...c, score: scoresByCategory.value[c.key] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
})

const canSubmitForm = computed(() => {
  const f = form.value
  return (f.email || f.phoneTh || f.lineId || f.wechatId) && f.fullName.trim().length > 0
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
  step.value = 'result'
  scrollTop()
}

function goToForm() {
  step.value = 'form'
  scrollTop()
}

async function submitForm() {
  submitError.value = ''
  if (!canSubmitForm.value) {
    submitError.value = 'กรุณากรอกชื่อ และ ช่องทางติดต่ออย่างน้อย 1 ช่อง'
    return
  }
  submitting.value = true
  try {
    const res = await fetch('/api/china/landing-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        answers: answers.value.map(v => v || 0),
        seminarBatch: SEMINAR_BATCH
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'ส่งไม่สำเร็จ')
    step.value = 'thanks'
    scrollTop()
  } catch (e) {
    submitError.value = e.message
  } finally {
    submitting.value = false
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
          <img src="/img/mascot.png" alt="MedNinja" class="brand-mark" />
          <span class="brand-name">MedNinja</span>
        </div>
        <div class="badge-cn">
          <span class="dot"></span>
          🇨🇳 เล่นได้ในจีน ไม่ต้อง VPN
        </div>
      </header>

      <div class="hero">
        <div class="hero-badge">
          <span>🎓 สำหรับนักศึกษาแพทย์ไทยในจีน</span>
        </div>

        <h1 class="hero-title">
          พร้อม<span class="hl-red">กลับไทย</span>
          <br />หรือยัง?
        </h1>

        <p class="hero-sub">
          ทำแบบประเมิน <b>30 ข้อ</b> ใน 3 นาที<br />
          รู้ทันทีว่าต้องปิดช่องว่างตรงไหน<br />
          ก่อนสอบ <b>NL / MEQ / OSCE</b>
        </p>

        <div class="hero-benefits">
          <div class="benefit">
            <div class="b-icon">📊</div>
            <div class="b-text">
              <div class="b-title">ประเมินตัวเอง</div>
              <div class="b-sub">6 หมวด · 30 ข้อ</div>
            </div>
          </div>
          <div class="benefit">
            <div class="b-icon">📘</div>
            <div class="b-text">
              <div class="b-title">รับ PDF เต็มเล่ม</div>
              <div class="b-sub">Checklist + แผน 30 วัน</div>
            </div>
          </div>
          <div class="benefit highlight">
            <div class="b-icon">🎁</div>
            <div class="b-text">
              <div class="b-title">ปรึกษาหมอแตม 30 นาที</div>
              <div class="b-sub">ฟรี! สำหรับผู้ที่กรอกครบ</div>
            </div>
          </div>
        </div>

        <button class="cta-primary" @click="startAssessment">
          🚀 เริ่มทำแบบประเมิน
        </button>

        <p class="hero-footnote">
          ⚡ ใช้เวลาแค่ 3 นาที · ไม่เก็บเงิน · ไม่มีข้อผูกมัด
        </p>
      </div>

      <div class="products">
        <div class="p-title">คอร์สที่นักเรียนแพทย์ไทยในจีนใช้อยู่</div>
        <div class="p-list">
          <div class="p-card">
            <div class="p-badge nl">NL 1+2</div>
            <div class="p-name">ระบบใหม่</div>
            <div class="p-desc">เตรียมสอบ National License แบบใหม่</div>
          </div>
          <div class="p-card">
            <div class="p-badge meq">MEQ</div>
            <div class="p-name">Modified Essay</div>
            <div class="p-desc">Clinical reasoning ทีละขั้น</div>
          </div>
          <div class="p-card">
            <div class="p-badge osce">OSCE</div>
            <div class="p-name">Ward Ready</div>
            <div class="p-desc">History + Physical + Communication</div>
          </div>
        </div>
        <div class="cn-highlight">
          <span class="cn-icon">🌏</span>
          <div>
            <b>ดูวีดีโอเรียนได้ในจีน โดยไม่ต้องใช้ VPN</b><br />
            <span class="cn-sub">เพราะ MedNinja มี server เฉพาะในจีน</span>
          </div>
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
            :class="{ selected: answers[currentQ] === opt.value }"
            @click="selectAnswer(opt.value)"
          >
            <span class="q-opt-emoji">{{ opt.emoji }}</span>
            <span class="q-opt-label">{{ opt.label }}</span>
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

    <!-- ═══════════════ STEP 3: RESULT ═══════════════ -->
    <section v-if="step === 'result'" class="result">
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
        <div class="r-cats-title">📊 คะแนนแยกหมวด</div>
        <div v-for="cat in CATEGORIES" :key="cat.key" class="r-cat">
          <div class="r-cat-head">
            <span class="r-cat-icon">{{ cat.icon }}</span>
            <span class="r-cat-name">{{ cat.name }}</span>
            <span class="r-cat-score">{{ scoresByCategory[cat.key] }}/10</span>
          </div>
          <div class="r-cat-bar">
            <div class="r-cat-bar-fill" :style="{ width: `${(scoresByCategory[cat.key] / 10) * 100}%`, background: cat.color }"></div>
          </div>
        </div>
      </div>

      <div class="r-recommend">
        <div class="r-rec-title">🎯 หมอแตมแนะนำให้เริ่มจาก</div>
        <div v-for="(cat, i) in weakCategories" :key="cat.key" class="r-rec-item">
          <div class="r-rec-rank" :style="{ background: cat.color }">{{ i + 1 }}</div>
          <div class="r-rec-body">
            <div class="r-rec-name">{{ cat.icon }} {{ cat.name }}</div>
            <div class="r-rec-score">คะแนน {{ cat.score }}/10 · ต้องปิดช่องนี้ก่อน</div>
          </div>
        </div>
      </div>

      <div class="r-cta-wrap">
        <button class="cta-primary" @click="goToForm">
          🎁 รับ PDF เต็ม + สิทธิ์ปรึกษาฟรี
        </button>
        <p class="r-cta-note">รับแผน 30 วัน + Checklist เต็มเล่ม<br />+ นัดปรึกษาหมอแตม 30 นาที ฟรี</p>
      </div>
    </section>

    <!-- ═══════════════ STEP 4: LEAD FORM ═══════════════ -->
    <section v-if="step === 'form'" class="lead-form">
      <div class="lf-header">
        <div class="lf-score-mini">
          คะแนนของคุณ: <b>{{ totalScore }}/60</b>
          <span class="lf-band-chip" :style="{ background: scoreBand.color }">{{ scoreBand.label }}</span>
        </div>
        <h2 class="lf-title">📮 กรอกช่องทางส่งเอกสาร</h2>
        <p class="lf-sub">หมอแตมจะส่ง PDF + นัดปรึกษาให้คุณเอง</p>
      </div>

      <div class="lf-form">
        <div class="lf-field">
          <label>ชื่อจริง <span class="req">*</span></label>
          <input v-model="form.fullName" type="text" placeholder="เช่น สมชาย เก่งวิชา" :disabled="submitting" />
        </div>

        <div class="lf-row">
          <div class="lf-field">
            <label>ปีที่เรียน</label>
            <select v-model="form.year" :disabled="submitting">
              <option value="">— เลือก —</option>
              <option v-for="y in YEAR_OPTIONS" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="lf-field">
            <label>มหาลัย / เมืองในจีน</label>
            <input v-model="form.university" type="text" placeholder="เช่น Wenzhou / อื่น ๆ" :disabled="submitting" />
          </div>
        </div>

        <div class="lf-divider">
          <span>ช่องทางติดต่อ <span class="req">*</span> (กรอกอย่างน้อย 1 ช่อง)</span>
        </div>

        <div class="lf-field lf-line">
          <label>💚 LINE ID <span class="tag rec">แนะนำ</span></label>
          <input v-model="form.lineId" type="text" placeholder="line-id" :disabled="submitting" />
        </div>
        <div class="lf-field lf-wechat">
          <label>💬 WeChat ID <span class="tag rec">แนะนำ</span></label>
          <input v-model="form.wechatId" type="text" placeholder="wechat-id" :disabled="submitting" />
        </div>
        <div class="lf-field">
          <label>📧 Email</label>
          <input v-model="form.email" type="email" placeholder="you@example.com" :disabled="submitting" />
        </div>
        <div class="lf-field">
          <label>📱 เบอร์ไทย</label>
          <input v-model="form.phoneTh" type="tel" placeholder="08x-xxx-xxxx" :disabled="submitting" />
        </div>

        <div class="lf-hint">
          💡 แนะนำ <b>LINE</b> หรือ <b>WeChat</b> ส่งถึงมือน้องแน่นอน
        </div>

        <div v-if="submitError" class="lf-error">⚠ {{ submitError }}</div>

        <button class="cta-primary lf-submit" :disabled="!canSubmitForm || submitting" @click="submitForm">
          <span v-if="submitting">กำลังส่ง...</span>
          <span v-else>✅ ส่งข้อมูล + รับ PDF ฟรี</span>
        </button>

        <p class="lf-privacy">🔒 ข้อมูลจะใช้เพื่อส่ง PDF + นัดปรึกษาเท่านั้น</p>
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
      <p class="th-sub">หมอแตมจะติดต่อกลับภายใน <b>24 ชั่วโมง</b><br />พร้อม PDF checklist + นัดปรึกษา</p>

      <div class="th-next">
        <div class="th-next-title">📱 เพิ่มเพื่อนตอนนี้ เพื่อรับข่าวเร็วขึ้น</div>
        <button class="th-btn line" @click="openLine">
          <span>💚</span> เพิ่ม LINE @tammy
        </button>
        <div class="th-wechat">
          <div class="th-w-title">หรือค้นหา WeChat ID:</div>
          <div class="th-w-id">medninja</div>
        </div>
      </div>

      <div class="th-tips">
        <div class="th-t-title">📅 ระหว่างรอ ทำอะไรก่อน?</div>
        <ul class="th-t-list">
          <li>เตรียมเอกสารประกาศจาก แพทยสภา / ศ.ร.ว.</li>
          <li>จดจุดที่คะแนนต่ำสุด 3 ข้อไว้ในสมุด</li>
          <li>เตรียมคำถามให้หมอแตมตอน consult</li>
        </ul>
      </div>

      <button class="th-restart" @click="step = 'landing'; scrollTop()">← กลับหน้าแรก</button>
    </section>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.page {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f4f7fc;
  color: #0f172a;
  font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', -apple-system, sans-serif;
  overflow-x: hidden;
}

/* ═══════════════ LANDING ═══════════════ */
.landing {
  position: relative;
  padding: 16px 16px 40px;
}
.hero-bg {
  position: absolute;
  top: -100px;
  left: -100px;
  right: -100px;
  height: 500px;
  background:
    radial-gradient(ellipse at 30% 30%, rgba(56, 189, 248, 0.25), transparent 60%),
    radial-gradient(ellipse at 70% 20%, rgba(220, 38, 38, 0.15), transparent 60%),
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
  margin-bottom: 20px;
}
.brand { display: flex; align-items: center; gap: 8px; }
.brand-mark { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
.brand-name { font-size: 16px; font-weight: 900; color: #0b2b5b; }
.badge-cn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.25);
  white-space: nowrap;
}
.badge-cn .dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
}

.hero {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 8px 4px 24px;
}
.hero-badge {
  display: inline-block;
  background: white;
  color: #0b2b5b;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  border: 1.5px solid rgba(30, 58, 138, 0.15);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
  margin-bottom: 18px;
}
.hero-title {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 900;
  color: #0b2b5b;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
}
.hl-red { color: #dc2626; }
.hero-sub {
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
  margin: 0 auto 24px;
  max-width: 340px;
}
.hero-sub b { color: #0b2b5b; font-weight: 800; }

.hero-benefits {
  display: grid;
  gap: 10px;
  max-width: 380px;
  margin: 0 auto 24px;
}
.benefit {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px 16px;
  border-radius: 14px;
  text-align: left;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.06);
}
.benefit.highlight {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1.5px solid #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.2);
}
.b-icon { font-size: 26px; flex-shrink: 0; }
.b-title { font-size: 14px; font-weight: 800; color: #0b2b5b; }
.b-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
.benefit.highlight .b-title { color: #92400e; }
.benefit.highlight .b-sub { color: #b45309; font-weight: 700; }

.cta-primary {
  display: block;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 16px 24px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
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
  font-size: 12px;
  color: #64748b;
  margin: 12px 0 0;
}

.products {
  margin-top: 32px;
  padding: 20px 4px;
  position: relative;
  z-index: 2;
}
.p-title {
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 16px;
}
.p-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.p-card {
  background: white;
  border-radius: 14px;
  padding: 14px 8px;
  text-align: center;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.06);
}
.p-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
}
.p-badge.nl { background: linear-gradient(135deg, #2563eb, #1e40af); }
.p-badge.meq { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
.p-badge.osce { background: linear-gradient(135deg, #ea580c, #c2410c); }
.p-name { font-size: 13px; font-weight: 800; color: #0b2b5b; margin-bottom: 4px; }
.p-desc { font-size: 11px; color: #64748b; line-height: 1.4; }

.cn-highlight {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border: 1.5px solid #22c55e;
  border-radius: 14px;
  padding: 14px 16px;
}
.cn-icon { font-size: 32px; flex-shrink: 0; }
.cn-highlight b { color: #14532d; font-size: 13.5px; }
.cn-sub { font-size: 12px; color: #166534; }

/* ═══════════════ ASSESSMENT ═══════════════ */
.assess {
  padding: 16px 16px 40px;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #ffffff 0%, #f4f7fc 100%);
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
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 28px;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease, background 0.3s ease;
}

.q-container {
  max-width: 420px;
  margin: 0 auto;
}
.q-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 16px;
}
.q-cat-icon { font-size: 20px; }
.q-cat-name { flex: 1; }
.q-cat-num {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 999px;
}
.q-text {
  font-size: 22px;
  line-height: 1.4;
  font-weight: 800;
  color: #0b2b5b;
  margin: 0 0 28px;
}

.q-options {
  display: grid;
  gap: 10px;
  margin-bottom: 24px;
}
.q-opt {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  text-align: left;
}
.q-opt:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.12);
}
.q-opt.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
}
.q-opt-emoji { font-size: 24px; }
.q-opt-label { flex: 1; }

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
  padding: 20px 16px 40px;
  max-width: 480px;
  margin: 0 auto;
}
.result-hero {
  text-align: center;
  padding: 24px 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  margin-bottom: 20px;
}
.r-score-circle {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 16px;
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
  padding: 20px 16px 40px;
  max-width: 480px;
  margin: 0 auto;
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
  padding: 40px 20px;
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
