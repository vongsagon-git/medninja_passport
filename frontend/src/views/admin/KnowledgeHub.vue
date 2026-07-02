<template>
  <div class="khub">
    <!-- Header bar (Synapse style: black) -->
    <header class="khub-hdr">
      <a href="/admin" class="khub-hdr-back">&#8592; กลับ Admin</a>
      <div class="khub-hdr-title">NINJA KNOWLEDGE</div>
      <div class="khub-hdr-badge">DDx HUB</div>
      <div class="khub-hdr-stats">{{ stats.topics }} อาการ · {{ stats.systems }} ระบบ</div>
    </header>

    <!-- Sidebar + Stage layout -->
    <div class="khub-body">
      <!-- LEFT: System + topic tree -->
      <aside class="khub-side" :class="{ collapsed: sideCollapsed }">
        <!-- Search -->
        <div class="khub-search">
          <input
            v-model="search"
            type="text"
            placeholder="ค้นหาอาการ..."
            @keyup.enter="onSearchEnter"
          />
          <button v-if="search" class="khub-search-x" @click="search = ''">×</button>
        </div>

        <!-- Search results (if searching) -->
        <div v-if="search" class="khub-side-list">
          <div v-if="!searchResults.length" class="khub-side-empty">ไม่พบ</div>
          <button
            v-for="r in searchResults.slice(0, 30)"
            :key="r.id"
            class="khub-topic-row"
            :class="{ active: selectedTopicId === r.id }"
            @click="openTopic(r)"
          >
            <span class="khub-topic-emoji">{{ systemMap[r.systemId]?.icon }}</span>
            <span class="khub-topic-name">{{ r.label }}</span>
            <span class="khub-topic-th">{{ r.labelTh }}</span>
          </button>
        </div>

        <!-- System+topic browse mode -->
        <div v-else class="khub-side-list">
          <div v-for="s in activeSystems" :key="s.id" class="khub-sys-group">
            <button
              class="khub-sys-row"
              :class="{ open: openSystems.has(s.id) }"
              @click="toggleSystem(s.id)"
            >
              <span class="khub-sys-emoji">{{ s.icon }}</span>
              <span class="khub-sys-name">{{ s.label }}</span>
              <span class="khub-sys-count">{{ s.topics.length }}</span>
              <span class="khub-sys-chev">{{ openSystems.has(s.id) ? '▾' : '▸' }}</span>
            </button>
            <div v-if="openSystems.has(s.id)" class="khub-topics-list">
              <button
                v-for="t in s.topics"
                :key="t.id"
                class="khub-topic-row"
                :class="{ active: selectedTopicId === t.id }"
                @click="openTopic({ ...t, systemId: s.id })"
              >
                <span class="khub-topic-tree">{{ t.content.ddxTree ? '🌳' : '○' }}</span>
                <span class="khub-topic-name">{{ t.label }}</span>
                <span class="khub-topic-th">{{ t.labelTh }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Side toggle -->
      <button class="khub-side-toggle" @click="sideCollapsed = !sideCollapsed" :title="sideCollapsed ? 'แสดง sidebar' : 'ซ่อน sidebar'">
        {{ sideCollapsed ? '›' : '‹' }}
      </button>

      <!-- STAGE: Mind map / content -->
      <main class="khub-stage">
        <div v-if="!selectedTopic" class="khub-welcome">
          <div class="khub-welcome-inner">
            <div class="khub-welcome-title">FROM SYMPTOM TO <span class="pur">DIAGNOSIS</span></div>
            <div class="khub-welcome-sub">รวมตำราอายุรศาสตร์ระดับชาติ — เลือกอาการเพื่อเปิด Mind Map</div>
            <div class="khub-welcome-stats">
              <div class="khub-wstat"><div class="khub-wnum">{{ stats.topics }}</div><div class="khub-wlabel">TOPICS</div></div>
              <div class="khub-wstat"><div class="khub-wnum">{{ stats.systems }}</div><div class="khub-wlabel">SYSTEMS</div></div>
              <div class="khub-wstat"><div class="khub-wnum">{{ topicsWithTree }}</div><div class="khub-wlabel">MIND MAPS</div></div>
              <div class="khub-wstat"><div class="khub-wnum">2</div><div class="khub-wlabel">SOURCES</div></div>
            </div>
            <div class="khub-welcome-hint">↓ คลิกอาการยอดนิยมข้างล่าง หรือเปิดระบบจาก sidebar</div>
            <div class="khub-quick">
              <button v-for="q in quickTopics" :key="q.id" class="khub-quick-btn" @click="openTopic(q)">
                <span class="khub-quick-emoji">{{ systemMap[q.systemId]?.icon }}</span>
                <span>{{ q.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="khub-topic-view">
          <!-- Topic header (brutalism style) -->
          <div class="khub-topic-head" :style="{ '--sys-color': systemMap[selectedTopic.systemId]?.color }">
            <div class="khub-topic-meta-bar">
              <span class="khub-topic-sys">{{ systemMap[selectedTopic.systemId]?.icon }} {{ systemMap[selectedTopic.systemId]?.label }}</span>
              <span class="khub-topic-sources">
                <span v-if="selectedTopic.sources?.includes('pnut')" class="khub-src-pill khub-src-p">P</span>
                <span v-if="selectedTopic.sources?.includes('siriraj')" class="khub-src-pill khub-src-s">S</span>
              </span>
            </div>
            <h1 class="khub-topic-name-big">{{ selectedTopic.label }}</h1>
            <div v-if="selectedTopic.labelTh" class="khub-topic-th-big">{{ selectedTopic.labelTh }}</div>

            <!-- Tab bar -->
            <div class="khub-tabs">
              <button
                v-if="selectedTopic.content.ddxTree"
                class="khub-tab" :class="{ active: tab === 'tree' }"
                @click="tab = 'tree'"
              >🌳 MIND MAP</button>
              <button
                v-if="selectedTopic.content.sections?.length"
                class="khub-tab" :class="{ active: tab === 'detail' }"
                @click="tab = 'detail'"
              >📝 รายละเอียด</button>
              <button
                v-if="selectedTopic.content.redFlags?.length"
                class="khub-tab" :class="{ active: tab === 'redflag' }"
                @click="tab = 'redflag'"
              >⚠ RED FLAGS ({{ selectedTopic.content.redFlags.length }})</button>
              <button
                v-if="selectedTopic.content.tables?.length"
                class="khub-tab" :class="{ active: tab === 'tables' }"
                @click="tab = 'tables'"
              >📊 ตาราง ({{ selectedTopic.content.tables.length }})</button>
              <button
                v-if="selectedTopic.content.keyPoints?.length"
                class="khub-tab" :class="{ active: tab === 'key' }"
                @click="tab = 'key'"
              >💡 KEY POINTS</button>
            </div>
          </div>

          <!-- Tab content -->
          <div class="khub-topic-body">
            <!-- MIND MAP — takes full remaining height -->
            <div v-if="tab === 'tree' && selectedTopic.content.ddxTree" class="khub-mm-host">
              <MindMapCanvas
                :tree="selectedTopic.content.ddxTree"
                :accent-color="systemMap[selectedTopic.systemId]?.color || '#8b5cf6'"
                :key="selectedTopic.id"
              />
            </div>

            <div v-else-if="tab === 'detail'" class="khub-pane">
              <div v-for="(sec, i) in selectedTopic.content.sections" :key="i" class="khub-section">
                <h3 class="khub-section-title">{{ sec.heading }}</h3>
                <div v-if="sec.body" class="khub-section-body" v-html="renderMd(sec.body)"></div>
              </div>
            </div>

            <div v-else-if="tab === 'redflag'" class="khub-pane">
              <ul class="khub-redflags">
                <li v-for="(rf, i) in selectedTopic.content.redFlags" :key="i" v-html="renderInline(rf)"></li>
              </ul>
            </div>

            <div v-else-if="tab === 'tables'" class="khub-pane">
              <div v-for="(tb, i) in selectedTopic.content.tables" :key="i" class="khub-table-wrap">
                <table class="khub-table">
                  <thead><tr><th v-for="(h, hi) in tb.headers" :key="hi">{{ h }}</th></tr></thead>
                  <tbody>
                    <tr v-for="(row, ri) in tb.rows" :key="ri">
                      <td v-for="(cell, ci) in row" :key="ci" v-html="renderInline(cell)"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else-if="tab === 'key'" class="khub-pane">
              <ul class="khub-keypoints">
                <li v-for="(k, i) in selectedTopic.content.keyPoints" :key="i" v-html="renderInline(k)"></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Recent footer (mini) -->
    <div v-if="recent.length && selectedTopic" class="khub-recent">
      <span class="khub-recent-label">ดูล่าสุด:</span>
      <button v-for="r in recent" :key="r.id" class="khub-recent-pill" @click="openTopic(r)">
        {{ systemMap[r.systemId]?.icon }} {{ r.label }}
      </button>
    </div>
  </div>
</template>

<script>
import knowledgeTree from '../../data/knowledge-tree.json'
import MindMapCanvas from '../../components/khub/MindMapCanvas.vue'

const RECENT_KEY = 'khub-recent'
const RECENT_LIMIT = 5
const QUICK = ['Chest Pain', 'Dyspnea and Positional Related Dyspnea', 'Cough', 'Headache', 'Anemia', 'Jaundice', 'Joint Pain', 'Weight Loss']

export default {
  name: 'KnowledgeHub',
  components: { MindMapCanvas },
  data() {
    return {
      tree: knowledgeTree,
      search: '',
      openSystems: new Set(['cardio']),
      selectedTopic: null,
      selectedTopicId: null,
      tab: 'tree',
      recent: [],
      sideCollapsed: false,
    }
  },
  computed: {
    stats() { return this.tree.stats },
    activeSystems() { return this.tree.systems.filter(s => s.topics.length) },
    systemMap() { return Object.fromEntries(this.tree.systems.map(s => [s.id, s])) },
    topicsWithTree() {
      let n = 0
      for (const s of this.tree.systems) for (const t of s.topics) if (t.content.ddxTree) n++
      return n
    },
    searchResults() {
      const q = this.search.trim().toLowerCase()
      if (!q) return []
      return this.tree.index.filter(t => {
        const hay = `${t.label} ${t.labelTh} ${(t.aliases || []).join(' ')}`.toLowerCase()
        return hay.includes(q)
      })
    },
    quickTopics() {
      const result = []
      for (const name of QUICK) {
        const found = this.tree.index.find(i => i.label === name)
        if (found) result.push(found)
      }
      return result
    },
  },
  mounted() {
    this.loadRecent()
  },
  methods: {
    toggleSystem(id) {
      if (this.openSystems.has(id)) this.openSystems.delete(id)
      else this.openSystems.add(id)
      this.openSystems = new Set(this.openSystems)
    },
    openTopic(refOrTopic) {
      let topic = refOrTopic
      if (!topic.content) {
        const sys = this.tree.systems.find(s => s.id === refOrTopic.systemId)
        topic = sys?.topics.find(t => t.id === refOrTopic.id)
        if (!topic) return
        topic = { ...topic, systemId: refOrTopic.systemId }
      } else if (!topic.systemId) {
        // try to discover from tree
        for (const sys of this.tree.systems) {
          if (sys.topics.find(t => t.id === topic.id)) { topic = { ...topic, systemId: sys.id }; break }
        }
      }
      this.selectedTopic = topic
      this.selectedTopicId = topic.id
      // pick first available tab
      this.tab = topic.content.ddxTree ? 'tree'
        : topic.content.sections?.length ? 'detail'
        : topic.content.redFlags?.length ? 'redflag'
        : topic.content.tables?.length ? 'tables'
        : 'key'
      // ensure system is open in sidebar
      this.openSystems.add(topic.systemId)
      this.openSystems = new Set(this.openSystems)
      this.pushRecent(topic)
      this.search = ''
    },
    onSearchEnter() {
      if (this.searchResults.length) this.openTopic(this.searchResults[0])
    },
    pushRecent(topic) {
      const entry = {
        id: topic.id,
        label: topic.label,
        labelTh: topic.labelTh,
        systemId: topic.systemId,
      }
      const list = (this.recent || []).filter(r => r.id !== entry.id)
      list.unshift(entry)
      this.recent = list.slice(0, RECENT_LIMIT)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(this.recent)) } catch {}
    },
    loadRecent() {
      try {
        const raw = localStorage.getItem(RECENT_KEY)
        if (raw) this.recent = JSON.parse(raw) || []
      } catch {}
    },
    renderInline(s) {
      if (!s) return ''
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
    },
    renderMd(text) {
      if (!text) return ''
      const lines = String(text).split('\n')
      let html = ''
      let inList = false
      for (const line of lines) {
        const bullet = line.match(/^\s*[-*]\s+(.+)$/)
        if (bullet) {
          if (!inList) { html += '<ul>'; inList = true }
          html += `<li>${this.renderInline(bullet[1])}</li>`
        } else {
          if (inList) { html += '</ul>'; inList = false }
          if (line.trim()) html += `<p>${this.renderInline(line)}</p>`
        }
      }
      if (inList) html += '</ul>'
      return html
    },
  },
}
</script>

<style scoped>
/* ───── Theme: Synapse (Neo-brutalism) ───── */
.khub {
  --paper: #fafaf7;
  --ink: #0a0a0a;
  --pur: #8b5cf6;
  --pur-dark: #6d28d9;
  --red: #e63946;
  --mute: #888;
  --line: #e5e7eb;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Noto Sans Thai', sans-serif;
  overflow: hidden;
}

/* Header */
.khub-hdr {
  background: var(--ink);
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 2px solid var(--ink);
  flex-shrink: 0;
}
.khub-hdr-back {
  color: #94a3b8;
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
  transition: color .15s;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.khub-hdr-back:hover { color: #fff; }
.khub-hdr-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  flex: 1;
}
.khub-hdr-badge {
  background: var(--pur);
  color: #fff;
  padding: 3px 10px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}
.khub-hdr-stats {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #64748b;
  letter-spacing: 1px;
}

/* Body: sidebar + stage */
.khub-body {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}

/* Sidebar */
.khub-side {
  width: 320px;
  background: #fff;
  border-right: 2px solid var(--ink);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width .25s cubic-bezier(0.4, 0, 0.2, 1);
}
.khub-side.collapsed {
  width: 0;
  overflow: hidden;
}
.khub-side-toggle {
  position: absolute;
  left: 320px;
  top: 12px;
  width: 24px;
  height: 48px;
  background: var(--ink);
  color: #fff;
  border: 2px solid var(--ink);
  border-left: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  z-index: 5;
  transition: left .25s;
}
.khub-side.collapsed + .khub-side-toggle { left: 0; }

.khub-search {
  padding: 14px;
  border-bottom: 2px solid var(--ink);
  position: relative;
}
.khub-search input {
  width: 100%;
  padding: 9px 30px 9px 12px;
  border: 2px solid var(--ink);
  background: var(--paper);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: box-shadow .15s;
}
.khub-search input:focus {
  background: #fff;
  box-shadow: 3px 3px 0 var(--ink);
}
.khub-search-x {
  position: absolute;
  right: 22px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--mute);
  padding: 0 6px;
}

.khub-side-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.khub-side-empty {
  text-align: center;
  color: var(--mute);
  padding: 30px;
  font-size: 13px;
}

/* Sidebar: system group */
.khub-sys-group {
  border-bottom: 1px dashed #e5e7eb;
}
.khub-sys-group:last-child { border-bottom: none; }
.khub-sys-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background .12s;
}
.khub-sys-row:hover { background: var(--paper); }
.khub-sys-row.open { background: #f3e8ff; }
.khub-sys-emoji { font-size: 18px; line-height: 1; }
.khub-sys-name {
  flex: 1;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 16px;
  letter-spacing: 1px;
  color: var(--ink);
}
.khub-sys-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--mute);
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 3px;
}
.khub-sys-chev {
  color: var(--mute);
  font-size: 11px;
  width: 12px;
  text-align: center;
}

.khub-topics-list { padding-bottom: 6px; }
.khub-topic-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px 7px 38px;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 12.5px;
  transition: all .12s;
}
.khub-topic-row:hover {
  background: var(--paper);
  border-left-color: var(--pur);
}
.khub-topic-row.active {
  background: #f3e8ff;
  border-left-color: var(--pur);
}
.khub-topic-tree, .khub-topic-emoji { font-size: 12px; opacity: 0.7; flex-shrink: 0; }
.khub-topic-name { color: var(--ink); font-weight: 500; }
.khub-topic-th { color: var(--mute); font-size: 11px; }

/* search mode: ditch indentation */
.khub-side-list > .khub-topic-row { padding-left: 14px; }

/* Stage */
.khub-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--paper);
}

/* Welcome screen */
.khub-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.khub-welcome-inner {
  text-align: center;
  max-width: 720px;
}
.khub-welcome-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(36px, 6vw, 64px);
  letter-spacing: 3px;
  line-height: 1;
  color: var(--ink);
}
.khub-welcome-title .pur { color: var(--pur); }
.khub-welcome-sub {
  font-size: 14px;
  color: var(--mute);
  margin-top: 10px;
  margin-bottom: 28px;
}
.khub-welcome-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 36px;
}
.khub-wstat { text-align: center; }
.khub-wnum {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 40px;
  color: var(--red);
  line-height: 1;
}
.khub-wlabel {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--mute);
  letter-spacing: 2px;
  margin-top: 4px;
}
.khub-welcome-hint {
  font-size: 12px;
  color: var(--mute);
  margin-bottom: 16px;
}
.khub-quick {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 640px;
  margin: 0 auto;
}
.khub-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 2px solid var(--ink);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all .12s;
}
.khub-quick-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--ink);
  background: var(--pur);
  color: #fff;
}
.khub-quick-emoji { font-size: 14px; }

/* Topic view */
.khub-topic-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.khub-topic-head {
  padding: 20px 28px 0;
  background: #fff;
  border-bottom: 2px solid var(--ink);
  flex-shrink: 0;
}
.khub-topic-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.khub-topic-sys {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--mute);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.khub-topic-sources { display: flex; gap: 4px; }
.khub-src-pill {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}
.khub-src-p { background: var(--pur); }
.khub-src-s { background: var(--red); }

.khub-topic-name-big {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: 1.5px;
  line-height: 1.05;
  color: var(--ink);
  margin: 0;
}
.khub-topic-th-big {
  font-size: 16px;
  color: var(--mute);
  margin-top: 4px;
}

/* Tabs */
.khub-tabs {
  display: flex;
  gap: 0;
  margin-top: 18px;
  border-bottom: none;
}
.khub-tab {
  background: var(--paper);
  border: 2px solid var(--ink);
  border-bottom: none;
  padding: 8px 16px;
  margin-right: -2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  color: var(--ink);
  position: relative;
  bottom: -2px;
  transition: all .12s;
}
.khub-tab:hover { background: #fff; }
.khub-tab.active {
  background: var(--ink);
  color: #fff;
  z-index: 2;
}

/* Topic body */
.khub-topic-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.khub-mm-host {
  flex: 1;
  min-height: 0;
  display: flex;
}
.khub-pane {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.khub-section {
  background: #fff;
  border: 2px solid var(--ink);
  padding: 16px 20px;
  margin-bottom: 14px;
  transition: all .15s;
}
.khub-section:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--ink);
}
.khub-section-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  letter-spacing: 1px;
  color: var(--pur);
  margin: 0 0 10px;
}
.khub-section-body { font-size: 14px; line-height: 1.7; color: var(--ink); }
.khub-section-body :deep(p) { margin: 0 0 8px; }
.khub-section-body :deep(ul) { margin: 6px 0; padding-left: 22px; }
.khub-section-body :deep(li) { margin-bottom: 5px; }
.khub-section-body :deep(strong) { color: var(--pur); }
.khub-section-body :deep(code) {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

/* Red flags */
.khub-redflags {
  background: #fff;
  border: 2px solid var(--red);
  padding: 20px 24px 20px 40px;
  margin: 0;
  list-style-type: '⚠  ';
}
.khub-redflags li {
  color: var(--ink);
  margin-bottom: 12px;
  line-height: 1.6;
  padding-left: 4px;
}
.khub-redflags li:last-child { margin-bottom: 0; }

/* Key points */
.khub-keypoints {
  background: #fff;
  border: 2px solid var(--pur);
  padding: 20px 24px 20px 40px;
  margin: 0;
}
.khub-keypoints li {
  color: var(--ink);
  margin-bottom: 12px;
  line-height: 1.6;
}
.khub-keypoints li:last-child { margin-bottom: 0; }

/* Tables */
.khub-table-wrap {
  background: #fff;
  border: 2px solid var(--ink);
  margin-bottom: 16px;
  overflow-x: auto;
}
.khub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.khub-table th {
  background: var(--ink);
  color: #fff;
  text-align: left;
  padding: 10px 14px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  font-weight: normal;
}
.khub-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.khub-table tr:last-child td { border-bottom: none; }
.khub-table tr:nth-child(even) td { background: var(--paper); }

/* Recent footer */
.khub-recent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: var(--ink);
  color: #fff;
  border-top: 2px solid var(--ink);
  overflow-x: auto;
  flex-shrink: 0;
}
.khub-recent-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  color: #94a3b8;
  white-space: nowrap;
}
.khub-recent-pill {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all .12s;
}
.khub-recent-pill:hover {
  background: var(--pur);
  border-color: var(--pur);
}

/* Responsive */
@media (max-width: 800px) {
  .khub-side { width: 100%; position: absolute; height: 100%; z-index: 10; }
  .khub-side.collapsed { width: 0; }
  .khub-side-toggle { left: 0; }
  .khub-side:not(.collapsed) + .khub-side-toggle { left: 100%; transform: translateX(-100%); }
}
</style>
