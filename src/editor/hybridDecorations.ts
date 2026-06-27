import { syntaxTree } from '@codemirror/language'
import type { Range, Text } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
} from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import type { SyntaxNodeRef } from '@lezer/common'

class HiddenWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span')
    span.className = 'hybrid-hidden'
    span.textContent = ''
    return span
  }

  eq() {
    return true
  }
}

const hiddenWidget = new HiddenWidget()

function overlapsSelection(
  from: number,
  to: number,
  ranges: readonly { from: number; to: number }[],
): boolean {
  for (const range of ranges) {
    if (from < range.to && to > range.from) return true
  }
  return false
}

function hideRange(from: number, to: number): Range<Decoration> {
  return Decoration.replace({ widget: hiddenWidget, inclusive: false }).range(
    from,
    to,
  )
}

function markRange(from: number, to: number, className: string): Range<Decoration> {
  return Decoration.mark({ class: className }).range(from, to)
}

function slice(doc: Text, from: number, to: number): string {
  return doc.sliceString(from, to)
}

function hasAncestor(node: SyntaxNodeRef, name: string): boolean {
  for (let current = node.node.parent; current; current = current.parent) {
    if (current.name === name) return true
  }
  return false
}

function buildHybridDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = []
  const ranges = view.state.selection.ranges
  const doc = view.state.doc

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        const nodeFrom = node.from
        const nodeTo = node.to
        if (overlapsSelection(nodeFrom, nodeTo, ranges)) return

        switch (node.name) {
          case 'HeaderMark': {
            const line = doc.lineAt(nodeFrom)
            const level = nodeTo - nodeFrom
            decorations.push(
              hideRange(nodeFrom, nodeTo + 1),
              markRange(nodeTo + 1, line.to, `hybrid-heading hybrid-h${level}`),
            )
            break
          }
          case 'StrongEmphasis': {
            const open = slice(doc, nodeFrom, nodeFrom + 2)
            const close = slice(doc, nodeTo - 2, nodeTo)
            if (open === '**' && close === '**') {
              decorations.push(
                hideRange(nodeFrom, nodeFrom + 2),
                hideRange(nodeTo - 2, nodeTo),
                markRange(nodeFrom + 2, nodeTo - 2, 'hybrid-bold'),
              )
            }
            break
          }
          case 'Emphasis': {
            const open = slice(doc, nodeFrom, nodeFrom + 1)
            const close = slice(doc, nodeTo - 1, nodeTo)
            if (
              (open === '*' || open === '_') &&
              open === close &&
              nodeTo - nodeFrom > 2
            ) {
              decorations.push(
                hideRange(nodeFrom, nodeFrom + 1),
                hideRange(nodeTo - 1, nodeTo),
                markRange(nodeFrom + 1, nodeTo - 1, 'hybrid-italic'),
              )
            }
            break
          }
          case 'InlineCode': {
            decorations.push(
              hideRange(nodeFrom, nodeFrom + 1),
              hideRange(nodeTo - 1, nodeTo),
              markRange(nodeFrom + 1, nodeTo - 1, 'hybrid-code'),
            )
            break
          }
          case 'Link': {
            const label = node.node.getChild('LinkLabel')
            const url = node.node.getChild('URL')
            if (label) {
              decorations.push(
                hideRange(label.from, label.from + 1),
                hideRange(label.to - 1, label.to),
                markRange(label.from + 1, label.to - 1, 'hybrid-link'),
              )
            }
            if (url) {
              decorations.push(
                hideRange(url.from - 1, url.from),
                hideRange(url.to, url.to + 1),
              )
            }
            break
          }
          case 'QuoteMark':
            decorations.push(hideRange(nodeFrom, nodeTo))
            break
          case 'Paragraph':
            if (hasAncestor(node, 'Blockquote')) {
              decorations.push(markRange(nodeFrom, nodeTo, 'hybrid-blockquote'))
            }
            break
          case 'ListMark':
          case 'TaskMarker':
            decorations.push(hideRange(nodeFrom, nodeTo))
            break
          case 'ListItem': {
            const marker = node.node.getChild('TaskMarker')
            const className = marker
              ? slice(doc, marker.from, marker.to).includes('x')
                ? 'hybrid-list-item hybrid-list-item--done'
                : 'hybrid-list-item hybrid-list-item--task'
              : 'hybrid-list-item'
            decorations.push(markRange(nodeFrom, nodeTo, className))
            break
          }
          case 'CodeMark':
          case 'CodeInfo':
            decorations.push(hideRange(nodeFrom, nodeTo))
            break
          case 'CodeText':
            decorations.push(markRange(nodeFrom, nodeTo, 'hybrid-code-block'))
            break
          default:
            break
        }
      },
    })
  }

  return Decoration.set(decorations, true)
}

export const hybridDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildHybridDecorations(view)
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = buildHybridDecorations(update.view)
      }
    }
  },
  { decorations: (v) => v.decorations },
)
