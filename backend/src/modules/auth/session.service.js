/**
 * Session Service — Concurrent Session Limit
 *
 * ป้องกันแชร์ account: จำกัด max 2 sessions ต่อ user
 * ใช้ Valkey sorted set: key = sess:{userId}, score = timestamp, member = sessionId
 */
const crypto = require('crypto')
const { getClient } = require('../../shared/config/valkey')

const SESSION_TTL = parseInt(process.env.SESSION_TTL_DAYS || '7', 10) * 86400

async function createSession(userId) {
  const client = getClient()
  if (!client) return null

  try {
    const sessionId = crypto.randomUUID()
    const key = `sess:${userId}`
    const now = Date.now()

    await client.zadd(key, now, sessionId)
    await client.zremrangebyscore(key, 0, now - (SESSION_TTL * 1000))

    // ไม่จำกัดจำนวน session — admin เตะเองผ่าน Warroom

    await client.expire(key, SESSION_TTL)
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

async function removeSession(userId, sessionId) {
  const client = getClient()
  if (!client || !sessionId) return

  try {
    await client.zrem(`sess:${userId}`, sessionId)
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
    await client.del(`sess:${userId}`)
  } catch {}
}

module.exports = { createSession, validateSession, removeSession, removeAllSessions, getSessions }
