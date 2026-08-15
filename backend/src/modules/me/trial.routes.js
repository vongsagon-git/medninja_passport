/**
 * Trial Content Endpoint (Passport)
 * 2026-08-15
 *
 * GET /api/me/trial-content
 *   - Return content จาก demo package (isDemo:true) มาให้ trial user
 *   - เฉพาะ user ที่ state = demo หรือ demo_expired (frontend redirect ถ้าไม่ใช่)
 *   - ไม่ leak paid course URL/ID
 *
 * Auth: requires JWT (via `auth` middleware, mounted in app.js)
 */

const express = require('express')
const router = express.Router()

const User = require('../user/User.model')
const PreRegistration = require('../preregister/PreRegistration.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const Section = require('../content/Section.model')
const { computeUserState } = require('../../shared/lib/userState')

router.get('/trial-content', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) return res.status(401).json({ message: 'unauthorized' })

    const user = await User.findById(userId).lean()
    if (!user) return res.status(404).json({ message: 'user not found' })

    // Admin/staff = allow (สำหรับ preview)
    const isAdminOrStaff = user.role === 'admin' || user.role === 'staff'

    // เช็ค state (ยกเว้น admin/staff)
    if (!isAdminOrStaff) {
      const [reg, activations, demoPkgs] = await Promise.all([
        PreRegistration.findOne({ nationalId: user.nationalId }).lean(),
        Activation.find({ userId: user._id, isActive: true }).lean(),
        Package.find({ isDemo: true }).select('_id').lean()
      ])
      const demoIds = new Set(demoPkgs.map(d => d._id.toString()))
      const state = computeUserState(reg, user, activations, demoIds)

      // Only demo can access (demo_expired ไม่ควรเห็นเนื้อหา — frontend redirect /demo-expired อยู่แล้ว)
      if (state !== 'demo') {
        return res.status(403).json({ message: 'NOT_TRIAL', state })
      }
    }

    // ดึง demo package + sections + videos
    const pkg = await Package.findOne({ isDemo: true }).lean()
    if (!pkg) {
      return res.status(404).json({ message: 'ไม่พบ demo package' })
    }

    const sections = await Section.find({ _id: { $in: pkg.sections } })
      .sort({ order: 1 })
      .lean()

    // ⭐ Strip sensitive fields (ห้าม leak Bunny library ID / drm video id ใน list)
    // frontend ใช้แค่ index → เรียก /demo/watch/:videoIndex
    const cleanSections = sections.map(s => ({
      _id: s._id.toString(),   // ⭐ real section _id (frontend ใช้ link ไป /my-trial/section/:id)
      code: s.code,
      name: s.name,
      description: s.description || '',
      videos: (s.videos || []).map((v, idx) => ({
        index: idx,
        title: v.title || `บทที่ ${idx + 1}`,
        duration: v.duration || '',
        topic: v.topic || '',
        subtopic: v.subtopic || '',
        hasBonus: !!(v.bonusBunnyVideoId || v.bonusBunnyDrmVideoId),
        bonusTitle: v.bonusTitle || '',
        bonusLabel: v.bonusLabel || '',
        // ไม่ส่ง: bunnyVideoId, bunnyDrmVideoId, bunnyLibraryId, aliVideoId
      }))
    }))

    return res.json({
      title: pkg.title,
      description: pkg.description || '',
      sections: cleanSections,
      // ⭐ real section _id ตัวแรก (สำหรับ frontend resolve sectionId → เรียก /api/trial/sections/:id)
      // Trial มี section เดียวเสมอ (DEMO-TRIAL) → return _id ให้ตรง ๆ
      primarySectionId: sections[0]?._id?.toString?.() || null
    })
  } catch (err) {
    console.error('[GET /api/me/trial-content]', err)
    return res.status(500).json({ message: 'trial content failed: ' + err.message })
  }
})

module.exports = router
