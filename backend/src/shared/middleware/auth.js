const jwt = require('jsonwebtoken')
const User = require('../../modules/user/User.model')
const { validateSession, createSession, lookupTicket } = require('../../modules/auth/session.service')

/**
 * Auto-migrate: if user has valid JWT but no cookie 'sid', create session + set cookie.
 * Users logged in BEFORE cookie deploy get cookie set on first authenticated API call.
 */
async function ensureCookie (req, res, userId) {
  try {
    const existing = req.cookies && req.cookies.sid
    if (existing) {
      const t = await lookupTicket(existing)
      if (t && t.userId === String(userId)) return
    }
    const ua = req.headers['user-agent'] || ''
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip
    const newSid = await createSession(String(userId), { ip, ua })
    if (newSid) {
      const days = parseInt(process.env.SESSION_TTL_DAYS || '7', 10)
      const isProd = process.env.NODE_ENV === 'production'
      res.cookie('sid', newSid, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        domain: isProd ? '.medninja.academy' : undefined,
        path: '/',
        maxAge: days * 86400 * 1000
      })
    }
  } catch {}
}

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })
    }

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'ไม่พบผู้ใช้' })
    }

    // ═══ Ban check ═══
    if (user.isBanned) {
      return res.status(403).json({ message: 'บัญชีถูกระงับ', code: 'BANNED' })
    }

    // ตรวจ session กับ Valkey (admin เตะได้)
    if (decoded.sid) {
      const isValid = await validateSession(user._id.toString(), decoded.sid)
      if (!isValid) {
        return res.status(401).json({
          message: 'Session หมดอายุ กรุณา login ใหม่',
          code: 'SESSION_KICKED'
        })
      }
    }

    // เช็คว่า follow LINE อยู่ไหม (ถ้ามี lineUserId)
    if (user.lineUserId && user.role !== 'admin') {
      const { lmsConn } = require('../../shared/config/db')
      const LineFollower = lmsConn.model('LineFollower')
      const follower = await LineFollower.findOne({ lineUserId: user.lineUserId }).select('isFollowing').lean()
      if (follower && follower.isFollowing === false) {
        return res.status(403).json({
          message: 'กรุณา Add LINE @medninja เพื่อเข้าใช้งาน',
          code: 'LINE_UNFOLLOW'
        })
      }
    }

    req.user = user
    req.sessionId = decoded.sid || null

    // ⭐ Auto-migrate: ensure cookie exists for legacy JWT-only sessions
    await ensureCookie(req, res, user._id)

    next()
  } catch (error) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง' })
  }
}

module.exports = auth
