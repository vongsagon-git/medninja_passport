/**
 * MedNinja LMS — NL2 Question Importer
 * Usage: node backend/src/import-nl2.js
 *
 * Imports NL2-2568-R1.json, NLE2-2568-R2.json, NLE2-2568-R3.json
 * into MongoDB as Exam + Question records.
 *
 * Requires: MONGO_URI in .env and a Mode C course already in DB.
 * If no Mode C course exists, creates one automatically.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const path = require('path')

const Course = require('./models/Course')
const Exam = require('./models/Exam')
const Question = require('./models/Question')

// ─── Transform functions ─────────────────────────────────────────

function answerTagToIndex(tag) {
  return { A: 0, B: 1, C: 2, D: 3, E: 4 }[tag.toUpperCase()] ?? 0
}

function transformQuestion(q, examId) {
  return {
    examId,
    question: q.question_text,
    choices: q.choices.map(c => c.text),
    correctAnswer: answerTagToIndex(q.answer_tag),
    explanation: q.reason || '',
    category: q.category || 'General',
    difficulty: 3,
    order: q.question_number,
    tags: [q.category].filter(Boolean)
  }
}

// ─── Files to import ─────────────────────────────────────────────

const FILES = [
  {
    file: path.join(__dirname, '../../NL2-2568-R1.json'),
    title: 'NL2 เมษายน 2568 (แบบ 1)',
    description: 'ข้อสอบใบประกอบวิชาชีพเวชกรรม NL2 รอบเมษายน 2568 ชุดที่ 1'
  },
  {
    file: path.join(__dirname, '../../NLE2-2568-R2.json'),
    title: 'NLE2 2568 (แบบ 2)',
    description: 'ข้อสอบใบประกอบวิชาชีพเวชกรรม NLE2 2568 ชุดที่ 2'
  },
  {
    file: path.join(__dirname, '../../NLE2-2568-R3.json'),
    title: 'NLE2 2568 (แบบ 3)',
    description: 'ข้อสอบใบประกอบวิชาชีพเวชกรรม NLE2 2568 ชุดที่ 3'
  }
]

// ─── Main ─────────────────────────────────────────────────────────

async function importNL2() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env')
    process.exit(1)
  }

  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB\n')

  // Find or create Mode C course
  let courseC = await Course.findOne({ mode: 'C' })
  if (!courseC) {
    courseC = await Course.create({
      title: 'ตะลุยโจทย์ NL2/NLE2 ใบประกอบวิชาชีพเวชกรรม',
      description: 'ข้อสอบจริง NL2 และ NLE2 รวม 508 ข้อ พร้อมเฉลยละเอียด',
      instructor: 'ทีม MedNinja',
      price: 3900,
      mode: 'C',
      system: 'new_2570',
      isPublished: true
    })
    console.log('📚 Created Mode C course:', courseC.title)
  } else {
    console.log('📚 Using existing Mode C course:', courseC.title)
  }

  let totalImported = 0

  for (const cfg of FILES) {
    let data
    try {
      data = require(cfg.file)
    } catch (err) {
      console.warn(`⚠️  Cannot load ${cfg.file}: ${err.message}`)
      continue
    }

    const rawQuestions = data.questions || []
    console.log(`\n📄 ${data._id} — ${rawQuestions.length} questions`)

    // Delete existing exam with same title to avoid duplicates
    await Exam.deleteOne({ courseId: courseC._id, title: cfg.title })

    // Create Exam record
    const exam = await Exam.create({
      courseId: courseC._id,
      title: cfg.title,
      description: cfg.description,
      duration: Math.ceil(rawQuestions.length * 1.5), // ~1.5 min per question
      totalQuestions: rawQuestions.length,
      passingScore: 60,
      shuffleQuestions: true,
      isPublished: true
    })
    console.log(`  ✅ Exam created: ${exam.title} (${exam._id})`)

    // Delete old questions for this exam
    await Question.deleteMany({ examId: exam._id })

    // Transform + insert questions in batches
    const transformed = rawQuestions.map(q => transformQuestion(q, exam._id))
    const BATCH = 100
    let inserted = 0

    for (let i = 0; i < transformed.length; i += BATCH) {
      const batch = transformed.slice(i, i + BATCH)
      await Question.insertMany(batch, { ordered: false })
      inserted += batch.length
      process.stdout.write(`  Inserting... ${inserted}/${transformed.length}\r`)
    }

    console.log(`  ✅ Inserted ${inserted} questions`)
    totalImported += inserted
  }

  // Show category breakdown
  console.log('\n📊 Category breakdown (all exams):')
  const cats = await Question.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  cats.forEach(c => console.log(`  ${c._id}: ${c.count} ข้อ`))

  console.log(`\n✅ Import complete! Total: ${totalImported} questions`)
  console.log('\n📋 Exams in DB:')
  const exams = await Exam.find({ courseId: courseC._id }).select('title totalQuestions')
  exams.forEach(e => console.log(`  - ${e.title} (${e.totalQuestions} ข้อ)`))

  await mongoose.disconnect()
  console.log('\n🔌 Disconnected')
}

importNL2().catch(err => {
  console.error('\n❌ Import failed:', err.message)
  process.exit(1)
})
