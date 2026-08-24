/**
 * Watched Store — global sync ระหว่าง UniversalWatch / SectionPage / MyDashboard
 *
 * เก็บ 2 ก้อน:
 *   1) watchedMap: { [sectionId]: number[] }             — index วิดีโอที่ mark ดูแล้ว
 *   2) progressMap: { [sectionId]: { [key]: { currentTime, duration, watched } } }
 *      key = videoIndex สำหรับ main, `bonus_${videoIndex}` สำหรับ bonus
 *
 * ใช้ CustomEvent 'watched-changed' broadcast ให้ทุก component ที่ subscribe
 * รู้ว่ามีการเปลี่ยนแปลง → refresh state ทันที (ไม่ต้องรอ visibilitychange)
 */

const LS_WATCHED = '__medninja_watched__'
const LS_PROGRESS = '__medninja_progress__'
const EVT = 'watched-changed'

function _readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback } catch { return fallback }
}
function _writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export function getWatchedMap() {
  return _readLS(LS_WATCHED, {})
}
export function saveWatchedMap(map) {
  _writeLS(LS_WATCHED, map)
  _broadcast()
}

export function getProgressMap() {
  return _readLS(LS_PROGRESS, {})
}
export function saveProgressMap(map) {
  _writeLS(LS_PROGRESS, map)
  _broadcast()
}

export function setWatched(sectionId, idx, watched) {
  const wm = getWatchedMap()
  if (!wm[sectionId]) wm[sectionId] = []
  const i = wm[sectionId].indexOf(idx)
  if (watched && i < 0) wm[sectionId].push(idx)
  if (!watched && i >= 0) wm[sectionId].splice(i, 1)
  _writeLS(LS_WATCHED, wm)

  const pm = getProgressMap()
  if (!pm[sectionId]) pm[sectionId] = {}
  if (!pm[sectionId][idx]) pm[sectionId][idx] = {}
  pm[sectionId][idx].watched = watched
  _writeLS(LS_PROGRESS, pm)

  _broadcast()
}

export function setProgress(sectionId, idx, { currentTime, duration, watched, isBonus }) {
  const pm = getProgressMap()
  if (!pm[sectionId]) pm[sectionId] = {}
  const key = isBonus ? `bonus_${idx}` : idx
  if (!pm[sectionId][key]) pm[sectionId][key] = {}
  if (currentTime !== undefined) pm[sectionId][key].currentTime = currentTime
  if (duration !== undefined && duration > 0) pm[sectionId][key].duration = duration
  if (watched !== undefined) pm[sectionId][key].watched = watched
  _writeLS(LS_PROGRESS, pm)
  _broadcast()
}

export function mergeServerProgress(sectionId, serverList) {
  const pm = getProgressMap()
  const wm = getWatchedMap()
  if (!pm[sectionId]) pm[sectionId] = {}
  if (!wm[sectionId]) wm[sectionId] = []
  for (const p of (serverList || [])) {
    const key = p.isBonus ? `bonus_${p.videoIndex}` : p.videoIndex
    pm[sectionId][key] = {
      currentTime: p.currentTime || 0,
      watched: !!p.watched
    }
    if (!p.isBonus && p.watched && !wm[sectionId].includes(p.videoIndex)) {
      wm[sectionId].push(p.videoIndex)
    }
  }
  _writeLS(LS_PROGRESS, pm)
  _writeLS(LS_WATCHED, wm)
  _broadcast()
}

export function isWatched(sectionId, idx) {
  const wm = getWatchedMap()
  return (wm[sectionId] || []).includes(idx)
}

export function getPct(sectionId, idx, isBonus = false) {
  const pm = getProgressMap()
  const key = isBonus ? `bonus_${idx}` : idx
  const p = pm[sectionId]?.[key]
  if (!p || !p.currentTime || !p.duration) return 0
  return Math.min(100, Math.round((p.currentTime / p.duration) * 100))
}

export function onChange(handler) {
  const wrapper = () => handler()
  window.addEventListener(EVT, wrapper)
  const storageWrapper = (e) => {
    if (e.key === LS_WATCHED || e.key === LS_PROGRESS) handler()
  }
  window.addEventListener('storage', storageWrapper)
  return () => {
    window.removeEventListener(EVT, wrapper)
    window.removeEventListener('storage', storageWrapper)
  }
}

function _broadcast() {
  try { window.dispatchEvent(new CustomEvent(EVT)) } catch {}
}
