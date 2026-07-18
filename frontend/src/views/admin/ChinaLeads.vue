<script setup>
import { ref, computed, onMounted } from 'vue'

const leads = ref([])
const loading = ref(false)
const err = ref('')
const search = ref('')
const filterStatus = ref('all')
const filterInterest = ref('all')
const filterTier = ref('all')
const selectedLead = ref(null)

async function loadLeads() {
  loading.value = true
  err.value = ''
  try {
    const res = await fetch('/api/china/landing-leads?limit=2000', {
      credentials: 'include'
    })
    if (!res.ok) throw new Error(`โหลดไม่สำเร็จ (${res.status})`)
    const data = await res.json()
    leads.value = data.leads || []
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
}

const stats = computed(() => {
  const total = leads.value.length
  const tierPdf = leads.value.filter(l => l.leadTier === 'pdf').length
  const tierFull = leads.value.filter(l => l.leadTier === 'full').length
  const withAnswers = leads.value.filter(l => (l.answers || []).length === 30).length
  const wechatInterest = leads.value.filter(l => (l.interests || []).includes('wechat')).length
  const vdocallInterest = leads.value.filter(l => (l.interests || []).includes('vdocall')).length
  const discountInterest = leads.value.filter(l => (l.interests || []).includes('discount')).length
  const pdfDownloaded = leads.value.filter(l => (l.interests || []).includes('pdf')).length
  return { total, tierPdf, tierFull, withAnswers, wechatInterest, vdocallInterest, discountInterest, pdfDownloaded }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return leads.value.filter(l => {
    if (q) {
      const hay = [l.fullName, l.wechatId, l.university, l.email, l.phoneTh].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filterStatus.value !== 'all' && l.contactStatus !== filterStatus.value) return false
    if (filterInterest.value !== 'all' && !(l.interests || []).includes(filterInterest.value)) return false
    if (filterTier.value !== 'all' && (l.leadTier || 'pdf') !== filterTier.value) return false
    return true
  })
})

async function updateStatus(id, status) {
  try {
    await fetch(`/api/china/landing-leads/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactStatus: status })
    })
    const lead = leads.value.find(l => l._id === id)
    if (lead) lead.contactStatus = status
    if (selectedLead.value?._id === id) selectedLead.value.contactStatus = status
  } catch (e) { alert(e.message) }
}

async function saveNote(lead) {
  try {
    await fetch(`/api/china/landing-leads/${lead._id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: lead.adminNote || '' })
    })
  } catch (e) { alert(e.message) }
}

async function deleteLead(lead, event) {
  if (event) event.stopPropagation()
  const name = lead.fullName || '(ไม่มีชื่อ)'
  if (!confirm(`ลบ lead "${name}" (WeChat: ${lead.wechatId || '-'}) ?\n\nการลบไม่สามารถย้อนกลับได้`)) return
  try {
    const res = await fetch(`/api/china/landing-leads/${lead._id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) throw new Error(`ลบไม่สำเร็จ (${res.status})`)
    // remove จาก list ทันที
    leads.value = leads.value.filter(l => l._id !== lead._id)
    if (selectedLead.value?._id === lead._id) selectedLead.value = null
  } catch (e) { alert(e.message) }
}

function scoreBandLabel(band) {
  if (!band) return '-'
  const map = { '0-19%': '🚀 เริ่มต้น', '20-39%': '📚 เริ่มเตรียม', '40-59%': '🎯 เริ่มพร้อม',
                '60-79%': '✨ พร้อมมาก', '80-100%': '💎 ดีเยี่ยม',
                '0-20': '📚', '21-35': '🎯', '36-48': '✨', '49-60': '💎', 'skipped': '⚪' }
  return map[band] || band
}

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function exportCSV() {
  const rows = filtered.value.map(l => ({
    createdAt: l.createdAt,
    fullName: l.fullName || '',
    university: l.university || '',
    year: l.year || '',
    wechatId: l.wechatId || '',
    email: l.email || '',
    phoneTh: l.phoneTh || '',
    score: l.totalScore || 0,
    scorePct: Math.round(((l.totalScore || 0) / 60) * 100),
    scoreBand: l.scoreBand || '',
    interests: (l.interests || []).join('|'),
    contactStatus: l.contactStatus || 'new',
    adminNote: l.adminNote || '',
    country: l.country || '',
    seminarBatch: l.seminarBatch || ''
  }))
  const headers = Object.keys(rows[0] || { info: 'no data' })
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `china-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(loadLeads)
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">China Leads · Admin</div>
      <div class="topbar-actions">
        <button class="btn ghost" @click="loadLeads" :disabled="loading">
          {{ loading ? '⏳' : '↻ Refresh' }}
        </button>
        <button class="btn primary" @click="exportCSV">📥 Export CSV</button>
      </div>
    </header>

    <div class="content">
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat"><div class="s-num">{{ stats.total }}</div><div class="s-label">Total leads</div></div>
        <div class="stat"><div class="s-num" style="color:#64748b">{{ stats.tierPdf }}</div><div class="s-label">📥 PDF only</div></div>
        <div class="stat"><div class="s-num" style="color:#dc2626">{{ stats.tierFull }}</div><div class="s-label">🎯 Full (assessment)</div></div>
        <div class="stat"><div class="s-num">{{ stats.wechatInterest }}</div><div class="s-label">💬 สนใจ WeChat</div></div>
        <div class="stat"><div class="s-num">{{ stats.vdocallInterest }}</div><div class="s-label">📹 สนใจ Zoom</div></div>
        <div class="stat"><div class="s-num">{{ stats.discountInterest }}</div><div class="s-label">🎁 สนใจส่วนลด</div></div>
      </div>

      <!-- Filter -->
      <div class="filters">
        <input v-model="search" placeholder="🔍 ค้นหา ชื่อ / WeChat / มหาลัย / เบอร์" class="search-input" />
        <select v-model="filterStatus">
          <option value="all">Status: ทั้งหมด</option>
          <option value="new">new</option>
          <option value="pdf_sent">pdf_sent</option>
          <option value="consulted">consulted</option>
          <option value="converted">converted</option>
          <option value="no_response">no_response</option>
        </select>
        <select v-model="filterInterest">
          <option value="all">Interest: ทั้งหมด</option>
          <option value="pdf">PDF</option>
          <option value="wechat">WeChat</option>
          <option value="vdocall">Zoom</option>
          <option value="discount">Discount</option>
        </select>
        <select v-model="filterTier">
          <option value="all">Tier: ทั้งหมด</option>
          <option value="pdf">📥 PDF only</option>
          <option value="full">🎯 Full (assessment)</option>
        </select>
      </div>

      <div v-if="err" class="err">⚠ {{ err }}</div>

      <!-- Leads table -->
      <div class="lead-list">
        <div v-for="lead in filtered" :key="lead._id" class="lead-row" @click="selectedLead = lead">
          <div class="lr-left">
            <div class="lr-name">
              {{ lead.fullName || '(ไม่มีชื่อ)' }}
              <span class="tier-badge" :class="`tb-${lead.leadTier || 'pdf'}`">
                {{ (lead.leadTier || 'pdf') === 'full' ? '🎯 Full' : '📥 PDF' }}
              </span>
            </div>
            <div class="lr-meta">
              🎓 {{ lead.university || '-' }} · {{ lead.year || '-' }}
            </div>
            <div class="lr-contacts">
              💬 {{ lead.wechatId || '—' }}
              <span v-if="lead.phoneTh"> · 📱 {{ lead.phoneTh }}</span>
              <span v-if="lead.email"> · 📧 {{ lead.email }}</span>
            </div>
          </div>
          <div class="lr-right">
            <div class="lr-score">
              <b>{{ Math.round(((lead.totalScore || 0) / 60) * 100) }}%</b>
              <span class="lr-band">{{ scoreBandLabel(lead.scoreBand) }}</span>
            </div>
            <div class="lr-interests">
              <span v-if="(lead.interests || []).includes('pdf')" class="tag t-pdf">PDF</span>
              <span v-if="(lead.interests || []).includes('wechat')" class="tag t-wechat">WeChat</span>
              <span v-if="(lead.interests || []).includes('vdocall')" class="tag t-vdo">Zoom</span>
              <span v-if="(lead.interests || []).includes('discount')" class="tag t-discount">10%</span>
            </div>
            <select
              class="lr-status"
              :class="`s-${lead.contactStatus || 'new'}`"
              :value="lead.contactStatus || 'new'"
              @click.stop
              @change="updateStatus(lead._id, $event.target.value)"
            >
              <option value="new">new</option>
              <option value="pdf_sent">pdf_sent</option>
              <option value="consulted">consulted</option>
              <option value="converted">converted</option>
              <option value="no_response">no_response</option>
            </select>
            <div class="lr-date">{{ formatDate(lead.createdAt) }}</div>
          </div>
          <button
            class="lr-delete"
            title="ลบ lead"
            @click="deleteLead(lead, $event)"
          >🗑</button>
        </div>
        <div v-if="!loading && filtered.length === 0" class="empty">
          ไม่พบ leads ที่ตรงกับ filter
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="selectedLead" class="modal" @click.self="selectedLead = null">
      <div class="modal-card">
        <button class="modal-close" @click="selectedLead = null">✕</button>
        <h2>{{ selectedLead.fullName }}</h2>
        <div class="detail-grid">
          <div><b>WeChat:</b> {{ selectedLead.wechatId || '—' }}</div>
          <div><b>Email:</b> {{ selectedLead.email || '—' }}</div>
          <div><b>Phone:</b> {{ selectedLead.phoneTh || '—' }}</div>
          <div><b>University:</b> {{ selectedLead.university || '—' }}</div>
          <div><b>Year:</b> {{ selectedLead.year || '—' }}</div>
          <div><b>Score:</b> {{ selectedLead.totalScore || 0 }}/60 ({{ Math.round(((selectedLead.totalScore || 0) / 60) * 100) }}%)</div>
          <div><b>Band:</b> {{ scoreBandLabel(selectedLead.scoreBand) }}</div>
          <div><b>Country:</b> {{ selectedLead.country || '—' }}</div>
          <div><b>Batch:</b> {{ selectedLead.seminarBatch || '—' }}</div>
        </div>
        <div v-if="selectedLead.scoresByCategory" class="cat-scores">
          <h3>คะแนนแยกหมวด</h3>
          <div v-for="(v, k) in selectedLead.scoresByCategory" :key="k" class="cat-row">
            <span>{{ k }}</span>
            <span><b>{{ v }}/10</b> ({{ Math.round((v / 10) * 100) }}%)</span>
          </div>
        </div>
        <div class="interests-detail">
          <h3>Interests + Clicks</h3>
          <div>
            <span v-if="(selectedLead.interests || []).length === 0">ยังไม่กดสิทธิ์</span>
            <span v-for="k in (selectedLead.interests || [])" :key="k" class="tag" style="margin-right: 6px">
              {{ k }} × {{ selectedLead.interestClicks?.[k] || 1 }}
            </span>
          </div>
        </div>
        <div class="note-editor">
          <h3>Admin note</h3>
          <textarea v-model="selectedLead.adminNote" rows="3" placeholder="บันทึกภายใน (admin เท่านั้น)"></textarea>
          <button class="btn primary" @click="saveNote(selectedLead)">บันทึก note</button>
        </div>

        <div class="danger-zone">
          <h3>⚠ Danger zone</h3>
          <button class="btn btn-danger" @click="deleteLead(selectedLead)">
            🗑 ลบ lead นี้ (กู้คืนไม่ได้)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }
.page {
  min-height: 100vh;
  background: #f4f7fc;
  color: #0f172a;
  font-family: 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif;
}
.topbar {
  position: sticky; top: 0; z-index: 10;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand { font-size: 18px; font-weight: 900; color: #0a1e3d; }
.topbar-actions { display: flex; gap: 8px; }
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
}
.btn.ghost { background: white; color: #64748b; border-color: #cbd5e1; }
.btn.ghost:hover { background: #f8fafc; }
.btn.primary { background: #0a1e3d; color: white; }
.btn.primary:hover { background: #050f28; }

.content { padding: 20px; max-width: 1400px; margin: 0 auto; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.stat {
  background: white;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
}
.s-num { font-size: 26px; font-weight: 900; color: #0a1e3d; line-height: 1; }
.s-label { font-size: 11.5px; color: #64748b; margin-top: 6px; font-weight: 700; }

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.search-input, .filters select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  background: white;
}
.search-input { flex: 1; min-width: 200px; }

.err {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.lead-list { display: grid; gap: 8px; }
.lead-row {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s;
}
.lr-delete {
  background: transparent;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  padding: 6px 10px;
  transition: all 0.15s;
  font-family: inherit;
  align-self: center;
}
.lr-delete:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}
.lead-row:hover { border-color: #0a1e3d; box-shadow: 0 4px 12px rgba(10, 30, 61, 0.08); }
.lr-name { font-weight: 900; color: #0a1e3d; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tier-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.3px;
}
.tb-pdf { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
.tb-full { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.lr-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
.lr-contacts { font-size: 11.5px; color: #475569; margin-top: 4px; font-family: 'SF Mono', 'Menlo', monospace; }
.lr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 160px; }
.lr-score { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.lr-score b { font-size: 16px; color: #0a1e3d; }
.lr-band { font-size: 11px; color: #64748b; }
.lr-interests { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.tag {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  color: white;
}
.tag.t-pdf { background: #64748b; }
.tag.t-wechat { background: #16a34a; }
.tag.t-vdo { background: #2563eb; }
.tag.t-discount { background: #dc2626; }
.lr-status {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  font-family: inherit;
}
.lr-status.s-new { background: #f1f5f9; color: #64748b; }
.lr-status.s-pdf_sent { background: #dbeafe; color: #1e40af; }
.lr-status.s-consulted { background: #fef3c7; color: #92400e; }
.lr-status.s-converted { background: #dcfce7; color: #14532d; }
.lr-status.s-no_response { background: #fee2e2; color: #991b1b; }
.lr-date { font-size: 10.5px; color: #94a3b8; }

.empty {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  background: white;
  border-radius: 10px;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.6);
  display: grid;
  place-items: center;
  padding: 20px;
}
.modal-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-close {
  position: absolute;
  top: 12px; right: 12px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  color: #64748b;
}
.modal-close:hover { background: #fef2f2; color: #dc2626; }
.modal-card h2 { margin: 0 0 14px; font-size: 20px; color: #0a1e3d; }
.modal-card h3 { font-size: 13px; margin: 16px 0 8px; color: #0a1e3d; text-transform: uppercase; letter-spacing: 0.5px; }
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  font-size: 13.5px;
}
.detail-grid b { color: #64748b; font-weight: 700; }
.cat-scores { background: #f8fafc; border-radius: 10px; padding: 12px; }
.cat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px dashed #e2e8f0;
}
.cat-row:last-child { border: none; }
.interests-detail { padding: 10px 0; font-size: 13px; }
.note-editor textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  margin-bottom: 8px;
  resize: vertical;
}
.danger-zone {
  margin-top: 20px;
  padding: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
}
.danger-zone h3 {
  color: #dc2626 !important;
  margin-top: 0 !important;
}
.btn-danger {
  background: white;
  color: #dc2626;
  border: 1.5px solid #dc2626;
  padding: 10px 16px;
}
.btn-danger:hover {
  background: #dc2626;
  color: white;
}
</style>
