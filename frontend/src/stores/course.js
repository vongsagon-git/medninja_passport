import { defineStore } from 'pinia'
import courseService from '../services/courseService'

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [],
    currentCourse: null,
    loading: false,
    error: null
  }),

  getters: {
    publishedCourses: (state) => state.courses.filter(c => c.isPublished),
    sortedByOrder: (state) => [...state.courses].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  },

  actions: {
    async fetchCourses() {
      this.loading = true
      this.error = null
      try {
        const data = await courseService.getCourses()
        this.courses = data.courses
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
      } finally {
        this.loading = false
      }
    },

    async fetchCourse(id) {
      this.loading = true
      this.error = null
      this.currentCourse = null
      try {
        const data = await courseService.getCourse(id)
        this.currentCourse = data.course
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด'
      } finally {
        this.loading = false
      }
    }
  }
})
