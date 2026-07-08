// ═══════════════════════════════════════════════════════════
// Serving Rules — single source of truth
// ═══════════════════════════════════════════════════════════
// ตารางกฎว่า user แต่ละ combination ควร serve จาก player/bucket/DRM อะไร
// ใช้ Doctor เช็คว่าระบบ serve ตรงกฎไหม
//
// อ้างอิง:
// - memory: alibaba_encryption_flexibility, hybrid_drm_strategy,
//           drm_encryption_test_matrix, drm_real_matrix_verified (2026-07-07)
// - code: WatchCnPage.vue aliVideoIdToPlay() line 790
//         WatchPage.vue (Bunny path)
// ═══════════════════════════════════════════════════════════

/**
 * ตารางกฎ:
 *
 * COUNTRY=CN (Alibaba VOD, ali-sg)
 * ├─ iOS iPhone Safari    → aliVideoId    (Proprietary AES-128, encryptType 1)
 * ├─ iOS iPad Safari      → aliVideoId    (Proprietary AES-128)
 * ├─ Mac Safari           → aliVideoId    (Proprietary AES-128)
 * ├─ Windows Chrome       → aliDrmVideoId (Widevine)
 * ├─ Mac Chrome           → aliDrmVideoId (Widevine)
 * └─ Android Chrome       → aliDrmVideoId (Widevine)
 *
 * COUNTRY=TH/other (Bunny CDN, bunny-global)
 * ├─ iOS iPhone Safari    → Bunny No-DRM  (FairPlay Cert หาย)
 * ├─ iOS iPad Safari      → Bunny No-DRM
 * ├─ Mac Safari           → Bunny No-DRM
 * ├─ Windows Chrome       → Bunny Widevine
 * ├─ Mac Chrome           → Bunny Widevine
 * └─ Android Chrome       → Bunny Widevine
 *
 * @param {string} country - ISO code (CN, TH, US, ...)
 * @param {string} deviceType - iPhone|iPad|Android|Mac|Windows|Linux
 * @param {string} browser - Chrome|Safari|Firefox|Edge|...
 * @returns {{player, bucket, drm, videoField, reason, notes}}
 */
export function getExpectedServing(country, deviceType, browser) {
  const c = (country || '').toUpperCase()
  const d = deviceType || ''
  const b = browser || ''

  // iOS/Mac Safari branch = No-DRM path (Proprietary or Bunny No-DRM)
  const isIosOrMacSafari = d === 'iPhone' || d === 'iPad' || (d === 'Mac' && b === 'Safari')

  // Rule 1: China → Alibaba VOD (ทุก device)
  if (c === 'CN') {
    if (isIosOrMacSafari) {
      return {
        player: 'ali',
        bucket: 'ali-sg',
        drm: 'proprietary',
        videoField: 'aliVideoId',
        reason: `country=CN + ${d} ${b} → Alibaba Proprietary`,
        notes: 'encryptType=1 AES-128 (iOS/Mac Safari ไม่รองรับ Widevine)'
      }
    }
    return {
      player: 'ali',
      bucket: 'ali-sg',
      drm: 'widevine',
      videoField: 'aliDrmVideoId',
      reason: `country=CN + ${d} ${b} → Alibaba Widevine`,
      notes: 'Widevine L3 (Windows/Android/Chrome)'
    }
  }

  // Rule 2: TH/Other → Bunny CDN
  if (isIosOrMacSafari) {
    return {
      player: 'bunny',
      bucket: 'bunny-global',
      drm: 'nodrm',
      videoField: 'bunnyVideoId',
      reason: `${d} ${b} → Bunny No-DRM`,
      notes: 'FairPlay Cert ยังไม่ setup (2026-07-07)'
    }
  }
  return {
    player: 'bunny',
    bucket: 'bunny-global',
    drm: 'widevine',
    videoField: 'bunnyDrmVideoId',
    reason: `${d} ${b} → Bunny Widevine`,
    notes: 'Widevine L3 standard'
  }
}

/**
 * เช็คว่า actual serving ตรงกับ expected หรือไม่
 * @param {object} expected - จาก getExpectedServing()
 * @param {object} actual - {player, drm} ที่ระบบ serve จริง
 * @returns {{match: boolean, diffs: string[]}}
 */
export function verifyServing(expected, actual) {
  const diffs = []
  if (expected.player !== actual.player) {
    diffs.push(`player: คาด ${expected.player} · ได้ ${actual.player}`)
  }
  if (expected.drm !== actual.drm) {
    diffs.push(`encryption: คาด ${expected.drm} · ได้ ${actual.drm}`)
  }
  return {
    match: diffs.length === 0,
    diffs
  }
}

/**
 * แปลง encryptType จาก Alibaba PlayInfo → drm string
 * ใช้เทียบกับ expected.drm
 */
export function encryptTypeToDrm(encryptType) {
  if (!encryptType) return 'nodrm'
  const t = String(encryptType).toLowerCase()
  if (t.includes('widevine') || t.includes('fairplay')) return 'widevine'
  if (t.includes('aliyunvodencryption') || t === '1') return 'proprietary'
  if (t.includes('hlsencryption')) return 'aes-128'
  return 'unknown'
}
