<template>
  <div class="tags-page">
    <div class="page-header">
      <div class="container header-row">
        <div>
          <h1>🏷 จัดการ Demo Tags</h1>
          <p>Tag ที่แปะให้ video ใน Demo section (แก้แล้วมีผลกับทุก package)</p>
        </div>
        <button class="btn btn-primary" @click="openCreate">+ เพิ่ม Tag</button>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">✓ {{ successMsg }}</div>

      <div v-if="loading" class="loading">กำลังโหลด...</div>

      <table v-else class="tags-table">
        <thead>
          <tr>
            <th style="width:64px;">Order</th>
            <th style="width:120px;">Code</th>
            <th>Label</th>
            <th style="width:100px;">Color</th>
            <th>Description</th>
            <th style="width:200px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in sortedTags" :key="t._id">
            <td>
              <input type="number" class="order-input" v-model.number="t.order" @change="saveField(t, 'order')" />
            </td>
            <td>
              <code class="tag-code">{{ t.code }}</code>
              <span v-if="t.isSystem" class="badge-system">🔒 system</span>
            </td>
            <td>
              <span class="chip" :style="{background: t.color}">{{ t.label }}</span>
            </td>
            <td>
              <div class="color-swatch" :style="{background: t.color}"></div>
              <span class="color-hex">{{ t.color }}</span>
            </td>
            <td class="desc-cell">{{ t.description || '—' }}</td>
            <td>
              <button class="btn btn-sm btn-outline" @click="openEdit(t)">แก้</button>
              <button v-if="!t.isSystem" class="btn btn-sm btn-danger" @click="doDelete(t)" style="margin-left:6px;">ลบ</button>
              <span v-else class="lock-hint" title="system tag ห้ามลบ">🔒</span>
            </td>
          </tr>
          <tr v-if="!tags.length">
            <td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">ยังไม่มี tag ในระบบ</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═════ Modal: create/edit ═════ -->
    <div v-if="showForm" class="modal-mask" @click.self="closeForm">
      <div class="modal">
        <h2>{{ editing ? 'แก้ Tag' : 'เพิ่ม Tag ใหม่' }}</h2>

        <div class="form-row">
          <label>Code</label>
          <input v-model="form.code" type="text" placeholder="เช่น nl3, ent, longcase-ent" :disabled="editing && form.isSystem" />
          <small class="hint">ตัวเล็กเท่านั้น a-z / 0-9 / - (ห้ามซ้ำ) — ใช้เป็น identifier ระบบ</small>
        </div>

        <div class="form-row">
          <label>Label</label>
          <input v-model="form.label" type="text" placeholder="เช่น NL3, ENT, LONGCASE ENT" />
          <small class="hint">แสดงใน chip ให้ admin เห็นตอนแปะ tag</small>
        </div>

        <div class="form-row">
          <label>Color</label>
          <div class="color-row">
            <input v-model="form.color" type="color" class="color-picker" />
            <input v-model="form.color" type="text" class="color-text" placeholder="#0ea5e9" />
            <span class="chip" :style="{background: form.color}">{{ form.label || 'preview' }}</span>
          </div>
        </div>

        <div class="form-row">
          <label>Description (optional)</label>
          <textarea v-model="form.description" rows="2" placeholder="อธิบายว่า tag นี้ใช้กับ track ไหน / เมื่อไหร่"></textarea>
        </div>

        <div class="form-row">
          <label>Order</label>
          <input v-model.number="form.order" type="number" min="0" />
          <small class="hint">ลำดับใน picker (ยิ่งน้อยยิ่งขึ้นก่อน)</small>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="closeForm">ยกเลิก</button>
          <button class="btn btn-primary" @click="doSave" :disabled="saving">{{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageDemoTags',
  data() {
    return {
      tags: [],
      loading: false,
      error: '',
      successMsg: '',
      showForm: false,
      editing: null,   // tag ถ้ากำลังแก้
      saving: false,
      form: {
        code: '',
        label: '',
        color: '#0ea5e9',
        description: '',
        order: 0,
        isSystem: false
      }
    }
  },
  computed: {
    sortedTags() {
      return [...this.tags].sort((a, b) => (a.order || 0) - (b.order || 0) || a.code.localeCompare(b.code))
    }
  },
  async mounted() { await this.load() },
  methods: {
    async load() {
      this.loading = true
      try {
        const data = await api.get('/admin/demo-tags')
        this.tags = data.tags || []
      } catch (e) {
        this.error = e.response?.data?.message || 'โหลด tag ไม่สำเร็จ'
      } finally { this.loading = false }
    },
    openCreate() {
      this.editing = null
      this.form = { code: '', label: '', color: '#0ea5e9', description: '', order: this.tags.length, isSystem: false }
      this.showForm = true
    },
    openEdit(t) {
      this.editing = t
      this.form = { code: t.code, label: t.label, color: t.color, description: t.description || '', order: t.order || 0, isSystem: !!t.isSystem }
      this.showForm = true
    },
    closeForm() {
      this.showForm = false
      this.editing = null
    },
    async doSave() {
      this.saving = true
      this.error = ''
      try {
        const payload = {
          code: (this.form.code || '').toLowerCase().trim(),
          label: (this.form.label || '').trim(),
          color: this.form.color,
          description: (this.form.description || '').trim(),
          order: this.form.order || 0
        }
        if (!payload.code || !payload.label) {
          this.error = 'ต้องกรอก code + label'
          this.saving = false
          return
        }
        if (this.editing) {
          await api.put(`/admin/demo-tags/${this.editing._id}`, payload)
          this.successMsg = `แก้ tag "${payload.code}" เรียบร้อย`
        } else {
          await api.post('/admin/demo-tags', payload)
          this.successMsg = `เพิ่ม tag "${payload.code}" เรียบร้อย`
        }
        this.showForm = false
        this.editing = null
        await this.load()
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (e) {
        this.error = e.response?.data?.message || 'บันทึกไม่สำเร็จ'
      } finally { this.saving = false }
    },
    async saveField(tag, field) {
      // Inline save (สำหรับ order)
      try {
        await api.put(`/admin/demo-tags/${tag._id}`, { [field]: tag[field] })
      } catch (e) {
        this.error = e.response?.data?.message || 'บันทึกไม่สำเร็จ'
        await this.load()
      }
    },
    async doDelete(t) {
      if (!confirm(`ลบ tag "${t.code}"?\n(ระบบจะเช็คว่ามี video ไหนใช้อยู่ก่อน)`)) return
      try {
        await api.delete(`/admin/demo-tags/${t._id}`)
        this.successMsg = `ลบ tag "${t.code}" เรียบร้อย`
        await this.load()
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (e) {
        this.error = e.response?.data?.message || 'ลบไม่สำเร็จ'
        if (e.response?.data?.videos) {
          this.error += '\n' + e.response.data.videos.join('\n')
        }
      }
    }
  }
}
</script>

<style scoped>
.tags-page { min-height: 100vh; background: #f8fafc; padding-bottom: 40px; }
.page-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 20px 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-row h1 { margin: 0; font-size: 22px; color: #1e293b; }
.header-row p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.section { padding-top: 24px; }
.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
.alert-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; white-space: pre-wrap; }
.alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.loading { text-align: center; padding: 40px; color: #64748b; }

.tags-table {
  width: 100%; background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(15,23,42,0.04);
  border-collapse: separate; border-spacing: 0;
}
.tags-table th {
  background: #f1f5f9; text-align: left; padding: 12px 16px;
  font-size: 12px; color: #475569; font-weight: 700;
  letter-spacing: 0.5px; text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}
.tags-table td {
  padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
  font-size: 14px; color: #1e293b;
}
.tags-table tbody tr:hover { background: #f8fafc; }

.order-input {
  width: 56px; padding: 4px 8px; border: 1px solid #cbd5e1;
  border-radius: 6px; font-size: 13px; text-align: center;
}
.tag-code {
  background: #f1f5f9; padding: 3px 8px; border-radius: 6px;
  font-family: 'Courier New', monospace; font-size: 12px; color: #334155;
  font-weight: 700;
}
.badge-system {
  display: inline-block; background: #fef3c7; color: #78350f;
  padding: 2px 6px; border-radius: 4px; font-size: 10px;
  font-weight: 700; margin-left: 6px;
}
.chip {
  display: inline-flex; padding: 4px 12px; border-radius: 999px;
  color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
}
.color-swatch {
  width: 16px; height: 16px; border-radius: 4px;
  display: inline-block; vertical-align: middle;
  border: 1px solid #cbd5e1;
}
.color-hex {
  margin-left: 6px; font-family: 'Courier New', monospace;
  font-size: 11px; color: #64748b;
}
.desc-cell { color: #64748b; font-size: 13px; }
.lock-hint { color: #94a3b8; font-size: 16px; margin-left: 6px; }

.btn {
  padding: 8px 16px; border-radius: 8px; border: 0;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); }
.btn-outline { background: #fff; color: #475569; border: 1px solid #cbd5e1; }
.btn-outline:hover { background: #f1f5f9; }
.btn-danger { background: #fee2e2; color: #991b1b; }
.btn-danger:hover { background: #fecaca; }

.modal-mask {
  position: fixed; inset: 0; background: rgba(15,23,42,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  padding: 20px;
}
.modal {
  background: #fff; border-radius: 16px; padding: 24px;
  max-width: 500px; width: 100%;
  box-shadow: 0 20px 40px rgba(15,23,42,0.2);
}
.modal h2 { margin: 0 0 20px; font-size: 18px; color: #1e293b; }
.form-row { margin-bottom: 16px; }
.form-row label {
  display: block; font-size: 12px; color: #475569;
  font-weight: 700; margin-bottom: 6px; letter-spacing: 0.3px;
  text-transform: uppercase;
}
.form-row input[type="text"], .form-row input[type="number"], .form-row textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1;
  border-radius: 8px; font-size: 14px; font-family: inherit;
}
.form-row input[type="text"]:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
.hint { display: block; margin-top: 4px; font-size: 11px; color: #94a3b8; }
.color-row {
  display: flex; align-items: center; gap: 8px;
}
.color-picker {
  width: 44px; height: 40px; padding: 2px;
  border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer;
}
.color-text {
  flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1;
  border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px;
}
.form-actions {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;
}
</style>
