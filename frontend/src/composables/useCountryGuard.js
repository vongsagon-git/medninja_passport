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

  const forceLogout = (reason) => {
    console.warn(`[CountryGuard] ${reason} — logout`)
    const msg = expectedCountry === 'TH'
      ? 'ตรวจพบ IP ไม่ตรงประเทศไทย — กรุณา login ใหม่'
      : 'ตรวจพบ IP ไม่ตรงประเทศจีน — กรุณา login ใหม่'
    localStorage.removeItem(LOGIN_COUNTRY_KEY)
    authStore.logout().finally(() => {
      alert(msg)
      router.push('/')
    })
  }

  const check = () => {
    if (!ready.value) return
    const current = country.value
    if (!current || current === 'unknown') return

    // ⭐ Admin bypass — admin login จาก IP ไหนก็ได้
    if (authStore.user?.role === 'admin') {
      console.log('[CountryGuard] Admin bypass — skip country check')
      return
    }

    // ⭐ STRICT: IP ปัจจุบันต้องตรง expected (ตาม route)
    //   /my → guard('TH')  → IP ต้อง TH
    //   /my-cn → guard('CN') → IP ต้อง CN
    //   ถ้าคนพยายาม bypass URL (เช่นพิมพ์ /my-cn แต่ IP=TH) → logout ทันที
    if (current !== expectedCountry) {
      forceLogout(`Expected ${expectedCountry} but IP resolved to ${current}`)
      return
    }

    // ตรงเป๊ะ → save login_country ให้ Navbar ใช้
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
