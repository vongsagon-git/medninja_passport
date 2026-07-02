/**
 * Beam Checkout — สร้าง payment link + verify webhook
 */
const crypto = require('crypto')

const BEAM_API_URL = process.env.BEAM_API_URL || 'https://api.beamcheckout.com'

function getAuthHeader() {
  const merchantId = process.env.BEAM_MERCHANT_ID
  const apiKey = process.env.BEAM_API_KEY
  if (!merchantId || !apiKey) throw new Error('BEAM_MERCHANT_ID or BEAM_API_KEY not set')
  const token = Buffer.from(`${merchantId}:${apiKey}`).toString('base64')
  return `Basic ${token}`
}

/**
 * สร้าง payment link
 * @param {object} opts - { courseName, amount, referenceId, redirectUrl, enableInstallment }
 * amount หน่วยเป็นบาท (จะคูณ 100 เป็นสตางค์)
 */
async function createPaymentLink(opts) {
  const { courseName, amount, referenceId, redirectUrl, enableInstallment } = opts

  const payload = {
    order: {
      currency: 'THB',
      netAmount: Math.round(amount * 100), // สตางค์
      description: courseName || 'MedNinja Academy',
      referenceId: referenceId || `MN-${Date.now()}`
    },
    linkSettings: {
      card: { isEnabled: !!opts.enableCard },
      qrPromptPay: { isEnabled: false }
    }
  }

  // ผ่อน — เปิดเฉพาะอันที่เลือก (3 หรือ 6 เดือน)
  if (opts.installmentMonths) {
    payload.linkSettings.cardInstallments = {
      isEnabled: true,
      installments3m: { isEnabled: opts.installmentMonths === 3 },
      installments6m: { isEnabled: opts.installmentMonths === 6 }
    }
  }

  if (redirectUrl) payload.redirectUrl = redirectUrl

  const res = await fetch(`${BEAM_API_URL}/api/v1/payment-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Beam API error ${res.status}: ${body}`)
  }

  return await res.json()
}

/**
 * Verify webhook signature
 */
function verifyBeamSignature(rawBody, signature) {
  const apiKey = process.env.BEAM_API_KEY
  if (!apiKey || !signature) return false
  const keyBuffer = Buffer.from(apiKey, 'base64')
  const hash = crypto.createHmac('sha256', keyBuffer).update(rawBody).digest('base64')
  return hash === signature
}

module.exports = { createPaymentLink, verifyBeamSignature }
