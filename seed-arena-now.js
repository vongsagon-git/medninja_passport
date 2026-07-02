require('./backend/node_modules/dotenv').config()
const mongoose = require('./backend/node_modules/mongoose')
const XLSX = require('./backend/node_modules/xlsx')
const path = require('path')

const uri = process.env.MONGODB_URI_LMS
const conn = mongoose.createConnection(uri)

const schema = new mongoose.Schema({
  num: Number,
  ddx: { type: String, required: true },
  ddxTh: { type: String, default: '' },
  buzzwords: { type: String, default: '' },
  relatedCC: { type: String, default: '' },
  relatedCCEn: { type: String, default: '' },
  history: { type: String, default: '' },
  pe: { type: String, default: '' },
  investigation: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isAudited: { type: Boolean, default: false },
}, { timestamps: true })

const ArenaCard = conn.model('ArenaCard', schema)

// 73 CC Groups
const G = [
  {cc:'เจ็บหน้าอก',en:'Chest Pain',d:['ACS/MI','PE','Aortic Dissection','Pneumothorax','Pericarditis','GERD','Musculoskeletal','Panic Attack','Boerhaave Syndrome','Costochondritis']},
  {cc:'ใจสั่น',en:'Palpitation',d:['AF','SVT','VT','PVC/PAC','Hyperthyroidism','Anemia','Anxiety','Caffeine/Drug','Pheochromocytoma','Hypoglycemia']},
  {cc:'เป็นลม',en:'Syncope',d:['Vasovagal','Cardiac Arrhythmia','Orthostatic Hypotension','Aortic Stenosis','PE','Carotid Sinus','Situational Syncope','Seizure (mimic)']},
  {cc:'หัวใจล้มเหลว',en:'CHF / Cardiomyopathy',d:['Ischemic CM','Dilated Cardiomegaly','Hypertensive Cardiomegaly','Valvular','HOCM','Peripartum CM','Myocarditis','Restrictive CM']},
  {cc:'ปวดขาเวลาเดิน',en:'Claudication',d:['PAD/Atherosclerosis','Spinal Stenosis','DVT','Buerger Disease','Vasculitis','Musculoskeletal']},
  {cc:'ความดันสูงในคนอายุน้อย',en:'Hypertension in Young',d:['Renal Artery Stenosis','Pheochromocytoma','Cushing','Coarctation of Aorta','Primary Aldosteronism','Essential HTN','OCP-related']},
  {cc:'น้ำในเยื่อหุ้มหัวใจ',en:'Pericardial Effusion',d:['Pericarditis (viral)','TB','Malignancy','Uremia','Hypothyroid','SLE','Trauma','Post-MI (Dressler)']},
  {cc:'หอบเหนื่อย',en:'Dyspnea',d:['Heart Failure','Pneumonia','Asthma','COPD Exacerbation','PE','Anemia','Pleural Effusion','Pneumothorax','Anxiety','ILD']},
  {cc:'ไอ',en:'Cough',d:['Postnasal Drip','Asthma','GERD','TB','Pneumonia','ACEi Cough','Lung CA','Bronchiectasis','ILD','Pertussis']},
  {cc:'ไอเป็นเลือด',en:'Hemoptysis',d:['TB','Lung CA','Bronchiectasis','PE','Pneumonia','Mitral Stenosis','Goodpasture','Vasculitis','AV Malformation']},
  {cc:'เขียว',en:'Cyanosis',d:['Central: Lung Dz','R-to-L Shunt','Methemoglobin','Peripheral: Shock','Peripheral: Cold','Raynaud','PAD']},
  {cc:'นิ้วปุ้ม',en:'Clubbing',d:['Lung CA','Bronchiectasis','ILD','Cyanotic Heart Dz','Liver Cirrhosis','IBD','Infective Endocarditis','Mesothelioma']},
  {cc:'น้ำในเยื่อหุ้มปอด',en:'Pleural Effusion',d:['CHF','Pneumonia (Parapneumonic)','TB','Malignancy','PE','Cirrhosis','Nephrotic','Pancreatitis','Chylothorax']},
  {cc:'ปวดท้อง',en:'Abdominal Pain',d:['Appendicitis','Pancreatitis','Cholecystitis','Bowel Obstruction','Perforation','Ectopic Pregnancy','Ureterolithiasis','Mesenteric Ischemia','AAA','Peptic Ulcer','Diverticulitis']},
  {cc:'ตัวเหลืองตาเหลือง',en:'Jaundice',d:['Hepatitis (viral)','Choledocholithiasis','Pancreatic CA','Hemolysis','Gilbert','Drug-induced','Alcoholic Hepatitis','Cholangiocarcinoma','PBC/PSC']},
  {cc:'กลืนลำบาก',en:'Dysphagia',d:['Esophageal CA','Stricture','Achalasia','GERD','Stroke','MG','Schatzki Ring','Eosinophilic Esophagitis','Zenker Diverticulum']},
  {cc:'คลื่นไส้/อาเจียน',en:'Nausea / Vomiting',d:['Gastroenteritis','Bowel Obstruction','Pregnancy','Drug/Chemo','Raised ICP','DKA','Gastroparesis','Pancreatitis','MI (inferior)']},
  {cc:'ปวดท้องจุกแน่นลิ้นปี่',en:'Dyspepsia',d:['Functional Dyspepsia','Peptic Ulcer','GERD','Gastric CA','H. pylori','Drug (NSAID)','Gastroparesis','Biliary Colic']},
  {cc:'เลือดออกทางเดินอาหารบน',en:'Upper GI Bleeding',d:['Peptic Ulcer','Esophageal Varices','Mallory-Weiss','Gastric CA','Erosive Gastritis','Dieulafoy','AVM','Aortoenteric Fistula']},
  {cc:'เลือดออกทางเดินอาหารล่าง',en:'Lower GI Bleeding',d:['Hemorrhoids','Colorectal CA','Diverticular Bleed','IBD','Angiodysplasia','Ischemic Colitis','Polyp','Infectious Colitis']},
  {cc:'ท้องเสียเฉียบพลัน',en:'Acute Diarrhea',d:['Viral Gastroenteritis','Bacterial (Salmonella/Shigella)','Food Poisoning','C. difficile','Traveler','Cholera','Amebiasis']},
  {cc:'ท้องเสียเรื้อรัง',en:'Chronic Diarrhea',d:['IBS','IBD','Celiac','Hyperthyroidism','Chronic Infection','Lactose Intolerance','Microscopic Colitis','Pancreatic Insufficiency','Colorectal CA']},
  {cc:'ท้องผูก',en:'Constipation',d:['Functional','Drug-induced (Opioid/CCB/Anticholinergic)','Colorectal CA','Hypothyroid','Hypercalcemia','Hirschsprung','IBS-C','Stricture']},
  {cc:'ท้องบวมโต/ท้องมาน',en:'Ascites',d:['Cirrhosis','Malignancy','CHF','Nephrotic','TB Peritonitis','Pancreatitis','Budd-Chiari','Myxedema']},
  {cc:'ก้อนในท้อง',en:'Abdominal Mass',d:['Hepatomegaly','Splenomegaly','Renal Mass','Ovarian Mass','AAA','Lymphoma','Colorectal CA','Pancreatic Mass','Mesenteric Mass']},
  {cc:'ถ่ายเป็นเลือด',en:'Hematochezia',d:['Hemorrhoids','Colorectal CA','IBD','Diverticular','Anal Fissure','Polyp','Infectious Colitis','Ischemic Colitis','Meckel']},
  {cc:'บวม',en:'Edema',d:['CHF','Nephrotic Syndrome','Cirrhosis','CKD','DVT','Drug (CCB/NSAID)','Hypothyroid','Lymphedema','Pregnancy','Allergic']},
  {cc:'ปัสสาวะเป็นเลือด',en:'Hematuria',d:['UTI','Urolithiasis','Glomerulonephritis','Bladder CA','Renal CA','Polycystic kidney disease','IgA Nephropathy','Trauma','Exercise-induced','Prostate']},
  {cc:'ปัสสาวะออกน้อย',en:'Oliguria',d:['Prerenal AKI (Dehydration/Shock)','Renal AKI (ATN/GN)','Postrenal AKI (Obstruction)','AKI','Sepsis','Rhabdomyolysis','Hepatorenal Syndrome']},
  {cc:'ปัสสาวะมาก',en:'Polyuria',d:['DM','Diabetes Insipidus (Central/Nephrogenic)','Psychogenic Polydipsia','Hypercalcemia','Hypokalemia','CKD','Drug (Diuretic/Lithium)']},
  {cc:'ปัสสาวะลำบาก/แสบขัด',en:'Dysuria',d:['UTI','STI (Chlamydia/Gonorrhea)','Vaginitis','Prostatitis','Urethritis','Interstitial Cystitis','Urolithiasis']},
  {cc:'ปัสสาวะสีแดง',en:'Red Urine',d:['Hematuria','Hemoglobinuria','Myoglobinuria','Beetroot/Food','Drug (Rifampicin)','Porphyria']},
  {cc:'โปรตีนในปัสสาวะ',en:'Proteinuria',d:['DM Nephropathy','Glomerulonephritis','Nephrotic Syndrome','HTN Nephrosclerosis','Amyloidosis','SLE Nephritis','Orthostatic','Exercise']},
  {cc:'กลุ่มอาการไตรั่ว',en:'Nephrotic Syndrome',d:['Minimal Change','Membranous','FSGS','DM Nephropathy','SLE Nephritis','Amyloidosis']},
  {cc:'ไตอักเสบเร็ว',en:'RPGN',d:['Anti-GBM (Goodpasture)','ANCA Vasculitis','Immune Complex (SLE/IgA/Post-strep)','Crescentic GN']},
  {cc:'ไตวาย',en:'Azotemia',d:['Prerenal','Intrinsic Renal (ATN/AIN/GN)','Postrenal (Obstruction)','CKD','Hepatorenal Syndrome','Contrast Nephropathy']},
  {cc:'ทางเดินปัสสาวะอุดตัน',en:'Urinary Tract Obstruction',d:['Urolithiasis','BPH','Urethral Stricture','Pelvic Mass','Neurogenic Bladder','Blood Clot','CA (Bladder/Cervix/Prostate)']},
  {cc:'ไทรอยด์ผิดปกติ',en:'Thyroid Disorders',d:['Graves Disease','Toxic Multinodular Goiter','Thyroiditis','Hashimoto','Iodine Deficiency','Drug (Amiodarone/Lithium)','Thyroid Storm','Myxedema Coma','Thyroid CA']},
  {cc:'ต่อมหมวกไตผิดปกติ',en:'Adrenal Disorders',d:['Cushing Syndrome','Addison Disease','Pheochromocytoma','Primary Aldosteronism (Conn)','Adrenal Insufficiency','CAH','Adrenal Crisis']},
  {cc:'แคลเซียมผิดปกติ',en:'Calcium Disorders',d:['Hypercalcemia: Hyperparathyroid','Hypercalcemia: Malignancy','Hypercalcemia: Vit D','Hypocalcemia: Hypoparathyroid','Hypocalcemia: CKD','Hypocalcemia: Vit D Def','Hypocalcemia: Pancreatitis']},
  {cc:'เบาหวาน',en:'Diabetes Mellitus',d:['Type 1 DM','Type 2 DM','Gestational DM','MODY','Secondary (Steroid/Cushing/Pancreatitis)','DKA','HHS','Hypoglycemia']},
  {cc:'ซีด',en:'Anemia',d:['Iron Deficiency','Thalassemia','B12/Folate Deficiency','Hemolysis','Anemia of Chronic Disease','Aplastic anemia','Sideroblastic','Myelodysplastic']},
  {cc:'เลือดออกผิดปกติ',en:'Abnormal Bleeding',d:['Thrombocytopenia','Coagulopathy','DIC','Liver Disease','vWD','Hemophilia','Drug (Warfarin/DOAC/Antiplatelet)','Vit K Deficiency']},
  {cc:'ต่อมน้ำเหลืองโต',en:'Lymphadenopathy',d:['Reactive (Infection)','Lymphoma','TB','Metastasis','SLE','Sarcoidosis','EBV/CMV','HIV','Cat Scratch Disease']},
  {cc:'ม้ามโต',en:'Splenomegaly',d:['Portal Hypertension','Lymphoma/Leukemia','Hemolytic Anemia','Infection (Malaria/EBV)','Myeloproliferative','Storage Disease','SLE','Sarcoidosis']},
  {cc:'เม็ดเลือดแดงมาก',en:'Polycythemia',d:['Polycythemia Vera','Secondary Polycythemia (Hypoxia/COPD/OSA)','EPO-producing Tumor','Dehydration (Relative)','High Altitude']},
  {cc:'เม็ดเลือดขาวสูง',en:'Leukocytosis',d:['Infection','Stress/Steroid','Leukemia (CML/CLL/AML/ALL)','Smoking','Drug','Myeloproliferative','Allergic']},
  {cc:'เม็ดเลือดขาวต่ำ',en:'Leukopenia',d:['Drug/Chemo','Viral Infection','Aplastic Anemia','SLE','HIV','Sepsis (late)','MDS','Hypersplenism']},
  {cc:'เกล็ดเลือดต่ำ',en:'Thrombocytopenia',d:['ITP','DIC','Dengue','TTP/HUS','HIT','Drug-induced','Aplastic','Hypersplenism','MDS','SLE']},
  {cc:'เม็ดเลือดทุกชนิดต่ำ',en:'Pancytopenia',d:['Aplastic Anemia','MDS','Leukemia','B12/Folate Def','SLE','Hypersplenism','Drug/Chemo','HIV','TB (miliary)']},
  {cc:'ไข้',en:'Fever',d:['Dengue','Pneumonia','UTI','Leptospirosis','Scrub Typhus','Malaria','Malignancy','Autoimmune','Drug Fever','TB','Infective Endocarditis','Abscess']},
  {cc:'ปวดข้อ',en:'Arthritis',d:['Gout','Septic Arthritis','RA','OA','SLE','Reactive Arthritis','Psoriatic','Gonococcal','Pseudogout']},
  {cc:'ปวดหลัง',en:'Back Pain',d:['Mechanical','HNP','Spinal Stenosis','Compression Fracture','Metastasis','Cauda Equina','Ankylosing spondylitis','Infection (Discitis/Epidural Abscess)','AAA']},
  {cc:'ปวดศีรษะ',en:'Headache',d:['Tension headache','Migraine','SAH','Meningitis','Brain Tumor','Temporal Arteritis','Cluster headache','Medication Overuse headache','Idiopathic Intracranial HTN','Sinusitis']},
  {cc:'ชัก',en:'Seizure',d:['Epilepsy','Febrile Seizure','Stroke/ICH','Metabolic (Hypo-Na/Glucose/Ca)','Brain Tumor','Meningitis/Encephalitis','Drug/Alcohol Withdrawal','Eclampsia','Trauma']},
  {cc:'อ่อนแรง',en:'Weakness',d:['Stroke','GBS','MG','Cord Compression','ALS','Myopathy','Peripheral Neuropathy','MS','Hypokalemia','Transverse Myelitis']},
  {cc:'ความรู้สึกตัวลดลง',en:'Altered Consciousness',d:['Stroke/ICH','SAH','Metabolic (Hepatic/Uremic/DKA)','Hypoglycemia','Drug/Toxin','Infection (Meningitis/Encephalitis)','Status Epilepticus','Trauma','Hypo/Hypernatremia']},
  {cc:'เพ้อ',en:'Delirium',d:['Infection/Sepsis','Metabolic','Drug/Medication','Alcohol Withdrawal','Pain/Urinary Retention','CNS Lesion','Hypoxia','Constipation','Post-op']},
  {cc:'เวียนศีรษะ',en:'Vertigo',d:['BPPV','Meniere Disease','Vestibular Neuritis','VBI','Brainstem Stroke','Acoustic Neuroma','Labyrinthitis','Medication','Migraine-associated']},
  {cc:'ชา',en:'Numbness',d:['DM Neuropathy','Carpal Tunnel','Radiculopathy','Stroke','B12 Deficiency','GBS','MS','Peripheral Neuropathy','Leprosy']},
  {cc:'การเคลื่อนไหวผิดปกติ',en:'Movement Disorders',d:['Parkinson Disease','Essential Tremor','Drug-induced (EPS)','Huntington','Wilson Disease','Cerebellar Ataxia','Dystonia','Tardive Dyskinesia','Chorea (SLE/Sydenham)']},
  {cc:'ความบกพร่องทางสมอง',en:'Cognitive Impairment',d:['Alzheimer','Vascular Dementia','Lewy Body dementia','Frontotemporal dementia','Normal Pressure Hydrocephalus','B12 Deficiency','Hypothyroid','Depression (Pseudodementia)','Subdural Hematoma','HIV']},
  {cc:'ตามัว',en:'Visual Disorder',d:['Optic Neuritis (MS)','Glaucoma','Cataract','Retinal Detachment','CRAO/CRVO','Temporal Arteritis','DM Retinopathy','Migraine Aura','Stroke (Occipital)']},
  {cc:'เห็นภาพซ้อน',en:'Diplopia',d:['CN III Palsy (DM/Aneurysm)','CN VI Palsy','MG','Thyroid Eye Disease','MS','Orbital Mass','Cavernous Sinus','Brainstem Stroke']},
  {cc:'หนังตาตก',en:'Ptosis',d:['MG','CN III Palsy','Horner Syndrome','Congenital','Senile/Aponeurotic','Myotonic Dystrophy']},
  {cc:'Stroke ในคนอายุน้อย',en:'Stroke in Young',d:['Cardioembolism (AF/PFO/Endocarditis)','Dissection (Carotid/Vertebral)','Vasculitis','Antiphospholipid syndrome','Moyamoya','Drug (Cocaine/Amphetamine)','Sickle Cell','Coagulopathy']},
  {cc:'น้ำหนักลด',en:'Weight Loss',d:['DM','Hyperthyroid','Malignancy','TB','Depression','HIV','Anorexia Nervosa','Malabsorption','COPD','Addison']},
  {cc:'น้ำหนักเพิ่ม',en:'Weight Gain',d:['Primary Obesity','Cushing','Hypothyroid','PCOS','Drug (Steroid/Insulin/Antipsychotic)','Insulinoma','Genetic (Prader-Willi)']},
  {cc:'นอนไม่หลับ',en:'Sleep Disorders',d:['Insomnia','OSA','Narcolepsy','Restless Leg','GERD','Depression','Anxiety','Drug/Caffeine','Shift Work']},
  {cc:'ผื่น',en:'Skin Manifestations',d:['Drug Eruption','Eczema/Dermatitis','Fungal','Psoriasis','SJS/TEN','Urticaria','Herpes Zoster','Scabies','Contact Dermatitis','Pemphigus vulgaris']},
  {cc:'สารคัดหลั่งจากท่อปัสสาวะ',en:'Urethral Discharge',d:['Gonorrhea','Chlamydia','Non-gonococcal Urethritis','Trichomonas','UTI']},
  {cc:'แผลที่อวัยวะเพศ',en:'Genital Ulcers',d:['Syphilis','Herpes','Chancroid','LGV','Behcet','Granuloma Inguinale','Fixed Drug Eruption']},
  {cc:'ช็อค',en:'Shock',d:['Hypovolemic (Hemorrhagic/Dehydration)','Septic','Cardiogenic (MI/Tamponade)','Obstructive (PE/Tension Pneumo/Tamponade)','Anaphylactic','Neurogenic','Adrenal Crisis']},
]

async function run() {
  await conn.asPromise()
  console.log('Connected to DO MongoDB!')

  // DDx → CC mapping
  const ddxToCc = {}
  for (const g of G) {
    for (const ddx of g.d) {
      ddxToCc[ddx] = { cc: g.cc, en: g.en }
    }
  }

  // Read Excel
  const file = path.join(__dirname, 'MedNinja_USMLE_Flashcards_462.xlsx')
  const wb = XLSX.readFile(file)
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

  const cards = rows.map(row => {
    const ddx = (row['Disease / Condition'] || '').trim()
    const buzzwords = (row['USMLE Buzzwords / Keywords'] || '').trim()
    const m = ddxToCc[ddx] || { cc: '', en: '' }
    return { num: row['#'], ddx, buzzwords, relatedCC: m.cc, relatedCCEn: m.en, isActive: true, isAudited: false }
  }).filter(c => c.ddx && c.buzzwords)

  console.log('Cards from Excel:', cards.length)
  console.log('With CC group:', cards.filter(c => c.relatedCC).length)
  console.log('No CC group:', cards.filter(c => !c.relatedCC).length)

  await ArenaCard.deleteMany({})
  await ArenaCard.insertMany(cards)

  const total = await ArenaCard.countDocuments()
  const ccs = await ArenaCard.distinct('relatedCC', { relatedCC: { $ne: '' } })
  console.log('\n=== SEED COMPLETE ===')
  console.log('Total in DB:', total)
  console.log('CC Groups:', ccs.length)

  // Show first 5
  const samples = await ArenaCard.find({ relatedCC: { $ne: '' } }).limit(5).lean()
  samples.forEach(s => console.log(`  ${s.num}. [${s.relatedCC}] ${s.ddx} — ${s.buzzwords.substring(0, 50)}...`))

  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
