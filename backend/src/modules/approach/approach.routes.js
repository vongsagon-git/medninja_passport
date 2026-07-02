const express = require('express')
const router = express.Router()
const {
  listApproaches,
  getReviewQueue,
  getStats,
  getApproach,
  recordRead,
  submitPractice,
  toggleBookmark
} = require('./approach.controller')

// auth + profileGuard ถูก apply แล้วที่ app.use('/api/my', ...) ใน app.js

// Static routes ต้องอยู่ก่อน /:id
router.get('/approaches/review-queue', getReviewQueue)
router.get('/approaches/stats', getStats)

router.get('/approaches', listApproaches)
router.get('/approaches/:id', getApproach)
router.post('/approaches/:id/read', recordRead)
router.post('/approaches/:id/practice', submitPractice)
router.post('/approaches/:id/bookmark', toggleBookmark)

module.exports = router
