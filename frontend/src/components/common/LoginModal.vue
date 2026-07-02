<template>
  <Teleport to="body">
    <Transition name="lm">
      <div v-if="authStore.loginModalOpen" class="lm-overlay" @click.self="close">
        <div class="lm-card">
          <!-- Close button -->
          <button class="lm-close" @click="close" aria-label="ปิด">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <div class="lm-header">
            <img src="/logo.png" alt="MedNinja" class="lm-logo" />
            <h2>เข้าสู่ระบบ</h2>
            <p>ใช้เลขบัตรประชาชนและรหัสผ่านที่ได้จาก Ninja Passport</p>
          </div>

          <AlertMessage :message="error" type="error" />

          <!-- Email not verified warning -->
          <div v-if="emailNotVerified" class="lm-verify-box">
            <p>กรุณาตรวจสอบอีเมล <strong>{{ unverifiedEmail }}</strong> แล้วกดลิงก์ยืนยัน</p>
            <button type="button" class="lm-btn-resend" :disabled="resending" @click="resendVerify">
              {{ resending ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง' }}
            </button>
            <p v-if="resendMsg" class="lm-resend-msg">{{ resendMsg }}</p>
          </div>

          <form @submit.prevent="handleLogin" class="lm-form">
            <div class="form-group">
              <label class="form-label">เลขบัตรประชาชน</label>
              <div class="lm-input-wrap">
                <svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-13.5v13.5"/>
                </svg>
                <input v-model="form.nationalId" type="text" inputmode="numeric" class="form-control lm-input-with-icon" placeholder="x-xxxx-xxxxx-xx-x" required maxlength="17" @input="formatNid" ref="nidInput" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">รหัสผ่าน</label>
              <div class="lm-input-wrap">
                <svg class="lm-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path stroke-linecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="form-control lm-input-with-icon lm-input-right" placeholder="รหัสผ่าน" required />
                <button type="button" class="lm-eye" @click="showPass = !showPass" tabindex="-1">
                  <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg lm-submit" :disabled="loading">
              <svg v-if="loading" class="lm-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
            </button>
          </form>

          <p class="lm-register">
            ยังไม่มีบัญชี? <a href="/ninja-passport" @click.prevent="goRegister">ลงทะเบียนผ่าน Ninja Passport</a>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import AlertMessage from './AlertMessage.vue'

export default {
  name: 'LoginModal',
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
      resendMsg: ''
    }
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    return { authStore, router }
  },
  watch: {
    'authStore.loginModalOpen'(val) {
      document.body.style.overflow = val ? 'hidden' : ''
      if (val) {
        // Reset form when opening
        this.form = { nationalId: '', password: '' }
        this.error = ''
        this.emailNotVerified = false
        this.resendMsg = ''
        this.$nextTick(() => {
          this.$refs.nidInput?.focus()
        })
      }
    }
  },
  mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.authStore.loginModalOpen) this.close()
    }
    document.addEventListener('keydown', this._escHandler)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._escHandler)
    document.body.style.overflow = ''
  },
  methods: {
    close() {
      this.authStore.loginModalOpen = false
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
        this.close()
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
        const api = (await import('../../services/api')).default
        const result = await api.post('/auth/resend-verify-public', { nationalId: cleanNid })
        this.resendMsg = result?.message || 'ส่งอีเมลยืนยันเรียบร้อย'
      } catch (err) {
        this.resendMsg = err.response?.data?.message || 'ส่งอีเมลไม่สำเร็จ ลองใหม่'
      } finally {
        this.resending = false
      }
    },
    goRegister() {
      this.close()
      this.router.push('/ninja-passport')
    }
  }
}
</script>

<style scoped>
.lm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 24px;
}

.lm-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 40px 36px 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.lm-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.lm-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Header */
.lm-header {
  text-align: center;
  margin-bottom: 28px;
}
.lm-logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
  margin-bottom: 16px;
}
.lm-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.lm-header p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

/* Form */
.lm-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lm-input-wrap {
  position: relative;
}
.lm-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  z-index: 1;
}
.lm-input-with-icon {
  padding-left: 40px !important;
}
.lm-input-right {
  padding-right: 44px !important;
}
.lm-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #94a3b8;
  border-radius: 6px;
  transition: color 0.15s;
}
.lm-eye:hover { color: #0f172a; }

.lm-submit {
  width: 100%;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  padding: 14px;
}

.lm-spin { animation: lm-spin 1s linear infinite; }
@keyframes lm-spin { to { transform: rotate(360deg); } }

/* Register link */
.lm-register {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-top: 16px;
}
.lm-register a {
  color: #3b82f6;
  font-weight: 600;
  text-decoration: none;
}
.lm-register a:hover {
  text-decoration: underline;
}

/* Email verify box */
.lm-verify-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: center;
}
.lm-verify-box p {
  font-size: 14px;
  color: #1e40af;
  margin: 0 0 10px;
  line-height: 1.5;
}
.lm-verify-box strong { word-break: break-all; }
.lm-btn-resend {
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
.lm-btn-resend:hover { background: #2563eb; }
.lm-btn-resend:disabled { opacity: 0.5; cursor: default; }
.lm-resend-msg {
  font-size: 13px;
  color: #059669;
  margin: 8px 0 0;
}

/* Transition */
.lm-enter-active {
  transition: opacity 0.25s ease;
}
.lm-enter-active .lm-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.lm-leave-active {
  transition: opacity 0.2s ease;
}
.lm-leave-active .lm-card {
  transition: transform 0.2s ease, opacity 0.15s ease;
}
.lm-enter-from {
  opacity: 0;
}
.lm-enter-from .lm-card {
  transform: scale(0.92) translateY(20px);
  opacity: 0;
}
.lm-leave-to {
  opacity: 0;
}
.lm-leave-to .lm-card {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 480px) {
  .lm-card {
    padding: 32px 24px 24px;
    border-radius: 16px;
  }
}
</style>
