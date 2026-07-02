const FlashcardPattern = require('./FlashcardPattern.model')

const SEED_DATA = [
  // ═══ GI (30) ═══
  {pattern:'ปวดรอบสะดือ → ย้ายไปท้องขวาล่าง',answer:'Appendicitis | ไส้ติ่งอักเสบ',mnemonic:'สะดือ → ขวาล่าง = ไส้ติ่ง',category:'GI',order:1},
  {pattern:'ดื่มเหล้า + ปวดท้องร้าวหลัง',answer:'Pancreatitis | ตับอ่อนอักเสบ',mnemonic:'เหล้า → หลัง = ตับอ่อน',category:'GI',order:2},
  {pattern:"Murphy's sign (+) กดท้องขวาบน หายใจเข้า → หยุดหายใจ",answer:'Cholecystitis | ถุงน้ำดีอักเสบ',mnemonic:'Murphy = ถุงน้ำดี',category:'GI',order:3},
  {pattern:'อาเจียน + ท้องอืด + ไม่ผายลม + เคยผ่าตัดท้อง',answer:'Bowel Obstruction | ลำไส้อุดตัน',mnemonic:'อุด = อืด + อาเจียน + ไม่ผาย',category:'GI',order:4},
  {pattern:'ปวดท้องทันที + ท้องแข็งเป็นไม้กระดาน',answer:'Perforation | กระเพาะทะลุ',mnemonic:'ทันที + แข็ง = ทะลุ',category:'GI',order:5},
  {pattern:'ผู้หญิง + ปวดท้อง + ประจำเดือนขาด',answer:'Ectopic Pregnancy | ท้องนอกมดลูก',mnemonic:'ผู้หญิงปวดท้อง → pregnancy test!',category:'GI',order:6},
  {pattern:'ตับแข็ง + อาเจียนเลือด',answer:'Esophageal Varices',mnemonic:'ตับแข็ง + เลือด = Varices',category:'GI',order:7},
  {pattern:'ตัวเหลืองไม่เจ็บ + น้ำหนักลด + ถุงน้ำดีโต',answer:'Pancreatic Cancer (Courvoisier)',mnemonic:'เหลืองไม่เจ็บ = มะเร็ง',category:'GI',order:8},
  {pattern:'ไข้ + ตัวเหลือง + ปวดท้องขวาบน (Charcot triad)',answer:'Cholangitis → ERCP ด่วน!',mnemonic:'Charcot 3 → ERCP!',category:'GI',order:9},
  {pattern:'กลืนติดทั้งของแข็งและของเหลว ตั้งแต่แรก',answer:'Achalasia | หลอดอาหารไม่คลาย',mnemonic:'ติดทั้ง 2 ตั้งแต่แรก = Achalasia',category:'GI',order:10},
  {pattern:'กลืนติดของแข็งก่อน → ต่อมาของเหลวด้วย + น้ำหนักลด',answer:'Esophageal CA | มะเร็งหลอดอาหาร',mnemonic:'แข็งก่อน → เหลว + ลดน้ำหนัก = CA',category:'GI',order:11},
  {pattern:'ท้องเสียเป็นเลือด + มูก + ไข้ + เดินทางกลับจากต่างประเทศ',answer:'Dysentery (Shigella/Amoeba)',mnemonic:'เลือดมูก + travel = Dysentery',category:'GI',order:12},
  {pattern:'ท้องเสียหลังกินยา ATB นาน + ไข้',answer:'C. difficile Colitis',mnemonic:'ATB → ท้องเสีย = C. diff',category:'GI',order:13},
  {pattern:'ปวดท้องหลังกินอาหาร + กลัวกิน + น้ำหนักลด + สูบบุหรี่',answer:'Chronic Mesenteric Ischemia',mnemonic:'กลัวกิน + สูบ = Mesenteric',category:'GI',order:14},
  {pattern:'ถ่ายดำ (melena) + ประวัติกิน NSAID',answer:'Peptic Ulcer Bleeding',mnemonic:'NSAID + ดำ = แผลเลือดออก',category:'GI',order:15},
  {pattern:'อาเจียนหลังกินเหล้าเยอะ → ต่อมาอาเจียนเป็นเลือด',answer:'Mallory-Weiss Tear',mnemonic:'อ้วกก่อน → เลือดทีหลัง = Mallory-Weiss',category:'GI',order:16},
  {pattern:'ท้องมาน + shifting dullness + spider nevi + palmar erythema',answer:'Liver Cirrhosis with Ascites',mnemonic:'ท้องมาน + spider + palmar = ตับแข็ง',category:'GI',order:17},
  {pattern:'ท้องเสียเรื้อรัง + ผื่น vesicle + ซีด + กิน gluten แล้วแย่',answer:'Celiac Disease',mnemonic:'gluten + ท้องเสีย + ผื่น = Celiac',category:'GI',order:18},
  {pattern:'ท้องเสียสลับท้องผูก + ปวดท้อง + ดีขึ้นหลังถ่าย + ไม่มี red flag',answer:'IBS | Irritable Bowel Syndrome',mnemonic:'สลับ + ดีหลังถ่าย + no red flag = IBS',category:'GI',order:19},
  {pattern:'ท้องเสียเป็นเลือดเรื้อรัง + ปวดท้อง + คนอายุน้อย',answer:'IBD (Crohn / UC)',mnemonic:'เลือดเรื้อรัง + คนอายุน้อย = IBD',category:'GI',order:20},
  {pattern:'Charcot triad + shock + สับสน (Reynolds pentad)',answer:'Acute Cholangitis รุนแรง → ERCP ด่วน',mnemonic:'Charcot + shock + สับสน = Reynolds',category:'GI',order:21},
  {pattern:'ปวดท้องร้าวไปหลัง + ท้องมาน + เป็นเบาหวานเฉียบพลัน',answer:'Pancreatic CA | มะเร็งตับอ่อน',mnemonic:'ร้าวหลัง + DM ใหม่ = CA ตับอ่อน',category:'GI',order:22},

  // ═══ Cardio (25) ═══
  {pattern:'แน่นหน้าอกเหมือนช้างเหยียบ ร้าวแขนซ้าย/คาง + เหงื่อ',answer:'ACS / MI → ECG ทันที!',mnemonic:'ช้างเหยียบ + แขนซ้าย = หัวใจ',category:'Cardio',order:23},
  {pattern:'เจ็บหน้าอกทันที + หอบ + ขาบวมข้างเดียว',answer:'Pulmonary Embolism',mnemonic:'หน้าอก + ขาบวม = PE',category:'Cardio',order:24},
  {pattern:'ปวดหน้าอก/หลังเหมือนฉีก + BP แขน 2 ข้างต่างกัน',answer:'Aortic Dissection',mnemonic:'ฉีก + BP ไม่เท่า = Dissection',category:'Cardio',order:25},
  {pattern:'เจ็บหน้าอก + เสียงหายใจเบาข้างเดียว',answer:'Pneumothorax',mnemonic:'เสียงเบาข้างเดียว = ลมรั่ว',category:'Cardio',order:26},
  {pattern:'เจ็บหน้าอก + นั่งก้มตัวดีขึ้น + ECG ST elevation ทุก lead',answer:'Pericarditis (ไม่ใช่ MI!)',mnemonic:'ก้มดีขึ้น + ST ทุก lead = Pericarditis',category:'Cardio',order:27},
  {pattern:'Wide QRS tachycardia',answer:'ถือว่าเป็น VT จนกว่าพิสูจน์ไม่ใช่!',mnemonic:'Wide = VT (อันตราย!)',category:'Cardio',order:28},
  {pattern:'Beck triad: BP ต่ำ + คอโป่ง + เสียงหัวใจเบา',answer:'Cardiac Tamponade → เจาะทันที!',mnemonic:'Beck = บีบหัวใจ',category:'Cardio',order:29},
  {pattern:'เหนื่อย + นอนราบไม่ได้ + ขาบวม + BNP สูง',answer:'Heart Failure',mnemonic:'นอนไม่ได้ + บวม = หัวใจวาย',category:'Cardio',order:30},
  {pattern:'ECG: irregularly irregular + no P wave',answer:'Atrial Fibrillation (AF)',mnemonic:'ไม่สม่ำเสมอ + ไม่มี P = AF',category:'Cardio',order:31},
  {pattern:'Narrow QRS tachycardia + หัวใจเต้นเร็วทันที + หยุดทันที',answer:'SVT → Vagal maneuver / Adenosine',mnemonic:'เร็วทันที หยุดทันที = SVT',category:'Cardio',order:32},
  {pattern:'เจ็บหน้าอกเวลาออกกำลัง + เป็นลม + murmur crescendo-decrescendo',answer:'Aortic Stenosis',mnemonic:'ออกกำลัง + เป็นลม + murmur = AS',category:'Cardio',order:33},
  {pattern:'คนอายุน้อย + เป็นลมตอนออกกำลัง + ประวัติครอบครัวเสียชีวิตกะทันหัน',answer:'HOCM',mnemonic:'อายุน้อย + เป็นลม + ครอบครัว = HOCM',category:'Cardio',order:34},
  {pattern:'ไข้ + murmur ใหม่ + Osler node + Janeway lesion',answer:'Infective Endocarditis',mnemonic:'ไข้ + murmur ใหม่ = IE',category:'Cardio',order:35},
  {pattern:'ขาบวมข้างเดียว + ปวด + ผ่าตัด/นอนนาน + Homan sign',answer:'DVT → Duplex US',mnemonic:'ขาบวม 1 ข้าง = DVT',category:'Cardio',order:36},
  {pattern:'ECG: ST elevation V1-V4 + Troponin สูง',answer:'Anterior STEMI → PCI ด่วน!',mnemonic:'ST up V1-V4 = LAD territory',category:'Cardio',order:37},
  {pattern:'ECG: ST elevation II, III, aVF',answer:'Inferior STEMI (RCA territory)',mnemonic:'II III aVF = ข้างล่าง = RCA',category:'Cardio',order:38},
  {pattern:'Pulseless electrical activity (PEA)',answer:'หา H & T: Hypovolemia, Hypoxia, Hypothermia, H+, Hypo/HyperK, Tamponade, Tension pneumo, Thrombosis, Toxin',mnemonic:'PEA = หา H & T',category:'Cardio',order:39},
  {pattern:'ปวดขาเวลาเดิน + หยุดพักแล้วดีขึ้น + ABI < 0.9',answer:'PAD | Peripheral Arterial Disease',mnemonic:'เดินปวด + พักดี + ABI ต่ำ = PAD',category:'Cardio',order:40},

  // ═══ Neuro (35) ═══
  {pattern:'ปวดหัวรุนแรงที่สุดในชีวิต (thunderclap) ทันที',answer:'SAH → CT ด่วน!',mnemonic:'ปวดที่สุดเคย = SAH',category:'Neuro',order:41},
  {pattern:'ไข้ + ปวดหัว + คอแข็ง',answer:'Meningitis → LP!',mnemonic:'ไข้ + ปวดหัว + คอแข็ง = เยื่อหุ้มสมอง',category:'Neuro',order:42},
  {pattern:'อ่อนแรงครึ่งซีก + พูดไม่ชัด + ปากเบี้ยว ทันที',answer:'Stroke → CT brain ด่วน!',mnemonic:'FAST: Face Arm Speech Time',category:'Neuro',order:43},
  {pattern:'อ่อนแรง ascending (ขาก่อน→แขน) + หลังหวัด + DTR หาย',answer:'GBS (Guillain-Barré)',mnemonic:'ขึ้นจากล่าง + reflex หาย = GBS',category:'Neuro',order:44},
  {pattern:'หนังตาตก + เห็นภาพซ้อน + อ่อนแรงเมื่อใช้งาน',answer:'Myasthenia Gravis',mnemonic:'ตาตก + ใช้งานแล้วอ่อน = MG',category:'Neuro',order:45},
  {pattern:'ปวดหลัง + อ่อนแรง 2 ขา + ปัสสาวะไม่ออก',answer:'Cord Compression → MRI ด่วน!',mnemonic:'หลัง + ขา + ฉี่ = ไขสันหลัง',category:'Neuro',order:46},
  {pattern:'ปวดหัวตุ๊บๆ ข้างเดียว + คลื่นไส้ + กลัวแสง + aura',answer:'Migraine',mnemonic:'ตุ๊บๆ + ข้างเดียว + aura = Migraine',category:'Neuro',order:47},
  {pattern:'ปวดหัวแบบบีบรัด 2 ข้าง + ปวดท้ายทอย + เครียด',answer:'Tension-type Headache',mnemonic:'บีบรัด 2 ข้าง = Tension',category:'Neuro',order:48},
  {pattern:'คนแก่ + ปวดหัวข้างเดียว + ปวดขมับ + ตามัว + ESR สูงมาก',answer:'Temporal Arteritis → Steroid ด่วน!',mnemonic:'คนแก่ + ขมับ + ESR = TA → ตาบอดได้!',category:'Neuro',order:49},
  {pattern:'หมุนเวียนศีรษะ + ขยับหัว → เป็นมาก + Dix-Hallpike (+)',answer:'BPPV',mnemonic:'หมุนตามหัว + Dix-Hallpike = BPPV',category:'Neuro',order:50},
  {pattern:'หมุนเวียนศีรษะ + หูอื้อ + เสียงในหู + ค่อยๆ เป็น',answer:'Meniere Disease',mnemonic:'หมุน + หูอื้อ + tinnitus = Meniere',category:'Neuro',order:51},
  {pattern:'มือสั่นตอนพัก + เดินลำบาก + หน้าตาย + cogwheel rigidity',answer:'Parkinson Disease',mnemonic:'สั่นพัก + หน้าตาย + แข็ง = PD',category:'Neuro',order:52},
  {pattern:'สั่นตอนใช้งาน (intention tremor) + เดินเซ + พูดไม่ชัด',answer:'Cerebellar Lesion',mnemonic:'intention + เซ + dysarthria = Cerebellar',category:'Neuro',order:53},
  {pattern:'ลืมความจำค่อยๆ แย่ + หลง + พฤติกรรมเปลี่ยน + คนแก่',answer:'Alzheimer Disease',mnemonic:'ลืมค่อยๆ + คนแก่ = Alzheimer',category:'Neuro',order:54},
  {pattern:'ลืม + เดินลำบาก + ปัสสาวะราด (Hakim triad)',answer:'Normal Pressure Hydrocephalus (NPH)',mnemonic:'Wet Wacky Wobbly = NPH (รักษาได้!)',category:'Neuro',order:55},
  {pattern:'CN III palsy + pupil dilated + ปวดหัว',answer:'PCA Aneurysm → Angiogram ด่วน!',mnemonic:'CN III + pupil โต = Aneurysm!',category:'Neuro',order:56},
  {pattern:'Horner syndrome: ptosis + miosis + anhidrosis',answer:'Sympathetic chain lesion',mnemonic:'ตาตก + ม่านเล็ก + ไม่เหงื่อ = Horner',category:'Neuro',order:57},
  {pattern:'อ่อนแรงทั้ง UMN + LMN + fasciculation + ไม่มีชา',answer:'ALS (Motor Neuron Disease)',mnemonic:'UMN + LMN + ไม่ชา = ALS',category:'Neuro',order:58},
  {pattern:'เด็ก + ชัก + ไข้สูง + อายุ 6 เดือน - 5 ปี + ชักสั้น < 15 นาที',answer:'Febrile Seizure (simple)',mnemonic:'เด็กไข้สูง + ชักสั้น = Febrile',category:'Neuro',order:59},
  {pattern:'Optic neuritis + อ่อนแรงเป็นพักๆ + lesion แยก time & space',answer:'Multiple Sclerosis (MS)',mnemonic:'ตามัว + อ่อนแรงเป็นพักๆ = MS',category:'Neuro',order:60},
  {pattern:'ชาถุงมือถุงเท้า (stocking-glove) + เป็นเบาหวานนาน',answer:'DM Peripheral Neuropathy',mnemonic:'ถุงมือถุงเท้า + DM = DM neuropathy',category:'Neuro',order:61},
  {pattern:'ชามือ 3 นิ้วแรก (thumb, index, middle) + Tinel/Phalen (+)',answer:'Carpal Tunnel Syndrome',mnemonic:'3 นิ้วแรก + Tinel = CTS',category:'Neuro',order:62},

  // ═══ Pulmo (20) ═══
  {pattern:'ไอ > 2 สัปดาห์ + ไข้ + น้ำหนักลด + เหงื่อกลางคืน',answer:'TB (วัณโรค)',mnemonic:'ไอนาน + ไข้ + ลด + เหงื่อ = TB',category:'Pulmo',order:63},
  {pattern:'Silent chest ในคนหืด',answer:'Severe Asthma → อันตรายมาก!',mnemonic:'เงียบ ≠ ดี ในหืด',category:'Pulmo',order:64},
  {pattern:'COPD + ให้ O2 เป้าหมาย?',answer:'88-92% ไม่ใช่ 100%!',mnemonic:'O2 มาก = CO2 narcosis',category:'Pulmo',order:65},
  {pattern:'ไข้สูง + ไอเสมหะเขียว + หายใจเร็ว + CXR infiltrate',answer:'Pneumonia → ATB',mnemonic:'ไข้ + เสมหะเขียว + CXR = Pneumonia',category:'Pulmo',order:66},
  {pattern:'เหนื่อยค่อยๆ เป็น + barrel chest + pursed lip + FEV1/FVC < 0.7',answer:'COPD',mnemonic:'barrel + pursed lip + FEV1/FVC ต่ำ = COPD',category:'Pulmo',order:67},
  {pattern:'หอบ + wheeze + ดีขึ้นด้วย bronchodilator + ประวัติภูมิแพ้',answer:'Asthma',mnemonic:'wheeze + bronchodilator ดีขึ้น = หืด',category:'Pulmo',order:68},
  {pattern:'หอบ + CXR ขาวทั้ง 2 ข้าง (bilateral infiltrate) + PaO2/FiO2 < 300',answer:'ARDS',mnemonic:'ขาว 2 ข้าง + hypoxia รุนแรง = ARDS',category:'Pulmo',order:69},
  {pattern:'เจ็บหน้าอกตอนหายใจ + ไข้ + เสียง friction rub',answer:'Pleuritis / Pleurisy',mnemonic:'เจ็บตอนหายใจ + rub = Pleuritis',category:'Pulmo',order:70},
  {pattern:'น้ำในปอด + Light criteria: exudate',answer:'TB / Malignancy / Pneumonia (Parapneumonic)',mnemonic:'Exudate = สาเหตุร้ายแรง',category:'Pulmo',order:71},
  {pattern:'น้ำในปอด + Light criteria: transudate',answer:'CHF / Cirrhosis / Nephrotic',mnemonic:'Transudate = systemic cause',category:'Pulmo',order:72},

  // ═══ ID (15) ═══
  {pattern:'ไข้สูง + ปวดเมื่อย + WBC ต่ำ + Plt ต่ำ + ฤดูฝน',answer:'Dengue (ไข้เลือดออก)',mnemonic:'ฝน + WBC↓ + Plt↓ = Dengue',category:'ID',order:73},
  {pattern:'ไข้ + ปวดน่อง + ตาแดง + สัมผัสน้ำท่วม',answer:'Leptospirosis (ฉี่หนู)',mnemonic:'น้ำท่วม + น่อง + ตาแดง = Lepto',category:'ID',order:74},
  {pattern:'ไข้ + eschar (แผลตุ่มดำ) + เดินป่า',answer:'Scrub Typhus → Doxycycline',mnemonic:'eschar + ป่า = Scrub → Doxy',category:'ID',order:75},
  {pattern:'ไข้ + หนาวสั่นเป็นพักๆ + ม้ามโต + เดินทางจากป่า/ชายแดน',answer:'Malaria → Thick & Thin smear',mnemonic:'หนาวสั่นเป็นพัก + ป่า = Malaria',category:'ID',order:76},
  {pattern:'ไข้ + ปัสสาวะแสบขัด + CVA tenderness',answer:'Pyelonephritis → UA + UC',mnemonic:'ไข้ + แสบ + เคาะหลัง = Pyelo',category:'ID',order:77},
  {pattern:'ไข้นานเกิน 3 สัปดาห์ + หาสาเหตุไม่ได้',answer:'FUO → TB, Lymphoma, Autoimmune',mnemonic:'ไข้นาน + หาไม่เจอ = FUO',category:'ID',order:78},
  {pattern:'ไข้ + ผื่นแดงทั้งตัว + ตาแดง + ปากแตก + lymph node โต + เด็ก < 5 ปี',answer:'Kawasaki Disease → IVIG + ASA',mnemonic:'เด็ก + ไข้ 5 วัน + 4/5 criteria = Kawasaki',category:'ID',order:79},
  {pattern:'ไข้ + ไอ + ผื่น maculopapular จากหน้า→ลำตัว + Koplik spots',answer:'Measles (หัด)',mnemonic:'Koplik + ผื่นบน→ล่าง = หัด',category:'ID',order:80},
  {pattern:'ไข้ต่ำ + ผื่น vesicle หลายระยะ (crop) ทั่วตัว',answer:'Varicella (อีสุกอีใส)',mnemonic:'vesicle หลายระยะ = อีสุกอีใส',category:'ID',order:81},

  // ═══ Hemato (20) ═══
  {pattern:'MCV ต่ำ + Ferritin ต่ำ',answer:'Iron Deficiency Anemia',mnemonic:'เล็ก + เหล็กน้อย = ขาดเหล็ก',category:'Hemato',order:82},
  {pattern:'MCV ต่ำ + Ferritin ปกติ/สูง + RBC count สูง',answer:'Thalassemia (ไม่ใช่ IDA!)',mnemonic:'เล็กแต่เยอะ = ธาลัส',category:'Hemato',order:83},
  {pattern:'MCV สูง + hypersegmented neutrophils',answer:'B12/Folate Deficiency',mnemonic:'ใหญ่ + แฉกเยอะ = B12',category:'Hemato',order:84},
  {pattern:'ต่อมน้ำเหลืองโตไม่เจ็บ + ไข้ + น้ำหนักลด + เหงื่อ (B symptoms)',answer:'Lymphoma → biopsy!',mnemonic:'โตไม่เจ็บ + B symptoms = Lymphoma',category:'Hemato',order:85},
  {pattern:'Left supraclavicular node (Virchow)',answer:'GI Malignancy (Gastric CA)',mnemonic:'Virchow = มะเร็งท้อง',category:'Hemato',order:86},
  {pattern:'Coombs test (+) + spherocytes + reticulocyte สูง',answer:'Autoimmune Hemolytic Anemia (AIHA)',mnemonic:'Coombs+ + sphero = AIHA',category:'Hemato',order:87},
  {pattern:'Schistocytes + Plt ต่ำ + ไตวาย + ไข้ + neuro symptoms',answer:'TTP → Plasma exchange ด่วน!',mnemonic:'Schistocyte + pentad = TTP',category:'Hemato',order:88},
  {pattern:'PT/INR สูง + aPTT สูง + Plt ต่ำ + D-dimer สูง + เลือดออก',answer:'DIC',mnemonic:'ทุกอย่างผิดปกติ = DIC',category:'Hemato',order:89},
  {pattern:'Plt ต่ำมาก + จ้ำเลือด + เด็ก + หลังหวัด + ไม่มีม้ามโต',answer:'ITP',mnemonic:'เด็กหลังหวัด + Plt ต่ำ = ITP',category:'Hemato',order:90},
  {pattern:'WBC สูงมาก + blast cells + ซีด + ติดเชื้อ + เลือดออก',answer:'Acute Leukemia (AML/ALL)',mnemonic:'WBC สูง + blast + pancytopenia = Leukemia',category:'Hemato',order:91},
  {pattern:'WBC สูง + Philadelphia chromosome + splenomegaly',answer:'CML',mnemonic:'Philadelphia + ม้ามโต = CML',category:'Hemato',order:92},
  {pattern:'เลือดออกง่าย + aPTT ยาว + PT ปกติ + ผู้ชาย',answer:'Hemophilia (A or B)',mnemonic:'aPTT ยาว + ชาย = Hemophilia',category:'Hemato',order:93},

  // ═══ MSK (15) ═══
  {pattern:'ปวดหัวแม่เท้ารุนแรงทันที + บวมแดง (podagra)',answer:'Gout (เกาต์)',mnemonic:'หัวแม่เท้าแดง = เกาต์',category:'MSK',order:94},
  {pattern:'ข้อบวมแดงร้อน + ไข้ → ต้องทำอะไร?',answer:'Joint aspiration ทุกครั้ง!',mnemonic:'ข้อร้อน + ไข้ = ดูดน้ำข้อ!',category:'MSK',order:95},
  {pattern:'ปวดข้อสมมาตร + ข้อเล็ก (MCP/PIP) + ข้อฝืดเช้า > 1 ชม.',answer:'Rheumatoid Arthritis',mnemonic:'สมมาตร + เช้าแข็ง > 1 ชม. = RA',category:'MSK',order:96},
  {pattern:'ผู้หญิง + ผื่นรูปผีเสื้อ + ปวดข้อ + proteinuria',answer:'SLE',mnemonic:'ผีเสื้อ + ข้อ + ไต = SLE',category:'MSK',order:97},
  {pattern:'ข้อเข่าปวดเวลาใช้งาน + Heberden node + Bouchard node',answer:'Osteoarthritis',mnemonic:'ใช้งาน + node = OA',category:'MSK',order:98},
  {pattern:'ปวดข้อ + ตาแดง + ท่อปัสสาวะอักเสบ (หลังท้องเสีย/STI)',answer:'Reactive Arthritis (Reiter)',mnemonic:'ข้อ + ตา + ท่อ = Reiter',category:'MSK',order:99},
  {pattern:'ปวดหลังตอนเช้า + แข็งเกิน 30 นาที + คนอายุน้อย + HLA-B27',answer:'Ankylosing Spondylitis',mnemonic:'คนอายุน้อย + ปวดหลังเช้า + B27 = AS',category:'MSK',order:100},
  {pattern:'Pseudogout: crystal รูป rhomboid + birefringence (+) + ข้อเข่า',answer:'CPPD (Pseudogout)',mnemonic:'rhomboid crystal + เข่า = Pseudogout',category:'MSK',order:101},

  // ═══ Endo (15) ═══
  {pattern:'3P: กระหายน้ำ + ปัสสาวะบ่อย + หิว + น้ำหนักลด',answer:'Diabetes Mellitus',mnemonic:'3P = เบาหวาน',category:'Endo',order:102},
  {pattern:'DKA: คลื่นไส้ + หายใจเร็วลึก (Kussmaul) + กลิ่นผลไม้',answer:'Diabetic Ketoacidosis → Insulin + IV',mnemonic:'ผลไม้ + Kussmaul = DKA',category:'Endo',order:103},
  {pattern:'น้ำหนักลด + ใจสั่น + มือสั่น + เหงื่อ + ตาโปน',answer:'Hyperthyroidism (Graves)',mnemonic:'ลด + สั่น + เหงื่อ + โปน = Graves',category:'Endo',order:104},
  {pattern:'อ่อนเพลีย + ผิวคล้ำ + BP ต่ำ + Na ต่ำ + K สูง',answer:'Addison Disease (Adrenal Insufficiency)',mnemonic:'คล้ำ + BP↓ + Na↓K↑ = Addison',category:'Endo',order:105},
  {pattern:'อ้วนลงพุง + หน้ากลม + ผิวลาย + BP สูง + น้ำตาลสูง',answer:'Cushing Syndrome',mnemonic:'อ้วนลงพุง + moon face + striae = Cushing',category:'Endo',order:106},
  {pattern:'หิว + เหงื่อ + สั่น + สับสน + กิน sulfonylurea/insulin',answer:'Hypoglycemia',mnemonic:'Whipple triad: อาการ + น้ำตาลต่ำ + ดีขึ้นหลังให้',category:'Endo',order:107},
  {pattern:'ท้องผูก + อ้วน + ผิวแห้ง + ขี้หนาว + reflexes ช้า',answer:'Hypothyroidism',mnemonic:'ทุกอย่างช้า = Hypothyroid',category:'Endo',order:108},
  {pattern:'Thyroid storm: ไข้สูง + ใจสั่น + สับสน + ประวัติ Graves',answer:'Thyroid Storm → PTU + Lugol + Steroid + BB',mnemonic:'Graves + ไข้ + สับสน = Storm',category:'Endo',order:109},
  {pattern:'Na ต่ำ + urine osmolality สูง + euvolemic',answer:'SIADH',mnemonic:'Na ต่ำ + urine เข้มข้น + normovolemic = SIADH',category:'Endo',order:110},
  {pattern:'Ca สูง + PTH สูง',answer:'Primary Hyperparathyroidism',mnemonic:'Ca↑ + PTH↑ = parathyroid adenoma',category:'Endo',order:111},
  {pattern:'Ca สูง + PTH ต่ำ + malignancy',answer:'Hypercalcemia of Malignancy (PTHrP)',mnemonic:'Ca↑ + PTH↓ = มะเร็ง',category:'Endo',order:112},
  {pattern:'Chvostek sign + Trousseau sign + QT prolongation',answer:'Hypocalcemia',mnemonic:'Chvostek + Trousseau = Ca ต่ำ',category:'Endo',order:113},

  // ═══ Renal (15) ═══
  {pattern:'เด็ก + เจ็บคอ 2 สัปดาห์ก่อน + ปัสสาวะสีโค้ก + บวม',answer:'Post-streptococcal GN',mnemonic:'เจ็บคอ → 2 wk → ฉี่โค้ก = PSGN',category:'Renal',order:114},
  {pattern:'ปวดท้อง/หลังรุนแรง + ปัสสาวะเป็นเลือด + colicky pain',answer:'Urolithiasis (นิ่ว)',mnemonic:'ปวดบิด + เลือดในฉี่ = นิ่ว',category:'Renal',order:115},
  {pattern:'บวมทั้งตัว + proteinuria > 3.5g + albumin ต่ำ + ไขมันสูง',answer:'Nephrotic Syndrome',mnemonic:'บวม + protein มาก + albumin ต่ำ = Nephrotic',category:'Renal',order:116},
  {pattern:'ฉี่เลือด + RBC cast + ความดันสูง + BUN/Cr สูง',answer:'Nephritic Syndrome / GN',mnemonic:'RBC cast = Nephritic',category:'Renal',order:117},
  {pattern:'BUN/Cr ratio > 20 + FeNa < 1% + urine Na < 20',answer:'Prerenal AKI (Dehydration/Shock)',mnemonic:'FeNa < 1% = ไตพยายามดูดน้ำ = Prerenal',category:'Renal',order:118},
  {pattern:'Muddy brown casts + ATN + FeNa > 2%',answer:'Intrinsic Renal AKI (ATN)',mnemonic:'Muddy brown + FeNa > 2% = ATN',category:'Renal',order:119},
  {pattern:'K สูง + ECG: peaked T wave + wide QRS',answer:'Hyperkalemia → Calcium gluconate + Insulin/D50',mnemonic:'K สูง + peaked T = ให้ Ca ก่อน!',category:'Renal',order:120},
  {pattern:'K ต่ำ + weakness + cramps + U wave ใน ECG',answer:'Hypokalemia',mnemonic:'อ่อนแรง + U wave = K ต่ำ',category:'Renal',order:121},

  // ═══ Emergency / Golden Rule (25) ═══
  {pattern:'Tension pneumothorax: คอโป่ง + หลอดลมเบี้ยว + BP ต่ำ',answer:'→ Needle decompression! ไม่ต้องรอ X-ray',mnemonic:'แทงเข็มก่อน!',category:'Emergency',order:122},
  {pattern:'Status epilepticus (ชัก > 5 นาที)',answer:'→ Benzodiazepine ทันที!',mnemonic:'ชักไม่หยุด = ฉีด Benzo!',category:'Emergency',order:123},
  {pattern:'ชัก → เช็คอะไรก่อนเสมอ?',answer:'DTX (น้ำตาล) เช็คก่อนทุกครั้ง!',mnemonic:'ชัก → จิ้มนิ้ว!',category:'Golden Rule',order:124},
  {pattern:'ผู้หญิงวัยเจริญพันธุ์ปวดท้อง ต้องทำอะไรก่อน?',answer:'Pregnancy test ก่อนเสมอ!',mnemonic:'ผู้หญิงปวดท้อง = test!',category:'Golden Rule',order:125},
  {pattern:'Chest pain → ทำอะไรก่อน?',answer:'ECG 12 leads ทันที!',mnemonic:'เจ็บหน้าอก = ECG!',category:'Golden Rule',order:126},
  {pattern:'IDA ในผู้ชาย / หญิงหมดประจำเดือน',answer:'→ Rule out GI Malignancy!',mnemonic:'ขาดเหล็กในคนแก่ = หามะเร็ง!',category:'Golden Rule',order:127},
  {pattern:'Anaphylaxis: ผื่นลมพิษ + หอบ + BP ต่ำ',answer:'→ Epinephrine IM ทันที! (ต้นขา)',mnemonic:'Anaphylaxis = Epi IM',category:'Emergency',order:128},
  {pattern:'Sepsis: ไข้ + HR เร็ว + หายใจเร็ว + WBC ผิดปกติ + organ dysfunction',answer:'→ ATB ภายใน 1 ชม. + IV fluid',mnemonic:'Sepsis = ATB + fluid ด่วน',category:'Emergency',order:129},
  {pattern:'Shock + JVP สูง + distant heart sound + pulsus paradoxus',answer:'Cardiac Tamponade → Pericardiocentesis',mnemonic:'JVP สูง + เสียงเบา + paradoxus = Tamponade',category:'Emergency',order:130},
  {pattern:'GCS ≤ 8',answer:'→ Intubation! ป้องกัน airway',mnemonic:'GCS ≤ 8 = Intubate',category:'Golden Rule',order:131},
  {pattern:'ดื่มยาพิษ → ต้องถามอะไร?',answer:'อะไร เมื่อไร เท่าไร',mnemonic:'What When How much',category:'Golden Rule',order:132},
  {pattern:'Warfarin overdose + bleeding',answer:'→ Vit K + FFP/PCC',mnemonic:'Warfarin bleed = Vit K!',category:'Emergency',order:133},
  {pattern:'Heparin overdose + bleeding',answer:'→ Protamine sulfate',mnemonic:'Heparin antidote = Protamine',category:'Emergency',order:134},
  {pattern:'Opioid overdose: pinpoint pupil + RR ต่ำ + หมดสติ',answer:'→ Naloxone',mnemonic:'pupil เล็ก + ไม่หายใจ = Naloxone',category:'Emergency',order:135},
  {pattern:'Paracetamol overdose',answer:'→ NAC (N-acetylcysteine)',mnemonic:'PCM antidote = NAC',category:'Emergency',order:136},
  {pattern:'Benzodiazepine overdose',answer:'→ Flumazenil',mnemonic:'Benzo antidote = Flumazenil',category:'Emergency',order:137},
  {pattern:'Organophosphate poisoning: SLUDGE + miosis + bradycardia',answer:'→ Atropine + Pralidoxime',mnemonic:'SLUDGE = ยาฆ่าแมลง → Atropine',category:'Emergency',order:138},
  {pattern:'CO poisoning: ปวดหัว + คลื่นไส้ + cherry-red skin',answer:'→ 100% O2 / Hyperbaric O2',mnemonic:'cherry red + ปวดหัว = CO → O2!',category:'Emergency',order:139},
  {pattern:'Massive hemoptysis > 600 ml/24h',answer:'→ Intubation + Lateral decubitus (bleeding side down) + Bronchoscopy/Embolization',mnemonic:'ไอเลือดเยอะ = นอนตะแคงข้างที่เลือด',category:'Emergency',order:140},
  {pattern:'Acute MI + cardiogenic shock',answer:'→ PCI + IABP + vasopressor',mnemonic:'MI + shock = PCI + support',category:'Emergency',order:141},

  // ═══ Misc / Skin / Others (20) ═══
  {pattern:'ผื่นเป็นวง target lesion + ไข้ + ปากเปื่อย + ตาแดง',answer:'Stevens-Johnson Syndrome (SJS)',mnemonic:'target + เยื่อบุ = SJS',category:'Skin',order:142},
  {pattern:'ผื่น target + > 30% body surface area + ลอก',answer:'TEN (Toxic Epidermal Necrolysis)',mnemonic:'SJS > 30% = TEN',category:'Skin',order:143},
  {pattern:'ผื่นเป็นแถบตาม dermatome + ปวดแสบ + vesicle',answer:'Herpes Zoster (งูสวัด)',mnemonic:'1 dermatome + vesicle = Zoster',category:'Skin',order:144},
  {pattern:'ลมพิษ + แน่นคอ + หายใจลำบาก + หลังกินยา/อาหาร',answer:'Anaphylaxis → Epinephrine!',mnemonic:'ลมพิษ + หอบ = Anaphylaxis',category:'Skin',order:145},
  {pattern:'ผื่นกลม เป็นขุย ขอบนูน + KOH: hyphae',answer:'Dermatophytosis (กลาก)',mnemonic:'กลม + ขุย + KOH = กลาก',category:'Skin',order:146},
  {pattern:'ผื่นเงิน (silvery scale) + Auspitz sign + ข้อ (nail pitting)',answer:'Psoriasis',mnemonic:'เงิน + Auspitz = สะเก็ดเงิน',category:'Skin',order:147},
  {pattern:'บวมริมฝีปาก/ตา + ไม่คัน + ACEi',answer:'Angioedema (ACEi-induced)',mnemonic:'ACEi + บวมริมฝีปาก = Angioedema',category:'Skin',order:148},
  {pattern:'ผู้ชาย + ตกขาวขุ่น + dysuria + gram stain: diplococci',answer:'Gonorrhea',mnemonic:'ตกขาวขุ่น + diplococci = หนองใน',category:'ID',order:149},
  {pattern:'แผลอวัยวะเพศไม่เจ็บ + ก้นแข็ง (chancre)',answer:'Primary Syphilis',mnemonic:'ไม่เจ็บ + ก้นแข็ง = ซิฟิลิส',category:'ID',order:150},
  {pattern:'แผลอวัยวะเพศเจ็บ + vesicle เป็นกลุ่ม',answer:'Herpes Genitalis',mnemonic:'เจ็บ + vesicle = Herpes',category:'ID',order:151},
]

SEED_DATA.forEach((s, i) => { s.order = i + 1 })

async function seedFlashcards({ force = false } = {}) {
  const existing = await FlashcardPattern.countDocuments()
  if (existing > 0 && !force) {
    console.log(`[Flashcard] Already ${existing} patterns — skip seed`)
    return
  }
  await FlashcardPattern.deleteMany({})
  await FlashcardPattern.insertMany(SEED_DATA)
  console.log(`[Flashcard] Seeded ${SEED_DATA.length} patterns (replaced all)`)
}

module.exports = { seedFlashcards }
