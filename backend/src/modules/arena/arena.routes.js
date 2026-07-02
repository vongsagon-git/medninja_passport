const router = require('express').Router()
const ArenaCard = require('./ArenaCard.model')
const ArenaPlayer = require('./ArenaPlayer.model')
const FlashcardPattern = require('../flashcard/FlashcardPattern.model')
const FlashcardCC = require('../flashcard/FlashcardCC.model')

const LIFF_CHANNEL_ID = '2009259048'
const ADMIN_UIDS = [
  'U2b0de81f0ec73e8561197393683a9e95',  // เติ้ล (TT)
  'Ue6b6c4daf46d1765f1af71b292fe6fc9',  // แตม (CT)
  'U398ec17f9dbf5917c2fd83bec6fe24ef'   // ฝน (FF)
]
const ADMIN_NAMES = {
  'U2b0de81f0ec73e8561197393683a9e95': 'TT',
  'Ue6b6c4daf46d1765f1af71b292fe6fc9': 'CT',
  'U398ec17f9dbf5917c2fd83bec6fe24ef': 'FF'
}

// ═══════════════════════════════════════════
// QR LOGIN FLOW (desktop scan)
// 1. Desktop: GET /api/arena/qr-token → ได้ token
// 2. มือถือ scan QR → LIFF → POST /api/arena/qr-confirm { token, idToken }
// 3. Desktop: GET /api/arena/qr-check?token=xxx → ได้ player (poll ทุก 2 วิ)
// ═══════════════════════════════════════════
const pendingLogins = new Map() // token → { player, createdAt }

// Desktop: ขอ token ใหม่
router.get('/qr-token', (req, res) => {
  const token = require('crypto').randomBytes(16).toString('hex')
  pendingLogins.set(token, { player: null, createdAt: Date.now() })
  // ลบ token เก่า > 5 นาที
  for (const [k, v] of pendingLogins) {
    if (Date.now() - v.createdAt > 5 * 60 * 1000) pendingLogins.delete(k)
  }
  res.json({ ok: true, token })
})

// มือถือ: scan QR → confirm login (รับ idToken หรือ accessToken+profile)
router.post('/qr-confirm', async (req, res) => {
  try {
    const { token, idToken, accessToken, lineUserId, displayName, pictureUrl } = req.body
    if (!token) return res.status(400).json({ ok: false, error: 'missing token' })

    const pending = pendingLogins.get(token)
    if (!pending) return res.status(400).json({ ok: false, error: 'token หมดอายุ' })

    let userId, name = '', pic = ''

    // วิธี 1: idToken (Android ปกติ)
    if (idToken) {
      const verifyResp = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: idToken, client_id: process.env.LINE_CHANNEL_ID })
      })
      if (verifyResp.ok) {
        const profile = await verifyResp.json()
        userId = profile.sub
        name = profile.name || ''
        pic = profile.picture || ''
      }
    }

    // วิธี 2: accessToken + profile (iOS fallback)
    if (!userId && accessToken && lineUserId) {
      const profileResp = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (profileResp.ok) {
        const p = await profileResp.json()
        if (p.userId === lineUserId) {
          userId = p.userId
          name = displayName || p.displayName || ''
          pic = pictureUrl || p.pictureUrl || ''
        }
      }
    }

    if (!userId) return res.status(400).json({ ok: false, error: 'verify ไม่สำเร็จ' })

    const player = await ArenaPlayer.findOneAndUpdate(
      { lineUserId: userId },
      { $set: { displayName: name, pictureUrl: pic }, $setOnInsert: { lineUserId: userId } },
      { upsert: true, new: true }
    )


    pending.player = player
    pending.isAdmin = ADMIN_UIDS.includes(userId)
    pending.adminName = ADMIN_NAMES[userId] || null
    res.json({ ok: true, message: 'Login สำเร็จ!' })
  } catch (err) {
    console.error('[Arena QR Confirm] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Desktop: poll เช็คว่า login สำเร็จหรือยัง
router.get('/qr-check', (req, res) => {
  const { token } = req.query
  const pending = pendingLogins.get(token)
  if (!pending) return res.json({ ok: false, status: 'expired' })
  if (!pending.player) return res.json({ ok: false, status: 'waiting' })
  // login สำเร็จ!
  const player = pending.player
  const isAdmin = pending.isAdmin || ADMIN_UIDS.includes(player.lineUserId)
  const adminName = pending.adminName || ADMIN_NAMES[player.lineUserId] || null
  pendingLogins.delete(token)
  res.json({ ok: true, player, isAdmin, adminName })
})

// ═══════════════════════════════════════════
// LOGIN — LIFF idToken verify (มือถือตรง)
// POST /api/arena/login
// ═══════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ ok: false, error: 'ไม่มี idToken' })

    const verifyResp = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID
      })
    })

    if (!verifyResp.ok) {
      console.error('[Arena Login] LINE verify failed:', await verifyResp.text())
      return res.status(400).json({ ok: false, error: 'idToken ไม่ถูกต้อง' })
    }

    const profile = await verifyResp.json()
    const lineUserId = profile.sub
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'ไม่ได้รับ LINE userId' })

    const player = await ArenaPlayer.findOneAndUpdate(
      { lineUserId },
      { $set: { displayName: profile.name || '', pictureUrl: profile.picture || '' }, $setOnInsert: { lineUserId } },
      { upsert: true, new: true }
    )


    res.json({ ok: true, player, isAdmin: ADMIN_UIDS.includes(lineUserId), adminName: ADMIN_NAMES[lineUserId] || null })
  } catch (err) {
    console.error('[Arena Login] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// LOGIN via LIFF Profile (iOS fallback — idToken ไม่ได้)
// POST /api/arena/login-profile
// ═══════════════════════════════════════════
router.post('/login-profile', async (req, res) => {
  try {
    const { lineUserId, displayName, pictureUrl, accessToken } = req.body
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'ไม่มี lineUserId' })

    // verify accessToken กับ LINE API
    if (accessToken) {
      const verifyResp = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!verifyResp.ok) {
        return res.status(400).json({ ok: false, error: 'accessToken ไม่ถูกต้อง' })
      }
      const profile = await verifyResp.json()
      if (profile.userId !== lineUserId) {
        return res.status(400).json({ ok: false, error: 'userId ไม่ตรง' })
      }
    }

    const player = await ArenaPlayer.findOneAndUpdate(
      { lineUserId },
      { $set: { displayName: displayName || '', pictureUrl: pictureUrl || '' }, $setOnInsert: { lineUserId } },
      { upsert: true, new: true }
    )


    res.json({ ok: true, player, isAdmin: ADMIN_UIDS.includes(lineUserId), adminName: ADMIN_NAMES[lineUserId] || null })
  } catch (err) {
    console.error('[Arena LoginProfile] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// LINE LOGIN — OAuth2 (backup)
// ═══════════════════════════════════════════
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

router.get('/line-login', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/arena/line-callback`
  const state = Math.random().toString(36).substring(2)
  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid`
  res.redirect(url)
})

router.get('/line-callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return res.redirect('/ddx-arena?error=no_code')

    const redirectUri = `${req.protocol}://${req.get('host')}/api/arena/line-callback`

    // แลก code → access_token
    const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET
      })
    })

    if (!tokenResp.ok) {
      console.error('[Arena LINE] token exchange failed:', await tokenResp.text())
      return res.redirect('/ddx-arena?error=token_fail')
    }

    const tokenData = await tokenResp.json()

    // ดึง profile
    const profileResp = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    if (!profileResp.ok) {
      console.error('[Arena LINE] profile failed:', await profileResp.text())
      return res.redirect('/ddx-arena?error=profile_fail')
    }

    const profile = await profileResp.json()

    // Find or create player
    const player = await ArenaPlayer.findOneAndUpdate(
      { lineUserId: profile.userId },
      {
        $set: {
          displayName: profile.displayName || '',
          pictureUrl: profile.pictureUrl || ''
        },
        $setOnInsert: { lineUserId: profile.userId }
      },
      { upsert: true, new: true }
    )

    // Redirect กลับพร้อมข้อมูล player (encode ใน URL)
    const playerData = encodeURIComponent(JSON.stringify({
      lineUserId: player.lineUserId,
      displayName: player.displayName,
      pictureUrl: player.pictureUrl,
      bestScore: player.bestScore || 0,
      totalGames: player.totalGames || 0,
      isAdmin: ADMIN_UIDS.includes(player.lineUserId),
      adminName: ADMIN_NAMES[player.lineUserId] || null
    }))
    res.redirect(`/ddx-arena?player=${playerData}`)
  } catch (err) {
    console.error('[Arena LINE Callback] error:', err)
    res.redirect('/ddx-arena?error=server')
  }
})

// ═══════════════════════════════════════════
// SUBMIT — บันทึกผลเกม
// POST /api/arena/submit
// ═══════════════════════════════════════════
router.post('/submit', async (req, res) => {
  try {
    const { lineUserId, mode, correct, wrong, maxStreak, totalQuestions } = req.body
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'ไม่มี lineUserId' })

    // Validate: correct + wrong ต้อง <= round size (5)
    const c = Math.max(0, parseInt(correct) || 0)
    const w = Math.max(0, parseInt(wrong) || 0)
    if (c + w > 5) return res.status(400).json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' })

    // คำนวณ score ฝั่ง server — ไม่เชื่อ client
    let score = Math.max(0, c * 10 - w * 5)
    // streak bonus: ถูกครบ 5 ข้อ = +50
    if (c === 5 && w === 0) score += 50

    const update = {
      $inc: {
        totalGames: 1,
        totalCorrect: c,
        totalWrong: w
      },
      $set: {
        lastMode: mode || '',
        lastPlayedAt: new Date()
      }
    }

    // bestScore — อัปเดตเฉพาะถ้าสูงกว่าเดิม
    if (typeof score === 'number') {
      update.$max = { ...update.$max, bestScore: score }
    }
    // bestStreak — อัปเดตเฉพาะถ้าสูงกว่าเดิม
    if (typeof maxStreak === 'number') {
      update.$max = { ...(update.$max || {}), bestStreak: maxStreak }
    }

    // Monthly score — รีเซ็ตอัตโนมัติเมื่อเดือนใหม่
    const currentMonth = new Date().toISOString().slice(0, 7) // "2026-04"
    const playerBefore = await ArenaPlayer.findOne({ lineUserId }).lean()
    if (playerBefore && playerBefore.monthlyMonth && playerBefore.monthlyMonth !== currentMonth) {
      // เดือนใหม่ → archive เดือนเก่า + reset
      await ArenaPlayer.updateOne({ lineUserId }, {
        $push: { monthlyHistory: { month: playerBefore.monthlyMonth, score: playerBefore.monthlyScore || 0, games: playerBefore.monthlyGames || 0 } }
      })
      update.$set.monthlyScore = Math.max(0, score || 0)
      update.$set.monthlyMonth = currentMonth
      update.$set.monthlyGames = 1
    } else if (!playerBefore || !playerBefore.monthlyMonth) {
      // ยังไม่เคยมี monthly → เริ่มใหม่
      update.$set.monthlyScore = Math.max(0, score || 0)
      update.$set.monthlyMonth = currentMonth
      update.$set.monthlyGames = 1
    } else {
      // เดือนเดิม → สะสม
      update.$inc.monthlyScore = Math.max(0, score || 0)
      update.$inc.monthlyGames = 1
    }

    const player = await ArenaPlayer.findOneAndUpdate(
      { lineUserId },
      update,
      { new: true }
    )

    if (!player) return res.status(404).json({ ok: false, error: 'ไม่พบผู้เล่น' })

    // หา rank (monthly)
    const rank = await ArenaPlayer.countDocuments({
      monthlyMonth: currentMonth,
      monthlyScore: { $gt: player.monthlyScore }
    }) + 1

    res.json({ ok: true, player, rank, bestScore: player.bestScore })

    // ═══ ส่ง Flex สรุปผลให้คนเล่นทาง LINE (ไม่ block response) ═══
    try {
      const { pushMessage } = require('../line/line.webhook.service')
      const pct = Math.round((c / 5) * 100)
      const scoreText = `${c}/5 ข้อ (${pct}%)`

      // คำให้กำลังใจ
      const perfectPhrases = [
        'ยอดเยี่ยมมาก! ถูกครบทุกข้อ!',
        'สุดยอด! Perfect round!',
        'เก่งมาก! Full score!'
      ]
      const goodPhrases = [
        'เก่งมากค่ะ! ฝึกต่อไปนะคะ',
        'ดีมากค่ะ! ยิ่งเล่นยิ่งแม่น',
        'ใกล้เต็มแล้วค่ะ! อีกนิดเดียว!',
        'ไปได้สวยค่ะ! เก่งมาก!',
        'ทำได้ดีค่ะ! ความรู้แน่นขึ้นมาก!'
      ]
      const encouragePhrases = [
        'สู้ๆ นะคะ ฝึกอีกนิดจะเก่งขึ้นค่ะ!',
        'อย่าท้อนะคะ ทุกคนเริ่มจากตรงนี้!',
        'ผิดไม่เป็นไรค่ะ ผิดแล้วจำได้ดีกว่า!',
        'ค่อยๆ ฝึกนะคะ แม่นขึ้นแน่นอนค่ะ!',
        'เล่นบ่อยๆ จะดีขึ้นเองค่ะ!'
      ]
      let encourageText
      if (pct === 100) encourageText = perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)]
      else if (pct >= 60) encourageText = goodPhrases[Math.floor(Math.random() * goodPhrases.length)]
      else encourageText = encouragePhrases[Math.floor(Math.random() * encouragePhrases.length)]

      const pic = player.pictureUrl || ''
      const isAdmin = ADMIN_UIDS.includes(lineUserId)
      const displayName = isAdmin ? (ADMIN_NAMES[lineUserId] || 'NINJA') : (player.displayName || 'Player')

      const shareUri = 'https://line.me/R/share?text=' + encodeURIComponent('DDx ARENA เปิดแล้ว! เกมฝึกวินิจฉัยแยกโรค แข่งกันว่าใครจะเป็นที่หนึ่ง\nเล่นฟรี โดย MedNinja\nddx.medninja.academy')

      const bodyContents = [
        // DDx ARENA header
        { type: 'box', layout: 'horizontal', justifyContent: 'flex-end', spacing: 'sm', contents: [
          { type: 'text', text: 'DDx', size: 'lg', weight: 'bold', color: '#f97316', flex: 0 },
          { type: 'text', text: 'ARENA', size: 'lg', weight: 'bold', color: '#FFFFFF', flex: 0 }
        ]},
        { type: 'separator', color: '#1e293b', margin: 'md' },
        // รูป + ชื่อ + คะแนนรอบนี้
        { type: 'box', layout: 'horizontal', spacing: 'md', alignItems: 'center', margin: 'md', contents: [
          ...(pic ? [{ type: 'image', url: pic, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 }] : []),
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: `NINJA ${displayName}`, size: 'sm', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: `รอบนี้ +${score} คะแนน`, size: 'xs', weight: 'bold', color: pct >= 60 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444' }
          ]}
        ]},
        { type: 'separator', color: '#1e293b', margin: 'md' },
        // สะสมเดือนนี้
        { type: 'text', text: `สะสมเดือนนี้: ${player.monthlyScore} คะแนน`, size: 'xs', weight: 'bold', color: '#fbbf24', margin: 'md' },
        { type: 'separator', color: '#1e293b', margin: 'md' },
        // ให้กำลังใจ — สีเขียวเสมอ
        { type: 'text', text: encourageText, size: 'xs', color: '#34d399', margin: 'md', wrap: true }
      ]


      const flex = {
        type: 'flex', altText: `DDx Arena — รอบนี้ +${score} คะแนน`,
        contents: {
          type: 'bubble', size: 'kilo',
          body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: bodyContents },
          footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
            { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
              { type: 'button', action: { type: 'uri', label: 'เล่นอีกรอบ', uri: 'https://ddx.medninja.academy' }, style: 'primary', color: '#dc2626', height: 'sm', flex: 2 },
              { type: 'button', action: { type: 'uri', label: 'ชวนเพื่อน', uri: shareUri }, style: 'primary', color: '#3b82f6', height: 'sm', flex: 2 }
            ]}
          ]}
        }
      }
      pushMessage(lineUserId, [flex]).catch(e => console.log('[Arena Flex] push error:', e.message))
    } catch (e) { console.log('[Arena Flex] build error:', e.message) }
  } catch (err) {
    console.error('[Arena Submit] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// LEADERBOARD — monthly score (ลำดับในยุทธจักร)
// GET /api/arena/leaderboard
// ═══════════════════════════════════════════
router.post('/leaderboard', async (req, res) => {
  try {
    const requesterId = req.body.uid || ''
    const currentMonth = new Date().toISOString().slice(0, 7)

    // ดึงคนที่เล่นเดือนนี้ (มีคะแนน)
    const activePlayers = await ArenaPlayer.find({ monthlyMonth: currentMonth })
      .sort({ monthlyScore: -1, totalGames: -1, createdAt: -1 })
      .limit(100)
      .lean()
    const activeIds = new Set(activePlayers.map(p => p.lineUserId))

    // ดึงคนที่เคยเล่น (ทุกเดือน) ที่ยังไม่ได้เล่นเดือนนี้ → แสดงเป็น "กำลังเล่น"
    const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonth = prevDate.toISOString().slice(0, 7)
    const pastPlayers = await ArenaPlayer.find({
      monthlyMonth: { $ne: currentMonth }
    }).sort({ bestScore: -1 }).lean()
    const returningPlayers = pastPlayers.filter(p => !activeIds.has(p.lineUserId))

    // แชมป์เดือนก่อน — เช็คทั้ง monthlyHistory + คนที่ monthlyMonth = เดือนก่อน (ยังไม่ถูก archive)
    const archivedPlayers = await ArenaPlayer.find({ 'monthlyHistory.month': prevMonth }).lean()

    let prevChamp = null
    let prevBestScore = 0
    for (const p of archivedPlayers) {
      const hist = (p.monthlyHistory || []).find(h => h.month === prevMonth)
      if (hist && hist.score > prevBestScore) {
        prevBestScore = hist.score
        const isAdmin = ADMIN_UIDS.includes(p.lineUserId)
        prevChamp = { displayName: isAdmin ? (ADMIN_NAMES[p.lineUserId] || 'NINJA') : p.displayName, score: hist.score, pictureUrl: isAdmin ? '' : (p.pictureUrl || '') }
      }
    }
    // คนที่ monthlyMonth = prevMonth (ยังไม่ถูก archive)
    const notArchivedChamps = pastPlayers.filter(p => p.monthlyMonth === prevMonth && (p.monthlyScore || 0) > 0)
    for (const p of notArchivedChamps) {
      if ((p.monthlyScore || 0) > prevBestScore) {
        prevBestScore = p.monthlyScore
        const isAdmin = ADMIN_UIDS.includes(p.lineUserId)
        prevChamp = { displayName: isAdmin ? (ADMIN_NAMES[p.lineUserId] || 'NINJA') : p.displayName, score: p.monthlyScore, pictureUrl: isAdmin ? '' : (p.pictureUrl || '') }
      }
    }
    if (!prevChamp) prevChamp = { displayName: '⚔️ NINJA', score: 0, pictureUrl: '' }

    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const daysLeft = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24))

    let myRank = -1
    // สร้าง leaderboard: คนเดือนนี้ (มีคะแนน) + คนเดือนก่อน (กำลังเล่น, score=0)
    const leaderboard = activePlayers.map((p, i) => {
      const isAdmin = ADMIN_UIDS.includes(p.lineUserId)
      if (requesterId && p.lineUserId === requesterId) myRank = i + 1
      return {
        rank: i + 1,
        displayName: isAdmin ? (ADMIN_NAMES[p.lineUserId] || 'NINJA') : (p.displayName || 'ผู้เล่น'),
        pictureUrl: isAdmin ? '' : (p.pictureUrl || ''),
        monthlyScore: p.monthlyScore || 0,
        isAdmin,
        isMe: requesterId ? (p.lineUserId === requesterId) : false
      }
    })
    // เติมคนเดือนก่อนต่อท้าย (score = 0 → frontend แสดง "กำลังเล่น")
    for (const p of returningPlayers) {
      const isAdmin = ADMIN_UIDS.includes(p.lineUserId)
      if (requesterId && p.lineUserId === requesterId && myRank === -1) myRank = leaderboard.length + 1
      leaderboard.push({
        rank: leaderboard.length + 1,
        displayName: isAdmin ? (ADMIN_NAMES[p.lineUserId] || 'NINJA') : (p.displayName || 'ผู้เล่น'),
        pictureUrl: isAdmin ? '' : (p.pictureUrl || ''),
        monthlyScore: 0,
        isAdmin,
        isMe: requesterId ? (p.lineUserId === requesterId) : false
      })
    }

    res.json({ ok: true, leaderboard, currentMonth, daysLeft, prevChamp, myRank })
  } catch (err) {
    console.error('[Arena Leaderboard] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// PROFILE — ข้อมูลผู้เล่น + rank
// GET /api/arena/profile?lineUserId=xxx
// ═══════════════════════════════════════════
router.get('/profile', async (req, res) => {
  try {
    const { lineUserId } = req.query
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'ไม่มี lineUserId' })

    const player = await ArenaPlayer.findOne({ lineUserId }).lean()
    if (!player) return res.status(404).json({ ok: false, error: 'ไม่พบผู้เล่น' })

    // หา rank จากจำนวนคนที่ bestScore สูงกว่า + 1
    const rank = await ArenaPlayer.countDocuments({
      totalGames: { $gt: 0 },
      bestScore: { $gt: player.bestScore }
    }) + 1

    const totalPlayers = await ArenaPlayer.countDocuments({ totalGames: { $gt: 0 } })

    res.json({
      ok: true,
      player: {
        ...player,
        lineUserId: player.lineUserId.substring(0, 5) + '***'
      },
      rank,
      totalPlayers
    })
  } catch (err) {
    console.error('[Arena Profile] error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// MODE 1 — DDx Buzzwords (462 การ์ดจาก Excel)
// เห็น Buzzwords → เลือก DDx
// GET /api/arena/mode/ddx?count=10
// ═══════════════════════════════════════════
router.get('/mode/ddx', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 10, 30)
    // ต้องมี decoys >= 3 ถึงจะออกในเกม
    const cards = await ArenaCard.find({
      isActive: true,
      relatedCC: { $ne: '' },
      'decoys.2': { $exists: true }, // มี decoys อย่างน้อย 3
      $and: [
        { $or: [{ auditStatus: 'approved' }, { isAudited: true, auditStatus: { $exists: false } }] },
        { $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }] } // ต้องมี clue อย่างน้อย 1
      ]
    }).lean()

    shuffle(cards)
    const questions = cards.slice(0, count).map(card => {
      const { choices, _a } = buildChoicesFromDB(card.ddx, card.ddxTh, card.decoys)
      return {
        id: card._id,
        mode: 'ddx',
        history: card.history || [],
        pe: card.pe || [],
        investigation: card.investigation || [],
        relatedCC: card.relatedCC,
        relatedCCEn: card.relatedCCEn,
        choices, _a
      }
    })

    res.json({ ok: true, questions, total: cards.length })
  } catch (err) {
    console.error('[Arena] ddx error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// MODE 2 — Pattern → DDx (151 pattern จาก FlashcardPattern)
// เห็น pattern → เลือกคำตอบ
// GET /api/arena/mode/pattern?count=10
// ═══════════════════════════════════════════
router.get('/mode/pattern', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 10, 30)
    const patterns = await FlashcardPattern.find({ isActive: true }).lean()

    const byCat = groupBy(patterns, 'category')
    const eligible = patterns.filter(p => (byCat[p.category] || []).length >= 4)
    shuffle(eligible)

    const questions = eligible.slice(0, count).map(p => {
      // สุ่ม decoys จากหมวดเดียวกัน (ไม่ซ้ำคำตอบ)
      const sameCategory = (byCat[p.category] || []).filter(d => d.answer !== p.answer)
      shuffle(sameCategory)
      const decoyNames = sameCategory.slice(0, 3).map(d => d.answer)
      const { choices, _a } = buildChoicesFromDB(p.answer, '', decoyNames)
      return {
        id: p._id,
        mode: 'pattern',
        prompt: p.pattern,
        category: p.category,
        mnemonic: p.mnemonic,
        choices, _a
      }
    })

    res.json({ ok: true, questions, total: eligible.length })
  } catch (err) {
    console.error('[Arena] pattern error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// MODE 3 — Odd One Out (73 CC → หา DDx ที่ไม่เข้าพวก)
// แสดง CC + 3 DDx จริง + 1 DDx ปลอม → หาตัวปลอม
// GET /api/arena/mode/oddone?count=10
// ═══════════════════════════════════════════
router.get('/mode/oddone', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 10, 30)
    const allCC = await FlashcardCC.find({ isActive: true }).lean()

    // ต้องมี >= 4 DDx ใน list
    const eligible = allCC.filter(cc => (cc.ddxList || []).length >= 4)
    if (eligible.length < 2) return res.json({ ok: false, error: 'ยังมี CC ไม่พอ' })

    shuffle(eligible)
    const questions = []

    for (let i = 0; i < Math.min(count, eligible.length); i++) {
      const cc = eligible[i]
      const ddxList = [...cc.ddxList]
      shuffle(ddxList)

      // เลือก 3 DDx จริง (เข้าพวก)
      const insiders = ddxList.slice(0, 3)

      // เลือก 1 DDx จาก CC อื่น (ไม่เข้าพวก)
      const otherCCs = eligible.filter(c => c.cc !== cc.cc)
      const otherCC = otherCCs[Math.floor(Math.random() * otherCCs.length)]
      const otherDdxList = otherCC.ddxList.filter(d => !ddxList.includes(d))
      if (otherDdxList.length === 0) continue
      const oddOne = otherDdxList[Math.floor(Math.random() * otherDdxList.length)]

      const choices = [
        ...insiders.map(d => ({ ddx: d, ddxTh: '' })),
        { ddx: oddOne, ddxTh: '', _correct: true }
      ]
      shuffle(choices)
      const correctIndex = choices.findIndex(c => c._correct)
      choices.forEach(c => delete c._correct)

      questions.push({
        id: cc._id,
        mode: 'oddone',
        prompt: `${cc.cc} (${cc.ccEn || ''})`,
        relatedCC: cc.cc,
        choices,
        _a: Buffer.from(String(correctIndex)).toString('base64')
      })
    }

    res.json({ ok: true, questions, total: eligible.length })
  } catch (err) {
    console.error('[Arena] oddone error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// MIXED — DDx 2 + Pattern 2 + OddOut 1 = 5 ข้อ
// decoys จาก DB เท่านั้น — ไม่มี decoys ไม่ออก
// GET /api/arena/mode/mixed
// ═══════════════════════════════════════════
router.get('/mode/mixed', async (req, res) => {
  try {
    const questions = []

    // Pool 1: DDx — 2 ข้อ (ต้องมี decoys >= 3)
    const ddxCards = await ArenaCard.find({
      isActive: true,
      relatedCC: { $ne: '' },
      'decoys.2': { $exists: true },
      $and: [
        { $or: [{ auditStatus: 'approved' }, { isAudited: true, auditStatus: { $exists: false } }] },
        { $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }] }
      ]
    }).lean()
    shuffle(ddxCards)
    for (const card of ddxCards.slice(0, 2)) {
      const { choices, _a } = buildChoicesFromDB(card.ddx, card.ddxTh, card.decoys)
      questions.push({
        id: card._id, mode: 'ddx',
        history: card.history || [],
        pe: card.pe || [],
        investigation: card.investigation || [],
        relatedCC: card.relatedCC,
        relatedCCEn: card.relatedCCEn,
        choices, _a
      })
    }

    // Pool 2: Pattern — 2 ข้อ (ต้องมี decoys >= 3)
    const patterns = await FlashcardPattern.find({
      isActive: true,
      'decoys.2': { $exists: true }
    }).lean()
    shuffle(patterns)
    for (const p of patterns.slice(0, 2)) {
      const { choices, _a } = buildChoicesFromDB(p.answer, '', p.decoys)
      questions.push({
        id: p._id, mode: 'pattern',
        prompt: p.pattern,
        category: p.category,
        mnemonic: p.mnemonic,
        choices, _a
      })
    }

    // Pool 3: OddOut — 1 ข้อ (ต้องมี decoys >= 1 + ddxList >= 3)
    const allCC = await FlashcardCC.find({
      isActive: true,
      'decoys.0': { $exists: true },
      'ddxList.2': { $exists: true }
    }).lean()
    shuffle(allCC)
    if (allCC.length > 0) {
      const cc = allCC[0]
      const ddxList = [...cc.ddxList]; shuffle(ddxList)
      const insiders = ddxList.slice(0, 3)
      const decoyList = [...cc.decoys]; shuffle(decoyList)
      const oddOne = decoyList[0]
      const choices = [
        ...insiders.map(d => ({ ddx: d, ddxTh: '' })),
        { ddx: oddOne, ddxTh: '', _correct: true }
      ]
      shuffle(choices)
      const correctIndex = choices.findIndex(c => c._correct)
      choices.forEach(c => delete c._correct)
      questions.push({
        id: cc._id, mode: 'oddone',
        prompt: `${cc.cc} (${cc.ccEn || ''})`,
        relatedCC: cc.cc,
        choices,
        _a: Buffer.from(String(correctIndex)).toString('base64')
      })
    }

    // สลับลำดับ 5 ข้อ
    shuffle(questions)

    res.json({ ok: true, questions, total: questions.length })
  } catch (err) {
    console.error('[Arena] mixed error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [ddxTotal, ddxAudited, patternTotal, ccTotal] = await Promise.all([
      ArenaCard.countDocuments(),
      ArenaCard.countDocuments({ isAudited: true, isActive: true }),
      FlashcardPattern.countDocuments({ isActive: true }),
      FlashcardCC.countDocuments({ isActive: true })
    ])
    const ccGroups = await ArenaCard.distinct('relatedCC', {
      isActive: true, $or: [{ auditStatus: 'approved' }, { isAudited: true, auditStatus: { $exists: false } }], relatedCC: { $ne: '' }
    })
    res.json({ ok: true, ddxTotal, ddxAudited, patternTotal, ccTotal, ccGroups: ccGroups.length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ═══ Helpers ═══
function groupBy(arr, key) {
  const map = {}
  for (const item of arr) {
    const k = item[key] || ''
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}

// ═══ ใช้ decoys จาก DB เท่านั้น — ไม่ random ═══
// สุ่ม 3 จาก decoys[] + shuffle ตำแหน่งทุกครั้ง
// ไม่ส่ง correct: true/false → ส่ง _a (obfuscated correct index) แทน
function buildChoicesFromDB(correctDdx, correctDdxTh, decoys) {
  const d = [...(decoys || [])]
  shuffle(d)
  const picked = d.slice(0, 3)
  const choices = [
    { ddx: correctDdx, ddxTh: correctDdxTh || '', _correct: true },
    ...picked.map(name => ({ ddx: name, ddxTh: '' }))
  ]
  shuffle(choices) // สลับตำแหน่งทุกครั้ง
  // หา index ของคำตอบถูก แล้วลบ _correct flag ออก
  const correctIndex = choices.findIndex(c => c._correct)
  choices.forEach(c => delete c._correct)
  return { choices, _a: Buffer.from(String(correctIndex)).toString('base64') }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// GET /api/arena/status — เช็ค maintenance mode
const arenaState = require('./arena.state')
router.get('/status', (req, res) => {
  res.json({ ok: true, maintenance: arenaState.maintenance, message: arenaState.maintenanceMsg })
})

module.exports = router
