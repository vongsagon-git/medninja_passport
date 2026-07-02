const multer = require('multer')
const { scanIdCard } = require('./ocr.service')

// ─── Multer: memory storage (ไม่เขียน disk — DO App Platform) ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'))
  }
}).single('image')

/**
 * POST /api/passport/scan
 * รับรูปบัตร → AI Vision OCR → return ข้อมูลที่สกัดได้
 * (ไม่ check อะไรอย่างอื่น — ปล่อยให้ submit endpoint จัดการ)
 */
exports.scan = (req, res, next) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'ไฟล์ใหญ่เกิน 5MB' })
        }
        return res.status(400).json({ message: err.message })
      }

      if (!req.file) {
        return res.status(400).json({ message: 'กรุณาอัพโหลดรูปภาพ' })
      }

      const mimeType = req.file.mimetype || 'image/jpeg'
      const result = await scanIdCard(req.file.buffer, mimeType)

      if (!result.success) {
        return res.status(422).json({
          success: false,
          message: result.error,
          data: result.data || undefined,
          raw: result.raw
        })
      }

      res.json({
        success: true,
        needsManualNid: result.needsManualNid || false,
        data: result.data,
        idCardImage: result.idCardImage,
        ocrRaw: result.raw
      })
    } catch (error) {
      console.error('Passport OCR scan error:', error.message)
      next(error)
    }
  })
}
