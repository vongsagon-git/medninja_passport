const ActivityLog = require('./ActivityLog.model')

/**
 * บันทึก activity log (fire-and-forget — ไม่ block request)
 */
function logActivity({ userId, userName, userEmail, action, detail, sectionId, sectionName, videoIndex, videoTitle, watchDuration, ip, os, browser, userAgent }) {
  ActivityLog.create({
    userId, userName, userEmail, action,
    detail: detail || '',
    sectionId: sectionId || '',
    sectionName: sectionName || '',
    videoIndex,
    videoTitle: videoTitle || '',
    watchDuration: watchDuration || 0,
    ip: ip || '',
    os: os || '',
    browser: browser || '',
    userAgent: userAgent || ''
  }).catch(err => {
    console.error('[ActivityLog] save error:', err.message)
  })
}

/**
 * Extract IP จาก request
 */
function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || ''
}

/**
 * Extract OS + Browser จาก User-Agent (ง่ายๆ ไม่ต้อง library)
 */
function parseUA(ua) {
  if (!ua) return { os: '', browser: '' }

  // ใช้ deviceDetect helper (มาตรฐานเดียว) — รับ ua string ผ่าน wrapper
  const { getOS } = require('../../shared/util/deviceDetect')
  const os = getOS(ua)

  let browser = 'Unknown'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'

  return { os, browser }
}

module.exports = { logActivity, getIp, parseUA }
