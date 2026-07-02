<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-brand">
          <p class="footer-company">บริษัท เมดนินจา จำกัด</p>
          <p class="footer-company-en">MEDNINJA CO., LTD.</p>
          <p class="footer-reg">เลขทะเบียน 0105568223571</p>
          <div class="footer-social">
            <a href="https://www.facebook.com/medninjaacademy/" target="_blank" rel="noopener" class="social-btn social-fb" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="mailto:admin@medninja.academy" class="social-btn social-email" title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </a>
          </div>
        </div>

        <!-- Menu -->
        <div class="footer-links">
          <h4>เมนู</h4>
          <router-link to="/courses">
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z"/></svg>
            คอร์สเรียน
          </router-link>
          <a href="#" @click.prevent="openLogin">
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd"/></svg>
            เข้าสู่ระบบ
          </a>
          <router-link to="/ninja-passport">
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z"/></svg>
            Ninja Passport
          </router-link>
        </div>

        <!-- Contact -->
        <div class="footer-links">
          <h4>ติดต่อเรา</h4>
          <a href="tel:0627597473">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
            062-759-7473
          </a>
          <a href="mailto:admin@medninja.academy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            admin@medninja.academy
          </a>
          <a href="https://www.facebook.com/medninjaacademy/" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook: MedNinja Academy
          </a>
          <a href="https://www.medninja.academy" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            www.medninja.academy
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ year }} MedNinja. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script>
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'AppFooter',
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  computed: {
    year() {
      return new Date().getFullYear()
    }
  },
  methods: {
    openLogin() {
      this.authStore.loginModalOpen = true
    }
  }
}
</script>

<style scoped>
.footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 48px 0 0;
  margin-top: auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
}

.footer-company {
  color: white;
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.footer-company-en {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px;
}
.footer-reg {
  color: #64748b;
  font-size: 12px;
  margin: 0 0 20px;
}

.footer-desc {
  font-size: 13px;
  line-height: 1.7;
  color: #94a3b8;
  margin-bottom: 20px;
}

/* Social icons */
.footer-social {
  display: flex;
  gap: 8px;
}
.social-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: white;
  transition: opacity 0.2s, transform 0.2s;
}
.social-btn:hover {
  opacity: 0.85;
  transform: translateY(-2px);
}
.social-line  { background: #06c755; }
.social-fb    { background: #1877f2; }
.social-email { background: #475569; }

/* Links */
.footer-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-links h4 {
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.footer-links a,
.footer-links span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover { color: white; }

.footer-bottom {
  border-top: 1px solid #1e293b;
  margin-top: 40px;
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: #475569;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>
