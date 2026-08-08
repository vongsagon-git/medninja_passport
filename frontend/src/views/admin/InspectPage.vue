<template>
  <div class="inspect">
    <header class="head">
      <h1>🔍 Observability Console</h1>
      <p class="sub">Debug + track token/session/error ข้าม 15 apps</p>
    </header>

    <nav class="tabs">
      <button v-for="t in tabs" :key="t.id" :class="{ active: tab === t.id }" @click="tab = t.id">
        {{ t.icon }} {{ t.label }}
      </button>
    </nav>

    <!-- 1) Token Inspector -->
    <section v-if="tab === 'token'" class="card">
      <h2>🎫 Token Inspector</h2>
      <p class="hint">วาง JWT → ดู metadata (app ต้นทาง, user, expiry, jti)</p>
      <textarea v-model="tokenInput" placeholder="eyJhbGc..." rows="4"></textarea>
      <div class="row">
        <button class="btn" @click="inspectToken" :disabled="!tokenInput">Decode</button>
        <button class="btn ghost" @click="useMyToken">ใช้ token ของฉัน</button>
      </div>

      <div v-if="tokenResult" class="result">
        <div v-if="tokenResult.ok" class="ok-badge">✅ Signature valid</div>
        <div v-else class="err-badge">❌ Invalid: {{ tokenResult.error }}</div>

        <table class="kv">
          <tr><td>From app (iss)</td><td><b>{{ tokenResult.iss || '—' }}</b></td></tr>
          <tr><td>Target app (aud)</td><td>{{ tokenResult.aud || '—' }}</td></tr>
          <tr><td>Source (src)</td><td><span class="chip">{{ tokenResult.src || '—' }}</span></td></tr>
          <tr><td>JWT ID (jti)</td><td class="mono">{{ tokenResult.jti || '—' }}</td></tr>
          <tr><td>Created by</td><td>{{ tokenResult.createdBy || 'self' }}</td></tr>
          <tr><td>Parent JTI</td><td class="mono">{{ tokenResult.parentJti || '—' }}</td></tr>
          <tr class="sep"><td colspan="2"></td></tr>
          <tr><td>User ID</td><td class="mono">{{ tokenResult.id || tokenResult.playerId || '—' }}</td></tr>
          <tr><td>Session ID</td><td class="mono">{{ tokenResult.sid || '—' }}</td></tr>
          <tr><td>Type</td><td>{{ tokenResult.type || 'full' }}</td></tr>
          <tr class="sep"><td colspan="2"></td></tr>
          <tr><td>Issued at</td><td>{{ tokenResult.iatDate || '—' }}</td></tr>
          <tr><td>Expires</td><td>{{ tokenResult.expDate || '—' }} <span v-if="tokenResult.secondsLeft > 0" class="chip">อีก {{ formatDuration(tokenResult.secondsLeft) }}</span><span v-else class="chip red">หมดอายุ</span></td></tr>
        </table>

        <details class="raw">
          <summary>Raw payload</summary>
          <pre>{{ JSON.stringify(tokenResult.raw, null, 2) }}</pre>
        </details>
      </div>
    </section>

    <!-- 2) Recent Errors -->
    <section v-if="tab === 'errors'" class="card">
      <h2>❌ Recent Errors (SystemError DB, 30d TTL)</h2>
      <div class="filters">
        <select v-model="errFilter.app">
          <option value="">-- ทุก app --</option>
          <option v-for="a in apps" :key="a" :value="a">{{ a }}</option>
        </select>
        <input v-model="errFilter.endpoint" placeholder="filter endpoint (/api/ix/...)">
        <input v-model.number="errFilter.statusCode" type="number" placeholder="status">
        <button class="btn small" @click="loadErrors">Refresh</button>
      </div>

      <div v-if="errLoading" class="loading">Loading...</div>
      <div v-else-if="!errors.length" class="empty">ไม่มี error 🎉</div>
      <table v-else class="err-tbl">
        <thead><tr><th>Time</th><th>App</th><th>Status</th><th>Endpoint</th><th>Code</th><th>Message</th><th>User</th></tr></thead>
        <tbody>
          <tr v-for="e in errors" :key="e._id" @click="selectError(e)" :class="{ picked: selectedErr?._id === e._id }">
            <td class="mono">{{ shortTime(e.createdAt) }}</td>
            <td><span class="chip">{{ e.app }}</span></td>
            <td :class="'st-' + Math.floor(e.statusCode / 100)">{{ e.statusCode }}</td>
            <td class="mono">{{ e.method }} {{ shortEndpoint(e.endpoint) }}</td>
            <td class="mono">{{ e.errorCode }}</td>
            <td>{{ e.errorMessage?.slice(0, 60) }}</td>
            <td>{{ e.userEmail || e.userRole || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="selectedErr" class="err-detail">
        <h3>Error Detail</h3>
        <table class="kv">
          <tr><td>Request ID</td><td class="mono">{{ selectedErr.requestId }} <button class="btn small ghost" @click="traceReq(selectedErr.requestId)">Trace →</button></td></tr>
          <tr><td>JWT origin</td><td>{{ selectedErr.jwtIss }} → {{ selectedErr.jwtAud || '—' }} (src: {{ selectedErr.jwtSrc || '—' }})</td></tr>
          <tr><td>IP</td><td>{{ selectedErr.ip }}</td></tr>
          <tr><td>User Agent</td><td class="small">{{ selectedErr.userAgent?.slice(0, 100) }}</td></tr>
        </table>
        <details><summary>Stack trace</summary><pre>{{ selectedErr.errorStack }}</pre></details>
        <details><summary>Request body</summary><pre>{{ JSON.stringify(selectedErr.requestBody, null, 2) }}</pre></details>
      </div>
    </section>

    <!-- 3) App Health -->
    <section v-if="tab === 'health'" class="card">
      <h2>❤️ App Health — 15 apps</h2>
      <button class="btn small" @click="checkHealth">Refresh all</button>
      <table class="health-tbl">
        <thead><tr><th>App</th><th>Status</th><th>Latency</th><th>Uptime</th><th>RAM</th></tr></thead>
        <tbody>
          <tr v-for="h in healthList" :key="h.app" :class="'row-' + h.status">
            <td>{{ h.app }} <span class="host">{{ h.host }}</span></td>
            <td><span class="dot" :class="h.status"></span> {{ h.status }}</td>
            <td class="mono">{{ h.latencyMs !== null ? h.latencyMs + ' ms' : '—' }}</td>
            <td class="mono">{{ h.uptime ? formatDuration(h.uptime) : '—' }}</td>
            <td class="mono">{{ h.memMB ? h.memMB + ' MB' : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 4) Metrics -->
    <section v-if="tab === 'metrics'" class="card">
      <h2>📊 Endpoint Metrics ({{ APP_ID }})</h2>
      <p class="hint">ค่าจาก in-memory ring buffer 1000 requests ล่าสุด</p>
      <button class="btn small" @click="loadMetrics">Refresh</button>
      <div v-if="metrics">
        <p class="stat">Total: <b>{{ metrics.totalRequests }}</b> requests · Uptime: {{ formatDuration(metrics.uptime) }} · RAM: {{ metrics.memMB }} MB</p>
        <table class="metrics-tbl">
          <thead><tr><th>Endpoint</th><th>Count</th><th>Avg</th><th>Min</th><th>Max</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="m in metrics.endpoints" :key="m.endpoint">
              <td class="mono">{{ m.endpoint }}</td>
              <td>{{ m.count }}</td>
              <td class="mono">{{ m.avgMs }}ms</td>
              <td class="mono">{{ m.minMs }}ms</td>
              <td class="mono">{{ m.maxMs }}ms</td>
              <td>
                <span v-for="(cnt, code) in m.statusCodes" :key="code" :class="'chip st-' + Math.floor(code / 100)">{{ code }}: {{ cnt }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../../services/api'

const APPS = [
  { id: 'lms', host: 'medninja.academy' },
  { id: 'passport', host: 'passport.medninja.academy' },
  { id: 'ix', host: 'ix.medninja.academy' },
  { id: 'nlex', host: 'nlex.medninja.academy' },
  { id: 'meqex', host: 'meq.medninja.academy' },
  { id: 'ddx', host: 'ddx.medninja.academy' },
  { id: 'osce', host: 'osce.medninja.academy' },
  { id: 'synapse', host: 'synapse.medninja.academy' },
  { id: 'atlas', host: 'atlas.medninja.academy' },
  { id: 'longex', host: 'longex.medninja.academy' },
  { id: 'skill15', host: '15-skill.medninja.academy' },
  { id: 'infra', host: 'infra.medninja.academy' },
  { id: 'comm', host: 'comm.medninja.academy' },
  { id: 'ws', host: 'ws.medninja.academy' },
  { id: 'pdf', host: 'wm.medninja.academy' }
]

export default {
  name: 'InspectPage',
  data() {
    return {
      APP_ID: 'lms',
      tab: 'token',
      tabs: [
        { id: 'token', icon: '🎫', label: 'Token' },
        { id: 'errors', icon: '❌', label: 'Errors' },
        { id: 'health', icon: '❤️', label: 'Health' },
        { id: 'metrics', icon: '📊', label: 'Metrics' }
      ],
      apps: APPS.map(a => a.id),
      // Token
      tokenInput: '',
      tokenResult: null,
      // Errors
      errFilter: { app: '', endpoint: '', statusCode: null },
      errors: [],
      selectedErr: null,
      errLoading: false,
      // Health
      healthList: APPS.map(a => ({ ...a, app: a.id, status: 'unknown', latencyMs: null, uptime: null, memMB: null })),
      // Metrics
      metrics: null
    }
  },
  mounted() {
    if (this.tab === 'errors') this.loadErrors()
  },
  watch: {
    tab(v) {
      if (v === 'errors' && !this.errors.length) this.loadErrors()
      if (v === 'health') this.checkHealth()
      if (v === 'metrics') this.loadMetrics()
    }
  },
  methods: {
    async inspectToken() {
      try {
        const data = await api.post('/observability/inspect', { token: this.tokenInput.trim() })
        this.tokenResult = data
      } catch (err) {
        this.tokenResult = { ok: false, error: err.response?.data?.message || err.message }
      }
    },
    useMyToken() {
      this.tokenInput = localStorage.getItem('token') || ''
      if (this.tokenInput) this.inspectToken()
    },
    async loadErrors() {
      this.errLoading = true
      try {
        const params = {}
        if (this.errFilter.app) params.app = this.errFilter.app
        if (this.errFilter.endpoint) params.endpoint = this.errFilter.endpoint
        if (this.errFilter.statusCode) params.statusCode = this.errFilter.statusCode
        const data = await api.get('/observability/errors', { params })
        this.errors = data.errors || []
      } catch (err) {
        this.errors = []
        console.error(err)
      } finally { this.errLoading = false }
    },
    selectError(e) { this.selectedErr = this.selectedErr?._id === e._id ? null : e },
    async checkHealth() {
      for (const item of this.healthList) {
        item.status = 'checking'
        const start = Date.now()
        try {
          const url = `https://${item.host}/api/observability/health`
          const res = await fetch(url, { method: 'GET', cache: 'no-store' }).then(r => r.json()).catch(() => null)
          if (res && res.status === 'ok') {
            item.status = 'ok'
            item.latencyMs = Date.now() - start
            item.uptime = res.uptime
            item.memMB = res.memMB
          } else {
            item.status = 'fail'
            item.latencyMs = Date.now() - start
          }
        } catch {
          item.status = 'fail'
          item.latencyMs = null
        }
      }
    },
    async loadMetrics() {
      try {
        this.metrics = await api.get('/observability/metrics')
      } catch (err) { console.error(err) }
    },
    traceReq(rid) {
      this.errFilter.endpoint = ''
      this.errFilter.app = ''
      this.errFilter.statusCode = null
      // reload with requestId — API ยังไม่ support param นี้ ตอนนี้ show all
      alert('Request ID: ' + rid + '\n\n(future: query all apps by requestId)')
    },
    shortTime(iso) {
      const d = new Date(iso)
      return d.toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    },
    shortEndpoint(ep) { return (ep || '').slice(0, 50) },
    formatDuration(sec) {
      if (sec < 60) return `${sec}s`
      if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`
      if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor(sec / 60) % 60}m`
      return `${Math.floor(sec / 86400)}d ${Math.floor(sec / 3600) % 24}h`
    }
  }
}
</script>

<style scoped>
.inspect { max-width: 1200px; margin: 0 auto; padding: 24px; color: #e2e8f0; background: #0c111b; min-height: 100vh; font-family: 'Noto Sans Thai', sans-serif; }
.head h1 { font-size: 22px; margin-bottom: 4px; }
.sub { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
.tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #1e293b; }
.tabs button { padding: 10px 18px; background: transparent; border: none; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
.tabs button.active { color: #14b8a6; border-bottom-color: #14b8a6; }
.card { background: #131a24; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; }
.card h2 { font-size: 16px; margin-bottom: 6px; }
.hint { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
textarea { width: 100%; background: #0c111b; border: 1px solid #2a3441; color: #e2e8f0; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 11px; resize: vertical; }
.row { display: flex; gap: 8px; margin-top: 10px; }
.btn { padding: 8px 16px; background: #14b8a6; color: #0c111b; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.btn.ghost { background: transparent; border: 1px solid #2a3441; color: #e2e8f0; }
.btn.small { padding: 4px 12px; font-size: 11px; }
.result { margin-top: 16px; }
.ok-badge { background: #14532d; color: #86efac; padding: 6px 12px; border-radius: 6px; font-size: 12px; display: inline-block; margin-bottom: 12px; }
.err-badge { background: #7f1d1d; color: #fca5a5; padding: 6px 12px; border-radius: 6px; font-size: 12px; display: inline-block; margin-bottom: 12px; }
table.kv { width: 100%; font-size: 13px; }
table.kv td { padding: 6px 10px; border-bottom: 1px solid #1e293b; }
table.kv td:first-child { color: #94a3b8; width: 180px; }
table.kv tr.sep td { padding: 4px 0; border-bottom: none; }
.chip { display: inline-block; padding: 2px 8px; background: #1e293b; color: #94a3b8; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
.chip.red { background: #7f1d1d; color: #fca5a5; }
.mono { font-family: monospace; font-size: 11px; }
.raw { margin-top: 16px; }
.raw summary { cursor: pointer; color: #94a3b8; font-size: 12px; }
.raw pre { background: #0c111b; padding: 12px; border-radius: 6px; font-size: 10px; overflow: auto; margin-top: 8px; }
.filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.filters select, .filters input { padding: 6px 10px; background: #0c111b; border: 1px solid #2a3441; color: #e2e8f0; border-radius: 6px; font-size: 12px; }
.loading, .empty { text-align: center; padding: 40px; color: #94a3b8; }
.err-tbl, .health-tbl, .metrics-tbl { width: 100%; font-size: 12px; }
.err-tbl th, .health-tbl th, .metrics-tbl th { text-align: left; padding: 8px; background: #1a2230; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.err-tbl td, .health-tbl td, .metrics-tbl td { padding: 6px 8px; border-bottom: 1px solid #1e293b; }
.err-tbl tr { cursor: pointer; }
.err-tbl tr:hover { background: #1a2230; }
.err-tbl tr.picked { background: #164e63; }
.st-5 { color: #f87171; font-weight: 700; }
.st-4 { color: #fb923c; font-weight: 700; }
.st-3 { color: #a78bfa; }
.st-2 { color: #4ade80; }
.err-detail { margin-top: 20px; padding-top: 20px; border-top: 1px solid #1e293b; }
.err-detail h3 { font-size: 14px; margin-bottom: 12px; }
.err-detail details { margin-top: 12px; }
.err-detail details summary { cursor: pointer; color: #94a3b8; font-size: 12px; padding: 4px 0; }
.err-detail details pre { background: #0c111b; padding: 12px; border-radius: 6px; font-size: 10px; overflow: auto; margin-top: 8px; max-height: 300px; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
.dot.ok { background: #22c55e; }
.dot.fail { background: #ef4444; }
.dot.checking { background: #eab308; animation: pulse 1s infinite; }
.dot.unknown { background: #64748b; }
@keyframes pulse { 50% { opacity: 0.4; } }
.host { color: #64748b; font-size: 10px; }
.row-fail { background: rgba(239, 68, 68, 0.05); }
.stat { color: #94a3b8; font-size: 12px; margin: 10px 0; }
</style>
