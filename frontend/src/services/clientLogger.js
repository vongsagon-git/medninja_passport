/**
 * Client Logger — แอบเก็บ error + พฤติกรรมจาก frontend ส่งให้ backend
 */
import api from './api'
import { isIPhone, isIPad, isAndroid, getBrowser as detectBrowser } from '../utils/deviceDetect'

function getOS() {
  // iOS — แยก iPhone vs iPad ตามมาตรฐาน (ดู utils/deviceDetect.js)
  if (isIPhone()) return 'iOS (iPhone)'
  if (isIPad()) return 'iOS (iPad)'

  const ua = navigator.userAgent || ''

  // Android (phone vs tablet)
  if (isAndroid(ua)) {
    if (/Mobile/.test(ua)) return 'Android'
    return 'Android (Tablet)'
  }

  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function getBrowser() {
  return detectBrowser()
}

function getScreenSize() {
  return `${window.innerWidth}x${window.innerHeight}`
}

export function getDeviceContext() {
  let timezone = ''
  let tzOffset = 0
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    tzOffset = -new Date().getTimezoneOffset() / 60
  } catch {}
  return {
    os: getOS(),
    browser: getBrowser(),
    userAgent: navigator.userAgent,
    screenSize: getScreenSize(),
    timezone,
    tzOffset
  }
}

/**
 * ส่ง log ไป backend แบบเงียบๆ (fire-and-forget)
 */
export function sendLog(type, message, extra = {}) {
  const device = getDeviceContext()
  api.post('/my/client-log', {
    type,
    message,
    url: window.location.href,
    ...device,
    ...extra
  }).catch(() => {}) // ห้ามให้ log error ทำ app พัง
}

/**
 * ตรวจจับ Stream Recorder / HLS Downloader extensions
 * ใช้ 3 วิธี: probe extension ID + ดัก blob download + ดัก MediaRecorder
 */
const KNOWN_RECORDER_EXTENSIONS = [
  { id: 'iogidnfllpdhagebkblkgbfijkbkjdmm', name: 'Stream Recorder' },
  { id: 'nfmmmhanepmpifddlkkmihkalkoekpfd', name: 'FetchV' },
  { id: 'dcfofgiipjlhkemnpmiakbmblkbhgmga', name: 'Video DownloadHelper' },
  { id: 'lmjnegcaeklhafolokijcfjliaokphfk', name: 'Video Downloader Pro' },
  { id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm', name: 'uBlock Origin' }
]

/**
 * Probe extension IDs — return Promise<{ found, extension }>
 * ใช้ก่อนโหลด video (blocking check)
 */
export function probeRecorderExtensions() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      return resolve({ found: false })
    }
    let found = false
    let checked = 0
    const total = KNOWN_RECORDER_EXTENSIONS.length
    const done = () => { if (++checked >= total && !found) resolve({ found: false }) }

    KNOWN_RECORDER_EXTENSIONS.forEach(ext => {
      try {
        const img = new Image()
        img.onload = () => {
          if (!found) { found = true; resolve({ found: true, extension: ext.name, method: 'extension_probe' }) }
        }
        img.onerror = done
        img.src = `chrome-extension://${ext.id}/icon.png`
        setTimeout(done, 2000) // timeout 2 วิ ต่อ extension
      } catch (e) { done() }
    })
  })
}

/**
 * Realtime watcher — probe extension ID ซ้ำทุก intervalMs
 */
export function watchRecorderExtensions(onDetect, intervalMs = 10000) {
  let detected = false

  const probeOnce = () => {
    if (detected) return
    probeRecorderExtensions().then(r => {
      if (r.found && !detected) {
        detected = true
        onDetect({ method: r.method, extension: r.extension })
      }
    })
  }
  probeOnce()
  const probeTimer = setInterval(probeOnce, intervalMs)

  return () => {
    clearInterval(probeTimer)
    detected = false
  }
}

/**
 * ตรวจจับ DevTools shortcut keys (F12, Ctrl+Shift+I/J/C)
 * return cleanup function
 */
export function watchDevTools(onDetect) {
  let reported = false
  const handler = (e) => {
    const isDevKey = e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()))
    if (isDevKey && !reported) {
      reported = true
      onDetect()
      // reset หลัง 60s เพื่อจับซ้ำได้
      setTimeout(() => { reported = false }, 60000)
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}
