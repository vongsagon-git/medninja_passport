<template>
  <div class="card course-card">
    <!-- Thumbnail (1:1 square) -->
    <div class="course-thumbnail">
      <img :src="course.thumbnail || '/logo.png'" :alt="course.title" loading="lazy" @error="$event.target.onerror=null; $event.target.src='/logo.png'" />

      <!-- New badge -->
      <span v-if="course.system === 'new_2570'" class="ribbon-new">ใหม่ 2570</span>

      <!-- Free overlay badge -->
      <span v-if="!course.price || course.price === 0" class="free-badge">ฟรี</span>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <h3 class="course-title">{{ course.title }}</h3>

      <!-- Features badges -->
      <div v-if="course.features" class="course-features">
        <span v-if="course.features.live" class="feat-badge feat-live">LIVE สด</span>
        <span v-if="course.features.lms" class="feat-badge feat-lms">VDO ย้อนหลัง</span>
        <span v-if="course.features.synapse" class="feat-badge feat-synapse">SYNAPSE</span>
        <span v-if="course.features.atlas" class="feat-badge feat-atlas">ATLAS</span>
        <span v-if="course.features.nlex" class="feat-badge feat-nlex">NLEX 10,000+ ข้อ</span>
        <span v-if="course.features.meqex" class="feat-badge feat-meqex">MEQEX</span>
        <span v-if="course.features.ddx" class="feat-badge feat-ddx">DDx</span>
        <span v-if="course.features.osce" class="feat-badge feat-osce">OSCE ตัวต่อตัว</span>
      </div>

      <!-- Description — แสดงหลายบรรทัด -->
      <div class="course-desc">
        <p v-for="(line, i) in descLines" :key="i">{{ line }}</p>
      </div>

      <!-- Learning Points -->
      <ul v-if="course.learningPoints && course.learningPoints.length" class="course-points">
        <li v-for="(pt, i) in course.learningPoints" :key="i">{{ pt }}</li>
      </ul>

      <!-- Stats row -->
      <div class="course-stats">
        <span v-if="course.durationHours > 0" class="stat-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
          {{ course.durationHours }} ชั่วโมง
        </span>
      </div>

      <!-- Price + CTA -->
      <div class="course-footer">
        <div class="price-block">
          <div class="price-row">
            <span v-if="!course.price || course.price === 0" class="price-free">ฟรี!</span>
            <span v-else class="price-amount">฿{{ course.price.toLocaleString() }}</span>
            <span v-if="course.durationHours > 0" class="price-duration">· {{ course.durationHours }} ชั่วโมง</span>
          </div>
          <span class="instructor-name">{{ course.instructor }}</span>
        </div>
        <a href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener" class="btn btn-primary btn-detail">
          ติดต่อสอบถาม
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/></svg>
        </a>
      </div>

      <!-- Subjects: กดเปิดดูรายวิชา -->
      <div v-if="course.subjects && course.subjects.length" class="subjects-wrap">
        <button class="subjects-toggle" @click="showSubjects = !showSubjects">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
          {{ showSubjects ? 'ซ่อนรายวิชา' : 'ดูรายวิชา (' + course.subjects.length + ')' }}
        </button>
        <div v-if="showSubjects" class="subjects-list-col">
          <div v-for="(s, i) in course.subjects" :key="i" class="subject-row">{{ s }}</div>
        </div>
      </div>
    </div>

    <!-- Sub-courses: footer ของ card (sibling ของ card-body) -->
    <div v-if="course.subCourses && course.subCourses.length" class="sub-courses-wrap">
      <div class="sub-label">หรือสมัครแยก Part</div>
      <div class="sub-compact">
        <div v-for="(sub, idx) in course.subCourses" :key="sub._id || idx" class="sub-row" @click="toggleSubSubjects(idx)">
          <span class="sub-title">{{ sub.title }}</span>
          <span class="sub-price">฿{{ sub.price.toLocaleString() }}</span>
        </div>
      </div>
      <!-- วิชาแสดงข้างล่างเมื่อกด -->
      <div v-if="openSubIdx !== -1 && course.subCourses[openSubIdx]?.subjects?.length" class="sub-subjects-list">
        <div class="sub-subjects-head">{{ course.subCourses[openSubIdx].title }}</div>
        <div v-for="(s, i) in course.subCourses[openSubIdx].subjects" :key="i" class="sub-subject-row">{{ s }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CourseCard',
  props: {
    course: { type: Object, required: true }
  },
  data() {
    return { showSubjects: false, openSubIdx: -1 }
  },
  methods: {
    toggleSubSubjects(idx) { this.openSubIdx = this.openSubIdx === idx ? -1 : idx }
  },
  computed: {
    descLines() {
      return (this.course.description || '').split('\n').filter(l => l.trim())
    }
  }
}
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: default;
}


.course-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}

/* Thumbnail — square 1:1 */
.course-thumbnail {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--gray-light);
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.course-card:hover .course-thumbnail img {
  transform: scale(1.04);
}

/* New 2570 ribbon */
.ribbon-new {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(245,158,11,0.4);
}

/* Free badge */
.free-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(16,185,129,0.4);
}

/* Card body */
.card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 14px;
  gap: 0;
}

.course-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-desc {
  font-size: 12px;
  color: var(--gray);
  line-height: 1.5;
  margin-bottom: 8px;
}
.course-desc p {
  margin: 0 0 2px;
}
.course-points {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
}
.course-points li {
  font-size: 11px;
  color: var(--text);
  padding: 3px 0 3px 16px;
  position: relative;
  line-height: 1.4;
}
.course-points li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #16a34a;
  font-weight: 700;
  font-size: 11px;
}

/* Stats */
.course-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--gray);
  font-weight: 500;
}

.stat-item svg {
  width: 12px;
  height: 12px;
  color: var(--accent);
  opacity: 0.9;
  flex-shrink: 0;
}

/* Footer: price + button */
.course-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.price-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.price-duration {
  font-size: 12px;
  color: var(--gray);
  font-weight: 500;
}

.price-amount {
  font-size: 17px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1.1;
}

.price-free {
  font-size: 16px;
  font-weight: 800;
  color: #10b981;
  line-height: 1.1;
}

.instructor-name {
  font-size: 11px;
  color: var(--gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.btn-detail svg {
  width: 13px;
  height: 13px;
  transition: transform 0.2s ease;
}

.btn-detail:hover svg {
  transform: translateX(3px);
}

/* Features badges */
.course-features { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.feat-badge { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full); letter-spacing: 0.3px; }
.feat-live { background: #fee2e2; color: #dc2626; }
.feat-lms { background: #dbeafe; color: #2563eb; }
.feat-synapse { background: #d1fae5; color: #059669; }
.feat-atlas { background: #e0f2fe; color: #0369a1; }
.feat-nlex { background: #e0f2fe; color: #0891b2; }
.feat-meqex { background: #ffe4e6; color: #e11d48; }
.feat-ddx { background: #fef3c7; color: #d97706; }
.feat-osce { background: #ede9fe; color: #7c3aed; }

/* Subjects */
.subjects-wrap {
  margin-top: 10px;
  border-top: 1px dashed var(--border);
  padding-top: 8px;
}
.subjects-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  background: none;
  border: 1px solid var(--accent);
  border-radius: var(--radius-full);
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.subjects-toggle:hover {
  background: var(--accent);
  color: #fff;
}
.subjects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.subject-chip {
  font-size: 10px;
  font-weight: 600;
  color: #334155;
  background: #f1f5f9;
  border-radius: var(--radius-full);
  padding: 3px 10px;
  border: 1px solid #e2e8f0;
}

/* Sub-courses — compact rows */
.sub-courses-wrap {
  margin-top: 8px;
  border-top: 1px dashed var(--border);
  padding-top: 6px;
}

.sub-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.sub-compact {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.sub-row:hover { background: #f8fafc; }
.sub-row + .sub-row { border-top: 1px solid #f1f5f9; }

.sub-subjects-list { margin-top: 6px; background: #f8fafc; border-radius: 6px; padding: 6px 10px; }
.sub-subjects-head { font-size: 10px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
.sub-subject-row { font-size: 11px; color: #334155; padding: 3px 0; border-bottom: 1px solid #e2e8f0; }
.sub-subject-row:last-child { border-bottom: none; }
.subjects-list-col { margin-top: 6px; }
.subject-row { font-size: 12px; color: #334155; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
.subject-row:last-child { border-bottom: none; }

.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}

.sub-price {
  font-size: 12px;
  font-weight: 800;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
