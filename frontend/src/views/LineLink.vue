<template>
  <div class="linelink-page">
    <div class="linelink-card">
      <!-- Loading -->
      <div v-if="status === 'loading'" class="linelink-loading">
        <div class="linelink-spinner"></div>
        <p>กำลังเชื่อมบัญชี LINE...</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="linelink-success">
        <div class="linelink-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
        </div>
        <h2>เชื่อม LINE สำเร็จ!</h2>
        <p class="linelink-name">{{ lineDisplayName }}</p>
        <p class="linelink-sub">บัญชี LINE เชื่อมกับ MedNinja เรียบร้อย</p>
        <p class="linelink-sub">เพื่อเข้าใช้ระบบข้อสอบ NLEX</p>
        <p class="linelink-hint">ปิดหน้านี้ได้เลย</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="linelink-error">
        <div class="linelink-icon error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd"/></svg>
        </div>
        <h2>เชื่อมไม่สำเร็จ</h2>
        <p class="linelink-sub">{{ errorMsg }}</p>
        <button class="linelink-retry" @click="doLink">ลองอีกครั้ง</button>
      </div>

      <!-- Not logged in to LMS -->
      <div v-else-if="status === 'no-auth'" class="linelink-error">
        <div class="linelink-icon error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clip-rule="evenodd"/></svg>
        </div>
        <h2>กรุณา Login ก่อน</h2>
        <p class="linelink-sub">ต้อง Login เข้า MedNinja ก่อนเชื่อม LINE</p>
        <a href="/login" class="linelink-retry">ไปหน้า Login</a>
      </div>
    </div>

    <!-- MedNinja branding -->
    <div class="linelink-brand">
      <span>MedNinja LMS</span> × <span style="color:#06c755">LINE</span>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const LIFF_ID = '2009259048-jOiOezxi'

export default {
  name: 'LineLink',
  setup() { return { authStore: useAuthStore() } },
  data() {
    return { status: 'loading', lineDisplayName: '', errorMsg: '' }
  },
  async mounted() {
    // อ่าน JWT token จาก URL query หรือ sessionStorage (หลัง LIFF redirect กลับมา)
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    if (tokenFromUrl) {
      sessionStorage.setItem('linelink_token', tokenFromUrl)
    }
    this._jwtToken = tokenFromUrl || sessionStorage.getItem('linelink_token') || localStorage.getItem('token')
    if (!this._jwtToken) {
      this.status = 'no-auth'
      return
    }
    await this.initLiff()
  },
  methods: {
    async initLiff() {
      try {
        // โหลด LIFF SDK
        if (!window.liff) {
          await this.loadScript('https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js')
        }
        await window.liff.init({ liffId: LIFF_ID })

        // ถ้ายังไม่ login LINE → ให้ login
        if (!window.liff.isLoggedIn()) {
          window.liff.login()
          return
        }

        await this.doLink()
      } catch (e) {
        this.errorMsg = e.message || 'LIFF init ไม่สำเร็จ'
        this.status = 'error'
      }
    },
    async doLink() {
      try {
        this.status = 'loading'
        const idToken = window.liff.getIDToken()
        if (!idToken) {
          this.errorMsg = 'ไม่ได้รับ idToken จาก LINE'
          this.status = 'error'
          return
        }

        // ส่ง JWT ตรงใน header (มือถือไม่มี localStorage ของ LMS)
        const resp = await fetch('/api/auth/line/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this._jwtToken}`
          },
          body: JSON.stringify({ idToken })
        })
        const result = await resp.json()
        if (!resp.ok) throw new Error(result.message || 'เชื่อมไม่สำเร็จ')
        this.lineDisplayName = result.lineDisplayName || 'สำเร็จ'
        this.status = 'success'
        sessionStorage.removeItem('linelink_token')
      } catch (e) {
        this.errorMsg = e.message || 'เชื่อมไม่สำเร็จ'
        this.status = 'error'
      }
    },
    loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }
  }
}
</script>

<style scoped>
.linelink-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #06c755 0%, #00b900 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Noto Sans Thai', -apple-system, sans-serif;
}
.linelink-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 30px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.linelink-loading { color: #64748b; }
.linelink-spinner {
  width: 40px; height: 40px;
  border: 4px solid #e2e8f0; border-top-color: #06c755;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.linelink-icon { width: 64px; height: 64px; margin: 0 auto 16px; }
.linelink-icon svg { width: 100%; height: 100%; }
.linelink-icon.success { color: #06c755; }
.linelink-icon.error { color: #ef4444; }
.linelink-card h2 { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
.linelink-name { font-size: 16px; font-weight: 700; color: #06c755; margin-bottom: 4px; }
.linelink-sub { font-size: 14px; color: #64748b; margin-bottom: 4px; }
.linelink-hint { font-size: 12px; color: #94a3b8; margin-top: 16px; }
.linelink-retry {
  display: inline-block; margin-top: 16px; padding: 10px 24px;
  background: #06c755; color: #fff; border: none; border-radius: 10px;
  font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none;
}
.linelink-retry:active { transform: scale(0.98); }
.linelink-brand {
  margin-top: 24px; font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600;
}
</style>
