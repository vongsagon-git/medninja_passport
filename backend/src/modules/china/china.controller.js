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

module.exports = { getPlayAuth }
