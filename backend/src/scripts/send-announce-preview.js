const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const COLORS = {
  yellow: { bg: '#FDD835', text: '#795600', emoji: '\u{1F4E2}', label: 'เหลือง' },
  green:  { bg: '#66BB6A', text: '#1B5E20', emoji: '\u{1F389}', label: 'เขียว' },
  red:    { bg: '#EF5350', text: '#FFFFFF', emoji: '\u{1F6A8}', label: 'แดง' },
  purple: { bg: '#AB47BC', text: '#FFFFFF', emoji: '\u{1F49C}', label: 'ม่วง' },
  blue:   { bg: '#42A5F5', text: '#FFFFFF', emoji: '\u{1F4A1}', label: 'ฟ้า' },
}

function makeBubble(colorKey, title, body, imageUrl) {
  const c = COLORS[colorKey]
  const bubble = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: c.emoji, size: 'xl', flex: 0 },
            { type: 'text', text: 'MEDNINJA', weight: 'bold', size: 'xs', color: c.text, flex: 0, margin: 'md' },
            { type: 'text', text: 'ประกาศ', weight: 'bold', size: 'xs', color: c.text, flex: 0, margin: 'sm' },
          ],
          alignItems: 'center',
        },
        {
          type: 'text',
          text: title,
          weight: 'bold',
          size: 'lg',
          color: c.text,
          margin: 'md',
          wrap: true,
        },
      ],
      backgroundColor: c.bg,
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: body,
          wrap: true,
          color: '#E0E0E0',
          size: 'sm',
          lineSpacing: '6px',
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'xl',
          contents: [
            { type: 'text', text: `${c.emoji} ตัวอย่างสี${c.label}`, size: 'xxs', color: '#888888', flex: 1 },
            { type: 'text', text: '14 พ.ค. 2569 \u00B7 15:30', size: 'xxs', color: '#888888', flex: 0 },
          ],
        },
      ],
      backgroundColor: '#2D2D2D',
      paddingAll: '16px',
    },
    styles: { header: { separator: false } },
  }

  if (imageUrl) {
    bubble.hero = {
      type: 'image',
      url: imageUrl,
      size: 'full',
      aspectRatio: '2:1',
      aspectMode: 'cover',
    }
  }

  return bubble
}

// Carousel 1: 5 สี ไม่มีรูป
const carousel1 = {
  type: 'flex',
  altText: 'ตัวอย่าง Flex ประกาศข่าว — 5 สี',
  contents: {
    type: 'carousel',
    contents: [
      makeBubble('yellow', 'แจ้งเปลี่ยนเวลา Live วันอาทิตย์', 'Live Cardio บทที่ 7 เลื่อนจาก 20:00 เป็น 21:00 น. เนื่องจากอาจารย์ติดประชุม\n\nขออภัยในความไม่สะดวกครับ \u{1F64F}'),
      makeBubble('green', 'เปิดคอร์สใหม่ Hematology!', 'เปิดให้ลงทะเบียนแล้ววันนี้! เนื้อหาครบ 33 บท พร้อม Live ทุกสัปดาห์\n\nสมัครได้ที่เว็บ medninja.academy'),
      makeBubble('red', 'แจ้งปิดปรับปรุงระบบชั่วคราว', 'ระบบจะปิดปรับปรุงวันที่ 15 พ.ค. เวลา 02:00-04:00 น.\n\nกรุณาดาวน์โหลดเอกสารที่ต้องการล่วงหน้า'),
      makeBubble('purple', 'ผลสอบ Mock Exam รอบที่ 3', 'ผลสอบออกแล้ว! เข้าไปดูคะแนนและเฉลยได้ที่หน้า Dashboard\n\nน้องๆ ทำได้ดีมากครับ \u{1F4AA}'),
      makeBubble('blue', 'Tips: วิธีดูย้อนหลังอย่างมีประสิทธิภาพ', 'แนะนำให้ดูที่ความเร็ว 1.25x แล้วจด keyword ไว้ทบทวน\n\nอ่านบทสรุปก่อนดูวิดีโอจะเข้าใจเร็วขึ้น'),
    ],
  },
}

// Carousel 2: ตัวอย่างแบบมีรูป (เขียว + แดง)
const carousel2 = {
  type: 'flex',
  altText: 'ตัวอย่าง Flex ประกาศข่าว — แบบมีรูป',
  contents: {
    type: 'carousel',
    contents: [
      makeBubble('green', 'แบบมีรูป (เขียว)', 'ตัวอย่างประกาศที่ใส่รูปภาพ Hero ด้านบน\n\nเหมาะสำหรับประกาศเปิดคอร์สใหม่ หรือโปรโมชั่น', 'https://medninja.b-cdn.net/nl1+2.png'),
      makeBubble('red', 'แบบมีรูป (แดง)', 'ตัวอย่างประกาศแบบ urgent ที่มีรูปประกอบ\n\nใช้สำหรับแจ้งเหตุฉุกเฉินหรือสิ่งสำคัญ', 'https://medninja.b-cdn.net/nl1+2.png'),
      makeBubble('purple', 'แบบมีรูป (ม่วง)', 'ตัวอย่างประกาศแบบ event พิเศษ\n\nใช้สำหรับแจ้งผลสอบ กิจกรรมพิเศษ', 'https://medninja.b-cdn.net/nl1+2.png'),
    ],
  },
}

async function send() {
  const to = 'U2b0de81f0ec73e8561197393683a9e95' // เติ้ล

  for (const msg of [carousel1, carousel2]) {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify({ to, messages: [msg] }),
    })
    const text = await res.text()
    console.log(msg.altText, '→', res.status, text)
  }
}

send()
