import api from './api'

export default {
  fetchApproaches() {
    return api.get('/my/approaches')
  },

  fetchReviewQueue() {
    return api.get('/my/approaches/review-queue')
  },

  fetchStats() {
    return api.get('/my/approaches/stats')
  },

  fetchApproach(id) {
    return api.get(`/my/approaches/${id}`)
  },

  recordRead(id) {
    return api.post(`/my/approaches/${id}/read`)
  },

  submitPractice(id, data) {
    return api.post(`/my/approaches/${id}/practice`, data)
  },

  toggleBookmark(id) {
    return api.post(`/my/approaches/${id}/bookmark`)
  }
}
