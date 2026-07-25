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
  return prefixes.some(p => reqPath === p || reqPath.startsWith(p + '/'))
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

  return next()
}

module.exports = htmlGuard
