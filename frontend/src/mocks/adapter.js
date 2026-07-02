// ─── Mock Axios Adapter ───────────────────────────────────────────────────────
// Intercepts ALL axios requests when VITE_USE_MOCK=true
// ไม่ต้องมี backend หรือ MongoDB — ใช้ข้อมูลจาก data.js แทน

import {
  MOCK_USERS,
  MOCK_COURSES,
  MOCK_SECTIONS,
  MOCK_PACKAGES,
  MOCK_ACTIVATIONS,
  MOCK_DEMO_SECTION,
  saveToken,
  getEmailFromToken
} from './data'

// ─── URL pattern matching ─────────────────────────────────────────────────────

function matchPattern(url, pattern) {
  const clean = url.split('?')[0]
  const regexStr = pattern.replace(/:([^/]+)/g, '([^/]+)')
  const regex = new RegExp(`^${regexStr}$`)
  const match = clean.match(regex)
  if (!match) return null
  const paramNames = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1])
  const params = {}
  paramNames.forEach((name, i) => { params[name] = match[i + 1] })
  return params
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function ok(data) {
  return { ok: true, data, status: 200 }
}

function fail(message, status = 400) {
  return { ok: false, data: { message }, status }
}

// ─── Get current user from bearer token ──────────────────────────────────────

function getUser(config) {
  const auth = config.headers?.Authorization || config.headers?.authorization || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  const key = getEmailFromToken(token) // returns nationalId (key) despite function name
  return key ? MOCK_USERS[key] : null
}

function body(config) {
  try { return JSON.parse(config.data || '{}') } catch { return {} }
}

// ─── Route table ─────────────────────────────────────────────────────────────

const routes = []

function r(method, pattern, handler) {
  routes.push({ method: method.toLowerCase(), pattern, handler })
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

r('post', '/auth/login', (cfg) => {
  const { nationalId, password } = body(cfg)
  const user = MOCK_USERS[nationalId]
  if (!user || !password || password.length < 3) {
    return fail('เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง', 401)
  }
  const token = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`
  saveToken(token, nationalId)
  return ok({ token, user })
})

r('get', '/auth/me', (cfg) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  return ok({ user })
})

r('put', '/users/profile', (cfg) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const updates = body(cfg)
  const updated = { ...user, ...updates }
  MOCK_USERS[user.nationalId] = updated
  return ok({ user: updated, message: 'บันทึกเรียบร้อย' })
})

r('post', '/auth/change-password', (cfg) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const { currentPassword, newPassword } = body(cfg)
  if (!currentPassword || currentPassword.length < 3) return fail('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400)
  if (!newPassword || newPassword.length < 6) return fail('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 400)
  return ok({ message: 'เปลี่ยนรหัสผ่านเรียบร้อย' })
})

r('post', '/auth/logout', () => {
  return ok({ message: 'ออกจากระบบเรียบร้อย' })
})

r('post', '/users/complete-profile', (cfg) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const data = body(cfg)
  const updated = { ...user, ...data, profileLocked: true, profileCompletedAt: new Date().toISOString() }
  MOCK_USERS[user.nationalId] = updated
  return ok({ user: updated, message: 'บันทึกข้อมูลเรียบร้อย' })
})

// ── COURSES ───────────────────────────────────────────────────────────────────

r('get', '/courses', () => {
  return ok({ courses: MOCK_COURSES })
})

// Admin: GET /courses/all returns all courses including unpublished
r('get', '/courses/all', () => {
  return ok({ courses: MOCK_COURSES })
})

r('get', '/courses/:id', (cfg, p) => {
  const course = MOCK_COURSES.find(c => c._id === p.id)
  if (!course) return fail('ไม่พบคอร์ส', 404)
  return ok({ course })
})

r('post', '/courses', (cfg) => {
  const data = body(cfg)
  const course = { _id: `course_${Date.now()}`, ...data, isPublished: false, lessons: [] }
  MOCK_COURSES.push(course)
  return ok({ course, message: 'สร้างคอร์สเรียบร้อย' })
})

r('put', '/courses/:id', (cfg, p) => {
  const idx = MOCK_COURSES.findIndex(c => c._id === p.id)
  if (idx < 0) return fail('ไม่พบคอร์ส', 404)
  MOCK_COURSES[idx] = { ...MOCK_COURSES[idx], ...body(cfg) }
  return ok({ course: MOCK_COURSES[idx], message: 'อัปเดตเรียบร้อย' })
})

r('delete', '/courses/:id', (cfg, p) => {
  const idx = MOCK_COURSES.findIndex(c => c._id === p.id)
  if (idx >= 0) MOCK_COURSES.splice(idx, 1)
  return ok({ message: 'ลบคอร์สเรียบร้อย' })
})

// ── SECTIONS / PACKAGES / ACTIVATIONS (v2) ───────────────────────────────────

// Helper: populate package with full section objects
function populatePackage(pkg) {
  if (!pkg) return null
  const sections = (pkg.sections || [])
    .map(sid => MOCK_SECTIONS.find(s => s._id === sid))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
  return { ...pkg, sections }
}

// Student: get my activations (with populated package + sections)
r('get', '/my/activations', (cfg) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const acts = MOCK_ACTIVATIONS
    .filter(a => a.userId === user._id)
    .map(a => {
      const pkg = MOCK_PACKAGES.find(p => p._id === a.packageId)
      return { ...a, package: populatePackage(pkg) }
    })
  return ok({ activations: acts })
})

// Student: get section videos (access check)
r('get', '/my/sections/:sectionId', (cfg, p) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const section = MOCK_SECTIONS.find(s => s._id === p.sectionId)
  if (!section) return fail('ไม่พบ Section', 404)
  // Check if user has access via any active, non-expired activation
  const hasAccess = MOCK_ACTIVATIONS.some(a => {
    if (a.userId !== user._id || !a.isActive) return false
    if (new Date(a.expiresAt) < new Date()) return false
    const pkg = MOCK_PACKAGES.find(pk => pk._id === a.packageId)
    return pkg && pkg.sections.includes(p.sectionId)
  })
  if (!hasAccess) return fail('ไม่มีสิทธิ์เข้าถึง Section นี้', 403)
  return ok({ section })
})

// Student: get video (mock — no signed URL in mock mode)
r('get', '/my/sections/:sectionId/videos/:videoIndex', (cfg, p) => {
  const user = getUser(cfg)
  if (!user) return fail('Unauthorized', 401)
  const section = MOCK_SECTIONS.find(s => s._id === p.sectionId)
  if (!section) return fail('ไม่พบ Section', 404)
  const idx = parseInt(p.videoIndex)
  if (idx < 0 || idx >= section.videos.length) return fail('ไม่พบวีดีโอ', 404)
  // Access check
  const hasAccess = MOCK_ACTIVATIONS.some(a => {
    if (a.userId !== user._id || !a.isActive) return false
    if (new Date(a.expiresAt) < new Date()) return false
    const pkg = MOCK_PACKAGES.find(pk => pk._id === a.packageId)
    return pkg && pkg.sections.includes(p.sectionId)
  })
  if (!hasAccess) return fail('ไม่มีสิทธิ์เข้าถึง', 403)
  const raw = section.videos[idx]
  const video = { ...raw, embedUrl: raw.embedUrl || null }
  return ok({ video })
})

// Admin: list all activations
r('get', '/admin/activations', (cfg) => {
  const user = getUser(cfg)
  if (!user || user.role !== 'admin') return fail('Unauthorized', 401)
  const acts = MOCK_ACTIVATIONS.map(a => {
    const pkg = MOCK_PACKAGES.find(p => p._id === a.packageId)
    const usr = Object.values(MOCK_USERS).find(u => u._id === a.userId)
    return { ...a, package: pkg ? { _id: pkg._id, title: pkg.title } : null, user: usr ? { _id: usr._id, name: usr.name, email: usr.email } : null }
  })
  return ok({ activations: acts })
})

// Admin: create activation
r('post', '/admin/activations', (cfg) => {
  const user = getUser(cfg)
  if (!user || user.role !== 'admin') return fail('Unauthorized', 401)
  const { userId, packageId, note } = body(cfg)
  const pkg = MOCK_PACKAGES.find(p => p._id === packageId)
  if (!pkg) return fail('ไม่พบ Package', 404)
  const now = new Date()
  const act = {
    _id: `act_${Date.now()}`,
    userId, packageId,
    activatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + pkg.durationDays * 24 * 3600 * 1000).toISOString(),
    extendedDays: 0, isActive: true,
    activatedBy: user._id, note: note || ''
  }
  MOCK_ACTIVATIONS.push(act)
  return ok({ activation: act, message: 'Activate สำเร็จ' })
})

// Admin: update activation (extend days)
r('put', '/admin/activations/:id', (cfg, p) => {
  const user = getUser(cfg)
  if (!user || user.role !== 'admin') return fail('Unauthorized', 401)
  const idx = MOCK_ACTIVATIONS.findIndex(a => a._id === p.id)
  if (idx < 0) return fail('ไม่พบ Activation', 404)
  const updates = body(cfg)
  const act = MOCK_ACTIVATIONS[idx]
  // Handle extendDays: add days to current expiresAt
  if (updates.extendDays && updates.extendDays > 0) {
    const currentExpiry = new Date(act.expiresAt)
    currentExpiry.setDate(currentExpiry.getDate() + updates.extendDays)
    act.expiresAt = currentExpiry.toISOString()
    act.extendedDays = (act.extendedDays || 0) + updates.extendDays
  }
  // Merge other fields (except extendDays which is a command, not a stored field)
  const { extendDays: _, ...rest } = updates
  MOCK_ACTIVATIONS[idx] = { ...act, ...rest }
  return ok({ activation: MOCK_ACTIVATIONS[idx], message: 'อัพเดทสำเร็จ' })
})

// Admin: delete activation
r('delete', '/admin/activations/:id', (cfg, p) => {
  const user = getUser(cfg)
  if (!user || user.role !== 'admin') return fail('Unauthorized', 401)
  const idx = MOCK_ACTIVATIONS.findIndex(a => a._id === p.id)
  if (idx >= 0) MOCK_ACTIVATIONS.splice(idx, 1)
  return ok({ message: 'ลบ Activation สำเร็จ' })
})

// Admin: CRUD Sections
r('get', '/admin/sections', () => {
  return ok({ sections: MOCK_SECTIONS.sort((a, b) => a.order - b.order) })
})

r('post', '/admin/sections', (cfg) => {
  const data = body(cfg)
  const section = { _id: `sec_${Date.now()}`, ...data, videos: data.videos || [] }
  MOCK_SECTIONS.push(section)
  return ok({ section, message: 'สร้าง Section สำเร็จ' })
})

r('put', '/admin/sections/:id', (cfg, p) => {
  const idx = MOCK_SECTIONS.findIndex(s => s._id === p.id)
  if (idx < 0) return fail('ไม่พบ Section', 404)
  MOCK_SECTIONS[idx] = { ...MOCK_SECTIONS[idx], ...body(cfg) }
  return ok({ section: MOCK_SECTIONS[idx], message: 'อัพเดท Section สำเร็จ' })
})

r('delete', '/admin/sections/:id', (cfg, p) => {
  const idx = MOCK_SECTIONS.findIndex(s => s._id === p.id)
  if (idx >= 0) MOCK_SECTIONS.splice(idx, 1)
  return ok({ message: 'ลบ Section สำเร็จ' })
})

// Admin: CRUD Packages
r('get', '/admin/packages', () => {
  const pkgs = MOCK_PACKAGES.map(p => populatePackage(p)).sort((a, b) => a.order - b.order)
  return ok({ packages: pkgs })
})

r('post', '/admin/packages', (cfg) => {
  const data = body(cfg)
  const pkg = { _id: `pkg_${Date.now()}`, ...data, isPublished: false }
  MOCK_PACKAGES.push(pkg)
  return ok({ package: pkg, message: 'สร้าง Package สำเร็จ' })
})

r('put', '/admin/packages/:id', (cfg, p) => {
  const idx = MOCK_PACKAGES.findIndex(pk => pk._id === p.id)
  if (idx < 0) return fail('ไม่พบ Package', 404)
  MOCK_PACKAGES[idx] = { ...MOCK_PACKAGES[idx], ...body(cfg) }
  return ok({ package: MOCK_PACKAGES[idx], message: 'อัพเดท Package สำเร็จ' })
})

r('delete', '/admin/packages/:id', (cfg, p) => {
  const idx = MOCK_PACKAGES.findIndex(pk => pk._id === p.id)
  if (idx >= 0) MOCK_PACKAGES.splice(idx, 1)
  return ok({ message: 'ลบ Package สำเร็จ' })
})

// ── ADMIN: USERS ──────────────────────────────────────────────────────────────

r('get', '/users', () => {
  const extras = [
    { _id: 'user_002', name: 'สมหญิง ทดสอบ', email: 'somying@test.com', role: 'student', createdAt: '2025-02-01T00:00:00.000Z' },
    { _id: 'user_003', name: 'วีระ ตัวอย่าง', email: 'weera@test.com', role: 'student', createdAt: '2025-02-05T00:00:00.000Z' }
  ]
  return ok({ users: [...Object.values(MOCK_USERS), ...extras] })
})

// ── DEMO (public — no auth required) ─────────────────────────────────────────

r('get', '/demo/section', () => {
  return ok({ section: MOCK_DEMO_SECTION })
})

r('get', '/demo/section/videos/:videoIndex', (cfg, p) => {
  const idx = parseInt(p.videoIndex)
  if (idx < 0 || idx >= MOCK_DEMO_SECTION.videos.length) return fail('ไม่พบวีดีโอ', 404)
  const video = MOCK_DEMO_SECTION.videos[idx]
  return ok({ video })
})

// ─── The Axios custom adapter ─────────────────────────────────────────────────

function makeResponse(result, config) {
  return {
    data: result.data,
    status: result.status,
    statusText: result.status < 400 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
    request: {}
  }
}

export function mockAdapter(config) {
  const method = (config.method || 'get').toLowerCase()
  const path = (config.url || '').split('?')[0]

  for (const route of routes) {
    if (route.method !== method) continue
    const params = matchPattern(path, route.pattern)
    if (params !== null) {
      const result = route.handler(config, params)
      if (!result.ok) {
        const err = new Error(result.data?.message || 'Mock error')
        err.response = makeResponse(result, config)
        err.isAxiosError = true
        return Promise.reject(err)
      }
      return Promise.resolve(makeResponse(result, config))
    }
  }

  // No handler found
  console.warn(`[Mock API] No handler: ${method.toUpperCase()} ${path}`)
  const err = new Error(`[Mock] Unhandled: ${method.toUpperCase()} ${path}`)
  err.response = { data: { message: 'Mock: endpoint not implemented' }, status: 501, headers: {}, config }
  err.isAxiosError = true
  return Promise.reject(err)
}
