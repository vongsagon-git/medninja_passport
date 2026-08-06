<template>
  <div class="locked-page">
    <div class="card">
      <div class="icon">🔒</div>
      <h1>บัญชีของคุณถูกระงับ</h1>
      <p class="lead">กรุณาติดต่อ admin เพื่อยืนยันตัวตน</p>

      <div v-if="contactName" class="name-box">
        <div class="name-label">ชื่อที่ใช้แจ้ง admin</div>
        <div class="name-value">{{ contactName }}</div>
      </div>

      <a class="btn-line" href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 5.66 2 10.17c0 4.05 3.6 7.44 8.46 8.08.33.07.78.22.89.5.1.26.06.66.03.93l-.14.86c-.04.26-.2 1 .88.55 1.09-.46 5.88-3.46 8.02-5.93C21.55 13.63 22 12 22 10.17 22 5.66 17.52 2 12 2z"/></svg>
        <span>ทัก LINE @medninja</span>
      </a>

      <button class="btn-back" @click="goHome">← กลับหน้าแรก</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LockedPage',
  computed: {
    contactName() {
      return this.$route.query.name || ''
    }
  },
  methods: {
    goHome() { this.$router.push('/') }
  }
}
</script>

<style scoped>
.locked-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(245,158,11,0.15);
  text-align: center;
}
.icon { font-size: 56px; margin-bottom: 12px; }
h1 { font-size: 22px; color: #78350f; margin: 0 0 12px; font-weight: 700; }
.lead { color: #92400e; font-size: 15px; margin: 0 0 24px; }
.name-box {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}
.name-label { font-size: 12px; color: #78350f; }
.name-value { font-size: 18px; color: #78350f; font-weight: 700; margin-top: 4px; }
.btn-line {
  display: inline-flex; align-items: center; gap: 8px;
  background: #06c755; color: #fff;
  padding: 12px 28px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(6,199,85,0.3);
  transition: transform 0.15s;
}
.btn-line:hover { transform: translateY(-1px); }
.btn-back {
  display: block;
  width: 100%;
  background: transparent;
  color: #92400e;
  border: 0;
  padding: 12px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 12px;
}
.btn-back:hover { color: #78350f; text-decoration: underline; }
</style>
