const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const TITLE_UID = 'U2b0de81f0ec73e8561197393683a9e95'

const flex = {
  type: 'flex', altText: 'MEQ Intensive — 27 ชั่วโมง',
  contents: {
    type: 'bubble', size: 'giga',
    hero: { type: 'image', url: 'https://medninja.b-cdn.net/MEQ.jpg', size: 'full', aspectRatio: '16:9', aspectMode: 'cover',
      action: { type: 'uri', uri: 'https://medninja.academy/' } },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
      { type: 'text', text: 'MEQ Intensive', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center' },
      { type: 'text', text: 'คอร์สติวเข้ม NL Step 3 — 27 ชั่วโมง', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold', margin: 'sm' },
      { type: 'text', text: 'สอนโดย หมอเฌอแตม', size: 'xs', color: '#94a3b8', align: 'center', margin: 'xs' },
      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // Info box
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', contents: [
        { type: 'text', text: 'แพทย์ผู้มีประสบการณ์สอนน้องสอบผ่านหลายรุ่น', size: 'sm', weight: 'bold', color: '#93c5fd', wrap: true },
        { type: 'text', text: 'เทคนิคการเขียนตอบอย่างเป็นระบบ ตรงประเด็น เข้าใจแนวข้อสอบจริง', size: 'xs', color: '#60a5fa', wrap: true, margin: 'sm' }
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },
      { type: 'text', text: 'สิ่งที่คุณจะได้จากคอร์สนี้', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },

      // 1
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#064e3b', cornerRadius: '15px',
          contents: [{ type: 'text', text: '✦', size: 'sm', align: 'center', gravity: 'center', color: '#34d399' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'วิธีคิดและเขียนตอบ MEQ ครบทุกขั้นตอน', size: 'xs', weight: 'bold', color: '#34d399', wrap: true },
          { type: 'text', text: 'ซักประวัติ ตรวจร่างกาย วินิจฉัย แนวทางรักษา', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      // 2
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#7f1d1d', cornerRadius: '15px',
          contents: [{ type: 'text', text: '●', size: 'xxs', align: 'center', gravity: 'center', color: '#fca5a5' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'ฝึกโจทย์จากเคสจริง + ข้อสอบเก่า', size: 'xs', weight: 'bold', color: '#fca5a5', wrap: true },
          { type: 'text', text: 'Real-case scenarios และแนวข้อสอบที่ออกบ่อย', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      // 3
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#2e1065', cornerRadius: '15px',
          contents: [{ type: 'text', text: '★', size: 'sm', align: 'center', gravity: 'center', color: '#c4b5fd' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'เทคนิคเขียนให้ครบ คม ได้คะแนนเต็มจุด', size: 'xs', weight: 'bold', color: '#c4b5fd', wrap: true },
          { type: 'text', text: 'ทบทวนโรคสำคัญที่มักออกสอบ', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },
      { type: 'text', text: 'เนื้อหาครบทุก Ward', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },

      // Syllabus
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'md', spacing: 'sm', contents: [
        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Medicine', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Surgery', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Pediatrics', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' OBGYN', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
        { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Trauma & Orthopedics', size: 'xxs', color: '#cbd5e1', flex: 1 }] }
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // ราคา
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'lg', contents: [
        { type: 'text', text: 'ราคา', size: 'xxs', color: '#64748b', align: 'center' },
        { type: 'text', text: '34,900 บาท', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'xs' },
        { type: 'text', text: '27 ชั่วโมง · สอนโดย หมอเฌอแตม', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold', margin: 'sm' }
      ]}
    ]},
    footer: { type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
      { type: 'text', text: 'MedNinja Academy', size: 'xxs', color: '#475569', align: 'center' }
    ]}
  }
}

async function send() {
  console.log('Sending MEQ flex to เติ้ล...')
  const resp = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ to: TITLE_UID, messages: [flex] })
  })
  console.log(`Status: ${resp.status}`, await resp.text())
}
module.exports = { flex }
if (require.main === module) send().catch(console.error)
