<template>
  <div class="admin">
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h1>Progress นักเรียน</h1>
            <p>เช็คว่าใครดูไปแล้วเท่าไหร่ + จบ Topic ไหนบ้าง (ไว้กระตุ้นหรือเชิญนัดปรึกษา)</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Filters -->
      <div class="filters">
        <input v-model="search" type="text" placeholder="ค้นชื่อหรือ email..." class="filter-input" @keyup.enter="fetchOverview" />
        <select v-model="packageId" class="filter-input" @change="fetchOverview">
          <option value="">— ทุก Package —</option>
          <option v-for="p in packages" :key="p.id" :value="p.id">{{ p.title }}</option>
        </select>
        <select v-model="sort" class="filter-input" @change="fetchOverview">
          <option value="percent">% น้อย → มาก (ต้องกระตุ้น)</option>
          <option value="percent_desc">% มาก → น้อย (พร้อมนัด)</option>
          <option value="name">ชื่อ ก-ฮ</option>
          <option value="lastWatched">ดูล่าสุด</option>
        </select>
        <button class="btn-refresh" @click="fetchOverview" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span v-else class="spin">⟳</span>
          {{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
        </button>
      </div>

      <!-- Summary -->
      <div class="summary-cards">
        <div class="sc-card">
          <div class="sc-label">นักเรียนทั้งหมด</div>
          <div class="sc-value">{{ students.length }}</div>
        </div>
        <div class="sc-card sc-blue">
          <div class="sc-label">ดูจบ ≥ 80%</div>
          <div class="sc-value">{{ students.filter(s => s.percent >= 80).length }}</div>
        </div>
        <div class="sc-card sc-orange">
          <div class="sc-label">ดูช้า &lt; 20%</div>
          <div class="sc-value">{{ students.filter(s => s.percent < 20).length }}</div>
        </div>
        <div class="sc-card sc-green">
          <div class="sc-label">จบ Topic แล้ว</div>
          <div class="sc-value">{{ students.reduce((n, s) => n + s.completedTopicCount, 0) }}</div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-box">{{ error }}</div>

      <!-- Table -->
      <div v-if="!loading" class="table-wrap">
        <table class="progress-table">
          <thead>
            <tr>
              <th>นักเรียน</th>
              <th>Package</th>
              <th class="col-progress">Progress</th>
              <th class="col-num">Topic จบ</th>
              <th class="col-num">ดูล่าสุด</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in students" :key="s.userId" :class="{ 'row-low': s.percent < 20, 'row-high': s.percent >= 80 }">
              <td>
                <div class="student-cell">
                  <div class="student-name">{{ s.name }}</div>
                  <div class="student-email">{{ s.email }}</div>
                </div>
              </td>
              <td>
                <div v-for="p in s.packages" :key="p.id" class="pkg-chip">{{ p.title }}</div>
              </td>
              <td>
                <div class="progress-cell">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: s.percent + '%' }" :class="getProgressClass(s.percent)"></div>
                  </div>
                  <div class="progress-text">
                    <b>{{ s.percent }}%</b>
                    <span class="progress-count">({{ s.watchedVideos }}/{{ s.totalVideos }})</span>
                  </div>
                </div>
              </td>
              <td class="col-num">
                <span v-if="s.completedTopicCount > 0" class="topic-done-badge">{{ s.completedTopicCount }}</span>
                <span v-else class="dim">—</span>
              </td>
              <td class="col-num dim">{{ formatDate(s.lastWatchedAt) }}</td>
              <td>
                <button class="btn-detail" @click="openDetail(s)">ดู Topic</button>
              </td>
            </tr>
            <tr v-if="students.length === 0">
              <td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">ยังไม่มีข้อมูล</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detailStudent" class="modal-backdrop" @click.self="detailStudent = null">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h3>{{ detailStudent.name }}</h3>
            <p class="modal-sub">{{ detailStudent.email }} — {{ detailStudent.percent }}% ({{ detailStudent.watchedVideos }}/{{ detailStudent.totalVideos }} วิดีโอ)</p>
          </div>
          <button class="modal-close" @click="detailStudent = null">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="detailLoading" class="loading-text">กำลังโหลด...</div>
          <div v-else-if="detailData">
            <div v-for="sec in detailData.sections" :key="sec.sectionId" class="detail-section">
              <div class="detail-section-head">
                <b>{{ sec.sectionName }}</b>
                <span class="dim">{{ sec.watchedVideos }}/{{ sec.totalVideos }}</span>
              </div>
              <div v-for="(t, i) in sec.topics" :key="i" class="detail-topic" :class="{ done: t.completed }">
                <span class="topic-check">{{ t.completed ? '✓' : '○' }}</span>
                <span class="topic-name">{{ t.topic }}</span>
                <span class="topic-count">{{ t.watched }}/{{ t.total }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'AdminProgress',
  data() {
    return {
      loading: false,
      error: '',
      students: [],
      packages: [],
      search: '',
      packageId: '',
      sort: 'percent',
      detailStudent: null,
      detailData: null,
      detailLoading: false
    }
  },
  async mounted() {
    await this.fetchPackages()
    await this.fetchOverview()
  },
  methods: {
    async fetchPackages() {
      try {
        const data = await api.get('/admin/packages')
        this.packages = (data?.packages || data || []).map(p => ({ id: p._id || p.id, title: p.title }))
      } catch (e) {
        console.error('load packages error', e)
      }
    },
    async fetchOverview() {
      this.loading = true
      this.error = ''
      try {
        const params = new URLSearchParams()
        if (this.search) params.set('q', this.search)
        if (this.packageId) params.set('packageId', this.packageId)
        if (this.sort) params.set('sort', this.sort)
        const data = await api.get('/admin/progress/overview?' + params.toString())
        this.students = data?.students || []
      } catch (e) {
        this.error = e?.response?.data?.error || e.message || 'โหลดไม่สำเร็จ'
      } finally {
        this.loading = false
      }
    },
    async openDetail(s) {
      this.detailStudent = s
      this.detailData = null
      this.detailLoading = true
      try {
        const data = await api.get(`/admin/progress/student/${s.userId}`)
        this.detailData = data
      } catch (e) {
        this.error = e?.response?.data?.error || e.message
      } finally {
        this.detailLoading = false
      }
    },
    getProgressClass(pct) {
      if (pct >= 80) return 'fill-high'
      if (pct >= 40) return 'fill-mid'
      if (pct >= 20) return 'fill-low'
      return 'fill-very-low'
    },
    formatDate(d) {
      if (!d) return '—'
      const dt = new Date(d)
      const diff = Date.now() - dt.getTime()
      const days = Math.floor(diff / (24*3600*1000))
      if (days === 0) return 'วันนี้'
      if (days === 1) return 'เมื่อวาน'
      if (days < 7) return `${days} วันก่อน`
      if (days < 30) return `${Math.floor(days/7)} สัปดาห์ก่อน`
      return dt.toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })
    }
  }
}
</script>

<style scoped>
.admin { min-height: 100vh; background: #f8fafc; }
.admin-hero { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color:#fff; padding: 28px 0; }
.admin-hero-inner { display:flex; align-items:center; gap:16px; }
.admin-hero-icon { width:52px; height:52px; border-radius:12px; background: rgba(255,255,255,.15); display:grid; place-items:center; }
.admin-hero h1 { font-size: 22px; font-weight: 900; margin:0; }
.admin-hero p { font-size: 13px; margin:2px 0 0; opacity:.85; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
.section { padding: 24px 20px; }

.filters { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.filter-input {
  padding: 10px 14px; border:1.5px solid #cbd5e1; border-radius:8px;
  font-size:14px; background:#fff; min-width:180px;
}
.filter-input:focus { outline:none; border-color:#3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
.btn-refresh {
  padding: 10px 16px; background:#3b82f6; color:#fff; border:none;
  border-radius:8px; font-weight:700; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px;
}
.btn-refresh:hover { background:#2563eb; }
.btn-refresh:disabled { background:#94a3b8; cursor:not-allowed; }
.spin { display:inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.summary-cards { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:20px; }
.sc-card {
  background:#fff; padding:16px; border-radius:10px;
  border:1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.sc-label { font-size:12px; color:#64748b; font-weight:600; }
.sc-value { font-size:28px; font-weight:900; color:#1e293b; margin-top:4px; }
.sc-blue { border-left:4px solid #3b82f6; }
.sc-blue .sc-value { color:#2563eb; }
.sc-orange { border-left:4px solid #f97316; }
.sc-orange .sc-value { color:#ea580c; }
.sc-green { border-left:4px solid #10b981; }
.sc-green .sc-value { color:#059669; }

.error-box { padding:16px; background:#fef2f2; color:#dc2626; border-radius:8px; margin-bottom:16px; font-size:14px; }

.table-wrap { background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.progress-table { width:100%; border-collapse: collapse; font-size:14px; }
.progress-table th {
  background:#f1f5f9; padding:12px 14px; text-align:left;
  font-weight:700; color:#475569; font-size:12px; text-transform: uppercase; letter-spacing:.5px;
  border-bottom:2px solid #e2e8f0;
}
.progress-table td { padding:12px 14px; border-bottom:1px solid #f1f5f9; vertical-align: middle; }
.progress-table tr:last-child td { border-bottom:none; }
.progress-table tbody tr:hover { background:#f8fafc; }
.row-low { background: linear-gradient(90deg, #fff7ed 0%, transparent 100%); }
.row-high { background: linear-gradient(90deg, #f0fdf4 0%, transparent 100%); }
.col-num { text-align:center; white-space:nowrap; }
.col-progress { width:280px; }

.student-cell { min-width:180px; }
.student-name { font-weight:700; color:#1e293b; font-size:14px; }
.student-email { font-size:12px; color:#64748b; }

.pkg-chip {
  display:inline-block; background:#eff6ff; color:#1e40af;
  padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600;
  margin: 1px 3px 1px 0;
}

.progress-cell { display:flex; align-items:center; gap:10px; }
.progress-bar { flex:1; height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden; }
.progress-fill { height:100%; border-radius:999px; transition: width .3s; }
.fill-high { background: linear-gradient(90deg, #10b981, #059669); }
.fill-mid { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.fill-low { background: linear-gradient(90deg, #f59e0b, #d97706); }
.fill-very-low { background: linear-gradient(90deg, #ef4444, #dc2626); }
.progress-text { white-space:nowrap; font-size:13px; min-width:80px; text-align:right; }
.progress-text b { font-weight:800; }
.progress-count { font-size:11px; color:#94a3b8; margin-left:4px; }

.topic-done-badge {
  display:inline-block; min-width:24px; padding:2px 8px;
  background: linear-gradient(135deg, #3b82f6, #2563eb); color:#fff;
  border-radius:999px; font-weight:800; font-size:12px;
}
.dim { color:#94a3b8; }

.btn-detail {
  padding:6px 12px; background:#fff; color:#3b82f6;
  border:1.5px solid #3b82f6; border-radius:6px;
  font-size:12px; font-weight:700; cursor:pointer;
}
.btn-detail:hover { background:#3b82f6; color:#fff; }

/* Modal */
.modal-backdrop {
  position:fixed; inset:0; background: rgba(15,23,42,.5);
  display:grid; place-items:center; z-index:1000; padding:20px;
}
.modal {
  background:#fff; border-radius:12px; max-width:600px; width:100%;
  max-height:80vh; display:flex; flex-direction:column; overflow:hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
}
.modal-head {
  display:flex; justify-content:space-between; align-items:flex-start;
  padding:20px; border-bottom:1px solid #e2e8f0;
}
.modal-head h3 { margin:0; font-size:18px; font-weight:800; color:#1e293b; }
.modal-sub { margin:4px 0 0; font-size:13px; color:#64748b; }
.modal-close {
  background:none; border:none; font-size:20px; color:#94a3b8;
  cursor:pointer; padding:0; width:32px; height:32px; border-radius:8px;
}
.modal-close:hover { background:#f1f5f9; color:#1e293b; }
.modal-body { padding:20px; overflow-y:auto; flex:1; }
.loading-text { text-align:center; padding:40px; color:#94a3b8; }
.detail-section { margin-bottom:16px; }
.detail-section-head {
  display:flex; justify-content:space-between;
  padding:10px 12px; background:#f1f5f9; border-radius:8px;
  font-size:14px; color:#1e293b;
}
.detail-topic {
  display:flex; align-items:center; gap:10px;
  padding:8px 12px; border-bottom:1px solid #f1f5f9; font-size:13px;
}
.detail-topic.done { color:#059669; font-weight:600; }
.topic-check { width:20px; text-align:center; font-weight:800; }
.detail-topic.done .topic-check { color:#10b981; }
.detail-topic:not(.done) .topic-check { color:#cbd5e1; }
.topic-name { flex:1; }
.topic-count { color:#94a3b8; font-size:12px; }

/* Mobile */
@media (max-width: 768px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
  .filters { flex-direction: column; }
  .filter-input, .btn-refresh { width:100%; }
  .progress-table { font-size:12px; }
  .progress-table th, .progress-table td { padding:8px; }
  .col-progress { width:auto; }
  .student-email { display:none; }
}
</style>
