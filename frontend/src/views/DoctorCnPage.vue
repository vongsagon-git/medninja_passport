<template>
  <div class="doctor-page">
    <header class="doctor-topbar">
      <router-link to="/my-cn" class="doctor-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </router-link>
      <span class="doctor-title">ตรวจสอบระบบ</span>
    </header>

    <div class="doctor-body">
      <div class="doctor-card">
        <div class="doctor-icon">
          <svg v-if="running" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="spin"><path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.882a.75.75 0 00-.926.94 7.5 7.5 0 01-12.548 3.364l-1.903-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9A9 9 0 0020.694 14.33a.75.75 0 00-.53-.388z" clip-rule="evenodd"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
        </div>

        <h2 v-if="running">กำลังตรวจสอบระบบ...</h2>
        <h2 v-else>ตรวจเสร็จแล้ว</h2>

        <p class="doctor-sub">{{ statusText }}</p>

        <div class="doctor-progress">
          <div class="doctor-progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>

        <div v-if="done" class="doctor-actions">
          <button class="doctor-btn" @click="runDoctor">ตรวจอีกครั้ง</button>
          <router-link to="/my-cn" class="doctor-btn-outline">กลับหน้าเรียน</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

export default {
  name: 'DoctorCnPage',
  setup() { return { authStore: useAuthStore() } },
  data() {
    return {
      lines: [],
      done: false,
      running: false,
      progressPct: 0,
      statusText: 'เริ่มต้น...',
      failCount: 0
    }
  },
  computed: {
    userName() { const u = this.authStore.user; return u?.firstName ? `${u.firstName} ${u.lastName||''}`.trim() : u?.name || '' },
    userEmail() { return this.authStore.user?.email || '' }
  },
  mounted() { this.runDoctor() },
  methods: {
    async runDoctor() {
      this.done = false
      this.running = true
      this.lines = []
      this.progressPct = 0
      this.failCount = 0

      const w = ms => new Promise(r => setTimeout(r, ms))
      const add = (title, ok, detail, raw) => {
        this.lines.push({ title, ok, detail, raw: raw || null })
        if (ok === false) this.failCount++
      }
      const bump = (pct, text) => { this.progressPct = pct; this.statusText = text }

      // Step 1: Token
      bump(10, 'ตรวจสิทธิ์การเข้าถึง...')
      await w(300)
      const token = localStorage.getItem('token')
      add('JWT token', !!token, token ? `${token.length} chars` : 'MISSING')
      if (!token) { this.sendAndFinish(); return }

      // Step 2: Geo (whoami)
      bump(20, 'ตรวจการเชื่อมต่อ...')
      try {
        const t = Date.now()
        const geo = await api.get('/china/whoami')
        const d = geo?.data || geo || {}
        add('Geo whoami', true, `country=${d.country || '?'} ip=${d.ip || '?'} (${Date.now()-t}ms)`, d)
      } catch (e) {
        add('Geo whoami', false, e.message)
      }

      // Step 3: Alibaba VOD STS token
      bump(35, 'ขอกุญแจการเข้ารหัส...')
      const testVideoId = 'c066ba8f7a7b71f1a472f6f7f45a0102'
      let stsOk = false
      try {
        const t = Date.now()
        const sts = await api.get(`/china/sts/${testVideoId}`)
        const d = sts?.data || sts || {}
        stsOk = !!d.accessKeyId && !!d.securityToken
        add('Alibaba STS token', stsOk, stsOk
          ? `accessKeyId=${(d.accessKeyId||'').slice(0, 10)}... region=${d.region} (${Date.now()-t}ms)`
          : 'missing accessKeyId or securityToken', { hasAccessKey: !!d.accessKeyId, hasSecurityToken: !!d.securityToken, region: d.region })
      } catch (e) {
        add('Alibaba STS token', false, e.message)
      }

      // Step 4: Alibaba VOD PlayInfo
      bump(50, 'เตรียมวิดีโอความละเอียดสูง...')
      try {
        const t = Date.now()
        const info = await api.get(`/china/playinfo/${testVideoId}`)
        const d = info?.data || info || {}
        const hasStream = (d.streamCount || 0) > 0
        const encType = d.streams?.[0]?.encryptType || 'none'
        add('Alibaba PlayInfo', hasStream, hasStream
          ? `${d.streamCount} stream · ${d.streams[0].format} · encrypt=${encType} (${Date.now()-t}ms)`
          : 'no streams returned', { streamCount: d.streamCount, encrypted: d.encrypted, encType })
      } catch (e) {
        add('Alibaba PlayInfo', false, e.message)
      }

      // Step 5: Aliplayer SDK load
      bump(65, 'เปิดโปรแกรมเล่น...')
      try {
        const t = Date.now()
        if (!window.Aliplayer) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script')
            s.src = '/vendor/aliplayer/aliplayer.js'
            s.onload = () => setTimeout(resolve, 200)
            s.onerror = reject
            document.head.appendChild(s)
          })
        }
        const sdkOk = typeof window.Aliplayer === 'function'
        add('Aliplayer SDK', sdkOk, sdkOk
          ? `loaded (${Date.now()-t}ms)`
          : 'SDK ไม่พร้อม window.Aliplayer', { hasSDK: sdkOk })
      } catch (e) {
        add('Aliplayer SDK', false, `SDK load fail: ${e.message}`)
      }

      // Step 6: Widevine EME support
      bump(80, 'เปิดระบบป้องกันลิขสิทธิ์...')
      try {
        if (!navigator.requestMediaKeySystemAccess) {
          add('Widevine EME', false, 'browser ไม่รองรับ EME API')
        } else {
          await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
            initDataTypes: ['cenc'],
            audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
            videoCapabilities: [{ contentType: 'video/mp4;codecs="avc1.42E01E"' }]
          }])
          add('Widevine EME', true, 'Widevine L3 or higher supported')
        }
      } catch (e) {
        // FairPlay fallback สำหรับ Safari
        try {
          if (window.WebKitMediaKeys && window.WebKitMediaKeys.isTypeSupported('com.apple.fps.1_0', 'video/mp4')) {
            add('DRM (FairPlay)', true, 'FairPlay supported (Safari)')
          } else {
            add('Widevine EME', false, `EME rejected: ${e.name || e.message}`)
          }
        } catch {
          add('Widevine EME', false, `EME rejected: ${e.name || e.message}`)
        }
      }

      // Step 7: China CDN reachability
      bump(92, 'ตรวจสัญญาณอินเทอร์เน็ต...')
      try {
        const t = Date.now()
        await fetch('https://cdn-cn.medninja.academy/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
        add('CDN China', true, `reachable (${Date.now()-t}ms)`)
      } catch (e) {
        add('CDN China', false, `unreachable: ${e.message}`)
      }

      // Done
      bump(100, 'เสร็จ')
      await w(300)
      this.sendAndFinish()
    },

    async sendAndFinish() {
      this.done = true
      this.running = false
      this.progressPct = 100

      const { getOS, getBrowser, isIPhone, isIPad, isAndroid, isMacSafari } = await import('../utils/deviceDetect')
      const { getExpectedServing, verifyServing } = await import('../utils/servingRules')
      const ua = navigator.userAgent
      const os = getOS(ua)
      const browser = getBrowser(ua)

      // ⭐ Device precision — 4-layer iPad detection (เคสกุลจิรา 2026-07-03)
      let deviceType = ''
      if (isIPhone(ua)) deviceType = 'iPhone'
      else if (isIPad(ua)) deviceType = 'iPad'
      else if (isAndroid(ua)) deviceType = 'Android'
      else if (isMacSafari(ua)) deviceType = 'Mac'
      else if (/Macintosh|Mac OS X/.test(ua)) deviceType = 'Mac'
      else if (/Windows/.test(ua)) deviceType = 'Windows'
      else if (/Linux|X11/.test(ua)) deviceType = 'Linux'
      else deviceType = 'Unknown'

      // ⭐ Country detection — /doctor-cn = CN แน่นอน (route มาจาก /my-cn/)
      // fallback: geo whoami step
      const geoLine = this.lines.find(l => l.title === 'Geo whoami')
      const country = 'CN'  // /doctor-cn = CN 100% (useCountryGuard redirect มาแล้ว)

      // ⭐ Expected serving ตามตารางกฎ
      const expected = getExpectedServing(country, deviceType, browser)

      // ⭐ Actual serving = ที่ระบบ serve จริง (จาก playinfo step ก่อนหน้า)
      const playInfoLine = this.lines.find(l => l.title === 'Alibaba PlayInfo')
      const actualEncType = playInfoLine?.raw?.encType || ''
      let actualDrm = 'nodrm'
      if (/widevine|fairplay/i.test(actualEncType)) actualDrm = 'widevine'
      else if (/aliyunvodencryption/i.test(actualEncType) || actualEncType === '1') actualDrm = 'proprietary'
      else if (/hlsencryption/i.test(actualEncType)) actualDrm = 'aes-128'

      const actual = { player: 'ali', drm: actualDrm, bucket: 'ali-sg' }
      const servingCheck = { ...verifyServing(expected, actual), expected, actual }

      // Plain text detail
      let plainText = `=== MedNinja Doctor (Alibaba VOD) ===\n`
      plainText += `Date: ${new Date().toISOString()}\n`
      plainText += `User: ${this.userName} (${this.userEmail})\n`
      plainText += `Device: ${os} · ${browser}\n`
      plainText += `Screen: ${screen.width}x${screen.height} (DPR: ${window.devicePixelRatio})\n`
      plainText += `UserAgent: ${ua}\n`
      plainText += `URL: ${window.location.href}\n`
      plainText += `Player: Alibaba VOD (China mirror)\n`
      plainText += `Cookies: ${navigator.cookieEnabled ? 'ON' : 'OFF'}\n`
      plainText += `Online: ${navigator.onLine}\n`
      plainText += `Result: ${this.failCount === 0 ? 'ALL PASS' : `FAIL ${this.failCount} จุด`}\n\n`

      for (const line of this.lines) {
        const icon = line.ok === true ? '✅' : line.ok === false ? '❌' : '⚠️'
        plainText += `${icon} ${line.title}\n   ${line.detail}\n`
        if (line.raw) plainText += `   raw: ${JSON.stringify(line.raw)}\n`
        plainText += `\n`
      }

      // Video/section context (จาก referrer)
      const ref = document.referrer || ''
      const m = ref.match(/\/my-cn\/watch\/([a-f0-9]+)\/(\d+)/)
      let sectionId = m ? m[1] : ''
      let videoIndex = m ? m[2] : ''
      let videoTitle = ''
      let sectionName = ''
      let sectionCode = ''

      try {
        if (sectionId) {
          const sec = await api.get(`/my/sections/${sectionId}`)
          const s = sec?.data || sec || {}
          sectionCode = s.code || ''
          sectionName = s.name || ''
          videoTitle = (s.videos && s.videos[videoIndex]?.title) || ''
        }
      } catch { /* not critical */ }

      // ส่ง Flex + plain text
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
            player: 'ali',                     // ⭐ tag ให้ backend เลือก card ถูก
            deviceType,                        // ⭐ 4-layer detection (iPad iOS 13+ ตรวจถูก)
            country,                           // ⭐ CN (/doctor-cn = CN แน่นอน)
            bucket: 'ali-sg',                  // ⭐ Alibaba Singapore VOD
            routingReason: expected.reason,    // ⭐ จากตารางกฎ (ตรงเป๊ะ)
            servingCheck,                      // ⭐ expected vs actual — บอกว่าตรงกฎไหม
            videoTitle: videoTitle || '',
            sectionName,
            sectionCode,
            page: 'DoctorCnPage',
            url: window.location.href,
            watchUrl: ref,                     // ⭐ URL ที่กดปุ่มมาจริง
            clientReferer: ref || window.location.href,
            clientHost: window.location.host,
            clientOS: os,
            clientBrowser: browser,
            browserBlocked: false,
            browserBlockReason: ''
          })
        })
      } catch { /* ignore */ }
    }
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

.doctor-icon { width: 64px; height: 64px; margin: 0 auto 16px; color: #ef4444; }
.doctor-icon svg { width: 100%; height: 100%; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.doctor-card h2 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
.doctor-sub { font-size: 13px; color: #94a3b8; margin: 0 0 20px; }

.doctor-progress { width: 100%; height: 6px; background: #2d2f31; overflow: hidden; margin-bottom: 20px; }
.doctor-progress-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); transition: width .3s; }

.doctor-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.doctor-btn { padding: 12px; border: none; background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; }
.doctor-btn:active { transform: scale(.98); }
.doctor-btn-outline { padding: 12px; border: 2px solid #2d2f31; color: #94a3b8; font-size: 14px; font-weight: 700; text-decoration: none; text-align: center; }
</style>
