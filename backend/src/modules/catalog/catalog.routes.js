const express = require('express')
const router = express.Router()
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse, getAllCourses } = require('./catalog.controller')
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')

router.get('/', getCourses)
router.get('/all', auth, admin, getAllCourses)
router.get('/:id', getCourse)
router.post('/', auth, admin, createCourse)
router.put('/:id', auth, admin, updateCourse)
router.delete('/:id', auth, admin, deleteCourse)

module.exports = router
