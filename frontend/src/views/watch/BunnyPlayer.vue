<!--
  BunnyPlayer.vue — Bunny CDN iframe adapter for UniversalWatch

  Contract:
    Props:
      - embedUrl    : string  (Bunny iframe src, already includes token/DRM query)
      - videoId     : string  (for logging / re-init trigger)
      - encryption  : 'widevine' | 'protection'
      - variant     : 'global-widevine' | 'global-protection' (opaque badge, not vendor)
    Emits:
      - ready                     — player.js API ready
      - play / pause / ended
      - timeupdate  { currentTime, duration }
      - error       { raw, summary, code, name, keys, rawJson, ctx }
      - player-ref  (player)      — expose player.js instance to parent (for pause/seek from anti-share)
      - iframe-message { data }   — for parent postMessage ring buffer

  Notes:
    - Uses playerjs iframe API from //assets.mediadelivery.net/playerjs/playerjs-latest.min.js
    - Parent (UniversalWatch) owns socket, watermark, fullscreen, anti-share — this adapter is player only.
-->
<template>
  <div class="bunny-player-wrap">
    <iframe
      v-if="embedUrl"
      ref="videoIframe"
      :src="embedUrl"
      loading="lazy"
      referrerpolicy="origin"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture 'none'"
      disableremoteplayback
      disablepictureinpicture
      x-webkit-airplay="deny"
    ></iframe>
    <!-- Loading overlay — บังจน player ready (pointer-events:none ให้กด play ได้) -->
    <div v-if="!playerReady" class="bunny-player-loading">
      <div class="skeleton" style="width:100%;height:100%;position:absolute;inset:0"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BunnyPlayer',
  props: {
    embedUrl: { type: String, required: true },
    videoId: { type: String, default: '' },
    encryption: { type: String, default: 'protection' }, // 'widevine' | 'protection'
    variant: { type: String, default: 'global-protection' },
    resumeSeek: { type: Number, default: 0 } // resume time from parent (watch-progress)
  },
  emits: [
    'ready',
    'play',
    'pause',
    'ended',
    'timeupdate',
    'error',
    'player-ref',
    'iframe-message'
  ],
  data () {
    return {
      playerReady: false,
      _player: null,
      _mountedAt: 0,
      _currentTime: 0,
      _duration: 0,
      _isPlaying: false,
      _resumeAttempted: false,
      _msgRing: [],
      _playPending: false,
      _pauseAfterPlay: false,
      _playPendingTimer: null
    }
  },
  mounted () {
    this._mountedAt = Date.now()
    this._onMessage = (ev) => {
      try {
        const ifr = this.$refs.videoIframe
        if (!ifr || ev.source !== ifr.contentWindow) return
        const entry = { t: Date.now(), data: typeof ev.data === 'string' ? ev.data.slice(0, 500) : JSON.stringify(ev.data).slice(0, 500) }
        this._msgRing.push(entry)
        if (this._msgRing.length > 30) this._msgRing.shift()
        this.$emit('iframe-message', entry)
      } catch {}
    }
    window.addEventListener('message', this._onMessage)

    this.$nextTick(() => {
      const iframe = this.$refs.videoIframe
      if (iframe) {
        iframe.addEventListener('load', () => {
          setTimeout(() => this._loadPlayerJs(), 500)
        }, { once: true })
        // Fallback ถ้า load event ไม่ fire
        setTimeout(() => { if (!this.playerReady) this._loadPlayerJs() }, 3000)
      }
    })
  },
  beforeUnmount () {
    if (this._onMessage) window.removeEventListener('message', this._onMessage)
    if (this._playPendingTimer) clearTimeout(this._playPendingTimer)
    this._player = null
    this.playerReady = false
  },
  watch: {
    embedUrl (newUrl, oldUrl) {
      if (newUrl === oldUrl) return
      this._player = null
      this.playerReady = false
      this._resumeAttempted = false
      this._currentTime = 0
      this._duration = 0
      // re-init after iframe reload
      this.$nextTick(() => {
        const iframe = this.$refs.videoIframe
        if (iframe) {
          iframe.addEventListener('load', () => {
            setTimeout(() => this._loadPlayerJs(), 500)
          }, { once: true })
          setTimeout(() => { if (!this.playerReady) this._loadPlayerJs() }, 3000)
        }
      })
    }
  },
  methods: {
    _loadPlayerJs () {
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
    _initPlayer () {
      if (!window.playerjs) return
      const iframe = this.$refs.videoIframe
      if (!iframe) return
      const p = new window.playerjs.Player(iframe)
      p.on('ready', () => {
        this._player = p
        this.playerReady = true
        this._isPlaying = false
        this.$emit('player-ref', p)
        this.$emit('ready', { msSinceMount: Date.now() - this._mountedAt })

        // Resume seek — parent sends resumeSeek prop; we honor after ready
        if (this.resumeSeek && this.resumeSeek > 10) {
          const seekTo = Math.max(0, this.resumeSeek - 3)
          const doSeek = () => {
            try { p.setCurrentTime(seekTo) } catch {}
          }
          doSeek()
          setTimeout(doSeek, 1000)
          setTimeout(doSeek, 3000)
        }

        p.on('play', () => {
          this._isPlaying = true
          this.$emit('play')
        })
        p.on('pause', () => {
          this._isPlaying = false
          this.$emit('pause')
        })
        p.on('ended', () => {
          this._isPlaying = false
          this.$emit('ended')
        })
        p.on('timeupdate', (val) => {
          const t = val.seconds || val
          if (this._currentTime && Math.abs(t - this._currentTime) > 0.5 && !this._isPlaying) {
            this._isPlaying = true
          }
          this._currentTime = t
          if (val.duration && val.duration > 0) this._duration = val.duration
          this.$emit('timeupdate', { currentTime: t, duration: this._duration, isPlaying: this._isPlaying })
        })
        p.on('error', (e) => {
          const raw = this._captureRawError(e)
          this.$emit('error', raw)
        })

        // ดึง duration — retry หลายรอบเพราะ HLS อาจยังไม่มี metadata
        const tryDuration = () => {
          try { p.getDuration((d) => { if (d > 0) this._duration = d }) } catch {}
        }
        tryDuration()
        setTimeout(tryDuration, 2000)
        setTimeout(tryDuration, 5000)
        setTimeout(tryDuration, 10000)
      })
    },
    _captureRawError (e) {
      let summary = 'unknown error'
      let type = typeof e
      let keys = []
      let rawJson = ''
      let code = null, name = null, stack = ''
      try {
        if (e == null) {
          summary = `null error event (type=${type})`
        } else if (typeof e === 'string') {
          summary = e
        } else if (typeof e === 'object') {
          keys = Object.keys(e)
          code = e.code ?? e.errorCode ?? null
          name = e.name ?? e.type ?? null
          stack = e.stack || ''
          try { rawJson = JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 800) } catch { rawJson = String(e).slice(0, 800) }
          summary = e.message || e.error || (code != null ? `code=${code}` : '') || (keys.length ? `obj{${keys.join(',')}}` : 'empty error object')
        } else {
          summary = String(e)
        }
      } catch (capErr) {
        summary = `capture failed: ${capErr.message}`
      }
      return {
        summary,
        type,
        keys,
        code,
        name,
        stack: stack.slice(0, 500),
        rawJson,
        msgRing: (this._msgRing || []).slice(-10),
        ctxExtra: {
          visibility: typeof document !== 'undefined' ? document.visibilityState : '?',
          msSinceMount: Date.now() - this._mountedAt,
          currentTime: this._currentTime || 0,
          duration: this._duration || 0,
          netType: navigator.connection?.effectiveType || '?',
          downlink: navigator.connection?.downlink || 0,
          rtt: navigator.connection?.rtt || 0,
          online: navigator.onLine,
          memory: navigator.deviceMemory || '?'
        }
      }
    },
    // Public API (parent calls via $refs)
    play () {
      const p = this._player
      if (!p || this._playPending) return
      this._playPending = true
      this._pauseAfterPlay = false
      if (this._playPendingTimer) clearTimeout(this._playPendingTimer)
      this._playPendingTimer = setTimeout(() => { this._playPending = false; this._pauseAfterPlay = false }, 5000)
      try {
        const r = p.play()
        if (r && typeof r.then === 'function') {
          r.then(() => {
            this._playPending = false
            clearTimeout(this._playPendingTimer)
            if (this._pauseAfterPlay) { this._pauseAfterPlay = false; try { p.pause() } catch {} }
          }).catch(() => {
            this._playPending = false
            this._pauseAfterPlay = false
            clearTimeout(this._playPendingTimer)
          })
        } else {
          this._playPending = false
          clearTimeout(this._playPendingTimer)
        }
      } catch { this._playPending = false; clearTimeout(this._playPendingTimer) }
    },
    pause () {
      const p = this._player
      if (!p) return
      if (this._playPending) { this._pauseAfterPlay = true; return }
      try { p.pause() } catch {}
    },
    togglePlay () {
      if (this._isPlaying) this.pause()
      else this.play()
    },
    seek (sec) {
      if (this._player) { try { this._player.setCurrentTime(sec) } catch {} }
    },
    getIframe () {
      return this.$refs.videoIframe
    },
    getPlayer () {
      return this._player
    }
  }
}
</script>

<style scoped>
.bunny-player-wrap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.bunny-player-wrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.bunny-player-loading {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.skeleton {
  background: linear-gradient(90deg, #1f2937 0%, #374151 50%, #1f2937 100%);
  background-size: 200% 100%;
  animation: bunny-skel 1.4s ease-in-out infinite;
}
@keyframes bunny-skel {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
