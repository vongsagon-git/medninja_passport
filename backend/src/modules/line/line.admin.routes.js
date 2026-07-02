/**
 * Admin LINE Dashboard — followers list + send Flex + broadcast + AI chat
 * Merge ข้อมูลจาก LineFollower (webhook) + User (LIFF linked)
 */
const express = require('express')
const router = express.Router()
const LineFollower = require('./LineFollower.model')
const ChatMessage = require('./ChatMessage.model')
const User = require('../user/User.model')
const { pushMessage, broadcastMessage } = require('./line.webhook.service')
const { buildCourseFlex, TEMPLATE_BUILDERS } = require('./line.flex.builders')
const { AIChatConfig, getConfig, clearConfigCache, DEFAULT_PROMPT, DEFAULT_TOOLS, DEFAULT_PAYMENT_OPTIONS } = require('./AIChatConfig.model')
const { FlexTemplate, getAllTemplates, getTemplate, clearTemplateCache, DEFAULT_TEMPLATES } = require('./FlexTemplate.model')

// ─── Flex builders ย้ายไป line.flex.builders.js แล้ว ─────────────────

// ─── Routes ─────────────────────────────────────────

// GET /api/admin/line/stats — LINE follower count
router.get('/stats', async (req, res) => {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) return res.json({ followers: 0 })
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '')
    const resp = await fetch(`https://api.line.me/v2/bot/insight/followers?date=${dateStr}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resp.ok) {
      const data = await resp.json()
      return res.json({ followers: data.followers || 0, targetedReaches: data.targetedReaches || 0, blocks: data.blocks || 0 })
    }
    // fallback: count from DB
    const count = await LineFollower.countDocuments({ isFollowing: true })
    res.json({ followers: count })
  } catch (err) {
    res.json({ followers: 0 })
  }
})

// GET /api/admin/line/followers — merge LineFollower + User (LIFF linked)
router.get('/followers', async (req, res) => {
  try {
    const search = (req.query.search || '').trim()
    const filter = req.query.filter || 'all' // all, following, student, tag:xxx

    // ดึงจาก 2 แหล่ง
    const Activation = require('../activation/Activation.model')
    const Package = require('../content/Package.model')
    const [followers, linkedUsers, activations, packages] = await Promise.all([
      LineFollower.find().lean(),
      User.find({ lineUserId: { $exists: true, $ne: null } })
        .select('lineUserId lineDisplayName linePictureUrl firstName lastName email university role')
        .lean(),
      Activation.find({ isActive: true }).select('userId packageId').lean(),
      Package.find().select('_id title isDemo').lean()
    ])
    // สร้าง map: userId → { courses: ชื่อคอร์สจริง[], hasDemoOnly: boolean }
    const pkgMap = {}
    const demoIds = new Set()
    for (const p of packages) {
      pkgMap[p._id.toString()] = p.title
      if (p.isDemo) demoIds.add(p._id.toString())
    }
    const userCourses = new Map()
    for (const a of activations) {
      const uid = a.userId.toString()
      if (!userCourses.has(uid)) userCourses.set(uid, { real: [], hasDemo: false })
      const pid = a.packageId.toString()
      if (demoIds.has(pid)) {
        userCourses.get(uid).hasDemo = true
      } else {
        const name = pkgMap[pid]
        if (name) userCourses.get(uid).real.push(name)
      }
    }

    // merge: UUID เป็น key
    const merged = new Map()

    // LineFollower ก่อน
    for (const f of followers) {
      merged.set(f.lineUserId, {
        lineUserId: f.lineUserId,
        displayName: f.displayName,
        pictureUrl: f.pictureUrl,
        isFollowing: f.isFollowing,
        followedAt: f.followedAt,
        lastMessageAt: f.lastMessageAt,
        lastMessageText: f.lastMessageText,
        aiMode: f.aiMode || 'human',
        aiPaused: f.aiPaused || false,
        hasEscalation: f.hasEscalation || false,
        adminNote: f.adminNote || '',
        positiveNote: f.positiveNote || '',
        negativeNote: f.negativeNote || '',
        tag: f.tag || 'new',
        nickname: f.nickname || '',
        passedExams: f.passedExams || [],
        segment: f.segment || [],
        parentOf: f.parentOf || '',
        familyUids: f.familyUids || [],
        source: 'webhook',
        isStudent: false,
        studentName: null,
        studentEmail: null,
        university: null
      })
    }

    // User (LIFF linked) — เพิ่มหรือ merge
    for (const u of linkedUsers) {
      // admin ยังแสดงใน Funnel (frontend จัดกลุ่มเอง)
      const existing = merged.get(u.lineUserId)
      const info = userCourses.get(u._id.toString()) || { real: [], hasDemo: false }
      // ถ้ามีคอร์สจริง = แสดงคอร์สจริง, ถ้ามีแค่ demo = "กำลังทดลอง"
      const courses = info.real.length ? info.real : (info.hasDemo ? ['กำลังทดลอง'] : [])
      if (existing) {
        existing.isStudent = true
        existing.studentName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
        existing.studentEmail = u.email
        existing.university = u.university
        existing.courses = courses
        existing.source = 'both'
        // fallback รูป/ชื่อ จาก LIFF ถ้า LineFollower ไม่มี (เช่น สร้างจาก upsert)
        if (!existing.displayName && u.lineDisplayName) existing.displayName = u.lineDisplayName
        if (!existing.pictureUrl && u.linePictureUrl) existing.pictureUrl = u.linePictureUrl
        // admin/staff role → ตั้ง tag ให้ตรง (funnel ใช้ tag จัดกลุ่ม)
        if (u.role === 'admin' || u.role === 'staff') existing.tag = u.role
      } else {
        merged.set(u.lineUserId, {
          lineUserId: u.lineUserId,
          displayName: u.lineDisplayName || '',
          pictureUrl: u.linePictureUrl || '',
          isFollowing: true,
          followedAt: null,
          lastMessageAt: null,
          lastMessageText: '',
          aiMode: 'human',
          aiPaused: false,
          hasEscalation: false,
          adminNote: '',
          tag: (u.role === 'admin' || u.role === 'staff') ? u.role : 'new',
          source: 'liff',
          isStudent: true,
          studentName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          studentEmail: u.email,
          university: u.university,
          courses
        })
      }
    }

    // Fallback: LineFollower ที่มี linkedUserId (admin link มือ) แต่ User ไม่มี lineUserId
    for (const f of followers) {
      if (!f.linkedUserId) continue
      const record = merged.get(f.lineUserId)
      if (!record || record.courses) continue // ถ้ามี courses แล้วไม่ต้องทำซ้ำ
      const info = userCourses.get(f.linkedUserId.toString()) || { real: [], hasDemo: false }
      const courses = info.real.length ? info.real : (info.hasDemo ? ['กำลังทดลอง'] : [])
      if (courses.length) {
        record.courses = courses
        record.isStudent = true
      }
    }

    let list = Array.from(merged.values())

    // filter
    if (filter === 'following') list = list.filter(f => f.isFollowing)
    else if (filter === 'student') list = list.filter(f => f.isStudent)
    else if (filter.startsWith('seg:')) list = list.filter(f => (f.segment || []).includes(filter.replace('seg:', '')))
    else if (filter.startsWith('tag:')) list = list.filter(f => f.tag === filter.replace('tag:', ''))

    // search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        (f.displayName || '').toLowerCase().includes(q) ||
        (f.studentName || '').toLowerCase().includes(q) ||
        (f.studentEmail || '').toLowerCase().includes(q) ||
        (f.university || '').toLowerCase().includes(q)
      )
    }

    // sort: lastMessageAt ล่าสุดขึ้นบน (active ก่อน)
    list.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      if (aTime !== bTime) return bTime - aTime
      return (b.followedAt || 0) - (a.followedAt || 0)
    })

    const stats = {
      total: merged.size,
      following: Array.from(merged.values()).filter(f => f.isFollowing).length,
      students: Array.from(merged.values()).filter(f => f.isStudent).length
    }

    res.json({ followers: list, stats })
  } catch (err) {
    console.error('[Admin LINE] followers error:', err)
    res.status(500).json({ message: 'โหลดข้อมูลล้มเหลว' })
  }
})

// GET /api/admin/line/templates
router.get('/templates', (req, res) => {
  res.json({ templates: [
    { id: 'trial', name: 'ทดลองเรียน', description: 'แนะนำวิธีทดลองเรียน 2 ช่องทาง', color: '#3b82f6', fields: [] },
    { id: 'howto', name: 'วิธีเข้าเรียน', description: 'คำแนะนำนักเรียนใหม่ 3 ขั้นตอน', color: '#16a34a', fields: [] },
    { id: 'quiz', name: 'Daily Quiz', description: 'คำถาม + ตัวเลือก + ปุ่มกดดูเฉลย', color: '#f59e0b',
      fields: [
        { key: 'topic', label: 'หัวข้อ', default: '' },
        { key: 'question', label: 'คำถาม', default: '' },
        { key: 'optionA', label: 'ตัวเลือก A', default: '' },
        { key: 'optionB', label: 'ตัวเลือก B', default: '' },
        { key: 'optionC', label: 'ตัวเลือก C', default: '' },
        { key: 'optionD', label: 'ตัวเลือก D', default: '' },
        { key: 'answer', label: 'เฉลย (ข้อความที่แสดงตอนกด)', default: '' }
      ]},
  ]})
})

// POST /api/admin/line/send — ส่ง Flex ให้คนที่เลือก
router.post('/send', async (req, res) => {
  try {
    const { template, fields, userIds } = req.body
    if (!template || !userIds || !userIds.length) {
      return res.status(400).json({ message: 'กรุณาเลือก template และผู้รับ' })
    }
    const builder = TEMPLATE_BUILDERS[template]
    if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })

    const flexMsg = builder(fields || {})
    const results = await Promise.allSettled(
      userIds.map(uid => pushMessage(uid, [flexMsg]))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.filter(r => r.status === 'rejected').length
    console.log(`[Admin LINE] Send: ${ok} ok, ${fail} fail (template: ${template})`)
    res.json({ ok, fail, total: userIds.length })
  } catch (err) {
    console.error('[Admin LINE] send error:', err)
    res.status(500).json({ message: 'ส่งล้มเหลว: ' + err.message })
  }
})

// POST /api/admin/line/broadcast — ส่ง Flex ให้ทุกคน following
router.post('/broadcast', async (req, res) => {
  try {
    const { template, fields } = req.body
    if (!template) return res.status(400).json({ message: 'กรุณาเลือก template' })
    const builder = TEMPLATE_BUILDERS[template]
    if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })

    const [followers, linkedUsers] = await Promise.all([
      LineFollower.find({ isFollowing: true }).select('lineUserId').lean(),
      User.find({ lineUserId: { $exists: true, $ne: null }, role: { $ne: 'admin' } }).select('lineUserId').lean()
    ])
    const uidSet = new Set()
    followers.forEach(f => uidSet.add(f.lineUserId))
    linkedUsers.forEach(u => uidSet.add(u.lineUserId))
    const allUids = Array.from(uidSet)

    if (!allUids.length) return res.json({ ok: 0, fail: 0, total: 0, message: 'ไม่มีผู้รับ' })

    const flexMsg = builder(fields || {})
    const results = await Promise.allSettled(
      allUids.map(uid => pushMessage(uid, [flexMsg]))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.filter(r => r.status === 'rejected').length
    console.log(`[Admin LINE] Broadcast: ${ok} ok, ${fail} fail (template: ${template}, total: ${allUids.length})`)
    res.json({ ok, fail, total: allUids.length })
  } catch (err) {
    console.error('[Admin LINE] broadcast error:', err)
    res.status(500).json({ message: 'Broadcast ล้มเหลว: ' + err.message })
  }
})

// POST /api/admin/line/preview — สร้าง Flex JSON สำหรับ preview
router.post('/preview', (req, res) => {
  const { template, fields } = req.body
  const builder = TEMPLATE_BUILDERS[template]
  if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })
  res.json({ flex: builder(fields || {}) })
})

// POST /api/admin/line/send-payment — ส่ง Flex ชำระเงินให้ 1 คน
router.post('/send-payment', async (req, res) => {
  try {
    const { userId, courseName, amount, transfer, card, installment3, installment6 } = req.body
    if (!userId || !courseName || !amount) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    const needBeam = card || installment3 || installment6

    let payUrl = null
    let refId = null
    if (needBeam) {
      const { createPaymentLink } = require('./beam.service')
      refId = `MN-${Date.now()}`
      const installMonths = installment3 ? 3 : installment6 ? 6 : 0
      const beamResult = await createPaymentLink({
        courseName,
        amount: Number(amount),
        referenceId: refId,
        redirectUrl: 'https://medninja.academy',
        enableCard: !!card,
        installmentMonths: installMonths || undefined
      })
      payUrl = beamResult.url
      if (!payUrl) throw new Error('Beam ไม่ส่ง payment URL กลับมา')
    }

    const hasInstallment = installment3 || installment6
    const months = installment3 ? 3 : 6
    const bodyContents = [
      { type: 'text', text: courseName, size: 'lg', weight: 'bold', color: '#0f172a', wrap: true },
      { type: 'separator', color: '#f1f5f9', margin: 'lg' },
      { type: 'box', layout: 'vertical', backgroundColor: '#f8fafc', cornerRadius: '10px', paddingAll: '16px', margin: 'lg', contents: [
        { type: 'text', text: 'ยอดชำระ', size: 'xxs', color: '#94a3b8', align: 'center' },
        { type: 'text', text: Number(amount).toLocaleString() + ' บาท', size: 'xxl', weight: 'bold', color: '#0f172a', align: 'center', margin: 'xs' },
        ...(hasInstallment ? [
          { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'md', contents: [
            { type: 'box', layout: 'vertical', backgroundColor: '#7c3aed', cornerRadius: '12px', paddingAll: '4px', paddingStart: '12px', paddingEnd: '12px', contents: [
              { type: 'text', text: `ผ่อน 0% ${months} เดือน`, size: 'xs', weight: 'bold', color: '#FFFFFF', align: 'center' }
            ]}
          ]}
        ] : [])
      ]}
    ]

    if (transfer) {
      bodyContents.push(
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'text', text: 'โอนผ่านบัญชี', size: 'sm', weight: 'bold', color: '#0f172a', margin: 'md' },
        { type: 'box', layout: 'horizontal', margin: 'md', contents: [
          { type: 'text', text: 'ธนาคาร', size: 'xs', color: '#64748b', flex: 3 },
          { type: 'text', text: 'กสิกรไทย (KBANK)', size: 'xs', weight: 'bold', color: '#0f172a', flex: 5 }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'sm', contents: [
          { type: 'text', text: 'เลขที่บัญชี', size: 'xs', color: '#64748b', flex: 3 },
          { type: 'text', text: '228-1-44959-4', size: 'sm', weight: 'bold', color: '#16a34a', flex: 5 }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'sm', contents: [
          { type: 'text', text: 'ชื่อบัญชี', size: 'xs', color: '#64748b', flex: 3 },
          { type: 'text', text: 'บจก. เมดนินจา', size: 'xs', weight: 'bold', color: '#0f172a', flex: 5 }
        ]},
        { type: 'box', layout: 'vertical', backgroundColor: '#f0fdf4', cornerRadius: '6px', paddingAll: '8px', margin: 'md', contents: [
          { type: 'text', text: 'โอนแล้วแจ้งสลิปทาง LINE นี้ได้เลยค่ะ', size: 'xxs', color: '#16a34a', weight: 'bold', align: 'center', wrap: true }
        ]}
      )
    }

    const footerContents = []
    if (payUrl) {
      const btnLabel = hasInstallment ? `ชำระผ่านบัตร / ผ่อน 0% ${months} เดือน` : 'ชำระผ่านบัตรเครดิต'
      const btnColor = hasInstallment ? '#7c3aed' : '#16a34a'
      footerContents.push(
        { type: 'button', action: { type: 'uri', label: btnLabel, uri: payUrl }, style: 'primary', color: btnColor, height: 'sm' }
      )
    }
    footerContents.push(
      { type: 'text', text: 'MedNinja Academy — ติวสอบใบประกอบวิชาชีพแพทย์', size: 'xxs', color: '#94a3b8', align: 'center', margin: 'md' }
    )

    const flexMsg = {
      type: 'flex',
      altText: `ชำระค่าเรียน ${courseName} — MedNinja Academy`,
      contents: {
        type: 'bubble', size: 'mega',
        header: { type: 'box', layout: 'vertical', backgroundColor: '#0f172a', paddingAll: '24px', contents: [
          { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
            { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#16a34a', cornerRadius: '12px',
              contents: [{ type: 'text', text: '฿', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
              justifyContent: 'center', alignItems: 'center' },
            { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
              { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
              { type: 'text', text: 'ชำระค่าเรียน', color: '#94a3b8', size: 'xxs', margin: 'sm' }
            ]}
          ]}
        ]},
        body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#ffffff', contents: bodyContents },
        footer: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#f8fafc', contents: footerContents }
      }
    }

    await pushMessage(userId, [flexMsg])
    console.log(`[Admin LINE] Payment sent: ${courseName} ${amount} THB, transfer:${transfer} card:${card} inst3:${installment3} inst6:${installment6}, ref: ${refId}`)
    res.json({ ok: 1, refId })
  } catch (err) {
    console.error('[Admin LINE] send-payment error:', err)
    res.status(500).json({ message: 'ส่งล้มเหลว: ' + err.message })
  }
})

// POST /api/admin/line/preview-admin — preview ส่งให้ admin ทุกคนก่อน
router.post('/preview-admin', async (req, res) => {
  try {
    const { template, fields } = req.body
    const builder = TEMPLATE_BUILDERS[template]
    if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })
    const flexMsg = builder(fields || {})
    const ADMIN_UIDS = [
      'U2b0de81f0ec73e8561197393683a9e95',
      'Ue6b6c4daf46d1765f1af71b292fe6fc9',
      'U398ec17f9dbf5917c2fd83bec6fe24ef'
    ]
    await Promise.allSettled(ADMIN_UIDS.map(uid => pushMessage(uid, [flexMsg])))
    res.json({ ok: true, sent: ADMIN_UIDS.length })
  } catch (err) {
    res.status(500).json({ message: 'Preview ล้มเหลว: ' + err.message })
  }
})

// POST /api/admin/line/push-all — วน push ทีละ UUID (ฟรี ไม่เสีย quota)
router.post('/push-all', async (req, res) => {
  try {
    const { template, fields } = req.body
    const builder = TEMPLATE_BUILDERS[template]
    if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })
    const flexMsg = builder(fields || {})
    // segment filter — ส่งเฉพาะกลุ่ม (ถ้าระบุ)
    const segFilter = req.body.segment
    const query = { isFollowing: true }
    if (segFilter) query.segment = segFilter
    const followers = await LineFollower.find(query).select('lineUserId').lean()
    let sent = 0
    for (const f of followers) {
      try {
        await pushMessage(f.lineUserId, [flexMsg])
        sent++
      } catch {}
    }
    console.log(`[Admin LINE] Push-all: template=${template} segment=${segFilter || 'all'} sent=${sent}/${followers.length}`)
    res.json({ ok: true, sent, total: followers.length })
  } catch (err) {
    console.error('[Admin LINE] push-all error:', err)
    res.status(500).json({ message: 'ส่งล้มเหลว: ' + err.message })
  }
})

// POST /api/admin/line/broadcast-all — broadcast ให้ทุกคนที่ follow OA (เสีย quota)
router.post('/broadcast-all', async (req, res) => {
  try {
    const { template, fields } = req.body
    const builder = TEMPLATE_BUILDERS[template]
    if (!builder) return res.status(400).json({ message: 'template ไม่ถูกต้อง' })
    const flexMsg = builder(fields || {})
    await broadcastMessage([flexMsg])
    console.log(`[Admin LINE] Broadcast: template=${template}`)
    res.json({ ok: true })
  } catch (err) {
    console.error('[Admin LINE] broadcast-all error:', err)
    res.status(500).json({ message: 'Broadcast ล้มเหลว: ' + err.message })
  }
})

// ═══ Send Course Flex (NL / MEQ / OSCE / DDx) ═══
router.post('/send-course-flex', async (req, res) => {
  try {
    const { course, mode, userIds } = req.body
    const flex = buildCourseFlex(course)
    if (!flex) return res.status(400).json({ message: 'ไม่พบ Flex ของคอร์สนี้' })

    let sent = 0
    if (mode === 'broadcast') {
      const followers = await LineFollower.find({ isFollowing: true }).select('lineUserId').lean()
      for (const f of followers) {
        try {
          await pushMessage(f.lineUserId, [flex])
          sent++
        } catch {}
      }
    } else {
      for (const uid of (userIds || [])) {
        try {
          await pushMessage(uid, [flex])
          sent++
        } catch {}
      }
    }
    res.json({ ok: true, sent })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ═══ AI Chat — Admin Routes ═══

// GET /api/admin/line/chat/:lineUserId — ดูประวัติแชท
router.get('/chat/:lineUserId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ lineUserId: req.params.lineUserId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean()
    const follower = await LineFollower.findOne({ lineUserId: req.params.lineUserId }).lean()
    res.json({ messages, follower })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/chat/:lineUserId/reply — admin ตอบผ่าน LINE + auto-pause AI
router.post('/chat/:lineUserId/reply', async (req, res) => {
  try {
    const { text } = req.body
    const { lineUserId } = req.params
    if (!text?.trim()) return res.status(400).json({ message: 'กรุณาพิมพ์ข้อความ' })

    await pushMessage(lineUserId, [{ type: 'text', text: text.trim() }])
    await ChatMessage.create({ lineUserId, role: 'admin', text: text.trim() })
    // auto-pause AI เมื่อ admin ตอบเอง
    await LineFollower.updateOne({ lineUserId }, { aiPaused: true })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'ส่งล้มเหลว: ' + err.message })
  }
})

// PATCH /api/admin/line/followers/:lineUserId/ai — toggle AI/HUMAN mode
router.patch('/followers/:lineUserId/ai', async (req, res) => {
  try {
    const { aiMode } = req.body // 'ai' or 'human'
    await LineFollower.updateOne(
      { lineUserId: req.params.lineUserId },
      { aiMode: aiMode === 'ai' ? 'ai' : 'human', aiPaused: false }
    )
    res.json({ ok: true, aiMode })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/admin/line/followers/:lineUserId/resume — คืนให้ AI ดูแลต่อ
router.patch('/followers/:lineUserId/resume', async (req, res) => {
  try {
    await LineFollower.updateOne(
      { lineUserId: req.params.lineUserId },
      { aiPaused: false, hasEscalation: false }
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/admin/line/followers/:lineUserId/note — อัพเดท admin note (positive/negative/general)
router.patch('/followers/:lineUserId/note', async (req, res) => {
  try {
    const { adminNote, positiveNote, negativeNote } = req.body
    const update = {}
    if (typeof adminNote === 'string') update.adminNote = adminNote.slice(0, 500)
    if (typeof positiveNote === 'string') update.positiveNote = positiveNote.slice(0, 500)
    if (typeof negativeNote === 'string') update.negativeNote = negativeNote.slice(0, 500)
    await LineFollower.updateOne({ lineUserId: req.params.lineUserId }, update)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/line/escalations — รายการที่ AI ส่งต่อ
router.get('/escalations', async (req, res) => {
  try {
    const escalated = await LineFollower.find({ hasEscalation: true })
      .sort({ lastEscalatedAt: -1 })
      .lean()
    // ดึงข้อความล่าสุดของแต่ละ UID
    const withLastMsg = await Promise.all(escalated.map(async f => {
      const lastMsg = await ChatMessage.findOne({ lineUserId: f.lineUserId, role: 'user' })
        .sort({ createdAt: -1 }).lean()
      return { ...f, lastUserMessage: lastMsg?.text || '' }
    }))
    res.json({ escalations: withLastMsg })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/admin/line/escalations/:lineUserId/resolve — แก้ไขแล้ว
router.patch('/escalations/:lineUserId/resolve', async (req, res) => {
  try {
    await LineFollower.updateOne(
      { lineUserId: req.params.lineUserId },
      { hasEscalation: false, aiPaused: false }
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ═══ AI Config — จูน prompt จาก admin UI ═══

// GET /api/admin/line/ai-config — ดึง config ปัจจุบัน
router.get('/ai-config', async (req, res) => {
  try {
    const config = await getConfig()
    res.json({ config })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/admin/line/ai-config — บันทึก config
router.put('/ai-config', async (req, res) => {
  try {
    const { systemPrompt, temperature, maxTokens, courseInfo, enabled } = req.body
    const update = {}
    if (typeof systemPrompt === 'string') update.systemPrompt = systemPrompt
    if (typeof temperature === 'number') update.temperature = Math.min(Math.max(temperature, 0), 2)
    if (typeof maxTokens === 'number') update.maxTokens = Math.min(Math.max(maxTokens, 100), 2000)
    if (typeof courseInfo === 'string') update.courseInfo = courseInfo.slice(0, 2000)
    if (typeof req.body.courseDetails === 'string') update.courseDetails = req.body.courseDetails.slice(0, 5000)
    if (typeof req.body.salesTechniques === 'string') update.salesTechniques = req.body.salesTechniques.slice(0, 3000)
    if (typeof enabled === 'boolean') update.enabled = enabled
    if (Array.isArray(req.body.tools)) update.tools = req.body.tools
    if (Array.isArray(req.body.paymentOptions)) update.paymentOptions = req.body.paymentOptions
    update.updatedBy = req.user?.firstName || 'admin'

    await AIChatConfig.updateOne({ key: 'default' }, update, { upsert: true })
    clearConfigCache()
    console.log(`[Admin AI] Config updated by ${update.updatedBy}`)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/ai-config/reset — reset กลับ default
router.post('/ai-config/reset', async (req, res) => {
  try {
    await AIChatConfig.updateOne(
      { key: 'default' },
      { systemPrompt: DEFAULT_PROMPT, temperature: 0.7, maxTokens: 500, courseInfo: '', tools: DEFAULT_TOOLS, paymentOptions: DEFAULT_PAYMENT_OPTIONS, updatedBy: req.user?.firstName || 'admin' },
      { upsert: true }
    )
    clearConfigCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ═══ Flex Center — จัดการ Flex ทุกอัน ═══

// GET /api/admin/line/flex-templates — รายการ Flex ทั้งหมด
router.get('/flex-templates', async (req, res) => {
  try {
    const templates = await getAllTemplates()
    res.json({ templates })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/line/flex-templates/:key — ดึง 1 template
router.get('/flex-templates/:key', async (req, res) => {
  try {
    const tpl = await getTemplate(req.params.key)
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    res.json({ template: tpl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/admin/line/flex-templates/:key — แก้ไข template
router.put('/flex-templates/:key', async (req, res) => {
  try {
    const { fields, label, enabled } = req.body
    const update = { updatedBy: req.user?.firstName || 'admin' }
    if (fields && typeof fields === 'object') update.fields = fields
    if (typeof label === 'string') update.label = label
    if (typeof enabled === 'boolean') update.enabled = enabled
    await FlexTemplate.updateOne({ key: req.params.key }, update)
    clearTemplateCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/flex-templates — เพิ่ม template ใหม่
router.post('/flex-templates', async (req, res) => {
  try {
    const { key, label, category, fields } = req.body
    if (!key || !label) return res.status(400).json({ message: 'กรุณาใส่ key + label' })
    const existing = await FlexTemplate.findOne({ key })
    if (existing) return res.status(400).json({ message: 'key ซ้ำ' })
    await FlexTemplate.create({ key, label, category: category || 'info', fields: fields || {}, updatedBy: req.user?.firstName || 'admin' })
    clearTemplateCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/flex-templates/:key/preview — preview ส่งให้ admin
router.post('/flex-templates/:key/preview', async (req, res) => {
  try {
    const tpl = await getTemplate(req.params.key)
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    // ส่ง fields กลับเพื่อ preview (frontend render เอง)
    res.json({ template: tpl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/flex-templates/:key/test-send — ส่ง Flex ให้ admin ทุกคนดูก่อน
router.post('/flex-templates/:key/test-send', async (req, res) => {
  try {
    const tpl = await getTemplate(req.params.key)
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    const builder = TEMPLATE_BUILDERS[req.params.key]
    if (!builder) return res.status(400).json({ message: 'ไม่พบ builder สำหรับ template นี้' })
    const flexMsg = builder(tpl.fields || {})
    const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9']
    await Promise.allSettled(adminUids.map(uid => pushMessage(uid, [flexMsg])))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/flex-templates/reset — reset ทั้งหมดกลับ default
router.post('/flex-templates/reset', async (req, res) => {
  try {
    await FlexTemplate.deleteMany({})
    await FlexTemplate.insertMany(DEFAULT_TEMPLATES)
    clearTemplateCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ═══════════════════════════════════════════════════════
// POST /api/admin/line/send-activate — ส่ง Flex เปิดระบบ (3 messages)
router.post('/send-activate', async (req, res) => {
  try {
    const { userId, courses, systems, note, isNew } = req.body
    if (!userId || !courses?.length) return res.status(400).json({ message: 'ระบุ userId + courses' })

    const sysInfo = {
      SYNAPSE: { color: '#6366f1', desc: 'Interactive Learning' },
      NLEX:    { color: '#0ea5e9', desc: 'ระบบทำข้อสอบ' },
      MEQEX:   { color: '#f43f5e', desc: 'MEQ Exam Simulation' },
      DDx:     { color: '#f97316', desc: 'ระบบฝึก Approach' },
      ATLAS:   { color: '#14b8a6', desc: 'แผนที่เชื่อมโยงความรู้' },
      OSCE:    { color: '#0891b2', desc: 'จำลองสถานการณ์' }
    }

    const courseChecks = courses.map(c => ({
      type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
        { type: 'text', text: '✓', size: 'sm', color: '#4ade80', flex: 0, weight: 'bold' },
        { type: 'text', text: c, size: 'sm', color: '#FFFFFF', flex: 1, weight: 'bold' }
      ]
    }))

    const systemRows = (systems || []).map(s => ({
      type: 'box', layout: 'horizontal', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', backgroundColor: (sysInfo[s] || {}).color || '#6b7280', cornerRadius: '6px', paddingAll: '3px', paddingStart: '8px', paddingEnd: '8px', width: '65px', flex: 0,
          contents: [{ type: 'text', text: s, size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }] },
        { type: 'text', text: (sysInfo[s] || {}).desc || '', size: 'xxs', color: '#94a3b8', gravity: 'center', flex: 1 }
      ]
    }))

    const flexBody = [
      { type: 'box', layout: 'horizontal', justifyContent: 'center', contents: [
        { type: 'box', layout: 'vertical', backgroundColor: '#052e16', cornerRadius: '8px', paddingAll: '6px', paddingStart: '16px', paddingEnd: '16px', contents: [
          { type: 'text', text: '🚀 ACTIVATED', size: 'sm', weight: 'bold', color: '#4ade80', align: 'center' }
        ]}
      ]},
      { type: 'box', layout: 'vertical', spacing: 'xs', margin: 'lg', contents: courseChecks }
    ]
    const finalNote = note || 'สามารถเข้าเรียนได้ทันทีผ่าน medninja.academy ครับ 📚'
    {
      flexBody.push({ type: 'separator', color: '#1e293b', margin: 'lg' })
      flexBody.push({ type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '8px', paddingAll: '12px', margin: 'md', contents: [
        { type: 'text', text: finalNote, size: 'xs', color: '#fbbf24', wrap: true, lineSpacing: '4px', weight: 'bold' }
      ]})
    }
    if (systemRows.length) {
      flexBody.push({ type: 'separator', color: '#1e293b', margin: 'lg' })
      flexBody.push({ type: 'text', text: '🎁 ระบบพิเศษ', size: 'xs', weight: 'bold', color: '#e2e8f0', margin: 'md' })
      flexBody.push({ type: 'box', layout: 'vertical', spacing: 'sm', margin: 'sm', contents: systemRows })
    }

    // Flex ขึ้นก่อน → text สรุปตาม
    const flexMsg = { type: 'flex', altText: '🚀 เปิดระบบ ' + courses.join(' + ') + ' เรียบร้อย!', contents: {
      type: 'bubble', size: 'kilo',
      body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: flexBody }
    }}

    let summaryText = 'สวัสดีครับ 👨‍💻\n\nจากฝ่ายไอทีนะครับ ขณะนี้ได้ทำการเปิดระบบเรียบร้อยแล้ว สามารถเข้าเรียนได้ทันทีครับ\n\n'
    summaryText += '📚 คอร์ส: ' + courses.join(', ') + '\n'
    if (systems.length) summaryText += '🎁 ระบบพิเศษ: ' + systems.join(', ') + '\n'
    summaryText += '\n💡 ' + finalNote + '\n'
    summaryText += '\nหากมีคำถามหรือติดขัดตรงไหน\nทักไอทีได้เลยนะครับ 💪'

    if (isNew) {
      summaryText += '\n\nยินดีต้อนรับสู่ MedNinja อย่างเป็นทางการนะครับ 🎓\nขอให้ประสบความสำเร็จในการสอบ 🏆✨'
    } else {
      summaryText += '\n\nขอให้ประสบความสำเร็จในการสอบนะครับ 🏆✨'
    }

    const messages = [flexMsg, { type: 'text', text: summaryText }]

    await pushMessage(userId, messages)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// TAG / CRM Pipeline
// ═══════════════════════════════════════════════════════

// PATCH /api/admin/line/followers/:lineUserId/tag — เปลี่ยน tag
router.patch('/followers/:lineUserId/tag', async (req, res) => {
  try {
    const { tag, confirmCode } = req.body
    const validTags = ['new', 'incoming', 'inquired', 'interested', 'closing', 'student', 'trial', 'admin', 'staff']
    if (!tag || !validTags.includes(tag)) {
      return res.status(400).json({ message: 'tag ไม่ถูกต้อง' })
    }
    // ป้องกันลดขั้นจาก student — ต้องใส่รหัส
    const current = await LineFollower.findOne({ lineUserId: req.params.lineUserId }).lean()
    if (current?.tag === 'student' && tag !== 'student') {
      if (confirmCode !== 'CONFIRM') {
        return res.status(403).json({ message: 'นักเรียนห้ามลดขั้น ต้องใส่รหัส CONFIRM', needConfirm: true })
      }
    }
    const follower = await LineFollower.findOneAndUpdate(
      { lineUserId: req.params.lineUserId },
      {
        $set: { tag, tagUpdatedAt: new Date(), tagUpdatedBy: req.user?.firstName || 'admin' },
        $setOnInsert: { isFollowing: true, displayName: '' }
      },
      { new: true, upsert: true }
    )
    res.json({ ok: true, tag: follower.tag })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/admin/line/followers/:lineUserId/extra — nickname, passedExams, segment, familyUids
router.patch('/followers/:lineUserId/extra', async (req, res) => {
  try {
    const { nickname, passedExams, segment, familyUids } = req.body
    const update = {}
    if (nickname !== undefined) update.nickname = nickname
    if (passedExams !== undefined) update.passedExams = passedExams
    if (segment !== undefined) update.segment = segment
    if (familyUids !== undefined) update.familyUids = familyUids
    const follower = await LineFollower.findOneAndUpdate(
      { lineUserId: req.params.lineUserId }, update, { new: true }
    )
    if (!follower) return res.status(404).json({ message: 'ไม่พบ follower' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/line/tag-stats — จำนวนคนแต่ละ tag
router.get('/tag-stats', async (req, res) => {
  try {
    const stats = await LineFollower.aggregate([
      { $match: { isFollowing: true } },
      { $group: { _id: '$tag', count: { $sum: 1 } } }
    ])
    const result = { new: 0, inquired: 0, interested: 0, closing: 0, student: 0, trial: 0 }
    for (const s of stats) result[s._id || 'new'] = s.count
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/scan-survey — ค้น ChatMessage → auto-assign segment ให้ follower
const SEGMENT_MAP = [
  { keywords: ['รอสอบ NL ระบบใหม่', 'NL ระบบใหม่ ปี 70', 'ระบบใหม่ ปี 70'], segments: ['nl-new70'] },
  { keywords: ['NL1 ผ่านแล้ว เหลือ NL2', 'เหลือ NL2'], segments: ['nl2'] },
  { keywords: ['กำลังเตรียมสอบ MEQ+OSCE', 'MEQ+OSCE', 'เตรียมสอบ MEQ+OSCE'], segments: ['meq', 'osce'] },
  { keywords: ['กำลังเตรียม MEQ', 'เตรียม MEQ'], segments: ['meq'] },
  { keywords: ['กำลังเตรียมสอบ OSCE', 'เตรียมสอบ OSCE'], segments: ['osce'] }
]

router.post('/scan-survey', async (req, res) => {
  try {
    const msgs = await ChatMessage.find({
      role: 'user',
      text: { $regex: 'คุณเลือก:' }
    }).sort({ createdAt: -1 }).lean()

    const results = []
    const uidSegments = new Map() // uid → Set of segments

    for (const m of msgs) {
      const match = m.text.match(/คุณเลือก:\s*(.+?)(?:\n|$)/)
      if (!match) continue
      const answer = match[1].trim()

      let matched = null
      // MEQ+OSCE ต้องเช็คก่อน MEQ และ OSCE (เพราะ keyword ซ้อนกัน)
      for (const entry of SEGMENT_MAP) {
        if (entry.keywords.some(kw => answer.includes(kw))) {
          matched = entry.segments
          break
        }
      }
      if (!matched) continue

      if (!uidSegments.has(m.lineUserId)) uidSegments.set(m.lineUserId, new Set())
      for (const s of matched) uidSegments.get(m.lineUserId).add(s)
    }

    // Batch update
    for (const [uid, segs] of uidSegments) {
      await LineFollower.findOneAndUpdate(
        { lineUserId: uid },
        { $addToSet: { segment: { $each: [...segs] } } }
      )
      results.push({ uid: uid.slice(0, 12), segments: [...segs] })
    }

    res.json({ ok: true, updated: results.length, results })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/line/segment-stats — จำนวนคนแต่ละ segment
router.get('/segment-stats', async (req, res) => {
  try {
    const stats = await LineFollower.aggregate([
      { $match: { isFollowing: true, segment: { $exists: true, $ne: [] } } },
      { $unwind: '$segment' },
      { $group: { _id: '$segment', count: { $sum: 1 } } }
    ])
    const result = {}
    for (const s of stats) result[s._id] = s.count
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ═══════════════════════════════════════════════════════
// CUSTOM FLEX CRUD
// ═══════════════════════════════════════════════════════

// GET /api/admin/line/custom-flex — list custom templates
router.get('/custom-flex', async (req, res) => {
  try {
    const templates = await FlexTemplate.find({ category: 'custom' }).sort({ createdAt: -1 }).lean()
    res.json({ templates })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/custom-flex — create custom flex
router.post('/custom-flex', async (req, res) => {
  try {
    const { label, flexJson, altText, aiToolEnabled, aiToolInstruction } = req.body
    if (!label || !flexJson) return res.status(400).json({ message: 'กรุณาระบุชื่อและ JSON' })
    const key = 'custom_' + Date.now()
    const tpl = await FlexTemplate.create({
      key, label, category: 'custom', flexJson, altText: altText || label,
      aiToolEnabled: aiToolEnabled || false,
      aiToolInstruction: aiToolInstruction || '',
      updatedBy: req.user?.firstName || 'admin'
    })
    clearTemplateCache()
    res.json({ ok: true, template: tpl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/admin/line/custom-flex/:id — update custom flex
router.put('/custom-flex/:id', async (req, res) => {
  try {
    const { label, flexJson, altText, aiToolEnabled, aiToolInstruction } = req.body
    const tpl = await FlexTemplate.findByIdAndUpdate(req.params.id, {
      ...(label && { label }),
      ...(flexJson && { flexJson }),
      ...(altText !== undefined && { altText }),
      ...(aiToolEnabled !== undefined && { aiToolEnabled }),
      ...(aiToolInstruction !== undefined && { aiToolInstruction }),
      updatedBy: req.user?.firstName || 'admin'
    }, { new: true })
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    clearTemplateCache()
    res.json({ ok: true, template: tpl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/admin/line/custom-flex/:id — delete custom flex
router.delete('/custom-flex/:id', async (req, res) => {
  try {
    const tpl = await FlexTemplate.findById(req.params.id)
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    if (tpl.category !== 'custom') return res.status(403).json({ message: 'ลบได้เฉพาะ custom' })
    await tpl.deleteOne()
    clearTemplateCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/custom-flex/:id/send — send custom flex
router.post('/custom-flex/:id/send', async (req, res) => {
  try {
    const { userIds, broadcast } = req.body
    const tpl = await FlexTemplate.findById(req.params.id)
    if (!tpl || !tpl.flexJson) return res.status(404).json({ message: 'ไม่พบ template' })

    const flexMsg = { type: 'flex', altText: tpl.altText || tpl.label, contents: tpl.flexJson }

    if (broadcast) {
      await broadcastMessage([flexMsg])
      return res.json({ ok: true, method: 'broadcast' })
    }
    if (!userIds || !userIds.length) return res.status(400).json({ message: 'กรุณาเลือกผู้รับ' })
    const results = await Promise.allSettled(userIds.map(uid => pushMessage(uid, [flexMsg])))
    const ok = results.filter(r => r.status === 'fulfilled').length
    res.json({ ok, fail: userIds.length - ok })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/line/custom-flex/:id/preview — preview ส่งให้ admin
router.post('/custom-flex/:id/preview', async (req, res) => {
  try {
    const tpl = await FlexTemplate.findById(req.params.id)
    if (!tpl || !tpl.flexJson) return res.status(404).json({ message: 'ไม่พบ template' })
    const flexMsg = { type: 'flex', altText: tpl.altText || tpl.label, contents: tpl.flexJson }
    // ส่งให้ admin ทุกคน
    const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9']
    await Promise.allSettled(adminUids.map(uid => pushMessage(uid, [flexMsg])))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
