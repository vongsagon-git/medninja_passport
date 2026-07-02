<template>
  <div class="meq-list">
    <!-- Header -->
    <div class="meq-header">
      <div class="container">
        <router-link to="/my" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          กลับ
        </router-link>
        <div class="header-content">
          <h1 class="hub-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            MEQ Clinical Cases
          </h1>
          <p class="hub-subtitle">ฝึกวิเคราะห์เคสผู้ป่วยแบบ Step-by-step</p>

          <!-- Stats -->
          <div v-if="!loading" class="stats-bar">
            <div class="stat-item">
              <span class="stat-value">{{ totalCases }}</span>
              <span class="stat-label">เคสทั้งหมด</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value completed-val">{{ completedCount }}</span>
              <span class="stat-label">ทำแล้ว</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ avgScore != null ? avgScore + '%' : '-' }}</span>
              <span class="stat-label">คะแนนเฉลี่ย</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container hub-body">
      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'cases' }" @click="activeTab = 'cases'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
          เคสทั้งหมด
        </button>
        <button class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'; loadHistory()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ประวัติ
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 140px; margin-bottom: 16px; border-radius: 16px"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadCases" class="btn-primary-sm">ลองใหม่</button>
      </div>

      <!-- Cases Tab -->
      <template v-else-if="activeTab === 'cases'">
        <!-- Category Filter -->
        <div v-if="categories.length > 1" class="category-filter">
          <button class="filter-btn" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">ทั้งหมด</button>
          <button v-for="cat in categories" :key="cat" class="filter-btn" :class="{ active: activeCategory === cat }" @click="activeCategory = cat">{{ cat }}</button>
        </div>

        <!-- Empty -->
        <div v-if="filteredCases.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 3H9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>ยังไม่มีเคส MEQ ในหมวดนี้</p>
        </div>

        <!-- Case Cards -->
        <div class="cases-grid">
          <router-link
            v-for="c in filteredCases"
            :key="c._id"
            :to="`/my/meq/${c._id}`"
            class="case-card"
            :class="{ 'in-progress': c.status === 'in_progress', 'completed': c.status === 'completed' }"
          >
            <!-- Status Badge -->
            <div class="card-status">
              <span v-if="c.status === 'completed'" class="status-badge done">
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                {{ c.score != null ? c.score + '%' : 'ทำแล้ว' }}
              </span>
              <span v-else-if="c.status === 'in_progress'" class="status-badge progress">
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.379 2.624l-.186-.195H7.5a.75.75 0 000-1.5H4.256a.75.75 0 00-.75.75v3.244a.75.75 0 001.5 0v-1.368l.238.25a7 7 0 0011.932-3.338.75.75 0 00-1.464-.327zm.824-6.078a.75.75 0 00-1.5 0v1.368l-.238-.25a7 7 0 00-11.932 3.338.75.75 0 001.464.327 5.5 5.5 0 019.379-2.624l.186.195H12.5a.75.75 0 000 1.5h3.244a.75.75 0 00.75-.75V5.346z" clip-rule="evenodd"/></svg>
                กำลังทำ
              </span>
              <span v-else class="status-badge new">ยังไม่ทำ</span>
            </div>

            <!-- Card Content -->
            <div class="card-body">
              <h3 class="card-title">{{ c.title }}</h3>
              <p v-if="c.subtitle" class="card-subtitle">{{ c.subtitle }}</p>

              <div class="card-meta">
                <span v-if="c.category" class="meta-tag category-tag">{{ c.category }}</span>
                <span v-if="c.difficulty" :class="['meta-tag', 'diff-' + c.difficulty]">
                  {{ { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' }[c.difficulty] || c.difficulty }}
                </span>
                <span v-if="c.estimatedMinutes" class="meta-tag time-tag">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                  {{ c.estimatedMinutes }} นาที
                </span>
              </div>

              <div v-if="c.tags && c.tags.length" class="card-tags">
                <span v-for="tag in c.tags" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
            </div>

            <!-- Steps indicator -->
            <div class="card-footer">
              <span class="steps-count">{{ c.totalSteps || '?' }} ขั้นตอน</span>
              <span class="card-arrow">
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
              </span>
            </div>
          </router-link>
        </div>
      </template>

      <!-- History Tab -->
      <template v-else-if="activeTab === 'history'">
        <div v-if="historyLoading" class="loading-state">
          <div v-for="i in 3" :key="i" class="skeleton" style="height: 80px; margin-bottom: 12px; border-radius: 12px"></div>
        </div>
        <div v-else-if="history.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>ยังไม่มีประวัติการทำ MEQ</p>
        </div>
        <div v-else class="history-list">
          <router-link
            v-for="h in history"
            :key="h._id"
            :to="`/my/meq/${h.caseId || h._id}`"
            class="history-item"
          >
            <div class="history-info">
              <span class="history-title">{{ h.title }}</span>
              <span class="history-date">{{ formatDate(h.completedAt) }}</span>
            </div>
            <div class="history-score" :class="getScoreClass(h.score)">
              {{ h.score }}%
            </div>
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import meqService from '../services/meqService'

const loading = ref(true)
const error = ref(null)
const cases = ref([])
const activeTab = ref('cases')
const activeCategory = ref('')

// History
const history = ref([])
const historyLoading = ref(false)
const historyLoaded = ref(false)

// Computed
const categories = computed(() => {
  const cats = new Set()
  cases.value.forEach(c => { if (c.category) cats.add(c.category) })
  return [...cats].sort()
})

const filteredCases = computed(() => {
  if (!activeCategory.value) return cases.value
  return cases.value.filter(c => c.category === activeCategory.value)
})

const totalCases = computed(() => cases.value.length)
const completedCount = computed(() => cases.value.filter(c => c.status === 'completed').length)
const avgScore = computed(() => {
  const completed = cases.value.filter(c => c.status === 'completed' && c.score != null)
  if (completed.length === 0) return null
  return Math.round(completed.reduce((sum, c) => sum + c.score, 0) / completed.length)
})

function getScoreClass(score) {
  if (score >= 80) return 'score-green'
  if (score >= 50) return 'score-orange'
  return 'score-red'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

async function loadCases() {
  loading.value = true
  error.value = null
  try {
    const res = await meqService.fetchCases()
    cases.value = res.cases || res || []
  } catch (err) {
    console.error('[MeqList] fetch error', err)
    error.value = 'ไม่สามารถโหลดเคส MEQ ได้'
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  if (historyLoaded.value) return
  historyLoading.value = true
  try {
    const res = await meqService.fetchHistory()
    history.value = res.history || res || []
    historyLoaded.value = true
  } catch (err) {
    console.error('[MeqList] history error', err)
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  loadCases()
})
</script>

<style scoped>
.meq-list {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ═══ Header ═══ */
.meq-header {
  background: #0f172a;
  padding: 20px 0 28px;
}
.meq-header .container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
  margin-bottom: 16px;
}
.back-link:hover { color: #fff; }
.back-link svg { width: 18px; height: 18px; }

.header-content { color: #fff; }
.hub-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
  color: #fff;
}
.hub-subtitle {
  font-size: 15px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 16px;
}

.stats-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 14px 20px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 20px; font-weight: 800; color: #fff; }
.stat-value.completed-val { color: #34d399; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

/* ═══ Body ═══ */
.hub-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* ═══ Tabs ═══ */
.tabs {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}
.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.tab.active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.tab:hover:not(.active) { color: #0f172a; }

/* ═══ Category Filter ═══ */
.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.filter-btn {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.filter-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.filter-btn:hover:not(.active) {
  border-color: #3b82f6;
  color: #3b82f6;
}

/* ═══ Cases Grid ═══ */
.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.case-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.case-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #e2e8f0;
  transition: background 0.25s;
}
.case-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}
.case-card:hover::before { background: #3b82f6; }
.case-card.in-progress::before { background: #f59e0b; }
.case-card.completed::before { background: #22c55e; }

.card-status {
  margin-bottom: 12px;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}
.status-badge.new {
  background: #f1f5f9;
  color: #94a3b8;
}
.status-badge.progress {
  background: #fffbeb;
  color: #f59e0b;
}
.status-badge.done {
  background: #f0fdf4;
  color: #22c55e;
}

.card-body { flex: 1; }
.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1.4;
}
.card-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.category-tag { background: #eff6ff; color: #3b82f6; }
.diff-easy { background: #f0fdf4; color: #22c55e; }
.diff-medium { background: #fffbeb; color: #f59e0b; }
.diff-hard { background: #fef2f2; color: #ef4444; }
.time-tag { background: #f8fafc; color: #94a3b8; }

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-chip {
  padding: 2px 8px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 11px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}
.steps-count {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}
.card-arrow { color: #cbd5e1; transition: color 0.2s; }
.case-card:hover .card-arrow { color: #3b82f6; }

/* ═══ History ═══ */
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.history-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
}
.history-info { display: flex; flex-direction: column; gap: 2px; }
.history-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.history-date { font-size: 13px; color: #94a3b8; }
.history-score {
  font-size: 20px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 10px;
}
.history-score.score-green { background: #f0fdf4; color: #22c55e; }
.history-score.score-orange { background: #fffbeb; color: #f59e0b; }
.history-score.score-red { background: #fef2f2; color: #ef4444; }

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
.error-state { text-align: center; padding: 60px 20px; color: #64748b; }
.btn-primary-sm {
  display: inline-block;
  padding: 8px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  margin-top: 12px;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}
.empty-state svg { margin-bottom: 12px; opacity: 0.4; }
.empty-state p { font-size: 16px; margin: 0; }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .cases-grid { grid-template-columns: 1fr; }
  .stats-bar { gap: 12px; padding: 12px 16px; }
  .stat-value { font-size: 18px; }
  .hub-title { font-size: 20px; }
}
</style>
