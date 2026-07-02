<template>
  <div class="sca">
    <div class="header">
      <router-link to="/admin" class="back">← กลับ Admin</router-link>
      <h1>📊 Self Check Analytic</h1>
      <router-link to="/admin/self-checks" class="btn btn-ghost">⚙ จัดการ Templates</router-link>
    </div>

    <!-- Filter -->
    <div class="filter-card">
      <label class="field">
        <span>Template</span>
        <select v-model="selectedSlug" @change="load">
          <option value="">-- เลือก template --</option>
          <option v-for="t in templates" :key="t.slug" :value="t.slug">
            {{ t.icon }} {{ t.name }} ({{ t.userCount }} users)
          </option>
        </select>
      </label>
    </div>

    <div v-if="!selectedSlug" class="empty">เลือก template เพื่อดู analytics</div>
    <div v-else-if="loading" class="empty">กำลังโหลด...</div>

    <template v-else-if="data">
      <!-- Summary -->
      <div class="summary-grid">
        <div class="sum-card">
          <div class="sum-label">นักเรียนทั้งหมด</div>
          <div class="sum-value">{{ data.summary.userCount }}</div>
        </div>
        <div class="sum-card">
          <div class="sum-label">เฉลี่ยความพร้อม</div>
          <div class="sum-value">{{ data.summary.avgPercent }}%</div>
        </div>
        <div class="sum-card">
          <div class="sum-label">ครบ 100% แล้ว</div>
          <div class="sum-value">{{ data.summary.fullyDone }} <span class="of">/ {{ data.summary.userCount }}</span></div>
        </div>
        <div class="sum-card">
          <div class="sum-label">รวม items</div>
          <div class="sum-value">{{ data.template.totalItems }}</div>
        </div>
      </div>

      <!-- Bottom 5 — ที่นักเรียนเข้าใจน้อยสุด -->
      <div class="section-card bottom-card" v-if="data.bottomItems.length">
        <h3>🚨 5 ข้อที่นักเรียนเข้าใจน้อยที่สุด</h3>
        <div class="bottom-list">
          <div v-for="(it, i) in data.bottomItems" :key="it.id" class="bottom-row">
            <span class="rank">{{ i + 1 }}</span>
            <div class="bottom-info">
              <div class="bottom-text">{{ it.text }}</div>
              <div class="bottom-sec">{{ it.sectionTitle }}</div>
            </div>
            <div class="bottom-bar-wrap">
              <div class="bottom-bar"><div class="bottom-fill" :style="{ width: it.percent + '%' }"></div></div>
              <span class="bottom-pct">{{ it.checkedCount }}/{{ it.totalUsers }} ({{ it.percent }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Users table -->
      <div class="section-card">
        <div class="sect-head">
          <h3>👥 นักเรียน ({{ data.users.length }})</h3>
          <button class="btn-sm btn-outline" @click="exportCsv">⬇ Export CSV</button>
        </div>
        <div class="users-table">
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>เสร็จ</th>
                <th>%</th>
                <th>อัพเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in sortedUsers" :key="u.userId">
                <td>{{ u.name }}</td>
                <td>{{ u.completed }}/{{ u.total }}</td>
                <td>
                  <div class="pct-cell">
                    <div class="pct-bar"><div class="pct-fill" :style="{ width: u.percent + '%' }"></div></div>
                    <span>{{ u.percent }}%</span>
                  </div>
                </td>
                <td class="ts">{{ formatTs(u.lastUpdate) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!data.users.length" class="empty-row">ยังไม่มีนักเรียนเข้า template นี้</div>
        </div>
      </div>

      <!-- All items breakdown -->
      <div class="section-card">
        <h3>📋 ทุกข้อ ({{ data.items.length }})</h3>
        <div class="items-breakdown">
          <div v-for="(it, i) in data.items" :key="it.id" class="ib-row">
            <span class="ib-num">{{ i + 1 }}</span>
            <div class="ib-info">
              <div class="ib-text">{{ it.text }}</div>
              <div class="ib-sec">{{ it.sectionTitle }}</div>
            </div>
            <div class="ib-bar-wrap">
              <div class="ib-bar"><div class="ib-fill" :class="severityClass(it.percent)" :style="{ width: it.percent + '%' }"></div></div>
              <span class="ib-pct">{{ it.checkedCount }}/{{ it.totalUsers }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="error" class="empty error">{{ error }}</div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'SelfCheckAnalytics',
  data() {
    return {
      templates: [],
      selectedSlug: '',
      data: null,
      loading: false,
      error: ''
    }
  },
  computed: {
    sortedUsers() {
      return [...(this.data?.users || [])].sort((a, b) => b.percent - a.percent)
    }
  },
  mounted() { this.loadTemplates() },
  methods: {
    async loadTemplates() {
      try {
        const res = await api.get('/admin/self-checks/templates')
        this.templates = res.templates || []
        if (this.templates.length && !this.selectedSlug) {
          this.selectedSlug = this.templates[0].slug
          this.load()
        }
      } catch (err) {
        this.error = err?.response?.data?.message || err.message
      }
    },
    async load() {
      if (!this.selectedSlug) return
      this.loading = true
      this.error = ''
      this.data = null
      try {
        const res = await api.get('/admin/self-checks/analytics', { params: { slug: this.selectedSlug } })
        this.data = res
      } catch (err) {
        this.error = err?.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    severityClass(percent) {
      if (percent < 30) return 'sev-low'
      if (percent < 60) return 'sev-mid'
      return 'sev-high'
    },
    formatTs(ts) {
      if (!ts) return '-'
      return new Date(ts).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    exportCsv() {
      if (!this.data?.users?.length) return
      const rows = [['ชื่อ', 'เสร็จ', 'รวม', '%', 'อัพเดตล่าสุด']]
      for (const u of this.sortedUsers) {
        rows.push([u.name, u.completed, u.total, u.percent, this.formatTs(u.lastUpdate)])
      }
      const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `self-check-${this.selectedSlug}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.sca { max-width: 1200px; margin: 0 auto; padding: 20px 16px 80px; }
.header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
.back { color: #3b82f6; text-decoration: none; font-weight: 700; font-size: 13px; }
.header h1 { flex: 1; font-size: 20px; margin: 0; color: #1e293b; }
.btn { padding: 8px 16px; border-radius: 8px; border: 0; cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }
.btn-ghost { background: #f1f5f9; color: #475569; text-decoration: none; display: inline-block; }

.filter-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field span { font-size: 12px; font-weight: 700; color: #475569; }
.field select { padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; background: #fff; }

.empty { text-align: center; padding: 60px 20px; color: #64748b; font-size: 14px; }
.empty.error { color: #dc2626; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
.sum-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; border-top: 4px solid #3b82f6; }
.sum-label { font-size: 11.5px; color: #64748b; font-weight: 700; margin-bottom: 4px; }
.sum-value { font-size: 28px; font-weight: 900; color: #1e293b; line-height: 1; }
.sum-value .of { font-size: 13px; color: #94a3b8; font-weight: 600; }

.section-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 14px; }
.sect-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-card h3 { font-size: 15px; margin: 0 0 10px; color: #1e293b; }
.bottom-card { border-top: 4px solid #f59e0b; background: linear-gradient(180deg, #fffbeb, #fff); }
.bottom-list { display: flex; flex-direction: column; gap: 8px; }
.bottom-row { display: flex; align-items: center; gap: 12px; padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #fde68a; }
.rank { font-size: 18px; font-weight: 900; color: #d97706; min-width: 24px; }
.bottom-info { flex: 1; min-width: 0; }
.bottom-text { font-size: 13px; color: #1e293b; font-weight: 600; line-height: 1.45; }
.bottom-sec { font-size: 11px; color: #64748b; margin-top: 2px; }
.bottom-bar-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 130px; align-items: flex-end; }
.bottom-bar { width: 100%; height: 8px; background: #fef3c7; border-radius: 999px; overflow: hidden; }
.bottom-fill { height: 100%; background: linear-gradient(90deg, #dc2626, #f59e0b); border-radius: 999px; }
.bottom-pct { font-size: 11px; font-weight: 800; color: #92400e; }

.users-table { overflow-x: auto; }
.users-table table { width: 100%; border-collapse: collapse; }
.users-table th { text-align: left; padding: 10px 12px; background: #f8fafc; font-size: 12px; font-weight: 800; color: #475569; border-bottom: 1.5px solid #e2e8f0; }
.users-table td { padding: 10px 12px; font-size: 12.5px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
.users-table td.ts { color: #64748b; font-size: 11.5px; }
.pct-cell { display: flex; align-items: center; gap: 8px; min-width: 130px; }
.pct-bar { flex: 1; height: 7px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.pct-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 999px; }
.pct-cell span { font-size: 11px; font-weight: 800; color: #1e293b; min-width: 36px; text-align: right; }
.empty-row { padding: 30px 20px; text-align: center; color: #64748b; font-size: 13px; }

.items-breakdown { display: flex; flex-direction: column; gap: 6px; max-height: 600px; overflow-y: auto; }
.ib-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; }
.ib-num { font-size: 10px; color: #94a3b8; font-weight: 800; min-width: 22px; text-align: right; }
.ib-info { flex: 1; min-width: 0; }
.ib-text { font-size: 12.5px; color: #334155; line-height: 1.4; }
.ib-sec { font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
.ib-bar-wrap { display: flex; align-items: center; gap: 7px; min-width: 120px; justify-content: flex-end; }
.ib-bar { width: 80px; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.ib-fill { height: 100%; border-radius: 999px; }
.ib-fill.sev-low { background: linear-gradient(90deg, #dc2626, #ef4444); }
.ib-fill.sev-mid { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.ib-fill.sev-high { background: linear-gradient(90deg, #10b981, #34d399); }
.ib-pct { font-size: 10.5px; font-weight: 800; color: #475569; min-width: 32px; text-align: right; }
</style>
