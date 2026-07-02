const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const {
  listCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  getAnalytics
} = require('./meq.admin.controller')

// ทุก route ต้อง auth + admin
router.use(auth, admin)

// Analytics (static path ต้องอยู่ก่อน /:id)
router.get('/analytics', getAnalytics)

// CRUD
router.get('/', listCases)
router.get('/:id', getCase)
router.post('/', createCase)
router.put('/:id', updateCase)
router.delete('/:id', deleteCase)

module.exports = router
