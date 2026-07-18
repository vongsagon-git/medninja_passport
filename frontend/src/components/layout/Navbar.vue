<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="container navbar-inner">
      <router-link :to="brandTo" class="navbar-brand">
        <img src="/logo.png" alt="MedNinja" class="navbar-logo" />
        <span>MedNinja</span>
      </router-link>

      <button
        v-if="authStore.isLoggedIn"
        class="btn btn-outline btn-sm"
        @click="handleLogout"
      >ออกจากระบบ</button>
      <button
        v-else
        class="btn btn-primary btn-sm"
        @click="openLogin"
      >เข้าสู่ระบบ</button>
    </div>
  </nav>
</template>

<script>
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Navbar',
  data() {
    return {
      isScrolled: false,
      brandTo: '/my'
    }
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    return { authStore, router }
  },
  async mounted() {
    // Country → /my หรือ /my-cn (ปล่อย Guard เป็นคน redirect ถ้า path ไม่ตรง)
    try {
      const resp = await fetch('/api/geo/whoami').then(r => r.json())
      this.brandTo = resp.country === 'CN' ? '/my-cn' : '/my'
    } catch { this.brandTo = '/my' }

    this._scrollHandler = () => {
      this.isScrolled = window.scrollY > 20
    }
    window.addEventListener('scroll', this._scrollHandler, { passive: true })
  },
  beforeUnmount() {
    if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler)
  },
  methods: {
    openLogin() { this.$router.push('/') },
    async handleLogout() {
      await this.authStore.logout()
      // ⭐ Full reload — เคลียร์ shell + reactive state ทั้งหมด
      window.location.href = '/'
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
  top: var(--country-banner-h, 28px);
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
  height: 56px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}
.navbar-logo {
  height: 30px;
  width: auto;
}
</style>
