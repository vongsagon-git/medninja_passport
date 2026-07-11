<template>
  <div class="admin">
    <!-- Admin Hero -->
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <h1>Admin Dashboard</h1>
            <p>จัดการระบบ MedNinja LMS</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <div v-if="loading" class="stats-loading">
        <div class="skeleton-stat" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else-if="statsError" style="padding: 24px; text-align: center; color: var(--danger); background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24" style="margin-bottom: 8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <p style="font-weight:600; margin-bottom:4px;">โหลดสถิติไม่สำเร็จ</p>
        <p style="font-size:13px; color: var(--gray);">{{ statsError }}</p>
        <button class="btn btn-outline" style="margin-top:12px; font-size:13px;" @click="fetchStats">ลองใหม่</button>
      </div>

      <div v-else>
        <!-- ═══ User breakdown tabs ═══ -->
        <div class="user-tabs">
          <router-link to="/admin/passport" class="user-tab tab-admin">
            <span class="tab-label">Admin</span>
            <span class="tab-count">{{ userBreakdown.admin }}</span>
          </router-link>
          <router-link to="/admin/passport" class="user-tab tab-staff">
            <span class="tab-label">Staff</span>
            <span class="tab-count">{{ userBreakdown.staff }}</span>
          </router-link>
          <router-link to="/admin/passport" class="user-tab tab-student">
            <span class="tab-label">Student</span>
            <span class="tab-count">{{ userBreakdown.student }}</span>
          </router-link>
          <router-link to="/admin/passport" class="user-tab tab-demo" title="ยังไม่เคยลงคอร์ส">
            <span class="tab-label">ยังไม่ลงคอร์ส</span>
            <span class="tab-count">{{ userBreakdown.demo }}</span>
          </router-link>
        </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-number">{{ stats.packages.toLocaleString() }}</span>
            <span class="stat-label">คอร์สทั้งหมด</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-number">{{ stats.activations.toLocaleString() }}</span>
            <span class="stat-label">การเปิดสิทธิ์</span>
          </div>
        </div>

      </div>
      </div>

      <!-- ═══ PASSPORT CONTROL ═══ -->
      <div class="nav-section">
        <div class="nav-section-header">
          <div class="nav-section-icon passport-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
          </div>
          <h2>PASSPORT CONTROL</h2>
        </div>
        <div class="admin-nav-grid">
          <router-link to="/admin/passport" class="admin-nav-card">
            <div class="nav-icon nav-icon-passport">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/>
              </svg>
            </div>
            <div class="nav-content">
              <h3>Ninja Passport</h3>
              <p>ลงทะเบียนกลาง (OCR)</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/activations" class="admin-nav-card">
            <div class="nav-icon nav-icon-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div class="nav-content">
              <h3>เปิดสิทธิ์เข้าเรียน</h3>
              <p>Activate / ต่ออายุ / ยกเลิก</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

        </div>
      </div>

      <!-- ═══ LMS CONTROL ═══ -->
      <div class="nav-section">
        <div class="nav-section-header">
          <div class="nav-section-icon lms-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h2>LMS CONTROL</h2>
        </div>
        <div class="admin-nav-grid">
          <router-link to="/admin/packages" class="admin-nav-card">
            <div class="nav-icon nav-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="nav-content">
              <h3>จัดการ Packages</h3>
              <p>เนื้อหา VDO + เชื่อม Visa (Content)</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/sections" class="admin-nav-card">
            <div class="nav-icon nav-icon-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.883v6.234a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="nav-content">
              <h3>จัดการวีดีโอ</h3>
              <p>Sections + วีดีโอแต่ละวิชา</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/content-library" class="admin-nav-card">
            <div class="nav-icon" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;">
              <span style="font-size:22px;line-height:1;">📚</span>
            </div>
            <div class="nav-content">
              <h3>Content Library</h3>
              <p>คลัง video ครบ 4 fields — reuse ตอนสร้าง Section</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/watch-debug" class="admin-nav-card">
            <div class="nav-icon" style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;">
              <span style="font-size:22px;line-height:1;">🔍</span>
            </div>
            <div class="nav-content">
              <h3>Watch Debug</h3>
              <p>Session trace — จับได้แม้หน้าค้าง (iOS+CN debug)</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/self-checks" class="admin-nav-card">
            <div class="nav-icon" style="background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff;">
              <span style="font-size:22px;line-height:1;">📋</span>
            </div>
            <div class="nav-content">
              <h3>Self Check Templates</h3>
              <p>Checklist เช็คความเข้าใจประจำหัวข้อ</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/checklist-analytics" class="admin-nav-card">
            <div class="nav-icon" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#fff;">
              <span style="font-size:22px;line-height:1;">📊</span>
            </div>
            <div class="nav-content">
              <h3>Self Check Analytic</h3>
              <p>ดูว่านักเรียนเข้าใจ/ไม่เข้าใจอะไร</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/pdf-library" class="admin-nav-card">
            <div class="nav-icon nav-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <div class="nav-content">
              <h3>PDF Library</h3>
              <p>จัดการไฟล์ PDF — upload, rename, ลบ, ดูว่าใช้ที่ไหน</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

          <router-link to="/admin/pdf-center" class="admin-nav-card">
            <div class="nav-icon nav-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <div class="nav-content">
              <h3>PDF Download Center</h3>
              <p>ติดตามการดาวน์โหลด + หลักฐานทางกฎหมาย</p>
            </div>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </router-link>

        </div>
      </div>

    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      loading: false,
      statsError: '',
      stats: {
        packages: 0,
        activations: 0
      },
      userBreakdown: { admin: 0, staff: 0, student: 0, demo: 0 }
    }
  },
  async mounted() {
    await this.fetchStats()
  },
  methods: {
    async openWarroom() {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch('/api/auth/handoff/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ target: 'ws-warroom' })
        })
        const d = await r.json()
        if (d.code) {
          window.location.href = `https://ws.medninja.academy/auth/handoff?code=${d.code}`
        }
      } catch (err) {
        console.error('Warroom handoff error', err)
      }
    },
    async fetchStats() {
      this.loading = true
      this.statsError = ''
      try {
        const [passportRes, packagesRes, activationsRes] = await Promise.allSettled([
          api.get('/admin/passport'),
          api.get('/admin/packages'),
          api.get('/admin/activations')
        ])
        if (passportRes.status === 'fulfilled') {
          const regs = passportRes.value.registrations || []
          const bd = { admin: 0, staff: 0, student: 0, demo: 0 }
          for (const r of regs) {
            if (r.role === 'admin') bd.admin++
            else if (r.role === 'staff') bd.staff++
            else if (r.activations && r.activations.length > 0) bd.student++
            else bd.demo++
          }
          this.userBreakdown = bd
        }
        this.stats.packages = packagesRes.status === 'fulfilled' ? (packagesRes.value.packages?.length || 0) : 0
        this.stats.activations = activationsRes.status === 'fulfilled' ? (activationsRes.value.activations?.length || 0) : 0
      } catch (err) {
        console.error('fetchStats error:', err)
        this.statsError = err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
/* ── Admin Hero ── */
.admin-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  padding: 32px 0;
  color: white;
}
.admin-hero-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.admin-hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.admin-hero h1 {
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin-bottom: 3px;
}
.admin-hero p {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  margin: 0;
}

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.user-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}
.user-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #475569;
  text-decoration: none;
  transition: all .15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.user-tab:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15,23,42,.08);
  border-color: #cbd5e1;
}
.user-tab .tab-count {
  background: rgba(0,0,0,.05);
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
}
.tab-admin       { color: #7c3aed; }
.tab-admin .tab-count   { background: rgba(124,58,237,.12); color: #6d28d9; }
.tab-staff       { color: #2563eb; }
.tab-staff .tab-count   { background: rgba(37,99,235,.12); color: #1d4ed8; }
.tab-student     { color: #059669; }
.tab-student .tab-count { background: rgba(5,150,105,.12); color: #047857; }
.tab-demo        { color: #d97706; }
.tab-demo .tab-count    { background: rgba(217,119,6,.12); color: #b45309; }
.stats-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.skeleton-stat {
  height: 96px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--bg) 25%, #e8eaed 50%, var(--bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

.stat-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-blue  { background: #dbeafe; color: #1d4ed8; }
.stat-icon-green { background: #dcfce7; color: #15803d; }
.stat-icon-purple{ background: #ede9fe; color: #7c3aed; }
.stat-icon-gold  { background: #fef9c3; color: #b45309; }
.stat-icon-cyan  { background: #cffafe; color: #0891b2; }

.stat-card-link {
  text-decoration: none;
  cursor: pointer;
}
.stat-card-link:hover {
  border-color: #0891b2;
}

.stat-body { flex: 1; }
.stat-number {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: var(--dark);
  line-height: 1.1;
}
.stat-label {
  display: block;
  font-size: 12px;
  color: var(--gray);
  margin-top: 4px;
  font-weight: 500;
}

/* ── Admin Nav ── */
.admin-nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.admin-nav-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  text-decoration: none;
  color: var(--dark);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}
.admin-nav-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
  color: var(--primary);
}
.admin-nav-card:hover .nav-content h3 { color: var(--primary); }
.admin-nav-card:hover .nav-arrow { opacity: 1; transform: translateX(3px); }

.nav-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nav-icon-blue   { background: #dbeafe; color: #1d4ed8; }
.nav-icon-green  { background: #dcfce7; color: #15803d; }
.nav-icon-purple { background: #ede9fe; color: #7c3aed; }
.nav-icon-gold   { background: #fef9c3; color: #b45309; }
.nav-icon-teal   { background: #ccfbf1; color: #0f766e; }
.nav-icon-red    { background: #fee2e2; color: #dc2626; }
.nav-icon-cyan   { background: #e0f7fa; color: #0891b2; }
.nav-icon-passport { background: #e0f2fe; color: #0369a1; }

.nav-content { flex: 1; }
.nav-content h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 4px;
  transition: color var(--transition-fast);
}
.nav-content p {
  font-size: 13px;
  color: var(--gray);
  margin: 0;
}
.nav-arrow {
  color: var(--gray);
  opacity: 0.4;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
}

/* ── Nav Sections ── */
.nav-section {
  margin-bottom: 24px;
}
.nav-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.nav-section-header h2 {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--gray);
  margin: 0;
}
.nav-section-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.passport-section-icon { background: #e0f2fe; color: #0369a1; }
.lms-section-icon { background: #dbeafe; color: #1d4ed8; }
.comm-section-icon { background: #d1fae5; color: #059669; }
.security-section-icon { background: #fee2e2; color: #dc2626; }

@media (max-width: 1024px) {
  .stats-grid, .stats-loading { grid-template-columns: repeat(2, 1fr); }
  .admin-nav-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .stats-grid, .stats-loading { grid-template-columns: repeat(2, 1fr); }
}
</style>
