<template>
  <div class="admin-courses">
    <div class="page-header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>จัดการคอร์ส</h1>
          <p>เพิ่ม แก้ไข ข้อมูลคอร์สเรียน</p>
        </div>
        <button class="btn btn-primary" @click="openNewForm">+ เพิ่มคอร์สใหม่</button>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert-msg alert-danger">{{ error }}</div>
      <div v-if="successMsg" class="alert-msg alert-success">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
        {{ successMsg }}
      </div>

      <!-- Course Cards -->
      <div v-if="loading" style="padding: 40px; text-align: center; color: var(--gray);">กำลังโหลด...</div>
      <div v-else class="course-grid">
        <div v-for="course in sortedCourses" :key="course._id" class="c-card" :class="{ 'c-draft': !course.isPublished }">
          <div class="c-top">
            <div class="c-title-row">
              <span class="c-order">#{{ course.order || '-' }}</span>
              <span class="c-title">{{ course.title }}</span>
            </div>
            <div class="c-meta">
              <span class="c-price">฿{{ (course.price || 0).toLocaleString() }}</span>
              <span v-if="course.system === 'new_2570'" class="c-sys c-sys-new">ใหม่ 2570</span>
              <span v-else class="c-sys">เก่า</span>
              <span class="c-status" :class="course.isPublished ? 'st-pub' : 'st-draft'">
                {{ course.isPublished ? 'เผยแพร่' : 'ร่าง' }}
              </span>
            </div>
            <!-- Feature badges -->
            <div v-if="course.features" class="c-feats">
              <span v-if="course.features.live" class="ft ft-live">LIVE</span>
              <span v-if="course.features.lms" class="ft ft-lms">VDO</span>
              <span v-if="course.features.synapse" class="ft ft-syn">SYNAPSE</span>
              <span v-if="course.features.atlas" class="ft ft-atlas">ATLAS</span>
              <span v-if="course.features.nlex" class="ft ft-nlex">NLEX</span>
              <span v-if="course.features.meqex" class="ft ft-meqex">MEQEX</span>
              <span v-if="course.features.ddx" class="ft ft-ddx">DDx</span>
              <span v-if="course.features.osce" class="ft ft-osce">OSCE</span>
            </div>
            <!-- Summary line -->
            <div class="c-summary">
              <span v-if="course.durationHours">{{ course.durationHours }} ชม.</span>
              <span v-if="course.subjects && course.subjects.length">{{ course.subjects.length }} วิชา</span>
              <span v-if="course.subCourses && course.subCourses.length">{{ course.subCourses.length }} คอร์สย่อย</span>
              <span v-if="course.instructor">{{ course.instructor }}</span>
            </div>
          </div>

          <!-- Expand details -->
          <div v-if="expandedId === course._id" class="c-details">
            <div v-if="course.description" class="c-desc">{{ course.description }}</div>
            <div v-if="course.learningPoints && course.learningPoints.length" class="c-lp">
              <div v-for="(pt, i) in course.learningPoints" :key="i" class="c-lp-item">{{ pt }}</div>
            </div>
            <div v-if="course.subjects && course.subjects.length" class="c-subj-list">
              <div class="c-subj-label">รายวิชา</div>
              <div v-for="(s, i) in course.subjects" :key="i" class="c-subj-item">{{ i + 1 }}. {{ s }}</div>
            </div>
            <div v-if="course.subCourses && course.subCourses.length" class="c-sub-wrap">
              <div class="c-subj-label">คอร์สย่อย</div>
              <div v-for="(sub, idx) in course.subCourses" :key="idx" class="c-sub-item">
                <div class="c-sub-row">
                  <span class="c-sub-name">{{ sub.title }}</span>
                  <span class="c-sub-price">฿{{ (sub.price || 0).toLocaleString() }}</span>
                </div>
                <div v-if="sub.durationHours" class="c-sub-hrs">{{ sub.durationHours }} ชม.</div>
                <div v-if="sub.subjects && sub.subjects.length" class="c-sub-subjects">
                  <span v-for="(s, si) in sub.subjects" :key="si" class="c-sub-subj-chip">{{ s }}</span>
                </div>
              </div>
            </div>
            <div v-if="course.thumbnail" class="c-thumb-preview">
              <img :src="course.thumbnail" @error="$event.target.style.display='none'" />
            </div>
          </div>

          <!-- Actions -->
          <div class="c-actions">
            <button class="btn-link" @click="toggleExpand(course._id)">
              {{ expandedId === course._id ? 'ซ่อน' : 'ดูเพิ่ม' }}
            </button>
            <div class="c-act-btns">
              <button class="btn btn-sm btn-outline" @click="editCourse(course)">แก้ไข</button>
              <template v-if="deletingId === course._id">
                <button class="btn btn-sm btn-danger" @click="deleteCourse(course._id)">ยืนยันลบ</button>
                <button class="btn btn-sm btn-outline" @click="deletingId = null">ยกเลิก</button>
              </template>
              <button v-else class="btn btn-sm btn-ghost-danger" @click="deletingId = course._id">ลบ</button>
            </div>
          </div>
        </div>

        <div v-if="courses.length === 0" style="text-align: center; color: var(--gray); padding: 60px 20px; grid-column: 1 / -1;">
          ยังไม่มีคอร์ส — กด "+ เพิ่มคอร์สใหม่" เพื่อเริ่มต้น
        </div>
      </div>

      <!-- ==================== FORM MODAL ==================== -->
      <div v-if="showForm" class="modal-overlay" @click.self="cancelEdit">
        <div class="modal-box">
          <div class="modal-header">
            <h2>{{ editingId ? 'แก้ไขคอร์ส' : 'เพิ่มคอร์สใหม่' }}</h2>
            <button class="modal-close" @click="cancelEdit">&times;</button>
          </div>

          <form @submit.prevent="handleSubmit" class="modal-body">
            <!-- Section 1: ข้อมูลหลัก -->
            <div class="form-section">
              <div class="form-section-title">ข้อมูลหลัก</div>
              <div class="fg">
                <label>ชื่อคอร์ส</label>
                <input v-model="form.title" type="text" class="form-control" required />
              </div>
              <div class="fg-row">
                <div class="fg">
                  <label>ราคา (บาท)</label>
                  <input v-model.number="form.price" type="number" class="form-control" min="0" />
                </div>
                <div class="fg">
                  <label>ผู้สอน</label>
                  <input v-model="form.instructor" type="text" class="form-control" />
                </div>
                <div class="fg" style="max-width:100px">
                  <label>ชั่วโมง</label>
                  <input v-model.number="form.durationHours" type="number" class="form-control" min="0" />
                </div>
              </div>
              <div class="fg-row">
                <div class="fg" style="max-width:100px">
                  <label>ลำดับ</label>
                  <input v-model.number="form.order" type="number" class="form-control" min="0" />
                </div>
                <div class="fg" style="max-width:160px">
                  <label>ระบบ</label>
                  <select v-model="form.system" class="form-control">
                    <option value="new_2570">ใหม่ 2570</option>
                    <option value="legacy">เก่า</option>
                  </select>
                </div>
                <div class="fg" style="flex:1">
                  <label>Thumbnail URL</label>
                  <input v-model="form.thumbnail" type="text" class="form-control" placeholder="https://..." />
                </div>
              </div>
            </div>

            <!-- Section 2: รายละเอียด -->
            <div class="form-section">
              <div class="form-section-title">รายละเอียด</div>
              <div class="fg">
                <label>คำอธิบาย</label>
                <textarea v-model="form.description" class="form-control" rows="3"></textarea>
              </div>
              <div class="fg">
                <label>จุดเด่น / สิ่งที่จะได้เรียนรู้ <small>(แต่ละบรรทัด = 1 ข้อ)</small></label>
                <textarea v-model="form.learningPointsText" class="form-control" rows="3" placeholder="เรียนรู้การวินิจฉัยโรค&#10;เทคนิค MEQ และ OSCE"></textarea>
              </div>
            </div>

            <!-- Section 3: ระบบการเรียน -->
            <div class="form-section">
              <div class="form-section-title">ระบบการเรียนที่รวมอยู่</div>
              <div class="feat-checks">
                <label class="feat-chk"><input type="checkbox" v-model="form.features.live" /><span class="ft ft-live">LIVE สด</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.lms" /><span class="ft ft-lms">LMS VDO</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.synapse" /><span class="ft ft-syn">SYNAPSE</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.atlas" /><span class="ft ft-atlas">ATLAS</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.nlex" /><span class="ft ft-nlex">NLEX</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.meqex" /><span class="ft ft-meqex">MEQEX</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.ddx" /><span class="ft ft-ddx">DDx</span></label>
                <label class="feat-chk"><input type="checkbox" v-model="form.features.osce" /><span class="ft ft-osce">OSCE</span></label>
              </div>
            </div>

            <!-- Section 4: รายวิชา (list + drag) -->
            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>รายวิชา ({{ form.subjects.length }})</span>
                <button type="button" class="btn btn-sm btn-outline" @click="addSubject">+ เพิ่มวิชา</button>
              </div>
              <div class="subj-list">
                <div v-for="(subj, idx) in form.subjects" :key="idx"
                  class="subj-item"
                  draggable="true"
                  @dragstart="dragStart(idx)"
                  @dragover.prevent="dragOver(idx)"
                  @drop="dragDrop(idx)"
                  @dragend="dragEnd"
                  :class="{ 'subj-dragging': dragIdx === idx, 'subj-over': dragOverIdx === idx }">
                  <span class="subj-handle" title="ลากสลับ">&#9776;</span>
                  <input v-model="form.subjects[idx]" type="text" class="form-control" placeholder="ชื่อวิชา" />
                  <button type="button" class="btn-icon-del" @click="form.subjects.splice(idx, 1)" title="ลบ">&times;</button>
                </div>
                <div v-if="!form.subjects.length" class="subj-empty">ยังไม่มีวิชา — กดเพิ่มด้านบน</div>
              </div>
            </div>

            <!-- Section 5: คอร์สย่อย -->
            <div class="form-section">
              <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>คอร์สย่อย ({{ form.subCourses.length }})</span>
                <button type="button" class="btn btn-sm btn-outline" @click="addSubCourse">+ เพิ่ม</button>
              </div>
              <div v-for="(sub, idx) in form.subCourses" :key="idx" class="sc-card">
                <div class="sc-top">
                  <input v-model="sub.title" type="text" class="form-control" placeholder="ชื่อ เช่น Part A: Major" style="flex:2" />
                  <input v-model.number="sub.price" type="number" class="form-control" placeholder="ราคา" min="0" style="flex:0.8" />
                  <input v-model.number="sub.durationHours" type="number" class="form-control" placeholder="ชม." min="0" style="flex:0.5" />
                  <button type="button" class="btn-icon-del" @click="form.subCourses.splice(idx, 1)">&times;</button>
                </div>
                <div class="sc-subj">
                  <input v-model="sub.subjectsText" type="text" class="form-control" placeholder="วิชา (คั่นด้วย , เช่น สูติ, ศัลย์, เมด)" />
                </div>
              </div>
              <div v-if="!form.subCourses.length" class="subj-empty">ไม่มีคอร์สย่อย</div>
            </div>

            <!-- Publish + Submit -->
            <div class="form-section" style="border:none;padding-bottom:0">
              <label class="pub-toggle">
                <input type="checkbox" v-model="form.isPublished" />
                <span>เผยแพร่คอร์สนี้</span>
              </label>
              <div style="display:flex;gap:8px;margin-top:16px">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึก' : 'เพิ่มคอร์ส') }}
                </button>
                <button type="button" class="btn btn-outline" @click="cancelEdit">ยกเลิก</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageCourses',
  data() {
    return {
      courses: [],
      loading: false,
      saving: false,
      error: null,
      successMsg: '',
      showForm: false,
      editingId: null,
      deletingId: null,
      expandedId: null,
      dragIdx: null,
      dragOverIdx: null,
      form: this.emptyForm()
    }
  },
  computed: {
    sortedCourses() {
      return [...this.courses].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    }
  },
  async mounted() {
    await this.fetchCourses()
  },
  methods: {
    emptyForm() {
      return {
        title: '', system: 'new_2570', price: 0, instructor: '',
        durationHours: 0, order: 0, thumbnail: '', description: '',
        learningPointsText: '', isPublished: false,
        subjects: [],
        subCourses: [],
        features: { live: false, lms: false, synapse: false, nlex: false, ddx: false, osce: false }
      }
    },
    async fetchCourses() {
      this.loading = true
      this.error = null
      try {
        const data = await api.get('/courses/all')
        this.courses = data.courses
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'
      } finally {
        this.loading = false
      }
    },
    toggleExpand(id) {
      this.expandedId = this.expandedId === id ? null : id
    },
    openNewForm() {
      this.editingId = null
      this.form = this.emptyForm()
      this.showForm = true
    },
    editCourse(course) {
      this.editingId = course._id
      this.form = {
        title: course.title || '',
        system: course.system || 'legacy',
        price: course.price || 0,
        instructor: course.instructor || '',
        durationHours: course.durationHours || 0,
        order: course.order || 0,
        thumbnail: course.thumbnail || '',
        description: course.description || '',
        learningPointsText: (course.learningPoints || []).join('\n'),
        isPublished: course.isPublished || false,
        subjects: [...(course.subjects || [])],
        features: { live: false, lms: false, synapse: false, nlex: false, ddx: false, osce: false, ...(course.features || {}) },
        subCourses: (course.subCourses || []).map(s => ({
          title: s.title || '',
          price: s.price || 0,
          durationHours: s.durationHours || 0,
          subjectsText: (s.subjects || []).join(', ')
        }))
      }
      this.showForm = true
    },
    cancelEdit() {
      this.showForm = false
      this.editingId = null
    },
    addSubject() {
      this.form.subjects.push('')
      this.$nextTick(() => {
        const inputs = this.$el.querySelectorAll('.subj-item:last-child input')
        if (inputs.length) inputs[0].focus()
      })
    },
    addSubCourse() {
      this.form.subCourses.push({ title: '', price: 0, durationHours: 0, subjectsText: '' })
    },
    // Drag & drop for subjects
    dragStart(idx) { this.dragIdx = idx },
    dragOver(idx) { this.dragOverIdx = idx },
    dragDrop(idx) {
      if (this.dragIdx === null || this.dragIdx === idx) return
      const item = this.form.subjects.splice(this.dragIdx, 1)[0]
      this.form.subjects.splice(idx, 0, item)
      this.dragIdx = null
      this.dragOverIdx = null
    },
    dragEnd() { this.dragIdx = null; this.dragOverIdx = null },
    async handleSubmit() {
      this.saving = true
      this.error = null
      try {
        const payload = {
          title: this.form.title,
          system: this.form.system,
          price: this.form.price,
          instructor: this.form.instructor,
          durationHours: this.form.durationHours,
          order: this.form.order,
          thumbnail: this.form.thumbnail,
          description: this.form.description,
          isPublished: this.form.isPublished,
          features: this.form.features,
          learningPoints: this.form.learningPointsText.split('\n').map(l => l.trim()).filter(Boolean),
          subjects: this.form.subjects.map(s => s.trim()).filter(Boolean),
          subCourses: this.form.subCourses.filter(s => s.title.trim()).map(s => ({
            title: s.title,
            price: s.price,
            durationHours: s.durationHours,
            subjects: (s.subjectsText || '').split(',').map(x => x.trim()).filter(Boolean)
          }))
        }
        const isEdit = !!this.editingId
        if (isEdit) {
          await api.put(`/courses/${this.editingId}`, payload)
        } else {
          await api.post('/courses', payload)
        }
        this.showForm = false
        this.editingId = null
        await this.fetchCourses()
        this.successMsg = isEdit ? 'แก้ไขคอร์สเรียบร้อย' : 'เพิ่มคอร์สใหม่เรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกข้อมูลล้มเหลว'
      } finally {
        this.saving = false
      }
    },
    async deleteCourse(id) {
      this.error = null
      try {
        await api.delete(`/courses/${id}`)
        this.deletingId = null
        await this.fetchCourses()
        this.successMsg = 'ลบคอร์สเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.deletingId = null
        this.error = err.response?.data?.message || 'ลบข้อมูลล้มเหลว'
      }
    }
  }
}
</script>

<style scoped>
/* ---- Course Card Grid ---- */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
.c-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.c-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.c-draft { border-left: 3px solid #94a3b8; }
.c-top { padding: 16px 16px 10px; }
.c-title-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
.c-order { font-size: 11px; color: var(--gray); font-weight: 600; }
.c-title { font-size: 15px; font-weight: 700; color: var(--text); }
.c-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.c-price { font-size: 14px; font-weight: 800; color: var(--accent); }
.c-sys { font-size: 10px; font-weight: 600; color: var(--gray); background: #f1f5f9; padding: 2px 8px; border-radius: 99px; }
.c-sys-new { color: #d97706; background: #fef3c7; }
.c-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.st-pub { color: #059669; background: #d1fae5; }
.st-draft { color: #64748b; background: #f1f5f9; }

.c-feats { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.ft { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 99px; letter-spacing: 0.3px; }
.ft-live { background: #fee2e2; color: #dc2626; }
.ft-lms { background: #dbeafe; color: #2563eb; }
.ft-syn { background: #d1fae5; color: #059669; }
.ft-atlas { background: #e0f2fe; color: #0369a1; }
.ft-nlex { background: #e0f2fe; color: #0891b2; }
.ft-meqex { background: #ffe4e6; color: #e11d48; }
.ft-ddx { background: #fef3c7; color: #d97706; }
.ft-osce { background: #ede9fe; color: #7c3aed; }

.c-summary { font-size: 11px; color: var(--gray); display: flex; gap: 10px; flex-wrap: wrap; }
.c-summary span::before { content: '·'; margin-right: 2px; }
.c-summary span:first-child::before { content: ''; margin: 0; }

/* ---- Expand Details ---- */
.c-details { padding: 0 16px 10px; border-top: 1px dashed var(--border); margin-top: 4px; padding-top: 10px; }
.c-desc { font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 8px; white-space: pre-line; }
.c-lp { margin-bottom: 8px; }
.c-lp-item { font-size: 11px; color: var(--text); padding: 2px 0 2px 14px; position: relative; }
.c-lp-item::before { content: '✓'; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
.c-subj-label { font-size: 10px; font-weight: 700; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.c-subj-list { margin-bottom: 8px; }
.c-subj-item { font-size: 12px; color: #334155; padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
.c-subj-item:last-child { border-bottom: none; }
.c-sub-wrap { margin-bottom: 8px; }
.c-sub-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 4px; }
.c-sub-row { display: flex; justify-content: space-between; align-items: center; }
.c-sub-name { font-size: 12px; font-weight: 600; }
.c-sub-price { font-size: 12px; font-weight: 800; color: var(--accent); }
.c-sub-hrs { font-size: 10px; color: var(--gray); }
.c-sub-subjects { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.c-sub-subj-chip { font-size: 9px; background: #e2e8f0; color: #334155; padding: 1px 6px; border-radius: 99px; }
.c-thumb-preview { margin-top: 8px; }
.c-thumb-preview img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); }

/* ---- Card Actions ---- */
.c-actions { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-top: 1px solid var(--border); background: #fafbfc; }
.btn-link { background: none; border: none; color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px 0; }
.btn-link:hover { text-decoration: underline; }
.c-act-btns { display: flex; gap: 6px; }
.btn-ghost-danger { background: none; border: 1px solid transparent; color: #dc2626; font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.btn-ghost-danger:hover { background: #fee2e2; border-color: #fecaca; }

/* ---- Modal ---- */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000;
  display: flex; justify-content: center; align-items: flex-start; padding: 40px 16px;
  overflow-y: auto;
  animation: fadeIn 0.15s;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  background: #fff; border-radius: 16px; width: 100%; max-width: 720px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border);
}
.modal-header h2 { margin: 0; font-size: 18px; }
.modal-close {
  background: none; border: none; font-size: 24px; color: var(--gray); cursor: pointer;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
}
.modal-close:hover { background: #f1f5f9; color: var(--text); }
.modal-body { padding: 0 24px 24px; max-height: calc(100vh - 160px); overflow-y: auto; }

/* ---- Form Sections ---- */
.form-section { padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
.form-section-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
.fg { margin-bottom: 10px; }
.fg label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
.fg label small { font-weight: 400; color: #94a3b8; }
.fg-row { display: flex; gap: 10px; }
.fg-row .fg { flex: 1; min-width: 0; }

/* Feature checkboxes */
.feat-checks { display: flex; gap: 8px; flex-wrap: wrap; }
.feat-chk { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.feat-chk input { margin: 0; }

/* ---- Subjects List (drag & drop) ---- */
.subj-list { display: flex; flex-direction: column; gap: 4px; }
.subj-item {
  display: flex; align-items: center; gap: 6px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px 8px;
  transition: all 0.15s;
}
.subj-item:hover { border-color: var(--accent); }
.subj-dragging { opacity: 0.4; }
.subj-over { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.subj-handle { cursor: grab; color: #94a3b8; font-size: 14px; padding: 0 2px; user-select: none; }
.subj-handle:active { cursor: grabbing; }
.subj-item .form-control { border: none; background: transparent; font-size: 13px; padding: 4px 0; }
.subj-item .form-control:focus { outline: none; box-shadow: none; }
.btn-icon-del {
  background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; flex-shrink: 0;
}
.btn-icon-del:hover { color: #dc2626; background: #fee2e2; }
.subj-empty { font-size: 12px; color: #94a3b8; padding: 8px 0; }

/* ---- SubCourses ---- */
.sc-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 6px; }
.sc-top { display: flex; gap: 6px; align-items: center; }
.sc-top .form-control { font-size: 13px; }
.sc-subj { margin-top: 6px; }
.sc-subj .form-control { font-size: 11px; background: #fff; }

/* ---- Publish Toggle ---- */
.pub-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text); }
.pub-toggle input { width: 16px; height: 16px; }

/* ---- Alerts ---- */
.alert-msg { padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.alert-danger { background: #fee; border: 1px solid #fcc; color: #c00; }
.alert-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

/* ---- Responsive ---- */
@media (max-width: 600px) {
  .course-grid { grid-template-columns: 1fr; }
  .fg-row { flex-direction: column; gap: 0; }
  .fg-row .fg { max-width: none !important; }
  .sc-top { flex-wrap: wrap; }
}
</style>
