const User = require('../user/User.model')
const { logActivity, getIp, parseUA } = require('../activity/activity.service')

/**
 * POST /api/auth/line/link
 * รับ idToken จาก LIFF → verify กับ LINE API → บันทึก lineUserId
 */
exports.lineLink = async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ message: 'ไม่มี idToken' })
    }

    // Verify idToken กับ LINE API
    const verifyResp = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID
      })
    })

    if (!verifyResp.ok) {
      const err = await verifyResp.text()
      console.error('[LINE Link] verify failed:', err)
      return res.status(400).json({ message: 'idToken ไม่ถูกต้อง' })
    }

    const profile = await verifyResp.json()
    const lineUserId = profile.sub
    const lineDisplayName = profile.name || ''
    const linePictureUrl = profile.picture || ''

    if (!lineUserId) {
      return res.status(400).json({ message: 'ไม่ได้รับ LINE userId' })
    }

    // เช็คว่า lineUserId นี้เชื่อมกับ user อื่นอยู่หรือไม่
    const existing = await User.findOne({ lineUserId, _id: { $ne: req.user._id } }).lean()
    if (existing) {
      return res.status(409).json({ message: 'LINE นี้เชื่อมกับบัญชีอื่นอยู่แล้ว' })
    }

    // บันทึก
    await User.findByIdAndUpdate(req.user._id, {
      lineUserId,
      lineDisplayName,
      linePictureUrl,
      lineLinkedAt: new Date()
    })

    // ═══ Auto-update LINE Funnel ═══
    try {
      const LineFollower = require('../line/LineFollower.model')
      const Activation = require('../activation/Activation.model')
      const Package = require('../content/Package.model')

      // หาว่ามีคอร์สจริง (ไม่ใช่ demo) ไหม
      const activations = await Activation.find({ userId: req.user._id, isActive: true }).select('packageId').lean()
      const demoPkgs = await Package.find({ isDemo: true }).select('_id').lean()
      const demoIds = new Set(demoPkgs.map(p => p._id.toString()))
      const hasRealCourse = activations.some(a => !demoIds.has(a.packageId.toString()))

      const tag = hasRealCourse ? 'student' : (activations.length ? 'trial' : 'inquired')

      await LineFollower.findOneAndUpdate(
        { lineUserId },
        { linkedUserId: req.user._id, tag, tagUpdatedAt: new Date(), tagUpdatedBy: 'auto-link' },
        { upsert: false }
      )
      console.log(`[LINE Link] Funnel updated: ${lineDisplayName} → ${tag}`)
    } catch (e) {
      console.error('[LINE Link] Funnel update error:', e.message)
    }

    const ua = parseUA(req.headers['user-agent'])
    logActivity({
      userId: req.user._id,
      userName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : req.user.name,
      userEmail: req.user.email,
      action: 'line_link',
      detail: `${lineDisplayName} (${lineUserId})`,
      ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || ''
    })

    res.json({
      ok: true,
      lineDisplayName,
      linePictureUrl
    })
  } catch (error) {
    console.error('[LINE Link] error:', error.message)
    res.status(500).json({ message: 'เชื่อม LINE ไม่สำเร็จ' })
  }
}

/**
 * POST /api/auth/line/unlink
 * ยกเลิกการเชื่อม LINE
 */
exports.lineUnlink = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { lineUserId: '', lineDisplayName: '', linePictureUrl: '', lineLinkedAt: '' }
    })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: 'ยกเลิกการเชื่อม LINE ไม่สำเร็จ' })
  }
}
