<!--
  CountryBanner — แสดง IP + ประเทศทุกคน (ไม่มีปุ่มปิด)
  สี:
    - CN → แดง
    - TH → ฟ้า
    - อื่น ๆ → เทา

  Auto-hide บน /live เท่านั้น
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
        <span class="flag">{{ loading ? '🌐' : flag }}</span>
        <div class="text">
          <div class="title">
            <span class="country-name">{{ loading ? 'กำลังตรวจสอบ...' : countryTh }}</span>
            <template v-if="!loading && ip">
              <span class="sep">·</span>
              <span class="ip">{{ ip }}</span>
            </template>
          </div>
          <div class="sub">
            <template v-if="isChina">
              ระบบดูได้ปกติด้วย <b>MedNinja Technology</b>
            </template>
            <template v-else>
              MedNinja Technology
              <span v-if="isp" class="isp"> · {{ isp }}</span>
            </template>
          </div>
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
const { country, countryTh, flag, ip, isp, isChina, isThai, ready, loading, error } = useCountry()

// ซ่อนบน /live (ตามที่หมอแตมสั่ง)
const isLivePage = computed(() => {
  const p = route.path || ''
  return p.startsWith('/live')
})

// แสดง banner ตลอด ยกเว้น /live
// - loading → skeleton
// - ready + country → banner จริง
// - error → ไม่แสดง (silent)
const show = computed(() => !isLivePage.value && (loading.value || (ready.value && country.value && country.value !== 'unknown')))

const tone = computed(() => {
  if (isChina.value) return 'tone-cn'
  if (isThai.value) return 'tone-th'
  if (loading.value) return 'tone-loading'
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
}
/* กัน content ถูก banner บัง — ดัน main-content ลงมา */
:global(body:has(.country-banner)) {
  padding-top: 48px;
}
.tone-cn {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
  box-shadow: 0 2px 12px rgba(220, 38, 38, 0.35);
}
.tone-th {
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.3);
}
.tone-other {
  background: linear-gradient(90deg, #475569 0%, #64748b 50%, #475569 100%);
  box-shadow: 0 2px 12px rgba(71, 85, 105, 0.3);
}
.tone-loading {
  background: linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%);
  box-shadow: 0 2px 12px rgba(51, 65, 85, 0.3);
}

.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
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
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.country-name {
  letter-spacing: 0.2px;
}
.sep {
  opacity: 0.5;
}
.ip {
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 8px;
  border-radius: 999px;
}
.sub {
  font-size: 11px;
  opacity: 0.92;
  line-height: 1.4;
  margin-top: 2px;
}
.sub b {
  font-weight: 700;
  color: #fef3c7;
}
.tone-th .sub b,
.tone-other .sub b {
  color: #fff;
}
.isp {
  opacity: 0.75;
}

@media (max-width: 640px) {
  .banner-inner {
    padding: 7px 12px;
    gap: 10px;
  }
  .flag { font-size: 18px; }
  .title { font-size: 12px; gap: 6px; }
  .ip { font-size: 11px; padding: 1px 6px; }
  .sub { font-size: 10px; }
  .isp { display: none; }
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
