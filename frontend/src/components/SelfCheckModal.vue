<template>
  <Teleport to="body">
    <div class="sc-overlay" @click.self="close">
      <div class="sc-modal" :style="{ '--theme': template?.color || '#3b82f6' }">
        <!-- Header -->
        <div class="sc-header">
          <div class="sc-header-top">
            <div class="sc-icon-wrap">{{ template?.icon || '📋' }}</div>
            <div class="sc-titles">
              <div class="sc-name">{{ template?.name || 'กำลังโหลด…' }}</div>
              <div class="sc-tagline" v-if="template?.tagline">{{ template.tagline }}</div>
            </div>
            <button class="sc-close" @click="close" aria-label="ปิด">×</button>
          </div>
          <!-- Progress bar -->
          <div class="sc-progress-wrap" v-if="template">
            <div class="sc-progress-info">
              <span class="sc-progress-text">เช็คความเข้าใจ</span>
              <span class="sc-progress-num">{{ completed }} / {{ total }} ข้อ</span>
              <span class="sc-progress-pct">{{ percent }}%</span>
            </div>
            <div class="sc-progress-bar">
              <div class="sc-progress-fill" :style="{ width: percent + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="sc-body" v-if="!loading && template">
          <div
            v-for="(sec, si) in template.sections"
            :key="sec.id"
            class="sc-section"
          >
            <button class="sc-section-head" @click="toggleSection(si)">
              <span class="sc-section-arrow" :class="{ open: !collapsed[si] }">▸</span>
              <span class="sc-section-title">{{ sec.title }}</span>
              <span class="sc-section-count">{{ sectionDoneCount(sec) }}/{{ sec.items.length }}</span>
            </button>
            <div v-show="!collapsed[si]" class="sc-items">
              <label
                v-for="item in sec.items"
                :key="item.id"
                class="sc-item"
                :class="{ checked: isChecked(item.id) }"
              >
                <input
                  type="checkbox"
                  :checked="isChecked(item.id)"
                  @change="toggle(item.id, $event.target.checked)"
                  :disabled="saving === item.id"
                />
                <span class="sc-check-box">
                  <svg v-if="isChecked(item.id)" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
                  </svg>
                </span>
                <span class="sc-item-text">{{ item.text }}</span>
              </label>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="sc-loading">
          <div class="sc-spin"></div>
          <span>กำลังโหลด checklist…</span>
        </div>

        <div v-else-if="error" class="sc-error">
          {{ error }}
          <button class="sc-retry" @click="load">ลองใหม่</button>
        </div>

        <!-- Footer (sticky) -->
        <div class="sc-footer" v-if="template">
          <div class="sc-footer-note">บันทึกอัตโนมัติ · {{ completed }}/{{ total }} ข้อ</div>
          <button class="sc-done-btn" @click="close">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
            เสร็จแล้ว
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import api from '../services/api'

export default {
  name: 'SelfCheckModal',
  props: {
    slug: { type: String, required: true }
  },
  emits: ['close', 'progress'],
  data() {
    return {
      template: null,
      checkedSet: new Set(),
      loading: true,
      error: '',
      saving: null,
      collapsed: {},
      pendingToggles: new Map()    // itemId → desired state (debounce)
    }
  },
  computed: {
    total() {
      if (!this.template?.sections) return 0
      return this.template.sections.reduce((s, sec) => s + (sec.items?.length || 0), 0)
    },
    completed() {
      if (!this.template?.sections) return 0
      const valid = new Set(this.template.sections.flatMap(s => (s.items || []).map(i => i.id)))
      let n = 0
      for (const id of this.checkedSet) if (valid.has(id)) n++
      return n
    },
    percent() {
      return this.total ? Math.round((this.completed / this.total) * 100) : 0
    }
  },
  mounted() {
    this.load()
    document.addEventListener('keydown', this._onEsc)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._onEsc)
  },
  methods: {
    _onEsc(e) {
      if (e.key === 'Escape') this.close()
    },
    close() {
      this.$emit('close')
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        const res = await api.get(`/my/self-checks/${this.slug}`)
        this.template = res.template
        this.checkedSet = new Set(res.checkedItems || [])
        // collapse ทั้งหมดก่อน เปิดเฉพาะหมวดแรก
        const c = {}
        for (let i = 0; i < (this.template.sections || []).length; i++) c[i] = i !== 0
        this.collapsed = c
        this.$emit('progress', { percent: this.percent, completed: this.completed, total: this.total })
      } catch (err) {
        this.error = err?.response?.data?.message || err.message || 'โหลดไม่สำเร็จ'
      } finally {
        this.loading = false
      }
    },
    isChecked(itemId) {
      return this.checkedSet.has(itemId)
    },
    sectionDoneCount(sec) {
      let n = 0
      for (const item of (sec.items || [])) if (this.checkedSet.has(item.id)) n++
      return n
    },
    toggleSection(si) {
      this.collapsed = { ...this.collapsed, [si]: !this.collapsed[si] }
    },
    toggle(itemId, checked) {
      // optimistic update
      if (checked) this.checkedSet.add(itemId)
      else this.checkedSet.delete(itemId)
      this.checkedSet = new Set(this.checkedSet)   // trigger reactivity
      // debounced save
      this.pendingToggles.set(itemId, checked)
      this._scheduleSave()
    },
    _scheduleSave() {
      if (this._saveTimer) clearTimeout(this._saveTimer)
      this._saveTimer = setTimeout(() => this._flushSave(), 250)
    },
    async _flushSave() {
      const tasks = [...this.pendingToggles.entries()]
      this.pendingToggles.clear()
      for (const [itemId, checked] of tasks) {
        this.saving = itemId
        try {
          const res = await api.post(`/my/self-checks/${this.slug}/toggle`, { itemId, checked })
          if (res?.percent !== undefined) {
            this.$emit('progress', { percent: res.percent, completed: res.completed, total: res.total })
          }
        } catch (err) {
          // rollback
          if (checked) this.checkedSet.delete(itemId)
          else this.checkedSet.add(itemId)
          this.checkedSet = new Set(this.checkedSet)
          console.error('[self-check] save failed:', err?.response?.data || err.message)
        } finally {
          this.saving = null
        }
      }
    }
  }
}
</script>

<style scoped>
.sc-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: scFade 0.18s ease-out;
  /* กัน iOS Safari URL bar/notch ตัดขอบล่าง */
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  /* ใช้ dynamic viewport height เพื่อให้สูงเต็มจริงๆ ไม่โดน URL bar กิน */
  height: 100vh;
  height: 100dvh;
}
@keyframes scFade { from { opacity: 0 } to { opacity: 1 } }

.sc-modal {
  background: #fff;
  border-radius: 18px;
  width: 100%; max-width: 720px;
  max-height: 100%;           /* parent .sc-overlay เป็น dvh แล้ว ใช้ 100% ให้ดึงสูงสุดที่ได้ */
  display: flex; flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  animation: scPop 0.22s cubic-bezier(.18,1.1,.55,1);
  position: relative;
}
@keyframes scPop { from { transform: scale(.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }

/* Header */
.sc-header {
  background: linear-gradient(135deg, var(--theme, #3b82f6), color-mix(in srgb, var(--theme, #3b82f6) 75%, #fff));
  color: #fff;
  padding: 18px 20px 16px;
  position: relative;
}
.sc-header-top { display: flex; align-items: center; gap: 14px; }
.sc-icon-wrap {
  width: 48px; height: 48px;
  background: rgba(255,255,255,0.22);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.sc-titles { flex: 1; min-width: 0; }
.sc-name { font-size: 16px; font-weight: 900; line-height: 1.3; }
.sc-tagline { font-size: 11.5px; opacity: 0.9; margin-top: 3px; line-height: 1.4; }
.sc-close {
  background: rgba(255,255,255,0.2);
  border: 0; color: #fff;
  width: 32px; height: 32px; border-radius: 50%;
  font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
  transition: background 0.15s;
}
.sc-close:hover { background: rgba(255,255,255,0.32); }
.sc-progress-wrap { margin-top: 14px; }
.sc-progress-info {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11.5px; margin-bottom: 6px;
}
.sc-progress-text { font-weight: 700; opacity: 0.92; }
.sc-progress-num { opacity: 0.85; font-weight: 600; }
.sc-progress-pct { font-weight: 900; background: rgba(255,255,255,0.22); padding: 2px 9px; border-radius: 999px; font-size: 11px; }
.sc-progress-bar { background: rgba(255,255,255,0.22); height: 8px; border-radius: 999px; overflow: hidden; }
.sc-progress-fill { background: #fff; height: 100%; border-radius: 999px; transition: width 0.35s cubic-bezier(.4,1.4,.5,1); box-shadow: 0 0 12px rgba(255,255,255,.4); }

/* Body */
.sc-body {
  flex: 1; overflow-y: auto;
  padding: 14px 16px;
  background: #f8fafc;
}
.sc-section {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.sc-section-head {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; background: #fff;
  border: 0; cursor: pointer; text-align: left;
  font-family: inherit;
  border-bottom: 1px solid transparent;
  transition: background 0.15s;
}
.sc-section-head:hover { background: #f8fafc; }
.sc-section-arrow {
  font-size: 11px; color: var(--theme, #3b82f6);
  transition: transform 0.18s; flex-shrink: 0;
}
.sc-section-arrow.open { transform: rotate(90deg); }
.sc-section-title { flex: 1; font-size: 13px; font-weight: 800; color: #1e293b; line-height: 1.35; }
.sc-section-count {
  flex-shrink: 0;
  background: #f1f5f9; color: #475569;
  font-size: 11px; font-weight: 800;
  padding: 3px 8px; border-radius: 999px;
}
.sc-items { padding: 4px 4px 8px; }
.sc-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 12px; cursor: pointer;
  border-radius: 8px; transition: background 0.12s;
  user-select: none;
}
.sc-item:hover { background: #f8fafc; }
.sc-item input { display: none; }
.sc-check-box {
  width: 22px; height: 22px; border-radius: 6px;
  border: 2px solid #cbd5e1; background: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
  transition: all 0.15s;
  color: #fff;
}
.sc-item.checked .sc-check-box {
  background: var(--theme, #3b82f6);
  border-color: var(--theme, #3b82f6);
}
.sc-item-text {
  flex: 1; font-size: 12.5px; color: #334155;
  line-height: 1.55;
  word-break: break-word;
}
.sc-item.checked .sc-item-text { color: #94a3b8; text-decoration: line-through; }

/* Loading + Error */
.sc-loading, .sc-error {
  padding: 50px 20px; text-align: center;
  color: #64748b; font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.sc-spin {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--theme, #3b82f6);
  border-radius: 50%;
  animation: scSpin 0.8s linear infinite;
}
@keyframes scSpin { to { transform: rotate(360deg) } }
.sc-retry {
  background: var(--theme, #3b82f6); color: #fff;
  border: 0; padding: 8px 16px; border-radius: 8px;
  cursor: pointer; font-weight: 700; font-size: 12px;
}

/* Footer (sticky bottom — มองเห็นเสมอ) */
.sc-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  /* เผื่อ home indicator iPhone */
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
  background: #fff;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;             /* กัน body กิน footer */
  position: relative;
  z-index: 2;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.06);
}
.sc-footer-note { font-size: 11px; color: #94a3b8; }
.sc-done-btn {
  background: linear-gradient(135deg, var(--theme, #3b82f6), color-mix(in srgb, var(--theme, #3b82f6) 80%, #fff));
  color: #fff; border: 0;
  padding: 10px 22px; border-radius: 999px;
  font-weight: 800; font-size: 13px; cursor: pointer;
  box-shadow: 0 4px 10px rgba(59,130,246,.25);
  transition: transform 0.12s;
  display: inline-flex; align-items: center; gap: 6px;
  font-family: inherit;
}
.sc-done-btn:hover { transform: translateY(-1px); }
.sc-done-btn:active { transform: translateY(0); }

/* Mobile — ปุ่ม "เสร็จแล้ว" ต้องมองเห็นเสมอ ไม่ตกขอบ */
@media (max-width: 600px) {
  .sc-overlay {
    padding: 0;
    padding-bottom: 0;          /* override desktop */
    align-items: stretch;
    height: 100vh;
    height: 100dvh;
  }
  .sc-modal {
    max-height: 100%;
    height: 100%;
    border-radius: 0;
    max-width: 100%;
  }
  .sc-name { font-size: 15px; }
  .sc-tagline { font-size: 11px; }
  .sc-icon-wrap { width: 42px; height: 42px; font-size: 22px; }

  /* ปุ่มเสร็จแล้วใหญ่ขึ้น tappable ง่าย */
  .sc-footer {
    padding: 10px 14px;
    padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
  }
  .sc-footer-note { font-size: 10.5px; line-height: 1.3; flex: 1; min-width: 0; }
  .sc-done-btn {
    padding: 13px 24px;
    font-size: 14px;
    flex-shrink: 0;
    min-height: 44px;           /* Apple HIG: touch target ขั้นต่ำ 44px */
  }

  /* body ใช้ flex:1 + overflow ให้ scroll ภายในเอง — ปุ่มจะอยู่ติดล่างเสมอ */
  .sc-body {
    -webkit-overflow-scrolling: touch;
    padding-bottom: 12px;
  }
}
</style>
