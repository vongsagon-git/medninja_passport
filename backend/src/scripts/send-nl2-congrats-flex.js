const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const TITLE_UID = 'U2b0de81f0ec73e8561197393683a9e95'

const flex = {
  type: 'flex', altText: '🎉 ยินดีกับผู้สอบผ่าน NL2 — MedNinja Academy',
  contents: {
    type: 'bubble', size: 'giga',
    hero: {
      type: 'image',
      url: 'https://medninja.b-cdn.net/NL2.png',
      size: 'full',
      aspectRatio: '16:9',
      aspectMode: 'cover',
      action: { type: 'uri', uri: 'https://medninja.academy/' }
    },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [

      // ===== ส่วนแสดงความยินดี =====
      { type: 'text', text: '🎉', size: 'xxl', align: 'center' },
      { type: 'text', text: 'ขอแสดงความยินดี', size: 'xxl', weight: 'bold', color: '#fbbf24', align: 'center', margin: 'sm' },
      { type: 'text', text: 'กับผู้สอบผ่าน NL2 ทุกท่าน', size: 'md', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'xs' },

      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'lg', contents: [
        { type: 'text', text: 'ทุกคนทำได้ดีมากครับ 💪', size: 'sm', color: '#34d399', align: 'center', weight: 'bold' },
        { type: 'text', text: 'ความพยายามของทุกคนคือสิ่งที่มีค่าที่สุด', size: 'xs', color: '#94a3b8', align: 'center', margin: 'sm', wrap: true }
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // ===== ส่วนโปรโมต =====
      { type: 'text', text: 'สำหรับคนที่กำลังเตรียมตัว', size: 'sm', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'md' },

      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'md', contents: [
        { type: 'text', text: '📚 เปิดรับสมัครแล้ววันนี้', size: 'md', weight: 'bold', color: '#60a5fa', align: 'center' },

        { type: 'separator', color: '#1e3a5f', margin: 'md' },

        // NL2
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#1e3a8a', cornerRadius: '15px',
            contents: [{ type: 'text', text: '✦', size: 'sm', align: 'center', gravity: 'center', color: '#60a5fa' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, justifyContent: 'center', contents: [
            { type: 'text', text: 'คอร์ส NL2', size: 'sm', weight: 'bold', color: '#60a5fa', wrap: true },
            { type: 'text', text: 'เตรียมพร้อมสอบ NL Step 2', size: 'xxs', color: '#94a3b8', wrap: true }
          ]}
        ]},

        // NL1+2
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#064e3b', cornerRadius: '15px',
            contents: [{ type: 'text', text: '★', size: 'sm', align: 'center', gravity: 'center', color: '#34d399' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, justifyContent: 'center', contents: [
            { type: 'text', text: 'NL MASTERY 1+2 Integrated', size: 'sm', weight: 'bold', color: '#34d399', wrap: true },
            { type: 'text', text: 'ระบบใหม่ 2570 · สอนแบบ Integrated ข้ามสาขา', size: 'xxs', color: '#94a3b8', wrap: true },
            { type: 'text', text: 'ออกแบบเฉพาะสำหรับข้อสอบระบบใหม่', size: 'xxs', color: '#94a3b8', wrap: true }
          ]}
        ]}
      ]},

      // UPDATE badge
      { type: 'box', layout: 'vertical', backgroundColor: '#7f1d1d', cornerRadius: '20px', paddingAll: '8px', margin: 'lg',
        paddingStart: '16px', paddingEnd: '16px', alignItems: 'center', contents: [
        { type: 'text', text: '🔥 UPDATE เนื้อหาล่าสุด', size: 'sm', weight: 'bold', color: '#fca5a5', align: 'center' }
      ]},

      { type: 'text', text: 'เนื้อหาปรับปรุงใหม่ ครอบคลุมแนวข้อสอบล่าสุด', size: 'xs', color: '#94a3b8', align: 'center', margin: 'sm', wrap: true }

    ]},
    footer: { type: 'box', layout: 'vertical', paddingAll: '14px', backgroundColor: '#0f172a', spacing: 'sm', contents: [
      { type: 'button', style: 'primary', color: '#3b82f6', height: 'sm',
        action: { type: 'uri', label: 'ดูรายละเอียดคอร์ส', uri: 'https://medninja.academy/' } },
      { type: 'text', text: 'MedNinja Academy', size: 'xxs', color: '#475569', align: 'center', margin: 'md' }
    ]}
  }
}

async function broadcast() {
  console.log('Broadcasting NL2 congrats flex to ALL followers...')
  const resp = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ messages: [flex] })
  })
  console.log(`Status: ${resp.status}`, await resp.text())
}

module.exports = { flex }
if (require.main === module) broadcast().catch(console.error)
