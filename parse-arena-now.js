require('./backend/node_modules/dotenv').config()
const mongoose = require('./backend/node_modules/mongoose')

const uri = process.env.MONGODB_URI_LMS
const conn = mongoose.createConnection(uri)

const schema = new mongoose.Schema({
  num: Number, ddx: String, ddxTh: String, buzzwords: String,
  relatedCC: String, relatedCCEn: String,
  history: String, pe: String, investigation: String,
  isActive: Boolean, isAudited: Boolean
}, { timestamps: true, strict: false })

const ArenaCard = conn.model('ArenaCard', schema)

// ═══ RULES: คำไหนเป็น History / PE / Investigation ═══
const PE_KEYWORDS = [
  // Signs
  'sign', 'murphy', 'mcburney', 'rovsing', 'psoas', 'obturator', 'kernig', 'brudzinski',
  'babinski', 'chvostek', 'trousseau', 'tinel', 'phalen', 'dix-hallpike', 'romberg',
  'homan', 'nikolsky', 'auspitz', 'koebner', 'stemmer', 'levine',
  // Physical findings
  'murmur', 'gallop', 'rub', 'crackle', 'crepitation', 'wheeze', 'stridor', 'bruit',
  'tender', 'rigidity', 'guarding', 'rebound', 'distension', 'distended',
  'hepatomegaly', 'splenomegaly', 'lymphadenopathy', 'edema', 'ascites',
  'jaundice', 'cyanosis', 'pallor', 'clubbing', 'petechiae', 'purpura',
  'exophthalmos', 'ptosis', 'nystagmus', 'papilledema', 'fundoscop',
  'barrel chest', 'spider nevi', 'palmar erythema', 'malar rash', 'butterfly',
  'tophi', 'nodule', 'node', 'goiter', 'thyromegaly',
  'moon face', 'buffalo hump', 'striae', 'acanthosis',
  'pulse', 'pulsus', 'jvp', 'jvd', 'jugular',
  'dullness', 'percussion', 'hyperresonance', 'fremitus',
  'breath sound', 'heart sound', 'muffled', 'absent',
  'tracheal deviation', 'trachea',
  'gcs', 'motor power', 'reflex', 'dtr', 'areflexia',
  'sensory', 'dermatomal', 'stocking-glove',
  'rash', 'vesicle', 'bullae', 'ulcer', 'eschar', 'chancre', 'plaque',
  'on exam', 'on palpation', 'reproducible', 'warm', 'cool', 'swollen',
  'bp ', 'blood pressure', 'hr ', 'heart rate', 'rr ', 'spo2', 'temperature',
  'fever', 'hypothermia', 'tachycardia', 'bradycardia', 'hypotension', 'hypertension',
  'oliguria', 'anuria',
  // Specific exam maneuvers
  'ice pack test', 'valsalva', 'carotid massage',
  'shifted', 'deviation', 'asymmetri',
]

const IX_KEYWORDS = [
  // Labs
  'ecg', 'ekg', 'st elevation', 'st depression', 'qt ', 'qrs', 'p wave', 'u wave',
  'peaked t', 'wide qrs', 'narrow qrs',
  'troponin', 'bnp', 'ck', 'd-dimer', 'fibrinogen',
  'wbc', 'hb', 'plt', 'mcv', 'ferritin', 'tibc', 'iron', 'retic',
  'bun', 'creatinine', 'cr ', 'gfr', 'fena',
  'ast', 'alt', 'alp', 'ggt', 'bilirubin', 'albumin', 'protein',
  'tsh', 'ft4', 't4', 't3',
  'pth', 'calcium', 'ca ', 'phosph', 'vitamin d',
  'sodium', 'potassium', 'na ', 'k ', 'hco3', 'ag ',
  'glucose', 'hba1c', 'ketone', 'insulin', 'c-peptide',
  'cortisol', 'acth', 'aldosterone', 'renin', 'metanephrine',
  'ana', 'anti-ds', 'anti-ccp', 'rf ', 'anca', 'anti-gbm',
  'coombs', 'haptoglobin', 'ldh', 'schistocyte', 'spherocyte',
  'blood smear', 'thick smear', 'thin smear', 'peripheral smear',
  'blast', 'auer rod', 'reed-sternberg', 'smudge cell',
  'urine', 'ua ', 'proteinuria', 'cast', 'rbc cast', 'muddy brown',
  'culture', 'gram stain', 'koh', 'sensitivity',
  // Imaging
  'ct ', 'mri', 'x-ray', 'cxr', 'ultrasound', 'doppler', 'echo',
  'endoscop', 'colonoscop', 'bronchoscop', 'cystoscop',
  'barium', 'angiogra', 'arteriogra',
  'biopsy', 'aspirat', 'cytology', 'histolog',
  // Scores & criteria
  'wells', 'light criteria', 'ranson', 'curb-65', 'apache',
  'abi', 'pft', 'fev1', 'fvc', 'spirometry',
  'lp ', 'lumbar puncture', 'csf', 'xanthochromia', 'oligoclonal',
  'eeg', 'emg', 'ncv',
  // Specific test results
  'positive', 'negative', 'elevated', 'decreased', 'low', 'high', 'normal',
  '↑', '↓', 'raised', 'reduced',
  'ab ', 'antibod', 'antigen', 'titer',
  'ca 19-9', 'ca-125', 'cea', 'afp', 'psa',
  'rpr', 'vdrl', 'fta',
  'heterophile', 'monospot',
]

// ═══ Parse function ═══
function parseBuzzwords(buzzwords) {
  const parts = buzzwords.split(/,\s*/).map(s => s.trim()).filter(Boolean)
  const history = []
  const pe = []
  const ix = []

  for (const part of parts) {
    const lower = part.toLowerCase()

    const isPE = PE_KEYWORDS.some(kw => lower.includes(kw))
    const isIx = IX_KEYWORDS.some(kw => lower.includes(kw))

    if (isIx && !isPE) {
      ix.push(part)
    } else if (isPE && !isIx) {
      pe.push(part)
    } else if (isPE && isIx) {
      // both — ECG findings go to IX, physical signs go to PE
      if (/ecg|ekg|st |qrs|troponin|bnp|ct |mri|x-ray|cxr|lab|biopsy|↑|↓/i.test(lower)) {
        ix.push(part)
      } else {
        pe.push(part)
      }
    } else {
      // default = history (symptoms, demographics, risk factors, timing)
      history.push(part)
    }
  }

  return {
    history: history.join(', '),
    pe: pe.join(', '),
    investigation: ix.join(', ')
  }
}

async function run() {
  await conn.asPromise()
  console.log('Connected!')

  const cards = await ArenaCard.find({}).lean()
  console.log(`Parsing ${cards.length} cards...`)

  let updated = 0
  for (const card of cards) {
    if (!card.buzzwords) continue
    const parsed = parseBuzzwords(card.buzzwords)

    await ArenaCard.updateOne({ _id: card._id }, {
      $set: {
        history: parsed.history,
        pe: parsed.pe,
        investigation: parsed.investigation
      }
    })
    updated++
  }

  console.log(`\n=== DONE: Updated ${updated} cards ===`)

  // Show samples
  const samples = await ArenaCard.find({ history: { $ne: '' } }).limit(5).lean()
  for (const s of samples) {
    console.log(`\n─── ${s.ddx} ───`)
    console.log(`  Buzzwords: ${s.buzzwords}`)
    console.log(`  History:   ${s.history}`)
    console.log(`  PE:        ${s.pe}`)
    console.log(`  Ix:        ${s.investigation}`)
  }

  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
