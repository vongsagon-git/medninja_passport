<template>
  <div class="admin-page">
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h1>Monitoring</h1>
          <p class="page-sub">ผู้ชมออนไลน์ · Client Logs · ความผิดปกติ — auto-refresh ทุก 15 วินาที</p>
        </div>
        <button class="btn btn-outline" @click="loadAll" :disabled="loading">{{ loading ? '...' : '🔄 รีเฟรช' }}</button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-num" style="color:#10b981;">{{ viewers.length }}</div>
        <div class="summary-label">คนออนไลน์</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color:#ef4444;">{{ viewers.filter(v => v.blockedTabs > 0).length }}</div>
        <div class="summary-label">เปิดหลายจอ</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color:#f59e0b;">{{ unreadLogs }}</div>
        <div class="summary-label">Logs ใหม่</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color:#ef4444;">{{ anomalies.filter(a => !a.resolved).length }}</div>
        <div class="summary-label">ผิดปกติ</div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="tab-btn" :class="{ active: tab === 'viewers' }" @click="tab='viewers'">ผู้ชมออนไลน์ ({{ viewers.length }})</button>
      <button class="tab-btn" :class="{ active: tab === 'logs' }" @click="tab='logs'; loadLogs()">Client Logs ({{ unreadLogs }})</button>
      <button class="tab-btn" :class="{ active: tab === 'anomalies' }" @click="tab='anomalies'; loadReport()">ความผิดปกติ ({{ anomalyReports.length }})</button>
    </div>

    <!-- Active Viewers — 1 card ต่อ user -->
    <div v-if="tab === 'viewers'">
      <div class="viewer-grid" v-if="viewers.length">
        <div class="viewer-card" :class="{ 'vc-blocked': v.blockedTabs > 0 }" v-for="v in viewers" :key="v.userId">
          <div class="vc-header">
            <div class="vc-avatar" :class="{ 'vc-avatar-blocked': v.blockedTabs > 0 }">{{ (v.userName || '?')[0] }}</div>
            <div style="flex:1;min-width:0;">
              <div class="vc-name">{{ v.userName || '-' }}</div>
              <div class="vc-email">{{ v.userEmail || '-' }}</div>
            </div>
            <div v-if="v.blockedTabs > 0" class="vc-status vc-st-blocked">
              +{{ v.blockedTabs }} จอถูกบล็อก
            </div>
            <div v-else class="vc-status vc-st-watching">ปกติ</div>
          </div>
          <div class="vc-body">
            <div class="vc-row"><span class="vc-label">Video</span> <strong>{{ v.videoTitle }}</strong></div>
            <div class="vc-row"><span class="vc-label">Section</span> {{ v.sectionName || '-' }}</div>
            <div class="vc-row"><span class="vc-label">Device</span> {{ v.os || '?' }} · {{ v.browser || '?' }}</div>
            <div class="vc-row">
              <span class="vc-label">เล่น</span>
              <span :style="{ color: v.isPlaying ? '#10b981' : '#f59e0b', fontWeight: 700 }">{{ v.isPlaying ? '▶' : '⏸' }}</span>
              {{ formatTime(v.currentTime) }} / {{ formatTime(v.videoDuration) }}
              <span v-if="v.videoDuration > 0" style="color:#94a3b8;margin-left:4px;">({{ Math.round(v.currentTime / v.videoDuration * 100) }}%)</span>
            </div>
            <div v-if="v.playerError" class="vc-row" style="color:#ef4444;font-weight:700;">
              <span class="vc-label">Error</span> {{ v.playerError }}
            </div>
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center;">
            <span>{{ v.ago }}s ago</span>
            <span v-if="v.blockedTabs > 0" style="color:#ef4444;font-weight:700;">พยายามเปิด {{ v.totalTabs }} จอ</span>
            <button class="btn btn-sm" style="padding:2px 10px;font-size:11px;color:#ef4444;border:1px solid #fecaca;background:#fff;" @click="kickViewer(v.userId)">Kick</button>
          </div>
        </div>
      </div>
      <div class="card" v-else style="text-align:center;padding:40px;color:var(--gray);">ไม่มีผู้ชมออนไลน์ตอนนี้</div>
    </div>

    <!-- Client Logs -->
    <div class="card" v-if="tab === 'logs'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 class="card-title" style="margin:0;">Client Logs</h2>
        <select v-model="logFilter" @change="loadLogs" style="padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;">
          <option value="">ทั้งหมด</option>
          <option value="error">Error</option>
          <option value="video_error">Video Error</option>
          <option value="devtools">DevTools</option>
          <option value="replaced">Replaced</option>
          <option value="behavior">Behavior</option>
        </select>
      </div>
      <table class="data-table" v-if="clientLogs.length">
        <thead><tr><th>เวลา</th><th>ชื่อ</th><th>ประเภท</th><th>ข้อความ</th><th>OS / Browser</th><th>หน้า</th><th></th></tr></thead>
        <tbody>
          <tr v-for="l in clientLogs" :key="l._id" :class="{ resolved: l.resolved }">
            <td style="font-size:11px;white-space:nowrap;">{{ formatDate(l.createdAt) }}</td>
            <td style="font-weight:600;font-size:12px;">{{ l.userName || '-' }}</td>
            <td><span class="log-badge" :class="'log-' + l.type">{{ l.type }}</span></td>
            <td style="font-size:12px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="l.detail || l.message">{{ l.message }}</td>
            <td style="font-size:11px;color:var(--gray);">{{ l.os || '?' }} / {{ l.browser || '?' }}</td>
            <td style="font-size:11px;color:var(--gray);">{{ l.videoTitle || '-' }}</td>
            <td>
              <button v-if="!l.resolved" class="btn btn-sm btn-outline" @click="resolveLog(l._id)">OK</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else style="color:var(--gray);padding:20px;text-align:center;">ไม่มี log</p>
    </div>

    <!-- Anomaly Report -->
    <div v-if="tab === 'anomalies'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 class="card-title" style="margin:0;color:#ef4444;">รายงานความผิดปกติ ({{ anomalyReports.length }} คน)</h2>
        <select v-model="reportHours" @change="loadReport" style="padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;">
          <option :value="1">1 ชม.</option>
          <option :value="6">6 ชม.</option>
          <option :value="24">24 ชม.</option>
          <option :value="72">3 วัน</option>
        </select>
      </div>
      <div v-if="anomalyReports.length" class="report-list">
        <div v-for="r in anomalyReports" :key="r.userId" class="report-card" :class="'severity-' + r.severity">
          <div class="rp-header">
            <div class="rp-avatar" :class="'rp-av-' + r.severity">{{ (r.userName || '?')[0] }}</div>
            <div style="flex:1;min-width:0;">
              <div class="rp-name">{{ r.userName }}</div>
              <div class="rp-email">{{ r.userEmail }}</div>
            </div>
            <span class="rp-severity" :class="'rp-sev-' + r.severity">{{ r.severity === 'high' ? 'สูง' : r.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ' }}</span>
          </div>
          <div class="rp-alerts">
            <div v-for="(a, i) in r.alerts" :key="i" class="rp-alert">
              <span>{{ a.icon }} {{ a.message }}</span>
              <span style="color:#94a3b8;font-size:11px;">{{ a.detail }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card" v-else style="text-align:center;padding:40px;color:var(--gray);">ไม่พบความผิดปกติในช่วง {{ reportHours }} ชม. ที่ผ่านมา</div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ActiveViewers',
  data() {
    return { viewers: [], anomalies: [], clientLogs: [], anomalyReports: [], loading: false, tab: 'viewers', logFilter: '', reportHours: 24 }
  },
  computed: {
    unreadLogs() { return this.clientLogs.filter(l => !l.resolved).length },
    osList() {
      const counts = {}
      this.viewers.forEach(v => { const k = v.os || '?'; counts[k] = (counts[k] || 0) + 1 })
      return Object.entries(counts).map(([k, v]) => `${k}(${v})`).join(' ') || '-'
    }
  },
  async mounted() {
    await this.loadAll()
    this.loadLogs()
    this.loadReport()
    // auto refresh ทุก 10 วินาที — เกือบ realtime
    this._interval = setInterval(() => { this.loadAll(); if (this.tab === 'anomalies') this.loadReport() }, 10000)
  },
  beforeUnmount() {
    if (this._interval) clearInterval(this._interval)
  },
  methods: {
    async loadAll() {
      this.loading = true
      try {
        const [v, a] = await Promise.all([
          api.get('/admin/viewers'),
          api.get('/admin/anomalies')
        ])
        this.viewers = v.viewers || []
        this.anomalies = a.logs || []
      } catch { /* */ }
      this.loading = false
    },
    async resolve(id) {
      await api.patch(`/admin/anomalies/${id}/resolve`)
      await this.loadAll()
    },
    async loadLogs() {
      try {
        const q = this.logFilter ? `?type=${this.logFilter}` : ''
        const d = await api.get(`/admin/client-logs${q}`)
        this.clientLogs = d.logs || []
      } catch { /* */ }
    },
    async resolveLog(id) {
      await api.patch(`/admin/client-logs/${id}/resolve`)
      await this.loadLogs()
    },
    async kickViewer(userId) {
      if (!confirm('เตะ viewer ออกจากหน้า video?')) return
      try {
        await api.post(`/admin/viewers/${userId}/kick`)
        this.successMsg = 'เตะเรียบร้อย — จะออกภายใน 10 วินาที'
        if (!this.successMsg) return
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.loadAll()
      } catch (err) {
        alert(err.response?.data?.message || 'kick ล้มเหลว')
      }
    },
    async loadReport() {
      try {
        const d = await api.get(`/admin/anomaly-report?hours=${this.reportHours}`)
        this.anomalyReports = d.reports || []
      } catch { /* */ }
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
    },
    formatTime(sec) {
      if (!sec || sec <= 0) return '0:00'
      const m = Math.floor(sec / 60)
      const s = Math.round(sec % 60)
      return `${m}:${String(s).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: var(--primary); margin: 0; }
.page-sub { color: #64748b; font-size: 13px; margin-top: 4px; }

.summary-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.summary-card {
  flex: 1; min-width: 100px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px; text-align: center;
}
.summary-num { font-size: 28px; font-weight: 800; line-height: 1; }
.summary-label { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; }

.viewer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.viewer-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
  transition: box-shadow .15s;
}
.viewer-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.vc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.vc-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #a855f7);
  color: #fff; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.vc-name { font-weight: 700; font-size: 14px; color: #1e293b; }
.vc-email { font-size: 11px; color: #94a3b8; }
.vc-status {
  padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; white-space: nowrap;
}
.vc-st-watching { background: #ecfdf5; color: #10b981; }
.vc-st-blocked { background: #fef2f2; color: #ef4444; }
.vc-blocked { border-color: #fecaca; background: #fff5f5; }
.vc-avatar-blocked { background: linear-gradient(135deg, #ef4444, #dc2626) !important; }
.vc-body { font-size: 12px; color: #475569; }
.vc-row { padding: 2px 0; }
.vc-label { font-weight: 700; color: #94a3b8; display: inline-block; width: 55px; }
.vc-tabs { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.vc-tab {
  padding: 8px 10px; border-radius: 8px; font-size: 12px;
}
.vc-tab-watching { background: #ecfdf5; border: 1px solid #a7f3d0; }
.vc-tab-blocked { background: #fef2f2; border: 1px solid #fecaca; }
.vc-tab-status { font-weight: 700; font-size: 11px; margin-bottom: 2px; }
.vc-tab-watching .vc-tab-status { color: #10b981; }
.vc-tab-blocked .vc-tab-status { color: #ef4444; }
.vc-tab-info { font-weight: 600; color: #1e293b; }
.vc-tab-device { font-size: 11px; color: #94a3b8; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }
.card-title { font-size: 15px; font-weight: 800; color: var(--primary); margin: 0 0 12px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 700; color: #475569; }
.data-table td { padding: 8px 10px; border-top: 1px solid #f1f5f9; vertical-align: top; }
tr.resolved { opacity: 0.5; }

.tab-btn {
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
  font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all .15s;
}
.tab-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.tab-btn:hover:not(.active) { background: #f1f5f9; }

.log-badge {
  display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.log-error { background: #fef2f2; color: #ef4444; }
.log-video_error { background: #fef2f2; color: #dc2626; }
.log-devtools { background: #fffbeb; color: #d97706; }
.log-replaced { background: #f5f3ff; color: #7c3aed; }
.log-behavior { background: #fffbeb; color: #b45309; }
.log-info { background: #f0f9ff; color: #0284c7; }

/* ═══ Anomaly Report ═══ */
.report-list { display: flex; flex-direction: column; gap: 10px; }
.report-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
  border-left: 4px solid #94a3b8;
}
.report-card.severity-high { border-left-color: #ef4444; background: #fef2f2; }
.report-card.severity-medium { border-left-color: #f59e0b; background: #fffbeb; }
.rp-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.rp-avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #94a3b8;
  color: #fff; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rp-av-high { background: #ef4444; }
.rp-av-medium { background: #f59e0b; }
.rp-name { font-weight: 700; font-size: 13px; }
.rp-email { font-size: 11px; color: #94a3b8; }
.rp-severity { padding: 2px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.rp-sev-high { background: #fef2f2; color: #ef4444; }
.rp-sev-medium { background: #fffbeb; color: #d97706; }
.rp-sev-low { background: #f0f9ff; color: #0284c7; }
.rp-alerts { font-size: 13px; }
.rp-alert { padding: 3px 0; display: flex; justify-content: space-between; gap: 8px; }

@media (max-width: 768px) {
  .data-table { font-size: 11px; }
  .data-table th, .data-table td { padding: 6px; }
}
</style>
