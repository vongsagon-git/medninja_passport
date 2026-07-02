/**
 * Beam Checkout Webhook — รับแจ้งชำระเงิน → LINE แจ้ง admin
 * mount ก่อน express.json() ใน app.js (ต้องการ raw body)
 */
const express = require('express')
const router = express.Router()
const { verifyBeamSignature } = require('./beam.service')
const { pushMessage } = require('./line.webhook.service')

const ADMIN_UIDS = [
  'U2b0de81f0ec73e8561197393683a9e95', // เติ้ล
  'Ue6b6c4daf46d1765f1af71b292fe6fc9', // chertam
  'U398ec17f9dbf5917c2fd83bec6fe24ef'  // ฝน
]

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-beam-signature']
  const rawBody = req.body

  if (!verifyBeamSignature(rawBody, signature)) {
    console.warn('[Beam Webhook] Invalid signature')
    return res.status(403).json({ error: 'Invalid signature' })
  }

  res.status(200).json({ ok: true })

  const body = JSON.parse(rawBody.toString())
  processBeamEvent(body, req.headers['x-beam-event']).catch(err => {
    console.error('[Beam Webhook] Process error:', err.message)
  })
})

async function processBeamEvent(body, eventType) {
  console.log(`[Beam Webhook] Event: ${eventType}, status: ${body.status}`)

  if (eventType === 'charge.succeeded' || body.status === 'SUCCEEDED') {
    const amount = (body.amount || 0) / 100 // สตางค์ → บาท
    const method = body.paymentMethodType || '-'
    const installment = body.paymentMethod?.cardInstallments?.months
    const ref = body.referenceId || '-'
    const email = body.email || '-'
    const phone = body.primaryPhone ? `0${body.primaryPhone.number}` : '-'

    const flexMsg = {
      type: 'flex',
      altText: `ชำระเงินสำเร็จ ${amount.toLocaleString()} บาท`,
      contents: {
        type: 'bubble', size: 'mega',
        header: { type: 'box', layout: 'vertical', backgroundColor: '#16a34a', paddingAll: '20px', contents: [
          { type: 'text', text: 'ชำระเงินสำเร็จ', color: '#FFFFFF', size: 'lg', weight: 'bold' },
          { type: 'text', text: 'Beam Checkout', color: '#bbf7d0', size: 'xxs', margin: 'sm' }
        ]},
        body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'จำนวน', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: `${amount.toLocaleString()} บาท`, size: 'md', weight: 'bold', color: '#16a34a', flex: 5 }
          ]},
          { type: 'separator', color: '#f1f5f9' },
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'วิธีชำระ', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: method + (installment ? ` (ผ่อน ${installment} เดือน)` : ''), size: 'sm', weight: 'bold', flex: 5, wrap: true }
          ]},
          { type: 'separator', color: '#f1f5f9' },
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'Ref', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: ref, size: 'xs', color: '#334155', flex: 5, wrap: true }
          ]},
          { type: 'separator', color: '#f1f5f9' },
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'อีเมล', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: email, size: 'xs', color: '#334155', flex: 5, wrap: true }
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'เบอร์', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: phone, size: 'xs', color: '#334155', flex: 5 }
          ]},
          { type: 'separator', color: '#f1f5f9' },
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'เวลา', size: 'sm', color: '#64748b', flex: 3 },
            { type: 'text', text: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), size: 'xs', color: '#64748b', flex: 5 }
          ]}
        ]},
        footer: { type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#f0fdf4', contents: [
          { type: 'text', text: 'ข้อความนี้เห็นเฉพาะ admin', size: 'xxs', color: '#94a3b8', align: 'center' }
        ]}
      }
    }

    await Promise.allSettled(
      ADMIN_UIDS.map(uid => pushMessage(uid, [flexMsg]))
    )
    console.log(`[Beam Webhook] Notified admins: ${amount} THB, ref: ${ref}`)
  }
}

module.exports = router
