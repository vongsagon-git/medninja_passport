const router = require('express').Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const DeviceLog = require('./DeviceLog.model')

router.use(auth, admin)

/**
 * GET /api/admin/devices
 * แสดงจำนวน device ต่อ user — sort มากสุดก่อน
 */
router.get('/', async (req, res) => {
  try {
    const results = await DeviceLog.aggregate([
      {
        $group: {
          _id: '$userId',
          deviceCount: { $sum: 1 },
          devices: {
            $push: {
              hwOnlyHash: '$hwOnlyHash',
              hwHash: '$hwHash',
              gpu: '$gpu',
              cores: '$cores',
              memory: '$memory',
              architecture: '$architecture',
              touchPoints: '$touchPoints',
              screen: '$screen',
              timezone: '$timezone',
              language: '$language',
              platform: '$platform',
              os: '$os',
              browser: '$browser',
              ip: '$ip',
              firstSeenAt: '$firstSeenAt',
              lastSeenAt: '$lastSeenAt',
              loginCount: '$loginCount',
              heartbeatCount: '$heartbeatCount'
            }
          }
        }
      },
      { $sort: { deviceCount: -1 } },
      { $limit: 100 }
    ])

    // Populate user info
    const User = require('../user/User.model')
    const userIds = results.map(r => r._id)
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email firstName lastName university')
      .lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    const data = results.map(r => ({
      userId: r._id,
      user: userMap.get(r._id.toString()) || null,
      deviceCount: r.deviceCount,
      devices: r.devices.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
    }))

    res.json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
