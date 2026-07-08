/**
 * Content Admin Controller — CRUD sections + packages + Bunny video utils
 */
const Section = require('./Section.model')
const Package = require('./Package.model')
const Activation = require('../activation/Activation.model')
const { getSignedEmbedUrl, getDemoEmbedUrl, bunnyConfig } = require('../../shared/config/bunny')
const { getClient } = require('../../shared/config/valkey')
const ViewerAnomaly = require('./ViewerAnomaly.model')
const WatermarkConfig = require('./WatermarkConfig.model')
const ClientLog = require('./ClientLog.model')
const crypto = require('crypto')

// ─── helper: gen stable id สำหรับ topic/subtopic ───
// ใช้ตอน save section → กัน rename ทำ Self Check binding หาย
function genStableId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`
}

// รักษา topicId/subtopicId เดิมจาก existing + auto-gen ตัวใหม่
// กฎ: group video ตาม `topic` (name) — ถ้า name เดียวกันใน section นี้ → ใช้ topicId เดียวกัน
function ensureTopicIds(newVideos, existingVideos) {
  // 1. สร้าง map ชื่อ → id จาก existing
  const topicNameToId = {}
  const subKeyToId = {}    // key = "topic|subtopic"
  for (const v of (existingVideos || [])) {
    const t = (v.topic || '').trim()
    const s = (v.subtopic || '').trim()
    if (t && v.topicId && !topicNameToId[t]) topicNameToId[t] = v.topicId
    if (t && s && v.subtopicId && !subKeyToId[`${t}|${s}`]) subKeyToId[`${t}|${s}`] = v.subtopicId
  }
  // 2. assign id ให้ทุก video ใหม่
  for (const v of newVideos) {
    const t = (v.topic || '').trim()
    const s = (v.subtopic || '').trim()
    if (t) {
      if (!topicNameToId[t]) topicNameToId[t] = genStableId('tpc')
      v.topicId = topicNameToId[t]
    } else {
      v.topicId = ''
    }
    if (t && s) {
      const k = `${t}|${s}`
      if (!subKeyToId[k]) subKeyToId[k] = genStableId('sub')
      v.subtopicId = subKeyToId[k]
    } else {
      v.subtopicId = ''
    }
  }
}

// ═══════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════

exports.getAllSections = async (req, res, next) => {
  try {
    const sections = await Section.find()
      .sort('order code')
      .lean()

    // เพิ่ม videoCount ให้แต่ละ section
    const result = sections.map(s => ({
      ...s,
      videoCount: s.videos ? s.videos.length : 0
    }))

    res.json({ sections: result })
  } catch (error) {
    next(error)
  }
}

exports.getSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).lean()
    if (!section) {
      return res.status(404).json({ message: 'ไม่พบ Section' })
    }
    res.json({ section })
  } catch (error) {
    next(error)
  }
}

exports.createSection = async (req, res, next) => {
  try {
    if (req.body.videos) ensureTopicIds(req.body.videos, [])
    const section = await Section.create(req.body)
    res.status(201).json({ section })
  } catch (error) {
    next(error)
  }
}

exports.updateSection = async (req, res, next) => {
  try {
    // รักษา fields สำคัญจาก video เดิม (PDF + DRM) + assign stable topicId/subtopicId
    if (req.body.videos) {
      const existing = await Section.findById(req.params.id).lean()
      if (existing?.videos) {
        const preserveMap = {}
        for (const v of existing.videos) {
          if (v.bunnyVideoId) {
            preserveMap[v.bunnyVideoId] = {
              pdfFileUrl: v.pdfFileUrl,
              pdfFileName: v.pdfFileName,
              pdfFile: v.pdfFile,
              bunnyDrmVideoId: v.bunnyDrmVideoId,
              bonusBunnyDrmVideoId: v.bonusBunnyDrmVideoId
            }
          }
        }
        for (const v of req.body.videos) {
          if (v.bunnyVideoId && preserveMap[v.bunnyVideoId]) {
            const saved = preserveMap[v.bunnyVideoId]
            if (v.pdfFileUrl === undefined) v.pdfFileUrl = saved.pdfFileUrl
            if (v.pdfFileName === undefined) v.pdfFileName = saved.pdfFileName
            if (v.pdfFile === undefined) v.pdfFile = saved.pdfFile
            if (v.bunnyDrmVideoId === undefined) v.bunnyDrmVideoId = saved.bunnyDrmVideoId
            if (v.bonusBunnyDrmVideoId === undefined) v.bonusBunnyDrmVideoId = saved.bonusBunnyDrmVideoId
          }
        }
      }
      // ─── auto-gen + preserve topicId/subtopicId (stable ids for Self Check) ───
      ensureTopicIds(req.body.videos, existing?.videos)
    }

    // Cleanup topicPdfMap / subtopicPdfMap — ลบ topic/subtopic ที่ไม่มี video อยู่แล้ว
    // + Auto-unlink Topic PDF ถ้า topic นั้นมี subtopic ลูก (กฎ tier system)
    if (req.body.videos) {
      const activeTopics = new Set(req.body.videos.map(v => (v.topic || '').trim()).filter(Boolean))
      const activeSubs = new Set(req.body.videos.map(v => (v.subtopic || '').trim()).filter(Boolean))

      // Topic ที่มี subtopic ลูก — ไม่อนุญาตให้มี Topic PDF
      const topicsWithSub = new Set()
      for (const v of req.body.videos) {
        const t = (v.topic || '').trim()
        const s = (v.subtopic || '').trim()
        if (t && s) topicsWithSub.add(t)
      }

      const existing = await Section.findById(req.params.id).lean()
      // ใช้ body.topicPdfMap ถ้าส่งมา ไม่ส่ง ใช้ existing
      const baseTopicPdfMap = req.body.topicPdfMap || (existing?.topicPdfMap
        ? (existing.topicPdfMap instanceof Map ? Object.fromEntries(existing.topicPdfMap) : existing.topicPdfMap)
        : {})
      const baseSubPdfMap = req.body.subtopicPdfMap || (existing?.subtopicPdfMap
        ? (existing.subtopicPdfMap instanceof Map ? Object.fromEntries(existing.subtopicPdfMap) : existing.subtopicPdfMap)
        : {})

      const cleanedTopic = {}
      for (const [k, v] of Object.entries(baseTopicPdfMap)) {
        // ลบถ้า topic ไม่มี video เหลือ หรือ topic นี้มี subtopic ลูก
        if (activeTopics.has(k) && !topicsWithSub.has(k)) cleanedTopic[k] = v
      }
      req.body.topicPdfMap = cleanedTopic

      const cleanedSub = {}
      for (const [k, v] of Object.entries(baseSubPdfMap)) {
        if (activeSubs.has(k)) cleanedSub[k] = v
      }
      req.body.subtopicPdfMap = cleanedSub
    }

    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!section) {
      return res.status(404).json({ message: 'ไม่พบ Section' })
    }
    res.json({ section })
  } catch (error) {
    next(error)
  }
}

exports.cloneSection = async (req, res, next) => {
  try {
    const { newCode, newName } = req.body || {}
    if (!newCode || !newCode.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุ code ใหม่' })
    }

    const src = await Section.findById(req.params.id).lean()
    if (!src) return res.status(404).json({ message: 'ไม่พบ Section ต้นทาง' })

    const targetCode = String(newCode).trim().toUpperCase()
    const exists = await Section.findOne({ code: targetCode })
    if (exists) return res.status(409).json({ message: `มี Section code "${targetCode}" อยู่แล้ว` })

    const last = await Section.findOne().sort({ order: -1 }).select('order').lean()
    const nextOrder = (last?.order || 0) + 1

    // ลอกทุก field รวม videos + topicPdfMap + subtopicPdfMap + PDF refs ทุก video
    const data = { ...src }
    delete data._id
    delete data.createdAt
    delete data.updatedAt
    delete data.__v
    data.code = targetCode
    data.name = (newName && newName.trim()) || targetCode
    data.order = nextOrder

    const clone = await Section.create(data)
    res.status(201).json({ section: clone })
  } catch (error) {
    next(error)
  }
}

exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id)
    if (!section) {
      return res.status(404).json({ message: 'ไม่พบ Section' })
    }
    // ลบ PDF จาก Bunny Storage (ถ้ามี)
    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    if (storageZone && storageKey && section.videos) {
      for (const vid of section.videos) {
        if (vid.pdfFileUrl) {
          const fn = vid.pdfFileUrl.split('/').pop()
          fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${fn}`, {
            method: 'DELETE', headers: { 'AccessKey': storageKey }
          }).catch(() => {})
        }
      }
    }
    res.json({ message: 'ลบ Section เรียบร้อย' })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// PACKAGES
// ═══════════════════════════════════════════════════

exports.getAllPackages = async (req, res, next) => {
  try {
    // Package + Section อยู่ lmsConn เดียวกัน → populate ได้ตรง
    const packages = await Package.find()
      .populate({
        path: 'sections',
        select: 'code name order videos'
      })
      .sort('order title')
      .lean()

    // นับนักเรียน/admin ที่ active per package
    const now = new Date()
    const activeActivations = await Activation.find({
      isActive: true,
      expiresAt: { $gt: now }
    }).select('userId packageId expiresAt').lean()

    // ดึง role ของ user ทั้งหมดที่มี activation
    const userIds = [...new Set(activeActivations.map(a => a.userId?.toString()).filter(Boolean))]
    const User = require('../user/User.model')
    const users = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).select('role').lean()
      : []
    const roleMap = new Map(users.map(u => [u._id.toString(), u.role || 'student']))

    // group by packageId
    const pkgStats = new Map()
    for (const a of activeActivations) {
      const pid = a.packageId?.toString()
      if (!pid) continue
      if (!pkgStats.has(pid)) pkgStats.set(pid, { students: 0, admins: 0, maxDaysLeft: 0 })
      const stat = pkgStats.get(pid)
      const role = roleMap.get(a.userId?.toString()) || 'student'
      if (role === 'admin') stat.admins++
      else stat.students++
      const daysLeft = Math.ceil((a.expiresAt - now) / 86400000)
      if (daysLeft > stat.maxDaysLeft) stat.maxDaysLeft = daysLeft
    }

    // Flat list + videoCount + stats
    const result = packages.map(p => {
      const stat = pkgStats.get(p._id.toString()) || { students: 0, admins: 0, maxDaysLeft: 0 }
      return {
        ...p,
        sections: (p.sections || []).map(s => ({
          _id: s._id,
          code: s.code,
          name: s.name,
          order: s.order,
          videoCount: s.videos ? s.videos.length : 0
        })),
        activeStudents: stat.students,
        activeAdmins: stat.admins,
        maxDaysLeft: stat.maxDaysLeft,
        hasActiveUsers: stat.students > 0
      }
    })

    res.json({ packages: result })
  } catch (error) {
    next(error)
  }
}

exports.getPackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate({
        path: 'sections',
        select: 'code name order'
      })
      .lean()
    if (!pkg) {
      return res.status(404).json({ message: 'ไม่พบ Package' })
    }
    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
}

exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body)
    res.status(201).json({ package: pkg })
  } catch (error) {
    next(error)
  }
}

exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!pkg) {
      return res.status(404).json({ message: 'ไม่พบ Package' })
    }
    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
}

exports.deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id)
    if (!pkg) {
      return res.status(404).json({ message: 'ไม่พบ Package' })
    }
    if (pkg.isDemo) {
      return res.status(403).json({ message: 'ไม่สามารถลบ Demo Package ได้' })
    }
    // ป้องกันลบเมื่อมีนักเรียนที่ยัง active
    const activeCount = await Activation.countDocuments({
      packageId: pkg._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    if (activeCount > 0) {
      return res.status(403).json({ message: `ไม่สามารถลบได้ — มีนักเรียน ${activeCount} คนยังเรียนอยู่` })
    }
    await pkg.deleteOne()
    res.json({ message: 'ลบ Package เรียบร้อย' })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// BUNNY VIDEO UTILS (Admin)
// ═══════════════════════════════════════════════════

/**
 * GET /admin/bunny/video/:videoId
 * ดึงข้อมูล video จาก Bunny Stream API (title, duration, status, thumbnail)
 */
exports.getBunnyVideoInfo = async (req, res, next) => {
  try {
    const { videoId } = req.params
    if (!bunnyConfig.apiKey) {
      return res.status(503).json({
        message: 'ยังไม่ได้ตั้งค่า BUNNY_API_KEY — ดึงข้อมูล video จาก Bunny ไม่ได้',
        hint: 'Bunny Dashboard → Stream → Library Settings → API → Access Key'
      })
    }
    if (!bunnyConfig.libraryId) {
      return res.status(500).json({ message: 'BUNNY_LIBRARY_ID ไม่ได้ตั้งค่า' })
    }

    const url = `https://video.bunnycdn.com/library/${bunnyConfig.libraryId}/videos/${videoId}`
    const resp = await fetch(url, {
      headers: { AccessKey: bunnyConfig.apiKey }
    })

    if (!resp.ok) {
      const text = await resp.text()
      // ห้าม forward 401/403 จาก Bunny ตรงๆ — frontend interceptor จะ auto-logout
      const safeStatus = (resp.status === 401 || resp.status === 403) ? 502 : resp.status
      return res.status(safeStatus).json({ message: `Bunny API error: ${resp.status} — ${text}` })
    }

    const data = await resp.json()
    res.json({
      videoId: data.guid,
      title: data.title,
      length: data.length,                     // duration in seconds
      durationMin: Math.round(data.length / 60), // duration in minutes (rounded)
      status: data.status,                      // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
      statusText: ['created', 'uploaded', 'processing', 'transcoding', 'finished', 'error'][data.status] || 'unknown',
      width: data.width,
      height: data.height,
      thumbnailUrl: `https://${bunnyConfig.cdnHostname}/${data.guid}/thumbnail.jpg`,
      dateUploaded: data.dateUploaded
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /admin/refresh-durations
 * ดึง duration จาก Bunny API แล้ว update ทุก video ใน DB ให้ตรง
 */
exports.refreshDurations = async (req, res, next) => {
  try {
    const libraryId = bunnyConfig.libraryId
    const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID
    const apiKey = bunnyConfig.apiKey
    const demoApiKey = process.env.BUNNY_DEMO_API_KEY || apiKey

    if (!apiKey && !demoApiKey) return res.status(503).json({ message: 'BUNNY API KEY ไม่ได้ตั้งค่า' })

    // map: libraryId → API key
    const keyMap = {}
    if (libraryId && apiKey) keyMap[libraryId] = apiKey
    if (demoLibId && demoApiKey) keyMap[demoLibId] = demoApiKey

    const sections = await Section.find().lean()
    let updated = 0
    let errors = []

    // ลอง fetch จากทั้ง 2 library (demo ก่อน เพราะ video ส่วนใหญ่อยู่ที่นี่)
    const libraries = [demoLibId, libraryId].filter(Boolean)

    for (const sec of sections) {
      let changed = false
      for (let i = 0; i < sec.videos.length; i++) {
        const vid = sec.videos[i]
        if (!vid.bunnyVideoId) continue

        // ลอง library ที่ video ระบุก่อน → ถ้าไม่ได้ ลองทุก library
        const tryLibs = vid.bunnyLibraryId ? [vid.bunnyLibraryId, ...libraries] : libraries
        let found = false
        for (const libId of [...new Set(tryLibs)]) {
          try {
            const url = `https://video.bunnycdn.com/library/${libId}/videos/${vid.bunnyVideoId}`
            const resp = await fetch(url, { headers: { AccessKey: keyMap[libId] || demoApiKey || apiKey } })
            if (!resp.ok) continue
            const data = await resp.json()
            if (data.length != null && data.length > 0) {
              const mins = Math.floor(data.length / 60)
              const secs = Math.round(data.length % 60)
              const duration = `${mins}:${String(secs).padStart(2, '0')}`
              if (vid.duration !== duration) {
                sec.videos[i].duration = duration
                changed = true
                updated++
              }
              found = true
              break
            }
          } catch { /* try next library */ }
        }
        if (!found) {
          errors.push({ section: sec.code, video: vid.title, error: 'ไม่เจอในทุก library' })
        }

        // Bonus video duration
        if (vid.bonusBunnyVideoId) {
          const bonusTryLibs = vid.bunnyLibraryId ? [vid.bunnyLibraryId, ...libraries] : libraries
          let bonusFound = false
          for (const libId of [...new Set(bonusTryLibs)]) {
            try {
              const url = `https://video.bunnycdn.com/library/${libId}/videos/${vid.bonusBunnyVideoId}`
              const resp = await fetch(url, { headers: { AccessKey: keyMap[libId] || demoApiKey || apiKey } })
              if (!resp.ok) continue
              const data = await resp.json()
              if (data.length != null && data.length > 0) {
                const mins = Math.floor(data.length / 60)
                const secs = Math.round(data.length % 60)
                const duration = `${mins}:${String(secs).padStart(2, '0')}`
                if (vid.bonusDuration !== duration) {
                  sec.videos[i].bonusDuration = duration
                  changed = true
                  updated++
                }
                bonusFound = true
                break
              }
            } catch { /* try next library */ }
          }
          if (!bonusFound) {
            errors.push({ section: sec.code, video: `${vid.title} (bonus)`, error: 'ไม่เจอในทุก library' })
          }
        }
      }
      if (changed) {
        await Section.findByIdAndUpdate(sec._id, { videos: sec.videos })
      }
    }

    res.json({ ok: true, updated, total: sections.reduce((sum, s) => sum + s.videos.length, 0), errors })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/bunny/video/:videoId/embed
 * สร้าง signed embed URL สำหรับ admin preview
 */
exports.getBunnyVideoEmbed = async (req, res, next) => {
  try {
    const embedUrl = getDemoEmbedUrl(req.params.videoId)
    if (!embedUrl) {
      return res.status(500).json({ message: 'Bunny config ไม่ครบ (LIBRARY_ID / SECURITY_KEY)' })
    }
    res.json({ embedUrl })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// DEMO / TRIAL (Bunny Demo Library 628424)
// ═══════════════════════════════════════════════════

const DEMO_LIBRARY_ID = process.env.BUNNY_DEMO_LIBRARY_ID || '628424'

/**
 * GET /admin/demo/section
 * ดึง demo section (มีได้ 1 section — ทดลองเรียน)
 */
exports.getDemoSection = async (req, res, next) => {
  try {
    const section = await Section.findOne({ bunnyLibraryId: DEMO_LIBRARY_ID }).lean()
    res.json({ section: section || null })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /admin/demo/section
 * สร้างหรืออัปเดต demo section (upsert)
 */
exports.upsertDemoSection = async (req, res, next) => {
  try {
    const { name, description, videos } = req.body
    let section = await Section.findOne({ bunnyLibraryId: DEMO_LIBRARY_ID })

    if (section) {
      section.name = name || section.name
      section.description = description !== undefined ? description : section.description
      section.videos = videos || section.videos
      await section.save()
    } else {
      section = await Section.create({
        code: 'DEMO-TRIAL',
        name: name || 'ทดลองเรียนฟรี',
        description: description || 'วีดีโอทดลองเรียนจาก MedNinja',
        bunnyLibraryId: DEMO_LIBRARY_ID,
        order: 999,
        videos: videos || []
      })
    }

    res.json({ section })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/demo/bunny/video/:videoId
 * ดึงข้อมูล video จาก Demo Library (628424)
 */
exports.getDemoBunnyVideoInfo = async (req, res, next) => {
  try {
    const { videoId } = req.params
    const apiKey = process.env.BUNNY_DEMO_API_KEY || process.env.BUNNY_API_KEY
    if (!apiKey) {
      return res.status(503).json({ message: 'BUNNY_DEMO_API_KEY ไม่ได้ตั้งค่า' })
    }

    const url = `https://video.bunnycdn.com/library/${DEMO_LIBRARY_ID}/videos/${videoId}`
    const resp = await fetch(url, { headers: { AccessKey: apiKey } })

    if (!resp.ok) {
      const text = await resp.text()
      const safeStatus = (resp.status === 401 || resp.status === 403) ? 502 : resp.status
      return res.status(safeStatus).json({ message: `Bunny API error: ${resp.status} — ${text}` })
    }

    const data = await resp.json()
    const mins = Math.floor(data.length / 60)
    const secs = data.length % 60
    res.json({
      videoId: data.guid,
      title: data.title,
      length: data.length,
      duration: `${mins}:${String(secs).padStart(2, '0')}`,
      status: data.status,
      statusText: ['created', 'uploaded', 'processing', 'transcoding', 'finished', 'error'][data.status] || 'unknown'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/bunny/video-names
 * ดึงชื่อไฟล์ทั้ง 2 library (DRM 626874 + no-DRM 628424) เป็น map UUID → title
 */
exports.getBunnyVideoNames = async (req, res, next) => {
  try {
    const drmApiKey = bunnyConfig.apiKey
    const demoApiKey = process.env.BUNNY_DEMO_API_KEY || bunnyConfig.apiKey
    const drmLibId = bunnyConfig.libraryId
    const demoLibId = DEMO_LIBRARY_ID

    async function fetchAll(libId, apiKey) {
      const map = {}
      let page = 1, totalPages = 1
      while (page <= totalPages) {
        const resp = await fetch(`https://video.bunnycdn.com/library/${libId}/videos?page=${page}&itemsPerPage=100`, {
          headers: { AccessKey: apiKey }
        })
        if (!resp.ok) break
        const data = await resp.json()
        for (const v of (data.items || [])) {
          const m = Math.floor(v.length / 60)
          const s = v.length % 60
          map[v.guid] = { title: v.title, duration: `${m}:${String(s).padStart(2, '0')}` }
        }
        totalPages = Math.ceil((data.totalItems || 0) / 100)
        page++
      }
      return map
    }

    const [drm, noDrm] = await Promise.all([
      fetchAll(drmLibId, drmApiKey),
      fetchAll(demoLibId, demoApiKey)
    ])

    res.json({ drm, noDrm })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /admin/bunny/video/:videoId/rename
 * เปลี่ยนชื่อไฟล์บน Bunny — รับ { title, library } (library = 'drm' | 'noDrm')
 */
exports.renameBunnyVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params
    const { title, library } = req.body
    if (!title) return res.status(400).json({ message: 'title is required' })

    const isDrm = library === 'drm'
    const libId = isDrm ? bunnyConfig.libraryId : DEMO_LIBRARY_ID
    const apiKey = isDrm ? bunnyConfig.apiKey : (process.env.BUNNY_DEMO_API_KEY || bunnyConfig.apiKey)

    const resp = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${videoId}`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    })

    if (!resp.ok) {
      const text = await resp.text()
      const safeStatus = (resp.status === 401 || resp.status === 403) ? 502 : resp.status
      return res.status(safeStatus).json({ message: `Bunny API error: ${resp.status} — ${text}` })
    }

    res.json({ success: true, title })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/demo/config
 * ดึง demo config (package ID สำหรับ auto-assign, duration วัน)
 */
exports.getDemoConfig = async (req, res, next) => {
  try {
    const section = await Section.findOne({ bunnyLibraryId: DEMO_LIBRARY_ID }).select('_id').lean()
    const pkg = section
      ? await Package.findOne({ sections: section._id }).lean()
      : null
    res.json({
      sectionId: section?._id || null,
      packageId: pkg?._id || null,
      packageTitle: pkg?.title || null,
      demoLibraryId: DEMO_LIBRARY_ID
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /admin/demo/setup-package
 * สร้าง demo package (ถ้ายังไม่มี) ผูกกับ demo section
 */
exports.setupDemoPackage = async (req, res, next) => {
  try {
    const section = await Section.findOne({ bunnyLibraryId: DEMO_LIBRARY_ID })
    if (!section) {
      return res.status(400).json({ message: 'กรุณาสร้าง Demo Section ก่อน' })
    }

    let pkg = await Package.findOne({ sections: section._id })
    if (!pkg) {
      pkg = await Package.create({
        title: 'ทดลองเรียนฟรี 30 วัน',
        description: 'แพ็คเกจทดลองเรียน — ได้รับอัตโนมัติเมื่อสมัครสมาชิก',
        durationDays: 30,
        price: 0,
        sections: [section._id],
        isPublished: true
      })
    }

    res.json({ package: pkg })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /admin/demo/assign-visa
 * ให้ VISA ทดลองให้ admin ตัวเอง (30 วัน)
 */
exports.assignAdminVisa = async (req, res, next) => {
  try {
    const section = await Section.findOne({ bunnyLibraryId: DEMO_LIBRARY_ID }).select('_id').lean()
    if (!section) return res.status(400).json({ message: 'ยังไม่มี Demo Section' })

    const pkg = await Package.findOne({ sections: section._id }).lean()
    if (!pkg) return res.status(400).json({ message: 'ยังไม่มี Demo Package — กด "สร้าง Package อัตโนมัติ" ก่อน' })

    // เช็คว่ามี VISA อยู่แล้วหรือยัง
    const existing = await Activation.findOne({
      userId: req.user._id,
      packageId: pkg._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    if (existing) {
      return res.json({ message: 'คุณมี VISA ทดลองอยู่แล้ว (ยังไม่หมดอายุ)' })
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + (pkg.durationDays || 30))
    await Activation.create({
      userId: req.user._id,
      packageId: pkg._id,
      expiresAt: expires,
      isActive: true,
      activatedBy: req.user._id,
      note: 'Admin: VISA ทดลองเรียน'
    })

    res.json({ message: 'ให้ VISA ทดลอง 30 วันสำเร็จ' })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// WATERMARK CONFIG
// ═══════════════════════════════════════════════════

exports.getWatermarkConfig = async (req, res, next) => {
  try {
    let config = await WatermarkConfig.findOne({ key: 'default' }).lean()
    if (!config) {
      config = await WatermarkConfig.create({ key: 'default' })
      config = config.toObject()
    }
    delete config._id
    delete config.__v
    delete config.key
    res.json({ config })
  } catch (error) {
    next(error)
  }
}

exports.updateWatermarkConfig = async (req, res, next) => {
  try {
    const modes = [
      'mobilePortrait', 'mobileLandscape', 'mobilePortraitFull', 'mobileLandscapeFull',
      'desktopPortrait', 'desktopLandscape', 'desktopPortraitFull', 'desktopLandscapeFull',
      'demoMobilePortrait', 'demoMobileLandscape', 'demoMobilePortraitFull', 'demoMobileLandscapeFull',
      'demoDesktopPortrait', 'demoDesktopLandscape', 'demoDesktopPortraitFull', 'demoDesktopLandscapeFull',
      'desktopInMobile', 'demoDesktopInMobile'
    ]
    const updates = {}
    for (const mode of modes) {
      if (req.body[mode]) {
        const { style, fontSize } = req.body[mode]
        if (style && ['grid', 'center'].includes(style)) updates[`${mode}.style`] = style
        if (fontSize && fontSize >= 8 && fontSize <= 60) updates[`${mode}.fontSize`] = fontSize
      }
    }
    // Breakpoints
    const bpFields = ['desktopBreakpoint', 'demoDesktopBreakpoint', 'desktopModeScreenWidth', 'centerBaseWidth', 'gridBaseWidth']
    for (const f of bpFields) {
      if (req.body[f] >= 400 && req.body[f] <= 2000) updates[f] = req.body[f]
    }
    const config = await WatermarkConfig.findOneAndUpdate(
      { key: 'default' },
      { $set: updates },
      { new: true, upsert: true }
    ).lean()
    delete config._id
    delete config.__v
    delete config.key
    res.json({ config })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// ACTIVE VIEWERS + ANOMALY LOG
// ═══════════════════════════════════════════════════

exports.getActiveViewers = async (req, res) => {
  try {
    const ActiveViewer = require('./ActiveViewer.model')
    const ViewerTab = require('./ViewerTab.model')
    const now = Date.now()

    // ดึง active viewers (1 ต่อ user — tab ที่กำลังเล่น)
    const actives = await ActiveViewer.find().lean()

    // นับจำนวน blocked tabs ต่อ user (ส่ง heartbeat ใน 45s ล่าสุด)
    const cutoff = new Date(now - 45000)
    const blockedCounts = await ViewerTab.aggregate([
      { $match: { status: 'blocked', updatedAt: { $gte: cutoff } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ])
    const blockedMap = new Map(blockedCounts.map(b => [b._id.toString(), b.count]))

    const viewers = actives.map(d => {
      const uid = d.userId.toString()
      const blockedTabs = blockedMap.get(uid) || 0
      return {
        userId: uid,
        userName: d.userName,
        userEmail: d.userEmail,
        videoTitle: d.videoTitle || '(กำลังโหลด)',
        sectionName: d.sectionName || '',
        os: d.os,
        browser: d.browser,
        currentTime: d.currentTime || 0,
        videoDuration: d.videoDuration || 0,
        isPlaying: d.isPlaying || false,
        playerError: d.playerError || '',
        appVersion: d.appVersion || '',
        liveId: d.liveId || '',
        ago: Math.round((now - new Date(d.updatedAt).getTime()) / 1000),
        status: 'watching',
        blockedTabs,
        totalTabs: 1 + blockedTabs
      }
    })

    // คนที่มี blocked tabs ขึ้นก่อน
    viewers.sort((a, b) => b.blockedTabs - a.blockedTabs || a.ago - b.ago)

    res.json({ viewers })
  } catch (error) {
    res.json({ viewers: [], error: error.message })
  }
}

/**
 * POST /admin/viewers/:userId/kick — เตะ viewer ออกจากหน้า video
 */
exports.kickViewer = async (req, res, next) => {
  try {
    const ActiveViewer = require('./ActiveViewer.model')
    const result = await ActiveViewer.findOneAndUpdate(
      { userId: req.params.userId },
      { kicked: true }
    )
    if (!result) return res.status(404).json({ message: 'ไม่พบ viewer' })
    res.json({ ok: true })
  } catch (error) { next(error) }
}

/**
 * POST /admin/viewers/kick-all — เตะ viewer ทุกคนออก
 */
exports.kickAllViewers = async (req, res, next) => {
  try {
    const ActiveViewer = require('./ActiveViewer.model')
    const result = await ActiveViewer.updateMany({}, { kicked: true })
    res.json({ ok: true, count: result.modifiedCount || 0 })
  } catch (error) { next(error) }
}

exports.getAnomalyLog = async (req, res, next) => {
  try {
    const logs = await ViewerAnomaly.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    res.json({ logs })
  } catch (error) {
    next(error)
  }
}

// ═══════════════════════════════════════════════════
// DEMO WEB VIDEO SETTINGS (DemoConfig)
// ═══════════════════════════════════════════════════

const DemoConfig = require('../demo/DemoConfig.model')

/**
 * GET /admin/demo-web — ดึง demo web video config
 */
exports.getDemoWebConfig = async (req, res, next) => {
  try {
    let config = await DemoConfig.findOne({ key: 'demo' }).lean()
    if (!config) {
      config = await DemoConfig.create({ key: 'demo', videos: [] })
      config = config.toObject()
    }
    res.json({ config })
  } catch (error) { next(error) }
}

/**
 * PUT /admin/demo-web — อัปเดต demo web video config
 */
exports.updateDemoWebConfig = async (req, res, next) => {
  try {
    const { sectionName, sectionDescription, videos } = req.body
    const update = {}
    if (sectionName !== undefined) update.sectionName = sectionName
    if (sectionDescription !== undefined) update.sectionDescription = sectionDescription
    if (videos !== undefined) update.videos = videos

    const config = await DemoConfig.findOneAndUpdate(
      { key: 'demo' },
      update,
      { new: true, upsert: true }
    ).lean()
    res.json({ config })
  } catch (error) { next(error) }
}

/**
 * POST /admin/demo-web/sync-durations — ดึง duration จาก Bunny
 */
exports.syncDemoWebDurations = async (req, res, next) => {
  try {
    const config = await DemoConfig.findOne({ key: 'demo' })
    if (!config) return res.json({ ok: false, message: 'ไม่มี config' })

    const libId = process.env.BUNNY_DEMO_LIBRARY_ID || bunnyConfig.libraryId
    const demoKey = process.env.BUNNY_DEMO_API_KEY || bunnyConfig.apiKey
    let updated = 0

    for (const vid of config.videos) {
      if (!vid.bunnyVideoId) continue
      try {
        const resp = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${vid.bunnyVideoId}`, {
          headers: { AccessKey: demoKey }
        })
        if (resp.ok) {
          const data = await resp.json()
          if (data.length > 0) {
            const mins = Math.floor(data.length / 60)
            const secs = Math.round(data.length % 60)
            vid.duration = `${mins}:${String(secs).padStart(2, '0')}`
            updated++
          }
        }
      } catch { /* ignore */ }
    }
    await config.save()
    res.json({ ok: true, updated })
  } catch (error) { next(error) }
}

/**
 * GET /admin/anomaly-report — สรุปรายงานความผิดปกติอัตโนมัติ
 * Aggregate client logs วันนี้ → สรุปเป็นรายงานต่อ user
 */
exports.getAnomalyReport = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Aggregate: group by userId + type → count
    const pipeline = [
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { userId: '$userId', type: '$type' },
        userName: { $first: '$userName' },
        userEmail: { $first: '$userEmail' },
        count: { $sum: 1 },
        lastOs: { $last: '$os' },
        lastBrowser: { $last: '$browser' },
        lastDetail: { $last: '$message' },
        lastAt: { $max: '$createdAt' }
      }},
      { $sort: { count: -1 } }
    ]
    const raw = await ClientLog.aggregate(pipeline)

    // สร้างรายงานต่อ user
    const userMap = new Map()
    for (const r of raw) {
      const uid = r._id.userId?.toString() || 'unknown'
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          userId: uid,
          userName: r.userName || '-',
          userEmail: r.userEmail || '-',
          alerts: [],
          severity: 'low' // low, medium, high
        })
      }
      const user = userMap.get(uid)
      const type = r._id.type
      const count = r.count

      // สร้าง alert ตามประเภท
      if (type === 'devtools' && count >= 1) {
        user.alerts.push({
          type: 'devtools',
          icon: '🔧',
          message: `เปิด DevTools ${count} ครั้ง`,
          detail: `${r.lastOs} · ${r.lastBrowser}`,
          count,
          lastAt: r.lastAt,
          severity: count >= 3 ? 'high' : 'medium'
        })
      }
      if (type === 'replaced' && count >= 2) {
        user.alerts.push({
          type: 'share',
          icon: '🚫',
          message: `ถูก block ${count} ครั้ง (อาจ share account)`,
          detail: r.lastDetail || '',
          count,
          lastAt: r.lastAt,
          severity: count >= 5 ? 'high' : 'medium'
        })
      }
      if (type === 'video_error') {
        user.alerts.push({
          type: 'video_error',
          icon: '⚠️',
          message: `Video error ${count} ครั้ง`,
          detail: r.lastDetail || '',
          count,
          lastAt: r.lastAt,
          severity: count >= 3 ? 'medium' : 'low'
        })
      }
      if (type === 'error' && count >= 2) {
        user.alerts.push({
          type: 'error',
          icon: '❌',
          message: `Error ${count} ครั้ง`,
          detail: r.lastDetail || '',
          count,
          lastAt: r.lastAt,
          severity: count >= 5 ? 'high' : 'medium'
        })
      }
    }

    // คำนวณ severity สูงสุดของแต่ละ user
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const reports = Array.from(userMap.values())
      .filter(u => u.alerts.length > 0)
      .map(u => {
        u.severity = u.alerts.reduce((max, a) => severityOrder[a.severity] > severityOrder[max] ? a.severity : max, 'low')
        return u
      })
      .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])

    res.json({ reports, hours })
  } catch (error) {
    next(error)
  }
}

exports.resolveAnomaly = async (req, res, next) => {
  try {
    await ViewerAnomaly.findByIdAndUpdate(req.params.id, { resolved: true })
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/client-logs — ดู client error/behavior logs
 */
exports.getClientLogs = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type
    if (req.query.resolved === 'false') filter.resolved = false
    const logs = await ClientLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    res.json({ logs })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /admin/client-logs/:id/resolve
 */
exports.resolveClientLog = async (req, res, next) => {
  try {
    await ClientLog.findByIdAndUpdate(req.params.id, { resolved: true })
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/live-debug/timeline — ดู timeline event ของ user คน 1 ในการดู live
 * Query: userId, liveId (optional), limit (default 200)
 */
exports.liveDebugTimeline = async (req, res, next) => {
  try {
    const filter = { type: 'live_event' }
    if (req.query.userId) filter.userId = req.query.userId
    if (req.query.liveId) filter.liveId = req.query.liveId
    if (req.query.tabId) filter.tabId = req.query.tabId
    if (req.query.event) filter.event = req.query.event
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000)
    const events = await ClientLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('userName userEmail event message detail liveId tabId currentTime bufferedEnd isPlaying liveReady needUnmute wsConnected errorCount os browser createdAt')
      .lean()
    res.json({ count: events.length, events: events.reverse() })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/live-debug/now — ดูทุกคนที่ดู live อยู่ตอนนี้ + state ล่าสุด
 * Query: liveId (optional), minutes (default 5)
 */
exports.liveDebugNow = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - (parseInt(req.query.minutes) || 5) * 60 * 1000)
    const match = { type: 'live_event', createdAt: { $gte: since } }
    if (req.query.liveId) match.liveId = req.query.liveId

    // group by user → เอา event ล่าสุด
    const users = await ClientLog.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          lastEvent: { $first: '$event' },
          lastMessage: { $first: '$message' },
          currentTime: { $first: '$currentTime' },
          bufferedEnd: { $first: '$bufferedEnd' },
          isPlaying: { $first: '$isPlaying' },
          liveReady: { $first: '$liveReady' },
          needUnmute: { $first: '$needUnmute' },
          wsConnected: { $first: '$wsConnected' },
          errorCount: { $first: '$errorCount' },
          os: { $first: '$os' },
          browser: { $first: '$browser' },
          lastSeen: { $first: '$createdAt' },
          totalEvents: { $sum: 1 }
      }},
      { $sort: { lastSeen: -1 } }
    ])
    res.json({ count: users.length, users })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /admin/live-debug/errors — เฉพาะคนที่มี error / stuck / iframe_reload
 * Query: hours (default 1)
 */
exports.liveDebugErrors = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - (parseInt(req.query.hours) || 1) * 60 * 60 * 1000)
    const events = await ClientLog.find({
      type: 'live_event',
      event: { $in: ['error', 'stuck', 'iframe_reload', 'init_failed', 'autoplay_blocked', 'ws_disconnect', 'pause_retry_exceeded'] },
      createdAt: { $gte: since }
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('userName userEmail event message detail liveId tabId currentTime errorCount os browser createdAt')
      .lean()
    res.json({ count: events.length, events })
  } catch (error) {
    next(error)
  }
}
