<template>
  <div class="health-check">
    <div class="hc-header">
      <router-link to="/admin" class="hc-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </router-link>
      <h1>System Health Check</h1>
      <button class="hc-run-btn" @click="runAllChecks" :disabled="running">
        {{ running ? 'กำลังตรวจสอบ...' : 'ตรวจสอบทั้งหมด' }}
      </button>
    </div>

    <!-- Summary -->
    <div v-if="hasResults" class="hc-summary" :class="summaryClass">
      <div class="hc-summary-icon">
        <svg v-if="allPassed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
      </div>
      <div>
        <h2>{{ allPassed ? 'ระบบปกติทั้งหมด' : 'พบปัญหา' }}</h2>
        <p>{{ passedCount }}/{{ totalChecks }} รายการผ่าน &middot; ตรวจเมื่อ {{ lastChecked }}</p>
      </div>
    </div>

    <!-- Check categories -->
    <div class="hc-sections">
      <div v-for="section in sections" :key="section.title" class="hc-section">
        <div class="hc-section-header">
          <div class="hc-section-icon" :style="{ background: section.iconBg, color: section.iconColor }">
            <svg v-html="section.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"></svg>
          </div>
          <h3 class="hc-section-title">{{ section.title }}</h3>
          <span class="hc-section-count" :class="sectionCountClass(section)">
            {{ sectionPassCount(section) }}/{{ section.checks.length }}
          </span>
        </div>
        <div class="hc-checks">
          <div v-for="c in section.checks" :key="c.name" class="hc-check" :class="statusClass(c)">
            <div class="hc-status-dot"></div>
            <div class="hc-check-info">
              <span class="hc-check-name">{{ c.name }}</span>
              <span class="hc-check-detail">{{ c.detail }}</span>
              <span v-if="c.latency" class="hc-latency">{{ c.latency }}ms</span>
            </div>
            <span class="hc-badge">{{ c.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ปุ่มทดสอบ PDF Watermark Service -->
    <div class="hc-section" style="max-width:600px;margin:16px auto;">
      <div class="hc-section-header">
        <div class="hc-section-icon" style="background:#fce7f3;color:#be185d;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        </div>
        <h3 class="hc-section-title">ทดสอบ Watermark</h3>
      </div>
      <div style="padding:12px 16px;background:#1e293b;border-radius:0 0 8px 8px;">
        <p style="font-size:12px;color:#94a3b8;margin-bottom:8px;">ไฟล์ทดสอบ: MEQ_-_internal_medicine_case_1.pdf (2.8 MB)</p>
        <button @click="testWatermark" :disabled="testRunning" style="width:100%;padding:10px;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;" :style="{ background: testRunning ? '#334155' : '#3b82f6', color: testRunning ? '#64748b' : '#fff' }">
          {{ testRunning ? testProgress : 'ทดสอบ Watermark' }}
        </button>
        <div v-if="testResult" style="margin-top:8px;padding:8px 12px;border-radius:6px;font-size:13px;" :style="{ background: testResult.ok ? '#14532d' : '#7f1d1d', color: testResult.ok ? '#86efac' : '#fca5a5' }">
          {{ testResult.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'VideoHealthCheck',
  data() {
    return {
      running: false,
      lastChecked: '',
      serverChecks: [],
      bunnySecurityChecks: [],
      bunnyApiChecks: [],
      storageChecks: [],
      lmsApiChecks: [],
      realtimeChecks: [],
      pdfServiceChecks: [],
      testFileName: 'MEQ_-_internal_medicine_case_1.pdf',
      testRunning: false,
      testProgress: '',
      testResult: null
    }
  },
  computed: {
    sections() {
      return [
        {
          title: 'Server & Database',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"/>',
          iconBg: '#dbeafe', iconColor: '#1d4ed8',
          checks: this.serverChecks
        },
        {
          title: 'Bunny Video Security (7-Layer)',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>',
          iconBg: '#fee2e2', iconColor: '#dc2626',
          checks: this.bunnySecurityChecks
        },
        {
          title: 'Bunny API & CDN',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.883v6.234a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>',
          iconBg: '#ede9fe', iconColor: '#7c3aed',
          checks: this.bunnyApiChecks
        },
        {
          title: 'PDF Storage & Download',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>',
          iconBg: '#fef9c3', iconColor: '#b45309',
          checks: this.storageChecks
        },
        {
          title: 'LMS APIs (Passport / Activation / Content)',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
          iconBg: '#e0f2fe', iconColor: '#0369a1',
          checks: this.lmsApiChecks
        },
        {
          title: 'PDF Watermark Service',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/>',
          iconBg: '#fce7f3', iconColor: '#be185d',
          checks: this.pdfServiceChecks
        },
        {
          title: 'Realtime & Version',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
          iconBg: '#dcfce7', iconColor: '#15803d',
          checks: this.realtimeChecks
        }
      ]
    },
    hasResults() { return this.serverChecks.length > 0 },
    allChecks() {
      return [...this.serverChecks, ...this.bunnySecurityChecks, ...this.bunnyApiChecks, ...this.storageChecks, ...this.pdfServiceChecks, ...this.lmsApiChecks, ...this.realtimeChecks]
    },
    totalChecks() { return this.allChecks.length },
    passedCount() { return this.allChecks.filter(c => c.status === 'PASS').length },
    allPassed() { return this.totalChecks > 0 && this.passedCount === this.totalChecks },
    summaryClass() {
      if (this.allPassed) return 'hc-summary-pass'
      if (this.allChecks.some(c => c.status === 'FAIL')) return 'hc-summary-fail'
      return 'hc-summary-warn'
    }
  },
  mounted() {
    this.runAllChecks()
  },
  methods: {
    statusClass(check) {
      return {
        'hc-pass': check.status === 'PASS',
        'hc-fail': check.status === 'FAIL',
        'hc-warn': check.status === 'WARN',
        'hc-pending': check.status === '...'
      }
    },
    sectionPassCount(section) {
      return section.checks.filter(c => c.status === 'PASS').length
    },
    sectionCountClass(section) {
      const all = section.checks.length
      const pass = this.sectionPassCount(section)
      if (pass === all && all > 0) return 'hc-count-pass'
      if (section.checks.some(c => c.status === 'FAIL')) return 'hc-count-fail'
      if (section.checks.some(c => c.status === '...')) return 'hc-count-pending'
      return 'hc-count-warn'
    },
    mk(name) { return { name, detail: 'กำลังตรวจ...', status: '...' } },

    async runAllChecks() {
      this.running = true
      this.initPending()
      await Promise.allSettled([
        this.checkServer(),
        this.checkBunnySecurity(),
        this.checkBunnyApi(),
        this.checkStorage(),
        this.checkPdfService(),
        this.checkLmsApis(),
        this.checkRealtime()
      ])
      this.lastChecked = new Date().toLocaleTimeString('th-TH')
      this.running = false
    },

    initPending() {
      this.serverChecks = [
        this.mk('Backend Server'),
        this.mk('MongoDB Passport'),
        this.mk('MongoDB LMS')
      ]
      this.bunnySecurityChecks = [
        this.mk('Token Auth — Library ID'),
        this.mk('Token Auth — Security Key'),
        this.mk('Token Auth — URL Generation'),
        this.mk('Embed Domain'),
        this.mk('Referrer Policy'),
        this.mk('CSP Frame Source'),
        this.mk('CDN Hostname')
      ]
      this.bunnyApiChecks = [
        this.mk('Demo Library API (628424)'),
        this.mk('Fetch Video Info'),
        this.mk('Signed Embed URL'),
        this.mk('403 Diagnosis (6 scenarios)'),
        this.mk('Demo Section API'),
        this.mk('Demo Video Embed')
      ]
      this.storageChecks = [
        this.mk('Storage Zone — File List'),
        this.mk('Video-PDF Mapping'),
        this.mk('PDF Download Logs')
      ]
      this.lmsApiChecks = [
        this.mk('Passport — รายการลงทะเบียน'),
        this.mk('Packages — รายการคอร์ส'),
        this.mk('Activations — การเปิดสิทธิ์'),
        this.mk('Sections — วีดีโอ'),
        this.mk('Courses — หน้าขาย'),
        this.mk('Viewers — ผู้ชมออนไลน์'),
        this.mk('Anomaly Report'),
        this.mk('Client Logs'),
        this.mk('Watermark Config'),
        this.mk('Live Sessions'),
        this.mk('Demo Config')
      ]
      this.pdfServiceChecks = [
        this.mk('PDF Service — เชื่อมต่อ'),
        this.mk('PDF Service — RAM'),
        this.mk('PDF Service — Queue')
      ]
      this.realtimeChecks = [
        this.mk('Backend Version'),
        this.mk('Frontend Version'),
        this.mk('Visitor Analytics API')
      ]
    },

    // ─── Helper ───
    async measure(fn) {
      const t0 = Date.now()
      try {
        const data = await fn()
        return { data, latency: Date.now() - t0, ok: true }
      } catch (err) {
        return { err, latency: Date.now() - t0, ok: false, msg: err.response?.data?.message || err.response?.status ? `HTTP ${err.response.status}` : 'ไม่สามารถเชื่อมต่อ' }
      }
    },
    set(arr, idx, obj) { arr.splice(idx, 1, obj) },

    // ─── 1. Server & Database ───
    async checkServer() {
      const r = await this.measure(() => api.get('/health'))
      if (r.ok) {
        this.set(this.serverChecks, 0, { name: 'Backend Server', detail: `ตอบกลับปกติ (${r.latency}ms)`, status: 'PASS', latency: r.latency })
        const pOk = r.data.db?.passport === 'connected'
        this.set(this.serverChecks, 1, { name: 'MongoDB Passport', detail: pOk ? 'เชื่อมต่อปกติ' : `สถานะ: ${r.data.db?.passport || 'unknown'}`, status: pOk ? 'PASS' : 'FAIL', latency: r.latency })
        const lOk = r.data.db?.lms === 'connected'
        this.set(this.serverChecks, 2, { name: 'MongoDB LMS', detail: lOk ? 'เชื่อมต่อปกติ' : `สถานะ: ${r.data.db?.lms || 'unknown'}`, status: lOk ? 'PASS' : 'FAIL', latency: r.latency })
      } else {
        const f = { detail: r.msg, status: 'FAIL', latency: r.latency }
        this.set(this.serverChecks, 0, { name: 'Backend Server', ...f })
        this.set(this.serverChecks, 1, { name: 'MongoDB Passport', ...f })
        this.set(this.serverChecks, 2, { name: 'MongoDB LMS', ...f })
      }
    },

    // ─── 2. Bunny Video Security ───
    async checkBunnySecurity() {
      const r = await this.measure(() => api.get('/health/video'))
      const names = [
        { key: 'token_auth.library_id', name: 'Token Auth — Library ID' },
        { key: 'token_auth.security_key', name: 'Token Auth — Security Key' },
        { key: 'token_auth.generation', name: 'Token Auth — URL Generation' },
        { key: 'embed_domain', name: 'Embed Domain' },
        { key: 'referrer_policy', name: 'Referrer Policy' },
        { key: 'csp_frame_src', name: 'CSP Frame Source' },
        { key: 'cdn_hostname', name: 'CDN Hostname' }
      ]
      if (r.ok) {
        const c = r.data.checks || {}
        names.forEach((m, i) => {
          const val = c[m.key] || 'unknown'
          const pass = val === 'pass'
          this.set(this.bunnySecurityChecks, i, { name: m.name, detail: pass ? 'ผ่าน' : val, status: pass ? 'PASS' : 'FAIL', latency: r.latency })
        })
      } else {
        names.forEach((m, i) => {
          this.set(this.bunnySecurityChecks, i, { name: m.name, detail: r.msg, status: 'FAIL', latency: r.latency })
        })
      }
    },

    // ─── 3. Bunny API & CDN ───
    async checkBunnyApi() {
      // 3a. Demo library video info
      const r1 = await this.measure(() => api.get('/admin/demo/bunny/video/ef8f4e09-a4c0-40f6-a085-1bfab5759a77'))
      if (r1.ok) {
        this.set(this.bunnyApiChecks, 0, { name: 'Demo Library API (628424)', detail: 'เชื่อมต่อ API สำเร็จ', status: 'PASS', latency: r1.latency })
        const hasInfo = r1.data.videoId && r1.data.length > 0
        this.set(this.bunnyApiChecks, 1, { name: 'Fetch Video Info', detail: hasInfo ? `"${r1.data.title}" — ${Math.floor(r1.data.length / 60)} นาที (${r1.data.statusText})` : 'ได้ response แต่ไม่มีข้อมูล', status: hasInfo ? 'PASS' : 'WARN', latency: r1.latency })
      } else {
        const msg = r1.err?.response?.status === 404 ? 'ไม่พบ video ทดสอบ' : (r1.msg || 'API key ผิดหรือ Bunny ไม่ตอบ')
        this.set(this.bunnyApiChecks, 0, { name: 'Demo Library API (628424)', detail: msg, status: 'FAIL', latency: r1.latency })
        this.set(this.bunnyApiChecks, 1, { name: 'Fetch Video Info', detail: msg, status: 'FAIL', latency: r1.latency })
      }

      // 3b. Signed embed URL
      const r2 = await this.measure(() => api.get('/diag/test-video'))
      if (r2.ok) {
        const hasToken = r2.data.embedUrl && r2.data.embedUrl.includes('token=')
        this.set(this.bunnyApiChecks, 2, { name: 'Signed Embed URL', detail: hasToken ? 'สร้าง signed URL สำเร็จ (token + expires)' : 'URL ไม่มี token', status: hasToken ? 'PASS' : 'FAIL', latency: r2.latency })
      } else {
        this.set(this.bunnyApiChecks, 2, { name: 'Signed Embed URL', detail: r2.msg, status: 'FAIL', latency: r2.latency })
      }

      // 3c. 403 Diagnosis (6 scenarios)
      const r3 = await this.measure(() => api.get('/diag/check-403'))
      if (r3.ok) {
        const checks = r3.data.checks || {}
        const passCount = Object.values(checks).filter(v => v === 'PASS' || v === 200 || v === '200').length
        const total = Object.keys(checks).length || 6
        const diagnosis = r3.data.diagnosis || []
        const detail = diagnosis.length > 0 ? diagnosis.join(' | ') : `${passCount}/${total} scenarios ผ่าน`
        this.set(this.bunnyApiChecks, 3, { name: '403 Diagnosis (6 scenarios)', detail, status: passCount >= 1 ? 'PASS' : 'FAIL', latency: r3.latency })
      } else {
        this.set(this.bunnyApiChecks, 3, { name: '403 Diagnosis (6 scenarios)', detail: r3.msg, status: 'FAIL', latency: r3.latency })
      }

      // 3d. Demo section API
      const r4 = await this.measure(() => api.get('/demo/section'))
      if (r4.ok) {
        const videos = r4.data.videos || r4.data.sections || []
        this.set(this.bunnyApiChecks, 4, { name: 'Demo Section API', detail: `ตอบกลับปกติ (${Array.isArray(videos) ? videos.length : 0} รายการ)`, status: 'PASS', latency: r4.latency })
      } else {
        this.set(this.bunnyApiChecks, 4, { name: 'Demo Section API', detail: r4.msg, status: 'FAIL', latency: r4.latency })
      }

      // 3e. Demo video embed (index 0)
      const r5 = await this.measure(() => api.get('/demo/section/videos/0'))
      if (r5.ok) {
        const hasEmbed = r5.data.embedUrl && r5.data.embedUrl.includes('mediadelivery.net')
        this.set(this.bunnyApiChecks, 5, { name: 'Demo Video Embed', detail: hasEmbed ? 'สร้าง embed URL สำเร็จ' : 'URL ผิดรูปแบบ', status: hasEmbed ? 'PASS' : 'WARN', latency: r5.latency })
      } else {
        this.set(this.bunnyApiChecks, 5, { name: 'Demo Video Embed', detail: r5.msg, status: r5.err?.response?.status === 404 ? 'WARN' : 'FAIL', latency: r5.latency })
      }
    },

    // ─── 4. PDF Storage & Download ───
    async checkStorage() {
      // 4a. Video-PDF map (Storage Zone file list)
      const r1 = await this.measure(() => api.get('/admin/video-pdf-map'))
      if (r1.ok) {
        const count = r1.data.mappings?.length || 0
        this.set(this.storageChecks, 0, { name: 'Storage Zone — File List', detail: `พบ ${count} ไฟล์ใน Bunny Storage`, status: 'PASS', latency: r1.latency })
        this.set(this.storageChecks, 1, { name: 'Video-PDF Mapping', detail: `${count} video มี PDF`, status: 'PASS', latency: r1.latency })
      } else {
        this.set(this.storageChecks, 0, { name: 'Storage Zone — File List', detail: r1.msg, status: 'FAIL', latency: r1.latency })
        this.set(this.storageChecks, 1, { name: 'Video-PDF Mapping', detail: r1.msg, status: 'FAIL', latency: r1.latency })
      }

      // 4b. PDF download logs
      const r2 = await this.measure(() => api.get('/admin/pdf-logs?limit=1'))
      if (r2.ok) {
        const total = r2.data.total || r2.data.logs?.length || 0
        this.set(this.storageChecks, 2, { name: 'PDF Download Logs', detail: `ระบบ log ทำงานปกติ (${total} records)`, status: 'PASS', latency: r2.latency })
      } else {
        this.set(this.storageChecks, 2, { name: 'PDF Download Logs', detail: r2.msg, status: 'FAIL', latency: r2.latency })
      }
    },

    // ─── 5. LMS APIs ───
    async checkLmsApis() {
      const endpoints = [
        { idx: 0, name: 'Passport — รายการลงทะเบียน', url: '/admin/passport', count: d => d.registrations?.length },
        { idx: 1, name: 'Packages — รายการคอร์ส', url: '/admin/packages', count: d => d.packages?.length },
        { idx: 2, name: 'Activations — การเปิดสิทธิ์', url: '/admin/activations', count: d => d.activations?.length },
        { idx: 3, name: 'Sections — วีดีโอ', url: '/admin/sections', count: d => d.sections?.length },
        { idx: 4, name: 'Courses — หน้าขาย', url: '/admin/courses', count: d => d.courses?.length },
        { idx: 5, name: 'Viewers — ผู้ชมออนไลน์', url: '/admin/viewers', count: d => d.viewers?.length },
        { idx: 6, name: 'Anomaly Report', url: '/admin/anomaly-report', count: d => d.reports?.length || d.anomalies?.length },
        { idx: 7, name: 'Client Logs', url: '/admin/client-logs', count: d => d.logs?.length },
        { idx: 8, name: 'Watermark Config', url: '/admin/watermark', count: () => null },
        { idx: 9, name: 'Live Sessions', url: '/admin/live', count: d => d.sessions?.length },
        { idx: 10, name: 'Demo Config', url: '/admin/demo/config', count: () => null }
      ]

      await Promise.allSettled(endpoints.map(async ep => {
        const r = await this.measure(() => api.get(ep.url))
        if (r.ok) {
          const c = ep.count(r.data)
          const detail = c !== null && c !== undefined ? `ตอบกลับปกติ (${c} รายการ)` : 'ตอบกลับปกติ'
          this.set(this.lmsApiChecks, ep.idx, { name: ep.name, detail, status: 'PASS', latency: r.latency })
        } else {
          this.set(this.lmsApiChecks, ep.idx, { name: ep.name, detail: r.msg, status: 'FAIL', latency: r.latency })
        }
      }))
    },

    // ─── 5.5 PDF Watermark Service ───
    async checkPdfService() {
      const r = await this.measure(() => api.get('/admin/pdf-service/health'))
      if (r.ok && r.data.ok) {
        this.set(this.pdfServiceChecks, 0, {
          name: 'PDF Service — เชื่อมต่อ',
          detail: `ตอบกลับใน ${r.data.latency || r.latency}ms — ${r.data.url || ''}`,
          status: 'PASS', latency: r.latency
        })
        const ram = r.data.ram
        const ramPct = ram ? parseInt(ram.percent) : 0
        this.set(this.pdfServiceChecks, 1, {
          name: 'PDF Service — RAM',
          detail: ram ? `${ram.usedMB} MB / ${ram.totalMB} MB (${ram.percent})` : 'ไม่มีข้อมูล',
          status: ramPct < 80 ? 'PASS' : 'WARN', latency: r.latency
        })
        this.set(this.pdfServiceChecks, 2, {
          name: 'PDF Service — Queue',
          detail: `Active: ${r.data.active} / Waiting: ${r.data.waiting} / Max: ${r.data.max}`,
          status: r.data.waiting > 0 ? 'WARN' : 'PASS', latency: r.latency
        })
      } else {
        const msg = r.data?.message || r.msg || 'ไม่สามารถเชื่อมต่อ'
        const notSet = msg.includes('not set')
        this.set(this.pdfServiceChecks, 0, { name: 'PDF Service — เชื่อมต่อ', detail: msg, status: notSet ? 'WARN' : 'FAIL', latency: r.latency })
        this.set(this.pdfServiceChecks, 1, { name: 'PDF Service — RAM', detail: '-', status: notSet ? 'WARN' : 'FAIL' })
        this.set(this.pdfServiceChecks, 2, { name: 'PDF Service — Queue', detail: '-', status: notSet ? 'WARN' : 'FAIL' })
      }
    },

    // ─── PDF Service Test ───
    async testWatermark() {
      if (!this.testFileName || this.testRunning) return
      this.testRunning = true
      this.testResult = null
      this.testProgress = 'ส่งงาน...'

      try {
        // 1. ส่งงาน
        const submitResp = await api.post('/admin/pdf-service/test-watermark', { fileName: this.testFileName })
        const jobId = submitResp.jobId
        this.testProgress = `Job #${jobId} — เริ่มทำ...`

        // 2. Poll สถานะ
        const result = await new Promise((resolve, reject) => {
          const poll = setInterval(async () => {
            try {
              const sd = await api.get(`/admin/pdf-service/status/${jobId}`)
              this.testProgress = `${sd.statusText} ${sd.percent}%`
              if (sd.status === 'done') { clearInterval(poll); resolve(jobId) }
              else if (sd.status === 'error') { clearInterval(poll); reject(new Error(sd.statusText)) }
            } catch (e) { clearInterval(poll); reject(e) }
          }, 1000)
        })

        // 3. ดาวน์โหลด
        this.testProgress = 'ดาวน์โหลด...'
        const blob = await api.get(`/admin/pdf-service/download/${result}`, { responseType: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `test_${this.testFileName}`
        a.click()
        URL.revokeObjectURL(url)

        this.testResult = { ok: true, message: `สำเร็จ! ${(blob.size / 1024).toFixed(0)} KB` }
      } catch (err) {
        this.testResult = { ok: false, message: err.message || 'ผิดพลาด' }
      } finally {
        this.testRunning = false
        this.testProgress = ''
      }
    },

    // ─── 6. Realtime & Version ───
    async checkRealtime() {
      // 6a. Backend version
      const r1 = await this.measure(() => api.get('/version'))
      if (r1.ok) {
        this.set(this.realtimeChecks, 0, { name: 'Backend Version', detail: `Build: ${r1.data.version}`, status: 'PASS', latency: r1.latency })
      } else {
        this.set(this.realtimeChecks, 0, { name: 'Backend Version', detail: r1.msg, status: 'FAIL', latency: r1.latency })
      }

      // 6b. Frontend version
      const scriptEl = document.querySelector('script[src*="index-"]')
      const feHash = scriptEl?.src?.match(/index-([^.]+)/)?.[1] || 'unknown'
      this.set(this.realtimeChecks, 1, { name: 'Frontend Version', detail: `Build: ${feHash}`, status: feHash !== 'unknown' ? 'PASS' : 'WARN' })

      // 6c. Visitor analytics
      const r3 = await this.measure(() => api.get('/admin/visitors/stats?days=1'))
      if (r3.ok) {
        const today = r3.data.totalVisits || 0
        this.set(this.realtimeChecks, 2, { name: 'Visitor Analytics API', detail: `วันนี้ ${today} visits`, status: 'PASS', latency: r3.latency })
      } else {
        this.set(this.realtimeChecks, 2, { name: 'Visitor Analytics API', detail: r3.msg, status: 'FAIL', latency: r3.latency })
      }
    }
  }
}
</script>

<style scoped>
.health-check {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* Header */
.hc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.hc-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #64748b;
  transition: all 0.15s;
}
.hc-back:hover { background: #f1f5f9; color: #0f172a; }
.hc-back svg { width: 18px; height: 18px; }
.hc-header h1 {
  flex: 1;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.hc-run-btn {
  padding: 8px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.hc-run-btn:hover:not(:disabled) { background: #2563eb; }
.hc-run-btn:disabled { opacity: 0.6; cursor: default; }

/* Summary */
.hc-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.hc-summary-pass { background: #f0fdf4; border: 1px solid #bbf7d0; }
.hc-summary-fail { background: #fef2f2; border: 1px solid #fecaca; }
.hc-summary-warn { background: #fffbeb; border: 1px solid #fde68a; }
.hc-summary-icon { flex-shrink: 0; }
.hc-summary-icon svg { width: 40px; height: 40px; }
.hc-summary-pass .hc-summary-icon { color: #22c55e; }
.hc-summary-fail .hc-summary-icon { color: #ef4444; }
.hc-summary-warn .hc-summary-icon { color: #f59e0b; }
.hc-summary h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.hc-summary p { font-size: 13px; color: #64748b; }

/* Sections */
.hc-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hc-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.hc-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.hc-section-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hc-section-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.hc-section-count {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
}
.hc-count-pass { background: #dcfce7; color: #15803d; }
.hc-count-fail { background: #fee2e2; color: #dc2626; }
.hc-count-warn { background: #fef3c7; color: #d97706; }
.hc-count-pending { background: #f1f5f9; color: #64748b; }

/* Individual checks */
.hc-checks { padding: 4px 0; }
.hc-check {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.hc-check:last-child { border-bottom: none; }

.hc-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.hc-pass .hc-status-dot { background: #22c55e; }
.hc-fail .hc-status-dot { background: #ef4444; }
.hc-warn .hc-status-dot { background: #f59e0b; }
.hc-pending .hc-status-dot { background: #94a3b8; animation: pulse 1s ease infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.hc-check-info {
  flex: 1;
  min-width: 0;
}
.hc-check-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 1px;
}
.hc-check-detail {
  font-size: 12px;
  color: #64748b;
  display: block;
  word-break: break-word;
}
.hc-latency {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.hc-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.hc-pass .hc-badge { background: #dcfce7; color: #15803d; }
.hc-fail .hc-badge { background: #fee2e2; color: #dc2626; }
.hc-warn .hc-badge { background: #fef3c7; color: #d97706; }
.hc-pending .hc-badge { background: #f1f5f9; color: #64748b; }

/* Responsive */
@media (max-width: 640px) {
  .hc-header h1 { font-size: 16px; }
  .hc-check { padding: 10px 14px; }
}
</style>
