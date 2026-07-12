/**
 * System Controller — IP BASE Circuit Breaker
 *
 * GET  /api/system/video-mode          (public)
 * PATCH /api/admin/system/video-mode   (admin) — set mode
 *
 * ⭐ IP BASE (3 groups):
 *   ipBaseTh    → country === 'TH'
 *   ipBaseCn    → country === 'CN'
 *   ipBaseOther → country ≠ TH, CN
 */
const PassportSystemConfig = require('./PassportSystemConfig.model')

const CACHE_TTL_MS = 5 * 60 * 1000
let _cache = { value: null, expiresAt: 0 }

async function _getConfig () {
  const now = Date.now()
  if (_cache.value && now < _cache.expiresAt) return _cache.value
  let doc = await PassportSystemConfig.findById('singleton').lean()
  if (!doc) {
    doc = await PassportSystemConfig.create({
      _id: 'singleton',
      ipBaseThVideoMode: 'bunny',
      ipBaseCnVideoMode: 'ali',
      ipBaseOtherVideoMode: 'bunny'
    })
    doc = doc.toObject()
  }
  // Backfill legacy → new
  if (!doc.ipBaseThVideoMode)    doc.ipBaseThVideoMode    = doc.nonCnVideoMode || doc.globalVideoMode || 'bunny'
  if (!doc.ipBaseCnVideoMode)    doc.ipBaseCnVideoMode    = doc.cnVideoMode || 'ali'
  if (!doc.ipBaseOtherVideoMode) doc.ipBaseOtherVideoMode = doc.nonCnVideoMode || doc.globalVideoMode || 'bunny'
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
      // ⭐ IP BASE (new — 3 groups with Serv + Browser Allow)
      ipBaseThVideoMode:    doc.ipBaseThVideoMode    || 'bunny',
      ipBaseCnVideoMode:    doc.ipBaseCnVideoMode    || 'ali',
      ipBaseOtherVideoMode: doc.ipBaseOtherVideoMode || 'bunny',
      ipBaseThAllowedBrowsers:    doc.ipBaseThAllowedBrowsers    || ['Chrome', 'Safari', 'Edge'],
      ipBaseCnAllowedBrowsers:    doc.ipBaseCnAllowedBrowsers    || ['Chrome'],
      ipBaseOtherAllowedBrowsers: doc.ipBaseOtherAllowedBrowsers || ['Chrome', 'Safari', 'Edge'],
      // ⭐ OS Allow (5 slots)
      ipBaseThAllowedOS:    doc.ipBaseThAllowedOS    || ['Windows', 'macOS', 'iOS', 'Android', 'Harmony'],
      ipBaseCnAllowedOS:    doc.ipBaseCnAllowedOS    || ['Android', 'Harmony'],
      ipBaseOtherAllowedOS: doc.ipBaseOtherAllowedOS || ['Windows', 'macOS', 'iOS', 'Android', 'Harmony'],
      // Backward compat
      nonCnVideoMode: doc.ipBaseThVideoMode || 'bunny',
      cnVideoMode:    doc.ipBaseCnVideoMode || 'ali',
      globalMode:     doc.ipBaseThVideoMode || 'bunny',
      cnMode:         doc.ipBaseCnVideoMode || 'ali',
      mode:           doc.ipBaseThVideoMode || 'bunny',
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
    // ⭐ VideoMode fields (single value)
    const videoModeFields = {
      ipBaseThVideoMode:    ['bunny', 'ali'],
      ipBaseCnVideoMode:    ['bunny', 'ali'],
      ipBaseOtherVideoMode: ['bunny', 'ali'],
      nonCnVideoMode:  ['bunny', 'ali'],
      cnVideoMode:     ['bunny', 'ali'],
      globalVideoMode: ['bunny', 'ali']
    }
    // ⭐ Browser Allow fields (3 slots: Chrome / Safari / Edge — In-App hard-block)
    const browserAllowFields = ['ipBaseThAllowedBrowsers', 'ipBaseCnAllowedBrowsers', 'ipBaseOtherAllowedBrowsers']
    const validBrowsers = ['Chrome', 'Safari', 'Edge']
    // ⭐ OS Allow fields (5 slots)
    const osAllowFields = ['ipBaseThAllowedOS', 'ipBaseCnAllowedOS', 'ipBaseOtherAllowedOS']
    const validOS = ['Windows', 'macOS', 'iOS', 'Android', 'Harmony']

    if (!videoModeFields[field] && !browserAllowFields.includes(field) && !osAllowFields.includes(field)) {
      return res.status(400).json({
        message: 'field ไม่ถูกต้อง'
      })
    }
    if (videoModeFields[field]) {
      if (!videoModeFields[field].includes(value)) {
        return res.status(400).json({ message: `value ต้องเป็น ${videoModeFields[field].join('|')}` })
      }
    } else if (browserAllowFields.includes(field)) {
      if (!Array.isArray(value)) {
        return res.status(400).json({ message: 'value ต้องเป็น array' })
      }
      const invalid = value.filter(b => !validBrowsers.includes(b))
      if (invalid.length > 0) {
        return res.status(400).json({ message: `browsers ไม่ถูกต้อง: ${invalid.join(',')} (allow: ${validBrowsers.join('|')})` })
      }
    } else if (osAllowFields.includes(field)) {
      if (!Array.isArray(value)) {
        return res.status(400).json({ message: 'value ต้องเป็น array' })
      }
      const invalid = value.filter(o => !validOS.includes(o))
      if (invalid.length > 0) {
        return res.status(400).json({ message: `OS ไม่ถูกต้อง: ${invalid.join(',')} (allow: ${validOS.join('|')})` })
      }
    }

    // Legacy field → new field mapping
    const fieldMap = {
      nonCnVideoMode:  'ipBaseThVideoMode',
      globalVideoMode: 'ipBaseThVideoMode',
      cnVideoMode:     'ipBaseCnVideoMode'
    }
    const targetField = fieldMap[field] || field

    const update = {
      updatedBy: req.user?._id || null,
      updatedAt: new Date()
    }
    update[targetField] = value
    if (fieldMap[field]) update[field] = value  // sync ทั้ง 2

    const doc = await PassportSystemConfig.findByIdAndUpdate(
      'singleton', update, { new: true, upsert: true }
    ).lean()
    _invalidateCache()

    return res.json({
      ok: true,
      field: targetField,
      value,
      config: {
        ipBaseThVideoMode:    doc.ipBaseThVideoMode    || 'bunny',
        ipBaseCnVideoMode:    doc.ipBaseCnVideoMode    || 'ali',
        ipBaseOtherVideoMode: doc.ipBaseOtherVideoMode || 'bunny',
        ipBaseThAllowedBrowsers:    doc.ipBaseThAllowedBrowsers    || ['Chrome', 'Safari', 'Edge'],
        ipBaseCnAllowedBrowsers:    doc.ipBaseCnAllowedBrowsers    || ['Chrome'],
        ipBaseOtherAllowedBrowsers: doc.ipBaseOtherAllowedBrowsers || ['Chrome', 'Safari', 'Edge'],
        ipBaseThAllowedOS:    doc.ipBaseThAllowedOS    || ['Windows', 'macOS', 'iOS', 'Android', 'Harmony'],
        ipBaseCnAllowedOS:    doc.ipBaseCnAllowedOS    || ['Android', 'Harmony'],
        ipBaseOtherAllowedOS: doc.ipBaseOtherAllowedOS || ['Windows', 'macOS', 'iOS', 'Android', 'Harmony']
      },
      updatedAt: doc.updatedAt
    })
  } catch (err) {
    next(err)
  }
}
