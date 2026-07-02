/**
 * Socket.IO — Realtime Monitor
 * JWT auth middleware + export getIO()
 */
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../../modules/user/User.model')

let io = null

function initSocket(httpServer) {
  // CORS — รองรับ Synapse + feature apps เชื่อม Socket.IO ข้าม domain
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.SYNAPSE_URL || 'https://synapse.medninja.academy',
    process.env.MEQEX_URL || 'https://meqex.medninja.academy',
    process.env.NLEX_URL || 'https://nlex.medninja.academy'
  ]
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
        cb(null, false)
      },
      credentials: true
    }
  })

  // JWT auth middleware — ทุก connection ต้องมี token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('กรุณาเข้าสู่ระบบ'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password').lean()
      if (!user) return next(new Error('ไม่พบผู้ใช้'))

      socket.user = user
      socket.userId = user._id.toString()
      socket.sessionId = decoded.sid || null
      next()
    } catch {
      next(new Error('Token ไม่ถูกต้อง'))
    }
  })

  // Register handlers
  io.on('connection', (socket) => {
    const { registerStudentSocket } = require('../../modules/content/content.socket')
    registerStudentSocket(io, socket)
  })

  console.log('[Socket.IO] initialized')
  return io
}

function getIO() { return io }

module.exports = { initSocket, getIO }
