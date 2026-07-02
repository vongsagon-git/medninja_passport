const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { submit } = require('./interest.controller')

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: 'ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/submit', submitLimiter, submit)

module.exports = router
