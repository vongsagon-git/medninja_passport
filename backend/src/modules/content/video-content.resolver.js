/**
 * VideoContent Resolver
 * ═══════════════════════════════════════════════════════════
 * ถ้า video มี contentId → override 4 videoIds + duration จาก Library
 * ทำให้ "แก้ที่ Library ครั้งเดียว → ทุก section update ทันที"
 * ═══════════════════════════════════════════════════════════
 */
const VideoContent = require('./VideoContent.model')

/**
 * Resolve videos array (mutate in place).
 * Fields overridden: bunnyVideoId, bunnyDrmVideoId, aliVideoId, aliDrmVideoId, duration
 * Preserved from section: title, order, topic, pdfFile, requiredTier, bonus*, etc.
 */
async function resolveVideos(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return videos

  const ids = videos
    .map(v => v && v.contentId)
    .filter(Boolean)
    .map(id => id.toString())
  if (ids.length === 0) return videos

  const uniqueIds = [...new Set(ids)]
  const contents = await VideoContent.find({ _id: { $in: uniqueIds } }).lean()
  const byId = new Map(contents.map(c => [c._id.toString(), c]))

  for (const v of videos) {
    if (!v || !v.contentId) continue
    const c = byId.get(v.contentId.toString())
    if (!c) continue  // content deleted → keep section's own fields as fallback
    v.bunnyVideoId = c.bunnyVideoId
    v.bunnyDrmVideoId = c.bunnyDrmVideoId
    v.aliVideoId = c.aliVideoId
    v.aliDrmVideoId = c.aliDrmVideoId
    if (c.duration) v.duration = c.duration
    // Do NOT override title — section can rename per usage
  }
  return videos
}

/**
 * Resolve one section (mutate .videos in place).
 */
async function resolveSection(section) {
  if (!section) return section
  const videos = section.videos || (section.toObject ? section.toObject().videos : [])
  await resolveVideos(videos)
  if (section.videos !== videos && section.set) {
    // In case toObject was called and we mutated a copy
    section.set('videos', videos)
  }
  return section
}

module.exports = { resolveVideos, resolveSection }
