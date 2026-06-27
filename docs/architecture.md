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

Round-trip is not lossless. Compare mode highlights lines where rendered HTML differs from the current Markdown. Toolbar actions:

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

### Hybrid mode

Hybrid uses a CodeMirror `ViewPlugin` that walks the Lezer syntax tree and applies mark/replace decorations on headings, emphasis, links, lists, blockquotes, task lists, and fenced code. The document string is never modified.

## Persistence

- **Autosave:** debounced 500ms to `localStorage` (`marksmith:draft`) — includes document, mode, theme
- **Save / Save As:** `.md` via File System Access API or download; links file handle for ⌘S when supported
- **Save As HTML:** standalone HTML page (does not replace the linked `.md` handle)
- **Export:** Markdown, HTML, plain text, JSON from the Export menu
- **Recent documents:** up to 10 entries in `localStorage`

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
