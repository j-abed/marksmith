export function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

type LineAlignOp =
  | { kind: 'equal'; ai: number; bi: number }
  | { kind: 'insert'; bi: number }
  | { kind: 'delete'; ai: number }
  | { kind: 'change'; ai: number; bi: number }

export type CompareWordSpan = {
  line: number
  from: number
  to: number
}

export type CompareDiffResult = {
  /** Full-line highlights on the actual (HTML) side. */
  fullLines: number[]
  /** Inline word/char spans on changed lines. */
  wordSpans: CompareWordSpan[]
  /** Distinct actual line indices with any highlight. */
  touchedLines: number[]
}

function buildLcsTable(a: string[], b: string[]): number[][] {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

function alignLines(a: string[], b: string[]): LineAlignOp[] {
  const dp = buildLcsTable(a, b)
  const raw: Array<
    | { kind: 'equal'; ai: number; bi: number }
    | { kind: 'insert'; bi: number }
    | { kind: 'delete'; ai: number }
  > = []

  let i = a.length
  let j = b.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      raw.unshift({ kind: 'equal', ai: i - 1, bi: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.unshift({ kind: 'insert', bi: j - 1 })
      j--
    } else {
      raw.unshift({ kind: 'delete', ai: i - 1 })
      i--
    }
  }

  const merged: LineAlignOp[] = []
  for (let k = 0; k < raw.length; k++) {
    const op = raw[k]
    const next = raw[k + 1]
    if (op.kind === 'delete' && next?.kind === 'insert') {
      merged.push({ kind: 'change', ai: op.ai, bi: next.bi })
      k++
    } else {
      merged.push(op)
    }
  }

  return merged
}

function tokenize(line: string): Array<{ text: string; start: number; end: number }> {
  const tokens: Array<{ text: string; start: number; end: number }> = []
  const re = /\s+|[^\s]+/g
  let match = re.exec(line)
  while (match) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length })
    match = re.exec(line)
  }
  if (tokens.length === 0 && line.length > 0) {
    tokens.push({ text: line, start: 0, end: line.length })
  }
  return tokens
}

function diffWordSpansInLine(expected: string, actual: string): CompareWordSpan[] {
  if (expected === actual) return []

  const aTokens = tokenize(expected)
  const bTokens = tokenize(actual)
  if (aTokens.length === 0) {
    return actual.trim()
      ? [{ line: 0, from: 0, to: actual.length }]
      : []
  }

  const n = aTokens.length
  const m = bTokens.length
  const dp = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (aTokens[i - 1].text === bTokens[j - 1].text) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const changed = new Set<number>()
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aTokens[i - 1].text === bTokens[j - 1].text) {
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changed.add(j - 1)
      j--
    } else {
      i--
    }
  }

  const spans: CompareWordSpan[] = []
  for (const index of changed) {
    const token = bTokens[index]
    spans.push({ line: 0, from: token.start, to: token.end })
  }

  return spans
}

/** Line + word diff between expected and actual HTML (actual = HTML pane). */
export function computeCompareDiff(
  expected: string,
  actual: string,
): CompareDiffResult {
  const aLines = splitLines(expected)
  const bLines = splitLines(actual)
  const ops = alignLines(aLines, bLines)

  const fullLines: number[] = []
  const wordSpans: CompareWordSpan[] = []
  const touched = new Set<number>()

  for (const op of ops) {
    if (op.kind === 'insert') {
      fullLines.push(op.bi)
      touched.add(op.bi)
    } else if (op.kind === 'change') {
      const spans = diffWordSpansInLine(aLines[op.ai], bLines[op.bi]).map(
        (span) => ({ ...span, line: op.bi }),
      )
      if (spans.length === 0) {
        fullLines.push(op.bi)
        touched.add(op.bi)
      } else {
        for (const span of spans) {
          wordSpans.push(span)
        }
        touched.add(op.bi)
      }
    }
  }

  return {
    fullLines,
    wordSpans,
    touchedLines: [...touched].sort((x, y) => x - y),
  }
}

/** @deprecated Use computeCompareDiff — kept for callers expecting line indices only. */
export function computeDiffLineIndices(
  expected: string,
  actual: string,
): number[] {
  return computeCompareDiff(expected, actual).touchedLines
}

export function normalizeCompareText(text: string): string {
  return text.trim().replace(/\r\n/g, '\n')
}

export function textsEqual(a: string, b: string): boolean {
  return normalizeCompareText(a) === normalizeCompareText(b)
}

export function formatCompareDiffHint(result: CompareDiffResult): string {
  const lineCount = result.touchedLines.length
  if (lineCount === 0) return 'HTML matches Markdown render'

  const wordCount = result.wordSpans.length
  if (wordCount > 0 && result.fullLines.length === 0) {
    return `${wordCount} word${wordCount === 1 ? ' differs' : 's differ'} on ${lineCount} HTML line${lineCount === 1 ? '' : 's'}`
  }
  if (wordCount > 0) {
    return `${lineCount} HTML line${lineCount === 1 ? ' differs' : 's differ'} (${wordCount} inline change${wordCount === 1 ? '' : 's'})`
  }
  return `${lineCount} HTML line${lineCount === 1 ? ' differs' : 's differ'} from Markdown render`
}
