const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const adminOnly = require('../../shared/middleware/admin')
const ctrl = require('./selfcheck.admin.controller')

router.use(auth, adminOnly)

// Templates
router.get('/templates', ctrl.listTemplates)
router.get('/templates/:slug', ctrl.getTemplate)
router.post('/templates', ctrl.createTemplate)
router.put('/templates/:slug', ctrl.updateTemplate)
router.delete('/templates/:slug', ctrl.deleteTemplate)

// Bindings
router.get('/bindings', ctrl.listBindings)
router.post('/bindings', ctrl.createBinding)
router.delete('/bindings/:id', ctrl.deleteBinding)

// Section helper
router.get('/section-topics/:sectionId', ctrl.getSectionTopics)

// Analytics
router.get('/analytics', ctrl.analytics)

module.exports = router
