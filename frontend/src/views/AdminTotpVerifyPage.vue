<template>
  <div class="totp-page">
    <div class="card">
      <div class="icon">🔐</div>
      <h1>ยืนยันตัวตน 2 ชั้น</h1>
      <p class="subtitle">กรอกรหัส 6 หลักจาก Google Authenticator</p>

      <div v-if="!pendingLoginId" class="alert-error">
        session หมดอายุ กรุณา <a @click.prevent="goLogin">login ใหม่</a>
      </div>

      <template v-else>
        <div class="code-input-wrap">
          <input
            ref="codeInput"
            v-model="code"
            type="text"
            inputmode="numeric"
            pattern="\d*"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="000000"
            :disabled="loading"
            @input="onInput"
            class="code-input"
          />
        </div>

        <div v-if="error" class="alert-error">{{ error }}</div>
        <div v-if="halfUnlock" class="alert-warn">
          ✓ ถูก 1/2 — รอรหัสถัดไปเปลี่ยนแล้วกรอกอีกครั้งเพื่อปลด block
        </div>
        <div v-if="blocked" class="alert-error">
          ⚠ ระบบ block รออีก {{ waitSeconds }} วินาที
        </div>

        <button
          class="btn-verify"
          @click="verify"
          :disabled="loading || code.length !== 6"
        >
          {{ loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน' }}
        </button>

        <div class="hint">
          รหัสเปลี่ยนทุก 30 วินาที<br>
          <a @click.prevent="goLogin">← กลับหน้า login</a>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'AdminTotpVerifyPage',
  data() {
    return {
      authStore: useAuthStore(),
      code: '',
      loading: false,
      error: '',
      halfUnlock: false,
      blocked: false,
      waitSeconds: 0
    }
  },
  computed: {
    pendingLoginId() {
      return this.$route.query.pending || ''
    }
  },
  mounted() {
    this.$nextTick(() => this.$refs.codeInput?.focus())
  },
  methods: {
    onInput(e) {
      // เก็บเฉพาะตัวเลข
      this.code = String(e.target.value || '').replace(/\D/g, '').slice(0, 6)
      // auto-submit เมื่อครบ 6 หลัก
      if (this.code.length === 6 && !this.loading) {
        this.verify()
      }
    },
    async verify() {
      if (this.loading || this.code.length !== 6) return
      this.loading = true
      this.error = ''
      this.halfUnlock = false
      this.blocked = false
      try {
        await this.authStore.verifyTotpLogin(this.pendingLoginId, this.code)
        // สำเร็จ → ไป /admin
        const target = this.authStore.user?.role === 'admin' ? '/admin' : '/my'
        this.$router.replace(target)
      } catch (err) {
        const data = err.response?.data || {}
        this.error = data.error || data.message || 'รหัสไม่ถูกต้อง'
        this.halfUnlock = !!data.halfUnlock
        this.blocked = !!data.blocked
        this.waitSeconds = data.waitSeconds || 0
        this.code = ''
        this.$nextTick(() => this.$refs.codeInput?.focus())
      } finally {
        this.loading = false
      }
    },
    goLogin() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.totp-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
}
.icon {
  font-size: 48px;
  margin-bottom: 12px;
}
h1 {
  font-size: 22px;
  color: #1e293b;
  margin: 0 0 8px;
  font-weight: 700;
}
.subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 24px;
}
.code-input-wrap { margin-bottom: 16px; }
.code-input {
  width: 100%;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 8px;
  text-align: center;
  padding: 16px;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s;
}
.code-input:focus { border-color: #3b82f6; }
.code-input:disabled { opacity: 0.6; }
.btn-verify {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: 0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
  transition: transform 0.15s;
  margin-bottom: 16px;
}
.btn-verify:hover:not(:disabled) { transform: translateY(-1px); }
.btn-verify:disabled { opacity: 0.5; cursor: not-allowed; }
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
}
.alert-warn {
  background: #fef3c7;
  color: #78350f;
  border: 1px solid #fcd34d;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
}
.hint {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.7;
  margin-top: 8px;
}
.hint a {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: none;
}
.hint a:hover { text-decoration: underline; }
</style>
