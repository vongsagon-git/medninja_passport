import api from './api'

export default {
  getCourses(params) {
    return api.get('/courses', { params })
  },

  getCourse(id) {
    return api.get(`/courses/${id}`)
  }
}
