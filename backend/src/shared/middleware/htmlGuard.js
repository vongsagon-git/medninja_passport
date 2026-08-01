/**
 * HTML Route Guard — "path ไหนไม่มี/ไม่มีสิทธิ์ = 404 stealth"
 *
 * Explicit whitelist model:
 *   - PUBLIC_EXACT / PUBLIC_PREFIXES  → anyone (no auth check)
 *   - STUDENT_PREFIXES                 → require logged-in user (any role)
 *   - ADMIN_PREFIXES                   → require role=admin
 *   - Anything NOT in these lists      → 404 stealth (unknown path)
 *
 * Auth check reads httpOnly cookie 'sid' → Valkey ticket → User.role
 * Serves branded 404 page (with "กลับสู่หน้าแรก" button) for all denied cases.
 */
const path = require('path')
const fs = require('fs')
const { lookupTicket } = require('../../modules/auth/session.service')
const User = require('../../modules/user/User.model')
const Activation = require('../../modules/activation/Activation.model')
const Package = require('../../modules/content/Package.model')

let stealthPage = null
function getStealthPage () {
  if (stealthPage) return stealthPage
  try {
    stealthPage = fs.readFileSync(path.join(__dirname, '../../pages/404.html'), 'utf8')
  } catch {
    stealthPage = '<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>404 Not Found</h1><a href="/">Home</a></body></html>'
  }
  return stealthPage
}

function send404 (res) {
  res.status(404)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  return res.send(getStealthPage())
}

const PUBLIC_EXACT = new Set([
  '/',
  '/login',
  '/home',
  '/register',
  '/ninja-passport',
  '/linelink',
  '/reply',
  '/screen-check',
  '/ext',
  '/geo',
  '/jwt',
  '/domain',
  '/china',
  '/china-video',
  '/robots.txt',
  '/favicon.ico',
  '/sitemap.xml'
])

const PUBLIC_PREFIXES = [
  '/assets/',
  '/img/',
  '/local-cdn/',
  '/vendor/',
  '/pages/',
  '/demo/',
  '/handoff'
]

const STUDENT_PREFIXES = [
  '/my',
  '/my-cn',
  '/live',
  '/qa',
  '/alumni',
  '/complete-profile',
  '/diag',
  '/doctor',
  '/doctor-cn',
  '/watch-beta',
  '/profile'
]

const ADMIN_PREFIXES = [
  '/admin',
  '/db-viewer'
]

function matchesPrefix (reqPath, prefixes) {
  return prefixes.some(p => {
    const base = p.endsWith('/') ? p.slice(0, -1) : p
    return reqPath === base || reqPath.startsWith(base + '/')
  })
}

function isPublicPath (reqPath) {
  if (PUBLIC_EXACT.has(reqPath)) return true
  if (matchesPrefix(reqPath, PUBLIC_PREFIXES)) return true
  return false
}

function requiredRole (reqPath) {
  if (matchesPrefix(reqPath, ADMIN_PREFIXES)) return 'admin'
  if (matchesPrefix(reqPath, STUDENT_PREFIXES)) return 'user'
  return null
}

async function getUserFromCookie (req) {
  const sid = req.cookies && req.cookies.sid
  if (!sid) return null
  try {
    const ticket = await lookupTicket(sid)
    if (!ticket || !ticket.userId) return null
    const user = await User.findById(ticket.userId).select('role isBanned').lean()
    if (!user || user.isBanned) return null
    return user
  } catch {
    return null
  }
}

/**
 * Extract section ID from HTML path patterns (both global + CN):
 *   /my/section/:sectionId
 *   /my/watch/:sectionId/:videoIndex
 *   /my-cn/section/:sectionId
 *   /my-cn/watch/:sectionId/:videoIndex
 */
function extractSectionId (reqPath) {
  const patterns = [
    /^\/my\/section\/([0-9a-f]{24})/i,
    /^\/my\/watch\/([0-9a-f]{24})\//i,
    /^\/my-cn\/section\/([0-9a-f]{24})/i,
    /^\/my-cn\/watch\/([0-9a-f]{24})\//i
  ]
  for (const re of patterns) {
    const m = reqPath.match(re)
    if (m) return m[1]
  }
  return null
}

/**
 * Check if user has entitlement to a specific section
 * (via Activation → Package → sections list). Admin bypass.
 */
async function hasEntitlementToSection (user, sectionId) {
  if (user.role === 'admin') return true
  try {
    const now = new Date()
    const activations = await Activation.find({
      userId: user._id,
      isActive: true,
      passedAt: null,
      expiresAt: { $gt: now }
    }).select('packageId').lean()
    if (!activations.length) return false
    const packageIds = activations.map(a => a.packageId).filter(Boolean)
    const match = await Package.exists({
      _id: { $in: packageIds },
      sections: sectionId
    })
    return !!match
  } catch {
    return false
  }
}

async function htmlGuard (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const accept = req.headers.accept || ''
  const isHtmlReq = accept.includes('text/html') || accept === '' || accept === '*/*'
  if (!isHtmlReq) return next()

  if (req.path.startsWith('/api/')) return next()

  if (isPublicPath(req.path)) return next()

  const need = requiredRole(req.path)

  // Unknown path → 404 stealth (no shell leak)
  if (!need) return send404(res)

  // Protected path — must have valid session
  const user = await getUserFromCookie(req)
  if (!user) return send404(res)

  if (need === 'admin' && user.role !== 'admin') return send404(res)

  // ⭐ Entitlement check for section-scoped paths
  //    Deny = 404 stealth (no metadata leak — hacker can't confirm section exists)
  const sectionId = extractSectionId(req.path)
  if (sectionId) {
    const allowed = await hasEntitlementToSection(user, sectionId)
    if (!allowed) return send404(res)
  }

  return next()
}

module.exports = htmlGuard
