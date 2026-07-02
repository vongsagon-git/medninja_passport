<template>
  <div class="mm-wrap" ref="wrapEl">
    <!-- Toolbar -->
    <div class="mm-toolbar">
      <button class="mm-tool" @click="zoomBy(1.25)" title="ขยาย (+)">+</button>
      <button class="mm-tool" @click="zoomBy(1/1.25)" title="ย่อ (−)">−</button>
      <button class="mm-tool" @click="fitView" title="พอดีจอ">⤢</button>
      <span class="mm-zoom">{{ Math.round(scale * 100) }}%</span>
      <div class="mm-spacer"></div>
      <button class="mm-tool mm-tool-text" @click="expandAll" title="ขยายทุก node">EXPAND</button>
      <button class="mm-tool mm-tool-text" @click="collapseAll" title="หุบทุก node">COLLAPSE</button>
    </div>

    <!-- Canvas -->
    <div
      class="mm-canvas"
      ref="canvasEl"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <svg :width="svgSize.w" :height="svgSize.h" :style="svgStyle">
        <!-- Links -->
        <g class="mm-links">
          <path
            v-for="link in visibleLinks"
            :key="link.id"
            :d="linkPath(link)"
            :stroke="link.color"
            :stroke-width="link.depth === 1 ? 2.5 : 2"
            fill="none"
            :opacity="hoveredNode && !relatedIds.has(link.toId) && !relatedIds.has(link.fromId) ? 0.1 : 0.7"
          />
        </g>

        <!-- Nodes -->
        <g class="mm-nodes">
          <g
            v-for="node in visibleNodes"
            :key="node.id"
            :style="{ transform: `translate(${node.x}px, ${node.y}px)` }"
            class="mm-node"
            :class="{
              'mm-faded': hoveredNode && !relatedIds.has(node.id),
              'mm-danger': node._danger,
              'mm-clickable': node._togglable,
              'mm-collapsed': node._collapsed,
            }"
            @mouseenter="hoveredNode = node"
            @mouseleave="hoveredNode = null"
            @mousedown.stop
            @click.stop="onNodeClick(node)"
          >
            <!-- Shadow rect (brutalism offset) -->
            <rect
              v-if="node.depth > 0"
              :x="-node.w / 2 + 4"
              :y="-node.h / 2 + 4"
              :width="node.w"
              :height="node.h"
              :fill="node._danger ? '#7f1d1d' : '#0a0a0a'"
              opacity="0.85"
            />
            <!-- Main rect -->
            <rect
              :x="-node.w / 2"
              :y="-node.h / 2"
              :width="node.w"
              :height="node.h"
              :fill="node.bg"
              :stroke="node.stroke"
              :stroke-width="2"
            />
            <text
              :x="node._togglable ? -10 : 0" y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="node.fg"
              :font-size="node.fontSize"
              :font-weight="node.depth === 0 ? 700 : 500"
              :font-family="node.depth === 0 ? 'Bebas Neue, sans-serif' : 'Noto Sans Thai, sans-serif'"
              :letter-spacing="node.depth === 0 ? '1.5' : '0'"
              class="mm-text"
            >{{ truncate(node.label, node.depth === 0 ? 36 : 30) }}</text>

            <!-- Chevron indicator inside node -->
            <text
              v-if="node._togglable"
              :x="node.w / 2 - 12" y="1"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="node.fg"
              font-size="11"
              font-weight="700"
              style="font-family: 'JetBrains Mono', monospace; pointer-events: none; opacity: 0.7"
            >{{ node._collapsed ? '▸' : '▾' }}</text>

            <!-- Hidden children count badge (when collapsed) -->
            <g v-if="node._collapsed" :transform="`translate(${node.w / 2 + 14}, 0)`" style="pointer-events: none">
              <rect x="-14" y="-10" width="28" height="20" fill="#8b5cf6" stroke="#0a0a0a" stroke-width="2" />
              <text x="0" y="1" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="11" font-weight="700"
                style="font-family: 'JetBrains Mono', monospace"
              >+{{ node._descendantCount }}</text>
            </g>

            <!-- Highlight badge (top-left) -->
            <g v-if="node._danger" :transform="`translate(${-node.w / 2 + 10}, ${-node.h / 2 + 10})`" style="pointer-events: none">
              <text font-size="14" fill="#e63946" font-weight="700">⚠</text>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- Legend / Hint -->
    <div class="mm-hint">
      <span class="mm-hint-item"><span class="mm-hint-key">DRAG</span> เลื่อน</span>
      <span class="mm-hint-item"><span class="mm-hint-key">SCROLL</span> ซูม</span>
      <span class="mm-hint-item"><span class="mm-hint-key">CLICK</span> ขยาย/หุบ</span>
      <span class="mm-hint-item"><span class="mm-hint-key">HOVER</span> related</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MindMapCanvas',
  props: {
    tree: { type: Object, required: true },
    accentColor: { type: String, default: '#8b5cf6' },
  },
  data() {
    return {
      scale: 1,
      tx: 0,
      ty: 0,
      isDragging: false,
      lastMouse: { x: 0, y: 0 },
      hoveredNode: null,
      layoutVersion: 0,
      collapsed: new Set(),
      svgSize: { w: 1600, h: 1000 },
    }
  },
  computed: {
    // Assign stable path-based IDs to every node — runs once per tree change.
    // ID = "0", "0.0", "0.1", "0.0.0" ... independent of collapse state.
    indexedTree() {
      const walk = (n, id, depth, parentId) => {
        n._id = id
        n._depth = depth
        n._parentId = parentId
        const children = n.children || []
        for (let i = 0; i < children.length; i++) {
          walk(children[i], `${id}.${i}`, depth + 1, id)
        }
        return n
      }
      return walk(this.tree, '0', 0, null)
    },
    flat() {
      this.layoutVersion
      const root = this.indexedTree
      const nodes = []
      const visit = (n) => {
        nodes.push(n)
        if (!this.collapsed.has(n._id)) {
          for (const c of (n.children || [])) visit(c)
        }
      }
      visit(root)
      return { nodes }
    },
    layout() {
      const { nodes } = this.flat
      if (!nodes.length) return { nodes: [], links: [], w: 100, h: 100 }

      const NODE_VSPACE = 52
      const NODE_HSPACE = 240
      const PADDING = 80

      const layoutMap = {}
      for (const n of nodes) layoutMap[n._id] = { node: n, x: 0, y: 0, w: 0, h: 40, children: [] }
      for (const n of nodes) if (n._parentId) layoutMap[n._parentId].children.push(layoutMap[n._id])
      const root = layoutMap[nodes[0]._id]

      const measureWidth = (label, depth) => {
        const len = String(label || '').length
        const base = depth === 0 ? 36 : 30
        return Math.min(300, Math.max(120, base + len * 7.5))
      }
      for (const id in layoutMap) {
        const lm = layoutMap[id]
        lm.w = measureWidth(lm.node.label, lm.node._depth)
        lm.h = lm.node._depth === 0 ? 56 : 40
      }

      const place = (lm, depth, yCursor) => {
        lm.x = PADDING + depth * NODE_HSPACE
        if (!lm.children.length) {
          lm.y = yCursor + NODE_VSPACE / 2
          return yCursor + NODE_VSPACE
        }
        let yStart = yCursor
        for (const c of lm.children) yStart = place(c, depth + 1, yStart)
        lm.y = (lm.children[0].y + lm.children[lm.children.length - 1].y) / 2
        return yStart
      }
      place(root, 0, PADDING)

      let maxX = 0, maxY = 0
      for (const id in layoutMap) {
        const lm = layoutMap[id]
        maxX = Math.max(maxX, lm.x + lm.w / 2)
        maxY = Math.max(maxY, lm.y + lm.h / 2)
      }

      const accent = this.accentColor || '#8b5cf6'
      const styledNodes = []
      for (const id in layoutMap) {
        const lm = layoutMap[id]
        const depth = lm.node._depth
        const isDanger = /highlight|emergency|danger|red.flag|severe|acute|fatal|life.threat|tension|massive|ดี|aortic dissection|tamponade|stemi/i.test(lm.node.label)
        let bg, stroke, fg, fontSize
        if (depth === 0) {
          bg = '#0a0a0a'; stroke = '#0a0a0a'; fg = '#fff'; fontSize = 18
        } else if (depth === 1) {
          bg = accent; stroke = '#0a0a0a'; fg = '#fff'; fontSize = 14
        } else if (depth === 2) {
          bg = '#fff'; stroke = '#0a0a0a'; fg = '#0a0a0a'; fontSize = 13
        } else {
          bg = '#fafaf7'; stroke = '#0a0a0a'; fg = '#0a0a0a'; fontSize = 12.5
        }
        if (isDanger) { bg = '#fef2f2'; stroke = '#e63946'; fg = '#7f1d1d' }

        // node ถูก collapse → ลูกหายไปจาก visible nodes
        const realChildren = lm.node.children || []
        const hasRealChildren = realChildren.length > 0
        const isCollapsedHere = this.collapsed.has(lm.node._id)
        // count all descendants (for badge)
        const countDescendants = (n) => {
          const kids = n.children || []
          let count = kids.length
          for (const k of kids) count += countDescendants(k)
          return count
        }
        styledNodes.push({
          id: lm.node._id,
          depth,
          parentId: lm.node._parentId,
          label: lm.node.label,
          x: lm.x + lm.w / 2,
          y: lm.y,
          w: lm.w,
          h: lm.h,
          bg, stroke, fg, fontSize,
          children: lm.children.map(c => c.node._id),
          _collapsed: isCollapsedHere,
          _togglable: hasRealChildren,
          _hasCollapsedChildren: hasRealChildren && isCollapsedHere,
          _descendantCount: hasRealChildren ? countDescendants(lm.node) : 0,
          _danger: isDanger,
        })
      }

      const links = []
      const nodeById = Object.fromEntries(styledNodes.map(n => [n.id, n]))
      for (const n of styledNodes) {
        if (n.parentId) {
          const parent = nodeById[n.parentId]
          links.push({
            id: `${n.parentId}->${n.id}`,
            fromId: n.parentId, toId: n.id,
            from: { x: parent.x + parent.w / 2, y: parent.y },
            to: { x: n.x - n.w / 2, y: n.y },
            depth: n.depth,
            color: n._danger ? '#e63946' : '#0a0a0a',
          })
        }
      }

      return {
        nodes: styledNodes,
        links,
        w: Math.max(900, maxX + PADDING),
        h: Math.max(500, maxY + PADDING),
      }
    },
    visibleNodes() { return this.layout.nodes },
    visibleLinks() { return this.layout.links },
    svgStyle() {
      return {
        transform: `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`,
        transformOrigin: '0 0',
        transition: this.isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
    relatedIds() {
      const set = new Set()
      if (!this.hoveredNode) return set
      set.add(this.hoveredNode.id)
      const byId = Object.fromEntries(this.layout.nodes.map(n => [n.id, n]))
      let cur = byId[this.hoveredNode.id]
      while (cur && cur.parentId) { set.add(cur.parentId); cur = byId[cur.parentId] }
      const walk = (id) => {
        const n = byId[id]
        if (!n) return
        for (const cid of n.children || []) { set.add(cid); walk(cid) }
      }
      walk(this.hoveredNode.id)
      return set
    },
  },
  watch: {
    'layout.w'(w) { this.svgSize.w = w },
    'layout.h'(h) { this.svgSize.h = h },
    tree: {
      immediate: false,
      handler() {
        this.collapsed = this.defaultCollapsed()
        this.layoutVersion++
        this.$nextTick(() => this.fitView())
      },
    },
  },
  mounted() {
    this.collapsed = this.defaultCollapsed()
    this.svgSize.w = this.layout.w
    this.svgSize.h = this.layout.h
    this.$nextTick(() => this.fitView())
  },
  methods: {
    // Auto collapse nodes ที่ depth >= 3 — ให้ tree เริ่มแบบดูเข้าใจง่าย
    defaultCollapsed() {
      const set = new Set()
      const root = this.indexedTree
      const walk = (n) => {
        if (n._depth >= 3 && (n.children || []).length > 0) set.add(n._id)
        for (const c of (n.children || [])) walk(c)
      }
      walk(root)
      return set
    },
    onNodeClick(node) {
      if (!node._togglable) return
      this.toggleNode(node)
    },
    truncate(s, n) {
      const str = String(s || '')
      return str.length > n ? str.slice(0, n - 1) + '…' : str
    },
    linkPath(link) {
      const { from, to } = link
      const dx = (to.x - from.x) * 0.5
      return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
    },
    toggleNode(node) {
      if (!node.children.length) return
      if (this.collapsed.has(node.id)) this.collapsed.delete(node.id)
      else this.collapsed.add(node.id)
      this.collapsed = new Set(this.collapsed)
      this.layoutVersion++
    },
    expandAll() {
      this.collapsed = new Set()
      this.layoutVersion++
    },
    collapseAll() {
      const set = new Set()
      for (const n of this.layout.nodes) {
        if (n.depth >= 1 && n.children.length) set.add(n.id)
      }
      this.collapsed = set
      this.layoutVersion++
    },
    zoomBy(factor) {
      this.scale = Math.min(2.5, Math.max(0.25, this.scale * factor))
    },
    fitView() {
      const wrap = this.$refs.canvasEl
      if (!wrap) return
      const rect = wrap.getBoundingClientRect()
      const sx = (rect.width - 60) / this.svgSize.w
      const sy = (rect.height - 60) / this.svgSize.h
      this.scale = Math.min(1, Math.min(sx, sy))
      this.tx = (rect.width - this.svgSize.w * this.scale) / 2
      this.ty = 30
    },
    onWheel(e) {
      const factor = Math.exp(-e.deltaY * 0.0015)
      const rect = this.$refs.canvasEl.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const next = Math.min(2.5, Math.max(0.25, this.scale * factor))
      this.tx = mx - (mx - this.tx) * (next / this.scale)
      this.ty = my - (my - this.ty) * (next / this.scale)
      this.scale = next
    },
    onMouseDown(e) {
      if (['rect', 'text', 'circle'].includes(e.target.tagName)) return
      this.isDragging = true
      this.lastMouse = { x: e.clientX, y: e.clientY }
    },
    onMouseMove(e) {
      if (!this.isDragging) return
      this.tx += e.clientX - this.lastMouse.x
      this.ty += e.clientY - this.lastMouse.y
      this.lastMouse = { x: e.clientX, y: e.clientY }
    },
    onMouseUp() { this.isDragging = false },
  },
}
</script>

<style scoped>
.mm-wrap {
  flex: 1;
  position: relative;
  background: #fafaf7;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.mm-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 2px solid #0a0a0a;
  flex-shrink: 0;
}
.mm-spacer { flex: 1; }
.mm-tool {
  background: #fff;
  border: 2px solid #0a0a0a;
  border-radius: 0;
  width: 36px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  color: #0a0a0a;
  font-weight: 700;
  font-family: inherit;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mm-tool:hover {
  background: #0a0a0a;
  color: #fff;
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 #0a0a0a;
}
.mm-tool-text {
  width: auto;
  padding: 0 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
}
.mm-zoom {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #0a0a0a;
  font-weight: 700;
  margin: 0 8px;
  min-width: 44px;
}

.mm-canvas {
  flex: 1;
  overflow: hidden;
  cursor: grab;
  position: relative;
  background-color: #fafaf7;
  background-image:
    linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px);
  background-size: 32px 32px;
}
.mm-canvas:active { cursor: grabbing; }

.mm-canvas svg {
  display: block;
  user-select: none;
}

.mm-node {
  cursor: default;
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
}
.mm-node.mm-clickable {
  cursor: pointer;
}
.mm-node.mm-clickable:hover rect:last-of-type {
  filter: brightness(1.08) drop-shadow(0 0 6px rgba(139, 92, 246, 0.3));
}
.mm-node:not(.mm-clickable):hover rect:last-of-type {
  filter: brightness(1.03);
}
.mm-faded { opacity: 0.15; }

.mm-text { pointer-events: none; }

/* Enter/Leave animation for nodes appearing/disappearing */
.mm-nodes > g {
  animation: nodeIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes nodeIn {
  0% {
    opacity: 0;
    transform-box: fill-box;
  }
  100% {
    opacity: 1;
  }
}

/* Link path opacity transition */
.mm-links path {
  transition: opacity 0.2s, stroke-opacity 0.2s;
}

.mm-hint {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  background: rgba(10, 10, 10, 0.92);
  border: 2px solid #0a0a0a;
  padding: 6px 12px;
  pointer-events: none;
}
.mm-hint-item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 0.5px;
  display: flex;
  gap: 4px;
}
.mm-hint-key {
  color: #8b5cf6;
  font-weight: 700;
}
</style>
