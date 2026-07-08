let currentVersion = null
let newVersionAvailable = false
let onNewVersion = null // callback เมื่อมี version ใหม่

export function getVersion() { return currentVersion }
export function hasNewVersion() { return newVersionAvailable }

// ลงทะเบียน callback — เรียกจาก App.vue เพื่อแสดง toast
export function onVersionChange(cb) { onNewVersion = cb }

export function startVersionCheck() {
  // Get initial version
  fetch('/api/version', { cache: 'no-store' })
    .then(r => r.json())
    .then(d => { currentVersion = d.version })
    .catch(() => {})

  // Check every 10 seconds — เพื่อ detect update เร็วขึ้น
  // เปลี่ยน interval เป็น 10s (จาก 30s) เพราะ user รอ deploy หลายรอบ
  setInterval(async () => {
    try {
      const r = await fetch('/api/version', { cache: 'no-store' })
      const d = await r.json()
      if (currentVersion && d.version !== currentVersion && !newVersionAvailable) {
        newVersionAvailable = true
        console.log('[VersionCheck] New version detected')

        // ถ้าไม่ได้อยู่หน้า watch/live → reload อัตโนมัติ (1 ครั้ง)
        // delay 2 วิ เพื่อรอ route change เสร็จ
        await new Promise(r => setTimeout(r, 2000))
        const path = window.location.pathname
        const isLive = path.includes('/live/')
        const isWatching = path.includes('/my/watch/') || path.includes('/demo/watch/') || path.includes('/qa/')
        // ป้องกัน reload loop — เช็คว่าเพิ่ง reload มาหรือยัง
        const lastReload = sessionStorage.getItem('_vr')
        const now = Date.now()
        // หน้า live → reload เลยไม่ต้องกด
        if ((isLive || !isWatching) && (!lastReload || now - Number(lastReload) > 60000)) {
          sessionStorage.setItem('_vr', String(now))
          console.log('[VersionCheck] Auto reload' + (isLive ? ' (live)' : ''))
          window.location.href = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_=' + now
          return
        }

        // ถ้าดู VDO ปกติอยู่ → แสดง toast + 5 นาทีไม่ refresh → redirect my home
        if (onNewVersion) onNewVersion()
        setTimeout(() => {
          if (newVersionAvailable) {
            const p = window.location.pathname
            if (p.includes('/my/watch/') || p.includes('/my-cn/watch/') || p.includes('/demo/watch/')) {
              const myHome = window.location.pathname.startsWith('/my-cn') ? '/my-cn' : '/my'
              window.location.href = myHome
            }
          }
        }, 5 * 60 * 1000)
      }
    } catch {
      // silent
    }
  }, 10000)
}

// เรียกจาก router afterEach — ถ้ามี pending version + ออกจากหน้า watch → reload
export function checkPendingReload() {
  if (newVersionAvailable) {
    const path = window.location.pathname
    const isWatching = path.includes('/my/watch/') || path.includes('/live/') || path.includes('/demo/watch/')
    if (!isWatching) {
      window.location.href = window.location.pathname + '?_=' + Date.now()
    }
  }
}
