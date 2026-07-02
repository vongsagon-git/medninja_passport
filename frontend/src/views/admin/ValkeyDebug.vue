<template>
  <div class="admin-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h1 style="font-size:22px;font-weight:800;color:var(--primary);margin:0;">Valkey Debug</h1>
        <p style="color:#64748b;font-size:13px;margin-top:4px;">ดูข้อมูลใน Valkey (read-only)</p>
      </div>
      <button class="btn btn-outline" @click="load" :disabled="loading">{{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}</button>
    </div>

    <div v-if="status" style="margin-bottom:12px;font-size:13px;">
      สถานะ: <strong :style="{ color: status === 'connected' ? '#10b981' : '#ef4444' }">{{ status }}</strong>
      <span v-if="error" style="color:#ef4444;margin-left:8px;">{{ error }}</span>
      <span v-if="total" style="margin-left:12px;color:#64748b;">ทั้งหมด {{ total }} keys</span>
    </div>

    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 10px;text-align:left;font-weight:700;color:#475569;">Key</th>
            <th style="padding:8px 10px;text-align:left;font-weight:700;color:#475569;width:60px;">Type</th>
            <th style="padding:8px 10px;text-align:left;font-weight:700;color:#475569;width:60px;">TTL</th>
            <th style="padding:8px 10px;text-align:left;font-weight:700;color:#475569;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in keys" :key="item.key" style="border-top:1px solid #f1f5f9;">
            <td style="padding:6px 10px;font-family:monospace;font-weight:600;color:var(--primary);">{{ item.key }}</td>
            <td style="padding:6px 10px;color:#64748b;">{{ item.type }}</td>
            <td style="padding:6px 10px;color:#64748b;">{{ item.ttl === -1 ? '∞' : item.ttl + 's' }}</td>
            <td style="padding:6px 10px;font-family:monospace;font-size:11px;color:#475569;max-width:500px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ formatValue(item.value) }}</td>
          </tr>
          <tr v-if="!keys.length">
            <td colspan="4" style="padding:30px;text-align:center;color:#94a3b8;">{{ loading ? 'กำลังโหลด...' : 'ไม่มีข้อมูล' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'
export default {
  name: 'ValkeyDebug',
  data() { return { status: '', error: '', total: 0, keys: [], loading: false } },
  async mounted() { await this.load() },
  methods: {
    async load() {
      this.loading = true
      try {
        const d = await api.get('/admin/valkey-debug')
        this.status = d.status
        this.error = d.error || ''
        this.total = d.total || 0
        this.keys = d.keys || []
      } catch (e) {
        this.status = 'error'
        this.error = e.message
      }
      this.loading = false
    },
    formatValue(v) {
      if (v === null || v === undefined) return '-'
      if (typeof v === 'string') {
        try { return JSON.stringify(JSON.parse(v)) } catch { return v }
      }
      return JSON.stringify(v)
    }
  }
}
</script>
