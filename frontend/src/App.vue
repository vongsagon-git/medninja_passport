<template>
  <div id="app">
    <!-- Version update banner -->
    <Transition name="slide-down">
      <div v-if="showUpdateBanner" class="update-banner">
        <span>มีเวอร์ชันใหม่พร้อมใช้งาน</span>
        <button @click="doReload">กด Refresh เพื่ออัพเดต</button>
        <button class="update-close" @click="showUpdateBanner = false">✕</button>
      </div>
    </Transition>

    <Navbar v-if="!isImmersive" />
    <CountryBanner />
    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <!-- Login (/) + immersive routes → ห้าม slide (เข้าเลย) -->
        <Transition
          :name="route.meta.noTransition || route.name === 'Login' ? '' : 'page'"
          mode="out-in"
        >
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>
    <OrientationGuard />
    <BrowserGate />
    <!-- ⭐ Version badge — บอก version + status (มุมล่าง) -->
    <div v-if="!isImmersive && appVerShort" class="version-badge" :class="{ 'is-stale': showUpdateBanner }">
      <span class="version-dot" :class="{ stale: showUpdateBanner }"></span>
      <span>v.{{ appVerShort }}</span>
    </div>
    <!-- ⭐ Full-screen overlay บังถ้า version ใหม่ + อยู่หน้า critical -->
    <Transition name="version-block">
      <div v-if="shouldBlockForUpdate" class="version-block-overlay">
        <div class="version-block-card">
          <div class="version-block-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h2 class="version-block-title">มีเวอร์ชั่นใหม่</h2>
          <p class="version-block-desc">ระบบมีการอัพเดต กรุณารับเวอร์ชั่นล่าสุดก่อนใช้งานต่อ</p>
          <button class="version-block-btn" @click="doReload">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="margin-right:8px;vertical-align:-3px">
              <path d="M21 12a9 9 0 11-9-9c2.485 0 4.74 1.007 6.364 2.636L21 3v6h-6"/>
            </svg>
            รับเวอร์ชั่นล่าสุด
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import Navbar from './components/layout/Navbar.vue'
import OrientationGuard from './components/common/OrientationGuard.vue'
import BrowserGate from './components/common/BrowserGate.vue'
import CountryBanner from './components/common/CountryBanner.vue'
import { onVersionChange, getVersion } from './services/versionCheck'
// Device fingerprint — ปิดชั่วคราว

export default {
  name: 'App',
  components: {
    Navbar,
    OrientationGuard,
    BrowserGate,
    CountryBanner
  },
  data() {
    return {
      showUpdateBanner: false,
      _verTick: 0
    }
  },
  computed: {
    isImmersive() {
      return this.$route.meta.immersive === true
    },
    appVerShort() {
      // eslint-disable-next-line no-unused-expressions
      this._verTick
      const v = getVersion()
      return v ? v.slice(-6) : ''
    },
    // ⭐ บังจอเฉพาะหน้าสำคัญ (/my, /live) + ไม่บังถ้ากำลังดู VDO
    shouldBlockForUpdate() {
      if (!this.showUpdateBanner) return false
      const p = this.$route.path
      // /my/watch/ = ดู VDO อยู่ — ใช้ toast ปกติ ไม่บัง
      if (p.indexOf('/my/watch/') === 0) return false
      // หน้า /my, /live, /admin = บังเลย
      return p === '/my' || p.indexOf('/my/') === 0 || p.indexOf('/live/') === 0 || p.indexOf('/admin') === 0
    }
  },
  mounted() {
    onVersionChange(() => {
      this.showUpdateBanner = true
      // ⭐ Auto reload ถ้า user อยู่ในหน้า critical (/my, /live ไม่รวม watch)
      // ไม่ต้องรอ user กดปุ่ม — ลบ cache + reload เลย
      const p = this.$route.path
      if (p.indexOf('/my/watch/') === 0) return // กำลังดู VDO — ใช้ toast แทน
      const isCritical = p === '/my' || p.indexOf('/my/') === 0
        || p.indexOf('/live/') === 0 || p.indexOf('/admin') === 0
      if (isCritical) {
        // หน่วง 1 วินาที ให้ user เห็น overlay แวบนึง แล้ว auto-reload
        setTimeout(() => this.doReload(), 1500)
      }
    })
    // ⭐ Force version check ตอน mount (กัน build เก่าที่ไม่มี inline script)
    this._enforceLatestVersion()
    // refresh badge ทุก 5 วิ
    this._verRefresh = setInterval(() => { this._verTick++ }, 5000)
    // Device fingerprint — ปิดชั่วคราว
  },
  beforeUnmount() {
    if (this._verRefresh) clearInterval(this._verRefresh)
  },
  methods: {
    async _enforceLatestVersion() {
      // ⭐ บังคับเช็ค version ตอน app mount — กันเคส user มี build เก่าที่ไม่มี inline script
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        const d = await r.json()
        if (!d.version) return
        const stored = localStorage.getItem('_app_version')
        if (stored && stored !== d.version) {
          // version ใหม่ — ลบ cache + reload
          localStorage.setItem('_app_version', d.version)
          // ไม่ reload ถ้ากำลังดู VDO
          if (this.$route.path.indexOf('/my/watch/') === 0) {
            this.showUpdateBanner = true
            return
          }
          // กัน loop
          const last = sessionStorage.getItem('_enforce_vr')
          const now = Date.now()
          if (last && now - Number(last) < 30000) return
          sessionStorage.setItem('_enforce_vr', String(now))
          this.doReload()
          return
        }
        if (!stored) localStorage.setItem('_app_version', d.version)
      } catch {}
    },
    async doReload() {
      // ⭐ ล้าง cache ทุกอย่างก่อน reload
      try {
        // ลบ Service Worker (ถ้ามี)
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map(r => r.unregister()))
        }
        // ลบ Cache API
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map(k => caches.delete(k)))
        }
        // ลบ localStorage version → inline script จะ fetch ใหม่
        localStorage.removeItem('_app_version')
        sessionStorage.removeItem('_inline_vr')
        sessionStorage.removeItem('_vr')
      } catch {}
      // Hard reload ด้วย cache bypass
      const url = window.location.pathname + '?_=' + Date.now()
      window.location.replace(url)
    }
  }
}
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* ⭐ CountryBanner บนสุด (fixed) — ดัน content ลงมาให้เห็นเต็ม */
  padding-top: var(--country-banner-h, 28px);
}

.main-content {
  flex: 1;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* Version badge — ลอยมุมล่างขวา (floating) */
.version-badge {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 99998;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: rgba(255,255,255,0.95);
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04);
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  animation: badge-float 0.4s ease-out;
}
@keyframes badge-float {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.version-badge.is-stale {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  box-shadow: 0 6px 20px rgba(220,38,38,0.4), 0 0 0 1px rgba(220,38,38,0.5);
  animation: badge-float 0.4s ease-out, badge-attention 2s ease-in-out infinite 0.4s;
  pointer-events: auto;
  cursor: pointer;
}
@keyframes badge-attention {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.version-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
}
.version-dot.stale {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
  animation: live-pulse-small 1.2s ease-in-out infinite;
}
@keyframes live-pulse-small {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
@media (max-width: 768px) {
  .version-badge {
    bottom: 12px;
    right: 12px;
    padding: 6px 12px;
    font-size: 10px;
  }
}

/* Version block overlay — บังจอเมื่อ version เก่าที่หน้า critical */
.version-block-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15,23,42,0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.version-block-card {
  background: #fff;
  border-radius: 16px;
  padding: 36px 28px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
.version-block-icon {
  color: #3b82f6;
  margin-bottom: 12px;
  display: inline-flex;
}
.version-block-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}
.version-block-desc {
  font-size: 14px;
  color: #475569;
  margin-bottom: 24px;
  line-height: 1.6;
}
.version-block-btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(59,130,246,0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.version-block-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(59,130,246,0.5);
}
.version-block-btn:active {
  transform: translateY(0);
}
.version-block-enter-active, .version-block-leave-active { transition: opacity 0.25s ease; }
.version-block-enter-from, .version-block-leave-to { opacity: 0; }

/* Version update toast */
.update-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  background: #1e293b;
  color: #fff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  max-width: 360px;
}
.update-banner button {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.update-banner button:hover {
  background: #2563eb;
}
.update-close {
  background: transparent !important;
  color: #64748b !important;
  font-size: 16px;
  padding: 2px 6px !important;
}
.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from { transform: translateY(20px); opacity: 0; }
.slide-down-leave-to { transform: translateY(20px); opacity: 0; }
</style>
