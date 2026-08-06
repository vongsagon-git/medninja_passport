<template>
  <div class="awaiting-page">
    <div class="card">
      <div class="icon-wrap">
        <div class="icon-clock">⏳</div>
      </div>

      <h1>รอ Admin อนุมัติ</h1>

      <p class="lead">
        อีก 1 ขั้นตอน<br>
        <b>ทัก LINE แจ้งชื่อให้ admin อนุมัติ</b>
      </p>

      <!-- Primary CTA: ทัก LINE แจ้งชื่อ -->
      <div class="contact-box">
        <div class="contact-title">📱 ทัก LINE @medninja</div>
        <p class="contact-body">
          แจ้งชื่อของคุณให้ admin<br>เพื่อขออนุมัติเข้าเรียน
        </p>
        <div class="name-tag-wrap">
          <div class="name-tag-label">ชื่อที่ต้องแจ้ง</div>
          <div class="name-tag-big">{{ displayName || 'ชื่อของคุณ' }}</div>
        </div>
        <a class="btn-line" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 5.66 2 10.17c0 4.05 3.6 7.44 8.46 8.08.33.07.78.22.89.5.1.26.06.66.03.93l-.14.86c-.04.26-.2 1 .88.55 1.09-.46 5.88-3.46 8.02-5.93C21.55 13.63 22 12 22 10.17 22 5.66 17.52 2 12 2z"/></svg>
          <span>เปิด LINE @medninja</span>
        </a>
      </div>

      <div class="time-box">
        ⏱ ระบบอนุมัติภายใน 5–30 นาที หลังทัก LINE
      </div>

      <button class="btn-refresh" @click="checkNow" :disabled="checking">
        {{ checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะอีกครั้ง' }}
      </button>

      <button class="btn-logout" @click="logout">ออกจากระบบ</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()
const checking = ref(false)
let pollTimer = null

const displayName = computed(() => {
  const u = auth.user || {}
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || ''
})

async function checkNow() {
  if (checking.value) return
  checking.value = true
  try {
    const data = await api.get('/auth/me')
    if (data?.user) {
      auth.setUser(data.user)
      if (data.user.approvalStatus === 'approved') {
        router.replace({ name: 'MyDashboard' })
        return
      }
      if (data.user.approvalStatus === 'rejected') {
        router.replace({ name: 'Rejected' })
        return
      }
    }
  } catch (e) { /* silent */ }
  finally { checking.value = false }
}

function logout() {
  auth.logout()
  router.replace('/')
}

onMounted(() => {
  // auto-poll ทุก 30 วิ (admin approve → กระโดดเข้าเรียนเอง)
  pollTimer = setInterval(checkNow, 30000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
.awaiting-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.15);
  text-align: center;
}
.icon-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
.icon-clock {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(245,158,11,0); }
}
h1 {
  font-size: 22px;
  color: #1e3a8a;
  margin: 0 0 16px;
  font-weight: 700;
}
.lead {
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  margin: 0 0 24px;
}
.time-box {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 16px;
  font-size: 13px; color: #78350f; text-align: center;
}
.name-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}
.name-label { font-size: 12px; color: #1e40af; }
.name-value { font-size: 18px; color: #1e40af; font-weight: 700; margin-top: 4px; }
.contact-box {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 16px;
  padding: 22px 18px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.15);
  text-align: center;
}
.contact-title {
  font-size: 17px;
  color: #166534;
  font-weight: 800;
  margin-bottom: 6px;
}
.contact-body {
  color: #166534;
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 14px;
}
.name-tag-wrap {
  background: #fff;
  border: 1px dashed #86efac;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 14px;
}
.name-tag-label { font-size: 11px; color: #166534; }
.name-tag-big {
  font-size: 18px; color: #166534; font-weight: 700; margin-top: 2px;
}
.btn-line {
  display: inline-flex; align-items: center; gap: 8px;
  background: #06c755; color: #fff;
  padding: 10px 24px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(6,199,85,0.3);
  transition: transform 0.15s;
}
.btn-line:hover { transform: translateY(-1px); }
.btn-refresh {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: 0;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(59,130,246,0.3);
  transition: transform 0.15s;
}
.btn-refresh:hover:not(:disabled) { transform: translateY(-1px); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-logout {
  width: 100%;
  background: transparent;
  color: #64748b;
  border: 0;
  padding: 8px;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { color: #ef4444; }
</style>
