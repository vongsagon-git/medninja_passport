/**
 * NINJA DDx — Cheat Sheet: Pattern Recognition
 * "เห็นอะไร → นึกถึงอะไร" — จำแค่นี้ก็ตอบข้อสอบได้
 *
 * เรียงตามความสำคัญ (ออกสอบบ่อยสุด → น้อย)
 */

// ═══ MUST KNOW: จำให้ได้ ออกสอบทุกปี ═══
const mustKnow = [
  // GI
  { pattern: 'ปวดรอบสะดือ → ย้ายไปท้องขวาล่าง', answer: 'Appendicitis (ไส้ติ่ง)', mnemonic: 'สะดือ → ขวาล่าง = ไส้ติ่ง', category: 'GI' },
  { pattern: 'ดื่มเหล้า + ปวดท้องร้าวหลัง', answer: 'Pancreatitis (ตับอ่อน)', mnemonic: 'เหล้า → หลัง = ตับอ่อน', category: 'GI' },
  { pattern: 'Murphy\'s sign (+) = กดท้องขวาบน หายใจเข้า → เจ็บหยุดหายใจ', answer: 'Cholecystitis (ถุงน้ำดี)', mnemonic: 'Murphy = ถุงน้ำดี (ออกทุกปี!)', category: 'GI' },
  { pattern: 'อาเจียน + ท้องอืด + ไม่ผายลม + เคยผ่าตัดท้อง', answer: 'Bowel Obstruction (ลำไส้อุดตัน)', mnemonic: 'อุด = อืด + อาเจียน + ไม่ผาย', category: 'GI' },
  { pattern: 'ปวดท้องทันที + ท้องแข็งเป็นไม้กระดาน', answer: 'Perforation (ทะลุ)', mnemonic: 'ทันที + แข็ง = ทะลุ', category: 'GI' },
  { pattern: 'ผู้หญิง + ปวดท้อง + ประจำเดือนขาด', answer: 'Ectopic Pregnancy (ท้องนอกมดลูก)', mnemonic: 'ผู้หญิงปวดท้อง → pregnancy test ก่อนเสมอ!', category: 'GI' },
  { pattern: 'ตับแข็ง + อาเจียนเลือด', answer: 'Esophageal Varices', mnemonic: 'ตับแข็ง + เลือด = Varices', category: 'GI' },
  { pattern: 'ตัวเหลืองไม่เจ็บ + น้ำหนักลด + ถุงน้ำดีโต', answer: 'Pancreatic Cancer (Courvoisier\'s sign)', mnemonic: 'เหลืองไม่เจ็บ = มะเร็ง', category: 'GI' },
  { pattern: 'ไข้ + ตัวเหลือง + ปวดท้องขวาบน (Charcot triad)', answer: 'Cholangitis (ท่อน้ำดีอักเสบ)', mnemonic: 'Charcot = 3 อย่าง → ERCP ด่วน!', category: 'GI' },

  // CARDIO
  { pattern: 'แน่นหน้าอกเหมือนช้างเหยียบ + ร้าวแขนซ้าย/คาง + เหงื่อ', answer: 'ACS / MI (หัวใจขาดเลือด)', mnemonic: 'ช้างเหยียบ + แขนซ้าย = หัวใจ → ECG ทันที!', category: 'CARDIO' },
  { pattern: 'เจ็บหน้าอกทันที + หอบ + ขาบวมข้างเดียว', answer: 'Pulmonary Embolism (PE)', mnemonic: 'หน้าอก + ขาบวม = PE', category: 'CARDIO' },
  { pattern: 'ปวดหน้าอก/หลังเหมือนฉีก + BP แขน 2 ข้างต่างกัน', answer: 'Aortic Dissection', mnemonic: 'ฉีก + BP ไม่เท่า = Dissection', category: 'CARDIO' },
  { pattern: 'เจ็บหน้าอก + เสียงหายใจเบาข้างเดียว', answer: 'Pneumothorax (ลมรั่ว)', mnemonic: 'เสียงเบา = ลมรั่ว', category: 'CARDIO' },
  { pattern: 'Tension pneumothorax: คอโป่ง + หลอดลมเบี้ยว + BP ต่ำ', answer: '→ Needle decompression ทันที! ไม่ต้องรอ X-ray', mnemonic: '3 อย่าง = แทงเข็มก่อน!', category: 'CARDIO' },
  { pattern: 'เจ็บหน้าอก + นั่งก้มตัวดีขึ้น + ECG ST elevation ทุก lead', answer: 'Pericarditis (ไม่ใช่ MI!)', mnemonic: 'ก้มดีขึ้น + ST ทุก lead = เยื่อหุ้มหัวใจ', category: 'CARDIO' },
  { pattern: 'ECG: irregularly irregular + no P wave', answer: 'Atrial Fibrillation (AF)', mnemonic: 'ไม่สม่ำเสมอ + ไม่มี P = AF', category: 'CARDIO' },
  { pattern: 'Wide QRS tachycardia', answer: '→ ถือว่าเป็น VT จนกว่าจะพิสูจน์ไม่ใช่!', mnemonic: 'Wide = VT (อันตราย!)', category: 'CARDIO' },
  { pattern: 'เหนื่อย + นอนราบไม่ได้ + ขาบวม + BNP สูง', answer: 'Heart Failure', mnemonic: 'นอนไม่ได้ + บวม = หัวใจวาย', category: 'CARDIO' },
  { pattern: 'Beck triad: BP ต่ำ + คอโป่ง + เสียงหัวใจเบา', answer: 'Cardiac Tamponade', mnemonic: 'Beck = บีบหัวใจ → เจาะทันที!', category: 'CARDIO' },

  // NEURO
  { pattern: 'ปวดหัวรุนแรงที่สุดในชีวิต (thunderclap) ทันที', answer: 'SAH (เลือดออกใต้เยื่อหุ้มสมอง)', mnemonic: 'ปวดหัวที่สุดเคย = SAH → CT ด่วน!', category: 'NEURO' },
  { pattern: 'ไข้ + ปวดหัว + คอแข็ง', answer: 'Meningitis', mnemonic: '3 อย่าง = เยื่อหุ้มสมอง → LP!', category: 'NEURO' },
  { pattern: 'อ่อนแรงครึ่งซีก + พูดไม่ชัด + ปากเบี้ยว ทันที', answer: 'Stroke', mnemonic: 'FAST: Face Arm Speech Time → CT ด่วน!', category: 'NEURO' },
  { pattern: 'อ่อนแรง ascending (ขาก่อน → แขน) + หลังเป็นหวัด + DTR หาย', answer: 'Guillain-Barré Syndrome (GBS)', mnemonic: 'ขึ้นจากล่าง + reflex หาย = GBS', category: 'NEURO' },
  { pattern: 'หนังตาตก + เห็นภาพซ้อน + อ่อนแรงเมื่อใช้งาน (fatigability)', answer: 'Myasthenia Gravis', mnemonic: 'ตาตก + ใช้งานแล้วอ่อน = MG', category: 'NEURO' },
  { pattern: 'ชัก → เช็ค DTX (น้ำตาล) ก่อนเสมอ!', answer: 'Hypoglycemia', mnemonic: 'ชัก → จิ้มนิ้ว (DTX) ก่อน!', category: 'NEURO' },
  { pattern: 'Status epilepticus (ชัก > 5 นาที)', answer: '→ Benzodiazepine (Diazepam/Lorazepam) ทันที!', mnemonic: 'ชักไม่หยุด = ฉีด Benzo!', category: 'NEURO' },
  { pattern: 'ปวดหลัง + อ่อนแรง 2 ขา + ปัสสาวะไม่ออก', answer: 'Spinal Cord Compression → MRI ด่วน!', mnemonic: 'หลัง + ขา + ฉี่ = ไขสันหลังถูกกด', category: 'NEURO' },

  // PULMO
  { pattern: 'ไอ > 2 สัปดาห์ + ไข้ + น้ำหนักลด + เหงื่อกลางคืน', answer: 'Tuberculosis (TB/วัณโรค)', mnemonic: 'ไอนาน + ไข้ + ลด + เหงื่อ = TB', category: 'PULMO' },
  { pattern: 'Silent chest ในคนหืด', answer: '= อันตรายมาก! อุดตันจนลมไม่ผ่าน', mnemonic: 'เงียบ ≠ ดี → แย่มาก!', category: 'PULMO' },
  { pattern: 'COPD + ให้ O2', answer: '→ เป้าหมาย 88-92% ไม่ใช่ 100%!', mnemonic: 'COPD + O2 มาก = CO2 narcosis', category: 'PULMO' },
  { pattern: 'CURB-65 = Confusion + Urea + RR + BP + Age ≥65', answer: 'ประเมินความรุนแรง Pneumonia', mnemonic: 'CURB-65 แต่ละข้อ = 1 คะแนน', category: 'PULMO' },

  // ID
  { pattern: 'ไข้สูง + ปวดเมื่อย + WBC ต่ำ + Plt ต่ำ + ฤดูฝน', answer: 'Dengue (ไข้เลือดออก)', mnemonic: 'ฝน + WBC↓ + Plt↓ = เดงกี่', category: 'ID' },
  { pattern: 'ไข้ + ปวดน่อง + ตาแดง + สัมผัสน้ำท่วม', answer: 'Leptospirosis (ฉี่หนู)', mnemonic: 'น้ำท่วม + น่อง + ตาแดง = ฉี่หนู', category: 'ID' },
  { pattern: 'ไข้ + eschar (แผลตุ่มดำ) + เดินป่า', answer: 'Scrub Typhus → ให้ Doxycycline', mnemonic: 'eschar + ป่า = Scrub → Doxy', category: 'ID' },

  // RENAL
  { pattern: 'เด็ก + เจ็บคอ 2 สัปดาห์ก่อน + ปัสสาวะสีโค้ก + บวม', answer: 'Post-streptococcal GN', mnemonic: 'เจ็บคอ → 2 wk → ฉี่โค้ก = Post-strep GN', category: 'RENAL' },

  // ENDO
  { pattern: '3P: Polydipsia + Polyuria + Polyphagia + น้ำหนักลด', answer: 'Diabetes Mellitus (DM)', mnemonic: '3P = เบาหวาน', category: 'ENDO' },
  { pattern: 'DKA: คลื่นไส้ + ปวดท้อง + หายใจเร็วลึก + ลมหายใจกลิ่นผลไม้', answer: 'Diabetic Ketoacidosis → ให้ insulin + IV fluid', mnemonic: 'ผลไม้ + หายใจลึก = DKA', category: 'ENDO' },
  { pattern: 'น้ำหนักลด + ใจสั่น + มือสั่น + เหงื่อ + ตาโปน + คอโต', answer: 'Hyperthyroidism (Graves)', mnemonic: 'ลด + สั่น + เหงื่อ + โปน = ไทรอยด์', category: 'ENDO' },
  { pattern: 'อ่อนเพลีย + ผิวคล้ำ + BP ต่ำ + Na ต่ำ + K สูง', answer: 'Addison Disease (ต่อมหมวกไตวาย)', mnemonic: 'คล้ำ + BP↓ + Na↓K↑ = Addison', category: 'ENDO' },

  // HEMATO
  { pattern: 'MCV ต่ำ + Ferritin ต่ำ', answer: 'Iron Deficiency Anemia', mnemonic: 'เล็ก + เหล็กน้อย = ขาดเหล็ก', category: 'HEMATO' },
  { pattern: 'MCV ต่ำ + Ferritin ปกติ/สูง + RBC count สูง', answer: 'Thalassemia (ไม่ใช่ IDA!)', mnemonic: 'เล็กแต่เยอะ + เหล็กไม่ต่ำ = ธาลัส', category: 'HEMATO' },
  { pattern: 'MCV สูง + hypersegmented neutrophils', answer: 'B12/Folate Deficiency', mnemonic: 'ใหญ่ + neutrophil เยอะแฉก = B12', category: 'HEMATO' },
  { pattern: 'ต่อมน้ำเหลืองโตไม่เจ็บ + ไข้ + น้ำหนักลด + เหงื่อกลางคืน (B symptoms)', answer: 'Lymphoma', mnemonic: 'โตไม่เจ็บ + B symptoms = Lymphoma → biopsy!', category: 'HEMATO' },
  { pattern: 'Left supraclavicular node (Virchow)', answer: '→ GI malignancy (โดยเฉพาะ gastric CA)', mnemonic: 'Virchow (ซ้ายเหนือไหปลาร้า) = มะเร็งท้อง', category: 'HEMATO' },

  // MSK
  { pattern: 'ปวดหัวแม่เท้ารุนแรงทันที + บวมแดง (podagra)', answer: 'Gout', mnemonic: 'หัวแม่เท้าแดง = เกาต์', category: 'MSK' },
  { pattern: 'ข้อบวมแดงร้อน + ไข้', answer: '→ Joint aspiration ทุกครั้ง! (rule out Septic arthritis)', mnemonic: 'ข้อร้อน + ไข้ = ดูดน้ำข้อ!', category: 'MSK' },
  { pattern: 'ปวดข้อสมมาตร + ข้อเล็ก (มือ) + ข้อฝืดเช้า > 1 ชม.', answer: 'Rheumatoid Arthritis (RA)', mnemonic: 'สมมาตร + เช้าแข็ง = RA', category: 'MSK' },
  { pattern: 'ผู้หญิง + ผื่นรูปผีเสื้อ + ปวดข้อ + proteinuria', answer: 'SLE (พุ่มพวง)', mnemonic: 'ผีเสื้อ + ข้อ + ไต = SLE', category: 'MSK' },
  { pattern: 'OA vs RA: ใช้งานแล้วปวด vs ตื่นเช้าแข็ง', answer: 'OA = ข้อใหญ่ ใช้แล้วปวด / RA = ข้อเล็ก ตื่นแข็ง', mnemonic: 'OA=ใช้ปวด / RA=เช้าแข็ง', category: 'MSK' }
]

// ═══ GOLDEN RULES: กฎทอง ข้อห้าม ═══
const goldenRules = [
  { rule: 'ผู้หญิงวัยเจริญพันธุ์ปวดท้อง', action: '→ Pregnancy test ก่อนเสมอ!', why: 'Ectopic pregnancy ตายได้!' },
  { rule: 'ชัก', action: '→ เช็ค DTX (น้ำตาล) ก่อนเสมอ!', why: 'Hypoglycemia แก้ง่ายที่สุดแต่พลาดไม่ได้' },
  { rule: 'Chest pain', action: '→ ECG 12 leads ทันที!', why: 'STEMI ต้องเปิดหลอดเลือดใน 90 นาที' },
  { rule: 'Thunderclap headache', action: '→ CT brain ด่วน!', why: 'SAH ตายได้ทันที' },
  { rule: 'ไข้ + ปวดหัว + คอแข็ง', action: '→ LP! (ให้ ATB ก่อนถ้ารอนาน)', why: 'Meningitis ต้องรีบรักษา' },
  { rule: 'Tension pneumothorax', action: '→ Needle decompression ทันที ไม่ต้องรอ X-ray!', why: 'ตายใน minutes' },
  { rule: 'Wide QRS tachycardia', action: '→ ถือว่าเป็น VT จนกว่าจะพิสูจน์ไม่ใช่', why: 'VT อันตรายกว่า SVT' },
  { rule: 'Status epilepticus (ชัก > 5 นาที)', action: '→ Benzodiazepine ทันที!', why: 'สมองเสียหายถาวร' },
  { rule: 'ปวดหลัง + อ่อนแรง 2 ขา + ฉี่ไม่ออก', action: '→ MRI spine ด่วน!', why: 'Cord compression → เป็นอัมพาตถาวรถ้าช้า' },
  { rule: 'COPD ให้ O2', action: '→ เป้าหมาย 88-92% ไม่ใช่ 100%', why: 'O2 สูงเกิน → CO2 narcosis' },
  { rule: 'IDA ในผู้ชาย/หญิงหมดประจำเดือน', action: '→ ต้อง rule out GI malignancy!', why: 'เลือดออกจากมะเร็งลำไส้' },
  { rule: 'ข้อบวมแดงร้อน + ไข้', action: '→ Joint aspiration ทุกครั้ง!', why: 'Septic arthritis ทำลายข้อถ้าไม่รักษา' }
]

// ═══ CONFUSING PAIRS: คู่ที่ชอบสับสน ═══
const confusingPairs = [
  {
    pair: 'MI vs Pericarditis',
    diff: [
      { feature: 'ลักษณะปวด', a: 'แน่นๆ เหมือนช้างเหยียบ', b: 'แหลม (sharp/pleuritic)' },
      { feature: 'ท่าทาง', a: 'ไม่ช่วย', b: 'นั่งก้มตัวดีขึ้น' },
      { feature: 'ECG ST elevation', a: 'เฉพาะบาง leads (territorial)', b: 'ทุก leads (diffuse) + PR depression' }
    ]
  },
  {
    pair: 'IDA vs Thalassemia',
    diff: [
      { feature: 'MCV', a: 'ต่ำ', b: 'ต่ำมาก' },
      { feature: 'RBC count', a: 'ต่ำ', b: 'สูง (ผลิตมากแต่คุณภาพไม่ดี)' },
      { feature: 'Ferritin', a: 'ต่ำ', b: 'ปกติ/สูง' },
      { feature: 'RDW', a: 'สูง (ขนาดไม่เท่ากัน)', b: 'ปกติ' }
    ]
  },
  {
    pair: 'OA vs RA',
    diff: [
      { feature: 'ข้อที่เป็น', a: 'ข้อใหญ่ (เข่า สะโพก)', b: 'ข้อเล็ก (มือ ข้อมือ) สมมาตร' },
      { feature: 'ตอนเช้า', a: 'ข้อแข็ง < 30 นาที', b: 'ข้อแข็ง > 1 ชั่วโมง' },
      { feature: 'ใช้งาน', a: 'ใช้แล้วปวดมากขึ้น', b: 'ใช้แล้วดีขึ้น (warm up)' },
      { feature: 'Lab', a: 'ESR/CRP ปกติ', b: 'ESR/CRP สูง + RF/Anti-CCP (+)' }
    ]
  },
  {
    pair: 'Crohn vs UC (IBD)',
    diff: [
      { feature: 'ตำแหน่ง', a: 'ทุกส่วนของ GI (mouth to anus)', b: 'เฉพาะลำไส้ใหญ่ (colon)' },
      { feature: 'Pattern', a: 'Skip lesions (เป็นเว้นๆ)', b: 'Continuous (เป็นต่อเนื่อง)' },
      { feature: 'ความลึก', a: 'Transmural (ทะลุทุกชั้น)', b: 'Mucosal only (ชั้นเดียว)' },
      { feature: 'ภาวะแทรกซ้อน', a: 'Fistula, stricture', b: 'Toxic megacolon, มะเร็งลำไส้' },
      { feature: 'อาการเด่น', a: 'ปวดท้อง + ท้องเสีย', b: 'ถ่ายเป็นมูกเลือด' }
    ]
  },
  {
    pair: 'Vasovagal Syncope vs Cardiac Syncope',
    diff: [
      { feature: 'อาการนำ', a: 'มี (หน้ามืด คลื่นไส้ เหงื่อ)', b: 'ไม่มี (ล้มทันที)' },
      { feature: 'สิ่งกระตุ้น', a: 'ยืนนาน เจ็บ กลัวเลือด', b: 'ออกกำลังกาย / ไม่มีสาเหตุ' },
      { feature: 'อายุ', a: 'คนอายุน้อย', b: 'คนอายุมาก / เคยเป็นโรคหัวใจ' },
      { feature: 'อันตราย', a: 'ไม่อันตราย (benign)', b: 'อันตราย! อาจตายได้' }
    ]
  }
]

module.exports = { mustKnow, goldenRules, confusingPairs }
