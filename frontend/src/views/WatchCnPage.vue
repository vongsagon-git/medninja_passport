<template>
  <div class="watch-page" :class="{ 'sidebar-open': sidebarOpen, 'line-blur-bg': !browserOk }">
    <!-- LINE Link — บังคับเชื่อม LINE ก่อนเข้าเรียน (ปิดไม่ได้) -->
    <div v-if="showLineLinkPopup" class="line-popup-overlay" style="z-index:9999">
      <div class="line-popup-card">
        <div style="text-align:center">
          <div style="font-size:40px;margin-bottom:8px">📢</div>
          <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">กรุณาเชื่อม LINE ก่อนเข้าเรียน</h2>
          <p style="font-size:13px;color:#64748b;margin:0 0 16px;line-height:1.6">
            ตั้งแต่เวอร์ชันใหม่ ระบบจะส่งแจ้งเตือนบทเรียนใหม่<br>
            สื่อการสอน และตารางสอนให้ทาง LINE<br>
            กรุณาเชื่อม LINE เพื่อเข้าเรียน
          </p>
          <img :src="lineLinkQrUrl" alt="Scan QR" style="width:180px;height:180px;border-radius:12px;border:2px solid #e2e8f0" />
          <p style="font-size:12px;color:#06c755;font-weight:700;margin:12px 0 8px">Scan QR ด้วย LINE</p>
          <a :href="lineLinkUrl" target="_blank" style="display:inline-block;background:#06c755;color:#fff;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="vertical-align:middle;margin-right:4px"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            เชื่อม LINE
          </a>
          <p style="font-size:11px;color:#94a3b8;margin-top:12px">เชื่อมครั้งเดียว ใช้ได้ตลอด</p>
        </div>
      </div>
    </div>

    <!-- Mobile in-app (LINE/FB/IG) → blur overlay บังคับเปิดข้างนอก -->
    <div v-if="!browserOk && isMobile" class="line-blur-overlay">
      <div class="line-blur-card">
        <div class="line-blur-play" @click="openInBrowser">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
        </div>
        <h2>เปิดใน Browser เพื่อดูวีดีโอ</h2>
        <p>วีดีโอไม่สามารถเล่นใน LINE ได้</p>
        <button class="line-blur-btn-primary" @click="openInBrowser">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style="vertical-align:-3px;margin-right:8px"><path fill-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clip-rule="evenodd"/></svg>
          กดเล่นเลย
        </button>
        <div class="line-blur-row">
          <button class="line-blur-btn-outline" @click="copyLink">
            {{ linkCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์' }}
          </button>
          <a href="https://medninja.academy" class="line-blur-btn-outline">เข้าเว็บ</a>
        </div>
      </div>
    </div>

    <!-- Desktop ไม่ใช่ Chrome → บอกให้ใช้ Chrome -->
    <div v-else-if="!browserOk && !isMobile" class="line-blur-overlay">
      <div class="line-blur-card">
        <div class="line-blur-play" style="cursor:default">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a7 7 0 016.32 4H12a3 3 0 00-2.83 4H6.34A7 7 0 0112 5zM5 12c0-.94.2-1.83.55-2.64l3.83 6.64A7.001 7.001 0 015 12zm7 7c-.34 0-.67-.03-1-.08l3.5-6.06A2.99 2.99 0 0015 12c0-.49-.12-.95-.32-1.36h4.27A7 7 0 0112 19z"/></svg>
        </div>
        <h2>กรุณาใช้ Google Chrome เพื่อดูวีดีโอ</h2>
        <p>ระบบรองรับเฉพาะ Google Chrome บน Desktop (Windows / macOS / Linux)<br>กรุณาเปิดลิงก์นี้ใน Chrome เพื่อดูวีดีโอ</p>
        <div class="line-blur-row">
          <button class="line-blur-btn-outline" @click="copyLink">
            {{ linkCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์' }}
          </button>
          <a href="https://www.google.com/chrome/" target="_blank" class="line-blur-btn-outline">ดาวน์โหลด Chrome</a>
        </div>
      </div>
    </div>

    <!-- Main layout -->
      <!-- ══ Top bar ══ -->
      <header class="w-topbar">
        <router-link v-if="!isDemo" :to="backUrl" class="w-back" title="กลับ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        </router-link>

        <div class="w-topbar-info">
          <span v-if="isAdminPreview" class="w-admin-badge">ADMIN PREVIEW</span>
          <span v-if="section" class="w-section-name">{{ section.code }} — {{ section.name }}</span>
        </div>

        <!-- Progress pill -->
        <div v-if="section" class="w-progress-pill">
          <div class="w-progress-bar-mini">
            <div class="w-progress-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <span>{{ watchedCount }}/{{ totalVideos }}</span>
        </div>

        <!-- ปุ่มแก้ปัญหา -->
        <button class="w-fix-btn" @click="showFixModal = true" title="ดูไม่ได้? กดที่นี่">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>
          <span class="w-fix-text">ดูไม่ได้?</span>
        </button>

        <!-- Toggle sidebar -->
        <button class="w-sidebar-toggle" @click="sidebarOpen = !sidebarOpen" :title="sidebarOpen ? 'ซ่อนรายการ' : 'แสดงรายการ'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clip-rule="evenodd"/></svg>
        </button>
      </header>

      <!-- ══ Content area ══ -->
      <div class="w-layout">
        <!-- Left: Video player -->
        <main class="w-main">
          <!-- Loading -->
          <div v-if="activationStore.loading" class="w-player-area">
            <div class="w-player-box">
              <div class="skeleton" style="width:100%;height:100%;position:absolute;inset:0"></div>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="activationStore.error" class="w-player-area">
            <div class="w-player-box">
              <div class="player-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
                <p>{{ activationStore.error }}</p>
              </div>
            </div>
          </div>

          <!-- Player -->
          <div v-else-if="video" class="w-player-area" @contextmenu.prevent>
            <div class="w-player-box" :class="{ 'is-fullscreen': isFullscreen }">
              <!-- Replaced overlay — มี tab อื่นกำลังดูอยู่ -->
              <!-- Recorder blocked -->
              <div v-if="recorderBlocked" class="replaced-overlay" style="z-index:100">
                <div class="replaced-card">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="color:#ef4444;margin-bottom:12px"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd"/></svg>
                  <p style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">ไม่สามารถเล่นวีดีโอได้</p>
                  <p style="font-size:13px;color:#fca5a5;margin-bottom:14px">ตรวจพบส่วนขยาย (Extension) ที่ไม่อนุญาต<br>กรุณาปิด Extension แล้วรีเฟรชหน้านี้</p>
                  <button @click="$router.go(0)" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:12px">รีเฟรชหน้านี้</button>
                  <p style="font-size:11px;color:#94a3b8">หากยังพบปัญหา ติดต่อแอดมิน</p>
                </div>
              </div>
              <div v-if="replaced" class="replaced-overlay">
                <div class="replaced-card">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="color:#c084fc;margin-bottom:12px"><path fill-rule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z" clip-rule="evenodd"/></svg>
                  <p style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">มี tab อื่นกำลังเปิดวีดีโออยู่</p>
                  <p style="font-size:13px;color:#c4b5fd;margin-bottom:14px">ดูได้ทีละ 1 หน้าต่างเท่านั้น</p>
                  <!-- ข้อมูล tab ที่กำลัง active -->
                  <div v-if="activeTabInfo" style="background:rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;margin-bottom:14px;text-align:left;">
                    <p style="font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Tab ที่กำลังดูอยู่</p>
                    <p style="font-size:13px;color:#fff;font-weight:600;">{{ activeTabInfo.videoTitle || 'ไม่ทราบ' }}</p>
                    <p style="font-size:12px;color:#c4b5fd;">{{ activeTabInfo.sectionName || '' }}</p>
                    <p style="font-size:11px;color:#94a3b8;margin-top:4px;">{{ activeTabInfo.os || '?' }} · {{ activeTabInfo.browser || '?' }}</p>
                  </div>
                  <button @click="_reclaimTab" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:16px">กลับมาดูที่นี่</button>
                  <p style="font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:8px">กลับหน้าเรียนอัตโนมัติใน {{ replacedCountdown }} วินาที</p>
                  <router-link :to="backUrl" style="color:#a78bfa;font-size:13px;text-decoration:underline;">กลับหน้าเรียนเลย</router-link>
                </div>
              </div>
              <!-- Idle warning — หยุดดูนานเกินไป -->
              <div v-if="showIdleWarning" class="replaced-overlay">
                <div class="replaced-card">
                  <p style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">หยุดเล่นนานเกินไป</p>
                  <p style="font-size:13px;color:#c4b5fd;margin-bottom:14px">กดปุ่มด้านล่างเพื่อดูต่อ</p>
                  <button @click="_clearIdleTimer(); _resumePlay()" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:16px">ดูต่อ</button>
                  <p style="font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:8px">ปิดอัตโนมัติใน {{ idleCountdown }} วินาที</p>
                  <router-link :to="backUrl" style="color:#a78bfa;font-size:13px;text-decoration:underline;">กลับหน้าเรียนเลย</router-link>
                </div>
              </div>
              <!-- ⭐ Alibaba VOD player container (CN mirror) -->
              <div
                v-if="hasAliVideo && !replaced && !recorderBlocked"
                id="J_prismPlayer"
                ref="aliPlayerBox"
                class="ali-player-box"
              ></div>

              <!-- Loading overlay — บังจน Ali player ready -->
              <div v-if="hasAliVideo && !replaced && !recorderBlocked && !playerReady" class="player-loading-overlay">
                <div class="skeleton" style="width:100%;height:100%;position:absolute;inset:0"></div>
              </div>
              <!-- ⭐ CN: ไม่มี aliVideoId → รออัพโหลด -->
              <div v-if="!hasAliVideo" class="player-placeholder cn-no-video">
                <div class="placeholder-content">
                  <div class="placeholder-play" style="background:#f1f5f9">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#94a3b8"><path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3H4.5a1.5 1.5 0 00-1.5 1.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5h-2.25v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clip-rule="evenodd"/></svg>
                  </div>
                  <p class="placeholder-title">{{ video.title }}</p>
                  <p class="placeholder-sub">🇨🇳 วิดีโอนี้ยังไม่พร้อมใช้งานสำหรับผู้ใช้ในประเทศจีน<br>กรุณาติดต่อ admin เพื่ออัพโหลด</p>
                </div>
              </div>
              <div v-else-if="replaced || recorderBlocked" class="player-placeholder">
                <div class="placeholder-content">
                  <div class="placeholder-play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                  </div>
                  <p class="placeholder-title">{{ video.title }}</p>
                  <p class="placeholder-sub">กำลังโหลดวีดีโอ...</p>
                </div>
              </div>
              <!-- Watermark layer — pointer-events:none ไม่บล็อก player -->
              <div v-if="watermarkText" class="wm-overlay">
                <!-- Grid เฉียง -->
                <div v-if="wmCurrentStyle === 'grid'" class="wm-grid">
                  <span v-for="i in 40" :key="i" class="wm-text" :style="{ fontSize: wmCurrentSize + 'px' }">{{ wmLine }}</span>
                </div>
                <!-- Center กลางจอ -->
                <div v-else class="wm-center" :style="{ fontSize: wmCurrentSize + 'px' }">
                  <span v-for="(line, idx) in wmParts" :key="idx">{{ line }}</span>
                </div>
              </div>
              <!-- ⭐ Custom Aliplayer Controls Layer (seek bar + play + time + speed + volume + fullscreen) -->
              <div v-if="hasAliVideo && playerReady" class="ali-ctl-layer" :class="{ hidden: !aliControlsVisible }" @click.self="aliOnPlayerTap">
                <!-- Big center PLAY only — pause ใช้ปุ่มเล็กที่ bottom bar (กัน block seek) -->
                <button v-if="!isPlaying" class="ali-ctl-big-play" @click="aliTogglePlay" title="เล่น">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                </button>
                <!-- Bottom bar: seek + controls -->
                <div class="ali-ctl-bar">
                  <div class="ali-ctl-timeline">
                    <input
                      type="range"
                      class="ali-ctl-seek"
                      :min="0"
                      :max="aliDuration || 100"
                      :step="0.1"
                      :value="aliSeeking ? aliSeekValue : aliCurrentTime"
                      :style="{ '--pct': (((aliSeeking ? aliSeekValue : aliCurrentTime) / (aliDuration || 1)) * 100) + '%' }"
                      @mousedown="aliSeekStart"
                      @touchstart="aliSeekStart"
                      @input="aliSeekMove"
                      @mouseup="aliSeekEnd"
                      @touchend="aliSeekEnd"
                    />
                  </div>
                  <div class="ali-ctl-row">
                    <button class="ali-ctl-btn" @click="aliTogglePlay" :title="isPlaying ? 'หยุด' : 'เล่น'">
                      <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd"/></svg>
                    </button>
                    <button class="ali-ctl-btn" @click="aliSeek(Math.max(0, aliCurrentTime - 10))" title="ย้อน 10 วิ">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12.5 5.5v-3l-4 4 4 4v-3c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                    </button>
                    <button class="ali-ctl-btn" @click="aliSeek(Math.min(aliDuration, aliCurrentTime + 10))" title="ข้าม 10 วิ">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.5 5.5v-3l4 4-4 4v-3c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg>
                    </button>
                    <div class="ali-ctl-time">
                      <span>{{ aliFmtTime(aliCurrentTime) }}</span>
                      <span class="ali-ctl-time-sep">/</span>
                      <span class="ali-ctl-time-total">{{ aliFmtTime(aliDuration) }}</span>
                    </div>
                    <div class="ali-ctl-spacer"></div>
                    <!-- Volume (hide on mobile) -->
                    <div class="ali-ctl-volume hide-mobile">
                      <button class="ali-ctl-btn" @click="aliToggleMute" :title="aliMuted ? 'เปิดเสียง' : 'ปิดเสียง'">
                        <svg v-if="!aliMuted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                      </button>
                      <input type="range" class="ali-ctl-vol" :min="0" :max="1" :step="0.05" :value="aliMuted ? 0 : aliVolume" @input="aliOnVolumeInput" />
                    </div>
                    <!-- Speed -->
                    <div class="ali-ctl-speed-wrap">
                      <button class="ali-ctl-btn ali-ctl-speed-btn" @click="aliShowSpeedMenu = !aliShowSpeedMenu" title="ความเร็ว">{{ aliSpeed }}x</button>
                      <div v-if="aliShowSpeedMenu" class="ali-ctl-speed-menu">
                        <button v-for="s in [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]" :key="s" class="ali-ctl-speed-item" :class="{ active: aliSpeed === s }" @click="aliSetSpeed(s)">{{ s }}x</button>
                      </div>
                    </div>
                    <!-- Fullscreen -->
                    <button class="ali-ctl-btn" @click="aliToggleFullscreen" :title="isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'">
                      <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Video info bar (below player) -->
            <div class="w-video-info">
              <div class="w-video-meta">
                <h1 class="w-video-title">
                  {{ video.title }}
                  <span v-if="isBonus" class="w-bonus-badge">เสริม</span>
                </h1>
                <div class="w-video-sub">
                  <button v-if="isBonus" class="w-bonus-nav-btn" @click="goVideo(videoIndex)">กลับ VDO หลัก</button>
                  <button v-else-if="video && video.hasBonusVideo" class="w-bonus-nav-btn bonus" @click="goVideo(videoIndex, true)">&#11088; {{ video.bonusTitle || 'VDO เสริม' }}</button>
                  <span class="w-video-duration">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd"/></svg>
                    {{ video.duration }}
                  </span>
                  <span class="w-video-idx">วีดีโอที่ {{ videoIndex + 1 }} จาก {{ totalVideos }}</span>
                  <!-- ⭐ CN: Ali serve badge — บอก variant + ID ตัวท้าย + serve ถูกไหม -->
                  <span v-if="!isDemo" class="w-drm-badge" :class="aliServeCheck.ok ? 'drm-widevine' : 'drm-protection'" :title="aliServeCheck.ok ? 'Serve ถูก' : 'Serve ผิด'">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                    {{ aliServeCheck.variant === 'drm' ? 'CHINA WIDEVINE' : 'CHINA PROTECTION' }}
                    <span v-if="aliServeCheck.idTail"> · …{{ aliServeCheck.idTail }}</span>
                    <span :style="{ color: aliServeCheck.ok ? '#4ade80' : '#f87171', marginLeft: '4px' }">{{ aliServeCheck.ok ? '✓' : '✗' }}</span>
                  </span>
                  <span v-if="deviceInfo" class="w-device-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clip-rule="evenodd"/></svg>
                    {{ deviceInfo }}
                  </span>
                  <span v-if="wmConfig" class="w-wm-badge">{{ wmCurrentStyle }} · {{ wmCurrentSize }}px · W:{{ _wmWidth }}px</span>
                  <span v-if="appVer" class="w-wm-badge" style="color:#10b981">{{ appVer }}</span>
                </div>
              </div>
              <div class="w-video-actions">
                <!-- ⭐ CN: ปิดปุ่ม 'ถามคุณหมอ' → แจ้งส่งคำถามทาง WeChat แทน -->
                <button v-if="!isDemo" class="w-ask-btn w-ask-cn" @click="_alertWeChat" title="ส่งคำถามทาง WeChat">
                  <span style="font-size:14px;line-height:1">💬</span>
                  ส่งคำถามทาง WeChat
                </button>
                <button v-if="!isDemo" class="w-diag-btn" @click="$router.push('/doctor-cn')" title="ตรวจสอบระบบ">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>
                  ตรวจสอบระบบ
                </button>
                <button v-if="!isDemo && activationStore.hasAnyMiniApp" class="w-mini-btn" @click="showMiniAppsModal = true" title="Mini Apps">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z"/></svg>
                  Mini Apps
                </button>
                <button class="w-nav-btn" :disabled="videoIndex <= 0" @click="goVideo(videoIndex - 1)" title="ก่อนหน้า">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/></svg>
                </button>
                <button class="w-nav-btn w-nav-btn-next" :disabled="videoIndex >= totalVideos - 1" @click="goVideo(videoIndex + 1)" title="ถัดไป">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                </button>
                <button class="w-mark-btn" :class="{ done: isWatched(videoIndex) }" @click="toggleWatched(videoIndex)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                  {{ isWatched(videoIndex) ? 'ดูแล้ว' : 'ทำเครื่องหมายว่าดูแล้ว' }}
                </button>
              </div>
            </div>

            <!-- Demo: Streaming Technology Showcase -->
            <div v-if="isDemo" class="demo-feat">
              <div class="demo-feat-header">
                <div class="demo-feat-badge">STREAMING TECHNOLOGY</div>
                <div class="demo-feat-title">ระบบเรียนออนไลน์ระดับมืออาชีพ</div>
                <div class="demo-feat-sub">เทคโนโลยี Adaptive Streaming มาตรฐานเดียวกับ Netflix</div>
              </div>
              <div class="demo-feat-list">
                <div class="demo-feat-item">
                  <div class="demo-fi-icon demo-fi-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                  </div>
                  <div><b>Adaptive Bitrate</b><span>ปรับความคมชัดอัตโนมัติตามเน็ต ไม่มีกระตุก</span></div>
                </div>
                <div class="demo-feat-item">
                  <div class="demo-fi-icon demo-fi-purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
                  </div>
                  <div><b>ส่งคำถามถึงผู้สอนได้ทันที</b><span>สงสัยตรงไหน กดถามได้เลยระหว่างเรียน</span></div>
                </div>
                <div class="demo-feat-item">
                  <div class="demo-fi-icon demo-fi-cyan">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582"/></svg>
                  </div>
                  <div><b>ดูได้ทุกอุปกรณ์ ทั่วโลก</b><span>PC, มือถือ, แท็บเล็ต · Server กระจายทั่วโลก ไม่กระตุก</span></div>
                </div>
              </div>
            </div>

          </div>
        </main>

        <!-- Right: Sidebar playlist -->
        <aside class="w-sidebar" :class="{ open: sidebarOpen }">
          <div class="w-sidebar-header">
            <h3>เนื้อหาในบทเรียน</h3>
            <span class="w-sidebar-count">{{ watchedCount }}/{{ totalVideos }} บท</span>
            <button class="w-sidebar-close" @click="sidebarOpen = false">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
            </button>
          </div>

          <!-- Section progress bar -->
          <div class="w-sidebar-progress">
            <div class="w-sidebar-progress-bar">
              <div class="w-sidebar-progress-fill" :style="{ width: progressPct + '%' }"></div>
            </div>
          </div>

          <!-- Video list (จัดกลุ่มตาม topic) -->
          <div class="w-playlist">
            <template v-for="(item, i) in groupedPlaylist" :key="i">
              <div v-if="item.type === 'topic'" class="w-pl-topic">{{ item.name }}</div>
              <div v-else-if="item.type === 'subtopic'" class="w-pl-subtopic">
                <span class="w-pl-subtopic-icon">›</span>
                {{ item.name }}
              </div>
              <!-- Bonus video item -->
              <button
                v-else-if="item.type === 'bonus'"
                class="w-playlist-item w-pl-bonus"
                :class="{ active: item.idx === videoIndex && isBonus, 'w-pl-locked': item.vid && item.vid.bonusLocked }"
                :disabled="item.vid && item.vid.bonusLocked"
                @click="!(item.vid && item.vid.bonusLocked) && goVideo(item.idx, true)"
              >
                <div class="w-pl-check w-pl-bonus-star">
                  <svg v-if="item.vid && item.vid.bonusLocked" viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                  <template v-else>&#11088;</template>
                </div>
                <div class="w-pl-info">
                  <span class="w-pl-title">{{ (item.vid && item.vid.bonusLocked) ? (item.vid.bonusLabel || 'VDO เสริม') : item.bonusTitle }}</span>
                  <span v-if="item.vid && item.vid.bonusLocked" class="w-pl-tier-badge">ระดับ 6</span>
                  <span v-else class="w-pl-duration">{{ item.bonusDuration }} <span style="color:#d97706;font-weight:700;">{{ item.bonusLabel || 'เสริม' }}</span></span>
                </div>
                <div v-if="item.idx === videoIndex && isBonus" class="w-pl-playing">
                  <span class="w-pl-bars"><span></span><span></span><span></span></span>
                </div>
              </button>
              <!-- Normal video item -->
              <button
                v-else
                class="w-playlist-item"
                :class="{ active: item.idx === videoIndex && !isBonus, watched: isWatched(item.idx), 'w-pl-locked': item.vid && item.vid.locked }"
                :disabled="item.vid && item.vid.locked"
                @click="!(item.vid && item.vid.locked) && goVideo(item.idx)"
              >
                <div class="w-pl-check">
                  <svg v-if="item.vid && item.vid.locked" viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
                  <svg v-else-if="isWatched(item.idx)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                  <span v-else class="w-pl-num">{{ item.idx + 1 }}</span>
                </div>
                <div class="w-pl-info">
                  <span class="w-pl-title">{{ item.vid.title }}</span>
                  <span v-if="item.vid && item.vid.locked" class="w-pl-tier-badge">ระดับ {{ item.vid.requiredTier }}</span>
                  <span v-else class="w-pl-duration">{{ item.vid.duration }}</span>
                </div>
                <div v-if="item.idx === videoIndex && !isBonus" class="w-pl-playing">
                  <span class="w-pl-bars">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              </button>
            </template>
          </div>

          <!-- Demo: โฆษณาคอร์ส -->
          <div v-if="isDemo" class="demo-promo">
            <div class="demo-promo-label">เปิดรับสมัครแล้ววันนี้</div>
            <div class="demo-promo-row">
              <a href="/courses" class="demo-promo-card">
                <img src="https://medninja.b-cdn.net/nl1+2.png" alt="NL 1+2" onerror="this.onerror=null;this.src='/logo.png'">
                <span>NL 1+2</span>
              </a>
              <a href="/courses" class="demo-promo-card">
                <img src="https://medninja.b-cdn.net/MEQ.jpg" alt="MEQ" onerror="this.onerror=null;this.src='/logo.png'">
                <span>MEQ</span>
              </a>
              <a href="/courses" class="demo-promo-card">
                <img src="https://medninja.b-cdn.net/OSCE.png" alt="OSCE" onerror="this.onerror=null;this.src='/logo.png'">
                <span>OSCE</span>
              </a>
            </div>
            <a href="/ninja-passport" class="demo-promo-btn">สมัครเรียน — Ninja Passport</a>
          </div>
        </aside>
      </div>

      <!-- Mobile: sidebar backdrop -->
      <div class="w-sidebar-backdrop" :class="{ show: sidebarOpen }" @click="sidebarOpen = false"></div>

      <!-- ══ Mini Apps Modal ══ -->
      <div v-if="showMiniAppsModal" class="mini-modal-overlay" @click.self="showMiniAppsModal = false">
        <div class="mini-modal">
          <div class="mini-modal-header">
            <h3>🚀 MINI APPS</h3>
            <button class="mini-modal-close" @click="showMiniAppsModal = false">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
            </button>
          </div>
          <p class="mini-modal-sub">เครื่องมือช่วยเรียนเพิ่มเติม (ที่คุณมีสิทธิ์ใช้)</p>
          <div class="mini-grid">
            <button v-if="miniApps.atlas" class="mini-card mini-atlas" @click="openMiniApp('atlas')">
              <div class="mini-icon">📇</div>
              <div class="mini-name">ATLAS</div>
              <div class="mini-desc">Flashcard ทบทวน</div>
            </button>
            <button v-if="miniApps.synapse" class="mini-card mini-synapse" @click="openMiniApp('synapse')">
              <div class="mini-icon">🧠</div>
              <div class="mini-name">SYNAPSE</div>
              <div class="mini-desc">E-Learning NL1</div>
            </button>
            <button v-if="miniApps.nlex" class="mini-card mini-nlex" @click="openMiniApp('nlex')">
              <div class="mini-icon">📝</div>
              <div class="mini-name">NLEX</div>
              <div class="mini-desc">ข้อสอบ NL</div>
            </button>
            <button v-if="miniApps.meqex" class="mini-card mini-meqex" @click="openMiniApp('meqex')">
              <div class="mini-icon">💉</div>
              <div class="mini-name">MEQEX</div>
              <div class="mini-desc">MEQ + AI grading</div>
            </button>
            <button v-if="miniApps.ddx" class="mini-card mini-ddx" @click="openMiniApp('ddx')">
              <div class="mini-icon">🩺</div>
              <div class="mini-name">DDX</div>
              <div class="mini-desc">DDx Training</div>
            </button>
            <button v-if="miniApps.osce" class="mini-card mini-osce" @click="openMiniApp('osce')">
              <div class="mini-icon">👨‍⚕️</div>
              <div class="mini-name">OSCE</div>
              <div class="mini-desc">Clinical skills</div>
            </button>
            <button v-if="miniApps.skill15" class="mini-card mini-skill15" @click="openMiniApp('skill15')">
              <div class="mini-icon">🔬</div>
              <div class="mini-name">15xSKILL</div>
              <div class="mini-desc">15 หัตถการ</div>
            </button>
            <button v-if="miniApps.longex" class="mini-card mini-longex" @click="openMiniApp('longex')">
              <div class="mini-icon">📋</div>
              <div class="mini-name">LONGEX</div>
              <div class="mini-desc">Long case</div>
            </button>
          </div>
        </div>
      </div>

      <!-- ══ ถามคุณหมอ Modal ══ -->
      <div v-if="showAskModal" class="diag-modal-overlay" @click.self="showAskModal = false">
        <div class="diag-modal" style="max-width:400px">
          <div class="diag-modal-header">
            <h3 style="color:#3b82f6">ถามคุณหมอ</h3>
            <button class="diag-modal-close" @click="showAskModal = false">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
            </button>
          </div>
          <!-- ยังไม่เชื่อม LINE -->
          <div v-if="!authStore.user?.lineUserId" style="padding:24px 20px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px">💬</div>
            <p style="font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:6px">กรุณาเชื่อม LINE ก่อน</p>
            <p style="font-size:12px;color:#94a3b8;margin-bottom:16px">คุณหมอจะตอบคำถามผ่านทาง LINE<br>ต้องเชื่อม LINE ก่อนถึงจะรับคำตอบได้</p>
            <a href="/my" class="diag-modal-retry" style="text-decoration:none;display:inline-block;">ไปเชื่อม LINE</a>
          </div>
          <!-- ส่งสำเร็จ -->
          <div v-else-if="askSent" style="padding:24px 20px;text-align:center;">
            <div style="color:#10b981;font-size:32px;margin-bottom:8px">&#10003;</div>
            <p style="font-size:15px;font-weight:700;color:#e2e8f0;margin-bottom:4px">ส่งคำถามแล้ว!</p>
            <p style="font-size:12px;color:#94a3b8">คุณหมอจะตอบกลับทาง LINE ของคุณ</p>
            <button class="diag-modal-retry" style="margin-top:16px" @click="askSent = false; askQuestion = ''">ถามอีกข้อ</button>
          </div>
          <!-- ฟอร์มถาม -->
          <div v-else style="padding:16px 20px;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">
              กำลังดู: <span style="color:#e2e8f0;font-weight:600">{{ video?.title || '-' }}</span>
              <span v-if="section" style="margin-left:4px">· {{ section.name }}</span>
            </div>
            <div style="font-size:11px;color:#f59e0b;margin-bottom:10px">คำตอบจะถูกส่งไปที่ LINE ของคุณ</div>
            <textarea v-model="askQuestion" rows="4" placeholder="พิมพ์คำถามที่ต้องการถามคุณหมอ..." style="width:100%;background:#2d2f31;border:1px solid #3e4143;border-radius:8px;color:#e2e8f0;padding:10px;font-size:13px;resize:vertical;font-family:inherit;"></textarea>
            <button class="diag-modal-retry" :disabled="!askQuestion.trim() || askSending" @click="sendAskQuestion" style="margin-top:10px;opacity: askQuestion.trim() && !askSending ? 1 : 0.5">
              {{ askSending ? 'กำลังส่ง...' : 'ส่งคำถาม' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ══ Diagnostic Modal ══ -->
      <div v-if="showDiagModal" class="diag-modal-overlay" @click.self="closeDiagModal">
        <div class="diag-modal">
          <div class="diag-modal-header">
            <h3>ตรวจสอบระบบการรับชมวีดีโอ</h3>
            <button class="diag-modal-close" @click="closeDiagModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
            </button>
          </div>
          <div class="diag-modal-status">
            <span class="diag-modal-badge" :class="diagDone ? (diagPassCount >= diagTotalSteps ? 'pass' : 'fail') : 'run'">
              {{ diagDone ? (diagPassCount >= diagTotalSteps ? 'PASS' : 'FAIL') : 'TESTING...' }}
            </span>
            <span v-if="diagDone" class="diag-modal-score">{{ diagPassCount }}/{{ diagTotalSteps }}</span>
          </div>
          <div class="diag-modal-steps">
            <div v-for="s in diagSteps" :key="s.n" class="dm-step" :class="s.status">
              <div class="dm-step-icon">
                <span v-if="s.status === 'wait'">{{ s.n }}</span>
                <span v-else-if="s.status === 'run'" class="dm-spin"></span>
                <span v-else-if="s.status === 'ok'" style="color:#10b981">&#10003;</span>
                <span v-else-if="s.status === 'info'" style="color:#f59e0b">!</span>
                <span v-else style="color:#ef4444">&#10007;</span>
              </div>
              <div class="dm-step-body">
                <div class="dm-step-title">{{ s.title }}</div>
                <div class="dm-step-detail" :class="s.status">{{ s.detail }}</div>
              </div>
            </div>
          </div>
          <div v-if="diagDone" class="diag-modal-footer">
            <button class="diag-modal-retry" @click="_runModalDiag">ตรวจอีกครั้ง</button>
          </div>
        </div>
      </div>

    <!-- Fix Modal — แก้ปัญหาดูไม่ได้ -->
    <div v-if="showFixModal" class="fix-overlay" @click.self="showFixModal = false">
      <div class="fix-modal">
        <div class="fix-header">
          <h3>วีดีโอดูไม่ได้? แก้ไขเบื้องต้น</h3>
          <button class="fix-close" @click="showFixModal = false">&times;</button>
        </div>
        <div class="fix-body">
          <p class="fix-intro">กดปุ่มด้านล่างเพื่อ <strong>ล้าง Cache</strong> และโหลดวีดีโอใหม่</p>
          <button class="fix-hard-reset" @click="hardReset">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clip-rule="evenodd"/></svg>
            ล้าง Cache และโหลดใหม่
          </button>

          <div class="fix-divider">หรือ ลองทำตามวิธีนี้</div>

          <div class="fix-steps">
            <div class="fix-step">
              <div class="fix-step-num">1</div>
              <div class="fix-step-content">
                <div class="fix-step-title">Hard Refresh หน้าเว็บ</div>
                <div class="fix-step-keys">
                  <span class="fix-os">Windows/Linux:</span> <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                </div>
                <div class="fix-step-keys">
                  <span class="fix-os">Mac:</span> <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                </div>
                <div class="fix-step-keys">
                  <span class="fix-os">มือถือ:</span> ปัดหน้าจอลงค้างไว้ 3 วินาที แล้วปล่อย
                </div>
              </div>
            </div>

            <div class="fix-step">
              <div class="fix-step-num">2</div>
              <div class="fix-step-content">
                <div class="fix-step-title">ล้าง Cache ของ Browser</div>
                <div class="fix-step-keys">
                  <span class="fix-os">Windows/Linux:</span> <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>
                </div>
                <div class="fix-step-keys">
                  <span class="fix-os">Mac:</span> <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>
                </div>
                <div class="fix-step-keys">
                  <span class="fix-os">มือถือ:</span> ตั้งค่า > แอป > Chrome > ล้างข้อมูล
                </div>
                <div class="fix-step-note">เลือก "Cached images and files" แล้วกด Clear</div>
              </div>
            </div>

            <div class="fix-step">
              <div class="fix-step-num">3</div>
              <div class="fix-step-content">
                <div class="fix-step-title">ลองเปลี่ยน Browser</div>
                <div class="fix-step-note">แนะนำ <strong>Google Chrome</strong> เวอร์ชันล่าสุด<br/>หลีกเลี่ยงการเปิดผ่าน LINE / Facebook / Instagram</div>
              </div>
            </div>

            <div class="fix-step">
              <div class="fix-step-num">4</div>
              <div class="fix-step-content">
                <div class="fix-step-title">ยังดูไม่ได้?</div>
                <div class="fix-step-note">
                  กด <router-link to="/diag" class="fix-link" @click="showFixModal = false">ตรวจสอบระบบ</router-link> เพื่อให้ระบบวิเคราะห์ปัญหาอัตโนมัติ
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ⭐ CN: Aliplayer Test Modal (4 flows + log หลังบ้าน) -->
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { WS_URL } from '../utils/shadowSocket'
import api from '../services/api'
import { useActivationStore } from '../stores/activation'
import { useAuthStore } from '../stores/auth'
import { checkBrowserSupport, getDeviceInfo, isExceptionPath } from '../utils/browserCheck'
import { isIOS as detectIOS, isMacSafari as detectMacSafari, getOS as detectOS, getBrowser as detectBrowser } from '../utils/deviceDetect'
import { getDeviceContext, sendLog, watchDevTools, watchRecorderExtensions, probeRecorderExtensions } from '../services/clientLogger'
import { getVersion as _getAppVersion } from '../services/versionCheck'
import { useCountryGuard } from '../composables/useCountryGuard'

const WATCHED_KEY = '__medninja_watched__'

function getWatchedMap() {
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}') } catch { return {} }
}
function saveWatchedMap(map) {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(map))
}

export default {
  name: 'WatchPage',
  setup() {
    const activationStore = useActivationStore()
    const authStore = useAuthStore()
    const browserCheck = checkBrowserSupport()
    // ⭐ CN mirror: logout ถ้า IP เปลี่ยนไม่ใช่จีน
    useCountryGuard('CN')
    return {
      activationStore,
      authStore,
      browserSupported: browserCheck.supported,
      browserMsg: browserCheck.message,
      browserDetail: browserCheck.detail,
      isMobile: browserCheck.isMobile || false,
      isDesktopModeInMobile: false,
      deviceInfo: getDeviceInfo()
    }
  },
  data() {
    return {
      sidebarOpen: true,
      wmConfig: null,
      zoomDetected: false,
      _wmTick: 0,
      _wmWidth: window.innerWidth,
      watchedMap: getWatchedMap(),
      isFullscreen: false,
      tabHidden: false,
      showLineLinkPopup: false,
      isPlaying: false,
      playerReady: false,
      // ⭐ Custom Ali controls state
      aliCurrentTime: 0,
      aliSeeking: false,      // ⭐ user กำลัง drag slider — หยุด sync จาก timeupdate
      aliSeekValue: 0,        // ค่า slider ระหว่าง drag (independent จาก currentTime)
      aliDuration: 0,
      aliVolume: 1,
      aliMuted: false,
      aliSpeed: 1,
      aliShowSpeedMenu: false,
      aliShowVolumeSlider: false,
      aliControlsVisible: true,
      _aliHideControlsTimer: null,
      _debugTime: '',
      drmType: null,
      linkCopied: false,
      tabId: crypto.randomUUID(),
      replaced: false,
      recorderBlocked: false,
      recorderName: '',
      activeTabInfo: null,
      replacedCountdown: 60,
      otherTabCount: 0,
      // ── Idle timeout ──
      idleCountdown: 0,
      showIdleWarning: false,
      // ── ถามคุณหมอ ──
      showAskModal: false,
      askQuestion: '',
      askSending: false,
      askSent: false,
      // ── Mini Apps ──
      showMiniAppsModal: false,
      // ── Fix modal ──
      showFixModal: false,
      // ── Diag modal ──
      showDiagModal: false,
      diagSteps: [],
      diagDone: false,
      diagRunning: false,
      diagPassCount: 0,
      diagTotalSteps: 6
    }
  },
  computed: {
    lineLinkUrl() {
      const token = localStorage.getItem('token') || ''
      return `https://liff.line.me/2009259048-jOiOezxi?token=${encodeURIComponent(token)}`
    },
    lineLinkQrUrl() {
      return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=L&data=${encodeURIComponent(this.lineLinkUrl)}`
    },
    isDemo() { return this.$route.meta.demo === true },
    isAdminPreview() { return this.$route.meta.adminPreview === true },
    sectionId() { return this.isDemo ? 'sec_demo' : this.$route.params.sectionId },
    videoIndex() { return parseInt(this.$route.params.videoIndex) || 0 },
    browserOk() {
      // ── LINE in-app browser → block เสมอ (แม้ exception path) ──
      // เพราะ LINE in-app เล่นวีดีโอไม่ได้ — ต้องเปิดข้างนอก
      const ua = navigator.userAgent || ''
      if (/Line\/|FBAN|FBAV|Instagram/i.test(ua)) return false
      // section พิเศษ + /demo/watch → ผ่านได้แม้ไม่ใช่ Chrome
      if (isExceptionPath(this.$route.path)) return true
      return this.browserSupported
    },
    isBonus() { return this.$route.query.bonus === '1' },
    video() { return this.activationStore.currentVideo },
    section() { return this.activationStore.currentSection },
    miniApps() { return this.activationStore.enabledMiniApps },
    videos() { return this.section?.videos || [] },
    totalVideos() { return this.videos.length },
    backUrl() {
      if (this.isDemo) return '/demo'
      if (this.isAdminPreview) return '/admin/sections'
      return `/my-cn/section/${this.sectionId}`
    },
    // ⭐ CN: เช็คว่า video มี Ali code (NoDRM หรือ DRM) พร้อมใช้ไหม
    hasAliVideo() {
      const v = this.video
      if (!v) return false
      if (this.isBonus) return !!(v.bonusAliVideoId || v.bonusAliDrmVideoId)
      return !!(v.aliVideoId || v.aliDrmVideoId)
    },
    aliServeCheck() {
      // ⭐ Template ใช้ .ok / .variant / .idTail — คืน object เสมอ (กัน undefined.ok → หน้าขาว)
      const v = this.video
      const empty = { ok: false, variant: '', idTail: '' }
      if (!v) return empty
      const variant = (v.aliChosenVariant) || (this._resolveAliVariant ? this._resolveAliVariant() : '')
      const chosen = (v.aliChosenId || this.aliVideoIdToPlay || '').trim()
      const idTail = chosen ? chosen.slice(-6) : ''
      const drmId = (v.aliDrmVideoId || '').trim()
      const noDrmId = (v.aliVideoId || '').trim()
      // ok = server เลือกตรงกับ variant ที่ device คาดหวัง
      let ok = false
      if (variant === 'drm' && chosen && chosen === drmId) ok = true
      else if (variant === 'noDrm' && chosen && chosen === noDrmId) ok = true
      else if (chosen && (chosen === drmId || chosen === noDrmId)) ok = true
      return { ok, variant, idTail }
    },
    aliVideoIdToPlay() {
      const v = this.video
      if (!v) return ''
      // ⭐ Backend เลือกให้แล้ว (aliChosenId) — trust ค่าจาก server
      if (v.aliChosenId) return v.aliChosenId
      // Fallback (backend เก่ายังไม่ส่ง aliChosenId): เลือกเองตาม device
      const isIosOrSafari = detectIOS() || detectMacSafari()
      if (this.isBonus) {
        const drm = v.bonusAliDrmVideoId || ''
        const noDrm = v.bonusAliVideoId || ''
        if (isIosOrSafari) return noDrm || drm
        return drm || noDrm
      }
      const drm = v.aliDrmVideoId || ''
      const noDrm = v.aliVideoId || ''
      if (isIosOrSafari) return noDrm || drm
      return drm || noDrm
    },
    watchedCount() {
      const key = this.sectionId
      const list = this.watchedMap[key] || []
      return list.length
    },
    progressPct() {
      if (!this.totalVideos) return 0
      return Math.round((this.watchedCount / this.totalVideos) * 100)
    },
    drmLabel() {
      const labels = { widevine: 'Widevine', fairplay: 'FairPlay', playready: 'PlayReady', none: 'No DRM' }
      return labels[this.drmType] || 'Checking...'
    },
    wmModeKey() {
      // eslint-disable-next-line no-unused-expressions
      this._wmTick // reactive trigger จาก resize

      const mobile = this.isMobile
      const portrait = window.innerHeight > window.innerWidth
      const full = this.isFullscreen
      const device = mobile ? 'mobile' : 'desktop'
      const orient = portrait ? 'Portrait' : 'Landscape'
      const fs = full ? 'Full' : ''
      return device + orient + fs
    },
    wmCurrentStyle() {
      if (!this.wmConfig) return this.isMobile ? 'center' : 'grid'
      const style = this.wmConfig[this.wmModeKey]?.style || 'grid'
      // eslint-disable-next-line no-unused-expressions
      this._wmTick // reactive trigger
      // Desktop: hysteresis breakpoint (ย่อ → center, ขยาย → grid)
      if (!this.isMobile && style === 'grid') {
        const bp = this.wmConfig.desktopBreakpoint || 900
        if (window.innerWidth < bp) return 'center'
      }
      return style
    },
    wmCurrentSize() {
      if (!this.wmConfig) return 18
      const basePx = this.wmConfig[this.wmModeKey]?.fontSize || 18
      const style = this.wmConfig[this.wmModeKey]?.style || 'grid'
      const w = this._wmWidth || window.innerWidth
      const centerBase = this.wmConfig?.centerBaseWidth || 384
      const gridBase = this.wmConfig?.gridBaseWidth || 1280
      const baseW = style === 'center' ? centerBase : gridBase
      const scaled = Math.round(basePx * (w / baseW))
      // ไม่เล็กกว่า basePx
      return Math.max(scaled, basePx)
    },
    groupedPlaylist() {
      if (!this.videos) return []
      const items = []
      let lastTopic = null
      let lastSubtopic = null
      this.videos.forEach((vid, idx) => {
        if (vid.topic && vid.topic !== lastTopic) {
          items.push({ type: 'topic', name: vid.topic })
          lastTopic = vid.topic
          lastSubtopic = null
        }
        if (vid.subtopic && vid.subtopic !== lastSubtopic) {
          items.push({ type: 'subtopic', name: vid.subtopic })
          lastSubtopic = vid.subtopic
        }
        items.push({ type: 'video', vid, idx })
        // VDO พิเศษ sub-item
        if (vid.hasBonusVideo) {
          items.push({ type: 'bonus', vid, idx, bonusLabel: vid.bonusLabel || '', bonusTitle: vid.bonusTitle || 'VDO เสริม', bonusDuration: vid.bonusDuration || '' })
        }
      })
      return items
    },
    watermarkText() {
      if (this.isDemo) return Array(5).fill('MedNinja ทดลองเรียน').join('  ·  ')
      if (this.isAdminPreview) return 'ADMIN PREVIEW  ·  MedNinja LMS'
      const u = this.authStore.user
      if (!u) return ''
      const parts = []
      if (u.firstName && u.lastName) parts.push(`${u.firstName} ${u.lastName}`)
      else if (u.name) parts.push(u.name)
      if (u.nationalId) parts.push(this.formatNid(u.nationalId))
      if (u.dateOfBirth) parts.push(u.dateOfBirth)
      if (u.email) parts.push(u.email)
      if (u.university) parts.push(u.university)
      return parts.join('  ·  ')
    },
    wmLine() {
      const t = this.watermarkText
      if (!t) return ''
      const sep = '          '
      return (t + sep).repeat(15)
    },
    wmParts() {
      if (this.isDemo) return Array(5).fill('MedNinja ทดลองเรียน')
      if (this.isAdminPreview) return ['ADMIN PREVIEW', 'MedNinja LMS']
      const u = this.authStore.user
      if (!u) return []
      const parts = []
      if (u.firstName && u.lastName) parts.push(`${u.firstName} ${u.lastName}`)
      else if (u.name) parts.push(u.name)
      if (u.nationalId) parts.push(this.formatNid(u.nationalId))
      if (u.dateOfBirth) parts.push(u.dateOfBirth)
      if (u.email) parts.push(u.email)
      if (u.university) parts.push(u.university)
      return parts
    },
    appVer() {
      const v = _getAppVersion()
      return v ? 'v.' + v.slice(-6) : ''
    }
  },
  created() {
    // เช็ค zoom ก่อนโหลดอะไร
    // ใช้ outerWidth/innerWidth (ไม่ false positive บน HiDPI 125%/150%)
    // DPR เปลี่ยนตาม Display Scale ของ OS → ใช้เช็ค zoom ไม่ได้
    if (window.outerWidth > 0 && window.innerWidth > 0) {
      const zoomRatio = window.outerWidth / window.innerWidth
      if (zoomRatio < 0.97 || zoomRatio > 1.03) {
        alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
        this.$router.push('/')
        return
      }
    }

    this._diagLog('session_start', 'WatchPage created', { detail: `route=${this.$route.path} sec=${this.sectionId} idx=${this.videoIndex} demo=${this.isDemo}` })
    this.loadVideo()
    this._loadWmConfig()
    // ═══ Socket.IO — Realtime monitor + anti-share ═══
    if (!this.isDemo) {
      this._initSocket()
      // ═══ DevTools detection → ส่งผ่าน socket ═══
      this._cleanupDevTools = watchDevTools(() => {
        if (this._socket?.connected) this._socket.emit('devtools')
        sendLog('devtools', 'เปิด DevTools (F12/Ctrl+Shift+I)', {
          sectionId: this.sectionId, videoIndex: this.videoIndex, videoTitle: this.video?.title
        })
      })
      // ═══ Stream Recorder / HLS Downloader detection (realtime — ดักตลอด) ═══
      this._cleanupRecorder = watchRecorderExtensions((info) => this._onRecorderDetected(info))
    }
    // ═══ HTTP Heartbeat fallback — เผื่อ socket disconnect ═══
    if (!this.isDemo) {
      this._sendHeartbeat()
      this._heartbeatInterval = setInterval(() => {
        if (!this._socket?.connected) this._sendHeartbeat()
      }, 10000)
      this._onBeforeUnload = () => { this._beaconClear() }
      window.addEventListener('beforeunload', this._onBeforeUnload)
    }
    // ═══ Auto-diag เบื้องหลัง — เงียบๆ ไม่แสดงอะไร ═══
    if (!this.isDemo) {
      setTimeout(() => this._runAutoDiag(), 3000) // รอให้ page โหลดก่อน
    }
    // Auto scroll ไป video ที่กำลังเล่น
    setTimeout(() => this._scrollToActive(), 1000)
    // Auto-close sidebar on mobile
    if (window.innerWidth < 1024) this.sidebarOpen = false
  },
  mounted() {
    this._mountedAt = Date.now()
    // ⭐ CN: init Aliplayer ครั้งแรก — ถ้า video โหลดเสร็จก่อน mount
    // ถ้ายังไม่มี video → รอ watcher aliVideoIdToPlay ให้ยิง init เอง (กัน double-init → 4022)
    this.$nextTick(() => {
      if (this.video && this.hasAliVideo && !this._aliPlayer) {
        this._initAliPlayer()
      }
    })
    // ═══ CN mirror: ไม่บังคับ LINE (จีนใช้ LINE ไม่ได้) ═══
    // (LINE popup logic disabled ทั้งหมด — showLineLinkPopup ค้างเป็น false)
    // Placeholder ให้ code เดิมไม่พัง:
    if (false) {
      this.showLineLinkPopup = true
      // Poll เช็คทุก 5s ว่าเชื่อมสำเร็จหรือยัง
      this._lineLinkPoll = setInterval(() => {
        this.authStore.fetchProfile().then(() => {
          if (this.authStore.user?.lineUserId) {
            this.showLineLinkPopup = false
            clearInterval(this._lineLinkPoll)
          }
        }).catch(() => {})
      }, 5000)
    }

    // ═══ Fullscreen detection ═══
    this._onFsChange = () => {
      this.isFullscreen = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', this._onFsChange)
    // Resize → update wmModeKey (rotate / resize) + counter zoom ลายน้ำ
    // ═══ Zoom detection — periodic innerWidth check (จับ Safari + ทุก browser) ═══
    this._wmBaseDpr = window.devicePixelRatio || 1
    this._zoomBaseOuterW = window.outerWidth
    this._zoomBaseInnerW = window.innerWidth
    this._onWmResize = () => {
      this._wmTick++
      this._wmWidth = window.innerWidth
    }
    window.addEventListener('resize', this._onWmResize)
    // เช็คทุก 2 วิ — แยก resize กับ zoom ด้วย outerWidth
    this._zoomCheckInterval = setInterval(() => {
      const curOuterW = window.outerWidth
      const curInnerW = window.innerWidth
      // outerWidth เปลี่ยน = resize window → อัปเดต baseline
      if (Math.abs(curOuterW - this._zoomBaseOuterW) > 10) {
        this._zoomBaseOuterW = curOuterW
        this._zoomBaseInnerW = curInnerW
        this._wmBaseDpr = window.devicePixelRatio || 1
        return
      }
      // outerWidth เท่าเดิม แต่ innerWidth เปลี่ยน = ZOOM!
      if (this._zoomBaseInnerW > 0) {
        const ratio = curInnerW / this._zoomBaseInnerW
        if (ratio < 0.97 || ratio > 1.03) {
          alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
          this.$router.push('/')
          return
        }
      }
      // DPR baseline safety net (จับ Ctrl+scroll ที่หลุดจาก block)
      const dprRatio = (window.devicePixelRatio || 1) / this._wmBaseDpr
      if (dprRatio < 0.95 || dprRatio > 1.05) {
        alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
        this.$router.push('/')
      }
    }, 2000)

    // ⚠️ Strict Protection Mode (CN) = ปิดชั่วคราว (user request 2026-07-08)
    // Reason: debug ให้ Ali player เล่นได้ก่อน — เปิดกลับหลัง stable
    // เดิม block: wheel/zoom/F12/Ctrl+Shift+I/Ctrl+U/S/P + clear clipboard PrintScreen
    // TODO: เอากลับหลัง Ali stable

    // ═══ Visibility API — pause hint when tab hidden ═══
    this._onVisChange = () => {
      if (document.hidden) {
        this.tabHidden = true
      } else {
        this.tabHidden = false
        // Tab กลับมา visible (เปิด browser หลัง sleep / switch tab กลับมา)
        // → reconnect socket ถ้า disconnect + re-emit watch:start
        if (this._socket && !this._socket.connected && !this.replaced) {
          this._socket.connect()
        }
        if (this._socket?.connected && !this.replaced) {
          this._emitWatchStart()
        }
      }
    }
    document.addEventListener('visibilitychange', this._onVisChange)

    // ═══ DevTools detection disabled ═══
    // Window size method causes false positives on Windows DPI scaling / taskbar
    // Keyboard shortcuts (F12, Ctrl+Shift+I/J/C) are already blocked above
    this.devtoolsOpen = false
    this._devtoolsCheck = null

    // ═══ Block drag ═══
    this._onDragStart = (e) => e.preventDefault()
    document.addEventListener('dragstart', this._onDragStart)

    // ═══ Lock body + html scroll + zoom — ห้าม scroll/zoom หน้า Watch ═══
    this._prevOverflow = document.body.style.overflow
    this._prevHtmlOverflow = document.documentElement.style.overflow
    this._prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // ป้องกัน touch scroll/zoom (iOS Safari ไม่สนใจ viewport meta)
    this._onTouchStart = (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    this._onTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault()
      // ปล่อยให้ sidebar playlist touch scroll ได้
      if (e.target.closest('.w-playlist')) return
      if (!e.target.closest('iframe')) e.preventDefault()
    }
    // Safari gesture events (pinch zoom)
    this._onGesture = (e) => e.preventDefault()

    document.addEventListener('touchstart', this._onTouchStart, { passive: false })
    document.addEventListener('touchmove', this._onTouchMove, { passive: false })
    document.addEventListener('gesturestart', this._onGesture, { passive: false })
    document.addEventListener('gesturechange', this._onGesture, { passive: false })
    document.addEventListener('gestureend', this._onGesture, { passive: false })

    // ═══ Bunny iframe postMessage tracer — เก็บ event 30 อันสุดท้ายไว้ debug 'unknown error' ═══
    this._bunnyMsgRing = []
    this._onBunnyMessage = (ev) => {
      try {
        const src = ev.source
        const ifr = this.$refs.videoIframe
        if (!ifr || src !== ifr.contentWindow) return
        const entry = { t: Date.now(), data: typeof ev.data === 'string' ? ev.data.slice(0, 500) : JSON.stringify(ev.data).slice(0, 500) }
        this._bunnyMsgRing.push(entry)
        if (this._bunnyMsgRing.length > 30) this._bunnyMsgRing.shift()
      } catch {}
    }
    window.addEventListener('message', this._onBunnyMessage)

    // ═══ Load Bunny player.js API ═══
    this._loadPlayerJs()

    // ═══ Detect DRM support ═══
    this._detectDrm()
  },
  beforeUnmount() {
    // ⭐ Dispose Aliplayer
    if (this._aliPlayer) {
      try { this._aliPlayer.dispose() } catch {}
      this._aliPlayer = null
    }
    if (this._lineLinkPoll) clearInterval(this._lineLinkPoll)
    document.removeEventListener('fullscreenchange', this._onFsChange)
    if (this._onWmResize) window.removeEventListener('resize', this._onWmResize)
    if (this._onBunnyMessage) window.removeEventListener('message', this._onBunnyMessage)
    if (this.$el) this.$el.style.zoom = ''
    document.removeEventListener('wheel', this._onWheel)
    document.removeEventListener('keydown', this._onKeydown)
    document.removeEventListener('keyup', this._onKeyup)
    document.removeEventListener('visibilitychange', this._onVisChange)
    document.removeEventListener('dragstart', this._onDragStart)
    document.body.style.overflow = this._prevOverflow || ''
    document.documentElement.style.overflow = this._prevHtmlOverflow || ''
    document.body.style.touchAction = this._prevTouchAction || ''
    if (this._onTouchStart) document.removeEventListener('touchstart', this._onTouchStart)
    if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove)
    if (this._onGesture) {
      document.removeEventListener('gesturestart', this._onGesture)
      document.removeEventListener('gesturechange', this._onGesture)
      document.removeEventListener('gestureend', this._onGesture)
    }
    clearInterval(this._devtoolsCheck)
    if (this._zoomCheckInterval) clearInterval(this._zoomCheckInterval)
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval)
    if (this._cleanupDevTools) this._cleanupDevTools()
    if (this._cleanupRecorder) this._cleanupRecorder()
    if (this._retryInterval) clearInterval(this._retryInterval)
    if (this._countdownInterval) clearInterval(this._countdownInterval)
    // Socket.IO disconnect + HTTP fallback cleanup
    if (!this.isDemo) {
      if (this._socketStateInterval) clearInterval(this._socketStateInterval)
      if (this._socket) { this._socket.disconnect(); this._socket = null }
      if (this._onBeforeUnload) window.removeEventListener('beforeunload', this._onBeforeUnload)
      this._beaconClear()
    }
    this._clearIdleTimer()
    this._bunnyPlayer = null
    this.playerReady = false
  },
  watch: {
    video(v) {
      // เมื่อ video data โหลดเสร็จ → emit watch:start (socket) + init player
      if (v && this._socket?.connected) this._emitWatchStart()
      if (v && v.embedUrl) {
        // iframe ได้ src แล้ว → รอ iframe load แล้ว init player
        this._bunnyPlayer = null
        this.playerReady = false
        this._diagLog('embed_url_set', 'embedUrl set → init player', { detail: `drmMode=${v.drmMode||''} title=${(v.title||'').slice(0,80)}` })
        this.$nextTick(() => {
          const iframe = this.$refs.videoIframe
          if (iframe) {
            iframe.addEventListener('load', () => {
              this._diagLog('iframe_loaded', 'iframe load event fired')
              setTimeout(() => this._initPlayer(), 500)
            }, { once: true })
            // fallback ถ้า load event ไม่ fire
            setTimeout(() => { if (!this.playerReady) this._initPlayer() }, 3000)
            // log ถ้าไม่ ready ใน 20 วิ — case ฝนทอง "unknown error"
            setTimeout(() => {
              if (!this.playerReady) {
                this._diagLog('init_failed', 'player not ready within 20s', { detail: `bunnyPlayer=${!!this._bunnyPlayer} hasPlayerjs=${!!window.playerjs}` })
              }
            }, 20000)
          }
        })
      }
    },
    '$route.query.bonus'() {
      this.loadVideo()
      this._scrollToActive()
      this._bunnyPlayer = null
      this.playerReady = false
      this.isPlaying = false
      this._currentTime = 0
      this._videoDuration = 0
    },
    '$route.params.videoIndex'() {
      this.loadVideo()
      this._scrollToActive()
      // Reset player state + เวลา — จะ re-init เมื่อ iframe ใหม่โหลดเสร็จ
      this._bunnyPlayer = null
      this.playerReady = false
      this.isPlaying = false
      this._currentTime = 0
      this._videoDuration = 0
      // Socket.IO: แจ้งเปลี่ยน video
      if (this._socket?.connected) {
        const changeData = {
          sectionId: this.sectionId,
          videoIndex: this.videoIndex,
          sectionName: this.section?.name || '',
          videoTitle: this.video?.title || ''
        }
        this._socket.emit('video:change', changeData)
      }
      this.$nextTick(() => this._initPlayer())
    }
  },
  methods: {
    async openMiniApp(target) {
      const urls = {
        atlas: import.meta.env.VITE_ATLAS_URL || 'https://atlas.medninja.academy',
        synapse: import.meta.env.VITE_SYNAPSE_URL || 'https://synapse.medninja.academy',
        nlex: import.meta.env.VITE_NLEX_URL || 'https://nlex.medninja.academy',
        meqex: import.meta.env.VITE_MEQEX_URL || 'https://meqex.medninja.academy',
        ddx: import.meta.env.VITE_DDX_URL || 'https://ddx.medninja.academy',
        osce: import.meta.env.VITE_OSCE_URL || 'https://osce.medninja.academy',
        skill15: import.meta.env.VITE_SKILL15_URL || 'https://15-skill.medninja.academy',
        longex: import.meta.env.VITE_LONGEX_URL || 'https://longex.medninja.academy'
      }
      const url = urls[target]
      if (!url) return
      try {
        const api = (await import('../services/api')).default
        const data = await api.post('/auth/handoff/code', { target })
        window.location.href = `${url}/auth/handoff?code=${data.code}`
      } catch {
        alert('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่')
      }
    },
    formatNid(id) {
      if (!id) return ''
      const d = id.replace(/\D/g, '')
      if (d.length !== 13) return id
      return `${d[0]}-${d.slice(1,5)}-${d.slice(5,10)}-${d.slice(10,12)}-${d[12]}`
    },
    openInBrowser() {
      const url = window.location.href
      if (detectIOS()) {
        // iOS: ลอง googlechrome scheme ก่อน, fallback copy
        const chromeUrl = url.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://')
        window.location.href = chromeUrl
      } else {
        // Android: intent deep link เปิด Chrome
        const stripped = url.replace(/^https?:\/\//, '')
        window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`
      }
    },
    copyLink() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.linkCopied = true
        setTimeout(() => { this.linkCopied = false }, 2000)
      }).catch(() => {
        // fallback
        const ta = document.createElement('textarea')
        ta.value = window.location.href
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        this.linkCopied = true
        setTimeout(() => { this.linkCopied = false }, 2000)
      })
    },
    _scrollToActive() {
      setTimeout(() => {
        const playlist = this.$el?.querySelector('.w-playlist')
        const active = playlist?.querySelector('.w-playlist-item.active')
        if (playlist && active) {
          const pRect = playlist.getBoundingClientRect()
          const aRect = active.getBoundingClientRect()
          // scroll ให้ตัวที่เล่นอยู่ชิดบนของ playlist (เว้น 8px)
          playlist.scrollBy({ top: aRect.top - pRect.top - 8, behavior: 'smooth' })
        }
      }, 200)
    },
    async _sendHeartbeat() {
      try {
        const ctx = getDeviceContext()
        const isFirst = !this._heartbeatSent
        // ⭐ ดึงสถานะจริงจาก Aliplayer (Warroom = ต้องแม่น 100%)
        let realIsPlaying = this.isPlaying
        let realT = this._currentTime || 0
        let realD = this._videoDuration || 0
        try {
          if (this._aliPlayer) {
            if (typeof this._aliPlayer.getStatus === 'function') {
              const s = this._aliPlayer.getStatus()
              realIsPlaying = s === 'play' || s === 'playing'
            }
            if (typeof this._aliPlayer.getCurrentTime === 'function') {
              realT = this._aliPlayer.getCurrentTime() || realT
            }
            if (typeof this._aliPlayer.getDuration === 'function') {
              realD = this._aliPlayer.getDuration() || realD
            }
          }
        } catch {}
        // Sync local
        this.isPlaying = realIsPlaying
        this._currentTime = realT
        if (realD > 0) this._videoDuration = realD
        const data = await api.post('/my/heartbeat', {
          firstBeat: isFirst || undefined,
          oldTabId: window.name || undefined,
          sectionId: this.sectionId,
          videoIndex: this.videoIndex,
          sectionName: this.section?.name || '',
          videoTitle: this.video?.title || '',
          tabId: this.tabId,
          os: ctx.os,
          browser: ctx.browser,
          currentTime: Math.round(realT),
          videoDuration: Math.round(realD),
          isPlaying: realIsPlaying,
          playerError: this._playerError || '',
          appVersion: _getAppVersion(),
          contentType: this.isBonus ? 'bonus' : 'video',
          // ⭐ Warroom: แหล่ง + bucket + player + variant
          source: 'passport',
          bucket: 'CN',
          player: 'aliplayer',
          // aliVideoIdToPlay = aliDrmVideoId → 'drm' (Widevine), aliVideoId → 'noDrm' (Proprietary encryptType 1)
          variant: this._resolveAliVariant()
        })
        if (data.kicked) {
          // admin เตะ → redirect ออก
          clearInterval(this._heartbeatInterval)
          this.$router.push('/my-cn')
          return
        }
        if (!data.replaced) {
          window.name = this.tabId
          this._heartbeatSent = true
        }
        // บันทึก watch progress ทุก heartbeat (fire-and-forget)
        if (!this.isDemo && this._currentTime > 0) {
          api.post('/my/watch-progress', {
            sectionId: this.sectionId,
            videoIndex: this.videoIndex,
            currentTime: Math.round(this._currentTime || 0),
            isBonus: this.isBonus || false
          }).catch(() => {})
        }
        if (data.replaced) {
          // มี tab อื่นกำลังดูอยู่ → หยุด heartbeat + หยุด video + แสดง overlay
          clearInterval(this._heartbeatInterval)
          this.replaced = true
          this.activeTabInfo = data.activeTab || null
          // หยุด video ทันที
          this._pauseVideo()
          // auto-retry ทุก 3s
          if (!this._retryInterval) {
            this._retryInterval = setInterval(() => this._retryTab(), 3000)
          }
          // countdown 60s → กลับหน้าเรียน + ตัด heartbeat
          if (!this._countdownInterval) {
            this.replacedCountdown = 60
            this._countdownInterval = setInterval(() => {
              this.replacedCountdown--
              if (this.replacedCountdown <= 0) {
                clearInterval(this._countdownInterval)
                clearInterval(this._retryInterval)
                this.$router.push(this.backUrl)
              }
            }, 1000)
          }
          sendLog('replaced', 'ถูกแทนที่โดย tab อื่น', {
            sectionId: this.sectionId,
            videoIndex: this.videoIndex,
            videoTitle: this.video?.title
          })
        }
      } catch { /* ไม่ block ถ้า API error */ }
    },
    async _retryTab() {
      // กดลองใหม่ → ส่ง heartbeat ดูว่า tab อื่นปิดแล้วหรือยัง
      try {
        const ctx = getDeviceContext()
        const data = await api.post('/my/heartbeat', {
          sectionId: this.sectionId,
          videoIndex: this.videoIndex,
          sectionName: this.section?.name || '',
          videoTitle: this.video?.title || '',
          tabId: this.tabId,
          os: ctx.os,
          browser: ctx.browser
        })
        if (!data.replaced) {
          // tab อื่นปิดแล้ว → กลับมาดูได้อัตโนมัติ
          this.replaced = false
          this.activeTabInfo = null
          this.replacedCountdown = 60
          clearInterval(this._retryInterval)
          clearInterval(this._countdownInterval)
          this._retryInterval = null
          this._countdownInterval = null
          this._heartbeatInterval = setInterval(() => this._sendHeartbeat(), 10000)
        } else {
          // ยังเปิดอยู่ → อัปเดตข้อมูล
          this.activeTabInfo = data.activeTab || null
        }
      } catch { /* ignore */ }
    },
    async _loadWmConfig() {
      // ⭐ Hardcode ค่าจริงจาก DB (snapshot 2026-04-09) — ไม่ fetch แล้ว
      this.wmConfig = {
        mobilePortrait:      { style: 'center', fontSize: 19 },
        mobileLandscape:     { style: 'grid',   fontSize: 19 },
        mobilePortraitFull:  { style: 'center', fontSize: 20 },
        mobileLandscapeFull: { style: 'grid',   fontSize: 20 },
        desktopPortrait:      { style: 'grid', fontSize: 27 },
        desktopLandscape:     { style: 'grid', fontSize: 27 },
        desktopPortraitFull:  { style: 'grid', fontSize: 27 },
        desktopLandscapeFull: { style: 'grid', fontSize: 27 },
        desktopBreakpoint: 800,
        centerBaseWidth: 384,
        gridBaseWidth: 1280,
        desktopModeScreenWidth: 1024,
        desktopInMobile: { style: 'grid', fontSize: 60 },
        // Demo modes
        demoMobilePortrait:      { style: 'center', fontSize: 40 },
        demoMobileLandscape:     { style: 'center', fontSize: 60 },
        demoMobilePortraitFull:  { style: 'center', fontSize: 40 },
        demoMobileLandscapeFull: { style: 'center', fontSize: 60 },
        demoDesktopPortrait:      { style: 'grid', fontSize: 37 },
        demoDesktopLandscape:     { style: 'grid', fontSize: 37 },
        demoDesktopPortraitFull:  { style: 'grid', fontSize: 47 },
        demoDesktopLandscapeFull: { style: 'grid', fontSize: 47 },
        demoDesktopBreakpoint: 800,
        demoDesktopInMobile: { style: 'grid', fontSize: 60 }
      }
      this.isDesktopModeInMobile = !this.isMobile && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    },
    async loadVideo() {
      // ── Probe recorder extension ก่อนโหลด video (ไม่ใช้กับ demo) ──
      if (!this.isDemo) {
        const probe = await probeRecorderExtensions()
        if (probe.found) {
          this._onRecorderDetected({ method: probe.method, extension: probe.extension })
          return // ไม่โหลด video
        }
      }
      if (this.isDemo) {
        this.activationStore.fetchDemoSection()
        this.activationStore.fetchDemoVideo(this.videoIndex)
      } else {
        this.activationStore.fetchSection(this.sectionId)
        this.activationStore.fetchVideo(this.sectionId, this.videoIndex, this.isBonus)
      }
    },
    _onRecorderDetected({ method, extension }) {
      if (this.recorderBlocked) return // ดักซ้ำไม่ต้องทำอีก
      this.recorderBlocked = true
      this.recorderName = extension
      // ส่ง log + socket
      if (this._socket?.connected) this._socket.emit('recorder', { method, extension })
      sendLog('recorder', `ตรวจพบ ${extension} (${method})`, {
        sectionId: this.sectionId, videoIndex: this.videoIndex, videoTitle: this.video?.title,
        method, extension
      })
    },
    goVideo(idx, bonus = false) {
      const qs = bonus ? '?bonus=1' : ''
      if (this.isDemo) this.$router.push(`/demo/watch/${idx}${qs}`)
      else if (this.isAdminPreview) this.$router.push(`/admin/preview/section/${this.sectionId}/${idx}${qs}`)
      else this.$router.push(`/my-cn/watch/${this.sectionId}/${idx}${qs}`)
      if (window.innerWidth < 1024) this.sidebarOpen = false
    },
    isWatched(idx) {
      const list = this.watchedMap[this.sectionId] || []
      return list.includes(idx)
    },
    async _detectDrm() {
      if (!navigator.requestMediaKeySystemAccess) { this.drmType = 'none'; return }
      const cfg = [{ initDataTypes: ['cenc'], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }] }]
      const fpCfg = [{ initDataTypes: ['sinf'], videoCapabilities: [{ contentType: 'video/mp4' }] }]
      try { await navigator.requestMediaKeySystemAccess('com.widevine.alpha', cfg); this.drmType = 'widevine'; return } catch {}
      try { await navigator.requestMediaKeySystemAccess('com.apple.fps.1_0', fpCfg); this.drmType = 'fairplay'; return } catch {}
      try { await navigator.requestMediaKeySystemAccess('com.microsoft.playready', cfg); this.drmType = 'playready'; return } catch {}
      this.drmType = 'none'
    },
    _loadPlayerJs() {
      // โหลด playerjs SDK แค่ครั้งเดียว
      if (window.playerjs) { this._initPlayer(); return }
      if (document.querySelector('script[src*="playerjs"]')) {
        // script กำลังโหลดอยู่ — รอจนโหลดเสร็จ
        const wait = setInterval(() => {
          if (window.playerjs) { clearInterval(wait); this._initPlayer() }
        }, 200)
        return
      }
      const s = document.createElement('script')
      s.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js'
      s.onload = () => this._initPlayer()
      document.head.appendChild(s)
    },
    _initPlayer() {
      if (!window.playerjs) return
      const iframe = this.$refs.videoIframe
      if (!iframe) return
      const p = new window.playerjs.Player(iframe)
      p.on('ready', () => {
        this._bunnyPlayer = p
        this.playerReady = true
        this._playerReadyAt = Date.now()
        this.isPlaying = false
        this._playerError = ''
        this._diagLog('player_ready', 'playerjs ready', { detail: `msSinceMount=${this._mountedAt ? Date.now() - this._mountedAt : 0}` })
        // Resume fallback — ถ้า ?t= ไม่ทำงาน ใช้ player.js seek
        if (!this.isDemo && !this._resumeAttempted) {
          this._resumeAttempted = true
          api.get(`/my/watch-progress/${this.sectionId}`).then(res => {
            const prog = (res.progress || []).find(pr => pr.videoIndex === this.videoIndex)
            if (prog && prog.currentTime > 10) {
              const seekTo = Math.max(0, prog.currentTime - 3)
              // รอ player เริ่มเล่นแล้วค่อย seek
              const doSeek = () => {
                try {
                  p.setCurrentTime(seekTo)
                  console.log('[Resume] seek to', seekTo)
                } catch (e) { console.warn('[Resume] seek failed', e) }
              }
              // ลอง seek ทันที + ลองอีกครั้งหลัง 1 วินาที
              doSeek()
              setTimeout(doSeek, 1000)
              setTimeout(doSeek, 3000)
            }
          }).catch(() => {})
        }
        p.on('play', () => {
          this.isPlaying = true
          this._playerError = '' // เล่นได้แล้ว → clear error
          if (this._socket?.connected) this._socket.emit('video:play')
          // เล่นแล้ว → ยกเลิก idle timer
          this._clearIdleTimer()
          this._diagLog('play_event', 'play')
        })
        p.on('pause', () => {
          this.isPlaying = false
          if (this._socket?.connected) this._socket.emit('video:pause')
          // เริ่ม idle timer — pause เกิน 10 นาที → countdown → redirect
          if (!this.isDemo) this._startIdleTimer()
          this._diagLog('pause_event', 'pause', { detail: `t=${Math.round(this._currentTime||0)}` })
        })
        p.on('ended', () => {
          this.isPlaying = false
          if (this._socket?.connected) this._socket.emit('video:ended')
          // auto-mark watched เมื่อเล่นจบ (ถ้ายังไม่ถูก mark)
          if (!this.isDemo && !this.isWatched(this.videoIndex)) {
            this.toggleWatched(this.videoIndex)
          }
        })
        p.on('timeupdate', (val) => {
          const t = val.seconds || val
          // ถ้า currentTime ขยับ > 0.5 วิ แสดงว่า VDO เล่นอยู่จริง → sync isPlaying
          if (this._currentTime && Math.abs(t - this._currentTime) > 0.5 && !this.isPlaying) {
            this.isPlaying = true
          }
          this._currentTime = t
          if (val.duration && val.duration > 0) this._videoDuration = val.duration
          // Fallback: ถ้าเล่นถึง 90% ของวิดีโอ ให้ mark watched (กัน case ที่ 'ended' ไม่ trigger)
          if (
            !this.isDemo &&
            this._videoDuration > 0 &&
            t >= this._videoDuration * 0.9 &&
            !this.isWatched(this.videoIndex)
          ) {
            this.toggleWatched(this.videoIndex)
          }
          // Socket.IO realtime state ทุก 3 วินาที
          const now = Date.now()
          if (!this._lastSocketState || now - this._lastSocketState > 3000) {
            this._lastSocketState = now
            if (this._socket?.connected) {
              const tuData = {
                currentTime: Math.round(this._currentTime || 0),
                duration: Math.round(this._videoDuration || 0),
                isPlaying: this.isPlaying,
                appVersion: _getAppVersion()
              }
              this._socket.emit('video:state', tuData)
            }
          }
        })
        p.on('error', (e) => {
          // ── จับ error ให้ละเอียดทุก byte (กัน 'unknown error' โผล่อีก) ──
          const rawCapture = this._captureRawError(e)
          this._playerError = rawCapture.summary
          this._errorCount = (this._errorCount || 0) + 1
          const errLower = this._playerError.toLowerCase()
          // code=5 (AbortError) — ใช้ field ตรง ไม่พึ่ง string match
          const isCode5 = rawCapture.code === 5 || rawCapture.code === '5' || errLower.includes('abort')
          const isAutoplayError = isCode5 || errLower.includes('autoplay') || errLower.includes('play()') || errLower.includes('interact') || errLower.includes('not allowed') || errLower.includes('"code":5') || errLower.includes('code": 5') || errLower.includes('interrupted') || errLower.includes('denied permission')
          // null/empty error event → Bunny player ยิง error โดยไม่มี payload (false-positive) → swallow + verify
          const isNullError = e == null || errLower.includes('null error event') || errLower.includes('empty error object')
          // macOS Safari HLS native มัก abort เองตอน network glitch / memory pressure / tab background นาน
          // → silent recovery: seek กลับ -2s แล้ว play ใหม่ (ไม่รบกวนนักเรียน)
          const isMacSafari = detectMacSafari()
          // ── Log ทุก error เข้า DB เพื่อ debug ย้อนหลัง (รวม autoplay/swallow ด้วย — หา "unknown error" คนเดียว) ──
          this._diagLog('error', `playerjs error: ${rawCapture.summary.slice(0,150)}`, {
            detail: `summary="${rawCapture.summary}" code=${rawCapture.code} name=${rawCapture.name} type=${rawCapture.type} keys=[${(rawCapture.keys||[]).join(',')}] swallow=${isAutoplayError||isNullError} macSafari=${isMacSafari} json=${(rawCapture.rawJson||'').slice(0,300)} lastMsg=${JSON.stringify((rawCapture.msgRing||[]).slice(-3)).slice(0,300)} ctx=${JSON.stringify(rawCapture.ctxExtra||{}).slice(0,200)}`
          })
          // code 5 / autoplay error / null event → swallow ก่อน, recovery, แล้วค่อยเช็ค
          if (isAutoplayError || isNullError) {
            this._playerError = ''
            const snapTime = this._currentTime || 0
            // macOS Safari + code=5 → silent seek-back recovery (ก่อนรอ 5 วิ)
            if (isMacSafari && isCode5 && snapTime > 2) {
              try {
                p.setCurrentTime(Math.max(0, snapTime - 2))
                setTimeout(() => { try { this._safePlay() } catch {} }, 300)
                this._diagLog('safari_recover', `auto seek -2s + replay (t=${snapTime.toFixed(1)})`)
              } catch {}
            }
            setTimeout(() => {
              const nowTime = this._currentTime || 0
              if (nowTime > snapTime + 0.5) return // ดูได้จริง → ไม่ทำอะไร
              // null event + currentTime ไม่ขยับ → ยังไม่ส่ง error, ลอง play เงียบๆ ก่อน
              this._safePlay()
              setTimeout(() => {
                const afterRetry = this._currentTime || 0
                if (afterRetry > nowTime + 0.5) return // retry สำเร็จ
                // ยังไม่ได้จริง → dedupe + ส่ง error
                if (this._shouldThrottleErrorReport(rawCapture)) {
                  this._diagLog('error_throttled', `silent — same error within 1h`, { detail: `code=${rawCapture.code}` })
                  return
                }
                const errMsg = isCode5 ? `video aborted (code=5) — recovery failed (Safari=${isMacSafari})` : (isNullError ? 'video stuck after null error event' : 'video not playing after autoplay error')
                if (this._socket?.connected) this._socket.emit('video:error', { error: errMsg })
                this._reportVideoError(errMsg, rawCapture)
                this._diagLog('error_persist', `${isCode5?'code5':isNullError?'null':'autoplay'} swallow failed — still stuck`, { detail: errMsg })
              }, 3000)
            }, 5000)
            return
          }
          // hard error — เช็ค throttle ก่อนส่ง LINE
          if (this._shouldThrottleErrorReport(rawCapture)) {
            this._diagLog('error_throttled', `silent — same error within 1h`, { detail: `code=${rawCapture.code} msg=${rawCapture.summary.slice(0,80)}` })
            return
          }
          if (this._socket?.connected) this._socket.emit('video:error', { error: this._playerError })
          this._reportVideoError(this._playerError, rawCapture)
        })
        // ดึง duration — retry หลายรอบเพราะ HLS อาจยังไม่มี metadata
        const tryDuration = () => {
          try { p.getDuration((d) => { if (d > 0) this._videoDuration = d }) } catch {}
        }
        tryDuration()
        setTimeout(tryDuration, 2000)
        setTimeout(tryDuration, 5000)
        setTimeout(tryDuration, 10000)
      })
    },
    togglePlay() {
      const p = this._bunnyPlayer
      if (!p) return
      if (this._playPending) return // play() ยัง pending อยู่ ป้องกัน race condition
      if (this.isPlaying) {
        p.pause()
      } else {
        this._safePlay()
      }
    },
    _safePlay() {
      const p = this._bunnyPlayer
      if (!p || this._playPending) return
      this._playPending = true
      this._pauseAfterPlay = false
      // Safety: ถ้า promise ไม่ resolve/reject ใน 5 วิ → force clear
      if (this._playPendingTimer) clearTimeout(this._playPendingTimer)
      this._playPendingTimer = setTimeout(() => { this._playPending = false; this._pauseAfterPlay = false }, 5000)
      try {
        const r = p.play()
        if (r && typeof r.then === 'function') {
          r.then(() => {
            this._playPending = false
            clearTimeout(this._playPendingTimer)
            if (this._pauseAfterPlay) { this._pauseAfterPlay = false; try { p.pause() } catch {} }
          }).catch(() => {
            this._playPending = false
            this._pauseAfterPlay = false
            clearTimeout(this._playPendingTimer)
          })
        } else {
          this._playPending = false
          clearTimeout(this._playPendingTimer)
        }
      } catch { this._playPending = false; clearTimeout(this._playPendingTimer) }
    },
    _pauseVideo() {
      const p = this._bunnyPlayer
      if (!p) return
      // ถ้า play() ยัง pending → รอ resolve ก่อนแล้วค่อย pause (ป้องกัน code 5)
      if (this._playPending) {
        this._pauseAfterPlay = true
        return
      }
      try { p.pause() } catch {}
    },
    _captureRawError(e) {
      // เก็บ error ทุก byte — แก้ปัญหา 'unknown error' ที่ไม่รู้สาเหตุ
      let summary = 'unknown error'
      let type = typeof e
      let keys = []
      let rawJson = ''
      let code = null, name = null, stack = ''
      try {
        if (e == null) {
          summary = `null error event (type=${type})`
        } else if (typeof e === 'string') {
          summary = e
        } else if (typeof e === 'object') {
          keys = Object.keys(e)
          code = e.code ?? e.errorCode ?? null
          name = e.name ?? e.type ?? null
          stack = e.stack || ''
          try { rawJson = JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 800) } catch { rawJson = String(e).slice(0, 800) }
          summary = e.message || e.error || (code != null ? `code=${code}` : '') || (keys.length ? `obj{${keys.join(',')}}` : 'empty error object')
        } else {
          summary = String(e)
        }
      } catch (capErr) {
        summary = `capture failed: ${capErr.message}`
      }
      return {
        summary,
        type,
        keys,
        code,
        name,
        stack: stack.slice(0, 500),
        rawJson,
        msgRing: (this._bunnyMsgRing || []).slice(-10),
        ctxExtra: {
          visibility: typeof document !== 'undefined' ? document.visibilityState : '?',
          msSinceMount: this._mountedAt ? Date.now() - this._mountedAt : 0,
          msSincePlayerReady: this._playerReadyAt ? Date.now() - this._playerReadyAt : 0,
          currentTime: this._currentTime || 0,
          duration: this._videoDuration || 0,
          netType: navigator.connection?.effectiveType || '?',
          downlink: navigator.connection?.downlink || 0,
          rtt: navigator.connection?.rtt || 0,
          online: navigator.onLine,
          memory: navigator.deviceMemory || '?'
        }
      }
    },
    _diagLog(event, message, extra = {}) {
      // timeline log — ส่งเข้า ClientLog (type=live_event) เพื่อให้ admin debug ย้อนหลังได้
      // (ใช้ type 'live_event' เพราะ schema มี field timeline ครบ — currentTime, isPlaying, ฯลฯ)
      try {
        const ver = (_getAppVersion() || '').slice(-8)
        sendLog('live_event', `[v${ver}] ${message || event}`, {
          event,
          sectionId: this.sectionId,
          videoIndex: this.videoIndex,
          videoTitle: `[v${ver}] ${this.video?.title || ''}`,
          currentTime: Math.round(this._currentTime || 0),
          bufferedEnd: 0,
          isPlaying: this.isPlaying,
          liveReady: this.playerReady,
          needUnmute: false,
          wsConnected: !!(this._socket && this._socket.connected),
          errorCount: this._errorCount || 0,
          tabId: this.tabId || '',
          ...extra
        })
      } catch { /* ห้าม log error ทำ watch พัง */ }
    },
    _shouldThrottleErrorReport(rawCapture) {
      // dedupe error ซ้ำๆ — same user + same error code → ส่ง LINE 1 ครั้ง/ชั่วโมง
      // (กัน F5 รัวๆ แล้วยิง LINE ซ้ำๆ เช่นเคส macOS Safari code=5)
      try {
        const key = `medninja_err_throttle_${this.sectionId || 'x'}_${this.videoIndex || 0}_${rawCapture?.code ?? 'n'}`
        const last = parseInt(localStorage.getItem(key) || '0', 10)
        const now = Date.now()
        if (last && now - last < 3600000) return true
        localStorage.setItem(key, String(now))
      } catch {}
      return false
    },
    _reportVideoError(errorMsg, rawCapture) {
      if (this._errorReported) return // ส่งแค่ครั้งเดียวต่อ session
      this._errorReported = true
      const ctx = getDeviceContext()
      fetch('/api/diag/video-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMsg,
          videoTitle: this.video?.title || '',
          sectionName: this.section?.name || '',
          videoIndex: this.videoIndex,
          userName: this.authStore?.user?.firstName ? `${this.authStore.user.firstName} ${this.authStore.user.lastName || ''}`.trim() : this.authStore?.user?.name || '',
          userEmail: this.authStore?.user?.email || '',
          raw: rawCapture || null,
          ...ctx
        })
      }).catch(() => {})
    },
    _reclaimTab() {
      // ยึดคืน — reconnect socket + emit watch:start → tab นี้ชนะ
      this.replaced = false
      if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null }
      this.activeTabInfo = null
      // reconnect socket
      this._initSocket()
      // restart state interval
      if (!this._socketStateInterval) {
        this._socketStateInterval = setInterval(() => {
          if (!this._socket?.connected) return
          const rd = {
            currentTime: Math.round(this._currentTime || 0),
            duration: Math.round(this._videoDuration || 0),
            isPlaying: this.isPlaying,
            drmMode: this.video?.drmMode || ''
          }
          this._socket.emit('video:state', rd)
        }, 3000)
      }
    },
    _emitWatchStart() {
      if (!this._socket?.connected) return
      // ⭐ ถ้ายังไม่มี title → skip (รอ video ready ค่อย emit) — กัน Warroom ค้าง title=''
      if (!this.video?.title) return
      const ctx = getDeviceContext()
      const data = {
        sectionId: this.sectionId,
        videoIndex: this.videoIndex,
        sectionName: this.section?.name || '',
        videoTitle: this.video?.title || '',
        tabId: this.tabId,
        os: ctx.os,
        browser: ctx.browser,
        timezone: ctx.timezone,
        tzOffset: ctx.tzOffset,
        currentTime: Math.round(this._currentTime || 0),
        duration: Math.round(this._videoDuration || 0),
        isPlaying: this.isPlaying,
        appVersion: _getAppVersion(),
        drmMode: this.video?.drmMode || 'protection',
        // ⭐ Warroom: source + bucket + player + variant
        source: 'passport',
        bucket: 'CN',
        player: 'aliplayer',
        variant: this._resolveAliVariant()
      }
      this._socket.emit('watch:start', data)
    },
    _initSocket() {
      const token = localStorage.getItem('token')
      if (!token) return

      this._socket = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'] })

      // เมื่อ connect → ส่ง watch:start (ถ้า video โหลดแล้ว)
      this._socket.on('connect', () => {
        this._emitWatchStart()
        this._diagLog('ws_connect', 'socket connected', { detail: `id=${this._socket.id}` })
      })
      this._socket.on('disconnect', (reason) => {
        this._diagLog('ws_disconnect', 'socket disconnected', { detail: `reason=${reason}` })
      })
      this._socket.on('connect_error', (err) => {
        this._diagLog('ws_error', 'socket connect_error', { detail: err?.message || String(err) })
      })

      // ⭐ Periodic state emit — ดึง state จริงจาก Aliplayer (Warroom ต้องแม่น 100%)
      this._socketStateInterval = setInterval(() => {
        if (!this._socket?.connected) return
        // ดึงสถานะจริงจาก Aliplayer (getStatus, getCurrentTime, getDuration)
        let realIsPlaying = false
        let realT = this._currentTime || 0
        let realD = this._videoDuration || 0
        try {
          if (this._aliPlayer && typeof this._aliPlayer.getStatus === 'function') {
            const status = this._aliPlayer.getStatus() // 'play' | 'pause' | 'ended' | 'ready' | ...
            realIsPlaying = status === 'play' || status === 'playing'
          } else {
            realIsPlaying = this.isPlaying
          }
          if (this._aliPlayer && typeof this._aliPlayer.getCurrentTime === 'function') {
            realT = this._aliPlayer.getCurrentTime() || 0
          }
          if (this._aliPlayer && typeof this._aliPlayer.getDuration === 'function') {
            realD = this._aliPlayer.getDuration() || 0
          }
        } catch { realIsPlaying = this.isPlaying }
        // Sync local state ให้ตรงจริง (เผื่อ event หลุด)
        this.isPlaying = realIsPlaying
        this._currentTime = realT
        if (realD > 0) this._videoDuration = realD
        this._socket.emit('video:state', {
          currentTime: Math.round(realT),
          duration: Math.round(realD),
          isPlaying: realIsPlaying,
          drmMode: this.video?.drmMode || '',
          appVersion: _getAppVersion(),
          source: 'passport',
          bucket: 'CN',
          player: 'aliplayer',
          variant: this._resolveAliVariant()
        })
      }, 3000)

      // Anti-share: ถูกแทนที่โดยจอใหม่
      this._socket.on('replaced', (activeTab) => {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval)
        if (this._socketStateInterval) { clearInterval(this._socketStateInterval); this._socketStateInterval = null }
        // disconnect socket — tab นี้ไม่ส่งอะไรอีก
        if (this._socket) { this._socket.disconnect(); this._socket = null }
        this.replaced = true
        this.activeTabInfo = activeTab || null
        this._pauseVideo()
        // countdown 60s → กลับหน้าเรียน
        if (!this._countdownInterval) {
          this.replacedCountdown = 60
          this._countdownInterval = setInterval(() => {
            this.replacedCountdown--
            if (this.replacedCountdown <= 0) {
              clearInterval(this._countdownInterval)
              this.$router.push(this.backUrl)
            }
          }, 1000)
        }
        sendLog('replaced', 'ถูกแทนที่โดย tab อื่น (socket)', {
          sectionId: this.sectionId, videoIndex: this.videoIndex, videoTitle: this.video?.title
        })
      })

      // ถ้าจอเก่าปิด → กลับมาดูต่อ
      this._socket.on('unblocked', () => {
        this.replaced = false
        if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null }
        this._heartbeatInterval = setInterval(() => {
          if (!this._socket?.connected) this._sendHeartbeat()
        }, 10000)
      })

      // Admin kick → ออกทันที
      this._socket.on('kicked', () => {
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval)
        this.$router.push('/my-cn')
      })
    },
    _beaconClear() {
      const token = localStorage.getItem('token')
      if (!token) return
      const base = (api.defaults?.baseURL || '/api').replace(/\/api$/, '')
      const url = base + '/api/beacon/heartbeat-clear'
      try { navigator.sendBeacon(url, new Blob([JSON.stringify({ token })], { type: 'application/json' })) } catch {}
    },
    toggleFullscreen() {
      const box = this.$el.querySelector('.w-player-box')
      if (!box) return
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        box.requestFullscreen().catch(() => {})
        // Fullscreen element ต้อง block scroll/zoom เอง (document level จับไม่ได้)
        if (!box._fsProtected) {
          box._fsProtected = true
          box.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
          box.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault()
          })
        }
      }
    },
    _startIdleTimer() {
      this._clearIdleTimer()
      // 10 นาที pause → เริ่ม countdown
      this._idleTimeout = setTimeout(() => {
        this.showIdleWarning = true
        this.idleCountdown = 60
        this._idleCountdownInterval = setInterval(() => {
          this.idleCountdown--
          if (this.idleCountdown <= 0) {
            this._clearIdleTimer()
            this.$router.push(this.backUrl)
          }
        }, 1000)
      }, 10 * 60 * 1000)
    },
    _resumePlay() {
      this._safePlay()
    },
    _clearIdleTimer() {
      this.showIdleWarning = false
      this.idleCountdown = 0
      if (this._idleTimeout) { clearTimeout(this._idleTimeout); this._idleTimeout = null }
      if (this._idleCountdownInterval) { clearInterval(this._idleCountdownInterval); this._idleCountdownInterval = null }
    },
    toggleWatched(idx) {
      const key = this.sectionId
      if (!this.watchedMap[key]) this.watchedMap[key] = []
      const i = this.watchedMap[key].indexOf(idx)
      if (i >= 0) {
        this.watchedMap[key].splice(i, 1)
      } else {
        this.watchedMap[key].push(idx)
      }
      saveWatchedMap(this.watchedMap)
      // บันทึกไป server ด้วย (fire-and-forget)
      if (!this.isDemo) {
        api.post('/my/watch-progress', {
          sectionId: this.sectionId,
          videoIndex: idx,
          watched: this.watchedMap[key].includes(idx)
        }).catch(() => {})
      }
    },
    // ══════════════════════════════════════
    // Auto-diag เบื้องหลัง (silent — ส่ง LINE เฉพาะเมื่อพบปัญหา)
    // ══════════════════════════════════════
    async _runAutoDiag() {
      try {
        // ── Skip ถ้า browser ไม่ผ่าน (fetchVideo ส่ง flex 'OS Guard' ไปแล้ว — ไม่ต้องส่งซ้ำ) ──
        if (!this.browserOk) return
        // ── Skip ถ้า video โหลดไม่สำเร็จ (มี error/loading) — ป้องกัน "ระบบปกติ" หลอกตา ──
        if (this.activationStore?.error || this.activationStore?.loading || !this.video) return

        const { getOS } = await import('../utils/deviceDetect')
        const u = this.authStore.user
        const userName = u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u?.name || ''
        const ua = navigator.userAgent
        const _dOS = () => getOS(ua)
        const _dBR = (u) => /Edg\//.test(u)?'Edge':/Chrome\//.test(u)&&!/Edg\//.test(u)?'Chrome':/Safari\//.test(u)&&!/Chrome\//.test(u)?'Safari':/Firefox\//.test(u)?'Firefox':'Other'

        // เรียก doctor endpoint (ละเอียดทุก byte)
        let doctorData = null, resultId = ''
        try {
          doctorData = await api.post('/diag/doctor')
          resultId = doctorData?.resultId || ''
        } catch { /* silent */ }

        // Client-side checks (เช็ค ad blocker ก่อน — ถ้ามี ad blocker ไม่นับ CDN fail)
        let adBlock = false
        try { await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { mode: 'no-cors' }) } catch { adBlock = true }
        let clientCdn = false, clientEmbed = false
        try { await fetch('https://player.mediadelivery.net/playerjs/playerjs-latest.min.js', { mode: 'no-cors', cache: 'no-store' }); clientCdn = true } catch {}
        const realUrl = this.video?.embedUrl
        if (realUrl) { try { await fetch(realUrl, { mode: 'no-cors', cache: 'no-store' }); clientEmbed = true } catch {} }
        const rp = document.referrerPolicy || 'default'
        const cn = navigator.connection

        // สร้าง plain text ละเอียดเท่า doctor
        let plainText = `=== WatchPage Auto-Diag ===\n`
        plainText += `User: ${userName} (${u?.email})\n`
        plainText += `Device: ${_dOS(ua)} · ${_dBR(ua)} · ${screen.width}x${screen.height}\n`
        plainText += `UA: ${ua}\n`
        plainText += `Video: ${this.video?.title || '?'}\n`
        plainText += `Section: ${this.section?.code || ''} ${this.section?.name || '?'}\n`
        plainText += `URL: ${window.location.pathname}\n`
        plainText += `embedUrl: ${realUrl?.replace(/token=[^&]+/, 'token=***') || 'none'}\n`
        plainText += `playerReady: ${this.playerReady} | isPlaying: ${this.isPlaying} | playerError: ${this._playerError || 'none'}\n`
        plainText += `Referrer-Policy: ${rp}\n`
        plainText += `Network: ${cn?.effectiveType || '?'} · ${cn?.downlink || '?'} Mbps\n`
        plainText += `AdBlock: ${adBlock ? 'YES' : 'NO'}\n`
        plainText += `Client CDN: ${clientCdn ? 'OK' : adBlock ? 'BLOCKED (ad blocker)' : 'BLOCKED'} | Client Embed: ${clientEmbed ? 'OK' : adBlock ? 'BLOCKED (ad blocker)' : 'BLOCKED'}\n\n`

        // Doctor journey (server-side ละเอียดทุก byte)
        if (doctorData?.journey) {
          plainText += `--- Doctor Journey (${doctorData.totalMs}ms) ---\n`
          for (const j of doctorData.journey) {
            plainText += `[${j.ok ? 'PASS' : 'FAIL'}] [${j.id}] ${j.phase} — ${j.title}: ${j.detail}\n`
            if (j.raw) plainText += `  RAW: ${JSON.stringify(j.raw)}\n`
          }
        }

        // นับ fail (ถ้ามี ad blocker → ไม่นับ CDN fail เพราะ ad blocker block fetch แต่ iframe ยังเล่นได้)
        const serverFails = (doctorData?.journey || []).filter(j => j.ok === false).length
        const clientFails = adBlock ? 0 : ((!clientCdn ? 1 : 0) + (!clientEmbed ? 1 : 0))
        const failCount = serverFails + clientFails

        // ส่ง LINE Flex + doctor-result link (ละเอียดเท่า doctor)
        const _autoTok = localStorage.getItem('token')
        fetch('/api/diag/doctor-line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(_autoTok ? { 'Authorization': `Bearer ${_autoTok}` } : {}) },
          body: JSON.stringify({
            plainText, userName, userEmail: u?.email, failCount, resultId,
            videoTitle: this.video?.title || '',
            sectionName: this.section?.name || '',
            sectionCode: this.section?.code || '',
            page: 'WatchCnPage (auto)',
            url: window.location.pathname,
            clientReferer: document.referrer || window.location.href,
            clientHost: window.location.host,
            clientOS: _dOS(ua),
            clientBrowser: _dBR(ua),
            // ⭐ CN watch = Ali ทุกครั้ง (ไม่งั้น Flex บอก BUNNY ผิด)
            player: 'ali',
            country: 'CN',
            bucket: 'ali-sg'
          })
        }).catch(() => {})
      } catch { /* silent */ }
    },
    // ══════════════════════════════════════
    // Modal Diagnostic (interactive — แสดงให้นักเรียนเห็น)
    // ══════════════════════════════════════
    openDiagModal() {
      this.showDiagModal = true
      this._runModalDiag()
    },
    // ⭐ CN: แจ้งนักเรียนจีนว่าให้ส่งคำถามทาง WeChat
    _alertWeChat() {
      alert('🇨🇳 สำหรับผู้ใช้ในประเทศจีน\n\nกรุณาส่งคำถามทาง WeChat\n\nWeChat ID: MedNinja_TH\n(หรือแสกน QR ที่หน้า /my-cn)')
    },
    closeDiagModal() {
      this.showDiagModal = false
    },
    async hardReset() {
      // ล้าง cache + reload
      if ('caches' in window) {
        const keys = await caches.keys()
        for (const k of keys) await caches.delete(k)
      }
      // ล้าง session/local storage ที่เกี่ยวกับ version
      sessionStorage.removeItem('version_reloaded')
      // Force reload ไม่ใช้ cache
      window.location.reload(true)
    },
    async _runModalDiag() {
      this.diagDone = false
      this.diagRunning = true
      this.diagPassCount = 0
      this.diagSteps = []

      let pass = 0, stepN = 0
      const _w = (ms) => new Promise(r => setTimeout(r, ms))
      const addStep = (title) => { stepN++; this.diagSteps.push({ n: stepN, title, detail: 'รอ...', status: 'wait' }); return stepN }

      const u = this.authStore.user
      const userName = u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u?.name || ''
      const ua = navigator.userAgent
      const _dOS = (uaStr) => detectOS(uaStr)
      const _dBR = (uaStr) => detectBrowser(uaStr)

      // ═══ 1) อุปกรณ์ ═══
      let s = addStep('อุปกรณ์')
      this._diagSet(s, 'run', '')
      await _w(500)
      this._diagSet(s, 'ok', `${_dBR(ua)} · ${_dOS(ua)} · ${screen.width}x${screen.height}`)
      pass++

      // ═══ 2) Cookies ═══
      s = addStep('Cookies')
      this._diagSet(s, 'run', '')
      await _w(300)
      if (navigator.cookieEnabled) { this._diagSet(s, 'ok', 'เปิดอยู่'); pass++ }
      else { this._diagSet(s, 'no', 'ปิดอยู่') }

      // ═══ 3) เซิร์ฟเวอร์ ═══
      s = addStep('เซิร์ฟเวอร์')
      this._diagSet(s, 'run', '')
      await _w(300)
      try {
        const t = performance.now()
        const resp = await fetch('/api/health')
        this._diagSet(s, resp.ok ? 'ok' : 'no', resp.ok ? `ปกติ (${Math.round(performance.now()-t)}ms)` : 'ตอบกลับผิดปกติ')
        if (resp.ok) pass++
      } catch { this._diagSet(s, 'no', 'เชื่อมต่อไม่ได้') }

      // ═══ 4) ตรวจระบบวีดีโอ (ใช้ video จริงจากหน้านี้) ═══
      s = addStep('ตรวจระบบวีดีโอ')
      this._diagSet(s, 'run', 'กำลังตรวจละเอียด...')
      await _w(500)
      let doctorData = null, resultId = ''
      try {
        doctorData = await api.post('/diag/doctor')
        resultId = doctorData?.resultId || ''
        const fails = (doctorData?.journey || []).filter(j => j.ok === false)
        if (fails.length === 0) {
          this._diagSet(s, 'ok', `ผ่านทุกขั้นตอน (${doctorData?.totalMs || '?'}ms)`)
          pass++
        } else {
          this._diagSet(s, 'no', `พบปัญหา ${fails.length} จุด`)
        }
      } catch (e) {
        this._diagSet(s, 'no', 'ตรวจไม่ได้: ' + (e.response?.data?.message || e.message))
      }

      // ═══ 5) Server → CDN ═══
      s = addStep('Server → ระบบวีดีโอ')
      this._diagSet(s, 'run', '')
      await _w(300)
      const cdn61 = doctorData?.journey?.find(j => j.id === '6.1')
      if (cdn61) {
        const status = cdn61.raw?.response?.status || 0
        if (status === 200) { this._diagSet(s, 'ok', `ปกติ (${cdn61.raw?.response?.ms || '?'}ms)`); pass++ }
        else { this._diagSet(s, 'no', `ผิดปกติ — HTTP ${status}`) }
      } else {
        this._diagSet(s, 'info', 'ข้าม')
      }

      // เช็ค ad blocker ก่อน
      let modalAdBlock = false
      try { await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { mode: 'no-cors' }) } catch { modalAdBlock = true }

      // ═══ 6) Browser → CDN ═══
      s = addStep('Browser → ระบบวีดีโอ')
      this._diagSet(s, 'run', '')
      await _w(300)
      try {
        await fetch('https://player.mediadelivery.net/playerjs/playerjs-latest.min.js', { mode: 'no-cors', cache: 'no-store' })
        this._diagSet(s, 'ok', 'เชื่อมต่อได้'); pass++
      } catch {
        if (modalAdBlock) { this._diagSet(s, 'info', 'ปกติ (มี Ad Blocker)'); pass++ }
        else { this._diagSet(s, 'no', 'เชื่อมต่อไม่ได้ — ลองปิด Extension หรือเปลี่ยน WiFi') }
      }

      // ═══ 7) Browser → วีดีโอจริง (embed URL จากหน้านี้) ═══
      s = addStep('Browser → วีดีโอจริง')
      this._diagSet(s, 'run', '')
      await _w(300)
      const realEmbedUrl = this.video?.embedUrl
      if (realEmbedUrl) {
        try {
          await fetch(realEmbedUrl, { mode: 'no-cors', cache: 'no-store' })
          this._diagSet(s, 'ok', 'เชื่อมต่อได้'); pass++
        } catch {
          if (modalAdBlock) { this._diagSet(s, 'info', 'ปกติ (มี Ad Blocker)'); pass++ }
          else { this._diagSet(s, 'no', 'เชื่อมต่อไม่ได้ — อาจเป็น Extension/Firewall/DNS block') }
        }
      } else {
        this._diagSet(s, 'no', 'ไม่มี URL วีดีโอ')
      }

      // ═══ 8) Referrer-Policy ═══
      s = addStep('Referrer-Policy')
      this._diagSet(s, 'run', '')
      await _w(300)
      const rp = document.referrerPolicy || 'default'
      if (['no-referrer', 'same-origin'].includes(rp)) {
        this._diagSet(s, 'no', `${rp} — อาจทำให้วีดีโอไม่เล่น`)
      } else {
        this._diagSet(s, 'ok', rp || 'ปกติ'); pass++
      }

      // ═══ 9) เครือข่าย ═══
      s = addStep('เครือข่าย')
      this._diagSet(s, 'run', '')
      await _w(300)
      const cn = navigator.connection
      this._diagSet(s, 'ok', `${cn?.effectiveType || '?'} · ${cn?.downlink || '?'} Mbps`)
      pass++

      // ═══ 10) Player ═══
      s = addStep('Player สถานะปัจจุบัน')
      this._diagSet(s, 'run', '')
      await _w(300)
      if (this.playerReady || this._bunnyPlayer) {
        this._diagSet(s, 'ok', 'Player พร้อม' + (this._playerError ? ` (error: ${this._playerError})` : ''))
        pass++
      } else if (this.replaced) {
        this._diagSet(s, 'info', 'ถูกแทนที่โดย tab อื่น')
        pass++
      } else if (this.video?.embedUrl && !this.replaced) {
        // มี embedUrl แต่ player ยังไม่ ready → อาจกำลัง init อยู่
        this._diagSet(s, 'info', 'Player กำลังโหลด')
        pass++
      } else {
        this._diagSet(s, 'no', 'ไม่มีวีดีโอ')
      }

      // ═══ ส่ง LINE Flex (แอบ — นักเรียนไม่เห็น) ═══
      const failCount = stepN - pass
      // สร้าง plain text สำหรับ doctor-result
      let plainText = `=== WatchPage Diag ===\nUser: ${userName} (${u?.email})\n`
      plainText += `Device: ${_dOS(ua)} · ${_dBR(ua)}\nUA: ${ua}\n`
      plainText += `Video: ${this.video?.title || '?'} | Section: ${this.section?.name || '?'}\n`
      plainText += `embedUrl: ${realEmbedUrl?.replace(/token=[^&]+/, 'token=***') || 'none'}\n`
      plainText += `playerReady: ${this.playerReady} | playerError: ${this._playerError || 'none'}\n`
      plainText += `Result: ${failCount === 0 ? 'ALL PASS' : `FAIL ${failCount}`}\n\n`
      for (const st of this.diagSteps) {
        plainText += `[${st.status === 'ok' ? 'PASS' : st.status === 'no' ? 'FAIL' : 'INFO'}] ${st.title}: ${st.detail}\n`
      }
      if (doctorData?.journey) {
        plainText += `\n--- Doctor Journey (server-side) ---\n`
        for (const j of doctorData.journey) {
          plainText += `[${j.ok ? 'PASS' : 'FAIL'}] [${j.id}] ${j.title}: ${j.detail}\n`
          if (j.raw) plainText += `  RAW: ${JSON.stringify(j.raw)}\n`
        }
      }
      const _modalTok = localStorage.getItem('token')
      fetch('/api/diag/doctor-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(_modalTok ? { 'Authorization': `Bearer ${_modalTok}` } : {}) },
        body: JSON.stringify({
          plainText, userName, userEmail: u?.email, failCount, resultId,
          videoTitle: this.video?.title || '',
          sectionName: this.section?.name || '',
          sectionCode: this.section?.code || '',
          page: 'WatchCnPage',
          url: window.location.pathname,
          clientReferer: document.referrer || window.location.href,
          clientHost: window.location.host,
          clientOS: detectOS(),
          clientBrowser: detectBrowser(),
          // ⭐ CN watch = Ali ทุกครั้ง
          player: 'ali',
          country: 'CN',
          bucket: 'ali-sg'
        })
      }).catch(() => {})

      this.diagTotalSteps = stepN
      this.diagPassCount = pass
      this.diagDone = true
      this.diagRunning = false
    },
    async sendAskQuestion() {
      if (!this.askQuestion.trim() || this.askSending) return
      this.askSending = true
      try {
        const u = this.authStore.user
        const userName = u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u?.name || ''
        await fetch('/api/diag/ask-doctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: this.askQuestion.trim(),
            userName,
            userEmail: u?.email || '',
            lineUserId: u?.lineUserId || '',
            videoTitle: this.video?.title || '',
            sectionName: this.section?.name || '',
            sectionCode: this.section?.code || '',
            videoIndex: this.videoIndex
          })
        })
        this.askSent = true
      } catch { /* ignore */ }
      this.askSending = false
    },
    _diagSet(n, st, d) {
      const s = this.diagSteps[n - 1]
      if (s) { s.status = st; if (d !== undefined) s.detail = d }
    },

    // ═══════════════════════════════════════════════════════════
    // ⭐ Aliplayer methods (CN mirror)
    // ═══════════════════════════════════════════════════════════
    async _loadAliplayerSDK () {
      if (window.Aliplayer && typeof window.Aliplayer === 'function') return true
      return new Promise((resolve, reject) => {
        // Try aliplayer.js (self-hosted vendor)
        const s = document.createElement('script')
        s.src = '/vendor/aliplayer/aliplayer.js'
        s.async = true
        s.onload = () => {
          setTimeout(() => {
            resolve(typeof window.Aliplayer === 'function')
          }, 200)
        }
        s.onerror = () => reject(new Error('Failed to load Aliplayer SDK'))
        document.head.appendChild(s)
      })
    },
    async _fetchAliStsToken () {
      try {
        // ⭐ Backend route: /api/china/sts/:videoId (บังคับต้องมี videoId)
        const vid = this.aliVideoIdToPlay
        if (!vid) throw new Error('No Ali videoId')
        const res = await api.get(`/china/sts/${vid}`)
        // api.js interceptor unwraps → res = data
        const d = (res && res.data) ? res.data : (res || {})
        if (!d.accessKeyId) throw new Error('STS response missing accessKeyId')
        return d
      } catch (e) {
        console.error('[Ali] STS fetch error:', e.message)
        throw e
      }
    },
    async _initAliPlayer () {
      if (!this.hasAliVideo) {
        console.log('[Ali] No aliVideoId — skip player init')
        return
      }
      // ⭐ กัน double-init — ถ้ากำลัง init อยู่ให้ skip (STS race → Widevine 4022)
      if (this._aliInitInFlight) {
        console.log('[Ali] init in flight — skip')
        return
      }
      const videoId = this.aliVideoIdToPlay
      console.log('[Ali] Initializing player with videoId:', videoId)
      this._aliInitInFlight = true

      try {
        // 1. Load SDK
        const sdkOk = await this._loadAliplayerSDK()
        if (!sdkOk) throw new Error('Aliplayer SDK not loaded')

        // 2. รอ DOM container ปรากฏก่อน (v-if async render → #J_prismPlayer อาจยังไม่มี)
        await this.$nextTick()
        let waitTries = 0
        while (!document.getElementById('J_prismPlayer') && waitTries < 20) {
          await new Promise(r => setTimeout(r, 100))
          waitTries++
        }
        if (!document.getElementById('J_prismPlayer')) {
          throw new Error('Container #J_prismPlayer not found in DOM')
        }

        // 3. Cleanup previous ก่อน fetch STS (กัน 2 STS ยิงซ้อน)
        if (this._aliPlayer) {
          try { this._aliPlayer.dispose() } catch {}
          this._aliPlayer = null
        }

        // 3. Fetch STS (fresh, no race)
        const sts = await this._fetchAliStsToken()

        // 4. Config
        const config = {
          id: 'J_prismPlayer',
          vid: videoId,
          accessKeyId: sts.accessKeyId,
          accessKeySecret: sts.accessKeySecret,
          securityToken: sts.securityToken,
          region: sts.region || 'ap-southeast-1',
          width: '100%',
          height: '100%',
          autoplay: false,
          isLive: false,
          rePlay: false,
          playsinline: true,
          preload: true,
          // ⭐ ปิด Aliplayer native controls — ใช้ Custom UI (ali-ctl-layer) เอง
          controlBarVisibility: 'never',
          showBigPlayButton: false,
          skinLayout: false,
          useH5Prism: true,
          license: {
            domain: 'passport.medninja.academy',
            key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
          },
          // encryptType 1 = Alibaba proprietary (permissive — รับทั้ง Ali + Widevine template)
          encryptType: 1
        }

        // 5. Instantiate
        this._aliPlayer = new window.Aliplayer(config, (p) => {
          console.log('[Ali] Player instance created')
        })

        // 6. Events
        this._aliPlayer.on('ready', () => {
          console.log('[Ali] Player ready')
          this.playerReady = true
          try { this.aliDuration = this._aliPlayer.getDuration() || 0 } catch {}
          this._startAliTimePolling()
        })
        this._aliPlayer.on('canplay', () => {
          console.log('[Ali] canplay — DRM decrypted OK')
          try { this.aliDuration = this._aliPlayer.getDuration() || 0 } catch {}
        })
        // ⭐ Resume — ถ้ามี watch progress เดิม → seek ไปตำแหน่งเดิม (เหมือน Bunny #12)
        if (!this.isDemo && !this._resumeAttempted) {
          this._resumeAttempted = true
          api.get(`/my/watch-progress/${this.sectionId}`).then(res => {
            const prog = (res.progress || []).find(pr => pr.videoIndex === this.videoIndex)
            if (prog && prog.currentTime > 10) {
              const seekTo = Math.max(0, prog.currentTime - 3)
              const doSeek = () => {
                try { this._aliPlayer.seek(seekTo); console.log('[Ali Resume] seek to', seekTo) } catch (e) {}
              }
              // ลอง seek ทันที + ลองอีก 1 + 3 วิ (เผื่อ Aliplayer ยังไม่พร้อม)
              doSeek()
              setTimeout(doSeek, 1000)
              setTimeout(doSeek, 3000)
            }
          }).catch(() => {})
        }

        // ⭐ Play — sync isPlaying + socket emit (เหมือน Bunny)
        this._aliPlayer.on('play', () => {
          this.isPlaying = true
          this._playerError = ''
          this._scheduleHideControls()
          // Socket: broadcast play → Warroom เห็น
          if (this._socket?.connected) this._socket.emit('video:play')
          // ยกเลิก idle timer
          if (this._clearIdleTimer) this._clearIdleTimer()
          this._diagLog && this._diagLog('play_event', 'Ali play')
        })
        // ⭐ Pause — sync + socket + idle timer
        this._aliPlayer.on('pause', () => {
          this.isPlaying = false
          this._showControlsSticky()
          if (this._socket?.connected) this._socket.emit('video:pause')
          if (!this.isDemo && this._startIdleTimer) this._startIdleTimer()
          this._diagLog && this._diagLog('pause_event', 'Ali pause', { detail: `t=${Math.round(this._currentTime||0)}` })
        })
        // ⭐ Ended — sync + socket + auto mark watched
        this._aliPlayer.on('ended', () => {
          this.isPlaying = false
          this._showControlsSticky()
          if (this._socket?.connected) this._socket.emit('video:ended')
          if (!this.isDemo && !this.isWatched(this.videoIndex)) {
            this.toggleWatched(this.videoIndex)
          }
        })
        // ⭐ Timeupdate — sync time + socket state (isPlaying = trust event play/pause เท่านั้น)
        this._aliPlayer.on('timeupdate', () => {
          try {
            const t = this._aliPlayer.getCurrentTime() || 0
            const d = this._aliPlayer.getDuration() || 0
            this.aliCurrentTime = t
            if (d > 0) this.aliDuration = d
            // Sync heartbeat vars (Warroom + kick check ใช้ตัวนี้)
            this._currentTime = t
            if (d > 0) this._videoDuration = d
            // Auto mark watched ที่ 90%
            if (!this.isDemo && this._videoDuration > 0 &&
                t >= this._videoDuration * 0.9 && !this.isWatched(this.videoIndex)) {
              this.toggleWatched(this.videoIndex)
            }
            // Socket state ทุก 3 วิ (Warroom monitoring) — ดึง getStatus จริง
            const now = Date.now()
            if (!this._lastSocketState || now - this._lastSocketState > 3000) {
              this._lastSocketState = now
              if (this._socket?.connected) {
                let realIsPlaying = this.isPlaying
                try {
                  if (typeof this._aliPlayer.getStatus === 'function') {
                    const s = this._aliPlayer.getStatus()
                    realIsPlaying = s === 'play' || s === 'playing'
                    this.isPlaying = realIsPlaying
                  }
                } catch {}
                this._socket.emit('video:state', {
                  currentTime: Math.round(t),
                  duration: Math.round(d),
                  isPlaying: realIsPlaying,
                  appVersion: _getAppVersion()
                })
              }
            }
          } catch {}
        })
        // ⭐ Error — log + socket
        this._aliPlayer.on('error', (e) => {
          const details = e && e.paramData ? JSON.stringify(e.paramData) : JSON.stringify(e || {})
          this._playerError = details
          console.error('[Ali] Player error:', details)
          if (this._socket?.connected) this._socket.emit('video:error', { detail: details })
          this._diagLog && this._diagLog('player_error', 'Ali error', { detail: details })
        })
        // ⭐ Waiting/Loading (buffering)
        this._aliPlayer.on('waiting', () => {
          this._diagLog && this._diagLog('waiting_event', 'buffering')
        })

      } catch (err) {
        console.error('[Ali] Init failed:', err.message)
      } finally {
        this._aliInitInFlight = false
      }
    },
    _disposeAliPlayer () {
      this._stopAliTimePolling()
      if (this._aliPlayer) {
        try { this._aliPlayer.dispose() } catch {}
        this._aliPlayer = null
      }
      this.playerReady = false
      this.aliCurrentTime = 0
      this.aliDuration = 0
      this.isPlaying = false
    },
    // ⭐ Custom Aliplayer controls
    _startAliTimePolling () {
      this._stopAliTimePolling()
      this._aliTimePoll = setInterval(() => {
        if (!this._aliPlayer) return
        try {
          this.aliCurrentTime = this._aliPlayer.getCurrentTime() || 0
          if (!this.aliDuration) this.aliDuration = this._aliPlayer.getDuration() || 0
        } catch {}
      }, 500)
    },
    _stopAliTimePolling () {
      if (this._aliTimePoll) { clearInterval(this._aliTimePoll); this._aliTimePoll = null }
    },
    _showControlsSticky () {
      this.aliControlsVisible = true
      if (this._aliHideControlsTimer) { clearTimeout(this._aliHideControlsTimer); this._aliHideControlsTimer = null }
    },
    _scheduleHideControls () {
      this.aliControlsVisible = true
      if (this._aliHideControlsTimer) clearTimeout(this._aliHideControlsTimer)
      this._aliHideControlsTimer = setTimeout(() => {
        if (this.isPlaying) this.aliControlsVisible = false
      }, 3000)
    },
    aliTogglePlay () {
      if (!this._aliPlayer) return
      // ⭐ ป้องกัน rapid tap (300ms throttle) → Aliplayer race condition
      const now = Date.now()
      if (this._lastTogglePlay && now - this._lastTogglePlay < 300) return
      this._lastTogglePlay = now
      try {
        // ⭐ Optimistic UI: อัปเดต isPlaying ทันที (ไม่รอ event)
        // แล้ว event 'play'/'pause' จะ sync ทีหลัง (ถ้าล้มเหลว event จะ correct)
        if (this.isPlaying) {
          this.isPlaying = false
          this._aliPlayer.pause()
          this._showControlsSticky()
        } else {
          this.isPlaying = true
          this._aliPlayer.play()
          this._scheduleHideControls()
        }
      } catch (e) {
        console.warn('[Ali] toggle play failed', e)
      }
    },
    aliSeek (sec) {
      if (!this._aliPlayer) return
      // Throttle seek 500ms — DRM/Widevine session ทน seek รัวๆ ไม่ได้
      const now = Date.now()
      if (this._lastAliSeek && now - this._lastAliSeek < 500) return
      this._lastAliSeek = now
      try { this._aliPlayer.seek(sec) } catch {}
      this.aliCurrentTime = sec
    },
    // ⭐ Smooth seek: drag update seekValue เท่านั้น (ไม่ยิง seek ทุก frame)
    aliSeekStart () {
      this.aliSeeking = true
      this.aliSeekValue = this.aliCurrentTime
      this._showControlsSticky()
    },
    aliSeekMove (e) {
      // ระหว่าง drag — update seekValue เท่านั้น (ไม่ยิง seek)
      // Reason: DRM video (Widevine) ต้อง fetch license + decrypt ใหม่ทุก seek
      //         ถ้ายิงระหว่าง drag = DRM session ล่ม → player ค้าง
      const val = parseFloat(e.target.value) || 0
      this.aliSeekValue = val
    },
    aliSeekEnd () {
      if (!this.aliSeeking) return
      // ปล่อยแล้ว — commit ค่าจริง
      const val = this.aliSeekValue
      this.aliSeeking = false
      this.aliCurrentTime = val
      if (this._aliPlayer) { try { this._aliPlayer.seek(val) } catch {} }
      this._showControlsSticky()
    },
    // Backward compat (บาง call site อาจเรียก)
    aliOnSeekbarInput (e) {
      this.aliSeekMove(e)
    },
    // ⭐ ตัดสินใจ variant สำหรับ Warroom — ใช้ backend เลือกก่อน (แม่นสุด)
    _resolveAliVariant () {
      const v = this.video
      if (!v) return ''
      // 1. Backend ส่ง aliChosenVariant มาแล้ว → ใช้ตรงๆ (source of truth)
      if (v.aliChosenVariant) return v.aliChosenVariant
      // 2. drmMode (Bunny compat)
      if (v.drmMode === 'widevine') return 'drm'
      // 3. Fallback compare ID
      const drmId = (v.aliDrmVideoId || '').trim()
      const chosen = (this.aliVideoIdToPlay || '').trim()
      if (drmId && drmId === chosen) return 'drm'
      return 'noDrm'
    },
    aliSetSpeed (s) {
      if (!this._aliPlayer) return
      try { this._aliPlayer.setSpeed(s) } catch {}
      this.aliSpeed = s
      this.aliShowSpeedMenu = false
    },
    aliToggleMute () {
      if (!this._aliPlayer) return
      try {
        if (this.aliMuted) { this._aliPlayer.unmute(); this.aliMuted = false }
        else { this._aliPlayer.mute(); this.aliMuted = true }
      } catch {}
    },
    aliSetVolume (v) {
      if (!this._aliPlayer) return
      try { this._aliPlayer.setVolume(v) } catch {}
      this.aliVolume = v
      if (v > 0 && this.aliMuted) this.aliMuted = false
    },
    aliOnVolumeInput (e) {
      const v = parseFloat(e.target.value) || 0
      this.aliSetVolume(v)
    },
    aliToggleFullscreen () {
      const box = this.$el.querySelector('.w-player-box')
      if (!box) return
      const doc = document
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc)
      } else {
        (box.requestFullscreen || box.webkitRequestFullscreen).call(box)
      }
    },
    aliFmtTime (sec) {
      const s = Math.max(0, Math.floor(sec || 0))
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const ss = s % 60
      const pad = n => (n < 10 ? '0' + n : '' + n)
      return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
    },
    aliOnPlayerTap () {
      // แตะบน player → toggle controls (mobile)
      if (this.aliControlsVisible) {
        if (this.isPlaying) this.aliControlsVisible = false
      } else {
        this.aliControlsVisible = true
        this._scheduleHideControls()
      }
    }
  },
  watch: {
    aliVideoIdToPlay(newId) {
      if (!newId) {
        this._disposeAliPlayer()
        return
      }
      this.$nextTick(() => this._initAliPlayer())
    }
  }
}
</script>

<style scoped>
/* ══ Full-page dark layout (Udemy-style) ══ */
.watch-page {
  background: #1c1d1f;
  color: #fff;
  /* ⭐ หัก banner height ออก — ไม่ให้ detail bar ล้นออกด้านล่าง */
  height: calc(100vh - var(--country-banner-h, 28px));
  height: calc(100dvh - var(--country-banner-h, 28px));
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* ⭐ วาง watch page ต่อจาก banner */
  top: var(--country-banner-h, 28px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* ═══ Unsupported overlay ═══ */
/* ═══ Replaced overlay — เปิดอยู่หลาย tab ═══ */
.replaced-overlay {
  position: absolute;
  inset: 0;
  background: rgba(88,28,135,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(6px);
}
.replaced-card {
  text-align: center;
  padding: 32px 24px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Fix button in topbar ── */
.w-fix-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5; border-radius: 8px; padding: 5px 10px;
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: all 0.15s; flex-shrink: 0;
}
.w-fix-btn:hover { background: rgba(239, 68, 68, 0.25); color: #fff; }
@media (max-width: 640px) { .w-fix-text { display: none; } .w-fix-btn { padding: 6px; } }

/* ── Fix Modal ── */
.fix-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 300; padding: 20px;
}
.fix-modal {
  background: #1e293b; border-radius: 16px; max-width: 480px; width: 100%;
  max-height: 85vh; overflow-y: auto; color: #e2e8f0;
}
.fix-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0; gap: 12px;
}
.fix-header h3 { font-size: 17px; font-weight: 800; margin: 0; color: #fff; }
.fix-close {
  background: none; border: none; color: #94a3b8; font-size: 24px;
  cursor: pointer; padding: 0; line-height: 1;
}
.fix-close:hover { color: #fff; }
.fix-body { padding: 16px 24px 24px; }
.fix-intro { font-size: 13px; color: #94a3b8; margin: 0 0 16px; }
.fix-hard-reset {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 16px; font-weight: 800; cursor: pointer;
  transition: opacity 0.15s; box-shadow: 0 4px 15px rgba(239,68,68,0.3);
}
.fix-hard-reset:hover { opacity: 0.9; }
.fix-divider {
  text-align: center; color: #475569; font-size: 12px; font-weight: 600;
  margin: 20px 0; position: relative;
}
.fix-divider::before, .fix-divider::after {
  content: ''; position: absolute; top: 50%; width: 30%; height: 1px; background: #334155;
}
.fix-divider::before { left: 0; }
.fix-divider::after { right: 0; }
.fix-steps { display: flex; flex-direction: column; gap: 16px; }
.fix-step {
  display: flex; gap: 12px; background: rgba(255,255,255,0.04);
  border-radius: 12px; padding: 14px;
}
.fix-step-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #3b82f6; color: #fff; font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fix-step-content { flex: 1; min-width: 0; }
.fix-step-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.fix-step-keys { font-size: 12px; color: #94a3b8; margin-bottom: 3px; }
.fix-os { color: #64748b; font-weight: 600; margin-right: 4px; }
kbd {
  background: #334155; color: #e2e8f0; padding: 2px 6px; border-radius: 4px;
  font-size: 11px; font-family: monospace; border: 1px solid #475569;
}
.fix-step-note { font-size: 12px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }
.fix-link { color: #3b82f6; font-weight: 700; text-decoration: underline; }

.unsupported-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.unsupported-card {
  text-align: center;
  max-width: 400px;
  padding: 40px 30px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.unsupported-icon { width: 56px; height: 56px; margin: 0 auto 16px; color: #f59e0b; }
.unsupported-icon svg { width: 100%; height: 100%; }
.unsupported-play-icon { width: 64px; height: 64px; margin: 0 auto 16px; color: #3b82f6; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.unsupported-play-icon svg { width: 32px; height: 32px; }

/* ═══ LINE Blur Overlay — ทับบน WatchPage จริง ═══ */
.line-blur-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.line-blur-card {
  text-align: center; max-width: 340px; width: 100%;
  padding: 32px 24px 24px;
  background: rgba(28,29,31,0.92);
  border-radius: 20px;
  border: 1px solid rgba(168,85,247,0.25);
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.line-blur-play {
  width: 72px; height: 72px; border-radius: 50%; cursor: pointer;
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 0 30px rgba(168,85,247,0.5);
  animation: line-blur-pulse 2s ease-in-out infinite;
  transition: transform 0.2s;
}
.line-blur-play:active { transform: scale(0.93); }
.line-blur-play svg { width: 32px; height: 32px; color: #fff; margin-left: 3px; }
@keyframes line-blur-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(168,85,247,0.5), 0 0 0 0 rgba(168,85,247,0.3); }
  50% { box-shadow: 0 0 40px rgba(168,85,247,0.6), 0 0 0 10px rgba(168,85,247,0); }
}
.line-blur-card h2 {
  font-size: 17px; font-weight: 700; color: #f1f5f9; margin: 0 0 6px;
}
.line-blur-card p {
  font-size: 13px; color: #94a3b8; margin: 0 0 20px;
}
.line-blur-btn-primary {
  width: 100%; padding: 14px; border: none; border-radius: 12px; cursor: pointer;
  background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff;
  font-size: 16px; font-weight: 700; margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(168,85,247,0.4);
  transition: opacity 0.2s;
}
.line-blur-btn-primary:active { opacity: 0.85; }
.line-blur-row {
  display: flex; gap: 8px;
}
.line-blur-btn-outline {
  flex: 1; padding: 10px 8px; border-radius: 10px; cursor: pointer;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: #c4b5fd; font-size: 13px; font-weight: 600;
  text-decoration: none; text-align: center;
  transition: background 0.2s;
}
.line-blur-btn-outline:active { background: rgba(255,255,255,0.15); }
.line-blur-bg > :not(.line-blur-overlay):not(.line-popup-overlay) {
  filter: blur(6px); pointer-events: none; user-select: none;
}
.unsupported-card h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.unsupported-card p { font-size: 14px; color: #64748b; margin-bottom: 24px; }

/* ═══ Top bar ═══ */
.w-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: #1c1d1f;
  border-bottom: 1px solid #3e4143;
  flex-shrink: 0;
  z-index: 100;
}

.w-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  transition: background 0.15s;
  flex-shrink: 0;
}
.w-back:hover { background: rgba(255,255,255,0.1); }
.w-back svg { width: 18px; height: 18px; }

.w-topbar-info {
  flex: 1;
  min-width: 0;
}
.w-admin-badge {
  display: inline-block;
  background: #a855f7;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  margin-right: 8px;
  flex-shrink: 0;
}
.w-section-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.w-progress-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #a1a1aa;
  flex-shrink: 0;
}
.w-progress-bar-mini {
  width: 60px;
  height: 4px;
  background: #3e4143;
  border-radius: 2px;
  overflow: hidden;
}
.w-progress-fill {
  height: 100%;
  background: #a855f7;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.w-sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.w-sidebar-toggle:hover { background: rgba(255,255,255,0.1); }
.w-sidebar-toggle svg { width: 18px; height: 18px; }

/* ═══ Layout: Player + Sidebar ═══ */
.w-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ═══ Main (player area) ═══ */
.w-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.w-player-area {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.w-player-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  flex-shrink: 0;
}
.w-player-box iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}
/* ป้องกัน right-click / drag / select บน player area */
.w-player-area {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Watermark layer — pointer-events:none เสมอ ไม่บล็อก touch/click */
.wm-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.wm-overlay > * {
  pointer-events: none;
}
.wm-grid {
  position: absolute;
  top: -150%;
  bottom: -150%;
  left: -200%;
  right: -200%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  transform: rotate(-22deg);
  transform-origin: center center;
}
.wm-text {
  white-space: nowrap;
  font-size: 1.3vw;
  color: rgba(128, 128, 128, 0.09);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.03);
  padding: 0.4vw 0;
  user-select: none;
}
/* Staggered offset — ทุก 3 แถวเหลื่อมกัน */
.wm-text:nth-child(3n+2) { transform: translateX(-15%); }
.wm-text:nth-child(3n)   { transform: translateX(-30%); }
/* Mobile center watermark — แสดงเฉพาะ mobile (v-if จัดการ render) */
.wm-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
  gap: 0.3vw;
  font-size: 1.2vw;
  color: rgba(128, 128, 128, 0.09);
  font-weight: 600;
  text-align: center;
  pointer-events: none;
  user-select: none;
  z-index: 2;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.03);
}
/* Demo watermark — 2 บรรทัดกลางจอ */
/* Demo fullscreen: ลายน้ำใหญ่กลางจอ — ซ่อนปกติ แสดงเฉพาะ fullscreen */
.wm-demo-fs {
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  z-index: 3;
}
.wm-demo-fs span {
  font-size: 4vw;
  font-weight: 900;
  color: rgba(128, 128, 128, 0.13);
  letter-spacing: 0.4vw;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.03);
}
.w-player-box:fullscreen .wm-demo-fs,
.w-player-box.is-fullscreen .wm-demo-fs {
  display: flex;
}

.wm-demo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;
  user-select: none;
  z-index: 2;
}
.wm-demo span {
  font-size: clamp(32px, 8vw, 64px);
  font-weight: 800;
  color: rgba(255, 255, 255, 0.15);
  letter-spacing: 8px;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
}
.wm-demo .wm-demo-sub {
  font-size: clamp(18px, 4vw, 36px);
  font-weight: 700;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.12);
}
/* Custom play/pause button */
.wm-play-btn {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 20;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.wm-play-btn svg { width: 20px; height: 20px; }
.w-player-box:hover .wm-play-btn { opacity: 1; }
.wm-play-btn:hover { background: rgba(0, 0, 0, 0.8); }
/* Custom fullscreen button */
.wm-fs-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 20;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.wm-fs-btn svg { width: 20px; height: 20px; }
.w-player-box:hover .wm-fs-btn { opacity: 1; }
.wm-fs-btn:hover { background: rgba(0, 0, 0, 0.8); }
/* Fullscreen mode: player box fills screen */
.w-player-box:fullscreen {
  width: 100vw;
  height: 100vh;
  aspect-ratio: auto;
  position: relative;
}
.w-player-box.is-fullscreen {
  width: 100vw;
  height: 100vh;
  aspect-ratio: auto;
  position: relative;
}
.w-player-box.is-fullscreen .wm-grid {
  top: -200%;
  bottom: -200%;
  left: -300%;
  right: -300%;
}
.w-player-box.is-fullscreen .wm-text {
  font-size: 1.3vw;
  padding: 0.3vw 0;
}
/* Portrait fullscreen — center video 16:9 + ลายน้ำถี่ขึ้น */
@media (orientation: portrait) {
  /* Center iframe at 16:9 instead of stretching to full height */
  .w-player-box:fullscreen,
  .w-player-box.is-fullscreen {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .w-player-box:fullscreen iframe,
  .w-player-box.is-fullscreen iframe {
    position: relative;
    inset: auto;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  .w-player-box:fullscreen .player-placeholder,
  .w-player-box.is-fullscreen .player-placeholder {
    position: relative;
    inset: auto;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
  /* Watermark grid — tighter for portrait */
  .w-player-box:fullscreen .wm-grid,
  .w-player-box.is-fullscreen .wm-grid {
    top: -50%;
    bottom: -50%;
    left: -200%;
    right: -200%;
  }
  .w-player-box:fullscreen .wm-text,
  .w-player-box.is-fullscreen .wm-text {
    font-size: 1.5vw;
    padding: 0.2vw 0;
  }
  .w-player-box:fullscreen .wm-center,
  .w-player-box.is-fullscreen .wm-center {
    font-size: 28px;
  }
  .w-player-box:fullscreen .wm-demo span,
  .w-player-box.is-fullscreen .wm-demo span {
    font-size: clamp(48px, 10vw, 80px);
  }
}
.w-player-box:fullscreen .wm-play-btn,
.w-player-box.is-fullscreen .wm-play-btn { opacity: 1; }
.w-player-box:fullscreen .wm-fs-btn,
.w-player-box.is-fullscreen .wm-fs-btn { opacity: 1; }

/* Placeholder */
.player-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.player-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.placeholder-content {
  text-align: center;
  padding: 20px;
}
.placeholder-play {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border: 2px solid rgba(255,255,255,0.2);
  transition: all 0.3s;
}
.placeholder-play:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
.placeholder-play svg { width: 32px; height: 32px; color: #fff; margin-left: 4px; }
.placeholder-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 6px; }
.placeholder-sub { font-size: 13px; color: rgba(255,255,255,0.5); }

/* Error */
.player-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1c1d1f;
  color: #ef4444;
  gap: 8px;
}
.player-error svg { width: 40px; height: 40px; }
.player-error p { font-size: 14px; }

/* ═══ Video info bar ═══ */
.w-video-info {
  padding: 16px 20px;
  border-top: 1px solid #3e4143;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.w-video-meta { flex: 1; min-width: 0; }
.w-video-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  line-height: 1.4;
  margin-bottom: 6px;
}
.w-video-sub {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.w-video-duration, .w-video-idx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #a1a1aa;
}
.w-video-duration svg { width: 14px; height: 14px; }

/* DRM badge */
.w-drm-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: #a1a1aa;
}
.w-drm-badge svg { width: 12px; height: 12px; }
.w-drm-badge.drm-widevine { color: #4ade80; background: rgba(74,222,128,0.1); }
.w-drm-badge.drm-protection { color: #60a5fa; background: rgba(96,165,250,0.1); }
.w-drm-badge.drm-fairplay { color: #60a5fa; background: rgba(96,165,250,0.1); }
.w-drm-badge.drm-playready { color: #c084fc; background: rgba(192,132,252,0.1); }
.w-drm-badge.drm-none { color: #f87171; background: rgba(248,113,113,0.1); }
.w-wm-badge { color: #94a3b8; background: rgba(148,163,184,0.1); display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

/* Device/Browser badge */
.w-device-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  color: #a1a1aa;
  background: rgba(255,255,255,0.08);
}
.w-device-badge svg { width: 12px; height: 12px; }

.w-video-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.w-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #3e4143;
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.w-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: #fff; }
.w-nav-btn:disabled { opacity: 0.3; cursor: default; }
.w-nav-btn svg { width: 18px; height: 18px; }

.w-mark-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #3e4143;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.w-mark-btn:hover { background: rgba(255,255,255,0.1); }
.w-mark-btn svg { width: 16px; height: 16px; }
.w-mark-btn.done {
  background: #a855f7;
  border-color: #a855f7;
  color: #fff;
}

/* ═══ Sidebar ═══ */
.w-sidebar {
  width: 360px;
  background: #1c1d1f;
  border-left: 1px solid #3e4143;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
}

/* Desktop: collapsed */
.w-sidebar:not(.open) {
  width: 0;
  border-left: none;
  opacity: 0;
  pointer-events: none;
}

.w-sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #3e4143;
  flex-shrink: 0;
}
.w-sidebar-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex: 1;
}
.w-sidebar-count {
  font-size: 12px;
  color: #a1a1aa;
  white-space: nowrap;
}
.w-sidebar-close {
  display: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: none;
  color: #a1a1aa;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
.w-sidebar-close:hover { color: #fff; background: rgba(255,255,255,0.1); }
.w-sidebar-close svg { width: 16px; height: 16px; }

.w-sidebar-progress {
  padding: 0 16px 8px;
  flex-shrink: 0;
}
.w-sidebar-progress-bar {
  height: 3px;
  background: #3e4143;
  border-radius: 2px;
  overflow: hidden;
}
.w-sidebar-progress-fill {
  height: 100%;
  background: #a855f7;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ═══ Playlist ═══ */
.w-playlist {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.w-playlist::-webkit-scrollbar { width: 4px; }
.w-playlist::-webkit-scrollbar-track { background: transparent; }
.w-playlist::-webkit-scrollbar-thumb { background: #3e4143; border-radius: 2px; }

.w-playlist-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: #d4d4d8;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.1s;
  border-left: 3px solid transparent;
}
.w-playlist-item:hover { background: rgba(255,255,255,0.05); }
.w-pl-topic {
  font-size: 11px;
  font-weight: 800;
  color: #a855f7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 16px 4px;
  border-top: 1px solid #3e4143;
}
.w-pl-topic:first-child { border-top: none; }

.w-pl-subtopic {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  padding: 8px 16px 4px 28px;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.w-pl-subtopic-icon {
  font-size: 16px;
  font-weight: 900;
  color: #0ea5e9;
  line-height: 1;
}

.w-playlist-item.active {
  background: rgba(168,85,247,0.1);
  border-left-color: #a855f7;
  color: #fff;
}
.w-playlist-item.watched .w-pl-check { color: #a855f7; }

/* Locked playlist item — tier ไม่ถึง */
.w-playlist-item.w-pl-locked {
  opacity: 0.55;
  cursor: not-allowed;
  background: transparent !important;
}
.w-playlist-item.w-pl-locked:hover { background: transparent !important; }
.w-playlist-item.w-pl-locked .w-pl-title { color: #94a3b8; font-weight: 500; }
.w-playlist-item.w-pl-locked .w-pl-check { color: #94a3b8; }
.w-pl-tier-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 9999px;
  font-size: 10px; font-weight: 700;
  background: rgba(186,230,253,0.15); color: #7dd3fc;
  border: 1px solid rgba(186,230,253,0.3);
  margin-top: 2px;
}

/* Demo CTA box */
/* Demo Feature Showcase */
.demo-feat {
  padding: 10px 16px 60px;
  border-top: 1px solid #2d2f31;
}
.demo-feat-header {
  text-align: center;
  margin-bottom: 10px;
}
.demo-feat-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
  box-shadow: 0 2px 8px rgba(220,38,38,0.3);
}
.demo-feat-title {
  font-size: 13px;
  font-weight: 800;
  color: #e2e8f0;
}
.demo-feat-sub {
  font-size: 11px;
  color: #64748b;
}
.demo-feat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.demo-feat-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.demo-fi-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.demo-fi-red { background: rgba(239,68,68,0.12); color: #f87171; }
.demo-fi-purple { background: rgba(139,92,246,0.12); color: #a78bfa; }
.demo-fi-cyan { background: rgba(6,182,212,0.12); color: #22d3ee; }
.demo-fi-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }
.demo-feat-item b {
  display: block;
  font-size: 12px;
  color: #e2e8f0;
  margin-bottom: 1px;
}
.demo-feat-item span {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

.demo-promo {
  border-top: 1px solid #2d2f31;
  padding: 10px 12px 14px;
  flex-shrink: 0;
}
.demo-promo-label {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.demo-promo-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.demo-promo-card {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.2s;
  text-align: center;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
}
.demo-promo-card:hover {
  border-color: rgba(59,130,246,0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59,130,246,0.1);
}
.demo-promo-card img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  display: block;
}
@media (orientation: landscape) and (max-height: 500px) {
  .demo-promo-card img { aspect-ratio: 16/9; }
  .demo-promo-label { display: none; }
  .demo-promo { padding: 6px 12px 10px; }
  .demo-feat { display: none; }
  .w-sidebar { width: 280px !important; }
  .w-sidebar:not(.open) { width: 280px !important; }
}
.demo-promo-card span {
  font-size: 11px;
  font-weight: 800;
  color: #e2e8f0;
  padding: 6px 4px;
}
.demo-promo-btn {
  display: block;
  text-align: center;
  padding: 8px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}
.demo-promo-btn:hover {
  box-shadow: 0 4px 12px rgba(168,85,247,0.3);
  transform: translateY(-1px);
}

.w-pl-check {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.w-pl-check svg { width: 16px; height: 16px; }
.w-pl-num {
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
}

.w-pl-info {
  flex: 1;
  min-width: 0;
}
.w-pl-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  display: block;
  margin-bottom: 2px;
}
.w-pl-duration {
  font-size: 11px;
  color: #71717a;
}

/* Playing animation bars */
.w-pl-playing {
  flex-shrink: 0;
  margin-top: 3px;
}
.w-pl-bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}
.w-pl-bars span {
  display: block;
  width: 3px;
  background: #a855f7;
  border-radius: 1px;
  animation: eq-bar 0.8s ease-in-out infinite alternate;
}
.w-pl-bars span:nth-child(1) { height: 6px; animation-delay: 0s; }
.w-pl-bars span:nth-child(2) { height: 10px; animation-delay: 0.2s; }
.w-pl-bars span:nth-child(3) { height: 4px; animation-delay: 0.4s; }

@keyframes eq-bar {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}

/* ═══ Mobile sidebar backdrop ═══ */
.w-sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 199;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.w-sidebar-backdrop.show { opacity: 1; pointer-events: auto; }

/* ═══ Responsive — Tablet ═══ */
@media (max-width: 1024px) {
  .w-sidebar {
    position: fixed;
    top: 48px;
    right: 0;
    bottom: 0;
    width: 340px;
    z-index: 200;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
    pointer-events: auto;
    box-shadow: -4px 0 20px rgba(0,0,0,0.4);
  }
  .w-sidebar:not(.open) {
    width: 340px;
    border-left: 1px solid #3e4143;
    opacity: 1;
  }
  .w-sidebar.open {
    transform: translateX(0);
  }
  .w-sidebar-close { display: flex; }
  .w-sidebar-backdrop { display: block; }

  /* Player fills full width — scrollable so buttons visible */
  .w-main { overflow-y: auto; }
  .w-player-box { flex-shrink: 0; }
}

/* Small screens: ลายน้ำ + ปุ่ม */
@media (max-width: 640px) {
  .wm-center { font-size: 19px; }
  .wm-play-btn { bottom: 8px; left: 8px; width: 32px; height: 32px; }
  .wm-fs-btn { bottom: 8px; right: 8px; width: 32px; height: 32px; }
}
/* Mobile landscape: ลายน้ำใหญ่ขึ้น */
@media (max-height: 500px) and (orientation: landscape) {
  .wm-center { font-size: 22px; }
  .wm-text { font-size: 19px; padding: 5px 0; }
}

/* ═══ Responsive — Mobile ═══ */
@media (max-width: 768px) {
  /* ป้องกัน horizontal overflow (ปุ่มตกขอบ) */
  .watch-page, .w-layout, .w-main, .w-video-info {
    max-width: 100vw;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  .w-topbar {
    padding: 0 12px;
    gap: 8px;
    height: 44px;
    padding-top: env(safe-area-inset-top, 0);
  }
  .w-back { width: 32px; height: 32px; }
  .w-back svg { width: 16px; height: 16px; }
  .w-section-name { font-size: 13px; }
  .w-sidebar-toggle { width: 32px; height: 32px; }

  /* Video info — stacked layout */
  .w-video-info {
    padding: 14px 16px;
    flex-direction: column;
    gap: 12px;
  }
  .w-video-title { font-size: 15px; margin-bottom: 4px; }

  /* Actions — wrap ให้ปุ่มไม่ตกขอบ (CN: WeChat + Diag + Mini + Prev + Next + Mark) */
  .w-video-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    box-sizing: border-box;
  }
  .w-video-actions > * {
    flex-shrink: 0;
    max-width: 100%;
  }
  .w-ask-btn, .w-diag-btn, .w-mini-btn {
    font-size: 12px;
    padding: 8px 12px;
    white-space: nowrap;
  }
  .w-mark-btn {
    justify-content: center;
    padding: 10px 12px;
    font-size: 12px;
    flex: 1 1 100%;
    order: 99;
  }
  .w-nav-btn { width: 44px; height: 44px; }

  /* Sidebar drawer */
  .w-sidebar { width: 88vw; }
  .w-sidebar:not(.open) { width: 88vw; }

  /* Playlist items — bigger touch targets */
  .w-playlist-item {
    padding: 12px 16px;
    min-height: 52px;
  }
  .w-playlist-item:active {
    background: rgba(168,85,247,0.15);
  }
}

/* ═══ Responsive — Small phones ═══ */
@media (max-width: 380px) {
  .w-progress-pill { display: none; }
  .w-section-name { font-size: 12px; }
  .w-video-title { font-size: 14px; }
  .w-sidebar { width: 92vw; }
  .w-sidebar:not(.open) { width: 92vw; }
  .placeholder-play { width: 56px; height: 56px; }
  .placeholder-play svg { width: 24px; height: 24px; }
  .placeholder-title { font-size: 14px; }
  .placeholder-sub { font-size: 11px; }
}

/* ═══ Ask Doctor button ═══ */
.w-ask-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  background: rgba(59,130,246,0.1);
  color: #60a5fa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.w-ask-btn svg { width: 14px; height: 14px; }
.w-ask-btn:hover { background: rgba(59,130,246,0.25); color: #93bbfd; }

/* ═══ Diag button (in video info bar) ═══ */
.w-diag-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #3e4143;
  background: transparent;
  color: #a1a1aa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.w-diag-btn svg { width: 14px; height: 14px; }
.w-diag-btn:hover { background: rgba(168,85,247,0.15); border-color: #a855f7; color: #c084fc; }

/* ═══ Mini Apps button + Modal ═══ */
.w-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #3e4143;
  background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.12));
  color: #c4b5fd;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.w-mini-btn svg { width: 14px; height: 14px; }
.w-mini-btn:hover {
  background: linear-gradient(135deg, rgba(139,92,246,0.28), rgba(59,130,246,0.28));
  border-color: #8b5cf6;
  color: #fff;
}

.mini-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  animation: miniFade 0.2s;
}
@keyframes miniFade { from { opacity: 0; } to { opacity: 1; } }
.mini-modal {
  background: #1c1d1f;
  border: 2px solid #8b5cf6;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);
  animation: miniSlide 0.25s cubic-bezier(.4,0,.2,1);
}
@keyframes miniSlide {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.mini-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #2e3033;
}
.mini-modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
}
.mini-modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all .15s;
}
.mini-modal-close:hover { background: rgba(255,255,255,.08); color: #fff; }
.mini-modal-close svg { width: 20px; height: 20px; }

.mini-modal-sub {
  margin: 0;
  padding: 0 20px 14px;
  font-size: 12px;
  color: #94a3b8;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 6px 20px 20px;
}
.mini-card {
  background: #2a2c2e;
  border: 1.5px solid #3e4143;
  border-radius: 10px;
  padding: 16px 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #e2e8f0;
  font-family: inherit;
}
.mini-card:hover {
  transform: translateY(-2px);
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  background: #34363a;
}
.mini-icon {
  font-size: 32px;
  line-height: 1;
}
.mini-name {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 1px;
  color: #fff;
}
.mini-desc {
  font-size: 11px;
  color: #94a3b8;
}

.mini-atlas:hover { border-color: #8b5cf6; box-shadow: 0 4px 12px rgba(139,92,246,.35); }
.mini-synapse:hover { border-color: #a855f7; box-shadow: 0 4px 12px rgba(168,85,247,.35); }
.mini-nlex:hover { border-color: #26c6da; box-shadow: 0 4px 12px rgba(38,198,218,.35); }
.mini-meqex:hover { border-color: #ef4444; box-shadow: 0 4px 12px rgba(239,68,68,.35); }
.mini-ddx:hover { border-color: #f97316; box-shadow: 0 4px 12px rgba(249,115,22,.35); }
.mini-osce:hover { border-color: #10b981; box-shadow: 0 4px 12px rgba(16,185,129,.35); }
.mini-skill15:hover { border-color: #eab308; box-shadow: 0 4px 12px rgba(234,179,8,.35); }
.mini-longex:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,.35); }

@media (max-width: 480px) {
  .mini-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 6px 14px 14px; }
  .mini-card { padding: 12px 8px; }
  .mini-icon { font-size: 26px; }
  .mini-name { font-size: 12px; }
  .mini-desc { font-size: 10px; }
}

/* ═══ Diag Modal ═══ */
.diag-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.diag-modal {
  background: #1c1d1f;
  border: 1px solid #3e4143;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  max-height: 96vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.diag-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #2d2f31;
}
.diag-modal-header h3 {
  font-size: 13px;
  font-weight: 800;
  color: #a855f7;
  margin: 0;
}
.diag-modal-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.08);
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.diag-modal-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
.diag-modal-close svg { width: 16px; height: 16px; }

.diag-modal-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}
.diag-modal-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
}
.diag-modal-badge.pass { background: #059669; }
.diag-modal-badge.fail { background: #dc2626; }
.diag-modal-badge.run { background: #f59e0b; }
.diag-modal-score {
  font-size: 14px;
  font-weight: 900;
  color: #e2e8f0;
}

.diag-modal-steps {
  padding: 0 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dm-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
}
.dm-step.no { background: rgba(239,68,68,0.08); }
.dm-step-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  flex-shrink: 0;
  background: #2d2f31;
  color: #64748b;
}
.dm-step.ok .dm-step-icon { background: rgba(16,185,129,0.2); color: #10b981; }
.dm-step.no .dm-step-icon { background: rgba(239,68,68,0.2); color: #ef4444; }
.dm-step.run .dm-step-icon { background: rgba(168,85,247,0.2); color: #a855f7; }
.dm-spin {
  display: block;
  width: 10px;
  height: 10px;
  border: 2px solid #444;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.dm-step-body { min-width: 0; }
.dm-step-title { font-size: 11px; font-weight: 700; color: #e2e8f0; line-height: 1.2; }
.dm-step-detail { font-size: 10px; color: #64748b; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px; }
.dm-step-detail.ok { color: #10b981; }
.dm-step-detail.no { color: #ef4444; }
.dm-step-detail.info { color: #f59e0b; }
.dm-step.info .dm-step-icon { background: rgba(245,158,11,0.2); color: #f59e0b; }

.diag-modal-footer {
  padding: 0 12px 10px;
}
.diag-modal-retry {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s;
}
.diag-modal-retry:active { transform: scale(0.98); }

/* LINE Link Popup */
.line-popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.7); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.line-popup-card { background: #fff; border-radius: 16px; padding: 32px 28px; max-width: 380px; width: 90vw; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,.3); }
.line-popup-close { position: absolute; top: 12px; right: 12px; background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; color: #64748b; display: flex; align-items: center; justify-content: center; }
.line-popup-close:hover { background: #e2e8f0; }

/* ═══ Bonus Video ═══ */
.w-bonus-badge {
  display: inline-block; font-size: 11px; font-weight: 700;
  background: #fffbeb; color: #d97706; padding: 2px 8px;
  border-radius: 4px; border: 1px solid #fde68a; margin-left: 8px;
  vertical-align: middle;
}
.w-bonus-nav-btn {
  padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
  cursor: pointer; border: 1px solid var(--border-2); background: #fff; color: var(--text);
  transition: all 0.15s; font-family: 'Noto Sans Thai', sans-serif;
}
.w-bonus-nav-btn:hover { background: #f1f5f9; }
.w-bonus-nav-btn.bonus { background: #fffbeb; color: #d97706; border-color: #fde68a; }
.w-bonus-nav-btn.bonus:hover { background: #fef3c7; }
.w-pl-bonus { padding-left: 36px; background: rgba(251,191,36,0.05); }
.w-pl-bonus.active { background: rgba(251,191,36,0.15); }
.w-pl-bonus-star { font-size: 12px; border: none !important; }

/* ⭐ CN Aliplayer container */
.ali-player-box {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
}

/* ⭐ Custom Aliplayer Controls (เขียนเอง) */
.ali-ctl-layer {
  position: absolute; inset: 0;
  pointer-events: auto;
  z-index: 20;
  transition: opacity .2s;
  display: flex; flex-direction: column;
  background: linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.7) 100%);
}
/* ⭐ ตอน hidden — ยังต้องรับ tap เพื่อ show กลับ (แค่ซ่อนภาพ) */
.ali-ctl-layer.hidden {
  background: transparent;
}
.ali-ctl-layer.hidden .ali-ctl-big-play,
.ali-ctl-layer.hidden .ali-ctl-bar {
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}
.ali-ctl-big-play {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 68px; height: 68px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(6px);
  border: none; color: #fff;
  cursor: pointer;
  display: grid; place-items: center;
  transition: transform .1s, background .15s;
}
.ali-ctl-big-play:hover { background: rgba(0, 0, 0, 0.75); transform: translate(-50%, -50%) scale(1.05); }
.ali-ctl-big-play:active { transform: translate(-50%, -50%) scale(0.95); }

.ali-ctl-bar {
  margin-top: auto;
  padding: 0 14px 10px;
  display: flex; flex-direction: column; gap: 6px;
  color: #fff;
}
.ali-ctl-timeline { padding: 0 4px; }
.ali-ctl-seek {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 4px; border-radius: 2px;
  background: linear-gradient(to right, #ef4444 0%, #ef4444 var(--pct, 0%), rgba(255,255,255,0.3) var(--pct, 0%), rgba(255,255,255,0.3) 100%);
  outline: none;
  cursor: pointer;
}
.ali-ctl-seek::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 14px; height: 14px; border-radius: 50%;
  background: #ef4444; border: none; cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.5);
}
.ali-ctl-seek::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 50%;
  background: #ef4444; border: none; cursor: pointer;
}
.ali-ctl-row {
  display: flex; align-items: center; gap: 6px;
}
.ali-ctl-btn {
  background: transparent; border: none; color: #fff;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  display: grid; place-items: center;
  transition: background .12s;
}
.ali-ctl-btn:hover { background: rgba(255,255,255,0.15); }
.ali-ctl-btn:active { transform: scale(0.95); }
.ali-ctl-time {
  font-size: 12px; font-family: 'SF Mono', ui-monospace, Consolas, monospace;
  color: #fff; padding: 0 6px;
  display: flex; align-items: center; gap: 4px;
}
.ali-ctl-time-sep { opacity: 0.5; }
.ali-ctl-time-total { opacity: 0.75; }
.ali-ctl-spacer { flex: 1; }

.ali-ctl-volume {
  display: flex; align-items: center; gap: 4px;
}
.ali-ctl-vol {
  -webkit-appearance: none; appearance: none;
  width: 70px; height: 3px; border-radius: 2px;
  background: rgba(255,255,255,0.3); outline: none; cursor: pointer;
}
.ali-ctl-vol::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff; border: none; cursor: pointer;
}
.ali-ctl-vol::-moz-range-thumb {
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff; border: none; cursor: pointer;
}

.ali-ctl-speed-wrap { position: relative; }
.ali-ctl-speed-btn {
  min-width: 44px; font-weight: 700; font-size: 12.5px;
  font-family: inherit;
}
.ali-ctl-speed-menu {
  position: absolute; bottom: 100%; right: 0; margin-bottom: 6px;
  background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(6px);
  border-radius: 8px; padding: 4px;
  min-width: 90px; display: flex; flex-direction: column;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.ali-ctl-speed-item {
  background: transparent; border: none; color: #fff;
  padding: 8px 12px; text-align: left;
  font-size: 12.5px; font-family: inherit; cursor: pointer;
  border-radius: 4px;
}
.ali-ctl-speed-item:hover { background: rgba(255,255,255,0.1); }
.ali-ctl-speed-item.active { background: rgba(239, 68, 68, 0.8); font-weight: 700; }

.ali-ctl-layer .hide-mobile {
  display: none;
}
@media (min-width: 768px) {
  .ali-ctl-layer .hide-mobile {
    display: flex;
  }
}

.ali-player-box :deep(.prism-player) {
  width: 100% !important;
  height: 100% !important;
}
/* ⭐ ซ่อนแค่ Aliplayer error dialog (native controls ใช้ตามปกติ) */
.ali-player-box :deep(.prism-ErrorMessage),
.ali-player-box :deep(.prism-notice),
.ali-player-box :deep(.prism-error),
.ali-player-box :deep(.prism-info-display),
.ali-player-box :deep(.prism-tips),
.ali-player-box :deep(.prism-cover) {
  display: none !important;
}
.ali-player-box {
  overflow: hidden !important;
}
.player-placeholder.cn-no-video {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}
.player-placeholder.cn-no-video .placeholder-title {
  color: #334155;
  font-weight: 700;
}
.player-placeholder.cn-no-video .placeholder-sub {
  color: #64748b;
  line-height: 1.6;
}
</style>
