<template>
  <Transition name="gate-fade">
    <div v-if="showGate" class="browser-gate" role="alert">
      <div class="gate-inner">
        <!-- Icon (large, animated) -->
        <div class="gate-icon" aria-hidden="true">
          <div class="icon-ring"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="42" height="42">
            <circle cx="12" cy="12" r="10"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4M12 16h.01"/>
          </svg>
        </div>

        <h2>{{ result.message }}</h2>
        <p>{{ result.detail }}</p>

        <!-- Recommended browsers panel -->
        <div class="browsers-list">
          <div class="browsers-list-title">รองรับเบราว์เซอร์เหล่านี้:</div>
          <div class="browsers-grid">
            <div class="browser-item">
              <div class="browser-icon browser-chrome"></div>
              <div class="browser-info">
                <div class="browser-name">Google Chrome</div>
                <div class="browser-note">iOS / Android / Desktop</div>
              </div>
            </div>
            <div class="browser-item">
              <div class="browser-icon browser-safari"></div>
              <div class="browser-info">
                <div class="browser-name">Safari</div>
                <div class="browser-note">iPhone / iPad เท่านั้น</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug info (dev only, but useful for support) -->
        <div class="gate-debug" :title="debugUA">
          <span class="debug-dot"></span>
          <span>{{ deviceInfo }}</span>
        </div>

        <!-- Retry -->
        <button class="gate-retry" @click="checkAgain" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          ตรวจสอบอีกครั้ง
        </button>
      </div>
    </div>
  </Transition>
</template>

<script>
import { checkBrowserSupport, getDeviceInfo, isExceptionPath } from '../../utils/browserCheck'

export default {
  name: 'BrowserGate',
  data() {
    return {
      result: { supported: true, isMobile: false },
      deviceInfo: '',
      debugUA: '',
      _visHandler: null
    }
  },
  computed: {
    // Route ที่ยกเว้น browser gate:
    // - /demo/watch/* → LMS convention (public preview)
    // - Exception section IDs → LMS convention
    isExempt() {
      const path = this.$route?.path || ''
      return isExceptionPath(path)
    },
    showGate() {
      if (this.isExempt) return false
      return this.result.supported === false
    }
  },
  mounted() {
    this._runCheck()
    // Re-check when tab visible (user may switch browsers via deep link etc.)
    this._visHandler = () => {
      if (document.visibilityState === 'visible') this._runCheck()
    }
    document.addEventListener('visibilitychange', this._visHandler)
  },
  beforeUnmount() {
    if (this._visHandler) document.removeEventListener('visibilitychange', this._visHandler)
  },
  methods: {
    _runCheck() {
      try {
        this.result = checkBrowserSupport()
        this.deviceInfo = getDeviceInfo()
        this.debugUA = navigator.userAgent || ''
      } catch (err) {
        // If detection itself fails → allow through (fail-open for safety)
        this.result = { supported: true, isMobile: false }
      }
    },
    checkAgain() {
      this._runCheck()
    }
  }
}
</script>

<style scoped>
.browser-gate {
  position: fixed;
  inset: 0;
  z-index: 999998;
  background: linear-gradient(135deg, #0a1929 0%, #0d2847 50%, #0e3a5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  overflow-y: auto;
}

.gate-inner {
  width: 100%;
  max-width: 460px;
  text-align: center;
  padding: 32px 28px;
  background: rgba(15, 42, 71, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(14, 165, 233, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: gate-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes gate-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.gate-icon {
  position: relative;
  width: 84px;
  height: 84px;
  margin: 0 auto 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
}
.icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%);
  animation: icon-pulse 1.8s ease-in-out infinite;
}
@keyframes icon-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.9; }
}

.gate-inner h2 {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
  line-height: 1.35;
}
.gate-inner > p {
  font-size: 13.5px;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.72);
  margin-bottom: 24px;
}

/* ── Browsers list ── */
.browsers-list {
  background: rgba(2, 12, 24, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 14px;
  padding: 18px 18px 20px;
  margin-bottom: 20px;
  text-align: left;
}
.browsers-list-title {
  font-size: 11px;
  font-weight: 700;
  color: #7dd3fc;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 14px;
  text-align: center;
}
.browsers-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.browser-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  background: rgba(14, 165, 233, 0.05);
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-radius: 10px;
}
.browser-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
/* Chrome logo (inline SVG data URI) */
.browser-chrome {
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23fff' d='M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z'/%3E%3Cpath fill='%234285F4' d='M24 4A20 20 0 0 0 6.7 13.9L15.4 29A10 10 0 0 1 24 14L41.9 14A20 20 0 0 0 24 4Z'/%3E%3Cpath fill='%2334A853' d='M6.7 13.9A20 20 0 0 0 15.4 43.4L24 28.4A10 10 0 0 1 15.4 13.9Z'/%3E%3Cpath fill='%23FBBC04' d='M41.9 14L24 14A10 10 0 0 1 32.6 28.4L23.5 43.9A20 20 0 0 0 41.9 14Z'/%3E%3Ccircle cx='24' cy='24' r='7' fill='%234285F4'/%3E%3C/svg%3E");
}
.browser-safari {
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3CradialGradient id='sG' cx='24' cy='24' r='20'%3E%3Cstop offset='0' stop-color='%23bfeaff'/%3E%3Cstop offset='1' stop-color='%234c9cff'/%3E%3C/radialGradient%3E%3Ccircle cx='24' cy='24' r='20' fill='url(%23sG)'/%3E%3Cpath fill='%23fff' d='M24 6L26 20L38 24L26 28L24 42L22 28L10 24L22 20Z'/%3E%3Cpath fill='%23ff3b30' d='M24 8L25 22L24 24L23 22Z'/%3E%3C/svg%3E");
}
.browser-info { flex: 1; }
.browser-name {
  font-size: 14.5px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.15;
}
.browser-note {
  font-size: 11.5px;
  color: rgba(148, 163, 184, 0.85);
  margin-top: 3px;
}

/* ── Debug info ── */
.gate-debug {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  margin-bottom: 20px;
  font-family: 'Inter', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 500;
  color: rgba(186, 230, 253, 0.75);
  background: rgba(2, 12, 24, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 999px;
  cursor: help;
}
.debug-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
}

/* ── Retry button ── */
.gate-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
  background: linear-gradient(135deg, #7dd3fc, #38bdf8);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.4);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
  letter-spacing: 0.02em;
}
.gate-retry:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 8px 20px rgba(56, 189, 248, 0.5);
}
.gate-retry:active { transform: translateY(0); }

/* ── Transition ── */
.gate-fade-enter-active,
.gate-fade-leave-active {
  transition: opacity 0.25s ease;
}
.gate-fade-enter-from,
.gate-fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 480px) {
  .gate-inner { padding: 28px 20px; border-radius: 18px; }
  .gate-icon { width: 72px; height: 72px; margin-bottom: 18px; }
  .gate-inner h2 { font-size: 18px; }
  .gate-inner > p { font-size: 13px; }
  .browsers-list { padding: 14px 14px 16px; }
  .browser-icon { width: 30px; height: 30px; }
  .browser-name { font-size: 13.5px; }
}
@media (max-height: 640px) and (orientation: landscape) {
  .browser-gate { align-items: flex-start; padding-top: 20px; }
  .gate-inner { padding: 20px 24px; }
  .gate-icon { width: 60px; height: 60px; margin-bottom: 12px; }
  .gate-inner h2 { font-size: 17px; margin-bottom: 6px; }
  .gate-inner > p { font-size: 12.5px; margin-bottom: 14px; }
  .browsers-list { padding: 12px; margin-bottom: 12px; }
  .browser-item { padding: 8px 10px; }
  .gate-debug { margin-bottom: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .icon-ring, .gate-inner { animation: none; }
}
</style>
