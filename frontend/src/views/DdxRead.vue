<template>
  <div class="ddx-read">
    <!-- Header -->
    <div class="read-header">
      <div class="container">
        <router-link to="/my/ddx" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          กลับ DDx Hub
        </router-link>
        <div v-if="approach" class="header-info">
          <div class="header-row">
            <div>
              <h1>{{ approach.symptomName }}</h1>
              <p v-if="approach.symptomNameEn" class="subtitle-en">{{ approach.symptomNameEn }}</p>
            </div>
            <div class="header-badges">
              <span class="category-badge">{{ approach.category }}</span>
              <button class="bookmark-btn" :class="{ bookmarked }" @click="handleBookmark" title="บุ๊กมาร์ก">
                <svg v-if="bookmarked" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21.75a.75.75 0 01-1.085.67L12 18.089l-7.165 4.332A.75.75 0 013.75 21.75V5.507c0-1.47 1.073-2.756 2.57-2.93z" clip-rule="evenodd"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container read-body">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="skeleton" style="height: 32px; width: 50%; margin-bottom: 16px"></div>
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 80px; margin-bottom: 12px"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <router-link to="/my/ddx" class="btn btn-primary-sm">กลับ DDx Hub</router-link>
      </div>

      <!-- Content -->
      <template v-else-if="approach">
        <!-- DDx Accordion -->
        <div class="ddx-list">
          <div v-for="(ddx, idx) in approach.differentials" :key="idx" class="ddx-card" :class="{ open: openIdx === idx }">
            <button class="ddx-card-header" @click="toggleAccordion(idx)">
              <div class="ddx-header-left">
                <span class="ddx-number">{{ idx + 1 }}</span>
                <div class="ddx-header-info">
                  <span class="ddx-name">{{ ddx.name }}</span>
                  <span v-if="ddx.nameEn" class="ddx-name-en">{{ ddx.nameEn }}</span>
                </div>
              </div>
              <div class="ddx-header-right">
                <span v-if="ddx.frequency" :class="['freq-badge', 'freq-' + ddx.frequency]">
                  {{ { high: 'พบบ่อย', medium: 'ปานกลาง', low: 'พบน้อย' }[ddx.frequency] || ddx.frequency }}
                </span>
                <svg class="chevron-icon" :class="{ rotated: openIdx === idx }" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
              </div>
            </button>

            <Transition name="accordion">
              <div v-if="openIdx === idx" class="ddx-card-body">
                <!-- Key Clues -->
                <div v-if="ddx.keyClues && ddx.keyClues.length" class="ddx-section">
                  <h4>Key Clues</h4>
                  <div class="tag-list">
                    <span v-for="(clue, ci) in ddx.keyClues" :key="ci" class="tag tag-blue">{{ clue }}</span>
                  </div>
                </div>

                <!-- Red Flags -->
                <div v-if="ddx.redFlags && ddx.redFlags.length" class="ddx-section">
                  <h4 class="red-flag-title">Red Flags</h4>
                  <div class="tag-list">
                    <span v-for="(flag, fi) in ddx.redFlags" :key="fi" class="tag tag-red">{{ flag }}</span>
                  </div>
                </div>

                <!-- Investigation -->
                <div v-if="ddx.investigation" class="ddx-section">
                  <h4>Investigation</h4>
                  <p>{{ ddx.investigation }}</p>
                </div>

                <!-- Treatment -->
                <div v-if="ddx.treatment" class="ddx-section">
                  <h4>Treatment</h4>
                  <p>{{ ddx.treatment }}</p>
                </div>

                <!-- First-line -->
                <div v-if="ddx.firstLine" class="ddx-section">
                  <h4>First-line Treatment</h4>
                  <p class="highlight-box">{{ ddx.firstLine }}</p>
                </div>

                <!-- Don't Miss -->
                <div v-if="ddx.dontMiss" class="ddx-section">
                  <h4 class="dont-miss-title">Don't Miss</h4>
                  <p class="highlight-box warning">{{ ddx.dontMiss }}</p>
                </div>

                <!-- Exam Tip -->
                <div v-if="ddx.examTip" class="ddx-section">
                  <h4 class="exam-tip-title">Exam Tip</h4>
                  <p class="highlight-box tip">{{ ddx.examTip }}</p>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Bottom actions -->
        <div class="bottom-actions">
          <router-link :to="`/my/ddx/${approach._id}/practice`" class="btn-practice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"/></svg>
            ฝึกตอบ
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import approachService from '../services/approachService'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const approach = ref(null)
const openIdx = ref(0)
const bookmarked = ref(false)

function toggleAccordion(idx) {
  openIdx.value = openIdx.value === idx ? -1 : idx
}

async function handleBookmark() {
  if (!approach.value) return
  try {
    const res = await approachService.toggleBookmark(approach.value._id)
    bookmarked.value = res.bookmarked ?? !bookmarked.value
  } catch (err) {
    console.error('[DdxRead] bookmark error', err)
  }
}

onMounted(async () => {
  try {
    const id = route.params.id
    const res = await approachService.fetchApproach(id)
    approach.value = res.approach || res
    bookmarked.value = approach.value.bookmarked || false

    // Record read (fire-and-forget)
    approachService.recordRead(id).catch(() => {})
  } catch (err) {
    console.error('[DdxRead] fetch error', err)
    error.value = 'ไม่สามารถโหลดข้อมูลได้'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ddx-read {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ═══ Header ═══ */
.read-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  padding: 20px 0 24px;
}
.read-header .container {
  max-width: 800px;
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
  margin-bottom: 12px;
  transition: color 0.2s;
}
.back-link:hover { color: #fff; }
.back-link svg { width: 18px; height: 18px; }

.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.header-info h1 { font-size: 24px; font-weight: 700; margin: 0; }
.subtitle-en { font-size: 15px; color: rgba(255,255,255,0.6); margin: 4px 0 0; }
.header-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.category-badge {
  background: rgba(59,130,246,0.2);
  color: #93c5fd;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.bookmark-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}
.bookmark-btn:hover { color: #fbbf24; }
.bookmark-btn.bookmarked { color: #fbbf24; }

/* ═══ Body ═══ */
.read-body {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* ═══ DDx Accordion ═══ */
.ddx-list { display: flex; flex-direction: column; gap: 8px; }
.ddx-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.ddx-card.open { border-color: #3b82f6; }

.ddx-card-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.2s;
}
.ddx-card-header:hover { background: #f8fafc; }

.ddx-header-left { display: flex; align-items: center; gap: 12px; }
.ddx-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.ddx-header-info { display: flex; flex-direction: column; }
.ddx-name { font-size: 15px; font-weight: 600; color: #0f172a; }
.ddx-name-en { font-size: 13px; color: #94a3b8; }

.ddx-header-right { display: flex; align-items: center; gap: 8px; }

.freq-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.freq-high { background: #fef2f2; color: #ef4444; }
.freq-medium { background: #fffbeb; color: #f59e0b; }
.freq-low { background: #f0fdf4; color: #22c55e; }

.chevron-icon {
  color: #94a3b8;
  transition: transform 0.2s;
}
.chevron-icon.rotated { transform: rotate(180deg); }

/* Accordion transition */
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.accordion-enter-to, .accordion-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.ddx-card-body {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
}

.ddx-section { margin-top: 14px; }
.ddx-section h4 {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #3b82f6;
  margin: 0 0 8px;
}
.red-flag-title { color: #ef4444 !important; }
.dont-miss-title { color: #f59e0b !important; }
.exam-tip-title { color: #8b5cf6 !important; }

.ddx-section p {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}

.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
.tag-blue { background: #eff6ff; color: #3b82f6; }
.tag-red { background: #fef2f2; color: #ef4444; }

.highlight-box {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}
.highlight-box.warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}
.highlight-box.tip {
  background: #f5f3ff;
  border-left-color: #8b5cf6;
}

/* ═══ Bottom Actions ═══ */
.bottom-actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}
.btn-practice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 40px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s, transform 0.1s;
  cursor: pointer;
  font-family: inherit;
}
.btn-practice:hover { background: #2563eb; transform: translateY(-1px); }

/* ═══ States ═══ */
.loading-state { padding: 20px 0; }
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
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .header-row { flex-direction: column; }
  .header-badges { margin-top: 8px; }
  .ddx-card-header { padding: 12px 14px; }
  .ddx-header-left { gap: 8px; }
}
</style>
