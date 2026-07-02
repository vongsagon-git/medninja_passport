import { defineStore } from 'pinia'
import activationService from '../services/activationService'

export const useActivationStore = defineStore('activation', {
  state: () => ({
    activations: [],
    currentSection: null,
    currentVideo: null,
    loading: false,
    error: null,
    consentAcceptedIds: null // null = loading, [] = fetched
  }),

  getters: {
    // Mini-apps ที่ user มีสิทธิ์ใช้ (รวมจากทุก activation)
    enabledMiniApps(state) {
      const flags = {
        atlas: false,
        synapse: false,
        nlex: false,
        meqex: false,
        ddx: false,
        osce: false,
        skill15: false,
        longex: false
      }
      const now = new Date()
      for (const act of state.activations) {
        if (!act.isActive && act.status !== 'active') continue
        if (act.expiresAt && new Date(act.expiresAt) < now) continue
        if (act.atlasEnabled) flags.atlas = true
        if (act.synapseEnabled) flags.synapse = true
        if (act.nlexEnabled) flags.nlex = true
        if (act.meqexEnabled) flags.meqex = true
        if (act.ddxEnabled) flags.ddx = true
        if (act.osceEnabled) flags.osce = true
        if (act.skill15Enabled) flags.skill15 = true
        if (act.longexEnabled) flags.longex = true
      }
      return flags
    },

    hasAnyMiniApp(state) {
      const f = this.enabledMiniApps
      return f.atlas || f.synapse || f.nlex || f.meqex || f.ddx || f.osce || f.skill15 || f.longex
    },

    // Tier สูงสุดของ user สำหรับ section นี้ (favor user — ถ้าหลาย activation ครอบ ใช้ tier สูงสุด)
    // คืน 0 = ไม่มีสิทธิ์ section นี้เลย
    tierForSection(state) {
      return (sectionId) => {
        let maxTier = 0
        const now = new Date()
        for (const act of state.activations) {
          if (!act.isActive || (act.expiresAt && new Date(act.expiresAt) < now)) continue
          const hasSection = act.package?.sections?.some(s => s._id === sectionId || s._id?.toString() === sectionId?.toString())
          if (hasSection) maxTier = Math.max(maxTier, act.tier || 6)
        }
        return maxTier
      }
    },

    // All accessible sections (unique, from all active activations)
    accessibleSections(state) {
      const sections = []
      const seen = new Set()
      for (const act of state.activations) {
        if (!act.isActive || new Date(act.expiresAt) < new Date()) continue
        const pkg = act.package
        if (!pkg?.sections) continue
        for (const sec of pkg.sections) {
          if (!seen.has(sec._id)) {
            seen.add(sec._id)
            sections.push(sec)
          }
        }
      }
      return sections.sort((a, b) => a.order - b.order)
    }
  },

  actions: {
    async fetchMyActivations() {
      this.loading = true
      this.error = null
      try {
        const data = await activationService.getMyActivations()
        this.activations = data.activations
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
      } finally {
        this.loading = false
      }
    },

    async fetchSection(sectionId) {
      this.loading = true
      this.error = null
      this.currentSection = null
      try {
        const data = await activationService.getSection(sectionId)
        this.currentSection = data.section
      } catch (err) {
        this.error = err.response?.data?.message || 'ไม่มีสิทธิ์เข้าถึง'
      } finally {
        this.loading = false
      }
    },

    async fetchVideo(sectionId, videoIndex, bonus = false) {
      this.loading = true
      this.error = null
      this.currentVideo = null
      try {
        const data = await activationService.getVideo(sectionId, videoIndex, bonus)
        this.currentVideo = data.video
      } catch (err) {
        this.error = err.response?.data?.message || 'ไม่มีสิทธิ์เข้าถึง'

        // ── 403 BROWSER_NOT_SUPPORTED → ส่ง flex แจ้งเติ้ล "นักเรียนเปิดไม่ได้เพราะ OS Guard" ──
        const status = err.response?.status
        const code = err.response?.data?.code
        if (status === 403 && code === 'BROWSER_NOT_SUPPORTED') {
          try {
            // ดึง user จาก authStore (Pinia) — รู้ทันทีว่าเป็นใคร
            const { useAuthStore } = await import('./auth')
            const authStore = useAuthStore()
            const u = authStore.user
            const userName = u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.name || '')
            const userEmail = u?.email || ''

            const { getOS } = await import('../utils/deviceDetect')
            const _ua = navigator.userAgent
            const _os = getOS(_ua)
            const _br = /Line\//.test(_ua)?'LINE in-app'
              :/FBAN|FBAV/.test(_ua)?'Facebook in-app'
              :/Instagram/.test(_ua)?'Instagram in-app'
              :/SamsungBrowser/.test(_ua)?'Samsung Internet'
              :/Edg\//.test(_ua)?'Edge'
              :/OPR\//.test(_ua)?'Opera'
              :/Vivaldi/.test(_ua)?'Vivaldi'
              :/Firefox\//.test(_ua)?'Firefox'
              :/Chrome\//.test(_ua)&&!/Edg\//.test(_ua)?'Chrome'
              :/Safari\//.test(_ua)&&!/Chrome\//.test(_ua)?'Safari'
              :'Other'
            const tok = localStorage.getItem('token')
            const reason = err.response?.data?.message || `${_os} · ${_br}`
            fetch('/api/diag/doctor-line', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(tok ? { 'Authorization': `Bearer ${tok}` } : {}) },
              body: JSON.stringify({
                plainText: `=== 403 BROWSER_NOT_SUPPORTED ===\nuser: ${userName} (${userEmail})\nsection: ${sectionId}\nvideoIndex: ${videoIndex}\nreason: ${reason}\nUA: ${_ua}`,
                userName,
                userEmail,
                failCount: 1,
                resultId: '',
                videoTitle: '',
                sectionName: '',
                sectionCode: '',
                page: 'OS Guard (403)',
                url: window.location.pathname,
                clientReferer: document.referrer || window.location.href,
                clientHost: window.location.host,
                clientOS: _os,
                clientBrowser: _br,
                browserBlocked: true,
                browserBlockReason: reason
              })
            }).catch(() => {})
          } catch { /* silent */ }
        }
      } finally {
        this.loading = false
      }
    },

    // Demo: public access (no auth required)
    async fetchDemoSection() {
      this.loading = true
      this.error = null
      this.currentSection = null
      try {
        const data = await activationService.getDemoSection()
        this.currentSection = data.section
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
      } finally {
        this.loading = false
      }
    },

    async fetchConsentStatus() {
      try {
        const data = await activationService.getConsentStatus()
        this.consentAcceptedIds = data.acceptedActivationIds || []
      } catch {
        this.consentAcceptedIds = []
      }
    },

    async acceptConsent(activationId) {
      await activationService.acceptConsent(activationId)
      if (!this.consentAcceptedIds) this.consentAcceptedIds = []
      this.consentAcceptedIds.push(activationId)
    },

    isConsentAccepted(activationId) {
      if (!this.consentAcceptedIds) return false
      return this.consentAcceptedIds.includes(activationId)
    },

    async fetchDemoVideo(videoIndex) {
      this.loading = true
      this.error = null
      this.currentVideo = null
      try {
        const data = await activationService.getDemoVideo(videoIndex)
        this.currentVideo = data.video
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
      } finally {
        this.loading = false
      }
    }
  }
})
