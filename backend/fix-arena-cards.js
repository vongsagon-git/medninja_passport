/**
 * Fix Arena DDx Cards — แก้ทุกการ์ดตามผลตรวจ
 * 1. ย้าย clue ให้อยู่ถูกหมวด (history/pe/ix)
 * 2. ลบ treatment ออกจาก clues
 * 3. แก้ decoys ให้เกี่ยวข้องกับ CC group
 * 4. แก้ข้อมูลถูกตัด/typo
 * 5. เพิ่ม CC + decoys ให้ 28 การ์ดที่ขาด
 */
const mongoose = require('mongoose')
const MONGO_URI = 'mongodb+srv://doadmin:461KbE859Fhe02AL@db-mongodb-sgp1-medninja-57a9a153.mongo.ondigitalocean.com/lms?tls=true&authSource=admin'
const conn = mongoose.createConnection(MONGO_URI)
const ArenaCard = conn.model('ArenaCard', require('./src/modules/arena/ArenaCard.model').schema)

// ═══ FIX MAP: id → fixes ═══
const fixes = {
  // ════════════════════════════════════════
  // 28 การ์ดที่ไม่มี CC + Decoys
  // ════════════════════════════════════════
  '69e901c01cd805199ebda095': { // AS (Ankylosing Spondylitis)
    history: ['Young M', 'inflammatory back pain', 'morning stiffness >1hr', 'improves with activity'],
    pe: [],
    ix: ['bamboo spine on X-ray', 'HLA-B27+'],
    cc: 'ปวดหลัง', ccEn: 'Back Pain',
    decoys: ['Mechanical', 'HNP', 'Spinal Stenosis', 'Compression Fracture', 'Infection (Discitis/Epidural Abscess)', 'Metastasis']
  },
  '69e901c01cd805199ebda0ef': { // Antiphospholipid
    history: ['Recurrent thrombosis', 'recurrent miscarriages'],
    ix: ['↑PTT paradox', 'lupus anticoagulant+', 'anti-cardiolipin Ab+'],
    cc: 'ลิ่มเลือดอุดตัน', ccEn: 'Thrombosis',
    decoys: ['Factor V Leiden', 'Protein C/S Deficiency', 'DIC', 'HIT', 'SLE', 'Prothrombin Gene Mutation']
  },
  '69e901c01cd805199ebd9f97': { // Methemoglobin
    history: ['Chocolate brown blood', 'dapsone/nitrates/benzocaine exposure'],
    pe: ['pulse ox ~85% unchanged with O2'],
    ix: ['methemoglobin level on co-oximetry'],
    cc: 'เขียวคล้ำ', ccEn: 'Cyanosis',
    decoys: ['Central: Lung Dz', 'Central: R-to-L Shunt', 'Peripheral: Shock', 'Peripheral: Cold', 'Polycythemia', 'CO Poisoning']
  },
  '69e901c01cd805199ebd9f96': { // R-to-L Shunt
    history: ['TOF/TGA/truncus', 'neonate'],
    pe: ['Cyanosis no improvement with O2'],
    ix: ['hyperoxia test fails'],
    cc: 'เขียวคล้ำ', ccEn: 'Cyanosis',
    decoys: ['Central: Lung Dz', 'Central: Methemoglobin', 'Peripheral: Shock', 'Peripheral: Cold', 'Polycythemia', 'Eisenmenger']
  },
  '69e901c01cd805199ebda114': { // Chancroid
    history: ['H. ducreyi', 'sexual contact'],
    pe: ['Painful soft ulcer', 'tender suppurative LAD'],
    ix: ['school of fish on Gram stain'],
    cc: 'แผลที่อวัยวะเพศ', ccEn: 'Genital Ulcer',
    decoys: ['Syphilis', 'Herpes (HSV)', 'LGV', 'Granuloma Inguinale', 'Behcet', 'Fixed Drug Eruption']
  },
  '69e901c01cd805199ebda09d': { // Cluster Headache
    history: ['Unilateral orbital pain', 'M', 'cluster in time', 'occurs at night'],
    pe: ['lacrimation', 'rhinorrhea', 'Horner syndrome'],
    ix: [],
    cc: 'ปวดศีรษะ', ccEn: 'Headache',
    decoys: ['Migraine', 'Tension', 'Sinusitis', 'SAH', 'Meningitis', 'Idiopathic Intracranial HTN']
  },
  '69e901c01cd805199ebda090': { // Pseudogout
    history: ['CPPD', 'elderly', 'hemochromatosis association'],
    pe: ['Knee/wrist acute arthritis'],
    ix: ['chondrocalcinosis on X-ray', 'rhomboid positive birefringent crystals'],
    cc: 'ปวดข้อ', ccEn: 'Joint Pain',
    decoys: ['Gout', 'Septic Arthritis', 'Reactive Arthritis', 'RA', 'OA', 'SLE']
  },
  '69e901c01cd805199ebd9f6d': { // Dilated CM
    history: ['alcohol/viral/familial/peripartum'],
    pe: ['S3 gallop', '4-chamber dilation'],
    ix: ['low EF on echo'],
    cc: 'หัวใจวาย', ccEn: 'Heart Failure',
    decoys: ['Ischemic CM', 'Restrictive CM', 'HOCM', 'Myocarditis', 'Peripartum CM', 'Valvular']
  },
  '69e901c01cd805199ebda0d7': { // Frontotemporal Dementia
    history: ['Early personality/behavior change', 'disinhibition', 'language difficulty', 'young-onset (<65)'],
    pe: [],
    ix: ['frontal/temporal atrophy on MRI', 'Pick bodies on pathology'],
    cc: 'สมองเสื่อม', ccEn: 'Dementia',
    decoys: ['Alzheimer', 'Lewy Body', 'Vascular Dementia', 'NPH', 'CJD', 'Huntington']
  },
  '69e901c01cd805199ebda001': { // GN
    history: ['post-strep/IgA/lupus'],
    pe: ['HTN', 'edema'],
    ix: ['Hematuria', 'RBC casts', 'proteinuria'],
    cc: 'ปัสสาวะผิดปกติ', ccEn: 'Abnormal Urinalysis',
    decoys: ['UTI', 'Nephrotic Syndrome', 'IgA Nephropathy', 'Lupus Nephritis', 'Interstitial Nephritis', 'Diabetic Nephropathy']
  },
  '69e901c01cd805199ebda00e': { // HRS
    history: ['cirrhosis', 'refractory ascites', 'no other cause of AKI'],
    pe: ['AKI in cirrhosis'],
    ix: ['low urine Na <10', 'FENa <1%'],
    cc: 'ไตวายเฉียบพลัน', ccEn: 'Acute Kidney Injury',
    decoys: ['Prerenal (Dehydration)', 'ATN', 'Contrast Nephropathy', 'Sepsis', 'Rhabdomyolysis', 'Postrenal (Obstruction)']
  },
  '69e901c01cd805199ebda054': { // Hemolytic Anemia
    history: ['fatigue', 'jaundice'],
    pe: ['pallor', 'scleral icterus'],
    ix: ['↑LDH', '↑indirect bili', '↓haptoglobin', '↑retics', 'schistocytes/spherocytes'],
    cc: 'ซีด', ccEn: 'Anemia',
    decoys: ['Iron Deficiency', 'B12/Folate Deficiency', 'Anemia of Chronic Disease', 'Thalassemia', 'Aplastic', 'Sideroblastic']
  },
  '69e901c01cd805199ebda113': { // Herpes (painful)
    history: ['HSV-2', 'recurrent episodes', 'prodromal tingling'],
    pe: ['Painful grouped vesicles on erythematous base'],
    ix: ['Tzanck smear multinucleated giant cells', 'PCR'],
    cc: 'แผลที่อวัยวะเพศ', ccEn: 'Genital Ulcer',
    decoys: ['Syphilis', 'Chancroid', 'LGV', 'Granuloma Inguinale', 'Behcet', 'Fixed Drug Eruption']
  },
  '69e901c01cd805199ebd9f6e': { // Hypertensive CM
    history: ['Long-standing HTN', 'concentric LVH'],
    pe: ['S4 gallop', 'sustained PMI'],
    ix: ['diastolic dysfunction on echo', 'LV hypertrophy on ECG'],
    cc: 'หัวใจวาย', ccEn: 'Heart Failure',
    decoys: ['Ischemic CM', 'Dilated CM', 'HOCM', 'Restrictive CM', 'Valvular', 'Myocarditis']
  },
  '69e901c01cd805199ebda0ca': { // Leprosy
    history: ['M. leprae', 'tuberculoid vs lepromatous', 'endemic area'],
    pe: ['Hypopigmented patches with anesthesia', 'thickened nerves'],
    ix: ['skin biopsy', 'slit-skin smear AFB'],
    cc: 'ผื่น/รอยโรคผิวหนัง', ccEn: 'Skin Lesion',
    decoys: ['Vitiligo', 'Tinea Versicolor', 'Psoriasis', 'Sarcoidosis', 'Fungal', 'Contact Dermatitis']
  },
  '69e901c01cd805199ebda0d6': { // Lewy Body
    history: ['visual hallucinations', 'fluctuating cognition', 'REM sleep behavior disorder'],
    pe: ['parkinsonism (rigidity, bradykinesia)'],
    ix: ['antipsychotic sensitivity (avoid!)', 'DaTscan'],
    cc: 'สมองเสื่อม', ccEn: 'Dementia',
    decoys: ['Alzheimer', 'Frontotemporal', 'Vascular Dementia', 'NPH', 'Parkinson Disease Dementia', 'CJD']
  },
  '69e901c01cd805199ebda09e': { // Medication Overuse Headache
    history: ['Chronic daily headache', 'analgesic use >15 days/month', 'rebound pattern'],
    pe: [],
    ix: ['clinical diagnosis', 'improves after withdrawal'],
    cc: 'ปวดศีรษะ', ccEn: 'Headache',
    decoys: ['Migraine', 'Tension', 'Cluster', 'Sinusitis', 'Idiopathic Intracranial HTN', 'SAH']
  },
  '69e901c01cd805199ebda0d8': { // NPH
    history: ['elderly'],
    pe: ['Wet-wacky-wobbly (urinary incontinence + dementia + gait apraxia)'],
    ix: ['ventriculomegaly on CT/MRI', 'LP with large volume tap improves gait'],
    cc: 'สมองเสื่อม', ccEn: 'Dementia',
    decoys: ['Alzheimer', 'Lewy Body', 'Frontotemporal', 'Vascular Dementia', 'Subdural Hematoma', 'CJD']
  },
  '69e901c01cd805199ebda004': { // PKD
    history: ['ADPKD (PKD1/2)', 'family hx', 'berry aneurysm association'],
    pe: ['bilateral flank masses', 'HTN'],
    ix: ['bilateral cysts on US/CT', 'hematuria'],
    cc: 'ไตผิดปกติ', ccEn: 'Renal Mass/Cyst',
    decoys: ['Renal CA', 'Simple Cyst', 'Medullary Sponge Kidney', 'ARPKD', 'Renal Abscess', 'Hydronephrosis']
  },
  '69e901c01cd805199ebda10d': { // Pemphigus
    history: ['middle-aged/elderly', 'autoimmune'],
    pe: ['Flaccid bullae', 'oral mucosa involvement', 'Nikolsky sign+'],
    ix: ['desmoglein Ab', 'row of tombstones on histology'],
    cc: 'ผื่น/รอยโรคผิวหนัง', ccEn: 'Skin Lesion',
    decoys: ['Bullous Pemphigoid', 'Dermatitis Herpetiformis', 'Stevens-Johnson', 'Eczema', 'Psoriasis', 'Contact Dermatitis']
  },
  '69e901c01cd805199ebd9f9b': { // PAD
    history: ['Chronic limb ischemia', 'atherosclerosis', 'smoker/DM'],
    pe: ['absent pulses', 'pallor on elevation', 'dependent rubor'],
    ix: ['ABI <0.9'],
    cc: 'ปวดขาเวลาเดิน', ccEn: 'Claudication',
    decoys: ['Buerger Disease', 'Spinal Stenosis', 'DVT', 'Musculoskeletal', 'Compartment Syndrome', 'Venous Insufficiency']
  },
  '69e901c01cd805199ebd9f9a': { // Raynaud
    history: ['Triphasic color change (white-blue-red)', 'cold/stress trigger', 'young F'],
    pe: ['digital pallor → cyanosis → erythema'],
    ix: ['ANA if secondary (CREST/scleroderma)'],
    cc: 'เขียวคล้ำ', ccEn: 'Cyanosis',
    decoys: ['Peripheral: Cold', 'Peripheral: Shock', 'Buerger Disease', 'PAD', 'Frostbite', 'Acrocyanosis']
  },
  '69e901c01cd805199ebda008': { // Prerenal AKI
    history: ['volume depletion', 'hemorrhage/sepsis/CHF'],
    pe: ['dry mucosa', 'tachycardia', 'hypotension'],
    ix: ['BUN:Cr >20', 'FENa <1%', 'urine osm >500', 'bland sediment'],
    cc: 'ไตวายเฉียบพลัน', ccEn: 'Acute Kidney Injury',
    decoys: ['ATN', 'HRS', 'Contrast Nephropathy', 'Postrenal (Obstruction)', 'Rhabdomyolysis', 'AIN']
  },
  '69e901c01cd805199ebda009': { // Renal (ATN/GN)
    history: ['nephrotoxic drugs', 'ischemia', 'post-strep (GN)'],
    pe: ['edema (GN)', 'oliguria'],
    ix: ['BUN:Cr <20', 'FENa >2%', 'urine osm ~300', 'muddy brown casts (ATN)', 'RBC casts (GN)'],
    cc: 'ไตวายเฉียบพลัน', ccEn: 'Acute Kidney Injury',
    decoys: ['Prerenal', 'HRS', 'Contrast Nephropathy', 'Postrenal (Obstruction)', 'Rhabdomyolysis', 'AIN']
  },
  '69e901c01cd805199ebda06e': { // Secondary Polycythemia
    history: ['chronic hypoxia', 'smoker', 'high altitude/COPD/OSA'],
    pe: ['plethoric facies'],
    ix: ['↑Hb', '↑EPO (appropriate)'],
    cc: 'เม็ดเลือดแดงสูง', ccEn: 'Polycythemia',
    decoys: ['Polycythemia Vera', 'EPO-producing Tumor', 'Dehydration (Relative)', 'High Altitude', 'Chronic Lung Disease', 'Smoking']
  },
  '69e901c01cd805199ebd9f6a': { // Situational Syncope
    history: ['Syncope during cough/micturition/defecation', 'vagal-mediated', 'elderly'],
    pe: ['brief LOC', 'rapid recovery'],
    ix: ['clinical diagnosis'],
    cc: 'หมดสติ', ccEn: 'Syncope',
    decoys: ['Vasovagal', 'Orthostatic Hypotension', 'Cardiac Arrhythmia', 'Aortic Stenosis', 'Carotid Sinus', 'Seizure (mimic)']
  },
  '69e901c01cd805199ebda112': { // Syphilis (painless)
    history: ['T. pallidum', 'sexual contact'],
    pe: ['Painless indurated chancre', 'regional LAD (non-tender)'],
    ix: ['RPR/VDRL screening', 'FTA-ABS confirmatory', 'dark-field microscopy'],
    cc: 'แผลที่อวัยวะเพศ', ccEn: 'Genital Ulcer',
    decoys: ['Herpes (HSV)', 'Chancroid', 'LGV', 'Granuloma Inguinale', 'Behcet', 'Fixed Drug Eruption']
  },
  '69e901c01cd805199ebda097': { // Tension Headache
    history: ['Bilateral band-like headache', 'stress-related', 'no nausea/photophobia', 'episodic or daily'],
    pe: ['pericranial tenderness'],
    ix: ['clinical diagnosis'],
    cc: 'ปวดศีรษะ', ccEn: 'Headache',
    decoys: ['Migraine', 'Cluster', 'Sinusitis', 'SAH', 'Meningitis', 'Medication Overuse']
  },

  // ════════════════════════════════════════
  // แก้ Clue ผิดหมวด + Treatment + Decoys
  // ════════════════════════════════════════

  // --- Chest Pain ---
  '69e901c01cd805199ebd9f51': { // ACS/MI
    history: ['Crushing substernal CP', 'radiates L arm/jaw', 'diaphoresis', 'risk factors (DM/HTN/smoking)'],
    ix: ['troponin↑', 'ST-elevation/depression']
  },
  '69e901c01cd805199ebd9f53': { // Aortic Dissection
    history: ['Tearing CP radiating to back', 'Marfan/HTN'],
    pe: ['BP discrepancy between arms'],
    ix: ['intimal flap on CT', 'widened mediastinum']
  },
  '69e901c01cd805199ebd9f55': { // Pericarditis
    history: ['Sharp pleuritic CP relieved leaning forward', 'post-viral'],
    pe: ['pericardial friction rub'],
    ix: ['diffuse ST-elevation + PR-depression']
  },
  '69e901c01cd805199ebd9f58': { // Panic Attack
    history: ['young female', 'Sudden fear + palpitations + SOB', 'peaks 10 min', 'perioral numbness'],
    pe: [],
    ix: ['normal cardiac workup']
  },
  '69e901c01cd805199ebd9f59': { // Boerhaave
    history: ['Forceful vomiting → severe CP'],
    pe: ['subcutaneous emphysema', 'Hamman crunch'],
    ix: ['pneumomediastinum on CXR']
  },

  // --- Cough ---
  '69e901c01cd805199ebd9f89': { // Asthma
    decoys: ['Pertussis', 'ACEi Cough', 'Postnasal Drip', 'GERD', 'COPD', 'TB']
  },
  '69e901c01cd805199ebd9f8d': { // Postnasal Drip
    decoys: ['ACEi Cough', 'Asthma', 'Pertussis', 'GERD', 'COPD', 'TB']
  },
  '69e901c01cd805199ebd9f8e': { // ACEi Cough
    decoys: ['Postnasal Drip', 'Asthma', 'Pertussis', 'GERD', 'COPD', 'TB']
  },
  '69e901c01cd805199ebd9f91': { // Pertussis
    decoys: ['ACEi Cough', 'Asthma', 'Postnasal Drip', 'GERD', 'COPD', 'TB']
  },

  // --- Dyspnea ---
  '69e901c01cd805199ebd9f8a': { // COPD Exacerbation
    history: ['Smoker', '↑dyspnea + ↑sputum purulence + ↑volume (Anthonisen)', 'CO2 retention'],
    pe: ['barrel chest', 'wheezing'],
    ix: ['obstructive PFT', 'ABG']
  },
  '69e901c01cd805199ebd9f8b': { // Pleural Effusion
    history: ['dyspnea', 'pleuritic CP'],
    pe: ['Dullness to percussion', '↓breath sounds', '↓fremitus'],
    ix: ['Light criteria', 'CXR blunted costophrenic angle']
  },
  '69e901c01cd805199ebd9f90': { // Bronchiectasis
    history: ['Chronic productive cough', 'recurrent infections', 'CF/immunodef'],
    pe: ['coarse crackles', 'clubbing'],
    ix: ['tram-track/signet-ring on HRCT']
  },
  '69e901c01cd805199ebd9f87': { // Heart Failure
    history: ['chronic HTN/CAD', 'DOE', 'orthopnea', 'PND'],
    pe: ['JVD', 'bilateral crackles', 'S3', 'peripheral edema'],
    ix: ['↑BNP', 'cardiomegaly on CXR']
  },

  // --- Hemoptysis ---
  '69e901c01cd805199ebd9f92': { // Mitral Stenosis
    history: ['rheumatic', 'AF', 'LA enlargement'],
    pe: ['opening snap', 'diastolic rumble'],
    ix: ['fish mouth valve on echo'],
    decoys: ['AV Malformation', 'Goodpasture', 'TB', 'Lung CA', 'PE', 'Bronchiectasis']
  },
  '69e901c01cd805199ebd9f93': { // Goodpasture
    decoys: ['AV Malformation', 'Mitral Stenosis', 'TB', 'Lung CA', 'PE', 'Bronchiectasis']
  },
  '69e901c01cd805199ebd9f94': { // AV Malformation
    decoys: ['Goodpasture', 'Mitral Stenosis', 'TB', 'Lung CA', 'PE', 'Bronchiectasis']
  },

  // --- ILD ---
  '69e901c01cd805199ebd9f8c': { // ILD
    history: ['Chronic dry cough', 'DOE', 'IPF'],
    pe: ['Velcro crackles', 'clubbing'],
    ix: ['honeycombing HRCT', 'restrictive PFT']
  },

  // --- TB ---
  '69e901c01cd805199ebd9f80': { // TB
    history: ['Chronic cough', 'night sweats', 'weight loss', 'hemoptysis', 'apical'],
    pe: [],
    ix: ['Ghon focus', 'caseating granulomas', 'PPD+', 'AFB smear']
  },

  // --- CHF/Cardiomyopathy ---
  '69e901c01cd805199ebd9f70': { // HOCM
    history: ['Young athlete', 'sudden death', 'AD genetics'],
    pe: ['bisferiens pulse', 'S4', 'systolic murmur ↑ with Valsalva'],
    ix: ['asymmetric septal hypertrophy on echo'],
    decoys: ['Ischemic CM', 'Restrictive CM', 'Valvular', 'Myocarditis', 'Peripartum CM', 'Dilated CM']
  },
  '69e901c01cd805199ebd9f71': { // Peripartum CM
    history: ['multiparous AA', 'HF in last month pregnancy to 5 months postpartum'],
    pe: ['S3'],
    ix: ['dilated LV on echo', 'low EF']
  },
  '69e901c01cd805199ebd9f72': { // Myocarditis
    decoys: ['Valvular', 'Peripartum CM', 'Restrictive CM', 'Ischemic CM', 'HOCM', 'Dilated CM']
  },
  '69e901c01cd805199ebd9f73': { // Restrictive CM
    history: ['Amyloid/sarcoid/hemochromatosis'],
    pe: ['Kussmaul sign'],
    ix: ['diastolic dysfunction', 'biatrial enlargement', 'preserved EF', 'sparkling myocardium (amyloid)'],
    decoys: ['Valvular', 'Peripartum CM', 'Ischemic CM', 'Myocarditis', 'HOCM', 'Dilated CM']
  },
  '69e901c01cd805199ebd9f4f': { // Valvular
    decoys: ['Ischemic CM', 'Myocarditis', 'Restrictive CM', 'HOCM', 'Peripartum CM', 'Dilated CM']
  },

  // --- Syncope ---
  '69e901c01cd805199ebd9f65': { // Vasovagal
    history: ['Syncope after pain/fear/prolonged standing', 'prodrome nausea/diaphoresis', 'young', 'quick recovery'],
    pe: [],
    ix: ['tilt table test'],
    decoys: ['Seizure (mimic)', 'Cardiac Arrhythmia', 'Carotid Sinus', 'Aortic Stenosis', 'Orthostatic Hypotension', 'HOCM']
  },
  '69e901c01cd805199ebd9f66': { // Cardiac Arrhythmia
    decoys: ['Seizure (mimic)', 'Aortic Stenosis', 'Vasovagal', 'Carotid Sinus', 'Orthostatic Hypotension', 'PE']
  },
  '69e901c01cd805199ebd9f67': { // Orthostatic Hypotension
    history: ['Syncope on standing', 'dehydration', 'autonomic failure', 'elderly on diuretics/antihypertensives'],
    pe: ['orthostatic vitals (↓BP ↑HR on standing)'],
    ix: [],
    decoys: ['Cardiac Arrhythmia', 'Carotid Sinus', 'Aortic Stenosis', 'Vasovagal', 'Seizure (mimic)', 'HOCM']
  },
  '69e901c01cd805199ebd9f68': { // Aortic Stenosis
    history: ['Exertional syncope', 'angina', 'dyspnea', 'elderly'],
    pe: ['pulsus parvus et tardus', 'crescendo-decrescendo SEM radiates to carotids'],
    ix: ['calcified valve on echo'],
    decoys: ['Carotid Sinus', 'Vasovagal', 'Seizure (mimic)', 'Orthostatic Hypotension', 'Cardiac Arrhythmia', 'HOCM']
  },
  '69e901c01cd805199ebd9f69': { // Carotid Sinus
    decoys: ['Vasovagal', 'Cardiac Arrhythmia', 'Aortic Stenosis', 'Seizure (mimic)', 'Orthostatic Hypotension', 'HOCM']
  },
  '69e901c01cd805199ebd9f6b': { // Seizure (mimic)
    decoys: ['Carotid Sinus', 'Vasovagal', 'Orthostatic Hypotension', 'Aortic Stenosis', 'Cardiac Arrhythmia', 'Psychogenic']
  },

  // --- Palpitation ---
  '69e901c01cd805199ebd9f5b': { // AF
    history: ['no P-waves', 'stroke risk', 'CHA2DS2-VASc', 'palpitations'],
    pe: ['irregularly irregular'],
    ix: ['ECG: absent P-waves + irregular RR'],
    decoys: ['Caffeine/Drug', 'VT', 'PVC/PAC', 'SVT', 'Hyperthyroidism', 'Anxiety/Panic']
  },
  '69e901c01cd805199ebd9f5c': { // SVT
    history: ['young healthy', 'sudden onset'],
    pe: ['Sudden narrow-complex tachycardia ~150-250', 'terminates with Valsalva'],
    ix: ['ECG: regular narrow-complex tachycardia'],
    decoys: ['AF', 'Caffeine/Drug', 'VT', 'PVC/PAC', 'Hyperthyroidism', 'WPW']
  },
  '69e901c01cd805199ebd9f5d': { // VT
    history: ['structural heart disease', 'post-MI scar'],
    pe: ['Wide-complex tachycardia', 'hemodynamic instability'],
    ix: ['ECG: wide QRS >120ms + AV dissociation'],
    decoys: ['SVT', 'AF', 'Caffeine/Drug', 'PVC/PAC', 'Torsades de Pointes', 'WPW']
  },
  '69e901c01cd805199ebd9f5e': { // PVC/PAC
    decoys: ['Caffeine/Drug', 'SVT', 'AF', 'VT', 'Hyperthyroidism', 'Anxiety/Panic']
  },

  // --- Headache ---
  '69e901c01cd805199ebda098': { // Migraine
    history: ['POUND (pulsatile, one-day, unilateral, N/V, disabling)', 'aura', 'photophobia', 'female'],
    pe: [],
    ix: ['clinical diagnosis'],
    decoys: ['Sinusitis', 'Idiopathic Intracranial HTN', 'Meningitis', 'Cluster', 'Tension', 'SAH']
  },
  '69e901c01cd805199ebda09a': { // Meningitis
    decoys: ['Sinusitis', 'Migraine', 'Idiopathic Intracranial HTN', 'SAH', 'Cluster', 'Tension']
  },
  '69e901c01cd805199ebda09f': { // Idiopathic Intracranial HTN
    decoys: ['Migraine', 'Meningitis', 'Sinusitis', 'Cluster', 'Tension', 'SAH']
  },
  '69e901c01cd805199ebda0a0': { // Sinusitis
    decoys: ['Meningitis', 'Idiopathic Intracranial HTN', 'Migraine', 'Cluster', 'Tension', 'SAH']
  },

  // --- Diarrhea ---
  '69e901c01cd805199ebd9fe0': { // Cholera
    history: ['Rice-water stool', 'severe dehydration', 'V. cholerae', 'contaminated water']
  },
  '69e901c01cd805199ebd9fde': { // C. difficile
    history: ['Antibiotic-associated diarrhea', 'pseudomembranous colitis'],
    ix: ['toxin assay']
  },
  '69e901c01cd805199ebd9fdf': { // Traveler
    history: ['Watery diarrhea after foreign travel', 'ETEC', 'self-limited']
  },
  '69e901c01cd805199ebd9fdc': { // Bacterial (Salmonella/Shigella)
    history: ['Bloody diarrhea', 'fever', 'abd cramps', 'poultry/eggs (Salmonella)', 'reactive arthritis'],
    pe: ['fever', 'dehydration'],
    ix: ['stool culture']
  },
  '69e901c01cd805199ebd9fe4': { // Chronic Infection
    history: ['Giardia (campers, foul diarrhea)', 'tropical sprue'],
    ix: ['Whipple (PAS+ macrophages)']
  },
  '69e901c01cd805199ebd9fe2': { // IBS
    history: ['Chronic abd pain + altered bowel habits', 'Rome IV', 'relieved with defecation', 'young F'],
    ix: ['normal workup']
  },

  // --- Chronic Diarrhea ---
  '69e901c01cd805199ebd9f5f': { // Hyperthyroidism
    history: ['Palpitations', 'weight loss', 'heat intolerance', 'tremor'],
    ix: ['↓TSH ↑T4']
  },

  // --- Dyspepsia ---
  '69e901c01cd805199ebd9fcb': { // H. pylori
    history: ['epigastric pain', 'duodenal > gastric ulcer'],
    ix: ['urea breath test/stool antigen', 'MALT lymphoma association']
  },
  '69e901c01cd805199ebd9fc9': { // Functional Dyspepsia
    history: ['Chronic epigastric pain/fullness', 'Rome IV', 'young'],
    ix: ['normal endoscopy']
  },
  '69e901c01cd805199ebd9fcc': { // Drug (NSAID)
    decoys: ['Functional Dyspepsia', 'Gastroparesis', 'H. pylori', 'Biliary Colic', 'Gastric CA', 'Pancreatitis']
  },
  '69e901c01cd805199ebd9fc7': { // Gastroparesis
    decoys: ['Biliary Colic', 'H. pylori', 'Drug (NSAID)', 'Functional Dyspepsia', 'Gastric CA', 'Pancreatitis']
  },

  // --- Upper GI Bleed ---
  '69e901c01cd805199ebd9fce': { // Esophageal Varices
    history: ['Cirrhosis', 'hematemesis (massive)', 'portal HTN'],
    pe: ['stigmata of liver disease'],
    ix: ['endoscopy']
  },
  '69e901c01cd805199ebd9faf': { // Peptic Ulcer
    history: ['Epigastric pain', 'duodenal relieved by food', 'gastric worse with food', 'H. pylori/NSAIDs', 'melena'],
    pe: ['epigastric tenderness'],
    ix: ['endoscopy with biopsy']
  },
  '69e901c01cd805199ebd9fca': { // Gastric CA
    history: ['weight loss', 'early satiety', 'elderly'],
    pe: ['Virchow node', 'Sister Mary Joseph nodule', 'Krukenberg tumor'],
    ix: ['signet ring on biopsy']
  },

  // --- Acute Abdomen ---
  '69e901c01cd805199ebd9faa': { // Perforation
    history: ['Severe sudden abd pain', 'PUD/diverticulitis'],
    pe: ['rigid abdomen', 'rebound tenderness', 'peritonitis'],
    ix: ['free air under diaphragm on CXR']
  },
  '69e901c01cd805199ebd9fa7': { // Appendicitis
    history: ['RLQ pain', 'anorexia', 'migratory periumbilical → RLQ'],
    pe: ['McBurney point tenderness', 'Rovsing sign'],
    ix: ['leukocytosis', 'CT appendiceal dilation']
  },
  '69e901c01cd805199ebd9fad': { // Mesenteric Ischemia
    history: ['Pain out of proportion to exam', 'elderly AF', 'post-prandial pain (chronic)'],
    pe: ['benign abdomen (early)'],
    ix: ['lactic acidosis', 'thumbprinting on CT']
  },
  '69e901c01cd805199ebd9fac': { // Ureterolithiasis
    history: ['Colicky flank pain radiates to groin', 'writhing'],
    pe: ['CVA tenderness'],
    ix: ['hematuria', 'CT w/o contrast', 'calcium oxalate']
  },
  '69e901c01cd805199ebd9fb0': { // Diverticulitis
    history: ['elderly', 'left-sided appendicitis', 'low-fiber diet'],
    pe: ['LLQ pain + fever'],
    ix: ['leukocytosis', 'CT colon wall thickening/fat stranding']
  },
  '69e901c01cd805199ebd9fa8': { // Cholecystitis
    history: ['post-fatty meal', '5 Fs (Female, Forty, Fat, Fertile, Fair)'],
    pe: ['RUQ tenderness', 'Murphy sign'],
    ix: ['US gallstones + wall thickening']
  },
  '69e901c01cd805199ebd9fcd': { // Biliary Colic
    history: ['RUQ postprandial pain <6hr', 'pain self-resolves'],
    pe: ['RUQ tenderness'],
    ix: ['US gallstones']
  },

  // --- Back Pain ---
  '69e901c01cd805199ebda091': { // Mechanical
    history: ['Low back pain after lifting', 'worse with activity', 'no red flags', 'young/middle-aged'],
    pe: ['paravertebral muscle spasm'],
    ix: ['imaging usually not needed']
  },
  '69e901c01cd805199ebda093': { // Compression Fracture
    history: ['Acute back pain', 'elderly F', 'osteoporosis', 'minor trauma', 'steroid use'],
    pe: ['kyphosis', 'point tenderness over spine'],
    ix: ['wedge deformity on X-ray']
  },
  '69e901c01cd805199ebda094': { // Cauda Equina
    history: ['back pain', 'bilateral leg weakness'],
    pe: ['Saddle anesthesia', 'urinary retention', '↓anal tone'],
    ix: ['emergent MRI']
  },
  '69e901c01cd805199ebda062': { // Metastasis (back pain)
    history: ['Back pain worse at night + unrelenting', 'known primary malignancy', 'weight loss'],
    pe: ['point tenderness'],
    ix: ['lytic/blastic lesions on imaging']
  },

  // --- Oliguria ---
  '69e901c01cd805199ebda00c': { // Sepsis
    history: ['SIRS criteria', 'qSOFA', 'source of infection'],
    pe: ['Fever', 'hypotension', 'tachycardia'],
    ix: ['↑lactate', '↑Cr', 'blood cultures'],
    decoys: ['AKI', 'Rhabdomyolysis', 'Heart Failure', 'Contrast Nephropathy', 'Obstructive Uropathy', 'Prerenal']
  },
  '69e901c01cd805199ebda00b': { // AKI
    decoys: ['Rhabdomyolysis', 'Sepsis', 'Heart Failure', 'Contrast Nephropathy', 'Obstructive Uropathy', 'Prerenal']
  },
  '69e901c01cd805199ebda00d': { // Rhabdomyolysis
    decoys: ['AKI', 'Sepsis', 'Heart Failure', 'Contrast Nephropathy', 'Obstructive Uropathy', 'Prerenal']
  },

  // --- Hematuria ---
  '69e901c01cd805199ebda002': { // Bladder CA
    decoys: ['Renal CA', 'Prostate', 'IgA Nephropathy', 'Exercise-induced', 'UTI', 'Stone']
  },
  '69e901c01cd805199ebda003': { // Renal CA
    history: ['elderly', 'smoker'],
    pe: ['flank mass'],
    ix: ['Flank pain + hematuria', 'paraneoplastic (EPO, PTHrP)'],
    decoys: ['Bladder CA', 'Prostate', 'Exercise-induced', 'IgA Nephropathy', 'UTI', 'Stone']
  },
  '69e901c01cd805199ebda005': { // IgA Nephropathy
    decoys: ['Bladder CA', 'Prostate', 'Exercise-induced', 'Renal CA', 'UTI', 'Stone']
  },
  '69e901c01cd805199ebda007': { // Prostate
    decoys: ['IgA Nephropathy', 'Bladder CA', 'Renal CA', 'Exercise-induced', 'UTI', 'Stone']
  },

  // --- Polyuria ---
  '69e901c01cd805199ebda010': { // DI
    decoys: ['Hypercalcemia', 'Psychogenic Polydipsia', 'Drug (Diuretic/Lithium)', 'DM', 'CKD', 'Hyperaldosteronism']
  },
  '69e901c01cd805199ebda011': { // Psychogenic Polydipsia
    decoys: ['Diabetes Insipidus', 'Drug (Diuretic/Lithium)', 'Hypercalcemia', 'DM', 'CKD', 'Hyperaldosteronism']
  },
  '69e901c01cd805199ebda013': { // Drug (Diuretic/Lithium)
    decoys: ['Hypercalcemia', 'Diabetes Insipidus', 'Psychogenic Polydipsia', 'DM', 'CKD', 'Hyperaldosteronism']
  },

  // --- Edema ---
  '69e901c01cd805199ebd9f76': { // DVT
    decoys: ['Cirrhosis', 'Lymphedema', 'Drug (CCB/NSAID)', 'Pregnancy', 'CHF', 'Cellulitis']
  },
  '69e901c01cd805199ebd9ffd': { // Lymphedema
    decoys: ['Cirrhosis', 'CHF', 'Drug (CCB/NSAID)', 'DVT', 'Pregnancy', 'Nephrotic Syndrome']
  },
  '69e901c01cd805199ebd9fc3': { // Pregnancy
    decoys: ['Lymphedema', 'Drug (CCB/NSAID)', 'Cirrhosis', 'DVT', 'CHF', 'Preeclampsia']
  },

  // --- Pleural/Pericardial Effusion ---
  '69e901c01cd805199ebd9fa6': { // Chylothorax
    decoys: ['CHF', 'Pneumonia (Parapneumonic)', 'Malignancy', 'PE', 'Cirrhosis', 'TB']
  },
  '69e901c01cd805199ebd9f52': { // PE
    decoys: ['CHF', 'Pneumonia (Parapneumonic)', 'Malignancy', 'Chylothorax', 'Cirrhosis', 'TB']
  },
  '69e901c01cd805199ebd9fa2': { // Pneumonia (Parapneumonic)
    decoys: ['CHF', 'Malignancy', 'PE', 'Chylothorax', 'Cirrhosis', 'TB']
  },
  '69e901c01cd805199ebd9fa1': { // CHF (pleural effusion)
    history: ['Transudate effusion', 'bilateral'],
    pe: ['JVD', 'peripheral edema'],
    ix: ['↑BNP', 'Kerley B lines', 'cardiomegaly on CXR']
  },
  '69e901c01cd805199ebd9f7f': { // Pericarditis (viral)
    decoys: ['Uremia', 'Post-MI (Dressler)', 'Malignancy', 'Hypothyroid', 'TB Pericarditis', 'Autoimmune (SLE)']
  },
  '69e901c01cd805199ebd9f86': { // Post-MI (Dressler)
    decoys: ['Pericarditis (viral)', 'Uremia', 'Malignancy', 'Hypothyroid', 'TB Pericarditis', 'Autoimmune (SLE)']
  },
  '69e901c01cd805199ebd9f82': { // Uremia (pericardial)
    history: ['CKD'],
    pe: ['pericardial friction rub', 'asterixis', 'uremic frost'],
    ix: ['BUN >60'],
    decoys: ['Pericarditis (viral)', 'Post-MI (Dressler)', 'Malignancy', 'Hypothyroid', 'TB Pericarditis', 'Autoimmune (SLE)']
  },

  // --- Claudication ---
  '69e901c01cd805199ebd9f57': { // Musculoskeletal
    pe: ['Reproducible leg pain on palpation'],
    decoys: ['PAD/Atherosclerosis', 'Buerger Disease', 'Spinal Stenosis', 'DVT', 'Compartment Syndrome', 'Venous Insufficiency']
  },
  '69e901c01cd805199ebd9f77': { // Buerger
    decoys: ['PAD/Atherosclerosis', 'Musculoskeletal', 'Spinal Stenosis', 'DVT', 'Compartment Syndrome', 'Venous Insufficiency']
  },
  '69e901c01cd805199ebd9f74': { // PAD/Atherosclerosis
    decoys: ['Buerger Disease', 'Musculoskeletal', 'Spinal Stenosis', 'DVT', 'Compartment Syndrome', 'Venous Insufficiency']
  },

  // --- Cyanosis ---
  '69e901c01cd805199ebd9f95': { // Central: Lung Dz
    decoys: ['Peripheral: Cold', 'Peripheral: Shock', 'Methemoglobinemia', 'R-to-L Shunt', 'Polycythemia', 'CO Poisoning']
  },
  '69e901c01cd805199ebd9f98': { // Peripheral: Shock
    history: ['hypovolemia/cardiogenic'],
    pe: ['Cold clammy extremities', 'hypotension', 'normal central color'],
    ix: ['↓cardiac output'],
    decoys: ['Central: Lung Dz', 'Peripheral: Cold', 'Methemoglobinemia', 'R-to-L Shunt', 'PAD', 'Adrenal Crisis']
  },
  '69e901c01cd805199ebd9f99': { // Peripheral: Cold
    decoys: ['Central: Lung Dz', 'Peripheral: Shock', 'Raynaud', 'Methemoglobinemia', 'R-to-L Shunt', 'Acrocyanosis']
  },

  // --- Weight Loss ---
  '69e901c01cd805199ebda0f3': { // Hyperthyroid
    history: ['Weight loss + ↑appetite', 'heat intolerance', 'tremor', 'palpitations'],
    pe: ['exophthalmos (Graves)', 'lid lag', 'fine tremor'],
    ix: ['↓TSH']
  },
  '69e901c01cd805199ebda0f4': { // Depression
    history: ['Weight loss/gain', 'SIGECAPS', 'major depression', 'PHQ-9'],
    pe: ['flat affect'],
    ix: ['clinical diagnosis']
  },
  '69e901c01cd805199ebda0f5': { // Anorexia Nervosa
    history: ['BMI <18.5', 'body image distortion', 'amenorrhea', 'young F', 'restrictive'],
    pe: ['lanugo', 'cachexia'],
    ix: ['↓K', '↓albumin']
  },
  '69e901c01cd805199ebda0f7': { // COPD
    history: ['Chronic productive cough', 'smoker', 'barrel chest'],
    pe: ['barrel chest', 'prolonged expiration'],
    ix: ['obstructive PFT']
  },
  '69e901c01cd805199ebda0f8': { // Addison
    history: ['Weight loss', 'fatigue', 'autoimmune/TB'],
    pe: ['hyperpigmentation', 'hypotension'],
    ix: ['hyponatremia', '↑ACTH', '↓cortisol', 'hyperkalemia']
  },
  '69e901c01cd805199ebda0fa': { // PCOS
    history: ['Obesity', 'oligomenorrhea', 'insulin resistance', 'Rotterdam criteria'],
    pe: ['hirsutism', 'acne'],
    ix: ['PCO on US', '↑androgens']
  },
  '69e901c01cd805199ebda0fd': { // Genetic (Prader-Willi)
    history: ['hypotonia at birth', 'intellectual disability', 'insatiable hunger'],
    pe: ['Obesity + short stature + hypogonadism'],
    ix: ['chr 15q11-13 deletion']
  },
  '69e901c01cd805199ebda0ff': { // OSA
    history: ['Obese middle-aged M', 'snoring', 'witnessed apnea', 'daytime sleepiness'],
    pe: ['thick neck', 'Mallampati high'],
    ix: ['polysomnography AHI']
  },
  '69e901c01cd805199ebda101': { // Restless Leg
    history: ['Urge to move legs at rest', 'relieved with movement', 'worse at night', 'iron def/pregnancy'],
    pe: [],
    ix: ['↓ferritin']
  },

  // --- Skin ---
  '69e901c01cd805199ebda105': { // Eczema
    history: ['Pruritus + flexural distribution', 'atopic triad (asthma + allergic rhinitis + eczema)'],
    pe: ['erythematous scaly patches', 'lichenification (chronic)'],
    ix: ['↑IgE']
  },
  '69e901c01cd805199ebda106': { // Fungal
    history: ['tinea (corporis/pedis/capitis)'],
    pe: ['Annular scaly patch + central clearing'],
    ix: ['KOH hyphae']
  },
  '69e901c01cd805199ebda10a': { // Herpes Zoster
    history: ['reactivation VZV', 'elderly/immunocompromised', 'postherpetic neuralgia', 'dermatomal'],
    pe: ['grouped vesicles in dermatomal distribution'],
    ix: ['Tzanck smear', 'PCR VZV']
  },
  '69e901c01cd805199ebda10c': { // Contact Dermatitis
    history: ['Contact with allergen (nickel, poison ivy, soap)', 'pattern matches exposure'],
    pe: ['Localized rash at contact site', 'vesicles'],
    ix: ['patch testing']
  },

  // --- STI ---
  '69e901c01cd805199ebda10f': { // Chlamydia
    history: ['Mucoid discharge or asymptomatic', 'most common STI', 'PID/infertility risk'],
    pe: ['cervical motion tenderness (PID)'],
    ix: ['NAAT']
  },
  '69e901c01cd805199ebda111': { // Trichomonas
    history: ['Frothy yellow-green vaginal discharge'],
    pe: ['strawberry cervix'],
    ix: ['motile flagellated protozoa on wet mount'],
    decoys: ['Non-gonococcal Urethritis', 'UTI', 'Gonorrhea', 'Chlamydia', 'BV', 'Candida']
  },
  '69e901c01cd805199ebda110': { // Non-gonococcal Urethritis
    decoys: ['Gonorrhea', 'Trichomonas', 'UTI', 'Chlamydia', 'BV', 'Prostatitis']
  },

  // --- Genital Ulcer ---
  '69e901c01cd805199ebda116': { // Behcet
    history: ['pathergy+', 'HLA-B51', 'Silk Road endemic'],
    pe: ['Recurrent oral + genital ulcers', 'uveitis'],
    ix: ['pathergy test'],
    decoys: ['Granuloma Inguinale', 'Fixed Drug Eruption', 'LGV', 'HSV', 'Syphilis', 'Chancroid']
  },
  '69e901c01cd805199ebda115': { // LGV
    history: ['Chlamydia L1-3', 'tropical'],
    pe: ['Painless ulcer → painful LAD (bubo)'],
    ix: ['serology'],
    decoys: ['Granuloma Inguinale', 'Fixed Drug Eruption', 'Behcet', 'HSV', 'Syphilis', 'Chancroid']
  },
  '69e901c01cd805199ebda117': { // Granuloma Inguinale
    decoys: ['Behcet', 'Fixed Drug Eruption', 'LGV', 'HSV', 'Syphilis', 'Chancroid']
  },
  '69e901c01cd805199ebda118': { // Fixed Drug Eruption
    decoys: ['LGV', 'Behcet', 'Granuloma Inguinale', 'HSV', 'Syphilis', 'Chancroid']
  },

  // --- Urinary ---
  '69e901c01cd805199ebd9fff': { // UTI
    history: ['Dysuria + frequency + urgency + suprapubic pain', 'E. coli', 'females'],
    pe: ['suprapubic tenderness'],
    ix: ['nitrites + LE on UA']
  },
  '69e901c01cd805199ebda018': { // Interstitial Cystitis
    history: ['young F', 'Chronic pelvic pain + urinary frequency/urgency'],
    pe: [],
    ix: ['negative cultures', 'Hunner ulcers on cystoscopy']
  },

  // --- Weakness ---
  '69e901c01cd805199ebda0aa': { // ALS
    history: ['bulbar symptoms', 'SOD1 gene'],
    pe: ['UMN + LMN signs', 'fasciculations', 'preserved sensation/cognition'],
    ix: ['EMG denervation'],
    decoys: ['Myopathy', 'Cord Compression', 'Transverse Myelitis', 'Hypokalemia', 'MG', 'GBS']
  },
  '69e901c01cd805199ebda0a9': { // Cord Compression
    history: ['cancer metastases'],
    pe: ['Back pain + bilateral leg weakness', 'sensory level', 'bowel/bladder dysfunction'],
    ix: ['emergent MRI']
  },
  '69e901c01cd805199ebda0ab': { // Myopathy
    history: ['statin/steroid use', 'inflammatory'],
    pe: ['Proximal symmetric weakness'],
    ix: ['↑CK'],
    decoys: ['Transverse Myelitis', 'ALS', 'Cord Compression', 'Hypokalemia', 'MG', 'GBS']
  },
  '69e901c01cd805199ebda0ae': { // Transverse Myelitis
    decoys: ['ALS', 'Hypokalemia', 'Myopathy', 'Cord Compression', 'GBS', 'MG']
  },
  '69e901c01cd805199ebda012': { // Hypokalemia
    history: ['Polyuria + muscle weakness + arrhythmia', 'diuretics'],
    pe: ['hyporeflexia', 'ileus'],
    ix: ['K<3.5', 'U-waves on ECG']
  },

  // --- DM/Endocrine ---
  '69e901c01cd805199ebd9fc6': { // DKA
    history: ['Type 1 DM', 'polyuria + polydipsia + N/V + abd pain'],
    pe: ['Kussmaul breathing', 'fruity breath', 'dehydration'],
    ix: ['AG acidosis', 'ketones', 'glucose >250']
  },
  '69e901c01cd805199ebda050': { // HHS
    history: ['T2DM elderly', 'dehydration'],
    pe: ['Altered mental status'],
    ix: ['severe hyperglycemia >600', 'no ketones', '↑osmolality']
  },
  '69e901c01cd805199ebda04b': { // Type 1 DM
    history: ['Young + lean', 'HLA-DR3/4', 'DKA presentation'],
    pe: [],
    ix: ['autoantibodies (GAD, IA-2)', 'absolute insulin deficiency']
  },
  '69e901c01cd805199ebda04c': { // Type 2 DM
    history: ['Adult + obese', 'family history', 'insulin resistance'],
    pe: ['acanthosis nigricans'],
    ix: ['↑fasting glucose', '↑HbA1c']
  },
  '69e901c01cd805199ebda00f': { // DM (polyuria)
    history: ['Polyuria + polydipsia + polyphagia + weight loss'],
    pe: [],
    ix: ['↑fasting glucose', '↑HbA1c', 'glycosuria']
  },
  '69e901c01cd805199ebda04e': { // MODY
    history: ['Young', 'autosomal dominant', 'non-insulin dependent', 'HNF1A/glucokinase'],
    pe: [],
    ix: ['no autoantibodies', 'genetic testing']
  },
  '69e901c01cd805199ebda03b': { // Thyroid Storm
    history: ['severe hyperthyroidism', 'precipitant (surgery/infection/iodine)'],
    pe: ['high fever', 'tachycardia', 'agitation/delirium'],
    ix: ['↓TSH', '↑T3/T4']
  },

  // --- Calcium ---
  '69e901c01cd805199ebd9fea': { // Hypercalcemia
    history: ['Stones, bones, groans, psychiatric overtones', 'constipation + polyuria', 'malignancy/PHPT'],
    pe: [],
    ix: ['↑Ca', '↑PTH (primary) or ↓PTH (malignancy)'],
    decoys: ['Drug (Diuretic/Lithium)', 'Diabetes Insipidus', 'Psychogenic Polydipsia', 'DM', 'CKD', 'Hyperaldosteronism']
  },
  '69e901c01cd805199ebda046': { // Hypercalcemia: Vit D
    ix: ['↑Ca', '↑1,25-OH Vit D']
  },
  '69e901c01cd805199ebda048': { // Hypocalcemia: CKD
    history: ['renal osteodystrophy'],
    ix: ['↓Ca + ↑phos + ↑PTH', '↓1,25-OH Vit D']
  },

  // --- Thrombocytopenia ---
  '69e901c01cd805199ebda07c': { // ITP
    history: ['children post-viral', 'adult chronic'],
    pe: ['petechiae/bruising'],
    ix: ['Isolated ↓platelets', 'normal other counts'],
    decoys: ['Drug-induced', 'Aplastic', 'DIC', 'TTP/HUS', 'HIT', 'Splenic sequestration']
  },
  '69e901c01cd805199ebda07e': { // TTP/HUS
    history: ['pentad: TTP', 'HUS: E. coli O157 / Shiga toxin'],
    pe: ['fever', 'neuro symptoms (TTP)'],
    ix: ['MAHA (schistocytes)', 'thrombocytopenia', 'renal failure'],
    decoys: ['Aplastic', 'DIC', 'Drug-induced', 'HIT', 'ITP', 'SLE']
  },
  '69e901c01cd805199ebda07f': { // HIT
    history: ['Heparin 5-14 days', 'PF4-Ab', 'paradoxical thrombosis'],
    pe: [],
    ix: ['↓platelets >50% from baseline'],
    decoys: ['ITP', 'Drug-induced', 'Aplastic', 'TTP/HUS', 'DIC', 'Liver Disease']
  },
  '69e901c01cd805199ebda056': { // Aplastic
    history: ['drugs (chloramphenicol)', 'parvovirus B19', 'Fanconi'],
    pe: ['pallor', 'petechiae', 'infections'],
    ix: ['Pancytopenia + hypocellular marrow on biopsy'],
    decoys: ['TTP/HUS', 'DIC', 'HIT', 'ITP', 'Drug-induced', 'Splenic sequestration']
  },
  '69e901c01cd805199ebda05b': { // DIC
    decoys: ['Aplastic', 'HIT', 'TTP/HUS', 'ITP', 'Drug-induced', 'Liver Disease']
  },
  '69e901c01cd805199ebd9fb6': { // Drug-induced thrombocytopenia (was wrongly liver injury)
    history: ['Heparin', 'quinine', 'sulfonamides', 'vancomycin'],
    pe: ['Petechiae/purpura after new drug'],
    ix: ['Isolated ↓platelets temporally related to drug'],
    decoys: ['ITP', 'HIT', 'TTP/HUS', 'DIC', 'Aplastic', 'Liver Disease']
  },

  // --- Bleeding ---
  '69e901c01cd805199ebda05f': { // Drug (Warfarin/DOAC/Antiplatelet)
    history: ['Bleeding on anticoagulant'],
    decoys: ['Liver Disease', 'vWD', 'Vit K Deficiency', 'Thrombocytopenia', 'Hemophilia', 'DIC']
  },
  '69e901c01cd805199ebda05e': { // Hemophilia
    decoys: ['Drug (Warfarin/DOAC/Antiplatelet)', 'Liver Disease', 'Vit K Deficiency', 'Thrombocytopenia', 'vWD', 'DIC']
  },
  '69e901c01cd805199ebda05c': { // Liver Disease
    decoys: ['Hemophilia', 'Vit K Deficiency', 'vWD', 'Thrombocytopenia', 'Drug (Warfarin/DOAC/Antiplatelet)', 'DIC']
  },
  '69e901c01cd805199ebda059': { // Thrombocytopenia (bleeding)
    decoys: ['Hemophilia', 'Drug (Warfarin/DOAC/Antiplatelet)', 'Vit K Deficiency', 'vWD', 'Liver Disease', 'DIC']
  },
  '69e901c01cd805199ebda060': { // Vit K Deficiency
    decoys: ['Drug (Warfarin/DOAC/Antiplatelet)', 'Thrombocytopenia', 'vWD', 'Hemophilia', 'Liver Disease', 'DIC']
  },
  '69e901c01cd805199ebda05d': { // vWD
    decoys: ['Liver Disease', 'Thrombocytopenia', 'Vit K Deficiency', 'Drug (Warfarin/DOAC/Antiplatelet)', 'Hemophilia', 'DIC']
  },

  // --- Lower GI Bleeding ---
  '69e901c01cd805199ebd9fd6': { // Diverticular Bleed
    decoys: ['Angiodysplasia', 'Colorectal CA', 'Hemorrhoids', 'IBD', 'Ischemic Colitis', 'Meckel Diverticulum']
  },
  '69e901c01cd805199ebd9fd7': { // Angiodysplasia
    decoys: ['Diverticular Bleed', 'Colorectal CA', 'Hemorrhoids', 'IBD', 'Ischemic Colitis', 'Meckel Diverticulum']
  },

  // --- Polycythemia ---
  '69e901c01cd805199ebda06d': { // Polycythemia Vera
    history: ['JAK2 V617F', 'pruritus after shower', 'erythromelalgia'],
    pe: ['splenomegaly', 'plethoric facies'],
    ix: ['↑Hb', 'low EPO'],
    decoys: ['EPO-producing Tumor', 'High Altitude', 'Dehydration (Relative)', 'Chronic Lung Disease', 'OSA', 'Smoking']
  },
  '69e901c01cd805199ebda06f': { // EPO-producing Tumor
    history: ['RCC', 'hepatoma', 'hemangioblastoma'],
    ix: ['↑EPO', '↑Hb'],
    decoys: ['Dehydration (Relative)', 'Polycythemia Vera', 'High Altitude', 'Chronic Lung Disease', 'OSA', 'Smoking']
  },
  '69e901c01cd805199ebda070': { // Dehydration (Relative)
    decoys: ['EPO-producing Tumor', 'Polycythemia Vera', 'High Altitude', 'Chronic Lung Disease', 'Smoking', 'OSA']
  },
  '69e901c01cd805199ebda071': { // High Altitude
    decoys: ['Dehydration (Relative)', 'Polycythemia Vera', 'EPO-producing Tumor', 'Chronic Lung Disease', 'OSA', 'Smoking']
  },

  // --- Splenomegaly ---
  '69e901c01cd805199ebda063': { // Sarcoidosis
    history: ['non-caseating granulomas'],
    pe: ['erythema nodosum', 'uveitis'],
    ix: ['bilateral hilar adenopathy on CXR', '↑ACE'],
    decoys: ['Lymphoma/Leukemia', 'Portal Hypertension', 'Hemolytic Anemia', 'Infection (Malaria/EBV)', 'Storage Disease', 'Amyloidosis']
  },
  '69e901c01cd805199ebda067': { // Portal Hypertension
    decoys: ['Hemolytic Anemia', 'Sarcoidosis', 'Lymphoma/Leukemia', 'Storage Disease', 'Infection (Malaria/EBV)', 'Amyloidosis']
  },
  '69e901c01cd805199ebda068': { // Lymphoma/Leukemia
    decoys: ['Storage Disease', 'Portal Hypertension', 'Hemolytic Anemia', 'Sarcoidosis', 'Infection (Malaria/EBV)', 'Amyloidosis']
  },
  '69e901c01cd805199ebda069': { // Hemolytic Anemia (splenomegaly)
    decoys: ['Infection (Malaria/EBV)', 'Sarcoidosis', 'Portal Hypertension', 'Lymphoma/Leukemia', 'Storage Disease', 'Amyloidosis']
  },
  '69e901c01cd805199ebda06a': { // Infection (Malaria/EBV)
    history: ['travel (malaria)', 'mono symptoms (EBV)'],
    pe: [],
    ix: ['blood smear (malaria ring forms)', 'monospot (EBV)'],
    decoys: ['Storage Disease', 'Hemolytic Anemia', 'Portal Hypertension', 'Lymphoma/Leukemia', 'Sarcoidosis', 'Amyloidosis']
  },

  // --- Leukocytosis/Leukopenia ---
  '69e901c01cd805199ebda072': { // Infection (leukocytosis)
    history: ['bacterial infection'],
    pe: ['fever'],
    ix: ['Neutrophilic leukocytosis + left shift', 'bands + toxic granulation']
  },
  '69e901c01cd805199ebda076': { // Drug (leukocytosis)
    history: ['Drug-induced leukocytosis (steroid, lithium, G-CSF)'],
    ix: []
  },
  '69e901c01cd805199ebda077': { // Viral Infection (leukopenia)
    decoys: ['Sepsis (late)', 'Aplastic Anemia', 'Drug-induced Neutropenia', 'SLE', 'Lymphoma/Leukemia', 'HIV/AIDS']
  },
  '69e901c01cd805199ebda079': { // Sepsis (late) leukopenia
    decoys: ['Viral Infection', 'Aplastic Anemia', 'Drug-induced Neutropenia', 'HIV/AIDS', 'Lymphoma/Leukemia', 'SLE']
  },
  '69e901c01cd805199ebda06b': { // Myeloproliferative
    history: ['JAK2 V617F (PV, ET, PMF)'],
    ix: ['tear drop cells (PMF)']
  },

  // --- Pancytopenia ---
  '69e901c01cd805199ebda078': { // Aplastic Anemia
    history: ['Pancytopenia', 'drugs', 'viral', 'idiopathic'],
    ix: ['hypocellular marrow on biopsy']
  },
  '69e901c01cd805199ebda081': { // B12/Folate Def
    history: ['Macrocytic anemia + B12 neuro symptoms', 'strict vegan/pernicious anemia'],
    pe: ['glossitis'],
    ix: ['pancytopenia + hypersegmented neutrophils']
  },
  '69e901c01cd805199ebda082': { // TB (miliary)
    ix: ['Fever + night sweats + weight loss + miliary pattern CXR']
  },

  // --- Anemia ---
  '69e901c01cd805199ebd9f60': { // Anemia (general)
    history: ['exertional dyspnea', 'palpitations + fatigue'],
    pe: ['pallor', 'conjunctival pallor'],
    ix: ['low Hb']
  },

  // --- SLE ---
  '69e901c01cd805199ebd9f84': { // SLE
    ix: ['ANA+ anti-dsDNA', 'Libman-Sacks']
  },

  // --- HIV ---
  '69e901c01cd805199ebda065': { // HIV
    history: ['Generalized adenopathy', 'opportunistic infections', 'weight loss'],
    pe: ['oral candidiasis', 'Kaposi sarcoma'],
    ix: ['CD4<200', 'ELISA/Western blot']
  },

  // --- Delirium ---
  '69e901c01cd805199ebda0b7': { // Alcohol Withdrawal
    history: ['chronic alcohol use', '48-96h after last drink'],
    pe: ['tremor', 'hallucinations', 'HTN + tachycardia', 'Delirium tremens'],
    ix: ['clinical diagnosis']
  },
  '69e901c01cd805199ebda0ba': { // Hypoxia (delirium)
    history: ['PNA/PE/CHF'],
    pe: ['RR ↑', 'delirium'],
    ix: ['hypoxia on pulse ox/ABG']
  },
  '69e901c01cd805199ebda0bb': { // Constipation (delirium)
    history: ['Elderly + delirium + fecal impaction'],
    pe: ['abdominal distension'],
    ix: ['AXR fecal loading']
  },
  '69e901c01cd805199ebda0b4': { // Infection/Sepsis (delirium)
    pe: ['Elderly + delirium + fever'],
    ix: ['UTI/PNA common source', 'leukocytosis']
  },
  '69e901c01cd805199ebda0bc': { // Post-op (delirium)
    history: ['Delirium post-surgery + elderly', 'anesthesia/polypharmacy'],
    pe: ['fluctuating attention'],
    ix: ['CAM score']
  },
  '69e901c01cd805199ebda0b8': { // Pain/Urinary Retention (delirium)
    history: ['Occult pain or full bladder causing delirium in elderly/post-op'],
    pe: ['distended bladder'],
    ix: ['bladder scan']
  },

  // --- Vertigo ---
  '69e901c01cd805199ebda0bd': { // BPPV
    history: ['positional', 'brief episodes <1min'],
    pe: ['Dix-Hallpike positive', 'rotatory nystagmus'],
    ix: []
  },
  '69e901c01cd805199ebda0be': { // Meniere
    history: ['Episodic vertigo + hearing loss + tinnitus + aural fullness', 'endolymphatic hydrops'],
    pe: ['sensorineural hearing loss'],
    ix: ['audiometry']
  },
  '69e901c01cd805199ebda0bf': { // Vestibular Neuritis
    history: ['post-viral'],
    pe: ['Acute severe vertigo lasting days', 'no hearing loss', 'horizontal nystagmus'],
    ix: []
  },
  '69e901c01cd805199ebda0c0': { // VBI
    history: ['Elderly', 'vascular risk factors', 'posterior circulation'],
    pe: ['vertigo + diplopia/dysarthria/ataxia'],
    ix: ['MRI/MRA']
  },

  // --- Ptosis ---
  '69e901c01cd805199ebda0e8': { // CN III Palsy
    decoys: ['Horner Syndrome', 'Senile/Aponeurotic', 'Myotonic Dystrophy', 'Congenital', 'MG', 'Lambert-Eaton']
  },
  '69e901c01cd805199ebd9fbe': { // MG
    decoys: ['Horner Syndrome', 'Senile/Aponeurotic', 'Myotonic Dystrophy', 'Congenital', 'CN III Palsy', 'Lambert-Eaton']
  },
  '69e901c01cd805199ebda0ec': { // Myotonic Dystrophy
    decoys: ['Senile/Aponeurotic', 'CN III Palsy', 'Horner Syndrome', 'MG', 'Congenital', 'Lambert-Eaton']
  },
  '69e901c01cd805199ebda0ea': { // Congenital
    decoys: ['Myotonic Dystrophy', 'CN III Palsy', 'Senile/Aponeurotic', 'MG', 'Horner Syndrome', 'Lambert-Eaton']
  },
  '69e901c01cd805199ebda0eb': { // Senile/Aponeurotic
    decoys: ['CN III Palsy', 'Myotonic Dystrophy', 'Congenital', 'Horner Syndrome', 'MG', 'Lambert-Eaton']
  },
  '69e901c01cd805199ebda0e9': { // Horner Syndrome
    history: ['Pancoast tumor/carotid dissection'],
    pe: ['Miosis + ptosis + anhidrosis'],
    ix: ['cocaine test (no dilation)']
  },

  // --- Diplopia ---
  '69e901c01cd805199ebda0e4': { // CN VI Palsy
    history: ['Horizontal diplopia', 'DM', 'worst at distance'],
    pe: ['abduction deficit'],
    ix: ['rule out ↑ICP']
  },
  '69e901c01cd805199ebda0e6': { // Orbital Mass
    history: ['lymphoma/metastasis/pseudotumor'],
    pe: ['Proptosis + diplopia'],
    ix: ['CT/MRI orbital mass']
  },
  '69e901c01cd805199ebda0ad': { // MS
    history: ['Young F', 'dissemination in space/time'],
    pe: ['optic neuritis', 'INO', 'cerebellar signs', 'bladder dysfunction'],
    ix: ['oligoclonal bands CSF', 'MRI white matter plaques']
  },

  // --- Azotemia ---
  '69e901c01cd805199ebd9ffb': { // CKD
    decoys: ['Contrast Nephropathy', 'Postrenal (Obstruction)', 'Prerenal', 'Intrinsic Renal (ATN/GN)', 'Diabetic Nephropathy', 'Lupus Nephritis']
  },
  '69e901c01cd805199ebda02e': { // Contrast Nephropathy
    history: ['DM/CKD risk', 'recent contrast exposure'],
    ix: ['AKI 24-72h post-contrast'],
    decoys: ['Intrinsic Renal (ATN/GN)', 'Prerenal', 'CKD', 'Postrenal (Obstruction)', 'Rhabdomyolysis', 'Drug nephrotoxicity']
  },
  '69e901c01cd805199ebda02d': { // Intrinsic Renal
    decoys: ['Contrast Nephropathy', 'Prerenal', 'CKD', 'Postrenal (Obstruction)', 'Rhabdomyolysis', 'HRS']
  },
  '69e901c01cd805199ebda00a': { // Postrenal (Obstruction)
    decoys: ['Contrast Nephropathy', 'Intrinsic Renal (ATN/GN)', 'CKD', 'Prerenal', 'Nephrolithiasis', 'BPH']
  },
  '69e901c01cd805199ebda02c': { // Prerenal (azotemia)
    decoys: ['CKD', 'Postrenal (Obstruction)', 'Intrinsic Renal (ATN/GN)', 'Contrast Nephropathy', 'HRS', 'Rhabdomyolysis']
  },

  // --- RPGN ---
  '69e901c01cd805199ebda029': { // ANCA Vasculitis
    history: ['RPGN + systemic vasculitis'],
    ix: ['GPA (c-ANCA, PR3)', 'MPA (p-ANCA, MPO)', 'EGPA (asthma + eosinophilia)'],
    decoys: ['Anti-GBM (Goodpasture)', 'Immune Complex (SLE/IgA/Post-strep)', 'Crescentic GN', 'Lupus Nephritis', 'IgA Nephropathy', 'Post-infectious GN']
  },
  '69e901c01cd805199ebda028': { // Anti-GBM (Goodpasture)
    history: ['Hematuria + hemoptysis', 'young male smoker'],
    pe: [],
    ix: ['linear IgG on biopsy', 'anti-GBM Ab'],
    decoys: ['ANCA Vasculitis', 'Immune Complex (SLE/IgA/Post-strep)', 'Crescentic GN', 'Lupus Nephritis', 'IgA Nephropathy', 'Post-infectious GN']
  },
  '69e901c01cd805199ebda02b': { // Crescentic GN
    decoys: ['Immune Complex (SLE/IgA/Post-strep)', 'Anti-GBM (Goodpasture)', 'ANCA Vasculitis', 'Lupus Nephritis', 'IgA Nephropathy', 'Membranous']
  },
  '69e901c01cd805199ebda02a': { // Immune Complex
    ix: ['Low C3/C4 (SLE, post-strep)', 'normal C (IgA)'],
    decoys: ['Anti-GBM (Goodpasture)', 'Crescentic GN', 'ANCA Vasculitis', 'Lupus Nephritis', 'Membranous', 'MPGN']
  },

  // --- Proteinuria ---
  '69e901c01cd805199ebda024': { // Exercise
    decoys: ['Nephrotic Syndrome', 'Orthostatic', 'HTN Nephrosclerosis', 'Diabetic Nephropathy', 'IgA Nephropathy', 'FSGS']
  },
  '69e901c01cd805199ebda020': { // HTN Nephrosclerosis
    history: ['AA', 'chronic HTN'],
    ix: ['Chronic HTN + proteinuria + ↓eGFR', 'onion-skin arterioles on biopsy'],
    decoys: ['Exercise', 'Orthostatic', 'Nephrotic Syndrome', 'Diabetic Nephropathy', 'IgA Nephropathy', 'FSGS']
  },
  '69e901c01cd805199ebd9ffa': { // Nephrotic Syndrome
    decoys: ['Exercise', 'HTN Nephrosclerosis', 'Orthostatic', 'Diabetic Nephropathy', 'Amyloidosis', 'Lupus Nephritis']
  },
  '69e901c01cd805199ebda023': { // Orthostatic proteinuria
    decoys: ['HTN Nephrosclerosis', 'Exercise', 'Nephrotic Syndrome', 'Diabetic Nephropathy', 'IgA Nephropathy', 'FSGS']
  },

  // --- Dengue ---
  '69e901c01cd805199ebda07d': { // Dengue
    history: ['Southeast Asia', 'hemorrhagic'],
    pe: ['Fever + myalgia + retro-orbital pain + rash'],
    ix: ['thrombocytopenia', 'NS1 antigen']
  },

  // --- Constipation (CC not delirium) ---
  '69e901c01cd805199ebd9fbb': { // Stricture — wrong CC
    cc: 'กลืนลำบาก', ccEn: 'Dysphagia',
    decoys: ['Achalasia', 'Esophageal CA', 'GERD', 'Schatzki Ring', 'Eosinophilic Esophagitis', 'Zenker Diverticulum']
  },

  // --- Reactive Arthritis ---
  '69e901c01cd805199ebda08d': { // Reactive Arthritis
    history: ['Can\'t see, can\'t pee, can\'t climb a tree (uveitis + urethritis + arthritis)', 'post-GC/Chlamydia/Shigella', 'HLA-B27']
  },

  // --- Cyanotic Heart Dz ---
  '69e901c01cd805199ebd9f9c': { // Cyanotic Heart Dz
    history: ['5 Ts: TOF, TGA, Truncus, TAPVR, Tricuspid atresia', 'neonate', 'cyanosis at birth']
  },

  // --- Miscellaneous fixes ---
  '69e901c01cd805199ebda019': { // Hematuria (generic card)
    history: [],
    ix: ['RBCs >3/HPF', 'glomerular (dysmorphic RBCs, casts) vs non-glomerular']
  },
  '69e901c01cd805199ebda044': { // Hypercalcemia: Hyperparathyroid
    history: ['stones, bones, groans, moans', 'adenoma', 'MEN1/2a']
  },
  '69e901c01cd805199ebd9fc4': { // Drug/Chemo (pancytopenia)
    history: ['chemo (alkylating agents, antimetabolites)', 'drug-induced marrow suppression'],
    pe: [],
    ix: ['Pancytopenia + dose-dependent + timing with drug']
  },
}

async function run() {
  await new Promise((resolve) => {
    conn.on('connected', resolve)
    conn.on('error', (e) => { console.error('DB error:', e.message); process.exit(1) })
  })
  console.log('Connected to DB')

  let updated = 0, errors = 0
  const ids = Object.keys(fixes)
  console.log(`Processing ${ids.length} cards...`)

  for (const id of ids) {
    const fix = fixes[id]
    const update = {}

    if (fix.history !== undefined) update.history = fix.history
    if (fix.pe !== undefined) update.pe = fix.pe
    if (fix.ix !== undefined) update.investigation = fix.ix
    if (fix.cc !== undefined) update.relatedCC = fix.cc
    if (fix.ccEn !== undefined) update.relatedCCEn = fix.ccEn
    if (fix.decoys !== undefined) update.decoys = fix.decoys

    try {
      const result = await ArenaCard.updateOne({ _id: id }, { $set: update })
      if (result.modifiedCount > 0) {
        updated++
      } else if (result.matchedCount === 0) {
        console.log(`  NOT FOUND: ${id}`)
        errors++
      }
    } catch (e) {
      console.log(`  ERROR ${id}: ${e.message}`)
      errors++
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}, Total: ${ids.length}`)

  // Verify: count cards that are now game-ready
  const ready = await ArenaCard.countDocuments({
    isActive: true,
    relatedCC: { $ne: '' },
    'decoys.2': { $exists: true },
    $and: [
      { $or: [{ auditStatus: 'approved' }, { isAudited: true, auditStatus: { $exists: false } }] },
      { $or: [{ 'history.0': { $exists: true } }, { 'pe.0': { $exists: true } }, { 'investigation.0': { $exists: true } }] }
    ]
  })
  const total = await ArenaCard.countDocuments({})
  console.log(`Game-ready: ${ready}/${total}`)

  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
