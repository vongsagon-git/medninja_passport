/**
 * MedNinja Observability Library — barrel export
 *
 * Usage:
 *   const obs = require('./shared/observability')
 *   const log = obs.createLogger(req)
 *   const token = obs.signJwt({...}, { src:'handoff', aud:'ix' })
 */
module.exports = {
  // middleware
  requestId: require('./requestId').requestId,
  metricsMiddleware: require('./metrics').metricsMiddleware,
  errorHandler: require('./errorHandler').errorHandler,

  // jwt
  signJwt: require('./jwtHelper').signJwt,
  verifyJwt: require('./jwtHelper').verifyJwt,
  inspectJwt: require('./jwtHelper').inspectJwt,

  // models
  getSystemErrorModel: require('./SystemError.model').getSystemErrorModel,
  getAuditLogModel: require('./AuditLog.model').getAuditLogModel,

  // routes
  observabilityRoutes: require('./observabilityRoutes'),

  // logger
  createLogger: require('./logger'),
  logger: require('./logger').global,

  // metrics query
  getMetrics: require('./metrics').getMetrics,

  APP_ID: process.env.APP_ID || 'unknown'
}
