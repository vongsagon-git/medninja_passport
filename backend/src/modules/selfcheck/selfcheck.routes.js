const express = require('express')
const router = express.Router()
const ctrl = require('./selfcheck.controller')

router.get('/self-checks', ctrl.listMine)
router.get('/self-checks/:slug', ctrl.getOne)
router.post('/self-checks/:slug/toggle', ctrl.toggle)

module.exports = router
