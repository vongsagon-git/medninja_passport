<template>
  <div class="admin-page">
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <div>
            <h1>Video-PDF Map</h1>
            <p>จัดการ PDF ทุก video — ศูนย์กลางเดียว</p>
          </div>
          <button class="btn btn-refresh" @click="load" :disabled="loading">{{ loading ? 'โหลด...' : 'Refresh' }}</button>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Stats -->
      <div v-if="stats" class="stats-bar">
        <div class="stat-item"><span class="stat-num">{{ stats.totalVideos }}</span><span class="stat-label">Video ทั้งหมด</span></div>
        <div class="stat-item stat-green"><span class="stat-num">{{ stats.withPdf }}</span><span class="stat-label">มี PDF</span></div>
        <div class="stat-item stat-red"><span class="stat-num">{{ stats.withoutPdf }}</span><span class="stat-label">ไม่มี PDF</span></div>
        <div class="stat-item stat-yellow" v-if="stats.orphanPdfs > 0"><span class="stat-num">{{ stats.orphanPdfs }}</span><span class="stat-label">PDF กำพร้า</span></div>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Search + filter -->
      <div class="toolbar">
        <input v-model="search" class="search-input" placeholder="ค้นหาชื่อ video หรือ UUID..." />
        <div class="filter-tabs">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">ทั้งหมด</button>
          <button :class="{ active: filter === 'hasPdf' }" @click="filter = 'hasPdf'">มี PDF</button>
          <button :class="{ active: filter === 'noPdf' }" @click="filter = 'noPdf'">ไม่มี PDF</button>
        </div>
      </div>

      <div v-if="loading" style="text-align:center;padding:60px;color:#94a3b8;">กำลังโหลดจาก Bunny...</div>

      <!-- Video table -->
      <div v-else class="video-list">
        <div v-for="v in filteredVideos" :key="v.guid" class="video-row">
          <div class="video-info">
            <div class="video-title">{{ v.title || '(ไม่มีชื่อ)' }}</div>
            <div class="video-meta">
              <span class="video-uuid">{{ v.guid }}</span>
              <span v-if="v.length"> · {{ formatDuration(v.length) }}</span>
            </div>
          </div>
          <div class="video-actions">
            <span v-if="v.hasPdf" class="pdf-badge pdf-yes">PDF</span>
            <span v-else class="pdf-badge pdf-no">ไม่มี PDF</span>

            <label v-if="!v.hasPdf" class="btn-upload" :class="{ uploading: uploadingId === v.guid }">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
              {{ uploadingId === v.guid ? 'กำลังอัพ...' : 'อัพโหลด PDF' }}
              <input type="file" accept=".pdf" style="display:none" @change="uploadPdf($event, v)" :disabled="uploadingId === v.guid" />
            </label>

            <button v-if="v.hasPdf" class="btn-delete-pdf" @click="deletePdf(v)" :disabled="deletingId === v.guid">
              {{ deletingId === v.guid ? 'ลบ...' : 'ลบ PDF' }}
            </button>
          </div>
        </div>
        <div v-if="filteredVideos.length === 0" class="empty-state">ไม่พบ video</div>
      </div>

      <!-- Orphan PDFs -->
      <div v-if="orphanPdfs.length > 0" class="orphan-section">
        <h3>PDF กำพร้า — ไม่ตรงกับ video ไหน</h3>
        <div v-for="f in orphanPdfs" :key="f" class="orphan-row">
          <span class="orphan-name">{{ f }}</span>
          <button class="btn-delete-orphan" @click="deleteOrphan(f)">ลบ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'VideoPdfMap',
  data() {
    return {
      videos: [],
      orphanPdfs: [],
      stats: null,
      loading: false,
      error: null,
      successMsg: '',
      search: '',
      filter: 'all',
      uploadingId: null,
      deletingId: null
    }
  },
  computed: {
    filteredVideos() {
      let list = this.videos
      if (this.filter === 'hasPdf') list = list.filter(v => v.hasPdf)
      if (this.filter === 'noPdf') list = list.filter(v => !v.hasPdf)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(v => (v.title || '').toLowerCase().includes(q) || v.guid.includes(q))
      }
      return list
    }
  },
  async mounted() { await this.load() },
  methods: {
    async load() {
      this.loading = true
      this.error = null
      try {
        const d = await api.get('/admin/video-pdf-map')
        this.videos = d.videos || []
        this.orphanPdfs = d.orphanPdfs || []
        this.stats = d.stats || null
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดล้มเหลว'
      } finally { this.loading = false }
    },
    async uploadPdf(event, video) {
      const file = event.target.files?.[0]
      if (!file) return
      this.uploadingId = video.guid
      try {
        const formData = new FormData()
        formData.append('pdf', file)
        const token = localStorage.getItem('token')
        const resp = await fetch(`/api/admin/video-pdf-map/upload/${video.guid}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })
        if (resp.ok) {
          video.hasPdf = true
          if (this.stats) { this.stats.withPdf++; this.stats.withoutPdf-- }
          this.successMsg = `อัพโหลด PDF สำเร็จ — ${video.title}`
          setTimeout(() => { this.successMsg = '' }, 3000)
        } else {
          const d = await resp.json().catch(() => ({}))
          this.error = d.message || 'อัพโหลดไม่สำเร็จ'
        }
      } catch (e) { this.error = e.message }
      finally { this.uploadingId = null; event.target.value = '' }
    },
    async deletePdf(video) {
      if (!confirm(`ลบ PDF ของ "${video.title}" ?`)) return
      this.deletingId = video.guid
      try {
        await api.delete(`/admin/video-pdf-map/${video.guid}`)
        video.hasPdf = false
        if (this.stats) { this.stats.withPdf--; this.stats.withoutPdf++ }
        this.successMsg = 'ลบ PDF แล้ว'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (e) { this.error = e.response?.data?.message || 'ลบไม่สำเร็จ' }
      finally { this.deletingId = null }
    },
    async deleteOrphan(fileName) {
      if (!confirm(`ลบ PDF กำพร้า "${fileName}" ?`)) return
      try {
        await api.delete(`/admin/video-pdf-map/orphan/${fileName}`)
        this.orphanPdfs = this.orphanPdfs.filter(f => f !== fileName)
        if (this.stats) this.stats.orphanPdfs--
        this.successMsg = 'ลบ PDF กำพร้าแล้ว'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch { this.error = 'ลบไม่สำเร็จ' }
    },
    formatDuration(sec) {
      if (!sec) return ''
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      const s = Math.floor(sec % 60)
      if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      return `${m}:${String(s).padStart(2,'0')}`
    }
  }
}
</script>

<style scoped>
.admin-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%); padding: 32px 0; color: white; }
.admin-hero-inner { display: flex; align-items: center; gap: 16px; }
.admin-hero-icon { width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.admin-hero h1 { font-size: 22px; font-weight: 800; margin: 0 0 3px; }
.admin-hero p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
.btn-refresh { margin-left: auto; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
.btn-refresh:hover { background: rgba(255,255,255,0.25); }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.section { padding: 24px 20px; }

.stats-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 20px; flex: 1; min-width: 120px; text-align: center; }
.stat-num { display: block; font-size: 28px; font-weight: 900; color: #0f172a; }
.stat-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
.stat-green .stat-num { color: #16a34a; }
.stat-red .stat-num { color: #dc2626; }
.stat-yellow .stat-num { color: #f59e0b; }

.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
.alert-error { background: #fee; border: 1px solid #fcc; color: #c00; }
.alert-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

.toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 200px; padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #3b82f6; }
.filter-tabs { display: flex; gap: 4px; }
.filter-tabs button { padding: 6px 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; }
.filter-tabs button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

.video-list { display: flex; flex-direction: column; gap: 1px; background: #e2e8f0; border-radius: 12px; overflow: hidden; }
.video-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; gap: 12px; }
.video-info { flex: 1; min-width: 0; }
.video-title { font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.video-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.video-uuid { font-family: monospace; font-size: 10px; }
.video-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pdf-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pdf-yes { background: #d1fae5; color: #065f46; }
.pdf-no { background: #fee2e2; color: #991b1b; }
.btn-upload { display: inline-flex; align-items: center; gap: 4px; background: #3b82f6; color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
.btn-upload:hover { opacity: 0.85; }
.btn-upload.uploading { opacity: 0.5; cursor: wait; }
.btn-delete-pdf { background: none; border: 1px solid #fecaca; color: #dc2626; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
.btn-delete-pdf:hover { background: #fef2f2; }
.empty-state { text-align: center; padding: 40px; color: #94a3b8; background: #fff; }

.orphan-section { margin-top: 24px; background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; }
.orphan-section h3 { font-size: 14px; font-weight: 700; color: #92400e; margin: 0 0 12px; }
.orphan-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #fde68a; }
.orphan-row:last-child { border-bottom: none; }
.orphan-name { font-family: monospace; font-size: 12px; color: #78350f; }
.btn-delete-orphan { background: none; border: 1px solid #f59e0b; color: #92400e; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
.btn-delete-orphan:hover { background: #fef3c7; }

@media (max-width: 640px) {
  .stats-bar { flex-direction: column; }
  .video-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .video-actions { align-self: flex-end; }
}
</style>
