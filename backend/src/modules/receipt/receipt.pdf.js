const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const fontkit = require('@pdf-lib/fontkit')
const fs = require('fs')
const path = require('path')

const FONT_REG_PATH = path.join(__dirname, '../../shared/fonts/NotoSansThai-Regular.ttf')
const FONT_BOLD_PATH = path.join(__dirname, '../../shared/fonts/NotoSansThai-Bold.ttf')

const COMPANY = {
  nameTh: 'บริษัท เมดนินจา จำกัด',
  nameEn: 'MEDNINJA CO., LTD.',
  regNo: '0105568223571',
  address: '55/5 ถนนฉลองกรุง แขวงลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520'
}

const BAHT_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const BAHT_PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

function readInt(str) {
  const n = str.length
  let out = ''
  for (let i = 0; i < n; i++) {
    const d = parseInt(str[i], 10)
    const pos = n - i - 1
    if (d === 0) continue
    if (pos === 0 && d === 1 && n > 1) { out += 'เอ็ด'; continue }
    if (pos === 1 && d === 2) { out += 'ยี่สิบ'; continue }
    if (pos === 1 && d === 1) { out += 'สิบ'; continue }
    out += BAHT_DIGITS[d] + BAHT_PLACES[pos]
  }
  return out
}

function bahtText(amount) {
  const n = Math.round(Number(amount) * 100) / 100
  const [bahtStr, satangStr = '00'] = n.toFixed(2).split('.')
  const bahtInt = parseInt(bahtStr, 10) || 0
  const satangInt = parseInt(satangStr.padEnd(2, '0'), 10) || 0

  let out = ''
  if (bahtInt === 0) out = 'ศูนย์บาท'
  else {
    // แบ่งเป็นก้อนล้าน
    let s = String(bahtInt)
    const chunks = []
    while (s.length > 6) { chunks.unshift(s.slice(-6)); s = s.slice(0, -6) }
    chunks.unshift(s)
    out = chunks.map((c, i) => {
      const t = readInt(c)
      return t + (i < chunks.length - 1 ? 'ล้าน' : '')
    }).join('') + 'บาท'
  }
  if (satangInt === 0) out += 'ถ้วน'
  else out += readInt(String(satangInt).padStart(2, '0')) + 'สตางค์'
  return out
}

function fmtMoney(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDateTh(d) {
  const date = new Date(d)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear() + 543
  return `${dd}/${mm}/${yyyy}`
}

function fmtAddress(c) {
  const parts = []
  if (c.address) parts.push(c.address)
  const line2 = [c.subDistrict, c.district, c.province].filter(Boolean).join(' ')
  if (line2) parts.push(line2)
  if (c.postalCode) parts.push(c.postalCode)
  return parts.join(' ')
}

async function generateReceiptPdf(receipt) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const regBytes = fs.readFileSync(FONT_REG_PATH)
  const boldBytes = fs.readFileSync(FONT_BOLD_PATH)
  const fontReg = await pdfDoc.embedFont(regBytes, { subset: true })
  const fontBold = await pdfDoc.embedFont(boldBytes, { subset: true })

  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.size()

  const M = 45
  let y = height - M
  const blue = rgb(0.15, 0.35, 0.68)
  const gray = rgb(0.35, 0.4, 0.5)
  const dark = rgb(0.1, 0.15, 0.25)
  const light = rgb(0.87, 0.9, 0.95)

  const draw = (t, x, yy, opts = {}) => {
    page.drawText(String(t || ''), {
      x, y: yy,
      size: opts.size || 10,
      font: opts.bold ? fontBold : fontReg,
      color: opts.color || dark
    })
  }
  const line = (x1, y1, x2, y2, color = light, thickness = 1) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness })
  }

  // ─── Header: บริษัท ───
  draw(COMPANY.nameTh, M, y, { size: 16, bold: true, color: blue })
  y -= 16
  draw(COMPANY.nameEn, M, y, { size: 9, color: gray })
  y -= 14
  draw(`เลขทะเบียนนิติบุคคล: ${COMPANY.regNo}`, M, y, { size: 9, color: gray })
  y -= 12
  draw(COMPANY.address, M, y, { size: 9, color: gray })

  // ─── Title Right ───
  const titleX = width - M - 175
  let ty = height - M
  draw('ใบเสร็จรับเงิน', titleX, ty, { size: 20, bold: true, color: blue })
  ty -= 18
  draw('RECEIPT', titleX, ty, { size: 10, color: gray })
  ty -= 20
  draw('เลขที่ / No.', titleX, ty, { size: 9, color: gray })
  draw(receipt.receiptNo, titleX + 65, ty, { size: 10, bold: true })
  ty -= 12
  draw('วันที่ / Date', titleX, ty, { size: 9, color: gray })
  draw(fmtDateTh(receipt.issuedAt), titleX + 65, ty, { size: 10 })

  // ─── Divider ───
  y -= 20
  line(M, y, width - M, y, blue, 1.5)
  y -= 20

  // ─── Customer box ───
  draw('ลูกค้า / Customer', M, y, { size: 9, bold: true, color: blue })
  y -= 14
  draw(receipt.customer.name || '-', M, y, { size: 11, bold: true })
  y -= 13
  if (receipt.customer.nationalId) {
    draw(`เลขบัตรประชาชน: ${receipt.customer.nationalId}`, M, y, { size: 9, color: gray })
    y -= 12
  }
  const addr = fmtAddress(receipt.customer)
  if (addr) {
    draw(`ที่อยู่: ${addr}`, M, y, { size: 9, color: gray })
    y -= 12
  }
  const contact = [receipt.customer.email, receipt.customer.phone].filter(Boolean).join('  |  ')
  if (contact) {
    draw(contact, M, y, { size: 9, color: gray })
    y -= 12
  }

  // ─── Items table ───
  y -= 15
  const tableTop = y
  const colDesc = M + 8
  const colAmt = width - M - 8

  // header row
  page.drawRectangle({ x: M, y: y - 6, width: width - 2 * M, height: 22, color: blue })
  draw('รายการ / Description', colDesc, y + 2, { size: 10, bold: true, color: rgb(1, 1, 1) })
  draw('จำนวนเงิน (บาท)', colAmt - 90, y + 2, { size: 10, bold: true, color: rgb(1, 1, 1) })
  y -= 22

  // rows
  receipt.items.forEach((it, i) => {
    if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: y - 4, width: width - 2 * M, height: 20, color: rgb(0.97, 0.98, 1) })
    }
    draw(it.description, colDesc, y + 2, { size: 10 })
    const amtStr = fmtMoney(it.amount)
    const amtWidth = fontReg.widthOfTextAtSize(amtStr, 10)
    draw(amtStr, colAmt - amtWidth, y + 2, { size: 10 })
    y -= 20
  })

  // total row
  y -= 6
  line(M, y + 15, width - M, y + 15, blue, 1)
  page.drawRectangle({ x: colAmt - 175, y: y - 6, width: 175 + 8, height: 26, color: rgb(0.95, 0.97, 1) })
  draw('รวมเป็นเงินทั้งสิ้น', colAmt - 165, y + 4, { size: 11, bold: true, color: blue })
  const totalStr = fmtMoney(receipt.total)
  const totalWidth = fontBold.widthOfTextAtSize(totalStr, 12)
  draw(totalStr, colAmt - totalWidth, y + 4, { size: 12, bold: true, color: blue })
  y -= 30

  // baht text
  const btText = `(${bahtText(receipt.total)})`
  draw(btText, M, y, { size: 10, bold: true, color: dark })
  y -= 25

  // payment method + notes
  draw(`วิธีการชำระเงิน: ${receipt.paymentMethod || 'เงินสด'}`, M, y, { size: 10, color: gray })
  y -= 14
  if (receipt.notes) {
    draw(`หมายเหตุ: ${receipt.notes}`, M, y, { size: 9, color: gray })
    y -= 14
  }

  // ─── Footer / signature ───
  const footerY = 130
  line(M, footerY + 60, width - M, footerY + 60, light, 1)

  // Left: บริษัทฯ ได้รับเงินจำนวนดังกล่าวไว้ถูกต้องแล้ว
  draw('บริษัทฯ ได้รับเงินจำนวนดังกล่าวไว้ถูกต้องแล้ว', M, footerY + 45, { size: 9, color: gray })

  // Right: signature box
  const sigX = width - M - 200
  line(sigX, footerY + 20, sigX + 200, footerY + 20, gray, 0.8)
  draw('ผู้รับเงิน / Authorized Signature', sigX + 25, footerY + 6, { size: 9, color: gray })
  draw(`ออกโดย: ${receipt.issuedByName || '-'}`, sigX, footerY - 8, { size: 8, color: gray })
  draw(`${fmtDateTh(receipt.issuedAt)}`, sigX, footerY - 20, { size: 8, color: gray })

  // Void watermark
  if (receipt.voided) {
    page.drawText('VOID', {
      x: width / 2 - 100, y: height / 2 - 40,
      size: 120, font: fontBold,
      color: rgb(0.9, 0.2, 0.2),
      opacity: 0.18,
      rotate: { type: 'degrees', angle: 30 }
    })
  }

  // ─── Bottom footer ───
  draw('เอกสารนี้ออกโดยระบบอิเล็กทรอนิกส์', M, 40, { size: 8, color: gray })
  draw('MedNinja Passport', width - M - 80, 40, { size: 8, color: gray })

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

module.exports = { generateReceiptPdf, COMPANY }
