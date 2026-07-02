<template>
  <div class="admin-page">
    <!-- Hero Header -->
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h1>NINJA DDx</h1>
            <p>เตรียมสอบ NL2 — วินิจฉัย + รักษา ครบจบในที่เดียว</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Progress Bar -->
      <div class="progress-bar-wrap">
        <div class="progress-label">บทเรียน {{ currentStep }}/{{ totalSteps }}</div>
        <div class="progress-track"><div class="progress-fill" :style="{ width: (currentStep / totalSteps * 100) + '%' }"></div></div>
      </div>

      <!-- ═══ Step 1: หมอทำอะไรเมื่อเจอคนไข้? ═══ -->
      <div v-if="currentStep === 1" class="step-card">
        <div class="step-badge">Step 1</div>
        <h2>หมอทำอะไรเมื่อเจอคนไข้?</h2>

        <div class="story-box">
          <div class="story-scene">
            <div class="person patient">🤒</div>
            <div class="speech-bubble patient-bubble">หมอคะ หนูปวดท้องมากเลย</div>
          </div>
          <div class="story-scene reverse">
            <div class="speech-bubble doctor-bubble">ปวดท้อง... อาจเป็นได้หลายโรค ต้องคิดทีละตัว</div>
            <div class="person doctor">👨‍⚕️</div>
          </div>
        </div>

        <div class="explain-box">
          <h3>สิ่งที่หมอทำในหัว (ภายใน 5 วินาที):</h3>
          <div class="think-steps">
            <div class="think-step">
              <span class="think-num">1</span>
              <div>
                <strong>ฟังอาการ</strong>
                <p>คนไข้บอกอะไร? → "ปวดท้อง"</p>
              </div>
            </div>
            <div class="think-step">
              <span class="think-num">2</span>
              <div>
                <strong>นึกถึงโรคที่เป็นไปได้ทั้งหมด</strong>
                <p>ปวดท้อง อาจเป็น... ไส้ติ่ง? ตับอ่อน? ถุงน้ำดี? ลำไส้อุดตัน? ท้องนอกมดลูก?</p>
              </div>
            </div>
            <div class="think-step">
              <span class="think-num">3</span>
              <div>
                <strong>ไล่ตัดออกทีละโรค</strong>
                <p>ถามเพิ่ม + ตรวจร่างกาย + ส่งแลป → จนเหลือโรคที่ใช่</p>
              </div>
            </div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">💡</span>
          <div>
            <strong>ขั้นตอนที่ 2 นี่แหละ ที่เรียกว่า "DDx"</strong>
            <p>DDx = Differential Diagnosis = การนึกถึงโรคที่เป็นไปได้ทั้งหมดจากอาการเดียว</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 2: DDx คืออะไร? ═══ -->
      <div v-if="currentStep === 2" class="step-card">
        <div class="step-badge">Step 2</div>
        <h2>DDx คืออะไร? (ง่ายมาก)</h2>

        <div class="analogy-box">
          <h3>เปรียบเทียบกับชีวิตจริง:</h3>
          <div class="analogy-grid">
            <div class="analogy-item">
              <div class="analogy-icon">🚗</div>
              <div class="analogy-text">
                <strong>รถไม่สตาร์ท → นึกถึง...</strong>
                <div class="analogy-list">
                  <span>แบตหมด</span>
                  <span>น้ำมันหมด</span>
                  <span>หัวเทียนเสีย</span>
                  <span>สายไฟหลุด</span>
                </div>
                <p class="analogy-note">ช่างจะไล่เช็คทีละจุดจนเจอ</p>
              </div>
            </div>
            <div class="analogy-item highlight">
              <div class="analogy-icon">🏥</div>
              <div class="analogy-text">
                <strong>ปวดท้อง → นึกถึง...</strong>
                <div class="analogy-list med">
                  <span>ไส้ติ่งอักเสบ</span>
                  <span>ตับอ่อนอักเสบ</span>
                  <span>ถุงน้ำดีอักเสบ</span>
                  <span>ลำไส้อุดตัน</span>
                </div>
                <p class="analogy-note">หมอจะไล่ถาม + ตรวจ + ส่งแลปจนเจอ</p>
              </div>
            </div>
          </div>
        </div>

        <div class="vocab-box">
          <h3>คำศัพท์ที่ต้องรู้ (แค่ 4 คำ):</h3>
          <div class="vocab-grid">
            <div class="vocab-item">
              <span class="vocab-term">DDx</span>
              <span class="vocab-full">Differential Diagnosis</span>
              <span class="vocab-thai">= รายชื่อโรคที่เป็นไปได้ทั้งหมด</span>
            </div>
            <div class="vocab-item">
              <span class="vocab-term">Approach</span>
              <span class="vocab-full">Clinical Approach</span>
              <span class="vocab-thai">= วิธีคิดเป็นระบบเมื่อเจออาการหนึ่ง</span>
            </div>
            <div class="vocab-item">
              <span class="vocab-term">Chief Complaint</span>
              <span class="vocab-full">C/C</span>
              <span class="vocab-thai">= อาการหลักที่คนไข้มาหาหมอ เช่น "ปวดท้อง"</span>
            </div>
            <div class="vocab-item">
              <span class="vocab-term">NL Exam</span>
              <span class="vocab-full">National License</span>
              <span class="vocab-thai">= สอบใบประกอบวิชาชีพแพทย์ (ต้องผ่านถึงเป็นหมอได้)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Step 3: ลองดูตัวอย่างจริง ═══ -->
      <div v-if="currentStep === 3" class="step-card">
        <div class="step-badge">Step 3</div>
        <h2>ลองดูตัวอย่างจริง</h2>
        <p>กดที่แต่ละโรคเพื่อดูรายละเอียด — <strong>ลองกดเปิดดูสัก 2-3 ตัว</strong></p>

        <div class="example-approach">
          <div class="example-header">
            <div>
              <div class="example-label">อาการ (Chief Complaint)</div>
              <span class="example-symptom">ปวดท้อง</span>
              <span class="example-en">Abdominal Pain</span>
            </div>
            <span class="example-cat">หมวด: ทางเดินอาหาร (GI)</span>
          </div>

          <div class="ddx-intro">
            <span class="ddx-intro-icon">👇</span>
            DDx ทั้งหมดที่ต้องนึกถึงเมื่อเจอ "ปวดท้อง" — กดเปิดดูได้เลย
          </div>

          <div v-for="(ddx, i) in exampleDdx" :key="i" class="ddx-card" :class="{ expanded: ddx.open }">
            <div class="ddx-header" @click="ddx.open = !ddx.open">
              <div class="ddx-left">
                <span class="ddx-num">{{ i + 1 }}</span>
                <span :class="['freq-badge', ddx.frequency]">{{ { high: 'ออกสอบบ่อย', med: 'ออกบ้าง', low: 'ออกน้อย' }[ddx.frequency] }}</span>
                <span class="ddx-name">{{ ddx.diagnosis }}</span>
                <span class="ddx-name-th">{{ ddx.diagnosisTh }}</span>
              </div>
              <span class="ddx-toggle">{{ ddx.open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="ddx.open" class="ddx-body">
              <div class="ddx-section">
                <span class="ddx-label">🔍 เบาะแส (Key Clues) — เห็นสิ่งนี้ ให้นึกถึงโรคนี้!</span>
                <div class="ddx-tags">
                  <span v-for="c in ddx.keyClues" :key="c" class="tag clue">{{ c }}</span>
                </div>
              </div>
              <div v-if="ddx.redFlags.length" class="ddx-section">
                <span class="ddx-label">🚨 สัญญาณอันตราย (Red Flags) — เจอสิ่งนี้ = อันตราย ต้องรีบ!</span>
                <div class="ddx-tags">
                  <span v-for="r in ddx.redFlags" :key="r" class="tag red-flag">{{ r }}</span>
                </div>
              </div>
              <div class="ddx-section">
                <span class="ddx-label">🔬 ส่งตรวจอะไร (Investigation)</span>
                <div class="ddx-tags">
                  <span v-for="inv in ddx.investigation" :key="inv" class="tag invest">{{ inv }}</span>
                </div>
              </div>
              <div v-if="ddx.examTip" class="ddx-section tip-box">
                <span class="ddx-label">💡 เทคนิคสอบ NL — จำไว้ได้คะแนน!</span>
                <p>{{ ddx.examTip }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">✅</span>
          <div>
            <strong>นี่คือ "1 Approach" = อาการ 1 ตัว + DDx หลายตัว + เบาะแสแต่ละโรค</strong>
            <p>ข้อสอบ NL จะมีอาการแบบนี้ ~40-50 อาการ ที่นักเรียนต้องจำได้</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 4: โครงสร้างข้อมูล ═══ -->
      <div v-if="currentStep === 4" class="step-card">
        <div class="step-badge">Step 4</div>
        <h2>ข้อมูลที่ต้องใส่ในระบบ</h2>
        <p>สรุปง่ายๆ — แต่ละ Approach ที่ต้องสร้าง มีข้อมูลแค่นี้:</p>

        <div class="data-structure">
          <div class="data-level level-1">
            <div class="data-header">
              <span class="data-icon">📌</span>
              <strong>1. ชื่ออาการ</strong>
            </div>
            <div class="data-example">เช่น "ปวดท้อง" / "เจ็บหน้าอก" / "ปวดศีรษะ"</div>
            <div class="data-note">1 อาการ = 1 Approach</div>
          </div>

          <div class="data-arrow">▼</div>

          <div class="data-level level-2">
            <div class="data-header">
              <span class="data-icon">📂</span>
              <strong>2. หมวดหมู่</strong>
            </div>
            <div class="data-example">จัดกลุ่มตามระบบร่างกาย เช่น GI (ทางเดินอาหาร), Cardio (หัวใจ)</div>
          </div>

          <div class="data-arrow">▼</div>

          <div class="data-level level-3">
            <div class="data-header">
              <span class="data-icon">📋</span>
              <strong>3. รายชื่อ DDx (โรคที่เป็นไปได้)</strong>
            </div>
            <div class="data-example">แต่ละอาการมี DDx ประมาณ 5-15 โรค</div>
            <div class="data-note">เรียงจากออกสอบบ่อย → น้อย</div>
          </div>

          <div class="data-arrow">▼</div>

          <div class="data-level level-4">
            <div class="data-header">
              <span class="data-icon">🔎</span>
              <strong>4. รายละเอียดแต่ละ DDx</strong>
            </div>
            <div class="data-detail-grid">
              <div class="data-detail-item">
                <span class="dd-label">🔍 Key Clues</span>
                <span class="dd-desc">เบาะแส เห็นปุ๊บนึกถึงโรคนี้</span>
              </div>
              <div class="data-detail-item red">
                <span class="dd-label">🚨 Red Flags</span>
                <span class="dd-desc">อันตราย ต้องรีบ (ถ้ามี)</span>
              </div>
              <div class="data-detail-item">
                <span class="dd-label">🔬 Investigation</span>
                <span class="dd-desc">ส่งตรวจอะไรยืนยัน</span>
              </div>
              <div class="data-detail-item tip">
                <span class="dd-label">💡 Exam Tip</span>
                <span class="dd-desc">เทคนิคตอบข้อสอบ NL</span>
              </div>
              <div class="data-detail-item">
                <span class="dd-label">🎯 ความถี่</span>
                <span class="dd-desc">ออกสอบบ่อย / ปานกลาง / น้อย</span>
              </div>
            </div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">📝</span>
          <div>
            <strong>ข้อมูลพวกนี้มาจากไหน?</strong>
            <p>มาจากเอกสารที่พี่มีอยู่แล้ว — เราจะ import เข้าระบบได้ หรือจะพิมพ์ใส่ทีละตัวก็ได้</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 5: เปิดดู DDx ทุกอาการ ═══ -->
      <div v-if="currentStep === 5" class="step-card">
        <div class="step-badge">Step 5</div>
        <h2>เปิดดู DDx ครบทุกอาการ</h2>
        <p>เลือกระบบ → เลือกอาการ → ดู DDx ทั้งหมดพร้อมเบาะแสจำ</p>

        <!-- Category pills -->
        <div class="browse-cats">
          <button v-for="cat in allCategories" :key="cat.code" :class="['browse-cat-btn', { active: selectedCatCode === cat.code }]" :style="selectedCatCode === cat.code ? { background: cat.color, borderColor: cat.color } : {}" @click="selectCategory(cat.code)">
            {{ cat.icon }} {{ cat.name }}
            <span class="browse-cat-count">{{ cat.symptoms.length }}</span>
          </button>
        </div>

        <!-- Symptom list -->
        <div v-if="selectedCategory" class="browse-symptoms">
          <button v-for="(sym, idx) in selectedCategory.symptoms" :key="sym.nameEn" :class="['browse-sym-btn', { active: selectedSymptomIdx === idx }]" @click="selectSymptom(idx)">
            <span class="browse-sym-name">{{ sym.name }}</span>
            <span class="browse-sym-en">{{ sym.nameEn }}</span>
            <span class="browse-sym-ddx">{{ sym.differentials.length }} DDx</span>
          </button>
        </div>

        <!-- DDx detail -->
        <div v-if="selectedSymptom" class="example-approach">
          <div class="example-header">
            <div>
              <div class="example-label">อาการ (Chief Complaint)</div>
              <span class="example-symptom">{{ selectedSymptom.name }}</span>
              <span class="example-en">{{ selectedSymptom.nameEn }}</span>
            </div>
            <span class="example-cat">{{ selectedCategory.icon }} {{ selectedCategory.name }}</span>
          </div>
          <div class="ddx-intro">
            <span class="ddx-intro-icon">👇</span>
            DDx ทั้งหมด {{ selectedSymptom.differentials.length }} ตัว — กดเปิดดูเบาะแส + เทคนิคสอบ
          </div>
          <div v-for="(ddx, i) in selectedSymptom.differentials" :key="i" class="ddx-card">
            <div class="ddx-header" @click="toggleDdx(ddx)">
              <div class="ddx-left">
                <span class="ddx-num">{{ i + 1 }}</span>
                <span :class="['freq-badge', ddx.frequency]">{{ { high: 'ออกสอบบ่อย', med: 'ออกบ้าง', low: 'ออกน้อย' }[ddx.frequency] }}</span>
                <span class="ddx-name">{{ ddx.diagnosis }}</span>
                <span class="ddx-name-th">{{ ddx.diagnosisTh }}</span>
              </div>
              <span class="ddx-toggle">{{ ddx.open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="ddx.open" class="ddx-body">
              <div class="ddx-section">
                <span class="ddx-label">🔍 เบาะแส (Key Clues)</span>
                <div class="ddx-tags"><span v-for="c in ddx.keyClues" :key="c" class="tag clue">{{ c }}</span></div>
              </div>
              <div v-if="ddx.redFlags && ddx.redFlags.length" class="ddx-section">
                <span class="ddx-label">🚨 สัญญาณอันตราย (Red Flags)</span>
                <div class="ddx-tags"><span v-for="r in ddx.redFlags" :key="r" class="tag red-flag">{{ r }}</span></div>
              </div>
              <div class="ddx-section">
                <span class="ddx-label">🔬 ส่งตรวจ (Investigation)</span>
                <div class="ddx-tags"><span v-for="inv in ddx.investigation" :key="inv" class="tag invest">{{ inv }}</span></div>
              </div>
              <div v-if="ddx.treatment" class="ddx-section treat-box">
                <span class="ddx-label">💊 การรักษา (Treatment)</span>
                <p>{{ ddx.treatment }}</p>
              </div>
              <div v-if="ddx.firstLine" class="ddx-section drug-box">
                <span class="ddx-label">🥇 First-line</span>
                <p>{{ ddx.firstLine }}</p>
              </div>
              <div v-if="ddx.dontMiss" class="ddx-section warn-box">
                <span class="ddx-label">⛔ ห้ามลืม / ข้อห้าม</span>
                <p>{{ ddx.dontMiss }}</p>
              </div>
              <div v-if="ddx.examTip" class="ddx-section tip-box">
                <span class="ddx-label">💡 เทคนิคสอบ NL2</span>
                <p>{{ ddx.examTip }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="!selectedCategory" class="total-box">
          <div class="total-num">{{ totalSymptoms }}</div>
          <div class="total-label">อาการ ครอบคลุม {{ allCategories.length }} ระบบ</div>
          <div class="total-sub">เลือกระบบด้านบนเพื่อเริ่มเรียน</div>
        </div>
      </div>

      <!-- ═══ Step 6: นักเรียนใช้ยังไง ═══ -->
      <div v-if="currentStep === 6" class="step-card">
        <div class="step-badge">Step 6</div>
        <h2>นักเรียนจะใช้ยังไง?</h2>

        <div class="mode-grid">
          <div class="mode-card read-mode">
            <div class="mode-badge">โหมดที่ 1</div>
            <div class="mode-icon">📖</div>
            <h3>อ่านสรุป</h3>
            <p>เปิดอ่าน Approach เหมือนที่พี่เพิ่งลองดูใน Step 3</p>
            <div class="mode-flow">
              <span class="mf">เลือกอาการ</span>
              <span class="mf-arrow">→</span>
              <span class="mf">เห็น DDx ทั้งหมด</span>
              <span class="mf-arrow">→</span>
              <span class="mf">กดดูเบาะแสแต่ละโรค</span>
            </div>
            <div class="mode-who">เหมาะกับ: อ่านครั้งแรก / ทบทวนก่อนสอบ</div>
          </div>

          <div class="mode-card practice-mode">
            <div class="mode-badge">โหมดที่ 2</div>
            <div class="mode-icon">✍️</div>
            <h3>ฝึกตอบ</h3>
            <p>ระบบให้อาการ → นักเรียนต้องพิมพ์ DDx เอง → ระบบตรวจให้</p>
            <div class="mode-flow">
              <span class="mf">"ปวดท้อง → นึกถึง?"</span>
              <span class="mf-arrow">→</span>
              <span class="mf">พิมพ์คำตอบ</span>
              <span class="mf-arrow">→</span>
              <span class="mf">ดูคะแนน + เฉลย</span>
            </div>
            <div class="mode-who">เหมาะกับ: ฝึกจนชิน / ก่อนสอบ 1-2 สัปดาห์</div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">🧠</span>
          <div>
            <strong>ทำไมต้องมี "ฝึกตอบ"?</strong>
            <p>เพราะ<strong>การอ่านอย่างเดียวจำไม่ได้</strong> — งานวิจัยพบว่า Active Recall (ฝึกนึกเอง) จำได้ดีกว่าอ่านซ้ำ 3 เท่า</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 7: Spaced Repetition ═══ -->
      <div v-if="currentStep === 7" class="step-card">
        <div class="step-badge">Step 7</div>
        <h2>ระบบทบทวนอัตโนมัติ</h2>
        <p>NINJA DDx จะ<strong>กำหนดรอบทบทวนให้อัตโนมัติ</strong> ไม่ต้องจำเองว่าต้องกลับมาทบทวนอันไหน</p>

        <div class="sr-example">
          <h3>ตัวอย่าง: นักเรียนฝึก "ปวดท้อง"</h3>
          <div class="sr-timeline">
            <div class="sr-day">
              <span class="sr-day-label">วันที่ 1</span>
              <div class="sr-event">ฝึกครั้งแรก — ได้ 40%</div>
              <div class="sr-result bad">ยังจำไม่ค่อยได้</div>
              <div class="sr-next">→ กลับมาทบทวน <strong>พรุ่งนี้</strong></div>
            </div>
            <div class="sr-day">
              <span class="sr-day-label">วันที่ 2</span>
              <div class="sr-event">ฝึกอีกรอบ — ได้ 70%</div>
              <div class="sr-result ok">ดีขึ้น แต่ยังตกบางตัว</div>
              <div class="sr-next">→ กลับมาทบทวนอีก <strong>3 วัน</strong></div>
            </div>
            <div class="sr-day">
              <span class="sr-day-label">วันที่ 5</span>
              <div class="sr-event">ฝึกอีกรอบ — ได้ 90%</div>
              <div class="sr-result good">เก่งมาก!</div>
              <div class="sr-next">→ กลับมาทบทวนอีก <strong>7 วัน</strong></div>
            </div>
            <div class="sr-day">
              <span class="sr-day-label">วันที่ 12</span>
              <div class="sr-event">ฝึกอีกรอบ — ได้ 95%</div>
              <div class="sr-result great">จำได้ถาวร!</div>
              <div class="sr-next">→ กลับมาทบทวนอีก <strong>21 วัน</strong></div>
            </div>
          </div>
        </div>

        <div class="sr-flow">
          <div class="sr-step">
            <div class="sr-badge new">NEW</div>
            <div>ยังไม่เคยฝึก</div>
          </div>
          <div class="sr-arrow">→</div>
          <div class="sr-step">
            <div class="sr-badge learning">LEARNING</div>
            <div>ฝึกแล้ว ยังไม่ชิน</div>
          </div>
          <div class="sr-arrow">→</div>
          <div class="sr-step">
            <div class="sr-badge reviewing">REVIEWING</div>
            <div>จำได้ ทบทวนห่างขึ้นเรื่อยๆ</div>
          </div>
          <div class="sr-arrow">→</div>
          <div class="sr-step">
            <div class="sr-badge mastered">MASTERED</div>
            <div>ชินแล้ว จำได้ถาวร!</div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">🎯</span>
          <div>
            <strong>นี่คือจุดขายหลักของ NINJA DDx</strong>
            <p>"ฝึกจนชิน ตอบได้เร็ว" — ระบบบังคับทบทวนอัตโนมัติ ไม่ให้ลืม</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 8: จุดขาย ═══ -->
      <div v-if="currentStep === 8" class="step-card">
        <div class="step-badge">Step 8</div>
        <h2>สรุป: NINJA DDx ขายอะไร?</h2>

        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-icon">📚</div>
            <h3>เนื้อหาครบ</h3>
            <p>~40-50 อาการที่ออกสอบ NL ครบทุกระบบ</p>
          </div>
          <div class="summary-item">
            <div class="summary-icon">📖</div>
            <h3>อ่านสรุปได้</h3>
            <p>เปิดดู DDx + เบาะแส + เทคนิคสอบทุกอาการ</p>
          </div>
          <div class="summary-item">
            <div class="summary-icon">✍️</div>
            <h3>ฝึกตอบได้</h3>
            <p>ให้อาการ → พิมพ์ DDx เอง → ตรวจ + เฉลยทันที</p>
          </div>
          <div class="summary-item">
            <div class="summary-icon">🔄</div>
            <h3>ทบทวนอัตโนมัติ</h3>
            <p>ระบบจัดรอบให้ ไม่มีทางลืม</p>
          </div>
          <div class="summary-item">
            <div class="summary-icon">📊</div>
            <h3>รู้จุดอ่อน</h3>
            <p>แสดง progress: อันไหนชินแล้ว อันไหนยังต้องฝึก</p>
          </div>
          <div class="summary-item">
            <div class="summary-icon">🏆</div>
            <h3>Gamification</h3>
            <p>Streak, Belt System, Speed Mode — สนุก ท้าทาย อยากเปิดทุกวัน</p>
          </div>
        </div>

        <div class="lineup-box">
          <h3>Product Lineup ของ MedNinja:</h3>
          <div class="lineup-items">
            <div class="lineup-item">
              <span class="lineup-name">NINJA LMS</span>
              <span class="lineup-desc">เรียน VDO</span>
            </div>
            <div class="lineup-item">
              <span class="lineup-name">NINJA LIVE STUDIO</span>
              <span class="lineup-desc">เรียน Live</span>
            </div>
            <div class="lineup-item">
              <span class="lineup-name">NINJA NLEX</span>
              <span class="lineup-desc">ฝึกข้อสอบ</span>
            </div>
            <div class="lineup-item active">
              <span class="lineup-name">NINJA DDx</span>
              <span class="lineup-desc">ฝึก Approach อาการ</span>
              <span class="lineup-new">NEW</span>
            </div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">🚀</span>
          <div>
            <strong>ขั้นตอนถัดไป</strong>
            <p>พี่เข้าใจระบบแล้ว — พร้อมจะเริ่มสร้าง Admin จัดการเนื้อหา + หน้านักเรียน!</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 9: Pattern จำเร็ว ═══ -->
      <div v-if="currentStep === 9" class="step-card">
        <div class="step-badge">Step 9</div>
        <h2>Pattern จำเร็ว — "เห็นอะไร → นึกถึงอะไร"</h2>
        <p>ข้อสอบ NL ชอบให้ข้อมูล → ต้องตอบโรคได้ทันที จำ pattern พวกนี้ไว้!</p>

        <div class="cheat-filter">
          <button v-for="cat in cheatCategories" :key="cat" :class="['cf-btn', { active: cheatFilter === cat }]" @click="cheatFilter = cat">
            {{ cat === 'ALL' ? 'ทั้งหมด' : cat }}
          </button>
        </div>

        <div class="pattern-list">
          <div v-for="(item, i) in filteredMustKnow" :key="i" class="pattern-card">
            <div class="pattern-q">
              <span class="pattern-num">{{ i + 1 }}</span>
              <span class="pattern-cat-badge">{{ item.category }}</span>
              <div class="pattern-text">{{ item.pattern }}</div>
            </div>
            <div class="pattern-a">
              <span class="pattern-arrow">→</span>
              <strong>{{ item.answer }}</strong>
            </div>
            <div class="pattern-memo">
              <span class="memo-icon">💡</span>
              <span>จำ: {{ item.mnemonic }}</span>
            </div>
          </div>
        </div>

        <div class="key-point">
          <span class="key-icon">🎯</span>
          <div>
            <strong>มีทั้งหมด {{ mustKnow.length }} patterns ที่ต้องจำ</strong>
            <p>จำได้ครบ = ตอบข้อสอบ DDx ได้เกือบทุกข้อ</p>
          </div>
        </div>
      </div>

      <!-- ═══ Step 10: กฎทอง + คู่สับสน ═══ -->
      <div v-if="currentStep === 10" class="step-card">
        <div class="step-badge">Step 10</div>
        <h2>กฎทอง + คู่สับสน</h2>

        <h3 class="section-title">🏆 กฎทอง — ห้ามลืม ทำทันที!</h3>
        <p>สิ่งที่หมอต้องทำทันทีเมื่อเจอสถานการณ์นี้ ผิด = คนไข้ตาย</p>
        <div class="golden-list">
          <div v-for="(g, i) in goldenRules" :key="i" class="golden-card">
            <div class="golden-left">
              <span class="golden-num">{{ i + 1 }}</span>
              <div>
                <div class="golden-rule">{{ g.rule }}</div>
                <div class="golden-action">{{ g.action }}</div>
              </div>
            </div>
            <div class="golden-why">{{ g.why }}</div>
          </div>
        </div>

        <h3 class="section-title" style="margin-top:32px">🔀 คู่ที่ชอบสับสน — แยกยังไง?</h3>
        <p>ข้อสอบชอบถามให้แยก 2 โรคที่คล้ายกัน</p>
        <div class="pairs-list">
          <div v-for="(p, pi) in confusingPairs" :key="pi" class="pair-card">
            <div class="pair-title">{{ p.pair }}</div>
            <table class="pair-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{{ p.pair.split(' vs ')[0] }}</th>
                  <th>{{ p.pair.split(' vs ')[1] }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, di) in p.diff" :key="di">
                  <td class="pair-feature">{{ d.feature }}</td>
                  <td>{{ d.a }}</td>
                  <td>{{ d.b }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ═══ Step 11: ทดสอบตัวเอง ═══ -->
      <div v-if="currentStep === 11" class="step-card">
        <div class="step-badge">Step 11</div>
        <h2>ทดสอบตัวเอง — เก่งแค่ไหนแล้ว?</h2>

        <div v-if="!quizStarted" class="quiz-intro">
          <p>ระบบจะสุ่ม 15 คำถาม จาก Pattern จำเร็ว — ดูอาการแล้วนึกถึงโรคอะไร?</p>
          <button class="quiz-start-btn" @click="startQuiz">เริ่มทดสอบ (15 ข้อ)</button>
        </div>

        <div v-else-if="!quizDone" class="quiz-active">
          <div class="quiz-progress">ข้อ {{ quizIdx + 1 }} / {{ quizTotal }}</div>
          <div class="quiz-question">
            <div class="quiz-q-label">เห็นสิ่งนี้:</div>
            <div class="quiz-q-text">{{ quizItems[quizIdx].pattern }}</div>
          </div>

          <div v-if="!quizShowAnswer" class="quiz-think">
            <p>คิดคำตอบในใจก่อน... แล้วกด</p>
            <button class="quiz-reveal-btn" @click="quizReveal">ดูคำตอบ</button>
          </div>

          <div v-else class="quiz-answer-box">
            <div class="quiz-answer">
              <span class="quiz-arrow">→</span>
              <strong>{{ quizItems[quizIdx].answer }}</strong>
            </div>
            <div class="quiz-memo">💡 จำ: {{ quizItems[quizIdx].mnemonic }}</div>
            <div class="quiz-self">
              <p>ตอบถูกไหม?</p>
              <button class="quiz-btn correct" @click="quizNext(true)">✅ ถูก</button>
              <button class="quiz-btn wrong" @click="quizNext(false)">❌ ผิด</button>
            </div>
          </div>
        </div>

        <div v-else class="quiz-result">
          <div class="quiz-score-circle" :class="{ good: quizScore >= 12, ok: quizScore >= 8 && quizScore < 12, bad: quizScore < 8 }">
            <div class="quiz-score-num">{{ quizScore }}</div>
            <div class="quiz-score-total">/ {{ quizTotal }}</div>
          </div>
          <div class="quiz-verdict" v-if="quizScore >= 12">🎉 เก่งมาก! พร้อมสอบ NL ในส่วน DDx แล้ว!</div>
          <div class="quiz-verdict" v-else-if="quizScore >= 8">👍 ดีมาก! ทบทวน Pattern จำเร็วอีกสักรอบ</div>
          <div class="quiz-verdict" v-else>💪 ไม่เป็นไร! กลับไปอ่าน Step 9 แล้วลองใหม่</div>
          <div class="quiz-actions">
            <button class="quiz-btn correct" @click="startQuiz">ทำอีกรอบ</button>
            <button class="quiz-btn wrong" @click="quizReset">กลับหน้าเริ่ม</button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-bar">
        <button v-if="currentStep > 1" class="nav-btn prev" @click="currentStep--">
          ← ย้อนกลับ
        </button>
        <div class="nav-dots">
          <span v-for="s in totalSteps" :key="s" :class="['nav-dot', { active: s === currentStep, done: s < currentStep }]" @click="currentStep = s">{{ s }}</span>
        </div>
        <button v-if="currentStep < totalSteps" class="nav-btn next" @click="currentStep++">
          ถัดไป →
        </button>
        <button v-if="currentStep === totalSteps" class="nav-btn next done-btn" disabled>
          จบบทเรียน ✅
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../services/api'

const currentStep = ref(1)
const totalSteps = 11
const ddxCategories = ref([])
const mustKnow = ref([])
const goldenRules = ref([])
const confusingPairs = ref([])

onMounted(async () => {
  try {
    const [catRes, cheatRes] = await Promise.all([
      api.get('/ddx/categories'),
      api.get('/ddx/cheatsheet')
    ])
    ddxCategories.value = catRes.data.categories
    mustKnow.value = cheatRes.data.mustKnow
    goldenRules.value = cheatRes.data.goldenRules
    confusingPairs.value = cheatRes.data.confusingPairs
  } catch (e) {
    console.error('Failed to load DDx data', e)
  }
})

// Cheat sheet filters
const cheatFilter = ref('ALL')
const cheatCategories = computed(() => ['ALL', ...new Set(mustKnow.value.map(m => m.category))])
const filteredMustKnow = computed(() => cheatFilter.value === 'ALL' ? mustKnow.value : mustKnow.value.filter(m => m.category === cheatFilter.value))

// Quiz mode
const quizStarted = ref(false)
const quizItems = ref([])
const quizIdx = ref(0)
const quizShowAnswer = ref(false)
const quizScore = ref(0)
const quizTotal = ref(0)
const quizDone = ref(false)

function startQuiz() {
  // สุ่ม 15 ข้อจาก mustKnow
  const shuffled = [...mustKnow.value].sort(() => Math.random() - 0.5)
  quizItems.value = shuffled.slice(0, 15)
  quizIdx.value = 0
  quizScore.value = 0
  quizTotal.value = 15
  quizShowAnswer.value = false
  quizDone.value = false
  quizStarted.value = true
}
function quizReveal() { quizShowAnswer.value = true }
function quizNext(correct) {
  if (correct) quizScore.value++
  quizShowAnswer.value = false
  if (quizIdx.value < quizItems.value.length - 1) {
    quizIdx.value++
  } else {
    quizDone.value = true
  }
}
function quizReset() { quizStarted.value = false; quizDone.value = false }

// ใช้ข้อมูลจาก API แทน — ครบทุกอาการทุกระบบ
const allCategories = computed(() => ddxCategories.value.map(cat => ({
  ...cat,
  open: false,
  symptoms: cat.symptoms.map(sym => ({
    ...sym,
    open: false,
    differentials: sym.differentials.map(d => ({ ...d, open: false }))
  }))
})))

// ตัวอย่าง DDx สำหรับ Step 3 (ใช้ข้อมูลปวดท้อง)
const exampleDdx = computed(() => {
  const gi = allCategories.find(c => c.code === 'GI')
  const abdPain = gi?.symptoms.find(s => s.nameEn === 'Abdominal Pain')
  if (!abdPain) return []
  return abdPain.differentials.map((d, i) => reactive({ ...d, open: i === 0 }))
})

// สำหรับ Step 5 — browse ทุกอาการ
const selectedCatCode = ref(null)
const selectedSymptomIdx = ref(null)

const selectedCategory = computed(() => allCategories.find(c => c.code === selectedCatCode.value))
const selectedSymptom = computed(() => {
  if (!selectedCategory.value || selectedSymptomIdx.value === null) return null
  return selectedCategory.value.symptoms[selectedSymptomIdx.value]
})

function selectCategory(code) {
  selectedCatCode.value = selectedCatCode.value === code ? null : code
  selectedSymptomIdx.value = null
}
function selectSymptom(idx) {
  selectedSymptomIdx.value = idx
  // reset all ddx open state
  if (selectedSymptom.value) {
    selectedSymptom.value.differentials.forEach((d, i) => { d.open = i === 0 })
  }
}
function toggleDdx(ddx) {
  ddx.open = !ddx.open
}

const totalSymptoms = computed(() => allCategories.reduce((sum, cat) => sum + cat.symptoms.length, 0))
const totalDdx = computed(() => allCategories.reduce((sum, cat) => sum + cat.symptoms.reduce((s2, sym) => s2 + sym.differentials.length, 0), 0))
</script>

<style scoped>
/* ═══ Layout ═══ */
.admin-page { min-height: 100vh; background: #f8fafc; font-family: 'Noto Sans Thai', sans-serif; }
.admin-hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 28px 0; }
.admin-hero-inner { display: flex; align-items: center; gap: 16px; }
.admin-hero-icon { width: 48px; height: 48px; background: rgba(59,130,246,.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #60a5fa; }
.admin-hero h1 { font-size: 22px; font-weight: 700; margin: 0; }
.admin-hero p { font-size: 14px; color: #94a3b8; margin: 2px 0 0; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
.section { padding: 24px 20px 60px; }

/* ═══ Progress Bar ═══ */
.progress-bar-wrap { margin-bottom: 24px; }
.progress-label { font-size: 13px; color: #64748b; margin-bottom: 6px; font-weight: 500; }
.progress-track { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width .3s ease; }

/* ═══ Step Card ═══ */
.step-card { background: #fff; border-radius: 14px; padding: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.06); animation: fadeIn .3s ease; }
.step-badge { display: inline-block; background: #3b82f6; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
.step-card h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px; }
.step-card > p { color: #475569; line-height: 1.7; margin: 0 0 20px; font-size: 15px; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ═══ Story (Step 1) ═══ */
.story-box { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.story-scene { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.story-scene.reverse { flex-direction: row-reverse; }
.person { font-size: 40px; flex-shrink: 0; }
.speech-bubble { padding: 12px 18px; border-radius: 14px; font-size: 14px; line-height: 1.5; max-width: 400px; position: relative; }
.patient-bubble { background: #fee2e2; color: #991b1b; border-bottom-left-radius: 4px; }
.doctor-bubble { background: #dbeafe; color: #1e40af; border-bottom-right-radius: 4px; }

/* ═══ Think Steps ═══ */
.explain-box { margin-bottom: 20px; }
.explain-box h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
.think-steps { display: flex; flex-direction: column; gap: 12px; }
.think-step { display: flex; gap: 14px; align-items: flex-start; padding: 14px; background: #f8fafc; border-radius: 10px; border-left: 3px solid #3b82f6; }
.think-num { width: 28px; height: 28px; background: #3b82f6; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
.think-step strong { color: #0f172a; font-size: 14px; }
.think-step p { margin: 4px 0 0; font-size: 13px; color: #64748b; }

/* ═══ Key Point ═══ */
.key-point { display: flex; gap: 14px; padding: 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; margin-top: 20px; }
.key-icon { font-size: 24px; flex-shrink: 0; }
.key-point strong { color: #92400e; font-size: 14px; }
.key-point p { margin: 4px 0 0; font-size: 13px; color: #a16207; line-height: 1.6; }

/* ═══ Analogy (Step 2) ═══ */
.analogy-box { margin-bottom: 24px; }
.analogy-box h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
.analogy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.analogy-item { padding: 20px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
.analogy-item.highlight { background: #eff6ff; border-color: #93c5fd; }
.analogy-icon { font-size: 32px; margin-bottom: 10px; }
.analogy-text strong { font-size: 14px; color: #0f172a; }
.analogy-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.analogy-list span { background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-size: 13px; color: #334155; }
.analogy-list.med span { background: #dbeafe; color: #1e40af; }
.analogy-note { font-size: 12px; color: #64748b; margin: 0; font-style: italic; }

/* ═══ Vocab ═══ */
.vocab-box h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
.vocab-grid { display: flex; flex-direction: column; gap: 10px; }
.vocab-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; flex-wrap: wrap; }
.vocab-term { background: #0f172a; color: #fff; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; }
.vocab-full { color: #64748b; font-size: 12px; }
.vocab-thai { color: #334155; font-size: 13px; font-weight: 500; }

/* ═══ Example DDx Cards (Step 3) ═══ */
.example-approach { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
.example-header { background: #0f172a; color: #fff; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.example-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
.example-symptom { font-size: 20px; font-weight: 700; }
.example-en { color: #94a3b8; font-size: 14px; margin-left: 8px; }
.example-cat { font-size: 12px; background: rgba(255,255,255,.1); padding: 4px 12px; border-radius: 6px; }
.ddx-intro { padding: 12px 20px; background: #f1f5f9; font-size: 13px; color: #475569; display: flex; align-items: center; gap: 8px; }
.ddx-intro-icon { font-size: 16px; }

.ddx-card { border-top: 1px solid #e2e8f0; }
.ddx-header { padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background .15s; }
.ddx-header:hover { background: #f8fafc; }
.ddx-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ddx-num { width: 24px; height: 24px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #475569; }
.ddx-name { font-weight: 600; color: #0f172a; font-size: 14px; }
.ddx-name-th { color: #64748b; font-size: 13px; }
.ddx-toggle { color: #94a3b8; font-size: 12px; }
.freq-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.freq-badge.high { background: #fef2f2; color: #dc2626; }
.freq-badge.med { background: #fffbeb; color: #d97706; }
.freq-badge.low { background: #f0fdf4; color: #16a34a; }

.ddx-body { padding: 0 20px 16px; animation: fadeIn .2s ease; }
.ddx-section { margin-bottom: 12px; }
.ddx-label { font-size: 12px; font-weight: 600; color: #64748b; display: block; margin-bottom: 6px; }
.ddx-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { padding: 4px 10px; border-radius: 6px; font-size: 13px; }
.tag.clue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.tag.red-flag { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.tag.invest { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.treat-box { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; }
.treat-box p { margin: 0; font-size: 13px; color: #1e40af; line-height: 1.6; }
.drug-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; }
.drug-box p { margin: 0; font-size: 13px; color: #166534; line-height: 1.6; font-weight: 600; }
.warn-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; }
.warn-box p { margin: 0; font-size: 13px; color: #991b1b; line-height: 1.6; font-weight: 600; }
.tip-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; }
.tip-box p { margin: 0; font-size: 13px; color: #92400e; line-height: 1.6; }

/* ═══ Data Structure (Step 4) ═══ */
.data-structure { text-align: center; }
.data-level { display: inline-block; text-align: left; padding: 18px 24px; border-radius: 12px; margin: 4px 0; width: 100%; }
.level-1 { background: #3b82f6; color: #fff; }
.level-1 .data-example { color: #bfdbfe; }
.level-1 .data-note { color: #93c5fd; }
.level-2 { background: #eff6ff; border: 2px solid #93c5fd; }
.level-3 { background: #f0fdf4; border: 2px solid #86efac; }
.level-4 { background: #f8fafc; border: 2px solid #e2e8f0; }
.data-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.data-icon { font-size: 20px; }
.data-header strong { font-size: 15px; }
.data-example { font-size: 13px; color: #64748b; margin-bottom: 4px; }
.data-note { font-size: 12px; color: #94a3b8; font-style: italic; }
.data-arrow { font-size: 20px; color: #94a3b8; margin: 4px 0; }
.data-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.data-detail-item { padding: 10px 14px; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; }
.data-detail-item.red { border-color: #fecaca; background: #fef2f2; }
.data-detail-item.tip { border-color: #fde68a; background: #fffbeb; }
.dd-label { display: block; font-size: 13px; font-weight: 600; color: #0f172a; }
.dd-desc { font-size: 12px; color: #64748b; }

/* ═══ Category Grid (Step 5) ═══ */
.category-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.cat-card { background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid; border-radius: 10px; cursor: pointer; transition: all .15s; overflow: hidden; }
.cat-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.cat-header { display: flex; align-items: center; gap: 12px; padding: 16px; }
.cat-icon { font-size: 24px; }
.cat-info { flex: 1; }
.cat-info strong { color: #0f172a; font-size: 14px; display: block; }
.cat-info small { color: #94a3b8; font-size: 12px; }
.cat-count { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
.cat-toggle { color: #94a3b8; font-size: 12px; }
.cat-body { padding: 0 16px 16px; }
.cat-desc { font-size: 13px; color: #64748b; margin-bottom: 10px; }
.cat-symptoms { display: flex; flex-direction: column; gap: 6px; }
.cat-symptom-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; }
.cat-symptom-name { font-weight: 600; color: #0f172a; }
.cat-symptom-en { color: #94a3b8; font-size: 12px; }
.cat-symptom-ddx { margin-left: auto; font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }

/* ═══ Total Box ═══ */
.total-box { text-align: center; padding: 24px; background: #eff6ff; border-radius: 12px; border: 2px solid #93c5fd; }
.total-num { font-size: 48px; font-weight: 800; color: #2563eb; }
.total-label { font-size: 16px; font-weight: 600; color: #1e40af; }
.total-sub { font-size: 13px; color: #64748b; margin-top: 4px; }

/* ═══ Mode Grid (Step 6) ═══ */
.mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.mode-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
.mode-card.read-mode { border-color: #93c5fd; background: #eff6ff; }
.mode-card.practice-mode { border-color: #c4b5fd; background: #f5f3ff; }
.mode-badge { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.mode-icon { font-size: 32px; margin-bottom: 8px; }
.mode-card h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.mode-card p { font-size: 13px; color: #475569; margin: 0 0 14px; }
.mode-flow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.mf { background: rgba(0,0,0,.05); padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #334155; }
.mf-arrow { color: #94a3b8; font-size: 12px; }
.mode-who { font-size: 12px; color: #64748b; font-style: italic; }

/* ═══ SR (Step 7) ═══ */
.sr-example { margin-bottom: 24px; }
.sr-example h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 14px; }
.sr-timeline { display: flex; flex-direction: column; gap: 12px; }
.sr-day { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: #f8fafc; border-radius: 10px; flex-wrap: wrap; }
.sr-day-label { background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.sr-event { font-size: 13px; color: #334155; font-weight: 500; }
.sr-result { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.sr-result.bad { background: #fef2f2; color: #dc2626; }
.sr-result.ok { background: #fffbeb; color: #d97706; }
.sr-result.good { background: #eff6ff; color: #2563eb; }
.sr-result.great { background: #f0fdf4; color: #16a34a; }
.sr-next { font-size: 12px; color: #64748b; margin-left: auto; }

.sr-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; padding: 20px 0; }
.sr-step { text-align: center; }
.sr-badge { display: inline-block; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
.sr-badge.new { background: #f1f5f9; color: #64748b; }
.sr-badge.learning { background: #fff7ed; color: #ea580c; }
.sr-badge.reviewing { background: #eff6ff; color: #2563eb; }
.sr-badge.mastered { background: #f0fdf4; color: #16a34a; }
.sr-step > div:last-child { font-size: 12px; color: #64748b; }
.sr-arrow { font-size: 18px; color: #cbd5e1; }

/* ═══ Summary (Step 8) ═══ */
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
.summary-item { text-align: center; padding: 20px 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.summary-icon { font-size: 28px; margin-bottom: 8px; }
.summary-item h3 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.summary-item p { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; }

/* ═══ Lineup ═══ */
.lineup-box { background: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
.lineup-box h3 { color: #94a3b8; font-size: 13px; font-weight: 600; margin: 0 0 14px; text-transform: uppercase; letter-spacing: .5px; }
.lineup-items { display: flex; flex-direction: column; gap: 8px; }
.lineup-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,.05); border-radius: 8px; }
.lineup-item.active { background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.3); }
.lineup-name { color: #fff; font-weight: 700; font-size: 14px; min-width: 170px; }
.lineup-desc { color: #94a3b8; font-size: 13px; }
.lineup-new { margin-left: auto; background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }

/* ═══ Navigation ═══ */
.nav-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding: 16px 0; }
.nav-btn { padding: 10px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; }
.nav-btn.prev { background: #f1f5f9; color: #475569; }
.nav-btn.prev:hover { background: #e2e8f0; }
.nav-btn.next { background: #3b82f6; color: #fff; }
.nav-btn.next:hover { background: #2563eb; }
.nav-btn.done-btn { background: #16a34a; cursor: default; }
.nav-dots { display: flex; gap: 6px; }
.nav-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; border: 2px solid #e2e8f0; background: #fff; color: #94a3b8; }
.nav-dot.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.nav-dot.done { background: #dbeafe; color: #2563eb; border-color: #93c5fd; }

/* ═══ Cheat Sheet (Step 9) ═══ */
.cheat-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.cf-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; }
.cf-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }

.pattern-list { display: flex; flex-direction: column; gap: 10px; }
.pattern-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; }
.pattern-q { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.pattern-num { width: 24px; height: 24px; background: #0f172a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.pattern-cat-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #e2e8f0; color: #475569; flex-shrink: 0; }
.pattern-text { font-size: 14px; color: #0f172a; font-weight: 500; flex: 1; min-width: 200px; }
.pattern-a { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #eff6ff; border-radius: 8px; margin-bottom: 6px; }
.pattern-arrow { color: #3b82f6; font-weight: 700; font-size: 16px; }
.pattern-a strong { color: #1e40af; font-size: 14px; }
.pattern-memo { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #a16207; background: #fffbeb; padding: 6px 10px; border-radius: 6px; }
.memo-icon { font-size: 14px; }

/* ═══ Golden Rules (Step 10) ═══ */
.section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.golden-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.golden-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; flex-wrap: wrap; }
.golden-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 250px; }
.golden-num { width: 24px; height: 24px; background: #dc2626; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.golden-rule { font-size: 13px; font-weight: 600; color: #991b1b; }
.golden-action { font-size: 14px; font-weight: 700; color: #dc2626; }
.golden-why { font-size: 12px; color: #92400e; background: #fffbeb; padding: 4px 10px; border-radius: 6px; }

/* ═══ Confusing Pairs ═══ */
.pairs-list { display: flex; flex-direction: column; gap: 16px; }
.pair-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.pair-title { background: #0f172a; color: #fff; padding: 10px 16px; font-weight: 700; font-size: 14px; }
.pair-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pair-table th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #334155; border-bottom: 1px solid #e2e8f0; }
.pair-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; }
.pair-feature { font-weight: 600; color: #0f172a; background: #f8fafc; }

/* ═══ Quiz (Step 11) ═══ */
.quiz-intro { text-align: center; padding: 40px 20px; }
.quiz-intro p { font-size: 15px; color: #475569; margin-bottom: 20px; }
.quiz-start-btn { padding: 14px 36px; background: #3b82f6; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; transition: background .15s; }
.quiz-start-btn:hover { background: #2563eb; }

.quiz-active { max-width: 600px; margin: 0 auto; }
.quiz-progress { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 16px; font-weight: 600; }
.quiz-question { background: #0f172a; color: #fff; border-radius: 14px; padding: 28px; margin-bottom: 20px; text-align: center; }
.quiz-q-label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
.quiz-q-text { font-size: 18px; font-weight: 600; line-height: 1.6; }

.quiz-think { text-align: center; }
.quiz-think p { color: #64748b; font-size: 14px; margin-bottom: 12px; }
.quiz-reveal-btn { padding: 12px 32px; background: #f59e0b; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; }

.quiz-answer-box { text-align: center; }
.quiz-answer { display: inline-flex; align-items: center; gap: 10px; background: #eff6ff; padding: 16px 24px; border-radius: 12px; margin-bottom: 12px; }
.quiz-arrow { color: #3b82f6; font-size: 20px; }
.quiz-answer strong { color: #1e40af; font-size: 16px; }
.quiz-memo { font-size: 13px; color: #a16207; margin-bottom: 16px; }
.quiz-self p { font-size: 14px; color: #475569; margin-bottom: 10px; }
.quiz-btn { padding: 10px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; margin: 0 6px; font-family: 'Noto Sans Thai', sans-serif; }
.quiz-btn.correct { background: #16a34a; color: #fff; }
.quiz-btn.wrong { background: #dc2626; color: #fff; }

.quiz-result { text-align: center; padding: 40px 20px; }
.quiz-score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 16px; border: 4px solid; }
.quiz-score-circle.good { border-color: #16a34a; background: #f0fdf4; }
.quiz-score-circle.ok { border-color: #f59e0b; background: #fffbeb; }
.quiz-score-circle.bad { border-color: #dc2626; background: #fef2f2; }
.quiz-score-num { font-size: 36px; font-weight: 800; color: #0f172a; }
.quiz-score-total { font-size: 14px; color: #64748b; }
.quiz-verdict { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 20px; }
.quiz-actions { display: flex; justify-content: center; gap: 12px; }

/* ═══ Browse DDx (Step 5) ═══ */
.browse-cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.browse-cat-btn { padding: 8px 14px; border-radius: 20px; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #334155; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; display: flex; align-items: center; gap: 6px; }
.browse-cat-btn:hover { border-color: #94a3b8; }
.browse-cat-btn.active { color: #fff; border-color: transparent; }
.browse-cat-count { background: rgba(0,0,0,.1); padding: 1px 6px; border-radius: 10px; font-size: 11px; }
.browse-cat-btn.active .browse-cat-count { background: rgba(255,255,255,.3); }

.browse-symptoms { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.browse-sym-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; text-align: left; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; }
.browse-sym-btn:hover { border-color: #93c5fd; background: #f8fafc; }
.browse-sym-btn.active { border-color: #3b82f6; background: #eff6ff; }
.browse-sym-name { display: block; font-weight: 600; font-size: 14px; color: #0f172a; }
.browse-sym-en { font-size: 12px; color: #94a3b8; }
.browse-sym-ddx { display: block; font-size: 11px; color: #64748b; margin-top: 2px; }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .analogy-grid { grid-template-columns: 1fr; }
  .mode-grid { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .data-detail-grid { grid-template-columns: 1fr; }
  .story-scene, .story-scene.reverse { flex-direction: column; }
  .sr-flow { flex-direction: column; }
  .sr-arrow { transform: rotate(90deg); }
  .sr-day { flex-direction: column; align-items: flex-start; gap: 6px; }
  .sr-next { margin-left: 0; }
}
</style>
