// Browser & Device detection — ตามกฎ docs/RULES.md
// iPhone/iPad → No-DRM, Safari หรือ Chrome เท่านั้น
// Android → Widevine DRM, Chrome เท่านั้น
// Desktop → Widevine DRM, Chrome เท่านั้น
// Exception path → ดู isExceptionPath() ใน views

import { isIOS as detectIOS, isAndroid as detectAndroid, getOS as detectOSHelper, getBrowser as detectBrowserHelper } from './deviceDetect'

export const EXCEPTION_SECTION_IDS = ['69d4bd730b7e480d9c5213a0']

export function isExceptionPath(path) {
  if (!path) return false
  // /demo/watch/* → ผ่านทุก browser (วิดีโอตัวอย่างก่อนสมัคร)
  if (path.startsWith('/demo/watch')) return true
  // section พิเศษ → ผ่านทุก browser
  return EXCEPTION_SECTION_IDS.some(id => path.includes(`/my/watch/${id}`))
}

export function checkBrowserSupport() {
  const ua = navigator.userAgent || ''

  // ═══ 1. Device detection (มาตรฐานเดียวจาก deviceDetect.js) ═══
  const isIOS = detectIOS(ua)
  const isAndroid = detectAndroid(ua)
  const isMobile = isIOS || isAndroid
    || /Windows Phone|IEMobile/i.test(ua)
    || /webOS|BlackBerry|BB10|KAIOS|HarmonyOS/i.test(ua)
    || /Opera Mini|Opera Mobi/i.test(ua)

  // ═══ 2. In-app browser → block ก่อน (LINE/FB/IG/...) ═══
  const inApp = /Line\/|FBAN|FBAV|Instagram|musical_ly|BytedanceWebview|MicroMessenger|KAKAOTALK|Discord|ZoomWebKit/i
  if (inApp.test(ua)) {
    return {
      supported: false, isMobile: true,
      message: 'กรุณาเปิดใน Chrome หรือ Safari',
      detail: 'Browser ใน LINE / Facebook / Instagram ไม่รองรับการเล่นวีดีโอ กดปุ่ม ⋮ แล้วเลือก "เปิดใน Browser"'
    }
  }

  // ═══ 3. iPhone / iPad — Safari หรือ Chrome เท่านั้น (กัน app ดูด HLS) ═══
  if (isIOS) {
    const isIOSSafari = /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua)
    const isIOSChrome = /CriOS\//.test(ua)
    if (isIOSSafari || isIOSChrome) {
      return { supported: true, isMobile: true }
    }
    return {
      supported: false, isMobile: true,
      message: 'iPhone/iPad รองรับเฉพาะ Safari หรือ Chrome',
      detail: 'กรุณาเปิดลิงก์นี้ใน Safari หรือ Chrome เพื่อดูวีดีโอ'
    }
  }

  // ═══ 4. Android — Chrome เท่านั้น ═══
  if (isAndroid) {
    const isChromeAndroid = /Chrome\//.test(ua)
      && !/Edg\//.test(ua)
      && !/OPR\//.test(ua)
      && !/SamsungBrowser/i.test(ua)
      && !/UCBrowser/i.test(ua)
    if (isChromeAndroid) {
      return { supported: true, isMobile: true }
    }
    return {
      supported: false, isMobile: true,
      message: 'Android รองรับเฉพาะ Google Chrome',
      detail: 'กรุณาเปิดลิงก์นี้ใน Chrome เพื่อดูวีดีโอ'
    }
  }

  // Mobile อื่นๆ (Windows Phone, BlackBerry, etc.) — ไม่ support
  if (isMobile) {
    return {
      supported: false, isMobile: true,
      message: 'อุปกรณ์นี้ไม่รองรับ',
      detail: 'ระบบรองรับ iPhone, iPad, Android, Windows, macOS, Linux เท่านั้น'
    }
  }

  // ═══ 2. Desktop — Chrome เท่านั้น ═══
  // เหตุผล: ระบบใช้ Widevine DRM ซึ่งทำงานเสถียรกับ Chrome
  // Safari = FairPlay (ไม่รองรับ Widevine)
  // Edge/Firefox/Brave/อื่นๆ = Widevine ไม่เสถียร หรือมีปัญหา anti-share

  // Block Brave (ตรวจก่อน Chrome เพราะ UA เหมือนกัน)
  if (navigator.brave !== undefined) {
    return {
      supported: false, isMobile: false,
      message: 'กรุณาใช้ Google Chrome เพื่อดูวีดีโอ',
      detail: 'ระบบรองรับเฉพาะ Google Chrome บน Desktop เพื่อความปลอดภัยและการเล่นวีดีโอที่เสถียร'
    }
  }

  // Chrome เท่านั้น — exclude Edg (Edge) + อื่นๆ ทั้งหมด
  const isChrome = /Chrome\//.test(ua)
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

  if (isChrome) {
    return { supported: true, isMobile: false }
  }

  // Block ทุก browser ที่ไม่ใช่ Chrome
  return {
    supported: false, isMobile: false,
    message: 'กรุณาใช้ Google Chrome เพื่อดูวีดีโอ',
    detail: 'ระบบรองรับเฉพาะ Google Chrome บน Desktop (Windows / macOS / Linux) — กรุณาเปิดลิงก์นี้ใน Chrome เพื่อดูวีดีโอ'
  }
}

export function getDeviceInfo() {
  const ua = navigator.userAgent || ''
  return `${detectOSHelper(ua)} · ${detectBrowserHelper(ua)}`
}
