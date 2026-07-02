<template>
  <div class="lqa-page">
    <header class="lqa-header">
      <router-link to="/my" class="lqa-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        กลับ
      </router-link>
      <div class="lqa-title-wrap">
        <h1>คำถาม-คำตอบ</h1>
        <p v-if="sessionTitle">{{ sessionTitle }}</p>
      </div>
    </header>

    <div v-if="loading" class="lqa-loading">
      <div class="lqa-spinner"></div>
      <p>โหลดข้อมูล...</p>
    </div>

    <div v-else class="lqa-body">
      <!-- ส่งคำถาม (อยู่บนสุด เด่น) -->
      <div class="lqa-ask-top">
        <div class="lqa-ask-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clip-rule="evenodd"/></svg>
        </div>
        <div class="lqa-ask-content">
          <div class="lqa-ask-title">ถามคำถาม</div>
          <div class="lqa-ask-sub">ทีมงานจะรู้ว่าใครถาม แต่เพื่อนๆ จะไม่ทราบชื่อเพื่อความเป็นส่วนตัว · แบ่งปันข้อสงสัยให้เพื่อนๆ ได้เรียนรู้ไปด้วยกัน</div>
        </div>
        <div class="lqa-ask-form">
          <textarea v-model="newQuestion" class="lqa-ask-input" placeholder="พิมพ์คำถามได้เลย..." maxlength="500" rows="2" @keydown.ctrl.enter="submitQuestion" :disabled="sending"></textarea>
          <button class="lqa-ask-btn" @click="submitQuestion" :disabled="!newQuestion.trim() || sending">
            {{ sending ? '...' : 'ส่งคำถาม' }}
          </button>
        </div>
      </div>

      <!-- Tab filter -->
      <div class="lqa-tabs">
        <button class="lqa-tab" :class="{ active: sourceFilter === 'all' }" @click="sourceFilter = 'all'">
          ทั้งหมด <span class="lqa-tab-count">{{ total }}</span>
        </button>
        <button class="lqa-tab lqa-tab-live" :class="{ active: sourceFilter === 'live' }" @click="sourceFilter = 'live'">
          จากไลฟ์ <span class="lqa-tab-count">{{ questions.filter(q => q.source === 'live').length }}</span>
        </button>
        <button class="lqa-tab" :class="{ active: sourceFilter === 'general' }" @click="sourceFilter = 'general'">
          ทั่วไป <span class="lqa-tab-count">{{ questions.filter(q => q.source !== 'live').length }}</span>
        </button>
        <div style="flex:1"></div>
        <span class="lqa-stats-inline">ตอบแล้ว {{ filteredQuestions.filter(q => q.answer).length }}/{{ filteredQuestions.length }}</span>
      </div>

      <div v-if="!filteredQuestions.length" class="lqa-empty">
        <p>{{ sourceFilter === 'live' ? 'ยังไม่มีคำถามจากไลฟ์' : sourceFilter === 'general' ? 'ยังไม่มีคำถามทั่วไป' : 'ยังไม่มีคำถาม' }}</p>
      </div>

      <template v-for="(group, date) in groupedQuestions" :key="date">
        <div class="lqa-date-header">{{ date }}</div>
        <div v-for="q in group" :key="q._id" class="lqa-card" :class="{ answered: !!q.answer, 'lqa-card-live': q.source === 'live' }">
          <div class="lqa-q-head">
            <span v-if="q.source === 'live'" class="lqa-source lqa-src-live">ไลฟ์{{ q.sessionTitle ? ' · ' + q.sessionTitle : '' }}</span>
            <span v-else class="lqa-source">ทั่วไป</span>
            <span class="lqa-time" v-if="q.videoTimeSec != null">{{ formatTime(q.videoTimeSec) }}</span>
            <span class="lqa-q-clock">{{ formatClock(q.createdAt) }}</span>
            <span v-if="q.isOwn" class="lqa-own">คำถามของฉัน</span>
          </div>
          <div class="lqa-question" v-html="nl2br(q.question)"></div>
          <div v-if="q.answer" class="lqa-answer">
            <div class="lqa-a-label">คำตอบ</div>
            <div class="lqa-a-text" v-html="nl2br(q.answer)"></div>
          </div>
          <div v-else class="lqa-pending">รอคำตอบ</div>
        </div>
      </template>

      <!-- โหลดเพิ่ม -->
      <button v-if="page < pages" class="lqa-load-more" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'กำลังโหลด...' : `โหลดเพิ่ม (${total - questions.length} คำถามที่เหลือ)` }}
      </button>

      <div class="lqa-bottom-space"></div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'LiveQA',
  data() {
    return {
      questions: [],
      sessionTitle: '',
      loading: true,
      newQuestion: '',
      sending: false,
      sourceFilter: 'all',
      page: 1,
      pages: 1,
      total: 0,
      loadingMore: false
    }
  },
  computed: {
    filteredQuestions() {
      if (this.sourceFilter === 'live') return this.questions.filter(q => q.source === 'live')
      if (this.sourceFilter === 'general') return this.questions.filter(q => q.source !== 'live')
      return this.questions
    },
    groupedQuestions() {
      const groups = {}
      for (const q of this.filteredQuestions) {
        const d = new Date(q.createdAt)
        const key = d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
        if (!groups[key]) groups[key] = []
        groups[key].push(q)
      }
      return groups
    }
  },
  async created() {
    await this.loadQuestions(false)
    // Poll page 1 every 15s for new answers (ไม่ reset pagination)
    this._poll = setInterval(async () => {
      try {
        const data = await api.get(`/my/qa/${this.$route.params.packageId}?page=1&limit=${this.questions.length || 20}`)
        const fresh = data.questions || []
        const freshIds = new Set(fresh.map(q => q._id))
        // ลบคำถามที่ถูก admin ลบ
        this.questions = this.questions.filter(q => q._id?.startsWith('tmp-') || freshIds.has(q._id))
        // อัพเดทคำตอบ + เพิ่มคำถามใหม่
        for (const fq of fresh) {
          const existing = this.questions.find(q => q._id === fq._id)
          if (existing) {
            if (fq.answer !== existing.answer) { existing.answer = fq.answer; existing.answeredAt = fq.answeredAt }
          } else {
            this.questions.unshift(fq)
          }
        }
        this.total = data.total || this.total
        this.pages = data.pages || this.pages
      } catch {}
    }, 15000)
  },
  beforeUnmount() {
    if (this._poll) clearInterval(this._poll)
  },
  methods: {
    async loadQuestions(append) {
      try {
        if (append) this.loadingMore = true
        const data = await api.get(`/my/qa/${this.$route.params.packageId}?page=${this.page}&limit=20`)
        const newQ = data.questions || []
        if (append) {
          this.questions = [...this.questions, ...newQ]
        } else {
          this.questions = newQ
        }
        this.total = data.total || 0
        this.pages = data.pages || 1
      } catch (e) {
        if (this.loading) this.questions = []
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    loadMore() {
      if (this.page < this.pages && !this.loadingMore) {
        this.page++
        this.loadQuestions(true)
      }
    },
    async submitQuestion() {
      const text = this.newQuestion.trim()
      if (!text || this.sending) return
      this.sending = true
      try {
        const res = await api.post(`/my/qa/${this.$route.params.packageId}`, {
          question: text,
          source: 'general'
        })
        if (res.question) {
          this.questions.push(res.question)
        }
        this.newQuestion = ''
      } catch (e) {
        alert('ส่งคำถามไม่สำเร็จ: ' + (e.response?.data?.message || e.message || ''))
      } finally {
        this.sending = false
      }
    },
    formatTime(sec) {
      if (sec == null) return ''
      const m = Math.floor(sec / 60)
      const s = sec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    },
    formatClock(d) {
      if (!d) return ''
      return new Date(d).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })
    },
    nl2br(text) {
      if (!text) return ''
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    }
  }
}
</script>

<style scoped>
.lqa-page {
  min-height: 100vh; background: #0f172a; color: #e2e8f0;
  font-family: 'Noto Sans Thai', -apple-system, sans-serif;
}
.lqa-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid #1e293b;
  background: #0f172a; position: sticky; top: 0; z-index: 10;
}
.lqa-back {
  display: flex; align-items: center; gap: 4px;
  color: #93c5fd; font-size: 13px; font-weight: 600; text-decoration: none;
  padding: 6px 12px; border-radius: 8px; border: 1px solid #1e3a5f;
  transition: all .15s;
}
.lqa-back:hover { background: rgba(59,130,246,.1); }
.lqa-title-wrap { flex: 1; }
.lqa-title-wrap h1 { font-size: 18px; font-weight: 800; margin: 0; }
.lqa-title-wrap p { font-size: 13px; color: #64748b; margin: 2px 0 0; }

.lqa-loading { text-align: center; padding: 60px; color: #64748b; }
.lqa-spinner { width: 28px; height: 28px; border: 3px solid #1e293b; border-top-color: #3b82f6; border-radius: 50%; animation: spin .7s linear infinite; margin: 0 auto 8px; }
@keyframes spin { to { transform: rotate(360deg); } }

.lqa-body { max-width: 640px; margin: 0 auto; padding: 20px; }
.lqa-stats { font-size: 13px; color: #64748b; margin-bottom: 16px; font-weight: 600; }
.lqa-empty { text-align: center; padding: 40px; color: #475569; }

.lqa-card {
  background: #1e293b; border-radius: 12px; padding: 16px;
  margin-bottom: 12px; border-left: 4px solid #334155;
}
.lqa-card.answered { border-left-color: #10b981; }

.lqa-q-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.lqa-num { font-size: 11px; font-weight: 800; color: #475569; }
.lqa-time {
  font-size: 11px; font-weight: 700; color: #3b82f6;
  background: rgba(59,130,246,.15); padding: 2px 8px; border-radius: 6px;
}
.lqa-time.lqa-after { color: #f59e0b; background: rgba(245,158,11,.15); }
/* Tabs */
.lqa-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.lqa-tab {
  padding: 6px 14px; border: 1px solid #1e293b; border-radius: 8px;
  background: transparent; color: #64748b; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 6px;
}
.lqa-tab:hover { border-color: #334155; color: #94a3b8; }
.lqa-tab.active { background: #1e293b; color: #fff; border-color: #334155; }
.lqa-tab-live.active { background: rgba(239,68,68,.15); color: #ef4444; border-color: rgba(239,68,68,.3); }
.lqa-tab-count { font-size: 11px; opacity: .7; }

/* Live card accent */
.lqa-card-live { border-left-color: #ef4444; }
.lqa-card-live.answered { border-left-color: #10b981; }

.lqa-date-header {
  font-size: 13px; font-weight: 700; color: #93c5fd;
  padding: 16px 0 8px; border-bottom: 1px solid #1e293b; margin-bottom: 12px;
  position: sticky; top: 0; background: #0f172a; z-index: 2;
}
.lqa-date-header:first-of-type { padding-top: 0; }
.lqa-q-clock { font-size: 10px; color: #475569; font-family: monospace; }
.lqa-source { font-size: 10px; font-weight: 700; color: #64748b; background: rgba(100,116,139,.15); padding: 2px 8px; border-radius: 6px; }
.lqa-src-live { color: #ef4444; background: rgba(239,68,68,.15); }
.lqa-own { font-size: 10px; color: #93c5fd; font-weight: 600; margin-left: auto; }

.lqa-question { font-size: 15px; color: #f1f5f9; line-height: 1.6; }

.lqa-answer {
  margin-top: 12px; padding-top: 12px; border-top: 1px solid #334155;
}
.lqa-a-label { font-size: 11px; font-weight: 700; color: #10b981; margin-bottom: 4px; }
.lqa-a-text { font-size: 14px; color: #a7f3d0; line-height: 1.6; }

.lqa-pending {
  margin-top: 8px; font-size: 12px; color: #64748b; font-weight: 600;
  font-style: italic;
}

/* Ask box top */
.lqa-ask-top {
  background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
  border-radius: 16px; padding: 20px; margin-bottom: 20px;
  border: 1px solid #2563eb33;
  box-shadow: 0 4px 20px rgba(37,99,235,.15);
}
.lqa-ask-icon { color: #3b82f6; margin-bottom: 8px; }
.lqa-ask-content { margin-bottom: 12px; }
.lqa-ask-title { font-size: 16px; font-weight: 800; color: #fff; }
.lqa-ask-sub { font-size: 12px; color: #93c5fd; margin-top: 2px; }
.lqa-stats-inline { font-size: 12px; color: #64748b; font-weight: 600; white-space: nowrap; }
.lqa-bottom-space { height: 40px; }

.lqa-load-more {
  width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #1e293b;
  border-radius: 10px; background: transparent; color: #93c5fd;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
}
.lqa-load-more:hover { background: rgba(59,130,246,.1); border-color: #3b82f6; }
.lqa-load-more:disabled { opacity: .5; cursor: not-allowed; }

.lqa-ask-form { display: flex; flex-direction: column; gap: 10px; }
.lqa-ask-input {
  width: 100%; padding: 12px 14px; border-radius: 10px;
  border: 1px solid #334155; background: #0f172a;
  color: #fff; font-size: 14px; outline: none;
  font-family: inherit; resize: none;
}
.lqa-ask-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
.lqa-ask-input::placeholder { color: #475569; }
.lqa-ask-btn {
  align-self: flex-end; padding: 10px 24px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 2px 10px rgba(37,99,235,.4); transition: all .15s;
}
.lqa-ask-btn:hover:not(:disabled) { transform: scale(1.03); box-shadow: 0 4px 16px rgba(37,99,235,.5); }
.lqa-ask-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width: 640px) {
  .lqa-body { padding: 12px; }
  .lqa-header { padding: 12px 16px; }
  .lqa-title-wrap h1 { font-size: 16px; }
}
</style>
