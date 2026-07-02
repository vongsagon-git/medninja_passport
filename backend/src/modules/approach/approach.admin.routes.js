const express = require('express')
const router = express.Router()
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const {
  listApproaches,
  getApproach,
  createApproach,
  updateApproach,
  deleteApproach,
  bulkImport,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAnalytics
} = require('./approach.admin.controller')

// ทุก route ต้อง auth + admin
router.use(auth, admin)

// Categories (static path ต้องอยู่ก่อน /:id)
router.get('/categories', listCategories)
router.post('/categories', createCategory)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

// Analytics
router.get('/analytics', getAnalytics)

// Import
router.post('/import', bulkImport)

// Approach CRUD
router.get('/', listApproaches)
router.get('/:id', getApproach)
router.post('/', createApproach)
router.put('/:id', updateApproach)
router.delete('/:id', deleteApproach)

module.exports = router
