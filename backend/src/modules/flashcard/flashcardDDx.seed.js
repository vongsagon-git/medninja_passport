const FlashcardDDx = require('./FlashcardDDx.model')
const FlashcardCC = require('./FlashcardCC.model')

async function seedFlashcardDDx({ force = false } = {}) {
  const existing = await FlashcardDDx.countDocuments()
  if (existing > 0 && !force) {
    console.log(`[FlashcardDDx] Already ${existing} DDx cards — skip seed`)
    return
  }

  // ดึง CC ทั้งหมดแล้วสร้าง DDx → CC mapping
  const allCC = await FlashcardCC.find().lean()
  const ddxMap = {} // { ddxName: { relatedCC: Set, category } }

  for (const cc of allCC) {
    for (const ddx of (cc.ddxList || [])) {
      if (!ddxMap[ddx]) {
        ddxMap[ddx] = { relatedCC: new Set() }
      }
      ddxMap[ddx].relatedCC.add(cc.cc)
    }
  }

  const seeds = Object.entries(ddxMap).map(([ddx, data], i) => ({
    ddx,
    ddxTh: '',
    relatedCC: [...data.relatedCC],
    clue: '',
    history: '',
    pe: '',
    investigation: '',
    category: '',
    order: i + 1,
    isActive: true,
  }))

  await FlashcardDDx.deleteMany({})
  await FlashcardDDx.insertMany(seeds)
  console.log(`[FlashcardDDx] Seeded ${seeds.length} DDx cards from ${allCC.length} CC cards`)
}

module.exports = { seedFlashcardDDx }
