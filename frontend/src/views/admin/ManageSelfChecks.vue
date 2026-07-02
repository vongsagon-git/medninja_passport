<template>
  <div class="mng-sc">
    <div class="mng-header">
      <router-link to="/admin" class="back">← กลับ Admin</router-link>
      <h1>📋 Self Check Templates</h1>
      <div class="head-actions">
        <router-link to="/admin/checklist-analytics" class="btn btn-ghost">📊 Self Check Analytic</router-link>
        <button class="btn btn-primary" @click="newTemplate">+ Template ใหม่</button>
      </div>
    </div>

    <!-- Template List -->
    <div v-if="!editing" class="tpl-grid">
      <div v-if="loading" class="loading">กำลังโหลด...</div>
      <div v-else-if="!templates.length" class="empty">
        ยังไม่มี template — กด <b>+ Template ใหม่</b> เพื่อสร้าง
      </div>
      <div
        v-for="t in templates"
        :key="t.slug"
        class="tpl-card"
        :style="{ '--theme': t.color || '#3b82f6' }"
      >
        <div class="tpl-head">
          <span class="tpl-icon">{{ t.icon || '📋' }}</span>
          <div class="tpl-info">
            <div class="tpl-name">{{ t.name }}</div>
            <div class="tpl-slug">{{ t.slug }}</div>
          </div>
          <span v-if="!t.isPublished" class="tpl-draft-badge">DRAFT</span>
        </div>
        <div class="tpl-tagline" v-if="t.tagline">{{ t.tagline }}</div>
        <div class="tpl-stats">
          <div class="stat"><b>{{ t.sections?.length || 0 }}</b><span>หมวด</span></div>
          <div class="stat"><b>{{ t.totalItems }}</b><span>ข้อ</span></div>
          <div class="stat"><b>{{ t.bindingCount }}</b><span>ผูก</span></div>
          <div class="stat"><b>{{ t.userCount }}</b><span>ผู้ใช้</span></div>
        </div>
        <div class="tpl-actions">
          <button class="btn-sm btn-outline" @click="editTemplate(t.slug)">✏️ แก้ list</button>
          <button class="btn-sm btn-outline" @click="duplicateTemplate(t)">⧉ คัดลอก</button>
          <button class="btn-sm btn-danger-outline" @click="deleteTemplate(t)">🗑 ลบ</button>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div v-else class="editor">
      <div class="editor-head">
        <button class="btn btn-ghost" @click="cancelEdit">← กลับ list</button>
        <h2>{{ editing.slug ? 'แก้ไข' : 'สร้างใหม่' }}: {{ form.name || '(ไม่มีชื่อ)' }}</h2>
        <div class="head-actions">
          <button class="btn btn-ghost" @click="cancelEdit">ยกเลิก</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'กำลังบันทึก…' : '💾 บันทึก' }}
          </button>
        </div>
      </div>

      <!-- Meta -->
      <div class="meta-card">
        <div class="row">
          <label class="field">
            <span>Slug (URL key) <small>— เปลี่ยนไม่ได้ตอนแก้</small></span>
            <input v-model="form.slug" :disabled="!!editing.slug" placeholder="dermatology-readiness" />
          </label>
          <label class="field">
            <span>ชื่อแสดงผล</span>
            <input v-model="form.name" placeholder="Dermatology Readiness Checklist" />
          </label>
        </div>
        <label class="field">
          <span>Tagline (คำโปรย)</span>
          <input v-model="form.tagline" placeholder="เช็กให้ชัวร์ก่อนสอบ..." />
        </label>
        <div class="row">
          <label class="field small">
            <span>Icon (emoji)</span>
            <input v-model="form.icon" placeholder="🩺" maxlength="4" />
          </label>
          <label class="field small">
            <span>Theme color</span>
            <input v-model="form.color" type="color" />
          </label>
          <label class="field check-field">
            <input type="checkbox" v-model="form.isPublished" />
            <span>Published (นักเรียนเห็น)</span>
          </label>
        </div>
      </div>

      <!-- Markdown import -->
      <details class="md-import">
        <summary>📥 Import จาก Markdown (paste แล้ว parse อัตโนมัติ)</summary>
        <textarea v-model="mdInput" rows="8" placeholder="### 1. หมวดแรก
- ข้อแรก
- ข้อสอง
### 2. หมวดสอง
- ข้อ..."></textarea>
        <div class="md-actions">
          <button class="btn-sm btn-primary" @click="parseMarkdown">Parse + แทนที่ทั้งหมด</button>
          <button class="btn-sm btn-outline" @click="parseMarkdown(true)">Parse + เพิ่มต่อท้าย</button>
        </div>
      </details>

      <!-- Sections + items list -->
      <div class="sections-wrap">
        <div
          v-for="(sec, si) in form.sections"
          :key="sec.id"
          class="sec-card"
        >
          <div class="sec-head">
            <button class="ic-btn" @click="moveSec(si, -1)" :disabled="si === 0" title="เลื่อนขึ้น">↑</button>
            <button class="ic-btn" @click="moveSec(si, 1)" :disabled="si === form.sections.length - 1" title="เลื่อนลง">↓</button>
            <span class="sec-num">{{ si + 1 }}</span>
            <input
              v-model="sec.title"
              class="sec-title-input"
              placeholder="ชื่อหมวด..."
            />
            <span class="sec-count">{{ sec.items.length }} ข้อ</span>
            <button class="ic-btn danger" @click="deleteSec(si)" title="ลบหมวด">✕</button>
          </div>
          <div class="items-wrap">
            <div
              v-for="(item, ii) in sec.items"
              :key="item.id"
              class="item-row"
            >
              <span class="item-bullet">•</span>
              <input
                v-model="item.text"
                class="item-input"
                placeholder="ข้อความ checklist..."
                @keydown.enter="addItem(si, ii + 1)"
              />
              <button class="ic-btn" @click="moveItem(si, ii, -1)" :disabled="ii === 0" title="เลื่อนขึ้น">↑</button>
              <button class="ic-btn" @click="moveItem(si, ii, 1)" :disabled="ii === sec.items.length - 1" title="เลื่อนลง">↓</button>
              <button class="ic-btn danger" @click="deleteItem(si, ii)" title="ลบข้อ">✕</button>
            </div>
            <button class="add-item-btn" @click="addItem(si)">+ เพิ่มข้อ</button>
          </div>
        </div>
        <button class="add-sec-btn" @click="addSec">+ เพิ่มหมวดใหม่</button>
      </div>

      <div class="editor-footer">
        <div class="footer-stats">รวม {{ totalItems }} ข้อ ใน {{ form.sections.length }} หมวด</div>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'กำลังบันทึก…' : '💾 บันทึก' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

function genId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export default {
  name: 'ManageSelfChecks',
  data() {
    return {
      templates: [],
      loading: false,
      editing: null,        // null = list mode, { slug: null|string } = edit mode
      form: this._emptyForm(),
      saving: false,
      mdInput: ''
    }
  },
  computed: {
    totalItems() {
      return (this.form.sections || []).reduce((s, sec) => s + (sec.items?.length || 0), 0)
    }
  },
  mounted() { this.loadTemplates() },
  methods: {
    _emptyForm() {
      return {
        slug: '',
        name: '',
        tagline: '',
        icon: '📋',
        color: '#3b82f6',
        isPublished: true,
        sections: []
      }
    },
    async loadTemplates() {
      this.loading = true
      try {
        const res = await api.get('/admin/self-checks/templates')
        this.templates = res.templates || []
      } catch (err) {
        alert('โหลด templates ไม่สำเร็จ: ' + (err?.response?.data?.message || err.message))
      } finally {
        this.loading = false
      }
    },
    newTemplate() {
      this.form = this._emptyForm()
      this.form.sections = [{ id: genId('sec'), title: '1. หมวดแรก', items: [{ id: genId('itm'), text: '' }] }]
      this.editing = { slug: null }
      this.mdInput = ''
    },
    async editTemplate(slug) {
      try {
        const res = await api.get(`/admin/self-checks/templates/${slug}`)
        this.form = {
          slug: res.template.slug,
          name: res.template.name,
          tagline: res.template.tagline || '',
          icon: res.template.icon || '📋',
          color: res.template.color || '#3b82f6',
          isPublished: res.template.isPublished !== false,
          sections: (res.template.sections || []).map(s => ({
            id: s.id || genId('sec'),
            title: s.title,
            items: (s.items || []).map(i => ({ id: i.id || genId('itm'), text: i.text }))
          }))
        }
        this.editing = { slug }
        this.mdInput = ''
      } catch (err) {
        alert('โหลด template ไม่สำเร็จ: ' + (err?.response?.data?.message || err.message))
      }
    },
    duplicateTemplate(t) {
      const newSlug = prompt(`คัดลอก "${t.name}" — ตั้ง slug ใหม่:`, t.slug + '-copy')
      if (!newSlug) return
      api.get(`/admin/self-checks/templates/${t.slug}`).then(res => {
        const payload = { ...res.template, slug: newSlug.toLowerCase().trim() }
        delete payload._id
        delete payload.createdAt
        delete payload.updatedAt
        delete payload.__v
        // reset ids
        payload.sections = (payload.sections || []).map(s => ({
          id: genId('sec'),
          title: s.title,
          items: (s.items || []).map(i => ({ id: genId('itm'), text: i.text }))
        }))
        return api.post('/admin/self-checks/templates', payload)
      }).then(() => this.loadTemplates())
        .catch(err => alert('คัดลอกไม่สำเร็จ: ' + (err?.response?.data?.message || err.message)))
    },
    async deleteTemplate(t) {
      if (!confirm(`ลบ template "${t.name}" จริงๆ?\n(ถ้ามี binding อยู่ จะลบไม่ได้ — ต้องลบ binding ก่อน)`)) return
      try {
        await api.delete(`/admin/self-checks/templates/${t.slug}`)
        this.loadTemplates()
      } catch (err) {
        alert(err?.response?.data?.message || 'ลบไม่สำเร็จ')
      }
    },
    cancelEdit() {
      if (this.saving) return
      this.editing = null
      this.form = this._emptyForm()
    },
    // ─── List edit (สำคัญ: ตรงตามที่ user สั่ง "แก้ list ได้") ───
    addSec() {
      this.form.sections.push({
        id: genId('sec'),
        title: `${this.form.sections.length + 1}. หมวดใหม่`,
        items: [{ id: genId('itm'), text: '' }]
      })
    },
    deleteSec(si) {
      const sec = this.form.sections[si]
      if (sec.items.length && !confirm(`ลบหมวด "${sec.title}" และ ${sec.items.length} ข้อจริงๆ?`)) return
      this.form.sections.splice(si, 1)
    },
    moveSec(si, dir) {
      const target = si + dir
      if (target < 0 || target >= this.form.sections.length) return
      const [moved] = this.form.sections.splice(si, 1)
      this.form.sections.splice(target, 0, moved)
    },
    addItem(si, atIndex = null) {
      const sec = this.form.sections[si]
      const item = { id: genId('itm'), text: '' }
      if (atIndex === null) sec.items.push(item)
      else sec.items.splice(atIndex, 0, item)
      this.$nextTick(() => {
        const inputs = document.querySelectorAll(`.sec-card:nth-child(${si + 1}) .item-input`)
        const idx = atIndex !== null ? atIndex : inputs.length - 1
        if (inputs[idx]) inputs[idx].focus()
      })
    },
    deleteItem(si, ii) {
      this.form.sections[si].items.splice(ii, 1)
    },
    moveItem(si, ii, dir) {
      const sec = this.form.sections[si]
      const target = ii + dir
      if (target < 0 || target >= sec.items.length) return
      const [moved] = sec.items.splice(ii, 1)
      sec.items.splice(target, 0, moved)
    },
    // ─── Markdown parser ───
    parseMarkdown(append = false) {
      const text = this.mdInput.trim()
      if (!text) return
      const lines = text.split(/\r?\n/)
      const parsed = []
      let current = null
      for (const raw of lines) {
        const line = raw.trim()
        if (!line) continue
        const secMatch = line.match(/^#{2,4}\s+(.+)$/)
        const itemMatch = line.match(/^[-*•]\s+(.+)$/)
        if (secMatch) {
          current = { id: genId('sec'), title: secMatch[1].trim(), items: [] }
          parsed.push(current)
        } else if (itemMatch && current) {
          current.items.push({ id: genId('itm'), text: itemMatch[1].trim() })
        } else if (current) {
          // line ที่ไม่ใช่ section header/bullet → ถือเป็น item ปกติ
          current.items.push({ id: genId('itm'), text: line })
        }
      }
      if (!parsed.length) return alert('Parse ไม่ได้ — ใช้รูปแบบ "### หัวข้อ" + "- ข้อ"')
      if (append) {
        this.form.sections.push(...parsed)
      } else {
        if (!confirm(`แทนที่ทั้งหมดด้วย ${parsed.length} หมวด ${parsed.reduce((s, p) => s + p.items.length, 0)} ข้อ?`)) return
        this.form.sections = parsed
      }
      this.mdInput = ''
    },
    // ─── Save ───
    async save() {
      if (!this.form.slug) return alert('กรุณากรอก slug')
      if (!this.form.name) return alert('กรุณากรอกชื่อ')
      // strip empty items
      const cleaned = JSON.parse(JSON.stringify(this.form))
      cleaned.sections = cleaned.sections
        .map(s => ({ ...s, items: s.items.filter(i => (i.text || '').trim()) }))
        .filter(s => s.title || s.items.length)
      this.saving = true
      try {
        if (this.editing.slug) {
          await api.put(`/admin/self-checks/templates/${this.editing.slug}`, cleaned)
        } else {
          await api.post('/admin/self-checks/templates', cleaned)
        }
        this.editing = null
        this.loadTemplates()
      } catch (err) {
        alert('บันทึกไม่สำเร็จ: ' + (err?.response?.data?.message || err.message))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.mng-sc { max-width: 1100px; margin: 0 auto; padding: 20px 16px 80px; }
.mng-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
.back { color: #3b82f6; text-decoration: none; font-weight: 700; font-size: 13px; }
.mng-header h1 { flex: 1; font-size: 20px; margin: 0; color: #1e293b; }
.head-actions { display: flex; gap: 8px; }

.btn { padding: 8px 16px; border-radius: 8px; border: 0; cursor: pointer; font-weight: 700; font-size: 13px; font-family: inherit; }
.btn-primary { background: linear-gradient(135deg, #3b82f6, #60a5fa); color: #fff; }
.btn-primary:disabled { opacity: 0.6; cursor: wait; }
.btn-ghost { background: #f1f5f9; color: #475569; text-decoration: none; display: inline-block; }
.btn-ghost:hover { background: #e2e8f0; }

.loading, .empty { padding: 60px 20px; text-align: center; color: #64748b; font-size: 14px; }

.tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.tpl-card {
  background: #fff; border-radius: 12px; padding: 16px;
  border: 1px solid #e2e8f0;
  border-top: 4px solid var(--theme, #3b82f6);
  display: flex; flex-direction: column; gap: 10px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tpl-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(15,23,42,.08); }
.tpl-head { display: flex; align-items: center; gap: 10px; }
.tpl-icon { font-size: 28px; flex-shrink: 0; }
.tpl-info { flex: 1; min-width: 0; }
.tpl-name { font-weight: 800; font-size: 14px; color: #1e293b; line-height: 1.3; }
.tpl-slug { font-size: 11px; color: #94a3b8; font-family: monospace; }
.tpl-draft-badge { font-size: 9.5px; font-weight: 800; padding: 2px 7px; background: #fef3c7; color: #92400e; border-radius: 999px; }
.tpl-tagline { font-size: 12px; color: #64748b; line-height: 1.45; }
.tpl-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background: #f8fafc; border-radius: 8px; padding: 8px 4px; }
.tpl-stats .stat { display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #64748b; }
.tpl-stats .stat b { font-size: 16px; color: #1e293b; font-weight: 900; line-height: 1; margin-bottom: 2px; }
.tpl-actions { display: flex; gap: 6px; }
.btn-sm { flex: 1; padding: 7px 8px; border-radius: 7px; border: 0; cursor: pointer; font-weight: 700; font-size: 11.5px; font-family: inherit; }
.btn-outline { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.btn-outline:hover { background: #e2e8f0; }
.btn-danger-outline { background: #fff; color: #dc2626; border: 1px solid #fecaca; }
.btn-danger-outline:hover { background: #fef2f2; }

/* Editor */
.editor { display: flex; flex-direction: column; gap: 14px; }
.editor-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.editor-head h2 { flex: 1; font-size: 17px; margin: 0; color: #1e293b; min-width: 200px; }

.meta-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field span { font-size: 12px; font-weight: 700; color: #475569; }
.field span small { color: #94a3b8; font-weight: 400; margin-left: 4px; }
.field input { padding: 9px 11px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; }
.field input:focus { border-color: #3b82f6; outline: none; }
.field input:disabled { background: #f8fafc; color: #94a3b8; }
.field.small { max-width: 140px; }
.field.check-field { flex-direction: row; align-items: center; gap: 6px; }
.field.check-field input { width: 18px; height: 18px; }

.md-import { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; }
.md-import summary { cursor: pointer; font-weight: 700; font-size: 13px; color: #475569; }
.md-import textarea { width: 100%; margin-top: 10px; padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 12px; box-sizing: border-box; }
.md-actions { display: flex; gap: 8px; margin-top: 8px; }

.sections-wrap { display: flex; flex-direction: column; gap: 10px; }
.sec-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.sec-head { display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.sec-num { font-weight: 900; color: #3b82f6; font-size: 14px; min-width: 24px; text-align: center; }
.sec-title-input { flex: 1; padding: 7px 10px; border: 1.5px solid transparent; border-radius: 6px; font-size: 13px; font-weight: 700; color: #1e293b; background: #fff; font-family: inherit; }
.sec-title-input:focus { border-color: #3b82f6; outline: none; }
.sec-count { font-size: 11px; font-weight: 800; color: #64748b; background: #fff; padding: 3px 8px; border-radius: 999px; }

.ic-btn { width: 28px; height: 28px; border: 0; background: #fff; color: #64748b; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: 700; transition: all 0.12s; flex-shrink: 0; }
.ic-btn:hover { background: #e2e8f0; color: #1e293b; }
.ic-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.ic-btn.danger { color: #dc2626; }
.ic-btn.danger:hover { background: #fef2f2; }

.items-wrap { padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
.item-row { display: flex; align-items: center; gap: 5px; }
.item-bullet { color: #94a3b8; font-weight: 700; padding: 0 4px; }
.item-input { flex: 1; padding: 7px 10px; border: 1.5px solid transparent; border-radius: 6px; font-size: 12.5px; color: #334155; background: #f8fafc; font-family: inherit; }
.item-input:focus { border-color: #3b82f6; outline: none; background: #fff; }

.add-item-btn { background: transparent; border: 1.5px dashed #cbd5e1; color: #64748b; padding: 7px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px; margin-top: 4px; transition: all 0.12s; }
.add-item-btn:hover { background: #f1f5f9; border-color: #3b82f6; color: #3b82f6; }
.add-sec-btn { background: #fff; border: 2px dashed #cbd5e1; color: #64748b; padding: 14px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.15s; }
.add-sec-btn:hover { background: #f8fafc; border-color: #3b82f6; color: #3b82f6; }

.editor-footer {
  position: sticky; bottom: 0;
  background: #fff; border-top: 1px solid #e2e8f0;
  padding: 12px 16px; border-radius: 0 0 12px 12px;
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px;
  box-shadow: 0 -4px 12px rgba(0,0,0,.04);
}
.footer-stats { font-size: 12px; color: #64748b; font-weight: 700; }

@media (max-width: 600px) {
  .row { grid-template-columns: 1fr; }
  .tpl-grid { grid-template-columns: 1fr; }
}
</style>
