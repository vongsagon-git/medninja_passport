const express = require('express')
const LiveSession = require('./LiveSession.model')
const LiveContent = require('./LiveContent.model')
const Activation = require('../activation/Activation.model')
const { getDemoEmbedUrl, getSignedEmbedUrl } = require('../../shared/config/bunny')
const chromeOnly = require('../../shared/middleware/chromeOnly')
const { isIOS, isMacSafari } = require('../../shared/util/deviceDetect')

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL
const PDF_API_KEY = process.env.INTERNAL_API_KEY

// In-memory job map สำหรับ live PDF
const liveJobs = new Map()
// cleanup ทุก 30 นาที
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const [k, v] of liveJobs) { if (v.createdAt < cutoff) liveJobs.delete(k) }
}, 5 * 60 * 1000)

// เช็ค device เลือก DRM หรือ NO DRM (เหมือน WatchPage)
function getLiveEmbed(content, req) {
  const useDrm = content.bunnyDrmVideoId && !isIOS(req) && !isMacSafari(req)
  return {
    url: useDrm ? getSignedEmbedUrl(content.bunnyDrmVideoId) : getDemoEmbedUrl(content.bunnyVideoId),
    drmMode: useDrm ? 'widevine' : 'protection'
  }
}

function formatNid(id) {
  if (!id) return ''
  const d = id.replace(/\D/g, '')
  if (d.length !== 13) return id
  return `${d[0]}-${d.slice(1,5)}-${d.slice(5,10)}-${d.slice(10,12)}-${d[12]}`
}

const router = express.Router()

// GET /api/my/live/current — ไลฟ์ของคอร์สที่นักเรียนลงไว้ (สำหรับ MyDashboard)
router.get('/live/current', async (req, res) => {
  try {
    const userId = req.user._id
    const now = new Date()

    const activations = await Activation.find({
      userId, isActive: true, expiresAt: { $gt: now }, liveEnabled: true
    }).select('packageId').lean()

    const packageIds = activations.map(a => a.packageId)
    if (!packageIds.length) return res.json({ sessions: [] })

    const sessions = await LiveSession.find({
      packageId: { $in: packageIds }
    }).sort({ scheduledAt: 1 }).lean()

    const result = sessions.map(s => {
      const start = new Date(s.scheduledAt).getTime()
      const end = start + (s.videoDurationSec || 0) * 1000

      let status = 'waiting'
      let startsIn = 0
      if (now.getTime() > end) {
        status = 'ended'
      } else if (now.getTime() >= start) {
        status = 'live'
      } else {
        startsIn = start - now.getTime()
      }

      return { _id: s._id, title: s.title, packageId: s.packageId, scheduledAt: s.scheduledAt, status, startsIn }
    })

    res.json({ sessions: result })
  } catch (err) {
    console.error('live current error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// GET /api/my/live/room/:packageId — เข้าห้อง live ของคอร์ส
// chromeOnly: iOS=Safari/Chrome, Android/Desktop=Chrome เท่านั้น
router.get('/live/room/:packageId', chromeOnly, async (req, res) => {
  try {
    const userId = req.user._id
    const packageId = req.params.packageId

    // ตรวจสิทธิ์ (ต้องมี activation + liveEnabled)
    if (req.user.role !== 'admin') {
      const activation = await Activation.findOne({
        userId, packageId, isActive: true, expiresAt: { $gt: new Date() }
      }).lean()
      if (!activation) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าชม' })
      if (!activation.liveEnabled) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดู Live — ติดต่อ Admin', code: 'LIVE_DISABLED' })
    }

    const now = Date.now()
    const sessions = await LiveSession.find({ packageId }).sort({ scheduledAt: 1 }).populate('liveContentId').lean()

    // เลือก: กำลังสด > กำลังจะเริ่ม > session ล่าสุดที่จบ (ข้าม cancelled)
    const activeSessions = sessions.filter(s => !s.cancelled)
    let picked = null
    for (const s of activeSessions) {
      const start = new Date(s.scheduledAt).getTime()
      const end = start + (s.videoDurationSec || 0) * 1000 + 5 * 60 * 1000
      if (now >= start && now <= end) { picked = s; break }
    }
    if (!picked) {
      for (const s of activeSessions) {
        const start = new Date(s.scheduledAt).getTime()
        if (now < start) { picked = s; break }
      }
    }
    if (!picked) {
      const Package = require('../content/Package.model')
      const pkg = await Package.findById(packageId).select('title').lean()
      return res.json({ status: 'no_schedule', title: pkg?.title || 'ห้องเรียนสด', packageId })
    }

    const content = picked.liveContentId || {}
    const start = new Date(picked.scheduledAt).getTime()
    const end = start + (picked.videoDurationSec || 0) * 1000 + 5 * 60 * 1000

    if (now < start) {
      return res.json({
        status: 'waiting',
        title: picked.title,
        scheduledAt: picked.scheduledAt,
        startsIn: start - now,
        pdfFiles: content.pdfFiles || [],
        sessionId: picked._id,
        packageId
      })
    }

    if (now > end) {
      let nextSession = null
      for (const s of sessions) {
        if (s.cancelled) continue
        const sStart = new Date(s.scheduledAt).getTime()
        if (sStart > now) {
          const nc = s.liveContentId || {}
          nextSession = {
            title: s.title,
            startsIn: sStart - now,
            pdfFiles: nc.pdfFiles || [],
            sessionId: s._id
          }
          break
        }
      }
      return res.json({ status: 'ended', title: picked.title, packageId, nextSession })
    }

    // กำลังสด
    const offsetSec = Math.floor((now - start) / 1000)
    const embed = getLiveEmbed(content, req)
    // ⭐ ห้าม autoplay — รอ user กดปุ่มรับสัญญาณ → user gesture trigger play()
    // เหตุผล: autoplay=true ทำให้ Bunny โผล่ปุ่มส้มตอน autoplay block (Safari/iOS)
    const embedUrl = embed.url + (embed.url.includes('?') ? '&' : '?') + `t=${offsetSec}&autoplay=false`
    // ⭐ serverTime สำหรับ frontend คำนวณ offset จริงตอนกดปุ่ม
    const serverTime = Date.now()

    res.json({
      status: 'live',
      title: picked.title,
      embedUrl,
      drmMode: embed.drmMode,
      offsetSec,
      serverTime,
      videoDurationSec: picked.videoDurationSec || 0,
      pdfFiles: content.pdfFiles || [],
      sessionId: picked._id,
      packageId
    })
  } catch (err) {
    console.error('live room error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// ═══ PDF job routes (ต้องอยู่ก่อน /live/:id เพราะ "pdf-job" จะ match :id) ═══

// GET /api/my/live/pdf-job/:jobId/status — poll status
router.get('/live/pdf-job/:jobId/status', async (req, res) => {
  try {
    const job = liveJobs.get(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const resp = await fetch(`${PDF_SERVICE_URL}/status/${job.pdfJobId}`, {
      headers: { 'X-API-Key': PDF_API_KEY }
    })
    const data = await resp.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/my/live/pdf-job/:jobId/download — ดาวน์โหลด PDF ที่ watermark เสร็จ
router.get('/live/pdf-job/:jobId/download', async (req, res) => {
  try {
    const job = liveJobs.get(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const resp = await fetch(`${PDF_SERVICE_URL}/download/${job.pdfJobId}`, {
      headers: { 'X-API-Key': PDF_API_KEY }
    })
    if (!resp.ok) {
      const d = await resp.json().catch(() => ({}))
      return res.status(resp.status).json(d)
    }

    const resultBytes = Buffer.from(await resp.arrayBuffer())
    const u = req.user
    const { session, pdfFile, userName, refId, clientIp, dateStr } = job
    const nameClean = `${u.firstName || ''}${u.lastName ? '_' + u.lastName : ''}`.replace(/\s+/g, '_') || 'student'
    const titleClean = (pdfFile.name || 'live').replace(/\s+/g, '_')
    const downloadName = `${nameClean}_${titleClean}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
    res.setHeader('Content-Length', resultBytes.length)
    res.send(resultBytes)

    // Fire-and-forget: email + LINE + log
    ;(async () => {
      let emailSent = false
      try {
        const nodemailer = require('nodemailer')
        const host = process.env.SMTP_HOST, smtpUser = process.env.SMTP_USER, smtpPass = process.env.SMTP_PASS
        if (host && smtpUser && smtpPass && u.email) {
          const transporter = nodemailer.createTransport({ host, port: parseInt(process.env.SMTP_PORT || '587'), secure: (process.env.SMTP_PORT || '587') === '465', auth: { user: smtpUser, pass: smtpPass } })
          await transporter.sendMail({
            from: `"MedNinja Academy" <${process.env.SMTP_FROM || smtpUser}>`,
            to: u.email,
            subject: `[MedNinja] ยืนยันการดาวน์โหลดเอกสาร — Ref: ${refId}`,
            html: `<div style="font-family:'Noto Sans Thai',sans-serif;max-width:500px;margin:0 auto;padding:24px;"><div style="background:#0f172a;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;"><h2 style="margin:0;font-size:18px;">MedNinja Academy</h2><p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">ยืนยันการดาวน์โหลดเอกสาร</p></div><div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;"><p style="color:#1e293b;font-size:14px;">เรียน <strong>${userName}</strong>,</p><p style="color:#475569;font-size:13px;">คุณได้ดาวน์โหลดเอกสาร <strong>${pdfFile.name}</strong> เรียบร้อยแล้ว</p><table style="width:100%;font-size:13px;color:#334155;margin:16px 0;border-collapse:collapse;"><tr><td style="padding:6px 0;color:#94a3b8;width:100px;">Ref</td><td style="font-weight:700;">${refId}</td></tr><tr><td style="padding:6px 0;color:#94a3b8;">เอกสาร</td><td>${pdfFile.name}</td></tr><tr><td style="padding:6px 0;color:#94a3b8;">ไลฟ์</td><td>${session.title}</td></tr><tr><td style="padding:6px 0;color:#94a3b8;">IP</td><td>${clientIp}</td></tr><tr><td style="padding:6px 0;color:#94a3b8;">วันที่</td><td>${dateStr}</td></tr></table><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:16px;font-size:12px;color:#475569;"><p style="margin:0 0 4px;">เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537</p><p style="margin:0;font-weight:700;color:#334155;">บริษัท เมดนินจา จำกัด สงวนสิทธิ์ในการดำเนินการตามกฎหมาย</p></div></div></div>`
          })
          emailSent = true
        }
      } catch (e) { console.error('[Live PDF Email] error:', e.message) }

      // LINE แจ้ง admin
      try {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'
        if (lineToken) {
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({
              to: ADMIN_UID,
              messages: [{ type: 'flex', altText: `PDF LIVE: ${userName}`, contents: {
                type: 'bubble', size: 'kilo',
                header: { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', paddingAll: '14px', contents: [
                  { type: 'text', text: 'PDF Downloaded (LIVE)', color: '#FFFFFF', size: 'sm', weight: 'bold' }
                ]},
                body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', contents: [
                  { type: 'text', text: userName, size: 'md', weight: 'bold', color: '#1e293b' },
                  { type: 'separator', color: '#e2e8f0' },
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: 'Ref', size: 'xs', color: '#94a3b8', flex: 2 },
                    { type: 'text', text: refId, size: 'xs', weight: 'bold', color: '#3b82f6', flex: 5 }
                  ]},
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: 'Doc', size: 'xs', color: '#94a3b8', flex: 2 },
                    { type: 'text', text: `${pdfFile.name} (${session.title})`, size: 'xs', flex: 5, wrap: true }
                  ]},
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: 'Email', size: 'xs', color: '#94a3b8', flex: 2 },
                    { type: 'text', text: u.email || '-', size: 'xs', flex: 5, wrap: true }
                  ]}
                ]}
              }}]
            })
          }).catch(() => {})
        }
      } catch {}

      // บันทึก log
      const PdfDownloadLog = require('../content/PdfDownloadLog.model')
      PdfDownloadLog.create({
        userId: u._id, userName, userEmail: u.email || '',
        nationalId: u.nationalId || '', phone: u.phone || '', university: u.university || '',
        sectionId: null, sectionCode: 'LIVE', sectionName: session.title,
        videoTitle: pdfFile.name, bunnyVideoId: pdfFile.fileName?.replace('.pdf', '') || '',
        refId, ip: clientIp, userAgent: req.headers['user-agent'] || '',
        emailSent, fileSize: resultBytes.length
      }).catch(() => {})
    })()
  } catch (err) {
    console.error('Live PDF download error:', err.message)
    res.status(500).json({ message: 'ดาวน์โหลด PDF ไม่สำเร็จ' })
  }
})

// GET /api/my/live/:id — ดึงข้อมูลไลฟ์ + signed embed URL
// chromeOnly: iOS=Safari/Chrome, Android/Desktop=Chrome เท่านั้น
router.get('/live/:id', chromeOnly, async (req, res) => {
  try {
    const userId = req.user._id
    const session = await LiveSession.findById(req.params.id).populate('liveContentId').lean()
    if (!session) return res.status(404).json({ message: 'ไม่พบ live session' })

    // ตรวจสิทธิ์ (ต้องมี activation + liveEnabled)
    if (req.user.role !== 'admin') {
      const activation = await Activation.findOne({
        userId, packageId: session.packageId, isActive: true, expiresAt: { $gt: new Date() }
      }).lean()
      if (!activation) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าชม' })
      if (!activation.liveEnabled) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดู Live — ติดต่อ Admin', code: 'LIVE_DISABLED' })
    }

    // เช็ค cancelled
    if (session.cancelled) {
      return res.json({
        status: 'cancelled',
        title: session.title,
        cancelReason: session.cancelReason || 'ยกเลิกโดย Admin'
      })
    }

    const content = session.liveContentId || {}
    const now = Date.now()
    const start = new Date(session.scheduledAt).getTime()
    const end = start + (session.videoDurationSec || 0) * 1000 + 5 * 60 * 1000

    if (now < start) {
      return res.json({
        status: 'waiting',
        title: session.title,
        scheduledAt: session.scheduledAt,
        startsIn: start - now,
        pdfFiles: content.pdfFiles || []
      })
    }

    if (now > end) {
      return res.json({ status: 'ended', title: session.title })
    }

    // กำลังสด
    const offsetSec = Math.floor((now - start) / 1000)
    const embed = getLiveEmbed(content, req)
    // ⭐ ห้าม autoplay — รอ user กดปุ่มรับสัญญาณ → user gesture trigger play()
    // เหตุผล: autoplay=true ทำให้ Bunny โผล่ปุ่มส้มตอน autoplay block (Safari/iOS)
    const embedUrl = embed.url + (embed.url.includes('?') ? '&' : '?') + `t=${offsetSec}&autoplay=false`
    // ⭐ serverTime สำหรับ frontend คำนวณ offset จริงตอนกดปุ่ม
    const serverTime = Date.now()

    res.json({
      status: 'live',
      title: session.title,
      embedUrl,
      drmMode: embed.drmMode,
      offsetSec,
      serverTime,
      pdfFiles: content.pdfFiles || []
    })
  } catch (err) {
    console.error('live get error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// POST /api/my/live/:id/pdf-start/:fileIdx — เริ่ม watermark job สำหรับ live PDF
router.post('/live/:id/pdf-start/:fileIdx', async (req, res) => {
  try {
    if (!PDF_SERVICE_URL || !PDF_API_KEY) return res.status(500).json({ message: 'PDF Service not configured' })

    const userId = req.user._id
    const session = await LiveSession.findById(req.params.id).populate('liveContentId').lean()
    if (!session) return res.status(404).json({ message: 'ไม่พบ live session' })

    const content = session.liveContentId || {}
    const pdfFiles = content.pdfFiles || []
    const fileIdx = parseInt(req.params.fileIdx, 10)
    if (isNaN(fileIdx) || fileIdx < 0 || fileIdx >= pdfFiles.length) {
      return res.status(404).json({ message: 'ไม่พบไฟล์ PDF' })
    }

    const pdfFile = pdfFiles[fileIdx]

    // ตรวจสิทธิ์
    if (req.user.role !== 'admin') {
      const activation = await Activation.findOne({
        userId, packageId: session.packageId, isActive: true, expiresAt: { $gt: new Date() }
      }).lean()
      if (!activation) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดาวน์โหลด' })
    }

    // เตรียมข้อมูลลายน้ำ
    const u = req.user
    const refId = (u._id || '').toString().slice(-8).toUpperCase()
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '?'
    const now = new Date()
    const dateStr = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const userName = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.name || '-')

    let nameEn = ''
    try {
      const PreRegistration = require('../preregister/PreRegistration.model')
      const prereg = await PreRegistration.findOne({ nationalId: u.nationalId }).select('firstNameEn lastNameEn').lean()
      if (prereg?.firstNameEn) nameEn = `${prereg.firstNameEn} ${prereg.lastNameEn || ''}`.trim().toUpperCase()
    } catch {}

    const uni = (u.university || '').toUpperCase()
    const uniLines = []
    if (uni.length > 25) {
      const cutWords = ['มหาวิทยาลัย','สถาบัน','วิทยาลัย','คณะ','พระ','เจ้า','ราช','UNIVERSITY','COLLEGE','INSTITUTE','SCHOOL','FACULTY','OF ']
      let cut = -1
      for (const w of cutWords) { const i2 = uni.indexOf(w, 5); if (i2 > 5 && i2 < uni.length - 5) { cut = i2; break } }
      if (cut > 0) { uniLines.push(uni.slice(0, cut)); uniLines.push(uni.slice(cut)) }
      else { const mid = Math.ceil(uni.length / 2); uniLines.push(uni.slice(0, mid)); uniLines.push(uni.slice(mid)) }
    } else if (uni) { uniLines.push(uni) }

    const blockLines = [userName, u.nationalId ? formatNid(u.nationalId) : '', ...uniLines, u.email || '', u.phone || '', `IP: ${clientIp}`, dateStr, 'MedNinja Co., Ltd.', 'Ref: ' + refId].filter(Boolean)

    // Submit ไป PDF Service
    const submitResp = await fetch(`${PDF_SERVICE_URL}/watermark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': PDF_API_KEY },
      body: JSON.stringify({
        fileName: pdfFile.fileName,
        blockLines,
        microText: `${u.email || ''} ${formatNid(u.nationalId || '')}`,
        userName, refId, userId: (u._id || '').toString(), email: u.email || '',
        nationalId: u.nationalId ? formatNid(u.nationalId) : '',
        phone: u.phone || '', clientIp, dateStr, nameEn,
        university: u.university || '',
        pdfTitle: `LIVE: ${session.title} — ${pdfFile.name} | MedNinja LMS`
      })
    })
    const submitData = await submitResp.json()
    if (!submitResp.ok) return res.status(502).json({ message: submitData.message || 'PDF Service error' })

    // เก็บ mapping
    const localJobId = `live-${userId}-${Date.now()}`
    liveJobs.set(localJobId, {
      pdfJobId: submitData.jobId,
      userId, session, pdfFile, userName, refId, clientIp, dateStr,
      createdAt: Date.now()
    })

    res.json({ jobId: localJobId })
  } catch (err) {
    console.error('Live PDF start error:', err.message)
    res.status(500).json({ message: 'เริ่มดาวน์โหลดไม่สำเร็จ' })
  }
})

// Export สำหรับ clear cache จาก admin routes (legacy compat)
router.clearPdfCache = () => {}

module.exports = router
