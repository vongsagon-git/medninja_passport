const express = require('express')
const auth = require('../../shared/middleware/auth')
const admin = require('../../shared/middleware/admin')
const ctrl = require('./receipt.controller')

const router = express.Router()

// PDF endpoint — accept token via query (?_token=) for window.open download
// (browser won't attach Authorization header on window.open/target=_blank)
function queryTokenShim(req, res, next) {
  if (!req.headers.authorization && req.query && req.query._token) {
    req.headers.authorization = `Bearer ${req.query._token}`
  }
  next()
}

router.get('/:id/pdf', queryTokenShim, auth, admin, ctrl.pdf)

// Everything else — standard Bearer header auth
router.use(auth, admin)

router.get('/search-users', ctrl.searchUsers)
router.get('/prefill/:userId', ctrl.prefill)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.patch('/:id/void', ctrl.voidReceipt)

module.exports = router
