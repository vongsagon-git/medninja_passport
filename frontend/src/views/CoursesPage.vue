<template>
  <div class="courses-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <h1>คอร์สเรียนทั้งหมด</h1>
        <p>สอนสดออนไลน์ + ดูวีดีโอย้อนหลัง โดยอาจารย์แพทย์ผู้เชี่ยวชาญ</p>
      </div>
    </div>

    <div class="container section">
      <!-- Search -->
      <div class="search-row">
        <div class="search-wrap">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
          <input
            v-model="searchText"
            type="text"
            class="form-control search-input"
            placeholder="ค้นหาคอร์ส, อาจารย์..."
          />
          <button v-if="searchText" class="search-clear" @click="searchText = ''" title="ล้าง">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
          </button>
        </div>
        <div v-if="!courseStore.loading && !courseStore.error" class="results-count">
          <span v-if="filteredCourses.length > 0">พบ <strong>{{ filteredCourses.length }}</strong> คอร์ส</span>
        </div>
      </div>

      <!-- Course Grid -->
      <div v-if="courseStore.loading" class="courses-grid">
        <SkeletonCard v-for="n in 9" :key="n" />
      </div>

      <AlertMessage v-else-if="courseStore.error" :message="courseStore.error" />

      <div v-else-if="filteredCourses.length > 0" class="courses-grid">
        <CourseCard v-for="course in filteredCourses" :key="course._id" :course="course" />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd"/></svg>
        </div>
        <h3>ไม่พบคอร์สที่ค้นหา</h3>
        <p>ลองค้นหาด้วยคำอื่น</p>
        <button class="btn btn-primary" @click="searchText = ''">ล้างการค้นหา</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useCourseStore } from '../stores/course'
import CourseCard from '../components/course/CourseCard.vue'
import SkeletonCard from '../components/common/SkeletonCard.vue'
import AlertMessage from '../components/common/AlertMessage.vue'

export default {
  name: 'CoursesPage',
  components: { CourseCard, SkeletonCard, AlertMessage },
  data() {
    return { searchText: '' }
  },
  setup() {
    const courseStore = useCourseStore()
    return { courseStore }
  },
  computed: {
    filteredCourses() {
      const q = this.searchText.toLowerCase().trim()
      if (!q) return this.courseStore.courses
      return this.courseStore.courses.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q)
      )
    }
  },
  mounted() {
    this.courseStore.fetchCourses()
  }
}
</script>

<style scoped>
/* Search row */
.search-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 440px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--gray);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  padding-left: 42px !important;
  padding-right: 40px !important;
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: var(--gray-light);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray);
  transition: background 0.2s;
}
.search-clear:hover { background: var(--border); }
.search-clear svg { width: 12px; height: 12px; }

.results-count { font-size: 13px; color: var(--gray); white-space: nowrap; }
.results-count strong { color: var(--primary); font-weight: 700; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 72px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 72px;
  height: 72px;
  background: var(--gray-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.empty-icon svg { width: 32px; height: 32px; color: var(--gray); }
.empty-state h3 { font-size: 18px; font-weight: 700; color: var(--dark); margin: 0; }
.empty-state p { font-size: 14px; color: var(--gray); margin: 0; }

@media (max-width: 768px) {
  .search-wrap { max-width: 100%; }
}
</style>
