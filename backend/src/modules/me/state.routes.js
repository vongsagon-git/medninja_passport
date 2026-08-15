/**
 * User State Endpoint (Passport)
 * 2026-08-15
 *
 * GET /api/me/state
 *   - Return computed state + redirect target + LINE contact URL
 *   - Frontend uses this to route user after login (before /my or /my-trial)
 *
 * Auth: requires JWT (via `auth` middleware, mounted in app.js)
 */

const express = require('express')
const router = express.Router()

const User = require('../user/User.model')
const PreRegistration = require('../preregister/PreRegistration.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const { computeUserState, buildStateResponse } = require('../../shared/lib/userState')

router.get('/state', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) return res.status(401).json({ message: 'unauthorized' })

    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ message: 'user not found' })

    // admin/staff → skip state machine (always paid access)
    if (user.role === 'admin' || user.role === 'staff') {
      return res.json({
        state: 'student',
        aud: 'paid',
        apiBase: '/api/my',
        redirectTo: '/my',
        name: user.name || user.email,
        role: user.role,
        isAdmin: true
      })
    }

    const [reg, activations, demoPkgs] = await Promise.all([
      PreRegistration.findOne({ nationalId: user.nationalId }).lean(),
      Activation.find({ userId: user._id, isActive: true }).lean(),
      Package.find({ isDemo: true }).select('_id').lean()
    ])

    const demoIds = new Set(demoPkgs.map(d => d._id.toString()))
    const state = computeUserState(reg, user, activations, demoIds)
    const response = buildStateResponse(state, reg, user)

    // ⭐ LINE requirement — บังคับเชื่อม LINE 100% ทุกคน ทุก state (2026-08-15)
    // Vasita: "ไม่ว่าจะใครก็ตาม ต้องเชื่อมไลน์ ไม่งั้นเข้าหน้าเชื่อมไลน์จนกว่าจะเชื่อม"
    // NO BYPASS — admin/staff (early return ด้านบน) เท่านั้นที่ไม่โดน
    const isChina = req.geo?.isChina || false
    const needsLineLink = !user.lineUserId

    // LINE gate มาก่อน state ใดๆ ทั้งหมด (banned/pending/demo/expired/student)
    if (needsLineLink) {
      response.needsLineLink = true
      response.redirectTo = '/linelink'
    }

    response.hasLine = !!user.lineUserId
    response.isChina = isChina

    return res.json(response)
  } catch (err) {
    console.error('[GET /api/me/state]', err)
    return res.status(500).json({ message: 'state check failed: ' + err.message })
  }
})

module.exports = router
