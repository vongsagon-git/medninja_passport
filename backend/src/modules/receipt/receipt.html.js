/**
 * Receipt HTML template — พิมพ์ผ่าน browser (Ctrl+P → Save as PDF)
 * ไม่ต้องโหลด font / ไม่ต้องประมวลผล PDF บน server → ไม่ timeout
 */

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

function esc(s) {
  return String(s || '').replace(/[<>&"']/g, m => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[m]))
}

function generateReceiptHtml(receipt, appName = 'MedNinja') {
  const addr = fmtAddress(receipt.customer)
  const contact = [receipt.customer.email, receipt.customer.phone].filter(Boolean).join(' | ')

  const itemsHtml = receipt.items.map((it, i) => `
    <tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td class="desc">${esc(it.description)}</td>
      <td class="amt">${fmtMoney(it.amount)}</td>
    </tr>
  `).join('')

  const voidWatermark = receipt.voided ? `
    <div class="void-mark">VOID</div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ใบเสร็จ ${esc(receipt.receiptNo)}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans Thai', 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1e293b; background: #f6f8fc; padding: 20px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .paper {
    max-width: 800px; margin: 0 auto; background: #fff;
    padding: 40px 45px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    position: relative; min-height: 1100px;
  }
  .toolbar {
    max-width: 800px; margin: 0 auto 12px; display: flex; gap: 8px; justify-content: flex-end;
  }
  .btn {
    background: linear-gradient(135deg, #2864c8, #3b82f6); color: #fff;
    border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    box-shadow: 0 2px 6px rgba(40,100,200,0.25);
  }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(40,100,200,0.35); }
  .btn-outline { background: #fff; color: #2864c8; border: 1px solid #cbd5e1; box-shadow: none; }
  .btn-outline:hover { background: #f1f5f9; transform: none; }
  @media print { .toolbar { display: none; } body { background: #fff; padding: 0; } .paper { box-shadow: none; padding: 20mm 15mm; min-height: auto; } }

  /* Header */
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2864c8; }
  .company .name-th { font-size: 20px; font-weight: 700; color: #2864c8; }
  .company .name-en { font-size: 11px; color: #64748b; margin-top: 2px; }
  .company .info { font-size: 11px; color: #64748b; margin-top: 8px; line-height: 1.6; }
  .title-box { text-align: right; }
  .title-box h1 { font-size: 26px; font-weight: 700; color: #2864c8; letter-spacing: 1px; }
  .title-box .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; letter-spacing: 3px; }
  .meta { margin-top: 14px; font-size: 12px; }
  .meta .row { display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px; }
  .meta .lbl { color: #64748b; }
  .meta .val { font-weight: 600; color: #1e293b; min-width: 100px; text-align: left; }

  /* Customer */
  .customer { margin-bottom: 20px; padding: 16px 20px; background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6; }
  .customer .lbl { font-size: 11px; color: #2864c8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .customer .name { font-size: 16px; font-weight: 700; margin-top: 4px; }
  .customer .row { font-size: 12px; color: #475569; margin-top: 4px; }
  .customer .row b { color: #1e293b; font-weight: 600; }

  /* Items table */
  .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .items thead th { background: #2864c8; color: #fff; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
  .items thead th.right { text-align: right; }
  .items tbody td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  .items tbody td.desc { color: #1e293b; }
  .items tbody td.amt { text-align: right; font-family: ui-monospace, 'Cascadia Code', Menlo, monospace; }
  .items tbody tr.alt td { background: #f8fafc; }

  /* Total */
  .total-box {
    display: flex; justify-content: flex-end; margin: 20px 0 12px;
  }
  .total-inner {
    background: linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%);
    padding: 14px 24px; border-radius: 10px; text-align: right; min-width: 280px;
    border: 1px solid #bfdbfe;
  }
  .total-inner .lbl { font-size: 12px; color: #2864c8; font-weight: 600; }
  .total-inner .val { font-size: 22px; font-weight: 700; color: #2864c8; margin-top: 4px; font-family: ui-monospace, monospace; }
  .baht-text { text-align: right; font-size: 12px; color: #475569; font-style: italic; margin-bottom: 20px; }

  /* Payment + notes */
  .info-row { display: flex; gap: 20px; margin: 16px 0; font-size: 12px; color: #64748b; }
  .info-row .k { font-weight: 600; color: #1e293b; }
  .notes { padding: 10px 14px; background: #fffbeb; border-left: 3px solid #f59e0b; margin: 12px 0; font-size: 12px; color: #78350f; border-radius: 4px; }

  /* Footer */
  .foot { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .foot .note { font-size: 11px; color: #94a3b8; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px dashed #94a3b8; width: 220px; padding-top: 6px; font-size: 11px; color: #64748b; }
  .sig-name { font-size: 11px; color: #475569; margin-top: 4px; }

  .bottom { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }

  /* VOID watermark */
  .void-mark {
    position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 140px; font-weight: 900; color: #dc2626; opacity: 0.15; pointer-events: none;
    letter-spacing: 8px;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-outline" onclick="window.close()">ปิด</button>
    <button class="btn" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
  </div>

  <div class="paper">
    ${voidWatermark}

    <div class="head">
      <div class="company">
        <div class="name-th">${esc(COMPANY.nameTh)}</div>
        <div class="name-en">${esc(COMPANY.nameEn)}</div>
        <div class="info">
          เลขทะเบียนนิติบุคคล: ${esc(COMPANY.regNo)}<br>
          ${esc(COMPANY.address)}
        </div>
      </div>
      <div class="title-box">
        <h1>ใบเสร็จรับเงิน</h1>
        <div class="sub">RECEIPT</div>
        <div class="meta">
          <div class="row"><span class="lbl">เลขที่ / No.</span><span class="val">${esc(receipt.receiptNo)}</span></div>
          <div class="row"><span class="lbl">วันที่ / Date</span><span class="val">${fmtDateTh(receipt.issuedAt)}</span></div>
        </div>
      </div>
    </div>

    <div class="customer">
      <div class="lbl">ลูกค้า / Customer</div>
      <div class="name">${esc(receipt.customer.name) || '-'}</div>
      ${receipt.customer.nationalId ? `<div class="row"><b>เลขบัตรประชาชน:</b> ${esc(receipt.customer.nationalId)}</div>` : ''}
      ${addr ? `<div class="row"><b>ที่อยู่:</b> ${esc(addr)}</div>` : ''}
      ${contact ? `<div class="row">${esc(contact)}</div>` : ''}
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>รายการ / Description</th>
          <th class="right">จำนวนเงิน (บาท)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-inner">
        <div class="lbl">รวมเป็นเงินทั้งสิ้น</div>
        <div class="val">${fmtMoney(receipt.total)}</div>
      </div>
    </div>
    <div class="baht-text">(${esc(bahtText(receipt.total))})</div>

    <div class="info-row">
      <div><span class="k">วิธีการชำระเงิน:</span> ${esc(receipt.paymentMethod || 'เงินสด')}</div>
    </div>

    ${receipt.notes ? `<div class="notes"><b>หมายเหตุ:</b> ${esc(receipt.notes)}</div>` : ''}

    <div class="foot">
      <div class="note">
        บริษัทฯ ได้รับเงินจำนวนดังกล่าวไว้ถูกต้องแล้ว
      </div>
    </div>

    <div class="bottom">
      <div>เอกสารนี้ออกโดยระบบอิเล็กทรอนิกส์</div>
      <div>${esc(appName)}</div>
    </div>
  </div>

  <script>
    // Auto-focus print dialog if ?print=1 query param
    if (new URLSearchParams(location.search).get('print') === '1') {
      window.addEventListener('load', () => setTimeout(() => window.print(), 300));
    }
  </script>
</body>
</html>`
}

module.exports = { generateReceiptHtml, COMPANY }
