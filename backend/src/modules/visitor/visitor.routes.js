const express = require('express')
const PageVisit = require('./PageVisit.model')

const router = express.Router()

// ─── Public: บันทึก visit (fire-and-forget จาก frontend) ───
router.post('/track', async (req, res) => {
  try {
    const { page, referrer, screenSize, utmSource, utmMedium, utmCampaign } = req.body

    // parse user agent
    const ua = req.headers['user-agent'] || ''
    const os = parseOS(ua)
    const browser = parseBrowser(ua)
    const device = parseDevice(ua)

    // IP — trust proxy ตั้งแล้วใน app.js
    const ip = req.ip || req.connection?.remoteAddress || ''

    await PageVisit.create({
      page: page || '/',
      ip,
      os,
      browser,
      device,
      userAgent: ua,
      screenSize: screenSize || '',
      referrer: referrer || '',
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || ''
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('visitor track error:', err.message)
    res.json({ ok: false })
  }
})

// ─── Admin: สถิติรวม (ต้อง auth+admin จาก app.js mount หรือ middleware) ───
// ป้องกัน: ถ้า mount ผ่าน /api/visitor (public) → block เลย
router.get('/stats', (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' })
  }
  next()
}, async (req, res) => {
  try {
    const { days = 30, from, to } = req.query
    let since, until

    if (from) {
      // เลือกช่วงวัน — from=YYYY-MM-DD to=YYYY-MM-DD (เวลาไทย)
      since = new Date(from + 'T00:00:00+07:00')
      const toDate = to || from
      until = new Date(toDate + 'T00:00:00+07:00')
      until = new Date(until.getTime() + 86400_000) // รวมวันสุดท้าย
    } else {
      // ตัดวันที่เที่ยงคืนเวลาไทย (UTC+7)
      const nowBkk = new Date(Date.now() + 7 * 3600_000)
      const todayBkk = new Date(Date.UTC(nowBkk.getUTCFullYear(), nowBkk.getUTCMonth(), nowBkk.getUTCDate()))
      todayBkk.setTime(todayBkk.getTime() - 7 * 3600_000)
      since = new Date(todayBkk)
      since.setDate(since.getDate() - (Number(days) - 1))
    }
    const dateFilter = until ? { $gte: since, $lt: until } : { $gte: since }

    // จำนวนทั้งหมด + unique IP
    const [totalResult, uniqueResult] = await Promise.all([
      PageVisit.countDocuments({ createdAt: dateFilter }),
      PageVisit.distinct('ip', { createdAt: dateFilter })
    ])

    // รายวัน
    const daily = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Bangkok' } },
          total: { $sum: 1 },
          uniqueIps: { $addToSet: '$ip' }
        }
      },
      { $project: { _id: 0, date: '$_id', total: 1, unique: { $size: '$uniqueIps' } } },
      { $sort: { date: 1 } }
    ])

    // แยกตามหน้า
    const byPage = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$page', total: { $sum: 1 } } },
      { $project: { _id: 0, page: '$_id', total: 1 } },
      { $sort: { total: -1 } }
    ])

    // แยกตาม device
    const byDevice = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$device', total: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id', total: 1 } },
      { $sort: { total: -1 } }
    ])

    // แยกตาม OS
    const byOS = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$os', total: { $sum: 1 } } },
      { $project: { _id: 0, os: '$_id', total: 1 } },
      { $sort: { total: -1 } }
    ])

    // แยกตาม browser
    const byBrowser = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$browser', total: { $sum: 1 } } },
      { $project: { _id: 0, browser: '$_id', total: 1 } },
      { $sort: { total: -1 } }
    ])

    // top referrers
    const topReferrers = await PageVisit.aggregate([
      { $match: { createdAt: dateFilter, referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', total: { $sum: 1 } } },
      { $project: { _id: 0, referrer: '$_id', total: 1 } },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ])

    res.json({
      totalVisits: totalResult,
      uniqueVisitors: uniqueResult.length,
      daily,
      byPage,
      byDevice,
      byOS,
      byBrowser,
      topReferrers
    })
  } catch (err) {
    console.error('visitor stats error:', err.message)
    res.status(500).json({ message: 'โหลดสถิติไม่สำเร็จ' })
  }
})

// ─── Admin: รายการ visit ล่าสุด ───
router.get('/recent', (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' })
  }
  next()
}, async (req, res) => {
  try {
    const { limit = 100, page: pageFilter } = req.query
    const query = {}
    if (pageFilter) query.page = pageFilter

    const visits = await PageVisit.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()

    res.json({ visits })
  } catch (err) {
    console.error('visitor recent error:', err.message)
    res.status(500).json({ message: 'โหลดข้อมูลไม่สำเร็จ' })
  }
})

// ─── Helper: parse UA ───
function parseOS(ua) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10'
  if (/Windows NT/.test(ua)) return 'Windows'
  // ใช้ deviceDetect helper (มาตรฐานเดียว) สำหรับ iOS / Android / macOS
  const { getOS } = require('../../shared/util/deviceDetect')
  const os = getOS(ua)
  if (os !== 'Other') return os
  return 'Other'
}

function parseBrowser(ua) {
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  if (/Firefox\//.test(ua)) return 'Firefox'
  return 'Other'
}

function parseDevice(ua) {
  if (/iPad|Tablet|PlayBook/.test(ua)) return 'tablet'
  if (/Mobile|iPhone|Android.*Mobile/.test(ua)) return 'mobile'
  return 'desktop'
}

module.exports = router
