import api from './api'

export default {
  fetchCases() {
    return api.get('/my/meq')
  },

  fetchCase(id) {
    return api.get(`/my/meq/${id}`)
  },

  startCase(id) {
    return api.post(`/my/meq/${id}/start`)
  },

  submitAnswer(id, data) {
    return api.post(`/my/meq/${id}/answer`, data)
  },

  completeCase(id) {
    return api.post(`/my/meq/${id}/complete`)
  },

  fetchHistory() {
    return api.get('/my/meq/history')
  }
}
