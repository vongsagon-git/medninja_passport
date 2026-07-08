# MedNinja Passport

**ระบบคู่ขนานของ LMS สำหรับ redesign UI** โดยไม่กระทบนักเรียนที่กำลังเรียนอยู่

- Production: [passport.medninja.academy](https://passport.medninja.academy)
- LMS ตัวจริง: [medninja.academy](https://medninja.academy) (ไม่แตะ)
- Repo: `github.com/vongsagon-git/medninja_passport`

---

## Concept

Passport = clone ของ LMS 100% + **DB เดียวกัน**
→ นักเรียนเลือกได้ว่าจะเข้าเว็บไหน token ใช้ได้ทั้งคู่
→ ทีมออกแบบ UI ที่ passport ได้อิสระ โดยไม่พัง production

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/vongsagon-git/medninja_passport.git
cd medninja_passport

# 2. Install
npm run install:all

# 3. Env
cp .env.example .env
# → กรอกค่าจาก .env ของ LMS (เหมือนกัน 100% ยกเว้น PORT + FRONTEND_URL)

# 4. Dev
npm run dev
# → frontend: http://localhost:3100 (ต่างจาก LMS 3000)
# → backend: :4100 (ต่างจาก LMS)
```

---

## 🚀 Deploy ไป DigitalOcean App Platform

### ขั้นตอน

1. **สร้าง App ใหม่ที่ DO**
   - DO Dashboard → Apps → Create App
   - เลือก GitHub → `vongsagon-git/medninja_passport` → branch `main`
   - Autodeploy: ✅ on
   - Region: `Singapore (SGP1)` (เหมือน LMS, ใกล้ DB)

2. **App Spec**
   - Type: **Web Service** (Node.js)
   - Source Directory: `/`
   - Build Command: `npm run install:all && cd frontend && npm run build`
   - Run Command: `npm start`
   - HTTP Port: `4100` (หรือค่าจาก .env)

3. **Domain**
   - Add domain: `passport.medninja.academy`
   - DNS: point `CNAME passport → xxx.ondigitalocean.app` (จาก DO)
   - SSL: DO handle อัตโนมัติ

4. **Environment Variables** ⭐

   คัดลอกจาก LMS app ที่ DO **ทุกตัว** ยกเว้น 2 ตัวที่ต้องเปลี่ยน:

   | Key | ค่า | หมายเหตุ |
   |-----|-----|---------|
   | `MONGODB_URI` | 🔗 เหมือน LMS | shared DB — นักเรียนเดียวกัน |
   | `MONGODB_URI_LMS` | 🔗 เหมือน LMS | |
   | `MONGODB_URI_PASSPORT` | 🔗 เหมือน LMS | (ชื่อ DB ที่ MongoDB) |
   | `MONGODB_URI_NLEX` | 🔗 เหมือน LMS | |
   | `REDIS_URL` | 🔗 เหมือน LMS | session store |
   | `JWT_SECRET` | 🔗 **เหมือน LMS** | ⚠️ token ใช้ร่วมกันได้ นักเรียนไม่ต้อง re-login |
   | `NODE_ENV` | `production` | |
   | `FRONTEND_URL` | ⚡ `https://passport.medninja.academy` | ← **ต่างจาก LMS** |
   | `SMTP_*` | 🔗 เหมือน LMS | |
   | `BUNNY_*` (ทุกตัว) | 🔗 เหมือน LMS | video/PDF ก้อนเดียวกัน |
   | `LINE_*` | 🔗 เหมือน LMS | |
   | `NLEX_API_KEY` | 🔗 เหมือน LMS | |
   | `MODEL_ACCESS_KEY` | 🔗 เหมือน LMS | OCR |
   | `ELEVENLABS_API_KEY` | 🔗 เหมือน LMS | |

   **วิธีคัดลอก env จาก LMS ที่ DO เร็วๆ:**
   1. เปิด DO → Apps → LMS app → Settings → `.env`
   2. Export → save เป็นไฟล์
   3. เปิด Passport app → Settings → paste bulk import
   4. แก้ `FRONTEND_URL` เป็น `https://passport.medninja.academy`

5. **LIFF Endpoint (optional — ทำเมื่อจะใช้ LINE login ที่ passport domain)**
   - LINE Developer Console → provider เดียวกับ LMS → LIFF app ตัวเดิม
   - **Endpoint URL:** เพิ่ม `https://passport.medninja.academy` (LIFF app 1 ตัวรองรับได้หลาย endpoint)
   - หรือสร้าง LIFF app ใหม่แยกสำหรับ passport ก็ได้ (ใส่ค่า `LINE_CHANNEL_ID` + `LINE_CHANNEL_SECRET` ใหม่)

6. **Deploy**
   - กด "Create Resource" → รอ build (~3-5 นาที)
   - เช็ค log: หน้าแรกต้องขึ้น `Server ready on :4100`
   - เปิด `passport.medninja.academy` → เห็นหน้าเหมือน LMS

### ⚠️ ก่อน deploy ทุกครั้ง

ตามกฎ workspace (memory: build_dist_all_apps) — **ต้อง build + commit dist ก่อน push**:

```bash
cd frontend
npm run build          # → สร้าง frontend/dist
cd ..
git add frontend/dist
git commit -m "chore: build dist for deploy"
git push
```

**DO จะไม่ rebuild frontend** — ใช้ dist ที่ commit มา (เพื่อความเร็วและ deterministic)

---

## Structure

```
medninja-passport/
├── backend/          # Express + MongoDB (เหมือน LMS ทุกอย่าง)
├── frontend/         # Vue 3 + Vite + Pinia (จุดที่จะ redesign)
│   └── src/views/
│       ├── MyDashboard.vue     ← จะ redesign
│       ├── SectionPage.vue     ← จะ redesign
│       ├── WatchPage.vue       ← จะ redesign
│       └── WatchLive.vue       ← จะ redesign
├── scripts/          # utilities
├── .env.example      # template — ดูวิธีตั้งค่า env ด้านบน
├── CLAUDE.md         # AI instructions
└── README.md
```

---

## กฎห้ามลืม (สำหรับ dev)

1. **LMS ตัวจริงห้ามแตะ** — repo คนละตัว push คนละที่
2. **DB shared** = ทดลองสร้าง data ที่ passport = โผล่ที่ LMS ด้วย (เพราะ collection เดียวกัน)
3. **Env ต้องเหมือน LMS ทุกตัว** ยกเว้น `FRONTEND_URL` + `PORT` (+ `LINE_CHANNEL_ID/SECRET` ถ้าใช้ LIFF ใหม่)
4. **ก่อน push:** build dist + commit
