export function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

/** 0-based line indices in `actual` that differ from `expected`. */
export function computeDiffLineIndices(
  expected: string,
  actual: string,
): number[] {
  const a = splitLines(expected)
  const b = splitLines(actual)
  const max = Math.max(a.length, b.length)
  const diff: number[] = []

  for (let i = 0; i < max; i++) {
    if ((a[i] ?? '') !== (b[i] ?? '')) {
      diff.push(i)
    }
  }

  return diff
}

export function normalizeCompareText(text: string): string {
  return text.trim().replace(/\r\n/g, '\n')
}

export function textsEqual(a: string, b: string): boolean {
  return normalizeCompareText(a) === normalizeCompareText(b)
}
