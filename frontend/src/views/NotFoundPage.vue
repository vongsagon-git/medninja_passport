<template>
  <div class="not-found">
    <div class="container">
      <div class="nf-inner">
        <!-- SVG Illustration -->
        <div class="nf-illustration">
          <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" class="nf-svg">
            <!-- Background circle -->
            <circle cx="100" cy="90" r="80" fill="#EFF6FF"/>
            <!-- Magnifying glass handle -->
            <line x1="130" y1="120" x2="155" y2="148" stroke="#93C5FD" stroke-width="10" stroke-linecap="round"/>
            <!-- Magnifying glass circle -->
            <circle cx="100" cy="90" r="40" stroke="#3B82F6" stroke-width="7" fill="white"/>
            <!-- Question mark -->
            <text x="100" y="105" text-anchor="middle" font-size="42" font-weight="800" fill="#1A56DB" font-family="sans-serif">?</text>
          </svg>
        </div>

        <div class="nf-content">
          <div class="nf-badge">404</div>
          <h1 class="nf-title">ไม่พบหน้าที่ค้นหา</h1>
          <p class="nf-desc">หน้าที่คุณกำลังมองหาไม่มีอยู่<br>หรืออาจถูกย้ายไปแล้ว<br><small style="color:#94a3b8">กำลังพาคุณกลับหน้าแรกใน 5 วินาที...</small></p>
          <div class="nf-actions">
            <router-link to="/" class="btn btn-primary">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              กลับหน้าแรก
            </router-link>
            <router-link to="/courses" class="btn btn-outline">ดูคอร์สทั้งหมด</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage',
  mounted() {
    // 5 วินาทีแล้ว redirect กลับหน้าแรก
    this._timer = setTimeout(() => { this.$router.push('/') }, 5000)
  },
  beforeUnmount() {
    clearTimeout(this._timer)
  }
}
</script>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  padding: 60px 0;
}

.nf-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 32px;
}

.nf-illustration {
  flex-shrink: 0;
}

.nf-svg {
  width: 180px;
  height: 162px;
  filter: drop-shadow(0 8px 24px rgba(26,86,219,0.12));
}

.nf-badge {
  display: inline-block;
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #1a56db, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.nf-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--dark);
  margin: 0 0 10px;
}

.nf-desc {
  font-size: 15px;
  color: var(--gray);
  line-height: 1.7;
  margin: 0 0 28px;
}

.nf-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.nf-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

@media (max-width: 480px) {
  .nf-badge { font-size: 56px; }
  .nf-title { font-size: 22px; }
  .nf-actions { flex-direction: column; align-items: center; }
  .nf-actions .btn { width: 200px; justify-content: center; }
}
</style>
