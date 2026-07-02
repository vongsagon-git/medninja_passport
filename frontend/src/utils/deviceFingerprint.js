// ─── Cache ───
let _hwHash = null
let _hwOnlyHash = null
let _deviceInfo = null

async function sha256(text) {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getGPU() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  } catch { return '' }
}

function getMathFP() {
  return [
    Math.acos(0.123456789), Math.acosh(1e308), Math.atan(2),
    Math.atanh(0.5), Math.cbrt(100.123), Math.expm1(1),
    Math.log1p(0.5), Math.sin(1), Math.sinh(1), Math.tan(-1)
  ].join(',')
}

async function getArchitecture() {
  try {
    const uaData = navigator.userAgentData
    if (uaData && uaData.getHighEntropyValues) {
      const high = await uaData.getHighEntropyValues(['architecture', 'bitness'])
      return `${high.architecture || ''} ${high.bitness || ''}bit`.trim()
    }
  } catch {}
  return ''
}

function detectOS() {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Mac/.test(ua)) return 'macOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectBrowser() {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '')
  if (/Chrome\//.test(ua) && !/Edg/.test(ua)) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] || '')
  if (/Firefox\//.test(ua)) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] || '')
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '')
  return 'Unknown'
}

async function compute() {
  const gpu = getGPU()
  const cores = navigator.hardwareConcurrency || 0
  const memory = navigator.deviceMemory ? String(navigator.deviceMemory) : ''
  const arch = await getArchitecture()
  const touch = navigator.maxTouchPoints || 0
  const mathFP = getMathFP()
  const screenStr = `${window.screen.width}x${window.screen.height}`
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lang = navigator.language
  const plat = navigator.platform || ''

  _deviceInfo = {
    gpu, cores, memory, architecture: arch, touchPoints: touch,
    screen: screenStr, timezone: tz, language: lang, platform: plat,
    os: detectOS(), browser: detectBrowser()
  }

  _hwHash = await sha256([screenStr, gpu, cores, tz, lang, plat].join('|'))
  _hwOnlyHash = await sha256([gpu, cores, memory, arch, touch, mathFP].join('|'))

  console.log('[DeviceFP] ready:', _hwOnlyHash.substring(0, 12) + '...')
}

let _promise = null

export function initFingerprint() {
  if (!_promise) {
    _promise = compute().catch(err => {
      console.error('[DeviceFP] failed:', err)
    })
  }
  return _promise
}

export function getHwOnlyHash() { return _hwOnlyHash }
export function getFpHash() { return '' }
export function getHwHash() { return _hwHash }
export function getDeviceInfo() { return _deviceInfo }
