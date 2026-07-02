/**
 * LINE Webhook Service — verify signature + get profile
 */
const crypto = require('crypto')

function verifySignature(rawBody, signature) {
  const secret = process.env.LINE_MSG_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET
  if (!secret || !signature) return false
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(rawBody)
    .digest('base64')
  return hash === signature
}

async function getProfile(userId) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function pushMessage(userId, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set')
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ to: userId, messages })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE push failed: ${res.status} ${body}`)
  }
  return res
}

async function broadcastMessage(messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set')
  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ messages })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE broadcast failed: ${res.status} ${body}`)
  }
  return res
}

async function downloadLineContent(messageId) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set')
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`LINE content download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

module.exports = { verifySignature, getProfile, pushMessage, broadcastMessage, downloadLineContent }
