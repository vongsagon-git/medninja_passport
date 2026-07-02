<template>
  <div class="exam-page" @contextmenu.prevent>
    <!-- Replaced overlay (ม่วง) -->
    <div v-if="replaced" class="replaced-overlay">
      <div class="replaced-card">
        <div class="replaced-icon">⚠️</div>
        <p class="replaced-title">มีอุปกรณ์อื่นกำลังใช้งานอยู่</p>
        <div v-if="activeTabInfo" class="replaced-info">
          <p>{{ activeTabInfo.videoTitle || activeTabInfo.sectionName || 'กำลังใช้งาน' }}</p>
          <p>{{ activeTabInfo.os }} · {{ activeTabInfo.browser }}</p>
        </div>
        <p class="replaced-countdown">กลับหน้าเรียนใน {{ replacedCountdown }} วินาที</p>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="exam-container">
      <div class="exam-header">
        <router-link to="/my" class="exam-back">← กลับ</router-link>
        <h1 class="exam-title">DDx Extra</h1>
        <span class="exam-badge">MEQ</span>
      </div>
      <div class="exam-body">
        <div class="coming-soon">
          <div class="cs-icon">🎯</div>
          <h2>เนื้อหากำลังพัฒนา</h2>
          <p>DDx Extra สำหรับ MEQ กำลังเตรียมพร้อม</p>
          <p class="cs-features">• ข้อสอบ MEQ<br>• ดูเฉลยพร้อมอธิบาย<br>• ส่งคำถามหาหมอแตม</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client'
import { WS_URL } from '../utils/shadowSocket'
import { getDeviceContext, sendLog, watchDevTools } from '../services/clientLogger'

export default {
  name: 'DdxAdvance',
  data() {
    return {
      replaced: false,
      activeTabInfo: null,
      replacedCountdown: 60,
      tabId: Math.random().toString(36).slice(2, 10),
      _socket: null,
      _heartbeatInterval: null,
      _countdownInterval: null,
      _heartbeatSent: false,
    }
  },
  mounted() {
    this._initSecurity()
    this._initSocket()
    this._startHeartbeat()
  },
  beforeUnmount() {
    this._cleanup()
  },
  methods: {
    _initSecurity() {
      // Anti-copy
      this._onCopy = (e) => e.preventDefault()
      this._onCut = (e) => e.preventDefault()
      this._onDragStart = (e) => e.preventDefault()
      document.addEventListener('copy', this._onCopy)
      document.addEventListener('cut', this._onCut)
      document.addEventListener('dragstart', this._onDragStart)

      // Keyboard blocking
      this._onKeydown = (e) => {
        if (e.key === 'F12') { e.preventDefault(); return }
        if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) { e.preventDefault(); return }
        if (e.ctrlKey && ['u','U','s','S','p','P'].includes(e.key)) { e.preventDefault(); return }
      }
      document.addEventListener('keydown', this._onKeydown)

      // DevTools detection
      this._cleanupDevTools = watchDevTools(() => {
        if (this._socket?.connected) this._socket.emit('devtools')
        sendLog('devtools', 'เปิด DevTools', { page: 'ddx-advance' })
      })
    },
    _initSocket() {
      const token = localStorage.getItem('token')
      if (!token) return
      this._socket = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'] })

      this._socket.on('connect', () => {
        const ctx = getDeviceContext()
        const data = {
          sectionName: 'DDx Extra',
          videoTitle: 'Full Approach',
          tabId: this.tabId,
          os: ctx.os,
          browser: ctx.browser,
          contentType: 'ddx-advance'
        }
        this._socket.emit('watch:start', data)
      })

      this._socket.on('replaced', (activeTab) => {
        this.replaced = true
        this.activeTabInfo = activeTab
        clearInterval(this._heartbeatInterval)
        this._socket.disconnect()
        this._socket = null
        this.replacedCountdown = 60
        this._countdownInterval = setInterval(() => {
          this.replacedCountdown--
          if (this.replacedCountdown <= 0) this.$router.push('/my')
        }, 1000)
      })

      this._socket.on('kicked', () => {
        this.$router.push('/my')
      })
    },
    async _startHeartbeat() {
      const api = (await import('../services/api')).default
      const send = async () => {
        try {
          const ctx = getDeviceContext()
          const data = await api.post('/my/heartbeat', {
            firstBeat: !this._heartbeatSent || undefined,
            oldTabId: window.name || undefined,
            sectionName: 'DDx Extra',
            videoTitle: 'Full Approach',
            tabId: this.tabId,
            os: ctx.os,
            browser: ctx.browser,
            contentType: 'ddx-advance'
          })
          if (!data.replaced) {
            window.name = this.tabId
            this._heartbeatSent = true
          }
          if (data.replaced) {
            this.replaced = true
            this.activeTabInfo = data.activeTab
            clearInterval(this._heartbeatInterval)
          }
        } catch {}
      }
      await send()
      this._heartbeatInterval = setInterval(send, 10000)
    },
    _cleanup() {
      if (this._socket) { this._socket.disconnect(); this._socket = null }
      clearInterval(this._heartbeatInterval)
      clearInterval(this._countdownInterval)
      document.removeEventListener('copy', this._onCopy)
      document.removeEventListener('cut', this._onCut)
      document.removeEventListener('dragstart', this._onDragStart)
      document.removeEventListener('keydown', this._onKeydown)
      if (this._cleanupDevTools) this._cleanupDevTools()
      // sendBeacon clear heartbeat
      try {
        navigator.sendBeacon('/api/beacon/heartbeat-clear', JSON.stringify({
          token: localStorage.getItem('token')
        }))
      } catch {}
    }
  }
}
</script>

<style scoped>
.exam-page{position:fixed;inset:0;background:#0c111b;color:#e2e8f0;user-select:none;-webkit-user-select:none;touch-action:none;overflow-y:auto}
.exam-container{max-width:800px;margin:0 auto;padding:20px}
.exam-header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.exam-back{color:#94a3b8;text-decoration:none;font-size:13px}
.exam-title{font-size:18px;font-weight:800;color:#fff;flex:1}
.exam-badge{background:#7c3aed;color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:700}

.coming-soon{text-align:center;padding:60px 20px}
.cs-icon{font-size:48px;margin-bottom:12px}
.coming-soon h2{font-size:20px;font-weight:800;color:#fff;margin-bottom:8px}
.coming-soon p{font-size:13px;color:#94a3b8}
.cs-features{margin-top:16px;font-size:12px;color:#64748b;line-height:2}

/* Replaced overlay */
.replaced-overlay{position:fixed;inset:0;background:rgba(88,28,135,.95);display:flex;align-items:center;justify-content:center;z-index:50;backdrop-filter:blur(6px)}
.replaced-card{text-align:center;max-width:360px;padding:32px}
.replaced-icon{font-size:48px;margin-bottom:12px}
.replaced-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:12px}
.replaced-info{background:rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#d8b4fe}
.replaced-countdown{font-size:13px;color:#c4b5fd}
</style>
