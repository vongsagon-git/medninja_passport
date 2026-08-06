<template>
  <div class="rejected-page">
    <div class="card">
      <div class="icon-wrap">
        <div class="icon-x">!</div>
      </div>

      <h1>บัญชีของคุณไม่ผ่านการตรวจสอบ</h1>

      <p class="lead">
        กรุณาติดต่อ Admin เพื่อยืนยันตัวตน<br>
        หากเป็นการเข้าใจผิด ทีมงานจะช่วยแก้ไขให้
      </p>

      <div v-if="displayName" class="name-box">
        <div class="name-label">ชื่อของคุณในระบบ</div>
        <div class="name-value">{{ displayName }}</div>
      </div>

      <a class="btn-line" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 5.66 2 10.17c0 4.05 3.6 7.44 8.46 8.08.33.07.78.22.89.5.1.26.06.66.03.93l-.14.86c-.04.26-.2 1 .88.55 1.09-.46 5.88-3.46 8.02-5.93C21.55 13.63 22 12 22 10.17 22 5.66 17.52 2 12 2z"/></svg>
        <span>ทัก LINE @medninja</span>
      </a>

      <button class="btn-logout" @click="logout">ออกจากระบบ</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = computed(() => {
  const u = auth.user || {}
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || ''
})

function logout() {
  auth.logout()
  router.replace('/')
}
</script>

<style scoped>
.rejected-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(239,68,68,0.15);
  text-align: center;
}
.icon-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
.icon-x {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 44px; font-weight: 700;
}
h1 {
  font-size: 20px; color: #991b1b;
  margin: 0 0 16px; font-weight: 700;
}
.lead {
  color: #64748b; font-size: 14px; line-height: 1.7;
  margin: 0 0 20px;
}
.name-box {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}
.name-label { font-size: 12px; color: #475569; }
.name-value { font-size: 18px; color: #1e293b; font-weight: 700; margin-top: 4px; }
.btn-line {
  display: inline-flex; align-items: center; gap: 8px;
  background: #06c755; color: #fff;
  padding: 12px 28px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(6,199,85,0.3);
  margin-bottom: 12px;
}
.btn-logout {
  display: block;
  width: 100%;
  background: transparent;
  color: #64748b;
  border: 0;
  padding: 8px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
}
</style>
