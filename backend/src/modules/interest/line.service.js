/**
 * LINE Messaging API — Push Flex Message to admin users
 * ใช้ Node.js built-in fetch (Node 18+)
 */

const ADMIN_UIDS = [
  'U2b0de81f0ec73e8561197393683a9e95', // เติ้ล
  'Ue6b6c4daf46d1765f1af71b292fe6fc9', // chertam
  'U398ec17f9dbf5917c2fd83bec6fe24ef'  // ฝน
]

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push'

function buildFlexMessage({ firstName, lastName, university, phone, email, courses, submittedAt }) {
  return {
    type: 'flex',
    altText: `สนใจสมัครเรียน: ${firstName} ${lastName}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'MedNinja — แจ้งเตือนใหม่',
            color: '#FFFFFF',
            size: 'sm',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'มีผู้สนใจสมัครเรียน',
            color: '#94a3b8',
            size: 'xs',
            margin: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'text',
            text: 'ข้อความนี้เห็นเฉพาะ admin',
            size: 'xxs',
            color: '#94a3b8',
            align: 'center'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ชื่อ-สกุล', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: `${firstName} ${lastName}`, size: 'sm', weight: 'bold', flex: 5, wrap: true }
            ]
          },
          { type: 'separator', color: '#e2e8f0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'มหาวิทยาลัย', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: university, size: 'sm', weight: 'bold', flex: 5, wrap: true }
            ]
          },
          { type: 'separator', color: '#e2e8f0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เบอร์โทร', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: phone || '-', size: 'sm', weight: 'bold', flex: 5, wrap: true }
            ]
          },
          { type: 'separator', color: '#e2e8f0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'อีเมล', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: email || '-', size: 'sm', weight: 'bold', flex: 5, wrap: true }
            ]
          },
          { type: 'separator', color: '#e2e8f0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'คอร์สที่สนใจ', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: courses.join(', '), size: 'sm', weight: 'bold', color: '#3b82f6', flex: 5, wrap: true }
            ]
          },
          { type: 'separator', color: '#e2e8f0' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'เวลา', size: 'sm', color: '#64748b', flex: 3 },
              { type: 'text', text: submittedAt, size: 'xs', color: '#64748b', flex: 5 }
            ]
          }
        ]
      }
    }
  }
}

async function notifyAdmins(data) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN not set — skipping notification')
    return
  }

  const message = buildFlexMessage(data)

  const results = await Promise.allSettled(
    ADMIN_UIDS.map(uid =>
      fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ to: uid, messages: [message] })
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          throw new Error(`HTTP ${res.status}: ${body}`)
        }
        return res
      })
    )
  )

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[LINE] Push to ${ADMIN_UIDS[i].slice(0, 8)}... OK`)
    } else {
      console.error(`[LINE] Push to ${ADMIN_UIDS[i].slice(0, 8)}... FAILED:`, r.reason.message)
    }
  })
}

module.exports = { notifyAdmins }
