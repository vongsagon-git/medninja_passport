// ═══════════════════════════════════════════════════════════
// Device Detection — มาตรฐานเดียวทั่วระบบ (backend)
// ═══════════════════════════════════════════════════════════
// iPhone        → UA: /iPhone|iPod/
// iPad iOS 12-  → UA: /iPad/
// iPad iOS 13+  → UA = Mac → backend ไม่มี maxTouchPoints
//                → ใช้ X-MN-Device header ที่ frontend ส่งมา (axios interceptor)
//
// ทุก backend code ต้อง import จากไฟล์นี้เท่านั้น
// ห้าม inline regex iOS detection อีก
// ═══════════════════════════════════════════════════════════

function getUA(req) {
  return (req && req.get ? req.get('user-agent') : (req?.headers?.['user-agent'] || '')) || ''
}

function getDeviceHintHeader(req) {
  return (req && req.get ? req.get('x-mn-device') : (req?.headers?.['x-mn-device'] || '')) || ''
}

function isIPhone(req) {
  const ua = typeof req === 'string' ? req : getUA(req)
  return /iPhone|iPod/.test(ua)
}

function isIPad(req) {
  const ua = typeof req === 'string' ? req : getUA(req)
  // iPad iOS 12-
  if (/iPad/.test(ua)) return true
  // iPad iOS 13+ → UA เป็น Mac → ใช้ header hint
  if (typeof req !== 'string') {
    const hint = getDeviceHintHeader(req)
    if (hint === 'ios-ipad') return true
  }
  return false
}

function isIOS(req) {
  return isIPhone(req) || isIPad(req)
}

function isAndroid(req) {
  const ua = typeof req === 'string' ? req : getUA(req)
  return /Android/i.test(ua)
}

function isMacSafari(req) {
  const ua = typeof req === 'string' ? req : getUA(req)
  // Mac Safari = Macintosh + Safari/ + ไม่มี Chrome/Edg/Firefox marker
  if (!/Macintosh|Mac OS X/.test(ua)) return false
  if (!/Safari\//.test(ua)) return false
  if (/Chrome\/|Edg\/|Firefox\/|OPR\//.test(ua)) return false
  return true
}

function getOS(req) {
  const ua = typeof req === 'string' ? req : getUA(req)
  if (isIPhone(req)) return 'iOS'
  if (isIPad(req)) return 'iOS'
  if (isAndroid(req)) return 'Android'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/CrOS/i.test(ua)) return 'ChromeOS'
  if (/Linux|X11/i.test(ua)) return 'Linux'
  return 'Other'
}

module.exports = {
  isIPhone,
  isIPad,
  isIOS,
  isAndroid,
  isMacSafari,
  getOS
}
