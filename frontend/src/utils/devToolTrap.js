// ═══════════════════════════════════════════════════════════
// DevTool Trap (2026-07-12)
// ═══════════════════════════════════════════════════════════
// วิธี: debugger statement + timing detect
//   - DevTool ปิด → debugger เป็น no-op → เร็ว (< 100ms)
//   - DevTool เปิด → browser pause ที่ debugger → ช้า (> 100ms)
//   ยิ่งเปิดค้าง → freeze เลย → hacker ทำงานไม่ได้
//
// ใช้ตรง watch page เท่านั้น (ไม่ใช้ทั่วระบบ — จะรบกวน dev)
// เรียก startDevToolTrap() ตอน mounted → เก็บ handle → stopDevToolTrap(handle) ตอน unmount
// ═══════════════════════════════════════════════════════════

import { isRealMobile } from './deviceDetect'

const THRESHOLD_MS = 100
const INTERVAL_MS = 500

export function startDevToolTrap(onDetect) {
  // Real mobile ไม่มี DevTool → skip เลย ไม่กิน CPU
  if (isRealMobile()) return null

  let triggered = false
  const handle = setInterval(() => {
    if (triggered) return
    const start = performance.now()
    // ถ้า DevTool เปิด → หยุดที่ debugger นี้ (ต้อง "pause on debugger" default เปิด)
    // eslint-disable-next-line no-debugger
    debugger
    const elapsed = performance.now() - start
    if (elapsed > THRESHOLD_MS) {
      triggered = true
      clearInterval(handle)
      try { onDetect && onDetect() } catch (e) {}
    }
  }, INTERVAL_MS)
  return handle
}

export function stopDevToolTrap(handle) {
  if (handle) clearInterval(handle)
}
