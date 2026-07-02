const jwt = require('jsonwebtoken')
const User = require('../../modules/user/User.model')

// Sets req.user if a valid Bearer token is present, but never blocks the request.
// Used for routes that are public but return different data to authenticated/enrolled users.
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) return next()

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (user) req.user = user
  } catch {
    // Invalid token — treat as unauthenticated, do not block
  }
  next()
}

module.exports = optionalAuth
