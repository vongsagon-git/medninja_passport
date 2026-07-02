const express = require('express')
const router = express.Router()
const { getDemoEmbedUrl, getSignedEmbedUrl, bunnyConfig } = require('../../shared/config/bunny')
const { isIOS, isMacSafari } = require('../../shared/util/deviceDetect')

function pickEmbedUrl(video, req) {
  if (video.bunnyDrmVideoId && !isIOS(req) && !isMacSafari(req)) {
    return { embedUrl: getSignedEmbedUrl(video.bunnyDrmVideoId), drmMode: 'widevine', libraryId: '626874' }
  }
  return { embedUrl: getDemoEmbedUrl(video.bunnyVideoId), drmMode: 'protection', libraryId: '628424' }
}
const DemoConfig = require('./DemoConfig.model')

// ─── Default data (seed ครั้งแรก) ────────────────────────────
const DEFAULT_VIDEOS = [
  { title: 'Demo NL', bunnyVideoId: '069e4d91-66fa-40de-883d-21ad8c85c3b6', duration: '', order: 0 },
  { title: 'Demo MEQ', bunnyVideoId: '362f0aed-ede7-4c30-97b0-a6ad1d7e4f8a', duration: '', order: 1 }
]

// Helper: ดึง config จาก DB (auto-seed ถ้ายังไม่มี)
async function getConfig() {
  let config = await DemoConfig.findOne({ key: 'demo' }).lean()
  if (!config) {
    config = await DemoConfig.create({ key: 'demo', videos: DEFAULT_VIDEOS })
    config = config.toObject()
  }
  return config
}

// Helper: fetch duration จาก Bunny API
async function fetchDuration(bunnyVideoId) {
  const libId = process.env.BUNNY_DEMO_LIBRARY_ID || bunnyConfig.libraryId
  const apiKey = process.env.BUNNY_DEMO_API_KEY || bunnyConfig.apiKey
  if (!apiKey || !libId) return ''
  try {
    const resp = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${bunnyVideoId}`, {
      headers: { AccessKey: apiKey }
    })
    if (resp.ok) {
      const data = await resp.json()
      if (data.length > 0) {
        const mins = Math.floor(data.length / 60)
        const secs = Math.round(data.length % 60)
        return `${mins}:${String(secs).padStart(2, '0')}`
      }
    }
  } catch { /* ignore */ }
  return ''
}

// Auto-fetch durations ตอน server start
;(async () => {
  try {
    const config = await getConfig()
    let changed = false
    for (const vid of config.videos) {
      if (!vid.duration && vid.bunnyVideoId) {
        vid.duration = await fetchDuration(vid.bunnyVideoId)
        if (vid.duration) changed = true
      }
    }
    if (changed) {
      await DemoConfig.findOneAndUpdate({ key: 'demo' }, { videos: config.videos })
      console.log('[Demo] Durations updated:', config.videos.map(v => `${v.title}=${v.duration}`).join(', '))
    }
  } catch { /* ignore on startup */ }
})()

// ═══ Public Endpoints ═══

// GET /api/demo/section
router.get('/section', async (req, res) => {
  try {
    const config = await getConfig()
    const videos = [...config.videos].sort((a, b) => a.order - b.order)
    res.json({
      section: {
        _id: 'sec_demo',
        code: 'DEMO',
        name: config.sectionName,
        description: config.sectionDescription,
        order: 0,
        videos: videos.map(v => {
          const p = pickEmbedUrl(v, req)
          return { ...v, embedUrl: p.embedUrl, drmMode: p.drmMode, libraryId: p.libraryId }
        })
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/demo/section/videos/:videoIndex
router.get('/section/videos/:videoIndex', async (req, res) => {
  try {
    const config = await getConfig()
    const videos = [...config.videos].sort((a, b) => a.order - b.order)
    const idx = parseInt(req.params.videoIndex)
    if (idx < 0 || idx >= videos.length) {
      return res.status(404).json({ message: 'ไม่พบวีดีโอ' })
    }
    const video = videos[idx]
    const p = pickEmbedUrl(video, req)
    res.json({ video: { ...video, embedUrl: p.embedUrl, drmMode: p.drmMode, libraryId: p.libraryId } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/demo/intro — วีดีโอแนะนำหน้า home (signed URL)
router.get('/intro', async (req, res) => {
  try {
    const config = await getConfig()
    const videoId = config.introVideoId || 'ef8f4e09-0d4b-498e-86fc-e65f74510e1d'
    const drmVideoId = config.introDrmVideoId || ''
    const useDrm = drmVideoId && !isIOS(req) && !isMacSafari(req)
    const embedUrl = useDrm ? getSignedEmbedUrl(drmVideoId) : getDemoEmbedUrl(videoId)
    res.json({ embedUrl, videoId: useDrm ? drmVideoId : videoId, drmMode: useDrm ? 'widevine' : 'protection' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
