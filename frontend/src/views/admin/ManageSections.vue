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
                              <button type="button" class="btn btn-sm btn-outline" style="font-size:10px;border-color:#a855f7;color:#a855f7;" @click="insertSubtopicBefore(node.name, child.name)" title="แทรก Subtopic ข้างบน">+ Sub</button>
                              <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === 0" @click="moveSubtopicUp(node.name, child.name)" title="ขึ้น">↑</button>
                              <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === node.children.length - 1" @click="moveSubtopicDown(node.name, child.name)" title="ลง">↓</button>
                              <button type="button" class="btn btn-sm btn-danger" style="font-size:10px;" @click="removeSubtopic(node.name, child.name)">ลบ</button>
                            </div>
                          </div>
                          <!-- Subtopic videos -->
                          <div class="tree-subtopic-videos">
                            <div v-for="(vid, vIdx) in child.videos" :key="'v'+vid.flatIdx">
                              <div class="tree-video-row">
                              <span class="tree-video-num">{{ vid.flatIdx + 1 }}</span>
                              <input v-model="vid.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="vid.ref._locked" />
                              <button v-if="vid.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameBunnyFiles(vid.ref)" :disabled="vid.ref._renaming" :title="'ตั้งชื่อไฟล์ Bunny ทั้ง 2 library'">{{ vid.ref._renaming ? '...' : '✏️' }}</button>
                              <div style="min-width:180px;">
                                <div style="display:flex;gap:3px;align-items:center;">
                                  <input v-model="vid.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="vid.ref._locked" @input="scheduleVerify(vid.flatIdx)" />
                                  <span v-if="vid.ref._verifying" class="verify-status verifying">...</span>
                                  <span v-else-if="vid.ref._verified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="vid.ref._verified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="vid.ref._bunnyName" class="bunny-filename" :title="vid.ref._bunnyName">{{ vid.ref._bunnyName }}</div>
                              </div>
                              <div style="min-width:180px;">
                                <div style="display:flex;gap:3px;align-items:center;">
                                  <input v-model="vid.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="vid.ref._locked" @input="scheduleDrmVerify(vid.flatIdx)" />
                                  <span v-if="vid.ref._drmVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="vid.ref._drmVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="vid.ref._drmVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="vid.ref._drmName" class="bunny-filename drm" :title="vid.ref._drmName">{{ vid.ref._drmName }}</div>
                                <span v-if="vid.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                              </div>
                              <!-- ⭐ CN: Alibaba VOD video IDs -->
                              <div style="min-width:170px;">
                                <input v-model="vid.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="🇨🇳 Ali NoDRM VID" />
                              </div>
                              <div style="min-width:170px;">
                                <input v-model="vid.ref.aliDrmVideoId" type="text" class="form-control form-control-sm ali-input drm" placeholder="🇨🇳 Ali DRM VID" />
                              </div>
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
                              <div class="tree-video-actions">
                                <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(vid.flatIdx)" title="แทรก VDO ข้างบน">+</button>
                                <button type="button" class="btn-assign-sub" @click="moveVideoTo(vid.flatIdx)" title="ย้ายไป Topic/Subtopic อื่น">⇄</button>
                                <button type="button" class="btn-move btn-move-sm" :disabled="vIdx === 0" @click="moveVideoInGroup(node.name, child.name, vIdx, -1)" title="ขึ้น">↑</button>
                                <button type="button" class="btn-move btn-move-sm" :disabled="vIdx === child.videos.length - 1" @click="moveVideoInGroup(node.name, child.name, vIdx, 1)" title="ลง">↓</button>
                                <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(vid.flatIdx)" title="ลบ">✕</button>
                                <button type="button" class="btn-bonus-toggle" @click="toggleBonus(vid.flatIdx)" :title="vid.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ vid.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
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
                                  <div style="min-width:160px;">
                                    <div style="display:flex;gap:3px;align-items:center;">
                                      <input v-model="vid.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="vid.ref._bonusLocked" @input="scheduleBonusVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._bonusVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._bonusVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._bonusVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._bonusBunnyName" class="bunny-filename" :title="vid.ref._bonusBunnyName">{{ vid.ref._bonusBunnyName }}</div>
                                  </div>
                                  <div style="min-width:160px;">
                                    <div style="display:flex;gap:3px;align-items:center;">
                                      <input v-model="vid.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="vid.ref._bonusLocked" @input="scheduleBonusDrmVerify(vid.flatIdx)" />
                                      <span v-if="vid.ref._bonusDrmVerifying" class="verify-status verifying">...</span>
                                      <span v-else-if="vid.ref._bonusDrmVerified === true" class="verify-status ok">✓</span>
                                      <span v-else-if="vid.ref._bonusDrmVerified === false" class="verify-status fail">✗</span>
                                    </div>
                                    <div v-if="vid.ref._bonusDrmName" class="bunny-filename drm" :title="vid.ref._bonusDrmName">{{ vid.ref._bonusDrmName }}</div>
                                  </div>
                                  <span class="tree-video-dur">{{ vid.ref.bonusDuration && vid.ref.bonusDuration !== '--:--' ? vid.ref.bonusDuration : '--:--' }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- === VIDEO directly under topic (no subtopic) === -->
                        <div v-else>
                          <div class="tree-video-row tree-video-in-topic">
                          <span class="tree-video-num">{{ child.flatIdx + 1 }}</span>
                          <input v-model="child.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="child.ref._locked" />
                          <button v-if="child.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameBunnyFiles(child.ref)" :disabled="child.ref._renaming" :title="'ตั้งชื่อไฟล์ Bunny ทั้ง 2 library'">{{ child.ref._renaming ? '...' : '✏️' }}</button>
                          <div style="min-width:180px;">
                            <div style="display:flex;gap:3px;align-items:center;">
                              <input v-model="child.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="child.ref._locked" @input="scheduleVerify(child.flatIdx)" />
                              <span v-if="child.ref._verifying" class="verify-status verifying">...</span>
                              <span v-else-if="child.ref._verified === true" class="verify-status ok">✓</span>
                              <span v-else-if="child.ref._verified === false" class="verify-status fail">✗</span>
                            </div>
                            <div v-if="child.ref._bunnyName" class="bunny-filename">{{ child.ref._bunnyName }}</div>
                          </div>
                          <div style="min-width:180px;">
                            <div style="display:flex;gap:3px;align-items:center;">
                              <input v-model="child.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="child.ref._locked" @input="scheduleDrmVerify(child.flatIdx)" />
                              <span v-if="child.ref._drmVerifying" class="verify-status verifying">...</span>
                              <span v-else-if="child.ref._drmVerified === true" class="verify-status ok">✓</span>
                              <span v-else-if="child.ref._drmVerified === false" class="verify-status fail">✗</span>
                            </div>
                            <div v-if="child.ref._drmName" class="bunny-filename drm">{{ child.ref._drmName }}</div>
                            <span v-if="child.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                          </div>
                          <!-- ⭐ CN: Alibaba VOD -->
                          <div style="min-width:170px;">
                            <input v-model="child.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="🇨🇳 Ali NoDRM VID" />
                          </div>
                          <div style="min-width:170px;">
                            <input v-model="child.ref.aliDrmVideoId" type="text" class="form-control form-control-sm ali-input drm" placeholder="🇨🇳 Ali DRM VID" />
                          </div>
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
                          <div class="tree-video-actions">
                            <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(child.flatIdx)" title="แทรก VDO ข้างบน">+</button>
                            <button type="button" class="btn-assign-sub" @click="moveVideoTo(child.flatIdx)" title="ย้ายไป Topic/Subtopic อื่น">⇄</button>
                            <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === 0 || node.children[sIdx-1].type === 'subtopic'" @click="moveVideoInGroup(node.name, '', sIdx, -1)" title="ขึ้น">↑</button>
                            <button type="button" class="btn-move btn-move-sm" :disabled="sIdx === node.children.length - 1" @click="moveVideoInGroup(node.name, '', sIdx, 1)" title="ลง">↓</button>
                            <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(child.flatIdx)" title="ลบ">✕</button>
                            <button type="button" class="btn-bonus-toggle" @click="toggleBonus(child.flatIdx)" :title="child.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ child.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
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
                                  <input v-model="child.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="child.ref._bonusLocked" @input="scheduleBonusVerify(child.flatIdx)" />
                                  <span v-if="child.ref._bonusVerifying" class="verify-status verifying">...</span>
                                  <span v-else-if="child.ref._bonusVerified === true" class="verify-status ok">✓</span>
                                  <span v-else-if="child.ref._bonusVerified === false" class="verify-status fail">✗</span>
                                </div>
                                <div v-if="child.ref._bonusBunnyName" class="bunny-filename" :title="child.ref._bonusBunnyName">{{ child.ref._bonusBunnyName }}</div>
                              </div>
                              <div style="min-width:160px;">
                                <div style="display:flex;gap:3px;align-items:center;">
                                  <input v-model="child.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="child.ref._bonusLocked" @input="scheduleBonusDrmVerify(child.flatIdx)" />
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

                  <!-- === VIDEO without topic (root level) === -->
                  <div v-else>
                    <div class="tree-video-row tree-video-root">
                    <span class="tree-video-num">{{ node.flatIdx + 1 }}</span>
                    <input v-model="node.ref.title" type="text" class="form-control form-control-sm" placeholder="ชื่อวีดีโอ" style="flex:1;min-width:120px;" :disabled="node.ref._locked" />
                    <button v-if="node.ref.bunnyVideoId" type="button" class="btn-rename" @click="renameBunnyFiles(node.ref)" :disabled="node.ref._renaming" :title="'ตั้งชื่อไฟล์ Bunny ทั้ง 2 library'">{{ node.ref._renaming ? '...' : '✏️' }}</button>
                    <div style="min-width:180px;">
                      <div style="display:flex;gap:3px;align-items:center;">
                        <input v-model="node.ref.bunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="node.ref._locked" @input="scheduleVerify(node.flatIdx)" />
                        <span v-if="node.ref._verifying" class="verify-status verifying">...</span>
                        <span v-else-if="node.ref._verified === true" class="verify-status ok">✓</span>
                        <span v-else-if="node.ref._verified === false" class="verify-status fail">✗</span>
                      </div>
                      <div v-if="node.ref._bunnyName" class="bunny-filename">{{ node.ref._bunnyName }}</div>
                    </div>
                    <div style="min-width:180px;">
                      <div style="display:flex;gap:3px;align-items:center;">
                        <input v-model="node.ref.bunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="node.ref._locked" @input="scheduleDrmVerify(node.flatIdx)" />
                        <span v-if="node.ref._drmVerifying" class="verify-status verifying">...</span>
                        <span v-else-if="node.ref._drmVerified === true" class="verify-status ok">✓</span>
                        <span v-else-if="node.ref._drmVerified === false" class="verify-status fail">✗</span>
                      </div>
                      <div v-if="node.ref._drmName" class="bunny-filename drm">{{ node.ref._drmName }}</div>
                      <span v-if="node.ref._durationMismatch" class="duration-warn">⚠ ความยาวไม่ตรง!</span>
                    </div>
                    <!-- ⭐ CN: Alibaba VOD -->
                    <div style="min-width:170px;">
                      <input v-model="node.ref.aliVideoId" type="text" class="form-control form-control-sm ali-input" placeholder="🇨🇳 Ali NoDRM VID" />
                    </div>
                    <div style="min-width:170px;">
                      <input v-model="node.ref.aliDrmVideoId" type="text" class="form-control form-control-sm ali-input drm" placeholder="🇨🇳 Ali DRM VID" />
                    </div>
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
                    <div class="tree-video-actions">
                      <button type="button" class="btn-move btn-move-sm btn-move-insert" @click="insertVideoBefore(node.flatIdx)" title="แทรก VDO ข้างบน">+</button>
                      <button type="button" class="btn-assign-sub" @click="moveVideoTo(node.flatIdx)" title="ย้ายไป Topic/Subtopic">⇄</button>
                      <button type="button" class="btn-move btn-move-sm" :disabled="tIdx === 0" @click="moveVideo(node.flatIdx, -1)" title="ขึ้น">↑</button>
                      <button type="button" class="btn-move btn-move-sm" :disabled="tIdx === treeStructure.length - 1" @click="moveVideo(node.flatIdx, 1)" title="ลง">↓</button>
                      <button type="button" class="btn-move btn-move-sm btn-move-danger" @click="removeVideo(node.flatIdx)" title="ลบ">✕</button>
                      <button type="button" class="btn-bonus-toggle" @click="toggleBonus(node.flatIdx)" :title="node.ref._bonusExpanded ? 'ซ่อน VDO เสริม' : 'VDO เสริม'">{{ node.ref.bonusBunnyVideoId ? '⭐' : '☆' }}</button>
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
                            <input v-model="node.ref.bonusBunnyVideoId" type="text" class="form-control form-control-sm" placeholder="Protection UUID" :disabled="node.ref._bonusLocked" @input="scheduleBonusVerify(node.flatIdx)" />
                            <span v-if="node.ref._bonusVerifying" class="verify-status verifying">...</span>
                            <span v-else-if="node.ref._bonusVerified === true" class="verify-status ok">✓</span>
                            <span v-else-if="node.ref._bonusVerified === false" class="verify-status fail">✗</span>
                          </div>
                          <div v-if="node.ref._bonusBunnyName" class="bunny-filename" :title="node.ref._bonusBunnyName">{{ node.ref._bonusBunnyName }}</div>
                        </div>
                        <div style="min-width:160px;">
                          <div style="display:flex;gap:3px;align-items:center;">
                            <input v-model="node.ref.bonusBunnyDrmVideoId" type="text" class="form-control form-control-sm drm-input" placeholder="Widevine UUID" :disabled="node.ref._bonusLocked" @input="scheduleBonusDrmVerify(node.flatIdx)" />
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
      pdfPanelId: null,
      pdfLibrary: [], // PDF files from Bunny Storage
      refreshing: false,
      collapsed: {},
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
  },
  methods: {
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
        aliDrmVideoId: '',
        bunnyLibraryId: '628424',
        duration: '--:--',
        order: 0,
        requiredTier: 6,
        _verified: null,
        _verifying: false,
        _bunnyName: '',
        _drmVerified: null,
        _drmVerifying: false,
        _drmDuration: '',
        _drmName: '',
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
        aliDrmVideoId: '',
        bunnyLibraryId: '628424',
        duration: '--:--',
        order: this.form.videos.length + 1,
        _verified: null,
        _verifying: false,
        _drmVerified: null,
        _drmVerifying: false,
        _drmDuration: '',
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
        } else if (info.duration) {
          drmDur = info.duration
        }
        video._drmDuration = drmDur
        // เปรียบเทียบ duration กับ Protection UUID
        const protDur = (video.duration || '').replace('--:--', '')
        if (protDur && drmDur && protDur !== drmDur) {
          video._drmVerified = false
          alert(`Duration ไม่ตรงกัน!\nProtection: ${protDur}\nWidevine: ${drmDur}\n\nอาจเป็นไฟล์คนละตัว`)
        } else {
          video._drmVerified = true
        }
      } catch {
        video._drmVerified = false
      } finally {
        video._drmVerifying = false
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
            title: v.title || '',
            topic: v.topic || '',
            subtopic: v.subtopic || '',
            topicId: v.topicId || '',
            subtopicId: v.subtopicId || '',
            bunnyVideoId: v.bunnyVideoId || '',
            bunnyDrmVideoId: v.bunnyDrmVideoId || '',
            aliVideoId: v.aliVideoId || '',
            aliDrmVideoId: v.aliDrmVideoId || '',
            bunnyLibraryId: v.bunnyLibraryId || '628424',
            duration: v.duration || '--:--',
            order: v.order || 0,
            requiredTier: v.requiredTier || 6,
            _verified: v.bunnyVideoId ? true : null,
            _verifying: false,
            _bunnyName: '',
            _drmVerified: v.bunnyDrmVideoId ? true : null,
            _drmVerifying: false,
            _drmDuration: '',
            _drmName: '',
            _renaming: false,
            _durationMismatch: false,
            _locked: !!(v.bunnyVideoId && v.bunnyDrmVideoId),
            // VDO พิเศษ
            bonusLabel: v.bonusLabel || '',
            bonusTitle: v.bonusTitle || '',
            bonusBunnyVideoId: v.bonusBunnyVideoId || '',
            bonusBunnyDrmVideoId: v.bonusBunnyDrmVideoId || '',
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
      const current = video._bunnyName || video._drmName || video.title || ''
      const newName = prompt('ตั้งชื่อไฟล์ Bunny (ทั้ง 2 library):', current)
      if (!newName || newName === current) return

      video._renaming = true
      try {
        const promises = []
        if (video.bunnyVideoId) {
          promises.push(api.put(`/admin/bunny/video/${video.bunnyVideoId.trim()}/rename`, { title: newName, library: 'noDrm' }))
        }
        if (video.bunnyDrmVideoId) {
          promises.push(api.put(`/admin/bunny/video/${video.bunnyDrmVideoId.trim()}/rename`, { title: newName, library: 'drm' }))
        }
        await Promise.all(promises)
        video._bunnyName = newName
        video._drmName = video.bunnyDrmVideoId ? newName : ''
        alert('เปลี่ยนชื่อสำเร็จทั้ง 2 library')
      } catch (err) {
        alert('เปลี่ยนชื่อไม่สำเร็จ: ' + (err.message || err))
      } finally {
        video._renaming = false
      }
    },

    async loadBunnyNames() {
      try {
        const { drm, noDrm } = await api.get('/admin/bunny/video-names')
        for (const video of this.form.videos) {
          const nd = video.bunnyVideoId ? noDrm[video.bunnyVideoId] : null
          const dr = video.bunnyDrmVideoId ? drm[video.bunnyDrmVideoId] : null
          video._bunnyName = nd ? `${nd.title} (${nd.duration})` : ''
          video._drmName = dr ? `${dr.title} (${dr.duration})` : ''
          // เตือนถ้า duration ไม่ตรงกัน
          if (nd && dr && nd.duration !== dr.duration) {
            video._durationMismatch = true
          } else {
            video._durationMismatch = false
          }
          // Bonus video names
          const bnd = video.bonusBunnyVideoId ? noDrm[video.bonusBunnyVideoId] : null
          const bdr = video.bonusBunnyDrmVideoId ? drm[video.bonusBunnyDrmVideoId] : null
          video._bonusBunnyName = bnd ? `${bnd.title} (${bnd.duration})` : ''
          video._bonusDrmName = bdr ? `${bdr.title} (${bdr.duration})` : ''
        }
      } catch { /* ignore */ }
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
        // กรอง video ที่มีข้อมูล — อนุญาตให้ save โครงสร้างเปล่า (มีแค่ title/topic/subtopic ยังไม่มี UUID)
        const validVideos = this.form.videos.filter(v =>
          (v.title || '').trim() || (v.bunnyVideoId || '').trim() || (v.topic || '').trim()
        )

        const payload = {
          code: this.form.code.trim().toUpperCase(),
          name: this.form.name.trim(),
          description: (this.form.description || '').trim(),
          order: this.form.order,
          videos: validVideos.map((v, i) => ({
            title: (v.title || '').trim(),
            topic: (v.topic || '').trim(),
            subtopic: (v.subtopic || '').trim(),
            bunnyVideoId: (v.bunnyVideoId || '').trim(),
            bunnyDrmVideoId: (v.bunnyDrmVideoId || '').trim(),
            bunnyLibraryId: v.bunnyLibraryId || '628424',
            duration: v.duration || '',
            order: i,
            requiredTier: [1, 2, 3, 4, 5, 6].includes(v.requiredTier) ? v.requiredTier : 6,
            // VDO พิเศษ
            bonusLabel: (v.bonusLabel || '').trim(),
            bonusTitle: (v.bonusTitle || '').trim(),
            bonusBunnyVideoId: (v.bonusBunnyVideoId || '').trim(),
            bonusBunnyDrmVideoId: (v.bonusBunnyDrmVideoId || '').trim(),
            bonusDuration: v.bonusDuration || '',
            bonusPdfFile: (v.bonusPdfFile || '').trim(),
            bonusPdfFileName: (v.bonusPdfFileName || '').trim()
          }))
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
        if (vid) { vid.pdfFile = fileName }
        // update ใน DB
        const videos = sec.videos.map(v => {
          if (v.bunnyVideoId === vid.bunnyVideoId) return { ...v, pdfFile: fileName }
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
        if (vid) { vid.bonusPdfFile = fileName }
        const videos = sec.videos.map(v => {
          if (v === vid || (v.bunnyVideoId && v.bunnyVideoId === vid.bunnyVideoId)) return { ...v, bonusPdfFile: fileName }
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

</style>
