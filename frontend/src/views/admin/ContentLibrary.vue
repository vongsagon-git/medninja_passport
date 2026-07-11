<template>
  <div class="content-library-page">
    <div class="page-header">
      <div>
        <h1>📚 Content Library</h1>
        <p class="subtitle">คลัง video ที่มี 4 fields ครบ (Bunny×2 + Ali×2) — reuse ตอนสร้าง Section</p>
      </div>
      <div class="header-actions">
        <span class="stat-chip">📦 {{ contents.length }} contents</span>
        <button class="btn btn-primary" @click="openNewModal">+ เพิ่ม Content</button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <input v-model="filters.search" type="text" placeholder="🔍 ค้นหาชื่อ / notes" class="form-control" @input="debouncedLoad" />
      <select v-model="filters.tagLv1" class="form-control" @change="load">
        <option value="">ทุก Lv1</option>
        <option v-for="t in tags.tagLv1" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filters.tagLv2" class="form-control" @change="load">
        <option value="">ทุก Lv2</option>
        <option v-for="t in tags.tagLv2" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filters.tagLv3" class="form-control" @change="load">
        <option value="">ทุก Lv3</option>
        <option v-for="t in tags.tagLv3" :key="t" :value="t">{{ t }}</option>
      </select>
      <button v-if="filters.search || filters.tagLv1 || filters.tagLv2 || filters.tagLv3" class="btn btn-outline btn-sm" @click="clearFilters">✕ เคลียร์</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div v-if="loading" class="empty-state">กำลังโหลด...</div>
      <div v-else-if="contents.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div>ยังไม่มี Content ใน Library</div>
        <div class="hint">กด "บันทึกเข้า Content Library" ที่ video ใน Manage Sections หรือกด "+ เพิ่ม Content" ด้านบน</div>
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>ชื่อ Content</th>
            <th>Tag Lv1</th>
            <th>Tag Lv2</th>
            <th>Tag Lv3</th>
            <th>ระยะเวลา</th>
            <th>Video IDs</th>
            <th>ใช้ใน</th>
            <th>Updated</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in contents" :key="c._id">
            <td>
              <div class="content-title">{{ c.title }}</div>
              <div v-if="c.notes" class="content-notes">{{ c.notes }}</div>
            </td>
            <td><span v-if="c.tagLv1" class="tag-chip lv1">{{ c.tagLv1 }}</span></td>
            <td><span v-if="c.tagLv2" class="tag-chip lv2">{{ c.tagLv2 }}</span></td>
            <td><span v-if="c.tagLv3" class="tag-chip lv3">{{ c.tagLv3 }}</span></td>
            <td class="duration">{{ c.duration || '--:--' }}</td>
            <td>
              <div class="id-grid">
                <span class="id-badge bunny" :title="'Bunny NoDRM: ' + c.bunnyVideoId">🌐 B</span>
                <span class="id-badge bunny drm" :title="'Bunny Widevine: ' + c.bunnyDrmVideoId">🌐 BD</span>
              </div>
            </td>
            <td>
              <button class="usage-btn" @click="openUsageModal(c)" :title="'ดูว่าใช้ในกี่ section'">
                📎 {{ usageCounts[c._id] != null ? usageCounts[c._id] : '?' }}
              </button>
            </td>
            <td class="date">{{ formatDate(c.updatedAt) }}</td>
            <td>
              <button class="btn btn-sm btn-outline" @click="openEditModal(c)">แก้ไข</button>
              <button v-if="deletingId !== c._id" class="btn btn-sm btn-outline btn-danger-outline" @click="deletingId = c._id">ลบ</button>
              <template v-else>
                <button class="btn btn-sm btn-danger" @click="doDelete(c._id)">ยืนยัน</button>
                <button class="btn btn-sm btn-outline" @click="deletingId = null">ยกเลิก</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Usage Modal -->
    <div v-if="usageModal.show" class="modal-overlay" @click.self="usageModal.show = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📎 ใช้ใน Section</h3>
          <button class="modal-close" @click="usageModal.show = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="usage-title">"{{ usageModal.contentTitle }}"</div>
          <div v-if="usageModal.loading" class="empty-state">กำลังโหลด...</div>
          <div v-else-if="usageModal.usage.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <div>Content นี้ยังไม่ถูกใช้ที่ไหน</div>
          </div>
          <div v-else class="usage-list">
            <div v-for="s in usageModal.usage" :key="s._id" class="usage-item">
              <div class="usage-item-head">
                <router-link :to="'/admin/sections?edit=' + s._id" class="section-link">
                  <b>{{ s.code }}</b> — {{ s.name }}
                </router-link>
                <span class="usage-count">{{ s.videos.length }} วีดีโอ</span>
              </div>
              <div class="usage-videos">
                <div v-for="v in s.videos" :key="v.index" class="usage-video">
                  <span class="usage-idx">#{{ v.index + 1 }}</span>
                  <span class="usage-vtitle">{{ v.title || '(ไม่มีชื่อ)' }}</span>
                  <span v-if="v.topic" class="usage-topic">📂 {{ v.topic }}<span v-if="v.subtopic"> › {{ v.subtopic }}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="usageModal.show = false">ปิด</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ modal.editId ? '✏️ แก้ไข Content' : '+ เพิ่ม Content ใหม่' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>ชื่อ Content <span class="required">*</span></label>
            <input v-model="modal.title" type="text" class="form-control" placeholder="เช่น B1 Microbiology 8" />
          </div>
          <div class="form-row-3">
            <div class="form-row">
              <label>Tag Lv1</label>
              <input v-model="modal.tagLv1" type="text" class="form-control" placeholder="หมวดหลัก" list="lib-tags-lv1" />
              <datalist id="lib-tags-lv1"><option v-for="t in tags.tagLv1" :key="t" :value="t"></option></datalist>
            </div>
            <div class="form-row">
              <label>Tag Lv2</label>
              <input v-model="modal.tagLv2" type="text" class="form-control" placeholder="หมวดย่อย" list="lib-tags-lv2" />
              <datalist id="lib-tags-lv2"><option v-for="t in tags.tagLv2" :key="t" :value="t"></option></datalist>
            </div>
            <div class="form-row">
              <label>Tag Lv3</label>
              <input v-model="modal.tagLv3" type="text" class="form-control" placeholder="หัวข้อย่อย" list="lib-tags-lv3" />
              <datalist id="lib-tags-lv3"><option v-for="t in tags.tagLv3" :key="t" :value="t"></option></datalist>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-row">
              <label>🌐 Bunny NoDRM ID <span class="required">*</span></label>
              <input v-model="modal.bunnyVideoId" type="text" class="form-control mono" placeholder="Bunny UUID" />
            </div>
            <div class="form-row">
              <label>🌐 Bunny Widevine ID <span class="required">*</span></label>
              <input v-model="modal.bunnyDrmVideoId" type="text" class="form-control mono" placeholder="Bunny UUID" />
            </div>
          </div>
          <div class="form-row">
            <label>🇨🇳 Ali Video ID (dual encryption) <span class="required">*</span></label>
            <div class="ali-verify-row">
              <input v-model="modal.aliVideoId" type="text" class="form-control mono" placeholder="Ali VideoId (1 ID มี Ali Prop + Widevine)" @input="onAliVideoIdChange" />
              <button type="button" class="btn btn-outline btn-verify" @click="verifyAliDual" :disabled="!modal.aliVideoId || aliVerify.loading">
                {{ aliVerify.loading ? '⏳' : '🔍 Verify' }}
              </button>
            </div>
            <div v-if="aliVerify.result" class="ali-verify-result" :class="aliVerify.result.valid ? 'valid' : 'invalid'">
              <div class="verify-status">
                <span v-if="aliVerify.result.valid">✅ Dual encryption OK</span>
                <span v-else>❌ ไม่ครบ</span>
              </div>
              <div class="verify-reason">{{ aliVerify.result.reason }}</div>
              <div v-if="aliVerify.result.encryptTypes && aliVerify.result.encryptTypes.length" class="verify-details">
                <span class="enc-badge" :class="{ ok: aliVerify.result.hasAliProp }">{{ aliVerify.result.hasAliProp ? '✓' : '✗' }} Ali Prop</span>
                <span class="enc-badge" :class="{ ok: aliVerify.result.hasWidevine }">{{ aliVerify.result.hasWidevine ? '✓' : '✗' }} Widevine</span>
              </div>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-row">
              <label>ระยะเวลา</label>
              <input v-model="modal.duration" type="text" class="form-control" placeholder="79:02" />
            </div>
            <div class="form-row">
              <label>Notes</label>
              <input v-model="modal.notes" type="text" class="form-control" placeholder="โน้ตช่วยจำ..." />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal" :disabled="modal.saving">ยกเลิก</button>
          <button class="btn btn-primary" @click="submitModal" :disabled="!canSubmit || modal.saving">
            {{ modal.saving ? 'กำลังบันทึก...' : '💾 บันทึก' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ContentLibrary',
  data() {
    return {
      loading: false,
      contents: [],
      tags: { tagLv1: [], tagLv2: [], tagLv3: [] },
      filters: { search: '', tagLv1: '', tagLv2: '', tagLv3: '' },
      deletingId: null,
      _debounceTimer: null,
      usageCounts: {},  // { contentId: count }
      usageModal: {
        show: false,
        loading: false,
        contentTitle: '',
        usage: []
      },
      modal: {
        show: false,
        editId: null,
        saving: false,
        title: '', tagLv1: '', tagLv2: '', tagLv3: '',
        bunnyVideoId: '', bunnyDrmVideoId: '', aliVideoId: '',
        duration: '', notes: ''
      },
      aliVerify: {
        loading: false,
        result: null,
        verifiedVideoId: ''  // เก็บ ID ที่ verify pass ล่าสุด
      }
    }
  },
  computed: {
    canSubmit() {
      const m = this.modal
      // ต้องมี title + Bunny×2 + Ali×1 + Ali verified pass
      const baseOk = m.title.trim() && m.bunnyVideoId && m.bunnyDrmVideoId && m.aliVideoId
      const aliVerified = this.aliVerify.result?.valid && this.aliVerify.verifiedVideoId === m.aliVideoId
      return baseOk && aliVerified
    }
  },
  mounted() {
    this.load()
    this.loadTags()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const params = {}
        if (this.filters.search) params.search = this.filters.search
        if (this.filters.tagLv1) params.tagLv1 = this.filters.tagLv1
        if (this.filters.tagLv2) params.tagLv2 = this.filters.tagLv2
        if (this.filters.tagLv3) params.tagLv3 = this.filters.tagLv3
        const res = await api.get('/admin/video-contents', { params })
        this.contents = res.contents || []
        // Fetch usage counts in parallel (best-effort, non-blocking)
        this.fetchUsageCounts()
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    async fetchUsageCounts() {
      const counts = {}
      await Promise.all(
        this.contents.map(async (c) => {
          try {
            const r = await api.get(`/admin/video-contents/${c._id}/usage`)
            counts[c._id] = r.count || 0
          } catch (e) {
            counts[c._id] = 0
          }
        })
      )
      this.usageCounts = counts
    },
    async openUsageModal(content) {
      this.usageModal = {
        show: true,
        loading: true,
        contentTitle: content.title,
        usage: []
      }
      try {
        const r = await api.get(`/admin/video-contents/${content._id}/usage`)
        this.usageModal.usage = r.usage || []
      } catch (e) {
        this.usageModal.usage = []
      } finally {
        this.usageModal.loading = false
      }
    },
    async loadTags() {
      try {
        const res = await api.get('/admin/video-contents/tags')
        this.tags = { tagLv1: res.tagLv1 || [], tagLv2: res.tagLv2 || [], tagLv3: res.tagLv3 || [] }
      } catch (e) {}
    },
    debouncedLoad() {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = setTimeout(() => this.load(), 300)
    },
    clearFilters() {
      this.filters = { search: '', tagLv1: '', tagLv2: '', tagLv3: '' }
      this.load()
    },
    resetAliVerify() {
      this.aliVerify = { loading: false, result: null, verifiedVideoId: '' }
    },
    onAliVideoIdChange() {
      // Clear verify result เมื่อ user แก้ ID (บังคับ verify ใหม่)
      if (this.aliVerify.verifiedVideoId !== this.modal.aliVideoId) {
        this.aliVerify.result = null
        this.aliVerify.verifiedVideoId = ''
      }
    },
    async verifyAliDual() {
      const vid = (this.modal.aliVideoId || '').trim()
      if (!vid) return
      this.aliVerify.loading = true
      this.aliVerify.result = null
      try {
        const res = await api.get(`/admin/ali/verify-dual/${vid}`)
        const data = res && res.data ? res.data : res
        this.aliVerify.result = data
        if (data.valid) this.aliVerify.verifiedVideoId = vid
      } catch (err) {
        this.aliVerify.result = {
          valid: false,
          reason: err.response?.data?.reason || err.response?.data?.error || err.message
        }
      } finally {
        this.aliVerify.loading = false
      }
    },
    openNewModal() {
      this.modal = {
        show: true, editId: null, saving: false,
        title: '', tagLv1: '', tagLv2: '', tagLv3: '',
        bunnyVideoId: '', bunnyDrmVideoId: '', aliVideoId: '',
        duration: '', notes: ''
      }
      this.resetAliVerify()
    },
    openEditModal(c) {
      this.modal = {
        show: true, editId: c._id, saving: false,
        title: c.title,
        tagLv1: c.tagLv1 || '', tagLv2: c.tagLv2 || '', tagLv3: c.tagLv3 || '',
        bunnyVideoId: c.bunnyVideoId,
        bunnyDrmVideoId: c.bunnyDrmVideoId,
        aliVideoId: c.aliVideoId,
        duration: c.duration || '',
        notes: c.notes || ''
      }
      this.resetAliVerify()
    },
    closeModal() {
      this.modal.show = false
      this.resetAliVerify()
    },
    async submitModal() {
      this.modal.saving = true
      try {
        await api.post('/admin/video-contents', {
          title: this.modal.title.trim(),
          tagLv1: this.modal.tagLv1.trim(),
          tagLv2: this.modal.tagLv2.trim(),
          tagLv3: this.modal.tagLv3.trim(),
          bunnyVideoId: this.modal.bunnyVideoId.trim(),
          bunnyDrmVideoId: this.modal.bunnyDrmVideoId.trim(),
          aliVideoId: this.modal.aliVideoId.trim(),
          duration: this.modal.duration.trim(),
          notes: this.modal.notes.trim()
        })
        this.closeModal()
        await Promise.all([this.load(), this.loadTags()])
      } catch (err) {
        alert('บันทึกไม่สำเร็จ: ' + (err.response?.data?.error || err.message))
      } finally {
        this.modal.saving = false
      }
    },
    async doDelete(id) {
      try {
        await api.delete('/admin/video-contents/' + id)
        this.deletingId = null
        await this.load()
      } catch (err) {
        alert('ลบไม่สำเร็จ: ' + (err.response?.data?.error || err.message))
      }
    },
    formatDate(d) {
      if (!d) return ''
      const dt = new Date(d)
      return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear() + 543}`
    }
  }
}
</script>

<style scoped>
.content-library-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}
.page-header h1 { margin: 0 0 4px; font-size: 22px; color: #1e293b; }
.subtitle { margin: 0; color: #64748b; font-size: 13px; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.stat-chip {
  background: #eff6ff;
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.filter-bar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 16px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
}
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-state .hint {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  background: #f8fafc;
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.table tr:hover { background: #fafbfc; }

.content-title { font-weight: 600; color: #1e293b; }
.content-notes {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.tag-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.tag-chip.lv1 { background: #dbeafe; color: #1e40af; }
.tag-chip.lv2 { background: #ede9fe; color: #6d28d9; }
.tag-chip.lv3 { background: #fce7f3; color: #be185d; }

.duration {
  font-family: 'SF Mono', Menlo, monospace;
  font-variant-numeric: tabular-nums;
  color: #64748b;
}

.id-grid { display: flex; gap: 4px; }
.id-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  cursor: help;
}
.id-badge.bunny { background: #dcfce7; color: #166534; }
.id-badge.bunny.drm { background: #86efac; color: #14532d; }
.id-badge.ali { background: #fee2e2; color: #991b1b; }
.id-badge.ali.drm { background: #fca5a5; color: #7f1d1d; }

.date {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.btn-sm { padding: 4px 10px; font-size: 11px; }
.btn-primary { background: #2563eb; color: white; border-color: #2563eb; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: white; color: #475569; border-color: #cbd5e1; }
.btn-outline:hover { background: #f8fafc; }
.btn-danger { background: #dc2626; color: white; border-color: #dc2626; }
.btn-danger:hover { background: #b91c1c; }
.btn-danger-outline { color: #dc2626; border-color: #fca5a5; }
.btn-danger-outline:hover { background: #fef2f2; }

.form-control {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.15s;
}
.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.form-control.mono { font-family: 'SF Mono', Menlo, monospace; font-size: 12px; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white;
  border-radius: 12px;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-close {
  background: none; border: none; font-size: 18px; cursor: pointer;
  color: #6b7280; padding: 4px 8px; border-radius: 6px;
}
.modal-close:hover { background: #f3f4f6; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.form-row { margin-bottom: 12px; }
.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.form-row .required { color: #ef4444; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

.usage-btn {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
}
.usage-btn:hover { transform: translateY(-1px); }

.usage-title {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 600;
  color: #9a3412;
  margin-bottom: 14px;
}
.usage-list { display: flex; flex-direction: column; gap: 10px; }
.usage-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.usage-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.section-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 13px;
}
.section-link:hover { text-decoration: underline; }
.usage-count {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.usage-videos { padding: 6px 12px; }
.usage-video {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
  color: #475569;
}
.usage-idx {
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 10px;
  color: #64748b;
}
.usage-vtitle { flex: 1; font-weight: 500; color: #1e293b; }
.usage-topic { font-size: 10px; color: #94a3b8; }

@media (max-width: 640px) {
  .filter-bar { grid-template-columns: 1fr; }
  .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
}

/* Ali Verify Dual Encryption UI */
.ali-verify-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.ali-verify-row .form-control {
  flex: 1;
}
.btn-verify {
  white-space: nowrap;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
}
.ali-verify-result {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}
.ali-verify-result.valid {
  background: #ecfdf5;
  border: 1px solid #86efac;
  color: #166534;
}
.ali-verify-result.invalid {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}
.verify-status { font-weight: 700; margin-bottom: 4px; }
.verify-reason { font-size: 12px; opacity: 0.85; margin-bottom: 6px; }
.verify-details { display: flex; gap: 6px; flex-wrap: wrap; }
.enc-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: #fee2e2;
  color: #991b1b;
}
.enc-badge.ok {
  background: #dcfce7;
  color: #166534;
}
</style>
