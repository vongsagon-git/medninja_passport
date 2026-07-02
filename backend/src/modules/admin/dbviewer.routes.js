/**
 * DB Viewer — Admin only
 * ดู MongoDB collections + documents + Valkey keys
 */
const router = require('express').Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const { passportConn, lmsConn } = require('../../shared/config/db')
const { getClient } = require('../../shared/config/valkey')

router.use(auth, admin)

// GET /api/admin/db — list databases + collections + counts
router.get('/', async (req, res) => {
  try {
    const result = []

    // Passport DB
    if (passportConn && passportConn.readyState === 1) {
      const collections = await passportConn.db.listCollections().toArray()
      const items = []
      for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
        const count = await passportConn.db.collection(col.name).countDocuments()
        items.push({ name: col.name, count })
      }
      result.push({ db: 'passport', status: 'connected', collections: items })
    } else {
      result.push({ db: 'passport', status: 'disconnected', collections: [] })
    }

    // LMS DB
    if (lmsConn && lmsConn.readyState === 1) {
      const collections = await lmsConn.db.listCollections().toArray()
      const items = []
      for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
        const count = await lmsConn.db.collection(col.name).countDocuments()
        items.push({ name: col.name, count })
      }
      result.push({ db: 'lms', status: 'connected', collections: items })
    } else {
      result.push({ db: 'lms', status: 'disconnected', collections: [] })
    }

    // Valkey
    const redis = getClient()
    let valkeyInfo = { status: 'disconnected', keyCount: 0 }
    if (redis && redis.status === 'ready') {
      const info = await redis.info('keyspace')
      const match = info.match(/keys=(\d+)/)
      valkeyInfo = { status: 'connected', keyCount: match ? parseInt(match[1]) : 0 }
    }

    res.json({ databases: result, valkey: valkeyInfo })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/db/:dbName/:collection — list documents (paginated)
router.get('/:dbName/:collection', async (req, res) => {
  try {
    const { dbName, collection } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const conn = dbName === 'passport' ? passportConn : lmsConn
    if (!conn || conn.readyState !== 1) {
      return res.status(503).json({ message: `${dbName} DB not connected` })
    }

    const col = conn.db.collection(collection)
    const [docs, total] = await Promise.all([
      col.find({}).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments()
    ])

    // Sanitize sensitive fields
    const sanitized = docs.map(doc => {
      const d = { ...doc }
      if (d.password) d.password = '********'
      if (d.verifyToken) d.verifyToken = '********'
      if (d.idCardImage) d.idCardImage = `[base64 image ${d.idCardImage.length} chars]`
      return d
    })

    res.json({ documents: sanitized, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/db/:dbName/:collection/:id — single document
router.get('/:dbName/:collection/:id', async (req, res) => {
  try {
    const { dbName, collection, id } = req.params
    const conn = dbName === 'passport' ? passportConn : lmsConn
    if (!conn || conn.readyState !== 1) {
      return res.status(503).json({ message: `${dbName} DB not connected` })
    }

    const mongoose = require('mongoose')
    const col = conn.db.collection(collection)
    let doc
    try {
      doc = await col.findOne({ _id: new mongoose.Types.ObjectId(id) })
    } catch {
      doc = await col.findOne({ _id: id })
    }

    if (!doc) return res.status(404).json({ message: 'Document not found' })

    // Sanitize
    if (doc.password) doc.password = '********'
    if (doc.verifyToken) doc.verifyToken = '********'
    if (doc.idCardImage) doc.idCardImage = `[base64 image ${doc.idCardImage.length} chars]`

    res.json({ document: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/db/valkey/keys — list all Valkey keys
router.get('/valkey/keys', async (req, res) => {
  try {
    const redis = getClient()
    if (!redis || redis.status !== 'ready') {
      return res.json({ keys: [], status: 'disconnected' })
    }

    const pattern = req.query.pattern || '*'
    const keys = await redis.keys(pattern)

    // Get type + TTL for each key (limit 200)
    const limited = keys.sort().slice(0, 200)
    const items = []
    for (const key of limited) {
      const [type, ttl] = await Promise.all([
        redis.type(key),
        redis.ttl(key)
      ])
      items.push({ key, type, ttl })
    }

    res.json({ keys: items, total: keys.length, status: 'connected' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/db/valkey/key/:key — get value of a key
router.get('/valkey/key/*', async (req, res) => {
  try {
    const redis = getClient()
    if (!redis || redis.status !== 'ready') {
      return res.status(503).json({ message: 'Valkey not connected' })
    }

    const key = req.params[0]
    const type = await redis.type(key)
    const ttl = await redis.ttl(key)
    let value

    switch (type) {
      case 'string': value = await redis.get(key); break
      case 'hash': value = await redis.hgetall(key); break
      case 'list': value = await redis.lrange(key, 0, 99); break
      case 'set': value = await redis.smembers(key); break
      case 'zset': value = await redis.zrange(key, 0, 99, 'WITHSCORES'); break
      default: value = null
    }

    // Try JSON parse
    if (typeof value === 'string') {
      try { value = JSON.parse(value) } catch {}
    }

    res.json({ key, type, ttl, value })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
