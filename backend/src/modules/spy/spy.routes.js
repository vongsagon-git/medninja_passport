/**
 * Spy ban management — admin key authenticated
 * ใช้ search LineFollower + cascade ban ไปทุก trial
 * Header: x-admin-key: medninja-2026
 */
const express = require('express')
const router = express.Router()
const LineFollower = require('../line/LineFollower.model')

const ADMIN_KEY = process.env.SPY_ADMIN_KEY || 'medninja-2026'

function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.k
  if (key !== ADMIN_KEY) return res.status(403).json({ ok: false, error: 'Forbidden' })
  next()
}

// Search LineFollower by name/lineUserId
router.get('/search', requireAdminKey, async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ ok: true, followers: [] })
    const followers = await LineFollower.find({
      $or: [
        { lineUserId: q },
        { displayName: { $regex: q, $options: 'i' } }
      ]
    }).limit(20).lean()
    res.json({ ok: true, count: followers.length, followers })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Tag as spy (cascade ban to all trial apps)
router.post('/ban', requireAdminKey, async (req, res) => {
  try {
    const { lineUserId, reason, bannedBy } = req.body
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'lineUserId required' })

    // 1. Tag in LineFollower
    const follower = await LineFollower.findOneAndUpdate(
      { lineUserId },
      { $addToSet: { tags: 'spy' }, $set: { isBanned: true, banReason: reason || 'spy', bannedAt: new Date(), bannedBy: bannedBy || 'admin' } },
      { new: true, upsert: true }
    )

    // 2. Cascade ban to Arena (cross-app via DDx API)
    const cascade = []
    try {
      const arenaResp = await fetch('https://ddx.medninja.academy/api/arena/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ lineUserId, reason, bannedBy })
      })
      cascade.push({ app: 'arena', ok: arenaResp.ok, status: arenaResp.status })
    } catch (e) {
      cascade.push({ app: 'arena', ok: false, error: e.message })
    }
    // TODO: cascade ไป NLEX/MEQEX/OSCE-VP/DDx-VP เมื่อมี endpoint

    res.json({ ok: true, follower: { lineUserId: follower.lineUserId, displayName: follower.displayName, tags: follower.tags }, cascade })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Unban
router.post('/unban', requireAdminKey, async (req, res) => {
  try {
    const { lineUserId } = req.body
    if (!lineUserId) return res.status(400).json({ ok: false, error: 'lineUserId required' })

    const follower = await LineFollower.findOneAndUpdate(
      { lineUserId },
      { $pull: { tags: 'spy' }, $set: { isBanned: false, banReason: '', bannedAt: null } },
      { new: true }
    )

    const cascade = []
    try {
      const arenaResp = await fetch('https://ddx.medninja.academy/api/arena/admin/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({ lineUserId })
      })
      cascade.push({ app: 'arena', ok: arenaResp.ok })
    } catch (e) {
      cascade.push({ app: 'arena', ok: false, error: e.message })
    }

    res.json({ ok: true, follower, cascade })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// List banned (LineFollower tagged spy)
router.get('/banned', requireAdminKey, async (req, res) => {
  try {
    const banned = await LineFollower.find({ tags: 'spy' }).lean()
    res.json({ ok: true, count: banned.length, banned })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
