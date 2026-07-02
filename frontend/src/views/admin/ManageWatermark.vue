<template>
  <div class="admin-page">
    <div class="page-header">
      <h1>ตั้งค่าลายน้ำ</h1>
      <p class="page-sub">สูตร: fontSize = basePx × (W / baseWidth)</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
    <div v-if="loading" style="text-align:center;padding:40px;color:#94a3b8;">กำลังโหลด...</div>

    <template v-else>
      <!-- สูตร Scale -->
      <div class="card">
        <h2 class="card-title">สูตร Scale</h2>
        <table class="setting-table">
          <tr>
            <td class="label-col">Center base width</td>
            <td>
              <div class="val-row">
                <input v-model.number="config.centerBaseWidth" type="number" min="100" max="3000" class="num-input" />
                <span class="unit">px</span>
                <span class="hint">ตั้ง basePx ที่จอกว้างเท่านี้ ค่าปัจจุบัน: <b>{{ config.centerBaseWidth || 384 }}</b></span>
              </div>
            </td>
          </tr>
          <tr>
            <td class="label-col">Grid base width</td>
            <td>
              <div class="val-row">
                <input v-model.number="config.gridBaseWidth" type="number" min="100" max="3000" class="num-input" />
                <span class="unit">px</span>
                <span class="hint">ตั้ง basePx ที่จอกว้างเท่านี้ ค่าปัจจุบัน: <b>{{ config.gridBaseWidth || 1280 }}</b></span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Breakpoint -->
      <div class="card">
        <h2 class="card-title">Breakpoint (Desktop grid → center)</h2>
        <table class="setting-table">
          <tr>
            <td class="label-col">คอร์สจริง</td>
            <td>
              <div class="val-row">
                <span>จอ &lt;</span>
                <input v-model.number="config.desktopBreakpoint" type="number" min="400" max="2000" class="num-input" />
                <span class="unit">px → center</span>
                <span class="hint">ค่าปัจจุบัน: <b>{{ config.desktopBreakpoint || 900 }}</b></span>
              </div>
            </td>
          </tr>
          <tr>
            <td class="label-col">Demo</td>
            <td>
              <div class="val-row">
                <span>จอ &lt;</span>
                <input v-model.number="config.demoDesktopBreakpoint" type="number" min="400" max="2000" class="num-input" />
                <span class="unit">px → center</span>
                <span class="hint">ค่าปัจจุบัน: <b>{{ config.demoDesktopBreakpoint || 900 }}</b></span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- คอร์สจริง -->
      <div class="card">
        <h2 class="card-title">คอร์สเรียนจริง</h2>
        <table class="mode-table">
          <thead><tr><th>Mode</th><th>รูปแบบ</th><th>Base (px)</th></tr></thead>
          <tbody>
            <tr v-for="m in normalModes" :key="m.key">
              <td class="mode-name">{{ m.label }}</td>
              <td><select v-model="config[m.key].style" class="sel"><option value="grid">เส้นทะแยง</option><option value="center">กลางจอ</option></select></td>
              <td>
                <div class="sz">
                  <button class="sz-btn" @click="adj(m.key,-1)">-</button>
                  <input v-model.number="config[m.key].fontSize" type="number" min="8" max="60" class="num-input num-sm" />
                  <button class="sz-btn" @click="adj(m.key,1)">+</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Demo -->
      <div class="card">
        <h2 class="card-title demo">Demo (ทดลองเรียน)</h2>
        <table class="mode-table">
          <thead><tr><th>Mode</th><th>รูปแบบ</th><th>Base (px)</th></tr></thead>
          <tbody>
            <tr v-for="m in demoModes" :key="m.key">
              <td class="mode-name">{{ m.label }}</td>
              <td><select v-model="config[m.key].style" class="sel"><option value="grid">เส้นทะแยง</option><option value="center">กลางจอ</option></select></td>
              <td>
                <div class="sz">
                  <button class="sz-btn" @click="adj(m.key,-1)">-</button>
                  <input v-model.number="config[m.key].fontSize" type="number" min="8" max="60" class="num-input num-sm" />
                  <button class="sz-btn" @click="adj(m.key,1)">+</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="btn btn-primary btn-lg" @click="save" :disabled="saving" style="margin-top:20px;">
        {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
      </button>
    </template>
  </div>
</template>

<script>
import api from '../../services/api'

const N = [
  { key: 'mobilePortrait', label: 'Mobile แนวตั้ง' },
  { key: 'mobileLandscape', label: 'Mobile แนวนอน' },
  { key: 'mobilePortraitFull', label: 'Mobile แนวตั้ง Fullscreen' },
  { key: 'mobileLandscapeFull', label: 'Mobile แนวนอน Fullscreen' },
  { key: 'desktopPortrait', label: 'Desktop แนวตั้ง' },
  { key: 'desktopLandscape', label: 'Desktop แนวนอน' },
  { key: 'desktopPortraitFull', label: 'Desktop แนวตั้ง Fullscreen' },
  { key: 'desktopLandscapeFull', label: 'Desktop แนวนอน Fullscreen' }
]
const D = [
  { key: 'demoMobilePortrait', label: 'Mobile แนวตั้ง' },
  { key: 'demoMobileLandscape', label: 'Mobile แนวนอน' },
  { key: 'demoMobilePortraitFull', label: 'Mobile แนวตั้ง Fullscreen' },
  { key: 'demoMobileLandscapeFull', label: 'Mobile แนวนอน Fullscreen' },
  { key: 'demoDesktopPortrait', label: 'Desktop แนวตั้ง' },
  { key: 'demoDesktopLandscape', label: 'Desktop แนวนอน' },
  { key: 'demoDesktopPortraitFull', label: 'Desktop แนวตั้ง Fullscreen' },
  { key: 'demoDesktopLandscapeFull', label: 'Desktop แนวนอน Fullscreen' }
]

export default {
  name: 'ManageWatermark',
  data() {
    return { normalModes: N, demoModes: D, config: {}, loading: true, saving: false, error: '', successMsg: '' }
  },
  async mounted() {
    try {
      const data = await api.get('/admin/watermark')
      this.config = data.config
    } catch (e) {
      this.error = e.response?.data?.message || 'โหลดไม่สำเร็จ'
    } finally {
      this.loading = false
    }
  },
  methods: {
    adj(key, delta) {
      const v = (this.config[key].fontSize || 18) + delta
      if (v >= 8 && v <= 60) this.config[key].fontSize = v
    },
    async save() {
      this.saving = true
      this.error = ''
      this.successMsg = ''
      try {
        const data = await api.put('/admin/watermark', this.config)
        this.config = data.config
        this.successMsg = 'บันทึกสำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (e) {
        this.error = e.response?.data?.message || 'บันทึกไม่สำเร็จ'
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: var(--primary); margin: 0; }
.page-sub { color: #64748b; font-size: 13px; margin-top: 4px; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 800; color: var(--primary); margin: 0 0 12px; }
.card-title.demo { color: #2563eb; }

.setting-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.setting-table td { padding: 8px 0; vertical-align: middle; }
.label-col { font-weight: 700; color: var(--primary); width: 140px; white-space: nowrap; }
.val-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hint { font-size: 11px; color: #94a3b8; }
.hint b { color: var(--primary); }
.unit { font-size: 12px; color: #64748b; }

.mode-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mode-table th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: 700; color: #475569; }
.mode-table td { padding: 7px 10px; border-top: 1px solid #f1f5f9; vertical-align: middle; }
.mode-name { font-weight: 600; color: var(--primary); white-space: nowrap; }

.sel { padding: 5px 8px; font-size: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
.num-input { width: 65px; padding: 5px 6px; font-size: 13px; font-weight: 700; text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; }
.num-sm { width: 48px; }

.sz { display: flex; gap: 3px; align-items: center; }
.sz-btn {
  width: 26px; height: 26px; border: 1px solid #e2e8f0; border-radius: 6px;
  background: #f8fafc; font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--primary);
}
.sz-btn:hover { background: #eef2ff; }

.alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
.alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

@media (max-width: 768px) {
  .label-col { width: auto; display: block; margin-bottom: 4px; }
  .setting-table td { display: block; padding: 4px 0; }
  .num-input { width: 55px; }
}
</style>
