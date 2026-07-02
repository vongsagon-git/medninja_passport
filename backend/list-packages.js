const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { connectDB } = require('./src/shared/config/db')
const Package = require('./src/modules/content/Package.model')
const Activation = require('./src/modules/activation/Activation.model')

;(async () => {
  await connectDB()
  const pkgs = await Package.find({}).sort({ order: 1, title: 1 }).lean()
  console.log(`\nPackages ทั้งหมด (${pkgs.length}):`)
  pkgs.forEach(p => console.log(`  ${p._id} | order=${p.order} | published=${p.isPublished} | "${p.title}"`))

  // activations ของ อรนลิน
  const userId = '69d85ac8d68ec3c98f5f42b9'
  const acts = await Activation.find({ userId }).lean()
  console.log(`\nActivations ของ อรนลิน (${acts.length}):`)
  for (const a of acts) {
    const p = await Package.findById(a.packageId).lean()
    console.log(`  ${a._id} | active=${a.isActive} | exp=${a.expiresAt && a.expiresAt.toISOString().slice(0,10)} | pkg="${p ? p.title : '?'}"`)
  }
  process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
