<template>
  <div class="ddx-practice">
    <!-- Header -->
    <div class="practice-header">
      <div class="container">
        <router-link :to="`/my/ddx/${$route.params.id}/read`" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          กลับดูสรุป
        </router-link>
      </div>
    </div>

    <div class="container practice-body">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="skeleton" style="height: 40px; width: 60%; margin: 0 auto 24px"></div>
        <div class="skeleton" style="height: 200px"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <router-link to="/my/ddx" class="btn-primary-sm">กลับ DDx Hub</router-link>
      </div>

      <!-- ═══ PRACTICE MODE ═══ -->
      <template v-else-if="approach && phase === 'input'">
        <div class="practice-card">
          <div class="symptom-prompt">
            <span class="prompt-label">อาการ</span>
            <h2>{{ approach.symptomName }}</h2>
            <p v-if="approach.symptomNameEn" class="prompt-en">{{ approach.symptomNameEn }}</p>
          </div>

          <div class="prompt-question">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 0v.75m0-3.375V16.5m0 1.125h.008v.008H12v-.008z"/></svg>
            นึกถึง Differential Diagnosis อะไรได้บ้าง?
          </div>

          <!-- Timer -->
          <div class="timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ formatTime(elapsedSec) }}
          </div>

          <!-- Tag Input -->
          <div class="tag-input-area">
            <div class="entered-tags">
              <span v-for="(tag, i) in answers" :key="i" class="answer-tag">
                {{ tag }}
                <button @click="removeAnswer(i)" class="tag-remove">&times;</button>
              </span>
            </div>
            <div class="input-row">
              <input
                ref="inputEl"
                v-model="currentInput"
                @keydown.enter.prevent="addAnswer"
                type="text"
                class="tag-input"
                placeholder="พิมพ์ชื่อโรค แล้วกด Enter..."
                :disabled="submitting"
              />
              <button @click="addAnswer" class="btn-add" :disabled="!currentInput.trim()">เพิ่ม</button>
            </div>
          </div>

          <!-- Submit -->
          <button @click="checkAnswers" class="btn-check" :disabled="answers.length === 0 || submitting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ตรวจคำตอบ ({{ answers.length }} ข้อ)
          </button>
        </div>
      </template>

      <!-- ═══ RESULTS MODE ═══ -->
      <template v-else-if="approach && phase === 'result'">
        <div class="result-card">
          <div class="result-header">
            <h2>ผลการฝึก — {{ approach.symptomName }}</h2>
            <div class="result-summary">
              <div class="score-circle" :class="scoreClass">
                <span class="score-value">{{ resultScore }}%</span>
              </div>
              <div class="result-meta">
                <span>ตอบถูก {{ matchedCount }}/{{ totalDdx }} โรค</span>
                <span>เวลา {{ formatTime(elapsedSec) }}</span>
              </div>
            </div>
          </div>

          <!-- Matched (correct) -->
          <div v-if="matched.length > 0" class="result-section">
            <h3 class="result-section-title correct-title">ตอบถูก ({{ matched.length }})</h3>
            <div v-for="item in matched" :key="'m-'+item.name" class="result-item correct">
              <span class="result-icon">&#10003;</span>
              <div class="result-item-info">
                <span class="result-item-name">{{ item.name }}</span>
                <span v-if="item.nameEn" class="result-item-en">{{ item.nameEn }}</span>
              </div>
              <span v-if="item.frequency" :class="['freq-badge', 'freq-' + item.frequency]">
                {{ { high: 'พบบ่อย', medium: 'ปานกลาง', low: 'พบน้อย' }[item.frequency] }}
              </span>
            </div>
          </div>

          <!-- Missed -->
          <div v-if="missed.length > 0" class="result-section">
            <h3 class="result-section-title missed-title">พลาดไป ({{ missed.length }})</h3>
            <div v-for="item in missed" :key="'x-'+item.name" class="result-item missed">
              <span class="result-icon miss">&#10007;</span>
              <div class="result-item-info">
                <span class="result-item-name">{{ item.name }}</span>
                <span v-if="item.nameEn" class="result-item-en">{{ item.nameEn }}</span>
                <div v-if="item.keyClues && item.keyClues.length" class="result-clues">
                  <span v-for="(c, ci) in item.keyClues" :key="ci" class="clue-tag">{{ c }}</span>
                </div>
              </div>
              <span v-if="item.frequency" :class="['freq-badge', 'freq-' + item.frequency]">
                {{ { high: 'พบบ่อย', medium: 'ปานกลาง', low: 'พบน้อย' }[item.frequency] }}
              </span>
            </div>
          </div>

          <!-- Extra (wrong) -->
          <div v-if="extra.length > 0" class="result-section">
            <h3 class="result-section-title extra-title">ตอบเกิน ({{ extra.length }})</h3>
            <div v-for="item in extra" :key="'e-'+item" class="result-item extra">
              <span class="result-icon extra-icon">&#9711;</span>
              <span class="result-item-name">{{ item }}</span>
            </div>
          </div>

          <!-- Self-assessment -->
          <div v-if="!submitted" class="self-assess">
            <h3>จำได้ดีแค่ไหน?</h3>
            <p class="assess-hint">ให้คะแนนตัวเอง (1 = ลืมหมด, 5 = จำได้ดีมาก)</p>
            <div class="quality-buttons">
              <button v-for="q in 5" :key="q" class="quality-btn" :class="{ selected: selectedQuality === q }" @click="selectedQuality = q">
                {{ q }}
                <span class="quality-label">{{ qualityLabels[q] }}</span>
              </button>
            </div>
            <button @click="submitResult" class="btn-submit" :disabled="selectedQuality === 0 || submitting">
              {{ submitting ? 'กำลังบันทึก...' : 'บันทึกผล' }}
            </button>
          </div>

          <!-- Post-submit actions -->
          <div v-else class="post-actions">
            <div class="success-msg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              บันทึกแล้ว
            </div>
            <div class="action-buttons">
              <router-link :to="`/my/ddx/${approach._id}/read`" class="btn-action outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
                ดูสรุป
              </router-link>
              <router-link v-if="nextApproachId" :to="`/my/ddx/${nextApproachId}/practice`" class="btn-action primary">
                ถัดไป
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
              </router-link>
              <router-link v-else to="/my/ddx" class="btn-action primary">
                กลับ DDx Hub
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import approachService from '../services/approachService'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const approach = ref(null)
const phase = ref('input') // 'input' | 'result'

// Input state
const currentInput = ref('')
const answers = ref([])
const inputEl = ref(null)
const submitting = ref(false)

// Timer
const elapsedSec = ref(0)
let timerInterval = null

// Result state
const matched = ref([])
const missed = ref([])
const extra = ref([])
const selectedQuality = ref(0)
const submitted = ref(false)
const nextApproachId = ref(null)

const qualityLabels = { 1: 'ลืมหมด', 2: 'จำได้นิดหน่อย', 3: 'พอนึกออก', 4: 'จำได้ดี', 5: 'แม่น' }

const totalDdx = computed(() => approach.value?.differentials?.length || 0)
const matchedCount = computed(() => matched.value.length)
const resultScore = computed(() => totalDdx.value > 0 ? Math.round((matchedCount.value / totalDdx.value) * 100) : 0)
const scoreClass = computed(() => {
  if (resultScore.value >= 80) return 'score-green'
  if (resultScore.value >= 50) return 'score-orange'
  return 'score-red'
})

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function addAnswer() {
  const val = currentInput.value.trim()
  if (!val) return
  if (!answers.value.includes(val)) {
    answers.value.push(val)
  }
  currentInput.value = ''
  inputEl.value?.focus()
}

function removeAnswer(idx) {
  answers.value.splice(idx, 1)
}

function checkAnswers() {
  if (!approach.value || answers.length === 0) return
  clearInterval(timerInterval)

  const differentials = approach.value.differentials || []
  const answeredLower = answers.value.map(a => a.toLowerCase().trim())

  const matchedList = []
  const missedList = []

  differentials.forEach(ddx => {
    const names = [ddx.name, ddx.nameEn, ...(ddx.aliases || [])].filter(Boolean).map(n => n.toLowerCase().trim())
    const isMatched = answeredLower.some(a => names.some(n => n.includes(a) || a.includes(n)))
    if (isMatched) {
      matchedList.push(ddx)
    } else {
      missedList.push(ddx)
    }
  })

  // Find extra answers (not matching any differential)
  const allNames = differentials.flatMap(d => [d.name, d.nameEn, ...(d.aliases || [])].filter(Boolean).map(n => n.toLowerCase().trim()))
  const extraList = answers.value.filter(a => {
    const al = a.toLowerCase().trim()
    return !allNames.some(n => n.includes(al) || al.includes(n))
  })

  matched.value = matchedList
  missed.value = missedList
  extra.value = extraList
  phase.value = 'result'
}

async function submitResult() {
  if (submitting.value || selectedQuality.value === 0) return
  submitting.value = true
  try {
    const res = await approachService.submitPractice(approach.value._id, {
      answeredDiagnoses: answers.value,
      score: resultScore.value,
      quality: selectedQuality.value,
      timeTakenSec: elapsedSec.value
    })
    submitted.value = true
    // Check for next in review queue
    if (res.nextApproachId) {
      nextApproachId.value = res.nextApproachId
    }
  } catch (err) {
    console.error('[DdxPractice] submit error', err)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.id
    const [approachRes, queueRes] = await Promise.all([
      approachService.fetchApproach(id),
      approachService.fetchReviewQueue().catch(() => ({ approaches: [] }))
    ])
    approach.value = approachRes.approach || approachRes

    // Find next approach in queue (skip current)
    const queue = queueRes.approaches || queueRes || []
    const currentIdx = queue.findIndex(q => q._id === id)
    if (currentIdx >= 0 && currentIdx < queue.length - 1) {
      nextApproachId.value = queue[currentIdx + 1]._id
    } else if (queue.length > 0 && queue[0]._id !== id) {
      nextApproachId.value = queue[0]._id
    }

    // Start timer
    timerInterval = setInterval(() => { elapsedSec.value++ }, 1000)
  } catch (err) {
    console.error('[DdxPractice] fetch error', err)
    error.value = 'ไม่สามารถโหลดข้อมูลได้'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.ddx-practice {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ═══ Header ═══ */
.practice-header {
  background: #0f172a;
  padding: 16px 0;
}
.practice-header .container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}
.back-link:hover { color: #fff; }
.back-link svg { width: 18px; height: 18px; }

/* ═══ Body ═══ */
.practice-body {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* ═══ Practice Card ═══ */
.practice-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.symptom-prompt { text-align: center; margin-bottom: 20px; }
.prompt-label {
  display: inline-block;
  background: #eff6ff;
  color: #3b82f6;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.symptom-prompt h2 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.prompt-en { font-size: 16px; color: #94a3b8; margin: 4px 0 0; }

.prompt-question {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: #64748b;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 600;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
  margin-bottom: 20px;
}

/* ═══ Tag Input ═══ */
.tag-input-area { margin-bottom: 24px; }
.entered-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 20px;
}
.answer-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  color: #3b82f6;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.tag-remove {
  background: none;
  border: none;
  color: #93c5fd;
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  transition: color 0.2s;
}
.tag-remove:hover { color: #ef4444; }

.input-row { display: flex; gap: 8px; }
.tag-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.tag-input:focus { border-color: #3b82f6; }
.tag-input::placeholder { color: #cbd5e1; }

.btn-add {
  padding: 12px 20px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-add:hover:not(:disabled) { background: #e2e8f0; }
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-check {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-check:hover:not(:disabled) { background: #2563eb; }
.btn-check:disabled { opacity: 0.4; cursor: not-allowed; }

/* ═══ Result Card ═══ */
.result-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.result-header { text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; }
.result-header h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }

.result-summary { display: flex; align-items: center; justify-content: center; gap: 20px; }
.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.score-value { font-size: 22px; font-weight: 800; }
.score-green { background: #f0fdf4; border: 3px solid #22c55e; color: #22c55e; }
.score-orange { background: #fffbeb; border: 3px solid #f59e0b; color: #f59e0b; }
.score-red { background: #fef2f2; border: 3px solid #ef4444; color: #ef4444; }

.result-meta { display: flex; flex-direction: column; gap: 4px; text-align: left; }
.result-meta span { font-size: 14px; color: #64748b; }

/* ═══ Result Sections ═══ */
.result-section { margin-bottom: 20px; }
.result-section-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px;
}
.correct-title { color: #22c55e; }
.missed-title { color: #ef4444; }
.extra-title { color: #94a3b8; }

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 6px;
}
.result-item.correct { background: #f0fdf4; }
.result-item.missed { background: #fef2f2; }
.result-item.extra { background: #f8fafc; }

.result-icon { font-size: 16px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
.result-item.correct .result-icon { color: #22c55e; }
.result-icon.miss { color: #ef4444; }
.result-icon.extra-icon { color: #94a3b8; font-size: 14px; }

.result-item-info { flex: 1; }
.result-item-name { font-size: 15px; font-weight: 600; color: #0f172a; }
.result-item-en { display: block; font-size: 13px; color: #94a3b8; }
.result-clues { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.clue-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #fef2f2;
  color: #ef4444;
  border-radius: 4px;
  font-size: 12px;
}

.freq-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.freq-high { background: #fef2f2; color: #ef4444; }
.freq-medium { background: #fffbeb; color: #f59e0b; }
.freq-low { background: #f0fdf4; color: #22c55e; }

/* ═══ Self Assessment ═══ */
.self-assess {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}
.self-assess h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.assess-hint { font-size: 14px; color: #94a3b8; margin: 0 0 16px; }

.quality-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}
.quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
  font-weight: 700;
  color: #475569;
  min-width: 70px;
  font-family: inherit;
}
.quality-btn:hover { border-color: #3b82f6; }
.quality-btn.selected { border-color: #3b82f6; background: #eff6ff; color: #3b82f6; }
.quality-label { font-size: 11px; font-weight: 500; color: #94a3b8; }
.quality-btn.selected .quality-label { color: #3b82f6; }

.btn-submit {
  padding: 12px 40px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-submit:hover:not(:disabled) { background: #2563eb; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* ═══ Post Actions ═══ */
.post-actions { margin-top: 24px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; }
.success-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #22c55e;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.action-buttons { display: flex; gap: 12px; justify-content: center; }
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  font-family: inherit;
}
.btn-action.outline {
  background: #fff;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.btn-action.outline:hover { border-color: #3b82f6; color: #3b82f6; }
.btn-action.primary {
  background: #3b82f6;
  color: #fff;
  border: none;
}
.btn-action.primary:hover { background: #2563eb; }

/* ═══ States ═══ */
.loading-state { padding: 40px 0; }
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.error-state { text-align: center; padding: 60px 20px; color: #64748b; }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .practice-card, .result-card { padding: 24px 16px; }
  .symptom-prompt h2 { font-size: 22px; }
  .quality-buttons { flex-wrap: wrap; }
  .quality-btn { min-width: 56px; padding: 10px 12px; font-size: 18px; }
  .action-buttons { flex-direction: column; }
  .btn-action { justify-content: center; }
  .result-summary { flex-direction: column; }
  .result-meta { text-align: center; }
}
</style>
