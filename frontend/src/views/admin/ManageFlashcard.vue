<template>
  <div class="admin-page">
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <h1>Flashcard Control</h1>
            <p>จัดการการ์ด + ดู leads คนที่มาเล่น</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><span class="hero-stat-num">{{ patterns.length }}</span><span class="hero-stat-label">Pattern</span></div>
            <div class="hero-stat"><span class="hero-stat-num">{{ publishedPatterns }} / {{ patterns.length }}</span><span class="hero-stat-label">Published</span></div>
            <div class="hero-stat"><span class="hero-stat-num">{{ ccCards.length }}</span><span class="hero-stat-label">CC Cards</span></div>
            <div class="hero-stat"><span class="hero-stat-num">{{ publishedCC }} / {{ ccCards.length }}</span><span class="hero-stat-label">Published</span></div>
            <div class="hero-stat"><span class="hero-stat-num">{{ publishedDDx }} / {{ ddxCards.length }}</span><span class="hero-stat-label">DDx Cards</span></div>
            <div class="hero-stat"><span class="hero-stat-num">{{ players.length }}</span><span class="hero-stat-label">ผู้เล่น</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Tabs -->
      <div class="tab-bar">
        <button v-for="t in tabs" :key="t.id" :class="['tab-btn', { active: tab === t.id }]" @click="tab = t.id">{{ t.icon }} {{ t.label }}</button>
      </div>

      <!-- Tab 1: Leads (คนที่มาเล่น) -->
      <div v-if="tab === 'leads'">
        <div v-if="loading" class="loading">กำลังโหลด...</div>
        <div v-else-if="players.length === 0" class="empty">ยังไม่มีคนมาเล่น</div>
        <div v-else class="player-list">
          <div class="player-header">
            <span class="ph-pic"></span>
            <span class="ph-name">ชื่อ</span>
            <span class="ph-cards">Arena</span>
            <span class="ph-cards">Path</span>
            <span class="ph-cards">Mindmap</span>
            <span class="ph-date">ล่าสุด</span>
          </div>
          <div v-for="p in players" :key="p.lineUserId" class="player-row">
            <img v-if="p.pictureUrl" :src="p.pictureUrl" class="player-pic" />
            <span v-else class="player-pic-ph">👤</span>
            <span class="player-name">{{ p.displayName || 'ไม่ทราบชื่อ' }}<br><span style="font-size:9px;color:#94a3b8;font-weight:400">{{ p.level || 'Beginner' }} ⭐{{ p.stars || 0 }}</span></span>
            <span class="player-cards" style="font-size:10px"><span style="color:#f59e0b">⭐{{ p.stars || 0 }}</span><br><span style="color:#64748b">{{ p.totalSessions || 0 }}รอบ</span></span>
            <span class="player-cards" style="font-size:10px"><span style="color:#7c3aed">🎖{{ p.pathProgress?.bosses || 0 }}</span><br><span style="color:#64748b">{{ p.pathProgress?.chapters || 0 }}บท</span></span>
            <span class="player-cards" style="font-size:10px"><span style="color:#16a34a">{{ p.mindmapViews || 0 }}ครั้ง</span></span>
            <span class="player-date">{{ formatDate(p.lastPlayedAt || p.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Tab 2: Pattern Cards -->
      <div v-if="tab === 'patterns'">
        <div class="card-actions">
          <button class="btn btn-add" @click="openAdd('pattern')">+ เพิ่ม Pattern</button>
          <button class="btn btn-publish-all" @click="publishAll('pattern')">Publish ทั้งหมด</button>
          <button class="btn btn-unpublish-all" @click="unpublishAll('pattern')">Unpublish ทั้งหมด</button>
          <span class="filter-toggle">
            <label><input type="checkbox" v-model="filterDraft"> แสดงเฉพาะ Draft</label>
          </span>
        </div>
        <div v-if="filteredPatterns.length === 0" class="empty">ไม่มีการ์ด{{ filterDraft ? ' Draft' : '' }}</div>
        <div v-for="(p, i) in filteredPatterns" :key="p._id" :class="['card-row', { 'card-draft': !p.isActive }]">
          <span class="card-num">{{ i + 1 }}</span>
          <span :class="['badge-status', p.isActive ? 'badge-live' : 'badge-draft']">{{ p.isActive ? 'LIVE' : 'DRAFT' }}</span>
          <span class="card-cat">{{ p.category }}</span>
          <span class="card-pattern">{{ p.pattern }}</span>
          <span class="card-answer">{{ p.answer }}</span>
          <div class="card-actions-right">
            <button class="btn-sm btn-preview" @click="openPreview('pattern', p)">ดูการ์ด</button>
            <button :class="['btn-sm', p.isActive ? 'btn-unpub' : 'btn-pub']" @click="togglePublish('pattern', p._id)">{{ p.isActive ? 'Unpublish' : 'Publish' }}</button>
            <button class="btn-sm btn-edit" @click="openEdit('pattern', p)">แก้</button>
            <button class="btn-sm btn-del" @click="deletePattern(p._id)">ลบ</button>
          </div>
        </div>
      </div>

      <!-- Tab 3: CC Cards -->
      <div v-if="tab === 'cc'">
        <div class="card-actions">
          <button class="btn btn-add" @click="openAdd('cc')">+ เพิ่ม CC Card</button>
          <button class="btn btn-publish-all" @click="publishAll('cc')">Publish ทั้งหมด</button>
          <button class="btn btn-unpublish-all" @click="unpublishAll('cc')">Unpublish ทั้งหมด</button>
          <span class="filter-toggle">
            <label><input type="checkbox" v-model="filterDraftCC"> แสดงเฉพาะ Draft</label>
          </span>
        </div>
        <div v-if="filteredCC.length === 0" class="empty">ไม่มีการ์ด{{ filterDraftCC ? ' Draft' : '' }}</div>
        <div v-for="(c, i) in filteredCC" :key="c._id" :class="['card-row', { 'card-draft': !c.isActive }]">
          <span class="card-num">{{ i + 1 }}</span>
          <span :class="['badge-status', c.isActive ? 'badge-live' : 'badge-draft']">{{ c.isActive ? 'LIVE' : 'DRAFT' }}</span>
          <span class="card-pattern">{{ c.cc }} ({{ c.ccEn }})</span>
          <span class="card-answer">{{ c.ddxCount }} DDx: {{ (c.ddxList || []).join(', ') }}</span>
          <div class="card-actions-right">
            <button class="btn-sm btn-preview" @click="openPreview('cc', c)">ดูการ์ด</button>
            <button :class="['btn-sm', c.isActive ? 'btn-unpub' : 'btn-pub']" @click="togglePublish('cc', c._id)">{{ c.isActive ? 'Unpublish' : 'Publish' }}</button>
            <button class="btn-sm btn-edit" @click="openEdit('cc', c)">แก้</button>
            <button class="btn-sm btn-del" @click="deleteCC(c._id)">ลบ</button>
          </div>
        </div>
      </div>

      <!-- Tab 4: DDx Cards (model แยก — CRUD เต็ม) -->
      <div v-if="tab === 'ddx'">
        <div class="card-actions">
          <button class="btn btn-add" @click="openAdd('ddx')">+ เพิ่ม DDx</button>
          <button class="btn btn-publish-all" @click="publishAll('ddx')">Publish ทั้งหมด</button>
          <button class="btn btn-unpublish-all" @click="unpublishAll('ddx')">Unpublish ทั้งหมด</button>
          <input v-model="ddxSearch" class="ddx-search" placeholder="ค้นหา DDx..." />
          <span class="ddx-count">{{ filteredDdx.length }} / {{ ddxCards.length }}</span>
        </div>
        <div v-if="filteredDdx.length === 0" class="empty">ไม่พบ DDx</div>
        <div v-for="(d, i) in filteredDdx" :key="d._id" :class="['card-row', { 'card-draft': !d.isActive }]">
          <span class="card-num">{{ i + 1 }}</span>
          <span :class="['badge-status', d.isActive ? 'badge-live' : 'badge-draft']">{{ d.isActive ? 'LIVE' : 'DRAFT' }}</span>
          <span class="card-cat" v-if="d.category">{{ d.category }}</span>
          <span class="card-pattern">{{ d.ddx }}<span v-if="d.ddxTh" class="ddx-th"> ({{ d.ddxTh }})</span></span>
          <span class="card-answer">{{ (d.relatedCC || []).join(', ') }}</span>
          <div class="card-actions-right">
            <button class="btn-sm btn-preview" @click="openPreview('ddx', d)">ดูการ์ด</button>
            <button :class="['btn-sm', d.isActive ? 'btn-unpub' : 'btn-pub']" @click="togglePublish('ddx', d._id)">{{ d.isActive ? 'Unpublish' : 'Publish' }}</button>
            <button class="btn-sm btn-edit" @click="openEdit('ddx', d)">แก้</button>
            <button class="btn-sm btn-del" @click="deleteDDx(d._id)">ลบ</button>
          </div>
        </div>
      </div>

      <!-- Tab 5: วิเคราะห์ — การ์ดที่คนจำไม่ได้ -->
      <div v-if="tab === 'analytics'">
        <div v-if="!analyticsData" class="loading">กำลังโหลด...</div>
        <div v-else>
          <div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap">
            <div class="stat-box"><span class="stat-num">{{ analyticsData.totalPlayers }}</span><span class="stat-label">ผู้เล่นทั้งหมด</span></div>
            <div class="stat-box"><span class="stat-num">{{ analyticsData.totalRounds }}</span><span class="stat-label">รอบทั้งหมด</span></div>
            <div class="stat-box"><span class="stat-num">{{ (analyticsData.topWrong || []).length }}</span><span class="stat-label">การ์ดที่เคยตอบผิด</span></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin:0;flex:1">การ์ดที่คนจำไม่ได้มากที่สุด</h3>
            <button class="btn btn-del-all" @click="resetAnalytics">ล้างข้อมูลคะแนนทั้งหมด</button>
          </div>
          <div v-if="(analyticsData.topWrong || []).length === 0" class="empty">ยังไม่มีข้อมูล</div>
          <div v-for="(w, i) in (analyticsData.topWrong || [])" :key="i" class="card-row">
            <span class="card-num">{{ i + 1 }}</span>
            <div class="wrong-bar-wrap">
              <div class="wrong-bar" :style="{ width: w.pct + '%', background: w.pct >= 30 ? '#dc2626' : w.pct >= 15 ? '#f59e0b' : '#3b82f6' }"></div>
            </div>
            <span class="card-pattern" style="flex:2">{{ w.card }}</span>
            <span style="font-size:12px;color:#dc2626;font-weight:700;width:60px;text-align:right">{{ w.count }} ครั้ง</span>
            <span style="font-size:11px;color:#94a3b8;width:40px;text-align:right">{{ w.pct }}%</span>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-bg" @click.self="showModal = false">
        <div class="modal" :class="{ 'modal-wide': modalType !== 'pattern' }">
          <h3>{{ editMode ? 'แก้ไข' : 'เพิ่ม' }} {{ { pattern: 'Pattern', cc: 'CC Card', ddx: 'DDx Card' }[modalType] }}</h3>
          <div v-if="modalType === 'pattern'" class="form">
            <label>Pattern (หน้าการ์ด)<textarea v-model="form.pattern" rows="3"></textarea></label>
            <label>Answer (คำตอบ)<input v-model="form.answer" /></label>
            <label>Mnemonic (ตัวช่วยจำ)<input v-model="form.mnemonic" /></label>
            <label>Category<input v-model="form.category" placeholder="GI, Cardio, Neuro..." /></label>
          </div>
          <div v-else-if="modalType === 'cc'" class="form">
            <label>C/C ไทย<input v-model="form.cc" /></label>
            <label>C/C English<input v-model="form.ccEn" /></label>
            <div class="ddx-list-label">
              <span>DDx List ({{ form.ddxItems.length }} รายการ)</span>
              <button type="button" class="btn-sm btn-add-ddx" @click="form.ddxItems.push('')">+ เพิ่ม DDx</button>
            </div>
            <div class="ddx-list-items">
              <div v-for="(item, idx) in form.ddxItems" :key="idx" class="ddx-list-item">
                <span class="ddx-list-num">{{ idx + 1 }}</span>
                <input v-model="form.ddxItems[idx]" placeholder="ชื่อ DDx..." class="ddx-list-input" />
                <button type="button" class="btn-sm btn-del" @click="form.ddxItems.splice(idx, 1)" title="ลบ">✕</button>
              </div>
            </div>
          </div>
          <div v-else class="form">
            <label>DDx (ชื่อโรค EN)<input v-model="form.ddx" placeholder="Appendicitis" /></label>
            <label>ชื่อไทย<input v-model="form.ddxTh" placeholder="ไส้ติ่งอักเสบ" /></label>
            <label>Related CC (คั่นด้วย comma)<input v-model="form.relatedCCStr" placeholder="ปวดท้อง, ไข้" /></label>
            <label>Clue (ตัวช่วยจำ)<input v-model="form.clue" placeholder="สะดือ → ขวาล่าง = ไส้ติ่ง" /></label>
            <label>History<textarea v-model="form.history" rows="2" placeholder="ปวดรอบสะดือ → ย้ายไป RLQ, คลื่นไส้, เบื่ออาหาร"></textarea></label>
            <label>PE<textarea v-model="form.pe" rows="2" placeholder="McBurney tenderness, Rebound+, Rovsing+"></textarea></label>
            <label>Investigation<textarea v-model="form.investigation" rows="2" placeholder="WBC สูง, CT: dilated appendix > 6mm"></textarea></label>
            <label>Category<input v-model="form.category" placeholder="GI, Cardio, Neuro..." /></label>
          </div>
          <div class="modal-btns">
            <button class="btn btn-save" @click="saveForm">{{ editMode ? 'บันทึก' : 'เพิ่ม' }}</button>
            <button class="btn btn-cancel" @click="showModal = false">ยกเลิก</button>
          </div>
        </div>
      </div>

      <!-- Preview Modal (เหมือนเกมจริง) -->
      <div v-if="previewItem" class="modal-bg" @click.self="previewItem = null">
        <div class="modal preview-modal">
          <!-- Pattern preview -->
          <div v-if="previewItem.type === 'pattern'" class="preview-card">
            <div class="preview-game-card">
              <div class="preview-mode-badge">Pattern → DDx</div>
              <div v-if="previewItem.category" class="preview-cat-badge">{{ previewItem.category }}</div>
              <div class="preview-front-text">{{ previewItem.pattern }}</div>
              <button class="preview-flip-btn" @click="previewFlipped = !previewFlipped">{{ previewFlipped ? 'ซ่อนคำตอบ' : 'พลิกดูคำตอบ' }}</button>
            </div>
            <div v-if="previewFlipped" class="preview-reveal">
              <div class="preview-answer">{{ previewItem.answer }}</div>
              <div v-if="previewItem.mnemonic" class="preview-mnemonic">{{ previewItem.mnemonic }}</div>
            </div>
          </div>
          <!-- CC preview -->
          <div v-else-if="previewItem.type === 'cc'" class="preview-card">
            <div class="preview-game-card">
              <div class="preview-mode-badge">CC → DDx</div>
              <div class="preview-front-text" style="font-size:22px">{{ previewItem.cc }}</div>
              <div class="preview-front-sub">{{ previewItem.ccEn }}</div>
              <div class="preview-ddx-hint">{{ previewItem.ddxCount || (previewItem.ddxList||[]).length }} DDx</div>
              <button class="preview-flip-btn" @click="previewFlipped = !previewFlipped">{{ previewFlipped ? 'ซ่อน DDx' : 'พลิกดู DDx' }}</button>
            </div>
            <div v-if="previewFlipped" class="preview-reveal">
              <div v-for="(ddx, i) in (previewItem.ddxList || [])" :key="i" class="preview-ddx-item">
                <span class="preview-ddx-num">{{ i + 1 }}</span>
                <span>{{ ddx }}</span>
              </div>
            </div>
          </div>
          <!-- DDx preview -->
          <div v-else class="preview-card">
            <div class="preview-game-card">
              <div class="preview-mode-badge">DDx → Detail</div>
              <div v-if="previewItem.category" class="preview-cat-badge">{{ previewItem.category }}</div>
              <div class="preview-front-text" style="font-size:20px">{{ previewItem.ddx }}</div>
              <div v-if="previewItem.ddxTh" class="preview-front-sub">{{ previewItem.ddxTh }}</div>
              <button class="preview-flip-btn" @click="previewFlipped = !previewFlipped">{{ previewFlipped ? 'ซ่อนรายละเอียด' : 'พลิกดูรายละเอียด' }}</button>
            </div>
            <div v-if="previewFlipped" class="preview-reveal">
              <div v-if="(previewItem.relatedCC||[]).length" class="preview-detail-row">
                <span class="preview-detail-label">C/C ที่เกี่ยวข้อง</span>
                <span>{{ previewItem.relatedCC.join(', ') }}</span>
              </div>
              <div v-if="previewItem.clue" class="preview-detail-row">
                <span class="preview-detail-label">Clue</span>
                <span>{{ previewItem.clue }}</span>
              </div>
              <div v-if="previewItem.history" class="preview-detail-row">
                <span class="preview-detail-label">History</span>
                <span>{{ previewItem.history }}</span>
              </div>
              <div v-if="previewItem.pe" class="preview-detail-row">
                <span class="preview-detail-label">PE</span>
                <span>{{ previewItem.pe }}</span>
              </div>
              <div v-if="previewItem.investigation" class="preview-detail-row">
                <span class="preview-detail-label">Investigation</span>
                <span>{{ previewItem.investigation }}</span>
              </div>
              <div v-if="!previewItem.clue && !previewItem.history && !previewItem.pe && !previewItem.investigation" class="preview-empty">ยังไม่มีรายละเอียด — กดแก้ไขเพื่อเพิ่ม</div>
            </div>
          </div>
          <div class="modal-btns" style="justify-content:center">
            <button class="btn btn-cancel" @click="previewItem = null">ปิด</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../../services/api'

const tab = ref('leads')
const tabs = [
  { id: 'leads', label: 'ผู้เล่น (Leads)', icon: '👥' },
  { id: 'patterns', label: 'Pattern Cards', icon: '🃏' },
  { id: 'cc', label: 'CC Cards', icon: '📋' },
  { id: 'ddx', label: 'DDx Cards', icon: '🔄' },
  { id: 'analytics', label: 'วิเคราะห์', icon: '📊' },
]

const loading = ref(false)
const players = ref([])
const patterns = ref([])
const ccCards = ref([])
const ddxCards = ref([])

const filterDraft = ref(false)
const filterDraftCC = ref(false)
const ddxSearch = ref('')
const analyticsData = ref(null)

const publishedPatterns = computed(() => patterns.value.filter(p => p.isActive !== false).length)
const publishedCC = computed(() => ccCards.value.filter(c => c.isActive !== false).length)
const publishedDDx = computed(() => ddxCards.value.filter(d => d.isActive !== false).length)
const filteredPatterns = computed(() => filterDraft.value ? patterns.value.filter(p => !p.isActive) : patterns.value)
const filteredCC = computed(() => filterDraftCC.value ? ccCards.value.filter(c => !c.isActive) : ccCards.value)
const filteredDdx = computed(() => {
  let list = ddxCards.value
  if (ddxSearch.value) {
    const q = ddxSearch.value.toLowerCase()
    list = list.filter(d => d.ddx.toLowerCase().includes(q) || (d.ddxTh || '').toLowerCase().includes(q) || (d.relatedCC || []).join(',').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q))
  }
  return list
})

// Modal
const showModal = ref(false)
const modalType = ref('pattern')
const editMode = ref(false)
const editId = ref(null)
const form = ref({ pattern: '', answer: '', mnemonic: '', category: '', cc: '', ccEn: '', ddxItems: [], ddx: '', ddxTh: '', relatedCCStr: '', clue: '', history: '', pe: '', investigation: '' })

// Preview
const previewItem = ref(null)
const previewFlipped = ref(false)

async function loadAll() {
  loading.value = true
  try {
    const [pRes, ccRes, ddxRes, plRes] = await Promise.all([
      api.get('/admin/flashcard').catch(() => ({ patterns: [] })),
      api.get('/admin/flashcard/cc').catch(() => ({ cards: [] })),
      api.get('/admin/flashcard/ddx').catch(() => ({ cards: [] })),
      api.get('/admin/flashcard/players').catch(() => ({ players: [] })),
    ])
    patterns.value = pRes?.patterns || []
    ccCards.value = ccRes?.cards || []
    ddxCards.value = ddxRes?.cards || []
    players.value = plRes?.players || []
  } catch (e) { console.error(e) }
  loading.value = false
}

function scoreClass(s) { return s >= 80 ? 'good' : s >= 50 ? 'mid' : 'bad' } // legacy
function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }

function openAdd(type) {
  modalType.value = type; editMode.value = false; editId.value = null
  if (type === 'ddx') {
    form.value = { ddx: '', ddxTh: '', relatedCCStr: '', clue: '', history: '', pe: '', investigation: '', category: '' }
  } else if (type === 'cc') {
    form.value = { cc: '', ccEn: '', ddxItems: [''] }
  } else {
    form.value = { pattern: '', answer: '', mnemonic: '', category: '' }
  }
  showModal.value = true
}
function openEdit(type, item) {
  modalType.value = type; editMode.value = true; editId.value = item._id
  if (type === 'ddx') {
    form.value = { ddx: item.ddx, ddxTh: item.ddxTh || '', relatedCCStr: (item.relatedCC || []).join(', '), clue: item.clue || '', history: item.history || '', pe: item.pe || '', investigation: item.investigation || '', category: item.category || '' }
  } else if (type === 'cc') {
    form.value = { cc: item.cc, ccEn: item.ccEn, ddxItems: [...(item.ddxList || [])] }
  } else {
    form.value = { pattern: item.pattern, answer: item.answer, mnemonic: item.mnemonic || '', category: item.category || '' }
  }
  showModal.value = true
}

function openPreview(type, item) {
  previewFlipped.value = false
  previewItem.value = { ...item, type }
}

async function saveForm() {
  try {
    if (modalType.value === 'pattern') {
      if (editMode.value) await api.put(`/admin/flashcard/${editId.value}`, form.value)
      else await api.post('/admin/flashcard', form.value)
    } else if (modalType.value === 'cc') {
      const ddxList = form.value.ddxItems.filter(d => d.trim()).join(', ')
      const payload = { cc: form.value.cc, ccEn: form.value.ccEn, ddxList }
      if (editMode.value) await api.put(`/admin/flashcard/cc/${editId.value}`, payload)
      else await api.post('/admin/flashcard/cc', payload)
    } else {
      const payload = { ...form.value, relatedCC: form.value.relatedCCStr }
      if (editMode.value) await api.put(`/admin/flashcard/ddx/${editId.value}`, payload)
      else await api.post('/admin/flashcard/ddx', payload)
    }
    showModal.value = false
    await loadAll()
  } catch (e) { alert(e.response?.data?.error || 'Error') }
}

async function deletePattern(id) { if (confirm('ลบการ์ดนี้?')) { await api.delete(`/admin/flashcard/${id}`); await loadAll() } }
async function deleteCC(id) { if (confirm('ลบ CC Card นี้?')) { await api.delete(`/admin/flashcard/cc/${id}`); await loadAll() } }
async function deleteDDx(id) { if (confirm('ลบ DDx Card นี้?')) { await api.delete(`/admin/flashcard/ddx/${id}`); await loadAll() } }

async function resetAnalytics() {
  if (!confirm('ล้างข้อมูลคะแนน + scoreHistory ทั้งหมด?\n\n(ดาวและ level ยังอยู่ ล้างแค่ประวัติคะแนนเพื่อเริ่มเก็บใหม่)')) return
  try {
    await api.post('/admin/flashcard/reset-scores')
    analyticsData.value = null
    alert('ล้างข้อมูลคะแนนเรียบร้อย')
  } catch (e) { alert(e.response?.data?.error || 'Error') }
}


async function togglePublish(type, id) {
  try {
    const url = type === 'ddx' ? `/admin/flashcard/ddx/toggle/${id}` : type === 'cc' ? `/admin/flashcard/cc/toggle/${id}` : `/admin/flashcard/toggle/${id}`
    await api.patch(url)
    await loadAll()
  } catch (e) { alert(e.response?.data?.error || 'Error') }
}
async function publishAll(type) {
  if (!confirm(`Publish ${type === 'cc' ? 'CC Cards' : 'Pattern Cards'} ทั้งหมด?`)) return
  await api.patch('/admin/flashcard/publish-all', { type })
  await loadAll()
}
async function unpublishAll(type) {
  if (!confirm(`Unpublish ${type === 'cc' ? 'CC Cards' : 'Pattern Cards'} ทั้งหมด?`)) return
  await api.patch('/admin/flashcard/unpublish-all', { type })
  await loadAll()
}

watch(tab, async (v) => {
  if (v === 'analytics' && !analyticsData.value) {
    try {
      analyticsData.value = await api.get('/admin/flashcard/analytics')
    } catch (e) { console.error(e) }
  }
})

onMounted(loadAll)
</script>

<style scoped>
.admin-page{min-height:100vh;background:#f8fafc}
.admin-hero{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:24px 0}
.admin-hero-inner{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.admin-hero-icon{width:48px;height:48px;background:rgba(59,130,246,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#60a5fa}
.admin-hero h1{font-size:20px;font-weight:700;margin:0}
.admin-hero p{font-size:13px;color:#94a3b8;margin:2px 0 0}
.hero-stats{display:flex;gap:20px;margin-left:auto}
.hero-stat{text-align:center}
.hero-stat-num{display:block;font-size:22px;font-weight:800;color:#60a5fa}
.hero-stat-label{font-size:10px;color:#64748b}
.container{max-width:960px;margin:0 auto;padding:0 20px}
.section{padding:20px 20px 60px}

.tab-bar{display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid #e2e8f0}
.tab-btn{padding:10px 18px;border:none;background:none;font-size:13px;font-weight:500;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;font-family:inherit}
.tab-btn.active{color:#3b82f6;border-bottom-color:#3b82f6}

.loading{text-align:center;padding:40px;color:#94a3b8}
.empty{text-align:center;padding:40px;color:#94a3b8}

/* Players */
.player-header{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f1f5f9;border-radius:8px;font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px}
.ph-pic{width:32px}.ph-name{flex:1}.ph-cards{width:70px;text-align:center}.ph-sessions{width:70px;text-align:center}.ph-date{width:100px;text-align:right}
.player-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f1f5f9}
.player-pic{width:32px;height:32px;border-radius:50%;object-fit:cover}
.player-pic-ph{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#e2e8f0;border-radius:50%;font-size:16px}
.player-name{flex:1;font-size:13px;font-weight:600;color:#0f172a}
.player-cards{width:70px;text-align:center;font-size:13px;font-weight:700;color:#8b5cf6}
.player-sessions{width:70px;text-align:center;font-size:13px;font-weight:600;color:#64748b}
.player-date{width:100px;text-align:right;font-size:11px;color:#94a3b8}

/* Cards */
.card-actions{display:flex;gap:8px;margin-bottom:12px}
.btn{padding:8px 16px;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.btn-add{background:#3b82f6;color:#fff}.btn-seed{background:#f59e0b;color:#fff}
.card-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px}
.card-num{width:24px;color:#94a3b8;font-weight:700;flex-shrink:0}
.card-cat{background:#e2e8f0;padding:2px 6px;border-radius:4px;font-size:10px;color:#475569;flex-shrink:0}
.card-pattern{flex:1;color:#0f172a;font-weight:600}
.card-answer{flex:1;color:#64748b;font-size:11px}
.card-actions-right{display:flex;gap:4px;flex-shrink:0}
.btn-sm{padding:4px 8px;border-radius:4px;border:none;font-size:10px;cursor:pointer;font-family:inherit}
.btn-edit{background:#dbeafe;color:#2563eb}.btn-del{background:#fee2e2;color:#dc2626}
.btn-pub{background:#d1fae5;color:#059669;font-weight:600}.btn-unpub{background:#fef3c7;color:#b45309;font-weight:600}
.btn-publish-all{background:#059669;color:#fff}.btn-unpublish-all{background:#6b7280;color:#fff}
.badge-status{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;flex-shrink:0;letter-spacing:.5px}
.badge-live{background:#d1fae5;color:#059669}.badge-draft{background:#f1f5f9;color:#94a3b8}
.card-draft{opacity:.6}
.filter-toggle{margin-left:auto;font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px}
.filter-toggle input{margin:0}
.filter-toggle label{display:flex;align-items:center;gap:4px;cursor:pointer}

/* Modal */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100}
.modal{background:#fff;border-radius:14px;padding:24px;max-width:500px;width:90%}
.modal h3{font-size:16px;font-weight:700;margin-bottom:16px;color:#0f172a}
.form{display:flex;flex-direction:column;gap:12px}
.form label{font-size:12px;color:#475569;font-weight:600;display:flex;flex-direction:column;gap:4px}
.form input,.form textarea{padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit}
.modal-btns{display:flex;gap:8px;margin-top:16px}
.btn-save{background:#3b82f6;color:#fff;padding:8px 20px;border-radius:8px;border:none;font-weight:600;cursor:pointer;font-family:inherit}
.btn-cancel{background:#f1f5f9;color:#64748b;padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-family:inherit}

/* DDx List in CC Modal */
.modal-wide{max-width:600px}
.ddx-list-label{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#475569;font-weight:600}
.btn-add-ddx{background:#dbeafe;color:#2563eb;font-weight:600}
.ddx-list-items{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;padding:4px 0}
.ddx-list-item{display:flex;align-items:center;gap:6px}
.ddx-list-num{width:20px;font-size:11px;color:#94a3b8;text-align:center;flex-shrink:0}
.ddx-list-input{flex:1;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit}
.ddx-list-input:focus{border-color:#3b82f6;outline:none}

/* DDx inline edit */
.ddx-inline-input{flex:1;padding:4px 8px;border:2px solid #3b82f6;border-radius:6px;font-size:12px;font-family:inherit;min-width:120px}
.btn-cancel-sm{background:#f1f5f9;color:#64748b}

/* Preview — เหมือนเกมจริง (dark theme) */
.btn-preview{background:#ede9fe;color:#7c3aed;font-weight:600}
.preview-modal{max-width:420px}
.preview-card{padding:0}
.preview-game-card{background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:28px 24px;text-align:center;color:#fff}
.preview-mode-badge{display:inline-block;background:rgba(139,92,246,.2);color:#a78bfa;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.5px;margin-bottom:12px}
.preview-cat-badge{display:inline-block;background:rgba(59,130,246,.15);color:#60a5fa;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:600;margin-bottom:10px}
.preview-front-text{font-size:18px;font-weight:700;line-height:1.6;color:#f1f5f9}
.preview-front-sub{font-size:13px;color:#94a3b8;margin-top:4px}
.preview-ddx-hint{font-size:12px;color:#64748b;margin-top:8px}
.preview-flip-btn{margin-top:16px;background:#7c3aed;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.preview-reveal{background:#f8fafc;border-radius:0 0 16px 16px;padding:20px;text-align:left}
.preview-answer{font-size:16px;font-weight:700;color:#065f46;text-align:center}
.preview-mnemonic{margin-top:8px;font-size:13px;color:#64748b;font-style:italic;text-align:center}
.preview-ddx-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
.preview-ddx-num{width:24px;height:24px;background:#ede9fe;color:#7c3aed;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.preview-detail-row{padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;line-height:1.6;white-space:pre-line}
.preview-detail-label{display:block;font-size:11px;font-weight:700;color:#7c3aed;margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px}
.preview-empty{text-align:center;padding:20px;color:#94a3b8;font-size:13px}
.ddx-th{color:#94a3b8;font-weight:400;font-size:11px}

/* Analytics */
.stat-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;text-align:center;min-width:100px}
.stat-num{display:block;font-size:24px;font-weight:800;color:#3b82f6}
.stat-label{font-size:11px;color:#64748b}
.wrong-bar-wrap{width:60px;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;flex-shrink:0}
.wrong-bar{height:100%;border-radius:3px}
.btn-del-all{background:#fee2e2;color:#dc2626;padding:6px 14px;border-radius:8px;border:none;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
</style>
