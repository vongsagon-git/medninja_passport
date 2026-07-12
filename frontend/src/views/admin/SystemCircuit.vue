<template>
  <div class="sc-page">
    <!-- Header -->
    <div class="sc-header">
      <div class="sc-header-inner">
        <div class="sc-header-icon">⚡</div>
        <div>
          <h1>System Circuit</h1>
          <p>Video delivery circuit — เลือก Serv (Bunny/Ali) + UI (Thai/Chinese) แยกอิสระ</p>
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
        <!-- 4-BREAKER CIRCUIT PANEL                     -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="circuit-panel">
          <div class="circuit-title">
            <span class="live-dot" :class="{ active: !anySwitching }"></span>
            <span>Circuit Board</span>
            <span class="circuit-info">
              4 breakers · 2 routes × (Serv + UI)
            </span>
          </div>

          <!-- 2 ROUTE COLUMNS -->
          <div class="routes-grid">
            <!-- ============ ROUTE: /my/* (Global) ============ -->
            <div class="route-column">
              <div class="route-header">
                <div class="route-icon">🌐</div>
                <div>
                  <div class="route-label">/my/watch/*</div>
                  <div class="route-sub">Global route</div>
                </div>
              </div>

              <!-- SERV breaker -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot"></span>
                  SERV (Player/CDN)
                </div>
                <div class="breaker-switches">
                  <button
                    class="sw"
                    :class="{ 'sw-on-bunny': config.globalVideoMode === 'bunny' }"
                    :disabled="switching === 'globalVideoMode' || config.globalVideoMode === 'bunny'"
                    @click="requestSwitch('globalVideoMode', 'bunny')"
                  >
                    <div class="sw-tick"></div>
                    <span>BUNNY</span>
                  </button>
                  <button
                    class="sw"
                    :class="{ 'sw-on-ali': config.globalVideoMode === 'ali' }"
                    :disabled="switching === 'globalVideoMode' || config.globalVideoMode === 'ali'"
                    @click="requestSwitch('globalVideoMode', 'ali')"
                  >
                    <div class="sw-tick"></div>
                    <span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.globalVideoMode === 'bunny' ? 'Bunny CDN' : 'Alibaba VOD' }}
                </div>
              </div>

              <!-- UI breaker -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot ui-dot"></span>
                  UI (Region)
                </div>
                <div class="breaker-switches">
                  <button
                    class="sw"
                    :class="{ 'sw-on-th': config.globalUiMode === 'global' }"
                    :disabled="switching === 'globalUiMode' || config.globalUiMode === 'global'"
                    @click="requestSwitch('globalUiMode', 'global')"
                  >
                    <div class="sw-tick"></div>
                    <span>🇹🇭 TH</span>
                  </button>
                  <button
                    class="sw"
                    :class="{ 'sw-on-cn': config.globalUiMode === 'cn' }"
                    :disabled="switching === 'globalUiMode' || config.globalUiMode === 'cn'"
                    @click="requestSwitch('globalUiMode', 'cn')"
                  >
                    <div class="sw-tick"></div>
                    <span>🇨🇳 CN</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.globalUiMode === 'global' ? 'Thai + LINE' : 'Chinese + WeChat' }}
                </div>
              </div>

              <!-- Combined summary -->
              <div class="route-summary">
                <span class="badge-mini" :class="'badge-' + config.globalVideoMode">
                  {{ config.globalVideoMode === 'bunny' ? '🐰 BUNNY' : '🇨🇳 ALI' }}
                </span>
                <span>+</span>
                <span class="badge-mini" :class="'badge-ui-' + config.globalUiMode">
                  {{ config.globalUiMode === 'global' ? '💚 LINE' : '💬 WeChat' }}
                </span>
              </div>
            </div>

            <!-- ============ ROUTE: /my-cn/* (China) ============ -->
            <div class="route-column">
              <div class="route-header">
                <div class="route-icon">🇨🇳</div>
                <div>
                  <div class="route-label">/my-cn/watch/*</div>
                  <div class="route-sub">China route</div>
                </div>
              </div>

              <!-- SERV breaker -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot"></span>
                  SERV (Player/CDN)
                </div>
                <div class="breaker-switches">
                  <button
                    class="sw"
                    :class="{ 'sw-on-bunny': config.cnVideoMode === 'bunny' }"
                    :disabled="switching === 'cnVideoMode' || config.cnVideoMode === 'bunny'"
                    @click="requestSwitch('cnVideoMode', 'bunny')"
                  >
                    <div class="sw-tick"></div>
                    <span>BUNNY</span>
                  </button>
                  <button
                    class="sw"
                    :class="{ 'sw-on-ali': config.cnVideoMode === 'ali' }"
                    :disabled="switching === 'cnVideoMode' || config.cnVideoMode === 'ali'"
                    @click="requestSwitch('cnVideoMode', 'ali')"
                  >
                    <div class="sw-tick"></div>
                    <span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.cnVideoMode === 'bunny' ? 'Bunny CDN ⚠️' : 'Alibaba VOD' }}
                </div>
              </div>

              <!-- UI breaker -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot ui-dot"></span>
                  UI (Region)
                </div>
                <div class="breaker-switches">
                  <button
                    class="sw"
                    :class="{ 'sw-on-th': config.cnUiMode === 'global' }"
                    :disabled="switching === 'cnUiMode' || config.cnUiMode === 'global'"
                    @click="requestSwitch('cnUiMode', 'global')"
                  >
                    <div class="sw-tick"></div>
                    <span>🇹🇭 TH</span>
                  </button>
                  <button
                    class="sw"
                    :class="{ 'sw-on-cn': config.cnUiMode === 'cn' }"
                    :disabled="switching === 'cnUiMode' || config.cnUiMode === 'cn'"
                    @click="requestSwitch('cnUiMode', 'cn')"
                  >
                    <div class="sw-tick"></div>
                    <span>🇨🇳 CN</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.cnUiMode === 'global' ? 'Thai + LINE' : 'Chinese + WeChat' }}
                </div>
              </div>

              <!-- Combined summary -->
              <div class="route-summary">
                <span class="badge-mini" :class="'badge-' + config.cnVideoMode">
                  {{ config.cnVideoMode === 'bunny' ? '🐰 BUNNY' : '🇨🇳 ALI' }}
                </span>
                <span>+</span>
                <span class="badge-mini" :class="'badge-ui-' + config.cnUiMode">
                  {{ config.cnUiMode === 'global' ? '💚 LINE' : '💬 WeChat' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Last Updated</span>
              <span class="meta-value">{{ formatTime(updatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Circuits</span>
              <span class="meta-value">4 breakers (2 routes × 2 dimensions)</span>
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
            ถ้าอยาก <strong>บังคับ apply ทันที</strong> → กด "Kick All Viewers"
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
          <h3>💡 4-breaker system อธิบาย</h3>
          <ul>
            <li><strong>SERV = Player/CDN</strong> — เลือกว่าจะ serve ผ่าน Bunny หรือ Alibaba VOD</li>
            <li><strong>UI = Region</strong> — เลือก UI: TH (Thai + LINE) หรือ CN (Chinese + WeChat)</li>
            <li>แต่ละ route (/my/* กับ /my-cn/*) มี SERV + UI แยกกัน</li>
            <li>Combine ได้ 4 แบบต่อ route → ยืดหยุ่นสุด (test / fallback / migration)</li>
            <li>Video ไหนไม่มี ID สำหรับ mode ที่เลือก → user เจอ "รออัพโหลด" placeholder</li>
          </ul>
        </div>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Confirm Modal                                -->
    <!-- ═══════════════════════════════════════════ -->
    <div v-if="pendingChange" class="modal-overlay" @click.self="cancelSwitch">
      <div class="modal-card">
        <div class="modal-icon">⚡</div>
        <h2>ยืนยันสลับ Circuit?</h2>
        <p>
          <strong>{{ describeField(pendingChange.field) }}</strong>
          → <strong>{{ describeValue(pendingChange.field, pendingChange.value) }}</strong>
        </p>
        <p class="modal-hint">
          User ที่ดู video อยู่จะยังใช้ mode เดิมจนกว่าจะออกจากหน้า
          <br>ต้องกด Kick All ถ้าอยาก force ทันที
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="cancelSwitch">ยกเลิก</button>
          <button class="btn btn-primary" :disabled="!!switching" @click="confirmSwitch">
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
      switching: null,   // field name หรือ null
      kicking: false,
      config: {
        globalVideoMode: 'bunny',
        cnVideoMode:     'ali',
        globalUiMode:    'global',
        cnUiMode:        'cn'
      },
      updatedAt: null,
      pendingChange: null,   // { field, value }
      kickResult: null
    }
  },
  computed: {
    anySwitching() {
      return !!this.switching
    }
  },
  async mounted() {
    await this.fetchConfig()
  },
  methods: {
    async fetchConfig() {
      this.loading = true
      try {
        const data = await api.get('/system/video-mode')
        this.config = {
          globalVideoMode: data.globalMode || 'bunny',
          cnVideoMode:     data.cnMode || 'ali',
          globalUiMode:    data.globalUi || 'global',
          cnUiMode:        data.cnUi || 'cn'
        }
        this.updatedAt = data.updatedAt
      } catch (e) {
        console.error('[SystemCircuit] fetch failed:', e.message)
      } finally {
        this.loading = false
      }
    },
    requestSwitch(field, value) {
      if (this.config[field] === value) return
      this.pendingChange = { field, value }
      this.kickResult = null
    },
    cancelSwitch() {
      this.pendingChange = null
    },
    async confirmSwitch() {
      if (!this.pendingChange) return
      const { field, value } = this.pendingChange
      this.switching = field
      try {
        const data = await api.patch('/admin/system/video-mode', { field, value })
        if (data.config) {
          this.config = data.config
        } else {
          this.config[field] = value
        }
        this.updatedAt = data.updatedAt
        this.pendingChange = null
      } catch (e) {
        alert('สลับ Circuit ไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      } finally {
        this.switching = null
      }
    },
    describeField(field) {
      const map = {
        globalVideoMode: '/my/* SERV',
        cnVideoMode:     '/my-cn/* SERV',
        globalUiMode:    '/my/* UI',
        cnUiMode:        '/my-cn/* UI'
      }
      return map[field] || field
    },
    describeValue(field, value) {
      if (field.endsWith('VideoMode')) return value === 'bunny' ? 'Bunny CDN' : 'Alibaba VOD'
      if (field.endsWith('UiMode'))    return value === 'global' ? 'Thai + LINE' : 'Chinese + WeChat'
      return value
    },
    async kickAll() {
      if (!confirm('ยืนยัน kick user ทุกคน? — user ที่ดูอยู่จะโดน logout')) return
      this.kicking = true
      this.kickResult = null
      try {
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
          this.kickResult = { ok: true, msg: `✓ Kicked ${data.count || 'all'} viewers` }
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
  max-width: 1200px;
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
  max-width: 1200px;
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
@keyframes spin { to { transform: rotate(360deg); } }

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
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.circuit-info {
  margin-left: auto;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

/* 2-column layout — Global | CN */
.routes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.route-column {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 14px;
  padding: 20px;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 16px;
}
.route-icon {
  font-size: 32px;
}
.route-label {
  font-size: 14px;
  font-weight: 800;
  color: #f0f9ff;
  font-family: 'Consolas', 'Monaco', monospace;
}
.route-sub {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 2px;
}

/* Breaker (2 per route) */
.breaker {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(100, 116, 139, 0.25);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}
.breaker-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: rgba(148, 163, 184, 0.95);
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}
.breaker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
}
.breaker-dot.ui-dot {
  background: #a855f7;
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.6);
}

.breaker-switches {
  display: flex;
  gap: 6px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  padding: 6px;
  margin-bottom: 8px;
}
.sw {
  flex: 1;
  padding: 10px 6px;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(100, 116, 139, 0.25);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sw:hover:not(:disabled) {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.08);
  color: #dbeafe;
}
.sw:disabled { cursor: default; }
.sw-tick {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.4);
}
.sw.sw-on-bunny {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #6ee7b7;
  color: #fff;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.35);
}
.sw.sw-on-ali {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #fbbf24;
  color: #fff;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
}
.sw.sw-on-th {
  background: linear-gradient(135deg, #3b82f6, #0284c7);
  border-color: #60a5fa;
  color: #fff;
  box-shadow: 0 0 14px rgba(59, 130, 246, 0.35);
}
.sw.sw-on-cn {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border-color: #f87171;
  color: #fff;
  box-shadow: 0 0 14px rgba(220, 38, 38, 0.35);
}
.sw.sw-on-bunny .sw-tick,
.sw.sw-on-ali .sw-tick,
.sw.sw-on-th .sw-tick,
.sw.sw-on-cn .sw-tick {
  background: #fff;
  box-shadow: 0 0 4px #fff;
}

.breaker-caption {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
  text-align: center;
  font-weight: 600;
}

/* Route summary — combined badges */
.route-summary {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}
.badge-mini {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}
.badge-bunny { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
.badge-ali   { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.badge-ui-global { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); }
.badge-ui-cn     { background: rgba(220, 38, 38, 0.15); color: #fca5a5; border: 1px solid rgba(220, 38, 38, 0.4); }

/* Meta row */
.meta-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

/* Actions Panel */
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
.btn-kick:disabled { opacity: 0.6; cursor: default; }
.kick-result {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}
.kick-ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.kick-fail { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Help Panel */
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

/* Modal */
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
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
@media (max-width: 900px) {
  .routes-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .sc-container { padding: 0 12px; }
  .circuit-panel { padding: 20px 16px; }
  .meta-row { grid-template-columns: 1fr; }
  .sw { padding: 8px 4px; font-size: 11px; }
}
</style>
