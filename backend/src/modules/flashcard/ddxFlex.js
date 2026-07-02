const LIFF_ID = '2009259048-lwEXYc0q'
const liffUrl = 'https://liff.line.me/' + LIFF_ID

function buildDdxGameFlex() {
  return {
    type: 'flex', altText: 'NINJA DDx 3 โหมด — ฝึก DDx ให้แม่น พร้อมสอบ NL1+2 และ MEQ',
    contents: {
      type: 'bubble', size: 'mega',
      hero: { type: 'image', url: 'https://medninja.b-cdn.net/ninja-dd-howto.png', size: 'full', aspectRatio: '20:13', aspectMode: 'cover',
        action: { type: 'uri', uri: liffUrl } },
      body: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: [
        { type: 'box', layout: 'horizontal', justifyContent: 'center', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#dc2626', cornerRadius: '8px', paddingAll: '3px', paddingStart: '10px', paddingEnd: '10px', contents: [
            { type: 'text', text: 'ใหม่! 3 โหมด', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'text', text: 'NINJA DDx', size: 'xl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'md' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '10px', margin: 'lg', contents: [
          { type: 'text', text: 'ทำไมต้องฝึก DDx?', size: 'xs', weight: 'bold', color: '#f59e0b' },
          { type: 'text', text: 'NL1+2 — DDx แม่น = ตอบข้อสอบได้เร็วและแม่นยำ', size: 'xxs', color: '#cbd5e1', wrap: true, margin: 'sm' },
          { type: 'text', text: 'MEQ — ถามปุ๊บตอบปั๊บ ต้องนึก DDx ออกทันที', size: 'xxs', color: '#cbd5e1', wrap: true, margin: 'sm' },
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'md' },
        { type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'md', backgroundColor: '#1e293b', cornerRadius: '8px', paddingAll: '10px', contents: [
          { type: 'text', text: '📚', size: 'lg', flex: 0, gravity: 'center' },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'NINJA Path', size: 'xs', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: 'เรียนทีละด่าน ต้องถูกหมดถึงผ่าน', size: 'xxs', color: '#94a3b8', wrap: true }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'sm', backgroundColor: '#1e293b', cornerRadius: '8px', paddingAll: '10px', contents: [
          { type: 'text', text: '⚔️', size: 'lg', flex: 0, gravity: 'center' },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'NINJA Arena', size: 'xs', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: 'สุ่มการ์ด สะสมดาว ไต่อันดับยุทธจักร', size: 'xxs', color: '#94a3b8', wrap: true }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'sm', backgroundColor: '#1e293b', cornerRadius: '8px', paddingAll: '10px', contents: [
          { type: 'text', text: '🧠', size: 'lg', flex: 0, gravity: 'center' },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'NINJA Mindmap', size: 'xs', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: 'ท่อง C/C → DDx ดู clue ของแต่ละโรค', size: 'xxs', color: '#94a3b8', wrap: true }
          ]}
        ]},
        { type: 'text', text: 'ฟรี 700+ การ์ด · 12 บท · เล่นได้เฉพาะใน LINE', size: 'xxs', color: '#475569', align: 'center', margin: 'lg' },
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
        { type: 'button', action: { type: 'uri', label: 'เล่น NINJA DDx ฟรี', uri: liffUrl }, style: 'primary', color: '#7c3aed', height: 'sm' },
        { type: 'button', action: { type: 'message', label: 'แชร์ให้เพื่อน', text: 'NINJA DDx 3 โหมด! ฝึก DDx ให้แม่น พร้อมสอบ NL1+2 และ MEQ ฟรี!\nhttps://medninja.academy/ddx-arena' }, style: 'link', color: '#94a3b8', height: 'sm' }
      ]}
    }
  }
}

module.exports = { buildDdxGameFlex }
