/**
 * Profile Guard Middleware
 * เช็คว่า user กรอกข้อมูลครบแล้วหรือยัง ก่อนเข้าถึง protected routes
 *
 * ใช้กับ /api/my/* routes (เข้าเรียน)
 * ไม่ใช้กับ: /api/auth/*, /api/users/profile, /api/users/complete-profile
 */
const profileGuard = (req, res, next) => {
  const user = req.user

  // Admin ไม่ต้องถูก guard
  if (user.role === 'admin') return next()

  // เช็คว่ากรอกข้อมูลครบแล้ว
  if (!user.profileLocked) {
    return res.status(403).json({
      message: 'กรุณากรอกข้อมูลส่วนตัวให้ครบก่อนเข้าเรียน',
      code: 'PROFILE_INCOMPLETE',
      redirect: '/complete-profile'
    })
  }

  next()
}

module.exports = profileGuard
