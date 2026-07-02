const express = require('express')
const router = express.Router()
const {
  listCases,
  getCase,
  startAttempt,
  submitAnswer,
  completeAttempt,
  getHistory
} = require('./meq.controller')

// auth + profileGuard ถูก apply แล้วที่ app.use('/api/my', ...) ใน app.js

// Static routes ต้องอยู่ก่อน /:id
router.get('/meq/history', getHistory)

router.get('/meq', listCases)
router.get('/meq/:id', getCase)
router.post('/meq/:id/start', startAttempt)
router.post('/meq/:id/answer', submitAnswer)
router.post('/meq/:id/complete', completeAttempt)

module.exports = router
