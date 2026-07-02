<template>
  <div class="admin-page">
    <!-- Hero Header -->
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h1>ห้องถ่ายทอดสด</h1>
            <p>จัดผังเนื้อหา → สร้างตารางล่วงหน้า</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Tabs -->
    <div class="container">
      <div class="main-tabs">
        <button :class="['tab-btn', { active: mainTab === 'content' }]" @click="mainTab = 'content'">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M3.75 3A1.75 1.75 0 002 4.75v3.5C2 9.216 2.784 10 3.75 10h3.5A1.75 1.75 0 009 8.25v-3.5A1.75 1.75 0 007.25 3h-3.5zM3.75 11.5A1.75 1.75 0 002 13.25v3.5c0 .966.784 1.75 1.75 1.75h3.5A1.75 1.75 0 009 16.75v-3.5a1.75 1.75 0 00-1.75-1.75h-3.5zM11 4.75c0-.966.784-1.75 1.75-1.75h3.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0116.25 10h-3.5A1.75 1.75 0 0111 8.25v-3.5z"/></svg>
          เนื้อหา ({{ contents.length }})
        </button>
        <button :class="['tab-btn', { active: mainTab === 'schedule' }]" @click="mainTab = 'schedule'">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clip-rule="evenodd"/></svg>
          ตาราง ({{ sessions.length }})
        </button>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
      <div v-if="loading" style="text-align:center;padding:60px;color:#94a3b8;">กำลังโหลด...</div>

      <template v-else>
        <!-- ═══════════════════════════════════ -->
        <!-- TAB: เนื้อหา (LiveContent Preset) -->
        <!-- ═══════════════════════════════════ -->
        <div v-if="mainTab === 'content'">
          <div class="content-header">
            <p class="content-desc">สร้างเนื้อหาครั้งเดียว ใช้ซ้ำได้ทุกคอร์สทุกรอบ</p>
            <button class="btn btn-primary" @click="openContentCreate">+ สร้างเนื้อหา</button>
          </div>

          <div v-if="!contents.length" class="empty-state">ยังไม่มีเนื้อหา — กด "สร้างเนื้อหา" เพื่อเริ่มต้น</div>

          <div v-for="c in contents" :key="c._id" class="content-card" :style="{ opacity: c.enabled === false ? 0.5 : 1 }">
            <div class="cc-main">
              <div class="cc-title">
                <span :style="{ textDecoration: c.enabled === false ? 'line-through' : 'none' }">{{ c.title }}</span>
                <span v-if="c.enabled === false" style="font-size:11px;color:#94a3b8;margin-left:6px;">(ปิด)</span>
              </div>
              <div class="cc-meta">
                <span class="cc-duration" v-if="c.videoDurationSec">{{ formatDuration(c.videoDurationSec) }}</span>
                <span class="cc-pdf-count" v-if="c.pdfFiles?.length">{{ c.pdfFiles.length }} PDF</span>
                <span class="cc-drm" v-if="c.bunnyDrmVideoId">DRM</span>
                <span class="cc-used">ใช้ {{ c.sessionCount || 0 }} ตาราง</span>
              </div>
            </div>
            <div class="cc-actions">
              <button class="btn-icon" @click="toggleContentEnabled(c)" :title="c.enabled === false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'" :style="{ color: c.enabled === false ? '#94a3b8' : '#22c55e' }">
                <svg v-if="c.enabled !== false" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd"/></svg>
              </button>
              <button class="btn-icon" @click="openContentEdit(c)" title="แก้ไข">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="btn-icon btn-icon-danger" @click="deleteContent(c)" title="ลบ" :disabled="c.sessionCount > 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════ -->
        <!-- TAB: ตาราง (Schedule)              -->
        <!-- ═══════════════════════════════════ -->
        <div v-if="mainTab === 'schedule'">
          <div class="schedule-header">
            <div class="view-toggle">
              <button :class="['vt-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'">
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clip-rule="evenodd"/></svg>
                รายการ
              </button>
              <button :class="['vt-btn', { active: viewMode === 'tv' }]" @click="viewMode = 'tv'">
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 2h10v8H5V5z"/></svg>
                ผัง TV
              </button>
            </div>
          </div>

          <!-- List View -->
          <template v-if="viewMode === 'list'">
            <div v-for="pkg in packagesWithSessions" :key="pkg._id" class="room-card" :class="{ 'room-live': pkg.hasLive }">
              <div class="room-header">
                <div class="room-info">
                  <div class="room-name">
                    <span v-if="pkg.hasLive" class="room-live-dot"></span>
                    {{ pkg.title }}
                  </div>
                  <span class="room-count">{{ pkg.sessions.length }} ตาราง</span>
                </div>
                <div class="room-actions">
                  <span v-if="pkg.hasLive" class="room-live-badge">กำลังถ่ายทอด</span>
                  <button class="btn btn-sm btn-add-schedule" @click="openScheduleCreate(pkg)">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                    เพิ่มตาราง
                  </button>
                </div>
              </div>

              <div v-if="pkg.sessions.length === 0" class="room-empty">
                <span>ยังไม่มีตาราง — กดปุ่ม "เพิ่มตาราง"</span>
              </div>
              <div v-else class="room-sessions">
                <div v-for="s in pkg.sessions" :key="s._id" class="session-row" :class="{ 'is-live': computeStatus(s) === 'live' }">
                  <div class="row-left">
                    <span class="status-dot" :class="'dot-' + computeStatus(s)"></span>
                    <div class="row-info">
                      <div class="row-title">{{ s.title }}</div>
                      <div v-if="computeStatus(s) === 'live'" class="live-progress-row">
                        <div class="live-progress-bar"><div class="live-progress-fill" :style="{ width: liveProgress(s) + '%' }"></div></div>
                        <span class="live-elapsed">{{ liveElapsed(s) }} / {{ formatDuration(s.videoDurationSec) }}</span>
                        <span class="live-viewers" v-if="liveStats.liveViewers">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clip-rule="evenodd"/></svg>
                          {{ liveStats.liveViewers[s._id] || 0 }}
                        </span>
                      </div>
                      <div v-else class="row-meta">
                        {{ formatThaiDate(s.scheduledAt) }}
                        <span v-if="s.videoDurationSec"> · {{ formatDuration(s.videoDurationSec) }}</span>
                        <span v-if="getContentPdfCount(s)" class="pdf-tag">{{ getContentPdfCount(s) }} PDF</span>
                      </div>
                    </div>
                  </div>
                  <div class="row-actions">
                    <template v-if="computeStatus(s) === 'live'">
                      <button class="btn btn-sm" style="font-size:11px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;" @click="cancelSession(s)" title="ยกเลิก + ลบ">ยกเลิก</button>
                    </template>
                    <template v-else>
                      <button class="btn-icon" @click="openScheduleEdit(s, pkg)" title="แก้ไข">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button class="btn-icon btn-icon-danger" @click="confirmDeleteSession(s)" title="ลบ">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- TV Schedule View -->
          <div v-if="viewMode === 'tv'" class="tv-schedule">
            <div class="tv-date-nav">
              <button class="btn btn-sm btn-outline" @click="shiftTvDate(-1)">&laquo; วันก่อน</button>
              <input type="date" v-model="tvDate" class="form-control tv-date-input" />
              <button class="btn btn-sm btn-outline tv-today-btn" @click="tvDate = todayDate">วันนี้</button>
              <button class="btn btn-sm btn-outline" @click="shiftTvDate(1)">วันถัดไป &raquo;</button>
              <span class="tv-date-label">{{ tvDateLabel }}</span>
            </div>

            <div class="tv-grid-wrapper">
              <div class="tv-grid" :style="{ minWidth: (tvLabelWidth + tvTotalWidth) + 'px' }">
                <div class="tv-row tv-header-row">
                  <div class="tv-label" :style="{ width: tvLabelWidth + 'px' }">ช่อง</div>
                  <div class="tv-timeline" :style="{ width: tvTotalWidth + 'px' }">
                    <div v-for="h in tvVisibleHours" :key="h" class="tv-hour-mark" :style="{ left: (h - 6) * 100 + 'px' }">{{ String(h).padStart(2,'0') }}</div>
                    <div v-if="isTvToday && nowX >= 0 && nowX <= tvTotalWidth" class="tv-now-dot" :style="{ left: nowX + 'px' }"></div>
                  </div>
                </div>

                <div v-for="pkg in packagesWithSessions" :key="'tv-' + pkg._id" class="tv-row" :class="{ 'tv-row-empty': !tvSessionsForDate(pkg).length }">
                  <div class="tv-label" :style="{ width: tvLabelWidth + 'px' }">
                    <span class="tv-ch-name">{{ pkg.title }}</span>
                    <span v-if="tvSessionsForDate(pkg).length" class="tv-ch-count">{{ tvSessionsForDate(pkg).length }}</span>
                  </div>
                  <div class="tv-timeline" :style="{ width: tvTotalWidth + 'px' }">
                    <div v-for="h in tvVisibleHours" :key="'g'+h" class="tv-grid-line" :style="{ left: (h - 6) * 100 + 'px' }"></div>
                    <div v-if="isTvToday && nowX >= 0 && nowX <= tvTotalWidth" class="tv-now-line" :style="{ left: nowX + 'px' }"></div>
                    <div v-for="s in tvSessionsForDate(pkg)" :key="s._id" class="tv-block" :class="'tv-' + computeStatus(s)" :style="tvBlockStyle(s)" :title="s.title + '\n' + tvBlockTime(s)" @click="openScheduleEdit(s, pkg)">
                      <div class="tv-block-title">{{ s.title }}</div>
                      <div class="tv-block-time">{{ tvBlockTime(s) }}</div>
                    </div>
                    <div v-if="!tvSessionsForDate(pkg).length" class="tv-empty-hint">ไม่มีรายการวันนี้</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="tv-legend">
              <span class="tv-legend-item"><span class="tv-legend-dot dot-live"></span> กำลังสด</span>
              <span class="tv-legend-item"><span class="tv-legend-dot dot-waiting"></span> รอเริ่ม</span>
              <span class="tv-legend-item"><span class="tv-legend-dot dot-ended"></span> จบแล้ว</span>
              <span class="tv-legend-item tv-legend-now"><span class="tv-legend-line"></span> เวลาปัจจุบัน</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══ Content Modal (สร้าง/แก้ไข เนื้อหา) ═══ -->
    <div v-if="showContentModal" class="modal-overlay" @click.self="showContentModal = false">
      <div class="modal-box modal-wide">
        <h2>{{ contentForm._id ? 'แก้ไขเนื้อหา' : 'สร้างเนื้อหาใหม่' }}</h2>

        <div class="form-group">
          <label>ชื่อเนื้อหา</label>
          <input v-model="contentForm.title" class="form-control" placeholder="เช่น Cardio Review ครั้งที่ 1" />
        </div>

        <div class="form-group">
          <label>Video (NO DRM — Library 628424)</label>
          <div class="video-dropdown">
            <input v-model="videoSearch" class="form-control" placeholder="ค้นหาชื่อ video หรือ UUID..." @focus="showVideoList = true" />
            <div v-if="showVideoList && filteredVideoList.length" class="video-dropdown-list">
              <div v-for="v in filteredVideoList" :key="v.guid" class="video-dropdown-item" @click="selectContentVideo(v)">
                <div class="vdi-title">{{ v.title }}</div>
                <div class="vdi-meta">
                  <span class="vdi-uuid">{{ v.guid.slice(0, 8) }}...</span>
                  <span v-if="v.length"> · {{ formatDuration(v.length) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="contentForm.bunnyVideoId" class="selected-video">
            <span class="sv-label">เลือกแล้ว:</span>
            <span class="sv-uuid">{{ contentForm.bunnyVideoId }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Video DRM (Library 626874) <span style="color:#dc2626">*บังคับ</span></label>
          <div class="video-dropdown">
            <input v-model="drmVideoSearch" class="form-control" placeholder="ค้นหาชื่อ video DRM หรือ UUID..." @focus="showDrmVideoList = true" />
            <div v-if="showDrmVideoList && filteredDrmVideoList.length" class="video-dropdown-list">
              <div v-for="v in filteredDrmVideoList" :key="v.guid" class="video-dropdown-item" @click="selectDrmVideo(v)">
                <div class="vdi-title">{{ v.title }}</div>
                <div class="vdi-meta">
                  <span class="vdi-uuid">{{ v.guid.slice(0, 8) }}...</span>
                  <span v-if="v.length"> · {{ formatDuration(v.length) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="contentForm.bunnyDrmVideoId" class="selected-video">
            <span class="sv-label">เลือกแล้ว:</span>
            <span class="sv-uuid">{{ contentForm.bunnyDrmVideoId }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>ไฟล์ PDF (ลายน้ำ)</label>
          <div v-for="(pf, i) in contentForm.pdfFiles" :key="i" class="pdf-file-row">
            <input v-model="pf.name" class="form-control pdf-name-input" placeholder="ชื่อแสดง" />
            <span class="pdf-file-name" :title="pf.fileName">{{ pf.fileName }}</span>
            <button class="btn-icon btn-icon-danger" @click="contentForm.pdfFiles.splice(i, 1)" title="ลบ">✕</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <div class="video-dropdown" style="flex:1;">
              <input v-model="pdfFileSearch" class="form-control" placeholder="ค้นหาไฟล์ PDF ใน Storage..." @focus="showPdfFileList = true" style="font-size:13px;" />
              <div v-if="showPdfFileList && filteredPdfFiles.length" class="video-dropdown-list">
                <div v-for="f in filteredPdfFiles" :key="f" class="video-dropdown-item" @click="addPdfFromStorage(f)">
                  <div class="vdi-title">{{ f }}</div>
                </div>
              </div>
            </div>
            <label class="btn btn-sm btn-outline" style="cursor:pointer;white-space:nowrap;">
              อัปโหลด PDF
              <input type="file" accept=".pdf" @change="uploadLivePdf" hidden />
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="showContentModal = false">ยกเลิก</button>
          <button class="btn btn-primary" @click="saveContent" :disabled="saving">
            {{ saving ? 'กำลังบันทึก...' : (contentForm._id ? 'บันทึก' : 'สร้าง') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Schedule Modal (เพิ่ม/แก้ไข ตาราง) ═══ -->
    <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
      <div class="modal-box">
        <h2>{{ scheduleForm._id ? 'แก้ไขตาราง' : `เพิ่มตาราง — ${scheduleForm.pkgTitle}` }}</h2>

        <div class="form-group">
          <label>เลือกเนื้อหา (Preset)</label>
          <select v-model="scheduleForm.liveContentId" class="form-control">
            <option value="">— เลือกเนื้อหา —</option>
            <option v-for="c in enabledContents" :key="c._id" :value="c._id">
              {{ c.title }} ({{ formatDuration(c.videoDurationSec) }}{{ c.pdfFiles?.length ? ' · ' + c.pdfFiles.length + ' PDF' : '' }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>วันที่เริ่ม (เวลาไทย)</label>
          <input v-model="scheduleForm.date" type="date" class="form-control" />
        </div>

        <div class="form-group">
          <label>เวลาเริ่ม (24 ชม.)</label>
          <div class="time-picker">
            <select v-model="scheduleForm.hour" class="form-control time-select">
              <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">{{ String(h-1).padStart(2,'0') }}</option>
            </select>
            <span class="time-colon">:</span>
            <select v-model="scheduleForm.minute" class="form-control time-select">
              <option v-for="m in ['00','05','10','15','20','25','30','35','40','45','50','55']" :key="m" :value="m">{{ m }}</option>
            </select>
            <span class="time-label">น.</span>
          </div>
          <div v-if="scheduleConflictWarning" class="form-error">{{ scheduleConflictWarning }}</div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="showScheduleModal = false">ยกเลิก</button>
          <button class="btn btn-primary" @click="saveSchedule" :disabled="saving || !scheduleForm.liveContentId">
            {{ saving ? 'กำลังบันทึก...' : (scheduleForm._id ? 'บันทึก' : 'เพิ่ม') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageLive',
  data() {
    return {
      mainTab: 'schedule',
      packages: [],
      contents: [],
      sessions: [],
      loading: false,
      saving: false,
      error: null,
      successMsg: '',
      // Content modal
      showContentModal: false,
      contentForm: { _id: '', title: '', bunnyVideoId: '', bunnyDrmVideoId: '', pdfFiles: [] },
      videoList: [],
      drmVideoList: [],
      videoSearch: '',
      drmVideoSearch: '',
      showDrmVideoList: false,
      pdfStorageFiles: [],
      pdfFileSearch: '',
      showPdfFileList: false,
      showVideoList: false,
      // Schedule modal
      showScheduleModal: false,
      scheduleForm: { _id: '', liveContentId: '', pkgId: '', pkgTitle: '', date: '', hour: '19', minute: '00' },
      // Stats
      liveStats: {},
      // TV
      viewMode: 'list',
      tvDate: '',
      tvLabelWidth: 160
    }
  },
  computed: {
    packagesWithSessions() {
      const sessionMap = {}
      for (const s of this.sessions) {
        const pid = s.packageId?.toString() || ''
        if (!sessionMap[pid]) sessionMap[pid] = []
        sessionMap[pid].push(s)
      }
      return this.packages.filter(pkg => pkg.liveEnabled).map(pkg => {
        const ss = sessionMap[pkg._id] || []
        ss.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
        return { ...pkg, sessions: ss, hasLive: ss.some(s => this.computeStatus(s) === 'live') }
      }).sort((a, b) => {
        if (a.hasLive && !b.hasLive) return -1
        if (!a.hasLive && b.hasLive) return 1
        return a.title.localeCompare(b.title)
      })
    },
    todayDate() {
      const d = new Date()
      d.setHours(d.getHours() + 7)
      return d.toISOString().slice(0, 10)
    },
    enabledContents() {
      return this.contents.filter(c => c.enabled !== false)
    },
    filteredVideoList() {
      if (!this.videoSearch) return this.videoList.slice(0, 50)
      const q = this.videoSearch.toLowerCase()
      return this.videoList.filter(v => (v.title || '').toLowerCase().includes(q) || v.guid.includes(q)).slice(0, 50)
    },
    filteredDrmVideoList() {
      if (!this.drmVideoSearch) return this.drmVideoList.slice(0, 50)
      const q = this.drmVideoSearch.toLowerCase()
      return this.drmVideoList.filter(v => (v.title || '').toLowerCase().includes(q) || v.guid.includes(q)).slice(0, 50)
    },
    filteredPdfFiles() {
      const used = new Set(this.contentForm.pdfFiles.map(p => p.fileName))
      let list = this.pdfStorageFiles.filter(f => !used.has(f))
      if (this.pdfFileSearch) {
        const q = this.pdfFileSearch.toLowerCase()
        list = list.filter(f => f.toLowerCase().includes(q))
      }
      return list.slice(0, 30)
    },
    scheduleConflictWarning() {
      if (!this.scheduleForm.date || !this.scheduleForm.pkgId || !this.scheduleForm.liveContentId) return ''
      const content = this.contents.find(c => c._id === this.scheduleForm.liveContentId)
      const dur = content?.videoDurationSec || 3600
      const newStart = new Date(`${this.scheduleForm.date}T${this.scheduleForm.hour}:${this.scheduleForm.minute}:00+07:00`).getTime()
      const newEnd = newStart + dur * 1000
      const pkgSessions = this.sessions.filter(s => (s.packageId?.toString() || '') === this.scheduleForm.pkgId && s._id !== this.scheduleForm._id)
      for (const s of pkgSessions) {
        const sStart = new Date(s.scheduledAt).getTime()
        const sEnd = sStart + (s.videoDurationSec || 3600) * 1000
        if (newStart < sEnd && newEnd > sStart) {
          return `ชนกับ "${s.title}" (${this.formatThaiDate(s.scheduledAt)})`
        }
      }
      return ''
    },
    // TV
    tvVisibleHours() { const h = []; for (let i = 6; i < 24; i++) h.push(i); return h },
    tvTotalWidth() { return 18 * 100 },
    isTvToday() { return this.tvDate === this.todayDate },
    nowX() {
      const now = new Date()
      const thai = new Date(now.getTime() + 7 * 3600000)
      return (thai.getUTCHours() + thai.getUTCMinutes() / 60 - 6) * 100
    },
    tvDateLabel() {
      if (!this.tvDate) return ''
      const d = new Date(this.tvDate + 'T00:00:00')
      const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
      return 'วัน' + days[d.getDay()] + ' ' + d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  },
  async mounted() {
    this.tvDate = this.todayDate
    await Promise.all([this.loadPackages(), this.loadContents(), this.loadSessions()])
    this.loadVideoList()
    this.fetchLiveStats()
    this._refreshInterval = setInterval(() => { this.$forceUpdate(); this.fetchLiveStats() }, 10000)
  },
  beforeUnmount() {
    if (this._refreshInterval) clearInterval(this._refreshInterval)
  },
  created() {
    this._clickOutside = (e) => { if (!e.target.closest('.video-dropdown')) this.showVideoList = false }
    document.addEventListener('click', this._clickOutside)
  },
  methods: {
    // ═══ Load ═══
    async loadPackages() {
      try { const d = await api.get('/admin/packages'); this.packages = d.packages || d || [] } catch {}
    },
    async loadContents() {
      try { const d = await api.get('/admin/live/content'); this.contents = d.contents || [] } catch {}
    },
    async loadSessions() {
      this.loading = true
      try { const d = await api.get('/admin/live'); this.sessions = d.sessions || [] }
      catch (err) { this.error = err.response?.data?.message || 'โหลดล้มเหลว' }
      finally { this.loading = false }
    },
    async loadVideoList() {
      try { const d = await api.get('/admin/video-pdf-map'); this.videoList = d.videos || [] } catch {}
      try {
        const d = await api.get('/admin/bunny/video-names')
        if (d.drm) this.drmVideoList = Object.entries(d.drm).map(([guid, v]) => ({ guid, title: v.title, length: parseInt(v.duration) || 0 }))
      } catch {}
      try {
        const d = await api.get('/admin/pdf-library')
        this.pdfStorageFiles = (d.files || []).map(f => f.name || f.fileName || f)
      } catch {}
    },
    async fetchLiveStats() {
      try { this.liveStats = await api.get('/admin/live/stats') } catch {}
    },

    // ═══ Content CRUD ═══
    async toggleContentEnabled(c) {
      try {
        await api.patch(`/admin/live/content/${c._id}`, { enabled: !c.enabled })
        c.enabled = !c.enabled
      } catch (err) { this.error = err.response?.data?.message || 'เปลี่ยนสถานะไม่สำเร็จ' }
    },
    openContentCreate() {
      this.contentForm = { _id: '', title: '', bunnyVideoId: '', bunnyDrmVideoId: '', pdfFiles: [] }
      this.videoSearch = ''
      this.drmVideoSearch = ''
      this.showContentModal = true
    },
    openContentEdit(c) {
      this.contentForm = {
        _id: c._id,
        title: c.title,
        bunnyVideoId: c.bunnyVideoId || '',
        bunnyDrmVideoId: c.bunnyDrmVideoId || '',
        pdfFiles: (c.pdfFiles || []).map(f => ({ ...f }))
      }
      this.videoSearch = c.title
      // หา DRM title จาก drmVideoList
      const drmV = this.drmVideoList.find(v => v.guid === c.bunnyDrmVideoId)
      this.drmVideoSearch = drmV ? drmV.title : (c.bunnyDrmVideoId || '')
      this.showContentModal = true
    },
    selectContentVideo(v) {
      const cleanTitle = (v.title || '').replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i, '').trim()
      this.contentForm.bunnyVideoId = v.guid
      if (!this.contentForm.title) this.contentForm.title = cleanTitle
      this.videoSearch = cleanTitle
      this.showVideoList = false
    },
    selectDrmVideo(v) {
      this.contentForm.bunnyDrmVideoId = v.guid
      this.drmVideoSearch = (v.title || '').replace(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i, '').trim()
      this.showDrmVideoList = false
    },
    addPdfFromStorage(fileName) {
      const name = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')
      this.contentForm.pdfFiles.push({ name, fileName })
      this.pdfFileSearch = ''
      this.showPdfFileList = false
    },
    async uploadLivePdf(e) {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      try {
        const form = new FormData()
        form.append('pdf', file)
        form.append('fileName', file.name)
        const d = await api.post('/admin/pdf-library/upload', form)
        const fileName = d.fileName || file.name
        this.pdfStorageFiles.push(fileName)
        const name = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')
        this.contentForm.pdfFiles.push({ name, fileName })
        this.successMsg = `อัปโหลด ${fileName} สำเร็จ`
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'อัปโหลดไม่สำเร็จ'
      }
    },
    async saveContent() {
      if (!this.contentForm.title || !this.contentForm.bunnyVideoId || !this.contentForm.bunnyDrmVideoId) {
        this.error = 'กรุณากรอก ชื่อ + Video NO DRM + Video DRM'; return
      }
      this.saving = true; this.error = null
      try {
        const payload = {
          title: this.contentForm.title,
          bunnyVideoId: this.contentForm.bunnyVideoId.trim(),
          bunnyDrmVideoId: this.contentForm.bunnyDrmVideoId.trim(),
          pdfFiles: this.contentForm.pdfFiles.filter(f => f.name && f.fileName)
        }
        if (this.contentForm._id) {
          await api.put('/admin/live/content/' + this.contentForm._id, payload)
          this.successMsg = 'แก้ไขเนื้อหาเรียบร้อย'
        } else {
          await api.post('/admin/live/content', payload)
          this.successMsg = 'สร้างเนื้อหาเรียบร้อย'
        }
        this.showContentModal = false
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.loadContents()
      } catch (err) { this.error = err.response?.data?.message || 'บันทึกล้มเหลว' }
      finally { this.saving = false }
    },
    async deleteContent(c) {
      if (c.sessionCount > 0) { alert(`ลบไม่ได้ — มี ${c.sessionCount} ตารางใช้อยู่`); return }
      if (!confirm('ลบเนื้อหา "' + c.title + '" ?')) return
      try {
        await api.delete('/admin/live/content/' + c._id)
        this.successMsg = 'ลบเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.loadContents()
      } catch (err) { this.error = err.response?.data?.message || 'ลบล้มเหลว' }
    },

    // ═══ Schedule CRUD ═══
    openScheduleCreate(pkg) {
      this.scheduleForm = { _id: '', liveContentId: '', pkgId: pkg._id, pkgTitle: pkg.title, date: this.todayDate, hour: '19', minute: '00' }
      this.showScheduleModal = true
    },
    openScheduleEdit(s, pkg) {
      const thaiDt = this.toLocalDatetimeInput(s.scheduledAt)
      this.scheduleForm = {
        _id: s._id,
        liveContentId: s.liveContentId?._id || s.liveContentId || '',
        pkgId: pkg._id,
        pkgTitle: pkg.title,
        date: thaiDt.slice(0, 10),
        hour: thaiDt.slice(11, 13),
        minute: thaiDt.slice(14, 16)
      }
      this.showScheduleModal = true
    },
    async saveSchedule() {
      if (!this.scheduleForm.liveContentId || !this.scheduleForm.date) {
        this.error = 'กรุณาเลือกเนื้อหาและวันเวลา'; return
      }
      this.saving = true; this.error = null
      try {
        const scheduledAt = new Date(`${this.scheduleForm.date}T${this.scheduleForm.hour}:${this.scheduleForm.minute}:00+07:00`).toISOString()
        const payload = {
          liveContentId: this.scheduleForm.liveContentId,
          packageId: this.scheduleForm.pkgId,
          scheduledAt
        }
        if (this.scheduleForm._id) {
          await api.put('/admin/live/' + this.scheduleForm._id, payload)
          this.successMsg = 'แก้ไขตารางเรียบร้อย'
        } else {
          await api.post('/admin/live', payload)
          this.successMsg = 'เพิ่มตารางเรียบร้อย'
        }
        this.showScheduleModal = false
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.loadSessions()
      } catch (err) { this.error = err.response?.data?.message || 'บันทึกล้มเหลว' }
      finally { this.saving = false }
    },
    async cancelSession(s) {
      if (!confirm('ยกเลิก "' + s.title + '" ? (ลบทันที — นักเรียนที่ดูอยู่จะเห็นหน้ายกเลิก)')) return
      try {
        await api.delete('/admin/live/' + s._id)
        this.successMsg = 'ยกเลิก + ลบตารางเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 4000)
        await this.loadSessions()
      } catch (err) { this.error = err.response?.data?.message || 'ยกเลิกล้มเหลว' }
    },
    async confirmDeleteSession(s) {
      if (!confirm('ลบตาราง "' + s.title + '" ?')) return
      try {
        await api.delete('/admin/live/' + s._id)
        this.successMsg = 'ลบเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
        await this.loadSessions()
      } catch (err) { this.error = err.response?.data?.message || 'ลบล้มเหลว' }
    },

    // ═══ Helpers ═══
    getContentPdfCount(session) {
      const cId = session.liveContentId?._id || session.liveContentId
      const content = this.contents.find(c => c._id === cId)
      return content?.pdfFiles?.length || 0
    },
    computeStatus(s) {
      if (s.computedStatus) return s.computedStatus
      const now = Date.now()
      const start = new Date(s.scheduledAt).getTime()
      const dur = (s.videoDurationSec || 7200) * 1000
      if (now < start) return 'waiting'
      if (now < start + dur) return 'live'
      return 'ended'
    },
    liveProgress(s) {
      if (!s.videoDurationSec) return 0
      const elapsed = (Date.now() - new Date(s.scheduledAt).getTime()) / 1000
      return Math.min(100, Math.max(0, (elapsed / s.videoDurationSec) * 100))
    },
    liveElapsed(s) {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(s.scheduledAt).getTime()) / 1000))
      return this.formatDuration(elapsed)
    },
    formatThaiDate(iso) {
      if (!iso) return '-'
      return new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    formatDuration(sec) {
      if (!sec) return '-'
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
      if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      return `${m}:${String(s).padStart(2,'0')}`
    },
    toLocalDatetimeInput(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      const thai = new Date(d.getTime() + 7 * 60 * 60 * 1000)
      return `${thai.getUTCFullYear()}-${String(thai.getUTCMonth()+1).padStart(2,'0')}-${String(thai.getUTCDate()).padStart(2,'0')}T${String(thai.getUTCHours()).padStart(2,'0')}:${String(thai.getUTCMinutes()).padStart(2,'0')}`
    },
    // TV
    shiftTvDate(days) { const d = new Date(this.tvDate + 'T00:00:00'); d.setDate(d.getDate() + days); this.tvDate = d.toISOString().slice(0, 10) },
    tvSessionsForDate(pkg) {
      return pkg.sessions.filter(s => {
        const d = new Date(new Date(s.scheduledAt).getTime() + 7 * 3600000)
        return d.toISOString().slice(0, 10) === this.tvDate
      })
    },
    tvBlockStyle(s) {
      const thai = new Date(new Date(s.scheduledAt).getTime() + 7 * 3600000)
      const h = thai.getUTCHours() + thai.getUTCMinutes() / 60
      const dur = (s.videoDurationSec || 3600) / 3600
      const left = Math.max(0, (h - 6) * 100)
      return { left: left + 'px', width: Math.min(Math.max(dur * 100, 50), this.tvTotalWidth - left) + 'px' }
    },
    tvBlockTime(s) {
      const start = new Date(s.scheduledAt)
      const thai = new Date(start.getTime() + 7 * 3600000)
      const endMs = start.getTime() + (s.videoDurationSec || 3600) * 1000
      const thaiEnd = new Date(endMs + 7 * 3600000)
      return `${String(thai.getUTCHours()).padStart(2,'0')}:${String(thai.getUTCMinutes()).padStart(2,'0')}–${String(thaiEnd.getUTCHours()).padStart(2,'0')}:${String(thaiEnd.getUTCMinutes()).padStart(2,'0')}`
    }
  }
}
</script>

<style scoped>
.admin-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  padding: 32px 0; color: white;
}
.admin-hero-inner { display: flex; align-items: center; gap: 16px; }
.admin-hero-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
}
.admin-hero h1 { font-size: 22px; font-weight: 800; margin: 0 0 3px; }
.admin-hero p { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 20px; }
.section { padding: 24px 20px; }
.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
.alert-error { background: #fee; border: 1px solid #fcc; color: #c00; }
.alert-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

/* ══ Main Tabs ══ */
.main-tabs {
  display: flex; gap: 4px; padding: 16px 0 0;
  border-bottom: 1px solid #e2e8f0;
}
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; background: transparent;
  font-size: 14px; font-weight: 600; color: #64748b;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s; border-radius: 8px 8px 0 0;
}
.tab-btn:hover { color: #0f172a; background: #f8fafc; }
.tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; background: #eff6ff; }

/* ══ Content Tab ══ */
.content-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.content-desc { font-size: 13px; color: #64748b; margin: 0; }
.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }

.content-card {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 14px 18px; margin-bottom: 10px; transition: box-shadow 0.15s;
}
.content-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.cc-main { min-width: 0; flex: 1; }
.cc-title { font-size: 15px; font-weight: 700; color: #0f172a; }
.cc-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
.cc-duration { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
.cc-pdf-count { font-size: 11px; color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.cc-drm { font-size: 10px; color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.cc-used { font-size: 11px; color: #94a3b8; }
.cc-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ══ Schedule Tab ══ */
.schedule-header { display: flex; align-items: center; margin-bottom: 16px; }

/* ══ Room Card ══ */
.room-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  margin-bottom: 20px; overflow: hidden; transition: box-shadow 0.15s;
}
.room-card:hover { box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
.room-card.room-live { border-color: #fca5a5; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }
.room-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; gap: 12px;
}
.room-card.room-live .room-header { background: #fef2f2; border-bottom-color: #fecaca; }
.room-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
.room-name { font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.room-live-dot { width: 10px; height: 10px; background: #ef4444; border-radius: 50%; animation: livePulse 1s infinite; flex-shrink: 0; }
.room-count { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
.room-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.room-live-badge { font-size: 11px; font-weight: 700; color: #dc2626; background: #fee2e2; padding: 3px 10px; border-radius: 20px; animation: livePulse 1.5s infinite; }
.btn-sm { font-size: 12px; padding: 6px 12px; }
.btn-add-schedule { display: flex; align-items: center; gap: 4px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-add-schedule:hover { opacity: 0.85; }
.room-empty { padding: 24px 20px; text-align: center; color: #94a3b8; font-size: 13px; }
.room-sessions { padding: 0; }
.session-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
.session-row:last-child { border-bottom: none; }
.session-row:hover { background: #fafbfc; }
.session-row.is-live { background: #fef2f2; }
.row-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.row-info { min-width: 0; }
.row-title { font-size: 14px; font-weight: 600; color: #1e293b; }
.row-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.live-progress-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.live-progress-bar { flex: 1; height: 4px; background: #fecaca; border-radius: 4px; overflow: hidden; min-width: 60px; }
.live-progress-fill { height: 100%; background: #ef4444; border-radius: 4px; transition: width 1s linear; }
.live-elapsed { font-size: 11px; color: #ef4444; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.live-viewers { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
.pdf-tag { background: #dbeafe; color: #2563eb; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-live { background: #ef4444; animation: livePulse 1s infinite; }
.dot-waiting { background: #f59e0b; }
.dot-ended { background: #cbd5e1; }
.row-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ══ Icon Buttons ══ */
.btn-icon { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.btn-icon:hover { background: #f1f5f9; color: #0f172a; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-icon-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.btn-icon-disabled { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: not-allowed; }

/* ══ Modal ══ */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: #fff; border-radius: 14px; padding: 28px; width: 440px; max-width: 92vw; max-height: 90vh; overflow-y: auto; }
.modal-wide { width: 540px; }
.modal-box h2 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 20px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

/* ══ Form ══ */
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
.form-control { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #0f172a; background: #fff; outline: none; box-sizing: border-box; }
.form-control:focus { border-color: #3b82f6; }
.mono-input { font-family: monospace; font-size: 12px; }
.time-picker { display: flex; align-items: center; gap: 6px; }
.time-select { width: 70px; text-align: center; font-size: 16px; font-weight: 700; }
.time-colon { font-size: 20px; font-weight: 800; color: #0f172a; }
.time-label { font-size: 14px; color: #64748b; font-weight: 600; }
.form-error { font-size: 11px; color: #dc2626; font-weight: 600; margin-top: 4px; }

/* PDF file rows */
.pdf-file-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.pdf-name-input { flex: 1; }
.pdf-file-input { flex: 1.2; }

/* Video dropdown */
.video-dropdown { position: relative; }
.video-dropdown-list { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 250px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.12); margin-top: 4px; }
.video-dropdown-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
.video-dropdown-item:hover { background: #f8fafc; }
.video-dropdown-item:last-child { border-bottom: none; }
.vdi-title { font-size: 13px; font-weight: 600; color: #1e293b; }
.vdi-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.vdi-uuid { font-family: monospace; }
.selected-video { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.sv-label { font-size: 11px; color: #64748b; }
.sv-uuid { font-family: monospace; font-size: 11px; color: #3b82f6; font-weight: 600; }

/* ══ Buttons ══ */
.btn { padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
.btn-outline:hover { background: #f8fafc; }

/* ══ View Toggle ══ */
.view-toggle { display: flex; gap: 4px; background: #f1f5f9; border-radius: 8px; padding: 3px; }
.vt-btn { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: transparent; color: #64748b; transition: all 0.15s; }
.vt-btn:hover { color: #0f172a; }
.vt-btn.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* ══ TV Schedule ══ */
.tv-schedule { margin-top: 4px; }
.tv-date-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.tv-date-input { width: 150px; font-size: 13px; padding: 6px 10px; }
.tv-today-btn { font-weight: 700; }
.tv-date-label { font-size: 14px; font-weight: 700; color: #0f172a; margin-left: 8px; }
.tv-grid-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
.tv-grid { position: relative; }
.tv-row { display: flex; border-bottom: 1px solid #f1f5f9; }
.tv-row:last-child { border-bottom: none; }
.tv-header-row { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.tv-row-empty { opacity: 0.5; }
.tv-label { flex-shrink: 0; padding: 10px 12px; font-size: 13px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; border-right: 1px solid #e2e8f0; background: #fafbfc; position: sticky; left: 0; z-index: 2; }
.tv-header-row .tv-label { font-size: 11px; color: #94a3b8; font-weight: 600; background: #f8fafc; }
.tv-ch-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.tv-ch-count { font-size: 10px; color: #94a3b8; background: #f1f5f9; padding: 1px 6px; border-radius: 10px; }
.tv-timeline { position: relative; height: 52px; flex-shrink: 0; }
.tv-header-row .tv-timeline { height: 30px; }
.tv-hour-mark { position: absolute; top: 0; font-size: 10px; color: #94a3b8; font-weight: 600; transform: translateX(4px); line-height: 30px; }
.tv-grid-line { position: absolute; top: 0; bottom: 0; width: 1px; background: #f1f5f9; }
.tv-now-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; z-index: 1; }
.tv-now-dot { position: absolute; top: 50%; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; z-index: 1; transform: translate(-3px, -50%); }
.tv-block { position: absolute; top: 6px; height: 40px; border-radius: 6px; padding: 4px 8px; cursor: pointer; overflow: hidden; transition: opacity 0.15s; z-index: 1; display: flex; flex-direction: column; justify-content: center; }
.tv-block:hover { opacity: 0.85; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.tv-block-title { font-size: 11px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tv-block-time { font-size: 9px; color: rgba(255,255,255,0.8); white-space: nowrap; }
.tv-live { background: linear-gradient(135deg, #ef4444, #dc2626); }
.tv-waiting { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tv-ended { background: linear-gradient(135deg, #94a3b8, #64748b); }
.tv-empty-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; color: #cbd5e1; }
.tv-legend { display: flex; align-items: center; gap: 16px; margin-top: 12px; font-size: 11px; color: #64748b; }
.tv-legend-item { display: flex; align-items: center; gap: 4px; }
.tv-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.tv-legend-line { width: 12px; height: 2px; background: #ef4444; border-radius: 1px; }

@keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

/* Responsive */
@media (max-width: 640px) {
  .room-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .room-actions { align-self: flex-end; }
  .session-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .row-actions { align-self: flex-end; }
  .admin-hero-inner { flex-wrap: wrap; }
  .main-tabs { gap: 0; }
  .tab-btn { padding: 8px 12px; font-size: 13px; }
  .content-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .pdf-file-row { flex-direction: column; }
}
</style>
