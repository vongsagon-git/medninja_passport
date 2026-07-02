const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ message: messages.join(', ') })
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'ข้อมูลซ้ำในระบบ' })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' })
  }

  const statusCode = err.statusCode || 500
  // In production, hide internal error messages from 500 responses
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    : err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  res.status(statusCode).json({ message })
}

module.exports = errorHandler
