<template>
  <div class="mindmap-page">
    <!-- Header -->
    <div class="mm-header">
      <div class="mm-header-inner">
        <div class="mm-logo">
          <span class="mm-logo-icon">🧠</span>
          <div>
            <h1>NINJA DDx <span class="mm-sub">Mindmap</span></h1>
            <p>กดเปิด-ปิด เพื่อสำรวจ DDx ทุกระบบ</p>
          </div>
        </div>
        <div class="mm-stats">
          <div class="mm-stat"><span class="mm-stat-num">{{ allCategories.length }}</span><span class="mm-stat-label">ระบบ</span></div>
          <div class="mm-stat"><span class="mm-stat-num">{{ totalSymptoms }}</span><span class="mm-stat-label">อาการ</span></div>
          <div class="mm-stat"><span class="mm-stat-num">{{ totalDdx }}</span><span class="mm-stat-label">DDx</span></div>
        </div>
      </div>
    </div>

    <!-- View Switcher -->
    <div class="mm-views">
      <button :class="['mm-view-btn', { active: viewMode === 'system' }]" @click="viewMode = 'system'">
        <span class="mv-icon">🏥</span> ระบบ First
      </button>
      <button :class="['mm-view-btn', { active: viewMode === 'cc' }]" @click="viewMode = 'cc'">
        <span class="mv-icon">🤒</span> CC First
      </button>
      <button :class="['mm-view-btn', { active: viewMode === 'ddx' }]" @click="viewMode = 'ddx'">
        <span class="mv-icon">🔬</span> DDx First
      </button>
    </div>

    <!-- Controls -->
    <div class="mm-controls">
      <button class="mm-ctrl-btn" @click="expandAll">เปิดทั้งหมด</button>
      <button class="mm-ctrl-btn" @click="collapseAll">ปิดทั้งหมด</button>
      <div class="mm-search-wrap">
        <input v-model="searchQuery" class="mm-search" placeholder="🔍 ค้นหาโรค/อาการ..." />
        <span v-if="searchQuery" class="mm-search-clear" @click="searchQuery = ''">✕</span>
      </div>
    </div>

    <!-- ═══ Tree: System First ═══ -->
    <div v-if="viewMode === 'system'" class="mm-tree">
      <!-- Root node -->
      <div class="mm-root-node">
        <span class="mm-root-icon">🏥</span>
        <span class="mm-root-label">Differential Diagnosis</span>
      </div>
      <div class="mm-root-children">
        <!-- Level 1: Category (System) -->
        <div v-for="cat in filteredCategories" :key="cat.code" class="mm-branch">
          <div class="mm-node level-1" :class="{ open: cat.open }" @click="toggleCat(cat)">
            <span class="mm-toggle">{{ cat.open ? '▼' : '▶' }}</span>
            <span class="mm-node-icon" :style="{ background: cat.color + '20', color: cat.color }">{{ cat.icon }}</span>
            <span class="mm-node-label">{{ cat.name }}</span>
            <span class="mm-node-en">{{ cat.nameEn }}</span>
            <span class="mm-node-count">{{ cat.symptoms.length }} อาการ</span>
          </div>

          <!-- Level 2: Symptom -->
          <div v-if="cat.open" class="mm-children level-1-children">
            <div v-for="(sym, si) in cat.symptoms" :key="sym.nameEn" class="mm-branch">
              <div class="mm-node level-2" :class="{ open: sym.open }" @click="toggleSym(sym)">
                <span class="mm-toggle">{{ sym.open ? '▼' : '▶' }}</span>
                <span class="mm-node-dot" :style="{ background: cat.color }"></span>
                <span class="mm-node-label">{{ sym.name }}</span>
                <span class="mm-node-en">{{ sym.nameEn }}</span>
                <span class="mm-node-count">{{ sym.differentials.length }} DDx</span>
              </div>

              <!-- Level 3: DDx -->
              <div v-if="sym.open" class="mm-children level-2-children">
                <div v-for="(ddx, di) in sym.differentials" :key="ddx.diagnosis" class="mm-branch">
                  <div class="mm-node level-3" :class="{ open: ddx.open, ['freq-' + ddx.frequency]: true }" @click="toggleDdx(ddx)">
                    <span class="mm-toggle">{{ ddx.open ? '▼' : '▶' }}</span>
                    <span :class="['mm-freq', ddx.frequency]">{{ { high: 'H', med: 'M', low: 'L' }[ddx.frequency] }}</span>
                    <span class="mm-node-label">{{ ddx.diagnosis }}</span>
                    <span class="mm-node-th">{{ ddx.diagnosisTh }}</span>
                  </div>

                  <!-- Level 4: Detail -->
                  <div v-if="ddx.open" class="mm-detail">
                    <div class="mm-detail-grid">
                      <div class="mm-detail-item clue">
                        <div class="mm-detail-label">🔍 Key Clues</div>
                        <div class="mm-detail-tags">
                          <span v-for="c in ddx.keyClues" :key="c" class="mm-tag clue">{{ c }}</span>
                        </div>
                      </div>
                      <div v-if="ddx.redFlags && ddx.redFlags.length" class="mm-detail-item red">
                        <div class="mm-detail-label">🚨 Red Flags</div>
                        <div class="mm-detail-tags">
                          <span v-for="r in ddx.redFlags" :key="r" class="mm-tag red">{{ r }}</span>
                        </div>
                      </div>
                      <div class="mm-detail-item invest">
                        <div class="mm-detail-label">🔬 Investigation</div>
                        <div class="mm-detail-tags">
                          <span v-for="inv in ddx.investigation" :key="inv" class="mm-tag invest">{{ inv }}</span>
                        </div>
                      </div>
                      <div v-if="ddx.treatment" class="mm-detail-item treat">
                        <div class="mm-detail-label">💊 Treatment</div>
                        <p>{{ ddx.treatment }}</p>
                      </div>
                      <div v-if="ddx.firstLine" class="mm-detail-item drug">
                        <div class="mm-detail-label">🥇 First-line</div>
                        <p>{{ ddx.firstLine }}</p>
                      </div>
                      <div v-if="ddx.dontMiss" class="mm-detail-item warn">
                        <div class="mm-detail-label">⛔ ห้ามลืม</div>
                        <p>{{ ddx.dontMiss }}</p>
                      </div>
                      <div v-if="ddx.examTip" class="mm-detail-item tip">
                        <div class="mm-detail-label">💡 Exam Tip</div>
                        <p>{{ ddx.examTip }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Tree: CC First ═══ -->
    <div v-if="viewMode === 'cc'" class="mm-tree">
      <div class="mm-root-node">
        <span class="mm-root-icon">🤒</span>
        <span class="mm-root-label">Chief Complaints (อาการ)</span>
      </div>
      <div class="mm-root-children">
        <div v-for="sym in ccFirstData" :key="sym.nameEn" class="mm-branch">
          <div class="mm-node level-1" :class="{ open: sym.open }" @click="toggleCcSym(sym)">
            <span class="mm-toggle">{{ sym.open ? '▼' : '▶' }}</span>
            <span class="mm-node-dot" :style="{ background: sym.color }"></span>
            <span class="mm-node-label">{{ sym.name }}</span>
            <span class="mm-node-en">{{ sym.nameEn }}</span>
            <span class="mm-node-en" style="margin-left:4px">— {{ sym.category }}</span>
            <span class="mm-node-count">{{ sym.differentials.length }} DDx</span>
          </div>
          <div v-if="sym.open" class="mm-children level-1-children">
            <div v-for="(ddx, di) in sym.differentials" :key="ddx.diagnosis" class="mm-branch">
              <div class="mm-node level-3" :class="{ open: ddx.open, ['freq-' + ddx.frequency]: true }" @click="toggleCcDdx(ddx, sym)">
                <span class="mm-toggle">{{ ddx.open ? '▼' : '▶' }}</span>
                <span :class="['mm-freq', ddx.frequency]">{{ { high: 'H', med: 'M', low: 'L' }[ddx.frequency] }}</span>
                <span class="mm-node-label">{{ ddx.diagnosis }}</span>
                <span class="mm-node-th">{{ ddx.diagnosisTh }}</span>
              </div>
              <div v-if="ddx.open" class="mm-detail">
                <div class="mm-detail-grid">
                  <div class="mm-detail-item clue"><div class="mm-detail-label">🔍 Key Clues</div><div class="mm-detail-tags"><span v-for="c in ddx.keyClues" :key="c" class="mm-tag clue">{{ c }}</span></div></div>
                  <div v-if="ddx.redFlags && ddx.redFlags.length" class="mm-detail-item red"><div class="mm-detail-label">🚨 Red Flags</div><div class="mm-detail-tags"><span v-for="r in ddx.redFlags" :key="r" class="mm-tag red">{{ r }}</span></div></div>
                  <div v-if="ddx.treatment" class="mm-detail-item treat"><div class="mm-detail-label">💊 Treatment</div><p>{{ ddx.treatment }}</p></div>
                  <div v-if="ddx.firstLine" class="mm-detail-item drug"><div class="mm-detail-label">🥇 First-line</div><p>{{ ddx.firstLine }}</p></div>
                  <div v-if="ddx.examTip" class="mm-detail-item tip"><div class="mm-detail-label">💡 Exam Tip</div><p>{{ ddx.examTip }}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Tree: DDx First ═══ -->
    <div v-if="viewMode === 'ddx'" class="mm-tree">
      <div class="mm-root-node">
        <span class="mm-root-icon">🔬</span>
        <span class="mm-root-label">Diagnoses (โรค A-Z)</span>
      </div>
      <div class="mm-root-children">
        <div v-for="ddx in ddxFirstData" :key="ddx.diagnosis + ddx.symptomName" class="mm-branch">
          <div class="mm-node level-3" :class="{ open: ddx.open, ['freq-' + ddx.frequency]: true }" @click="toggleDdxFirst(ddx)">
            <span class="mm-toggle">{{ ddx.open ? '▼' : '▶' }}</span>
            <span :class="['mm-freq', ddx.frequency]">{{ { high: 'H', med: 'M', low: 'L' }[ddx.frequency] }}</span>
            <span class="mm-node-label">{{ ddx.diagnosis }}</span>
            <span class="mm-node-th">{{ ddx.diagnosisTh }}</span>
            <span class="mm-node-en" style="margin-left:auto">← {{ ddx.symptomName }}</span>
          </div>
          <div v-if="ddx.open" class="mm-detail">
            <div class="mm-detail-from">
              <span class="mm-detail-from-label">มาด้วยอาการ:</span>
              <span class="mm-detail-from-val" :style="{ color: ddx.color }">{{ ddx.icon }} {{ ddx.symptomName }} ({{ ddx.symptomEn }})</span>
              <span class="mm-detail-from-cat">{{ ddx.category }}</span>
            </div>
            <div class="mm-detail-grid">
              <div class="mm-detail-item clue"><div class="mm-detail-label">🔍 Key Clues</div><div class="mm-detail-tags"><span v-for="c in ddx.keyClues" :key="c" class="mm-tag clue">{{ c }}</span></div></div>
              <div v-if="ddx.redFlags && ddx.redFlags.length" class="mm-detail-item red"><div class="mm-detail-label">🚨 Red Flags</div><div class="mm-detail-tags"><span v-for="r in ddx.redFlags" :key="r" class="mm-tag red">{{ r }}</span></div></div>
              <div class="mm-detail-item invest"><div class="mm-detail-label">🔬 Investigation</div><div class="mm-detail-tags"><span v-for="inv in ddx.investigation" :key="inv" class="mm-tag invest">{{ inv }}</span></div></div>
              <div v-if="ddx.treatment" class="mm-detail-item treat"><div class="mm-detail-label">💊 Treatment</div><p>{{ ddx.treatment }}</p></div>
              <div v-if="ddx.firstLine" class="mm-detail-item drug"><div class="mm-detail-label">🥇 First-line</div><p>{{ ddx.firstLine }}</p></div>
              <div v-if="ddx.dontMiss" class="mm-detail-item warn"><div class="mm-detail-label">⛔ ห้ามลืม</div><p>{{ ddx.dontMiss }}</p></div>
              <div v-if="ddx.examTip" class="mm-detail-item tip"><div class="mm-detail-label">💡 Exam Tip</div><p>{{ ddx.examTip }}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../services/api'

const searchQuery = ref('')
const viewMode = ref('system')
const loading = ref(true)

const allCategories = reactive([])

onMounted(async () => {
  try {
    const { data } = await api.get('/ddx/categories')
    const mapped = data.categories.map(cat => ({
      ...cat,
      open: false,
      symptoms: cat.symptoms.map(sym => ({
        ...sym,
        open: false,
        differentials: sym.differentials.map(d => ({ ...d, open: false }))
      }))
    }))
    allCategories.push(...mapped)
  } catch (e) {
    console.error('Failed to load DDx data', e)
  } finally {
    loading.value = false
  }
})

const totalSymptoms = computed(() => allCategories.reduce((s, c) => s + c.symptoms.length, 0))
const totalDdx = computed(() => allCategories.reduce((s, c) => s + c.symptoms.reduce((s2, sy) => s2 + sy.differentials.length, 0), 0))

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return allCategories
  const q = searchQuery.value.toLowerCase()
  return allCategories.map(cat => {
    const filteredSymptoms = cat.symptoms.map(sym => {
      const filteredDdx = sym.differentials.filter(d =>
        d.diagnosis.toLowerCase().includes(q) ||
        d.diagnosisTh.includes(q) ||
        d.keyClues.some(c => c.toLowerCase().includes(q)) ||
        (d.examTip && d.examTip.toLowerCase().includes(q))
      )
      if (filteredDdx.length || sym.name.includes(q) || sym.nameEn.toLowerCase().includes(q)) {
        return { ...sym, open: true, differentials: filteredDdx.length ? filteredDdx.map(d => ({ ...d, open: false })) : sym.differentials.map(d => ({ ...d, open: false })) }
      }
      return null
    }).filter(Boolean)
    if (filteredSymptoms.length || cat.name.includes(q) || cat.nameEn.toLowerCase().includes(q)) {
      return { ...cat, open: true, symptoms: filteredSymptoms.length ? filteredSymptoms : cat.symptoms }
    }
    return null
  }).filter(Boolean)
})

function toggleCat(cat) {
  const opening = !cat.open
  // ปิดระบบอื่นทั้งหมด
  allCategories.forEach(c => {
    if (c !== cat) {
      c.open = false
      c.symptoms.forEach(s => { s.open = false; s.differentials.forEach(d => { d.open = false }) })
    }
  })
  cat.open = opening
}
function toggleSym(sym) {
  const opening = !sym.open
  // ปิดอาการอื่นในระบบเดียวกัน
  const parentCat = allCategories.find(c => c.symptoms.includes(sym))
  if (parentCat) {
    parentCat.symptoms.forEach(s => {
      if (s !== sym) { s.open = false; s.differentials.forEach(d => { d.open = false }) }
    })
  }
  sym.open = opening
}
function toggleDdx(ddx) {
  const opening = !ddx.open
  // ปิด DDx อื่นในอาการเดียวกัน
  for (const cat of allCategories) {
    for (const sym of cat.symptoms) {
      if (sym.differentials.includes(ddx)) {
        sym.differentials.forEach(d => { if (d !== ddx) d.open = false })
        break
      }
    }
  }
  ddx.open = opening
}

// CC First: flat list of all symptoms
const ccFirstData = reactive(
  ddxCategories.flatMap(cat =>
    cat.symptoms.map(sym => ({
      name: sym.name,
      nameEn: sym.nameEn,
      category: cat.name,
      categoryCode: cat.code,
      color: cat.color,
      icon: cat.icon,
      open: false,
      differentials: sym.differentials.map(d => ({ ...d, open: false }))
    }))
  ).sort((a, b) => a.name.localeCompare(b.name, 'th'))
)

// DDx First: flat list of all diagnoses
const ddxFirstData = reactive(
  ddxCategories.flatMap(cat =>
    cat.symptoms.flatMap(sym =>
      sym.differentials.map(d => ({
        ...d,
        open: false,
        symptomName: sym.name,
        symptomEn: sym.nameEn,
        category: cat.name,
        color: cat.color,
        icon: cat.icon
      }))
    )
  ).sort((a, b) => a.diagnosis.localeCompare(b.diagnosis))
)

function toggleCcSym(sym) {
  const opening = !sym.open
  ccFirstData.forEach(s => { if (s !== sym) { s.open = false; s.differentials.forEach(d => { d.open = false }) } })
  sym.open = opening
}
function toggleCcDdx(ddx, sym) {
  const opening = !ddx.open
  sym.differentials.forEach(d => { if (d !== ddx) d.open = false })
  ddx.open = opening
}
function toggleDdxFirst(ddx) {
  const opening = !ddx.open
  ddxFirstData.forEach(d => { if (d !== ddx) d.open = false })
  ddx.open = opening
}

function expandAll() {
  allCategories.forEach(c => {
    c.open = true
    c.symptoms.forEach(s => { s.open = true })
  })
}
function collapseAll() {
  allCategories.forEach(c => {
    c.open = false
    c.symptoms.forEach(s => {
      s.open = false
      s.differentials.forEach(d => { d.open = false })
    })
  })
}
</script>

<style scoped>
/* ═══ Page ═══ */
.mindmap-page { min-height: 100vh; background: #0a0e1a; color: #e2e8f0; font-family: 'Noto Sans Thai', sans-serif; }

/* ═══ Header ═══ */
.mm-header { background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%); border-bottom: 1px solid rgba(255,255,255,.06); padding: 24px 0; }
.mm-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.mm-logo { display: flex; align-items: center; gap: 14px; }
.mm-logo-icon { font-size: 36px; }
.mm-logo h1 { font-size: 22px; font-weight: 800; margin: 0; color: #fff; }
.mm-sub { font-weight: 400; color: #64748b; font-size: 16px; }
.mm-logo p { font-size: 13px; color: #64748b; margin: 2px 0 0; }
.mm-stats { display: flex; gap: 20px; }
.mm-stat { text-align: center; }
.mm-stat-num { display: block; font-size: 24px; font-weight: 800; color: #60a5fa; }
.mm-stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }

/* ═══ View Switcher ═══ */
.mm-views { max-width: 1100px; margin: 0 auto; padding: 16px 24px 0; display: flex; gap: 8px; }
.mm-view-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; }
.mm-view-btn:hover { background: rgba(255,255,255,.06); color: #e2e8f0; }
.mm-view-btn.active { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.3); color: #60a5fa; }
.mv-icon { font-size: 16px; }

/* ═══ Controls ═══ */
.mm-controls { max-width: 1100px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mm-ctrl-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: 'Noto Sans Thai', sans-serif; }
.mm-ctrl-btn:hover { background: rgba(255,255,255,.08); color: #e2e8f0; }
.mm-search-wrap { flex: 1; min-width: 200px; position: relative; }
.mm-search { width: 100%; padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); color: #e2e8f0; font-size: 13px; font-family: 'Noto Sans Thai', sans-serif; outline: none; }
.mm-search:focus { border-color: #3b82f6; background: rgba(59,130,246,.06); }
.mm-search::placeholder { color: #475569; }
.mm-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #64748b; font-size: 14px; }

/* ═══ Tree ═══ */
.mm-tree { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; }
.mm-root-node { display: flex; align-items: center; gap: 10px; padding: 14px 0; }
.mm-root-icon { font-size: 24px; }
.mm-root-label { font-size: 18px; font-weight: 700; color: #e2e8f0; }
.mm-root-children { padding-left: 16px; border-left: 2px solid rgba(255,255,255,.06); }

/* ═══ Branch ═══ */
.mm-branch { position: relative; }
.mm-branch::before { content: ''; position: absolute; left: -16px; top: 20px; width: 16px; height: 0; border-top: 2px solid rgba(255,255,255,.06); }

/* ═══ Node ═══ */
.mm-node { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin: 4px 0; border-radius: 10px; cursor: pointer; transition: all .15s; flex-wrap: wrap; }
.mm-toggle { width: 16px; font-size: 10px; color: #475569; flex-shrink: 0; }

/* Level 1: Category */
.mm-node.level-1 { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); }
.mm-node.level-1:hover { background: rgba(255,255,255,.06); }
.mm-node.level-1.open { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); }
.mm-node-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.mm-node-label { font-weight: 600; font-size: 14px; color: #e2e8f0; }
.mm-node-en { font-size: 12px; color: #475569; }
.mm-node-count { margin-left: auto; font-size: 11px; color: #64748b; background: rgba(255,255,255,.05); padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }

/* Level 2: Symptom */
.mm-node.level-2 { background: rgba(255,255,255,.02); border: 1px solid transparent; }
.mm-node.level-2:hover { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.06); }
.mm-node.level-2.open { background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.15); }
.mm-node-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.mm-node-th { font-size: 12px; color: #64748b; }

/* Level 3: DDx */
.mm-node.level-3 { background: rgba(255,255,255,.015); border: 1px solid transparent; padding: 8px 14px; }
.mm-node.level-3:hover { background: rgba(255,255,255,.04); }
.mm-node.level-3.open { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); }
.mm-node.level-3.freq-high .mm-node-label { color: #fbbf24; }
.mm-node.level-3.freq-med .mm-node-label { color: #94a3b8; }
.mm-node.level-3.freq-low .mm-node-label { color: #475569; }
.mm-freq { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
.mm-freq.high { background: rgba(251,191,36,.15); color: #fbbf24; }
.mm-freq.med { background: rgba(148,163,184,.1); color: #94a3b8; }
.mm-freq.low { background: rgba(71,85,105,.1); color: #475569; }

/* Children containers */
.mm-children { padding-left: 24px; border-left: 2px solid rgba(255,255,255,.04); }
.level-1-children { border-color: rgba(255,255,255,.06); }
.level-2-children { border-color: rgba(59,130,246,.1); }

/* ═══ Detail ═══ */
.mm-detail { margin: 4px 0 8px 40px; padding: 16px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.mm-detail-grid { display: flex; flex-direction: column; gap: 12px; }
.mm-detail-item { padding: 10px 14px; border-radius: 8px; }
.mm-detail-item.clue { background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.12); }
.mm-detail-item.red { background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.12); }
.mm-detail-item.invest { background: rgba(34,197,94,.06); border: 1px solid rgba(34,197,94,.12); }
.mm-detail-item.treat { background: rgba(99,102,241,.06); border: 1px solid rgba(99,102,241,.12); }
.mm-detail-item.drug { background: rgba(16,185,129,.06); border: 1px solid rgba(16,185,129,.12); }
.mm-detail-item.warn { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.15); }
.mm-detail-item.tip { background: rgba(251,191,36,.06); border: 1px solid rgba(251,191,36,.12); }

.mm-detail-label { font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .3px; }
.mm-detail-item p { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
.mm-detail-item.warn p { color: #fca5a5; font-weight: 600; }
.mm-detail-item.drug p { color: #6ee7b7; font-weight: 600; }
.mm-detail-item.tip p { color: #fde68a; }

.mm-detail-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.mm-tag { padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.mm-tag.clue { background: rgba(59,130,246,.1); color: #93c5fd; border: 1px solid rgba(59,130,246,.15); }
.mm-tag.red { background: rgba(239,68,68,.1); color: #fca5a5; border: 1px solid rgba(239,68,68,.15); }
.mm-tag.invest { background: rgba(34,197,94,.1); color: #86efac; border: 1px solid rgba(34,197,94,.15); }

/* ═══ DDx First "from" label ═══ */
.mm-detail-from { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,.03); border-radius: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.mm-detail-from-label { font-size: 11px; color: #64748b; font-weight: 600; }
.mm-detail-from-val { font-size: 14px; font-weight: 600; }
.mm-detail-from-cat { font-size: 11px; color: #475569; background: rgba(255,255,255,.05); padding: 2px 8px; border-radius: 4px; }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .mm-header-inner { flex-direction: column; align-items: flex-start; }
  .mm-children { padding-left: 14px; }
  .mm-detail { margin-left: 20px; }
  .mm-node { padding: 8px 10px; gap: 8px; }
}
</style>
