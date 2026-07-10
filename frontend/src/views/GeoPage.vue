<template>
  <div class="geo-page">
    <div class="geo-container">
      <header class="geo-header">
        <h1>🌍 Geo Detection Debug</h1>
        <p class="subtitle">เปรียบเทียบผลจาก 3 แหล่งแบบเรียลไทม์</p>
        <button class="refresh-btn" @click="fetchAll" :disabled="loading">
          <span v-if="loading">⏳ กำลังโหลด...</span>
          <span v-else>🔄 Refresh</span>
        </button>
      </header>

      <!-- Summary -->
      <div v-if="data" class="summary-card">
        <div class="summary-row">
          <span class="summary-label">Your IP</span>
          <span class="summary-value mono">{{ data.ip || 'unknown' }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Winner (ใช้จริง)</span>
          <span class="summary-value">
            <strong :class="'winner-' + data.winner">{{ data.winner }}</strong>
            → {{ flag(data.winnerCountry) }} {{ data.winnerCountry || '—' }}
          </span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Consensus</span>
          <span class="summary-value">
            <span v-if="data.consensus === 'agree'" class="badge badge-ok">
              ✅ ทั้ง 2 แหล่งเห็นตรง
            </span>
            <span v-else-if="data.consensus === 'partial-agree'" class="badge badge-partial">
              ⚠️ เห็นตรงเฉพาะแหล่งที่มีข้อมูล
              ({{ data.consensusDetail.availableSources }}/{{ data.consensusDetail.totalSources }} แหล่ง)
            </span>
            <span v-else-if="data.consensus === 'disagree'" class="badge badge-warn">
              ❌ ไม่ตรงกัน
            </span>
            <span v-else class="badge badge-none">— ไม่มีข้อมูลเลย</span>
          </span>
        </div>
        <div v-if="data.consensus === 'partial-agree'" class="consensus-note">
          <strong>💡 หมายเหตุ:</strong>
          {{ data.consensusDetail.unavailableSources }} แหล่งไม่มีข้อมูล
          (IP ไม่อยู่ใน offline DB หรือ ipinfo API fail)
          → ใช้แหล่งอื่นแทนได้ตามปกติ
        </div>
      </div>

      <!-- 2 Sources Grid -->
      <div v-if="data" class="sources-grid">
        <!-- Source 1: ipinfo -->
        <div class="source-card" :class="'source-' + statusOf(data.sources.ipinfo)">
          <div class="source-header">
            <div class="source-title">
              <span class="source-icon">🌐</span>
              <span>ipinfo.io</span>
            </div>
            <span class="source-priority">Priority 1</span>
          </div>
          <div class="source-body">
            <div class="source-row">
              <span class="row-label">Available</span>
              <span class="row-value">{{ data.sources.ipinfo.available ? '✅ Yes' : '❌ No' }}</span>
            </div>
            <div class="source-row">
              <span class="row-label">Country</span>
              <span class="row-value big">
                {{ flag(data.sources.ipinfo.country) }}
                <strong>{{ data.sources.ipinfo.country || '—' }}</strong>
              </span>
            </div>
            <div v-if="data.sources.ipinfo.countryName" class="source-row">
              <span class="row-label">Name</span>
              <span class="row-value">{{ data.sources.ipinfo.countryName }}</span>
            </div>
            <div v-if="data.sources.ipinfo.asn" class="source-row">
              <span class="row-label">ASN</span>
              <span class="row-value mono">{{ data.sources.ipinfo.asn }}</span>
            </div>
            <div v-if="data.sources.ipinfo.isp" class="source-row">
              <span class="row-label">ISP</span>
              <span class="row-value">{{ data.sources.ipinfo.isp }}</span>
            </div>
            <div v-if="data.sources.ipinfo.continent" class="source-row">
              <span class="row-label">Continent</span>
              <span class="row-value">{{ data.sources.ipinfo.continent }}</span>
            </div>
            <div class="source-row">
              <span class="row-label">Latency</span>
              <span class="row-value">{{ data.sources.ipinfo.latencyMs }}ms</span>
            </div>
            <div class="source-row">
              <span class="row-label">Cost</span>
              <span class="row-value">{{ data.sources.ipinfo.cost }}</span>
            </div>
            <div class="source-notes">{{ data.sources.ipinfo.notes }}</div>
          </div>
        </div>

        <!-- Source 2: geoip-lite -->
        <div class="source-card" :class="'source-' + statusOf(data.sources.geoipLite)">
          <div class="source-header">
            <div class="source-title">
              <span class="source-icon">💾</span>
              <span>geoip-lite</span>
            </div>
            <span class="source-priority">Priority 2</span>
          </div>
          <div class="source-body">
            <div class="source-row">
              <span class="row-label">Available</span>
              <span class="row-value">{{ data.sources.geoipLite.available ? '✅ Yes' : '❌ No' }}</span>
            </div>
            <div class="source-row">
              <span class="row-label">Country</span>
              <span class="row-value big">
                {{ flag(data.sources.geoipLite.country) }}
                <strong>{{ data.sources.geoipLite.country || '—' }}</strong>
              </span>
            </div>
            <div v-if="data.sources.geoipLite.region" class="source-row">
              <span class="row-label">Region</span>
              <span class="row-value">{{ data.sources.geoipLite.region }}</span>
            </div>
            <div v-if="data.sources.geoipLite.city" class="source-row">
              <span class="row-label">City</span>
              <span class="row-value">{{ data.sources.geoipLite.city }}</span>
            </div>
            <div class="source-row">
              <span class="row-label">Latency</span>
              <span class="row-value">{{ data.sources.geoipLite.latencyMs }}ms</span>
            </div>
            <div class="source-row">
              <span class="row-label">Cost</span>
              <span class="row-value">{{ data.sources.geoipLite.cost }}</span>
            </div>
            <div class="source-notes">{{ data.sources.geoipLite.notes }}</div>
          </div>
        </div>
      </div>

      <!-- Debug -->
      <details v-if="data" class="debug">
        <summary>🔧 Request Headers (Debug)</summary>
        <div class="debug-grid">
          <div class="debug-row" v-for="(v, k) in data.debug" :key="k">
            <span class="debug-key">{{ k }}</span>
            <span class="debug-val mono">{{ v === null ? 'null' : v }}</span>
          </div>
        </div>
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

const FLAGS = {
  TH: '🇹🇭', CN: '🇨🇳', US: '🇺🇸', HK: '🇭🇰', TW: '🇹🇼', SG: '🇸🇬',
  JP: '🇯🇵', KR: '🇰🇷', VN: '🇻🇳', MY: '🇲🇾', ID: '🇮🇩', PH: '🇵🇭',
  IN: '🇮🇳', AU: '🇦🇺', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', CA: '🇨🇦'
}

export default {
  name: 'GeoPage',
  data () {
    return {
      loading: false,
      error: null,
      data: null
    }
  },
  mounted () {
    this.fetchAll()
  },
  methods: {
    async fetchAll () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/geo/all-sources')
        this.data = res
      } catch (e) {
        this.error = e.message || 'Failed to fetch geo data'
      } finally {
        this.loading = false
      }
    },
    flag (country) {
      return FLAGS[country] || (country ? '🏳️' : '')
    },
    statusOf (source) {
      if (source.available && source.country) return 'ok'
      if (!source.available) return 'unavailable'
      return 'partial'
    }
  }
}
</script>

<style scoped>
.geo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  padding: 24px 16px;
}
.geo-container {
  max-width: 1200px;
  margin: 0 auto;
}
.geo-header {
  text-align: center;
  margin-bottom: 32px;
}
.geo-header h1 {
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
}
.summary-row:last-child {
  border-bottom: none;
}
.summary-label {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}
.summary-value {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}
.mono {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 13px;
}
.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.badge-ok { background: #dcfce7; color: #166534; }
.badge-partial { background: #dbeafe; color: #1e40af; }
.badge-warn { background: #fee2e2; color: #991b1b; }
.badge-none { background: #f1f5f9; color: #64748b; }
.consensus-note {
  margin-top: 12px;
  padding: 12px 16px;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.6;
}
.winner-ipinfo { color: #8b5cf6; }
.winner-geoip-lite { color: #64748b; }

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}
.source-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}
.source-ok { border-color: #86efac; }
.source-unavailable { border-color: #fecaca; opacity: 0.85; }
.source-partial { border-color: #fed7aa; }

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.source-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.source-icon {
  font-size: 20px;
}
.source-priority {
  font-size: 12px;
  color: #64748b;
  background: white;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}
.source-body {
  padding: 16px 20px;
}
.source-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}
.source-row:last-of-type {
  border-bottom: none;
}
.row-label {
  color: #64748b;
  font-size: 13px;
}
.row-value {
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
}
.row-value.big {
  font-size: 18px;
}
.source-notes {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
  color: #475569;
}

.debug {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}
.debug summary {
  cursor: pointer;
  font-weight: 600;
  color: #475569;
  padding: 4px 0;
}
.debug-grid {
  margin-top: 12px;
  display: grid;
  gap: 6px;
}
.debug-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}
.debug-key {
  color: #64748b;
  font-weight: 500;
}
.debug-val {
  color: #0f172a;
  text-align: right;
  word-break: break-all;
  max-width: 60%;
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
