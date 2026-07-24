<template>
  <Teleport to="body">
    <div v-if="show && !skipped" class="orient-overlay" @click.self="handleClose">
      <div class="orient-modal">
        <!-- HEADER -->
        <div class="orient-header">
          <div class="orient-header-left">
            <div class="orient-icon">🎬</div>
            <div>
              <div class="orient-title">ปฐมนิเทศคอร์ส</div>
              <div class="orient-sub">{{ packageTitle }}</div>
            </div>
          </div>
          <button class="orient-close" @click="handleClose" title="ปิด (ต้องกลับมาดูใหม่ตอนเข้าคอร์สอีกครั้ง)">×</button>
        </div>

        <!-- BODY -->
        <div class="orient-body">
          <p class="orient-intro">
            กรุณาดูวิดีโอปฐมนิเทศให้จบก่อนถึงจะยอมรับเข้าคอร์สได้
          </p>

          <!-- LOADING -->
          <div v-if="loading" class="orient-loading">
            <div class="orient-spinner"></div>
            <div>กำลังโหลดวิดีโอ...</div>
          </div>

          <!-- ERROR -->
          <div v-else-if="loadError" class="orient-error">
            ⚠️ โหลดวิดีโอไม่สำเร็จ: {{ loadError }}
            <button class="orient-retry" @click="fetchOrient">ลองใหม่</button>
          </div>

          <!-- PLAYER: BUNNY -->
          <div v-else-if="source === 'bunny' && embedUrl" class="orient-video-wrap">
            <iframe
              ref="playerFrame"
              :src="embedUrl"
              class="orient-video"
              allow="autoplay; encrypted-media; fullscreen"
              allowfullscreen
            ></iframe>
          </div>

          <!-- PLAYER: ALI (Passport-only, placeholder — mount AliPlayer.vue เมื่อ implement) -->
          <div v-else-if="source === 'ali' && aliVideoId" class="orient-video-wrap orient-ali-placeholder">
            <div>
              <div style="font-size:14px;font-weight:800;margin-bottom:8px;">🎯 Ali Player</div>
              <div style="font-size:12px;color:#94a3b8;">Video ID: {{ aliVideoId }}</div>
              <div style="font-size:11px;color:#64748b;margin-top:8px;">Ali player integration พร้อมใช้ใน Passport session ถัดไป</div>
            </div>
          </div>

          <!-- PROGRESS -->
          <div v-if="!loading && !loadError" class="orient-progress">
            <div class="orient-progress-bar">
              <div class="orient-progress-fill" :style="{ width: percent + '%' }"></div>
            </div>
            <div class="orient-progress-text">
              <span v-if="completed">✅ ดูจบแล้ว — พร้อมยอมรับเข้าคอร์ส</span>
              <span v-else>{{ percent }}% (ต้องดูอย่างน้อย {{ Math.round(threshold * 100) }}%)</span>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="orient-actions">
          <button
            class="orient-btn orient-btn-primary"
            :disabled="!completed || accepting"
            @click="handleAccept"
          >
            <template v-if="accepting">กำลังบันทึก...</template>
            <template v-else-if="!completed">🔒 ยอมรับเข้าคอร์ส (ต้องดูจบก่อน)</template>
            <template v-else>✅ ยอมรับเข้าคอร์ส</template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import api from '../services/api'

export default {
  name: 'OrientModal',
  props: {
    show: { type: Boolean, default: false },
    activationId: { type: String, default: '' }
  },
  emits: ['close', 'accepted'],
  data() {
    return {
      loading: false,
      loadError: '',
      skipped: false,
      completed: false,
      packageTitle: '',
      embedUrl: '',
      videoId: '',
      aliVideoId: '',
      source: 'bunny',   // 'bunny' | 'ali'
      watchedSeconds: 0,
      durationSeconds: 0,
      threshold: 0.95,
      accepting: false,
      pollTimer: null,
      variant: 'drm'
    }
  },
  computed: {
    percent() {
      if (this.completed) return 100
      if (!this.durationSeconds) return 0
      return Math.min(100, Math.round((this.watchedSeconds / this.durationSeconds) * 100))
    }
  },
  watch: {
    show(v) {
      if (v && this.activationId) this.fetchOrient()
      else this.cleanup()
    }
  },
  methods: {
    detectVariant() {
      const ua = navigator.userAgent || ''
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
      const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|EdgiOS/.test(ua)
      // Passport: iOS/Safari → prefer ali (universal); Desktop → drm (Bunny)
      if (isIOS || isSafari) return 'ali'
      return 'drm'
    },
    async fetchOrient() {
      this.loading = true
      this.loadError = ''
      this.variant = this.detectVariant()
      try {
        const { data } = await api.get(`/my/orient/${this.activationId}`, {
          params: { variant: this.variant }
        })
        this.skipped = !!data.skipped
        this.completed = !!data.completed
        this.packageTitle = data.packageTitle || ''
        this.embedUrl = data.embedUrl || ''
        this.aliVideoId = data.aliVideoId || ''
        this.source = data.source || 'bunny'
        this.videoId = data.videoId || ''
        this.watchedSeconds = data.watchedSeconds || 0
        this.durationSeconds = data.durationSeconds || 0
        this.threshold = data.threshold || 0.95

        if (this.skipped) {
          this.$emit('accepted')
          return
        }
        if (this.completed) {
          this.$emit('accepted')
          return
        }

        // เริ่ม poll iframe player state
        this.startPolling()
      } catch (e) {
        this.loadError = e?.response?.data?.message || e.message || 'ไม่ทราบสาเหตุ'
      } finally {
        this.loading = false
      }
    },
    startPolling() {
      this.cleanup()
      // ยิง heartbeat ทุก 10 วิ ผ่าน playerjs (Bunny mediadelivery iframe)
      let playerReady = false
      let player = null
      const load = () => {
        if (!window.playerjs) {
          const s = document.createElement('script')
          s.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js'
          s.onload = init
          document.head.appendChild(s)
        } else init()
      }
      const init = () => {
        try {
          const frame = this.$refs.playerFrame
          if (!frame) return
          player = new window.playerjs.Player(frame)
          player.on('ready', () => {
            playerReady = true
            player.getDuration(d => { if (d > 0) this.durationSeconds = d })
          })
          player.on('timeupdate', ({ seconds, duration }) => {
            if (duration > 0) this.durationSeconds = duration
            // Anti-skip: หากเลื่อนไกลเกิน watched+15 → เด้งกลับ
            if (seconds > this.watchedSeconds + 15) {
              player.setCurrentTime(this.watchedSeconds)
              return
            }
            if (seconds > this.watchedSeconds) this.watchedSeconds = seconds
          })
          player.on('ended', () => this.sendComplete())
        } catch (e) {
          console.warn('[Orient] playerjs init error:', e)
        }
      }
      load()

      // Heartbeat ทุก 10 วิ
      this.pollTimer = setInterval(() => {
        if (!playerReady || !player) return
        player.getCurrentTime(t => {
          player.getDuration(d => {
            this.sendHeartbeat(t, d)
          })
        })
      }, 10000)
    },
    async sendHeartbeat(position, duration) {
      try {
        const { data } = await api.post(`/my/orient/${this.activationId}/heartbeat`, {
          position, duration
        })
        if (data.completed) this.completed = true
        if (typeof data.watchedSeconds === 'number') this.watchedSeconds = data.watchedSeconds
      } catch (_) {}
    },
    async sendComplete() {
      try {
        const { data } = await api.post(`/my/orient/${this.activationId}/complete`, {})
        if (data.ok) this.completed = true
      } catch (e) {
        // ยังไม่ครบ — ปล่อยให้ heartbeat ต่อไป
      }
    },
    async handleAccept() {
      if (!this.completed || this.accepting) return
      this.accepting = true
      try {
        // ยิง accept consent (reuse endpoint เดิม)
        await api.post('/my/consent/accept', { activationId: this.activationId })
        this.$emit('accepted')
      } catch (e) {
        alert(e?.response?.data?.message || 'บันทึกไม่สำเร็จ')
      } finally {
        this.accepting = false
      }
    },
    handleClose() {
      this.$emit('close')
    },
    cleanup() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    }
  },
  beforeUnmount() { this.cleanup() }
}
</script>

<style scoped>
.orient-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.orient-modal {
  background: #fff;
  border-radius: 12px;
  max-width: 720px; width: 100%;
  max-height: 92vh;
  display: flex; flex-direction: column;
  border: 1.5px solid #0f172a;
  box-shadow: 4px 4px 0 #0f172a;
  overflow: hidden;
}

.orient-header {
  background: #003580;
  color: #fff;
  padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1.5px solid #0f172a;
}
.orient-header-left { display: flex; align-items: center; gap: 12px; }
.orient-icon { font-size: 26px; }
.orient-title { font-weight: 900; font-size: 16px; }
.orient-sub { font-size: 12px; color: #cbd5e1; margin-top: 2px; }
.orient-close {
  background: transparent; border: 0; color: #fff;
  font-size: 26px; line-height: 1; cursor: pointer;
  padding: 4px 10px; border-radius: 6px;
}
.orient-close:hover { background: rgba(255, 255, 255, 0.12); }

.orient-body {
  padding: 18px 20px;
  overflow-y: auto;
  flex: 1;
}
.orient-intro {
  margin: 0 0 12px;
  color: #475569;
  font-size: 13px;
  text-align: center;
}

.orient-loading, .orient-error {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.orient-error { color: #d70015; }
.orient-spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #003580;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg) } }
.orient-retry {
  display: inline-block; margin-top: 10px;
  padding: 6px 16px;
  background: #003580; color: #fff;
  border: 0; border-radius: 6px;
  cursor: pointer; font-size: 13px;
}

.orient-video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #0f172a;
}
.orient-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  border: 0;
}
.orient-ali-placeholder {
  display: flex; align-items: center; justify-content: center;
  color: #cbd5e1; text-align: center; padding: 20px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.orient-progress {
  margin-top: 14px;
}
.orient-progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}
.orient-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0071c2, #003580);
  transition: width 0.5s ease;
}
.orient-progress-text {
  margin-top: 6px;
  font-size: 12px;
  text-align: center;
  color: #64748b;
  font-weight: 700;
}

.orient-actions {
  padding: 14px 20px;
  border-top: 1.5px solid #e2e8f0;
  background: #f8fafc;
}
.orient-btn {
  width: 100%;
  padding: 14px 20px;
  border: 1.5px solid #0f172a;
  border-radius: 8px;
  font-weight: 800; font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.orient-btn:disabled {
  opacity: 0.55; cursor: not-allowed;
}
.orient-btn-primary {
  background: #008009; color: #fff;
  box-shadow: 2px 2px 0 #0f172a;
}
.orient-btn-primary:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #0f172a;
}
.orient-btn-primary:disabled {
  background: #94a3b8;
  box-shadow: none;
}

@media (max-width: 640px) {
  .orient-modal { max-height: 96vh; }
  .orient-header { padding: 12px 16px; }
  .orient-body { padding: 14px 16px; }
  .orient-actions { padding: 12px 16px; }
}
</style>
