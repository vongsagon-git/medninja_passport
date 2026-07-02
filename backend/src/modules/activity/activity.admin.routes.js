const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const ActivityLog = require('./ActivityLog.model')
const User = require('../user/User.model')

// ทุก route ต้อง login + admin
router.use(auth, admin)

/**
 * GET /api/admin/activity/students — รายชื่อนักเรียนที่มี activity (สำหรับ dropdown)
 * ?q=ชื่อ/email (optional search)
 */
router.get('/students', async (req, res) => {
  try {
    const { q } = req.query
    const query = { role: { $ne: 'admin' } }
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { name: regex },
        { email: regex }
      ]
    }
    const users = await User.find(query)
      .select('_id name firstName lastName email linePictureUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const students = users.map(u => ({
      _id: u._id,
      name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name,
      email: u.email,
      avatar: u.linePictureUrl || ''
    }))

    res.json({ students })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * GET /api/admin/activity/logs/:userId — timeline กิจกรรมของนักเรียน
 * ?days=7 (default 30)
 * ?action=login,watch_start (optional filter)
 * ?page=1&limit=100
 */
router.get('/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const days = parseInt(req.query.days) || 30
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 100, 500)
    const skip = (page - 1) * limit

    const query = {
      userId,
      createdAt: { $gte: new Date(Date.now() - days * 86400000) }
    }

    if (req.query.action) {
      query.action = { $in: req.query.action.split(',') }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query)
    ])

    res.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * GET /api/admin/activity/summary/:userId — สรุปกิจกรรม
 * ?days=30
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const days = parseInt(req.query.days) || 30
    const since = new Date(Date.now() - days * 86400000)

    const [actionCounts, totalWatchTime, firstLogin, lastLogin] = await Promise.all([
      ActivityLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: since } } },
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      ActivityLog.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), action: 'watch_end', createdAt: { $gte: since } } },
        { $group: { _id: null, totalSeconds: { $sum: '$watchDuration' } } }
      ]),
      ActivityLog.findOne({ userId, action: { $in: ['login', 'login_google'] } }).sort({ createdAt: 1 }).select('createdAt').lean(),
      ActivityLog.findOne({ userId, action: { $in: ['login', 'login_google'] } }).sort({ createdAt: -1 }).select('createdAt ip os browser').lean()
    ])

    const summary = {
      actionCounts: actionCounts.reduce((acc, c) => { acc[c._id] = c.count; return acc }, {}),
      totalWatchSeconds: totalWatchTime[0]?.totalSeconds || 0,
      firstLogin: firstLogin?.createdAt || null,
      lastLogin: lastLogin || null,
      days
    }

    res.json(summary)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
