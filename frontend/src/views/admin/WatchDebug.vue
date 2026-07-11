<template>
  <div class="watch-debug-page">
    <div class="page-header">
      <div>
        <h1>🔍 Watch Debug</h1>
        <p class="subtitle">Session trace ที่จับได้จาก /watch — ทำงานได้แม้หน้าค้าง (via sendBeacon + pixel fallback)</p>
      </div>
      <button class="btn btn-outline" @click="load" :disabled="loading">🔄 รีเฟรช</button>
    </div>

    <div v-if="loading" class="empty-state">กำลังโหลด...</div>
    <div v-else-if="sessions.length === 0" class="empty-state">
      <div style="font-size:40px;">📭</div>
      <div>ยังไม่มี trace session</div>
      <div class="hint">Session จะโผล่หลังจากมี user เปิด /watch — เก็บ 24 ชม.</div>
    </div>

    <div v-else class="split-view">
      <!-- Sessions list -->
      <div class="sessions-panel">
        <div class="filter-bar">
          <input v-model="filter" placeholder="🔍 UA/IP/ประเทศ" class="form-control form-control-sm" />
        </div>
        <div class="sessions-list">
          <div
            v-for="s in filteredSessions"
            :key="s.sessionId"
            class="session-item"
            :class="{ active: selected && selected.sessionId === s.sessionId }"
            @click="openSession(s.sessionId)"
          >
            <div class="session-head">
              <span class="country-flag">{{ s.country || '?' }}</span>
              <span class="session-date">{{ formatDate(s.createdAt) }}</span>
              <span class="event-count">{{ s.eventCount }}</span>
            </div>
            <div class="session-meta">
              <span :class="'device-badge ' + deviceType(s.ua)">{{ deviceType(s.ua).toUpperCase() }}</span>
              <span class="ip">{{ s.ip }}</span>
            </div>
            <div class="session-route">{{ s.route }}</div>
          </div>
        </div>
      </div>

      <!-- Detail timeline -->
      <div class="detail-panel">
        <div v-if="!selected" class="empty-state" style="padding: 40px;">
          👈 เลือก session ทางซ้าย
        </div>
        <div v-else>
          <div class="detail-header">
            <div>
              <div class="detail-title">Session {{ selected.sessionId }}</div>
              <div class="detail-sub">{{ selected.ua }}</div>
              <div class="detail-sub">IP: {{ selected.ip }} · Country: {{ selected.country || '?' }} · Route: {{ selected.route }}</div>
            </div>
            <div class="stat-grid">
              <div class="stat"><b>{{ selected.events.length }}</b><span>events</span></div>
              <div class="stat"><b>{{ freezeCount }}</b><span>freezes</span></div>
              <div class="stat"><b>{{ errorCount }}</b><span>errors</span></div>
              <div class="stat"><b>{{ formatDur(lastEventTime) }}</b><span>duration</span></div>
            </div>
          </div>

          <div class="timeline">
            <div v-for="(ev, i) in selected.events" :key="i" class="event-row" :class="'ev-' + eventClass(ev.type)">
              <span class="ev-time">{{ formatMs(ev.t) }}</span>
              <span class="ev-type">{{ ev.type }}</span>
              <span class="ev-data">{{ formatData(ev.data) }}</span>
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
  name: 'WatchDebug',
  data() {
    return {
      loading: false,
      sessions: [],
      selected: null,
      filter: ''
    }
  },
  computed: {
    filteredSessions() {
      if (!this.filter) return this.sessions
      const q = this.filter.toLowerCase()
      return this.sessions.filter(s =>
        (s.ua || '').toLowerCase().includes(q) ||
        (s.ip || '').includes(q) ||
        (s.country || '').toLowerCase().includes(q) ||
        (s.route || '').includes(q)
      )
    },
    freezeCount() {
      return (this.selected?.events || []).filter(e => e.type === 'freeze').length
    },
    errorCount() {
      return (this.selected?.events || []).filter(e => /err|error/.test(e.type)).length
    },
    lastEventTime() {
      const evs = this.selected?.events || []
      return evs.length ? evs[evs.length - 1].t : 0
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      this.loading = true
      try {
        const r = await api.get('/admin/watch-debug/sessions')
        this.sessions = r.sessions || []
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    async openSession(sid) {
      try {
        const r = await api.get('/admin/watch-debug/sessions/' + sid)
        this.selected = r.session
      } catch (e) {}
    },
    deviceType(ua) {
      if (!ua) return 'unknown'
      if (/iPad|Macintosh.*Mobile/i.test(ua)) return 'ipad'
      if (/iPhone|iPod/i.test(ua)) return 'iphone'
      if (/Android/i.test(ua)) return 'android'
      if (/Windows/i.test(ua)) return 'win'
      if (/Mac/i.test(ua)) return 'mac'
      return 'unknown'
    },
    eventClass(type) {
      if (/freeze/.test(type)) return 'freeze'
      if (/err/.test(type)) return 'err'
      if (/load|ready/.test(type)) return 'ok'
      if (/start|added/.test(type)) return 'start'
      return 'info'
    },
    formatMs(ms) {
      if (ms < 1000) return ms + 'ms'
      return (ms / 1000).toFixed(2) + 's'
    },
    formatDur(ms) {
      if (ms < 1000) return ms + 'ms'
      if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
      return Math.floor(ms / 60000) + 'm ' + Math.floor((ms % 60000) / 1000) + 's'
    },
    formatData(data) {
      if (data == null) return ''
      if (typeof data === 'string') return data
      return JSON.stringify(data)
    },
    formatDate(d) {
      if (!d) return ''
      const dt = new Date(d)
      return `${dt.getDate()}/${dt.getMonth() + 1} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.watch-debug-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.page-header h1 { margin: 0 0 4px; font-size: 22px; color: #1e293b; }
.subtitle { margin: 0; color: #64748b; font-size: 13px; }

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
}
.hint { margin-top: 8px; font-size: 12px; color: #94a3b8; }

.split-view {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.sessions-panel, .detail-panel {
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.filter-bar { padding: 8px; border-bottom: 1px solid #e2e8f0; }
.form-control {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
}
.form-control-sm { padding: 4px 8px; }

.sessions-list {
  overflow-y: auto;
  flex: 1;
}
.session-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.1s;
}
.session-item:hover { background: #f8fafc; }
.session-item.active { background: #dbeafe; border-left: 3px solid #2563eb; padding-left: 9px; }
.session-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 4px;
}
.country-flag { font-weight: 700; color: #dc2626; font-family: monospace; }
.session-date { color: #64748b; font-size: 11px; }
.event-count {
  background: #e2e8f0;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}
.session-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 3px;
  font-size: 11px;
  align-items: center;
}
.device-badge {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  color: white;
}
.device-badge.iphone, .device-badge.ipad { background: #0369a1; }
.device-badge.android { background: #16a34a; }
.device-badge.win { background: #7c3aed; }
.device-badge.mac { background: #ea580c; }
.device-badge.unknown { background: #64748b; }
.ip {
  font-family: 'SF Mono', Menlo, monospace;
  color: #64748b;
  font-size: 10px;
}
.session-route {
  font-family: 'SF Mono', Menlo, monospace;
  color: #94a3b8;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-header {
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  background: #f8fafc;
}
.detail-title { font-weight: 700; font-size: 14px; color: #1e293b; }
.detail-sub {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.stat-grid {
  display: flex;
  gap: 12px;
}
.stat {
  text-align: center;
  min-width: 60px;
}
.stat b {
  display: block;
  font-size: 18px;
  color: #1e293b;
}
.stat span {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
}

.timeline {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}
.event-row {
  display: grid;
  grid-template-columns: 80px 140px 1fr;
  gap: 12px;
  padding: 4px 18px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 11px;
  border-left: 3px solid transparent;
}
.event-row:hover { background: #f8fafc; }
.ev-time { color: #94a3b8; text-align: right; }
.ev-type { font-weight: 700; color: #475569; }
.ev-data { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-time, .ev-type, .ev-data { line-height: 1.4; }

.ev-freeze { border-left-color: #dc2626; background: #fef2f2; }
.ev-freeze .ev-type { color: #b91c1c; }
.ev-err { border-left-color: #f59e0b; background: #fffbeb; }
.ev-err .ev-type { color: #b45309; }
.ev-ok { border-left-color: #10b981; }
.ev-ok .ev-type { color: #059669; }
.ev-start { border-left-color: #3b82f6; }
.ev-start .ev-type { color: #1d4ed8; }
</style>
