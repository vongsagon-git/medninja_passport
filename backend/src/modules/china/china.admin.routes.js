const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const { getVideoInfo, renameVideo } = require('./china.controller')

router.use(express.json({ limit: '128kb' }))

// GET /api/admin/ali/video/:videoId — verify + info (title, duration, status)
router.get('/video/:videoId', auth, admin, getVideoInfo)

// POST /api/admin/ali/video/:videoId/rename — rename title on Alibaba VOD
router.post('/video/:videoId/rename', auth, admin, renameVideo)

module.exports = router
