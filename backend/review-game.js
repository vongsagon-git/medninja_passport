const mongoose = require('mongoose')
const conn = mongoose.createConnection('mongodb+srv://doadmin:461KbE859Fhe02AL@db-mongodb-sgp1-medninja-57a9a153.mongo.ondigitalocean.com/lms?tls=true&authSource=admin')
conn.on('connected', async () => {
  const ArenaCard = conn.model('ArenaCard', require('./src/modules/arena/ArenaCard.model').schema)
  const FlashcardPattern = conn.model('FlashcardPattern', require('./src/modules/flashcard/FlashcardPattern.model').schema)
  const FlashcardCC = conn.model('FlashcardCC', require('./src/modules/flashcard/FlashcardCC.model').schema)

  const ddx = await ArenaCard.find({
    isActive: true, relatedCC: { $ne: '' }, 'decoys.2': { $exists: true },
    $and: [
      { $or: [{ auditStatus: 'approved' }, { isAudited: true }] },
      { $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }] }
    ]
  }).lean()
  const pat = await FlashcardPattern.find({ isActive: true, 'decoys.2': { $exists: true } }).lean()
  const cc = await FlashcardCC.find({ isActive: true, 'decoys.0': { $exists: true } }).lean()

  function shuffle(a) { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] } }
  shuffle(ddx); shuffle(pat); shuffle(cc)

  console.log('=== DDx ข้อ 1 ===')
  const d1 = ddx[0]
  console.log('CC:', d1.relatedCC, '(' + (d1.relatedCCEn||'') + ')')
  console.log('History:', JSON.stringify(d1.history))
  console.log('PE:', JSON.stringify(d1.pe))
  console.log('IX:', JSON.stringify(d1.investigation))
  console.log('Answer:', d1.ddx, d1.ddxTh||'')
  console.log('Decoys:', d1.decoys.slice(0,3).join(', '))

  console.log('\n=== DDx ข้อ 2 ===')
  const d2 = ddx[1]
  console.log('CC:', d2.relatedCC, '(' + (d2.relatedCCEn||'') + ')')
  console.log('History:', JSON.stringify(d2.history))
  console.log('PE:', JSON.stringify(d2.pe))
  console.log('IX:', JSON.stringify(d2.investigation))
  console.log('Answer:', d2.ddx, d2.ddxTh||'')
  console.log('Decoys:', d2.decoys.slice(0,3).join(', '))

  console.log('\n=== Pattern ข้อ 3 ===')
  const p1 = pat[0]
  console.log('Pattern:', p1.pattern)
  console.log('Answer:', p1.answer)
  console.log('Category:', p1.category)
  console.log('Mnemonic:', p1.mnemonic||'')
  console.log('Decoys:', p1.decoys.slice(0,3).join(', '))

  console.log('\n=== Pattern ข้อ 4 ===')
  const p2 = pat[1]
  console.log('Pattern:', p2.pattern)
  console.log('Answer:', p2.answer)
  console.log('Category:', p2.category)
  console.log('Mnemonic:', p2.mnemonic||'')
  console.log('Decoys:', p2.decoys.slice(0,3).join(', '))

  console.log('\n=== OddOne ข้อ 5 ===')
  const c1 = cc[0]
  console.log('CC:', c1.cc, '(' + (c1.ccEn||'') + ')')
  console.log('DDx list:', c1.ddxList.join(', '))
  console.log('Decoys:', c1.decoys.slice(0,2).join(', '))

  console.log('\n=== STATS ===')
  console.log('DDx eligible:', ddx.length)
  console.log('Pattern eligible:', pat.length)
  console.log('CC eligible:', cc.length)

  const ccGroups = [...new Set(ddx.map(d => d.relatedCC))].sort()
  console.log('CC groups:', ccGroups.length)
  console.log(ccGroups.join(' | '))

  // หา DDx ที่ยังมีปัญหา
  let issues = 0
  for (const c of ddx) {
    const h = (c.history||[]).length, p = (c.pe||[]).length, x = (c.investigation||[]).length
    if (h+p+x === 0) { issues++; console.log('NO CLUE:', c.ddx) }
    if ((c.decoys||[]).length < 3) { issues++; console.log('LOW DECOY:', c.ddx, c.decoys.length) }
  }
  console.log('\nIssues remaining:', issues)

  process.exit(0)
})
