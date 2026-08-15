/**
 * User State Derivation (Passport) — SIMPLE VERSION
 * 2026-08-15 (Vasita: "เอาวันสมัครเป็นเกณฑ์เลยก็ได้ ง่ายดี")
 *
 * States:
 *   - banned    : status='banned' หรือ user.isBanned=true
 *   - student   : มี paid activation (non-demo) active
 *   - demo      : preReg.createdAt + 7 วัน > now (trial ยังไม่หมด)
 *   - demo_expired : preReg.createdAt + 7 วัน <= now (trial หมด)
 *   - pending_approval : edge case (user ไม่มี preReg — สร้างตรง)
 *
 * Source of truth = **preReg.createdAt** (วันสมัคร) — ไม่ใช้ demo activation อีก
 */
const DEFAULT_TRIAL_DAYS = 7

function computeUserState(reg, user, activations, demoPackageIds) {
  const now = new Date()

  // 1. banned (highest priority)
  if (user?.isBanned || reg?.status === 'banned') return 'banned'

  // 2. student = มี paid activation (non-demo) active
  const acts = Array.isArray(activations) ? activations : []
  const paidActive = acts.some(a => {
    if (!a.isActive) return false
    if (a.expiresAt && new Date(a.expiresAt) <= now) return false
    const pkgId = a.packageId?.toString?.() || String(a.packageId)
    return !demoPackageIds.has(pkgId)
  })
  if (paidActive) return 'student'

  // 3. demo / demo_expired = ตามวันสมัคร (createdAt + 7d)
  if (reg?.createdAt) {
    const trialEnd = new Date(new Date(reg.createdAt).getTime() + DEFAULT_TRIAL_DAYS * 86400000)
    return now < trialEnd ? 'demo' : 'demo_expired'
  }

  // 4. ไม่มี preReg เลย (edge case) → pending_approval
  return 'pending_approval'
}

/**
 * Compute demo expiresAt — SIMPLE: preReg.createdAt + 7 วัน
 * Vasita: "เอาวันสมัครเป็นเกณฑ์เลยก็ได้ ง่ายดี"
 */
function resolveDemoExpiresAt(reg /*, activations, demoPackageIds — kept for signature compat but unused */) {
  if (reg?.createdAt) {
    return new Date(new Date(reg.createdAt).getTime() + DEFAULT_TRIAL_DAYS * 86400000)
  }
  return null
}

/**
 * Convenience: return frontend-ready state object
 * @param {string} state
 * @param {Object} reg
 * @param {Object|null} user
 * @param {Date|null} demoExpiresAt - resolved จาก resolveDemoExpiresAt()
 */
function buildStateResponse(state, reg, user, demoExpiresAt = null) {
  const contactLineUrl = buildContactLineUrl(reg, state)
  const base = {
    state,
    name: reg ? `${reg.firstName || ''} ${reg.lastName || ''}`.trim() : (user?.name || ''),
    contactLineUrl
  }

  switch (state) {
    case 'pending_approval':
      return { ...base, aud: 'none', apiBase: null, redirectTo: '/awaiting-activation' }

    case 'demo': {
      const remainingMs = demoExpiresAt ? demoExpiresAt - Date.now() : 0
      return {
        ...base,
        aud: 'trial',
        apiBase: '/api/trial',
        redirectTo: '/my-trial',
        demoExpiresAt,
        demoRemainingMs: Math.max(0, remainingMs),
        demoRemainingDays: Math.floor(remainingMs / 86400000),
        demoRemainingHours: Math.floor((remainingMs % 86400000) / 3600000)
      }
    }

    case 'demo_expired': {
      const expiredMs = demoExpiresAt ? Date.now() - demoExpiresAt : 0
      return {
        ...base,
        aud: 'trial',
        apiBase: '/api/trial',
        redirectTo: '/demo-expired',
        demoExpiresAt,
        demoExpiredDaysAgo: Math.max(0, Math.floor(expiredMs / 86400000))
      }
    }

    case 'student':
      return { ...base, aud: 'paid', apiBase: '/api/my', redirectTo: '/my' }

    case 'banned':
      return {
        ...base,
        aud: 'none',
        apiBase: null,
        redirectTo: '/banned',
        banReason: reg?.banReason || user?.bannedReason || ''
      }

    default:
      return { ...base, aud: 'none', apiBase: null, redirectTo: '/awaiting-activation' }
  }
}

function buildContactLineUrl(reg, state) {
  const LINE_ID = '@medninja'
  const parts = []
  if (state === 'pending_approval') {
    parts.push('ขอเปิดระบบให้ครับ/ค่ะ')
  } else if (state === 'banned') {
    parts.push('สอบถามเรื่องบัญชีถูกระงับ')
  } else if (state === 'demo_expired') {
    parts.push('อยากสมัครคอร์สจริงครับ/ค่ะ')
  } else {
    parts.push('ติดต่อสอบถาม')
  }
  if (reg?.firstName || reg?.lastName) {
    parts.push(`ชื่อ: ${reg.firstName || ''} ${reg.lastName || ''}`.trim())
  }
  if (reg?.nationalId) parts.push(`เลขบัตร: ${reg.nationalId}`)
  if (reg?.phone) parts.push(`เบอร์: ${reg.phone}`)
  const msg = encodeURIComponent(parts.join('\n'))
  return `https://line.me/R/ti/p/${LINE_ID}?msg=${msg}`
}

module.exports = { computeUserState, buildStateResponse, buildContactLineUrl, resolveDemoExpiresAt, DEFAULT_TRIAL_DAYS }
