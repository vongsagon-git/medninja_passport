<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

// ⭐ Video hardcoded — dual encryption (Ali Prop + Widevine) ใน 1 ID
const VIDEO_ID = '00bef48a7d1071f18224e6f6c55a0102'

const playerReady = ref(false)
const errorMsg = ref('')
const isPlaying = ref(false)
const logs = ref([])

let player = null

function log(msg, type = 'info') {
  const time = new Date().toTimeString().slice(0, 8)
  logs.value.push({ time, msg, type })
  if (logs.value.length > 100) logs.value.shift()
  console.log(`[Beta ${time}] ${msg}`)
}

// ⭐ iOS detect (4-layer: UA + userAgentData + touch + Mac Safari check)
function detectIOS() {
  const ua = navigator.userAgent
  const touch = navigator.maxTouchPoints || 0
  if (/iPad|iPhone|iPod|CriOS|FxiOS/.test(ua)) return true
  if (touch > 0) {
    if (/Safari/.test(ua) && /Mac/.test(ua) && !/Chrome/.test(ua)) return true
    if (navigator.platform === 'MacIntel') return true
  }
  if (navigator.userAgentData?.platform === 'iOS') return true
  return false
}

const iosDetected = ref(detectIOS())

const user = computed(() => auth.user || {})
const userEmail = computed(() => user.value.email || 'unknown')
const watermarkText = computed(() => {
  const email = userEmail.value
  const now = new Date()
  const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  return `${email} · ${hhmm}`
})

// ─── Aliplayer SDK loader ───
function loadSDK() {
  return new Promise((resolve, reject) => {
    if (window.Aliplayer) return resolve()
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = '/vendor/aliplayer/aliplayer-2.35.4.css'
    document.head.appendChild(css)
    const s = document.createElement('script')
    s.src = '/vendor/aliplayer/aliplayer-2.35.4.js'
    s.async = false
    s.onload = () => {
      const check = setInterval(() => {
        if (window.Aliplayer) { clearInterval(check); resolve() }
      }, 100)
      setTimeout(() => reject(new Error('Aliplayer SDK timeout')), 15000)
    }
    s.onerror = () => reject(new Error('Failed to load Aliplayer SDK v2.35.4'))
    document.head.appendChild(s)
  })
}

// ⭐ Fetch PlayAuth (iOS mode)
async function fetchPlayAuth() {
  const bust = Date.now() + '-' + Math.random().toString(36).substring(2, 8)
  const res = await fetch(`/api/china/test-playauth/${VIDEO_ID}?_=${bust}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`PlayAuth fail ${res.status}`)
  const data = await res.json()
  if (!data.playAuth) throw new Error('No playAuth in response')
  return data.playAuth
}

// ⭐ Fetch STS (Other mode)
async function fetchSTS() {
  const bust = Date.now() + '-' + Math.random().toString(36).substring(2, 8)
  const headers = {}
  if (iosDetected.value) headers['X-MN-Device'] = 'ios'
  const res = await fetch(`/api/china/test-serve/${VIDEO_ID}?_=${bust}`, {
    cache: 'no-store',
    headers
  })
  if (!res.ok) throw new Error(`STS fail ${res.status}`)
  return res.json()
}

async function initPlayer() {
  try {
    log('เริ่มโหลด Aliplayer SDK...', 'info')
    await loadSDK()
    log('Aliplayer SDK พร้อม', 'success')
    log(`iOS detect: ${iosDetected.value}`, 'info')

    // ⭐ Base config (เหมือน WATCH production)
    const baseConfig = {
      id: 'beta-player',
      vid: VIDEO_ID,
      width: '100%',
      height: '100%',
      autoplay: false,
      isLive: false,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'hover',
      useH5Prism: true,
      // Anti-piracy (เหมือน WATCH)
      disableAirplay: true,
      disableChromecast: true,
      license: {
        domain: 'passport.medninja.academy',
        key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
      }
    }

    let config
    if (iosDetected.value) {
      // ─── PATH 1: iOS — PlayAuth + playConfig filter ───
      log('Fetch PlayAuth (iOS mode)...', 'info')
      const playAuth = await fetchPlayAuth()
      log(`PlayAuth ได้แล้ว (length=${playAuth.length})`, 'success')
      config = {
        ...baseConfig,
        playauth: playAuth,
        encryptType: 1,
        playConfig: {
          EncryptType: 'AliyunVoDEncryption'  // 🔑 filter ซ่อน Widevine
        }
      }
      log('Config: iOS PlayAuth + playConfig filter Ali Prop', 'info')
    } else {
      // ─── PATH 2: Other — STS + permissive Widevine ───
      log('Fetch STS (Other mode)...', 'info')
      const sts = await fetchSTS()
      log(`STS ได้แล้ว (${sts.accessKeyId?.substring(0, 10)}...)`, 'success')
      config = {
        ...baseConfig,
        accessKeyId: sts.accessKeyId,
        accessKeySecret: sts.accessKeySecret,
        securityToken: sts.securityToken,
        region: sts.region || 'ap-southeast-1',
        encryptType: 1
      }
      log('Config: Other STS + encryptType 1 (permissive Widevine)', 'info')
    }

    log('สร้าง Aliplayer instance...', 'info')
    player = new window.Aliplayer(config, function () {
      log('✅ Player instance สร้างสำเร็จ', 'success')
      playerReady.value = true
    })

    player.on('ready', () => log('Event: ready', 'info'))
    player.on('play', () => {
      log('Event: play', 'success')
      isPlaying.value = true
    })
    player.on('playing', () => {
      log('Event: playing (เล่นจริง!)', 'success')
      isPlaying.value = true
    })
    player.on('canplay', () => log('Event: canplay (พร้อมเล่น)', 'success'))
    player.on('waiting', () => log('Event: waiting (buffering)', 'warn'))
    player.on('pause', () => {
      log('Event: pause', 'warn')
      isPlaying.value = false
    })
    player.on('ended', () => log('Event: ended', 'info'))
    player.on('error', (e) => {
      const d = e?.paramData ? JSON.stringify(e.paramData) : (e?.message || 'unknown')
      log(`❌ ERROR: ${d}`, 'error')
      errorMsg.value = d
    })
  } catch (err) {
    log(`❌ Init error: ${err.message}`, 'error')
    errorMsg.value = err.message
  }
}

// ⭐ ส่ง log ให้ dev (ตัวเดียวกับ test-serve)
async function sendLogs() {
  try {
    const device = {
      ua: navigator.userAgent,
      isIOS: iosDetected.value,
      platform: navigator.platform,
      touch: navigator.maxTouchPoints
    }
    const res = await fetch('/api/china/test-logs-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device,
        serveInfo: { source: 'watch-beta', user: userEmail.value },
        logs: logs.value
      })
    })
    if (!res.ok) throw new Error(`Upload fail ${res.status}`)
    log('✅ Logs ส่งให้ dev แล้ว', 'success')
  } catch (err) {
    log(`❌ ส่ง logs fail: ${err.message}`, 'error')
  }
}

function reloadPlayer() {
  log('🔄 Reloading...', 'warn')
  if (player) {
    try { player.dispose() } catch {}
    player = null
  }
  const oldEl = document.getElementById('beta-player')
  if (oldEl && oldEl.parentNode) {
    const newEl = document.createElement('div')
    newEl.id = 'beta-player'
    oldEl.parentNode.replaceChild(newEl, oldEl)
  }
  playerReady.value = false
  errorMsg.value = ''
  setTimeout(initPlayer, 200)
}

onMounted(() => {
  document.title = 'Watch Beta — 1 ID Universal Test'
  initPlayer()
})

onUnmounted(() => {
  if (player) try { player.dispose() } catch {}
})
</script>

<template>
  <div class="beta-page">
    <header class="beta-header">
      <div class="brand">
        <span class="badge">🧪 BETA</span>
        <span class="title">Watch — 1 ID Universal</span>
      </div>
      <div class="user-info">
        <span class="user-email">{{ userEmail }}</span>
      </div>
    </header>

    <main class="beta-main">
      <!-- Player wrapper -->
      <div class="player-wrap">
        <div id="beta-player" class="player"></div>

        <!-- Watermark overlay (เหมือน WATCH) -->
        <div class="watermark-layer">
          <div class="wm wm-tl">{{ watermarkText }}</div>
          <div class="wm wm-tr">{{ watermarkText }}</div>
          <div class="wm wm-bl">{{ watermarkText }}</div>
          <div class="wm wm-br">{{ watermarkText }}</div>
          <div class="wm wm-center">{{ watermarkText }}</div>
        </div>

        <!-- Loading -->
        <div v-if="!playerReady && !errorMsg" class="status-overlay">
          <div class="spinner"></div>
          <div>กำลังโหลด...</div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="status-overlay error">
          <div class="err-icon">⚠️</div>
          <div class="err-msg">{{ errorMsg }}</div>
          <button class="btn" @click="reloadPlayer">🔄 ลองใหม่</button>
        </div>
      </div>

      <!-- Info panel -->
      <div class="info-panel">
        <div class="info-row">
          <span class="label">Video ID</span>
          <span class="value mono">{{ VIDEO_ID }}</span>
        </div>
        <div class="info-row">
          <span class="label">Detect</span>
          <span class="value">
            <span class="path-badge" :class="iosDetected ? 'path-ios' : 'path-other'">
              {{ iosDetected ? '📱 PATH 1: iOS (PlayAuth + Ali Prop)' : '🖥️ PATH 2: Other (STS + Widevine)' }}
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="label">User</span>
          <span class="value mono">{{ userEmail }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn btn-reload" @click="reloadPlayer">🔄 Reload Player</button>
        <button class="btn btn-send" @click="sendLogs">📤 ส่ง Logs ให้ Dev</button>
      </div>

      <!-- Debug logs -->
      <details class="log-panel" open>
        <summary>📝 Debug Logs ({{ logs.length }})</summary>
        <div class="log-list">
          <div v-for="(l, i) in logs" :key="i" :class="['log-line', `log-${l.type}`]">
            <span class="time">[{{ l.time }}]</span>
            <span>{{ l.msg }}</span>
          </div>
        </div>
      </details>
    </main>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.beta-page {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Sarabun', -apple-system, sans-serif;
}

.beta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(90deg, #7c3aed, #2563eb);
  border-bottom: 2px solid rgba(255,255,255,0.15);
}
.brand { display: flex; align-items: center; gap: 10px; }
.badge {
  background: #fbbf24;
  color: #78350f;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.title { font-size: 15px; font-weight: 700; color: white; }
.user-email { font-size: 12px; color: rgba(255,255,255,0.85); font-family: Consolas, monospace; }

.beta-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 16px;
}

.player-wrap {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.player { width: 100% !important; height: 100% !important; }

/* Watermark */
.watermark-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
.wm {
  position: absolute;
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  text-shadow: 0 0 4px rgba(0,0,0,0.6);
  font-family: Consolas, monospace;
  white-space: nowrap;
}
.wm-tl { top: 10px; left: 10px; }
.wm-tr { top: 10px; right: 10px; }
.wm-bl { bottom: 10px; left: 10px; }
.wm-br { bottom: 10px; right: 10px; }
.wm-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 16px;
  color: rgba(255,255,255,0.12);
}

.status-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  background: rgba(0,0,0,0.7);
  color: white;
  text-align: center;
  padding: 20px;
  z-index: 5;
}
.status-overlay.error { background: rgba(0,0,0,0.85); }
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
.err-icon { font-size: 40px; }
.err-msg { font-size: 13px; color: #fca5a5; max-width: 500px; word-break: break-all; }

.info-panel {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 13px;
}
.info-row:last-child { border-bottom: none; }
.label {
  width: 80px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.value { flex: 1; color: #e2e8f0; }
.mono { font-family: Consolas, monospace; font-size: 11px; word-break: break-all; }

.path-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.path-ios { background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
.path-other { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: #e2e8f0;
  transition: background 0.2s;
}
.btn:hover { background: rgba(255,255,255,0.1); }
.btn-reload { background: rgba(251,191,36,0.15); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
.btn-send { background: rgba(74,222,128,0.15); color: #4ade80; border-color: rgba(74,222,128,0.3); }

.log-panel {
  background: #000;
  border: 1px solid rgba(74,222,128,0.15);
  border-radius: 10px;
  padding: 14px 16px;
}
.log-panel summary {
  cursor: pointer;
  color: #94a3b8;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 8px;
}
.log-list {
  max-height: 280px;
  overflow-y: auto;
  font-family: Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.6;
}
.log-line { padding: 2px 0; }
.log-line .time { color: #64748b; margin-right: 8px; }
.log-info { color: #cbd5e1; }
.log-success { color: #4ade80; }
.log-warn { color: #fbbf24; }
.log-error { color: #f87171; }
</style>
