<!--
  CountryBanner — แสดง banner สำหรับ user ที่เข้าจากจีน
  "🇨🇳 คุณกำลังเข้าจากประเทศจีน — ระบบดูได้ปกติด้วย MedNinja Technology"

  ห้ามปิด — ต้องคาไว้ตลอด (ตามที่หมอแตมสั่ง 2026-07-07)
  Auto-hide บน /live เท่านั้น
-->
<template>
  <transition name="banner-slide">
    <div
      v-if="show"
      class="country-banner"
      role="status"
      aria-live="polite"
    >
      <div class="banner-inner">
        <span class="flag">🇨🇳</span>
        <div class="text">
          <div class="title">คุณกำลังเข้าจากประเทศจีน</div>
          <div class="sub">ระบบดูได้ปกติด้วย <b>MedNinja Technology</b></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useCountry from '../../composables/useCountry'

const route = useRoute()
const { isChina, ready } = useCountry()

// ซ่อนบน /live (ตามที่หมอแตมสั่ง — ไลฟ์ไม่ต้อง)
const isLivePage = computed(() => {
  const p = route.path || ''
  return p.startsWith('/live')
})

const show = computed(() =>
  ready.value && isChina.value && !isLivePage.value
)
</script>

<style scoped>
.country-banner {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 900;
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(220, 38, 38, 0.35);
}
.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.flag {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}
.text {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}
.sub {
  font-size: 12px;
  opacity: 0.95;
  line-height: 1.4;
  margin-top: 2px;
}
.sub b {
  font-weight: 700;
  color: #fef3c7;
}

@media (max-width: 640px) {
  .banner-inner {
    padding: 8px 12px;
    gap: 10px;
  }
  .flag { font-size: 20px; }
  .title { font-size: 13px; }
  .sub { font-size: 11px; }
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
