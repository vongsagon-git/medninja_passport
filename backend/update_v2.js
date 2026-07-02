/**
 * อัปเดต ArenaCard จาก V2 parsed JSON
 * - Match ด้วย ddx name (fuzzy) + CC group
 * - อัปเดต history (paragraph), pe, ix, decoys (5 ตัวจาก choices - answer)
 * - ถ้าไม่เจอ match → log ไว้
 */
const mongoose = require('mongoose')
const fs = require('fs')
const conn = mongoose.createConnection('mongodb+srv://doadmin:461KbE859Fhe02AL@db-mongodb-sgp1-medninja-57a9a153.mongo.ondigitalocean.com/lms?tls=true&authSource=admin')

conn.on('connected', async () => {
  console.log('Connected')
  const ArenaCard = conn.model('ArenaCard', require('./src/modules/arena/ArenaCard.model').schema)
  const v2 = JSON.parse(fs.readFileSync('./ddx_v2_parsed.json', 'utf8'))

  const allCards = await ArenaCard.find({}).lean()
  console.log(`DB cards: ${allCards.length}, V2 questions: ${v2.length}`)

  // สร้าง lookup: normalize ddx name → card
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '') }

  const dbMap = new Map()
  for (const c of allCards) {
    const key = norm(c.ddx) + '|' + norm(c.relatedCC)
    dbMap.set(key, c)
    // เพิ่ม key แบบไม่มี CC ด้วย (fallback)
    if (!dbMap.has(norm(c.ddx))) dbMap.set(norm(c.ddx), c)
  }

  let updated = 0, notFound = 0, errors = 0
  const missing = []

  for (const q of v2) {
    // หา match จาก answer name
    const key1 = norm(q.answer) + '|' + norm(q.cc)
    const key2 = norm(q.answer)
    let card = dbMap.get(key1) || dbMap.get(key2)

    if (!card) {
      // ลอง partial match
      card = allCards.find(c => norm(c.ddx) === norm(q.answer))
    }

    if (!card) {
      notFound++
      missing.push(`#${q.num} ${q.answer} (CC: ${q.cc})`)
      continue
    }

    // สร้าง decoys = choices - answer (5 ตัว)
    const decoys = q.choices.filter(c => norm(c) !== norm(q.answer))

    // อัปเดต
    const update = {
      history: [q.history],  // V2 history เป็น paragraph เดียว
      pe: q.pe ? [q.pe] : [],
      investigation: q.ix ? [q.ix] : [],
      decoys: decoys.length >= 5 ? decoys.slice(0, 6) : decoys,
      relatedCC: q.cc
    }

    // ถ้า DB ยังไม่มี relatedCCEn ก็ไม่แก้
    try {
      await ArenaCard.updateOne({ _id: card._id }, { $set: update })
      updated++
    } catch (e) {
      errors++
      console.log(`ERROR #${q.num} ${q.answer}: ${e.message}`)
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`)
  if (missing.length > 0) {
    console.log('\nMissing cards (not in DB):')
    missing.forEach(m => console.log('  ' + m))
  }

  // Verify
  const ready = await ArenaCard.countDocuments({
    isActive: true, relatedCC: { $ne: '' }, 'decoys.2': { $exists: true },
    $and: [
      { $or: [{ auditStatus: 'approved' }, { isAudited: true }] },
      { $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }] }
    ]
  })
  console.log(`\nGame-ready: ${ready}/${allCards.length}`)

  process.exit(0)
})
conn.on('error', e => { console.error('DB error:', e.message); process.exit(1) })
