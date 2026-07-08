<template>
  <div v-if="show" class="ali-test-overlay" @click.self="close">
    <div class="ali-test-modal">
      <div class="ali-test-header">
        <h3>🎬 ตรวจสอบระบบ Aliplayer</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="ali-test-body">
        <!-- Header info -->
        <div class="info-box">
          <div class="info-row">
            <span class="k">Video ID:</span>
            <span class="v" style="font-family:monospace;font-size:11px">{{ videoId || '(no id)' }}</span>
          </div>
          <div class="info-row">
            <span class="k">Bucket:</span>
            <span class="v">{{ variant === 'drm' ? '🔒 DRM (Widevine)' : '📺 NoDRM' }}</span>
          </div>
        </div>

        <!-- Flow list -->
        <div class="flow-list">
          <FlowRow v-for="f in flows" :key="f.id" :flow="f" />
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn-primary" @click="runAll" :disabled="running">
            {{ running ? '⏳ กำลังตรวจ...' : '▶ ตรวจทั้งหมด' }}
          </button>
          <button class="btn-secondary" @click="reset" :disabled="running">
            🔄 รีเซ็ต
          </button>
        </div>

        <!-- Summary -->
        <div v-if="summary" class="summary" :class="summary.ok ? 'ok' : 'fail'">
          {{ summary.ok ? '✅' : '⚠️' }} {{ summary.text }}
        </div>

        <!-- Log -->
        <details v-if="logs.length" class="log-details">
          <summary>📋 Log ({{ logs.length }})</summary>
          <div class="log-box">
            <div v-for="(l, i) in logs" :key="i" :class="'log-' + l.level">{{ l.text }}</div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script>
const FlowRow = {
  props: ['flow'],
  template: `
    <div class="flow-row" :class="'flow-' + flow.status">
      <div class="flow-icon">
        <span v-if="flow.status === 'pending'">⚪</span>
        <span v-else-if="flow.status === 'running'">⏳</span>
        <span v-else-if="flow.status === 'pass'">✅</span>
        <span v-else>❌</span>
      </div>
      <div class="flow-body">
        <div class="flow-title">{{ flow.title }}</div>
        <div v-if="flow.detail" class="flow-detail" v-html="flow.detail"></div>
      </div>
    </div>
  `
}

export default {
  name: 'AliTestModal',
  components: { FlowRow },
  props: {
    show: { type: Boolean, default: false },
    videoId: { type: String, default: '' },
    variant: { type: String, default: '' } // 'drm' | 'noDrm'
  },
  emits: ['close'],
  data () {
    return {
      running: false,
      cachedSts: null,
      summary: null,
      logs: [],
      flows: [
        { id: 'sts', title: 'Flow 1: STS Token', status: 'pending', detail: '' },
        { id: 'manifest', title: 'Flow 2: HLS Manifest', status: 'pending', detail: '' },
        { id: 'sdk', title: 'Flow 3: Aliplayer SDK', status: 'pending', detail: '' },
        { id: 'player', title: 'Flow 4: Player + Playback', status: 'pending', detail: '' }
      ]
    }
  },
  methods: {
    close () { this.$emit('close') },
    reset () {
      this.flows.forEach(f => { f.status = 'pending'; f.detail = '' })
      this.summary = null
      this.logs = []
      this.cachedSts = null
    },
    log (text, level = 'info') { this.logs.push({ text, level }) },
    setFlow (id, status, detail = '') {
      const f = this.flows.find(x => x.id === id)
      if (f) { f.status = status; f.detail = detail }
    },
    kv (k, v, ok) { return `<div class="kv"><b>${k}:</b> <span class="${ok ? 'ok' : 'err'}">${v}</span></div>` },

    async runAll () {
      if (!this.videoId) {
        this.summary = { ok: false, text: 'ไม่มี Video ID' }
        return
      }
      this.reset()
      this.running = true
      const sessionId = 'ali_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      try {
        const stsOk = await this.testSts()
        const manifestOk = await this.testManifest()
        const sdkOk = await this.testSdk()
        const playerOk = stsOk && sdkOk && await this.testPlayer()
        const passed = [stsOk, manifestOk, sdkOk, playerOk].filter(Boolean).length
        this.summary = {
          ok: passed === 4,
          text: `${passed}/4 flows ผ่าน${passed === 4 ? ' — ระบบพร้อมเล่นวิดีโอ' : ' — ยังมีปัญหา'}`
        }
        // ⭐ เขียน log หลังบ้าน (admin ดูย้อนหลังได้)
        this.postResult(sessionId, {
          sts: stsOk, manifest: manifestOk, sdk: sdkOk, player: playerOk, passed
        })
      } finally {
        this.running = false
      }
    },

    postResult (sessionId, result) {
      try {
        const ua = navigator.userAgent || ''
        const dev = {
          devType: /Mobile|Android|iP(ad|hone)/.test(ua) ? 'mobile' : 'desktop',
          os: /Windows/.test(ua) ? 'Windows'
              : /Mac OS X/.test(ua) ? 'macOS'
              : /Android/.test(ua) ? 'Android'
              : /iP(ad|hone)/.test(ua) ? 'iOS'
              : 'Other',
          browser: /Edg\//.test(ua) ? 'Edge'
                  : /Chrome\//.test(ua) ? 'Chrome'
                  : /Safari\//.test(ua) ? 'Safari'
                  : /Firefox/.test(ua) ? 'Firefox'
                  : 'Unknown'
        }
        const stepStatus = {
          sts: result.sts ? 'pass' : 'fail',
          manifest: result.manifest ? 'pass' : 'fail',
          sdk: result.sdk ? 'pass' : 'fail',
          player: result.player ? 'pass' : 'fail'
        }
        fetch('/api/china/log/test-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionId,
            buildVer: window.__BUILD_VERSION || 'passport',
            status: result.passed === 4 ? 'pass' : (result.passed > 0 ? 'partial' : 'fail'),
            device: dev,
            stepStatus,
            details: {
              videoId: this.videoId,
              variant: this.variant,
              source: 'AliTestModal (WatchCnPage)',
              logs: this.logs.slice(-30) // เก็บ 30 log ล่าสุด
            }
          })
        }).catch(() => { /* silent */ })
      } catch (_) { /* silent */ }
    },

    async testSts () {
      this.setFlow('sts', 'running', 'เรียก /api/china/sts/:videoId...')
      this.log('🔑 Flow 1: STS Token')
      const t0 = Date.now()
      try {
        const res = await fetch('/api/china/sts/' + this.videoId, { credentials: 'include' })
        const ms = Date.now() - t0
        const data = await res.json()
        const hasAK = !!data.accessKeyId
        const hasSK = !!data.accessKeySecret
        const hasST = !!data.securityToken
        const detail =
          this.kv('HTTP', `${res.status} (${ms}ms)`, res.ok) +
          this.kv('accessKeyId', hasAK ? (data.accessKeyId.slice(0, 8) + '...') : 'MISSING', hasAK) +
          this.kv('accessKeySecret', hasSK ? 'มี (' + data.accessKeySecret.length + ' ตัว)' : 'MISSING', hasSK) +
          this.kv('securityToken', hasST ? 'มี (' + data.securityToken.length + ' ตัว)' : 'MISSING', hasST) +
          this.kv('region', data.region || '-', true)
        if (hasAK && hasSK && hasST) {
          this.setFlow('sts', 'pass', detail)
          this.log('✅ STS สำเร็จ (' + ms + 'ms)', 'success')
          this.cachedSts = data
          return true
        }
        this.setFlow('sts', 'fail', detail)
        this.log('❌ STS ไม่ครบ', 'err')
        return false
      } catch (e) {
        this.setFlow('sts', 'fail', 'Exception: ' + e.message)
        this.log('❌ STS: ' + e.message, 'err')
        return false
      }
    },

    async testManifest () {
      this.setFlow('manifest', 'running', 'เรียก /api/china/playinfo/:videoId...')
      this.log('📄 Flow 2: HLS Manifest')
      const t0 = Date.now()
      try {
        const res = await fetch('/api/china/playinfo/' + this.videoId, { credentials: 'include' })
        const ms = Date.now() - t0
        const data = await res.json()
        const streams = data.streams || []
        const m3u8 = streams.find(s => s.format === 'm3u8' && s.encrypt) || streams[0]
        const detail =
          this.kv('HTTP', `${res.status} (${ms}ms)`, res.ok) +
          this.kv('Title', (data.videoBase && data.videoBase.Title) || '-', true) +
          this.kv('Duration', ((data.videoBase && data.videoBase.Duration) || '-') + 's', true) +
          this.kv('Streams', streams.length, streams.length > 0) +
          (m3u8 ? this.kv('Encryption', m3u8.encryptType || 'plain', !!m3u8.encrypt) : '') +
          (m3u8 ? this.kv('Resolution', (m3u8.width || '?') + '×' + (m3u8.height || '?'), true) : '')
        if (streams.length > 0) {
          this.setFlow('manifest', 'pass', detail)
          this.log('✅ Manifest OK', 'success')
          return true
        }
        this.setFlow('manifest', 'fail', detail)
        this.log('❌ Manifest ไม่มี stream', 'err')
        return false
      } catch (e) {
        this.setFlow('manifest', 'fail', 'Exception: ' + e.message)
        this.log('❌ Manifest: ' + e.message, 'err')
        return false
      }
    },

    async testSdk () {
      this.setFlow('sdk', 'running', 'ตรวจ SDK loading...')
      this.log('📦 Flow 3: Aliplayer SDK')
      const start = Date.now()
      return new Promise(resolve => {
        const tick = () => {
          const elapsed = Math.round((Date.now() - start) / 1000)
          const hasSdk = typeof window.Aliplayer === 'function'
          if (hasSdk) {
            const detail =
              this.kv('SDK', 'พร้อม (window.Aliplayer)', true) +
              this.kv('Load time', elapsed + 's', true) +
              this.kv('Version', '2.35.4 (self-host)', true)
            this.setFlow('sdk', 'pass', detail)
            this.log('✅ SDK พร้อม', 'success')
            resolve(true)
            return
          }
          if (elapsed >= 15) {
            const detail =
              this.kv('SDK', 'ไม่โหลด (timeout 15s)', false) +
              this.kv('window.Aliplayer', typeof window.Aliplayer, false)
            this.setFlow('sdk', 'fail', detail)
            this.log('❌ SDK timeout', 'err')
            resolve(false)
            return
          }
          setTimeout(tick, 500)
        }
        tick()
      })
    },

    async testPlayer () {
      this.setFlow('player', 'running', 'สร้าง test player (hidden)...')
      this.log('▶ Flow 4: Player + Playback')
      if (!this.cachedSts) {
        this.setFlow('player', 'fail', 'ไม่มี STS token (Flow 1 fail)')
        return false
      }
      // สร้าง hidden div เอา Aliplayer มาลอง init
      const testDivId = 'ali_test_' + Date.now()
      const div = document.createElement('div')
      div.id = testDivId
      div.style.cssText = 'position:fixed;left:-9999px;top:0;width:320px;height:180px;pointer-events:none;opacity:0'
      document.body.appendChild(div)
      return new Promise(resolve => {
        let done = false
        const finish = (ok, detail) => {
          if (done) return
          done = true
          this.setFlow('player', ok ? 'pass' : 'fail', detail)
          this.log(ok ? '✅ Player OK' : '❌ Player fail', ok ? 'success' : 'err')
          try { if (testPlayer && testPlayer.dispose) testPlayer.dispose() } catch (_) {}
          setTimeout(() => { try { div.remove() } catch (_) {} }, 500)
          resolve(ok)
        }
        let testPlayer = null
        try {
          testPlayer = new window.Aliplayer({
            id: testDivId,
            vid: this.videoId,
            accessKeyId: this.cachedSts.accessKeyId,
            accessKeySecret: this.cachedSts.accessKeySecret,
            securityToken: this.cachedSts.securityToken,
            region: this.cachedSts.region || 'ap-southeast-1',
            width: '320px',
            height: '180px',
            autoplay: false,
            useH5Prism: true,
            playsinline: true,
            license: {
              domain: 'passport.medninja.academy',
              key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
            },
            encryptType: 1
          }, () => {})
          testPlayer.on('ready', () => {
            const detail =
              this.kv('event', 'ready ✓', true) +
              this.kv('encryptType', '1 (universal)', true) +
              this.kv('domain', 'passport.medninja.academy', true)
            finish(true, detail)
          })
          testPlayer.on('error', (e) => {
            const msg = e && (e.detail || e.message) || 'unknown error'
            const detail =
              this.kv('event', 'error ✗', false) +
              this.kv('detail', String(msg), false)
            finish(false, detail)
          })
          setTimeout(() => finish(false, this.kv('event', 'timeout 20s (ไม่มี event)', false)), 20000)
        } catch (e) {
          finish(false, this.kv('exception', e.message, false))
        }
      })
    }
  }
}
</script>

<style scoped>
.ali-test-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: grid; place-items: center; padding: 16px;
}
.ali-test-modal {
  background: #1e293b; color: #e2e8f0;
  border-radius: 12px; border: 1px solid #334155;
  width: 100%; max-width: 640px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.ali-test-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #334155;
}
.ali-test-header h3 {
  margin: 0; font-size: 16px; font-weight: 700; color: #fff;
}
.close-btn {
  background: transparent; color: #94a3b8; border: none;
  font-size: 26px; line-height: 1; cursor: pointer; padding: 0 6px;
}
.close-btn:hover { color: #fff; }
.ali-test-body {
  padding: 16px 20px; overflow-y: auto;
}
.info-box {
  background: #0f172a; border: 1px solid #334155;
  border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
}
.info-row {
  display: flex; gap: 10px; font-size: 12.5px; padding: 3px 0;
}
.info-row .k { color: #94a3b8; min-width: 90px; }
.info-row .v { color: #f1f5f9; }

.flow-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
</style>

<style>
/* global (not scoped) — need to style FlowRow injected html */
.flow-row {
  display: flex; gap: 12px; padding: 10px 12px;
  background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;
  transition: border-color .15s;
}
.flow-row.flow-pass { border-color: #10b981; }
.flow-row.flow-fail { border-color: #ef4444; }
.flow-row.flow-running { border-color: #3b82f6; }
.flow-icon { font-size: 18px; flex-shrink: 0; }
.flow-body { flex: 1; min-width: 0; }
.flow-title { font-weight: 700; font-size: 13.5px; color: #f1f5f9; margin-bottom: 4px; }
.flow-detail { font-size: 12px; color: #94a3b8; }
.flow-detail .kv { padding: 2px 0; }
.flow-detail .kv b { color: #cbd5e1; margin-right: 6px; }
.flow-detail .kv .ok { color: #10b981; }
.flow-detail .kv .err { color: #f87171; }
</style>

<style scoped>
.actions { display: flex; gap: 8px; }
.btn-primary, .btn-secondary {
  flex: 1; padding: 9px 12px; border-radius: 8px;
  font-family: inherit; font-weight: 700; font-size: 13px;
  cursor: pointer; border: none;
  transition: transform .1s, filter .1s;
}
.btn-primary { background: #3b82f6; color: #fff; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: wait; }
.btn-secondary { background: #334155; color: #e2e8f0; }
.btn-secondary:hover:not(:disabled) { background: #475569; }

.summary {
  margin-top: 12px; padding: 10px 14px; border-radius: 8px;
  font-size: 13.5px; font-weight: 700;
}
.summary.ok { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
.summary.fail { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; }

.log-details { margin-top: 12px; font-size: 11.5px; }
.log-details summary { cursor: pointer; color: #94a3b8; padding: 4px 0; }
.log-box {
  background: #020617; border-radius: 6px; padding: 8px 10px;
  max-height: 180px; overflow-y: auto;
  font-family: 'SF Mono', ui-monospace, Consolas, monospace;
}
.log-box > div { padding: 1px 0; }
.log-success { color: #10b981; }
.log-err { color: #f87171; }
.log-warn { color: #fbbf24; }
.log-info { color: #94a3b8; }

@media (max-width: 640px) {
  .ali-test-modal { max-height: 92vh; }
  .ali-test-header { padding: 12px 14px; }
  .ali-test-body { padding: 12px 14px; }
}
</style>
