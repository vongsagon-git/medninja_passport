<template>
  <div class="device-page">
    <div class="device-card">
      <h1>Device Fingerprint Test</h1>
      <p class="subtitle">เทียบ 3 แบบ — ดูว่าแบบไหนข้าม browser ได้</p>

      <div v-if="loading" class="loading">กำลังคำนวณ...</div>

      <template v-else>
        <!-- Hash เปรียบเทียบ -->
        <div class="hash-section">
          <div class="hash-box">
            <div class="hash-label">1. FingerprintJS (library)</div>
            <div class="hash-value lib">{{ fingerprint }}</div>
            <div class="hash-note">ต่าง browser = ต่าง hash</div>
          </div>
          <div class="hash-box">
            <div class="hash-label">2. Hardware Hash (DIY เดิม)</div>
            <div class="hash-value hw">{{ hardwareHash }}</div>
            <div class="hash-note">Screen+GPU+Cores+TZ+Lang+Platform</div>
          </div>
          <div class="hash-box">
            <div class="hash-label">3. Hardware-Only Hash (แก้ไม่ได้)</div>
            <div class="hash-value hw-only">{{ hardwareOnlyHash }}</div>
            <div class="hash-note">GPU+Cores+Memory+Arch+Touch+Math — ผู้ใช้เปลี่ยนไม่ได้</div>
          </div>
        </div>

        <!-- Hardware-Only Signals (แก้ไม่ได้) -->
        <h2>Hardware-Only Signals (แก้ไม่ได้)</h2>
        <table class="info-table">
          <tr>
            <td class="label">GPU</td>
            <td class="value">{{ gpu }}</td>
          </tr>
          <tr>
            <td class="label">Cores</td>
            <td class="value">{{ cores }}</td>
          </tr>
          <tr>
            <td class="label">Memory</td>
            <td class="value">{{ deviceMemory }}</td>
          </tr>
          <tr>
            <td class="label">Architecture</td>
            <td class="value">{{ architecture }}</td>
          </tr>
          <tr>
            <td class="label">Touch</td>
            <td class="value">{{ touchSupport }}</td>
          </tr>
          <tr>
            <td class="label">Math</td>
            <td class="value mono-sm">{{ mathFingerprint }}</td>
          </tr>
        </table>

        <!-- Soft Signals (แก้ได้) -->
        <h2>Soft Signals (แก้ได้)</h2>
        <table class="info-table">
          <tr>
            <td class="label">Screen</td>
            <td class="value">{{ screenInfo }}</td>
          </tr>
          <tr>
            <td class="label">Timezone</td>
            <td class="value">{{ timezone }}</td>
          </tr>
          <tr>
            <td class="label">Language</td>
            <td class="value">{{ language }}</td>
          </tr>
          <tr>
            <td class="label">Platform</td>
            <td class="value">{{ platform }}</td>
          </tr>
        </table>

        <!-- Browser Info -->
        <h2>Browser Info (ไม่ใช้คำนวณ)</h2>
        <table class="info-table">
          <tr>
            <td class="label">OS</td>
            <td class="value">{{ os }}</td>
          </tr>
          <tr>
            <td class="label">Browser</td>
            <td class="value">{{ browser }}</td>
          </tr>
          <tr>
            <td class="label">User-Agent</td>
            <td class="value ua">{{ userAgent }}</td>
          </tr>
        </table>
      </template>

      <button @click="recalculate" class="btn-recalc" :disabled="loading">
        คำนวณใหม่
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DevicePage',
  data() {
    return {
      loading: true,
      fingerprint: '',
      hardwareHash: '',
      hardwareOnlyHash: '',
      os: '',
      browser: '',
      userAgent: '',
      screenInfo: '',
      gpu: '',
      timezone: '',
      language: '',
      cores: '',
      platform: '',
      deviceMemory: '',
      architecture: '',
      touchSupport: '',
      mathFingerprint: ''
    }
  },
  mounted() {
    this.calculate()
  },
  methods: {
    async calculate() {
      this.loading = true

      this.fingerprint = '(removed)'

      // Soft signals
      this.userAgent = navigator.userAgent
      this.os = this.detectOS()
      this.browser = this.detectBrowser()
      this.screenInfo = `${screen.width}x${screen.height}`
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      this.language = navigator.language
      this.cores = navigator.hardwareConcurrency || 'N/A'
      this.platform = navigator.platform || 'N/A'

      // GPU
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
          const ext = gl.getExtension('WEBGL_debug_renderer_info')
          this.gpu = ext
            ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER)
        } else {
          this.gpu = 'N/A'
        }
      } catch {
        this.gpu = 'N/A'
      }

      // deviceMemory (GB)
      this.deviceMemory = navigator.deviceMemory
        ? navigator.deviceMemory + ' GB'
        : 'N/A (browser ไม่รองรับ)'

      // Architecture
      try {
        const uaData = navigator.userAgentData
        if (uaData && uaData.getHighEntropyValues) {
          const high = await uaData.getHighEntropyValues(['architecture', 'bitness'])
          this.architecture = `${high.architecture || 'N/A'} ${high.bitness || ''}bit`
        } else {
          this.architecture = 'N/A (browser ไม่รองรับ)'
        }
      } catch {
        this.architecture = 'N/A'
      }

      // Touch support
      this.touchSupport = `maxTouchPoints: ${navigator.maxTouchPoints}`

      // Math fingerprint
      const mathValues = [
        Math.acos(0.123456789),
        Math.acosh(1e308),
        Math.atan(2),
        Math.atanh(0.5),
        Math.cbrt(100.123),
        Math.expm1(1),
        Math.log1p(0.5),
        Math.sin(1),
        Math.sinh(1),
        Math.tan(-1)
      ]
      this.mathFingerprint = mathValues.map(v => v.toString()).join(' | ')

      // Hardware Hash เดิม (Screen+GPU+Cores+TZ+Lang+Platform)
      const rawOld = [
        this.screenInfo, this.gpu, this.cores,
        this.timezone, this.language, this.platform
      ].join('|')
      this.hardwareHash = await this.sha256(rawOld)

      // Hardware-Only Hash (แก้ไม่ได้)
      const rawHW = [
        this.gpu,
        this.cores,
        navigator.deviceMemory || '',
        this.architecture,
        navigator.maxTouchPoints,
        mathValues.join(',')
      ].join('|')
      this.hardwareOnlyHash = await this.sha256(rawHW)

      this.loading = false
    },
    async sha256(text) {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    },
    recalculate() {
      this.calculate()
    },
    detectOS() {
      const ua = navigator.userAgent
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
      if (/Mac/.test(ua)) return 'macOS'
      if (/Android/.test(ua)) return 'Android'
      if (/Windows/.test(ua)) return 'Windows'
      if (/Linux/.test(ua)) return 'Linux'
      return 'Unknown'
    },
    detectBrowser() {
      const ua = navigator.userAgent
      if (/Edg\//.test(ua)) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '')
      if (/Chrome\//.test(ua) && !/Edg/.test(ua)) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] || '')
      if (/Firefox\//.test(ua)) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] || '')
      if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '')
      return 'Unknown'
    }
  }
}
</script>

<style scoped>
.device-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 20px;
}
.device-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  color: #e2e8f0;
}
h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
  color: #fff;
}
h2 {
  margin: 24px 0 8px;
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 500;
}
.subtitle {
  color: #94a3b8;
  margin: 0 0 24px;
  font-size: 0.875rem;
}
.loading {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
}
.hash-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}
.hash-box {
  background: #0f172a;
  border-radius: 10px;
  padding: 16px;
}
.hash-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 6px;
}
.hash-value {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: bold;
  word-break: break-all;
}
.hash-value.lib {
  color: #f59e0b;
}
.hash-value.hw {
  color: #22c55e;
}
.hash-value.hw-only {
  color: #a855f7;
}
.hash-note {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 4px;
}
.info-table {
  width: 100%;
  border-collapse: collapse;
}
.info-table tr {
  border-bottom: 1px solid #334155;
}
.info-table td {
  padding: 8px 0;
  vertical-align: top;
}
.label {
  color: #94a3b8;
  width: 100px;
  font-size: 0.8rem;
}
.value {
  color: #fff;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}
.mono-sm {
  font-size: 0.6rem;
  color: #cbd5e1;
}
.ua {
  font-size: 0.7rem;
  color: #cbd5e1;
}
.btn-recalc {
  margin-top: 24px;
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
.btn-recalc:hover {
  background: #2563eb;
}
.btn-recalc:disabled {
  background: #475569;
  cursor: not-allowed;
}
</style>
