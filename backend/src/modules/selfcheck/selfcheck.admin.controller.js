/**
 * Self Check Admin Controller — CRUD Templates + Bindings + Analytics
 */
const crypto = require('crypto')
const SelfCheckTemplate = require('./SelfCheckTemplate.model')
const SelfCheckBinding = require('./SelfCheckBinding.model')
const SelfCheckProgress = require('./SelfCheckProgress.model')
const Section = require('../content/Section.model')
const Package = require('../content/Package.model')
const Activation = require('../activation/Activation.model')
const User = require('../user/User.model')

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`
}

// assign id ให้ทุก section/item ที่ยังไม่มี + กัน duplicate
function ensureItemIds(sections) {
  const seen = new Set()
  for (const sec of (sections || [])) {
    if (!sec.id || seen.has(sec.id)) sec.id = genId('sec')
    seen.add(sec.id)
    const seenItems = new Set()
    for (const item of (sec.items || [])) {
      if (!item.id || seenItems.has(item.id)) item.id = genId('itm')
      seenItems.add(item.id)
    }
  }
}

// ═══════════════════════════════════════════════════
// TEMPLATES — CRUD
// ═══════════════════════════════════════════════════

// GET /api/admin/self-checks/templates
exports.listTemplates = async (req, res, next) => {
  try {
    const templates = await SelfCheckTemplate.find().sort('-updatedAt').lean()
    // นับ bindings + progress per template
    const slugs = templates.map(t => t.slug)
    const [bindingCounts, progressCounts] = await Promise.all([
      SelfCheckBinding.aggregate([
        { $match: { templateSlug: { $in: slugs } } },
        { $group: { _id: '$templateSlug', count: { $sum: 1 } } }
      ]),
      SelfCheckProgress.aggregate([
        { $match: { templateSlug: { $in: slugs } } },
        { $group: { _id: '$templateSlug', count: { $sum: 1 } } }
      ])
    ])
    const bMap = Object.fromEntries(bindingCounts.map(b => [b._id, b.count]))
    const pMap = Object.fromEntries(progressCounts.map(p => [p._id, p.count]))
    res.json({
      templates: templates.map(t => ({
        ...t,
        totalItems: (t.sections || []).reduce((s, sec) => s + (sec.items?.length || 0), 0),
        bindingCount: bMap[t.slug] || 0,
        userCount: pMap[t.slug] || 0
      }))
    })
  } catch (err) { next(err) }
}

// GET /api/admin/self-checks/templates/:slug
exports.getTemplate = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    const template = await SelfCheckTemplate.findOne({ slug }).lean()
    if (!template) return res.status(404).json({ message: 'ไม่พบ template' })
    res.json({ template })
  } catch (err) { next(err) }
}

// POST /api/admin/self-checks/templates
exports.createTemplate = async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (!body.slug || !body.name) return res.status(400).json({ message: 'slug + name required' })
    body.slug = String(body.slug).toLowerCase().trim()
    ensureItemIds(body.sections)
    const tpl = await SelfCheckTemplate.create(body)
    res.status(201).json({ template: tpl })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'slug ซ้ำ' })
    next(err)
  }
}

// PUT /api/admin/self-checks/templates/:slug
exports.updateTemplate = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    const body = { ...req.body }
    delete body.slug                            // ห้ามแก้ slug (จะทำ binding/progress พัง)
    ensureItemIds(body.sections)
    const tpl = await SelfCheckTemplate.findOneAndUpdate(
      { slug }, body, { new: true, runValidators: true }
    )
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    res.json({ template: tpl })
  } catch (err) { next(err) }
}

// DELETE /api/admin/self-checks/templates/:slug
exports.deleteTemplate = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    const bCount = await SelfCheckBinding.countDocuments({ templateSlug: slug })
    if (bCount > 0) return res.status(409).json({ message: `template นี้มี ${bCount} bindings ลบไม่ได้ ให้ลบ binding ก่อน` })
    await SelfCheckTemplate.deleteOne({ slug })
    // ไม่ลบ progress (กันพลั้ง — ถ้า admin สร้าง template slug เดิมใหม่ จะได้ progress คืน)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// ═══════════════════════════════════════════════════
// BINDINGS — ผูก template กับ topic/subtopic
// ═══════════════════════════════════════════════════

// GET /api/admin/self-checks/bindings?templateSlug=&sectionId=
exports.listBindings = async (req, res, next) => {
  try {
    const q = {}
    if (req.query.templateSlug) q.templateSlug = String(req.query.templateSlug).toLowerCase()
    if (req.query.sectionId) q.sectionId = req.query.sectionId
    const bindings = await SelfCheckBinding.find(q).sort('-updatedAt').lean()
    // populate section name + template name
    const sectionIds = [...new Set(bindings.map(b => String(b.sectionId)))]
    const slugs = [...new Set(bindings.map(b => b.templateSlug))]
    const [sections, templates] = await Promise.all([
      Section.find({ _id: { $in: sectionIds } }).select('code name').lean(),
      SelfCheckTemplate.find({ slug: { $in: slugs } }).select('slug name icon').lean()
    ])
    const sMap = Object.fromEntries(sections.map(s => [String(s._id), s]))
    const tMap = Object.fromEntries(templates.map(t => [t.slug, t]))
    res.json({
      bindings: bindings.map(b => ({
        ...b,
        section: sMap[String(b.sectionId)] || null,
        template: tMap[b.templateSlug] || null
      }))
    })
  } catch (err) { next(err) }
}

// POST /api/admin/self-checks/bindings
// body: { scope, refId, templateSlug, sectionId, refNameSnapshot? }
exports.createBinding = async (req, res, next) => {
  try {
    const { scope, refId, templateSlug, sectionId, refNameSnapshot } = req.body || {}
    if (!scope || !refId || !templateSlug || !sectionId) {
      return res.status(400).json({ message: 'missing fields' })
    }
    if (!['topic', 'subtopic'].includes(scope)) {
      return res.status(400).json({ message: 'scope ต้องเป็น topic หรือ subtopic' })
    }
    const tpl = await SelfCheckTemplate.findOne({ slug: String(templateSlug).toLowerCase() }).lean()
    if (!tpl) return res.status(404).json({ message: 'ไม่พบ template' })
    const sec = await Section.findById(sectionId).lean()
    if (!sec) return res.status(404).json({ message: 'ไม่พบ section' })
    // snapshot ชื่อ topic/subtopic จาก section
    let name = refNameSnapshot || ''
    if (!name) {
      const v = (sec.videos || []).find(v => (scope === 'topic' ? v.topicId : v.subtopicId) === refId)
      if (v) name = scope === 'topic' ? v.topic : v.subtopic
    }
    const binding = await SelfCheckBinding.findOneAndUpdate(
      { scope, refId },
      {
        scope,
        refId,
        templateSlug: String(templateSlug).toLowerCase(),
        sectionId,
        refNameSnapshot: name,
        isOrphan: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.json({ binding })
  } catch (err) { next(err) }
}

// DELETE /api/admin/self-checks/bindings/:id
exports.deleteBinding = async (req, res, next) => {
  try {
    await SelfCheckBinding.deleteOne({ _id: req.params.id })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// ═══════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════

// GET /api/admin/self-checks/analytics?slug=&sectionId=&packageId=
exports.analytics = async (req, res, next) => {
  try {
    const slug = String(req.query.slug || '').toLowerCase()
    if (!slug) return res.status(400).json({ message: 'slug required' })
    const template = await SelfCheckTemplate.findOne({ slug }).lean()
    if (!template) return res.status(404).json({ message: 'ไม่พบ template' })

    // หา users ที่เข้าถึง template นี้ได้
    // 1. หา bindings → sections ที่ผูก template นี้
    const bindings = await SelfCheckBinding.find({ templateSlug: slug }).select('sectionId').lean()
    let sectionIds = [...new Set(bindings.map(b => String(b.sectionId)))]
    if (req.query.sectionId) sectionIds = sectionIds.filter(s => s === String(req.query.sectionId))
    if (!sectionIds.length) return res.json({ template, users: [], items: [], bottomItems: [] })

    // 2. หา packages ที่ contain sections เหล่านี้
    const packageQuery = { sections: { $in: sectionIds } }
    if (req.query.packageId) packageQuery._id = req.query.packageId
    const packages = await Package.find(packageQuery).select('_id title').lean()
    const packageIds = packages.map(p => p._id)
    if (!packageIds.length) return res.json({ template, users: [], items: [], bottomItems: [] })

    // 3. หา activations
    const activations = await Activation.find({
      packageId: { $in: packageIds },
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('userId packageId').lean()
    const userIds = [...new Set(activations.map(a => String(a.userId)))]
    if (!userIds.length) return res.json({ template, users: [], items: [], bottomItems: [] })

    // 4. ดึง users + progress
    const [users, progresses] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name nickname email lineDisplayName').lean(),
      SelfCheckProgress.find({ userId: { $in: userIds }, templateSlug: slug }).lean()
    ])
    const progMap = Object.fromEntries(progresses.map(p => [String(p.userId), p]))

    // 5. build items flat list (พร้อม section title)
    const flatItems = []
    for (const sec of template.sections) {
      for (const item of (sec.items || [])) {
        flatItems.push({ id: item.id, text: item.text, sectionTitle: sec.title })
      }
    }
    const total = flatItems.length

    // 6. per user data
    const userRows = users.map(u => {
      const checked = progMap[String(u._id)]?.checkedItems || []
      const checkedSet = new Set(checked)
      const completed = flatItems.filter(i => checkedSet.has(i.id)).length
      return {
        userId: u._id,
        name: u.nickname || u.name || u.lineDisplayName || u.email,
        completed,
        total,
        percent: total ? Math.round((completed / total) * 100) : 0,
        checkedItems: checked,
        lastUpdate: progMap[String(u._id)]?.updatedAt || null
      }
    })

    // 7. per item counts
    const itemRows = flatItems.map(i => {
      const count = userRows.filter(u => u.checkedItems.includes(i.id)).length
      return {
        id: i.id,
        text: i.text,
        sectionTitle: i.sectionTitle,
        checkedCount: count,
        totalUsers: userRows.length,
        percent: userRows.length ? Math.round((count / userRows.length) * 100) : 0
      }
    })

    // 8. bottom 5 items (น้อยสุด — เข้าใจน้อยสุด)
    const bottomItems = [...itemRows].sort((a, b) => a.checkedCount - b.checkedCount).slice(0, 5)

    res.json({
      template: { slug: template.slug, name: template.name, icon: template.icon, totalItems: total },
      summary: {
        userCount: userRows.length,
        avgPercent: userRows.length
          ? Math.round(userRows.reduce((s, u) => s + u.percent, 0) / userRows.length)
          : 0,
        fullyDone: userRows.filter(u => u.percent === 100).length
      },
      users: userRows,
      items: itemRows,
      bottomItems
    })
  } catch (err) { next(err) }
}

// ═══════════════════════════════════════════════════
// SECTION TOPICS — ดู topic/subtopic ของ section + binding (สำหรับ admin UI dropdown)
// ═══════════════════════════════════════════════════

// GET /api/admin/self-checks/section-topics/:sectionId
exports.getSectionTopics = async (req, res, next) => {
  try {
    const sec = await Section.findById(req.params.sectionId).lean()
    if (!sec) return res.status(404).json({ message: 'ไม่พบ section' })
    const topicMap = new Map()      // topicId → { name, subtopics: Map<subId, subName> }
    for (const v of (sec.videos || [])) {
      if (v.topicId) {
        if (!topicMap.has(v.topicId)) topicMap.set(v.topicId, { id: v.topicId, name: v.topic, subtopics: new Map() })
        if (v.subtopicId) {
          topicMap.get(v.topicId).subtopics.set(v.subtopicId, { id: v.subtopicId, name: v.subtopic })
        }
      }
    }
    const topics = [...topicMap.values()].map(t => ({
      ...t,
      subtopics: [...t.subtopics.values()]
    }))
    // bindings
    const refIds = topics.flatMap(t => [t.id, ...t.subtopics.map(s => s.id)])
    const bindings = await SelfCheckBinding.find({ refId: { $in: refIds } }).lean()
    const bMap = Object.fromEntries(bindings.map(b => [`${b.scope}:${b.refId}`, b]))
    for (const t of topics) {
      t.binding = bMap[`topic:${t.id}`] || null
      for (const s of t.subtopics) {
        s.binding = bMap[`subtopic:${s.id}`] || null
      }
    }
    res.json({ section: { _id: sec._id, code: sec.code, name: sec.name }, topics })
  } catch (err) { next(err) }
}
