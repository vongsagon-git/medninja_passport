<template>
  <div class="watch-page">
    <!-- Header -->
    <div class="drm-header">
      <h1>DRM Test</h1>
      <div class="browser-badge">
        {{ browser }} | {{ drmType || '...' }}
      </div>
    </div>

    <div v-if="loading" class="loading">กำลังโหลด...</div>
    <div v-else-if="error" class="loading" style="color:#f87171">{{ error }}</div>

    <!-- Player area -->
    <div v-if="!loading && !error" class="player-wrap">
      <div class="player-container" @contextmenu.prevent>
        <iframe
          v-if="video.embedUrl"
          ref="playerIframe"
          :src="video.embedUrl"
          loading="lazy"
          referrerpolicy="origin"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture 'none'"
          disableremoteplayback
          disablepictureinpicture
        ></iframe>
      </div>

      <!-- Info bar -->
      <div class="info-bar">
        <div class="info-left">
          <span class="info-badge" :class="video.mode">{{ video.mode === 'widevine' ? 'Widevine' : 'Protection' }}</span>
          <span class="info-lib">Library {{ video.library }}</span>
        </div>
        <div class="info-right">
          <span class="info-id">{{ video.videoId }}</span>
        </div>
      </div>

      <!-- Player status -->
      <div class="status-bar">
        <span>Player: <strong :style="{ color: playerReady ? '#4ade80' : '#f59e0b' }">{{ playerReady ? 'Ready' : 'Loading...' }}</strong></span>
        <span v-if="isPlaying" style="color:#4ade80">Playing</span>
        <span v-if="currentTime > 0">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>

      <!-- Explain -->
      <div class="explain">
        <template v-if="video.mode === 'widevine'">
          เครื่องนี้ใช้ <strong>Widevine DRM</strong> — Stream Recorder ต้องดาวน์โหลดไม่ได้
        </template>
        <template v-else>
          เครื่องนี้ใช้ <strong>Protection</strong> (ไม่มี DRM) — ปลอดภัยเพราะไม่มี extension
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'DrmTest',
  data() {
    return {
      browser: '',
      drmType: null,
      loading: true,
      error: '',
      video: {},
      playerReady: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    }
  },
  async mounted() {
    this._detectBrowser()
    this._detectDrm()
    await this._loadUrl()
    if (!this.error) this._loadPlayerJs()
  },
  methods: {
    _detectBrowser() {
      const ua = navigator.userAgent
      if (/Edg\//.test(ua)) this.browser = 'Edge'
      else if (/OPR\/|Opera/.test(ua)) this.browser = 'Opera'
      else if (/Brave/.test(ua)) this.browser = 'Brave'
      else if (/Chrome\//.test(ua)) this.browser = 'Chrome'
      else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) this.browser = 'Safari'
      else if (/Firefox\//.test(ua)) this.browser = 'Firefox'
      else this.browser = 'Unknown'
    },
    async _detectDrm() {
      if (!navigator.requestMediaKeySystemAccess) { this.drmType = 'No DRM'; return }
      const cfg = [{ initDataTypes: ['cenc'], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }] }]
      try { await navigator.requestMediaKeySystemAccess('com.widevine.alpha', cfg); this.drmType = 'Widevine'; return } catch {}
      try { await navigator.requestMediaKeySystemAccess('com.apple.fps.1_0', [{ initDataTypes: ['sinf'], videoCapabilities: [{ contentType: 'video/mp4' }] }]); this.drmType = 'FairPlay'; return } catch {}
      try { await navigator.requestMediaKeySystemAccess('com.microsoft.playready', cfg); this.drmType = 'PlayReady'; return } catch {}
      this.drmType = 'No DRM'
    },
    async _loadUrl() {
      try {
        const res = await api.get('/drm-test/urls')
        this.video = res
        this.loading = false
      } catch (e) {
        this.error = e.response?.status === 403 ? 'Admin เท่านั้น' : 'โหลดไม่ได้ — ลอง login ใหม่'
        this.loading = false
      }
    },
    _loadPlayerJs() {
      if (window.playerjs) { this._initPlayer(); return }
      if (document.querySelector('script[src*="playerjs"]')) {
        const wait = setInterval(() => {
          if (window.playerjs) { clearInterval(wait); this._initPlayer() }
        }, 200)
        return
      }
      const s = document.createElement('script')
      s.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js'
      s.onload = () => this._initPlayer()
      document.head.appendChild(s)
    },
    _initPlayer() {
      if (!window.playerjs) return
      const iframe = this.$refs.playerIframe
      if (!iframe) return
      const p = new window.playerjs.Player(iframe)
      p.on('ready', () => {
        this.playerReady = true
        p.on('play', () => { this.isPlaying = true })
        p.on('pause', () => { this.isPlaying = false })
        p.on('ended', () => { this.isPlaying = false })
        p.on('timeupdate', (val) => {
          this.currentTime = val.seconds || val
          if (val.duration && val.duration > 0) this.duration = val.duration
        })
      })
    },
    formatTime(s) {
      if (!s || s < 0) return '0:00'
      const m = Math.floor(s / 60)
      const sec = Math.floor(s % 60)
      return `${m}:${sec.toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.watch-page {
  min-height: 100vh; background: #1c1d1f; color: #e2e8f0;
  font-family: 'Noto Sans Thai', sans-serif;
}
.drm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: #0f1117; border-bottom: 1px solid #2d2f31;
}
.drm-header h1 { font-size: 16px; font-weight: 700; color: #fff; }
.browser-badge {
  font-size: 11px; padding: 4px 12px; background: #1e293b;
  border-radius: 6px; color: #94a3b8;
}
.loading { text-align: center; color: #a855f7; font-size: 14px; padding: 60px 20px; }

/* Player */
.player-wrap { max-width: 900px; margin: 0 auto; padding: 16px 20px 40px; }
.player-container {
  position: relative; width: 100%; padding-top: 56.25%;
  background: #000; border-radius: 8px; overflow: hidden;
  -webkit-user-select: none; user-select: none;
}
.player-container iframe {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;
}

/* Info bar */
.info-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; margin-top: 8px; border-bottom: 1px solid #2d2f31;
}
.info-left { display: flex; align-items: center; gap: 10px; }
.info-badge {
  padding: 3px 10px; border-radius: 5px; font-size: 11px;
  font-weight: 700; text-transform: uppercase;
}
.info-badge.widevine { background: #16a34a; color: #fff; }
.info-badge.protection { background: #3b82f6; color: #fff; }
.info-lib { font-size: 13px; font-weight: 600; }
.info-id { font-size: 9px; color: #475569; font-family: monospace; }

/* Status bar */
.status-bar {
  display: flex; align-items: center; gap: 16px;
  padding: 8px 0; font-size: 12px; color: #64748b;
}

/* Explain */
.explain {
  margin-top: 16px; padding: 14px 16px; background: #1e293b;
  border-radius: 10px; font-size: 13px; color: #94a3b8; line-height: 1.6;
}
.explain strong { color: #e2e8f0; }

@media (max-width: 768px) {
  .info-id { display: none; }
}
</style>
