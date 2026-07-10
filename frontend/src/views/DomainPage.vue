<template>
  <div class="domain-page">
    <div class="domain-container">
      <header class="domain-header">
        <h1>🛡️ Domain Lock Status</h1>
        <p class="subtitle">เช็ค 3 Layer defense ของ Domain lock (medninja.academy only)</p>
        <button class="refresh-btn" @click="fetchStatus" :disabled="loading">
          <span v-if="loading">⏳ กำลังโหลด...</span>
          <span v-else>🔄 Refresh</span>
        </button>
      </header>

      <!-- Summary -->
      <div v-if="data" class="summary-card">
        <div class="summary-row">
          <span class="summary-label">Verdict</span>
          <span class="summary-value">
            <span v-if="data.summary.allPassed" class="badge badge-ok">
              ✅ SECURE — ผ่านทุกชั้น
            </span>
            <span v-else class="badge badge-warn">
              ⚠️ WARN — บาง layer ไม่ผ่าน
              ({{ data.summary.passedCount }}/{{ data.summary.totalLayers }})
            </span>
          </span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Request Host</span>
          <span class="summary-value mono">{{ data.request.host || '—' }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Origin</span>
          <span class="summary-value mono">{{ data.request.origin || 'null' }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Referer</span>
          <span class="summary-value mono">{{ data.request.referer || 'null' }}</span>
        </div>
      </div>

      <!-- 3 Layers Grid -->
      <div v-if="data" class="layers-grid">
        <!-- Layer 1: CORS -->
        <div class="layer-card" :class="'layer-' + (data.layers.layer1.passed ? 'pass' : 'fail')">
          <div class="layer-header">
            <div class="layer-title">
              <span class="layer-icon">🌐</span>
              <span>Layer 1 — {{ data.layers.layer1.name }}</span>
            </div>
            <span :class="'status-badge status-' + (data.layers.layer1.passed ? 'pass' : 'fail')">
              {{ data.layers.layer1.passed ? '✅ PASS' : '❌ FAIL' }}
            </span>
          </div>
          <div class="layer-body">
            <div class="layer-row">
              <span class="row-label">Location</span>
              <span class="row-value mono">{{ data.layers.layer1.location }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Check</span>
              <span class="row-value">{{ data.layers.layer1.check }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Input</span>
              <span class="row-value mono">{{ data.layers.layer1.input || 'null' }}</span>
            </div>
            <div v-if="data.layers.layer1.hostname" class="layer-row">
              <span class="row-label">Hostname</span>
              <span class="row-value mono">{{ data.layers.layer1.hostname }}</span>
            </div>
            <div class="layer-notes">{{ data.layers.layer1.notes }}</div>
          </div>
        </div>

        <!-- Layer 2: Referer -->
        <div class="layer-card" :class="'layer-' + (data.layers.layer2.passed ? 'pass' : 'fail')">
          <div class="layer-header">
            <div class="layer-title">
              <span class="layer-icon">🔗</span>
              <span>Layer 2 — {{ data.layers.layer2.name }}</span>
            </div>
            <span :class="'status-badge status-' + (data.layers.layer2.passed ? 'pass' : 'fail')">
              {{ data.layers.layer2.passed ? '✅ PASS' : '❌ FAIL' }}
            </span>
          </div>
          <div class="layer-body">
            <div class="layer-row">
              <span class="row-label">Location</span>
              <span class="row-value mono">{{ data.layers.layer2.location }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Check</span>
              <span class="row-value">{{ data.layers.layer2.check }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Input</span>
              <span class="row-value mono">{{ data.layers.layer2.input || 'null' }}</span>
            </div>
            <div v-if="data.layers.layer2.hostname" class="layer-row">
              <span class="row-label">Hostname</span>
              <span class="row-value mono">{{ data.layers.layer2.hostname }}</span>
            </div>
            <div class="layer-notes">{{ data.layers.layer2.notes }}</div>
          </div>
        </div>

        <!-- Layer 3: CSP -->
        <div class="layer-card" :class="'layer-' + (data.layers.layer3.passed ? 'pass' : 'fail')">
          <div class="layer-header">
            <div class="layer-title">
              <span class="layer-icon">🖼️</span>
              <span>Layer 3 — {{ data.layers.layer3.name }}</span>
            </div>
            <span :class="'status-badge status-' + (data.layers.layer3.passed ? 'pass' : 'fail')">
              {{ data.layers.layer3.passed ? '✅ PASS' : '❌ FAIL' }}
            </span>
          </div>
          <div class="layer-body">
            <div class="layer-row">
              <span class="row-label">Location</span>
              <span class="row-value mono">{{ data.layers.layer3.location }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Check</span>
              <span class="row-value">{{ data.layers.layer3.check }}</span>
            </div>
            <div class="layer-row">
              <span class="row-label">Status</span>
              <span class="row-value">{{ data.layers.layer3.input }}</span>
            </div>
            <div class="layer-notes">{{ data.layers.layer3.notes }}</div>
          </div>
        </div>
      </div>

      <!-- Whitelist -->
      <details v-if="data" class="whitelist">
        <summary>📋 Allowed Domains ({{ data.allowedDomains.length }})</summary>
        <div class="whitelist-grid">
          <div v-for="d in data.allowedDomains" :key="d" class="whitelist-item mono">
            ✓ {{ d }}
          </div>
        </div>
      </details>

      <!-- Debug -->
      <details v-if="data" class="debug">
        <summary>🔧 Full Response (Debug)</summary>
        <pre class="debug-json">{{ JSON.stringify(data, null, 2) }}</pre>
      </details>

      <!-- Error -->
      <div v-if="error" class="error-card">
        <strong>❌ Error:</strong> {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'DomainPage',
  data () {
    return {
      loading: false,
      error: null,
      data: null
    }
  },
  mounted () {
    this.fetchStatus()
  },
  methods: {
    async fetchStatus () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/domain/status')
        this.data = res
      } catch (e) {
        this.error = e.message || 'Failed to fetch domain status'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.domain-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  padding: 24px 16px;
}
.domain-container {
  max-width: 1200px;
  margin: 0 auto;
}
.domain-header {
  text-align: center;
  margin-bottom: 32px;
}
.domain-header h1 {
  font-size: 28px;
  color: #1e3a8a;
  margin: 0 0 8px;
}
.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 16px;
}
.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: all 0.2s;
}
.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;
}
.summary-row:last-child {
  border-bottom: none;
}
.summary-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.summary-value {
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}
.mono {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 13px;
}
.badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.badge-ok { background: #dcfce7; color: #166534; }
.badge-warn { background: #fef3c7; color: #92400e; }

.layers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
.layer-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}
.layer-pass { border-color: #86efac; }
.layer-fail { border-color: #fca5a5; }

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.layer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}
.layer-icon {
  font-size: 20px;
}
.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}
.status-pass { background: #dcfce7; color: #166534; }
.status-fail { background: #fee2e2; color: #991b1b; }

.layer-body {
  padding: 16px 20px;
}
.layer-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
}
.layer-row:last-of-type {
  border-bottom: none;
}
.row-label {
  color: #64748b;
  font-size: 13px;
  flex-shrink: 0;
}
.row-value {
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}
.layer-notes {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.whitelist,
.debug {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.whitelist summary,
.debug summary {
  cursor: pointer;
  font-weight: 600;
  color: #475569;
  padding: 4px 0;
}
.whitelist-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
}
.whitelist-item {
  padding: 8px 12px;
  background: #f0fdf4;
  color: #166534;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  font-size: 12px;
}
.debug-json {
  margin-top: 12px;
  padding: 16px;
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 8px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
}

.error-card {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}
</style>
