import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Eager: public pages loaded immediately for best LCP on first visit
import HomePage from '../views/HomePage.vue'
import CoursesPage from '../views/CoursesPage.vue'
import CourseDetailPage from '../views/CourseDetailPage.vue'
import NotFoundPage from '../views/NotFoundPage.vue'

// Lazy: auth-gated or infrequent pages — loaded on first navigation
const NinjaPassportPage = () => import('../views/NinjaPassportPage.vue')
const ProfilePage = () => import('../views/ProfilePage.vue')
const CompleteProfilePage = () => import('../views/CompleteProfilePage.vue')
const DiagPage = () => import('../views/DiagPage.vue')
const LineLink = () => import('../views/LineLink.vue')
const ReplyStudent = () => import('../views/ReplyStudent.vue')

// v2: Section-based student pages
const MyDashboard = () => import('../views/MyDashboard.vue')
const SectionPage = () => import('../views/SectionPage.vue')
const WatchPage = () => import('../views/WatchPage.vue')

// DDx ย้ายไป ddx.medninja.academy แล้ว

// MEQ student pages
const MeqList = () => import('../views/MeqList.vue')
const MeqCase = () => import('../views/MeqCase.vue')

// Lazy admin chunk — never needed by students
const AdminDashboard = () => import('../views/admin/AdminDashboard.vue')
const ManageSections = () => import('../views/admin/ManageSections.vue')
const ManagePackages = () => import('../views/admin/ManagePackages.vue')
const ManageCourses = () => import('../views/admin/ManageCourses.vue')
const ManageActivations = () => import('../views/admin/ManageActivations.vue')
const VideoHealthCheck = () => import('../views/admin/VideoHealthCheck.vue')
const ManagePassport = () => import('../views/admin/ManagePassport.vue')
const ManageWatermark = () => import('../views/admin/ManageWatermark.vue')
const ActiveViewers = () => import('../views/admin/ActiveViewers.vue')
const ValkeyDebug = () => import('../views/admin/ValkeyDebug.vue')
const ManageDemoWeb = () => import('../views/admin/ManageDemoWeb.vue')
const VisitorAnalytics = () => import('../views/admin/VisitorAnalytics.vue')
const PdfDownloadCenter = () => import('../views/admin/PdfDownloadCenter.vue')
const ManageLive = () => import('../views/admin/ManageLive.vue')
const VideoPdfMap = () => import('../views/admin/VideoPdfMap.vue')
const PdfLibrary = () => import('../views/admin/PdfLibrary.vue')
const DbViewer = () => import('../views/admin/DbViewer.vue')
const ActivityLog = () => import('../views/admin/ActivityLog.vue')
// Knowledge Hub — prototype รวม P'Nut + Siriraj DDx (admin-only, internal)
const KnowledgeHub = () => import('../views/admin/KnowledgeHub.vue')
const ManageSelfChecks = () => import('../views/admin/ManageSelfChecks.vue')
const SelfCheckAnalytics = () => import('../views/admin/SelfCheckAnalytics.vue')
// VirtualPatient Hub — landing เลือก OSCE VP / DDx VP (public marketing)
const VirtualPatientHub = () => import('../views/VirtualPatientHub.vue')
// ManageDdx, ManageFlashcard, ManageArena — ย้ายไป ddx.medninja.academy แล้ว
const WatchLive = () => import('../views/WatchLive.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    // เปิด modal แทนไปหน้าแยก
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (authStore.isLoggedIn) {
        next({ name: 'MyDashboard' })
      } else {
        authStore.loginModalOpen = true
        // ถ้ามาจากหน้าอื่น → กลับไปหน้านั้น, ถ้าพิมพ์ URL ตรง → ไปหน้าแรก
        if (from.name) {
          next(false)
        } else {
          next({ name: 'Home' })
        }
      }
    },
    component: HomePage,
    meta: { guest: true }
  },
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
  {
    path: '/courses',
    name: 'Courses',
    component: CoursesPage
  },
  {
    path: '/courses/:id',
    name: 'CourseDetail',
    component: CourseDetailPage
  },
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
  {
    path: '/admin/knowledge-hub',
    name: 'KnowledgeHub',
    component: KnowledgeHub,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/courses',
    name: 'ManageCourses',
    component: ManageCourses,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/sections',
    name: 'ManageSections',
    component: ManageSections,
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
    path: '/admin/health',
    name: 'VideoHealthCheck',
    component: VideoHealthCheck,
    meta: { requiresAuth: true, requiresAdmin: true }
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
    path: '/admin/watermark',
    name: 'ManageWatermark',
    component: ManageWatermark,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/diag',
    name: 'Diag',
    component: () => import('../views/DoctorPage.vue'),
    meta: { requiresAuth: true, immersive: true }
  },
  {
    path: '/device',
    name: 'Device',
    component: () => import('../views/DevicePage.vue'),
    meta: { immersive: true }
  },
  {
    path: '/admin/devices',
    name: 'ManageDevices',
    component: () => import('../views/admin/ManageDevices.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
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
    path: '/admin/demo-web',
    name: 'ManageDemoWeb',
    component: ManageDemoWeb,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/visitor-analytics',
    name: 'VisitorAnalytics',
    component: VisitorAnalytics,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/pdf-center',
    name: 'PdfDownloadCenter',
    component: PdfDownloadCenter,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/live',
    name: 'ManageLive',
    component: ManageLive,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/qa',
    name: 'ManageQA',
    component: () => import('../views/admin/ManageQA.vue'),
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
  {
    path: '/admin/activity-log',
    name: 'ActivityLog',
    component: ActivityLog,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // VirtualPatient Hub — landing public ที่ medninja.academy/virtual-patient (immersive = ไม่มี Navbar/Footer)
  { path: '/virtual-patient', name: 'VirtualPatientHub', component: VirtualPatientHub, meta: { public: true, immersive: true } },
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
    path: '/live/room/:packageId',
    name: 'WatchLiveRoom',
    component: WatchLive,
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
  {
    path: '/qa/:packageId',
    name: 'CourseQA',
    component: () => import('../views/LiveQA.vue'),
    meta: { requiresAuth: true, requiresProfile: true }
  },
  {
    path: '/live/:id',
    name: 'WatchLive',
    component: WatchLive,
    meta: { requiresAuth: true, requiresProfile: true, immersive: true }
  },
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

// หน้าที่ต้องการ track visitor (เงียบๆ ไม่มี UI)
const TRACKED_PAGES = new Set(['/', '/courses', '/demo/watch/0', '/demo/watch/1'])

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    authStore.loginModalOpen = true
    // เปิด modal แทน redirect ไปหน้า login
    next({ name: 'Home' })
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

// ⭐ เช็ค version ทุก navigation ยกเว้นหน้าที่ดู VDO อยู่
// /my/watch/ = ดู VDO ปกติ (ห้าม reload ไม่งั้นนักเรียนเสียที่ดู)
// path อื่นๆ ทุกหน้า (รวม /my, /live, /demo) = เช็ค version → ไม่ตรง = hard reload
const SKIP_RELOAD_PATHS = ['/my/watch/'] // กำลังดู VDO ปกติ ห้าม reload
router.beforeResolve(async (to, from, next) => {
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

// track visitor หลัง navigation สำเร็จ (fire-and-forget)
router.afterEach((to) => {
  checkPendingReload()
  if (TRACKED_PAGES.has(to.path)) {
    const params = new URLSearchParams(window.location.search)
    fetch('/api/visitor/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: to.path,
        referrer: document.referrer || '',
        screenSize: `${window.screen.width}x${window.screen.height}`,
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || ''
      })
    }).catch(() => {})
  }
})

export default router
