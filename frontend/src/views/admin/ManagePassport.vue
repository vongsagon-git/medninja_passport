<template>
  <div class="admin-passport">
    <div class="page-header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1>Ninja Passport</h1>
          <p>ระบบลงทะเบียนกลาง — {{ registrations.length }} รายการ</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button
            class="btn-sync-cma"
            :disabled="cmaSyncing"
            @click="syncCma"
            :title="`Sync สถานะ ศรว. — เช็คเฉพาะคนที่ยังไม่เคยสมัคร (${registrations.filter(r => !r.cmaRegistered).length} คน)`"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            <span v-if="cmaSyncing">กำลัง Sync...</span>
            <span v-else>Sync สมัคร ศรว.</span>
          </button>
          <select v-model="statusFilter" class="form-control" style="width: 160px;">
            <option value="">ทุกสถานะ</option>
            <option value="pending">ยังไม่ตรวจ</option>
            <option value="reviewed">ตรวจแล้ว</option>
          </select>
          <input
            v-model="search"
            type="text"
            placeholder="ค้นหาชื่อ / เลขบัตร..."
            class="form-control"
            style="width: 220px;"
          />
        </div>
      </div>
    </div>

    <div class="container section">
      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-number stat-blue">{{ registrations.length }}</div>
            <div class="stat-label">ลงทะเบียนทั้งหมด</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-number stat-gold">{{ pendingCount }}</div>
            <div class="stat-label">ยังไม่ตรวจ</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-number stat-green">{{ reviewedCount }}</div>
            <div class="stat-label">ตรวจแล้ว</div>
          </div>
        </div>
        <div class="stat-card" v-if="unfollowCount > 0">
          <div class="stat-icon stat-icon-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-number stat-red">{{ unfollowCount }}</div>
            <div class="stat-label">LINE Unfollow</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-cma">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-number stat-cma">{{ cmaRegisteredCount }}</div>
            <div class="stat-label">เคยสมัคร ศรว.</div>
          </div>
        </div>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="card" style="text-align: center; padding: 40px; color: var(--gray);">
        กำลังโหลด...
      </div>
      <div v-else-if="error" class="card" style="text-align:center; padding:40px 20px; color:var(--danger);">
        <p>{{ error }}</p>
        <button class="btn btn-outline" style="margin-top:12px;" @click="fetchRegistrations">ลองใหม่</button>
      </div>
      <template v-else>
        <!-- Admin Section -->
        <div v-if="groupAdmin.length" class="group-section">
          <div class="group-header group-header-purple">
            <span class="group-icon">🛡️</span>
            <span class="group-title">Admin</span>
            <span class="group-count">{{ groupAdmin.length }} คน</span>
          </div>
          <div class="card" style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>เลขบัตร</th>
                  <th>เพศ</th>
                  <th>มหาวิทยาลัย</th>
                  <th>LINE</th>
                  <th>สถานะ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reg, idx) in groupAdmin" :key="reg._id" class="row-clickable" @click="viewDetail(reg._id)">
                  <td style="color: var(--gray); font-size: 13px;">{{ idx + 1 }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-weight: 600;">{{ reg.firstName }} {{ reg.lastName }}</span>
                      <span v-if="computeAge(reg.dateOfBirth) != null" class="age-badge" :class="ageColor(computeAge(reg.dateOfBirth))" :title="`เกิด ${reg.dateOfBirth || ''}`">
                        {{ computeAge(reg.dateOfBirth) }} ปี
                      </span>
                      <span v-if="reg.cmaRegistered" class="cma-badge" :class="{ 'cma-badge-done': reg.cmaPassedAll }" :title="reg.cmaPassedAll ? 'สอบผ่านครบทุกขั้นตอนแล้ว' : 'มีข้อมูลใน ศรว.'">
                        {{ reg.cmaPassedAll ? '🎓 ผ่านครบ' : '✓ ศรว.' }}
                      </span>
                    </div>
                    <div v-if="reg.firstNameEn" style="font-size: 12px; color: var(--gray);">{{ reg.firstNameEn }} {{ reg.lastNameEn }}</div>
                  </td>
                  <td style="font-family: monospace; font-size: 13px;">{{ formatNid(reg.nationalId) }}</td>
                  <td @click.stop>
                    <span v-if="reg.sex === 'M'" class="sex-badge sex-male">♂ ชาย</span>
                    <span v-else-if="reg.sex === 'F'" class="sex-badge sex-female">♀ หญิง</span>
                    <span v-else class="sex-quick-pick">
                      <button class="sex-btn sex-btn-m" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'M')" title="ชาย">♂</button>
                      <button class="sex-btn sex-btn-f" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'F')" title="หญิง">♀</button>
                    </span>
                  </td>
                  <td style="font-size: 13px; color: var(--gray);">{{ reg.university || '-' }}</td>
                  <td @click.stop>
                    <div v-if="reg.lineUserId" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      <img v-if="reg.linePictureUrl" :src="reg.linePictureUrl" style="width:20px;height:20px;border-radius:50%;" />
                      <span style="font-size:11px;color:#06c755;font-weight:600;">{{ reg.lineDisplayName || 'เชื่อมแล้ว' }}</span>
                      <span v-if="reg.lineFollowing === false" class="badge-unfollow" :title="reg.lineUnfollowedAt ? 'Unfollow: ' + formatDate(reg.lineUnfollowedAt) : ''">unfollow</span>
                      <button class="btn-unlink" title="ยกเลิกเชื่อม" @click="openUnlinkModal(reg)">&times;</button>
                    </div>
                    <div v-else-if="reg.role" class="line-picker-wrap">
                      <button class="line-pick-btn" :disabled="linkingLineBusy && linkingLineRegId === reg._id" @click="toggleLinePicker(reg._id, $event)">
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M12 2C6.48 2 2 5.81 2 10.4c0 2.68 1.54 5.06 3.94 6.62L5 22l3.54-2.12c1.1.34 2.26.52 3.46.52 5.52 0 10-3.81 10-8.4S17.52 2 12 2z" fill="#06c755"/></svg>
                        เชื่อม LINE
                      </button>
                    </div>
                    <span v-else style="font-size:11px;color:#cbd5e1;">-</span>
                  </td>
                  <td><span class="badge badge-admin">Admin</span></td>
                  <td @click.stop>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-action btn-edit" title="แก้ไข" @click="viewDetail(reg._id, true)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        <span>แก้ไข</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Staff Section -->
        <div v-if="groupStaff.length" class="group-section">
          <div class="group-header" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff">
            <span class="group-icon">👨‍💻</span>
            <span class="group-title">Staff</span>
            <span class="group-count">{{ groupStaff.length }} คน</span>
          </div>
          <div class="card" style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>เลขบัตร</th>
                  <th>เพศ</th>
                  <th>มหาวิทยาลัย</th>
                  <th>LINE</th>
                  <th>สถานะ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reg, idx) in groupStaff" :key="reg._id" class="row-clickable" @click="viewDetail(reg._id)">
                  <td style="color: var(--gray); font-size: 13px;">{{ idx + 1 }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-weight: 600;">{{ reg.firstName }} {{ reg.lastName }}</span>
                      <span v-if="computeAge(reg.dateOfBirth) != null" class="age-badge" :class="ageColor(computeAge(reg.dateOfBirth))" :title="`เกิด ${reg.dateOfBirth || ''}`">
                        {{ computeAge(reg.dateOfBirth) }} ปี
                      </span>
                      <span v-if="reg.cmaRegistered" class="cma-badge" :class="{ 'cma-badge-done': reg.cmaPassedAll }" :title="reg.cmaPassedAll ? 'สอบผ่านครบทุกขั้นตอนแล้ว' : 'มีข้อมูลใน ศรว.'">
                        {{ reg.cmaPassedAll ? '🎓 ผ่านครบ' : '✓ ศรว.' }}
                      </span>
                    </div>
                    <div v-if="reg.firstNameEn" style="font-size: 12px; color: var(--gray);">{{ reg.firstNameEn }} {{ reg.lastNameEn }}</div>
                  </td>
                  <td style="font-family: monospace; font-size: 13px;">{{ formatNid(reg.nationalId) }}</td>
                  <td @click.stop>
                    <span v-if="reg.sex === 'M'" class="sex-badge sex-male">♂ ชาย</span>
                    <span v-else-if="reg.sex === 'F'" class="sex-badge sex-female">♀ หญิง</span>
                    <span v-else class="sex-quick-pick">
                      <button class="sex-btn sex-btn-m" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'M')" title="ชาย">♂</button>
                      <button class="sex-btn sex-btn-f" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'F')" title="หญิง">♀</button>
                    </span>
                  </td>
                  <td style="font-size: 13px; color: var(--gray);">{{ reg.university || '-' }}</td>
                  <td @click.stop>
                    <div v-if="reg.lineUserId" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      <img v-if="reg.linePictureUrl" :src="reg.linePictureUrl" style="width:20px;height:20px;border-radius:50%;" />
                      <span style="font-size:11px;color:#06c755;font-weight:600;">{{ reg.lineDisplayName || 'เชื่อมแล้ว' }}</span>
                      <span v-if="reg.lineFollowing === false" class="badge-unfollow" :title="reg.lineUnfollowedAt ? 'Unfollow: ' + formatDate(reg.lineUnfollowedAt) : ''">unfollow</span>
                      <button class="btn-unlink" title="ยกเลิกเชื่อม" @click="openUnlinkModal(reg)">&times;</button>
                    </div>
                    <div v-else-if="reg.role" class="line-picker-wrap">
                      <button class="line-pick-btn" :disabled="linkingLineBusy && linkingLineRegId === reg._id" @click="toggleLinePicker(reg._id, $event)">
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M12 2C6.48 2 2 5.81 2 10.4c0 2.68 1.54 5.06 3.94 6.62L5 22l3.54-2.12c1.1.34 2.26.52 3.46.52 5.52 0 10-3.81 10-8.4S17.52 2 12 2z" fill="#06c755"/></svg>
                        เชื่อม LINE
                      </button>
                    </div>
                    <span v-else style="font-size:11px;color:#cbd5e1;">-</span>
                  </td>
                  <td><span class="badge" style="background:#7c3aed;color:#fff">Staff</span></td>
                  <td @click.stop>
                    <button class="btn-action btn-edit" title="แก้ไข" @click="viewDetail(reg._id, true)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                      <span>แก้ไข</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ลงคอร์สแล้ว Section -->
        <div v-if="groupEnrolled.length" class="group-section">
          <div class="group-header group-header-green">
            <span class="group-icon">📚</span>
            <span class="group-title">ลงคอร์สแล้ว</span>
            <span class="group-count">{{ groupEnrolled.length }} คน</span>
          </div>
          <div class="card" style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>เลขบัตร</th>
                  <th>มหาวิทยาลัย</th>
                  <th>คอร์สที่ลง</th>
                  <th>LINE</th>
                  <th>สถานะ</th>
                  <th>วันที่สมัคร</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reg, idx) in groupEnrolled" :key="reg._id" class="row-clickable" :class="cmaRowClass(reg)" @click="viewDetail(reg._id)">
                  <td style="color: var(--gray); font-size: 13px;">{{ idx + 1 }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-weight: 600;">{{ reg.firstName }} {{ reg.lastName }}</span>
                      <span v-if="computeAge(reg.dateOfBirth) != null" class="age-badge" :class="ageColor(computeAge(reg.dateOfBirth))" :title="`เกิด ${reg.dateOfBirth || ''}`">
                        {{ computeAge(reg.dateOfBirth) }} ปี
                      </span>
                      <span v-if="reg.cmaRegistered" class="cma-badge" :class="{ 'cma-badge-done': reg.cmaPassedAll }" :title="reg.cmaPassedAll ? 'สอบผ่านครบทุกขั้นตอนแล้ว' : 'มีข้อมูลใน ศรว.'">
                        {{ reg.cmaPassedAll ? '🎓 ผ่านครบ' : '✓ ศรว.' }}
                      </span>
                    </div>
                    <div v-if="reg.firstNameEn" style="font-size: 12px; color: var(--gray);">{{ reg.firstNameEn }} {{ reg.lastNameEn }}</div>
                  </td>
                  <td style="font-family: monospace; font-size: 13px;">{{ formatNid(reg.nationalId) }}</td>
                  <td @click.stop>
                    <span v-if="reg.sex === 'M'" class="sex-badge sex-male">♂ ชาย</span>
                    <span v-else-if="reg.sex === 'F'" class="sex-badge sex-female">♀ หญิง</span>
                    <span v-else class="sex-quick-pick">
                      <button class="sex-btn sex-btn-m" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'M')" title="ชาย">♂</button>
                      <button class="sex-btn sex-btn-f" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'F')" title="หญิง">♀</button>
                    </span>
                  </td>
                  <td style="font-size: 13px; color: var(--gray);">{{ reg.university || '-' }}</td>
                  <td>
                    <div v-for="act in reg.activations" :key="act.packageName" class="course-tag">
                      <span class="course-name">{{ act.packageName }}</span>
                      <span class="course-days" :class="act.daysLeft <= 7 ? 'days-warn' : 'days-ok'">{{ act.daysLeft }} วัน</span>
                    </div>
                  </td>
                  <td @click.stop>
                    <div v-if="reg.lineUserId" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      <img v-if="reg.linePictureUrl" :src="reg.linePictureUrl" style="width:20px;height:20px;border-radius:50%;" />
                      <span style="font-size:11px;color:#06c755;font-weight:600;">{{ reg.lineDisplayName || 'เชื่อมแล้ว' }}</span>
                      <span v-if="reg.lineFollowing === false" class="badge-unfollow" :title="reg.lineUnfollowedAt ? 'Unfollow: ' + formatDate(reg.lineUnfollowedAt) : ''">unfollow</span>
                      <button class="btn-unlink" title="ยกเลิกเชื่อม" @click="openUnlinkModal(reg)">&times;</button>
                    </div>
                    <div v-else-if="reg.role" class="line-picker-wrap">
                      <button class="line-pick-btn" :disabled="linkingLineBusy && linkingLineRegId === reg._id" @click="toggleLinePicker(reg._id, $event)">
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M12 2C6.48 2 2 5.81 2 10.4c0 2.68 1.54 5.06 3.94 6.62L5 22l3.54-2.12c1.1.34 2.26.52 3.46.52 5.52 0 10-3.81 10-8.4S17.52 2 12 2z" fill="#06c755"/></svg>
                        เชื่อม LINE
                      </button>
                    </div>
                    <span v-else style="font-size:11px;color:#cbd5e1;">-</span>
                  </td>
                  <td>
                    <span class="badge" :class="statusBadge(reg.status)">{{ statusText(reg.status) }}</span>
                  </td>
                  <td style="font-size: 13px; color: var(--gray);">{{ formatDate(reg.createdAt) }}</td>
                  <td @click.stop>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-action btn-edit" title="แก้ไข" @click="viewDetail(reg._id, true)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        <span>แก้ไข</span>
                      </button>
                      <button v-if="reg.status === 'pending'" class="btn-action btn-review" title="ตรวจแล้ว" @click="changeStatus(reg._id, 'reviewed')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                        <span>ตรวจแล้ว</span>
                      </button>
                      <button v-else class="btn-action btn-unreview" title="ย้อน" @click="changeStatus(reg._id, 'pending')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
                        <span>ย้อน</span>
                      </button>
                      <button class="btn-action btn-delete" title="ลบ" @click="openDeleteModal(reg)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ยังไม่ลงคอร์ส Section -->
        <div v-if="groupNoCourse.length" class="group-section">
          <div class="group-header group-header-gray">
            <span class="group-icon">👤</span>
            <span class="group-title">ยังไม่เคยลงคอร์ส</span>
            <span class="group-count">{{ groupNoCourse.length }} คน</span>
          </div>
          <div class="card" style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>เลขบัตร</th>
                  <th>ทดลองเรียน</th>
                  <th>เบอร์โทร</th>
                  <th>มหาวิทยาลัย</th>
                  <th>LINE</th>
                  <th>สถานะ</th>
                  <th>วันที่สมัคร</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reg, idx) in groupNoCourse" :key="reg._id" class="row-clickable" :class="cmaRowClass(reg)" @click="viewDetail(reg._id)">
                  <td style="color: var(--gray); font-size: 13px;">{{ idx + 1 }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="font-weight: 600;">{{ reg.firstName }} {{ reg.lastName }}</span>
                      <span v-if="computeAge(reg.dateOfBirth) != null" class="age-badge" :class="ageColor(computeAge(reg.dateOfBirth))" :title="`เกิด ${reg.dateOfBirth || ''}`">
                        {{ computeAge(reg.dateOfBirth) }} ปี
                      </span>
                      <span v-if="reg.cmaRegistered" class="cma-badge" :class="{ 'cma-badge-done': reg.cmaPassedAll }" :title="reg.cmaPassedAll ? 'สอบผ่านครบทุกขั้นตอนแล้ว' : 'มีข้อมูลใน ศรว.'">
                        {{ reg.cmaPassedAll ? '🎓 ผ่านครบ' : '✓ ศรว.' }}
                      </span>
                    </div>
                    <div v-if="reg.firstNameEn" style="font-size: 12px; color: var(--gray);">{{ reg.firstNameEn }} {{ reg.lastNameEn }}</div>
                  </td>
                  <td style="font-family: monospace; font-size: 13px;">{{ formatNid(reg.nationalId) }}</td>
                  <td @click.stop>
                    <span v-if="reg.sex === 'M'" class="sex-badge sex-male">♂ ชาย</span>
                    <span v-else-if="reg.sex === 'F'" class="sex-badge sex-female">♀ หญิง</span>
                    <span v-else class="sex-quick-pick">
                      <button class="sex-btn sex-btn-m" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'M')" title="ชาย">♂</button>
                      <button class="sex-btn sex-btn-f" :disabled="sexBusyId === reg._id" @click="setSex(reg._id, 'F')" title="หญิง">♀</button>
                    </span>
                  </td>
                  <td>
                    <template v-if="reg.demoActivations && reg.demoActivations.length">
                      <div v-for="demo in reg.demoActivations" :key="demo.packageName" class="demo-tag">
                        <span v-if="demo.expired" class="demo-expired">หมดอายุ</span>
                        <span v-else class="demo-active">เหลือ {{ demo.daysLeft }} วัน</span>
                      </div>
                    </template>
                    <span v-else style="font-size:12px;color:#cbd5e1;">ยังไม่เคยทดลอง</span>
                  </td>
                  <td>{{ reg.phone || '-' }}</td>
                  <td style="font-size: 13px; color: var(--gray);">{{ reg.university || '-' }}</td>
                  <td @click.stop>
                    <div v-if="reg.lineUserId" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      <img v-if="reg.linePictureUrl" :src="reg.linePictureUrl" style="width:20px;height:20px;border-radius:50%;" />
                      <span style="font-size:11px;color:#06c755;font-weight:600;">{{ reg.lineDisplayName || 'เชื่อมแล้ว' }}</span>
                      <span v-if="reg.lineFollowing === false" class="badge-unfollow" :title="reg.lineUnfollowedAt ? 'Unfollow: ' + formatDate(reg.lineUnfollowedAt) : ''">unfollow</span>
                      <button class="btn-unlink" title="ยกเลิกเชื่อม" @click="openUnlinkModal(reg)">&times;</button>
                    </div>
                    <div v-else-if="reg.role" class="line-picker-wrap">
                      <button class="line-pick-btn" :disabled="linkingLineBusy && linkingLineRegId === reg._id" @click="toggleLinePicker(reg._id, $event)">
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M12 2C6.48 2 2 5.81 2 10.4c0 2.68 1.54 5.06 3.94 6.62L5 22l3.54-2.12c1.1.34 2.26.52 3.46.52 5.52 0 10-3.81 10-8.4S17.52 2 12 2z" fill="#06c755"/></svg>
                        เชื่อม LINE
                      </button>
                    </div>
                    <span v-else style="font-size:11px;color:#cbd5e1;">-</span>
                  </td>
                  <td>
                    <span class="badge" :class="statusBadge(reg.status)">{{ statusText(reg.status) }}</span>
                  </td>
                  <td style="font-size: 13px; color: var(--gray);">{{ formatDate(reg.createdAt) }}</td>
                  <td @click.stop>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-action btn-edit" title="แก้ไข" @click="viewDetail(reg._id, true)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        <span>แก้ไข</span>
                      </button>
                      <button v-if="reg.status === 'pending'" class="btn-action btn-review" title="ตรวจแล้ว" @click="changeStatus(reg._id, 'reviewed')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                        <span>ตรวจแล้ว</span>
                      </button>
                      <button v-else class="btn-action btn-unreview" title="ย้อน" @click="changeStatus(reg._id, 'pending')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
                        <span>ย้อน</span>
                      </button>
                      <button class="btn-action btn-delete" title="ลบ" @click="openDeleteModal(reg)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="!groupAdmin.length && !groupStaff.length && !groupEnrolled.length && !groupNoCourse.length" class="card" style="text-align: center; color: var(--gray); padding: 32px;">
          {{ search || statusFilter ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีผู้ลงทะเบียน' }}
        </div>
      </template>
    </div>

    <!-- LINE Picker Dropdown (global fixed) -->
    <Teleport to="body">
      <div v-if="linePickerOpenId" class="line-picker-dropdown" :style="linePickerStyle" @click.stop>
        <input ref="linePickerInput" v-model="linePickerSearch" class="line-picker-search" placeholder="ค้นหาชื่อ LINE..." />
        <div class="line-picker-list">
          <div v-for="c in filteredLineCandidates" :key="c.lineUserId" class="line-picker-item" @click="linkLineById(c.lineUserId)">
            <img v-if="c.pictureUrl" :src="c.pictureUrl" class="line-picker-avatar" />
            <div v-else class="line-picker-avatar line-picker-avatar-empty">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#94a3b8"/></svg>
            </div>
            <span class="line-picker-name">{{ c.displayName }}</span>
          </div>
          <div v-if="!filteredLineCandidates.length" class="line-picker-empty">ไม่พบ</div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: ดูรายละเอียด + แก้ไข -->
    <div v-if="detailModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editing ? 'แก้ไขข้อมูล' : (detailModal.firstName + ' ' + detailModal.lastName) }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="detailLoading" style="text-align: center; padding: 40px; color: var(--gray);">กำลังโหลดรูป...</div>
          <template v-else>
            <img v-if="detailModal.idCardImage" :src="detailModal.idCardImage" alt="บัตร" class="modal-img" />
            <div v-else class="modal-no-img">ไม่มีรูปบัตร</div>

            <!-- View Mode -->
            <template v-if="!editing">
              <div class="modal-info">
                <div class="modal-row"><span>ชื่อ (ไทย)</span><strong>{{ detailModal.firstName }} {{ detailModal.lastName }}</strong></div>
                <div class="modal-row"><span>Name (EN)</span><strong>{{ detailModal.firstNameEn }} {{ detailModal.lastNameEn }}</strong></div>
                <div class="modal-row"><span>เลขบัตร</span><strong style="font-family:monospace;">{{ formatNid(detailModal.nationalId) }}</strong></div>
                <div class="modal-row"><span>วันเกิด</span><strong>{{ detailModal.dateOfBirth }}</strong></div>
                <div class="modal-row">
                  <span>เพศ</span>
                  <strong v-if="detailModal.sex === 'M'" style="color:#2563eb;">♂ ชาย</strong>
                  <strong v-else-if="detailModal.sex === 'F'" style="color:#db2777;">♀ หญิง</strong>
                  <strong v-else style="color:#94a3b8;">— ยังไม่ระบุ</strong>
                </div>
                <div class="modal-row"><span>เบอร์โทร</span><strong>{{ detailModal.phone }}</strong></div>
                <div class="modal-row"><span>อีเมล</span><strong>{{ detailModal.email || '-' }}</strong></div>
                <div class="modal-row">
                  <span>ยืนยันอีเมล</span>
                  <span v-if="detailModal._emailVerified" style="color:#10b981;font-weight:700;">ยืนยันแล้ว</span>
                  <span v-else style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="color:#f59e0b;font-weight:700;">ยังไม่ยืนยัน</span>
                    <button class="btn btn-sm btn-outline" @click="resendVerify" :disabled="resending || bypassing" style="font-size:11px;">
                      {{ resending ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง' }}
                    </button>
                    <button class="btn btn-sm btn-bypass" @click="bypassVerify" :disabled="resending || bypassing" style="font-size:11px;" title="ข้ามการยืนยันอีเมล (Admin only)">
                      {{ bypassing ? 'กำลัง Bypass...' : '⚡ Bypass Email' }}
                    </button>
                  </span>
                </div>
                <div class="modal-row"><span>มหาวิทยาลัย</span><strong>{{ detailModal.university || '-' }}</strong></div>
                <div class="modal-row">
                  <span>สถานะ</span>
                  <span class="badge" :class="statusBadge(detailModal.status)">{{ statusText(detailModal.status) }}</span>
                </div>
              </div>

              <!-- ─── CMA (ศรว.) Info ─── -->
              <div class="cma-section">
                <div class="cma-section-header">
                  <span class="cma-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ข้อมูลจาก ศรว. (cmathai.org)
                  </span>
                  <button class="btn-sync-one" :disabled="cmaSyncOneBusy" @click="syncCmaOne">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                    {{ cmaSyncOneBusy ? 'กำลังเช็ค...' : 'Sync คนนี้' }}
                  </button>
                </div>

                <div v-if="!detailModal.cmaSyncedAt" class="cma-not-checked">
                  ยังไม่เคยตรวจกับ ศรว. — กด "Sync คนนี้" เพื่อตรวจสอบ
                </div>
                <template v-else>
                  <div v-if="!detailModal.cmaRegistered" class="cma-not-found">
                    ❌ ไม่พบในระบบ ศรว. (อาจยังไม่สมัครสอบ)
                    <div class="cma-checked-at">ตรวจล่าสุด: {{ formatDate(detailModal.cmaSyncedAt) }}</div>
                  </div>
                  <div v-else class="cma-found">
                    <div class="cma-found-status">
                      <span v-if="detailModal.cmaPassedAll" class="cma-status-passed">🎓 สอบผ่านครบทุกขั้นตอนแล้ว</span>
                      <span v-else class="cma-status-active">✓ สมัครสอบ ศรว. แล้ว</span>
                    </div>
                    <div class="cma-detail-grid">
                      <div class="cma-image-wrap">
                        <img v-if="detailModal.cmaProfileImage" :src="detailModal.cmaProfileImage" class="cma-profile-img" alt="รูปจาก ศรว." />
                        <div v-else class="cma-no-img">ไม่มีรูป</div>
                        <div class="cma-image-label">รูปจาก ศรว.</div>
                      </div>
                      <div class="cma-info">
                        <div class="cma-info-row"><span>ชื่อ (ไทย)</span><strong>{{ detailModal.cmaNameTh || '-' }}</strong></div>
                        <div class="cma-info-row"><span>ชื่อ (EN)</span><strong>{{ detailModal.cmaNameEn || '-' }}</strong></div>
                        <div class="cma-info-row"><span>ตรวจล่าสุด</span><strong>{{ formatDate(detailModal.cmaSyncedAt) }}</strong></div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-primary" @click="startEdit">แก้ไข</button>
                <button
                  v-if="detailModal.status === 'pending'"
                  class="btn btn-outline"
                  @click="markReviewed(detailModal._id)"
                >ตรวจแล้ว</button>
                <button
                  v-else
                  class="btn btn-outline"
                  @click="markPending(detailModal._id)"
                >ย้อนเป็นยังไม่ตรวจ</button>
              </div>
            </template>

            <!-- Edit Mode -->
            <template v-else>
              <div v-if="editError" style="background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 10px 14px; color: #c00; font-size: 13px; margin-bottom: 12px;">{{ editError }}</div>
              <form @submit.prevent="saveEdit" class="edit-form">
                <div class="edit-row">
                  <label>ชื่อ (ไทย)</label>
                  <input v-model="editForm.firstName" class="form-control" required />
                </div>
                <div class="edit-row">
                  <label>นามสกุล (ไทย)</label>
                  <input v-model="editForm.lastName" class="form-control" required />
                </div>
                <div class="edit-row">
                  <label>First Name (EN)</label>
                  <input v-model="editForm.firstNameEn" class="form-control" />
                </div>
                <div class="edit-row">
                  <label>Last Name (EN)</label>
                  <input v-model="editForm.lastNameEn" class="form-control" />
                </div>
                <div class="edit-row">
                  <label>เลขบัตรประชาชน</label>
                  <input v-model="editForm.nationalId" class="form-control" pattern="\d{13}" maxlength="13" required style="font-family: monospace;" />
                </div>
                <div class="edit-row">
                  <label>วันเกิด (dd/mm/yyyy พ.ศ.)</label>
                  <input v-model="editForm.dateOfBirth" class="form-control" required />
                </div>
                <div class="edit-row">
                  <label>เพศ</label>
                  <div class="sex-radio-group">
                    <label class="sex-radio" :class="{ active: editForm.sex === 'M' }">
                      <input type="radio" v-model="editForm.sex" value="M" />
                      <span>♂ ชาย</span>
                    </label>
                    <label class="sex-radio" :class="{ active: editForm.sex === 'F' }">
                      <input type="radio" v-model="editForm.sex" value="F" />
                      <span>♀ หญิง</span>
                    </label>
                    <label class="sex-radio" :class="{ active: editForm.sex === '' }">
                      <input type="radio" v-model="editForm.sex" value="" />
                      <span>— ไม่ระบุ</span>
                    </label>
                  </div>
                </div>
                <div class="edit-row">
                  <label>เบอร์โทร</label>
                  <input v-model="editForm.phone" class="form-control" required />
                </div>
                <div class="edit-row">
                  <label>อีเมล</label>
                  <input v-model="editForm.email" type="email" class="form-control" />
                </div>
                <div class="edit-row">
                  <label>สถาบัน</label>
                  <select v-model="editForm.university" class="form-control">
                    <option value="">— ไม่ระบุ —</option>
                    <option v-for="u in universities" :key="u" :value="u">{{ u }}</option>
                  </select>
                  <input v-if="editForm.university .includes('OTHER')" v-model="editForm.otherUniversity" class="form-control" placeholder="กรอกชื่อสถาบัน (ภาษาอังกฤษ ตัวพิมพ์ใหญ่)" style="margin-top:6px;" />
                </div>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 16px;">
                  <button type="submit" class="btn btn-primary" :disabled="editSaving">
                    {{ editSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
                  </button>
                  <button type="button" class="btn btn-outline" @click="editing = false">ยกเลิก</button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </div>
    </div>
    <!-- Loading Overlay: Sync CMA -->
    <div v-if="cmaSyncing" class="modal-overlay" style="z-index: 9999;">
      <div class="modal-card" style="max-width: 360px; text-align: center;">
        <div class="modal-body" style="padding: 32px;">
          <div class="cma-spinner"></div>
          <h3 style="margin: 16px 0 8px; color: #2563eb;">กำลัง Sync กับ ศรว.</h3>
          <p style="color: var(--gray); font-size: 14px;">
            กำลังตรวจสอบ {{ cmaSyncProgress?.total || 0 }} คนกับ cmathai.org<br/>
            กรุณารอสักครู่ — ห้ามปิดหน้านี้
          </p>
        </div>
      </div>
    </div>

    <!-- Modal: ผลลัพธ์ Sync CMA -->
    <div v-if="cmaSyncResult" class="modal-overlay" @click.self="closeCmaSyncResult">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="color: #2563eb;">ผลการ Sync ศรว.</h3>
          <button class="modal-close" @click="closeCmaSyncResult">&times;</button>
        </div>
        <div class="modal-body">
          <div class="sync-summary">
            <div class="sync-stat sync-stat-blue">
              <div class="sync-num">{{ cmaSyncResult.total }}</div>
              <div class="sync-label">ตรวจทั้งหมด</div>
            </div>
            <div class="sync-stat sync-stat-green">
              <div class="sync-num">{{ cmaSyncResult.registered }}</div>
              <div class="sync-label">เคยสมัคร</div>
            </div>
            <div class="sync-stat sync-stat-gray">
              <div class="sync-num">{{ cmaSyncResult.notRegistered }}</div>
              <div class="sync-label">ยังไม่สมัคร</div>
            </div>
            <div v-if="cmaSyncResult.errors > 0" class="sync-stat sync-stat-red">
              <div class="sync-num">{{ cmaSyncResult.errors }}</div>
              <div class="sync-label">Error</div>
            </div>
          </div>

          <div v-if="cmaSyncResult.detail && cmaSyncResult.detail.filter(d => d.registered).length" style="margin-top: 16px;">
            <div style="font-weight: 700; font-size: 13px; color: var(--dark); margin-bottom: 8px;">
              ✅ เคยสมัคร ศรว. (รายชื่อใหม่ที่เจอ)
            </div>
            <div class="sync-list">
              <div v-for="d in cmaSyncResult.detail.filter(x => x.registered)" :key="d.id" class="sync-list-item">
                <span class="sync-list-name">{{ d.name }}</span>
                <span v-if="d.passedAll" class="cma-badge cma-badge-done">🎓 ผ่านครบ</span>
                <span v-else class="cma-badge">✓ ศรว.</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 18px; text-align: center;">
            <button class="btn btn-primary" @click="closeCmaSyncResult">ปิด</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: ยืนยันลบ — ต้องกรอกเลขบัตร -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card" style="max-width: 420px;">
        <div class="modal-header" style="border-bottom-color: #fecaca;">
          <h3 style="color: #dc2626;">ยืนยันการลบข้อมูล</h3>
          <button class="modal-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: #dc2626;">ลบข้อมูล Passport</div>
              <div style="font-size: 13px; color: var(--gray); margin-top: 2px;">การลบไม่สามารถกู้คืนได้</div>
            </div>
          </div>
          <div class="delete-target-info">
            <div style="font-weight: 700; font-size: 15px;">{{ deleteTarget.firstName }} {{ deleteTarget.lastName }}</div>
            <div style="font-size: 13px; color: var(--gray); font-family: monospace; margin-top: 2px;">เลขบัตร: {{ maskNid(deleteTarget.nationalId) }}</div>
          </div>
          <div style="margin-top: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--dark); margin-bottom: 6px;">
              กรอกเลขบัตรประชาชน 13 หลัก เพื่อยืนยัน
            </label>
            <input
              v-model="deleteNidInput"
              type="text"
              class="form-control"
              placeholder="X-XXXX-XXXXX-XX-X"
              maxlength="17"
              style="font-family: monospace; font-size: 15px; text-align: center; letter-spacing: 1px;"
              @input="formatDeleteNid"
            />
            <div v-if="deleteNidInput && !deleteNidMatch" style="font-size: 12px; color: #dc2626; margin-top: 4px;">
              เลขบัตรไม่ตรง
            </div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 20px;">
            <button
              class="btn btn-delete-confirm"
              :disabled="!deleteNidMatch || deleteDeleting"
              @click="confirmDelete"
            >
              {{ deleteDeleting ? 'กำลังลบ...' : 'ยืนยันลบ' }}
            </button>
            <button class="btn btn-outline" @click="closeDeleteModal" style="flex:1;">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: ยืนยันยกเลิกเชื่อม LINE -->
    <div v-if="unlinkTarget" class="modal-overlay" @click.self="closeUnlinkModal">
      <div class="modal-card" style="max-width: 400px;">
        <div class="modal-header" style="border-bottom-color: #fed7aa;">
          <h3 style="color: #ea580c;">ยกเลิกเชื่อม LINE</h3>
          <button class="modal-close" @click="closeUnlinkModal">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;align-items:center;gap:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            <div>
              <div style="font-weight:700;font-size:14px;">{{ unlinkTarget.firstName }} {{ unlinkTarget.lastName }}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px;">
                LINE: <span style="color:#06c755;font-weight:600;">{{ unlinkTarget.lineDisplayName }}</span>
              </div>
            </div>
          </div>
          <div style="margin-top:14px;">
            <label style="display:block;font-size:13px;font-weight:600;color:var(--dark);margin-bottom:6px;">
              กรอกเลขบัตรประชาชน 13 หลัก เพื่อยืนยัน
            </label>
            <input
              v-model="unlinkNidInput"
              type="text"
              class="form-control"
              placeholder="X-XXXX-XXXXX-XX-X"
              maxlength="17"
              style="font-family:monospace;font-size:15px;text-align:center;letter-spacing:1px;"
              @input="formatUnlinkNid"
            />
            <div v-if="unlinkNidInput && !unlinkNidMatch" style="font-size:12px;color:#dc2626;margin-top:4px;">
              เลขบัตรไม่ตรง
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:18px;">
            <button
              class="btn"
              style="flex:1;background:#ea580c;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:700;cursor:pointer;"
              :disabled="!unlinkNidMatch"
              @click="confirmUnlink"
            >
              ยืนยันยกเลิกเชื่อม
            </button>
            <button class="btn btn-outline" style="flex:1;" @click="closeUnlinkModal">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManagePassport',
  data() {
    return {
      universities: [
        'คณะแพทยศาสตร์ศิริราชพยาบาล',
        'คณะแพทยศาสตร์โรงพยาบาลรามาธิบดี',
        'จุฬาลงกรณ์มหาวิทยาลัย',
        'มหาวิทยาลัยเชียงใหม่',
        'มหาวิทยาลัยขอนแก่น',
        'มหาวิทยาลัยสงขลานครินทร์',
        'มหาวิทยาลัยธรรมศาสตร์',
        'มหาวิทยาลัยศรีนครินทรวิโรฒ',
        'วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า',
        'คณะแพทยศาสตร์วชิรพยาบาล',
        'มหาวิทยาลัยนเรศวร',
        'มหาวิทยาลัยมหาสารคาม',
        'มหาวิทยาลัยเทคโนโลยีสุรนารี',
        'มหาวิทยาลัยอุบลราชธานี',
        'มหาวิทยาลัยบูรพา',
        'มหาวิทยาลัยวลัยลักษณ์',
        'มหาวิทยาลัยนราธิวาสราชนครินทร์',
        'มหาวิทยาลัยพะเยา',
        'มหาวิทยาลัยแม่ฟ้าหลวง',
        'สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง',
        'วิทยาลัยแพทยศาสตร์ศรีสวางควัฒน ราชวิทยาลัยจุฬาภรณ์',
        'สถาบันพระบรมราชชนก',
        'มหาวิทยาลัยเกษตรศาสตร์',
        'วิทยาลัยแพทยศาสตร์นานาชาติจุฬาภรณ์ มหาวิทยาลัยธรรมศาสตร์',
        'วิทยาลัยแพทยศาสตร์ มหาวิทยาลัยรังสิต',
        'มหาวิทยาลัยสยาม',
        'มหาวิทยาลัยกรุงเทพธนบุรี',
        'มหาวิทยาลัยเวสเทิร์น',
        'สถาบันอื่นๆ ในต่างประเทศ / OTHER INTERNATIONAL INSTITUTION'
      ],
      registrations: [],
      loading: false,
      error: null,
      search: '',
      statusFilter: '',
      detailModal: null,
      detailLoading: false,
      editing: false,
      resending: false,
      bypassing: false,
      editSaving: false,
      editError: '',
      editForm: {},
      sexBusyId: null,
      deleteTarget: null,
      deleteNidInput: '',
      deleteDeleting: false,
      lineCandidates: [],
      linkingLineRegId: null,
      linkingLineBusy: false,
      linePickerOpenId: null,
      linePickerSearch: '',
      linePickerStyle: {},
      unlinkTarget: null,
      unlinkNidInput: '',
      // ─── Sync CMA (ศรว.) ───
      cmaSyncing: false,
      cmaSyncProgress: null,   // { total, done, registered, notRegistered, errors, currentName }
      cmaSyncResult: null,     // ผลรวมหลัง sync เสร็จ
      cmaSyncOneBusy: false    // sync เฉพาะคน (ใน modal)
    }
  },
  computed: {
    filteredRegistrations() {
      let list = this.registrations
      if (this.statusFilter) {
        list = list.filter(r => r.status === this.statusFilter)
      }
      const q = this.search.toLowerCase().trim()
      if (q) {
        list = list.filter(r =>
          (r.firstName + ' ' + r.lastName).toLowerCase().includes(q) ||
          (r.firstNameEn + ' ' + r.lastNameEn).toLowerCase().includes(q) ||
          r.nationalId.includes(q) ||
          (r.phone || '').includes(q)
        )
      }
      return list
    },
    pendingCount() {
      return this.registrations.filter(r => r.status === 'pending').length
    },
    reviewedCount() {
      return this.registrations.filter(r => r.status === 'reviewed').length
    },
    groupAdmin() {
      return this.filteredRegistrations.filter(r => r.role === 'admin')
    },
    groupStaff() {
      return this.filteredRegistrations.filter(r => r.role === 'staff')
    },
    groupEnrolled() {
      const list = this.filteredRegistrations.filter(r => r.role !== 'admin' && r.role !== 'staff' && r.activations && r.activations.length > 0)
      return this.sortByCmaAndAge(list)
    },
    groupNoCourse() {
      const list = this.filteredRegistrations.filter(r => r.role !== 'admin' && r.role !== 'staff' && (!r.activations || r.activations.length === 0))
      return this.sortByCmaAndAge(list)
    },
    unfollowCount() {
      return this.registrations.filter(r => r.lineFollowing === false).length
    },
    cmaRegisteredCount() {
      return this.registrations.filter(r => r.cmaRegistered).length
    },
    cmaNotCheckedCount() {
      return this.registrations.filter(r => !r.cmaSyncedAt).length
    },
    cmaPassedAllCount() {
      return this.registrations.filter(r => r.cmaPassedAll).length
    },
    filteredLineCandidates() {
      const q = this.linePickerSearch.toLowerCase().trim()
      if (!q) return this.lineCandidates
      return this.lineCandidates.filter(c => c.displayName.toLowerCase().includes(q))
    },
    unlinkNidMatch() {
      if (!this.unlinkTarget) return false
      const input = this.unlinkNidInput.replace(/\D/g, '')
      const target = this.unlinkTarget.nationalId.replace(/\D/g, '')
      return input.length === 13 && input === target
    },
    deleteNidMatch() {
      if (!this.deleteTarget) return false
      const input = this.deleteNidInput.replace(/\D/g, '')
      const target = this.deleteTarget.nationalId.replace(/\D/g, '')
      return input.length === 13 && input === target
    }
  },
  async mounted() {
    await Promise.all([this.fetchRegistrations(), this.fetchLineCandidates()])
    document.addEventListener('click', this._closePicker = () => {
      this.linePickerOpenId = null
      this.linePickerSearch = ''
    })
  },
  beforeUnmount() {
    document.removeEventListener('click', this._closePicker)
  },
  methods: {
    async fetchRegistrations() {
      this.loading = true
      this.error = null
      try {
        const data = await api.get('/admin/passport')
        this.registrations = data.registrations
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
      } finally {
        this.loading = false
      }
    },

    async viewDetail(id, openEdit = false) {
      this.detailModal = { _id: id }
      this.detailLoading = true
      this.editing = false
      try {
        const data = await api.get(`/admin/passport/${id}`)
        this.detailModal = data.registration
        if (openEdit) this.startEdit()
      } catch {
        this.detailModal = null
        alert('โหลดข้อมูลไม่สำเร็จ')
      } finally {
        this.detailLoading = false
      }
    },

    async setSex(id, sex) {
      this.sexBusyId = id
      try {
        const data = await api.patch(`/admin/passport/${id}/sex`, { sex })
        const idx = this.registrations.findIndex(r => r._id === id)
        if (idx >= 0) this.registrations[idx].sex = data.registration.sex
      } catch (err) {
        alert(err.response?.data?.message || 'อัปเดตเพศไม่สำเร็จ')
      } finally {
        this.sexBusyId = null
      }
    },

    async changeStatus(id, status) {
      try {
        const data = await api.patch(`/admin/passport/${id}/status`, { status })
        const idx = this.registrations.findIndex(r => r._id === id)
        if (idx >= 0) this.registrations[idx] = data.registration
      } catch (err) {
        alert(err.response?.data?.message || 'อัปเดตไม่สำเร็จ')
      }
    },

    async markReviewed(id) {
      await this.changeStatus(id, 'reviewed')
      if (this.detailModal && this.detailModal._id === id) {
        this.detailModal.status = 'reviewed'
      }
    },

    async markPending(id) {
      await this.changeStatus(id, 'pending')
      if (this.detailModal && this.detailModal._id === id) {
        this.detailModal.status = 'pending'
      }
    },

    // ─── Sync CMA (ศรว.) — เช็คเฉพาะคนที่ยังไม่เคย sync หรือยังไม่เคยสมัคร ───
    async syncCma() {
      if (this.cmaSyncing) return
      const targets = this.registrations.filter(r => !r.cmaRegistered)
      if (!targets.length) {
        alert('ทุกคนเคยสมัคร ศรว. แล้ว ไม่ต้อง sync เพิ่ม')
        return
      }
      if (!confirm(`Sync สถานะ ศรว. สำหรับ ${targets.length} คน?\n(ใช้เวลาประมาณ ${Math.ceil(targets.length * 1.5 / 60)} นาที)`)) return

      this.cmaSyncing = true
      this.cmaSyncResult = null
      this.cmaSyncProgress = { total: targets.length, done: 0, registered: 0, notRegistered: 0, errors: 0, currentName: '' }

      try {
        const data = await api.post('/admin/passport/sync-cma', { force: false })
        this.cmaSyncResult = data
        // อัพเดทรายการในตาราง
        for (const d of (data.detail || [])) {
          const idx = this.registrations.findIndex(r => r._id === d.id)
          if (idx >= 0) {
            this.registrations[idx].cmaRegistered = d.registered
            this.registrations[idx].cmaPassedAll = d.passedAll
            this.registrations[idx].cmaSyncedAt = new Date().toISOString()
          }
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Sync ไม่สำเร็จ')
      } finally {
        this.cmaSyncing = false
        this.cmaSyncProgress = null
      }
    },

    async syncCmaOne() {
      if (!this.detailModal?._id || this.cmaSyncOneBusy) return
      this.cmaSyncOneBusy = true
      try {
        const data = await api.post(`/admin/passport/${this.detailModal._id}/sync-cma-one`)
        // re-fetch detail เพื่อได้รูปจาก ศรว. มาด้วย
        const fresh = await api.get(`/admin/passport/${this.detailModal._id}`)
        Object.assign(this.detailModal, fresh.registration)
        // sync ใน list
        const idx = this.registrations.findIndex(r => r._id === this.detailModal._id)
        if (idx >= 0) {
          this.registrations[idx].cmaRegistered = data.registered
          this.registrations[idx].cmaPassedAll = data.passedAll
          this.registrations[idx].cmaSyncedAt = new Date().toISOString()
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Sync ไม่สำเร็จ')
      } finally {
        this.cmaSyncOneBusy = false
      }
    },

    closeCmaSyncResult() {
      this.cmaSyncResult = null
    },

    async resendVerify() {
      if (!this.detailModal?._id) return
      this.resending = true
      try {
        const res = await api.post(`/admin/passport/${this.detailModal._id}/resend-verify`)
        alert(res.message || 'ส่งอีเมลยืนยันแล้ว')
      } catch (e) {
        alert(e.response?.data?.message || 'ส่งไม่สำเร็จ')
      } finally {
        this.resending = false
      }
    },

    async bypassVerify() {
      if (!this.detailModal?._id) return
      const email = this.detailModal.email || 'อีเมลนี้'
      if (!confirm(`ยืนยันข้ามการ verify email ${email}?\n\nUser จะ login ได้ทันทีโดยไม่ต้อง click link ในเมล`)) return
      this.bypassing = true
      try {
        const res = await api.post(`/admin/passport/${this.detailModal._id}/bypass-verify`)
        this.detailModal._emailVerified = true
        alert(res.message || 'Bypass สำเร็จ')
      } catch (e) {
        alert(e.response?.data?.message || 'Bypass ไม่สำเร็จ')
      } finally {
        this.bypassing = false
      }
    },

    closeModal() {
      this.detailModal = null
      this.editing = false
      this.editError = ''
    },

    startEdit() {
      this.editForm = {
        firstName: this.detailModal.firstName || '',
        lastName: this.detailModal.lastName || '',
        firstNameEn: this.detailModal.firstNameEn || '',
        lastNameEn: this.detailModal.lastNameEn || '',
        nationalId: this.detailModal.nationalId || '',
        dateOfBirth: this.detailModal.dateOfBirth || '',
        sex: this.detailModal.sex || '',
        phone: this.detailModal.phone || '',
        email: this.detailModal.email || '',
        university: this.universities.includes(this.detailModal.university) ? this.detailModal.university : (this.detailModal.university ? 'OTHER' : ''),
        otherUniversity: this.universities.includes(this.detailModal.university) ? '' : (this.detailModal.university || '')
      }
      this.editError = ''
      this.editing = true
    },

    async saveEdit() {
      this.editSaving = true
      this.editError = ''
      try {
        const payload = { ...this.editForm }
        if (payload.university .includes('OTHER')) {
          payload.university = (payload.otherUniversity || '').trim().toUpperCase()
        }
        delete payload.otherUniversity
        const data = await api.put(`/admin/passport/${this.detailModal._id}`, payload)
        // อัปเดต detail modal
        Object.assign(this.detailModal, data.registration)
        // อัปเดต table list
        const idx = this.registrations.findIndex(r => r._id === this.detailModal._id)
        if (idx >= 0) {
          Object.assign(this.registrations[idx], data.registration)
        }
        this.editing = false
      } catch (err) {
        this.editError = err.response?.data?.message || 'บันทึกไม่สำเร็จ'
      } finally {
        this.editSaving = false
      }
    },

    openDeleteModal(reg) {
      this.deleteTarget = reg
      this.deleteNidInput = ''
      this.deleteDeleting = false
    },
    closeDeleteModal() {
      this.deleteTarget = null
      this.deleteNidInput = ''
      this.deleteDeleting = false
    },
    formatDeleteNid() {
      const digits = this.deleteNidInput.replace(/\D/g, '').slice(0, 13)
      if (digits.length <= 1) { this.deleteNidInput = digits; return }
      let parts = [digits[0]]
      if (digits.length > 1) parts.push(digits.slice(1, 5))
      if (digits.length > 5) parts.push(digits.slice(5, 10))
      if (digits.length > 10) parts.push(digits.slice(10, 12))
      if (digits.length > 12) parts.push(digits[12])
      this.deleteNidInput = parts.join('-')
    },
    async confirmDelete() {
      if (!this.deleteTarget || !this.deleteNidMatch) return
      this.deleteDeleting = true
      try {
        await api.delete(`/admin/passport/${this.deleteTarget._id}`)
        this.registrations = this.registrations.filter(r => r._id !== this.deleteTarget._id)
        this.closeDeleteModal()
      } catch (err) {
        alert(err.response?.data?.message || 'ลบไม่สำเร็จ')
        this.deleteDeleting = false
      }
    },
    toggleLinePicker(regId, event) {
      if (this.linePickerOpenId === regId) {
        this.linePickerOpenId = null
        this.linePickerSearch = ''
        this.linePickerStyle = {}
      } else {
        this.linePickerOpenId = regId
        this.linePickerSearch = ''
        // คำนวณตำแหน่ง fixed จากปุ่ม
        const btn = event.currentTarget
        const rect = btn.getBoundingClientRect()
        const dropH = 280
        const spaceBelow = window.innerHeight - rect.bottom
        const top = spaceBelow < dropH ? rect.top - dropH - 4 : rect.bottom + 4
        this.linePickerStyle = {
          position: 'fixed',
          top: top + 'px',
          left: rect.left + 'px',
          zIndex: 9999
        }
        this.$nextTick(() => {
          this.$refs.linePickerInput?.focus()
        })
      }
    },

    async fetchLineCandidates() {
      try {
        const data = await api.get('/admin/passport/line-candidates')
        this.lineCandidates = data.candidates || []
      } catch { /* ignore */ }
    },

    linkLineById(lineUserId) {
      const reg = this.registrations.find(r => r._id === this.linePickerOpenId)
      if (reg) this.linkLine(reg, lineUserId)
    },

    async linkLine(reg, lineUserId) {
      if (!lineUserId || this.linkingLineBusy) return
      this.linkingLineBusy = true
      this.linkingLineRegId = reg._id
      try {
        const data = await api.post(`/admin/passport/${reg._id}/link-line`, { lineUserId })
        // อัปเดต reg ใน list
        const idx = this.registrations.findIndex(r => r._id === reg._id)
        if (idx >= 0) {
          this.registrations[idx].lineUserId = data.lineUserId
          this.registrations[idx].lineDisplayName = data.lineDisplayName
          this.registrations[idx].linePictureUrl = data.linePictureUrl
        }
        // refresh candidates
        await this.fetchLineCandidates()
      } catch (err) {
        alert(err.response?.data?.message || 'เชื่อม LINE ไม่สำเร็จ')
      } finally {
        this.linkingLineBusy = false
        this.linkingLineRegId = null
        this.linePickerOpenId = null
        this.linePickerSearch = ''
      }
    },

    openUnlinkModal(reg) {
      this.unlinkTarget = reg
      this.unlinkNidInput = ''
    },
    closeUnlinkModal() {
      this.unlinkTarget = null
      this.unlinkNidInput = ''
    },
    formatUnlinkNid() {
      const digits = this.unlinkNidInput.replace(/\D/g, '').slice(0, 13)
      if (digits.length <= 1) { this.unlinkNidInput = digits; return }
      let parts = [digits[0]]
      if (digits.length > 1) parts.push(digits.slice(1, 5))
      if (digits.length > 5) parts.push(digits.slice(5, 10))
      if (digits.length > 10) parts.push(digits.slice(10, 12))
      if (digits.length > 12) parts.push(digits[12])
      this.unlinkNidInput = parts.join('-')
    },
    async confirmUnlink() {
      const reg = this.unlinkTarget
      if (!reg) return
      try {
        await api.post(`/admin/passport/${reg._id}/unlink-line`)
        const idx = this.registrations.findIndex(r => r._id === reg._id)
        if (idx >= 0) {
          this.registrations[idx].lineUserId = null
          this.registrations[idx].lineDisplayName = null
          this.registrations[idx].linePictureUrl = null
        }
        await this.fetchLineCandidates()
        this.closeUnlinkModal()
      } catch (err) {
        alert(err.response?.data?.message || 'ยกเลิกไม่สำเร็จ')
      }
    },

    maskNid(id) {
      if (!id) return ''
      const d = id.replace(/\D/g, '')
      if (d.length !== 13) return id
      return `${d[0]}-${d.slice(1,3)}XX-XXXXX-${d.slice(10,12)}-${d[12]}`
    },

    formatNid(id) {
      if (!id) return ''
      const d = id.replace(/\D/g, '')
      if (d.length !== 13) return id
      return `${d[0]}-${d.slice(1,5)}-${d.slice(5,10)}-${d.slice(10,12)}-${d[12]}`
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
    },
    // คำนวณอายุปี ณ วันนี้ จาก dd/mm/yyyy พ.ศ.
    computeAge(dobThai) {
      if (!dobThai) return null
      const m = String(dobThai).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (!m) return null
      const day = parseInt(m[1], 10)
      const month = parseInt(m[2], 10)
      const yearBE = parseInt(m[3], 10)
      const yearAD = yearBE - 543
      if (yearAD < 1900 || yearAD > 2100) return null
      const today = new Date()
      let age = today.getFullYear() - yearAD
      const beforeBirthday = today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day)
      if (beforeBirthday) age--
      return age >= 0 && age < 130 ? age : null
    },
    ageColor(age) {
      if (age == null) return 'age-unknown'
      if (age < 21) return 'age-young'
      if (age <= 25) return 'age-normal'
      if (age <= 30) return 'age-mid'
      return 'age-old'
    },
    // sort: 1) ศรว. status priority  2) อายุ (มาก→น้อย)
    // priority order:
    //   0 = สอบครบทุกขั้น (passedAll) — น่าสงสัยที่สุด ขึ้นบน
    //   1 = สมัคร ศรว. แล้ว
    //   2 = ตรวจแล้วไม่พบ
    //   3 = ยังไม่เคยตรวจ
    cmaPriority(reg) {
      if (reg.cmaPassedAll) return 0
      if (reg.cmaRegistered) return 1
      if (reg.cmaSyncedAt) return 2
      return 3
    },
    cmaRowClass(reg) {
      if (reg.cmaPassedAll) return 'row-cma-passed'
      if (reg.cmaRegistered) return 'row-cma-ok'
      if (reg.cmaSyncedAt) return 'row-cma-warn'  // sync แล้วไม่พบใน ศรว.
      return ''  // ยังไม่ตรวจ — ไม่ใส่สี
    },
    sortByCmaAndAge(list) {
      return [...list].sort((a, b) => {
        const pa = this.cmaPriority(a)
        const pb = this.cmaPriority(b)
        if (pa !== pb) return pa - pb
        // อายุมาก → น้อย (อายุมาก = น่าสงสัยกว่า)
        const aa = this.computeAge(a.dateOfBirth) ?? -1
        const ab = this.computeAge(b.dateOfBirth) ?? -1
        return ab - aa
      })
    },
    statusBadge(s) {
      return s === 'reviewed' ? 'badge-live' : 'badge-video'
    },
    statusText(s) {
      return s === 'reviewed' ? 'ตรวจแล้ว' : 'ยังไม่ตรวจ'
    }
  }
}
</script>

<style scoped>
.btn-bypass {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  transition: box-shadow 0.15s, transform 0.15s, background 0.15s;
}
.btn-bypass:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}
.btn-bypass:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-blue   { background: #dbeafe; color: #1a56db; }
.stat-icon-green  { background: #d1fae5; color: #059669; }
.stat-icon-gold   { background: #fef9c3; color: #b45309; }
.stat-icon-red    { background: #fee2e2; color: #dc2626; }
.stat-content { flex: 1; min-width: 0; }
.stat-number { font-size: 28px; font-weight: 800; line-height: 1.1; }
.stat-blue   { color: var(--primary); }
.stat-green  { color: var(--success); }
.stat-gold   { color: #b45309; }
.stat-red    { color: #dc2626; }
.stat-label  { font-size: 13px; color: var(--gray); margin-top: 2px; }

/* CMA row colors */
.row-cma-passed td { background-color: #fef3c7 !important; } /* ทองจาง — สอบครบ */
.row-cma-passed:hover td { background-color: #fde68a !important; }
.row-cma-ok td { background-color: #f0fdf4 !important; }     /* เขียวจาง — สมัครแล้ว */
.row-cma-ok:hover td { background-color: #dcfce7 !important; }
.row-cma-warn td { background-color: #fff7ed !important; }   /* ส้มจาง — ตรวจแล้วไม่พบ */
.row-cma-warn:hover td { background-color: #ffedd5 !important; }

/* Clickable rows */
.row-clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.row-clickable:hover {
  background: #f0f7ff;
}

/* Action buttons */
.btn-action {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.btn-action svg { flex-shrink: 0; }
.btn-edit { color: #2563eb; }
.btn-edit:hover { background: #dbeafe; border-color: #2563eb; }
.btn-review { color: #059669; }
.btn-review:hover { background: #d1fae5; border-color: #059669; }
.btn-unreview { color: #6b7280; }
.btn-unreview:hover { background: #f3f4f6; border-color: #6b7280; }
.btn-delete { color: #dc2626; }
.btn-delete:hover { background: #fee2e2; border-color: #dc2626; }

/* Delete confirm modal */
.delete-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 14px 16px;
}
.delete-target-info {
  margin-top: 14px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}
.btn-delete-confirm {
  flex: 1;
  padding: 10px 16px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
.btn-delete-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
}
.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--gray);
  cursor: pointer;
  line-height: 1;
}
.modal-body {
  padding: 20px;
}
.modal-img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}
.modal-no-img {
  text-align: center;
  padding: 32px;
  background: #f8fafc;
  border-radius: 8px;
  color: var(--gray);
  margin-bottom: 16px;
}
.modal-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.modal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}
.modal-row span:first-child {
  font-size: 13px;
  color: var(--gray);
}
.modal-row strong {
  font-size: 14px;
  color: var(--dark);
}

/* Edit form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray);
  margin-bottom: 4px;
}
.edit-row .form-control {
  width: 100%;
  min-height: 36px;
  font-size: 14px;
}

/* Group sections */
.group-section {
  margin-bottom: 28px;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin-bottom: -1px;
  position: relative;
  z-index: 1;
}
.group-icon {
  font-size: 18px;
}
.group-title {
  font-size: 15px;
  font-weight: 700;
}
.group-count {
  font-size: 13px;
  opacity: 0.7;
  margin-left: auto;
}
.group-header-purple {
  background: linear-gradient(135deg, #7c3aed15, #a855f715);
  border: 1px solid #a855f730;
  color: #7c3aed;
}
.group-header-green {
  background: linear-gradient(135deg, #05966915, #10b98115);
  border: 1px solid #10b98130;
  color: #059669;
}
.group-header-gray {
  background: linear-gradient(135deg, #64748b10, #94a3b810);
  border: 1px solid #94a3b825;
  color: #64748b;
}

/* Course tags */
.course-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f0f7ff;
  margin: 2px 0;
  font-size: 12px;
}
.course-name {
  font-weight: 600;
  color: #1e40af;
}
.course-days {
  font-weight: 700;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}
.days-ok {
  background: #d1fae5;
  color: #059669;
}
.days-warn {
  background: #fee2e2;
  color: #dc2626;
}

/* Admin badge */
.badge-admin {
  background: #ede9fe;
  color: #7c3aed;
  font-weight: 700;
}

/* Demo tags */
.demo-tag {
  font-size: 12px;
  margin: 2px 0;
}
.demo-expired {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fee2e2;
  color: #dc2626;
  font-weight: 600;
}
.demo-active {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fef9c3;
  color: #b45309;
  font-weight: 600;
}

/* LINE picker */
.line-picker-wrap {
  position: relative;
}
.line-pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 3px 8px;
  border: 1px dashed #06c755;
  border-radius: 6px;
  background: #f0fff4;
  color: #06c755;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.line-pick-btn:hover {
  background: #dcfce7;
  border-style: solid;
}
.line-pick-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
.line-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  margin-top: 4px;
  width: 220px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  overflow: hidden;
}
.line-picker-search {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.line-picker-list {
  max-height: 200px;
  overflow-y: auto;
}
.line-picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 0.1s;
}
.line-picker-item:hover {
  background: #f0fff4;
}
.line-picker-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.line-picker-avatar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}
.line-picker-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-picker-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}
.badge-unfollow {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  background: #fee2e2;
  color: #dc2626;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.4;
}
.btn-unlink {
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  transition: color 0.15s;
}
.btn-unlink:hover {
  color: #dc2626;
}

/* ═══ Sex badge + quick pick ═══ */
.sex-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  line-height: 1.4;
  white-space: nowrap;
}
.sex-male {
  background: #dbeafe;
  color: #2563eb;
}
.sex-female {
  background: #fce7f3;
  color: #db2777;
}
.sex-quick-pick {
  display: inline-flex;
  gap: 4px;
}
.sex-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}
.sex-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
.sex-btn-m {
  color: #2563eb;
}
.sex-btn-m:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
}
.sex-btn-f {
  color: #db2777;
}
.sex-btn-f:hover:not(:disabled) {
  background: #fce7f3;
  border-color: #db2777;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(219, 39, 119, 0.2);
}

/* ═══ Sex radio (in edit modal) ═══ */
.sex-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sex-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: #fff;
  transition: all 0.15s;
}
.sex-radio input {
  margin: 0;
}
.sex-radio:hover {
  border-color: #3b82f6;
  color: #1e40af;
}
.sex-radio.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1e40af;
}

/* ─── CMA Sync UI ─── */
.btn-sync-cma {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  transition: all 0.18s;
}
.btn-sync-cma:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}
.btn-sync-cma:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stat-icon-cma {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
}
.stat-cma { color: #1e40af; }

.cma-badge {
  display: inline-block;
  padding: 1px 7px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

/* Age badges — สีไล่ระดับตามอายุ */
.age-badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.4;
}
.age-young   { background: #ecfeff; color: #0891b2; }   /* ฟ้าน้ำเงิน — < 21 */
.age-normal  { background: #f0fdf4; color: #16a34a; }   /* เขียว — 21-25 (วัยสอบ ศรว.) */
.age-mid     { background: #fefce8; color: #ca8a04; }   /* เหลือง — 26-30 */
.age-old     { background: #fef2f2; color: #b91c1c; }   /* แดงจาง — > 30 */
.age-unknown { background: #f1f5f9; color: #64748b; }
.cma-badge-done {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

/* CMA section inside modal */
.cma-section {
  margin-top: 18px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}
.cma-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.cma-section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e40af;
}
.btn-sync-one {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: #fff;
  color: #2563eb;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-sync-one:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #3b82f6;
}
.btn-sync-one:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cma-not-checked {
  font-size: 13px;
  color: #64748b;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  text-align: center;
  border: 1px dashed #cbd5e1;
}
.cma-not-found {
  font-size: 13px;
  color: #475569;
  padding: 10px 12px;
  background: #fff;
  border-radius: 8px;
}
.cma-checked-at {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}
.cma-found-status {
  margin-bottom: 10px;
}
.cma-status-active {
  display: inline-block;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}
.cma-status-passed {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}
.cma-detail-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 14px;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
}
.cma-image-wrap { text-align: center; }
.cma-profile-img {
  width: 90px;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #bfdbfe;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.cma-no-img {
  width: 90px;
  height: 110px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #94a3b8;
  border: 1px dashed #cbd5e1;
}
.cma-image-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 600;
}
.cma-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.cma-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 6px;
}
.cma-info-row:last-child { border-bottom: none; padding-bottom: 0; }
.cma-info-row span { color: #64748b; font-size: 12px; }
.cma-info-row strong { color: #1e293b; font-weight: 600; text-align: right; }

/* Spinner สำหรับโหลด */
.cma-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e7ff;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto;
  animation: cma-spin 0.8s linear infinite;
}
@keyframes cma-spin { to { transform: rotate(360deg); } }

/* Sync result summary */
.sync-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.sync-stat {
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}
.sync-stat-blue { background: #eff6ff; }
.sync-stat-blue .sync-num { color: #2563eb; }
.sync-stat-green { background: #f0fdf4; }
.sync-stat-green .sync-num { color: #16a34a; }
.sync-stat-gray { background: #f8fafc; }
.sync-stat-gray .sync-num { color: #64748b; }
.sync-stat-red { background: #fef2f2; }
.sync-stat-red .sync-num { color: #dc2626; }
.sync-num { font-size: 22px; font-weight: 800; line-height: 1; }
.sync-label { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }

.sync-list {
  max-height: 240px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 8px;
  padding: 6px;
}
.sync-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  font-size: 13px;
  border-bottom: 1px solid #e2e8f0;
}
.sync-list-item:last-child { border-bottom: none; }
.sync-list-name { color: #1e293b; }
</style>
