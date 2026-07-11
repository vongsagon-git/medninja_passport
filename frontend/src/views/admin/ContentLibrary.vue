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
                <span class="id-badge ali" :title="'Ali NoDRM: ' + c.aliVideoId">🇨🇳 A</span>
                <span class="id-badge ali drm" :title="'Ali Widevine: ' + c.aliDrmVideoId">🇨🇳 AD</span>
              </div>
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
          <div class="form-row-2">
            <div class="form-row">
              <label>🇨🇳 Ali NoDRM ID <span class="required">*</span></label>
              <input v-model="modal.aliVideoId" type="text" class="form-control mono" placeholder="Ali VideoId" />
            </div>
            <div class="form-row">
              <label>🇨🇳 Ali Widevine ID <span class="required">*</span></label>
              <input v-model="modal.aliDrmVideoId" type="text" class="form-control mono" placeholder="Ali VideoId" />
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
      modal: {
        show: false,
        editId: null,
        saving: false,
        title: '', tagLv1: '', tagLv2: '', tagLv3: '',
        bunnyVideoId: '', bunnyDrmVideoId: '', aliVideoId: '', aliDrmVideoId: '',
        duration: '', notes: ''
      }
    }
  },
  computed: {
    canSubmit() {
      const m = this.modal
      return m.title.trim() && m.bunnyVideoId && m.bunnyDrmVideoId && m.aliVideoId && m.aliDrmVideoId
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
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
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
    openNewModal() {
      this.modal = {
        show: true, editId: null, saving: false,
        title: '', tagLv1: '', tagLv2: '', tagLv3: '',
        bunnyVideoId: '', bunnyDrmVideoId: '', aliVideoId: '', aliDrmVideoId: '',
        duration: '', notes: ''
      }
    },
    openEditModal(c) {
      this.modal = {
        show: true, editId: c._id, saving: false,
        title: c.title,
        tagLv1: c.tagLv1 || '', tagLv2: c.tagLv2 || '', tagLv3: c.tagLv3 || '',
        bunnyVideoId: c.bunnyVideoId,
        bunnyDrmVideoId: c.bunnyDrmVideoId,
        aliVideoId: c.aliVideoId,
        aliDrmVideoId: c.aliDrmVideoId,
        duration: c.duration || '',
        notes: c.notes || ''
      }
    },
    closeModal() { this.modal.show = false },
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
          aliDrmVideoId: this.modal.aliDrmVideoId.trim(),
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

@media (max-width: 640px) {
  .filter-bar { grid-template-columns: 1fr; }
  .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
}
</style>
