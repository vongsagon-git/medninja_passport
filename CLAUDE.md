# MedNinja Passport — Project Instructions

> **นี่คือ app คู่ขนานของ LMS** — ใช้เพื่อ redesign UI 4 หน้าหลัก (`/my`, `/section`, `/watch`, `/live`) โดย**ไม่กระทบ production LMS ที่นักเรียนกำลังเรียนอยู่**
>
> โครงสร้าง code + logic ทุกอย่าง**เหมือน LMS 100%** (clone มา) → ค่อยๆ ปรับ UI ทีละส่วน

> **Architecture, Auth, Anti-share, Deploy** → ดู `../../docs/ARCH.md`
> **App details (env, port, theme)** → ดู `../../docs/APPS.md` → [14] Passport
> **UI/Coding rules** → ดู `../../docs/RULES.md`
> **Bunny CDN, LINE, PDF watermark** → ดู `../../docs/KNOWLEDGE.md`
> **API endpoints** → ดู `../../docs/API.md`

---

## Concept

**ทำไมมี Passport app?**
- ต้องการ **redesign UI/UX** 4 หน้าหลัก (`/my`, `/section`, `/watch`, `/live`) แบบกล้าๆ
- แต่ทำที่ LMS ตัวจริงไม่ได้ เพราะ**นักเรียนกำลังเรียนอยู่** → พังไม่ได้
- **วิธีแก้:** สร้าง app ตัวใหม่ที่ code เหมือน LMS + DB เดียวกัน → ปรับแต่ง UI ตรงนี้ได้ไม่มี risk

**นักเรียนเข้าได้ 2 ทาง:**
- `medninja.academy` = LMS เดิม (production, stable) ← default
- `passport.medninja.academy` = ตัวใหม่ที่กำลัง redesign

**ทั้ง 2 domains อ่านเขียน DB เดียวกัน:**
- Login ที่ไหนก็ได้ token เดียวกัน (JWT_SECRET เหมือน LMS)
- Activation, watch progress, live session — ซิงค์ realtime
- Bunny video, PDF, LINE notify — ตัวเดียวกัน

---

## กฎห้ามลืม

1. **LMS = untouchable** — ห้ามแก้ code ที่ `../medninja-app/` เด็ดขาด
2. **DB shared** — ทุก mutation ที่ passport ส่งเข้า DB จะกระทบ LMS ด้วย → **ทดสอบให้ดี** ก่อน push
3. **Env เหมือน LMS ทุกตัว** (ยกเว้น PORT + FRONTEND_URL) — ดู `.env.example`
4. **Redesign แค่ 4 หน้า** — หน้าอื่น (`/admin/*`, `/courses`, checkout) ยังไม่ต้องแตะ (ตามที่ user บอก "clone มาเหมือนกันเลย แล้วเดียวปรับแต่งเอา")

---

## Deploy (DigitalOcean App Platform)

ดู `README.md` → section "🚀 Deploy ไป DigitalOcean" สำหรับวิธีตั้งค่า env ที่ DO ทีละตัว

---

## เฉพาะ Passport (จะเขียนเพิ่มเมื่อ redesign แล้ว)

ตอนนี้ code ทั้งหมด**เหมือน LMS** → ดู `../medninja-app/CLAUDE.md` เพื่อเข้าใจ:
- Anti-Share Detail
- Admin Monitoring
- Client Log System
- Diagnostic Page
- Pseudo-Live System
- Resume + Watch Progress
- Version Check

เมื่อ redesign หน้าไหน → เขียนความแตกต่างในไฟล์นี้ (เฉพาะสิ่งที่ passport ต่างจาก LMS)
