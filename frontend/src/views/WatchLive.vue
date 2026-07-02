<template>
  <div class="watch-page">
    <!-- Mobile in-app (LINE/FB/IG) → บอกให้เปิดใน browser -->
    <div v-if="!browserOk && isMobile" class="unsupported-overlay">
      <div class="unsupported-card">
        <div class="unsupported-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
        </div>
        <h2>{{ browserMsg }}</h2>
        <p>{{ browserDetail }}</p>
        <button class="btn btn-primary" @click="openInBrowser" style="margin-bottom:10px;width:100%">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="vertical-align:-3px;margin-right:6px"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd"/></svg>
          เปิดใน Browser
        </button>
        <button class="btn btn-outline" @click="copyLink" style="margin-bottom:10px;width:100%">
          {{ linkCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์' }}
        </button>
        <router-link to="/my" class="btn btn-secondary" style="width:100%">กลับหน้าเรียน</router-link>
      </div>
    </div>

    <!-- Desktop ไม่ใช่ Chrome → บอกให้ใช้ Chrome -->
    <div v-else-if="!browserOk && !isMobile" class="unsupported-overlay">
      <div class="unsupported-card">
        <div class="unsupported-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a7 7 0 016.32 4H12a3 3 0 00-2.83 4H6.34A7 7 0 0112 5zM5 12c0-.94.2-1.83.55-2.64l3.83 6.64A7.001 7.001 0 015 12zm7 7c-.34 0-.67-.03-1-.08l3.5-6.06A2.99 2.99 0 0015 12c0-.49-.12-.95-.32-1.36h4.27A7 7 0 0112 19z"/></svg>
        </div>
        <h2>กรุณาใช้ Google Chrome เพื่อดูวีดีโอ</h2>
        <p>ระบบรองรับเฉพาะ Google Chrome บน Desktop (Windows / macOS / Linux)<br>กรุณาเปิดลิงก์นี้ใน Chrome เพื่อดูวีดีโอ</p>
        <button class="btn btn-outline" @click="copyLink" style="margin-bottom:10px;width:100%">
          {{ linkCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์' }}
        </button>
        <a href="https://www.google.com/chrome/" target="_blank" class="btn btn-primary" style="display:block;text-align:center;text-decoration:none;margin-bottom:10px;width:100%">ดาวน์โหลด Chrome</a>
        <router-link to="/my" class="btn btn-secondary" style="width:100%">กลับหน้าเรียน</router-link>
      </div>
    </div>

    <!-- Main layout -->
    <template v-else>
      <!-- Top bar -->
      <header class="w-topbar">
        <router-link to="/my" class="w-back" title="กลับ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
        </router-link>

        <div class="w-topbar-info">
          <span class="w-section-name">{{ liveTitle }}</span>
        </div>

        <!-- ปุ่ม PDF ใน header -->
        <button v-if="livePdfEnabled" class="header-pdf-btn" @click="showPdfConsent = true" :disabled="pdfDownloading">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd"/><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"/></svg>
          <span class="header-pdf-text">{{ pdfDownloading ? 'โหลด...' : 'เอกสาร' }}</span>
        </button>

        <button class="header-qa-btn" @click="showQaPanel = !showQaPanel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd"/></svg>
          <span class="header-qa-text">Q&A</span>
          <span v-if="qaQuestions.length" class="header-qa-count">{{ qaQuestions.length }}</span>
        </button>

        <span class="live-badge">
          <span class="live-dot"></span>
          LIVE
        </span>
      </header>

      <!-- Content area -->
      <div class="w-layout">
        <main class="w-main">
          <!-- Loading -->
          <div v-if="liveStatus === 'loading'" class="w-player-area">
            <div class="w-player-box">
              <div class="skeleton" style="width:100%;height:100%;position:absolute;inset:0"></div>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="liveStatus === 'error'" class="w-player-area">
            <div class="w-player-box">
              <div class="player-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
                <p>{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Waiting -->
          <div v-else-if="liveStatus === 'waiting'" class="w-player-area" @contextmenu.prevent>
            <div class="w-player-box">
              <div class="waiting-overlay">
                <div class="waiting-label">ไลฟ์จะเริ่มในอีก</div>
                <div class="countdown-time">{{ formatCountdown(startsIn) }}</div>
                <div class="waiting-title">{{ liveTitle }}</div>
                <!-- ปุ่ม PDF เด่นกลางจอ ตอน countdown -->
                <button v-if="livePdfEnabled" class="waiting-pdf-btn" @click="showPdfConsent = true" :disabled="pdfDownloading">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clip-rule="evenodd"/><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"/></svg>
                  {{ pdfDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลดเอกสารการเรียน' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Connecting — กำลังเชื่อมต่อสัญญาณ -->
          <div v-else-if="liveStatus === 'connecting'" class="w-player-area" @contextmenu.prevent>
            <div class="w-player-box">
              <div class="connecting-overlay">
                <div class="connecting-spinner"></div>
                <div class="connecting-text">กำลังเชื่อมต่อสัญญาณถ่ายทอดสด...</div>
                <div class="connecting-sub">{{ liveTitle }}</div>
              </div>
            </div>
          </div>

          <!-- Live -->
          <div v-else-if="liveStatus === 'live'" class="w-player-area" @contextmenu.prevent>
            <div class="w-player-box" :class="{ 'is-fullscreen': isFullscreen }">
              <!-- Replaced overlay -->
              <div v-if="replaced" class="replaced-overlay">
                <div class="replaced-card">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="color:#c084fc;margin-bottom:12px"><path fill-rule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z" clip-rule="evenodd"/></svg>
                  <p style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">มี tab อื่นกำลังเปิดวีดีโออยู่</p>
                  <p style="font-size:13px;color:#c4b5fd;margin-bottom:14px">ดูได้ทีละ 1 หน้าต่างเท่านั้น</p>
                  <div v-if="activeTabInfo" style="background:rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;margin-bottom:14px;text-align:left;">
                    <p style="font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Tab ที่กำลังดูอยู่</p>
                    <p style="font-size:13px;color:#fff;font-weight:600;">{{ activeTabInfo.videoTitle || 'ไม่ทราบ' }}</p>
                    <p style="font-size:11px;color:#94a3b8;margin-top:4px;">{{ activeTabInfo.os || '?' }} · {{ activeTabInfo.browser || '?' }}</p>
                  </div>
                  <button @click="_reclaimTab" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:16px">กลับมาดูที่นี่</button>
                  <p style="font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:8px">กลับหน้าเรียนอัตโนมัติใน {{ replacedCountdown }} วินาที</p>
                  <router-link to="/my" style="color:#a78bfa;font-size:13px;text-decoration:underline;">กลับหน้าเรียนเลย</router-link>
                </div>
              </div>

              <iframe
                v-if="embedUrl && !replaced"
                ref="videoIframe"
                :src="embedUrl"
                loading="lazy"
                referrerpolicy="origin"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture 'none'"
                disableremoteplayback
                disablepictureinpicture
                class="live-iframe"
                :class="{ 'iframe-ready': liveReady }"
              ></iframe>

              <!-- Watermark layer -->
              <div v-if="watermarkText" class="wm-overlay">
                <div v-if="wmCurrentStyle === 'grid'" class="wm-grid">
                  <span v-for="i in 40" :key="i" class="wm-text" :style="{ fontSize: wmCurrentSize + 'px' }">{{ wmLine }}</span>
                </div>
                <div v-else class="wm-center" :style="{ fontSize: wmCurrentSize + 'px' }">
                  <span v-for="(line, idx) in wmParts" :key="idx">{{ line }}</span>
                </div>
              </div>

              <!-- บัง iframe จนกว่า VDO เล่นจริงครั้งแรก -->
              <div v-if="!liveReady && !needUnmute && !countdownActive" class="play-prompt-overlay">
                <div class="connecting-spinner"></div>
                <div class="connecting-text" style="margin-top:16px">กำลังเชื่อมต่อสัญญาณ...</div>
              </div>
              <!-- ⭐ countdown 3-2-1 หลังกดรับสัญญาณ (บัง iframe ระหว่าง Bunny ซ้อน UI) -->
              <div v-if="countdownActive" class="countdown-overlay">
                <div class="countdown-card">
                  <div class="countdown-live-badge">
                    <span class="signal-live-dot"></span>
                    LIVE
                  </div>
                  <div class="countdown-number">{{ countdownNumber }}</div>
                  <div class="countdown-label">กำลังเชื่อมต่อสัญญาณ...</div>
                </div>
              </div>
              <!-- ⭐ ปุ่มกดรับสัญญาณ — บังคับกดทุกครั้ง (player_ready / tab_visible) -->
              <div v-if="needUnmute && !countdownActive" class="play-prompt-overlay" @click="userUnmute">
                <div class="signal-prompt-card">
                  <div class="signal-live-badge">
                    <span class="signal-live-dot"></span>
                    LIVE
                  </div>
                  <div class="signal-play-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div class="signal-prompt-text">
                    <div class="signal-prompt-main">รับสัญญาณถ่ายทอดสด</div>
                    <div class="signal-prompt-sub">{{ liveTitle }}</div>
                  </div>
                </div>
              </div>

              <!-- ปิดแถบ controls Bunny แค่ด้านล่าง — บัง progress bar + play/seek/volume สนิท
                   มีข้อความ "ระบบถ่ายทอดสด MedNinja" เพื่อให้ดูเป็น brand bar (เนียน + concept) -->
              <div class="controls-cover-bottom">
                <span class="live-broadcast-dot"></span>
                <span class="live-broadcast-text">ระบบถ่ายทอดสด MedNinja</span>
              </div>

              <!-- Custom fullscreen button -->
              <button class="wm-fs-btn" @click="toggleFullscreen" :title="isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'">
                <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              </button>
            </div>
          </div>

          <!-- Ended -->
          <!-- Idle — เข้ามาใหม่ ยังไม่มีตาราง -->
          <div v-else-if="liveStatus === 'idle'" class="w-player-area" @contextmenu.prevent>
            <div class="w-player-box">
              <div class="ended-overlay">
                <div class="ended-icon" style="font-size:42px;">📡</div>
                <div class="ended-title">ยังไม่มีตารางไลฟ์</div>
                <div class="ended-sub">ระบบตรวจสอบอัตโนมัติทุก 30 วินาที<br>เมื่อมีตารางใหม่จะเข้าได้ทันที</div>
                <router-link to="/my" class="ended-btn" style="margin-top:20px;">กลับหน้าเรียน</router-link>
              </div>
            </div>
          </div>

        </main>
      </div>
    </template>

    <!-- Q&A FAB Button (mobile-friendly) -->
    <button v-if="!showQaPanel && currentLiveId" class="qa-fab" @click="showQaPanel = true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd"/></svg>
      <span v-if="qaQuestions.length" class="qa-fab-count">{{ qaQuestions.length }}</span>
    </button>

    <!-- Q&A Panel (drawer) -->
    <div v-if="showQaPanel" class="qa-overlay" @click.self="showQaPanel = false">
      <div class="qa-panel">
        <div class="qa-header">
          <h3>ฝากคำถาม</h3>
          <span class="qa-count">{{ qaQuestions.length }} คำถาม</span>
          <button class="qa-close" @click="showQaPanel = false">&times;</button>
        </div>

        <div class="qa-list" ref="qaList">
          <div v-if="!qaQuestions.length" class="qa-empty">
            <p>ยังไม่มีคำถาม</p>
            <p style="font-size:12px;color:#94a3b8;">พิมพ์คำถามด้านล่างได้เลย</p>
          </div>
          <div v-for="q in qaQuestions" :key="q._id" class="qa-item" :class="{ 'qa-own': q.isOwn, 'qa-answered': !!q.answer }">
            <div class="qa-item-head">
              <span class="qa-time" v-if="q.videoTimeSec != null">{{ formatQaTime(q.videoTimeSec) }}</span>
              <span class="qa-time qa-after" v-else>หลังจบไลฟ์</span>
              <span v-if="q.isOwn" class="qa-own-badge">คำถามของฉัน</span>
            </div>
            <div class="qa-question">{{ q.question }}</div>
            <div v-if="q.answer" class="qa-answer">
              <span class="qa-answer-label">ตอบ:</span> {{ q.answer }}
            </div>
            <div v-else class="qa-waiting">รอคำตอบ</div>
          </div>
        </div>

        <div class="qa-input-wrap">
          <input
            v-model="qaInput"
            class="qa-input"
            placeholder="พิมพ์คำถาม..."
            @keydown.enter="submitQuestion"
            :disabled="qaSending"
            maxlength="500"
          />
          <button class="qa-send" @click="submitQuestion" :disabled="!qaInput.trim() || qaSending">
            {{ qaSending ? '...' : 'ส่ง' }}
          </button>
        </div>
      </div>
    </div>

    <!-- PDF Consent Modal -->
    <div v-if="showPdfConsent" class="modal-overlay" @click.self="!pdfDownloading && (showPdfConsent = false)">
      <div class="pdf-consent-modal">
        <h3>ข้อตกลงการดาวน์โหลดเอกสาร</h3>
        <div class="consent-body">
          <p>เอกสารฉบับนี้จัดทำขึ้นเฉพาะสำหรับ <strong>{{ userName }}</strong></p>
          <p style="font-size:12px;color:#cbd5e1;margin:8px 0">เอกสารนี้ถูกฝังระบบป้องกันขั้นสูงเพื่อระบุตัวตนผู้ดาวน์โหลด ทั้งแบบที่มองเห็นและมองไม่เห็น</p>

          <!-- เลือกไฟล์ PDF ถ้ามีหลายไฟล์ -->
          <div v-if="pdfFiles.length > 1 && !pdfDownloading" class="pdf-file-select">
            <p style="font-weight:600;margin:8px 0 6px;font-size:13px">เลือกเอกสาร:</p>
            <div v-for="(pf, i) in pdfFiles" :key="i" class="pdf-file-option" :class="{ selected: selectedPdfIdx === i }" @click="selectedPdfIdx = i">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" clip-rule="evenodd"/></svg>
              <span>{{ pf.name }}</span>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="pdfDownloading" class="pdf-progress-box">
            <div class="pdf-progress-top">
              <div class="pdf-progress-spinner"></div>
              <span class="pdf-progress-text">{{ pdfProgress }}</span>
              <span class="pdf-progress-pct">{{ pdfPercent }}%</span>
            </div>
            <div class="pdf-progress-bar-wrap">
              <div class="pdf-progress-bar-fill" :style="{ width: pdfPercent + '%' }"></div>
            </div>
            <div v-if="pdfStep === 'downloading'" class="pdf-progress-hint">เกือบเสร็จแล้ว...</div>
          </div>

          <div v-if="!pdfDownloading" class="consent-warn">
            <strong>กรุณาใช้เอกสารเพื่อการศึกษาส่วนตัวเท่านั้น:</strong>
            <ul style="margin:6px 0 0 0;padding-left:18px">
              <li>ไม่ถ่ายเอกสาร สแกน หรือ screenshot เพื่อส่งต่อ</li>
              <li>ไม่โพสต์ลง Facebook, LINE, หรือกลุ่มใดๆ</li>
              <li>ไม่ส่งต่อให้ผู้อื่น</li>
            </ul>
          </div>
          <div v-if="!pdfDownloading" style="background:rgba(100,116,139,0.15);border:1px solid rgba(100,116,139,0.3);border-radius:8px;padding:10px;margin-top:8px;font-size:12px">
            เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537 ซึ่งมีทั้งโทษทางแพ่งและอาญา<br>
            <strong>บริษัท เมดนินจา จำกัด</strong> สงวนสิทธิ์ในการดำเนินการตามกฎหมายหากพบการเผยแพร่โดยไม่ได้รับอนุญาต
          </div>
        </div>
        <div class="consent-actions">
          <button class="btn-consent-cancel" @click="showPdfConsent = false" :disabled="pdfDownloading">ยกเลิก</button>
          <button class="btn-consent-ok" @click="downloadPdf()" :disabled="pdfDownloading">
            {{ pdfDownloading ? pdfProgress || 'กำลังดาวน์โหลด...' : 'ยอมรับเงื่อนไขและดาวน์โหลด' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { WS_URL } from '../utils/shadowSocket'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { checkBrowserSupport, getDeviceInfo, isExceptionPath } from '../utils/browserCheck'
import { isIOS as detectIOS } from '../utils/deviceDetect'
import { getDeviceContext, sendLog, watchDevTools } from '../services/clientLogger'
import { getVersion as _getAppVersion } from '../services/versionCheck'

export default {
  name: 'WatchLive',
  setup() {
    const authStore = useAuthStore()
    const browserCheck = checkBrowserSupport()
    return {
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
      liveStatus: 'loading', // loading, waiting, connecting, live, ended, cancelled, error
      cancelReason: '',
      liveDrmMode: '',
      liveTitle: '',
      embedUrl: '',
      startsIn: 0,
      error: '',
      livePdfEnabled: false,
      liveBunnyVideoId: '',
      pdfFiles: [],
      pdfJobId: null,
      pdfProgress: '',
      pdfPercent: 0,
      pdfStep: '',
      selectedPdfIdx: 0,
      wmConfig: null,
      zoomDetected: false,
      isFullscreen: false,
      tabHidden: false,
      isPlaying: false,
      playerReady: false,
      needUnmute: false,
      liveReady: false, // true เมื่อ VDO เล่นจริง → เอา overlay ออก
      tabId: crypto.randomUUID(),
      replaced: false,
      activeTabInfo: null,
      replacedCountdown: 60,
      otherTabCount: 0,
      _wmTick: 0,
      _wmWidth: window.innerWidth,
      linkCopied: false,
      showPdfConsent: false,
      pdfDownloading: false,
      currentLiveId: null,
      showQaPanel: false,
      qaQuestions: [],
      qaInput: '',
      qaSending: false,
      isStuck: false,
      // ⭐ countdown 3-2-1 หลังกดรับสัญญาณ ก่อนเปิดให้เห็น VDO
      countdownActive: false,
      countdownNumber: 3
    }
  },
  computed: {
    browserOk() {
      // LINE in-app browser → block เสมอ (เล่นวีดีโอไม่ได้ ต้องเปิดข้างนอก)
      const ua = navigator.userAgent || ''
      if (/Line\/|FBAN|FBAV|Instagram/i.test(ua)) return false
      if (isExceptionPath(this.$route.path)) return true
      return this.browserSupported
    },
    userName() {
      const u = this.authStore?.user
      if (!u) return ''
      if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`
      return u.name || ''
    },
    wmModeKey() {
      // eslint-disable-next-line no-unused-expressions
      this._wmTick
      const mobile = this.isMobile
      const portrait = window.innerHeight > window.innerWidth
      const full = this.isFullscreen
      const device = mobile ? 'Mobile' : 'Desktop'
      const orient = portrait ? 'Portrait' : 'Landscape'
      const fs = full ? 'Full' : ''
      return device.toLowerCase() + orient + fs
    },
    wmCurrentStyle() {
      if (!this.wmConfig) return this.isMobile ? 'center' : 'grid'
      const style = this.wmConfig[this.wmModeKey]?.style || 'grid'
      // eslint-disable-next-line no-unused-expressions
      this._wmTick
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
      return Math.max(scaled, basePx)
    },
    watermarkText() {
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
    }
  },
  created() {
    // Zoom check
    if (window.outerWidth > 0 && window.innerWidth > 0) {
      const zoomRatio = window.outerWidth / window.innerWidth
      if (zoomRatio < 0.97 || zoomRatio > 1.03) {
        alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
        this.$router.push('/')
        return
      }
    }

    this._diagLog('session_start', 'WatchLive component created', { detail: `route=${this.$route.path} mobile=${this.isMobile}` })
    this.loadLive()
    this._loadWmConfig()

    // Socket.IO + anti-share
    this._initSocket()

    // DevTools detection
    this._cleanupDevTools = watchDevTools(() => {
      if (this._socket?.connected) this._socket.emit('devtools')
      sendLog('devtools', 'เปิด DevTools (F12/Ctrl+Shift+I)', {
        liveId: this.currentLiveId || this.$route.params.id, videoTitle: this.liveTitle
      })
    })

    // HTTP Heartbeat fallback
    this._sendHeartbeat()
    this._heartbeatInterval = setInterval(() => {
      if (!this._socket?.connected) this._sendHeartbeat()
    }, 10000)
    this._onBeforeUnload = () => { this._beaconClear() }
    window.addEventListener('beforeunload', this._onBeforeUnload)
  },
  mounted() {
    // Fullscreen detection
    this._onFsChange = () => {
      this.isFullscreen = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', this._onFsChange)

    // Resize + zoom detection
    this._wmBaseDpr = window.devicePixelRatio || 1
    this._zoomBaseOuterW = window.outerWidth
    this._zoomBaseInnerW = window.innerWidth
    this._onWmResize = () => {
      this._wmTick++
      this._wmWidth = window.innerWidth
    }
    window.addEventListener('resize', this._onWmResize)

    // Periodic zoom check
    this._zoomCheckInterval = setInterval(() => {
      const curOuterW = window.outerWidth
      const curInnerW = window.innerWidth
      if (Math.abs(curOuterW - this._zoomBaseOuterW) > 10) {
        this._zoomBaseOuterW = curOuterW
        this._zoomBaseInnerW = curInnerW
        this._wmBaseDpr = window.devicePixelRatio || 1
        return
      }
      if (this._zoomBaseInnerW > 0) {
        const ratio = curInnerW / this._zoomBaseInnerW
        if (ratio < 0.97 || ratio > 1.03) {
          alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
          this.$router.push('/')
          return
        }
      }
      const dprRatio = (window.devicePixelRatio || 1) / this._wmBaseDpr
      if (dprRatio < 0.95 || dprRatio > 1.05) {
        alert('ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่')
        this.$router.push('/')
      }
    }, 2000)

    // Block scroll + zoom
    this._onWheel = (e) => {
      e.preventDefault()
    }
    document.addEventListener('wheel', this._onWheel, { passive: false })

    // Block wheel/zoom on player-box
    this.$nextTick(() => {
      const box = this.$el?.querySelector('.w-player-box')
      if (box && !box._wheelProtected) {
        box._wheelProtected = true
        box.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
        box.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault()
        })
      }
    })

    // Block DevTools + zoom + PrintScreen
    this._onKeydown = (e) => {
      if (e.ctrlKey && ['+', '-', '=', '0'].includes(e.key)) { e.preventDefault(); return }
      if (e.key === 'F12') { e.preventDefault(); return }
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) { e.preventDefault(); return }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return }
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); return }
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); return }
    }
    document.addEventListener('keydown', this._onKeydown)

    // Block PrintScreen
    this._onKeyup = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('').catch(() => {})
      }
    }
    document.addEventListener('keyup', this._onKeyup)

    // Visibility API — กลับมา visible = re-fetch offset เหมือนรายการทีวี
    this._onVisChange = () => {
      if (document.hidden) {
        this.tabHidden = true
        this._diagLog('tab_hidden', 'tab hidden')
      } else {
        this.tabHidden = false
        this._visibleSince = Date.now()
        this._lastMoveTime = Date.now()
        // ⭐ บังคับ user กดรับสัญญาณใหม่ทุกครั้งที่กลับ tab
        // เหตุผล: ห้าม Bunny player โผล่ระหว่างกลับมา (autoplay block / buffer race)
        if (this.playerReady && !this.replaced) {
          this.liveReady = false
          this.needUnmute = true
          this._timeMoveCount = 0          // reset timeupdate counter
          this._waitingUserUnmute = true   // ⭐ ห้าม timeupdate auto-set liveReady ก่อนกดปุ่ม
          // pause iframe ตอนนี้ จะได้ไม่เล่นเสียงค้าง
          this._pauseVideo()
        }
        this._diagLog('tab_visible', 'tab visible → บังคับกดรับสัญญาณใหม่')
        // Re-fetch offset ใหม่ — ทุกครั้งที่กลับมาดู ต้องเริ่มจากเวลาปัจจุบัน
        if (!this.replaced && this.liveStatus === 'live') {
          this.loadLive()
        }
        if (this._socket && !this._socket.connected && !this.replaced) {
          this._socket.connect()
        }
        if (this._socket?.connected && !this.replaced) {
          this._emitWatchStart()
        }
      }
    }
    document.addEventListener('visibilitychange', this._onVisChange)

    this.devtoolsOpen = false
    this._devtoolsCheck = null

    // Block drag
    this._onDragStart = (e) => e.preventDefault()
    document.addEventListener('dragstart', this._onDragStart)

    // Lock body scroll + zoom
    this._prevOverflow = document.body.style.overflow
    this._prevHtmlOverflow = document.documentElement.style.overflow
    this._prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // Touch scroll/zoom prevention
    this._onTouchStart = (e) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    this._onTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault()
      if (!e.target.closest('iframe')) e.preventDefault()
    }
    this._onGesture = (e) => e.preventDefault()

    document.addEventListener('touchstart', this._onTouchStart, { passive: false })
    document.addEventListener('touchmove', this._onTouchMove, { passive: false })
    document.addEventListener('gesturestart', this._onGesture, { passive: false })
    document.addEventListener('gesturechange', this._onGesture, { passive: false })
    document.addEventListener('gestureend', this._onGesture, { passive: false })

    // Load Bunny player.js API
    this._loadPlayerJs()
  },
  beforeUnmount() {
    if (this._qaPoll) clearInterval(this._qaPoll)
    if (this._safetyTimer) clearTimeout(this._safetyTimer)
    if (this._initRetryTimers) { this._initRetryTimers.forEach(t => clearTimeout(t)); this._initRetryTimers = [] }
    if (this._stuckOverlayTimer) clearTimeout(this._stuckOverlayTimer)
    if (this._playPendingTimer) clearTimeout(this._playPendingTimer)
    document.removeEventListener('fullscreenchange', this._onFsChange)
    if (this._onWmResize) window.removeEventListener('resize', this._onWmResize)
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
    if (this._retryInterval) clearInterval(this._retryInterval)
    if (this._countdownInterval) clearInterval(this._countdownInterval)
    if (this._countdownTimer) clearInterval(this._countdownTimer)
    if (this._connectingTimer) clearInterval(this._connectingTimer)
    if (this._driftInterval) clearInterval(this._driftInterval)
    if (this._stuckCheckInterval) clearInterval(this._stuckCheckInterval)
    if (this._diagHeartbeat) clearInterval(this._diagHeartbeat)
    if (this._countdownStartTimer) clearInterval(this._countdownStartTimer)
    // ปล่อย wake lock
    if (this._wakeLock) { try { this._wakeLock.release() } catch {} this._wakeLock = null }
    // Socket.IO disconnect + HTTP fallback cleanup
    if (this._socketStateInterval) clearInterval(this._socketStateInterval)
    if (this._socket) { this._socket.disconnect(); this._socket = null }
    if (this._onBeforeUnload) window.removeEventListener('beforeunload', this._onBeforeUnload)
    this._beaconClear()
    this._clearPollTimer()
    this._bunnyPlayer = null
    this.playerReady = false
    this.liveReady = false
  },
  watch: {
    embedUrl(url) {
      if (url) {
        this._bunnyPlayer = null
        this.playerReady = false
        this.liveReady = false
        this.needUnmute = false
        this._timeMoveCount = 0
        this._currentTime = 0
        this._diagLog('embed_url_set', 'embedUrl ถูก set → เริ่ม init player', { detail: url.slice(0, 200) })
        // Clear retry timers เก่า ก่อนเริ่มใหม่
        if (this._initRetryTimers) this._initRetryTimers.forEach(t => clearTimeout(t))
        if (this._stuckOverlayTimer) clearTimeout(this._stuckOverlayTimer)
        this._initRetryTimers = []

        this.$nextTick(() => {
          const iframe = this.$refs.videoIframe
          if (iframe) {
            iframe.addEventListener('load', () => {
              this._initRetryTimers.push(setTimeout(() => this._initPlayer(), 500))
            }, { once: true })
            // Retry หลายรอบ — เผื่อ playerjs script โหลดช้า/iframe ยังไม่พร้อม
            this._initRetryTimers.push(setTimeout(() => { if (!this.playerReady) this._initPlayer() }, 1500))
            this._initRetryTimers.push(setTimeout(() => { if (!this.playerReady) this._initPlayer() }, 3500))
            this._initRetryTimers.push(setTimeout(() => { if (!this.playerReady) this._initPlayer() }, 6500))
            this._initRetryTimers.push(setTimeout(() => { if (!this.playerReady) this._initPlayer() }, 10000))

            // Init failed safety 20 วิ
            this._stuckOverlayTimer = setTimeout(() => {
              if (this.liveReady || this.playerReady || this.replaced) return
              this._diagLog('init_failed', 'init player ไม่สำเร็จใน 20s → log + retry', { detail: `playerReady=${this.playerReady} bunnyPlayer=${!!this._bunnyPlayer}` })
              if (this._socket?.connected) {
                this._socket.emit('video:error', { error: 'live overlay stuck — playerjs not ready in 20s' })
              }
              // ลอง init อีกครั้ง — เผื่อ playerjs เพิ่ง load ทัน
              this._initInProgress = false
              this._initPlayer()
            }, 20000)
          }
        })
      }
    }
  },
  methods: {
    formatNid(id) {
      if (!id) return ''
      const d = id.replace(/\D/g, '')
      if (d.length !== 13) return id
      return `${d[0]}-${d.slice(1,5)}-${d.slice(5,10)}-${d.slice(10,12)}-${d[12]}`
    },
    formatCountdown(ms) {
      if (ms <= 0) return '00:00:00'
      const totalSec = Math.floor(ms / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    },
    openInBrowser() {
      const url = window.location.href
      if (detectIOS()) {
        const chromeUrl = url.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://')
        window.location.href = chromeUrl
      } else {
        const stripped = url.replace(/^https?:\/\//, '')
        window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`
      }
    },
    copyLink() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.linkCopied = true
        setTimeout(() => { this.linkCopied = false }, 2000)
      }).catch(() => {
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
    async loadLive() {
      try {
        let res
        if (this.$route.params.packageId) {
          // เข้าห้องจาก packageId
          res = await api.get(`/my/live/room/${this.$route.params.packageId}`)
          // ตารางเปลี่ยน → kick ให้เข้าใหม่ (content/เอกสารอาจต่างกัน)
          if (res.sessionId && this.currentLiveId && res.sessionId !== this.currentLiveId) {
            this.$router.push('/my')
            return
          }
          if (res.sessionId) this.currentLiveId = res.sessionId
          if (res.status === 'no_schedule') {
            // ไม่มีตาราง แต่ยังอยู่ในห้องได้ (โหลดเอกสาร)
            this.liveTitle = res.title || 'ห้องเรียนสด'
            this.liveStatus = 'idle'
            this.livePdfEnabled = false
            this._startPollTimer()
            return
          }
        } else if (this.$route.params.id === 'waiting') {
          // fallback: ดึง current live ของ user
          const currentRes = await api.get('/my/live/current')
          const sessions = currentRes.sessions || []
          const activeLive = sessions.find(s => s.status === 'live') || sessions.find(s => s.status === 'waiting') || sessions[0]
          if (activeLive) {
            this.currentLiveId = activeLive._id
            res = await api.get(`/my/live/${activeLive._id}`)
          } else {
            this.liveTitle = 'ห้องเรียนสด'
            this.liveStatus = 'idle'
            this._startPollTimer()
            return
          }
        } else {
          res = await api.get(`/my/live/${this.$route.params.id}`)
        }
        this.liveTitle = res.title || ''
        this.liveStatus = res.status
        this._clearPollTimer()
        if (res.status === 'cancelled') {
          // admin ยกเลิก → kick ทุกกรณี
          this.$router.push('/my')
          return
        }
        if (res.status === 'live' && res.embedUrl) {
          this._wasLive = true
          this._wasInRoom = true
          // ⭐ เก็บ offsetSec + serverTime ไว้ใช้คำนวณ offset จริงตอน user กดปุ่ม
          // (ถ้า user รอนาน → ไลฟ์เดินไปแล้ว → seek ไปจุดที่จริง)
          if (res.offsetSec != null) this._liveOffsetSec = res.offsetSec
          if (res.serverTime) this._liveServerTime = res.serverTime
          this._liveFetchedAt = Date.now()
          // กัน reset player ถ้า base URL เดิม (loadLive ถูกเรียกซ้ำ เช่น ตอนกลับมาจาก hidden)
          // ถ้าต่างเฉพาะ ?t= → skip ไม่ reload iframe (เหตุผล: Safari ฆ่า playerjs ถ้า iframe reload เร็วเกินไป)
          const newBase = (res.embedUrl || '').split('?')[0]
          const oldBase = (this.embedUrl || '').split('?')[0]
          // ⭐ เปลี่ยน: skip แม้ bunnyPlayer ยังไม่ ready ก็ได้ — ห้าม reload iframe เด็ดขาด
          // ถ้า iframe เดิมยังโหลดอยู่ ปล่อยให้โหลดต่อ — ดีกว่า reload ใหม่จาก 0
          if (this.embedUrl && newBase === oldBase) {
            this._diagLog('embed_url_skip', 'loadLive: base URL เดิม → ไม่ reset embedUrl', { detail: `offsetSec=${res.offsetSec} bunnyReady=${!!this._bunnyPlayer}` })
            // ถ้า player ready แล้ว → sync offset
            if (this._bunnyPlayer && res.offsetSec != null) {
              try { this._bunnyPlayer.getCurrentTime((t) => {
                if (Math.abs(t - res.offsetSec) > 5) {
                  try { this._bunnyPlayer.setCurrentTime(res.offsetSec) } catch {}
                }
              }) } catch {}
            }
            // ถ้า player ยังไม่ ready → ไม่ทำอะไร ปล่อยให้ init ต่อ (อย่า reload iframe!)
          } else {
            this.embedUrl = res.embedUrl
          }
          this.liveDrmMode = res.drmMode || ''
          this.pdfFiles = res.pdfFiles || []
          this.livePdfEnabled = this.pdfFiles.length > 0
          this.liveBunnyVideoId = res.bunnyVideoId || ''
          // Safety timer — force kick เมื่อ video ควรจบ + 10 นาที buffer
          if (res.offsetSec != null && res.videoDurationSec) {
            const remainSec = res.videoDurationSec - res.offsetSec + 600 // +10 นาที buffer
            if (remainSec > 0 && !this._safetyTimer) {
              this._safetyTimer = setTimeout(() => {
                console.log('[Safety] force kick — video should have ended')
                this.$router.push('/my')
              }, remainSec * 1000)
            }
          }
        } else if (res.status === 'waiting') {
          this._wasInRoom = true
          this.startsIn = res.startsIn || 0
          this.pdfFiles = res.pdfFiles || []
          this.livePdfEnabled = this.pdfFiles.length > 0
          this.liveBunnyVideoId = res.bunnyVideoId || ''
          if (res.sessionId) this.currentLiveId = res.sessionId
          this._startCountdown()
          this._startPollTimer()
        } else if (res.status === 'ended') {
          // กำลังดูอยู่ → kick / เข้ามาใหม่ → idle
          if (this._wasLive) {
            this.$router.push('/my')
            return
          }
          this.liveTitle = res.title || this.liveTitle
          this.liveStatus = 'idle'
          this._startPollTimer()
        }
        // Q&A: load questions + join room
        if (this.$route.params.packageId) {
          this.loadQuestions()
          if (this._socket?.connected) {
            this._socket.emit('qa:join', { packageId: this.$route.params.packageId, sessionId: this.currentLiveId })
          }
        }
        this._hasLoaded = true
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
        this.liveStatus = 'error'
        // error ก็ poll รอ
        this._startPollTimer()
      }
    },
    _startPollTimer() {
      this._clearPollTimer()
      this._pollTimer = setInterval(() => this.loadLive(), 30000)
    },
    _clearPollTimer() {
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null }
    },
    _startCountdown() {
      if (this._countdownTimer) clearInterval(this._countdownTimer)
      this._countdownTimer = setInterval(() => {
        this.startsIn -= 1000
        if (this.startsIn <= 0) {
          clearInterval(this._countdownTimer)
          // แสดง "กำลังเชื่อมต่อสัญญาณ..." delay สุ่ม 3-10 วินาที แล้ว retry ทุก 5 วิ
          this.liveStatus = 'connecting'
          const delay = 3000 + Math.floor(Math.random() * 7000)
          setTimeout(() => this._connectingRetry(), delay)
        }
      }, 1000)
    },
    async _connectingRetry() {
      // retry จนได้ live (ไม่ค้าง)
      if (this._connectingTimer) clearInterval(this._connectingTimer)
      await this._tryConnect()
      // ถ้ายังไม่ live → poll ทุก 5 วิ
      if (this.liveStatus === 'connecting') {
        this._connectingTimer = setInterval(() => this._tryConnect(), 5000)
      }
    },
    async _tryConnect() {
      try {
        let res
        if (this.$route.params.packageId) {
          res = await api.get(`/my/live/room/${this.$route.params.packageId}`)
          if (res.sessionId) this.currentLiveId = res.sessionId
        } else {
          const id = this.currentLiveId || this.$route.params.id
          res = await api.get(`/my/live/${id}`)
        }
        if (res.status === 'live' && res.embedUrl) {
          // สำเร็จ! → ไปเล่น
          if (this._connectingTimer) { clearInterval(this._connectingTimer); this._connectingTimer = null }
          this.liveTitle = res.title || this.liveTitle
          this.embedUrl = res.embedUrl
          this.liveDrmMode = res.drmMode || ''
          this.pdfFiles = res.pdfFiles || []
          this.livePdfEnabled = this.pdfFiles.length > 0
          this.liveStatus = 'live'
        } else if (res.status === 'cancelled') {
          if (this._connectingTimer) { clearInterval(this._connectingTimer); this._connectingTimer = null }
          this.$router.push('/my')
        }
        // ถ้ายังไม่ live → ค้าง connecting ต่อ (timer จะ retry)
      } catch {
        // error → ค้าง connecting ต่อ
      }
    },
    async _sendHeartbeat() {
      try {
        const ctx = getDeviceContext()
        const isFirst = !this._heartbeatSent
        const data = await api.post('/my/heartbeat', {
          firstBeat: isFirst || undefined,
          oldTabId: window.name || undefined,
          liveId: this.currentLiveId || this.$route.params.id,
          videoTitle: this.liveTitle,
          tabId: this.tabId,
          os: ctx.os,
          browser: ctx.browser,
          currentTime: Math.round(this._currentTime || 0),
          videoDuration: 0,
          isPlaying: this.isPlaying,
          playerError: this._playerError || '',
          drmMode: this.liveDrmMode || ''
        })
        if (data.kicked) {
          clearInterval(this._heartbeatInterval)
          this.$router.push('/my')
          return
        }
        if (!data.replaced) {
          window.name = this.tabId
          this._heartbeatSent = true
        }
        if (data.replaced) {
          clearInterval(this._heartbeatInterval)
          this.replaced = true
          this.activeTabInfo = data.activeTab || null
          this._pauseVideo()
          if (!this._retryInterval) {
            this._retryInterval = setInterval(() => this._retryTab(), 3000)
          }
          if (!this._countdownInterval) {
            this.replacedCountdown = 60
            this._countdownInterval = setInterval(() => {
              this.replacedCountdown--
              if (this.replacedCountdown <= 0) {
                clearInterval(this._countdownInterval)
                clearInterval(this._retryInterval)
                this.$router.push('/my')
              }
            }, 1000)
          }
          sendLog('replaced', 'ถูกแทนที่โดย tab อื่น', {
            liveId: this.currentLiveId || this.$route.params.id,
            videoTitle: this.liveTitle
          })
        }
      } catch { /* ไม่ block ถ้า API error */ }
    },
    async _retryTab() {
      try {
        const ctx = getDeviceContext()
        const data = await api.post('/my/heartbeat', {
          liveId: this.currentLiveId || this.$route.params.id,
          videoTitle: this.liveTitle,
          tabId: this.tabId,
          os: ctx.os,
          browser: ctx.browser,
          drmMode: this.liveDrmMode || ''
        })
        if (!data.replaced) {
          this.replaced = false
          this.activeTabInfo = null
          this.replacedCountdown = 60
          clearInterval(this._retryInterval)
          clearInterval(this._countdownInterval)
          this._retryInterval = null
          this._countdownInterval = null
          this._heartbeatInterval = setInterval(() => this._sendHeartbeat(), 10000)
        } else {
          this.activeTabInfo = data.activeTab || null
        }
      } catch { /* ignore */ }
    },
    async _loadWmConfig() {
      try {
        const data = await api.get('/admin/watermark')
        this.wmConfig = data.config
        this.isDesktopModeInMobile = !this.isMobile && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      } catch { /* ใช้ค่า default */ }
    },
    _loadPlayerJs() {
      if (window.playerjs) { this._initPlayer(); return }
      if (document.querySelector('script[src*="playerjs"]')) {
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
      if (this.playerReady && this._bunnyPlayer) return // กัน init ซ้ำ
      if (this._initInProgress) return // กัน race ระหว่าง retry หลายตัว
      const iframe = this.$refs.videoIframe
      if (!iframe) return
      this._initInProgress = true
      const p = new window.playerjs.Player(iframe)
      // กันค้างถ้า ready ไม่ fire ภายใน 8 วิ → ปล่อย flag ให้ retry ตัวถัดไปลองใหม่
      const initFailTimer = setTimeout(() => {
        if (!this.playerReady) this._initInProgress = false
      }, 8000)
      p.on('ready', () => {
        clearTimeout(initFailTimer)
        this._initInProgress = false
        if (this.playerReady && this._bunnyPlayer) return // ของเก่า ready แล้ว ทิ้งตัวใหม่
        this._bunnyPlayer = p
        this.playerReady = true
        this.isPlaying = false
        this._playerError = ''
        this._diagLog('player_ready', 'playerjs ready → โชว์ปุ่มกดรับสัญญาณ')
        // ⭐ บังคับ user กดปุ่มก่อนเริ่มดู — ห้าม autoplay
        // เหตุผล: autoplay block ในหลาย browser ทำให้เห็น Bunny ปุ่มส้ม
        // user gesture = guaranteed play() + ไม่มีโอกาสเห็น UI Bunny
        this.needUnmute = true
        this._readyTime = this._currentTime || 0
        this._readyAt = Date.now()
        // ไม่เรียก p.play() เอง — ปล่อยให้ Bunny player จัดการ autoplay
        // ผ่าน URL params &autoplay=true&muted=true (รองรับทุก browser รวม Safari)
        p.on('play', () => {
          this.isPlaying = true
          // ⭐ ถ้ารอ user กดอยู่ (tab_visible) → pause Bunny ทันที + ห้าม reset needUnmute
          // เพราะ Bunny autoplay background fire play event → reset ปุ่ม → user งง
          if (this._waitingUserUnmute) {
            this._diagLog('play_event_blocked', 'play event ระหว่างรอ user → pause ทันที')
            try { p.pause() } catch {}
            return
          }
          // ห้าม set liveReady = true ที่นี่ — play event fire ตอน buffer ยังไม่เสร็จ → ปุ่มส้ม + controls โผล่
          // ให้ timeupdate เป็นคนยืนยันว่าเวลาเดินจริง แล้วค่อย set liveReady
          this.needUnmute = false
          this._resumeRetryCount = 0 // reset retry counter
          this._diagLog('play_event', 'playerjs play event fire')
          // clear error ค้าง — เล่นได้แล้วแสดงว่าไม่มีปัญหา
          if (this._playerError) {
            this._playerError = ''
            if (this._socket?.connected) this._socket.emit('video:error', { error: '' })
          }
          if (this._socket?.connected) this._socket.emit('video:play')
        })
        p.on('pause', () => {
          this.isPlaying = false
          if (this._socket?.connected) this._socket.emit('video:pause')
          // Auto-resume — live mode ห้าม pause (ยกเว้นถูก replaced/ถูก kick)
          if (this.replaced) return
          // ป้องกัน pause event flood (Safari ส่งติดกันหลายครั้งใน 1 วินาที → ทำ pause/play race)
          const now = Date.now()
          if (this._lastPauseTime && now - this._lastPauseTime < 1500) return // ignore pause ที่ห่างกัน <1.5s
          this._lastPauseTime = now
          // log แค่ pause ที่ไม่ใช่ flood เท่านั้น
          this._diagLog('pause_event', 'pause event fire', { detail: `retryCount=${this._resumeRetryCount || 0}` })
          if (!this._resumeRetryCount) this._resumeRetryCount = 0
          if (this._resumeRetryCount >= 5) {
            // retry 5 ครั้งแล้วยังไม่ได้ → หยุด log + ปล่อยให้ user คลิก player เอง
            // ⚠️ ไม่ set needUnmute แล้ว — user บอกปุ่มไม่ใช่ปัญหา
            // Safari จะเปิดเองหลัง user มี interaction (เลื่อน mouse / กดปุ่ม)
            if (this._resumeRetryCount === 5) {
              this._diagLog('pause_retry_exceeded', 'auto-resume เกิน 5 ครั้ง → หยุด retry รอ user interaction')
              if (this._socket?.connected) this._socket.emit('video:error', { error: 'auto-resume failed after 5 retries (likely Safari autoplay block)' })
            }
            this._resumeRetryCount++ // เพิ่มให้ผ่าน 5 จะได้ไม่ log อีก
            return
          }
          this._resumeRetryCount++
          // delay เพิ่มตาม retry count (300ms, 600ms, 1200ms, 2400ms, 4800ms)
          // ป้องกัน Safari play/pause race
          const delay = 300 * Math.pow(2, this._resumeRetryCount - 1)
          setTimeout(() => {
            if (this.replaced) return
            this._safePlay()
          }, delay)
        })
        p.on('ended', () => {
          this.isPlaying = false
          this._diagLog('video_ended', 'video ended event → kick')
          if (this._socket?.connected) this._socket.emit('video:ended')
          // ไลฟ์จบ → kick ทันที
          this.$router.push('/my')
        })
        p.on('timeupdate', (val) => {
          const t = val.seconds || val
          // ถ้า currentTime ขยับ > 0.3 วิ แสดงว่า video เล่นจริง
          if (this._currentTime && Math.abs(t - this._currentTime) > 0.3) {
            if (!this.isPlaying) this.isPlaying = true
            this._lastMoveTime = Date.now()
            if (this.isStuck) this.isStuck = false
            // ⭐ Clear error ค้างบน warroom — เวลาขยับ = VDO เล่นได้จริง ไม่ว่าจะมี error code ค้างหรือไม่
            // (Safari ไม่ fire play event หลัง error → error ค้าง warroom ถ้าไม่ clear ที่นี่)
            if (this._playerError || this._errorReported) {
              this._playerError = ''
              this._errorReported = false
              this._resumeRetryCount = 0
              if (this._socket?.connected) this._socket.emit('video:error', { error: '' })
            }
            // ต้องขยับติดต่อกัน 2 ครั้ง (เวลาเดินจริง ~1 วิ) ก่อน set liveReady → กัน Bunny ปุ่มส้มโผล่
            // ⭐ ถ้า _waitingUserUnmute = true (รอ user กดปุ่ม) ห้าม auto-set liveReady
            this._timeMoveCount = (this._timeMoveCount || 0) + 1
            if (!this.liveReady && !this._waitingUserUnmute && this._timeMoveCount >= 2) {
              this.liveReady = true
              this.needUnmute = false
              this._diagLog('live_ready', 'timeupdate ขยับครบ 2 ครั้ง → liveReady=true', { detail: `at currentTime=${Math.round(t)}` })
            }
          }
          this._currentTime = t
          // Socket.IO realtime state ทุก 3 วินาที
          const now = Date.now()
          if (!this._lastSocketState || now - this._lastSocketState > 3000) {
            this._lastSocketState = now
            if (this._socket?.connected) {
              const tuData = {
                currentTime: Math.round(this._currentTime || 0),
                duration: 0,
                isPlaying: this.isPlaying
              }
              this._socket.emit('video:state', tuData)
            }
          }
        })
        p.on('error', (e) => {
          this._playerError = typeof e === 'string' ? e : (e?.message || JSON.stringify(e) || 'unknown error')
          this._errorCount = (this._errorCount || 0) + 1
          this._diagLog('error', 'playerjs error event', { detail: this._playerError.slice(0, 500) })
          const errLower = this._playerError.toLowerCase()
          // code 5 = play/pause ชนกัน → swallow, 5 วิ เช็คว่าดูได้จริงไหม
          const isPlayInterrupted = errLower.includes('"code":5') || errLower.includes('code": 5') || errLower.includes('interrupted')
          if (isPlayInterrupted) {
            this._playerError = ''
            const snapTime = this._currentTime || 0
            setTimeout(() => {
              const nowTime = this._currentTime || 0
              if (nowTime > snapTime + 0.5) return // ดูได้จริง
              // ดูไม่ได้ → ลอง play + ส่ง error ถ้ายังไม่ได้
              this._safePlay()
              setTimeout(() => {
                const afterRetry = this._currentTime || 0
                if (afterRetry > nowTime + 0.5) return
                const errMsg = 'video not playing after play interrupted'
                if (this._socket?.connected) this._socket.emit('video:error', { error: errMsg })
                this._reportVideoError(errMsg)
                this.needUnmute = true // โชว์ปุ่มรับสัญญาณ
              }, 3000)
            }, 5000)
            return
          }
          // autoplay blocked จริง (Safari/browser policy) → โชว์ปุ่มกดเล่น
          const isAutoplayBlocked = errLower.includes('autoplay') || errLower.includes('play()') || errLower.includes('interact') || errLower.includes('not allowed') || errLower.includes('denied permission')
          if (isAutoplayBlocked) {
            this.needUnmute = true
            this._playerError = ''
            return
          }
          // error จริง → ส่ง socket + LINE
          if (this._socket?.connected) this._socket.emit('video:error', { error: this._playerError })
          this._reportVideoError(this._playerError)
        })
      })

      // Stuck detection — silent recovery เท่านั้น (ไม่บัง overlay, ไม่กระทบ UI)
      // จาก log Android: Bunny timeupdate fire ห่างกว่า 8 วิเป็นปกติ → 15 วิดีกว่า
      this._stuckCheckInterval = setInterval(() => {
        if (!this.liveReady || this.replaced || this.needUnmute) return
        if (this.tabHidden || document.hidden) {
          this._lastMoveTime = Date.now()
          return
        }
        // กลับมาจาก hidden ไม่ถึง 8 วิ → ให้ Bunny ส่ง timeupdate ก่อน
        if (this._visibleSince && Date.now() - this._visibleSince < 8000) return
        const last = this._lastMoveTime || 0
        // 15 วินาทีค้าง = silent retry play (Android Bunny timeupdate ห่างได้ถึง 10+ วิ)
        if (last && Date.now() - last > 15000) {
          if (!this._stuckRecoverAttempt) this._stuckRecoverAttempt = 0
          this._stuckRecoverAttempt++
          // ลอง play เงียบๆ — ไม่เปลี่ยน UI
          if (!this.replaced) this._safePlay()
          // log เฉพาะครั้งแรก + ทุก 30 วินาที เพื่อ debug ไม่ spam
          if (this._stuckRecoverAttempt === 1 || this._stuckRecoverAttempt % 15 === 0) {
            this._diagLog('stuck_silent', `timeupdate ค้าง ${Math.round((Date.now() - last)/1000)}s — silent recovery`, { detail: `attempt=${this._stuckRecoverAttempt} t=${Math.round(this._currentTime || 0)}` })
          }
        } else {
          this._stuckRecoverAttempt = 0
        }
      }, 2000)

      // Heartbeat log — ส่ง state ปัจจุบันทุก 15 วิ (สำหรับ debug timeline)
      this._diagHeartbeat = setInterval(() => {
        this._diagLog('heartbeat', `heartbeat`, { detail: `t=${Math.round(this._currentTime || 0)}s` })
      }, 15000)

      // Drift correction + status check every 30s
      this._driftInterval = setInterval(() => {
        const liveId = this.currentLiveId || this.$route.params.id
        const pkgId = this.$route.params.packageId
        // ใช้ packageId route ถ้าไม่มี liveId
        const apiUrl = liveId ? `/my/live/${liveId}` : `/my/live/room/${pkgId}`
        if (!apiUrl || apiUrl.includes('undefined')) return

        const checkStatus = (res) => {
          if (res.status === 'cancelled' || res.status === 'ended' || res.status === 'no_schedule') {
            this.$router.push('/my')
            return
          }
          // session เปลี่ยน
          if (res.sessionId && this.currentLiveId && res.sessionId !== this.currentLiveId) {
            this.$router.push('/my')
            return
          }
          // drift correction + safety timer recalc
          if (res.status === 'live' && res.offsetSec !== undefined) {
            // recalculate safety timer
            if (res.videoDurationSec && this._safetyTimer) {
              clearTimeout(this._safetyTimer)
              const remainSec = res.videoDurationSec - res.offsetSec + 600
              if (remainSec > 0) {
                this._safetyTimer = setTimeout(() => { this.$router.push('/my') }, remainSec * 1000)
              }
            }
            if (this._bunnyPlayer) {
              this._bunnyPlayer.getCurrentTime((t) => {
                // drift > 5 วิ → seek ไป offset ที่ถูกต้อง (ไม่ reload embed — เนียนกว่า)
                if (Math.abs(t - res.offsetSec) > 5) {
                  try { this._bunnyPlayer.setCurrentTime(res.offsetSec) } catch {}
                }
              })
            }
          }
        }

        api.get(apiUrl).then(checkStatus).catch(() => {})
      }, 30000)
    },
    _safePlay() {
      const p = this._bunnyPlayer
      if (!p || this._playPending) return
      this._playPending = true
      this._pauseAfterPlay = false
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
      if (this._playPending) {
        this._pauseAfterPlay = true
        return
      }
      try { p.pause() } catch {}
    },
    _reportVideoError(errorMsg) {
      if (this._errorReported) return
      this._errorReported = true
      const ctx = getDeviceContext()
      fetch('/api/diag/video-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMsg,
          videoTitle: this.liveTitle,
          sectionName: '',
          videoIndex: 0,
          userName: this.authStore?.user?.firstName ? `${this.authStore.user.firstName} ${this.authStore.user.lastName || ''}`.trim() : this.authStore?.user?.name || '',
          userEmail: this.authStore?.user?.email || '',
          ...ctx
        })
      }).catch(() => {})
    },
    _reclaimTab() {
      this.replaced = false
      if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null }
      this.activeTabInfo = null
      // Re-fetch offset ใหม่จาก server — เหมือนรายการทีวี เริ่มจากเวลาปัจจุบัน
      this.loadLive()
      this._initSocket()
      if (!this._socketStateInterval) {
        this._socketStateInterval = setInterval(() => {
          if (!this._socket?.connected) return
          const rd = {
            currentTime: Math.round(this._currentTime || 0),
            duration: 0,
            isPlaying: this.isPlaying
          }
          this._socket.emit('video:state', rd)
        }, 3000)
      }
    },
    _emitWatchStart() {
      if (!this._socket?.connected) return
      const ctx = getDeviceContext()
      const data = {
        liveId: this.currentLiveId || this.$route.params.id || '',
        livePackageId: this.$route.params.packageId || '',
        contentType: 'live',
        videoTitle: this.liveTitle,
        tabId: this.tabId,
        os: ctx.os,
        browser: ctx.browser,
        timezone: ctx.timezone,
        tzOffset: ctx.tzOffset,
        currentTime: Math.round(this._currentTime || 0),
        duration: 0,
        isPlaying: this.isPlaying,
        drmMode: this.liveDrmMode || ''
      }
      this._socket.emit('watch:start', data)
    },
    _initSocket() {
      const token = localStorage.getItem('token')
      if (!token) return

      this._socket = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'] })

      this._socket.on('disconnect', (reason) => {
        this._diagLog('ws_disconnect', 'socket disconnected', { detail: `reason=${reason}` })
      })

      this._socket.on('connect_error', (err) => {
        this._diagLog('ws_error', 'socket connect_error', { detail: err?.message || String(err) })
      })

      this._socket.on('connect', () => {
        this._diagLog('ws_connect', 'socket connected', { detail: `id=${this._socket.id}` })
        this._emitWatchStart()
        // Join Q&A room
        const pkgId = this.$route.params.packageId
        if (pkgId) {
          this._socket.emit('qa:join', { packageId: pkgId, sessionId: this.currentLiveId })
          this.loadQuestions()
        }
      })

      // Periodic state emit ทุก 3 วิ — ใช้ค่าจาก event (timeupdate/play/pause) ไม่ใช้ callback
      this._socketStateInterval = setInterval(() => {
        if (!this._socket?.connected) return
        const sd = {
          currentTime: Math.round(this._currentTime || 0),
          duration: 0,
          isPlaying: this.isPlaying
        }
        this._socket.emit('video:state', sd)
      }, 3000)

      // Anti-share: ถูกแทนที่โดยจอใหม่
      this._socket.on('replaced', (activeTab) => {
        this._diagLog('replaced', 'tab ถูกแทนที่โดย tab อื่น', { detail: `activeTab=${JSON.stringify(activeTab).slice(0,300)}` })
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval)
        if (this._socketStateInterval) { clearInterval(this._socketStateInterval); this._socketStateInterval = null }
        if (this._socket) { this._socket.disconnect(); this._socket = null }
        this.replaced = true
        this.activeTabInfo = activeTab || null
        this._pauseVideo()
        if (!this._countdownInterval) {
          this.replacedCountdown = 60
          this._countdownInterval = setInterval(() => {
            this.replacedCountdown--
            if (this.replacedCountdown <= 0) {
              clearInterval(this._countdownInterval)
              this.$router.push('/my')
            }
          }, 1000)
        }
        sendLog('replaced', 'ถูกแทนที่โดย tab อื่น (socket)', {
          liveId: this.currentLiveId || this.$route.params.id, videoTitle: this.liveTitle
        })
      })

      this._socket.on('unblocked', () => {
        this.replaced = false
        if (this._countdownInterval) { clearInterval(this._countdownInterval); this._countdownInterval = null }
        this._heartbeatInterval = setInterval(() => {
          if (!this._socket?.connected) this._sendHeartbeat()
        }, 10000)
      })

      this._socket.on('kicked', () => {
        this._diagLog('kicked', 'admin kicked')
        if (this._heartbeatInterval) clearInterval(this._heartbeatInterval)
        this.$router.push('/my')
      })

      // Admin เปลี่ยนตาราง/ยกเลิก/ลบ → kick ทันที
      this._socket.on('live:kick', () => {
        this._diagLog('live_kick', 'live session changed/cancelled → kick')
        this.$router.push('/my')
      })

      // Q&A real-time — เช็ค duplicate (จาก optimistic update ที่ใช้ tmp- prefix)
      this._socket.on('qa:new', (q) => {
        // ถ้ามี tmp- ที่ question text ตรงกัน → แทนที่ด้วย real data
        const tmpIdx = this.qaQuestions.findIndex(x => x._id?.startsWith('tmp-') && x.question === q.question)
        if (tmpIdx >= 0) {
          this.qaQuestions.splice(tmpIdx, 1, { ...q, isOwn: this.qaQuestions[tmpIdx].isOwn })
          return
        }
        if (!this.qaQuestions.find(x => x._id === q._id)) {
          this.qaQuestions.push(q)
          this.$nextTick(() => {
            const list = this.$refs.qaList
            if (list) list.scrollTop = list.scrollHeight
          })
        }
      })
      this._socket.on('qa:answered', ({ _id, answer, answeredAt }) => {
        const q = this.qaQuestions.find(x => x._id === _id)
        if (q) {
          q.answer = answer
          q.answeredAt = answeredAt
        }
      })
    },
    _beaconClear() {
      const token = localStorage.getItem('token')
      if (!token) return
      const base = (api.defaults?.baseURL || '/api').replace(/\/api$/, '')
      const url = base + '/api/beacon/heartbeat-clear'
      try { navigator.sendBeacon(url, new Blob([JSON.stringify({ token })], { type: 'application/json' })) } catch {}
    },
    _syncToLiveOffset() {
      // คำนวณ offset จริง ณ ตอนกดปุ่ม
      // ใช้ client clock วัด "เวลาที่ผ่านไปตั้งแต่ fetch" (relative time)
      // = ไม่กระทบจาก server/client clock drift (เพราะเทียบ delta บน client เดียวกัน)
      if (this._liveOffsetSec == null || !this._liveFetchedAt) return
      const elapsed = Math.max(0, (Date.now() - this._liveFetchedAt) / 1000)
      const target = Math.round(this._liveOffsetSec + elapsed)
      const currentT = Math.round(this._currentTime || 0)
      // ถ้าห่างจากเป้ามากกว่า 2 วินาที → seek
      if (Math.abs(target - currentT) > 2) {
        try {
          if (this._bunnyPlayer) this._bunnyPlayer.setCurrentTime(target)
          this._diagLog('sync_offset', 'seek ไปจุดที่จริงตอนกดปุ่ม', { detail: `from=${currentT} to=${target} elapsed=${Math.round(elapsed)}s` })
        } catch {}
      }
    },
    async _requestWakeLock() {
      // ⭐ ห้ามจอดับขณะดู live — เปิด Screen Wake Lock API
      // ขอ wake lock ต้องอยู่หลัง user gesture (click ปุ่มรับสัญญาณ)
      if (!('wakeLock' in navigator)) return
      try {
        if (this._wakeLock) return // มีอยู่แล้ว
        this._wakeLock = await navigator.wakeLock.request('screen')
        this._diagLog('wake_lock_acquired', 'หน้าจอจะไม่ดับขณะดู live')
        this._wakeLock.addEventListener('release', () => {
          this._diagLog('wake_lock_released', 'wake lock ถูกปล่อย')
          this._wakeLock = null
        })
      } catch (e) {
        this._diagLog('wake_lock_failed', 'wake lock fail', { detail: e?.message || String(e) })
      }
    },
    userUnmute() {
      // User คลิกปุ่ม → เริ่ม play() ทันที + countdown 3-2-1 บัง iframe ก่อนเปิด
      this._diagLog('user_unmute_click', 'user กดปุ่มรับสัญญาณ → start countdown')
      // ⭐ ขอ wake lock ทันที (ต้องอยู่ใน user gesture)
      this._requestWakeLock()
      this.needUnmute = false
      this._waitingUserUnmute = false  // ⭐ ปลด lock — ตอนนี้ timeupdate set liveReady ได้
      this._resumeRetryCount = 0
      // ⭐ เริ่ม countdown 3-2-1 บัง iframe ระหว่างที่ Bunny ซ้อน UI
      // เล่นไปก่อนล่วงหน้า (play()/unmute() ใน doPlay ด้านล่าง) แต่ยังไม่โชว์
      // ⭐ Sync offset ตามเวลาจริง — ถ้า user รอนานก่อนกด, seek ไปจุดที่จริง
      this._syncToLiveOffset()
      this.countdownActive = true
      this.countdownNumber = 3
      if (this._countdownStartTimer) clearInterval(this._countdownStartTimer)
      this._countdownStartTimer = setInterval(() => {
        this.countdownNumber -= 1
        if (this.countdownNumber <= 0) {
          clearInterval(this._countdownStartTimer)
          this.countdownActive = false
          // ครบ 3 วินาที → เปิดให้เห็น VDO (Bunny ซ้อน UI เสร็จ + เริ่มเล่นจริงแล้ว)
          this.liveReady = true
          this._lastMoveTime = Date.now()
          this._timeMoveCount = 5
          this._diagLog('countdown_done', 'countdown ครบ → liveReady=true')
        }
      }, 1000)
      const doPlay = () => {
        const p = this._bunnyPlayer
        if (!p) return
        this._safePlay()
        try { p.unmute() } catch {}
        try { p.setMuted(false) } catch {}
        try { p.setVolume(100) } catch {} // Bunny อาจใช้ 0-100
      }
      doPlay()
      setTimeout(doPlay, 500)
      setTimeout(doPlay, 1500)
    },
    async downloadPdf(fileIdx) {
      const idx = fileIdx !== undefined ? fileIdx : this.selectedPdfIdx
      this.pdfDownloading = true
      this.pdfProgress = 'กำลังเริ่มต้น...'
      this.pdfPercent = 0
      this.pdfStep = 'starting'
      try {
        const liveId = this.currentLiveId || this.$route.params.id

        // 1. Start job
        this.pdfStep = 'submitting'
        this.pdfProgress = 'กำลังส่งคำขอ...'
        const startRes = await api.post(`/my/live/${liveId}/pdf-start/${idx}`)
        const jobId = startRes.jobId
        if (!jobId) { alert('เริ่มดาวน์โหลดไม่สำเร็จ'); return }
        this.pdfJobId = jobId

        // 2. Poll status
        this.pdfStep = 'processing'
        let done = false
        const deadline = Date.now() + 10 * 60 * 1000 // 10 นาที
        while (!done && Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 2000))
          try {
            const status = await api.get(`/my/live/pdf-job/${jobId}/status`)
            if (status.status === 'done') {
              done = true
              this.pdfPercent = 100
            } else if (status.status === 'error') {
              alert(status.statusText || status.error || 'สร้างเอกสารไม่สำเร็จ')
              return
            } else {
              this.pdfPercent = status.percent || 0
              if (status.statusText) {
                this.pdfProgress = status.statusText
              } else if (status.status === 'queued') {
                this.pdfProgress = 'กำลังรอคิว...'
              } else {
                this.pdfProgress = 'กำลังสร้างลายน้ำ...'
              }
            }
          } catch { /* retry */ }
        }
        if (!done) { alert('หมดเวลา — กรุณาลองใหม่'); return }

        // 3. Download
        this.pdfStep = 'downloading'
        this.pdfProgress = 'กำลังดาวน์โหลด...'
        const token = localStorage.getItem('token')
        const resp = await fetch(`/api/my/live/pdf-job/${jobId}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          alert(err.message || 'ดาวน์โหลดไม่สำเร็จ')
          return
        }
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const cd = resp.headers.get('content-disposition') || ''
        const fnMatch = cd.match(/filename\*=UTF-8''(.+)/)
        a.download = fnMatch ? decodeURIComponent(fnMatch[1]) : 'document.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.showPdfConsent = false
      } catch (e) {
        alert('ดาวน์โหลดไม่สำเร็จ: ' + (e.message || ''))
      } finally {
        this.pdfDownloading = false
        this.pdfProgress = ''
        this.pdfPercent = 0
        this.pdfStep = ''
        this.pdfJobId = null
      }
    },
    formatQaTime(sec) {
      if (sec == null) return ''
      const m = Math.floor(sec / 60)
      const s = sec % 60
      return `${m}:${String(s).padStart(2, '0')}`
    },
    async loadQuestions() {
      const pkgId = this.$route.params.packageId
      if (!pkgId) return
      try {
        const data = await api.get(`/my/qa/${pkgId}`)
        this.qaQuestions = data.questions || []
      } catch { /* ignore */ }
      // poll ทุก 15 วิ
      if (!this._qaPoll) {
        this._qaPoll = setInterval(() => this.loadQuestions(), 15000)
      }
    },
    async submitQuestion() {
      const text = this.qaInput.trim()
      if (!text || this.qaSending) return
      this.qaSending = true
      try {
        const videoTimeSec = this.liveStatus === 'live' ? Math.round(this._currentTime || 0) : null

        const pkgId = this.$route.params.packageId

        // ลอง real-time ก่อน (ถ้า socket connected)
        if (this._socket?.connected && pkgId) {
          this._socket.emit('qa:ask', {
            packageId: pkgId,
            sessionId: this.currentLiveId || null,
            question: text,
            source: this.liveStatus === 'live' ? 'live' : 'general',
            videoTimeSec
          })
          // optimistic update — เพิ่มเข้า list ทันที
          this.qaQuestions.push({
            _id: 'tmp-' + Date.now(),
            question: text,
            source: this.liveStatus === 'live' ? 'live' : 'general',
            videoTimeSec,
            answer: '',
            answeredAt: null,
            createdAt: new Date().toISOString(),
            isOwn: true,
            displayName: 'นักเรียน'
          })
          this.$nextTick(() => {
            const list = this.$refs.qaList
            if (list) list.scrollTop = list.scrollHeight
          })
          this.qaInput = ''
          this.qaSending = false
          return
        }

        // fallback HTTP
        const res = await api.post(`/my/qa/${pkgId}`, {
          question: text,
          sessionId: this.currentLiveId || null,
          source: this.liveStatus === 'live' ? 'live' : 'general',
          videoTimeSec
        })
        if (res.question) {
          this.qaQuestions.push(res.question)
          this.$nextTick(() => {
            const list = this.$refs.qaList
            if (list) list.scrollTop = list.scrollHeight
          })
        }
        this.qaInput = ''
      } catch (e) {
        alert('ส่งคำถามไม่สำเร็จ: ' + (e.response?.data?.message || e.message || ''))
      } finally {
        this.qaSending = false
      }
    },
    // Diag log — ส่ง event ไป backend เงียบๆ ให้ admin/Claude อ่าน debug
    // type='live_event', event=ชื่อ event, message=สรุปสั้น, detail=รายละเอียดเพิ่ม
    _diagLog(event, message, extra = {}) {
      try {
        const ver = (_getAppVersion() || '').slice(-8)
        sendLog('live_event', `[v${ver}] ${message || event}`, {
          event,
          liveId: this.currentLiveId || this.$route.params.id || this.$route.params.packageId || '',
          tabId: this.tabId,
          videoTitle: `[v${ver}] ${this.liveTitle}`,
          currentTime: Math.round(this._currentTime || 0),
          bufferedEnd: this._bufferedEnd,
          isPlaying: this.isPlaying,
          liveReady: this.liveReady,
          needUnmute: this.needUnmute,
          wsConnected: !!(this._socket && this._socket.connected),
          errorCount: this._errorCount || 0,
          ...extra
        })
      } catch { /* ห้าม log error ทำ live พัง */ }
    },
    toggleFullscreen() {
      const box = this.$el.querySelector('.w-player-box')
      if (!box) return
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        box.requestFullscreen().catch(() => {})
        if (!box._fsProtected) {
          box._fsProtected = true
          box.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
          box.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault()
          })
        }
      }
    }
  }
}
</script>

<style scoped>
/* Full-page dark layout */
.watch-page {
  background: #1c1d1f;
  color: #fff;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* Replaced overlay */
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

/* Unsupported overlay */
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
.unsupported-card h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.unsupported-card p { font-size: 14px; color: #64748b; margin-bottom: 24px; }

/* Top bar */
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
.w-section-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Layout: full width (no sidebar) */
.w-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Main (player area) */
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
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.w-player-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  background: #000;
  flex-shrink: 0;
  margin: 0 auto;
}
.w-player-box iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Watermark layer */
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
.wm-text:nth-child(3n+2) { transform: translateX(-15%); }
.wm-text:nth-child(3n)   { transform: translateX(-30%); }
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

/* iframe ไม่รับ interaction → Bunny controls ไม่โผล่ */
.live-iframe {
  pointer-events: none;
  /* ⭐ ซ่อนสนิทจนกว่า liveReady=true — กัน user เห็น Bunny UI ตอน buffer
     แม้ overlay หายไปก่อน iframe ก็ยัง opacity 0 → ไม่เห็นปุ่มส้ม / progress bar */
  opacity: 0;
  transition: opacity 0.2s ease;
}
.live-iframe.iframe-ready {
  opacity: 1;
}
/* ปิด controls Bunny ด้านล่าง — สูง 50px (เดิม 70px ใหญ่ไปบน mobile)
   Bunny controls bar จริงๆ สูง ~40-50px → 50px พอบังสนิท
   ทึบครึ่งล่าง + fade บน */
.controls-cover-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(
    to top,
    #1c1d1f 0%,
    #1c1d1f 60%,
    rgba(28,29,31,0.6) 82%,
    transparent 100%
  );
  z-index: 5;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
}
/* Mobile: เล็กลงอีก เพราะ Bunny mobile controls สั้นกว่า */
@media (max-width: 768px) {
  .controls-cover-bottom {
    height: 40px;
    padding-bottom: 4px;
  }
  .live-broadcast-text { font-size: 11px; }
  .live-broadcast-dot { width: 6px; height: 6px; }
}
.live-broadcast-text {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.2px;
}
.live-broadcast-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
  box-shadow: 0 0 8px rgba(239,68,68,0.6);
  animation: live-pulse 1.5s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

/* Safari autoplay blocked — overlay (ทึบสนิท ห้ามเห็น Bunny player ด้านหลัง) */
.play-prompt-overlay {
  position: absolute;
  inset: 0;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  cursor: pointer;
}
.play-prompt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
  padding: 32px;
  border-radius: 16px;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.4);
}
.play-prompt-btn span {
  font-size: 16px;
  font-weight: 700;
}
.play-prompt-btn:hover {
  background: rgba(168, 85, 247, 0.3);
}

/* ⭐ Countdown 3-2-1 overlay หลังกดรับสัญญาณ */
.countdown-overlay {
  position: absolute;
  inset: 0;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}
.countdown-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.countdown-live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  background: #dc2626;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.countdown-number {
  font-size: 120px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: countdown-pulse 1s ease-in-out;
}
@keyframes countdown-pulse {
  0% { transform: scale(0.7); opacity: 0; }
  30% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.countdown-label {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
@media (max-width: 768px) {
  .countdown-number { font-size: 80px; }
  .countdown-label { font-size: 12px; }
}

/* ⭐ ปุ่มรับสัญญาณถ่ายทอดสด — design ใหม่ สุภาพ live broadcast feel */
.signal-prompt-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 36px 48px;
  cursor: pointer;
  user-select: none;
}
.signal-live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  background: #dc2626;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.signal-live-dot {
  width: 7px;
  height: 7px;
  background: #fff;
  border-radius: 50%;
  animation: live-pulse 1.5s ease-in-out infinite;
}
.signal-play-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(59,130,246,0.4), 0 0 0 4px rgba(59,130,246,0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.signal-prompt-card:hover .signal-play-icon {
  transform: scale(1.08);
  box-shadow: 0 12px 32px rgba(59,130,246,0.5), 0 0 0 6px rgba(59,130,246,0.2);
}
.signal-play-icon svg {
  width: 36px;
  height: 36px;
  color: #fff;
  margin-left: 4px;
}
.signal-prompt-text {
  text-align: center;
  color: #fff;
}
.signal-prompt-main {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}
.signal-prompt-sub {
  font-size: 13px;
  color: #cbd5e1;
  font-weight: 400;
}
@media (max-width: 768px) {
  .signal-prompt-card { padding: 24px 32px; gap: 14px; }
  .signal-play-icon { width: 60px; height: 60px; }
  .signal-play-icon svg { width: 30px; height: 30px; }
  .signal-prompt-main { font-size: 16px; }
  .signal-prompt-sub { font-size: 12px; }
}

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

/* Fullscreen mode */
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
@media (orientation: portrait) {
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
}
.w-player-box:fullscreen .wm-fs-btn,
.w-player-box.is-fullscreen .wm-fs-btn { opacity: 1; }

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, #2d2f31 25%, #3e4143 50%, #2d2f31 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

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

/* LIVE badge */
.live-badge {
  background: #ef4444;
  color: #fff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.live-dot {
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  animation: livePulse 1.5s infinite;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Waiting overlay */
.waiting-overlay, .ended-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 20, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  color: #fff;
  text-align: center;
  padding: 40px;
}
.countdown-time {
  font-size: 48px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: #a855f7;
  margin: 16px 0;
}
.waiting-label {
  font-size: 15px;
  color: #94a3b8;
  font-weight: 600;
}
.waiting-title {
  font-size: 20px;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 24px;
}
/* Connecting overlay */
.connecting-overlay {
  position: absolute; inset: 0;
  background: rgba(15, 15, 20, 0.98);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 20; color: #fff; text-align: center; padding: 40px;
}
.connecting-spinner {
  width: 48px; height: 48px;
  border: 3px solid rgba(168, 85, 247, 0.2);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}
.connecting-text {
  font-size: 16px; font-weight: 700; color: #a855f7;
  animation: connectPulse 2s ease-in-out infinite;
}
.connecting-sub {
  font-size: 14px; color: #64748b; margin-top: 8px;
}
@keyframes connectPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
/* ปุ่ม PDF เด่นกลางจอตอน countdown */
.waiting-pdf-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: none;
  padding: 16px 32px;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
  transition: all 0.2s;
  animation: pdfBounce 2s ease-in-out infinite;
  position: relative;
}
.waiting-pdf-btn::after {
  content: '↓ กดตรงนี้';
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  animation: arrowFade 2s ease-in-out infinite;
}
.waiting-pdf-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.7);
}
.waiting-pdf-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }
@keyframes pdfBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes arrowFade {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.ended-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.ended-title {
  font-size: 20px;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 8px;
}
.ended-sub {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 24px;
}
.ended-btn {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .w-main { overflow: hidden; }
}
@media (max-width: 640px) {
  .wm-center { font-size: 19px; }
  .wm-fs-btn { bottom: 8px; right: 8px; width: 32px; height: 32px; }
}
@media (max-height: 500px) and (orientation: landscape) {
  .wm-center { font-size: 22px; }
  .wm-text { font-size: 19px; padding: 5px 0; }
}
@media (max-width: 768px) {
  .w-topbar {
    padding: 0 12px;
    gap: 8px;
    height: 44px;
    padding-top: env(safe-area-inset-top, 0);
  }
  .w-back { width: 32px; height: 32px; }
  .w-back svg { width: 16px; height: 16px; }
  .w-section-name { font-size: 13px; }
  .countdown-time { font-size: 36px; }
  .waiting-title { font-size: 16px; }
}
@media (max-width: 380px) {
  .w-section-name { font-size: 12px; }
  .countdown-time { font-size: 30px; }
}

/* ── PDF Button in Header ── */
.header-pdf-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);
  transition: all 0.15s;
  animation: headerPdfGlow 2s ease-in-out infinite;
}
.header-pdf-btn:hover {
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6);
  transform: scale(1.05);
}
.header-pdf-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }
@keyframes headerPdfGlow {
  0%, 100% { box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4); }
  50% { box-shadow: 0 2px 18px rgba(37, 99, 235, 0.7); }
}
@media (max-width: 640px) {
  .header-pdf-text { display: none; }
  .header-pdf-btn { padding: 7px 8px; }
}

/* ── PDF Consent Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.pdf-consent-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
}
.pdf-consent-modal h3 {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 16px;
}
.consent-body {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}
.consent-body ul {
  margin: 8px 0;
  padding-left: 20px;
}
.consent-body li {
  margin-bottom: 4px;
}
.consent-warn {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: #dc2626;
}
.consent-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}
.btn-consent-cancel {
  flex: 1;
  padding: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}
.btn-consent-ok {
  flex: 2;
  padding: 10px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
}
.btn-consent-ok:disabled { opacity: 0.5; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── PDF file select ── */
.pdf-file-select { margin: 8px 0; }
.pdf-file-option {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; margin-bottom: 4px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
  font-size: 13px; color: #1e293b;
}
.pdf-file-option:hover { background: #f8fafc; border-color: #93c5fd; }
.pdf-file-option.selected { background: #eff6ff; border-color: #3b82f6; color: #2563eb; font-weight: 600; }
.pdf-file-option svg { color: #3b82f6; flex-shrink: 0; }

/* ── PDF progress ── */
.pdf-progress-box {
  padding: 16px; margin: 12px 0;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
}
.pdf-progress-top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.pdf-progress-text {
  flex: 1; font-size: 13px; color: #1e40af; font-weight: 600;
}
.pdf-progress-pct {
  font-size: 18px; font-weight: 800; color: #2563eb;
  font-variant-numeric: tabular-nums;
}
.pdf-progress-bar-wrap {
  width: 100%; height: 8px; background: #bfdbfe; border-radius: 8px; overflow: hidden;
}
.pdf-progress-bar-fill {
  height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 8px; transition: width 0.5s ease;
}
.pdf-progress-hint {
  font-size: 11px; color: #64748b; margin-top: 6px; text-align: center;
}
.pdf-progress-spinner {
  width: 18px; height: 18px; border: 2px solid #93c5fd;
  border-top-color: #2563eb; border-radius: 50%;
  animation: spin 0.8s linear infinite; flex-shrink: 0;
}

/* ── Q&A Header Button ── */
.header-qa-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.3);
  color: #93c5fd; padding: 5px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  flex-shrink: 0; transition: all .15s;
}
.header-qa-btn:hover { background: rgba(59,130,246,.25); color: #fff; }
.header-qa-text { }
.header-qa-count {
  background: #3b82f6; color: #fff; font-size: 10px; font-weight: 800;
  padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center;
}
@media (max-width: 640px) {
  .header-qa-text { display: none; }
  .header-qa-btn { padding: 5px 8px; }
}

/* ── Q&A FAB ── */
.qa-fab {
  position: fixed; bottom: 24px; right: 24px; z-index: 150;
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(37,99,235,.5);
  transition: all .2s;
}
.qa-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(37,99,235,.7); }
.qa-fab-count {
  position: absolute; top: -4px; right: -4px;
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 800;
  min-width: 20px; height: 20px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
@media (max-width: 640px) {
  .qa-fab { bottom: 16px; right: 16px; width: 48px; height: 48px; }
  .qa-fab svg { width: 20px; height: 20px; }
}

/* ── Q&A Panel (drawer) ── */
.qa-overlay {
  position: fixed; inset: 0; z-index: 180;
  background: rgba(0,0,0,.5);
  display: flex; justify-content: flex-end;
}
.qa-panel {
  width: 380px; max-width: 100vw; height: 100%;
  background: #0f172a; display: flex; flex-direction: column;
  animation: qaSlideIn .25s ease-out;
}
@keyframes qaSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

.qa-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}
.qa-header h3 { font-size: 16px; font-weight: 800; color: #fff; margin: 0; }
.qa-count { font-size: 12px; color: #64748b; flex: 1; }
.qa-close {
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: rgba(255,255,255,.1); color: #fff;
  font-size: 20px; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
}
.qa-close:hover { background: rgba(255,255,255,.2); }

.qa-list {
  flex: 1; overflow-y: auto; padding: 12px 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.qa-empty {
  text-align: center; padding: 40px 0; color: #475569;
}
.qa-item {
  background: #1e293b; border-radius: 12px; padding: 12px 14px;
  border-left: 3px solid #334155;
}
.qa-item.qa-own { border-left-color: #3b82f6; }
.qa-item.qa-answered { border-left-color: #10b981; }
.qa-item-head {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.qa-time {
  font-size: 11px; font-weight: 700; color: #3b82f6;
  background: rgba(59,130,246,.15); padding: 2px 8px; border-radius: 6px;
}
.qa-time.qa-after { color: #f59e0b; background: rgba(245,158,11,.15); }
.qa-own-badge {
  font-size: 10px; color: #93c5fd; font-weight: 600;
}
.qa-question { font-size: 14px; color: #e2e8f0; line-height: 1.5; }
.qa-answer {
  margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;
  font-size: 13px; color: #a7f3d0; line-height: 1.5;
}
.qa-answer-label { font-weight: 700; color: #10b981; }
.qa-waiting {
  margin-top: 6px; font-size: 11px; color: #64748b; font-weight: 600;
}

.qa-input-wrap {
  display: flex; gap: 8px; padding: 12px 16px;
  border-top: 1px solid #1e293b; flex-shrink: 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
}
.qa-input {
  flex: 1; padding: 10px 14px; border-radius: 10px;
  border: 1px solid #334155; background: #1e293b;
  color: #fff; font-size: 14px; outline: none;
}
.qa-input:focus { border-color: #3b82f6; }
.qa-input::placeholder { color: #475569; }
.qa-send {
  padding: 10px 18px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  flex-shrink: 0; transition: all .15s;
}
.qa-send:hover:not(:disabled) { transform: scale(1.05); }
.qa-send:disabled { opacity: .4; cursor: not-allowed; }

/* ── Ended Q&A Button ── */
.ended-qa-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; border: none; padding: 14px 28px; border-radius: 12px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(37,99,235,.4);
  margin-bottom: 8px; transition: all .2s;
}
.ended-qa-btn:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(37,99,235,.6); }

@media (max-width: 640px) {
  .qa-panel { width: 100vw; }
}
</style>
