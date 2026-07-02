/**
 * PDF Worker Thread — ฝังลายน้ำ v2 ใน thread แยก ไม่ block main event loop
 */
const { parentPort, workerData } = require('worker_threads')
const { PDFDocument, rgb, degrees } = require('pdf-lib')
const QRCode = require('qrcode')
const fontkit = require('@pdf-lib/fontkit')
const fs = require('fs')
const path = require('path')

;(async () => {
  try {
    const { pdfBuffer, blockLines, microText, userName, refId, userId, email, nationalId, phone, clientIp, dateStr, nameEn, university: uniRaw } = workerData

    // โหลด font
    const fontBytes = fs.readFileSync(path.join(__dirname, '../../shared/fonts/NotoSansThai-Bold.ttf'))

    // โหลด PDF
    const pdfDoc = await PDFDocument.load(Buffer.from(pdfBuffer))
    pdfDoc.registerFontkit(fontkit)
    const font = await pdfDoc.embedFont(fontBytes)

    // format NID ไม่มีขีด สำหรับ invisible text
    const nidClean = (nationalId || '').replace(/-/g, '')
    const nidFormatted = nationalId || ''
    const university = uniRaw || ''

    // สร้าง QR Code
    const qrName = nameEn || userName
    const qrData = `${qrName} ${nidFormatted} ${email || ''} ${phone || ''} Ref:${refId}`.toUpperCase()
    const qrPngBuffer = await QRCode.toBuffer(qrData, { width: 120, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
    const qrImage = await pdfDoc.embedPng(qrPngBuffer)
    const qrSize = 40

    // ข้อความสำหรับแต่ละ layer
    const line1 = [userName, nidFormatted, university, email || '', phone || '', 'Ref:' + refId].filter(Boolean).join(' ')
    const copyLineTop1 = `เอกสารนี้สำเนาโดย ${userName} ${nidFormatted} ${university}`
    const copyLineTop2 = `${email || ''} ${phone || ''} Ref:${refId} IP:${clientIp || ''} ${dateStr || ''}`
    const copyLineShort = `เอกสารนี้สำเนาโดย ${userName} ${nidFormatted}`
    const copyLineLong = `${university} ${email || ''} ${phone || ''} Ref:${refId}`

    const bigLines = [
      'เอกสารทำสำเนาโดย',
      userName,
      nidFormatted,
      university,
      `${email || ''} | ${phone || ''}`,
      `Ref: ${refId}`,
      `ให้ผู้เรียน ${userName} ใช้เพื่อประกอบการศึกษา`,
      'MedNinja Co., Ltd.',
      'คุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ 2537',
      'สงวนสิทธิ์ดำเนินการตามกฎหมายหากพบการเผยแพร่'
    ]

    const pages = pdfDoc.getPages()
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()

      // ═══ Layer 1: ตัวเล็กเต็มจอ สีเทา (พื้นขาวเด่น) ═══
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
            x: xOff + col * (w1 + 5), y, size: size1, font,
            color: rgb(0.45, 0.45, 0.45), opacity: 0.14
          })
        }
      }

      // ═══ Layer 2: ตัวเล็กเต็มจอ สีขาว (พื้นเข้มเด่น) ═══
      for (let row = 0; row < rows1; row++) {
        const y = row * h1 + 10
        const xOff = (row % 2 === 0) ? 0 : -(w1 / 2)
        for (let col = 0; col < cols1; col++) {
          page.drawText(line1, {
            x: xOff + col * (w1 + 5), y, size: size1, font,
            color: rgb(1, 1, 1), opacity: 0.03
          })
        }
      }

      // ═══ Layer 3: กลางจอ ตัวใหญ่ 2 สี ═══
      const bigSize = 22
      const bigLineHeight = 30
      const totalBigH = bigLines.length * bigLineHeight
      const startY = (height + totalBigH) / 2

      bigLines.forEach((text, idx) => {
        const lw = font.widthOfTextAtSize(text, bigSize)
        const x = (width - lw) / 2
        const y = startY - idx * bigLineHeight
        page.drawText(text, { x, y, size: bigSize, font, color: rgb(0.3, 0.3, 0.3), opacity: 0.1 })
        page.drawText(text, { x, y, size: bigSize, font, color: rgb(1, 1, 1), opacity: 0.1 })
      })

      // ═══ Layer 4: QR Code มุมซ้ายล่าง + ขวาบน ═══
      page.drawImage(qrImage, { x: 8, y: 8, width: qrSize, height: qrSize, opacity: 1.0 })
      page.drawImage(qrImage, { x: width - qrSize - 10, y: height - qrSize - 10, width: qrSize, height: qrSize, opacity: 1.0 })

      // ═══ Layer 5: ตัวเหลือง บน center ═══
      const copySize = 12
      const cwTop1 = font.widthOfTextAtSize(copyLineTop1, copySize)
      const cwTop2 = font.widthOfTextAtSize(copyLineTop2, copySize)
      page.drawText(copyLineTop1, { x: (width - cwTop1) / 2, y: height - 13, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })
      page.drawText(copyLineTop2, { x: (width - cwTop2) / 2, y: height - 27, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })

      // ═══ Layer 6: ตัวเหลือง ล่าง center ═══
      const cwShort = font.widthOfTextAtSize(copyLineShort, copySize)
      const cwLong = font.widthOfTextAtSize(copyLineLong, copySize)
      page.drawText(copyLineShort, { x: (width - cwShort) / 2, y: 20, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })
      page.drawText(copyLineLong, { x: (width - cwLong) / 2, y: 6, size: copySize, font, color: rgb(0.85, 0.65, 0.0), opacity: 0.6 })

      // ═══ Layer 7: Footer ข้อมูลครบ ═══
      const footerText = `${userName} | ${nidFormatted} | ${university} | ${email || ''} | Ref: ${refId} | MedNinja Co., Ltd.`
      const footerSize = 5
      const fw = font.widthOfTextAtSize(footerText, footerSize)
      page.drawText(footerText, { x: (width - fw) / 2, y: 4, size: footerSize, font, color: rgb(0.6, 0.6, 0.6), opacity: 0.3 })

      // ═══ Layer 8: Header มุมซ้ายบน ═══
      page.drawText(`${userName} | Ref: ${refId}`, { x: 8, y: height - 11, size: 5, font, color: rgb(0.6, 0.6, 0.6), opacity: 0.25 })

      // ═══ Layer 9: Invisible text — Ctrl+F search เจอ ═══
      if (nidClean) {
        const invisSize = 4
        for (let n = 0; n < 20; n++) {
          const ix = ((n * 137 + i * 31) % 100) / 100 * (width - 100) + 20
          const iy = ((n * 89 + i * 53) % 100) / 100 * (height - 40) + 20
          page.drawText(nidClean, { x: ix, y: iy, size: invisSize, font, color: rgb(0.5, 0.5, 0.5), opacity: 0.03 })
        }
      }
    }

    // ฝัง metadata
    pdfDoc.setTitle(workerData.pdfTitle)
    pdfDoc.setAuthor(`${userName} | ${email || ''}`)
    pdfDoc.setSubject(`Ref: ${refId} | NID: ${nationalId || '-'} | IP: ${clientIp}`)
    pdfDoc.setKeywords([refId, email || '', nationalId || '', phone || '', clientIp])
    pdfDoc.setCreator('MedNinja LMS — Do not distribute')
    pdfDoc.setProducer(`MedNinja Co., Ltd. | ${dateStr}`)

    const resultBytes = await pdfDoc.save()
    parentPort.postMessage({ ok: true, resultBytes: Buffer.from(resultBytes) })
  } catch (err) {
    parentPort.postMessage({ ok: false, error: err.message })
  }
})()
