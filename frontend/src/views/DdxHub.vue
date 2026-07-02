<template>
  <div class="ddx-hub">
    <!-- Header -->
    <div class="hub-header">
      <div class="container">
        <router-link to="/my" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
          กลับ
        </router-link>
        <div class="header-content">
          <div class="header-top">
            <h1 class="hub-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V5.846a2.25 2.25 0 00-1.287-2.033l-.924-.462a2.25 2.25 0 00-2.006 0L12 4.5m7 10v4.286A2.25 2.25 0 0116.786 21H7.214A2.25 2.25 0 015 18.786V14.5"/></svg>
              NINJA DDx
            </h1>
          </div>
          <!-- Stats bar -->
          <div v-if="stats" class="stats-bar">
            <div class="stat-item">
              <span class="stat-value">{{ stats.mastered || 0 }}</span>
              <span class="stat-label">Mastered</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.total || 0 }}</span>
              <span class="stat-label">ทั้งหมด</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value streak">{{ stats.streak || 0 }}</span>
              <span class="stat-label">Streak</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.accuracy != null ? Math.round(stats.accuracy) + '%' : '-' }}</span>
              <span class="stat-label">ความแม่น</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container hub-body">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="skeleton-stats">
          <div v-for="i in 4" :key="i" class="skeleton" style="height: 60px; flex: 1"></div>
        </div>
        <div class="skeleton" style="height: 24px; width: 200px; margin: 32px 0 16px"></div>
        <div v-for="i in 3" :key="'c'+i" class="skeleton" style="height: 100px; margin-bottom: 12px"></div>
      </div>

      <template v-else>
        <!-- ═══ Daily Review Queue ═══ -->
        <section v-if="reviewQueue.length > 0" class="hub-section review-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              วันนี้ต้องทบทวน {{ reviewQueue.length }} หัวข้อ
            </h2>
          </div>
          <div class="review-cards">
            <div v-for="item in reviewQueue" :key="item._id" class="review-card">
              <div class="review-card-body">
                <div class="review-info">
                  <span class="review-symptom">{{ item.symptomName || item.name }}</span>
                  <span class="review-symptom-en" v-if="item.symptomNameEn">{{ item.symptomNameEn }}</span>
                  <span class="review-category">{{ item.category }}</span>
                </div>
                <div class="review-meta">
                  <span :class="['mastery-badge', getMasteryClass(item.masteryLevel)]">{{ getMasteryLabel(item.masteryLevel) }}</span>
                </div>
              </div>
              <div class="review-card-actions">
                <router-link :to="`/my/ddx/${item._id}/read`" class="btn btn-outline-sm">ดูสรุป</router-link>
                <router-link :to="`/my/ddx/${item._id}/practice`" class="btn btn-primary-sm">ฝึกตอบ</router-link>
              </div>
            </div>
          </div>
        </section>

        <!-- Empty review queue -->
        <section v-else class="hub-section review-empty">
          <div class="empty-review-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p>ไม่มีหัวข้อที่ต้องทบทวนวันนี้</p>
            <span>เริ่มฝึก DDx ใหม่ได้เลย!</span>
          </div>
        </section>

        <!-- ═══ Category Browser ═══ -->
        <section v-if="categories.length > 0" class="hub-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
              หมวดหมู่
            </h2>
          </div>
          <div class="category-grid">
            <button v-for="cat in categories" :key="cat.name" class="category-card" :class="{ active: activeCategory === cat.name }" @click="toggleCategory(cat.name)">
              <div class="cat-top">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }} หัวข้อ</span>
              </div>
              <div class="cat-progress-bar">
                <div class="cat-progress-fill" :style="{ width: cat.masteryPct + '%' }"></div>
              </div>
              <span class="cat-pct">{{ Math.round(cat.masteryPct) }}% mastered</span>
            </button>
          </div>
        </section>

        <!-- ═══ All Approaches ═══ -->
        <section class="hub-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
              ทุกหัวข้อ
            </h2>
            <div class="filter-bar">
              <input v-model="searchQuery" type="text" class="search-input" placeholder="ค้นหา...">
              <select v-model="filterMastery" class="filter-select">
                <option value="">ทุกระดับ</option>
                <option value="new">ยังไม่เริ่ม</option>
                <option value="learning">กำลังเรียน</option>
                <option value="reviewing">ทบทวน</option>
                <option value="mastered">จำได้แล้ว</option>
              </select>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="filteredApproaches.length === 0 && !loading" class="empty-state">
            <p>ไม่พบหัวข้อที่ตรงกับเงื่อนไข</p>
          </div>

          <div v-else class="approach-list">
            <router-link v-for="item in filteredApproaches" :key="item._id" :to="`/my/ddx/${item._id}/read`" class="approach-card">
              <div class="approach-info">
                <span class="approach-name">{{ item.symptomName || item.name }}</span>
                <span class="approach-name-en" v-if="item.symptomNameEn">{{ item.symptomNameEn }}</span>
                <span class="approach-category">{{ item.category }}</span>
              </div>
              <div class="approach-right">
                <span :class="['mastery-badge', getMasteryClass(item.masteryLevel)]">{{ getMasteryLabel(item.masteryLevel) }}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" class="chevron"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
              </div>
            </router-link>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import approachService from '../services/approachService'

const loading = ref(true)
const approaches = ref([])
const reviewQueue = ref([])
const stats = ref(null)
const searchQuery = ref('')
const filterMastery = ref('')
const activeCategory = ref('')

// Mastery helpers
function getMasteryClass(level) {
  const map = { new: 'mastery-new', learning: 'mastery-learning', reviewing: 'mastery-reviewing', mastered: 'mastery-mastered' }
  return map[level] || 'mastery-new'
}
function getMasteryLabel(level) {
  const map = { new: 'ยังไม่เริ่ม', learning: 'กำลังเรียน', reviewing: 'ทบทวน', mastered: 'จำได้แล้ว' }
  return map[level] || 'ยังไม่เริ่ม'
}

// Categories with mastery %
const categories = computed(() => {
  const catMap = {}
  approaches.value.forEach(a => {
    const cat = a.category || 'อื่นๆ'
    if (!catMap[cat]) catMap[cat] = { name: cat, count: 0, mastered: 0 }
    catMap[cat].count++
    if (a.masteryLevel === 'mastered') catMap[cat].mastered++
  })
  return Object.values(catMap).map(c => ({
    ...c,
    masteryPct: c.count > 0 ? (c.mastered / c.count) * 100 : 0
  })).sort((a, b) => a.name.localeCompare(b.name, 'th'))
})

// Filtered list
const filteredApproaches = computed(() => {
  let list = approaches.value
  if (activeCategory.value) {
    list = list.filter(a => (a.category || 'อื่นๆ') === activeCategory.value)
  }
  if (filterMastery.value) {
    list = list.filter(a => (a.masteryLevel || 'new') === filterMastery.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(a =>
      (a.symptomName || a.name || '').toLowerCase().includes(q) ||
      (a.symptomNameEn || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    )
  }
  return list
})

function toggleCategory(name) {
  activeCategory.value = activeCategory.value === name ? '' : name
}

onMounted(async () => {
  try {
    const [approachesRes, queueRes, statsRes] = await Promise.all([
      approachService.fetchApproaches(),
      approachService.fetchReviewQueue().catch(() => ({ approaches: [] })),
      approachService.fetchStats().catch(() => null)
    ])
    approaches.value = approachesRes.approaches || approachesRes || []
    reviewQueue.value = queueRes.approaches || queueRes || []
    stats.value = statsRes?.stats || statsRes || null
  } catch (err) {
    console.error('[DdxHub] fetch error', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ddx-hub {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ═══ Header ═══ */
.hub-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  padding: 20px 0 24px;
}
.hub-header .container {
  max-width: 900px;
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

.header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.hub-title {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px 20px;
}
.stat-item { text-align: center; flex: 1; }
.stat-value { display: block; font-size: 22px; font-weight: 700; color: #fff; }
.stat-value.streak { color: #f59e0b; }
.stat-label { display: block; font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }

/* ═══ Body ═══ */
.hub-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.hub-section { margin-bottom: 32px; }
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

/* ═══ Review Queue ═══ */
.review-section .section-header h2 { color: #3b82f6; }
.review-cards { display: flex; flex-direction: column; gap: 10px; }
.review-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: box-shadow 0.2s;
}
.review-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.review-info { display: flex; flex-direction: column; gap: 2px; }
.review-symptom { font-size: 16px; font-weight: 600; color: #0f172a; }
.review-symptom-en { font-size: 13px; color: #64748b; }
.review-category { font-size: 12px; color: #94a3b8; }
.review-meta { margin-left: 8px; }
.review-card-actions { display: flex; gap: 8px; flex-shrink: 0; }

.btn-outline-sm {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}
.btn-outline-sm:hover { border-color: #3b82f6; color: #3b82f6; }

.btn-primary-sm {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  cursor: pointer;
}
.btn-primary-sm:hover { background: #2563eb; }

/* ═══ Empty review ═══ */
.empty-review-card {
  text-align: center;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px 20px;
  color: #64748b;
}
.empty-review-card svg { color: #22c55e; margin-bottom: 8px; }
.empty-review-card p { font-size: 16px; font-weight: 600; margin: 0 0 4px; color: #0f172a; }
.empty-review-card span { font-size: 14px; }

/* ═══ Category Grid ═══ */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.category-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.category-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.category-card.active { border-color: #3b82f6; background: #eff6ff; }
.cat-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.cat-name { font-size: 15px; font-weight: 600; color: #0f172a; }
.cat-count { font-size: 12px; color: #94a3b8; }
.cat-progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}
.cat-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22c55e);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.cat-pct { font-size: 11px; color: #94a3b8; }

/* ═══ Filter Bar ═══ */
.filter-bar { display: flex; gap: 8px; }
.search-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 180px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.search-input:focus { border-color: #3b82f6; }
.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  outline: none;
  cursor: pointer;
  font-family: inherit;
}

/* ═══ Approach List ═══ */
.approach-list { display: flex; flex-direction: column; gap: 6px; }
.approach-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.approach-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.08); }
.approach-info { display: flex; flex-direction: column; gap: 2px; }
.approach-name { font-size: 15px; font-weight: 600; color: #0f172a; }
.approach-name-en { font-size: 13px; color: #64748b; }
.approach-category { font-size: 12px; color: #94a3b8; }
.approach-right { display: flex; align-items: center; gap: 8px; }
.chevron { color: #cbd5e1; }

/* ═══ Mastery Badges ═══ */
.mastery-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.mastery-new { background: #f1f5f9; color: #94a3b8; }
.mastery-learning { background: #fff7ed; color: #f97316; }
.mastery-reviewing { background: #eff6ff; color: #3b82f6; }
.mastery-mastered { background: #f0fdf4; color: #22c55e; }

/* ═══ Empty / Loading ═══ */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}
.loading-state { padding: 20px 0; }
.skeleton-stats { display: flex; gap: 12px; margin-bottom: 24px; }
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

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .stats-bar { flex-wrap: wrap; gap: 8px; padding: 10px 14px; }
  .stat-item { min-width: 60px; }
  .stat-divider { display: none; }
  .section-header { flex-direction: column; align-items: flex-start; }
  .filter-bar { width: 100%; }
  .search-input { flex: 1; width: auto; }
  .category-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .review-card { flex-direction: column; align-items: flex-start; }
  .review-card-actions { width: 100%; }
  .review-card-actions .btn-primary-sm,
  .review-card-actions .btn-outline-sm { flex: 1; text-align: center; }
}
</style>
