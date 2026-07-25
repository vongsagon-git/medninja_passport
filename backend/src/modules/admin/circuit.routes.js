/**
 * Admin Circuit Breaker API — Passport (mirror of LMS)
 */
const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const SystemCircuit = require('./SystemCircuit.model')
const { invalidateCache } = require('../../shared/middleware/circuitBreaker')

router.use(auth, admin)

const VALID_SCOPES = ['my', 'section', 'watch', 'live']

router.get('/', async (req, res) => {
  try {
    const docs = await SystemCircuit.find({}).lean()
    const map = new Map(docs.map(d => [d.scope, d]))
    const result = VALID_SCOPES.map(scope => {
      const d = map.get(scope)
      return {
        scope,
        enabled: d?.enabled || false,
        message: d?.message || 'ไอทีกำลังปรับปรุงเนื้อหา\nจะใช้ได้เร็วๆนี้ ขออภัยในความไม่สะดวก',
        estimatedReturn: d?.estimatedReturn || null,
        updatedAt: d?.updatedAt || null,
        updatedBy: d?.updatedBy || null
      }
    })
    res.json({ breakers: result })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { scope, enabled, message, estimatedReturn } = req.body
    if (!VALID_SCOPES.includes(scope)) return res.status(400).json({ message: 'scope invalid' })
    const update = { updatedBy: req.user._id }
    if (typeof enabled === 'boolean') update.enabled = enabled
    if (typeof message === 'string' && message.trim()) update.message = message.trim().slice(0, 500)
    if (estimatedReturn === null || estimatedReturn === '') {
      update.estimatedReturn = null
    } else if (estimatedReturn) {
      const d = new Date(estimatedReturn)
      if (!isNaN(d.getTime())) update.estimatedReturn = d
    }
    const doc = await SystemCircuit.findOneAndUpdate(
      { scope },
      { $set: update },
      { upsert: true, new: true }
    ).lean()
    await invalidateCache()
    res.json({ ok: true, breaker: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/all-off', async (req, res) => {
  try {
    await SystemCircuit.updateMany({}, { $set: { enabled: false, updatedBy: req.user._id } })
    await invalidateCache()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
