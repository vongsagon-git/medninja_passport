// Browser Guard middleware
// ═══════════════════════════════════════════════════════════
// กฎ (ดู docs/RULES.md):
//   iPhone/iPad    → No-DRM, Chrome iOS (CriOS/) เท่านั้น
//   Android        → DRM Widevine, Chrome เท่านั้น
//   Win/Mac/Linux  → DRM Widevine, Chrome เท่านั้น
// ═══════════════════════════════════════════════════════════
// Exception path: /demo/watch/*, sectionId 69d4bd730b7e480d9c5213a0

const { isIOS, isAndroid } = require('../util/deviceDetect')

const EXCEPTION_SECTION_IDS = ['69d4bd730b7e480d9c5213a0']

function isExceptionRequest(req) {
  const referer = req.get('referer') || ''
  if (/\/demo\/watch/.test(referer)) return true
  for (const id of EXCEPTION_SECTION_IDS) {
    if (referer.includes(`/my/watch/${id}`)) return true
  }
  if (req.params && req.params.id && EXCEPTION_SECTION_IDS.includes(req.params.id)) return true
  if (req.params && req.params.sectionId && EXCEPTION_SECTION_IDS.includes(req.params.sectionId)) return true
  return false
}

function checkBrowser(req) {
  const ua = req.get('user-agent') || ''

  // ── 1. Mobile in-app browser → block ก่อน ──
  if (/Line\/|FBAN|FBAV|Instagram|musical_ly|BytedanceWebview|MicroMessenger|KAKAOTALK|Discord|ZoomWebKit/i.test(ua)) {
    return { ok: false, reason: 'in-app browser ไม่รองรับ — กรุณาเปิดใน Safari หรือ Chrome' }
  }

  // ── 2. iPhone / iPad — Chrome iOS (CriOS/) เท่านั้น ──
  //   Block Safari mobile + iPad Safari (เดิม allow — เปลี่ยนเพื่อกัน downloader browser
  //   เช่น Documents by Readdle ที่ pipeline ผ่าน Safari-based views)
  if (isIOS(req)) {
    const isIOSChrome = /CriOS\//.test(ua)
    if (isIOSChrome) return { ok: true }
    return { ok: false, reason: 'iPhone/iPad รองรับเฉพาะ Google Chrome (โหลดจาก App Store)' }
  }

  // ── 3. Android — Chrome เท่านั้น ──
  if (isAndroid(req)) {
    const isChromeAndroid = /Chrome\//.test(ua)
      && !/Edg\//.test(ua)
      && !/OPR\//.test(ua)
      && !/SamsungBrowser/i.test(ua)
      && !/UCBrowser/i.test(ua)
    if (isChromeAndroid) return { ok: true }
    return { ok: false, reason: 'Android รองรับเฉพาะ Google Chrome' }
  }

  // ── 4. Desktop (Win/Mac/Linux) — Chrome เท่านั้น ──
  const isChromeDesktop = /Chrome\//.test(ua)
    && !/Edg\//.test(ua)
    && !/OPR\//.test(ua)
    && !/Vivaldi/i.test(ua)
    && !/YaBrowser/i.test(ua)
    && !/UCBrowser/i.test(ua)
    && !/QQBrowser/i.test(ua)
    && !/Maxthon/i.test(ua)
    && !/whale/i.test(ua)
    && !/Chromium\//.test(ua)
    && !/Electron/i.test(ua)
    && !/SamsungBrowser/i.test(ua)

  if (isChromeDesktop) return { ok: true }

  return {
    ok: false,
    reason: 'กรุณาใช้ Google Chrome บน Desktop (Windows / macOS / Linux) เพื่อดูวีดีโอ'
  }
}

module.exports = function chromeOnly(req, res, next) {
  if (isExceptionRequest(req)) return next()

  const result = checkBrowser(req)
  if (result.ok) return next()

  return res.status(403).json({
    code: 'BROWSER_NOT_SUPPORTED',
    message: result.reason
  })
}
