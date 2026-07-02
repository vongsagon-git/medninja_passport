<template>
  <div class="admin-page">
    <!-- Hero -->
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.48 2 2 5.93 2 10.71c0 2.81 1.49 5.28 3.78 6.9-.13.47-.84 2.88-.87 3.09 0 0-.02.12.05.17.07.04.15.02.15.02.2-.03 2.37-1.56 3.36-2.18.78.15 1.6.24 2.53.24 5.52 0 10-3.93 10-8.76C22 5.93 17.52 2 12 2z"/></svg>
          </div>
          <div>
            <h1>LINE Dashboard</h1>
            <p>จัดการ Followers + ส่ง Flex Message</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container section">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button :class="['tab-btn', { active: activeTab === 'funnel' }]" @click="activeTab = 'funnel'; loadFunnel()">
          🎯 Funnel
        </button>
        <button :class="['tab-btn', { active: activeTab === 'followers' }]" @click="activeTab = 'followers'">Followers</button>
        <button :class="['tab-btn', { active: activeTab === 'chat' }]" @click="activeTab = 'chat'; loadChatFollowers(); loadAIConfig()">
          AI
          <span v-if="escalationCount" class="tab-badge">{{ escalationCount }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'quiz' }]" @click="activeTab = 'quiz'">
          🧠 Quiz
        </button>
        <button :class="['tab-btn', { active: activeTab === 'survey' }]" @click="activeTab = 'survey'">
          📋 Survey
        </button>
      </div>

      <!-- ═══ TAB: Funnel (LINE CRM Pipeline) ═══ -->
      <div v-show="activeTab === 'funnel'" class="funnel-wrapper">
        <!-- Admin Bar (แนวนอน) -->
        <!-- Header stats -->
        <div class="funnel-header-bar">
          <span>🎓 นักเรียน <b>{{ funnelStudentCount }}</b> คน</span>
          <span>👨‍👩‍👧 ผปค. <b>{{ funnelParentCount }}</b> คน</span>
          <span>👥 ทั้งหมด <b>{{ funnelAllFollowers.length }}</b> คน</span>
          <input v-model="funnelSearch" class="form-control" placeholder="🔍 ค้นหาชื่อ..." style="width:180px;font-size:12px;padding:4px 10px;margin-left:auto" />
          <span v-if="funnelData.admin && funnelData.admin.length">
            👑
            <span v-for="a in funnelData.admin" :key="a.lineUserId" class="funnel-admin-chip" style="cursor:pointer" @click="openFunnelSend(a)" title="ส่ง Flex">
              <img v-if="a.pictureUrl" :src="a.pictureUrl" style="width:20px;height:20px;border-radius:50%" />
              {{ a.nickname || a.displayName || a.studentName }}
            </span>
          </span>
        </div>
        <div class="funnel-board">
          <div v-for="col in funnelColumns" :key="col.tag" class="funnel-col">
            <div class="funnel-col-header" :style="{ borderTopColor: col.color }">
              <span class="funnel-col-badge" :style="{ backgroundColor: col.color }">{{ funnelGroups[col.tag]?.length || 0 }}</span>
              <span class="funnel-col-title">{{ col.label }}</span>
              <span v-if="funnelFamilyCount[col.tag]" style="font-size:11px;color:#ec4899">(+{{ funnelFamilyCount[col.tag] }} ผปค.)</span>
            </div>
            <div class="funnel-col-body">
              <template v-for="group in funnelGroups[col.tag] || []" :key="group.main.lineUserId">
                <!-- Group card (นักเรียน + ผปค.) -->
                <div class="funnel-card" :class="{ 'funnel-group': group.family.length > 0 }">
                  <!-- นักเรียน (main) -->
                  <div class="funnel-card-row">
                    <img v-if="group.main.pictureUrl" :src="group.main.pictureUrl" class="funnel-avatar" />
                    <div class="funnel-avatar funnel-avatar-placeholder" v-else>{{ (group.main.displayName || '?')[0] }}</div>
                    <div class="funnel-card-info">
                      <div class="funnel-card-name">{{ group.main.nickname || group.main.displayName || group.main.studentName || 'ไม่ทราบชื่อ' }}</div>
                      <div class="funnel-card-sub" v-if="group.main.studentName && (group.main.nickname || group.main.displayName) !== group.main.studentName">{{ group.main.studentName }}</div>
                      <div class="funnel-card-sub" v-if="group.main.university">{{ group.main.university }}</div>
                      <div v-if="group.main.passedExams && group.main.passedExams.length" class="funnel-badges">
                        <span v-if="group.main.passedExams.includes('nl1')" class="funnel-exam-badge" style="background:#16a34a">✓NL1</span>
                        <span v-if="group.main.passedExams.includes('nl2')" class="funnel-exam-badge" style="background:#16a34a">✓NL2</span>
                        <span v-if="group.main.passedExams.includes('nl1+2')" class="funnel-exam-badge" style="background:#16a34a">✓NL1+2</span>
                        <span v-if="group.main.passedExams.includes('nl')" class="funnel-exam-badge" style="background:#16a34a">✓NL</span>
                        <span v-if="group.main.passedExams.includes('meq')" class="funnel-exam-badge" style="background:#0891b2">✓MEQ</span>
                        <span v-if="group.main.passedExams.includes('osce')" class="funnel-exam-badge" style="background:#7c3aed">✓OSCE</span>
                      </div>
                      <div v-if="group.main.segment && group.main.segment.length" class="funnel-badges" style="margin-top:2px">
                        <span v-for="s in group.main.segment" :key="s" class="funnel-exam-badge" :style="{ background: segColor(s) }">{{ segLabel(s) }}</span>
                      </div>
                      <div v-if="group.main.courses && group.main.courses.length" class="funnel-badges" style="margin-top:2px">
                        <span v-for="c in group.main.courses" :key="c" class="funnel-exam-badge" :style="{ background: c === 'กำลังทดลอง' ? '#f59e0b' : '#7c3aed' }">{{ c === 'กำลังทดลอง' ? '⏳' : '📚' }} {{ c }}</span>
                      </div>
                      <span v-if="!group.main.isFollowing" class="funnel-exam-badge" style="background:#ef4444;font-size:9px">🚫 unfollow</span>
                      <div class="funnel-card-sub" v-if="group.main.lastMessageText">💬 {{ group.main.lastMessageText.slice(0, 40) }}</div>
                      <div class="funnel-card-sub" style="color:#94a3b8;font-size:10px">🕐 {{ timeAgo(group.main.lastMessageAt || group.main.followedAt) }}</div>
                    </div>
                  </div>
                  <!-- ผู้ปกครอง/ครอบครัว (ถ้ามี) -->
                  <div v-for="p in group.family" :key="p.lineUserId" class="funnel-parent-row">
                    <img v-if="p.pictureUrl" :src="p.pictureUrl" class="funnel-avatar-sm" />
                    <div class="funnel-avatar-sm funnel-avatar-placeholder" v-else>{{ (p.displayName || '?')[0] }}</div>
                    <div class="funnel-parent-info">
                      <span style="color:#ec4899;font-size:11px">👨‍👩‍👧</span>
                      <span class="funnel-card-name" style="font-size:12px">{{ p.nickname || p.displayName }}</span>
                      <span v-if="p.lastMessageText" class="funnel-card-sub" style="font-size:10px">💬 {{ p.lastMessageText.slice(0, 25) }}</span>
                    </div>
                  </div>
                  <!-- Actions -->
                  <div class="funnel-card-actions">
                    <select :value="col.tag" @change="changeTag(group.main.lineUserId, $event.target.value, col.tag)" class="funnel-tag-select">
                      <option v-for="c in funnelColumns" :key="c.tag" :value="c.tag">{{ c.shortLabel }}</option>
                    </select>
                    <button class="funnel-edit-btn" @click="openFunnelChat(group.main)" title="แชท">💬</button>
                    <button class="funnel-edit-btn" @click="openFunnelSend(group.main)" title="ส่ง Flex">📨</button>
                    <button class="funnel-edit-btn" @click="openFunnelEdit(group.main)" title="แก้ไข">✏️</button>
                  </div>
                </div>
              </template>
              <div v-if="!funnelGroups[col.tag]?.length" class="funnel-empty">ว่าง</div>
            </div>
          </div>
        </div>

        <!-- Unfollow Bar -->
        <div v-if="funnelData.unfollow && funnelData.unfollow.length" class="funnel-unfollow-bar">
          <span style="font-size:12px;font-weight:700;color:#94a3b8">🚫 Unfollow ({{ funnelData.unfollow.length }})</span>
          <div v-for="u in funnelData.unfollow.slice(0, 20)" :key="u.lineUserId" class="funnel-unfollow-chip">
            <img v-if="u.pictureUrl" :src="u.pictureUrl" style="width:20px;height:20px;border-radius:50%" />
            <span>{{ u.nickname || u.displayName || '?' }}</span>
          </div>
          <span v-if="funnelData.unfollow.length > 20" style="font-size:11px;color:#94a3b8">+{{ funnelData.unfollow.length - 20 }} คน</span>
        </div>

        <!-- Edit Modal -->
        <div v-if="funnelEditTarget" class="funnel-modal-overlay" @click.self="funnelEditTarget = null">
          <div class="funnel-modal">
            <h3 style="margin:0 0 16px">✏️ {{ funnelEditTarget.displayName }}</h3>
            <div class="form-group">
              <label>ชื่อเล่น</label>
              <input v-model="funnelEditTarget.nickname" class="form-control" placeholder="ตั้งชื่อเล่น" />
            </div>
            <div class="form-group">
              <label>ผู้ปกครอง / ครอบครัว (เลือกได้หลายคน)</label>
              <input v-model="familySearch" class="form-control" placeholder="ค้นหาชื่อ..." style="font-size:12px;margin-bottom:6px" />
              <div style="max-height:150px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:8px">
                <label v-for="f in funnelNonStudentList" :key="f.lineUserId" class="check-label" :class="{ active: funnelEditFamilyUids.includes(f.lineUserId) }" style="display:flex;gap:6px;margin-bottom:4px;font-size:12px">
                  <input type="checkbox" :value="f.lineUserId" v-model="funnelEditFamilyUids" />
                  <span>{{ f.nickname || f.displayName }} {{ f.lastMessageText ? '(💬 ' + f.lastMessageText.slice(0,20) + ')' : '' }}</span>
                </label>
                <div v-if="!funnelNonStudentList.length" style="color:#94a3b8;font-size:12px">ไม่มี follower ที่ไม่ใช่นักเรียน</div>
              </div>
            </div>
            <div class="form-group">
              <label>สอบผ่าน</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <label class="check-label" :class="{ active: funnelEditExams.includes('nl1') }">
                  <input type="checkbox" value="nl1" v-model="funnelEditExams" /> NL1
                </label>
                <label class="check-label" :class="{ active: funnelEditExams.includes('nl2') }">
                  <input type="checkbox" value="nl2" v-model="funnelEditExams" /> NL2
                </label>
                <label class="check-label" :class="{ active: funnelEditExams.includes('nl1+2') }">
                  <input type="checkbox" value="nl1+2" v-model="funnelEditExams" /> NL1+2
                </label>
                <label class="check-label" :class="{ active: funnelEditExams.includes('meq') }">
                  <input type="checkbox" value="meq" v-model="funnelEditExams" /> MEQ
                </label>
                <label class="check-label" :class="{ active: funnelEditExams.includes('osce') }">
                  <input type="checkbox" value="osce" v-model="funnelEditExams" /> OSCE
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>กำลังเตรียม (Segment)</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <label class="check-label" :class="{ active: funnelEditSegments.includes('nl-new70') }" style="font-size:11px">
                  <input type="checkbox" value="nl-new70" v-model="funnelEditSegments" /> NL ระบบใหม่ 70
                </label>
                <label class="check-label" :class="{ active: funnelEditSegments.includes('nl2') }" style="font-size:11px">
                  <input type="checkbox" value="nl2" v-model="funnelEditSegments" /> เหลือ NL2
                </label>
                <label class="check-label" :class="{ active: funnelEditSegments.includes('meq') }" style="font-size:11px">
                  <input type="checkbox" value="meq" v-model="funnelEditSegments" /> เตรียม MEQ
                </label>
                <label class="check-label" :class="{ active: funnelEditSegments.includes('osce') }" style="font-size:11px">
                  <input type="checkbox" value="osce" v-model="funnelEditSegments" /> เตรียม OSCE
                </label>
              </div>
            </div>
            <div class="send-actions">
              <button class="btn btn-primary" @click="saveFunnelEdit">บันทึก</button>
              <button class="btn btn-outline" @click="funnelEditTarget = null">ยกเลิก</button>
            </div>
          </div>
        </div>
      </div>

        <!-- Funnel Chat Modal -->
        <div v-if="funnelChatTarget" class="funnel-modal-overlay" @click.self="closeFunnelChat">
          <div class="funnel-modal" style="max-width:480px;height:70vh;display:flex;flex-direction:column">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <img v-if="funnelChatTarget.pictureUrl" :src="funnelChatTarget.pictureUrl" style="width:32px;height:32px;border-radius:50%" />
              <div style="flex:1;min-width:0">
                <h3 style="margin:0;font-size:14px">💬 {{ funnelChatTarget.nickname || funnelChatTarget.displayName }}</h3>
                <div style="font-size:11px;color:#94a3b8">{{ funnelChatTarget.studentName || '' }}</div>
              </div>
              <button style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8" @click="closeFunnelChat">&times;</button>
            </div>
            <div ref="funnelChatMessages" style="flex:1;overflow-y:auto;background:#f8fafc;border-radius:8px;padding:10px;margin-bottom:8px">
              <div v-for="msg in funnelChatMessages" :key="msg._id" :class="['chat-bubble', 'chat-' + msg.role]">
                <div class="chat-role-label">{{ msg.role === 'user' ? 'ลูกค้า' : msg.role === 'admin' ? 'Admin' : 'AI' }}</div>
                <div class="chat-text">{{ msg.text }}</div>
                <div class="chat-time">{{ formatDate(msg.createdAt) }}</div>
              </div>
              <div v-if="funnelChatLoading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">กำลังโหลด...</div>
              <div v-else-if="!funnelChatMessages.length" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">ยังไม่มีข้อความ</div>
            </div>
            <div style="display:flex;gap:6px">
              <input v-model="funnelChatReply" class="form-control" placeholder="พิมพ์ข้อความ..." style="flex:1;font-size:13px" @keydown.enter="sendFunnelChatReply" />
              <button class="btn btn-primary" style="flex-shrink:0;font-size:12px" @click="sendFunnelChatReply" :disabled="!funnelChatReply.trim() || funnelChatSending">ส่ง</button>
            </div>
          </div>
        </div>

        <!-- Funnel Send Flex Modal -->
        <div v-if="funnelSendTarget" class="funnel-modal-overlay" @click.self="funnelSendTarget = null">
          <div class="funnel-modal" style="max-width:380px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
              <img v-if="funnelSendTarget.pictureUrl" :src="funnelSendTarget.pictureUrl" style="width:32px;height:32px;border-radius:50%" />
              <div style="flex:1">
                <h3 style="margin:0;font-size:14px">📨 ส่ง Flex</h3>
                <div style="font-size:11px;color:#94a3b8">→ {{ funnelSendTarget.nickname || funnelSendTarget.displayName }}</div>
              </div>
              <button style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8" @click="funnelSendTarget = null">&times;</button>
            </div>
            <!-- เลือกส่งให้ใคร -->
            <div style="display:flex;gap:6px;margin-bottom:10px">
              <label class="radio-label" :class="{ active: funnelSendMode === 'person' }" style="font-size:11px;padding:4px 10px">
                <input type="radio" v-model="funnelSendMode" value="person" />
                <span>→ {{ (funnelSendTarget.nickname || funnelSendTarget.displayName || '').slice(0, 10) }}</span>
              </label>
              <label class="radio-label" :class="{ active: funnelSendMode === 'admin' }" style="font-size:11px;padding:4px 10px">
                <input type="radio" v-model="funnelSendMode" value="admin" />
                <span>👑 Admin ดูก่อน</span>
              </label>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button v-for="t in funnelFlexOptions" :key="t.id" class="btn" :style="{ background: t.color, color: '#fff', fontSize: '12px', textAlign: 'left', padding: '8px 12px' }" @click="sendFunnelFlex(t.id)" :disabled="funnelSending">
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
            <div v-if="funnelSendMsg" style="font-size:12px;color:#16a34a;margin-top:10px">✓ {{ funnelSendMsg }}</div>
          </div>
        </div>

      <!-- ═══ TAB: Followers ═══ -->
      <div v-show="activeTab === 'followers'">

      <!-- ═══ Quick Send (3 ขั้นตอน) ═══ -->
      <div class="send-section" style="margin-bottom:16px;border:2px solid #e2e8f0;border-radius:12px">
        <h2 style="margin:0 0 14px;font-size:16px">⚡ Quick Send</h2>

        <!-- ① เลือกผู้รับ -->
        <div style="margin-bottom:14px">
          <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px">① ส่งให้ใคร</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label class="radio-label" :class="{ active: quickSendMode === 'admin' }"><input type="radio" v-model="quickSendMode" value="admin" /><span>Admin ดูก่อน</span></label>
            <label class="radio-label" :class="{ active: quickSendMode === 'selected' }"><input type="radio" v-model="quickSendMode" value="selected" /><span>ที่เลือก ({{ selectedIds.length }} คน)</span></label>
            <label class="radio-label" :class="{ active: quickSendMode === 'pushall' }"><input type="radio" v-model="quickSendMode" value="pushall" /><span>Push All ที่รู้ UUID ({{ stats.total || 0 }} คน / ฟรี)</span></label>
            <label class="radio-label" :class="{ active: quickSendMode === 'broadcast' }"><input type="radio" v-model="quickSendMode" value="broadcast" /><span style="color:#dc2626">Broadcast ทุกคนที่ Follow ({{ broadcastCount }} คน / เสีย quota)</span></label>
          </div>
        </div>

        <!-- ② เลือก Flex -->
        <div style="margin-bottom:14px">
          <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px">② ส่งอะไร</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'preclinic' }"><input type="radio" v-model="quickSelectedFlex" value="preclinic" /><span>PRE-CLINIC</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'nl' }"><input type="radio" v-model="quickSelectedFlex" value="nl" /><span>NL MASTERY (1+2)</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'nl2' }"><input type="radio" v-model="quickSelectedFlex" value="nl2" /><span>NL2</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'meq' }"><input type="radio" v-model="quickSelectedFlex" value="meq" /><span>MEQ Intensive</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'osce' }"><input type="radio" v-model="quickSelectedFlex" value="osce" /><span>OSCE Mastery</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'register' }"><input type="radio" v-model="quickSelectedFlex" value="register" /><span>สมัครเรียน</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'trial' }"><input type="radio" v-model="quickSelectedFlex" value="trial" /><span>ทดลองเรียน</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'howto' }"><input type="radio" v-model="quickSelectedFlex" value="howto" /><span>วิธีเข้าเรียน</span></label>
            <label class="radio-label" :class="{ active: quickSelectedFlex === 'pair' }"><input type="radio" v-model="quickSelectedFlex" value="pair" /><span>ทดลอง + How-to (คู่)</span></label>
          </div>
        </div>

        <!-- ③ ยืนยัน -->
        <div style="padding-top:12px;border-top:1px solid #e2e8f0">
          <button class="btn btn-primary" style="font-size:14px;padding:10px 32px;width:100%"
            @click="quickSendConfirm"
            :disabled="!quickSelectedFlex || !quickSendMode || courseSending || (quickSendMode === 'selected' && !selectedIds.length)">
            {{ courseSending ? 'กำลังส่ง...' : (quickSelectedFlex && quickSendMode ? '③ ยืนยัน — ' + quickSendSummary : 'เลือกผู้รับ + Flex ก่อน') }}
          </button>
          <div v-if="courseFlexMsg" style="font-size:12px;color:#16a34a;margin-top:8px;text-align:center">✓ {{ courseFlexMsg }}</div>
        </div>
      </div>

      <!-- Payment + Activate (เหนือตาราง) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <!-- Payment -->
        <div class="send-section" style="margin:0">
          <h2 style="font-size:15px;margin:0 0 10px">💳 ชำระเงิน <span style="font-size:11px;color:#94a3b8">(เลือก 1 คน)</span></h2>
          <div v-if="selectedCount !== 1" class="payment-hint" style="font-size:12px">เลือก 1 คนจากตาราง ({{ selectedCount }} คน)</div>
          <template v-else>
            <div class="payment-target" style="font-size:12px">→ {{ getSelectedFollower()?.displayName || '-' }} <span v-if="getSelectedFollower()?.studentName" class="badge badge-blue">{{ getSelectedFollower().studentName }}</span></div>
            <div class="form-group"><label style="font-size:12px">คอร์ส</label><input v-model="payForm.courseName" class="form-control" placeholder="NL MASTERY" style="font-size:12px" /></div>
            <div class="form-group"><label style="font-size:12px">ราคา (บาท)</label><input v-model.number="payForm.amount" type="number" class="form-control" placeholder="64900" style="font-size:12px;width:150px" /></div>
            <div class="form-group">
              <div class="payment-methods">
                <label class="check-label" :class="{ active: payForm.transfer }"><input type="checkbox" v-model="payForm.transfer" /><span>กสิกร</span></label>
                <label class="check-label" :class="{ active: payForm.card }"><input type="checkbox" v-model="payForm.card" /><span>บัตร</span></label>
                <label class="check-label" :class="{ active: payForm.installment === 3 }"><input type="radio" name="installment" :value="3" v-model="payForm.installment" /><span>ผ่อน 3ด.</span></label>
                <label class="check-label" :class="{ active: payForm.installment === 6 }"><input type="radio" name="installment" :value="6" v-model="payForm.installment" /><span>ผ่อน 6ด.</span></label>
              </div>
            </div>
            <button class="btn btn-primary" @click="sendPayment" :disabled="paymentSending || !payForm.courseName || !payForm.amount" style="background:#16a34a;font-size:12px;width:100%">{{ paymentSending ? 'กำลังส่ง...' : 'ส่ง Flex ชำระเงิน' }}</button>
          </template>
        </div>

        <!-- Activate -->
        <div class="send-section" style="margin:0">
          <h2 style="font-size:15px;margin:0 0 10px">🚀 เปิดระบบ <span style="font-size:11px;color:#94a3b8">(เลือก 1 คน)</span></h2>
          <div v-if="selectedCount !== 1" class="payment-hint" style="font-size:12px">เลือก 1 คนจากตาราง ({{ selectedCount }} คน)</div>
          <template v-else>
            <div class="payment-target" style="font-size:12px">→ {{ getSelectedFollower()?.displayName || '-' }} <span v-if="getSelectedFollower()?.studentName" class="badge badge-blue">{{ getSelectedFollower().studentName }}</span></div>
            <div style="display:flex;gap:6px;margin-bottom:8px">
              <label class="radio-label" :class="{ active: activateForm.isNew }" style="font-size:11px"><input type="radio" :value="true" v-model="activateForm.isNew" /><span>ใหม่</span></label>
              <label class="radio-label" :class="{ active: !activateForm.isNew }" style="font-size:11px"><input type="radio" :value="false" v-model="activateForm.isNew" /><span>เก่า</span></label>
            </div>
            <div class="form-group"><label style="font-size:12px;font-weight:700">คอร์ส</label>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <label v-for="c in activateCourseOptions" :key="c" class="check-label" :class="{ active: activateForm.courses.includes(c) }" style="font-size:10px;padding:3px 6px"><input type="checkbox" :value="c" v-model="activateForm.courses" /> {{ c }}</label>
              </div>
              <input v-model="activateForm.customCourse" class="form-control" placeholder="อื่นๆ" style="margin-top:4px;font-size:11px" />
            </div>
            <div class="form-group"><label style="font-size:12px;font-weight:700">ระบบพิเศษ</label>
              <div style="display:flex;gap:4px;flex-wrap:wrap">
                <label v-for="s in activateSystemOptions" :key="s" class="check-label" :class="{ active: activateForm.systems.includes(s) }" style="font-size:10px;padding:3px 6px"><input type="checkbox" :value="s" v-model="activateForm.systems" /> {{ s }}</label>
              </div>
            </div>
            <div class="form-group"><label style="font-size:12px;font-weight:700">Note</label>
              <textarea v-model="activateForm.note" class="form-control" rows="2" placeholder="ว่างไว้ = 'สามารถเข้าเรียนได้ทันทีผ่าน medninja.academy ครับ 📚'" style="font-size:11px"></textarea>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn" style="background:#f59e0b;color:#fff;font-size:11px;flex:1" @click="sendActivatePreview" :disabled="activateSending || !activateCourseList().length">Admin ดูก่อน</button>
              <button class="btn btn-primary" style="background:#16a34a;font-size:11px;flex:1" @click="sendActivate" :disabled="activateSending || !activateCourseList().length">ส่งเปิดระบบ</button>
            </div>
          </template>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-num">{{ stats.total || 0 }}</div>
          <div class="stat-label">ทั้งหมด</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:#16a34a">{{ stats.following || 0 }}</div>
          <div class="stat-label">Follow</div>
        </div>
        <div class="stat-card">
          <div class="stat-num" style="color:#3b82f6">{{ stats.students || 0 }}</div>
          <div class="stat-label">นักเรียน</div>
        </div>
      </div>

      <!-- Filter + Search -->
      <div class="toolbar">
        <div class="filter-group">
          <button :class="['filter-btn', { active: filter === 'all' }]" @click="filter = 'all'; loadFollowers()">ทั้งหมด</button>
          <button :class="['filter-btn', { active: filter === 'following' }]" @click="filter = 'following'; loadFollowers()">Following</button>
          <button :class="['filter-btn', { active: filter === 'student' }]" @click="filter = 'student'; loadFollowers()">นักเรียน</button>
          <button :class="['filter-btn', { active: filter === 'tag:interested' }]" @click="filter = 'tag:interested'; loadFollowers()" style="color:#f97316">Dealing</button>
          <button :class="['filter-btn', { active: filter === 'tag:trial' }]" @click="filter = 'tag:trial'; loadFollowers()" style="color:#8b5cf6">ทดลอง</button>
          <span style="color:#cbd5e1;font-size:12px">|</span>
          <button :class="['filter-btn', { active: filter === 'seg:nl-new70' }]" @click="filter = 'seg:nl-new70'; loadFollowers()" style="color:#0d9488;font-size:11px">NL ใหม่70</button>
          <button :class="['filter-btn', { active: filter === 'seg:nl2' }]" @click="filter = 'seg:nl2'; loadFollowers()" style="color:#2563eb;font-size:11px">เหลือNL2</button>
          <button :class="['filter-btn', { active: filter === 'seg:meq' }]" @click="filter = 'seg:meq'; loadFollowers()" style="color:#dc2626;font-size:11px">เตรียมMEQ</button>
          <button :class="['filter-btn', { active: filter === 'seg:osce' }]" @click="filter = 'seg:osce'; loadFollowers()" style="color:#7c3aed;font-size:11px">เตรียมOSCE</button>
        </div>
        <input v-model="search" class="form-control search-input" placeholder="ค้นหาชื่อ, อีเมล, มหาลัย..." @input="debounceSearch" />
      </div>

      <!-- Followers Table -->
      <div class="table-wrapper">
        <div v-if="loading" style="text-align:center;padding:40px;color:#94a3b8">กำลังโหลด...</div>
        <table v-else class="ftable">
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th style="width:40px"></th>
              <th>ชื่อ LINE</th>
              <th>UUID</th>
              <th>นักเรียน</th>
              <th>Follow</th>
              <th>ข้อความล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!followers.length"><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px">ไม่มีข้อมูล</td></tr>
            <tr v-for="f in followers" :key="f.lineUserId" :class="{ selected: selectedIds.includes(f.lineUserId) }">
              <td><input type="checkbox" :checked="selectedIds.includes(f.lineUserId)" @change="toggleSelect(f.lineUserId)" /></td>
              <td>
                <img v-if="f.pictureUrl" :src="f.pictureUrl" class="avatar" />
                <div v-else class="avatar avatar-placeholder">{{ (f.displayName || '?')[0] }}</div>
              </td>
              <td>
                <div class="name-cell">
                  <span class="line-name">{{ f.displayName || '-' }}</span>
                  <span v-if="!f.isFollowing" class="badge badge-gray">Unfollow</span>
                  <span v-if="f.tag && f.tag !== 'new'" class="badge" :style="{ background: tagColor(f.tag), color: '#fff', fontSize: '10px' }">{{ tagLabel(f.tag) }}</span>
                </div>
              </td>
              <td>
                <span class="uuid-text" @click="copyUuid(f.lineUserId)" title="คลิกเพื่อ copy">{{ f.lineUserId.slice(0, 10) }}...</span>
              </td>
              <td>
                <template v-if="f.isStudent">
                  <span class="badge badge-blue">นักเรียน</span>
                  <div class="student-info">{{ f.studentName }}</div>
                  <div class="student-meta">{{ f.studentEmail }}</div>
                  <div v-if="f.university" class="student-meta">{{ f.university }}</div>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span v-if="f.followedAt" class="text-sm">{{ formatDate(f.followedAt) }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <div v-if="f.lastMessageText" class="msg-preview">{{ f.lastMessageText }}</div>
                <div v-if="f.lastMessageAt" class="text-muted text-xs">{{ formatDate(f.lastMessageAt) }}</div>
                <span v-if="!f.lastMessageText" class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ย้าย Payment + Activate ไปอยู่เหนือตารางแล้ว -->

      </div><!-- end tab followers -->

      <!-- ═══ TAB: AI Chat ═══ -->
      <div v-show="activeTab === 'chat'" class="chat-tab">
        <div class="chat-layout">
          <!-- Left: follower list -->
          <div class="chat-sidebar">
            <input v-model="chatSearch" class="form-control" placeholder="ค้นหา..." style="margin-bottom:8px;font-size:12px" @input="debounceChatSearch" />
            <div class="chat-list">
              <div v-for="f in chatFollowers" :key="f.lineUserId"
                class="chat-item" :class="{ active: chatUserId === f.lineUserId, escalated: f.hasEscalation }"
                @click="openChat(f)">
                <img v-if="f.pictureUrl" :src="f.pictureUrl" class="avatar-sm" />
                <div v-else class="avatar-sm avatar-placeholder">{{ (f.displayName || '?')[0] }}</div>
                <div class="chat-item-info">
                  <div class="chat-item-name">
                    {{ f.displayName || '-' }}
                    <span v-if="f.hasEscalation" class="badge-dot red"></span>
                  </div>
                  <div class="chat-item-msg">{{ f.lastMessageText || '' }}</div>
                </div>
                <div class="chat-item-mode">
                  <span :class="['mode-badge', f.aiMode === 'ai' ? 'mode-ai' : 'mode-human']">
                    {{ f.aiMode === 'ai' ? 'AI' : 'HUMAN' }}
                  </span>
                </div>
              </div>
              <div v-if="!chatFollowers.length" class="text-muted" style="text-align:center;padding:20px;font-size:12px">ไม่มีข้อมูล</div>
            </div>
          </div>

          <!-- Right: chat window -->
          <div class="chat-main">
            <div v-if="!chatUserId" class="chat-empty">เลือก follower จากรายการด้านซ้ายเพื่อดูแชท</div>
            <template v-else>
              <!-- Header -->
              <div class="chat-header">
                <strong>{{ chatFollowerName }}</strong>
                <div class="chat-header-actions">
                  <button class="btn btn-sm" :class="chatFollowerMode === 'ai' ? 'btn-ai' : 'btn-human'"
                    @click="toggleChatAI">
                    {{ chatFollowerMode === 'ai' ? 'AI' : 'HUMAN' }}
                  </button>
                  <button v-if="chatFollowerPaused" class="btn btn-sm btn-resume" @click="resumeAI">
                    คืนให้ AI
                  </button>
                  <span v-if="chatFollowerPaused" class="paused-badge">PAUSED</span>
                </div>
              </div>

              <!-- Admin Notes — AI เห็นข้อมูลนี้ด้วย -->
              <div class="chat-note-bar">
                <div class="note-section positive-section">
                  <div class="note-label note-positive">✅ ควรเน้น / ทำ</div>
                  <input v-model="chatPositiveNote" class="form-control note-input"
                    placeholder="เช่น สนใจผ่อน, เคยดู demo ชอบ, ถามเรื่อง NL2"
                    @blur="saveAdminNote" />
                </div>
                <div class="note-section negative-section">
                  <div class="note-label note-negative">❌ ห้ามพูด / หลีกเลี่ยง</div>
                  <input v-model="chatNegativeNote" class="form-control note-input"
                    placeholder="เช่น ห้ามพูดเรื่องราคาเดิม, อย่ากดดัน, เคย complaint"
                    @blur="saveAdminNote" />
                </div>
                <div class="note-section general-section">
                  <div class="note-label note-general">📝 บันทึกอื่นๆ</div>
                  <input v-model="chatAdminNote" class="form-control note-input"
                    placeholder="เช่น VIP ดูแลพิเศษ, นักเรียนเก่า"
                    @blur="saveAdminNote" />
                </div>
              </div>

              <!-- Messages -->
              <div class="chat-messages" ref="chatMessages">
                <div v-for="msg in chatMessages" :key="msg._id"
                  :class="['chat-bubble', 'chat-' + msg.role]">
                  <div class="chat-role-label">{{ msg.role === 'user' ? 'ลูกค้า' : msg.role === 'admin' ? 'Admin' : 'AI' }}</div>
                  <div class="chat-text">{{ msg.text }}</div>
                  <div v-if="msg.flexTemplate" class="chat-meta">[Flex: {{ msg.flexTemplate }}]</div>
                  <div v-if="msg.toolCalls && msg.toolCalls.length" class="chat-meta">[Tools: {{ msg.toolCalls.map(t => t.name).join(', ') }}]</div>
                  <div v-if="msg.isEscalated" class="chat-escalated-label">Escalated</div>
                  <div class="chat-time">{{ formatDate(msg.createdAt) }}</div>
                </div>
                <div v-if="!chatMessages.length" class="text-muted" style="text-align:center;padding:40px;font-size:12px">ยังไม่มีข้อความ</div>
              </div>

              <!-- Reply input -->
              <div class="chat-input-row">
                <input v-model="adminReplyText" class="form-control" placeholder="พิมพ์ข้อความตอบ..." style="flex:1" @keydown.enter="sendAdminReply" />
                <button class="btn btn-primary" @click="sendAdminReply" :disabled="!adminReplyText.trim() || adminReplying" style="flex-shrink:0">
                  {{ adminReplying ? '...' : 'ส่ง' }}
                </button>
              </div>
            </template>
          </div>
        </div>
        <!-- ═══ AI Config (รวมใน tab เดียวกัน) ═══ -->
        <details style="margin-top:20px">
          <summary style="cursor:pointer;font-size:15px;font-weight:700;color:#7c3aed;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
            ⚙️ AI Config
            <span style="font-size:12px;color:#94a3b8;font-weight:400;margin-left:8px">ข้อมูลคอร์ส · Tools · โปรโมชัน</span>
          </summary>
          <div class="send-section" style="margin-top:12px">
            <!-- On/Off -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
              <label class="check-label" :class="{ active: aiConfig.enabled }" style="font-size:15px">
                <input type="checkbox" v-model="aiConfig.enabled" />
                <span>{{ aiConfig.enabled ? '🟢 AI เปิดอยู่' : '🔴 AI ปิดทั้งระบบ' }}</span>
              </label>
            </div>

            <!-- 1. ข้อมูลคอร์ส (ดึงจาก DB) -->
            <div class="form-group">
              <label style="color:#3b82f6;font-weight:700;font-size:14px">📚 ข้อมูลคอร์ส</label>
              <p style="font-size:11px;color:#94a3b8;margin:4px 0 8px">AI ใช้ข้อมูลนี้ตอบลูกค้า — กรอกรายละเอียด จุดเด่น ราคา ชั่วโมง แต่ละคอร์ส</p>
              <div v-if="!aiPackages.length" style="color:#94a3b8;font-size:12px">กำลังโหลด...</div>
              <div v-for="pkg in aiPackages" :key="pkg._id" style="margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden" :style="{ opacity: pkg.aiEnabled === false ? 0.5 : 1 }">
                <div style="padding:10px 14px;background:#f8fafc;display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e8f0">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0">
                    <input type="checkbox" v-model="pkg.aiEnabled" style="accent-color:#16a34a" />
                    <span style="font-weight:700;font-size:13px;color:#0f172a">{{ pkg.title }}</span>
                  </label>
                  <span v-if="pkg.aiEnabled !== false" style="font-size:10px;color:#16a34a;font-weight:600">AI เห็น</span>
                  <span v-else style="font-size:10px;color:#dc2626;font-weight:600">AI ไม่เห็น</span>
                </div>
                <div v-if="pkg.aiEnabled !== false" style="padding:10px 14px">
                  <textarea v-model="pkg.aiInfo" class="form-control" rows="3" :placeholder="'รายละเอียด จุดเด่น ราคา ชั่วโมง ของ ' + pkg.title" maxlength="1000" style="font-size:12px;line-height:1.6"></textarea>
                </div>
              </div>
              <button v-if="aiPackages.length" class="btn" style="background:#3b82f6;color:#fff;font-size:12px" @click="saveAiPackages" :disabled="aiPackagesSaving">
                {{ aiPackagesSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลคอร์ส' }}
              </button>
            </div>

            <!-- 2. โปรโมชัน -->
            <div class="form-group">
              <label style="color:#f59e0b;font-weight:700;font-size:14px">🔥 โปรโมชัน / ข่าวสาร</label>
              <p style="font-size:11px;color:#94a3b8;margin:4px 0 8px">โปรที่กำลังมีอยู่ตอนนี้ — AI จะไม่พูดถึงโปรที่ไม่ได้ใส่ไว้</p>
              <textarea v-model="aiConfig.courseInfo" class="form-control" rows="3" placeholder="เช่น Early Bird ลด 5,000 บาท ถึงสิ้นเดือนนี้" maxlength="2000" style="font-size:12px"></textarea>
            </div>

            <!-- 3. เทคนิคการขาย -->
            <div class="form-group">
              <label style="color:#7c3aed;font-weight:700;font-size:14px">💬 เทคนิคการตอบ</label>
              <p style="font-size:11px;color:#94a3b8;margin:4px 0 8px">สไตล์เฉพาะที่อยากให้ AI ทำ/ไม่ทำ</p>
              <textarea v-model="aiConfig.salesTechniques" class="form-control" rows="4" placeholder="เช่น&#10;- ถ้าลูกค้าลังเล เสนอทดลองฟรีก่อน&#10;- ไม่กดดัน ไม่เร่งให้ซื้อ&#10;- ถ้าถามเรื่องคู่แข่ง ไม่ดิสเครดิต" maxlength="3000" style="font-size:12px;line-height:1.6"></textarea>
            </div>

            <!-- 4. Flex Tools -->
            <div class="form-group">
              <label style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px;display:block">🛠️ Flex Tools — เปิด/ปิด</label>
              <div class="tools-list">
                <div v-for="(tool, i) in aiConfig.tools" :key="tool.name" class="tool-row" :class="{ disabled: !tool.enabled }">
                  <label class="tool-toggle">
                    <input type="checkbox" v-model="tool.enabled" />
                    <span class="tool-name">{{ tool.label || tool.name }}</span>
                  </label>
                  <input v-model="tool.instruction" class="form-control tool-instruction" :placeholder="'กฎการใช้ เช่น ส่งเมื่อ...'" :disabled="!tool.enabled" />
                </div>
              </div>
            </div>

            <div class="send-actions">
              <button class="btn btn-primary" @click="saveAIConfig" :disabled="configSaving" style="background:#7c3aed">
                {{ configSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>

            <div v-if="aiConfig.updatedAt" class="text-xs text-muted" style="margin-top:8px">
              แก้ไขล่าสุด: {{ formatDate(aiConfig.updatedAt) }} โดย {{ aiConfig.updatedBy || '-' }}
            </div>
          </div>
        </details>
      </div><!-- end tab chat -->

      <!-- ═══ TAB: Daily Quiz ═══ -->
      <div v-show="activeTab === 'quiz'">
        <div class="send-section">
          <h2 style="margin:0 0 16px">🧠 Daily Quiz</h2>

          <div class="form-group">
            <label>หัวข้อ</label>
            <input v-model="quizFields.topic" class="form-control" placeholder="เช่น Surgery, Internal Medicine" />
          </div>
          <div class="form-group">
            <label>คำถาม</label>
            <textarea v-model="quizFields.question" class="form-control" rows="5" placeholder="วางโจทย์ clinical scenario ได้ยาวๆ" maxlength="1000"></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group">
              <label>A</label>
              <input v-model="quizFields.optionA" class="form-control" placeholder="ตัวเลือก A" />
            </div>
            <div class="form-group">
              <label>B</label>
              <input v-model="quizFields.optionB" class="form-control" placeholder="ตัวเลือก B" />
            </div>
            <div class="form-group">
              <label>C</label>
              <input v-model="quizFields.optionC" class="form-control" placeholder="ตัวเลือก C" />
            </div>
            <div class="form-group">
              <label>D</label>
              <input v-model="quizFields.optionD" class="form-control" placeholder="ตัวเลือก D" />
            </div>
          </div>
          <div class="form-group">
            <label style="font-weight:700">ข้อที่ถูก</label>
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <label v-for="opt in ['A','B','C','D']" :key="opt" class="radio-label" :class="{ active: quizCorrectAnswer === opt }" style="padding:6px 16px;font-weight:700">
                <input type="radio" v-model="quizCorrectAnswer" :value="opt" />
                <span>{{ opt }}</span>
              </label>
              <span v-if="quizCorrectAnswer && quizFields['option' + quizCorrectAnswer]" style="font-size:12px;color:#16a34a;font-weight:600;align-self:center">
                ✓ {{ quizFields['option' + quizCorrectAnswer] }}
              </span>
            </div>
          </div>
          <div class="form-group">
            <label>เฉลย / เหตุผล</label>
            <textarea v-model="quizReason" class="form-control" rows="4" placeholder="อธิบายว่าทำไมข้อนี้ถูก เช่น เพราะ classic triad..." maxlength="500"></textarea>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn" style="background:#f59e0b;color:#fff;font-size:12px" @click="sendQuizAdmin" :disabled="quizSending || !quizCorrectAnswer || !quizFields.question">Admin ดูก่อน (เติ้ล, แตม, ฝน)</button>
            <button class="btn" style="background:#16a34a;color:#fff;font-size:12px" @click="sendQuizPushAll" :disabled="quizSending || !quizCorrectAnswer || !quizFields.question">Push All (ฟรี)</button>
            <button class="btn" style="background:#dc2626;color:#fff;font-size:12px" @click="sendQuizBroadcast" :disabled="quizSending || !quizCorrectAnswer || !quizFields.question">Broadcast (quota)</button>
            <span v-if="!quizCorrectAnswer || !quizFields.question" style="font-size:11px;color:#94a3b8">กรอกคำถาม + เลือกข้อถูกก่อน</span>
          </div>
          <div v-if="successMsg" style="font-size:12px;color:#16a34a;margin-top:8px">✓ {{ successMsg }}</div>
        </div>
      </div>

      <!-- ═══ TAB: Survey ═══ -->
      <div v-show="activeTab === 'survey'">
        <div class="send-section">
          <h2 style="margin:0 0 16px">📋 แบบสอบถาม</h2>

          <div class="form-group">
            <label>หัวข้อ</label>
            <input v-model="surveyFields.title" class="form-control" placeholder="เช่น สำรวจความพึงพอใจ" />
          </div>
          <div class="form-group">
            <label>คำถาม</label>
            <textarea v-model="surveyFields.question" class="form-control" rows="4" placeholder="คำถามที่ต้องการถาม" maxlength="500"></textarea>
          </div>

          <div class="form-group">
            <label style="font-weight:700">ตัวเลือก</label>
            <div v-for="(opt, idx) in surveyOptions" :key="idx" style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
              <span style="font-size:12px;font-weight:700;color:#7c3aed;min-width:20px">{{ idx + 1 }}.</span>
              <input v-model="surveyOptions[idx]" class="form-control" :placeholder="'ตัวเลือกที่ ' + (idx + 1)" style="flex:1" />
              <button v-if="surveyOptions.length > 2" class="btn" style="padding:4px 8px;font-size:12px;background:#fee2e2;color:#dc2626;border:none;border-radius:6px" @click="surveyOptions.splice(idx, 1)">&times;</button>
            </div>
            <button v-if="surveyOptions.length < 8" class="btn" style="font-size:11px;background:#f0f0ff;color:#7c3aed;border:1px dashed #7c3aed;border-radius:6px;padding:4px 12px;margin-top:4px" @click="surveyOptions.push('')">+ เพิ่มตัวเลือก</button>
          </div>

          <div class="form-group">
            <label>ข้อความขอบคุณ <span style="font-size:11px;color:#94a3b8">(แสดงหลังกดตอบ)</span></label>
            <input v-model="surveyFields.thankText" class="form-control" placeholder="ขอบคุณที่ตอบแบบสอบถาม" />
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn" style="background:#7c3aed;color:#fff;font-size:12px" @click="sendSurveyAdmin" :disabled="surveySending || !surveyFields.question || surveyValidOptions.length < 2">Admin ดูก่อน</button>
            <button class="btn" style="background:#16a34a;color:#fff;font-size:12px" @click="sendSurveyPushAll" :disabled="surveySending || !surveyFields.question || surveyValidOptions.length < 2">Push All (ฟรี)</button>
            <button class="btn" style="background:#dc2626;color:#fff;font-size:12px" @click="sendSurveyBroadcast" :disabled="surveySending || !surveyFields.question || surveyValidOptions.length < 2">Broadcast (quota)</button>
            <span v-if="!surveyFields.question || surveyValidOptions.length < 2" style="font-size:11px;color:#94a3b8">กรอกคำถาม + ตัวเลือกอย่างน้อย 2 ข้อ</span>
          </div>
        </div>
      </div>




    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'AdminLine',
  data() {
    return {
      followers: [],
      stats: {},
      templates: [],
      loading: false,
      error: null,
      successMsg: '',
      search: '',
      filter: 'all',
      selectedIds: [],
      selectedTemplate: '',
      currentFields: [],
      fieldValues: {},
      sendMode: 'selected',
      sending: false,
      previewing: false,
      previewJson: null,
      _searchTimer: null,
      // Course Flex
      courseFlexMode: 'selected',
      courseSending: false,
      courseFlexMsg: '',
      // Payment
      payForm: { courseName: '', amount: '', transfer: true, card: true, installment: 0 },
      paymentSending: false,
      broadcasting: false,
      // AI Chat Tab
      activeTab: 'funnel',
      // Funnel
      funnelColumns: [
        { tag: 'incoming', label: 'Incoming', shortLabel: 'Incoming', color: '#0ea5e9' },
        { tag: 'new', label: 'เงียบ', shortLabel: 'เงียบ', color: '#6b7280' },
        { tag: 'inquired', label: 'มี Activity', shortLabel: 'Activity', color: '#3b82f6' },
        { tag: 'interested', label: 'DEALING', shortLabel: 'Dealing', color: '#f97316' },
        { tag: 'trial', label: 'ทดลองเรียน', shortLabel: 'ทดลอง', color: '#8b5cf6' },
        { tag: 'student', label: 'นักเรียน', shortLabel: 'นักเรียน', color: '#16a34a' }
      ],
      funnelData: { incoming: [], new: [], inquired: [], interested: [], trial: [], student: [], admin: [], unfollow: [] },
      funnelAllFollowers: [],
      funnelSearch: '',
      funnelEditTarget: null,
      funnelChatTarget: null,
      funnelChatMessages: [],
      funnelChatReply: '',
      funnelChatLoading: false,
      funnelChatSending: false,
      funnelSendTarget: null,
      funnelSending: false,
      funnelSendMsg: '',
      funnelSendMode: 'person',
      funnelEditExams: [],
      funnelEditSegments: [],
      funnelEditFamilyUids: [],
      segmentStats: {},
      scanningSegments: false,
      aiPackages: [],
      aiPackagesSaving: false,
      familySearch: '',
      chatSearch: '',
      chatFollowers: [],
      chatUserId: null,
      chatFollowerName: '',
      chatFollowerMode: 'human',
      chatFollowerPaused: false,
      chatAdminNote: '',
      chatPositiveNote: '',
      chatNegativeNote: '',
      chatMessages: [],
      adminReplyText: '',
      adminReplying: false,
      escalationCount: 0,
      _chatSearchTimer: null,
      _chatRefreshTimer: null,
      quickSendMode: '',
      quickSelectedFlex: '',
      broadcastCount: 0,
      quizFields: { topic: '', question: '', optionA: '', optionB: '', optionC: '', optionD: '' },
      quizCorrectAnswer: '',
      quizReason: '',
      quizSending: false,
      surveyFields: { title: '', question: '', thankText: '' },
      surveyOptions: ['', '', ''],
      surveySending: false,
      // Activate
      activateForm: { isNew: true, courses: [], customCourse: '', systems: ['NLEX'], note: '' },
      activateCourseOptions: ['PRE-CLINIC', 'NL MASTERY (Full)', 'NL MASTERY (Part 1)', 'NL MASTERY (Part 2)', 'NL2 (Full)', 'NL2 (Part A)', 'NL2 (Part B)', 'MEQ Intensive', 'OSCE'],
      activateSystemOptions: ['SYNAPSE', 'NLEX', 'MEQEX', 'DDx', 'ATLAS', 'OSCE'],
      activateSending: false,
      // AI Config Tab
      aiConfig: { systemPrompt: '', temperature: 0.7, maxTokens: 500, courseInfo: '', courseDetails: '', salesTechniques: '', enabled: true, tools: [], paymentOptions: [], updatedAt: null, updatedBy: '' },
      configSaving: false
    }
  },
  computed: {
    funnelFlexOptions() {
      return [
        { id: 'trial', label: 'ทดลองเรียนฟรี', icon: '🎁', color: '#16a34a' },
        { id: 'howto', label: 'วิธีเข้าเรียน', icon: '📖', color: '#0891b2' },
        { id: 'nl', label: 'NL MASTERY', icon: '📚', color: '#1e40af' },
        { id: 'nl2', label: 'NL2', icon: '📚', color: '#1e3a5f' },
        { id: 'preclinic', label: 'PRE-CLINIC', icon: '🧬', color: '#059669' },
        { id: 'meq', label: 'MEQ', icon: '📝', color: '#b45309' },
        { id: 'osce', label: 'OSCE', icon: '🩺', color: '#7c3aed' }
      ]
    },
    surveyValidOptions() {
      return this.surveyOptions.filter(o => o.trim())
    },
    allSelected() {
      return this.followers.length > 0 && this.followers.every(f => this.selectedIds.includes(f.lineUserId))
    },
    selectedCount() {
      return this.selectedIds.length
    },
    funnelStudentList() {
      return this.funnelAllFollowers.filter(f => f.isStudent && f.studentName)
    },
    funnelFamilyCount() {
      // นับผปค. ในแต่ละ tag
      const result = {}
      for (const tag of Object.keys(this.funnelData)) {
        let count = 0
        for (const g of (this.funnelGroups[tag] || [])) count += g.family.length
        if (count) result[tag] = count
      }
      return result
    },
    funnelStudentCount() {
      return this.funnelAllFollowers.filter(f => f.isStudent).length
    },
    funnelParentCount() {
      // นับ unique ผปค. (ไม่ซ้ำ)
      const uids = new Set()
      for (const f of this.funnelAllFollowers) {
        if (f.familyUids) for (const uid of f.familyUids) uids.add(uid)
      }
      return uids.size
    },
    funnelNonStudentList() {
      const q = (this.familySearch || '').toLowerCase()
      return this.funnelAllFollowers.filter(f => {
        if (f.isStudent) return false
        if (!q) return true
        return (f.displayName || '').toLowerCase().includes(q) || (f.nickname || '').toLowerCase().includes(q)
      })
    },
    funnelGroups() {
      // นักเรียนเป็นหลัก → ดึงผปค. จาก familyUids
      const allMap = {}
      for (const f of this.funnelAllFollowers) allMap[f.lineUserId] = f

      // หา familyUids ที่ถูก link → ซ่อนเฉพาะคนที่ไม่ใช่นักเรียน (ผปค.)
      const familyHidden = new Set()
      for (const f of this.funnelAllFollowers) {
        if (f.familyUids && f.familyUids.length) {
          for (const uid of f.familyUids) {
            const linked = allMap[uid]
            if (linked && !linked.isStudent) familyHidden.add(uid)
          }
        }
      }

      const q = (this.funnelSearch || '').toLowerCase()
      const result = {}
      for (const tag of Object.keys(this.funnelData)) {
        const items = this.funnelData[tag] || []
        const groups = []
        for (const f of items) {
          if (familyHidden.has(f.lineUserId)) continue
          // search filter
          if (q) {
            const match = [f.displayName, f.nickname, f.studentName, f.studentEmail, f.university, f.lastMessageText]
              .some(v => v && v.toLowerCase().includes(q))
            if (!match) continue
          }
          const family = (f.familyUids || []).map(uid => allMap[uid]).filter(Boolean)
          groups.push({ main: f, family })
        }
        // sort ล่าสุดอยู่บน
        groups.sort((a, b) => {
          const aT = new Date(a.main.lastMessageAt || a.main.followedAt || 0).getTime()
          const bT = new Date(b.main.lastMessageAt || b.main.followedAt || 0).getTime()
          return bT - aT
        })
        result[tag] = groups
      }
      return result
    },
    quickSendSummary() {
      const flexNames = { preclinic: 'PRE-CLINIC', nl: 'NL MASTERY', nl2: 'NL2', meq: 'MEQ', osce: 'OSCE', register: 'สมัครเรียน', trial: 'ทดลองเรียน', howto: 'วิธีเข้าเรียน', pair: 'ทดลอง + How-to' }
      const modeNames = { admin: 'Admin ดูก่อน', selected: `${this.selectedIds.length} คนที่เลือก`, pushall: `Push All ${this.stats.total || 0} คน`, broadcast: `Broadcast ${this.broadcastCount} คน` }
      return `ส่ง "${flexNames[this.quickSelectedFlex] || '?'}" → ${modeNames[this.quickSendMode] || '?'}`
    }
  },
  async mounted() {
    await Promise.all([this.loadFollowers(), this.loadTemplates(), this.loadEscalationCount(), this.loadFunnel(), this.loadSegmentStats()])
    // Load broadcast follower count from LINE API
    try { const s = await api.get('/admin/line/stats'); this.broadcastCount = s.followers || s.targetedReaches || 0 } catch {}
  },
  beforeUnmount() {
    if (this._chatRefreshTimer) clearInterval(this._chatRefreshTimer)
  },
  methods: {
    async loadFollowers() {
      this.loading = true
      try {
        const d = await api.get('/admin/line/followers', { params: { search: this.search, filter: this.filter } })
        this.followers = d.followers || []
        this.stats = d.stats || {}
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดล้มเหลว'
      } finally { this.loading = false }
    },
    async loadFunnel() {
      try {
        const d = await api.get('/admin/line/followers', { params: { filter: 'all' } })
        const all = d.followers || []
        this.funnelAllFollowers = all
        const grouped = { incoming: [], new: [], inquired: [], interested: [], trial: [], student: [], admin: [], unfollow: [] }
        for (const f of all) {
          // นักเรียนที่มีคอร์สจริง → อยู่ "นักเรียน" เสมอ แม้ unfollow
          const hasRealCourse = f.courses && f.courses.length && f.courses[0] !== 'กำลังทดลอง'
          if (hasRealCourse) { grouped.student.push(f); continue }
          if (!f.isFollowing) { grouped.unfollow.push(f); continue }
          if (f.tag === 'admin' || f.tag === 'staff') {
            grouped.admin.push(f); continue
          }
          const tag = f.tag || 'incoming'
          if (tag === 'new' && !f.lastMessageText) { grouped.new.push(f) }
          else if (grouped[tag]) { grouped[tag].push(f) }
          else { grouped.incoming.push(f) }
        }
        this.funnelData = grouped
      } catch (err) {
        this.error = 'โหลด Funnel ล้มเหลว'
      }
    },
    async changeTag(lineUserId, newTag, currentTag) {
      // ป้องกันลดขั้นจาก student
      if (currentTag === 'student' && newTag !== 'student') {
        const code = prompt('นักเรียนห้ามลดขั้น — พิมพ์ CONFIRM เพื่อยืนยัน:')
        if (code !== 'CONFIRM') { this.loadFunnel(); return }
        try {
          await api.patch(`/admin/line/followers/${lineUserId}/tag`, { tag: newTag, confirmCode: 'CONFIRM' })
        } catch (err) { this.error = 'เปลี่ยน tag ล้มเหลว' }
        this.loadFunnel()
        return
      }
      try {
        await api.patch(`/admin/line/followers/${lineUserId}/tag`, { tag: newTag })
        // ย้ายผปค. พร้อมกัน (familyUids ตั้งที่นักเรียน)
        const main = this.funnelAllFollowers.find(f => f.lineUserId === lineUserId)
        const parents = (main?.familyUids || []).map(uid => this.funnelAllFollowers.find(f => f.lineUserId === uid)).filter(Boolean)
        for (const p of parents) {
          await api.patch(`/admin/line/followers/${p.lineUserId}/tag`, { tag: newTag }).catch(() => {})
        }
        this.loadFunnel()
      } catch (err) {
        this.error = 'เปลี่ยน tag ล้มเหลว'
        this.loadFunnel()
      }
    },
    buildQuizAnswer() {
      // สร้าง answer string: "B. ตัวเลือก — เหตุผล"
      const opt = this.quizFields['option' + this.quizCorrectAnswer] || ''
      return `${this.quizCorrectAnswer}. ${opt}${this.quizReason ? ' — ' + this.quizReason : ''}`
    },
    quizPayload() {
      return { template: 'quiz', fields: { ...this.quizFields, answer: this.buildQuizAnswer() } }
    },
    async sendQuizAdmin() {
      this.quizSending = true
      try {
        const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef']
        await api.post('/admin/line/send', { ...this.quizPayload(), userIds: adminUids })
        this.successMsg = 'ส่ง Quiz ให้ Admin แล้ว — เช็ค LINE'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.quizSending = false }
    },
    async sendQuiz() {
      const target = this.sendMode === 'broadcast' ? `ทุกคน (${this.stats.following} คน)` : `${this.selectedIds.length} คน`
      if (!confirm(`ส่ง Daily Quiz ให้ ${target}?`)) return
      this.quizSending = true
      try {
        if (this.sendMode === 'broadcast') {
          await api.post('/admin/line/broadcast', this.quizPayload())
        } else {
          await api.post('/admin/line/send', { ...this.quizPayload(), userIds: this.selectedIds })
        }
        this.successMsg = `ส่ง Quiz → ${target} สำเร็จ`
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.quizSending = false }
    },
    async sendQuizPushAll() {
      if (!confirm('Push Quiz ให้ทุกคนที่รู้ UUID (ฟรี)?')) return
      this.quizSending = true
      try {
        await api.post('/admin/line/push-all', this.quizPayload())
        this.successMsg = 'Push Quiz สำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.quizSending = false }
    },
    async sendQuizBroadcast() {
      if (!confirm('Broadcast Quiz ให้ทุกคน (เสีย quota)?')) return
      this.quizSending = true
      try {
        await api.post('/admin/line/broadcast-all', this.quizPayload())
        this.successMsg = 'Broadcast Quiz สำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.quizSending = false }
    },
    // ─── Survey ───
    surveyPayload() {
      return { template: 'survey', fields: { ...this.surveyFields, options: this.surveyOptions.filter(o => o.trim()) } }
    },
    async sendSurveyAdmin() {
      this.surveySending = true
      try {
        const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef']
        await api.post('/admin/line/send', { ...this.surveyPayload(), userIds: adminUids })
        this.successMsg = 'ส่งแบบสอบถามให้ Admin แล้ว — เช็ค LINE'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.surveySending = false }
    },
    async sendSurveyPushAll() {
      if (!confirm('Push แบบสอบถามให้ทุกคน?')) return
      this.surveySending = true
      try {
        await api.post('/admin/line/push-all', this.surveyPayload())
        this.successMsg = 'Push แบบสอบถามสำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.surveySending = false }
    },
    async sendSurveyBroadcast() {
      if (!confirm('Broadcast แบบสอบถามให้ทุกคน (เสีย quota)?')) return
      this.surveySending = true
      try {
        await api.post('/admin/line/broadcast-all', this.surveyPayload())
        this.successMsg = 'Broadcast แบบสอบถามสำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.surveySending = false }
    },
    activateCourseList() {
      const list = [...this.activateForm.courses]
      if (this.activateForm.customCourse.trim()) list.push(this.activateForm.customCourse.trim())
      return list
    },
    async sendActivatePreview() {
      this.activateSending = true
      try {
        const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef']
        for (const uid of adminUids) {
          await api.post('/admin/line/send-activate', {
            userId: uid,
            courses: this.activateCourseList(),
            systems: this.activateForm.systems,
            note: this.activateForm.note,
            isNew: this.activateForm.isNew
          }).catch(() => {})
        }
        this.successMsg = 'ส่ง preview ให้ Admin แล้ว — เช็ค LINE'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.activateSending = false }
    },
    async sendActivate() {
      const f = this.getSelectedFollower()
      if (!confirm(`ส่ง Flex เปิดระบบให้ ${f?.displayName || f?.studentName}?`)) return
      this.activateSending = true
      try {
        await api.post('/admin/line/send-activate', {
          userId: this.selectedIds[0],
          courses: this.activateCourseList(),
          systems: this.activateForm.systems,
          note: this.activateForm.note,
          isNew: this.activateForm.isNew
        })
        this.successMsg = 'ส่ง Flex เปิดระบบสำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.activateSending = false }
    },
    scrollToQuiz() {
      this.$nextTick(() => {
        const el = document.querySelector('.template-picker')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    scrollToPayment() {
      this.$nextTick(() => {
        const el = document.querySelector('.payment-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    // ─── Funnel Chat ───
    async openFunnelChat(f) {
      this.funnelChatTarget = f
      this.funnelChatMessages = []
      this.funnelChatReply = ''
      this.funnelChatLoading = true
      try {
        const d = await api.get(`/admin/line/chat/${f.lineUserId}`)
        this.funnelChatMessages = d.messages || []
        this.$nextTick(() => {
          const el = this.$refs.funnelChatMessages
          if (el) el.scrollTop = el.scrollHeight
        })
      } catch { }
      finally { this.funnelChatLoading = false }
    },
    closeFunnelChat() {
      this.funnelChatTarget = null
      this.funnelChatMessages = []
    },
    async sendFunnelChatReply() {
      if (!this.funnelChatReply.trim() || !this.funnelChatTarget) return
      this.funnelChatSending = true
      try {
        await api.post(`/admin/line/chat/${this.funnelChatTarget.lineUserId}/reply`, { text: this.funnelChatReply.trim() })
        this.funnelChatMessages.push({ _id: Date.now(), role: 'admin', text: this.funnelChatReply.trim(), createdAt: new Date().toISOString() })
        this.funnelChatReply = ''
        this.$nextTick(() => {
          const el = this.$refs.funnelChatMessages
          if (el) el.scrollTop = el.scrollHeight
        })
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.funnelChatSending = false }
    },
    // ─── Funnel Send Flex ───
    openFunnelSend(f) {
      this.funnelSendTarget = f
      this.funnelSendMsg = ''
      this.funnelSendMode = 'person'
    },
    async sendFunnelFlex(templateId) {
      if (!this.funnelSendTarget || this.funnelSending) return
      this.funnelSending = true
      this.funnelSendMsg = ''
      try {
        const adminUids = ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef']
        const uids = this.funnelSendMode === 'admin' ? adminUids : [this.funnelSendTarget.lineUserId]
        const courseTemplates = ['nl', 'nl2', 'meq', 'osce', 'preclinic', 'ddx']
        if (courseTemplates.includes(templateId)) {
          await api.post('/admin/line/send-course-flex', { course: templateId, mode: 'selected', userIds: uids })
        } else {
          await api.post('/admin/line/send', { template: templateId, fields: {}, userIds: uids })
        }
        this.funnelSendMsg = this.funnelSendMode === 'admin' ? 'ส่ง Admin แล้ว!' : 'ส่งสำเร็จ!'
        setTimeout(() => { this.funnelSendMsg = '' }, 3000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.funnelSending = false }
    },
    openFunnelEdit(f) {
      this.funnelEditTarget = { ...f }
      this.funnelEditExams = [...(f.passedExams || [])]
      this.funnelEditSegments = [...(f.segment || [])]
      this.funnelEditFamilyUids = [...(f.familyUids || [])]
    },
    async saveFunnelEdit() {
      if (!this.funnelEditTarget) return
      try {
        await api.patch(`/admin/line/followers/${this.funnelEditTarget.lineUserId}/extra`, {
          nickname: this.funnelEditTarget.nickname,
          passedExams: this.funnelEditExams,
          segment: this.funnelEditSegments,
          familyUids: this.funnelEditFamilyUids
        })
        this.funnelEditTarget = null
        this.loadFunnel()
      } catch (err) { this.error = 'บันทึกล้มเหลว' }
    },
    tagColor(tag) {
      return { new: '#6b7280', inquired: '#3b82f6', interested: '#f97316', closing: '#dc2626', trial: '#8b5cf6', student: '#16a34a' }[tag] || '#6b7280'
    },
    tagLabel(tag) {
      return { new: 'ใหม่', inquired: 'สอบถาม', interested: 'Dealing', closing: 'ปิดการขาย', trial: 'ทดลอง', student: 'นักเรียน' }[tag] || tag
    },
    segColor(s) {
      return { 'nl-new70': '#0d9488', 'nl2': '#2563eb', 'meq': '#dc2626', 'osce': '#7c3aed' }[s] || '#6b7280'
    },
    segLabel(s) {
      return { 'nl-new70': 'NL ใหม่70', 'nl2': 'เหลือNL2', 'meq': 'เตรียมMEQ', 'osce': 'เตรียมOSCE' }[s] || s
    },
    async scanSurveySegments() {
      if (this.scanningSegments) return
      if (!confirm('ค้นคำตอบ survey ทั้งหมด → assign segment ให้ follower?')) return
      this.scanningSegments = true
      try {
        const res = await api.post('/admin/line/scan-survey')
        alert(`อัพเดตแล้ว ${res.updated} คน`)
        this.loadFunnel()
        this.loadSegmentStats()
      } catch (err) { alert('ผิดพลาด: ' + (err.response?.data?.message || err.message)) }
      finally { this.scanningSegments = false }
    },
    async loadSegmentStats() {
      try {
        const res = await api.get('/admin/line/segment-stats')
        this.segmentStats = res
      } catch {}
    },
    async quickSendConfirm() {
      if (!this.quickSendMode || !this.quickSelectedFlex) return
      if (!confirm(this.quickSendSummary + '?')) return
      this.courseSending = true
      try {
        const flex = this.quickSelectedFlex
        const mode = this.quickSendMode
        if (flex === 'pair') {
          await this.quickSendByMode('trial', {})
          await this.quickSendByMode('howto', {})
        } else if (['nl', 'nl2', 'meq', 'osce', 'preclinic', 'ddx'].includes(flex)) {
          if (mode === 'selected') {
            if (!this.selectedIds.length) { this.error = 'เลือก follower ก่อน'; return }
            await api.post('/admin/line/send-course-flex', { course: flex, mode: 'selected', userIds: this.selectedIds })
          } else if (mode === 'admin') {
            await api.post('/admin/line/send-course-flex', { course: flex, mode: 'selected', userIds: ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef'] })
          } else if (mode === 'pushall') {
            await api.post('/admin/line/send-course-flex', { course: flex, mode: 'pushall', userIds: [] })
          } else {
            await api.post('/admin/line/send-course-flex', { course: flex, mode: 'broadcast', userIds: [] })
          }
        } else {
          await this.quickSendByMode(flex, {})
        }
        this.courseFlexMsg = this.quickSendSummary + ' สำเร็จ'
        setTimeout(() => { this.courseFlexMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.courseSending = false }
    },
    quickSendTarget() {
      const m = this.quickSendMode
      if (m === 'selected') return `${this.selectedIds.length} คนที่เลือก`
      if (m === 'admin') return 'Admin (ดูก่อน)'
      if (m === 'pushall') return 'ทุกคนที่มี UUID (ฟรี)'
      return `Broadcast ${this.stats.following || 0} คน (quota)`
    },
    async quickSendByMode(template, fields) {
      const m = this.quickSendMode
      if (m === 'selected') {
        if (!this.selectedIds.length) { this.error = 'เลือก follower ก่อน'; return }
        await api.post('/admin/line/send', { template, fields, userIds: this.selectedIds })
      } else if (m === 'admin') {
        await api.post('/admin/line/send', { template, fields, userIds: ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef'] })
      } else if (m === 'pushall') {
        await api.post('/admin/line/push-all', { template, fields })
      } else {
        await api.post('/admin/line/broadcast-all', { template, fields })
      }
    },
    async quickCourseFlex(course, label) {
      if (!confirm(`ส่ง "${label}" → ${this.quickSendTarget()}?`)) return
      this.courseSending = true
      try {
        const m = this.quickSendMode
        if (m === 'selected') {
          if (!this.selectedIds.length) { this.error = 'เลือก follower ก่อน'; return }
          await api.post('/admin/line/send-course-flex', { course, mode: 'selected', userIds: this.selectedIds })
        } else if (m === 'admin') {
          await api.post('/admin/line/send-course-flex', { course, mode: 'selected', userIds: ['U2b0de81f0ec73e8561197393683a9e95', 'Ue6b6c4daf46d1765f1af71b292fe6fc9', 'U398ec17f9dbf5917c2fd83bec6fe24ef'] })
        } else if (m === 'pushall') {
          await api.post('/admin/line/send-course-flex', { course, mode: 'pushall', userIds: [] })
        } else {
          await api.post('/admin/line/send-course-flex', { course, mode: 'broadcast', userIds: [] })
        }
        this.courseFlexMsg = `ส่ง ${label} → ${this.quickSendTarget()} สำเร็จ`
        setTimeout(() => { this.courseFlexMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
      finally { this.courseSending = false }
    },
    async quickSendTemplate(templateId, label) {
      if (!confirm(`ส่ง "${label}" → ${this.quickSendTarget()}?`)) return
      try {
        await this.quickSendByMode(templateId, {})
        this.courseFlexMsg = `ส่ง ${label} → ${this.quickSendTarget()} สำเร็จ`
        setTimeout(() => { this.courseFlexMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
    },
    async quickSendPair() {
      if (!confirm(`ส่ง "ทดลอง + How-to" → ${this.quickSendTarget()}?`)) return
      try {
        await this.quickSendByMode('trial', {})
        await this.quickSendByMode('howto', {})
        this.courseFlexMsg = `ส่ง ทดลอง + How-to → ${this.quickSendTarget()} สำเร็จ`
        setTimeout(() => { this.courseFlexMsg = '' }, 5000)
      } catch (err) { this.error = err.response?.data?.message || 'ส่งล้มเหลว' }
    },
    async loadTemplates() {
      try {
        const d = await api.get('/admin/line/templates')
        this.templates = d.templates || []
      } catch { /* ignore */ }
    },
    debounceSearch() {
      if (this._searchTimer) clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => this.loadFollowers(), 400)
    },
    toggleAll(e) {
      this.selectedIds = e.target.checked ? this.followers.map(f => f.lineUserId) : []
    },
    toggleSelect(uid) {
      const i = this.selectedIds.indexOf(uid)
      if (i >= 0) this.selectedIds.splice(i, 1)
      else this.selectedIds.push(uid)
    },
    selectTemplate(t) {
      this.selectedTemplate = t.id
      this.currentFields = t.fields || []
      this.previewJson = null
      // init field values with defaults
      const vals = {}
      for (const f of t.fields || []) vals[f.key] = f.default || ''
      this.fieldValues = vals
    },
    async previewFlex() {
      this.previewing = true
      try {
        const d = await api.post('/admin/line/preview', { template: this.selectedTemplate, fields: this.fieldValues })
        this.previewJson = JSON.stringify(d.flex?.contents || d.flex, null, 2)
      } catch (err) {
        this.error = err.response?.data?.message || 'Preview ล้มเหลว'
      } finally { this.previewing = false }
    },
    async confirmSend() {
      const count = this.sendMode === 'broadcast' ? (this.stats.following || 0) : this.selectedIds.length
      if (!confirm(`ยืนยันส่ง Flex "${this.selectedTemplate}" ให้ ${count} คน?`)) return
      this.sending = true
      this.error = null
      try {
        let d
        if (this.sendMode === 'broadcast') {
          d = await api.post('/admin/line/broadcast', { template: this.selectedTemplate, fields: this.fieldValues })
        } else {
          d = await api.post('/admin/line/send', {
            template: this.selectedTemplate,
            fields: this.fieldValues,
            userIds: [...this.selectedIds]
          })
        }
        this.successMsg = `ส่งสำเร็จ ${d.ok} คน` + (d.fail ? ` (ล้มเหลว ${d.fail})` : '')
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'ส่งล้มเหลว'
      } finally { this.sending = false }
    },
    async previewAdmin() {
      this.previewing = true
      try {
        await api.post('/admin/line/preview-admin', { template: this.selectedTemplate, fields: this.fieldValues })
        this.successMsg = 'ส่ง Preview ให้ admin ทุกคนแล้ว — เช็ค LINE'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Preview ล้มเหลว'
      } finally { this.previewing = false }
    },
    async pushAllFree() {
      if (!confirm('ส่งให้ทุกคนที่รู้ UUID (ฟรี ไม่เสีย quota) — วน push ทีละคน?')) return
      this.broadcasting = true
      this.error = null
      try {
        await api.post('/admin/line/push-all', { template: this.selectedTemplate, fields: this.fieldValues })
        this.successMsg = 'ส่งสำเร็จ (ฟรี)!'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'ส่งล้มเหลว'
      } finally { this.broadcasting = false }
    },
    async confirmBroadcastAll() {
      if (!confirm('Broadcast API ให้ทุกคน (เสีย quota เงิน) — แน่ใจ?')) return
      this.broadcasting = true
      this.error = null
      try {
        await api.post('/admin/line/broadcast-all', { template: this.selectedTemplate, fields: this.fieldValues })
        this.successMsg = 'Broadcast สำเร็จ!'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Broadcast ล้มเหลว'
      } finally { this.broadcasting = false }
    },
    copyUuid(uuid) {
      navigator.clipboard.writeText(uuid)
      this.successMsg = 'Copy UUID: ' + uuid
      setTimeout(() => { this.successMsg = '' }, 3000)
    },
    getSelectedFollower() {
      if (this.selectedIds.length !== 1) return null
      const uid = this.selectedIds[0]
      return this.followers.find(f => f.lineUserId === uid)
    },
    async sendCourseFlex(course) {
      const mode = this.courseFlexMode
      if (mode === 'selected' && !this.selectedIds.length) {
        this.courseFlexMsg = 'เลือก follower ก่อน'
        return
      }
      const label = { nl: 'NL MASTERY', meq: 'MEQ Intensive', osce: 'OSCE Mastery', ddx: 'NINJA DDx' }[course]
      const target = mode === 'broadcast' ? `ทุกคน (${this.stats.following} คน)` : `${this.selectedIds.length} คน`
      if (!confirm(`ส่ง Flex "${label}" ให้ ${target}?`)) return
      this.courseSending = true
      this.courseFlexMsg = ''
      try {
        const res = await api.post('/admin/line/send-course-flex', {
          course,
          mode,
          userIds: mode === 'selected' ? this.selectedIds : []
        })
        this.courseFlexMsg = `ส่งสำเร็จ — ${res.sent || 0} คน`
      } catch (err) {
        this.courseFlexMsg = err.response?.data?.message || 'ส่งไม่สำเร็จ'
      } finally {
        this.courseSending = false
      }
    },
    async sendPayment() {
      const uid = this.selectedIds[0]
      const f = this.getSelectedFollower()
      if (!confirm(`ส่ง Flex ชำระเงิน "${this.payForm.courseName}" ${this.payForm.amount.toLocaleString()} บาท ให้ ${f?.displayName}?`)) return
      this.paymentSending = true
      this.error = null
      try {
        const d = await api.post('/admin/line/send-payment', {
          userId: uid,
          courseName: this.payForm.courseName,
          amount: this.payForm.amount,
          transfer: this.payForm.transfer,
          card: this.payForm.card,
          installment3: this.payForm.installment === 3,
          installment6: this.payForm.installment === 6
        })
        this.successMsg = `ส่ง Flex ชำระเงินสำเร็จ` + (d.refId ? ` — ${d.refId}` : '')
        setTimeout(() => { this.successMsg = '' }, 8000)
      } catch (err) {
        this.error = err.response?.data?.message || 'ส่งล้มเหลว'
      } finally { this.paymentSending = false }
    },
    // ═══ AI Chat Tab Methods ═══
    async loadChatFollowers() {
      try {
        const d = await api.get('/admin/line/followers', { params: { search: this.chatSearch, filter: 'all' } })
        this.chatFollowers = (d.followers || [])
          .filter(f => f.isFollowing)
          .sort((a, b) => {
            // escalation ขึ้นก่อน
            if (a.hasEscalation !== b.hasEscalation) return a.hasEscalation ? -1 : 1
            // แล้ว sort ตาม lastMessageAt ใหม่สุดขึ้นก่อน
            return (new Date(b.lastMessageAt || 0)) - (new Date(a.lastMessageAt || 0))
          })
      } catch {}
    },
    debounceChatSearch() {
      if (this._chatSearchTimer) clearTimeout(this._chatSearchTimer)
      this._chatSearchTimer = setTimeout(() => this.loadChatFollowers(), 400)
    },
    async openChat(f) {
      this.chatUserId = f.lineUserId
      this.chatFollowerName = f.displayName || f.lineUserId.slice(0, 12)
      this.chatFollowerMode = f.aiMode || 'human'
      this.chatFollowerPaused = f.aiPaused || false
      this.chatAdminNote = f.adminNote || ''
      this.chatPositiveNote = f.positiveNote || ''
      this.chatNegativeNote = f.negativeNote || ''
      try {
        const d = await api.get(`/admin/line/chat/${f.lineUserId}`)
        this.chatMessages = d.messages || []
        if (d.follower) {
          this.chatFollowerMode = d.follower.aiMode || 'human'
          this.chatFollowerPaused = d.follower.aiPaused || false
          this.chatAdminNote = d.follower.adminNote || ''
          this.chatPositiveNote = d.follower.positiveNote || ''
          this.chatNegativeNote = d.follower.negativeNote || ''
        }
        this.$nextTick(() => {
          const el = this.$refs.chatMessages
          if (el) el.scrollTop = el.scrollHeight
        })
      } catch {}
      // auto-refresh chat ทุก 10 วิ
      if (this._chatRefreshTimer) clearInterval(this._chatRefreshTimer)
      this._chatRefreshTimer = setInterval(() => this.refreshChat(), 10000)
    },
    async refreshChat() {
      if (!this.chatUserId) return
      try {
        const d = await api.get(`/admin/line/chat/${this.chatUserId}`)
        const newLen = (d.messages || []).length
        if (newLen !== this.chatMessages.length) {
          this.chatMessages = d.messages || []
          this.$nextTick(() => {
            const el = this.$refs.chatMessages
            if (el) el.scrollTop = el.scrollHeight
          })
        }
        if (d.follower) {
          this.chatFollowerPaused = d.follower.aiPaused || false
          this.chatFollowerMode = d.follower.aiMode || 'human'
        }
      } catch {}
    },
    async toggleChatAI() {
      const newMode = this.chatFollowerMode === 'ai' ? 'human' : 'ai'
      try {
        await api.patch(`/admin/line/followers/${this.chatUserId}/ai`, { aiMode: newMode })
        this.chatFollowerMode = newMode
        this.chatFollowerPaused = false
        // update in sidebar list too
        const f = this.chatFollowers.find(x => x.lineUserId === this.chatUserId)
        if (f) { f.aiMode = newMode; f.aiPaused = false }
      } catch (err) {
        this.error = err.response?.data?.message || 'เปลี่ยนโหมดล้มเหลว'
      }
    },
    async resumeAI() {
      try {
        await api.patch(`/admin/line/followers/${this.chatUserId}/resume`)
        this.chatFollowerPaused = false
        const f = this.chatFollowers.find(x => x.lineUserId === this.chatUserId)
        if (f) { f.aiPaused = false; f.hasEscalation = false }
        this.loadEscalationCount()
      } catch {}
    },
    async saveAdminNote() {
      if (!this.chatUserId) return
      try {
        await api.patch(`/admin/line/followers/${this.chatUserId}/note`, {
          adminNote: this.chatAdminNote,
          positiveNote: this.chatPositiveNote,
          negativeNote: this.chatNegativeNote
        })
      } catch {}
    },
    async sendAdminReply() {
      if (!this.adminReplyText.trim() || !this.chatUserId) return
      this.adminReplying = true
      try {
        await api.post(`/admin/line/chat/${this.chatUserId}/reply`, { text: this.adminReplyText.trim() })
        this.chatMessages.push({ _id: Date.now(), role: 'admin', text: this.adminReplyText.trim(), createdAt: new Date().toISOString() })
        this.adminReplyText = ''
        this.chatFollowerPaused = true
        this.$nextTick(() => {
          const el = this.$refs.chatMessages
          if (el) el.scrollTop = el.scrollHeight
        })
      } catch (err) {
        this.error = err.response?.data?.message || 'ส่งล้มเหลว'
      } finally { this.adminReplying = false }
    },
    // ═══ Flex Center Methods ═══
    // ═══ AI Packages (ข้อมูลคอร์สต่อคอร์ส) ═══
    async loadAiPackages() {
      try {
        const d = await api.get('/admin/packages')
        this.aiPackages = (d.packages || []).map(p => ({ ...p, aiInfo: p.aiInfo || '' }))
      } catch {}
    },
    async saveAiPackages() {
      this.aiPackagesSaving = true
      try {
        await Promise.all(this.aiPackages.map(p =>
          api.put(`/admin/packages/${p._id}`, { aiInfo: p.aiInfo, aiEnabled: p.aiEnabled !== false })
        ))
        this.successMsg = 'บันทึกข้อมูลคอร์สเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) { this.error = 'บันทึกล้มเหลว' }
      finally { this.aiPackagesSaving = false }
    },
    // ═══ AI Config Methods ═══
    async loadAIConfig() {
      try {
        const [d] = await Promise.all([
          api.get('/admin/line/ai-config'),
          this.loadAiPackages()
        ])
        if (d.config) this.aiConfig = { ...this.aiConfig, ...d.config }
      } catch {}
    },
    async saveAIConfig() {
      this.configSaving = true
      try {
        await api.put('/admin/line/ai-config', {
          systemPrompt: this.aiConfig.systemPrompt,
          temperature: this.aiConfig.temperature,
          maxTokens: this.aiConfig.maxTokens,
          courseInfo: this.aiConfig.courseInfo,
          courseDetails: this.aiConfig.courseDetails,
          salesTechniques: this.aiConfig.salesTechniques,
          enabled: this.aiConfig.enabled,
          tools: this.aiConfig.tools,
          paymentOptions: this.aiConfig.paymentOptions
        })
        this.successMsg = 'บันทึก AI Config สำเร็จ (มีผลภายใน 30 วินาที)'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกล้มเหลว'
      } finally { this.configSaving = false }
    },
    async resetAIConfig() {
      if (!confirm('Reset prompt กลับเป็นค่า default — แน่ใจ?')) return
      this.configSaving = true
      try {
        await api.post('/admin/line/ai-config/reset')
        await this.loadAIConfig()
        this.successMsg = 'Reset AI Config สำเร็จ'
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Reset ล้มเหลว'
      } finally { this.configSaving = false }
    },
    async loadEscalationCount() {
      try {
        const d = await api.get('/admin/line/escalations')
        this.escalationCount = (d.escalations || []).length
      } catch {}
    },
    formatDate(iso) {
      if (!iso) return '-'
      return new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    timeAgo(iso) {
      if (!iso) return ''
      const diff = Date.now() - new Date(iso).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 1) return 'เมื่อกี้'
      if (mins < 60) return `${mins} นาทีที่แล้ว`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs} ชม.ที่แล้ว`
      const days = Math.floor(hrs / 24)
      if (days < 30) return `${days} วันที่แล้ว`
      const months = Math.floor(days / 30)
      return `${months} เดือนที่แล้ว`
    }
  }
}
</script>

<style scoped>
.admin-hero {
  background: linear-gradient(135deg, #06c755 0%, #04a847 60%, #028a3d 100%);
  padding: 32px 0; color: white;
}
.admin-hero-inner { display: flex; align-items: center; gap: 16px; }
.admin-hero-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
}
.admin-hero h1 { font-size: 22px; font-weight: 800; margin: 0 0 3px; }
.admin-hero p { font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; }
.container { max-width: 960px; margin: 0 auto; padding: 0 20px; }
.section { padding: 24px 20px; }
.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
.alert-error { background: #fee; border: 1px solid #fcc; color: #c00; }
.alert-success { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }

/* Stats */
.stats-row { display: flex; gap: 12px; margin-bottom: 20px; }
.stat-card {
  flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px; text-align: center;
}
.stat-num { font-size: 28px; font-weight: 800; color: #0f172a; }
.stat-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }

/* Toolbar */
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-group { display: flex; gap: 4px; }
.filter-btn {
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: #fff; color: #64748b; transition: all 0.15s;
}
.filter-btn:hover { background: #f8fafc; }
.filter-btn.active { background: #06c755; color: #fff; border-color: #06c755; }
.search-input { flex: 1; min-width: 200px; font-size: 13px; padding: 8px 12px; }
.form-control {
  width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; color: #0f172a; background: #fff; outline: none; box-sizing: border-box;
}
.form-control:focus { border-color: #06c755; }

/* Table */
.table-wrapper {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden; margin-bottom: 28px;
}
.ftable { width: 100%; border-collapse: collapse; }
.ftable th {
  padding: 10px 12px; font-size: 11px; font-weight: 600; color: #94a3b8;
  text-align: left; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
}
.ftable td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.ftable tr:last-child td { border-bottom: none; }
.ftable tr:hover { background: #fafbfc; }
.ftable tr.selected { background: #f0fdf4; }

.avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.avatar-placeholder {
  width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #64748b;
}
.name-cell { display: flex; align-items: center; gap: 6px; }
.line-name { font-weight: 600; color: #0f172a; }
.badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
}
.badge-blue { background: #dbeafe; color: #2563eb; }
.badge-gray { background: #f1f5f9; color: #94a3b8; }
.student-info { font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 2px; }
.student-meta { font-size: 11px; color: #94a3b8; }
.msg-preview {
  font-size: 12px; color: #334155; max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.text-muted { color: #cbd5e1; }
.text-sm { font-size: 12px; color: #64748b; }
.text-xs { font-size: 11px; }

/* Send Section */
.send-section {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 24px; margin-bottom: 24px;
}
.send-section h2 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }

/* Template picker */
.template-picker { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.template-card {
  flex: 1; min-width: 140px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; transition: all 0.15s;
}
.template-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.template-card.active { box-shadow: 0 0 0 1px currentColor; }
.tc-dot { width: 8px; height: 8px; border-radius: 50%; margin-bottom: 8px; }
.tc-name { font-size: 13px; font-weight: 700; color: #0f172a; }
.tc-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* Fields */
.fields-section { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 4px; }

/* Send target */
.send-target { display: flex; gap: 20px; margin-bottom: 16px; }
.radio-label {
  display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer;
}
.radio-label input { accent-color: #06c755; }

/* Actions */
.send-actions { display: flex; gap: 8px; }
.btn { padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #06c755; color: #fff; }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
.btn-outline:hover { background: #f8fafc; }

/* Preview */
.preview-box {
  margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;
}
.preview-box h3 { font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.preview-box pre {
  font-size: 11px; color: #334155; background: #fff; padding: 12px; border-radius: 8px;
  overflow-x: auto; max-height: 300px; border: 1px solid #e2e8f0;
  white-space: pre-wrap; word-break: break-all;
}
.preview-hint { font-size: 10px; color: #94a3b8; margin-top: 8px; }

.char-count { font-size: 10px; color: '#94a3b8'; font-weight: 400; margin-left: 8px; }

.uuid-text {
  font-family: monospace; font-size: 11px; color: #3b82f6; cursor: pointer;
  padding: 2px 6px; border-radius: 4px; background: #eff6ff;
}
.uuid-text:hover { background: #dbeafe; }

/* Payment */
.payment-hint { color: #94a3b8; font-size: 13px; padding: 20px; text-align: center; }
.payment-target { font-size: 14px; color: #334155; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.payment-methods { display: flex; gap: 8px; flex-wrap: wrap; }
.payment-methods .radio-label, .payment-methods .check-label {
  padding: 8px 16px; border: 2px solid #e2e8f0; border-radius: 10px;
  transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer;
}
.payment-methods .radio-label.active, .payment-methods .check-label.active { border-color: #16a34a; background: #f0fdf4; }
.payment-methods .check-label input { accent-color: #16a34a; }

/* Tab Bar */
.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
.tab-btn {
  padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
  border: none; background: none; color: #94a3b8; border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all 0.15s; position: relative;
}
.tab-btn:hover { color: #06c755; }
.tab-btn.active { color: #06c755; border-bottom-color: #06c755; }
.tab-badge {
  position: absolute; top: 4px; right: 4px; background: #dc2626; color: #fff;
  font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

/* Chat Tab */
.chat-tab { min-height: 500px; }
.chat-layout { display: flex; gap: 16px; height: 600px; }
.chat-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; }
.chat-list { flex: 1; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
.chat-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer;
  border-bottom: 1px solid #f1f5f9; transition: background 0.1s;
}
.chat-item:hover { background: #f8fafc; }
.chat-item.active { background: #f0fdf4; }
.chat-item.escalated { border-left: 3px solid #dc2626; }
.chat-item-info { flex: 1; min-width: 0; }
.chat-item-name { font-size: 13px; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 4px; }
.chat-item-msg { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.badge-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.badge-dot.red { background: #dc2626; }
.mode-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
.mode-ai { background: #ede9fe; color: #7c3aed; }
.mode-human { background: #f1f5f9; color: #64748b; }

.chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.chat-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 14px; }
.chat-header {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0; background: #f8fafc;
}
.chat-header strong { font-size: 14px; color: #0f172a; }
.chat-header-actions { display: flex; align-items: center; gap: 8px; }
.btn-sm { padding: 4px 12px; font-size: 11px; border-radius: 6px; }
.btn-ai { background: #7c3aed; color: #fff; border: none; cursor: pointer; }
.btn-human { background: #e2e8f0; color: #64748b; border: none; cursor: pointer; }
.btn-resume { background: #16a34a; color: #fff; border: none; cursor: pointer; }
.paused-badge { font-size: 10px; font-weight: 700; color: #dc2626; background: #fee; padding: 2px 8px; border-radius: 6px; }

.chat-note-bar { padding: 8px 16px; border-bottom: 1px solid #e2e8f0; background: #fafafa; display: flex; gap: 8px; }
.note-section { flex: 1; }
.note-label { font-size: 10px; font-weight: 700; margin-bottom: 3px; }
.note-positive { color: #16a34a; }
.note-negative { color: #dc2626; }
.note-general { color: #a16207; }
.note-input { font-size: 11px; padding: 4px 8px; }
.positive-section { background: #f0fdf4; border-radius: 6px; padding: 6px 8px; }
.negative-section { background: #fef2f2; border-radius: 6px; padding: 6px 8px; }
.general-section { background: #fefce8; border-radius: 6px; padding: 6px 8px; }

.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.chat-bubble { max-width: 75%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
.chat-user { align-self: flex-start; background: #f1f5f9; color: #0f172a; }
.chat-assistant { align-self: flex-end; background: #ede9fe; color: #1e293b; }
.chat-admin { align-self: flex-end; background: #dbeafe; color: #1e293b; }
.chat-role-label { font-size: 10px; font-weight: 700; color: #94a3b8; margin-bottom: 2px; }
.chat-text { white-space: pre-wrap; word-break: break-word; }
.chat-meta { font-size: 10px; color: #94a3b8; margin-top: 4px; }
.chat-escalated-label { font-size: 10px; font-weight: 700; color: #dc2626; margin-top: 2px; }
.chat-time { font-size: 10px; color: #cbd5e1; margin-top: 2px; }

.chat-input-row { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; }

/* Config Tab */
.prompt-textarea { font-family: monospace; font-size: 12px; line-height: 1.6; min-height: 300px; }
.tools-list { display: flex; flex-direction: column; gap: 8px; }
.tool-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; transition: all 0.15s;
}
.tool-row.disabled { opacity: 0.5; background: #f8fafc; }
.tool-toggle { display: flex; align-items: center; gap: 8px; min-width: 180px; cursor: pointer; flex-shrink: 0; }
.tool-toggle input { accent-color: #7c3aed; }
.tool-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.tool-instruction { flex: 1; font-size: 12px; padding: 6px 10px; }
.tool-instruction:disabled { background: #f1f5f9; color: #94a3b8; }

/* Payment Options */
.payment-options-list { display: flex; flex-direction: column; gap: 6px; }
.po-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; flex-wrap: wrap;
}
.po-row.disabled { opacity: 0.4; }
.po-check { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #334155; cursor: pointer; white-space: nowrap; }
.po-check input { accent-color: #16a34a; }
.btn-remove { width: 22px; height: 22px; border: none; background: #fee; color: #dc2626; border-radius: 50%; cursor: pointer; font-size: 12px; font-weight: 700; }

/* Responsive */
@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .toolbar { flex-direction: column; }
  .search-input { min-width: 100%; }
  .template-picker { flex-direction: column; }
  .send-target { flex-direction: column; gap: 8px; }
  .table-wrapper { overflow-x: auto; }
  .chat-layout { flex-direction: column; height: auto; }
  .chat-sidebar { width: 100%; }
  .chat-list { max-height: 200px; }
  .chat-messages { min-height: 300px; }
}

/* ═══ Funnel Board ═══ */
.funnel-wrapper { width: 100vw; margin-left: calc(-50vw + 50%); padding: 0 16px; box-sizing: border-box; }
.funnel-board { display: flex; gap: 10px; padding-bottom: 12px; min-height: 500px; width: 100%; }
.funnel-col { flex: 1; min-width: 0; background: #f8fafc; border-radius: 10px; border-top: 3px solid #ccc; display: flex; flex-direction: column; }
.funnel-col-header { padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
.funnel-col-badge { color: #fff; font-size: 13px; font-weight: 700; border-radius: 10px; min-width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0 8px; }
.funnel-col-title { font-weight: 700; font-size: 14px; color: #0f172a; }
.funnel-col-body { padding: 0 10px 10px; flex: 1; overflow-y: auto; max-height: 65vh; display: flex; flex-direction: column; gap: 8px; }
.funnel-card { background: #fff; border-radius: 10px; padding: 12px 14px; box-shadow: 0 1px 4px rgba(0,0,0,.08); border: 1px solid #e2e8f0; }
.funnel-card-row { display: flex; gap: 10px; align-items: flex-start; }
.funnel-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
.funnel-avatar-placeholder { background: #cbd5e1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
.funnel-card-info { flex: 1; min-width: 0; }
.funnel-card-name { font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.funnel-card-sub { font-size: 12px; color: #64748b; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
.funnel-card-course { font-size: 11px; color: #7c3aed; font-weight: 600; margin-top: 4px; }
.funnel-card-actions { margin-top: 8px; }
.funnel-tag-select { width: 100%; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; background: #f1f5f9; color: #334155; cursor: pointer; }
.funnel-tag-select:focus { outline: none; border-color: #3b82f6; }
.funnel-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 24px 0; }
.funnel-badges { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.funnel-exam-badge { color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
.funnel-edit-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }
.funnel-edit-btn:hover { background: #f1f5f9; }
.funnel-card-actions { margin-top: 8px; display: flex; align-items: center; }
.funnel-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.4); z-index: 999; display: flex; align-items: center; justify-content: center; }
.funnel-modal { background: #fff; border-radius: 12px; padding: 24px; width: 360px; max-width: 90vw; box-shadow: 0 8px 30px rgba(0,0,0,.15); }
.funnel-header-bar { display: flex; gap: 16px; align-items: center; padding: 10px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px; flex-wrap: wrap; font-size: 13px; color: #334155; }
.funnel-header-bar b { color: #0f172a; }
.funnel-admin-chip { display: inline-flex; gap: 4px; align-items: center; background: #fef2f2; border-radius: 12px; padding: 2px 8px 2px 2px; font-size: 12px; font-weight: 600; color: #dc2626; margin-left: 4px; }
.funnel-unfollow-bar { display: flex; gap: 8px; align-items: center; padding: 10px 16px; background: #f1f5f9; border-radius: 10px; margin-top: 10px; flex-wrap: wrap; }
.funnel-unfollow-chip { display: inline-flex; gap: 4px; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2px 8px 2px 2px; font-size: 11px; color: #94a3b8; }
.funnel-group { border-left: 3px solid #ec4899; }
.funnel-parent-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
.funnel-avatar-sm { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
.funnel-parent-info { flex: 1; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; min-width: 0; }

@media (max-width: 768px) {
  .funnel-board { flex-direction: column; }
  .funnel-col { min-width: auto; }
  .funnel-col-body { max-height: 250px; }
}
</style>
