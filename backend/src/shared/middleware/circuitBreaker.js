/**
 * Circuit Breaker — Admin-controlled maintenance mode per scope
 * (Mirror of LMS — shares DB via lmsConn, so Valkey cache also shared cross-app)
 */
const path = require('path')
const fs = require('fs')
const SystemCircuit = require('../../modules/admin/SystemCircuit.model')
const { getClient } = require('../config/valkey')

const CACHE_KEY = 'circuit:state'
const CACHE_TTL_S = 5

let mem = null
let memAt = 0

async function loadState () {
  const now = Date.now()
  if (mem && (now - memAt) < CACHE_TTL_S * 1000) return mem

  try {
    const client = getClient()
    if (client) {
      const raw = await client.get(CACHE_KEY)
      if (raw) {
        mem = JSON.parse(raw)
        memAt = now
        return mem
      }
    }
  } catch {}

  try {
    const docs = await SystemCircuit.find({}).lean()
    const state = {}
    for (const d of docs) {
      state[d.scope] = {
        enabled: d.enabled,
        message: d.message,
        estimatedReturn: d.estimatedReturn
      }
    }
    mem = state
    memAt = now
    try {
      const client = getClient()
      if (client) await client.set(CACHE_KEY, JSON.stringify(state), 'EX', CACHE_TTL_S)
    } catch {}
    return state
  } catch (err) {
    return mem || {}
  }
}

async function invalidateCache () {
  mem = null
  memAt = 0
  try {
    const client = getClient()
    if (client) await client.del(CACHE_KEY)
  } catch {}
}

function matchScope (reqPath, state) {
  if (state.watch?.enabled && (/^\/my\/watch\//.test(reqPath) || /^\/my-cn\/watch\//.test(reqPath))) return { scope: 'watch', state: state.watch }
  if (state.section?.enabled && (/^\/my\/section\//.test(reqPath) || /^\/my-cn\/section\//.test(reqPath))) return { scope: 'section', state: state.section }
  if (state.live?.enabled && (/^\/live(\/|$)/.test(reqPath) || /^\/qa\//.test(reqPath))) return { scope: 'live', state: state.live }
  if (state.my?.enabled && (reqPath === '/my' || reqPath === '/my-cn' || /^\/my\//.test(reqPath) || /^\/my-cn\//.test(reqPath))) return { scope: 'my', state: state.my }
  return null
}

let pageCache = null
function getMaintenancePage (message, estimatedReturn) {
  if (!pageCache) {
    try {
      pageCache = fs.readFileSync(path.join(__dirname, '../../pages/maintenance.html'), 'utf8')
    } catch {
      pageCache = '<!DOCTYPE html><html><body><h1>Under maintenance</h1></body></html>'
    }
  }
  let html = pageCache
  const safeMessage = String(message || 'กำลังปรับปรุง').replace(/</g, '&lt;').replace(/\n/g, '<br>')
  html = html.replace('{{MESSAGE}}', safeMessage)
  const eta = estimatedReturn
    ? new Date(estimatedReturn).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    : ''
  html = html.replace('{{ETA}}', eta ? `กำหนดกลับมา: ${eta}` : '')
  return html
}

function serveMaintenance (res, message, estimatedReturn) {
  res.status(503)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Retry-After', '300')
  return res.send(getMaintenancePage(message, estimatedReturn))
}

async function circuitBreaker (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()
  const accept = req.headers.accept || ''
  const isHtmlReq = accept.includes('text/html') || accept === '' || accept === '*/*'
  if (!isHtmlReq) return next()
  if (req.path.startsWith('/api/')) return next()

  // ⭐ FAIL-SAFE: /admin/* always bypasses
  if (req.path === '/admin' || req.path.startsWith('/admin/')) return next()

  const state = await loadState()
  if (!state || !Object.keys(state).length) return next()

  const match = matchScope(req.path, state)
  if (!match) return next()

  return serveMaintenance(res, match.state.message, match.state.estimatedReturn)
}

module.exports = { circuitBreaker, invalidateCache, loadState }
