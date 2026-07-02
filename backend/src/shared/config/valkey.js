/**
 * Valkey (Redis) Connection — DigitalOcean Managed
 * ใช้สำหรับ: viewer tracking, anti-sharing, session limit
 */
const Redis = require('ioredis')

let client = null

function getClient() {
  if (client && client.status === 'ready') return client

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not set — Valkey disabled')
    return null
  }

  // ถ้า client เก่า disconnect → ลบแล้วสร้างใหม่
  if (client && client.status !== 'ready') {
    try { client.disconnect() } catch {}
    client = null
  }

  try {
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null
        return Math.min(times * 1000, 5000)
      },
      reconnectOnError(err) {
        // reconnect ทุก error
        return true
      },
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 15000,
      lazyConnect: false,
      enableReadyCheck: true,
      keepAlive: 30000
    })

    client.on('ready', () => console.log('✅ Valkey connected'))
    client.on('error', (err) => console.error('⚠️  Valkey error:', err.message))
    client.on('close', () => console.log('⚠️  Valkey closed — will reconnect'))
    client.on('reconnecting', () => console.log('🔄 Valkey reconnecting...'))
  } catch (err) {
    console.error('⚠️  Valkey init failed:', err.message)
    client = null
    return null
  }

  return client
}

function initValkey() {
  const c = getClient()
  if (c) {
    c.ping()
      .then(() => console.log('✅ Valkey ping OK'))
      .catch(err => console.error('⚠️  Valkey ping failed:', err.message))
  }
}

module.exports = { getClient, initValkey }
