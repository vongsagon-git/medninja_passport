/**
 * Seed Self Check templates จาก .docx files ที่ extract ไว้แล้ว
 * - อ่าน docx → extract text → parse เป็น sections + items → upsert template
 * - preserve item id เดิม (match by text) → progress ของนักเรียนไม่หาย
 *
 * Usage:
 *   node backend/src/scripts/seed-selfcheck-from-docx.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { connectDB } = require('../shared/config/db')
const SelfCheckTemplate = require('../modules/selfcheck/SelfCheckTemplate.model')

const genId = (p) => `${p}_${crypto.randomBytes(4).toString('hex')}`

// ─── DOCX → plain text paragraphs ───
// ใช้ regex อ่าน XML ที่ extract ไว้ (ไม่ต้อง dep ใหม่)
function docxToParagraphs(extractedDir) {
  const xmlPath = path.join(extractedDir, 'word', 'document.xml')
  const xml = fs.readFileSync(xmlPath, 'utf8')
  const paragraphs = []
  // แต่ละ <w:p> ... </w:p> = 1 paragraph
  const pRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
  let m
  while ((m = pRe.exec(xml)) !== null) {
    const inner = m[1]
    const tRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
    let t
    let text = ''
    while ((t = tRe.exec(inner)) !== null) {
      text += t[1]
    }
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()
    if (text) paragraphs.push(text)
  }
  return paragraphs
}

// ─── parse paragraphs → sections + items ───
// pattern: section = ขึ้นต้นด้วยตัวเลข "1. " หรือ "X. " และมีข้อความหัวเรื่อง
//          items = ปกติ paragraph อื่นๆ ที่ตามมา จนเจอ section ใหม่
//          ข้อแรกของไฟล์ (title + tagline) จะ skip โดยอัตโนมัติ
function parseParagraphs(paragraphs, opts = {}) {
  const sections = []
  let current = null

  // หา header section: เริ่มด้วย "<num>. " และมีอักษรต่อจากเลข
  const isSection = (s) => /^\d+(\.\d+)?\.?\s+\S/.test(s) && !/^[•\-–·●]\s/.test(s)
  // ตัด bullet ออก
  const stripBullet = (s) => s.replace(/^[•\-–·●○▪]\s*/, '').replace(/^\d+\)\s*/, '').trim()

  for (const raw of paragraphs) {
    const p = raw.trim()
    if (!p) continue
    // ข้าม separator line "_____" หรือ "------"
    if (/^[_\-=]{3,}$/.test(p)) continue
    // ข้าม "MedNinja <Subject> Readiness Checklist"
    if (/MedNinja\s+\w+\s+Readiness\s+Checklist/i.test(p)) continue

    if (isSection(p)) {
      current = { id: genId('sec'), title: p, items: [] }
      sections.push(current)
    } else if (current) {
      // มัน item — append ถ้า current section อยู่
      const text = stripBullet(p)
      if (text && text.length > 2) {
        current.items.push({ id: genId('itm'), text })
      }
    }
  }
  // กรอง section ที่ไม่มี item ออก
  return sections.filter(s => s.items.length > 0)
}

// ─── subject config: slug, name, tagline, icon, color ───
const SUBJECTS = [
  { dir: 'Endo',       slug: 'endocrinology-readiness', name: 'Endocrinology Readiness Checklist', icon: '🧪', color: '#0ea5e9' },
  { dir: 'GI',         slug: 'gi-readiness',            name: 'GI Readiness Checklist',            icon: '🫃', color: '#f59e0b' },
  { dir: 'Gyne',       slug: 'gyne-readiness',          name: 'Gynecology Readiness Checklist',    icon: '🌸', color: '#ec4899' },
  { dir: 'Hematology', slug: 'hematology-readiness',    name: 'Hematology Readiness Checklist',    icon: '🩸', color: '#dc2626' },
  { dir: 'Nephrology', slug: 'nephrology-readiness',    name: 'Nephrology Readiness Checklist',    icon: '💧', color: '#3b82f6' },
  { dir: 'Neurology',  slug: 'neurology-readiness',     name: 'Neurology Readiness Checklist',     icon: '🧠', color: '#a855f7' },
  { dir: 'Obstetric',  slug: 'obstetrics-readiness',    name: 'Obstetrics Readiness Checklist',    icon: '🤰', color: '#f43f5e' },
  { dir: 'Resp',       slug: 'respiratory-readiness',   name: 'Respiratory Readiness Checklist',   icon: '🫁', color: '#06b6d4' },
  { dir: 'Surgery',    slug: 'surgery-readiness',       name: 'Surgery Readiness Checklist',       icon: '🔪', color: '#475569' },
  { dir: 'ENT',        slug: 'ent-readiness',           name: 'ENT Readiness Checklist',           icon: '👂', color: '#14b8a6' },
  { dir: 'ER',         slug: 'er-readiness',            name: 'ER Readiness Checklist',            icon: '🚑', color: '#ef4444' },
  { dir: 'Eye',        slug: 'ophthalmology-readiness', name: 'Ophthalmology Readiness Checklist', icon: '👁️', color: '#8b5cf6' },
  { dir: 'Ortho',      slug: 'orthopedics-readiness',   name: 'Orthopedics Readiness Checklist',   icon: '🦴', color: '#78716c' },
  { dir: 'Ped',        slug: 'pediatrics-readiness',    name: 'Pediatrics Readiness Checklist',    icon: '👶', color: '#fbbf24' }
]

const EXTRACT_BASE = path.resolve(__dirname, '../../../../../_docx_extract')

async function run() {
  await connectDB()
  console.log(`[seed-from-docx] extract base: ${EXTRACT_BASE}`)
  console.log(`[seed-from-docx] ${SUBJECTS.length} subjects to seed\n`)

  let totalCreated = 0
  let totalUpdated = 0

  for (const sub of SUBJECTS) {
    const dir = path.join(EXTRACT_BASE, sub.dir)
    if (!fs.existsSync(path.join(dir, 'word', 'document.xml'))) {
      console.log(`  ⚠ skip ${sub.dir} — ไม่พบ document.xml`)
      continue
    }
    const paragraphs = docxToParagraphs(dir)
    const parsed = parseParagraphs(paragraphs)
    if (!parsed.length) {
      console.log(`  ⚠ skip ${sub.dir} — parse ไม่เจอ sections`)
      continue
    }

    // tagline = paragraph แรกที่ขึ้นต้นไม่ใช่เลข + ก่อน section แรก
    let tagline = ''
    for (const p of paragraphs) {
      if (/^\d+(\.\d+)?\.?\s+\S/.test(p.trim())) break
      if (/MedNinja\s+\w+\s+Readiness/i.test(p)) continue
      if (/^[_\-=]{3,}$/.test(p)) continue
      tagline = p.trim()
      if (tagline.length > 30) break    // เอาตัวที่ดูเหมือน tagline ยาวพอ
    }
    if (tagline.length > 200) tagline = tagline.slice(0, 197) + '...'

    // ─── preserve existing IDs ───
    const existing = await SelfCheckTemplate.findOne({ slug: sub.slug }).lean()
    const existingIdMap = {}
    const existingSecIdMap = {}
    if (existing) {
      for (const sec of (existing.sections || [])) {
        existingSecIdMap[sec.title] = sec.id
        for (const item of (sec.items || [])) {
          existingIdMap[`${sec.title}::${item.text}`] = item.id
        }
      }
    }
    const finalSections = parsed.map(s => ({
      id: existingSecIdMap[s.title] || s.id,
      title: s.title,
      items: s.items.map(i => ({
        id: existingIdMap[`${s.title}::${i.text}`] || i.id,
        text: i.text
      }))
    }))

    const total = finalSections.reduce((sum, s) => sum + s.items.length, 0)
    const payload = {
      slug: sub.slug,
      name: sub.name,
      tagline: tagline || 'เช็กให้ชัวร์ก่อนสอบ',
      icon: sub.icon,
      color: sub.color,
      sections: finalSections,
      isPublished: true
    }
    await SelfCheckTemplate.findOneAndUpdate(
      { slug: sub.slug },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    const verb = existing ? 'updated' : 'created'
    if (existing) totalUpdated++; else totalCreated++
    console.log(`  ✓ ${verb.padEnd(8)} ${sub.icon} ${sub.name.padEnd(48)} — ${finalSections.length} หมวด, ${total} ข้อ`)
  }

  console.log(`\n[seed-from-docx] ✅ Done`)
  console.log(`  • Created: ${totalCreated}`)
  console.log(`  • Updated: ${totalUpdated}`)
  process.exit(0)
}

run().catch(err => {
  console.error('[seed-from-docx] ❌ ERROR:', err)
  process.exit(1)
})
