/**
 * NINJA DDx — Comprehensive DDx Data for NL2
 * ข้อมูล Differential Diagnosis + Treatment ครบทุกอาการ สำหรับเตรียมสอบ NL2
 *
 * โครงสร้าง:
 *   category > symptoms > differentials
 *   แต่ละ differential มี:
 *     - keyClues, redFlags, investigation, examTip, frequency (วินิจฉัย)
 *     - treatment: แนวทางรักษา
 *     - firstLine: ยาตัวแรก / การรักษาหลัก
 *     - dontMiss: สิ่งที่ห้ามลืมทำ / ข้อห้าม
 */

const categories = [
  // ═══════════════════════════════════════════
  // 1. GI — ระบบทางเดินอาหาร
  // ═══════════════════════════════════════════
  {
    code: 'GI',
    name: 'ระบบทางเดินอาหาร',
    nameEn: 'Gastrointestinal',
    icon: '🫄',
    color: '#f59e0b',
    description: 'โรคเกี่ยวกับกระเพาะ ลำไส้ ตับ ตับอ่อน ถุงน้ำดี',
    symptoms: [
      {
        name: 'ปวดท้อง',
        nameEn: 'Abdominal Pain',
        differentials: [
          {
            diagnosis: 'Appendicitis', diagnosisTh: 'ไส้ติ่งอักเสบ', frequency: 'high',
            keyClues: ['ปวดรอบสะดือ → ย้ายไปท้องขวาล่าง (RLQ)', "McBurney's point tenderness", 'ไข้ต่ำๆ คลื่นไส้ เบื่ออาหาร', 'Rebound tenderness'],
            redFlags: ['ท้องแข็ง (Peritonitis)', 'ไส้ติ่งแตก (Perforation)'],
            investigation: ['CBC (WBC สูง)', 'CT abdomen', 'Alvarado score'],
            treatment: 'ผ่าตัด Appendectomy (laparoscopic) + ATB ก่อนผ่าตัด',
            firstLine: 'Appendectomy (ผ่าตัดไส้ติ่ง)',
            dontMiss: 'ห้ามให้ยาระบาย! ห้ามสวนท้อง! อาจทำไส้ติ่งแตก',
            examTip: '"ปวดรอบสะดือแล้วย้ายไปท้องขวาล่าง" → Appendicitis ทันที'
          },
          {
            diagnosis: 'Acute Pancreatitis', diagnosisTh: 'ตับอ่อนอักเสบ', frequency: 'high',
            keyClues: ['ปวดท้องตรงกลาง (epigastric) ร้าวไปหลัง', 'ดื่มเหล้าจัด / มีนิ่วในถุงน้ำดี', 'นั่งงอตัวแล้วดีขึ้น'],
            redFlags: ['ตับอ่อนเลือดออก (Hemorrhagic)', "Grey Turner's sign (ข้างลำตัวเขียว)", "Cullen's sign (รอบสะดือเขียว)"],
            investigation: ['Amylase / Lipase สูง > 3 เท่า', 'CT abdomen', 'Ranson criteria / APACHE II'],
            treatment: 'NPO (งดอาหาร) + IV fluid + Pain control + รักษาสาเหตุ',
            firstLine: 'IV fluid resuscitation + Morphine/Meperidine',
            dontMiss: 'ห้ามให้กิน! NPO จนกว่าจะดีขึ้น',
            examTip: '"ดื่มเหล้า + ปวดร้าวหลัง" = Pancreatitis แทบ 100%'
          },
          {
            diagnosis: 'Cholecystitis', diagnosisTh: 'ถุงน้ำดีอักเสบ', frequency: 'high',
            keyClues: ['ปวดท้องขวาบน (RUQ) หลังกินมัน', "Murphy's sign (+) = กดท้องขวาบนขณะหายใจเข้า → เจ็บจนหยุดหายใจ", 'Female, Fat, Forty, Fertile (4F)'],
            redFlags: ['Charcot triad (ไข้ + ตัวเหลือง + ปวด RUQ) = Cholangitis', 'ถุงน้ำดีแตก'],
            investigation: ['US abdomen (นิ่ว + ผนังถุงน้ำดีหนา)', 'LFT', 'CBC'],
            treatment: 'ATB + Cholecystectomy (ผ่าตัดถุงน้ำดี) ภายใน 72 ชม.',
            firstLine: 'Cholecystectomy (laparoscopic)',
            dontMiss: 'Charcot triad = Cholangitis → ERCP ด่วน ไม่ใช่แค่ผ่าตัด',
            examTip: "Murphy's sign ออกสอบทุกปี! = ถุงน้ำดี"
          },
          {
            diagnosis: 'Bowel Obstruction', diagnosisTh: 'ลำไส้อุดตัน', frequency: 'high',
            keyClues: ['ปวดบิดเป็นพักๆ (colicky)', 'อาเจียน + ท้องอืด + ไม่ผายลม', 'เคยผ่าตัดท้อง (adhesion/พังผืด)'],
            redFlags: ['ลำไส้บิดขาดเลือด (Strangulation)', 'Closed-loop obstruction'],
            investigation: ['X-ray ท้อง (air-fluid levels)', 'CT abdomen'],
            treatment: 'NPO + NG decompression + IV fluid + แก้ electrolyte',
            firstLine: 'Conservative (NGT + IV fluid) ถ้าไม่มี strangulation',
            dontMiss: 'Strangulation signs → ผ่าตัดด่วน! ห้ามรอ',
            examTip: 'อาเจียนกลิ่นอุจจาระ (feculent) = ลำไส้อุดตัน'
          },
          {
            diagnosis: 'Peptic Ulcer Perforation', diagnosisTh: 'แผลกระเพาะทะลุ', frequency: 'high',
            keyClues: ['ปวดท้องรุนแรงเฉียบพลัน (sudden onset)', 'ท้องแข็งเป็นไม้กระดาน (board-like rigidity)', 'ประวัติกินยาแก้ปวด NSAIDs'],
            redFlags: ['Peritonitis', 'Septic shock'],
            investigation: ['X-ray ท้องตั้ง (free air under diaphragm)', 'CT abdomen'],
            treatment: 'ผ่าตัดซ่อม (Graham patch) + ATB + PPI',
            firstLine: 'Emergency surgery',
            dontMiss: 'ห้ามให้กิน! ห้ามให้ barium study!',
            examTip: '"ปวดท้องทันที + ท้องแข็งเป็นไม้กระดาน" → Perforation'
          },
          {
            diagnosis: 'Ectopic Pregnancy', diagnosisTh: 'ท้องนอกมดลูก', frequency: 'high',
            keyClues: ['ผู้หญิงวัยเจริญพันธุ์', 'ปวดท้องน้อย + ประจำเดือนขาด', 'เลือดออกทางช่องคลอด'],
            redFlags: ['ท่อนำไข่แตก → ช็อค → ตาย!'],
            investigation: ['Urine pregnancy test (ทำก่อนเสมอ!)', 'Serum beta-hCG', 'Transvaginal US'],
            treatment: 'Methotrexate (stable) หรือ Salpingectomy (unstable/ruptured)',
            firstLine: 'Methotrexate (ถ้า stable + hCG < 5,000)',
            dontMiss: 'Ruptured + shock → ผ่าตัดด่วน! ให้ IV fluid + blood',
            examTip: 'ผู้หญิงวัยเจริญพันธุ์ปวดท้อง → ต้อง pregnancy test ก่อนเสมอ!'
          },
          {
            diagnosis: 'Ureterolithiasis', diagnosisTh: 'นิ่วท่อไต', frequency: 'med',
            keyClues: ['ปวดท้องข้างเดียว ร้าวไปขาหนีบ (colicky)', 'ปวดมาก ทนไม่ได้ นั่งไม่ติด', 'ปัสสาวะเป็นเลือด (hematuria)'],
            redFlags: ['ไข้ร่วม = ติดเชื้อ (Urosepsis)', 'ไตบวมน้ำ (Hydronephrosis)'],
            investigation: ['UA (RBC)', 'CT KUB (non-contrast)', 'US KUB'],
            treatment: 'NSAIDs pain control + IV fluid + alpha-blocker (MET) ถ้า < 10mm',
            firstLine: 'Diclofenac / Ketorolac (NSAIDs) สำหรับแก้ปวด',
            dontMiss: 'ไข้ + นิ่ว = Obstructive pyelonephritis → urology consult ด่วน!',
            examTip: '"ปวดท้องข้าง ร้าวไปขาหนีบ + ปัสสาวะเป็นเลือด" = นิ่ว'
          },
          {
            diagnosis: 'Mesenteric Ischemia', diagnosisTh: 'ลำไส้ขาดเลือด', frequency: 'med',
            keyClues: ['ผู้สูงอายุ + AF (หัวใจเต้นผิดจังหวะ)', 'ปวดท้องรุนแรง แต่ตรวจท้องไม่ค่อยเจออะไร (pain out of proportion)', 'ถ่ายเป็นเลือด'],
            redFlags: ['ลำไส้ตาย (Gangrene)', 'Sepsis'],
            investigation: ['CT angiography', 'Lactate สูง', 'D-dimer'],
            treatment: 'Emergency surgery (resection ลำไส้ตาย) + anticoagulation',
            firstLine: 'Emergency laparotomy + embolectomy/resection',
            dontMiss: 'Time is bowel! ยิ่งช้า ลำไส้ตายมากขึ้น',
            examTip: '"คนแก่ + AF + ปวดท้องมากแต่ตรวจไม่เจอ" → Mesenteric ischemia'
          },
          {
            diagnosis: 'Abdominal Aortic Aneurysm (AAA)', diagnosisTh: 'หลอดเลือดแดงใหญ่ในท้องโป่งพอง', frequency: 'low',
            keyClues: ['ชายสูงอายุ สูบบุหรี่', 'ปวดท้อง/หลัง ทันที', 'คลำก้อนเต้นตามชีพจร (pulsatile mass) กลางท้อง'],
            redFlags: ['ช็อค + ปวดท้อง/หลัง = ruptured AAA → ตายเร็ว!'],
            investigation: ['CT angiography (ด่วน)', 'US abdomen (screening)'],
            treatment: 'Ruptured → Emergency open repair / EVAR',
            firstLine: 'Emergency surgery (open repair หรือ EVAR)',
            dontMiss: 'Ruptured AAA → ห้ามรอ CT! เปิดท้องเลย ถ้า hemodynamic unstable',
            examTip: '"ชายแก่ + ปวดท้อง/หลังทันที + BP ต่ำ" → AAA rupture'
          }
        ]
      },
      {
        name: 'อาเจียนเป็นเลือด',
        nameEn: 'Hematemesis (Upper GI Bleeding)',
        differentials: [
          {
            diagnosis: 'Peptic Ulcer', diagnosisTh: 'แผลในกระเพาะ/ลำไส้เล็ก', frequency: 'high',
            keyClues: ['ประวัติกิน NSAIDs หรือ steroid', 'ปวดท้อง epigastric แสบๆ', 'H. pylori infection'],
            redFlags: ['เลือดออกไม่หยุด', 'ช็อค (BP ต่ำ, ชีพจรเร็ว)'],
            investigation: ['EGD (ส่องกล้องกระเพาะ)', 'CBC + BUN/Cr', 'H. pylori test'],
            treatment: 'PPI IV high-dose + EGD ทำ hemostasis + H. pylori eradication',
            firstLine: 'IV Omeprazole 80mg bolus → 8mg/hr drip',
            dontMiss: 'ถ้า H. pylori (+) → triple therapy: PPI + Amoxicillin + Clarithromycin 14 วัน',
            examTip: 'Upper GI bleed สาเหตุบ่อยสุด = Peptic ulcer (50-70%)'
          },
          {
            diagnosis: 'Esophageal Varices', diagnosisTh: 'หลอดเลือดขอดหลอดอาหาร', frequency: 'high',
            keyClues: ['ตับแข็ง (Cirrhosis)', 'อาเจียนเลือดสดจำนวนมาก', 'ม้ามโต ท้องมาน ตัวเหลือง'],
            redFlags: ['เลือดออกมาก → ช็อค', 'ตับวาย'],
            investigation: ['EGD (ด่วน — ส่องกล้อง + รัดเส้นเลือด)', 'CBC, Coagulation', 'LFT'],
            treatment: 'Octreotide/Terlipressin + EGD band ligation + ATB prophylaxis',
            firstLine: 'Octreotide IV + Emergency EGD band ligation',
            dontMiss: 'ให้ ATB prophylaxis (Ceftriaxone) ทุกครั้ง! ลด mortality',
            examTip: '"ตับแข็ง + อาเจียนเลือด" → Variceal bleeding ทันที'
          },
          {
            diagnosis: 'Mallory-Weiss Tear', diagnosisTh: 'หลอดอาหารฉีกขาดจากอาเจียน', frequency: 'med',
            keyClues: ['อาเจียนรุนแรงก่อน → แล้วค่อยมีเลือด', 'ดื่มเหล้ามากก่อนอาเจียน', 'เลือดออกไม่มาก มักหยุดเอง'],
            redFlags: ['เลือดออกไม่หยุด (หายาก)'],
            investigation: ['EGD (เห็นรอยฉีกที่ GE junction)'],
            treatment: 'มักหยุดเอง (90%) + PPI + EGD ถ้าไม่หยุด',
            firstLine: 'Observation + PPI',
            dontMiss: 'ส่วนใหญ่หยุดเอง — อย่า panic',
            examTip: '"อาเจียนมากก่อน → แล้วค่อยมีเลือดปน" → Mallory-Weiss'
          },
          {
            diagnosis: 'Gastric Cancer', diagnosisTh: 'มะเร็งกระเพาะ', frequency: 'med',
            keyClues: ['น้ำหนักลด เบื่ออาหาร', 'อิ่มเร็ว (early satiety)', 'อายุมาก + ซีดเรื้อรัง'],
            redFlags: ['ก้อนในท้อง', 'ต่อมน้ำเหลืองโต'],
            investigation: ['EGD + biopsy', 'CT abdomen (staging)'],
            treatment: 'Surgery (gastrectomy) ± chemo ± radiation',
            firstLine: 'Surgical resection (curative)',
            dontMiss: 'อย่าลืม staging ก่อนผ่าตัด (CT + EUS)',
            examTip: 'คนแก่ + น้ำหนักลด + อาเจียนเลือดซ้ำๆ → ต้องแยก CA gastric'
          }
        ]
      },
      {
        name: 'ตัวเหลืองตาเหลือง',
        nameEn: 'Jaundice',
        differentials: [
          {
            diagnosis: 'Hepatitis', diagnosisTh: 'ตับอักเสบ', frequency: 'high',
            keyClues: ['ไข้ เบื่ออาหาร คลื่นไส้ → แล้วตัวเหลือง', 'AST/ALT สูงมาก (>1,000)', 'ประวัติเสี่ยง: เข็ม, เลือด, เพศสัมพันธ์, อาหาร'],
            redFlags: ['ตับวายเฉียบพลัน (Acute liver failure)', 'INR สูง + สับสน (Encephalopathy)'],
            investigation: ['LFT (AST/ALT สูงมาก)', 'Viral markers (HBsAg, Anti-HCV, Anti-HAV IgM)', 'PT/INR'],
            treatment: 'Supportive care + รักษาตามสาเหตุ (antiviral ถ้า viral)',
            firstLine: 'Supportive (พัก + hydration) / Tenofovir/Entecavir (HBV) / DAA (HCV)',
            dontMiss: 'Acute liver failure (INR สูง + encephalopathy) → refer ด่วน! อาจต้อง transplant',
            examTip: 'AST/ALT สูง >1,000 = Hepatocellular pattern → คิดถึง Hepatitis'
          },
          {
            diagnosis: 'Choledocholithiasis', diagnosisTh: 'นิ่วในท่อน้ำดีร่วม', frequency: 'high',
            keyClues: ['ปวดท้องขวาบน + ตัวเหลือง', 'อุจจาระสีซีด ปัสสาวะสีเข้ม', 'ALP / GGT สูง (obstructive pattern)'],
            redFlags: ['Charcot triad (ไข้ + ตัวเหลือง + ปวด) = Cholangitis', 'Reynolds pentad (+ ช็อค + สับสน)'],
            investigation: ['US abdomen (ท่อน้ำดีขยาย)', 'MRCP', 'ERCP (รักษา)'],
            treatment: 'ERCP (เอานิ่วออก) + Cholecystectomy ตามหลัง',
            firstLine: 'ERCP + sphincterotomy + stone extraction',
            dontMiss: 'Cholangitis → ATB + ERCP ภายใน 24 ชม.!',
            examTip: '"ปวดท้องขวาบน + ตัวเหลือง + ไข้" → Cholangitis ต้อง ERCP ด่วน!'
          },
          {
            diagnosis: 'Pancreatic Cancer', diagnosisTh: 'มะเร็งตับอ่อน', frequency: 'med',
            keyClues: ['ตัวเหลืองไม่เจ็บ (painless jaundice)', 'น้ำหนักลดมาก', "Courvoisier's sign (ถุงน้ำดีโตคลำได้ + ตัวเหลือง)"],
            redFlags: ['ลุกลามเร็ว', 'พบเมื่อ stage สูง'],
            investigation: ['CT abdomen (pancreatic mass)', 'CA 19-9', 'ERCP + biopsy'],
            treatment: 'Whipple procedure (ถ้า resectable) + chemo (Gemcitabine)',
            firstLine: 'Surgical resection (Whipple) ถ้า resectable (แค่ 15-20%)',
            dontMiss: 'ส่วนใหญ่พบ late stage → palliative care',
            examTip: '"ตัวเหลืองไม่เจ็บ + น้ำหนักลด + ถุงน้ำดีโต" → Pancreatic CA (Courvoisier\'s sign)'
          },
          {
            diagnosis: 'Hemolytic Anemia', diagnosisTh: 'เม็ดเลือดแดงแตก', frequency: 'med',
            keyClues: ['ซีด + ตัวเหลือง + ม้ามโต', 'Indirect bilirubin สูง (unconjugated)', 'LDH สูง, Haptoglobin ต่ำ, Reticulocyte สูง'],
            redFlags: ['Hemolytic crisis'],
            investigation: ['CBC + Reticulocyte count', 'LDH, Haptoglobin, Indirect bilirubin', 'Peripheral blood smear', 'Coombs test'],
            treatment: 'ตามสาเหตุ: Autoimmune → steroid / Transfusion ถ้า severe',
            firstLine: 'Prednisolone (autoimmune) / Folic acid supplement',
            dontMiss: 'Warm AIHA → steroid / Cold AIHA → หลีกเลี่ยงความเย็น + Rituximab',
            examTip: 'ตัวเหลือง + Indirect bili สูง + ซีด → Hemolysis (ไม่ใช่ตับ!)'
          },
          {
            diagnosis: 'Gilbert Syndrome', diagnosisTh: 'กิลเบิร์ต ซินโดรม', frequency: 'low',
            keyClues: ['คนหนุ่มสาวสุขภาพดี', 'Indirect bilirubin สูงเล็กน้อย', 'เหลืองเวลาเครียด/อดอาหาร/เจ็บป่วย → หายเอง'],
            redFlags: [],
            investigation: ['LFT ปกติหมด ยกเว้น indirect bilirubin สูงเล็กน้อย'],
            treatment: 'ไม่ต้องรักษา! Reassure ว่าไม่อันตราย',
            firstLine: 'ไม่ต้องรักษา (benign condition)',
            dontMiss: 'อย่าวินิจฉัยผิดเป็นตับอักเสบ!',
            examTip: 'คนหนุ่มสุขภาพดี + ตัวเหลืองเป็นๆ หายๆ + LFT ปกติ → Gilbert (ไม่อันตราย)'
          }
        ]
      },
      {
        name: 'ท้องเสียเรื้อรัง',
        nameEn: 'Chronic Diarrhea',
        differentials: [
          {
            diagnosis: 'Irritable Bowel Syndrome (IBS)', diagnosisTh: 'ลำไส้แปรปรวน', frequency: 'high',
            keyClues: ['ปวดท้อง + ท้องเสีย/ท้องผูกสลับกัน', 'ดีขึ้นหลังถ่าย', 'เครียดแล้วเป็นมากขึ้น', 'ตรวจไม่เจอความผิดปกติ'],
            redFlags: ['น้ำหนักลด ถ่ายเป็นเลือด ไข้ → ไม่ใช่ IBS!'],
            investigation: ['Clinical diagnosis (Rome IV criteria)', 'CBC, CRP, TSH, stool exam เพื่อ rule out อื่น'],
            treatment: 'Diet modification (low FODMAP) + stress management',
            firstLine: 'Antispasmodic (Hyoscine) + Fiber supplement',
            dontMiss: 'ต้อง rule out organic cause ก่อน! (IBD, celiac, thyroid)',
            examTip: 'IBS = diagnosis of exclusion — ต้อง rule out organic cause ก่อน'
          },
          {
            diagnosis: 'Inflammatory Bowel Disease (IBD)', diagnosisTh: 'ลำไส้อักเสบเรื้อรัง', frequency: 'high',
            keyClues: ['ท้องเสียเรื้อรัง + เลือดปน (โดยเฉพาะ UC)', 'คนอายุน้อย', 'Crohn: ปวดท้อง + fistula / UC: ถ่ายเป็นมูกเลือด'],
            redFlags: ['Toxic megacolon', 'ลำไส้ทะลุ', 'มะเร็งลำไส้'],
            investigation: ['Colonoscopy + biopsy', 'CRP, ESR, Calprotectin', 'CT/MRI enterography'],
            treatment: '5-ASA (mild UC) / Steroid (flare) / Immunomodulator / Biologic',
            firstLine: 'Mesalazine/5-ASA (mild-moderate UC) / Budesonide (mild Crohn)',
            dontMiss: 'Toxic megacolon → surgery ด่วน! Steroid ไม่ตอบใน 3-5 วัน → escalate',
            examTip: 'Crohn = skip lesions + transmural / UC = continuous + mucosal only'
          },
          {
            diagnosis: 'Celiac Disease', diagnosisTh: 'แพ้กลูเตน', frequency: 'med',
            keyClues: ['ท้องเสีย + น้ำหนักลด + ซีด', 'กินขนมปัง/wheat แล้วแย่ลง', 'ผื่น Dermatitis herpetiformis'],
            redFlags: ['ขาดสารอาหารรุนแรง'],
            investigation: ['Anti-tTG IgA', 'Duodenal biopsy (villous atrophy)'],
            treatment: 'Gluten-free diet ตลอดชีวิต',
            firstLine: 'Strict gluten-free diet',
            dontMiss: 'ต้องงดกลูเตนถาวร! แม้แค่นิดเดียวก็ทำลายลำไส้',
            examTip: '"ท้องเสียเรื้อรัง + ซีด + กินข้าวสาลีแล้วแย่" → Celiac'
          },
          {
            diagnosis: 'Hyperthyroidism', diagnosisTh: 'ไทรอยด์เป็นพิษ', frequency: 'med',
            keyClues: ['ท้องเสีย + น้ำหนักลดทั้งที่กินเยอะ', 'ใจสั่น มือสั่น เหงื่อออกมาก', 'ตาโปน คอโต'],
            redFlags: ['Thyroid storm (ไข้สูง + สับสน + ใจสั่นมาก)'],
            investigation: ['TSH ต่ำ, Free T4 สูง'],
            treatment: 'ATD (Methimazole/PTU) → RAI → Surgery',
            firstLine: 'Methimazole (first-line ATD) ยกเว้น trimester 1 → PTU',
            dontMiss: 'Thyroid storm → PTU + Beta-blocker + Steroid + Lugol\'s iodine',
            examTip: 'ท้องเสีย + น้ำหนักลด + ใจสั่น → อย่าลืม check thyroid!'
          }
        ]
      },
      {
        name: 'ถ่ายเป็นเลือด',
        nameEn: 'GI Bleeding (Lower)',
        differentials: [
          {
            diagnosis: 'Hemorrhoids', diagnosisTh: 'ริดสีดวงทวาร', frequency: 'high',
            keyClues: ['เลือดสดแดง เคลือบอุจจาระ หรือหยดหลังถ่าย', 'ไม่ปวด (internal) / ปวด (external thrombosed)', 'ท้องผูกเรื้อรัง'],
            redFlags: ['ต้อง rule out CA rectum ในคนอายุ > 50'],
            investigation: ['Digital rectal exam', 'Anoscopy / Sigmoidoscopy'],
            treatment: 'Fiber + Sitz bath + Topical (mild) / Rubber band ligation / Surgery (severe)',
            firstLine: 'Fiber supplement + Sitz bath + Topical ointment',
            dontMiss: 'อายุ > 50 + เลือดออกทางทวาร → ต้อง colonoscopy rule out CA!',
            examTip: 'เลือดสดหยดหลังถ่าย + ท้องผูก = Hemorrhoid (แต่ต้อง rule out มะเร็งในคนแก่)'
          },
          {
            diagnosis: 'Colorectal Cancer', diagnosisTh: 'มะเร็งลำไส้ใหญ่', frequency: 'high',
            keyClues: ['อุจจาระเปลี่ยนแปลง (เล็กลง, ท้องผูกสลับท้องเสีย)', 'น้ำหนักลด', 'ซีดเรื้อรัง (occult blood loss)', 'อายุ > 50'],
            redFlags: ['ลำไส้อุดตัน', 'ก้อนในท้อง'],
            investigation: ['Colonoscopy + biopsy', 'CEA', 'CT abdomen (staging)'],
            treatment: 'Surgery (colectomy) + chemo (stage III+) ± radiation (rectal)',
            firstLine: 'Surgical resection + adjuvant chemo (FOLFOX) ถ้า stage III',
            dontMiss: 'Screening colonoscopy ตั้งแต่อายุ 45-50!',
            examTip: '"คนแก่ + อุจจาระเปลี่ยน + น้ำหนักลด + ซีด" → Colorectal CA'
          },
          {
            diagnosis: 'Diverticular Bleeding', diagnosisTh: 'ถุงลำไส้โป่งพอง เลือดออก', frequency: 'med',
            keyClues: ['คนแก่ ถ่ายเป็นเลือดสดจำนวนมากทันที', 'ไม่ค่อยปวดท้อง (painless)', 'มักหยุดเอง (80%)'],
            redFlags: ['เลือดออกไม่หยุด'],
            investigation: ['Colonoscopy', 'CT angiography (ถ้าเลือดออกมาก)'],
            treatment: 'Conservative (80% หยุดเอง) + colonoscopy + angioembolization ถ้าไม่หยุด',
            firstLine: 'IV fluid + blood transfusion ถ้าจำเป็น',
            dontMiss: 'ส่วนใหญ่หยุดเอง แต่ rebleed rate 25%',
            examTip: '"คนแก่ + ถ่ายเลือดสดมากทันที + ไม่ปวด" → Diverticular bleed'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 2. CARDIO — หัวใจและหลอดเลือด
  // ═══════════════════════════════════════════
  {
    code: 'CARDIO',
    name: 'ระบบหัวใจและหลอดเลือด',
    nameEn: 'Cardiovascular',
    icon: '❤️',
    color: '#ef4444',
    description: 'โรคหัวใจ หลอดเลือด ความดัน',
    symptoms: [
      {
        name: 'เจ็บหน้าอก',
        nameEn: 'Chest Pain',
        differentials: [
          {
            diagnosis: 'Acute Coronary Syndrome (ACS)', diagnosisTh: 'โรคหลอดเลือดหัวใจเฉียบพลัน', frequency: 'high',
            keyClues: ['แน่นหน้าอกเหมือนช้างเหยียบ ร้าวไปแขนซ้าย/คาง', 'เหงื่อแตก คลื่นไส้', 'ผู้ชาย > 40, DM, HT, สูบบุหรี่, ไขมันสูง'],
            redFlags: ['STEMI = ST elevation → ต้องเปิดหลอดเลือดภายใน 90 นาที!'],
            investigation: ['ECG (12 leads) ทันที!', 'Troponin I/T', 'CXR'],
            treatment: 'MONA (Morphine, O2, Nitrate, Aspirin) + PCI/Fibrinolytic',
            firstLine: 'Aspirin 300mg + Ticagrelor/Clopidogrel + Heparin → PCI',
            dontMiss: 'STEMI → Door-to-balloon < 90 นาที! ห้ามรอ',
            examTip: 'Chest pain → ทำ ECG ก่อนเสมอ! STEMI → PCI ใน 90 นาที หรือ Fibrinolytic ใน 30 นาที'
          },
          {
            diagnosis: 'Pulmonary Embolism (PE)', diagnosisTh: 'ลิ่มเลือดอุดหลอดเลือดปอด', frequency: 'high',
            keyClues: ['เจ็บหน้าอกเฉียบพลัน + หายใจเหนื่อย', 'ขาบวมข้างเดียว (DVT)', 'นอนนาน / หลังผ่าตัด / กินยาคุม'],
            redFlags: ['Massive PE → ช็อค', 'หัวใจข้างขวาวาย'],
            investigation: ['CT pulmonary angiography (CTPA)', 'D-dimer (rule out)', 'ECG (S1Q3T3, sinus tachycardia)'],
            treatment: 'Anticoagulation (Heparin → Warfarin/DOAC) / Massive → Fibrinolytic',
            firstLine: 'Heparin (UFH/LMWH) → switch to DOAC (Rivaroxaban/Apixaban)',
            dontMiss: 'Massive PE + shock → tPA (fibrinolytic) / Surgical embolectomy',
            examTip: '"เจ็บหน้าอกทันที + หอบ + ขาบวม" → PE'
          },
          {
            diagnosis: 'Aortic Dissection', diagnosisTh: 'หลอดเลือดแดงใหญ่ฉีก', frequency: 'high',
            keyClues: ['ปวดหน้าอก/หลังรุนแรงทันที เหมือนถูกฉีก (tearing)', 'ความดันแขน 2 ข้างต่างกัน', 'ความดันสูง + Marfan syndrome'],
            redFlags: ['หลอดเลือดแตก → ตายทันที', 'Type A → ต้องผ่าตัดด่วน'],
            investigation: ['CT angiography (ด่วน!)', 'CXR (mediastinum กว้าง)', 'TEE (transesophageal echo)'],
            treatment: 'Type A → Emergency surgery / Type B → BP control (IV esmolol)',
            firstLine: 'IV beta-blocker (Esmolol/Labetalol) เป้าหมาย SBP < 120, HR < 60',
            dontMiss: 'Type A = ascending → surgery ด่วน! Type B = descending → ยาก่อน',
            examTip: '"ปวดหน้าอกทันทีเหมือนฉีก + BP แขน 2 ข้างต่างกัน" → Dissection'
          },
          {
            diagnosis: 'Pneumothorax', diagnosisTh: 'ลมรั่วในช่องอก', frequency: 'high',
            keyClues: ['เจ็บหน้าอกข้างเดียวทันที + หายใจเหนื่อย', 'ฟังเสียงหายใจข้างนั้นเบา', 'คนผอมสูง / ถุงลมโป่งพอง / หลังอุบัติเหตุ'],
            redFlags: ['Tension pneumothorax → คอโป่ง + หลอดลมเบี้ยว + BP ต่ำ → ใส่เข็มทันที!'],
            investigation: ['CXR (เห็น lung collapse)', 'ห้ามรอ X-ray ถ้า tension → needle decompression ทันที'],
            treatment: 'Small → observe / Large → Chest tube / Tension → Needle decompression',
            firstLine: 'Chest tube insertion (ICD)',
            dontMiss: 'Tension pneumothorax → 14G needle ที่ 2nd ICS MCL ก่อน chest tube!',
            examTip: '"Tension pneumothorax" → needle decompression 2nd ICS MCL ก่อน! ไม่ต้องรอ X-ray'
          },
          {
            diagnosis: 'Pericarditis', diagnosisTh: 'เยื่อหุ้มหัวใจอักเสบ', frequency: 'med',
            keyClues: ['เจ็บหน้าอกแหลมๆ (sharp/pleuritic)', 'ปวดมากเวลานอน ดีขึ้นเวลานั่งก้มตัว', 'เพิ่งป่วยไข้หวัด (viral)'],
            redFlags: ['Cardiac tamponade (Beck triad: BP ต่ำ + คอโป่ง + เสียงหัวใจเบา)'],
            investigation: ['ECG (diffuse ST elevation + PR depression)', 'Echo (pericardial effusion)', 'Troponin (อาจสูงเล็กน้อย)'],
            treatment: 'NSAIDs + Colchicine / ถ้ามี tamponade → Pericardiocentesis',
            firstLine: 'Ibuprofen 600mg tid + Colchicine 0.5mg bid (3 เดือน)',
            dontMiss: 'ห้ามให้ anticoagulant! อาจทำให้ hemorrhagic pericarditis',
            examTip: '"เจ็บหน้าอก + นั่งก้มตัวดีขึ้น + ECG ST elevation ทุก lead" → Pericarditis (ไม่ใช่ MI!)'
          },
          {
            diagnosis: 'GERD', diagnosisTh: 'กรดไหลย้อน', frequency: 'med',
            keyClues: ['แสบร้อนหน้าอก (heartburn) หลังกินอาหาร', 'มากขึ้นเวลานอน', 'รสเปรี้ยวในคอ'],
            redFlags: ['กลืนลำบาก (dysphagia) → ต้องส่องกล้อง'],
            investigation: ['ลองให้ PPI ถ้าดีขึ้น = GERD', 'EGD ถ้าอาการนาน / alarm symptoms'],
            treatment: 'Lifestyle modification + PPI',
            firstLine: 'Omeprazole 20mg OD ก่อนอาหาร 30 นาที',
            dontMiss: 'Alarm symptoms (กลืนลำบาก, น้ำหนักลด, ซีด) → EGD!',
            examTip: 'GERD เป็น non-cardiac chest pain ที่พบบ่อยที่สุด'
          }
        ]
      },
      {
        name: 'ใจสั่น',
        nameEn: 'Palpitation',
        differentials: [
          {
            diagnosis: 'Atrial Fibrillation (AF)', diagnosisTh: 'หัวใจห้องบนเต้นสั่นพริ้ว', frequency: 'high',
            keyClues: ['ใจสั่นไม่สม่ำเสมอ (irregularly irregular)', 'อาจมีหรือไม่มีอาการ', 'พบบ่อยในคนแก่ + ความดันสูง + HT + ไทรอยด์'],
            redFlags: ['Rapid ventricular rate → หัวใจวาย', 'ลิ่มเลือดอุดสมอง (Stroke)'],
            investigation: ['ECG (no P wave + irregular RR interval)', 'TFT (rule out hyperthyroid)', 'Echo'],
            treatment: 'Rate control (beta-blocker/CCB) + Anticoagulation (CHA2DS2-VASc)',
            firstLine: 'Metoprolol (rate control) + Warfarin/DOAC (anticoagulation)',
            dontMiss: 'CHA2DS2-VASc ≥ 2 (ชาย) / ≥ 3 (หญิง) → ต้องให้ anticoagulant!',
            examTip: 'AF → ต้องประเมิน CHA2DS2-VASc score เพื่อให้ยากันเลือดแข็ง'
          },
          {
            diagnosis: 'SVT (AVNRT/AVRT)', diagnosisTh: 'หัวใจเต้นเร็วผิดปกติ', frequency: 'high',
            keyClues: ['ใจสั่นเร็วมากทันที (sudden onset) → หยุดทันที', 'เต้นสม่ำเสมอ เร็ว 150-250/min', 'คนอายุน้อย'],
            redFlags: ['Hemodynamic instability → cardioversion'],
            investigation: ['ECG (narrow complex, regular, no P wave)', 'Adenosine (ทั้งวินิจฉัย + รักษา)'],
            treatment: 'Vagal maneuver → Adenosine → Cardioversion',
            firstLine: 'Adenosine 6mg rapid IV push → 12mg ถ้าไม่ตอบ',
            dontMiss: 'Unstable (BP ต่ำ, สับสน) → Synchronized cardioversion ทันที!',
            examTip: 'SVT → Vagal maneuver ก่อน → Adenosine → ถ้าไม่ดี → Cardioversion'
          },
          {
            diagnosis: 'Ventricular Tachycardia (VT)', diagnosisTh: 'หัวใจห้องล่างเต้นเร็ว', frequency: 'high',
            keyClues: ['ใจสั่น + เป็นลม/หมดสติ', 'เคยเป็นโรคหัวใจมาก่อน (MI เก่า)', 'Wide QRS complex'],
            redFlags: ['Pulseless VT → CPR + Defibrillation ทันที!', 'VF (สั่นพริ้ว) → ตายถ้าไม่ shock'],
            investigation: ['ECG (wide QRS > 120ms, regular)', 'Echo', 'Electrolytes (K+, Mg2+)'],
            treatment: 'Stable → Amiodarone / Unstable → Cardioversion / Pulseless → Defibrillation',
            firstLine: 'Amiodarone 150mg IV (stable) / Defibrillation (pulseless)',
            dontMiss: 'Pulseless VT = CPR + Defibrillation ทันที! เหมือน VF',
            examTip: 'Wide complex tachycardia → ถือว่าเป็น VT จนกว่าจะพิสูจน์ได้ว่าไม่ใช่!'
          },
          {
            diagnosis: 'Panic Attack / Anxiety', diagnosisTh: 'ตื่นตกใจ / วิตกกังวล', frequency: 'med',
            keyClues: ['ใจสั่น + หายใจเร็ว + มือชา + กลัวตาย', 'ไม่มีโรคหัวใจ', 'เป็นบ่อยในที่แออัด / เครียด'],
            redFlags: ['ต้อง rule out cardiac cause ก่อนเสมอ!'],
            investigation: ['ECG ปกติ', 'TFT ปกติ', 'Clinical diagnosis'],
            treatment: 'Reassurance + CBT + SSRI (ถ้าเป็นบ่อย)',
            firstLine: 'Reassurance + breathing exercise / SSRI (Sertraline/Escitalopram)',
            dontMiss: 'ต้อง rule out cardiac cause ก่อนเสมอ! อย่าด่วนสรุป',
            examTip: 'Panic attack = diagnosis of exclusion — ต้อง rule out หัวใจ + thyroid ก่อน!'
          }
        ]
      },
      {
        name: 'หายใจเหนื่อย',
        nameEn: 'Dyspnea',
        differentials: [
          {
            diagnosis: 'Heart Failure', diagnosisTh: 'หัวใจวาย', frequency: 'high',
            keyClues: ['เหนื่อยเวลาออกแรง (exertional dyspnea)', 'นอนราบแล้วหอบ (orthopnea)', 'ขาบวม 2 ข้าง คอโป่ง (JVP สูง)'],
            redFlags: ['Acute pulmonary edema (น้ำท่วมปอด)', 'Cardiogenic shock'],
            investigation: ['CXR (หัวใจโต + น้ำในปอด)', 'BNP / NT-proBNP สูง', 'Echo (EF ต่ำ)'],
            treatment: 'ACEI/ARB + Beta-blocker + Diuretic + MRA',
            firstLine: 'Enalapril/Ramipril (ACEI) + Carvedilol/Bisoprolol + Furosemide',
            dontMiss: 'Acute HF + น้ำท่วมปอด → IV Furosemide + นั่ง + O2 / ห้าม beta-blocker ตอน acute!',
            examTip: '"เหนื่อย + นอนราบไม่ได้ + ขาบวม + BNP สูง" → Heart failure'
          },
          {
            diagnosis: 'Pneumonia', diagnosisTh: 'ปอดอักเสบ', frequency: 'high',
            keyClues: ['ไข้ ไอมีเสมหะ หายใจเหนื่อย', 'ฟังปอดได้ crepitation', 'คนแก่อาจไม่มีไข้'],
            redFlags: ['Sepsis', 'Respiratory failure (O2 sat < 90%)'],
            investigation: ['CXR (infiltration)', 'CBC, CRP', 'Sputum culture + blood culture'],
            treatment: 'ATB ตาม severity (CURB-65) + supportive',
            firstLine: 'CAP: Amoxicillin (mild) / Co-amoxiclav + Azithromycin (moderate-severe)',
            dontMiss: 'CURB-65 ≥ 3 → ICU! / ให้ ATB ภายใน 4 ชม.หลัง admit',
            examTip: 'CURB-65 score ประเมินความรุนแรง: Confusion, Urea, RR, BP, Age ≥65'
          },
          {
            diagnosis: 'Asthma Exacerbation', diagnosisTh: 'หืดกำเริบ', frequency: 'high',
            keyClues: ['หอบ wheezing (เสียงวี้ด)', 'ประวัติหืด / ภูมิแพ้', 'เป็นตอนกลางคืน / สัมผัสสิ่งกระตุ้น'],
            redFlags: ['Silent chest (เสียง wheeze หายไป = อุดตันมาก!)', 'ใช้กล้ามเนื้อช่วยหายใจ'],
            investigation: ['Peak flow (ลดลง)', 'O2 saturation', 'ABG (ถ้ารุนแรง)'],
            treatment: 'Inhaled SABA (rescue) + ICS (controller) ตาม step',
            firstLine: 'Salbutamol inhaler (rescue) + Budesonide (controller)',
            dontMiss: 'Silent chest = severe! / ห้ามให้ beta-blocker ในคนหืด!',
            examTip: '"Silent chest" ในคนหืด = อันตรายมาก! ไม่ใช่ดีขึ้น = อุดตันจนลมไม่ผ่าน'
          },
          {
            diagnosis: 'COPD Exacerbation', diagnosisTh: 'ปอดอุดกั้นเรื้อรังกำเริบ', frequency: 'high',
            keyClues: ['สูบบุหรี่นาน + เหนื่อยมากขึ้น', 'เสมหะเปลี่ยนสี/มากขึ้น', 'Barrel chest, prolonged expiration'],
            redFlags: ['CO2 narcosis (ง่วงซึม สับสน)', 'Respiratory failure'],
            investigation: ['CXR', 'ABG (CO2 สูง)', 'Spirometry (FEV1/FVC < 0.7)'],
            treatment: 'Bronchodilator (LABA/LAMA) + ICS ถ้า frequent exacerbation',
            firstLine: 'Tiotropium (LAMA) + Formoterol (LABA) / Prednisolone 5 วัน (exacerbation)',
            dontMiss: 'O2 target 88-92%! / ห้าม high-flow O2 → CO2 narcosis',
            examTip: 'COPD + O2 → ให้ O2 เป้าหมาย 88-92% (ไม่ใช่ 100%!) เพราะกลัว CO2 narcosis'
          },
          {
            diagnosis: 'Pulmonary Embolism (PE)', diagnosisTh: 'ลิ่มเลือดอุดปอด', frequency: 'high',
            keyClues: ['เหนื่อยทันที + เจ็บหน้าอก (pleuritic)', 'ขาบวมข้างเดียว (DVT)', 'นอนนาน / กินยาคุม / หลังผ่าตัด'],
            redFlags: ['Massive PE → ช็อค'],
            investigation: ['CTPA', 'D-dimer', 'Wells score'],
            treatment: 'Anticoagulation (Heparin → DOAC)',
            firstLine: 'Enoxaparin / Rivaroxaban',
            dontMiss: 'Massive PE + shock → tPA',
            examTip: '"เหนื่อยทันที + ขาบวม + เพิ่งนอนนาน" → PE จนกว่าจะพิสูจน์ว่าไม่ใช่'
          }
        ]
      },
      {
        name: 'เป็นลม',
        nameEn: 'Syncope',
        differentials: [
          {
            diagnosis: 'Vasovagal Syncope', diagnosisTh: 'เป็นลมจากประสาทอัตโนมัติ', frequency: 'high',
            keyClues: ['มีเหตุกระตุ้น (ยืนนาน, เจ็บ, กลัวเลือด)', 'มีอาการนำ (หน้ามืด คลื่นไส้ เหงื่อออก)', 'ฟื้นเร็วหลังนอนราบ'],
            redFlags: [],
            investigation: ['ECG (rule out cardiac)', 'Tilt table test (ถ้าเป็นบ่อย)'],
            treatment: 'Reassurance + หลีกเลี่ยงสิ่งกระตุ้น + counter-pressure maneuver',
            firstLine: 'Education + hydration + counter-pressure maneuver',
            dontMiss: 'Benign — แต่ต้อง rule out cardiac cause ก่อน!',
            examTip: 'Vasovagal = สาเหตุบ่อยสุดของ syncope ในคนอายุน้อย — benign'
          },
          {
            diagnosis: 'Cardiac Arrhythmia', diagnosisTh: 'หัวใจเต้นผิดจังหวะ', frequency: 'high',
            keyClues: ['เป็นลมทันทีไม่มีอาการนำ', 'เคยเป็นโรคหัวใจ', 'เป็นลมขณะออกกำลังกาย'],
            redFlags: ['VT/VF → หัวใจหยุด', 'Complete heart block'],
            investigation: ['ECG', 'Holter monitor (24-48 ชม.)', 'Echo'],
            treatment: 'ตามชนิด arrhythmia (pacemaker / ICD / ablation)',
            firstLine: 'ขึ้นกับ arrhythmia ที่พบ',
            dontMiss: 'เป็นลมขณะออกกำลัง = cardiac จนกว่าจะพิสูจน์ไม่ใช่!',
            examTip: '"เป็นลมทันทีไม่มีอาการนำ + ขณะออกกำลัง" → Cardiac cause จนกว่าจะพิสูจน์ไม่ใช่'
          },
          {
            diagnosis: 'Orthostatic Hypotension', diagnosisTh: 'ความดันตกเมื่อลุก', frequency: 'med',
            keyClues: ['เป็นลมเมื่อลุกยืน', 'คนแก่ / กินยาลดความดัน / ขาดน้ำ', 'BP ลดลง > 20/10 mmHg เมื่อยืน'],
            redFlags: ['ตก → กระดูกหัก (โดยเฉพาะสะโพก)'],
            investigation: ['วัด BP นอน → ยืน (orthostatic vital signs)'],
            treatment: 'ดื่มน้ำมาก + เกลือ + ลุกช้าๆ + ปรับยา',
            firstLine: 'Non-pharmacological: hydration + compression stockings + ลุกช้าๆ',
            dontMiss: 'ตรวจสอบยาที่กิน — อาจต้องลด/หยุดยา BP',
            examTip: '"คนแก่ + เป็นลมเมื่อลุก + กินยา BP" → Orthostatic hypotension'
          },
          {
            diagnosis: 'Aortic Stenosis', diagnosisTh: 'ลิ้นหัวใจเอออร์ตาตีบ', frequency: 'med',
            keyClues: ['เป็นลมขณะออกกำลังกาย', 'เจ็บหน้าอก + เหนื่อย', 'ฟังหัวใจได้เสียง murmur (systolic) ที่ aortic area'],
            redFlags: ['Sudden cardiac death'],
            investigation: ['Echo (ดู valve area + gradient)', 'ECG (LVH)'],
            treatment: 'Severe symptomatic → AVR (surgical/TAVR)',
            firstLine: 'Aortic valve replacement (AVR) / TAVR ในคนแก่',
            dontMiss: 'ห้ามให้ vasodilator (nitrate) ใน severe AS! → BP ตกอันตราย',
            examTip: '"คนแก่ + เป็นลมขณะออกกำลัง + systolic murmur" → Aortic stenosis'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 3. NEURO — ระบบประสาท
  // ═══════════════════════════════════════════
  {
    code: 'NEURO',
    name: 'ระบบประสาท',
    nameEn: 'Neurology',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'โรคสมอง ไขสันหลัง เส้นประสาท',
    symptoms: [
      {
        name: 'ปวดศีรษะ',
        nameEn: 'Headache',
        differentials: [
          {
            diagnosis: 'Tension-type Headache', diagnosisTh: 'ปวดหัวจากความเครียด', frequency: 'high',
            keyClues: ['ปวดรัดรอบหัวเหมือนหมวกรัด (band-like)', 'ทั้ง 2 ข้าง ปวดตื้อๆ', 'ไม่คลื่นไส้ ไม่กลัวแสง'],
            redFlags: [],
            investigation: ['Clinical diagnosis ไม่ต้อง imaging'],
            treatment: 'Simple analgesics + stress management',
            firstLine: 'Paracetamol / Ibuprofen',
            dontMiss: 'ถ้าใช้ยาแก้ปวด > 15 วัน/เดือน → Medication overuse headache!',
            examTip: 'Tension headache = ปวดหัวชนิดบ่อยที่สุด — bilateral, band-like, ไม่มี aura'
          },
          {
            diagnosis: 'Migraine', diagnosisTh: 'ไมเกรน', frequency: 'high',
            keyClues: ['ปวดข้างเดียว ตุบๆ (pulsating)', 'คลื่นไส้ อาเจียน กลัวแสง/เสียง (photo/phonophobia)', 'อาจมี aura (เห็นแสง zig-zag ก่อนปวด)'],
            redFlags: ['ปวดหัวครั้งแรกอายุ > 50 → ต้อง imaging'],
            investigation: ['Clinical diagnosis (ICHD criteria)', 'MRI ถ้า atypical / ครั้งแรกในคนแก่'],
            treatment: 'Acute: Triptan + NSAIDs / Preventive: Beta-blocker / Topiramate / Valproate',
            firstLine: 'Sumatriptan (acute) / Propranolol (preventive ถ้า ≥ 4 ครั้ง/เดือน)',
            dontMiss: 'ห้าม Triptan ใน history of stroke/MI! / Ergotamine ห้ามใช้กับ Triptan!',
            examTip: '"ปวดหัวข้างเดียว + ตุบๆ + คลื่นไส้ + กลัวแสง" → Migraine'
          },
          {
            diagnosis: 'Subarachnoid Hemorrhage (SAH)', diagnosisTh: 'เลือดออกใต้เยื่อหุ้มสมอง', frequency: 'high',
            keyClues: ['ปวดหัวรุนแรงที่สุดในชีวิต (thunderclap) ทันที', 'คอแข็ง (meningism)', 'อาจหมดสติ'],
            redFlags: ['ตายได้ทันที!', 'Re-bleeding'],
            investigation: ['CT brain non-contrast (ด่วน!)', 'ถ้า CT ปกติ → LP (xanthochromia)', 'CT angiography (หา aneurysm)'],
            treatment: 'Secure aneurysm (clipping/coiling) + Nimodipine + ICU',
            firstLine: 'Nimodipine 60mg q4h (ป้องกัน vasospasm) + Coiling/Clipping',
            dontMiss: 'Rebleeding rate สูงมากใน 24 ชม. แรก! → secure aneurysm เร็ว!',
            examTip: '"ปวดหัวรุนแรงที่สุดในชีวิตทันที" → SAH จนกว่าจะพิสูจน์ไม่ใช่ → CT ด่วน!'
          },
          {
            diagnosis: 'Meningitis', diagnosisTh: 'เยื่อหุ้มสมองอักเสบ', frequency: 'high',
            keyClues: ['ปวดหัว + ไข้สูง + คอแข็ง (classic triad)', "Kernig's sign (+), Brudzinski's sign (+)", 'อาจมีผื่น petechiae (meningococcal)'],
            redFlags: ['สับสน ซึม = อันตราย', 'Septic shock'],
            investigation: ['LP (CSF analysis) = gold standard', 'Blood culture', 'CT brain ก่อน LP ถ้ามี papilledema / focal deficit'],
            treatment: 'ATB IV ด่วน! + Dexamethasone ก่อน ATB',
            firstLine: 'Ceftriaxone 2g IV q12h + Vancomycin + Dexamethasone ก่อน ATB dose แรก',
            dontMiss: 'ให้ ATB ก่อนถ้ารอ LP/CT นาน! ห้ามรอ! + Dexa ก่อน ATB ลด mortality',
            examTip: '"ไข้ + ปวดหัว + คอแข็ง" → Meningitis → LP! (ให้ ATB ก่อนถ้ารอ LP นาน)'
          },
          {
            diagnosis: 'Brain Tumor', diagnosisTh: 'เนื้องอกสมอง', frequency: 'med',
            keyClues: ['ปวดหัวรุนแรงตอนเช้า', 'ปวดมากขึ้นเรื่อยๆ (progressive)', 'อาเจียนพุ่ง + ตามัว (increased ICP)'],
            redFlags: ['Herniation (pupil ข้างเดียวขยาย)'],
            investigation: ['MRI brain with contrast', 'CT brain'],
            treatment: 'Surgery ± Radiation ± Chemotherapy + Dexamethasone (ลดบวม)',
            firstLine: 'Dexamethasone (ลด cerebral edema) + Surgical resection',
            dontMiss: 'Raised ICP → Mannitol + Head elevation 30° + ห้าม LP!',
            examTip: '"ปวดหัวตอนเช้า + แย่ลงเรื่อยๆ + อาเจียนพุ่ง" → Brain tumor / raised ICP'
          }
        ]
      },
      {
        name: 'ชัก',
        nameEn: 'Seizure',
        differentials: [
          {
            diagnosis: 'Epilepsy', diagnosisTh: 'โรคลมชัก', frequency: 'high',
            keyClues: ['ชัก ≥ 2 ครั้ง โดยไม่มีสาเหตุกระตุ้น', 'อาจมี aura ก่อนชัก', 'หลังชัก: สับสน ง่วง (postictal)'],
            redFlags: ['Status epilepticus (ชักนาน > 5 นาที หรือชักต่อเนื่อง)'],
            investigation: ['EEG', 'MRI brain', 'Blood tests (glucose, electrolytes, Ca2+)'],
            treatment: 'AED ตามชนิด: Generalized → Valproate / Focal → Carbamazepine/Levetiracetam',
            firstLine: 'Valproate (generalized) / Levetiracetam (focal) — safe ทั้ง 2 ชนิด',
            dontMiss: 'Valproate ห้ามในหญิงตั้งครรภ์! (teratogenic) → ให้ Levetiracetam/Lamotrigine',
            examTip: 'Status epilepticus → Benzodiazepine (Diazepam/Lorazepam) ทันที!'
          },
          {
            diagnosis: 'Febrile Seizure', diagnosisTh: 'ชักจากไข้สูง', frequency: 'high',
            keyClues: ['เด็กอายุ 6 เดือน - 5 ปี', 'ไข้สูง > 38°C + ชัก', 'Simple: ชัก < 15 นาที, ทั้งตัว, ครั้งเดียว'],
            redFlags: ['Complex febrile seizure (ชักนาน / ชักซ้ำใน 24 ชม. / ชักข้างเดียว)'],
            investigation: ['หาสาเหตุไข้', 'LP ถ้าสงสัย meningitis (เด็ก < 12 เดือน)'],
            treatment: 'ลดไข้ (Paracetamol) + Reassure parents + หาสาเหตุไข้',
            firstLine: 'Paracetamol / Tepid sponge + รักษาสาเหตุไข้',
            dontMiss: 'Simple febrile seizure ไม่ต้องให้ยากันชัก! Reassure พ่อแม่',
            examTip: 'Simple febrile seizure → reassure พ่อแม่ ไม่ต้องให้ยากันชัก'
          },
          {
            diagnosis: 'Stroke', diagnosisTh: 'โรคหลอดเลือดสมอง', frequency: 'high',
            keyClues: ['ชัก + อ่อนแรงครึ่งซีก', 'เกิดทันที', 'คนแก่ + HT / DM / AF'],
            redFlags: ['Hemorrhagic stroke', 'Herniation'],
            investigation: ['CT brain (ด่วน! แยก ischemic vs hemorrhagic)', 'MRI brain'],
            treatment: 'Ischemic: rtPA ใน 4.5 ชม. / Hemorrhagic: BP control + Surgery ถ้าจำเป็น',
            firstLine: 'rtPA (Alteplase) 0.9mg/kg IV ถ้ามาภายใน 4.5 ชม. (ischemic)',
            dontMiss: 'CT ก่อนเสมอ! ห้ามให้ rtPA ใน hemorrhagic stroke!',
            examTip: 'ชัก + focal deficit ใหม่ → CT brain ด่วนทันที'
          },
          {
            diagnosis: 'Metabolic (Hypoglycemia / Hyponatremia / Hypocalcemia)', diagnosisTh: 'ชักจากสาร metabolic ผิดปกติ', frequency: 'high',
            keyClues: ['Hypoglycemia: เบาหวาน + กินยา/ฉีด insulin + เหงื่อ สับสน', 'Hyponatremia: Na < 120 + สับสน', 'Hypocalcemia: ชาปาก มือ + Trousseau/Chvostek sign'],
            redFlags: ['Glucose < 40 → สมองเสียหาย'],
            investigation: ['DTX (finger stick glucose) ทำก่อนเสมอ!', 'Electrolytes (Na, K, Ca, Mg)', 'BUN/Cr'],
            treatment: 'แก้สาเหตุ: Glucose (hypoglycemia) / Na correction / Ca correction',
            firstLine: 'D50W 50mL IV push (hypoglycemia) / 3% NaCl (hyponatremia)',
            dontMiss: 'แก้ Na ช้าๆ! ห้ามเกิน 8-10 mEq/L/24hr → Osmotic demyelination!',
            examTip: 'ชัก → เช็ค DTX ก่อนเสมอ! Hypoglycemia แก้ง่ายที่สุดแต่อันตรายถ้าพลาด'
          }
        ]
      },
      {
        name: 'อ่อนแรง',
        nameEn: 'Weakness',
        differentials: [
          {
            diagnosis: 'Stroke (Ischemic)', diagnosisTh: 'โรคหลอดเลือดสมองตีบ/อุดตัน', frequency: 'high',
            keyClues: ['อ่อนแรงครึ่งซีกทันที', 'พูดไม่ชัด / ปากเบี้ยว / แขนตก', 'มีปัจจัยเสี่ยง: HT, DM, AF, สูบบุหรี่'],
            redFlags: ['มาถึง ER ภายใน 4.5 ชม. → ให้ rtPA ได้ (time is brain!)'],
            investigation: ['CT brain ด่วน (แยก hemorrhage)', 'CT angiography', 'MRI DWI'],
            treatment: 'rtPA + Antiplatelet (Aspirin) + Statin + PT/OT rehab',
            firstLine: 'rtPA ถ้า < 4.5 ชม. → Aspirin 300mg (หลัง 24 ชม.) + Atorvastatin',
            dontMiss: 'Time is brain! Door-to-needle < 60 นาที',
            examTip: 'FAST score: Face drooping, Arm weakness, Speech difficulty, Time to call → Stroke!'
          },
          {
            diagnosis: 'Guillain-Barré Syndrome (GBS)', diagnosisTh: 'ปลายประสาทอักเสบเฉียบพลัน', frequency: 'high',
            keyClues: ['อ่อนแรง ascending (ขาก่อน → แขน → หายใจ)', 'หลังเป็นหวัด/ท้องเสีย 1-4 สัปดาห์', 'DTR หายไป (areflexia)'],
            redFlags: ['กล้ามเนื้อหายใจอ่อนแรง → ต้อง intubate!'],
            investigation: ['LP (albuminocytologic dissociation: protein สูง, cell ปกติ)', 'NCS/EMG'],
            treatment: 'IVIG หรือ Plasmapheresis + ICU monitoring + PT',
            firstLine: 'IVIG 0.4g/kg/day x 5 วัน',
            dontMiss: 'Monitor FVC ทุก 4 ชม.! FVC < 20 mL/kg → intubate!',
            examTip: '"อ่อนแรงขาก่อนแล้วขึ้น + reflexes หาย + หลังหวัด" → GBS'
          },
          {
            diagnosis: 'Myasthenia Gravis', diagnosisTh: 'กล้ามเนื้ออ่อนแรงจากภูมิคุ้มกัน', frequency: 'med',
            keyClues: ['อ่อนแรงมากขึ้นเมื่อใช้กล้ามเนื้อ (fatigability)', 'หนังตาตก (ptosis) + เห็นภาพซ้อน', 'ดีขึ้นหลังพัก'],
            redFlags: ['Myasthenic crisis (หายใจไม่ได้)'],
            investigation: ['Anti-AChR antibody', 'Tensilon (Edrophonium) test', 'CT chest (thymoma)'],
            treatment: 'Pyridostigmine + Immunosuppression (Prednisolone + Azathioprine) + Thymectomy',
            firstLine: 'Pyridostigmine (Mestinon) 60mg tid',
            dontMiss: 'Myasthenic crisis → ICU + IVIG/Plasmapheresis / ห้ามให้ aminoglycoside!',
            examTip: '"หนังตาตก + เห็นภาพซ้อน + อ่อนแรงมากเมื่อใช้งาน" → Myasthenia gravis'
          },
          {
            diagnosis: 'Spinal Cord Compression', diagnosisTh: 'ไขสันหลังถูกกด', frequency: 'med',
            keyClues: ['อ่อนแรง 2 ขา (paraplegia) + ชาระดับลงมา (sensory level)', 'ปัสสาวะ/อุจจาระไม่ออก (bladder/bowel dysfunction)', 'ปวดหลังรุนแรง + มะเร็งแพร่กระจาย'],
            redFlags: ['ถ้าไม่รักษาใน 24-48 ชม. → เป็นอัมพาตถาวร!'],
            investigation: ['MRI spine ด่วน!'],
            treatment: 'Dexamethasone IV ด่วน + Radiation/Surgery ภายใน 24 ชม.',
            firstLine: 'Dexamethasone 10mg IV bolus → 4mg q6h + Emergency MRI + Referral',
            dontMiss: 'ถ้าไม่รักษาใน 24-48 ชม. → เป็นอัมพาตถาวร!',
            examTip: '"ปวดหลัง + อ่อนแรง 2 ขา + ปัสสาวะไม่ออก" → Cord compression → MRI ด่วน!'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 4. PULMO — ระบบทางเดินหายใจ
  // ═══════════════════════════════════════════
  {
    code: 'PULMO',
    name: 'ระบบทางเดินหายใจ',
    nameEn: 'Pulmonology',
    icon: '🫁',
    color: '#06b6d4',
    description: 'โรคปอด หลอดลม ทางเดินหายใจ',
    symptoms: [
      {
        name: 'ไอเรื้อรัง',
        nameEn: 'Chronic Cough',
        differentials: [
          {
            diagnosis: 'Postnasal Drip / Upper Airway Cough', diagnosisTh: 'น้ำมูกไหลลงคอ', frequency: 'high',
            keyClues: ['รู้สึกมีเสมหะไหลลงคอ', 'ต้อง clearing throat บ่อย', 'มีอาการภูมิแพ้ / ไซนัสอักเสบ'],
            redFlags: [],
            investigation: ['CT paranasal sinus', 'ลองให้ antihistamine'],
            treatment: 'Antihistamine + Nasal steroid spray',
            firstLine: 'Loratadine/Cetirizine + Fluticasone nasal spray',
            dontMiss: 'อาจต้อง treat sinusitis ด้วย ATB ถ้าเป็นนาน',
            examTip: 'Chronic cough สาเหตุบ่อยสุด 3 อันดับ: 1) Postnasal drip 2) Asthma 3) GERD'
          },
          {
            diagnosis: 'Asthma', diagnosisTh: 'หืด', frequency: 'high',
            keyClues: ['ไอแห้ง โดยเฉพาะกลางคืน/เช้า', 'หายใจเสียงวี้ด (wheeze)', 'มีสิ่งกระตุ้น (ฝุ่น, อากาศเย็น, ออกกำลัง)'],
            redFlags: [],
            investigation: ['Spirometry + Bronchodilator response', 'Peak flow variability', 'Methacholine challenge (ถ้าสงสัย)'],
            treatment: 'ICS + SABA',
            firstLine: 'Budesonide inhaler + Salbutamol prn',
            dontMiss: 'Cough-variant asthma อาจไม่มี wheeze!',
            examTip: '"ไอกลางคืน + wheeze + ดีขึ้นเมื่อให้ bronchodilator" → Cough-variant asthma'
          },
          {
            diagnosis: 'GERD', diagnosisTh: 'กรดไหลย้อน', frequency: 'high',
            keyClues: ['ไอหลังกินอาหาร หรือนอนราบ', 'แสบร้อนหน้าอก', 'อาจไม่มีอาการ heartburn เลย (silent reflux)'],
            redFlags: [],
            investigation: ['ลองให้ PPI 8 สัปดาห์', 'pH monitoring (ถ้าไม่แน่ใจ)'],
            treatment: 'PPI 8 สัปดาห์',
            firstLine: 'Omeprazole 20mg bid ก่อนอาหาร',
            dontMiss: 'อาจต้องให้ PPI นาน 8-12 สัปดาห์กว่าจะเห็นผล',
            examTip: 'Chronic cough + ไม่มีอาการ classic → อย่าลืม GERD (silent reflux)'
          },
          {
            diagnosis: 'Tuberculosis (TB)', diagnosisTh: 'วัณโรค', frequency: 'high',
            keyClues: ['ไอ > 2 สัปดาห์ + ไข้ต่ำๆ ตอนบ่าย/เย็น', 'น้ำหนักลด เหงื่อออกกลางคืน', 'สัมผัสผู้ป่วย TB'],
            redFlags: ['ไอเป็นเลือด', 'Miliary TB'],
            investigation: ['CXR (cavity / infiltration upper lobe)', 'AFB sputum smear + culture', 'GeneXpert MTB/RIF'],
            treatment: 'RIPE: Rifampicin + Isoniazid + Pyrazinamide + Ethambutol (2 เดือน) → RI (4 เดือน)',
            firstLine: '2RHZE/4RH (รวม 6 เดือน)',
            dontMiss: 'ห้ามหยุดยาเอง! Incomplete treatment → MDR-TB! / INH → ตรวจ LFT / Ethambutol → ตรวจตา',
            examTip: '"ไอ > 2 สัปดาห์ + ไข้ + น้ำหนักลด + เหงื่อกลางคืน" → TB จนกว่าจะพิสูจน์ไม่ใช่'
          },
          {
            diagnosis: 'Lung Cancer', diagnosisTh: 'มะเร็งปอด', frequency: 'med',
            keyClues: ['ไอเรื้อรังเปลี่ยนลักษณะ', 'ไอเป็นเลือด + น้ำหนักลด', 'สูบบุหรี่มานาน'],
            redFlags: ['ก้อนในปอด', 'เสียงแหบ (recurrent laryngeal nerve invasion)'],
            investigation: ['CXR → CT chest', 'Bronchoscopy + biopsy', 'Sputum cytology'],
            treatment: 'Surgery (stage I-II) / Chemo-RT (stage III) / Targeted/Immuno (stage IV)',
            firstLine: 'Surgical resection (ถ้า early stage) / Cisplatin-based chemo',
            dontMiss: 'Check driver mutations (EGFR, ALK) ใน adenocarcinoma → targeted therapy',
            examTip: '"สูบบุหรี่ + ไอเปลี่ยนลักษณะ + ไอเป็นเลือด" → Lung CA'
          },
          {
            diagnosis: 'ACE Inhibitor-induced Cough', diagnosisTh: 'ไอจากยาลดความดัน ACEi', frequency: 'med',
            keyClues: ['กินยา ACE inhibitor (enalapril, ramipril, captopril)', 'ไอแห้ง ไม่มีเสมหะ', 'เริ่มหลังกินยาไม่กี่สัปดาห์-เดือน'],
            redFlags: [],
            investigation: ['ลองหยุดยา → ดีขึ้นใน 1-4 สัปดาห์'],
            treatment: 'หยุด ACEi → เปลี่ยนเป็น ARB',
            firstLine: 'เปลี่ยน Enalapril → Losartan (ARB)',
            dontMiss: 'อาการหายใน 1-4 สัปดาห์หลังหยุดยา',
            examTip: 'Chronic dry cough + กิน ACEi → เปลี่ยนเป็น ARB (เช่น losartan) แทน'
          }
        ]
      },
      {
        name: 'ไอเป็นเลือด',
        nameEn: 'Hemoptysis',
        differentials: [
          {
            diagnosis: 'Tuberculosis', diagnosisTh: 'วัณโรค', frequency: 'high',
            keyClues: ['ไอเป็นเลือด + ไข้ต่ำๆ + น้ำหนักลด', 'CXR: cavity upper lobe', 'ประเทศไทยพบบ่อย'],
            redFlags: ['Massive hemoptysis (> 600 mL/24hr)'],
            investigation: ['CXR', 'AFB sputum', 'CT chest'],
            treatment: 'RIPE 6 เดือน + Massive hemoptysis → bronchial artery embolization',
            firstLine: 'Anti-TB regimen + ถ้า massive → BAE',
            dontMiss: 'นอนตะแคงข้างที่เป็นโรค (ป้องกันเลือดไหลไปปอดดี)',
            examTip: 'ไอเป็นเลือดในไทย → นึกถึง TB ก่อนเสมอ'
          },
          {
            diagnosis: 'Lung Cancer', diagnosisTh: 'มะเร็งปอด', frequency: 'high',
            keyClues: ['ไอเป็นเลือดซ้ำๆ + น้ำหนักลด', 'สูบบุหรี่มานาน', 'อายุ > 40'],
            redFlags: ['ก้อนในปอด'],
            investigation: ['CT chest', 'Bronchoscopy + biopsy'],
            treatment: 'ตาม staging / Massive → BAE / Palliative RT',
            firstLine: 'ตาม staging',
            dontMiss: 'Massive hemoptysis → ท่านอน + airway protection + BAE/surgery',
            examTip: '"สูบบุหรี่ + ไอเป็นเลือด + อายุ > 40" → ต้อง rule out มะเร็ง'
          },
          {
            diagnosis: 'Bronchiectasis', diagnosisTh: 'หลอดลมโป่งพอง', frequency: 'med',
            keyClues: ['ไอเสมหะจำนวนมากทุกวัน (เป็นถ้วย)', 'ไอเป็นเลือดปนเสมหะ', 'เคยปอดอักเสบซ้ำๆ'],
            redFlags: ['Massive hemoptysis'],
            investigation: ['HRCT chest (bronchial wall thickening + dilatation)'],
            treatment: 'Airway clearance (physio) + ATB (exacerbation) + Inhaled steroid',
            firstLine: 'Chest physiotherapy + Amoxicillin (exacerbation)',
            dontMiss: 'Sputum culture ก่อนให้ ATB!',
            examTip: '"ไอเสมหะมากทุกวัน + ไอเป็นเลือด" → Bronchiectasis'
          },
          {
            diagnosis: 'Pulmonary Embolism', diagnosisTh: 'ลิ่มเลือดอุดปอด', frequency: 'med',
            keyClues: ['ไอเป็นเลือด + เจ็บหน้าอก + หายใจเหนื่อย', 'ขาบวมข้างเดียว'],
            redFlags: ['Massive PE → ช็อค'],
            investigation: ['CTPA', 'D-dimer'],
            treatment: 'Anticoagulation',
            firstLine: 'Heparin → DOAC',
            dontMiss: 'ดูรายละเอียดใน PE section',
            examTip: '"ไอเป็นเลือด + เจ็บหน้าอก + ขาบวม" → PE'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 5. RENAL — ไตและทางเดินปัสสาวะ
  // ═══════════════════════════════════════════
  {
    code: 'RENAL',
    name: 'ไตและทางเดินปัสสาวะ',
    nameEn: 'Nephrology',
    icon: '💧',
    color: '#0ea5e9',
    description: 'โรคไต กระเพาะปัสสาวะ ท่อไต',
    symptoms: [
      {
        name: 'ปัสสาวะเป็นเลือด',
        nameEn: 'Hematuria',
        differentials: [
          {
            diagnosis: 'UTI / Cystitis', diagnosisTh: 'ทางเดินปัสสาวะอักเสบ', frequency: 'high',
            keyClues: ['ปัสสาวะแสบขัด (dysuria)', 'ปัสสาวะบ่อย', 'ผู้หญิงพบบ่อยกว่า'],
            redFlags: ['ไข้สูง + ปวดหลัง = Pyelonephritis'],
            investigation: ['UA (WBC + bacteria)', 'Urine culture'],
            treatment: 'ATB 3-5 วัน (uncomplicated) / 7-14 วัน (complicated/pyelo)',
            firstLine: 'Nitrofurantoin 100mg bid x 5 วัน (uncomplicated) / Ceftriaxone (pyelo)',
            dontMiss: 'ผู้ชาย UTI = complicated → ต้อง investigate!',
            examTip: 'Uncomplicated UTI ในผู้หญิง → ให้ ATB ได้เลย ไม่ต้อง culture'
          },
          {
            diagnosis: 'Urolithiasis', diagnosisTh: 'นิ่วทางเดินปัสสาวะ', frequency: 'high',
            keyClues: ['ปวดท้อง/สีข้างรุนแรง ร้าวไปขาหนีบ', 'ปัสสาวะเป็นเลือด (microscopic/gross)', 'ปวดมาก ทนไม่ได้'],
            redFlags: ['ไข้ + นิ่ว = Obstructive pyelonephritis → ด่วน!'],
            investigation: ['CT KUB non-contrast (gold standard)', 'UA'],
            treatment: 'NSAIDs + Alpha-blocker (MET) < 10mm / ESWL > 10mm / URS',
            firstLine: 'Diclofenac + Tamsulosin (Medical Expulsive Therapy)',
            dontMiss: 'ไข้ + นิ่วอุดตัน = Obstructive pyelo → ureteral stent/PCN ด่วน!',
            examTip: '"ปวดท้องร้าวขาหนีบ + ปัสสาวะเป็นเลือด + ปวดทนไม่ได้" → นิ่ว'
          },
          {
            diagnosis: 'Glomerulonephritis', diagnosisTh: 'ไตอักเสบจากกลอเมอรูลัส', frequency: 'med',
            keyClues: ['ปัสสาวะสีโค้ก (cola-colored)', 'บวมหน้า/ตา ตอนเช้า', 'ความดันสูง + เพิ่งเจ็บคอ (Post-strep GN)'],
            redFlags: ['Rapidly progressive GN → ไตวายเร็ว'],
            investigation: ['UA (dysmorphic RBC + RBC casts)', 'BUN/Cr', 'ASO titer, C3/C4', 'Renal biopsy'],
            treatment: 'ตามชนิด: Post-strep → supportive / RPGN → Pulse steroid + Cyclophosphamide',
            firstLine: 'Supportive (Post-strep GN) / Pulse Methylprednisolone (RPGN)',
            dontMiss: 'RPGN (crescent > 50%) → Pulse steroid ด่วน! / Post-strep GN หายเองส่วนใหญ่',
            examTip: '"เด็ก + เจ็บคอ 2 สัปดาห์ก่อน + ปัสสาวะสีโค้ก + บวม" → Post-strep GN'
          },
          {
            diagnosis: 'Bladder Cancer', diagnosisTh: 'มะเร็งกระเพาะปัสสาวะ', frequency: 'med',
            keyClues: ['ปัสสาวะเป็นเลือด ไม่เจ็บ (painless hematuria)', 'ผู้ชายอายุ > 50', 'สูบบุหรี่ / สัมผัสสารเคมี'],
            redFlags: ['มะเร็งลุกลาม'],
            investigation: ['Cystoscopy + biopsy', 'CT urogram', 'Urine cytology'],
            treatment: 'TURBT + intravesical BCG (superficial) / Radical cystectomy (invasive)',
            firstLine: 'TURBT (transurethral resection) + BCG',
            dontMiss: 'Painless hematuria ในคนแก่ → cystoscopy ทุกครั้ง!',
            examTip: '"ผู้ชายแก่ + ปัสสาวะเป็นเลือดไม่เจ็บ" → ต้อง rule out Bladder CA'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 6. ENDO — ต่อมไร้ท่อ
  // ═══════════════════════════════════════════
  {
    code: 'ENDO',
    name: 'ระบบต่อมไร้ท่อ',
    nameEn: 'Endocrinology',
    icon: '⚡',
    color: '#d946ef',
    description: 'โรคเบาหวาน ไทรอยด์ ต่อมหมวกไต ฮอร์โมน',
    symptoms: [
      {
        name: 'น้ำหนักลด',
        nameEn: 'Weight Loss',
        differentials: [
          {
            diagnosis: 'Diabetes Mellitus (DM)', diagnosisTh: 'เบาหวาน', frequency: 'high',
            keyClues: ['กระหายน้ำมาก + ปัสสาวะบ่อย + หิวบ่อย (3P)', 'น้ำหนักลดทั้งที่กินมาก (type 1)', 'แผลหายช้า ตามัว'],
            redFlags: ['DKA (คลื่นไส้ อาเจียน ปวดท้อง หายใจเร็วลึก ลมหายใจกลิ่นผลไม้)'],
            investigation: ['FBS ≥ 126 หรือ HbA1c ≥ 6.5%', 'OGTT', 'UA (glucose + ketone)'],
            treatment: 'Lifestyle + Metformin (Type 2) / Insulin (Type 1)',
            firstLine: 'Metformin 500mg bid → titrate (Type 2) / Basal-bolus insulin (Type 1)',
            dontMiss: 'DKA → IV Insulin + IV NS + K+ replacement! / ห้ามหยุด insulin ใน Type 1!',
            examTip: '3P (Polydipsia + Polyuria + Polyphagia) + น้ำหนักลด → DM'
          },
          {
            diagnosis: 'Hyperthyroidism', diagnosisTh: 'ไทรอยด์เป็นพิษ', frequency: 'high',
            keyClues: ['น้ำหนักลด + กินเยอะ', 'ใจสั่น มือสั่น เหงื่อออกมาก ทนร้อนไม่ได้', 'ตาโปน (Graves) + คอโต (goiter)'],
            redFlags: ['Thyroid storm (ไข้สูง + สับสน + ใจสั่นมาก)'],
            investigation: ['TSH ต่ำ + Free T4 สูง', 'Anti-TSH receptor Ab (Graves)'],
            treatment: 'ATD → RAI → Surgery',
            firstLine: 'Methimazole 10-30mg/day (ยกเว้น trimester 1 → PTU)',
            dontMiss: 'Thyroid storm → PTU + Propranolol + Hydrocortisone + Lugol\'s / Agranulocytosis จาก ATD → หยุดยาทันที!',
            examTip: '"น้ำหนักลด + ใจสั่น + มือสั่น + เหงื่อ + คอโต" → Hyperthyroidism'
          },
          {
            diagnosis: 'Malignancy', diagnosisTh: 'มะเร็ง', frequency: 'high',
            keyClues: ['น้ำหนักลดมาก > 10% ใน 6 เดือน', 'เบื่ออาหาร อ่อนเพลีย', 'อาจมีก้อน / ต่อมน้ำเหลืองโต'],
            redFlags: ['น้ำหนักลดไม่ทราบสาเหตุในคนแก่ → ต้อง screening'],
            investigation: ['CBC, LFT, CXR', 'CT scan', 'Tumor markers ตามสงสัย'],
            treatment: 'ตาม primary tumor (surgery / chemo / radiation / immunotherapy)',
            firstLine: 'ขึ้นกับชนิดมะเร็ง',
            dontMiss: 'น้ำหนักลดไม่ทราบสาเหตุ > 5% ใน 6 เดือน → screening!',
            examTip: '"น้ำหนักลดมาก + เบื่ออาหาร + ไม่ทราบสาเหตุ" → Rule out malignancy!'
          },
          {
            diagnosis: 'Tuberculosis', diagnosisTh: 'วัณโรค', frequency: 'med',
            keyClues: ['น้ำหนักลด + ไอเรื้อรัง + ไข้ + เหงื่อกลางคืน'],
            redFlags: ['TB แพร่กระจาย (Miliary TB)'],
            investigation: ['CXR', 'AFB sputum'],
            treatment: '2RHZE/4RH (6 เดือน)',
            firstLine: 'RIPE regimen',
            dontMiss: 'ดูรายละเอียดใน Pulmo section',
            examTip: 'ในไทย น้ำหนักลด + ไอ + ไข้ → อย่าลืม TB!'
          },
          {
            diagnosis: 'Adrenal Insufficiency', diagnosisTh: 'ต่อมหมวกไตทำงานน้อย', frequency: 'low',
            keyClues: ['น้ำหนักลด + อ่อนเพลีย + ผิวคล้ำ (hyperpigmentation)', 'ความดันต่ำ อยากกินเค็ม', 'เคยกินยา steroid นาน แล้วหยุดทันที'],
            redFlags: ['Adrenal crisis (ช็อค + Na ต่ำ + K สูง)'],
            investigation: ['Cortisol เช้าต่ำ', 'ACTH stimulation test'],
            treatment: 'Hydrocortisone replacement (ตลอดชีวิต) + Fludrocortisone (primary)',
            firstLine: 'Hydrocortisone 15-25mg/day แบ่ง 2-3 dose (เช้ามากกว่าเย็น)',
            dontMiss: 'Adrenal crisis → Hydrocortisone 100mg IV bolus + IV NS ด่วน! / Sick day rule: เพิ่ม dose 2-3 เท่า',
            examTip: '"อ่อนเพลีย + ผิวคล้ำ + BP ต่ำ + Na ต่ำ + K สูง" → Addison disease'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 7. HEMATO — ระบบเลือด
  // ═══════════════════════════════════════════
  {
    code: 'HEMATO',
    name: 'ระบบเลือด',
    nameEn: 'Hematology',
    icon: '🩸',
    color: '#dc2626',
    description: 'โรคเลือดจาง มะเร็งเลือด เกล็ดเลือด',
    symptoms: [
      {
        name: 'ซีด',
        nameEn: 'Anemia',
        differentials: [
          {
            diagnosis: 'Iron Deficiency Anemia (IDA)', diagnosisTh: 'ซีดจากขาดธาตุเหล็ก', frequency: 'high',
            keyClues: ['ซีด เหนื่อยง่าย', 'ลิ้นเลี่ยน เล็บช้อน (koilonychia)', 'ผู้หญิงประจำเดือนมาก / คนแก่ถ่ายเป็นเลือดแอบ'],
            redFlags: ['IDA ในผู้ชาย / หญิงหมดประจำเดือน → ต้อง rule out GI malignancy!'],
            investigation: ['CBC: Hb ต่ำ, MCV ต่ำ (microcytic), MCH ต่ำ', 'Ferritin ต่ำ, TIBC สูง, Serum iron ต่ำ', 'Peripheral smear: hypochromic microcytic'],
            treatment: 'Oral iron supplement + หาสาเหตุเลือดออก',
            firstLine: 'Ferrous sulfate 325mg tid (ก่อนอาหาร) + Vitamin C',
            dontMiss: 'IDA ในคนแก่ → colonoscopy + EGD (rule out GI malignancy!)',
            examTip: 'Microcytic anemia + Ferritin ต่ำ = IDA. ในคนแก่ต้องหาสาเหตุเลือดออก!'
          },
          {
            diagnosis: 'Thalassemia', diagnosisTh: 'ธาลัสซีเมีย', frequency: 'high',
            keyClues: ['ซีดเรื้อรังตั้งแต่เด็ก', 'ม้ามโต ตับโต', 'หน้าตาเปลี่ยน (frontal bossing) — beta-thal major'],
            redFlags: ['Iron overload จากให้เลือดบ่อย → หัวใจวาย'],
            investigation: ['CBC: MCV ต่ำมาก (แต่ RBC count สูง)', 'Hb typing / Hb electrophoresis', 'Ferritin สูง (ไม่ใช่ต่ำ!)'],
            treatment: 'Transfusion (major) + Iron chelation (Deferasirox) + Folic acid',
            firstLine: 'Regular transfusion (target Hb > 9-10) + Deferasirox',
            dontMiss: 'ห้ามให้ iron supplement! (iron overload จากเลือดอยู่แล้ว)',
            examTip: 'MCV ต่ำ + Ferritin ปกติ/สูง + RBC count สูง → Thalassemia (ไม่ใช่ IDA!)'
          },
          {
            diagnosis: 'Vitamin B12 / Folate Deficiency', diagnosisTh: 'ขาดวิตามิน B12 / โฟเลต', frequency: 'med',
            keyClues: ['ซีด + ลิ้นเลี่ยนแดง (glossitis)', 'ชาปลายมือปลายเท้า (B12 — neurological)', 'คนแก่ / มังสวิรัติ / ผ่าตัดกระเพาะ'],
            redFlags: ['Pancytopenia', 'Neurological damage ถาวร (B12)'],
            investigation: ['CBC: MCV สูง (macrocytic)', 'Serum B12 / Folate level', 'Peripheral smear: hypersegmented neutrophils'],
            treatment: 'B12 IM injection (1000mcg) / Folic acid PO',
            firstLine: 'Cyanocobalamin 1000mcg IM (B12) / Folic acid 1-5mg PO (folate)',
            dontMiss: 'ให้ B12 ก่อน Folic acid! ถ้าให้ folate อย่างเดียว → ซ่อน B12 deficiency → neurological damage!',
            examTip: 'Macrocytic anemia (MCV > 100) + hypersegmented neutrophils → B12/Folate deficiency'
          },
          {
            diagnosis: 'Hemolytic Anemia', diagnosisTh: 'เม็ดเลือดแดงแตก', frequency: 'med',
            keyClues: ['ซีด + ตัวเหลือง + ม้ามโต', 'ปัสสาวะสีเข้ม (hemoglobinuria)', 'LDH สูง, Haptoglobin ต่ำ, Reticulocyte สูง'],
            redFlags: ['Hemolytic crisis'],
            investigation: ['Reticulocyte count สูง', 'Indirect bilirubin สูง, LDH สูง, Haptoglobin ต่ำ', 'Coombs test (autoimmune)', 'Peripheral smear (spherocytes, schistocytes)'],
            treatment: 'ตามสาเหตุ: AIHA → Prednisolone / Splenectomy ถ้า refractory',
            firstLine: 'Prednisolone 1mg/kg/day (AIHA)',
            dontMiss: 'ถ้า Coombs (+) = Autoimmune → steroid / Coombs (-) → หาสาเหตุอื่น (TTP, HUS, DIC)',
            examTip: 'ซีด + Indirect bili สูง + Retic สูง + LDH สูง → Hemolysis'
          }
        ]
      },
      {
        name: 'ต่อมน้ำเหลืองโต',
        nameEn: 'Lymphadenopathy',
        differentials: [
          {
            diagnosis: 'Reactive (Infection)', diagnosisTh: 'จากการติดเชื้อ', frequency: 'high',
            keyClues: ['ต่อมโตเจ็บ นิ่ม', 'มีการติดเชื้อบริเวณใกล้เคียง', 'หายเองใน 2-4 สัปดาห์'],
            redFlags: [],
            investigation: ['สังเกตอาการ 2-4 สัปดาห์'],
            treatment: 'รักษาการติดเชื้อสาเหตุ + สังเกตอาการ 2-4 สัปดาห์',
            firstLine: 'ATB ถ้ามี infection',
            dontMiss: 'โต > 2 สัปดาห์ / ไม่เจ็บ / แข็ง → biopsy!',
            examTip: 'ต่อมน้ำเหลืองโต < 2 ซม. + เจ็บ + นิ่ม → มักเป็นจากติดเชื้อ'
          },
          {
            diagnosis: 'Lymphoma', diagnosisTh: 'มะเร็งต่อมน้ำเหลือง', frequency: 'high',
            keyClues: ['ต่อมโตไม่เจ็บ แข็ง ติดแน่น (fixed)', 'B symptoms: ไข้ + น้ำหนักลด + เหงื่อกลางคืน', 'คนอายุน้อยก็เป็นได้ (Hodgkin)'],
            redFlags: ['B symptoms', 'โตเร็ว'],
            investigation: ['Excisional biopsy (ตัดทั้งก้อนส่งตรวจ)', 'CT scan (staging)', 'CBC, LDH, ESR'],
            treatment: 'Hodgkin: ABVD chemo / Non-Hodgkin: R-CHOP',
            firstLine: 'ABVD (Hodgkin) / R-CHOP (DLBCL)',
            dontMiss: 'ต้อง excisional biopsy (ตัดทั้งก้อน) ไม่ใช่ FNA!',
            examTip: '"ต่อมน้ำเหลืองโตไม่เจ็บ + ไข้ + น้ำหนักลด + เหงื่อกลางคืน" → Lymphoma → biopsy!'
          },
          {
            diagnosis: 'Tuberculosis (TB Lymphadenitis)', diagnosisTh: 'วัณโรคต่อมน้ำเหลือง', frequency: 'med',
            keyClues: ['ต่อมน้ำเหลืองที่คอโตเรื้อรัง (cervical)', 'อาจเป็นก้อนรวมกัน (matted)', 'ไข้ต่ำๆ น้ำหนักลด'],
            redFlags: [],
            investigation: ['FNA / Biopsy (granuloma + AFB)', 'CXR'],
            treatment: '2RHZE/4RH เหมือน pulmonary TB',
            firstLine: 'Standard anti-TB regimen 6 เดือน',
            dontMiss: 'ต่อมอาจโตขึ้นชั่วคราวหลังเริ่มยา (paradoxical reaction) — ไม่ใช่ fail!',
            examTip: 'ต่อมน้ำเหลืองคอโตเรื้อรัง + matted ในไทย → TB lymphadenitis'
          },
          {
            diagnosis: 'Metastatic Cancer', diagnosisTh: 'มะเร็งแพร่กระจาย', frequency: 'med',
            keyClues: ['ต่อมโตแข็ง ติดแน่น ไม่เจ็บ', 'Virchow node (ซ้าย supraclavicular) = GI malignancy', 'น้ำหนักลด'],
            redFlags: ['พบมะเร็งแพร่กระจาย'],
            investigation: ['Biopsy', 'CT scan หา primary tumor'],
            treatment: 'หา primary → รักษาตาม primary tumor',
            firstLine: 'ขึ้นกับ primary tumor',
            dontMiss: 'Virchow node (ซ้าย supraclavicular) → คิดถึง GI CA',
            examTip: '"Left supraclavicular node (Virchow)" → ต้องคิดถึง GI malignancy (โดยเฉพาะ gastric CA)'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 8. ID — โรคติดเชื้อ
  // ═══════════════════════════════════════════
  {
    code: 'ID',
    name: 'โรคติดเชื้อ',
    nameEn: 'Infectious Disease',
    icon: '🦠',
    color: '#22c55e',
    description: 'โรคจากแบคทีเรีย ไวรัส เชื้อรา ปรสิต',
    symptoms: [
      {
        name: 'ไข้เฉียบพลัน',
        nameEn: 'Acute Fever',
        differentials: [
          {
            diagnosis: 'Dengue Fever', diagnosisTh: 'ไข้เลือดออก', frequency: 'high',
            keyClues: ['ไข้สูง 2-7 วัน + ปวดเมื่อยกล้ามเนื้อ/กระดูก', 'ผื่นแดง (petechiae)', 'WBC ต่ำ + เกล็ดเลือดต่ำ', 'Tourniquet test (+)'],
            redFlags: ['Dengue Shock Syndrome (DSS): ช็อค + plasma leakage', 'Dengue Hemorrhagic Fever (DHF): เลือดออก'],
            investigation: ['CBC serial (Hct สูงขึ้น = plasma leak)', 'Dengue NS1 Ag (วันที่ 1-5)', 'Dengue IgM/IgG (วันที่ 5+)'],
            treatment: 'Supportive! IV fluid (ถ้า DHF/DSS) + No aspirin/NSAIDs!',
            firstLine: 'Oral/IV fluid replacement + monitor Hct serial',
            dontMiss: 'ห้ามให้ Aspirin/NSAIDs! (เสี่ยงเลือดออก) / Critical phase = วันที่ไข้ลง (defervescence)',
            examTip: '"ไข้สูง + ปวดเมื่อย + WBC ต่ำ + Plt ต่ำ + ช่วงฝน" → Dengue. วันที่ 3-7 = critical phase!'
          },
          {
            diagnosis: 'Pneumonia', diagnosisTh: 'ปอดอักเสบ', frequency: 'high',
            keyClues: ['ไข้ + ไอมีเสมหะ + หายใจเหนื่อย', 'ฟังปอด crepitation'],
            redFlags: ['Sepsis', 'O2 sat < 90%'],
            investigation: ['CXR', 'CBC, CRP', 'Blood culture'],
            treatment: 'ATB ตาม CURB-65',
            firstLine: 'Amoxicillin (mild) / Co-amox + Azithromycin (moderate)',
            dontMiss: 'ดูรายละเอียดใน Pulmo section',
            examTip: 'ไข้ + ไอ + CXR มี infiltration → Pneumonia'
          },
          {
            diagnosis: 'UTI / Pyelonephritis', diagnosisTh: 'ทางเดินปัสสาวะอักเสบ', frequency: 'high',
            keyClues: ['ไข้ + ปัสสาวะแสบขัด + ปวดหลัง (pyelonephritis)', 'CVA tenderness (เคาะหลังเจ็บ)'],
            redFlags: ['Urosepsis'],
            investigation: ['UA + Urine culture', 'Blood culture (ถ้าสงสัย sepsis)'],
            treatment: 'ATB 7-14 วัน',
            firstLine: 'Ceftriaxone IV (pyelo) → switch to oral',
            dontMiss: 'ดูรายละเอียดใน Renal section',
            examTip: '"ไข้ + ปัสสาวะแสบ + เคาะหลังเจ็บ" → Pyelonephritis'
          },
          {
            diagnosis: 'Leptospirosis', diagnosisTh: 'โรคฉี่หนู', frequency: 'med',
            keyClues: ['ไข้ + ปวดน่อง (calf tenderness)', 'ตาแดง (conjunctival suffusion)', 'สัมผัสน้ำท่วม / ชาวนา'],
            redFlags: ['Weil disease (ตัวเหลือง + ไตวาย + เลือดออก)'],
            investigation: ['Leptospira IgM', 'CBC (เกล็ดเลือดต่ำ)', 'BUN/Cr, LFT'],
            treatment: 'ATB: Penicillin G IV (severe) / Doxycycline PO (mild)',
            firstLine: 'Penicillin G 1.5 MU IV q6h (severe) / Doxycycline 100mg bid (mild)',
            dontMiss: 'Jarisch-Herxheimer reaction อาจเกิดหลังเริ่ม ATB → supportive',
            examTip: '"ไข้ + ปวดน่อง + ตาแดง + สัมผัสน้ำท่วม" → Leptospirosis'
          },
          {
            diagnosis: 'Scrub Typhus', diagnosisTh: 'ไข้รากสาดใหญ่', frequency: 'med',
            keyClues: ['ไข้ + ผื่น + eschar (แผลเป็นตุ่มดำ)', 'เดินป่า / สัมผัสหญ้า', 'ไข้ไม่ลง + ให้ ATB ทั่วไปไม่ดีขึ้น'],
            redFlags: ['Meningoencephalitis', 'Multi-organ failure'],
            investigation: ['Scrub typhus IgM (Weil-Felix test)', 'หา eschar ตามตัว!'],
            treatment: 'Doxycycline (first-line!)',
            firstLine: 'Doxycycline 100mg bid x 7 วัน',
            dontMiss: 'ไข้ลงใน 24-48 ชม. หลังได้ Doxy → ถ้าไม่ลง → อาจไม่ใช่ scrub typhus',
            examTip: '"ไข้ + ผื่น + eschar + เดินป่า + ATB ไม่ดีขึ้น" → Scrub typhus → ให้ Doxycycline'
          }
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════
  // 9. MSK — กระดูกและข้อ
  // ═══════════════════════════════════════════
  {
    code: 'MSK',
    name: 'กระดูกและข้อ',
    nameEn: 'Musculoskeletal',
    icon: '🦴',
    color: '#a3a3a3',
    description: 'โรคข้อ กระดูก กล้ามเนื้อ ภูมิคุ้มกัน',
    symptoms: [
      {
        name: 'ปวดข้อ',
        nameEn: 'Arthralgia / Arthritis',
        differentials: [
          {
            diagnosis: 'Gout', diagnosisTh: 'โรคเกาต์', frequency: 'high',
            keyClues: ['ปวดข้อรุนแรง ทันที มักเป็นหัวแม่เท้า (1st MTP — podagra)', 'ข้อบวมแดงร้อน', 'ผู้ชาย ดื่มเบียร์ กินเนื้อ/เครื่องในสัตว์'],
            redFlags: ['Septic arthritis (ต้องแยก!)'],
            investigation: ['Joint aspiration: monosodium urate crystals (needle-shaped, negative birefringence)', 'Serum uric acid (อาจปกติตอนกำเริบ!)'],
            treatment: 'Acute: Colchicine / NSAIDs / Steroid → Chronic: Allopurinol',
            firstLine: 'Acute: Colchicine 0.6mg bid หรือ Indomethacin / Chronic: Allopurinol 100mg → titrate',
            dontMiss: 'ห้ามเริ่ม Allopurinol ตอน acute attack! ทำให้แย่ลง! รอ 2-4 สัปดาห์หลังหาย',
            examTip: '"ปวดหัวแม่เท้ารุนแรงทันที + บวมแดง" → Gout (podagra). Crystal = needle-shaped!'
          },
          {
            diagnosis: 'Septic Arthritis', diagnosisTh: 'ข้ออักเสบติดเชื้อ', frequency: 'high',
            keyClues: ['ข้อบวมแดงร้อน + ไข้', 'มักเป็นข้อเดียว (monoarthritis)', 'ขยับข้อเจ็บมาก ไม่ยอมขยับ'],
            redFlags: ['ถ้าไม่รักษาด่วน → ข้อพัง!'],
            investigation: ['Joint aspiration + Gram stain + Culture (ต้องทำ!)', 'WBC ในน้ำข้อ > 50,000', 'Blood culture'],
            treatment: 'ATB IV ด่วน + Joint drainage (aspiration/surgical)',
            firstLine: 'Flucloxacillin/Nafcillin IV (Staph) + Joint aspiration/washout',
            dontMiss: 'ต้อง joint aspiration ก่อนให้ ATB! / ถ้าไม่รักษาด่วน → ข้อพัง!',
            examTip: '"ข้อบวมแดงร้อน + ไข้" → ต้อง joint aspiration ทุกครั้ง! (rule out septic joint)'
          },
          {
            diagnosis: 'Rheumatoid Arthritis (RA)', diagnosisTh: 'ข้ออักเสบรูมาตอยด์', frequency: 'high',
            keyClues: ['ปวดข้อหลายข้อ สมมาตร (symmetric polyarthritis)', 'ข้อมือ ข้อนิ้วมือ (MCP, PIP)', 'ข้อฝืดตอนเช้า > 1 ชม. (morning stiffness)'],
            redFlags: ['ข้อผิดรูป (swan neck, boutonniere, ulnar deviation)'],
            investigation: ['RF (Rheumatoid Factor)', 'Anti-CCP antibody', 'ESR, CRP สูง', 'X-ray มือ (erosion)'],
            treatment: 'Methotrexate (first-line DMARD) + NSAIDs (symptom) + Biologic (refractory)',
            firstLine: 'Methotrexate 7.5-25mg/week + Folic acid supplement',
            dontMiss: 'Methotrexate → ตรวจ LFT + CBC ทุก 1-3 เดือน! / ห้ามในตั้งครรภ์!',
            examTip: '"ปวดข้อมือ+ข้อนิ้ว สมมาตร + ข้อฝืดเช้า > 1 ชม." → RA'
          },
          {
            diagnosis: 'Osteoarthritis (OA)', diagnosisTh: 'ข้อเสื่อม', frequency: 'high',
            keyClues: ['ปวดข้อ มากขึ้นเมื่อใช้งาน ดีขึ้นเมื่อพัก', 'ข้อเข่า สะโพก (weight-bearing joints)', 'คนแก่ อ้วน', "Heberden's node (DIP) / Bouchard's node (PIP)"],
            redFlags: [],
            investigation: ['X-ray (joint space narrowing + osteophytes)', 'ไม่ต้อง lab (ESR/CRP ปกติ)'],
            treatment: 'Exercise + Weight loss + Paracetamol + NSAIDs + Intra-articular injection + TKR',
            firstLine: 'Paracetamol + Exercise + Weight management',
            dontMiss: 'NSAIDs ระวังในคนแก่ + โรคไต + แผลในกระเพาะ!',
            examTip: 'OA vs RA: OA = ใช้งานแล้วปวด, ข้อใหญ่ / RA = ตื่นเช้าข้อแข็ง, ข้อเล็ก, symmetric'
          },
          {
            diagnosis: 'Systemic Lupus Erythematosus (SLE)', diagnosisTh: 'โรคพุ่มพวง', frequency: 'med',
            keyClues: ['ผู้หญิงวัยเจริญพันธุ์', 'ปวดข้อ + ผื่นรูปผีเสื้อ (butterfly/malar rash)', 'ไข้ ผมร่วง แผลในปาก ปวดข้อ'],
            redFlags: ['Lupus nephritis (ไตอักเสบ)', 'Cerebral lupus (ชัก สับสน)'],
            investigation: ['ANA (positive > 95%)', 'Anti-dsDNA, Anti-Smith', 'CBC (pancytopenia)', 'UA (proteinuria)'],
            treatment: 'Hydroxychloroquine (ทุกคน!) + Steroid (flare) + Immunosuppressant (organ involvement)',
            firstLine: 'Hydroxychloroquine 200-400mg/day (ทุกคนทุก stage!)',
            dontMiss: 'HCQ → ตรวจตาทุกปี (retinal toxicity!) / Lupus nephritis → Mycophenolate + Steroid',
            examTip: '"ผู้หญิง + ผื่นรูปผีเสื้อ + ปวดข้อ + proteinuria" → SLE'
          }
        ]
      }
    ]
  }
]

module.exports = { categories }
