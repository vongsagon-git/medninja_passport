/**
 * Trial Guard Middleware — enforce state='demo' for /api/trial/* routes
 * 2026-08-15 Phase 3
 *
 * ตรวจ:
 *   1. auth already applied (req.user exists)
 *   2. compute state → must be 'demo'
 *   3. inject req.trialContext = { demoPackageId, demoSectionIds }
 *
 * Reject:
 *   - not demo state → 403 NOT_TRIAL
 *   - demo_expired → 403 DEMO_EXPIRED
 */

const User = require('../../modules/user/User.model')
const PreRegistration = require('../../modules/preregister/PreRegistration.model')
const Activation = require('../../modules/activation/Activation.model')
const Package = require('../../modules/content/Package.model')
const { computeUserState } = require('../lib/userState')

async function trialGuard(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) return res.status(401).json({ message: 'unauthorized' })

    // admin/staff bypass (สำหรับ preview trial)
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const demoPkg = await Package.findOne({ isDemo: true }).lean()
      req.trialContext = {
        demoPackageId: demoPkg?._id?.toString() || null,
        demoSectionIds: (demoPkg?.sections || []).map(s => s.toString()),
        state: 'admin-preview'
      }
      return next()
    }

    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ message: 'user not found' })

    const [reg, activations, demoPkgs] = await Promise.all([
      PreRegistration.findOne({ nationalId: user.nationalId }).lean(),
      Activation.find({ userId: user._id, isActive: true }).lean(),
      Package.find({ isDemo: true }).lean()
    ])

    const demoPkgIds = new Set(demoPkgs.map(d => d._id.toString()))
    const state = computeUserState(reg, user, activations, demoPkgIds)

    if (state !== 'demo') {
      return res.status(403).json({
        message: state === 'demo_expired' ? 'DEMO_EXPIRED' : 'NOT_TRIAL',
        state
      })
    }

    // LINE gate ก็บังคับ (ตาม global rule)
    if (!user.lineUserId) {
      return res.status(403).json({ message: 'LINE_REQUIRED', detail: 'กรุณาเชื่อม LINE ก่อน' })
    }

    // inject context
    const demoPkg = demoPkgs[0]  // เอาตัวแรก (มีเดียวในระบบ)
    req.trialContext = {
      demoPackageId: demoPkg?._id?.toString() || null,
      demoSectionIds: (demoPkg?.sections || []).map(s => s.toString()),
      state: 'demo'
    }

    next()
  } catch (err) {
    console.error('[trialGuard]', err)
    return res.status(500).json({ message: 'trial check failed: ' + err.message })
  }
}

module.exports = trialGuard
