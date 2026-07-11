import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Eager: หน้า login = landing (immersive, no navbar/footer)
import LoginPage from '../views/LoginPage.vue'
import NotFoundPage from '../views/NotFoundPage.vue'

// Lazy: auth-gated or infrequent pages — loaded on first navigation
const NinjaPassportPage = () => import('../views/NinjaPassportPage.vue')
const CompleteProfilePage = () => import('../views/CompleteProfilePage.vue')
const LineLink = () => import('../views/LineLink.vue')
const ReplyStudent = () => import('../views/ReplyStudent.vue')

// v2: Section-based student pages
const MyDashboard = () => import('../views/MyDashboard.vue')
const SectionPage = () => import('../views/SectionPage.vue')
const WatchPage = () => import('../views/WatchPage.vue')

// ⭐ CN mirror — for Chinese students (Alibaba VOD)
const MyCnDashboard = () => import('../views/MyCnDashboard.vue')
const SectionCnPage = () => import('../views/SectionCnPage.vue')
const WatchCnPage = () => import('../views/WatchCnPage.vue')

// DDx ย้ายไป ddx.medninja.academy แล้ว

// MEQ student pages
const MeqList = () => import('../views/MeqList.vue')
const MeqCase = () => import('../views/MeqCase.vue')

// Lazy admin chunk — never needed by students
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const ManageSections = () => import('../views/admin/ManageSections.vue')
const ContentLibrary = () => import('../views/admin/ContentLibrary.vue')
const WatchDebug = () => import('../views/admin/WatchDebug.vue')
const ManagePackages = () => import('../views/admin/ManagePackages.vue')
const ManageActivations = () => import('../views/admin/ManageActivations.vue')
const ManagePassport = () => import('../views/admin/ManagePassport.vue')
const ActiveViewers = () => import('../views/admin/ActiveViewers.vue')
const ValkeyDebug = () => import('../views/admin/ValkeyDebug.vue')
const PdfDownloadCenter = () => import('../views/admin/PdfDownloadCenter.vue')
const VideoPdfMap = () => import('../views/admin/VideoPdfMap.vue')
const PdfLibrary = () => import('../views/admin/PdfLibrary.vue')
const DbViewer = () => import('../views/admin/DbViewer.vue')
// Knowledge Hub — prototype รวม P'Nut + Siriraj DDx (admin-only, internal)
const ManageSelfChecks = () => import('../views/admin/ManageSelfChecks.vue')
const SelfCheckAnalytics = () => import('../views/admin/SelfCheckAnalytics.vue')

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage,
    meta: { guest: true, immersive: true },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (authStore.isLoggedIn) {
        next({ name: 'MyDashboard' })
      } else {
        next()
      }
    }
  },
  { path: '/login', redirect: '/' },
  { path: '/home', redirect: '/' },
  {
    path: '/ninja-passport',
    name: 'NinjaPassport',
    component: NinjaPassportPage,
    meta: { immersive: true }
  },
  {
    path: '/register',
    redirect: '/ninja-passport'
  },
  // /nlex → เสิร์ฟจาก backend โดยตรง (standalone HTML สำหรับ LIFF)
  {
    path: '/complete-profile',
    name: 'CompleteProfile',
    component: CompleteProfilePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    redirect: '/my'
  },
  // /courses, /course-detail — ลบออกจาก passport (หน้าขาย)
  // /form, /demo → เสิร์ฟจาก backend โดยตรง (standalone HTML)
  {
    path: '/demo/watch/:videoIndex',
    name: 'DemoWatch',
    component: WatchPage,
    meta: { demo: true, immersive: true }
  },
  // v2: Section-based student routes (ต้องกรอก profile ก่อน)
  {
    path: '/my',
    name: 'MyDashboard',
    component: MyDashboard,
    meta: { requiresAuth: true, requiresProfile: true }
  },
  // /my2 → redirect ไป /my (รวมแล้ว)
  {
    path: '/my2',
    redirect: '/my'
  },
  {
    path: '/my/section/:id',
    name: 'SectionPage',
    component: SectionPage,
    meta: { requiresAuth: true, requiresProfile: true }
  },
  {
    path: '/my/watch/:sectionId/:videoIndex',
    name: 'WatchPage',
    component: WatchPage,
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  // ⭐ CN mirror routes — for Chinese students
  {
    path: '/my-cn',
    name: 'MyCnDashboard',
    component: MyCnDashboard,
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  {
    path: '/my-cn/section/:id',
    name: 'SectionCnPage',
    component: SectionCnPage,
    meta: { requiresAuth: true, requiresProfile: true }
  },
  {
    path: '/my-cn/watch/:sectionId/:videoIndex',
    name: 'WatchCnPage',
    component: WatchCnPage,
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  // ⭐ Beta test — 1 ID Universal pattern (auth required, hardcoded test video)
  {
    path: '/watch-beta',
    name: 'WatchBetaPage',
    component: () => import('../views/WatchBetaPage.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  // ระบบเสริม — Synapse / DDx / OSCE (coming soon)
  {
    path: '/my/synapse',
    name: 'SynapsePage',
    component: () => import('../views/SynapsePage.vue'),
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  {
    path: '/my/osce',
    name: 'OscePage',
    component: () => import('../views/OscePage.vue'),
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  // DDx ย้ายไป ddx.medninja.academy แล้ว
  { path: '/my/ddx/:pathMatch(.*)*', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy'; return false } },
  // NLEX → ย้ายไป miniapp (nlex.medninja.academy) แล้ว
  { path: '/my/nlex', beforeEnter: () => { window.location.href = 'https://nlex.medninja.academy'; return false } },
  { path: '/my/nlex/reply/:requestId', beforeEnter: (to) => { window.location.href = 'https://nlex.medninja.academy/reply/' + to.params.requestId; return false } },
  // MEQ student routes
  {
    path: '/my/meq',
    name: 'MeqList',
    component: MeqList,
    meta: { requiresAuth: true, requiresProfile: true }
  },
  {
    path: '/my/meq/:id',
    name: 'MeqCase',
    component: MeqCase,
    meta: { requiresAuth: true, requiresProfile: true }
  },
  // Admin preview — reuse WatchPage for admin section preview
  {
    path: '/admin/preview/section/:sectionId/:videoIndex?',
    name: 'AdminPreviewSection',
    component: WatchPage,
    meta: { requiresAuth: true, requiresAdmin: true, immersive: true, adminPreview: true }
  },
  // Admin routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // /admin/knowledge-hub — ลบ (D4 KnowledgeHub prototype)
  {
    path: '/admin/sections',
    name: 'ManageSections',
    component: ManageSections,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/content-library',
    name: 'ContentLibrary',
    component: ContentLibrary,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/watch-debug',
    name: 'WatchDebug',
    component: WatchDebug,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/packages',
    name: 'ManagePackages',
    component: ManagePackages,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/activations',
    name: 'ManageActivations',
    component: ManageActivations,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/self-checks',
    name: 'ManageSelfChecks',
    component: ManageSelfChecks,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/checklist-analytics',
    name: 'SelfCheckAnalytics',
    component: SelfCheckAnalytics,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    redirect: '/admin/passport'
  },
  {
    path: '/db-viewer',
    name: 'DbViewer',
    component: DbViewer,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/passport',
    name: 'ManagePassport',
    component: ManagePassport,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/valkey',
    name: 'ValkeyDebug',
    component: ValkeyDebug,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/viewers',
    redirect: '/admin'
  },
  {
    path: '/diag',
    name: 'Diag',
    component: () => import('../views/DoctorPage.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  {
    path: '/linelink',
    name: 'LineLink',
    component: LineLink,
    meta: { immersive: true }
  },
  {
    path: '/reply',
    name: 'ReplyStudent',
    component: ReplyStudent,
    meta: { immersive: true }
  },
  {
    path: '/admin/pdf-center',
    name: 'PdfDownloadCenter',
    component: PdfDownloadCenter,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/video-pdf',
    name: 'VideoPdfMap',
    component: VideoPdfMap,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/pdf-library',
    name: 'PdfLibrary',
    component: PdfLibrary,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // /virtual-patient (A6) — ลบออกจาก passport (marketing landing)
  // VirtualPatient ย้ายไป ddx.medninja.academy/virtual-patient (ต้อง handoff token)
  { path: '/admin/virtual-patient', beforeEnter: async () => {
      try {
        const { default: api } = await import('../services/api')
        const data = await api.post('/auth/handoff/code', { target: 'ddx' })
        window.location.href = `https://ddx.medninja.academy/auth/handoff?code=${data.code}&next=/virtual-patient`
      } catch {
        window.location.href = 'https://ddx.medninja.academy/'
      }
      return false
    }
  },
  // DDx admin ย้ายไป ddx.medninja.academy แล้ว
  { path: '/admin/ddx', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/admin/ddx'; return false } },
  { path: '/admin/flashcard', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/admin/flashcard'; return false } },
  { path: '/admin/arena', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/admin/arena'; return false } },
  { path: '/ddx-demo', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/ddx-arena'; return false } },
  { path: '/ddx-mindmap', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/mindmap'; return false } },
  { path: '/ninja-ddx', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/ddx-arena'; return false } },
  { path: '/ddx-arena', beforeEnter: () => { window.location.href = 'https://ddx.medninja.academy/ddx-arena'; return false } },
  {
    path: '/admin/warroom',
    name: 'Warroom',
    component: () => import('../views/admin/Warroom.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, immersive: true }
  },
  {
    path: '/doctor',
    name: 'Doctor',
    component: () => import('../views/DoctorPage.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  {
    // ⭐ Doctor เฉพาะ Ali chain (CN mirror) — user บน /my-cn/watch ใช้ path นี้
    path: '/doctor-cn',
    name: 'DoctorCn',
    component: () => import('../views/DoctorCnPage.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  {
    // ⭐ Geo debug page — query CF + ipinfo + geoip-lite แสดงคู่กัน
    path: '/geo',
    name: 'Geo',
    component: () => import('../views/GeoPage.vue'),
    meta: { immersive: true }
  },
  {
    // ⭐ Domain debug page — 3 layer defense (CORS + Referer + CSP)
    path: '/domain',
    name: 'Domain',
    component: () => import('../views/DomainPage.vue'),
    meta: { immersive: true }
  },
  {
    // ⭐ JWT debug page — decode + validate + show backend knowledge
    path: '/jwt',
    name: 'Jwt',
    component: () => import('../views/JwtPage.vue'),
    meta: { immersive: true }
  },
  {
    path: '/screen-check',
    name: 'ScreenCheck',
    component: () => import('../views/ScreenCheck.vue'),
    meta: { immersive: true }
  },
  {
    path: '/admin/drm-test',
    name: 'DrmTest',
    component: () => import('../views/admin/DrmTest.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  {
    path: '/ext',
    name: 'ExtCheck',
    component: () => import('../views/ExtCheck.vue'),
    meta: { immersive: true }
  },
  // เทส Alibaba VOD สำหรับคนในจีน (public — MVP Phase 1)
  {
    path: '/china',
    name: 'ChinaTest',
    component: () => import('../views/ChinaTestPage.vue'),
    meta: { immersive: true }
  },
  // /china-serve → เสิร์ฟ standalone HTML จาก backend (bypass Vue) — test player-serve
  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // ไม่ล็อกอิน → ไปหน้า login (/)
    next({ name: 'Login' })
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next({ name: 'MyDashboard' })
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next({ name: 'MyDashboard' })
  } else if (to.meta.requiresProfile && authStore.needsProfile) {
    // ต้องกรอก profile ก่อนเข้าเรียน
    next({ name: 'CompleteProfile' })
  } else {
    next()
  }
})

// Version check — ถ้ามี pending reload + ออกจากหน้า watch → reload
import { checkPendingReload, getVersion } from '../services/versionCheck'

// ⭐ Skip version reload สำหรับ path ที่ดู VDO อยู่ (versionCheck.js จะ toast แทน)
const SKIP_RELOAD_PATHS = ['/my/watch/', '/my-cn/watch/']

// ⭐ Global Country Guard — ทุก navigation ไปหน้าที่มี bucket ต้อง match IP
// ถ้า IP=CN แต่ path=/my/... → redirect ไป /my-cn/... (bucket)
// ถ้า IP≠CN แต่ path=/my-cn/... → redirect ไป /my/... (bucket)
const BUCKET_PATHS = ['/my', '/my-cn', '/section', '/watch', '/doctor', '/doctor-cn']
const isBucketPath = (p) => BUCKET_PATHS.some(bp => p === bp || p.startsWith(bp + '/'))
const getPathBucket = (p) => {
  if (p.startsWith('/my-cn') || p.startsWith('/doctor-cn')) return 'CN'
  if (isBucketPath(p)) return 'GLOBAL'
  return null
}
router.beforeResolve(async (to, from, next) => {
  // ⭐ Country guard ก่อน version check — user อาจสลับ VPN ระหว่าง navigation
  // ตรวจทุกครั้ง: เปลี่ยนคลิป, refresh, navigate — mismatch = redirect ทันที
  const authStore = useAuthStore()
  const pathBucket = getPathBucket(to.path)
  if (pathBucket && authStore.isLoggedIn) {
    try {
      const r = await fetch('/api/geo/whoami', { cache: 'no-store', credentials: 'include' })
      if (r.ok) {
        const d = await r.json()
        const ipBucket = d.country === 'CN' ? 'CN' : 'GLOBAL'
        if (ipBucket !== pathBucket) {
          // Mismatch → redirect ไป bucket ที่ถูก
          const swap = (p) => {
            if (ipBucket === 'CN') {
              if (p.startsWith('/my/')) return p.replace('/my/', '/my-cn/')
              if (p === '/my') return '/my-cn'
              if (p === '/doctor') return '/doctor-cn'
              return '/my-cn'
            } else {
              if (p.startsWith('/my-cn/')) return p.replace('/my-cn/', '/my/')
              if (p === '/my-cn') return '/my'
              if (p === '/doctor-cn') return '/doctor'
              return '/my'
            }
          }
          const target = swap(to.path)
          // ⭐ Safety: ถ้า target = path เดิม (swap ล้มเหลว) → ไม่ redirect (กัน loop)
          if (target === to.path || target === from.path) {
            console.warn(`[GlobalCountryGuard] skip — target=${target} same as current`)
            return next()
          }
          console.warn(`[GlobalCountryGuard] IP=${ipBucket} path=${pathBucket} → redirect ${target}`)
          return next(target)
        }
      }
    } catch { /* geo fail — ปล่อยผ่าน ไม่ block user */ }
  }

  // ถ้าเข้าหน้าที่กำลังดู VDO ปกติ → ข้าม (versionCheck.js เก่าจะ toast แทน)
  if (SKIP_RELOAD_PATHS.some(p => to.path.includes(p))) return next()
  const knownVer = getVersion()
  if (!knownVer) return next()
  try {
    const r = await fetch('/api/version', { cache: 'no-store' })
    const d = await r.json()
    if (d.version && d.version !== knownVer) {
      const lr = sessionStorage.getItem('_vr')
      if (!lr || Date.now() - Number(lr) > 60000) {
        sessionStorage.setItem('_vr', String(Date.now()))
        window.location.href = to.fullPath + (to.fullPath.includes('?') ? '&' : '?') + '_=' + Date.now()
        return
      }
    }
  } catch {}
  next()
})

router.afterEach(() => {
  checkPendingReload()
})

export default router
