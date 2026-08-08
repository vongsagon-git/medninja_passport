/**
 * SystemError model — save error 500/critical จากทุก app
 *
 * เก็บที่ LMS DB (collection: systemerrors)
 * TTL 30 วัน
 *
 * แต่ละ app ต้อง import model นี้และผูกกับ lmsConn ของตัวเอง
 *
 * Usage:
 *   const { getSystemErrorModel } = require('./observability/SystemError.model')
 *   const SystemError = getSystemErrorModel(lmsConn)
 */
const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  // ─ Origin ─
  app: { type: String, required: true, index: true },        // ix, lms, ...
  requestId: { type: String, index: true },                   // จาก x-request-id
  correlationId: String,                                       // parent request (cross-app)

  // ─ Request ─
  method: String,                                              // GET, POST, ...
  endpoint: { type: String, index: true },                    // /api/ix/attempts
  statusCode: { type: Number, index: true },                  // 500, 403, 401

  // ─ Error ─
  errorMessage: String,
  errorName: String,                                           // ValidationError, MongoError
  errorCode: String,                                           // custom code (IX_NOT_ACTIVATED)
  errorStack: String,

  // ─ Actor ─
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  userEmail: String,
  userRole: String,                                            // student, admin, staff, trial
  isTrial: Boolean,

  // ─ Client ─
  ip: String,
  userAgent: String,
  referer: String,

  // ─ JWT metadata (ถ้ามี) ─
  jwtIss: String,                                              // token มาจาก app ไหน
  jwtAud: String,
  jwtSrc: String,                                              // login/handoff/liff/bypass
  jwtJti: String,

  // ─ Extra context ─
  requestBody: mongoose.Schema.Types.Mixed,                    // sanitized (ตัด password)
  extra: mongoose.Schema.Types.Mixed,                          // ใส่อะไรก็ได้

  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 } // TTL 30d
})

schema.index({ app: 1, createdAt: -1 })
schema.index({ userId: 1, createdAt: -1 })
schema.index({ endpoint: 1, statusCode: 1, createdAt: -1 })

/**
 * getSystemErrorModel(lmsConn)
 * ป้องกัน OverwriteModelError ตอน hot-reload
 */
function getSystemErrorModel(lmsConn) {
  if (!lmsConn) throw new Error('[SystemError] lmsConn required')
  return lmsConn.models.SystemError || lmsConn.model('SystemError', schema, 'systemerrors')
}

module.exports = { getSystemErrorModel, schema }
