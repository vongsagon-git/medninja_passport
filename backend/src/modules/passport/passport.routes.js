const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { scan } = require('./passport.controller')

// Rate limit: 10 scans per 15 min per IP (ป้องกัน abuse AI Vision)
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'สแกนบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/scan', scanLimiter, scan)

module.exports = router
