// ═══════════════════════════════════════════════════════════
// Browser & Device Detection — driven by IP BASE config
// ═══════════════════════════════════════════════════════════
// SystemCircuit (admin) เก็บ 2 lists ต่อกลุ่ม IP:
//   - AllowedBrowsers: 3 slots (Chrome / Safari / Edge)
//   - AllowedOS:       5 slots (Windows / macOS / iOS / Android / Harmony)
//
// checkBrowserSupport() รับทั้ง 2 lists → allow เฉพาะที่อยู่ใน list ทั้งคู่ (AND)
// นอก list = block. In-App = hard block ตายตัวใน code (ไม่มี toggle)
//
// Chrome slot = 4-whitelist (Google + Huawei + QQ + Samsung เท่านั้น)
//   MIUI/HeyTap/Vivo/Magic/Petal/Brave/Opera/Vivaldi = ตกไปที่ Other → block
// ═══════════════════════════════════════════════════════════

import { getBrowser as detectBrowserHelper, getOS as detectOSHelper, detectOSSlot } from './deviceDetect'

export const EXCEPTION_SECTION_IDS = ['69d4bd730b7e480d9c5213a0']

export function isExceptionPath (path) {
  if (!path) return false
  if (path.startsWith('/demo/watch')) return true
  return EXCEPTION_SECTION_IDS.some(id => path.includes(`/my/watch/${id}`))
}

// ─── In-App browsers — hard block (ไม่ผ่าน config) ───
const IN_APP_REGEX = /Line\/|FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|KAKAOTALK|Discord|Messenger|Twitter|TwitterAndroid|Snapchat|Telegram|Slack|Pinterest|musical_ly|BytedanceWebview|TikTok|ZoomWebKit|GSA\/|YahooMobile|DuckDuckGo/i

// ─── Chrome slot whitelist (4 ตัว) ───
// Huawei Browser UA มี "HuaweiBrowser/" หรือ "HarmonyOS" tag
// QQBrowser mobile มี "QQBrowser/" tag
// Samsung Internet มี "SamsungBrowser/" tag
// Google Chrome = pure "Chrome/" ไม่มี fork tag
const CHROME_FORK_BLOCK_REGEX = /MiuiBrowser\/|HeyTapBrowser\/|VivoBrowser\/|MagicBrowser\/|PetalSearch\/|OPR\/|Vivaldi\/|YaBrowser\/|Brave\/|UCBrowser|QIHU|SogouMSE|SE 2\.X MetaSr|Maxthon|whale/i

/**
 * detectBrowserSlot — จับ browser เป็น 1 ใน 4 slot: In-App / Edge / Chrome / Safari / Other
 * Chrome slot = whitelist 4 ตัว (Google + Huawei + QQ + Samsung)
 */
export function detectBrowserSlot (ua = navigator.userAgent || '') {
  // 1) In-app browsers — hard block เสมอ
  if (IN_APP_REGEX.test(ua)) return 'In-App'

  // 2) Edge (มี Chrome tag ปนใน UA — ต้องเช็คก่อน)
  if (/EdgiOS|EdgA|Edg\//.test(ua)) return 'Edge'

  // 3) Chrome slot — 4 ตัวเป๊ะ
  //    Huawei Browser (Harmony device)
  if (/HuaweiBrowser\/|HarmonyOS|OpenHarmony/i.test(ua)) return 'Chrome'
  //    QQ Browser (Tencent — mobile/desktop)
  if (/QQBrowser\//i.test(ua)) return 'Chrome'
  //    Samsung Internet
  if (/SamsungBrowser\//i.test(ua)) return 'Chrome'
  //    Chrome iOS (Google Chrome บน iPhone/iPad)
  if (/CriOS\//i.test(ua)) return 'Chrome'
  //    Google Chrome pure — ต้องไม่มี fork tag + ไม่ใช่ Brave
  if (/Chrome\//.test(ua)
      && !CHROME_FORK_BLOCK_REGEX.test(ua)
      && !(typeof navigator !== 'undefined' && navigator.brave)) {
    return 'Chrome'
  }

  // 4) Safari (desktop + iOS)
  if (/Safari\//.test(ua)) return 'Safari'

  return 'Other'
}

/**
 * checkBrowserSupport
 * @param {string[]} [allowedBrowsers]  ← จาก ipBase*AllowedBrowsers config
 * @param {string[]} [allowedOS]        ← จาก ipBase*AllowedOS config
 * @param {string}   [ua]
 * @returns {{supported: boolean, isMobile: boolean, message?: string, detail?: string, slot?: string, osSlot?: string}}
 */
export function checkBrowserSupport (allowedBrowsers, allowedOS, ua) {
  ua = ua || navigator.userAgent || ''
  // fallback lists — ใช้ตอน config ยังไม่โหลด (safety net)
  const allowBr = Array.isArray(allowedBrowsers) && allowedBrowsers.length
    ? allowedBrowsers
    : ['Chrome', 'Safari', 'Edge']
  const allowOS = Array.isArray(allowedOS) && allowedOS.length
    ? allowedOS
    : ['Windows', 'macOS', 'iOS', 'Android', 'Harmony']

  const slot   = detectBrowserSlot(ua)
  const osSlot = detectOSSlot(ua)
  const isMobile = /iPhone|iPod|iPad|Android|Windows Phone|IEMobile|webOS|BlackBerry|BB10|KAIOS|HarmonyOS|Opera Mini|Opera Mobi/i.test(ua)

  // ─── In-App = hard block เสมอ (ก่อน allow check) ───
  if (slot === 'In-App') {
    return {
      supported: false, isMobile: true, slot, osSlot,
      message: 'กรุณาเปิดใน Chrome, Safari, Edge',
      detail: 'Browser ที่อยู่ในแอป (LINE / Facebook / Instagram / TikTok / etc.) ไม่รองรับ กดปุ่ม ⋮ หรือ ⋯ แล้วเลือก "เปิดใน Browser"'
    }
  }

  // ─── OS check ก่อน (ครอบชั้นบน) ───
  if (!allowOS.includes(osSlot)) {
    return {
      supported: false, isMobile, slot, osSlot,
      message: `ระบบไม่รองรับอุปกรณ์ ${osSlot === 'Other' ? 'นี้' : osSlot}`,
      detail: `กรุณาเข้าใช้งานจาก ${allowOS.join(' / ')} เพื่อดูวีดีโอ`
    }
  }

  // ─── Browser check ───
  if (!allowBr.includes(slot)) {
    const brLabel = allowBr.map(b => {
      if (b === 'Chrome') return 'Chrome (Google/Huawei/QQ/Samsung)'
      return b
    }).join(' / ')
    return {
      supported: false, isMobile, slot, osSlot,
      message: `กรุณาใช้ ${allowBr.join(' / ')} เพื่อดูวีดีโอ`,
      detail: `ระบบรองรับ ${brLabel} เท่านั้น`
    }
  }

  return { supported: true, isMobile, slot, osSlot }
}

export function getDeviceInfo () {
  const ua = navigator.userAgent || ''
  return `${detectOSHelper(ua)} · ${detectBrowserHelper(ua)}`
}
