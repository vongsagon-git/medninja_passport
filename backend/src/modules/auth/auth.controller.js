const jwt = require('jsonwebtoken')
const User = require('../user/User.model')
const { createSession, removeSession } = require('./session.service')
const { generateVerifyToken, sendVerificationEmail } = require('./email.service')
const { logActivity, getIp, parseUA } = require('../activity/activity.service')

function generateToken(id, sessionId) {
  const payload = { id }
  if (sessionId) payload.sid = sessionId
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

/**
 * ส่ง user data กลับ (ใช้ร่วมกันทุก endpoint)
 */
function userResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    authProvider: user.authProvider || 'local',
    emailVerified: user.emailVerified || false,
    profileLocked: user.profileLocked || false,
    firstName: user.firstName,
    lastName: user.lastName,
    nationalId: user.nationalId,
    dateOfBirth: user.dateOfBirth,
    sex: user.sex || '',
    university: user.university,
    createdAt: user.createdAt,
    lineUserId: user.lineUserId || null,
    lineDisplayName: user.lineDisplayName || null,
    linePictureUrl: user.linePictureUrl || null
  }
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })
    }

    // สร้าง verify token
    const { token: verifyToken, expires: verifyExpires } = generateVerifyToken()

    const user = await User.create({
      name, email, password, phone,
      authProvider: 'local',
      emailVerified: false,
      verifyToken,
      verifyExpires
    })

    // ส่ง verification email (ไม่ block ถ้าส่งไม่ได้)
    sendVerificationEmail(email, name, verifyToken).catch(err => {
      console.error('⚠️  Failed to send verification email:', err.message)
    })

    // สร้าง session ใน Valkey
    const sessionId = await createSession(user._id.toString())
    const token = generateToken(user._id, sessionId)

    const ua = parseUA(req.headers['user-agent'])
    logActivity({ userId: user._id, userName: user.name, userEmail: user.email, action: 'register', ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || '' })

    res.status(201).json({ token, user: userResponse(user) })
  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password, nationalId } = req.body
    const identifier = email || nationalId

    if (!identifier || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลเข้าสู่ระบบ' })
    }

    // รองรับ login ด้วย email หรือ nationalId (เลข 13 หลัก)
    const cleanId = (identifier || '').replace(/\D/g, '')
    const isNidLogin = /^\d{13}$/.test(cleanId)
    const query = isNidLogin ? { nationalId: cleanId } : { email: identifier }

    const user = await User.findOne(query)
    if (!user) {
      return res.status(401).json({ message: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' })
    }

    // ═══ Ban check ═══
    if (user.isBanned) {
      return res.status(403).json({ message: 'บัญชีถูกระงับ กรุณาติดต่อ admin', code: 'BANNED' })
    }

    // Google-only accounts ไม่มี password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({ message: 'กรุณาใช้ Google เข้าสู่ระบบ' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' })
    }

    // ═══ บังคับ email verification (ยกเว้น admin) ═══
    if (!user.emailVerified && user.role !== 'admin') {
      return res.status(403).json({
        message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      })
    }

    // สร้าง session ใน Valkey + kick เครื่องเก่าถ้าเกิน limit
    const sessionId = await createSession(user._id.toString())
    const token = generateToken(user._id, sessionId)

    const ua = parseUA(req.headers['user-agent'])
    logActivity({ userId: user._id, userName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name, userEmail: user.email, action: 'login', detail: isNidLogin ? 'login ด้วยเลขบัตร' : 'login ด้วย email', ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || '' })

    res.json({ token, user: userResponse(user) })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/auth/google — Google OAuth callback (frontend ส่ง access_token มา)
 * Frontend ใช้ Google Sign-In SDK → ได้ credential → ส่งมา backend แลก JWT
 */
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ message: 'กรุณาส่ง Google credential' })
    }

    // Verify Google ID token
    const { OAuth2Client } = require('google-auth-library')
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()

    const { sub: googleId, email, name, picture } = payload

    // หา user จาก googleId หรือ email
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      // ═══ Ban check ═══
      if (user.isBanned) {
        return res.status(403).json({ message: 'บัญชีถูกระงับ กรุณาติดต่อ admin', code: 'BANNED' })
      }
      // Link Google account ถ้ายังไม่มี
      if (!user.googleId) {
        user.googleId = googleId
        user.emailVerified = true
        await user.save()
      }
    } else {
      // สร้าง user ใหม่ (ไม่มี password)
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        emailVerified: true // Google ยืนยันให้แล้ว
      })
    }

    const sessionId = await createSession(user._id.toString())
    const token = generateToken(user._id, sessionId)

    const uaParsed = parseUA(req.headers['user-agent'])
    logActivity({ userId: user._id, userName: user.name, userEmail: user.email, action: 'login_google', ip: getIp(req), ...uaParsed, userAgent: req.headers['user-agent'] || '' })

    res.json({ token, user: userResponse(user) })
  } catch (error) {
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ message: 'Google token หมดอายุ กรุณาลองใหม่' })
    }
    next(error)
  }
}

/**
 * GET /api/auth/verify-email?token=xxx
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')

    if (!token) {
      return res.redirect(`${frontendUrl}/login?verify=invalid`)
    }

    const user = await User.findOne({
      verifyToken: token,
      verifyExpires: { $gt: new Date() }
    })

    if (!user) {
      // Token ไม่เจอ — อาจถูกใช้แล้ว (email client prefetch) หรือหมดอายุ
      // redirect ไป frontend แทนโชว์ JSON ดิบ
      return res.redirect(`${frontendUrl}/login?verify=used`)
    }

    user.emailVerified = true
    user.verifyToken = undefined
    user.verifyExpires = undefined
    await user.save()

    // Redirect ไป frontend
    res.redirect(`${frontendUrl}/login?verified=true`)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/auth/resend-verify — ส่ง verification email ใหม่
 */
exports.resendVerify = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.emailVerified) {
      return res.status(400).json({ message: 'อีเมลยืนยันแล้ว' })
    }

    const { token: verifyToken, expires: verifyExpires } = generateVerifyToken()
    user.verifyToken = verifyToken
    user.verifyExpires = verifyExpires
    await user.save()

    await sendVerificationEmail(user.email, user.name, verifyToken)

    res.json({ message: 'ส่งอีเมลยืนยันใหม่เรียบร้อย' })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/auth/resend-verify-public — ส่ง verification email ใหม่ (ไม่ต้อง login)
 * ใช้สำหรับกรณีที่ login ไม่ได้เพราะยังไม่ verify email
 */
exports.resendVerifyPublic = async (req, res, next) => {
  try {
    const { nationalId } = req.body
    if (!nationalId) {
      return res.status(400).json({ message: 'กรุณากรอกเลขบัตรประชาชน' })
    }

    const cleanId = nationalId.replace(/\D/g, '')
    const user = await User.findOne({ nationalId: cleanId })

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบบัญชี กรุณาลงทะเบียนผ่าน Ninja Passport ก่อน' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'อีเมลยืนยันแล้ว สามารถเข้าสู่ระบบได้เลย' })
    }

    const { token: verifyToken, expires: verifyExpires } = generateVerifyToken()
    user.verifyToken = verifyToken
    user.verifyExpires = verifyExpires
    await user.save()

    await sendVerificationEmail(user.email, user.name, verifyToken)

    res.json({ message: `ส่งอีเมลยืนยันไปที่ ${user.email} เรียบร้อย` })
  } catch (error) {
    next(error)
  }
}

exports.getMe = async (req, res, next) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip
    res.json({ user: userResponse(req.user), clientIp })
  } catch (error) {
    next(error)
  }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
    }

    const user = await User.findById(req.user._id)
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
    }

    user.password = newPassword
    await user.save()

    const ua = parseUA(req.headers['user-agent'])
    logActivity({ userId: req.user._id, userName: req.user.name, userEmail: req.user.email, action: 'password_change', ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || '' })

    res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อย' })
  } catch (error) {
    next(error)
  }
}

exports.logout = async (req, res, next) => {
  try {
    const ua = parseUA(req.headers['user-agent'])
    logActivity({ userId: req.user._id, userName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : req.user.name, userEmail: req.user.email, action: 'logout', ip: getIp(req), ...ua, userAgent: req.headers['user-agent'] || '' })

    if (req.sessionId) {
      await removeSession(req.user._id.toString(), req.sessionId)
    }
    res.json({ message: 'ออกจากระบบเรียบร้อย' })
  } catch (error) {
    next(error)
  }
}
