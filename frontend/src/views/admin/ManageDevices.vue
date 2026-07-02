<template>
  <div class="manage-devices">
    <h1>Device Logs</h1>
    <p class="subtitle">จำนวนอุปกรณ์ต่อ user — sort จากมากไปน้อย</p>

    <div v-if="loading" class="loading">กำลังโหลด...</div>

    <div v-else>
      <div class="summary">
        <span>ทั้งหมด {{ data.length }} users</span>
        <span class="sep">|</span>
        <span class="warn">มากกว่า 2 เครื่อง: {{ suspiciousCount }} คน</span>
      </div>

      <div v-for="item in data" :key="item.userId" class="user-card" :class="{ suspicious: item.deviceCount > 2 }">
        <div class="user-header" @click="item._expanded = !item._expanded">
          <div class="user-info">
            <span class="user-name">{{ item.user?.name || item.user?.firstName || 'N/A' }}</span>
            <span class="user-email">{{ item.user?.email || '' }}</span>
            <span class="user-uni">{{ item.user?.university || '' }}</span>
          </div>
          <div class="device-badge" :class="{ red: item.deviceCount > 2, yellow: item.deviceCount === 2 }">
            {{ item.deviceCount }} เครื่อง
          </div>
        </div>

        <div v-if="item._expanded" class="device-list">
          <div v-for="(d, i) in item.devices" :key="i" class="device-card">
            <div class="device-card-header">
              <span class="device-os">{{ d.os || '?' }} · {{ d.browser || '?' }}</span>
              <span class="device-hb">HB: {{ d.heartbeatCount }}</span>
            </div>

            <div class="device-card-body">
              <div class="info-row">
                <span class="info-label">HW-Only Hash</span>
                <span class="info-value hash purple">{{ d.hwOnlyHash || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">HW Hash</span>
                <span class="info-value hash green">{{ d.hwHash || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">GPU</span>
                <span class="info-value" :title="d.gpu">{{ shortGpu(d.gpu) }}</span>
              </div>
              <div class="info-grid">
                <div class="info-cell">
                  <span class="info-label">Screen</span>
                  <span class="info-value">{{ d.screen || '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Cores</span>
                  <span class="info-value">{{ d.cores || '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">RAM</span>
                  <span class="info-value">{{ d.memory ? d.memory + ' GB' : '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Touch</span>
                  <span class="info-value">{{ d.touchPoints }}</span>
                </div>
              </div>
              <div class="info-grid">
                <div class="info-cell">
                  <span class="info-label">Timezone</span>
                  <span class="info-value">{{ d.timezone || '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Language</span>
                  <span class="info-value">{{ d.language || '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Architecture</span>
                  <span class="info-value">{{ d.architecture || '-' }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Platform</span>
                  <span class="info-value">{{ d.platform || '-' }}</span>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">IP</span>
                <span class="info-value">{{ d.ip || '-' }}</span>
              </div>
              <div class="info-grid">
                <div class="info-cell">
                  <span class="info-label">First Seen</span>
                  <span class="info-value">{{ formatDate(d.firstSeenAt) }}</span>
                </div>
                <div class="info-cell">
                  <span class="info-label">Last Seen</span>
                  <span class="info-value">{{ formatDate(d.lastSeenAt) }}</span>
                </div>
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
  name: 'ManageDevices',
  data() {
    return {
      loading: true,
      data: []
    }
  },
  computed: {
    suspiciousCount() {
      return this.data.filter(d => d.deviceCount > 2).length
    }
  },
  async mounted() {
    try {
      const res = await api.get('/admin/devices')
      this.data = (res || []).map(item => ({ ...item, _expanded: false }))
    } catch (err) {
      console.error('Device logs error:', err)
    }
    this.loading = false
  },
  methods: {
    shortGpu(gpu) {
      if (!gpu) return '-'
      // "ANGLE (AMD, AMD Radeon RX 6600 (0x...)...)" → "AMD Radeon RX 6600"
      const m = gpu.match(/(AMD|NVIDIA|Intel|Apple)\s+[^(]+/)
      if (m) return m[0].trim().replace(/\s+Direct.*/, '')
      return gpu.length > 40 ? gpu.substring(0, 40) + '...' : gpu
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.manage-devices {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
h1 { margin: 0 0 4px; font-size: 1.5rem; }
.subtitle { color: #64748b; margin: 0 0 20px; }
.loading { text-align: center; padding: 40px; color: #94a3b8; }
.summary { margin-bottom: 16px; font-size: 0.875rem; color: #64748b; }
.sep { margin: 0 8px; }
.warn { color: #ef4444; font-weight: 600; }

.user-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
}
.user-card.suspicious { border-color: #fca5a5; background: #fef2f2; }
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
}
.user-header:hover { background: #f8fafc; }
.user-name { font-weight: 600; margin-right: 12px; }
.user-email { color: #64748b; font-size: 0.8rem; margin-right: 12px; }
.user-uni { color: #94a3b8; font-size: 0.75rem; }
.device-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
  white-space: nowrap;
}
.device-badge.yellow { background: #fef3c7; color: #92400e; }
.device-badge.red { background: #fee2e2; color: #dc2626; }

.device-list { padding: 0 18px 18px; display: flex; flex-direction: column; gap: 12px; }

.device-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #0f172a;
  color: #fff;
  font-size: 0.85rem;
}
.device-os { font-weight: 600; }
.device-hb { color: #94a3b8; font-size: 0.75rem; }

.device-card-body { padding: 12px 14px; }

.info-row {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  color: #94a3b8;
  font-size: 0.7rem;
  width: 90px;
  flex-shrink: 0;
  padding-top: 2px;
}
.info-value {
  color: #1e293b;
  font-size: 0.8rem;
  word-break: break-all;
  font-family: 'Courier New', monospace;
}
.hash { font-size: 0.65rem; }
.hash.purple { color: #7c3aed; }
.hash.green { color: #16a34a; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}
.info-cell { display: flex; flex-direction: column; }
.info-cell .info-label { width: auto; margin-bottom: 2px; }
.info-cell .info-value { font-size: 0.75rem; }
</style>
