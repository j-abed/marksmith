import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view'
import type { CompareDiffResult } from './compareDiff'

const diffLineMark = Decoration.line({ class: 'compare-diff-line' })
const diffWordMark = Decoration.mark({ class: 'compare-diff-word' })

export const setHtmlCompareDiff = StateEffect.define<CompareDiffResult>()

function buildDiffDecorations(
  doc: { lines: number; line: (n: number) => { from: number; to: number } },
  diff: CompareDiffResult,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const fullLineSet = new Set(diff.fullLines)
  const entries: Array<{ from: number; to: number; deco: Decoration }> = []

  for (const span of diff.wordSpans) {
    const lineNumber = span.line + 1
    if (lineNumber < 1 || lineNumber > doc.lines) continue
    if (fullLineSet.has(span.line)) continue
    const line = doc.line(lineNumber)
    const from = line.from + span.from
    const to = line.from + span.to
    if (from >= to || to > line.to) continue
    entries.push({ from, to, deco: diffWordMark })
  }

  for (const index of diff.fullLines) {
    const lineNumber = index + 1
    if (lineNumber < 1 || lineNumber > doc.lines) continue
    const line = doc.line(lineNumber)
    entries.push({ from: line.from, to: line.from, deco: diffLineMark })
  }

  entries.sort((a, b) => a.from - b.from || a.to - b.to)
  for (const entry of entries) {
    builder.add(entry.from, entry.to, entry.deco)
  }

  return builder.finish()
}

const htmlDiffField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHtmlCompareDiff)) {
        return buildDiffDecorations(tr.state.doc, effect.value)
      }
    }
    return decorations.map(tr.changes)
  },
  provide: (field) => EditorView.decorations.from(field),
})

export function htmlDiffExtension(): StateField<DecorationSet> {
  return htmlDiffField
}

export function applyHtmlCompareDiff(
  view: EditorView,
  diff: CompareDiffResult,
): void {
  view.dispatch({ effects: setHtmlCompareDiff.of(diff) })
}

/** @deprecated Use applyHtmlCompareDiff */
export function applyHtmlDiffLines(view: EditorView, lineIndices: number[]): void {
  applyHtmlCompareDiff(view, {
    fullLines: lineIndices,
    wordSpans: [],
    touchedLines: lineIndices,
  })
}

export const setHtmlDiffLines = StateEffect.define<number[]>()
