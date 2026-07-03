<template>
  <div class="auth-page">
    <!-- ── Thin device header (top strip) ── -->
    <div class="device-header" :title="deviceUA">
      <span class="dh-item">
        <span class="dh-dot" :class="'dh-dot-' + deviceCategory"></span>
        <span class="dh-label">{{ deviceCategoryLabel }}</span>
      </span>
      <span class="dh-sep">·</span>
      <span class="dh-item">{{ deviceOS }}</span>
      <span class="dh-sep">·</span>
      <span class="dh-item">{{ deviceBrowser }}</span>
      <span class="dh-sep dh-hide-sm">·</span>
      <span class="dh-item dh-hide-sm">{{ screenSize }}</span>
    </div>

    <!-- ICU Monitor Background — ECG waveforms + grid -->
    <div class="auth-bg" aria-hidden="true">
      <div class="scan-grid"></div>
      <div class="ecg-track ecg-track-1">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L200,50 L215,50 L220,20 L225,80 L230,10 L235,90 L240,50 L400,50 L415,50 L420,20 L425,80 L430,10 L435,90 L440,50 L600,50 L615,50 L620,20 L625,80 L630,10 L635,90 L640,50 L800,50 L815,50 L820,20 L825,80 L830,10 L835,90 L840,50 L1000,50 L1015,50 L1020,20 L1025,80 L1030,10 L1035,90 L1040,50 L1200,50" />
        </svg>
      </div>
      <div class="ecg-track ecg-track-2">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 Q100,50 150,50 T280,50 L295,45 L310,55 L325,20 L340,80 L355,50 L500,50 Q600,50 650,50 T780,50 L795,45 L810,55 L825,20 L840,80 L855,50 L1000,50 Q1100,50 1150,50 L1200,50" />
        </svg>
      </div>
      <div class="ecg-track ecg-track-3">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 L100,50 L130,60 L150,40 L170,50 L280,50 L295,25 L305,75 L315,50 L500,50 L530,60 L550,40 L570,50 L680,50 L695,25 L705,75 L715,50 L900,50 L930,60 L950,40 L970,50 L1080,50 L1095,25 L1105,75 L1115,50 L1200,50" />
        </svg>
      </div>

      <!-- Top-left monitor label -->
      <div class="monitor-label monitor-label-tl">
        <div class="label-title">MEDNINJA ICU</div>
        <div class="label-line">CH.1  HR   BPM</div>
        <div class="label-line">CH.2  SpO2 %</div>
        <div class="label-line">CH.3  RESP /min</div>
      </div>

      <!-- Top-right readout -->
      <div class="monitor-label monitor-label-tr">
        <div class="readout">
          <div class="readout-label">HR</div>
          <div class="readout-value">72</div>
          <div class="readout-unit">bpm</div>
        </div>
        <div class="readout readout-sp">
          <div class="readout-label">SpO2</div>
          <div class="readout-value">98</div>
          <div class="readout-unit">%</div>
        </div>
      </div>

      <!-- Bottom-left status -->
      <div class="monitor-label monitor-label-bl">
        <div class="status-dot"></div>
        <span>MONITORING — SESSION READY</span>
      </div>

      <!-- Bottom-right timestamp -->
      <div class="monitor-label monitor-label-br">
        {{ nowString }}
      </div>
    </div>

    <!-- Centered card -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <template v-if="true">
          <!-- Brand mini-header -->
          <div class="brand-mini">
            <div class="brand-mini-logo">
              <img src="/logo.png" alt="MedNinja" />
            </div>
            <div class="brand-mini-text">
              <div class="brand-mini-title">MedNinja</div>
              <div class="brand-mini-sub">Passport</div>
            </div>
            <div class="brand-mini-status">
              <span class="brand-mini-dot"></span>
              <span>ONLINE</span>
            </div>
          </div>

          <div class="auth-header">
            <h2>เข้าสู่ระบบ</h2>
            <p>ใช้เลขบัตรประชาชนและรหัสผ่านที่ได้จาก Ninja Passport</p>
          </div>

          <!-- Verify result messages -->
          <div v-if="verifySuccess" class="verify-success-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>ยืนยันอีเมลสำเร็จ! สามารถเข้าสู่ระบบได้เลย</span>
          </div>
          <div v-if="verifyUsed" class="verify-info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>ลิงก์นี้ถูกยืนยันแล้ว สามารถเข้าสู่ระบบได้เลย</span>
          </div>

          <AlertMessage :message="error" type="error" />

          <!-- Email not verified warning -->
          <div v-if="emailNotVerified" class="verify-box">
            <p>กรุณาตรวจสอบอีเมล <strong>{{ unverifiedEmail }}</strong> แล้วกดลิงก์ยืนยัน</p>
            <button type="button" class="btn-resend" :disabled="resending" @click="resendVerify">
              {{ resending ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง' }}
            </button>
            <p v-if="resendMsg" class="resend-msg">{{ resendMsg }}</p>
          </div>

          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-group">
              <label class="form-label">เลขบัตรประชาชน</label>
              <div class="input-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-13.5v13.5"/>
                </svg>
                <input v-model="form.nationalId" type="text" inputmode="numeric" class="form-control input-with-icon" placeholder="x-xxxx-xxxxx-xx-x" required maxlength="17" @input="formatNid" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">รหัสผ่าน</label>
              <div class="input-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path stroke-linecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="form-control input-with-icon input-with-icon-right" placeholder="รหัสผ่าน" required />
                <button type="button" class="input-eye" @click="showPass = !showPass" tabindex="-1">
                  <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg auth-submit" :disabled="loading">
              <svg v-if="loading" class="spin-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
            </button>
          </form>

          <p class="auth-register-link">
            ยังไม่มีบัญชี? <a href="/ninja-passport">ลงทะเบียนผ่าน Ninja Passport</a>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import AlertMessage from '../components/common/AlertMessage.vue'
import { getOS, getBrowser, getDeviceCategory } from '../utils/deviceDetect'

export default {
  name: 'LoginPage',
  components: { AlertMessage },
  data() {
    return {
      form: { nationalId: '', password: '' },
      error: '',
      loading: false,
      showPass: false,
      emailNotVerified: false,
      unverifiedEmail: '',
      resending: false,
      resendMsg: '',
      verifySuccess: false,
      verifyUsed: false,
      nowString: '',
      _clockTimer: null,
      _resizeHandler: null,
      screenSize: '',
      deviceOS: '',
      deviceBrowser: '',
      deviceCategory: 'desktop',
      deviceUA: ''
    }
  },
  computed: {
    deviceCategoryLabel() {
      const map = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
      return map[this.deviceCategory] || 'Device'
    }
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    return { authStore, router, route }
  },
  mounted() {
    const q = this.route.query
    if (q.verified === 'true') {
      this.verifySuccess = true
    } else if (q.verify === 'used' || q.verify === 'invalid') {
      this.verifyUsed = true
    }
    this._updateClock()
    this._clockTimer = setInterval(() => this._updateClock(), 1000)

    // ── Detect device (using LMS-standard utils) ──
    this._detectDevice()
    this._updateScreenSize()
    this._resizeHandler = () => this._updateScreenSize()
    window.addEventListener('resize', this._resizeHandler, { passive: true })
    window.addEventListener('orientationchange', this._resizeHandler, { passive: true })
  },
  beforeUnmount() {
    if (this._clockTimer) clearInterval(this._clockTimer)
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
      window.removeEventListener('orientationchange', this._resizeHandler)
    }
  },
  methods: {
    _updateClock() {
      const d = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      this.nowString = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}  ·  ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
    },
    _detectDevice() {
      try {
        this.deviceOS = getOS()
        this.deviceBrowser = getBrowser()
        this.deviceCategory = getDeviceCategory()
        this.deviceUA = navigator.userAgent || ''
      } catch {
        this.deviceOS = 'Unknown'
        this.deviceBrowser = 'Unknown'
        this.deviceCategory = 'desktop'
      }
    },
    _updateScreenSize() {
      this.screenSize = `${window.innerWidth}×${window.innerHeight}`
    },
    formatNid(e) {
      // Format: x-xxxx-xxxxx-xx-x
      let raw = e.target.value.replace(/\D/g, '').slice(0, 13)
      let formatted = ''
      if (raw.length > 0) formatted += raw[0]
      if (raw.length > 1) formatted += '-' + raw.slice(1, 5)
      if (raw.length > 5) formatted += '-' + raw.slice(5, 10)
      if (raw.length > 10) formatted += '-' + raw.slice(10, 12)
      if (raw.length > 12) formatted += '-' + raw[12]
      this.form.nationalId = formatted
    },
    async handleLogin() {
      this.loading = true
      this.error = ''
      this.emailNotVerified = false
      this.resendMsg = ''
      try {
        const cleanNid = this.form.nationalId.replace(/\D/g, '')
        await this.authStore.login({
          nationalId: cleanNid,
          password: this.form.password
        })
        // Redirect ตาม role
        if (this.authStore.user?.role === 'admin') {
          this.router.push('/admin')
        } else {
          this.router.push('/my')
        }
      } catch (err) {
        const data = err.response?.data
        if (data?.code === 'EMAIL_NOT_VERIFIED') {
          this.emailNotVerified = true
          this.unverifiedEmail = data.email || ''
          this.error = ''
        } else {
          this.error = data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
        }
      } finally {
        this.loading = false
      }
    },
    async resendVerify() {
      this.resending = true
      this.resendMsg = ''
      try {
        const cleanNid = this.form.nationalId.replace(/\D/g, '')
        const api = (await import('../services/api')).default
        const result = await api.post('/auth/resend-verify-public', { nationalId: cleanNid })
        this.resendMsg = result?.message || 'ส่งอีเมลยืนยันเรียบร้อย'
      } catch (err) {
        this.resendMsg = err.response?.data?.message || 'ส่งอีเมลไม่สำเร็จ ลองใหม่'
      } finally {
        this.resending = false
      }
    }
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   Medical Login — centered card + pulse bg
   ═══════════════════════════════════════════════ */

.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #0a1929 0%, #0d2847 40%, #0e3a5f 100%);
  overflow: hidden;
  font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── Thin device header (top strip) ── */
.device-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: 'Inter', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(186, 230, 253, 0.75);
  letter-spacing: 0.03em;
  background: linear-gradient(180deg, rgba(2, 8, 22, 0.55), rgba(2, 8, 22, 0));
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
  user-select: none;
  flex-wrap: wrap;
}
.dh-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.dh-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
  box-shadow: 0 0 6px rgba(100, 116, 139, 0.4);
}
.dh-dot-mobile   { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
.dh-dot-tablet   { background: #a78bfa; box-shadow: 0 0 6px rgba(167, 139, 250, 0.5); }
.dh-dot-desktop  { background: #34d399; box-shadow: 0 0 6px rgba(52, 211, 153, 0.5); }
.dh-label {
  font-weight: 700;
  color: rgba(224, 242, 254, 0.9);
}
.dh-sep {
  color: rgba(148, 163, 184, 0.4);
}
@media (max-width: 380px) {
  .device-header { font-size: 10px; padding: 6px 10px; }
  .dh-hide-sm { display: none; }
}

/* Subtle scanline overlay */
.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      rgba(125, 211, 252, 0.025) 0px,
      rgba(125, 211, 252, 0.025) 1px,
      transparent 1px,
      transparent 3px);
  pointer-events: none;
  z-index: 2;
  animation: scanline-flicker 8s linear infinite;
}
@keyframes scanline-flicker {
  0%, 96%, 100% { opacity: 1; }
  97% { opacity: 0.6; }
  98% { opacity: 1; }
  99% { opacity: 0.7; }
}

/* ── ICU Monitor Background ── */
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* Cross grid — diagnostic monitor */
.scan-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(125, 211, 252, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(125, 211, 252, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.02) 1px, transparent 1px);
  background-size: 80px 80px, 80px 80px, 16px 16px, 16px 16px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
}

/* ECG tracks — 3 stacked, offset by y-position */
.ecg-track {
  position: absolute;
  left: 0;
  width: 200%;
  height: 22vh;
  min-height: 130px;
  max-height: 200px;
  overflow: hidden;
  animation: ecg-scroll 6s linear infinite;
}
.ecg-track svg {
  width: 50%;
  height: 100%;
  display: block;
  float: left;
}
.ecg-track path {
  fill: none;
  stroke: #7dd3fc;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter:
    drop-shadow(0 0 4px rgba(125, 211, 252, 0.95))
    drop-shadow(0 0 12px rgba(56, 189, 248, 0.6))
    drop-shadow(0 0 24px rgba(14, 165, 233, 0.3));
}
.ecg-track-1 {
  top: 8%;
  animation-duration: 5s;
}
.ecg-track-2 {
  top: 40%;
  animation-duration: 6.5s;
}
.ecg-track-2 path {
  stroke: #67e8f9;
  filter:
    drop-shadow(0 0 4px rgba(103, 232, 249, 0.95))
    drop-shadow(0 0 12px rgba(34, 211, 238, 0.6))
    drop-shadow(0 0 24px rgba(6, 182, 212, 0.3));
}
.ecg-track-3 {
  top: 72%;
  animation-duration: 7s;
}
.ecg-track-3 path {
  stroke: #93c5fd;
  filter:
    drop-shadow(0 0 4px rgba(147, 197, 253, 0.95))
    drop-shadow(0 0 12px rgba(96, 165, 250, 0.55))
    drop-shadow(0 0 24px rgba(59, 130, 246, 0.28));
}

@keyframes ecg-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* ── Monitor labels/HUD ── */
.monitor-label {
  position: absolute;
  z-index: 1;
  font-family: 'Courier New', 'Fira Code', 'JetBrains Mono', monospace;
  color: #7dd3fc;
  text-shadow: 0 0 8px rgba(125, 211, 252, 0.55);
  letter-spacing: 0.08em;
  user-select: none;
  pointer-events: none;
}

.monitor-label-tl {
  top: 24px;
  left: 28px;
  font-size: 10px;
  line-height: 1.7;
  opacity: 0.9;
}
.monitor-label-tl .label-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin-bottom: 6px;
  color: #bae6fd;
}
.monitor-label-tl .label-line {
  opacity: 0.6;
}

.monitor-label-tr {
  top: 24px;
  right: 28px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.readout {
  padding: 6px 10px;
  border: 1px solid rgba(125, 211, 252, 0.35);
  border-radius: 4px;
  background: rgba(15, 42, 71, 0.4);
  backdrop-filter: blur(4px);
  min-width: 66px;
  text-align: center;
  animation: readout-blink 2s ease-in-out infinite;
}
.readout-sp {
  border-color: rgba(103, 232, 249, 0.35);
  animation-delay: 0.6s;
}
.readout-sp .readout-label,
.readout-sp .readout-value,
.readout-sp .readout-unit {
  color: #67e8f9;
  text-shadow: 0 0 8px rgba(103, 232, 249, 0.55);
}
.readout-label {
  font-size: 9px;
  letter-spacing: 0.15em;
  opacity: 0.7;
}
.readout-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.05;
  margin: 2px 0;
}
.readout-unit {
  font-size: 8px;
  opacity: 0.6;
}
@keyframes readout-blink {
  0%, 90%, 100% { opacity: 1; }
  92%, 94% { opacity: 0.4; }
}

.monitor-label-bl {
  bottom: 24px;
  left: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  letter-spacing: 0.14em;
  padding: 6px 12px;
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 999px;
  background: rgba(15, 42, 71, 0.4);
  backdrop-filter: blur(4px);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7dd3fc;
  box-shadow: 0 0 10px rgba(125, 211, 252, 0.9);
  animation: heartbeat 1.1s ease-in-out infinite;
}
@keyframes heartbeat {
  0%, 40%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(125, 211, 252, 0.9); }
  20% { transform: scale(1.55); box-shadow: 0 0 18px rgba(125, 211, 252, 1); }
  60% { transform: scale(1.3); box-shadow: 0 0 14px rgba(125, 211, 252, 0.95); }
}

.monitor-label-br {
  bottom: 24px;
  right: 28px;
  font-size: 10px;
  padding: 6px 12px;
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 4px;
  background: rgba(15, 42, 71, 0.4);
  backdrop-filter: blur(4px);
}

/* ── Card center ── */
.auth-form-panel {
  position: relative;
  z-index: 3;
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  padding: 36px 32px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.4),
    0 8px 24px rgba(14, 165, 233, 0.25),
    0 0 80px rgba(125, 211, 252, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  animation: card-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}
/* Corner brackets — targeting scope feel */
.auth-card::before,
.auth-card::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid #0ea5e9;
  filter: drop-shadow(0 0 6px rgba(14, 165, 233, 0.5));
  pointer-events: none;
}
.auth-card::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 20px;
}
.auth-card::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 20px;
}
@keyframes card-enter {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Brand mini header ── */
.brand-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.18);
  position: relative;
}
.brand-mini::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #0ea5e9, transparent);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.5);
}
.brand-mini-logo {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
  position: relative;
}
.brand-mini-logo::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 2px solid rgba(14, 165, 233, 0.5);
  animation: heart-pulse 1.1s ease-out infinite;
}
@keyframes heart-pulse {
  0% { transform: scale(1); opacity: 1; }
  60% { transform: scale(1.35); opacity: 0.4; }
  100% { transform: scale(1.55); opacity: 0; }
}
.brand-mini-logo img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}
.brand-mini-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  flex: 1;
}
.brand-mini-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}
.brand-mini-sub {
  font-size: 11px;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 3px;
}
.brand-mini-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid rgba(16, 185, 129, 0.35);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
}
.brand-mini-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.9);
  animation: heartbeat 1.1s ease-in-out infinite;
}

/* ── Login Header ── */
.auth-header { margin-bottom: 22px; }
.auth-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #eafff0;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
  text-shadow: 0 0 8px rgba(34, 255, 136, 0.2);
}
.auth-header p {
  color: #7fa695;
  font-size: 13px;
  line-height: 1.55;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}

/* Form group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #22ff88;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 6px rgba(34, 255, 136, 0.4);
}

/* Input */
.input-wrap { position: relative; }
.form-control {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  font-family: 'Courier New', 'Fira Code', monospace;
  font-size: 15px;
  font-weight: 500;
  color: #eafff0;
  background: rgba(0, 12, 6, 0.6);
  border: 1.5px solid rgba(34, 255, 136, 0.25);
  border-radius: 8px;
  outline: none;
  transition: all 0.18s ease;
  letter-spacing: 0.05em;
}
.form-control::placeholder {
  color: rgba(127, 166, 149, 0.5);
  font-weight: 400;
  letter-spacing: 0.05em;
}
.form-control:hover {
  border-color: rgba(34, 255, 136, 0.45);
  background: rgba(0, 20, 10, 0.7);
}
.form-control:focus {
  background: rgba(0, 20, 10, 0.85);
  border-color: #22ff88;
  box-shadow:
    0 0 0 3px rgba(34, 255, 136, 0.15),
    0 0 20px rgba(34, 255, 136, 0.25),
    inset 0 0 10px rgba(34, 255, 136, 0.05);
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(127, 166, 149, 0.6);
  pointer-events: none;
  z-index: 1;
  transition: color 0.18s ease, filter 0.18s ease;
}
.input-wrap:focus-within .input-icon {
  color: #22ff88;
  filter: drop-shadow(0 0 4px rgba(34, 255, 136, 0.7));
}

.input-with-icon { padding-left: 42px !important; }
.input-with-icon-right { padding-right: 44px !important; }

.input-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: rgba(127, 166, 149, 0.6);
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}
.input-eye:hover {
  color: #22ff88;
  background: rgba(34, 255, 136, 0.1);
}

/* Submit button */
.auth-submit {
  width: 100%;
  margin-top: 12px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 800;
  color: #001a0d;
  background: linear-gradient(135deg, #22ff88 0%, #00d966 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow:
    0 0 0 1px rgba(34, 255, 136, 0.6),
    0 8px 20px rgba(34, 255, 136, 0.35),
    0 0 30px rgba(34, 255, 136, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.15s ease;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  animation: submit-glow 2s ease-in-out infinite;
}
@keyframes submit-glow {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(34, 255, 136, 0.6),
      0 8px 20px rgba(34, 255, 136, 0.35),
      0 0 30px rgba(34, 255, 136, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(34, 255, 136, 0.8),
      0 10px 26px rgba(34, 255, 136, 0.5),
      0 0 44px rgba(34, 255, 136, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
  }
}
.auth-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  transition: left 0.7s ease;
}
.auth-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.08);
}
.auth-submit:hover:not(:disabled)::before { left: 100%; }
.auth-submit:active:not(:disabled) { transform: translateY(0); }
.auth-submit:disabled {
  opacity: 0.6;
  cursor: default;
  filter: saturate(0.5);
  animation: none;
}

.spin-icon-sm { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Register link ── */
.auth-register-link {
  text-align: center;
  font-size: 12.5px;
  color: #7fa695;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed rgba(34, 255, 136, 0.18);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}
.auth-register-link a {
  color: #22ff88;
  font-weight: 700;
  text-decoration: none;
  transition: filter 0.15s ease;
  text-shadow: 0 0 6px rgba(34, 255, 136, 0.5);
}
.auth-register-link a:hover {
  filter: brightness(1.2);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Verify result ── */
.verify-success-box, .verify-info-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 500;
}
.verify-success-box {
  background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.verify-success-box svg { color: #10b981; flex-shrink: 0; }
.verify-info-box {
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.verify-info-box svg { color: #0ea5e9; flex-shrink: 0; }

/* ── Email not verified ── */
.verify-box {
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
  text-align: center;
}
.verify-box p {
  font-size: 13.5px;
  color: #1e40af;
  margin: 0 0 10px;
  line-height: 1.55;
}
.verify-box strong { word-break: break-all; }
.btn-resend {
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.btn-resend:hover:not(:disabled) {
  background: #0284c7;
  transform: translateY(-1px);
}
.btn-resend:disabled { opacity: 0.5; cursor: default; }
.resend-msg {
  font-size: 12.5px;
  color: #059669;
  margin: 8px 0 0;
  font-weight: 600;
}

/* ─── Responsive ─── */

/* Tablet */
@media (max-width: 640px) {
  .auth-page { padding: 16px; }
  .auth-card {
    padding: 32px 24px;
    border-radius: 20px;
  }
  .brand-mini { margin-bottom: 24px; padding-bottom: 18px; }
  .brand-mini-logo { width: 40px; height: 40px; }
  .brand-mini-logo img { width: 22px; height: 22px; }
  .brand-mini-title { font-size: 16px; }
  .brand-mini-sub { font-size: 11px; }
  .auth-header h2 { font-size: 22px; }
  .auth-header p { font-size: 13px; }
  .form-control { height: 46px; font-size: 15px; }
  .form-control:focus { font-size: 15px; }
  .auth-submit { height: 48px; font-size: 14.5px; }
}

/* Small phone */
@media (max-width: 380px) {
  .auth-page { padding: 12px; }
  .auth-card { padding: 28px 20px; }
  .orb-1, .orb-2, .orb-3 { filter: blur(60px); }
}

/* Landscape phone — keep card readable */
@media (max-height: 640px) and (orientation: landscape) {
  .auth-page { padding: 16px; align-items: flex-start; }
  .auth-card {
    padding: 24px 28px;
    margin: 12px 0;
  }
  .brand-mini { margin-bottom: 16px; padding-bottom: 14px; }
  .auth-header { margin-bottom: 16px; }
  .auth-form { gap: 10px; }
  .form-control { height: 42px; }
  .auth-submit { height: 44px; margin-top: 6px; }
}

/* Larger screens — no navbar/footer since immersive */
@media (min-width: 641px) {
  .auth-page { padding: 40px; }
}

/* Reduce motion — accessibility */
@media (prefers-reduced-motion: reduce) {
  .orb, .brand-mini-logo::before, .auth-card {
    animation: none !important;
  }
  .auth-submit::before { display: none; }
}
</style>
