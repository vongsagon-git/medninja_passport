const crypto = require('crypto')

const bunnyConfig = {
  apiKey: process.env.BUNNY_API_KEY,
  libraryId: process.env.BUNNY_LIBRARY_ID,
  cdnHostname: process.env.BUNNY_CDN_HOSTNAME,
  securityKey: process.env.BUNNY_SECURITY_KEY
}

function getVideoUrl(videoId) {
  if (!bunnyConfig.cdnHostname || !videoId) return null
  return `https://${bunnyConfig.cdnHostname}/${videoId}/playlist.m3u8`
}

// Anti-piracy: ปิด AirPlay button ใน Bunny player → กัน mirror ออกทีวี/external display
const ANTI_PIRACY = 'disableAirplay=true&chromecast=false'

function getEmbedUrl(videoId) {
  if (!bunnyConfig.libraryId || !videoId) return null
  return `https://player.mediadelivery.net/embed/${bunnyConfig.libraryId}/${videoId}?${ANTI_PIRACY}`
}

// Signed embed URL — required when Token Authentication is enabled on library
// Formula: token = SHA256_HEX(securityKey + videoId + expiresTimestamp)
function getSignedEmbedUrl(videoId, expiresInSeconds = 7200) {
  if (!bunnyConfig.securityKey || !bunnyConfig.libraryId || !videoId) {
    return getEmbedUrl(videoId) // fallback to unsigned
  }
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
  const token = crypto
    .createHash('sha256')
    .update(bunnyConfig.securityKey + videoId + String(expires))
    .digest('hex')
  return `https://player.mediadelivery.net/embed/${bunnyConfig.libraryId}/${videoId}?token=${token}&expires=${expires}&_t=${Date.now()}&${ANTI_PIRACY}`
}

// Demo library (no DRM) — ใช้ library แยกสำหรับ demo ที่ไม่เปิด MediaCage
function getDemoEmbedUrl(videoId) {
  const demoLibId = process.env.BUNNY_DEMO_LIBRARY_ID
  const demoSecKey = process.env.BUNNY_DEMO_SECURITY_KEY
  if (!demoLibId || !videoId) {
    // fallback: ใช้ library หลัก (มี DRM)
    return getSignedEmbedUrl(videoId)
  }
  // ถ้า demo library ไม่เปิด token auth → ใช้ unsigned URL
  if (!demoSecKey) {
    return `https://player.mediadelivery.net/embed/${demoLibId}/${videoId}?${ANTI_PIRACY}`
  }
  // ถ้าเปิด token auth → sign URL
  const expires = Math.floor(Date.now() / 1000) + 7200
  const token = crypto
    .createHash('sha256')
    .update(demoSecKey + videoId + String(expires))
    .digest('hex')
  return `https://player.mediadelivery.net/embed/${demoLibId}/${videoId}?token=${token}&expires=${expires}&_t=${Date.now()}&${ANTI_PIRACY}`
}

// Audio files stored on Bunny CDN (e.g. "audio/q001.mp3" or full path)
function getAudioUrl(audioId) {
  if (!bunnyConfig.cdnHostname || !audioId) return null
  return `https://${bunnyConfig.cdnHostname}/${audioId}`
}

module.exports = { bunnyConfig, getVideoUrl, getEmbedUrl, getSignedEmbedUrl, getDemoEmbedUrl, getAudioUrl }
