export interface KeywordMatchItem {
  id: string | number
  keywords: string[]
  [key: string]: unknown
}

export interface RecommendResult<T extends KeywordMatchItem> {
  item: T
  score: number
  matchedKeywords: string[]
}

export function tokenize(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

export function extractKeywords(text: string, maxCount: number = 10): string[] {
  const tokens = tokenize(text)
  if (tokens.length === 0) return []

  const freq = new Map<string, number>()
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1)
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word)
}

export function calcKeywordMatchScore(
  inputKeywords: string[],
  targetKeywords: string[]
): { score: number; matchedKeywords: string[] } {
  if (inputKeywords.length === 0 || targetKeywords.length === 0) {
    return { score: 0, matchedKeywords: [] }
  }

  const normalizedInput = inputKeywords.map((k) => k.toLowerCase())
  const normalizedTarget = targetKeywords.map((k) => k.toLowerCase())

  const matched: string[] = []
  let score = 0

  for (let i = 0; i < normalizedInput.length; i++) {
    const inputKw = normalizedInput[i]
    const inputWeight = normalizedInput.length - i

    for (let j = 0; j < normalizedTarget.length; j++) {
      const targetKw = normalizedTarget[j]
      const targetWeight = normalizedTarget.length - j

      if (inputKw === targetKw) {
        score += inputWeight * targetWeight * 2
        if (!matched.includes(targetKeywords[j])) {
          matched.push(targetKeywords[j])
        }
      } else if (targetKw.includes(inputKw) || inputKw.includes(targetKw)) {
        score += inputWeight * targetWeight
        if (!matched.includes(targetKeywords[j])) {
          matched.push(targetKeywords[j])
        }
      }
    }
  }

  const maxPossible =
    normalizedInput.length * normalizedTarget.length * 2 * normalizedInput.length
  const normalizedScore = maxPossible > 0 ? score / maxPossible : 0

  return {
    score: Number(normalizedScore.toFixed(4)),
    matchedKeywords: matched,
  }
}

export function recommend<T extends KeywordMatchItem>(
  items: T[],
  query: string | string[],
  topN: number = 10,
  minScore: number = 0
): RecommendResult<T>[] {
  const inputKeywords = Array.isArray(query) ? query : extractKeywords(query)
  if (inputKeywords.length === 0 || items.length === 0) return []

  const results: RecommendResult<T>[] = items
    .map((item) => {
      const { score, matchedKeywords } = calcKeywordMatchScore(
        inputKeywords,
        item.keywords
      )
      return { item, score, matchedKeywords }
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)

  return topN > 0 ? results.slice(0, topN) : results
}

export function calcSimilarity(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0

  const tokensA = tokenize(a)
  const tokensB = tokenize(b)

  if (tokensA.length === 0 && tokensB.length === 0) return 1
  if (tokensA.length === 0 || tokensB.length === 0) return 0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)

  let intersection = 0
  setA.forEach((t) => {
    if (setB.has(t)) intersection++
  })

  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}
