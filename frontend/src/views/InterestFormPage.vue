<template>
  <div class="interest-page">
    <div class="container">
      <div class="interest-card">
        <!-- Header -->
        <div class="interest-header">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <h1>สนใจสมัครเรียน</h1>
          <p>กรอกข้อมูลเพื่อให้ทีมงาน MedNinja ติดต่อกลับ</p>
        </div>

        <!-- Form -->
        <form v-if="!submitted" @submit.prevent="handleSubmit" class="interest-form">
          <div v-if="error" class="alert-error">{{ error }}</div>

          <div class="form-group">
            <label class="form-label">ชื่อ</label>
            <input
              v-model="form.firstName"
              type="text"
              class="form-control"
              placeholder="ชื่อจริง"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label class="form-label">สกุล</label>
            <input
              v-model="form.lastName"
              type="text"
              class="form-control"
              placeholder="นามสกุล"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label class="form-label">มหาวิทยาลัยที่กำลังศึกษา</label>
            <input
              v-model="form.university"
              type="text"
              class="form-control"
              placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย"
              maxlength="200"
            />
          </div>

          <div class="form-group">
            <label class="form-label">คอร์สที่สนใจ</label>
            <div class="course-options">
              <label
                v-for="c in courseOptions"
                :key="c"
                class="course-checkbox"
                :class="{ active: form.courses.includes(c) }"
              >
                <input type="checkbox" v-model="form.courses" :value="c" />
                <span class="check-icon">
                  <svg v-if="form.courses.includes(c)" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                  </svg>
                </span>
                <span class="check-label">{{ c }}</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'กำลังส่ง...' : 'ส่งข้อมูล' }}
          </button>
        </form>

        <!-- Success state -->
        <div v-else class="interest-success">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2>ส่งข้อมูลสำเร็จ!</h2>
          <p>ทีมงาน MedNinja จะติดต่อกลับโดยเร็ว</p>
          <router-link to="/courses" class="btn-outline">ดูคอร์สเรียน</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'InterestFormPage',
  data() {
    return {
      form: {
        firstName: '',
        lastName: '',
        university: '',
        courses: []
      },
      courseOptions: ['NL1+2', 'MEQ', 'OSCE'],
      loading: false,
      error: '',
      submitted: false
    }
  },
  computed: {
    isFormValid() {
      return (
        this.form.firstName.trim() &&
        this.form.lastName.trim() &&
        this.form.university.trim() &&
        this.form.courses.length > 0
      )
    }
  },
  methods: {
    async handleSubmit() {
      this.error = ''
      this.loading = true
      try {
        await api.post('/interest/submit', this.form)
        this.submitted = true
      } catch (err) {
        this.error = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.interest-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f4f8 100%);
  padding: 40px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.interest-card {
  max-width: 520px;
  width: 100%;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
  margin: 0 auto;
}

/* Header */
.interest-header {
  text-align: center;
  margin-bottom: 32px;
}
.header-icon {
  width: 64px;
  height: 64px;
  background: #eef2ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--primary, #0f172a);
}
.interest-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary, #0f172a);
  margin: 0 0 6px;
}
.interest-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Form */
.interest-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary, #0f172a);
}
.form-control {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
}
.form-control:focus {
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #fff;
}
.form-control::placeholder {
  color: #94a3b8;
}

/* Course checkboxes */
.course-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.course-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8fafc;
  user-select: none;
  flex: 1;
  min-width: 120px;
  justify-content: center;
}
.course-checkbox:hover {
  border-color: var(--accent, #3b82f6);
}
.course-checkbox.active {
  border-color: var(--accent, #3b82f6);
  background: #eef2ff;
}
.course-checkbox input {
  display: none;
}
.check-icon {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.course-checkbox.active .check-icon {
  background: var(--accent, #3b82f6);
  border-color: var(--accent, #3b82f6);
  color: #fff;
}
.check-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary, #0f172a);
}

/* Submit button */
.btn-submit {
  width: 100%;
  padding: 14px;
  background: var(--primary, #0f172a);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

/* Success */
.interest-success {
  text-align: center;
  padding: 20px 0;
}
.success-icon {
  width: 80px;
  height: 80px;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #10b981;
}
.interest-success h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--primary, #0f172a);
  margin: 0 0 8px;
}
.interest-success p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
}
.btn-outline {
  display: inline-block;
  padding: 12px 28px;
  border: 2px solid var(--primary, #0f172a);
  color: var(--primary, #0f172a);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: var(--primary, #0f172a);
  color: #fff;
}

/* Mobile */
@media (max-width: 768px) {
  .interest-page { padding: 20px 12px; }
  .interest-card { padding: 28px 20px; }
  .interest-header h1 { font-size: 20px; }
  .course-options { flex-direction: column; }
  .course-checkbox { min-width: unset; }
}
</style>
