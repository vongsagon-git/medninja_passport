/**
 * Approval Guard Middleware (2026-08-06)
 * กันคนที่ยังไม่ผ่านการอนุมัติจาก admin ไม่ให้เข้าถึง content APIs
 *
 * เงื่อนไข:
 * - Admin/staff → ผ่าน
 * - approvalStatus = 'pending'  → 403 PENDING_APPROVAL
 * - approvalStatus = 'rejected' → 403 REJECTED
 * - approvalStatus = 'approved' → ผ่าน
 *
 * ใช้กับ /api/content/*, /api/watch/*, /api/live/* ฯลฯ
 */
const approvalGuard = (req, res, next) => {
  const user = req.user
  if (!user) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })

  // Admin/staff ไม่ต้องถูก guard
  if (user.role === 'admin' || user.role === 'staff') return next()

  const status = user.approvalStatus || 'approved' // legacy users ที่ไม่มี field = approved

  if (status === 'pending') {
    return res.status(403).json({
      message: 'บัญชีของคุณกำลังรอ admin อนุมัติ (5–30 นาที) หากรอนานทัก LINE @medninja แจ้งชื่อ',
      code: 'PENDING_APPROVAL',
      contactAdminName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name
    })
  }

  if (status === 'rejected') {
    return res.status(403).json({
      message: 'บัญชีของคุณไม่ผ่านการตรวจสอบ ติดต่อ admin ที่ LINE @medninja',
      code: 'REJECTED',
      reason: user.rejectReason || ''
    })
  }

  next()
}

module.exports = approvalGuard
