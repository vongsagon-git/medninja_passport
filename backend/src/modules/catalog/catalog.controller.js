/**
 * Catalog Controller — หน้าขาย (Sales)
 * อ่านจาก Course model (lmsConn) — แยกจาก Package ที่เป็นเนื้อหา
 */
const Course = require('./Course.model')

/**
 * GET /api/courses — public: แสดงคอร์สที่เผยแพร่แล้ว
 * Course มี subCourses[] ในตัวอยู่แล้ว ไม่ต้อง parent-child tree
 */
exports.getCourses = async (req, res, next) => {
  try {
    const filter = { isPublished: true }
    if (req.query.system) filter.system = req.query.system

    const courses = await Course.find(filter).sort('order title')
      .select('-enrollmentCount -createdAt -updatedAt -__v').lean()
    res.json({ courses })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/courses/:id — public: รายละเอียดคอร์สเดี่ยว
 */
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .select('-enrollmentCount -createdAt -updatedAt -__v').lean()
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: 'ไม่พบคอร์ส' })
    }
    res.json({ course })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/courses/all — admin: ดูทั้งหมด (รวมที่ยังไม่ publish)
 */
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort('order title').lean()
    res.json({ courses })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/courses — admin: สร้างคอร์สใหม่
 */
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body)
    res.status(201).json({ course })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/courses/:id — admin: แก้ไขคอร์ส
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบคอร์ส' })
    }
    res.json({ course })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/courses/:id — admin: ลบคอร์ส
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบคอร์ส' })
    }
    res.json({ message: 'ลบคอร์สเรียบร้อย' })
  } catch (error) {
    next(error)
  }
}
