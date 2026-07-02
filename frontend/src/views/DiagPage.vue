<template>
  <div class="watch-page diag-mode">
    <!-- Top bar เหมือน WatchPage -->
    <header class="w-topbar">
      <router-link to="/my" class="w-back" title="กลับ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </router-link>
      <div class="w-topbar-info">
        <span class="w-section-name">System Diagnostic — ตรวจสอบระบบ</span>
      </div>
      <div v-if="userName" style="font-size:12px;color:#a855f7;font-weight:700;">{{ userName }}</div>
    </header>

    <!-- Content -->
    <div class="w-layout">
      <main class="w-main">
        <div class="w-player-area" @contextmenu.prevent>
          <div class="w-player-box">
            <iframe v-if="embedUrl" :src="embedUrl" referrerpolicy="origin" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture 'none'" allowfullscreen></iframe>
            <div v-else class="diag-player-msg">
              <div v-if="running" class="diag-spinner"></div>
              <p>{{ videoMsg }}</p>
            </div>
          </div>
        </div>

        <!-- Video info bar -->
        <div class="w-info-bar">
          <div class="w-title">Diagnostic Test Video</div>
          <div class="w-meta">
            <span class="w-drm-badge" :style="{ background: allPass ? '#059669' : running ? '#f59e0b' : '#ef4444' }">
              {{ allPass ? 'PASS' : running ? 'TESTING...' : 'FAIL' }}
            </span>
            <span v-if="deviceInfo">{{ deviceInfo }}</span>
          </div>
        </div>

        <!-- Diagnostic Panel -->
        <div class="diag-panel">
          <div class="diag-panel-header">
            <h3>Diagnostic Results</h3>
            <span v-if="done" class="diag-score" :class="allPass ? 'pass' : 'fail'">{{ passCount }}/{{ totalSteps }}</span>
          </div>

          <div class="diag-steps">
            <div v-for="s in steps" :key="s.n" class="diag-step" :class="s.status">
              <div class="diag-step-icon">
                <span v-if="s.status === 'wait'">{{ s.n }}</span>
                <span v-else-if="s.status === 'run'" class="diag-spin-sm"></span>
                <span v-else-if="s.status === 'ok'">&#10003;</span>
                <span v-else-if="s.status === 'info'">!</span>
                <span v-else>&#10007;</span>
              </div>
              <div class="diag-step-body">
                <div class="diag-step-title">{{ s.title }}</div>
                <div class="diag-step-detail" :class="s.status">{{ s.detail }}</div>
              </div>
            </div>
          </div>

          <div v-if="done" class="diag-actions">
            <button class="diag-retry" @click="runDiag">ตรวจอีกครั้ง</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import { getOS as detectOS, getBrowser as detectBrowser } from '../utils/deviceDetect'

export default {
  name: 'DiagPage',
  setup() { return { authStore: useAuthStore() } },
  data() {
    return { steps: [], done: false, running: false, embedUrl: '', rawInfo: '', videoMsg: 'กำลังเตรียมตรวจสอบ...', totalSteps: 0, passCount: 0 }
  },
  computed: {
    userName() { const u = this.authStore.user; return u?.firstName ? `${u.firstName} ${u.lastName||''}`.trim() : u?.name || '' },
    userEmail() { return this.authStore.user?.email || '' },
    allPass() { return this.done && this.passCount >= this.totalSteps },
    deviceInfo() { const s = this.steps[0]; return s?.status === 'ok' ? s.detail : '' }
  },
  mounted() { this.runDiag() },
  methods: {
    async runDiag() {
      this.done = false; this.running = true; this.embedUrl = ''; this.passCount = 0
      this.videoMsg = 'กำลังตรวจสอบระบบ...'
      this.steps = []

      const raw = { userName: this.userName, userEmail: this.userEmail }
      const ua = navigator.userAgent; raw.userAgent = ua
      let pass = 0, stepN = 0

      const _w = (ms) => new Promise(r => setTimeout(r, ms))
      const addStep = (title) => { stepN++; this.steps.push({ n: stepN, title, detail: 'รอ...', status: 'wait' }); return stepN }
      const _dOS = (u) => detectOS(u)
      const _dBR = (u) => detectBrowser(u)

      // 1) Browser / OS
      let s = addStep('Browser / OS / หน้าจอ')
      this.set(s,'run',''); await _w(400)
      const os = _dOS(ua), br = _dBR(ua)
      raw.os=os; raw.browser=br; raw.screen=screen.width+'x'+screen.height; raw.dpr=devicePixelRatio
      this.set(s,'ok',`${br} · ${os} · ${raw.screen}`); pass++

      // 2) Cookies
      s = addStep('Cookies')
      this.set(s,'run',''); await _w(300)
      raw.cookies = navigator.cookieEnabled
      if(raw.cookies){ this.set(s,'ok','เปิดอยู่'); pass++ }
      else { this.set(s,'no','ปิดอยู่ — อาจทำให้ login ไม่ได้') }

      // 3) API health
      s = addStep('เซิร์ฟเวอร์ MedNinja')
      this.set(s,'run',''); await _w(300)
      try {
        const t = performance.now()
        const resp = await fetch('/api/health')
        const ms = Math.round(performance.now() - t)
        raw.api = resp.ok
        if(resp.ok){ this.set(s,'ok',`ปกติ (${ms}ms)`); pass++ }
        else { this.set(s,'no','ตอบกลับผิดปกติ') }
      } catch { raw.api = false; this.set(s,'no','เชื่อมต่อไม่ได้') }

      // 4) Signed URL + HTTP
      let hs = 0
      s = addStep('ขอ Signed URL + HTTP Status')
      this.set(s,'run',''); await _w(300)
      try {
        const d = await api.get('/diag/test-video')
        this.embedUrl = d.embedUrl || ''
        raw.hasToken = !!(d.embedUrl && d.embedUrl.includes('token='))
        hs = d.httpStatus || 0
        raw.httpStatus = hs
        if(raw.hasToken && hs === 200){ this.set(s,'ok',`Signed URL + HTTP ${hs}`); pass++ }
        else if(!raw.hasToken){ this.set(s,'no','ไม่มี token — วีดีโออาจเปิดไม่ได้') }
        else { this.set(s,'no',`HTTP ${hs} — ผิดปกติ`) }
      } catch(e) { this.set(s,'no','ขอ URL ไม่ได้: ' + e.message) }

      // 5) เช็คทุกเคสละเอียดเสมอ
      s = addStep('ตรวจสอบ Token + Referer + Security')
      this.set(s,'run','กำลังเช็คทุกเคส...'); await _w(300)
      try {
        const result = await api.get('/diag/check-403')
        const c = result.checks || {}
        const diag = result.diagnosis || []
        raw.check403 = result

        const s5a = addStep('Token + Referer ที่ถูกต้อง')
        if(c.signedWithReferer === 200){ this.set(s5a,'ok','HTTP 200 — ปกติ'); pass++ }
        else { this.set(s5a,'no',`HTTP ${c.signedWithReferer}`) }
        await _w(500)

        const s5b = addStep('Token + ไม่ส่ง Referer')
        if(c.signedNoReferer === 200){ this.set(s5b,'ok','HTTP 200 — ไม่ได้บังคับ Referer'); pass++ }
        else if(c.signedNoReferer === 403){ this.set(s5b,'ok','HTTP 403 — ต้องส่ง Referer (ดี)'); pass++ }
        else { this.set(s5b,'no',`HTTP ${c.signedNoReferer}`) }
        await _w(500)

        const s5c = addStep('Token + Referer ผิด domain')
        if(c.signedWrongReferer === 403){ this.set(s5c,'ok','HTTP 403 — block domain อื่น (ดี)'); pass++ }
        else if(c.signedWrongReferer === 200){ this.set(s5c,'info','HTTP 200 — ไม่ได้ block domain อื่น'); pass++ }
        else { this.set(s5c,'no',`HTTP ${c.signedWrongReferer}`) }
        await _w(500)

        const s5d = addStep('ไม่มี Token (unsigned URL)')
        if(c.unsignedWithReferer === 403){ this.set(s5d,'ok','HTTP 403 — Token Auth เปิดอยู่ (ดี)'); pass++ }
        else if(c.unsignedWithReferer === 200){ this.set(s5d,'no','HTTP 200 — Token Auth ปิดอยู่!') }
        else { this.set(s5d,'no',`HTTP ${c.unsignedWithReferer}`) }
        await _w(500)

        const s5e = addStep('Video มีอยู่ใน Library')
        if(c.videoExists){ this.set(s5e,'ok','มีอยู่'); pass++ }
        else { this.set(s5e,'no','ไม่พบ — อาจถูกลบหรือ Video ID ผิด') }
        await _w(500)

        const sDiag = addStep('สรุปผลวิเคราะห์')
        const allOk = c.signedWithReferer === 200
        if(diag.length > 0){ this.set(sDiag, allOk ? 'ok' : 'no', diag.join(' | ')); if(allOk) pass++ }
        else { this.set(sDiag,'no','ไม่สามารถระบุสาเหตุได้') }

        this.set(s, allOk ? 'ok' : 'no', 'เสร็จ — ดูผลด้านล่าง')
        if(allOk) pass++
        raw.videoTest = hs === 200 ? 'pass' : 'fail'
        if(hs === 200){ this.videoMsg = '' } else { this.embedUrl = ''; this.videoMsg = 'วีดีโอโหลดไม่ได้' }
      } catch(e) { this.set(s,'no','เช็คไม่ได้: ' + e.message); raw.videoTest = 'fail' }

      // เครือข่าย
      // ═══ Client-side checks ═══

      // เช็ค Ad Blocker ก่อน
      try { await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',{mode:'no-cors'}); raw.adBlock=false } catch { raw.adBlock=true }

      // C1) Client fetch CDN domain
      s = addStep('Browser → CDN (client-side)')
      this.set(s,'run',''); await _w(300)
      try {
        await fetch('https://player.mediadelivery.net/playerjs/playerjs-latest.min.js',{mode:'no-cors',cache:'no-store'})
        raw.clientCdn = true; this.set(s,'ok','เชื่อมต่อ CDN ได้จาก browser'); pass++
      } catch {
        raw.clientCdn = false
        if (raw.adBlock) { this.set(s,'info','ปกติ — ข้ามการทดสอบนี้'); pass++ }
        else { this.set(s,'no','Browser เชื่อมต่อ CDN ไม่ได้ — ลองเปลี่ยน WiFi/เปิด 4G หรือปิด VPN/Extension') }
      }

      // C2) Client fetch signed embed URL
      s = addStep('Browser → Embed URL (no cache)')
      this.set(s,'run',''); await _w(300)
      if (raw.httpStatus === 200 && raw.hasToken) {
        try {
          const d2 = await api.get('/diag/test-video')
          if (d2.embedUrl) {
            await fetch(d2.embedUrl,{mode:'no-cors',cache:'no-store'})
            raw.clientEmbed = true; this.set(s,'ok','Browser โหลด embed URL ได้ (no cache)'); pass++
          } else { this.set(s,'no','ไม่มี URL ทดสอบ') }
        } catch {
          raw.clientEmbed = false
          if (raw.adBlock) { this.set(s,'info','ปกติ — ข้ามการทดสอบนี้'); pass++ }
          else { this.set(s,'no','Browser โหลด embed URL ไม่ได้ — ลอง Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac) หรือปิด Extension') }
        }
      } else { raw.clientEmbed = false; this.set(s,'info','ข้าม — server-side ไม่ผ่าน'); pass++ }

      // C3) Referrer-Policy
      s = addStep('Referrer-Policy')
      this.set(s,'run',''); await _w(300)
      const refPolicy = document.referrerPolicy || 'default'
      const metaRef = document.querySelector('meta[name="referrer"]')?.content || ''
      raw.referrerPolicy = refPolicy; raw.metaReferrer = metaRef
      if (['no-referrer','same-origin'].includes(refPolicy) || ['no-referrer','same-origin'].includes(metaRef)) {
        this.set(s,'no',`${refPolicy||metaRef} — อาจทำให้ CDN ไม่ได้รับ Referer`)
      } else { this.set(s,'ok',refPolicy||'strict-origin-when-cross-origin'); pass++ }

      // เครือข่าย (ad blocker เช็คไว้แล้ว)
      s = addStep('เครือข่าย')
      this.set(s,'run',''); await _w(300)
      const cn = navigator.connection; raw.netType=cn?.effectiveType||'?'; raw.downlink=cn?.downlink||'?'
      let sNet = raw.netType + ' · ' + raw.downlink + ' Mbps'
      this.set(s,'ok',sNet); pass++

      // ส่ง LINE (แอบ — ไม่แสดง step)
      raw.videoTest = raw.videoTest || (hs === 200 ? 'pass' : 'fail')
      raw.timestamp = new Date().toLocaleString('th-TH')
      raw.cdn = raw.api
      raw.diagSteps = this.steps.map(st => ({ title: st.title, status: st.status, detail: st.detail }))
      try { await fetch('/api/diag',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(raw)}) } catch {}

      this.totalSteps = stepN
      this.passCount = pass
      this.rawInfo = JSON.stringify(raw, null, 2)
      this.done = true; this.running = false
    },
    set(n,st,d){ const s=this.steps[n-1]; if(s){ s.status=st; if(d!==undefined) s.detail=d } },
  }
}
</script>

<style scoped>
/* ใช้ CSS จาก WatchPage (dark theme) */
.watch-page { min-height: 100vh; background: #1c1d1f; color: #fff; font-family: 'Noto Sans Thai', -apple-system, sans-serif; }
.w-topbar { display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 48px; background: #1c1d1f; border-bottom: 1px solid #2d2f31; position: sticky; top: 0; z-index: 10; }
.w-back { color: #fff; display: flex; align-items: center; }
.w-back svg { width: 20px; height: 20px; }
.w-topbar-info { flex: 1; min-width: 0; }
.w-section-name { font-size: 14px; font-weight: 700; color: #fff; }

.w-layout { display: flex; min-height: calc(100vh - 48px); }
.w-main { flex: 1; min-width: 0; }

.w-player-area { position: relative; width: 100%; background: #000; }
.w-player-box { position: relative; padding-top: 56.25%; background: #000; }
.w-player-box iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }

.diag-player-msg { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; gap: 12px; }
.diag-spinner { width: 32px; height: 32px; border: 3px solid #333; border-top-color: #a855f7; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.w-info-bar { padding: 12px 16px; border-bottom: 1px solid #2d2f31; }
.w-title { font-size: 16px; font-weight: 800; }
.w-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: #94a3b8; }
.w-drm-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; color: #fff; }

/* Diagnostic Panel */
.diag-panel { padding: 16px; }
.diag-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.diag-panel-header h3 { font-size: 15px; font-weight: 800; color: #a855f7; }
.diag-score { padding: 4px 12px; border-radius: 8px; font-size: 14px; font-weight: 900; }
.diag-score.pass { background: rgba(16,185,129,.15); color: #10b981; }
.diag-score.fail { background: rgba(239,68,68,.15); color: #ef4444; }

.diag-steps { display: flex; flex-direction: column; gap: 2px; }
.diag-step { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.03); }
.diag-step.no { background: rgba(239,68,68,.08); }
.diag-step-icon { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; background: #2d2f31; color: #64748b; }
.diag-step.ok .diag-step-icon { background: rgba(16,185,129,.2); color: #10b981; }
.diag-step.no .diag-step-icon { background: rgba(239,68,68,.2); color: #ef4444; }
.diag-step.run .diag-step-icon { background: rgba(168,85,247,.2); color: #a855f7; }
.diag-step.info .diag-step-icon { background: rgba(245,158,11,.2); color: #f59e0b; }
.diag-spin-sm { display: block; width: 12px; height: 12px; border: 2px solid #444; border-top-color: #a855f7; border-radius: 50%; animation: spin .6s linear infinite; }
.diag-step-title { font-size: 12px; font-weight: 700; color: #e2e8f0; }
.diag-step-detail { font-size: 11px; color: #64748b; }
.diag-step-detail.ok { color: #10b981; }
.diag-step-detail.no { color: #ef4444; }
.diag-step-detail.info { color: #f59e0b; }

.diag-actions { margin-top: 16px; }
.diag-retry { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #3b82f6); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
.diag-retry:active { transform: scale(.98); }

@media (max-width: 768px) {
  .w-topbar { padding: 0 10px; }
  .diag-panel { padding: 12px 10px; }
}
</style>
