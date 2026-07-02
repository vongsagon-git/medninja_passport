<template>
  <div class="redirect-msg">กำลังเปิด Warroom...</div>
</template>

<script>
export default {
  name: 'Warroom',
  async mounted() {
    // สร้าง handoff code แล้ว redirect ไป WS Warroom
    try {
      const token = localStorage.getItem('token')
      if (!token) { this.$router.push('/login'); return }

      const r = await fetch('/api/auth/handoff/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target: 'ws-warroom' })
      })
      const d = await r.json()
      if (d.code) {
        window.location.href = `https://ws.medninja.academy/auth/handoff?code=${d.code}`
      } else {
        this.$router.push('/admin')
      }
    } catch {
      this.$router.push('/admin')
    }
  }
}
</script>

<style scoped>
.redirect-msg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0f;
  color: #64748b;
  font-family: 'Noto Sans Thai', sans-serif;
  font-size: 14px;
}
</style>
