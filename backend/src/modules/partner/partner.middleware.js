/**
 * Partner API authentication — เช็ค x-api-key header
 * ใช้สำหรับ service-to-service (NLEX → LMS)
 */
const partnerAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== process.env.NLEX_API_KEY) {
    return res.status(401).json({ error: 'invalid_api_key' })
  }
  next()
}

module.exports = partnerAuth
