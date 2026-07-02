/**
 * PDF Controller — ดาวน์โหลด PDF พร้อมลายน้ำชื่อนักเรียน (per video)
 * ใช้ PDF Watermark Service (แยก app) หรือ fallback Worker Thread
 */
const { Worker } = require('worker_threads')
const path = require('path')
const Section = require('./Section.model')
const Activation = require('../activation/Activation.model')
const Package = require('./Package.model')

// ═══ PDF Service Helper — submit → poll → download ═══
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL
const PDF_API_KEY = process.env.INTERNAL_API_KEY

async function watermarkViaPdfService(fileName, watermarkData) {
  // 1. Submit job
  const submitResp = await fetch(`${PDF_SERVICE_URL}/watermark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': PDF_API_KEY },
    body: JSON.stringify({ fileName, ...watermarkData })
  })
  if (!submitResp.ok) {
    const err = await submitResp.json().catch(() => ({}))
    throw new Error(err.message || `PDF Service submit failed: ${submitResp.status}`)
  }
  const { jobId } = await submitResp.json()

  // 2. Poll status จนเสร็จ (max 3 นาที)
  const deadline = Date.now() + 180000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1000))
    const statusResp = await fetch(`${PDF_SERVICE_URL}/status/${jobId}`, {
      headers: { 'X-API-Key': PDF_API_KEY }
    })
    const sd = await statusResp.json()
    if (sd.status === 'done') break
    if (sd.status === 'error') throw new Error(sd.statusText || 'Watermark failed')
  }

  // 3. Download PDF
  const dlResp = await fetch(`${PDF_SERVICE_URL}/download/${jobId}`, {
    headers: { 'X-API-Key': PDF_API_KEY }
  })
  if (!dlResp.ok) throw new Error('PDF Service download failed')
  return Buffer.from(await dlResp.arrayBuffer())
}

// ═══ PDF Queue — จำกัด stamp พร้อมกัน 3 คน ═══
let pdfActiveCount = 0
let shuttingDown = false
const PDF_MAX_CONCURRENT = 3
const pdfQueue = []

function pdfQueueMiddleware(req, res, next) {
  // กำลัง deploy → block คนใหม่
  if (shuttingDown) {
    return res.status(503).json({ message: 'ระบบกำลังอัปเดต กรุณารอ 30 วินาที แล้วลองใหม่', updating: true })
  }
  if (pdfActiveCount < PDF_MAX_CONCURRENT) {
    pdfActiveCount++
    res.on('finish', () => {
      pdfActiveCount--
      // ดึงคนถัดไปจาก queue
      if (pdfQueue.length > 0) {
        const { req: qReq, res: qRes, next: qNext } = pdfQueue.shift()
        pdfActiveCount++
        qNext()
      }
    })
    next()
  } else {
    // ส่งตำแหน่งคิวให้ frontend
    pdfQueue.push({ req, res, next })
    // ถ้ารอเกิน 60 วินาที → timeout
    setTimeout(() => {
      const idx = pdfQueue.findIndex(q => q.res === res)
      if (idx >= 0) {
        pdfQueue.splice(idx, 1)
        res.status(503).json({ message: 'คิวเต็ม กรุณาลองใหม่', queue: true })
      }
    }, 60000)
  }
}
exports.pdfQueueMiddleware = pdfQueueMiddleware
exports.pdfActiveCount = 0 // will be updated via getter
Object.defineProperty(exports, 'pdfActiveCount', { get: () => pdfActiveCount })
Object.defineProperty(exports, 'pdfQueue', { get: () => pdfQueue })
exports.setShuttingDown = (v) => { shuttingDown = v }

// GET /api/my/sections/:id/videos/:idx/pdf-status — เช็คคิว
exports.pdfQueueStatus = (req, res) => {
  res.json({ active: pdfActiveCount, waiting: pdfQueue.length, max: PDF_MAX_CONCURRENT })
}

/**
 * GET /api/my/sections/:id/videos/:idx/pdf
 * ดาวน์โหลด PDF พร้อมลายน้ำ
 */
exports.downloadPdf = async (req, res) => {
  try {
    const userId = req.user._id
    const section = await Section.findById(req.params.id).lean()
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    const idx = parseInt(req.params.idx, 10)
    const sortedVideos = [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    if (isNaN(idx) || idx < 0 || idx >= sortedVideos.length) {
      return res.status(404).json({ message: 'ไม่พบวีดีโอ' })
    }

    const video = sortedVideos[idx]
    if (!video.pdfFile && !video.pdfFileUrl) return res.status(404).json({ message: 'วีดีโอนี้ไม่มีเอกสาร PDF' })

    // ตรวจสิทธิ์ (admin ก็ถูก gate)
    {
      const now = new Date()
      const activations = await Activation.find({
        userId, isActive: true, expiresAt: { $gt: now }
      }).select('packageId tier').lean()

      const packageIds = activations.map(a => a.packageId)
      const matchingPkgs = await Package.find({
        _id: { $in: packageIds },
        sections: section._id
      }).select('_id').lean()
      if (matchingPkgs.length === 0) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดาวน์โหลด' })

      const matchingPkgIds = new Set(matchingPkgs.map(p => p._id.toString()))
      const userTier = activations
        .filter(a => matchingPkgIds.has(a.packageId.toString()))
        .reduce((max, a) => Math.max(max, a.tier || 6), 0)

      const required = video.requiredTier || 6
      if (userTier < required) {
        return res.status(403).json({
          code: 'TIER_LOCKED',
          requiredTier: required,
          message: `เอกสารนี้เปิดให้ดาวน์โหลดเมื่อปลดล็อกระดับ ${required} ขึ้นไป`
        })
      }
    }

    // ═══ ดักจับพฤติกรรมผิดปกติ ═══
    try {
      const PdfDownloadLog = require('./PdfDownloadLog.model')
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentCount = await PdfDownloadLog.countDocuments({ userId, createdAt: { $gte: oneHourAgo } })
      const sameFileCount = await PdfDownloadLog.countDocuments({ userId, bunnyVideoId: video.bunnyVideoId, createdAt: { $gte: oneHourAgo } })

      // แจ้ง admin ถ้าโหลดไฟล์เดิม >= 3 ครั้ง/ชม. หรือโหลดรวม >= 10 ครั้ง/ชม.
      if (sameFileCount >= 3 || recentCount >= 10) {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'
        if (lineToken) {
          const alertType = sameFileCount >= 3 ? `ไฟล์เดิม ${sameFileCount} ครั้ง/ชม.` : `${recentCount} ไฟล์/ชม.`
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({ to: ADMIN_UID, messages: [{ type: 'text',
              text: `⚠️ PDF Download ผิดปกติ!\n\n${req.user.email}\n${video.title}\n${alertType}\n\nอาจกำลังพยายาม bypass ลายน้ำ`
            }] })
          }).catch(() => {})
        }
      }
    } catch {}

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
    } catch { /* ignore */ }

    const uni = (u.university || '').toUpperCase()
    const uniLines = []
    if (uni.length > 25) {
      const cutWords = ['มหาวิทยาลัย', 'สถาบัน', 'วิทยาลัย', 'คณะ', 'พระ', 'เจ้า', 'ราช', 'UNIVERSITY', 'COLLEGE', 'INSTITUTE', 'SCHOOL', 'FACULTY', 'OF ']
      let cut = -1
      for (const w of cutWords) {
        const idx2 = uni.indexOf(w, 5)
        if (idx2 > 5 && idx2 < uni.length - 5) { cut = idx2; break }
      }
      if (cut > 0) { uniLines.push(uni.slice(0, cut)); uniLines.push(uni.slice(cut)) }
      else { const mid = Math.ceil(uni.length / 2); uniLines.push(uni.slice(0, mid)); uniLines.push(uni.slice(mid)) }
    } else if (uni) { uniLines.push(uni) }

    const fileName = video.pdfFile || (video.pdfFileUrl ? video.pdfFileUrl.split('/').pop() : `${video.bunnyVideoId}.pdf`)
    const blockLines = [userName, u.nationalId ? formatNid(u.nationalId) : '', ...uniLines, u.email || '', u.phone || '', `IP: ${clientIp}`, dateStr, 'MedNinja Co., Ltd.', 'Ref: ' + refId].filter(Boolean)
    const microText = `${u.email || ''} ${formatNid(u.nationalId || '')}`
    const watermarkData = {
      blockLines, microText, userName, refId,
      userId: (u._id || '').toString(), email: u.email || '',
      nationalId: u.nationalId ? formatNid(u.nationalId) : '',
      phone: u.phone || '', clientIp, dateStr, nameEn,
      university: u.university || '',
      pdfTitle: `${section.code} - ${video.title} | MedNinja LMS`
    }

    // ═══ ใช้ PDF Service (ถ้าตั้งไว้) หรือ fallback Worker Thread ═══
    let resultBytes
    if (PDF_SERVICE_URL && PDF_API_KEY) {
      console.log(`[PDF] → PDF Service: ${fileName} for ${userName}`)
      resultBytes = await watermarkViaPdfService(fileName, watermarkData)
    } else {
      console.log(`[PDF] → Worker Thread (fallback): ${fileName} for ${userName}`)
      const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
      const storageKey = process.env.BUNNY_STORAGE_API_KEY
      const storageUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`
      const pdfResp = await fetch(storageUrl, { headers: { 'AccessKey': storageKey } })
      if (!pdfResp.ok) return res.status(502).json({ message: 'ดึง PDF ไม่สำเร็จ' })
      const pdfBytes = Buffer.from(await pdfResp.arrayBuffer())
      resultBytes = await new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'pdf.worker.js'), {
          workerData: { pdfBuffer: pdfBytes, ...watermarkData }
        })
        worker.on('message', (msg) => { if (msg.ok) resolve(msg.resultBytes); else reject(new Error(msg.error)) })
        worker.on('error', reject)
        worker.on('exit', (code) => { if (code !== 0) reject(new Error(`Worker exit ${code}`)) })
      })
    }

    const titleClean = (video.title || `video${idx}`).replace(/\s+/g, '_')
    const nameClean = `${u.firstName || ''}${u.lastName ? '_' + u.lastName : ''}`.replace(/\s+/g, '_') || 'student'
    const downloadName = `${nameClean}_${titleClean}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
    res.setHeader('Content-Length', resultBytes.length)
    res.send(Buffer.from(resultBytes))

    // Activity Log — PDF download
    try {
      const { logActivity, getIp, parseUA } = require('../activity/activity.service')
      const uaInfo = parseUA(req.headers['user-agent'])
      logActivity({
        userId, userName, userEmail: u.email,
        action: 'pdf_download',
        sectionId: section._id.toString(), sectionName: section.code,
        videoIndex: idx, videoTitle: video.title,
        detail: fileName,
        ip: clientIp, ...uaInfo, userAgent: req.headers['user-agent'] || ''
      })
    } catch {}

    // บันทึก download log ใน DB + ส่ง email (fire-and-forget)
    const PdfDownloadLog = require('./PdfDownloadLog.model')
    ;(async () => {
      let emailSent = false, emailError = ''
      try {
        const nodemailer = require('nodemailer')
        const host = process.env.SMTP_HOST
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS
        if (!host || !smtpUser || !smtpPass || !u.email) return

        const transporter = nodemailer.createTransport({
          host, port: parseInt(process.env.SMTP_PORT || '587'),
          secure: (process.env.SMTP_PORT || '587') === '465',
          auth: { user: smtpUser, pass: smtpPass }
        })

        await transporter.sendMail({
          from: `"MedNinja Academy" <${process.env.SMTP_FROM || smtpUser}>`,
          to: u.email,
          subject: `[MedNinja] ยืนยันการยอมรับข้อตกลงและดาวน์โหลดเอกสาร — Ref: ${refId}`,
          html: `
            <div style="font-family:'Noto Sans Thai',sans-serif;max-width:500px;margin:0 auto;padding:24px;">
              <div style="background:#0f172a;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                <h2 style="margin:0;font-size:18px;">MedNinja Academy</h2>
                <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">PDF Download Confirmation</p>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
                <p style="color:#1e293b;font-size:14px;">เรียน <strong>${userName}</strong>,</p>
                <p style="color:#475569;font-size:13px;">คุณได้กดปุ่มยอมรับข้อตกลงการใช้งานเอกสารและดาวน์โหลดเรียบร้อยแล้ว</p>
                <p style="color:#94a3b8;font-size:11px;">ยืนยันจาก IP: ${clientIp} เมื่อ ${dateStr}</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0;font-size:12px;color:#475569;">
                  <p style="margin:0 0 6px;font-weight:700;color:#0f172a;">ข้อตกลงที่ยอมรับ:</p>
                  <p style="margin:0 0 4px;">• เอกสารนี้จัดทำขึ้นเพื่อประกอบการศึกษาของคุณโดยเฉพาะ</p>
                  <p style="margin:0 0 4px;">• เอกสารถูกฝังระบบป้องกันขั้นสูงเพื่อระบุตัวตนผู้ดาวน์โหลด</p>
                  <p style="margin:0 0 4px;">• ไม่ถ่ายเอกสาร สแกน screenshot หรือส่งต่อให้ผู้อื่น</p>
                  <p style="margin:0;">• ไม่โพสต์ลง Facebook, LINE, หรือกลุ่มใดๆ</p>
                </div>
                <table style="width:100%;font-size:13px;color:#334155;margin:16px 0;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#94a3b8;width:100px;">Ref</td><td style="font-weight:700;">${refId}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">เอกสาร</td><td>${video.title || '-'}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">Section</td><td>${section.code} — ${section.name}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">IP</td><td>${clientIp}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">วันที่</td><td>${dateStr}</td></tr>
                </table>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:16px;">
                  <p style="color:#334155;font-size:12px;margin:0 0 4px;">เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537 ซึ่งมีทั้งโทษทางแพ่งและอาญา</p>
                  <p style="color:#334155;font-size:12px;font-weight:700;margin:0;">บริษัท เมดนินจา จำกัด สงวนสิทธิ์ในการดำเนินการตามกฎหมายหากพบการเผยแพร่โดยไม่ได้รับอนุญาต</p>
                </div>
              </div>
            </div>
          `,
        })
        emailSent = true
        console.log(`[PDF Email] sent to ${u.email} ref=${refId}`)
      } catch (e) {
        emailError = e.message
        console.error('[PDF Email] error:', e.message)
      }

      // LINE แจ้ง admin ว่ามีคนดาวน์โหลด PDF
      try {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'
        if (lineToken) {
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({
              to: ADMIN_UID,
              messages: [{
                type: 'flex',
                altText: `PDF: ${userName} — ${video.title}`,
                contents: {
                  type: 'bubble', size: 'kilo',
                  header: { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', paddingAll: '14px', contents: [
                    { type: 'text', text: 'PDF Downloaded', color: '#FFFFFF', size: 'sm', weight: 'bold' }
                  ]},
                  body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', contents: [
                    { type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: userName, size: 'md', weight: 'bold', color: '#1e293b', flex: 0 }
                    ]},
                    { type: 'separator', color: '#e2e8f0' },
                    { type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'Ref', size: 'xs', color: '#94a3b8', flex: 2 },
                      { type: 'text', text: refId, size: 'xs', weight: 'bold', color: '#3b82f6', flex: 5 }
                    ]},
                    { type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'Doc', size: 'xs', color: '#94a3b8', flex: 2 },
                      { type: 'text', text: `${video.title} (${section.code})`, size: 'xs', flex: 5, wrap: true }
                    ]},
                    { type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'Email', size: 'xs', color: '#94a3b8', flex: 2 },
                      { type: 'text', text: u.email || '-', size: 'xs', flex: 5, wrap: true }
                    ]},
                    { type: 'box', layout: 'horizontal', contents: [
                      { type: 'text', text: 'IP', size: 'xs', color: '#94a3b8', flex: 2 },
                      { type: 'text', text: clientIp, size: 'xs', flex: 5 }
                    ]}
                  ]}
                }
              }]
            })
          }).catch(() => {})
        }
      } catch {}


      // บันทึก log ใน DB — หลักฐานทาง electronic
      try {
        await PdfDownloadLog.create({
          userId: u._id,
          userName,
          userEmail: u.email || '',
          nationalId: u.nationalId || '',
          phone: u.phone || '',
          university: u.university || '',
          sectionId: section._id,
          sectionCode: section.code,
          sectionName: section.name,
          videoTitle: video.title || '',
          bunnyVideoId: video.bunnyVideoId || '',
          refId,
          ip: clientIp,
          userAgent: req.headers['user-agent'] || '',
          emailSent,
          emailError,
          fileSize: resultBytes.length
        })
      } catch (e) { console.error('[PDF Log] error:', e.message) }
    })()
  } catch (err) {
    console.error('PDF download error:', err.message)
    res.status(500).json({ message: 'ดาวน์โหลด PDF ไม่สำเร็จ' })
  }
}

/**
 * GET /api/my/sections/:id/pdf
 * ดาวน์โหลด Section-level PDF พร้อมลายน้ำ
 */
/**
 * GET /api/my/sections/:id/topic-pdf/:topicName
 * GET /api/my/sections/:id/subtopic-pdf/:subtopicName
 * ดาวน์โหลด Topic/Subtopic PDF พร้อมลายน้ำ
 */
exports.downloadGroupPdf = async (req, res) => {
  try {
    const userId = req.user._id
    const section = await Section.findById(req.params.id).lean()
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    // หา filename จาก topic/subtopic map
    const isSubtopic = req.path.includes('subtopic-pdf')
    const groupName = decodeURIComponent(req.params.topicName || req.params.subtopicName || '')
    const rawMap = isSubtopic ? (section.subtopicPdfMap || {}) : (section.topicPdfMap || {})
    const map = rawMap instanceof Map ? Object.fromEntries(rawMap) : rawMap
    const fileName = map[groupName]
    if (!fileName) return res.status(404).json({ message: `ไม่มี PDF สำหรับ ${isSubtopic ? 'Subtopic' : 'Topic'} นี้` })

    // ตรวจสิทธิ์ (admin ก็ถูก gate)
    {
      const now = new Date()
      const activations = await Activation.find({ userId, isActive: true, expiresAt: { $gt: now } }).select('packageId tier').lean()
      const packageIds = activations.map(a => a.packageId)
      const matchingPkgs = await Package.find({ _id: { $in: packageIds }, sections: section._id }).select('_id').lean()
      if (matchingPkgs.length === 0) return res.status(403).json({ message: 'ไม่มีสิทธิ์ดาวน์โหลด' })

      const matchingPkgIds = new Set(matchingPkgs.map(p => p._id.toString()))
      const userTier = activations
        .filter(a => matchingPkgIds.has(a.packageId.toString()))
        .reduce((max, a) => Math.max(max, a.tier || 6), 0)

      const canAccessGroup = section.videos.some(v =>
        (v.topic === groupName || v.subtopic === groupName) &&
        userTier >= (v.requiredTier || 6)
      )
      if (!canAccessGroup) {
        return res.status(403).json({
          code: 'TIER_LOCKED',
          message: 'เอกสารกลุ่มนี้เปิดให้ดาวน์โหลดเมื่อมีสิทธิ์ดูวีดีโอในกลุ่ม'
        })
      }
    }

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
      const cutWords = ['มหาวิทยาลัย','สถาบัน','วิทยาลัย','คณะ','UNIVERSITY','COLLEGE','INSTITUTE']
      let cut = -1
      for (const w of cutWords) { const i = uni.indexOf(w, 5); if (i > 5 && i < uni.length - 5) { cut = i; break } }
      if (cut > 0) { uniLines.push(uni.slice(0, cut)); uniLines.push(uni.slice(cut)) }
      else { const mid = Math.ceil(uni.length / 2); uniLines.push(uni.slice(0, mid)); uniLines.push(uni.slice(mid)) }
    } else if (uni) { uniLines.push(uni) }

    const blockLines = [userName, u.nationalId ? formatNid(u.nationalId) : '', ...uniLines, u.email || '', u.phone || '', `IP: ${clientIp}`, dateStr, 'MedNinja Co., Ltd.', 'Ref: ' + refId].filter(Boolean)
    const microText = `${u.email || ''} ${formatNid(u.nationalId || '')}`
    const watermarkData = {
      blockLines, microText, userName, refId,
      userId: (u._id || '').toString(), email: u.email || '',
      nationalId: u.nationalId ? formatNid(u.nationalId) : '',
      phone: u.phone || '', clientIp, dateStr, nameEn,
      university: u.university || '',
      pdfTitle: `${section.code} - ${groupName} | MedNinja LMS`
    }

    let resultBytes
    if (PDF_SERVICE_URL && PDF_API_KEY) {
      resultBytes = await watermarkViaPdfService(fileName, watermarkData)
    } else {
      const storageZone = process.env.BUNNY_STORAGE_ZONE || 'medninja-docs'
      const storageKey = process.env.BUNNY_STORAGE_API_KEY
      const pdfResp = await fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`, { headers: { 'AccessKey': storageKey } })
      if (!pdfResp.ok) return res.status(502).json({ message: 'ดึง PDF ไม่สำเร็จ' })
      const pdfBytes = Buffer.from(await pdfResp.arrayBuffer())
      resultBytes = await new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'pdf.worker.js'), { workerData: { pdfBuffer: pdfBytes, ...watermarkData } })
        worker.on('message', (msg) => { if (msg.ok) resolve(msg.resultBytes); else reject(new Error(msg.error)) })
        worker.on('error', reject)
        worker.on('exit', (code) => { if (code !== 0) reject(new Error('Worker exit ' + code)) })
      })
    }

    const nameClean = `${u.firstName || ''}${u.lastName ? '_' + u.lastName : ''}`.replace(/\s+/g, '_') || 'student'
    const downloadName = `${nameClean}_${groupName.replace(/\s+/g, '_')}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`)
    res.setHeader('Content-Length', resultBytes.length)
    res.send(Buffer.from(resultBytes))

    // Log
    ;(async () => {
      try {
        const PdfDownloadLog = require('./PdfDownloadLog.model')
        await PdfDownloadLog.create({
          userId: u._id, userName, userEmail: u.email || '',
          nationalId: u.nationalId || '', phone: u.phone || '', university: u.university || '',
          sectionId: section._id, sectionCode: section.code, sectionName: section.name,
          videoTitle: `[${isSubtopic ? 'Subtopic' : 'Topic'}] ${groupName}`,
          bunnyVideoId: '', refId, ip: clientIp,
          userAgent: req.headers['user-agent'] || '', fileSize: resultBytes.length
        })
      } catch {}
    })()
  } catch (err) {
    console.error('Group PDF download error:', err.message)
    res.status(500).json({ message: 'ดาวน์โหลด PDF ไม่สำเร็จ' })
  }
}

/**
 * POST /api/admin/sections/:id/videos/:idx/upload-pdf
 * Admin upload PDF per video
 */
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'กรุณาเลือกไฟล์ PDF' })

    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    const idx = parseInt(req.params.idx, 10)
    const sortedVideos = [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    if (isNaN(idx) || idx < 0 || idx >= sortedVideos.length) {
      return res.status(404).json({ message: 'ไม่พบวีดีโอ' })
    }

    const storageZone = process.env.BUNNY_STORAGE_ZONE
    const storageKey = process.env.BUNNY_STORAGE_API_KEY
    const storageHost = process.env.BUNNY_STORAGE_HOSTNAME

    if (!storageZone || !storageKey) {
      return res.status(500).json({ message: 'Bunny Storage ยังไม่ได้ setup' })
    }

    // ใช้ bunnyVideoId เป็นชื่อไฟล์ → upload ใหม่ = ทับเก่า ไม่สร้างซ้ำ
    const fileName = `${sortedVideos[idx].bunnyVideoId}.pdf`
    const uploadUrl = `https://sg.storage.bunnycdn.com/${storageZone}/${fileName}`

    console.log(`[PDF Upload] zone=${storageZone} key=${storageKey?.slice(0,8)}... file=${fileName} size=${req.file.size}`)

    const uploadResp = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'AccessKey': storageKey, 'Content-Type': 'application/pdf' },
      body: req.file.buffer
    })

    console.log(`[PDF Upload] Bunny response: ${uploadResp.status}`)

    if (!uploadResp.ok) {
      const body = await uploadResp.text()
      console.error(`[PDF Upload] FAIL: ${uploadResp.status} ${body}`)
      return res.status(502).json({ message: `Upload ไม่สำเร็จ: ${body}` })
    }

    const cdnUrl = storageHost
      ? `https://${storageHost}/${fileName}`
      : `https://${storageZone}.b-cdn.net/${fileName}`

    // บันทึกใน video ทุกตัวที่มี bunnyVideoId เดียวกัน (ทั้ง section นี้)
    const targetUuid = sortedVideos[idx].bunnyVideoId
    for (const v of section.videos) {
      if (v.bunnyVideoId === targetUuid) {
        v.pdfFileUrl = cdnUrl
        v.pdfFileName = v.title + '.pdf'
      }
    }
    await section.save()

    // อัพเดท section อื่นที่มี video UUID เดียวกันด้วย (fire-and-forget)
    Section.find({ 'videos.bunnyVideoId': targetUuid, _id: { $ne: section._id } }).then(async (others) => {
      for (const sec of others) {
        let changed = false
        for (const v of sec.videos) {
          if (v.bunnyVideoId === targetUuid) {
            v.pdfFileUrl = cdnUrl
            v.pdfFileName = v.title + '.pdf'
            changed = true
          }
        }
        if (changed) await sec.save()
      }
    }).catch(() => {})

    res.json({ ok: true, pdfFileUrl: cdnUrl, pdfFileName: sortedVideos[idx].title + '.pdf' })
  } catch (err) {
    console.error('PDF upload error:', err.message)
    res.status(500).json({ message: 'Upload ไม่สำเร็จ' })
  }
}

/**
 * DELETE /api/admin/sections/:id/videos/:idx/pdf
 */
exports.deletePdf = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    const idx = parseInt(req.params.idx, 10)
    const sortedVideos = [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    if (isNaN(idx) || idx < 0 || idx >= sortedVideos.length) {
      return res.status(404).json({ message: 'ไม่พบวีดีโอ' })
    }

    const video = sortedVideos[idx]

    // ลบจาก Bunny Storage
    if (video.pdfFileUrl) {
      const storageZone = process.env.BUNNY_STORAGE_ZONE
      const storageKey = process.env.BUNNY_STORAGE_API_KEY
      if (storageZone && storageKey) {
        const fn = video.pdfFileUrl.split('/').pop()
        fetch(`https://sg.storage.bunnycdn.com/${storageZone}/${fn}`, {
          method: 'DELETE', headers: { 'AccessKey': storageKey }
        }).catch(() => {})
      }
    }

    // ล้างใน DB
    const origIdx = section.videos.findIndex(v =>
      v.bunnyVideoId === sortedVideos[idx].bunnyVideoId && v.title === sortedVideos[idx].title
    )
    if (origIdx >= 0) {
      section.videos[origIdx].pdfFileUrl = ''
      section.videos[origIdx].pdfFileName = ''
      await section.save()
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('PDF delete error:', err.message)
    res.status(500).json({ message: 'ลบไม่สำเร็จ' })
  }
}

// ═══ PDF Async — นักเรียนเห็น progress ═══
// เก็บ jobId → PDF Service jobId mapping
const userJobs = new Map()

// Dedup: userId|fileName → localJobId (คนเดิม ขอไฟล์เดิมซ้ำตอนยังไม่เสร็จ → ใช้ jobId เดิม)
const activeUserJobKey = new Map()
function userJobKey(userId, fileName) { return `${userId || '_'}|${fileName}` }

// ═══ Per-user lock — 1 user 1 job at a time (กัน RAM พุ่ง + กันเปิดหลาย tab) ═══
// เก็บเป็น { state: 'pending'|'active', localJobId, createdAt, title }
// pending = จองช่อง (sync ทันทีตอน request เข้า) → กัน race condition จาก tab พร้อมกัน
// active = submit PDF Service สำเร็จ มี localJobId จริง
const activeUserLock = new Map()
const LOCK_PENDING_TTL = 30 * 1000 // pending lock หมดอายุ 30 วิ (กรณีตายระหว่างทาง)

function tryAcquireUserLock(userId) {
  const uid = userId.toString()
  const existing = activeUserLock.get(uid)
  if (existing) {
    // pending เก่าเกินไป → ถือว่าตาย ปล่อย slot
    if (existing.state === 'pending' && Date.now() - existing.createdAt > LOCK_PENDING_TTL) {
      activeUserLock.delete(uid)
    } else if (existing.state === 'active' && !userJobs.has(existing.localJobId)) {
      // active แต่ job หาย (ถูก cleanup) → ปล่อย
      activeUserLock.delete(uid)
    } else {
      return { ok: false, existing }
    }
  }
  const ticket = { state: 'pending', localJobId: null, createdAt: Date.now(), title: '' }
  activeUserLock.set(uid, ticket)
  return { ok: true, ticket }
}
function finalizeUserLock(userId, localJobId, title) {
  const uid = userId.toString()
  const t = activeUserLock.get(uid)
  if (!t) return
  t.state = 'active'
  t.localJobId = localJobId
  t.title = title || ''
}
function releaseUserLock(userId, localJobIdOrTicket) {
  const uid = userId.toString()
  const t = activeUserLock.get(uid)
  if (!t) return
  // release ได้ถ้า: เป็น ticket ตัวเดียวกัน หรือ localJobId ตรงกัน
  if (t === localJobIdOrTicket || t.localJobId === localJobIdOrTicket) {
    activeUserLock.delete(uid)
  }
}

// cleanup ทุก 5 นาที
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000
  for (const [k, v] of userJobs) {
    if (v.createdAt < cutoff) {
      if (v.dedupKey && activeUserJobKey.get(v.dedupKey) === k) activeUserJobKey.delete(v.dedupKey)
      if (v.userId) releaseUserLock(v.userId, k)
      userJobs.delete(k)
    }
  }
}, 5 * 60 * 1000)

/**
 * POST /api/my/sections/:id/videos/:idx/pdf-start
 * เริ่ม watermark job → return { jobId } ทันที
 */
exports.startPdfJob = async (req, res) => {
  try {
    if (!PDF_SERVICE_URL || !PDF_API_KEY) return res.status(500).json({ message: 'PDF Service not configured' })

    const userId = req.user._id
    const section = await Section.findById(req.params.id).lean()
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    const idx = parseInt(req.params.idx, 10)
    const sortedVideos = [...section.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    if (isNaN(idx) || idx < 0 || idx >= sortedVideos.length) return res.status(404).json({ message: 'ไม่พบวีดีโอ' })

    const video = sortedVideos[idx]
    const isBonus = req.query.bonus === '1'
    const effectivePdfFile = isBonus ? (video.bonusPdfFile || '') : (video.pdfFile || '')
    const effectivePdfFileUrl = isBonus ? '' : (video.pdfFileUrl || '')
    if (!effectivePdfFile && !effectivePdfFileUrl) return res.status(404).json({ message: isBonus ? 'เอกสารเสริมยังไม่มี PDF' : 'วีดีโอนี้ไม่มีเอกสาร PDF' })

    // ═══ Dedup: คนเดิม + ไฟล์เดิม ที่ยังกำลังรันอยู่ → คืน jobId เดิม ═══
    const fileNameEarly = effectivePdfFile || (effectivePdfFileUrl ? effectivePdfFileUrl.split('/').pop() : `${video.bunnyVideoId}.pdf`)
    const dedupKey = userJobKey(userId.toString(), fileNameEarly)
    const existingLocalId = activeUserJobKey.get(dedupKey)
    if (existingLocalId && userJobs.has(existingLocalId)) {
      return res.json({ jobId: existingLocalId, reused: true })
    }

    // ═══ Per-user lock: 1 คน 1 ไฟล์ในคิว (atomic — กัน race จากเปิดหลาย tab) ═══
    const lockResult = tryAcquireUserLock(userId)
    if (!lockResult.ok) {
      const ex = lockResult.existing
      const j = ex.localJobId ? userJobs.get(ex.localJobId) : null
      return res.status(429).json({
        code: 'USER_BUSY',
        message: `กรุณารอเอกสาร "${ex.title || j?.video?.title || 'เล่มก่อนหน้า'}" ดาวน์โหลดเสร็จก่อน แล้วจึงเริ่มเล่มใหม่`,
        currentJobId: ex.localJobId || null,
        currentTitle: ex.title || j?.video?.title || ''
      })
    }
    const lockTicket = lockResult.ticket

    try {
    // ตรวจสิทธิ์ (admin ก็ถูก gate)
    {
      const now = new Date()
      const activations = await Activation.find({ userId, isActive: true, expiresAt: { $gt: now } }).select('packageId tier').lean()
      const matchingPkgs = await Package.find({ _id: { $in: activations.map(a => a.packageId) }, sections: section._id }).select('_id').lean()
      if (matchingPkgs.length === 0) { releaseUserLock(userId, lockTicket); return res.status(403).json({ message: 'ไม่มีสิทธิ์ดาวน์โหลด' }) }

      const matchingPkgIds = new Set(matchingPkgs.map(p => p._id.toString()))
      const userTier = activations
        .filter(a => matchingPkgIds.has(a.packageId.toString()))
        .reduce((max, a) => Math.max(max, a.tier || 6), 0)

      // bonus = tier 6 ตายตัว, video หลัก = requiredTier
      const required = isBonus ? 6 : (video.requiredTier || 6)
      if (userTier < required) {
        releaseUserLock(userId, lockTicket)
        return res.status(403).json({
          code: 'TIER_LOCKED',
          requiredTier: required,
          message: `เอกสารนี้เปิดให้ดาวน์โหลดเมื่อปลดล็อกระดับ ${required} ขึ้นไป`
        })
      }
    }

    // Anomaly check
    try {
      const PdfDownloadLog = require('./PdfDownloadLog.model')
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentCount = await PdfDownloadLog.countDocuments({ userId, createdAt: { $gte: oneHourAgo } })
      const sameFileCount = await PdfDownloadLog.countDocuments({ userId, bunnyVideoId: video.bunnyVideoId, createdAt: { $gte: oneHourAgo } })
      if (sameFileCount >= 3 || recentCount >= 10) {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        if (lineToken) {
          const alertType = sameFileCount >= 3 ? `ไฟล์เดิม ${sameFileCount} ครั้ง/ชม.` : `${recentCount} ไฟล์/ชม.`
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({ to: 'U2b0de81f0ec73e8561197393683a9e95', messages: [{ type: 'text', text: `⚠️ PDF Download ผิดปกติ!\n\n${req.user.email}\n${video.title}\n${alertType}` }] })
          }).catch(() => {})
        }
      }
    } catch {}

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

    const fileName = fileNameEarly
    const blockLines = [userName, u.nationalId ? formatNid(u.nationalId) : '', ...uniLines, u.email || '', u.phone || '', `IP: ${clientIp}`, dateStr, 'MedNinja Co., Ltd.', 'Ref: ' + refId].filter(Boolean)

    // Submit ไป PDF Service
    const submitResp = await fetch(`${PDF_SERVICE_URL}/watermark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': PDF_API_KEY },
      body: JSON.stringify({
        fileName, blockLines,
        microText: `${u.email || ''} ${formatNid(u.nationalId || '')}`,
        userName, refId, userId: (u._id || '').toString(), email: u.email || '',
        nationalId: u.nationalId ? formatNid(u.nationalId) : '',
        phone: u.phone || '', clientIp, dateStr, nameEn,
        university: u.university || '',
        pdfTitle: `${section.code} - ${video.title} | MedNinja LMS`
      })
    })
    const submitData = await submitResp.json()
    if (!submitResp.ok) { releaseUserLock(userId, lockTicket); return res.status(502).json({ message: submitData.message || 'PDF Service error' }) }

    // เก็บ mapping
    const localJobId = `${userId}-${Date.now()}`
    const displayTitle = isBonus ? (video.bonusTitle || video.title) : video.title
    userJobs.set(localJobId, {
      pdfJobId: submitData.jobId,
      userId, section,
      video: { ...video, title: displayTitle },
      userName, refId, clientIp, dateStr,
      dedupKey,
      createdAt: Date.now()
    })
    activeUserJobKey.set(dedupKey, localJobId)
    finalizeUserLock(userId, localJobId, displayTitle)

    res.json({ jobId: localJobId })
    } catch (innerErr) {
      releaseUserLock(userId, lockTicket)
      throw innerErr
    }
  } catch (err) {
    console.error('PDF start error:', err.message)
    res.status(500).json({ message: 'เริ่มดาวน์โหลดไม่สำเร็จ' })
  }
}

/**
 * POST /api/my/sections/:id/group-pdf-start/:type/:groupName
 * เริ่ม watermark job สำหรับ topic/subtopic PDF
 */
exports.startGroupPdfJob = async (req, res) => {
  try {
    if (!PDF_SERVICE_URL || !PDF_API_KEY) return res.status(500).json({ message: 'PDF Service not configured' })

    const userId = req.user._id
    const section = await Section.findById(req.params.id).lean()
    if (!section) return res.status(404).json({ message: 'ไม่พบ Section' })

    const isSubtopic = req.params.type === 'subtopic'
    const groupName = decodeURIComponent(req.params.groupName || '')
    const rawMap = isSubtopic ? (section.subtopicPdfMap || {}) : (section.topicPdfMap || {})
    const map = rawMap instanceof Map ? Object.fromEntries(rawMap) : rawMap
    const fileName = map[groupName]
    if (!fileName) return res.status(404).json({ message: `ไม่มี PDF สำหรับ ${isSubtopic ? 'Subtopic' : 'Topic'} นี้` })

    // ═══ Dedup: คนเดิม + ไฟล์เดิม ที่ยังกำลังรันอยู่ → คืน jobId เดิม ═══
    const dedupKey = userJobKey(userId.toString(), fileName)
    const existingLocalId = activeUserJobKey.get(dedupKey)
    if (existingLocalId && userJobs.has(existingLocalId)) {
      return res.json({ jobId: existingLocalId, reused: true })
    }

    // ═══ Per-user lock: 1 คน 1 ไฟล์ในคิว (atomic — กัน race จากเปิดหลาย tab) ═══
    const lockResult = tryAcquireUserLock(userId)
    if (!lockResult.ok) {
      const ex = lockResult.existing
      const j = ex.localJobId ? userJobs.get(ex.localJobId) : null
      return res.status(429).json({
        code: 'USER_BUSY',
        message: `กรุณารอเอกสาร "${ex.title || j?.video?.title || 'เล่มก่อนหน้า'}" ดาวน์โหลดเสร็จก่อน แล้วจึงเริ่มเล่มใหม่`,
        currentJobId: ex.localJobId || null,
        currentTitle: ex.title || j?.video?.title || ''
      })
    }
    const lockTicket = lockResult.ticket

    try {
    // ตรวจสิทธิ์ + group tier gate (admin ก็ถูก gate)
    {
      const now = new Date()
      const activations = await Activation.find({ userId, isActive: true, expiresAt: { $gt: now } }).select('packageId tier').lean()
      const matchingPkgs = await Package.find({ _id: { $in: activations.map(a => a.packageId) }, sections: section._id }).select('_id').lean()
      if (matchingPkgs.length === 0) { releaseUserLock(userId, lockTicket); return res.status(403).json({ message: 'ไม่มีสิทธิ์ดาวน์โหลด' }) }

      const matchingPkgIds = new Set(matchingPkgs.map(p => p._id.toString()))
      const userTier = activations
        .filter(a => matchingPkgIds.has(a.packageId.toString()))
        .reduce((max, a) => Math.max(max, a.tier || 6), 0)

      const canAccessGroup = section.videos.some(v =>
        (v.topic === groupName || v.subtopic === groupName) &&
        userTier >= (v.requiredTier || 6)
      )
      if (!canAccessGroup) {
        releaseUserLock(userId, lockTicket)
        return res.status(403).json({
          code: 'TIER_LOCKED',
          message: 'เอกสารกลุ่มนี้เปิดให้ดาวน์โหลดเมื่อมีสิทธิ์ดูวีดีโอในกลุ่ม'
        })
      }
    }

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
      const cutWords = ['มหาวิทยาลัย','สถาบัน','วิทยาลัย','คณะ','UNIVERSITY','COLLEGE','INSTITUTE']
      let cut = -1
      for (const w of cutWords) { const i2 = uni.indexOf(w, 5); if (i2 > 5 && i2 < uni.length - 5) { cut = i2; break } }
      if (cut > 0) { uniLines.push(uni.slice(0, cut)); uniLines.push(uni.slice(cut)) }
      else { const mid = Math.ceil(uni.length / 2); uniLines.push(uni.slice(0, mid)); uniLines.push(uni.slice(mid)) }
    } else if (uni) { uniLines.push(uni) }

    const blockLines = [userName, u.nationalId ? formatNid(u.nationalId) : '', ...uniLines, u.email || '', u.phone || '', `IP: ${clientIp}`, dateStr, 'MedNinja Co., Ltd.', 'Ref: ' + refId].filter(Boolean)

    const submitResp = await fetch(`${PDF_SERVICE_URL}/watermark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': PDF_API_KEY },
      body: JSON.stringify({
        fileName, blockLines,
        microText: `${u.email || ''} ${formatNid(u.nationalId || '')}`,
        userName, refId, userId: (u._id || '').toString(), email: u.email || '',
        nationalId: u.nationalId ? formatNid(u.nationalId) : '',
        phone: u.phone || '', clientIp, dateStr, nameEn,
        university: u.university || '',
        pdfTitle: `${section.code} - ${groupName} | MedNinja LMS`
      })
    })
    const submitData = await submitResp.json()
    if (!submitResp.ok) { releaseUserLock(userId, lockTicket); return res.status(502).json({ message: submitData.message || 'PDF Service error' }) }

    const localJobId = `${userId}-${Date.now()}`
    userJobs.set(localJobId, {
      pdfJobId: submitData.jobId,
      userId, section, video: { title: groupName, bunnyVideoId: '' },
      userName, refId, clientIp, dateStr, isGroup: true, groupName, isSubtopic,
      dedupKey,
      createdAt: Date.now()
    })
    activeUserJobKey.set(dedupKey, localJobId)
    finalizeUserLock(userId, localJobId, groupName)

    res.json({ jobId: localJobId })
    } catch (innerErr) {
      releaseUserLock(userId, lockTicket)
      throw innerErr
    }
  } catch (err) {
    console.error('Group PDF start error:', err.message)
    res.status(500).json({ message: 'เริ่มดาวน์โหลดไม่สำเร็จ' })
  }
}

/**
 * GET /api/my/pdf-job/:jobId/status
 */
exports.getPdfJobStatus = async (req, res) => {
  try {
    const job = userJobs.get(req.params.jobId)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const resp = await fetch(`${PDF_SERVICE_URL}/status/${job.pdfJobId}`, {
      headers: { 'X-API-Key': PDF_API_KEY }
    })
    const data = await resp.json()

    // ถ้า PDF Service บอก error → ปลดล็อก user ทันที (ไม่ต้องรอ cleanup 5 นาที)
    if (data && data.status === 'error') {
      if (job.dedupKey && activeUserJobKey.get(job.dedupKey) === req.params.jobId) activeUserJobKey.delete(job.dedupKey)
      if (job.userId) releaseUserLock(job.userId, req.params.jobId)
      userJobs.delete(req.params.jobId)
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/**
 * POST /api/my/pdf-job/:jobId/cancel — ยกเลิกงาน (ปลดล็อก user)
 */
exports.cancelPdfJob = async (req, res) => {
  const job = userJobs.get(req.params.jobId)
  if (!job) return res.json({ ok: true })
  // เฉพาะเจ้าของ job ปลดได้
  if (job.userId && job.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'ไม่ใช่งานของคุณ' })
  }
  if (job.dedupKey && activeUserJobKey.get(job.dedupKey) === req.params.jobId) activeUserJobKey.delete(job.dedupKey)
  if (job.userId) releaseUserLock(job.userId, req.params.jobId)
  userJobs.delete(req.params.jobId)
  res.json({ ok: true })
}

/**
 * GET /api/my/pdf-job/:jobId/download
 */
exports.downloadPdfJob = async (req, res) => {
  try {
    const job = userJobs.get(req.params.jobId)
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
    const { video, section, userName, refId, clientIp, dateStr } = job
    const titleClean = (video.title || 'document').replace(/\s+/g, '_')
    const nameClean = `${u.firstName || ''}${u.lastName ? '_' + u.lastName : ''}`.replace(/\s+/g, '_') || 'student'
    const downloadName = `${nameClean}_${titleClean}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
    res.setHeader('Content-Length', resultBytes.length)
    res.send(resultBytes)

    // Fire-and-forget: email + LINE + log
    ;(async () => {
      try {
        const nodemailer = require('nodemailer')
        const host = process.env.SMTP_HOST, smtpUser = process.env.SMTP_USER, smtpPass = process.env.SMTP_PASS
        if (host && smtpUser && smtpPass && u.email) {
          const transporter = nodemailer.createTransport({ host, port: parseInt(process.env.SMTP_PORT || '587'), secure: (process.env.SMTP_PORT || '587') === '465', auth: { user: smtpUser, pass: smtpPass } })
          await transporter.sendMail({
            from: `"MedNinja Academy" <${process.env.SMTP_FROM || smtpUser}>`, to: u.email,
            subject: `[MedNinja] ยืนยันการดาวน์โหลดเอกสาร — Ref: ${refId}`,
            html: `<p>เรียน ${userName},</p><p>คุณได้ดาวน์โหลดเอกสาร "${video.title}" (${section.code}) สำเร็จ</p><p>Ref: ${refId} | IP: ${clientIp} | ${dateStr}</p><p>เอกสารนี้ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537</p>`
          })
        }
      } catch {}
      try {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        if (lineToken) {
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lineToken}` },
            body: JSON.stringify({ to: 'U2b0de81f0ec73e8561197393683a9e95', messages: [{ type: 'flex', altText: `PDF: ${userName} — ${video.title}`, contents: { type: 'bubble', size: 'kilo', header: { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', paddingAll: '14px', contents: [{ type: 'text', text: 'PDF Downloaded', color: '#FFFFFF', size: 'sm', weight: 'bold' }] }, body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px', contents: [{ type: 'text', text: userName, size: 'md', weight: 'bold', color: '#1e293b' }, { type: 'separator', color: '#e2e8f0' }, { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'Ref', size: 'xs', color: '#94a3b8', flex: 2 }, { type: 'text', text: refId, size: 'xs', weight: 'bold', color: '#3b82f6', flex: 5 }] }, { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'Doc', size: 'xs', color: '#94a3b8', flex: 2 }, { type: 'text', text: `${video.title} (${section.code})`, size: 'xs', flex: 5, wrap: true }] }, { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: 'IP', size: 'xs', color: '#94a3b8', flex: 2 }, { type: 'text', text: clientIp, size: 'xs', flex: 5 }] }] } } }] })
          }).catch(() => {})
        }
      } catch {}
      try {
        const PdfDownloadLog = require('./PdfDownloadLog.model')
        await PdfDownloadLog.create({
          userId: u._id, userName, userEmail: u.email || '',
          nationalId: u.nationalId || '', phone: u.phone || '', university: u.university || '',
          sectionId: section._id, sectionCode: section.code, sectionName: section.name,
          videoTitle: video.title || '', bunnyVideoId: video.bunnyVideoId || '',
          refId, ip: clientIp, userAgent: req.headers['user-agent'] || '', fileSize: resultBytes.length
        })
      } catch {}
    })()

    if (job.dedupKey && activeUserJobKey.get(job.dedupKey) === req.params.jobId) activeUserJobKey.delete(job.dedupKey)
    if (job.userId) releaseUserLock(job.userId, req.params.jobId)
    userJobs.delete(req.params.jobId)
  } catch (err) {
    console.error('PDF download error:', err.message)
    res.status(500).json({ message: 'ดาวน์โหลดไม่สำเร็จ' })
  }
}

function formatNid(id) {
  if (!id) return ''
  const d = id.replace(/\D/g, '')
  if (d.length !== 13) return id
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`
}
