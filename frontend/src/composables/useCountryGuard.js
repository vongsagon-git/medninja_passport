/**
 * useCountryGuard — Global (default) vs CN
 *
 * IP=CN → /my-cn (Alibaba VOD)
 * IP อื่นๆ ทั้งหมด (TH, HK, SG, US, JP, ...) = Global → /my (Bunny CDN)
 * Admin bypass — เข้าได้ทุกหน้า
 *
 * ⚠️ ห้ามใช้ localStorage — ใช้ค่า country จริงจาก backend เสมอ
 * ⚠️ Refetch ทุกครั้งที่เข้าหน้าใหม่ — user อาจสลับ VPN
 */
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import useCountry from './useCountry'
import { useAuthStore } from '../stores/auth'
import { isIOS } from '../utils/deviceDetect'

/**
 * @param {string} expectedBucket - 'GLOBAL' หรือ 'CN'
 *   - 'GLOBAL' = /my, /my/section, /my/watch (Bunny)
 *   - 'CN'     = /my-cn, /my-cn/section, /my-cn/watch (Alibaba)
 * รับ 'TH' ได้เพื่อ backward compat (แปลงเป็น 'GLOBAL')
 */
export function useCountryGuard (expectedBucket) {
  const router = useRouter()
  const { country, ready, refresh } = useCountry()

  // Backward compat: 'TH' = 'GLOBAL'
  const target = expectedBucket === 'CN' ? 'CN' : 'GLOBAL'

  // ⭐ Global vs CN: IP=CN → CN bucket, ที่เหลือทั้งหมด → GLOBAL bucket
  const bucketOf = (countryCode) => (countryCode === 'CN' ? 'CN' : 'GLOBAL')

  const redirectByCountry = (current) => {
    const currentBucket = bucketOf(current)
    if (currentBucket === target) return
    // ⭐ TEST: iOS/iPad ไม่ redirect ไป CN bucket
    // เพราะ Aliplayer SDK บน iOS ค้าง (anti-debugger + license blocking + touch handler jam)
    // ปล่อยให้ iOS อยู่ /my (Bunny No-DRM) ต่อไป
    if (currentBucket === 'CN' && target === 'GLOBAL' && isIOS()) {
      console.warn('[CountryGuard] iOS + CN → stay on Global (Bunny No-DRM test)')
      return
    }
    // ไปหน้าคู่กัน (ไม่ logout) — admin ก็ต้องตาม IP เหมือน student
    if (currentBucket === 'CN' && target === 'GLOBAL') {
      console.warn(`[CountryGuard] IP=${current} → redirect /my-cn`)
      router.push('/my-cn')
      return
    }
    if (currentBucket === 'GLOBAL' && target === 'CN') {
      console.warn(`[CountryGuard] IP=${current} → redirect /my`)
      router.push('/my')
    }
  }

  const check = () => {
    if (!ready.value) return
    const current = country.value
    if (!current || current === 'unknown') return
    redirectByCountry(current)
  }

  // ⭐ Refetch geo ทุกครั้งที่เข้าหน้าใหม่ (ไม่ใช้ cache) — user อาจสลับ VPN
  refresh().catch(() => {})

  check()
  watch(ready, check)
  watch(country, check)
}

/**
 * myHomeUrl() — fetch country จริงจาก backend → '/my-cn' หรือ '/my'
 * ⚠️ Async — ต้อง await
 */
export async function myHomeUrl () {
  try {
    const res = await fetch('/api/geo/whoami', { credentials: 'include' })
    const d = await res.json()
    return d.country === 'CN' ? '/my-cn' : '/my'
  } catch {
    return '/my'
  }
}

export default useCountryGuard
