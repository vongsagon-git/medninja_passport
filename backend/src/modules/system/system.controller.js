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
    doc = await PassportSystemConfig.create({
      _id: 'singleton',
      globalVideoMode: 'bunny',
      cnVideoMode: 'ali',
      globalUiMode: 'global',
      cnUiMode: 'cn'
    })
    doc = doc.toObject()
  }
  // Backfill สำหรับ record เก่า
  if (!doc.cnVideoMode)  doc.cnVideoMode  = 'ali'
  if (!doc.globalUiMode) doc.globalUiMode = 'global'
  if (!doc.cnUiMode)     doc.cnUiMode     = 'cn'
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
      // Serv mode (Bunny/Ali) แยกตาม route
      globalMode: doc.globalVideoMode || 'bunny',
      cnMode: doc.cnVideoMode || 'ali',
      // UI mode (Thai/Chinese) แยกตาม route
      globalUi: doc.globalUiMode || 'global',
      cnUi: doc.cnUiMode || 'cn',
      // Backward compat
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
    const { field, value } = req.body || {}
    // ⭐ Generic setter — 4 fields สลับได้:
    //    field='globalVideoMode' value='bunny'|'ali'   → Serv ที่ /my/*
    //    field='cnVideoMode'     value='bunny'|'ali'   → Serv ที่ /my-cn/*
    //    field='globalUiMode'    value='global'|'cn'   → UI ที่ /my/*
    //    field='cnUiMode'        value='global'|'cn'   → UI ที่ /my-cn/*
    const validFields = {
      globalVideoMode: ['bunny', 'ali'],
      cnVideoMode:     ['bunny', 'ali'],
      globalUiMode:    ['global', 'cn'],
      cnUiMode:        ['global', 'cn']
    }
    if (!validFields[field]) {
      return res.status(400).json({ message: 'field ไม่ถูกต้อง (globalVideoMode|cnVideoMode|globalUiMode|cnUiMode)' })
    }
    if (!validFields[field].includes(value)) {
      return res.status(400).json({ message: `value ต้องเป็น ${validFields[field].join('|')}` })
    }

    const update = {
      updatedBy: req.user?._id || null,
      updatedAt: new Date()
    }
    update[field] = value

    const doc = await PassportSystemConfig.findByIdAndUpdate(
      'singleton',
      update,
      { new: true, upsert: true }
    ).lean()
    _invalidateCache()

    return res.json({
      ok: true,
      field,
      value,
      config: {
        globalVideoMode: doc.globalVideoMode || 'bunny',
        cnVideoMode: doc.cnVideoMode || 'ali',
        globalUiMode: doc.globalUiMode || 'global',
        cnUiMode: doc.cnUiMode || 'cn'
      },
      updatedAt: doc.updatedAt
    })
  } catch (err) {
    next(err)
  }
}
