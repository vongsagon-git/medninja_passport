<template>
  <div class="mc-page">
    <!-- Toast -->
    <Transition name="mc-toast">
      <div v-if="toast" class="mc-toast" :class="'mc-toast-'+toast.kind">{{ toast.msg }}</div>
    </Transition>

    <!-- Header -->
    <div class="mc-header">
      <div class="mc-header-icon">🛠️</div>
      <div>
        <h1>Maintenance Circuit</h1>
        <p>ปิดปรับปรุงเฉพาะบางส่วนของระบบ — user จะเห็นหน้า "กำลังปรับปรุง" พร้อมข้อความที่ตั้ง</p>
      </div>
      <button class="all-off-btn" @click="allOff" :disabled="!hasAnyOn">
        ⏻ ปิดทั้งหมด
      </button>
    </div>

    <div v-if="loading" class="mc-loading">
      <div class="spinner"></div>
      <p>กำลังโหลด...</p>
    </div>

    <div v-else class="mc-grid">
      <div
        v-for="b in breakers"
        :key="b.scope"
        class="mc-card"
        :class="{ enabled: b.enabled }"
      >
        <div class="mc-card-header">
          <div class="mc-scope-icon">{{ scopeInfo[b.scope].icon }}</div>
          <div class="mc-scope-info">
            <div class="mc-scope-name">{{ scopeInfo[b.scope].name }}</div>
            <div class="mc-scope-desc">{{ scopeInfo[b.scope].desc }}</div>
          </div>
          <label class="mc-toggle">
            <input type="checkbox" :checked="b.enabled" @change="toggle(b, $event.target.checked)">
            <span class="mc-toggle-slider"></span>
          </label>
        </div>

        <div class="mc-status" :class="b.enabled ? 'status-blocked' : 'status-normal'">
          <span class="mc-status-dot"></span>
          <span v-if="b.enabled">กำลังปรับปรุง — user ถูกกัน</span>
          <span v-else>ปกติ — user เข้าได้</span>
        </div>

        <div class="mc-affected">
          <div class="mc-affected-label">Path ที่ถูกกัน:</div>
          <code v-for="p in scopeInfo[b.scope].paths" :key="p">{{ p }}</code>
        </div>

        <div class="mc-field">
          <label>ข้อความแจ้ง user:</label>
          <textarea
            v-model="b.message"
            @blur="save(b)"
            rows="3"
            placeholder="ไอทีกำลังปรับปรุงเนื้อหา&#10;จะใช้ได้เร็วๆนี้ ขออภัยในความไม่สะดวก"
          ></textarea>
        </div>

        <div class="mc-field">
          <label>กำหนดกลับมา (optional):</label>
          <input
            type="datetime-local"
            :value="formatDateTimeLocal(b.estimatedReturn)"
            @change="updateEta(b, $event.target.value)"
          >
          <button v-if="b.estimatedReturn" class="mc-clear-btn" @click="updateEta(b, '')">ล้าง</button>
        </div>

        <div v-if="b.updatedAt" class="mc-meta">
          อัพเดทล่าสุด: {{ new Date(b.updatedAt).toLocaleString('th-TH') }}
        </div>
      </div>
    </div>

    <div class="mc-footer">
      <div class="mc-info-card">
        <div class="mc-info-title">💡 หลักการทำงาน</div>
        <ul>
          <li><strong>Admin bypass:</strong> หน้า /admin/* จะไม่ถูกกัน (fail-safe เสมอ)</li>
          <li><strong>Real-time:</strong> เปลี่ยนแล้วมีผลภายใน 5 วินาที (Valkey cache)</li>
          <li><strong>Custom message:</strong> ข้อความที่ตั้ง จะแสดงในหน้ากำลังปรับปรุง</li>
          <li><strong>Preview:</strong> เปิด incognito แล้ว login เป็นนักเรียนเพื่อทดสอบ</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'MaintenanceCircuit',
  data () {
    return {
      loading: true,
      breakers: [],
      toast: null,
      scopeInfo: {
        my: {
          name: 'MY — ทั้งระบบเรียน',
          desc: 'ปิดทุกอย่างที่เข้า /my/*',
          icon: '📚',
          paths: ['/my', '/my/section/*', '/my/watch/*', '/my/meq', '/my/synapse', '/my/osce']
        },
        section: {
          name: 'SECTION — หน้ารายการวิดีโอ',
          desc: 'user เห็น dashboard ได้ แต่กด section แล้วเจอหน้าปรับปรุง',
          icon: '📋',
          paths: ['/my/section/*']
        },
        watch: {
          name: 'WATCH — หน้าดูวิดีโอ',
          desc: 'user เห็น dashboard + section list ได้ แต่ดู video ไม่ได้',
          icon: '▶️',
          paths: ['/my/watch/*']
        },
        live: {
          name: 'LIVE — ห้องเรียนสด + Q&A',
          desc: 'ปิดเฉพาะ live streaming และ Q&A',
          icon: '🔴',
          paths: ['/live/*', '/qa/*']
        }
      }
    }
  },
  computed: {
    hasAnyOn () {
      return this.breakers.some(b => b.enabled)
    }
  },
  methods: {
    formatDateTimeLocal (iso) {
      if (!iso) return ''
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
    showToast (msg, kind = 'success') {
      this.toast = { msg, kind }
      setTimeout(() => { this.toast = null }, 2500)
    },
    async load () {
      this.loading = true
      try {
        const data = await api.get('/admin/circuit')
        this.breakers = data.breakers
      } catch (err) {
        this.showToast('โหลดข้อมูลไม่ได้', 'error')
      } finally {
        this.loading = false
      }
    },
    async toggle (b, enabled) {
      b.enabled = enabled
      try {
        await api.post('/admin/circuit', { scope: b.scope, enabled })
        this.showToast(enabled ? `⚠️ ปิด ${b.scope} แล้ว` : `✅ เปิด ${b.scope} ปกติ`, enabled ? 'warning' : 'success')
      } catch (err) {
        b.enabled = !enabled
        this.showToast('เปลี่ยนสถานะไม่ได้', 'error')
      }
    },
    async save (b) {
      try {
        await api.post('/admin/circuit', { scope: b.scope, message: b.message })
        this.showToast('บันทึกข้อความแล้ว')
      } catch {
        this.showToast('บันทึกไม่ได้', 'error')
      }
    },
    async updateEta (b, value) {
      const iso = value ? new Date(value).toISOString() : null
      b.estimatedReturn = iso
      try {
        await api.post('/admin/circuit', { scope: b.scope, estimatedReturn: iso })
        this.showToast(iso ? 'ตั้งเวลากลับมาแล้ว' : 'ล้างเวลาแล้ว')
      } catch {
        this.showToast('บันทึกไม่ได้', 'error')
      }
    },
    async allOff () {
      if (!confirm('ปิด maintenance ทุก scope ใช่หรือไม่?')) return
      try {
        await api.post('/admin/circuit/all-off')
        await this.load()
        this.showToast('✅ ปิด maintenance ทั้งหมดแล้ว')
      } catch {
        this.showToast('ปิดไม่สำเร็จ', 'error')
      }
    }
  },
  mounted () {
    this.load()
  }
}
</script>

<style scoped>
.mc-page { padding: 24px; max-width: 1200px; margin: 0 auto; font-family: 'Noto Sans Thai', sans-serif; }

/* Header */
.mc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #f1f5f9; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
.mc-header-icon { font-size: 36px; }
.mc-header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #f1f5f9; }
.mc-header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
.all-off-btn { margin-left: auto; padding: 10px 20px; background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.4); color: #fca5a5; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all .2s; font-family: inherit; }
.all-off-btn:hover:not(:disabled) { background: rgba(239,68,68,.25); transform: translateY(-1px); }
.all-off-btn:disabled { opacity: .4; cursor: not-allowed; }

/* Loading */
.mc-loading { text-align: center; padding: 80px; color: #64748b; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Grid */
.mc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

/* Card */
.mc-card { background: #fff; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; transition: all .25s; }
.mc-card.enabled { border-color: #f59e0b; background: linear-gradient(180deg, #fffbeb, #fff); box-shadow: 0 4px 16px rgba(245,158,11,.15); }

.mc-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.mc-scope-icon { font-size: 32px; }
.mc-scope-info { flex: 1; }
.mc-scope-name { font-size: 15px; font-weight: 800; color: #1e293b; }
.mc-scope-desc { font-size: 12px; color: #64748b; margin-top: 2px; }

/* Toggle */
.mc-toggle { position: relative; display: inline-block; width: 52px; height: 28px; }
.mc-toggle input { opacity: 0; width: 0; height: 0; }
.mc-toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; border-radius: 999px; transition: .3s; }
.mc-toggle-slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
.mc-toggle input:checked + .mc-toggle-slider { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.mc-toggle input:checked + .mc-toggle-slider:before { transform: translateX(24px); }

/* Status */
.mc-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 14px; }
.mc-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-normal { background: #dcfce7; color: #166534; }
.status-normal .mc-status-dot { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,.6); animation: pulse 2s infinite; }
.status-blocked { background: #fef3c7; color: #92400e; }
.status-blocked .mc-status-dot { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,.6); animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

/* Affected paths */
.mc-affected { margin-bottom: 14px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; }
.mc-affected-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.mc-affected code { display: inline-block; margin: 2px 4px 2px 0; padding: 2px 6px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 11px; font-family: 'Fira Code', monospace; }

/* Fields */
.mc-field { margin-bottom: 12px; }
.mc-field label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px; }
.mc-field textarea, .mc-field input[type=datetime-local] { width: 100%; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; color: #1e293b; box-sizing: border-box; }
.mc-field textarea { resize: vertical; min-height: 60px; }
.mc-field textarea:focus, .mc-field input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.mc-clear-btn { margin-top: 6px; padding: 4px 10px; background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #64748b; cursor: pointer; font-family: inherit; }
.mc-clear-btn:hover { background: #f8fafc; }

.mc-meta { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }

/* Footer */
.mc-footer { margin-top: 32px; }
.mc-info-card { background: linear-gradient(135deg, #eff6ff, #eef2ff); border: 1px solid #dbeafe; border-radius: 12px; padding: 20px; }
.mc-info-title { font-size: 14px; font-weight: 800; color: #1e40af; margin-bottom: 10px; }
.mc-info-card ul { margin: 0; padding-left: 20px; }
.mc-info-card li { font-size: 13px; color: #334155; line-height: 1.8; }

/* Toast */
.mc-toast { position: fixed; top: 20px; right: 20px; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.mc-toast-success { background: #22c55e; color: #fff; }
.mc-toast-warning { background: #f59e0b; color: #fff; }
.mc-toast-error { background: #ef4444; color: #fff; }
.mc-toast-enter-active, .mc-toast-leave-active { transition: all .3s; }
.mc-toast-enter-from, .mc-toast-leave-to { opacity: 0; transform: translateY(-20px); }
</style>
