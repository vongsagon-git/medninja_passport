<template>
  <div class="my-trial-page">
    <!-- Countdown banner (trial only) -->
    <div class="trial-banner">
      <div class="trial-banner-left">
        <span class="trial-icon">🎁</span>
        <span class="trial-label">ทดลองเรียนฟรี</span>
        <span class="trial-countdown" v-if="remainingDays > 0">
          เหลือ <b>{{ remainingDays }}</b> วัน <b>{{ remainingHours }}</b> ชม.
        </span>
        <span class="trial-countdown expired" v-else>
          หมดวันนี้!
        </span>
      </div>
      <a class="btn-upgrade" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
        💎 สมัครคอร์สจริง
      </a>
    </div>

    <!-- Passport card (เหมือน paid — user experience parity) -->
    <div class="passport-card">
      <div class="pp-header">
        <div class="pp-header-left">
          <div class="pp-logo">M</div>
          <div>
            <div class="pp-title">MedNinja Trial</div>
            <div class="pp-subtitle">ทดลองเรียนฟรี 7 วัน</div>
            <div class="pp-tagline">สัมผัสประสบการณ์เรียนแพทย์ยุคใหม่</div>
          </div>
        </div>
        <span class="pp-country">@{{ user?.firstName || 'trial' }}</span>
      </div>

      <div class="pp-body">
        <div class="pp-photo">
          <div class="pp-avatar">
            <img v-if="user?.linePictureUrl" :src="user.linePictureUrl" alt="LINE Avatar">
            <div v-else class="pp-avatar-placeholder">{{ initial }}</div>
            <div v-if="user?.lineUserId" class="pp-avatar-line">
              <svg viewBox="0 0 24 24"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            </div>
          </div>
        </div>
        <div class="pp-info">
          <div class="pp-name">{{ fullName }}</div>
          <div class="pp-meta-row">
            <span class="pp-meta-item" v-if="user?.university">
              {{ user.university }}
            </span>
            <span class="pp-meta-item" v-if="user?.email">
              {{ user.email }}
            </span>
            <span class="pp-meta-item verified" v-if="user?.lineUserId">
              ✓ เชื่อม LINE แล้ว
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trial content notice -->
    <div class="trial-content-panel">
      <h2>📚 บทเรียนตัวอย่าง</h2>
      <p class="trial-help">
        เนื้อหาทดลองบางส่วนจาก MedNinja — เพื่อให้คุณสัมผัสคุณภาพจริงก่อนตัดสินใจ
      </p>

      <!-- Reuse demo content — ไปที่หน้า demo เดิม (backend ยังใช้ demo package) -->
      <router-link to="/demo/watch/0" class="trial-course-card">
        <div class="course-thumb">
          <span class="play-icon">▶</span>
        </div>
        <div class="course-info">
          <div class="course-title">บทตัวอย่าง — เริ่มเรียนได้เลย</div>
          <div class="course-meta">คลิกเพื่อเริ่มดู</div>
        </div>
      </router-link>
    </div>

    <!-- Locked features -->
    <div class="locked-features">
      <h3>🔒 เฉพาะสมาชิกคอร์สจริง</h3>
      <div class="locked-grid">
        <div class="locked-item"><span>📅</span> Live เรียนสด</div>
        <div class="locked-item"><span>💬</span> ถามอาจารย์ทันที</div>
        <div class="locked-item"><span>🩺</span> Virtual Patient</div>
        <div class="locked-item"><span>📝</span> MEQ / DDx / OSCE</div>
        <div class="locked-item"><span>📊</span> ระบบวิเคราะห์ผล</div>
        <div class="locked-item"><span>🏆</span> Certificate</div>
      </div>
      <a class="btn-upgrade-big" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
        💎 สมัครคอร์สจริง — ทัก LINE @medninja
      </a>
    </div>

    <!-- Footer -->
    <div class="trial-footer">
      <button class="btn-logout" @click="logout">ออกจากระบบ</button>
    </div>

    <!-- Soft watermark -->
    <div class="trial-watermark">ทดลอง</div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getUserState } from '../services/userState'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const stateData = ref(null)

const fullName = computed(() => {
  const u = user.value
  if (!u) return ''
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email
})

const initial = computed(() => {
  const n = fullName.value
  return n ? n.charAt(0).toUpperCase() : '?'
})

const remainingDays = computed(() => stateData.value?.demoRemainingDays ?? 0)
const remainingHours = computed(() => stateData.value?.demoRemainingHours ?? 0)

onMounted(async () => {
  try {
    stateData.value = await getUserState()
  } catch (e) {
    console.warn('[MyTrialDashboard] fetch state failed:', e.message)
  }
})

async function logout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.my-trial-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 16px 60px;
  position: relative;
}

/* Trial banner */
.trial-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  flex-wrap: wrap;
  gap: 10px;
}
.trial-banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}
.trial-icon { font-size: 22px; }
.trial-label { font-weight: 700; }
.trial-countdown { font-size: 14px; opacity: 0.95; }
.trial-countdown b { font-size: 18px; }
.trial-countdown.expired { color: #fee2e2; font-weight: 700; }

.btn-upgrade {
  background: #fff;
  color: #d97706;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  font-size: 14px;
  transition: transform 0.15s;
}
.btn-upgrade:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }

/* Passport card — trial variant */
.passport-card {
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: #fff;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.2);
}
.pp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.pp-header-left { display: flex; gap: 14px; align-items: flex-start; }
.pp-logo {
  width: 44px; height: 44px; background: #fff; color: #1e40af;
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 22px;
}
.pp-title { font-size: 18px; font-weight: 700; }
.pp-subtitle { font-size: 13px; opacity: 0.9; }
.pp-tagline { font-size: 11px; opacity: 0.7; margin-top: 2px; }
.pp-country {
  background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 600;
}
.pp-body { display: flex; gap: 16px; align-items: center; }
.pp-photo { flex-shrink: 0; }
.pp-avatar {
  width: 72px; height: 72px; border-radius: 12px; overflow: hidden;
  border: 2px solid rgba(255,255,255,0.3); position: relative;
}
.pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pp-avatar-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.15); color: #fff; font-size: 32px; font-weight: 700;
}
.pp-avatar-line {
  position: absolute; bottom: -4px; right: -4px; background: #06c755;
  border-radius: 50%; padding: 4px; border: 2px solid #1e40af;
}
.pp-avatar-line svg { width: 12px; height: 12px; fill: #fff; }
.pp-info { flex: 1; min-width: 0; }
.pp-name { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.pp-meta-row { display: flex; gap: 8px; flex-wrap: wrap; }
.pp-meta-item {
  background: rgba(255,255,255,0.12); padding: 3px 8px; border-radius: 6px;
  font-size: 12px; opacity: 0.9;
}
.pp-meta-item.verified { background: rgba(6, 199, 85, 0.3); font-weight: 600; }

/* Content panel */
.trial-content-panel {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}
.trial-content-panel h2 {
  font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 6px;
}
.trial-help { font-size: 13px; color: #6b7280; margin-bottom: 16px; }

.trial-course-card {
  display: flex;
  gap: 14px;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  text-decoration: none;
  color: #111827;
  transition: all 0.15s;
}
.trial-course-card:hover {
  border-color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
}
.course-thumb {
  width: 64px; height: 48px; background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.course-info { flex: 1; }
.course-title { font-weight: 600; font-size: 15px; }
.course-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }

/* Locked features */
.locked-features {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #fbbf24;
}
.locked-features h3 {
  font-size: 16px; font-weight: 700; color: #78350f; margin-bottom: 12px;
}
.locked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}
.locked-item {
  background: rgba(255,255,255,0.6);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
}
.locked-item span { font-size: 16px; }

.btn-upgrade-big {
  display: block;
  background: #d97706;
  color: #fff;
  text-align: center;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-upgrade-big:hover {
  background: #b45309;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);
}

/* Footer */
.trial-footer { text-align: center; margin-top: 20px; }
.btn-logout {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { background: #f3f4f6; }

/* Watermark */
.trial-watermark {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: rgba(30, 64, 175, 0.85);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  z-index: 100;
  backdrop-filter: blur(4px);
}
</style>
