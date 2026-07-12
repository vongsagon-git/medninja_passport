/**
 * useCountryGuard — IP-based (no redirect)
 *
 * ⭐ ระบบใหม่: path เดียว /my/* ทั้งหมด
 *   ไม่มี /my-cn/* แล้ว → ไม่ต้อง redirect
 *   Country ใช้เป็น decision maker + tracking เท่านั้น
 *
 * เก็บ export ไว้เพื่อ backward compat — ทำงาน noop
 */
import { watch } from 'vue'
import useCountry from './useCountry'

/**
 * @param {string} expectedBucket - 'GLOBAL' หรือ 'CN' (ignored — เก็บไว้ backward compat)
 */
export function useCountryGuard (expectedBucket) {
  const { country, ready, refresh } = useCountry()

  // ⭐ Refetch geo ทุกครั้งเข้าหน้าใหม่ (ยัง track เหมือนเดิม)
  refresh().catch(() => {})

  // ⭐ ไม่ redirect แล้ว — decision อยู่ที่ component
  // (UniversalWatch, Dashboard, Section อ่าน country ตัดสินเอง)
}

/**
 * myHomeUrl() — path เดียว /my (backward compat)
 */
export async function myHomeUrl () {
  return '/my'
}

export default useCountryGuard
