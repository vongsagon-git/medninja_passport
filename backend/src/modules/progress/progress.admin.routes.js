/**
 * Admin Progress Overview
 * ให้ admin เห็นว่านักเรียนคนไหนดูไปแล้วกี่ % + จบ topic ไหนบ้าง
 * เพื่อกระตุ้นให้เข้าเรียน + นัดปรึกษาสด
 *
 * Auth: JWT + role=admin (auth + admin middleware)
 */
const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')

const User = require('../user/User.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const Section = require('../content/Section.model')
const WatchProgress = require('../content/WatchProgress.model')

router.use(auth, admin)

/**
 * Count "video slots" ใน section
 * นับทั้ง main video + bonus video (แยก isBonus)
 * คืน: [{ videoIndex, isBonus, topic, subtopic }, ...]
 */
function extractSlots(section) {
  const slots = []
  const videos = section.videos || []
  videos.forEach((v, idx) => {
    const hasMain = !!(v.bunnyVideoId || v.bunnyDrmVideoId || v.aliVideoId || v.contentId)
    if (hasMain) {
      slots.push({ videoIndex: idx, isBonus: false, topic: v.topic || '', subtopic: v.subtopic || '' })
    }
    const hasBonus = !!(v.bonusBunnyVideoId || v.bonusBunnyDrmVideoId || v.bonusAliVideoId || v.bonusContentId)
    if (hasBonus) {
      slots.push({ videoIndex: idx, isBonus: true, topic: v.topic || '', subtopic: v.subtopic || '' })
    }
  })
  return slots
}

/**
 * GET /api/admin/progress/overview
 * รายชื่อนักเรียนทั้งหมด + % ดูจบ + จำนวน topic จบ
 * Query:
 *  - packageId (optional) — filter เฉพาะ package
 *  - q (optional) — ค้นชื่อ/email
 *  - sort=percent|name|lastWatched (default percent asc)
 */
router.get('/overview', async (req, res) => {
  try {
    const { packageId, q, sort = 'percent' } = req.query

    // 1) หา activations ทั้งหมด (active)
    const actQuery = { isActive: true }
    if (packageId) actQuery.packageId = packageId
    const activations = await Activation.find(actQuery).lean()
    if (activations.length === 0) return res.json({ ok: true, students: [] })

    const userIds = [...new Set(activations.map(a => String(a.userId)))]
    const pkgIds = [...new Set(activations.map(a => String(a.packageId)))]

    // 2) load users
    const userQuery = { _id: { $in: userIds } }
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      userQuery.$or = [{ name: rx }, { email: rx }]
    }
    const users = await User.find(userQuery).select('_id name email lineDisplayName').lean()
    const userMap = new Map(users.map(u => [String(u._id), u]))

    // 3) load packages + sections
    const packages = await Package.find({ _id: { $in: pkgIds } }).lean()
    const sectionIds = [...new Set(packages.flatMap(p => (p.sections || []).map(String)))]
    const sections = await Section.find({ _id: { $in: sectionIds } }).lean()
    const sectionMap = new Map(sections.map(s => [String(s._id), s]))

    // 4) load watch progress ทั้งหมด (เฉพาะ user ที่กรองแล้ว)
    const filteredUserIds = users.map(u => u._id)
    const progresses = await WatchProgress.find({
      userId: { $in: filteredUserIds },
      watched: true
    }).select('userId sectionId videoIndex isBonus updatedAt').lean()

    // index progress by userId → set of "sectionId:videoIndex:isBonus"
    const progressByUser = new Map()
    const lastWatchedByUser = new Map()
    progresses.forEach(p => {
      const uid = String(p.userId)
      const key = `${p.sectionId}:${p.videoIndex}:${p.isBonus ? 1 : 0}`
      if (!progressByUser.has(uid)) progressByUser.set(uid, new Set())
      progressByUser.get(uid).add(key)
      const prev = lastWatchedByUser.get(uid)
      if (!prev || p.updatedAt > prev) lastWatchedByUser.set(uid, p.updatedAt)
    })

    // 5) สร้างรายการนักเรียน + คำนวณ %
    const result = users.map(u => {
      const uid = String(u._id)
      const userActs = activations.filter(a => String(a.userId) === uid)
      const userPkgs = userActs.map(a => packages.find(p => String(p._id) === String(a.packageId))).filter(Boolean)

      // รวม section slots ทั้งหมดของ user นี้
      const allSlots = []
      const topicSlotsMap = new Map() // key: `${sectionId}::${topic}` → { total, watched }

      for (const pkg of userPkgs) {
        for (const sid of (pkg.sections || [])) {
          const section = sectionMap.get(String(sid))
          if (!section) continue
          const slots = extractSlots(section)
          slots.forEach(sl => {
            allSlots.push({ sectionId: String(sid), ...sl })
            const topicKey = `${sid}::${sl.topic || '_'}`
            if (!topicSlotsMap.has(topicKey)) {
              topicSlotsMap.set(topicKey, { sectionName: section.name, topic: sl.topic || '(no topic)', total: 0, watched: 0 })
            }
            topicSlotsMap.get(topicKey).total++
          })
        }
      }

      const watchedSet = progressByUser.get(uid) || new Set()
      let watchedCount = 0
      for (const sl of allSlots) {
        const key = `${sl.sectionId}:${sl.videoIndex}:${sl.isBonus ? 1 : 0}`
        if (watchedSet.has(key)) {
          watchedCount++
          const topicKey = `${sl.sectionId}::${sl.topic || '_'}`
          const t = topicSlotsMap.get(topicKey)
          if (t) t.watched++
        }
      }

      // topics ที่จบครบ
      const completedTopics = []
      for (const t of topicSlotsMap.values()) {
        if (t.total > 0 && t.watched >= t.total) {
          completedTopics.push({ section: t.sectionName, topic: t.topic })
        }
      }

      const total = allSlots.length
      const percent = total > 0 ? Math.round((watchedCount / total) * 100) : 0

      return {
        userId: uid,
        name: u.name || u.lineDisplayName || '(ไม่มีชื่อ)',
        email: u.email || '',
        packages: userPkgs.map(p => ({ id: String(p._id), title: p.title })),
        totalVideos: total,
        watchedVideos: watchedCount,
        percent,
        completedTopicCount: completedTopics.length,
        completedTopics,
        lastWatchedAt: lastWatchedByUser.get(uid) || null
      }
    })

    // sort
    if (sort === 'percent') result.sort((a, b) => a.percent - b.percent) // น้อยขึ้นก่อน = คนต้องกระตุ้น
    else if (sort === 'percent_desc') result.sort((a, b) => b.percent - a.percent)
    else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'th'))
    else if (sort === 'lastWatched') result.sort((a, b) => {
      const at = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0
      const bt = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0
      return bt - at
    })

    res.json({ ok: true, count: result.length, students: result })
  } catch (err) {
    console.error('[progress.admin] overview error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

/**
 * GET /api/admin/progress/student/:userId
 * ดู detail รายคน — section ไหน / topic ไหน / video ไหนบ้าง
 */
router.get('/student/:userId', async (req, res) => {
  try {
    const uid = req.params.userId
    const user = await User.findById(uid).select('_id name email lineDisplayName').lean()
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' })

    const activations = await Activation.find({ userId: uid, isActive: true }).lean()
    const pkgIds = activations.map(a => a.packageId)
    const packages = await Package.find({ _id: { $in: pkgIds } }).lean()
    const sectionIds = packages.flatMap(p => (p.sections || []))
    const sections = await Section.find({ _id: { $in: sectionIds } }).lean()
    const progresses = await WatchProgress.find({ userId: uid, watched: true }).lean()

    const watchedSet = new Set(progresses.map(p => `${p.sectionId}:${p.videoIndex}:${p.isBonus ? 1 : 0}`))

    const detail = sections.map(section => {
      const slots = extractSlots(section)
      const byTopic = new Map()
      slots.forEach(sl => {
        const key = sl.topic || '(no topic)'
        if (!byTopic.has(key)) byTopic.set(key, { topic: key, videos: [] })
        const watched = watchedSet.has(`${section._id}:${sl.videoIndex}:${sl.isBonus ? 1 : 0}`)
        byTopic.get(key).videos.push({ videoIndex: sl.videoIndex, isBonus: sl.isBonus, watched })
      })
      const topics = [...byTopic.values()].map(t => ({
        topic: t.topic,
        total: t.videos.length,
        watched: t.videos.filter(v => v.watched).length,
        completed: t.videos.length > 0 && t.videos.every(v => v.watched),
        videos: t.videos
      }))
      return {
        sectionId: String(section._id),
        sectionName: section.name,
        totalVideos: slots.length,
        watchedVideos: slots.filter(sl => watchedSet.has(`${section._id}:${sl.videoIndex}:${sl.isBonus ? 1 : 0}`)).length,
        topics
      }
    })

    res.json({ ok: true, user, activations: activations.map(a => ({ packageId: a.packageId, activatedAt: a.activatedAt, expiresAt: a.expiresAt })), sections: detail })
  } catch (err) {
    console.error('[progress.admin] student error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
