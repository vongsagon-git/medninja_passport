/**
 * Prototype ลายน้ำแบบใหม่ — ดูดี ไม่กวนตา แต่ป้องกันถ่ายเอกสาร
 * ทดสอบกับ NL2 OB.pdf → OUT_prototype.pdf
 */
const { PDFDocument, rgb, degrees } = require('pdf-lib')
const QRCode = require('qrcode')
const fontkit = require('@pdf-lib/fontkit')
const fs = require('fs')
const path = require('path')

const INPUT = 'c:/Users/PC/Desktop/MedNinja LMS/NL2 OB.pdf'
const OUTPUT = 'c:/Users/PC/Desktop/MedNinja LMS/OUT_prototype.pdf'
const FONT_PATH = path.join(__dirname, '../shared/fonts/NotoSansThai-Bold.ttf')

// ข้อมูลลายน้ำจำลอง
const USER = {
  name: 'วงศกร บุญวลดี',
  nid: '1-1014-01196-68-1',
  university: 'สถาบันเทคโนโลยี พระจอมเกล้าเจ้าคุณทหารลาดกระบัง',
  email: 'vongsagon@gmail.com',
  phone: '0944355045',
  refId: '26FD2CB2'
}

async function run() {
  const pdfBytes = fs.readFileSync(INPUT)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = fs.readFileSync(FONT_PATH)
  const font = await pdfDoc.embedFont(fontBytes)

  // สร้าง QR Code — บรรจุรายละเอียดผู้ใช้
  const qrData = `Vongsagon Bunsawadi ${USER.nid} ${USER.email} ${USER.phone} Ref:${USER.refId}`
  // QR แบบ 1: ชัด พื้นขาว (มุมซ้ายล่าง)
  const qrPngBuffer = await QRCode.toBuffer(qrData, { width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
  const qrImage = await pdfDoc.embedPng(qrPngBuffer)
  const qrSize = 40

  // QR แบบ 2: จาง พื้นใส (ซ่อน ดูเหมือนลวดลาย)
  const qrGhostBuffer = await QRCode.toBuffer(qrData, { width: 120, margin: 1, color: { dark: '#888888', light: '#ffffff00' } })
  const qrGhost = await pdfDoc.embedPng(qrGhostBuffer)
  const qrGhostSize = 30

  const pages = pdfDoc.getPages()
  const totalPages = Math.min(pages.length, 5)

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()

    // ═══ v4: สวย ไม่กวนตา แต่ครบ ═══

    // คำนวณ zone กลางจอ (ตัวใหญ่) เพื่อเว้นตัวเล็ก
    const bigCount = 10
    const bigLH = 26
    const bigTotalH = bigCount * bigLH
    const bigTopY = (height + bigTotalH) / 2
    const bigBottomY = bigTopY - bigTotalH
    const bigZoneTop = bigTopY + 15
    const bigZoneBottom = bigBottomY - 15

    // Layer 1: สีเทา (เห็นบนพื้นขาว) — เว้น zone กลาง
    const line1 = `${USER.name} ${USER.nid} ${USER.university} ${USER.email} ${USER.phone} Ref:${USER.refId}`
    const size1 = 6
    const h1 = 9
    const w1 = font.widthOfTextAtSize(line1, size1)
    const cols1 = Math.ceil(width / (w1 + 5)) + 1
    const rows1 = Math.ceil(height / h1)

    for (let row = 0; row < rows1; row++) {
      const y = row * h1 + 10
      const xOff = (row % 2 === 0) ? 0 : -(w1 / 2)
      for (let col = 0; col < cols1; col++) {
        page.drawText(line1, {
          x: xOff + col * (w1 + 5),
          y,
          size: size1,
          font,
          color: rgb(0.45, 0.45, 0.45),
          opacity: 0.14
        })
      }
    }

    // Layer 2: สีขาว (เห็นบนพื้นเข้ม) — เต็มจอ
    for (let row = 0; row < rows1; row++) {
      const y = row * h1 + 10
      const xOff = (row % 2 === 0) ? 0 : -(w1 / 2)
      for (let col = 0; col < cols1; col++) {
        page.drawText(line1, {
          x: xOff + col * (w1 + 5),
          y,
          size: size1,
          font,
          color: rgb(1, 1, 1),
          opacity: 0.03
        })
      }
    }

    // Layer 4: กลางจอ ตัวใหญ่ หลายบรรทัด ข้อมูลครบ — 2 สี
    const bigLines = [
      'เอกสารทำสำเนาโดย',
      USER.name,
      USER.nid,
      USER.university,
      `${USER.email} | ${USER.phone}`,
      `Ref: ${USER.refId}`,
      'เอกสารลิขสิทธิ์ของ MedNinja Co., Ltd.',
      `ให้ผู้เรียน ${USER.name}`,
      'ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ 2537',
      'ห้ามทำซ้ำ ดัดแปลง หรือเผยแพร่โดยไม่ได้รับอนุญาต'
    ]
    const bigSize = 22
    const bigLineHeight = 30
    const totalBigH = bigLines.length * bigLineHeight
    const startY = (height + totalBigH) / 2

    bigLines.forEach((text, idx) => {
      const lw = font.widthOfTextAtSize(text, bigSize)
      const x = (width - lw) / 2
      const y = startY - idx * bigLineHeight
      page.drawText(text, { x, y, size: bigSize, font, color: rgb(0.3, 0.3, 0.3), opacity: 0.15 })
      page.drawText(text, { x, y, size: bigSize, font, color: rgb(1, 1, 1), opacity: 0.15 })
    })

    // QR Code มุมซ้ายล่าง — ชัดสุด
    page.drawImage(qrImage, {
      x: 8,
      y: 8,
      width: qrSize,
      height: qrSize,
      opacity: 1.0
    })

    // QR มุมขวาบน — ชัด ดำพื้นขาว
    page.drawImage(qrImage, {
      x: width - qrSize - 10,
      y: height - qrSize - 10,
      width: qrSize,
      height: qrSize,
      opacity: 1.0
    })

// Footer: ข้อมูลครบ ชัดกว่า
    const footerText = `${USER.name} | ${USER.nid} | ${USER.university} | ${USER.email} | Ref: ${USER.refId} | MedNinja Co., Ltd.`
    const footerSize = 5
    const fw = font.widthOfTextAtSize(footerText, footerSize)
    page.drawText(footerText, {
      x: (width - fw) / 2,
      y: 4,
      size: footerSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.3
    })

    // Header มุมซ้ายบน
    page.drawText(`${USER.name} | Ref: ${USER.refId}`, {
      x: 8,
      y: height - 11,
      size: 5,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.25
    })

    // มุมขวาบน — เด่นชัด สีแดง
    const copyLineTop1 = `เอกสารนี้สำเนาโดย ${USER.name} ${USER.nid} ${USER.university}`
    const copyLineTop2 = `${USER.email} ${USER.phone} Ref:${USER.refId}`
    const copyLineShort = `เอกสารนี้สำเนาโดย ${USER.name} ${USER.nid}`
    const copyLineLong = `${USER.university} ${USER.email} ${USER.phone} Ref:${USER.refId}`
    const copySize = 12
    const cwShort = font.widthOfTextAtSize(copyLineShort, copySize)
    const cwLong = font.widthOfTextAtSize(copyLineLong, copySize)

    // บน center
    const cwTop1 = font.widthOfTextAtSize(copyLineTop1, copySize)
    const cwTop2 = font.widthOfTextAtSize(copyLineTop2, copySize)
    page.drawText(copyLineTop1, { x: (width - cwTop1) / 2, y: height - 13, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })
    page.drawText(copyLineTop2, { x: (width - cwTop2) / 2, y: height - 27, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })

    // ล่าง center — สำเนาโดยก่อน ยาวชิดขอบล่าง
    page.drawText(copyLineShort, { x: (width - cwShort) / 2, y: 20, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })
    page.drawText(copyLineLong, { x: (width - cwLong) / 2, y: 6, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })

    // Invisible text — Ctrl+F search เจอ
    const invisText = USER.nid.replace(/-/g, '')
    const invisSize = 4
    for (let n = 0; n < 20; n++) {
      const ix = ((n * 137 + i * 31) % 100) / 100 * (width - 100) + 20
      const iy = ((n * 89 + i * 53) % 100) / 100 * (height - 40) + 20
      page.drawText(invisText, {
        x: ix, y: iy, size: invisSize, font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.03
      })
    }

  }

  const outBytes = await pdfDoc.save()
  fs.writeFileSync(OUTPUT, outBytes)
  console.log(`Done! ${totalPages} pages → ${OUTPUT}`)
  console.log(`File size: ${(outBytes.length / 1024 / 1024).toFixed(1)} MB`)
}

run().catch(console.error)
