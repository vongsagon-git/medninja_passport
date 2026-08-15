/**
 * User State Derivation (Passport)
 * 2026-08-15 — flag-based state machine
 *
 * State derived from PreRegistration + User + Activations
 * ไม่เก็บ 'demo'/'demo_expired'/'student' ใน DB (compute ทุกครั้ง)
 *
 * States:
 *   - pending_approval : สมัครใหม่ รอ admin triage
 *   - demo             : approved + demoExpiresAt > now
 *   - demo_expired     : approved + demoExpiresAt <= now
 *   - student          : มี paid activation (non-demo package) active
 *   - banned           : status='banned' หรือ user.isBanned=true
 */

/**
 * @param {Object} reg - PreRegistration doc (or lean object)
 * @param {Object|null} user - User doc (or lean object, may be null)
 * @param {Array} activations - Activation docs (isActive:true, expiresAt>now) — filtered by caller
 * @param {Set<string>} demoPackageIds - Set of demo package IDs (as strings) — from LMS DB (isDemo:true)
 * @returns {string} one of: pending_approval | demo | demo_expired | student | banned
 */
function computeUserState(reg, user, activations, demoPackageIds) {
  // 1. banned (highest priority)
  if (user?.isBanned || reg?.status === 'banned') return 'banned'

  // 2. student = มี paid activation active
  if (activations && activations.length > 0) {
    const hasPaid = activations.some(a => {
      if (!a.isActive) return false
      if (a.expiresAt && new Date(a.expiresAt) <= new Date()) return false
      const pkgId = a.packageId?.toString?.() || String(a.packageId)
      return !demoPackageIds.has(pkgId)
    })
    if (hasPaid) return 'student'
  }

  // 3. pending_approval — ยังไม่ตัดสิน หรือ approved แต่ไม่มี demoExpiresAt (data error)
  if (!reg || reg.status === 'pending_approval') return 'pending_approval'
  if (!reg.demoExpiresAt) return 'pending_approval'

  // 4. demo vs demo_expired — คำนวณจาก demoExpiresAt
  const now = new Date()
  const expiresAt = new Date(reg.demoExpiresAt)
  if (now < expiresAt) return 'demo'
  return 'demo_expired'
}

/**
 * Convenience: return frontend-ready state object
 */
function buildStateResponse(state, reg, user) {
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
      const remainingMs = reg.demoExpiresAt ? new Date(reg.demoExpiresAt) - Date.now() : 0
      return {
        ...base,
        aud: 'trial',
        apiBase: '/api/trial',
        redirectTo: '/my-trial',
        demoExpiresAt: reg.demoExpiresAt,
        demoRemainingMs: Math.max(0, remainingMs),
        demoRemainingDays: Math.floor(remainingMs / 86400000),
        demoRemainingHours: Math.floor((remainingMs % 86400000) / 3600000)
      }
    }

    case 'demo_expired': {
      const expiredMs = Date.now() - new Date(reg.demoExpiresAt)
      return {
        ...base,
        aud: 'trial',
        apiBase: '/api/trial',
        redirectTo: '/demo-expired',
        demoExpiresAt: reg.demoExpiresAt,
        demoExpiredDaysAgo: Math.floor(expiredMs / 86400000)
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

module.exports = { computeUserState, buildStateResponse, buildContactLineUrl }
