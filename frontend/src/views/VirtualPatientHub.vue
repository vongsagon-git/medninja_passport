<template>
  <section class="vp-section">
    <div class="container">
      <div class="vp-banner">
        <div class="vp-monogram">VP</div>
        <div class="vp-scan"></div>
        <span class="vp-br vp-tl"></span>
        <span class="vp-br vp-tr"></span>
        <span class="vp-br vp-bl"></span>
        <span class="vp-br vp-br2"></span>
        <div class="vp-corner-tag"><span class="vp-dot"></span>FREE TRIAL</div>
        <div class="vp-brand">NINJA <span class="vp-pur">VP</span></div>

        <div class="vp-stage">
          <div class="vp-left">
            <div class="vp-label">/// 7 DAYS FREE ///</div>
            <h2 class="vp-headline">VIRTUAL<br><span class="vp-pur">PATIENT</span></h2>
            <div class="vp-sub">ฝึก <b>NL · MEQ · OSCE</b> จนเก่ง<br><b>1,000 ล้านเคส</b> ไม่ซ้ำ · ทดลองฟรี <b>แบบละ 7 วัน</b></div>
            <div class="vp-pills">
              <span class="vp-for">FOR</span>
              <span class="vp-pill vp-meq">NL</span>
              <span class="vp-pill vp-osce">MEQ</span>
              <span class="vp-pill vp-lc">OSCE</span>
              <span class="vp-pill vp-lc">LONG CASE</span>
            </div>
          </div>

          <div class="vp-right">
            <div class="vp-logo-orb">
              <span class="vp-ring-inner"></span>
              <img src="/img/vp-circle.png" alt="Logo" />
            </div>
          </div>
        </div>

        <div class="vp-mascot-wrap">
          <div class="vp-glow"></div>
          <img src="/img/vp-mascot.png" alt="Virtual Patient Mascot" />
        </div>
      </div>

      <div class="vp-choose">
        <a :href="osceUrl" class="vp-app vp-app-osce">
          <div class="vp-app-icon">🩺</div>
          <div class="vp-app-body">
            <div class="vp-app-name">OSCE</div>
            <div class="vp-app-desc">ฝึก OSCE · ซักประวัติ · examiner checklist<br>เหมาะสอบ OSCE + ขึ้น ward</div>
            <div class="vp-app-meta">ทดลองฟรี 7 วัน</div>
          </div>
          <div class="vp-app-arrow">→</div>
        </a>

        <div class="vp-app vp-app-ddx vp-app-soon">
          <div class="vp-soon-badge">COMING SOON</div>
          <div class="vp-app-icon">🔥</div>
          <div class="vp-app-body">
            <div class="vp-app-name">NL · MEQ</div>
            <div class="vp-app-desc">ฝึก Differential Diagnosis · clinical reasoning<br>เหมาะสอบ NL + MEQ + Long case</div>
            <div class="vp-app-meta">เปิดให้ทดลองเร็วๆ นี้</div>
          </div>
          <div class="vp-app-arrow">→</div>
        </div>
      </div>

      <div class="vp-full">
        <div class="vp-full-line"></div>
        <p class="vp-full-sub">ระบบเต็มใช้ได้ไม่จำกัด สำหรับคอร์ส</p>
        <div class="vp-full-pills">
          <span class="vp-full-pill">NL</span>
          <span class="vp-full-pill">MEQ</span>
          <span class="vp-full-pill">OSCE</span>
          <span class="vp-full-pill">LONG CASE</span>
        </div>
        <a href="https://medninja.academy" class="vp-full-btn">ไปเว็บหลัก →</a>
      </div>

      <p class="vp-note">ต้อง Add LINE @medninja เพื่อเล่น · มือถือเท่านั้น · จำกัด 30 เคส/วัน</p>
    </div>

    <footer class="vp-footer">MedNinja Technology</footer>
  </section>
</template>

<script>
const OG = {
  title: 'Virtual Patient — ทดลองฟรี 7 วัน | MedNinja',
  description: 'ฝึก NL + MEQ + OSCE กับคนไข้เสมือนจริง 1,000 ล้านเคสไม่ซ้ำ ทดลองฟรีแบบละ 7 วัน เล่นในมือถือผ่าน LINE ไม่ต้องโหลดแอป',
  image: 'https://medninja.academy/img/vp-mascot.png',
  url: 'https://medninja.academy/virtual-patient'
}

function setMeta(prop, value, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let tag = document.querySelector(`meta[${attr}="${prop}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, prop)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

import { isIOS as detectIOS, isAndroid as detectAndroid } from '../utils/deviceDetect'

const LIFF_ID_OSCE = '2009259048-qC93O47Y'
const LIFF_ID_DDX = '2009259048-dtNCFzk8'

export default {
  name: 'VirtualPatientHub',
  data() {
    return {
      isLine: false,
      isMobile: false
    }
  },
  computed: {
    // Mobile (iOS/Android) → line://app/ deep link (iOS หมอแตม confirm OK)
    // Desktop → sub-landing เพื่อแสดง QR code
    osceUrl() {
      return this.isMobile
        ? `line://app/${LIFF_ID_OSCE}`
        : 'https://osce.medninja.academy/vp/landing'
    },
    ddxUrl() {
      return this.isMobile
        ? `line://app/${LIFF_ID_DDX}`
        : 'https://ddx.medninja.academy/vp/landing'
    }
  },
  created() {
    const ua = navigator.userAgent
    this.isLine = /Line/i.test(ua)
    this.isMobile = detectIOS(ua) || detectAndroid(ua) || /Mobile/i.test(ua)
  },
  mounted() {
    document.title = OG.title
    setMeta('description', OG.description)
    setMeta('og:type', 'website', true)
    setMeta('og:url', OG.url, true)
    setMeta('og:title', OG.title, true)
    setMeta('og:description', OG.description, true)
    setMeta('og:image', OG.image, true)
    setMeta('og:image:width', '1200', true)
    setMeta('og:image:height', '630', true)
    setMeta('og:site_name', 'MedNinja', true)
    setMeta('og:locale', 'th_TH', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', OG.title)
    setMeta('twitter:description', OG.description)
    setMeta('twitter:image', OG.image)
  }
}
</script>

<style scoped>
.vp-section { padding: 24px 0 40px; min-height: 100vh; background: #fff; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.vp-banner {
  --vp-ink: #0a0a0a;
  --vp-pur: #8b5cf6;
  --vp-red: #e63946;
  --vp-teal: #0d9488;
  --vp-paper: #fafaf7;
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
}
.vp-monogram { position: absolute; font-family: 'Bebas Neue', 'Anton', Impact, sans-serif; color: var(--vp-ink); opacity: 0.04; letter-spacing: -10px; user-select: none; pointer-events: none; line-height: 0.8; z-index: 0; font-size: 480px; top: -50px; right: -50px; }
.vp-scan { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--vp-pur), transparent); opacity: 0.4; z-index: 1; top: 200px; }
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
.vp-corner-tag { position: absolute; top: 30px; left: 30px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 10px; letter-spacing: 2px; background: var(--vp-ink); color: #fff; padding: 6px 11px; z-index: 5; display: inline-flex; align-items: center; gap: 7px; }
.vp-dot { width: 6px; height: 6px; background: var(--vp-red); border-radius: 50%; animation: vp-pulse 1.4s infinite; }
@keyframes vp-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.3); } }
.vp-brand { position: absolute; top: 30px; right: 56px; font-family: 'Bebas Neue', 'Anton', Impact, sans-serif; font-size: 16px; letter-spacing: 3px; color: var(--vp-ink); z-index: 5; white-space: nowrap; }
.vp-brand .vp-pur { color: var(--vp-pur); }
.vp-stage { height: 100%; display: grid; grid-template-columns: 1fr 460px; gap: 40px; align-items: center; position: relative; z-index: 2; }
.vp-mascot-wrap { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 520px; height: 620px; z-index: 3; display: flex; align-items: flex-end; justify-content: center; }
.vp-mascot-wrap .vp-glow { position: absolute; width: 95%; height: 95%; bottom: 0; left: 50%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(139,92,246,0) 65%); z-index: 0; pointer-events: none; }
.vp-mascot-wrap img { width: 100%; height: 100%; object-fit: contain; object-position: bottom; position: relative; z-index: 1; filter: drop-shadow(0 14px 24px rgba(0,0,0,0.22)); }
.vp-label { font-family: 'JetBrains Mono', 'Courier New', monospace; letter-spacing: 3px; font-size: 14px; color: var(--vp-red); margin-bottom: 22px; font-weight: 700; }
.vp-headline { font-family: 'Bebas Neue', 'Anton', Impact, sans-serif; line-height: 0.88; letter-spacing: 4px; color: var(--vp-ink); font-size: 112px; margin-bottom: 14px; font-weight: 400; }
.vp-headline .vp-pur { color: var(--vp-pur); position: relative; display: inline-block; }
.vp-headline .vp-pur::after { content: ''; position: absolute; left: 0; bottom: 6px; width: 100%; height: 6px; background: var(--vp-pur); opacity: 0.2; z-index: -1; }
.vp-sub { font-size: 20px; font-weight: 600; color: var(--vp-ink); line-height: 1.5; margin-bottom: 18px; max-width: 520px; }
.vp-sub b { color: var(--vp-pur); }
.vp-pills { display: inline-flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.vp-pills .vp-pill { font-family: 'Bebas Neue', 'Anton', Impact, sans-serif; letter-spacing: 2px; background: #fff; color: var(--vp-ink); border: 2px solid var(--vp-ink); padding: 6px 12px; box-shadow: 3px 3px 0 var(--vp-ink); font-size: 16px; }
.vp-pills .vp-meq  { color: var(--vp-pur); }
.vp-pills .vp-osce { color: var(--vp-teal); }
.vp-pills .vp-lc   { color: var(--vp-red); }
.vp-pills .vp-for { font-family: 'JetBrains Mono', 'Courier New', monospace; letter-spacing: 3px; font-size: 12px; color: var(--vp-ink); margin-right: 4px; font-weight: 700; }
.vp-right { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 18px; }
.vp-logo-orb { position: relative; display: flex; align-items: center; justify-content: center; z-index: 2; flex-shrink: 0; width: 240px; height: 240px; }
.vp-logo-orb::after { content: ''; position: absolute; inset: -22px; border-radius: 50%; border: 3px dashed var(--vp-pur); opacity: 0.9; animation: vp-spin 8s linear infinite; }
.vp-logo-orb::before { content: ''; position: absolute; inset: -40px; border-radius: 50%; border: 3px dotted var(--vp-ink); opacity: 0.55; animation: vp-spin 14s linear infinite reverse; }
.vp-ring-inner { position: absolute; inset: -10px; border-radius: 50%; border: 2.5px solid transparent; border-top-color: var(--vp-pur); border-right-color: var(--vp-pur); opacity: 0.85; animation: vp-spin 4s linear infinite; pointer-events: none; }
.vp-logo-orb img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 6px 14px rgba(139,92,246,0.45)); position: relative; z-index: 1; }
@keyframes vp-spin { to { transform: rotate(360deg); } }

/* ─── Choose 2 apps ─── */
.vp-choose {
  max-width: 1200px;
  margin: 32px auto 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.vp-app {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: #fff;
  border: 2px solid #0a0a0a;
  border-radius: 14px;
  text-decoration: none;
  color: #0a0a0a;
  box-shadow: 5px 5px 0 #0a0a0a;
  transition: transform 0.15s, box-shadow 0.15s;
  font-family: 'IBM Plex Sans Thai', 'Noto Sans Thai', sans-serif;
}
.vp-app:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 #0a0a0a; }
.vp-app-osce { box-shadow: 5px 5px 0 #10b981; }
.vp-app-osce:hover { box-shadow: 7px 7px 0 #10b981; }
.vp-app-ddx { box-shadow: 5px 5px 0 #f97316; }
.vp-app-ddx:hover { box-shadow: 7px 7px 0 #f97316; }
.vp-app-icon { font-size: 42px; flex-shrink: 0; }
.vp-app-body { flex: 1; min-width: 0; }
.vp-app-name { font-family: 'Bebas Neue', 'Anton', Impact, sans-serif; font-size: 28px; letter-spacing: 2px; line-height: 1; margin-bottom: 6px; }
.vp-app-osce .vp-app-name { color: #10b981; }
.vp-app-ddx .vp-app-name { color: #f97316; }
.vp-app-desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 4px; }
.vp-app-meta { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 11px; color: #94a3b8; letter-spacing: 1px; }
.vp-app-arrow { font-size: 28px; font-weight: 700; color: #0a0a0a; flex-shrink: 0; }

/* COMING SOON state */
.vp-app-soon { position: relative; cursor: not-allowed; opacity: 0.55; pointer-events: none; }
.vp-app-soon:hover { transform: none; box-shadow: 5px 5px 0 #f97316; }
.vp-soon-badge {
  position: absolute; top: -8px; right: 12px;
  padding: 4px 10px; background: #0a0a0a; color: #f97316;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 10px; font-weight: 700; letter-spacing: 2px;
  border-radius: 4px; border: 2px solid #f97316;
  z-index: 2;
}

.vp-note { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; font-family: 'Noto Sans Thai', sans-serif; }

/* Full version block */
.vp-full {
  max-width: 1200px;
  margin: 32px auto 0;
  text-align: center;
  padding: 28px 20px;
  background: #0a0a0a;
  border: 2px solid #0a0a0a;
  border-radius: 14px;
  box-shadow: 5px 5px 0 #8b5cf6;
  font-family: 'IBM Plex Sans Thai', 'Noto Sans Thai', sans-serif;
}
.vp-full-line {
  width: 36px; height: 3px;
  background: #8b5cf6;
  margin: 0 auto 14px;
  border-radius: 2px;
}
.vp-full-sub {
  font-size: 15px; color: #fff; font-weight: 600;
  margin-bottom: 14px;
}
.vp-full-pills {
  display: inline-flex; gap: 6px; flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 18px;
}
.vp-full-pill {
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  letter-spacing: 1.5px;
  background: rgba(139,92,246,0.15);
  color: #c4b5fd;
  border: 1px solid rgba(139,92,246,0.4);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
}
.vp-full-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  background: #fff;
  color: #0a0a0a !important;
  text-decoration: none;
  border-radius: 8px;
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  letter-spacing: 2px;
  font-size: 16px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.vp-full-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #8b5cf6; }

/* Footer */
.vp-footer {
  text-align: center;
  padding: 28px 16px 16px;
  font-family: 'Bebas Neue', 'Anton', Impact, sans-serif;
  letter-spacing: 4px;
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 1240px) and (min-width: 901px) {
  .vp-banner { width: 1200px; transform: scale(calc((100vw - 32px) / 1200)); transform-origin: top center; margin: 0 auto; margin-bottom: calc((630px * ((100vw - 32px) / 1200)) - 630px); }
  .vp-section { overflow: hidden; padding-left: 16px; padding-right: 16px; }
}

@media (max-width: 900px) {
  /* Mobile: fit ใน 1 viewport — banner compact + cards เล็ก */
  .vp-section { padding: 10px 12px 14px; min-height: 100vh; display: flex; flex-direction: column; }
  .container { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .vp-banner { aspect-ratio: auto; width: 100%; max-width: 500px; padding: 14px 18px 0; box-shadow: 5px 5px 0 rgba(139,92,246,0.4); border-radius: 12px; min-height: 0; height: 260px; }
  .vp-monogram { font-size: 200px; top: -20px; right: -20px; }
  .vp-scan { top: 90px; }
  .vp-corner-tag { top: 12px; left: 12px; font-size: 7px; padding: 3px 6px; gap: 4px; }
  .vp-dot { width: 5px; height: 5px; }
  .vp-brand { display: none; }
  .vp-br { width: 20px; height: 20px; }
  .vp-tl, .vp-tr { top: 6px; }
  .vp-tl { left: 6px; }
  .vp-tr { right: 6px; }
  .vp-bl { bottom: 6px; left: 6px; }
  .vp-br2 { bottom: 6px; right: 6px; }
  .vp-tl::before, .vp-tr::before, .vp-bl::before, .vp-br2::before { width: 20px; height: 2.5px; }
  .vp-tl::after, .vp-tr::after, .vp-bl::after, .vp-br2::after { width: 2.5px; height: 20px; }
  .vp-stage { grid-template-columns: 1fr; gap: 0; align-items: start; padding-top: 18px; }
  .vp-right { position: absolute; top: 38px; right: 16px; z-index: 5; display: block; height: auto; padding: 0; }
  .vp-logo-orb { width: 50px; height: 50px; margin: 0; }
  .vp-logo-orb::after { inset: -6px; border-width: 1.5px; }
  .vp-logo-orb::before { inset: -12px; border-width: 1.5px; }
  .vp-left { position: relative; z-index: 4; max-width: 60%; }
  .vp-label { font-size: 9px; letter-spacing: 1.5px; margin-bottom: 8px; }
  .vp-headline { font-size: 38px; letter-spacing: 1.5px; margin-bottom: 6px; }
  .vp-headline .vp-pur::after { height: 3px; bottom: 2px; }
  .vp-sub { font-size: 11px; margin-bottom: 8px; max-width: 100%; line-height: 1.4; }
  .vp-pills { gap: 4px; }
  .vp-pills .vp-pill { font-size: 9px; padding: 2px 6px; box-shadow: 2px 2px 0 var(--vp-ink); letter-spacing: 1px; }
  .vp-pills .vp-for { font-size: 8px; letter-spacing: 1.5px; }
  .vp-mascot-wrap { width: 130px; height: 180px; left: auto; right: -8px; bottom: 0; transform: none; }

  .vp-choose { grid-template-columns: 1fr; gap: 8px; margin-top: 0; }
  .vp-app { padding: 10px 14px; gap: 10px; box-shadow: 3px 3px 0 #0a0a0a; border-radius: 10px; }
  .vp-app-osce { box-shadow: 3px 3px 0 #10b981; }
  .vp-app-ddx { box-shadow: 3px 3px 0 #f97316; }
  .vp-app-icon { font-size: 22px; }
  .vp-app-name { font-size: 16px; letter-spacing: 1px; margin-bottom: 2px; }
  .vp-app-desc { font-size: 11px; line-height: 1.35; margin-bottom: 2px; }
  .vp-app-desc br { display: none; }
  .vp-app-meta { font-size: 9px; letter-spacing: 0.5px; }
  .vp-app-arrow { font-size: 20px; }
  .vp-note { display: none; }

  /* vp-full mobile */
  .vp-full { margin-top: 14px; padding: 16px 14px; box-shadow: 3px 3px 0 #8b5cf6; border-radius: 12px; }
  .vp-full-line { width: 24px; height: 2px; margin-bottom: 8px; }
  .vp-full-sub { font-size: 12px; margin-bottom: 8px; }
  .vp-full-pills { gap: 4px; margin-bottom: 10px; }
  .vp-full-pill { font-size: 10px; padding: 3px 7px; letter-spacing: 1px; }
  .vp-full-btn { padding: 7px 14px; font-size: 12px; letter-spacing: 1px; gap: 5px; }
  .vp-footer { padding: 14px 16px 8px; font-size: 10px; letter-spacing: 2px; }
}

@media (max-width: 420px) {
  .vp-banner { height: 240px; padding: 12px 14px 0; }
  .vp-headline { font-size: 32px; }
  .vp-mascot-wrap { width: 110px; height: 160px; }
}
</style>
