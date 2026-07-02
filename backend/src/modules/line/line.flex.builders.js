/**
 * LINE Flex Template Builders — shared module
 * ใช้ร่วมกันระหว่าง line.admin.routes.js + line.ai.service.js
 */

function buildTrialFlex(opts = {}) {
  return {
    type: 'flex', altText: 'ทดลองเรียนฟรี — MedNinja Academy',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#0f172a', paddingAll: '24px', contents: [
        { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
          { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#3b82f6', cornerRadius: '12px',
            contents: [{ type: 'text', text: 'M', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center' },
          { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
            { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
            { type: 'text', text: 'ติวสอบใบประกอบวิชาชีพแพทย์', color: '#94a3b8', size: 'xxs', margin: 'sm' }
          ]}
        ]}
      ]},
      body: { type: 'box', layout: 'vertical', spacing: 'lg', paddingAll: '24px', backgroundColor: '#ffffff', contents: [
        { type: 'text', text: 'ทดลองเรียนฟรี', size: 'xl', weight: 'bold', color: '#0f172a' },
        { type: 'text', text: 'เลือกได้ 2 ช่องทาง ไม่มีค่าใช้จ่าย', size: 'xs', color: '#64748b', margin: 'sm' },
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#eff6ff', cornerRadius: '18px',
            contents: [{ type: 'text', text: '1', color: '#3b82f6', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'ดูคลิปตัวอย่างฟรี', size: 'md', weight: 'bold', color: '#0f172a' },
            { type: 'text', text: 'ไม่ต้องสมัครสมาชิก กดดูได้ทันที', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#f5f3ff', cornerRadius: '18px',
            contents: [{ type: 'text', text: '2', color: '#7c3aed', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'สมัคร Ninja Passport', size: 'md', weight: 'bold', color: '#0f172a' },
            { type: 'text', text: 'ทดลองเรียนคอร์สจริงฟรี 7 วัน', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' },
            { type: 'text', text: 'สมัครเสร็จ เข้าเรียนผ่านเว็บได้เลย', size: 'xs', color: '#94a3b8', wrap: true, margin: 'xs' }
          ]}
        ]},
        { type: 'separator', color: '#f1f5f9', margin: 'xl' },
        { type: 'box', layout: 'horizontal', margin: 'lg', justifyContent: 'center', contents: [
          { type: 'text', text: 'สมัครง่าย ใช้แค่บัตรประชาชน ไม่มีค่าใช้จ่าย', size: 'xxs', color: '#94a3b8', align: 'center', wrap: true }
        ]}
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#f8fafc', contents: [
        { type: 'button', action: { type: 'uri', label: 'ดูคลิปตัวอย่างฟรี', uri: 'https://medninja.academy/demo/watch/0' }, style: 'primary', color: '#3b82f6', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'สมัคร Ninja Passport (ฟรี 7 วัน)', uri: 'https://liff.line.me/2009259048-OK5LlGhE' }, style: 'primary', color: '#7c3aed', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'เข้าเว็บไซต์', uri: 'https://medninja.academy' }, style: 'link', height: 'sm' }
      ]}
    }
  }
}

function buildPaymentFlex() {
  return {
    type: 'flex', altText: 'แจ้งชำระเงิน — MedNinja Academy',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#0f172a', paddingAll: '24px', contents: [
        { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
          { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#16a34a', cornerRadius: '12px',
            contents: [{ type: 'text', text: '฿', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center' },
          { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
            { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
            { type: 'text', text: 'ชำระค่าเรียน', color: '#94a3b8', size: 'xxs', margin: 'sm' }
          ]}
        ]}
      ]},
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#ffffff', contents: [
        { type: 'text', text: 'ชำระค่าเรียนผ่านบัญชี', size: 'lg', weight: 'bold', color: '#0f172a' },
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'xl', contents: [
          { type: 'text', text: 'ธนาคาร', size: 'sm', color: '#64748b', flex: 3 },
          { type: 'text', text: 'กสิกรไทย (KBANK)', size: 'sm', weight: 'bold', color: '#0f172a', flex: 5, wrap: true }
        ]},
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'lg', contents: [
          { type: 'text', text: 'เลขที่บัญชี', size: 'sm', color: '#64748b', flex: 3 },
          { type: 'text', text: '228-1-44959-4', size: 'md', weight: 'bold', color: '#16a34a', flex: 5 }
        ]},
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'lg', contents: [
          { type: 'text', text: 'ชื่อบัญชี', size: 'sm', color: '#64748b', flex: 3 },
          { type: 'text', text: 'บจก. เมดนินจา', size: 'sm', weight: 'bold', color: '#0f172a', flex: 5, wrap: true }
        ]},
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'vertical', margin: 'xl', backgroundColor: '#f0fdf4', cornerRadius: '8px', paddingAll: '12px', contents: [
          { type: 'text', text: 'โอนแล้วแจ้งสลิปทาง LINE นี้ได้เลยค่ะ', size: 'xs', color: '#16a34a', weight: 'bold', align: 'center', wrap: true }
        ]}
      ]},
      footer: { type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: '#f8fafc', contents: [
        { type: 'text', text: 'MedNinja Academy — ติวสอบใบประกอบวิชาชีพแพทย์', size: 'xxs', color: '#94a3b8', align: 'center' }
      ]}
    }
  }
}

function buildInstallmentFlex(opts = {}) {
  const footerContents = []
  if (opts.installmentUrl) footerContents.push(
    { type: 'button', action: { type: 'uri', label: opts.installmentLabel || 'ผ่อน 0% ผ่านบัตร', uri: opts.installmentUrl }, style: 'primary', color: '#7c3aed', height: 'sm' }
  )
  if (opts.normalUrl) footerContents.push(
    { type: 'button', action: { type: 'uri', label: opts.normalLabel || 'ชำระปกติผ่านบัตร', uri: opts.normalUrl }, style: 'primary', color: '#3b82f6', height: 'sm' }
  )
  return {
    type: 'flex', altText: opts.title || 'ผ่อนชำระ 0%',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#4c1d95', paddingAll: '16px', contents: [
        { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'sm', weight: 'bold' },
        { type: 'text', text: 'ผ่อนชำระ 0%', color: '#c4b5fd', size: 'xs', margin: 'sm' }
      ]},
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
        { type: 'text', text: opts.title || 'ผ่อนชำระ 0% ผ่านบัตรเครดิต', size: 'md', weight: 'bold', color: '#0f172a', wrap: true },
        { type: 'separator', color: '#e2e8f0', margin: 'md' },
        { type: 'text', text: opts.description || 'ผ่อนได้สูงสุด 10 เดือน กับธนาคารชั้นนำ', size: 'sm', color: '#334155', wrap: true, margin: 'md' },
        ...(opts.months ? [{ type: 'text', text: 'ระยะเวลา: ' + opts.months + ' เดือน', size: 'sm', weight: 'bold', color: '#7c3aed', margin: 'md' }] : []),
        ...(opts.banks ? [{ type: 'text', text: 'ธนาคาร: ' + opts.banks, size: 'xs', color: '#64748b', wrap: true, margin: 'sm' }] : [])
      ]},
      ...(footerContents.length ? { footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', contents: footerContents } } : {})
    }
  }
}

function buildNewsFlex(opts = {}) {
  const footerContents = []
  if (opts.linkUrl) footerContents.push(
    { type: 'button', action: { type: 'uri', label: opts.linkLabel || 'อ่านเพิ่มเติม', uri: opts.linkUrl }, style: 'primary', color: '#3b82f6', height: 'sm' }
  )
  return {
    type: 'flex', altText: opts.title || 'ประกาศจาก MedNinja',
    contents: {
      type: 'bubble', size: 'mega',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#1e3a5f', paddingAll: '16px', contents: [
        { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'sm', weight: 'bold' },
        { type: 'text', text: 'ประกาศ', color: '#93c5fd', size: 'xs', margin: 'sm' }
      ]},
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
        { type: 'text', text: opts.title || 'ประกาศ', size: 'md', weight: 'bold', color: '#0f172a', wrap: true },
        { type: 'separator', color: '#e2e8f0', margin: 'md' },
        { type: 'text', text: opts.description || '', size: 'sm', color: '#334155', wrap: true, margin: 'md' }
      ]},
      ...(footerContents.length ? { footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', contents: footerContents } } : {})
    }
  }
}

function buildAdFlex(opts = {}) {
  return {
    type: 'flex', altText: opts.title || 'MedNinja Academy',
    contents: {
      type: 'bubble', size: 'mega',
      ...(opts.imageUrl ? { hero: { type: 'image', url: opts.imageUrl, size: 'full', aspectRatio: '20:13', aspectMode: 'cover' } } : {}),
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', contents: [
        { type: 'text', text: opts.title || '', size: 'md', weight: 'bold', color: '#0f172a', wrap: true },
        ...(opts.description ? [{ type: 'text', text: opts.description, size: 'sm', color: '#334155', wrap: true, margin: 'md' }] : [])
      ]},
      ...(opts.linkUrl ? { footer: { type: 'box', layout: 'vertical', paddingAll: '16px', contents: [
        { type: 'button', action: { type: 'uri', label: opts.linkLabel || 'ดูรายละเอียด', uri: opts.linkUrl }, style: 'primary', color: '#3b82f6', height: 'sm' }
      ]}} : {})
    }
  }
}

function buildNLMasteryFlex() {
  return {
    type: 'flex', altText: 'NL MASTERY (1+2 ศรว.ระบบใหม่) — Full Ninja Pass | MedNinja Academy',
    contents: {
      type: 'bubble', size: 'giga',
      hero: { type: 'image', url: 'https://medninja.b-cdn.net/nl1+2.png', size: 'full', aspectRatio: '16:9', aspectMode: 'cover',
        action: { type: 'uri', uri: 'https://medninja.academy/courses' } },
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
        { type: 'text', text: 'NL MASTERY', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center' },
        { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'sm', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#dc2626', cornerRadius: '8px', paddingAll: '4px', paddingStart: '10px', paddingEnd: '10px', contents: [
            { type: 'text', text: '1+2 ศรว.ระบบใหม่', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'text', text: 'รวม 153 ชั่วโมง ++', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold', margin: 'sm' },
        { type: 'text', text: 'เพื่อสอบใบประกอบวิชาชีพแพทย์ ศรว.', size: 'xs', color: '#94a3b8', align: 'center', margin: 'xs', wrap: true },
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', contents: [
          { type: 'text', text: 'เรียนครบทั้ง 80 ชม. (Major + Minor)', size: 'sm', weight: 'bold', color: '#93c5fd', wrap: true },
          { type: 'text', text: 'ดูย้อนหลังได้นาน 6 เดือนเต็ม', size: 'xs', color: '#60a5fa', wrap: true, margin: 'sm' },
          { type: 'text', text: 'ต่ออายุฟรีทุก 6 เดือนจนกว่าจะสอบผ่าน', size: 'xs', color: '#60a5fa', wrap: true, margin: 'xs' }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'รูปแบบการเรียน', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#064e3b', cornerRadius: '15px',
            contents: [{ type: 'text', text: '✦', size: 'sm', align: 'center', gravity: 'center', color: '#34d399' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'วิดีโอปรับพื้นฐาน pre-clinic', size: 'xs', weight: 'bold', color: '#34d399', wrap: true },
            { type: 'text', text: '73 ชั่วโมง', size: 'xs', color: '#94a3b8' }] }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#7f1d1d', cornerRadius: '15px',
            contents: [{ type: 'text', text: '●', size: 'xxs', align: 'center', gravity: 'center', color: '#fca5a5' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'Live ผ่านระบบ', size: 'xs', weight: 'bold', color: '#fca5a5', wrap: true },
            { type: 'text', text: 'จ-พ-ศ 18.00-20.00 น. เริ่ม พ.ค. 69', size: 'xs', color: '#94a3b8', wrap: true }] }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#1e3a5f', cornerRadius: '15px',
            contents: [{ type: 'text', text: '↺', size: 'sm', align: 'center', gravity: 'center', color: '#93c5fd' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'ดูย้อนหลังไม่อั้นผ่าน Website', size: 'xs', weight: 'bold', color: '#93c5fd', wrap: true },
            { type: 'text', text: 'ไม่ทันคลาสสด ทบทวนได้ตลอด', size: 'xs', color: '#94a3b8', wrap: true }] }
        ]},
        { type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#2e1065', cornerRadius: '15px',
            contents: [{ type: 'text', text: '★', size: 'sm', align: 'center', gravity: 'center', color: '#c4b5fd' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เรียนสด เนื้อหาเข้มข้น 80 ชม.', size: 'xs', weight: 'bold', color: '#c4b5fd', wrap: true }] }
        ]},
        { type: 'box', layout: 'vertical', backgroundColor: '#3b82f6', cornerRadius: '8px', paddingAll: '10px', margin: 'lg', contents: [
          { type: 'text', text: 'Total: 153 ชั่วโมง', size: 'sm', weight: 'bold', color: '#FFFFFF', align: 'center' }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'Course Syllabus', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'md', spacing: 'sm', contents: [
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Internal Medicine', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Pediatrics', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' OBGYN', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Surgery', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' ER / Ortho / Trauma', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Forensic Medicine', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' ENT (Otolaryngology)', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Eye (Ophthalmology)', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'separator', color: '#334155', margin: 'md' },
          { type: 'box', layout: 'horizontal', margin: 'md', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#c4b5fd', flex: 0 }, { type: 'text', text: ' Integrated Basic Science', size: 'xxs', weight: 'bold', color: '#cbd5e1', flex: 1 }] },
          { type: 'text', text: '   Pathophysiology, Pharmacology,\n   Microbiology, Physiology,\n   Clinical Biochemistry', size: 'xxs', color: '#64748b', wrap: true }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'lg', contents: [
          { type: 'text', text: 'ราคาปกติ', size: 'xxs', color: '#64748b', align: 'center' },
          { type: 'text', text: '69,900 บาท', size: 'lg', weight: 'bold', color: '#64748b', align: 'center', decoration: 'line-through', margin: 'xs' },
          { type: 'text', text: 'โปรช่วงนี้', size: 'xxs', color: '#fca5a5', align: 'center', margin: 'md', weight: 'bold' },
          { type: 'text', text: '64,900 บาท', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'xs' },
          { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'md', spacing: 'md', contents: [
            { type: 'box', layout: 'vertical', backgroundColor: '#dc2626', cornerRadius: '12px', paddingAll: '4px', paddingStart: '12px', paddingEnd: '12px', contents: [
              { type: 'text', text: 'ลด 5,000', size: 'xs', weight: 'bold', color: '#FFFFFF', align: 'center' }] },
            { type: 'box', layout: 'vertical', backgroundColor: '#7c3aed', cornerRadius: '12px', paddingAll: '4px', paddingStart: '12px', paddingEnd: '12px', contents: [
              { type: 'text', text: 'ผ่อน 0%', size: 'xs', weight: 'bold', color: '#FFFFFF', align: 'center' }] }
          ]}
        ]}
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: [
        { type: 'button', action: { type: 'uri', label: 'ดูคลิปตัวอย่างฟรี', uri: 'https://medninja.academy/demo/watch/0' }, style: 'primary', color: '#3b82f6', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'สมัคร Ninja Passport (ฟรี 7 วัน)', uri: 'https://liff.line.me/2009259048-OK5LlGhE' }, style: 'primary', color: '#7c3aed', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'เข้าเว็บไซต์', uri: 'https://medninja.academy' }, style: 'link', color: '#94a3b8', height: 'sm' }
      ]}
    }
  }
}

function buildQuizFlex(opts = {}) {
  const labels = ['A', 'B', 'C', 'D']
  const options = [opts.optionA, opts.optionB, opts.optionC, opts.optionD].filter(Boolean)
  const answerText = opts.answer || 'เฉลย'
  // หาข้อที่ถูก: ถ้า answer ขึ้นต้นด้วย A./B./C./D. → ข้อนั้นถูก
  const correctIdx = answerText.match(/^([A-D])\./) ? labels.indexOf(answerText[0]) : -1

  // สร้างปุ่มตัวเลือก — กดแล้วส่ง text ถูก/ผิด + เฉลย (ทั้งถูกและผิดอธิบายเหมือนกัน)
  const choiceButtons = options.map((opt, i) => {
    const isCorrect = i === correctIdx
    const replyText = isCorrect
      ? `✅ ถูกต้อง!\nคุณเลือก ${labels[i]}. ${opt}\n\n💡 ${answerText}`
      : `❌ ไม่ถูกต้อง\nคุณเลือก ${labels[i]}. ${opt}\n\n💡 คำตอบที่ถูกคือ ${answerText}`
    return {
      type: 'box', layout: 'horizontal', backgroundColor: '#1e293b', cornerRadius: '8px', paddingAll: '12px',
      action: { type: 'message', text: replyText },
      contents: [
        { type: 'text', text: labels[i] + '.', size: 'sm', weight: 'bold', color: '#60a5fa', flex: 0 },
        { type: 'text', text: '  ' + opt, size: 'sm', color: '#cbd5e1', flex: 1, wrap: true }
      ]
    }
  })

  return {
    type: 'flex', altText: 'MedNinja Daily Quiz — ' + (opts.topic || 'คำถามวันนี้'),
    contents: {
      type: 'bubble', size: 'giga',
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#0f172a', contents: [
        { type: 'box', layout: 'horizontal', justifyContent: 'center', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#f59e0b', cornerRadius: '12px', paddingAll: '4px', paddingStart: '14px', paddingEnd: '14px', contents: [
            { type: 'text', text: 'DAILY QUIZ', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        ...(opts.topic ? [{ type: 'text', text: opts.topic, size: 'sm', weight: 'bold', color: '#60a5fa', align: 'center', margin: 'lg' }] : []),
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'lg', contents: [
          { type: 'text', text: opts.question || 'คำถาม', size: 'sm', color: '#FFFFFF', wrap: true, lineSpacing: '6px' }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'md' },
        { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'md', contents: choiceButtons },
        { type: 'text', text: 'กดตัวเลือกเพื่อดูเฉลย', size: 'xxs', color: '#475569', align: 'center', margin: 'md' }
      ]},
      footer: { type: 'box', layout: 'vertical', paddingAll: '10px', backgroundColor: '#0f172a', contents: [
        { type: 'text', text: 'MedNinja Academy — Daily Quiz', size: 'xxs', color: '#64748b', align: 'center' }
      ]}
    }
  }
}

function buildSurveyFlex(opts = {}) {
  const options = (opts.options || []).filter(Boolean)
  const thankText = opts.thankText || 'ขอบคุณที่ตอบแบบสอบถาม 🙏'
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  const choiceButtons = options.map((opt, i) => {
    const label = labels[i] || `${i + 1}`
    const replyText = `📋 แบบสอบถาม\n\n${label}. คุณเลือก: ${opt}\n\n✨ ${thankText}`
    return {
      type: 'box', layout: 'horizontal', backgroundColor: '#7c3aed22',
      cornerRadius: '10px', paddingAll: '14px', borderColor: '#7c3aed44', borderWidth: '1px',
      action: { type: 'message', text: replyText },
      contents: [
        { type: 'box', layout: 'vertical', width: '26px', height: '26px', backgroundColor: '#7c3aed',
          cornerRadius: '13px', justifyContent: 'center', alignItems: 'center', flex: 0, contents: [
          { type: 'text', text: label, size: 'xs', weight: 'bold', color: '#FFFFFF', align: 'center' }
        ]},
        { type: 'text', text: '  ' + opt, size: 'sm', color: '#e2e8f0', weight: 'bold', flex: 1, wrap: true }
      ]
    }
  })

  return {
    type: 'flex', altText: '📋 MedNinja Survey — ' + (opts.title || 'แบบสอบถาม'),
    contents: {
      type: 'bubble', size: 'giga',
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#0f172a', contents: [
        // Header badge
        { type: 'box', layout: 'horizontal', justifyContent: 'center', spacing: 'sm', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#7c3aed', cornerRadius: '20px', paddingAll: '5px', paddingStart: '16px', paddingEnd: '16px', contents: [
            { type: 'text', text: '📋 SURVEY', size: 'xs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        // Title
        ...(opts.title ? [{ type: 'text', text: opts.title, size: 'md', weight: 'bold', color: '#c4b5fd', align: 'center', margin: 'lg' }] : []),
        // Divider
        { type: 'box', layout: 'horizontal', margin: 'lg', paddingStart: '40px', paddingEnd: '40px', contents: [
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#4c1d95', contents: [{ type: 'filler' }] }
        ]},
        // Question card
        { type: 'box', layout: 'vertical', backgroundColor: '#1e1b4b', cornerRadius: '12px', paddingAll: '18px', margin: 'lg', contents: [
          { type: 'text', text: '💬', size: 'md', margin: 'none' },
          { type: 'text', text: opts.question || 'คำถาม', size: 'sm', color: '#FFFFFF', wrap: true, lineSpacing: '6px', margin: 'sm' }
        ]},
        // Choices
        { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'lg', contents: choiceButtons },
        // Footer hint
        { type: 'text', text: '👆 แตะเพื่อเลือกคำตอบ', size: 'xxs', color: '#6d28d9', align: 'center', margin: 'lg' }
      ]},
      footer: { type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#0c0a1d', contents: [
        { type: 'box', layout: 'horizontal', justifyContent: 'center', spacing: 'sm', contents: [
          { type: 'text', text: '🏥', size: 'xs' },
          { type: 'text', text: 'MedNinja Academy', size: 'xxs', color: '#6d28d9', weight: 'bold' }
        ]}
      ]}
    }
  }
}

function buildHowToFlex() {
  return {
    type: 'flex', altText: 'วิธีเข้าเรียน MedNinja Academy',
    contents: {
      type: 'bubble', size: 'giga',
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
        { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
          { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#3b82f6', cornerRadius: '12px',
            contents: [{ type: 'text', text: 'M', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center' },
          { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
            { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
            { type: 'text', text: 'คำแนะนำสำหรับนักเรียนใหม่', color: '#94a3b8', size: 'xxs', margin: 'sm' }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'วิธีเข้าเรียน', size: 'lg', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'lg' },
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#3b82f6', cornerRadius: '18px',
            contents: [{ type: 'text', text: '1', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เข้าเว็บไซต์ medninja.academy', size: 'sm', weight: 'bold', color: '#FFFFFF', wrap: true },
            { type: 'text', text: 'ผ่าน browser มือถือหรือคอมพิวเตอร์', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#7c3aed', cornerRadius: '18px',
            contents: [{ type: 'text', text: '2', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'Login เข้าสู่ระบบ', size: 'sm', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: 'Login ID = เลขบัตรประชาชน 13 หลัก\nรหัสผ่าน = วันเดือนปีเกิด พ.ศ. (ddmmyyyy)\nเช่น เกิด 5 ม.ค. 2543 → 05012543', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#16a34a', cornerRadius: '18px',
            contents: [{ type: 'text', text: '3', color: '#FFFFFF', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เข้าหน้าเรียน', size: 'sm', weight: 'bold', color: '#FFFFFF' },
            { type: 'text', text: 'คอร์สของคุณจะอยู่ในส่วน VISA\nกดเข้าไปเลือกบทเรียน แล้วดูวีดีโอได้เลยค่ะ', size: 'xs', color: '#94a3b8', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'xl' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'lg', contents: [
          { type: 'text', text: 'เพิ่มเติม', size: 'xs', weight: 'bold', color: '#60a5fa' },
          { type: 'text', text: '• ส่งคำถามถึงผู้สอนได้ที่ใต้วีดีโอ (ต้องแอดไลน์ที่ใต้ Passport ก่อน)', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' },
          { type: 'text', text: '• ดูได้ทีละ 1 จอเท่านั้น', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' },
          { type: 'text', text: '• ใช้ Chrome หรือ Safari จะดีที่สุด', size: 'xs', color: '#cbd5e1', wrap: true, margin: 'sm' }
        ]},
        { type: 'box', layout: 'vertical', backgroundColor: '#7f1d1d', cornerRadius: '10px', paddingAll: '14px', margin: 'md', contents: [
          { type: 'text', text: 'มีปัญหาการรับชม', size: 'xs', weight: 'bold', color: '#fca5a5' },
          { type: 'text', text: 'กดปุ่มสีแดง "ดูไม่ได้?" มุมบนขวาของหน้าวีดีโอ ระบบจะตรวจสอบให้อัตโนมัติ', size: 'xs', color: '#fecaca', wrap: true, margin: 'sm' }
        ]},
        { type: 'text', text: 'มีปัญหาการรับชม ติดต่อทีมงานได้ทาง LINE นี้เลยค่ะ', size: 'xs', color: '#94a3b8', align: 'center', margin: 'lg', wrap: true },
        { type: 'text', text: 'MedNinja Academy — ติวสอบใบประกอบวิชาชีพแพทย์', size: 'xxs', color: '#475569', align: 'center', margin: 'md' }
      ]}
    }
  }
}

function buildNL2Flex() {
  return {
    type: 'flex', altText: 'NL2 by MedNinja — UPDATE | MedNinja Academy',
    contents: {
      type: 'bubble', size: 'giga',
      hero: { type: 'image', url: 'https://medninja.b-cdn.net/NL2.png', size: 'full', aspectRatio: '20:13', aspectMode: 'cover',
        action: { type: 'uri', uri: 'https://medninja.academy/courses' } },
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
        { type: 'text', text: 'NL2', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center' },
        { type: 'text', text: 'by MedNinja', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold' },
        { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'sm', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#dc2626', cornerRadius: '8px', paddingAll: '4px', paddingStart: '12px', paddingEnd: '12px', contents: [
            { type: 'text', text: 'UPDATE', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'ครอบคลุมหัวข้อ', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', margin: 'md', spacing: 'sm', contents: [
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Internal Medicine', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' OBGYN', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Pediatrics', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Surgery', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' ER / Ortho / Trauma', size: 'xxs', color: '#cbd5e1', flex: 1 }] },
          { type: 'box', layout: 'horizontal', contents: [{ type: 'text', text: '▸', size: 'xxs', color: '#60a5fa', flex: 0 }, { type: 'text', text: ' Forensic / ENT / Eye', size: 'xxs', color: '#cbd5e1', flex: 1 }] }
        ]},
        { type: 'box', layout: 'vertical', backgroundColor: '#064e3b', cornerRadius: '8px', paddingAll: '10px', margin: 'lg', contents: [
          { type: 'text', text: 'ดูย้อนหลังได้จนกว่าจะสอบผ่าน', size: 'sm', weight: 'bold', color: '#34d399', align: 'center' }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'เลือก Option ที่เหมาะกับคุณ', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },
        // Option 1
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'md', contents: [
          { type: 'box', layout: 'horizontal', justifyContent: 'space-between', contents: [
            { type: 'text', text: 'Option 1', size: 'sm', weight: 'bold', color: '#f59e0b' },
            { type: 'text', text: 'รวมทุกหัวข้อ', size: 'xs', color: '#94a3b8' }
          ]},
          { type: 'text', text: 'Major + Minor ครบทุกวิชา', size: 'xs', color: '#cbd5e1', margin: 'sm', wrap: true },
          { type: 'text', text: '45,000 บาท', size: 'xl', weight: 'bold', color: '#FFFFFF', margin: 'sm' }
        ]},
        // Option 2
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'md', contents: [
          { type: 'box', layout: 'horizontal', justifyContent: 'space-between', contents: [
            { type: 'text', text: 'Option 2', size: 'sm', weight: 'bold', color: '#3b82f6' },
            { type: 'text', text: 'เฉพาะ Major', size: 'xs', color: '#94a3b8' }
          ]},
          { type: 'text', text: 'Internal Med, Ped, OB-GYN, Surgery', size: 'xs', color: '#cbd5e1', margin: 'sm', wrap: true },
          { type: 'text', text: '34,900 บาท', size: 'xl', weight: 'bold', color: '#FFFFFF', margin: 'sm' }
        ]},
        // Option 3
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '16px', margin: 'md', contents: [
          { type: 'box', layout: 'horizontal', justifyContent: 'space-between', contents: [
            { type: 'text', text: 'Option 3', size: 'sm', weight: 'bold', color: '#22c55e' },
            { type: 'text', text: 'เฉพาะ Minor', size: 'xs', color: '#94a3b8' }
          ]},
          { type: 'text', text: 'ER/Ortho/Trauma, Forensic, ENT, Eye', size: 'xs', color: '#cbd5e1', margin: 'sm', wrap: true },
          { type: 'text', text: '15,000 บาท', size: 'xl', weight: 'bold', color: '#FFFFFF', margin: 'sm' }
        ]},
        { type: 'text', text: 'MedNinja Academy — ติวสอบใบประกอบวิชาชีพแพทย์', size: 'xxs', color: '#475569', align: 'center', margin: 'xl' }
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px', backgroundColor: '#0f172a', contents: [
        { type: 'button', action: { type: 'uri', label: 'ดูคลิปตัวอย่างฟรี', uri: 'https://medninja.academy/demo/watch/0' }, style: 'primary', color: '#3b82f6', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'สมัคร Ninja Passport (ฟรี 7 วัน)', uri: 'https://liff.line.me/2009259048-OK5LlGhE' }, style: 'primary', color: '#7c3aed', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'เข้าเว็บไซต์', uri: 'https://medninja.academy' }, style: 'link', color: '#94a3b8', height: 'sm' }
      ]}
    }
  }
}

function buildPreClinicFlex() {
  return {
    type: 'flex', altText: 'PRE-CLINIC Crash Course — พื้นฐานแพทย์ ปี 1-3 | MedNinja Academy',
    contents: {
      type: 'bubble', size: 'giga',
      hero: { type: 'image', url: 'https://medninja.b-cdn.net/pre-clinic.png', size: 'full', aspectRatio: '16:9', aspectMode: 'cover',
        action: { type: 'uri', uri: 'https://medninja.academy/courses' } },
      body: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '24px', backgroundColor: '#0f172a', contents: [
        { type: 'text', text: 'PRE-CLINIC', size: 'xxl', weight: 'bold', color: '#FFFFFF', align: 'center' },
        { type: 'text', text: 'Crash Course', size: 'sm', color: '#60a5fa', align: 'center', weight: 'bold' },
        { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'sm', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#059669', cornerRadius: '8px', paddingAll: '4px', paddingStart: '12px', paddingEnd: '12px', contents: [
            { type: 'text', text: 'นักศึกษาแพทย์ ปี 1-3', size: 'xxs', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'vertical', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '14px', contents: [
          { type: 'text', text: 'VDO ระบบ 90 ชั่วโมง', size: 'sm', weight: 'bold', color: '#93c5fd', wrap: true },
          { type: 'text', text: 'INTERACTIVE SYNAPSE เชื่อมโยง', size: 'xs', color: '#34d399', wrap: true, margin: 'sm' },
          { type: 'text', text: 'Anatomy + Biochem + Patho', size: 'xs', color: '#34d399', wrap: true, margin: 'xs' },
          { type: 'text', text: 'พัฒนาเพื่อนักเรียน MedNinja โดยเฉพาะ', size: 'xxs', color: '#94a3b8', wrap: true, margin: 'sm' }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'text', text: 'วิชาที่เรียน', size: 'sm', weight: 'bold', color: '#FFFFFF', margin: 'md' },
        { type: 'box', layout: 'vertical', margin: 'sm', spacing: 'xs', backgroundColor: '#1e293b', cornerRadius: '10px', paddingAll: '12px', contents: [
          { type: 'text', text: '🧬 Biochemistry', size: 'xs', color: '#93c5fd', wrap: true },
          { type: 'text', text: '💊 Pharmacology', size: 'xs', color: '#93c5fd', wrap: true },
          { type: 'text', text: '📊 Statistics', size: 'xs', color: '#93c5fd', wrap: true },
          { type: 'text', text: '🦠 Microbiology', size: 'xs', color: '#93c5fd', wrap: true },
          { type: 'separator', color: '#334155', margin: 'sm' },
          { type: 'text', text: 'Pathophysiology Systems', size: 'xxs', weight: 'bold', color: '#f59e0b', margin: 'sm' },
          { type: 'text', text: '🩸 Hematology  |  🧠 Neuro  |  🧴 Skin', size: 'xs', color: '#94a3b8', wrap: true },
          { type: 'text', text: '🌬️ Respi  |  ❤️ Cardio  |  💧 Nephro', size: 'xs', color: '#94a3b8', wrap: true },
          { type: 'text', text: '🍽️ GI  |  🧪 Endocrine  |  🤰 Reproductive', size: 'xs', color: '#94a3b8', wrap: true }
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm', contents: [
          { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
            { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#064e3b', cornerRadius: '15px',
              contents: [{ type: 'text', text: '▶', size: 'sm', align: 'center', gravity: 'center', color: '#34d399' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
            { type: 'box', layout: 'vertical', flex: 1, contents: [
              { type: 'text', text: 'VDO + SYNAPSE (Pre-clinic)', size: 'xs', weight: 'bold', color: '#34d399', wrap: true },
              { type: 'text', text: '90 ชั่วโมง', size: 'xs', color: '#94a3b8' }] }
          ]},
          { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
            { type: 'box', layout: 'vertical', width: '30px', height: '30px', backgroundColor: '#1e3a5f', cornerRadius: '15px',
              contents: [{ type: 'text', text: '↺', size: 'sm', align: 'center', gravity: 'center', color: '#93c5fd' }], justifyContent: 'center', alignItems: 'center', flex: 0 },
            { type: 'box', layout: 'vertical', flex: 1, contents: [
              { type: 'text', text: 'ดูวีดีโอย้อนหลังได้ตลอด 1 ปี', size: 'xs', weight: 'bold', color: '#93c5fd', wrap: true },
              { type: 'text', text: 'ทบทวนได้ไม่อั้น', size: 'xs', color: '#94a3b8', wrap: true }] }
          ]}
        ]},
        { type: 'separator', color: '#1e3a5f', margin: 'lg' },
        { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: 'lg', spacing: 'sm', contents: [
          { type: 'text', text: '฿34,900', size: 'xl', weight: 'bold', color: '#FFFFFF', flex: 0 }
        ]},
        { type: 'text', text: 'MedNinja Co., Ltd.', size: 'xxs', color: '#475569', align: 'center', margin: 'md' }
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', backgroundColor: '#0f172a', contents: [
        { type: 'button', action: { type: 'uri', label: 'ดูรายละเอียด', uri: 'https://medninja.academy/courses' }, style: 'primary', color: '#059669', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'สอบถาม LINE @medninja', uri: 'https://line.me/R/ti/p/@medninja' }, style: 'link', color: '#94a3b8', height: 'sm' }
      ]}
    }
  }
}

function buildRegisterFlex() {
  return {
    type: 'flex', altText: 'สมัครเรียน MedNinja Academy — เริ่มเรียนได้ทันที',
    contents: {
      type: 'bubble', size: 'giga',
      header: { type: 'box', layout: 'vertical', backgroundColor: '#0f172a', paddingAll: '24px', contents: [
        { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
          { type: 'box', layout: 'vertical', width: '44px', height: '44px', backgroundColor: '#16a34a', cornerRadius: '12px',
            contents: [{ type: 'text', text: 'M', color: '#FFFFFF', size: 'xxl', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center' },
          { type: 'box', layout: 'vertical', paddingStart: '14px', contents: [
            { type: 'text', text: 'MedNinja Academy', color: '#FFFFFF', size: 'lg', weight: 'bold' },
            { type: 'text', text: 'ติวสอบใบประกอบวิชาชีพแพทย์', color: '#94a3b8', size: 'xxs', margin: 'sm' }
          ]}
        ]}
      ]},
      body: { type: 'box', layout: 'vertical', spacing: 'lg', paddingAll: '24px', backgroundColor: '#ffffff', contents: [
        { type: 'box', layout: 'horizontal', justifyContent: 'center', contents: [
          { type: 'box', layout: 'vertical', backgroundColor: '#16a34a', cornerRadius: '20px', paddingAll: '5px', paddingStart: '16px', paddingEnd: '16px', contents: [
            { type: 'text', text: 'สมัครเรียน', size: 'sm', weight: 'bold', color: '#FFFFFF', align: 'center' }
          ]}
        ]},
        { type: 'text', text: 'พร้อมเริ่มเรียนแล้ว', size: 'xl', weight: 'bold', color: '#0f172a', align: 'center', margin: 'md' },
        { type: 'text', text: 'สมัคร Ninja Passport ก่อนได้เลย\nทีมงานจะส่งวิธีชำระเงินให้ทาง LINE นี้ค่ะ', size: 'xs', color: '#64748b', align: 'center', wrap: true, margin: 'sm' },
        { type: 'separator', color: '#f1f5f9', margin: 'lg' },
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#dcfce7', cornerRadius: '18px',
            contents: [{ type: 'text', text: '1', color: '#16a34a', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'สมัคร Ninja Passport', size: 'md', weight: 'bold', color: '#0f172a' },
            { type: 'text', text: 'กดปุ่มด้านล่าง กรอกข้อมูลบัตรประชาชน', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#dbeafe', cornerRadius: '18px',
            contents: [{ type: 'text', text: '2', color: '#3b82f6', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'ทีมงานส่งวิธีชำระเงินให้', size: 'md', weight: 'bold', color: '#0f172a' },
            { type: 'text', text: 'แจ้งรายละเอียดทาง LINE นี้ค่ะ', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'box', layout: 'horizontal', margin: 'xl', spacing: 'md', contents: [
          { type: 'box', layout: 'vertical', width: '36px', height: '36px', backgroundColor: '#f3e8ff', cornerRadius: '18px',
            contents: [{ type: 'text', text: '3', color: '#7c3aed', size: 'md', weight: 'bold', align: 'center', gravity: 'center' }],
            justifyContent: 'center', alignItems: 'center', flex: 0 },
          { type: 'box', layout: 'vertical', flex: 1, contents: [
            { type: 'text', text: 'เข้าเรียนได้ทันที', size: 'md', weight: 'bold', color: '#0f172a' },
            { type: 'text', text: 'เปิดระบบให้ เข้าเว็บเรียนได้เลย', size: 'xs', color: '#64748b', wrap: true, margin: 'sm' }
          ]}
        ]},
        { type: 'separator', color: '#f1f5f9', margin: 'xl' },
        { type: 'box', layout: 'vertical', backgroundColor: '#f0fdf4', cornerRadius: '10px', paddingAll: '14px', margin: 'md', contents: [
          { type: 'text', text: 'สมัครง่าย ใช้แค่บัตรประชาชน ไม่มีค่าใช้จ่าย', size: 'xs', weight: 'bold', color: '#16a34a', align: 'center', wrap: true }
        ]},
        { type: 'box', layout: 'vertical', backgroundColor: '#eff6ff', cornerRadius: '10px', paddingAll: '12px', margin: 'md', contents: [
          { type: 'text', text: 'เคยสมัคร Passport แล้ว?', size: 'xs', weight: 'bold', color: '#3b82f6', align: 'center' },
          { type: 'text', text: 'แจ้งชื่อ-นามสกุลทาง LINE นี้ได้เลยค่ะ', size: 'xxs', color: '#2563eb', align: 'center', wrap: true, margin: 'sm' }
        ]}
      ]},
      footer: { type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#f8fafc', contents: [
        { type: 'button', action: { type: 'uri', label: 'สมัคร Ninja Passport', uri: 'https://liff.line.me/2009259048-OK5LlGhE' }, style: 'primary', color: '#16a34a', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: 'เข้าเว็บไซต์', uri: 'https://medninja.academy' }, style: 'link', height: 'sm' }
      ]}
    }
  }
}

function buildCourseFlex(course) {
  const flexMap = {
    nl: () => {
      delete require.cache[require.resolve('../../scripts/send-flex-test')]
      return require('../../scripts/send-flex-test').f
    },
    nl2: () => buildNL2Flex().contents ? buildNL2Flex() : null,
    meq: () => {
      delete require.cache[require.resolve('../../scripts/send-meq-flex')]
      return require('../../scripts/send-meq-flex').flex
    },
    osce: () => {
      delete require.cache[require.resolve('../../scripts/send-osce-flex')]
      return require('../../scripts/send-osce-flex').flex
    },
    preclinic: () => buildPreClinicFlex(),
    ddx: () => {
      const { buildDdxGameFlex } = require('../flashcard/ddxFlex')
      return buildDdxGameFlex()
    }
  }
  const builder = flexMap[course]
  if (!builder) return null
  try { return JSON.parse(JSON.stringify(builder())) } catch { return null }
}

const TEMPLATE_BUILDERS = {
  trial: buildTrialFlex,
  payment: buildPaymentFlex,
  nlmastery: buildNLMasteryFlex,
  howto: buildHowToFlex,
  quiz: buildQuizFlex,
  survey: buildSurveyFlex,
  register: buildRegisterFlex,
  installment: buildInstallmentFlex,
  news: buildNewsFlex,
  ad: buildAdFlex
}

module.exports = {
  buildTrialFlex,
  buildPaymentFlex,
  buildInstallmentFlex,
  buildNewsFlex,
  buildAdFlex,
  buildNLMasteryFlex,
  buildNL2Flex,
  buildPreClinicFlex,
  buildQuizFlex,
  buildSurveyFlex,
  buildHowToFlex,
  buildRegisterFlex,
  buildCourseFlex,
  TEMPLATE_BUILDERS
}
