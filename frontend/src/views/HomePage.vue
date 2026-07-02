<template>
  <div class="home">
    <!-- ─── Banner + Hero ─── -->
    <div class="top-block">
      <div class="container">
        <div class="site-banner">
          <img src="https://medninja.b-cdn.net/top_banner.png" alt="MedNinja Banner" />
        </div>
        <div class="hero-compact">
          <p class="hero-sub">เตรียมสอบใบประกอบวิชาชีพเวชกรรม (NLE) กับแพทย์ผู้เชี่ยวชาญ</p>
          <div class="hero-btns">
            <router-link to="/login" class="btn btn-passport">NINJA PASSPORT — เข้าเรียน</router-link>
            <a href="/demo" class="mn-btn-demo-pro mn-desktop-only">
              <span>⚡</span> ทดลองเรียน Demo Class ฟรี
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Module Ticker ─── -->
    <div class="module-ticker">
      <div class="container">
        <div class="ticker-overflow">
          <div class="ticker-track">
            <span v-for="(m, i) in bannerModules" :key="'a'+i" class="ticker-item">
              <span class="ticker-icon" v-html="m.icon"></span>
              <span class="ticker-name">{{ m.name }}</span>
            </span>
            <span v-for="(m, i) in bannerModules" :key="'b'+i" class="ticker-item">
              <span class="ticker-icon" v-html="m.icon"></span>
              <span class="ticker-name">{{ m.name }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── คอร์สทั้งหมด ─── -->
    <section class="section">
      <div class="container">
        <div v-if="loadingCourses" class="courses-grid">
          <SkeletonCard v-for="n in 5" :key="n" />
        </div>
        <div v-else-if="courseStore.error && !courseStore.courses.length" class="empty-state">
          <p>โหลดคอร์สไม่สำเร็จ กรุณาลองใหม่</p>
        </div>
        <div v-else class="courses-grid">
          <CourseCard v-if="flagshipCourse" :course="flagshipCourse" class="flagship-card-wrap" />
          <CourseCard v-for="course in otherCourses" :key="course._id" :course="course" />
        </div>
      </div>
    </section>

    <!-- ─── Introduce Video Section ─── -->
    <section class="nlex-section">
      <div class="container">
        <!-- Introduce Video — dark showcase style -->
        <div class="intro-box">
          <!-- ซ้าย: ข้อมูล -->
          <div class="intro-info-side">
            <div class="lms-badge">INTRODUCTION</div>
            <h2 class="lms-title">มาทำความรู้จัก<br><span style="color: #3b82f6;">MedNinja</span></h2>
            <p class="lms-subtitle">ครบวงจรเพื่อนักศึกษาแพทย์<br>เชี่ยวชาญติวสอบ NL &middot; MEQ &middot; OSCE</p>
            <ul class="lms-features">
              <li>
                <div class="lms-feat-icon lms-feat-red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <b>NINJA LIVE STUDIO</b>
                  <span>เรียนสด ด้วยเทคโนโลยี LIVE</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                </div>
                <div>
                  <b>NINJA LMS</b>
                  <span>ดูวีดีโอย้อนหลังซ้ำได้ไม่จำกัด ต่ออายุได้จนกว่าจะสอบผ่าน</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-cyan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
                </div>
                <div>
                  <b>NLEX By MedNinja</b>
                  <span>คลังข้อสอบกว่า 10,000+ พร้อมเฉลยอธิบายละเอียด</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                </div>
                <div>
                  <b>เรียนแบบส่วนตัว — Privacy First</b>
                  <span>เราให้ความสำคัญกับความเป็นส่วนตัวของผู้เรียน ถ่ายทอดสดด้วยระบบเฉพาะที่พัฒนาขึ้นเอง ไม่เปิดเผยตัวตนในห้องเรียนสด พร้อมช่องทางสื่อสารส่วนตัวตรงถึงผู้สอน</span>
                </div>
              </li>
            </ul>
          </div>
          <!-- ขวา: วีดีโอ -->
          <div class="intro-video-side">
            <div class="intro-video-wrap">
              <iframe
                v-if="introUrl && !showIntroModal"
                :src="introUrl"
                referrerpolicy="origin"
                allow="accelerometer; gyroscope; autoplay; encrypted-media"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Intro Video Modal (ทุกครั้งที่เข้าหน้าแรก) ─── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showIntroModal" class="intro-modal-overlay" @click.self="closeIntroModal">
          <div class="intro-modal-box">
            <button class="intro-modal-close" @click="closeIntroModal" title="ปิด">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <div class="intro-modal-player">
              <iframe
                v-if="introUrlAutoplay"
                ref="introIframe"
                :src="introUrlAutoplay"
                referrerpolicy="origin"
                allow="accelerometer; gyroscope; autoplay; encrypted-media"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── LMS Streaming Technology ─── -->
    <section class="lms-section">
      <div class="container">
        <div class="lms-box">
          <!-- ซ้าย: Screenshot หน้า Watch + Playlist sidebar ในเฟรม browser -->
          <div class="lms-mockup">
            <div class="mock-browser">
              <div class="mock-topbar">
                <div class="mock-dots"><span></span><span></span><span></span></div>
                <div class="mock-url">medninja.academy/watch</div>
              </div>
              <div class="mock-layout">
                <div class="mock-screenshot">
                  <img src="https://medninja.b-cdn.net/watch_screen.png" alt="MedNinja LMS Watch Page" />
                </div>
                <div class="mock-sidebar">
                  <div class="mock-playlist-title">Playlist</div>
                  <div v-for="i in 5" :key="i" class="mock-item" :class="{ active: i === 2 }">
                    <div class="mock-thumb"></div>
                    <div class="mock-info">
                      <div class="mock-name"></div>
                      <div class="mock-dur"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ขวา: ข้อมูล -->
          <div class="lms-info">
            <div class="lms-badge">STREAMING TECHNOLOGY</div>
            <h2 class="lms-title">ระบบเรียนออนไลน์<br>ระดับมืออาชีพ</h2>
            <p class="lms-subtitle">เทคโนโลยี Adaptive Streaming<br>มาตรฐานเดียวกับ <span class="lms-netflix">Netflix</span></p>
            <ul class="lms-features">
              <li>
                <div class="lms-feat-icon lms-feat-cyan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
                </div>
                <div>
                  <b>Adaptive Bitrate</b>
                  <span>ปรับความคมชัดอัตโนมัติตามเน็ต ไม่มีกระตุก</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
                </div>
                <div>
                  <b>ส่งคำถามถึงผู้สอนได้ทันที</b>
                  <span>สงสัยตรงไหน กดถามได้เลยระหว่างเรียน</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
                </div>
                <div>
                  <b>ดูได้ทุกอุปกรณ์</b>
                  <span>PC, Mac, มือถือ, แท็บเล็ต</span>
                </div>
              </li>
              <li>
                <div class="lms-feat-icon lms-feat-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                </div>
                <div>
                  <b>ดูได้จากทั่วโลก ไม่กระตุก</b>
                  <span>ด้วย Server กระจายทั่วโลก นักเรียนแพทย์ที่กำลังศึกษาอยู่ต่างประเทศ เข้าดูได้ลื่นไหล</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Virtual Patient Banner ─── -->
    <section class="lms-section vp-section">
      <div class="container">
        <div class="vp-banner" @click="$router.push('/virtual-patient')" style="cursor:pointer">
          <div class="vp-monogram">VP</div>
          <div class="vp-scan"></div>
          <span class="vp-br vp-tl"></span>
          <span class="vp-br vp-tr"></span>
          <span class="vp-br vp-bl"></span>
          <span class="vp-br vp-br2"></span>
          <div class="vp-corner-tag"><span class="vp-dot"></span>LIVE NOW</div>
          <div class="vp-brand">NINJA <span class="vp-pur">DDx</span></div>

          <div class="vp-stage">
            <div class="vp-left">
              <div class="vp-label">/// NEW EXPERIENCE ///</div>
              <h2 class="vp-headline">VIRTUAL<br><span class="vp-pur">PATIENT</span></h2>
              <div class="vp-sub">ระบบ <b>Virtual Patient</b><br>เพื่อการสอบโดยเฉพาะ</div>
              <div class="vp-pills">
                <span class="vp-for">FOR</span>
                <span class="vp-pill vp-meq">MEQ</span>
                <span class="vp-pill vp-osce">OSCE</span>
                <span class="vp-pill vp-lc">LONG CASE</span>
              </div>
              <br>
              <a class="vp-cta" href="/virtual-patient">ทดลองเลย — ฟรี 7 วัน <span class="vp-arrow">→</span></a>
            </div>

            <div class="vp-right">
              <div class="vp-logo-orb">
                <span class="vp-ring-inner"></span>
                <img src="/img/vp-circle.png" alt="Logo" />
              </div>
              <div class="vp-bubble vp-b1">สวัสดีครับคุณหมอ…</div>
              <div class="vp-bubble vp-b2 vp-dark">
                เริ่มซักประวัติ ?
                <span class="vp-typing"><span></span><span></span><span></span></span>
              </div>
              <div class="vp-bubble vp-b1">ผมรอคุณหมออยู่นะครับ</div>
            </div>
          </div>

          <div class="vp-mascot-wrap">
            <div class="vp-glow"></div>
            <img src="/img/vp-mascot.png" alt="Virtual Patient Mascot" />
          </div>
        </div>
      </div>
    </section>

    <!-- ─── NLEX Section (ระบบข้อสอบ) ─── -->
    <section class="lms-section">
      <div class="container">
        <div class="nlex-box exam-combo-box">
          <!-- ซ้าย: NLEX -->
          <div class="combo-half combo-nlex">
            <div class="combo-top">
              <div class="combo-logo">NLEX</div>
              <div class="combo-badge nlex-badge-red">NEW SYSTEM</div>
            </div>
            <div class="combo-mid">ตะลุยข้อสอบ NL <b>10,000+</b> ข้อ — พร้อมเฉลยละเอียด</div>
            <div class="combo-tags">
              <span>📋 NL1+NL2 ครบ</span>
              <span>📊 วิเคราะห์จุดอ่อน</span>
              <span>🔥 ระบบใหม่</span>
            </div>
          </div>
          <div class="combo-divider"></div>
          <!-- ขวา: MEQEX -->
          <div class="combo-half combo-meqex">
            <div class="combo-top">
              <div class="combo-logo meqex-logo">MEQEX</div>
              <div class="combo-badge meqex-badge">REALTIME</div>
            </div>
            <div class="combo-mid">ฝึกทำข้อสอบ MEQ — <b>ตรวจให้คะแนนทันที</b></div>
            <div class="combo-tags">
              <span>🎯 Major+Minor ครบ</span>
              <span>✍️ Keyword Scoring</span>
              <span>📊 วิเคราะห์จุดอ่อน</span>
            </div>
          </div>
        </div>

        <!-- ─── Product Banners (8 cards, 4x2) ─── -->
        <div class="product-banners">
          <!-- Row 1: SYNAPSE · ATLAS · NLEX · MEQEX -->

          <!-- SYNAPSE -->
          <div class="pb-card pb-synapse">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco" viewBox="0 0 300 200">
              <circle cx="220" cy="40" r="3.5" fill="#a78bfa"/>
              <circle cx="260" cy="90" r="2.5" fill="#a78bfa"/>
              <circle cx="200" cy="130" r="3" fill="#a78bfa"/>
              <circle cx="270" cy="155" r="2" fill="#a78bfa"/>
              <circle cx="180" cy="70" r="2.5" fill="#a78bfa"/>
              <line x1="220" y1="40" x2="260" y2="90" stroke="#a78bfa" stroke-width="0.8"/>
              <line x1="260" y1="90" x2="200" y2="130" stroke="#a78bfa" stroke-width="0.8"/>
              <line x1="200" y1="130" x2="270" y2="155" stroke="#a78bfa" stroke-width="0.8"/>
              <line x1="180" y1="70" x2="220" y2="40" stroke="#a78bfa" stroke-width="0.8"/>
              <line x1="180" y1="70" x2="260" y2="90" stroke="#a78bfa" stroke-width="0.5"/>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:20%;left:15%;animation-delay:0s"></span>
              <span class="pb-dot" style="top:60%;left:70%;animation-delay:1s"></span>
              <span class="pb-dot" style="top:40%;left:45%;animation-delay:2s"></span>
              <span class="pb-dot" style="top:80%;left:85%;animation-delay:3s"></span>
            </div>
            <div class="pb-icon">🧠</div>
            <div class="pb-body">
              <span class="pb-badge">E-Learning</span>
              <div class="pb-name"><small>NINJA</small>SYNAPSE</div>
              <div class="pb-desc">เชื่อมโยง <strong>Anatomy</strong><br><strong>Biochem Patho</strong></div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- ATLAS -->
          <div class="pb-card pb-atlas">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco" viewBox="0 0 300 200">
              <circle cx="230" cy="100" r="35" fill="none" stroke="#60a5fa" stroke-width="1.2" opacity="0.4"/>
              <circle cx="230" cy="100" r="3" fill="#60a5fa" opacity="0.6"/>
              <line x1="230" y1="100" x2="230" y2="70" stroke="#60a5fa" stroke-width="1.5" opacity="0.7"/>
              <line x1="230" y1="100" x2="252" y2="112" stroke="#60a5fa" stroke-width="1" opacity="0.5"/>
              <text x="230" y="58" text-anchor="middle" font-size="8" fill="#60a5fa" opacity="0.5">N</text>
              <text x="270" y="104" text-anchor="middle" font-size="8" fill="#60a5fa" opacity="0.4">E</text>
              <text x="230" y="148" text-anchor="middle" font-size="8" fill="#60a5fa" opacity="0.4">S</text>
              <text x="190" y="104" text-anchor="middle" font-size="8" fill="#60a5fa" opacity="0.4">W</text>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:22%;left:18%;animation-delay:0.1s"></span>
              <span class="pb-dot" style="top:62%;left:72%;animation-delay:1.1s"></span>
              <span class="pb-dot" style="top:42%;left:48%;animation-delay:2.1s"></span>
              <span class="pb-dot" style="top:82%;left:32%;animation-delay:3.1s"></span>
            </div>
            <div class="pb-icon">🧭</div>
            <div class="pb-body">
              <span class="pb-badge">NL1+2 E-Learning</span>
              <div class="pb-name"><small>NINJA</small>ATLAS</div>
              <div class="pb-desc">แผนที่เชื่อมโยง<strong>ความรู้</strong><br>เตรียมพร้อม <strong>ศรว.ระบบใหม่</strong></div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- NLEX -->
          <div class="pb-card pb-nlex">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <div class="pb-particles">
              <span class="pb-dot" style="top:25%;left:20%;animation-delay:0.3s"></span>
              <span class="pb-dot" style="top:65%;left:65%;animation-delay:1.2s"></span>
              <span class="pb-dot" style="top:45%;left:40%;animation-delay:2.1s"></span>
              <span class="pb-dot" style="top:85%;left:80%;animation-delay:3.2s"></span>
            </div>
            <div class="pb-icon">📋</div>
            <div class="pb-body">
              <span class="pb-badge">NL Simulation</span>
              <div class="pb-name"><small>NINJA</small>NLEX</div>
              <div class="pb-desc">ข้อสอบ NL <strong>10,000+</strong><br>พร้อมเฉลย</div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- MEQEX -->
          <div class="pb-card pb-meqex">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco" viewBox="0 0 300 200">
              <rect x="180" y="50" width="60" height="40" rx="4" fill="none" stroke="#fb7185" stroke-width="1.2" opacity="0.5"/>
              <line x1="188" y1="62" x2="232" y2="62" stroke="#fb7185" stroke-width="0.8" opacity="0.4"/>
              <line x1="188" y1="70" x2="220" y2="70" stroke="#fb7185" stroke-width="0.8" opacity="0.3"/>
              <line x1="188" y1="78" x2="226" y2="78" stroke="#fb7185" stroke-width="0.8" opacity="0.4"/>
              <rect x="200" y="105" width="70" height="45" rx="4" fill="none" stroke="#fb7185" stroke-width="1.2" opacity="0.5"/>
              <line x1="208" y1="117" x2="262" y2="117" stroke="#fb7185" stroke-width="0.8" opacity="0.4"/>
              <line x1="208" y1="125" x2="250" y2="125" stroke="#fb7185" stroke-width="0.8" opacity="0.3"/>
              <line x1="208" y1="133" x2="256" y2="133" stroke="#fb7185" stroke-width="0.8" opacity="0.4"/>
              <circle cx="253" cy="140" r="6" fill="none" stroke="#fb7185" stroke-width="1" opacity="0.5"/>
              <polyline points="250,140 253,143 258,137" fill="none" stroke="#fb7185" stroke-width="1" opacity="0.6"/>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:20%;left:18%;animation-delay:0.2s"></span>
              <span class="pb-dot" style="top:60%;left:68%;animation-delay:1.1s"></span>
              <span class="pb-dot" style="top:40%;left:42%;animation-delay:2.2s"></span>
              <span class="pb-dot" style="top:80%;left:82%;animation-delay:3.1s"></span>
            </div>
            <div class="pb-icon">🎯</div>
            <div class="pb-body">
              <span class="pb-badge">MEQ Simulation</span>
              <div class="pb-name"><small>NINJA</small>MEQEX</div>
              <div class="pb-desc">ฝึกทำข้อสอบ <strong>MEQ</strong><br>ตรวจให้คะแนนทันที</div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- Row 2: LONGEX · DDx · OSCE · 15xSKILL -->

          <!-- LONGEX -->
          <div class="pb-card pb-longex">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco" viewBox="0 0 300 200">
              <circle cx="230" cy="90" r="20" fill="none" stroke="#fbbf24" stroke-width="1.2" opacity="0.4"/>
              <circle cx="230" cy="90" r="4" fill="#fbbf24" opacity="0.5"/>
              <line x1="230" y1="110" x2="230" y2="150" stroke="#fbbf24" stroke-width="1" opacity="0.3"/>
              <line x1="215" y1="130" x2="245" y2="130" stroke="#fbbf24" stroke-width="1" opacity="0.3"/>
              <rect x="200" y="55" width="12" height="16" rx="2" fill="none" stroke="#fbbf24" stroke-width="0.8" opacity="0.3"/>
              <rect x="250" y="120" width="20" height="14" rx="2" fill="none" stroke="#fbbf24" stroke-width="0.8" opacity="0.3"/>
              <line x1="254" y1="127" x2="266" y2="127" stroke="#fbbf24" stroke-width="0.6" opacity="0.25"/>
              <line x1="254" y1="131" x2="262" y2="131" stroke="#fbbf24" stroke-width="0.6" opacity="0.25"/>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:18%;left:22%;animation-delay:0.4s"></span>
              <span class="pb-dot" style="top:58%;left:75%;animation-delay:1.3s"></span>
              <span class="pb-dot" style="top:38%;left:50%;animation-delay:2.3s"></span>
              <span class="pb-dot" style="top:78%;left:30%;animation-delay:3.4s"></span>
            </div>
            <div class="pb-icon">🏥</div>
            <div class="pb-body">
              <span class="pb-badge">Long Case Exam</span>
              <div class="pb-name"><small>NINJA</small>LONGEX</div>
              <div class="pb-desc">ซักประวัติ <strong>ตรวจร่างกาย</strong><br>สั่ง Lab <strong>นำเสนอ Examiner</strong></div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- DDx -->
          <div class="pb-card pb-ddx">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <div class="pb-particles">
              <span class="pb-dot" style="top:30%;left:25%;animation-delay:0.5s"></span>
              <span class="pb-dot" style="top:70%;left:60%;animation-delay:1.5s"></span>
              <span class="pb-dot" style="top:50%;left:40%;animation-delay:2.5s"></span>
              <span class="pb-dot" style="top:15%;left:80%;animation-delay:3.5s"></span>
            </div>
            <div class="pb-icon">🔍</div>
            <div class="pb-body">
              <span class="pb-badge">DDx Approach</span>
              <div class="pb-name"><small>NINJA</small>DDx</div>
              <div class="pb-desc">ฝึก<strong>วินิจฉัยแยกโรค</strong><br>สำหรับ NL+MEQ</div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- OSCE -->
          <div class="pb-card pb-osce">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco pb-deco-ekg" viewBox="0 0 300 200">
              <polyline fill="none" stroke="#34d399" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                points="140,100 160,100 170,100 175,95 180,105 185,100 195,100 200,80 205,125 208,60 212,140 215,75 220,100 235,100 245,95 255,100 270,100 275,95 280,105 285,100 300,100"/>
              <circle cx="208" cy="60" r="2" fill="#34d399" opacity="0.6"/>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:25%;left:20%;animation-delay:0.3s"></span>
              <span class="pb-dot" style="top:65%;left:55%;animation-delay:1.3s"></span>
              <span class="pb-dot" style="top:45%;left:75%;animation-delay:2.3s"></span>
              <span class="pb-dot" style="top:85%;left:35%;animation-delay:3.3s"></span>
            </div>
            <div class="pb-icon">🩺</div>
            <div class="pb-body">
              <span class="pb-badge">Clinical Station</span>
              <div class="pb-name"><small>NINJA</small>OSCE</div>
              <div class="pb-desc">จำลอง <strong>OSCE</strong><br>ซักประวัติ+หัตถการ</div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>

          <!-- 15xSKILL -->
          <div class="pb-card pb-skill">
            <div class="pb-accent"></div>
            <div class="pb-grid"></div>
            <div class="pb-glow"></div>
            <div class="pb-scanline"></div>
            <svg class="pb-deco" viewBox="0 0 300 200">
              <rect x="195" y="60" width="50" height="60" rx="4" fill="none" stroke="#818cf8" stroke-width="1" opacity="0.4"/>
              <line x1="203" y1="75" x2="237" y2="75" stroke="#818cf8" stroke-width="0.8" opacity="0.3"/>
              <line x1="203" y1="85" x2="230" y2="85" stroke="#818cf8" stroke-width="0.8" opacity="0.25"/>
              <line x1="203" y1="95" x2="234" y2="95" stroke="#818cf8" stroke-width="0.8" opacity="0.3"/>
              <line x1="203" y1="105" x2="225" y2="105" stroke="#818cf8" stroke-width="0.8" opacity="0.25"/>
              <circle cx="260" cy="140" r="12" fill="none" stroke="#818cf8" stroke-width="1" opacity="0.35"/>
              <text x="260" y="144" text-anchor="middle" font-size="10" fill="#818cf8" opacity="0.5" font-weight="bold">15</text>
            </svg>
            <div class="pb-particles">
              <span class="pb-dot" style="top:22%;left:16%;animation-delay:0.6s"></span>
              <span class="pb-dot" style="top:62%;left:70%;animation-delay:1.6s"></span>
              <span class="pb-dot" style="top:42%;left:44%;animation-delay:2.6s"></span>
              <span class="pb-dot" style="top:82%;left:84%;animation-delay:3.6s"></span>
            </div>
            <div class="pb-icon">✋</div>
            <div class="pb-body">
              <span class="pb-badge">15 Manual Skills</span>
              <div class="pb-name"><small>NINJA</small>15xSKILL</div>
              <div class="pb-desc"><strong>15 หัตถการ</strong>ตามเกณฑ์ ศรว.<br>ฝึกกับแพทย์ด้วย <strong>STUDIO TECHNOLOGY</strong></div>
            </div>
            <div class="pb-corner"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Mobile Sticky Bar ─── -->
    <div class="mn-mobile-sticky-bar">
      <a href="/demo" class="mn-sticky-btn">
        ⚡ ทดลองเรียน Demo Class ฟรี! 🎓
      </a>
    </div>
  </div>
</template>

<script>
import { useCourseStore } from '../stores/course'
import CourseCard from '../components/course/CourseCard.vue'
import SkeletonCard from '../components/common/SkeletonCard.vue'

export default {
  name: 'HomePage',
  components: { CourseCard, SkeletonCard },
  data() {
    const supportsNewEmoji = (() => {
      try {
        const c = document.createElement('canvas'), x = c.getContext('2d')
        c.width = 64; c.height = 64; x.font = '48px serif'
        x.fillText('\uD83E\uDEC1', 0, 48)
        const d = x.getImageData(0, 0, 64, 64).data
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 50 && d[i+1] > 50 && d[i+2] > 50 && d[i+3] > 100) return true
        }
        return false
      } catch { return false }
    })()
    const em = (m, f) => supportsNewEmoji ? m : f
    return {
      loadingCourses: false,
      showIntroModal: true,
      introUrl: '',
      introUrlAutoplay: '',
      bannerIdx: 0,
      bannerLeaving: -1,
      bannerTimer: null,
      bannerGroup: 'synapse',
      bannerModules: [
        { g:'synapse', icon:'❤️', name:'CARDIOVASCULAR', sub:'ระบบหัวใจและหลอดเลือด' },
        { g:'synapse', icon:em('🫁','🌬️'), name:'RESPIRATORY', sub:'ระบบหายใจ' },
        { g:'synapse', icon:em('🩸','🔴'), name:'HEMATOLOGY', sub:'โลหิตวิทยา' },
        { g:'synapse', icon:'💧', name:'RENAL', sub:'ระบบไตและทางเดินปัสสาวะ' },
        { g:'synapse', icon:'<img src="/img/endocrine.png" alt="endocrine" style="width:16px;height:16px">', name:'ENDOCRINE', sub:'ระบบต่อมไร้ท่อ' },
        { g:'synapse', icon:'🍽️', name:'GASTROINTESTINAL', sub:'ระบบทางเดินอาหาร' },
        { g:'synapse', icon:'🧠', name:'NEUROLOGY', sub:'ระบบประสาท' },
        { g:'synapse', icon:'🦠', name:'MICROBIOLOGY', sub:'จุลชีววิทยา' },
        { g:'synapse', icon:'🤰', name:'REPRODUCTIVE', sub:'ระบบสืบพันธุ์' },
        { g:'synapse', icon:'💪', name:'MSK', sub:'ระบบกล้ามเนื้อและกระดูก' },
        { g:'synapse', icon:'✋', name:'SKIN / DERM', sub:'ผิวหนัง' },
        { g:'synapse', icon:'🧬', name:'BIOCHEMISTRY', sub:'ชีวเคมี' },
        { g:'synapse', icon:'💊', name:'PHARMACOLOGY', sub:'เภสัชวิทยา' },
        { g:'synapse', icon:'📊', name:'BIOSTATISTICS', sub:'ชีวสถิติ' },
        { g:'synapse', icon:'🌐', name:'UNIVERSAL', sub:'พื้นฐานร่วมทุกระบบ' },
        { g:'synapse', icon:'⚡', name:'INTEGRATION', sub:'บูรณาการข้ามระบบ' },
        { g:'atlas', icon:em('🩺','💉'), name:'INTERNAL MEDICINE', sub:'อายุรศาสตร์' },
        { g:'atlas', icon:'🤰', name:'OBGYN', sub:'สูติ-นรีเวชศาสตร์' },
        { g:'atlas', icon:'👶', name:'PEDIATRICS', sub:'กุมารเวชศาสตร์' },
        { g:'atlas', icon:'⚔️', name:'SURGERY', sub:'ศัลยศาสตร์' },
        { g:'atlas', icon:'🚑', name:'ER', sub:'เวชศาสตร์ฉุกเฉิน' },
        { g:'atlas', icon:'🦴', name:'ORTHOPEDICS', sub:'ออร์โธปิดิกส์' },
        { g:'atlas', icon:em('🩹','🏥'), name:'TRAUMA', sub:'อุบัติเหตุวิทยา' },
        { g:'atlas', icon:'🔍', name:'FORENSIC', sub:'นิติเวชศาสตร์' },
        { g:'atlas', icon:'👂', name:'ENT', sub:'โสต ศอ นาสิกวิทยา' },
        { g:'atlas', icon:'👁️', name:'OPHTHALMOLOGY', sub:'จักษุวิทยา' },
      ]
    }
  },
  setup() {
    const courseStore = useCourseStore()
    return { courseStore }
  },
  computed: {
    flagshipCourse() {
      // 1) เลือก course "NL MASTERY" (3 ขั้น Foundation/Essential/Advanced)
      const mastery = this.courseStore.courses.find(c =>
        /MASTERY/i.test(c.title || '')
      )
      if (mastery) return mastery
      // 2) fallback: ระบบใหม่ 2570 ราคาสูงสุด
      const newSystem = this.courseStore.courses
        .filter(c => c.system === 'new_2570')
        .sort((a, b) => b.price - a.price)[0]
      if (newSystem) return newSystem
      // 3) fallback: price สูงสุด
      return [...this.courseStore.courses].sort((a, b) => b.price - a.price)[0] || null
    },
    otherCourses() {
      return this.courseStore.courses
        .filter(c => c._id !== this.flagshipCourse?._id)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    }
  },
  async mounted() {
    // ดึง intro video URL จาก API (signed URL)
    try {
      const resp = await fetch('/api/demo/intro')
      const data = await resp.json()
      if (data.embedUrl) {
        const sep = data.embedUrl.includes('?') ? '&' : '?'
        this.introUrl = data.embedUrl + sep + 'autoplay=false&preload=true'
        this.introUrlAutoplay = data.embedUrl + sep + 'autoplay=true&preload=true&responsive=true'
      }
    } catch { /* ignore */ }

    if (!this.courseStore.courses.length) {
      this.loadingCourses = true
      await this.courseStore.fetchCourses()
      this.loadingCourses = false
    }
    // Listen for video ended → auto-close modal
    this.$nextTick(() => { this._initIntroPlayer() })
    // Banner auto-play
    this.bannerTimer = setInterval(() => { this.bannerNext() }, 3000)
  },
  beforeUnmount() {
    clearInterval(this.bannerTimer)
  },
  methods: {
    closeIntroModal() {
      this.showIntroModal = false
    },
    bannerNext() {
      this.bannerGoTo((this.bannerIdx + 1) % this.bannerModules.length)
    },
    bannerGoTo(idx) {
      if (idx === this.bannerIdx) return
      this.bannerLeaving = this.bannerIdx
      this.bannerIdx = idx
      this.bannerGroup = this.bannerModules[idx].g
      setTimeout(() => { this.bannerLeaving = -1 }, 700)
      clearInterval(this.bannerTimer)
      this.bannerTimer = setInterval(() => { this.bannerNext() }, 3000)
    },
    _initIntroPlayer() {
      const iframe = this.$refs.introIframe
      if (!iframe) return
      // Load playerjs if not already loaded
      const initPlayer = () => {
        if (!window.playerjs) return
        const player = new window.playerjs.Player(iframe)
        player.on('ready', () => {
          player.on('ended', () => { this.closeIntroModal() })
        })
      }
      if (window.playerjs) { initPlayer(); return }
      const script = document.createElement('script')
      script.src = 'https://embed.mediadelivery.net/player/playerjs.js'
      script.onload = initPlayer
      document.head.appendChild(script)
    }
  }
}
</script>

<style scoped>
/* ─── Top block ─── */
.top-block { padding-top: 16px; }
.site-banner { width: 100%; max-height: 180px; overflow: hidden; }
.site-banner img { width: 100%; height: 180px; object-fit: cover; object-position: center; display: block; }
@media (max-width: 768px) { .site-banner { max-height: 120px; } .site-banner img { height: 120px; } }

/* ─── Hero Compact ─── */
.hero-compact {
  background: var(--primary);
  padding: 24px 20px 28px;
  text-align: center;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}
.hero-sub {
  font-size: 15px;
  color: #fff;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.4;
}
.hero-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
}

/* ─── Passport Button (Purple Gradient) ─── */
.btn-passport {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff !important;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 800;
  font-size: 14px;
  border: none;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  transition: all 0.3s;
}
.btn-passport:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
  color: #fff;
}
.btn-old {
  font-size: 13px;
  opacity: 0.8;
}

/* ─── Demo Button (Cyan Shine) ─── */
.mn-btn-demo-pro {
  background: #00f2ff;
  color: #0f172a;
  padding: 11px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 242, 255, 0.3);
  position: relative;
  overflow: hidden;
  transition: 0.3s;
  border: none;
}
.mn-btn-demo-pro:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 255, 0.4);
  color: #0f172a;
}
.mn-btn-demo-pro::after,
.mn-sticky-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -100%;
  width: 50%;
  height: 200%;
  background: rgba(255,255,255,0.4);
  transform: rotate(30deg);
  animation: mn-shine 3s infinite;
}
@keyframes mn-shine {
  0% { left: -100%; }
  20% { left: 150%; }
  100% { left: 150%; }
}

/* Desktop only / Mobile only */
.mn-desktop-only { display: inline-flex; }
@media (max-width: 768px) { .mn-desktop-only { display: none !important; } }

/* ─── Mobile Sticky Bar ─── */
.mn-mobile-sticky-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 20px;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
  z-index: 10000;
}
.mn-sticky-btn {
  background: #00f2ff;
  color: #0f172a;
  width: 100%;
  display: block;
  text-align: center;
  padding: 15px;
  border-radius: 12px;
  font-weight: 900;
  text-decoration: none;
  font-size: 16px;
  position: relative;
  overflow: hidden;
}
@media (min-width: 769px) {
  .mn-mobile-sticky-bar { display: none !important; }
  .home { padding-bottom: 0; }
}
@media (max-width: 768px) {
  .home { padding-bottom: 70px; }
}

/* ─── Section utils ─── */
.text-center { text-align: center; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 12px;
}
.empty-state { text-align: center; padding: 40px; color: var(--gray); }

/* ─── Flagship (NL1+2) ─── */
.flagship-card-wrap {
  grid-column: 1 / -1;
  border: 2px solid var(--primary);
  box-shadow: 0 4px 24px rgba(30, 58, 138, 0.15);
  position: relative;
}
.flagship-card-wrap::before {
  content: 'แนะนำ';
  position: absolute;
  top: 0;
  left: 20px;
  background: var(--primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 14px;
  border-radius: 0 0 8px 8px;
  z-index: 2;
  letter-spacing: 0.5px;
}
.flagship-card-wrap::after {
  content: 'ใหม่ล่าสุด';
  position: absolute;
  top: 14px;
  right: 0;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 20px 5px 14px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
}

/* ─── Flagship MOBILE (<600px) — match dark navy theme ─── */
@media (max-width: 599px) {
  .flagship-card-wrap :deep(.course-thumbnail) {
    aspect-ratio: 1 / 1 !important;
  }
  .flagship-card-wrap :deep(.price-amount) {
    font-size: 26px !important;
    font-weight: 900 !important;
    color: #dc2626 !important;
  }
  /* Sub-courses container: dark navy bg + HUD pattern (เหมือน desktop) */
  .flagship-card-wrap :deep(.sub-courses-wrap) {
    margin: 12px -14px -14px -14px !important;
    background:
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
      linear-gradient(135deg, #0c1524 0%, #1e3a8a 50%, #0c1524 100%);
    padding: 28px 18px 24px !important;
    border-top: 2px solid #3b82f6 !important;
    border-radius: 0 !important;
    position: relative;
  }
  .flagship-card-wrap :deep(.sub-courses-wrap)::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    pointer-events: none;
    z-index: 0;
  }
  .flagship-card-wrap :deep(.sub-courses-wrap) > * {
    position: relative;
    z-index: 1;
  }
  .flagship-card-wrap :deep(.sub-label) {
    display: none !important;
  }
  /* Mobile: stepper แนวตั้ง — กล่องเรียงลงล่าง + ลูกศร ↓ */
  .flagship-card-wrap :deep(.sub-compact) {
    display: flex !important;
    flex-direction: column;
    gap: 18px;
    border: none !important;
    background: transparent;
    padding: 6px 8px 0 8px;
  }
  .flagship-card-wrap :deep(.sub-row) {
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: center !important;
    gap: 4px !important;
    padding: 14px 16px !important;
    background: #fff !important;
    border: 2px solid #111 !important;
    border-radius: 0 !important;
    box-shadow: 5px 5px 0 #dc2626 !important;
    position: relative;
    overflow: visible !important;
  }
  .flagship-card-wrap :deep(.sub-row + .sub-row) {
    border-top: 2px solid #111 !important;
  }
  /* Circle number 1,2,3 มุมซ้ายบน */
  .flagship-card-wrap :deep(.sub-row::after) {
    position: absolute;
    top: -12px;
    left: -10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #dc2626;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(220,38,38,0.4);
    z-index: 2;
    border: 2px solid #fff;
  }
  .flagship-card-wrap :deep(.sub-row:nth-child(1))::after { content: '1'; }
  .flagship-card-wrap :deep(.sub-row:nth-child(2))::after { content: '2'; }
  .flagship-card-wrap :deep(.sub-row:nth-child(3))::after { content: '3'; }
  /* ลูกศร ↓ ระหว่างกล่อง (sub-row 2, 3) */
  .flagship-card-wrap :deep(.sub-row:nth-child(2))::before,
  .flagship-card-wrap :deep(.sub-row:nth-child(3))::before {
    content: '↓';
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    font-weight: 900;
    color: #dc2626;
    line-height: 1;
    z-index: 1;
  }
  .flagship-card-wrap :deep(.sub-title) {
    font-size: 13px !important;
    font-weight: 900 !important;
    text-align: center;
    color: #111 !important;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .flagship-card-wrap :deep(.sub-price) {
    font-size: 22px !important;
    font-weight: 900 !important;
    text-align: center;
    color: #dc2626 !important;
  }
}

@media (min-width: 600px) {
  /* Flagship layout:
     row 1: รูป 35% (1:1) + เนื้อหา 65%
     row 2: sub-courses-wrap (footer) เต็มกว้าง */
  .flagship-card-wrap {
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: flex-start;
    background: linear-gradient(180deg, #fff 60%, #eef2ff) !important;
  }
  /* ซ้าย: รูป 35%, 1:1 */
  .flagship-card-wrap :deep(.course-thumbnail) {
    flex: 0 0 35% !important;
    width: 35% !important;
    aspect-ratio: 1 / 1 !important;
    height: auto !important;
  }
  /* ขวา: card-body 65% */
  .flagship-card-wrap :deep(.card-body) {
    flex: 0 0 65% !important;
    width: 65% !important;
    min-width: 0;
    padding: 28px 32px !important;
    gap: 10px;
    display: flex;
    flex-direction: column;
  }
  .flagship-card-wrap :deep(.course-title) {
    font-size: 20px !important;
    font-weight: 800 !important;
    -webkit-line-clamp: unset !important;
    display: block !important;
    overflow: visible !important;
  }
  .flagship-card-wrap :deep(.course-desc) {
    font-size: 13px !important;
    line-height: 1.65 !important;
    display: block !important;
    -webkit-line-clamp: unset !important;
    overflow: visible !important;
  }
  .flagship-card-wrap :deep(.course-desc p) {
    margin: 0 0 6px;
  }
  /* learning points: แสดงครบ */
  .flagship-card-wrap :deep(.course-points) {
    max-height: none !important;
    overflow: visible !important;
  }
  .flagship-card-wrap :deep(.course-points li:nth-child(n+4)) {
    display: list-item !important;
  }
  /* ซ่อน stats row แยก — ย้าย stat ไปต่อท้ายราคาแทน (ผ่าน ::after price-block) */
  .flagship-card-wrap :deep(.course-stats) {
    display: none !important;
  }
  .flagship-card-wrap :deep(.course-footer) {
    border-top: 1px solid var(--border) !important;
    padding-top: 16px !important;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .flagship-card-wrap :deep(.price-amount) {
    font-size: 32px !important;
    font-weight: 900 !important;
    color: #dc2626 !important;
    text-shadow: 0 1px 2px rgba(220, 38, 38, 0.15);
  }
  .flagship-card-wrap :deep(.btn-detail) {
    padding: 12px 24px !important;
    font-size: 14px !important;
    border-radius: 10px !important;
  }
  /* Sub-courses: row 2 — sibling ของ card-body, flex-wrap ดันลงล่าง เต็มกว้าง 100% */
  .flagship-card-wrap :deep(.sub-courses-wrap) {
    flex: 0 0 100% !important;
    width: 100% !important;
    margin: 0 !important;
    background:
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
      linear-gradient(135deg, #0c1524 0%, #1e3a8a 50%, #0c1524 100%);
    border-radius: 0;
    padding: 34px 32px 32px !important;
    border-top: 2px solid #3b82f6 !important;
    position: relative;
  }
  /* HUD grid lines pattern (overflow-hidden เฉพาะตัว pattern เพื่อไม่ clip badge) */
  .flagship-card-wrap :deep(.sub-courses-wrap)::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
  .flagship-card-wrap :deep(.sub-courses-wrap) > * {
    position: relative;
    z-index: 1;
  }
  .flagship-card-wrap :deep(.sub-label) {
    display: none !important;
  }
  /* Stepper layout (match hero NL1+2 MASTERY):
     - 3 กล่องเหลี่ยม (ไม่โค้ง) + ลูกศร → ระหว่างกล่อง
     - กล่อง: white bg + red border + red shadow corner
     - circle number badge สีแดง มุมซ้ายบน
     - name สีดำหนา + price สีแดงใหญ่ */
  .flagship-card-wrap :deep(.sub-compact) {
    display: grid !important;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: stretch;
    gap: 8px;
    border: none !important;
    background: transparent;
    padding: 14px 6px 6px 6px;
  }
  /* กล่องเหลี่ยม + offset red shadow (HUD style) */
  .flagship-card-wrap :deep(.sub-row) {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 4px;
    padding: 16px 14px 14px 14px !important;
    border-radius: 0 !important;
    background: #fff !important;
    border: 2px solid #111 !important;
    box-shadow: 6px 6px 0 #dc2626;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
    overflow: visible;
  }
  .flagship-card-wrap :deep(.sub-row + .sub-row) {
    border-top: 2px solid #111 !important;
  }
  .flagship-card-wrap :deep(.sub-row:hover) {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 #dc2626;
  }
  /* Circle number badge แดง มุมซ้ายบน (1, 2, 3) */
  .flagship-card-wrap :deep(.sub-row::after) {
    position: absolute;
    top: -14px;
    left: -12px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #dc2626;
    color: #fff;
    font-weight: 900;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(220,38,38,0.4);
    z-index: 2;
    border: 2px solid #fff;
  }
  .flagship-card-wrap :deep(.sub-row:nth-child(1))::after { content: '1'; }
  .flagship-card-wrap :deep(.sub-row:nth-child(2))::after { content: '2'; }
  .flagship-card-wrap :deep(.sub-row:nth-child(3))::after { content: '3'; }
  /* placement ในกริด (ระยะให้ลูกศรลอย col 2, 4) */
  .flagship-card-wrap :deep(.sub-row:nth-child(1)) { grid-column: 1; }
  .flagship-card-wrap :deep(.sub-row:nth-child(2)) { grid-column: 3; }
  .flagship-card-wrap :deep(.sub-row:nth-child(3)) { grid-column: 5; }
  /* ลูกศร → ระหว่างกล่อง (ใช้ ::before เป็นตัวอักษร) */
  .flagship-card-wrap :deep(.sub-row:nth-child(2))::before,
  .flagship-card-wrap :deep(.sub-row:nth-child(3))::before {
    content: '→';
    position: absolute;
    left: -28px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 28px;
    font-weight: 900;
    color: #dc2626;
    line-height: 1;
    z-index: 1;
  }
  /* Name (sub-title) + Price */
  .flagship-card-wrap :deep(.sub-title) {
    font-size: 13px !important;
    font-weight: 900 !important;
    text-align: center;
    color: #111 !important;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .flagship-card-wrap :deep(.sub-price) {
    font-size: 22px !important;
    font-weight: 900 !important;
    text-align: center;
    color: #dc2626 !important;
    letter-spacing: 0.3px;
  }
}

/* ─── NLEX Section ─── */
.nlex-section {
  padding: 25px 0 40px;
}
.nlex-box {
  background: linear-gradient(135deg, #05070a 0%, #0c1524 50%, #0a1628 100%);
  border-radius: 25px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  border: 1px solid rgba(0,242,255,0.2);
}
.meqex-box {
  background: linear-gradient(135deg, #0a0508 0%, #1a0a12 50%, #2d1020 100%);
  border: 1px solid rgba(244,63,94,0.2);
}
.meqex-logo { color: #fb7185 !important; text-shadow: 0 0 20px rgba(244,63,94,0.4) !important; }
.meqex-badge { background: #f43f5e !important; }
.meqex-sub { color: #fb7185 !important; text-shadow: 0 0 8px rgba(244,63,94,0.5) !important; }

/* ─── Exam Combo Box (NLEX + MEQEX) ─── */
.exam-combo-box {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  padding: 0 !important;
  overflow: hidden;
}
.combo-half {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.combo-nlex { background: linear-gradient(135deg, #05070a 0%, #0c1524 100%); }
.combo-meqex { background: linear-gradient(135deg, #0a0508 0%, #1a0a12 100%); }
.combo-divider { width: 1px; background: rgba(255,255,255,0.1); flex-shrink: 0; }
.combo-top { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.combo-logo { font-size: 36px; font-weight: 900; color: #00f2ff; line-height: 1; text-shadow: 0 0 20px rgba(0,242,255,0.4); }
.combo-badge { background: #ef4444; color: #fff; font-size: 9px; font-weight: 800; padding: 3px 10px; border-radius: 5px; white-space: nowrap; }
.combo-mid { font-size: 14px; color: #cbd5e1; flex: 1; min-width: 160px; }
.combo-mid b { color: #fff; }
.combo-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.combo-tags span { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.combo-meqex .combo-tags span { color: #94a3b8; }

@media (max-width: 767px) {
  .exam-combo-box { flex-direction: column; }
  .combo-divider { width: auto; height: 1px; }
  .combo-half { padding: 20px; flex-direction: column; align-items: flex-start; }
  .combo-logo { font-size: 28px; }
}

@media (min-width: 900px) {
  .nlex-box {
    flex-direction: row;
    justify-content: space-between;
    padding: 40px 60px;
  }
  .nlex-left, .nlex-center {
    border-right: 1px solid rgba(255,255,255,0.1);
    padding-right: 40px;
  }
}

.nlex-left { flex-shrink: 0; text-align: center; }
.nlex-logo {
  font-size: 50px;
  font-weight: 900;
  color: #00f2ff;
  line-height: 1;
  text-shadow: 0 0 20px rgba(0,242,255,0.4);
}
.nlex-badge-red {
  display: inline-block;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.nlex-center { flex: 1; min-width: 160px; }
.nlex-big-num {
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
}
.nlex-big-num span { font-size: 18px; }
.nlex-sub-red {
  font-size: 13px;
  font-weight: 700;
  color: #ff3131;
  text-shadow: 0 0 8px rgba(255,49,49,0.5);
  margin-top: 4px;
}

.nlex-right { flex-shrink: 0; }
.nlex-features {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #fff;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Tags row */
.nlex-tags-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 25px;
  background: linear-gradient(135deg, #05070a 0%, #0c1524 50%, #0a1628 100%);
  border: 1px solid rgba(0,242,255,0.12);
  border-radius: 20px;
  flex-wrap: wrap;
  margin-top: 25px;
}
.nlex-tag { font-size: 14px; font-weight: 800; }
.nlex-tag.cyan { color: #00f2ff; text-shadow: 0 0 8px rgba(0,242,255,0.5); }
.nlex-tag.red { color: #ff3131; text-shadow: 0 0 10px rgba(255,49,49,0.6); }
.nlex-tag.blue { color: #38bdf8; text-shadow: 0 0 8px rgba(56,189,248,0.5); }
.nlex-dot { color: #334155; font-size: 20px; }

/* ─── Product Banners (8 cards, 4x2) ─── */
.product-banners {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 20px;
}
.pb-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}
.pb-card:hover {
  transform: translateY(-3px) scale(1.02);
}

/* Shared inner elements */
.pb-accent {
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
}
.pb-glow {
  position: absolute;
  width: 200px; height: 200px;
  border-radius: 50%;
  top: -60px; right: -40px;
  pointer-events: none;
}
.pb-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.pb-scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%);
  background-size: 100% 4px;
  pointer-events: none;
  opacity: 0.5;
}
.pb-deco {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  opacity: 0.1;
}
.pb-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.pb-dot {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  opacity: 0.3;
  animation: pb-float 6s ease-in-out infinite;
}
.pb-synapse .pb-dot { background: #8b5cf6; }
.pb-nlex .pb-dot { background: #06b6d4; }
.pb-ddx .pb-dot { background: #f97316; }
.pb-osce .pb-dot { background: #10b981; }
@keyframes pb-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
}
.pb-corner {
  position: absolute;
  bottom: 10px; right: 14px;
  display: flex; gap: 4px;
  z-index: 1;
}
.pb-corner span {
  width: 5px; height: 5px;
  border-radius: 50%;
}
.pb-synapse .pb-corner span { background: rgba(139,92,246,0.3); }
.pb-synapse .pb-corner span:last-child { background: #8b5cf6; }
.pb-nlex .pb-corner span { background: rgba(6,182,212,0.3); }
.pb-nlex .pb-corner span:last-child { background: #06b6d4; }
.pb-ddx .pb-corner span { background: rgba(249,115,22,0.3); }
.pb-ddx .pb-corner span:last-child { background: #f97316; }
.pb-osce .pb-corner span { background: rgba(16,185,129,0.3); }
.pb-osce .pb-corner span:last-child { background: #10b981; }
.pb-corner span:last-child {
  animation: pb-pulse 2s ease-in-out infinite;
}
@keyframes pb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.pb-icon {
  font-size: 36px;
  position: relative;
  z-index: 1;
}
.pb-body {
  position: relative;
  z-index: 1;
  margin-top: auto;
}
.pb-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.pb-name {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 2px;
  line-height: 1.1;
}
.pb-name small {
  display: block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  opacity: 0.7;
}
.pb-desc {
  color: rgba(255,255,255,0.55);
  font-size: 12px;
  margin-top: 6px;
  line-height: 1.4;
  min-height: 2.8em;
}

/* — SYNAPSE (Purple) — */
.pb-synapse {
  background: linear-gradient(135deg, #150e26 0%, #1e1048 40%, #2d1a6e 100%);
  box-shadow: 0 4px 20px rgba(139,92,246,0.2);
  border: 1px solid rgba(139,92,246,0.15);
}
.pb-synapse:hover { box-shadow: 0 8px 32px rgba(139,92,246,0.35); }
.pb-synapse .pb-accent { background: linear-gradient(90deg, #8b5cf6, #a78bfa, #8b5cf6); }
.pb-synapse .pb-glow { background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%); }
.pb-synapse .pb-grid {
  background-image:
    linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-synapse .pb-badge { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; }
.pb-synapse .pb-name { color: #a78bfa; }
.pb-synapse .pb-name small { color: #c4b5fd; }
.pb-synapse .pb-desc strong { color: #a78bfa; }

/* — ATLAS (Blue) — */
.pb-atlas {
  background: linear-gradient(135deg, #0a1428 0%, #0c2048 40%, #0e2d6e 100%);
  box-shadow: 0 4px 20px rgba(59,130,246,0.2);
  border: 1px solid rgba(59,130,246,0.15);
}
.pb-atlas:hover { box-shadow: 0 8px 32px rgba(59,130,246,0.35); }
.pb-atlas .pb-accent { background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6); }
.pb-atlas .pb-glow { background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); }
.pb-atlas .pb-grid {
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-atlas .pb-badge { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
.pb-atlas .pb-name { color: #60a5fa; }
.pb-atlas .pb-name small { color: #93bbfd; }
.pb-atlas .pb-desc strong { color: #60a5fa; }
.pb-atlas .pb-dot { background: #3b82f6; }
.pb-atlas .pb-corner span { background: rgba(59,130,246,0.3); }
.pb-atlas .pb-corner span:last-child { background: #3b82f6; }

/* — NLEX (Cyan) — */
.pb-nlex {
  background: linear-gradient(135deg, #0e1726 0%, #0c2d48 40%, #0e4a6e 100%);
  box-shadow: 0 4px 20px rgba(6,182,212,0.2);
  border: 1px solid rgba(6,182,212,0.15);
}
.pb-nlex:hover { box-shadow: 0 8px 32px rgba(6,182,212,0.35); }
.pb-nlex .pb-accent { background: linear-gradient(90deg, #06b6d4, #22d3ee, #06b6d4); }
.pb-nlex .pb-glow { background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%); }
.pb-nlex .pb-grid {
  background-image:
    linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-nlex .pb-badge { background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; }
.pb-nlex .pb-name { color: #22d3ee; }
.pb-nlex .pb-name small { color: #67e8f9; }
.pb-nlex .pb-desc strong { color: #22d3ee; }

/* — MEQEX (Rose/Pink) — */
.pb-meqex {
  background: linear-gradient(135deg, #1a0a12 0%, #2d1020 40%, #3d1530 100%);
  box-shadow: 0 4px 20px rgba(244,63,94,0.2);
  border: 1px solid rgba(244,63,94,0.15);
}
.pb-meqex:hover { box-shadow: 0 8px 32px rgba(244,63,94,0.35); }
.pb-meqex .pb-accent { background: linear-gradient(90deg, #f43f5e, #fb7185, #f43f5e); }
.pb-meqex .pb-glow { background: radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%); }
.pb-meqex .pb-grid {
  background-image:
    linear-gradient(rgba(244,63,94,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(244,63,94,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-meqex .pb-badge { background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); color: #fb7185; }
.pb-meqex .pb-name { color: #fb7185; }
.pb-meqex .pb-name small { color: #fda4af; }
.pb-meqex .pb-desc strong { color: #fb7185; }
.pb-meqex .pb-dot { background: #f43f5e; }
.pb-meqex .pb-corner span { background: rgba(244,63,94,0.3); }
.pb-meqex .pb-corner span:last-child { background: #f43f5e; }

/* — DDx (Orange) — */
.pb-ddx {
  background: linear-gradient(135deg, #1a0f07 0%, #2d1810 40%, #3d1f0e 100%);
  box-shadow: 0 4px 20px rgba(249,115,22,0.2);
  border: 1px solid rgba(249,115,22,0.15);
}
.pb-ddx:hover { box-shadow: 0 8px 32px rgba(249,115,22,0.35); }
.pb-ddx .pb-accent { background: linear-gradient(90deg, #f97316, #fb923c, #f97316); }
.pb-ddx .pb-glow { background: radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%); }
.pb-ddx .pb-grid {
  background-image:
    linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-ddx .pb-badge { background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); color: #fb923c; }
.pb-ddx .pb-name { color: #fb923c; }
.pb-ddx .pb-name small { color: #fdba74; }
.pb-ddx .pb-desc strong { color: #fb923c; }

/* — OSCE (Green) — */
.pb-osce {
  background: linear-gradient(135deg, #071a12 0%, #0c2d1e 40%, #0e3d28 100%);
  box-shadow: 0 4px 20px rgba(16,185,129,0.2);
  border: 1px solid rgba(16,185,129,0.15);
}
.pb-osce:hover { box-shadow: 0 8px 32px rgba(16,185,129,0.35); }
.pb-osce .pb-accent { background: linear-gradient(90deg, #10b981, #34d399, #10b981); }
.pb-osce .pb-glow { background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%); }
.pb-osce .pb-grid {
  background-image:
    linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-osce .pb-badge { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
.pb-osce .pb-name { color: #34d399; }
.pb-osce .pb-name small { color: #6ee7b7; }
.pb-osce .pb-desc strong { color: #34d399; }

/* — LONGEX (Amber/Yellow) — */
.pb-longex {
  background: linear-gradient(135deg, #1a150a 0%, #2d2210 40%, #3d2f0e 100%);
  box-shadow: 0 4px 20px rgba(245,158,11,0.2);
  border: 1px solid rgba(245,158,11,0.15);
}
.pb-longex:hover { box-shadow: 0 8px 32px rgba(245,158,11,0.35); }
.pb-longex .pb-accent { background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b); }
.pb-longex .pb-glow { background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%); }
.pb-longex .pb-grid {
  background-image:
    linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-longex .pb-badge { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
.pb-longex .pb-name { color: #fbbf24; }
.pb-longex .pb-name small { color: #fde68a; }
.pb-longex .pb-desc strong { color: #fbbf24; }
.pb-longex .pb-dot { background: #f59e0b; }
.pb-longex .pb-corner span { background: rgba(245,158,11,0.3); }
.pb-longex .pb-corner span:last-child { background: #f59e0b; }

/* — 15xSKILL (Indigo) — */
.pb-skill {
  background: linear-gradient(135deg, #0f0e1a 0%, #1a1848 40%, #25206e 100%);
  box-shadow: 0 4px 20px rgba(99,102,241,0.2);
  border: 1px solid rgba(99,102,241,0.15);
}
.pb-skill:hover { box-shadow: 0 8px 32px rgba(99,102,241,0.35); }
.pb-skill .pb-accent { background: linear-gradient(90deg, #6366f1, #818cf8, #6366f1); }
.pb-skill .pb-glow { background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%); }
.pb-skill .pb-grid {
  background-image:
    linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}
.pb-skill .pb-badge { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #818cf8; }
.pb-skill .pb-name { color: #818cf8; }
.pb-skill .pb-name small { color: #a5b4fc; }
.pb-skill .pb-desc strong { color: #818cf8; }
.pb-skill .pb-dot { background: #6366f1; }
.pb-skill .pb-corner span { background: rgba(99,102,241,0.3); }
.pb-skill .pb-corner span:last-child { background: #6366f1; }

/* Product banners responsive */
@media (max-width: 1280px) {
  .product-banners { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 1024px) {
  .product-banners { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .product-banners { grid-template-columns: 1fr 1fr; gap: 10px; }
  .pb-card { padding: 16px 14px; gap: 10px; }
  .pb-icon { font-size: 28px; }
  .pb-name { font-size: 22px; letter-spacing: 1px; }
  .pb-name small { font-size: 11px; }
  .pb-desc { font-size: 11px; }
  .pb-badge { font-size: 9px; padding: 2px 8px; }
}

/* ─── Introduce Video (dark showcase style) ─── */
.intro-box {
  background: linear-gradient(135deg, #05070a 0%, #0c1524 50%, #0a1628 100%);
  border: 1px solid rgba(0,242,255,0.12);
  border-radius: 25px;
  padding: 40px;
  display: flex;
  gap: 40px;
  align-items: center;
  margin-top: 25px;
}
.intro-video-side { flex: 1.2; min-width: 300px; }
.intro-info-side { flex: 0 0 340px; }
.intro-video-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}
.intro-video-wrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}
@media (max-width: 900px) {
  .intro-box { flex-direction: column; padding: 24px 16px; gap: 24px; }
  .intro-info-side { flex: none; }
  .intro-video-side { flex: none; width: 100%; }
}

/* ─── Intro Video Modal ─── */
.intro-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
}
.intro-modal-box {
  position: relative;
  width: 100%;
  max-width: 820px;
}
.intro-modal-close {
  position: absolute;
  top: -44px;
  right: 0;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
}
.intro-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
.intro-modal-player {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.intro-modal-player iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Modal transition */
.modal-fade-enter-active { transition: opacity 0.3s ease; }
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

/* ─── LMS Streaming Section ─── */
.lms-section { padding: 0 0 40px; }
.lms-box {
  background: linear-gradient(135deg, #05070a 0%, #0c1524 50%, #0a1628 100%);
  border-radius: 25px;
  padding: 40px;
  display: flex;
  gap: 40px;
  align-items: center;
  border: 1px solid rgba(0,242,255,0.12);
  overflow: hidden;
}

/* Mockup (ซ้าย) */
.lms-mockup { flex: 1; min-width: 0; }
.mock-browser {
  background: #1c1d1f;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
}
.mock-topbar {
  background: #2a2b2e;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mock-dots { display: flex; gap: 5px; }
.mock-dots span {
  width: 8px; height: 8px; border-radius: 50%;
}
.mock-dots span:nth-child(1) { background: #ff5f57; }
.mock-dots span:nth-child(2) { background: #febc2e; }
.mock-dots span:nth-child(3) { background: #28c840; }
.mock-url {
  flex: 1;
  background: #1c1d1f;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 10px;
  color: #64748b;
  font-family: monospace;
}

.mock-layout {
  display: flex;
}
.mock-screenshot {
  flex: 1;
  background: #0f0f0f;
  min-width: 0;
}
.mock-screenshot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mock-sidebar {
  width: 130px;
  background: #141416;
  padding: 8px;
  border-left: 1px solid #222;
  flex-shrink: 0;
}
.mock-playlist-title {
  font-size: 8px;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 6px;
  padding: 0 2px;
}
.mock-item {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 4px;
  margin-bottom: 4px;
}
.mock-item.active { background: rgba(168,85,247,0.15); }
.mock-thumb {
  width: 32px;
  height: 20px;
  background: #2a2a2e;
  border-radius: 3px;
  flex-shrink: 0;
}
.mock-item.active .mock-thumb { background: #a855f7; }
.mock-info { flex: 1; min-width: 0; }
.mock-name {
  height: 5px;
  background: #333;
  border-radius: 2px;
  margin-bottom: 3px;
  width: 80%;
}
.mock-dur {
  height: 4px;
  background: #222;
  border-radius: 2px;
  width: 50%;
}

/* Info (ขวา) */
.lms-info { flex: 0 0 340px; }
.lms-badge {
  display: inline-block;
  background: #dc2626;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 6px;
  letter-spacing: 1px;
  margin-bottom: 14px;
}
.lms-title {
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 10px;
}
.lms-subtitle {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 24px;
}
.lms-netflix {
  color: #e50914;
  font-weight: 800;
}
.lms-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.lms-features li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #e2e8f0;
}
.lms-features li b {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1px;
}
.lms-features li span {
  display: block;
  font-size: 12px;
  color: #94a3b8;
}
.lms-feat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.lms-feat-cyan   { background: rgba(6,182,212,0.15); color: #06b6d4; }
.lms-feat-purple { background: rgba(168,85,247,0.15); color: #a855f7; }
.lms-feat-blue   { background: rgba(59,130,246,0.15); color: #3b82f6; }
.lms-feat-green  { background: rgba(34,197,94,0.15);  color: #22c55e; }
.lms-feat-red    { background: rgba(239,68,68,0.15);  color: #ef4444; }

@media (max-width: 900px) {
  .lms-box { flex-direction: column; padding: 24px 16px; gap: 24px; }
  .lms-info { flex: none; }
  .lms-title { font-size: 22px; }
  .mock-sidebar { display: none; }
  .mock-browser { border-radius: 8px; }
  .mock-topbar { padding: 6px 10px; }
  .mock-url { font-size: 9px; padding: 3px 8px; }
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .nlex-box { padding: 24px 20px; }
  .nlex-box { text-align: center; }
  .nlex-features { text-align: left; }
  .nlex-tags-row { gap: 8px; }
  .nlex-tag { font-size: 11px; }
  .section-header { flex-direction: column; align-items: flex-start; }
  .intro-header { margin-top: 24px; margin-bottom: 14px; }
  .intro-title { font-size: 18px; }
}
/* ─── Module Ticker ─── */
.module-ticker {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 0;
}
.ticker-overflow {
  overflow: hidden;
}
.module-ticker + .section { padding-top: 16px; }
.ticker-track {
  display: flex;
  gap: 32px;
  white-space: nowrap;
  animation: ticker-scroll 40s linear infinite;
  width: max-content;
}
.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ticker-icon { font-size: 16px; line-height: 1; }
.ticker-icon img { width: 16px; height: 16px; vertical-align: middle; }
.ticker-name {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
}
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@media (max-width: 768px) {
  .module-ticker { padding: 8px 0; }
  .ticker-track { gap: 20px; animation-duration: 30s; }
  .ticker-icon { font-size: 14px; }
  .ticker-icon img { width: 14px; height: 14px; }
  .ticker-name { font-size: 11px; }
}

/* ═══════════════════ VIRTUAL PATIENT BANNER ═══════════════════ */
.vp-section { padding: 0 0 40px; }
.vp-banner {
  --vp-ink: #0a0a0a;
  --vp-pur: #8b5cf6;
  --vp-red: #e63946;
  --vp-teal: #0d9488;
  --vp-paper: #fafaf7;
  display: block;
  text-decoration: none;
  width: 100%;
  aspect-ratio: 1200 / 630;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--vp-paper);
  background-image: radial-gradient(circle, rgba(10,10,10,0.06) 1.2px, transparent 1.2px);
  background-size: 22px 22px;
  color: var(--vp-ink);
  position: relative;
  overflow: hidden;
  border: 2px solid var(--vp-ink);
  border-radius: 16px;
  box-shadow: 14px 14px 0 rgba(139,92,246,0.4);
  padding: 50px 65px;
  font-family: 'IBM Plex Sans Thai', 'Noto Sans Thai', sans-serif;
  transition: transform 0.18s, box-shadow 0.18s;
}
.vp-banner:hover {
  transform: translate(-3px, -3px);
  box-shadow: 17px 17px 0 rgba(139,92,246,0.5);
}
.vp-monogram {
  position: absolute;
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  color: var(--vp-ink);
  opacity: 0.04;
  letter-spacing: -10px;
  user-select: none;
  pointer-events: none;
  line-height: 0.8;
  z-index: 0;
  font-size: 480px;
  top: -50px;
  right: -50px;
}
.vp-scan {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--vp-pur), transparent);
  opacity: 0.4;
  z-index: 1;
  top: 200px;
}
.vp-br { position: absolute; width: 44px; height: 44px; z-index: 6; }
.vp-br::before, .vp-br::after { content: ''; position: absolute; background: var(--vp-ink); }
.vp-tl { top: 14px; left: 14px; }
.vp-tl::before { top: 0; left: 0; width: 44px; height: 5px; }
.vp-tl::after  { top: 0; left: 0; width: 5px; height: 44px; }
.vp-tr { top: 14px; right: 14px; }
.vp-tr::before { top: 0; right: 0; width: 44px; height: 5px; }
.vp-tr::after  { top: 0; right: 0; width: 5px; height: 44px; }
.vp-bl { bottom: 14px; left: 14px; }
.vp-bl::before { bottom: 0; left: 0; width: 44px; height: 5px; }
.vp-bl::after  { bottom: 0; left: 0; width: 5px; height: 44px; }
.vp-br2 { bottom: 14px; right: 14px; }
.vp-br2::before { bottom: 0; right: 0; width: 44px; height: 5px; }
.vp-br2::after  { bottom: 0; right: 0; width: 5px; height: 44px; }
.vp-corner-tag {
  position: absolute;
  top: 30px; left: 30px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  background: var(--vp-ink);
  color: #fff;
  padding: 6px 11px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.vp-dot {
  width: 6px; height: 6px;
  background: var(--vp-red);
  border-radius: 50%;
  animation: vp-pulse 1.4s infinite;
}
@keyframes vp-pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.3); }
}
.vp-brand {
  position: absolute;
  top: 30px; right: 56px;
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  font-size: 16px;
  letter-spacing: 3px;
  color: var(--vp-ink);
  z-index: 5;
  white-space: nowrap;
}
.vp-brand .vp-pur { color: var(--vp-pur); }
.vp-stage {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 40px;
  align-items: center;
  position: relative;
  z-index: 2;
}
.vp-mascot-wrap {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 520px;
  height: 620px;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.vp-mascot-wrap .vp-glow {
  position: absolute;
  width: 95%; height: 95%;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(139,92,246,0) 65%);
  z-index: 0;
  pointer-events: none;
}
.vp-mascot-wrap img {
  width: 100%; height: 100%;
  object-fit: contain;
  object-position: bottom;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 14px 24px rgba(0,0,0,0.22));
}
.vp-label {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  letter-spacing: 3px;
  font-size: 14px;
  color: var(--vp-red);
  margin-bottom: 22px;
  font-weight: 700;
}
.vp-headline {
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  line-height: 0.88;
  letter-spacing: 4px;
  color: var(--vp-ink);
  font-size: 112px;
  margin-bottom: 14px;
  font-weight: 400;
}
.vp-headline .vp-pur {
  color: var(--vp-pur);
  position: relative;
  display: inline-block;
}
.vp-headline .vp-pur::after {
  content: '';
  position: absolute;
  left: 0; bottom: 6px;
  width: 100%; height: 6px;
  background: var(--vp-pur);
  opacity: 0.2;
  z-index: -1;
}
.vp-sub {
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-ink);
  line-height: 1.5;
  margin-bottom: 18px;
  max-width: 520px;
}
.vp-sub b { color: var(--vp-pur); }
.vp-pills {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 26px;
}
.vp-pills .vp-pill {
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  letter-spacing: 2px;
  background: #fff;
  color: var(--vp-ink);
  border: 2px solid var(--vp-ink);
  padding: 6px 12px;
  box-shadow: 3px 3px 0 var(--vp-ink);
  font-size: 16px;
}
.vp-pills .vp-meq  { color: var(--vp-pur); }
.vp-pills .vp-osce { color: var(--vp-teal); }
.vp-pills .vp-lc   { color: var(--vp-red); }
.vp-pills .vp-for {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  letter-spacing: 3px;
  font-size: 12px;
  color: var(--vp-ink);
  margin-right: 4px;
  font-weight: 700;
}
.vp-cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--vp-ink);
  color: #fff;
  border: 2px solid var(--vp-ink);
  box-shadow: 5px 5px 0 var(--vp-pur);
  padding: 13px 26px;
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  letter-spacing: 2.5px;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  font-size: 22px;
}
.vp-cta::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent);
  animation: vp-shine 3s infinite;
}
@keyframes vp-shine { 100% { left: 100%; } }
.vp-cta .vp-arrow { font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 700; }
.vp-right {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18px;
}
.vp-logo-orb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  flex-shrink: 0;
  width: 240px;
  height: 240px;
}
.vp-logo-orb::after {
  content: '';
  position: absolute;
  inset: -22px;
  border-radius: 50%;
  border: 3px dashed var(--vp-pur);
  opacity: 0.9;
  animation: vp-spin 8s linear infinite;
}
.vp-logo-orb::before {
  content: '';
  position: absolute;
  inset: -40px;
  border-radius: 50%;
  border: 3px dotted var(--vp-ink);
  opacity: 0.55;
  animation: vp-spin 14s linear infinite reverse;
}
.vp-ring-inner {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  border-top-color: var(--vp-pur);
  border-right-color: var(--vp-pur);
  opacity: 0.85;
  animation: vp-spin 4s linear infinite;
  pointer-events: none;
}
.vp-logo-orb img {
  width: 100%; height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(139,92,246,0.45));
  position: relative;
  z-index: 1;
}
@keyframes vp-spin { to { transform: rotate(360deg); } }
.vp-bubble {
  background: #fff;
  border: 2.5px solid var(--vp-ink);
  box-shadow: 4px 4px 0 var(--vp-ink);
  padding: 11px 15px;
  font-size: 14px;
  color: var(--vp-ink);
  position: relative;
  font-weight: 500;
  z-index: 2;
  max-width: 340px;
}
.vp-bubble::before {
  content: '';
  position: absolute;
  width: 14px; height: 14px;
  background: #fff;
  border-left: 2.5px solid var(--vp-ink);
  border-bottom: 2.5px solid var(--vp-ink);
}
.vp-bubble.vp-dark { background: var(--vp-ink); color: #fff; }
.vp-bubble.vp-dark::before { background: var(--vp-ink); border-color: var(--vp-ink); }
.vp-bubble.vp-b1::before { left: 30px; bottom: -10px; transform: rotate(-45deg); }
.vp-bubble.vp-b2 { align-self: flex-end; }
.vp-bubble.vp-b2::before { right: 30px; top: -10px; transform: rotate(135deg); }
.vp-typing {
  display: inline-flex;
  gap: 4px;
  margin-left: 6px;
  align-items: center;
}
.vp-typing span {
  width: 6px; height: 6px;
  background: var(--vp-pur);
  border-radius: 50%;
  animation: vp-typing 1.4s infinite;
}
.vp-typing span:nth-child(2) { animation-delay: 0.2s; }
.vp-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes vp-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
/* Mobile = ใช้ layout เดียวกับ desktop แต่ย่อ scale ทั้งก้อน (จอ tablet) */
@media (max-width: 1240px) and (min-width: 901px) {
  .vp-banner {
    width: 1200px;
    transform: scale(calc((100vw - 32px) / 1200));
    transform-origin: top center;
    margin: 0 auto;
    margin-bottom: calc((630px * ((100vw - 32px) / 1200)) - 630px);
  }
  .vp-section {
    overflow: hidden;
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* Mobile = ตัด bubbles ออก, ย้าย logo orb ไปมุมขวาบน */
@media (max-width: 900px) {
  .vp-section { padding: 0 16px 30px; }
  .vp-banner {
    aspect-ratio: auto;
    width: 100%;
    max-width: 500px;
    padding: 24px 26px 0;
    box-shadow: 8px 8px 0 rgba(139,92,246,0.4);
    border-radius: 14px;
    min-height: 380px;
  }
  .vp-monogram { font-size: 280px; top: -30px; right: -30px; }
  .vp-scan { top: 130px; }
  .vp-corner-tag { top: 20px; left: 20px; font-size: 8px; padding: 4px 8px; }
  .vp-brand { display: none; }
  .vp-br { width: 28px; height: 28px; }
  .vp-tl, .vp-tr { top: 8px; }
  .vp-tl { left: 8px; }
  .vp-tr { right: 8px; }
  .vp-bl { bottom: 8px; left: 8px; }
  .vp-br2 { bottom: 8px; right: 8px; }
  .vp-tl::before, .vp-tr::before, .vp-bl::before, .vp-br2::before { width: 28px; height: 3px; }
  .vp-tl::after, .vp-tr::after, .vp-bl::after, .vp-br2::after { width: 3px; height: 28px; }

  .vp-stage {
    grid-template-columns: 1fr;
    gap: 0;
    align-items: start;
    padding-top: 30px;
  }
  /* แสดงเฉพาะ logo orb ใน right panel, ซ่อน bubbles + ย้ายไปมุมขวาบน */
  .vp-right {
    position: absolute;
    top: 50px;
    right: 24px;
    z-index: 5;
    display: block;
    height: auto;
    padding: 0;
  }
  .vp-right .vp-bubble { display: none; }
  .vp-logo-orb { width: 70px; height: 70px; margin: 0; }
  .vp-logo-orb::after { inset: -8px; border-width: 2px; }
  .vp-logo-orb::before { inset: -16px; border-width: 2px; }

  .vp-left { position: relative; z-index: 4; max-width: 60%; }
  .vp-label { font-size: 10px; letter-spacing: 2px; margin-bottom: 12px; }
  .vp-headline { font-size: 56px; letter-spacing: 2px; margin-bottom: 10px; }
  .vp-headline .vp-pur::after { height: 4px; bottom: 3px; }
  .vp-sub { font-size: 13px; margin-bottom: 12px; max-width: 100%; }
  .vp-pills { margin-bottom: 16px; gap: 5px; }
  .vp-pills .vp-pill { font-size: 11px; padding: 4px 8px; box-shadow: 2px 2px 0 var(--vp-ink); }
  .vp-pills .vp-for { font-size: 9px; letter-spacing: 2px; }
  .vp-cta { font-size: 11px; padding: 7px 12px; letter-spacing: 1px; box-shadow: 3px 3px 0 var(--vp-pur); gap: 6px; }
  .vp-cta .vp-arrow { font-size: 12px; }

  .vp-mascot-wrap {
    width: 220px;
    height: 300px;
    left: auto;
    right: 0;
    bottom: 0;
    transform: none;
  }
}

@media (max-width: 420px) {
  .vp-headline { font-size: 44px; }
  .vp-left { max-width: 62%; }
  .vp-mascot-wrap { width: 180px; height: 250px; }
  .vp-logo-orb { width: 60px; height: 60px; }
  .vp-right { top: 46px; right: 20px; }
}
</style>
