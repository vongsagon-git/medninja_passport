/**
 * System Controller — Circuit Breaker endpoints
 *
 * GET  /api/system/video-mode          (public) — user + admin poll
 * PATCH /api/admin/system/video-mode   (admin) — set mode + broadcast
 */
const PassportSystemConfig = require('./PassportSystemConfig.model')

// In-memory cache 5 นาที (ลด DB read สำหรับ endpoint ที่ user poll บ่อย)
const CACHE_TTL_MS = 5 * 60 * 1000
let _cache = { value: null, expiresAt: 0 }

async function _getConfig () {
  const now = Date.now()
  if (_cache.value && now < _cache.expiresAt) return _cache.value
  let doc = await PassportSystemConfig.findById('singleton').lean()
  if (!doc) {
    // สร้าง default record ครั้งแรก
    doc = await PassportSystemConfig.create({ _id: 'singleton', globalVideoMode: 'bunny' })
    doc = doc.toObject()
  }
  _cache = { value: doc, expiresAt: now + CACHE_TTL_MS }
  return doc
}

function _invalidateCache () {
  _cache = { value: null, expiresAt: 0 }
}

/** GET /api/system/video-mode — public */
exports.getVideoMode = async (req, res, next) => {
  try {
    const doc = await _getConfig()
    res.setHeader('Cache-Control', 'no-store')
    return res.json({
      mode: doc.globalVideoMode || 'bunny',
      updatedAt: doc.updatedAt
    })
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/admin/system/video-mode — admin only */
exports.setVideoMode = async (req, res, next) => {
  try {
    const { mode } = req.body || {}
    if (!['bunny', 'ali'].includes(mode)) {
      return res.status(400).json({ message: 'mode ต้องเป็น "bunny" หรือ "ali"' })
    }
    const doc = await PassportSystemConfig.findByIdAndUpdate(
      'singleton',
      {
        globalVideoMode: mode,
        updatedBy: req.user?._id || null,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    ).lean()
    _invalidateCache()

    // Note: ไม่มี WS broadcast — user เช็ค circuit ตอนเข้า watch page เท่านั้น
    // ถ้า admin อยาก force user ปัจจุบันให้ apply ใหม่ → กด Kick All ที่ /admin/viewers

    return res.json({
      ok: true,
      mode: doc.globalVideoMode,
      updatedAt: doc.updatedAt
    })
  } catch (err) {
    next(err)
  }
}
