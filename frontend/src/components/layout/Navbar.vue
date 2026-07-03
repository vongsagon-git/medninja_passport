<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="container navbar-inner">
      <router-link to="/" class="navbar-brand" @click="closeMenu">
        <img src="/logo.png" alt="MedNinja" class="navbar-logo" />
        <span>MedNinja</span>
      </router-link>

      <!-- Desktop Menu -->
      <div class="navbar-menu desktop-menu">
        <template v-if="authStore.isLoggedIn">
          <router-link to="/my" class="nav-link">หน้าเรียน</router-link>
          <button class="nav-link nav-link-nlex" @click="openNlex">NLEX</button>
          <button class="nav-link nav-link-meqex" @click="openMeqex">MEQEX</button>
          <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link nav-link-admin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            จัดการระบบ
          </router-link>
          <div class="nav-user">
            <router-link to="/my" class="nav-avatar" :title="authStore.user?.name">
              <span class="avatar-letter">{{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
            </router-link>
            <button class="btn btn-outline btn-sm" @click="handleLogout">ออกจากระบบ</button>
          </div>
        </template>

        <template v-else>
          <button class="btn btn-primary btn-sm nav-passport-btn" @click="openLogin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
            เข้าสู่ระบบ Ninja Passport
          </button>
        </template>
      </div>

      <!-- Hamburger -->
      <button
        class="navbar-toggle"
        :class="{ open: menuOpen }"
        @click="menuOpen = !menuOpen"
        :aria-label="menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'"
      >
        <span class="bar bar-1"></span>
        <span class="bar bar-2"></span>
        <span class="bar bar-3"></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ open: menuOpen }" @click.self="closeMenu">
      <div class="mobile-menu-inner">
        <!-- User info on mobile -->
        <div v-if="authStore.isLoggedIn" class="mobile-user-section">
          <div class="mobile-avatar">{{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}</div>
          <div>
            <div class="mobile-user-name">{{ authStore.user?.name }}</div>
            <div class="mobile-user-role">{{ authStore.isAdmin ? 'ผู้ดูแลระบบ' : 'นักเรียน' }}</div>
          </div>
        </div>

        <nav class="mobile-nav">
          <a href="#" class="mobile-nav-link mobile-nav-nlex" @click.prevent="closeMenu(); openNlex()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.167 3.167 0 00-.504.658l-1.527 2.8a.75.75 0 01-.664.396h-.082a.75.75 0 01-.717-.53l-.607-2.024a3.168 3.168 0 00-.693-1.187l-2.407-2.407a.75.75 0 01-.22-.53V12.5m0 0L5 14.5m4.75-2H5"/></svg>
            NLEX ตะลุยข้อสอบ
          </a>
          <a href="#" class="mobile-nav-link mobile-nav-meqex" @click.prevent="closeMenu(); openMeqex()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            MEQEX ฝึกทำ MEQ
          </a>
          <template v-if="authStore.isLoggedIn">
            <router-link to="/my" class="mobile-nav-link" @click="closeMenu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"/></svg>
              หน้าเรียน
            </router-link>
            <router-link to="/my" class="mobile-nav-link" @click="closeMenu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              โปรไฟล์
            </router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" class="mobile-nav-link" @click="closeMenu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              จัดการระบบ
            </router-link>
          </template>
        </nav>

        <div class="mobile-menu-footer">
          <template v-if="authStore.isLoggedIn">
            <button class="btn btn-outline btn-block" @click="handleLogout">ออกจากระบบ</button>
          </template>
          <template v-else>
            <button class="btn btn-primary btn-block" @click="closeMenu(); openLogin()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:-2px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
              เข้าสู่ระบบ Ninja Passport
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div class="nav-backdrop" :class="{ show: menuOpen }" @click="closeMenu"></div>

    <!-- NLEX Modal -->
    <!-- NLEX modal removed — ไปหน้า /my/nlex ตรง -->
  </nav>
</template>

<script>
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Navbar',
  data() {
    return {
      menuOpen: false,
      isScrolled: false,
      nlexModalOpen: false // kept for compat
    }
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    return { authStore, router }
  },
  mounted() {
    this._scrollHandler = () => {
      this.isScrolled = window.scrollY > 20
    }
    window.addEventListener('scroll', this._scrollHandler, { passive: true })
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this._scrollHandler)
  },
  methods: {
    closeMenu() {
      this.menuOpen = false
    },
    openLogin() {
      this.authStore.loginModalOpen = true
    },
    async openNlex() {
      if (!this.authStore.isLoggedIn) {
        this.authStore.loginModalOpen = true
        return
      }
      try {
        const api = (await import('../../services/api')).default
        const data = await api.post('/auth/handoff/code', { target: 'nlex' })
        const url = import.meta.env.VITE_NLEX_URL || 'https://nlex.medninja.academy'
        window.location.href = `${url}/auth/handoff?code=${data.code}`
      } catch {
        alert('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่')
      }
    },
    async openMeqex() {
      if (!this.authStore.isLoggedIn) {
        this.authStore.loginModalOpen = true
        return
      }
      const meqexUrl = import.meta.env.VITE_MEQEX_URL || 'https://meqex.medninja.academy'
      try {
        const api = (await import('../../services/api')).default
        const data = await api.post('/auth/handoff/code', { target: 'meqex' })
        window.location.href = `${meqexUrl}/auth/handoff?code=${data.code}`
      } catch {
        alert('ไม่สามารถเชื่อมต่อ MEQEX ได้ กรุณาลองใหม่')
      }
    },
    handleLogout() {
      this.authStore.logout()
      this.closeMenu()
      this.router.push('/')
    }
  },
  watch: {
    menuOpen(val) {
      document.body.style.overflow = val ? 'hidden' : ''
    }
  }
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 200;
  transition: box-shadow var(--transition-base), border-color var(--transition-base);
}
.navbar.scrolled {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-color: transparent;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.navbar-logo {
  height: 36px;
  width: auto;
}

/* Desktop Nav */
.desktop-menu {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 13px;
  color: var(--gray);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.nav-link:hover {
  background: var(--gray-light);
  color: var(--primary);
}
.nav-link.router-link-active {
  color: var(--primary);
  background: var(--primary-light);
}
.nav-link-demo { color: #059669; }
.nav-link-demo:hover { background: #ecfdf5; color: #047857; }
.nav-link-demo.router-link-active { background: #ecfdf5; color: #047857; }
.nav-link-nlex {
  background: none;
  border: 1.5px solid #a855f7;
  color: #9333ea;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}
.nav-link-nlex:hover { background: #f5f3ff; color: #7c3aed; }
.nav-link-meqex {
  background: none;
  border: 1.5px solid #f43f5e;
  color: #e11d48;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}
.nav-link-meqex:hover { background: #fff1f2; color: #be123c; }
.mobile-nav-nlex { color: #9333ea !important; }
.mobile-nav-nlex svg { color: #9333ea !important; }
.mobile-nav-meqex { color: #e11d48 !important; }
.mobile-nav-meqex svg { color: #e11d48 !important; }

.nav-link-admin { color: var(--warning); }
.nav-link-admin:hover { background: #fef3c7; }
.nav-link-admin.router-link-active { background: #fef3c7; color: #92400e; }

/* Passport / login button (desktop) */
.nav-passport-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--border);
}

.nav-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  flex-shrink: 0;
}
.nav-avatar:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 3px var(--primary-light);
}
.avatar-letter {
  color: white;
  font-size: 14px;
  font-weight: 700;
}

/* ─── Hamburger ─── */
.navbar-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: var(--radius);
  transition: background var(--transition-fast);
  position: relative;
  z-index: 300;
}
.navbar-toggle:hover { background: var(--gray-light); }

.bar {
  display: block;
  width: 22px;
  height: 2.5px;
  background: var(--dark);
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease, top 0.3s ease;
  position: absolute;
}
.bar-1 { top: 13px; }
.bar-2 { top: 19px; }
.bar-3 { top: 25px; }

.navbar-toggle.open .bar-1 {
  transform: rotate(45deg);
  top: 19px;
}
.navbar-toggle.open .bar-2 {
  opacity: 0;
  transform: scaleX(0);
}
.navbar-toggle.open .bar-3 {
  transform: rotate(-45deg);
  top: 19px;
}

/* ─── Mobile Menu ─── */
.mobile-menu {
  display: none;
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 199;
  pointer-events: none;
}
.mobile-menu-inner {
  background: var(--white);
  height: fit-content;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 8px 0 24px;
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.28s ease;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  pointer-events: none;
}
.mobile-menu.open { pointer-events: auto; }
.mobile-menu.open .mobile-menu-inner {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

/* User section */
.mobile-user-section {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--gray-lighter);
  margin-bottom: 8px;
}
.mobile-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}
.mobile-user-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--dark);
}
.mobile-user-role {
  font-size: 12px;
  color: var(--gray);
  margin-top: 2px;
}

/* Mobile nav links */
.mobile-nav {
  padding: 8px 12px;
}
.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  color: var(--dark);
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-lg);
  transition: background var(--transition-fast), color var(--transition-fast);
  margin-bottom: 4px;
}
.mobile-nav-link svg { color: var(--gray); flex-shrink: 0; }
.mobile-nav-link:hover {
  background: var(--primary-light);
  color: var(--primary);
}
.mobile-nav-link:hover svg { color: var(--primary); }
.mobile-nav-link.router-link-active {
  background: var(--primary-light);
  color: var(--primary);
}
.mobile-nav-link.router-link-active svg { color: var(--primary); }

/* Footer actions */
.mobile-menu-footer {
  padding: 16px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

/* Backdrop */
.nav-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  top: 64px;
  background: rgba(15, 23, 42, 0.5);
  z-index: 198;
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.nav-backdrop.show {
  opacity: 1;
}

/* ─── NLEX Modal ─── */
.nlex-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 24px;
}
.nlex-modal-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 40px 32px 32px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
}
.nlex-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.nlex-close:hover {
  background: #e2e8f0;
  color: #0f172a;
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
  padding: 8px 0 0;
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

/* NLEX transition */
.nlex-modal-enter-active { transition: opacity 0.25s ease; }
.nlex-modal-enter-active .nlex-modal-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.nlex-modal-leave-active { transition: opacity 0.2s ease; }
.nlex-modal-leave-active .nlex-modal-card {
  transition: transform 0.2s ease, opacity 0.15s ease;
}
.nlex-modal-enter-from { opacity: 0; }
.nlex-modal-enter-from .nlex-modal-card { transform: scale(0.92) translateY(20px); opacity: 0; }
.nlex-modal-leave-to { opacity: 0; }
.nlex-modal-leave-to .nlex-modal-card { transform: scale(0.95); opacity: 0; }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .desktop-menu { display: none; }
  .navbar-toggle { display: flex; }
  .mobile-menu { display: block; }
  .nav-backdrop { display: block; }
  .nlex-box {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
  .nlex-modal-card { padding: 32px 20px 24px; }
}
</style>
