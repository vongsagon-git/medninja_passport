<!--
  CountryBanner — แถบบางสุด 1 บรรทัด บนสุดทุกหน้า (ยกเว้น /live)

  Desktop:  ● 🇹🇭 TH · 2403:6200:...:bbf4 · Desktop · Windows · Chrome · 1920×953 · [ออก]
  Mobile:   ● 🇹🇭 TH · 2403:...bbf4 · [🚪]
-->
<template>
  <transition name="banner-slide">
    <div
      v-if="show"
      class="country-banner"
      :class="tone"
      role="status"
      aria-live="polite"
    >
      <!-- ⭐ Error mode: API /geo/whoami ล้ม → MedNinja Technology สีแดง -->
      <div v-if="isError" class="banner-inner banner-error">
        <span class="dot dot-error"></span>
        <span class="brand-title">⚠️ MedNinja Technology</span>
        <span class="sep">·</span>
        <span class="brand-sub">การเชื่อมต่อขัดข้อง (fallback: TH)</span>
        <button
          v-if="isLoggedIn"
          class="logout-btn"
          @click="handleLogout"
          title="ออกจากระบบ"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="11" height="11">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="logout-label">ออก</span>
        </button>
      </div>

      <!-- Normal mode -->
      <div v-else class="banner-inner">
        <!-- Left: Country -->
        <span class="dot" :class="'dot-' + tone"></span>
        <span class="flag">{{ loading ? '🌐' : flag }}</span>
        <span class="country-code">{{ loading ? '...' : country }}</span>

        <!-- IP (always show) -->
        <template v-if="!loading && ip">
          <span class="sep">·</span>
          <span class="ip">{{ shortIp }}</span>
        </template>

        <!-- Device info (desktop only) -->
        <span class="sep hide-mobile">·</span>
        <span class="item hide-mobile">{{ deviceCategoryLabel }}</span>
        <span class="sep hide-mobile">·</span>
        <span class="item hide-mobile">{{ deviceOS }}</span>
        <span class="sep hide-mobile">·</span>
        <span class="item hide-mobile">{{ deviceBrowser }}</span>
        <span class="sep hide-mobile">·</span>
        <span class="item screen-size hide-mobile">{{ screenSize }}</span>

        <!-- Logout button (only if logged in) -->
        <button
          v-if="isLoggedIn"
          class="logout-btn"
          @click="handleLogout"
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="11" height="11" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="logout-label">ออก</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import useCountry from '../../composables/useCountry'
import { getOS, getBrowser, getDeviceCategory } from '../../utils/deviceDetect'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { country, countryTh, flag, ip, isp, isChina, isThai, ready, loading, error } = useCountry()

const isLoggedIn = computed(() => !!authStore.token)

async function handleLogout () {
  if (!confirm('ต้องการออกจากระบบใช่ไหม?')) return
  await authStore.logout()
  router.push('/')
}

// ─── Device Info ───
const deviceOS = ref('')
const deviceBrowser = ref('')
const deviceCategory = ref('desktop')
const screenSize = ref('')

const deviceCategoryLabel = computed(() => {
  const map = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
  return map[deviceCategory.value] || 'Device'
})

let _resizeHandler = null

function updateScreenSize () {
  screenSize.value = `${window.innerWidth}×${window.innerHeight}`
}

function detectDevice () {
  const ua = navigator.userAgent || ''
  deviceOS.value = getOS(ua)
  deviceBrowser.value = getBrowser(ua)
  deviceCategory.value = getDeviceCategory(ua)
}

onMounted(() => {
  detectDevice()
  updateScreenSize()
  _resizeHandler = () => updateScreenSize()
  window.addEventListener('resize', _resizeHandler, { passive: true })
  window.addEventListener('orientationchange', _resizeHandler, { passive: true })
})

onBeforeUnmount(() => {
  if (_resizeHandler) {
    window.removeEventListener('resize', _resizeHandler)
    window.removeEventListener('orientationchange', _resizeHandler)
  }
})

const isLivePage = computed(() => (route.path || '').startsWith('/live'))
const show = computed(() => !isLivePage.value)

// IPv6 shortener: 2403:6200:8830:7006:d599:e1c8:d863:bbf4 → 2403:6200...bbf4
const shortIp = computed(() => {
  const v = ip.value || ''
  if (!v) return ''
  // IPv6
  if (v.includes(':')) {
    if (v.length > 20) {
      return v.slice(0, 9) + '…' + v.slice(-4)
    }
  }
  // IPv4 keep full
  return v
})

// ⭐ Error mode: API ล้ม (มี error) — banner สีแดง MedNinja Technology
const isError = computed(() => !!error.value)

const tone = computed(() => {
  if (isError.value) return 'tone-error'
  if (isChina.value) return 'tone-cn'
  if (isThai.value) return 'tone-th'
  if (loading.value || !country.value) return 'tone-loading'
  return 'tone-other'
})
</script>

<style scoped>
.country-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99997;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Thai', sans-serif;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
  /* ⭐ กำหนดความสูง banner (26px desktop, 22px mobile) ผ่าน CSS variable */
  height: 28px;
}
</style>
<style>
/* Global CSS variable — ให้ Navbar / App.vue รู้ความสูง banner */
:root {
  --country-banner-h: 28px;
}
@media (max-width: 640px) {
  :root { --country-banner-h: 24px; }
}

.tone-cn      { background: linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%); color: #fff; }
.tone-th      { background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }
.tone-other   { background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%); }
.tone-loading { background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); }
/* ⭐ Error mode: API /geo/whoami ล้ม */
.tone-error   { background: linear-gradient(90deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%); color: #fff; }

.banner-error {
  gap: 8px;
}
.brand-title {
  font-weight: 800;
  letter-spacing: 0.5px;
  font-size: 12px;
  color: #fff;
}
.brand-sub {
  font-weight: 500;
  font-size: 11px;
  opacity: 0.9;
}
.dot-error {
  background: #fbbf24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.8);
  animation: pulse-dot 1s ease-in-out infinite;
}

.banner-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 5px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-tone-cn      { background: #fbbf24; box-shadow: 0 0 6px rgba(251, 191, 36, 0.6); }
.dot-tone-th      { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6); }
.dot-tone-other   { background: #94a3b8; }
.dot-tone-loading {
  background: #f59e0b;
  animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

.flag {
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}
.country-code {
  font-weight: 700;
  letter-spacing: 0.5px;
  font-size: 11px;
}
.sep {
  opacity: 0.35;
  font-weight: 300;
  flex-shrink: 0;
}
.ip {
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  font-size: 10.5px;
  opacity: 0.75;
  letter-spacing: 0.2px;
}
.item {
  font-weight: 500;
  opacity: 0.85;
}
.screen-size {
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  font-size: 10.5px;
  opacity: 0.6;
}

/* Logout button */
.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(239, 68, 68, 0.75);
  border: none;
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-left: 4px;
  font-family: inherit;
  line-height: 1;
  flex-shrink: 0;
}
.logout-btn:hover {
  background: #dc2626;
}
.logout-btn svg {
  flex-shrink: 0;
}

/* ─── Mobile: ซ่อน device info + label ─── */
@media (max-width: 640px) {
  .hide-mobile {
    display: none !important;
  }
  .banner-inner {
    padding: 4px 10px;
    gap: 5px;
    font-size: 10.5px;
  }
  .flag { font-size: 11px; }
  .country-code { font-size: 10px; }
  .ip { font-size: 9.5px; }
  .logout-btn {
    padding: 2px 5px;
    font-size: 0; /* hide label */
    gap: 0;
    margin-left: auto; /* push to right */
  }
  .logout-label { display: none; }
}

/* Transition */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
