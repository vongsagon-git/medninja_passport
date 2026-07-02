<template>
  <div class="admin-page">
    <div class="admin-hero">
      <div class="container">
        <div class="admin-hero-inner">
          <div class="admin-hero-icon">🎯</div>
          <div>
            <h1>DDx Arena</h1>
            <p>Audit โจทย์ · ทดสอบเล่น · จัดการ</p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><span class="hero-stat-num">{{ stats.total }}</span><span class="hero-stat-label">DDx Cards</span></div>
            <div class="hero-stat"><span class="hero-stat-num" style="color:#22c55e">{{ stats.audited }}</span><span class="hero-stat-label">Audited</span></div>
            <div class="hero-stat"><span class="hero-stat-num" style="color:#f59e0b">{{ patternStats.active }}/{{ patternStats.total }}</span><span class="hero-stat-label">Pattern</span></div>
            <div class="hero-stat"><span class="hero-stat-num" style="color:#8b5cf6">{{ ccStats.active }}/{{ ccStats.total }}</span><span class="hero-stat-label">CC</span></div>
          </div>
          <button :class="['btn-maint', maintenance ? 'maint-on' : 'maint-off']" @click="toggleMaintenance">
            {{ maintenance ? '🛡️ Maintenance ON' : '⚔️ Arena LIVE' }}
          </button>
        </div>
      </div>
    </div>

    <div class="container section">
      <div class="tab-bar">
        <button :class="['tab-btn', { active: tab === 'play' }]" @click="tab='play'; startTestPlay()">🎮 ทดสอบเล่น</button>
        <button :class="['tab-btn', { active: tab === 'ddx' }]" @click="tab='ddx'">🧬 DDx ({{ stats.audited || 0 }})</button>
        <button :class="['tab-btn', { active: tab === 'pattern' }]" @click="tab='pattern'; loadPatterns()">⚡ Pattern ({{ patternStats.active || 0 }})</button>
        <button :class="['tab-btn', { active: tab === 'cc' }]" @click="tab='cc'; loadCC()">🎯 CC ({{ ccStats.active || 0 }})</button>
        <button :class="['tab-btn', { active: tab === 'players' }]" @click="tab='players'; loadPlayers()">🏆 Players</button>
      </div>

      <!-- ═══ TAB: ทดสอบเล่น ═══ -->
      <div v-if="tab === 'play'">
        <div v-if="!playQ" class="empty">
          <button class="btn btn-play" @click="startTestPlay()">🎮 เริ่มทดสอบ (Pending {{ pendingCount }} ข้อ)</button>
        </div>
        <div v-else class="play-area">
          <div class="play-header">
            <span class="play-mode-badge" :style="{background: modeColor(playQ.mode)+'22', color: modeColor(playQ.mode), borderColor: modeColor(playQ.mode)+'44'}">{{ modeLabel(playQ.mode) }}</span>
            <span class="play-progress">{{ playIdx + 1 }} / {{ playQuestions.length }}</span>
          </div>

          <!-- โจทย์ -->
          <div class="play-card">
            <div v-if="playQ.relatedCC" class="play-cc">CC: {{ playQ.relatedCC }}</div>
            <!-- DDx: แสดง History/PE/IX -->
            <div v-if="playQ.mode === 'ddx'" class="play-clues">
              <div v-if="playQ.history && playQ.history.length" class="clue-group">
                <span class="clue-label">History</span>
                <span v-for="(h,i) in playQ.history" :key="'h'+i" class="clue-item">{{ h }}</span>
              </div>
              <div v-if="playQ.pe && playQ.pe.length" class="clue-group">
                <span class="clue-label">PE</span>
                <span v-for="(p,i) in playQ.pe" :key="'p'+i" class="clue-item">{{ p }}</span>
              </div>
              <div v-if="playQ.investigation && playQ.investigation.length" class="clue-group">
                <span class="clue-label">IX</span>
                <span v-for="(x,i) in playQ.investigation" :key="'x'+i" class="clue-item">{{ x }}</span>
              </div>
            </div>
            <!-- Pattern/OddOne: prompt -->
            <div v-else class="play-prompt">{{ playQ.prompt }}</div>
          </div>

          <!-- ตัวเลือก -->
          <div v-if="!playAnswered" class="play-choices">
            <button v-for="(c,i) in playQ.choices" :key="i" class="play-choice" @click="answerPlay(i)">
              {{ c.ddx }} <small v-if="c.ddxTh">{{ c.ddxTh }}</small>
            </button>
          </div>

          <!-- ผลลัพธ์ + Audit -->
          <div v-else class="play-result">
            <div :class="['play-result-badge', playCorrect ? 'correct' : 'wrong']">
              {{ playCorrect ? '✅ ถูก!' : '❌ ผิด — คำตอบ: ' + correctAnswer }}
            </div>

            <!-- Choices ที่ออกจริง -->
            <div class="choices-review">
              <div class="audit-mode-label">📋 Choices ที่ออกรอบนี้</div>
              <div v-for="(c,i) in playQ.choices" :key="i" :class="['choice-review-item', c.correct ? 'choice-correct' : 'choice-wrong']">
                {{ c.correct ? '✅' : '❌' }} {{ c.ddx }} <small v-if="c.ddxTh" style="color:#94a3b8">{{ c.ddxTh }}</small>
              </div>
            </div>

            <!-- DDx Card detail -->
            <div v-if="playQ.mode === 'ddx' && playCardDetail" class="audit-detail">
              <div class="audit-mode-label">🧬 DDx Buzzwords</div>
              <div class="audit-field"><label>DDx</label><input v-model="playCardDetail.ddx"></div>
              <div class="audit-field"><label>DDx (TH)</label><input v-model="playCardDetail.ddxTh"></div>
              <div class="audit-field"><label>CC Group</label><input v-model="playCardDetail.relatedCC"></div>
              <div class="audit-field"><label>History</label><textarea v-model="playCardDetail.history" rows="2"></textarea></div>
              <div class="audit-field"><label>PE</label><textarea v-model="playCardDetail.pe" rows="2"></textarea></div>
              <div class="audit-field"><label>Investigation</label><textarea v-model="playCardDetail.investigation" rows="2"></textarea></div>
              <div class="audit-field"><label>Choice หลอก (6 ตัว คั่นด้วย , )</label><textarea v-model="playCardDecoys" rows="2" placeholder="PE, Aortic Dissection, Pericarditis..."></textarea></div>
            </div>

            <!-- Pattern detail -->
            <div v-if="playQ.mode === 'pattern' && playPatternDetail" class="audit-detail">
              <div class="audit-mode-label">⚡ Pattern → DDx</div>
              <div class="audit-field"><label>Pattern</label><textarea v-model="playPatternDetail.pattern" rows="2"></textarea></div>
              <div class="audit-field"><label>Answer (คำตอบถูก)</label><input v-model="playPatternDetail.answer"></div>
              <div class="audit-field"><label>Mnemonic</label><input v-model="playPatternDetail.mnemonic"></div>
              <div class="audit-field"><label>Category</label><input v-model="playPatternDetail.category"></div>
              <div class="audit-field">
                <label>Choice หลอก ที่ออกรอบนี้</label>
                <div class="choice-list-display">
                  <span v-for="c in playQ.choices.filter(x => !x.correct)" :key="c.ddx" class="choice-tag wrong-tag">{{ c.ddx }}</span>
                </div>
              </div>
              <div class="audit-field"><label>กำหนด Choice หลอก (6 ตัว คั่นด้วย , — ว่างไว้ = สุ่มจาก category)</label><textarea v-model="playPatternDecoys" rows="2" placeholder="ว่างไว้ = สุ่มอัตโนมัติ"></textarea></div>
              <div class="audit-field"><label>สถานะ</label><span :style="{color: playPatternDetail.isActive ? '#22c55e' : '#ef4444', fontWeight:700}">{{ playPatternDetail.isActive ? '✅ LIVE' : '❌ OFF' }}</span></div>
            </div>

            <!-- Odd One Out detail -->
            <div v-if="playQ.mode === 'oddone' && playOddDetail" class="audit-detail">
              <div class="audit-mode-label">🎯 Odd One Out</div>
              <div class="audit-field"><label>CC</label><span style="font-weight:700;color:#f97316">{{ playOddDetail.cc }} ({{ playOddDetail.ccEn }})</span></div>
              <div class="audit-field">
                <label>DDx ในกลุ่มนี้ ({{ (playOddDetail.ddxList||[]).length }} ตัว)</label>
                <textarea v-model="playOddDdxList" rows="3" style="font-size:12px"></textarea>
              </div>
              <div class="audit-field">
                <label>ตัวแปลกที่ออกรอบนี้</label>
                <div class="choice-list-display">
                  <span v-for="c in playQ.choices.filter(x => x.correct)" :key="c.ddx" class="choice-tag wrong-tag">{{ c.ddx }} ← ไม่เข้าพวก</span>
                </div>
              </div>
              <div class="audit-field"><label>สถานะ</label><span :style="{color: playOddDetail.isActive ? '#22c55e' : '#ef4444', fontWeight:700}">{{ playOddDetail.isActive ? '✅ LIVE' : '❌ OFF' }}</span></div>
            </div>

            <!-- ไม่มี detail (loading) -->
            <div v-if="!playCardDetail && !playPatternDetail && !playOddDetail" class="audit-detail" style="text-align:center;color:#94a3b8;padding:20px">กำลังโหลดข้อมูล...</div>

            <div class="audit-actions">
              <button class="btn btn-reject" @click="setStatus('rejected')">🗑️ ไม่เอา</button>
              <button class="btn btn-flag" @click="setStatus('flagged')">🚩 Flag</button>
              <button v-if="playCardDetail || playPatternDetail" class="btn btn-save-sm" @click="saveAndAudit()">✏️ แก้ + Approve</button>
              <button class="btn btn-approve" @click="setStatus('approved')">✅ Approve</button>
              <button class="btn btn-next" @click="nextPlay()">⏭ ข้าม</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: DDx Buzzwords ═══ -->
      <div v-if="tab === 'ddx'">
        <div class="action-bar">
          <button class="btn btn-audit-all" @click="auditAll()">✅ Audit ทั้งหมด{{ filterCC ? ' (' + filterCC + ')' : '' }}</button>
          <button class="btn btn-unaudit" @click="unauditAll('ddx')">⏳ Pending ทั้งหมด{{ filterCC ? ' (' + filterCC + ')' : '' }}</button>
          <button class="btn btn-add" @click="openAdd()">+ เพิ่มการ์ด</button>
        </div>
        <div class="filter-bar">
          <select v-model="filterCC" @change="loadCards" class="filter-select">
            <option value="">ทุก CC Group</option>
            <option v-for="cc in ccGroups" :key="cc" :value="cc">{{ cc }}</option>
          </select>
          <select v-model="filterAudit" @change="loadCards" class="filter-select">
            <option value="">ทุกสถานะ</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="flagged">🚩 Flagged</option>
            <option value="rejected">🗑️ Rejected</option>
          </select>
          <span class="filter-count">{{ cards.length }} การ์ด</span>
        </div>
        <div v-if="loading" class="loading">กำลังโหลด...</div>
        <div v-else-if="cards.length === 0" class="empty">ไม่มีการ์ด</div>
        <div v-else class="card-list">
          <div v-for="(c, i) in cards" :key="c._id" class="item-card" :style="{borderLeftColor: c.auditStatus==='approved'||c.isAudited ? '#22c55e' : c.auditStatus==='flagged' ? '#ef4444' : c.auditStatus==='rejected' ? '#64748b' : '#f59e0b'}">
            <div class="item-top">
              <span class="item-num">{{ i + 1 }}</span>
              <span :class="['badge', c.isAudited||c.auditStatus==='approved' ? 'badge-live' : c.auditStatus==='flagged' ? 'badge-flag' : 'badge-draft']">{{ c.auditStatus || (c.isAudited ? 'approved' : 'pending') }}</span>
              <span class="item-cc">{{ c.relatedCC || '' }}</span>
            </div>
            <div class="item-ddx">{{ c.ddx }} <small v-if="c.ddxTh">{{ c.ddxTh }}</small></div>
            <div class="item-detail">
              <span v-if="c.relatedCC" class="item-tag tag-cc">CC: {{ c.relatedCC }}</span>
              <span class="item-tag" :class="clueCount(c) > 0 ? 'tag-ok' : 'tag-warn'">Clues: {{ clueCount(c) }}</span>
              <span class="item-tag" :class="(c.decoys||[]).length >= 6 ? 'tag-ok' : 'tag-warn'">Decoys: {{ (c.decoys||[]).length }}/6</span>
            </div>
            <div class="item-actions">
              <select class="status-select" :value="c.auditStatus || (c.isAudited ? 'approved' : 'pending')" @change="changeStatus(c._id, $event.target.value)">
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="flagged">🚩 Flagged</option>
                <option value="rejected">🗑️ Rejected</option>
              </select>
              <button class="btn-sm btn-play-sm" @click="previewCard(c)">🎮</button>
              <button class="btn-sm btn-edit" @click="openEdit(c)">แก้</button>
              <button class="btn-sm btn-del" @click="deleteCard(c._id)">ลบ</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Pattern ═══ -->
      <div v-if="tab === 'pattern'">
        <div class="action-bar">
          <button class="btn btn-unaudit" @click="unauditAll('pattern')">⏳ Pending Pattern ทั้งหมด</button>
        </div>
        <div v-if="patterns.length === 0" class="empty">ไม่มี Pattern</div>
        <div v-else class="card-list">
          <div v-for="(p, i) in patterns" :key="p._id" class="item-card" :style="{borderLeftColor: p.isActive ? '#22c55e' : '#ef4444'}">
            <div class="item-top">
              <span class="item-num">{{ i + 1 }}</span>
              <span :class="['badge', p.isActive ? 'badge-live' : 'badge-draft']">{{ p.isActive ? 'LIVE' : 'OFF' }}</span>
              <span class="item-cc">{{ p.category }}</span>
            </div>
            <div class="item-ddx">{{ p.pattern }}</div>
            <div class="item-buzz">→ {{ p.answer }}</div>
            <div v-if="p.mnemonic" class="item-buzz" style="color:#8b5cf6">💡 {{ p.mnemonic }}</div>
            <div class="item-actions">
              <button class="btn-sm btn-play-sm" @click="previewPattern(p)">🎮</button>
              <button :class="['btn-sm', p.isActive ? 'btn-del' : 'btn-toggle']" @click="togglePattern(p._id)">{{ p.isActive ? 'OFF' : 'ON' }}</button>
              <button class="btn-sm btn-edit" @click="openEditPattern(p)">แก้</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: CC ═══ -->
      <div v-if="tab === 'cc'">
        <div class="action-bar">
          <button class="btn btn-unaudit" @click="unauditAll('cc')">⏳ Pending CC ทั้งหมด</button>
        </div>
        <div v-if="ccCards.length === 0" class="empty">ไม่มี CC</div>
        <div v-else class="card-list">
          <div v-for="(c, i) in ccCards" :key="c._id" class="item-card" :style="{borderLeftColor: c.isActive ? '#22c55e' : '#ef4444'}">
            <div class="item-top">
              <span class="item-num">{{ i + 1 }}</span>
              <span :class="['badge', c.isActive ? 'badge-live' : 'badge-draft']">{{ c.isActive ? 'LIVE' : 'OFF' }}</span>
              <span class="item-cc">{{ (c.ddxList||[]).length }} DDx</span>
            </div>
            <div class="item-ddx">{{ c.cc }} <small>{{ c.ccEn || '' }}</small></div>
            <div class="item-buzz">{{ (c.ddxList||[]).join(', ') }}</div>
            <div class="item-actions">
              <button class="btn-sm btn-play-sm" @click="previewCC(c)">🎮</button>
              <button class="btn-sm btn-edit" @click="openEditCC(c)">แก้</button>
              <button :class="['btn-sm', c.isActive ? 'btn-del' : 'btn-toggle']" @click="toggleCC(c._id)">{{ c.isActive ? 'OFF' : 'ON' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TAB: Players ═══ -->
      <div v-if="tab === 'players'">
        <!-- ═══ Winner Announcement ═══ -->
        <div class="winner-box">
          <div class="winner-header">
            <span class="winner-icon">🏆</span>
            <span class="winner-title">ประกาศผู้ชนะ DDx Arena</span>
          </div>
          <div class="winner-form">
            <div class="winner-row">
              <label class="winner-label">เดือน
                <select v-model="winnerMonth" class="filter-select">
                  <option v-for="m in playerMonths" :key="m" :value="m">{{ formatMonthFull(m) }}</option>
                </select>
              </label>
              <label class="winner-label">ชื่อผู้ชนะ
                <input v-model="winnerName" class="winner-input" placeholder="เช่น Emmie">
              </label>
            </div>
            <div class="winner-row">
              <label class="winner-label">รางวัล
                <input v-model="winnerPrize" class="winner-input" placeholder="เช่น เข้าใช้ระบบ NLEX ฟรี 7 วัน">
              </label>
              <label class="winner-label" style="max-width:80px">Icon
                <input v-model="winnerPrizeIcon" class="winner-input" placeholder="📘" style="text-align:center">
              </label>
            </div>
            <label class="winner-label">หมายเหตุ (นักเรียนปัจจุบัน)
              <input v-model="winnerPrizeNote" class="winner-input" placeholder="เช่น นักเรียนปัจจุบัน → รับ VDO BONUS แทน">
            </label>
            <div class="winner-actions">
              <button class="btn btn-preview-winner" @click="sendWinner('preview')" :disabled="winnerSending">
                {{ winnerSending === 'preview' ? '...' : '👁️ Preview (ส่งให้ admin)' }}
              </button>
              <button class="btn btn-broadcast-winner" @click="sendWinner('broadcast')" :disabled="winnerSending">
                {{ winnerSending === 'broadcast' ? '...' : '📢 Broadcast ทุกคน' }}
              </button>
            </div>
            <div v-if="winnerResult" :class="['winner-result', winnerResult.ok ? 'ok' : 'err']">{{ winnerResult.msg }}</div>
          </div>
        </div>

        <div class="filter-bar">
          <select v-model="playerMonth" @change="loadPlayers" class="filter-select">
            <option value="">ทุกเดือน (Best Score)</option>
            <option v-for="m in playerMonths" :key="m" :value="m">{{ formatMonth(m) }}</option>
          </select>
          <span class="filter-count">{{ playerList.length }} ผู้เล่น</span>
        </div>
        <div v-if="playerList.length === 0" class="empty">ยังไม่มีผู้เล่น{{ playerMonth ? 'เดือนนี้' : '' }}</div>
        <div v-else class="player-table-wrap">
          <table class="player-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ผู้เล่น</th>
                <th class="num">{{ playerMonth ? 'คะแนนเดือน' : 'Best Score' }}</th>
                <th class="num">เกม</th>
                <th class="num">ถูก</th>
                <th class="num">Streak</th>
                <th>เล่นล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in playerList" :key="p._id" :class="{ 'top-player': i < 3 }">
                <td class="rank-cell">
                  <span v-if="i === 0" class="rank-medal gold">1</span>
                  <span v-else-if="i === 1" class="rank-medal silver">2</span>
                  <span v-else-if="i === 2" class="rank-medal bronze">3</span>
                  <span v-else>{{ i + 1 }}</span>
                </td>
                <td class="player-cell">
                  <img v-if="p.pictureUrl" :src="p.pictureUrl" class="player-avatar">
                  <span v-else class="player-avatar-ph">👤</span>
                  <span class="player-name-text">{{ p.displayName || 'ผู้เล่น' }}</span>
                </td>
                <td class="num score-cell">{{ playerMonth ? p.monthlyScore : p.bestScore }}</td>
                <td class="num">{{ playerMonth ? p.monthlyGames : p.totalGames }}</td>
                <td class="num">{{ p.totalCorrect }}</td>
                <td class="num">{{ p.bestStreak }}</td>
                <td class="date-cell">{{ p.lastPlayedAt ? new Date(p.lastPlayedAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ DDx Edit/Add Modal ═══ -->
    <div v-if="modal" class="modal-overlay" @click.self="modal=false">
      <div class="modal-box">
        <h3>🧬 {{ editing ? 'แก้ไข DDx' : 'เพิ่ม DDx ใหม่' }}</h3>

        <!-- Section 1: คำตอบถูก -->
        <div class="form-section">
          <div class="form-section-title">📌 คำตอบถูก</div>
          <div class="form-section-desc">ชื่อโรคที่ผู้เล่นต้องเลือก</div>
          <label>DDx (EN) * — ชื่อโรคภาษาอังกฤษ<input v-model="form.ddx" placeholder="e.g. ACS/MI"></label>
          <label>DDx (TH) — ชื่อโรคภาษาไทย<input v-model="form.ddxTh" placeholder="e.g. กล้ามเนื้อหัวใจตาย"></label>
        </div>

        <!-- Section 2: CC Group -->
        <div class="form-section">
          <div class="form-section-title">📂 CC Group</div>
          <div class="form-section-desc">อาการนำที่โรคนี้สังกัด</div>
          <label>CC (TH)<input v-model="form.relatedCC" placeholder="e.g. เจ็บหน้าอก"></label>
          <label>CC (EN)<input v-model="form.relatedCCEn" placeholder="e.g. Chest Pain"></label>
        </div>

        <!-- Section 3: เบาะแส (แสดงทีละอัน 3 วิ) -->
        <div class="form-section">
          <div class="form-section-title">🔍 เบาะแส (แสดงทีละอันในเกม)</div>
          <div class="form-section-desc">แต่ละบรรทัด = 1 เบาะแส แสดง 3 วินาที/อัน</div>
          <label>History — ประวัติผู้ป่วย (1 บรรทัด = 1 clue)
            <textarea v-model="form.historyText" rows="3" placeholder="บรรทัดที่ 1: Crushing substernal CP&#10;บรรทัดที่ 2: radiates L arm/jaw&#10;บรรทัดที่ 3: diaphoresis"></textarea>
          </label>
          <label>PE — การตรวจร่างกาย (1 บรรทัด = 1 finding)
            <textarea v-model="form.peText" rows="2" placeholder="บรรทัดที่ 1: Levine sign&#10;บรรทัดที่ 2: S3 gallop"></textarea>
          </label>
          <label>Investigation — ผลตรวจ/แลบ (1 บรรทัด = 1 result)
            <textarea v-model="form.ixText" rows="2" placeholder="บรรทัดที่ 1: troponin↑&#10;บรรทัดที่ 2: ST-elevation V1-V4"></textarea>
          </label>
        </div>

        <!-- Section 4: Choice หลอก -->
        <div class="form-section">
          <div class="form-section-title">❌ Choice หลอก <span style="color:#ef4444">* ต้องครบ 6</span></div>
          <div class="form-section-desc">ระบบสุ่ม 3 จาก 6 มาแสดงในเกม — ห้ามซ้ำกับคำตอบถูก</div>
          <label>1 บรรทัด = 1 choice หลอก
            <textarea v-model="form.decoysText" rows="4" placeholder="PE&#10;Aortic Dissection&#10;Pericarditis&#10;GERD&#10;Pneumothorax&#10;Costochondritis" :style="{borderColor: decoyCount !== 6 ? '#ef4444' : '#22c55e'}"></textarea>
            <span :style="{fontSize:'12px',fontWeight:700,color: decoyCount === 6 ? '#22c55e' : '#ef4444'}">{{ decoyCount }}/6 ตัว {{ decoyCount === 6 ? '✅' : '❌ ต้องครบ 6' }}</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-save" @click="saveCard">{{ editing ? '💾 บันทึก' : '➕ สร้าง' }}</button>
          <button class="btn btn-cancel" @click="modal=false">ยกเลิก</button>
        </div>
      </div>
    </div>

    <!-- ═══ Pattern Edit Modal ═══ -->
    <div v-if="patternModal" class="modal-overlay" @click.self="patternModal=false">
      <div class="modal-box">
        <h3>⚡ แก้ไข Pattern</h3>

        <div class="form-section">
          <div class="form-section-title">📝 โจทย์</div>
          <div class="form-section-desc">ข้อความที่ผู้เล่นเห็น — ต้องเดาว่าเป็นโรคอะไร</div>
          <label>Pattern (โจทย์)<textarea v-model="patternForm.pattern" rows="3"></textarea></label>
        </div>

        <div class="form-section">
          <div class="form-section-title">📌 คำตอบถูก</div>
          <label>Answer — คำตอบที่ถูกต้อง<input v-model="patternForm.answer"></label>
          <label>Category — หมวด (GI, Cardio, Neuro, ...)<input v-model="patternForm.category"></label>
          <label>Mnemonic — ตัวช่วยจำ (แสดงหลังตอบ)<input v-model="patternForm.mnemonic"></label>
        </div>

        <div class="form-section">
          <div class="form-section-title">❌ Choice หลอก <span style="color:#ef4444">* ต้องครบ 6</span></div>
          <div class="form-section-desc">ระบบสุ่ม 3 จาก 6 — ห้ามซ้ำกับ Answer</div>
          <label>1 บรรทัด = 1 choice หลอก
            <textarea v-model="patternForm.decoysText" rows="4" :style="{borderColor: patternDecoyCount !== 6 ? '#ef4444' : '#22c55e'}"></textarea>
            <span :style="{fontSize:'12px',fontWeight:700,color: patternDecoyCount === 6 ? '#22c55e' : '#ef4444'}">{{ patternDecoyCount }}/6 ตัว {{ patternDecoyCount === 6 ? '✅' : '❌' }}</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-save" @click="savePattern">💾 บันทึก</button>
          <button class="btn btn-cancel" @click="patternModal=false">ยกเลิก</button>
        </div>
      </div>
    </div>

    <!-- ═══ CC Edit Modal ═══ -->
    <div v-if="ccModal" class="modal-overlay" @click.self="ccModal=false">
      <div class="modal-box">
        <h3>🎯 แก้ไข CC (Odd One Out)</h3>

        <div class="form-section">
          <div class="form-section-title">📂 Chief Complaint</div>
          <div class="form-section-desc">อาการนำ — ผู้เล่นต้องหาว่าข้อไหนไม่เข้าพวก</div>
          <label>CC (TH) — ชื่ออาการไทย<input v-model="ccForm.cc"></label>
          <label>CC (EN) — ชื่ออาการอังกฤษ<input v-model="ccForm.ccEn"></label>
        </div>

        <div class="form-section">
          <div class="form-section-title">✅ DDx ที่เข้าพวก</div>
          <div class="form-section-desc">โรคที่เกี่ยวข้องกับ CC นี้จริง — สุ่ม 3 ตัวแสดงในเกม (1 บรรทัด = 1 DDx)</div>
          <label><textarea v-model="ccForm.ddxListText" rows="5" placeholder="ACS/MI&#10;PE&#10;Aortic Dissection&#10;Pneumothorax&#10;Pericarditis"></textarea></label>
        </div>

        <div class="form-section">
          <div class="form-section-title">❌ ตัวแปลก (Decoy) <span style="color:#ef4444">* ต้องมีอย่างน้อย 3</span></div>
          <div class="form-section-desc">โรคที่ไม่เกี่ยวกับ CC นี้ — ระบบสุ่ม 1 ตัวมาปนกับ 3 ตัวจริง (1 บรรทัด = 1 ตัวแปลก)</div>
          <label><textarea v-model="ccForm.decoysText" rows="4" :style="{borderColor: ccDecoyCount < 3 ? '#ef4444' : '#22c55e'}" placeholder="Mechanical&#10;Exercise&#10;Coagulopathy&#10;Insomnia&#10;Gout&#10;DKA"></textarea>
            <span :style="{fontSize:'12px',fontWeight:700,color: ccDecoyCount >= 3 ? '#22c55e' : '#ef4444'}">{{ ccDecoyCount }} ตัว {{ ccDecoyCount >= 3 ? '✅' : '❌ ต้องมีอย่างน้อย 3' }}</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-save" @click="saveCC">💾 บันทึก</button>
          <button class="btn btn-cancel" @click="ccModal=false">ยกเลิก</button>
        </div>
      </div>
    </div>

    <!-- ═══ Preview Modal — เห็นเหมือนผู้เล่น ═══ -->
    <div v-if="previewModal" class="modal-overlay" @click.self="previewModal=false">
      <div class="preview-box">
        <button class="preview-close" @click="previewModal=false">✕</button>
        <div class="preview-badge" :style="{background: previewMode==='ddx'?'rgba(59,130,246,.15)':previewMode==='pattern'?'rgba(249,115,22,.15)':'rgba(139,92,237,.15)', color: previewMode==='ddx'?'#60a5fa':previewMode==='pattern'?'#f97316':'#a78bfa', borderColor: previewMode==='ddx'?'rgba(59,130,246,.3)':previewMode==='pattern'?'rgba(249,115,22,.3)':'rgba(139,92,237,.3)'}">
          {{ previewMode === 'ddx' ? '🧬 DDx Buzzwords' : previewMode === 'pattern' ? '⚡ Pattern → DDx' : '🎯 Odd One Out' }}
        </div>

        <!-- DDx mode -->
        <template v-if="previewMode === 'ddx'">
          <div v-if="previewData.relatedCC" class="preview-phase">
            <div class="preview-label">CC</div>
            <div class="preview-text">{{ previewData.relatedCC }} {{ previewData.relatedCCEn ? '(' + previewData.relatedCCEn + ')' : '' }}</div>
          </div>
          <div v-for="(h,i) in (previewData.history||[])" :key="'h'+i" class="preview-phase">
            <div class="preview-label">History</div>
            <div class="preview-text">{{ h }}</div>
          </div>
          <div v-for="(p,i) in (previewData.pe||[])" :key="'p'+i" class="preview-phase">
            <div class="preview-label">PE</div>
            <div class="preview-text">{{ p }}</div>
          </div>
          <div v-for="(x,i) in (previewData.investigation||[])" :key="'x'+i" class="preview-phase">
            <div class="preview-label">Investigation</div>
            <div class="preview-text">{{ x }}</div>
          </div>
          <div class="preview-divider">จากข้อมูลนี้ จงวินิจฉัย DDx</div>
        </template>

        <!-- Pattern mode -->
        <template v-if="previewMode === 'pattern'">
          <div v-if="previewData.category" class="preview-phase">
            <div class="preview-label">{{ previewData.category }}</div>
            <div class="preview-text">{{ previewData.pattern }}</div>
          </div>
          <div v-if="previewData.mnemonic" class="preview-phase">
            <div class="preview-label" style="color:#8b5cf6">Mnemonic</div>
            <div class="preview-text" style="color:#a78bfa">💡 {{ previewData.mnemonic }}</div>
          </div>
          <div class="preview-divider">จาก Pattern นี้ คุณนึกถึง DDx อะไร?</div>
        </template>

        <!-- OddOne mode -->
        <template v-if="previewMode === 'oddone'">
          <div class="preview-phase">
            <div class="preview-label">Chief Complaint</div>
            <div class="preview-text">{{ previewData.cc }} ({{ previewData.ccEn || '' }})</div>
          </div>
          <div class="preview-divider">ข้อใดไม่ใช่ DDx ของ CC นี้?</div>
        </template>

        <!-- Choices -->
        <div class="preview-choices">
          <div v-for="(c,i) in previewChoices" :key="i" :class="['preview-choice', previewAnswered ? (i === previewCorrectIdx ? 'correct' : (i === previewChosen ? 'wrong' : '')) : '']" @click="previewAnswer(i)">
            {{ c.ddx }} <small v-if="c.ddxTh" style="opacity:.6">{{ c.ddxTh }}</small>
          </div>
        </div>
        <!-- Info หลังตอบ -->
        <div v-if="previewAnswered" class="preview-decoys">
          <div v-if="previewMode === 'ddx'" style="font-size:11px;color:#94a3b8;margin-bottom:4px">Decoys ทั้งหมด ({{ (previewData.decoys||[]).length }})</div>
          <div v-if="previewMode === 'ddx'" style="font-size:12px;color:#64748b">{{ (previewData.decoys||[]).join(' · ') }}</div>
          <div v-if="previewMode === 'oddone'" style="font-size:11px;color:#94a3b8">DDx ในกลุ่ม: {{ (previewData.ddxList||[]).join(', ') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'
export default {
  name: 'ManageArena',
  data() {
    return {
      tab: 'play',
      cards: [], ccGroups: [], stats: { total: 0, audited: 0, ccGroups: 0 },
      patterns: [], patternStats: { total: 0, active: 0 },
      ccCards: [], ccStats: { total: 0, active: 0 },
      loading: false, modal: false, editing: false,
      filterCC: '', filterAudit: '',
      form: { ddx: '', ddxTh: '', relatedCC: '', relatedCCEn: '', historyText: '', peText: '', ixText: '', decoysText: '' },
      editId: null,
      // Play test
      maintenance: false,
      pendingCount: 0,
      playQuestions: [], playIdx: 0, playQ: null,
      playAnswered: false, playCorrect: false, correctAnswer: '',
      playCardDetail: null,
      playCardDecoys: '',
      playPatternDetail: null,
      playPatternDecoys: '',
      playOddDetail: null,
      playOddDdxList: '',
      patternModal: false,
      patternForm: { pattern: '', answer: '', mnemonic: '', category: '' },
      patternEditId: null,
      ccModal: false,
      ccForm: { cc: '', ccEn: '', ddxListText: '' },
      ccEditId: null,
      // Players
      playerList: [], playerMonths: [], playerMonth: '',
      // Winner announcement
      winnerMonth: '', winnerName: '', winnerPrize: 'เข้าใช้ระบบ NLEX ฟรี 7 วัน', winnerPrizeIcon: '📘', winnerPrizeNote: 'นักเรียนปัจจุบัน → รับ VDO BONUS แทน', winnerSending: false, winnerResult: null,
      // Preview
      previewModal: false, previewMode: 'ddx', previewData: {}, previewChoices: [], previewCorrectIdx: -1, previewChosen: -1, previewAnswered: false
    }
  },
  computed: {
    decoyCount() { return this.form.decoysText ? this.form.decoysText.split('\n').map(s=>s.trim()).filter(Boolean).length : 0 },
    patternDecoyCount() { return this.patternForm.decoysText ? this.patternForm.decoysText.split('\n').map(s=>s.trim()).filter(Boolean).length : 0 },
    ccDecoyCount() { return this.ccForm.decoysText ? this.ccForm.decoysText.split('\n').map(s=>s.trim()).filter(Boolean).length : 0 },
  },
  mounted() { this.loadCards(); this.loadStats(); this.loadPatterns(); this.loadCC(); this.startTestPlay(); this.loadMaintenance() },
  methods: {
    modeLabel(m) { return { ddx:'🧬 DDx', pattern:'⚡ Pattern', oddone:'🎯 Odd One Out' }[m] || m },
    modeColor(m) { return { ddx:'#3b82f6', pattern:'#f59e0b', oddone:'#8b5cf6' }[m] || '#64748b' },
    async loadMaintenance() {
      try { const d = await api.get('/admin/arena/maintenance'); this.maintenance = d.maintenance } catch (e) {}
    },
    async toggleMaintenance() {
      const enabling = !this.maintenance
      if (enabling && !confirm('เปิด Maintenance Mode? ผู้เล่นจะเห็นหน้า "กำลังลับดาบ"')) return
      try {
        const d = await api.post('/admin/arena/maintenance', { enabled: enabling, message: enabling ? '' : '' })
        this.maintenance = d.maintenance
      } catch (e) { alert('Error: ' + e.message) }
    },

    // ═══ TEST PLAY ═══
    async startTestPlay() {
      try {
        const data = await api.get('/admin/arena/pending-play')
        this.playQuestions = data.questions || []
        this.pendingCount = data.pending || 0
        this.playIdx = 0
        this.playAnswered = false
        this.playCardDetail = null
        this.playQ = this.playQuestions[0] || null
      } catch (e) { console.error(e) }
    },
    answerPlay(idx) {
      const correctIdx = parseInt(atob(this.playQ._a))
      this.playCorrect = idx === correctIdx
      this.correctAnswer = this.playQ.choices[correctIdx]?.ddx || ''
      this.playAnswered = true
      this.playCardDetail = null
      this.playPatternDetail = null
      this.playOddDetail = null
      // โหลด detail ตาม mode
      if (this.playQ.mode === 'ddx' && this.playQ.id) {
        this.loadCardDetail(this.playQ.id)
      } else if (this.playQ.mode === 'pattern' && this.playQ.id) {
        this.loadPatternDetail(this.playQ.id)
      } else if (this.playQ.mode === 'oddone' && this.playQ.id) {
        this.loadOddDetail(this.playQ.id)
      }
    },
    async loadCardDetail(id) {
      try {
        const data = await api.get('/admin/arena/cards')
        const card = (data.cards || []).find(c => c._id === id)
        this.playCardDetail = card ? { ...card } : null
        this.playCardDecoys = card && card.decoys ? card.decoys.join(', ') : ''
      } catch (e) { this.playCardDetail = null }
    },
    async loadPatternDetail(id) {
      try {
        const data = await api.get('/admin/arena/patterns')
        this.playPatternDetail = (data.cards || []).find(c => c._id === id) || null
        this.playPatternDecoys = ''
      } catch (e) { this.playPatternDetail = null }
    },
    async loadOddDetail(id) {
      try {
        const data = await api.get('/admin/arena/cc')
        const card = (data.cards || []).find(c => c._id === id) || null
        this.playOddDetail = card
        this.playOddDdxList = card ? (card.ddxList || []).join(', ') : ''
      } catch (e) { this.playOddDetail = null }
    },
    async setStatus(status) {
      const m = this.playQ.mode, id = this.playQ.id
      try {
        if (m === 'ddx') {
          await api.post(`/admin/arena/cards/${id}/status`, { status })
        } else if (m === 'pattern') {
          // Pattern: approved = ON, อื่น = OFF
          const shouldBeActive = status === 'approved'
          if (this.playPatternDetail && this.playPatternDetail.isActive !== shouldBeActive) {
            await api.post(`/admin/arena/patterns/${id}/toggle`)
          }
        } else if (m === 'oddone') {
          const shouldBeActive = status === 'approved'
          if (this.playOddDetail && this.playOddDetail.isActive !== shouldBeActive) {
            await api.post(`/admin/arena/cc/${id}/toggle`)
          }
        }
      } catch (e) { console.error(e) }
      this.nextPlay()
    },
    async saveAndAudit() {
      const m = this.playQ.mode, id = this.playQ.id
      try {
        if (m === 'ddx' && this.playCardDetail) {
          const body = { ...this.playCardDetail, decoys: this.playCardDecoys ? this.playCardDecoys.split(',').map(s=>s.trim()).filter(Boolean) : [] }
          await api.put(`/admin/arena/cards/${body._id}`, body)
          await api.post(`/admin/arena/cards/${body._id}/status`, { status: 'approved' })
        } else if (m === 'pattern' && this.playPatternDetail) {
          await api.put(`/admin/flashcard/${id}`, {
            pattern: this.playPatternDetail.pattern,
            answer: this.playPatternDetail.answer,
            mnemonic: this.playPatternDetail.mnemonic,
            category: this.playPatternDetail.category
          })
          if (!this.playPatternDetail.isActive) await api.post(`/admin/arena/patterns/${id}/toggle`)
        } else if (m === 'oddone' && this.playOddDetail) {
          await api.put(`/admin/flashcard/cc/${id}`, {
            cc: this.playOddDetail.cc,
            ccEn: this.playOddDetail.ccEn,
            ddxList: this.playOddDdxList ? this.playOddDdxList.split(',').map(s=>s.trim()).filter(Boolean) : []
          })
          if (!this.playOddDetail.isActive) await api.post(`/admin/arena/cc/${id}/toggle`)
        }
      } catch (e) { console.error(e) }
      this.nextPlay()
    },
    nextPlay() {
      this.playIdx++
      this.playAnswered = false
      this.playCardDetail = null
      this.playPatternDetail = null
      this.playPatternDecoys = ''
      this.playOddDetail = null
      this.playOddDdxList = ''
      this.playCardDecoys = ''
      this.playQ = this.playQuestions[this.playIdx] || null
      if (!this.playQ) this.startTestPlay()
    },

    // ═══ CARDS ═══
    async loadCards() {
      this.loading = true
      try {
        const params = {}
        if (this.filterCC) params.cc = this.filterCC
        if (this.filterAudit) params.audited = this.filterAudit
        const data = await api.get('/admin/arena/cards', { params })
        this.cards = data.cards || []
        this.ccGroups = data.ccGroups || []
      } catch (e) { console.error(e) }
      this.loading = false
    },
    async loadStats() {
      try { const data = await api.get('/admin/arena/stats'); if (data.ok) this.stats = data } catch (e) {}
    },
    async loadPatterns() {
      try { const data = await api.get('/admin/arena/patterns'); this.patterns = data.cards || []; this.patternStats = { total: data.total || 0, active: data.active || 0 } } catch (e) {}
    },
    async loadCC() {
      try { const data = await api.get('/admin/arena/cc'); this.ccCards = data.cards || []; this.ccStats = { total: data.total || 0, active: data.active || 0 } } catch (e) {}
    },
    async togglePattern(id) { try { await api.post(`/admin/arena/patterns/${id}/toggle`); this.loadPatterns() } catch (e) {} },
    async toggleCC(id) { try { await api.post(`/admin/arena/cc/${id}/toggle`); this.loadCC() } catch (e) {} },
    async auditAll() {
      const body = this.filterCC ? { cc: this.filterCC } : {}
      try { const data = await api.post('/admin/arena/audit-all', body); alert(`Audit แล้ว ${data.modified} การ์ด`); this.loadCards(); this.loadStats() } catch (e) { alert(e.message) }
    },
    async unauditAll(type) {
      const labels = { ddx: 'DDx', pattern: 'Pattern', cc: 'CC' }
      const label = labels[type] || type
      if (!confirm(`ยืนยัน Pending ${label} ทั้งหมด${this.filterCC && type === 'ddx' ? ' (' + this.filterCC + ')' : ''}?`)) return
      const body = { type }
      if (type === 'ddx' && this.filterCC) body.cc = this.filterCC
      try {
        const data = await api.post('/admin/arena/unaudit-all', body)
        alert(`Pending แล้ว ${data.modified} รายการ`)
        if (type === 'ddx') { this.loadCards(); this.loadStats() }
        else if (type === 'pattern') this.loadPatterns()
        else if (type === 'cc') this.loadCC()
      } catch (e) { alert(e.message) }
    },
    async changeStatus(id, status) { try { await api.post(`/admin/arena/cards/${id}/status`, { status }); this.loadCards(); this.loadStats() } catch (e) {} },
    async deleteCard(id) { if (!confirm('ลบการ์ดนี้?')) return; if (!confirm('ยืนยันอีกครั้ง — ลบแล้วกู้คืนไม่ได้!')) return; try { await api.delete(`/admin/arena/cards/${id}`); this.loadCards(); this.loadStats() } catch (e) {} },
    openAdd() { this.editing = false; this.editId = null; this.form = { ddx:'', ddxTh:'', relatedCC:'', relatedCCEn:'', historyText:'', peText:'', ixText:'', decoysText:'' }; this.modal = true },
    openEdit(c) {
      this.editing = true; this.editId = c._id
      this.form = {
        ddx: c.ddx, ddxTh: c.ddxTh||'',
        relatedCC: c.relatedCC||'', relatedCCEn: c.relatedCCEn||'',
        historyText: Array.isArray(c.history) ? c.history.join('\n') : (c.history||''),
        peText: Array.isArray(c.pe) ? c.pe.join('\n') : (c.pe||''),
        ixText: Array.isArray(c.investigation) ? c.investigation.join('\n') : (c.investigation||''),
        decoysText: (c.decoys||[]).join('\n')
      }
      this.modal = true
    },
    async saveCard() {
      if (!this.form.ddx) return alert('กรุณาใส่ DDx')
      if (this.decoyCount < 6) return alert('Choice หลอกต้องครบ 6 ตัว (ตอนนี้มี ' + this.decoyCount + ')')
      const body = {
        ddx: this.form.ddx, ddxTh: this.form.ddxTh,
        relatedCC: this.form.relatedCC, relatedCCEn: this.form.relatedCCEn,
        history: this.form.historyText.split('\n').map(s=>s.trim()).filter(Boolean),
        pe: this.form.peText.split('\n').map(s=>s.trim()).filter(Boolean),
        investigation: this.form.ixText.split('\n').map(s=>s.trim()).filter(Boolean),
        decoys: this.form.decoysText.split('\n').map(s=>s.trim()).filter(Boolean)
      }
      delete body.decoysText
      try { if (this.editing) await api.put(`/admin/arena/cards/${this.editId}`, body); else await api.post('/admin/arena/cards', body); this.modal = false; this.loadCards(); this.loadStats() } catch (e) { alert(e.message) }
    },
    // Pattern edit
    openEditPattern(p) {
      this.patternEditId = p._id
      this.patternForm = { pattern: p.pattern||'', answer: p.answer||'', mnemonic: p.mnemonic||'', category: p.category||'', decoysText: (p.decoys||[]).join('\n') }
      this.patternModal = true
    },
    async savePattern() {
      if (this.patternDecoyCount < 6) return alert('Choice หลอกต้องครบ 6 ตัว')
      try {
        const body = { ...this.patternForm, decoys: this.patternForm.decoysText.split('\n').map(s=>s.trim()).filter(Boolean) }
        delete body.decoysText
        await api.put(`/admin/flashcard/${this.patternEditId}`, body)
        this.patternModal = false
        this.loadPatterns()
      } catch (e) { alert('Error: ' + e.message) }
    },
    // CC edit
    openEditCC(c) {
      this.ccEditId = c._id
      this.ccForm = { cc: c.cc||'', ccEn: c.ccEn||'', ddxListText: (c.ddxList||[]).join('\n'), decoysText: (c.decoys||[]).join('\n') }
      this.ccModal = true
    },
    async saveCC() {
      if (this.ccDecoyCount < 3) return alert('ตัวแปลกต้องมีอย่างน้อย 3 ตัว')
      try {
        const ddxList = this.ccForm.ddxListText.split('\n').map(s=>s.trim()).filter(Boolean)
        const decoys = this.ccForm.decoysText.split('\n').map(s=>s.trim()).filter(Boolean)
        await api.put(`/admin/flashcard/cc/${this.ccEditId}`, { cc: this.ccForm.cc, ccEn: this.ccForm.ccEn, ddxList, ddxCount: ddxList.length, decoys })
        this.ccModal = false
        this.loadCC()
      } catch (e) { alert('Error: ' + e.message) }
    },
    // Preview — เห็นเหมือนผู้เล่น
    previewCard(c) {
      this.previewMode = 'ddx'
      this.previewData = c
      const decoys = [...(c.decoys || [])].sort(() => Math.random() - 0.5).slice(0, 3)
      const choices = [
        { ddx: c.ddx, ddxTh: c.ddxTh || '' },
        ...decoys.map(d => ({ ddx: d, ddxTh: '' }))
      ].sort(() => Math.random() - 0.5)
      this.previewChoices = choices
      this.previewCorrectIdx = choices.findIndex(ch => ch.ddx === c.ddx)
      this.previewChosen = -1
      this.previewAnswered = false
      this.previewModal = true
    },
    previewPattern(p) {
      this.previewMode = 'pattern'
      this.previewData = p
      // คำตอบถูก + สุ่ม 3 จาก decoys
      const decoys = [...(p.decoys || [])].sort(() => Math.random() - 0.5).slice(0, 3)
      const choices = [
        { ddx: p.answer, ddxTh: '' },
        ...decoys.map(d => ({ ddx: d, ddxTh: '' }))
      ].sort(() => Math.random() - 0.5)
      this.previewChoices = choices
      this.previewCorrectIdx = choices.findIndex(ch => ch.ddx === p.answer)
      this.previewChosen = -1
      this.previewAnswered = false
      this.previewModal = true
    },
    previewCC(c) {
      this.previewMode = 'oddone'
      this.previewData = c
      // สุ่ม 3 DDx จากกลุ่ม + 1 ตัวแปลกจาก decoys
      const insiders = [...(c.ddxList || [])].sort(() => Math.random() - 0.5).slice(0, 3)
      const oddOne = (c.decoys || [])[Math.floor(Math.random() * (c.decoys || []).length)] || 'Unknown'
      const choices = [
        ...insiders.map(d => ({ ddx: d, ddxTh: '' })),
        { ddx: oddOne, ddxTh: '' }
      ].sort(() => Math.random() - 0.5)
      this.previewChoices = choices
      this.previewCorrectIdx = choices.findIndex(ch => ch.ddx === oddOne)
      this.previewChosen = -1
      this.previewAnswered = false
      this.previewModal = true
    },
    previewAnswer(idx) {
      if (this.previewAnswered) return
      this.previewChosen = idx
      this.previewAnswered = true
    },
    truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || '—') },
    clueCount(c) { return (Array.isArray(c.history) ? c.history.length : 0) + (Array.isArray(c.pe) ? c.pe.length : 0) + (Array.isArray(c.investigation) ? c.investigation.length : 0) },
    // Players
    async loadPlayers() {
      try {
        const params = this.playerMonth ? { month: this.playerMonth } : {}
        const data = await api.get('/admin/arena/players', { params })
        this.playerList = data.players || []
        this.playerMonths = data.months || []
      } catch (e) { console.error(e) }
    },
    formatMonth(m) {
      if (!m) return ''
      const [y, mo] = m.split('-')
      const names = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
      return names[parseInt(mo)] + ' ' + (parseInt(y) + 543)
    },
    formatMonthFull(m) {
      if (!m) return ''
      const [y, mo] = m.split('-')
      const names = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
      return names[parseInt(mo)] + ' ' + (parseInt(y) + 543)
    },
    async sendWinner(mode) {
      if (!this.winnerName.trim()) return alert('กรุณาใส่ชื่อผู้ชนะ')
      if (!this.winnerMonth) return alert('กรุณาเลือกเดือน')
      if (!this.winnerPrize.trim()) return alert('กรุณาใส่รางวัล')
      if (mode === 'broadcast' && !confirm('ยืนยัน Broadcast ประกาศผู้ชนะไปทุกคน?')) return
      this.winnerSending = mode
      this.winnerResult = null
      try {
        const res = await api.post('/admin/arena/broadcast-winner', {
          mode,
          month: this.formatMonthFull(this.winnerMonth),
          winnerName: this.winnerName.trim(),
          prize: this.winnerPrize.trim(),
          prizeIcon: this.winnerPrizeIcon || '📘',
          prizeNote: this.winnerPrizeNote.trim()
        })
        this.winnerResult = { ok: true, msg: mode === 'broadcast' ? '📢 Broadcast สำเร็จ!' : '👁️ ส่ง Preview ให้ admin แล้ว — เช็ค LINE' }
      } catch (e) {
        this.winnerResult = { ok: false, msg: 'ผิดพลาด: ' + (e.response?.data?.message || e.message) }
      } finally {
        this.winnerSending = false
      }
    },
  }
}
</script>

<style scoped>
.admin-page{min-height:100vh;background:#f8fafc}
.admin-hero{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:32px 0}
.container{max-width:1200px;margin:0 auto;padding:0 24px}
.admin-hero-inner{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.admin-hero-icon{font-size:32px}
.admin-hero-inner h1{font-size:24px;font-weight:800;margin-bottom:2px}
.admin-hero-inner p{font-size:13px;color:#94a3b8}
.hero-stats{display:flex;gap:20px;margin-left:auto}
.hero-stat{text-align:center}
.hero-stat-num{display:block;font-size:22px;font-weight:800;color:#f97316}
.hero-stat-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
.section{padding:24px 0}
.tab-bar{display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid #e2e8f0;overflow-x:auto}
.tab-btn{padding:12px 16px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:none;color:#64748b;font-family:'Noto Sans Thai',sans-serif;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
.tab-btn.active{color:#f97316;border-bottom-color:#f97316}
.action-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.btn{padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Noto Sans Thai',sans-serif;transition:all .15s}
.btn-audit-all{background:#22c55e;color:#fff}
.btn-add{background:#f97316;color:#fff}
.btn-unaudit{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5}
.btn-save{background:#22c55e;color:#fff;padding:12px 32px}
.btn-cancel{background:#e2e8f0;color:#334155;padding:12px 32px}
.filter-bar{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.filter-select{padding:8px 14px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-family:'Noto Sans Thai',sans-serif;background:#fff}
.filter-count{font-size:13px;color:#64748b;margin-left:auto}
.loading,.empty{text-align:center;padding:40px;color:#94a3b8;font-size:16px}
.card-list{display:flex;flex-direction:column;gap:8px}
.item-card{background:#fff;border-radius:12px;padding:14px;border:1px solid #e2e8f0;border-left:4px solid #f59e0b}
.item-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.item-num{font-size:11px;color:#94a3b8;font-weight:700;min-width:20px}
.item-cc{font-size:11px;color:#64748b;margin-left:auto}
.item-ddx{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px}
.item-ddx small{font-size:11px;color:#94a3b8;font-weight:400;margin-left:6px}
.item-detail{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.item-tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;display:inline-block}
.tag-cc{background:#eff6ff;color:#3b82f6}
.tag-ok{background:#f0fdf4;color:#22c55e}
.tag-warn{background:#fef2f2;color:#ef4444}
.item-actions{display:flex;gap:6px;flex-wrap:wrap}
.badge{padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;text-align:center}
.badge-live{background:#dcfce7;color:#16a34a}
.badge-draft{background:#fef3c7;color:#d97706}
.badge-flag{background:#fef2f2;color:#ef4444}
.btn-sm{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid #e2e8f0;background:#fff;font-family:'Noto Sans Thai',sans-serif}
.btn-toggle{color:#3b82f6;border-color:#93c5fd}.btn-toggle:hover{background:#eff6ff}
.btn-edit{color:#f59e0b;border-color:#fcd34d}.btn-edit:hover{background:#fffbeb}
.btn-del{color:#ef4444;border-color:#fca5a5}.btn-del:hover{background:#fef2f2}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100}
.modal-box{background:#fff;border-radius:16px;padding:32px;max-width:600px;width:95%;max-height:90vh;overflow-y:auto}
.modal-box h3{font-size:18px;font-weight:800;margin-bottom:20px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-grid label{display:flex;flex-direction:column;font-size:12px;font-weight:600;color:#475569;gap:4px}
.form-grid label.full{grid-column:1/-1}
.form-grid input,.form-grid textarea{padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;font-family:'Noto Sans Thai',sans-serif;resize:vertical}
.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
.form-section{margin-bottom:20px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0}
.form-section label{display:flex;flex-direction:column;font-size:12px;font-weight:600;color:#475569;gap:4px;margin-top:10px}
.form-section label:first-of-type{margin-top:0}
.form-section input,.form-section textarea{padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;font-family:'Noto Sans Thai',sans-serif;resize:vertical}
.form-section input:focus,.form-section textarea:focus{outline:none;border-color:#3b82f6}
.form-section-title{font-size:14px;font-weight:800;color:#1e293b;margin-bottom:2px}
.form-section-desc{font-size:11px;color:#94a3b8;margin-bottom:10px}

/* ═══ PLAY TEST — Dark theme เหมือนเกมจริง ═══ */
.btn-play{background:linear-gradient(135deg,#f97316,#dc2626);color:#fff;padding:16px 40px;font-size:18px;border-radius:14px;box-shadow:0 4px 20px rgba(249,115,22,.3)}
.play-area{max-width:700px;margin:0 auto;background:#0a0a0f;border-radius:20px;padding:24px;border:1px solid rgba(255,255,255,.06)}
.play-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.play-mode-badge{padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid}
.play-progress{font-size:13px;color:#94a3b8;font-weight:700;font-family:'Orbitron',monospace}
.play-card{background:#12121a;border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,.06);margin-bottom:16px;position:relative}
.play-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#7c3aed,#f97316);border-radius:16px 16px 0 0}
.play-prompt{font-size:18px;font-weight:600;line-height:1.7;color:#e2e8f0}
.play-cc{font-size:12px;color:#64748b;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)}
.play-choices{display:flex;flex-direction:column;gap:10px}
.play-choice{padding:16px 20px;border-radius:12px;border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:15px;font-weight:600;cursor:pointer;text-align:left;font-family:'Noto Sans Thai',sans-serif;transition:all .15s;color:#e2e8f0}
.play-choice:hover{border-color:#f97316;background:rgba(249,115,22,.06);transform:translateY(-2px);box-shadow:0 8px 30px rgba(249,115,22,.1)}
.play-choice small{display:block;font-size:12px;color:#64748b;font-weight:400;margin-top:2px}
.play-result{margin-top:16px}
.play-result-badge{padding:14px 20px;border-radius:12px;font-size:16px;font-weight:700;text-align:center;margin-bottom:16px}
.play-result-badge.correct{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.3)}
.play-result-badge.wrong{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3)}
.audit-detail{background:#12121a;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px;border:1px solid rgba(255,255,255,.06)}
.audit-field{display:flex;flex-direction:column;gap:4px}
.audit-field label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.audit-field input,.audit-field textarea{padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e2e8f0;font-size:13px;font-family:'Noto Sans Thai',sans-serif;resize:vertical}
.audit-field input:focus,.audit-field textarea:focus{outline:none;border-color:#f97316}
.audit-mode-label{font-size:13px;font-weight:800;color:#f97316;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}
.choices-review{background:#12121a;border-radius:12px;padding:12px 16px;margin-bottom:12px;border:1px solid rgba(255,255,255,.06)}
.choice-review-item{padding:6px 0;font-size:13px;border-bottom:1px solid rgba(255,255,255,.04)}
.choice-review-item:last-child{border-bottom:none}
.choice-correct{color:#22c55e;font-weight:700}
.choice-wrong{color:#64748b}
.choice-list-display{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.choice-tag{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600}
.correct-tag{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
.wrong-tag{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
.audit-actions{display:flex;gap:8px;flex-wrap:wrap}
.btn-reject{background:rgba(100,100,100,.1);color:#94a3b8;border:1px solid rgba(100,100,100,.3);flex:1;border-radius:10px;padding:12px;font-size:14px}
.btn-flag{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3);flex:1;border-radius:10px;padding:12px;font-size:14px}
.btn-approve{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.3);flex:1;border-radius:10px;padding:12px;font-size:14px}
.btn-save-sm{background:rgba(59,130,246,.1);color:#3b82f6;border:1px solid rgba(59,130,246,.3);flex:1;border-radius:10px;padding:12px;font-size:14px}
.btn-next{background:rgba(255,255,255,.05);color:#94a3b8;border:1px solid rgba(255,255,255,.1);flex:1;border-radius:10px;padding:12px;font-size:14px}

/* Clues display in play test */
.play-clues{display:flex;flex-direction:column;gap:8px}
.clue-group{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.clue-label{font-size:10px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:1px;min-width:50px}
.clue-item{background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);color:#fdba74;padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600}
.btn-play-sm{color:#8b5cf6;border-color:#a78bfa;background:rgba(139,92,237,.05)}.btn-play-sm:hover{background:rgba(139,92,237,.15)}

/* Preview modal — dark theme เหมือนเกม */
.preview-box{background:#0a0a0f;border-radius:20px;padding:24px;max-width:500px;width:95%;max-height:90vh;overflow-y:auto;border:1px solid rgba(255,255,255,.06);position:relative}
.preview-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:16px;cursor:pointer}
.preview-badge{text-align:center;margin-bottom:16px;padding:6px 16px;display:inline-block;background:rgba(59,130,246,.15);color:#60a5fa;border-radius:20px;font-size:12px;font-weight:700;border:1px solid rgba(59,130,246,.3)}
.preview-phase{margin-bottom:10px}
.preview-label{font-size:10px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.preview-label::before{content:'';width:6px;height:6px;border-radius:50%;background:#f97316}
.preview-text{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:8px 14px;border-radius:8px;color:#e2e8f0;font-size:14px;font-weight:600}
.preview-divider{text-align:center;font-size:12px;font-weight:700;color:#64748b;margin:16px 0 12px;letter-spacing:2px;text-transform:uppercase}
.preview-choices{display:flex;flex-direction:column;gap:8px}
.preview-choice{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);padding:12px 16px;border-radius:10px;color:#e2e8f0;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
.preview-choice:hover{background:rgba(255,255,255,.08)}
.preview-choice.correct{border-color:#22c55e;background:rgba(34,197,94,.1);color:#22c55e}
.preview-choice.wrong{border-color:#ef4444;background:rgba(239,68,68,.1);color:#ef4444}
.preview-decoys{margin-top:16px;padding:12px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}

/* ═══ MOBILE ═══ */
.admin-page{overflow-x:hidden;max-width:100vw}
.container{overflow-x:hidden}
.play-area{overflow-x:hidden;word-break:break-word}
.audit-detail{overflow-x:hidden;word-break:break-word}
.choices-review{overflow-x:hidden;word-break:break-word}

@media(max-width:768px){
  .admin-page{padding:0;margin:0}
  .container{padding:0 8px;max-width:100vw}
  .admin-hero{padding:16px 0}
  .admin-hero-inner{flex-direction:column;text-align:center;gap:10px}
  .admin-hero-inner h1{font-size:18px}
  .admin-hero-inner p{font-size:11px}
  .admin-hero-icon{font-size:24px}
  .hero-stats{margin-left:0;gap:8px;flex-wrap:wrap;justify-content:center}
  .hero-stat-num{font-size:16px}
  .hero-stat-label{font-size:8px}
  .section{padding:12px 0}
  .tab-bar{gap:0;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .tab-btn{padding:8px 8px;font-size:10px;flex-shrink:0}
  .item-card{padding:10px;border-radius:10px}
  .item-ddx{font-size:13px}
  .item-buzz{font-size:11px}
  .item-actions{gap:4px}
  .item-actions .btn-sm{font-size:10px;padding:3px 8px}
  .form-grid{grid-template-columns:1fr}
  .modal-box{padding:16px 12px;width:96%;max-height:85vh}
  .modal-box h3{font-size:16px}
  .play-area{padding:12px;margin:0 -8px;border-radius:12px}
  .play-card{padding:12px;border-radius:12px}
  .play-card::before{height:2px}
  .play-prompt{font-size:13px;line-height:1.6}
  .play-cc{font-size:10px}
  .play-choice{padding:10px 12px;font-size:12px;border-radius:10px}
  .play-choice small{font-size:10px}
  .play-header{flex-wrap:wrap;gap:6px}
  .play-mode-badge{font-size:10px;padding:3px 8px}
  .play-progress{font-size:11px}
  .play-result-badge{font-size:13px;padding:10px 12px;border-radius:10px}
  .choices-review{padding:8px 10px;border-radius:10px}
  .choice-review-item{font-size:11px;padding:4px 0}
  .audit-detail{padding:10px;border-radius:10px}
  .audit-mode-label{font-size:12px}
  .audit-field label{font-size:9px;letter-spacing:.5px}
  .audit-field input,.audit-field textarea{font-size:12px;padding:6px 8px;border-radius:6px;width:100%;box-sizing:border-box}
  .audit-actions{flex-direction:column;gap:6px}
  .audit-actions .btn{font-size:12px;padding:10px;border-radius:8px;width:100%;text-align:center}
  .choice-list-display{gap:4px}
  .choice-tag{font-size:10px;padding:3px 7px;border-radius:6px}
  .filter-bar{flex-direction:column;gap:6px}
  .filter-select{width:100%;font-size:12px}
  .filter-count{font-size:11px;margin-left:0}
  .action-bar{flex-direction:column;gap:6px}
  .action-bar .btn{width:100%;text-align:center;justify-content:center;font-size:12px;padding:8px}
  .btn-play{padding:12px 24px;font-size:15px}
  .empty{padding:24px;font-size:14px}
  .player-table{font-size:11px}
  .player-table th,.player-table td{padding:6px 4px}
  .player-avatar{width:24px;height:24px}
  .player-avatar-ph{width:24px;height:24px;font-size:12px}
  .status-select{font-size:10px;padding:2px 4px}
}

/* Players table */
.player-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #e2e8f0}
.player-table{width:100%;border-collapse:collapse;font-size:13px}
.player-table th{background:#f1f5f9;padding:10px 12px;text-align:left;font-weight:700;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0;position:sticky;top:0}
.player-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
.player-table .num{text-align:right;font-family:'Orbitron',monospace;font-weight:700}
.player-table .score-cell{font-size:16px;color:#f97316}
.player-table .date-cell{font-size:11px;color:#94a3b8}
.player-table .rank-cell{text-align:center;width:40px}
.rank-medal{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;font-weight:900;font-size:13px;color:#fff}
.rank-medal.gold{background:linear-gradient(135deg,#f59e0b,#d97706)}
.rank-medal.silver{background:linear-gradient(135deg,#94a3b8,#64748b)}
.rank-medal.bronze{background:linear-gradient(135deg,#d97706,#92400e)}
.top-player td{background:#fffbeb}
.player-cell{display:flex;align-items:center;gap:8px}
.player-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover}
.player-avatar-ph{width:32px;height:32px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:16px}
.player-name-text{font-weight:600}
.status-select{padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer;font-family:'Noto Sans Thai',sans-serif;background:#fff}
.btn-maint{padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Noto Sans Thai',sans-serif;transition:all .2s;margin-left:auto}
.maint-on{background:#fee2e2;color:#dc2626;animation:maintPulse 2s ease-in-out infinite}
.maint-off{background:#d1fae5;color:#059669}
@keyframes maintPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.3)}50%{box-shadow:0 0 12px 4px rgba(220,38,38,.2)}}
/* Winner Announcement */
.winner-box{background:#fff;border-radius:14px;border:2px solid #fbbf24;padding:20px;margin-bottom:20px}
.winner-header{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.winner-icon{font-size:24px}
.winner-title{font-size:16px;font-weight:800;color:#1e293b}
.winner-form{display:flex;flex-direction:column;gap:12px}
.winner-row{display:flex;gap:12px;flex-wrap:wrap}
.winner-row>*{flex:1;min-width:160px}
.winner-label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:#64748b}
.winner-input{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;font-family:'Noto Sans Thai',sans-serif}
.winner-input:focus{outline:none;border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.winner-actions{display:flex;gap:10px;margin-top:4px}
.btn-preview-winner{background:#f1f5f9;color:#334155;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid #e2e8f0;font-family:'Noto Sans Thai',sans-serif}
.btn-preview-winner:hover{background:#e2e8f0}
.btn-broadcast-winner{background:#f97316;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Noto Sans Thai',sans-serif}
.btn-broadcast-winner:hover{background:#ea580c}
.btn-broadcast-winner:disabled,.btn-preview-winner:disabled{opacity:.5;cursor:not-allowed}
.winner-result{padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600}
.winner-result.ok{background:#f0fdf4;color:#16a34a}
.winner-result.err{background:#fef2f2;color:#dc2626}
</style>
