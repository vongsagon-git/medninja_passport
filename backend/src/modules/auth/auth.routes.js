const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const {
  register, login, getMe, changePassword, logout,
  googleLogin, verifyEmail, resendVerify, resendVerifyPublic
} = require('./auth.controller')
const { lineLink, lineUnlink } = require('./line.controller')
const auth = require('../../shared/middleware/auth')

// 15 requests per 15 minutes per IP on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/google', authLimiter, googleLogin)
router.get('/verify-email', verifyEmail)
router.post('/resend-verify', auth, resendVerify)
router.post('/resend-verify-public', authLimiter, resendVerifyPublic)
router.get('/me', auth, getMe)
router.post('/change-password', auth, changePassword)
router.post('/logout', auth, logout)

// ─── Handoff (One-time Code Exchange) ───
const { createHandoffCode, exchangeCode } = require('./handoff.service')

// สร้าง code — ต้อง login แล้ว
router.post('/handoff/code', auth, async (req, res) => {
  try {
    const { target } = req.body // synapse, ddx, osce, nlex
    if (!target) return res.status(400).json({ message: 'ระบุ target app' })

    const code = await createHandoffCode(req.user._id.toString(), req.sessionId, target)
    if (!code) return res.status(503).json({ message: 'ระบบไม่พร้อม กรุณาลองใหม่' })

    res.json({ code })
  } catch (err) {
    console.error('[Handoff] create error:', err.message)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

// แลก code เป็น JWT — ไม่ต้อง auth (server-to-server จาก app ปลายทาง)
router.post('/handoff/exchange', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ message: 'ระบุ code' })

    const result = await exchangeCode(code)
    if (!result) return res.status(401).json({ message: 'Code ไม่ถูกต้องหรือหมดอายุ' })

    res.json({ token: result.token })
  } catch (err) {
    console.error('[Handoff] exchange error:', err.message)
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' })
  }
})

// ─── LINE Link (LIFF) ───
router.post('/line/link', auth, lineLink)
// unlink ให้ admin ทำเท่านั้น (มีผลต่อระบบข้อสอบ NLEX)

module.exports = router
