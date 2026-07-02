<template>
  <div class="auth-page">
    <!-- Left panel (desktop) -->
    <div class="auth-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <img src="/logo.png" alt="MedNinja" />
        </div>
        <h2>MedNinja LMS</h2>
        <p>ระบบการเรียนรู้สำหรับนักเรียนแพทย์ ที่ออกแบบมาเพื่อให้คุณเก่งขึ้นทุกวัน</p>
        <div class="brand-stats">
          <div class="brand-stat">
            <span class="brand-stat-num">Live</span>
            <span class="brand-stat-label">สอนสด</span>
          </div>
          <div class="brand-stat">
            <span class="brand-stat-num">VDO</span>
            <span class="brand-stat-label">บทเรียน</span>
          </div>
          <div class="brand-stat">
            <span class="brand-stat-num">Exam</span>
            <span class="brand-stat-label">ตะลุยโจทย์</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <template v-if="true">
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
      verifyUsed: false
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
  },
  methods: {
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
.auth-page {
  display: flex;
  min-height: calc(100vh - 64px);
}

/* ── Left brand panel ── */
.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, #1e3a5f 0%, #1a56db 60%, #0ea5e9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  color: white;
}
.brand-content { max-width: 360px; text-align: center; }
.brand-logo img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin-bottom: 20px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.brand-content h2 {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 12px;
  color: white;
}
.brand-content p {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255,255,255,0.8);
  margin-bottom: 32px;
}
.brand-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}
.brand-stat { text-align: center; }
.brand-stat-num {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: white;
}
.brand-stat-label {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-top: 2px;
}

/* ── Right form panel ── */
.auth-form-panel {
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: var(--white);
}
.auth-card {
  width: 100%;
  max-width: 400px;
}

/* ── Login Header ── */
.auth-header { margin-bottom: 28px; }
.auth-header h2 {
  font-size: 26px;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 4px;
}
.auth-header p {
  color: var(--gray);
  font-size: 14px;
}

.auth-form { display: flex; flex-direction: column; gap: 4px; }

/* Input with icon */
.input-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray);
  pointer-events: none;
  z-index: 1;
}
.input-with-icon { padding-left: 40px !important; }
.input-with-icon-right { padding-right: 44px !important; }
.input-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--gray);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.input-eye:hover { color: var(--primary); }

.auth-submit {
  width: 100%;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  padding: 14px;
}

.spin-icon-sm { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Register link ── */
.auth-register-link {
  text-align: center;
  font-size: 14px;
  color: var(--gray);
  margin-top: 16px;
}
.auth-register-link a {
  color: #3b82f6;
  font-weight: 600;
  text-decoration: none;
}
.auth-register-link a:hover {
  text-decoration: underline;
}

/* ── Verify result ── */
.verify-success-box, .verify-info-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}
.verify-success-box {
  background: #ecfdf5;
  border: 1.5px solid #a7f3d0;
  color: #065f46;
}
.verify-success-box svg { color: #10b981; flex-shrink: 0; }
.verify-info-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #1e40af;
}
.verify-info-box svg { color: #3b82f6; flex-shrink: 0; }

/* ── Email not verified ── */
.verify-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: center;
}
.verify-box p {
  font-size: 14px;
  color: #1e40af;
  margin: 0 0 10px;
  line-height: 1.5;
}
.verify-box strong {
  word-break: break-all;
}
.btn-resend {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-resend:hover { background: #2563eb; }
.btn-resend:disabled { opacity: 0.5; cursor: default; }
.resend-msg {
  font-size: 13px;
  color: #059669;
  margin: 8px 0 0;
}

@media (max-width: 768px) {
  .auth-page { flex-direction: column; }
  .auth-brand { padding: 32px 24px; }
  .brand-stats { gap: 20px; }
  .auth-form-panel {
    flex: none;
    padding: 32px 24px;
  }
}
</style>
