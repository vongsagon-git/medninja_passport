<template>
  <div class="approve-page">
    <div v-if="loading" class="loading">กำลังโหลดข้อมูล...</div>

    <div v-else-if="error" class="error">
      <h2>{{ error }}</h2>
      <button @click="goDashboard">ไป Dashboard</button>
    </div>

    <div v-else-if="reg" class="content">
      <div class="header">
        <div class="title">
          <span :class="['status-badge', 'status-' + reg.status]">{{ statusLabel }}</span>
          <h1>{{ reg.firstName }} {{ reg.lastName }}</h1>
        </div>
        <div class="submitted">สมัคร {{ formatDate(reg.createdAt) }}</div>
      </div>

      <div class="grid">
        <div class="col-image">
          <div class="section-label">📄 บัตรประชาชนที่ user อัพโหลด</div>
          <div class="id-card-wrap">
            <img :src="reg.idCardImage" alt="ID Card" @click="zoomImage(reg.idCardImage)">
          </div>

          <div v-if="reg.cmaProfileImage" class="section-label" style="margin-top:16px">🎓 รูปจาก ศรว. (เทียบดู)</div>
          <div v-if="reg.cmaProfileImage" class="id-card-wrap">
            <img :src="reg.cmaProfileImage" alt="CMA" @click="zoomImage(reg.cmaProfileImage)">
          </div>
        </div>

        <div class="col-info">
          <div class="info-block">
            <div class="section-label">ข้อมูลบัตร</div>
            <div class="row"><label>ชื่อไทย</label><div>{{ reg.firstName }} {{ reg.lastName }}</div></div>
            <div class="row"><label>ชื่อ EN</label><div>{{ reg.firstNameEn }} {{ reg.lastNameEn }}</div></div>
            <div class="row"><label>เลขบัตร</label><div class="mono">{{ reg.nationalId }}</div></div>
            <div class="row"><label>วันเกิด</label><div>{{ reg.dateOfBirth }}</div></div>
            <div class="row"><label>เพศ</label><div>{{ reg.sex === 'M' ? 'ชาย' : reg.sex === 'F' ? 'หญิง' : '-' }}</div></div>
          </div>

          <div class="info-block">
            <div class="section-label">ติดต่อ</div>
            <div class="row"><label>อีเมล</label><div class="mono">{{ reg.email }}</div></div>
            <div class="row"><label>เบอร์โทร</label><div class="mono">{{ reg.phone }}</div></div>
            <div class="row"><label>มหาลัย</label><div>{{ reg.university || '-' }}</div></div>
          </div>

          <div class="info-block">
            <div class="section-label">ศรว.</div>
            <div class="row">
              <label>สถานะ</label>
              <div>
                <span v-if="reg.cmaPassedAll" class="tag red">🎓 สอบครบทุกขั้น (น่าสงสัย)</span>
                <span v-else-if="reg.cmaRegistered" class="tag green">✓ สมัคร ศรว. แล้ว</span>
                <span v-else class="tag amber">❌ ยังไม่สมัคร ศรว.</span>
              </div>
            </div>
            <div v-if="reg.cmaNameTh" class="row"><label>ชื่อจาก ศรว.</label><div>{{ reg.cmaNameTh }}</div></div>
          </div>

          <div v-if="lineFollower" class="info-block">
            <div class="section-label">LINE</div>
            <div class="row"><label>ชื่อ LINE</label><div>{{ lineFollower.displayName }}</div></div>
            <div class="row"><label>Follow อยู่</label><div>{{ lineFollower.isFollowing === false ? '❌ Unfollow' : '✓ Follow' }}</div></div>
            <div v-if="lineFollower.isSpy" class="row"><label>SPY</label><div class="tag red">⚠ Marked as SPY</div></div>
            <div v-if="lineFollower.inChina" class="row"><label>ในจีน</label><div class="tag amber">🇨🇳</div></div>
          </div>

          <div class="info-block audit">
            <div class="section-label">🔎 Audit (ป้องกัน hack)</div>
            <div class="row"><label>IP</label><div class="mono">{{ reg.submitIp || '-' }}</div></div>
            <div class="row"><label>LINE UID</label><div class="mono small">{{ reg.submitLineUserId || '-' }}</div></div>

            <div v-if="audit.otherRegsWithSameLine?.length" class="warn-box">
              ⚠ LINE UID เดียวกันมีการสมัคร <b>{{ audit.otherRegsWithSameLine.length }}</b> ครั้ง:
              <ul>
                <li v-for="o in audit.otherRegsWithSameLine" :key="o._id">
                  {{ o.firstName }} {{ o.lastName }} ({{ maskNid(o.nationalId) }}) — {{ o.status }}
                </li>
              </ul>
            </div>

            <div v-if="audit.otherRegsWithSameIp?.length" class="warn-box">
              ⚠ IP เดียวกันมีการสมัคร <b>{{ audit.otherRegsWithSameIp.length }}</b> คน:
              <ul>
                <li v-for="o in audit.otherRegsWithSameIp" :key="o._id">
                  {{ o.firstName }} {{ o.lastName }} — {{ o.status }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-if="reg.status === 'pending_approval'" class="actions">
        <button class="btn-reject" @click="showRejectDialog = true" :disabled="busy">
          ❌ ปฏิเสธ (ban ทันที)
        </button>
        <button class="btn-approve" @click="doApprove" :disabled="busy">
          {{ busy ? 'กำลังอนุมัติ...' : '✅ อนุมัติ (bypass email + demo VISA)' }}
        </button>
      </div>

      <div v-else class="done-box">
        <div v-if="reg.status === 'approved'" class="done-approved">
          ✅ อนุมัติแล้วโดย <b>{{ reg.approvedBy }}</b> เมื่อ {{ formatDate(reg.approvedAt) }}
        </div>
        <div v-else class="done-rejected">
          ❌ ปฏิเสธโดย <b>{{ reg.rejectedBy }}</b> เมื่อ {{ formatDate(reg.rejectedAt) }}<br>
          <span v-if="reg.rejectReason">เหตุผล: {{ reg.rejectReason }}</span>
        </div>
      </div>
    </div>

    <div v-if="showRejectDialog" class="dialog-mask" @click.self="showRejectDialog = false">
      <div class="dialog">
        <h3>ปฏิเสธการสมัคร</h3>
        <p>ระบุเหตุผล (จะบันทึกใน log และแจ้ง user):</p>
        <textarea v-model="rejectReason" rows="3" placeholder="เช่น: ใช้บัตรของคนอื่น, รูปไม่ตรง, ..."></textarea>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showRejectDialog = false">ยกเลิก</button>
          <button class="btn-reject" @click="doReject" :disabled="busy">
            {{ busy ? 'กำลัง...' : 'ปฏิเสธและ ban' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="zoomedImage" class="zoom-mask" @click="zoomedImage = null">
      <img :src="zoomedImage" alt="zoom">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const busy = ref(false)
const reg = ref(null)
const user = ref(null)
const lineFollower = ref(null)
const audit = ref({ otherRegsWithSameLine: [], otherRegsWithSameIp: [] })

const showRejectDialog = ref(false)
const rejectReason = ref('')
const zoomedImage = ref(null)

const statusLabel = computed(() => {
  const s = reg.value?.status
  if (s === 'pending_approval') return '⏳ รออนุมัติ'
  if (s === 'approved') return '✅ อนุมัติแล้ว'
  if (s === 'rejected') return '❌ ปฏิเสธแล้ว'
  return s
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.get(`/admin/passport/approve/${route.params.token}`)
    reg.value = data.registration
    user.value = data.user
    lineFollower.value = data.lineFollower
    audit.value = data.audit || {}
  } catch (e) {
    error.value = e.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function doApprove() {
  if (busy.value) return
  if (!confirm(`ยืนยันการอนุมัติ ${reg.value.firstName} ${reg.value.lastName}?`)) return
  busy.value = true
  try {
    await api.post(`/admin/passport/approve/${route.params.token}`)
    alert('อนุมัติสำเร็จ')
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'อนุมัติไม่สำเร็จ')
  } finally { busy.value = false }
}

async function doReject() {
  if (busy.value) return
  busy.value = true
  try {
    await api.post(`/admin/passport/reject/${route.params.token}`, { reason: rejectReason.value })
    alert('ปฏิเสธและ ban เรียบร้อย')
    showRejectDialog.value = false
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Reject ไม่สำเร็จ')
  } finally { busy.value = false }
}

function zoomImage(url) { zoomedImage.value = url }
function goDashboard() { router.push('/admin/passport') }
function maskNid(nid) { return nid ? nid.slice(0, 4) + '*****' + nid.slice(-2) : '-' }
function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(load)
</script>

<style scoped>
.approve-page { min-height: 100vh; background: #f8fafc; padding: 20px; }
.loading, .error {
  max-width: 500px; margin: 60px auto; text-align: center;
  padding: 40px; background: #fff; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.content { max-width: 1200px; margin: 0 auto; }
.header {
  background: #fff; padding: 20px 24px; border-radius: 16px;
  margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.header h1 { margin: 8px 0 0; font-size: 24px; color: #1e293b; }
.status-badge {
  display: inline-block; padding: 4px 12px; border-radius: 999px;
  font-size: 13px; font-weight: 700;
}
.status-pending_approval { background: #fef3c7; color: #78350f; }
.status-approved { background: #dcfce7; color: #166534; }
.status-rejected { background: #fee2e2; color: #991b1b; }
.submitted { color: #94a3b8; font-size: 13px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
.col-image, .col-info { display: flex; flex-direction: column; gap: 12px; }
.section-label {
  font-size: 13px; color: #475569; font-weight: 700; margin-bottom: 6px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.id-card-wrap {
  background: #fff; border-radius: 12px; padding: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.id-card-wrap img {
  width: 100%; border-radius: 8px; cursor: zoom-in;
  display: block;
}
.info-block {
  background: #fff; padding: 16px 20px; border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.info-block.audit { background: #fef2f2; border: 1px solid #fecaca; }
.row {
  display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9;
  gap: 12px; align-items: center;
}
.row:last-child { border-bottom: 0; }
.row label { min-width: 100px; color: #64748b; font-size: 13px; }
.row div { color: #1e293b; font-size: 14px; font-weight: 500; flex: 1; }
.mono { font-family: 'Courier New', monospace; }
.small { font-size: 11px; word-break: break-all; }
.tag { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.tag.green { background: #dcfce7; color: #166534; }
.tag.red { background: #fee2e2; color: #991b1b; }
.tag.amber { background: #fef3c7; color: #78350f; }
.warn-box {
  background: #fff; border: 1px solid #fecaca;
  border-radius: 8px; padding: 12px;
  margin-top: 12px; color: #991b1b; font-size: 13px;
}
.warn-box ul { margin: 8px 0 0; padding-left: 20px; }
.actions {
  display: flex; gap: 12px; justify-content: center;
  margin-top: 24px; padding: 20px;
  background: #fff; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.btn-approve, .btn-reject, .btn-cancel {
  padding: 14px 28px; border-radius: 12px; border: 0;
  font-size: 15px; font-weight: 700; cursor: pointer;
  transition: transform 0.15s;
}
.btn-approve { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; flex: 2; }
.btn-reject { background: linear-gradient(135deg, #f87171, #ef4444); color: #fff; flex: 1; }
.btn-cancel { background: #e2e8f0; color: #475569; }
.btn-approve:hover:not(:disabled), .btn-reject:hover:not(:disabled) { transform: translateY(-2px); }
.btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.done-box {
  margin-top: 20px; padding: 16px 20px; border-radius: 12px;
  background: #fff; text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.done-approved { color: #166534; font-weight: 600; }
.done-rejected { color: #991b1b; font-weight: 600; }
.dialog-mask {
  position: fixed; inset: 0; background: rgba(15,23,42,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.dialog {
  background: #fff; border-radius: 16px; padding: 24px;
  max-width: 460px; width: 90%;
}
.dialog h3 { margin: 0 0 12px; color: #991b1b; }
.dialog textarea {
  width: 100%; padding: 10px; border: 1px solid #cbd5e1;
  border-radius: 8px; font-family: inherit; font-size: 14px;
  margin-top: 8px; resize: vertical;
}
.dialog-actions {
  display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;
}
.zoom-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 20px; cursor: zoom-out;
}
.zoom-mask img { max-width: 100%; max-height: 100%; border-radius: 8px; }
</style>
