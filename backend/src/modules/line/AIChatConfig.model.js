/**
 * AIChatConfig — เก็บ system prompt + settings ใน DB
 * มี document เดียว (singleton) key='default'
 */
const { lmsConn } = require('../../shared/config/db')

const aiChatConfigSchema = new lmsConn.base.Schema({
  key:             { type: String, default: 'default', unique: true },
  systemPrompt:    { type: String, default: '' },
  temperature:     { type: Number, default: 0.7 },
  maxTokens:       { type: Number, default: 500 },
  courseInfo:       { type: String, default: '' },       // ข้อมูลคอร์สเพิ่มเติมที่ admin พิมพ์เอง
  courseDetails:    { type: String, default: '' },       // รายละเอียดคอร์สแบบเต็ม (AI ใช้ตอบลูกค้า)
  salesTechniques:  { type: String, default: '' },       // เทคนิคการตอบ / สไตล์การขาย
  enabled:         { type: Boolean, default: true },     // kill switch ปิด AI ทั้งระบบ
  // ═══ Payment Config — default เงื่อนไขคิดเงินที่ AI ใช้ ═══
  paymentOptions: {
    type: [{
      courseName:      { type: String, required: true },   // ชื่อคอร์ส
      amount:          { type: Number, required: true },   // ราคา (บาท)
      enableTransfer:  { type: Boolean, default: true },   // โอนได้
      enableCard:      { type: Boolean, default: true },   // บัตรเครดิต
      installment3:    { type: Boolean, default: false },  // ผ่อน 3 เดือน
      installment6:    { type: Boolean, default: false },  // ผ่อน 6 เดือน
      enabled:         { type: Boolean, default: true }    // เปิด/ปิด option นี้
    }],
    default: []
  },
  // ═══ Tool Config — เปิด/ปิด + กฎการใช้แต่ละ Flex ═══
  tools: {
    type: [{
      name:        { type: String, required: true },     // ชื่อ tool เช่น send_flex_trial
      label:       { type: String, default: '' },        // ชื่อแสดง เช่น "ทดลองเรียนฟรี"
      enabled:     { type: Boolean, default: true },
      instruction: { type: String, default: '' }         // กฎการใช้ เช่น "ส่งเมื่อลูกค้าอยากลองเรียน"
    }],
    default: []
  },
  updatedBy:       { type: String, default: '' }
}, { timestamps: true })

const AIChatConfig = lmsConn.model('AIChatConfig', aiChatConfigSchema)

// ═══ Default prompt (ใช้ seed ครั้งแรก) ═══
const DEFAULT_PROMPT = `คุณคือ "แอดมิน" ของ MedNinja Academy สถาบันติวสอบใบประกอบวิชาชีพแพทย์ (ศรว.)
คุณเป็นผู้หญิง เรียกตัวเองว่า "แอดมิน" ใช้ "ค่ะ" เสมอ (ไม่ใช้ครับ)

## บทบาท
คุณเป็นแอดมินฝ่ายดูแลลูกค้าที่ช่วยให้ข้อมูลเกี่ยวกับคอร์สเรียน ตอบคำถามเรื่องราคา วิธีสมัคร การชำระเงิน
คุยแบบเป็นกันเอง สุภาพ ใจดี เหมือนพี่สาวแนะนำน้อง ไม่ force sell ไม่กดดัน

## วิธีตอบ
- ตอบสั้น กระชับ เป็นธรรมชาติ เหมือนคนแชท
- ใช้ "ค่ะ" ท้ายประโยค
- ถ้าตอบยาวกว่า 1 ประโยค ให้คั่นด้วย --- เพื่อแบ่งเป็นหลายข้อความ
- ห้ามตอบยาวเกิน 3 ท่อน
- ห้ามใช้คำว่า "Bunny" เด็ดขาด

## ข้อมูลคอร์สหลัก
- NL MASTERY (NL1+2 ศรว.ระบบใหม่): รวม 153 ชม.+ (pre-clinic 73 ชม. + สด 80 ชม.)
- ราคาปกติ 69,900 → โปรช่วงนี้ 64,900 บาท (ลด 5,000)
- ผ่อน 0% ผ่านบัตรเครดิต 3 หรือ 6 เดือน
- โอนผ่านบัญชี กสิกรไทย 228-1-44959-4 บจก. เมดนินจา
- ดูย้อนหลัง 6 เดือน + ต่ออายุฟรีจนกว่าจะสอบผ่าน
- Live จ-พ-ศ 18.00-20.00 น.
- ทดลองเรียนฟรี: ดูคลิปตัวอย่าง หรือ สมัคร Ninja Passport (ฟรี 7 วัน)
- เว็บไซต์: medninja.academy

## วิธีเข้าเรียน
- Login ID = เลขบัตรประชาชน 13 หลัก
- รหัสผ่าน = วันเดือนปีเกิด พ.ศ. (ddmmyyyy) เช่น 05012543
- ดูได้ 1 จอเท่านั้น
- ใช้ Chrome หรือ Safari

## กฎการตอบ
1. ถ้าลูกค้าสนใจคอร์ส → ให้ข้อมูล + ถามว่าอยากดูรายละเอียดไหม → ถ้าสนใจ เรียก send_course_flex
2. ถ้าลูกค้าอยากทดลองเรียน → เรียก send_flex template=trial
3. ถ้าลูกค้าถามวิธีเข้าเรียน → ตอบสั้นๆ ก่อน + เรียก send_flex template=howto
4. ถ้าลูกค้าถามราคา/ต้องการชำระ → ให้ข้อมูลราคา ถามวิธีชำระ → เรียก send_payment_flex
5. ถ้าลูกค้าส่งสลิป/แจ้งโอน → เรียก confirm_payment + บอกว่า "ได้รับแล้วค่ะ รอทีมงานตรวจสอบนะคะ"
6. ถ้าลูกค้าต่อราคา → ไม่ลดราคาเอง แต่เสนอผ่อน 0% หรือส่งต่อทีมงาน
7. ถ้าคำถามไม่เกี่ยวกับการขาย/คอร์ส/ราคา (เช่น ปัญหาเทคนิค เนื้อหาวิชา complaint) → เรียก handoff_admin
8. ถ้าไม่แน่ใจ → เรียก handoff_admin ไม่เดาเอง

## สิ่งที่ห้ามทำ
- ห้ามกดดัน ห้ามเร่งให้ซื้อ ห้ามบอกว่า "รีบ" หรือ "ใกล้หมด"
- ห้ามลดราคาเอง ห้ามให้ส่วนลดนอกเหนือจากโปรที่มี
- ห้ามตอบเรื่องเนื้อหาวิชา/ข้อสอบ (ส่งต่อทีมงาน)
- ห้ามพูดว่าเป็น AI หรือ bot ให้บอกว่าเป็น "แอดมิน"
- ห้ามส่ง Flex พร่ำเพรื่อ ส่งเฉพาะเมื่อลูกค้าแสดงความสนใจชัดเจน
- ถ้าลูกค้าถามเล่นๆ หรือพูดไม่เกี่ยวกับคอร์ส → ส่งต่อทีมงานเงียบๆ`

// ═══ Default Payment Options ═══
const DEFAULT_PAYMENT_OPTIONS = [
  { courseName: 'NL MASTERY (NL1+2)', amount: 64900, enableTransfer: true, enableCard: true, installment3: true, installment6: true, enabled: true },
  { courseName: 'NL2 รวมทุกหัวข้อ', amount: 45000, enableTransfer: true, enableCard: true, installment3: true, installment6: true, enabled: true },
  { courseName: 'NL2 เฉพาะ Major', amount: 34900, enableTransfer: true, enableCard: true, installment3: true, installment6: false, enabled: true },
  { courseName: 'NL2 เฉพาะ Minor', amount: 15000, enableTransfer: true, enableCard: true, installment3: false, installment6: false, enabled: true }
]

// ═══ Default Tools ═══
const DEFAULT_TOOLS = [
  { name: 'send_flex_trial',       label: 'ทดลองเรียนฟรี',          enabled: true, instruction: 'ส่งเมื่อลูกค้าสนใจคอร์สใดก็ตาม (ยกเว้น OSCE/DDx) พร้อม flex คอร์ส + howto' },
  { name: 'send_flex_howto',       label: 'วิธีเข้าเรียน',           enabled: true, instruction: 'ส่งพร้อม trial เมื่อลูกค้าสนใจคอร์ส หรือถามวิธี login' },
  { name: 'send_course_nl',        label: 'Flex คอร์ส NL MASTERY (1+2)', enabled: true, instruction: 'ส่งเมื่อลูกค้าสนใจ NL1+2 ระบบใหม่ Integrated' },
  { name: 'send_course_nl2',       label: 'Flex คอร์ส NL2',           enabled: true, instruction: 'ส่งเมื่อลูกค้าสนใจ NL2 (3 options: Full/Major/Minor)' },
  { name: 'send_course_meq',       label: 'Flex คอร์ส MEQ',           enabled: true, instruction: 'ส่งเมื่อลูกค้าถามเรื่อง MEQ' },
  { name: 'send_course_osce',      label: 'Flex คอร์ส OSCE',          enabled: true, instruction: 'ส่งเมื่อลูกค้าถามเรื่อง OSCE + แจ้งว่าเรียนตัวต่อตัว' },
  { name: 'send_course_preclinic', label: 'Flex คอร์ส PRE-CLINIC',    enabled: true, instruction: 'ส่งเมื่อลูกค้าสนใจ Pre-clinic / ปี 1-3' },
  { name: 'send_course_ddx',       label: 'Flex DDx ARENA',           enabled: true, instruction: 'ส่งเมื่อลูกค้าสนใจ DDx หรือฝึก differential diagnosis' },
  { name: 'assess_lead',            label: 'ประเมินลูกค้า',            enabled: true, instruction: 'ประเมินทุกครั้งที่ลูกค้าถามเรื่องคอร์ส: hot/warm/cold + คอร์สที่สนใจ' },
  { name: 'handoff_admin',         label: 'ส่งต่อ admin',             enabled: true, instruction: 'ถามลึก/ต่อรอง/ชำระเงิน/สลิป/นักเรียนเก่า → ส่งต่อเงียบๆ' },
  { name: 'set_tag',               label: 'เปลี่ยน tag CRM',          enabled: true, instruction: 'inquired=สอบถาม, interested=สนใจ, closing=รอปิดการขาย' }
]

// ═══ Get config (cache 30 วินาที) ═══
let configCache = { data: null, fetchedAt: 0 }

async function getConfig() {
  if (configCache.data && Date.now() - configCache.fetchedAt < 30 * 1000) {
    return configCache.data
  }
  let config = await AIChatConfig.findOne({ key: 'default' }).lean()
  if (!config) {
    config = await AIChatConfig.create({ key: 'default', systemPrompt: DEFAULT_PROMPT, tools: DEFAULT_TOOLS, paymentOptions: DEFAULT_PAYMENT_OPTIONS })
    config = config.toObject()
  }
  // Sync tools — เพิ่ม tool ใหม่ที่ยังไม่มีใน DB + ลบ tool เก่าที่ไม่ใช้แล้ว
  const validToolNames = DEFAULT_TOOLS.map(t => t.name)
  const dbToolNames = (config.tools || []).map(t => t.name)
  const removedTools = ['send_flex_payment', 'send_payment_flex', 'confirm_payment'] // tool ที่ลบแล้ว
  let toolsChanged = false
  let tools = (config.tools || []).filter(t => !removedTools.includes(t.name))
  if (tools.length !== (config.tools || []).length) toolsChanged = true
  for (const dt of DEFAULT_TOOLS) {
    if (!dbToolNames.includes(dt.name)) {
      tools.push(dt)
      toolsChanged = true
    }
  }
  if (toolsChanged || !config.tools?.length) {
    await AIChatConfig.updateOne({ key: 'default' }, { tools })
    config.tools = tools
  }
  // ถ้ายังไม่มี paymentOptions → ใส่ default
  if (!config.paymentOptions || !config.paymentOptions.length) {
    await AIChatConfig.updateOne({ key: 'default' }, { paymentOptions: DEFAULT_PAYMENT_OPTIONS })
    config.paymentOptions = DEFAULT_PAYMENT_OPTIONS
  }
  configCache = { data: config, fetchedAt: Date.now() }
  return config
}

function clearConfigCache() {
  configCache = { data: null, fetchedAt: 0 }
}

module.exports = { AIChatConfig, getConfig, clearConfigCache, DEFAULT_PROMPT, DEFAULT_TOOLS, DEFAULT_PAYMENT_OPTIONS }
