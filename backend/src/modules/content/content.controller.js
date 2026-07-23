/**
 * Content Controller — Student endpoints
 * ดึง section + video สำหรับนักเรียนที่มีสิทธิ์เข้าถึง
 */
const Section = require('./Section.model')
const Activation = require('../activation/Activation.model')
const ConsentLog = require('../activation/ConsentLog.model')
const { CURRENT_TERMS_VERSION } = require('../activation/activation.controller')
const Package = require('./Package.model')
const { getSignedEmbedUrl, getDemoEmbedUrl } = require('../../shared/config/bunny')
const { resolveVideos } = require('./video-content.resolver')
const ClientLog = require('./ClientLog.model')
const ActiveViewer = require('./ActiveViewer.model')
const ViewerTab = require('./ViewerTab.model')
const { logActivity, getIp, parseUA } = require('../activity/activity.service')


/**
 * GET /api/my/sections/:id
 * ดู video list ใน section (ไม่ส่ง bunnyVideoId — ส่งแค่ title + duration + order)
 */
exports.getSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).lean()
    if (!section) {
      return res.status(404).json({ message: 'ไม่พบ Section' })
    }
    // Override videos[i] fields from Content Library if contentId is set
    await resolveVideos(section.videos)

    // Admin ก็ถูก gate เสมอ — ต้องมี activation เหมือนนักเรียน
    const now = new Date()
    const activations = await Activation.find({
      userId: req.user._id,
      isActive: true,
      expiresAt: { $gt: now }
    }).lean()

    const pkgIds = [...new Set(activations.map(a => a.packageId?.toString()).filter(Boolean))]
    const packages = pkgIds.length > 0
      ? await Package.find({ _id: { $in: pkgIds } }).select('sections').lean()
      : []
    const pkgMap = new Map(packages.map(p => [p._id.toString(), p]))

    const matchingActivation = activations.find(a => {
      const pkg = pkgMap.get(a.packageId?.toString())
      return pkg && pkg.sections.some(s => s.toString() === section._id.toString())
    })

    if (!matchingActivation) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง Section นี้' })
    }

    // เช็ค consent — ต้องยอมรับข้อตกลงก่อนเข้าเรียน (ทั้ง admin + นักเรียน)
    const consent = await ConsentLog.findOne({
      activationId: matchingActivation._id,
      termsVersion: CURRENT_TERMS_VERSION
    }).lean()
    if (!consent) {
      return res.status(403).json({ message: 'ต้องยอมรับข้อตกลงก่อนเข้าเรียน', code: 'CONSENT_REQUIRED' })
    }

    // ═══ Tier gate ═══
    // admin ก็ถูก gate เหมือนนักเรียน เพื่อให้ตรวจสอบ tier ของตัวเองได้
    const userTier = matchingActivation.tier || 6

    // bonus lock = tier 6 ตายตัว (bonus เป็น premium เสมอ)
    const videos = section.videos
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((v, idx) => {
        const required = v.requiredTier || 6
        const locked = userTier < required
        const bonusLocked = userTier < 6
        const hasPdf = v.pdfEnabled !== false && !!v.pdfFile
        const hasBonusVideo = !!v.bonusBunnyVideoId

        return {
          index: idx,
          title: v.title,
          duration: locked ? '' : (v.duration || ''),
          order: v.order,
          topic: v.topic || '',
          subtopic: v.subtopic || '',
          topicId: v.topicId || '',
          subtopicId: v.subtopicId || '',
          requiredTier: required,
          locked,
          hasPdf,
          pdfFile: (locked || !hasPdf) ? '' : v.pdfFile,
          pdfFileUrl: '',
          pdfFileName: (locked || !hasPdf) ? '' : (v.pdfFileName || v.pdfFile),
          // hasVideo (legacy) = มีอย่างน้อย 1 serve
          hasVideo: !!((v.bunnyVideoId && v.bunnyDrmVideoId) || v.aliVideoId),
          // ⭐ serve-aware flags — frontend เอาไปเช็คตาม circuit
          //    BUNNY = ต้องมี 2 IDs ครบ (NoDRM + Widevine)
          //    ALI   = 1 ID พอ (dual encryption)
          hasBunnyVideo: !!(v.bunnyVideoId && v.bunnyDrmVideoId),
          hasAliVideo: !!v.aliVideoId,
          hasBonus: !!(v.bonusBunnyVideoId || v.bonusTitle || v.bonusLabel || v.bonusPdfFile),
          hasBonusVideo,
          bonusLocked,
          bonusRequiredTier: 6,
          bonusLabel: v.bonusLabel || '',
          bonusTitle: bonusLocked ? '' : (v.bonusTitle || ''),
          bonusDuration: bonusLocked ? '' : (v.bonusDuration || ''),
          bonusHasPdf: !!v.bonusPdfFile,
          bonusPdfFile: (bonusLocked || !v.bonusPdfFile) ? '' : v.bonusPdfFile,
          bonusPdfFileName: (bonusLocked || !v.bonusPdfFile) ? '' : (v.bonusPdfFileName || v.bonusPdfFile),
          // ⭐ CN: Ali video ID (1 ID dual encryption — Ali Prop + Widevine ในตัว)
          aliVideoId: locked ? '' : (v.aliVideoId || ''),
          bonusAliVideoId: bonusLocked ? '' : (v.bonusAliVideoId || '')
        }
      })

    // ═══ Group PDF (topic/subtopic) gate ═══
    // กฎ: ดูได้ถ้ามี VDO ใต้กลุ่มสักตัวที่ user ดูได้ (tier ถึง)
    const rawTopicPdfMap = section.topicPdfMap instanceof Map ? Object.fromEntries(section.topicPdfMap) : (section.topicPdfMap || {})
    const rawSubtopicPdfMap = section.subtopicPdfMap instanceof Map ? Object.fromEntries(section.subtopicPdfMap) : (section.subtopicPdfMap || {})

    const canAccessGroup = (groupName) => {
      const videosInGroup = section.videos.filter(v =>
        v.topic === groupName || v.subtopic === groupName
      )
      if (videosInGroup.length === 0) return true
      return videosInGroup.some(v => userTier >= (v.requiredTier || 6))
    }

    const topicPdfMap = {}
    for (const [k, v] of Object.entries(rawTopicPdfMap)) {
      if (canAccessGroup(k)) topicPdfMap[k] = v
    }
    const subtopicPdfMap = {}
    for (const [k, v] of Object.entries(rawSubtopicPdfMap)) {
      if (canAccessGroup(k)) subtopicPdfMap[k] = v
    }

    // Activity Log — เข้าดู section (เฉพาะนักเรียน — admin view ไม่นับ)
    if (req.user.role !== 'admin') {
      const ua = parseUA(req.headers['user-agent'])
      logActivity({
        userId: req.user._id,
        userName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : req.user.name,
        userEmail: req.user.email,
        action: 'section_view',
        sectionId: section._id.toString(), sectionName: section.code || section.name,
        detail: `${section.name} (${videos.length} videos)`,
        ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || ''
      })
    }

    // ═══ Self Check meta (per topic/subtopic) ═══
    // หา bindings ของ section นี้ + progress ของ user → return เป็น map { refId: { templateSlug, name, percent, completed, total } }
    const selfCheckMap = {}
    try {
      const SelfCheckBinding = require('../selfcheck/SelfCheckBinding.model')
      const SelfCheckTemplate = require('../selfcheck/SelfCheckTemplate.model')
      const SelfCheckProgress = require('../selfcheck/SelfCheckProgress.model')
      const allRefIds = [...new Set(videos.flatMap(v => [v.topicId, v.subtopicId]).filter(Boolean))]
      if (allRefIds.length) {
        const bindings = await SelfCheckBinding.find({
          refId: { $in: allRefIds },
          isOrphan: { $ne: true }
        }).lean()
        if (bindings.length) {
          const slugs = [...new Set(bindings.map(b => b.templateSlug))]
          const [templates, progresses] = await Promise.all([
            SelfCheckTemplate.find({ slug: { $in: slugs }, isPublished: true }).lean(),
            SelfCheckProgress.find({ userId: req.user._id, templateSlug: { $in: slugs } }).lean()
          ])
          const tplMap = Object.fromEntries(templates.map(t => [t.slug, t]))
          const progMap = Object.fromEntries(progresses.map(p => [p.templateSlug, p.checkedItems]))
          for (const b of bindings) {
            const tpl = tplMap[b.templateSlug]
            if (!tpl) continue
            const validIds = new Set(tpl.sections.flatMap(s => (s.items || []).map(i => i.id)))
            const total = validIds.size
            const checked = (progMap[b.templateSlug] || []).filter(id => validIds.has(id)).length
            selfCheckMap[b.refId] = {
              scope: b.scope,
              templateSlug: b.templateSlug,
              templateName: tpl.name,
              icon: tpl.icon,
              color: tpl.color,
              completed: checked,
              total,
              percent: total ? Math.round((checked / total) * 100) : 0
            }
          }
        }
      }
    } catch (e) {
      console.error('[self-check meta] error:', e.message)
    }

    res.json({
      section: {
        _id: section._id,
        code: section.code,
        name: section.name,
        description: section.description,
        videoCount: videos.length,
        videos,
        topicPdfMap,
        subtopicPdfMap,
        selfCheckMap
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/my/sections/:id/videos/:idx
 * ดูวีดีโอ + signed embed URL (ตรวจสิทธิ์)
 */
exports.getVideo = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).lean()
    if (!section) {
      return res.status(404).json({ message: 'ไม่พบ Section' })
    }
    // Override videos[i] fields from Content Library if contentId is set
    await resolveVideos(section.videos)

    // ตรวจสิทธิ์ — Manual lookup ข้าม DB (admin ก็ถูก gate)
    const now = new Date()
    const activations = await Activation.find({
      userId: req.user._id,
      isActive: true,
      expiresAt: { $gt: now }
    }).lean()

    const pkgIds = [...new Set(activations.map(a => a.packageId?.toString()).filter(Boolean))]
    const packages = pkgIds.length > 0
      ? await Package.find({ _id: { $in: pkgIds } }).select('sections').lean()
      : []
    const pkgMap = new Map(packages.map(p => [p._id.toString(), p]))

    const matchingActivation = activations.find(a => {
      const pkg = pkgMap.get(a.packageId?.toString())
      return pkg && pkg.sections.some(s => s.toString() === section._id.toString())
    })

    if (!matchingActivation) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง Section นี้' })
    }

    // เช็ค consent
    const consent = await ConsentLog.findOne({
      activationId: matchingActivation._id,
      termsVersion: CURRENT_TERMS_VERSION
    }).lean()
    if (!consent) {
      return res.status(403).json({ message: 'ต้องยอมรับข้อตกลงก่อนเข้าเรียน', code: 'CONSENT_REQUIRED' })
    }

    // เรียงวีดีโอตาม order แล้วดึงตาม index
    const sortedVideos = [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    const idx = parseInt(req.params.idx, 10)

    if (isNaN(idx) || idx < 0 || idx >= sortedVideos.length) {
      return res.status(404).json({ message: 'ไม่พบวีดีโอ' })
    }

    const video = sortedVideos[idx]
    const isBonus = req.query.bonus === '1'

    // ถ้าขอ bonus แต่ไม่มี bonus video → 404
    if (isBonus && !video.bonusBunnyVideoId) {
      return res.status(404).json({ message: 'ไม่มี VDO พิเศษ' })
    }

    // ═══ Tier gate (admin ก็ถูก gate) ═══
    // bonus = tier 6 ตายตัว, VDO หลัก = requiredTier
    const userTier = matchingActivation.tier || 6
    const required = isBonus ? 6 : (video.requiredTier || 6)
    if (userTier < required) {
      return res.status(403).json({
        code: 'TIER_LOCKED',
        requiredTier: required,
        message: `วีดีโอนี้เปิดให้ดูเมื่อปลดล็อกระดับ ${required} ขึ้นไป`
      })
    }

    // ═══ เลือก video ID ตาม bonus flag ═══
    const targetVideoId = isBonus ? video.bonusBunnyVideoId : video.bunnyVideoId
    const targetDrmId = isBonus ? video.bonusBunnyDrmVideoId : video.bunnyDrmVideoId
    // ⭐ CN: Ali video ID (1 ID dual encryption — Ali Prop + Widevine ในตัว)
    const targetAliId = isBonus ? video.bonusAliVideoId : video.aliVideoId
    const targetTitle = isBonus ? (video.bonusTitle || video.title) : video.title
    const targetDuration = isBonus ? (video.bonusDuration || video.duration) : video.duration

    // ═══ เลือก library ตาม UA + DRM UUID ═══
    // iPad iOS 13+ ส่ง UA เป็น Mac → frontend ส่ง X-MN-Device: ios-ipad header มาช่วย
    const { isIOS, isMacSafari } = require('../../shared/util/deviceDetect')
    const useDrm = targetDrmId && !isIOS(req) && !isMacSafari(req)
    const embedUrl = useDrm
      ? getSignedEmbedUrl(targetDrmId)
      : getDemoEmbedUrl(targetVideoId)

    // ⭐ CN skip Bunny verify — ใช้ Aliplayer ใน frontend อยู่แล้ว ไม่ต้อง Bunny
    const isCN = !!(req.geo && req.geo.isChina)

    // ═══ Server-side verify: เช็คว่า embedUrl ใช้ได้ก่อนส่งให้ frontend ═══
    let cdnStatus = isCN ? 200 : 0
    if (!isCN) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const cdnResp = await fetch(embedUrl, {
            headers: { 'Referer': 'https://medninja.academy/', 'Origin': 'https://medninja.academy' }
          })
          cdnStatus = cdnResp.status
          if (cdnStatus === 200) break
        } catch { cdnStatus = 0 }
        if (attempt === 0 && cdnStatus !== 200) await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (cdnStatus !== 200) {
      // CDN ตอบไม่ใช่ 200 → ไม่ส่ง embedUrl ให้ frontend → ไม่เจอ 403 ใน iframe
      console.error(`[getVideo] CDN returned ${cdnStatus} for ${targetTitle} (${targetVideoId}${isBonus ? ' bonus' : ''})`)
      // ส่ง LINE แจ้งเติ้ลอัตโนมัติ
      try {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        const TITLE_UID = 'U2b0de81f0ec73e8561197393683a9e95'
        if (lineToken) {
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({ to: TITLE_UID, messages: [{ type: 'text',
              text: `🚨 CDN ${cdnStatus} ก่อนส่งให้นักเรียน!\n\nVideo: ${targetTitle}${isBonus ? ' (bonus)' : ''}\nID: ${targetVideoId}\nUser: ${req.user.email}\nURL: ${embedUrl.replace(/token=[^&]+/, 'token=***')}\n\nนักเรียนไม่เห็น 403 — ระบบดักไว้แล้ว`
            }] })
          }).catch(() => {})
        }
      } catch {}

      return res.status(502).json({
        message: 'วีดีโอยังไม่พร้อม กรุณาลองใหม่อีกครั้ง',
        cdnStatus
      })
    }

    // Resume — ดึง progress จาก server แล้วใส่ ?t= ใน embedUrl (admin ไม่ resume)
    let resumeEmbedUrl = embedUrl
    if (req.user.role !== 'admin') {
      try {
        const WatchProgress = require('./WatchProgress.model')
        const prog = await WatchProgress.findOne({
          userId: req.user._id,
          sectionId: section._id,
          videoIndex: idx,
          isBonus: !!isBonus
        }).select('currentTime').lean()
        console.log(`[Resume] user=${req.user.email} section=${section._id} video=${idx} prog=${prog ? prog.currentTime : 'none'}`)
        if (prog && prog.currentTime > 5) {
          const seekTo = Math.max(0, Math.floor(prog.currentTime - 3))
          resumeEmbedUrl += (embedUrl.includes('?') ? '&' : '?') + `t=${seekTo}`
          console.log(`[Resume] → seek to ${seekTo}s`)
        }
      } catch {}
    }

    // ⭐ CN: 1 Video ID มี dual encryption — frontend ตัดสินใจ path (iOS PlayAuth / Other STS)
    res.json({
      video: {
        index: idx,
        title: targetTitle,
        duration: targetDuration,
        embedUrl: resumeEmbedUrl,
        isDemoLibrary: !useDrm,
        drmMode: useDrm ? 'widevine' : 'protection',
        libraryId: useDrm ? '626874' : '628424',
        // ⭐ CN: Ali video ID เดียว (dual encryption ในตัว)
        aliVideoId: targetAliId || '',
        bonusAliVideoId: !isBonus ? (video.bonusAliVideoId || '') : '',
        isBonus: !!isBonus,
        // ส่ง bonus info เฉพาะตอนดู VDO หลัก (ให้ frontend รู้ว่ามี bonus)
        hasBonusVideo: !isBonus && !!video.bonusBunnyVideoId,
        bonusTitle: !isBonus ? (video.bonusTitle || '') : ''
      },
      section: {
        _id: section._id,
        code: section.code,
        name: section.name
      },
      totalVideos: sortedVideos.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/my/heartbeat
 * WatchPage ส่งทุก 30 วินาที — เก็บใน MongoDB (ActiveViewer)
 *
 * Logic: "เปิดหลังสุดชนะ" + window.name แยก refresh
 * - heartbeat ปกติ (tabId ตรง) → update timestamp
 * - เปิดใหม่ (firstBeat + ไม่ใช่ refresh) → OVERWRITE → จอนี้ชนะ, จอเก่าโดน block
 * - refresh (firstBeat + oldTabId ตรง) → เปลี่ยน tabId → ยังเป็นจอเดิม
 * - tabId ไม่ตรง + ไม่ใช่ firstBeat → ถูกแย่งแล้ว → BLOCK
 */
exports.heartbeat = async (req, res, next) => {
  try {
    const { sectionId, videoIndex, sectionName, videoTitle, tabId, os, browser, oldTabId, firstBeat, currentTime, videoDuration, isPlaying, playerError, appVersion, liveId, contentType } = req.body
    const userId = req.user._id
    const userName = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
    const userEmail = req.user.email || ''

    const data = { sectionId, videoIndex, sectionName, videoTitle, userName, userEmail, tabId, os, browser, currentTime: currentTime || 0, videoDuration: videoDuration || 0, isPlaying: !!isPlaying, playerError: playerError || '', appVersion: appVersion || '', liveId: liveId || '', contentType: contentType || 'video', updatedAt: new Date() }
    let isBlocked = false
    let activeTab = null

    // Step 1: ลอง update ด้วย tabId ปัจจุบัน (heartbeat ปกติ — tab เดิม)
    // เช็ค kicked flag ก่อน
    const existing0 = await ActiveViewer.findOne({ userId }).lean()
    if (existing0?.kicked) {
      await ActiveViewer.deleteOne({ userId })
      return res.json({ ok: false, kicked: true })
    }

    const updated = await ActiveViewer.findOneAndUpdate(
      { userId, tabId },
      data,
      { new: true }
    )

    if (!updated) {
      const existing = await ActiveViewer.findOne({ userId }).lean()

      if (firstBeat) {
        // ═══ FIRST BEAT — เพิ่งเปิดหน้า ═══
        if (existing && oldTabId && existing.tabId === oldTabId) {
          // ✅ REFRESH — window.name จำ tabId เก่าได้ → แค่เปลี่ยน tabId ใหม่
          await ActiveViewer.findOneAndUpdate({ userId }, { userId, ...data })
        } else {
          // 🆕 TAB ใหม่ (หรือ device อื่น) → OVERWRITE → จอนี้ชนะ
          await ActiveViewer.findOneAndUpdate({ userId }, { userId, ...data }, { upsert: true })
        }
      } else if (existing) {
        // ═══ HEARTBEAT ปกติ แต่ tabId ไม่ตรง → ถูกแย่งแล้ว → BLOCK ═══
        isBlocked = true
        activeTab = { sectionName: existing.sectionName, videoTitle: existing.videoTitle, os: existing.os, browser: existing.browser }
      } else {
        // ═══ ไม่มี doc (เพิ่งหมดอายุ) → สร้างใหม่ ═══
        try {
          await ActiveViewer.create({ userId, ...data })
        } catch (err) {
          if (err.code === 11000) {
            isBlocked = true
            const other = await ActiveViewer.findOne({ userId }).lean()
            if (other) activeTab = { sectionName: other.sectionName, videoTitle: other.videoTitle, os: other.os, browser: other.browser }
          } else { throw err }
        }
      }
    }

    // บันทึกทุก tab (ทั้ง active + blocked) ใน ViewerTab — admin เห็นหมด
    ViewerTab.findOneAndUpdate(
      { userId, tabId },
      { status: isBlocked ? 'blocked' : 'watching', sectionName, videoTitle, os, browser, userName, userEmail, updatedAt: new Date() },
      { upsert: true }
    ).catch(() => {}) // fire-and-forget ไม่ block response

    if (isBlocked) {
      return res.json({ ok: false, replaced: true, activeTab, warning: 'มี tab อื่นกำลังดูอยู่' })
    }

    // LINE แจ้งเตือนย้ายไป auto-diag แทน (frontend ส่ง POST /api/diag ทุกครั้ง)

    res.json({ ok: true })
  } catch (error) {
    res.json({ ok: true })
  }
}

/**
 * DELETE /api/my/heartbeat
 * ออกจากหน้า watch → ลบ viewer document
 */
exports.clearHeartbeat = async (req, res) => {
  try {
    await ActiveViewer.deleteOne({ userId: req.user._id })
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
}

/**
 * POST /api/beacon/heartbeat-clear
 * sendBeacon endpoint — ส่ง header ไม่ได้ อ่าน JWT จาก body แทน
 */
exports.beaconClearHeartbeat = async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) return res.json({ ok: false })
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    await ActiveViewer.deleteOne({ userId: decoded.id })
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
}

/**
 * POST /api/my/client-log
 * เก็บ error/พฤติกรรมจาก frontend แบบเงียบๆ
 */
exports.clientLog = async (req, res) => {
  try {
    const {
      type, message, detail, url, sectionId, videoIndex, videoTitle,
      os, browser, userAgent, screenSize,
      // live debug fields
      liveId, tabId, event, currentTime, bufferedEnd, isPlaying, liveReady, needUnmute, wsConnected, errorCount
    } = req.body
    const userName = req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
    await ClientLog.create({
      userId: req.user._id,
      userName,
      userEmail: req.user.email || '',
      type: type || 'error',
      message: (message || '').slice(0, 500),
      detail: (detail || '').slice(0, 2000),
      url: (url || '').slice(0, 500),
      sectionId, videoIndex, videoTitle,
      os, browser, userAgent: (userAgent || '').slice(0, 500), screenSize,
      liveId, tabId, event,
      currentTime, bufferedEnd, isPlaying, liveReady, needUnmute, wsConnected, errorCount
    })
    res.json({ ok: true })
  } catch {
    res.json({ ok: true }) // ไม่ให้ log error ทำ frontend พัง
  }
}
