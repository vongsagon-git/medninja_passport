// In-memory log store สำหรับ debug page /china
// Cap 500 entries — pop เก่าสุดออก
const MAX_LOGS = 500
const logs = []

function pushLog(entry) {
  logs.push({
    ts: new Date().toISOString(),
    ...entry
  })
  if (logs.length > MAX_LOGS) logs.shift()
}

function getLogs(filter = {}) {
  let result = [...logs]
  if (filter.sessionId) {
    result = result.filter(l => l.sessionId === filter.sessionId)
  }
  if (filter.since) {
    const since = new Date(filter.since).getTime()
    result = result.filter(l => new Date(l.ts).getTime() >= since)
  }
  return result
}

function clearLogs() {
  logs.length = 0
}

module.exports = { pushLog, getLogs, clearLogs }
