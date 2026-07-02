<template>
  <div class="ext-page">
    <div class="container">
      <h1>Extension Check</h1>
      <p class="sub">ตรวจสอบว่ามี Extension ดาวน์โหลดวีดีโอติดตั้งอยู่หรือไม่</p>

      <div class="card" v-for="ext in extensions" :key="ext.id"
        :class="ext.status">
        <div class="icon">
          <span v-if="ext.status === 'checking'" class="spinner"></span>
          <span v-else-if="ext.status === 'found'">&#x1F6A8;</span>
          <span v-else>&#x2705;</span>
        </div>
        <div class="info">
          <div class="name">{{ ext.name }}</div>
          <div class="ext-id">{{ ext.id }}</div>
          <div class="status-text">
            {{ ext.status === 'checking' ? 'กำลังตรวจ...' : ext.status === 'found' ? `พบ! (${ext.path})` : 'ไม่พบ' }}
          </div>
        </div>
      </div>

      <div v-if="done" class="summary" :class="foundCount > 0 ? 'danger' : 'ok'">
        <template v-if="foundCount > 0">
          &#x1F6A8; พบ {{ foundCount }} Extension: {{ foundNames }}
        </template>
        <template v-else>
          &#x2705; ไม่พบ Extension ดาวน์โหลดวีดีโอ
        </template>
      </div>

      <p class="note">ใช้วิธี probe web_accessible_resources ของแต่ละ Extension ID</p>
      <button class="btn" @click="runCheck">ตรวจใหม่</button>
    </div>
  </div>
</template>

<script>
const PROBE_PATHS = ['icon.png', 'icons/icon.png', 'icons/icon128.png', 'icons/icon48.png', 'icon128.png', 'icon48.png', 'icon16.png', 'manifest.json']

const KNOWN = [
  { id: 'iogidnfllpdhagebkblkgbfijkbkjdmm', name: 'Stream Recorder' },
  { id: 'nfmmmhanepmpifddlkkmihkalkoekpfd', name: 'FetchV' },
  { id: 'dcfofgiipjlhkemnpmiakbmblkbhgmga', name: 'Video DownloadHelper' },
  { id: 'lmjnegcaeklhafolokijcfjliaokphfk', name: 'Video Downloader Pro' },
  { id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm', name: 'uBlock Origin' },
]

// วิธี 1: Image probe (web_accessible_resources)
function probeImage(ext) {
  return new Promise((resolve) => {
    let done = false
    let tried = 0
    PROBE_PATHS.forEach(path => {
      const img = new Image()
      img.onload = () => { if (!done) { done = true; resolve({ found: true, method: `image:${path}` }) } }
      img.onerror = () => { if (++tried >= PROBE_PATHS.length && !done) { done = true; resolve({ found: false }) } }
      img.src = `chrome-extension://${ext.id}/${path}`
    })
    setTimeout(() => { if (!done) { done = true; resolve({ found: false }) } }, 2000)
  })
}

// วิธี 2: fetch probe
function probeFetch(ext) {
  return new Promise((resolve) => {
    const paths = ['manifest.json', 'icon.png', 'popup.html', 'popup.js', 'background.js']
    let done = false
    let tried = 0
    paths.forEach(path => {
      fetch(`chrome-extension://${ext.id}/${path}`, { mode: 'no-cors' })
        .then(r => { if (!done) { done = true; resolve({ found: true, method: `fetch:${path}` }) } })
        .catch(() => { if (++tried >= paths.length && !done) { done = true; resolve({ found: false }) } })
    })
    setTimeout(() => { if (!done) { done = true; resolve({ found: false }) } }, 2000)
  })
}

// วิธี 3: chrome.runtime.sendMessage
function probeRuntime(ext) {
  return new Promise((resolve) => {
    if (!chrome.runtime?.sendMessage) return resolve({ found: false })
    try {
      chrome.runtime.sendMessage(ext.id, { ping: true }, (response) => {
        const err = chrome.runtime.lastError
        // ถ้า extension ไม่มี → error "Could not establish connection"
        // ถ้ามีแต่ไม่รับ message → error อื่น หรือ response undefined
        if (err && err.message && err.message.includes('Could not establish connection')) {
          resolve({ found: false })
        } else {
          // extension ติดตั้งอยู่ (ไม่ว่าจะตอบหรือไม่ตอบ)
          resolve({ found: true, method: 'runtime' })
        }
      })
    } catch (e) { resolve({ found: false }) }
    setTimeout(() => resolve({ found: false }), 2000)
  })
}

async function probeOne(ext) {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return { ...ext, status: 'safe', path: '', note: 'ไม่ใช่ Chrome' }
  }
  // ลองทุกวิธี พร้อมกัน
  const [img, ftch, rt] = await Promise.all([
    probeImage(ext), probeFetch(ext), probeRuntime(ext)
  ])
  if (img.found) return { ...ext, status: 'found', path: img.method }
  if (ftch.found) return { ...ext, status: 'found', path: ftch.method }
  if (rt.found) return { ...ext, status: 'found', path: rt.method }
  return { ...ext, status: 'safe', path: '' }
}

export default {
  name: 'ExtCheck',
  data() {
    return {
      extensions: KNOWN.map(e => ({ ...e, status: 'checking', path: '' })),
      done: false
    }
  },
  computed: {
    foundCount() { return this.extensions.filter(e => e.status === 'found').length },
    foundNames() { return this.extensions.filter(e => e.status === 'found').map(e => e.name).join(', ') }
  },
  mounted() { this.runCheck() },
  methods: {
    async runCheck() {
      this.done = false
      this.extensions = KNOWN.map(e => ({ ...e, status: 'checking', path: '' }))
      const results = await Promise.all(KNOWN.map(e => probeOne(e)))
      this.extensions = results
      this.done = true
    }
  }
}
</script>

<style scoped>
.ext-page {
  min-height: 100vh; background: #0f172a; color: #e2e8f0;
  padding: 40px 20px; font-family: 'Noto Sans Thai', sans-serif;
}
.container { max-width: 500px; margin: 0 auto; }
h1 { text-align: center; margin-bottom: 8px; font-size: 22px; }
.sub { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 32px; }
.card {
  background: #1e293b; border-radius: 12px; padding: 16px 20px;
  margin-bottom: 12px; display: flex; align-items: center; gap: 14px;
  transition: all .3s; border: 2px solid transparent;
}
.card.checking { opacity: .5; }
.card.found { border-color: #ef4444; background: rgba(239,68,68,.1); }
.card.safe { border-color: #22c55e; background: rgba(34,197,94,.05); }
.icon {
  width: 40px; height: 40px; border-radius: 8px; background: #334155;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.card.found .icon { background: #dc2626; }
.card.safe .icon { background: #16a34a; }
.info { flex: 1; }
.name { font-weight: 700; font-size: 14px; }
.ext-id { font-size: 10px; color: #64748b; font-family: monospace; word-break: break-all; }
.status-text { font-size: 12px; font-weight: 600; margin-top: 2px; }
.card.found .status-text { color: #f87171; }
.card.safe .status-text { color: #4ade80; }
.card.checking .status-text { color: #94a3b8; }
.summary {
  text-align: center; margin-top: 24px; padding: 20px;
  border-radius: 12px; font-size: 15px; font-weight: 700;
}
.summary.danger { background: rgba(239,68,68,.15); color: #f87171; border: 2px solid #ef4444; }
.summary.ok { background: rgba(34,197,94,.1); color: #4ade80; border: 2px solid #22c55e; }
.note { text-align: center; color: #64748b; font-size: 11px; margin-top: 16px; }
.btn {
  display: block; margin: 24px auto 0; padding: 12px 32px;
  background: linear-gradient(135deg,#a855f7,#7c3aed); color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
}
.btn:hover { opacity: .9; }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid #475569; border-top-color: #a855f7;
  border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
