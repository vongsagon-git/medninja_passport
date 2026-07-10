<template>
  <div class="jwt-page">
    <div class="jwt-container">
      <header class="jwt-header">
        <h1>🔐 JWT Debug</h1>
        <p class="subtitle">เช็คว่า backend รู้อะไรจาก JWT token ของคุณ</p>
        <button class="refresh-btn" @click="fetchStatus" :disabled="loading">
          <span v-if="loading">⏳ กำลังโหลด...</span>
          <span v-else>🔄 Refresh</span>
        </button>
      </header>

      <!-- Summary -->
      <div v-if="data" class="summary-card">
        <div class="summary-row">
          <span class="summary-label">Status</span>
          <span class="summary-value">
            <span v-if="data.summary.canAccess" class="badge badge-ok">
              ✅ AUTHENTICATED — เข้าถึง API ได้
            </span>
            <span v-else class="badge badge-fail">
              ❌ NOT AUTHENTICATED — {{ data.summary.reason }}
            </span>
          </span>
        </div>
        <div class="summary-row" v-if="data.authenticated">
          <span class="summary-label">Auth Header</span>
          <span class="summary-value mono">{{ data.authHeaderFormat }}</span>
        </div>
        <div class="summary-row" v-if="data.token">
          <span class="summary-label">Token</span>
          <span class="summary-value mono">{{ data.token.preview }} ({{ data.token.length }} chars)</span>
        </div>
      </div>

      <!-- If not authenticated -->
      <div v-if="data && !data.authenticated" class="not-auth-card">
        <h3>🔒 ยังไม่ได้ Login</h3>
        <p>ไม่มี Authorization header ใน request</p>
        <p class="hint">💡 ลอง login ที่ <code>/login</code> แล้วกลับมาดูหน้านี้อีกครั้ง</p>
      </div>

      <!-- Payload + Expiry + Validation -->
      <div v-if="data && data.decoded" class="jwt-grid">

        <!-- Payload -->
        <div class="jwt-card">
          <div class="card-header">
            <span class="card-icon">📦</span>
            <span>Decoded Payload</span>
          </div>
          <div class="card-body">
            <div v-if="data.decoded.payload.id" class="jwt-row">
              <span class="row-label">User ID</span>
              <span class="row-value mono">{{ data.decoded.payload.id }}</span>
            </div>
            <div v-if="data.decoded.payload.email" class="jwt-row">
              <span class="row-label">Email</span>
              <span class="row-value">{{ data.decoded.payload.email }}</span>
            </div>
            <div v-if="data.decoded.payload.role" class="jwt-row">
              <span class="row-label">Role</span>
              <span class="row-value">
                <span :class="'role-badge role-' + data.decoded.payload.role">
                  {{ data.decoded.payload.role }}
                </span>
              </span>
            </div>
            <div v-if="data.decoded.payload.sid" class="jwt-row">
              <span class="row-label">Session ID</span>
              <span class="row-value mono">{{ data.decoded.payload.sid }}</span>
            </div>
            <details class="raw-payload">
              <summary>🔧 Raw Payload</summary>
              <pre>{{ JSON.stringify(data.decoded.payload, null, 2) }}</pre>
            </details>
          </div>
        </div>

        <!-- Expiry -->
        <div class="jwt-card" :class="'card-' + (data.expiry.isExpired ? 'fail' : 'ok')">
          <div class="card-header">
            <span class="card-icon">⏱️</span>
            <span>Expiry</span>
          </div>
          <div class="card-body">
            <div class="jwt-row">
              <span class="row-label">Status</span>
              <span class="row-value">
                <strong :class="data.expiry.isExpired ? 'text-fail' : 'text-ok'">
                  {{ data.expiry.humanReadable }}
                </strong>
              </span>
            </div>
            <div v-if="data.expiry.iatDate" class="jwt-row">
              <span class="row-label">Issued At</span>
              <span class="row-value mono">{{ formatDate(data.expiry.iatDate) }}</span>
            </div>
            <div v-if="data.expiry.expDate" class="jwt-row">
              <span class="row-label">Expires At</span>
              <span class="row-value mono">{{ formatDate(data.expiry.expDate) }}</span>
            </div>
            <div v-if="data.expiry.secondsSinceIssued" class="jwt-row">
              <span class="row-label">Age</span>
              <span class="row-value">{{ formatDuration(data.expiry.secondsSinceIssued) }}</span>
            </div>
          </div>
        </div>

        <!-- Signature -->
        <div class="jwt-card" :class="'card-' + (data.validation.signature.valid ? 'ok' : 'fail')">
          <div class="card-header">
            <span class="card-icon">🔏</span>
            <span>Signature Verification</span>
          </div>
          <div class="card-body">
            <div class="jwt-row">
              <span class="row-label">Valid</span>
              <span class="row-value">
                <strong :class="data.validation.signature.valid ? 'text-ok' : 'text-fail'">
                  {{ data.validation.signature.valid ? '✅ Verified' : '❌ Invalid' }}
                </strong>
              </span>
            </div>
            <div class="jwt-row">
              <span class="row-label">Signature</span>
              <span class="row-value mono">{{ data.decoded.signaturePreview }}</span>
            </div>
            <div class="jwt-row">
              <span class="row-label">Length</span>
              <span class="row-value">{{ data.decoded.signatureLength }} chars</span>
            </div>
            <div class="card-notes">{{ data.validation.signature.notes }}</div>
          </div>
        </div>

        <!-- User Check -->
        <div class="jwt-card" :class="'card-' + (data.validation.user.found ? (data.validation.user.banned ? 'fail' : 'ok') : 'fail')">
          <div class="card-header">
            <span class="card-icon">👤</span>
            <span>User Lookup</span>
          </div>
          <div class="card-body">
            <div class="jwt-row">
              <span class="row-label">Found in DB</span>
              <span class="row-value">
                <strong :class="data.validation.user.found ? 'text-ok' : 'text-fail'">
                  {{ data.validation.user.found ? '✅ Yes' : '❌ No' }}
                </strong>
              </span>
            </div>
            <div v-if="data.validation.user.email" class="jwt-row">
              <span class="row-label">Email</span>
              <span class="row-value">{{ data.validation.user.email }}</span>
            </div>
            <div v-if="data.validation.user.name" class="jwt-row">
              <span class="row-label">Name</span>
              <span class="row-value">{{ data.validation.user.name }}</span>
            </div>
            <div v-if="data.validation.user.role" class="jwt-row">
              <span class="row-label">Role</span>
              <span class="row-value">
                <span :class="'role-badge role-' + data.validation.user.role">
                  {{ data.validation.user.role }}
                </span>
              </span>
            </div>
            <div v-if="data.validation.user.lineUserId" class="jwt-row">
              <span class="row-label">LINE User ID</span>
              <span class="row-value mono">{{ data.validation.user.lineUserId.substring(0, 12) }}...</span>
            </div>
            <div v-if="data.validation.user.banned !== null" class="jwt-row">
              <span class="row-label">Banned</span>
              <span class="row-value">
                <strong :class="data.validation.user.banned ? 'text-fail' : 'text-ok'">
                  {{ data.validation.user.banned ? '❌ BANNED' : '✅ Not banned' }}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Session -->
        <div class="jwt-card" :class="'card-' + (data.validation.session.valid === false ? 'fail' : data.validation.session.valid === true ? 'ok' : 'neutral')">
          <div class="card-header">
            <span class="card-icon">🔗</span>
            <span>Session (Valkey)</span>
          </div>
          <div class="card-body">
            <div class="jwt-row">
              <span class="row-label">Valid</span>
              <span class="row-value">
                <strong v-if="data.validation.session.valid === true" class="text-ok">✅ Active</strong>
                <strong v-else-if="data.validation.session.valid === false" class="text-fail">❌ Kicked / Expired</strong>
                <strong v-else class="text-neutral">— N/A</strong>
              </span>
            </div>
            <div v-if="data.validation.session.sid" class="jwt-row">
              <span class="row-label">Session ID</span>
              <span class="row-value mono">{{ data.validation.session.sid }}</span>
            </div>
            <div class="card-notes">{{ data.validation.session.notes }}</div>
          </div>
        </div>

        <!-- Header -->
        <div class="jwt-card">
          <div class="card-header">
            <span class="card-icon">📄</span>
            <span>JWT Header</span>
          </div>
          <div class="card-body">
            <div v-if="data.decoded.header.alg" class="jwt-row">
              <span class="row-label">Algorithm</span>
              <span class="row-value mono">{{ data.decoded.header.alg }}</span>
            </div>
            <div v-if="data.decoded.header.typ" class="jwt-row">
              <span class="row-label">Type</span>
              <span class="row-value mono">{{ data.decoded.header.typ }}</span>
            </div>
          </div>
        </div>
      </div>

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
  name: 'JwtPage',
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
        const res = await api.get('/jwt/status')
        this.data = res
      } catch (e) {
        this.error = e.message || 'Failed to fetch JWT status'
      } finally {
        this.loading = false
      }
    },
    formatDate (isoStr) {
      if (!isoStr) return '—'
      const d = new Date(isoStr)
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    formatDuration (seconds) {
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
      return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
    }
  }
}
</script>

<style scoped>
.jwt-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%);
  padding: 24px 16px;
}
.jwt-container {
  max-width: 1200px;
  margin: 0 auto;
}
.jwt-header {
  text-align: center;
  margin-bottom: 32px;
}
.jwt-header h1 {
  font-size: 28px;
  color: #6d28d9;
  margin: 0 0 8px;
}
.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 16px;
}
.refresh-btn {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  transition: all 0.2s;
}
.refresh-btn:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
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
}
.mono {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 13px;
  word-break: break-all;
}
.badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.badge-ok { background: #dcfce7; color: #166534; }
.badge-fail { background: #fee2e2; color: #991b1b; }

.not-auth-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  border: 2px dashed #cbd5e1;
  color: #64748b;
}
.not-auth-card h3 {
  color: #475569;
  margin: 0 0 8px;
}
.not-auth-card .hint {
  margin-top: 16px;
  font-size: 13px;
  color: #94a3b8;
}
.not-auth-card code {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', Consolas, monospace;
  color: #6d28d9;
}

.jwt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
.jwt-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}
.card-ok { border-color: #86efac; }
.card-fail { border-color: #fca5a5; }
.card-neutral { border-color: #e2e8f0; }

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #faf5ff;
  border-bottom: 1px solid #e9d5ff;
  font-size: 15px;
  font-weight: 700;
  color: #6d28d9;
}
.card-icon {
  font-size: 20px;
}
.card-body {
  padding: 16px 20px;
}
.jwt-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
}
.jwt-row:last-of-type {
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
.card-notes {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}
.text-ok { color: #166534; }
.text-fail { color: #991b1b; }
.text-neutral { color: #64748b; }

.role-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.role-admin { background: #fef3c7; color: #92400e; }
.role-user { background: #dbeafe; color: #1e40af; }

.raw-payload {
  margin-top: 12px;
}
.raw-payload summary {
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  padding: 4px 0;
}
.raw-payload pre {
  margin-top: 8px;
  padding: 12px;
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 6px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  overflow-x: auto;
}

.debug {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.debug summary {
  cursor: pointer;
  font-weight: 600;
  color: #475569;
  padding: 4px 0;
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
