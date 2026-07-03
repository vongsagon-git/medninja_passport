import axios from 'axios'
import { getDeviceHint } from '../utils/deviceDetect'

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

// Lazy-load mock adapter only when needed (keeps prod bundle clean)
let _mockAdapter = null
async function getMockAdapter() {
  if (!_mockAdapter) {
    const mod = await import('../mocks/adapter')
    _mockAdapter = mod.mockAdapter
  }
  return _mockAdapter
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Inject mock adapter before every request in mock mode
if (isMock) {
  api.interceptors.request.use(async (config) => {
    config.adapter = await getMockAdapter()
    return config
  })
  console.info('[MedNinja] 🎭 Mock mode ON — no backend needed')
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // X-MN-Device: บอก backend ว่าเป็น device ประเภทไหน
  // จำเป็นสำหรับ iPad iOS 13+ ที่ UA ส่งเป็น Mac → backend ตรวจไม่ได้ถ้าไม่มี hint
  try { config.headers['X-MN-Device'] = getDeviceHint() } catch {}
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // LINE ยังไม่เชื่อม → กลับไปหน้า /my ให้เชื่อม
    if (error.response?.status === 403 && error.response?.data?.message === 'LINE_REQUIRED') {
      if (window.location.pathname !== '/my') {
        window.location.href = '/my'
      }
      return Promise.reject(error)
    }
    // LINE unfollow → บล็อกทุกอย่าง
    if (error.response?.status === 403 && error.response?.data?.code === 'LINE_UNFOLLOW') {
      alert('กรุณา Add LINE @medninja เพื่อเข้าใช้งาน\n\nระบบตรวจพบว่าคุณยังไม่ได้ Follow LINE Official Account')
      window.location.href = '/my'
      return Promise.reject(error)
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const { useAuthStore } = await import('../stores/auth')
      const authStore = useAuthStore()
      authStore.user = null
      authStore.token = null
      // Passport: token หมด/ผิด → ไปหน้า login (/) ไม่เปิด modal
      const path = window.location.pathname
      const isLoginArea = path === '/' || path === '/ninja-passport' || path.startsWith('/demo/')
      if (!isLoginArea) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api
