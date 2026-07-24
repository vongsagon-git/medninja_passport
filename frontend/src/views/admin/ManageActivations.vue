<template>
  <div class="admin-activations">
    <div class="page-header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>จัดการสิทธิ์เข้าเรียน (Visa)</h1>
          <p>เลือกคลาส → ดูนักเรียน → เพิ่มคนเข้าคลาส</p>
        </div>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert-msg alert-danger">{{ error }}</div>
      <div v-if="successMsg" class="alert-msg alert-success">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
        {{ successMsg }}
      </div>

      <!-- Package Cards — 1 คลาส 1 card -->
      <div v-if="loading" style="padding: 40px; text-align: center; color: var(--gray);">กำลังโหลด...</div>
      <div v-else class="class-grid">
        <div v-for="pkg in allPackages" :key="pkg._id" class="class-card" :class="{ 'class-selected': selectedPkg?._id === pkg._id }" @click="selectPackage(pkg)">
          <div class="cc-header">
            <div class="cc-title">{{ pkg.title }}</div>
            <span v-if="pkg.isDemo" class="cc-badge cc-demo">DEMO</span>
          </div>
          <div class="cc-stats">
            <div class="cc-stat">
              <span class="cc-num">{{ pkgActivations(pkg._id, 'active') }}</span>
              <span class="cc-label">กำลังเรียน</span>
            </div>
            <div class="cc-stat">
              <span class="cc-num cc-expired">{{ pkgActivations(pkg._id, 'expired') }}</span>
              <span class="cc-label">หมดอายุ</span>
            </div>
            <div class="cc-stat">
              <span class="cc-num cc-revoked">{{ pkgActivations(pkg._id, 'revoked') }}</span>
              <span class="cc-label">ถูกแบน</span>
            </div>
          </div>
          <div class="cc-footer">{{ pkg.durationDays || 365 }} วัน · {{ (pkg.sections || []).length }} sections</div>
        </div>
      </div>

      <!-- Selected Package → Student List -->
      <div v-if="selectedPkg" class="selected-section">
        <div class="ss-header">
          <h2>{{ selectedPkg.title }}</h2>
          <button class="btn btn-primary btn-sm" @click="showAddForm = !showAddForm">
            {{ showAddForm ? 'ปิดฟอร์ม' : '+ เพิ่มนักเรียน' }}
          </button>
        </div>

        <!-- Add Student Form -->
        <div v-if="showAddForm" class="add-form">
          <form @submit.prevent="handleCreate" style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
            <div style="flex:1;min-width:200px;">
              <label style="font-size:12px;font-weight:600;color:#64748b;">ค้นหานักเรียน</label>
              <input v-model="userSearch" type="text" class="form-control" placeholder="ชื่อ / เลขบัตร / อีเมล..." style="margin-bottom:4px;" />
              <select v-model="form.userId" class="form-control" required>
                <option value="">-- เลือก ({{ filteredStudents.length }}) --</option>
                <option v-for="u in filteredStudents" :key="u._id" :value="u._id">
                  {{ u.firstName || '' }} {{ u.lastName || '' }} | {{ u.nationalId || '-' }} | {{ u.lineDisplayName ? 'LINE:' + u.lineDisplayName : 'ยังไม่เชื่อม LINE' }} ({{ u.email || '-' }})
                </option>
              </select>
            </div>
            <div style="width:100px;">
              <label style="font-size:12px;font-weight:600;color:#64748b;">วัน</label>
              <input v-model.number="form.durationDays" type="number" class="form-control" min="1" :placeholder="String(selectedPkg.durationDays || 365)" />
            </div>
            <div style="width:140px;">
              <label style="font-size:12px;font-weight:600;color:#64748b;">ระดับเริ่มต้น</label>
              <select v-model.number="form.tier" class="form-control">
                <option :value="6">ระดับ 6 (สูงสุด)</option>
                <option :value="5">ระดับ 5</option>
                <option :value="4">ระดับ 4</option>
                <option :value="3">ระดับ 3</option>
                <option :value="2">ระดับ 2</option>
                <option :value="1">ระดับ 1</option>
              </select>
            </div>
            <div style="width:200px;">
              <label style="font-size:12px;font-weight:600;color:#64748b;">หมายเหตุ</label>
              <input v-model="form.note" type="text" class="form-control" placeholder="เช่น โอนเงินแล้ว" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="saving" style="height:38px;">
              {{ saving ? '...' : 'ลง Visa' }}
            </button>
          </form>
        </div>

        <!-- Admin Section -->
        <div v-if="adminActivations.length" class="role-section">
          <div class="role-section-header role-section-admin">
            <span>Admin ({{ adminActivations.length }})</span>
          </div>
          <table class="table">
            <thead><tr><th>ชื่อ</th><th>LINE</th><th>วันหมดอายุ</th><th>สถานะ</th><th>ระดับ</th><th>ระบบเสริม</th><th>ข้อตกลง</th><th>จัดการ</th></tr></thead>
            <tbody>
              <tr v-for="act in adminActivations" :key="act._id">
                <td>
                  <div style="font-weight:600;font-size:14px;">{{ getFullName(act) }}</div>
                  <div style="font-size:11px;color:var(--gray);">{{ getUserField(act, 'email') }}</div>
                </td>
                <td>
                  <div v-if="getUserField(act, 'lineUserId')" style="display:flex;align-items:center;gap:4px;">
                    <img v-if="getUserField(act, 'linePictureUrl')" :src="getUserField(act, 'linePictureUrl')" style="width:22px;height:22px;border-radius:50%;" />
                    <span style="font-size:11px;color:#06c755;font-weight:600;">{{ getUserField(act, 'lineDisplayName') || 'เชื่อมแล้ว' }}</span>
                    <span v-if="act.lineFollowing === false" class="badge-unfollow">unfollow</span>
                  </div>
                  <span v-else style="font-size:11px;color:#cbd5e1;">-</span>
                </td>
                <td style="font-size:13px;color:var(--gray);">
                  {{ formatDate(act.expiresAt) }}
                  <div v-if="act.extendedDays" style="font-size:11px;color:#7c3aed;">+{{ act.extendedDays }} วัน</div>
                </td>
                <td>
                  <span class="status-badge" :class="'status-' + getStatus(act)">{{ statusLabel(act) }}</span>
                  <div v-if="getStatus(act) === 'revoked' && act.banReason" class="ban-reason" :title="'แบนเมื่อ ' + formatDateTime(act.bannedAt)">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                    {{ act.banReason }}
                  </div>
                </td>
                <td>
                  <button class="tier-badge" :class="'tier-' + (act.tier || 6)" @click="openTierEdit(act)" :title="'คลิกเพื่อเปลี่ยนระดับ'">
                    ระดับ {{ act.tier || 6 }}
                  </button>
                </td>
                <td>
                  <div class="feat-row" :class="{ 'feat-banned': getStatus(act) === 'revoked' }" :title="getStatus(act) === 'revoked' ? 'activation ถูกแบน — ปลดแบนก่อนเพื่อแก้ feature' : ''">
                    <label class="feat-toggle" :class="{ on: act.liveEnabled }">
                      <input type="checkbox" :checked="act.liveEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'liveEnabled', $event.target.checked)">
                      <span>LIVE</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.qaEnabled }">
                      <input type="checkbox" :checked="act.qaEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'qaEnabled', $event.target.checked)">
                      <span>Q&A</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.synapseEnabled }">
                      <input type="checkbox" :checked="act.synapseEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'synapseEnabled', $event.target.checked)">
                      <span>Synapse</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.nlexEnabled }">
                      <input type="checkbox" :checked="act.nlexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'nlexEnabled', $event.target.checked)">
                      <span>NLEX</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.ddxEnabled }">
                      <input type="checkbox" :checked="act.ddxEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'ddxEnabled', $event.target.checked)">
                      <span>DDx</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.osceEnabled }">
                      <input type="checkbox" :checked="act.osceEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'osceEnabled', $event.target.checked)">
                      <span>OSCE</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.meqexEnabled }">
                      <input type="checkbox" :checked="act.meqexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'meqexEnabled', $event.target.checked)">
                      <span>MEQEX</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.atlasEnabled }">
                      <input type="checkbox" :checked="act.atlasEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'atlasEnabled', $event.target.checked)">
                      <span>ATLAS</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.longexEnabled }">
                      <input type="checkbox" :checked="act.longexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'longexEnabled', $event.target.checked)">
                      <span>LONGEX</span>
                    </label>
                    <label class="feat-toggle" :class="{ on: act.skill15Enabled }">
                      <input type="checkbox" :checked="act.skill15Enabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'skill15Enabled', $event.target.checked)">
                      <span>15-SKILL</span>
                    </label>
                  </div>
                </td>
                <td>
                  <span v-if="act.consentAcceptedAt" class="consent-ok" :title="'ยอมรับเมื่อ ' + formatDateTime(act.consentAcceptedAt)">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
                    ยอมรับแล้ว
                  </span>
                  <span v-else class="consent-pending">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd"/></svg>
                    รอยอมรับ
                  </span>
                </td>
                <td style="white-space:nowrap;">
                  <template v-if="extendingId === act._id">
                    <div style="display:flex;align-items:center;gap:4px;">
                      <input v-model.number="extendDays" type="number" class="form-control" min="1" max="365" style="width:70px;min-height:32px;padding:4px 8px;font-size:13px;" />
                      <button class="btn btn-sm btn-primary" @click="handleExtend(act._id)" :disabled="!extendDays">บันทึก</button>
                      <button class="btn btn-sm btn-outline" @click="extendingId = null">ยกเลิก</button>
                    </div>
                  </template>
                  <template v-else-if="banningId === act._id">
                    <input v-model="banReason" type="text" class="form-control" placeholder="เหตุผล เช่น ค้างชำระ" style="width:140px;min-height:32px;padding:4px 8px;font-size:13px;display:inline-block;margin-right:4px;" />
                    <button class="btn btn-sm btn-danger" @click="handleBan(act._id)">แบน</button>
                    <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="banningId = null">ไม่</button>
                  </template>
                  <template v-else-if="hardDeletingId === act._id">
                    <span style="font-size:12px;color:#dc2626;font-weight:600;margin-right:6px;">ลบถาวร? กู้คืนไม่ได้</span>
                    <button class="btn btn-sm btn-danger" @click="handleHardDelete(act._id)">ลบเลย</button>
                    <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="hardDeletingId = null">ไม่</button>
                  </template>
                  <template v-else>
                    <button class="btn btn-sm btn-outline" @click="startExtend(act._id)">ต่ออายุ</button>
                    <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="openMove(act)">ย้ายคอร์ส</button>
                    <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="handleOrientReset(act._id)" title="ล้าง progress ปฐมนิเทศ — user จะต้องดูใหม่">🔄 Orient</button>
                    <button class="btn btn-sm btn-outline" style="margin-left:4px;background:#fef3c7;border-color:#f59e0b;" @click="handleOrientBypass(act._id)" title="Mark orient completed ให้เลย — user ไม่ต้องดู">✅ Bypass</button>
                    <button v-if="getStatus(act) === 'revoked'" class="btn btn-sm btn-warn" style="margin-left:4px;" @click="handleUnban(act._id)">ปลดแบน</button>
                    <button v-else class="btn btn-sm btn-danger" style="margin-left:4px;" @click="startBan(act._id)">แบน</button>
                    <button class="btn btn-sm btn-danger" style="margin-left:4px;" @click="hardDeletingId = act._id">ลบ</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Student Section -->
        <div class="role-section">
          <div class="role-section-header role-section-student">
            <span>นักเรียน ({{ studentActivations.length }})</span>
          </div>
          <table class="table">
            <thead><tr><th>นักเรียน</th><th>LINE</th><th>วันหมดอายุ</th><th>สถานะ</th><th>ระดับ</th><th>ระบบเสริม</th><th>ข้อตกลง</th><th>จัดการ</th></tr></thead>
            <tbody>
              <tr v-for="act in studentActivations" :key="act._id">
                <td>
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="font-weight:600;font-size:14px;">{{ getFullName(act) }}</span>
                    <span v-if="act.cmaPassedAll" class="cma-mini cma-mini-done" title="สอบ ศรว. ผ่านครบทุกขั้นแล้ว">🎓 ผ่านครบ</span>
                    <span v-else-if="act.cmaRegistered" class="cma-mini cma-mini-ok" title="สมัครสอบ ศรว. แล้ว">✓ ศรว.</span>
                    <span v-else-if="act.cmaSyncedAt" class="cma-mini cma-mini-warn" :title="'ตรวจสอบเมื่อ ' + formatDate(act.cmaSyncedAt) + ' — ไม่พบในระบบ ศรว.'">⚠ ยังไม่สมัคร ศรว.</span>
                    <span v-else class="cma-mini cma-mini-unknown" title="ยังไม่เคยตรวจกับ ศรว. (ไปกด Sync ที่หน้า Passport)">? ยังไม่ตรวจ</span>
                  </div>
                  <div style="font-size:11px;color:var(--gray);">{{ getUserField(act, 'university') || '-' }}</div>
                  <div style="font-size:10px;color:#cbd5e1;font-family:monospace;">{{ getUserField(act, 'nationalId') || '-' }}</div>
                </td>
                <td>
                  <div v-if="getUserField(act, 'lineUserId')" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                    <img v-if="getUserField(act, 'linePictureUrl')" :src="getUserField(act, 'linePictureUrl')" style="width:22px;height:22px;border-radius:50%;" />
                    <span style="font-size:11px;color:#06c755;font-weight:600;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ getUserField(act, 'lineDisplayName') || 'เชื่อมแล้ว' }}</span>
                    <span v-if="act.lineFollowing === false" class="badge-unfollow">unfollow</span>
                  </div>
                  <span v-else style="font-size:11px;color:#cbd5e1;">ยังไม่เชื่อม</span>
                </td>
                <td style="font-size:13px;color:var(--gray);">
                  {{ formatDate(act.expiresAt) }}
                  <div v-if="act.extendedDays" style="font-size:11px;color:#7c3aed;">+{{ act.extendedDays }} วัน</div>
                </td>
              <td>
                <span class="status-badge" :class="'status-' + getStatus(act)">{{ statusLabel(act) }}</span>
                <div v-if="getStatus(act) === 'revoked' && act.banReason" class="ban-reason" :title="'แบนเมื่อ ' + formatDateTime(act.bannedAt)">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                  {{ act.banReason }}
                </div>
              </td>
              <td>
                <button class="tier-badge" :class="'tier-' + (act.tier || 4)" @click="openTierEdit(act)" :title="'คลิกเพื่อเปลี่ยนระดับ'">
                  ระดับ {{ act.tier || 4 }}
                </button>
              </td>
              <td>
                <div class="feat-row" :class="{ 'feat-banned': getStatus(act) === 'revoked' }" :title="getStatus(act) === 'revoked' ? 'activation ถูกแบน — ปลดแบนก่อนเพื่อแก้ feature' : ''">
                  <label class="feat-toggle" :class="{ on: act.liveEnabled }">
                    <input type="checkbox" :checked="act.liveEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'liveEnabled', $event.target.checked)">
                    <span>LIVE</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.qaEnabled }">
                    <input type="checkbox" :checked="act.qaEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'qaEnabled', $event.target.checked)">
                    <span>Q&A</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.synapseEnabled }">
                    <input type="checkbox" :checked="act.synapseEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'synapseEnabled', $event.target.checked)">
                    <span>Synapse</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.nlexEnabled }">
                    <input type="checkbox" :checked="act.nlexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'nlexEnabled', $event.target.checked)">
                    <span>NLEX</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.ddxEnabled }">
                    <input type="checkbox" :checked="act.ddxEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'ddxEnabled', $event.target.checked)">
                    <span>DDx</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.osceEnabled }">
                    <input type="checkbox" :checked="act.osceEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'osceEnabled', $event.target.checked)">
                    <span>OSCE</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.meqexEnabled }">
                    <input type="checkbox" :checked="act.meqexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'meqexEnabled', $event.target.checked)">
                    <span>MEQEX</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.atlasEnabled }">
                    <input type="checkbox" :checked="act.atlasEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'atlasEnabled', $event.target.checked)">
                    <span>ATLAS</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.longexEnabled }">
                    <input type="checkbox" :checked="act.longexEnabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'longexEnabled', $event.target.checked)">
                    <span>LONGEX</span>
                  </label>
                  <label class="feat-toggle" :class="{ on: act.skill15Enabled }">
                    <input type="checkbox" :checked="act.skill15Enabled" :disabled="getStatus(act) === 'revoked'" @change="toggleFeature(act._id, 'skill15Enabled', $event.target.checked)">
                    <span>15-SKILL</span>
                  </label>
                </div>
              </td>
              <td>
                <span v-if="act.consentAcceptedAt" class="consent-ok" :title="'ยอมรับเมื่อ ' + formatDateTime(act.consentAcceptedAt)">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>
                  ยอมรับแล้ว
                </span>
                <span v-else class="consent-pending">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd"/></svg>
                  รอยอมรับ
                </span>
              </td>
              <td style="white-space:nowrap;">
                <template v-if="extendingId === act._id">
                  <div style="display:flex;align-items:center;gap:4px;">
                    <input v-model.number="extendDays" type="number" class="form-control" min="1" max="365" placeholder="วัน" style="width:70px;min-height:32px;padding:4px 8px;font-size:13px;" />
                    <button class="btn btn-sm btn-primary" @click="handleExtend(act._id)" :disabled="!extendDays">บันทึก</button>
                    <button class="btn btn-sm btn-outline" @click="extendingId = null">ยกเลิก</button>
                  </div>
                </template>
                <template v-else-if="banningId === act._id">
                  <input v-model="banReason" type="text" class="form-control" placeholder="เหตุผล เช่น ค้างชำระ" style="width:140px;min-height:32px;padding:4px 8px;font-size:13px;display:inline-block;margin-right:4px;" />
                  <button class="btn btn-sm btn-danger" @click="handleBan(act._id)">แบน</button>
                  <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="banningId = null">ไม่</button>
                </template>
                <template v-else-if="hardDeletingId === act._id">
                  <span style="font-size:12px;color:#dc2626;font-weight:600;margin-right:6px;">ลบถาวร? กู้คืนไม่ได้</span>
                  <button class="btn btn-sm btn-danger" @click="handleHardDelete(act._id)">ลบเลย</button>
                  <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="hardDeletingId = null">ไม่</button>
                </template>
                <template v-else>
                  <button class="btn btn-sm btn-outline" @click="startExtend(act._id)">ต่ออายุ</button>
                  <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="openMove(act)">ย้ายคอร์ส</button>
                  <button class="btn btn-sm btn-outline" style="margin-left:4px;" @click="handleOrientReset(act._id)" title="ล้าง progress ปฐมนิเทศ — user จะต้องดูใหม่">🔄 Orient</button>
                  <button v-if="getStatus(act) === 'revoked'" class="btn btn-sm btn-warn" style="margin-left:4px;" @click="handleUnban(act._id)">ปลดแบน</button>
                  <button v-else class="btn btn-sm btn-danger" style="margin-left:4px;" @click="startBan(act._id)">แบน</button>
                  <button class="btn btn-sm btn-danger" style="margin-left:4px;" @click="hardDeletingId = act._id">ลบ</button>
                </template>
              </td>
            </tr>
            <tr v-if="studentActivations.length === 0">
              <td colspan="7" style="text-align:center;color:var(--gray);padding:40px;">
                ยังไม่มีนักเรียนในคลาสนี้ — กด "+ เพิ่มนักเรียน"
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div v-else-if="!loading" style="text-align:center;padding:60px 20px;color:var(--gray);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style="opacity:0.3;margin-bottom:12px;"><path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a.75.75 0 01.573-.073 49.56 49.56 0 014.455 1.47V8.5a.75.75 0 011.5 0v4.063l.468.236A49.884 49.884 0 0122.83 8.72a.75.75 0 01-.231 1.337c-2.38.853-4.65 1.91-6.79 3.149A1.5 1.5 0 0114 14.5v.75a1.5 1.5 0 01-.465 1.088l-1.5 1.44a.75.75 0 01-1.07-1.056l1.5-1.44a.001.001 0 000-.001V14.5l-.006-.003A50.18 50.18 0 002.394 10.29a.75.75 0 01-.23-1.337A60.653 60.653 0 0111.7 2.805z"/></svg>
        <p style="font-size:16px;font-weight:600;">เลือกคลาสด้านบนเพื่อดูนักเรียน</p>
      </div>
    </div>

    <!-- Tier Edit Modal -->
    <div v-if="tierModal.open" class="move-overlay" @click.self="closeTier">
      <div class="move-modal" style="max-width:420px;">
        <div class="move-header">
          <h3>เปลี่ยนระดับ (Tier)</h3>
          <button class="move-close" @click="closeTier">×</button>
        </div>
        <div class="move-body">
          <div class="move-info">
            <div class="move-info-row"><span>นักเรียน:</span><b>{{ tierModal.studentName }}</b></div>
            <div class="move-info-row"><span>คอร์ส:</span><b>{{ tierModal.packageTitle }}</b></div>
            <div class="move-info-row"><span>ระดับเดิม:</span><b>ระดับ {{ tierModal.currentTier }}</b></div>
          </div>

          <label class="move-label">เปลี่ยนเป็น</label>
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;">
            <button v-for="t in [1,2,3,4,5,6]" :key="t" type="button"
                    class="tier-pick" :class="{ active: tierModal.newTier === t }"
                    @click="tierModal.newTier = t">
              ระดับ {{ t }}
            </button>
          </div>

          <label class="move-label">รหัสยืนยัน</label>
          <input v-model="tierModal.confirm" type="password" class="form-control" placeholder="ใส่รหัสยืนยันเพื่อเปลี่ยนระดับ" autocomplete="off" @keyup.enter="saveTier" />
          <div v-if="tierModal.error" style="margin-top:8px;font-size:12px;color:#ea580c;">{{ tierModal.error }}</div>

          <div style="display:flex;gap:8px;margin-top:18px;">
            <button class="btn btn-outline" style="flex:1;" @click="closeTier" :disabled="tierModal.saving">ยกเลิก</button>
            <button class="btn btn-primary" style="flex:1;" @click="saveTier"
                    :disabled="tierModal.saving || !tierModal.confirm || tierModal.newTier === tierModal.currentTier">
              {{ tierModal.saving ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Move Course Modal -->
    <div v-if="moveModal.open" class="move-overlay" @click.self="closeMove">
      <div class="move-modal">
        <div class="move-header">
          <h3>ย้ายคอร์ส</h3>
          <button class="move-close" @click="closeMove">×</button>
        </div>
        <div class="move-body">
          <div class="move-info">
            <div class="move-info-row"><span>นักเรียน:</span><b>{{ moveModal.studentName }}</b></div>
            <div class="move-info-row"><span>จากคอร์ส:</span><b>{{ moveModal.fromTitle }}</b></div>
            <div class="move-info-row"><span>วันหมดอายุ:</span><b>{{ formatDate(moveModal.expiresAt) }}</b></div>
          </div>

          <label class="move-label">ย้ายไปคอร์ส</label>
          <select v-model="moveModal.toPackageId" class="form-control">
            <option value="">-- เลือกคอร์สปลายทาง --</option>
            <option v-for="p in movablePackages" :key="p._id" :value="p._id">
              {{ p.title }}
            </option>
          </select>
          <div v-if="movablePackages.length === 0" style="font-size:12px;color:#94a3b8;margin-top:6px;">
            ไม่มีคอร์สอื่นให้ย้าย (นักเรียนมีทุกคอร์สแล้ว)
          </div>

          <label class="move-check">
            <input type="checkbox" v-model="moveModal.resetExpiry" />
            <span>รีเซ็ตวันหมดอายุใหม่ตาม duration ของคอร์สปลายทาง (default: คงวันเดิม)</span>
          </label>

          <div v-if="moveModal.error" class="alert-msg alert-danger" style="margin-top:12px;">{{ moveModal.error }}</div>
        </div>
        <div class="move-footer">
          <button class="btn btn-outline" @click="closeMove">ยกเลิก</button>
          <button class="btn btn-primary" :disabled="!moveModal.toPackageId || moveModal.saving" @click="handleMove">
            {{ moveModal.saving ? 'กำลังย้าย...' : 'ย้ายเลย' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageActivations',
  data() {
    return {
      activations: [],
      allPackages: [],
      allUsers: [],
      userSearch: '',
      selectedPkg: null,
      showAddForm: false,
      loading: false,
      saving: false,
      error: null,
      successMsg: '',
      extendingId: null,
      extendDays: 30,
      banningId: null,
      banReason: '',
      hardDeletingId: null,
      moveModal: {
        open: false,
        actId: null,
        studentName: '',
        fromPackageId: '',
        fromTitle: '',
        expiresAt: null,
        userPkgIds: [],
        toPackageId: '',
        resetExpiry: false,
        saving: false,
        error: ''
      },
      form: { userId: '', durationDays: null, note: '', tier: 6 },
      tierModal: {
        open: false,
        actId: null,
        studentName: '',
        packageTitle: '',
        currentTier: 6,
        newTier: 6,
        confirm: '',
        saving: false,
        error: ''
      }
    }
  },
  computed: {
    filteredStudents() {
      const users = this.allUsers
      if (!this.userSearch.trim()) return users
      const q = this.userSearch.trim().toLowerCase()
      return users.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q) ||
        (u.nationalId || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )
    },
    selectedActivations() {
      if (!this.selectedPkg) return []
      return this.activations.filter(a => {
        const pkgId = a.packageId && typeof a.packageId === 'object' ? a.packageId._id : a.packageId
        return pkgId === this.selectedPkg._id
      })
    },
    adminActivations() {
      return this.selectedActivations.filter(a => this.getUserField(a, 'role') === 'admin')
    },
    studentActivations() {
      return this.selectedActivations.filter(a => this.getUserField(a, 'role') !== 'admin')
    },
    movablePackages() {
      // เฉพาะที่ published — เรียงตาม order, title
      // ซ่อน: คอร์สปัจจุบัน + คอร์สที่ user มีอยู่แล้ว (ทุก status)
      const m = this.moveModal
      const blocked = new Set([m.fromPackageId, ...(m.userPkgIds || [])])
      return [...this.allPackages]
        .filter(p => p.isPublished && !blocked.has(p._id))
        .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title))
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
        const [actData, pkgData, userData] = await Promise.all([
          api.get('/admin/activations'),
          api.get('/admin/packages'),
          api.get('/users')
        ])
        this.activations = actData.activations || actData
        this.allPackages = pkgData.packages || pkgData
        this.allUsers = userData.users || userData
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'
      } finally {
        this.loading = false
      }
    },
    selectPackage(pkg) {
      this.selectedPkg = this.selectedPkg?._id === pkg._id ? null : pkg
      this.showAddForm = false
    },
    pkgActivations(pkgId, status) {
      return this.activations.filter(a => {
        const id = a.packageId && typeof a.packageId === 'object' ? a.packageId._id : a.packageId
        return id === pkgId && this.getStatus(a) === status
      }).length
    },
    getFullName(act) {
      const u = act.userId && typeof act.userId === 'object' ? act.userId : null
      if (!u) return '-'
      if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim()
      return u.name || '-'
    },
    getUserField(act, field) {
      const u = act.userId && typeof act.userId === 'object' ? act.userId : null
      return u ? (u[field] || '') : ''
    },
    getStatus(act) {
      if (act.status) return act.status
      if (!act.isActive) return 'revoked'
      if (act.expiresAt && new Date(act.expiresAt) < new Date()) return 'expired'
      return 'active'
    },
    statusLabel(act) {
      return { active: 'กำลังเรียน', expired: 'หมดอายุ', revoked: 'ถูกแบน' }[this.getStatus(act)] || '-'
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    formatDateTime(d) {
      if (!d) return '-'
      return new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    startExtend(id) { this.extendingId = id; this.extendDays = 30 },
    async handleCreate() {
      this.saving = true
      this.error = null
      try {
        const payload = {
          userId: this.form.userId,
          packageId: this.selectedPkg._id,
          note: this.form.note?.trim() || '',
          tier: this.form.tier || 6
        }
        if (this.form.durationDays > 0) payload.durationDays = this.form.durationDays
        await api.post('/admin/activations', payload)
        this.showAddForm = false
        this.form = { userId: '', durationDays: null, note: '', tier: 6 }
        this.userSearch = ''
        await this.fetchAll()
        this.successMsg = 'ลง Visa เรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกล้มเหลว'
      } finally { this.saving = false }
    },
    async handleExtend(id) {
      this.error = null
      try {
        await api.put(`/admin/activations/${id}`, { extendDays: this.extendDays })
        this.extendingId = null
        await this.fetchAll()
        this.successMsg = `ต่ออายุ ${this.extendDays} วันเรียบร้อย`
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) { this.error = err.response?.data?.message || 'ต่ออายุล้มเหลว' }
    },
    startBan(id) { this.banningId = id; this.banReason = '' },
    async handleBan(id) {
      this.error = null
      try {
        const reason = (this.banReason || '').trim()
        await api.delete(`/admin/activations/${id}`, { data: { reason } })
        this.banningId = null
        this.banReason = ''
        await this.fetchAll()
        this.successMsg = `แบนเรียบร้อย${reason ? ' (เหตุผล: ' + reason + ')' : ''}`
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.banningId = null
        this.error = err.response?.data?.message || 'แบนล้มเหลว'
      }
    },
    async handleUnban(id) {
      this.error = null
      try {
        await api.post(`/admin/activations/${id}/unban`)
        await this.fetchAll()
        this.successMsg = 'ปลดแบนเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'ปลดแบนล้มเหลว'
      }
    },
    openMove(act) {
      const userId = act.userId && typeof act.userId === 'object' ? act.userId._id : act.userId
      const fromPkgId = act.packageId && typeof act.packageId === 'object' ? act.packageId._id : act.packageId
      const fromTitle = act.packageId && typeof act.packageId === 'object' ? act.packageId.title : (this.allPackages.find(p => p._id === fromPkgId)?.title || '-')
      // เก็บ package ids ทั้งหมดที่ user คนนี้มีอยู่แล้ว (ทุก status) → ห้ามย้ายไปทับ
      const userPkgIds = this.activations
        .filter(a => {
          const uid = a.userId && typeof a.userId === 'object' ? a.userId._id : a.userId
          return uid === userId && a._id !== act._id
        })
        .map(a => a.packageId && typeof a.packageId === 'object' ? a.packageId._id : a.packageId)
      this.moveModal = {
        open: true,
        actId: act._id,
        studentName: this.getFullName(act),
        fromPackageId: fromPkgId,
        fromTitle,
        expiresAt: act.expiresAt,
        userPkgIds,
        toPackageId: '',
        resetExpiry: false,
        saving: false,
        error: ''
      }
    },
    closeMove() {
      this.moveModal.open = false
    },
    openTierEdit(act) {
      const pkgTitle = (act.packageId && typeof act.packageId === 'object')
        ? (act.packageId.title || '-')
        : (this.selectedPkg?.title || '-')
      this.tierModal = {
        open: true,
        actId: act._id,
        studentName: this.getFullName(act),
        packageTitle: pkgTitle,
        currentTier: act.tier || 6,
        newTier: act.tier || 6,
        confirm: '',
        saving: false,
        error: ''
      }
    },
    closeTier() {
      this.tierModal.open = false
    },
    async saveTier() {
      if (!this.tierModal.confirm) {
        this.tierModal.error = 'กรุณาใส่รหัสยืนยัน'
        return
      }
      if (this.tierModal.newTier === this.tierModal.currentTier) return
      this.tierModal.saving = true
      this.tierModal.error = ''
      try {
        await api.put(`/admin/activations/${this.tierModal.actId}`, {
          tier: this.tierModal.newTier,
          tierConfirm: this.tierModal.confirm
        })
        for (const a of this.activations) {
          if (a._id === this.tierModal.actId) { a.tier = this.tierModal.newTier; break }
        }
        this.tierModal.open = false
        this.successMsg = `เปลี่ยนเป็นระดับ ${this.tierModal.newTier} แล้ว`
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.tierModal.error = err.response?.data?.message || 'บันทึกไม่สำเร็จ'
      } finally {
        this.tierModal.saving = false
      }
    },
    async handleMove() {
      this.moveModal.error = ''
      if (!this.moveModal.toPackageId) return
      if (this.moveModal.userPkgIds.includes(this.moveModal.toPackageId)) {
        this.moveModal.error = 'นักเรียนมีสิทธิ์คอร์สนี้อยู่แล้ว — ย้ายไม่ได้'
        return
      }
      this.moveModal.saving = true
      try {
        await api.patch(`/admin/activations/${this.moveModal.actId}/move`, {
          newPackageId: this.moveModal.toPackageId,
          resetExpiry: this.moveModal.resetExpiry
        })
        this.moveModal.open = false
        await this.fetchAll()
        this.successMsg = 'ย้ายคอร์สเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.moveModal.error = err.response?.data?.message || 'ย้ายล้มเหลว'
      } finally {
        this.moveModal.saving = false
      }
    },
    async handleHardDelete(id) {
      this.error = null
      try {
        await api.delete(`/admin/activations/${id}/permanent`)
        this.hardDeletingId = null
        await this.fetchAll()
        this.successMsg = 'ลบ activation ถาวรเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.hardDeletingId = null
        this.error = err.response?.data?.message || 'ลบไม่สำเร็จ'
      }
    },
    async toggleFeature(id, field, value) {
      // กัน toggle ตอน activation ถูกแบน
      const act = this.activations.find(a => a._id === id)
      if (act && !act.isActive) {
        this.error = 'Activation ถูกแบนอยู่ — ปลดแบนก่อนเพื่อแก้ feature'
        await this.fetchAll()
        return
      }
      try {
        await api.patch(`/admin/activations/${id}/feature`, { [field]: value })
        // update local
        for (const a of this.activations) {
          if (a._id === id) { a[field] = value; break }
        }
      } catch (err) { this.error = err.response?.data?.message || 'บันทึกไม่สำเร็จ'; await this.fetchAll() }
    },
    async handleOrientReset(id) {
      if (!confirm('รีเซ็ต orient? นักเรียนจะต้องดูวิดีโอปฐมนิเทศใหม่ครั้งถัดไปที่กดยอมรับ')) return
      this.error = null
      try {
        await api.post(`/admin/activations/${id}/orient-reset`)
        this.successMsg = 'รีเซ็ต orient เรียบร้อย — นักเรียนจะต้องดูใหม่'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'รีเซ็ตไม่สำเร็จ'
      }
    },
    async handleOrientBypass(id) {
      if (!confirm('Bypass orient? นักเรียนจะเข้าคอร์สได้ทันทีไม่ต้องดูวิดีโอปฐมนิเทศ')) return
      this.error = null
      try {
        await api.post(`/admin/activations/${id}/orient-bypass`)
        this.successMsg = 'Bypass orient เรียบร้อย — นักเรียนเข้าคอร์สได้ทันที'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Bypass ไม่สำเร็จ'
      }
    }
  }
}
</script>

<style scoped>
.alert-msg { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.alert-danger { background: #fee; border: 1px solid #fcc; color: #c00; }
.alert-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

/* Class Cards Grid */
.class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
.class-card {
  background: #fff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; cursor: pointer;
  transition: all .15s;
}
.class-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.class-selected { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 2px 12px rgba(59,130,246,0.15); }
.cc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.cc-title { font-size: 15px; font-weight: 800; color: var(--primary); }
.cc-badge { font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; }
.cc-demo { background: #dbeafe; color: #2563eb; }
.cc-stats { display: flex; gap: 12px; margin-bottom: 8px; }
.cc-stat { text-align: center; }
.cc-num { display: block; font-size: 20px; font-weight: 900; color: #10b981; }
.cc-expired { color: #f59e0b; }
.cc-revoked { color: #ef4444; }
.cc-label { font-size: 10px; color: #94a3b8; font-weight: 600; }
.cc-footer { font-size: 11px; color: #94a3b8; }

/* Selected Section */
.selected-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.ss-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.ss-header h2 { font-size: 18px; font-weight: 800; color: var(--primary); margin: 0; }

/* Add Form */
.add-form { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; }

/* Role Badge */
.role-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.role-admin { background: #f5f3ff; color: #7c3aed; }
.role-student { background: #ecfdf5; color: #059669; }

/* Status badges */
.status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
.status-active { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
.status-expired { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
.status-revoked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Tier badge — คลิกได้ เปิด modal เปลี่ยน */
.tier-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 9999px;
  font-size: 12px; font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer; transition: all .15s;
}
.tier-badge:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(59,130,246,0.18); }
.tier-1 { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
.tier-2 { background: #e0f2fe; color: #075985; border-color: #bae6fd; }
.tier-3 { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
.tier-4 { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.tier-5 { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }
.tier-6 { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; border-color: #f59e0b; font-weight: 800; }

/* Tier picker ใน modal */
.tier-pick {
  padding: 10px 2px; border-radius: 10px;
  background: #f1f5f9; border: 2px solid transparent;
  font-size: 12px; font-weight: 700; color: #475569;
  cursor: pointer; transition: all .15s;
}
.tier-pick:hover { background: #e0f2fe; }
.tier-pick.active { background: #3b82f6; color: #fff; border-color: #2563eb; box-shadow: 0 4px 10px rgba(59,130,246,0.3); }
.ban-reason {
  display: inline-flex; align-items: center; gap: 4px;
  margin-top: 4px; padding: 3px 8px; border-radius: 6px;
  background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
  font-size: 11px; font-weight: 600; max-width: 200px;
  cursor: help;
}
.ban-reason svg { flex-shrink: 0; }

/* Role Sections */
.role-section { margin-top: 16px; }
.role-section-header {
  padding: 8px 14px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 800;
}
.role-section-admin { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; border-bottom: none; }
.role-section-student { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-bottom: none; }
.role-section .table { border-top: none; border-radius: 0 0 8px 8px; }

.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-warn {
  background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none;
  box-shadow: 0 1px 2px rgba(217,119,6,0.25);
}
.btn-warn:hover { box-shadow: 0 2px 6px rgba(217,119,6,0.4); transform: translateY(-1px); }

/* Feature row */
.feat-row { display: flex; gap: 6px; flex-wrap: wrap; transition: opacity .15s; }
.feat-row.feat-banned { opacity: 0.4; pointer-events: none; position: relative; }
.feat-row.feat-banned::after {
  content: "ถูกแบนอยู่"; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); background: #fef2f2; color: #991b1b;
  font-size: 11px; font-weight: 800; padding: 2px 10px; border-radius: 6px;
  border: 1px solid #fecaca; pointer-events: auto;
}

/* Consent status */
/* Feature toggles */
.feat-toggle {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
  background: #f1f5f9; color: #94a3b8; cursor: pointer; transition: all .15s;
  border: 1px solid #e2e8f0;
}
.feat-toggle input { display: none; }
.feat-toggle.on { background: #dcfce7; color: #16a34a; border-color: #86efac; }
.feat-toggle:hover { border-color: #3b82f6; }

.consent-ok {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: #059669;
  cursor: help;
}
.consent-pending {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: #b45309;
}
.badge-unfollow {
  display: inline-block; font-size: 9px; font-weight: 700;
  padding: 1px 5px; border-radius: 4px;
  background: #fee2e2; color: #dc2626;
  text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.4;
}

/* Move Modal */
.move-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
  animation: fadeIn .15s ease-out;
}
.move-modal {
  background: #fff; border-radius: 14px; width: 100%; max-width: 480px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  overflow: hidden; display: flex; flex-direction: column;
  animation: slideUp .2s ease-out;
}
.move-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff;
}
.move-header h3 { margin: 0; font-size: 17px; font-weight: 800; }
.move-close {
  background: rgba(255,255,255,0.2); border: none; color: #fff;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
  font-size: 20px; line-height: 1; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.move-close:hover { background: rgba(255,255,255,0.35); }
.move-body { padding: 20px; }
.move-info {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; margin-bottom: 16px;
}
.move-info-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; padding: 4px 0;
}
.move-info-row span { color: #64748b; }
.move-info-row b { color: #1e293b; font-weight: 700; }
.move-label {
  display: block; font-size: 12px; font-weight: 700; color: #64748b;
  margin-bottom: 6px; margin-top: 8px;
}
.move-check {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 14px; font-size: 12px; color: #475569; cursor: pointer;
}
.move-check input { margin-top: 2px; }
.move-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .class-grid { grid-template-columns: 1fr 1fr; }
}

/* ─── CMA (ศรว.) mini badge ─── */
.cma-mini {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.4;
}
.cma-mini-ok {
  background: #dbeafe;
  color: #1e40af;
}
.cma-mini-done {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}
.cma-mini-warn {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}
.cma-mini-unknown {
  background: #f1f5f9;
  color: #64748b;
  border: 1px dashed #cbd5e1;
}
</style>
