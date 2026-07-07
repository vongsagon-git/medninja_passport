const RPCClient = require('@alicloud/pop-core').RPCClient

const client = new RPCClient({
  accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  endpoint: `https://vod.${process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
  apiVersion: '2017-03-21'
})

// Log missing config at startup — help debug quickly
if (!process.env.ALIBABA_ACCESS_KEY_ID || !process.env.ALIBABA_ACCESS_KEY_SECRET) {
  console.warn('[china.controller] ALIBABA_ACCESS_KEY_ID or SECRET is not set — PlayAuth endpoint will return 500')
}

async function getPlayAuth(req, res) {
  const { videoId } = req.params
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' })
  }

  try {
    const result = await client.request('GetVideoPlayAuth', {
      VideoId: videoId,
      AuthInfoTimeout: 3000
    }, { method: 'POST' })

    return res.json({
      playAuth: result.PlayAuth,
      videoMeta: result.VideoMeta,
      requestId: result.RequestId,
      expireAt: new Date(Date.now() + 3000 * 1000).toISOString()
    })
  } catch (err) {
    console.error('[china.getPlayAuth] error:', err.message, err.code)
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN'
    })
  }
}

// List videos ใน account — เพื่อให้ AI เห็นว่ามี video อะไรบ้าง
async function listVideos(req, res) {
  try {
    const result = await client.request('SearchMedia', {
      PageNo: 1,
      PageSize: 20,
      SortBy: 'CreationTime:Desc',
      Fields: 'VideoBase,Transcode'
    }, { method: 'POST' })

    const videos = (result.MediaList || []).map(m => ({
      videoId: m.MediaId || (m.VideoBase && m.VideoBase.VideoId),
      title: m.VideoBase && m.VideoBase.Title,
      status: m.VideoBase && m.VideoBase.Status,
      duration: m.VideoBase && m.VideoBase.Duration,
      creationTime: m.VideoBase && m.VideoBase.CreationTime,
      transcodeMode: m.VideoBase && m.VideoBase.TranscodeMode,
      coverUrl: m.VideoBase && m.VideoBase.CoverURL
    }))

    return res.json({ count: videos.length, videos, total: result.Total })
  } catch (err) {
    console.error('[china.listVideos] error:', err.message, err.code)
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN'
    })
  }
}

// Get play info — URL + encryption status
async function getPlayInfo(req, res) {
  const { videoId } = req.params
  if (!videoId) return res.status(400).json({ error: 'videoId required' })

  try {
    const result = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'mp4,m3u8',
      AuthTimeout: 3000
    }, { method: 'POST' })

    const infoList = (result.PlayInfoList && result.PlayInfoList.PlayInfo) || []
    const streams = infoList.map(s => ({
      definition: s.Definition,
      format: s.Format,
      encrypt: s.Encrypt,
      encryptType: s.EncryptType,
      duration: s.Duration,
      size: s.Size,
      bitrate: s.Bitrate,
      width: s.Width,
      height: s.Height,
      playUrl: s.PlayURL,
      streamType: s.StreamType
    }))

    return res.json({
      videoBase: result.VideoBase,
      streamCount: streams.length,
      encrypted: streams.some(s => s.encrypt),
      streams
    })
  } catch (err) {
    console.error('[china.getPlayInfo] error:', err.message, err.code)
    return res.status(500).json({
      error: err.message,
      code: err.code || 'UNKNOWN'
    })
  }
}

// List Transcoding Template Groups
async function listTemplateGroups(req, res) {
  try {
    const result = await client.request('ListTranscodeTemplateGroup', {}, { method: 'POST' })
    const groups = (result.TranscodeTemplateGroupList || []).map(g => ({
      groupId: g.TranscodeTemplateGroupId,
      name: g.Name,
      isDefault: g.IsDefault,
      creationTime: g.CreationTime,
      modifyTime: g.ModifyTime
    }))
    return res.json({ count: groups.length, groups })
  } catch (err) {
    console.error('[china.listTemplateGroups]', err.message, err.code)
    return res.status(500).json({ error: err.message, code: err.code })
  }
}

// Submit transcoding job (re-transcode video ด้วย template ที่มี encryption)
async function submitTranscode(req, res) {
  const { videoId, templateGroupId } = req.query
  if (!videoId || !templateGroupId) {
    return res.status(400).json({ error: 'videoId + templateGroupId required (query params)' })
  }
  try {
    const result = await client.request('SubmitTranscodeJobs', {
      VideoId: videoId,
      TemplateGroupId: templateGroupId
    }, { method: 'POST' })
    return res.json({
      transcodeTaskId: result.TranscodeTaskId,
      jobs: result.TranscodeJobs,
      requestId: result.RequestId
    })
  } catch (err) {
    console.error('[china.submitTranscode]', err.message, err.code)
    return res.status(500).json({ error: err.message, code: err.code })
  }
}

module.exports = { getPlayAuth, listVideos, getPlayInfo, listTemplateGroups, submitTranscode }
