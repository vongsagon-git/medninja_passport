<template>
  <div class="my-page">

    <!-- ═══ PASSPORT ═══ -->
    <div class="passport-card">
      <div class="pp-header">
        <div class="pp-header-left">
          <div class="pp-logo">M</div>
          <div>
            <div class="pp-title">MedNinja Global</div>
            <div class="pp-subtitle">Your Medical Education Passport</div>
            <div class="pp-tagline">ดูได้จากทั่วโลกด้วยเทคโนโลยีสตรีมมิ่งเข้ารหัสระดับสตูดิโอ</div>
          </div>
        </div>
        <span class="pp-country">@{{ user?.firstName || 'student' }}</span>
      </div>

      <div class="pp-body">
        <div class="pp-photo">
          <div class="pp-avatar">
            <img v-if="user?.linePictureUrl" :src="user.linePictureUrl" alt="LINE Avatar">
            <div v-else class="pp-avatar-placeholder">{{ initial }}</div>
            <div v-if="user?.lineUserId" class="pp-avatar-line">
              <svg viewBox="0 0 24 24"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            </div>
          </div>
        </div>
        <div class="pp-info">
          <div class="pp-name">{{ fullName }}</div>
          <div class="pp-meta-row">
            <span class="pp-meta-item" v-if="user?.university">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347"/></svg>
              {{ user.university }}
            </span>
            <span class="pp-meta-item" v-if="user?.email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
              {{ user.email }}
            </span>
            <span class="pp-meta-item verified" v-if="user?.lineUserId">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/></svg>
              เชื่อม LINE แล้ว
            </span>
          </div>
        </div>
      </div>

      <div class="pp-stats">
        <div class="pp-stat">
          <div class="v">{{ activeCount }}</div>
          <div class="l">คอร์สที่เปิด</div>
        </div>
        <div class="pp-stat">
          <div class="v">{{ overallProgress }}%</div>
          <div class="l">ความคืบหน้า</div>
        </div>
        <div class="pp-stat">
          <div class="v">{{ availableMiniapps.length }}</div>
          <div class="l">มินิแอป</div>
        </div>
        <div class="pp-stat">
          <div class="v">{{ maxDaysLeft }}</div>
          <div class="l">วันที่เหลือ</div>
        </div>
      </div>
    </div>

    <!-- ═══ LINE LINK GATE ═══ -->
    <div v-if="!user?.lineUserId" class="line-gate">
      <div class="line-gate-icon">
        <svg viewBox="0 0 24 24" fill="#06c755" width="28" height="28"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
      </div>
      <div class="line-gate-text">
        <h3>เชื่อม LINE เพื่อปลดล็อกทุกคอร์ส</h3>
        <p>รับแจ้งเตือนบทเรียนใหม่และตารางสอนทาง LINE</p>
      </div>
      <a :href="liffUrl" class="btn btn-line">เชื่อม LINE</a>
    </div>

    <!-- ═══ MINIAPP ═══ -->
    <template v-if="availableMiniapps.length">
      <div class="section-head">
        <div class="section-title">มินิแอปของคุณ</div>
        <div class="section-sub">{{ availableMiniapps.length }} apps พร้อมใช้</div>
      </div>
      <div class="miniapp-strip">
        <a
          v-for="m in availableMiniapps"
          :key="m.key"
          class="miniapp"
          @click="goHandoff(m.key)"
        >
          <div class="miniapp-icon">{{ m.emoji }}</div>
          <div class="miniapp-name">{{ m.name }}</div>
        </a>
      </div>
    </template>

    <!-- ═══ COURSES ═══ -->
    <div class="section-head">
      <div class="section-title">คอร์สของคุณ</div>
      <div class="section-sub">{{ activeCount }} active</div>
    </div>

    <!-- Loading -->
    <div v-if="activationStore.loading" class="loading-state">
      <div class="skeleton" style="height: 200px; border-radius: 8px;"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!activationStore.activations.length" class="empty-state">
      <p>ยังไม่มี Visa คอร์สเรียน</p>
      <p class="empty-sub">ติดต่อสมัครได้ที่ LINE @medninja</p>
      <a href="https://line.me/R/ti/p/@medninja" target="_blank" class="btn btn-cta">ติดต่อสมัคร</a>
    </div>

    <div v-else class="courses">
      <article
        v-for="act in activationStore.activations"
        :key="act._id"
        class="course"
        :class="{ expired: isExpired(act) }"
      >
        <!-- COVER -->
        <div class="course-cover" :class="coverClass(act)">
          <span class="course-cover-badge" :class="coverBadgeClass(act)">{{ coverBadgeText(act) }}</span>
          <span class="course-cover-pct" v-if="!isExpired(act)">{{ progressPct(act) }}% ดูแล้ว</span>
          <div class="course-cover-title">{{ act.package?.title || 'คอร์ส' }}</div>
        </div>

        <!-- BODY -->
        <div class="course-body">
          <div class="course-title">{{ act.package?.title || 'คอร์ส' }}</div>

          <div class="course-meta">
            <span class="course-meta-item">เปิดใช้ <b>{{ formatDate(act.activatedAt) }}</b></span>
            <span>→</span>
            <span class="course-meta-item">หมดอายุ <b>{{ formatDate(act.expiresAt) }}</b></span>
          </div>

          <div class="course-progress" v-if="!isExpired(act)">
            <div class="course-progress-row">
              <span>ดูแล้ว <b>{{ progressPct(act) }}%</b></span>
              <span>เหลือ <b>{{ daysLeft(act) }} วัน</b></span>
            </div>
            <div class="course-bar"><div class="course-bar-fill" :class="{ live: isLive(act) }" :style="{ width: progressPct(act) + '%' }"></div></div>
          </div>

          <div class="course-actions">
            <!-- LINE ยังไม่เชื่อม -->
            <a v-if="!user?.lineUserId && !isExpired(act)" :href="liffUrl" class="btn btn-line">
              เชื่อม LINE
            </a>

            <!-- รอ consent -->
            <button v-else-if="!isExpired(act) && !activationStore.isConsentAccepted(act._id)" class="btn btn-cta" @click="openOrientModal(act)">
              ยอมรับและเริ่มเรียน
            </button>

            <!-- หมดอายุ -->
            <a v-else-if="isExpired(act)" href="https://line.me/R/ti/p/@medninja" target="_blank" class="btn btn-primary">
              ติดต่อต่ออายุ
            </a>

            <!-- (Live/Q&A ปิดใน passport — ระบบใหม่ไม่มี live) -->
            <template v-else>
              <span></span>
            </template>
          </div>
        </div>

        <!-- SECTIONS -->
        <div
          v-if="!isExpired(act) && user?.lineUserId && activationStore.isConsentAccepted(act._id) && act.package?.sections?.length"
          class="course-sections"
        >
          <div class="course-sections-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            เนื้อหาคอร์ส · {{ act.package.sections.length }} sections
          </div>
          <div class="course-sections-list">
            <router-link
              v-for="sec in act.package.sections"
              :key="sec._id"
              :to="`/my/section/${sec._id}`"
              class="course-sec-link"
            >
              <span class="course-sec-code">{{ sec.name || sec.code }}</span>
              <span class="course-sec-count">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/></svg>
                {{ sec.videoCount ?? sec.videos?.length ?? 0 }} VDO
              </span>
            </router-link>
          </div>
          <button v-if="act.package?.hasOrientVideo" class="orient-reset-link" @click="handleSelfResetOrient(act)" title="ล้าง progress ปฐมนิเทศเพื่อทดสอบ">
            🔄 ดูปฐมนิเทศอีกครั้ง
          </button>
        </div>
      </article>
    </div>

    <!-- ═══ DIAG ═══ -->
    <div style="text-align:center; margin-top: 32px;">
      <router-link to="/diag" class="diag-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3"/></svg>
        ตรวจสอบระบบการรับชมวีดีโอ
      </router-link>
    </div>

    <!-- ═══ ORIENT MODAL (new — bundles orient video + consent) ═══ -->
    <OrientModal
      :show="!!orientActId"
      :activation-id="orientActId"
      @close="orientActId = ''"
      @accepted="handleOrientAccepted"
    />

    <!-- ═══ CONSENT MODAL (legacy fallback — เผื่อ orient skipped) ═══ -->
    <Teleport to="body">
      <div v-if="consentModalAct" class="consent-overlay" @click.self="() => {}">
        <div class="consent-modal">
          <div class="consent-header">
            <img src="/logo.png" alt="MedNinja" class="consent-logo" />
            <div>
              <div class="consent-header-title">ข้อตกลงการใช้งาน</div>
              <div class="consent-header-sub">MedNinja Academy</div>
            </div>
          </div>
          <div class="consent-body">
            <div class="consent-info-card">
              <div class="consent-info-row">
                <span class="consent-info-label">คอร์ส</span>
                <span class="consent-info-value">{{ consentModalAct.package?.title }}</span>
              </div>
              <div class="consent-info-row">
                <span class="consent-info-label">ผู้เรียน</span>
                <span class="consent-info-value">{{ fullName }}</span>
              </div>
            </div>
            <ol class="consent-terms-list">
              <li>สิทธิ์การใช้งานคอร์สนี้เป็นสิทธิ์ <strong>เฉพาะบุคคล</strong> สำหรับผู้ลงทะเบียนเท่านั้น ไม่สามารถโอนหรือมอบสิทธิ์ให้ผู้อื่นได้</li>
              <li>ผู้ใช้งานตกลงที่จะ <strong>ไม่แบ่งปัน ไม่จำหน่าย</strong> และไม่อนุญาตให้บุคคลอื่นเข้าใช้งานบัญชีของตน</li>
              <li>หากตรวจพบการใช้งานร่วมกับผู้อื่น บริษัทขอสงวนสิทธิ์ในการ <strong>ระงับการใช้งาน โดยไม่คืนค่าบริการ</strong></li>
              <li>เนื้อหาทั้งหมดเป็นทรัพย์สินทางปัญญาของบริษัท ได้รับความคุ้มครองตาม <strong>พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537</strong></li>
            </ol>
          </div>
          <div class="consent-actions">
            <button class="btn btn-ghost" @click="consentModalAct = null">ยังไม่ยอมรับ</button>
            <button class="btn btn-cta" @click="doAcceptConsent" :disabled="consentAccepting" style="flex:1;">
              <template v-if="consentAccepting">กำลังบันทึก...</template>
              <template v-else>ยอมรับและเริ่มเรียน</template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useActivationStore } from '../stores/activation'
import api from '../services/api'
import { useCountryGuard } from '../composables/useCountryGuard'
import OrientModal from '../components/OrientModal.vue'

const MINIAPPS = [
  { key: 'synapse', emoji: '🧠', name: 'Synapse' },
  { key: 'atlas',   emoji: '🧭', name: 'Atlas' },
  { key: 'nlex',    emoji: '📋', name: 'NLEX' },
  { key: 'meqex',   emoji: '📝', name: 'MEQEX' },
  { key: 'ddx',     emoji: '🔍', name: 'DDx' },
  { key: 'osce',    emoji: '🩺', name: 'OSCE' },
  { key: 'skill15', emoji: '🔧', name: '15xSKILL' },
  { key: 'longex',  emoji: '📖', name: 'LongEx' }
]

export default {
  name: 'MyDashboard',
  components: { OrientModal },
  data() {
    return {
      liveSessions: [],
      consentModalAct: null,
      consentAccepting: false,
      orientActId: ''
    }
  },
  setup() {
    const authStore = useAuthStore()
    const activationStore = useActivationStore()
    // ⭐ TH guard — logout ถ้า IP เปลี่ยนไป CN
    useCountryGuard('TH')
    return { authStore, activationStore }
  },
  computed: {
    user() { return this.authStore.user },
    fullName() {
      const f = this.user?.firstName || ''
      const l = this.user?.lastName || ''
      return (f + ' ' + l).trim() || this.user?.name || 'ผู้ใช้'
    },
    initial() {
      return (this.user?.firstName?.charAt(0) || this.user?.name?.charAt(0) || 'N').toUpperCase()
    },
    activeList() {
      return this.activationStore.activations.filter(a => !this.isExpired(a))
    },
    activeCount() { return this.activeList.length },
    overallProgress() {
      if (!this.activeList.length) return 0
      const sum = this.activeList.reduce((s, a) => s + this.progressPct(a), 0)
      return Math.round(sum / this.activeList.length)
    },
    maxDaysLeft() {
      if (!this.activeList.length) return 0
      return Math.max(...this.activeList.map(a => this.daysLeft(a)))
    },
    availableMiniapps() {
      const keys = new Set()
      for (const a of this.activeList) {
        if (a.synapseEnabled) keys.add('synapse')
        if (a.atlasEnabled)   keys.add('atlas')
        if (a.nlexEnabled)    keys.add('nlex')
        if (a.meqexEnabled)   keys.add('meqex')
        if (a.ddxEnabled)     keys.add('ddx')
        if (a.osceEnabled)    keys.add('osce')
        if (a.skill15Enabled) keys.add('skill15')
        if (a.longexEnabled)  keys.add('longex')
      }
      return MINIAPPS.filter(m => keys.has(m.key))
    },
    liffUrl() {
      const token = localStorage.getItem('token') || ''
      return `https://liff.line.me/2009259048-jOiOezxi?token=${encodeURIComponent(token)}`
    }
  },
  created() {
    this.activationStore.fetchMyActivations()
    this.activationStore.fetchConsentStatus()
    this.authStore.fetchProfile().catch(() => {})
    // Live disabled ใน passport — ระบบใหม่ไม่มี live
    this._linePoll = setInterval(() => {
      if (!this.user?.lineUserId) this.authStore.fetchProfile().catch(() => {})
      else clearInterval(this._linePoll)
    }, 5000)
  },
  beforeUnmount() {
    if (this._livePoll) clearInterval(this._livePoll)
    if (this._linePoll) clearInterval(this._linePoll)
  },
  methods: {
    // ⭐ Live ปิดใน passport — คืน false เสมอ (core badge/cover ยังใช้ helper นี้อยู่)
    isLive() { return false },
    async goHandoff(target) {
      const urls = {
        synapse: import.meta.env.VITE_SYNAPSE_URL || 'https://synapse.medninja.academy',
        ddx: import.meta.env.VITE_DDX_URL || 'https://ddx.medninja.academy',
        osce: import.meta.env.VITE_OSCE_URL || 'https://osce.medninja.academy',
        nlex: import.meta.env.VITE_NLEX_URL || 'https://nlex.medninja.academy',
        meqex: import.meta.env.VITE_MEQEX_URL || 'https://meqex.medninja.academy',
        atlas: import.meta.env.VITE_ATLAS_URL || 'https://atlas.medninja.academy',
        longex: import.meta.env.VITE_LONGEX_URL || 'https://longex.medninja.academy',
        skill15: import.meta.env.VITE_SKILL15_URL || 'https://15xskill.medninja.academy'
      }
      const base = urls[target]
      if (!base) return
      try {
        const data = await api.post('/auth/handoff/code', { target })
        window.location.href = `${base}/auth/handoff?code=${data.code}`
      } catch {
        alert('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่')
      }
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })
    },
    isExpired(act) { return new Date(act.expiresAt) < new Date() },
    daysLeft(act) {
      const diff = new Date(act.expiresAt) - new Date()
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    },
    progressPct(act) {
      const total = (new Date(act.expiresAt) - new Date(act.activatedAt)) / (1000 * 60 * 60 * 24)
      const used = (new Date() - new Date(act.activatedAt)) / (1000 * 60 * 60 * 24)
      return Math.min(100, Math.max(0, Math.round((used / total) * 100)))
    },
    firstSectionId(act) {
      return act.package?.sections?.[0]?._id || null
    },
    coverClass(act) {
      if (this.isExpired(act)) return 'cover-expired'
      if (this.isLive(act)) return 'cover-live'
      const p = this.progressPct(act)
      if (p >= 85) return 'cover-almost'
      return ''
    },
    coverBadgeClass(act) {
      if (this.isExpired(act)) return 'expired'
      if (this.isLive(act)) return 'live'
      return ''
    },
    coverBadgeText(act) {
      if (this.isExpired(act)) return 'EXPIRED'
      if (!this.user?.lineUserId) return 'NEED LINE'
      if (!this.activationStore.isConsentAccepted(act._id)) return 'PENDING'
      if (this.isLive(act)) return 'LIVE NOW'
      const p = this.progressPct(act)
      if (p >= 85) return 'ALMOST THERE'
      return 'ON SCHEDULE'
    },
    openConsentModal(act) { this.consentModalAct = act },
    async doAcceptConsent() {
      if (!this.consentModalAct || this.consentAccepting) return
      this.consentAccepting = true
      try {
        await this.activationStore.acceptConsent(this.consentModalAct._id)
        this.consentModalAct = null
      } catch (e) {
        alert(e.response?.data?.message || 'เกิดข้อผิดพลาด')
      } finally {
        this.consentAccepting = false
      }
    },
    openOrientModal(act) { this.orientActId = act._id },
    async handleOrientAccepted() {
      if (this.orientActId) {
        if (!this.activationStore.consentAcceptedIds) this.activationStore.consentAcceptedIds = []
        if (!this.activationStore.consentAcceptedIds.includes(this.orientActId)) {
          this.activationStore.consentAcceptedIds.push(this.orientActId)
        }
      }
      this.orientActId = ''
    },
    async handleSelfResetOrient(act) {
      if (!confirm('ต้องการดูปฐมนิเทศอีกครั้งใช่ไหม? (สำหรับทดสอบ)')) return
      try {
        await api.post(`/my/orient/${act._id}/reset`)
        // เปิด modal เลย ไม่ต้องรอกด "ยอมรับ" (เพราะ consent อาจ accept แล้ว)
        this.orientActId = act._id
      } catch (e) {
        alert(e?.response?.data?.message || 'รีเซ็ตไม่สำเร็จ')
      }
    }
  }
}
</script>

<style scoped>
.my-page {
  /* Booking palette */
  --book-navy:#003580;
  --book-blue:#0071c2;
  --book-blue-dark:#005999;
  --book-yellow:#feba02;
  --book-yellow-dark:#e6a700;
  --book-green:#008009;
  --red:#d70015;
  --stroke:#0f172a;

  --ink-900:#0f172a; --ink-800:#1e293b; --ink-700:#334155;
  --ink-500:#64748b; --ink-400:#94a3b8; --ink-300:#cbd5e1;
  --ink-200:#e2e8f0; --ink-100:#f1f5f9; --ink-50:#f8fafc;

  max-width: 760px; margin: 0 auto;
  padding: 24px 16px 80px;
  font-family: 'Sarabun', system-ui, sans-serif;
  color: var(--ink-800);
  -webkit-font-smoothing: antialiased;
  overflow-wrap: anywhere;
}
.my-page * { min-width: 0; }

/* ═══ PASSPORT ═══ */
.passport-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid var(--stroke);
  box-shadow: 3px 3px 0 var(--stroke);
}
.pp-header {
  background: var(--book-navy);
  padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between;
  color: #fff;
  border-bottom: 1.5px solid var(--stroke);
}
.pp-header-left { display: flex; align-items: center; gap: 10px; }
.pp-logo {
  width: 32px; height: 32px;
  background: var(--book-yellow);
  border-radius: 4px;
  border: 1.5px solid var(--stroke);
  display: grid; place-items: center;
  font-weight: 900; color: var(--book-navy); font-size: 16px;
}
.pp-title { color: #fff; font-size: 16px; font-weight: 700; line-height: 1.1; letter-spacing: -0.2px; }
.pp-subtitle { color: rgba(255,255,255,.7); font-size: 11px; font-weight: 500; margin-top: 2px; }
.pp-tagline { color: rgba(96,165,250,.95); font-size: 10.5px; font-weight: 600; margin-top: 4px; letter-spacing: 0.2px; }
.pp-country { color: rgba(255,255,255,.85); font-size: 12px; font-weight: 600; }

.pp-body { display: flex; gap: 16px; padding: 20px; }
.pp-photo { flex-shrink: 0; }
.pp-avatar {
  width: 72px; height: 84px;
  border-radius: 6px;
  overflow: hidden; position: relative;
  background: var(--ink-100);
  border: 1.5px solid var(--stroke);
  box-shadow: 2px 2px 0 var(--stroke);
}
.pp-avatar img { width:100%; height:100%; object-fit: cover; display: block; }
.pp-avatar-placeholder { width: 100%; height: 100%; display: grid; place-items: center; font-size: 28px; font-weight: 800; color: var(--ink-500); }
.pp-avatar-line {
  position:absolute; bottom: -4px; right: -4px;
  width: 22px; height: 22px;
  background: #06c755; border-radius: 4px;
  border: 1.5px solid var(--stroke);
  display: grid; place-items: center;
}
.pp-avatar-line svg { width: 10px; height: 10px; fill: #fff; }

.pp-info { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.pp-name {
  font-size: 18px; font-weight: 800;
  color: var(--ink-900); line-height: 1.2;
  letter-spacing: -0.3px; margin-bottom: 2px;
  word-break: break-word;
}
.pp-meta-row { display: flex; flex-direction: column; gap: 5px; font-size: 13px; color: var(--ink-700); }
.pp-meta-item {
  display: flex; align-items: flex-start; gap: 6px;
  min-width: 0;
  word-break: break-word; overflow-wrap: anywhere;
}
.pp-meta-item svg { color: var(--ink-400); flex-shrink: 0; margin-top: 2px; }
.pp-meta-item.verified { color: var(--book-green); font-weight: 600; }
.pp-meta-item.verified svg { color: var(--book-green); }

.pp-stats {
  display: flex; gap: 0;
  background: var(--ink-50);
  border-top: 1.5px solid var(--stroke);
}
.pp-stat {
  flex: 1; padding: 12px 16px;
  border-right: 1px solid var(--ink-200);
}
.pp-stat:last-child { border-right: none; }
.pp-stat .v { font-size: 18px; font-weight: 800; color: var(--ink-900); line-height: 1; }
.pp-stat .l { font-size: 11px; color: var(--ink-500); font-weight: 500; margin-top: 4px; }

/* LINE GATE */
.line-gate {
  margin-top: 16px;
  background: #f0fdf4;
  border: 1.5px solid var(--stroke);
  box-shadow: 3px 3px 0 var(--stroke);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex; align-items: center; gap: 14px;
}
.line-gate-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(6,199,85,.15);
  display:grid; place-items: center; flex-shrink: 0;
}
.line-gate-text { flex: 1; min-width: 0; }
.line-gate-text h3 { font-size: 14px; font-weight: 800; color: #14532d; margin: 0 0 2px; }
.line-gate-text p { font-size: 12px; color: #166534; margin: 0; }
.btn-line { background: #06c755; color: #fff; }

/* ═══ SECTION HEAD ═══ */
.section-head {
  display: flex; align-items: baseline; gap: 10px;
  margin: 32px 0 14px;
}
.section-title { font-size: 20px; font-weight: 800; color: var(--ink-900); letter-spacing: -0.4px; }
.section-sub { font-size: 14px; color: var(--ink-500); margin-left: auto; }

/* ═══ MINIAPP ═══ */
.miniapp-strip {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.miniapp {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid var(--stroke);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--stroke);
  cursor: pointer; text-decoration: none;
  transition: all .12s;
}
.miniapp:hover {
  background: var(--book-yellow);
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--stroke);
}
.miniapp:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 var(--stroke);
}
.miniapp-icon {
  width: 40px; height: 40px;
  border-radius: 8px;
  background: var(--book-blue);
  color: #fff;
  border: 1.5px solid var(--stroke);
  display: grid; place-items: center;
  font-size: 20px;
  flex-shrink: 0;
}
.miniapp-name {
  font-size: 14px; font-weight: 700;
  color: var(--ink-900); line-height: 1.1;
  letter-spacing: -0.2px;
}

/* ═══ COURSE CARD ═══ */
.courses { display: flex; flex-direction: column; gap: 14px; }

.course {
  background: #fff;
  border: 1.5px solid var(--stroke);
  border-radius: 8px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 220px 1fr;
  box-shadow: 3px 3px 0 var(--stroke);
  transition: all .15s;
}
.course:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--stroke);
}
.course.expired { opacity: 0.65; }

/* COVER */
.course-cover {
  position: relative;
  background: linear-gradient(135deg, var(--book-navy), var(--book-blue));
  overflow: hidden;
  display: flex; align-items: flex-end;
  padding: 14px;
  color: #fff;
  min-height: 160px;
  border-right: 1.5px solid var(--stroke);
}
.course-cover::before {
  content: ''; position: absolute; inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.1) 1px, transparent 1px);
  background-size: 16px 16px;
}
.course-cover.cover-live { background: linear-gradient(135deg, #b91c1c, #ef4444); }
.course-cover.cover-almost { background: linear-gradient(135deg, #065f46, #10b981); }
.course-cover.cover-expired { background: linear-gradient(135deg, #475569, #64748b); }

.course-cover-badge {
  position: absolute; top: 12px; left: 12px;
  background: var(--book-yellow);
  color: var(--ink-900);
  font-size: 11px; font-weight: 800;
  padding: 4px 10px; border-radius: 4px;
  letter-spacing: 0.3px;
  border: 1.5px solid var(--stroke);
  display: inline-flex; align-items: center; gap: 5px;
}
.course-cover-badge.live { background: #d70015; color: #fff; }
.course-cover-badge.live::before { content:''; width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.4s infinite; }
.course-cover-badge.expired { background: #cbd5e1; color: var(--ink-700); }
@keyframes pulse { 50% { opacity: .4; } }

.course-cover-pct {
  position: absolute; top: 12px; right: 12px;
  background: rgba(0,0,0,.6);
  color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: 4px;
  backdrop-filter: blur(4px);
  border: 1.5px solid rgba(255,255,255,.3);
}
.course-cover-title {
  font-size: 16px; font-weight: 800;
  line-height: 1.25;
  text-shadow: 0 2px 6px rgba(0,0,0,.3);
  position: relative; z-index: 1;
}

/* BODY */
.course-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.course-title { font-size: 17px; font-weight: 800; color: var(--ink-900); line-height: 1.25; letter-spacing: -0.3px; }
.course-meta {
  display: flex; flex-wrap: wrap; gap: 4px 12px;
  font-size: 12.5px; color: var(--ink-500);
}
.course-meta-item { display: inline-flex; align-items: center; gap: 4px; }
.course-meta-item b { color: var(--ink-800); font-weight: 700; }
.course-progress { margin-top: 4px; }
.course-progress-row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 12px; color: var(--ink-500);
  margin-bottom: 4px;
}
.course-progress-row b { color: var(--ink-800); font-weight: 700; font-size: 13px; }
.course-bar {
  height: 8px; background: var(--ink-100);
  border-radius: 999px;
  overflow: hidden;
  border: 1.5px solid var(--stroke);
}
.course-bar-fill { height: 100%; background: var(--book-blue); border-radius: 999px; }
.course-bar-fill.live { background: linear-gradient(90deg, #d70015, #ff3d3d); }

.course-actions { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }

/* ═══ BUTTONS — stroke style ═══ */
.btn {
  padding: 10px 18px; border-radius: 6px;
  font-size: 13.5px; font-weight: 800;
  cursor: pointer; text-decoration: none;
  text-align: center; font-family: inherit;
  transition: all .12s;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 1.5px solid var(--stroke);
  box-shadow: 2px 2px 0 var(--stroke);
}
.btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--stroke); }
.btn:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--stroke); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: 2px 2px 0 var(--stroke); }
.btn-primary { background: var(--book-blue); color: #fff; }
.btn-cta { background: var(--book-yellow); color: var(--ink-900); }
.btn-live { background: #d70015; color: #fff; }
.btn-live::before { content:''; width: 7px; height: 7px; background: #fff; border-radius: 50%; animation: pulse 1.2s infinite; }
.btn-ghost { background: #fff; color: var(--ink-900); }

/* ═══ SECTIONS ═══ */
.course-sections {
  grid-column: 1 / -1;
  border-top: 1.5px solid var(--stroke);
  background: var(--ink-50);
}
.course-sections-head {
  padding: 12px 18px;
  font-size: 13px; font-weight: 700;
  color: var(--ink-800);
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid var(--ink-200);
}
.course-sections-head svg { color: var(--book-blue); }
.course-sections-list { display: flex; flex-direction: column; }
.course-sec-link {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px;
  text-decoration: none;
  border-bottom: 1px solid var(--ink-200);
  transition: background .15s;
  min-width: 0;
}
.course-sec-link:last-child { border-bottom: none; }
.course-sec-link:hover { background: #fff; }
.orient-reset-link {
  display: block;
  width: 100%;
  margin: 8px 0 4px;
  padding: 6px 10px;
  background: transparent;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.orient-reset-link:hover {
  background: #f1f5f9;
  color: #0071c2;
  border-color: #0071c2;
}
.course-sec-code {
  font-size: 14px; font-weight: 700;
  color: var(--ink-900);
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: break-word;
  flex: 1 1 auto; min-width: 0;
}
.course-sec-name { display: none; }
.course-sec-count {
  font-size: 12px; color: var(--ink-500); font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 4px;
}
.course-sec-count svg { color: var(--ink-400); flex-shrink: 0; }

/* EMPTY / LOADING */
.empty-state {
  text-align: center; padding: 50px 20px; background: #fff;
  border-radius: 8px; border: 1.5px dashed var(--ink-300); margin-top: 12px;
}
.empty-state p { font-size: 15px; font-weight: 600; color: var(--ink-500); margin-bottom: 4px; }
.empty-sub { font-size: 13px !important; font-weight: 400 !important; color: var(--ink-400) !important; margin-bottom: 16px !important; }
.loading-state .skeleton {
  background: linear-gradient(90deg, var(--ink-100) 25%, var(--ink-50) 50%, var(--ink-100) 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite;
  border: 1.5px solid var(--stroke);
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* DIAG */
.diag-link {
  display:inline-flex; align-items:center; gap:6px;
  padding: 10px 18px; background: #fff;
  border: 1.5px solid var(--stroke); border-radius: 6px;
  box-shadow: 2px 2px 0 var(--stroke);
  color: var(--book-blue); font-size: 12.5px; font-weight: 700; text-decoration:none;
}
.diag-link:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--stroke); }

/* CONSENT MODAL */
.consent-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.consent-modal { background: #fff; border-radius: 8px; max-width: 460px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1.5px solid var(--stroke); box-shadow: 4px 4px 0 var(--stroke); }
.consent-header { background: var(--book-navy); color: #fff; padding: 16px 20px; border-bottom: 1.5px solid var(--stroke); display: flex; align-items: center; gap: 12px; }
.consent-logo { width: 28px; height: 28px; object-fit: contain; filter: brightness(0) invert(1); opacity: 0.9; }
.consent-header-title { font-size: 16px; font-weight: 800; }
.consent-header-sub { font-size: 11px; color: rgba(255,255,255,.6); margin-top: 1px; }
.consent-body { padding: 20px; }
.consent-info-card { background: var(--ink-50); border: 1.5px solid var(--stroke); border-radius: 6px; padding: 14px; margin-bottom: 16px; }
.consent-info-row { display: flex; justify-content: space-between; padding: 5px 0; }
.consent-info-row + .consent-info-row { border-top: 1px solid var(--ink-200); margin-top: 5px; padding-top: 10px; }
.consent-info-label { font-size: 11px; color: var(--ink-400); font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.consent-info-value { font-size: 14px; color: var(--ink-900); font-weight: 700; }
.consent-terms-list { padding: 0 0 0 20px; margin: 0; }
.consent-terms-list li { font-size: 13px; color: var(--ink-700); line-height: 1.75; padding: 3px 0; }
.consent-actions { display: flex; gap: 10px; padding: 16px 20px 20px; border-top: 1px solid var(--ink-200); }

/* ═══ RESPONSIVE — TABLET ═══ */
@media (max-width: 700px) {
  .my-page { padding: 16px 12px 80px; }

  /* PASSPORT */
  .pp-header { padding: 12px 14px; gap: 8px; flex-wrap: wrap; }
  .pp-title { font-size: 14px; }
  .pp-subtitle { font-size: 10px; }
  .pp-tagline { font-size: 9.5px; }
  .pp-country { font-size: 11px; }
  .pp-body { gap: 14px; padding: 16px 14px; }
  .pp-avatar { width: 64px; height: 76px; }
  .pp-name { font-size: 16px; }
  .pp-meta-row { font-size: 12.5px; }

  /* STATS — 2x2 grid */
  .pp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .pp-stat {
    padding: 10px 12px;
    border-right: 1px solid var(--ink-200);
    border-bottom: 1px solid var(--ink-200);
  }
  .pp-stat:nth-child(2n) { border-right: none; }
  .pp-stat:nth-last-child(-n+2) { border-bottom: none; }
  .pp-stat .v { font-size: 16px; }
  .pp-stat .l { font-size: 10.5px; }

  /* SECTION HEAD */
  .section-head { margin: 24px 0 12px; }
  .section-title { font-size: 17px; }
  .section-sub { font-size: 12.5px; }

  /* MINIAPP — 3 col */
  .miniapp-strip { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .miniapp { padding: 10px 10px; gap: 8px; }
  .miniapp-icon { width: 34px; height: 34px; font-size: 17px; }
  .miniapp-name { font-size: 12.5px; }

  /* COURSE */
  .course { grid-template-columns: 1fr; }
  .course-cover { min-height: 110px; border-right: none; border-bottom: 1.5px solid var(--stroke); padding: 12px; }
  .course-cover-title { font-size: 15px; }
  .course-cover-badge, .course-cover-pct { font-size: 10px; padding: 3px 8px; }
  .course-body { padding: 14px 14px; gap: 9px; }
  .course-title { font-size: 16px; }
  .course-meta { font-size: 12px; gap: 3px 8px; }
  .course-actions { gap: 6px; }
  .course-actions .btn { flex: 1; padding: 10px 12px; font-size: 12.5px; }

  /* LINE GATE */
  .line-gate { flex-direction: column; text-align: center; gap: 10px; padding: 14px; }
  .line-gate .btn-line { width: 100%; }

  /* SECTIONS */
  .course-sections-head { padding: 10px 14px; font-size: 12.5px; }
  .course-sec-link { padding: 10px 14px; gap: 10px; align-items: center; }
  .course-sec-code { font-size: 13px; }
  .course-sec-count { font-size: 11px; }
}

/* ═══ RESPONSIVE — SMALL PHONE ═══ */
@media (max-width: 380px) {
  .my-page { padding: 12px 8px 80px; }
  .pp-body { padding: 12px 10px; gap: 10px; }
  .pp-avatar { width: 56px; height: 66px; }
  .pp-name { font-size: 15px; }
  .pp-meta-row { font-size: 12px; }
  .pp-stat .v { font-size: 15px; }
  .miniapp-strip { grid-template-columns: repeat(2, 1fr); }
  .miniapp { padding: 10px 12px; }
  .miniapp-icon { width: 36px; height: 36px; font-size: 18px; }
  .course-body { padding: 12px; }
  .course-title { font-size: 15px; }
  .course-sec-link { padding: 9px 10px; gap: 8px; }
  .course-sec-code { font-size: 12.5px; }
}
</style>
