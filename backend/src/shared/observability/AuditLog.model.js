/**
 * AuditLog model — track admin actions (bypass, toggle, kick, revoke, ...)
 *
 * เก็บที่ LMS DB (collection: auditlogs)
 * TTL 90 วัน
 *
 * Usage:
 *   const { getAuditLogModel } = require('./observability/AuditLog.model')
 *   const AuditLog = getAuditLogModel(lmsConn)
 *   await AuditLog.create({
 *     app: 'passport',
 *     action: 'bypass_email_verify',
 *     actorId: req.user._id,
 *     targetId: user._id,
 *     detail: { reason: 'admin manual verify' },
 *     requestId: req.id
 *   })
 */
const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  // ─ Origin ─
  app: { type: String, required: true, index: true },
  requestId: String,

  // ─ Action ─
  action: { type: String, required: true, index: true },
  // Common actions:
  //   auth_login, auth_logout, auth_bypass, auth_totp_setup, auth_totp_verify
  //   activation_toggle, activation_extend, activation_revoke, activation_mark_passed
  //   user_approve, user_reject, user_delete
  //   video_kick, session_kick
  //   admin_create, admin_delete, admin_role_change
  //   liff_login, liff_kick

  // ─ Actor (ใครทำ) ─
  actorId: { type: mongoose.Schema.Types.ObjectId, index: true },
  actorEmail: String,
  actorRole: String,                                             // admin, staff, system

  // ─ Target (ทำกับใคร) ─
  targetType: String,                                            // user, activation, video, session
  targetId: { type: mongoose.Schema.Types.ObjectId, index: true },
  targetDetail: String,                                          // human-readable (email, packageId)

  // ─ Detail ─
  before: mongoose.Schema.Types.Mixed,                           // state ก่อนเปลี่ยน
  after: mongoose.Schema.Types.Mixed,                            // state หลังเปลี่ยน
  reason: String,
  extra: mongoose.Schema.Types.Mixed,

  // ─ Client ─
  ip: String,
  userAgent: String,

  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 } // TTL 90d
})

schema.index({ actorId: 1, createdAt: -1 })
schema.index({ targetId: 1, createdAt: -1 })
schema.index({ action: 1, createdAt: -1 })

function getAuditLogModel(lmsConn) {
  if (!lmsConn) throw new Error('[AuditLog] lmsConn required')
  return lmsConn.models.AuditLog || lmsConn.model('AuditLog', schema, 'auditlogs')
}

module.exports = { getAuditLogModel, schema }
