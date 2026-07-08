<template>
  <div class="auth-page">
    <!-- Device header ย้ายไปอยู่ใน CountryBanner (global banner บนสุด) -->

    <!-- ── Aurora background ── -->
    <div class="aurora" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>
    <div class="grid-overlay" aria-hidden="true"></div>

    <!-- ── Landscape hero (mobile landscape only) ── -->
    <aside class="landscape-hero" aria-hidden="true">
      <div class="lh-brand">
        <div class="lh-title">MedNinja</div>
        <div class="lh-sub">Passport</div>
      </div>
      <p class="lh-tagline">ระบบเรียนรู้<br>สำหรับนักศึกษาแพทย์</p>
    </aside>

    <!-- ── Centered card ── -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <!-- Brand — typography only -->
        <div class="brand-mini">
          <div class="brand-mini-text">
            <div class="brand-mini-title">MedNinja</div>
            <div class="brand-mini-sub">Passport</div>
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

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label class="form-label">เลขบัตรประชาชน</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-13.5v13.5"/>
              </svg>
              <input
                v-model="form.nationalId"
                type="text"
                inputmode="numeric"
                class="form-control input-with-icon"
                placeholder="x-xxxx-xxxxx-xx-x"
                required
                maxlength="17"
                @input="formatNid"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">รหัสผ่าน</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path stroke-linecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="form-control input-with-icon input-with-icon-right"
                placeholder="รหัสผ่าน"
                required
              />
              <button type="button" class="input-eye" @click="showPass = !showPass" tabindex="-1">
                <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="auth-submit" :disabled="loading">
            <svg v-if="loading" class="spin-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span>{{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
          </button>
        </form>

        <p class="auth-register-link">
          ยังไม่มีบัญชี? <a href="/ninja-passport">ลงทะเบียนผ่าน Ninja Passport</a>
        </p>
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
    this._detectDevice()
    this._updateScreenSize()
    this._resizeHandler = () => this._updateScreenSize()
    window.addEventListener('resize', this._resizeHandler, { passive: true })
    window.addEventListener('orientationchange', this._resizeHandler, { passive: true })
  },
  beforeUnmount() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
      window.removeEventListener('orientationchange', this._resizeHandler)
    }
  },
  methods: {
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

        // ⭐ Detect country จาก backend (ไม่ใช้ localStorage)
        let userCountry = 'TH'
        try {
          const geoResp = await fetch('/api/geo/whoami').then(r => r.json())
          userCountry = geoResp.country || 'TH'
        } catch {}

        if (this.authStore.user?.role === 'admin') {
          this.router.push('/admin')
        } else if (userCountry === 'CN') {
          this.router.push('/my-cn')
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
   Login — Aurora theme (Design B)
   ═══════════════════════════════════════════════ */

.auth-page {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #0c1e3d 0%, #0e3a5f 50%, #0a2540 100%);
  overflow: hidden;
  font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Landscape hero — hidden by default, shown only on mobile landscape */
.landscape-hero {
  display: none;
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
.dh-label { font-weight: 700; color: rgba(224, 242, 254, 0.9); }
.dh-sep { color: rgba(148, 163, 184, 0.4); }
@media (max-width: 380px) {
  .device-header { font-size: 10px; padding: 6px 10px; }
  .dh-hide-sm { display: none; }
}

/* ── Aurora blobs ── */
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  animation: float 14s ease-in-out infinite;
}
.blob-1 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, #0ea5e9, transparent 70%);
  top: -180px;
  left: -140px;
}
.blob-2 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
  bottom: -160px;
  right: -100px;
  animation-delay: -4s;
  animation-duration: 18s;
}
.blob-3 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
  animation-duration: 16s;
  animation-name: float3;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 20px) scale(0.95); }
}
@keyframes float3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-52%, -55%) scale(1.15); }
}

/* Grid overlay */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

/* ── Card ── */
.auth-form-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-card {
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 22px;
  padding: 40px 36px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(14, 165, 233, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  animation: card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-overflow-scrolling: touch;
}
/* Subtle scrollbar inside card */
.auth-card::-webkit-scrollbar { width: 4px; }
.auth-card::-webkit-scrollbar-thumb {
  background: rgba(14, 165, 233, 0.3);
  border-radius: 2px;
}
.auth-card::-webkit-scrollbar-track { background: transparent; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Brand (typography only, no logo) ── */
.brand-mini {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.12);
  position: relative;
}
.brand-mini::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, #0ea5e9, transparent);
  border-radius: 2px;
}
.brand-mini-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.brand-mini-title {
  font-family: 'Inter', 'Sarabun', -apple-system, sans-serif;
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #0f172a 0%, #0284c7 60%, #0ea5e9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.03em;
  line-height: 1;
}
.brand-mini-sub {
  font-family: 'Inter', 'Sarabun', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  margin-top: 6px;
  padding-left: 2px;
}

/* ── Header ── */
.auth-header { margin-bottom: 24px; }
.auth-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.auth-header p {
  color: #64748b;
  font-size: 13.5px;
  line-height: 1.55;
}

/* ── Form ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.01em;
}
.input-wrap { position: relative; }
.form-control {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 500;
  color: #0f172a;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: all 0.18s ease;
}
.form-control::placeholder {
  color: #94a3b8;
  font-weight: 400;
}
.form-control:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}
.form-control:focus {
  background: #fff;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
  transition: color 0.18s ease;
}
.input-wrap:focus-within .input-icon { color: #0ea5e9; }
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
  color: #94a3b8;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}
.input-eye:hover {
  color: #0ea5e9;
  background: rgba(14, 165, 233, 0.08);
}

/* ── Submit ── */
.auth-submit {
  margin-top: 10px;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow:
    0 8px 20px rgba(14, 165, 233, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: transform 0.15s, box-shadow 0.2s, filter 0.15s;
  position: relative;
  overflow: hidden;
  animation: submit-glow 2.4s ease-in-out infinite;
  letter-spacing: 0.01em;
}
@keyframes submit-glow {
  0%, 100% {
    box-shadow:
      0 8px 20px rgba(14, 165, 233, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  50% {
    box-shadow:
      0 10px 30px rgba(14, 165, 233, 0.55),
      0 0 30px rgba(14, 165, 233, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
}
.auth-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.7s ease;
}
.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}
.auth-submit:hover:not(:disabled)::before { left: 100%; }
.auth-submit:active:not(:disabled) { transform: translateY(0); }
.auth-submit:disabled {
  opacity: 0.7;
  cursor: default;
  filter: saturate(0.7);
  animation: none;
}
.spin-icon-sm { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Register link ── */
.auth-register-link {
  text-align: center;
  font-size: 13.5px;
  color: #64748b;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}
.auth-register-link a {
  color: #0ea5e9;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s ease;
}
.auth-register-link a:hover {
  color: #0284c7;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Verify boxes ── */
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

/* ── Responsive ── */
@media (max-width: 640px) {
  .auth-page { padding: 16px; padding-top: 48px; }
  .auth-card {
    padding: 32px 24px;
    border-radius: 18px;
  }
  .brand-mini { margin-bottom: 28px; padding-bottom: 20px; }
  .brand-mini-title { font-size: 26px; }
  .brand-mini-sub { font-size: 11px; letter-spacing: 0.4em; margin-top: 5px; }
  .auth-header h2 { font-size: 22px; }
  .auth-header p { font-size: 13px; }
  .form-control { height: 46px; font-size: 15px; }
  .auth-submit { height: 48px; font-size: 14.5px; }
}
@media (max-width: 400px) {
  .blob { filter: blur(60px); }
}
/* ═══ Mobile landscape — split hero + form (Design C style) ═══ */
@media (max-height: 500px) and (orientation: landscape) {
  .auth-page {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 16px 24px;
    place-items: center;
  }

  /* Landscape hero (left panel) — typography focus */
  .landscape-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: #fff;
    text-align: center;
    z-index: 1;
    max-width: 280px;
    animation: hero-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes hero-in {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .lh-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
  }
  .lh-title {
    font-family: 'Inter', 'Sarabun', -apple-system, sans-serif;
    font-size: 36px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1;
    background: linear-gradient(135deg, #ffffff 0%, #7dd3fc 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 12px rgba(125, 211, 252, 0.3));
  }
  .lh-sub {
    font-family: 'Inter', 'Sarabun', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.5em;
    color: #7dd3fc;
    text-transform: uppercase;
    margin-top: 10px;
    padding-left: 10px;
  }
  .lh-tagline {
    font-size: 13px;
    line-height: 1.65;
    color: rgba(224, 242, 254, 0.7);
    font-weight: 400;
    margin-top: 8px;
  }

  /* Form panel (right side) */
  .auth-form-panel {
    max-width: 380px;
    justify-self: start;
    height: 100%;
    max-height: 100%;
  }
  .auth-card {
    padding: 22px 26px;
    border-radius: 16px;
    max-height: 100%;
  }
  .brand-mini { display: none; }
  .auth-header { margin-bottom: 14px; }
  .auth-header h2 { font-size: 18px; }
  .auth-header p { display: none; }
  .auth-form { gap: 10px; }
  .form-label { font-size: 11.5px; }
  .form-control { height: 40px; font-size: 14px; }
  .auth-submit { height: 42px; margin-top: 4px; font-size: 14px; }
  .auth-register-link {
    margin-top: 12px;
    padding-top: 10px;
    font-size: 12px;
  }
  .verify-success-box,
  .verify-info-box,
  .verify-box {
    padding: 8px 10px;
    font-size: 12px;
    margin-bottom: 8px;
  }
}

/* Very short landscape (< 400px height) — even more compact */
@media (max-height: 400px) and (orientation: landscape) {
  .auth-page { padding: 8px 20px; gap: 16px; }
  .landscape-hero { max-width: 240px; gap: 8px; }
  .lh-title { font-size: 28px; }
  .lh-sub { font-size: 11px; letter-spacing: 0.4em; margin-top: 6px; padding-left: 8px; }
  .lh-tagline { display: none; }
  .auth-card { padding: 16px 20px; border-radius: 14px; }
  .auth-header { margin-bottom: 10px; }
  .auth-header h2 { font-size: 16px; margin-bottom: 2px; }
  .auth-form { gap: 8px; }
  .form-control { height: 36px; }
  .auth-submit { height: 38px; }
  .auth-register-link { margin-top: 8px; padding-top: 8px; font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .blob, .auth-card {
    animation: none !important;
  }
  .auth-submit { animation: none; }
  .auth-submit::before { display: none; }
}
</style>
