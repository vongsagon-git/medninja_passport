/**
 * useCountryGuard — ตรวจ country ทุกครั้งที่หน้าเปลี่ยน
 *
 * ถ้า user login ตอน TH แต่ต่อมา IP เปลี่ยนเป็น CN → logout ทันที
 * (หรือกลับกัน)
 *
 * ใช้ในหน้า /my และ /my-cn ทุกหน้า:
 *
 *   import { useCountryGuard } from '@/composables/useCountryGuard'
 *   useCountryGuard('TH')  // หน้านี้ควรเป็น TH
 *   useCountryGuard('CN')  // หน้านี้ควรเป็น CN
 */
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import useCountry from './useCountry'
import { useAuthStore } from '../stores/auth'

const LOGIN_COUNTRY_KEY = 'login_country'

export function useCountryGuard (expectedCountry) {
  const router = useRouter()
  const authStore = useAuthStore()
  const { country, ready } = useCountry()

  const check = () => {
    if (!ready.value) return
    const current = country.value
    if (!current || current === 'unknown') return

    // ⭐ Admin bypass — admin login จาก IP ไหนก็ได้ ไม่ต้อง match country
    if (authStore.user?.role === 'admin') {
      console.log('[CountryGuard] Admin bypass — skip country check')
      return
    }

    // ⭐ ถ้ายังไม่มี login_country → set ตอนนี้เลย (first-time visit)
    const stored = localStorage.getItem(LOGIN_COUNTRY_KEY)
    if (!stored) {
      localStorage.setItem(LOGIN_COUNTRY_KEY, current)
      // ครั้งแรก — ไม่ kick แค่ set
      return
    }

    // ถ้าไม่ตรง expected → logout
    if (current !== expectedCountry) {
      console.warn(`[CountryGuard] Expected ${expectedCountry} but got ${current} — logout`)
      const msg = expectedCountry === 'TH'
        ? 'ตรวจพบการเปลี่ยน IP เป็นประเทศจีน กรุณา login ใหม่'
        : 'ตรวจพบการเปลี่ยน IP กลับประเทศไทย กรุณา login ใหม่'
      // Clear + notify
      localStorage.removeItem(LOGIN_COUNTRY_KEY)
      authStore.logout().finally(() => {
        alert(msg)
        router.push('/')
      })
      return
    }

    // Store current country ไว้เผื่อ page reload
    localStorage.setItem(LOGIN_COUNTRY_KEY, current)
  }

  // Check ทันทีถ้า ready แล้ว
  check()
  // Watch การเปลี่ยน
  watch(ready, check)
  watch(country, check)
}

export function getLoginCountry () {
  return localStorage.getItem(LOGIN_COUNTRY_KEY) || ''
}

export function setLoginCountry (c) {
  if (c) localStorage.setItem(LOGIN_COUNTRY_KEY, c)
}

export function clearLoginCountry () {
  localStorage.removeItem(LOGIN_COUNTRY_KEY)
}

/**
 * myHomeUrl() — return '/my-cn' หรือ '/my' ตาม login_country
 * ใช้แทน hardcoded '/my' ใน navigation links / redirects
 */
export function myHomeUrl () {
  return localStorage.getItem(LOGIN_COUNTRY_KEY) === 'CN' ? '/my-cn' : '/my'
}

export default useCountryGuard
