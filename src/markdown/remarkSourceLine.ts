import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'blockquote',
  'list',
  'code',
  'table',
  'thematicBreak',
])

/** Adds data-source-line to block nodes so split view can sync scroll position. */
export function remarkSourceLine() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (!BLOCK_TYPES.has(node.type)) return
      const line = node.position?.start?.line
      if (!line) return

      const data = node.data ?? (node.data = {})
      const hProperties =
        (data.hProperties as Record<string, unknown> | undefined) ??
        (data.hProperties = {})
      hProperties['id'] = `src-line-${line}`
    })
  }
}
