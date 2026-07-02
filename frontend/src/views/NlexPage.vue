<template>
  <div class="nlex-page">
    <!-- Loading: แสดง bg เดียวกันทันทีขณะ LIFF init -->
    <div v-if="loading" class="nlex-loading">
      <div class="nlex-loading-spinner"></div>
    </div>

    <div v-else class="nlex-page-card">
      <!-- Welcome user (LIFF profile) -->
      <div v-if="profile" class="nlex-welcome">
        <img :src="profile.pictureUrl" :alt="profile.displayName" class="nlex-avatar" />
        <div class="nlex-welcome-text">
          <p class="nlex-welcome-label">ยินดีต้อนรับ</p>
          <h2 class="nlex-welcome-name">คุณ{{ profile.displayName }}</h2>
        </div>
      </div>

      <div class="nlex-box">
        <div class="nlex-left">
          <div class="nlex-logo">NLEX</div>
          <div class="nlex-badge-red">NEW SYSTEM</div>
        </div>
        <div class="nlex-center">
          <div class="nlex-big-num">ระบบตะลุยข้อสอบ</div>
          <div class="nlex-big-num">10,000+ <span>ข้อ</span></div>
          <div class="nlex-sub-red">เยอะที่สุดในไทย! พร้อมเฉลยละเอียด</div>
        </div>
        <div class="nlex-right">
          <ul class="nlex-features">
            <li>&#10013;&#65039; <b>MEQ REALTIME</b> ตรวจทันที</li>
            <li>&#128202; <b>วิเคราะห์จุดอ่อน</b> รายบุคคล</li>
            <li>&#128293; <b>Integrated</b> NL1+2 ระบบใหม่</li>
          </ul>
        </div>
      </div>

      <div class="nlex-coming">
        <div class="nlex-coming-icon">&#128640;</div>
        <h3>พบกันเร็วๆ นี้</h3>
        <p>นักเรียนที่สมัครคอร์ส NL1+2 ระบบใหม่ ใช้ฟรีทันที</p>
      </div>

      <div class="nlex-footer">
        <img src="/logo.png" alt="MedNinja" class="nlex-footer-logo" />
        <span>MedNinja Academy</span>
      </div>

      <!-- Debug (ลบทีหลัง) -->
      <div v-if="debug" class="nlex-debug">
        <p v-for="(line, i) in debug" :key="i">{{ line }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import liff from '@line/liff'

const NLEX_LIFF_ID = '2009259048-HbJI6ttt'

export default {
  name: 'NlexPage',
  data() {
    return {
      profile: null,
      loading: true,
      debug: []
    }
  },
  async mounted() {
    const log = (msg) => { this.debug.push(msg); console.log('[NLEX]', msg) }
    try {
      log('1. liff.init start...')
      await liff.init({ liffId: NLEX_LIFF_ID })
      log('2. liff.init OK')
      log('3. isInClient: ' + liff.isInClient())
      log('4. isLoggedIn: ' + liff.isLoggedIn())
      log('5. OS: ' + liff.getOS())
      log('6. context: ' + JSON.stringify(liff.getContext()))

      if (!liff.isLoggedIn()) {
        log('7. Not logged in → calling liff.login()')
        liff.login()
        return
      }

      log('7. Fetching profile...')
      this.profile = await liff.getProfile()
      log('8. Profile OK: ' + this.profile.displayName)
    } catch (e) {
      log('ERR: ' + e.message)
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
.nlex-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  padding: 24px;
}

/* Loading state — แสดงทันทีไม่ให้เห็น navbar/footer กระพริบ */
.nlex-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}
.nlex-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: nlex-spin 0.7s linear infinite;
}
@keyframes nlex-spin {
  to { transform: rotate(360deg); }
}

.nlex-page-card {
  background: white;
  border-radius: 20px;
  padding: 40px 32px 32px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

/* Welcome */
.nlex-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}
.nlex-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #a78bfa;
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
}
.nlex-welcome-label {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 2px;
  font-weight: 500;
}
.nlex-welcome-name {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

/* NLEX Box */
.nlex-box {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  color: white;
  margin-bottom: 24px;
}
.nlex-left { flex-shrink: 0; text-align: center; }
.nlex-logo {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #a78bfa;
  margin-bottom: 6px;
}
.nlex-badge-red {
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.06em;
}
.nlex-center { flex: 1; }
.nlex-big-num {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
}
.nlex-big-num span { color: #c4b5fd; }
.nlex-sub-red {
  color: #fca5a5;
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
}
.nlex-right { flex-shrink: 0; }
.nlex-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nlex-features li {
  font-size: 12px;
  color: #e2e8f0;
  line-height: 1.4;
}
.nlex-features b { color: white; }

/* Coming Soon */
.nlex-coming {
  text-align: center;
  padding: 8px 0 24px;
}
.nlex-coming-icon {
  font-size: 40px;
  margin-bottom: 8px;
}
.nlex-coming h3 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}
.nlex-coming p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

/* Footer branding */
.nlex-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
.nlex-footer-logo {
  height: 24px;
  width: auto;
  opacity: 0.6;
}
.nlex-footer span {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

/* Debug */
.nlex-debug {
  margin-top: 16px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-family: monospace;
  font-size: 11px;
  color: #475569;
  line-height: 1.6;
}
.nlex-debug p { margin: 0; }

@media (max-width: 480px) {
  .nlex-page { padding: 16px; }
  .nlex-page-card { padding: 28px 20px 24px; }
  .nlex-box {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
}
</style>
