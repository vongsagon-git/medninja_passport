// ═══════════════════════════════════════════════════════════
// CN (China) region config for UniversalWatch
// - Thai UI text (นักเรียนไทยที่อยู่จีน — ไม่ใช่คนจีนแท้)
// - WeChat communication (LINE ใช้ในจีนไม่ได้ — GFW block)
// - Ali VOD default (Bunny CDN โดน GFW throttle บ่อย)
// - Warroom bucket = CN, player = aliplayer
// ═══════════════════════════════════════════════════════════
export default {
  region: 'cn',
  locale: 'th',
  countryLabel: 'CN',
  bucket: 'CN',

  // Circuit default when /api/system/video-mode is unreachable
  circuitDefault: 'ali',

  // Routes
  dashboardPath: '/my-cn',
  sectionPathPrefix: '/my-cn/section/',
  watchPathPrefix: '/my-cn/watch/',
  doctorPath: '/doctor-cn',
  doctorInlineModal: false, // CN opens /doctor-cn full page (Ali-specific diag)

  // ⚠️ LINE popup DISABLED for CN — LINE ใช้ในจีนไม่ได้
  lineLinkEnabled: false,
  chatApp: {
    name: 'WeChat',
    icon: '🇨🇳',
    color: '#07c160',
    wechatId: 'MedNinja_TH',
    // stub — CN region ไม่ใช้ QR ใน UniversalWatch (นักเรียนไปเพจ WeChat ที่ /my-cn เอง)
    linkUrlBuilder: () => 'https://medninja.academy',
    qrPrefix: 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&ecc=L&data='
  },

  // Text (Thai — ตรงกับ WatchCnPage เดิม)
  messages: {
    linkPopupTitle: '', // ไม่แสดง popup ที่ CN
    linkPopupBody: '',
    linkQrCaption: '',
    linkButton: '',
    linkOnceHint: '',
    rotatePrompt: 'แตะเพื่อดูเต็มจอ',
    rotateAction: 'เต็มจอเลย',
    fsShow: 'เต็มจอ',
    fsHide: 'ย่อ',
    placeholderTitle: 'รออัพโหลด',
    placeholderSub: '🇨🇳 วิดีโอนี้ยังไม่พร้อมใช้งานสำหรับผู้ใช้ในประเทศจีน<br>กรุณาติดต่อ admin เพื่ออัพโหลด',
    loadingSub: 'กำลังโหลดวีดีโอ...',
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
    zoomAlert: 'ตรวจพบการ Zoom — กรุณาตั้ง Zoom เป็น 100% (Ctrl+0) แล้วเข้าใหม่',
    devToolAlert: 'ตรวจพบเครื่องมือ Developer Tools — กรุณาปิดแล้วเข้าใหม่',
    // CN → WeChat instead of LINE
    askButton: 'ส่งคำถามทาง WeChat',
    askTitle: 'ส่งคำถามทาง WeChat',
    askNeedLine: '🇨🇳 สำหรับผู้ใช้ในประเทศจีน',
    askNeedLineBody: `กรุณาส่งคำถามทาง WeChat\n\nWeChat ID: MedNinja_TH\n(หรือแสกน QR ที่หน้า /my-cn)`,
    askGoLink: 'ไปหน้า WeChat',
    askSentTitle: 'ส่งคำถามแล้ว!',
    askSentBody: 'คุณหมอจะตอบกลับทาง WeChat ของคุณ',
    askAgain: 'ถามอีกข้อ',
    askWatchingLabel: 'กำลังดู:',
    askHint: 'คำตอบจะถูกส่งไปที่ WeChat ของคุณ',
    askPlaceholder: 'พิมพ์คำถามที่ต้องการถาม...',
    askSubmit: 'ส่งคำถาม',
    askSubmitLoading: 'กำลังส่ง...',
    diagButton: 'ตรวจสอบระบบ',
    diagTitle: 'ตรวจสอบระบบการรับชมวีดีโอ',
    diagPass: 'PASS',
    diagFail: 'FAIL',
    diagRunning: 'TESTING...',
    diagRetry: 'ตรวจอีกครั้ง',
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
