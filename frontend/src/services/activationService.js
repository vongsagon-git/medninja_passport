import api from './api'

export default {
  // Student: get my activations (with populated package + sections)
  getMyActivations() {
    return api.get('/my/activations')
  },

  // Student: get section videos (access check on server)
  getSection(sectionId) {
    return api.get(`/my/sections/${sectionId}`)
  },

  // Student: get video signed URL (bonus=true สำหรับ VDO พิเศษ)
  getVideo(sectionId, videoIndex, bonus = false) {
    const qs = bonus ? '?bonus=1' : ''
    return api.get(`/my/sections/${sectionId}/videos/${videoIndex}${qs}`)
  },

  // Demo: public section (no auth)
  getDemoSection() {
    return api.get('/demo/section')
  },

  // Demo: public video (no auth)
  getDemoVideo(videoIndex) {
    return api.get(`/demo/section/videos/${videoIndex}`)
  },

  // Admin: list all activations
  listActivations() {
    return api.get('/admin/activations')
  },

  // Admin: create activation
  createActivation(data) {
    return api.post('/admin/activations', data)
  },

  // Admin: update activation (extend days, toggle active)
  updateActivation(id, data) {
    return api.put(`/admin/activations/${id}`, data)
  },

  // Admin: delete activation
  deleteActivation(id) {
    return api.delete(`/admin/activations/${id}`)
  },

  // Student: consent status (per-activation)
  getConsentStatus() {
    return api.get('/my/consent/status')
  },

  // Student: accept consent for specific activation
  acceptConsent(activationId) {
    return api.post('/my/consent/accept', { activationId })
  }
}
