import api from './api'

export default {
  login(credentials) {
    return api.post('/auth/login', credentials)
  },

  getProfile() {
    return api.get('/auth/me')
  },

  updateProfile(data) {
    return api.put('/users/profile', data)
  },

  completeProfile(data) {
    return api.post('/users/complete-profile', data)
  },

  changePassword(data) {
    return api.post('/auth/change-password', data)
  },

  logout() {
    return api.post('/auth/logout')
  },

  resendVerify() {
    return api.post('/auth/resend-verify')
  }
}
