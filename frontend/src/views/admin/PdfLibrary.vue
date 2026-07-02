<template>
  <div class="admin-page">
    <div class="admin-hero">
      <div class="container">
        <h1>📄 PDF Library</h1>
        <p>จัดการไฟล์ PDF ใน Bunny Storage — upload, rename, ลบ, ดูว่าใช้ที่ไหน</p>
      </div>
    </div>

    <div class="container section">
      <!-- Upload -->
      <div class="upload-bar">
        <input type="file" accept=".pdf" ref="fileInput" @change="handleFiles" multiple style="display:none">
        <button class="btn btn-primary" @click="$refs.fileInput.click()">📤 Upload PDF</button>
        <div v-if="uploadFiles.length" style="flex:1">
          <div v-for="(f, i) in uploadFiles" :key="i" style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;">
            <span style="flex:1;font-weight:600">{{ f.name }}</span>
            <span style="color:#94a3b8">{{ formatSize(f.size) }}</span>
            <button class="btn-sm btn-cancel" @click="uploadFiles.splice(i, 1)">✕</button>
          </div>
        </div>
        <button v-if="uploadFiles.length" class="btn btn-success" @click="uploadAll()" :disabled="uploading">{{ uploading ? `กำลังอัปโหลด ${uploadProgress}/${uploadFiles.length}...` : `✓ อัปโหลด ${uploadFiles.length} ไฟล์` }}</button>
      </div>

      <div v-if="msg" :class="['msg', msgType]">{{ msg }}</div>

      <!-- File list -->
      <div v-if="loading" class="loading">กำลังโหลด...</div>
      <table v-else class="file-table">
        <thead>
          <tr>
            <th>ชื่อไฟล์</th>
            <th class="num">ขนาด</th>
            <th>วันที่</th>
            <th>ใช้ที่</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in files" :key="f.name" :class="{ orphan: f.usedCount === 0 }">
            <td>
              <template v-if="renamingFile === f.name">
                <input type="text" v-model="renameValue" class="input-rename" @keyup.enter="doRename(f.name)">
                <button class="btn-sm btn-ok" @click="doRename(f.name)">✓</button>
                <button class="btn-sm btn-cancel" @click="renamingFile=null">✕</button>
              </template>
              <template v-else>
                <span class="file-name">{{ f.name }}</span>
              </template>
            </td>
            <td class="num">{{ formatSize(f.size) }}</td>
            <td class="date">{{ f.date ? new Date(f.date).toLocaleDateString('th-TH', {day:'numeric',month:'short'}) : '—' }}</td>
            <td>
              <span v-if="f.usedCount === 0" class="tag tag-orphan">ไม่ได้ใช้</span>
              <span v-else class="tag tag-used">{{ f.usedCount }} ที่</span>
              <div v-if="f.usedIn && f.usedIn.length" style="font-size:10px;color:#94a3b8;margin-top:2px">
                <div v-for="u in f.usedIn.slice(0,3)" :key="u.path||u.section">{{ u.path || (u.section + (u.video ? ' → '+u.video : '')) }}</div>
                <div v-if="f.usedIn.length > 3">+{{ f.usedIn.length - 3 }} อื่นๆ</div>
              </div>
            </td>
            <td class="actions">
              <button class="btn-sm btn-rename" @click="startRename(f.name)">✏️</button>
              <button class="btn-sm btn-del" @click="deleteFile(f.name)">🗑️</button>
            </td>
          </tr>
          <tr v-if="files.length === 0">
            <td colspan="5" style="text-align:center;color:#94a3b8;padding:40px">ยังไม่มีไฟล์ PDF</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'
export default {
  name: 'PdfLibrary',
  data() {
    return {
      files: [], loading: true,
      uploadFiles: [], uploading: false, uploadProgress: 0,
      renamingFile: null, renameValue: '',
      msg: '', msgType: 'success'
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      this.loading = true
      try {
        const data = await api.get('/admin/pdf-library')
        this.files = (data.files || []).sort((a, b) => a.name.localeCompare(b.name))
      } catch (e) { console.error(e) }
      this.loading = false
    },
    handleFiles(e) {
      this.uploadFiles = [...(e.target.files || [])]
    },
    async uploadAll() {
      if (!this.uploadFiles.length) return
      this.uploading = true
      this.uploadProgress = 0
      const token = localStorage.getItem('token')
      let ok = 0, fail = 0
      for (const file of this.uploadFiles) {
        this.uploadProgress++
        try {
          const fd = new FormData()
          fd.append('pdf', file)
          fd.append('fileName', file.name.replace('.pdf', ''))
          const resp = await fetch('/api/admin/pdf-library/upload', {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
          })
          const d = await resp.json()
          if (d.ok) ok++; else fail++
        } catch { fail++ }
      }
      this.showMsg(`อัปโหลดสำเร็จ ${ok} ไฟล์${fail ? ` (ล้มเหลว ${fail})` : ''}`, fail ? 'error' : 'success')
      this.uploadFiles = []
      this.uploading = false
      this.load()
    },
    startRename(name) { this.renamingFile = name; this.renameValue = name.replace('.pdf', '') },
    async doRename(oldName) {
      if (!this.renameValue.trim()) return
      try {
        await api.post('/admin/pdf-library/rename', { oldName, newName: this.renameValue })
        this.showMsg(`เปลี่ยนชื่อสำเร็จ`, 'success')
        this.renamingFile = null
        this.load()
      } catch (e) { this.showMsg(e.message, 'error') }
    },
    async deleteFile(name) {
      if (!confirm(`ลบ ${name}?`)) return
      if (!confirm('ยืนยัน — ลบแล้วกู้คืนไม่ได้!')) return
      try {
        await api.delete(`/admin/pdf-library/${name}`)
        this.showMsg('ลบสำเร็จ', 'success')
        this.load()
      } catch (e) { this.showMsg(e.message, 'error') }
    },
    formatSize(bytes) {
      if (!bytes) return '0'
      if (bytes < 1024) return bytes + 'B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB'
      return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    },
    showMsg(text, type) { this.msg = text; this.msgType = type; setTimeout(() => { this.msg = '' }, 4000) }
  }
}
</script>

<style scoped>
.admin-page{min-height:100vh;background:#f8fafc}
.admin-hero{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:32px 0}
.container{max-width:1000px;margin:0 auto;padding:0 24px}
.admin-hero h1{font-size:24px;font-weight:800;margin-bottom:4px}
.admin-hero p{font-size:13px;color:#94a3b8}
.section{padding:24px 0}
.upload-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px;padding:16px;background:#fff;border-radius:12px;border:1px solid #e2e8f0}
.input-name{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;width:200px;font-family:'Noto Sans Thai',sans-serif}
.input-rename{padding:4px 8px;border-radius:6px;border:1px solid #3b82f6;font-size:12px;width:200px;font-family:'Noto Sans Thai',sans-serif}
.btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Noto Sans Thai',sans-serif}
.btn-primary{background:#3b82f6;color:#fff}.btn-primary:hover{background:#2563eb}
.btn-success{background:#22c55e;color:#fff}.btn-success:hover{background:#16a34a}
.btn-sm{padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid #e2e8f0;background:#fff}
.btn-rename{color:#f59e0b;border-color:#fcd34d}.btn-rename:hover{background:#fffbeb}
.btn-del{color:#ef4444;border-color:#fca5a5}.btn-del:hover{background:#fef2f2}
.btn-ok{color:#22c55e;border-color:#86efac;margin-left:4px}.btn-cancel{color:#94a3b8;margin-left:2px}
.msg{padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:12px}
.msg.success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.msg.error{background:#fef2f2;color:#ef4444;border:1px solid #fecaca}
.file-table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
.file-table th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px}
.file-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
.file-table .num{text-align:right;font-family:monospace}
.file-table .date{font-size:11px;color:#94a3b8}
.file-table .actions{display:flex;gap:4px}
.file-name{font-weight:600;color:#1e293b}
.tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;display:inline-block}
.tag-orphan{background:#fef2f2;color:#ef4444}
.tag-used{background:#f0fdf4;color:#16a34a}
.orphan{background:#fffbeb}
.loading{text-align:center;padding:40px;color:#94a3b8}
@media(max-width:640px){
  .upload-bar{flex-direction:column;align-items:stretch}
  .input-name{width:100%}
  .file-table{font-size:11px}
  .file-table th,.file-table td{padding:6px 8px}
}
</style>
