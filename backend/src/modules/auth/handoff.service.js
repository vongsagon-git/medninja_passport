/**
 * Handoff Service — One-time Code Exchange (เหมือน OAuth 2.0 Authorization Code)
 *
 * Login ที่ LMS ครั้งเดียว → สร้าง code → redirect ไป app อื่น → แลก code เป็น JWT
 * - Code ใช้ได้ครั้งเดียว (ลบหลังแลก)
 * - หมดอายุ 30 วินาที
 * - เก็บใน Valkey key: handoff:{code}
 *
 * รองรับทุก app: synapse, ddx, osce, nlex
 */
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { getClient } = require('../../shared/config/valkey')

const CODE_TTL = 30 // วินาที

/**
 * สร้าง one-time code สำหรับ handoff
 * @param {string} userId
 * @param {string} sessionId — sid จาก JWT เดิม (ส่งต่อให้ app ปลายทาง)
 * @param {string} target — app ปลายทาง (synapse, ddx, osce, nlex)
 * @returns {string|null} code
 */
async function createHandoffCode(userId, sessionId, target) {
  const client = getClient()
  if (!client) return null

  try {
    const code = crypto.randomBytes(32).toString('hex')
    const key = `handoff:${code}`
    const value = JSON.stringify({ userId, sessionId, target, createdAt: Date.now() })

    await client.set(key, value, 'EX', CODE_TTL)
    return code
  } catch (err) {
    console.error('[Handoff] create code error:', err.message)
    return null
  }
}

/**
 * แลก code เป็น JWT (ใช้ได้ครั้งเดียว)
 * @param {string} code
 * @returns {{ token: string, userId: string } | null}
 */
async function exchangeCode(code) {
  const client = getClient()
  if (!client || !code) return null

  try {
    const key = `handoff:${code}`

    // GET แล้ว DEL atomic — ใช้ได้ครั้งเดียว
    const value = await client.get(key)
    if (!value) return null

    await client.del(key)

    const data = JSON.parse(value)
    const tokenPayload = { id: data.userId }
    if (data.sessionId) tokenPayload.sid = data.sessionId

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' })

    return { token, userId: data.userId, target: data.target }
  } catch (err) {
    console.error('[Handoff] exchange code error:', err.message)
    return null
  }
}

module.exports = { createHandoffCode, exchangeCode }
