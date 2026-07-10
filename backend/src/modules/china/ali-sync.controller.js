/**
 * Ali Sync Controller
 * ═══════════════════════════════════════════════════════════
 * 2 upload paths → 2 mediaIds per video (NoDRM + Widevine)
 *
 * Path A: Bunny → Ali (UploadMediaByURL — server-to-server)
 * Path B: Local → Ali (CreateUploadVideo — user upload direct to Ali OSS)
 *
 * Both paths call Alibaba 2 times (2 templates) → 2 mediaIds
 * Save to Section.videos[i].aliVideoId + aliDrmVideoId
 * ═══════════════════════════════════════════════════════════
 */

const RPCClient = require('@alicloud/pop-core').RPCClient
const Section = require('../content/Section.model')
const { bunnyConfig } = require('../../shared/config/bunny')

const ALI_TEMPLATE_NODRM = process.env.ALI_TEMPLATE_NODRM || ''
const ALI_TEMPLATE_WIDEVINE = process.env.ALI_TEMPLATE_WIDEVINE || ''

const client = new RPCClient({
  accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  endpoint: `https://vod.${process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'}.aliyuncs.com`,
  apiVersion: '2017-03-21'
})

// ─── Helper: Get Bunny direct MP4 URL for Ali fetch ───
async function getBunnyDirectMp4Url(bunnyVideoId) {
  if (!bunnyConfig.apiKey || !bunnyConfig.libraryId) {
    throw new Error('BUNNY_API_KEY or BUNNY_LIBRARY_ID not set')
  }
  // Get video info from Bunny
  const infoUrl = `https://video.bunnycdn.com/library/${bunnyConfig.libraryId}/videos/${bunnyVideoId}`
  const resp = await fetch(infoUrl, {
    headers: { AccessKey: bunnyConfig.apiKey }
  })
  if (!resp.ok) throw new Error(`Bunny API ${resp.status}`)
  const info = await resp.json()

  // Bunny direct MP4 URL — need Pull Zone hostname
  // Format: https://{pull-zone}.b-cdn.net/{videoGuid}/play_1080p.mp4
  const pullZone = process.env.BUNNY_PULL_ZONE || bunnyConfig.cdnHostname
  if (!pullZone) throw new Error('BUNNY_PULL_ZONE not set')

  // Prefer 1080p, fallback lower
  const heights = [1080, 720, 480, 360]
  for (const h of heights) {
    const mp4 = `https://${pullZone}/${bunnyVideoId}/play_${h}p.mp4`
    // Test HEAD (Ali will fetch — need public MP4 access)
    try {
      const test = await fetch(mp4, { method: 'HEAD' })
      if (test.ok) return mp4
    } catch { /* try next */ }
  }
  throw new Error('No accessible MP4 resolution found on Bunny')
}

// ─── Path A: POST /api/admin/ali-sync/from-bunny ───
// Body: { sectionId, videoIndex }
// Pulls Bunny video → Ali VOD (2 templates → 2 mediaIds)
exports.syncFromBunny = async (req, res) => {
  try {
    const { sectionId, videoIndex } = req.body
    if (!sectionId || videoIndex === undefined) {
      return res.status(400).json({ error: 'sectionId + videoIndex required' })
    }
    if (!ALI_TEMPLATE_NODRM || !ALI_TEMPLATE_WIDEVINE) {
      return res.status(500).json({
        error: 'ALI_TEMPLATE_NODRM or ALI_TEMPLATE_WIDEVINE env not set',
        hint: 'Set both template group IDs from Alibaba VOD Console'
      })
    }

    const section = await Section.findById(sectionId)
    if (!section) return res.status(404).json({ error: 'Section not found' })
    const video = section.videos[videoIndex]
    if (!video) return res.status(404).json({ error: 'Video not found' })

    if (!video.bunnyVideoId) {
      return res.status(400).json({ error: 'No Bunny video to sync from' })
    }
    if (video.aliVideoId && video.aliDrmVideoId) {
      return res.status(400).json({
        error: 'Ali already synced',
        aliVideoId: video.aliVideoId,
        aliDrmVideoId: video.aliDrmVideoId
      })
    }

    // Get Bunny public MP4 URL for Ali to fetch
    const bunnyMp4Url = await getBunnyDirectMp4Url(video.bunnyVideoId)

    // Upload 2 times (NoDRM + Widevine) in parallel — same source URL
    const [noDrmResp, drmResp] = await Promise.all([
      client.request('UploadMediaByURL', {
        UploadURLs: JSON.stringify([{
          SourceURL: bunnyMp4Url,
          Title: `${video.title} (NoDRM)`,
          Description: `Auto-synced from Bunny videoId=${video.bunnyVideoId}`,
          TemplateGroupId: ALI_TEMPLATE_NODRM
        }])
      }, { method: 'POST' }),
      client.request('UploadMediaByURL', {
        UploadURLs: JSON.stringify([{
          SourceURL: bunnyMp4Url,
          Title: `${video.title} (Widevine)`,
          Description: `Auto-synced from Bunny videoId=${video.bunnyVideoId}`,
          TemplateGroupId: ALI_TEMPLATE_WIDEVINE
        }])
      }, { method: 'POST' })
    ])

    const noDrmJob = JSON.parse(noDrmResp.UploadJobs)[0]
    const drmJob = JSON.parse(drmResp.UploadJobs)[0]

    // Save mediaIds to DB (pending encoding)
    section.videos[videoIndex].aliVideoId = noDrmJob.VideoId
    section.videos[videoIndex].aliDrmVideoId = drmJob.VideoId
    await section.save()

    res.json({
      ok: true,
      source: 'bunny',
      aliVideoId: noDrmJob.VideoId,       // NoDRM
      aliDrmVideoId: drmJob.VideoId,      // Widevine
      status: 'uploading',                 // Ali is now fetching + transcoding
      sourceUrl: bunnyMp4Url.replace(/\?.*/, '')  // hide any query string
    })
  } catch (err) {
    console.error('[ali-sync.syncFromBunny]', err.message)
    res.status(500).json({ error: err.message, code: err.code || 'SYNC_FAIL' })
  }
}

// ─── Path B: POST /api/admin/ali-sync/local-auth ───
// Body: { title }
// Returns 2 UploadAuth (NoDRM + Widevine) — frontend uses Ali Upload SDK to push file
exports.getLocalUploadAuth = async (req, res) => {
  try {
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })
    if (!ALI_TEMPLATE_NODRM || !ALI_TEMPLATE_WIDEVINE) {
      return res.status(500).json({ error: 'Template env not set' })
    }

    // Create 2 upload sessions (NoDRM + Widevine) in parallel
    const [noDrmResp, drmResp] = await Promise.all([
      client.request('CreateUploadVideo', {
        Title: `${title} (NoDRM)`,
        FileName: 'video.mp4',
        TemplateGroupId: ALI_TEMPLATE_NODRM
      }, { method: 'POST' }),
      client.request('CreateUploadVideo', {
        Title: `${title} (Widevine)`,
        FileName: 'video.mp4',
        TemplateGroupId: ALI_TEMPLATE_WIDEVINE
      }, { method: 'POST' })
    ])

    res.json({
      ok: true,
      noDrm: {
        videoId: noDrmResp.VideoId,
        uploadAuth: noDrmResp.UploadAuth,
        uploadAddress: noDrmResp.UploadAddress
      },
      drm: {
        videoId: drmResp.VideoId,
        uploadAuth: drmResp.UploadAuth,
        uploadAddress: drmResp.UploadAddress
      }
    })
  } catch (err) {
    console.error('[ali-sync.getLocalUploadAuth]', err.message)
    res.status(500).json({ error: err.message, code: err.code || 'AUTH_FAIL' })
  }
}

// ─── POST /api/admin/ali-sync/save-ids ───
// Called by frontend after Ali Upload SDK finishes
// Body: { sectionId, videoIndex, aliVideoId, aliDrmVideoId }
exports.saveAliIds = async (req, res) => {
  try {
    const { sectionId, videoIndex, aliVideoId, aliDrmVideoId } = req.body
    if (!sectionId || videoIndex === undefined || !aliVideoId || !aliDrmVideoId) {
      return res.status(400).json({ error: 'sectionId + videoIndex + aliVideoId + aliDrmVideoId required' })
    }

    const section = await Section.findById(sectionId)
    if (!section) return res.status(404).json({ error: 'Section not found' })
    if (!section.videos[videoIndex]) return res.status(404).json({ error: 'Video not found' })

    section.videos[videoIndex].aliVideoId = aliVideoId
    section.videos[videoIndex].aliDrmVideoId = aliDrmVideoId
    await section.save()

    res.json({ ok: true, aliVideoId, aliDrmVideoId })
  } catch (err) {
    console.error('[ali-sync.saveAliIds]', err.message)
    res.status(500).json({ error: err.message })
  }
}

// ─── GET /api/admin/ali-sync/status?ids=id1,id2 ───
// Poll encoding status of 2 mediaIds
exports.checkStatus = async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').filter(Boolean)
    if (ids.length === 0) return res.status(400).json({ error: 'ids required (comma-separated)' })
    if (ids.length > 10) return res.status(400).json({ error: 'max 10 ids' })

    const results = await Promise.all(ids.map(async (id) => {
      try {
        const info = await client.request('GetVideoInfo', { VideoId: id }, { method: 'POST' })
        const v = info.Video || {}
        return {
          videoId: id,
          status: v.Status,           // Uploading | Transcoding | Normal | Fail
          title: v.Title || '',
          duration: v.Duration || 0,
          size: v.Size || 0,
          coverUrl: v.CoverURL || ''
        }
      } catch (err) {
        return { videoId: id, status: 'ERROR', error: err.message }
      }
    }))

    const allReady = results.every(r => r.status === 'Normal')
    const anyFail = results.some(r => r.status === 'Fail' || r.status === 'ERROR')

    res.json({ ok: true, results, allReady, anyFail })
  } catch (err) {
    console.error('[ali-sync.checkStatus]', err.message)
    res.status(500).json({ error: err.message })
  }
}
