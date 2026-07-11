<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ⭐ Video สำหรับ landing page ขาย (Alibaba Encrypt — เล่นได้ทั้งไทย + จีน)
const VIDEO_ID = 'f0a10c4f79dc71f1a46bf6f7f45a0102'
const PLAYAUTH_ENDPOINT = `/api/china/playauth/${VIDEO_ID}`

const playerReady = ref(false)
const modalOpen = ref(false)
const errorMsg = ref('')

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

    player = new window.Aliplayer({
      id: 'landing-player',
      vid: VIDEO_ID,
      playauth: playAuth,
      width: '100%',
      height: '100%',
      autoplay: true,
      isLive: false,
      rePlay: false,
      playsinline: true,
      preload: true,
      controlBarVisibility: 'hover',
      useH5Prism: true,
      license: {
        domain: 'passport.medninja.academy',
        key: 'vPC0n17ZWmwsoyeP9659f501b25944c10903c73d068157faa'
      },
      encryptType: 1
    }, function () {
      playerReady.value = true
    })

    player.on('error', (e) => {
      const details = e?.paramData ? JSON.stringify(e.paramData) : (e?.message || 'เล่นวิดีโอไม่ได้')
      errorMsg.value = details
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
  if (player) {
    try { player.pause() } catch {}
  }
}

function scrollToVideo() {
  openVideo()
}

function contactLine() {
  window.open('https://lin.ee/nEEK4Kv', '_blank')
}

onMounted(() => {
  document.title = 'MedNinja LMS — ดูได้ทั่วโลก แม้ในประเทศจีน (ไม่ต้อง VPN)'
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
    <!-- ═══════════════ NAV ═══════════════ -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="brand">
          <img src="/img/mascot.png" alt="MedNinja" class="brand-mark" />
          <span class="brand-text">MedNinja</span>
        </div>
        <div class="nav-actions">
          <a href="https://medninja.academy" class="nav-link">หน้าหลัก</a>
          <button class="nav-cta" @click="contactLine">ติดต่อทีมงาน</button>
        </div>
      </div>
    </nav>

    <!-- ═══════════════ HERO ═══════════════ -->
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

          <p class="hero-sub">
            เราลงทุนกับ CDN + Encryption ระดับสูงในประเทศจีน<br>
            เพื่อให้นักเรียนแพทย์ไทยที่กำลังเรียนอยู่ในจีน<br>
            <strong>เข้าเรียนได้ลื่นเหมือนอยู่ในไทย</strong>
          </p>

          <div class="hero-features">
            <div class="feat-card">
              <div class="feat-icon">🌐</div>
              <div class="feat-label"><strong>ดูได้ทุกที่</strong><br><span>ทุกประเทศ</span></div>
            </div>
            <div class="feat-card">
              <div class="feat-icon">🗄️</div>
              <div class="feat-label"><strong>เซิร์ฟเวอร์เสถียร</strong><br><span>ความเร็วสูง</span></div>
            </div>
            <div class="feat-card">
              <div class="feat-icon">🛡️</div>
              <div class="feat-label"><strong>ปลอดภัย</strong><br><span>มั่นใจข้อมูล</span></div>
            </div>
          </div>

          <div class="hero-cta">
            <button class="btn-primary" @click="scrollToVideo">
              <span>▶</span> ดูวิดีโอทดสอบระบบ
            </button>
            <button class="btn-secondary" @click="contactLine">
              💬 สอบถามผ่าน LINE
            </button>
          </div>
        </div>

        <div class="hero-mascot">
          <img src="/img/mascot.png" alt="MedNinja Mascot" />
        </div>
      </div>
    </section>

    <!-- ═══════════════ VIDEO PREVIEW ═══════════════ -->
    <section class="video-preview">
      <div class="section-head">
        <div class="section-tag">พิสูจน์ด้วยตัวเอง</div>
        <h2 class="section-title">กดเล่นวิดีโอนี้เพื่อทดสอบ</h2>
        <p class="section-sub">
          ถ้าคุณอยู่ในประเทศจีน ไม่ต้องเปิด VPN
          — วิดีโอนี้จะเล่นได้ทันที
        </p>
      </div>

      <div class="video-thumb-wrap">
        <div class="video-thumb" @click="openVideo">
          <img src="/img/mascot.png" alt="preview" class="thumb-mascot" />
          <div class="play-badge">
            <span class="play-icon">▶</span>
          </div>
          <div class="thumb-label">
            <div class="thumb-title">MedNinja LMS Demo</div>
            <div class="thumb-meta">🔒 Alibaba Encrypt · เล่นได้ในจีน</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ WHY ═══════════════ -->
    <section class="why">
      <div class="section-head">
        <div class="section-tag">ทำไมเลือก MedNinja</div>
        <h2 class="section-title">ระบบสำหรับนักเรียนแพทย์ที่อยู่นอกไทย</h2>
      </div>

      <div class="why-grid">
        <div class="why-card">
          <div class="why-icon">🇨🇳</div>
          <h3>CDN ในประเทศจีน</h3>
          <p>เราลงทุนกับ Alibaba VOD + edge server ในจีน<br>เพื่อความเร็วและเสถียรภาพ</p>
        </div>
        <div class="why-card">
          <div class="why-icon">🔐</div>
          <h3>Encryption ระดับสูง</h3>
          <p>ลิขสิทธิ์เนื้อหาปลอดภัย<br>วิดีโอเข้ารหัสไม่ให้ดาวน์โหลด</p>
        </div>
        <div class="why-card">
          <div class="why-icon">📱</div>
          <h3>ใช้ได้ทุกอุปกรณ์</h3>
          <p>คอมพิวเตอร์ Chrome<br>iPad, iPhone, Android — เล่นได้</p>
        </div>
        <div class="why-card">
          <div class="why-icon">🩺</div>
          <h3>เนื้อหาแพทย์ครบ</h3>
          <p>Pre-clinic → NL1 → NL2 → OSCE<br>เตรียมสอบทุกด่าน</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════ CTA ═══════════════ -->
    <section class="cta-band">
      <div class="cta-inner">
        <h2>เรียนได้ทุกที่ ทุกเวลา</h2>
        <p>MedNinja LMS พร้อมให้คุณก้าวไปได้ไกลกว่าเดิม</p>
        <div class="cta-buttons">
          <button class="btn-primary btn-lg" @click="contactLine">
            💬 ติดต่อทีมงานผ่าน LINE
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════ FOOTER ═══════════════ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/img/mascot.png" alt="MedNinja" class="footer-mark" />
          <div>
            <div class="footer-name">MedNinja</div>
            <div class="footer-tagline">เตรียมสอบใบประกอบวิชาชีพเวชกรรม</div>
          </div>
        </div>
        <div class="footer-links">
          <a href="https://medninja.academy">หน้าหลัก</a>
          <a href="https://passport.medninja.academy">Passport</a>
          <a href="/privacy-policy.html">นโยบายความเป็นส่วนตัว</a>
        </div>
        <div class="footer-copy">© 2026 MedNinja Technology</div>
      </div>
    </footer>

    <!-- ═══════════════ VIDEO MODAL ═══════════════ -->
    <transition name="fade">
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeVideo">
        <div class="modal">
          <button class="modal-close" @click="closeVideo" aria-label="ปิด">✕</button>
          <div class="modal-player-wrap">
            <div id="landing-player" class="modal-player"></div>
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
  </div>
</template>

<style scoped>
/* ═══════════════ RESET / BASE ═══════════════ */
* { box-sizing: border-box; margin: 0; padding: 0; }

.landing {
  min-height: 100vh;
  background: #f4f7fc;
  color: #0f172a;
  font-family: 'Sarabun', 'Noto Sans Thai', 'Segoe UI', -apple-system, sans-serif;
  overflow-x: hidden;
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
  padding: 40px 20px 60px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #eef2fa 100%);
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
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 20px;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 1080px;
  background: #000;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-close:hover { background: rgba(220, 38, 38, 0.9); }
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
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.15);
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
  .hero { padding: 20px 16px 32px; }
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }
  .hero-badge { margin: 0 auto 14px; font-size: 12px; padding: 5px 12px; }
  .hero-title { font-size: 36px; margin-bottom: 14px; }
  .hero-title .line-sm { font-size: 26px; }
  .highlight-box { padding: 0 14px; border-radius: 10px; }
  .hero-sub { font-size: 14px; line-height: 1.6; margin-bottom: 18px; }
  .hero-features { justify-content: center; margin-bottom: 20px; gap: 8px; }
  .hero-cta { justify-content: center; }
  .hero-mascot { order: -1; }
  .hero-mascot img { max-width: 180px; }
  .hero-globe { display: none; }
  .section-title { font-size: 24px; }
  .section-sub { font-size: 14px; }
  .video-preview { padding: 40px 16px; }
  .why { padding: 40px 16px; }
  .cta-band { padding: 50px 20px; }
  .cta-band h2 { font-size: 26px; }
  .cta-band p { font-size: 15px; }
  .thumb-mascot { height: 55%; }
  .play-badge { width: 68px; height: 68px; }
  .play-icon { font-size: 24px; }
  .thumb-title { font-size: 15px; }
  .thumb-meta { font-size: 11px; }
  .thumb-label { bottom: 14px; left: 16px; }
  .nav-inner { padding: 10px 16px; }
  .nav-link { display: none; }
  .brand-text { font-size: 17px; }
  .brand-mark { width: 30px; height: 30px; }
  .nav-cta { padding: 7px 14px; font-size: 13px; }
  .footer { padding: 32px 20px 24px; }
  .footer-inner { gap: 18px; }
}
@media (max-width: 480px) {
  .hero-title { font-size: 30px; line-height: 1.1; }
  .hero-title .line-sm { font-size: 22px; }
  .hero-sub { font-size: 13.5px; }
  .hero-sub br { display: none; }
  .hero-mascot img { max-width: 150px; }
  .hero-cta { flex-direction: column; gap: 10px; width: 100%; }
  .btn-primary, .btn-secondary { padding: 13px 20px; font-size: 14.5px; width: 100%; justify-content: center; }
  /* Feat cards → 3 ช่องแนวนอน compact */
  .hero-features { flex-wrap: nowrap; gap: 8px; width: 100%; }
  .feat-card {
    flex: 1 1 0;
    min-width: 0;
    padding: 10px 8px;
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }
  .feat-icon { width: 32px; height: 32px; font-size: 16px; }
  .feat-label { font-size: 11px; }
  .feat-label strong { font-size: 11.5px; }
  .feat-label span { font-size: 10.5px; }
  .modal { border-radius: 12px; }
  .modal-overlay { padding: 12px; }
}
@media (max-width: 360px) {
  .hero-title { font-size: 26px; }
  .hero-title .line-sm { font-size: 20px; }
  .hero-mascot img { max-width: 130px; }
  .feat-label strong { font-size: 10.5px; }
  .feat-label span { font-size: 9.5px; }
}
</style>
