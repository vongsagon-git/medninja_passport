/**
 * LINE Webhook — เก็บ UUID + profile + AI chatbot
 * ต้อง mount ก่อน express.json() ใน app.js
 */
const express = require('express')
const router = express.Router()
const LineFollower = require('./LineFollower.model')
const ChatMessage = require('./ChatMessage.model')
const { verifySignature, getProfile, pushMessage, downloadLineContent } = require('./line.webhook.service')
const { generateReply, generateReplyWithImage, sendChunkedReply } = require('./line.ai.service')

// ใช้ raw body สำหรับ verify signature
router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-line-signature']
  const rawBody = req.body // Buffer

  // verify signature
  if (!verifySignature(rawBody, signature)) {
    console.warn('[LINE Webhook] Invalid signature')
    return res.status(403).json({ error: 'Invalid signature' })
  }

  // ตอบ 200 ทันที (LINE ต้องการภายใน 1 วินาที)
  res.status(200).json({ ok: true })

  // ประมวลผลหลังบ้าน
  const body = JSON.parse(rawBody.toString())
  if (body.events && body.events.length) {
    processEvents(body.events).catch(err => {
      console.error('[LINE Webhook] Process error:', err.message)
    })
  }
})

async function processEvents(events) {
  for (const event of events) {
    const userId = event.source?.userId
    if (!userId) continue

    try {
      if (event.type === 'follow') {
        const profile = await getProfile(userId)
        // Auto-link: check if this LINE UID already exists in User collection
        const User = require('../user/User.model')
        const linkedUser = await User.findOne({ lineUserId: userId }).lean()
        const autoTag = linkedUser ? 'student' : 'incoming'

        await LineFollower.findOneAndUpdate(
          { lineUserId: userId },
          {
            lineUserId: userId,
            displayName: profile?.displayName || '',
            pictureUrl: profile?.pictureUrl || '',
            isFollowing: true,
            followedAt: new Date(),
            unfollowedAt: null,
            tag: autoTag,
            ...(linkedUser && { linkedUserId: linkedUser._id })
          },
          { upsert: true, new: true }
        )
        console.log(`[LINE Webhook] Follow: ${profile?.displayName || userId.slice(0, 8)}`)

        // ส่ง Flex แจ้ง admin
        notifyAdminNewFollower(profile, userId).catch(() => {})

        // ส่ง Flex DDx ARENA welcome
        try {
          const welcomeFlex = {
            type: 'flex', altText: '🏆 DDx ARENA — เกมส์พัฒนาทักษะ!',
            contents: {
              type: 'bubble', size: 'mega',
              body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px', backgroundColor: '#0f172a', contents: [
                { type: 'box', layout: 'horizontal', justifyContent: 'center', spacing: 'sm', contents: [
                  { type: 'text', text: 'DDx', size: 'xxl', weight: 'bold', color: '#f97316', flex: 0 },
                  { type: 'text', text: 'ARENA', size: 'xxl', weight: 'bold', color: '#FFFFFF', flex: 0 }
                ]},
                { type: 'text', text: 'เกมส์พัฒนาทักษะ', size: 'sm', weight: 'bold', color: '#e2e8f0', align: 'center', margin: 'sm' },
                { type: 'text', text: 'ของคนสอบ NL และ MEQ โดยเฉพาะ', size: 'xs', color: '#c4b5fd', align: 'center', margin: 'xs' },
                { type: 'separator', color: '#1e293b', margin: 'lg' },
                { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', contents: [
                  { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
                    { type: 'text', text: '🧬', size: 'sm', flex: 0 },
                    { type: 'text', text: 'DDx Buzzwords — อ่าน clue เดา DDx', size: 'sm', color: '#94a3b8', flex: 1 }
                  ]},
                  { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
                    { type: 'text', text: '⚡', size: 'sm', flex: 0 },
                    { type: 'text', text: 'Pattern → DDx — จำ pattern ได้ไหม', size: 'sm', color: '#94a3b8', flex: 1 }
                  ]},
                  { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
                    { type: 'text', text: '🎯', size: 'sm', flex: 0 },
                    { type: 'text', text: 'Odd One Out — หาตัวที่ไม่เข้าพวก', size: 'sm', color: '#94a3b8', flex: 1 }
                  ]}
                ]},
                { type: 'text', text: 'เล่นฟรี ไม่ต้องสมัคร', size: 'xs', color: '#64748b', align: 'center', margin: 'lg' },
                { type: 'text', text: 'MEDNINJA TECHNOLOGY', size: 'xxs', color: '#475569', align: 'center', margin: 'sm', weight: 'bold' }
              ]},
              footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
                { type: 'button', action: { type: 'uri', label: '🎮 เข้าเล่น DDx Arena เลย!', uri: 'https://ddx.medninja.academy' }, style: 'primary', color: '#f97316', height: 'sm' }
              ]}
            }
          }
          await pushMessage(userId, [welcomeFlex])
        } catch (e) { console.error('[LINE Webhook] Arena welcome flex error:', e.message) }

      } else if (event.type === 'unfollow') {
        const unfollower = await LineFollower.findOneAndUpdate(
          { lineUserId: userId },
          { isFollowing: false, unfollowedAt: new Date() },
          { new: true }
        )
        console.log(`[LINE Webhook] Unfollow: ${userId.slice(0, 8)}`)
        notifyAdminUnfollow(unfollower, userId)

      } else if (event.type === 'message') {
        await handleMessage(event, userId)
      }
    } catch (err) {
      console.error(`[LINE Webhook] Event ${event.type} error:`, err.message)
    }
  }
}

// ═══ Message Handler ═══
async function handleMessage(event, userId) {
  const msgType = event.message?.type
  const text = msgType === 'text' ? event.message.text : ''

  // 1. บันทึก ChatMessage ทุกข้อความ
  ChatMessage.create({
    lineUserId: userId,
    role: 'user',
    contentType: msgType === 'image' ? 'image' : msgType === 'sticker' ? 'sticker' : 'text',
    text: text.slice(0, 2000)
  }).catch(err => console.error('[LINE] ChatMessage save error:', err.message))

  // 2. ดึง profile + อัพเดท LineFollower
  const profile = await getProfile(userId)
  const updateData = {
    lineUserId: userId,
    displayName: profile?.displayName || '',
    pictureUrl: profile?.pictureUrl || '',
    isFollowing: true,
    lastMessageAt: new Date(),
    lastMessageText: text.slice(0, 200)
  }
  const follower = await LineFollower.findOneAndUpdate(
    { lineUserId: userId },
    updateData,
    { upsert: true, new: true }
  )

  // 3. Auto-reply: NLEX (case insensitive)
  if (text.trim().toLowerCase() === 'nlex') {
    autoReplyNlex(userId).catch(err => console.error('[LINE] NLEX auto-reply error:', err.message))
    return
  }

  // 4. AI Chatbot — เฉพาะ aiMode='ai' && ไม่ถูก pause
  console.log(`[LINE AI] check: uid=${userId.slice(0,8)} aiMode=${follower.aiMode} aiPaused=${follower.aiPaused} text=${text.slice(0,30)}`)
  if (follower.aiMode === 'ai' && !follower.aiPaused) {
    console.log(`[LINE AI] → entering agent loop`)
    handleAIReply(event, userId, text, msgType, follower).catch(err => {
      console.error('[LINE AI] Reply error:', err.message)
    })
  } else {
    console.log(`[LINE AI] → skipped (mode=${follower.aiMode} paused=${follower.aiPaused})`)
  }
}

// ═══ AI Reply Handler ═══
async function handleAIReply(event, userId, text, msgType, follower) {
  const history = await ChatMessage.find({ lineUserId: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
  history.reverse()

  const followerInfo = {
    displayName: follower.displayName,
    tag: follower.tag || 'new',
    segment: follower.segment || [],
    passedExams: follower.passedExams || [],
    isFollowing: follower.isFollowing,
    followedAt: follower.followedAt,
    lastMessageAt: follower.lastMessageAt,
    adminNote: follower.adminNote,
    positiveNote: follower.positiveNote,
    negativeNote: follower.negativeNote
  }

  let result
  if (msgType === 'image') {
    // รูป → ส่งต่อ admin ทันที ไม่ให้ AI ตอบเอง
    const { pushMessage: push } = require('./line.webhook.service')
    const name = follower.displayName || userId.slice(0, 12)
    const alertFlex = {
      type: 'flex', altText: `${name} ส่งรูปมา`,
      contents: { type: 'bubble', size: 'kilo',
        header: { type: 'box', layout: 'vertical', backgroundColor: '#7C3AED', paddingAll: '12px', contents: [
          { type: 'text', text: 'ลูกค้าส่งรูป', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }
        ]},
        body: { type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'sm', contents: [
          { type: 'text', text: name, weight: 'bold', size: 'md', color: '#FFFFFF' },
          { type: 'text', text: 'เช็คใน LINE OA', size: 'sm', color: '#E2E8F0', wrap: true },
          { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#64748B', margin: 'md' }
        ]}
      }
    }
    const ADMIN_UIDS = ['U2b0de81f0ec73e8561197393683a9e95','Ue6b6c4daf46d1765f1af71b292fe6fc9','U398ec17f9dbf5917c2fd83bec6fe24ef']
    for (const uid of ADMIN_UIDS) push(uid, [alertFlex]).catch(() => {})
    // ไม่ตอบลูกค้า — admin มาตอบเอง
    await LineFollower.updateOne({ lineUserId: userId }, { aiPaused: true, hasEscalation: true, lastEscalatedAt: new Date() })
    return
  } else if (msgType === 'text' && text.trim()) {
    result = await generateReply(userId, text, history, followerInfo)
  } else {
    return // sticker หรือ type อื่น — ไม่ตอบ
  }

  // Agent loop ส่ง text เองแล้วใน loop — [SENT] = ส่งหมดแล้ว, [SKIP] = ไม่ตอบ
  // ไม่ต้องส่งซ้ำที่นี่

  // Pause AI ถ้า handoff
  if (result.shouldPause) {
    await LineFollower.updateOne(
      { lineUserId: userId },
      { aiPaused: true, hasEscalation: true, lastEscalatedAt: new Date() }
    )
  }
}

// ═══ Notify Admin: New Follower ═══
const ADMIN_UIDS = [
  'U2b0de81f0ec73e8561197393683a9e95', // เติ้ล
  'Ue6b6c4daf46d1765f1af71b292fe6fc9', // chertam
  'U398ec17f9dbf5917c2fd83bec6fe24ef'  // ฝน
]

async function notifyAdminNewFollower(profile, lineUserId) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  const name = profile?.displayName || 'ไม่ทราบชื่อ'
  const pic = profile?.pictureUrl || ''

  const flex = {
    type: 'flex',
    altText: `New Follower: ${name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#06c755',
        paddingAll: '12px',
        contents: [{
          type: 'text',
          text: 'NEW LINE FOLLOWER',
          color: '#FFFFFF',
          size: 'xs',
          weight: 'bold',
          align: 'center'
        }]
      },
      body: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          ...(pic ? [{
            type: 'image',
            url: pic,
            size: '60px',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0
          }] : []),
          {
            type: 'box',
            layout: 'vertical',
            flex: 1,
            contents: [
              { type: 'text', text: name, weight: 'bold', size: 'md', color: '#FFFFFF' },
              { type: 'text', text: lineUserId.slice(0, 16) + '...', size: 'xxs', color: '#999999', margin: 'sm' },
              { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#666666', margin: 'sm' }
            ]
          }
        ]
      }
    }
  }

  for (const uid of ADMIN_UIDS) {
    try {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: uid, messages: [flex] })
      })
    } catch {}
  }
}

// ═══ Notify Admin: Unfollow ═══
async function notifyAdminUnfollow(follower, lineUserId) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return

  const name = follower?.displayName || lineUserId.slice(0, 16)
  const tag = follower?.tag || '-'
  const pic = follower?.pictureUrl || ''

  const flex = {
    type: 'flex',
    altText: `UNFOLLOW: ${name}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#dc2626',
        paddingAll: '12px',
        contents: [{
          type: 'text',
          text: 'UNFOLLOW',
          color: '#FFFFFF',
          size: 'xs',
          weight: 'bold',
          align: 'center'
        }]
      },
      body: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          ...(pic ? [{
            type: 'image',
            url: pic,
            size: '60px',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0
          }] : []),
          {
            type: 'box',
            layout: 'vertical',
            flex: 1,
            contents: [
              { type: 'text', text: name, weight: 'bold', size: 'md', color: '#FFFFFF' },
              { type: 'text', text: `สถานะ: ${tag}`, size: 'xxs', color: '#fca5a5', margin: 'sm' },
              { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xxs', color: '#666666', margin: 'sm' }
            ]
          }
        ]
      }
    }
  }

  for (const uid of ADMIN_UIDS) {
    try {
      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: uid, messages: [flex] })
      })
    } catch {}
  }
}

// ═══ Auto-reply NLEX ═══
async function autoReplyNlex(userId) {
  const flexAnnounce = {
    type: 'flex', altText: 'NLEX ระบบตะลุยข้อสอบ 10,000+ ข้อ ใช้ได้แล้ววันนี้!',
    contents: { type: 'bubble', size: 'mega', styles: { header: { backgroundColor: '#0f172a' }, body: { backgroundColor: '#0f172a' } },
      header: { type: 'box', layout: 'vertical', paddingAll: '24px', paddingBottom: '0px', contents: [
        { type: 'text', text: 'NLEX', color: '#22d3ee', size: '4xl', weight: 'bold', align: 'center' }
      ]},
      body: { type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'sm', contents: [
        { type: 'text', text: 'ระบบตะลุยข้อสอบ', color: '#FFFFFF', size: 'xl', weight: 'bold', align: 'center' },
        { type: 'text', text: '10,000+ ข้อ', color: '#FFFFFF', size: '3xl', weight: 'bold', align: 'center' },
        { type: 'text', text: 'เยอะที่สุดในไทย! พร้อมเฉลยละเอียด', color: '#ef4444', size: 'xs', weight: 'bold', align: 'center', margin: 'md' },
        { type: 'text', text: '💬 ส่งคำถามตรงถึงหมอแตมได้ทันที', color: '#22d3ee', size: 'sm', weight: 'bold', align: 'center', margin: 'sm', wrap: true },
        { type: 'box', layout: 'vertical', backgroundColor: '#dc2626', cornerRadius: '12px', paddingAll: '16px', margin: 'xl', contents: [
          { type: 'text', text: 'NL1 · NL2 · NL1+2', color: '#FFFFFF', size: 'lg', weight: 'bold', align: 'center' },
          { type: 'text', text: 'เก็งข้อสอบระบบใหม่', color: '#FFFFFF', size: 'sm', align: 'center', margin: 'sm' }
        ]},
        { type: 'text', text: '🎉 นักเรียน NL1+2 FULL คอร์สเต็ม', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center', margin: 'xl', wrap: true },
        { type: 'text', text: 'ใช้ฟรี! เปิดใช้ได้แล้ววันนี้', color: '#22d3ee', size: 'sm', weight: 'bold', align: 'center' },
        { type: 'text', text: 'MedNinja Co., Ltd.', color: '#475569', size: 'xxs', align: 'center', margin: 'xl' }
      ]}
    }
  }

  const flexHowto = {
    type: 'flex', altText: 'วิธีเข้าใช้งาน NLEX',
    contents: { type: 'bubble', size: 'mega', styles: { header: { backgroundColor: '#0f172a' }, body: { backgroundColor: '#FFFFFF' }, footer: { backgroundColor: '#f8fafc' } },
      header: { type: 'box', layout: 'vertical', paddingAll: '20px', contents: [
        { type: 'text', text: 'NLEX', color: '#22d3ee', size: 'xl', weight: 'bold', align: 'center' },
        { type: 'text', text: 'วิธีเข้าใช้งาน', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', margin: 'sm' }
      ]},
      body: { type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'lg', contents: [
        { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '28px', height: '28px', backgroundColor: '#22d3ee', cornerRadius: '14px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [{ type: 'text', text: '1', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }] },
          { type: 'box', layout: 'vertical', flex: 1, contents: [{ type: 'text', text: 'Login เข้า medninja.academy', color: '#1e293b', size: 'sm', weight: 'bold', wrap: true }] }
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '28px', height: '28px', backgroundColor: '#22d3ee', cornerRadius: '14px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [{ type: 'text', text: '2', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }] },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เชื่อม LINE ที่หน้าโปรไฟล์', color: '#1e293b', size: 'sm', weight: 'bold', wrap: true },
            { type: 'text', text: 'ต้องเชื่อม LINE ก่อนถึงจะใช้ NLEX ได้', color: '#94a3b8', size: 'xs', wrap: true, margin: 'xs' }
          ] }
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '28px', height: '28px', backgroundColor: '#22d3ee', cornerRadius: '14px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [{ type: 'text', text: '3', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }] },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'กดปุ่ม NLEX', color: '#1e293b', size: 'sm', weight: 'bold', wrap: true },
            { type: 'text', text: 'บนแถบเมนูบนสุด หรือ ที่หน้าเรียนใกล้ปุ่มเข้าห้องเรียนสด', color: '#94a3b8', size: 'xs', wrap: true, margin: 'xs' }
          ] }
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '28px', height: '28px', backgroundColor: '#22d3ee', cornerRadius: '14px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [{ type: 'text', text: '4', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }] },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เลือกโหมดทำข้อสอบ', color: '#1e293b', size: 'sm', weight: 'bold', wrap: true },
            { type: 'text', text: 'ตามหัวข้อ · ตามชุด · สุ่มผสม · สุ่มทุกหัวข้อ · สุ่มในหัวข้อ', color: '#94a3b8', size: 'xs', wrap: true, margin: 'xs' }
          ] }
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '28px', height: '28px', backgroundColor: '#22d3ee', cornerRadius: '14px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [{ type: 'text', text: '5', color: '#FFFFFF', size: 'sm', weight: 'bold', align: 'center' }] },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'ทำข้อสอบ + ดูเฉลยละเอียด', color: '#1e293b', size: 'sm', weight: 'bold', wrap: true },
            { type: 'text', text: 'สงสัยตรงไหน กดส่งคำถามตรงถึงหมอแตมได้ทันที', color: '#94a3b8', size: 'xs', wrap: true, margin: 'xs' }
          ] }
        ]}
      ]},
      footer: { type: 'box', layout: 'vertical', paddingAll: '16px', contents: [
        { type: 'text', text: 'เฉพาะนักเรียนที่สมัคร NL1+2 (MASTERY)', color: '#64748b', size: 'xs', align: 'center', wrap: true },
        { type: 'text', text: 'MedNinja Co., Ltd.', color: '#94a3b8', size: 'xxs', align: 'center', margin: 'md' }
      ]}
    }
  }

  // ส่ง Flex แรก
  await pushMessage(userId, [flexAnnounce])
  // เว้น 3 วินาที แล้วส่งวิธีเข้าใช้
  setTimeout(async () => {
    try { await pushMessage(userId, [flexHowto]) } catch (e) { console.error('[LINE] NLEX howto error:', e.message) }
  }, 3000)
}

module.exports = router
