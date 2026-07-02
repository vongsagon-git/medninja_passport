const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const f = {
  type: 'flex', altText: '🏆 DDx ARENA — การแข่งขันดุเดือด!',
  contents: {
    "type": "bubble",
    "size": "giga",
    "header": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "MEDNINJA", "weight": "bold", "size": "md", "color": "#a855f7" },
        { "type": "text", "text": "DDx", "weight": "bold", "size": "md", "color": "#f97316", "flex": 0 },
        { "type": "text", "text": "ARENA", "weight": "bold", "size": "md", "color": "#FFFFFF", "flex": 0 }
      ],
      "spacing": "sm",
      "backgroundColor": "#1e1b4b",
      "paddingAll": "16px"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "paddingAll": "24px",
      "backgroundColor": "#0f172a",
      "contents": [
        { "type": "text", "text": "🏆 DDx ARENA", "size": "xxl", "weight": "bold", "color": "#f97316", "align": "center" },
        { "type": "text", "text": "เกมส์พัฒนาทักษะ", "size": "lg", "weight": "bold", "color": "#FFFFFF", "align": "center", "margin": "sm" },
        { "type": "text", "text": "ของคนสอบ NL และ MEQ โดยเฉพาะ", "size": "sm", "color": "#c4b5fd", "align": "center", "margin": "xs", "wrap": true },
        { "type": "separator", "color": "#a855f7", "margin": "lg" },
        { "type": "text", "text": "ใครจะทำคะแนนได้สูงสุดในเดือนนี้ 🔥", "size": "md", "color": "#e2e8f0", "wrap": true, "margin": "lg", "align": "center" },
        { "type": "text", "text": "ใครยังไม่ได้ลอง ตอนนี้ยังทันน้า 💪", "size": "md", "color": "#e2e8f0", "wrap": true, "margin": "md", "align": "center" },
        { "type": "separator", "color": "#1e3a5f", "margin": "lg" },
        {
          "type": "box", "layout": "vertical", "margin": "lg", "spacing": "md",
          "backgroundColor": "#1e293b", "cornerRadius": "10px", "paddingAll": "16px",
          "contents": [
            {
              "type": "box", "layout": "horizontal", "spacing": "md", "contents": [
                { "type": "box", "layout": "vertical", "width": "30px", "height": "30px", "backgroundColor": "#7c2d12", "cornerRadius": "15px", "contents": [{ "type": "text", "text": "⚡", "size": "sm", "align": "center", "gravity": "center" }], "justifyContent": "center", "alignItems": "center", "flex": 0 },
                { "type": "box", "layout": "vertical", "flex": 1, "contents": [
                  { "type": "text", "text": "โจทย์ DDx จัดเต็ม", "size": "sm", "weight": "bold", "color": "#fb923c", "wrap": true },
                  { "type": "text", "text": "ฝึกวินิจฉัยแยกโรคแบบเข้มข้น", "size": "xs", "color": "#94a3b8" }
                ]}
              ]
            },
            {
              "type": "box", "layout": "horizontal", "spacing": "md", "contents": [
                { "type": "box", "layout": "vertical", "width": "30px", "height": "30px", "backgroundColor": "#2e1065", "cornerRadius": "15px", "contents": [{ "type": "text", "text": "🎯", "size": "sm", "align": "center", "gravity": "center" }], "justifyContent": "center", "alignItems": "center", "flex": 0 },
                { "type": "box", "layout": "vertical", "flex": 1, "contents": [
                  { "type": "text", "text": "3 โหมด: DDx / Pattern / CC", "size": "sm", "weight": "bold", "color": "#c4b5fd", "wrap": true },
                  { "type": "text", "text": "ครบทุกมุมของการวินิจฉัย", "size": "xs", "color": "#94a3b8" }
                ]}
              ]
            },
            {
              "type": "box", "layout": "horizontal", "spacing": "md", "contents": [
                { "type": "box", "layout": "vertical", "width": "30px", "height": "30px", "backgroundColor": "#1e3a5f", "cornerRadius": "15px", "contents": [{ "type": "text", "text": "📊", "size": "sm", "align": "center", "gravity": "center" }], "justifyContent": "center", "alignItems": "center", "flex": 0 },
                { "type": "box", "layout": "vertical", "flex": 1, "contents": [
                  { "type": "text", "text": "Leaderboard Real-time", "size": "sm", "weight": "bold", "color": "#93c5fd", "wrap": true },
                  { "type": "text", "text": "แข่งกับเพื่อนทั่วประเทศ", "size": "xs", "color": "#94a3b8" }
                ]}
              ]
            }
          ]
        },
        {
          "type": "box", "layout": "horizontal", "justifyContent": "center", "margin": "lg", "spacing": "md",
          "contents": [
            { "type": "box", "layout": "vertical", "backgroundColor": "#dc2626", "cornerRadius": "12px", "paddingAll": "4px", "paddingStart": "12px", "paddingEnd": "12px", "contents": [{ "type": "text", "text": "เล่นฟรี!", "size": "xs", "weight": "bold", "color": "#FFFFFF", "align": "center" }] },
            { "type": "box", "layout": "vertical", "backgroundColor": "#7c3aed", "cornerRadius": "12px", "paddingAll": "4px", "paddingStart": "12px", "paddingEnd": "12px", "contents": [{ "type": "text", "text": "ไม่ต้องสมัคร", "size": "xs", "weight": "bold", "color": "#FFFFFF", "align": "center" }] }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "paddingAll": "16px",
      "backgroundColor": "#0f172a",
      "contents": [
        { "type": "button", "action": { "type": "uri", "label": "🎮 เข้าเล่น DDx Arena เลย!", "uri": "https://ddx.medninja.academy" }, "style": "primary", "color": "#f97316", "height": "md" },
        { "type": "text", "text": "MEDNINJA TECHNOLOGY", "size": "xs", "color": "#64748b", "align": "center", "margin": "sm", "weight": "bold" }
      ]
    }
  }
}

if (require.main === module) {
  // ส่งให้เติ้ล
  fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
    body: JSON.stringify({ to: 'U2b0de81f0ec73e8561197393683a9e95', messages: [f] })
  }).then(r => r.text().then(t => console.log(r.status, t)))
}

module.exports = { f }
