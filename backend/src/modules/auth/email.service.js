/**
 * Email Service — ส่ง verification email
 * ใช้ nodemailer + SMTP
 */
const nodemailer = require('nodemailer')
const crypto = require('crypto')

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('⚠️  SMTP not configured — email verification disabled')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })

  return transporter
}

/**
 * สร้าง verification token + expiry
 * @returns {{ token: string, expires: Date }}
 */
function generateVerifyToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // หมดอายุ 24 ชม.
  return { token, expires }
}

/**
 * ส่ง email verification
 * @param {string} email - อีเมลผู้รับ
 * @param {string} name - ชื่อผู้ใช้
 * @param {string} token - verification token
 */
async function sendVerificationEmail(email, name, token) {
  const transport = getTransporter()
  if (!transport) {
    console.warn('⚠️  Skipping verification email — SMTP not configured')
    return false
  }

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`

  const mailOptions = {
    from: `"MedNinja LMS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'ยืนยันอีเมล MedNinja LMS',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">MedNinja LMS</h1>
        </div>
        <h2>สวัสดี ${name}</h2>
        <p>ขอบคุณที่สมัครใช้งาน MedNinja LMS กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
            ยืนยันอีเมล
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">ลิงก์นี้จะหมดอายุภายใน 24 ชั่วโมง หากคุณไม่ได้สมัครสมาชิก กรุณาละเว้นอีเมลนี้</p>
      </div>
    `
  }

  await transport.sendMail(mailOptions)
  return true
}

module.exports = { generateVerifyToken, sendVerificationEmail }
