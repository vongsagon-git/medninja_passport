/**
 * VideoContent Library — save/list/delete
 * ═══════════════════════════════════════════════════════════
 * รวบรวม video ที่มี 4 fields ครบ ใช้ reuse ตอนสร้าง section
 * ═══════════════════════════════════════════════════════════
 */
const VideoContent = require('./VideoContent.model')

// POST /api/admin/video-contents
// Body: { title, tagLv1, tagLv2, tagLv3, bunnyVideoId, bunnyDrmVideoId, aliVideoId, duration, notes }
// aliVideoId = 1 ID มี dual encryption (Ali Prop + Widevine)
exports.saveContent = async (req, res) => {
  try {
    const {
      title, tagLv1, tagLv2, tagLv3,
      bunnyVideoId, bunnyDrmVideoId, aliVideoId,
      duration, notes
    } = req.body

    if (!title || !title.trim()) return res.status(400).json({ error: 'title required' })
    if (!bunnyVideoId || !bunnyDrmVideoId || !aliVideoId) {
      return res.status(400).json({ error: 'ต้องมี 3 videoIds ครบ (bunny×2 + ali×1 dual)' })
    }

    const doc = await VideoContent.findOneAndUpdate(
      { title: title.trim() },
      {
        title: title.trim(),
        tagLv1: (tagLv1 || '').trim(),
        tagLv2: (tagLv2 || '').trim(),
        tagLv3: (tagLv3 || '').trim(),
        bunnyVideoId, bunnyDrmVideoId, aliVideoId,
        duration: duration || '',
        notes: notes || '',
        createdBy: req.user?.email || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ ok: true, content: doc })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'title ซ้ำใน Library' })
    console.error('[video-content.save]', err.message)
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/video-contents?search=&tagLv1=&tagLv2=&tagLv3=
exports.listContents = async (req, res) => {
  try {
    const { search, tagLv1, tagLv2, tagLv3 } = req.query
    const q = {}
    if (tagLv1) q.tagLv1 = tagLv1
    if (tagLv2) q.tagLv2 = tagLv2
    if (tagLv3) q.tagLv3 = tagLv3
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      q.$or = [{ title: re }, { notes: re }]
    }
    const contents = await VideoContent.find(q).sort({ tagLv1: 1, tagLv2: 1, tagLv3: 1, title: 1 }).lean()
    res.json({ ok: true, contents })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/video-contents/tags — คืน tag ทั้งหมดสำหรับ filter dropdown
exports.getTags = async (req, res) => {
  try {
    const [lv1, lv2, lv3] = await Promise.all([
      VideoContent.distinct('tagLv1', { tagLv1: { $ne: '' } }),
      VideoContent.distinct('tagLv2', { tagLv2: { $ne: '' } }),
      VideoContent.distinct('tagLv3', { tagLv3: { $ne: '' } })
    ])
    res.json({ ok: true, tagLv1: lv1.sort(), tagLv2: lv2.sort(), tagLv3: lv3.sort() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/video-contents/:id/usage
// Returns sections + video indices that link to this content
exports.getUsage = async (req, res) => {
  try {
    const Section = require('./Section.model')
    const sections = await Section.find(
      { 'videos.contentId': req.params.id },
      { code: 1, name: 1, videos: 1 }
    ).lean()

    const usage = []
    for (const s of sections) {
      const matches = []
      for (let i = 0; i < (s.videos || []).length; i++) {
        const v = s.videos[i]
        if (v.contentId && v.contentId.toString() === req.params.id) {
          matches.push({ index: i, title: v.title, topic: v.topic, subtopic: v.subtopic })
        }
      }
      if (matches.length > 0) {
        usage.push({ _id: s._id, code: s.code, name: s.name, videos: matches })
      }
    }
    res.json({ ok: true, usage, count: usage.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/admin/video-contents/:id
exports.deleteContent = async (req, res) => {
  try {
    const doc = await VideoContent.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
