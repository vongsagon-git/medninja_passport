<template>
  <div class="sc-page">
    <!-- Header -->
    <div class="sc-header">
      <div class="sc-header-inner">
        <div class="sc-header-icon">⚡</div>
        <div>
          <h1>System Circuit</h1>
          <p>IP BASE — เลือก SERV + Browser Allow ต่อกลุ่ม IP (TH / CN / Other)</p>
        </div>
      </div>
    </div>

    <div class="sc-container">
      <div v-if="loading" class="sc-loading">
        <div class="spinner"></div>
        <p>กำลังโหลด...</p>
      </div>

      <template v-else>
        <div class="circuit-panel">
          <div class="circuit-title">
            <span class="live-dot" :class="{ active: !anySwitching }"></span>
            <span>IP BASE Circuit Board</span>
            <span class="circuit-info">3 groups × (SERV + Browser Allow)</span>
          </div>

          <div class="routes-grid">
            <!-- ═══ TH USERS ═══ -->
            <div class="route-column">
              <div class="route-header">
                <div class="route-icon">🇹🇭</div>
                <div>
                  <div class="route-label">IP BASE TH</div>
                  <div class="route-sub">country = TH</div>
                </div>
              </div>

              <!-- SERV -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot"></span> SERV (Player/CDN)
                </div>
                <div class="breaker-switches">
                  <button class="sw" :class="{ 'sw-on-bunny': config.ipBaseThVideoMode === 'bunny' }"
                    :disabled="switching === 'ipBaseThVideoMode' || config.ipBaseThVideoMode === 'bunny'"
                    @click="requestSwitch('ipBaseThVideoMode', 'bunny')">
                    <div class="sw-tick"></div><span>BUNNY</span>
                  </button>
                  <button class="sw" :class="{ 'sw-on-ali': config.ipBaseThVideoMode === 'ali' }"
                    :disabled="switching === 'ipBaseThVideoMode' || config.ipBaseThVideoMode === 'ali'"
                    @click="requestSwitch('ipBaseThVideoMode', 'ali')">
                    <div class="sw-tick"></div><span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.ipBaseThVideoMode === 'bunny' ? 'Bunny CDN' : 'Alibaba VOD' }}
                </div>
              </div>

              <!-- Browser Allow -->
              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot browser-dot"></span> Browser Allow
                </div>
                <div class="browser-checks">
                  <label v-for="b in browserOptions" :key="'th-'+b" class="browser-check">
                    <input type="checkbox"
                      :checked="(config.ipBaseThAllowedBrowsers || []).includes(b)"
                      :disabled="switching === 'ipBaseThAllowedBrowsers'"
                      @change="toggleBrowser('ipBaseThAllowedBrowsers', b, $event.target.checked)" />
                    <span>{{ b }}</span>
                  </label>
                </div>
                <div class="breaker-caption">
                  → {{ (config.ipBaseThAllowedBrowsers || []).length }}/6 browsers
                </div>
              </div>
            </div>

            <!-- ═══ CN USERS ═══ -->
            <div class="route-column">
              <div class="route-header">
                <div class="route-icon">🇨🇳</div>
                <div>
                  <div class="route-label">IP BASE CN</div>
                  <div class="route-sub">country = CN</div>
                </div>
              </div>

              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot"></span> SERV (Player/CDN)
                </div>
                <div class="breaker-switches">
                  <button class="sw" :class="{ 'sw-on-bunny': config.ipBaseCnVideoMode === 'bunny' }"
                    :disabled="switching === 'ipBaseCnVideoMode' || config.ipBaseCnVideoMode === 'bunny'"
                    @click="requestSwitch('ipBaseCnVideoMode', 'bunny')">
                    <div class="sw-tick"></div><span>BUNNY</span>
                  </button>
                  <button class="sw" :class="{ 'sw-on-ali': config.ipBaseCnVideoMode === 'ali' }"
                    :disabled="switching === 'ipBaseCnVideoMode' || config.ipBaseCnVideoMode === 'ali'"
                    @click="requestSwitch('ipBaseCnVideoMode', 'ali')">
                    <div class="sw-tick"></div><span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.ipBaseCnVideoMode === 'bunny' ? 'Bunny CDN ⚠️' : 'Alibaba VOD' }}
                </div>
              </div>

              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot browser-dot"></span> Browser Allow
                </div>
                <div class="browser-checks">
                  <label v-for="b in browserOptions" :key="'cn-'+b" class="browser-check">
                    <input type="checkbox"
                      :checked="(config.ipBaseCnAllowedBrowsers || []).includes(b)"
                      :disabled="switching === 'ipBaseCnAllowedBrowsers'"
                      @change="toggleBrowser('ipBaseCnAllowedBrowsers', b, $event.target.checked)" />
                    <span>{{ b }}</span>
                  </label>
                </div>
                <div class="breaker-caption">
                  → {{ (config.ipBaseCnAllowedBrowsers || []).length }}/6 browsers
                </div>
              </div>
            </div>

            <!-- ═══ OTHER USERS ═══ -->
            <div class="route-column">
              <div class="route-header">
                <div class="route-icon">🌏</div>
                <div>
                  <div class="route-label">IP BASE OTHER</div>
                  <div class="route-sub">country ≠ TH, CN</div>
                </div>
              </div>

              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot"></span> SERV (Player/CDN)
                </div>
                <div class="breaker-switches">
                  <button class="sw" :class="{ 'sw-on-bunny': config.ipBaseOtherVideoMode === 'bunny' }"
                    :disabled="switching === 'ipBaseOtherVideoMode' || config.ipBaseOtherVideoMode === 'bunny'"
                    @click="requestSwitch('ipBaseOtherVideoMode', 'bunny')">
                    <div class="sw-tick"></div><span>BUNNY</span>
                  </button>
                  <button class="sw" :class="{ 'sw-on-ali': config.ipBaseOtherVideoMode === 'ali' }"
                    :disabled="switching === 'ipBaseOtherVideoMode' || config.ipBaseOtherVideoMode === 'ali'"
                    @click="requestSwitch('ipBaseOtherVideoMode', 'ali')">
                    <div class="sw-tick"></div><span>ALI</span>
                  </button>
                </div>
                <div class="breaker-caption">
                  → {{ config.ipBaseOtherVideoMode === 'bunny' ? 'Bunny CDN' : 'Alibaba VOD' }}
                </div>
              </div>

              <div class="breaker">
                <div class="breaker-title">
                  <span class="breaker-dot browser-dot"></span> Browser Allow
                </div>
                <div class="browser-checks">
                  <label v-for="b in browserOptions" :key="'ot-'+b" class="browser-check">
                    <input type="checkbox"
                      :checked="(config.ipBaseOtherAllowedBrowsers || []).includes(b)"
                      :disabled="switching === 'ipBaseOtherAllowedBrowsers'"
                      @change="toggleBrowser('ipBaseOtherAllowedBrowsers', b, $event.target.checked)" />
                    <span>{{ b }}</span>
                  </label>
                </div>
                <div class="breaker-caption">
                  → {{ (config.ipBaseOtherAllowedBrowsers || []).length }}/6 browsers
                </div>
              </div>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item">
              <span class="meta-label">Last Updated</span>
              <span class="meta-value">{{ formatTime(updatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Controls</span>
              <span class="meta-value">3 groups × (1 SERV + 6 browsers)</span>
            </div>
          </div>
        </div>

        <!-- Kick All -->
        <div class="actions-panel">
          <h2>Post-Switch Actions</h2>
          <p class="actions-hint">
            User ที่ดู video อยู่ตอนสลับ mode จะยังใช้ mode เดิมจนออกจากหน้า
            <br>ถ้าอยากบังคับ apply → กด Kick All
          </p>
          <button class="btn btn-kick" :disabled="kicking" @click="kickAll">
            <span v-if="kicking">กำลัง kick...</span>
            <span v-else>Kick All Viewers</span>
          </button>
          <p v-if="kickResult" class="kick-result" :class="{ 'kick-ok': kickResult.ok, 'kick-fail': !kickResult.ok }">
            {{ kickResult.msg }}
          </p>
        </div>

        <div class="help-panel">
          <h3>💡 IP BASE Circuit อธิบาย</h3>
          <ul>
            <li><strong>SERV</strong> — เลือก Player/CDN (Bunny หรือ Ali) แยกต่อกลุ่ม IP</li>
            <li><strong>Browser Allow</strong> — เลือก browser ที่อนุญาตให้เล่น (ถ้าไม่อนุญาต → block screen)</li>
            <li>User ในไทย (IP=TH) → ใช้ config <code>IP BASE TH</code></li>
            <li>User ในจีน (IP=CN) → ใช้ config <code>IP BASE CN</code></li>
            <li>User ต่างประเทศ (US/JP/EU/...) → ใช้ config <code>IP BASE OTHER</code></li>
          </ul>
        </div>
      </template>
    </div>

    <!-- Confirm Modal (SERV only, browser toggle instant) -->
    <div v-if="pendingChange" class="modal-overlay" @click.self="cancelSwitch">
      <div class="modal-card">
        <div class="modal-icon">⚡</div>
        <h2>ยืนยันสลับ Circuit?</h2>
        <p>
          <strong>{{ describeField(pendingChange.field) }}</strong>
          → <strong>{{ describeValue(pendingChange.field, pendingChange.value) }}</strong>
        </p>
        <p class="modal-hint">
          User ที่ดู video อยู่จะใช้ mode เดิมจนออกจากหน้า
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
      switching: null,
      kicking: false,
      browserOptions: ['Chrome', 'Safari', 'Firefox', 'Edge', 'In-App', 'Others'],
      config: {
        ipBaseThVideoMode:    'bunny',
        ipBaseCnVideoMode:    'ali',
        ipBaseOtherVideoMode: 'bunny',
        ipBaseThAllowedBrowsers:    ['Chrome', 'Safari', 'Firefox', 'Edge'],
        ipBaseCnAllowedBrowsers:    ['Chrome'],
        ipBaseOtherAllowedBrowsers: ['Chrome', 'Safari', 'Firefox', 'Edge']
      },
      updatedAt: null,
      pendingChange: null,
      kickResult: null
    }
  },
  computed: {
    anySwitching() { return !!this.switching }
  },
  async mounted() { await this.fetchConfig() },
  methods: {
    async fetchConfig() {
      this.loading = true
      try {
        const data = await api.get('/system/video-mode')
        this.config = {
          ipBaseThVideoMode:    data.ipBaseThVideoMode    || 'bunny',
          ipBaseCnVideoMode:    data.ipBaseCnVideoMode    || 'ali',
          ipBaseOtherVideoMode: data.ipBaseOtherVideoMode || 'bunny',
          ipBaseThAllowedBrowsers:    data.ipBaseThAllowedBrowsers    || ['Chrome', 'Safari', 'Firefox', 'Edge'],
          ipBaseCnAllowedBrowsers:    data.ipBaseCnAllowedBrowsers    || ['Chrome'],
          ipBaseOtherAllowedBrowsers: data.ipBaseOtherAllowedBrowsers || ['Chrome', 'Safari', 'Firefox', 'Edge']
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
    cancelSwitch() { this.pendingChange = null },
    async confirmSwitch() {
      if (!this.pendingChange) return
      const { field, value } = this.pendingChange
      this.switching = field
      try {
        const data = await api.patch('/admin/system/video-mode', { field, value })
        if (data.config) this.config = { ...this.config, ...data.config }
        else this.config[field] = value
        this.updatedAt = data.updatedAt
        this.pendingChange = null
      } catch (e) {
        alert('สลับ Circuit ไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      } finally {
        this.switching = null
      }
    },
    // ⭐ Browser toggle — instant apply (ไม่ต้อง confirm)
    async toggleBrowser(field, browser, checked) {
      const current = this.config[field] || []
      const updated = checked
        ? [...current, browser]
        : current.filter(b => b !== browser)
      if (updated.length === 0) {
        alert('ต้องเลือกอย่างน้อย 1 browser')
        return
      }
      this.switching = field
      try {
        const data = await api.patch('/admin/system/video-mode', { field, value: updated })
        if (data.config) this.config = { ...this.config, ...data.config }
        else this.config[field] = updated
        this.updatedAt = data.updatedAt
      } catch (e) {
        alert('อัพเดท browser allow ไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      } finally {
        this.switching = null
      }
    },
    describeField(field) {
      const map = {
        ipBaseThVideoMode:    'IP BASE TH SERV',
        ipBaseCnVideoMode:    'IP BASE CN SERV',
        ipBaseOtherVideoMode: 'IP BASE OTHER SERV'
      }
      return map[field] || field
    },
    describeValue(field, value) {
      if (field.endsWith('VideoMode')) return value === 'bunny' ? 'Bunny CDN' : 'Alibaba VOD'
      return value
    },
    async kickAll() {
      if (!confirm('ยืนยัน kick user ทุกคน?')) return
      this.kicking = true
      this.kickResult = null
      try {
        const wsUrl = 'https://ws.medninja.academy/api/admin/viewers/kick-all'
        const token = localStorage.getItem('token')
        const res = await fetch(wsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
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
      return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    }
  }
}
</script>

<style scoped>
.sc-page { min-height: 100vh; background: #f8fafc; padding-bottom: 40px; }
.sc-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #e0f2fe; padding: 32px 0; }
.sc-header-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 20px; }
.sc-header-icon { font-size: 48px; filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5)); }
.sc-header h1 { font-size: 26px; font-weight: 800; margin: 0 0 4px; color: #f0f9ff; }
.sc-header p { font-size: 14px; color: rgba(224, 242, 254, 0.7); margin: 0; }

.sc-container { max-width: 1400px; margin: -20px auto 0; padding: 0 24px; position: relative; z-index: 1; }
.sc-loading { background: #fff; padding: 60px; border-radius: 16px; text-align: center; color: #64748b; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.circuit-panel { background: #fff; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
.circuit-title { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 24px; letter-spacing: 0.03em; text-transform: uppercase; }
.live-dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; }
.live-dot.active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.circuit-info { margin-left: auto; font-size: 12px; color: #64748b; font-weight: 500; text-transform: none; }

.routes-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

.route-column { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 14px; padding: 18px; }
.route-header { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); margin-bottom: 14px; }
.route-icon { font-size: 28px; }
.route-label { font-size: 13px; font-weight: 800; color: #f0f9ff; font-family: 'Consolas', 'Monaco', monospace; }
.route-sub { font-size: 10px; color: rgba(148, 163, 184, 0.9); letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }

.breaker { background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(100, 116, 139, 0.25); border-radius: 10px; padding: 12px; margin-bottom: 10px; }
.breaker-title { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; color: rgba(148, 163, 184, 0.95); letter-spacing: 0.08em; margin-bottom: 10px; }
.breaker-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.6); }
.breaker-dot.browser-dot { background: #a855f7; box-shadow: 0 0 6px rgba(168, 85, 247, 0.6); }

.breaker-switches { display: flex; gap: 6px; background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 6px; margin-bottom: 8px; }
.sw { flex: 1; padding: 8px 6px; background: rgba(30, 41, 59, 0.5); border: 1.5px solid rgba(100, 116, 139, 0.25); border-radius: 6px; color: #94a3b8; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.sw:hover:not(:disabled) { border-color: rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.08); color: #dbeafe; }
.sw:disabled { cursor: default; }
.sw-tick { width: 6px; height: 6px; border-radius: 50%; background: rgba(100, 116, 139, 0.4); }
.sw.sw-on-bunny { background: linear-gradient(135deg, #10b981, #059669); border-color: #6ee7b7; color: #fff; box-shadow: 0 0 14px rgba(16, 185, 129, 0.35); }
.sw.sw-on-ali   { background: linear-gradient(135deg, #f59e0b, #d97706); border-color: #fbbf24; color: #fff; box-shadow: 0 0 14px rgba(245, 158, 11, 0.35); }
.sw.sw-on-bunny .sw-tick, .sw.sw-on-ali .sw-tick { background: #fff; box-shadow: 0 0 4px #fff; }

.breaker-caption { font-size: 11px; color: rgba(148, 163, 184, 0.9); text-align: center; font-weight: 600; }

/* Browser checkboxes */
.browser-checks { display: flex; flex-direction: column; gap: 6px; background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 8px; margin-bottom: 8px; }
.browser-check { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 4px; cursor: pointer; transition: background 0.15s; }
.browser-check:hover { background: rgba(59, 130, 246, 0.1); }
.browser-check input { cursor: pointer; accent-color: #3b82f6; }
.browser-check span { font-size: 12px; color: #cbd5e1; font-weight: 600; }

.meta-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px; padding-top: 18px; border-top: 1px solid #e2e8f0; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.meta-value { font-size: 13px; color: #0f172a; font-weight: 600; }

.actions-panel { background: #fff; border-radius: 16px; padding: 28px; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
.actions-panel h2 { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
.actions-hint { font-size: 13px; color: #64748b; line-height: 1.7; margin: 0 0 20px; }
.btn-kick { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; border: none; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3); }
.btn-kick:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(239, 68, 68, 0.4); }
.btn-kick:disabled { opacity: 0.6; cursor: default; }
.kick-result { margin-top: 14px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.kick-ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.kick-fail { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.help-panel { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px 24px; }
.help-panel h3 { font-size: 15px; font-weight: 800; color: #1e40af; margin: 0 0 12px; }
.help-panel ul { margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 13px; line-height: 1.8; }
.help-panel code { background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #0f172a; border: 1px solid #cbd5e1; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.modal-card { background: #fff; border-radius: 20px; padding: 32px; max-width: 460px; width: 100%; text-align: center; }
.modal-icon { font-size: 42px; margin-bottom: 12px; }
.modal-card h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px; }
.modal-card p { font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 12px; }
.modal-hint { font-size: 13px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 14px; margin: 16px 0; text-align: left; }
.modal-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn { flex: 1; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: transform 0.15s; }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn-primary { background: linear-gradient(135deg, #3b82f6, #0284c7); color: #fff; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.btn-outline { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.btn-outline:hover { background: #e2e8f0; }

@media (max-width: 1024px) {
  .routes-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .sc-container { padding: 0 12px; }
  .circuit-panel { padding: 20px 16px; }
  .meta-row { grid-template-columns: 1fr; }
  .sw { padding: 8px 4px; font-size: 11px; }
}
</style>
