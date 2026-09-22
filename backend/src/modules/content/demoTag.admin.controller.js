/**
 * DemoTag Admin Controller — CRUD tag ที่ใช้กับ demo video
 */
const DemoTag = require('./DemoTag.model')
const Section = require('./Section.model')
const Package = require('./Package.model')

// ─── Default seed ───
// 'all' = ฝั่ง VIDEO เท่านั้น (video ที่ tag ALL = user ทุก track เห็นได้)
// ฝั่ง user activation ห้ามแปะ 'all' — admin ต้องเลือก track เฉพาะ
const DEFAULT_TAGS = [
  { code: 'all',       label: 'ALL',       color: '#0ea5e9', order: 0, isSystem: true,  description: 'ใช้ที่ VIDEO เท่านั้น — video ที่ tag ALL จะโชว์ให้ user ทุก track' },
  { code: 'nl12',      label: 'NL1+2',     color: '#3b82f6', order: 1, isSystem: false, description: '' },
  { code: 'nl2',       label: 'NL2',       color: '#6366f1', order: 2, isSystem: false, description: '' },
  { code: 'meq',       label: 'MEQ',       color: '#a855f7', order: 3, isSystem: false, description: '' },
  { code: 'osce',      label: 'OSCE',      color: '#ec4899', order: 4, isSystem: false, description: '' },
  { code: 'longcase',  label: 'LONGCASE',  color: '#f59e0b', order: 5, isSystem: false, description: '' },
  { code: 'preclinic', label: 'PRECLINIC', color: '#10b981', order: 6, isSystem: false, description: '' }
]

// ─── Auto-seed ตอน server start (idempotent) ───
async function seedDefaults() {
  try {
    for (const t of DEFAULT_TAGS) {
      const exists = await DemoTag.findOne({ code: t.code }).lean()
      if (!exists) {
        await DemoTag.create(t)
        console.log(`[DemoTag] seeded: ${t.code}`)
      }
    }
  } catch (e) {
    console.error('[DemoTag] seed failed:', e.message)
  }
}
seedDefaults()

// ─── PUBLIC (สำหรับ ManageSections) ───
exports.listTags = async (req, res, next) => {
  try {
    const tags = await DemoTag.find().sort('order code').lean()
    res.json({ tags })
  } catch (err) { next(err) }
}

exports.createTag = async (req, res, next) => {
  try {
    const { code, label, color, description, order } = req.body || {}
    if (!code || !label) {
      return res.status(400).json({ message: 'ต้องกรอก code + label' })
    }
    const exists = await DemoTag.findOne({ code: String(code).toLowerCase().trim() }).lean()
    if (exists) {
      return res.status(409).json({ message: `มี tag code "${code}" อยู่แล้ว` })
    }
    const tag = await DemoTag.create({
      code: String(code).toLowerCase().trim(),
      label: String(label).trim(),
      color: color || '#0ea5e9',
      description: description || '',
      order: order || 0,
      isSystem: false
    })
    res.status(201).json({ tag })
  } catch (err) { next(err) }
}

exports.updateTag = async (req, res, next) => {
  try {
    const { label, color, description, order, code } = req.body || {}
    const tag = await DemoTag.findById(req.params.id)
    if (!tag) return res.status(404).json({ message: 'ไม่พบ tag' })

    // ถ้าเปลี่ยน code + tag ไม่ใช่ system → เช็คซ้ำ
    if (code && code !== tag.code) {
      if (tag.isSystem) {
        return res.status(400).json({ message: `🔒 ไม่สามารถเปลี่ยน code ของ system tag "${tag.code}"` })
      }
      const dup = await DemoTag.findOne({ code: String(code).toLowerCase().trim(), _id: { $ne: tag._id } }).lean()
      if (dup) return res.status(409).json({ message: `มี tag code "${code}" อยู่แล้ว` })
      tag.code = String(code).toLowerCase().trim()
    }
    if (label !== undefined) tag.label = String(label).trim()
    if (color !== undefined) tag.color = color
    if (description !== undefined) tag.description = description
    if (order !== undefined) tag.order = order
    await tag.save()
    res.json({ tag })
  } catch (err) { next(err) }
}

exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await DemoTag.findById(req.params.id)
    if (!tag) return res.status(404).json({ message: 'ไม่พบ tag' })

    if (tag.isSystem) {
      return res.status(403).json({ message: `🔒 Tag "${tag.code}" เป็น system tag ห้ามลบ` })
    }

    // ตรวจว่ามี video ไหนใช้ tag นี้อยู่บ้าง
    const demoPkg = await Package.findOne({ isDemo: true }).select('sections').lean()
    if (demoPkg) {
      const sections = await Section.find({ _id: { $in: demoPkg.sections } }).select('name videos').lean()
      const usingVideos = []
      for (const sec of sections) {
        for (const v of (sec.videos || [])) {
          if (Array.isArray(v.demoTags) && v.demoTags.includes(tag.code)) {
            usingVideos.push(`${sec.name}: "${v.title || '(ไม่มีชื่อ)'}"`)
          }
        }
      }
      if (usingVideos.length) {
        return res.status(400).json({
          message: `❌ ลบไม่ได้ — ยังมี ${usingVideos.length} video ใช้ tag นี้อยู่`,
          videos: usingVideos.slice(0, 10)
        })
      }
    }

    await tag.deleteOne()
    res.json({ ok: true, message: `ลบ tag "${tag.code}" เรียบร้อย` })
  } catch (err) { next(err) }
}
