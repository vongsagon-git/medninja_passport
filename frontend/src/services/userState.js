/**
 * User State Service — call GET /api/me/state + cache
 * 2026-08-15 Phase 2
 */

import api from './api'

let cache = null
let cacheAt = 0
const CACHE_TTL_MS = 30 * 1000  // 30s — router guard hits often

/**
 * Fetch state (cached). Force = true bypass cache.
 * Returns full state object from /api/me/state:
 *   { state, aud, apiBase, redirectTo, name, contactLineUrl,
 *     hasLine, needsLineLink, isChina,
 *     demoExpiresAt?, demoRemainingDays?, demoRemainingHours?,
 *     demoExpiredDaysAgo? }
 */
export async function getUserState(force = false) {
  const now = Date.now()
  if (!force && cache && (now - cacheAt) < CACHE_TTL_MS) return cache
  try {
    const data = await api.get('/me/state')
    cache = data
    cacheAt = now
    return data
  } catch (err) {
    // 401 = not logged in — router handles
    if (err?.response?.status === 401) {
      cache = null
      return null
    }
    console.error('[userState] fetch failed:', err.message)
    // don't cache errors
    throw err
  }
}

export function clearUserStateCache() {
  cache = null
  cacheAt = 0
}

/**
 * Given state response, return route.path to redirect to (or null if current is OK)
 * Precedence:
 *   1. needsLineLink       → /linelink   ⭐ BEFORE EVERYTHING (Vasita 2026-08-15)
 *   2. banned              → /banned
 *   3. pending_approval    → /awaiting-approval
 *   4. demo_expired        → /demo-expired
 *   5. demo                → /my-trial
 *   6. student             → /my (or /my-cn if CN — handled by existing country guard)
 *
 * Rule: ไม่มี LINE = redirect /linelink เสมอ (ไม่ว่า state อะไร)
 *       เชื่อม LINE เสร็จ → refresh state → routing ปกติ
 */
export function targetRouteForState(stateResp) {
  if (!stateResp) return null
  // ⭐ LINE gate เป็น first-class check — ต้องเชื่อม LINE ก่อนทำอะไรทั้งสิ้น
  if (stateResp.needsLineLink) return '/linelink'
  if (stateResp.state === 'banned') return '/banned'
  if (stateResp.state === 'pending_approval') return '/awaiting-approval'
  if (stateResp.state === 'demo_expired') return '/demo-expired'
  if (stateResp.state === 'demo') return '/my-trial'
  if (stateResp.state === 'student') return '/my'
  return null
}
