/**
 * Self Check Controller — student endpoints
 * - GET /api/my/self-checks/:slug
 * - POST /api/my/self-checks/:slug/toggle
 * - GET /api/my/self-checks (list ทั้งหมดที่นักเรียนเข้าถึงได้)
 */
const SelfCheckTemplate = require('./SelfCheckTemplate.model')
const SelfCheckBinding = require('./SelfCheckBinding.model')
const SelfCheckProgress = require('./SelfCheckProgress.model')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')
const Section = require('../content/Section.model')

// ─── helper: ตรวจสิทธิ์ — user มี activation ที่มี section ที่ผูก template นี้ไหม? ───
async function canAccessTemplate(user, templateSlug) {
  if (user.role === 'admin') return true
  // 1. หา bindings ของ template
  const bindings = await SelfCheckBinding.find({ templateSlug, isOrphan: { $ne: true } }).select('sectionId').lean()
  if (!bindings.length) return false
  const sectionIds = [...new Set(bindings.map(b => String(b.sectionId)))]
  // 2. หา activation ของ user → packages → sections → intersect
  const activations = await Activation.find({
    userId: user._id, isActive: true, expiresAt: { $gt: new Date() }
  }).select('packageId').lean()
  if (!activations.length) return false
  const userSections = await Package.find({
    _id: { $in: activations.map(a => a.packageId) }
  }).select('sections').lean()
  const userSectionIds = new Set(userSections.flatMap(p => (p.sections || []).map(String)))
  return sectionIds.some(sid => userSectionIds.has(sid))
}

function calcPercent(checkedItems, template) {
  const total = template.sections.reduce((sum, s) => sum + (s.items?.length || 0), 0)
  if (!total) return { completed: 0, total: 0, percent: 0 }
  // นับเฉพาะ itemId ที่ยังอยู่ใน template (กัน itemId ที่ admin ลบไป)
  const validIds = new Set(template.sections.flatMap(s => (s.items || []).map(i => i.id)))
  const completed = (checkedItems || []).filter(id => validIds.has(id)).length
  return { completed, total, percent: Math.round((completed / total) * 100) }
}

// GET /api/my/self-checks/:slug
exports.getOne = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    const template = await SelfCheckTemplate.findOne({ slug, isPublished: true }).lean()
    if (!template) return res.status(404).json({ message: 'ไม่พบ checklist' })
    if (!(await canAccessTemplate(req.user, slug))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง checklist นี้' })
    }
    const prog = await SelfCheckProgress.findOne({ userId: req.user._id, templateSlug: slug }).lean()
    const checkedItems = prog?.checkedItems || []
    res.json({
      template,
      checkedItems,
      ...calcPercent(checkedItems, template)
    })
  } catch (err) { next(err) }
}

// POST /api/my/self-checks/:slug/toggle
// body: { itemId: string, checked: boolean }
exports.toggle = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    const { itemId, checked } = req.body || {}
    if (!itemId || typeof checked !== 'boolean') {
      return res.status(400).json({ message: 'missing itemId/checked' })
    }
    const template = await SelfCheckTemplate.findOne({ slug, isPublished: true }).lean()
    if (!template) return res.status(404).json({ message: 'ไม่พบ checklist' })
    if (!(await canAccessTemplate(req.user, slug))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' })
    }
    // ตรวจ itemId ต้องอยู่ใน template (กัน inject)
    const validIds = new Set(template.sections.flatMap(s => (s.items || []).map(i => i.id)))
    if (!validIds.has(itemId)) {
      return res.status(400).json({ message: 'itemId ไม่ถูกต้อง' })
    }
    const update = checked
      ? { $addToSet: { checkedItems: itemId } }
      : { $pull:     { checkedItems: itemId } }
    const updated = await SelfCheckProgress.findOneAndUpdate(
      { userId: req.user._id, templateSlug: slug },
      { ...update, $setOnInsert: { userId: req.user._id, templateSlug: slug } },
      { upsert: true, new: true }
    ).lean()
    res.json({
      ok: true,
      ...calcPercent(updated.checkedItems, template)
    })
  } catch (err) { next(err) }
}

// GET /api/my/self-checks — list templates ที่นักเรียนเข้าถึงได้ + progress %
exports.listMine = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    let templateSlugs = []
    if (isAdmin) {
      const all = await SelfCheckTemplate.find({ isPublished: true }).select('slug').lean()
      templateSlugs = all.map(t => t.slug)
    } else {
      // user's sections via activations
      const activations = await Activation.find({
        userId: req.user._id, isActive: true, expiresAt: { $gt: new Date() }
      }).select('packageId').lean()
      if (!activations.length) return res.json({ items: [] })
      const packages = await Package.find({
        _id: { $in: activations.map(a => a.packageId) }
      }).select('sections').lean()
      const userSectionIds = [...new Set(packages.flatMap(p => (p.sections || []).map(String)))]
      const bindings = await SelfCheckBinding.find({
        sectionId: { $in: userSectionIds },
        isOrphan: { $ne: true }
      }).select('templateSlug').lean()
      templateSlugs = [...new Set(bindings.map(b => b.templateSlug))]
    }
    if (!templateSlugs.length) return res.json({ items: [] })
    const templates = await SelfCheckTemplate.find({ slug: { $in: templateSlugs }, isPublished: true }).lean()
    const progresses = await SelfCheckProgress.find({
      userId: req.user._id,
      templateSlug: { $in: templateSlugs }
    }).lean()
    const progMap = Object.fromEntries(progresses.map(p => [p.templateSlug, p.checkedItems]))
    const items = templates.map(t => ({
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      icon: t.icon,
      color: t.color,
      ...calcPercent(progMap[t.slug] || [], t)
    }))
    res.json({ items })
  } catch (err) { next(err) }
}
