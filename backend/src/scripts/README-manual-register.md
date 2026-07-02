# Manual Register Tools — Emergency Use Only

ระบบลงทะเบียน Passport ตรง DB เลี่ยง OCR scan
ใช้เมื่อ: DO Gradient AI ล่ม / key rotate / OCR อ่านบัตรไม่ออก / register VIP

## วิธีใช้

### 1. เตรียมข้อมูล

แก้ `_input.json`:

```json
{
  "firstName": "ชื่อไทย",
  "lastName": "นามสกุลไทย",
  "firstNameEn": "FirstEn",
  "lastNameEn": "LastEn",
  "nationalId": "1234567890123",
  "dateOfBirth": "dd/mm/yyyy (พ.ศ.)",
  "sex": "M หรือ F",
  "phone": "08xxxxxxxx",
  "email": "x@y.z",
  "university": "ชื่อมหาลัย",
  "idCardPath": "C:/path/to/idcard.jpg"
}
```

### 2. รัน

```bash
cd medninja-main-app/medninja-app
node backend/src/scripts/manual-register.js backend/src/scripts/_input.json
```

ผลลัพธ์: สร้าง PreRegistration + User + Demo VISA 7 วัน + log credentials

### 3. อัพรูปบัตรย้อนหลัง (ถ้ารันโดยไม่มีรูปก่อน)

```bash
node backend/src/scripts/update-id-card-image.js <NID> "<path>"
```

## ที่ต้องระวัง

- **Default password = `ddmmyyyy`** (วันเกิด พ.ศ. ไม่มี `/`)
- `emailVerified` = true อัตโนมัติ (admin ลงให้ = trust)
- `profileLocked` = true (user แก้ไม่ได้เอง — admin override)
- ถ้า NID หรือ email ซ้ำ → script จะไม่สร้างซ้ำ + log ของเดิม

## เคสจริงที่เคยใช้ (2026-06-20)

DO Gradient AI ตัด tier gpt-4o → OCR พัง → register ตรง DB:
- ศุภานิช วงศ์เสริมสิน (1103703898647) — บูรพา
- พุทธิมน โชติวานิช (1103703438824) — อื่นๆ

หลัง update MODEL_ACCESS_KEY ใหม่จาก DO → OCR กลับมา
สคริปต์เก็บไว้เผื่อเคสในอนาคต
