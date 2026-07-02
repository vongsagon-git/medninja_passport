const express = require('express')
const router = express.Router()
const { getMyActivations, getConsentStatus, acceptConsent } = require('./activation.controller')

// auth + profileGuard ถูก apply แล้วที่ app.use('/api/my', ...) ใน app.js
router.get('/activations', getMyActivations)
router.get('/consent/status', getConsentStatus)
router.post('/consent/accept', acceptConsent)

module.exports = router
