<template>
  <div class="activity-page">
    <!-- Hero -->
    <div class="hero">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1>Activity Log</h1>
            <p>ประวัติการใช้งานนักเรียน — หลักฐานยืนยัน</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Search Student -->
      <div class="search-box">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            v-model="searchQuery"
            @input="searchStudents"
            type="text"
            placeholder="ค้นหานักเรียน — พิมพ์ชื่อ หรือ email"
            class="search-input"
          />
        </div>

        <!-- Dropdown -->
        <div v-if="students.length && !selectedStudent" class="dropdown">
          <div
            v-for="s in students"
            :key="s._id"
            class="dropdown-item"
            @click="selectStudent(s)"
          >
            <div class="student-avatar" v-if="s.avatar">
              <img :src="s.avatar" alt="" />
            </div>
            <div class="student-avatar student-avatar-placeholder" v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
            </div>
            <div>
              <div class="student-name">{{ s.name }}</div>
              <div class="student-email">{{ s.email }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Student -->
      <div v-if="selectedStudent" class="selected-card">
        <div class="selected-info">
          <div class="student-avatar" v-if="selectedStudent.avatar">
            <img :src="selectedStudent.avatar" alt="" />
          </div>
          <div class="student-avatar student-avatar-placeholder" v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
          </div>
          <div>
            <div class="selected-name">{{ selectedStudent.name }}</div>
            <div class="selected-email">{{ selectedStudent.email }}</div>
          </div>
        </div>
        <button class="btn-clear" @click="clearStudent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div v-if="selectedStudent" class="filters">
        <div class="filter-group">
          <label>ช่วงเวลา</label>
          <select v-model="filterDays" @change="fetchLogs">
            <option :value="7">7 วัน</option>
            <option :value="30">30 วัน</option>
            <option :value="90">90 วัน</option>
            <option :value="180">180 วัน</option>
          </select>
        </div>
        <div class="filter-group">
          <label>ประเภท</label>
          <select v-model="filterAction" @change="fetchLogs">
            <option value="">ทั้งหมด</option>
            <option value="login,login_google">เข้าสู่ระบบ</option>
            <option value="logout">ออกจากระบบ</option>
            <option value="watch_start,watch_end,video_change">ดูคลิป</option>
            <option value="pdf_download">ดาวน์โหลด PDF</option>
            <option value="live_join">ดู Live</option>
          </select>
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="summary" class="summary-grid">
        <div class="summary-card">
          <div class="summary-num">{{ (summary.actionCounts.login || 0) + (summary.actionCounts.login_google || 0) }}</div>
          <div class="summary-label">ครั้งที่ Login</div>
        </div>
        <div class="summary-card">
          <div class="summary-num">{{ summary.actionCounts.watch_start || 0 }}</div>
          <div class="summary-label">ครั้งที่ดูคลิป</div>
        </div>
        <div class="summary-card">
          <div class="summary-num">{{ formatDuration(summary.totalWatchSeconds) }}</div>
          <div class="summary-label">เวลาดูทั้งหมด</div>
        </div>
        <div class="summary-card">
          <div class="summary-num summary-date">{{ summary.lastLogin ? formatDate(summary.lastLogin.createdAt) : '-' }}</div>
          <div class="summary-label">Login ล่าสุด</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>กำลังโหลด...</span>
      </div>

      <!-- Timeline -->
      <div v-if="!loading && logs.length" class="timeline">
        <div v-for="(group, date) in groupedLogs" :key="date" class="timeline-group">
          <div class="timeline-date">{{ date }}</div>
          <div class="timeline-items">
            <div v-for="log in group" :key="log._id" class="timeline-item">
              <div class="timeline-dot" :class="'dot-' + getActionColor(log.action)"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-badge" :class="'badge-' + getActionColor(log.action)">
                    {{ getActionIcon(log.action) }} {{ getActionLabel(log.action) }}
                  </span>
                  <span class="timeline-time">{{ formatTime(log.createdAt) }}</span>
                </div>
                <div v-if="log.videoTitle" class="timeline-detail">
                  {{ log.sectionName }} — {{ log.videoTitle }}
                  <span v-if="log.watchDuration" class="watch-dur">(ดู {{ formatDuration(log.watchDuration) }})</span>
                </div>
                <div v-if="log.detail" class="timeline-detail">{{ log.detail }}</div>
                <div class="timeline-meta">
                  <span v-if="log.ip" class="meta-tag">{{ log.ip }}</span>
                  <span v-if="log.os" class="meta-tag">{{ log.os }}</span>
                  <span v-if="log.browser" class="meta-tag">{{ log.browser }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!loading && selectedStudent && !logs.length" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color: var(--gray);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>ไม่พบกิจกรรมในช่วงเวลาที่เลือก</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" class="btn-page">ก่อนหน้า</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)" class="btn-page">ถัดไป</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

const ACTION_MAP = {
  login: { label: 'เข้าสู่ระบบ', icon: '>', color: 'green' },
  login_google: { label: 'เข้าสู่ระบบ (Google)', icon: 'G', color: 'green' },
  logout: { label: 'ออกจากระบบ', icon: '<', color: 'gray' },
  register: { label: 'สมัครสมาชิก', icon: '+', color: 'blue' },
  watch_start: { label: 'เริ่มดูคลิป', icon: '|>', color: 'blue' },
  watch_end: { label: 'หยุดดูคลิป', icon: '||', color: 'purple' },
  video_change: { label: 'เปลี่ยนวีดีโอ', icon: '>>', color: 'cyan' },
  pdf_download: { label: 'ดาวน์โหลด PDF', icon: 'v', color: 'gold' },
  section_view: { label: 'เข้าดู Section', icon: '#', color: 'blue' },
  live_join: { label: 'เข้าดู Live', icon: '!', color: 'red' },
  page_visit: { label: 'เข้าหน้าเว็บ', icon: '@', color: 'gray' },
  line_link: { label: 'เชื่อม LINE', icon: 'L', color: 'green' },
  profile_update: { label: 'แก้ไขโปรไฟล์', icon: 'E', color: 'blue' },
  password_change: { label: 'เปลี่ยนรหัสผ่าน', icon: '*', color: 'gold' }
}

export default {
  name: 'ActivityLog',
  data() {
    return {
      searchQuery: '',
      searchTimeout: null,
      students: [],
      selectedStudent: null,
      filterDays: 30,
      filterAction: '',
      logs: [],
      summary: null,
      loading: false,
      currentPage: 1,
      totalPages: 1
    }
  },
  computed: {
    groupedLogs() {
      const groups = {}
      for (const log of this.logs) {
        const date = new Date(log.createdAt).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        if (!groups[date]) groups[date] = []
        groups[date].push(log)
      }
      return groups
    }
  },
  methods: {
    searchStudents() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(async () => {
        if (!this.searchQuery || this.searchQuery.length < 2) {
          this.students = []
          return
        }
        try {
          const res = await api.get('/admin/activity/students', { params: { q: this.searchQuery } })
          this.students = res.students || []
        } catch { this.students = [] }
      }, 300)
    },
    selectStudent(s) {
      this.selectedStudent = s
      this.students = []
      this.searchQuery = ''
      this.currentPage = 1
      this.fetchLogs()
      this.fetchSummary()
    },
    clearStudent() {
      this.selectedStudent = null
      this.logs = []
      this.summary = null
      this.searchQuery = ''
    },
    async fetchLogs() {
      if (!this.selectedStudent) return
      this.loading = true
      try {
        const params = { days: this.filterDays, page: this.currentPage, limit: 100 }
        if (this.filterAction) params.action = this.filterAction
        const res = await api.get(`/admin/activity/logs/${this.selectedStudent._id}`, { params })
        this.logs = res.logs || []
        this.totalPages = res.pages || 1
      } catch { this.logs = [] }
      this.loading = false
    },
    async fetchSummary() {
      if (!this.selectedStudent) return
      try {
        this.summary = await api.get(`/admin/activity/summary/${this.selectedStudent._id}`, { params: { days: this.filterDays } })
      } catch { this.summary = null }
    },
    goPage(p) {
      this.currentPage = p
      this.fetchLogs()
    },
    getActionLabel(a) { return ACTION_MAP[a]?.label || a },
    getActionIcon(a) { return ACTION_MAP[a]?.icon || '?' },
    getActionColor(a) { return ACTION_MAP[a]?.color || 'gray' },
    formatTime(d) {
      return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    formatDuration(seconds) {
      if (!seconds) return '0 นาที'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      if (h > 0) return `${h} ชม. ${m} นาที`
      return `${m} นาที`
    }
  }
}
</script>

<style scoped>
/* ── Hero ── */
.hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  padding: 32px 0;
  color: white;
}
.hero-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.hero h1 { font-size: 22px; font-weight: 800; margin-bottom: 3px; }
.hero p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

/* ── Search ── */
.search-box { position: relative; margin-bottom: 20px; }
.search-input-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray);
}
.search-input {
  width: 100%;
  padding: 14px 14px 14px 42px;
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 15px;
  background: var(--white);
  transition: border-color 0.2s;
  outline: none;
}
.search-input:focus { border-color: var(--primary); }
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 4px;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.dropdown-item:hover { background: #f0f7ff; }
.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.student-avatar img { width: 100%; height: 100%; object-fit: cover; }
.student-avatar-placeholder {
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
.student-name { font-weight: 600; font-size: 14px; color: var(--dark); }
.student-email { font-size: 12px; color: var(--gray); }

/* ── Selected Card ── */
.selected-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f0f7ff;
  border: 2px solid var(--primary);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 20px;
}
.selected-info { display: flex; align-items: center; gap: 14px; }
.selected-name { font-weight: 700; font-size: 16px; color: var(--dark); }
.selected-email { font-size: 13px; color: var(--gray); }
.btn-clear {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray);
  transition: background 0.15s;
}
.btn-clear:hover { background: rgba(0,0,0,0.12); color: var(--danger); }

/* ── Filters ── */
.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 12px; font-weight: 600; color: var(--gray); }
.filter-group select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--white);
  outline: none;
}

/* ── Summary ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.summary-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}
.summary-num { font-size: 24px; font-weight: 800; color: var(--primary); }
.summary-date { font-size: 14px; }
.summary-label { font-size: 12px; color: var(--gray); margin-top: 4px; }

/* ── Loading ── */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: var(--gray);
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Timeline ── */
.timeline { margin-bottom: 24px; }
.timeline-group { margin-bottom: 24px; }
.timeline-date {
  font-size: 13px;
  font-weight: 700;
  color: var(--gray);
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.timeline-items { position: relative; padding-left: 24px; }
.timeline-items::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}
.timeline-item {
  position: relative;
  margin-bottom: 14px;
}
.timeline-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #e2e8f0;
}
.dot-green { background: #10b981; box-shadow: 0 0 0 2px #d1fae5; }
.dot-blue { background: #3b82f6; box-shadow: 0 0 0 2px #dbeafe; }
.dot-purple { background: #8b5cf6; box-shadow: 0 0 0 2px #ede9fe; }
.dot-gold { background: #f59e0b; box-shadow: 0 0 0 2px #fef3c7; }
.dot-red { background: #ef4444; box-shadow: 0 0 0 2px #fee2e2; }
.dot-cyan { background: #06b6d4; box-shadow: 0 0 0 2px #cffafe; }
.dot-gray { background: #94a3b8; box-shadow: 0 0 0 2px #e2e8f0; }

.timeline-content {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  box-shadow: var(--shadow-sm);
}
.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.timeline-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.badge-green { background: #d1fae5; color: #065f46; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-purple { background: #ede9fe; color: #5b21b6; }
.badge-gold { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-cyan { background: #cffafe; color: #155e75; }
.badge-gray { background: #f1f5f9; color: #475569; }

.timeline-time { font-size: 12px; color: var(--gray); font-weight: 500; white-space: nowrap; }
.timeline-detail { font-size: 13px; color: var(--dark); margin-top: 4px; }
.watch-dur { color: var(--primary); font-weight: 600; }
.timeline-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.meta-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  color: #64748b;
  font-family: monospace;
}

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--gray);
}
.empty-state p { margin-top: 12px; font-size: 14px; }

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}
.btn-page {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--white);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
}
.btn-page:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--gray); }

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .filters { flex-direction: column; }
}
</style>
