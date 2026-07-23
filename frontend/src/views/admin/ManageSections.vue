<template>
  <div class="admin-sections">
    <div class="page-header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1>จัดการเนื้อหา</h1>
          <p>เพิ่ม แก้ไข ลบเนื้อหาการเรียน (Sections)</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline" @click="refreshDurations" :disabled="refreshing">
            {{ refreshing ? 'กำลังดึง...' : 'Sync เวลา VDO' }}
          </button>
          <button class="btn btn-primary" @click="showForm = !showForm">
            {{ showForm ? 'ปิดฟอร์ม' : '+ เพิ่มเนื้อหาใหม่' }}
          </button>
        </div>
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

      <!-- Add/Edit Section Form -->
      <div v-if="showForm" class="card" style="margin-bottom: 24px;">
        <div class="card-body" style="padding: 24px;">
          <h2>{{ editingId ? 'แก้ไขเนื้อหา' : 'เพิ่มเนื้อหาใหม่' }}</h2>
          <form @submit.prevent="handleSubmit" style="margin-top: 16px;">
            <div class="grid grid-2">
              <div class="form-group">
                <label>รหัสเนื้อหา (Code)</label>
                <input
                  v-model="form.code"
                  type="text"
                  class="form-control"
                  required
                  placeholder="เช่น INT, PED, OBG"
                  @input="form.code = form.code.toUpperCase()"
                />
              </div>
              <div class="form-group">
                <label>ชื่อเนื้อหา</label>
                <input v-model="form.name" type="text" class="form-control" required placeholder="เช่น อายุรศาสตร์" />
              </div>
              <div class="form-group">
                <label>ลำดับการแสดงผล</label>
                <input v-model.number="form.order" type="number" class="form-control" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>รายละเอียด</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="อธิบายเนื้อหาโดยย่อ..."></textarea>
            </div>

            <!-- Videos Sub-form (3-level tree: Topic → Subtopic → VDO) -->
            <div class="form-group">
              <label style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                <span>วีดีโอในเนื้อหา ({{ form.videos.length }} รายการ)</span>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="btn btn-sm btn-outline" @click="addTopicRow" style="border-color:#a855f7;color:#a855f7;">+ เพิ่ม Topic</button>
                  <button type="button" class="btn btn-sm btn-outline" @click="addVideo">+ เพิ่มวีดีโอ (ไม่มี Topic)</button>
                  <button type="button" class="btn btn-sm btn-outline" @click="addDocRow" style="border-color:#0ea5e9;color:#0ea5e9;">+ เพิ่มเอกสาร (ไม่มี Topic)</button>
                </div>
              </label>

              <div v-if="form.videos.length > 0" class="tree-wrap" style="margin-top: 12px;">
                <!-- Videos grouped as tree -->
                <template v-for="(node, tIdx) in treeStructure" :key="'t'+tIdx">

                  <!-- === TOPIC HEADER === -->
                  <div v-if="node.type === 'topic'" class="tree-topic">
                    <div class="tree-topic-header">
                      <div class="tree-topic-left">
                        <span class="btn-collapse">▼</span>
                        <input v-model="node.name" type="text" class="topic-name-input" @change="renameTopic(node.originalName, node.name)" placeholder="ชื่อ Topic" />
                        <span class="tree-count">{{ node.videoCount }} VDO</span>
                      </div>
                      <div class="tree-topic-actions">
                        <select
                          v-if="node.topicId"
                          class="tier-bulk-select sc-bind-select"
                          :value="selfCheckBindingValue('topic', node.topicId)"
                          @change="bindSelfCheck('topic', node.topicId, node.name, $event)"
                          :title="'ผูก Self Check Checklist กับ Topic นี้'"
                        >
                          <option value="">📋 Self Check: (ไม่มี)</option>
                          <option v-for="t in selfCheckTemplates" :key="t.slug" :value="t.slug">
                            📋 {{ t.icon }} {{ t.name }}
                          </option>
                        </select>
                        <select class="tier-bulk-select" @change="bulkSetTier('topic', node.name, null, $event)" :title="'ตั้งระดับให้ทุก VDO ใน Topic นี้'">
                          <option value="">ตั้งระดับทั้ง Topic</option>
                          <option value="1">→ ระดับ 1</option>
                          <option value="2">→ ระดับ 2</option>
                          <option value="3">→ ระดับ 3</option>
                          <option value="4">→ ระดับ 4</option>
                          <option value="5">→ ระดับ 5</option>
                          <option value="6">→ ระดับ 6</option>
                        </select>
                        <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#a855f7;color:#a855f7;" @click="addSubtopicInTopic(node.name)">+ Sub</button>
                        <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#3b82f6;color:#3b82f6;" @click="addVideoInTopic(node.name)">+ VDO</button>
                        <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#0ea5e9;color:#0ea5e9;" @click="addDocInTopic(node.name)">+ เอกสาร</button>
                        <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#10b981;color:#10b981;" @click="insertTopicBefore(node.name)" title="แทรก Topic ข้างบน">+ Topic</button>
                        <button type="button" class="btn-move" :disabled="tIdx === 0 || treeStructure[tIdx-1].type !== 'topic'" @click="moveTopicUp(node.name)" title="ขึ้น">↑</button>
                        <button type="button" class="btn-move" :disabled="isLastTopic(tIdx)" @click="moveTopicDown(node.name)" title="ลง">↓</button>
                        <button type="button" class="btn btn-sm btn-danger" style="font-size:11px;" @click="removeTopic(node.name)">ลบ Topic</button>
                      </div>
                    </div>

                    <!-- Topic children (subtopics + videos without subtopic) -->
                    <div class="tree-topic-children">
                      <template v-for="(child, sIdx) in node.children" :key="'s'+sIdx">

                        <!-- === SUBTOPIC HEADER === -->
                        <div v-if="child.type === 'subtopic'" class="tree-subtopic">
                          <div class="tree-subtopic-header">
                            <div class="tree-subtopic-left">
                              <span class="btn-collapse btn-collapse-sm">▼</span>
                              <input v-model="child.name" type="text" class="subtopic-name-input" @change="renameSubtopic(node.name, child.originalName, child.name)" placeholder="ชื่อ Subtopic" />
                              <span class="tree-count">{{ child.videos.length }} VDO</span>
                            </div>
                            <div class="tree-subtopic-actions">
                              <select
                                v-if="child.subtopicId"
                                class="tier-bulk-select tier-bulk-sm sc-bind-select"
                                :value="selfCheckBindingValue('subtopic', child.subtopicId)"
                                @change="bindSelfCheck('subtopic', child.subtopicId, child.name, $event)"
                                :title="'ผูก Self Check Checklist กับ Subtopic นี้'"
                              >
                                <option value="">📋 Self Check: (ไม่มี)</option>
                                <option v-for="t in selfCheckTemplates" :key="t.slug" :value="t.slug">
                                  📋 {{ t.icon }} {{ t.name }}
                                </option>
                              </select>
                              <select class="tier-bulk-select tier-bulk-sm" @change="bulkSetTier('subtopic', node.name, child.name, $event)" :title="'ตั้งระดับให้ทุก VDO ใน Subtopic นี้'">
                                <option value="">ตั้งระดับทั้ง Sub</option>
                                <option value="1">→ ระดับ 1</option>
                                <option value="2">→ ระดับ 2</option>
                                <option value="3">→ ระดับ 3</option>
                                <option value="4">→ ระดับ 4</option>
                                <option value="5">→ ระดับ 5</option>
                                <option value="6">→ ระดับ 6</option>
                              </select>
                              <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#3b82f6;color:#3b82f6;" @click="addVideoInSubtopic(node.name, child.name)">+ VDO</button>
                              <button type="button" class="btn btn-sm btn-outline" style="font-size:11px;border-color:#0ea5e9;color:#0ea5e9;" @click="addDocInSubtopic(node.name, child.name)">+ เอกสาร</button>
                              <button type="button" class="btn btn-sm btn-outline" style="font-size:10px;border-color:#a855f7;color:#a855f7;" @click="insertSubtopicBefore(node.name, child.name)" title="แทรก Subtopic ข้างบน">+ Sub</button>
                              <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === 0" @click="moveSubtopicUp(node.name, child.name)" title="ขึ้น">↑</button>
                              <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === node.children.length - 1" @click="moveSubtopicDown(node.name, child.name)" title="ลง">↓</button>
                              <button type="button" class="btn btn-sm btn-danger" style="font-size:10px;" @click="removeSubtopic(node.name, child.name)">ลบ</button>
                            </div>
                          </div>
                          <!-- Subtopic videos -->
                          <div class="tree-subtopic-videos">
                            <div v-for="(vid, vIdx) in child.videos" :key="'v'+vid.flatIdx">
                              <!-- === DOC-ONLY row under subtopic === -->
                              <div v-if="_isDocRow(vid.ref)" class="tree-video-row tree-doc-row">
                                <span class="tree-video-num tree-doc-num">📄</span>
                                <input v-model="vid.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อเอกสาร" style="flex:1;min-width:120px;" />
                                <select v-model="vid.ref.pdfFile" class="form-control form-control-sm doc-pdf-select" style="min-width:220px;max-width:280px;" :title="vid.ref.pdfFile || 'เลือกไฟล์ PDF'">
                                  <option value="">— เลือกไฟล์ PDF —</option>
                                  <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                                </select>
                                <span class="doc-tag">เอกสาร</span>
                                <select v-model.number="vid.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (vid.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะโหลดได้'">
                                  <option :value="1">ระดับ 1</option>
                                  <option :value="2">ระดับ 2</option>
                                  <option :value="3">ระดับ 3</option>
                                  <option :value="4">ระดับ 4</option>
                                  <option :value="5">ระดับ 5</option>
                                  <option :value="6">ระดับ 6</option>
                                </select>
                                <div class="tree-video-actions">
                                  <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(vid.flatIdx)" title="แทรกข้างบน">+</button>
                                  <button type="button" class="btn-assign-sub" @click="moveVideoTo(vid.flatIdx)" title="ย้ายไป Topic/Subtopic อื่น">⇄</button>
                                  <button type="button" class="btn-move btn-move-sm" :disabled="vIdx === 0" @click="moveVideoInGroup(node.name, child.name, vIdx, -1)" title="ขึ้น">↑</button>
                                  <button type="button" class="btn-move btn-move-sm" :disabled="vIdx === child.videos.length - 1" @click="moveVideoInGroup(node.name, child.name, vIdx, 1)" title="ลง">↓</button>
                                  <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(vid.flatIdx)" title="ลบ">✕</button>
                                </div>
                              </div>
                              <div v-else class="tree-video-row">
                              <span class="tree-video-num">{{ vid.flatIdx + 1 }}</span>
                              <input v-model="vid.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="vid.ref._locked" />
                              <button v-if="vid.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameAllFiles(vid.ref)" :disabled="vid.ref._renaming" :title="'ตั้งชื่อไฟล์ (Bunny 2 + Ali 2)'">{{ vid.ref._renaming ? '...' : '✏️' }}</button>
                              <button type="button" class="btn-load-lib" @click="openLoadContentModal(vid.ref)" title="โหลดจาก Content Library">📚</button>
                              <!-- ⭐ 4 video IDs — 2 labeled rows: GLOBAL / CHINA -->
                              <div class="video-ids-grid-v2">
                                <div class="platform-row global">
                                  <span class="platform-label">🌐 GLOBAL</span>
                                  <div class="vid-slot">
                                    <div class="vid-input-wrap">
                                      <input v-model="vid.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="NoDRM UUID" :disabled="vid.ref.contentId || vid.ref._locked" @input="scheduleVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._verifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._verified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._verified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._bunnyName" class="bunny-filename" :title="vid.ref._bunnyName">{{ vid.ref._bunnyName }}</div>
                                  </div>
                                  <div class="vid-slot">
                                    <div class="vid-input-wrap">
                                      <input v-model="vid.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="DRM UUID" :disabled="vid.ref.contentId || vid.ref._locked" @input="scheduleDrmVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._drmVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._drmVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._drmVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._drmName" class="bunny-filename drm" :title="vid.ref._drmName">{{ vid.ref._drmName }}</div>
                                    <span v-if="vid.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                                  </div>
                                </div>
                                <div class="platform-row china">
                                  <span class="platform-label">🇨🇳 CHINA</span>
                                  <div class="vid-slot">
                                    <div class="vid-input-wrap">
                                      <input v-model="vid.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="Ali VID (dual encryption)" :disabled="vid.ref.contentId || vid.ref._locked" @input="scheduleAliVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._aliVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._aliVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._aliVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._aliName" class="bunny-filename" :title="vid.ref._aliName">{{ vid.ref._aliName }}</div>
                                    <div v-if="vid.ref._aliVerifyReason" class="ali-verify-reason" :title="vid.ref._aliVerifyReason">{{ vid.ref._aliVerifyReason }}</div>
                                  </div>
                                  <!-- ⭐ Save to Library — แสดงเมื่อครบ fields -->
                                  <div v-if="isFourFieldsComplete(vid.ref)" class="save-to-lib-row">
                                    <button type="button" class="btn-save-to-lib" @click="openSaveContentModal(vid.ref)" title="บันทึกเข้า Library เพื่อ reuse ในอนาคต">
                                      💾 บันทึกเข้า Content Library
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <span v-if="vid.ref.contentId" class="link-badge" :title="'🔗 Link Library: ' + (vid.ref._linkedContentTitle || 'Library content') + ' (คลิกเพื่อ unlink)'" @click="unlinkContent(vid.ref)">🔗 Library</span>
                              <span v-if="vid.ref._locked" class="lock-badge" @click="unlockVideo(vid.flatIdx)">🔒</span>
                              <select v-model.number="vid.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (vid.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะดูได้'">
                                <option :value="1">ระดับ 1</option>
                                <option :value="2">ระดับ 2</option>
                                <option :value="3">ระดับ 3</option>
                                <option :value="4">ระดับ 4</option>
                                <option :value="5">ระดับ 5</option>
                                <option :value="6">ระดับ 6</option>
                              </select>
                              <span class="tree-video-dur">{{ vid.ref.duration && vid.ref.duration !== '--:--' ? vid.ref.duration : '--:--' }}</span>
                              <div class="tree-video-actions actions-clean">
                                <!-- ⭐ ปุ่ม bonus (ใช้บ่อย — เห็นตลอด) -->
                                <button type="button" class="action-btn bonus" @click="toggleBonus(vid.flatIdx)" :title="vid.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ vid.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
                                <!-- ⋯ menu: จัดเรียง, ย้าย, ลบ -->
                                <div class="action-menu-wrap">
                                  <button type="button" class="action-btn menu-toggle" @click.stop="toggleActionMenu(vid.flatIdx)" title="เมนู">⋯</button>
                                  <div v-if="_openMenuIdx === vid.flatIdx" class="action-menu" @click.stop>
                                    <button type="button" class="menu-item" :disabled="vIdx === 0" @click="moveVideoInGroup(node.name, child.name, vIdx, -1); _openMenuIdx = null">↑ เลื่อนขึ้น</button>
                                    <button type="button" class="menu-item" :disabled="vIdx === child.videos.length - 1" @click="moveVideoInGroup(node.name, child.name, vIdx, 1); _openMenuIdx = null">↓ เลื่อนลง</button>
                                    <button type="button" class="menu-item" @click="insertVideoBefore(vid.flatIdx); _openMenuIdx = null">+ แทรกข้างบน</button>
                                    <button type="button" class="menu-item" @click="moveVideoTo(vid.flatIdx); _openMenuIdx = null">⇄ ย้ายไป Topic อื่น</button>
                                    <button type="button" class="menu-item menu-danger" @click="removeVideo(vid.flatIdx); _openMenuIdx = null">✕ ลบ</button>
                                  </div>
                                </div>
                              </div>
                              </div>
                              <!-- Bonus Video Sub-form -->
                              <div v-if="vid.ref._bonusExpanded" class="bonus-subform">
                                <div class="bonus-subform-header">
                                  <span>⭐</span>
                                  <input v-model="vid.ref.bonusLabel" type="text" class="bonus-label-input" placeholder="หมวด (BRIDGING, ADVANCE, BONUS...)" />
                                  <button type="button" class="btn-bonus-clear" @click="clearBonus(vid.flatIdx)" v-if="vid.ref.bonusBunnyVideoId || vid.ref.bonusTitle || vid.ref.bonusLabel">ลบ</button>
                                </div>
                                <div class="bonus-subform-row">
                                  <input v-model="vid.ref.bonusTitle" type="text" class="form-control form-control-sm" placeholder="ชื่อ VDO เสริม" style="flex:1;min-width:100px;" :disabled="vid.ref._bonusLocked" />
                                  <span v-if="vid.ref._bonusLocked" class="lock-badge" @click="vid.ref._bonusLocked = false" title="ปลดล็อก">🔒</span>
                                  <span class="bonus-serve-label bonus-serve-a">A</span>
                                  <div style="min-width:150px;">
                                    <div style="display:flex;gap:3px;align-items:center;">
                                      <input v-model="vid.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="A · NoDRM UUID" :disabled="vid.ref._bonusLocked" @input="scheduleBonusVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._bonusVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._bonusVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._bonusVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._bonusBunnyName" class="bunny-filename" :title="vid.ref._bonusBunnyName">{{ vid.ref._bonusBunnyName }}</div>
                                  </div>
                                  <div style="min-width:150px;">
                                    <div style="display:flex;gap:3px;align-items:center;">
                                      <input v-model="vid.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="A · DRM UUID" :disabled="vid.ref._bonusLocked" @input="scheduleBonusDrmVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._bonusDrmVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._bonusDrmVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._bonusDrmVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._bonusDrmName" class="bunny-filename drm" :title="vid.ref._bonusDrmName">{{ vid.ref._bonusDrmName }}</div>
                                  </div>
                                  <span class="bonus-serve-label bonus-serve-b">B</span>
                                  <div style="min-width:150px;">
                                    <div style="display:flex;gap:3px;align-items:center;">
                                      <input v-model="vid.ref.bonusAliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="B · Ali VID" :disabled="vid.ref._bonusLocked" />
                                      <span v-if="vid.ref.bonusAliVideoId" class="verify-status ok">✓</span>
                                    </div>
                                  </div>
                                  <span class="tree-video-dur">{{ vid.ref.bonusDuration && vid.ref.bonusDuration !== '--:--' ? vid.ref.bonusDuration : '--:--' }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- === DOC-ONLY row directly under topic === -->
                        <div v-else-if="_isDocRow(child.ref)" class="tree-video-row tree-video-in-topic tree-doc-row">
                          <span class="tree-video-num tree-doc-num">📄</span>
                          <input v-model="child.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อเอกสาร" style="flex:1;min-width:120px;" />
                          <select v-model="child.ref.pdfFile" class="form-control form-control-sm doc-pdf-select" style="min-width:220px;max-width:280px;" :title="child.ref.pdfFile || 'เลือกไฟล์ PDF'">
                            <option value="">— เลือกไฟล์ PDF —</option>
                            <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                          </select>
                          <span class="doc-tag">เอกสาร</span>
                          <select v-model.number="child.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (child.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะโหลดได้'">
                            <option :value="1">ระดับ 1</option>
                            <option :value="2">ระดับ 2</option>
                            <option :value="3">ระดับ 3</option>
                            <option :value="4">ระดับ 4</option>
                            <option :value="5">ระดับ 5</option>
                            <option :value="6">ระดับ 6</option>
                          </select>
                          <div class="tree-video-actions">
                            <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(child.flatIdx)" title="แทรกข้างบน">+</button>
                            <button type="button" class="btn-assign-sub" @click="moveVideoTo(child.flatIdx)" title="ย้ายไป Topic/Subtopic">⇄</button>
                            <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === 0 || node.children[sIdx-1].type === 'subtopic'" @click="moveVideoInGroup(node.name, '', sIdx, -1)" title="ขึ้น">↑</button>
                            <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === node.children.length - 1" @click="moveVideoInGroup(node.name, '', sIdx, 1)" title="ลง">↓</button>
                            <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(child.flatIdx)" title="ลบ">✕</button>
                          </div>
                        </div>

                        <!-- === VIDEO directly under topic (no subtopic) === -->
                        <div v-else>
                          <div class="tree-video-row tree-video-in-topic">
                          <span class="tree-video-num">{{ child.flatIdx + 1 }}</span>
                          <input v-model="child.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="child.ref._locked" />
                          <button v-if="child.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameAllFiles(child.ref)" :disabled="child.ref._renaming" :title="'ตั้งชื่อไฟล์ (Bunny 2 + Ali 2)'">{{ child.ref._renaming ? '...' : '✏️' }}</button>
                          <button type="button" class="btn-load-lib" @click="openLoadContentModal(child.ref)" title="โหลดจาก Content Library">📚</button>
                          <div class="video-ids-grid-v2">
                            <div class="platform-row global">
                              <span class="platform-label">🌐 GLOBAL</span>
                              <div class="vid-slot">
                                <div class="vid-input-wrap">
                                  <input v-model="child.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="NoDRM UUID" :disabled="child.ref.contentId || child.ref._locked" @input="scheduleVerify(child.flatIdx)" />
                                  <span v-if="child.ref._verifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._verified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._verified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._bunnyName" class="bunny-filename">{{ child.ref._bunnyName }}</div>
                              </div>
                              <div class="vid-slot">
                                <div class="vid-input-wrap">
                                  <input v-model="child.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="DRM UUID" :disabled="child.ref.contentId || child.ref._locked" @input="scheduleDrmVerify(child.flatIdx)" />
                                  <span v-if="child.ref._drmVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._drmVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._drmVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._drmName" class="bunny-filename drm">{{ child.ref._drmName }}</div>
                                <span v-if="child.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                              </div>
                            </div>
                            <div class="platform-row china">
                              <span class="platform-label">🇨🇳 CHINA</span>
                              <div class="vid-slot">
                                <div class="vid-input-wrap">
                                  <input v-model="child.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="Ali VID (dual encryption)" :disabled="child.ref.contentId || child.ref._locked" @input="scheduleAliVerify(child.flatIdx)" />
                                  <span v-if="child.ref._aliVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._aliVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._aliVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._aliName" class="bunny-filename" :title="child.ref._aliName">{{ child.ref._aliName }}</div>
                                <div v-if="child.ref._aliVerifyReason" class="ali-verify-reason" :title="child.ref._aliVerifyReason">{{ child.ref._aliVerifyReason }}</div>
                              </div>
                            </div>
                            <div v-if="isFourFieldsComplete(child.ref)" class="save-to-lib-row">
                              <button type="button" class="btn-save-to-lib" @click="openSaveContentModal(child.ref)" title="บันทึกเข้า Library เพื่อ reuse ในอนาคต">
                                💾 บันทึกเข้า Content Library
                              </button>
                            </div>
                          </div>
                          <span v-if="child.ref.contentId" class="link-badge" :title="'🔗 Link Library: ' + (child.ref._linkedContentTitle || 'Library content') + ' (คลิกเพื่อ unlink)'" @click="unlinkContent(child.ref)">🔗 Library</span>
                          <span v-if="child.ref._locked" class="lock-badge" @click="unlockVideo(child.flatIdx)">🔒</span>
                          <select v-model.number="child.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (child.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะดูได้'">
                            <option :value="1">ระดับ 1</option>
                            <option :value="2">ระดับ 2</option>
                            <option :value="3">ระดับ 3</option>
                            <option :value="4">ระดับ 4</option>
                            <option :value="5">ระดับ 5</option>
                            <option :value="6">ระดับ 6</option>
                          </select>
                          <span class="tree-video-dur">{{ child.ref.duration && child.ref.duration !== '--:--' ? child.ref.duration : '--:--' }}</span>
                          <div class="tree-video-actions actions-clean">
                            <button type="button" class="action-btn bonus" @click="toggleBonus(child.flatIdx)" :title="child.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ child.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
                            <div class="action-menu-wrap">
                              <button type="button" class="action-btn menu-toggle" @click.stop="toggleActionMenu(child.flatIdx)" title="เมนู">⋯</button>
                              <div v-if="_openMenuIdx === child.flatIdx" class="action-menu" @click.stop>
                                <button type="button" class="menu-item" :disabled="sIdx === 0 || node.children[sIdx-1].type === 'subtopic'" @click="moveVideoInGroup(node.name, '', sIdx, -1); _openMenuIdx = null">↑ เลื่อนขึ้น</button>
                                <button type="button" class="menu-item" :disabled="sIdx === node.children.length - 1" @click="moveVideoInGroup(node.name, '', sIdx, 1); _openMenuIdx = null">↓ เลื่อนลง</button>
                                <button type="button" class="menu-item" @click="insertVideoBefore(child.flatIdx); _openMenuIdx = null">+ แทรกข้างบน</button>
                                <button type="button" class="menu-item" @click="moveVideoTo(child.flatIdx); _openMenuIdx = null">⇄ ย้ายไป Topic อื่น</button>
                                <button type="button" class="menu-item menu-danger" @click="removeVideo(child.flatIdx); _openMenuIdx = null">✕ ลบ</button>
                              </div>
                            </div>
                          </div>
                          </div>
                          <!-- Bonus Video Sub-form -->
                          <div v-if="child.ref._bonusExpanded" class="bonus-subform">
                            <div class="bonus-subform-header">
                              <span>⭐</span>
                              <input v-model="child.ref.bonusLabel" type="text" class="bonus-label-input" placeholder="หมวด (BRIDGING, ADVANCE, BONUS...)" />
                              <button type="button" class="btn-bonus-clear" @click="clearBonus(child.flatIdx)" v-if="child.ref.bonusBunnyVideoId || child.ref.bonusTitle || child.ref.bonusLabel">ลบ</button>
                            </div>
                            <div class="bonus-subform-row">
                              <input v-model="child.ref.bonusTitle" type="text" class="form-control form-control-sm" placeholder="ชื่อ VDO เสริม" style="flex:1;min-width:100px;" :disabled="child.ref._bonusLocked" />
                              <span v-if="child.ref._bonusLocked" class="lock-badge" @click="child.ref._bonusLocked = false" title="ปลดล็อก">🔒</span>
                              <div style="min-width:160px;">
                                <div style="display:flex;gap:3px;align-items:center;">
                                  <input v-model="child.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="GLOBAL NoDRM UUID" :disabled="child.ref._bonusLocked" @input="scheduleBonusVerify(child.flatIdx)" />
                                  <span v-if="child.ref._bonusVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._bonusVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._bonusVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._bonusBunnyName" class="bunny-filename" :title="child.ref._bonusBunnyName">{{ child.ref._bonusBunnyName }}</div>
                              </div>
                              <div style="min-width:160px;">
                                <div style="display:flex;gap:3px;align-items:center;">
                                  <input v-model="child.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="GLOBAL DRM UUID" :disabled="child.ref._bonusLocked" @input="scheduleBonusDrmVerify(child.flatIdx)" />
                                  <span v-if="child.ref._bonusDrmVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._bonusDrmVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._bonusDrmVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._bonusDrmName" class="bunny-filename drm" :title="child.ref._bonusDrmName">{{ child.ref._bonusDrmName }}</div>
                              </div>
                              <span class="tree-video-dur">{{ child.ref.bonusDuration && child.ref.bonusDuration !== '--:--' ? child.ref.bonusDuration : '--:--' }}</span>
                            </div>
                          </div>
                        </div>

                      </template>
                    </div>
                  </div>

                  <!-- === DOC-ONLY row (root, no topic) === -->
                  <div v-else-if="_isDocRow(node.ref)" class="tree-video-row tree-video-root tree-doc-row">
                    <span class="tree-video-num tree-doc-num">📄</span>
                    <input v-model="node.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อเอกสาร" style="flex:1;min-width:120px;" />
                    <select v-model="node.ref.pdfFile" class="form-control form-control-sm doc-pdf-select" style="min-width:220px;max-width:280px;" :title="node.ref.pdfFile || 'เลือกไฟล์ PDF'">
                      <option value="">— เลือกไฟล์ PDF —</option>
                      <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                    </select>
                    <span class="doc-tag">เอกสาร</span>
                    <select v-model.number="node.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (node.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะโหลดได้'">
                      <option :value="1">ระดับ 1</option>
                      <option :value="2">ระดับ 2</option>
                      <option :value="3">ระดับ 3</option>
                      <option :value="4">ระดับ 4</option>
                      <option :value="5">ระดับ 5</option>
                      <option :value="6">ระดับ 6</option>
                    </select>
                    <div class="tree-video-actions">
                      <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(node.flatIdx)" title="แทรกข้างบน">+</button>
                      <button type="button" class="btn-assign-sub" @click="moveVideoTo(node.flatIdx)" title="ย้ายไป Topic/Subtopic">⇄</button>
                      <button type="button" class="btn-move btn-move-sm" :disabled="tIdx === 0" @click="moveVideo(node.flatIdx, -1)" title="ขึ้น">↑</button>
                      <button type="button" class="btn-move btn-move-sm" :disabled="tIdx === treeStructure.length - 1" @click="moveVideo(node.flatIdx, 1)" title="ลง">↓</button>
                      <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(node.flatIdx)" title="ลบ">✕</button>
                    </div>
                  </div>

                  <!-- === VIDEO without topic (root level) === -->
                  <div v-else>
                    <div class="tree-video-row tree-video-root">
                    <span class="tree-video-num">{{ node.flatIdx + 1 }}</span>
                    <input v-model="node.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="node.ref._locked" />
                    <button v-if="node.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameAllFiles(node.ref)" :disabled="node.ref._renaming" :title="'ตั้งชื่อไฟล์ (Bunny 2 + Ali 2)'">{{ node.ref._renaming ? '...' : '✏️' }}</button>
                    <button type="button" class="btn-load-lib" @click="openLoadContentModal(node.ref)" title="โหลดจาก Content Library">📚</button>
                    <div class="video-ids-grid-v2">
                      <div class="platform-row global">
                        <span class="platform-label">🌐 GLOBAL</span>
                        <div class="vid-slot">
                          <div class="vid-input-wrap">
                            <input v-model="node.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="NoDRM UUID" :disabled="node.ref.contentId || node.ref._locked" @input="scheduleVerify(node.flatIdx)" />
                            <span v-if="node.ref._verifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._verified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._verified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._bunnyName" class="bunny-filename">{{ node.ref._bunnyName }}</div>
                        </div>
                        <div class="vid-slot">
                          <div class="vid-input-wrap">
                            <input v-model="node.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="DRM UUID" :disabled="node.ref.contentId || node.ref._locked" @input="scheduleDrmVerify(node.flatIdx)" />
                            <span v-if="node.ref._drmVerifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._drmVerified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._drmVerified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._drmName" class="bunny-filename drm">{{ node.ref._drmName }}</div>
                          <span v-if="node.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                        </div>
                      </div>
                      <div class="platform-row china">
                        <span class="platform-label">🇨🇳 CHINA</span>
                        <div class="vid-slot">
                          <div class="vid-input-wrap">
                            <input v-model="node.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="Ali VID (dual encryption)" :disabled="node.ref.contentId || node.ref._locked" @input="scheduleAliVerify(node.flatIdx)" />
                            <span v-if="node.ref._aliVerifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._aliVerified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._aliVerified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._aliName" class="bunny-filename" :title="node.ref._aliName">{{ node.ref._aliName }}</div>
                          <div v-if="node.ref._aliVerifyReason" class="ali-verify-reason" :title="node.ref._aliVerifyReason">{{ node.ref._aliVerifyReason }}</div>
                        </div>
                      </div>
                      <div v-if="isFourFieldsComplete(node.ref)" class="save-to-lib-row">
                        <button type="button" class="btn-save-to-lib" @click="openSaveContentModal(node.ref)" title="บันทึกเข้า Library เพื่อ reuse ในอนาคต">
                          💾 บันทึกเข้า Content Library
                        </button>
                      </div>
                    </div>
                    <span v-if="node.ref.contentId" class="link-badge" :title="'🔗 Link Library: ' + (node.ref._linkedContentTitle || 'Library content') + ' (คลิกเพื่อ unlink)'" @click="unlinkContent(node.ref)">🔗 Library</span>
                    <span v-if="node.ref._locked" class="lock-badge" @click="unlockVideo(node.flatIdx)">🔒</span>
                    <select v-model.number="node.ref.requiredTier" class="tier-select" :class="'tier-bg-' + (node.ref.requiredTier || 6)" :title="'ระดับขั้นต่ำที่จะดูได้'">
                      <option :value="1">ระดับ 1</option>
                      <option :value="2">ระดับ 2</option>
                      <option :value="3">ระดับ 3</option>
                      <option :value="4">ระดับ 4</option>
                      <option :value="5">ระดับ 5</option>
                      <option :value="6">ระดับ 6</option>
                    </select>
                    <span class="tree-video-dur">{{ node.ref.duration && node.ref.duration !== '--:--' ? node.ref.duration : '--:--' }}</span>
                    <div class="tree-video-actions actions-clean">
                      <button type="button" class="action-btn bonus" @click="toggleBonus(node.flatIdx)" :title="node.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ node.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
                      <div class="action-menu-wrap">
                        <button type="button" class="action-btn menu-toggle" @click.stop="toggleActionMenu(node.flatIdx)" title="เมนู">⋯</button>
                        <div v-if="_openMenuIdx === node.flatIdx" class="action-menu" @click.stop>
                          <button type="button" class="menu-item" :disabled="tIdx === 0" @click="moveVideo(node.flatIdx, -1); _openMenuIdx = null">↑ เลื่อนขึ้น</button>
                          <button type="button" class="menu-item" :disabled="tIdx === treeStructure.length - 1" @click="moveVideo(node.flatIdx, 1); _openMenuIdx = null">↓ เลื่อนลง</button>
                          <button type="button" class="menu-item" @click="insertVideoBefore(node.flatIdx); _openMenuIdx = null">+ แทรกข้างบน</button>
                          <button type="button" class="menu-item" @click="moveVideoTo(node.flatIdx); _openMenuIdx = null">⇄ ย้ายไป Topic อื่น</button>
                          <button type="button" class="menu-item menu-danger" @click="removeVideo(node.flatIdx); _openMenuIdx = null">✕ ลบ</button>
                        </div>
                      </div>
                    </div>
                    </div>
                    <!-- Bonus Video Sub-form -->
                    <div v-if="node.ref._bonusExpanded" class="bonus-subform">
                      <div class="bonus-subform-header">
                        <span>⭐</span>
                        <input v-model="node.ref.bonusLabel" type="text" class="bonus-label-input" placeholder="หมวด (BRIDGING, ADVANCE, BONUS...)" />
                        <button type="button" class="btn-bonus-clear" @click="clearBonus(node.flatIdx)" v-if="node.ref.bonusBunnyVideoId || node.ref.bonusTitle || node.ref.bonusLabel">ลบ</button>
                      </div>
                      <div class="bonus-subform-row">
                        <input v-model="node.ref.bonusTitle" type="text" class="form-control form-control-sm" placeholder="ชื่อ VDO เสริม" style="flex:1;min-width:100px;" :disabled="node.ref._bonusLocked" />
                        <span v-if="node.ref._bonusLocked" class="lock-badge" @click="node.ref._bonusLocked = false" title="ปลดล็อก">🔒</span>
                        <div style="min-width:160px;">
                          <div style="display:flex;gap:3px;align-items:center;">
                            <input v-model="node.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="GLOBAL NoDRM UUID" :disabled="node.ref._bonusLocked" @input="scheduleBonusVerify(node.flatIdx)" />
                            <span v-if="node.ref._bonusVerifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._bonusVerified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._bonusVerified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._bonusBunnyName" class="bunny-filename" :title="node.ref._bonusBunnyName">{{ node.ref._bonusBunnyName }}</div>
                        </div>
                        <div style="min-width:160px;">
                          <div style="display:flex;gap:3px;align-items:center;">
                            <input v-model="node.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="GLOBAL DRM UUID" :disabled="node.ref._bonusLocked" @input="scheduleBonusDrmVerify(node.flatIdx)" />
                            <span v-if="node.ref._bonusDrmVerifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._bonusDrmVerified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._bonusDrmVerified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._bonusDrmName" class="bunny-filename drm" :title="node.ref._bonusDrmName">{{ node.ref._bonusDrmName }}</div>
                        </div>
                        <span class="tree-video-dur">{{ node.ref.bonusDuration && node.ref.bonusDuration !== '--:--' ? node.ref.bonusDuration : '--:--' }}</span>
                      </div>
                    </div>
                  </div>

                </template>
              </div>

              <div v-else style="padding: 20px; text-align: center; color: var(--gray); font-size: 13px; border: 1px dashed var(--border); border-radius: 8px; margin-top: 12px;">
                ยังไม่มีวีดีโอ — กด "+ เพิ่ม Topic" หรือ "+ เพิ่มวีดีโอ" เพื่อเริ่มเพิ่ม
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="submit" class="btn btn-primary" :disabled="saving || hasUnverifiedVideos">
                {{ saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึก' : 'เพิ่มเนื้อหา') }}
              </button>
              <button type="button" class="btn btn-outline" @click="cancelEdit">ยกเลิก</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Sections Table -->
      <div class="card">
        <div v-if="loading" style="padding: 40px; text-align: center; color: var(--gray);">
          กำลังโหลด...
        </div>
        <div v-else-if="error && sections.length === 0" style="text-align:center; padding:40px 20px; color:var(--danger);">
          <p>{{ error }}</p>
          <button class="btn btn-outline" style="margin-top:12px;" @click="fetchSections">ลองใหม่</button>
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>ชื่อ</th>
              <th>จำนวนวีดีโอ</th>
              <th>ความยาวรวม</th>
              <th>ลำดับ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="section in sortedSections" :key="section._id">
            <tr>
              <td>
                <span style="font-weight: 700; color: var(--primary); font-size: 13px; letter-spacing: 0.04em;">{{ section.code }}</span>
              </td>
              <td>{{ section.name }}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 13px; color: var(--gray);">{{ (section.videos || []).length }} วีดีโอ</span>
                </div>
              </td>
              <td>
                <span class="duration-display" :class="{ 'duration-empty': !totalDuration(section) }">
                  {{ totalDuration(section) || '--:--' }}
                </span>
              </td>
              <td style="font-size: 13px; color: var(--gray);">{{ section.order || 0 }}</td>
              <td style="white-space: nowrap;">
                <template v-if="deletingId === section._id">
                  <span style="font-size: 12px; color: #dc2626; font-weight: 600; margin-right: 6px;">ยืนยันลบ?</span>
                  <button class="btn btn-sm btn-danger" @click="deleteSection(section._id)">ลบเลย</button>
                  <button class="btn btn-sm btn-outline" style="margin-left: 4px;" @click="deletingId = null">ยกเลิก</button>
                </template>
                <template v-else>
                  <button class="btn btn-sm btn-outline" @click="editSection(section)">แก้ไข</button>
                  <button class="btn btn-sm btn-outline" style="margin-left: 4px;" @click="togglePdfPanel(section._id)">📄 PDF</button>
                  <button class="btn btn-sm btn-outline" style="margin-left: 4px; border-color:#0ea5e9; color:#0ea5e9;" @click="cloneSection(section)" :disabled="cloningId === section._id">{{ cloningId === section._id ? '...' : '📋 Clone' }}</button>
                  <button class="btn btn-sm btn-danger" style="margin-left: 4px;" @click="deletingId = section._id">ลบ</button>
                </template>
              </td>
            </tr>
            <!-- PDF panel — video list with upload/delete per video -->
            <tr v-if="pdfPanelId === section._id">
              <td colspan="6" style="padding: 12px 16px; background: #f8fafc;">
                <div style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">📄 PDF Mapping — {{ section.name }}</div>
                <!-- Tree: Topic → Subtopic → VDO -->
                <template v-for="t in getTopics(section)" :key="'t-'+t">
                  <!-- Topic row -->
                  <div style="display: flex; align-items: center; gap: 6px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; background: #f1f5f9;">
                    <span style="font-size: 14px; padding-left: 4px;">📂</span>
                    <span style="font-size: 12px; font-weight: 700; color: #3b82f6; flex: 1;">{{ t }}</span>
                    <span v-if="getSubtopicsOf(section, t).length > 0" style="font-size: 10px; color: #94a3b8; font-style: italic;" title="Topic ที่มี Subtopic ลูก ใส่ PDF ที่ระดับ Subtopic แทน">ใส่ PDF ที่ Sub →</span>
                    <select v-else style="font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe; max-width: 200px; background: #eff6ff;" :value="(section.topicPdfMap || {})[t] || ''" @change="setTopicPdf(section._id, t, $event.target.value)">
                      <option value="">— ไม่มี PDF —</option>
                      <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                    </select>
                  </div>
                  <!-- Subtopics under this topic -->
                  <template v-for="st in getSubtopicsOf(section, t)" :key="'st-'+st">
                    <div style="display: flex; align-items: center; gap: 6px; padding: 5px 0; padding-left: 24px; border-bottom: 1px solid #f1f5f9;">
                      <span style="font-size: 12px;">📁</span>
                      <span style="font-size: 11px; font-weight: 700; color: #8b5cf6; flex: 1;">{{ st }}</span>
                      <select style="font-size: 10px; padding: 2px 4px; border-radius: 4px; border: 1px solid #ddd6fe; max-width: 180px; background: #f5f3ff;" :value="(section.subtopicPdfMap || {})[st] || ''" @change="setSubtopicPdf(section._id, st, $event.target.value)">
                        <option value="">— ไม่มี PDF —</option>
                        <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                      </select>
                    </div>
                    <!-- Videos under this subtopic -->
                    <template v-for="(vid, vi) in getVideosOf(section, t, st)" :key="'v-'+vi">
                      <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; padding-left: 48px; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                        <span style="color: #94a3b8;">▸</span>
                        <span style="font-weight: 600; flex: 1; color: #475569;">{{ vid.title }}</span>
                        <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0; max-width: 160px;" :value="vid.pdfFile || ''" @change="setVideoPdf(section._id, vid._sortIdx, $event.target.value)">
                          <option value="">— ไม่มี —</option>
                          <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                        </select>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; padding-left: 64px; border-bottom: 1px solid #f8fafc; font-size: 11px; background: #fffbeb;">
                        <span style="color: #f59e0b;">⭐</span>
                        <span style="font-weight: 600; flex: 1; color: #92400e;">{{ vid.bonusTitle || vid.bonusLabel || 'เสริม' }}</span>
                        <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #fde68a; max-width: 160px; background: #fffbeb;" :value="vid.bonusPdfFile || ''" @change="setBonusPdf(section._id, vid._sortIdx, $event.target.value)">
                          <option value="">— ไม่มี —</option>
                          <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                        </select>
                      </div>
                    </template>
                  </template>
                  <!-- Videos under topic (no subtopic) -->
                  <template v-for="(vid, vi) in getVideosOf(section, t, '')" :key="'vt-'+vi">
                    <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; padding-left: 24px; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                      <span style="color: #94a3b8;">▸</span>
                      <span style="font-weight: 600; flex: 1; color: #475569;">{{ vid.title }}</span>
                      <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0; max-width: 160px;" :value="vid.pdfFile || ''" @change="setVideoPdf(section._id, vid._sortIdx, $event.target.value)">
                        <option value="">— ไม่มี —</option>
                        <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                      </select>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; padding-left: 40px; border-bottom: 1px solid #f8fafc; font-size: 11px; background: #fffbeb;">
                      <span style="color: #f59e0b;">⭐</span>
                      <span style="font-weight: 600; flex: 1; color: #92400e;">{{ vid.bonusTitle || vid.bonusLabel || 'เสริม' }}</span>
                      <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #fde68a; max-width: 160px; background: #fffbeb;" :value="vid.bonusPdfFile || ''" @change="setBonusPdf(section._id, vid._sortIdx, $event.target.value)">
                        <option value="">— ไม่มี —</option>
                        <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                      </select>
                    </div>
                  </template>
                </template>
                <!-- Videos without topic -->
                <template v-for="(vid, vi) in getVideosOf(section, '', '')" :key="'vn-'+vi">
                  <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                    <span style="color: #94a3b8;">▸</span>
                    <span style="font-weight: 600; flex: 1; color: #475569;">{{ vid.title }}</span>
                    <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0; max-width: 160px;" :value="vid.pdfFile || ''" @change="setVideoPdf(section._id, vid._sortIdx, $event.target.value)">
                      <option value="">— ไม่มี —</option>
                      <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                    </select>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; padding: 4px 0; padding-left: 16px; border-bottom: 1px solid #f8fafc; font-size: 11px; background: #fffbeb;">
                    <span style="color: #f59e0b;">⭐</span>
                    <span style="font-weight: 600; flex: 1; color: #92400e;">{{ vid.bonusTitle || vid.bonusLabel || 'เสริม' }}</span>
                    <select style="font-size: 10px; padding: 1px 4px; border-radius: 4px; border: 1px solid #fde68a; max-width: 160px; background: #fffbeb;" :value="vid.bonusPdfFile || ''" @change="setBonusPdf(section._id, vid._sortIdx, $event.target.value)">
                      <option value="">— ไม่มี —</option>
                      <option v-for="f in pdfLibrary" :key="f.name" :value="f.name">{{ f.name }}</option>
                    </select>
                  </div>
                </template>
              </td>
            </tr>
            </template>
            <tr v-if="sections.length === 0">
              <td colspan="6" style="text-align: center; color: var(--gray); padding: 40px;">ยังไม่มีเนื้อหา</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hidden PDF upload input -->
    <input ref="pdfInput" type="file" accept=".pdf" style="display:none" @change="onPdfSelected">

    <!-- 💾 Save to Content Library Modal -->
    <div v-if="saveContentModal.show" class="modal-overlay" @click.self="closeSaveContentModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>💾 บันทึกเข้า Content Library</h3>
          <button type="button" class="modal-close" @click="closeSaveContentModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>ชื่อ Content <span class="required">*</span></label>
            <input v-model="saveContentModal.title" type="text" class="form-control" placeholder="เช่น B1 Microbiology 8" />
          </div>
          <div class="form-row">
            <label>Tag Lv1 <span class="tag-hint">(หมวดหลัก)</span></label>
            <input v-model="saveContentModal.tagLv1" type="text" class="form-control" placeholder="เช่น Basic Science" list="lib-tags-lv1" />
            <datalist id="lib-tags-lv1">
              <option v-for="t in libTags.tagLv1" :key="t" :value="t"></option>
            </datalist>
          </div>
          <div class="form-row">
            <label>Tag Lv2 <span class="tag-hint">(หมวดย่อย)</span></label>
            <input v-model="saveContentModal.tagLv2" type="text" class="form-control" placeholder="เช่น Microbiology" list="lib-tags-lv2" />
            <datalist id="lib-tags-lv2">
              <option v-for="t in libTags.tagLv2" :key="t" :value="t"></option>
            </datalist>
          </div>
          <div class="form-row">
            <label>Tag Lv3 <span class="tag-hint">(หัวข้อย่อย)</span></label>
            <input v-model="saveContentModal.tagLv3" type="text" class="form-control" placeholder="เช่น Bacteriology" list="lib-tags-lv3" />
            <datalist id="lib-tags-lv3">
              <option v-for="t in libTags.tagLv3" :key="t" :value="t"></option>
            </datalist>
          </div>
          <div class="form-row">
            <label>Notes <span class="tag-hint">(optional)</span></label>
            <textarea v-model="saveContentModal.notes" class="form-control" rows="2" placeholder="โน้ตช่วยจำ..."></textarea>
          </div>
          <div class="preview-4-fields">
            <div class="preview-title">4 videoIds ที่จะบันทึก:</div>
            <div class="preview-row"><span>🌐 Bunny NoDRM</span><code>{{ saveContentModal.bunnyVideoId }}</code></div>
            <div class="preview-row"><span>🌐 Bunny Widevine</span><code>{{ saveContentModal.bunnyDrmVideoId }}</code></div>
            <div class="preview-row"><span>🇨🇳 Ali (dual encryption)</span><code>{{ saveContentModal.aliVideoId }}</code></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" @click="closeSaveContentModal" :disabled="saveContentModal.saving">ยกเลิก</button>
          <button type="button" class="btn btn-primary" @click="submitSaveContent" :disabled="!saveContentModal.title || saveContentModal.saving">
            {{ saveContentModal.saving ? 'กำลังบันทึก...' : '💾 บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 📚 Load from Content Library Modal -->
    <div v-if="loadContentModal.show" class="modal-overlay" @click.self="closeLoadContentModal">
      <div class="modal-card modal-card-wide">
        <div class="modal-header">
          <h3>📚 โหลดจาก Content Library</h3>
          <button type="button" class="modal-close" @click="closeLoadContentModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="load-filter-bar">
            <input v-model="loadContentModal.search" type="text" placeholder="🔍 ค้นหาชื่อ" class="form-control" @input="debouncedLoadContents" />
            <select v-model="loadContentModal.tagLv1" class="form-control" @change="fetchLibContents">
              <option value="">ทุก Lv1</option>
              <option v-for="t in libTags.tagLv1" :key="t" :value="t">{{ t }}</option>
            </select>
            <select v-model="loadContentModal.tagLv2" class="form-control" @change="fetchLibContents">
              <option value="">ทุก Lv2</option>
              <option v-for="t in libTags.tagLv2" :key="t" :value="t">{{ t }}</option>
            </select>
            <select v-model="loadContentModal.tagLv3" class="form-control" @change="fetchLibContents">
              <option value="">ทุก Lv3</option>
              <option v-for="t in libTags.tagLv3" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div v-if="loadContentModal.loading" class="load-empty">กำลังโหลด...</div>
          <div v-else-if="loadContentModal.contents.length === 0" class="load-empty">
            <div style="font-size:32px;">📭</div>
            <div>ไม่พบ Content — ลองปรับ filter หรือเพิ่ม content ที่ /admin/content-library</div>
          </div>
          <div v-else class="load-list">
            <div v-for="c in loadContentModal.contents" :key="c._id" class="load-item" @click="selectLibContent(c)">
              <div class="load-item-main">
                <div class="load-item-title">{{ c.title }}</div>
                <div class="load-item-tags">
                  <span v-if="c.tagLv1" class="tag-chip lv1">{{ c.tagLv1 }}</span>
                  <span v-if="c.tagLv2" class="tag-chip lv2">{{ c.tagLv2 }}</span>
                  <span v-if="c.tagLv3" class="tag-chip lv3">{{ c.tagLv3 }}</span>
                </div>
                <div v-if="c.notes" class="load-item-notes">{{ c.notes }}</div>
              </div>
              <div class="load-item-meta">
                <div class="load-item-dur">{{ c.duration || '--:--' }}</div>
                <div class="load-item-check">✓ 4/4</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="load-count">{{ loadContentModal.contents.length }} contents</div>
          <button type="button" class="btn btn-outline" @click="closeLoadContentModal">ยกเลิก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

export default {
  name: 'ManageSections',
  data() {
    return {
      sections: [],
      loading: false,
      saving: false,
      error: null,
      successMsg: '',
      showForm: false,
      editingId: null,
      deletingId: null,
      cloningId: null,
      _openMenuIdx: null,  // ⭐ index of open action menu (null = closed)
      pdfPanelId: null,
      pdfLibrary: [], // PDF files from Bunny Storage
      refreshing: false,
      collapsed: {},
      // 💾 Save to Content Library
      saveContentModal: {
        show: false,
        saving: false,
        title: '',
        tagLv1: '',
        tagLv2: '',
        tagLv3: '',
        notes: '',
        bunnyVideoId: '', bunnyDrmVideoId: '', aliVideoId: '',
        _videoRef: null
      },
      libTags: { tagLv1: [], tagLv2: [], tagLv3: [] },
      // 📚 Load from Content Library
      loadContentModal: {
        show: false,
        loading: false,
        search: '',
        tagLv1: '', tagLv2: '', tagLv3: '',
        contents: [],
        _videoRef: null,
        _debounceTimer: null
      },
      form: {
        code: '',
        name: '',
        description: '',
        order: 0,
        videos: []
      },
      // ─── Self Check ───
      selfCheckTemplates: [],
      selfCheckBindings: {}    // key: "scope:refId" → binding doc
    }
  },
  computed: {
    sortedSections() {
      return [...this.sections].sort((a, b) => (a.order || 0) - (b.order || 0))
    },
    hasUnverifiedVideos() {
      const vids = this.form.videos.filter(v => (v.bunnyVideoId || '').trim())
      if (vids.length === 0) return false
      // เช็คทั้ง VDO หลัก + VDO พิเศษ
      return vids.some(v => v._verified !== true || v._verifying) ||
        this.form.videos.filter(v => (v.bonusBunnyVideoId || '').trim()).some(v => v._bonusVerified !== true || v._bonusVerifying)
    },
    // Build tree structure from flat videos array for display
    treeStructure() {
      const videos = this.form.videos
      const tree = []
      let i = 0
      while (i < videos.length) {
        const v = videos[i]
        if (v.topic) {
          // Collect all videos with same topic
          const topicName = v.topic
          const topicNode = { type: 'topic', name: topicName, originalName: topicName, topicId: v.topicId || '', children: [], videoCount: 0 }
          while (i < videos.length && videos[i].topic === topicName) {
            const cv = videos[i]
            if (cv.subtopic) {
              // Collect subtopic group
              const subName = cv.subtopic
              let subNode = topicNode.children.find(c => c.type === 'subtopic' && c.name === subName)
              if (!subNode) {
                subNode = { type: 'subtopic', name: subName, originalName: subName, subtopicId: cv.subtopicId || '', videos: [] }
                topicNode.children.push(subNode)
              }
              subNode.videos.push({ flatIdx: i, ref: cv })
              topicNode.videoCount++
            } else {
              // Video directly under topic (no subtopic)
              topicNode.children.push({ type: 'video', flatIdx: i, ref: cv })
              topicNode.videoCount++
            }
            i++
          }
          tree.push(topicNode)
        } else {
          // Root-level video (no topic)
          tree.push({ type: 'video', flatIdx: i, ref: v })
          i++
        }
      }
      return tree
    }
  },
  async mounted() {
    await this.fetchSections()
    this.loadSelfCheckTemplates()
    this.loadPdfLibrary()
    // ⭐ ปิด action menu เมื่อคลิกที่อื่น
    this._onDocClick = () => { this._openMenuIdx = null }
    document.addEventListener('click', this._onDocClick)
  },
  beforeUnmount() {
    if (this._onDocClick) document.removeEventListener('click', this._onDocClick)
  },
  methods: {
    // ⭐ Toggle action menu (⋯ dropdown)
    toggleActionMenu(idx) {
      this._openMenuIdx = this._openMenuIdx === idx ? null : idx
    },
    _closeActionMenu() {
      this._openMenuIdx = null
    },
    // ═══ 💾 Save to Content Library ═══
    // ⭐ ครบ 4 fields + ยัง"ไม่ได้"ผูก Library อยู่ = แสดงปุ่มบันทึก
    //    ถ้ามี contentId แล้ว = มาจาก Library อยู่แล้ว → ไม่ต้องบันทึกซ้ำ
    isFourFieldsComplete(video) {
      if (video.contentId) return false
      return !!(video.bunnyVideoId && video.bunnyDrmVideoId && video.aliVideoId)
    },
    async openSaveContentModal(video) {
      // Fetch existing tags for autocomplete
      try {
        const res = await api.get('/admin/video-contents/tags')
        this.libTags = { tagLv1: res.tagLv1 || [], tagLv2: res.tagLv2 || [], tagLv3: res.tagLv3 || [] }
      } catch (e) {
        this.libTags = { tagLv1: [], tagLv2: [], tagLv3: [] }
      }
      this.saveContentModal = {
        show: true,
        saving: false,
        title: video.title || '',
        tagLv1: '', tagLv2: '', tagLv3: '',
        notes: '',
        bunnyVideoId: video.bunnyVideoId,
        bunnyDrmVideoId: video.bunnyDrmVideoId,
        aliVideoId: video.aliVideoId,
        _videoRef: video
      }
    },
    closeSaveContentModal() {
      this.saveContentModal.show = false
    },
    // ═══ 📚 Load from Content Library ═══
    async openLoadContentModal(video) {
      this.loadContentModal = {
        show: true,
        loading: false,
        search: '',
        tagLv1: '', tagLv2: '', tagLv3: '',
        contents: [],
        _videoRef: video,
        _debounceTimer: null
      }
      try {
        const res = await api.get('/admin/video-contents/tags')
        this.libTags = { tagLv1: res.tagLv1 || [], tagLv2: res.tagLv2 || [], tagLv3: res.tagLv3 || [] }
      } catch (e) {}
      await this.fetchLibContents()
    },
    closeLoadContentModal() {
      this.loadContentModal.show = false
    },
    debouncedLoadContents() {
      clearTimeout(this.loadContentModal._debounceTimer)
      this.loadContentModal._debounceTimer = setTimeout(() => this.fetchLibContents(), 300)
    },
    async fetchLibContents() {
      this.loadContentModal.loading = true
      try {
        const params = {}
        const m = this.loadContentModal
        if (m.search) params.search = m.search
        if (m.tagLv1) params.tagLv1 = m.tagLv1
        if (m.tagLv2) params.tagLv2 = m.tagLv2
        if (m.tagLv3) params.tagLv3 = m.tagLv3
        const res = await api.get('/admin/video-contents', { params })
        this.loadContentModal.contents = res.contents || []
      } catch (err) {
        this.loadContentModal.contents = []
      } finally {
        this.loadContentModal.loading = false
      }
    },
    async selectLibContent(content) {
      const video = this.loadContentModal._videoRef
      if (!video) return
      const hasExisting = video.bunnyVideoId || video.bunnyDrmVideoId || video.aliVideoId || video.contentId
      if (hasExisting) {
        const proceed = confirm(`⚠️ VDO นี้มีข้อมูลอยู่แล้ว\n\nต้องการเปลี่ยนเป็น "${content.title}"?`)
        if (!proceed) return
      }
      // ⭐ Link mode: save contentId only + snapshot for offline display
      // Backend จะ override 4 videoIds จาก Library ตอน serve
      video.contentId = content._id
      video.title = content.title
      video.bunnyVideoId = content.bunnyVideoId
      video.bunnyDrmVideoId = content.bunnyDrmVideoId
      video.aliVideoId = content.aliVideoId
      if (content.duration) video.duration = content.duration
      video._linkedContentTitle = content.title
      video._verified = true
      video._drmVerified = true
      video._aliVerified = true
      this.$forceUpdate()
      this.closeLoadContentModal()
      // ⭐ Auto-save เข้า DB ทันที (มิฉะนั้น refresh หน้าแล้ว link จะหาย)
      // Tree view = อยู่ใน edit mode เสมอ (v-if="showForm") → save via editingId
      try {
        if (this.editingId) {
          await api.put(`/admin/sections/${this.editingId}`, {
            videos: this.form.videos.map(v => this._sanitizeVideo(v))
          })
          this.successMsg = `🔗 ผูก Library: ${content.title}`
        }
      } catch (err) {
        this.errorMsg = 'บันทึก link ไม่สำเร็จ — refresh หน้าแล้วอาจหาย'
      }
    },
    // ⭐ Whitelist fields ที่ schema รู้จัก — ตัด _underscore fields (verified, locked, ฯลฯ) ออก
    // ใช้ที่เดียวกับ handleSubmit payload → maintain ที่เดียว
    _sanitizeVideo(v) {
      return {
        contentId: v.contentId || null,
        title: (v.title || '').trim(),
        topic: (v.topic || '').trim(),
        subtopic: (v.subtopic || '').trim(),
        topicId: v.topicId || '',
        subtopicId: v.subtopicId || '',
        bunnyVideoId: (v.bunnyVideoId || '').trim(),
        bunnyDrmVideoId: (v.bunnyDrmVideoId || '').trim(),
        aliVideoId: (v.aliVideoId || '').trim(),
        bunnyLibraryId: v.bunnyLibraryId || '628424',
        duration: v.duration || '',
        order: v.order || 0,
        requiredTier: [1, 2, 3, 4, 5, 6].includes(v.requiredTier) ? v.requiredTier : 6,
        pdfFile: v.pdfFile || '',
        pdfFileName: v.pdfFileName || '',
        pdfFileUrl: v.pdfFileUrl || '',
        pdfEnabled: v.pdfEnabled !== false,
        bonusLabel: (v.bonusLabel || '').trim(),
        bonusTitle: (v.bonusTitle || '').trim(),
        bonusBunnyVideoId: (v.bonusBunnyVideoId || '').trim(),
        bonusBunnyDrmVideoId: (v.bonusBunnyDrmVideoId || '').trim(),
        bonusAliVideoId: (v.bonusAliVideoId || '').trim(),
        bonusDuration: v.bonusDuration || '',
        bonusPdfFile: (v.bonusPdfFile || '').trim(),
        bonusPdfFileName: (v.bonusPdfFileName || '').trim()
      }
    },
    unlinkContent(video) {
      if (!video.contentId) return
      const proceed = confirm(`ปลด link จาก Content Library?\n\nID จะยังอยู่ในฟิลด์ แต่จะไม่ sync กับ Library แล้ว\n(ยกเลิกไม่ได้จนกว่าจะ Load ใหม่)`)
      if (!proceed) return
      video.contentId = null
      video._linkedContentTitle = ''
      this.$forceUpdate()
    },
    async submitSaveContent() {
      const m = this.saveContentModal
      if (!m.title.trim()) { alert('กรอกชื่อ Content'); return }
      m.saving = true
      try {
        await api.post('/admin/video-contents', {
          title: m.title.trim(),
          tagLv1: m.tagLv1.trim(),
          tagLv2: m.tagLv2.trim(),
          tagLv3: m.tagLv3.trim(),
          bunnyVideoId: m.bunnyVideoId,
          bunnyDrmVideoId: m.bunnyDrmVideoId,
          aliVideoId: m.aliVideoId,
          duration: m._videoRef?.duration || '',
          notes: m.notes.trim()
        })
        // Mark video so save button hides
        if (m._videoRef) m._videoRef._savedToLib = true
        alert('✅ บันทึกเข้า Library แล้ว')
        this.closeSaveContentModal()
      } catch (err) {
        alert('บันทึกไม่สำเร็จ: ' + (err.response?.data?.error || err.message))
      } finally {
        m.saving = false
      }
    },
    // ─── Self Check ───
    async loadSelfCheckTemplates() {
      try {
        const res = await api.get('/admin/self-checks/templates')
        this.selfCheckTemplates = (res.templates || []).filter(t => t.isPublished !== false)
      } catch (e) { /* silent */ }
    },
    async loadSelfCheckBindings(sectionId) {
      try {
        const res = await api.get('/admin/self-checks/section-topics/' + sectionId)
        const map = {}
        for (const t of (res.topics || [])) {
          if (t.binding) map['topic:' + t.id] = t.binding
          for (const s of (t.subtopics || [])) {
            if (s.binding) map['subtopic:' + s.id] = s.binding
          }
        }
        this.selfCheckBindings = map
      } catch (e) { this.selfCheckBindings = {} }
    },
    selfCheckBindingValue(scope, refId) {
      return this.selfCheckBindings[scope + ':' + refId]?.templateSlug || ''
    },
    async bindSelfCheck(scope, refId, refName, ev) {
      const slug = ev.target.value
      const key = scope + ':' + refId
      try {
        if (!slug) {
          // ลบ binding
          const existing = this.selfCheckBindings[key]
          if (existing?._id) await api.delete('/admin/self-checks/bindings/' + existing._id)
          delete this.selfCheckBindings[key]
          this.selfCheckBindings = { ...this.selfCheckBindings }
        } else {
          const res = await api.post('/admin/self-checks/bindings', {
            scope, refId, templateSlug: slug, sectionId: this.editingId, refNameSnapshot: refName
          })
          this.selfCheckBindings = { ...this.selfCheckBindings, [key]: res.binding }
        }
      } catch (err) {
        alert('บันทึก binding ไม่สำเร็จ: ' + (err?.response?.data?.message || err.message))
        ev.target.value = this.selfCheckBindingValue(scope, refId)
      }
    },
    async refreshDurations() {
      this.refreshing = true
      try {
        const data = await api.post('/admin/refresh-durations')
        this.successMsg = `Sync เวลาเสร็จ — อัปเดต ${data.updated} จาก ${data.total} วีดีโอ`
        setTimeout(() => { this.successMsg = '' }, 5000)
        await this.fetchSections()
      } catch (err) {
        this.error = err.response?.data?.message || 'Sync เวลาล้มเหลว'
      } finally { this.refreshing = false }
    },
    async fetchSections() {
      this.loading = true
      this.error = null
      try {
        const data = await api.get('/admin/sections')
        this.sections = data.sections || data
      } catch (err) {
        this.error = err.response?.data?.message || 'โหลดข้อมูลล้มเหลว'
      } finally {
        this.loading = false
      }
    },

    // === Collapse/Expand ===
    toggleCollapse(level, key) {
      const k = level + ':' + key
      this.collapsed = { ...this.collapsed, [k]: !this.collapsed[k] }
    },
    isCollapsed(level, key) {
      return !!this.collapsed[level + ':' + key]
    },

    // === Add Topic / Subtopic / Video ===
    _newVideoRow(topic = '', subtopic = '') {
      return {
        title: '',
        topic,
        subtopic,
        bunnyVideoId: '',
        bunnyDrmVideoId: '',
        aliVideoId: '',
        bunnyLibraryId: '628424',
        duration: '--:--',
        order: 0,
        requiredTier: 6,
        _verified: null,
        _verifying: false,
        _bunnyName: '',
        _bunnyDuration: 0,
        _drmVerified: null,
        _drmVerifying: false,
        _drmDuration: '',
        _drmDurationSec: 0,
        _drmName: '',
        _aliVerified: null,
        _aliVerifying: false,
        _aliName: '',
        _aliDuration: 0,
        _aliVerifyReason: '',
        _renaming: false,
        _durationMismatch: false,
        _locked: false,
        // VDO พิเศษ
        bonusLabel: '',
        bonusTitle: '',
        bonusBunnyVideoId: '',
        bonusBunnyDrmVideoId: '',
        bonusDuration: '--:--',
        bonusPdfFile: '',
        bonusPdfFileName: '',
        _bonusExpanded: false,
        _bonusLocked: false,
        _bonusVerified: null,
        _bonusVerifying: false,
        _bonusBunnyName: '',
        _bonusDrmVerified: null,
        _bonusDrmVerifying: false,
        _bonusDrmName: ''
      }
    },
    addTopicRow() {
      const name = prompt('ชื่อ Topic:')
      if (!name || !name.trim()) return
      const row = this._newVideoRow(name.trim())
      row.order = this.form.videos.length
      this.form.videos.push(row)
    },

    // === เอกสารล้วน — VDO ที่ไม่มี video id เลย แต่มี pdfFile ===
    _isDocRow(v) {
      if (!v) return false
      return !((v.bunnyVideoId || '').trim()) &&
             !((v.bunnyDrmVideoId || '').trim()) &&
             !((v.aliVideoId || '').trim())
    },
    _newDocRow(topic = '', subtopic = '') {
      const row = this._newVideoRow(topic, subtopic)
      row.pdfFile = ''
      row.pdfFileName = ''
      row.pdfEnabled = true
      // ผ่าน verify ทันที (ไม่ต้องรอ Bunny/Ali)
      row._verified = true
      row._drmVerified = true
      row._aliVerified = true
      return row
    },
    addDocRow() {
      const name = prompt('ชื่อเอกสาร:')
      if (!name || !name.trim()) return
      const row = this._newDocRow()
      row.title = name.trim()
      row.order = this.form.videos.length
      this.form.videos.push(row)
    },
    addDocInTopic(topicName) {
      const name = prompt(`ชื่อเอกสารใน "${topicName}":`)
      if (!name || !name.trim()) return
      let lastIdx = -1
      this.form.videos.forEach((v, i) => { if (v.topic === topicName) lastIdx = i })
      const row = this._newDocRow(topicName)
      row.title = name.trim()
      this.form.videos.splice(lastIdx + 1, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    addDocInSubtopic(topicName, subtopicName) {
      const name = prompt(`ชื่อเอกสารใน "${subtopicName}":`)
      if (!name || !name.trim()) return
      let lastIdx = -1
      this.form.videos.forEach((v, i) => {
        if (v.topic === topicName && v.subtopic === subtopicName) lastIdx = i
      })
      const row = this._newDocRow(topicName, subtopicName)
      row.title = name.trim()
      this.form.videos.splice(lastIdx + 1, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    addSubtopicInTopic(topicName) {
      const name = prompt('ชื่อ Subtopic:')
      if (!name || !name.trim()) return
      let lastIdx = -1
      this.form.videos.forEach((v, i) => { if (v.topic === topicName) lastIdx = i })
      const row = this._newVideoRow(topicName, name.trim())
      this.form.videos.splice(lastIdx + 1, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    addVideoInTopic(topicName) {
      let lastIdx = -1
      this.form.videos.forEach((v, i) => { if (v.topic === topicName) lastIdx = i })
      const row = this._newVideoRow(topicName)
      this.form.videos.splice(lastIdx + 1, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    bulkSetTier(scope, topicName, subtopicName, ev) {
      const tier = parseInt(ev.target.value, 10)
      ev.target.value = ''
      if (!tier || ![1, 2, 3, 4, 5, 6].includes(tier)) return
      let count = 0
      for (const v of this.form.videos) {
        if (scope === 'topic' && v.topic === topicName) {
          v.requiredTier = tier
          count++
        } else if (scope === 'subtopic' && v.topic === topicName && v.subtopic === subtopicName) {
          v.requiredTier = tier
          count++
        }
      }
      this.successMsg = `ตั้งระดับ ${tier} ให้ ${count} VDO แล้ว (อย่าลืมกดบันทึก)`
      setTimeout(() => { this.successMsg = '' }, 3000)
    },
    addVideoInSubtopic(topicName, subtopicName) {
      let lastIdx = -1
      this.form.videos.forEach((v, i) => { if (v.topic === topicName && v.subtopic === subtopicName) lastIdx = i })
      const row = this._newVideoRow(topicName, subtopicName)
      this.form.videos.splice(lastIdx + 1, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    addVideo() {
      this.form.videos.push({
        title: '',
        topic: '',
        subtopic: '',
        bunnyVideoId: '',
        bunnyDrmVideoId: '',
        aliVideoId: '',
        bunnyLibraryId: '628424',
        duration: '--:--',
        order: this.form.videos.length + 1,
        _verified: null,
        _verifying: false,
        _bunnyDuration: 0,
        _drmVerified: null,
        _drmVerifying: false,
        _drmDuration: '',
        _drmDurationSec: 0,
        _aliVerified: null,
        _aliVerifying: false,
        _aliName: '',
        _aliDuration: 0,
        _aliVerifyReason: '',
        _locked: false
      })
    },

    // === Rename ===
    renameTopic(oldName, newName) {
      if (!newName || oldName === newName) return
      this.form.videos.forEach(v => { if (v.topic === oldName) v.topic = newName })
    },
    renameSubtopic(topicName, oldName, newName) {
      if (!newName || oldName === newName) return
      this.form.videos.forEach(v => { if (v.topic === topicName && v.subtopic === oldName) v.subtopic = newName })
    },

    // === Insert Topic before ===
    insertTopicBefore(beforeTopicName) {
      const name = prompt('ชื่อ Topic ใหม่:')
      if (!name || !name.trim()) return
      // หา index แรกของ topic ที่อยู่ข้างหน้า
      const firstIdx = this.form.videos.findIndex(v => v.topic === beforeTopicName)
      if (firstIdx === -1) return
      const row = this._newVideoRow(name.trim())
      this.form.videos.splice(firstIdx, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Insert Subtopic before ===
    insertSubtopicBefore(topicName, beforeSubtopicName) {
      const name = prompt('ชื่อ Subtopic ใหม่:')
      if (!name || !name.trim()) return
      // หา index แรกของ subtopic ที่อยู่ข้างหน้า
      const firstIdx = this.form.videos.findIndex(v => v.topic === topicName && v.subtopic === beforeSubtopicName)
      if (firstIdx === -1) return
      const row = this._newVideoRow(topicName, name.trim())
      this.form.videos.splice(firstIdx, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Insert video before ===
    insertVideoBefore(flatIdx) {
      const ref = this.form.videos[flatIdx]
      const row = this._newVideoRow(ref.topic || '', ref.subtopic || '')
      this.form.videos.splice(flatIdx, 0, row)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Remove Topic / Subtopic ===
    confirmDelete(msg) {
      const pwd = prompt(`${msg}\n\nกรอกรหัสเพื่อยืนยันลบ:`)
      if (pwd === null) return false
      if (pwd !== 'medninja') { alert('รหัสไม่ถูกต้อง'); return false }
      return true
    },
    removeTopic(topicName) {
      if (!this.confirmDelete(`ลบ Topic "${topicName}" และวีดีโอทั้งหมดใน Topic?`)) return
      this.form.videos = this.form.videos.filter(v => v.topic !== topicName)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    removeSubtopic(topicName, subtopicName) {
      if (!this.confirmDelete(`ลบ Subtopic "${subtopicName}" และวีดีโอทั้งหมด?`)) return
      this.form.videos = this.form.videos.filter(v => !(v.topic === topicName && v.subtopic === subtopicName))
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Move Topic up/down ===
    moveTopicUp(topicName) {
      const videos = this.form.videos
      // หา index แรก-สุดท้ายของ topic นี้
      const first = videos.findIndex(v => v.topic === topicName)
      if (first <= 0) return
      // หา topic/video ก่อนหน้า
      let prevStart = first - 1
      if (videos[prevStart].topic && videos[prevStart].topic !== topicName) {
        const prevTopic = videos[prevStart].topic
        prevStart = videos.findIndex(v => v.topic === prevTopic)
      }
      // ดึง topic group ออก แล้วแทรกก่อน prevStart
      const topicVideos = videos.filter(v => v.topic === topicName)
      this.form.videos = videos.filter(v => v.topic !== topicName)
      this.form.videos.splice(prevStart, 0, ...topicVideos)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    moveTopicDown(topicName) {
      const videos = this.form.videos
      const last = videos.length - 1 - [...videos].reverse().findIndex(v => v.topic === topicName)
      if (last >= videos.length - 1) return
      // หา group ถัดไป
      let nextEnd = last + 1
      if (videos[nextEnd] && videos[nextEnd].topic) {
        const nextTopic = videos[nextEnd].topic
        nextEnd = videos.length - 1 - [...videos].reverse().findIndex(v => v.topic === nextTopic)
      }
      // ดึง topic group ออก แล้วแทรกหลัง nextEnd
      const topicVideos = videos.filter(v => v.topic === topicName)
      this.form.videos = videos.filter(v => v.topic !== topicName)
      const insertAt = Math.min(nextEnd - topicVideos.length + 1, this.form.videos.length)
      this.form.videos.splice(insertAt, 0, ...topicVideos)
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    isLastTopic(tIdx) {
      for (let i = tIdx + 1; i < this.treeStructure.length; i++) {
        if (this.treeStructure[i].type === 'topic') return false
      }
      return true
    },

    // === Move Subtopic up/down within topic ===
    moveSubtopicUp(topicName, subtopicName) {
      // ดึง subtopic order ปัจจุบันจาก flat array (ตามลำดับที่ปรากฏ)
      const inTopic = this.form.videos.filter(v => v.topic === topicName && v.subtopic)
      const subtopicOrder = []
      for (const v of inTopic) {
        if (!subtopicOrder.includes(v.subtopic)) subtopicOrder.push(v.subtopic)
      }
      const sIdx = subtopicOrder.indexOf(subtopicName)
      if (sIdx <= 0) return
      // Swap order
      ;[subtopicOrder[sIdx - 1], subtopicOrder[sIdx]] = [subtopicOrder[sIdx], subtopicOrder[sIdx - 1]]
      this._resortTopicVideos(topicName, subtopicOrder)
    },
    moveSubtopicDown(topicName, subtopicName) {
      const inTopic = this.form.videos.filter(v => v.topic === topicName && v.subtopic)
      const subtopicOrder = []
      for (const v of inTopic) {
        if (!subtopicOrder.includes(v.subtopic)) subtopicOrder.push(v.subtopic)
      }
      const sIdx = subtopicOrder.indexOf(subtopicName)
      if (sIdx >= subtopicOrder.length - 1) return
      ;[subtopicOrder[sIdx], subtopicOrder[sIdx + 1]] = [subtopicOrder[sIdx + 1], subtopicOrder[sIdx]]
      this._resortTopicVideos(topicName, subtopicOrder)
    },
    _resortTopicVideos(topicName, subtopicOrder) {
      // จัดเรียง videos ใน topic ตาม subtopicOrder — videos ย้ายตาม subtopic
      const before = []
      const topicVideos = []
      const after = []
      let inTopicZone = false
      for (const v of this.form.videos) {
        if (v.topic === topicName) {
          inTopicZone = true
          topicVideos.push(v)
        } else {
          if (!inTopicZone) before.push(v)
          else after.push(v)
        }
      }
      // จัดเรียง: videos ไม่มี subtopic ก่อน → แล้วตาม subtopicOrder
      const noSub = topicVideos.filter(v => !v.subtopic)
      const sorted = [...noSub]
      for (const sub of subtopicOrder) {
        sorted.push(...topicVideos.filter(v => v.subtopic === sub))
      }
      this.form.videos = [...before, ...sorted, ...after]
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Assign video to subtopic ===
    assignToSubtopic(topicName, flatIdx) {
      // หา subtopics ที่มีอยู่ใน topic นี้
      const existingSubs = [...new Set(
        this.form.videos.filter(v => v.topic === topicName && v.subtopic).map(v => v.subtopic)
      )]
      let choice
      if (existingSubs.length > 0) {
        const list = existingSubs.map((s, i) => `${i + 1}. ${s}`).join('\n')
        const input = prompt(`ย้ายเข้า Subtopic:\n${list}\n\nพิมพ์เลข (1-${existingSubs.length}) เพื่อเลือก\nหรือพิมพ์ชื่อใหม่เพื่อสร้าง Subtopic ใหม่:`)
        if (!input || !input.trim()) return
        const num = parseInt(input)
        if (num >= 1 && num <= existingSubs.length) {
          choice = existingSubs[num - 1]
        } else {
          choice = input.trim()
        }
      } else {
        choice = prompt('ชื่อ Subtopic ใหม่:')
        if (!choice || !choice.trim()) return
        choice = choice.trim()
      }
      // set subtopic + ย้ายไปอยู่ท้ายกลุ่ม subtopic นั้น
      const video = this.form.videos[flatIdx]
      video.subtopic = choice
      // ย้ายไป insert หลัง video ตัวสุดท้ายของ subtopic นั้น
      this.form.videos.splice(flatIdx, 1)
      let insertAt = -1
      for (let i = this.form.videos.length - 1; i >= 0; i--) {
        if (this.form.videos[i].topic === topicName && this.form.videos[i].subtopic === choice) {
          insertAt = i + 1
          break
        }
      }
      if (insertAt === -1) {
        // ถ้ายังไม่มี subtopic นี้ → ใส่ท้าย topic
        for (let i = this.form.videos.length - 1; i >= 0; i--) {
          if (this.form.videos[i].topic === topicName) { insertAt = i + 1; break }
        }
      }
      this.form.videos.splice(insertAt, 0, video)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Assign video to topic (for root-level videos) ===
    assignToTopic(flatIdx) {
      const existingTopics = [...new Set(this.form.videos.filter(v => v.topic).map(v => v.topic))]
      let choice
      if (existingTopics.length > 0) {
        const list = existingTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')
        const input = prompt(`ย้ายเข้า Topic:\n${list}\n\nพิมพ์เลข (1-${existingTopics.length}) เพื่อเลือก\nหรือพิมพ์ชื่อใหม่:`)
        if (!input || !input.trim()) return
        const num = parseInt(input)
        if (num >= 1 && num <= existingTopics.length) {
          choice = existingTopics[num - 1]
        } else {
          choice = input.trim()
        }
      } else {
        choice = prompt('ชื่อ Topic ใหม่:')
        if (!choice || !choice.trim()) return
        choice = choice.trim()
      }
      const video = this.form.videos[flatIdx]
      video.topic = choice
      // ย้ายไปท้าย topic นั้น
      this.form.videos.splice(flatIdx, 1)
      let insertAt = this.form.videos.length
      for (let i = this.form.videos.length - 1; i >= 0; i--) {
        if (this.form.videos[i].topic === choice) { insertAt = i + 1; break }
      }
      this.form.videos.splice(insertAt, 0, video)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === ย้าย video ไป topic/subtopic ใดก็ได้ ===
    moveVideoTo(flatIdx) {
      const video = this.form.videos[flatIdx]
      const existingTopics = [...new Set(this.form.videos.filter(v => v.topic).map(v => v.topic))]

      // Step 1: เลือก Topic
      let topicChoice = ''
      if (existingTopics.length > 0) {
        const list = existingTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')
        const input = prompt(
          `ย้าย "${video.title}" ไป Topic:\n` +
          `${list}\n` +
          `0. ไม่มี Topic (root level)\n\n` +
          `พิมพ์เลข (0-${existingTopics.length}) เพื่อเลือก\nหรือพิมพ์ชื่อใหม่เพื่อสร้าง Topic ใหม่:`
        )
        if (input === null) return
        const num = parseInt(input)
        if (input.trim() === '0') {
          topicChoice = ''
        } else if (num >= 1 && num <= existingTopics.length) {
          topicChoice = existingTopics[num - 1]
        } else if (input.trim()) {
          topicChoice = input.trim()
        } else {
          return
        }
      } else {
        const input = prompt(`ย้าย "${video.title}" ไป Topic:\n\nพิมพ์ชื่อ Topic (หรือเว้นว่างสำหรับ root level):`)
        if (input === null) return
        topicChoice = input.trim()
      }

      // Step 2: ถ้ามี Topic → เลือก Subtopic
      let subChoice = ''
      if (topicChoice) {
        const existingSubs = [...new Set(
          this.form.videos.filter(v => v.topic === topicChoice && v.subtopic).map(v => v.subtopic)
        )]
        if (existingSubs.length > 0) {
          const list = existingSubs.map((s, i) => `${i + 1}. ${s}`).join('\n')
          const input = prompt(
            `เลือก Subtopic ใน "${topicChoice}":\n` +
            `${list}\n` +
            `0. ไม่มี Subtopic (อยู่ใต้ Topic ตรง)\n\n` +
            `พิมพ์เลข (0-${existingSubs.length}) หรือพิมพ์ชื่อใหม่:`
          )
          if (input === null) return
          const num = parseInt(input)
          if (input.trim() === '0') {
            subChoice = ''
          } else if (num >= 1 && num <= existingSubs.length) {
            subChoice = existingSubs[num - 1]
          } else if (input.trim()) {
            subChoice = input.trim()
          }
        }
        // ถ้าไม่มี subtopic → ไม่ต้องถาม (subChoice = '')
      }

      // Apply
      video.topic = topicChoice
      video.subtopic = subChoice

      // ย้ายไปท้ายกลุ่มที่เลือก
      this.form.videos.splice(flatIdx, 1)
      let insertAt = this.form.videos.length
      if (topicChoice && subChoice) {
        for (let i = this.form.videos.length - 1; i >= 0; i--) {
          if (this.form.videos[i].topic === topicChoice && this.form.videos[i].subtopic === subChoice) {
            insertAt = i + 1; break
          }
        }
      } else if (topicChoice) {
        for (let i = this.form.videos.length - 1; i >= 0; i--) {
          if (this.form.videos[i].topic === topicChoice) {
            insertAt = i + 1; break
          }
        }
      }
      this.form.videos.splice(insertAt, 0, video)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    // === Move video within its group ===
    moveVideoInGroup(topicName, subtopicName, localIdx, dir) {
      // Find videos in this group
      const groupVideos = this.form.videos.filter(v =>
        v.topic === topicName && v.subtopic === (subtopicName || '')
      )
      if (localIdx + dir < 0 || localIdx + dir >= groupVideos.length) return
      // Get flat indices
      const fromFlatIdx = this.form.videos.indexOf(groupVideos[localIdx])
      const toFlatIdx = this.form.videos.indexOf(groupVideos[localIdx + dir])
      // Swap in flat array
      const temp = this.form.videos[fromFlatIdx]
      this.form.videos.splice(fromFlatIdx, 1)
      this.form.videos.splice(toFlatIdx, 0, temp)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    scheduleVerify(idx) {
      const video = this.form.videos[idx]
      video._verified = null
      clearTimeout(video._verifyTimer)
      video._verifyTimer = setTimeout(() => {
        this.$nextTick(() => this.verifyVideo(idx))
      }, 500)
    },

    async verifyVideo(idx) {
      const video = this.form.videos[idx]
      const vid = (video.bunnyVideoId || '').trim()
      if (!vid) {
        video._verified = null
        video._bunnyDuration = 0
        this.checkAllDurationsMatch(video)
        return
      }
      video._verifying = true
      video._verified = null
      try {
        const endpoint = video.bunnyLibraryId
          ? `/admin/demo/bunny/video/${vid}`
          : `/admin/bunny/video/${vid}`
        const info = await api.get(endpoint)
        video._verified = true
        video._bunnyName = info.title || ''
        if (info.length != null) video._bunnyDuration = Math.round(info.length)
        // auto-fill title + duration
        if (!video.title && info.title) video.title = info.title
        if (info.length != null && (!video.duration || video.duration === '--:--')) {
          const m = Math.floor(info.length / 60)
          const s = info.length % 60
          video.duration = `${m}:${String(s).padStart(2, '0')}`
        }
        if (info.duration && (!video.duration || video.duration === '--:--')) {
          video.duration = info.duration
        }
      } catch {
        video._verified = false
      } finally {
        video._verifying = false
        this.checkAllDurationsMatch(video)
      }
    },

    // ═══ DRM UUID verify ═══
    scheduleDrmVerify(idx) {
      clearTimeout(this._drmVerifyTimer)
      this._drmVerifyTimer = setTimeout(() => this.verifyDrmVideo(idx), 600)
    },
    async verifyDrmVideo(idx) {
      const video = this.form.videos[idx]
      const vid = (video.bunnyDrmVideoId || '').trim()
      if (!vid) {
        video._drmVerified = null
        video._drmDuration = ''
        video._drmDurationSec = 0
        this.checkAllDurationsMatch(video)
        return
      }
      video._drmVerifying = true
      video._drmVerified = null
      try {
        // DRM library = main library (626874)
        const info = await api.get(`/admin/bunny/video/${vid}`)
        video._drmName = info.title || ''
        // เช็ค duration ตรงกับ Protection UUID ไหม
        let drmDur = ''
        if (info.length != null) {
          const m = Math.floor(info.length / 60)
          const s = info.length % 60
          drmDur = `${m}:${String(s).padStart(2, '0')}`
          video._drmDurationSec = Math.round(info.length)
        } else if (info.duration) {
          drmDur = info.duration
        }
        video._drmDuration = drmDur
        // เปรียบเทียบ duration กับ Protection UUID
        const protDur = (video.duration || '').replace('--:--', '')
        if (protDur && drmDur && protDur !== drmDur) {
          video._drmVerified = false
        } else {
          video._drmVerified = true
        }
      } catch {
        video._drmVerified = false
      } finally {
        video._drmVerifying = false
        this.checkAllDurationsMatch(video)
      }
    },
    // ═══ Ali NoDRM verify ═══
    scheduleAliVerify(idx) {
      const video = this.form.videos[idx]
      video._aliVerified = null
      clearTimeout(video._aliVerifyTimer)
      video._aliVerifyTimer = setTimeout(() => {
        this.$nextTick(() => this.verifyAliVideo(idx))
      }, 500)
    },
    async verifyAliVideo(idx) {
      const video = this.form.videos[idx]
      const vid = (video.aliVideoId || '').trim()
      if (!vid) {
        video._aliVerified = null
        video._aliName = ''
        video._aliDuration = 0
        video._aliVerifyReason = ''
        this.checkAllDurationsMatch(video)
        return
      }
      video._aliVerifying = true
      video._aliVerified = null
      video._aliVerifyReason = ''
      try {
        // ⭐ New dual-encryption verify endpoint
        // Returns: { valid, hasAliProp, hasWidevine, streamCount, reason }
        const data = await api.get(`/admin/ali/verify-dual/${vid}`)
        if (data.valid) {
          video._aliVerified = true
          video._aliVerifyReason = ''
          const parts = []
          if (data.hasAliProp) parts.push('AliProp')
          if (data.hasWidevine) parts.push('Widevine')
          const suffix = parts.length ? ` [${parts.join('+')}]` : ''
          video._aliName = (data.title || vid) + suffix
          if (data.duration != null) {
            const dur = Math.round(data.duration || 0)
            video._aliDuration = dur
          }
        } else {
          video._aliVerified = false
          video._aliVerifyReason = data.reason || 'ไม่ผ่านการตรวจสอบ'
          video._aliName = data.title || ''
          if (data.duration != null) video._aliDuration = Math.round(data.duration || 0)
        }
      } catch (err) {
        video._aliVerified = false
        video._aliVerifyReason = err.response?.data?.reason || err.response?.data?.error || 'verify failed'
      } finally {
        video._aliVerifying = false
        this.checkAllDurationsMatch(video)
      }
    },
    // ═══ Check duration match — เช็คทุกตัวที่มี duration (>0) ═══
    // Tolerance ±3 วิ → ตัวไหนต่างเกิน → ✗ + slot error + _durationMismatch
    checkAllDurationsMatch(video) {
      const bd = video._bunnyDuration || 0
      const bdrm = video._drmDurationSec || 0
      const ad = video._aliDuration || 0

      // เก็บเฉพาะที่มี duration >0
      const durs = [bd, bdrm, ad].filter(d => d > 0)

      // ต้องมีอย่างน้อย 2 ตัวถึงจะเทียบได้
      if (durs.length < 2) {
        video._durationMismatch = false
        video._aliDurationMismatch = false
        return
      }

      const max = Math.max(...durs)
      const min = Math.min(...durs)
      const overall = (max - min) > 3

      // Global mismatch flag (สำหรับ warning banner)
      video._durationMismatch = overall

      // ⭐ Per-slot check: เช็คว่า Ali เทียบกับ Bunny (tolerance ±3 วิ)
      const bunnyDurs = [bd, bdrm].filter(d => d > 0)
      const bunnyMax = bunnyDurs.length ? Math.max(...bunnyDurs) : 0
      const bunnyMin = bunnyDurs.length ? Math.min(...bunnyDurs) : 0

      // ถ้ามี Bunny reference → เช็ค Ali เทียบกับ Bunny
      if (bunnyDurs.length > 0 && ad > 0) {
        const outsideBunny = ad < (bunnyMin - 3) || ad > (bunnyMax + 3)
        video._aliDurationMismatch = outsideBunny
      } else {
        video._aliDurationMismatch = false
      }
    },
    // ═══ Bonus Video verify ═══
    scheduleBonusVerify(idx) {
      const video = this.form.videos[idx]
      video._bonusVerified = null
      clearTimeout(video._bonusVerifyTimer)
      video._bonusVerifyTimer = setTimeout(() => {
        this.$nextTick(() => this.verifyBonusVideo(idx))
      }, 500)
    },
    async verifyBonusVideo(idx) {
      const video = this.form.videos[idx]
      const vid = (video.bonusBunnyVideoId || '').trim()
      if (!vid) { video._bonusVerified = null; return }
      video._bonusVerifying = true
      video._bonusVerified = null
      try {
        const endpoint = video.bunnyLibraryId
          ? `/admin/demo/bunny/video/${vid}`
          : `/admin/bunny/video/${vid}`
        const info = await api.get(endpoint)
        video._bonusVerified = true
        video._bonusBunnyName = info.title || ''
        if (!video.bonusTitle && info.title) video.bonusTitle = info.title
        if (info.length != null && (!video.bonusDuration || video.bonusDuration === '--:--')) {
          const m = Math.floor(info.length / 60)
          const s = info.length % 60
          video.bonusDuration = `${m}:${String(s).padStart(2, '0')}`
        }
      } catch { video._bonusVerified = false }
      finally { video._bonusVerifying = false }
    },
    scheduleBonusDrmVerify(idx) {
      clearTimeout(this._bonusDrmVerifyTimer)
      this._bonusDrmVerifyTimer = setTimeout(() => this.verifyBonusDrmVideo(idx), 600)
    },
    async verifyBonusDrmVideo(idx) {
      const video = this.form.videos[idx]
      const vid = (video.bonusBunnyDrmVideoId || '').trim()
      if (!vid) { video._bonusDrmVerified = null; return }
      video._bonusDrmVerifying = true
      video._bonusDrmVerified = null
      try {
        const info = await api.get(`/admin/bunny/video/${vid}`)
        video._bonusDrmName = info.title || ''
        video._bonusDrmVerified = true
      } catch { video._bonusDrmVerified = false }
      finally { video._bonusDrmVerifying = false }
    },
    toggleBonus(idx) {
      const v = this.form.videos[idx]
      v._bonusExpanded = !v._bonusExpanded
    },
    clearBonus(idx) {
      const v = this.form.videos[idx]
      v.bonusLabel = ''
      v.bonusTitle = ''
      v.bonusBunnyVideoId = ''
      v.bonusBunnyDrmVideoId = ''
      v.bonusDuration = '--:--'
      v.bonusPdfFile = ''
      v.bonusPdfFileName = ''
      v._bonusExpanded = true
      v._bonusVerified = null
      v._bonusDrmVerified = null
      v._bonusBunnyName = ''
      v._bonusDrmName = ''
    },

    // ═══ Lock/Unlock video ═══
    unlockVideo(idx) {
      const pwd = prompt('กรอกรหัสเพื่อแก้ไข:')
      if (pwd === 'medninja') {
        this.form.videos[idx]._locked = false
      } else if (pwd !== null) {
        alert('รหัสไม่ถูกต้อง')
      }
    },
    moveVideo(idx, dir) {
      const target = idx + dir
      if (target < 0 || target >= this.form.videos.length) return
      const temp = this.form.videos[idx]
      this.form.videos.splice(idx, 1)
      this.form.videos.splice(target, 0, temp)
      // อัปเดต order ตาม position
      this.form.videos.forEach((v, i) => { v.order = i })
    },
    removeVideo(idx) {
      const title = this.form.videos[idx]?.title || `วีดีโอ #${idx + 1}`
      if (!this.confirmDelete(`ลบ "${title}"?`)) return
      this.form.videos.splice(idx, 1)
      this.form.videos.forEach((v, i) => { v.order = i })
    },

    editSection(section) {
      this.editingId = section._id
      this.loadSelfCheckBindings(section._id)   // ─── โหลด Self Check bindings ของ section นี้ ───
      this.form = {
        code: section.code || '',
        name: section.name || '',
        description: section.description || '',
        order: section.order || 0,
        videos: (section.videos || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(v => ({
            // ⭐ Content Library link — ต้อง preserve ตอน load ไม่งั้น badge/lock หายทุกครั้ง edit
            contentId: v.contentId || null,
            _linkedContentTitle: v.contentId ? (v.title || 'Library content') : '',
            title: v.title || '',
            topic: v.topic || '',
            subtopic: v.subtopic || '',
            topicId: v.topicId || '',
            subtopicId: v.subtopicId || '',
            bunnyVideoId: v.bunnyVideoId || '',
            bunnyDrmVideoId: v.bunnyDrmVideoId || '',
            aliVideoId: v.aliVideoId || '',
            bunnyLibraryId: v.bunnyLibraryId || '628424',
            duration: v.duration || '--:--',
            order: v.order || 0,
            requiredTier: v.requiredTier || 6,
            // PDF fields (doc-only row + attached PDF)
            pdfFile: v.pdfFile || '',
            pdfFileName: v.pdfFileName || '',
            pdfFileUrl: v.pdfFileUrl || '',
            pdfEnabled: v.pdfEnabled !== false,
            _verified: v.bunnyVideoId ? true : null,
            _verifying: false,
            _bunnyName: '',
            _bunnyDuration: 0,
            _drmVerified: v.bunnyDrmVideoId ? true : null,
            _drmVerifying: false,
            _drmDuration: '',
            _drmDurationSec: 0,
            _drmName: '',
            _aliVerified: v.aliVideoId ? true : null,
            _aliVerifying: false,
            _aliName: '',
            _aliDuration: 0,
            _aliVerifyReason: '',
            _renaming: false,
            _durationMismatch: false,
            _locked: !!(v.bunnyVideoId && v.bunnyDrmVideoId),
            // VDO พิเศษ
            bonusLabel: v.bonusLabel || '',
            bonusTitle: v.bonusTitle || '',
            bonusBunnyVideoId: v.bonusBunnyVideoId || '',
            bonusBunnyDrmVideoId: v.bonusBunnyDrmVideoId || '',
            // ⭐ Bonus Ali (CN) — schema มี, edit เดิมลืม
            bonusAliVideoId: v.bonusAliVideoId || '',
            bonusDuration: v.bonusDuration || '--:--',
            bonusPdfFile: v.bonusPdfFile || '',
            bonusPdfFileName: v.bonusPdfFileName || '',
            _bonusExpanded: !!(v.bonusBunnyVideoId || v.bonusTitle || v.bonusLabel || v.bonusPdfFile),
            _bonusVerified: v.bonusBunnyVideoId ? true : null,
            _bonusVerifying: false,
            _bonusBunnyName: '',
            _bonusDrmVerified: v.bonusBunnyDrmVideoId ? true : null,
            _bonusDrmVerifying: false,
            _bonusDrmName: '',
            _bonusLocked: !!(v.bonusBunnyVideoId && v.bonusBunnyDrmVideoId)
          }))
      }
      this.collapsed = {}
      this.showForm = true
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // โหลดชื่อไฟล์ Bunny สำหรับทุก video ที่มี UUID
      this.loadBunnyNames()
    },

    async renameBunnyFiles(video) {
      // เหลือไว้เพื่อ backward compat — จริงๆ template ใช้ renameAllFiles แล้ว
      return this.renameAllFiles(video)
    },

    // rename ครบ 4 ไฟล์ (Bunny NoDRM + Bunny DRM + Ali NoDRM + Ali DRM)
    async renameAllFiles(video) {
      const current = video._bunnyName || video._drmName || video._aliName || video.title || ''
      const newName = prompt('ตั้งชื่อไฟล์ (Bunny 2 + Ali 1):', current)
      if (!newName || newName === current) return

      video._renaming = true
      const results = { bunny: null, bunnyDrm: null, ali: null }
      const errors = []

      // Bunny NoDRM
      if (video.bunnyVideoId) {
        try {
          await api.put(`/admin/bunny/video/${video.bunnyVideoId.trim()}/rename`, { title: newName, library: 'noDrm' })
          results.bunny = true
          video._bunnyName = newName
        } catch (err) {
          results.bunny = false
          errors.push('Bunny NoDRM: ' + (err.message || err))
        }
      }
      // Bunny DRM
      if (video.bunnyDrmVideoId) {
        try {
          await api.put(`/admin/bunny/video/${video.bunnyDrmVideoId.trim()}/rename`, { title: newName, library: 'drm' })
          results.bunnyDrm = true
          video._drmName = newName
        } catch (err) {
          results.bunnyDrm = false
          errors.push('Bunny DRM: ' + (err.message || err))
        }
      }
      // Ali (single VID with dual encryption)
      if (video.aliVideoId) {
        try {
          await api.post(`/admin/ali/video/${video.aliVideoId.trim()}/rename`, { title: newName })
          results.ali = true
          video._aliName = newName
        } catch (err) {
          results.ali = false
          errors.push('Ali: ' + (err.response?.data?.error || err.message || err))
        }
      }

      video._renaming = false

      const done = Object.values(results).filter(r => r === true).length
      const failed = errors.length
      if (failed === 0) {
        alert(`เปลี่ยนชื่อสำเร็จ ${done} ไฟล์`)
      } else {
        alert(`สำเร็จ ${done} ไฟล์ · ล้มเหลว ${failed} ไฟล์\n\n` + errors.join('\n'))
      }
    },

    _parseMMSS(s) {
      // "5:30" → 330 seconds
      if (!s || typeof s !== 'string') return 0
      const parts = s.split(':').map(x => parseInt(x, 10) || 0)
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      return 0
    },

    async loadBunnyNames() {
      try {
        const { drm, noDrm } = await api.get('/admin/bunny/video-names')
        for (const video of this.form.videos) {
          const nd = video.bunnyVideoId ? noDrm[video.bunnyVideoId] : null
          const dr = video.bunnyDrmVideoId ? drm[video.bunnyDrmVideoId] : null
          video._bunnyName = nd ? `${nd.title} (${nd.duration})` : ''
          video._drmName = dr ? `${dr.title} (${dr.duration})` : ''
          // เก็บ duration เป็นวินาที เพื่อเทียบข้าม platform
          if (nd) video._bunnyDuration = this._parseMMSS(nd.duration)
          if (dr) video._drmDurationSec = this._parseMMSS(dr.duration)
          // Bonus video names
          const bnd = video.bonusBunnyVideoId ? noDrm[video.bonusBunnyVideoId] : null
          const bdr = video.bonusBunnyDrmVideoId ? drm[video.bonusBunnyDrmVideoId] : null
          video._bonusBunnyName = bnd ? `${bnd.title} (${bnd.duration})` : ''
          video._bonusDrmName = bdr ? `${bdr.title} (${bdr.duration})` : ''
        }
        // Ali durations โหลด async หลัง Bunny เสร็จ (ไม่ block)
        this.loadAliNames()
      } catch { /* ignore */ }
    },

    // Verify Ali videos ทีละตัวเมื่อ open edit form (throttled)
    async loadAliNames() {
      const withAli = this.form.videos.filter(v => (v.aliVideoId || '').trim())
      // ทำทีละ 3 คู่ขนาน กัน Alibaba rate-limit
      const CHUNK = 3
      for (let i = 0; i < withAli.length; i += CHUNK) {
        const chunk = withAli.slice(i, i + CHUNK)
        await Promise.all(chunk.map(async v => {
          const idx = this.form.videos.indexOf(v)
          if (idx < 0) return
          if ((v.aliVideoId || '').trim()) await this.verifyAliVideo(idx)
        }))
      }
      // recheck all mismatches after all durations loaded
      this.form.videos.forEach(v => this.checkAllDurationsMatch(v))
    },

    cancelEdit() {
      this.showForm = false
      this.resetForm()
    },

    async handleSubmit() {
      this.saving = true
      this.error = null
      try {
        // Validate
        if (!this.form.code.trim()) {
          this.error = 'กรุณากรอกรหัส Section'
          this.saving = false
          return
        }
        if (!this.form.name.trim()) {
          this.error = 'กรุณากรอกชื่อ Section'
          this.saving = false
          return
        }
        // ⭐ STRICT: กัน Ali VID ที่ verify ไม่ผ่าน (dual encryption check)
        const aliInvalid = this.form.videos.filter(v =>
          (v.aliVideoId || '').trim() && v._aliVerified === false
        )
        if (aliInvalid.length > 0) {
          this.saving = false
          const preview = aliInvalid.slice(0, 3).map(v =>
            `• ${v.title || '(ไม่มีชื่อ)'}: ${v._aliVerifyReason || 'verify failed'}`
          ).join('\n')
          alert('⚠️ Ali VID บางตัวไม่ผ่านการตรวจสอบ — โปรดตรวจสอบ\n\n' +
            'VID ต้องมี dual encryption (AliProp + Widevine) ครบทั้งคู่\n\n' +
            preview)
          return
        }
        // ⭐ STRICT: กันบันทึกถ้ามี video ไหน duration ไม่ตรง (Bunny 2 + Ali 1 ครบ)
        const mismatched = this.form.videos.filter(v => v._durationMismatch === true)
        if (mismatched.length > 0) {
          this.saving = false
          const preview = mismatched.slice(0, 3).map(v => {
            const bd = v._bunnyDuration || 0
            const bdrm = v._drmDurationSec || 0
            const ad = v._aliDuration || 0
            return `• ${v.title || '(ไม่มีชื่อ)'}: Bunny ${bd}/${bdrm} · Ali ${ad} วิ`
          }).join('\n')
          alert('⚠️ ความยาววิดีโอไม่ตรงกัน — โปรดตรวจสอบก่อนบันทึก\n(Bunny และ Ali ต้อง encode ให้ length เท่ากัน · tolerance ±3 วิ)\n\n' + preview)
          return
        }

        // กรอง video ที่มีข้อมูล — อนุญาตให้ save โครงสร้างเปล่า (มีแค่ title/topic/subtopic ยังไม่มี UUID)
        // + row เอกสารล้วน (มี pdfFile แต่ไม่มี bunnyVideoId)
        const validVideos = this.form.videos.filter(v =>
          (v.title || '').trim() || (v.bunnyVideoId || '').trim() || (v.topic || '').trim() || (v.pdfFile || '').trim()
        )

        const payload = {
          code: this.form.code.trim().toUpperCase(),
          name: this.form.name.trim(),
          description: (this.form.description || '').trim(),
          order: this.form.order,
          videos: validVideos.map((v, i) => ({ ...this._sanitizeVideo(v), order: i }))
        }
        const isEdit = !!this.editingId
        if (isEdit) {
          await api.put(`/admin/sections/${this.editingId}`, payload)
        } else {
          await api.post('/admin/sections', payload)
        }
        this.showForm = false
        this.resetForm()
        await this.fetchSections()
        this.successMsg = isEdit ? 'แก้ไขเนื้อหาเรียบร้อย' : 'เพิ่มเนื้อหาใหม่เรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.error = err.response?.data?.message || 'บันทึกข้อมูลล้มเหลว'
      } finally {
        this.saving = false
      }
    },

    togglePdfPanel(sectionId) {
      this.pdfPanelId = this.pdfPanelId === sectionId ? null : sectionId
      if (this.pdfPanelId && this.pdfLibrary.length === 0) this.loadPdfLibrary()
    },
    async loadPdfLibrary() {
      try {
        const data = await api.get('/admin/pdf-library')
        this.pdfLibrary = data.files || []
      } catch (e) { console.error(e) }
    },
    getTopics(section) {
      return [...new Set((section.videos || []).map(v => v.topic).filter(Boolean))]
    },
    getSubtopics(section) {
      return [...new Set((section.videos || []).map(v => v.subtopic).filter(Boolean))]
    },
    getSubtopicsOf(section, topic) {
      return [...new Set((section.videos || []).filter(v => v.topic === topic && v.subtopic).map(v => v.subtopic))]
    },
    getVideosOf(section, topic, subtopic) {
      const sorted = [...(section.videos || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
      return sorted.filter((v, i) => {
        v._sortIdx = i
        return (v.topic || '') === topic && (v.subtopic || '') === subtopic
      })
    },
    async setTopicPdf(sectionId, topic, fileName) {
      try {
        const sec = this.sections.find(s => s._id === sectionId)
        if (!sec.topicPdfMap) sec.topicPdfMap = {}
        if (fileName) sec.topicPdfMap[topic] = fileName
        else delete sec.topicPdfMap[topic]
        await api.put(`/admin/sections/${sectionId}`, { topicPdfMap: sec.topicPdfMap })
        this.successMsg = fileName ? `Topic "${topic}" → ${fileName}` : `ลบ PDF Topic "${topic}"`
      } catch (e) { this.errorMsg = e.message }
    },
    async setSubtopicPdf(sectionId, subtopic, fileName) {
      try {
        const sec = this.sections.find(s => s._id === sectionId)
        if (!sec.subtopicPdfMap) sec.subtopicPdfMap = {}
        if (fileName) sec.subtopicPdfMap[subtopic] = fileName
        else delete sec.subtopicPdfMap[subtopic]
        await api.put(`/admin/sections/${sectionId}`, { subtopicPdfMap: sec.subtopicPdfMap })
        this.successMsg = fileName ? `Subtopic "${subtopic}" → ${fileName}` : `ลบ PDF Subtopic "${subtopic}"`
      } catch (e) { this.errorMsg = e.message }
    },
    async setVideoPdf(sectionId, videoIdx, fileName) {
      try {
        const sec = this.sections.find(s => s._id === sectionId)
        if (!sec) return
        const sorted = [...sec.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
        const vid = sorted[videoIdx]
        if (!vid) return
        vid.pdfFile = fileName
        // match ด้วย object reference — VDO เอกสารทุกตัวมี bunnyVideoId ว่างเหมือนกัน → collide ถ้า match ด้วย id
        const videos = sec.videos.map(v => {
          if (v === vid) return { ...v, pdfFile: fileName }
          return v
        })
        await api.put(`/admin/sections/${sectionId}`, { videos })
        this.successMsg = fileName ? `เลือก PDF: ${fileName}` : 'ลบ PDF แล้ว'
      } catch (e) { this.errorMsg = e.message }
    },
    async setBonusPdf(sectionId, videoIdx, fileName) {
      try {
        const sec = this.sections.find(s => s._id === sectionId)
        if (!sec) return
        const sorted = [...sec.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
        const vid = sorted[videoIdx]
        if (!vid) return
        vid.bonusPdfFile = fileName
        const videos = sec.videos.map(v => {
          if (v === vid) return { ...v, bonusPdfFile: fileName }
          return v
        })
        await api.put(`/admin/sections/${sectionId}`, { videos })
        this.successMsg = fileName ? `เลือก Bonus PDF: ${fileName}` : 'ลบ Bonus PDF แล้ว'
      } catch (e) { this.errorMsg = e.message }
    },
    formatSize(bytes) {
      if (!bytes) return '0'
      if (bytes < 1024) return bytes + 'B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB'
      return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    },
    getPdfForUuid(uuid) {
      if (!uuid) return null
      // ค้นหา PDF จาก UUID ข้ามทุก section
      for (const sec of this.sections) {
        for (const v of (sec.videos || [])) {
          if (v.bunnyVideoId === uuid && v.pdfFileName) return v.pdfFileName
        }
      }
      return null
    },
    sortedVideosOf(section) {
      return [...(section.videos || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
    },
    triggerPdfUpload(sectionId, videoIdx) {
      this._pdfSectionId = sectionId
      this._pdfVideoIdx = videoIdx
      this.$refs.pdfInput.value = ''
      this.$refs.pdfInput.click()
    },
    async onPdfSelected(e) {
      const file = e.target.files?.[0]
      if (!file || !this._pdfSectionId || this._pdfVideoIdx === undefined) return
      this.error = ''
      this.successMsg = ''
      const form = new FormData()
      form.append('pdf', file)
      try {
        const token = localStorage.getItem('token')
        const resp = await fetch(`/api/admin/sections/${this._pdfSectionId}/videos/${this._pdfVideoIdx}/upload-pdf`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          this.error = err.message || 'อัปโหลดไม่สำเร็จ'
          return
        }
        const res = await resp.json().catch(() => ({ ok: true }))
        this.successMsg = `อัปโหลด PDF สำเร็จ: ${res.pdfFileName || file.name}`
        await this.loadSections()
      } catch (err) {
        // ถ้า upload สำเร็จแล้วแต่ parse error → ถือว่าสำเร็จ
        if (!this.successMsg) this.error = 'อัปโหลดไม่สำเร็จ'
      }
    },
    async togglePdfEnabled(sectionId, videoIdx, enabled) {
      try {
        const section = this.sections.find(s => s._id === sectionId)
        if (!section) return
        const sorted = this.sortedVideosOf(section)
        const vid = sorted[videoIdx]
        if (vid) vid.pdfEnabled = enabled
        // save section ทั้งตัว
        await api.put(`/admin/sections/${sectionId}`, { videos: section.videos })
        this.loadSections()
      } catch (err) {
        this.error = 'บันทึกไม่สำเร็จ'
      }
    },
    async deletePdf(sectionId, videoIdx) {
      if (!confirm('ลบ PDF ออกจากวีดีโอนี้?')) return
      try {
        await api.delete(`/admin/sections/${sectionId}/videos/${videoIdx}/pdf`)
        this.successMsg = 'ลบ PDF สำเร็จ'
        this.loadSections()
      } catch (err) {
        this.error = err.response?.data?.message || 'ลบไม่สำเร็จ'
      }
    },
    async deleteSection(id) {
      const pwd = prompt('กรอกรหัสเพื่อยืนยันลบ Section:')
      if (pwd !== 'medninja') { if (pwd !== null) alert('รหัสไม่ถูกต้อง'); return }
      this.error = null
      try {
        await api.delete(`/admin/sections/${id}`)
        this.deletingId = null
        await this.fetchSections()
        this.successMsg = 'ลบเนื้อหาเรียบร้อย'
        setTimeout(() => { this.successMsg = '' }, 3000)
      } catch (err) {
        this.deletingId = null
        this.error = err.response?.data?.message || 'ลบข้อมูลล้มเหลว'
      }
    },
    async cloneSection(section) {
      const newCode = prompt(`Clone "${section.code}" → ใส่ code ใหม่ (ตัวพิมพ์ใหญ่):`, section.code + '_COPY')
      if (!newCode || !newCode.trim()) return
      const newName = prompt('ชื่อแสดงผลของ section ใหม่:', section.name)
      if (newName === null) return
      this.cloningId = section._id
      this.error = null
      try {
        const data = await api.post(`/admin/sections/${section._id}/clone`, {
          newCode: newCode.trim().toUpperCase(),
          newName: (newName || '').trim() || newCode.trim().toUpperCase()
        })
        await this.fetchSections()
        const vCount = data?.section?.videos?.length ?? '?'
        this.successMsg = `Clone เสร็จ — "${data?.section?.code}" (${vCount} วีดีโอ, PDF mapping ครบ)`
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Clone ล้มเหลว'
      } finally {
        this.cloningId = null
      }
    },

    async fetchBunnyInfo(idx) {
      const video = this.form.videos[idx]
      if (!video.bunnyVideoId) return
      video._fetching = true
      try {
        const endpoint = video.bunnyLibraryId
          ? `/admin/demo/bunny/video/${video.bunnyVideoId.trim()}`
          : `/admin/bunny/video/${video.bunnyVideoId.trim()}`
        const data = await api.get(endpoint)
        // Auto-fill duration (แสดงเป็น "X นาที" หรือ "X:XX")
        if (data.length != null) {
          const mins = Math.floor(data.length / 60)
          const secs = data.length % 60
          video.duration = secs > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins}:00`
        }
        // Auto-fill title ถ้าว่าง
        if (!video.title && data.title) {
          video.title = data.title
        }
        // แสดง status ถ้ายังไม่ finished
        if (data.status !== 4) {
          this.error = `Video "${data.title}" สถานะ: ${data.statusText} — อาจยัง preview ไม่ได้`
          setTimeout(() => { this.error = null }, 5000)
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'ดึงข้อมูลจาก Bunny ไม่สำเร็จ'
        setTimeout(() => { this.error = null }, 5000)
      } finally {
        video._fetching = false
      }
    },


    totalDuration(section) {
      const videos = section.videos || []
      if (!videos.length) return '0:00'
      let totalSecs = 0
      let hasAny = false
      for (const v of videos) {
        if (!v.duration || v.duration === '--:--') continue
        // parse "M:SS" or "MM:SS"
        const parts = String(v.duration).split(':')
        if (parts.length === 2) {
          totalSecs += parseInt(parts[0]) * 60 + parseInt(parts[1])
          hasAny = true
        }
      }
      if (!hasAny) return '0:00'
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      const s = totalSecs % 60
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      return `${m}:${String(s).padStart(2, '0')}`
    },

    resetForm() {
      this.editingId = null
      this.collapsed = {}
      this.form = {
        code: '',
        name: '',
        description: '',
        order: 0,
        videos: []
      }
    },
    loadSections() {
      return this.fetchSections()
    }
  }
}
</script>

<style scoped>
/* Doc-only row (row เอกสารล้วน) */
.tree-doc-row {
  background: linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%) !important;
  border-left: 3px solid #0ea5e9;
}
.tree-doc-num {
  background: #e0f2fe !important;
  color: #0369a1 !important;
  font-size: 14px !important;
  border-color: #7dd3fc !important;
}
.doc-pdf-select {
  background: #f0f9ff;
  border-color: #7dd3fc;
  color: #0c4a6e;
  font-weight: 600;
  font-size: 12px !important;
}
.doc-pdf-select:focus {
  border-color: #0ea5e9;
  outline: none;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}
.doc-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #0ea5e9;
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
.btn-purple {
  background: #a855f7;
  color: #fff;
  border-color: #a855f7;
}
.btn-purple:hover {
  background: #9333ea;
  border-color: #9333ea;
}

.videos-table-wrap .table {
  min-width: 700px;
}

.videos-table-wrap .table td {
  vertical-align: middle;
  padding: 8px 10px;
}

.videos-table-wrap .form-control {
  min-height: 38px;
  padding: 8px 12px;
  font-size: 13px;
}

/* Icon buttons (fetch info / preview) */
.icon-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.icon-btn-blue { color: #2563eb; }
.icon-btn-blue:hover:not(:disabled) { background: #dbeafe; border-color: #2563eb; }
.icon-btn-purple { color: #7c3aed; }
.icon-btn-purple:hover:not(:disabled) { background: #ede9fe; border-color: #7c3aed; }

/* Duration display */
.btn-move {
  width: 24px; height: 24px; border: 1px solid #e2e8f0; border-radius: 4px;
  background: #f8fafc; font-size: 13px; cursor: pointer; color: var(--primary);
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.btn-move:hover:not(:disabled) { background: #eef2ff; }
.btn-move:disabled { opacity: 0.2; cursor: not-allowed; }

/* === Tree View Styles === */
.tree-wrap {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.tree-topic {
  border-bottom: 1px solid #e2e8f0;
}
.tree-topic:last-child { border-bottom: none; }

.tree-topic-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #f5f3ff; gap: 8px; flex-wrap: wrap;
}
.tree-topic-left {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;
}
.tree-topic-actions {
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
}

.tree-subtopic {
  border-top: 1px solid #e2e8f0;
}
.tree-subtopic-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px 8px 36px; background: #f0f9ff; gap: 8px; flex-wrap: wrap;
}
.tree-subtopic-left {
  display: flex; align-items: center; gap: 6px; flex: 1; min-width: 180px;
}
.tree-subtopic-actions {
  display: flex; align-items: center; gap: 4px;
}
.tree-subtopic-videos {
  padding-left: 20px;
}

.tree-topic-children {
  background: #fff;
}

.topic-name-input {
  font-size: 14px; font-weight: 800; color: #6d28d9;
  border: none; background: transparent; flex: 1; padding: 4px 0; min-width: 100px;
}
.topic-name-input:focus { outline: none; border-bottom: 2px solid #a855f7; }

.subtopic-name-input {
  font-size: 13px; font-weight: 700; color: #0369a1;
  border: none; background: transparent; flex: 1; padding: 4px 0; min-width: 80px;
}
.subtopic-name-input:focus { outline: none; border-bottom: 2px solid #3b82f6; }

.tree-count {
  font-size: 11px; color: #94a3b8; white-space: nowrap;
}

.btn-collapse {
  background: none; border: none; cursor: pointer; font-size: 12px; color: #6d28d9;
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; flex-shrink: 0;
}
.btn-collapse:hover { background: #ede9fe; }
.btn-collapse-sm { font-size: 10px; width: 18px; height: 18px; color: #0369a1; }
.btn-collapse-sm:hover { background: #e0f2fe; }

.tree-video-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-top: 1px solid #f1f5f9;
}
.tree-video-row:first-child { border-top: none; }
.tree-video-in-topic { padding-left: 36px; }
.tree-video-root { padding-left: 14px; background: #fff; border-bottom: 1px solid #e2e8f0; }
.tree-video-root:last-child { border-bottom: none; }

.tree-video-num {
  font-size: 11px; color: #94a3b8; width: 28px; text-align: center; flex-shrink: 0;
}
.tree-video-dur {
  font-size: 11px; color: #64748b; width: 50px; text-align: center; flex-shrink: 0;
  font-family: 'SF Mono', monospace;
}
/* Tier dropdown ใน video row */
.tier-select {
  font-size: 11px; font-weight: 700;
  padding: 3px 6px; border-radius: 6px;
  border: 1px solid #cbd5e1; cursor: pointer;
  width: 80px; flex-shrink: 0;
}
.tier-select:focus { outline: 2px solid #3b82f6; outline-offset: 1px; }
.tier-bg-1 { background: #fef9c3; color: #854d0e; border-color: #fde68a; }
.tier-bg-2 { background: #e0f2fe; color: #075985; border-color: #bae6fd; }
.tier-bg-3 { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
.tier-bg-4 { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.tier-bg-5 { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }
.tier-bg-6 { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; border-color: #f59e0b; }

/* Bulk tier dropdown ใน topic/subtopic header */
.tier-bulk-select {
  font-size: 11px; font-weight: 700;
  padding: 4px 8px; border-radius: 6px;
  border: 1px solid #3b82f6;
  background: #eff6ff; color: #1e40af;
  cursor: pointer;
}
.tier-bulk-select:focus { outline: 2px solid #2563eb; outline-offset: 1px; }
.tier-bulk-sm { font-size: 10px; padding: 3px 6px; }
.tree-video-actions {
  display: flex; gap: 2px; flex-shrink: 0;
}

.form-control-sm {
  min-height: 32px; padding: 5px 10px; font-size: 12px;
  border: 1px solid var(--border); border-radius: 6px;
}

.btn-move-sm { width: 22px; height: 22px; font-size: 11px; }
.btn-move-danger { color: #dc2626; border-color: #fecaca; }
.btn-move-danger:hover:not(:disabled) { background: #fef2f2; border-color: #dc2626; }

.btn-assign-sub {
  font-size: 10px; font-weight: 700; color: #0369a1;
  border: 1px solid #bae6fd; border-radius: 4px;
  background: #f0f9ff; padding: 2px 6px; cursor: pointer;
  white-space: nowrap;
}
.btn-assign-sub:hover { background: #e0f2fe; border-color: #0369a1; }

/* ⭐ 4 video IDs — GLOBAL row (บน) + CHINA row (ล่าง) with labels */
.video-ids-grid-v2 {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 340px;
  max-width: 500px;
}
.platform-row {
  display: grid;
  grid-template-columns: 78px 1fr 1fr;
  gap: 6px;
  align-items: start;
}
.platform-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 5px 8px;
  border-radius: 5px;
  text-align: center;
  align-self: start;
  white-space: nowrap;
  color: #fff;
}
.platform-row.global .platform-label {
  background: linear-gradient(135deg, #059669, #10b981);
}
.platform-row.china .platform-label {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}
/* Bonus serve label A / B — compact แสดงติด input */
.bonus-serve-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.bonus-serve-label.bonus-serve-a { background: linear-gradient(135deg, #059669, #10b981); }
.bonus-serve-label.bonus-serve-b { background: linear-gradient(135deg, #dc2626, #ef4444); }
.vid-slot {
  min-width: 0;
}
.vid-input-wrap {
  display: flex;
  gap: 3px;
  align-items: center;
}
.vid-input-wrap .form-control {
  min-width: 0;
  flex: 1;
}
@media (max-width: 900px) {
  .video-ids-grid-v2 { max-width: none; min-width: 260px; }
  .platform-row { grid-template-columns: 64px 1fr; }
  .platform-row .vid-slot:nth-of-type(2) { grid-column: 2; }
  .platform-label { font-size: 9px; padding: 4px 6px; }
}

/* ⭐ Video row card style — แยก row ชัดเจน */
.tree-video-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px !important;
  margin-bottom: 6px;
  background: #ffffff;
  flex-wrap: wrap;
  gap: 6px !important;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tree-video-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.tree-video-row:first-child { border-top: 1px solid #e2e8f0 !important; }

/* Clean actions area (bonus + ⋯ menu) */
.actions-clean {
  display: flex !important;
  gap: 4px !important;
  align-items: center;
  margin-left: auto;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  transition: all 0.15s;
}
.action-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.action-btn.bonus {
  color: #f59e0b;
  font-size: 16px;
}
.action-btn.menu-toggle {
  color: #64748b;
  font-weight: 700;
  letter-spacing: 1px;
}

/* Dropdown menu */
.action-menu-wrap {
  position: relative;
}
.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  min-width: 160px;
  padding: 4px;
}
.menu-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
}
.menu-item:hover:not(:disabled) {
  background: #f1f5f9;
}
.menu-item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.menu-item.menu-danger {
  color: #dc2626;
}
.menu-item.menu-danger:hover {
  background: #fef2f2;
}

.verify-status { font-size: 14px; font-weight: 800; width: 20px; text-align: center; flex-shrink: 0; }
.verify-status.ok { color: #10b981; }
.verify-status.fail { color: #ef4444; }
.verify-status.verifying { color: #94a3b8; }
.bunny-filename { font-size: 10px; color: #64748b; margin-top: 1px; padding-left: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.bunny-filename.drm { color: #a78bfa; }
.btn-rename { background: none; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; padding: 2px 5px; font-size: 12px; flex-shrink: 0; }
.btn-rename:hover { background: #f1f5f9; }
.btn-rename:disabled { opacity: 0.5; cursor: wait; }
.duration-warn { font-size: 10px; color: #ef4444; font-weight: 600; }
.btn-move-insert { color: #10b981 !important; border-color: #10b981 !important; font-weight: 800; }
.drm-input { border-color: #16a34a !important; }
.drm-input::placeholder { color: #16a34a; opacity: .5; }
.lock-badge { cursor: pointer; font-size: 14px; flex-shrink: 0; title: 'กดเพื่อปลดล็อค'; }

.duration-display {
  display: inline-block;
  min-width: 60px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--primary);
  padding: 6px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
}
.duration-empty {
  color: var(--gray);
  background: #f9fafb;
  border-color: var(--border);
  font-weight: 400;
}

/* ═══ Bonus Video Sub-form ═══ */
.btn-bonus-toggle {
  width: 26px; height: 26px; border: 1px solid #fbbf24; border-radius: 6px;
  background: #fffbeb; color: #d97706; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.btn-bonus-toggle:hover { background: #fef3c7; border-color: #f59e0b; }
.bonus-subform {
  margin: 0 0 6px 40px; padding: 10px 14px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
}
.bonus-subform-header {
  font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 8px;
  display: flex; align-items: center; gap: 8px;
}
.bonus-label-input {
  font-size: 13px; font-weight: 800; color: #92400e; background: transparent;
  border: none; border-bottom: 1.5px dashed #fbbf24; padding: 2px 4px;
  outline: none; min-width: 80px; max-width: 260px;
}
.bonus-label-input:focus { border-bottom-color: #f59e0b; background: #fff; border-radius: 4px; }
.bonus-label-input::placeholder { color: #d4a574; font-weight: 400; font-size: 11px; }
.btn-bonus-clear {
  font-size: 10px; padding: 2px 8px; border: 1px solid #fca5a5;
  border-radius: 4px; background: #fff; color: #dc2626; cursor: pointer;
}
.btn-bonus-clear:hover { background: #fef2f2; }
.bonus-subform-row {
  display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap;
}
.bonus-pdf-input { max-width: 180px; font-size: 11px; }

/* ⭐ CN: Alibaba VOD input styling */
.ali-input {
  border-color: #dc2626 !important;
  background: #fef2f2 !important;
  color: #991b1b !important;
  font-family: monospace;
  font-size: 12px;
}
.ali-input.drm {
  border-color: #b91c1c !important;
  background: #fee2e2 !important;
}
.ali-input::placeholder { color: #f87171; font-family: 'Noto Sans Thai', sans-serif; }
.ali-input:focus {
  border-color: #7f1d1d !important;
  outline: 2px solid rgba(220, 38, 38, 0.2);
}

/* ═══ 💾 Save to Content Library ═══ */
.save-to-lib-row {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px dashed #c7d2fe;
  margin-top: 4px;
}
.btn-save-to-lib {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25);
  transition: all 0.2s;
}
.btn-save-to-lib:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}
.modal-card {
  background: white;
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 6px;
}
.modal-close:hover { background: #f3f4f6; }
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
.form-row {
  margin-bottom: 14px;
}
.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.form-row .required { color: #ef4444; }
.form-row .tag-hint { font-weight: 400; color: #9ca3af; font-size: 11px; }
.preview-4-fields {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
}
.preview-title {
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 6px;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
}
.preview-row code {
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 10px;
  color: #0c4a6e;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ 📚 Load from Content Library ═══ */
.btn-load-lib {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(245, 158, 11, 0.3);
}
.btn-load-lib:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(245, 158, 11, 0.4);
}
.link-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(245, 158, 11, 0.35);
  margin-left: 4px;
}
.link-badge:hover {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}
.modal-card-wide {
  max-width: 780px;
}
.load-filter-bar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
.load-empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 13px;
}
.load-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 2px;
}
.load-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.load-item:hover {
  border-color: #f59e0b;
  background: #fffbeb;
  transform: translateX(2px);
}
.load-item-main { flex: 1; min-width: 0; }
.load-item-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
  margin-bottom: 4px;
}
.load-item-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 2px; }
.tag-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}
.tag-chip.lv1 { background: #dbeafe; color: #1e40af; }
.tag-chip.lv2 { background: #ede9fe; color: #6d28d9; }
.tag-chip.lv3 { background: #fce7f3; color: #be185d; }
.load-item-notes {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}
.load-item-meta {
  text-align: right;
  padding-left: 12px;
}
.load-item-dur {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 12px;
  color: #64748b;
}
.load-item-check {
  font-size: 10px;
  color: #10b981;
  font-weight: 700;
  margin-top: 2px;
}
.load-count {
  flex: 1;
  font-size: 11px;
  color: #94a3b8;
}

</style>
