import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view'

const diffLineMark = Decoration.line({ class: 'compare-diff-line' })

export const setHtmlDiffLines = StateEffect.define<number[]>()

function buildDiffDecorations(doc: { lines: number; line: (n: number) => { from: number; to: number } }, lineIndices: number[]): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()

  for (const index of lineIndices) {
    const lineNumber = index + 1
    if (lineNumber < 1 || lineNumber > doc.lines) continue
    const line = doc.line(lineNumber)
    builder.add(line.from, line.from, diffLineMark)
  }

  return builder.finish()
}

const htmlDiffField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHtmlDiffLines)) {
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

export function applyHtmlDiffLines(view: EditorView, lineIndices: number[]): void {
  view.dispatch({ effects: setHtmlDiffLines.of(lineIndices) })
}
