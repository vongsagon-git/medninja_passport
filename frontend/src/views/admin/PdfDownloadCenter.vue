<template>
  <div class="pdf-center">
    <!-- Hero -->
    <div class="hero">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <h1>PDF Download Center</h1>
            <p>ติดตามการดาวน์โหลดเอกสาร -- หลักฐานทางกฎหมาย</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.totalDownloads.toLocaleString() }}</span>
              <span class="stat-label">ดาวน์โหลดทั้งหมด</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.todayDownloads.toLocaleString() }}</span>
              <span class="stat-label">ดาวน์โหลดวันนี้</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.uniqueUsers.toLocaleString() }}</span>
              <span class="stat-label">ผู้ใช้ที่ดาวน์โหลด</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ stats.emailSuccessRate }}%</span>
              <span class="stat-label">อีเมลส่งสำเร็จ</span>
            </div>
          </div>
        </div>

        <!-- Search & Filter -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input v-model="search" type="text" placeholder="ค้นหาชื่อ, อีเมล, Ref, เลขบัตร..." class="search-input" @input="debouncedFetch" />
          </div>
          <div class="date-filters">
            <label class="date-label">
              จาก
              <input v-model="dateFrom" type="date" class="date-input" @change="fetchLogs" />
            </label>
            <label class="date-label">
              ถึง
              <input v-model="dateTo" type="date" class="date-input" @change="fetchLogs" />
            </label>
            <button v-if="dateFrom || dateTo" class="btn-clear" @click="dateFrom = ''; dateTo = ''; fetchLogs()">ล้าง</button>
          </div>
          <button class="btn-refresh" @click="fetchAll" :disabled="loadingLogs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/></svg>
            Refresh
          </button>
        </div>

        <!-- Table -->
        <div class="panel">
          <div v-if="loadingLogs" class="loading-state"><div class="spinner"></div></div>
          <div v-else-if="!logs.length" class="empty">ยังไม่มีข้อมูลการดาวน์โหลด</div>
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ชื่อ</th>
                  <th>เลขบัตร</th>
                  <th>อีเมล</th>
                  <th>เอกสาร</th>
                  <th>Section</th>
                  <th>IP</th>
                  <th>Ref</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs" :key="log._id" class="row-click" @click="openDetail(log)">
                  <td class="time-cell">{{ formatTime(log.createdAt) }}</td>
                  <td class="name-cell">{{ log.userName }}</td>
                  <td class="mono">{{ maskNationalId(log.nationalId) }}</td>
                  <td class="email-cell">{{ log.userEmail }}</td>
                  <td>{{ log.videoTitle || '-' }}</td>
                  <td>{{ log.sectionName || '-' }}</td>
                  <td class="mono">{{ log.ip }}</td>
                  <td class="mono ref-cell">{{ log.refId }}</td>
                  <td>
                    <span :class="['email-badge', log.emailSent ? 'badge-ok' : 'badge-fail']">
                      {{ log.emailSent ? 'OK' : 'FAIL' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="pagination">
              <button class="page-btn" :disabled="page <= 1" @click="page--; fetchLogs()">Prev</button>
              <span class="page-info">{{ page }} / {{ totalPages }}</span>
              <button class="page-btn" :disabled="page >= totalPages" @click="page++; fetchLogs()">Next</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Detail Modal -->
    <div v-if="selected" class="modal-overlay" @click.self="selected = null">
      <div class="modal-box">
        <div class="modal-header">
          <h2>รายละเอียดการดาวน์โหลด</h2>
          <button class="modal-close" @click="selected = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3 class="detail-title">ข้อมูลผู้ดาวน์โหลด</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">ชื่อ</span><span class="detail-value">{{ selected.userName }}</span></div>
              <div class="detail-item"><span class="detail-label">เลขบัตรประชาชน</span><span class="detail-value mono">{{ selected.nationalId || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">อีเมล</span><span class="detail-value">{{ selected.userEmail }}</span></div>
              <div class="detail-item"><span class="detail-label">เบอร์โทร</span><span class="detail-value">{{ selected.phone || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">มหาวิทยาลัย</span><span class="detail-value">{{ selected.university || '-' }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="detail-title">ข้อมูลเอกสาร</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Section</span><span class="detail-value">{{ selected.sectionCode }} -- {{ selected.sectionName }}</span></div>
              <div class="detail-item"><span class="detail-label">Video</span><span class="detail-value">{{ selected.videoTitle || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">Ref ID</span><span class="detail-value mono">{{ selected.refId }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="detail-title">ข้อมูลเทคนิค</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">IP Address</span><span class="detail-value mono">{{ selected.ip }}</span></div>
              <div class="detail-item"><span class="detail-label">User Agent</span><span class="detail-value ua-text">{{ selected.userAgent || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">วันที่ดาวน์โหลด</span><span class="detail-value">{{ formatTimeFull(selected.createdAt) }}</span></div>
              <div class="detail-item"><span class="detail-label">ขนาดไฟล์</span><span class="detail-value">{{ formatFileSize(selected.fileSize) }}</span></div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="detail-title">สถานะอีเมลยืนยัน</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">สถานะ</span>
                <span :class="['detail-value', selected.emailSent ? 'text-ok' : 'text-fail']">
                  {{ selected.emailSent ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ' }}
                </span>
              </div>
              <div v-if="selected.emailError" class="detail-item">
                <span class="detail-label">Error</span>
                <span class="detail-value text-fail">{{ selected.emailError }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-evidence" @click="copyEvidence">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>
            </svg>
            {{ copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกหลักฐาน' }}
          </button>
          <button class="btn-close-modal" @click="selected = null">ปิด</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'PdfDownloadCenter',
  data() {
    return {
      loading: true,
      loadingLogs: false,
      stats: { totalDownloads: 0, todayDownloads: 0, uniqueUsers: 0, emailSuccessRate: 0 },
      logs: [],
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 30,
      total: 0,
      selected: null,
      copySuccess: false,
      debounceTimer: null
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.limit) || 1
    }
  },
  async mounted() {
    await this.fetchAll()
  },
  methods: {
    async fetchAll() {
      this.loading = true
      try {
        await Promise.all([this.fetchStats(), this.fetchLogs()])
      } finally {
        this.loading = false
      }
    },
    async fetchStats() {
      try {
        const res = await api.get('/admin/pdf-logs/stats')
        this.stats = {
          totalDownloads: res.total || 0,
          todayDownloads: res.today || 0,
          uniqueUsers: res.uniqueUsers || 0,
          emailSuccessRate: res.emailRate || 0
        }
      } catch (err) {
        console.error('pdf stats error:', err)
      }
    },
    async fetchLogs() {
      this.loadingLogs = true
      try {
        const params = new URLSearchParams()
        params.set('page', this.page)
        params.set('limit', this.limit)
        if (this.search) params.set('search', this.search)
        if (this.dateFrom) params.set('dateFrom', this.dateFrom)
        if (this.dateTo) params.set('dateTo', this.dateTo)
        const res = await api.get(`/admin/pdf-logs?${params.toString()}`)
        this.logs = res.logs || []
        this.total = res.total || 0
      } catch (err) {
        console.error('pdf logs error:', err)
      } finally {
        this.loadingLogs = false
      }
    },
    debouncedFetch() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.page = 1
        this.fetchLogs()
      }, 400)
    },
    openDetail(log) {
      this.selected = log
      this.copySuccess = false
    },
    maskNationalId(id) {
      if (!id || id.length < 6) return id || '-'
      return id.substring(0, 3) + '***' + id.substring(id.length - 3)
    },
    formatTime(iso) {
      if (!iso) return '-'
      return new Date(iso).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
    formatTimeFull(iso) {
      if (!iso) return '-'
      return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    formatFileSize(bytes) {
      if (!bytes) return '-'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    formatNationalId(id) {
      if (!id || id.length !== 13) return id || '-'
      return `${id[0]}-${id.substring(1,5)}-${id.substring(5,10)}-${id.substring(10,12)}-${id[12]}`
    },
    async copyEvidence() {
      if (!this.selected) return
      const s = this.selected
      const text = [
        '=== หลักฐานการดาวน์โหลดเอกสาร ===',
        'บริษัท เมดนินจา จำกัด',
        '',
        `ผู้ดาวน์โหลด: ${s.userName}`,
        `เลขบัตรประชาชน: ${this.formatNationalId(s.nationalId)}`,
        `อีเมล: ${s.userEmail}`,
        `เบอร์โทร: ${s.phone || '-'}`,
        `มหาวิทยาลัย: ${s.university || '-'}`,
        '',
        `เอกสาร: ${s.videoTitle || '-'}`,
        `Section: ${s.sectionCode} -- ${s.sectionName}`,
        `Ref ID: ${s.refId}`,
        '',
        `IP Address: ${s.ip}`,
        `User Agent: ${s.userAgent || '-'}`,
        `วันที่ดาวน์โหลด: ${this.formatTimeFull(s.createdAt)}`,
        `ขนาดไฟล์: ${this.formatFileSize(s.fileSize)}`,
        '',
        `สถานะอีเมลยืนยัน: ${s.emailSent ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ'}`,
        s.emailError ? `ข้อผิดพลาด: ${s.emailError}` : null,
        '',
        'ผู้ดาวน์โหลดได้กดยอมรับเงื่อนไขลิขสิทธิ์ก่อนดาวน์โหลด',
        'เอกสารมีลายน้ำระบุตัวตนผู้ดาวน์โหลดฝังไว้ทุกหน้า',
        '==============================='
      ].filter(line => line !== null).join('\n')

      try {
        await navigator.clipboard.writeText(text)
        this.copySuccess = true
        setTimeout(() => { this.copySuccess = false }, 2000)
      } catch (err) {
        // fallback
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.copySuccess = true
        setTimeout(() => { this.copySuccess = false }, 2000)
      }
    }
  }
}
</script>

<style scoped>
/* Hero */
.hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  padding: 32px 0;
  color: white;
}
.hero-inner { display: flex; align-items: center; gap: 16px; }
.hero-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
}
.hero h1 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 3px; }
.hero p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }

/* Stats grid */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--border);
  padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow-sm);
}
.stat-icon {
  width: 48px; height: 48px; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-blue { background: #dbeafe; color: #1d4ed8; }
.stat-green { background: #dcfce7; color: #15803d; }
.stat-purple { background: #ede9fe; color: #7c3aed; }
.stat-gold { background: #fef9c3; color: #b45309; }
.stat-body { flex: 1; }
.stat-number { display: block; font-size: 26px; font-weight: 800; color: var(--dark); line-height: 1.1; }
.stat-label { display: block; font-size: 12px; color: var(--gray); margin-top: 4px; font-weight: 500; }

/* Filter bar */
.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gray); }
.search-input {
  width: 100%; padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid var(--border);
  font-size: 13px; background: var(--white); color: var(--dark); outline: none;
}
.search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.date-filters { display: flex; align-items: center; gap: 8px; }
.date-label { font-size: 12px; color: var(--gray); font-weight: 600; display: flex; align-items: center; gap: 4px; }
.date-input {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
  font-size: 13px; background: var(--white); color: var(--dark); outline: none;
}
.date-input:focus { border-color: var(--primary); }
.btn-clear {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); font-size: 12px; font-weight: 600; cursor: pointer; color: #dc2626;
}
.btn-clear:hover { background: #fef2f2; border-color: #dc2626; }
.btn-refresh {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  border-radius: 8px; border: 1px solid var(--border); background: var(--white);
  font-size: 13px; font-weight: 600; cursor: pointer; color: var(--gray);
}
.btn-refresh:hover { border-color: var(--primary); color: var(--primary); }

/* Panel */
.panel {
  background: var(--white); border-radius: var(--radius-lg); border: 1px solid var(--border);
  padding: 24px; box-shadow: var(--shadow-sm);
}
.empty { text-align: center; padding: 40px; color: var(--gray); font-size: 14px; }

/* Table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid var(--border); font-weight: 700; color: var(--dark); font-size: 12px; white-space: nowrap; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--dark); }
.row-click { cursor: pointer; transition: background 0.15s; }
.row-click:hover td { background: #f0f7ff; }
.time-cell { white-space: nowrap; font-size: 12px; color: var(--gray); }
.name-cell { font-weight: 600; white-space: nowrap; }
.email-cell { font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; font-size: 12px; }
.ref-cell { white-space: nowrap; }

/* Email badge */
.email-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.badge-ok { background: #dcfce7; color: #15803d; }
.badge-fail { background: #fef2f2; color: #dc2626; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px; }
.page-btn {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); font-size: 13px; font-weight: 600; cursor: pointer; color: var(--dark);
}
.page-btn:disabled { opacity: 0.4; cursor: default; }
.page-btn:not(:disabled):hover { border-color: var(--primary); color: var(--primary); }
.page-info { font-size: 13px; color: var(--gray); font-weight: 600; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  background: white; border-radius: 16px; width: 100%; max-width: 640px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border);
}
.modal-header h2 { font-size: 17px; font-weight: 800; color: var(--dark); margin: 0; }
.modal-close {
  width: 32px; height: 32px; border-radius: 8px; border: none; background: #f1f5f9;
  font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--gray); line-height: 1;
}
.modal-close:hover { background: #e2e8f0; }
.modal-body { padding: 20px 24px; }

/* Detail sections */
.detail-section { margin-bottom: 20px; }
.detail-section:last-child { margin-bottom: 0; }
.detail-title {
  font-size: 13px; font-weight: 700; color: var(--primary); text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px solid #eef2f7;
}
.detail-grid { display: flex; flex-direction: column; gap: 6px; }
.detail-item { display: flex; gap: 12px; font-size: 13px; line-height: 1.5; }
.detail-label { color: var(--gray); font-weight: 600; min-width: 130px; flex-shrink: 0; }
.detail-value { color: var(--dark); word-break: break-all; }
.ua-text { font-size: 11px; color: var(--gray); }
.text-ok { color: #15803d; font-weight: 700; }
.text-fail { color: #dc2626; font-weight: 700; }

/* Modal footer */
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border);
}
.btn-evidence {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border-radius: 8px; border: none; background: #0f172a; color: white;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;
}
.btn-evidence:hover { background: #1e293b; }
.btn-close-modal {
  padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); font-size: 13px; font-weight: 600; cursor: pointer; color: var(--gray);
}
.btn-close-modal:hover { border-color: var(--dark); color: var(--dark); }

/* Loading */
.loading-state { text-align: center; padding: 60px 20px; }
.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .date-filters { flex-wrap: wrap; }
  .detail-item { flex-direction: column; gap: 2px; }
  .detail-label { min-width: auto; }
}
</style>
