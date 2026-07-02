<template>
  <div class="reply-page">
    <div class="reply-card">
      <h2>ตอบคำถามนักเรียน</h2>
      <div class="reply-info">
        <div><span class="reply-label">นักเรียน</span> <strong>{{ studentName }}</strong></div>
        <div><span class="reply-label">คำถาม</span> {{ question }}</div>
        <div v-if="video"><span class="reply-label">วีดีโอ</span> {{ video }}</div>
      </div>

      <div v-if="sent" class="reply-sent">
        <div style="color:#10b981;font-size:28px;margin-bottom:6px">&#10003;</div>
        <p>ส่งคำตอบแล้ว!</p>
        <p style="font-size:12px;color:#94a3b8">นักเรียนจะได้รับทาง LINE</p>
      </div>
      <div v-else>
        <textarea v-model="answer" rows="5" placeholder="พิมพ์คำตอบ..." class="reply-textarea"></textarea>
        <button class="reply-btn" :disabled="!answer.trim() || sending" @click="sendReply">
          {{ sending ? 'กำลังส่ง...' : 'ส่งคำตอบ' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReplyStudent',
  data() {
    return { answer: '', sending: false, sent: false }
  },
  computed: {
    studentName() { return this.$route.query.name || '-' },
    question() { return this.$route.query.q || '-' },
    video() { return this.$route.query.video || '' },
    lineUserId() { return this.$route.query.uid || '' }
  },
  methods: {
    async sendReply() {
      if (!this.answer.trim() || !this.lineUserId) return
      this.sending = true
      try {
        await fetch('/api/diag/reply-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: this.lineUserId,
            studentName: this.studentName,
            question: this.question,
            answer: this.answer.trim(),
            video: this.video
          })
        })
        this.sent = true
      } catch { alert('ส่งไม่สำเร็จ') }
      this.sending = false
    }
  }
}
</script>

<style scoped>
.reply-page { min-height: 100vh; background: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Noto Sans Thai', sans-serif; }
.reply-card { background: #fff; border-radius: 16px; padding: 24px; max-width: 440px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.reply-card h2 { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 16px; }
.reply-info { background: #f1f5f9; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 13px; color: #334155; display: flex; flex-direction: column; gap: 4px; }
.reply-label { color: #94a3b8; font-size: 11px; display: inline-block; width: 60px; }
.reply-textarea { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 14px; color: #1e293b; resize: vertical; font-family: inherit; }
.reply-btn { width: 100%; margin-top: 10px; padding: 12px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; }
.reply-btn:disabled { opacity: 0.5; }
.reply-sent { text-align: center; padding: 16px 0; }
.reply-sent p { font-size: 15px; font-weight: 700; color: #1e293b; }
</style>
