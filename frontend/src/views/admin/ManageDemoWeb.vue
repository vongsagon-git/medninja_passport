<template>
  <div class="admin-page">
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h1>Demo Web Videos</h1>
          <p class="page-sub">วีดีโอตัวอย่างที่แสดงหน้าเว็บ (ดูได้โดยไม่ต้อง login)</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline" @click="syncDurations" :disabled="syncing">{{ syncing ? 'กำลัง Sync...' : 'Sync เวลา' }}</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}</button>
        </div>
      </div>
    </div>

    <div v-if="error" style="background:#fee;border:1px solid #fcc;padding:12px 16px;border-radius:8px;color:#c00;margin-bottom:16px;">{{ error }}</div>
    <div v-if="successMsg" style="background:#d1fae5;border:1px solid #6ee7b7;padding:12px 16px;border-radius:8px;color:#065f46;margin-bottom:16px;">{{ successMsg }}</div>

    <div v-if="loading" style="text-align:center;padding:60px;color:#94a3b8;">กำลังโหลด...</div>
    <template v-else>
      <!-- Section Info -->
      <div class="card" style="margin-bottom:16px;">
        <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 12px;">ข้อมูล Section</h3>
        <div class="form-group">
          <label>ชื่อ Section</label>
          <input v-model="config.sectionName" class="form-control" />
        </div>
        <div class="form-group">
          <label>คำอธิบาย</label>
          <input v-model="config.sectionDescription" class="form-control" />
        </div>
        <div class="form-group">
          <label>Intro Video ID (หน้า Home — วีดีโอแนะนำ/โฆษณา)</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input v-model="config.introVideoId" class="form-control" placeholder="Protection UUID" style="font-family:monospace;font-size:12px;flex:1;" :disabled="introLocked" />
            <input v-model="config.introDrmVideoId" class="form-control" placeholder="Widevine UUID" style="font-family:monospace;font-size:12px;flex:1;border-color:#16a34a;" :disabled="introLocked" />
            <span v-if="introLocked" style="cursor:pointer;font-size:16px;" @click="unlockIntro" title="กดปลดล็อค">🔒</span>
          </div>
          <small style="color:#94a3b8;">Protection (628424) | Widevine (626874)</small>
        </div>
      </div>

      <!-- Videos List -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin:0;">วีดีโอ ({{ config.videos.length }})</h3>
          <button class="btn btn-sm btn-primary" @click="addVideo">+ เพิ่ม Video</button>
        </div>

        <div v-for="(vid, idx) in config.videos" :key="idx" class="video-row">
          <div class="vr-num">{{ idx + 1 }}</div>
          <div class="vr-fields">
            <div class="vr-row">
              <div style="flex:1;">
                <label>ชื่อ</label>
                <input v-model="vid.title" class="form-control" placeholder="เช่น Demo NL" :disabled="vid._locked" />
              </div>
              <div style="width:100px;">
                <label>ลำดับ</label>
                <input v-model.number="vid.order" type="number" class="form-control" :disabled="vid._locked" />
              </div>
            </div>
            <div class="vr-row">
              <div style="flex:1;">
                <label>Protection UUID</label>
                <input v-model="vid.bunnyVideoId" class="form-control" placeholder="xxxx-xxxx-xxxx" style="font-family:monospace;font-size:12px;" :disabled="vid._locked" />
              </div>
              <div style="flex:1;">
                <label>Widevine UUID</label>
                <input v-model="vid.bunnyDrmVideoId" class="form-control" placeholder="xxxx-xxxx-xxxx" style="font-family:monospace;font-size:12px;border-color:#16a34a;" :disabled="vid._locked" />
              </div>
              <div style="width:80px;">
                <label>เวลา</label>
                <input v-model="vid.duration" class="form-control" placeholder="--:--" readonly style="color:#94a3b8;" />
              </div>
              <div v-if="vid._locked" style="align-self:flex-end;padding-bottom:4px;">
                <span style="cursor:pointer;font-size:16px;" @click="unlockVideo(idx)" title="กดปลดล็อค">🔒</span>
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-danger vr-del" @click="removeVideo(idx)" :disabled="vid._locked" title="ลบ">&times;</button>
        </div>

        <div v-if="config.videos.length === 0" style="text-align:center;padding:40px;color:#94a3b8;">
          ยังไม่มี video — กด "+ เพิ่ม Video"
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageDemoWeb',
  data() {
    return {
      config: { sectionName: '', sectionDescription: '', videos: [], introVideoId: '', introDrmVideoId: '' },
      introLocked: false,
      loading: false,
      saving: false,
      syncing: false,
      error: null,
      successMsg: ''
    }
  },
  async mounted() {
    await this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const d = await api.get('/admin/demo-web')
        this.config = d.config
        // set lock state
        this.introLocked = !!(this.config.introVideoId && this.config.introDrmVideoId)
        if (this.config.videos) {
          this.config.videos.forEach(v => { v._locked = !!(v.bunnyVideoId && v.bunnyDrmVideoId) })
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดล้มเหลว'
      } finally { this.loading = false }
    },
    addVideo() {
      this.config.videos.push({ title: '', bunnyVideoId: '', bunnyDrmVideoId: '', duration: '', order: this.config.videos.length })
    },
    removeVideo(idx) {
      this.config.videos.splice(idx, 1)
    },
    async save() {
      this.saving = true
      this.error = null
      try {
        // เช็คความยาว DRM UUID ตรงกับ Protection UUID ก่อน save
        for (const vid of this.config.videos) {
          if (!vid.bunnyDrmVideoId) continue
          try {
            const info = await api.get(`/admin/bunny/video/${vid.bunnyDrmVideoId.trim()}`)
            let drmDur = ''
            if (info.length != null) {
              const m = Math.floor(info.length / 60)
              const s = info.length % 60
              drmDur = `${m}:${String(s).padStart(2, '0')}`
            }
            const protDur = (vid.duration || '').replace('--:--', '')
            if (protDur && drmDur && protDur !== drmDur) {
              this.error = `"${vid.title}" — ความยาวไม่ตรง! Protection: ${protDur}, Widevine: ${drmDur}`
              this.saving = false
              return
            }
          } catch {
            this.error = `Widevine UUID ไม่ถูกต้อง: ${vid.bunnyDrmVideoId}`
            this.saving = false
            return
          }
        }
        // เช็ค Intro DRM UUID
        if (this.config.introDrmVideoId) {
          try {
            await api.get(`/admin/bunny/video/${this.config.introDrmVideoId.trim()}`)
          } catch {
            this.error = `Intro Widevine UUID ไม่ถูกต้อง: ${this.config.introDrmVideoId}`
            this.saving = false
            return
          }
        }
        const d = await api.put('/admin/demo-web', this.config)
        this.config = d.config
        this.successMsg = 'บันทึกเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกล้มเหลว'
      } finally { this.saving = false }
    },
    unlockVideo(idx) {
      const pwd = prompt('กรอกรหัสเพื่อแก้ไข:')
      if (pwd === 'medninja') { this.config.videos[idx]._locked = false }
      else if (pwd !== null) { alert('รหัสไม่ถูกต้อง') }
    },
    unlockIntro() {
      const pwd = prompt('กรอกรหัสเพื่อแก้ไข:')
      if (pwd === 'medninja') { this.introLocked = false }
      else if (pwd !== null) { alert('รหัสไม่ถูกต้อง') }
    },
    async syncDurations() {
      this.syncing = true
      try {
        const d = await api.post('/admin/demo-web/sync-durations')
        this.successMsg = `Sync เวลาเสร็จ — อัปเดต ${d.updated} video`
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.load()
      } catch (err) {
        this.error = err.response?.data?.message || 'Sync ล้มเหลว'
      } finally { this.syncing = false }
    }
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: var(--primary); margin: 0; }
.page-sub { color: #64748b; font-size: 13px; margin-top: 4px; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }

.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; }

.video-row {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px; margin-bottom: 8px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
}
.vr-num {
  width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff;
  font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 20px;
}
.vr-fields { flex: 1; }
.vr-row { display: flex; gap: 8px; margin-bottom: 6px; }
.vr-row label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 2px; }
.vr-del { margin-top: 20px; font-size: 18px; padding: 4px 10px; }
</style>
