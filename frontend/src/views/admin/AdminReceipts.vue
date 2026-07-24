<template>
  <div class="receipts">
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="26" height="26">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h1>ใบเสร็จรับเงิน</h1>
            <p>ออก ค้นหา และดาวน์โหลดใบเสร็จให้นักเรียน</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- ═══ Toolbar ═══ -->
      <div class="toolbar">
        <button class="btn btn-primary" @click="openIssueModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          ออกใบเสร็จใหม่
        </button>
        <div class="search-box">
          <input v-model="filter.q" type="text" placeholder="ค้นหา (เลขที่/ชื่อ/อีเมล/เลขบัตร)"
                 @input="debouncedLoad">
        </div>
        <label class="void-toggle">
          <input type="checkbox" v-model="filter.includeVoid" @change="loadList()">
          แสดงที่ยกเลิกแล้ว
        </label>
      </div>

      <!-- ═══ Table ═══ -->
      <div class="table-card">
        <div v-if="loading" class="loading">กำลังโหลด...</div>
        <table v-else-if="list.items.length" class="rec-table">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>วันที่</th>
              <th>ลูกค้า</th>
              <th>เลขบัตรประชาชน</th>
              <th class="right">ยอดรวม</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in list.items" :key="r._id" :class="{ voided: r.voided }">
              <td class="mono">{{ r.receiptNo }}</td>
              <td>{{ fmtDate(r.issuedAt) }}</td>
              <td>{{ r.customer.name }}</td>
              <td class="mono">{{ r.customer.nationalId || '—' }}</td>
              <td class="right mono">{{ fmtMoney(r.total) }}</td>
              <td>
                <span v-if="r.voided" class="badge bad">ยกเลิกแล้ว</span>
                <span v-else class="badge ok">ใช้งาน</span>
              </td>
              <td class="actions">
                <a class="btn btn-mini btn-outline" :href="pdfUrl(r._id)" target="_blank">
                  ดาวน์โหลด PDF
                </a>
                <button v-if="!r.voided" class="btn btn-mini btn-danger-outline"
                        @click="voidReceipt(r)">
                  ยกเลิก
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">
          ยังไม่มีใบเสร็จ — คลิก "ออกใบเสร็จใหม่" เพื่อเริ่ม
        </div>

        <div v-if="list.pages > 1" class="pager">
          <button class="btn btn-mini btn-outline" :disabled="list.page <= 1"
                  @click="filter.page = list.page - 1; loadList()">‹ ก่อนหน้า</button>
          <span>หน้า {{ list.page }} / {{ list.pages }}</span>
          <button class="btn btn-mini btn-outline" :disabled="list.page >= list.pages"
                  @click="filter.page = list.page + 1; loadList()">ถัดไป ›</button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════ MODAL: ออกใบเสร็จใหม่ ═══════════════════════════════════════ -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <h2>ออกใบเสร็จใหม่</h2>
          <button class="btn-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Step 1: เลือกนักเรียน -->
          <div v-if="!form.userId" class="step">
            <label class="lbl">ค้นหานักเรียน (พิมพ์ชื่อ/อีเมล/เลขบัตร)</label>
            <input v-model="userSearch" type="text" placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร..."
                   @input="debouncedSearch" class="input" autofocus>
            <div v-if="userResults.length" class="user-results">
              <div v-for="u in userResults" :key="u._id" class="user-result"
                   @click="selectUser(u)">
                <div class="u-name">{{ [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name }}</div>
                <div class="u-meta">
                  <span v-if="u.email">{{ u.email }}</span>
                  <span v-if="u.phone">• {{ u.phone }}</span>
                  <span v-if="u.nationalId">• เลขบัตร {{ u.nationalId }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="userSearch.length >= 2 && !searchLoading" class="empty-small">
              ไม่พบนักเรียน
            </div>
          </div>

          <!-- Step 2: กรอกข้อมูลใบเสร็จ -->
          <div v-else class="step">
            <!-- ข้อมูลลูกค้า -->
            <div class="section-head">
              <h3>ข้อมูลลูกค้า</h3>
              <button class="btn btn-mini btn-outline" @click="resetUser">เปลี่ยนนักเรียน</button>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>ชื่อ-นามสกุล *</label>
                <input v-model="form.customer.name" type="text" class="input">
              </div>
              <div class="field">
                <label>เลขบัตรประชาชน</label>
                <input v-model="form.customer.nationalId" type="text" class="input" maxlength="13">
              </div>
              <div class="field">
                <label>อีเมล</label>
                <input v-model="form.customer.email" type="email" class="input">
              </div>
              <div class="field">
                <label>เบอร์โทร</label>
                <input v-model="form.customer.phone" type="tel" class="input">
              </div>
            </div>

            <div class="field">
              <label>ที่อยู่ (บ้านเลขที่/ถนน)</label>
              <input v-model="form.customer.address" type="text" class="input">
            </div>
            <div class="grid-3">
              <div class="field">
                <label>ตำบล/แขวง</label>
                <input v-model="form.customer.subDistrict" type="text" class="input">
              </div>
              <div class="field">
                <label>อำเภอ/เขต</label>
                <input v-model="form.customer.district" type="text" class="input">
              </div>
              <div class="field">
                <label>จังหวัด</label>
                <input v-model="form.customer.province" type="text" class="input">
              </div>
            </div>
            <div class="field field-narrow">
              <label>รหัสไปรษณีย์</label>
              <input v-model="form.customer.postalCode" type="text" class="input" maxlength="5">
            </div>

            <label class="save-toggle">
              <input type="checkbox" v-model="form.saveAddressToUser">
              บันทึกที่อยู่/เลขบัตรกลับเข้าโปรไฟล์นักเรียนด้วย
            </label>

            <!-- Activation shortcut -->
            <div v-if="activations.length" class="activation-list">
              <div class="section-head">
                <h3>ประวัติการเปิดสิทธิ์ (คลิกเพื่อเพิ่มเป็นรายการ)</h3>
              </div>
              <div class="act-grid">
                <button v-for="a in activations" :key="a._id" class="act-card"
                        @click="addItemFromActivation(a)">
                  <div class="act-name">{{ a.packageName }}</div>
                  <div class="act-meta">
                    เปิดเมื่อ {{ fmtDate(a.activatedAt) }} • หมด {{ fmtDate(a.expiresAt) }}
                  </div>
                  <div class="act-price" v-if="a.packagePrice">฿ {{ fmtMoney(a.packagePrice) }}</div>
                </button>
              </div>
            </div>

            <!-- รายการในใบเสร็จ -->
            <div class="section-head">
              <h3>รายการ</h3>
              <button class="btn btn-mini btn-outline" @click="addBlankItem">+ เพิ่มรายการ</button>
            </div>

            <div class="items">
              <div v-for="(it, i) in form.items" :key="i" class="item-row">
                <input v-model="it.description" type="text" class="input flex" placeholder="รายละเอียด">
                <input v-model.number="it.amount" type="number" class="input amt" placeholder="0.00" min="0" step="0.01">
                <button class="btn-remove" @click="form.items.splice(i, 1)" title="ลบ">✕</button>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>วิธีชำระเงิน</label>
                <select v-model="form.paymentMethod" class="input">
                  <option>เงินสด</option>
                  <option>โอนธนาคาร</option>
                  <option>บัตรเครดิต</option>
                  <option>QR PromptPay</option>
                  <option>อื่นๆ</option>
                </select>
              </div>
              <div class="field">
                <label>ยอดรวม (บาท)</label>
                <div class="total-display">฿ {{ fmtMoney(computedTotal) }}</div>
              </div>
            </div>

            <div class="field">
              <label>หมายเหตุ (ไม่บังคับ)</label>
              <textarea v-model="form.notes" class="input" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div v-if="form.userId" class="modal-foot">
          <button class="btn btn-outline" @click="closeModal">ยกเลิก</button>
          <button class="btn btn-primary" :disabled="!canSubmit || submitting" @click="submit">
            {{ submitting ? 'กำลังออก...' : 'ออกใบเสร็จ + ดาวน์โหลด PDF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(false)
const list = reactive({ items: [], page: 1, pages: 1, total: 0 })
const filter = reactive({ q: '', includeVoid: false, page: 1 })

let searchTimer = null
function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { filter.page = 1; loadList() }, 300)
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: filter.page, limit: 20 }
    if (filter.q) params.q = filter.q
    if (filter.includeVoid) params.includeVoid = '1'
    const data = await api.get('/admin/receipts', { params })
    list.items = data.items || []
    list.page = data.page || 1
    list.pages = data.pages || 1
    list.total = data.total || 0
  } catch (e) {
    console.error(e)
    alert('โหลดข้อมูลไม่สำเร็จ: ' + (e?.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

function pdfUrl(id) {
  const token = localStorage.getItem('token')
  return `/api/admin/receipts/${id}/pdf?_token=${encodeURIComponent(token || '')}`
}

async function voidReceipt(r) {
  const reason = prompt(`ยืนยันยกเลิกใบเสร็จ ${r.receiptNo}?\n(ระบุเหตุผล, ไม่บังคับ)`, '')
  if (reason === null) return
  try {
    await api.patch(`/admin/receipts/${r._id}/void`, { reason })
    await loadList()
  } catch (e) {
    alert('ยกเลิกไม่สำเร็จ: ' + (e?.response?.data?.message || e.message))
  }
}

// ═════════ Modal ═════════
const showModal = ref(false)
const userSearch = ref('')
const userResults = ref([])
const searchLoading = ref(false)
const activations = ref([])
const submitting = ref(false)

const emptyForm = () => ({
  userId: null,
  customer: {
    name: '', nationalId: '', email: '', phone: '',
    address: '', subDistrict: '', district: '', province: '', postalCode: ''
  },
  items: [{ description: '', amount: 0 }],
  paymentMethod: 'เงินสด',
  notes: '',
  saveAddressToUser: true
})
const form = reactive(emptyForm())

function openIssueModal() {
  // Reset ทีละ field เพื่อ preserve reactivity ของ nested customer object
  form.userId = null
  form.customer.name = ''
  form.customer.nationalId = ''
  form.customer.email = ''
  form.customer.phone = ''
  form.customer.address = ''
  form.customer.subDistrict = ''
  form.customer.district = ''
  form.customer.province = ''
  form.customer.postalCode = ''
  form.items = [{ description: '', amount: 0 }]
  form.paymentMethod = 'เงินสด'
  form.notes = ''
  form.saveAddressToUser = true
  userSearch.value = ''
  userResults.value = []
  activations.value = []
  showModal.value = true
}
function closeModal() { showModal.value = false }
function resetUser() {
  form.userId = null
  activations.value = []
  userSearch.value = ''
  userResults.value = []
}

let userSearchTimer = null
function debouncedSearch() {
  clearTimeout(userSearchTimer)
  userSearchTimer = setTimeout(searchUsers, 300)
}
async function searchUsers() {
  if (userSearch.value.length < 2) { userResults.value = []; return }
  searchLoading.value = true
  try {
    const data = await api.get('/admin/receipts/search-users', { params: { q: userSearch.value } })
    userResults.value = data.items || []
  } finally {
    searchLoading.value = false
  }
}

async function selectUser(u) {
  // ⭐ Pre-fill ทันทีจาก search result ก่อน await
  //    กัน form ว่างถ้า prefill API ช้า/ล้ม (นักเรียนต้องเห็นชื่อทันที)
  const fallbackName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || ''
  form.customer.name = fallbackName
  form.customer.nationalId = u.nationalId || ''
  form.customer.email = u.email || ''
  form.customer.phone = u.phone || ''
  form.userId = u._id

  try {
    const data = await api.get(`/admin/receipts/prefill/${u._id}`)
    // Merge ทีละ field เพื่อไม่ทับข้อมูลที่มีอยู่ด้วยค่าว่าง
    if (data.customer) {
      for (const k of Object.keys(form.customer)) {
        if (data.customer[k] !== undefined && data.customer[k] !== '') {
          form.customer[k] = data.customer[k]
        }
      }
    }
    activations.value = data.activations || []
  } catch (e) {
    console.error('prefill fail:', e)
    // แสดงเตือนแค่ address (ชื่อมีอยู่แล้วจาก fallback)
    if (e?.response?.status && e.response.status !== 404) {
      alert('โหลดข้อมูลที่อยู่ไม่สำเร็จ — กรอกเองได้ (' + (e?.response?.data?.message || e.message) + ')')
    }
  }
}

function addItemFromActivation(a) {
  // ถ้ารายการแรกยังว่าง → เขียนทับ
  const first = form.items[0]
  const item = { description: a.packageName, amount: a.packagePrice || 0 }
  if (first && !first.description && !first.amount) {
    form.items.splice(0, 1, item)
  } else {
    form.items.push(item)
  }
}
function addBlankItem() {
  form.items.push({ description: '', amount: 0 })
}

const computedTotal = computed(() =>
  form.items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
)

const canSubmit = computed(() => {
  if (!form.userId) return false
  if (!form.customer.name?.trim()) return false
  const valid = form.items.filter(it => it.description?.trim() && Number(it.amount) > 0)
  return valid.length > 0
})

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      userId: form.userId,
      customer: form.customer,
      items: form.items.filter(it => it.description?.trim() && Number(it.amount) > 0),
      total: computedTotal.value,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      saveAddressToUser: form.saveAddressToUser
    }
    const data = await api.post('/admin/receipts', payload)
    const id = data.receipt?._id
    if (id) window.open(pdfUrl(id), '_blank')
    closeModal()
    await loadList()
  } catch (e) {
    alert('ออกใบเสร็จไม่สำเร็จ: ' + (e?.response?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

// ═════════ Utils ═════════
function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear() + 543}`
}
function fmtMoney(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(loadList)
</script>

<style scoped>
.receipts { min-height: 100vh; background: #f6f8fc; padding-bottom: 60px; }

.admin-hero {
  background: linear-gradient(135deg, #2864c8 0%, #3b82f6 100%);
  color: #fff; padding: 32px 0;
}
.admin-hero-inner { display: flex; align-items: center; gap: 16px; }
.admin-hero-icon {
  width: 52px; height: 52px; background: rgba(255,255,255,0.15);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
}
.admin-hero h1 { margin: 0; font-size: 22px; font-weight: 700; }
.admin-hero p { margin: 4px 0 0; opacity: 0.85; font-size: 14px; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.section { padding-top: 24px; }

.toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.search-box { flex: 1; min-width: 220px; }
.search-box input {
  width: 100%; padding: 10px 14px; border: 1px solid #d0d7e2; border-radius: 8px;
  font-size: 14px; background: #fff;
}
.void-toggle { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 6px; cursor: pointer; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: all 0.15s;
}
.btn-primary {
  background: linear-gradient(135deg, #2864c8, #3b82f6); color: #fff;
  box-shadow: 0 2px 6px rgba(40,100,200,0.25);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(40,100,200,0.35); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: #fff; color: #2864c8; border: 1px solid #cbd5e1; }
.btn-outline:hover { background: #f1f5f9; }
.btn-danger-outline { background: #fff; color: #b91c1c; border: 1px solid #fecaca; }
.btn-danger-outline:hover { background: #fef2f2; }
.btn-mini { padding: 6px 10px; font-size: 12px; }

.table-card {
  background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.rec-table { width: 100%; border-collapse: collapse; }
.rec-table th, .rec-table td { padding: 12px 14px; text-align: left; font-size: 14px; border-bottom: 1px solid #eef2f7; }
.rec-table th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.rec-table td.right, .rec-table th.right { text-align: right; }
.rec-table td.mono, .rec-table th.mono { font-family: ui-monospace, Menlo, monospace; }
.rec-table tr.voided { opacity: 0.5; }
.rec-table td.actions { display: flex; gap: 6px; }

.badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge.ok { background: #dcfce7; color: #166534; }
.badge.bad { background: #fee2e2; color: #991b1b; }

.loading, .empty { padding: 40px; text-align: center; color: #94a3b8; }

.pager { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 16px; }

/* ═══════════ Modal ═══════════ */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
  overflow-y: auto;
}
.modal {
  background: #fff; border-radius: 14px; width: 100%; max-width: 720px;
  max-height: 92vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-head {
  padding: 18px 22px; border-bottom: 1px solid #eef2f7;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-head h2 { margin: 0; font-size: 18px; color: #1e40af; }
.btn-close {
  background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer;
  padding: 4px 10px; border-radius: 6px;
}
.btn-close:hover { background: #f1f5f9; color: #475569; }

.modal-body { padding: 20px 22px; overflow-y: auto; flex: 1; }
.modal-foot {
  padding: 16px 22px; border-top: 1px solid #eef2f7;
  display: flex; justify-content: flex-end; gap: 10px;
  background: #fafbfd;
}

.step { display: flex; flex-direction: column; gap: 14px; }
.lbl { font-size: 13px; color: #475569; font-weight: 600; }

.input {
  width: 100%; padding: 9px 12px; border: 1px solid #d0d7e2; border-radius: 8px;
  font-size: 14px; background: #fff; transition: border 0.15s; box-sizing: border-box;
}
.input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.user-results {
  margin-top: 8px; border: 1px solid #eef2f7; border-radius: 8px; overflow: hidden;
  max-height: 320px; overflow-y: auto;
}
.user-result { padding: 12px 14px; cursor: pointer; border-bottom: 1px solid #eef2f7; }
.user-result:last-child { border-bottom: none; }
.user-result:hover { background: #f1f5f9; }
.u-name { font-weight: 600; color: #1e293b; }
.u-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
.empty-small { padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; }

.section-head { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.section-head h3 { margin: 0; font-size: 14px; color: #1e40af; font-weight: 700; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 12px; color: #64748b; font-weight: 600; }
.field-narrow { max-width: 200px; }

.save-toggle {
  display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;
  padding: 8px 12px; background: #f1f5f9; border-radius: 8px; cursor: pointer;
}

.activation-list { border-top: 1px solid #eef2f7; padding-top: 12px; }
.act-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 8px; }
.act-card {
  background: #fff; border: 1px solid #d0d7e2; border-radius: 10px; padding: 10px 12px;
  text-align: left; cursor: pointer; transition: all 0.15s;
}
.act-card:hover { border-color: #3b82f6; background: #f0f7ff; box-shadow: 0 2px 6px rgba(40,100,200,0.1); }
.act-name { font-weight: 600; font-size: 13px; color: #1e293b; }
.act-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
.act-price { font-size: 13px; color: #2864c8; font-weight: 700; margin-top: 4px; }

.items { display: flex; flex-direction: column; gap: 8px; }
.item-row { display: flex; gap: 8px; align-items: center; }
.item-row .flex { flex: 1; }
.item-row .amt { width: 130px; text-align: right; }
.btn-remove {
  background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
  width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 14px;
}
.btn-remove:hover { background: #fee2e2; }

.total-display {
  padding: 9px 12px; font-size: 18px; font-weight: 700; color: #2864c8;
  background: #f0f7ff; border-radius: 8px; text-align: right;
}

@media (max-width: 640px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .rec-table { font-size: 12px; }
  .rec-table th, .rec-table td { padding: 8px 10px; }
  .rec-table td.actions { flex-direction: column; }
}
</style>
