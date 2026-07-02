<template>
  <div class="ddx-demo" @wheel="onWheel">
    <!-- ═══ Not LINE: Block ═══ -->
    <section v-if="!inLine" class="screen intro-screen">
      <div class="intro-bg"></div>
      <div class="intro-content visible">
        <div class="intro-badge">MedNinja Presents</div>
        <h1 class="intro-title">
          <span class="intro-ninja">NINJA</span>
          <span class="intro-ddx">DDx</span>
        </h1>
        <p class="intro-tagline">เห็นอาการ นึกถึงทันที</p>
        <div class="line-block-box">
          <div class="line-block-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.93 1.94 5.5 4.86 7.08-.16.58-.87 3.12-.9 3.32 0 0-.02.12.06.17.08.04.17.01.17.01.22-.03 2.6-1.72 3.68-2.48.68.1 1.38.15 2.13.15 5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/></svg>
          </div>
          <p class="line-block-title">เปิดใน LINE เพื่อเล่น</p>
          <p class="line-block-sub">NINJA DDx Flashcard เล่นได้เฉพาะใน LINE</p>
          <a :href="liffUrl" class="line-block-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.93 1.94 5.5 4.86 7.08-.16.58-.87 3.12-.9 3.32 0 0-.02.12.06.17.08.04.17.01.17.01.22-.03 2.6-1.72 3.68-2.48.68.1 1.38.15 2.13.15 5.52 0 10-3.82 10-8.5S17.52 2 12 2z"/></svg>
            เปิดใน LINE
          </a>
        </div>
      </div>
    </section>

    <!-- ═══ Screen 0: Cinematic Intro (LINE only) ═══ -->
    <section v-else-if="screen === 0" class="screen intro-screen" @click="nextScreen">
      <div class="intro-bg"></div>
      <div class="intro-content" :class="{ visible: introVisible }">
        <div class="intro-badge">MedNinja Presents</div>
        <h1 class="intro-title">
          <span class="intro-ninja">NINJA</span>
          <span class="intro-ddx">DDx</span>
        </h1>
        <p class="intro-tagline">เห็นอาการ นึกถึงทันที</p>
        <div class="intro-stats-row">
          <div class="intro-stat"><span>{{ allCategories.length }}</span> ระบบ</div>
          <div class="intro-stat-dot"></div>
          <div class="intro-stat"><span>{{ totalSymptoms }}</span> อาการ</div>
          <div class="intro-stat-dot"></div>
          <div class="intro-stat"><span>{{ totalDdx }}</span> DDx</div>
        </div>
        <button class="intro-cta pulse" @click.stop="nextScreen">
          <span>เริ่มสัมผัสระบบ</span>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
      <div class="scroll-hint">กดเพื่อเริ่ม ▼</div>
    </section>

    <!-- ═══ Screen 1: The Problem ═══ -->
    <section v-if="screen === 1" class="screen problem-screen">
      <div class="screen-inner fade-up">
        <div class="problem-scene">
          <div class="problem-patient">🤒</div>
          <div class="problem-bubble">"หมอคะ หนูปวดท้องมาก"</div>
        </div>
        <h2>หมอต้องคิดอะไรใน 5 วินาที?</h2>
        <div class="problem-think">
          <div v-for="(t, i) in thinkItems" :key="i" class="think-item" :class="{ show: thinkShow > i }" :style="{ transitionDelay: (i * 0.3) + 's' }">
            <span class="think-num">{{ i + 1 }}</span>
            <span>{{ t }}</span>
          </div>
        </div>
        <button class="screen-cta" @click="nextScreen">ลองดูว่ามีโรคอะไรบ้าง →</button>
      </div>
    </section>

    <!-- ═══ Screen 2: Interactive Mindmap Demo ═══ -->
    <section v-if="screen === 2" class="screen mindmap-screen">
      <div class="screen-inner">
        <div class="mm-demo-header fade-up">
          <h2>Mindmap: ปวดท้อง → นึกถึง...</h2>
          <p>กดที่แต่ละโรคเพื่อดูรายละเอียด</p>
        </div>

        <div class="mm-demo-tree">
          <div class="mm-center-node">
            <span class="mm-center-icon">🫄</span>
            <span>ปวดท้อง</span>
          </div>
          <div class="mm-branches">
            <div v-for="(ddx, i) in demoDdx" :key="i"
              class="mm-demo-branch"
              :class="{ active: activeDdx === i, show: branchShow > i }"
              :style="{ '--delay': (i * 0.12) + 's', '--angle': branchAngle(i) + 'deg' }"
              @click="activeDdx = activeDdx === i ? -1 : i">
              <div class="mm-demo-node" :class="['freq-' + ddx.frequency]">
                <span class="mm-demo-freq">{{ { high: '🔴', med: '🟡', low: '🟢' }[ddx.frequency] }}</span>
                <span class="mm-demo-name">{{ ddx.diagnosis }}</span>
                <span class="mm-demo-th">{{ ddx.diagnosisTh }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DDx Detail Popup -->
        <transition name="slide-up">
          <div v-if="activeDdx >= 0" class="mm-demo-detail">
            <div class="mm-demo-detail-header">
              <h3>{{ demoDdx[activeDdx].diagnosis }} <small>{{ demoDdx[activeDdx].diagnosisTh }}</small></h3>
              <button class="mm-close" @click="activeDdx = -1">✕</button>
            </div>
            <div class="mm-demo-detail-body">
              <div class="dd-row clue">
                <span class="dd-icon">🔍</span>
                <div>
                  <div class="dd-label">Key Clues</div>
                  <div class="dd-tags"><span v-for="c in demoDdx[activeDdx].keyClues" :key="c">{{ c }}</span></div>
                </div>
              </div>
              <div v-if="demoDdx[activeDdx].treatment" class="dd-row treat">
                <span class="dd-icon">💊</span>
                <div>
                  <div class="dd-label">Treatment</div>
                  <p>{{ demoDdx[activeDdx].treatment }}</p>
                </div>
              </div>
              <div v-if="demoDdx[activeDdx].examTip" class="dd-row tip">
                <span class="dd-icon">💡</span>
                <div>
                  <div class="dd-label">Exam Tip</div>
                  <p>{{ demoDdx[activeDdx].examTip }}</p>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <button class="screen-cta" @click="nextScreen" style="margin-top:24px">ลองทดสอบตัวเอง →</button>
      </div>
    </section>

    <!-- ═══ Screen 3: Quick Quiz ═══ -->
    <section v-if="screen === 3" class="screen quiz-screen">
      <div class="screen-inner">
        <div v-if="!quizStarted" class="quiz-intro fade-up">
          <div class="quiz-intro-icon">⚡</div>
          <h2>ทดสอบตัวเอง</h2>
          <p>ดูอาการ → นึกถึงโรคอะไร?<br>5 ข้อ ใช้เวลาไม่ถึง 2 นาที</p>
          <button class="quiz-start" @click="startQuiz">เริ่มเลย</button>
        </div>

        <div v-else-if="!quizDone" class="quiz-play fade-up">
          <div class="quiz-bar">
            <div class="quiz-bar-fill" :style="{ width: ((quizIdx + 1) / quizData.length * 100) + '%' }"></div>
          </div>
          <div class="quiz-q-num">{{ quizIdx + 1 }} / {{ quizData.length }}</div>
          <div class="quiz-card">
            <div class="quiz-q-label">เห็นสิ่งนี้ในข้อสอบ:</div>
            <div class="quiz-q-text">{{ quizData[quizIdx].pattern }}</div>
          </div>

          <div v-if="!quizRevealed" class="quiz-action">
            <p>คิดคำตอบในใจ... แล้วกด</p>
            <button class="quiz-reveal" @click="quizRevealed = true">ดูคำตอบ</button>
          </div>

          <div v-else class="quiz-answer fade-up">
            <div class="quiz-a-box">
              <span class="quiz-a-arrow">→</span>
              <strong>{{ quizData[quizIdx].answer }}</strong>
            </div>
            <div class="quiz-memo">💡 {{ quizData[quizIdx].mnemonic }}</div>
            <div class="quiz-judge">
              <button class="qj-btn correct" @click="quizAnswer(true)">✅ จำได้!</button>
              <button class="qj-btn wrong" @click="quizAnswer(false)">❌ ลืมแล้ว</button>
            </div>
          </div>
        </div>

        <div v-else class="quiz-result fade-up">
          <div class="result-circle" :class="resultClass">
            <div class="result-num">{{ quizScore }}</div>
            <div class="result-total">/ {{ quizData.length }}</div>
          </div>
          <h2 class="result-msg">{{ resultMsg }}</h2>
          <p class="result-sub">{{ resultSub }}</p>
          <div class="result-actions">
            <button class="screen-cta" @click="startQuiz">ลองอีกรอบ</button>
            <button class="screen-cta secondary" @click="nextScreen">ดูระบบเต็ม →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ Screen 4: Feature Showcase ═══ -->
    <section v-if="screen === 4" class="screen features-screen">
      <div class="screen-inner fade-up">
        <h2>ทำไมต้อง NINJA DDx?</h2>
        <div class="feature-grid">
          <div v-for="(f, i) in features" :key="i" class="feature-card" :style="{ animationDelay: (i * 0.1) + 's' }">
            <div class="feature-icon">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>

        <div class="lineup-section">
          <h3>NINJA Product Family</h3>
          <div class="lineup-row">
            <div class="lineup-item">
              <span class="lineup-icon">📺</span>
              <span>NINJA LMS</span>
              <small>เรียน VDO</small>
            </div>
            <div class="lineup-item">
              <span class="lineup-icon">🔴</span>
              <span>NINJA LIVE</span>
              <small>เรียน Live</small>
            </div>
            <div class="lineup-item">
              <span class="lineup-icon">📝</span>
              <span>NINJA NLEX</span>
              <small>ฝึกข้อสอบ</small>
            </div>
            <div class="lineup-item active">
              <span class="lineup-icon">🧠</span>
              <span>NINJA DDx</span>
              <small>Approach อาการ</small>
              <span class="lineup-new">NEW</span>
            </div>
          </div>
        </div>

        <div class="final-cta-section">
          <h2>พร้อมฝึก DDx จนชินแล้วหรือยัง?</h2>
          <p>{{ allCategories.length }} ระบบ · {{ totalSymptoms }} อาการ · {{ totalDdx }} DDx · ครบทั้งวินิจฉัย + รักษา + ยา</p>
          <button class="final-cta pulse">เริ่มเรียน NINJA DDx</button>
        </div>
      </div>
    </section>

    <!-- Navigation dots -->
    <div class="nav-dots" v-if="screen > 0">
      <span v-for="s in totalScreens" :key="s" :class="['dot', { active: s - 1 === screen }]" @click="screen = s - 1"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const liffUrl = 'https://liff.line.me/2009259048-lwEXYc0q'
const inLine = /Line\//i.test(navigator.userAgent || '')

// Screens
const screen = ref(0)
const totalScreens = 5
const introVisible = ref(false)

// Data from API
const demoData = ref(null)
const quizPool = ref([])

onMounted(async () => {
  setTimeout(() => { introVisible.value = true }, 300)
  try {
    const res = await fetch('/api/ddx/demo')
    const data = await res.json()
    demoData.value = data
    quizPool.value = data.demoQuiz || []
  } catch (e) {
    console.error('Failed to load demo data', e)
  }
})

function nextScreen() { if (screen.value < totalScreens - 1) screen.value++ }

function onWheel(e) {
  // Disable scroll-to-next on quiz screen when interacting
  if (screen.value === 3 && quizStarted.value) return
}

// Data
const totalSymptoms = computed(() => demoData.value?.summary?.reduce((s, c) => s + c.symptomCount, 0) || 0)
const totalDdx = computed(() => demoData.value?.summary?.reduce((s, c) => s + c.ddxCount, 0) || 0)
const allCategories = computed(() => demoData.value?.summary || [])

// Screen 1: Think items
const thinkItems = ['ฟังอาการ → "ปวดท้อง"', 'นึกถึงโรคที่เป็นไปได้ทั้งหมด (DDx)', 'ไล่ตัดออกจนเหลือโรคที่ใช่']
const thinkShow = ref(0)
watch(screen, (v) => {
  if (v === 1) {
    thinkShow.value = 0
    let i = 0
    const timer = setInterval(() => { thinkShow.value = ++i; if (i >= 3) clearInterval(timer) }, 600)
  }
})

// Screen 2: Mindmap demo
const demoDdx = computed(() => demoData.value?.demoDdx || [])
const activeDdx = ref(-1)
const branchShow = ref(0)
watch(screen, (v) => {
  if (v === 2) {
    branchShow.value = 0
    activeDdx.value = -1
    let i = 0
    const timer = setInterval(() => { branchShow.value = ++i; if (i >= 7) clearInterval(timer) }, 150)
  }
})
function branchAngle(i) { return -60 + (i * 20) }

// Screen 3: Quiz
const quizStarted = ref(false)
const quizDone = ref(false)
const quizIdx = ref(0)
const quizScore = ref(0)
const quizRevealed = ref(false)
const quizData = ref([])

function startQuiz() {
  const shuffled = [...quizPool.value].sort(() => Math.random() - 0.5)
  quizData.value = shuffled.slice(0, 5)
  quizIdx.value = 0
  quizScore.value = 0
  quizRevealed.value = false
  quizDone.value = false
  quizStarted.value = true
}
function quizAnswer(correct) {
  if (correct) quizScore.value++
  quizRevealed.value = false
  if (quizIdx.value < quizData.value.length - 1) quizIdx.value++
  else quizDone.value = true
}
const resultClass = computed(() => quizScore.value >= 4 ? 'great' : quizScore.value >= 3 ? 'good' : 'need-work')
const resultMsg = computed(() => quizScore.value >= 4 ? '🎉 เก่งมาก!' : quizScore.value >= 3 ? '👍 ดีเลย!' : '💪 ฝึกอีกนิด!')
const resultSub = computed(() => quizScore.value >= 4 ? 'พร้อมลุย NINJA DDx เต็มระบบแล้ว' : quizScore.value >= 3 ? 'ฝึกเพิ่มอีกหน่อยจะเก่งมาก' : 'NINJA DDx จะช่วยให้จำได้ด้วย Spaced Repetition')

// Screen 4: Features
const features = [
  { icon: '🗺️', title: 'Mindmap สวยๆ', desc: 'ดู DDx ทุกระบบแบบ tree กดเปิด-ปิด เข้าใจง่าย' },
  { icon: '⚡', title: 'Pattern จำเร็ว', desc: '49 patterns "เห็นอะไร→นึกถึงอะไร" + ตัวช่วยจำ' },
  { icon: '✍️', title: 'ฝึกตอบ Quiz', desc: 'ให้อาการ → พิมพ์ DDx เอง → ระบบตรวจ + ให้คะแนน' },
  { icon: '🔄', title: 'ทบทวนอัตโนมัติ', desc: 'Spaced Repetition จัดรอบทบทวนให้ ไม่มีทางลืม' },
  { icon: '💊', title: 'ครบทั้ง Dx + Tx', desc: 'วินิจฉัย + ยา + รักษา + ข้อห้าม ครบจบ NL' },
  { icon: '📊', title: 'รู้จุดอ่อน', desc: 'แสดง progress อันไหนชินแล้ว อันไหนต้องฝึก' }
]
</script>

<style scoped>
/* ═══ Global ═══ */
.ddx-demo { background: #060a14; color: #e2e8f0; font-family: 'Noto Sans Thai', sans-serif; min-height: 100vh; overflow-x: hidden; }
.screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
.screen-inner { max-width: 800px; margin: 0 auto; padding: 40px 24px; width: 100%; }
h2 { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 12px; text-align: center; }
p { color: #94a3b8; font-size: 15px; text-align: center; line-height: 1.7; }

/* ═══ Animations ═══ */
.fade-up { animation: fadeUp .6s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.slide-up-enter-active { animation: slideUp .3s ease; }
.slide-up-leave-active { animation: slideUp .2s ease reverse; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.pulse { animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,.4); } 50% { box-shadow: 0 0 0 12px rgba(59,130,246,0); } }

/* ═══ Screen 0: Intro ═══ */
.intro-screen { background: radial-gradient(ellipse at center, #0f172a 0%, #060a14 70%); overflow: hidden; cursor: pointer; flex-direction: column; }
.intro-bg { position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
.intro-content { text-align: center; position: relative; z-index: 1; opacity: 0; transform: translateY(30px); transition: all 1s cubic-bezier(.16,1,.3,1); }
.intro-content.visible { opacity: 1; transform: translateY(0); }
.intro-badge { display: inline-block; padding: 6px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,.1); color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
.intro-title { font-size: 72px; font-weight: 900; margin: 0 0 8px; letter-spacing: -2px; }
.intro-ninja { color: #fff; }
.intro-ddx { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.intro-tagline { font-size: 20px; color: #94a3b8; margin: 0 0 32px; }
.intro-stats-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 40px; align-items: center; }
.intro-stat { text-align: center; }
.intro-stat span { display: block; font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.intro-stat-dot { width: 4px; height: 4px; background: #334155; border-radius: 50%; }
.intro-cta { display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; transition: transform .15s; }
.intro-cta:hover { transform: scale(1.05); }
/* LINE Block */
.line-block-box {
  margin-top: 24px;
  padding: 24px 20px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  text-align: center;
}
.line-block-icon {
  color: #06c755;
  margin-bottom: 12px;
}
.line-block-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}
.line-block-sub {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}
.line-block-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: #06c755;
  color: #fff;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
  transition: all .15s;
}
.line-block-btn:hover {
  background: #05a847;
  transform: scale(1.05);
}
.scroll-hint { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); color: #334155; font-size: 13px; animation: bounce 2s infinite; }
@keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }

/* ═══ Screen 1: Problem ═══ */
.problem-screen { background: #060a14; }
.problem-scene { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 32px; }
.problem-patient { font-size: 56px; animation: fadeUp .6s ease both; }
.problem-bubble { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); padding: 16px 24px; border-radius: 18px 18px 18px 4px; font-size: 16px; color: #fca5a5; animation: fadeUp .6s .3s ease both; }
.problem-think { display: flex; flex-direction: column; gap: 12px; max-width: 500px; margin: 24px auto 32px; }
.think-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; opacity: 0; transform: translateX(-20px); transition: all .5s ease; }
.think-item.show { opacity: 1; transform: translateX(0); }
.think-num { width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }

/* ═══ Screen 2: Mindmap Demo ═══ */
.mindmap-screen { background: #060a14; }
.mm-demo-header { margin-bottom: 24px; }
.mm-demo-tree { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 8px; }
.mm-center-node { display: inline-flex; align-items: center; gap: 10px; padding: 16px 28px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 16px; font-size: 18px; font-weight: 700; color: #fff; box-shadow: 0 0 30px rgba(59,130,246,.3); }
.mm-center-icon { font-size: 24px; }

.mm-branches { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 700px; }
.mm-demo-branch { opacity: 0; transform: translateY(10px); transition: all .3s ease; transition-delay: var(--delay); }
.mm-demo-branch.show { opacity: 1; transform: translateY(0); }
.mm-demo-node { padding: 10px 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 8px; }
.mm-demo-node:hover { background: rgba(255,255,255,.08); transform: translateY(-2px); }
.mm-demo-branch.active .mm-demo-node { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.3); box-shadow: 0 0 20px rgba(59,130,246,.15); }
.mm-demo-node.freq-high { border-color: rgba(251,191,36,.2); }
.mm-demo-freq { font-size: 10px; }
.mm-demo-name { font-weight: 600; font-size: 13px; color: #e2e8f0; }
.mm-demo-th { font-size: 11px; color: #64748b; }

/* DDx Detail */
.mm-demo-detail { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 20px; max-width: 600px; margin: 16px auto 0; }
.mm-demo-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.mm-demo-detail-header h3 { font-size: 16px; font-weight: 700; color: #fff; margin: 0; }
.mm-demo-detail-header small { color: #64748b; font-size: 13px; margin-left: 8px; }
.mm-close { background: none; border: none; color: #64748b; font-size: 18px; cursor: pointer; padding: 4px; }
.dd-row { display: flex; gap: 12px; padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; }
.dd-row.clue { background: rgba(59,130,246,.06); }
.dd-row.treat { background: rgba(99,102,241,.06); }
.dd-row.tip { background: rgba(251,191,36,.06); }
.dd-icon { font-size: 18px; flex-shrink: 0; padding-top: 2px; }
.dd-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
.dd-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.dd-tags span { padding: 3px 8px; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.15); border-radius: 5px; font-size: 11px; color: #93c5fd; }
.dd-row p { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
.dd-row.tip p { color: #fde68a; }

/* ═══ Screen 3: Quiz ═══ */
.quiz-screen { background: #060a14; }
.quiz-intro { text-align: center; }
.quiz-intro-icon { font-size: 56px; margin-bottom: 16px; }
.quiz-start { padding: 16px 40px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; border: none; border-radius: 14px; font-size: 18px; font-weight: 800; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; margin-top: 24px; transition: transform .15s; }
.quiz-start:hover { transform: scale(1.05); }

.quiz-play { max-width: 550px; margin: 0 auto; }
.quiz-bar { height: 4px; background: rgba(255,255,255,.06); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
.quiz-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 2px; transition: width .3s; }
.quiz-q-num { text-align: center; font-size: 12px; color: #475569; margin-bottom: 16px; }
.quiz-card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 32px 24px; text-align: center; margin-bottom: 24px; }
.quiz-q-label { font-size: 12px; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .5px; }
.quiz-q-text { font-size: 18px; font-weight: 600; color: #fff; line-height: 1.6; }

.quiz-action { text-align: center; }
.quiz-action p { color: #475569; margin-bottom: 12px; }
.quiz-reveal { padding: 14px 36px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; }

.quiz-answer { text-align: center; }
.quiz-a-box { display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2); border-radius: 14px; margin-bottom: 10px; }
.quiz-a-arrow { font-size: 20px; color: #60a5fa; }
.quiz-a-box strong { color: #93c5fd; font-size: 16px; }
.quiz-memo { font-size: 13px; color: #fbbf24; margin-bottom: 20px; }
.quiz-judge { display: flex; justify-content: center; gap: 12px; }
.qj-btn { padding: 12px 28px; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; transition: transform .1s; }
.qj-btn:hover { transform: scale(1.05); }
.qj-btn.correct { background: #16a34a; color: #fff; }
.qj-btn.wrong { background: #dc2626; color: #fff; }

/* Quiz Result */
.quiz-result { text-align: center; }
.result-circle { width: 130px; height: 130px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; border: 4px solid; }
.result-circle.great { border-color: #16a34a; background: rgba(22,163,74,.08); }
.result-circle.good { border-color: #f59e0b; background: rgba(245,158,11,.08); }
.result-circle.need-work { border-color: #ef4444; background: rgba(239,68,68,.08); }
.result-num { font-size: 42px; font-weight: 900; color: #fff; }
.result-total { font-size: 14px; color: #64748b; }
.result-msg { font-size: 22px; margin-bottom: 8px; }
.result-sub { margin-bottom: 24px; }
.result-actions { display: flex; justify-content: center; gap: 12px; }

/* ═══ Screen 4: Features ═══ */
.features-screen { background: #060a14; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 32px 0; }
.feature-card { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: 24px 18px; text-align: center; animation: fadeUp .5s ease both; transition: all .2s; }
.feature-card:hover { background: rgba(255,255,255,.04); transform: translateY(-4px); border-color: rgba(59,130,246,.2); }
.feature-icon { font-size: 32px; margin-bottom: 10px; }
.feature-card h3 { font-size: 14px; font-weight: 700; color: #e2e8f0; margin: 0 0 6px; }
.feature-card p { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; text-align: center; }

/* Lineup */
.lineup-section { margin: 40px 0; }
.lineup-section h3 { text-align: center; font-size: 14px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
.lineup-row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.lineup-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 20px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; min-width: 120px; position: relative; }
.lineup-item.active { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.3); box-shadow: 0 0 20px rgba(59,130,246,.1); }
.lineup-icon { font-size: 24px; }
.lineup-item span:nth-child(2) { font-weight: 700; font-size: 13px; color: #e2e8f0; }
.lineup-item small { font-size: 11px; color: #64748b; }
.lineup-new { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }

/* Final CTA */
.final-cta-section { text-align: center; padding: 40px 0; }
.final-cta { padding: 18px 48px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; border: none; border-radius: 16px; font-size: 18px; font-weight: 800; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; margin-top: 20px; }

/* ═══ CTA Button ═══ */
.screen-cta { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.3); color: #60a5fa; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans Thai', sans-serif; transition: all .15s; margin: 0 auto; }
.screen-cta:hover { background: rgba(59,130,246,.25); }
.screen-cta.secondary { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.1); color: #94a3b8; }
.screen-cta.secondary:hover { background: rgba(255,255,255,.08); }

/* ═══ Nav Dots ═══ */
.nav-dots { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,.1); cursor: pointer; transition: all .2s; }
.dot.active { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,.5); width: 12px; height: 12px; }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .intro-title { font-size: 48px; }
  .intro-stats-row { gap: 16px; }
  .intro-stat span { font-size: 24px; }
  .feature-grid { grid-template-columns: 1fr 1fr; }
  .lineup-row { flex-direction: column; align-items: center; }
  .mm-branches { gap: 6px; }
}
</style>
