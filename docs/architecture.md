# Marksmith Architecture

## Canonical state

**Markdown text is the only source of truth.** The app stores a `MarkdownDocument` whose `markdown` field is the sole mutable document content. Preview HTML, word counts, and outlines are always derived — never written back into document state unless the user explicitly edits HTML (which round-trips through `htmlToMarkdown`).

```ts
type MarkdownDocument = {
  id: string
  title: string
  markdown: string   // canonical
  dirty: boolean
  lastSavedAt?: string
  updatedAt: string
}
```

## Rendering pipeline (Markdown → HTML)

```
Markdown string
  → remark-parse + remark-gfm
  → remarkSourceLine (preview block navigation)
  → remark-rehype (allowDangerousHtml: false)
  → rehype-highlight
  → rehype-sanitize
  → rehype-react (preview) | rehype-stringify (export / HTML modes)
```

Preview renders as React elements via `rehype-react`. No unsanitized `dangerouslySetInnerHTML` is used.

## Import pipeline (HTML → Markdown)

Used when opening `.html` files, pasting `text/html` from the clipboard, or editing in HTML / Compare modes:

```
HTML string
  → isLikelyHtml (heuristic)
  → rehype-parse
  → rehype-remark + remark-gfm
  → remark-stringify
  → Markdown (canonical)
```

Round-trip is not lossless. Compare mode aligns expected vs. actual HTML with **LCS line matching**, then highlights:

- **Inserted lines** — full-line marks on the HTML pane (`.compare-diff-line`)
- **Changed lines** — word/token-level inline marks when a single-line edit is detected (`.compare-diff-word`)

The toolbar hint summarizes line and word counts (e.g. “3 words differ on 1 HTML line”). **Auto-sync HTML to Markdown** is off by default in Compare mode so you can inspect drift; enable it to round-trip HTML edits into canonical Markdown (same debounced behavior as HTML mode).

Toolbar actions:

- **Sync HTML from Markdown** — discard HTML pane edits and regenerate from Markdown
- **Apply HTML to Markdown** — convert the HTML pane to canonical Markdown immediately

## Editor modes

| Mode | Implementation |
|------|----------------|
| Raw | CodeMirror 6 + `@codemirror/lang-markdown` |
| Preview | Sanitized `rehype-react` output |
| Split | Raw editor + live preview, scroll sync, resizable panes |
| Hybrid | CodeMirror + view-only decorations that soften syntax |
| HTML | CodeMirror + `@codemirror/lang-html`; edits sync to Markdown |
| Compare | Markdown + HTML side by side, diff highlight, scroll sync |

Mode switching is in the **Mode** dropdown (top bar). Markdown is preserved when changing modes.

**Per-document mode memory:** the last mode for each document is stored in `localStorage` (`marksmith:doc-modes`), keyed by `file:{sourceName}` for file-backed docs or `title:{title}` for untitled in-memory docs. Recent-document entries also store `mode`. Opening a file, reopening from **File → Recent**, or starting a new Untitled doc restores the saved mode. Renaming an untitled doc or **Save As** migrates the stored key.

**Title ↔ frontmatter:** when a document has a YAML header with `title:`, that value becomes the document title on open. Editing the top-bar title updates `title:` in an existing YAML block.

### Hybrid mode

Hybrid uses a CodeMirror `ViewPlugin` that walks the Lezer syntax tree and applies mark/replace decorations on headings, emphasis, links, lists, blockquotes, task lists, and fenced code. The document string is never modified.

## Persistence

- **Autosave:** debounced 500ms to `localStorage` (`marksmith:draft`) — all open tabs, active tab id, and theme
- **Per-document modes:** `marksmith:doc-modes` map (see Editor modes above)
- **Save / Save As:** `.md` via File System Access API, Tauri native dialogs, or download; links file handle or path for ⌘S when supported
- **Linked file format:** ⌘S writes Markdown to `.md` handles and rendered HTML to `.html` handles (detected from the linked filename)
- **Save As HTML:** standalone HTML page; links the handle so subsequent ⌘S updates the HTML file
- **Export:** Markdown, HTML, plain text, JSON from the Export menu
- **Recent documents:** up to 10 entries in `localStorage` (title, markdown snapshot, optional `sourceName`, `importedFromHtml`, `mode`)

## Multi-document tabs

The workspace holds up to **20** open tabs. Each tab has its own `MarkdownDocument`, editor mode, linked file (path or browser handle), and discard baseline.

```
AppState
  tabs: DocumentTab[]
  activeTabId: string
  theme, zenMode

DocumentTab
  document: MarkdownDocument
  mode, saveStatus
  sourceName?, linkedPath?
  baseline: { title, markdown }   // revert target on discard
```

- **File → New** (⌘N) and **+** add a tab; **Open / Recent / drag-drop** open in a new tab unless that file is already open (then focus the existing tab).
- **Switch / close** with unsaved edits prompts **Keep editing** or **Discard changes** — discard reverts the tab to its baseline (last save, open, or autosave commit).
- Browser file handles are not restored after reload; Tauri `linkedPath` is restored from the draft. Content still reloads from `marksmith:draft`.

## Document sidebar

**View → Show outline** and **View → Show frontmatter** open a tabbed sidebar:

- **Outline** — jump to headings in the editor or preview
- **Frontmatter** — edit YAML `title`, `date`, and `tags` at the top of the Markdown file (written back into canonical `markdown` on blur)

Per-document sidebar state (`marksmith:doc-sidebar`) restores which tab was open. Documents with YAML metadata open the frontmatter tab by default when no prior preference exists.

## Search & editing

- Find: ⌘F — CodeMirror search panel
- Replace / replace all: ⌘⌥F or **Edit → Replace…** — same panel, replace field focused
- Undo / redo: ⌘Z / ⌘⇧Z — CodeMirror history
- Shortcut reference: **View → Keyboard shortcuts…** or ⌘/

## Security

All rendered and exported HTML passes through `rehype-sanitize`. HTML import converts to Markdown before entering the editor.

## Future work

See [TODO.md](./TODO.md). The leading candidate for a full WYSIWYG mode is **Milkdown** (ProseMirror-based, Markdown-first).

## Open source

Marksmith is MIT-licensed. See the repository [README](../README.md), [CONTRIBUTING.md](../CONTRIBUTING.md), and [PUBLISHING.md](./PUBLISHING.md).

## Running locally

See [README](../README.md#run-locally) and [TODO.md](./TODO.md#running-locally). From the repo root:

```bash
npm install && npm run dev
```

Then open http://127.0.0.1:5173.

Production preview (PWA install): `npm run build && npm run preview` → http://127.0.0.1:4173
