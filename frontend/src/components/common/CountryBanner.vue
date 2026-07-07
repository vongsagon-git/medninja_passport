<!--
  CountryBanner — แถบเดียวรวม: Country + IP + Device info
  แสดงบนสุดทุกหน้า (ยกเว้น /live)

  Layout:
    🇹🇭 ไทย · 2403:6200:... | 📱 Mobile · Android · Chrome · 1920×953
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
      <div class="banner-inner">
        <!-- LEFT: Country + IP -->
        <div class="section section-country">
          <span class="dot" :class="'dot-' + tone"></span>
          <span class="flag">{{ loading ? '🌐' : flag }}</span>
          <span class="country-name">{{ loading ? 'ตรวจสอบ...' : countryTh }}</span>
          <template v-if="!loading && ip">
            <span class="sep">·</span>
            <span class="ip">{{ shortIp }}</span>
          </template>
        </div>

        <span class="divider">|</span>

        <!-- RIGHT: Device info -->
        <div class="section section-device">
          <span class="device-icon">{{ deviceIcon }}</span>
          <span class="device-item">{{ deviceCategoryLabel }}</span>
          <span class="sep">·</span>
          <span class="device-item">{{ deviceOS }}</span>
          <span class="sep">·</span>
          <span class="device-item">{{ deviceBrowser }}</span>
          <span class="sep sep-hide-sm">·</span>
          <span class="device-item screen-size sep-hide-sm">{{ screenSize }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import useCountry from '../../composables/useCountry'
import { getOS, getBrowser, getDeviceCategory } from '../../utils/deviceDetect'

const route = useRoute()
const { country, countryTh, flag, ip, isp, isChina, isThai, ready, loading, error } = useCountry()

// ─── Device Info ───
const deviceOS = ref('')
const deviceBrowser = ref('')
const deviceCategory = ref('desktop')
const screenSize = ref('')

const deviceCategoryLabel = computed(() => {
  const map = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }
  return map[deviceCategory.value] || 'Device'
})

const deviceIcon = computed(() => {
  if (deviceCategory.value === 'mobile') return '📱'
  if (deviceCategory.value === 'tablet') return '📱'
  return '💻'
})

let _resizeHandler = null

function updateScreenSize () {
  const w = window.innerWidth
  const h = window.innerHeight
  screenSize.value = `${w}×${h}`
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

// ─── Route/visibility ───
const isLivePage = computed(() => {
  const p = route.path || ''
  return p.startsWith('/live')
})

const show = computed(() => !isLivePage.value)

// Shorten IPv6 for display
const shortIp = computed(() => {
  const v = ip.value || ''
  if (v.length > 24 && v.includes(':')) {
    return v.slice(0, 12) + '...' + v.slice(-8)
  }
  return v
})

const tone = computed(() => {
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
  color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Thai', sans-serif;
}
.tone-cn {
  background: linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%);
}
.tone-th {
  background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}
.tone-other {
  background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%);
}
.tone-loading {
  background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.banner-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 500;
  flex-wrap: wrap;
}
.section {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-tone-cn { background: #fbbf24; box-shadow: 0 0 8px rgba(251, 191, 36, 0.6); }
.dot-tone-th { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
.dot-tone-other { background: #94a3b8; }
.dot-tone-loading {
  background: #f59e0b;
  animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.flag {
  font-size: 14px;
  line-height: 1;
}
.country-name {
  font-weight: 700;
  letter-spacing: 0.2px;
}
.sep {
  opacity: 0.35;
  font-weight: 400;
}
.ip {
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  font-size: 11px;
  opacity: 0.85;
  letter-spacing: 0.2px;
}

.divider {
  opacity: 0.25;
  font-weight: 300;
}

.device-icon {
  font-size: 12px;
  line-height: 1;
}
.device-item {
  font-weight: 500;
  opacity: 0.9;
}
.screen-size {
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  font-size: 11px;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 640px) {
  .banner-inner {
    padding: 5px 10px;
    gap: 8px;
    font-size: 11px;
  }
  .divider,
  .sep-hide-sm {
    display: none;
  }
  .flag { font-size: 13px; }
  .ip { font-size: 10px; }
  .country-name { font-size: 11px; }
  .device-item { font-size: 10px; }
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
