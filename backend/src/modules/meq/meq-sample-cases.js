/**
 * MEQ Sample Cases — ข้อมูลตัวอย่าง 3 cases
 *
 * วิธีใช้: เรียก seedSampleCases() เพื่อ insert ลง DB
 * หรือ import sampleCases array ไปใช้ใน admin UI
 */

const sampleCases = [
  // ─── Case 1: Ectopic Pregnancy ───
  {
    title: 'หญิง 30 ปี ปวดท้องน้อย',
    scenario: 'หญิงไทย อายุ 30 ปี G1P0 มาห้องฉุกเฉินด้วยอาการปวดท้องน้อยด้านขวา เป็นมา 6 ชั่วโมง ปวดมากขึ้นเรื่อยๆ ร่วมกับมีเลือดออกทางช่องคลอดเล็กน้อย ประจำเดือนครั้งสุดท้ายมา 7 สัปดาห์ก่อน',
    category: 'OB-GYN',
    difficulty: 'medium',
    tags: ['ectopic pregnancy', 'acute abdomen', 'vaginal bleeding'],
    estimatedMinutes: 15,
    isPublished: true,
    steps: [
      {
        order: 1,
        type: 'history',
        question: 'จะซักประวัติอะไรเพิ่มเติมบ้าง?',
        hints: ['คิดถึงเรื่อง menstrual history', 'ประวัติทาง OB-GYN สำคัญ'],
        expectedAnswers: [
          'ประวัติประจำเดือน รอบเดือน สม่ำเสมอหรือไม่',
          'ประวัติการคุมกำเนิด',
          'ประวัติการตั้งครรภ์ก่อนหน้า',
          'ลักษณะเลือดที่ออก สี ปริมาณ',
          'อาการปวด ตำแหน่ง ลักษณะ ร้าว',
          'ประวัติ PID หรือ STI',
          'ประวัติผ่าตัดช่องท้อง'
        ],
        keyPoints: [
          'ประวัติขาดประจำเดือน 7 สัปดาห์ — นึกถึงตั้งครรภ์',
          'ประวัติ risk factors ของ ectopic pregnancy'
        ],
        revealText: 'ประจำเดือนมาไม่สม่ำเสมอ รอบ 28-35 วัน ไม่ได้คุมกำเนิด เคยมีประวัติ PID รักษาด้วยยาปฏิชีวนะเมื่อ 2 ปีก่อน ปวดท้องน้อยด้านขวา ปวดแบบตื้อๆ ตลอดเวลา ไม่ร้าว เลือดออกสีน้ำตาลเข้ม ปริมาณน้อย ไม่มีไข้ ไม่คลื่นไส้อาเจียน',
        explanation: 'ประวัติ PID เป็น risk factor สำคัญของ ectopic pregnancy เพราะทำให้ท่อนำไข่อักเสบตีบตัน ร่วมกับขาดประจำเดือน 7 สัปดาห์ ควรนึกถึง ectopic pregnancy เป็นอันดับแรก',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 2,
        type: 'examination',
        question: 'จะตรวจร่างกายอะไรบ้าง?',
        hints: ['Vital signs สำคัญเสมอ', 'ตรวจท้องและ pelvic exam'],
        expectedAnswers: [
          'Vital signs: BP, PR, RR, Temp',
          'ตรวจท้อง: tenderness, guarding, rebound',
          'Pelvic examination',
          'Cervical motion tenderness',
          'Adnexal mass'
        ],
        keyPoints: [
          'Cervical motion tenderness เป็น classic sign',
          'ดู hemodynamic stability'
        ],
        revealText: 'V/S: BP 100/70, PR 100, RR 20, T 37.2°C\nAbdomen: tenderness RLQ, mild guarding, no rebound\nPV: cervical motion tenderness (+), right adnexal tenderness (+), uterus slightly enlarged, no active bleeding from cervical os\nPelvic exam: right adnexal mass ประมาณ 3 cm คลำได้ กดเจ็บ',
        explanation: 'Cervical motion tenderness ร่วมกับ adnexal mass และ tenderness ด้านขวา ในผู้ป่วยที่ขาดประจำเดือน — classic presentation ของ ectopic pregnancy BP ค่อนข้างต่ำ PR เร็ว อาจมี internal bleeding',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 3,
        type: 'ddx',
        question: 'Differential diagnosis คืออะไรบ้าง? เรียงตามความน่าจะเป็น',
        hints: ['คิดทั้ง OB-GYN และ surgical causes'],
        expectedAnswers: [
          'Ectopic pregnancy',
          'Threatened abortion',
          'Ruptured ovarian cyst',
          'Ovarian torsion',
          'Acute appendicitis',
          'PID'
        ],
        keyPoints: [
          'Ectopic pregnancy ต้องอยู่อันดับ 1'
        ],
        revealText: 'DDx ที่ควรนึกถึง:\n1. Ectopic pregnancy — most likely (ขาดประจำเดือน + PV bleeding + adnexal mass + hx PID)\n2. Threatened/incomplete abortion\n3. Ruptured ovarian cyst\n4. Ovarian torsion\n5. Acute appendicitis\n6. PID',
        explanation: 'ในหญิงวัยเจริญพันธุ์ที่มีปวดท้องน้อย + เลือดออกทางช่องคลอด + ขาดประจำเดือน ต้องคิดถึง ectopic pregnancy ก่อนเสมอจนกว่าจะ rule out ได้ เพราะเป็นภาวะฉุกเฉินที่อันตรายถึงชีวิต',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 4,
        type: 'investigation',
        question: 'จะส่งตรวจอะไรบ้าง?',
        hints: ['การตรวจยืนยันการตั้งครรภ์', 'Imaging ที่เหมาะสม'],
        expectedAnswers: [
          'Urine pregnancy test',
          'Serum beta-hCG',
          'CBC',
          'Blood type and crossmatch',
          'Transvaginal ultrasound',
          'Coagulation profile'
        ],
        keyPoints: [
          'UPT เป็นการตรวจแรกที่ต้องทำ',
          'Transvaginal US ดีกว่า transabdominal ใน early pregnancy'
        ],
        revealText: 'ผลตรวจ:\n- UPT: Positive\n- Serum beta-hCG: 2,500 mIU/mL\n- CBC: Hb 10.5 g/dL, Hct 32%, WBC 9,000\n- Blood group: B Rh+\n- TVUS: Empty uterus, right adnexal complex mass 3.2 cm with peripheral vascularity, moderate free fluid in cul-de-sac\n- PT/INR ปกติ',
        explanation: 'beta-hCG > 1,500-2,000 mIU/mL (discriminatory level) แต่ TVUS ไม่เห็น intrauterine pregnancy → สงสัย ectopic pregnancy สูงมาก Free fluid ใน cul-de-sac อาจบ่งบอกว่ามีเลือดออกในช่องท้อง',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 5,
        type: 'diagnosis',
        question: 'วินิจฉัยสุดท้ายคืออะไร?',
        hints: ['รวมข้อมูลทั้งหมดที่ได้'],
        expectedAnswers: [
          'Ectopic pregnancy',
          'Right tubal ectopic pregnancy',
          'Unruptured ectopic pregnancy'
        ],
        keyPoints: [
          'ระบุตำแหน่ง (tubal) ได้ยิ่งดี'
        ],
        revealText: 'Final Diagnosis: Right tubal ectopic pregnancy (unruptured)\n\nเหตุผล: ขาดประจำเดือน 7 สัปดาห์ + UPT positive + beta-hCG above discriminatory level + empty uterus on TVUS + right adnexal mass + risk factor (hx PID)',
        explanation: 'การวินิจฉัย ectopic pregnancy อาศัย triad: ขาดประจำเดือน + ปวดท้องน้อย + เลือดออกทางช่องคลอด ร่วมกับ positive pregnancy test และ TVUS ไม่เห็น IUP',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 6,
        type: 'treatment',
        question: 'จะรักษาอย่างไร?',
        hints: ['พิจารณาทั้ง medical และ surgical options'],
        expectedAnswers: [
          'Methotrexate (ถ้า hemodynamically stable, unruptured, beta-hCG < 5000)',
          'Laparoscopic salpingostomy หรือ salpingectomy',
          'IV fluid resuscitation',
          'Monitor vital signs',
          'Blood crossmatch เตรียมเลือด',
          'Anti-D immunoglobulin ถ้า Rh negative',
          'Follow-up beta-hCG'
        ],
        keyPoints: [
          'Hemodynamically stable → อาจให้ Methotrexate ได้',
          'ถ้า unstable หรือ ruptured → surgical emergency',
          'ต้อง follow beta-hCG จนเป็น 0'
        ],
        revealText: 'แผนการรักษา:\n1. Admit, IV fluid, monitor V/S q 1 hr\n2. เนื่องจาก hemodynamically borderline (BP 100/70, PR 100) + free fluid → consult OB-GYN for laparoscopic salpingostomy\n3. Crossmatch PRC 2 units\n4. Post-op: follow serial beta-hCG weekly จนเป็น 0\n5. Contraception counseling 3-6 months\n6. Patient ไม่ได้เป็น Rh negative จึงไม่ต้องให้ Anti-D',
        explanation: 'ผู้ป่วยรายนี้ hemodynamic borderline + มี free fluid → เลือก surgical management แม้ว่า beta-hCG < 5000 ก็ตาม ถ้า stable มากกว่านี้อาจพิจารณา methotrexate ได้ การ follow beta-hCG สำคัญมากเพื่อดูว่าไม่มี persistent ectopic',
        scoring: { maxPoints: 10, partialCredit: true }
      }
    ]
  },

  // ─── Case 2: Acute STEMI ───
  {
    title: 'ชาย 55 ปี เจ็บหน้าอก',
    scenario: 'ชายไทย อายุ 55 ปี มาห้องฉุกเฉินด้วยอาการเจ็บแน่นหน้าอกกลางๆ เป็นมา 2 ชั่วโมง ร้าวไปแขนซ้าย เหงื่อแตก คลื่นไส้ มีโรคประจำตัวเบาหวาน ความดันสูง สูบบุหรี่ 20 มวน/วัน มา 30 ปี',
    category: 'Cardio',
    difficulty: 'medium',
    tags: ['STEMI', 'acute MI', 'chest pain', 'ACS'],
    estimatedMinutes: 15,
    isPublished: true,
    steps: [
      {
        order: 1,
        type: 'history',
        question: 'จะซักประวัติอะไรเพิ่มเติมบ้าง?',
        hints: ['ลักษณะอาการเจ็บหน้าอก', 'Risk factors'],
        expectedAnswers: [
          'ลักษณะเจ็บหน้าอก: แน่น บีบ กด',
          'ระยะเวลา onset duration',
          'ปัจจัยที่ทำให้ดีขึ้นหรือแย่ลง',
          'อาการร่วม: เหงื่อแตก คลื่นไส้ หอบเหนื่อย',
          'ประวัติยาที่ใช้ ยา DM ยา HT',
          'ประวัติครอบครัว โรคหัวใจ',
          'ประวัติ dyslipidemia'
        ],
        keyPoints: [
          'Typical chest pain: แน่นเหมือนช้างนั่งทับ ร้าวแขนซ้าย',
          'Multiple cardiac risk factors'
        ],
        revealText: 'เจ็บแน่นหน้าอกเหมือนมีอะไรกดทับ ร้าวไปแขนซ้ายและคาง เป็นมา 2 ชั่วโมง ไม่ดีขึ้นเมื่อพัก อมยาใต้ลิ้น (NTG ที่มีอยู่) ไม่ดีขึ้น เหงื่อแตก คลื่นไส้ไม่อาเจียน ยาที่ใช้: Metformin, Amlodipine, Enalapril พ่อเสียด้วยโรคหัวใจอายุ 60 ปี ไม่เคยตรวจไขมัน',
        explanation: 'Typical anginal chest pain ร่วมกับ multiple risk factors (อายุ > 45 ชาย, DM, HT, smoking 30 pack-years, family history) → ต้องนึกถึง ACS เป็นอันดับแรก NTG ไม่ดีขึ้นเพิ่มความสงสัย MI',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 2,
        type: 'examination',
        question: 'จะตรวจร่างกายอะไรบ้าง?',
        hints: ['CV exam เป็นหลัก', 'ดู signs of heart failure'],
        expectedAnswers: [
          'Vital signs: BP ทั้ง 2 แขน, PR, RR, O2 sat',
          'Cardiovascular: heart sounds, murmur, JVP',
          'Lungs: crackles (pulmonary edema)',
          'Extremities: peripheral perfusion, edema',
          'General: diaphoresis, distress'
        ],
        keyPoints: [
          'วัด BP ทั้ง 2 แขน เพื่อ rule out aortic dissection',
          'ฟัง S3/S4 gallop'
        ],
        revealText: 'V/S: BP 150/95 (ทั้ง 2 แขนใกล้เคียงกัน), PR 95, RR 22, O2 sat 95% RA, T 37.0°C\nGA: Anxious, diaphoretic\nCVS: S1S2 normal, S4 gallop (+), no murmur, JVP ไม่สูง\nLungs: Bibasal fine crackles\nExtremities: warm, no edema, CRT < 2 sec',
        explanation: 'S4 gallop บ่งบอก diastolic dysfunction (stiff ventricle จาก ischemia) Bibasal crackles อาจเป็น early pulmonary congestion BP สูงเป็น sympathetic response ต่อ pain และ ischemia O2 sat 95% ยังพอรับได้แต่ต้อง monitor',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 3,
        type: 'investigation',
        question: 'จะส่ง ECG ทันที — อ่านผล ECG: Sinus rhythm, rate 95, ST elevation V1-V4, reciprocal ST depression II, III, aVF\n\nจะส่งตรวจอะไรเพิ่มเติม?',
        hints: ['Cardiac biomarkers', 'Baseline labs'],
        expectedAnswers: [
          'Troponin I หรือ high-sensitivity troponin',
          'CBC',
          'BUN/Cr/electrolytes',
          'Coagulation profile (PT, aPTT)',
          'Lipid profile',
          'CXR portable',
          'Blood glucose',
          'CK-MB'
        ],
        keyPoints: [
          'Troponin เป็น biomarker ที่สำคัญที่สุด',
          'ECG: ST elevation V1-V4 = anterior STEMI'
        ],
        revealText: 'ผลตรวจ:\n- Troponin I: 5.2 ng/mL (สูงมาก, ปกติ < 0.04)\n- CBC: Hb 14, WBC 12,000 (stress response)\n- Cr 1.0, K 4.2, Na 140\n- Glucose 250 mg/dL (uncontrolled DM + stress)\n- CXR: mild pulmonary congestion, normal heart size\n- PT/INR ปกติ',
        explanation: 'ST elevation V1-V4 บ่งบอก anterior wall STEMI (LAD territory) Troponin สูงมากยืนยัน myocardial injury Reciprocal changes (ST depression inferior leads) เพิ่มความจำเพาะของ STEMI diagnosis',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 4,
        type: 'ddx',
        question: 'Differential diagnosis ของ ST elevation คืออะไรบ้าง?',
        hints: ['ไม่ใช่ทุก ST elevation จะเป็น MI'],
        expectedAnswers: [
          'STEMI (acute MI)',
          'Pericarditis',
          'Aortic dissection',
          'Takotsubo cardiomyopathy',
          'Left ventricular aneurysm',
          'Early repolarization (benign)'
        ],
        keyPoints: [
          'STEMI เป็น most likely ในผู้ป่วยรายนี้',
          'ต้อง rule out aortic dissection ก่อนให้ anticoagulant'
        ],
        revealText: 'DDx ของ ST elevation:\n1. Acute STEMI — most likely (typical chest pain + risk factors + regional ST elevation with reciprocal changes + high troponin)\n2. Acute pericarditis — diffuse ST elevation, saddle-shaped, PR depression\n3. Aortic dissection — BP difference between arms, tearing pain\n4. Takotsubo — emotional trigger, apical ballooning\n5. LV aneurysm — persistent ST elevation, history of old MI',
        explanation: 'Regional ST elevation (V1-V4) with reciprocal changes เป็น pattern ที่ specific มากสำหรับ acute STEMI ต่างจาก pericarditis ที่จะเป็น diffuse BP ทั้ง 2 แขนใกล้เคียงกัน ช่วย rule out aortic dissection',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 5,
        type: 'diagnosis',
        question: 'วินิจฉัยสุดท้ายคืออะไร?',
        hints: ['ระบุ type และ territory'],
        expectedAnswers: [
          'Acute anterior STEMI',
          'Acute ST-elevation myocardial infarction anterior wall',
          'Acute MI anterior wall'
        ],
        keyPoints: [
          'ระบุ anterior wall (LAD territory)',
          'Killip class II (มี crackles)'
        ],
        revealText: 'Final Diagnosis: Acute anterior STEMI (LAD territory), Killip class II\n\nUnderlying: DM type 2 uncontrolled, Hypertension, Heavy smoking\n\nเหตุผล: Typical chest pain > 20 min + ST elevation V1-V4 + elevated troponin + cardiac risk factors',
        explanation: 'Killip classification ช่วยประเมิน severity:\n- Class I: ไม่มี heart failure signs\n- Class II: crackles, S3, JVP สูง\n- Class III: pulmonary edema\n- Class IV: cardiogenic shock\nผู้ป่วยมี bibasal crackles → Killip II',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 6,
        type: 'treatment',
        question: 'จะรักษาอย่างไร? (ทั้ง immediate management และ definitive treatment)',
        hints: ['MONA', 'Reperfusion therapy'],
        expectedAnswers: [
          'Aspirin 300 mg เคี้ยว',
          'Clopidogrel 600 mg หรือ Ticagrelor 180 mg loading',
          'Heparin (UFH หรือ Enoxaparin)',
          'Morphine ถ้าปวดมาก (ระวังในผู้ป่วยที่ hypotension)',
          'Oxygen ถ้า O2 sat < 94%',
          'Nitrate ถ้า BP ดีพอ (SBP > 90)',
          'Primary PCI ภายใน 90-120 นาที (door-to-balloon)',
          'ถ้าไม่สามารถทำ PCI ได้ทัน → Fibrinolytic (Streptokinase/Tenecteplase)',
          'Statin high intensity (Atorvastatin 80 mg)',
          'Beta-blocker (เมื่อ stable)'
        ],
        keyPoints: [
          'Primary PCI เป็น gold standard — door-to-balloon < 90 นาที',
          'DAPT (Dual antiplatelet) สำคัญมาก',
          'Fibrinolytic เป็น alternative ถ้า PCI ไม่ available ภายใน 120 นาที'
        ],
        revealText: 'แผนการรักษา:\n1. IMMEDIATE:\n   - Aspirin 300 mg เคี้ยว STAT\n   - Ticagrelor 180 mg loading\n   - UFH 60 U/kg bolus (max 4000 U)\n   - NTG sublingual → IV drip ถ้ายังเจ็บ (BP > 90)\n   - Morphine 2-4 mg IV ถ้าปวดมาก\n   - O2 via nasal cannula (sat 95%)\n\n2. DEFINITIVE: Activate cath lab → Primary PCI\n   - Door-to-balloon target < 90 min\n\n3. POST-PCI:\n   - DAPT 12 months (ASA + Ticagrelor)\n   - Atorvastatin 80 mg\n   - Metoprolol (เมื่อ stable)\n   - ACEi (already on Enalapril)\n   - DM control\n   - Smoking cessation\n   - Cardiac rehabilitation',
        explanation: 'Primary PCI เป็น reperfusion strategy ที่ดีที่สุดสำหรับ STEMI ถ้า available ภายใน 90-120 นาที Time is muscle — ยิ่งเร็วยิ่งดี การให้ DAPT loading ก่อน PCI สำคัญมาก',
        scoring: { maxPoints: 10, partialCredit: true }
      }
    ]
  },

  // ─── Case 3: Acute Appendicitis ───
  {
    title: 'ชาย 25 ปี ปวดท้องขวาล่าง',
    scenario: 'ชายไทย อายุ 25 ปี สุขภาพแข็งแรงดี มาห้องฉุกเฉินด้วยอาการปวดท้อง เริ่มปวดรอบสะดือเมื่อ 12 ชั่วโมงก่อน ต่อมาย้ายมาปวดท้องขวาล่าง ปวดมากขึ้นเรื่อยๆ มีคลื่นไส้ เบื่ออาหาร ไม่อยากกิน',
    category: 'Surgery',
    difficulty: 'easy',
    tags: ['appendicitis', 'acute abdomen', 'RLQ pain'],
    estimatedMinutes: 12,
    isPublished: true,
    steps: [
      {
        order: 1,
        type: 'history',
        question: 'จะซักประวัติอะไรเพิ่มเติมบ้าง?',
        hints: ['Migration of pain สำคัญมาก', 'GI symptoms'],
        expectedAnswers: [
          'ลักษณะปวด: เริ่มที่สะดือ → ย้ายไป RLQ (migratory pain)',
          'คลื่นไส้ อาเจียน (มักเกิดหลังปวด)',
          'เบื่ออาหาร anorexia',
          'การขับถ่าย ท้องผูก ท้องเสีย',
          'ไข้',
          'ประวัติอาการแบบนี้มาก่อน',
          'ประวัติ urinary symptoms (rule out UTI, renal colic)'
        ],
        keyPoints: [
          'Migratory pain (periumbilical → RLQ) เป็น classic ของ appendicitis',
          'Anorexia มักมาก่อนอาเจียน'
        ],
        revealText: 'ปวดเริ่มที่รอบสะดือ ปวดตื้อๆ 12 ชม.ก่อน → ย้ายมาปวดท้องขวาล่างชัดเจน 6 ชม.ก่อน คลื่นไส้ อาเจียน 1 ครั้ง (หลังปวดท้อง) เบื่ออาหารมาตั้งแต่เริ่มปวด ไม่มีท้องเสีย ถ่ายปกติ ไม่มีอาการปัสสาวะแสบขัด ไม่เคยเป็นแบบนี้ มีไข้ต่ำๆ',
        explanation: 'Sequence สำคัญ: Pain → Anorexia → Nausea/Vomiting (Murphy\'s sequence) เป็น classic ของ acute appendicitis Migratory pain เกิดจากการอักเสบของ visceral peritoneum (periumbilical) → somatic peritoneum (RLQ localized)',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 2,
        type: 'examination',
        question: 'จะตรวจร่างกายอะไรบ้าง? และคาดว่าจะพบอะไร?',
        hints: ['Special signs ของ appendicitis', 'DRE'],
        expectedAnswers: [
          'Vital signs',
          'RLQ tenderness (McBurney\'s point)',
          'Rebound tenderness',
          'Rovsing\'s sign',
          'Psoas sign',
          'Obturator sign',
          'Guarding / rigidity',
          'DRE (digital rectal examination)'
        ],
        keyPoints: [
          'McBurney\'s point = junction of lateral 1/3 and medial 2/3 ของเส้นจากสะดือถึง ASIS',
          'Rebound tenderness บ่งบอก peritoneal irritation'
        ],
        revealText: 'V/S: BP 125/80, PR 92, RR 18, T 38.2°C\nAbdomen:\n- Inspection: ท้องไม่อืด นอนนิ่งไม่อยากขยับ\n- Palpation: Tenderness RLQ maximal at McBurney\'s point, guarding (+), rebound tenderness (+)\n- Rovsing\'s sign: Positive (กด LLQ ปวด RLQ)\n- Psoas sign: Positive (ปวดเมื่อ extend right hip)\n- Obturator sign: Negative\n- DRE: Right-sided tenderness',
        explanation: 'McBurney\'s point tenderness + rebound + Rovsing\'s sign positive → highly suggestive ของ acute appendicitis Psoas sign positive บ่งบอกว่า appendix อาจอยู่ retrocecal Low-grade fever (38.2°C) เป็น typical finding ถ้าไข้สูงมากอาจ perforate แล้ว',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 3,
        type: 'ddx',
        question: 'Differential diagnosis คืออะไรบ้าง?',
        hints: ['คิดทั้ง surgical และ medical causes ของ RLQ pain'],
        expectedAnswers: [
          'Acute appendicitis',
          'Mesenteric lymphadenitis',
          'Meckel\'s diverticulitis',
          'Right ureteric colic',
          'Crohn\'s disease (terminal ileum)',
          'Cecal diverticulitis'
        ],
        keyPoints: [
          'Acute appendicitis เป็น most common surgical emergency'
        ],
        revealText: 'DDx:\n1. Acute appendicitis — most likely (classic presentation)\n2. Mesenteric lymphadenitis — มักมีประวัติ URTI นำ พบในเด็ก\n3. Meckel\'s diverticulitis — rare, mimics appendicitis\n4. Right ureteric colic — colicky pain, hematuria\n5. Crohn\'s disease — chronic history, diarrhea\n6. Cecal diverticulitis — older age group',
        explanation: 'ในชายหนุ่มที่มี classic migratory pain + McBurney\'s tenderness + peritoneal signs → appendicitis เป็น diagnosis อันดับ 1 เสมอ Alvarado score ช่วยประเมิน probability ได้',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 4,
        type: 'investigation',
        question: 'จะส่งตรวจอะไรบ้าง?',
        hints: ['Lab + Imaging', 'Alvarado score'],
        expectedAnswers: [
          'CBC (WBC count, neutrophilia)',
          'UA (rule out UTI, renal colic)',
          'CRP',
          'US abdomen (appendix diameter, free fluid)',
          'CT abdomen (ถ้า US inconclusive)',
          'BUN/Cr/electrolytes'
        ],
        keyPoints: [
          'WBC > 10,000 + left shift สนับสนุน appendicitis',
          'US: appendix diameter > 6 mm, non-compressible'
        ],
        revealText: 'ผลตรวจ:\n- CBC: WBC 14,500 (neutrophil 85%)\n- CRP: 45 mg/L (สูง)\n- UA: Normal (rule out UTI/stone)\n- US abdomen: Non-compressible tubular structure at RLQ, diameter 9 mm, surrounding fat stranding, minimal free fluid\n- Cr 0.9, electrolytes ปกติ\n\nAlvarado Score: 9/10 (migratory pain 1, anorexia 1, nausea 1, RLQ tenderness 2, rebound 1, temp > 37.3 = 1, WBC > 10K = 2)',
        explanation: 'US พบ appendix diameter 9 mm (> 6 mm = abnormal), non-compressible, มี fat stranding → highly suggestive Alvarado score >= 7 → high probability of appendicitis ถ้า US inconclusive อาจต้อง CT scan',
        scoring: { maxPoints: 10, partialCredit: true }
      },
      {
        order: 5,
        type: 'treatment',
        question: 'จะรักษาอย่างไร?',
        hints: ['Surgical vs conservative', 'Pre-op preparation'],
        expectedAnswers: [
          'NPO',
          'IV fluid resuscitation',
          'IV antibiotics (Ceftriaxone + Metronidazole หรือ Piperacillin-Tazobactam)',
          'Pain management (IV paracetamol, opioid ถ้าจำเป็น)',
          'Appendectomy (laparoscopic preferred)',
          'Consent for surgery'
        ],
        keyPoints: [
          'Laparoscopic appendectomy เป็น standard of care',
          'IV antibiotics ก่อนผ่าตัดลด surgical site infection',
          'ไม่ต้องกลัวให้ยาแก้ปวด — ไม่ mask physical findings ใน era ของ imaging'
        ],
        revealText: 'แผนการรักษา:\n1. NPO, IV NSS 1000 mL load\n2. IV Ceftriaxone 2 g + IV Metronidazole 500 mg (pre-op prophylaxis)\n3. IV Paracetamol 1 g\n4. Consult surgeon → Laparoscopic appendectomy\n5. Inform consent\n\nPost-op:\n- IV antibiotics 24 ชม. (ถ้าไม่ perforate)\n- Early oral intake เมื่อ bowel sounds กลับ\n- Ambulation early\n- Discharge 1-2 วัน (ถ้า laparoscopic, uncomplicated)',
        explanation: 'Laparoscopic appendectomy มีข้อดีกว่า open: แผลเล็ก ฟื้นตัวเร็ว ปวดน้อยกว่า cosmetically ดีกว่า IV antibiotics ก่อนผ่าตัดเป็น standard practice ลด wound infection ปัจจุบันไม่จำเป็นต้อง withhold pain medication ก่อนประเมิน',
        scoring: { maxPoints: 10, partialCredit: true }
      }
    ]
  }
]

/**
 * Seed sample cases into database
 * ใช้ตอน initial setup หรือ development
 */
async function seedSampleCases() {
  const MeqCase = require('./MeqCase.model')

  const existing = await MeqCase.countDocuments()
  if (existing > 0) {
    console.log(`[MEQ Seed] Already have ${existing} cases — skip seeding`)
    return
  }

  for (const caseData of sampleCases) {
    const meqCase = new MeqCase(caseData)
    await meqCase.save()
    console.log(`[MEQ Seed] Created: ${caseData.title}`)
  }
  console.log(`[MEQ Seed] Done — seeded ${sampleCases.length} cases`)
}

module.exports = { sampleCases, seedSampleCases }
