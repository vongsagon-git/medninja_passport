/**
 * Approach Scoring + SM-2 Spaced Repetition
 */

/**
 * Normalize diagnosis string for comparison
 */
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, ' ')
    .replace(/[()]/g, '')
}

/**
 * Fuzzy match user answers against expected diagnoses
 * Returns { matched, unmatched, extra }
 */
function fuzzyMatch(userAnswers, expectedDiagnoses) {
  const normalizedExpected = expectedDiagnoses.map(d => ({
    original: d.diagnosis || d,
    normalized: normalize(d.diagnosis || d),
    frequency: d.frequency || 'medium'
  }))

  const matched = []
  const unmatchedExpected = [...normalizedExpected]
  const extra = []

  for (const answer of userAnswers) {
    const normAnswer = normalize(answer)
    if (!normAnswer) continue

    // Try exact match first
    let idx = unmatchedExpected.findIndex(e => e.normalized === normAnswer)

    // Try partial match (answer contains expected or vice versa)
    if (idx === -1) {
      idx = unmatchedExpected.findIndex(e =>
        e.normalized.includes(normAnswer) || normAnswer.includes(e.normalized)
      )
    }

    // Try word overlap (at least 60% words match)
    if (idx === -1) {
      const answerWords = normAnswer.split(' ')
      idx = unmatchedExpected.findIndex(e => {
        const expectedWords = e.normalized.split(' ')
        const overlap = answerWords.filter(w => expectedWords.includes(w)).length
        return overlap >= Math.ceil(expectedWords.length * 0.6)
      })
    }

    if (idx !== -1) {
      matched.push(unmatchedExpected[idx])
      unmatchedExpected.splice(idx, 1)
    } else {
      extra.push(answer)
    }
  }

  return { matched, unmatched: unmatchedExpected, extra }
}

/**
 * Calculate weighted score based on frequency
 * High = 3 points, Medium = 2, Low = 1
 */
function calculateScore(matched, totalDiagnoses) {
  const weights = { high: 3, medium: 2, low: 1 }

  const totalWeight = totalDiagnoses.reduce((sum, d) => {
    const freq = d.frequency || 'medium'
    return sum + (weights[freq] || 2)
  }, 0)

  if (totalWeight === 0) return 0

  const earnedWeight = matched.reduce((sum, d) => {
    return sum + (weights[d.frequency] || 2)
  }, 0)

  return Math.round((earnedWeight / totalWeight) * 100)
}

/**
 * SM-2 Algorithm — update spaced repetition intervals
 * @param {Object} progress - current ApproachProgress document
 * @param {Number} quality - 0-5 rating (0=blackout, 5=perfect)
 * @returns {Object} updated fields for progress document
 */
function updateSM2(progress, quality) {
  let { easeFactor, interval, repetitions } = progress
  const now = new Date()

  if (quality < 3) {
    // Failed — reset to beginning
    repetitions = 0
    interval = 1
  } else if (quality === 3) {
    // Barely passed — keep same interval
    repetitions += 1
  } else {
    // quality 4-5 — success
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // Update ease factor
  easeFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  easeFactor = Math.max(1.3, easeFactor)

  const nextReviewAt = new Date(now.getTime() + interval * 86400 * 1000)

  // Determine mastery level
  let mastery = progress.mastery || 'new'
  const newCorrectAttempts = (progress.correctAttempts || 0) + (quality >= 3 ? 1 : 0)

  if (mastery === 'new') {
    mastery = 'learning'
  } else if (mastery === 'learning' && repetitions >= 3) {
    mastery = 'reviewing'
  } else if ((mastery === 'reviewing' || mastery === 'learning') && interval >= 21) {
    mastery = 'mastered'
  }

  // If failed, drop mastery back
  if (quality < 3) {
    if (mastery === 'mastered') mastery = 'reviewing'
    else if (mastery === 'reviewing') mastery = 'learning'
  }

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewAt,
    lastReviewedAt: now,
    mastery,
    correctAttempts: newCorrectAttempts
  }
}

module.exports = { fuzzyMatch, calculateScore, updateSM2, normalize }
