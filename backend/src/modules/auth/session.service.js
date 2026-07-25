/**
 * Session Service — Opaque Session Tickets (Valkey-backed)
 *
 * Two Valkey structures:
 *   1. sess:{userId}     = sorted set { sid: timestamp }   (list user's sessions, admin kick)
 *   2. ticket:{sid}      = hash { userId, createdAt, ... } (reverse lookup — HTML Guard uses this)
 *
 * TTL = 7 days sliding (renewed on validate)
 */
const crypto = require('crypto')
const { getClient } = require('../../shared/config/valkey')

const SESSION_TTL = parseInt(process.env.SESSION_TTL_DAYS || '7', 10) * 86400

async function createSession(userId, meta = {}) {
  const client = getClient()
  if (!client) return null

  try {
    const sessionId = crypto.randomUUID()
    const key = `sess:${userId}`
    const ticketKey = `ticket:${sessionId}`
    const now = Date.now()

    // 1. List (admin kick + user session list)
    await client.zadd(key, now, sessionId)
    await client.zremrangebyscore(key, 0, now - (SESSION_TTL * 1000))
    await client.expire(key, SESSION_TTL)

    // 2. Reverse lookup (HTML Guard: sid → userId)
    await client.hset(ticketKey, {
      userId: String(userId),
      createdAt: String(now),
      ip: String(meta.ip || ''),
      ua: String(meta.ua || '').slice(0, 200)
    })
    await client.expire(ticketKey, SESSION_TTL)

    return sessionId
  } catch (err) {
    console.error('⚠️  Session create error:', err.message)
    return null
  }
}

async function validateSession(userId, sessionId) {
  const client = getClient()
  if (!client || !sessionId) return true

  try {
    const score = await client.zscore(`sess:${userId}`, sessionId)
    return score !== null
  } catch {
    return true // Valkey error → allow
  }
}

/**
 * Reverse lookup: sid → userId (for HTML Guard)
 * Returns { userId, createdAt, ip, ua } or null
 * Sliding TTL: renews expiry on each valid lookup
 */
async function lookupTicket(sessionId) {
  const client = getClient()
  if (!client || !sessionId) return null

  try {
    const data = await client.hgetall(`ticket:${sessionId}`)
    if (!data || !data.userId) return null

    // Sliding TTL — renew on each use
    await client.expire(`ticket:${sessionId}`, SESSION_TTL)
    return data
  } catch {
    return null
  }
}

async function removeSession(userId, sessionId) {
  const client = getClient()
  if (!client || !sessionId) return

  try {
    await client.zrem(`sess:${userId}`, sessionId)
    await client.del(`ticket:${sessionId}`)
  } catch {}
}

async function getSessions(userId) {
  const client = getClient()
  if (!client) return []

  try {
    const sessions = await client.zrangebyscore(`sess:${userId}`, '-inf', '+inf', 'WITHSCORES')
    const result = []
    for (let i = 0; i < sessions.length; i += 2) {
      result.push({
        sessionId: sessions[i],
        loginAt: new Date(parseInt(sessions[i + 1], 10))
      })
    }
    return result
  } catch {
    return []
  }
}

async function removeAllSessions(userId) {
  const client = getClient()
  if (!client) return
  try {
    const sids = await client.zrange(`sess:${userId}`, 0, -1)
    for (const sid of sids) {
      await client.del(`ticket:${sid}`)
    }
    await client.del(`sess:${userId}`)
  } catch {}
}

module.exports = { createSession, validateSession, lookupTicket, removeSession, removeAllSessions, getSessions }
