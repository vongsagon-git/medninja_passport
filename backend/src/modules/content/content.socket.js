/**
 * Socket.IO Handlers — Realtime ล้วน ไม่ผ่าน DB
 * Anti-share + Monitor ทั้งหมดอยู่ใน memory
 */
const ClientLog = require('./ClientLog.model')
const Activation = require('../activation/Activation.model')
const Package = require('./Package.model')
const { logActivity } = require('../activity/activity.service')

// ═══ In-memory state (ไม่ใช้ DB) ═══
const viewers = new Map()       // userId → viewer data
const blockedTabs = new Map()   // `${userId}:${socketId}` → blocked info
// (NLEX notify ย้ายไป nlex.controller.js แทน — ไม่ส่งจาก socket)

function getViewersList() {
  const result = []
  for (const [userId, v] of viewers) {
    // นับ + รวบรวม blocked tabs detail
    let blocked = 0
    const blockedList = []
    for (const [key, info] of blockedTabs) {
      if (key.startsWith(userId + ':')) {
        blocked++
        blockedList.push({ os: info.os, browser: info.browser, ip: info.ip || '?', isp: info.isp || '' })
      }
    }
    result.push({
      userId,
      userName: v.userName,
      userEmail: v.userEmail,
      videoTitle: v.videoTitle,
      sectionName: v.sectionName,
      os: v.os,
      browser: v.browser,
      ip: v.ip || '?',
      isp: v.isp || '',
      city: v.city || '',
      country: v.country || '',
      currentTime: v.currentTime || 0,
      videoDuration: v.videoDuration || 0,
      isPlaying: v.isPlaying || false,
      playerError: v.playerError || '',
      appVersion: v.appVersion || '',
      liveId: v.liveId || '',
      contentType: v.contentType || 'video',
      drmMode: v.drmMode || '',
      blockedTabs: blocked,
      blockedList,
      totalTabs: 1 + blocked,
      status: 'watching'
    })
  }
  return result
}

function broadcastViewers(io) {
  io.to('admin').emit('viewers:update', getViewersList())
}

function registerStudentSocket(io, socket) {
  const userId = socket.userId
  const user = socket.user
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || ''
  const userEmail = user.email || ''

  // ═══ Admin ═══
  if (user.role === 'admin') {
    socket.on('admin:join', () => {
      socket.join('admin')
      // ส่ง viewers ทั้งหมดทันที
      socket.emit('viewers:update', getViewersList())
    })

    socket.on('admin:kick', ({ userId: targetId }) => {
      // ส่ง kicked ไปหานักเรียนทันที
      io.to(`watch:${targetId}`).emit('kicked')
      // ลบจาก memory
      viewers.delete(targetId)
      // ลบ blocked tabs ของ user นี้
      for (const key of blockedTabs.keys()) {
        if (key.startsWith(targetId + ':')) blockedTabs.delete(key)
      }
      broadcastViewers(io)
    })
  }

  // ดึง IP จาก socket handshake
  const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() || socket.handshake.address || '?'

  // ═══ Student watch:start ═══
  socket.on('watch:start', async (data) => {
    const { sectionId, videoIndex, sectionName, videoTitle, tabId, os, browser, currentTime, duration, isPlaying, appVersion, liveId, contentType, drmMode } = data || {}

    // ตรวจสิทธิ์ — ต้องมี activation สำหรับ section นี้ (admin bypass, live bypass)
    if (user.role !== 'admin' && contentType !== 'live' && sectionId) {
      try {
        const activations = await Activation.find({
          userId, isActive: true, expiresAt: { $gt: new Date() }
        }).select('packageId').lean()
        const hasAccess = activations.length > 0 && await Package.exists({
          _id: { $in: activations.map(a => a.packageId) },
          sections: sectionId
        })
        if (!hasAccess) return // ไม่มีสิทธิ์ → ไม่ register viewer
      } catch {}
    }

    // ดึง ISP/ประเทศ จาก IP (ครั้งเดียวตอน connect)
    let isp = '', city = '', country = ''
    try {
      const geo = await fetch(`http://ip-api.com/json/${clientIp}?fields=country,city,isp`)
      if (geo.ok) { const g = await geo.json(); isp = g.isp || ''; city = g.city || ''; country = g.country || '' }
    } catch {}

    // Anti-share: "เปิดหลังสุดชนะ"
    const existing = viewers.get(userId)
    if (existing && existing.socketId !== socket.id) {
      io.to(existing.socketId).emit('replaced', { sectionName, videoTitle, os, browser })
      blockedTabs.set(`${userId}:${existing.socketId}`, {
        socketId: existing.socketId,
        videoTitle: existing.videoTitle,
        os: existing.os,
        browser: existing.browser,
        ip: existing.ip,
        isp: existing.isp
      })
    }

    // Socket ใหม่ชนะ
    viewers.set(userId, {
      socketId: socket.id,
      tabId: tabId || socket.id,
      userName, userEmail,
      sectionId, videoIndex, sectionName,
      videoTitle: videoTitle || '',
      os: os || '', browser: browser || '',
      ip: clientIp, isp, city, country,
      currentTime: currentTime || 0, videoDuration: duration || 0,
      isPlaying: !!isPlaying, playerError: '',
      appVersion: appVersion || '',
      liveId: liveId || '',
      contentType: contentType || 'video',
      drmMode: drmMode || 'protection'
    })
    socket.join(`watch:${userId}`)

    // Activity Log — เริ่มดูคลิป
    logActivity({
      userId, userName, userEmail,
      action: contentType === 'live' ? 'live_join' : 'watch_start',
      sectionId, sectionName, videoIndex, videoTitle,
      ip: clientIp, os: os || '', browser: browser || '',
      userAgent: socket.handshake.headers['user-agent'] || ''
    })

    // NLEX notify ย้ายไป nlex.controller.js (listExams) กัน spam

    broadcastViewers(io)
  })

  // helper: เช็คว่า socket นี้เป็น active (ไม่ใช่ tab ที่ถูก replaced)
  const isActive = () => { const v = viewers.get(userId); return v && v.socketId === socket.id }

  // ═══ Video state — ทุก 3 วิ ═══
  socket.on('video:state', (data) => {
    if (!isActive()) return
    const { currentTime, duration, isPlaying, videoTitle } = data || {}
    const v = viewers.get(userId)
    if (v) {
      v.currentTime = currentTime || 0
      v.videoDuration = duration || 0
      v.isPlaying = !!isPlaying
      v.appVersion = data?.appVersion || v.appVersion || ''
      if (data?.drmMode) v.drmMode = data.drmMode
      if (videoTitle) {
        const changed = videoTitle !== v.videoTitle
        v.videoTitle = videoTitle
        // แจ้ง admin ทุกครั้งที่ได้ videoTitle (NLEX state update)
        if (changed) io.to('admin').emit('viewer:change', { userId, sectionName: v.sectionName, videoTitle })
      }

      // บันทึก watch progress ทุก 30 วินาที (ไม่ต้องทุก 3 วิ เพื่อลด DB write)
      const now = Date.now()
      if (currentTime > 0 && v.sectionId && (!v._lastProgressSave || now - v._lastProgressSave > 30000)) {
        v._lastProgressSave = now
        const WatchProgress = require('./WatchProgress.model')
        WatchProgress.findOneAndUpdate(
          { userId, sectionId: v.sectionId, videoIndex: v.videoIndex || 0 },
          { $set: { currentTime: Math.round(currentTime) } },
          { upsert: true }
        ).catch(() => {})
      }
    }
    io.to('admin').emit('viewer:time', { userId, currentTime: currentTime || 0, duration: duration || 0, isPlaying: !!isPlaying })
  })

  // ═══ Video events ═══
  socket.on('video:play', () => {
    if (!isActive()) return
    const v = viewers.get(userId)
    if (v) v.isPlaying = true
    io.to('admin').emit('viewer:time', { userId, isPlaying: true })
  })

  socket.on('video:pause', () => {
    if (!isActive()) return
    const v = viewers.get(userId)
    if (v) v.isPlaying = false
    io.to('admin').emit('viewer:time', { userId, isPlaying: false })
  })

  socket.on('video:ended', () => {
    if (!isActive()) return
    const v = viewers.get(userId)
    if (v) v.isPlaying = false
    io.to('admin').emit('viewer:time', { userId, isPlaying: false })
  })

  socket.on('video:error', (data) => {
    if (!isActive()) return
    const error = data?.error || 'unknown'
    const v = viewers.get(userId)
    if (v) v.playerError = error
    io.to('admin').emit('viewers:alert', { type: 'video_error', userName, userEmail, error, userId })
  })

  socket.on('video:change', (data) => {
    if (!isActive()) return
    const { sectionId, videoIndex, sectionName, videoTitle } = data || {}
    const v = viewers.get(userId)

    // log watch_end สำหรับ video เก่า (คำนวณ duration จาก currentTime)
    if (v && v.videoTitle) {
      logActivity({
        userId, userName, userEmail,
        action: 'watch_end',
        sectionId: v.sectionId, sectionName: v.sectionName,
        videoIndex: v.videoIndex, videoTitle: v.videoTitle,
        watchDuration: Math.round(v.currentTime || 0),
        ip: v.ip, os: v.os, browser: v.browser,
        userAgent: socket.handshake.headers['user-agent'] || ''
      })
    }

    if (v) {
      v.sectionId = sectionId
      v.videoIndex = videoIndex
      v.sectionName = sectionName
      v.videoTitle = videoTitle
      v.currentTime = 0
      v.videoDuration = 0
      v.isPlaying = false
      v.playerError = ''
    }

    // log video_change สำหรับ video ใหม่
    logActivity({
      userId, userName, userEmail,
      action: 'video_change',
      sectionId, sectionName, videoIndex, videoTitle,
      ip: clientIp, os: v?.os || '', browser: v?.browser || '',
      userAgent: socket.handshake.headers['user-agent'] || ''
    })

    io.to('admin').emit('viewer:change', { userId, sectionId, videoIndex, sectionName, videoTitle })
  })

  // ═══ DevTools ═══
  socket.on('devtools', () => {
    // เก็บ log ใน DB (อันเดียวที่ยังใช้ DB — สำหรับประวัติ)
    ClientLog.create({
      userId, userName, userEmail,
      type: 'devtools', message: 'เปิด DevTools',
      os: viewers.get(userId)?.os || '',
      browser: viewers.get(userId)?.browser || ''
    }).catch(() => {})
    io.to('admin').emit('viewers:alert', { type: 'devtools', userName, userEmail, userId })
  })

  // ═══ Stream Recorder / HLS Downloader detection ═══
  socket.on('recorder', (data) => {
    const method = data?.method || 'unknown'
    const extension = data?.extension || 'unknown'
    ClientLog.create({
      userId, userName, userEmail,
      type: 'recorder', message: `ตรวจพบ ${extension} (${method})`,
      os: viewers.get(userId)?.os || '',
      browser: viewers.get(userId)?.browser || ''
    }).catch(() => {})
    io.to('admin').emit('viewers:alert', {
      type: 'recorder', userName, userEmail, userId,
      extension, method
    })
    // LINE แจ้งเตือน admin ทันที
    try {
      const { pushMessage } = require('../line/line.webhook.service')
      const ADMIN_LINE_UIDS = ['U2b0de81f0ec73e8561197393683a9e95']
      const flex = {
        type: 'flex', altText: `⚠️ ตรวจพบ ${extension}`,
        contents: {
          type: 'bubble', size: 'kilo',
          header: { type: 'box', layout: 'vertical', backgroundColor: '#DC2626', paddingAll: '12px',
            contents: [{ type: 'text', text: '⚠️ RECORDER DETECTED', color: '#FFFFFF', weight: 'bold', size: 'sm', align: 'center' }]
          },
          body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
            contents: [
              { type: 'text', text: userName || 'Unknown', weight: 'bold', size: 'md', wrap: true },
              { type: 'text', text: userEmail || '-', size: 'xs', color: '#888888' },
              { type: 'separator', margin: 'md' },
              { type: 'box', layout: 'horizontal', margin: 'md', contents: [
                { type: 'text', text: 'Extension', size: 'xs', color: '#888888', flex: 3 },
                { type: 'text', text: extension, size: 'xs', weight: 'bold', flex: 5, align: 'end', color: '#DC2626' }
              ]},
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'Method', size: 'xs', color: '#888888', flex: 3 },
                { type: 'text', text: method, size: 'xs', flex: 5, align: 'end' }
              ]},
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'Browser', size: 'xs', color: '#888888', flex: 3 },
                { type: 'text', text: viewers.get(userId)?.browser || '-', size: 'xs', flex: 5, align: 'end' }
              ]}
            ]
          }
        }
      }
      ADMIN_LINE_UIDS.forEach(uid => pushMessage(uid, [flex]).catch(() => {}))
    } catch (e) { /* ignore LINE error */ }
  })

  // ═══ Disconnect ═══
  socket.on('disconnect', () => {
    const v = viewers.get(userId)
    if (v && v.socketId === socket.id) {
      // log watch_end ก่อนลบ viewer
      if (v.videoTitle) {
        logActivity({
          userId, userName, userEmail,
          action: 'watch_end',
          sectionId: v.sectionId, sectionName: v.sectionName,
          videoIndex: v.videoIndex, videoTitle: v.videoTitle,
          watchDuration: Math.round(v.currentTime || 0),
          ip: v.ip, os: v.os, browser: v.browser,
          userAgent: socket.handshake.headers['user-agent'] || ''
        })
      }
      // active tab disconnect → ลบ viewer
      viewers.delete(userId)
    }
    // blocked tab disconnect → ลบหลัง 30 วิ (ให้ admin เห็นว่าเคยเปิดหลาย tab)
    const blockedKey = `${userId}:${socket.id}`
    if (blockedTabs.has(blockedKey)) {
      setTimeout(() => {
        blockedTabs.delete(blockedKey)
        broadcastViewers(io)
      }, 30000)
    }
    broadcastViewers(io)
  })
}

module.exports = { registerStudentSocket, broadcastViewers, getViewersList }
