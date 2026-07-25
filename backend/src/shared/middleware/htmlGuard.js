/**
 * HTML Route Guard — "No permission = 404 stealth"
 *
 * Blocks HTML shell leak by returning stealth 404 for protected paths
 * when the requester has no valid session (or wrong role).
 *
 * Design:
 *   - Reads opaque session ticket from httpOnly cookie 'sid'
 *   - Looks up ticket in Valkey (fast: 1ms)
 *   - Fetches User + role from MongoDB (realtime — no stale role in cookie)
 *   - Returns 404 stealth (same body as random 404) if not authorized
 *   - Falls through to next() so SPA fallback serves index.html for legit users
 *
 * Public paths bypass guard (see PUBLIC_EXACT + PUBLIC_PREFIXES).
 * Everything else that MATCHES a protected pattern must have valid session.
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
    stealthPage = '<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>404 Not Found</h1></body></html>'
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
  '/live',
  '/qa',
  '/alumni',
  '/complete-profile',
  '/diag',
  '/doctor',
  '/doctor-cn',
  '/watch-beta'
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

async function htmlGuard (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const accept = req.headers.accept || ''
  const isHtmlReq = accept.includes('text/html') || accept === '' || accept === '*/*'
  if (!isHtmlReq) return next()

  if (req.path.startsWith('/api/')) return next()

  if (isPublicPath(req.path)) return next()

  const need = requiredRole(req.path)
  if (!need) return next()

  const sid = req.cookies && req.cookies.sid
  if (!sid) return send404(res)

  try {
    const ticket = await lookupTicket(sid)
    if (!ticket || !ticket.userId) return send404(res)

    const user = await User.findById(ticket.userId).select('role isBanned').lean()
    if (!user) return send404(res)
    if (user.isBanned) return send404(res)

    if (need === 'admin' && user.role !== 'admin') return send404(res)

    return next()
  } catch (err) {
    return send404(res)
  }
}

module.exports = htmlGuard
