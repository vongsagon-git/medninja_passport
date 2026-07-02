const FlashcardCC = require('./FlashcardCC.model')

const SEED = [
  // ═══ Cardiovascular (7) ═══
  {cc:'เจ็บหน้าอก',ccEn:'Chest Pain',ddxList:['ACS/MI','PE','Aortic Dissection','Pneumothorax','Pericarditis','GERD','Musculoskeletal','Panic Attack','Boerhaave Syndrome','Costochondritis'],order:1},
  {cc:'ใจสั่น',ccEn:'Palpitation',ddxList:['AF','SVT','VT','PVC/PAC','Hyperthyroidism','Anemia','Anxiety','Caffeine/Drug','Pheochromocytoma','Hypoglycemia'],order:2},
  {cc:'เป็นลม',ccEn:'Syncope',ddxList:['Vasovagal','Cardiac Arrhythmia','Orthostatic Hypotension','Aortic Stenosis','PE','Carotid Sinus','Situational','Seizure (mimic)'],order:3},
  {cc:'หัวใจวาย',ccEn:'CHF / Cardiomyopathy',ddxList:['Ischemic CM','Dilated CM','Hypertensive CM','Valvular','HOCM','Peripartum CM','Myocarditis','Restrictive CM'],order:4},
  {cc:'ปวดขาเวลาเดิน',ccEn:'Claudication',ddxList:['PAD/Atherosclerosis','Spinal Stenosis','DVT','Buerger Disease','Vasculitis','Musculoskeletal'],order:5},
  {cc:'ความดันสูงในคนอายุน้อย',ccEn:'Hypertension in Young',ddxList:['Renal Artery Stenosis','Pheochromocytoma','Cushing','Coarctation of Aorta','Primary Aldosteronism','Essential HTN','OCP-related'],order:6},
  {cc:'น้ำในเยื่อหุ้มหัวใจ',ccEn:'Pericardial Effusion',ddxList:['Pericarditis (viral)','TB','Malignancy','Uremia','Hypothyroid','SLE','Trauma','Post-MI (Dressler)'],order:7},

  // ═══ Respiratory (6) ═══
  {cc:'หอบเหนื่อย',ccEn:'Dyspnea',ddxList:['Heart Failure','Pneumonia','Asthma','COPD Exacerbation','PE','Anemia','Pleural Effusion','Pneumothorax','Anxiety','ILD'],order:8},
  {cc:'ไอ',ccEn:'Cough',ddxList:['Postnasal Drip','Asthma','GERD','TB','Pneumonia','ACEi Cough','Lung CA','Bronchiectasis','ILD','Pertussis'],order:9},
  {cc:'ไอเป็นเลือด',ccEn:'Hemoptysis',ddxList:['TB','Lung CA','Bronchiectasis','PE','Pneumonia','Mitral Stenosis','Goodpasture','Vasculitis','AV Malformation'],order:10},
  {cc:'เขียว',ccEn:'Cyanosis',ddxList:['Central: Lung Dz','Central: R-to-L Shunt','Central: Methemoglobin','Peripheral: Shock','Peripheral: Cold','Peripheral: Raynaud','Peripheral: PAD'],order:11},
  {cc:'นิ้วปุ้ม',ccEn:'Clubbing',ddxList:['Lung CA','Bronchiectasis','ILD','Cyanotic Heart Dz','Liver Cirrhosis','IBD','Infective Endocarditis','Mesothelioma'],order:12},
  {cc:'น้ำในเยื่อหุ้มปอด',ccEn:'Pleural Effusion',ddxList:['CHF','Pneumonia (Parapneumonic)','TB','Malignancy','PE','Cirrhosis','Nephrotic','Pancreatitis','Chylothorax'],order:13},

  // ═══ Gastrointestinal (13) ═══
  {cc:'ปวดท้อง',ccEn:'Abdominal Pain',ddxList:['Appendicitis','Pancreatitis','Cholecystitis','Bowel Obstruction','Perforation','Ectopic Pregnancy','Ureterolithiasis','Mesenteric Ischemia','AAA','Peptic Ulcer','Diverticulitis'],order:14},
  {cc:'ตัวเหลืองตาเหลือง',ccEn:'Jaundice',ddxList:['Hepatitis (viral)','Choledocholithiasis','Pancreatic CA','Hemolysis','Gilbert','Drug-induced','Alcoholic Hepatitis','Cholangiocarcinoma','PBC/PSC'],order:15},
  {cc:'กลืนลำบาก',ccEn:'Dysphagia',ddxList:['Esophageal CA','Stricture','Achalasia','GERD','Stroke','MG','Schatzki Ring','Eosinophilic Esophagitis','Zenker Diverticulum'],order:16},
  {cc:'คลื่นไส้ / อาเจียน / สะอึก',ccEn:'Nausea / Vomiting / Hiccups',ddxList:['Gastroenteritis','Bowel Obstruction','Pregnancy','Drug/Chemo','Raised ICP','DKA','Gastroparesis','Pancreatitis','MI (inferior)'],order:17},
  {cc:'อาหารไม่ย่อย',ccEn:'Dyspepsia',ddxList:['Functional Dyspepsia','Peptic Ulcer','GERD','Gastric CA','H. pylori','Drug (NSAID)','Gastroparesis','Biliary Colic'],order:18},
  {cc:'เลือดออกทางเดินอาหารบน',ccEn:'Upper GI Bleeding',ddxList:['Peptic Ulcer','Esophageal Varices','Mallory-Weiss','Gastric CA','Erosive Gastritis','Dieulafoy','AVM','Aortoenteric Fistula'],order:19},
  {cc:'เลือดออกทางเดินอาหารล่าง',ccEn:'Lower GI Bleeding',ddxList:['Hemorrhoids','Colorectal CA','Diverticular Bleed','IBD','Angiodysplasia','Ischemic Colitis','Polyp','Infectious Colitis'],order:20},
  {cc:'ท้องเสียเฉียบพลัน',ccEn:'Acute Diarrhea',ddxList:['Viral Gastroenteritis','Bacterial (Salmonella/Shigella)','Food Poisoning','C. difficile','Traveler','Cholera','Amebiasis'],order:21},
  {cc:'ท้องเสียเรื้อรัง',ccEn:'Chronic Diarrhea',ddxList:['IBS','IBD','Celiac','Hyperthyroidism','Chronic Infection','Lactose Intolerance','Microscopic Colitis','Pancreatic Insufficiency','Colorectal CA'],order:22},
  {cc:'ท้องผูก',ccEn:'Constipation',ddxList:['Functional','Drug-induced (Opioid/CCB/Anticholinergic)','Colorectal CA','Hypothyroid','Hypercalcemia','Hirschsprung','IBS-C','Stricture'],order:23},
  {cc:'ท้องบวมโต / ท้องมาน',ccEn:'Abdominal Swelling / Ascites',ddxList:['Cirrhosis','Malignancy','CHF','Nephrotic','TB Peritonitis','Pancreatitis','Budd-Chiari','Myxedema'],order:24},
  {cc:'ก้อนในท้อง',ccEn:'Abdominal Mass',ddxList:['Hepatomegaly','Splenomegaly','Renal Mass','Ovarian Mass','AAA','Lymphoma','Colorectal CA','Pancreatic Mass','Mesenteric Mass'],order:25},
  {cc:'ถ่ายเป็นเลือด',ccEn:'Hematochezia',ddxList:['Hemorrhoids','Colorectal CA','IBD','Diverticular','Anal Fissure','Polyp','Infectious Colitis','Ischemic Colitis','Meckel (เด็ก)'],order:26},

  // ═══ Renal / Urinary (11) ═══
  {cc:'บวม',ccEn:'Edema',ddxList:['CHF','Nephrotic Syndrome','Cirrhosis','CKD','DVT','Drug (CCB/NSAID)','Hypothyroid','Lymphedema','Pregnancy','Allergic'],order:27},
  {cc:'ปัสสาวะเป็นเลือด',ccEn:'Hematuria',ddxList:['UTI','Urolithiasis','GN','Bladder CA','Renal CA','PKD','IgA Nephropathy','Trauma','Exercise-induced','Prostate'],order:28},
  {cc:'ปัสสาวะออกน้อย',ccEn:'Oliguria / Anuria',ddxList:['Prerenal (Dehydration/Shock)','Renal (ATN/GN)','Postrenal (Obstruction)','AKI','Sepsis','Rhabdomyolysis','HRS'],order:29},
  {cc:'ปัสสาวะมาก',ccEn:'Polyuria',ddxList:['DM','Diabetes Insipidus (Central/Nephrogenic)','Psychogenic Polydipsia','Hypercalcemia','Hypokalemia','CKD','Drug (Diuretic/Lithium)'],order:30},
  {cc:'ปัสสาวะลำบาก / แสบขัด',ccEn:'Dysuria',ddxList:['UTI','STI (Chlamydia/Gonorrhea)','Vaginitis','Prostatitis','Urethritis','Interstitial Cystitis','Urolithiasis'],order:31},
  {cc:'ปัสสาวะสีแดง',ccEn:'Red Urine',ddxList:['Hematuria','Hemoglobinuria','Myoglobinuria','Beetroot/Food','Drug (Rifampicin)','Porphyria'],order:32},
  {cc:'โปรตีนในปัสสาวะ',ccEn:'Proteinuria',ddxList:['DM Nephropathy','GN','Nephrotic Syndrome','HTN Nephrosclerosis','Amyloidosis','SLE Nephritis','Orthostatic','Exercise'],order:33},
  {cc:'กลุ่มอาการไตรั่ว',ccEn:'Nephrotic Syndrome',ddxList:['Minimal Change (เด็ก)','Membranous (ผู้ใหญ่)','FSGS','DM Nephropathy','SLE Nephritis','Amyloidosis'],order:34},
  {cc:'ไตอักเสบเร็ว',ccEn:'RPGN',ddxList:['Anti-GBM (Goodpasture)','ANCA Vasculitis','Immune Complex (SLE/IgA/Post-strep)','Crescentic GN'],order:35},
  {cc:'ไตวาย / Azotemia',ccEn:'Azotemia',ddxList:['Prerenal','Intrinsic Renal (ATN/AIN/GN)','Postrenal (Obstruction)','CKD','HRS','Contrast Nephropathy'],order:36},
  {cc:'ทางเดินปัสสาวะอุดตัน',ccEn:'Urinary Tract Obstruction',ddxList:['Urolithiasis','BPH','Urethral Stricture','Pelvic Mass','Neurogenic Bladder','Blood Clot','CA (Bladder/Cervix/Prostate)'],order:37},

  // ═══ Endocrine (4) ═══
  {cc:'ไทรอยด์ผิดปกติ',ccEn:'Thyroid Disorders',ddxList:['Graves Disease','Toxic Multinodular Goiter','Thyroiditis','Hashimoto','Iodine Deficiency','Drug (Amiodarone/Lithium)','Thyroid Storm','Myxedema Coma','Thyroid CA'],order:38},
  {cc:'ต่อมหมวกไตผิดปกติ',ccEn:'Adrenal Disorders',ddxList:['Cushing Syndrome','Addison Disease','Pheochromocytoma','Primary Aldosteronism (Conn)','Adrenal Insufficiency','CAH','Adrenal Crisis'],order:39},
  {cc:'แคลเซียมผิดปกติ',ccEn:'Calcium Disorders',ddxList:['Hypercalcemia: Hyperparathyroid','Hypercalcemia: Malignancy','Hypercalcemia: Vit D','Hypocalcemia: Hypoparathyroid','Hypocalcemia: CKD','Hypocalcemia: Vit D Def','Hypocalcemia: Pancreatitis'],order:40},
  {cc:'เบาหวาน',ccEn:'Diabetes Mellitus',ddxList:['Type 1 DM','Type 2 DM','Gestational DM','MODY','Secondary (Steroid/Cushing/Pancreatitis)','DKA','HHS','Hypoglycemia'],order:41},

  // ═══ Hematology (9) ═══
  {cc:'ซีด',ccEn:'Anemia',ddxList:['Iron Deficiency','Thalassemia','B12/Folate Deficiency','Hemolytic','Anemia of Chronic Disease','Aplastic','Sideroblastic','CKD','Myelodysplastic'],order:42},
  {cc:'เลือดออกผิดปกติ',ccEn:'Abnormal Bleeding',ddxList:['Thrombocytopenia','Coagulopathy','DIC','Liver Disease','vWD','Hemophilia','Drug (Warfarin/DOAC/Antiplatelet)','Vit K Deficiency'],order:43},
  {cc:'ต่อมน้ำเหลืองโต',ccEn:'Lymphadenopathy',ddxList:['Reactive (Infection)','Lymphoma','TB','Metastasis','SLE','Sarcoidosis','EBV/CMV','HIV','Cat Scratch Disease'],order:44},
  {cc:'ม้ามโต',ccEn:'Splenomegaly',ddxList:['Portal Hypertension','Lymphoma/Leukemia','Hemolytic Anemia','Infection (Malaria/EBV)','Myeloproliferative','Storage Disease','SLE','Sarcoidosis'],order:45},
  {cc:'เม็ดเลือดแดงมาก',ccEn:'Polycythemia',ddxList:['Polycythemia Vera','Secondary (Hypoxia/COPD/OSA)','EPO-producing Tumor','Dehydration (Relative)','High Altitude'],order:46},
  {cc:'เม็ดเลือดขาวสูง',ccEn:'Leukocytosis',ddxList:['Infection','Stress/Steroid','Leukemia (CML/CLL/AML/ALL)','Smoking','Drug','Myeloproliferative','Allergic'],order:47},
  {cc:'เม็ดเลือดขาวต่ำ',ccEn:'Leukopenia',ddxList:['Drug/Chemo','Viral Infection','Aplastic Anemia','SLE','HIV','Sepsis (late)','MDS','Hypersplenism'],order:48},
  {cc:'เกล็ดเลือดต่ำ',ccEn:'Thrombocytopenia',ddxList:['ITP','DIC','Dengue','TTP/HUS','HIT','Drug-induced','Aplastic','Hypersplenism','MDS','SLE'],order:49},
  {cc:'เม็ดเลือดทุกชนิดต่ำ',ccEn:'Pancytopenia',ddxList:['Aplastic Anemia','MDS','Leukemia','B12/Folate Def','SLE','Hypersplenism','Drug/Chemo','HIV','TB (miliary)'],order:50},

  // ═══ Infectious Disease (1) ═══
  {cc:'ไข้',ccEn:'Fever',ddxList:['Dengue','Pneumonia','UTI','Leptospirosis','Scrub Typhus','Malaria','Malignancy','Autoimmune','Drug Fever','TB','Infective Endocarditis','Abscess'],order:51},

  // ═══ Rheumatology / MSK (2) ═══
  {cc:'ปวดข้อ / ข้ออักเสบ',ccEn:'Arthralgia / Arthritis',ddxList:['Gout','Septic Arthritis','RA','OA','SLE','Reactive Arthritis','Psoriatic','Gonococcal','Crystal (Pseudogout)'],order:52},
  {cc:'ปวดหลัง',ccEn:'Back Pain',ddxList:['Mechanical','HNP','Spinal Stenosis','Compression Fracture','Metastasis','Cauda Equina','AS','Infection (Discitis/Epidural Abscess)','AAA'],order:53},

  // ═══ Neurology (13) ═══
  {cc:'ปวดศีรษะ',ccEn:'Headache',ddxList:['Tension','Migraine','SAH','Meningitis','Brain Tumor','Temporal Arteritis','Cluster','Medication Overuse','Idiopathic Intracranial HTN','Sinusitis'],order:54},
  {cc:'ชัก',ccEn:'Seizure',ddxList:['Epilepsy','Febrile Seizure','Stroke/ICH','Metabolic (Hypo-Na/Glucose/Ca)','Brain Tumor','Meningitis/Encephalitis','Drug/Alcohol Withdrawal','Eclampsia','Trauma'],order:55},
  {cc:'อ่อนแรง',ccEn:'Weakness',ddxList:['Stroke','GBS','MG','Cord Compression','ALS','Myopathy','Peripheral Neuropathy','MS','Hypokalemia','Transverse Myelitis'],order:56},
  {cc:'ความรู้สึกตัวลดลง',ccEn:'Alteration of Consciousness',ddxList:['Stroke/ICH','SAH','Metabolic (Hepatic/Uremic/DKA)','Hypoglycemia','Drug/Toxin','Infection (Meningitis/Encephalitis)','Status Epilepticus','Trauma','Hypo/Hypernatremia'],order:57},
  {cc:'เพ้อ',ccEn:'Delirium',ddxList:['Infection/Sepsis','Metabolic','Drug/Medication','Alcohol Withdrawal','Pain/Urinary Retention','CNS Lesion','Hypoxia','Constipation','Post-op'],order:58},
  {cc:'เวียนศีรษะ',ccEn:'Vertigo',ddxList:['BPPV','Meniere Disease','Vestibular Neuritis','VBI','Brainstem Stroke','Acoustic Neuroma','Labyrinthitis','Medication','Migraine-associated'],order:59},
  {cc:'ชา',ccEn:'Numbness',ddxList:['DM Neuropathy','Carpal Tunnel','Radiculopathy','Stroke','B12 Deficiency','GBS','MS','Peripheral Neuropathy','Leprosy'],order:60},
  {cc:'การเคลื่อนไหวผิดปกติ',ccEn:'Movement Disorders',ddxList:['Parkinson Disease','Essential Tremor','Drug-induced (EPS)','Huntington','Wilson Disease','Cerebellar Ataxia','Dystonia','Tardive Dyskinesia','Chorea (SLE/Sydenham)'],order:61},
  {cc:'ความบกพร่องทางสมอง',ccEn:'Cognitive Impairment',ddxList:['Alzheimer','Vascular Dementia','Lewy Body','Frontotemporal','NPH','B12 Deficiency','Hypothyroid','Depression (Pseudodementia)','Subdural Hematoma','HIV'],order:62},
  {cc:'ตามัว / มองไม่เห็น',ccEn:'Visual Disorder',ddxList:['Optic Neuritis (MS)','Glaucoma','Cataract','Retinal Detachment','CRAO/CRVO','Temporal Arteritis','DM Retinopathy','Migraine Aura','Stroke (Occipital)'],order:63},
  {cc:'เห็นภาพซ้อน',ccEn:'Diplopia',ddxList:['CN III Palsy (DM/Aneurysm)','CN VI Palsy','MG','Thyroid Eye Disease','MS','Orbital Mass','Cavernous Sinus','Brainstem Stroke'],order:64},
  {cc:'หนังตาตก',ccEn:'Ptosis',ddxList:['MG','CN III Palsy','Horner Syndrome','Congenital','Senile/Aponeurotic','Myotonic Dystrophy'],order:65},
  {cc:'Stroke ในคนอายุน้อย',ccEn:'Stroke in Young',ddxList:['Cardioembolism (AF/PFO/Endocarditis)','Dissection (Carotid/Vertebral)','Vasculitis','Antiphospholipid','Moyamoya','Drug (Cocaine/Amphetamine)','Sickle Cell','Coagulopathy'],order:66},

  // ═══ Miscellaneous (7) ═══
  {cc:'น้ำหนักลด',ccEn:'Weight Loss',ddxList:['DM','Hyperthyroid','Malignancy','TB','Depression','HIV','Anorexia Nervosa','Malabsorption','COPD','Addison'],order:67},
  {cc:'น้ำหนักเพิ่ม / อ้วน',ccEn:'Weight Gaining / Obesity',ddxList:['Primary Obesity','Cushing','Hypothyroid','PCOS','Drug (Steroid/Insulin/Antipsychotic)','Insulinoma','Genetic (Prader-Willi)'],order:68},
  {cc:'นอนไม่หลับ',ccEn:'Sleep Disorders',ddxList:['Insomnia','OSA','Narcolepsy','Restless Leg','GERD','Depression','Anxiety','Drug/Caffeine','Shift Work'],order:69},
  {cc:'ผื่น / อาการทางผิวหนัง',ccEn:'Skin Manifestations',ddxList:['Drug Eruption','Eczema/Dermatitis','Fungal','Psoriasis','SJS/TEN','Urticaria','Herpes Zoster','Scabies','Contact Dermatitis','Pemphigus'],order:70},
  {cc:'สารคัดหลั่งจากท่อปัสสาวะ',ccEn:'Urethral Discharge',ddxList:['Gonorrhea','Chlamydia','Non-gonococcal Urethritis','Trichomonas','UTI'],order:71},
  {cc:'แผลที่อวัยวะเพศ',ccEn:'Genital Ulcers',ddxList:['Syphilis (painless)','Herpes (painful)','Chancroid (painful)','LGV','Behcet','Granuloma Inguinale','Fixed Drug Eruption'],order:72},
  {cc:'ช็อค',ccEn:'Shock',ddxList:['Hypovolemic (Hemorrhagic/Dehydration)','Septic','Cardiogenic (MI/Tamponade)','Obstructive (PE/Tension Pneumo/Tamponade)','Anaphylactic','Neurogenic','Adrenal Crisis'],order:73},
]

SEED.forEach(s => { s.ddxCount = s.ddxList.length })

async function seedFlashcardCC({ force = false } = {}) {
  const existing = await FlashcardCC.countDocuments()
  if (existing > 0 && !force) {
    console.log(`[FlashcardCC] Already ${existing} CC cards — skip seed`)
    return
  }
  await FlashcardCC.deleteMany({})
  await FlashcardCC.insertMany(SEED)
  console.log(`[FlashcardCC] Seeded ${SEED.length} CC cards (replaced all)`)
}

module.exports = { seedFlashcardCC }
