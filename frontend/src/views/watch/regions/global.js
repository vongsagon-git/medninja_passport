// ═══════════════════════════════════════════════════════════
// Global (Thai) region config for UniversalWatch
// - Thai UI text
// - LINE chat app (bilingual student communication)
// - Bunny CDN default (circuit fallback → Ali)
// - Warroom bucket = GLOBAL, player = bunny (default)
// ═══════════════════════════════════════════════════════════
export default {
  region: 'global',
  locale: 'th',
  countryLabel: 'GLOBAL',
  bucket: 'GLOBAL',

  // Circuit default when /api/system/video-mode is unreachable
  circuitDefault: 'bunny',

  // Routes
  dashboardPath: '/my',
  sectionPathPrefix: '/my/section/',
  watchPathPrefix: '/my/watch/',
  doctorPath: '/doctor',
  doctorInlineModal: true, // opens diag modal inline (Thai flow)

  // LINE popup — required to enter watch
  lineLinkEnabled: true,
  chatApp: {
    name: 'LINE',
    icon: '💚',
    color: '#06c755',
    linkUrlBuilder: (token) => `https://liff.line.me/2009259048-jOiOezxi?token=${encodeURIComponent(token)}`,
    qrPrefix: 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=L&data='
  },

  // Text
  messages: {
    linkPopupTitle: 'กรุณาเชื่อม LINE ก่อนเข้าเรียน',
    linkPopupBody: 'ตั้งแต่เวอร์ชันใหม่ ระบบจะส่งแจ้งเตือนบทเรียนใหม่<br>สื่อการสอน และตารางสอนให้ทาง LINE<br>กรุณาเชื่อม LINE เพื่อเข้าเรียน',
    linkQrCaption: 'Scan QR ด้วย LINE',
    linkButton: 'เชื่อม LINE',
    linkOnceHint: 'เชื่อมครั้งเดียว ใช้ได้ตลอด',
    rotatePrompt: 'แตะเพื่อดูเต็มจอ',
    rotateAction: 'เต็มจอเลย',
    fsShow: 'เต็มจอ',
    fsHide: 'ย่อ',
    // Player states
    placeholderTitle: 'รออัพโหลด',
    placeholderSub: 'วิดีโอนี้ยังไม่พร้อมให้บริการ<br>กรุณาลองใหม่ภายหลัง',
    loadingSub: 'กำลังโหลดวีดีโอ...',
    // Anti-share overlays
    recorderTitle: 'ไม่สามารถเล่นวีดีโอได้',
    recorderBody: 'ตรวจพบส่วนขยาย (Extension) ที่ไม่อนุญาต<br>กรุณาปิด Extension แล้วรีเฟรชหน้านี้',
    recorderRefresh: 'รีเฟรชหน้านี้',
    recorderContact: 'หากยังพบปัญหา ติดต่อแอดมิน',
    replacedTitle: 'มี tab อื่นกำลังเปิดวีดีโออยู่',
    replacedBody: 'ดูได้ทีละ 1 หน้าต่างเท่านั้น',
    replacedActiveLabel: 'Tab ที่กำลังดูอยู่',
    replacedUnknown: 'ไม่ทราบ',
    replacedReclaim: 'กลับมาดูที่นี่',
    replacedCountdown: (n) => `กลับหน้าเรียนอัตโนมัติใน ${n} วินาที`,
    replacedBackNow: 'กลับหน้าเรียนเลย',
    idleTitle: 'หยุดเล่นนานเกินไป',
    idleBody: 'กดปุ่มด้านล่างเพื่อดูต่อ',
    idleResume: 'ดูต่อ',
    idleCountdown: (n) => `ปิดอัตโนมัติใน ${n} วินาที`,
    // Alerts
    zoomAlert: 'ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่',
    devToolAlert: 'ตรวจพบเครื่องมือ Developer Tools — กรุณาปิดแล้วเข้าใหม่',
    // Ask doctor
    askButton: 'ถามคุณหมอ',
    askTitle: 'ถามคุณหมอ',
    askNeedLine: 'กรุณาเชื่อม LINE ก่อน',
    askNeedLineBody: 'คุณหมอจะตอบคำถามผ่านทาง LINE<br>ต้องเชื่อม LINE ก่อนถึงจะรับคำตอบได้',
    askGoLink: 'ไปเชื่อม LINE',
    askSentTitle: 'ส่งคำถามแล้ว!',
    askSentBody: 'คุณหมอจะตอบกลับทาง LINE ของคุณ',
    askAgain: 'ถามอีกข้อ',
    askWatchingLabel: 'กำลังดู:',
    askHint: 'คำตอบจะถูกส่งไปที่ LINE ของคุณ',
    askPlaceholder: 'พิมพ์คำถามที่ต้องการถามคุณหมอ...',
    askSubmit: 'ส่งคำถาม',
    askSubmitLoading: 'กำลังส่ง...',
    // Diag button
    diagButton: 'ตรวจสอบระบบ',
    diagTitle: 'ตรวจสอบระบบการรับชมวีดีโอ',
    diagPass: 'PASS',
    diagFail: 'FAIL',
    diagRunning: 'TESTING...',
    diagRetry: 'ตรวจอีกครั้ง',
    // Browser guard
    guardMobileTitle: 'เปิดใน Browser เพื่อดูวีดีโอ',
    guardMobileBody: 'วีดีโอไม่สามารถเล่นใน LINE ได้',
    guardMobilePlay: 'กดเล่นเลย',
    guardChromeTitle: 'กรุณาใช้ Google Chrome เพื่อดูวีดีโอ',
    guardChromeBody: 'ระบบรองรับเฉพาะ Google Chrome บน Desktop (Windows / macOS / Linux)<br>กรุณาเปิดลิงก์นี้ใน Chrome เพื่อดูวีดีโอ',
    copyLink: 'คัดลอกลิงก์',
    copyLinkDone: 'คัดลอกแล้ว!',
    downloadChrome: 'ดาวน์โหลด Chrome',
    goSite: 'เข้าเว็บ',
    goSiteUrl: 'https://medninja.academy'
  }
}
