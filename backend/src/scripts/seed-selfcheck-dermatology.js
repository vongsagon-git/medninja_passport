/**
 * Seed: Dermatology Readiness Checklist (22 หมวด, ~180 items)
 *
 * Usage:
 *   node backend/src/scripts/seed-selfcheck-dermatology.js
 *
 * - upsert template slug "dermatology-readiness"
 * - ถ้ามีอยู่แล้ว → preserve item id เดิม (match by text)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
const crypto = require('crypto')
const { connectDB } = require('../shared/config/db')
const SelfCheckTemplate = require('../modules/selfcheck/SelfCheckTemplate.model')

const genId = (p) => `${p}_${crypto.randomBytes(4).toString('hex')}`

const SECTIONS = [
  { title: '1. Basic Skin Anatomy & Dermatologic Language', items: [
    'เข้าใจโครงสร้างพื้นฐานของ epidermis, dermis, subcutaneous tissue',
    'รู้ layer สำคัญของ epidermis เช่น stratum basale, spinosum, granulosum, corneum',
    'เข้าใจหน้าที่ของ keratinocytes, melanocytes, Langerhans cells, Merkel cells',
    'ใช้ศัพท์ describe lesion ได้ เช่น macule, papule, plaque, nodule, vesicle, bulla, pustule, wheal, scale, crust, ulcer, erosion',
    'แยก primary lesion กับ secondary lesion ได้',
    'Describe rash ได้ครบ: morphology, color, border, scale, distribution, arrangement, tenderness, pruritus',
    'แยก distribution ได้ เช่น flexural, extensor, dermatomal, photo-distributed, intertriginous, acral, generalized',
    'เข้าใจว่า Dermatology ต้องเริ่มจากคำถาม: What does it look like? Where is it? How long? Itchy or painful? Any systemic symptoms?',
    'ดูรูปผื่นแล้วสร้าง differential diagnosis แบบเป็นระบบได้ ไม่เดาสุ่มจากชื่อโรค'
  ]},
  { title: '2. Approach to Rash & Skin Lesions', items: [
    'แยก rash แบบ acute, subacute, chronic ได้',
    'แยก rash แบบ localized vs generalized ได้',
    'แยก rash แบบ pruritic, painful, asymptomatic ได้',
    'แยก rash ที่มี fever/systemic symptoms จาก rash ที่เป็น skin-limited ได้',
    'รู้ว่า vesicular rash ต้องคิดถึง viral infection, allergic/contact dermatitis, autoimmune blistering disease',
    'รู้ว่า scaly plaque ต้องคิดถึง psoriasis, eczema, tinea, seborrheic dermatitis',
    'รู้ว่า target lesion ต้องคิดถึง erythema multiforme หรือ severe drug reaction ตาม context',
    'รู้ว่า palpable purpura ต้องคิดถึง small-vessel vasculitis',
    'รู้ว่า non-blanching rash ต้องคิดถึง bleeding into skin เช่น petechiae, purpura',
    'เลือก investigation ได้ เช่น KOH prep, Tzanck smear concept, bacterial culture, biopsy, patch test, Wood lamp, dermoscopy ตาม scenario',
    'รู้ว่า skin biopsy ควรเลือกเมื่อ morphology ไม่ชัด, สงสัย malignancy, autoimmune blistering disease, vasculitis หรือ severe inflammatory disease'
  ]},
  { title: '3. Eczema & Dermatitis', items: [
    'รู้จัก atopic dermatitis และเชื่อมกับ atopy, asthma, allergic rhinitis ได้',
    'รู้ distribution ของ atopic dermatitis ในเด็กและผู้ใหญ่',
    'เข้าใจว่า eczema มักเป็น itchy, erythematous, scaly หรือ lichenified lesion',
    'แยก contact dermatitis เป็น irritant vs allergic contact dermatitis ได้',
    'รู้ว่า allergic contact dermatitis เป็น type IV hypersensitivity',
    'รู้จัก nickel, poison ivy, cosmetics, topical medications เป็น common triggers',
    'รู้จัก seborrheic dermatitis และ distribution เช่น scalp, face, nasolabial folds',
    'รู้จัก nummular eczema, dyshidrotic eczema, stasis dermatitis',
    'เลือก management ได้ เช่น emollient, trigger avoidance, topical corticosteroid, calcineurin inhibitor ตาม severity/location',
    'รู้ว่า topical steroid บน face/intertriginous area ต้องระวัง side effects'
  ]},
  { title: '4. Psoriasis & Papulosquamous Disorders', items: [
    'รู้จัก psoriasis เป็น chronic immune-mediated inflammatory disease',
    'จำ classic lesion ได้: well-demarcated erythematous plaque with silvery scale',
    'รู้ distribution ของ psoriasis เช่น extensor surfaces, scalp, nails, sacral area',
    'รู้ nail findings เช่น pitting, onycholysis',
    'รู้ว่า psoriasis อาจสัมพันธ์กับ psoriatic arthritis',
    'รู้ Koebner phenomenon ในภาพรวม',
    'แยก psoriasis จาก eczema, tinea, seborrheic dermatitis ได้',
    'รู้จัก pityriasis rosea: herald patch + Christmas tree distribution',
    'รู้จัก lichen planus: pruritic, purple, polygonal, planar papules',
    'เลือก management เบื้องต้นของ psoriasis ได้ เช่น topical corticosteroid, vitamin D analog, phototherapy, systemic/biologic therapy ใน severe case'
  ]},
  { title: '5. Acne, Rosacea & Follicular Disorders', items: [
    'เข้าใจ pathogenesis ของ acne vulgaris: follicular plugging, sebum, Cutibacterium acnes, inflammation',
    'แยก acne lesions ได้ เช่น comedones, papules, pustules, nodules, cysts',
    'เลือก treatment ตาม severity ได้ เช่น benzoyl peroxide, topical retinoid, topical/oral antibiotics, hormonal therapy, isotretinoin',
    'รู้ adverse effects สำคัญของ isotretinoin โดยเฉพาะ teratogenicity และ mucocutaneous dryness',
    'แยก rosacea จาก acne ได้: facial erythema, flushing, telangiectasia, papules/pustules without comedones',
    'รู้ trigger ของ rosacea เช่น heat, alcohol, spicy food, sun exposure',
    'รู้จัก hidradenitis suppurativa: painful nodules/abscesses in intertriginous areas',
    'รู้จัก folliculitis และ furuncle/carbuncle',
    'รู้ว่า recurrent abscess ต้องคิดถึง staph colonization, diabetes, immunosuppression หรือ hidradenitis suppurativa'
  ]},
  { title: '6. Bacterial Skin Infections', items: [
    'แยก impetigo, erysipelas, cellulitis, abscess, necrotizing fasciitis ได้',
    'รู้ว่า impetigo มักมี honey-colored crust',
    'แยก nonbullous vs bullous impetigo ได้',
    'รู้ว่า erysipelas มักมี sharply demarcated raised border',
    'รู้ว่า cellulitis มักเป็น painful, warm, erythematous swelling',
    'รู้ common organisms เช่น Staphylococcus aureus และ Streptococcus pyogenes',
    'รู้ว่า abscess ต้องคิดถึง incision and drainage เป็นหลัก',
    'รู้ red flags ของ necrotizing fasciitis เช่น pain out of proportion, rapidly progressive, systemic toxicity, crepitus, skin necrosis',
    'รู้จัก staphylococcal scalded skin syndrome และ toxic shock syndrome ในภาพรวม',
    'เลือก antibiotic coverage ได้ใน common scenarios เช่น MSSA, MRSA, streptococcal infection'
  ]},
  { title: '7. Viral Skin Infections & Exanthems', items: [
    'รู้จัก HSV infection: painful grouped vesicles on erythematous base',
    'แยก HSV-1, HSV-2 และ clinical presentation สำคัญได้',
    'รู้จัก varicella-zoster virus: chickenpox vs shingles',
    'รู้ว่า shingles มักเป็น painful vesicular rash in dermatomal distribution',
    'รู้ complication ของ zoster เช่น postherpetic neuralgia, ophthalmic zoster',
    'รู้จัก molluscum contagiosum: umbilicated papules',
    'รู้จัก warts / verruca จาก HPV',
    'รู้จัก viral exanthems เช่น measles, rubella, roseola, parvovirus B19, hand-foot-mouth disease',
    'เชื่อม fever + rash + mucosal findings + vaccination status ได้',
    'รู้ว่า vesicular rash in immunocompromised patient อาจรุนแรงและต้อง treat urgently'
  ]},
  { title: '8. Fungal & Parasitic Skin Infections', items: [
    'รู้จัก dermatophyte infection / tinea เช่น tinea corporis, pedis, cruris, capitis, unguium',
    'รู้ว่า tinea corporis มักเป็น annular scaly plaque with central clearing',
    'ใช้ KOH prep เพื่อช่วยวินิจฉัย fungal infection ได้',
    'แยก tinea จาก eczema/psoriasis ได้',
    'รู้จัก candidiasis โดยเฉพาะ intertriginous rash + satellite lesions',
    'รู้จัก pityriasis versicolor / tinea versicolor และ hypopigmented/hyperpigmented scaly patches',
    'รู้ว่า tinea capitis และ onychomycosis มักต้องใช้ systemic antifungal',
    'รู้จัก scabies: intense pruritus, worse at night, burrows, interdigital spaces',
    'รู้จัก lice infestation และ treatment concept',
    'รู้ว่า household/contact treatment สำคัญใน scabies'
  ]},
  { title: '9. Urticaria, Angioedema & Allergic Skin Disease', items: [
    'รู้จัก urticaria เป็น transient itchy wheals',
    'เข้าใจว่า acute urticaria มักสัมพันธ์กับ infection, food, drug, insect sting',
    'แยก urticaria จาก fixed rash ได้จาก lesion ที่ย้ายตำแหน่งและหายภายในเวลาไม่นาน',
    'รู้จัก angioedema และแยก histamine-mediated vs bradykinin-mediated concept ได้',
    'รู้ว่า angioedema ที่มี airway symptom เป็น emergency',
    'รู้จัก anaphylaxis และ skin finding ที่เกี่ยวข้อง',
    'เลือก management ได้ เช่น antihistamine, epinephrine ใน anaphylaxis, avoid trigger',
    'รู้ว่า ACE inhibitor อาจทำให้ bradykinin-mediated angioedema',
    'รู้ว่า chronic urticaria ส่วนใหญ่ไม่จำเป็นต้องเกิดจาก food allergy เสมอไป'
  ]},
  { title: '10. Drug Eruptions & Severe Cutaneous Adverse Reactions', items: [
    'รู้จัก common morbilliform drug eruption',
    'รู้ว่า drug rash มักเริ่มหลังได้รับยาใหม่ และอาจมี pruritus/generalized rash',
    'รู้จัก fixed drug eruption',
    'รู้จัก erythema multiforme และ target lesions',
    'แยก erythema multiforme จาก SJS/TEN ได้',
    'รู้จัก Stevens-Johnson syndrome / toxic epidermal necrolysis: mucosal involvement, skin pain, epidermal detachment',
    'รู้จัก DRESS syndrome: drug rash + eosinophilia + systemic involvement',
    'รู้ common culprit drugs เช่น sulfonamides, anticonvulsants, allopurinol, antibiotics, NSAIDs',
    'รู้ว่า severe drug reaction ต้อง stop offending drug และ assess systemic involvement',
    'รู้ว่า mucosal involvement + skin pain + systemic symptoms เป็น dermatologic emergency'
  ]},
  { title: '11. Autoimmune Blistering Diseases', items: [
    'แยก pemphigus vulgaris กับ bullous pemphigoid ได้',
    'รู้ว่า pemphigus vulgaris มักมี flaccid bullae และ mucosal involvement',
    'เข้าใจ mechanism ของ pemphigus vulgaris: autoantibody against desmosomes',
    'รู้ว่า bullous pemphigoid มักมี tense bullae ใน elderly patient',
    'เข้าใจ mechanism ของ bullous pemphigoid: autoantibody against hemidesmosomes',
    'รู้จัก dermatitis herpetiformis และความสัมพันธ์กับ celiac disease',
    'เข้าใจ role ของ skin biopsy และ direct immunofluorescence',
    'รู้ว่า widespread blistering disease อาจทำให้ fluid loss, infection risk และต้อง manage urgently',
    'แยก blistering disease จาก burn, infection และ drug reaction ได้ในภาพรวม'
  ]},
  { title: '12. Connective Tissue Disease & Cutaneous Vasculitis', items: [
    'รู้ skin findings ของ systemic lupus erythematosus / SLE เช่น malar rash, photosensitivity, discoid rash',
    'รู้ว่า malar rash มัก spare nasolabial folds',
    'รู้จัก dermatomyositis: heliotrope rash, Gottron papules, proximal muscle weakness',
    'รู้จัก systemic sclerosis: skin thickening, Raynaud phenomenon, digital ulcers, telangiectasia',
    'รู้จัก Raynaud phenomenon และแยก primary vs secondary concept ได้',
    'รู้จัก vasculitis ที่มี palpable purpura',
    'รู้ว่า palpable purpura ที่ขา + systemic symptoms ต้องคิดถึง small-vessel vasculitis',
    'รู้จัก Henoch-Schönlein purpura / IgA vasculitis ในเด็ก',
    'รู้ว่า vasculitis อาจเกี่ยวกับ kidney, GI, joint, nerve involvement',
    'เลือก workup ได้ เช่น urinalysis, renal function, CBC, inflammatory markers, biopsy ตาม scenario'
  ]},
  { title: '13. Pigmentary Disorders', items: [
    'แยก hypopigmentation กับ depigmentation ได้',
    'รู้จัก vitiligo และ autoimmune association',
    'รู้จัก post-inflammatory hyperpigmentation/hypopigmentation',
    'รู้จัก melasma และ trigger เช่น sun exposure, pregnancy, OCP',
    'รู้จัก café-au-lait spots และเชื่อมกับ neurofibromatosis concept ได้',
    'รู้จัก acanthosis nigricans และเชื่อมกับ insulin resistance หรือ malignancy ในบาง context',
    'แยก benign pigmentation จาก suspicious pigmented lesion ได้',
    'รู้ว่า pigment disorder ต้องดู distribution, border, color uniformity และ associated systemic signs'
  ]},
  { title: '14. Hair, Nail & Mucosal Disorders', items: [
    'รู้จัก alopecia areata และ autoimmune concept',
    'รู้จัก androgenetic alopecia และ telogen effluvium ในภาพรวม',
    'รู้จัก tinea capitis และ kerion',
    'รู้ว่า scarring alopecia เป็น red flag เพราะ irreversible hair loss',
    'รู้ nail findings สำคัญ เช่น pitting, spoon nails, clubbing, onycholysis, splinter hemorrhages',
    'เชื่อม nail pitting กับ psoriasis ได้',
    'เชื่อม koilonychia กับ iron deficiency ได้',
    'รู้จัก oral ulcers และ differential เช่น aphthous ulcer, HSV, Behçet disease, SLE, IBD',
    'รู้ mucosal involvement เป็น red flag ใน SJS/TEN, pemphigus vulgaris, severe systemic disease',
    'แยก oral thrush จาก leukoplakia concept ได้'
  ]},
  { title: '15. Benign Skin Lesions', items: [
    'รู้จัก seborrheic keratosis: stuck-on waxy lesion',
    'รู้จัก actinic keratosis เป็น premalignant lesion from sun damage',
    'รู้จัก epidermoid cyst, lipoma, dermatofibroma, cherry angioma',
    'แยก benign nevus จาก atypical nevus ได้',
    'รู้ว่า rapidly changing lesion ต้อง evaluate เพิ่ม',
    'รู้ว่า actinic damage สะท้อน cumulative UV exposure',
    'รู้ว่าไม่ใช่ทุก pigmented lesion คือ melanoma แต่ต้องรู้ red flags',
    'ใช้ ABCDE rule เพื่อ screen suspicious pigmented lesions ได้'
  ]},
  { title: '16. Skin Cancer & Dermatologic Oncology', items: [
    'รู้จัก basal cell carcinoma / BCC และ classic pearly papule with telangiectasia',
    'รู้ว่า BCC มัก locally invasive แต่ metastasis น้อย',
    'รู้จัก squamous cell carcinoma / SCC และ association กับ actinic keratosis, UV exposure, immunosuppression',
    'รู้จัก melanoma และใช้ ABCDE: asymmetry, border irregularity, color variation, diameter, evolution',
    'รู้ melanoma subtype ในภาพรวม เช่น superficial spreading, nodular, lentigo maligna, acral lentiginous',
    'รู้ว่า changing mole หรือ new pigmented lesion in adult เป็น red flag',
    'รู้ว่า biopsy เป็น key step ใน suspicious melanoma',
    'รู้ risk factors ของ skin cancer เช่น UV exposure, fair skin, immunosuppression, family history, atypical nevi',
    'รู้ basic prevention: sun protection, avoid tanning, skin surveillance in high-risk patients',
    'แยก treatment concept ของ BCC, SCC, melanoma ได้ในภาพรวม'
  ]},
  { title: '17. Pediatric Dermatology', items: [
    'รู้จัก common newborn rashes เช่น erythema toxicum neonatorum, milia, neonatal acne',
    'รู้จัก diaper dermatitis และแยก irritant vs candida ได้',
    'รู้จัก atopic dermatitis ในเด็ก',
    'รู้จัก impetigo, scabies, tinea capitis, molluscum contagiosum ในเด็ก',
    'รู้จัก viral exanthems ที่พบบ่อย เช่น measles, rubella, roseola, parvovirus B19, hand-foot-mouth disease',
    'รู้ว่า fever + rash ในเด็กต้องประเมิน vaccination status และ systemic toxicity',
    'รู้จัก Kawasaki disease skin/mucosal findings เช่น conjunctivitis, strawberry tongue, rash, extremity changes',
    'รู้ว่า purpura + fever ในเด็กเป็น red flag',
    'เลือก management ที่ปลอดภัยตามอายุ เช่น topical steroid potency, antifungal, antibiotic, supportive care'
  ]},
  { title: '18. Genital Dermatology & Sexually Transmitted Infections', items: [
    'รู้จัก genital herpes และ painful vesicles/ulcers',
    'รู้จัก syphilis rash โดยเฉพาะ secondary syphilis ที่มี rash including palms/soles',
    'รู้จัก condyloma acuminata จาก HPV',
    'แยก painful vs painless genital ulcer ได้',
    'รู้ differential ของ genital ulcer เช่น HSV, syphilis, chancroid ในภาพรวม',
    'รู้ว่า genital rash/ulcer ต้องคิดถึง STI testing, partner management และ counseling',
    'รู้จัก scabies/pubic lice ใน genital area',
    'รู้ว่า immunocompromised patient อาจมี atypical/severe presentation',
    'เชื่อม dermatologic finding กับ systemic STI manifestations ได้'
  ]},
  { title: '19. Environmental, Occupational & Physical Skin Injury', items: [
    'รู้จัก sunburn, photodermatitis, photosensitivity reaction',
    'รู้ drug-induced photosensitivity เช่น tetracyclines, thiazides, amiodarone concept',
    'รู้จัก thermal burn classification ในภาพรวม',
    'ประเมิน burn severity จาก depth, total body surface area, location และ inhalation injury risk',
    'รู้ basic burn management concept: airway, fluids, pain control, wound care, infection prevention',
    'รู้จัก frostbite, heat rash, pressure ulcer',
    'รู้ risk factors ของ pressure ulcer เช่น immobility, poor nutrition, neurologic disease',
    'รู้ prevention ของ pressure ulcer เช่น repositioning, skin care, pressure offloading',
    'รู้ occupational dermatitis จาก chemical/irritant exposure'
  ]},
  { title: '20. Dermatologic Pharmacology', items: [
    'รู้ potency และ side effects ของ topical corticosteroids',
    'รู้ว่า topical steroid ใช้แรงต่างกันตาม body site และ severity',
    'รู้ side effects เช่น skin atrophy, striae, telangiectasia, perioral dermatitis, adrenal suppression ถ้าใช้มาก/นาน',
    'รู้จัก topical calcineurin inhibitors เช่น tacrolimus/pimecrolimus concept',
    'รู้จัก topical retinoids และ irritation/photosensitivity concept',
    'รู้จัก benzoyl peroxide, topical/oral antibiotics ใน acne',
    'รู้จัก systemic antifungals และ indication สำคัญ',
    'รู้จัก systemic immunosuppressants/biologics ใน psoriasis, severe eczema, autoimmune disease ในภาพรวม',
    'รู้ว่า dermatologic drug choice ต้องดู disease severity, location, pregnancy status, age, comorbidity'
  ]},
  { title: '21. Dermatologic Emergencies', items: [
    'Stevens-Johnson syndrome / toxic epidermal necrolysis',
    'Necrotizing fasciitis',
    'Anaphylaxis with urticaria/angioedema',
    'Angioedema with airway compromise',
    'Purpura fulminans / meningococcemia pattern',
    'Staphylococcal scalded skin syndrome',
    'Toxic shock syndrome',
    'Erythroderma',
    'Disseminated zoster / severe HSV in immunocompromised patient',
    'Severe burn',
    'Rapidly progressive cellulitis with systemic toxicity',
    'Mucosal involvement + skin pain + drug exposure'
  ]},
  { title: '22. Final Dermatology Exit Standard', items: [
    'Describe lesion ด้วย dermatologic terms ได้',
    'แปล morphology + distribution + time course เป็น differential diagnosis ได้',
    'แยก eczema, psoriasis, tinea, scabies, bacterial infection, viral exanthem ได้',
    'รู้ว่า rash ไหนต้องทำ KOH, culture, biopsy, patch test หรือ dermoscopy',
    'รู้ red flags ของ fever + rash, mucosal involvement, skin pain, purpura, rapidly progressive infection',
    'แยก benign skin lesion จาก suspicious skin cancer ได้',
    'ใช้ ABCDE rule สำหรับ melanoma screening ได้',
    'เลือก topical vs systemic treatment ได้ตาม severity/location',
    'รู้ side effects ของ topical steroid และ isotretinoin',
    'รู้ dermatologic emergencies ที่ต้องไม่พลาด',
    'เลือก next best investigation ได้',
    'เลือก next best management ได้',
    'อธิบาย mechanism ที่อยู่เบื้องหลังคำตอบได้ ไม่ใช่แค่จำชื่อผื่น'
  ]}
]

async function run() {
  await connectDB()
  const slug = 'dermatology-readiness'
  console.log(`[seed-selfcheck-dermatology] target slug: ${slug}`)

  const existing = await SelfCheckTemplate.findOne({ slug }).lean()

  // map text → existing id (preserve progress ของ user เดิม)
  const existingIdMap = {}    // key: sectionTitle::itemText
  if (existing) {
    for (const sec of (existing.sections || [])) {
      for (const item of (sec.items || [])) {
        existingIdMap[`${sec.title}::${item.text}`] = item.id
      }
    }
  }
  const existingSecIdMap = {}
  if (existing) {
    for (const sec of (existing.sections || [])) {
      existingSecIdMap[sec.title] = sec.id
    }
  }

  const sections = SECTIONS.map(s => ({
    id: existingSecIdMap[s.title] || genId('sec'),
    title: s.title,
    items: s.items.map(text => ({
      id: existingIdMap[`${s.title}::${text}`] || genId('itm'),
      text
    }))
  }))

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)
  const payload = {
    slug,
    name: 'Dermatology Readiness Checklist',
    tagline: 'เช็กให้ชัวร์ก่อนสอบ: Describe ผื่นเป็น เห็น Pattern ได้ ตอบ Management ถูก',
    icon: '🩺',
    color: '#3b82f6',
    sections,
    isPublished: true
  }

  await SelfCheckTemplate.findOneAndUpdate(
    { slug },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  console.log(`[seed-selfcheck-dermatology] ✅ ${existing ? 'updated' : 'created'}`)
  console.log(`  • Sections: ${sections.length}`)
  console.log(`  • Items: ${totalItems}`)
  process.exit(0)
}

run().catch(err => {
  console.error('[seed-selfcheck-dermatology] ❌ ERROR:', err)
  process.exit(1)
})
