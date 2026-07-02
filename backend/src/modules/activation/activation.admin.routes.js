const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const {
  getAllActivations,
  createActivation,
  updateActivation,
  deleteActivation,
  hardDeleteActivation,
  moveActivation,
  unbanActivation
} = require('./activation.admin.controller')

// Admin: CRUD Activations
router.get('/', auth, admin, getAllActivations)
router.post('/', auth, admin, createActivation)
router.put('/:id', auth, admin, updateActivation)
router.delete('/:id', auth, admin, deleteActivation)              // แบน (soft — isActive: false)
router.post('/:id/unban', auth, admin, unbanActivation)            // ปลดแบน
router.delete('/:id/permanent', auth, admin, hardDeleteActivation) // ลบถาวร (hard — ลบจาก DB)
router.patch('/:id/move', auth, admin, moveActivation)             // ย้ายคอร์ส

// Toggle feature (DDx, NLEX, etc.)
router.patch('/:id/feature', auth, admin, async (req, res, next) => {
  try {
    const Activation = require('./Activation.model')
    // กันแก้ feature ตอนถูกแบน — ต้องปลดแบนก่อน
    const current = await Activation.findById(req.params.id).select('isActive')
    if (!current) return res.status(404).json({ message: 'ไม่พบ Activation' })
    if (!current.isActive) {
      return res.status(400).json({ message: 'Activation ถูกแบนอยู่ — ต้องปลดแบนก่อน' })
    }
    const updates = {}
    if (req.body.synapseEnabled !== undefined) updates.synapseEnabled = !!req.body.synapseEnabled
    if (req.body.ddxEnabled !== undefined) updates.ddxEnabled = !!req.body.ddxEnabled
    if (req.body.nlexEnabled !== undefined) updates.nlexEnabled = !!req.body.nlexEnabled
    if (req.body.osceEnabled !== undefined) updates.osceEnabled = !!req.body.osceEnabled
    if (req.body.ddxExtraEnabled !== undefined) updates.ddxExtraEnabled = !!req.body.ddxExtraEnabled
    if (req.body.meqexEnabled !== undefined) updates.meqexEnabled = !!req.body.meqexEnabled
    if (req.body.atlasEnabled !== undefined) updates.atlasEnabled = !!req.body.atlasEnabled
    if (req.body.longexEnabled !== undefined) updates.longexEnabled = !!req.body.longexEnabled
    if (req.body.skill15Enabled !== undefined) updates.skill15Enabled = !!req.body.skill15Enabled
    if (req.body.liveEnabled !== undefined) updates.liveEnabled = !!req.body.liveEnabled
    if (req.body.qaEnabled !== undefined) updates.qaEnabled = !!req.body.qaEnabled
    const act = await Activation.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!act) return res.status(404).json({ message: 'ไม่พบ Activation' })
    res.json({ ok: true, synapseEnabled: act.synapseEnabled, ddxEnabled: act.ddxEnabled, nlexEnabled: act.nlexEnabled, osceEnabled: act.osceEnabled, meqexEnabled: act.meqexEnabled, atlasEnabled: act.atlasEnabled, longexEnabled: act.longexEnabled, skill15Enabled: act.skill15Enabled, liveEnabled: act.liveEnabled, qaEnabled: act.qaEnabled })
  } catch (error) { next(error) }
})

module.exports = router
