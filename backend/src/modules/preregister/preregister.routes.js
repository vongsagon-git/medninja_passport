const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { submit, checkNationalId } = require('./preregister.controller')

// Rate limit: 5 submits per 15 min per IP
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'ลงทะเบียนบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/submit', submitLimiter, submit)
router.get('/check/:nationalId', checkNationalId)

module.exports = router
