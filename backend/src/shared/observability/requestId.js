/**
 * Request ID middleware — inject x-request-id ทุก request
 *
 * ถ้า client ส่ง x-request-id มา → ใช้ตัวนั้น (correlation ข้าม app)
 * ถ้าไม่มี → generate uuid ใหม่
 *
 * Attach req.id ให้ downstream middleware/routes ใช้
 */
const crypto = require('crypto')

function requestId(req, res, next) {
  const incoming = req.headers['x-request-id']
  const id = (incoming && typeof incoming === 'string' && incoming.length < 100)
    ? incoming
    : crypto.randomUUID()

  req.id = id
  res.setHeader('x-request-id', id)
  next()
}

module.exports = { requestId }
