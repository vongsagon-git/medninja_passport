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

// ⚠️ ปิดชั่วคราว 2026-07-12 — debugger statement รบกวน Aliplayer WV DRM handshake
//   → ทำให้ WV player ขาว (SDK init/license request timeout)
//   ใช้ DevTool panel-gap detection แทน (จับ docked panel ได้)
//   ยังต้อง test แล้วค่อยกลับมาเปิด

export function startDevToolTrap(onDetect) {
  return null
}

export function stopDevToolTrap(handle) {
  if (handle) clearInterval(handle)
}
