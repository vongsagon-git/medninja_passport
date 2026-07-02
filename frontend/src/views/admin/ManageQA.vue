<template>
  <div class="admin-page">
    <div class="page-header">
      <router-link to="/admin" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </router-link>
      <div>
        <h1 class="page-title">Q&A ประจำคอร์ส</h1>
        <p class="page-subtitle">ตอบคำถามนักเรียน · ลบ · แก้ไข</p>
      </div>
    </div>

    <!-- เลือกคอร์ส -->
    <div class="qa-pkg-select">
      <button v-for="pkg in packages" :key="pkg._id" class="qa-pkg-btn" :class="{ active: selectedPkg === pkg._id }" @click="selectPkg(pkg._id)">
        {{ pkg.title }}
        <span v-if="qaCounts[pkg._id]" class="qa-pkg-count">{{ qaCounts[pkg._id] }}</span>
      </button>
    </div>

    <!-- Stats -->
    <div v-if="selectedPkg" class="qa-stats">
      <span>{{ questions.length }} คำถาม</span>
      <span>· ตอบแล้ว {{ questions.filter(q => q.answer).length }}</span>
      <span>· รอตอบ {{ questions.filter(q => !q.answer).length }}</span>
      <div style="flex:1"></div>
      <select v-model="filter" class="qa-filter">
        <option value="all">ทั้งหมด</option>
        <option value="unanswered">รอตอบ</option>
        <option value="answered">ตอบแล้ว</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="qa-loading">กำลังโหลด...</div>

    <!-- Questions -->
    <div v-if="selectedPkg && !loading" class="qa-list">
      <div v-if="!filteredQuestions.length" class="qa-empty">
        {{ filter === 'unanswered' ? 'ไม่มีคำถามที่รอตอบ' : filter === 'answered' ? 'ยังไม่มีคำตอบ' : 'ยังไม่มีคำถาม' }}
      </div>

      <div v-for="(q, i) in filteredQuestions" :key="q._id" class="qa-card" :class="{ answered: !!q.answer }">
        <div class="qa-card-head">
          <span class="qa-num">#{{ i + 1 }}</span>
          <span class="qa-source" :class="'qa-src-' + (q.source || 'general')">
            {{ q.source === 'live' ? 'ไลฟ์' : 'ทั่วไป' }}
          </span>
          <span v-if="q.videoTimeSec != null" class="qa-time">{{ formatTime(q.videoTimeSec) }}</span>
          <span v-if="q.sessionTitle" class="qa-session">{{ q.sessionTitle }}</span>
          <div style="flex:1"></div>
          <span class="qa-user">{{ q.userName }}</span>
          <span class="qa-date">{{ formatDate(q.createdAt) }}</span>
        </div>

        <!-- คำถาม (แก้ไขได้) -->
        <div v-if="editingId === q._id" class="qa-edit-wrap">
          <textarea v-model="editText" class="qa-edit-input" rows="2"></textarea>
          <div class="qa-edit-actions">
            <button class="qa-btn qa-btn-save" @click="saveEdit(q)">บันทึก</button>
            <button class="qa-btn qa-btn-cancel" @click="editingId = null">ยกเลิก</button>
          </div>
        </div>
        <div v-else class="qa-question" @dblclick="startEdit(q)" style="white-space:pre-wrap;">{{ q.question }}</div>

        <!-- คำตอบ -->
        <div v-if="q.answer && editingAnswerId !== q._id" class="qa-answer">
          <span class="qa-answer-label">ตอบ:</span>
          <span @dblclick="startEditAnswer(q)" style="white-space:pre-wrap;">{{ q.answer }}</span>
          <span class="qa-answered-date">{{ formatDate(q.answeredAt) }}</span>
        </div>

        <!-- แก้คำตอบ -->
        <div v-if="editingAnswerId === q._id" class="qa-reply-wrap">
          <textarea v-model="editAnswerText" class="qa-reply-input" rows="2" placeholder="แก้ไขคำตอบ..."></textarea>
          <div class="qa-edit-actions">
            <button class="qa-btn qa-btn-save" @click="saveEditAnswer(q)">บันทึก</button>
            <button class="qa-btn qa-btn-cancel" @click="editingAnswerId = null">ยกเลิก</button>
          </div>
        </div>

        <!-- ตอบ (ถ้ายังไม่ตอบ) -->
        <div v-if="!q.answer && editingAnswerId !== q._id" class="qa-reply-wrap">
          <textarea v-model="q._draft" class="qa-reply-input" rows="2" placeholder="พิมพ์คำตอบ..." @keydown.ctrl.enter="answerQuestion(q)"></textarea>
          <button class="qa-btn qa-btn-answer" @click="answerQuestion(q)" :disabled="!q._draft?.trim()">ตอบ</button>
        </div>

        <!-- Actions -->
        <div class="qa-actions">
          <button class="qa-btn qa-btn-edit" @click="startEdit(q)" title="แก้คำถาม">แก้ไข</button>
          <button v-if="q.answer" class="qa-btn qa-btn-edit" @click="startEditAnswer(q)" title="แก้คำตอบ">แก้คำตอบ</button>
          <button class="qa-btn qa-btn-delete" @click="deleteQuestion(q)" title="ลบ">ลบ</button>
        </div>
      </div>
    </div>

    <!-- ไม่ได้เลือกคอร์ส -->
    <div v-if="!selectedPkg && !loading" class="qa-empty" style="margin-top:40px;">
      เลือกคอร์สด้านบนเพื่อจัดการคำถาม
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageQA',
  data() {
    return {
      packages: [],
      selectedPkg: null,
      questions: [],
      qaCounts: {},
      loading: false,
      filter: 'all',
      editingId: null,
      editText: '',
      editingAnswerId: null,
      editAnswerText: ''
    }
  },
  computed: {
    filteredQuestions() {
      if (this.filter === 'unanswered') return this.questions.filter(q => !q.answer)
      if (this.filter === 'answered') return this.questions.filter(q => q.answer)
      return this.questions
    }
  },
  async created() {
    await this.loadPackages()
  },
  methods: {
    async loadPackages() {
      try {
        const data = await api.get('/admin/packages')
        const pkgs = data.packages || data || []
        this.packages = pkgs.filter(p => !p.isDemo).map(p => ({ _id: p._id, title: p.title }))

        // load Q&A counts per package
        for (const pkg of this.packages) {
          try {
            const d = await api.get(`/admin/qa/${pkg._id}`)
            const unanswered = (d.questions || []).filter(q => !q.answer).length
            if (unanswered > 0) this.qaCounts = { ...this.qaCounts, [pkg._id]: unanswered }
          } catch {}
        }
      } catch (e) {
        console.error('loadPackages error:', e)
      }
    },
    async selectPkg(pkgId) {
      this.selectedPkg = pkgId
      this.loading = true
      this.editingId = null
      this.editingAnswerId = null
      try {
        const data = await api.get(`/admin/qa/${pkgId}`)
        this.questions = (data.questions || []).map(q => ({ ...q, _draft: '' }))
      } catch (e) {
        alert('โหลดคำถามไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
        this.questions = []
      } finally {
        this.loading = false
      }
    },
    async answerQuestion(q) {
      const text = q._draft?.trim()
      if (!text) return
      try {
        await api.post(`/admin/qa/${q._id}/answer`, { answer: text })
        q.answer = text
        q.answeredAt = new Date().toISOString()
        q._draft = ''
      } catch (e) {
        alert('ตอบไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      }
    },
    startEdit(q) {
      this.editingId = q._id
      this.editText = q.question
      this.editingAnswerId = null
    },
    async saveEdit(q) {
      if (!this.editText.trim()) return
      try {
        await api.post(`/admin/qa/${q._id}/answer`, { answer: q.answer || '', question: this.editText.trim() })
        q.question = this.editText.trim()
        this.editingId = null
      } catch (e) {
        alert('แก้ไขไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      }
    },
    startEditAnswer(q) {
      this.editingAnswerId = q._id
      this.editAnswerText = q.answer || ''
      this.editingId = null
    },
    async saveEditAnswer(q) {
      if (!this.editAnswerText.trim()) return
      try {
        await api.post(`/admin/qa/${q._id}/answer`, { answer: this.editAnswerText.trim() })
        q.answer = this.editAnswerText.trim()
        q.answeredAt = new Date().toISOString()
        this.editingAnswerId = null
      } catch (e) {
        alert('แก้ไขไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      }
    },
    async deleteQuestion(q) {
      if (!confirm(`ลบคำถาม "${q.question.slice(0, 50)}..." ?`)) return
      try {
        await api.delete(`/admin/qa/${q._id}`)
        this.questions = this.questions.filter(x => x._id !== q._id)
      } catch (e) {
        alert('ลบไม่สำเร็จ: ' + (e.response?.data?.message || e.message))
      }
    },
    formatTime(sec) {
      if (sec == null) return ''
      const m = Math.floor(sec / 60)
      const s = sec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.admin-page { max-width: 900px; margin: 0 auto; padding: 20px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9; color: #475569; text-decoration: none; }
.page-title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #94a3b8; margin: 2px 0 0; }

/* Package selector */
.qa-pkg-select { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.qa-pkg-btn {
  padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff; color: #475569; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 6px;
}
.qa-pkg-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.qa-pkg-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.qa-pkg-count {
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 800;
  min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
.qa-pkg-btn.active .qa-pkg-count { background: rgba(255,255,255,.3); }

/* Stats */
.qa-stats {
  display: flex; align-items: center; gap: 8px; padding: 10px 16px;
  background: #f8fafc; border-radius: 10px; margin-bottom: 16px;
  font-size: 13px; color: #475569; font-weight: 600;
}
.qa-filter {
  padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 12px; background: #fff; color: #475569;
}

.qa-loading { text-align: center; padding: 40px; color: #94a3b8; }
.qa-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }

/* Question card */
.qa-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px; margin-bottom: 12px; border-left: 4px solid #e2e8f0;
}
.qa-card.answered { border-left-color: #10b981; }

.qa-card-head {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
}
.qa-num { font-size: 11px; font-weight: 800; color: #94a3b8; }
.qa-source { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
.qa-src-live { color: #ef4444; background: #fef2f2; }
.qa-src-general { color: #64748b; background: #f1f5f9; }
.qa-time { font-size: 11px; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 6px; }
.qa-session { font-size: 11px; color: #94a3b8; }
.qa-user { font-size: 12px; font-weight: 700; color: #1e293b; }
.qa-date { font-size: 11px; color: #94a3b8; }

.qa-question { font-size: 15px; color: #1e293b; line-height: 1.6; cursor: default; }

/* Answer */
.qa-answer {
  margin-top: 10px; padding: 10px 12px; background: #f0fdf4; border-radius: 8px;
  font-size: 14px; color: #166534; line-height: 1.5;
}
.qa-answer-label { font-weight: 700; color: #10b981; margin-right: 4px; }
.qa-answered-date { font-size: 10px; color: #94a3b8; margin-left: 8px; }

/* Reply input */
.qa-reply-wrap { margin-top: 10px; display: flex; gap: 8px; align-items: flex-start; }
.qa-reply-input {
  flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; resize: vertical; min-height: 40px; font-family: inherit;
}
.qa-reply-input:focus { border-color: #3b82f6; outline: none; }

/* Edit */
.qa-edit-wrap { margin-bottom: 8px; }
.qa-edit-input {
  width: 100%; padding: 8px 12px; border: 1px solid #3b82f6; border-radius: 8px;
  font-size: 14px; resize: vertical; min-height: 40px; font-family: inherit;
}
.qa-edit-actions { display: flex; gap: 6px; margin-top: 6px; }

/* Actions */
.qa-actions { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; }

/* Buttons */
.qa-btn {
  padding: 6px 14px; border: none; border-radius: 6px; font-size: 12px;
  font-weight: 600; cursor: pointer; transition: all .15s;
}
.qa-btn-answer { background: #3b82f6; color: #fff; flex-shrink: 0; }
.qa-btn-answer:hover { background: #2563eb; }
.qa-btn-answer:disabled { opacity: .4; cursor: not-allowed; }
.qa-btn-save { background: #10b981; color: #fff; }
.qa-btn-cancel { background: #f1f5f9; color: #475569; }
.qa-btn-edit { background: #f1f5f9; color: #475569; }
.qa-btn-edit:hover { background: #e2e8f0; }
.qa-btn-delete { background: #fef2f2; color: #ef4444; }
.qa-btn-delete:hover { background: #ef4444; color: #fff; }

@media (max-width: 640px) {
  .admin-page { padding: 12px; }
  .qa-pkg-select { gap: 6px; }
  .qa-pkg-btn { padding: 6px 12px; font-size: 12px; }
  .qa-card { padding: 12px; }
}
</style>
