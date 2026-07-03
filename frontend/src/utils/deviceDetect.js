// ═══════════════════════════════════════════════════════════
// Device Detection — มาตรฐานเดียวทั่วระบบ
// ═══════════════════════════════════════════════════════════
// iPhone        → UA: /iPhone|iPod/
// iPad iOS 12-  → UA: /iPad/
// iPad iOS 13+  → platform=MacIntel + maxTouchPoints>1
//
// ทุกที่ในระบบต้อง import จากไฟล์นี้เท่านั้น
// ห้าม inline regex iOS detection อีก
// ═══════════════════════════════════════════════════════════

export function isIPhone(ua = navigator.userAgent || '') {
  return /iPhone|iPod/.test(ua)
}

export function isIPad(ua = navigator.userAgent || '') {
  // iPad iOS 12-
  if (/iPad/.test(ua)) return true
  if (typeof navigator === 'undefined') return false
  // iPad iOS 13+ ปลอม UA เป็น Mac
  // ── layer 1: platform (deprecated แต่ยังทำงานบน Safari)
  const isMacLike = navigator.platform === 'MacIntel'
    || navigator.platform === 'iPad'
  // ── layer 2: userAgentData (Chrome/Edge, new API)
  const uaDataMac = navigator.userAgentData
    && (navigator.userAgentData.platform === 'macOS'
        || navigator.userAgentData.platform === 'iOS')
  // ── layer 3: touch (คน desktop touch monitor อาจตกเกณฑ์นี้ — บวก mac check)
  const hasTouch = navigator.maxTouchPoints > 1
  if ((isMacLike || uaDataMac) && hasTouch) return true
  // ── layer 4: fallback — Mac ที่ไม่มี Chrome/Firefox/Edge markers + touch
  //    (Safari-only Mac → มักจะเป็น iPad Safari)
  if (/Macintosh|Mac OS X/.test(ua)
      && !/Chrome\/|Firefox\/|Edg\//.test(ua)
      && hasTouch) return true
  return false
}

export function isIOS(ua = navigator.userAgent || '') {
  return isIPhone(ua) || isIPad(ua)
}

export function isAndroid(ua = navigator.userAgent || '') {
  return /Android/i.test(ua)
}

export function getOS(ua = navigator.userAgent || '') {
  if (isIPhone(ua)) return 'iOS'
  if (isIPad(ua)) return 'iOS'
  if (isAndroid(ua)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/Linux|X11/i.test(ua)) return 'Linux'
  if (/CrOS/i.test(ua)) return 'ChromeOS'
  return 'Other'
}

// Browser detection — ลำดับสำคัญ (เฉพาะเจาะจงก่อน)
export function getBrowser(ua = navigator.userAgent || '') {
  // in-app browsers ก่อน (UA มี Chrome/Safari ปนด้วย)
  if (/Line\//.test(ua)) return 'LINE'
  if (/FBAN|FBAV|FB_IAB/.test(ua)) return 'Facebook'
  if (/Instagram/.test(ua)) return 'Instagram'
  if (/MicroMessenger/.test(ua)) return 'WeChat'
  if (/KAKAOTALK/.test(ua)) return 'KakaoTalk'
  if (/TikTok|musical_ly|BytedanceWebview/.test(ua)) return 'TikTok'
  if (/Discord/.test(ua)) return 'Discord'
  if (/Twitter/.test(ua)) return 'Twitter'

  // Brave (UA เหมือน Chrome — ต้อง check navigator.brave)
  if (typeof navigator !== 'undefined' && navigator.brave) return 'Brave'

  if (/EdgiOS|EdgA|Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Vivaldi/.test(ua)) return 'Vivaldi'
  if (/YaBrowser/.test(ua)) return 'Yandex'
  if (/SamsungBrowser/.test(ua)) return 'Samsung'
  if (/UCBrowser|UCWEB/.test(ua)) return 'UC Browser'
  if (/FxiOS|Firefox\//.test(ua)) return 'Firefox'
  if (/CriOS/.test(ua)) return 'Chrome'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Other'
}

// Mac Safari = Macintosh + Safari + ไม่มี Chrome/Edg/Firefox marker
export function isMacSafari(ua = navigator.userAgent || '') {
  if (!/Macintosh|Mac OS X/.test(ua)) return false
  if (!/Safari\//.test(ua)) return false
  if (/Chrome\/|Edg\/|Firefox\/|OPR\/|CriOS|FxiOS/.test(ua)) return false
  return true
}

// header value ที่ frontend ส่งไป backend → backend ใช้ตัดสินใจตอน iPad iOS 13+
export function getDeviceHint() {
  if (isIPhone()) return 'ios-iphone'
  if (isIPad()) return 'ios-ipad'
  if (isAndroid()) return 'android'
  return 'desktop'
}

// ─── Passport additions (2026-07-03) ─────────────────────────
// เพิ่มจากมาตรฐาน LMS โดยไม่กระทบของเดิม — ใช้ใน OrientationGuard + responsive

// Mobile phone (ไม่รวม tablet) — iPhone หรือ Android มี "Mobile" ใน UA
export function isMobilePhone(ua = navigator.userAgent || '') {
  if (isIPhone(ua)) return true
  if (isAndroid(ua) && /Mobile/.test(ua)) return true
  return false
}

// Tablet — iPad หรือ Android ที่ไม่มี "Mobile" (Android tablet)
export function isTablet(ua = navigator.userAgent || '') {
  if (isIPad(ua)) return true
  if (isAndroid(ua) && !/Mobile/.test(ua)) return true
  return false
}

// Desktop = ไม่ใช่ mobile phone และไม่ใช่ tablet
export function isDesktop(ua = navigator.userAgent || '') {
  return !isMobilePhone(ua) && !isTablet(ua)
}

// รวม category เดียว → ใช้ใน UI/analytics
export function getDeviceCategory(ua = navigator.userAgent || '') {
  if (isMobilePhone(ua)) return 'mobile'
  if (isTablet(ua)) return 'tablet'
  return 'desktop'
}
