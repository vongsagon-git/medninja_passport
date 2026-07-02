const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },

  // ประเภทกิจกรรม
  action: {
    type: String,
    enum: [
      'login',           // เข้าสู่ระบบ
      'login_google',    // เข้าสู่ระบบด้วย Google
      'logout',          // ออกจากระบบ
      'register',        // สมัครสมาชิก
      'watch_start',     // เริ่มดูคลิป
      'watch_end',       // หยุดดูคลิป (เปลี่ยนหน้า/ปิด)
      'video_change',    // เปลี่ยนวีดีโอ
      'pdf_download',    // ดาวน์โหลด PDF
      'section_view',    // เข้าดูหน้า section
      'live_join',       // เข้าดู live
      'page_visit',      // เข้าหน้าต่างๆ
      'line_link',       // เชื่อม LINE
      'profile_update',  // แก้ไขโปรไฟล์
      'password_change'  // เปลี่ยนรหัสผ่าน
    ],
    required: true,
    index: true
  },

  // รายละเอียดเพิ่มเติม
  detail: { type: String, default: '' },

  // ข้อมูล video (ถ้าเกี่ยวกับ video)
  sectionId: { type: String, default: '' },
  sectionName: { type: String, default: '' },
  videoIndex: { type: Number },
  videoTitle: { type: String, default: '' },
  watchDuration: { type: Number, default: 0 }, // วินาทีที่ดูจริง

  // Device info
  ip: { type: String, default: '' },
  os: { type: String, default: '' },
  browser: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, {
  timestamps: true
})

// compound index สำหรับ query by user + time
activityLogSchema.index({ userId: 1, createdAt: -1 })
// auto-delete หลัง 180 วัน (6 เดือน — เก็บนานพอเป็นหลักฐาน refund)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 })

module.exports = lmsConn.model('ActivityLog', activityLogSchema)
