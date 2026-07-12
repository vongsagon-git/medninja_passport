<!--
  AliPlayer.vue — Alibaba VOD adapter for UniversalWatch

  Contract:
    Props:
      - videoId    : string  (Ali VOD ID — 1 ID dual encryption)
      - encryption : 'widevine' | 'protection' (opaque badge — Ali chooses stream via device path)
      - variant    : 'widevine' | 'protection'
      - resumeSeek : number (resume time from parent watch-progress)
    Emits:
      - ready
      - play / pause / ended
      - timeupdate  { currentTime, duration, isPlaying }
      - error       { detail, paramData, raw }
      - waiting     (buffering)
      - beta-log    { time, msg, type } — for parent debug collector
      - player-ref  (player)            — expose Aliplayer instance

  Notes:
    - 1 ID dual encryption pattern (verified 2026-07-11):
        iOS/Mac Safari → PlayAuth + playConfig.EncryptType filter Ali Prop
        Others (Chrome/Edge/Android/PC) → STS + encryptType 1 (permissive Widevine)
    - Uses Aliplayer v2.35.4 bundled JS (avoids g.alicdn.com runtime fetch → GFW throttle)
    - Custom control bar is rendered by parent shell so parent can overlay watermark cleanly
      — this adapter only creates the Aliplayer container + fires state events.
-->
<template>
  <div class="ali-player-wrap">
    <div
      id="J_prismPlayer"
      ref="aliPlayerBox"
      class="ali-player-box"
    ></div>
    <!-- Loading overlay — บังจน Ali player ready -->
    <div v-if="!playerReady" class="ali-player-loading">
      <div class="skeleton" style="width:100%;height:100%;position:absolute;inset:0"></div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'
import { isIOS as detectIOS, isMacSafari as detectMacSafari } from '../../utils/deviceDetect'

export default {
  name: 'AliPlayer',
  props: {
    videoId: { type: String, required: true },
    encryption: { type: String, default: 'protection' },
    variant: { type: String, default: 'protection' },
    resumeSeek: { type: Number, default: 0 }
  },
  emits: [
    'ready',
    'canplay',
    'play',
    'pause',
    'ended',
    'timeupdate',
    'error',
    'waiting',
    'beta-log',
    'player-ref'
  ],
  data () {
    return {
      playerReady: false,
      _player: null,
      _mountedAt: 0,
      _initInFlight: false,
      _currentTime: 0,
      _duration: 0,
      _isPlaying: false,
      _resumeAttempted: false,
      _timePoll: null,
      _lastStateEmit: 0
    }
  },
  mounted () {
    this._mountedAt = Date.now()
    if (this.videoId) {
      this.$nextTick(() => this._initAliPlayer())
    }
  },
  beforeUnmount () {
    this._dispose()
  },
  watch: {
    videoId (newId, oldId) {
      if (newId === oldId) return
      this._dispose()
      if (newId) this.$nextTick(() => this._initAliPlayer())
    }
  },
  methods: {
    _log (msg, type = 'info') {
      const time = new Date().toTimeString().slice(0, 8)
      this.$emit('beta-log', { time, msg, type })
    },
    _dispose () {
      this._stopTimePolling()
      if (this._player) {
        try { this._player.dispose() } catch {}
        this._player = null
      }
      this.playerReady = false
      this._currentTime = 0
      this._duration = 0
      this._isPlaying = false
    },
    _loadAliplayerSDK () {
      if (window.Aliplayer && typeof window.Aliplayer === 'function') return Promise.resolve(true)
      return new Promise((resolve, reject) => {
        // v2.35.4 = bundle ครบในไฟล์เดียว (v2.15.4 fetch runtime dep จาก g.alicdn.com → GFW throttle)
        const cssId = '_aliplayer_css_v2354'
        if (!document.getElementById(cssId)) {
          const css = document.createElement('link')
          css.id = cssId
          css.rel = 'stylesheet'
          css.href = '/vendor/aliplayer/aliplayer-2.35.4.css'
          document.head.appendChild(css)
        }
        const s = document.createElement('script')
        s.src = '/vendor/aliplayer/aliplayer-2.35.4.js'
        s.async = false
        s.onload = () => {
          setTimeout(() => {
            resolve(typeof window.Aliplayer === 'function')
          }, 200)
        }
        s.onerror = () => reject(new Error('Failed to load Aliplayer SDK v2.35.4'))
        document.head.appendChild(s)
      })
    },
    async _fetchSts () {
      const vid = this.videoId
      if (!vid) throw new Error('No Ali videoId')
      this._log(`Fetch STS: /api/china/sts/${vid}`, 'info')
      const res = await api.get(`/china/sts/${vid}`)
      const d = (res && res.data) ? res.data : (res || {})
      if (!d.accessKeyId) throw new Error('STS response missing accessKeyId')
      this._log(`STS ok (key=${d.accessKeyId?.substring(0, 10)}...)`, 'success')
      return d
    },
    async _fetchPlayAuth () {
      const vid = this.videoId
      if (!vid) throw new Error('No Ali videoId')
      this._log(`Fetch PlayAuth: /api/china/playauth/${vid}`, 'info')
      const res = await api.get(`/china/playauth/${vid}`)
      const d = (res && res.data) ? res.data : (res || {})
      if (!d.playAuth) throw new Error('PlayAuth response missing playAuth')
      this._log(`PlayAuth ok (length=${d.playAuth.length})`, 'success')
      return d
    },
    async _initAliPlayer () {
      if (!this.videoId) {
        this._log('SKIP: no aliVideoId', 'warn')
        return
      }
      if (this._initInFlight) {
        this._log('SKIP: init in flight', 'warn')
        return
      }
      const videoId = this.videoId
      this._log(`Init player: videoId=${videoId}`, 'info')
      this._initInFlight = true

      try {
        const sdkOk = await this._loadAliplayerSDK()
        if (!sdkOk) throw new Error('Aliplayer SDK not loaded')

        // Wait for DOM container
        await this.$nextTick()
        let waitTries = 0
        while (!document.getElementById('J_prismPlayer') && waitTries < 20) {
          await new Promise(r => setTimeout(r, 100))
          waitTries++
        }
        if (!document.getElementById('J_prismPlayer')) {
          throw new Error('Container #J_prismPlayer not found in DOM')
        }

        // Cleanup previous
        if (this._player) {
          try { this._player.dispose() } catch {}
          this._player = null
        }

        // 1 ID dual encryption — path per device
        const isIosOrSafari = detectIOS() || detectMacSafari()
        this._log(`Device path: ${isIosOrSafari ? 'iOS/Safari (PlayAuth)' : 'Other (STS)'}`, 'info')

        const baseConfig = {
          id: 'J_prismPlayer',
          vid: videoId,
          width: '100%',
          height: '100%',
          autoplay: false,
          isLive: false,
          rePlay: false,
          playsinline: true,
          preload: true,
          controlBarVisibility: 'hover',
          useH5Prism: true,
          disableAirplay: true,
          disableChromecast: true,
          license: {
            domain: 'passport.medninja.academy',
            key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
          },
          skinLayout: [
            // ⭐ big play button อยู่ตรงกลางจอ (align cc = center-center)
            { name: 'bigPlayButton', align: 'cc' },
            { name: 'H5Loading', align: 'cc' },
            { name: 'errorDisplay', align: 'tlabs', x: 0, y: 0 },
            { name: 'infoDisplay' },
            { name: 'tooltip', align: 'blabs', x: 0, y: 56 },
            { name: 'thumbnail' },
            {
              name: 'controlBar', align: 'blabs', x: 0, y: 0,
              children: [
                { name: 'progress', align: 'blabs', x: 0, y: 44 },
                { name: 'playButton', align: 'tl', x: 15, y: 12 },
                { name: 'timeDisplay', align: 'tl', x: 10, y: 7 },
                { name: 'volume', align: 'tr', x: 5, y: 10 },
                { name: 'setting', align: 'tr', x: 15, y: 12 }
              ]
            }
          ]
        }

        let config
        if (isIosOrSafari) {
          const { playAuth } = await this._fetchPlayAuth()
          config = {
            ...baseConfig,
            playauth: playAuth,
            encryptType: 1,
            playConfig: { EncryptType: 'AliyunVoDEncryption' }
          }
        } else {
          const sts = await this._fetchSts()
          config = {
            ...baseConfig,
            accessKeyId: sts.accessKeyId,
            accessKeySecret: sts.accessKeySecret,
            securityToken: sts.securityToken,
            region: sts.region || 'ap-southeast-1',
            encryptType: 1
          }
        }

        this._log('Creating Aliplayer instance...', 'info')
        this._player = new window.Aliplayer(config, () => {
          this._log('Player instance created ✅', 'success')
        })
        this.$emit('player-ref', this._player)

        this._player.on('ready', () => {
          this._log('Event: ready', 'success')
          this.playerReady = true
          try { this._duration = this._player.getDuration() || 0 } catch {}

          // Anti-piracy: set video element attributes
          try {
            const container = document.getElementById('J_prismPlayer')
            const videoEl = container ? container.querySelector('video') : null
            if (videoEl) {
              videoEl.setAttribute('x-webkit-airplay', 'deny')
              videoEl.setAttribute('disableRemotePlayback', '')
              videoEl.disableRemotePlayback = true
            }
          } catch {}

          this._startTimePolling()
          this.$emit('ready', { msSinceMount: Date.now() - this._mountedAt, duration: this._duration })

          // Resume seek
          if (this.resumeSeek && this.resumeSeek > 10 && !this._resumeAttempted) {
            this._resumeAttempted = true
            const seekTo = Math.max(0, this.resumeSeek - 3)
            const doSeek = () => { try { this._player.seek(seekTo) } catch {} }
            doSeek()
            setTimeout(doSeek, 1000)
            setTimeout(doSeek, 3000)
          }
        })
        this._player.on('canplay', () => {
          try { this._duration = this._player.getDuration() || 0 } catch {}
          this.$emit('canplay')
        })
        this._player.on('play', () => {
          this._isPlaying = true
          this.$emit('play')
        })
        this._player.on('pause', () => {
          this._isPlaying = false
          this.$emit('pause')
        })
        this._player.on('ended', () => {
          this._isPlaying = false
          this.$emit('ended')
        })
        this._player.on('timeupdate', () => {
          try {
            const t = this._player.getCurrentTime() || 0
            const d = this._player.getDuration() || 0
            this._currentTime = t
            if (d > 0) this._duration = d
            // Verify isPlaying via getStatus (Safari event sometimes miss)
            try {
              if (typeof this._player.getStatus === 'function') {
                const s = this._player.getStatus()
                this._isPlaying = s === 'play' || s === 'playing'
              }
            } catch {}
            this.$emit('timeupdate', { currentTime: t, duration: this._duration, isPlaying: this._isPlaying })
          } catch {}
        })
        this._player.on('error', (e) => {
          const detail = e && e.paramData ? JSON.stringify(e.paramData) : JSON.stringify(e || {})
          this._log(`Event: error — ${detail}`, 'error')
          this.$emit('error', { detail, paramData: e?.paramData || null, raw: e })
        })
        this._player.on('waiting', () => {
          this._log('Event: waiting (buffering)', 'warn')
          this.$emit('waiting')
        })
      } catch (err) {
        this._log(`❌ INIT FAILED: ${err.message}`, 'error')
        if (err.stack) this._log(`Stack: ${err.stack.split('\n').slice(0, 3).join(' | ')}`, 'error')
        this.$emit('error', { detail: err.message, raw: err, initFailed: true })
      } finally {
        this._initInFlight = false
      }
    },
    _startTimePolling () {
      this._stopTimePolling()
      this._timePoll = setInterval(() => {
        if (!this._player) return
        try {
          const t = this._player.getCurrentTime() || 0
          const d = this._player.getDuration() || 0
          this._currentTime = t
          if (d > 0) this._duration = d
        } catch {}
      }, 500)
    },
    _stopTimePolling () {
      if (this._timePoll) { clearInterval(this._timePoll); this._timePoll = null }
    },
    // Public API
    play () { if (this._player) { try { this._player.play() } catch {} } },
    pause () { if (this._player) { try { this._player.pause() } catch {} } },
    togglePlay () {
      if (!this._player) return
      if (this._isPlaying) this.pause()
      else this.play()
    },
    seek (sec) { if (this._player) { try { this._player.seek(sec) } catch {} } },
    setSpeed (s) { if (this._player) { try { this._player.setSpeed(s) } catch {} } },
    setVolume (v) { if (this._player) { try { this._player.setVolume(v) } catch {} } },
    mute () { if (this._player) { try { this._player.mute() } catch {} } },
    unmute () { if (this._player) { try { this._player.unmute() } catch {} } },
    getStatus () {
      if (!this._player) return 'unknown'
      try { return this._player.getStatus() } catch { return 'unknown' }
    },
    getPlayer () { return this._player },
    getCurrentTime () { return this._currentTime },
    getDuration () { return this._duration }
  }
}
</script>

<style scoped>
.ali-player-wrap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ali-player-box {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ali-player-loading {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.skeleton {
  background: linear-gradient(90deg, #1f2937 0%, #374151 50%, #1f2937 100%);
  background-size: 200% 100%;
  animation: ali-skel 1.4s ease-in-out infinite;
}
@keyframes ali-skel {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
