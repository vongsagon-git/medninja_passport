const express = require('express')
const router = express.Router()
const { getMyActivations, getConsentStatus, acceptConsent } = require('./activation.controller')
const orient = require('./orient.controller')

// auth + profileGuard ถูก apply แล้วที่ app.use('/api/my', ...) ใน app.js
router.get('/activations', getMyActivations)
router.get('/consent/status', getConsentStatus)
router.post('/consent/accept', acceptConsent)

// Orient (course intro video)
router.get('/orient/:activationId', orient.getOrient)
router.post('/orient/:activationId/heartbeat', orient.heartbeat)
router.post('/orient/:activationId/complete', orient.complete)
router.post('/orient/:activationId/reset', orient.selfReset)

module.exports = router
