export type SourceAnchor = {
  line: number
  offsetTop: number
}

export type ScrollPane = 'editor' | 'preview'

const SOURCE_LINE_PREFIX = 'src-line-'
const SANITIZED_ID_PREFIX = 'user-content-src-line-'
const SYNC_ATTR = 'data-scroll-syncing'

export function parseSourceLineId(id: string): number | null {
  const raw = id.startsWith(SANITIZED_ID_PREFIX)
    ? id.slice(SANITIZED_ID_PREFIX.length)
    : id.startsWith(SOURCE_LINE_PREFIX)
      ? id.slice(SOURCE_LINE_PREFIX.length)
      : null
  if (raw === null) return null
  const line = Number(raw)
  return Number.isNaN(line) ? null : line
}

export function elementOffsetInContainer(
  el: HTMLElement,
  container: HTMLElement,
): number {
  const elRect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return elRect.top - containerRect.top + container.scrollTop
}

export function collectSourceAnchors(container: HTMLElement): SourceAnchor[] {
  const content = container.querySelector('.preview-content')
  if (!content) return []

  const seen = new Set<number>()
  const anchors: SourceAnchor[] = []

  for (const el of content.querySelectorAll<HTMLElement>('[id*="src-line-"]')) {
    const line = parseSourceLineId(el.id)
    if (line === null || seen.has(line)) continue
    seen.add(line)
    anchors.push({
      line,
      offsetTop: elementOffsetInContainer(el, container),
    })
  }

  return anchors.sort((a, b) => a.line - b.line)
}

export function ratioScrollTop(
  sourceScrollTop: number,
  sourceScrollHeight: number,
  sourceClientHeight: number,
  targetScrollHeight: number,
  targetClientHeight: number,
): number {
  const sourceMax = Math.max(0, sourceScrollHeight - sourceClientHeight)
  const targetMax = Math.max(0, targetScrollHeight - targetClientHeight)
  if (sourceMax <= 0) return 0
  const ratio = sourceScrollTop / sourceMax
  return ratio * targetMax
}

export function scrollRatio(el: HTMLElement): number {
  const max = Math.max(0, el.scrollHeight - el.clientHeight)
  if (max <= 0) return 0
  return el.scrollTop / max
}

function isSyncing(el: HTMLElement): boolean {
  return el.getAttribute(SYNC_ATTR) === 'true'
}

function setScrollTopProgrammatic(el: HTMLElement, top: number): void {
  el.setAttribute(SYNC_ATTR, 'true')
  el.scrollTop = top
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.removeAttribute(SYNC_ATTR)
    })
  })
}

export function syncScrollByRatio(
  source: HTMLElement,
  target: HTMLElement,
): number {
  const next = ratioScrollTop(
    source.scrollTop,
    source.scrollHeight,
    source.clientHeight,
    target.scrollHeight,
    target.clientHeight,
  )
  setScrollTopProgrammatic(target, next)
  return next
}

export function getEditorSourceLine(view: {
  scrollDOM: { scrollTop: number }
  lineBlockAtHeight: (height: number) => { from: number }
  state: { doc: { lineAt: (pos: number) => { number: number } } }
}): number {
  const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop + 4)
  return view.state.doc.lineAt(block.from).number
}

export function scrollEditorToLine(
  view: {
    scrollDOM: HTMLElement
    coordsAtPos: (
      pos: number,
      side?: -1 | 1,
    ) => { top: number; bottom: number } | null
    state: { doc: { line: (n: number) => { from: number; number: number }; lines: number } }
  },
  line: number,
  padding = 12,
): void {
  const clamped = Math.min(Math.max(1, line), view.state.doc.lines)
  const coords = view.coordsAtPos(view.state.doc.line(clamped).from, -1)
  if (!coords) return

  const scrollerRect = view.scrollDOM.getBoundingClientRect()
  const lineTopInScroller =
    coords.top - scrollerRect.top + view.scrollDOM.scrollTop
  setScrollTopProgrammatic(
    view.scrollDOM,
    Math.max(0, lineTopInScroller - padding),
  )
}

export function computePreviewScrollTop(
  anchors: SourceAnchor[],
  sourceLine: number,
  container: HTMLElement,
  padding = 12,
): number {
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
  if (anchors.length === 0) return 0

  let target = anchors[0]!
  for (const anchor of anchors) {
    if (anchor.line <= sourceLine) target = anchor
    else break
  }

  const targetIndex = anchors.indexOf(target)
  const next = anchors[targetIndex + 1]
  let scrollTop = target.offsetTop

  if (next && next.line > target.line) {
    const progress = (sourceLine - target.line) / (next.line - target.line)
    const clamped = Math.min(1, Math.max(0, progress))
    scrollTop += (next.offsetTop - target.offsetTop) * clamped
  } else if (sourceLine > target.line) {
    return maxScroll
  }

  return Math.min(maxScroll, Math.max(0, scrollTop - padding))
}

export function scrollPreviewToLine(
  container: HTMLElement,
  line: number,
  anchors: SourceAnchor[],
): void {
  setScrollTopProgrammatic(
    container,
    computePreviewScrollTop(anchors, line, container),
  )
}

export function createSplitScrollSync() {
  function onEditorScroll(
    editorEl: HTMLElement,
    previewEl: HTMLElement,
    enabled: boolean,
  ): void {
    if (!enabled || isSyncing(editorEl)) return
    syncScrollByRatio(editorEl, previewEl)
  }

  function onPreviewScroll(
    editorEl: HTMLElement,
    previewEl: HTMLElement,
    enabled: boolean,
  ): void {
    if (!enabled || isSyncing(previewEl)) return
    syncScrollByRatio(previewEl, editorEl)
  }

  return { onEditorScroll, onPreviewScroll }
}
