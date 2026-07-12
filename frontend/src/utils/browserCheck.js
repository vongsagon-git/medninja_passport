// ═══════════════════════════════════════════════════════════
// Browser & Device Detection — driven by IP BASE config
// ═══════════════════════════════════════════════════════════
// Circuit Breaker (SystemCircuit.vue) เก็บ list "Browser Allow"
// ต่อกลุ่ม IP (TH / CN / Other) → checkBrowserSupport() รับ
// list มา แล้ว allow เฉพาะที่อยู่ใน list. นอกนั้น block หมด.
//
// 4 browser slots เท่านั้น:
//   Chrome  — Chrome desktop + Chrome iOS (CriOS) + Chrome Android
//   Safari  — Safari desktop + Safari iOS
//   Edge    — Edge desktop + Edge iOS (EdgiOS) + Edge Android
//   In-App  — LINE / Facebook / Instagram / WeChat / TikTok / etc.
// ═══════════════════════════════════════════════════════════

import { getBrowser as detectBrowserHelper, getOS as detectOSHelper } from './deviceDetect'

export const EXCEPTION_SECTION_IDS = ['69d4bd730b7e480d9c5213a0']

export function isExceptionPath (path) {
  if (!path) return false
  if (path.startsWith('/demo/watch')) return true
  return EXCEPTION_SECTION_IDS.some(id => path.includes(`/my/watch/${id}`))
}

// ─── Detect current browser as one of 4 slots (or 'Other') ───
export function detectBrowserSlot (ua = navigator.userAgent || '') {
  // In-app browsers ครอบทับก่อน (UA มี Chrome/Safari ปนด้วย)
  if (/Line\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|KAKAOTALK|Discord|Messenger|Twitter|TwitterAndroid|Snapchat|Telegram|Slack|Pinterest|musical_ly|BytedanceWebview|TikTok|ZoomWebKit|GSA\/|YahooMobile|DuckDuckGo/i.test(ua)) {
    return 'In-App'
  }
  // Edge (มี Chrome/Safari ปนใน UA — ต้องเช็คก่อน)
  if (/EdgiOS|EdgA|Edg\//.test(ua)) return 'Edge'
  // Chrome (รวม CriOS = Chrome iOS)
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome'
  // Safari (desktop + iOS)
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Other'
}

/**
 * checkBrowserSupport
 * @param {string[]} [allowedBrowsers]  ← จาก ipBase*AllowedBrowsers config
 *                                       ถ้าไม่ส่ง (fail-open) = allow เฉพาะ Chrome+Safari+Edge
 * @param {string}   [ua]
 * @returns {{supported: boolean, isMobile: boolean, message?: string, detail?: string, slot?: string}}
 */
export function checkBrowserSupport (allowedBrowsers, ua) {
  ua = ua || navigator.userAgent || ''
  // fallback list — ใช้ตอน config ยังไม่โหลด (safety net)
  const allow = Array.isArray(allowedBrowsers) && allowedBrowsers.length
    ? allowedBrowsers
    : ['Chrome', 'Safari', 'Edge']

  const slot = detectBrowserSlot(ua)
  const isMobile = /iPhone|iPod|iPad|Android|Windows Phone|IEMobile|webOS|BlackBerry|BB10|KAIOS|HarmonyOS|Opera Mini|Opera Mobi/i.test(ua)

  // อยู่ใน allow list → ผ่าน
  if (allow.includes(slot)) {
    return { supported: true, isMobile, slot }
  }

  // นอก allow list → block พร้อมข้อความที่เหมาะสม
  if (slot === 'In-App') {
    return {
      supported: false, isMobile: true, slot,
      message: 'กรุณาเปิดใน Chrome หรือ Safari',
      detail: 'Browser ที่อยู่ในแอป (LINE / Facebook / Instagram / TikTok / etc.) ไม่รองรับ กดปุ่ม ⋮ หรือ ⋯ แล้วเลือก "เปิดใน Browser"'
    }
  }

  // Other = ไม่รู้จัก หรือถูก admin ตัดออก
  const allowText = allow.filter(b => b !== 'In-App').join(' / ') || 'Chrome'
  return {
    supported: false, isMobile, slot,
    message: `กรุณาใช้ ${allowText} เพื่อดูวีดีโอ`,
    detail: `ระบบรองรับ ${allowText} เท่านั้น กรุณาเปิดลิงก์นี้ใน browser ที่รองรับ`
  }
}

export function getDeviceInfo () {
  const ua = navigator.userAgent || ''
  return `${detectOSHelper(ua)} · ${detectBrowserHelper(ua)}`
}
