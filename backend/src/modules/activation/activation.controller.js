/**
 * Activation Controller — Student endpoints
 * ดึง activations ของตัวเอง (packages ที่ถูก activate)
 */
const Activation = require('./Activation.model')
const ConsentLog = require('./ConsentLog.model')
const Package = require('../content/Package.model')

const CURRENT_TERMS_VERSION = '1.0'

/**
 * GET /api/my/activations
 * นักเรียนดู packages ที่ admin activate ให้ + sections ที่เข้าถึงได้
 *
 * NOTE: Activation (passportConn) → Package (lmsConn) ข้าม DB
 *       Package + Section อยู่ lmsConn เดียวกัน → populate ได้ตรง
 */
exports.getMyActivations = async (req, res, next) => {
  try {
    const now = new Date()

    // 1. ดึง activations (passportConn) — ไม่ populate ข้าม DB
    const activations = await Activation.find({
      userId: req.user._id,
      isActive: true
    })
      .sort('-activatedAt')
      .lean()

    // 2. Manual lookup: Package (lmsConn) + populate sections (same DB)
    const packageIds = [...new Set(
      activations.map(a => a.packageId?.toString()).filter(Boolean)
    )]

    const packages = packageIds.length > 0
      ? await Package.find({ _id: { $in: packageIds } })
          .populate({
            path: 'sections',
            select: 'code name description order videos'
          })
          .select('title description sections durationDays order liveEnabled')
          .lean()
      : []

    const pkgMap = new Map(packages.map(p => [p._id.toString(), p]))

    // 3. จัดรูป response
    const result = activations.map(a => {
      const isExpired = new Date(a.expiresAt) < now
      const pkg = pkgMap.get(a.packageId?.toString())

      // ใช้ array order จาก Package.sections เป็น display order (ไม่ sort by Section.order)
      const pkgSections = (pkg?.sections || [])
        .map((s, idx) => ({
          _id: s._id,
          code: s.code,
          name: s.name,
          description: s.description,
          order: idx,
          videoCount: s.videos ? s.videos.length : 0
        }))

      return {
        _id: a._id,
        package: pkg ? {
          _id: pkg._id,
          title: pkg.title,
          description: pkg.description,
          order: pkg.order,
          sections: pkgSections,
          liveEnabled: pkg.liveEnabled || false
        } : null,
        packageId: a.packageId,
        activatedAt: a.activatedAt,
        expiresAt: a.expiresAt,
        extendedDays: a.extendedDays,
        synapseEnabled: a.synapseEnabled || false,
        ddxEnabled: a.ddxEnabled || false,
        nlexEnabled: a.nlexEnabled || false,
        osceEnabled: a.osceEnabled || false,
        ddxExtraEnabled: a.ddxExtraEnabled || false,
        meqexEnabled: a.meqexEnabled || false,
        atlasEnabled: a.atlasEnabled || false,
        longexEnabled: a.longexEnabled || false,
        skill15Enabled: a.skill15Enabled || false,
        liveEnabled: a.liveEnabled || false,
        qaEnabled: a.qaEnabled || false,
        tier: a.tier || 6,
        status: isExpired ? 'expired' : 'active'
      }
    })

    res.json({ activations: result })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/my/consent/status
 * เช็คว่า activations ไหนกดยอมรับแล้ว
 */
exports.getConsentStatus = async (req, res, next) => {
  try {
    const logs = await ConsentLog.find({
      userId: req.user._id,
      termsVersion: CURRENT_TERMS_VERSION
    }).select('activationId').lean()

    const acceptedIds = logs.map(l => l.activationId.toString())
    res.json({ acceptedActivationIds: acceptedIds, currentVersion: CURRENT_TERMS_VERSION })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/my/consent/accept
 * กดยอมรับข้อตกลงสำหรับ activation นั้น
 * body: { activationId }
 */
exports.acceptConsent = async (req, res, next) => {
  try {
    const { activationId } = req.body
    if (!activationId) return res.status(400).json({ message: 'ต้องระบุ activationId' })

    // เช็คว่า activation เป็นของ user จริง
    const activation = await Activation.findOne({
      _id: activationId,
      userId: req.user._id,
      isActive: true
    }).lean()
    if (!activation) return res.status(404).json({ message: 'ไม่พบ activation' })

    // ดึงชื่อ package
    let packageTitle = ''
    try {
      const pkg = await Package.findById(activation.packageId).select('title').lean()
      packageTitle = pkg?.title || ''
    } catch (_) {}

    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || ''
    const u = req.user
    const userName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || ''

    // สร้าง consent log (upsert กัน duplicate)
    const log = await ConsentLog.findOneAndUpdate(
      { activationId, termsVersion: CURRENT_TERMS_VERSION },
      {
        userId: u._id,
        activationId,
        packageId: activation.packageId,
        termsVersion: CURRENT_TERMS_VERSION,
        acceptedAt: new Date(),
        ip: clientIp,
        userAgent: req.headers['user-agent'] || '',
        userName,
        userEmail: u.email || '',
        packageTitle
      },
      { upsert: true, new: true }
    )

    res.json({ ok: true })

    // ส่ง email ยืนยัน (fire-and-forget)
    ;(async () => {
      let emailSent = false, emailError = ''
      try {
        const nodemailer = require('nodemailer')
        const host = process.env.SMTP_HOST
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS
        if (!host || !smtpUser || !smtpPass || !u.email) return

        const transporter = nodemailer.createTransport({
          host, port: parseInt(process.env.SMTP_PORT || '587'),
          secure: (process.env.SMTP_PORT || '587') === '465',
          auth: { user: smtpUser, pass: smtpPass }
        })

        const dateStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })

        await transporter.sendMail({
          from: `"MedNinja Academy" <${process.env.SMTP_FROM || smtpUser}>`,
          to: u.email,
          subject: `[MedNinja] ยืนยันการยอมรับข้อตกลงการใช้งาน — ${packageTitle}`,
          html: `
            <div style="font-family:'Noto Sans Thai',sans-serif;max-width:500px;margin:0 auto;padding:24px;">
              <div style="background:#0f172a;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                <h2 style="margin:0;font-size:18px;">MedNinja Academy</h2>
                <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Terms of Service Acceptance</p>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
                <p style="color:#1e293b;font-size:14px;">เรียน <strong>${userName}</strong>,</p>
                <p style="color:#475569;font-size:13px;">อีเมลฉบับนี้เป็นการยืนยันว่าท่านได้ยอมรับข้อตกลงการใช้งานคอร์ส <strong>${packageTitle}</strong> เรียบร้อยแล้ว</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;color:#475569;">
                  <p style="margin:0 0 8px;font-weight:700;color:#0f172a;">สรุปข้อตกลงที่ท่านยอมรับ:</p>
                  <p style="margin:0 0 4px;">1. สิทธิ์การใช้งานเป็นสิทธิ์เฉพาะบุคคล สำหรับผู้ลงทะเบียนเท่านั้น ไม่สามารถโอนหรือมอบสิทธิ์ให้ผู้อื่นได้</p>
                  <p style="margin:0 0 4px;">2. ผู้ใช้งานตกลงที่จะไม่แบ่งปัน ไม่จำหน่าย และไม่อนุญาตให้บุคคลอื่นเข้าใช้งานบัญชีของตน</p>
                  <p style="margin:0 0 4px;">3. หากตรวจพบการใช้งานร่วมกับผู้อื่น บริษัทขอสงวนสิทธิ์ในการระงับการใช้งานทันที โดยไม่คืนค่าบริการ</p>
                  <p style="margin:0;">4. เนื้อหาทั้งหมดในระบบเป็นทรัพย์สินทางปัญญาของบริษัท ได้รับความคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์ พ.ศ. 2537</p>
                </div>
                <table style="width:100%;font-size:13px;color:#334155;margin:16px 0;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#94a3b8;width:120px;">คอร์ส</td><td style="font-weight:700;">${packageTitle}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">ผู้ยอมรับ</td><td>${userName}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">อีเมล</td><td>${u.email || '-'}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">IP Address</td><td>${clientIp}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">วันที่ยอมรับ</td><td>${dateStr}</td></tr>
                  <tr><td style="padding:6px 0;color:#94a3b8;">เวอร์ชันข้อตกลง</td><td>${CURRENT_TERMS_VERSION}</td></tr>
                </table>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-top:16px;">
                  <p style="color:#065f46;font-size:12px;margin:0;">กรุณาเก็บอีเมลฉบับนี้ไว้เป็นหลักฐาน หากท่านมีข้อสงสัยเกี่ยวกับข้อตกลง สามารถติดต่อทีมงานได้ที่ LINE @medninja</p>
                </div>
                <p style="color:#94a3b8;font-size:10px;margin:16px 0 0;text-align:center;">&copy; บริษัท เมดนินจา จำกัด — MedNinja Academy</p>
              </div>
            </div>
          `,
        })
        emailSent = true
        console.log(`[Consent Email] sent to ${u.email} pkg=${packageTitle}`)
      } catch (e) {
        emailError = e.message
        console.error('[Consent Email] error:', e.message)
      }
      try {
        await ConsentLog.updateOne({ _id: log._id }, { emailSent, emailError })
      } catch (_) {}
    })()
  } catch (error) {
    next(error)
  }
}

exports.CURRENT_TERMS_VERSION = CURRENT_TERMS_VERSION
