require('dotenv').config({ path: '../.env' })
const { broadcastMessage } = require('./src/modules/line/line.webhook.service')

const flexMsg = {
  type: 'flex',
  altText: '🏆 ผู้ชนะ DDx ARENA เมษายน — Emmie!',
  contents: {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        { type: 'text', text: 'MEDNINJA', weight: 'bold', size: 'md', color: '#a855f7' },
        { type: 'text', text: 'DDx', weight: 'bold', size: 'md', color: '#f97316', flex: 0 },
        { type: 'text', text: 'ARENA', weight: 'bold', size: 'md', color: '#FFFFFF', flex: 0 }
      ],
      spacing: 'sm',
      backgroundColor: '#1e1b4b',
      paddingAll: '16px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: '24px',
      backgroundColor: '#0f172a',
      contents: [
        {
          type: 'text',
          text: '🏆 ผู้ชนะประจำเดือน',
          size: 'sm',
          color: '#fbbf24',
          weight: 'bold',
          align: 'center'
        },
        {
          type: 'text',
          text: 'เมษายน 2569',
          size: 'xs',
          color: '#94a3b8',
          align: 'center'
        },
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1e293b',
          cornerRadius: '16px',
          paddingAll: '20px',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '🎉',
              size: '3xl',
              align: 'center'
            },
            {
              type: 'text',
              text: 'Emmie',
              size: 'xxl',
              weight: 'bold',
              color: '#fbbf24',
              align: 'center',
              margin: 'md'
            },
            {
              type: 'text',
              text: 'อันดับ 1 — DDx Arena',
              size: 'md',
              color: '#FFFFFF',
              align: 'center',
              margin: 'sm',
              weight: 'bold'
            }
          ]
        },
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#162236',
          cornerRadius: '12px',
          paddingAll: '16px',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '🎁 รางวัล',
              size: 'sm',
              color: '#60a5fa',
              weight: 'bold'
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              spacing: 'md',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#1e3a8a',
                  cornerRadius: '16px',
                  contents: [
                    { type: 'text', text: '📘', size: 'sm', align: 'center', gravity: 'center' }
                  ],
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 0
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  justifyContent: 'center',
                  contents: [
                    {
                      type: 'text',
                      text: 'เข้าใช้ระบบ NLEX ฟรี 7 วัน',
                      size: 'md',
                      weight: 'bold',
                      color: '#34d399',
                      wrap: true
                    },
                    {
                      type: 'text',
                      text: '(นักเรียนปัจจุบัน → รับ VDO BONUS แทน)',
                      size: 'xs',
                      color: '#94a3b8',
                      wrap: true,
                      margin: 'sm'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'separator',
          color: '#1e3a5f',
          margin: 'xl'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xl',
          contents: [
            {
              type: 'text',
              text: '🔥 เดือนนี้ใครจะเป็นเบอร์ 1?',
              size: 'md',
              weight: 'bold',
              color: '#f97316',
              align: 'center'
            },
            {
              type: 'text',
              text: 'เล่นฟรี! สะสมคะแนน ลุ้นรางวัลทุกเดือน',
              size: 'xs',
              color: '#94a3b8',
              align: 'center',
              margin: 'sm',
              wrap: true
            },
            {
              type: 'text',
              text: '* รางวัลแต่ละเดือนไม่เหมือนกัน',
              size: 'xxs',
              color: '#64748b',
              align: 'center',
              margin: 'sm',
              style: 'italic'
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '16px',
      backgroundColor: '#0f172a',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '🎮 เข้าเล่น DDx Arena เลย!',
            uri: 'https://ddx.medninja.academy'
          },
          style: 'primary',
          color: '#f97316',
          height: 'md'
        }
      ]
    }
  }
}

async function run() {
  await broadcastMessage([flexMsg])
  console.log('✅ Broadcast Winner Flex ไปทุกคนแล้ว!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
