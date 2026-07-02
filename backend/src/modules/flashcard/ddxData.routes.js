const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const { categories } = require('./ddxStaticData')
const { mustKnow, goldenRules, confusingPairs } = require('./ddxStaticCheatSheet')

// GET /api/ddx/categories — ต้อง login (Mindmap, ManageDdx)
router.get('/categories', auth, (req, res) => {
  res.json({ categories })
})

// GET /api/ddx/cheatsheet — ต้อง login (ManageDdx)
router.get('/cheatsheet', auth, (req, res) => {
  res.json({ mustKnow, goldenRules, confusingPairs })
})

// GET /api/ddx/demo — public แต่ส่งแค่ตัวอย่างบางส่วน (NinjaDdxDemo)
router.get('/demo', (req, res) => {
  // ส่งแค่ summary — ไม่ส่ง differentials detail ทั้งหมด
  const summary = categories.map(c => ({
    code: c.code,
    name: c.name,
    nameEn: c.nameEn,
    icon: c.icon,
    color: c.color,
    description: c.description,
    symptomCount: c.symptoms.length,
    ddxCount: c.symptoms.reduce((s, sy) => s + sy.differentials.length, 0)
  }))

  // ส่ง GI ปวดท้อง เป็นตัวอย่าง (แค่ชื่อ diagnosis ไม่ส่ง detail)
  const gi = categories.find(c => c.code === 'GI')
  const demoSymptom = gi?.symptoms[0]
  const demoDdx = demoSymptom?.differentials?.slice(0, 7).map(d => ({
    diagnosis: d.diagnosis,
    diagnosisTh: d.diagnosisTh,
    frequency: d.frequency
  })) || []

  // ส่ง mustKnow แค่ 5 ข้อสุ่มสำหรับ quiz demo
  const shuffled = [...mustKnow].sort(() => Math.random() - 0.5)
  const demoQuiz = shuffled.slice(0, 5)

  res.json({ summary, demoDdx, demoQuiz, totalMustKnow: mustKnow.length })
})

module.exports = router
