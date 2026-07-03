<template>
  <Transition name="rotate-fade">
    <div v-if="showGuard" class="orientation-guard" aria-live="assertive">
      <div class="guard-inner">
        <div class="phone-illustration" aria-hidden="true">
          <div class="phone-body">
            <div class="phone-screen"></div>
            <div class="phone-notch"></div>
            <div class="phone-home"></div>
          </div>
          <svg class="rotate-arrow" viewBox="0 0 60 60" fill="none">
            <path
              d="M45 15 A20 20 0 1 0 55 40"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />
            <path d="M53 8 L55 15 L48 17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          </svg>
        </div>

        <h2>กรุณาหมุนหน้าจอ</h2>
        <p>MedNinja Passport ออกแบบมาสำหรับใช้งานแนวตั้ง<br>กรุณาหมุนอุปกรณ์ของคุณเป็นแนวตั้ง</p>

        <div class="hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>ยกเว้นตอนดูวิดีโอเต็มจอ สามารถใช้แนวนอนได้</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { isMobilePhone } from '../../utils/deviceDetect'

export default {
  name: 'OrientationGuard',
  data() {
    return {
      isLandscape: false,
      isFullscreen: false,
      _mqOrientation: null,
      _fsHandler: null,
      _visHandler: null
    }
  },
  computed: {
    // Route paths that allow landscape (video pages)
    isVideoRoute() {
      const path = this.$route?.path || ''
      return path.startsWith('/my/watch/')
        || path.startsWith('/live/')
        || path === '/live'
        || path.startsWith('/demo/watch/')
    },
    // ใช้ util มาตรฐานของระบบ — เช็ค iPhone + Android phone (ไม่รวม tablet)
    // iPad iOS 13+ UA=Mac ถูก handle ที่ util ด้วย maxTouchPoints
    isMobile() {
      return isMobilePhone()
    },
    showGuard() {
      // Mobile phone + landscape + ไม่ใช่ (video route + fullscreen)
      if (!this.isMobile) return false
      if (!this.isLandscape) return false
      if (this.isVideoRoute && this.isFullscreen) return false
      return true
    }
  },
  mounted() {
    this._mqOrientation = window.matchMedia('(orientation: landscape)')
    this._updateOrientation = () => { this.isLandscape = this._mqOrientation.matches }
    this._mqOrientation.addEventListener('change', this._updateOrientation)
    this._updateOrientation()

    // Fullscreen state — refresh on change (all vendor prefixes)
    this._fsHandler = () => {
      this.isFullscreen = !!(document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement)
    }
    document.addEventListener('fullscreenchange', this._fsHandler)
    document.addEventListener('webkitfullscreenchange', this._fsHandler)
    this._fsHandler()

    // Re-check when user switches back to tab (iOS quirks)
    this._visHandler = () => {
      if (document.visibilityState === 'visible') {
        this._updateOrientation()
        this._fsHandler()
      }
    }
    document.addEventListener('visibilitychange', this._visHandler)
  },
  beforeUnmount() {
    if (this._mqOrientation) this._mqOrientation.removeEventListener('change', this._updateOrientation)
    if (this._fsHandler) {
      document.removeEventListener('fullscreenchange', this._fsHandler)
      document.removeEventListener('webkitfullscreenchange', this._fsHandler)
    }
    if (this._visHandler) document.removeEventListener('visibilitychange', this._visHandler)
  }
}
</script>

<style scoped>
.orientation-guard {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: linear-gradient(135deg, #0c1e3d 0%, #0e3a5f 50%, #0a2540 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e0f2fe;
}

.guard-inner {
  text-align: center;
  max-width: 320px;
  animation: guard-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes guard-enter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Phone illustration ── */
.phone-illustration {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
  color: #7dd3fc;
}
.phone-body {
  width: 60px;
  height: 100px;
  border: 3px solid currentColor;
  border-radius: 12px;
  margin: 10px auto;
  position: relative;
  background: rgba(125, 211, 252, 0.08);
  animation: phone-rotate 2.4s ease-in-out infinite;
  transform-origin: center;
}
@keyframes phone-rotate {
  0%, 20% { transform: rotate(-90deg); }
  45%, 60% { transform: rotate(0deg); }
  80%, 100% { transform: rotate(-90deg); }
}
.phone-screen {
  position: absolute;
  inset: 3px;
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.2), rgba(125, 211, 252, 0.05));
}
.phone-notch {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.6;
}
.phone-home {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.6;
}

.rotate-arrow {
  position: absolute;
  top: 12px;
  right: 4px;
  width: 40px;
  height: 40px;
  color: #38bdf8;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.5));
  animation: arrow-spin 2.4s ease-in-out infinite;
}
@keyframes arrow-spin {
  0%, 20%, 80%, 100% { opacity: 0.35; transform: scale(0.9); }
  40%, 60% { opacity: 1; transform: scale(1.1); }
}

/* ── Text ── */
.guard-inner h2 {
  font-size: 22px;
  font-weight: 800;
  color: #f0f9ff;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.guard-inner p {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(224, 242, 254, 0.75);
  margin-bottom: 24px;
}

.hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  font-size: 12px;
  font-weight: 600;
  color: #7dd3fc;
}

/* ── Transition ── */
.rotate-fade-enter-active,
.rotate-fade-leave-active {
  transition: opacity 0.25s ease;
}
.rotate-fade-enter-from,
.rotate-fade-leave-to {
  opacity: 0;
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .phone-body, .rotate-arrow, .guard-inner { animation: none; }
  .phone-body { transform: rotate(-45deg); }
}
</style>
