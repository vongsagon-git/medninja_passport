<template>
  <div class="auth-page">
    <!-- Left brand panel -->
    <div class="auth-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <img src="/logo.png" alt="MedNinja" />
        </div>
        <h2>ยืนยันตัวตน<br>ก่อนเริ่มเรียน</h2>
        <p>เพื่อความปลอดภัยของบัญชีและการออกใบรับรอง กรุณากรอกข้อมูลให้ครบถ้วนก่อนเข้าใช้งานระบบ</p>
        <ul class="brand-features">
          <li>
            <span class="feat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </span>
            ใช้ยืนยันตัวตนกับสถาบัน
          </li>
          <li>
            <span class="feat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            จำเป็นสำหรับออกใบรับรองผล
          </li>
          <li>
            <span class="feat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </span>
            ข้อมูลถูกเข้ารหัสและปลอดภัย
          </li>
        </ul>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="auth-form-panel">
      <div class="auth-card">
        <div class="auth-header">
          <h2>กรอกข้อมูลส่วนตัว</h2>
          <p>กรุณากรอกข้อมูลให้ครบถ้วนเพื่อเปิดใช้งานบัญชี</p>
        </div>

        <div class="profile-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <span>ข้อมูลนี้จะไม่สามารถแก้ไขเองได้ภายหลัง กรุณาตรวจสอบให้ถูกต้อง</span>
        </div>

        <AlertMessage :message="error" type="error" />
        <AlertMessage :message="success" type="success" />

        <form @submit.prevent="handleSubmit" class="auth-form">
          <!-- ชื่อ -->
          <div class="form-group">
            <label class="form-label">ชื่อ <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <input
                v-model="form.firstName"
                type="text"
                class="form-control input-with-icon"
                placeholder="เช่น สมชาย"
                required
              />
            </div>
          </div>

          <!-- นามสกุล -->
          <div class="form-group">
            <label class="form-label">นามสกุล <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <input
                v-model="form.lastName"
                type="text"
                class="form-control input-with-icon"
                placeholder="เช่น ใจดี"
                required
              />
            </div>
          </div>

          <!-- มหาวิทยาลัย -->
          <div class="form-group">
            <label class="form-label">มหาวิทยาลัย <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6.5"/></svg>
              <select
                v-model="form.university"
                class="form-control input-with-icon select-control"
                required
              >
                <option value="" disabled>-- เลือกมหาวิทยาลัย --</option>
                <option v-for="uni in universities" :key="uni" :value="uni">{{ uni }}</option>
              </select>
            </div>
          </div>

          <!-- เลขบัตรประชาชน -->
          <div class="form-group">
            <label class="form-label">เลขบัตรประชาชน <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
              <input
                v-model="nationalIdDisplay"
                type="text"
                class="form-control input-with-icon"
                placeholder="x-xxxx-xxxxx-xx-x"
                maxlength="17"
                inputmode="numeric"
                required
                @input="onNationalIdInput"
              />
            </div>
            <span class="field-hint" v-if="form.nationalId && !isNationalIdValid">กรุณากรอกให้ครบ 13 หลัก</span>
          </div>

          <!-- เบอร์โทร -->
          <div class="form-group">
            <label class="form-label">เบอร์โทรศัพท์ <span class="required">*</span></label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <input
                v-model="form.phone"
                type="tel"
                class="form-control input-with-icon"
                placeholder="0xx-xxx-xxxx"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-lg auth-submit"
            :disabled="loading || !isFormValid"
          >
            <svg v-if="loading" class="spin-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {{ loading ? 'กำลังบันทึก...' : 'ยืนยันข้อมูล' }}
          </button>
        </form>

        <p class="auth-footer">
          ต้องการออกจากระบบ?
          <a href="#" class="auth-link" @click.prevent="handleLogout">ออกจากระบบ</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import AlertMessage from '../components/common/AlertMessage.vue'

export default {
  name: 'CompleteProfilePage',
  components: { AlertMessage },

  data() {
    return {
      form: {
        firstName: '',
        lastName: '',
        university: '',
        nationalId: '',
        phone: ''
      },
      nationalIdDisplay: '',
      error: '',
      success: '',
      loading: false,
      universities: [
        'จุฬาลงกรณ์มหาวิทยาลัย',
        'มหาวิทยาลัยมหิดล',
        'มหาวิทยาลัยเชียงใหม่',
        'มหาวิทยาลัยขอนแก่น',
        'มหาวิทยาลัยสงขลานครินทร์',
        'มหาวิทยาลัยธรรมศาสตร์',
        'โรงพยาบาลรามาธิบดี',
        'มหาวิทยาลัยศรีนครินทรวิโรฒ',
        'มหาวิทยาลัยนเรศวร',
        'มหาวิทยาลัยบูรพา',
        'มหาวิทยาลัยอุบลราชธานี',
        'มหาวิทยาลัยมหาสารคาม',
        'มหาวิทยาลัยแม่ฟ้าหลวง',
        'มหาวิทยาลัยวลัยลักษณ์',
        'มหาวิทยาลัยพะเยา',
        'วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า',
        'สถาบันพระบรมราชชนก',
        'อื่นๆ'
      ]
    }
  },

  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    return { authStore, router }
  },

  computed: {
    isNationalIdValid() {
      return this.form.nationalId.length === 13
    },

    isFormValid() {
      return (
        this.form.firstName.trim() &&
        this.form.lastName.trim() &&
        this.form.university &&
        this.isNationalIdValid &&
        this.form.phone.trim()
      )
    }
  },

  created() {
    // ถ้า profileLocked แล้ว → redirect ไป /my
    if (this.authStore.isProfileComplete) {
      this.router.replace('/my')
    }
  },

  methods: {
    onNationalIdInput(e) {
      // ดึงเฉพาะตัวเลข
      const raw = e.target.value.replace(/\D/g, '').slice(0, 13)
      this.form.nationalId = raw

      // Auto-format: x-xxxx-xxxxx-xx-x
      let formatted = ''
      for (let i = 0; i < raw.length; i++) {
        if (i === 1 || i === 5 || i === 10 || i === 12) {
          formatted += '-'
        }
        formatted += raw[i]
      }
      this.nationalIdDisplay = formatted
    },

    async handleSubmit() {
      if (!this.isFormValid) return

      this.loading = true
      this.error = ''
      this.success = ''

      try {
        await this.authStore.completeProfile({
          firstName: this.form.firstName.trim(),
          lastName: this.form.lastName.trim(),
          university: this.form.university,
          nationalId: this.form.nationalId,
          phone: this.form.phone.trim()
        })

        this.success = 'บันทึกข้อมูลสำเร็จ กำลังนำคุณเข้าสู่ระบบ...'

        // Redirect หลังจากแสดง success สักครู่
        setTimeout(() => {
          this.router.replace('/my')
        }, 1200)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง'
      } finally {
        this.loading = false
      }
    },

    async handleLogout() {
      await this.authStore.logout()
      this.router.replace('/')
    }
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  min-height: calc(100vh - 64px);
}

/* ── Left brand panel ── */
.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, #1e3a5f 0%, #1a56db 60%, #0ea5e9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  color: white;
}
.brand-content {
  max-width: 360px;
}
.brand-logo img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 20px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.brand-content h2 {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.3;
  color: white;
  margin-bottom: 12px;
}
.brand-content p {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.brand-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brand-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
.feat-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Right form panel ── */
.auth-form-panel {
  flex: 0 0 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--white);
  overflow-y: auto;
}
.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  margin-bottom: 16px;
}
.auth-header h2 {
  font-size: 26px;
  font-weight: 800;
  color: var(--dark);
  margin-bottom: 4px;
}
.auth-header p {
  color: var(--gray);
  font-size: 14px;
}

/* ── Warning banner ── */
.profile-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.profile-warning svg {
  flex-shrink: 0;
  color: #d97706;
  margin-top: 1px;
}

/* ── Form ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-group {
  margin-bottom: 4px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 6px;
}

.required {
  color: var(--danger, #ef4444);
}

/* Input with icon */
.input-wrap {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray);
  pointer-events: none;
  z-index: 1;
}
.input-with-icon {
  padding-left: 40px !important;
}

/* Select dropdown styling */
.select-control {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px !important;
  cursor: pointer;
}
.select-control:invalid,
.select-control option[value=""] {
  color: var(--gray);
}

/* Field hint (validation) */
.field-hint {
  display: block;
  font-size: 12px;
  color: var(--danger, #ef4444);
  margin-top: 4px;
}

/* ── Submit button ── */
.auth-submit {
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  padding: 14px;
}
.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon-sm {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ── */
.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--gray);
}
.auth-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.auth-link:hover {
  text-decoration: underline;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .auth-page {
    flex-direction: column;
  }
  .auth-brand {
    padding: 32px 24px;
  }
  .auth-form-panel {
    flex: none;
    padding: 32px 20px;
  }
  .profile-warning {
    font-size: 12px;
  }
}
</style>
