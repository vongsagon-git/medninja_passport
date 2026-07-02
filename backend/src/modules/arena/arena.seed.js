const path = require('path')
const ArenaCard = require('./ArenaCard.model')

// ═══ CC Groups mapping — 73 CC จาก FlashcardCC ═══
// key = ccGroup (Thai + En), value = array ของ DDx names ที่สังกัด
const CC_GROUPS = [
  { cc: 'เจ็บหน้าอก', ccEn: 'Chest Pain', ddxList: ['ACS/MI','PE','Aortic Dissection','Pneumothorax','Pericarditis','GERD','Musculoskeletal','Panic Attack','Boerhaave Syndrome','Costochondritis'] },
  { cc: 'ใจสั่น', ccEn: 'Palpitation', ddxList: ['AF','SVT','VT','PVC/PAC','Hyperthyroidism','Anemia','Anxiety','Caffeine/Drug','Pheochromocytoma','Hypoglycemia'] },
  { cc: 'เป็นลม', ccEn: 'Syncope', ddxList: ['Vasovagal','Cardiac Arrhythmia','Orthostatic Hypotension','Aortic Stenosis','PE','Carotid Sinus','Situational Syncope','Seizure (mimic)'] },
  { cc: 'หัวใจล้มเหลว', ccEn: 'CHF / Cardiomyopathy', ddxList: ['Ischemic CM','Dilated Cardiomegaly','Hypertensive Cardiomegaly','Valvular','HOCM','Peripartum CM','Myocarditis','Restrictive CM'] },
  { cc: 'ปวดขาเวลาเดิน', ccEn: 'Claudication', ddxList: ['PAD/Atherosclerosis','Spinal Stenosis','DVT','Buerger Disease','Vasculitis','Musculoskeletal'] },
  { cc: 'ความดันสูงในคนอายุน้อย', ccEn: 'Hypertension in Young', ddxList: ['Renal Artery Stenosis','Pheochromocytoma','Cushing','Coarctation of Aorta','Primary Aldosteronism','Essential HTN','OCP-related'] },
  { cc: 'น้ำในเยื่อหุ้มหัวใจ', ccEn: 'Pericardial Effusion', ddxList: ['Pericarditis (viral)','TB','Malignancy','Uremia','Hypothyroid','SLE','Trauma','Post-MI (Dressler)'] },
  { cc: 'หอบเหนื่อย', ccEn: 'Dyspnea', ddxList: ['Heart Failure','Pneumonia','Asthma','COPD Exacerbation','PE','Anemia','Pleural Effusion','Pneumothorax','Anxiety','ILD'] },
  { cc: 'ไอ', ccEn: 'Cough', ddxList: ['Postnasal Drip','Asthma','GERD','TB','Pneumonia','ACEi Cough','Lung CA','Bronchiectasis','ILD','Pertussis'] },
  { cc: 'ไอเป็นเลือด', ccEn: 'Hemoptysis', ddxList: ['TB','Lung CA','Bronchiectasis','PE','Pneumonia','Mitral Stenosis','Goodpasture','Vasculitis','AV Malformation'] },
  { cc: 'เขียว', ccEn: 'Cyanosis', ddxList: ['Central: Lung Dz','R-to-L Shunt','Methemoglobin','Peripheral: Shock','Peripheral: Cold','Raynaud','PAD'] },
  { cc: 'นิ้วปุ้ม', ccEn: 'Clubbing', ddxList: ['Lung CA','Bronchiectasis','ILD','Cyanotic Heart Dz','Liver Cirrhosis','IBD','Infective Endocarditis','Mesothelioma'] },
  { cc: 'น้ำในเยื่อหุ้มปอด', ccEn: 'Pleural Effusion', ddxList: ['CHF','Pneumonia (Parapneumonic)','TB','Malignancy','PE','Cirrhosis','Nephrotic','Pancreatitis','Chylothorax'] },
  { cc: 'ปวดท้อง', ccEn: 'Abdominal Pain', ddxList: ['Appendicitis','Pancreatitis','Cholecystitis','Bowel Obstruction','Perforation','Ectopic Pregnancy','Ureterolithiasis','Mesenteric Ischemia','AAA','Peptic Ulcer','Diverticulitis'] },
  { cc: 'ตัวเหลืองตาเหลือง', ccEn: 'Jaundice', ddxList: ['Hepatitis (viral)','Choledocholithiasis','Pancreatic CA','Hemolysis','Gilbert','Drug-induced','Alcoholic Hepatitis','Cholangiocarcinoma','PBC/PSC'] },
  { cc: 'กลืนลำบาก', ccEn: 'Dysphagia', ddxList: ['Esophageal CA','Stricture','Achalasia','GERD','Stroke','MG','Schatzki Ring','Eosinophilic Esophagitis','Zenker Diverticulum'] },
  { cc: 'คลื่นไส้/อาเจียน', ccEn: 'Nausea / Vomiting', ddxList: ['Gastroenteritis','Bowel Obstruction','Pregnancy','Drug/Chemo','Raised ICP','DKA','Gastroparesis','Pancreatitis','MI (inferior)'] },
  { cc: 'ปวดท้องจุกแน่นลิ้นปี่', ccEn: 'Dyspepsia', ddxList: ['Functional Dyspepsia','Peptic Ulcer','GERD','Gastric CA','H. pylori','Drug (NSAID)','Gastroparesis','Biliary Colic'] },
  { cc: 'เลือดออกทางเดินอาหารบน', ccEn: 'Upper GI Bleeding', ddxList: ['Peptic Ulcer','Esophageal Varices','Mallory-Weiss','Gastric CA','Erosive Gastritis','Dieulafoy','AVM','Aortoenteric Fistula'] },
  { cc: 'เลือดออกทางเดินอาหารล่าง', ccEn: 'Lower GI Bleeding', ddxList: ['Hemorrhoids','Colorectal CA','Diverticular Bleed','IBD','Angiodysplasia','Ischemic Colitis','Polyp','Infectious Colitis'] },
  { cc: 'ท้องเสียเฉียบพลัน', ccEn: 'Acute Diarrhea', ddxList: ['Viral Gastroenteritis','Bacterial (Salmonella/Shigella)','Food Poisoning','C. difficile','Traveler','Cholera','Amebiasis'] },
  { cc: 'ท้องเสียเรื้อรัง', ccEn: 'Chronic Diarrhea', ddxList: ['IBS','IBD','Celiac','Hyperthyroidism','Chronic Infection','Lactose Intolerance','Microscopic Colitis','Pancreatic Insufficiency','Colorectal CA'] },
  { cc: 'ท้องผูก', ccEn: 'Constipation', ddxList: ['Functional','Drug-induced (Opioid/CCB/Anticholinergic)','Colorectal CA','Hypothyroid','Hypercalcemia','Hirschsprung','IBS-C','Stricture'] },
  { cc: 'ท้องบวมโต/ท้องมาน', ccEn: 'Ascites', ddxList: ['Cirrhosis','Malignancy','CHF','Nephrotic','TB Peritonitis','Pancreatitis','Budd-Chiari','Myxedema'] },
  { cc: 'ก้อนในท้อง', ccEn: 'Abdominal Mass', ddxList: ['Hepatomegaly','Splenomegaly','Renal Mass','Ovarian Mass','AAA','Lymphoma','Colorectal CA','Pancreatic Mass','Mesenteric Mass'] },
  { cc: 'ถ่ายเป็นเลือด', ccEn: 'Hematochezia', ddxList: ['Hemorrhoids','Colorectal CA','IBD','Diverticular','Anal Fissure','Polyp','Infectious Colitis','Ischemic Colitis','Meckel'] },
  { cc: 'บวม', ccEn: 'Edema', ddxList: ['CHF','Nephrotic Syndrome','Cirrhosis','CKD','DVT','Drug (CCB/NSAID)','Hypothyroid','Lymphedema','Pregnancy','Allergic'] },
  { cc: 'ปัสสาวะเป็นเลือด', ccEn: 'Hematuria', ddxList: ['UTI','Urolithiasis','Glomerulonephritis','Bladder CA','Renal CA','Polycystic kidney disease','IgA Nephropathy','Trauma','Exercise-induced','Prostate'] },
  { cc: 'ปัสสาวะออกน้อย', ccEn: 'Oliguria', ddxList: ['Prerenal AKI (Dehydration/Shock)','Renal AKI (ATN/GN)','Postrenal AKI (Obstruction)','AKI','Sepsis','Rhabdomyolysis','Hepatorenal Syndrome'] },
  { cc: 'ปัสสาวะมาก', ccEn: 'Polyuria', ddxList: ['DM','Diabetes Insipidus (Central/Nephrogenic)','Psychogenic Polydipsia','Hypercalcemia','Hypokalemia','CKD','Drug (Diuretic/Lithium)'] },
  { cc: 'ปัสสาวะลำบาก/แสบขัด', ccEn: 'Dysuria', ddxList: ['UTI','STI (Chlamydia/Gonorrhea)','Vaginitis','Prostatitis','Urethritis','Interstitial Cystitis','Urolithiasis'] },
  { cc: 'ปัสสาวะสีแดง', ccEn: 'Red Urine', ddxList: ['Hematuria','Hemoglobinuria','Myoglobinuria','Beetroot/Food','Drug (Rifampicin)','Porphyria'] },
  { cc: 'โปรตีนในปัสสาวะ', ccEn: 'Proteinuria', ddxList: ['DM Nephropathy','Glomerulonephritis','Nephrotic Syndrome','HTN Nephrosclerosis','Amyloidosis','SLE Nephritis','Orthostatic','Exercise'] },
  { cc: 'กลุ่มอาการไตรั่ว', ccEn: 'Nephrotic Syndrome', ddxList: ['Minimal Change','Membranous','FSGS','DM Nephropathy','SLE Nephritis','Amyloidosis'] },
  { cc: 'ไตอักเสบเร็ว', ccEn: 'RPGN', ddxList: ['Anti-GBM (Goodpasture)','ANCA Vasculitis','Immune Complex (SLE/IgA/Post-strep)','Crescentic GN'] },
  { cc: 'ไตวาย', ccEn: 'Azotemia', ddxList: ['Prerenal','Intrinsic Renal (ATN/AIN/GN)','Postrenal (Obstruction)','CKD','Hepatorenal Syndrome','Contrast Nephropathy'] },
  { cc: 'ทางเดินปัสสาวะอุดตัน', ccEn: 'Urinary Tract Obstruction', ddxList: ['Urolithiasis','BPH','Urethral Stricture','Pelvic Mass','Neurogenic Bladder','Blood Clot','CA (Bladder/Cervix/Prostate)'] },
  { cc: 'ไทรอยด์ผิดปกติ', ccEn: 'Thyroid Disorders', ddxList: ['Graves Disease','Toxic Multinodular Goiter','Thyroiditis','Hashimoto','Iodine Deficiency','Drug (Amiodarone/Lithium)','Thyroid Storm','Myxedema Coma','Thyroid CA'] },
  { cc: 'ต่อมหมวกไตผิดปกติ', ccEn: 'Adrenal Disorders', ddxList: ['Cushing Syndrome','Addison Disease','Pheochromocytoma','Primary Aldosteronism (Conn)','Adrenal Insufficiency','CAH','Adrenal Crisis'] },
  { cc: 'แคลเซียมผิดปกติ', ccEn: 'Calcium Disorders', ddxList: ['Hypercalcemia: Hyperparathyroid','Hypercalcemia: Malignancy','Hypercalcemia: Vit D','Hypocalcemia: Hypoparathyroid','Hypocalcemia: CKD','Hypocalcemia: Vit D Def','Hypocalcemia: Pancreatitis'] },
  { cc: 'เบาหวาน', ccEn: 'Diabetes Mellitus', ddxList: ['Type 1 DM','Type 2 DM','Gestational DM','MODY','Secondary (Steroid/Cushing/Pancreatitis)','DKA','HHS','Hypoglycemia'] },
  { cc: 'ซีด', ccEn: 'Anemia', ddxList: ['Iron Deficiency','Thalassemia','B12/Folate Deficiency','Hemolysis','Anemia of Chronic Disease','Aplastic anemia','Sideroblastic','Myelodysplastic'] },
  { cc: 'เลือดออกผิดปกติ', ccEn: 'Abnormal Bleeding', ddxList: ['Thrombocytopenia','Coagulopathy','DIC','Liver Disease','vWD','Hemophilia','Drug (Warfarin/DOAC/Antiplatelet)','Vit K Deficiency'] },
  { cc: 'ต่อมน้ำเหลืองโต', ccEn: 'Lymphadenopathy', ddxList: ['Reactive (Infection)','Lymphoma','TB','Metastasis','SLE','Sarcoidosis','EBV/CMV','HIV','Cat Scratch Disease'] },
  { cc: 'ม้ามโต', ccEn: 'Splenomegaly', ddxList: ['Portal Hypertension','Lymphoma/Leukemia','Hemolytic Anemia','Infection (Malaria/EBV)','Myeloproliferative','Storage Disease','SLE','Sarcoidosis'] },
  { cc: 'เม็ดเลือดแดงมาก', ccEn: 'Polycythemia', ddxList: ['Polycythemia Vera','Secondary Polycythemia (Hypoxia/COPD/OSA)','EPO-producing Tumor','Dehydration (Relative)','High Altitude'] },
  { cc: 'เม็ดเลือดขาวสูง', ccEn: 'Leukocytosis', ddxList: ['Infection','Stress/Steroid','Leukemia (CML/CLL/AML/ALL)','Smoking','Drug','Myeloproliferative','Allergic'] },
  { cc: 'เม็ดเลือดขาวต่ำ', ccEn: 'Leukopenia', ddxList: ['Drug/Chemo','Viral Infection','Aplastic Anemia','SLE','HIV','Sepsis (late)','MDS','Hypersplenism'] },
  { cc: 'เกล็ดเลือดต่ำ', ccEn: 'Thrombocytopenia', ddxList: ['ITP','DIC','Dengue','TTP/HUS','HIT','Drug-induced','Aplastic','Hypersplenism','MDS','SLE'] },
  { cc: 'เม็ดเลือดทุกชนิดต่ำ', ccEn: 'Pancytopenia', ddxList: ['Aplastic Anemia','MDS','Leukemia','B12/Folate Def','SLE','Hypersplenism','Drug/Chemo','HIV','TB (miliary)'] },
  { cc: 'ไข้', ccEn: 'Fever', ddxList: ['Dengue','Pneumonia','UTI','Leptospirosis','Scrub Typhus','Malaria','Malignancy','Autoimmune','Drug Fever','TB','Infective Endocarditis','Abscess'] },
  { cc: 'ปวดข้อ', ccEn: 'Arthritis', ddxList: ['Gout','Septic Arthritis','RA','OA','SLE','Reactive Arthritis','Psoriatic','Gonococcal','Pseudogout'] },
  { cc: 'ปวดหลัง', ccEn: 'Back Pain', ddxList: ['Mechanical','HNP','Spinal Stenosis','Compression Fracture','Metastasis','Cauda Equina','Ankylosing spondylitis','Infection (Discitis/Epidural Abscess)','AAA'] },
  { cc: 'ปวดศีรษะ', ccEn: 'Headache', ddxList: ['Tension headache','Migraine','SAH','Meningitis','Brain Tumor','Temporal Arteritis','Cluster headache','Medication Overuse headache','Idiopathic Intracranial HTN','Sinusitis'] },
  { cc: 'ชัก', ccEn: 'Seizure', ddxList: ['Epilepsy','Febrile Seizure','Stroke/ICH','Metabolic (Hypo-Na/Glucose/Ca)','Brain Tumor','Meningitis/Encephalitis','Drug/Alcohol Withdrawal','Eclampsia','Trauma'] },
  { cc: 'อ่อนแรง', ccEn: 'Weakness', ddxList: ['Stroke','GBS','MG','Cord Compression','ALS','Myopathy','Peripheral Neuropathy','MS','Hypokalemia','Transverse Myelitis'] },
  { cc: 'ความรู้สึกตัวลดลง', ccEn: 'Altered Consciousness', ddxList: ['Stroke/ICH','SAH','Metabolic (Hepatic/Uremic/DKA)','Hypoglycemia','Drug/Toxin','Infection (Meningitis/Encephalitis)','Status Epilepticus','Trauma','Hypo/Hypernatremia'] },
  { cc: 'เพ้อ', ccEn: 'Delirium', ddxList: ['Infection/Sepsis','Metabolic','Drug/Medication','Alcohol Withdrawal','Pain/Urinary Retention','CNS Lesion','Hypoxia','Constipation','Post-op'] },
  { cc: 'เวียนศีรษะ', ccEn: 'Vertigo', ddxList: ['BPPV','Meniere Disease','Vestibular Neuritis','VBI','Brainstem Stroke','Acoustic Neuroma','Labyrinthitis','Medication','Migraine-associated'] },
  { cc: 'ชา', ccEn: 'Numbness', ddxList: ['DM Neuropathy','Carpal Tunnel','Radiculopathy','Stroke','B12 Deficiency','GBS','MS','Peripheral Neuropathy','Leprosy'] },
  { cc: 'การเคลื่อนไหวผิดปกติ', ccEn: 'Movement Disorders', ddxList: ['Parkinson Disease','Essential Tremor','Drug-induced (EPS)','Huntington','Wilson Disease','Cerebellar Ataxia','Dystonia','Tardive Dyskinesia','Chorea (SLE/Sydenham)'] },
  { cc: 'ความบกพร่องทางสมอง', ccEn: 'Cognitive Impairment', ddxList: ['Alzheimer','Vascular Dementia','Lewy Body dementia','Frontotemporal dementia','Normal Pressure Hydrocephalus','B12 Deficiency','Hypothyroid','Depression (Pseudodementia)','Subdural Hematoma','HIV'] },
  { cc: 'ตามัว', ccEn: 'Visual Disorder', ddxList: ['Optic Neuritis (MS)','Glaucoma','Cataract','Retinal Detachment','CRAO/CRVO','Temporal Arteritis','DM Retinopathy','Migraine Aura','Stroke (Occipital)'] },
  { cc: 'เห็นภาพซ้อน', ccEn: 'Diplopia', ddxList: ['CN III Palsy (DM/Aneurysm)','CN VI Palsy','MG','Thyroid Eye Disease','MS','Orbital Mass','Cavernous Sinus','Brainstem Stroke'] },
  { cc: 'หนังตาตก', ccEn: 'Ptosis', ddxList: ['MG','CN III Palsy','Horner Syndrome','Congenital','Senile/Aponeurotic','Myotonic Dystrophy'] },
  { cc: 'Stroke ในคนอายุน้อย', ccEn: 'Stroke in Young', ddxList: ['Cardioembolism (AF/PFO/Endocarditis)','Dissection (Carotid/Vertebral)','Vasculitis','Antiphospholipid syndrome','Moyamoya','Drug (Cocaine/Amphetamine)','Sickle Cell','Coagulopathy'] },
  { cc: 'น้ำหนักลด', ccEn: 'Weight Loss', ddxList: ['DM','Hyperthyroid','Malignancy','TB','Depression','HIV','Anorexia Nervosa','Malabsorption','COPD','Addison'] },
  { cc: 'น้ำหนักเพิ่ม', ccEn: 'Weight Gain', ddxList: ['Primary Obesity','Cushing','Hypothyroid','PCOS','Drug (Steroid/Insulin/Antipsychotic)','Insulinoma','Genetic (Prader-Willi)'] },
  { cc: 'นอนไม่หลับ', ccEn: 'Sleep Disorders', ddxList: ['Insomnia','OSA','Narcolepsy','Restless Leg','GERD','Depression','Anxiety','Drug/Caffeine','Shift Work'] },
  { cc: 'ผื่น', ccEn: 'Skin Manifestations', ddxList: ['Drug Eruption','Eczema/Dermatitis','Fungal','Psoriasis','SJS/TEN','Urticaria','Herpes Zoster','Scabies','Contact Dermatitis','Pemphigus vulgaris'] },
  { cc: 'สารคัดหลั่งจากท่อปัสสาวะ', ccEn: 'Urethral Discharge', ddxList: ['Gonorrhea','Chlamydia','Non-gonococcal Urethritis','Trichomonas','UTI'] },
  { cc: 'แผลที่อวัยวะเพศ', ccEn: 'Genital Ulcers', ddxList: ['Syphilis','Herpes','Chancroid','LGV','Behcet','Granuloma Inguinale','Fixed Drug Eruption'] },
  { cc: 'ช็อค', ccEn: 'Shock', ddxList: ['Hypovolemic (Hemorrhagic/Dehydration)','Septic','Cardiogenic (MI/Tamponade)','Obstructive (PE/Tension Pneumo/Tamponade)','Anaphylactic','Neurogenic','Adrenal Crisis'] },
]

async function seedArenaCards({ force = false } = {}) {
  const existing = await ArenaCard.countDocuments()
  if (existing > 0 && !force) {
    console.log(`[Arena] Already ${existing} cards — skip seed`)
    return
  }

  // read Excel
  let rows
  try {
    const XLSX = require('xlsx')
    const file = require('path').join(__dirname, '../../../../MedNinja_USMLE_Flashcards_462.xlsx')
    const wb = XLSX.readFile(file)
    const ws = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(ws)
  } catch (err) {
    console.error('[Arena] Cannot read Excel:', err.message)
    return
  }

  // build DDx → ccGroup mapping
  const ddxToCc = {}
  for (const g of CC_GROUPS) {
    for (const ddx of g.ddxList) {
      ddxToCc[ddx] = { ccGroup: g.cc, ccGroupEn: g.ccEn }
    }
  }

  const cards = rows.map(row => {
    const ddx = (row['Disease / Condition'] || '').trim()
    const buzzwords = (row['USMLE Buzzwords / Keywords'] || '').trim()
    const mapping = ddxToCc[ddx] || { ccGroup: '', ccGroupEn: '' }
    return {
      num: row['#'],
      ddx,
      buzzwords,
      ccGroup: mapping.ccGroup,
      ccGroupEn: mapping.ccGroupEn,
      isActive: true,
      isAudited: false
    }
  }).filter(c => c.ddx && c.buzzwords)

  await ArenaCard.deleteMany({})
  await ArenaCard.insertMany(cards)
  console.log(`[Arena] Seeded ${cards.length} cards (${CC_GROUPS.length} CC groups)`)
}

module.exports = { seedArenaCards, CC_GROUPS }
