/**
 * System Routes — Circuit Breaker
 */
const express = require('express')
const router = express.Router()
const { getVideoMode, setVideoMode } = require('./system.controller')

// Public — user + admin poll
router.get('/video-mode', getVideoMode)

module.exports = router

// Admin sub-router — mounted separately with auth+admin middleware
const adminRouter = express.Router()
adminRouter.patch('/video-mode', setVideoMode)
module.exports.adminRouter = adminRouter
