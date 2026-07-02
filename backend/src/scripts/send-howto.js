const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const f = {
  type: 'flex', altText: 'วิธีเข้าเรียน MedNinja Academy',
  contents: {
    type: 'bubble', size: 'giga',
    body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
      { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
        { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#3b82f6', cornerRadius: '12px',
          contents: [{ type: 'text', text: 'M', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
          justifyContent: 'center', alignItems: 'center' },
        { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
          { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
          { type: 'text', text: 'คำแนะนำสำหรับนักเรียนใหม่', color: '#94a3b8', size: 'xxs', margin: 'sm' }
        ]}
      ]},
      { type: 'separator', color: '#1e3a5f', margin: 'lg' },
      { type: 'text', text: 'วิธีเข้าเรียน', size: 'lg', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'lg' },
      { type: 'separator', color: '#1e3a5f', margin: 'lg' },

      // Step 1
      { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#3b82f6', cornerRadius: '18px',
          contents: [{ type: 'text', text: '1', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'เข้าเว็บไซต์ medninja.academy', size: 'sm', weight: 'bold', color: '#FFFFFF', wrap: true },
          { type: 'text', text: 'ผ่าน browser มือถือหรือคอมพิวเตอร์', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
        ]}
      ]},

      // Step 2
      { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#7c3aed', cornerRadius: '18px',
          contents: [{ type: 'text', text: '2', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'Login เข้าสู่ระบบ', size: 'sm', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: 'Login ID = เลขบัตรประชาชน 13 หลัก\nรหัสผ่าน = วันเดือนปีเกิด พ.ศ. (ddmmyyyy)\nเช่น เกิด 5 ม.ค. 2543 → 05012543', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
        ]}
      ]},

      // Step 3
      { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
        { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#16a34a', cornerRadius: '18px',
          contents: [{ type: 'text', text: '3', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
          justifyContent: 'center', alignItems: 'center', flex: 0 },
        { type: 'box', layout: 'vertical', flex: 1, contents: [
          { type: 'text', text: 'เข้าหน้าเรียน', size: 'sm', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: 'คอร์สของคุณจะอยู่ในส่วน VISA\nกดเข้าไปเลือกบทเรียน แล้วดูวีดีโอได้เลยค่ะ', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
        ]}
      ]},

      { type: 'separator', color: '#1e3a5f', margin: 'xl' },

      // เพิ่มเติม
      { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'lg', contents: [
        { type: 'text', text: 'เพิ่มเติม', size: 'xs', weight: 'bold', color: '#60a5fa' },
        { type: 'text', text: '• ส่งคำถามถึงผู้สอนได้ที่ใต้วีดีโอ (ต้องแอดไลน์ที่ใต้ Passport ก่อน)', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' },
        { type: 'text', text: '• ดูได้ทีละ 1 จอเท่านั้น', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' },
        { type: 'text', text: '• ใช้ Chrome หรือ Safari จะดีที่สุด', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' }
      ]},

      // ดูไม่ได้
      { type: 'box', layout: 'vertical', backgroundColor: '#7f1d1d', cornerRadius: '10px', paddingAll: '14px', margin: 'md', contents: [
        { type: 'text', text: 'กรณีดูวีดีโอไม่ได้', size: 'xs', weight: 'bold', color: '#fca5a5' },
        { type: 'text', text: 'กดปุ่มสีแดง "ดูไม่ได้?" มุมบนขวาของหน้าวีดีโอ ระบบจะตรวจสอบให้อัตโนมัติ', size: 'xs', color: '#fecaca', wrap: true, margin: 'sm' }
      ]},

      { type: 'text', text: 'มีปัญหา ทักแชทหาเราได้เลยค่ะ', size: 'xs', color: '#94a3b8', align: 'center', margin: 'lg' },
      { type: 'text', text: 'MedNinja Academy — ติวสอบใบประกอบวิชาชีพแพทย์', size: 'xxs', color: '#475569', align: 'center', margin: 'md' }
    ]}
  }
}

fetch('https://api.line.me/v2/bot/message/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
  body: JSON.stringify({ to: 'U403f769f329a36f66a2f1f90c100c0bf', messages: [f] })
}).then(r => r.text().then(t => console.log(r.status, t)))
