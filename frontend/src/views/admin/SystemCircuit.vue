<template>
  <div class="sc-page">
    <!-- Header -->
    <div class="sc-header">
      <div class="sc-header-inner">
        <div class="sc-header-icon">⚡</div>
        <div>
          <h1>System Circuit</h1>
          <p>Video delivery circuit — switch source เผื่อ CDN ล้ม</p>
        </div>
      </div>
    </div>

    <div class="sc-container">
      <!-- Loading -->
      <div v-if="loading" class="sc-loading">
        <div class="spinner"></div>
        <p>กำลังโหลดสถานะ Circuit...</p>
      </div>

      <template v-else>
        <!-- ═══════════════════════════════════════════ -->
        <!-- CIRCUIT DIAGRAM — Electrical Style          -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="circuit-panel">
          <div class="circuit-title">
            <span class="live-dot" :class="{ active: !switching }"></span>
            <span>Live Circuit Diagram</span>
            <span class="mode-badge" :class="'mode-' + currentMode">
              {{ currentMode === 'bunny' ? 'BN MODE' : 'ALI MODE' }}
            </span>
          </div>

          <div class="circuit-board">
            <!-- Row 1: Input labels -->
            <div class="node-row row-input">
              <div class="node node-input">
                <div class="node-icon">🌐</div>
                <div class="node-label">Global User<br>(non-CN)</div>
              </div>
              <div class="node node-input node-locked">
                <div class="node-icon">🇨🇳</div>
                <div class="node-label">China User<br>(locked)</div>
              </div>
            </div>

            <!-- Wire down -->
            <div class="wire-row">
              <div class="wire-v" :class="{ 'wire-active': true }"></div>
              <div class="wire-v" :class="{ 'wire-active': true }"></div>
            </div>

            <!-- Row 2: Circuit Breakers (SWITCH) -->
            <div class="node-row row-switch">
              <!-- Global switch — clickable -->
              <div class="breaker" :class="'breaker-' + currentMode">
                <div class="breaker-label">GLOBAL CIRCUIT</div>
                <div class="breaker-body">
                  <button
                    class="switch-btn"
                    :class="{ 'switch-on-bunny': currentMode === 'bunny' }"
                    :disabled="switching || currentMode === 'bunny'"
                    @click="requestSwitch('bunny')"
                    title="Route to Bunny CDN (default)"
                  >
                    <div class="switch-tick"></div>
                    <span>BN</span>
                  </button>
                  <div class="switch-divider"></div>
                  <button
                    class="switch-btn"
                    :class="{ 'switch-on-ali': currentMode === 'ali' }"
                    :disabled="switching || currentMode === 'ali'"
                    @click="requestSwitch('ali')"
                    title="Route to Alibaba VOD (fallback)"
                  >
                    <div class="switch-tick"></div>
                    <span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  <span v-if="currentMode === 'bunny'">→ Bunny CDN</span>
                  <span v-else>→ Alibaba VOD (fallback)</span>
                </div>
              </div>

              <!-- China locked switch -->
              <div class="breaker breaker-locked">
                <div class="breaker-label">CHINA CIRCUIT</div>
                <div class="breaker-body">
                  <div class="lock-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    <span>LOCKED</span>
                  </div>
                </div>
                <div class="breaker-caption">→ Alibaba VOD only</div>
              </div>
            </div>

            <!-- Wire down -->
            <div class="wire-row">
              <div class="wire-v" :class="{ 'wire-active': currentMode === 'bunny' }"></div>
              <div class="wire-v wire-active"></div>
            </div>

            <!-- Row 3: Ali wire from Global (alt path) -->
            <div v-if="currentMode === 'ali'" class="wire-diagonal-container">
              <svg class="wire-diagonal" viewBox="0 0 200 40" preserveAspectRatio="none">
                <path d="M50 0 Q 100 20, 150 40" stroke="url(#gradAli)" stroke-width="3" fill="none" />
                <defs>
                  <linearGradient id="gradAli">
                    <stop offset="0%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <!-- Row 4: Output CDN -->
            <div class="node-row row-output">
              <div
                class="node node-cdn node-bunny"
                :class="{ 'node-active': currentMode === 'bunny', 'node-dim': currentMode === 'ali' }"
              >
                <div class="node-icon">🐰</div>
                <div class="node-label">Bunny CDN<br><small>bunny-global</small></div>
                <div class="node-status">
                  <span v-if="currentMode === 'bunny'" class="status-badge active">ACTIVE</span>
                  <span v-else class="status-badge idle">STANDBY</span>
                </div>
              </div>

              <div class="node node-cdn node-ali" :class="{ 'node-active': true }">
                <div class="node-icon">🇨🇳</div>
                <div class="node-label">Alibaba VOD<br><small>ali-sg</small></div>
                <div class="node-status">
                  <span class="status-badge active">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Current Mode</span>
              <span class="meta-value">{{ currentMode === 'bunny' ? 'BN (Bunny)' : 'ALI (Alibaba)' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Last Updated</span>
              <span class="meta-value">{{ formatTime(updatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Scope</span>
              <span class="meta-value">/my/watch/* (Global only)</span>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════ -->
        <!-- Actions Panel                                -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="actions-panel">
          <h2>Post-Switch Actions</h2>
          <p class="actions-hint">
            User ที่ดู video อยู่ตอนสลับ mode — จะยังใช้ mode เดิมจนกว่าจะออกจากหน้า
            <br>
            ถ้าอยาก <strong>บังคับ apply ทันที</strong> → กด "Kick All Viewers" — user โดน logout → login ใหม่ → เข้า watch → mode ใหม่ทำงาน
          </p>

          <button class="btn btn-kick" :disabled="kicking" @click="kickAll">
            <span v-if="kicking">กำลัง kick...</span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
              Kick All Viewers (Force reload)
            </span>
          </button>

          <p v-if="kickResult" class="kick-result" :class="{ 'kick-ok': kickResult.ok, 'kick-fail': !kickResult.ok }">
            {{ kickResult.msg }}
          </p>
        </div>

        <!-- ═══════════════════════════════════════════ -->
        <!-- Help / Legend                                -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="help-panel">
          <h3>💡 เมื่อไหร่ควรกดสลับ?</h3>
          <ul>
            <li><strong>BN MODE (default):</strong> Bunny CDN ทำงานปกติ — user Global เจอ Bunny video</li>
            <li><strong>ALI MODE:</strong> Bunny ล้ม / เปลี่ยน policy / ปิด NoDRM tier → สลับให้ user Global ใช้ Alibaba (ต้อง upload aliVideoId ครบก่อน)</li>
            <li>Video ไหนไม่มี <code>aliVideoId</code> → user เห็น "รออัพโหลด" placeholder</li>
            <li>China route (<code>/my-cn/*</code>) ไม่กระทบ — บังคับ Alibaba ตลอด</li>
          </ul>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Confirm Modal                                -->
    <!-- ═══════════════════════════════════════════ -->
    <div v-if="pendingMode" class="modal-overlay" @click.self="cancelSwitch">
      <div class="modal-card">
        <div class="modal-icon">⚡</div>
        <h2>ยืนยันสลับ Circuit?</h2>
        <p>
          Global users ทั้งหมดจะ route ไปที่:
          <strong>{{ pendingMode === 'bunny' ? 'Bunny CDN (BN MODE)' : 'Alibaba VOD (ALI MODE)' }}</strong>
        </p>
        <p class="modal-hint">
          <strong>User ที่ดู video อยู่จะยังใช้ mode เดิม</strong> จนกว่าจะออกจากหน้า
          <br>ต้องกด Kick All ถ้าอยาก force ทันที
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="cancelSwitch">ยกเลิก</button>
          <button class="btn btn-primary" :disabled="switching" @click="confirmSwitch">
            {{ switching ? 'กำลังสลับ...' : 'ยืนยัน' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'SystemCircuit',
  data() {
    return {
      loading: true,
      switching: false,
      kicking: false,
      currentMode: 'bunny',
      updatedAt: null,
      pendingMode: null,
      kickResult: null
    }
  },
  async mounted() {
    await this.fetchMode()
  },
  methods: {
    async fetchMode() {
      this.loading = true
      try {
        const data = await api.get('/system/video-mode')
        this.currentMode = data.mode || 'bunny'
        this.updatedAt = data.updatedAt
      } catch (e) {
        console.error('[SystemCircuit] fetch failed:', e.message)
      } finally {
        this.loading = false
      }
    },
    requestSwitch(mode) {
      if (mode === this.currentMode) return
      this.pendingMode = mode
      this.kickResult = null
    },
    cancelSwitch() {
      this.pendingMode = null
    },
    async confirmSwitch() {
      const mode = this.pendingMode
      if (!mode) return
      this.switching = true
      try {
        const data = await api.patch('/admin/system/video-mode', { mode })
        this.currentMode = data.mode
        this.updatedAt = data.updatedAt
        this.pendingMode = null
      } catch (e) {
        alert('สลับ Circuit ไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      } finally {
        this.switching = false
      }
    },
    async kickAll() {
      if (!confirm('ยืนยัน kick user ทุกคน? — user ที่ดูอยู่จะโดน logout')) return
      this.kicking = true
      this.kickResult = null
      try {
        // reuse existing kick-all endpoint (goes through ws.medninja.academy relay)
        const wsUrl = 'https://ws.medninja.academy/api/admin/viewers/kick-all'
        const token = localStorage.getItem('token')
        const res = await fetch(wsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          this.kickResult = { ok: true, msg: `✓ Kicked ${data.count || 'all'} viewers — พวกเขาจะโดน redirect ทันที` }
        } else {
          this.kickResult = { ok: false, msg: '✗ ' + (data.message || 'Kick failed') }
        }
      } catch (e) {
        this.kickResult = { ok: false, msg: '✗ Network error: ' + e.message }
      } finally {
        this.kicking = false
      }
    },
    formatTime(iso) {
      if (!iso) return 'ไม่ทราบ'
      const d = new Date(iso)
      return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    }
  }
}
</script>

<style scoped>
.sc-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 40px;
}

.sc-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  color: #e0f2fe;
  padding: 32px 0;
}
.sc-header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.sc-header-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
}
.sc-header h1 {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
  color: #f0f9ff;
}
.sc-header p {
  font-size: 14px;
  color: rgba(224, 242, 254, 0.7);
  margin: 0;
}

.sc-container {
  max-width: 1080px;
  margin: -20px auto 0;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.sc-loading {
  background: #fff;
  padding: 60px;
  border-radius: 16px;
  text-align: center;
  color: #64748b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ══════════════════════════════════════════════════ */
/*   Circuit Diagram Panel                            */
/* ══════════════════════════════════════════════════ */
.circuit-panel {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.circuit-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}
.live-dot.active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.mode-badge {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.mode-badge.mode-bunny {
  background: #dbeafe;
  color: #1e40af;
  border: 1.5px solid #93c5fd;
}
.mode-badge.mode-ali {
  background: #fef3c7;
  color: #92400e;
  border: 1.5px solid #fcd34d;
}

.circuit-board {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 12px;
  padding: 32px 24px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
}

.node-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  position: relative;
}

.node {
  background: rgba(15, 23, 42, 0.6);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s;
}
.node-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.node-label {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.03em;
  line-height: 1.4;
}
.node-label small {
  font-size: 10px;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.7);
  letter-spacing: 0;
}

.node-input {
  background: rgba(30, 41, 59, 0.5);
}

.node-locked {
  opacity: 0.6;
}

.node-cdn.node-active {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}
.node-cdn.node-active .node-label {
  color: #d1fae5;
}
.node-cdn.node-dim {
  opacity: 0.4;
}

.node-status {
  margin-top: 8px;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.status-badge.active {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.status-badge.idle {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.4);
}

/* Wire lines */
.wire-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  height: 40px;
  margin: 8px 0;
}
.wire-v {
  width: 3px;
  margin: 0 auto;
  background: rgba(100, 116, 139, 0.4);
  height: 100%;
  border-radius: 3px;
}
.wire-v.wire-active {
  background: linear-gradient(180deg, #10b981, #34d399);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  animation: wireFlow 1.5s linear infinite;
}
@keyframes wireFlow {
  0% { background-position: 0 0; }
  100% { background-position: 0 20px; }
}

.wire-diagonal-container {
  height: 40px;
  margin-top: -20px;
  padding: 0 20px;
}
.wire-diagonal {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.5));
}

/* Circuit Breakers (switches) */
.breaker {
  background: rgba(30, 41, 59, 0.7);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 20px 16px;
  transition: all 0.3s;
}
.breaker-label {
  font-size: 11px;
  font-weight: 800;
  color: rgba(148, 163, 184, 0.9);
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  text-align: center;
}
.breaker-body {
  display: flex;
  align-items: stretch;
  gap: 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 12px;
}
.switch-btn {
  flex: 1;
  padding: 12px 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 2px solid rgba(100, 116, 139, 0.3);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}
.switch-btn:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.1);
  color: #dbeafe;
}
.switch-btn:disabled {
  cursor: default;
}
.switch-tick {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.4);
}
.switch-btn.switch-on-bunny {
  background: linear-gradient(135deg, #3b82f6, #0284c7);
  border-color: #60a5fa;
  color: #fff;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}
.switch-btn.switch-on-bunny .switch-tick {
  background: #fff;
  box-shadow: 0 0 6px #fff;
}
.switch-btn.switch-on-ali {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fbbf24;
  color: #fff;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}
.switch-btn.switch-on-ali .switch-tick {
  background: #fff;
  box-shadow: 0 0 6px #fff;
}
.switch-divider {
  width: 2px;
  background: rgba(100, 116, 139, 0.3);
  align-self: stretch;
}

.breaker-caption {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
  text-align: center;
  font-weight: 600;
}

.breaker-locked {
  opacity: 0.7;
}
.lock-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #f59e0b;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.08em;
}

/* Meta row */
.meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.meta-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

/* ══════════════════════════════════════════════════ */
/*   Actions Panel                                    */
/* ══════════════════════════════════════════════════ */
.actions-panel {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.actions-panel h2 {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
}
.actions-hint {
  font-size: 13px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 20px;
}
.btn-kick {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  border: none;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
}
.btn-kick:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(239, 68, 68, 0.4);
}
.btn-kick:disabled {
  opacity: 0.6;
  cursor: default;
}
.kick-result {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}
.kick-ok {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.kick-fail {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* ══════════════════════════════════════════════════ */
/*   Help Panel                                       */
/* ══════════════════════════════════════════════════ */
.help-panel {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 20px 24px;
}
.help-panel h3 {
  font-size: 15px;
  font-weight: 800;
  color: #1e40af;
  margin: 0 0 12px;
}
.help-panel ul {
  margin: 0;
  padding-left: 20px;
  color: #1e3a8a;
  font-size: 13px;
  line-height: 1.8;
}
.help-panel code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

/* ══════════════════════════════════════════════════ */
/*   Modal                                            */
/* ══════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  max-width: 460px;
  width: 100%;
  text-align: center;
  animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-icon {
  font-size: 42px;
  margin-bottom: 12px;
}
.modal-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
}
.modal-card p {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 12px;
}
.modal-hint {
  font-size: 13px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 16px 0;
  text-align: left;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.15s;
}
.btn:disabled { opacity: 0.6; cursor: default; }
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #0284c7);
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.btn-outline {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}
.btn-outline:hover { background: #e2e8f0; }

/* Responsive */
@media (max-width: 640px) {
  .sc-container { padding: 0 12px; }
  .circuit-panel { padding: 20px 16px; }
  .circuit-board { padding: 20px 12px; }
  .node-row { grid-template-columns: 1fr; gap: 20px; }
  .wire-row { grid-template-columns: 1fr; }
  .meta-row { grid-template-columns: 1fr; }
  .switch-btn { padding: 10px 6px; font-size: 12px; }
}
</style>
