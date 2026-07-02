const PreRegistration = require('./PreRegistration.model')
const User = require('../user/User.model')
const { validateNationalId } = require('../passport/validation')
const { generateVerifyToken, sendVerificationEmail } = require('../auth/email.service')
const Activation = require('../activation/Activation.model')
const Package = require('../content/Package.model')

/**
 * POST /api/preregister/submit
 * รับข้อมูลทั้งหมด + รูป → บันทึก PreRegistration + สร้าง User + ส่ง verify email
 */
exports.submit = async (req, res, next) => {
  try {
    const { firstName, lastName, firstNameEn, lastNameEn, nationalId, dateOfBirth, sex, phone, email, university, idCardImage, ocrRaw, lineIdToken, liffProfile } = req.body
    const sexClean = ['M', 'F'].includes(sex) ? sex : ''

    // Validate required fields (email + phone บังคับ)
    if (!firstName || !lastName || !nationalId || !dateOfBirth || !phone || !email || !idCardImage) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ (รวมอีเมลและเบอร์โทร)' })
    }

    // Validate email format
    const emailClean = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' })
    }

    // Validate nationalId format + checksum
    const nidResult = validateNationalId(nationalId)
    if (!nidResult.valid) {
      return res.status(400).json({ message: nidResult.error })
    }

    // เช็คซ้ำ PreRegistration (Defense layer 2 — กัน frontend bypass)
    const existingReg = await PreRegistration.findOne({ nationalId: nidResult.cleaned })
      .select('firstName lastName email createdAt')
      .lean()
    if (existingReg) {
      return res.status(409).json({
        message: `คุณเคยสมัคร Ninja Passport ไว้แล้ว (${existingReg.firstName} ${existingReg.lastName})`,
        blocked: true,
        reason: 'already_registered',
        existing: {
          firstName: existingReg.firstName,
          lastName: existingReg.lastName,
          email: existingReg.email,
          registeredAt: existingReg.createdAt
        }
      })
    }

    // เช็คซ้ำ User (nationalId หรือ email)
    const existingUser = await User.findOne({
      $or: [{ nationalId: nidResult.cleaned }, { email: emailClean }]
    })
    if (existingUser) {
      if (existingUser.email === emailClean) {
        return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })
      }
      return res.status(409).json({ message: 'เลขบัตรประชาชนนี้ลงทะเบียนแล้ว' })
    }

    // ═══ Sync ศรว. (timeout 5 วิ) — กำหนดผลลัพธ์ ═══
    let cmaData = {
      cmaRegistered: false,
      cmaPassedAll: false,
      cmaNameTh: '',
      cmaNameEn: '',
      cmaProfileImage: '',
      cmaProfileImageUrl: '',
      cmaSyncedAt: null
    }
    let finalFirstName = firstName.trim()
    let finalLastName = lastName.trim()
    let finalFirstNameEn = firstNameEn ? firstNameEn.trim() : ''
    let finalLastNameEn = lastNameEn ? lastNameEn.trim() : ''

    try {
      const cmaService = require('./cma.service')
      const sync = await Promise.race([
        cmaService.syncOne(nidResult.cleaned, { fetchImage: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('cma_timeout')), 5000))
      ])
      cmaData.cmaSyncedAt = new Date()

      if (sync.registered) {
        cmaData.cmaRegistered = true
        cmaData.cmaPassedAll = !!sync.passedAll
        cmaData.cmaNameTh = sync.nameTh || ''
        cmaData.cmaNameEn = sync.nameEn || ''
        cmaData.cmaProfileImage = sync.cmaProfileImage || ''
        cmaData.cmaProfileImageUrl = sync.profileImageUrl || ''

        // C/D — ใช้ชื่อจาก ศรว. แทน input
        if (sync.nameTh) {
          const parts = sync.nameTh.trim().split(/\s+/)
          finalFirstName = parts[0] || finalFirstName
          finalLastName = parts.slice(1).join(' ') || finalLastName
        }
        if (sync.nameEn) {
          const enParts = sync.nameEn.trim().split(/\s+/)
          finalFirstNameEn = enParts[0] || finalFirstNameEn
          finalLastNameEn = enParts.slice(1).join(' ') || finalLastNameEn
        }
      }
    } catch (e) {
      console.log(`[Passport submit] CMA sync skipped: ${e.message}`)
      // A) cmathai down/timeout → ใช้ข้อมูลจาก user/AI ปกติ
    }

    // สร้าง default password จากวันเกิด: ddmmyyyy (พ.ศ.)
    const defaultPassword = dateOfBirth.replace(/\//g, '')

    // ถ้าสอบครบทุกขั้น → ไม่ส่ง verify email (passedAll = ระบบจะแสดงความยินดี)
    const skipVerifyEmail = cmaData.cmaPassedAll

    // สร้าง verification token (เผื่อ resend ทีหลัง)
    const { token: verifyToken, expires: verifyExpires } = generateVerifyToken()

    // ═══ สร้าง PreRegistration record ═══
    const registration = await PreRegistration.create({
      firstName: finalFirstName,
      lastName: finalLastName,
      firstNameEn: finalFirstNameEn,
      lastNameEn: finalLastNameEn,
      nationalId: nidResult.cleaned,
      dateOfBirth,
      sex: sexClean,
      phone: phone.trim(),
      email: emailClean,
      university: university ? university.trim().toUpperCase() : undefined,
      idCardImage,
      ocrRawResponse: ocrRaw || '',
      ...cmaData
    })

    // ═══ สร้าง User account อัตโนมัติ (มี rollback PreReg ถ้า fail) ═══
    const fullName = `${finalFirstName} ${finalLastName}`
    try {
      await User.create({
        name: fullName,
        email: emailClean,
        password: defaultPassword,
        phone: phone.trim(),
        nationalId: nidResult.cleaned,
        dateOfBirth,
        sex: sexClean,
        firstName: finalFirstName,
        lastName: finalLastName,
        university: university ? university.trim().toUpperCase() : undefined,
        authProvider: 'local',
        // ถ้าสอบครบทุกขั้น → mark verified=true ทันที (ไม่ต้องส่ง email)
        emailVerified: skipVerifyEmail,
        verifyToken: skipVerifyEmail ? undefined : verifyToken,
        verifyExpires: skipVerifyEmail ? undefined : verifyExpires,
        profileLocked: true,
        profileCompletedAt: new Date()
      })
    } catch (userErr) {
      // Rollback: ลบ PreRegistration ที่เพิ่งสร้าง — ป้องกัน orphan
      await PreRegistration.findByIdAndDelete(registration._id).catch(() => {})
      console.error('[Passport] User.create failed, rolled back PreReg:', userErr.message)
      // ส่ง error ที่ user เข้าใจ
      if (userErr.code === 11000) {
        return res.status(409).json({ message: 'ข้อมูลซ้ำในระบบ กรุณาลองใหม่' })
      }
      return res.status(500).json({ message: 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่' })
    }

    // ═══ Link LINE UID (ถ้าเปิดจาก LIFF) ═══
    // เก็บค่า LINE ที่ link ได้ — ใช้ใน noti admin ด้านล่าง
    let linkedLine = { userId: '', displayName: '', pictureUrl: '' }

    // 1) ลอง verify idToken กับ LINE API ก่อน (ปลอดภัยกว่า — ยืนยันว่าเป็นเจ้าของ token จริง)
    // 2) ถ้า verify fail → fallback ใช้ liffProfile.userId ตรงๆ ที่ frontend ส่งมา
    //    (กัน user เข้าระบบไม่ได้เชื่อม LINE — รู้ว่าเป็นใครดีกว่าไม่รู้)
    if (lineIdToken || (liffProfile && liffProfile.userId)) {
      try {
        let lineUserId = ''
        let lineDisplayName = ''
        let linePictureUrl = ''

        // Try 1: Verify idToken
        if (lineIdToken) {
          try {
            const resp = await fetch('https://api.line.me/oauth2/v2.1/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `id_token=${lineIdToken}&client_id=2009259048`
            })
            if (resp.ok) {
              const profile = await resp.json()
              if (profile.sub) {
                lineUserId = profile.sub
                lineDisplayName = profile.name || ''
                linePictureUrl = profile.picture || ''
              }
            }
          } catch (e) {
            console.warn('[Passport] LINE token verify failed:', e.message)
          }
        }

        // Try 2: Fallback ใช้ liffProfile (ถ้า verify fail)
        if (!lineUserId && liffProfile && liffProfile.userId) {
          lineUserId = liffProfile.userId
          lineDisplayName = liffProfile.displayName || ''
          linePictureUrl = liffProfile.pictureUrl || ''
          console.log(`[Passport] LINE linked via liffProfile fallback (${lineUserId})`)
        }

        if (lineUserId) {
          const user = await User.findOne({ nationalId: nidResult.cleaned })
          if (user) {
            user.lineUserId = lineUserId
            user.lineDisplayName = lineDisplayName
            user.linePictureUrl = linePictureUrl
            user.lineLinkedAt = new Date()
            await user.save()

            // Update LineFollower tag → trial
            const LineFollower = require('../line/LineFollower.model')
            await LineFollower.findOneAndUpdate(
              { lineUserId },
              { linkedUserId: user._id, tag: 'trial', tagUpdatedAt: new Date(), tagUpdatedBy: 'auto-liff' },
              { upsert: false }
            )

            // ส่งค่ากลับ noti ใช้
            linkedLine = { userId: lineUserId, displayName: lineDisplayName, pictureUrl: linePictureUrl }
            console.log(`[Passport] LINE linked: ${lineDisplayName} → ${emailClean}`)
          }
        }
      } catch (e) {
        console.error('[Passport] LINE link error:', e.message)
      }
    }

    // ═══ ส่ง verification email (skip ถ้า passedAll) ═══
    if (!skipVerifyEmail) {
      sendVerificationEmail(emailClean, fullName, verifyToken).catch(err => {
        console.error('⚠️  Failed to send verification email:', err.message)
      })
    }

    // ═══ Auto-assign VISA ทดลองเรียน (skip ถ้า passedAll) ═══
    if (!skipVerifyEmail) {
      ;(async () => {
        try {
          const demoPkg = await Package.findOne({ isDemo: true }).lean()
          if (!demoPkg) return
          const user = await User.findOne({ nationalId: nidResult.cleaned }).select('_id').lean()
          if (!user) return
          const expires = new Date()
          expires.setDate(expires.getDate() + (demoPkg.durationDays || 30))
          await Activation.create({
            userId: user._id,
            packageId: demoPkg._id,
            expiresAt: expires,
            isActive: true,
            note: 'Auto: VISA ทดลองเรียนฟรี'
          })
          console.log(`[Passport] Auto-assign demo VISA → ${emailClean}`)
        } catch (e) {
          console.error('[Passport] Auto-assign demo VISA failed:', e.message)
        }
      })()
    }

    console.log(`[Passport] สร้าง User → ${emailClean}${skipVerifyEmail ? ' (passedAll — skip verify+demo)' : ' + ส่ง verify email'}`)

    // ═══ LINE แจ้ง admin ว่ามีคนสมัคร Passport ═══
    ;(async () => {
      try {
        const ADMIN_UIDS = [
          'U2b0de81f0ec73e8561197393683a9e95', // เติ้ล
          'Ue6b6c4daf46d1765f1af71b292fe6fc9', // chertam
          'U398ec17f9dbf5917c2fd83bec6fe24ef'  // ฝน
        ]
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
        if (!token) return

        // ─── สถานะ ศรว. + สีหัว ───
        let cmaStatusText = 'ยังไม่ตรวจ'
        let cmaStatusColor = '#94a3b8'
        let headerColor = '#7c3aed'
        let headerText = 'Ninja Passport — สมัครใหม่'

        if (cmaData.cmaSyncedAt) {
          if (cmaData.cmaPassedAll) {
            cmaStatusText = '🎓 สอบครบทุกขั้น (น่าสงสัย)'
            cmaStatusColor = '#dc2626'
            headerColor = '#dc2626'
            headerText = '⚠ Passport: คนสอบครบสมัครเข้าระบบ'
          } else if (cmaData.cmaRegistered) {
            cmaStatusText = '✓ สมัครสอบ ศรว. แล้ว'
            cmaStatusColor = '#16a34a'
          } else {
            cmaStatusText = '❌ ยังไม่สมัคร ศรว.'
            cmaStatusColor = '#f59e0b'
          }
        } else {
          cmaStatusText = '⚠ ศรว. ไม่ตอบสนอง'
          cmaStatusColor = '#94a3b8'
        }

        const flex = {
          type: 'flex',
          altText: `Ninja Passport: ${finalFirstName} ${finalLastName}`,
          contents: {
            type: 'bubble', size: 'mega',
            header: { type: 'box', layout: 'vertical', backgroundColor: headerColor, paddingAll: '16px', contents: [
              { type: 'text', text: headerText, color: '#FFFFFF', size: 'sm', weight: 'bold', wrap: true }
            ]},
            body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'ชื่อ', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text', text: `${finalFirstName} ${finalLastName}`, size: 'sm', weight: 'bold', flex: 5, wrap: true }
              ]},
              { type: 'separator', color: '#e2e8f0' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'สถานะ ศรว.', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text', text: cmaStatusText, size: 'sm', weight: 'bold', color: cmaStatusColor, flex: 5, wrap: true }
              ]},
              { type: 'separator', color: '#e2e8f0' },
              // LINE: แสดงชื่อ + 4 ตัวท้าย userId (ถ้า link สำเร็จ)
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'LINE', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text',
                  text: linkedLine.userId
                    ? `${linkedLine.displayName || 'ไม่มีชื่อ'} (···${linkedLine.userId.slice(-4)})`
                    : 'ยังไม่เชื่อม',
                  size: 'sm',
                  weight: linkedLine.userId ? 'bold' : 'regular',
                  color: linkedLine.userId ? '#06c755' : '#94a3b8',
                  flex: 5,
                  wrap: true
                }
              ]},
              { type: 'separator', color: '#e2e8f0' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'อีเมล', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text', text: emailClean, size: 'sm', weight: 'bold', flex: 5, wrap: true }
              ]},
              { type: 'separator', color: '#e2e8f0' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'มหาวิทยาลัย', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text', text: university || '-', size: 'sm', weight: 'bold', flex: 5, wrap: true }
              ]},
              { type: 'separator', color: '#e2e8f0' },
              { type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: 'เบอร์', size: 'sm', color: '#64748b', flex: 3 },
                { type: 'text', text: phone || '-', size: 'sm', weight: 'bold', flex: 5 }
              ]}
            ]},
            footer: { type: 'box', layout: 'vertical', paddingAll: '12px', contents: [
              { type: 'button', action: { type: 'uri', label: 'ดูใน Passport', uri: 'https://medninja.academy/admin/passport' }, style: 'primary', color: headerColor, height: 'sm' }
            ]}
          }
        }
        for (const uid of ADMIN_UIDS) {
          fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ to: uid, messages: [flex] })
          }).catch(() => {})
        }
      } catch (e) { console.error('[Passport LINE] error:', e.message) }
    })()

    res.status(201).json({
      success: true,
      message: skipVerifyEmail
        ? 'ขอแสดงความยินดี — คุณสอบผ่านครบทุกขั้นตอนแล้ว'
        : 'ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน',
      cmaPassedAll: cmaData.cmaPassedAll,
      data: {
        id: registration._id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        nationalId: registration.nationalId,
        loginId: registration.nationalId,
        defaultPassword,
        email: emailClean
      }
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'เลขบัตรประชาชนหรืออีเมลนี้ลงทะเบียนแล้ว' })
    }
    next(error)
  }
}

/**
 * GET /api/preregister/check/:nationalId
 * เช็คว่าเลขบัตรนี้ลงทะเบียนแล้วหรือยัง
 */
exports.checkNationalId = async (req, res, next) => {
  try {
    const { nationalId } = req.params
    const nidResult = validateNationalId(nationalId)
    if (!nidResult.valid) {
      return res.status(400).json({ message: 'เลขบัตรประชาชนไม่ถูกต้อง' })
    }

    const existing = await PreRegistration.findOne({ nationalId: nidResult.cleaned })
    res.json({ registered: !!existing })
  } catch (error) {
    next(error)
  }
}
