<template>
  <div class="doctor-page">
    <header class="doctor-topbar">
      <router-link to="/my" class="doctor-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </router-link>
      <span class="doctor-title">ตรวจสอบระบบ</span>
    </header>

    <div class="doctor-body">
      <div class="doctor-card">
        <!-- Icon -->
        <div class="doctor-icon">
          <svg v-if="running" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="spin"><path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.882a.75.75 0 00-.926.94 7.5 7.5 0 01-12.548 3.364l-1.903-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9A9 9 0 0020.694 14.33a.75.75 0 00-.53-.388z" clip-rule="evenodd"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
        </div>

        <!-- Status text -->
        <h2 v-if="running">กำลังตรวจสอบระบบ...</h2>
        <h2 v-else>ตรวจเสร็จแล้ว</h2>

        <p v-if="running" class="doctor-sub">{{ statusText }}</p>
        <p v-else-if="done" class="doctor-sub">ส่งผลตรวจให้ Admin แล้ว</p>

        <!-- Progress bar -->
        <div class="doctor-progress">
          <div class="doctor-progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="doctor-progress-label">{{ currentStep }} / {{ totalSteps }}</div>

        <!-- Done actions -->
        <div v-if="done" class="doctor-actions">
          <button class="doctor-btn" @click="runDoctor">ตรวจอีกครั้ง</button>
          <router-link to="/my" class="doctor-btn-outline">กลับหน้าเรียน</router-link>
        </div>
      </div>
    </div>

    <!-- Hidden iframe for player test -->
    <iframe v-if="iframeUrl" ref="testIframe" :src="iframeUrl" referrerpolicy="origin" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;" allow="accelerometer; gyroscope; autoplay; encrypted-media"></iframe>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

export default {
  name: 'DoctorPage',
  setup() { return { authStore: useAuthStore() } },
  data() {
    return {
      lines: [],
      done: false,
      running: false,
      iframeUrl: '',
      currentStep: 0,
      totalSteps: 0,
      failCount: 0,
      statusText: '',
      videoTitle: '',
    }
  },
  computed: {
    userName() { const u = this.authStore.user; return u?.firstName ? `${u.firstName} ${u.lastName||''}`.trim() : u?.name || '' },
    userEmail() { return this.authStore.user?.email || '' },
    progressPct() { return this.totalSteps ? Math.round((this.currentStep / this.totalSteps) * 100) : 0 },
  },
  mounted() { this.runDoctor() },
  methods: {
    async runDoctor() {
      this.done = false
      this.running = true
      this.lines = []
      this.iframeUrl = ''
      this.currentStep = 0
      this.totalSteps = 10
      this.failCount = 0
      this.videoTitle = ''

      const w = (ms) => new Promise(r => setTimeout(r, ms))
      const add = (step, title, ok, detail, raw) => {
        this.lines.push({ step, title, ok, detail, raw: raw || null })
        if (ok === false) this.failCount++
      }

      // ═══ Step 1-2: Frontend checks ═══
      this.statusText = 'ตรวจ token...'
      this.currentStep = 1
      await w(500)

      const token = localStorage.getItem('token')
      add('1.1', 'JWT token in localStorage', !!token, token ? `${token.length} chars` : 'MISSING')
      if (!token) { this.sendAndFinish(); return }

      // ═══ Step 3-8: Backend doctor ═══
      this.statusText = 'ตรวจ server + CDN...'
      this.currentStep = 2
      await w(500)

      let embedUrl = '', serverData = null, resultId = ''
      try {
        serverData = await api.post('/diag/doctor')
        embedUrl = serverData?.embedUrl || ''
        this.videoTitle = serverData?.videoTitle || ''
        resultId = serverData?.resultId || ''
        this._resultId = resultId

        add('2.1', 'POST /api/diag/doctor', true, `200 OK (${serverData?.totalMs || '?'}ms)`, { totalMs: serverData?.totalMs })

        for (const s of (serverData?.journey || [])) {
          add(s.id, s.title, s.ok, s.detail, s.raw)
        }
      } catch (e) {
        const st = e.response?.status || 0
        add('2.1', 'POST /api/diag/doctor', false, `HTTP ${st} — ${e.response?.data?.message || e.message}`)
        this.sendAndFinish(); return
      }

      this.currentStep = 6
      this.statusText = 'ตรวจ CDN จาก browser...'
      await w(500)

      // ═══ Client-side checks ═══
      // เช็ค ad blocker ก่อน
      let adBlock = false
      try { await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { mode: 'no-cors' }) } catch { adBlock = true }

      // C.1 CDN JS
      try {
        const t = Date.now()
        await fetch('https://player.mediadelivery.net/playerjs/playerjs-latest.min.js', { mode: 'no-cors', cache: 'no-store' })
        add('C.1', 'Browser → CDN (playerjs SDK)', true, `OK (${Date.now()-t}ms)`, { ms: Date.now()-t })
      } catch (e) {
        if (adBlock) { add('C.1', 'Browser → CDN (playerjs SDK)', true, `ปกติ (มี Ad Blocker)`, { adBlock: true }) }
        else { add('C.1', 'Browser → CDN (playerjs SDK)', false, `BLOCKED — ${e.message}`, { error: e.message }) }
      }

      this.currentStep = 7
      await w(300)

      // C.2 Embed URL
      if (embedUrl) {
        try {
          const t = Date.now()
          await fetch(embedUrl, { mode: 'no-cors', cache: 'no-store' })
          add('C.2', 'Browser → embed URL', true, `OK (${Date.now()-t}ms)`, { ms: Date.now()-t })
        } catch (e) {
          if (adBlock) { add('C.2', 'Browser → embed URL', true, `ปกติ (มี Ad Blocker)`, { adBlock: true }) }
          else { add('C.2', 'Browser → embed URL', false, `BLOCKED — ${e.message}`, { error: e.message }) }
        }
      }

      this.currentStep = 8
      await w(300)

      // C.3 Referrer-Policy
      const rp = document.referrerPolicy || 'not set'
      const rpBad = ['no-referrer', 'same-origin'].includes(rp)
      add('C.3', 'Referrer-Policy', !rpBad, rp || 'default', { referrerPolicy: rp })

      this.currentStep = 9
      this.statusText = 'ตรวจ iframe player...'
      await w(500)

      // ═══ Step 9: Iframe player test ═══
      if (embedUrl) {
        this.iframeUrl = embedUrl
        const playerOk = await this.waitForPlayer(12000)
        if (playerOk) {
          add('9.1', 'Iframe player init', true, 'Player ready!')
        } else {
          // server ผ่าน + client ไม่ ready → อาจเป็นแค่ iframe ช้า ไม่ใช่ปัญหาจริง
          const serverOk = serverData?.journey?.find(j => j.id === '6.1')?.ok
          add('9.1', 'Iframe player init', serverOk ? true : false, serverOk ? 'Player ช้า แต่ server ปกติ' : 'Player ไม่ตอบ — อาจเป็น 403 ใน iframe')
        }
      } else {
        add('9.1', 'Iframe player init', true, 'ข้าม (ใช้ demo video)')
      }

      this.currentStep = 10
      this.totalSteps = 10
      this.sendAndFinish()
    },

    waitForPlayer(timeout) {
      return new Promise(resolve => {
        const timer = setTimeout(() => { window.removeEventListener('message', handler); resolve(false) }, timeout)
        const handler = (e) => {
          try {
            const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
            if (d && (d.event === 'ready' || (d.context === 'player.js' && d.event === 'ready'))) {
              clearTimeout(timer); window.removeEventListener('message', handler); resolve(true)
            }
          } catch {}
        }
        window.addEventListener('message', handler)
      })
    },

    async sendAndFinish() {
      this.done = true
      this.running = false
      this.currentStep = this.totalSteps

      // สร้าง plain text ละเอียดทุก byte สำหรับ copy ไปถาม AI
      const { getOS, getBrowser } = await import('../utils/deviceDetect')
      const ua = navigator.userAgent
      const os = getOS(ua)
      const browser = getBrowser(ua)

      let plainText = `=== MedNinja Doctor Diagnostic ===\n`
      plainText += `Date: ${new Date().toISOString()}\n`
      plainText += `User: ${this.userName} (${this.userEmail})\n`
      plainText += `Device: ${os} · ${browser}\n`
      plainText += `Screen: ${screen.width}x${screen.height} (DPR: ${window.devicePixelRatio})\n`
      plainText += `UserAgent: ${ua}\n`
      plainText += `URL: ${window.location.href}\n`
      plainText += `Demo Video: ${this.videoTitle}\n`
      plainText += `Cookies: ${navigator.cookieEnabled ? 'ON' : 'OFF'}\n`
      plainText += `Online: ${navigator.onLine}\n`
      plainText += `Result: ${this.failCount === 0 ? 'ALL PASS' : `FAIL ${this.failCount} จุด`}\n`
      plainText += `\n`

      for (const line of this.lines) {
        const icon = line.ok === true ? '✅' : line.ok === false ? '❌' : '⚠️'
        plainText += `${icon} [${line.step}] ${line.title}\n`
        plainText += `   Result: ${line.detail}\n`
        if (line.raw) {
          // แสดง raw data ละเอียด ไม่ย่อ
          if (line.raw.request) {
            plainText += `   ── Request ──\n`
            plainText += `   Method: GET\n`
            plainText += `   URL: ${line.raw.request.url}\n`
            if (line.raw.request.headers && Object.keys(line.raw.request.headers).length) {
              plainText += `   Headers:\n`
              for (const [k, v] of Object.entries(line.raw.request.headers)) {
                plainText += `     ${k}: ${v}\n`
              }
            }
          }
          if (line.raw.response) {
            plainText += `   ── Response ──\n`
            plainText += `   Status: ${line.raw.response.status}\n`
            plainText += `   Time: ${line.raw.response.ms}ms\n`
            if (line.raw.response.headers) {
              plainText += `   Headers:\n`
              for (const [k, v] of Object.entries(line.raw.response.headers)) {
                plainText += `     ${k}: ${v}\n`
              }
            }
            if (line.raw.response.bodyLength !== undefined) {
              plainText += `   Body Length: ${line.raw.response.bodyLength} bytes\n`
            }
            if (line.raw.response.bodyPreview) {
              plainText += `   Body Preview: ${line.raw.response.bodyPreview.slice(0, 300)}\n`
            }
            if (line.raw.response.body) {
              plainText += `   Body: ${JSON.stringify(line.raw.response.body)}\n`
            }
          }
          // raw data ที่ไม่มี request/response structure
          if (!line.raw.request && !line.raw.response) {
            for (const [k, v] of Object.entries(line.raw)) {
              if (typeof v === 'object' && v !== null) {
                plainText += `   ${k}: ${JSON.stringify(v)}\n`
              } else {
                plainText += `   ${k}: ${v}\n`
              }
            }
          }
        }
        plainText += `\n`
      }

      // เช็ค browser support — ถ้าไม่ผ่าน แสดงเหตุผลให้เติ้ล (ดูไม่ได้ เพราะ ...)
      let browserBlocked = false
      let browserBlockReason = ''
      try {
        const { checkBrowserSupport } = await import('../utils/browserCheck')
        const bc = checkBrowserSupport()
        if (!bc.supported) {
          browserBlocked = true
          browserBlockReason = bc.message || 'Browser ไม่รองรับ'
        }
      } catch { /* ignore */ }

      const _ua = navigator.userAgent
      const clientOS = os
      const clientBrowser = browser

      // ⭐ Device precision — 4-layer iPad detection (เคสกุลจิรา 2026-07-03)
      let deviceType = ''
      try {
        const { isIPhone, isIPad, isAndroid, isMacSafari } = await import('../utils/deviceDetect')
        if (isIPhone(ua)) deviceType = 'iPhone'
        else if (isIPad(ua)) deviceType = 'iPad'
        else if (isAndroid(ua)) deviceType = 'Android'
        else if (isMacSafari(ua)) deviceType = 'Mac'
        else if (/Macintosh|Mac OS X/.test(ua)) deviceType = 'Mac'
        else if (/Windows/.test(ua)) deviceType = 'Windows'
        else if (/Linux|X11/.test(ua)) deviceType = 'Linux'
        else deviceType = 'Unknown'
      } catch { deviceType = clientOS || 'Unknown' }

      // ส่ง LINE Flex + plain text ให้เติ้ล
      try {
        const token = localStorage.getItem('token')
        await fetch('/api/diag/doctor-line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            plainText,
            userName: this.userName,
            userEmail: this.userEmail,
            failCount: this.failCount,
            resultId: this._resultId || '',
            player: 'bunny',                   // ⭐ Bunny CDN
            deviceType,                        // ⭐ iPad detection
            bucket: 'bunny-global',            // ⭐ Bunny CDN Global
            routingReason: deviceType === 'iPhone' || deviceType === 'iPad' || deviceType === 'Mac' ? 'iOS/Mac → No-DRM path' : 'Global → Widevine DRM',
            videoTitle: this.videoTitle || 'Demo',
            sectionName: '',
            sectionCode: '',
            page: 'DoctorPage',
            url: '/doctor',
            watchUrl: document.referrer || '',
            clientReferer: document.referrer || window.location.href,
            clientHost: window.location.host,
            clientOS,
            clientBrowser,
            browserBlocked,
            browserBlockReason
          })
        })
      } catch { /* ignore */ }
    },
  }
}
</script>

<style scoped>
.doctor-page { min-height: 100vh; background: #1c1d1f; color: #fff; font-family: 'Noto Sans Thai', -apple-system, sans-serif; display: flex; flex-direction: column; }
.doctor-topbar { display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 48px; border-bottom: 1px solid #2d2f31; }
.doctor-back { color: #fff; display: flex; }
.doctor-title { font-size: 14px; font-weight: 700; }

.doctor-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.doctor-card { width: 100%; max-width: 360px; text-align: center; }

.doctor-icon { width: 64px; height: 64px; margin: 0 auto 16px; color: #a855f7; }
.doctor-icon svg { width: 100%; height: 100%; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.doctor-card h2 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
.doctor-sub { font-size: 13px; color: #94a3b8; margin: 0 0 20px; }

.doctor-progress { width: 100%; height: 6px; background: #2d2f31; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.doctor-progress-fill { height: 100%; background: linear-gradient(90deg, #a855f7, #3b82f6); border-radius: 3px; transition: width .3s; }
.doctor-progress-label { font-size: 11px; color: #64748b; margin-bottom: 20px; }

.doctor-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.doctor-btn { padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #3b82f6); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; }
.doctor-btn:active { transform: scale(.98); }
.doctor-btn-outline { padding: 12px; border: 2px solid #2d2f31; border-radius: 10px; color: #94a3b8; font-size: 14px; font-weight: 700; text-decoration: none; text-align: center; }
</style>
