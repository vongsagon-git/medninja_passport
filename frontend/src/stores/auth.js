import { defineStore } from 'pinia'
import authService from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('token'),
    clientIp: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isEmailVerified: (state) => state.user?.emailVerified === true,
    isProfileComplete: (state) => state.user?.profileLocked === true,
    needsVerification: (state) => state.user && !state.user.emailVerified,
    needsProfile: (state) => state.user && !state.user.profileLocked && state.user.role !== 'admin',
    isApprovalPending: (state) => state.user?.approvalStatus === 'pending' && state.user.role !== 'admin' && state.user.role !== 'staff',
    isApprovalRejected: (state) => state.user?.approvalStatus === 'rejected' && state.user.role !== 'admin' && state.user.role !== 'staff'
  },

  actions: {
    async login(credentials) {
      const data = await authService.login(credentials)
      // 🔐 Admin TOTP gate — 202 { totpRequired, pendingLoginId } → ยังไม่ set auth
      if (data?.totpRequired && data?.pendingLoginId) {
        return { totpRequired: true, pendingLoginId: data.pendingLoginId }
      }
      this._setAuth(data)
      return data
    },

    async verifyTotpLogin(pendingLoginId, code) {
      const data = await authService.verifyTotpLogin(pendingLoginId, code)
      this._setAuth(data)
      return data
    },

    async fetchProfile() {
      const data = await authService.getProfile()
      this.user = data.user
      this.clientIp = data.clientIp || null
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    },

    async completeProfile(profileData) {
      const data = await authService.completeProfile(profileData)
      this.user = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    },

    async logout() {
      try {
        await authService.logout()
      } catch {
        // ไม่สนใจ error — ล้าง local state อยู่ดี
      }
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    _setAuth(data) {
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    },

    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    }
  }
})
