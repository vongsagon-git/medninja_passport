<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ⭐ Video สำหรับ landing page ขาย — ORIGINAL MP4 (ไม่ encrypt) เพื่อไม่ติด browser/OS ใด ๆ
const VIDEO_ID = '60985cb97db271f1976fe7e7c7690102'
// ⭐ Landing endpoint = public (no auth, no chrome guard) — สำหรับหน้าขาย
const PLAYAUTH_ENDPOINT = `/api/china/landing-playauth/${VIDEO_ID}`

const playerReady = ref(false)
const modalOpen = ref(false)
const errorMsg = ref('')
const isPlaying = ref(false)
const needsUserClick = ref(false) // แสดง overlay ปุ่มเล่นถ้า autoplay โดน block

let player = null

// ─── Aliplayer SDK loader — self-hosted ก่อน แล้ว fallback CDN Alibaba ───
const ALIPLAYER_VERSIONS = [
  { path: 'self-hosted', v: '2.15.4', jsUrl: '/vendor/aliplayer/aliplayer.js', cssUrl: '/vendor/aliplayer/aliplayer.css' },
  { path: 'de/prismplayer', v: '2.15.4' },
  { path: 'apsara-media-box/imp-web-player', v: '2.27.0' }
]

function waitForAliplayer(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setInterval(() => {
      if (window.Aliplayer) {
        clearInterval(timer)
        resolve()
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        reject(new Error('Aliplayer SDK timeout'))
      }
    }, 200)
  })
}

function loadScriptWithFallback(versions, idx = 0) {
  return new Promise((resolve, reject) => {
    if (idx >= versions.length) return reject(new Error('SDK ทุก version fail'))
    if (window.Aliplayer) return resolve()

    const { path: sdkPath, v, jsUrl, cssUrl } = versions[idx]
    const finalJs = jsUrl || `https://g.alicdn.com/${sdkPath}/${v}/aliplayer-min.js`
    const finalCss = cssUrl || `https://g.alicdn.com/${sdkPath}/${v}/skins/default/aliplayer-min.css`

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = finalCss
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = finalJs
    script.async = false
    script.onload = async () => {
      try { await waitForAliplayer(30000); resolve() }
      catch { loadScriptWithFallback(versions, idx + 1).then(resolve).catch(reject) }
    }
    script.onerror = () => loadScriptWithFallback(versions, idx + 1).then(resolve).catch(reject)
    document.head.appendChild(script)
  })
}

async function fetchPlayAuth() {
  const res = await fetch(PLAYAUTH_ENDPOINT)
  if (!res.ok) throw new Error(`โหลดวิดีโอไม่สำเร็จ (${res.status})`)
  const data = await res.json()
  if (!data.playAuth) throw new Error('ไม่ได้ playAuth')
  return data.playAuth
}

async function initPlayer() {
  try {
    await loadScriptWithFallback(ALIPLAYER_VERSIONS)
    if (!window.Aliplayer) throw new Error('Aliplayer SDK ไม่พร้อม')

    const playAuth = await fetchPlayAuth()

    // ⭐ FORCE Original stream (mov, unencrypted, 4K) — เล่นได้ทุก device
    //   Video มี 3 streams: Original mov (ไม่ encrypt) + HD m3u8 Ali Private + HD m3u8 DRM
    //   Original = mov (ไม่ใช่ mp4!) → ห้าม set format: 'mp4' (จะได้ NoneStream error)
    //   แค่ set definition: 'OD' + mediaType: 'video' → Aliplayer เลือก Original mov ให้เอง
    const playerConfig = {
      id: 'landing-player',
      vid: VIDEO_ID,
      playauth: playAuth,
      width: '100%',
      height: '100%',
      autoplay: false,
      isLive: false,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'hover',
      useH5Prism: true,
      mediaType: 'video',
      definition: 'OD',           // Original Definition (unencrypted)
      defaultDefinition: 'OD',
      license: {
        domain: 'passport.medninja.academy',
        key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
      }
    }

    player = new window.Aliplayer(playerConfig, function () {
      playerReady.value = true
      // ⭐ ไม่ auto play — แสดงปุ่มกดเล่นสวยของเราแทน
      needsUserClick.value = true
    })

    player.on('play', () => {
      isPlaying.value = true
      needsUserClick.value = false
    })
    player.on('playing', () => {
      isPlaying.value = true
      needsUserClick.value = false
    })
    player.on('pause', () => {
      isPlaying.value = false
    })

    player.on('error', (e) => {
      const details = e?.paramData ? JSON.stringify(e.paramData) : (e?.message || 'เล่นวิดีโอไม่ได้')
      errorMsg.value = details
    })
    // ⭐ วิดีโอจบ → ปิด modal auto
    player.on('ended', () => {
      setTimeout(() => closeVideo(), 300)
    })
  } catch (err) {
    errorMsg.value = err.message
  }
}

function openVideo() {
  modalOpen.value = true
  errorMsg.value = ''
  // รอ DOM render ก่อน init player
  setTimeout(() => { if (!player) initPlayer() }, 50)
  document.body.style.overflow = 'hidden'
}

function closeVideo() {
  modalOpen.value = false
  document.body.style.overflow = ''
  needsUserClick.value = false
  isPlaying.value = false
  if (player) {
    try { player.pause() } catch {}
  }
}

// ⭐ User click overlay play button → play (มีเสียงเต็ม)
function handlePlayClick() {
  needsUserClick.value = false
  if (!player) return
  try { player.play() } catch {}
}

function scrollToVideo() {
  openVideo()
}

function contactLine() {
  window.open('https://lin.ee/nEEK4Kv', '_blank')
}

// ⭐ WeChat — ID จริงของ tammy (หมอแตม)
const WECHAT_ID = 'medninja'
// weixin:// deep link → เปิดแอป WeChat ตรง ๆ (มือถือที่ติดตั้งแอปไว้)
const WECHAT_DEEP_LINK = `weixin://dl/chat?${WECHAT_ID}`

const wechatModalOpen = ref(false)
const wechatId = ref(WECHAT_ID)
const copied = ref(false)

function openWechat() {
  wechatModalOpen.value = true
  copied.value = false
}
function closeWechat() {
  wechatModalOpen.value = false
}
function copyWechatId() {
  const doAlert = () => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(WECHAT_ID)
      .then(doAlert)
      .catch(() => { doAlert() })
  } else {
    doAlert()
  }
}
function openWechatApp() {
  // ลอง deep link ก่อน — มือถือที่มีแอปจะกระโดดเข้า WeChat
  window.location.href = WECHAT_DEEP_LINK
}

// ⭐ Trial modal — coming soon
const trialModalOpen = ref(false)
function openTrial() { trialModalOpen.value = true }
function closeTrial() { trialModalOpen.value = false }

// ⭐ PDF lead modal — เก็บ email/เบอร์/wechat แล้วส่ง PDF ทีหลัง
const pdfModalOpen = ref(false)
const pdfForm = ref({ name: '', email: '', phone: '', wechat: '' })
const pdfSubmitting = ref(false)
const pdfError = ref('')
const pdfSuccess = ref(false)

function openPdf() {
  pdfModalOpen.value = true
  pdfError.value = ''
  pdfSuccess.value = false
}
function closePdf() {
  pdfModalOpen.value = false
  if (pdfSuccess.value) {
    // reset หลังปิด modal สำเร็จ
    pdfForm.value = { name: '', email: '', phone: '', wechat: '' }
    pdfSuccess.value = false
  }
}
async function submitPdfLead() {
  pdfError.value = ''
  const { name, email, phone, wechat } = pdfForm.value
  if (!email.trim() && !phone.trim() && !wechat.trim()) {
    pdfError.value = 'กรุณากรอก email, เบอร์โทร หรือ WeChat ID อย่างน้อย 1 ช่อง'
    return
  }
  pdfSubmitting.value = true
  try {
    const res = await fetch('/api/china/pdf-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, wechat })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `ส่งไม่สำเร็จ (${res.status})`)
    }
    pdfSuccess.value = true
  } catch (e) {
    pdfError.value = e.message || 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง'
  } finally {
    pdfSubmitting.value = false
  }
}

onMounted(() => {
  document.title = 'MedNinja LMS — ดูได้ทั่วโลก แม้ในประเทศจีน (ไม่ต้อง VPN)'
  // ⭐ Auto-open modal โฆษณาทันทีที่เข้าเว็บ
  openVideo()
})

onUnmounted(() => {
  if (player) {
    try { player.dispose() } catch {}
  }
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="landing">
    <!-- ═══════════════ SINGLE-VIEW HERO ═══════════════ -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="hero-globe"></div>

      <div class="hero-inner">
        <div class="hero-copy">
          <div class="hero-badge">
            <span class="dot"></span>
            ระบบพร้อมใช้งานในจีนแล้ววันนี้
          </div>

          <h1 class="hero-title">
            <span class="line">MedNinja</span>
            <span class="line highlight-box">LMS</span>
            <span class="line">ดูได้ทั่วโลก</span>
            <span class="line line-sm">ประเทศ<span class="cn-red">จีน</span>ก็ดูได้</span>
            <span class="line line-sm">ไม่ต้องใช้ <span class="cn-red">VPN</span></span>
          </h1>

          <div class="hero-features">
            <div class="feat-card">
              <div class="feat-icon">🌐</div>
              <div class="feat-label"><strong>ดูได้ทุกที่</strong><br><span>ทุกประเทศ</span></div>
            </div>
            <div class="feat-card">
              <div class="feat-icon">⚡</div>
              <div class="feat-label"><strong>เร็ว เสถียร</strong><br><span>ไม่มี lag</span></div>
            </div>
            <div class="feat-card">
              <div class="feat-icon">🛡️</div>
              <div class="feat-label"><strong>ปลอดภัย</strong><br><span>เจ้าเดียวที่ทำได้</span></div>
            </div>
          </div>

          <div class="hero-cta">
            <button class="btn-primary" @click="scrollToVideo">
              <span>▶</span> ดูโฆษณาอีกครั้ง
            </button>
            <button class="btn-trial" @click="openTrial">
              <span class="tr-icon">🎓</span> ทดลองเรียน
            </button>
            <button class="btn-pdf" @click="openPdf">
              <span class="pdf-icon">📄</span> รับ PDF
            </button>
            <button class="btn-wechat" @click="openWechat">
              <span class="wc-icon">💬</span> WeChat
            </button>
          </div>
        </div>

        <div class="hero-mascot">
          <img src="/img/mascot.png" alt="MedNinja Mascot" />
        </div>
      </div>

      <div class="hero-foot">© 2026 MedNinja — เตรียมสอบแพทย์ ทุกที่ ทุกเวลา</div>
    </section>

    <!-- ═══════════════ VIDEO MODAL ═══════════════ -->
    <transition name="fade">
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeVideo">
        <div class="modal">
          <!-- Header brand -->
          <div class="modal-header">
            <div class="modal-brand">
              <img src="/img/mascot.png" alt="MedNinja" class="modal-brand-mark" />
              <div class="modal-brand-text">
                <div class="modal-brand-name">MedNinja</div>
                <div class="modal-brand-tag">
                  เพราะ <b>MedNinja</b> มี server ใน<span class="tag-cn">จีน</span>โดยเฉพาะ
                  <span class="tag-sep">·</span> ไม่ต้องใช้ <b class="tag-vpn">VPN</b> ก็ดูได้
                </div>
              </div>
            </div>
            <div class="modal-header-right">
              <button class="modal-close" @click="closeVideo" aria-label="ปิด">✕</button>
            </div>
          </div>

          <!-- Player -->
          <div class="modal-player-wrap">
            <div id="landing-player" class="modal-player"></div>

            <!-- Custom Play Button Overlay — แสดงเมื่อ browser block autoplay -->
            <transition name="fade">
              <div v-if="needsUserClick && !errorMsg" class="play-overlay" @click="handlePlayClick">
                <div class="play-btn-glow"></div>
                <button class="play-btn" aria-label="เล่นโฆษณา">
                  <svg viewBox="0 0 32 32" class="play-svg">
                    <path d="M11 8 L24 16 L11 24 Z" fill="currentColor"/>
                  </svg>
                </button>
                <div class="play-text">
                  <div class="play-title">▶ กดเพื่อเล่นโฆษณา</div>
                  <div class="play-sub">ทดสอบว่าคุณดูได้จริงในจีน</div>
                </div>
              </div>
            </transition>

            <div v-if="!playerReady && !errorMsg" class="modal-loading">
              <div class="spinner"></div>
              <div>กำลังเชื่อมต่อกับเซิร์ฟเวอร์ในจีน...</div>
            </div>
            <div v-if="errorMsg" class="modal-error">
              <div class="err-icon">⚠️</div>
              <div class="err-title">เกิดข้อผิดพลาด</div>
              <div class="err-msg">{{ errorMsg }}</div>
              <button class="btn-secondary" @click="closeVideo">ปิด</button>
            </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- ═══════════════ TRIAL MODAL (Coming Soon) ═══════════════ -->
    <transition name="fade">
      <div v-if="trialModalOpen" class="modal-overlay wechat-overlay" @click.self="closeTrial">
        <div class="wechat-modal trial-modal">
          <button class="modal-close wechat-close" @click="closeTrial" aria-label="ปิด">✕</button>
          <div class="wechat-body">
            <div class="trial-icon">🎓</div>
            <div class="wechat-title">ทดลองเรียน</div>
            <div class="wechat-sub">เร็ว ๆ นี้! เรากำลังเตรียมบทเรียนตัวอย่างให้คุณ</div>

            <div class="trial-soon-badge">✨ Coming Soon</div>

            <div class="trial-desc">
              ระหว่างนี้ ทักหาเราทาง <b>WeChat</b> เพื่อขอบทเรียนตัวอย่างได้เลย!
            </div>

            <button class="wechat-add-btn" @click="() => { closeTrial(); openWechat() }">
              <span class="wc-add-icon">💬</span>
              <span>ทัก WeChat ขอตัวอย่าง</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════ PDF LEAD MODAL ═══════════════ -->
    <transition name="fade">
      <div v-if="pdfModalOpen" class="modal-overlay wechat-overlay" @click.self="closePdf">
        <div class="wechat-modal pdf-modal">
          <button class="modal-close wechat-close" @click="closePdf" aria-label="ปิด">✕</button>

          <!-- Success state -->
          <div v-if="pdfSuccess" class="wechat-body">
            <div class="pdf-success-icon">✓</div>
            <div class="wechat-title" style="color:#16a34a">ส่งข้อมูลสำเร็จ!</div>
            <div class="wechat-sub">เราจะส่ง PDF ให้คุณเร็ว ๆ นี้ 💌</div>
            <button class="wechat-add-btn" @click="closePdf" style="margin-top: 20px">
              <span>ตกลง</span>
            </button>
          </div>

          <!-- Form state -->
          <div v-else class="wechat-body">
            <div class="pdf-hero-icon">📄</div>
            <div class="wechat-title">รับ PDF ฟรี</div>
            <div class="wechat-sub">กรอกช่องทางติดต่อ เราจะส่ง PDF ให้คุณ</div>

            <div class="pdf-form">
              <div class="pdf-field">
                <label>ชื่อ <span class="opt">(ไม่บังคับ)</span></label>
                <input v-model="pdfForm.name" type="text" placeholder="ชื่อของคุณ" :disabled="pdfSubmitting" />
              </div>
              <div class="pdf-field">
                <label>Email</label>
                <input v-model="pdfForm.email" type="email" placeholder="you@example.com" :disabled="pdfSubmitting" />
              </div>
              <div class="pdf-field">
                <label>เบอร์โทร <span class="opt">(หรือ)</span></label>
                <input v-model="pdfForm.phone" type="tel" placeholder="080-xxx-xxxx" :disabled="pdfSubmitting" />
              </div>
              <div class="pdf-field">
                <label>WeChat ID <span class="opt">(หรือ)</span></label>
                <input v-model="pdfForm.wechat" type="text" placeholder="wechat-id" :disabled="pdfSubmitting" />
              </div>
              <div class="pdf-hint">💡 กรอกอย่างน้อย 1 ช่อง (Email, เบอร์โทร หรือ WeChat)</div>

              <div v-if="pdfError" class="pdf-error">⚠ {{ pdfError }}</div>

              <button class="wechat-add-btn pdf-submit" @click="submitPdfLead" :disabled="pdfSubmitting">
                <span v-if="pdfSubmitting">กำลังส่ง...</span>
                <span v-else>📩 ส่งข้อมูล รับ PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════ WECHAT MODAL ═══════════════ -->
    <transition name="fade">
      <div v-if="wechatModalOpen" class="modal-overlay wechat-overlay" @click.self="closeWechat">
        <div class="wechat-modal">
          <button class="modal-close wechat-close" @click="closeWechat" aria-label="ปิด">✕</button>
          <div class="wechat-body">
            <div class="wechat-brand">
              <div class="wc-logo">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M8.5 3C4.36 3 1 5.91 1 9.5c0 2.07 1.13 3.9 2.88 5.1L3 17l2.5-1.5c.87.32 1.87.5 3 .5.24 0 .48-.02.72-.04-.15-.48-.22-.96-.22-1.46 0-3.31 3.36-6 7.5-6 .35 0 .69.02 1.03.06C17.2 5.36 13.24 3 8.5 3zM6.5 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                  <path d="M23 14.5c0-2.9-2.87-5.25-6.5-5.25S10 11.6 10 14.5c0 2.9 2.87 5.25 6.5 5.25.72 0 1.42-.11 2.06-.28L20.5 20l-.5-1.6c1.79-.93 3-2.55 3-3.9zm-8.5-1c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm4 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z"/>
                </svg>
              </div>
              <div class="wechat-title">เพิ่มเพื่อนใน WeChat</div>
              <div class="wechat-sub">สแกน QR หรือกดปุ่มเพิ่มเพื่อน</div>
            </div>

            <div class="wechat-id-card">
              <div class="wc-id-label">WeChat ID</div>
              <div class="wc-id-row">
                <div class="wc-id-value">{{ wechatId }}</div>
                <button class="wc-copy-btn" @click="copyWechatId" :class="{ copied }">
                  <span v-if="!copied">📋 คัดลอก</span>
                  <span v-else>✓ คัดลอกแล้ว</span>
                </button>
              </div>
            </div>

            <button class="wechat-add-btn" @click="openWechatApp">
              <span class="wc-add-icon">💬</span>
              <span>เปิดแอป WeChat</span>
            </button>

            <div class="wechat-steps">
              <div class="wc-step-title">วิธีเพิ่มเพื่อน</div>
              <ol class="wc-step-list">
                <li>คัดลอก WeChat ID: <b>{{ wechatId }}</b></li>
                <li>เปิดแอป WeChat → กด <b>+</b> มุมขวาบน → <b>Add Contacts</b></li>
                <li>วาง ID ในช่องค้นหา → เพิ่ม <b>tammy</b> เป็นเพื่อน</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ═══════════════ RESET / BASE ═══════════════ */
* { box-sizing: border-box; margin: 0; padding: 0; }

.landing {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f4f7fc;
  color: #0f172a;
  font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', -apple-system, sans-serif;
  overflow-x: hidden;
}
.hero-foot {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  color: #64748b;
  z-index: 2;
  opacity: 0.7;
}

/* ═══════════════ NAV ═══════════════ */
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}
.nav-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; }
.brand-text {
  font-size: 20px;
  font-weight: 900;
  color: #0b2b5b;
  letter-spacing: 0.3px;
}
.nav-actions { display: flex; align-items: center; gap: 8px; }
.nav-link {
  color: #334155;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  transition: background 0.2s;
}
.nav-link:hover { background: #eef4ff; color: #0b2b5b; }
.nav-cta {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(30, 58, 138, 0.35); }

/* ═══════════════ HERO ═══════════════ */
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 32px 20px 40px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #eef2fa 100%);
  display: flex;
  align-items: center;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(30, 58, 138, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 58, 138, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  pointer-events: none;
}
.hero-globe {
  position: absolute;
  right: -180px;
  top: 50%;
  transform: translateY(-50%);
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.12) 40%, transparent 70%);
  filter: blur(2px);
  pointer-events: none;
}
.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  align-items: center;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 58, 138, 0.08);
  color: #0b2b5b;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 20px;
}
.hero-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.05); }
}
.hero-title {
  font-size: 56px;
  line-height: 1.05;
  font-weight: 900;
  color: #0b2b5b;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
}
.hero-title .line { display: block; }
.hero-title .line-sm { font-size: 40px; }
.highlight-box {
  display: inline-block !important;
  background: #dc2626;
  color: white;
  padding: 0 18px;
  border-radius: 12px;
  margin: 4px 0;
  transform: skew(-4deg);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
}
.cn-red { color: #dc2626; }
.hero-sub {
  font-size: 17px;
  line-height: 1.7;
  color: #475569;
  margin-bottom: 28px;
}
.hero-sub strong { color: #0b2b5b; }
.hero-features {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.feat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.06);
}
.feat-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 10px;
  font-size: 20px;
}
.feat-label {
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}
.feat-label strong {
  display: block;
  color: #0b2b5b;
  font-size: 13px;
  font-weight: 800;
}
.hero-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-primary {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 14px 26px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(30, 58, 138, 0.35);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(30, 58, 138, 0.45);
}
.btn-primary span { font-size: 13px; }
.btn-primary.btn-lg { padding: 16px 32px; font-size: 17px; }
.btn-secondary {
  background: white;
  color: #0b2b5b;
  border: 1.5px solid rgba(30, 58, 138, 0.2);
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  font-family: inherit;
}
.btn-secondary:hover { border-color: #1e3a8a; background: #f8fafc; }

/* Trial button — สีม่วง (เรียน) */
.btn-trial {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 14px 22px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(139, 92, 246, 0.35);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.btn-trial:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(139, 92, 246, 0.45);
}
.tr-icon { font-size: 16px; }

/* PDF button — สีส้ม (เอกสาร) */
.btn-pdf {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 14px 22px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(245, 158, 11, 0.35);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.btn-pdf:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(245, 158, 11, 0.45);
}
.pdf-icon { font-size: 16px; }

/* Trial modal — accent สีม่วง */
.trial-modal::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed) !important;
}
.trial-icon {
  font-size: 56px;
  margin-bottom: 8px;
  filter: drop-shadow(0 6px 16px rgba(139, 92, 246, 0.35));
}
.trial-soon-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f0abfc 0%, #a78bfa 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 16px 0 14px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
.trial-desc {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 18px;
  padding: 12px 14px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 12px;
}
.trial-desc b { color: #7c3aed; }

/* PDF modal — accent สีส้ม */
.pdf-modal::before {
  background: linear-gradient(90deg, #f59e0b, #d97706) !important;
}
.pdf-hero-icon {
  font-size: 56px;
  margin-bottom: 8px;
  filter: drop-shadow(0 6px 16px rgba(245, 158, 11, 0.35));
}
.pdf-success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  font-size: 40px;
  font-weight: 900;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.4);
}
.pdf-form { text-align: left; margin-top: 18px; }
.pdf-field { margin-bottom: 12px; }
.pdf-field label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #0b2b5b;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.pdf-field label .opt {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 4px;
}
.pdf-field input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #0f172a;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.pdf-field input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.pdf-field input:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}
.pdf-hint {
  font-size: 12px;
  color: #64748b;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  margin: 14px 0 12px;
  line-height: 1.5;
}
.pdf-error {
  font-size: 13px;
  color: #dc2626;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-bottom: 12px;
}
.pdf-submit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35) !important;
}
.pdf-submit:hover:not(:disabled) {
  box-shadow: 0 12px 26px rgba(245, 158, 11, 0.45) !important;
}
.pdf-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* WeChat button */
.btn-wechat {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 14px 22px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.35);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
}
.btn-wechat:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(34, 197, 94, 0.45);
}
.wc-icon { font-size: 16px; }

/* WeChat modal */
.wechat-overlay { z-index: 110; }
.wechat-modal {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}
.wechat-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.wechat-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
.wechat-close:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}
.wechat-body {
  padding: 32px 24px 26px;
  text-align: center;
}
.wechat-title {
  font-size: 22px;
  font-weight: 900;
  color: #0b2b5b;
  margin-bottom: 6px;
}
.wechat-sub {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
}
/* WeChat ID card */
.wechat-id-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1.5px solid #bbf7d0;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
  text-align: left;
}
.wc-id-label {
  font-size: 11px;
  font-weight: 800;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}
.wc-id-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.wc-id-value {
  font-size: 22px;
  font-weight: 900;
  color: #0b2b5b;
  font-family: 'SF Mono', 'Menlo', monospace;
  letter-spacing: 0.5px;
}
.wc-copy-btn {
  background: white;
  color: #16a34a;
  border: 1.5px solid #bbf7d0;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}
.wc-copy-btn:hover {
  background: #f0fdf4;
  border-color: #16a34a;
  transform: translateY(-1px);
}
.wc-copy-btn.copied {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}

/* Steps guide */
.wechat-add-btn {
  width: 100%;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 13px 18px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35);
  transition: transform 0.15s, box-shadow 0.2s;
  font-family: inherit;
  margin-bottom: 16px;
}
.wechat-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(34, 197, 94, 0.45);
}
.wc-add-icon { font-size: 18px; }

.wechat-steps {
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
}
.wc-step-title {
  font-size: 12px;
  font-weight: 800;
  color: #0b2b5b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.wc-step-list {
  padding-left: 20px;
  margin: 0;
}
.wc-step-list li {
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 4px;
}
.wc-step-list li b {
  color: #16a34a;
  font-weight: 800;
}

.hero-mascot {
  position: relative;
  display: grid;
  place-items: center;
}
.hero-mascot img {
  width: 100%;
  max-width: 420px;
  filter: drop-shadow(0 30px 50px rgba(30, 58, 138, 0.25));
  animation: float 4s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ═══════════════ SECTION HEADS ═══════════════ */
.section-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 40px;
}
.section-tag {
  display: inline-block;
  background: rgba(30, 58, 138, 0.08);
  color: #1e3a8a;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.section-title {
  font-size: 34px;
  font-weight: 900;
  color: #0b2b5b;
  line-height: 1.2;
  margin-bottom: 10px;
}
.section-sub {
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
}

/* ═══════════════ VIDEO PREVIEW ═══════════════ */
.video-preview {
  padding: 60px 20px;
  background: white;
}
.video-thumb-wrap {
  max-width: 900px;
  margin: 0 auto;
}
.video-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(135deg, #0b2b5b 0%, #1e3a8a 60%, #2563eb 100%);
  box-shadow: 0 30px 60px rgba(11, 43, 91, 0.35);
  transition: transform 0.25s, box-shadow 0.25s;
  display: grid;
  place-items: center;
}
.video-thumb:hover {
  transform: translateY(-4px);
  box-shadow: 0 40px 80px rgba(11, 43, 91, 0.45);
}
.thumb-mascot {
  height: 70%;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4));
  opacity: 0.9;
}
.play-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  place-items: center;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}
.video-thumb:hover .play-badge { transform: translate(-50%, -50%) scale(1.08); }
.play-icon {
  font-size: 32px;
  color: #dc2626;
  margin-left: 5px;
}
.thumb-label {
  position: absolute;
  bottom: 20px;
  left: 24px;
  color: white;
}
.thumb-title {
  font-size: 18px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
.thumb-meta {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* ═══════════════ WHY ═══════════════ */
.why {
  padding: 60px 20px;
  background: linear-gradient(180deg, #f4f7fc 0%, #ffffff 100%);
}
.why-grid {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
}
.why-card {
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  padding: 26px 22px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.05);
}
.why-card:hover {
  transform: translateY(-4px);
  border-color: rgba(30, 58, 138, 0.2);
  box-shadow: 0 20px 40px rgba(30, 58, 138, 0.12);
}
.why-icon {
  font-size: 44px;
  margin-bottom: 12px;
  line-height: 1;
}
.why-card h3 {
  font-size: 17px;
  font-weight: 800;
  color: #0b2b5b;
  margin-bottom: 8px;
}
.why-card p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.7;
}

/* ═══════════════ CTA BAND ═══════════════ */
.cta-band {
  padding: 70px 20px;
  background: linear-gradient(135deg, #0b2b5b 0%, #1e3a8a 100%);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.cta-band::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, black, transparent 70%);
}
.cta-inner {
  position: relative;
  z-index: 2;
  max-width: 700px;
  margin: 0 auto;
}
.cta-band h2 {
  font-size: 36px;
  font-weight: 900;
  margin-bottom: 12px;
}
.cta-band p {
  font-size: 17px;
  opacity: 0.9;
  margin-bottom: 32px;
}
.cta-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* ═══════════════ FOOTER ═══════════════ */
.footer {
  background: #0b1e3d;
  color: #cbd5e1;
  padding: 40px 20px 30px;
}
.footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr auto;
  gap: 24px;
  align-items: center;
}
.footer-brand { display: flex; align-items: center; gap: 12px; }
.footer-mark { width: 44px; height: 44px; border-radius: 10px; }
.footer-name { font-size: 18px; font-weight: 900; color: white; }
.footer-tagline { font-size: 12px; opacity: 0.7; }
.footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}
.footer-links a:hover { color: white; }
.footer-copy {
  font-size: 12px;
  opacity: 0.6;
  text-align: right;
}

/* ═══════════════ MODAL ═══════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(3, 10, 30, 0.85);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 20px;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 1040px;
  background: linear-gradient(180deg, #0b2b5b 0%, #0a1e3f 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(56, 189, 248, 0.2),
    0 0 60px rgba(30, 58, 138, 0.3);
}
/* Gradient border ด้านบนสุด */
.modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8 0%, #2563eb 40%, #dc2626 70%, #f59e0b 100%);
  z-index: 5;
}

/* Modal header — brand + close */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
  background: rgba(255, 255, 255, 0.02);
}
.modal-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
}
.modal-brand-name {
  font-size: 18px;
  font-weight: 900;
  color: white;
  letter-spacing: 0.3px;
  line-height: 1.1;
}
.modal-brand-tag {
  font-size: 13px;
  color: #cbd5e1;
  margin-top: 2px;
  font-weight: 600;
}
.tag-cn {
  color: #f87171;
  font-weight: 800;
}
.modal-brand-tag b {
  color: white;
  font-weight: 800;
}
.tag-vpn { color: #fbbf24; }
.tag-sep {
  color: rgba(255,255,255,0.3);
  margin: 0 4px;
}
.modal-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-badge {
  background: rgba(56, 189, 248, 0.12);
  color: #7dd3fc;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(56, 189, 248, 0.25);
}
.modal-close {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.modal-close:hover {
  background: rgba(220, 38, 38, 0.9);
  border-color: rgba(220, 38, 38, 0.9);
  transform: rotate(90deg);
}

/* Player */
.modal-player-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #000;
}
.modal-player {
  width: 100% !important;
  height: 100% !important;
}
.modal-loading, .modal-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  color: white;
  text-align: center;
  padding: 30px;
  background: linear-gradient(180deg, #0b2b5b 0%, #050f28 100%);
}

/* ═══════════════ CUSTOM PLAY OVERLAY ═══════════════ */
.play-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 20px;
  cursor: pointer;
  background:
    radial-gradient(ellipse at center, rgba(30, 58, 138, 0.35) 0%, rgba(3, 10, 30, 0.85) 70%),
    linear-gradient(135deg, rgba(11, 43, 91, 0.5), rgba(220, 38, 38, 0.15));
  backdrop-filter: blur(4px);
  transition: background 0.3s;
}
.play-overlay:hover { background:
  radial-gradient(ellipse at center, rgba(56, 189, 248, 0.35) 0%, rgba(3, 10, 30, 0.9) 70%),
  linear-gradient(135deg, rgba(11, 43, 91, 0.6), rgba(220, 38, 38, 0.2));
}
.play-btn-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 22px));
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(30, 58, 138, 0) 70%);
  filter: blur(20px);
  pointer-events: none;
  animation: glow-pulse 2s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, calc(-50% - 22px)) scale(1); }
  50% { opacity: 1; transform: translate(-50%, calc(-50% - 22px)) scale(1.15); }
}
.play-btn {
  position: relative;
  width: 96px;
  height: 96px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  color: #dc2626;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow:
    0 0 0 6px rgba(255, 255, 255, 0.15),
    0 0 0 14px rgba(255, 255, 255, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
  animation: btn-pulse 2.2s ease-in-out infinite;
}
.play-btn:hover {
  transform: scale(1.08);
  box-shadow:
    0 0 0 8px rgba(255, 255, 255, 0.2),
    0 0 0 18px rgba(255, 255, 255, 0.1),
    0 24px 60px rgba(0, 0, 0, 0.6);
}
.play-btn:active { transform: scale(0.95); }
@keyframes btn-pulse {
  0%, 100% {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.15), 0 0 0 14px rgba(255, 255, 255, 0.08), 0 20px 50px rgba(0, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(56, 189, 248, 0.25), 0 0 0 20px rgba(56, 189, 248, 0.12), 0 20px 50px rgba(0, 0, 0, 0.5);
  }
}
.play-svg {
  width: 42px;
  height: 42px;
  margin-left: 4px;
  filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.3));
}
.play-text {
  text-align: center;
  color: white;
  pointer-events: none;
}
.play-title {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 6px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.3px;
}
.play-sub {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.12);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
.modal-error .err-icon { font-size: 48px; }
.modal-error .err-title { font-size: 20px; font-weight: 800; }
.modal-error .err-msg {
  font-size: 14px;
  opacity: 0.8;
  max-width: 460px;
  line-height: 1.6;
}

/* Modal footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(56, 189, 248, 0.1);
}
.modal-footer-hint {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}
.modal-cta {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
  transition: transform 0.15s;
  white-space: nowrap;
}
.modal-cta:hover { transform: translateY(-1px); }

/* ═══════════════ TRANSITIONS ═══════════════ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ═══════════════ RESPONSIVE ═══════════════ */
@media (max-width: 1024px) {
  .hero-title { font-size: 46px; }
  .hero-title .line-sm { font-size: 32px; }
  .hero-mascot img { max-width: 340px; }
  .footer-inner { grid-template-columns: 1fr; text-align: center; }
  .footer-brand { justify-content: center; }
  .footer-links { justify-content: center; }
  .footer-copy { text-align: center; }
}
@media (max-width: 768px) {
  .hero {
    padding: 16px 14px 28px;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 10px;
    text-align: center;
    width: 100%;
  }
  .hero-badge { margin: 0 auto 8px; font-size: 11.5px; padding: 4px 12px; }
  .hero-badge .dot { width: 7px; height: 7px; }
  .hero-title { font-size: 32px; margin-bottom: 10px; line-height: 1.05; }
  .hero-title .line-sm { font-size: 22px; }
  .highlight-box { padding: 0 12px; border-radius: 10px; margin: 2px 0; }
  .hero-features { justify-content: center; margin-bottom: 12px; gap: 6px; flex-wrap: nowrap; width: 100%; }
  .feat-card {
    flex: 1 1 0;
    min-width: 0;
    padding: 8px 6px;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    border-radius: 12px;
  }
  .feat-icon { width: 30px; height: 30px; font-size: 15px; border-radius: 8px; }
  .feat-label { font-size: 10.5px; line-height: 1.3; }
  .feat-label strong { font-size: 11px; }
  .feat-label span { font-size: 10px; }
  .hero-cta {
    justify-content: center;
    width: 100%;
    gap: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .btn-primary, .btn-secondary, .btn-wechat, .btn-trial, .btn-pdf {
    padding: 11px 10px;
    font-size: 12.5px;
    width: 100%;
    justify-content: center;
    gap: 5px;
  }
  .btn-primary span, .btn-wechat .wc-icon, .btn-trial .tr-icon, .btn-pdf .pdf-icon {
    font-size: 13px;
  }
  .wechat-modal { max-width: 340px; }
  .wechat-body { padding: 26px 18px 20px; }
  .wechat-title { font-size: 18px; }
  .wc-id-value { font-size: 18px; }
  .wc-copy-btn { padding: 7px 10px; font-size: 12px; }
  .wechat-add-btn { padding: 12px 14px; font-size: 14px; }
  .wc-step-list li { font-size: 12px; }
  .hero-mascot { order: -1; }
  .hero-mascot img { max-width: 130px; margin-bottom: 4px; }
  .hero-globe { display: none; }
  .hero-foot { font-size: 10px; bottom: 6px; }
  .modal { border-radius: 14px; }
  .modal-overlay { padding: 10px; }
  .modal-header { padding: 10px 14px; }
  .modal-brand-mark { width: 34px; height: 34px; }
  .modal-brand-name { font-size: 15px; }
  .modal-brand-tag { font-size: 10.5px; line-height: 1.4; }
  .modal-brand-tag .tag-sep { display: none; }
  .modal-close { width: 32px; height: 32px; font-size: 14px; }
  .play-btn { width: 78px; height: 78px; }
  .play-svg { width: 32px; height: 32px; margin-left: 3px; }
  .play-btn-glow { width: 110px; height: 110px; }
  .play-title { font-size: 17px; }
  .play-sub { font-size: 12px; }
}
@media (max-width: 360px) {
  .hero-title { font-size: 28px; }
  .hero-title .line-sm { font-size: 19px; }
  .hero-mascot img { max-width: 110px; }
  .feat-label strong { font-size: 10px; }
  .feat-label span { font-size: 9.5px; }
}
</style>
