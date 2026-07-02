const express = require('express')
const router = express.Router()
const partnerAuth = require('./partner.middleware')
const { checkEntitlement } = require('./partner.controller')

// POST /api/partner/check-entitlement
router.post('/check-entitlement', partnerAuth, checkEntitlement)

module.exports = router
