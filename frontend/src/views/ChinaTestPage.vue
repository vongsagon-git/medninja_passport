<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const playerReady = ref(false)
const playerStatus = ref('loading')
const logs = ref([])
const errorMsg = ref('')

const VIDEO_ID = 'd0245b99795e71f1a622f6f7d6580102'
const CDN_DOMAIN = 'cdn-cn.medninja.academy'
const PLAYAUTH_ENDPOINT = `/api/china/playauth/${VIDEO_ID}`
const HEALTHCHECK_URL = `https://${CDN_DOMAIN}/${VIDEO_ID}/3c72bdfb27c83a11628939deb885b395-ld-encrypt-stream.m3u8`

const cdnInfo = ref({
  edge: 'ตรวจสอบ...',
  location: 'ตรวจสอบ...',
  cache: 'ตรวจสอบ...',
  responseMs: 0
})

let player = null
let playerContainer = null

function log(msg, type = 'info') {
  const time = new Date().toTimeString().slice(0, 8)
  logs.value.push({ time, msg, type })
  if (logs.value.length > 50) logs.value.shift()
  console.log(`[${time}] ${msg}`)
}

// SDK ที่ verify แล้วว่าทำงาน (mobile + desktop):
// - de/prismplayer/2.15.4 = legacy path, ทำงานได้ทั้ง PC + Mobile
// - imp-web-player/2.27.0 = ทำงานแค่ PC (crash silent บนมือถือ)
// - imp-web-player/2.28+ = ต้องมี license (Dec 2024)
const ALIPLAYER_VERSIONS = [
  { path: 'de/prismplayer', v: '2.15.4' },
  { path: 'apsara-media-box/imp-web-player', v: '2.27.0' },
  { path: 'apsara-media-box/imp-web-player', v: '2.25.1' }
]

function waitForAliplayer(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    let elapsed = 0
    const timer = setInterval(() => {
      if (window.Aliplayer) {
        clearInterval(timer)
        log(`window.Aliplayer พร้อม (ใช้เวลา ${Date.now() - start}ms)`, 'success')
        resolve()
      } else {
        elapsed = Date.now() - start
        if (elapsed > timeoutMs) {
          clearInterval(timer)
          reject(new Error(`Timeout (${timeoutMs}ms) รอ window.Aliplayer`))
        } else if (elapsed % 5000 < 200) {
          log(`ยังรอ Aliplayer... ${Math.round(elapsed/1000)}s`, 'warn')
        }
      }
    }, 200)
  })
}

function loadScriptWithFallback(versions, currentIndex = 0) {
  return new Promise((resolve, reject) => {
    if (currentIndex >= versions.length) {
      return reject(new Error('ลอง SDK ทุก version แล้วยังไม่ได้'))
    }
    const { path, v: version } = versions[currentIndex]

    if (window.Aliplayer) {
      log(`window.Aliplayer มีอยู่แล้ว (skip load)`, 'info')
      return resolve()
    }

    log(`กำลังโหลด Aliplayer SDK ${path}@${version}...`, 'info')

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `https://g.alicdn.com/${path}/${version}/skins/default/aliplayer-min.css`
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = `https://g.alicdn.com/${path}/${version}/aliplayer-min.js`
    script.async = false

    const startTime = Date.now()
    script.onload = async () => {
      log(`SDK ${path}@${version} โหลดสำเร็จ (${Date.now() - startTime}ms)`, 'info')

      // Debug: เช็คว่ามี global อะไรที่ SDK เพิ่งใส่
      const availableGlobals = ['Aliplayer', 'AliPlayer', 'aliplayer', 'IntlPlayer', 'PrismPlayer']
        .filter(k => typeof window[k] !== 'undefined')
      log(`Globals ที่เจอ: [${availableGlobals.join(', ') || 'ไม่มี'}]`, availableGlobals.length ? 'info' : 'warn')

      // Detect device info สำหรับ debug
      const ua = navigator.userAgent
      const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua)
      const isAndroid = /Android/i.test(ua)
      const chromeVer = (ua.match(/Chrome\/([\d.]+)/) || [])[1] || 'n/a'
      log(`Device: ${isMobile ? 'Mobile' : 'Desktop'} · Android:${isAndroid} · Chrome ${chromeVer}`, 'info')

      try {
        await waitForAliplayer(30000)
        resolve()
      } catch (e) {
        log(`${path}@${version} timeout — ลอง version ถัดไป`, 'warn')
        try {
          await loadScriptWithFallback(versions, currentIndex + 1)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
    }
    script.onerror = async () => {
      log(`โหลด ${path}@${version} ไม่สำเร็จ — ลอง version ถัดไป`, 'warn')
      try {
        await loadScriptWithFallback(versions, currentIndex + 1)
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    document.head.appendChild(script)
  })
}

function loadAliplayerSDK() {
  return loadScriptWithFallback(ALIPLAYER_VERSIONS)
}

async function fetchPlayAuth() {
  log(`ขอ PlayAuth token จาก backend: ${PLAYAUTH_ENDPOINT}`, 'info')
  const res = await fetch(PLAYAUTH_ENDPOINT, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Backend error ${res.status}: ${errText.substring(0, 200)}`)
  }

  const data = await res.json()
  if (!data.playAuth) {
    throw new Error('Backend ไม่ได้ส่ง playAuth กลับมา')
  }

  log(`PlayAuth token ได้แล้ว (expire ~50 นาที)`, 'success')
  return data.playAuth
}

async function initPlayer() {
  try {
    await loadAliplayerSDK()

    if (!window.Aliplayer) {
      throw new Error('Aliplayer is not defined')
    }

    const playAuth = await fetchPlayAuth()

    log(`กำลังสร้าง Aliplayer (VidAuth mode) สำหรับ video: ${VIDEO_ID.substring(0, 8)}...`, 'info')

    player = new window.Aliplayer({
      id: 'china-player',
      vid: VIDEO_ID,
      playauth: playAuth,
      width: '100%',
      height: '100%',
      autoplay: false,
      isLive: false,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'hover',
      useH5Prism: true,
      encryptType: 1
    }, function (p) {
      log('Aliplayer instance สร้างสำเร็จ (encrypted mode)', 'success')
      playerReady.value = true
      playerStatus.value = 'ready'
    })

    player.on('ready', () => log('Event: ready', 'info'))
    player.on('play', () => {
      log('Event: play', 'success')
      playerStatus.value = 'playing'
    })
    player.on('pause', () => {
      log('Event: pause', 'warn')
      playerStatus.value = 'paused'
    })
    player.on('canplay', () => {
      log('Event: canplay - วิดีโอพร้อมเล่น', 'success')
    })
    player.on('waiting', () => {
      log('Event: waiting (กำลัง buffer)', 'warn')
    })
    player.on('error', (e) => {
      const details = e?.paramData ? JSON.stringify(e.paramData) : (e?.message || 'unknown')
      log(`Event: ERROR - ${details}`, 'error')
      errorMsg.value = `เล่นวิดีโอไม่ได้: ${details}`
      playerStatus.value = 'error'
    })
    player.on('ended', () => log('Event: ended', 'info'))
  } catch (err) {
    log(`เกิด Error: ${err.message}`, 'error')
    errorMsg.value = err.message
    playerStatus.value = 'error'
  }
}

function parseEdgeCode(via) {
  if (!via) return { edge: 'ไม่มี Via header', location: '?' }

  const codes = {
    'sg': '🇸🇬 Singapore',
    'l2sg': '🇸🇬 Singapore L2',
    'hk': '🇭🇰 Hong Kong',
    'l2hk': '🇭🇰 Hong Kong L2',
    'tw': '🇹🇼 Taiwan',
    'jp': '🇯🇵 Japan',
    'l2jp': '🇯🇵 Japan L2',
    'th': '🇹🇭 Thailand',
    'kr': '🇰🇷 Korea',
    'bj': '🇨🇳 Beijing',
    'sh': '🇨🇳 Shanghai',
    'gz': '🇨🇳 Guangzhou',
    'sz': '🇨🇳 Shenzhen'
  }

  const firstEdge = via.split(',')[0].trim()
  const match = firstEdge.match(/ens-cache\d+\.(l2)?([a-z]+)\d+/i)
  if (!match) return { edge: firstEdge, location: 'unknown' }

  const key = (match[1] || '') + match[2]
  return {
    edge: firstEdge,
    location: codes[key.toLowerCase()] || `? (${key})`
  }
}

async function checkCdnEdge() {
  log('กำลังตรวจ CDN edge location...', 'info')
  const start = performance.now()

  try {
    const res = await fetch(HEALTHCHECK_URL, { method: 'HEAD', cache: 'no-store' })
    const ms = Math.round(performance.now() - start)
    const via = res.headers.get('via') || res.headers.get('Via')
    const cache = res.headers.get('x-cache') || res.headers.get('X-Cache') || 'unknown'
    const { edge, location } = parseEdgeCode(via)

    cdnInfo.value = {
      edge,
      location,
      cache: cache.split(' ')[0],
      responseMs: ms
    }

    log(`CDN Edge: ${location} (${edge})`, 'success')
    log(`Cache: ${cache} · Response time: ${ms}ms`, 'info')
  } catch (err) {
    log(`ตรวจ CDN ไม่สำเร็จ: ${err.message}`, 'warn')
    cdnInfo.value = { edge: 'error', location: 'ตรวจไม่ได้', cache: '-', responseMs: 0 }
  }
}

onMounted(() => {
  document.title = 'MedNinja - Test China Video'
  log('หน้าเทส MedNinja China VOD เริ่มทำงาน', 'info')
  log(`Video ID: ${VIDEO_ID}`, 'info')
  checkCdnEdge()
  initPlayer()
})

onUnmounted(() => {
  if (player) {
    try {
      player.dispose()
    } catch (e) {
      console.warn('Error disposing player:', e)
    }
  }
})
</script>

<template>
  <div class="china-test-page">
    <div class="container">
      <header class="page-header">
        <div class="logo">
          <span class="logo-icon">🎬</span>
          <span class="logo-text">MedNinja <em>China Test</em></span>
        </div>
        <p class="tagline">ทดสอบเล่นวิดีโอผ่าน Alibaba CDN (HK Edge) + HTTP-DRM</p>
      </header>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">CDN Edge (ที่คุณ hit)</div>
          <div class="info-value">
            <strong style="color:#38bdf8">{{ cdnInfo.location }}</strong>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px">{{ cdnInfo.edge }}</div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">CDN Cache</div>
          <div class="info-value">
            <span class="badge" :class="cdnInfo.cache === 'HIT' ? 'badge-playing' : 'badge-loading'">
              {{ cdnInfo.cache }}
            </span>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px">{{ cdnInfo.responseMs }}ms</div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Encryption</div>
          <div class="info-value">
            <span class="badge badge-encrypt">Alibaba HTTP-DRM 🔒</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Player Status</div>
          <div class="info-value">
            <span :class="['badge', `badge-${playerStatus}`]">
              {{ playerStatus === 'loading' ? 'กำลังโหลด...' :
                 playerStatus === 'ready' ? 'พร้อมเล่น' :
                 playerStatus === 'playing' ? 'กำลังเล่น' :
                 playerStatus === 'paused' ? 'หยุด' :
                 playerStatus === 'error' ? 'ผิดพลาด' : playerStatus }}
            </span>
          </div>
        </div>
      </div>

      <div class="player-wrap">
        <div id="china-player" class="player"></div>
      </div>

      <div v-if="errorMsg" class="error-banner">
        ⚠️ {{ errorMsg }}
      </div>

      <details class="debug-panel" open>
        <summary>📝 Debug Console ({{ logs.length }})</summary>
        <div class="log-list">
          <div
            v-for="(l, i) in logs"
            :key="i"
            :class="['log-line', `log-${l.type}`]"
          >
            <span class="log-time">[{{ l.time }}]</span>
            <span class="log-msg">{{ l.msg }}</span>
          </div>
        </div>
      </details>

      <footer class="page-footer">
        <p>
          <strong>ติดต่อ</strong>: ส่ง screenshot + browser console log กลับมาที่ทีม MedNinja
        </p>
        <p class="footer-meta">
          MedNinja © 2026 · China Test Page · Alibaba VOD + Aliplayer
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.china-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c1e3f 100%);
  color: #f1f5f9;
  font-family: 'Sarabun', 'Segoe UI', -apple-system, sans-serif;
  padding: 24px 16px;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 36px;
}

.logo-text em {
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: normal;
  font-weight: 800;
}

.tagline {
  color: #94a3b8;
  font-size: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.info-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.info-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.info-value {
  font-size: 14px;
  color: #e2e8f0;
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.badge-encrypt {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
}

.badge-loading {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.badge-ready {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.badge-playing {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.badge-paused {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.badge-error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.player-wrap {
  background: #000;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  aspect-ratio: 16 / 9;
  margin-bottom: 16px;
}

.player {
  width: 100% !important;
  height: 100% !important;
}

.error-banner {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
}

.debug-panel {
  background: #000;
  border: 1px solid rgba(74, 222, 128, 0.15);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}

.debug-panel summary {
  cursor: pointer;
  color: #94a3b8;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 8px;
  user-select: none;
}

.log-list {
  max-height: 240px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.log-line {
  padding: 2px 0;
  opacity: 0.9;
}

.log-time {
  color: #64748b;
  margin-right: 8px;
}

.log-info .log-msg { color: #cbd5e1; }
.log-success .log-msg { color: #4ade80; }
.log-warn .log-msg { color: #fbbf24; }
.log-error .log-msg { color: #f87171; }

.page-footer {
  text-align: center;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-meta {
  margin-top: 4px;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .logo { font-size: 24px; }
  .info-grid { grid-template-columns: 1fr 1fr; }
  .china-test-page { padding: 16px 12px; }
}
</style>
