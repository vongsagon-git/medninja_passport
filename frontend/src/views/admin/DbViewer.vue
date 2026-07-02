<template>
  <div class="db-viewer">
    <div class="dv-header">
      <router-link to="/admin" class="dv-back">
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
      </router-link>
      <h1>DB Viewer</h1>
      <button class="dv-refresh" @click="fetchOverview" :disabled="loading">
        {{ loading ? 'โหลด...' : 'Refresh' }}
      </button>
    </div>

    <!-- Overview: databases + valkey -->
    <div v-if="loading && !databases.length" class="dv-loading">กำลังโหลด...</div>

    <div v-else class="dv-tree">
      <!-- MongoDB Databases -->
      <div v-for="db in databases" :key="db.db" class="dv-node">
        <div class="dv-row dv-row-db" @click="toggle('db-' + db.db)">
          <span class="dv-arrow" :class="{ open: isOpen('db-' + db.db) }">&#9654;</span>
          <span class="dv-icon dv-icon-db">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </span>
          <span class="dv-label">{{ db.db }}</span>
          <span class="dv-badge" :class="db.status === 'connected' ? 'dv-badge-green' : 'dv-badge-red'">
            {{ db.status }}
          </span>
          <span class="dv-count">{{ db.collections.length }} collections</span>
        </div>

        <div v-if="isOpen('db-' + db.db)" class="dv-children">
          <div v-for="col in db.collections" :key="col.name" class="dv-node">
            <div class="dv-row dv-row-col" @click="selectCollection(db.db, col.name)">
              <span class="dv-arrow" :class="{ open: activeCollection === db.db + '.' + col.name }">&#9654;</span>
              <span class="dv-icon dv-icon-col">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"/></svg>
              </span>
              <span class="dv-label">{{ col.name }}</span>
              <span class="dv-count">{{ col.count.toLocaleString() }}</span>
            </div>

            <!-- Documents -->
            <div v-if="activeCollection === db.db + '.' + col.name" class="dv-children">
              <div v-if="docsLoading" class="dv-loading-sm">กำลังโหลด documents...</div>
              <template v-else>
                <div v-for="doc in documents" :key="doc._id" class="dv-node">
                  <div class="dv-row dv-row-doc" @click="toggle('doc-' + doc._id)">
                    <span class="dv-arrow" :class="{ open: isOpen('doc-' + doc._id) }">&#9654;</span>
                    <span class="dv-icon dv-icon-doc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    </span>
                    <span class="dv-label dv-doc-id">{{ docLabel(doc) }}</span>
                  </div>
                  <div v-if="isOpen('doc-' + doc._id)" class="dv-children">
                    <div class="dv-json-tree">
                      <json-node :data="doc" :depth="0" />
                    </div>
                  </div>
                </div>
                <!-- Pagination -->
                <div v-if="docPages > 1" class="dv-pagination">
                  <button :disabled="docPage <= 1" @click="loadDocs(activeDb, activeCol, docPage - 1)">&laquo;</button>
                  <span>{{ docPage }}/{{ docPages }}</span>
                  <button :disabled="docPage >= docPages" @click="loadDocs(activeDb, activeCol, docPage + 1)">&raquo;</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Valkey -->
      <div class="dv-node">
        <div class="dv-row dv-row-db" @click="toggleValkey">
          <span class="dv-arrow" :class="{ open: valkeyOpen }">&#9654;</span>
          <span class="dv-icon dv-icon-valkey">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
          </span>
          <span class="dv-label">Valkey (Redis)</span>
          <span class="dv-badge" :class="valkey.status === 'connected' ? 'dv-badge-green' : 'dv-badge-red'">
            {{ valkey.status }}
          </span>
          <span class="dv-count">{{ valkey.keyCount }} keys</span>
        </div>

        <div v-if="valkeyOpen" class="dv-children">
          <div v-if="valkeyLoading" class="dv-loading-sm">กำลังโหลด keys...</div>
          <template v-else>
            <div v-for="k in valkeyKeys" :key="k.key" class="dv-node">
              <div class="dv-row dv-row-doc" @click="selectValkeyKey(k.key)">
                <span class="dv-arrow" :class="{ open: activeValkeyKey === k.key }">&#9654;</span>
                <span class="dv-icon dv-icon-key">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
                </span>
                <span class="dv-label" style="font-family: monospace; font-size: 12px;">{{ k.key }}</span>
                <span class="dv-type-badge">{{ k.type }}</span>
                <span v-if="k.ttl > 0" class="dv-ttl">TTL {{ k.ttl }}s</span>
                <span v-else-if="k.ttl === -1" class="dv-ttl dv-ttl-perm">no expiry</span>
              </div>
              <div v-if="activeValkeyKey === k.key" class="dv-children">
                <div v-if="valkeyValueLoading" class="dv-loading-sm">กำลังโหลด...</div>
                <div v-else class="dv-json-tree">
                  <json-node :data="valkeyValue" :depth="0" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api'

// Recursive JSON tree component
const JsonNode = {
  name: 'JsonNode',
  props: { data: {}, label: { type: String, default: '' }, depth: { type: Number, default: 0 } },
  data() { return { open: this.depth < 2 } },
  computed: {
    isObject() { return this.data !== null && typeof this.data === 'object' },
    isArray() { return Array.isArray(this.data) },
    entries() {
      if (this.isArray) return this.data.map((v, i) => ({ key: String(i), value: v }))
      if (this.isObject) return Object.entries(this.data).map(([k, v]) => ({ key: k, value: v }))
      return []
    },
    preview() {
      if (this.isArray) return `Array(${this.data.length})`
      if (this.isObject) return `{${Object.keys(this.data).length} fields}`
      return ''
    },
    valueDisplay() {
      if (this.data === null) return 'null'
      if (this.data === undefined) return 'undefined'
      if (typeof this.data === 'boolean') return String(this.data)
      if (typeof this.data === 'number') return String(this.data)
      if (typeof this.data === 'string') {
        if (this.data.length > 200) return `"${this.data.slice(0, 200)}…"`
        return `"${this.data}"`
      }
      return String(this.data)
    },
    valueClass() {
      if (this.data === null || this.data === undefined) return 'jn-null'
      if (typeof this.data === 'boolean') return 'jn-bool'
      if (typeof this.data === 'number') return 'jn-num'
      if (typeof this.data === 'string') return 'jn-str'
      return ''
    }
  },
  template: `
    <div class="jn" :style="{ paddingLeft: depth > 0 ? '16px' : '0' }">
      <template v-if="isObject">
        <div class="jn-row" @click="open = !open">
          <span class="jn-arrow" :class="{ open }">&#9654;</span>
          <span v-if="label" class="jn-key">{{ label }}:</span>
          <span class="jn-preview">{{ preview }}</span>
        </div>
        <div v-if="open" class="jn-children">
          <json-node v-for="e in entries" :key="e.key" :data="e.value" :label="e.key" :depth="depth + 1" />
        </div>
      </template>
      <template v-else>
        <div class="jn-row jn-leaf">
          <span v-if="label" class="jn-key">{{ label }}:</span>
          <span :class="valueClass">{{ valueDisplay }}</span>
        </div>
      </template>
    </div>
  `
}

export default {
  name: 'DbViewer',
  components: { JsonNode },
  data() {
    return {
      loading: false,
      databases: [],
      valkey: { status: 'unknown', keyCount: 0 },
      openNodes: {},
      // Collection docs
      activeCollection: null,
      activeDb: '',
      activeCol: '',
      documents: [],
      docsLoading: false,
      docPage: 1,
      docPages: 1,
      // Valkey
      valkeyOpen: false,
      valkeyLoading: false,
      valkeyKeys: [],
      activeValkeyKey: null,
      valkeyValue: null,
      valkeyValueLoading: false
    }
  },
  mounted() {
    this.fetchOverview()
  },
  methods: {
    async fetchOverview() {
      this.loading = true
      try {
        const data = await api.get('/admin/db')
        this.databases = data.databases
        this.valkey = data.valkey
      } catch (err) {
        console.error('DB Viewer error:', err)
      } finally {
        this.loading = false
      }
    },

    isOpen(key) { return !!this.openNodes[key] },
    toggle(key) {
      this.openNodes = { ...this.openNodes, [key]: !this.openNodes[key] }
    },

    async selectCollection(db, col) {
      const id = db + '.' + col
      if (this.activeCollection === id) {
        this.activeCollection = null
        return
      }
      this.activeCollection = id
      this.activeDb = db
      this.activeCol = col
      await this.loadDocs(db, col, 1)
    },

    async loadDocs(db, col, page) {
      this.docsLoading = true
      try {
        const data = await api.get(`/admin/db/${db}/${col}?page=${page}&limit=20`)
        this.documents = data.documents
        this.docPage = data.page
        this.docPages = data.pages
      } catch (err) {
        console.error('Load docs error:', err)
        this.documents = []
      } finally {
        this.docsLoading = false
      }
    },

    docLabel(doc) {
      // Try to find a good label
      if (doc.name) return doc.name
      if (doc.firstName && doc.lastName) return `${doc.firstName} ${doc.lastName}`
      if (doc.email) return doc.email
      if (doc.title) return doc.title
      if (doc.slug) return doc.slug
      return String(doc._id)
    },

    async toggleValkey() {
      this.valkeyOpen = !this.valkeyOpen
      if (this.valkeyOpen && this.valkeyKeys.length === 0) {
        await this.loadValkeyKeys()
      }
    },

    async loadValkeyKeys() {
      this.valkeyLoading = true
      try {
        const data = await api.get('/admin/db/valkey/keys')
        this.valkeyKeys = data.keys
      } catch (err) {
        console.error('Valkey keys error:', err)
      } finally {
        this.valkeyLoading = false
      }
    },

    async selectValkeyKey(key) {
      if (this.activeValkeyKey === key) {
        this.activeValkeyKey = null
        return
      }
      this.activeValkeyKey = key
      this.valkeyValueLoading = true
      try {
        const data = await api.get(`/admin/db/valkey/key/${encodeURIComponent(key)}`)
        this.valkeyValue = data.value
      } catch (err) {
        this.valkeyValue = { error: err.message }
      } finally {
        this.valkeyValueLoading = false
      }
    }
  }
}
</script>

<style scoped>
.db-viewer {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* Header */
.dv-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.dv-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #64748b;
  transition: all 0.15s;
}
.dv-back:hover { background: #f1f5f9; color: #0f172a; }
.dv-header h1 {
  flex: 1;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.dv-refresh {
  padding: 8px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.dv-refresh:hover:not(:disabled) { background: #2563eb; }
.dv-refresh:disabled { opacity: 0.6; }

.dv-loading { text-align: center; padding: 60px; color: #64748b; }
.dv-loading-sm { padding: 12px 24px; color: #94a3b8; font-size: 13px; }

/* Tree */
.dv-tree {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.dv-node {}
.dv-children {
  border-top: 1px solid #f1f5f9;
}
.dv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}
.dv-row:hover { background: #f8fafc; }

.dv-row-db { font-weight: 700; font-size: 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.dv-row-col { padding-left: 32px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
.dv-row-doc { padding-left: 48px; font-size: 13px; border-bottom: 1px solid #f8fafc; }

.dv-arrow {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.15s;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.dv-arrow.open { transform: rotate(90deg); }

.dv-icon { flex-shrink: 0; display: flex; align-items: center; }
.dv-icon-db { color: #3b82f6; }
.dv-icon-col { color: #f59e0b; }
.dv-icon-doc { color: #64748b; }
.dv-icon-valkey { color: #dc2626; }
.dv-icon-key { color: #7c3aed; }

.dv-label { flex: 1; color: #1e293b; }
.dv-doc-id { font-family: monospace; font-size: 12px; color: #475569; }

.dv-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.dv-badge-green { background: #dcfce7; color: #15803d; }
.dv-badge-red { background: #fee2e2; color: #dc2626; }

.dv-count {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.dv-type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  background: #ede9fe;
  color: #7c3aed;
  text-transform: uppercase;
}
.dv-ttl {
  font-size: 11px;
  color: #f59e0b;
  font-family: monospace;
}
.dv-ttl-perm { color: #94a3b8; }

/* Pagination */
.dv-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 13px;
  color: #64748b;
}
.dv-pagination button {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #3b82f6;
}
.dv-pagination button:disabled { opacity: 0.3; cursor: default; }
.dv-pagination button:hover:not(:disabled) { background: #f1f5f9; }

/* JSON Tree */
.dv-json-tree {
  padding: 8px 16px 8px 48px;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  overflow-x: auto;
}
</style>

<style>
/* JSON Node (global — recursive component) */
.jn {}
.jn-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 1px 0;
  cursor: default;
  line-height: 1.6;
}
.jn-row:not(.jn-leaf) { cursor: pointer; }
.jn-row:not(.jn-leaf):hover { background: rgba(59, 130, 246, 0.04); border-radius: 3px; }
.jn-arrow {
  font-size: 8px;
  color: #94a3b8;
  transition: transform 0.1s;
  width: 10px;
  flex-shrink: 0;
}
.jn-arrow.open { transform: rotate(90deg); }
.jn-key { color: #7c3aed; font-weight: 600; }
.jn-preview { color: #94a3b8; font-style: italic; }
.jn-children {}
.jn-leaf { cursor: text; }
.jn-str { color: #059669; }
.jn-num { color: #2563eb; }
.jn-bool { color: #d97706; }
.jn-null { color: #94a3b8; font-style: italic; }
</style>
