<template>
  <div class="profile-page">
    <!-- Profile Hero -->
    <div class="profile-hero">
      <div class="container">
        <div class="profile-hero-inner">
          <div class="profile-avatar-lg">
            {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="profile-hero-info">
            <h1>{{ authStore.user?.name || 'ผู้ใช้งาน' }}</h1>
            <p>{{ authStore.user?.email }}</p>
            <span class="role-badge">{{ authStore.isAdmin ? 'ผู้ดูแลระบบ' : 'นักเรียน' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Tabs -->
      <div class="profile-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-pill"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="'span'" class="tab-icon">
            <svg v-if="tab.key === 'profile'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path stroke-linecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </component>
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab: Profile -->
      <div v-if="activeTab === 'profile'" class="card">
        <div class="card-body" style="padding: 32px;">
          <h2 style="margin-bottom: 20px;">ข้อมูลส่วนตัว</h2>
          <AlertMessage :message="success" type="success" />
          <AlertMessage :message="error" type="error" />

          <form @submit.prevent="handleUpdate">
            <div class="grid grid-2">
              <div class="form-group">
                <label>ชื่อ-นามสกุล</label>
                <input v-model="form.name" type="text" class="form-control" required />
              </div>
              <div class="form-group">
                <label>อีเมล</label>
                <input v-model="form.email" type="email" class="form-control" disabled />
              </div>
              <div class="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input v-model="form.phone" type="tel" class="form-control" placeholder="08X-XXX-XXXX" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Tab: Change Password -->
      <div v-else-if="activeTab === 'password'" class="card">
        <div class="card-body" style="padding: 32px; max-width: 480px;">
          <h2 style="margin-bottom: 20px;">เปลี่ยนรหัสผ่าน</h2>
          <AlertMessage :message="pwSuccess" type="success" />
          <AlertMessage :message="pwError" type="error" />

          <form @submit.prevent="handleChangePassword">
            <div class="form-group">
              <label>รหัสผ่านปัจจุบัน</label>
              <input v-model="pwForm.currentPassword" type="password" class="form-control" required autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label>รหัสผ่านใหม่</label>
              <input v-model="pwForm.newPassword" type="password" class="form-control" required minlength="6" autocomplete="new-password" />
              <small style="color:var(--gray);">อย่างน้อย 6 ตัวอักษร</small>
            </div>
            <div class="form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input v-model="pwForm.confirmPassword" type="password" class="form-control" required autocomplete="new-password" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="pwLoading">
              {{ pwLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import authService from '../services/authService'
import AlertMessage from '../components/common/AlertMessage.vue'

export default {
  name: 'ProfilePage',
  components: { AlertMessage },
  data() {
    return {
      activeTab: 'profile',
      tabs: [
        { key: 'profile', label: 'ข้อมูลส่วนตัว' },
        { key: 'password', label: 'เปลี่ยนรหัสผ่าน' }
      ],
      form: { name: '', email: '', phone: '' },
      loading: false,
      error: '',
      success: '',
      pwForm: { currentPassword: '', newPassword: '', confirmPassword: '' },
      pwLoading: false,
      pwError: '',
      pwSuccess: ''
    }
  },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  mounted() {
    if (this.authStore.user) {
      this.form.name = this.authStore.user.name
      this.form.email = this.authStore.user.email
      this.form.phone = this.authStore.user.phone || ''
    }
  },
  methods: {
    async handleUpdate() {
      this.loading = true
      this.error = ''
      this.success = ''
      try {
        await authService.updateProfile({ name: this.form.name, phone: this.form.phone })
        await this.authStore.fetchProfile()
        this.success = 'บันทึกข้อมูลเรียบร้อย'
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ'
      } finally {
        this.loading = false
      }
    },
    async handleChangePassword() {
      this.pwError = ''
      this.pwSuccess = ''
      if (this.pwForm.newPassword !== this.pwForm.confirmPassword) {
        this.pwError = 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'
        return
      }
      this.pwLoading = true
      try {
        await authService.changePassword({
          currentPassword: this.pwForm.currentPassword,
          newPassword: this.pwForm.newPassword
        })
        this.pwSuccess = 'เปลี่ยนรหัสผ่านเรียบร้อย'
        this.pwForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
      } catch (err) {
        this.pwError = err.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ'
      } finally {
        this.pwLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* ── Profile Hero ── */
.profile-hero {
  background: linear-gradient(135deg, #1e3a5f 0%, #1a56db 60%, #0ea5e9 100%);
  padding: 40px 0 36px;
  color: white;
}
.profile-hero-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}
.profile-avatar-lg {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.profile-hero-info h1 {
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin-bottom: 3px;
}
.profile-hero-info p {
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 8px;
}
.role-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.03em;
}

/* ── Tabs ── */
.profile-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border: 1.5px solid var(--border);
  border-radius: 999px;
  background: var(--white);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray);
  transition: all var(--transition-fast);
}
.tab-pill svg { flex-shrink: 0; }
.tab-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}
.tab-pill.active {
  border-color: var(--primary);
  background: var(--primary);
  color: white;
}
.tab-pill.active svg { color: white; }

</style>
