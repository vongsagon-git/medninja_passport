<template>
  <div class="course-detail">
    <LoadingSpinner v-if="courseStore.loading" />

    <template v-else-if="course">
      <!-- Hero Header -->
      <div class="course-hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-left">
              <h1 class="hero-title">{{ course.title }}</h1>
              <p class="hero-instructor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                {{ course.instructor }}
              </p>
              <div class="hero-meta">
                <div v-if="course.durationHours > 0" class="hero-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ course.durationHours }} ชั่วโมง
                </div>
                <div v-if="course.enrollmentCount" class="hero-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ course.enrollmentCount.toLocaleString() }} คน
                </div>
              </div>
            </div>
            <!-- Hero thumbnail -->
            <div class="hero-thumb-wrap">
              <img
                :src="course.thumbnail || '/logo.png'"
                :alt="course.title"
                class="hero-thumb"
                @error="$event.target.onerror=null; $event.target.src='/logo.png'"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="container section">
        <div class="detail-grid">
          <!-- Main content -->
          <div class="detail-main">
            <!-- Description card -->
            <div class="card detail-card">
              <div class="card-body">
                <h2 class="section-heading">รายละเอียดคอร์ส</h2>
                <p class="course-description">{{ course.description }}</p>

                <div v-if="course.learningPoints?.length" class="learn-section">
                  <h3 class="sub-heading">สิ่งที่จะได้เรียนรู้</h3>
                  <ul class="learn-list">
                    <li v-for="(item, i) in course.learningPoints" :key="i">
                      <span class="learn-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Lessons List (preview, non-clickable until enrolled) -->
            <div v-if="course.lessons?.length" class="card detail-card lessons-card">
              <div class="card-body">
                <div class="lessons-header">
                  <h2 class="section-heading">เนื้อหาบทเรียน</h2>
                  <span class="lessons-count">{{ course.lessons.length }} ครั้ง</span>
                </div>
                <div class="lesson-list">
                  <div
                    v-for="(lesson, i) in course.lessons"
                    :key="lesson._id"
                    class="lesson-item"
                  >
                    <span class="lesson-num">{{ i + 1 }}</span>
                    <span class="lesson-title">{{ lesson.title }}</span>
                    <span v-if="lesson.duration" class="lesson-duration">{{ lesson.duration }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sticky Sidebar -->
          <div class="detail-sidebar">
            <div class="price-card">
              <!-- Price -->
              <div class="price-display">
                <div v-if="!course.price" class="price-free">ฟรี</div>
                <div v-else class="price-number">฿{{ course.price.toLocaleString() }}</div>
              </div>

              <!-- CTA -->
              <a href="https://lin.ee/medninja" target="_blank" rel="noopener" class="btn btn-primary btn-lg enroll-btn">
                สนใจสมัครเรียน
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
              <p class="price-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                ติดต่อผ่าน LINE @medninja
              </p>

              <!-- Course Info -->
              <div class="course-info-list">
                <div v-if="course.durationHours > 0" class="info-item">
                  <span class="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ชั่วโมงเรียน
                  </span>
                  <span class="info-value">{{ course.durationHours }} ชั่วโมง</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    ผู้สอน
                  </span>
                  <span class="info-value">{{ course.instructor }}</span>
                </div>
                <div v-if="course.enrollmentCount" class="info-item">
                  <span class="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    ผู้เรียน
                  </span>
                  <span class="info-value">{{ course.enrollmentCount.toLocaleString() }} คน</span>
                </div>
                <div class="info-item">
                  <span class="info-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.883v6.234a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    รูปแบบ
                  </span>
                  <span class="info-value">สอนสด + ดูย้อนหลัง</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="courseStore.error" class="error-state">
      <div class="container">
        <div class="error-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56" style="color:var(--gray);margin-bottom:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <h2>ไม่พบคอร์สนี้</h2>
          <p>คอร์สที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่แล้ว</p>
          <router-link to="/courses" class="btn btn-primary">ดูคอร์สทั้งหมด</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCourseStore } from '../stores/course'
import { useRoute } from 'vue-router'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

export default {
  name: 'CourseDetailPage',
  components: { LoadingSpinner },
  setup() {
    const courseStore = useCourseStore()
    const route = useRoute()
    return { courseStore, route }
  },
  computed: {
    course() {
      return this.courseStore.currentCourse
    }
  },
  watch: {
    'route.params.id'(newId) {
      this.courseStore.fetchCourse(newId)
    }
  },
  async mounted() {
    await this.courseStore.fetchCourse(this.route.params.id)
  }
}
</script>

<style scoped>
/* ── Hero ── */
.course-hero {
  padding: 48px 0 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}
.hero-left { flex: 1; min-width: 0; }

.hero-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 10px;
  color: white;
}

.hero-instructor {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 12px;
}

.hero-meta { display: flex; flex-wrap: wrap; gap: 16px; }

.hero-stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: rgba(255,255,255,0.65);
}

/* Square thumbnail in hero */
.hero-thumb-wrap {
  flex-shrink: 0;
  width: 160px;
}
.hero-thumb {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  border: 3px solid rgba(255,255,255,0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

/* ── Layout ── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 28px;
  align-items: start;
}

.detail-main { display: flex; flex-direction: column; gap: 20px; }
.detail-card { border: 1px solid var(--border); }

.section-heading { font-size: 18px; font-weight: 700; color: var(--dark); margin-bottom: 12px; }
.sub-heading { font-size: 16px; font-weight: 700; color: var(--dark); margin-bottom: 10px; }
.course-description { color: var(--gray); line-height: 1.8; font-size: 14px; }

.learn-section { margin-top: 20px; }
.learn-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.learn-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.5; }
.learn-check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* ── Lessons ── */
.lessons-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.lessons-count { font-size: 13px; color: var(--gray); background: var(--gray-light); padding: 3px 10px; border-radius: 999px; }
.lesson-list { margin-top: 8px; }
.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--border);
  color: inherit;
}
.lesson-item:last-child { border-bottom: none; }
.lesson-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.lesson-title { flex: 1; font-size: 14px; font-weight: 500; }
.lesson-duration { font-size: 13px; color: var(--gray); }

/* ── Price Card Sidebar ── */
.price-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px 24px;
  position: sticky;
  top: 84px;
  box-shadow: var(--shadow-md);
}
.price-display { text-align: center; margin-bottom: 20px; }
.price-number { font-size: 40px; font-weight: 800; color: var(--accent); line-height: 1; }
.price-free { font-size: 32px; font-weight: 800; color: var(--success); }

.enroll-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
}
.price-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: var(--gray);
  margin-top: 8px;
  text-align: center;
}
.course-info-list { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.info-item:last-child { border-bottom: none; }
.info-label { display: flex; align-items: center; gap: 7px; color: var(--gray); }
.info-value { font-weight: 600; color: var(--dark); text-align: right; }

/* ── Error ── */
.error-state { padding: 80px 0; }
.error-inner { text-align: center; max-width: 400px; margin: 0 auto; }
.error-inner h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.error-inner p { color: var(--gray); margin-bottom: 24px; font-size: 14px; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .course-hero { padding: 32px 0 28px; }
  .hero-title { font-size: 22px; }
  .hero-thumb-wrap { display: none; }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-sidebar { order: -1; }
  .price-card { position: static; }
  .price-number { font-size: 32px; }
}
</style>
