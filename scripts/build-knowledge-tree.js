#!/usr/bin/env node
/**
 * build-knowledge-tree.js
 *
 * อ่าน pnut_knowledge.md + siriraj_knowledge.md
 * → merge เป็น JSON tree เดียว
 * → เขียนออก frontend/src/data/knowledge-tree.json
 *
 * Output schema:
 *   {
 *     systems: [
 *       { id, label, labelTh, icon, color, topics: [
 *         { id, label, labelTh, summary, content: {
 *           ddxTree: <Node>,  // หากมี
 *           keyPoints: string[],
 *           redFlags: string[],
 *           workup: string[],
 *           treatment: string[],
 *           tables: [{ headers, rows }],
 *           sections: [{ heading, body }],
 *         }}
 *       ]}
 *     ],
 *     index: [{ id, label, labelTh, systemId, topicId, aliases: string[] }],
 *     stats: { systems, topics, generatedAt }
 *   }
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'frontend', 'src', 'data')
const PNUT = path.join(DATA, 'pnut_knowledge.md')
const SIR = path.join(DATA, 'siriraj_knowledge.md')
const OUT = path.join(DATA, 'knowledge-tree.json')

// ──────────────────────────────────────────────
// System taxonomy (merged) — เลือกตามมาตรฐานสากล
// ──────────────────────────────────────────────
const SYSTEMS = [
  { id: 'general',  label: 'General Approach',    labelTh: 'แนวทางทั่วไป',         icon: '🩺', color: '#64748b' },
  { id: 'cardio',   label: 'Cardiovascular',      labelTh: 'หัวใจและหลอดเลือด',     icon: '❤️', color: '#ef4444' },
  { id: 'resp',     label: 'Respiratory',         labelTh: 'ระบบหายใจ',            icon: '🫁', color: '#3b82f6' },
  { id: 'gi',       label: 'Gastrointestinal',    labelTh: 'ทางเดินอาหาร',         icon: '🍽️', color: '#f97316' },
  { id: 'renal',    label: 'Renal & Urinary',     labelTh: 'ไตและทางเดินปัสสาวะ',   icon: '💧', color: '#06b6d4' },
  { id: 'endo',     label: 'Endocrine',           labelTh: 'ต่อมไร้ท่อ',           icon: '⚗️', color: '#a855f7' },
  { id: 'hema',     label: 'Hematology',          labelTh: 'โลหิตวิทยา',           icon: '🩸', color: '#dc2626' },
  { id: 'id',       label: 'Infectious Disease',  labelTh: 'โรคติดเชื้อ',          icon: '🦠', color: '#84cc16' },
  { id: 'rheum',    label: 'Rheumatology',        labelTh: 'รูมาติสซั่ม',          icon: '🦴', color: '#eab308' },
  { id: 'neuro',    label: 'Neurology',           labelTh: 'ระบบประสาท',           icon: '🧠', color: '#8b5cf6' },
  { id: 'derm',     label: 'Dermatology',         labelTh: 'ผิวหนัง',             icon: '🩹', color: '#f59e0b' },
  { id: 'psych',    label: 'Psychiatry',          labelTh: 'จิตเวช',              icon: '🧘', color: '#10b981' },
  { id: 'emerg',    label: 'Emergency',           labelTh: 'ฉุกเฉิน',              icon: '🚨', color: '#dc2626' },
  { id: 'misc',     label: 'Miscellaneous',       labelTh: 'อื่นๆ',                icon: '📋', color: '#6b7280' },
]

const SYSTEM_INDEX = Object.fromEntries(SYSTEMS.map(s => [s.id, { ...s, topics: [] }]))

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const slug = (s) => s.toLowerCase()
  .replace(/[^\w\s฀-๿-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80)

function classifySystem(text) {
  const t = text.toLowerCase()
  if (/chest pain|palpitation|syncope|heart failure|hypertension|pericard|cardio|claudication|aortic|valv/i.test(t)) return 'cardio'
  if (/dyspnea|cough|hemoptysis|cyanosis|clubbing|pleural|asthma|copd|pneum|respir|หายใจ|ไอ|เหนื่อย|หอบ/i.test(t)) return 'resp'
  if (/jaundice|dysphagia|vomit|hiccup|hemorrhage|diarrhea|ascites|abdomin|dyspepsia|ดีซ่าน|กลืน|อาเจียน|สะอึก|ท้อง|ปวดท้อง|ดิสเป็ปเซีย/i.test(t)) return 'gi'
  if (/urine|hematuria|protein|nephr|polyuria|oliguria|azotem|edema|renal|urinary|ปัสสาวะ|บวม/i.test(t)) return 'renal'
  if (/short stature|tall stature|thyroid|hypoglyc|gynecom|nipple|amenorrhea|hirsut|endocr|diabetes|ตัวเตี้ย|ตัวสูง|น้ำตาล|เต้านม|ประจำเดือน|ขนดก/i.test(t)) return 'endo'
  if (/anemia|hemolytic|pancytopenia|bleeding|platelet|thrombocyt|coagulop|thrombo|lymphadenop|splenom|ซีด|เกล็ดเลือด|เลือดออก|ต่อมน้ำเหลือง|ม้าม/i.test(t)) return 'hema'
  if (/fever|fuo|sepsis|infect|ไข้/i.test(t)) return 'id'
  if (/joint|back pain|raynaud|arthrit|rheum|ปวดข้อ|ปวดหลัง/i.test(t)) return 'rheum'
  if (/headache|seizure|consciousness|delirium|weakness|spinal|peripheral neurop|movement|visual|ptosis|vertigo|stroke|epilepsy|cognit|sleep|ปวดศีรษะ|ชัก|อ่อนแรง|เวียน|หมดสติ|สมอง|หนังตา/i.test(t)) return 'neuro'
  if (/skin|rash|dermat|ผิวหนัง|ผื่น/i.test(t)) return 'derm'
  if (/depression|anxiety|psych|จิต/i.test(t)) return 'psych'
  if (/shock|emergency|resuscit|ช็อก|ฉุกเฉิน/i.test(t)) return 'emerg'
  if (/weight loss|weight gain|obes|interview|approach to patient|history|delirium|น้ำหนัก|ซักประวัติ|สัมภาษณ์|ผู้ป่วย/i.test(t)) {
    if (/interview|approach to patient|history|ซักประวัติ|สัมภาษณ์|ผู้ป่วย/i.test(t)) return 'general'
    return 'misc'
  }
  return 'misc'
}

// Parse ASCII tree like:
//   Chest pain
//   ├── Cardiac
//   │   ├── Ischemic
//   │   │   └── ACS
//   └── Non-Cardiac
function parseAsciiTree(lines) {
  // Strip blank lines + the ``` fence already removed by caller.
  const body = lines.filter(l => l.length > 0)
  if (!body.length) return null

  const root = { label: body[0].trim(), children: [] }
  const stack = [{ depth: -1, node: root }]

  for (let i = 1; i < body.length; i++) {
    const line = body[i]
    // depth = count groups of 4 chars before the branch char
    // chars used: │ ─ ├ └ space ·
    const m = line.match(/^([│\s]*)([├└])──\s*(.+)$/)
    if (!m) continue
    const prefix = m[1]
    const label = m[3].trim()
    // depth = number of │/spaces blocks (each block ~4 chars) → use length / 4
    const depth = Math.floor(prefix.length / 4)

    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop()
    const parent = stack[stack.length - 1]?.node || root
    const node = { label, children: [] }
    parent.children.push(node)
    stack.push({ depth, node })
  }
  return root
}

// ──────────────────────────────────────────────
// Parse P'Nut
// ──────────────────────────────────────────────
function parsePnut(md) {
  const topics = []
  const lines = md.split(/\r?\n/)
  let cur = null
  let inDdxFence = false
  let ddxBuf = []
  let bufSection = null   // 'key' | 'workup' | 'tx' | null
  let bufList = []

  function flushSection() {
    if (!cur || !bufSection) return
    if (!cur.content[bufSection]) cur.content[bufSection] = []
    cur.content[bufSection].push(...bufList)
    bufList = []
  }
  function flushTopic() {
    if (!cur) return
    flushSection()
    if (ddxBuf.length) {
      cur.content.ddxTree = parseAsciiTree(ddxBuf)
      ddxBuf = []
    }
    topics.push(cur)
    cur = null
    inDdxFence = false
    bufSection = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // New topic: "## 1.1 Chest Pain — ..."
    const topicMatch = line.match(/^##\s+(\d+\.\d+)\s+(.+)$/)
    if (topicMatch) {
      flushTopic()
      const num = topicMatch[1]
      const rawLabel = topicMatch[2].trim()
      const parts = rawLabel.split(/\s*—\s*/)
      cur = {
        num,
        label: parts[0].trim(),
        labelTh: parts[1] ? parts[1].trim() : '',
        sources: ['pnut'],
        content: { sections: [], keyPoints: [], redFlags: [], workup: [], treatment: [], tables: [], ddxTree: null },
      }
      continue
    }

    if (!cur) continue

    // Subheading within topic (### ...)
    const subMatch = line.match(/^###\s+(.+)$/)
    if (subMatch) {
      flushSection()
      const h = subMatch[1].trim()
      if (/DDx Algorithm/i.test(h)) {
        bufSection = null
      } else if (/Key Points?/i.test(h)) {
        bufSection = 'keyPoints'
      } else if (/Red Flag/i.test(h)) {
        bufSection = 'redFlags'
      } else if (/Workup|Investigation/i.test(h)) {
        bufSection = 'workup'
      } else if (/Treatment|Management/i.test(h)) {
        bufSection = 'treatment'
      } else {
        // generic section
        bufSection = null
        cur.content.sections.push({ heading: h, body: '' })
      }
      continue
    }

    // ```...``` fenced (DDx tree)
    if (line.trim() === '```') {
      if (!inDdxFence) {
        inDdxFence = true
        ddxBuf = []
      } else {
        inDdxFence = false
      }
      continue
    }
    if (inDdxFence) {
      ddxBuf.push(line)
      continue
    }

    // Bullet within section
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      if (bufSection) {
        bufList.push(bullet[1].trim())
      } else if (cur.content.sections.length) {
        const last = cur.content.sections[cur.content.sections.length - 1]
        last.body += (last.body ? '\n' : '') + line
      }
      continue
    }

    // Generic text
    if (line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
      if (cur.content.sections.length && !bufSection) {
        const last = cur.content.sections[cur.content.sections.length - 1]
        last.body += (last.body ? '\n' : '') + line
      }
    }
  }
  flushTopic()
  return topics
}

// ──────────────────────────────────────────────
// Parse Siriraj — heading-based
// ──────────────────────────────────────────────
function parseSiriraj(md) {
  const topics = []
  const lines = md.split(/\r?\n/)
  let cur = null
  let curSection = null
  let inTable = false
  let tableBuf = []

  function flushTable() {
    if (tableBuf.length < 2 || !cur) { tableBuf = []; inTable = false; return }
    const splitRow = (line) => {
      const split = line.split('|').map(c => c.trim())
      if (split[0] === '') split.shift()
      if (split.length && split[split.length - 1] === '') split.pop()
      return split
    }
    const headers = splitRow(tableBuf[0])
    const rows = []
    for (let i = 2; i < tableBuf.length; i++) {
      const cells = splitRow(tableBuf[i])
      if (cells.length) rows.push(cells)
    }
    cur.content.tables.push({ headers, rows })
    tableBuf = []
    inTable = false
  }

  function flushTopic() {
    if (!cur) return
    flushTable()
    topics.push(cur)
    cur = null
    curSection = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // New chapter/topic: "## บทที่ N: ..." OR "## บทที่ 22 (ต่อ): ..."
    const topicMatch = line.match(/^##\s+บทที่\s+(\d+)(?:\s*\([^)]+\))?\s*:\s*(.+?)(?:\s*\([^)]*หน้า[^)]*\))?\s*$/)
    if (topicMatch) {
      flushTopic()
      const num = topicMatch[1]
      const rawLabel = topicMatch[2].trim().replace(/\s*\(หน้า[^)]+\)\s*$/, '')
      const parts = rawLabel.split(/\s*—\s*/)
      const labelTh = parts[0].trim()
      const labelEn = parts[1] ? parts[1].trim() : ''

      // ignore duplicate continuation chapters: keep accumulating to existing
      const existing = topics.find(t => t.num === num && t.sources.includes('siriraj'))
      if (existing) {
        cur = existing
      } else {
        cur = {
          num,
          label: labelEn || labelTh,
          labelTh: labelTh,
          sources: ['siriraj'],
          content: { sections: [], keyPoints: [], redFlags: [], workup: [], treatment: [], tables: [], ddxTree: null },
        }
      }
      curSection = null
      continue
    }

    if (!cur) continue

    // skip nested headings like "### / #### / #####" → store as nested section text
    const subMatch = line.match(/^(#{3,6})\s+(.+)$/)
    if (subMatch) {
      flushTable()
      const level = subMatch[1].length
      const heading = subMatch[2].trim()
      const cleanHeading = heading.replace(/^[\d.]+\s*/, '')
      // detect special sections
      if (/Red Flag/i.test(heading)) {
        curSection = { type: 'redFlags' }
      } else if (/Key Points?/i.test(heading) || /สรุป|จุดสำคัญ/.test(heading)) {
        curSection = { type: 'keyPoints' }
      } else if (/Workup|Investigation|การส่งตรวจ|ตรวจเพิ่มเติม/i.test(heading)) {
        curSection = { type: 'workup' }
      } else if (/Treatment|Management|การรักษา/i.test(heading)) {
        curSection = { type: 'treatment' }
      } else {
        const newSec = { heading: cleanHeading, level, body: '' }
        cur.content.sections.push(newSec)
        curSection = { type: 'section', node: newSec }
      }
      continue
    }

    // Table?
    if (line.trim().startsWith('|')) {
      inTable = true
      tableBuf.push(line)
      continue
    } else if (inTable) {
      flushTable()
    }

    // Bullets
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet && curSection) {
      if (curSection.type === 'redFlags') cur.content.redFlags.push(bullet[1].trim())
      else if (curSection.type === 'keyPoints') cur.content.keyPoints.push(bullet[1].trim())
      else if (curSection.type === 'workup') cur.content.workup.push(bullet[1].trim())
      else if (curSection.type === 'treatment') cur.content.treatment.push(bullet[1].trim())
      else if (curSection.type === 'section') {
        curSection.node.body += (curSection.node.body ? '\n' : '') + line
      }
      continue
    }

    // Generic text
    if (line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
      if (curSection?.type === 'section') {
        curSection.node.body += (curSection.node.body ? '\n' : '') + line
      }
    }
  }
  flushTopic()
  return topics
}

// ──────────────────────────────────────────────
// Merge by key (normalized label)
// ──────────────────────────────────────────────
const SYNONYMS = {
  'chest pain': ['เจ็บหน้าอก', 'อาการเจ็บหน้าอก'],
  'dyspnea': ['หายใจหอบ', 'หอบเหนื่อย', 'เหนื่อย'],
  'cough': ['ไอ'],
  'hemoptysis': ['ไอเป็นเลือด'],
  'palpitation': ['ใจสั่น'],
  'syncope': ['หมดสติชั่วคราว', 'เป็นลม'],
  'headache': ['ปวดศีรษะ'],
  'jaundice': ['ดีซ่าน'],
  'anemia': ['ซีด'],
  'fever': ['ไข้'],
  'edema': ['บวม'],
  'lymphadenopathy': ['ต่อมน้ำเหลืองโต'],
  'dysphagia': ['กลืนลำบาก'],
  'vomiting': ['อาเจียน', 'คลื่นไส้'],
  'hiccup': ['สะอึก', 'hiccups'],
  'abdominal pain': ['ปวดท้อง'],
  'diarrhea': ['ท้องเดิน', 'ท้องเสีย'],
  'gastrointestinal bleeding': ['เลือดออกในทางเดินอาหาร', 'gi bleeding'],
  'hematuria': ['ปัสสาวะเป็นเลือด'],
  'polyuria': ['ปัสสาวะมาก'],
  'oliguria': ['ปัสสาวะออกน้อย', 'ปัสสาวะน้อยลง', 'reduction in urine volume'],
  'arthralgia': ['ปวดข้อ', 'joint pain'],
  'low back pain': ['ปวดหลัง', 'back pain'],
  'vertigo': ['เวียนศีรษะ'],
  'weakness': ['อ่อนแรง', 'กล้ามเนื้ออ่อนแรง'],
  'seizure': ['ชัก'],
  'consciousness alteration': ['การรู้สึกตัวผิดปกติ', 'alteration of consciousness'],
  'weight loss': ['น้ำหนักลด', 'น้ำหนักตัวลด'],
  'weight gain': ['น้ำหนักเพิ่ม', 'น้ำหนักตัวเพิ่ม', 'obesity', 'obese'],
  'movement disorder': ['การเคลื่อนไหวผิดปกติ'],
  'shock': ['ช็อก'],
  'delirium': ['เพ้อ'],
  'ascites': ['น้ำในช่องท้อง'],
  'abdominal mass': ['ก้อนในท้อง'],
  'abnormal bleeding': ['เลือดออกผิดปกติ'],
  'dyspepsia': ['ดิสเป็ปเซีย'],
}

function normalizeKey(text) {
  if (!text) return ''
  const t = text.toLowerCase().trim()
  for (const [canon, syns] of Object.entries(SYNONYMS)) {
    if (t === canon || syns.some(s => t === s.toLowerCase())) return canon
    if (t.includes(canon)) return canon
    if (syns.some(s => t.includes(s.toLowerCase()))) return canon
  }
  return t.replace(/[^\w฀-๿\s]/g, '').replace(/\s+/g, ' ').trim()
}

function mergeTopics(a, b) {
  // Merge two topic objects (same canonical symptom)
  const merged = {
    label: a.label || b.label,
    labelTh: a.labelTh || b.labelTh,
    sources: Array.from(new Set([...(a.sources || []), ...(b.sources || [])])),
    content: {
      sections: [...(a.content.sections || []), ...(b.content.sections || [])],
      keyPoints: dedupe([...(a.content.keyPoints || []), ...(b.content.keyPoints || [])]),
      redFlags: dedupe([...(a.content.redFlags || []), ...(b.content.redFlags || [])]),
      workup: dedupe([...(a.content.workup || []), ...(b.content.workup || [])]),
      treatment: dedupe([...(a.content.treatment || []), ...(b.content.treatment || [])]),
      tables: [...(a.content.tables || []), ...(b.content.tables || [])],
      ddxTree: a.content.ddxTree || b.content.ddxTree,
    },
  }
  return merged
}

const dedupe = (arr) => Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)))

// ──────────────────────────────────────────────
// Build final tree
// ──────────────────────────────────────────────
function build() {
  console.log('[parser] อ่านไฟล์...')
  const pnutMd = fs.readFileSync(PNUT, 'utf8')
  const sirMd  = fs.readFileSync(SIR, 'utf8')

  console.log('[parser] parse P\'Nut...')
  const pnutTopics = parsePnut(pnutMd)
  console.log(`  → ${pnutTopics.length} topics`)

  console.log('[parser] parse Siriraj...')
  const sirTopics = parseSiriraj(sirMd)
  console.log(`  → ${sirTopics.length} topics`)

  // Merge by canonical key
  const merged = new Map()
  const allTopics = [...pnutTopics, ...sirTopics]
  for (const t of allTopics) {
    const key = normalizeKey(t.label) || normalizeKey(t.labelTh)
    if (!key) continue
    if (merged.has(key)) {
      merged.set(key, mergeTopics(merged.get(key), t))
    } else {
      merged.set(key, t)
    }
  }

  // Assign to systems + build final shape
  const out = {
    systems: JSON.parse(JSON.stringify(SYSTEMS)).map(s => ({ ...s, topics: [] })),
    index: [],
    stats: { systems: 0, topics: 0, generatedAt: new Date().toISOString() },
  }
  const sysMap = Object.fromEntries(out.systems.map(s => [s.id, s]))

  let topicIdx = 0
  for (const [key, t] of merged.entries()) {
    const systemId = classifySystem(`${t.label} ${t.labelTh}`)
    const topicId = slug(`${key}-${topicIdx++}`)
    const topic = {
      id: topicId,
      key,
      label: t.label,
      labelTh: t.labelTh,
      sources: t.sources,
      summary: '',  // ใส่ทีหลังถ้าต้องการ
      content: t.content,
    }
    sysMap[systemId].topics.push(topic)
    out.index.push({
      id: topicId,
      label: t.label,
      labelTh: t.labelTh,
      systemId,
      aliases: SYNONYMS[key] || [],
    })
  }

  // Filter empty sections + sort
  out.systems.forEach(s => {
    for (const tp of s.topics) {
      tp.content.sections = tp.content.sections.filter(sec => (sec.body || '').trim() || (sec.heading || '').trim())
    }
    s.topics.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  })

  out.stats.systems = out.systems.filter(s => s.topics.length).length
  out.stats.topics = out.index.length

  console.log(`[parser] เขียน ${OUT}`)
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8')
  console.log(`[parser] เสร็จ: ${out.stats.systems} ระบบ, ${out.stats.topics} อาการ`)

  // Print summary
  out.systems.forEach(s => {
    if (s.topics.length) console.log(`  ${s.icon} ${s.label.padEnd(28)} ${s.topics.length} topics`)
  })
}

build()
