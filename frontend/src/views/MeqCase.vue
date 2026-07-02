<template>
  <div class="meq-case">
    <!-- Top Bar -->
    <div class="top-bar">
      <router-link to="/my/meq" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        กลับ
      </router-link>
      <div class="top-bar-info">
        <span class="case-label">MEQ</span>
        <span v-if="meqCase" class="case-title-bar">{{ meqCase.title }}</span>
      </div>
      <div class="top-bar-timer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ formatTime(elapsedSec) }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-wrapper">
      <div class="loading-content">
        <div class="skeleton" style="height: 200px; margin-bottom: 24px"></div>
        <div class="skeleton" style="height: 40px; width: 60%; margin-bottom: 16px"></div>
        <div class="skeleton" style="height: 120px"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-wrapper">
      <p>{{ error }}</p>
      <router-link to="/my/meq" class="btn-primary">กลับรายการเคส</router-link>
    </div>

    <!-- Main Layout -->
    <div v-else-if="meqCase" class="case-layout" :class="{ 'show-summary': phase === 'summary' }">

      <!-- Sidebar: Step Progress -->
      <aside class="step-sidebar" :class="{ 'mobile-open': mobileStepOpen }">
        <div class="sidebar-header">
          <h3>ขั้นตอน</h3>
          <button class="sidebar-close-mobile" @click="mobileStepOpen = false">
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
          </button>
        </div>
        <div class="step-list">
          <div
            v-for="(step, idx) in meqCase.steps"
            :key="idx"
            class="step-item"
            :class="{
              'step-done': idx < currentStep,
              'step-current': idx === currentStep && phase !== 'summary',
              'step-locked': idx > currentStep
            }"
          >
            <div class="step-indicator">
              <svg v-if="idx < currentStep" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="step-text">
              <span class="step-name">{{ step.title || ('ขั้นตอนที่ ' + (idx + 1)) }}</span>
              <span v-if="idx < currentStep && stepScores[idx] != null" class="step-score-mini" :class="getScoreClass(stepScores[idx])">{{ stepScores[idx] }}%</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile step toggle -->
      <button class="mobile-step-toggle" @click="mobileStepOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
        ขั้นตอนที่ {{ currentStep + 1 }}/{{ meqCase.steps.length }}
      </button>

      <!-- Main Content -->
      <main class="case-main">

        <!-- ═══ SCENARIO (shown at start and always visible) ═══ -->
        <div v-if="phase === 'scenario'" class="scenario-phase">
          <div class="patient-card">
            <div class="patient-card-header">
              <div class="patient-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
              <div class="patient-label">
                <span class="label-tag">PATIENT SCENARIO</span>
                <h2>{{ meqCase.title }}</h2>
              </div>
            </div>
            <div class="patient-card-body">
              <p class="scenario-text" v-html="formatText(meqCase.scenario)"></p>
            </div>
            <div v-if="meqCase.category || meqCase.difficulty" class="patient-card-meta">
              <span v-if="meqCase.category" class="pmeta-tag">{{ meqCase.category }}</span>
              <span v-if="meqCase.difficulty" :class="['pmeta-tag', 'diff-' + meqCase.difficulty]">
                {{ { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[meqCase.difficulty] || meqCase.difficulty }}
              </span>
              <span v-if="meqCase.steps" class="pmeta-tag">{{ meqCase.steps.length }} steps</span>
            </div>
          </div>

          <button class="btn-start" @click="startCase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
            เริ่มทำเคส
          </button>
        </div>

        <!-- ═══ STEP PHASE ═══ -->
        <div v-else-if="phase === 'step'" class="step-phase">

          <!-- Scenario reminder (collapsible) -->
          <div class="scenario-reminder" :class="{ collapsed: scenarioCollapsed }">
            <button class="reminder-toggle" @click="scenarioCollapsed = !scenarioCollapsed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              Scenario
              <svg :class="{ rotated: !scenarioCollapsed }" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
            </button>
            <div v-show="!scenarioCollapsed" class="reminder-body">
              <p v-html="formatText(meqCase.scenario)"></p>
            </div>
          </div>

          <!-- Revealed info from previous steps -->
          <TransitionGroup name="reveal-list" tag="div" class="revealed-history">
            <div v-for="(info, idx) in revealedInfos" :key="'rev-' + idx" class="revealed-block">
              <div class="revealed-label">ข้อมูลจากขั้นตอนที่ {{ info.stepNum }}</div>
              <p v-html="formatText(info.text)"></p>
            </div>
          </TransitionGroup>

          <!-- Current Step -->
          <Transition name="step-fade" mode="out-in">
            <div :key="'step-' + currentStep" class="current-step-card">
              <div class="step-header">
                <span class="step-number">ขั้นตอนที่ {{ currentStep + 1 }}</span>
                <h3 class="step-question">{{ currentStepData.question }}</h3>
              </div>

              <!-- Answer Input -->
              <div v-if="!stepSubmitted" class="answer-area">
                <textarea
                  ref="answerInput"
                  v-model="currentAnswer"
                  class="answer-textarea"
                  :placeholder="currentStepData.placeholder || 'พิมพ์คำตอบของคุณ...'"
                  rows="6"
                  :disabled="submitting"
                ></textarea>
                <div class="answer-footer">
                  <span class="char-count" :class="{ warn: currentAnswer.length > 2000 }">
                    {{ currentAnswer.length }} ตัวอักษร
                  </span>
                  <button class="btn-submit-answer" @click="submitStepAnswer" :disabled="!currentAnswer.trim() || submitting">
                    <template v-if="submitting">
                      <span class="spinner-sm"></span> กำลังตรวจ...
                    </template>
                    <template v-else>
                      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"/></svg>
                      ส่งคำตอบ
                    </template>
                  </button>
                </div>
              </div>

              <!-- Result after submit -->
              <Transition name="slide-reveal">
                <div v-if="stepSubmitted" class="step-result">
                  <!-- Score -->
                  <div class="step-score-section">
                    <div class="step-score-circle" :class="getScoreClass(stepResult.score)">
                      <span class="score-number">{{ stepResult.score }}</span>
                      <span class="score-unit">%</span>
                    </div>
                    <div class="step-score-label">คะแนนขั้นตอนนี้</div>
                  </div>

                  <!-- Explanation -->
                  <div v-if="stepResult.explanation" class="explanation-box">
                    <div class="explanation-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/></svg>
                      เฉลย
                    </div>
                    <p v-html="formatText(stepResult.explanation)"></p>
                  </div>

                  <!-- Revealed new info -->
                  <div v-if="stepResult.revealText" class="reveal-box">
                    <div class="reveal-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      ข้อมูลเพิ่มเติม
                    </div>
                    <p v-html="formatText(stepResult.revealText)"></p>
                  </div>

                  <!-- Next button -->
                  <button
                    v-if="currentStep < meqCase.steps.length - 1"
                    class="btn-next"
                    @click="goNextStep"
                  >
                    ถัดไป
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
                  </button>
                  <button
                    v-else
                    class="btn-next btn-finish"
                    @click="finishCase"
                    :disabled="completing"
                  >
                    <template v-if="completing">
                      <span class="spinner-sm"></span> กำลังสรุป...
                    </template>
                    <template v-else>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
                      ดูสรุปผล
                    </template>
                  </button>
                </div>
              </Transition>
            </div>
          </Transition>
        </div>

        <!-- ═══ SUMMARY PHASE ═══ -->
        <div v-else-if="phase === 'summary'" class="summary-phase">
          <!-- Celebration -->
          <div class="celebration" ref="celebrationEl">
            <div class="confetti-container" v-if="showConfetti">
              <div v-for="i in 40" :key="i" class="confetti-piece" :style="confettiStyle(i)"></div>
            </div>

            <div class="summary-score-card">
              <div class="summary-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
              </div>
              <h2>สรุปผลการทำเคส</h2>
              <p class="summary-case-title">{{ meqCase.title }}</p>
              <div class="summary-total-score" :class="getScoreClass(totalScore)">
                <span class="total-score-number">{{ totalScore }}</span>
                <span class="total-score-label">คะแนนรวม</span>
              </div>
              <div class="summary-stats">
                <div class="summary-stat">
                  <span class="summary-stat-value">{{ meqCase.steps.length }}</span>
                  <span class="summary-stat-label">ขั้นตอน</span>
                </div>
                <div class="summary-stat">
                  <span class="summary-stat-value">{{ formatTime(elapsedSec) }}</span>
                  <span class="summary-stat-label">เวลาที่ใช้</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Step Review -->
          <div class="summary-steps-review">
            <h3>รายละเอียดแต่ละขั้นตอน</h3>
            <div
              v-for="(step, idx) in meqCase.steps"
              :key="'review-' + idx"
              class="review-step-card"
            >
              <div class="review-step-header">
                <span class="review-step-num">{{ idx + 1 }}</span>
                <span class="review-step-title">{{ step.title || step.question }}</span>
                <span v-if="stepScores[idx] != null" class="review-step-score" :class="getScoreClass(stepScores[idx])">{{ stepScores[idx] }}%</span>
              </div>
              <div class="review-step-body">
                <div class="review-answer">
                  <span class="review-label">คำตอบของคุณ:</span>
                  <p>{{ stepAnswers[idx] || '-' }}</p>
                </div>
                <div v-if="stepExplanations[idx]" class="review-explanation">
                  <span class="review-label">เฉลย:</span>
                  <p v-html="formatText(stepExplanations[idx])"></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="summary-actions">
            <router-link to="/my/meq" class="btn-action outline">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
              กลับรายการเคส
            </router-link>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import meqService from '../services/meqService'

const route = useRoute()

// State
const loading = ref(true)
const error = ref(null)
const meqCase = ref(null)
const phase = ref('scenario') // scenario | step | summary
const currentStep = ref(0)
const currentAnswer = ref('')
const stepSubmitted = ref(false)
const stepResult = ref({})
const submitting = ref(false)
const completing = ref(false)
const scenarioCollapsed = ref(true)
const mobileStepOpen = ref(false)
const showConfetti = ref(false)

// Timer
const elapsedSec = ref(0)
let timerInterval = null

// Track all step data
const stepScores = ref({})
const stepAnswers = ref({})
const stepExplanations = ref({})
const revealedInfos = ref([])

// Refs
const answerInput = ref(null)

const currentStepData = computed(() => {
  if (!meqCase.value || !meqCase.value.steps) return {}
  return meqCase.value.steps[currentStep.value] || {}
})

const totalScore = computed(() => {
  const scores = Object.values(stepScores.value)
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
})

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatText(text) {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}

function getScoreClass(score) {
  if (score >= 80) return 'score-green'
  if (score >= 50) return 'score-orange'
  return 'score-red'
}

function confettiStyle(i) {
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']
  const color = colors[i % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  const size = 6 + Math.random() * 6
  const rotation = Math.random() * 360
  return {
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    width: size + 'px',
    height: size + 'px',
    backgroundColor: color,
    transform: `rotate(${rotation}deg)`
  }
}

async function startCase() {
  try {
    await meqService.startCase(meqCase.value._id)
  } catch (e) {
    // OK if start fails (already started)
  }
  phase.value = 'step'
  currentStep.value = 0
  // Start timer
  timerInterval = setInterval(() => { elapsedSec.value++ }, 1000)
  await nextTick()
  answerInput.value?.focus()
}

async function submitStepAnswer() {
  if (!currentAnswer.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const res = await meqService.submitAnswer(meqCase.value._id, {
      stepIndex: currentStep.value,
      answer: currentAnswer.value.trim()
    })
    const result = res.result || res
    stepResult.value = {
      score: result.score ?? 0,
      explanation: result.explanation || '',
      revealText: result.revealText || ''
    }
    stepScores.value[currentStep.value] = result.score ?? 0
    stepAnswers.value[currentStep.value] = currentAnswer.value.trim()
    stepExplanations.value[currentStep.value] = result.explanation || ''
    stepSubmitted.value = true
  } catch (err) {
    console.error('[MeqCase] submit error', err)
    // Fallback: show as submitted with 0 score
    stepResult.value = { score: 0, explanation: 'ไม่สามารถตรวจคำตอบได้ กรุณาลองใหม่', revealText: '' }
    stepScores.value[currentStep.value] = 0
    stepAnswers.value[currentStep.value] = currentAnswer.value.trim()
    stepSubmitted.value = true
  } finally {
    submitting.value = false
  }
}

async function goNextStep() {
  // Save revealed info
  if (stepResult.value.revealText) {
    revealedInfos.value.push({
      stepNum: currentStep.value + 1,
      text: stepResult.value.revealText
    })
  }
  currentStep.value++
  currentAnswer.value = ''
  stepSubmitted.value = false
  stepResult.value = {}
  mobileStepOpen.value = false
  await nextTick()
  answerInput.value?.focus()
  // Scroll to top of main
  document.querySelector('.case-main')?.scrollTo({ top: 0, behavior: 'smooth' })
}

async function finishCase() {
  if (completing.value) return
  completing.value = true
  // Save last revealed info
  if (stepResult.value.revealText) {
    revealedInfos.value.push({
      stepNum: currentStep.value + 1,
      text: stepResult.value.revealText
    })
  }
  try {
    await meqService.completeCase(meqCase.value._id)
  } catch (e) {
    // Non-critical
  }
  clearInterval(timerInterval)
  phase.value = 'summary'
  completing.value = false
  // Trigger confetti
  await nextTick()
  showConfetti.value = true
  setTimeout(() => { showConfetti.value = false }, 4000)
}

onMounted(async () => {
  try {
    const id = route.params.id
    const res = await meqService.fetchCase(id)
    meqCase.value = res.meqCase || res.case || res

    // If already in progress, restore state
    if (meqCase.value.attempt) {
      const attempt = meqCase.value.attempt
      if (attempt.status === 'completed') {
        // Show summary directly
        phase.value = 'summary'
        if (attempt.stepResults) {
          attempt.stepResults.forEach((r, idx) => {
            stepScores.value[idx] = r.score ?? 0
            stepAnswers.value[idx] = r.answer || ''
            stepExplanations.value[idx] = r.explanation || ''
          })
        }
        elapsedSec.value = attempt.timeTakenSec || 0
      } else if (attempt.status === 'in_progress') {
        phase.value = 'step'
        currentStep.value = attempt.currentStep || 0
        if (attempt.stepResults) {
          attempt.stepResults.forEach((r, idx) => {
            stepScores.value[idx] = r.score ?? 0
            stepAnswers.value[idx] = r.answer || ''
            stepExplanations.value[idx] = r.explanation || ''
            if (r.revealText) {
              revealedInfos.value.push({ stepNum: idx + 1, text: r.revealText })
            }
          })
        }
        elapsedSec.value = attempt.timeTakenSec || 0
        timerInterval = setInterval(() => { elapsedSec.value++ }, 1000)
        await nextTick()
        answerInput.value?.focus()
      }
    }
  } catch (err) {
    console.error('[MeqCase] fetch error', err)
    error.value = 'ไม่สามารถโหลดเคสได้'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.meq-case {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ═══ Top Bar ═══ */
.top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #0f172a;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.top-bar .back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
  flex-shrink: 0;
}
.top-bar .back-link:hover { color: #fff; }
.top-bar .back-link svg { width: 18px; height: 18px; }

.top-bar-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.case-label {
  background: #3b82f6;
  color: #fff;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.case-title-bar {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.5);
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ═══ Layout ═══ */
.case-layout {
  display: flex;
  min-height: calc(100vh - 52px);
}

/* ═══ Sidebar ═══ */
.step-sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  padding: 20px 0;
  flex-shrink: 0;
  position: sticky;
  top: 52px;
  height: calc(100vh - 52px);
  overflow-y: auto;
}
.sidebar-header {
  padding: 0 20px 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}
.sidebar-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}
.sidebar-close-mobile { display: none; }

.step-list { padding: 0 12px; }
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: background 0.2s;
  position: relative;
}
.step-item::before {
  content: '';
  position: absolute;
  left: 24px;
  top: 36px;
  bottom: -8px;
  width: 2px;
  background: #e2e8f0;
}
.step-item:last-child::before { display: none; }

.step-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}
.step-locked .step-indicator {
  background: #f1f5f9;
  color: #cbd5e1;
  border: 2px solid #e2e8f0;
}
.step-current .step-indicator {
  background: #3b82f6;
  color: #fff;
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}
.step-done .step-indicator {
  background: #22c55e;
  color: #fff;
  border: 2px solid #22c55e;
}
.step-done::before { background: #22c55e; }
.step-current::before { background: #3b82f6; }

.step-current {
  background: #eff6ff;
}

.step-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 3px;
}
.step-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}
.step-locked .step-name { color: #cbd5e1; }
.step-score-mini {
  font-size: 12px;
  font-weight: 700;
}

/* ═══ Mobile step toggle ═══ */
.mobile-step-toggle {
  display: none;
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 90;
  padding: 10px 16px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  font-family: inherit;
}

/* ═══ Main Content ═══ */
.case-main {
  flex: 1;
  padding: 24px 32px 60px;
  max-width: 760px;
  margin: 0 auto;
  overflow-y: auto;
}

/* ═══ Scenario Phase ═══ */
.patient-card {
  background: #1e293b;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  margin-bottom: 24px;
}
.patient-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px 0;
}
.patient-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(59, 130, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #60a5fa;
}
.label-tag {
  display: inline-block;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.patient-label h2 {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.patient-card-body {
  padding: 20px 28px 24px;
}
.scenario-text {
  font-size: 16px;
  line-height: 1.8;
  color: #cbd5e1;
  margin: 0;
}

.patient-card-meta {
  display: flex;
  gap: 8px;
  padding: 0 28px 20px;
}
.pmeta-tag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
}
.pmeta-tag.diff-easy { background: rgba(34,197,94,0.15); color: #4ade80; }
.pmeta-tag.diff-medium { background: rgba(245,158,11,0.15); color: #fbbf24; }
.pmeta-tag.diff-hard { background: rgba(239,68,68,0.15); color: #f87171; }

.btn-start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}
.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
}

/* ═══ Step Phase ═══ */
.scenario-reminder {
  background: #1e293b;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}
.reminder-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.2s;
}
.reminder-toggle:hover { color: #fff; }
.reminder-toggle svg:last-child {
  margin-left: auto;
  transition: transform 0.3s;
}
.reminder-toggle svg.rotated { transform: rotate(180deg); }
.reminder-body {
  padding: 0 16px 16px;
}
.reminder-body p {
  font-size: 14px;
  line-height: 1.7;
  color: #94a3b8;
  margin: 0;
}

/* Revealed history */
.revealed-history { margin-bottom: 16px; }
.revealed-block {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 0 12px 12px 0;
  padding: 14px 18px;
  margin-bottom: 10px;
}
.revealed-label {
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.revealed-block p {
  font-size: 14px;
  line-height: 1.6;
  color: #1e40af;
  margin: 0;
}

/* Current Step Card */
.current-step-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 28px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.step-header { margin-bottom: 20px; }
.step-number {
  display: inline-block;
  background: #3b82f6;
  color: #fff;
  padding: 3px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 10px;
}
.step-question {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.5;
}

/* Answer area */
.answer-area { margin-top: 4px; }
.answer-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 16px;
  line-height: 1.7;
  font-family: 'Noto Sans Thai', sans-serif;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  min-height: 140px;
  box-sizing: border-box;
}
.answer-textarea:focus { border-color: #3b82f6; }
.answer-textarea::placeholder { color: #cbd5e1; }

.answer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.char-count {
  font-size: 13px;
  color: #94a3b8;
}
.char-count.warn { color: #f59e0b; }

.btn-submit-answer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-submit-answer:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
.btn-submit-answer:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Step Result */
.step-result {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.step-score-section {
  text-align: center;
  margin-bottom: 20px;
}
.step-score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin-bottom: 6px;
}
.step-score-circle.score-green { background: #f0fdf4; border: 4px solid #22c55e; }
.step-score-circle.score-orange { background: #fffbeb; border: 4px solid #f59e0b; }
.step-score-circle.score-red { background: #fef2f2; border: 4px solid #ef4444; }

.score-number { font-size: 28px; font-weight: 900; }
.score-unit { font-size: 14px; font-weight: 700; margin-top: -4px; }
.step-score-circle.score-green .score-number,
.step-score-circle.score-green .score-unit { color: #22c55e; }
.step-score-circle.score-orange .score-number,
.step-score-circle.score-orange .score-unit { color: #f59e0b; }
.step-score-circle.score-red .score-number,
.step-score-circle.score-red .score-unit { color: #ef4444; }

.step-score-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.explanation-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 14px;
}
.explanation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #b45309;
  margin-bottom: 8px;
}
.explanation-box p {
  font-size: 15px;
  line-height: 1.7;
  color: #78350f;
  margin: 0;
}

.reveal-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 20px;
  animation: slideRevealAnim 0.5s ease;
}
@keyframes slideRevealAnim {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.reveal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 8px;
}
.reveal-box p {
  font-size: 15px;
  line-height: 1.7;
  color: #1e40af;
  margin: 0;
}

.btn-next {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-next:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
.btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-next.btn-finish {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}
.btn-next.btn-finish:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
}

/* ═══ Summary Phase ═══ */
.summary-phase {
  max-width: 660px;
  margin: 0 auto;
}

.celebration {
  position: relative;
  margin-bottom: 32px;
}

/* Confetti */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}
.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
}
@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
}

.summary-score-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  position: relative;
}
.summary-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  margin-bottom: 16px;
  color: #fff;
  animation: badgePop 0.5s ease;
}
@keyframes badgePop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.summary-score-card h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}
.summary-case-title {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 24px;
}

.summary-total-score {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 20px;
}
.summary-total-score.score-green { background: #f0fdf4; border: 5px solid #22c55e; }
.summary-total-score.score-orange { background: #fffbeb; border: 5px solid #f59e0b; }
.summary-total-score.score-red { background: #fef2f2; border: 5px solid #ef4444; }

.total-score-number { font-size: 36px; font-weight: 900; }
.total-score-label { font-size: 12px; font-weight: 700; margin-top: -2px; }
.summary-total-score.score-green .total-score-number,
.summary-total-score.score-green .total-score-label { color: #22c55e; }
.summary-total-score.score-orange .total-score-number,
.summary-total-score.score-orange .total-score-label { color: #f59e0b; }
.summary-total-score.score-red .total-score-number,
.summary-total-score.score-red .total-score-label { color: #ef4444; }

.summary-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}
.summary-stat { display: flex; flex-direction: column; align-items: center; }
.summary-stat-value { font-size: 20px; font-weight: 800; color: #0f172a; }
.summary-stat-label { font-size: 12px; color: #94a3b8; }

/* Step Review in summary */
.summary-steps-review { margin-bottom: 32px; }
.summary-steps-review h3 {
  font-size: 16px;
  font-weight: 700;
  color: #64748b;
  margin: 0 0 16px;
}

.review-step-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
}
.review-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}
.review-step-num {
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #64748b;
  flex-shrink: 0;
}
.review-step-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.review-step-score {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
}
.review-step-score.score-green { background: #f0fdf4; color: #22c55e; }
.review-step-score.score-orange { background: #fffbeb; color: #f59e0b; }
.review-step-score.score-red { background: #fef2f2; color: #ef4444; }

.review-step-body { padding: 14px 18px; }
.review-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.review-answer { margin-bottom: 12px; }
.review-answer p {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
.review-explanation p {
  font-size: 14px;
  color: #1e40af;
  margin: 0;
  line-height: 1.6;
  background: #eff6ff;
  padding: 10px 14px;
  border-radius: 10px;
}

/* Summary Actions */
.summary-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
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

/* ═══ Transitions ═══ */
.step-fade-enter-active { animation: stepIn 0.4s ease; }
.step-fade-leave-active { animation: stepOut 0.25s ease; }
@keyframes stepIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes stepOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-30px); }
}

.slide-reveal-enter-active { animation: slideRevealAnim 0.5s ease; }

.reveal-list-enter-active { animation: slideRevealAnim 0.4s ease; }

/* ═══ States ═══ */
.loading-wrapper, .error-wrapper {
  max-width: 660px;
  margin: 0 auto;
  padding: 40px 20px;
}
.error-wrapper { text-align: center; color: #64748b; }
.btn-primary {
  display: inline-block;
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  margin-top: 12px;
  font-family: inherit;
}
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.score-green .step-score-mini { color: #22c55e; }
.score-orange .step-score-mini { color: #f59e0b; }
.score-red .step-score-mini { color: #ef4444; }

/* ═══ Responsive ═══ */
@media (max-width: 768px) {
  .step-sidebar {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 200;
    box-shadow: 4px 0 24px rgba(0,0,0,0.2);
  }
  .step-sidebar.mobile-open {
    display: block;
  }
  .sidebar-close-mobile {
    display: block;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .mobile-step-toggle { display: flex; }
  .case-main {
    padding: 20px 16px 80px;
  }
  .patient-card-header { padding: 20px 20px 0; }
  .patient-card-body { padding: 16px 20px 20px; }
  .patient-card-meta { padding: 0 20px 16px; }
  .patient-label h2 { font-size: 18px; }
  .patient-icon { width: 44px; height: 44px; border-radius: 12px; }
  .patient-icon svg { width: 24px; height: 24px; }
  .current-step-card { padding: 20px 16px; }
  .step-question { font-size: 18px; }
  .summary-score-card { padding: 28px 20px; }
  .summary-total-score { width: 100px; height: 100px; }
  .total-score-number { font-size: 30px; }
  .summary-actions { flex-direction: column; }
  .btn-action { justify-content: center; }
}

@media (max-width: 480px) {
  .top-bar-info { display: none; }
}
</style>
