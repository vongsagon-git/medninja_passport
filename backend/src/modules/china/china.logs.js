// In-memory log store สำหรับ debug page /china
// Cap 500 entries — pop เก่าสุดออก
const MAX_LOGS = 3000  // เพิ่มจาก 500 (iPhone/Safari session ถูก rotate เร็วเกินไป)
const logs = []

// Test result store — บันทึกผลการ test DRM
// Cap 200 test results
const MAX_TESTS = 200
const testResults = []

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

// ═══════════ Test results ═══════════
function pushTestResult(entry) {
  testResults.push({
    ts: new Date().toISOString(),
    ...entry
  })
  if (testResults.length > MAX_TESTS) testResults.shift()
}

function getTestResults(filter = {}) {
  let result = [...testResults]
  if (filter.sessionId) {
    result = result.filter(r => r.sessionId === filter.sessionId)
  }
  if (filter.status) {
    result = result.filter(r => r.status === filter.status)
  }
  return result.reverse() // newest first
}

module.exports = { pushLog, getLogs, clearLogs, pushTestResult, getTestResults }
