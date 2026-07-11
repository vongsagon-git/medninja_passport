const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const { getVideoInfo, renameVideo } = require('./china.controller')
const RPCClient = require('@alicloud/pop-core').RPCClient

router.use(express.json({ limit: '128kb' }))

// GET /api/admin/ali/video/:videoId — verify + info (title, duration, status)
router.get('/video/:videoId', auth, admin, getVideoInfo)

// POST /api/admin/ali/video/:videoId/rename — rename title on Alibaba VOD
router.post('/video/:videoId/rename', auth, admin, renameVideo)

// ⭐ GET /api/admin/ali/verify-dual/:videoId
// เช็คว่า video ID มี dual encryption (Ali Prop + Widevine) ครบไหม
// Return: { valid, hasAliProp, hasWidevine, encryptTypes, streamCount, reason }
router.get('/verify-dual/:videoId', auth, admin, async (req, res) => {
  const { videoId } = req.params
  if (!videoId) return res.status(400).json({ error: 'videoId required' })

  try {
    const client = new RPCClient({
      accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
      endpoint: `https://vod.${process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
      apiVersion: '2017-03-21'
    })

    // 1. GetVideoInfo — เช็คว่า video มีอยู่จริง + status
    const info = await client.request('GetVideoInfo', { VideoId: videoId }, { method: 'POST' })
    const v = info.Video || {}
    if (v.Status !== 'Normal') {
      return res.json({
        valid: false,
        status: v.Status,
        reason: `Video ยังไม่พร้อม (status=${v.Status}) — ต้องรอ transcode เสร็จก่อน`
      })
    }

    // 2. GetPlayInfo — เช็ค 2 streams (Ali Prop + Widevine)
    const playInfo = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'm3u8,mpd',
      StreamType: 'video',
      ResultType: 'Multiple',
      AuthTimeout: 3000
    }, { method: 'POST' })

    const streams = (playInfo.PlayInfoList?.PlayInfo || []).map(s => ({
      format: s.Format,
      definition: s.Definition,
      encryptType: s.EncryptType,
      bitrate: s.Bitrate,
      size: s.Size
    }))
    const encTypes = new Set(streams.map(s => s.encryptType))
    const hasAliProp = encTypes.has('AliyunVoDEncryption')
    const hasWidevine = encTypes.has('Widevine-FairPlay')
    const valid = hasAliProp && hasWidevine

    let reason = ''
    if (!hasAliProp && !hasWidevine) {
      reason = 'ไม่มี encryption ทั้ง 2 แบบ — ต้อง transcode ใหม่ให้มี Ali Prop + Widevine'
    } else if (!hasAliProp) {
      reason = 'ขาด Ali Prop (AliyunVoDEncryption) — iOS จะเล่นไม่ได้'
    } else if (!hasWidevine) {
      reason = 'ขาด Widevine — Chrome/Android/PC จะไม่มี DRM'
    } else {
      reason = 'มี dual encryption ครบ (Ali Prop + Widevine) — พร้อมใช้'
    }

    return res.json({
      valid,
      videoId,
      title: v.Title || '',
      duration: v.Duration || 0,
      status: v.Status,
      hasAliProp,
      hasWidevine,
      encryptTypes: Array.from(encTypes),
      streamCount: streams.length,
      streams,
      reason
    })
  } catch (err) {
    if ((err.code || '').includes('NotFound') || (err.message || '').toLowerCase().includes('not found')) {
      return res.status(404).json({ valid: false, reason: 'ไม่พบ Video ID นี้ใน Alibaba VOD', code: 'VIDEO_NOT_FOUND' })
    }
    console.error('[verify-dual]', err.message)
    return res.status(500).json({ valid: false, reason: err.message, code: err.code || 'UNKNOWN' })
  }
})

module.exports = router
