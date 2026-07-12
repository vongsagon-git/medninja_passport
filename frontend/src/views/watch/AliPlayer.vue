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
    <!-- ⭐ ปุ่ม play ใหญ่ กลางจอ — โผล่ตอนที่ (ยังไม่ ready) หรือ (ready แต่ยังไม่เล่น/pause อยู่) -->
    <button
      v-if="!playerReady || !_isPlaying"
      class="ali-big-play"
      :class="{ 'is-loading': !playerReady }"
      :title="playerReady ? 'เล่น' : 'กำลังโหลด...'"
      @click="_bigPlayClick"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="46" height="46"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
    </button>
    <!-- ⭐ ปุ่ม pause เล็ก มุมซ้ายล่าง — โผล่ตอนกำลังเล่น (ไม่บัง canvas) -->
    <button
      v-if="playerReady && _isPlaying"
      class="ali-custom-play"
      title="หยุด"
      @click="_togglePlay"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd"/></svg>
    </button>
    <!-- Loading overlay: thin top line only — ไม่บัง video canvas -->
    <div v-if="!playerReady" class="ali-player-loading" style="pointer-events:none">
      <div class="skeleton-thin"></div>
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
    _togglePlay () {
      if (!this._player) return
      try {
        if (this._isPlaying) this._player.pause()
        else this._player.play()
      } catch (e) { /* silent */ }
    },
    _bigPlayClick () {
      // ⭐ ปุ่มใหญ่กลางจอ — โผล่ตอน (loading) หรือ (ready + paused)
      //   ทั้ง 2 กรณีคลิกแล้ว player.play() (iOS ต้องการ user gesture)
      if (!this._player) return
      try { this._player.play() } catch (e) { /* silent */ }
    },
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
          // ⭐ ไม่กำหนด skinLayout → ใช้ default ของ Aliplayer
          //    (bigPlayButton กลางจอ, controlBar เต็ม, native ครบ)
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
/* ⭐ Big play button — สีส้มใหญ่ กลางจอ (โผล่ตอน loading + pause)
   z-index สูงสุดในกล่อง player + pointer-events explicit auto */
.ali-big-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;              /* ทับ Aliplayer canvas + control bar เสมอ */
  pointer-events: auto;      /* กัน CSS parent ตั้ง pointer-events:none */
  width: 96px;
  height: 96px;
  padding: 0;
  padding-left: 6px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 4px solid #fff;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 40px rgba(245, 158, 11, 0.65), 0 0 0 10px rgba(245, 158, 11, 0.15);
  transition: transform 0.15s, box-shadow 0.2s;
}
.ali-big-play:hover  { transform: translate(-50%, -50%) scale(1.08); box-shadow: 0 12px 46px rgba(245, 158, 11, 0.8); }
.ali-big-play:active { transform: translate(-50%, -50%) scale(0.94); }
/* ตอน loading เพิ่ม pulse animation */
.ali-big-play.is-loading { animation: ali-big-play-pulse 1.8s ease-in-out infinite; }
@keyframes ali-big-play-pulse {
  0%, 100% { box-shadow: 0 10px 40px rgba(245, 158, 11, 0.6), 0 0 0 10px rgba(245, 158, 11, 0.15); }
  50%      { box-shadow: 0 10px 40px rgba(245, 158, 11, 0.9), 0 0 0 20px rgba(245, 158, 11, 0.05); }
}
/* ⭐ Custom play/pause button — มุมซ้ายล่าง */
.ali-custom-play {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 5;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transition: opacity 0.2s, background 0.2s, transform 0.15s;
  backdrop-filter: blur(4px);
}
.ali-custom-play:hover { opacity: 1; background: rgba(0, 0, 0, 0.8); }
.ali-custom-play:active { transform: scale(0.95); }
/* Thin loading line at top — ไม่บัง video */
.skeleton-thin {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%);
  background-size: 200% 100%;
  animation: ali-skel 1.4s ease-in-out infinite;
}
@keyframes ali-skel {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
