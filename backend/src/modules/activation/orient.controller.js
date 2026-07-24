/**
 * Orient Controller — Passport
 * รองรับ Bunny (DRM/NoDRM) + Ali (Passport-only) ตาม variant ที่ client ส่ง
 *
 * DB slots (Package.model.js):
 *   - orientBunnyDrmVideoId    (Bunny DRM — Desktop Chrome)
 *   - orientBunnyNoDrmVideoId  (Bunny No-DRM — iOS)
 *   - orientAliVideoId         (Ali Dual — จีน / Bunny circuit down)
 *
 * Rule: Bunny ต้องคู่ (pre-save validation) | Ali standalone ได้
 */
const Activation = require('./Activation.model')
const Package = require('../content/Package.model')
const { getSignedEmbedUrl, getDemoEmbedUrl } = require('../../shared/config/bunny')

const COMPLETE_THRESHOLD = 0.95
const SEEK_TOLERANCE = 15

/**
 * pick video ตาม variant client ขอ
 * variant: 'drm' (Bunny DRM) | 'nodrm' (Bunny NoDRM) | 'ali' (Ali)
 */
function pickVideo(pkg, variant) {
  const drm = pkg.orientBunnyDrmVideoId || ''
  const noDrm = pkg.orientBunnyNoDrmVideoId || ''
  const ali = pkg.orientAliVideoId || ''

  if (variant === 'ali') {
    if (ali) return { videoId: ali, source: 'ali', drm: true }
  }
  if (variant === 'nodrm') {
    if (noDrm) return { videoId: noDrm, source: 'bunny', drm: false }
  }
  if (variant === 'drm') {
    if (drm) return { videoId: drm, source: 'bunny', drm: true }
  }

  // Auto-pick: prefer Bunny DRM > NoDRM > Ali
  if (drm) return { videoId: drm, source: 'bunny', drm: true }
  if (noDrm) return { videoId: noDrm, source: 'bunny', drm: false }
  if (ali) return { videoId: ali, source: 'ali', drm: true }
  return null
}

function buildEmbedUrl(pick) {
  if (pick.source === 'ali') {
    // Ali: return raw videoId — client-side AliPlayer จะจัดการ playAuth/STS เอง
    return { embedUrl: '', aliVideoId: pick.videoId }
  }
  return { embedUrl: pick.drm ? getSignedEmbedUrl(pick.videoId) : getDemoEmbedUrl(pick.videoId), aliVideoId: '' }
}

exports.getOrient = async (req, res, next) => {
  try {
    const { activationId } = req.params
    const variant = (req.query.variant || 'drm').toLowerCase()

    const activation = await Activation.findOne({
      _id: activationId,
      userId: req.user._id,
      isActive: true
    })
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    const pkg = await Package.findById(activation.packageId)
      .select('title orientBunnyDrmVideoId orientBunnyNoDrmVideoId orientAliVideoId')
      .lean()
    if (!pkg) return res.status(404).json({ message: 'ไม่พบ package' })

    const pick = pickVideo(pkg, variant)

    if (!pick) {
      return res.json({ skipped: true, completed: false, packageTitle: pkg.title })
    }

    if (activation.orientCompletedAt) {
      return res.json({
        skipped: false,
        completed: true,
        completedAt: activation.orientCompletedAt,
        packageTitle: pkg.title
      })
    }

    const resumeSeconds = Math.max(0, Math.floor(activation.orientWatchedSeconds || 0) - 3)
    const { embedUrl, aliVideoId } = buildEmbedUrl(pick)

    res.json({
      skipped: false,
      completed: false,
      packageTitle: pkg.title,
      videoId: pick.videoId,
      drm: pick.drm,
      source: pick.source,
      embedUrl,
      aliVideoId,
      watchedSeconds: activation.orientWatchedSeconds || 0,
      resumeSeconds,
      durationSeconds: activation.orientDurationSeconds || 0,
      threshold: COMPLETE_THRESHOLD
    })
  } catch (error) {
    next(error)
  }
}

exports.heartbeat = async (req, res, next) => {
  try {
    const { activationId } = req.params
    const { position, duration } = req.body

    const activation = await Activation.findOne({
      _id: activationId,
      userId: req.user._id,
      isActive: true
    })
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    if (activation.orientCompletedAt) {
      return res.json({ ok: true, completed: true })
    }

    const pos = Math.max(0, Number(position) || 0)
    const dur = Math.max(0, Number(duration) || 0)
    const prevMax = activation.orientWatchedSeconds || 0

    const maxAllowed = prevMax + SEEK_TOLERANCE
    const clampedPos = Math.min(pos, maxAllowed)
    const newMax = Math.max(prevMax, clampedPos)

    activation.orientWatchedSeconds = newMax
    if (dur > 0) activation.orientDurationSeconds = dur

    let completed = false
    if (dur > 0 && newMax / dur >= COMPLETE_THRESHOLD) {
      activation.orientCompletedAt = new Date()
      completed = true
    }

    await activation.save()
    res.json({
      ok: true,
      completed,
      watchedSeconds: newMax,
      cappedAt: clampedPos < pos ? clampedPos : null
    })
  } catch (error) {
    next(error)
  }
}

exports.complete = async (req, res, next) => {
  try {
    const { activationId } = req.params
    const activation = await Activation.findOne({
      _id: activationId,
      userId: req.user._id,
      isActive: true
    })
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    if (activation.orientCompletedAt) {
      return res.json({ ok: true, alreadyCompleted: true })
    }

    const watched = activation.orientWatchedSeconds || 0
    const dur = activation.orientDurationSeconds || 0
    if (dur > 0 && watched / dur < COMPLETE_THRESHOLD) {
      return res.status(400).json({
        message: 'ยังดูไม่ครบ 95% กรุณาดูให้จบก่อน',
        watched, dur, percent: dur > 0 ? watched / dur : 0
      })
    }

    activation.orientCompletedAt = new Date()
    await activation.save()
    res.json({ ok: true, completedAt: activation.orientCompletedAt })
  } catch (error) {
    next(error)
  }
}

exports.selfReset = async (req, res, next) => {
  try {
    const { activationId } = req.params
    const activation = await Activation.findOne({
      _id: activationId,
      userId: req.user._id,
      isActive: true
    })
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    activation.orientCompletedAt = null
    activation.orientWatchedSeconds = 0
    activation.orientResetCount = (activation.orientResetCount || 0) + 1
    activation.orientLastResetBy = 'self'
    activation.orientLastResetAt = new Date()
    await activation.save()
    res.json({ ok: true, resetCount: activation.orientResetCount })
  } catch (error) {
    next(error)
  }
}

exports.adminReset = async (req, res, next) => {
  try {
    const { activationId } = req.params
    const activation = await Activation.findById(activationId)
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    activation.orientCompletedAt = null
    activation.orientWatchedSeconds = 0
    activation.orientResetCount = (activation.orientResetCount || 0) + 1
    activation.orientLastResetBy = `admin:${req.user._id}`
    activation.orientLastResetAt = new Date()
    await activation.save()
    res.json({ ok: true, resetCount: activation.orientResetCount })
  } catch (error) {
    next(error)
  }
}
