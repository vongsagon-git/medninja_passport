/**
 * useCountryGuard — ตรวจ country ทุกครั้งที่หน้าเปลี่ยน (fetch จาก /api/geo/whoami)
 *
 * IP=CN บน /my → auto redirect /my-cn (ไม่ logout)
 * IP=TH บน /my-cn → auto redirect /my
 * Admin bypass — เข้าได้ทุกหน้า
 *
 * ⚠️ ห้ามใช้ localStorage — ใช้ค่า country จริงจาก backend เสมอ
 */
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import useCountry from './useCountry'
import { useAuthStore } from '../stores/auth'

export function useCountryGuard (expectedCountry) {
  const router = useRouter()
  const authStore = useAuthStore()
  const { country, ready } = useCountry()

  const check = () => {
    if (!ready.value) return
    const current = country.value
    if (!current || current === 'unknown') return

    // ⭐ Admin bypass — admin login จาก IP ไหนก็ได้
    if (authStore.user?.role === 'admin') {
      console.log('[CountryGuard] Admin bypass — skip country check')
      return
    }

    // ⭐ Auto-redirect ระหว่าง /my ↔ /my-cn ตาม IP จริงจาก backend (ไม่ใช้ localStorage)
    if (current !== expectedCountry) {
      if (current === 'CN' && expectedCountry === 'TH') {
        console.warn('[CountryGuard] IP=CN แต่อยู่ /my → redirect /my-cn')
        router.push('/my-cn')
        return
      }
      if (current === 'TH' && expectedCountry === 'CN') {
        console.warn('[CountryGuard] IP=TH แต่อยู่ /my-cn → redirect /my')
        router.push('/my')
        return
      }
      // country อื่นๆ (HK/SG/US...) — treat as global (TH bucket)
      if (expectedCountry === 'CN') {
        router.push('/my')
        return
      }
      return
    }
    // ตรงเป๊ะ → ไม่ต้องทำอะไร (ไม่ใช้ localStorage)
  }

  // Check ทันทีถ้า ready แล้ว
  check()
  // Watch การเปลี่ยน
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
