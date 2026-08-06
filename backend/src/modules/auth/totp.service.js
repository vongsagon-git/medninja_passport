/**
 * Admin TOTP (Google Authenticator) — 2026-08-06 anti-hack
 *
 * ⚠ กฎเหล็ก: admin login: password ถูกอย่างเดียว "ไม่พอ" ต้องผ่าน TOTP ก่อน issue JWT
 * เพราะ default password = วันเกิด (ddmmyyyy) รู้วันเกิด admin = login ได้
 *
 * ใช้ pattern เดียวกับ WS (medninja-ws/server.js:1308-1446):
 * - 2 secrets ที่ .env: TOTP_SECRET_TT (เติ้ล), TOTP_SECRET_CT (หมอแตม)
 * - Verify กับ 2 secret รู้เองว่าใคร
 * - Rate limit ผิด 5 ครั้ง → block 5 นาที (global)
 * - Bypass: กรอกถูก 2 code ต่างกันติดกัน → ปลด block
 * - Anti-replay: ห้ามใช้ code เดิมซ้ำภายใน 90s
 */
const crypto = require('crypto')
const speakeasy = require('speakeasy')

const TOTP_OPTS = { encoding: 'base32', window: 1, step: 30 }
const RATE = { FAIL_LIMIT: 5, BLOCK_MS: 5 * 60 * 1000, HALF_UNLOCK_MS: 5 * 60 * 1000 }
const PENDING_TTL_MS = 5 * 60 * 1000

// in-memory stores (single-process — ถ้ามี multi-instance ต้องใช้ Valkey แทน)
const usedCodeStore = new Map() // code → expiresAt
const pendingLogins = new Map() // pendingId → { userId, expiresAt, ip, ua }
let globalFailCount = 0
let globalBlockUntil = 0
let halfUnlockAt = 0
let halfUnlockCode = ''

function isTotpEnabled() {
  return !!(process.env.TOTP_SECRET_TT || process.env.TOTP_SECRET_CT)
}

function getSecrets() {
  return {
    TT: process.env.TOTP_SECRET_TT,
    CT: process.env.TOTP_SECRET_CT
  }
}

function verifyCode(code) {
  const secrets = getSecrets()
  for (const [name, secret] of Object.entries(secrets)) {
    if (!secret) continue
    try {
      if (speakeasy.totp.verify({ secret, token: code, ...TOTP_OPTS })) return name
    } catch { /* invalid secret format */ }
  }
  return null
}

function createPendingLogin(userId, meta = {}) {
  const now = Date.now()
  // cleanup expired
  for (const [k, v] of pendingLogins) { if (now > v.expiresAt) pendingLogins.delete(k) }
  const pendingId = crypto.randomBytes(24).toString('hex')
  pendingLogins.set(pendingId, {
    userId: String(userId),
    expiresAt: now + PENDING_TTL_MS,
    ip: meta.ip || '',
    ua: meta.ua || ''
  })
  return pendingId
}

function consumePendingLogin(pendingId) {
  const p = pendingLogins.get(pendingId)
  if (!p) return null
  if (Date.now() > p.expiresAt) { pendingLogins.delete(pendingId); return null }
  pendingLogins.delete(pendingId)
  return p
}

/**
 * ยืนยัน TOTP code สำหรับ admin login
 * @returns { ok, who, blocked, halfUnlock, waitSeconds, remainingAttempts, error }
 */
function checkTotpForLogin(code) {
  const now = Date.now()
  // cleanup anti-replay
  for (const [k, v] of usedCodeStore) { if (now > v) usedCodeStore.delete(k) }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'รหัสต้องเป็นตัวเลข 6 หลัก' }
  }

  const who = verifyCode(code)
  const isBlocked = globalBlockUntil && now < globalBlockUntil

  // ระหว่าง block
  if (isBlocked) {
    if (!who) {
      const wait = Math.ceil((globalBlockUntil - now) / 1000)
      return { ok: false, blocked: true, waitSeconds: wait, error: `ระบบ block รออีก ${wait} วินาที (หรือกรอกถูก 2 ครั้งต่างกันเพื่อปลด)` }
    }
    if (usedCodeStore.has(code)) return { ok: false, error: 'รหัสนี้ถูกใช้ไปแล้ว รอรหัสถัดไป' }

    if (halfUnlockAt && (now - halfUnlockAt) < RATE.HALF_UNLOCK_MS && halfUnlockCode !== code) {
      // ครั้งที่ 2 ถูก → ปลด
      usedCodeStore.set(code, now + 90 * 1000)
      globalBlockUntil = 0
      globalFailCount = 0
      halfUnlockAt = 0
      halfUnlockCode = ''
      return { ok: true, who, bypassed: true }
    }
    halfUnlockAt = now
    halfUnlockCode = code
    usedCodeStore.set(code, now + 90 * 1000)
    return { ok: false, halfUnlock: true, error: 'ถูก 1/2 — รอรหัสถัดไปเปลี่ยนแล้วกรอกอีกครั้งเพื่อปลด block' }
  }

  // ปกติ
  if (!who) {
    globalFailCount++
    if (globalFailCount >= RATE.FAIL_LIMIT) {
      globalBlockUntil = now + RATE.BLOCK_MS
      globalFailCount = 0
      halfUnlockAt = 0
      halfUnlockCode = ''
      return { ok: false, blocked: true, error: `ผิด ${RATE.FAIL_LIMIT} ครั้ง block ${RATE.BLOCK_MS/60000} นาที (กรอกถูก 2 ครั้งต่างกันเพื่อปลด)` }
    }
    return { ok: false, remainingAttempts: RATE.FAIL_LIMIT - globalFailCount, error: `รหัสไม่ถูก (เหลือ ${RATE.FAIL_LIMIT - globalFailCount} ครั้ง)` }
  }

  // Success
  if (usedCodeStore.has(code)) return { ok: false, error: 'รหัสนี้ถูกใช้ไปแล้ว รอรหัสถัดไป' }
  usedCodeStore.set(code, now + 90 * 1000)
  globalFailCount = 0
  halfUnlockAt = 0
  halfUnlockCode = ''
  return { ok: true, who }
}

module.exports = {
  isTotpEnabled,
  createPendingLogin,
  consumePendingLogin,
  checkTotpForLogin
}
