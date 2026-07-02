const express = require('express')
const router = express.Router()
const { getProfile, updateProfile, completeProfile, getAllUsers, adminUpdateUser } = require('./user.controller')
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')

router.get('/profile', auth, getProfile)
router.put('/profile', auth, updateProfile)
router.post('/complete-profile', auth, completeProfile)
router.get('/', auth, admin, getAllUsers)
router.put('/:id', auth, admin, adminUpdateUser)

module.exports = router
