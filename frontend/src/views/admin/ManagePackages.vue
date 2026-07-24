<template>
  <div class="admin-packages">
    <div class="page-header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>จัดการ Packages</h1>
          <p>จัดการเนื้อหาการเรียน — เชื่อม Sections (VDO) กับ Visa</p>
        </div>
        <button class="btn btn-primary" @click="openNewForm">
          + เพิ่ม Package ใหม่
        </button>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert alert-danger" style="margin-bottom: 16px; padding: 12px 16px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c00;">
        {{ error }}
      </div>
      <div v-if="successMsg" style="background: #d1fae5; border: 1px solid #6ee7b7; padding: 12px 16px; border-radius: 8px; color: #065f46; margin-bottom: 16px; display:flex; align-items:center; gap:8px;">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
        {{ successMsg }}
      </div>

      <!-- Add/Edit Package Form -->
      <div v-if="showForm" class="card" style="margin-bottom: 24px;">
        <div class="card-body" style="padding: 24px;">
          <h2>{{ editingId ? 'แก้ไข Package' : 'เพิ่ม Package ใหม่' }}</h2>

          <form @submit.prevent="handleSubmit" style="margin-top: 16px;">
            <div class="grid grid-2">
              <div class="form-group">
                <label>ชื่อ Package</label>
                <input v-model="form.title" type="text" class="form-control" required placeholder="เช่น NLE 1+2 Integrated" />
              </div>
              <div class="form-group">
                <label>ระยะเวลา (วัน)</label>
                <input v-model.number="form.durationDays" type="number" class="form-control" min="1" />
              </div>
              <div class="form-group">
                <label>ลำดับการแสดงผล</label>
                <input v-model.number="form.order" type="number" class="form-control" min="0" />
              </div>
            </div>

            <div class="form-group">
              <label>รายละเอียด</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="อธิบาย Package โดยย่อ..."></textarea>
            </div>

            <!-- Sections: Selected (ordered) + Available -->
            <div class="form-group">
              <label>เนื้อหาที่รวมใน Package ({{ form.sectionIds.length }} รายการ)</label>

              <!-- Selected sections — ordered list with ↑↓ -->
              <div v-if="form.sectionIds.length > 0" class="selected-sections">
                <div v-for="(secId, idx) in form.sectionIds" :key="secId" class="selected-item">
                  <span class="selected-order">{{ idx + 1 }}</span>
                  <span class="selected-label">
                    <strong>{{ getSectionCode(secId) }}</strong> — {{ getSectionName(secId) }}
                  </span>
                  <div class="selected-actions">
                    <button type="button" class="move-btn" :disabled="idx === 0" @click="moveSection(idx, -1)" title="เลื่อนขึ้น">&#9650;</button>
                    <button type="button" class="move-btn" :disabled="idx === form.sectionIds.length - 1" @click="moveSection(idx, 1)" title="เลื่อนลง">&#9660;</button>
                    <button type="button" class="move-btn move-remove" @click="removeSection(idx)" title="ลบออก">&times;</button>
                  </div>
                </div>
              </div>

              <!-- Available sections — click to add -->
              <div v-if="availableSections.length > 0" style="margin-top: 8px;">
                <span style="font-size: 12px; color: var(--gray); display: block; margin-bottom: 4px;">คลิกเพื่อเพิ่ม:</span>
                <div class="available-sections">
                  <button
                    v-for="sec in availableSections"
                    :key="sec._id"
                    type="button"
                    class="available-item"
                    @click="addSection(sec._id)"
                  >
                    + <strong>{{ sec.code }}</strong> — {{ sec.name }}
                    <span style="color: var(--gray); font-size: 11px; margin-left: 4px;">({{ sec.videoCount || (sec.videos || []).length }} วีดีโอ)</span>
                  </button>
                </div>
              </div>

              <div v-if="allSections.length === 0" style="padding: 16px; text-align: center; color: var(--gray); font-size: 13px; border: 1px dashed var(--border); border-radius: 8px;">
                ยังไม่มีเนื้อหา — ไปเพิ่มที่หน้า "จัดการวีดีโอ" ก่อน
              </div>
            </div>

            <!-- ═══ ORIENT VIDEOS (ปฐมนิเทศ) ═══ -->
            <fieldset style="border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin: 12px 0;">
              <legend style="font-weight: 800; font-size: 13px; color: #003580; padding: 0 8px;">
                🎬 Orient Video (ปฐมนิเทศ) — modal เด้งครั้งแรกที่นักเรียนกด "ยอมรับ"
              </legend>

              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 12px; font-weight: 700;">
                  🔗 Bunny DRM Video ID
                  <span style="color: #d97706; font-weight: 600; font-size: 11px;">— ต้องคู่กับ No-DRM</span>
                </label>
                <input v-model="form.orientBunnyDrmVideoId" type="text" class="form-control" placeholder="เช่น e1d3df7e-49be-4e5d-9966-430cafa9febc" />
                <small style="color: #64748b; font-size: 11px;">ใช้กับ Desktop Chrome, Android</small>
              </div>

              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 12px; font-weight: 700;">
                  🔗 Bunny No-DRM Video ID
                  <span style="color: #d97706; font-weight: 600; font-size: 11px;">— ต้องคู่กับ DRM</span>
                </label>
                <input v-model="form.orientBunnyNoDrmVideoId" type="text" class="form-control" placeholder="เช่น 15c58504-4516-4c75-b806-fe080356b60b" />
                <small style="color: #64748b; font-size: 11px;">ใช้กับ iOS, Safari (Widevine ไม่ support)</small>
              </div>

              <div class="form-group" style="margin-bottom: 6px;">
                <label style="font-size: 12px; font-weight: 700;">
                  🎯 Ali Video ID (Passport-only — optional)
                </label>
                <input v-model="form.orientAliVideoId" type="text" class="form-control" placeholder="Ali Video ID (dual encryption)" />
                <small style="color: #64748b; font-size: 11px;">iOS/Safari + จีน + Bunny fallback (Passport เท่านั้น)</small>
              </div>

              <div v-if="orientPairError" style="background: #fef2f2; color: #dc2626; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px;">
                ⚠️ {{ orientPairError }}
              </div>
              <div v-else-if="!form.orientBunnyDrmVideoId && !form.orientBunnyNoDrmVideoId && !form.orientAliVideoId" style="color: #64748b; font-size: 11px; margin-top: 6px;">
                ℹ️ ไม่ใส่เลย = ไม่มี modal orient (นักเรียนกด "ยอมรับ" แล้วเข้าคอร์สได้ทันทีเหมือนเดิม)
              </div>
            </fieldset>

            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
              <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="isPublished" v-model="form.isPublished" />
                <label for="isPublished" style="margin: 0;">เผยแพร่ Package</label>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="liveEnabled" v-model="form.liveEnabled" />
                <label for="liveEnabled" style="margin: 0;">เปิดห้องเรียนสด</label>
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึก' : 'เพิ่ม Package') }}
              </button>
              <button type="button" class="btn btn-outline" @click="cancelEdit">ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Packages Table (flat list) -->
      <div class="card">
        <div v-if="loading" style="padding: 40px; text-align: center; color: var(--gray);">
          กำลังโหลด...
        </div>
        <div v-else-if="error && packages.length === 0" style="text-align:center; padding:40px 20px; color:var(--danger);">
          <p>{{ error }}</p>
          <button class="btn btn-outline" style="margin-top:12px;" @click="fetchAll">ลองใหม่</button>
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>วัน</th>
              <th>Sections</th>
              <th>นักเรียน</th>
              <th>เผยแพร่</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pkg in sortedPackages" :key="pkg._id">
              <td style="font-weight: 700;">
                {{ pkg.title }}
                <span v-if="pkg.isDemo" style="display:inline-block;font-size:10px;font-weight:800;background:#dbeafe;color:#2563eb;padding:1px 6px;border-radius:4px;margin-left:4px;">DEMO</span>
                <span v-if="pkg.liveEnabled" style="display:inline-block;font-size:10px;font-weight:800;background:#fef2f2;color:#dc2626;padding:1px 6px;border-radius:4px;margin-left:4px;">LIVE</span>
              </td>
              <td style="font-size: 13px; color: var(--gray);">{{ pkg.durationDays || 365 }}</td>
              <td>
                <span style="font-size: 12px; color: var(--gray);">{{ getSectionCodes(pkg) }}</span>
              </td>
              <td style="font-size:12px;">
                <div v-if="pkg.activeStudents || pkg.activeAdmins">
                  <span style="color:#2563eb;font-weight:700;">{{ pkg.activeStudents }}</span> <span style="color:#94a3b8;">นักเรียน</span>
                  <span v-if="pkg.activeAdmins" style="margin-left:4px;color:#7c3aed;font-weight:700;">{{ pkg.activeAdmins }}</span><span v-if="pkg.activeAdmins" style="color:#94a3b8;"> admin</span>
                  <div style="color:#94a3b8;font-size:11px;">เหลือสูงสุด {{ pkg.maxDaysLeft }} วัน</div>
                </div>
                <span v-else style="color:#cbd5e1;">-</span>
              </td>
              <td>
                <span :style="{ color: pkg.isPublished ? 'var(--success)' : 'var(--gray)', fontSize: '13px' }">
                  <span style="display:inline-flex; align-items:center; gap:4px;">
                    <svg v-if="pkg.isPublished" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ pkg.isPublished ? 'เผยแพร่' : 'ร่าง' }}
                  </span>
                </span>
              </td>
              <td style="white-space: nowrap;">
                <template v-if="deletingId === pkg._id">
                  <span style="font-size: 12px; color: #dc2626; font-weight: 600; margin-right: 6px;">ยืนยันลบ?</span>
                  <button class="btn btn-sm btn-danger" @click="deletePackage(pkg._id)">ลบเลย</button>
                  <button class="btn btn-sm btn-outline" style="margin-left: 4px;" @click="deletingId = null">ยกเลิก</button>
                </template>
                <template v-else>
                  <button class="btn btn-sm btn-outline" @click="editPackage(pkg)">แก้ไข</button>
                  <button v-if="!pkg.isDemo && !pkg.hasActiveUsers" class="btn btn-sm btn-danger" style="margin-left: 4px;" @click="deletingId = pkg._id">ลบ</button>
                  <span v-if="pkg.hasActiveUsers" style="font-size:11px;color:#f59e0b;margin-left:6px;" title="มีนักเรียน active อยู่">🔒</span>
                </template>
              </td>
            </tr>
            <tr v-if="packages.length === 0">
              <td colspan="6" style="text-align: center; color: var(--gray); padding: 40px;">ยังไม่มี Package</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManagePackages',
  data() {
    return {
      packages: [],
      allSections: [],
      loading: false,
      saving: false,
      error: null,
      successMsg: '',
      showForm: false,
      editingId: null,
      deletingId: null,
      form: {
        title: '',
        description: '',
        durationDays: 365,
        order: 0,
        isPublished: false,
        liveEnabled: false,
        sectionIds: [],
        orientBunnyDrmVideoId: '',
        orientBunnyNoDrmVideoId: '',
        orientAliVideoId: ''
      }
    }
  },
  computed: {
    sortedPackages() {
      return [...this.packages].sort((a, b) => (a.order || 0) - (b.order || 0))
    },
    orientPairError() {
      const drm = (this.form.orientBunnyDrmVideoId || '').trim()
      const noDrm = (this.form.orientBunnyNoDrmVideoId || '').trim()
      if (!!drm !== !!noDrm) {
        return 'Bunny orient video ต้องใส่ครบคู่ (DRM + No-DRM) หรือเว้นทั้งคู่'
      }
      return ''
    },
    sectionCodeMap() {
      const map = {}
      this.allSections.forEach(s => { map[s._id] = s.code })
      return map
    },
    sectionNameMap() {
      const map = {}
      this.allSections.forEach(s => { map[s._id] = s.name })
      return map
    },
    availableSections() {
      const selected = new Set(this.form.sectionIds)
      return this.allSections.filter(s => !selected.has(s._id))
    }
  },
  async mounted() {
    await this.fetchAll()
  },
  methods: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const [pkgData, secData] = await Promise.all([
          api.get('/admin/packages'),
          api.get('/admin/sections')
        ])
        this.packages = pkgData.packages || pkgData
        this.allSections = (secData.sections || secData).sort((a, b) => (a.order || 0) - (b.order || 0))
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'
      } finally {
        this.loading = false
      }
    },

    getSectionCode(id) { return this.sectionCodeMap[id] || id },
    getSectionName(id) { return this.sectionNameMap[id] || '' },
    addSection(id) { this.form.sectionIds.push(id) },
    removeSection(idx) { this.form.sectionIds.splice(idx, 1) },
    moveSection(idx, dir) {
      const arr = this.form.sectionIds
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= arr.length) return
      const tmp = arr[idx]
      arr.splice(idx, 1)
      arr.splice(newIdx, 0, tmp)
    },

    getSectionCodes(pkg) {
      const ids = pkg.sections || pkg.sectionIds || []
      if (ids.length === 0) return '-'
      return ids.map(id => {
        const sId = typeof id === 'object' ? (id._id || id) : id
        return this.sectionCodeMap[sId] || sId
      }).join(', ')
    },

    openNewForm() {
      this.resetForm()
      this.showForm = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    editPackage(pkg) {
      this.editingId = pkg._id
      const sectionIds = (pkg.sections || pkg.sectionIds || []).map(s =>
        typeof s === 'object' ? (s._id || s) : s
      )
      this.form = {
        title: pkg.title || '',
        description: pkg.description || '',
        durationDays: pkg.durationDays || 365,
        order: pkg.order || 0,
        isPublished: pkg.isPublished || false,
        liveEnabled: pkg.liveEnabled || false,
        sectionIds,
        orientBunnyDrmVideoId: pkg.orientBunnyDrmVideoId || '',
        orientBunnyNoDrmVideoId: pkg.orientBunnyNoDrmVideoId || '',
        orientAliVideoId: pkg.orientAliVideoId || ''
      }
      this.showForm = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    cancelEdit() {
      this.showForm = false
      this.resetForm()
    },

    async handleSubmit() {
      if (this.orientPairError) {
        this.error = this.orientPairError
        return
      }
      this.saving = true
      this.error = null
      try {
        const payload = {
          title: this.form.title.trim(),
          description: this.form.description.trim(),
          durationDays: this.form.durationDays,
          order: this.form.order,
          isPublished: this.form.isPublished,
          liveEnabled: this.form.liveEnabled,
          sections: this.form.sectionIds,
          orientBunnyDrmVideoId: (this.form.orientBunnyDrmVideoId || '').trim(),
          orientBunnyNoDrmVideoId: (this.form.orientBunnyNoDrmVideoId || '').trim(),
          orientAliVideoId: (this.form.orientAliVideoId || '').trim()
        }
        const isEdit = !!this.editingId
        if (isEdit) {
          await api.put(`/admin/packages/${this.editingId}`, payload)
        } else {
          await api.post('/admin/packages', payload)
        }
        this.showForm = false
        this.resetForm()
        await this.fetchAll()
        this.successMsg = isEdit ? 'แก้ไข Package เรียบร้อย' : 'เพิ่ม Package ใหม่เรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกข้อมูลล้มเหลว'
      } finally {
        this.saving = false
      }
    },

    async deletePackage(id) {
      this.error = null
      try {
        await api.delete(`/admin/packages/${id}`)
        this.deletingId = null
        await this.fetchAll()
        this.successMsg = 'ลบ Package เรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.deletingId = null
        this.error = err.response?.data?.message || 'ลบข้อมูลล้มเหลว'
      }
    },

    resetForm() {
      this.editingId = null
      this.form = {
        title: '',
        description: '',
        durationDays: 365,
        order: 0,
        isPublished: false,
        liveEnabled: false,
        sectionIds: [],
        orientBunnyDrmVideoId: '',
        orientBunnyNoDrmVideoId: '',
        orientAliVideoId: ''
      }
    }
  }
}
</script>

<style scoped>
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Selected sections — ordered list */
.selected-sections {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  background: #fff;
}
.selected-item:last-child { border-bottom: none; }
.selected-order {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.selected-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selected-actions { display: flex; gap: 2px; flex-shrink: 0; }
.move-btn {
  width: 26px; height: 26px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--gray);
}
.move-btn:hover:not(:disabled) { background: var(--gray-lighter); color: var(--primary); }
.move-btn:disabled { opacity: 0.3; cursor: default; }
.move-remove { color: #dc2626; font-size: 16px; font-weight: 700; }
.move-remove:hover:not(:disabled) { background: #fef2f2; color: #dc2626; }

/* Available sections — click to add */
.available-sections {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.available-item {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  background: var(--gray-lighter);
  cursor: pointer;
  transition: all 150ms;
}
.available-item:hover {
  background: #ede9fe;
  border-color: #a855f7;
  color: #7c3aed;
}
</style>
