const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const TITLE_UID = 'U2b0de81f0ec73e8561197393683a9e95'

const flex = {
  type: 'flex', altText: 'OSCE Mastery — 15 ชั่วโมง',
  contents: {
    type: 'bubble', size: 'giga',
    hero: { type: 'image', url: 'https://medninja.b-cdn.net/OSCE.png', size: 'full', aspectRatio: '16:9', aspectMode: 'cover',
      action: { type: 'uri', uri: 'https://medninja.academy/' } },
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
      { type: 'text', text: 'OSCE Mastery', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center' },
      { type: 'text', text: 'เรียนตัวต่อตัวกับอาจารย์ — 15 ชั่วโมง', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold', margin: 'sm' },
      { type: 'text', text: 'ซักประวัติ & ตรวจร่างกาย ครบทุกระบบ', size: 'xs', color: '#94a3b8', align: 'center', margin: 'xs' },
      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // Info box
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', contents: [
        { type: 'text', text: 'สอน History Taking & Physical Examination', size: 'sm', weight: 'bold', color: '#93c5fd', wrap: true },
        { type: 'text', text: 'ครบทุกระบบ ฝึกตามรูปแบบ OSCE station จริง', size: 'xs', color: '#60a5fa', wrap: true, margin: 'sm' }
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },
      { type: 'text', text: 'เนื้อหาคอร์ส', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },

      // 1
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#064e3b', cornerRadius: '15px',
          contents: [{ type: 'text', text: '✦', size: 'sm', align: 'center', gravity: 'center', color: '#34d399' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'ซักประวัติ & ตรวจร่างกาย ครบทุกระบบ', size: 'xs', weight: 'bold', color: '#34d399', wrap: true },
          { type: 'text', text: 'History taking + Physical examination', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      // 2
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#1e3a5f', cornerRadius: '15px',
          contents: [{ type: 'text', text: '↺', size: 'sm', align: 'center', gravity: 'center', color: '#93c5fd' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'ฝึกตาม OSCE Station จริง', size: 'xs', weight: 'bold', color: '#93c5fd', wrap: true },
          { type: 'text', text: 'Cardio, Resp, GI, Neuro, MSK, Endo, OBGYN, Peds, Psych', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      // 3
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#7f1d1d', cornerRadius: '15px',
          contents: [{ type: 'text', text: '●', size: 'xxs', align: 'center', gravity: 'center', color: '#fca5a5' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'เก็งข้อสอบที่ออกบ่อย', size: 'xs', weight: 'bold', color: '#fca5a5', wrap: true },
          { type: 'text', text: 'Pattern คำถามที่ examiner ชอบ', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      // 4
      { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#2e1065', cornerRadius: '15px',
          contents: [{ type: 'text', text: '★', size: 'sm', align: 'center', gravity: 'center', color: '#c4b5fd' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'Mindset ของ Examiner', size: 'xs', weight: 'bold', color: '#c4b5fd', wrap: true },
          { type: 'text', text: 'พูดอะไร ทำอะไร ถึงได้คะแนน', size: 'xxs', color: '#94a3b8', wrap: true }
        ]}
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // ราคา
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'lg', contents: [
        { type: 'text', text: 'ราคา', size: 'xxs', color: '#64748b', align: 'center' },
        { type: 'text', text: '27,900 บาท', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'xs' },
        { type: 'text', text: '15 ชั่วโมง · เรียนตัวต่อตัว', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold', margin: 'sm' }
      ]}
    ]},
    footer: { type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
      { type: 'text', text: 'MedNinja Academy', size: 'xxs', color: '#475569', align: 'center' }
    ]}
  }
}

async function send() {
  console.log('Sending OSCE flex to เติ้ล...')
  const resp = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ to: TITLE_UID, messages: [flex] })
  })
  console.log(`Status: ${resp.status}`, await resp.text())
}
module.exports = { flex }
if (require.main === module) send().catch(console.error)
