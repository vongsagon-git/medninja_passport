<template>
  <div class="banned-page">
    <div class="card">
      <div class="icon">🚫</div>
      <h1>บัญชีถูกระงับ</h1>
      <p class="lead">
        กรุณาติดต่อ admin เพื่อสอบถามเพิ่มเติม
      </p>

      <div v-if="reason" class="reason-box">
        <div class="reason-label">เหตุผล</div>
        <div class="reason-text">{{ reason }}</div>
      </div>

      <a class="btn-line" :href="contactLine" target="_blank" rel="noopener">
        📱 ติดต่อ admin ทาง LINE
      </a>

      <button class="btn-logout" @click="logout">ออกจากระบบ</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserState } from '../services/userState'

const router = useRouter()
const authStore = useAuthStore()

const state = ref(null)

const reason = computed(() => state.value?.banReason || '')
const contactLine = computed(() =>
  state.value?.contactLineUrl || 'https://line.me/R/ti/p/@medninja'
)

onMounted(async () => {
  try {
    state.value = await getUserState()
  } catch (e) {
    console.warn('[Banned] fetch failed:', e.message)
  }
})

async function logout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.banned-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
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
h1 { font-size: 22px; font-weight: 700; color: #991b1b; margin-bottom: 10px; }
.lead { color: #6b7280; font-size: 14px; margin-bottom: 20px; }

.reason-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: left;
}
.reason-label { font-size: 11px; color: #991b1b; font-weight: 700; margin-bottom: 4px; }
.reason-text { font-size: 13px; color: #7f1d1d; }

.btn-line {
  display: block;
  background: #06c755;
  color: #fff;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  margin-bottom: 12px;
}
.btn-line:hover { background: #05a648; }

.btn-logout {
  background: transparent;
  color: #9ca3af;
  border: none;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { color: #6b7280; text-decoration: underline; }
</style>
