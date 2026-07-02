<template>
  <div class="sc-page">
    <div class="sc-card">
      <h1>Screen Check</h1>
      <p class="sc-sub">ข้อมูลจอแสดงผลของคุณ</p>

      <div class="sc-grid">
        <div class="sc-item">
          <div class="sc-label">Screen Size</div>
          <div class="sc-value">{{ info.screenW }} × {{ info.screenH }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Available</div>
          <div class="sc-value">{{ info.availW }} × {{ info.availH }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Window Outer</div>
          <div class="sc-value">{{ info.outerW }} × {{ info.outerH }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Window Inner</div>
          <div class="sc-value">{{ info.innerW }} × {{ info.innerH }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Device Pixel Ratio</div>
          <div class="sc-value">{{ info.dpr }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Outer / Inner (zoom check)</div>
          <div class="sc-value" :class="zoomClass">{{ info.zoomRatio }} {{ zoomLabel }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Color Depth</div>
          <div class="sc-value">{{ info.colorDepth }} bit</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Orientation</div>
          <div class="sc-value">{{ info.orientation }}</div>
        </div>
        <div class="sc-item full">
          <div class="sc-label">User Agent</div>
          <div class="sc-value small">{{ info.ua }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">OS</div>
          <div class="sc-value">{{ info.os }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Browser</div>
          <div class="sc-value">{{ info.browser }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Touch</div>
          <div class="sc-value">{{ info.touch }}</div>
        </div>
        <div class="sc-item">
          <div class="sc-label">Connection</div>
          <div class="sc-value">{{ info.connection }}</div>
        </div>
      </div>

      <button class="sc-btn" @click="refresh">รีเฟรช</button>
      <button class="sc-btn outline" @click="copy">📋 Copy ทั้งหมด</button>
      <div v-if="copied" class="sc-copied">Copy แล้ว!</div>
    </div>
  </div>
</template>

<script>
import { getOS as detectOS, getBrowser as detectBrowser } from '../utils/deviceDetect'

export default {
  name: 'ScreenCheck',
  data() {
    return { info: {}, copied: false }
  },
  computed: {
    zoomClass() {
      const r = parseFloat(this.info.zoomRatio)
      if (isNaN(r)) return ''
      if (r < 0.93 || r > 1.07) return 'bad'
      return 'good'
    },
    zoomLabel() {
      const r = parseFloat(this.info.zoomRatio)
      if (isNaN(r)) return ''
      if (r < 0.93) return '(zoom out!)'
      if (r > 1.07) return '(zoom in!)'
      return '(OK)'
    }
  },
  mounted() { this.refresh() },
  methods: {
    refresh() {
      const ua = navigator.userAgent
      const dpr = window.devicePixelRatio || 1
      const zoomRatio = window.outerWidth > 0 && window.innerWidth > 0
        ? (window.outerWidth / window.innerWidth).toFixed(4)
        : '?'
      const cn = navigator.connection
      this.info = {
        screenW: screen.width,
        screenH: screen.height,
        availW: screen.availWidth,
        availH: screen.availHeight,
        outerW: window.outerWidth,
        outerH: window.outerHeight,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        dpr: dpr.toFixed(4),
        zoomRatio,
        colorDepth: screen.colorDepth,
        orientation: screen.orientation?.type || '?',
        ua,
        os: detectOS(ua),
        browser: detectBrowser(ua),
        touch: navigator.maxTouchPoints > 0 ? `Yes (${navigator.maxTouchPoints})` : 'No',
        connection: cn ? `${cn.effectiveType || '?'} · ${cn.downlink || '?'} Mbps` : '?',
      }
    },
    copy() {
      let text = '=== Screen Check ===\n'
      for (const [k, v] of Object.entries(this.info)) {
        text += `${k}: ${v}\n`
      }
      navigator.clipboard.writeText(text).then(() => { this.copied = true; setTimeout(() => { this.copied = false }, 2000) }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.sc-page { min-height: 100vh; background: #1c1d1f; color: #fff; font-family: 'Noto Sans Thai', -apple-system, monospace; display: flex; align-items: center; justify-content: center; padding: 20px; }
.sc-card { width: 100%; max-width: 500px; }
h1 { font-size: 22px; font-weight: 900; color: #a855f7; margin: 0 0 4px; }
.sc-sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
.sc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.sc-item { background: #13131f; border: 1px solid #2d2f31; border-radius: 8px; padding: 10px 12px; }
.sc-item.full { grid-column: 1 / -1; }
.sc-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.sc-value { font-size: 14px; font-weight: 700; font-family: monospace; }
.sc-value.small { font-size: 10px; word-break: break-all; font-weight: 400; }
.sc-value.good { color: #10b981; }
.sc-value.bad { color: #ef4444; }
.sc-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #3b82f6); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 8px; }
.sc-btn.outline { background: transparent; border: 2px solid #2d2f31; color: #94a3b8; }
.sc-btn:active { transform: scale(.98); }
.sc-copied { text-align: center; color: #10b981; font-size: 13px; font-weight: 700; margin-top: 8px; }
</style>
