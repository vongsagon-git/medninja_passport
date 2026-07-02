/**
 * MEQ Scoring — fuzzy match student answers against expected answers + key points
 */

/**
 * Normalize string for comparison
 */
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, ' ')
    .replace(/[()[\]]/g, '')
}

/**
 * Check if two strings are a fuzzy match
 * - exact match
 * - one contains the other
 * - 60%+ word overlap
 */
function isFuzzyMatch(a, b) {
  const na = normalize(a)
  const nb = normalize(b)

  // Exact
  if (na === nb) return true

  // Contains
  if (na.includes(nb) || nb.includes(na)) return true

  // Word overlap
  const wordsA = na.split(' ').filter(w => w.length > 1)
  const wordsB = nb.split(' ').filter(w => w.length > 1)
  if (wordsB.length === 0) return false

  const overlap = wordsA.filter(w => wordsB.includes(w)).length
  return overlap >= Math.ceil(wordsB.length * 0.6)
}

/**
 * Score a student's answer for a given step
 *
 * @param {String} studentAnswer - free-text answer from student
 * @param {Object} step - the step definition from MeqCase
 * @returns {{ score, maxPoints, matchedAnswers, matchedKeyPoints, feedback }}
 */
function scoreAnswer(studentAnswer, step) {
  const maxPoints = step.scoring?.maxPoints || 10
  const allowPartial = step.scoring?.partialCredit !== false

  if (!studentAnswer || !studentAnswer.trim()) {
    return {
      score: 0,
      maxPoints,
      matchedAnswers: [],
      matchedKeyPoints: [],
      feedback: 'ไม่ได้ตอบ'
    }
  }

  const expectedAnswers = step.expectedAnswers || []
  const keyPoints = step.keyPoints || []

  // Split student answer by common delimiters (newline, comma, numbered list)
  const studentParts = studentAnswer
    .split(/[\n,;]+|(?:\d+[.)]\s*)/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  // Match against expectedAnswers
  const matchedAnswers = []
  const unmatchedExpected = [...expectedAnswers]

  for (const part of studentParts) {
    const idx = unmatchedExpected.findIndex(exp => isFuzzyMatch(part, exp))
    if (idx !== -1) {
      matchedAnswers.push(unmatchedExpected[idx])
      unmatchedExpected.splice(idx, 1)
    }
  }

  // Match against keyPoints
  const matchedKeyPoints = []
  for (const kp of keyPoints) {
    const found = studentParts.some(part => isFuzzyMatch(part, kp))
    if (found) matchedKeyPoints.push(kp)
  }

  // Calculate score
  let score = 0
  const totalItems = expectedAnswers.length + keyPoints.length

  if (totalItems === 0) {
    // No expected answers defined — give full points for any answer
    score = maxPoints
  } else {
    const matchedCount = matchedAnswers.length + matchedKeyPoints.length
    const ratio = matchedCount / totalItems

    if (allowPartial) {
      score = Math.round(maxPoints * ratio)
    } else {
      // All-or-nothing
      score = ratio >= 0.8 ? maxPoints : 0
    }
  }

  // Feedback
  let feedback = ''
  if (score === maxPoints) {
    feedback = 'ตอบครบถ้วน'
  } else if (score > 0) {
    feedback = `ตอบได้บางส่วน (${matchedAnswers.length + matchedKeyPoints.length}/${totalItems} ข้อ)`
  } else {
    feedback = 'ยังไม่ตรงกับคำตอบที่คาดหวัง'
  }

  return {
    score,
    maxPoints,
    matchedAnswers,
    matchedKeyPoints,
    feedback
  }
}

module.exports = { scoreAnswer, isFuzzyMatch, normalize }
