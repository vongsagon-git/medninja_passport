const Receipt = require('./Receipt.model')
const { nextReceiptNo } = require('./ReceiptCounter.model')
const { generateReceiptPdf } = require('./receipt.pdf')
const User = require('../user/User.model')
const Activation = require('../activation/Activation.model')

// GET /api/admin/receipts/prefill/:userId
// ดึงข้อมูล user + activation ล่าสุด สำหรับ prefill ฟอร์ม
exports.prefill = async (req, res) => {
  const { userId } = req.params
  const user = await User.findById(userId).lean()
  if (!user) return res.status(404).json({ message: 'ไม่พบนักเรียน' })

  const activations = await Activation.find({ userId })
    .sort({ activatedAt: -1 })
    .limit(10)
    .populate('packageId', 'name title price')
    .lean()

  res.json({
    customer: {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '',
      nationalId: user.nationalId || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      subDistrict: user.subDistrict || '',
      district: user.district || '',
      province: user.province || '',
      postalCode: user.postalCode || ''
    },
    activations: activations.map(a => ({
      _id: a._id,
      packageName: a.packageId?.name || a.packageId?.title || '(ไม่ระบุแพ็กเกจ)',
      packagePrice: a.packageId?.price || 0,
      activatedAt: a.activatedAt,
      expiresAt: a.expiresAt,
      tier: a.tier
    }))
  })
}

// POST /api/admin/receipts
// body: { userId, customer: {...}, items: [...], total, paymentMethod, notes, saveAddressToUser }
exports.create = async (req, res) => {
  const {
    userId, customer, items, total, paymentMethod, notes, saveAddressToUser
  } = req.body || {}

  if (!userId) return res.status(400).json({ message: 'ต้องระบุ userId' })
  if (!customer || !customer.name) return res.status(400).json({ message: 'ต้องระบุชื่อลูกค้า' })
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'ต้องมีรายการอย่างน้อย 1 รายการ' })

  const cleanItems = items
    .map(it => ({ description: String(it.description || '').trim(), amount: Number(it.amount) || 0 }))
    .filter(it => it.description && it.amount > 0)
  if (cleanItems.length === 0) return res.status(400).json({ message: 'รายการไม่ถูกต้อง' })

  const calcTotal = cleanItems.reduce((s, it) => s + it.amount, 0)
  const finalTotal = Number(total) > 0 ? Number(total) : calcTotal

  const user = await User.findById(userId)
  if (!user) return res.status(404).json({ message: 'ไม่พบนักเรียน' })

  // ถ้าติ๊ก saveAddressToUser → บันทึกกลับเข้า profile นักเรียน (ครั้งต่อไปมีข้อมูลพร้อม)
  if (saveAddressToUser) {
    if (customer.nationalId && !user.nationalId) user.nationalId = customer.nationalId
    if (customer.phone) user.phone = customer.phone
    if (customer.address) user.address = customer.address
    if (customer.subDistrict) user.subDistrict = customer.subDistrict
    if (customer.district) user.district = customer.district
    if (customer.province) user.province = customer.province
    if (customer.postalCode) user.postalCode = customer.postalCode
    await user.save()
  }

  const issuedAt = new Date()
  const receiptNo = await nextReceiptNo(issuedAt)

  const issuedByName = [req.user.firstName, req.user.lastName].filter(Boolean).join(' ')
    || req.user.name || req.user.email || 'admin'

  const receipt = await Receipt.create({
    receiptNo,
    userId,
    customer: {
      name: String(customer.name || '').trim(),
      nationalId: String(customer.nationalId || '').trim(),
      email: String(customer.email || '').trim(),
      phone: String(customer.phone || '').trim(),
      address: String(customer.address || '').trim(),
      subDistrict: String(customer.subDistrict || '').trim(),
      district: String(customer.district || '').trim(),
      province: String(customer.province || '').trim(),
      postalCode: String(customer.postalCode || '').trim()
    },
    items: cleanItems,
    total: finalTotal,
    paymentMethod: String(paymentMethod || 'เงินสด').trim(),
    notes: String(notes || '').trim(),
    issuedAt,
    issuedBy: req.user._id,
    issuedByName
  })

  res.json({ ok: true, receipt })
}

// GET /api/admin/receipts?q=&userId=&from=&to=&page=1&limit=20
exports.list = async (req, res) => {
  const { q, userId, from, to, includeVoid } = req.query
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

  const filter = {}
  if (!includeVoid) filter.voided = { $ne: true }
  if (userId) filter.userId = userId
  if (q) {
    filter.$or = [
      { receiptNo: new RegExp(q, 'i') },
      { 'customer.name': new RegExp(q, 'i') },
      { 'customer.nationalId': new RegExp(q, 'i') },
      { 'customer.email': new RegExp(q, 'i') }
    ]
  }
  if (from || to) {
    filter.issuedAt = {}
    if (from) filter.issuedAt.$gte = new Date(from)
    if (to) filter.issuedAt.$lte = new Date(to)
  }

  const [items, total] = await Promise.all([
    Receipt.find(filter)
      .sort({ issuedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Receipt.countDocuments(filter)
  ])

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) })
}

// GET /api/admin/receipts/:id
exports.getOne = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).lean()
  if (!receipt) return res.status(404).json({ message: 'ไม่พบใบเสร็จ' })
  res.json({ receipt })
}

// GET /api/admin/receipts/:id/pdf
exports.pdf = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).lean()
  if (!receipt) return res.status(404).json({ message: 'ไม่พบใบเสร็จ' })
  const buf = await generateReceiptPdf(receipt)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNo}.pdf"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(buf)
}

// PATCH /api/admin/receipts/:id/void
exports.voidReceipt = async (req, res) => {
  const receipt = await Receipt.findById(req.params.id)
  if (!receipt) return res.status(404).json({ message: 'ไม่พบใบเสร็จ' })
  if (receipt.voided) return res.status(400).json({ message: 'ใบเสร็จนี้ถูกยกเลิกแล้ว' })
  receipt.voided = true
  receipt.voidedAt = new Date()
  receipt.voidedBy = req.user._id
  receipt.voidReason = String((req.body || {}).reason || '').trim()
  await receipt.save()
  res.json({ ok: true, receipt })
}

// GET /api/admin/receipts/search-users?q=
// ค้นหานักเรียน (ชื่อ / email / เลขบัตร) เพื่อออกใบเสร็จ
exports.searchUsers = async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (!q || q.length < 2) return res.json({ items: [] })
  const re = new RegExp(q, 'i')
  const items = await User.find({
    $or: [
      { name: re }, { firstName: re }, { lastName: re },
      { email: re }, { phone: re }, { nationalId: re }
    ]
  })
    .select('name firstName lastName email phone nationalId')
    .limit(20)
    .lean()
  res.json({ items })
}
