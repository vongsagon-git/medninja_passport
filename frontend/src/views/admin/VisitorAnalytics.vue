<template>
  <div class="analytics">
    <!-- Hero -->
    <div class="hero">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
            </svg>
          </div>
          <div>
            <h1>Visitor Analytics</h1>
            <p>สถิติผู้เข้าชมเว็บไซต์</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Controls -->
      <div class="controls-bar">
        <div class="period-tabs">
          <button v-for="p in periods" :key="p.value" :class="['tab-btn', { active: days === p.value && !dateFrom }]" @click="dateFrom = ''; dateTo = ''; days = p.value; fetchAll()">
            {{ p.label }}
          </button>
        </div>
        <div class="date-picker-group">
          <input type="date" v-model="dateFrom" class="date-input" @change="onDateRange" />
          <span class="date-dash">—</span>
          <input type="date" v-model="dateTo" class="date-input" @change="onDateRange" />
          <button v-if="dateFrom || dateTo" class="btn-clear-date" @click="dateFrom = ''; dateTo = ''; days = 1; fetchAll()">
            ล้าง
          </button>
        </div>
        <button class="btn-refresh" @click="fetchAll" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/></svg>
          Refresh
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>

      <template v-else-if="stats">
        <!-- Summary Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.totalVisits.toLocaleString() }}</span>
              <span class="stat-label">Page Views</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.uniqueVisitors.toLocaleString() }}</span>
              <span class="stat-label">Unique Visitors (IP)</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ avgPerDay }}</span>
              <span class="stat-label">เฉลี่ย/วัน</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ mobilePercent }}%</span>
              <span class="stat-label">Mobile</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="section-tabs">
          <button :class="['stab', { active: activeTab === 'daily' }]" @click="activeTab = 'daily'">รายวัน</button>
          <button :class="['stab', { active: activeTab === 'pages' }]" @click="activeTab = 'pages'">แยกหน้า</button>
          <button :class="['stab', { active: activeTab === 'devices' }]" @click="activeTab = 'devices'">Device/OS/Browser</button>
          <button :class="['stab', { active: activeTab === 'referrers' }]" @click="activeTab = 'referrers'">Referrers</button>
          <button :class="['stab', { active: activeTab === 'recent' }]" @click="activeTab = 'recent'; fetchRecent()">ล่าสุด</button>
        </div>

        <!-- Daily Chart (simple bar) -->
        <div v-if="activeTab === 'daily'" class="panel">
          <h3 class="panel-title">จำนวนผู้เข้าชมรายวัน</h3>
          <div v-if="stats.daily.length === 0" class="empty">ยังไม่มีข้อมูล</div>
          <div v-else class="chart-wrap">
            <div class="bar-chart">
              <div v-for="d in stats.daily" :key="d.date" class="bar-item">
                <div class="bar-tooltip">
                  <strong>{{ formatDate(d.date) }}</strong><br>
                  {{ d.total }} views / {{ d.unique }} unique
                </div>
                <div class="bar-fill" :style="{ height: barHeight(d.total) + '%' }">
                  <span class="bar-value">{{ d.total }}</span>
                </div>
                <span class="bar-label">{{ shortDate(d.date) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- By Page -->
        <div v-if="activeTab === 'pages'" class="panel">
          <h3 class="panel-title">แยกตามหน้า</h3>
          <table class="data-table">
            <thead><tr><th>หน้า</th><th>Views</th><th>สัดส่วน</th></tr></thead>
            <tbody>
              <tr v-for="p in stats.byPage" :key="p.page">
                <td class="page-cell">{{ pageLabel(p.page) }}</td>
                <td>{{ p.total.toLocaleString() }}</td>
                <td>
                  <div class="pct-bar">
                    <div class="pct-fill" :style="{ width: pct(p.total, stats.totalVisits) + '%' }"></div>
                    <span>{{ pct(p.total, stats.totalVisits) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Devices -->
        <div v-if="activeTab === 'devices'" class="panel">
          <div class="three-cols">
            <div>
              <h3 class="panel-title">Device</h3>
              <div v-for="d in stats.byDevice" :key="d.device" class="breakdown-item">
                <span class="breakdown-label">{{ d.device || 'unknown' }}</span>
                <span class="breakdown-value">{{ d.total }}</span>
                <div class="breakdown-bar"><div :style="{ width: pct(d.total, stats.totalVisits) + '%' }"></div></div>
              </div>
            </div>
            <div>
              <h3 class="panel-title">OS</h3>
              <div v-for="o in stats.byOS" :key="o.os" class="breakdown-item">
                <span class="breakdown-label">{{ o.os || 'unknown' }}</span>
                <span class="breakdown-value">{{ o.total }}</span>
                <div class="breakdown-bar"><div :style="{ width: pct(o.total, stats.totalVisits) + '%' }"></div></div>
              </div>
            </div>
            <div>
              <h3 class="panel-title">Browser</h3>
              <div v-for="b in stats.byBrowser" :key="b.browser" class="breakdown-item">
                <span class="breakdown-label">{{ b.browser || 'unknown' }}</span>
                <span class="breakdown-value">{{ b.total }}</span>
                <div class="breakdown-bar"><div :style="{ width: pct(b.total, stats.totalVisits) + '%' }"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Referrers -->
        <div v-if="activeTab === 'referrers'" class="panel">
          <h3 class="panel-title">Top Referrers (มาจากไหน)</h3>
          <div v-if="!stats.topReferrers.length" class="empty">ไม่มี referrer (Direct traffic ทั้งหมด)</div>
          <table v-else class="data-table">
            <thead><tr><th>Source</th><th>Views</th></tr></thead>
            <tbody>
              <tr v-for="r in stats.topReferrers" :key="r.referrer">
                <td class="ref-cell">{{ r.referrer }}</td>
                <td>{{ r.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent visits -->
        <div v-if="activeTab === 'recent'" class="panel">
          <h3 class="panel-title">ผู้เข้าชมล่าสุด</h3>
          <div v-if="loadingRecent" class="loading-state"><div class="spinner"></div></div>
          <div v-else-if="!recentVisits.length" class="empty">ยังไม่มีข้อมูล</div>
          <div v-else class="recent-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>หน้า</th>
                  <th>IP</th>
                  <th>OS</th>
                  <th>Browser</th>
                  <th>Device</th>
                  <th>Referrer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in recentVisits" :key="v._id">
                  <td class="time-cell">{{ formatTime(v.createdAt) }}</td>
                  <td>{{ pageLabel(v.page) }}</td>
                  <td class="mono">{{ v.ip }}</td>
                  <td>{{ v.os }}</td>
                  <td>{{ v.browser }}</td>
                  <td>
                    <span :class="'device-badge device-' + v.device">{{ v.device }}</span>
                  </td>
                  <td class="ref-cell">{{ v.referrer || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'VisitorAnalytics',
  data() {
    return {
      loading: false,
      loadingRecent: false,
      days: 1,
      dateFrom: '',
      dateTo: '',
      activeTab: 'daily',
      stats: null,
      recentVisits: [],
      periods: [
        { label: 'วันนี้', value: 1 },
        { label: '7 วัน', value: 7 },
        { label: '14 วัน', value: 14 },
        { label: '30 วัน', value: 30 },
        { label: '90 วัน', value: 90 }
      ]
    }
  },
  computed: {
    avgPerDay() {
      if (!this.stats || !this.stats.daily.length) return '0'
      return Math.round(this.stats.totalVisits / this.stats.daily.length)
    },
    mobilePercent() {
      if (!this.stats || !this.stats.totalVisits) return '0'
      const mobile = this.stats.byDevice.find(d => d.device === 'mobile')
      return mobile ? Math.round(mobile.total / this.stats.totalVisits * 100) : 0
    },
    maxDaily() {
      if (!this.stats) return 1
      return Math.max(...this.stats.daily.map(d => d.total), 1)
    }
  },
  async mounted() {
    await this.fetchAll()
  },
  methods: {
    onDateRange() {
      if (!this.dateFrom) return
      this.fetchAll()
    },
    async fetchAll() {
      this.loading = true
      try {
        let url = `/admin/visitors/stats?days=${this.days}`
        if (this.dateFrom) url += `&from=${this.dateFrom}`
        if (this.dateTo) url += `&to=${this.dateTo}`
        const res = await api.get(url)
        this.stats = res
      } catch (err) {
        console.error('visitor stats error:', err)
      } finally {
        this.loading = false
      }
    },
    async fetchRecent() {
      this.loadingRecent = true
      try {
        const res = await api.get('/admin/visitors/recent?limit=100')
        this.recentVisits = res.visits || []
      } catch (err) {
        console.error('visitor recent error:', err)
      } finally {
        this.loadingRecent = false
      }
    },
    barHeight(val) {
      return Math.max((val / this.maxDaily) * 100, 4)
    },
    pct(val, total) {
      if (!total) return 0
      return Math.round(val / total * 100)
    },
    pageLabel(path) {
      const labels = {
        '/': 'Home',
        '/courses': 'Courses',
        '/demo': 'Demo',
        '/ninja-passport': 'Ninja Passport',
        '/demo/watch/0': 'Demo Watch 0',
        '/demo/watch/1': 'Demo Watch 1'
      }
      return labels[path] || path
    },
    formatDate(d) {
      return new Date(d + 'T00:00:00+07:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
    },
    shortDate(d) {
      return new Date(d + 'T00:00:00+07:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    },
    formatTime(iso) {
      return new Date(iso).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
/* Hero */
.hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  padding: 32px 0;
  color: white;
}
.hero-inner { display: flex; align-items: center; gap: 16px; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
}
.hero h1 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 3px; }
.hero p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

/* Controls */
.controls-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.period-tabs { display: flex; gap: 6px; }
.date-picker-group { display: flex; align-items: center; gap: 6px; }
.date-input {
  padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; color: #0f172a; outline: none; background: #fff;
}
.date-input:focus { border-color: #3b82f6; }
.date-dash { color: #94a3b8; font-weight: 600; }
.btn-clear-date {
  padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 11px; font-weight: 600; color: #94a3b8; background: #fff;
  cursor: pointer; transition: all 0.15s;
}
.btn-clear-date:hover { background: #f1f5f9; color: #64748b; }
.tab-btn {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); font-size: 13px; font-weight: 600; cursor: pointer;
  color: var(--gray); transition: all 0.2s;
}
.tab-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
.btn-refresh {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  border-radius: 8px; border: 1px solid var(--border); background: var(--white);
  font-size: 13px; font-weight: 600; cursor: pointer; color: var(--gray);
}
.btn-refresh:hover { border-color: var(--primary); color: var(--primary); }

/* Stats grid */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--border);
  padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow-sm);
}
.stat-icon {
  width: 48px; height: 48px; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-blue { background: #dbeafe; color: #1d4ed8; }
.stat-green { background: #dcfce7; color: #15803d; }
.stat-purple { background: #ede9fe; color: #7c3aed; }
.stat-gold { background: #fef9c3; color: #b45309; }
.stat-body { flex: 1; }
.stat-number { display: block; font-size: 26px; font-weight: 800; color: var(--dark); line-height: 1.1; }
.stat-label { display: block; font-size: 12px; color: var(--gray); margin-top: 4px; font-weight: 500; }

/* Section tabs */
.section-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid var(--border); padding-bottom: 0; }
.stab {
  padding: 10px 18px; border: none; background: none; font-size: 13px; font-weight: 600;
  color: var(--gray); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: all 0.2s;
}
.stab.active { color: var(--primary); border-bottom-color: var(--primary); }
.stab:hover { color: var(--dark); }

/* Panel */
.panel {
  background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--border);
  padding: 24px; box-shadow: var(--shadow-sm);
}
.panel-title { font-size: 15px; font-weight: 700; color: var(--dark); margin-bottom: 16px; }
.empty { text-align: center; padding: 40px; color: var(--gray); font-size: 14px; }

/* Bar chart */
.chart-wrap { overflow-x: auto; }
.bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; min-width: 100%; padding-top: 10px; }
.bar-item { flex: 1; min-width: 36px; display: flex; flex-direction: column; align-items: center; position: relative; height: 100%; justify-content: flex-end; }
.bar-fill {
  width: 100%; max-width: 40px; background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  border-radius: 4px 4px 0 0; position: relative; transition: height 0.3s; min-height: 4px;
  cursor: pointer;
}
.bar-fill:hover { opacity: 0.85; }
.bar-value {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  font-size: 10px; font-weight: 700; color: var(--dark); white-space: nowrap;
}
.bar-label { font-size: 10px; color: var(--gray); margin-top: 6px; white-space: nowrap; }
.bar-tooltip {
  display: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
  background: #1e293b; color: white; padding: 8px 12px; border-radius: 8px;
  font-size: 11px; white-space: nowrap; z-index: 10; margin-bottom: 8px;
}
.bar-item:hover .bar-tooltip { display: block; }

/* Data table */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid var(--border); font-weight: 700; color: var(--dark); font-size: 12px; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--dark); }
.data-table tr:hover td { background: #f8fafc; }
.page-cell { font-weight: 600; }
.ref-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time-cell { white-space: nowrap; font-size: 12px; color: var(--gray); }
.mono { font-family: monospace; font-size: 12px; }
.recent-table-wrap { overflow-x: auto; }

/* Percentage bar */
.pct-bar { display: flex; align-items: center; gap: 8px; }
.pct-fill { height: 8px; border-radius: 4px; background: #3b82f6; min-width: 4px; }
.pct-bar span { font-size: 12px; color: var(--gray); font-weight: 600; }

/* Breakdown items */
.three-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.breakdown-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; flex-wrap: wrap; }
.breakdown-label { font-size: 13px; font-weight: 600; min-width: 80px; }
.breakdown-value { font-size: 12px; color: var(--gray); font-weight: 600; min-width: 40px; text-align: right; }
.breakdown-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; min-width: 60px; }
.breakdown-bar div { height: 100%; background: #3b82f6; border-radius: 3px; }

/* Device badge */
.device-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.device-desktop { background: #dbeafe; color: #1d4ed8; }
.device-mobile { background: #dcfce7; color: #15803d; }
.device-tablet { background: #fef9c3; color: #b45309; }

/* Loading */
.loading-state { text-align: center; padding: 60px 20px; }
.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .three-cols { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .section-tabs { overflow-x: auto; flex-wrap: nowrap; }
  .stab { white-space: nowrap; padding: 8px 12px; font-size: 12px; }
  .period-tabs { flex-wrap: wrap; }
}
</style>
