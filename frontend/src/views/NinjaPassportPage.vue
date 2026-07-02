<template>
  <div class="np-page">
    <!-- ─── Desktop: ให้ใช้มือถือ ─── -->
    <div v-if="!isMobile" class="np-desktop">
      <div class="np-desktop-card">
        <img src="/logo.png" alt="MedNinja" class="np-desktop-logo" />
        <h2>กรุณาใช้มือถือลงทะเบียน</h2>
        <p>สแกน QR Code ด้านล่าง หรือเปิดลิงก์บนมือถือ</p>
        <canvas ref="qrCanvas" class="np-qr"></canvas>
        <div class="np-desktop-url">medninja.academy/ninja-passport</div>
      </div>
    </div>

    <!-- ─── Mobile ─── -->
    <template v-else>
      <!-- Full-screen loading overlay (กำลังเช็คข้อมูล/ลงทะเบียน) -->
      <div v-if="scanning || submitting" class="np-loading-overlay">
        <div class="np-loading-card">
          <div class="np-loading-dots">
            <span></span><span></span><span></span>
          </div>
          <div class="np-loading-text">กรุณารอสักครู่</div>
          <div class="np-loading-sub">ระบบกำลังประมวลผลข้อมูลของคุณ</div>
        </div>
      </div>

      <!-- Full-screen camera overlay -->
      <div v-if="cameraActive" class="np-cam">
        <button class="np-cam-close" @click="stopCamera">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" width="28" height="28"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <video ref="cameraVideo" autoplay playsinline muted class="np-cam-feed"></video>
        <div class="np-cam-guide"></div>
        <div class="np-cam-bottom">
          <span class="np-cam-hint">วางบัตรให้เต็มกรอบ แล้วกดถ่าย</span>
          <button class="np-cam-shutter" @click="capturePhoto"><span></span></button>
        </div>
      </div>

      <!-- Header -->
      <div class="np-hdr">
        <img src="/logo.png" alt="MedNinja" class="np-logo" />
        <div class="np-brand">NINJA PASSPORT</div>
        <!-- LIFF badge: เปิดผ่าน LINE → แสดง displayName + ID 4 ตัวท้าย -->
        <div v-if="liffProfile" class="np-liff-badge" :title="`LINE userId: ${liffProfile.userId}`">
          <img v-if="liffProfile.pictureUrl" :src="liffProfile.pictureUrl" class="np-liff-avatar" />
          <div class="np-liff-info">
            <div class="np-liff-name">{{ liffProfile.displayName }}</div>
            <div class="np-liff-id">···{{ liffProfile.userId.slice(-4) }}</div>
          </div>
        </div>
      </div>


      <!-- Main content (white area) -->
      <div class="np-body">

        <!-- Step progress -->
        <div v-if="!maintenanceMode" class="np-progress">
          <div class="np-progress-bar">
            <div class="np-progress-fill" :style="{ width: stepProgress }"></div>
          </div>
          <span class="np-progress-text">{{ stepLabel }}</span>
        </div>

        <!-- ═══ BLOCK: ระบบกำลังปรับปรุง (maintenance mode) ═══ -->
        <template v-if="maintenanceMode">
          <div class="np-maint">
            <div class="np-maint-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="56" height="56">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
              </svg>
            </div>
            <h2 class="np-maint-title">กำลังปรับปรุงระบบลงทะเบียน</h2>
            <p class="np-maint-msg">ขณะนี้ระบบลงทะเบียน Ninja Passport ปิดชั่วคราว<br/>กรุณาติดต่อแอดมินทาง LINE เพื่อสมัครสมาชิก</p>
            <a href="https://line.me/R/ti/p/@medninja" target="_blank" rel="noopener" class="np-maint-cta">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              <span>ติดต่อ LINE @medninja</span>
            </a>
            <p class="np-maint-foot">ขออภัยในความไม่สะดวก เรากำลังเร่งแก้ไข</p>
          </div>
        </template>

        <!-- ═══ BLOCK: Case D — สอบ ศรว. ครบทุกขั้นแล้ว ═══ -->
        <template v-else-if="cmaBlocked">
          <div class="np-blocked">
            <div class="np-blocked-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="56" height="56">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="np-blocked-title">ขอแสดงความยินดี</h2>
            <p class="np-blocked-msg">คุณสอบผ่านทุกขั้นตอนแล้ว</p>
            <p class="np-blocked-note">ขอบคุณที่ให้ความสนใจใน MedNinja</p>
          </div>
        </template>

        <!-- ═══ STEP 1: ถ่ายรูป ═══ -->
        <template v-else-if="step === 1">
          <h2 class="np-heading">ลงทะเบียนรับสิทธิ์เรียน</h2>
          <p class="np-sub">เตรียมบัตรประชาชน หรือ พาสปอร์ต แค่ถ่ายรูปบัตร ระบบจะอ่านข้อมูลให้อัตโนมัติ</p>

          <!-- 3-step mini guide -->
          <div class="np-guide">
            <div class="np-guide-item">
              <div class="np-guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
              </div>
              <small>ถ่ายรูปบัตร</small>
            </div>
            <div class="np-guide-line"></div>
            <div class="np-guide-item">
              <div class="np-guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <small>ตรวจสอบข้อมูล</small>
            </div>
            <div class="np-guide-line"></div>
            <div class="np-guide-item">
              <div class="np-guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
              </div>
              <small>รับรหัสเข้าเรียน</small>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="imagePreview" class="np-prev">
            <img :src="imagePreview" alt="บัตร" />
            <button class="np-prev-x" @click="clearImage">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Camera trigger -->
          <button v-else class="np-snap" @click="openCamera">
            <div class="np-snap-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
            </div>
            <strong>แตะเพื่อถ่ายรูปบัตร</strong>
            <small>ระบบจะเปิดกล้องให้อัตโนมัติ</small>
          </button>

          <!-- Hidden file input fallback (สำหรับ LINE / in-app browser ที่ getUserMedia ไม่ได้) -->
          <input ref="fileInput" type="file" accept="image/*" capture="environment" style="display:none" @change="onFileSelect" />

          <AlertMessage :message="error" type="error" />

          <button v-if="imagePreview" class="np-btn" :disabled="scanning" @click="scanImage">
            <svg v-if="scanning" class="np-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {{ scanning ? 'กำลังอ่านข้อมูล...' : 'สแกนข้อมูลจากบัตร' }}
          </button>

          <p class="np-trust">ข้อมูลของคุณปลอดภัย ใช้เฉพาะในระบบ MedNinja เท่านั้น</p>
        </template>

        <!-- ═══ STEP 2: ตรวจสอบ + กรอกเพิ่ม ═══ -->
        <template v-else-if="step === 2">
          <h2 class="np-heading">ตรวจสอบข้อมูลของคุณ</h2>
          <p v-if="needsManualNid" class="np-sub np-sub-warn">ระบบอ่านเลขบัตรไม่ชัด กรุณากรอกเลขบัตรประชาชน 13 หลัก</p>
          <p v-else class="np-sub">ชื่อแก้ได้ถ้าไม่ถูก เลขบัตรและวันเกิดแก้ไม่ได้ ถ้าไม่ถูกให้ถ่ายรูปใหม่</p>

          <!-- เลขบัตร + วันเกิด -->
          <div class="np-ocr">
            <!-- เลขบัตร: editable ถ้า needsManualNid -->
            <div class="np-ocr-row np-ocr-full">
              <div v-if="needsManualNid" class="np-ocr-cell np-editable">
                <small>เลขบัตรประชาชน 13 หลัก *</small>
                <input
                  v-model="manualNid"
                  type="tel"
                  inputmode="numeric"
                  maxlength="13"
                  class="np-nid-input"
                  :class="{ 'np-nid-error': nidError, 'np-nid-ok': manualNid.length === 13 && !nidError }"
                  placeholder="กรอกเลข 13 หลัก"
                  @input="onManualNidInput"
                />
                <small v-if="nidError" class="np-field-error">{{ nidError }}</small>
                <small v-else-if="manualNid.length === 13 && !nidError" class="np-field-ok">ผ่าน</small>
              </div>
              <div v-else class="np-ocr-cell np-locked">
                <small>เลขบัตรประชาชน <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg></small>
                <span>{{ formatNationalId(ocrData.nationalId) }}</span>
              </div>
            </div>
            <!-- วันเกิด: ล็อคเสมอ + แสดง age validation -->
            <div class="np-ocr-row np-ocr-full">
              <div class="np-ocr-cell np-locked">
                <small>วันเกิด (พ.ศ.) <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg></small>
                <span>{{ ocrData.dateOfBirth }}</span>
                <small v-if="dobError" class="np-field-error">{{ dobError }}</small>
              </div>
            </div>
          </div>

          <!-- ชื่อ (แก้ไขได้) -->
          <div class="np-form">
            <div class="np-form-row">
              <div class="np-form-field">
                <label>ชื่อ (ไทย)</label>
                <input v-model="ocrData.firstName" type="text" class="np-input" />
              </div>
              <div class="np-form-field">
                <label>นามสกุล (ไทย)</label>
                <input v-model="ocrData.lastName" type="text" class="np-input" />
              </div>
            </div>
            <div class="np-form-row">
              <div class="np-form-field">
                <label>Name</label>
                <input v-model="ocrData.firstNameEn" type="text" class="np-input" />
              </div>
              <div class="np-form-field">
                <label>Last name</label>
                <input v-model="ocrData.lastNameEn" type="text" class="np-input" />
              </div>
            </div>
          </div>

          <button class="np-retake" @click="retake">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M1 4v6h6M23 20v-6h-6"/><path stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            เลขบัตร/วันเกิดไม่ถูก? ถ่ายรูปใหม่
          </button>

          <AlertMessage :message="error" type="error" />

          <div class="np-form">
            <input v-model="form.phone" type="tel" class="np-input" placeholder="เบอร์โทร *" inputmode="tel" />
            <input v-model="form.email" type="email" class="np-input" placeholder="อีเมล *" inputmode="email" />
            <select v-model="form.university" class="np-input np-select">
              <option value="">มหาวิทยาลัย (ไม่บังคับ)</option>
              <option v-for="uni in universities" :key="uni" :value="uni">{{ uni }}</option>
            </select>
            <template v-if="form.university === 'อื่นๆ'">
              <input
                v-model="form.otherUniversity"
                type="text"
                class="np-input"
                placeholder="ระบุชื่อมหาวิทยาลัย (ภาษาอังกฤษ ตัวพิมพ์ใหญ่) *"
                maxlength="120"
              />
              <small v-if="form.otherUniversity && form.otherUniversity.trim().length < 10" class="np-other-warn">
                กรุณาระบุชื่อให้ครบ (ต้องยาวกว่า 10 ตัวอักษร)
              </small>
            </template>
          </div>

          <button class="np-btn" :disabled="submitting || !isFormValid" @click="submitRegistration">
            <svg v-if="submitting" class="np-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {{ submitting ? 'กำลังลงทะเบียน...' : 'ยืนยันลงทะเบียน' }}
          </button>
        </template>

        <!-- ═══ STEP 3: สำเร็จ — ต้องยืนยัน email ═══ -->
        <template v-else-if="step === 3">
          <div class="np-done">
            <div class="np-done-icon np-done-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" width="36" height="36"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
            </div>
            <h2>เกือบเสร็จแล้ว!</h2>
            <p class="np-done-sub">ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน</p>

            <div class="np-email-box">
              <div class="np-email-label">เราส่งลิงก์ยืนยันไปที่</div>
              <div class="np-email-addr">{{ result.email }}</div>
              <div class="np-email-hint">กดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี</div>
            </div>

            <div class="np-result">
              <div class="np-result-row">
                <span>ชื่อ-นามสกุล</span>
                <strong>{{ result.firstName }} {{ result.lastName }}</strong>
              </div>
              <hr />
              <div class="np-result-row np-hl">
                <span>รหัสเข้าใช้งาน</span>
                <strong>{{ formatNationalId(result.loginId) }}</strong>
              </div>
              <div class="np-result-row np-hl">
                <span>รหัสผ่าน</span>
                <strong>{{ result.defaultPassword }}</strong>
              </div>
            </div>

            <div class="np-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
              <span>กรุณาจับภาพหน้าจอ หรือจดรหัสไว้ เพื่อใช้เข้าระบบ</span>
            </div>
          </div>
        </template>

      </div>
    </template>
  </div>
</template>

<script>
import AlertMessage from '../components/common/AlertMessage.vue'
import axios from 'axios'
import liff from '@line/liff'
import QRCode from 'qrcode'
import { isIOS as detectIOS, isAndroid as detectAndroid } from '../utils/deviceDetect'

const API_BASE = import.meta.env.VITE_API_URL || ''
const LIFF_ID = '2009259048-OK5LlGhE'

export default {
  name: 'NinjaPassportPage',
  components: { AlertMessage },

  data() {
    const ua = navigator.userAgent || ''
    const isMobile = detectIOS(ua)
      || detectAndroid(ua)
      || /Mobile|Tablet/i.test(ua)
      || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024)

    return {
      isMobile,
      isLiff: false,
      step: 1,
      imageFile: null,
      imagePreview: null,
      scanning: false,
      submitting: false,
      error: '',
      cameraActive: false,
      cameraStream: null,
      ocrData: { firstName: '', lastName: '', firstNameEn: '', lastNameEn: '', nationalId: '', dateOfBirth: '' },
      needsManualNid: false,
      manualNid: '',
      nidError: '',
      dobError: '',
      idCardImage: '',
      ocrRaw: '',
      liffIdToken: null,
      liffProfile: null,  // { displayName, userId, pictureUrl }
      liffDebug: '',      // debug message ที่แสดงให้ user เห็น
      form: { phone: '', email: '', university: '', otherUniversity: '' },
      // ─── Maintenance: ปิดระบบลงทะเบียนชั่วคราว ติดต่อ admin LINE ───
      maintenanceMode: false,
      // ─── สอบ ศรว. ครบทุกขั้น (Case D — แสดงหลัง submit) ───
      cmaBlocked: false,
      cmaBlockMessage: '',
      result: { firstName: '', lastName: '', loginId: '', defaultPassword: '', email: '' },
      universities: [
        'จุฬาลงกรณ์มหาวิทยาลัย',
        'มหาวิทยาลัยมหิดล',
        'มหาวิทยาลัยเชียงใหม่',
        'มหาวิทยาลัยขอนแก่น',
        'มหาวิทยาลัยสงขลานครินทร์',
        'มหาวิทยาลัยธรรมศาสตร์',
        'โรงพยาบาลรามาธิบดี',
        'มหาวิทยาลัยศรีนครินทรวิโรฒ',
        'มหาวิทยาลัยนเรศวร',
        'มหาวิทยาลัยบูรพา',
        'มหาวิทยาลัยอุบลราชธานี',
        'มหาวิทยาลัยมหาสารคาม',
        'มหาวิทยาลัยแม่ฟ้าหลวง',
        'มหาวิทยาลัยวลัยลักษณ์',
        'มหาวิทยาลัยพะเยา',
        'วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า',
        'สถาบันพระบรมราชชนก',
        'อื่นๆ'
      ]
    }
  },

  computed: {
    isFormValid() {
      const hasName = !!this.ocrData.firstName
      const hasPhone = !!this.form.phone.trim()
      const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())
      const noDobError = !this.dobError

      // ถ้าเลือก "อื่นๆ" → ต้องกรอกชื่อมหาวิทยาลัย + ยาวกว่า 10 ตัวอักษร
      const validUniversity = this.form.university === 'อื่นๆ'
        ? this.form.otherUniversity.trim().length > 10
        : true

      // เลขบัตรต้อง checksum ผ่านเสมอ (ทั้ง OCR mode + manual mode)
      const nidToCheck = this.needsManualNid ? this.manualNid : this.ocrData.nationalId
      const nidValid = this.validateNidChecksum(nidToCheck).valid

      return hasName && hasPhone && hasEmail && noDobError && validUniversity && nidValid
    },
    stepProgress() {
      if (this.step === 1) return '33%'
      if (this.step === 2) return '66%'
      return '100%'
    },
    stepLabel() {
      if (this.step === 1) return 'ขั้นตอนที่ 1 / 3 — ถ่ายรูปบัตร'
      if (this.step === 2) return 'ขั้นตอนที่ 2 / 3 — กรอกข้อมูล'
      return 'เสร็จสิ้น!'
    }
  },

  async mounted() {
    // QR Code สำหรับ desktop
    if (!this.isMobile) {
      await this.$nextTick()
      if (this.$refs.qrCanvas) {
        QRCode.toCanvas(this.$refs.qrCanvas, 'https://medninja.academy/ninja-passport', {
          width: 200,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' }
        })
      }
    }

    // Init LIFF — ลองทุกครั้ง (ถ้าไม่ใช่ LIFF environment ก็จะ fail ปกติ)
    const ua = navigator.userAgent
    const href = window.location.href
    this.liffDebug = `UA: ${ua.substring(0, 50)}... | URL: ${href.substring(0, 60)}`

    try {
      await liff.init({ liffId: LIFF_ID })
      this.isLiff = true
      this.liffDebug += ' | init=OK'

      // แอบเก็บ idToken สำหรับ link LINE UID ตอน submit
      if (liff.isLoggedIn()) {
        this.liffIdToken = liff.getIDToken()
        this.liffDebug += ` | logged=YES`

        // ดึงโปรไฟล์ LINE → แสดง header เล็กให้ user รู้ว่าระบบรู้จัก
        try {
          const profile = await liff.getProfile()
          this.liffProfile = {
            displayName: profile.displayName || '',
            userId: profile.userId || '',
            pictureUrl: profile.pictureUrl || ''
          }
          this.liffDebug += ` | profile=OK (${profile.displayName})`
        } catch (e) {
          this.liffDebug += ` | profile=FAIL (${e.message})`
          console.warn('LIFF getProfile failed:', e.message)
        }
      } else {
        this.liffDebug += ' | logged=NO'
      }
    } catch (e) {
      this.liffDebug += ` | init=FAIL (${e.message || e.code || 'unknown'})`
      console.warn('LIFF init:', e)
    }
  },

  beforeUnmount() {
    this.stopCamera()
  },

  methods: {
    async openCamera() {
      this.error = ''

      // ═══ ลอง getUserMedia ก่อน (ใช้ได้ทั้ง LIFF + browser ปกติ) ═══
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false
          })
          this.cameraStream = stream
          this.cameraActive = true
          await this.$nextTick()
          if (this.$refs.cameraVideo) {
            this.$refs.cameraVideo.srcObject = stream
          }
          return
        } catch (err) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            this.error = 'กรุณาอนุญาตการใช้กล้อง — ไปที่ตั้งค่า Browser > สิทธิ์เว็บไซต์ > กล้อง > อนุญาต แล้วลองใหม่'
            return
          }
          // กล้องไม่ได้ด้วยเหตุอื่น → ใช้ file input fallback
        }
      }

      // ═══ Fallback: ใช้ file input (เปิดกล้องผ่าน OS) ═══
      this.$refs.fileInput?.click()
    },

    onFileSelect(e) {
      const file = e.target.files?.[0]
      if (!file) return
      this.imageFile = file
      const reader = new FileReader()
      reader.onload = (ev) => { this.imagePreview = ev.target.result }
      reader.readAsDataURL(file)
      // reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
      e.target.value = ''
    },

    capturePhoto() {
      const video = this.$refs.cameraVideo
      if (!video || !video.videoWidth) return

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)

      this.imagePreview = canvas.toDataURL('image/jpeg', 0.92)
      canvas.toBlob((blob) => {
        if (blob) {
          this.imageFile = new File([blob], 'id-card.jpg', { type: 'image/jpeg' })
        }
      }, 'image/jpeg', 0.92)

      this.stopCamera()
    },

    stopCamera() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(t => t.stop())
        this.cameraStream = null
      }
      this.cameraActive = false
    },

    clearImage() {
      this.imageFile = null
      this.imagePreview = null
      this.error = ''
    },

    async scanImage() {
      if (!this.imageFile) return
      this.scanning = true
      this.error = ''
      try {
        const formData = new FormData()
        formData.append('image', this.imageFile)
        const { data } = await axios.post(`${API_BASE}/api/passport/scan`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        })

        if (data.success) {
          this.ocrData = data.data
          this.idCardImage = data.idCardImage
          this.ocrRaw = data.ocrRaw || ''
          this.needsManualNid = data.needsManualNid || false
          this.manualNid = ''
          this.nidError = ''
          this.dobError = ''
          // ตรวจอายุจาก DOB
          if (this.ocrData.dateOfBirth) {
            const ageCheck = this.validateAge(this.ocrData.dateOfBirth)
            if (!ageCheck.valid) this.dobError = ageCheck.error
          }
          this.step = 2
        } else {
          this.error = data.message || 'ไม่สามารถอ่านข้อมูลได้ กรุณาถ่ายรูปใหม่'
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      } finally {
        this.scanning = false
      }
    },

    retake() {
      this.step = 1
      this.clearImage()
      this.ocrData = { firstName: '', lastName: '', firstNameEn: '', lastNameEn: '', nationalId: '', dateOfBirth: '' }
      this.idCardImage = ''
      this.ocrRaw = ''
      this.needsManualNid = false
      this.manualNid = ''
      this.nidError = ''
      this.dobError = ''
      this.cmaBlocked = false
      this.cmaBlockMessage = ''
    },

    // ─── Checksum เลขบัตร 13 หลัก (เหมือน backend) ───
    validateNidChecksum(nid) {
      const clean = (nid || '').replace(/\D/g, '')
      if (clean.length !== 13) return { valid: false, error: 'เลขบัตรไม่ครบ 13 หลัก' }
      const digits = clean.split('').map(Number)
      let sum = 0
      for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i)
      const check = (11 - (sum % 11)) % 10
      if (check !== digits[12]) return { valid: false, error: 'เลขบัตรไม่ถูกต้อง (checksum ไม่ผ่าน)' }
      return { valid: true, cleaned: clean }
    },

    // ─── Validate อายุ 15-40 ───
    validateAge(dob) {
      if (!dob) return { valid: false, error: 'ไม่มีวันเกิด' }
      const parts = dob.split('/')
      if (parts.length !== 3) return { valid: false, error: 'รูปแบบวันเกิดไม่ถูกต้อง' }
      const dd = parseInt(parts[0], 10)
      const mm = parseInt(parts[1], 10)
      const yyyy = parseInt(parts[2], 10) // พ.ศ.
      if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 2480 || yyyy > 2570) {
        return { valid: false, error: 'วันเกิดไม่ถูกต้อง' }
      }
      const now = new Date()
      const currentBE = now.getFullYear() + 543
      const currentMonth = now.getMonth() + 1
      const currentDay = now.getDate()
      let age = currentBE - yyyy
      if (mm > currentMonth || (mm === currentMonth && dd > currentDay)) age--
      if (age < 15 || age > 40) return { valid: false, age, error: `อายุ ${age} ปี ไม่อยู่ในช่วง 15-40 ปี` }
      return { valid: true, age }
    },

    // ─── Real-time NID validation ───
    onManualNidInput() {
      // เอาเฉพาะตัวเลข
      this.manualNid = this.manualNid.replace(/\D/g, '').slice(0, 13)
      if (this.manualNid.length < 13) {
        this.nidError = ''
        return
      }
      const result = this.validateNidChecksum(this.manualNid)
      this.nidError = result.valid ? '' : result.error
    },

    async submitRegistration() {
      if (!this.isFormValid) return
      this.submitting = true
      this.error = ''
      try {
        // ใช้เลขจาก manual input ถ้า OCR อ่านไม่ได้
        const finalNid = this.needsManualNid ? this.manualNid : this.ocrData.nationalId

        // ถ้าเลือก "อื่นๆ" → ใช้ otherUniversity (ตัวพิมพ์ใหญ่)
        const finalUniversity = this.form.university === 'อื่นๆ'
          ? this.form.otherUniversity.trim().toUpperCase()
          : (this.form.university || undefined)

        const { data } = await axios.post(`${API_BASE}/api/preregister/submit`, {
          firstName: this.ocrData.firstName,
          lastName: this.ocrData.lastName,
          firstNameEn: this.ocrData.firstNameEn,
          lastNameEn: this.ocrData.lastNameEn,
          nationalId: finalNid,
          dateOfBirth: this.ocrData.dateOfBirth,
          phone: this.form.phone.trim(),
          email: this.form.email.trim(),
          university: finalUniversity,
          idCardImage: this.idCardImage,
          ocrRaw: this.ocrRaw,
          lineIdToken: this.liffIdToken || undefined,
          // ส่ง LIFF profile ตรงๆ เป็น fallback (กัน verify token fail)
          liffProfile: this.liffProfile || undefined
        })
        if (data.success) {
          this.result = data.data
          // ─── ลบรูปบัตร + OCR raw ออกจาก state หลัง submit สำเร็จ ───
          this.idCardImage = ''
          this.ocrRaw = ''
          this.imageFile = null
          this.imagePreview = null
          // ถ้าสอบครบทุกขั้น → แสดงจอ "ขอแสดงความยินดี"
          if (data.cmaPassedAll) {
            this.cmaBlocked = true
            this.cmaBlockMessage = data.message || 'คุณสอบผ่านครบทุกขั้นตอนแล้ว'
          } else {
            this.step = 3
          }
        } else {
          this.error = data.message || 'ลงทะเบียนไม่สำเร็จ'
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      } finally {
        this.submitting = false
      }
    },

    formatNationalId(id) {
      if (!id) return ''
      const d = id.replace(/\D/g, '')
      if (d.length !== 13) return id
      return `${d[0]}-${d.slice(1,5)}-${d.slice(5,10)}-${d.slice(10,12)}-${d[12]}`
    }
  }
}
</script>

<style scoped>
/* ═══ Page ═══ */
.np-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  display: flex;
  flex-direction: column;
}

/* ═══ Desktop ═══ */
.np-desktop {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.np-desktop-card {
  text-align: center;
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 20px;
  padding: 48px 36px;
  max-width: 400px;
  color: #fff;
}
.np-desktop-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.85;
  margin-bottom: 16px;
}
.np-desktop-card h2 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
.np-desktop-card p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 20px; }
.np-qr {
  display: block;
  margin: 0 auto 20px;
  border-radius: 12px;
  background: #fff;
  padding: 8px;
}
.np-desktop-url {
  display: inline-block;
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
  font-weight: 600;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 10px;
  letter-spacing: 0.3px;
}

/* ═══ Camera overlay ═══ */
.np-cam {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  flex-direction: column;
}
.np-cam-close {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  z-index: 10;
  width: 44px;
  height: 44px;
  background: rgba(0,0,0,0.4);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.np-cam-feed { flex: 1; width: 100%; object-fit: cover; }
.np-cam-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 88%;
  aspect-ratio: 1.586;
  border: 2px dashed rgba(255,255,255,0.4);
  border-radius: 12px;
  pointer-events: none;
}
.np-cam-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 0 max(28px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.np-cam-hint { font-size: 14px; color: rgba(255,255,255,0.85); }
.np-cam-shutter {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: transparent;
  padding: 4px;
  -webkit-tap-highlight-color: transparent;
}
.np-cam-shutter span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.1s;
}
.np-cam-shutter:active span { transform: scale(0.9); }

/* ═══ Header ═══ */
.np-hdr {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px 16px 14px;
  padding-top: max(18px, env(safe-area-inset-top));
}
.np-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.np-brand {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2px;
}

/* ═══ LIFF profile badge (เมื่อเปิดผ่าน LINE) ═══ */
.np-liff-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 8px 4px 4px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.np-liff-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.np-liff-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  max-width: 110px;
}
.np-liff-name {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.np-liff-id {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.55);
  font-family: monospace;
  letter-spacing: 0.5px;
}

/* LIFF debug overlay */
.np-liff-debug {
  position: fixed;
  top: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.85);
  color: #fef08a;
  font-size: 10px;
  font-family: monospace;
  padding: 6px 10px;
  border-radius: 6px;
  z-index: 99999;
  word-break: break-all;
  line-height: 1.4;
  cursor: pointer;
}

/* ═══ Body ═══ */
.np-body {
  flex: 1;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
}

/* ═══ Progress bar ═══ */
.np-progress {
  margin-bottom: 20px;
}
.np-progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}
.np-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.4s ease;
}
.np-progress-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* ═══ Headings ═══ */
.np-heading {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
  line-height: 1.3;
}
.np-sub {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* ═══ 3-step guide ═══ */
.np-guide {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  padding: 16px 8px;
  background: #f8fafc;
  border-radius: 12px;
}
.np-guide-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.np-guide-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.np-guide-item small {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  font-weight: 500;
}
.np-guide-line {
  width: 24px;
  height: 2px;
  background: #cbd5e1;
  margin-top: 21px;
  flex-shrink: 0;
}

/* ═══ Camera trigger ═══ */
.np-snap {
  width: 100%;
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 28px 20px;
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s;
}
.np-snap:active { transform: scale(0.98); }
.np-snap-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.np-snap strong { font-size: 16px; color: #1e40af; }
.np-snap small { font-size: 12px; color: #64748b; }

/* ═══ Trust ═══ */
.np-trust {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 16px;
}

/* ═══ Preview ═══ */
.np-prev {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}
.np-prev img { width: 100%; display: block; }
.np-prev-x {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ═══ Primary button ═══ */
.np-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 14px rgba(37,99,235,0.3);
}
.np-btn:active:not(:disabled) { transform: scale(0.98); }
.np-btn:disabled { opacity: 0.5; box-shadow: none; }

/* ═══ OCR data ═══ */
.np-ocr {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 4px;
}
.np-ocr-row { display: flex; gap: 8px; }
.np-ocr-row + .np-ocr-row { margin-top: 8px; }
.np-ocr-full .np-ocr-cell { flex: 1 1 100%; }
.np-ocr-cell {
  flex: 1;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
}
.np-ocr-cell small { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
.np-ocr-cell span {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ Locked OCR cell ═══ */
.np-locked {
  background: #f1f5f9;
}
.np-locked small {
  color: #64748b;
}
.np-locked small svg {
  vertical-align: middle;
  margin-left: 3px;
  color: #94a3b8;
}
.np-locked span {
  color: #0f172a;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* ═══ Editable NID cell ═══ */
.np-editable {
  background: #fffbeb;
  border-color: #f59e0b;
}
.np-editable small {
  color: #92400e;
  font-weight: 600;
}
.np-nid-input {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 18px;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 1.5px;
  color: #0f172a;
  background: #fff;
  box-sizing: border-box;
  margin-top: 4px;
  -webkit-appearance: none;
  text-align: center;
}
.np-nid-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.np-nid-input.np-nid-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}
.np-nid-input.np-nid-ok {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
}
.np-field-error {
  color: #ef4444 !important;
  font-weight: 600 !important;
  margin-top: 4px;
}
.np-field-ok {
  color: #22c55e !important;
  font-weight: 600 !important;
  margin-top: 4px;
}
.np-sub-warn {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 500;
}

/* ═══ Form row (2 cols) ═══ */
.np-form-row {
  display: flex;
  gap: 8px;
}
.np-form-row + .np-form-row { margin-top: 8px; }
.np-form-field {
  flex: 1;
  min-width: 0;
}
.np-form-field label {
  display: block;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

/* ═══ Retake ═══ */
.np-retake {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  padding: 8px 0;
  margin-bottom: 8px;
  -webkit-tap-highlight-color: transparent;
}

/* ═══ Form ═══ */
.np-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
}
.np-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
  box-sizing: border-box;
  -webkit-appearance: none;
}
.np-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.np-input::placeholder { color: #94a3b8; }
.np-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}

/* ═══ Success ═══ */
.np-done { text-align: center; }
.np-done-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 6px 20px rgba(34,197,94,0.3);
}
.np-done-email {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 6px 20px rgba(59,130,246,0.3);
}
.np-email-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: center;
}
.np-email-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}
.np-email-addr {
  font-size: 17px;
  font-weight: 700;
  color: #1e40af;
  word-break: break-all;
}
.np-email-hint {
  font-size: 12px;
  color: #3b82f6;
  margin-top: 6px;
  font-weight: 500;
}
.np-done h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}
.np-done-sub {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
}
.np-result {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  text-align: left;
}
.np-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}
.np-result-row span { font-size: 13px; color: #64748b; }
.np-result-row strong { font-size: 14px; color: #0f172a; }
.np-result hr { border: none; height: 1px; background: #bbf7d0; margin: 4px 0; }
.np-hl strong { color: #1a56db; font-family: monospace; font-size: 15px; }
.np-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 12px;
  line-height: 1.5;
  text-align: left;
}
.np-note svg { flex-shrink: 0; color: #d97706; margin-top: 1px; }

/* ═══ Spinner ═══ */
.np-spin { animation: np-spin 1s linear infinite; }
@keyframes np-spin { to { transform: rotate(360deg); } }

/* ═══ AlertMessage ═══ */
.np-body :deep(.alert) { margin: 12px 0; }

/* ═══ CMA (ศรว.) Badge (Case C) ═══ */
.np-cma-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #86efac;
  border-radius: 10px;
  color: #166534;
  font-size: 13px;
  font-weight: 600;
  margin: 12px 0 8px;
}
.np-cma-badge svg { flex-shrink: 0; }

/* ═══ Blocked screen (Case D) ═══ */
.np-blocked {
  text-align: center;
  padding: 40px 20px;
  animation: np-fadeIn 0.4s ease-out;
}
.np-blocked-icon {
  width: 96px;
  height: 96px;
  margin: 0 auto 18px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.18);
}
.np-blocked-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
}
.np-blocked-msg {
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 16px;
}
.np-blocked-note {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 20px;
}
.np-blocked-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #06c755, #05a647);
  color: #fff;
  text-decoration: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(6, 199, 85, 0.3);
  transition: all 0.2s;
}
.np-blocked-line:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(6, 199, 85, 0.4); }
@keyframes np-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ═══ Maintenance screen ═══ */
.np-maint {
  text-align: center;
  padding: 40px 20px 32px;
  animation: np-fadeIn 0.4s ease-out;
}
.np-maint-icon {
  width: 96px;
  height: 96px;
  margin: 0 auto 18px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18);
}
.np-maint-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 14px;
}
.np-maint-msg {
  font-size: 15px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 24px;
}
.np-maint-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #06c755, #05a647);
  color: #fff;
  text-decoration: none;
  border-radius: 28px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(6, 199, 85, 0.32);
  transition: all 0.2s;
}
.np-maint-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(6, 199, 85, 0.4); }
.np-maint-cta:active { transform: translateY(0); }
.np-maint-foot {
  font-size: 12px;
  color: #94a3b8;
  margin: 22px 0 0;
}

/* Case E: info color icon */
.np-icon-info {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe) !important;
  color: #2563eb !important;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.18) !important;
}
.np-blocked-login {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  text-decoration: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;
}
.np-blocked-login:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }

/* ═══ Full-screen Loading Overlay ═══ */
.np-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.86);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: np-loading-fade 0.2s ease-out;
}
@keyframes np-loading-fade { from { opacity: 0; } to { opacity: 1; } }

.np-loading-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 36px 44px;
  text-align: center;
  min-width: 240px;
}

.np-loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
}
.np-loading-dots span {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 50%;
  animation: np-dot-pulse 1.4s ease-in-out infinite both;
}
.np-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.np-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.np-loading-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes np-dot-pulse {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.np-loading-text {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
  animation: np-text-blink 1.6s ease-in-out infinite;
}
@keyframes np-text-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.np-loading-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

/* Locked name field (Case C) */
.np-locked-name {
  padding: 11px 14px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #86efac;
  border-radius: 10px;
  color: #166534;
  font-weight: 600;
  font-size: 15px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
</style>
