const express = require('express')
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const ctrl = require('./receipt.controller')

const router = express.Router()

// ⭐ Shim: accept token via query (?_token=) or (?token=) for window.open PDF download
//   Browser doesn't attach Authorization header on target=_blank navigations
//   Must run BEFORE auth middleware to set the header
function queryTokenShim(req, res, next) {
  const tk = (req.query && (req.query._token || req.query.token)) || null
  if (tk && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${tk}`
    req.headers['authorization'] = `Bearer ${tk}`  // both cases to be safe
  }
  next()
}

// Apply shim to ALL routes in this router (safe — only kicks in if no header set)
router.use(queryTokenShim)
router.use(auth, admin)

router.get('/search-users', ctrl.searchUsers)
router.get('/prefill/:userId', ctrl.prefill)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.get('/:id/pdf', ctrl.pdf)
router.patch('/:id/void', ctrl.voidReceipt)

module.exports = router
