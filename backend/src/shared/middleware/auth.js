const jwt = require('jsonwebtoken')
const User = require('../../modules/user/User.model')
const { validateSession } = require('../../modules/auth/session.service')

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

    // ─── Device Fingerprint — ปิดชั่วคราว ค่อยเปิดทีหลัง ───

    next()
  } catch (error) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง' })
  }
}

module.exports = auth
