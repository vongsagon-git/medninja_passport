const http = require('http')
const app = require('./src/app')
const { connectDB } = require('./src/shared/config/db')
const { initValkey } = require('./src/shared/config/valkey')
const { initSocket } = require('./src/shared/config/socket')

const PORT = process.env.PORT || 5000

async function start() {
  // Connect to MongoDB (passport + lms databases)
  if (process.env.MONGODB_URI_PASSPORT || process.env.MONGODB_URI_LMS || process.env.MONGODB_URI) {
    await connectDB()
  } else {
    console.warn('⚠️  No MongoDB URIs set — running without database (API calls will fail)')
  }

  // Init Valkey connection (viewer tracking, anti-sharing)
  initValkey()

  // HTTP server + Socket.IO
  const httpServer = http.createServer(app)
  initSocket(httpServer)

  httpServer.listen(PORT, () => {
    console.log(`MedNinja API + Socket.IO running on port ${PORT}`)
  })

  // ═══ RAM Monitor — LINE แจ้งเตือนเมื่อ RAM > 80% ═══
  let ramAlertSent = false
  setInterval(() => {
    const mem = process.memoryUsage()
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024)
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024)
    const rssMB = Math.round(mem.rss / 1024 / 1024)

    // เช็คว่าใช้ RSS > 80% ของ 2GB (1600MB)
    if (rssMB > 1600 && !ramAlertSent) {
      ramAlertSent = true
      console.warn(`⚠️ RAM WARNING: RSS ${rssMB}MB / Heap ${usedMB}MB/${totalMB}MB`)

      // ส่ง LINE แจ้ง admin
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
      const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'
      if (token) {
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            to: ADMIN_UID,
            messages: [{
              type: 'text',
              text: `⚠️ MedNinja RAM Warning!\n\nRSS: ${rssMB} MB\nHeap: ${usedMB}/${totalMB} MB\n\nRAM ใช้เกิน 80% — อาจต้องเพิ่ม RAM`
            }]
          })
        }).catch(() => {})
      }
    }

    // reset alert ถ้า RAM ลดลง
    if (rssMB < 1200) ramAlertSent = false
  }, 5 * 60 * 1000) // เช็คทุก 5 นาที

  // ═══ Graceful Shutdown — รอ PDF เสร็จก่อน exit ═══
  process.on('SIGTERM', () => {
    console.log('⏳ SIGTERM received — graceful shutdown...')
    // 1. Block PDF ใหม่
    const pdfCtrl = require('./src/modules/content/pdf.controller')
    pdfCtrl.setShuttingDown(true)

    // 2. หยุดรับ connection ใหม่
    httpServer.close(() => {
      console.log('✅ Server closed — all connections done')
      process.exit(0)
    })

    // 3. รอ PDF ที่กำลังทำอยู่เสร็จ (max 30 วินาที)
    const checkInterval = setInterval(() => {
      const active = pdfCtrl.pdfActiveCount
      console.log(`⏳ Waiting for ${active} PDF downloads...`)
      if (active === 0) {
        clearInterval(checkInterval)
        console.log('✅ All PDFs done — exiting')
        process.exit(0)
      }
    }, 1000)

    // 4. Force exit หลัง 30 วินาที
    setTimeout(() => {
      console.log('⚠️ Force exit after 30s timeout')
      process.exit(1)
    }, 30000)
  })
}

start()
