const express = require('express')
const router = express.Router()
const { getPlayAuth } = require('./china.controller')

// GET /api/china/playauth/:videoId
// MVP Phase 1: public (no auth) — จะเพิ่ม auth guard ตอน Phase 2
router.get('/playauth/:videoId', getPlayAuth)

module.exports = router
