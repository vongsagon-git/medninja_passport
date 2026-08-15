<template>
  <div class="expired-page">
    <div class="card">
      <div class="icon">⏰</div>
      <h1>ทดลองเรียนหมดอายุแล้ว</h1>

      <p class="lead">
        คุณได้ทดลองเรียนของ MedNinja ครบแล้ว<br>
        <b v-if="daysAgo > 0">หมดอายุเมื่อ {{ daysAgo }} วันที่แล้ว</b>
      </p>

      <div class="upgrade-box">
        <div class="upgrade-title">💎 สมัครคอร์สจริง</div>
        <p class="upgrade-body">
          ปลดล็อกทุกเนื้อหา NL1+NL2, Live, MEQ, DDx, OSCE, Virtual Patient
        </p>
        <a class="btn-line" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
          📱 ทัก LINE เพื่อสมัคร
        </a>
      </div>

      <button class="btn-check" @click="checkNow" :disabled="checking">
        {{ checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะอีกครั้ง' }}
      </button>

      <button class="btn-logout" @click="logout">ออกจากระบบ</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserState, clearUserStateCache, targetRouteForState } from '../services/userState'

const router = useRouter()
const authStore = useAuthStore()

const state = ref(null)
const checking = ref(false)

const daysAgo = computed(() => state.value?.demoExpiredDaysAgo ?? 0)

onMounted(async () => {
  try {
    state.value = await getUserState()
  } catch (e) {
    console.warn('[DemoExpired] fetch failed:', e.message)
  }
})

async function checkNow() {
  checking.value = true
  try {
    clearUserStateCache()
    const s = await getUserState(true)
    state.value = s
    const target = targetRouteForState(s)
    if (target && target !== '/demo-expired') {
      router.push(target)
    }
  } catch (e) {
    console.error('[DemoExpired] check failed:', e.message)
  } finally {
    checking.value = false
  }
}

async function logout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.expired-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 460px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}
.icon { font-size: 60px; margin-bottom: 12px; }
h1 { font-size: 22px; font-weight: 700; color: #78350f; margin-bottom: 10px; }
.lead { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
.lead b { color: #78350f; }

.upgrade-box {
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: #fff;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
}
.upgrade-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
.upgrade-body { font-size: 13px; opacity: 0.9; margin-bottom: 14px; }

.btn-line {
  display: inline-block;
  background: #06c755;
  color: #fff;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
}
.btn-line:hover { background: #05a648; }

.btn-check {
  display: block;
  width: 100%;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
}
.btn-check:disabled { opacity: 0.6; cursor: default; }
.btn-check:not(:disabled):hover { background: #e5e7eb; }

.btn-logout {
  background: transparent;
  color: #9ca3af;
  border: none;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { color: #6b7280; text-decoration: underline; }
</style>
