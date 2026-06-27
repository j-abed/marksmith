# Marksmith TODO

Tracked follow-ups for Marksmith. See [architecture.md](./architecture.md) for design context.

## Quick wins (done)

- [x] Replace / replace-all via CodeMirror search panel (`Edit → Replace…`, ⌘⌥F)
- [x] Save As HTML (`File → Save As HTML…`)
- [x] Mode dropdown (declutter header)
- [x] Undo / redo (⌘Z / ⌘⇧Z)
- [x] HTML import (open, paste, drag-drop) with Markdown as canonical source
- [x] HTML + Compare editor modes
- [x] Documented local development workflow (see [README](../README.md))

## Next up (polish)

- [x] Compare mode: “Apply HTML to Markdown” / “Sync from Markdown” actions
- [x] Recent documents: note when entry was imported from HTML
- [x] Keyboard shortcuts reference (`View` menu or help dialog)
- [x] Regenerate showcase screenshots after major UI changes (`npm run capture:showcase`) — includes Compare diff and Frontmatter panel shots
- [x] Install as app (PWA) — **View → Install app…** when the browser offers it

## Recently shipped

- [x] Smarter Compare diff (LCS line alignment + word-level inline highlights)
- [x] Mode memory per document (`marksmith:doc-modes` + recent entry `mode`)
- [x] Save linked file format detection (`.md` vs `.html` handle for ⌘S)
- [x] Frontmatter panel (title, tags, date from YAML header)
- [x] Title ↔ frontmatter sync (YAML `title` on open; top bar updates existing YAML)
- [x] Compare mode auto-sync toggle (inspect diffs without silent round-trip)
- [x] Per-document sidebar restore (outline/frontmatter tab + open state)
- [x] Native desktop wrapper (Tauri) — `.md` / `.html` file associations, Open With (cold + warm), native dialogs, draft → Recent ([docs/TAURI.md](./TAURI.md))

## Medium term

- [ ] Desktop polish — window title from filename, native macOS menu bar

## Long term

- [ ] Full WYSIWYG / rich-text mode ([Milkdown](https://milkdown.dev/) or similar) — Markdown round-trip
- [ ] Multi-document workspace (tabs or sidebar library)
- [ ] Plugin / extension model (custom renderers, linters)
- [ ] Collaboration, Git integration (explicitly out of scope for early milestones)

## Running locally

**Requirements:** Node.js 18+ and npm.

```bash
git clone https://github.com/j-abed/marksmith.git
cd marksmith
npm install
npm run dev
```

Open **http://127.0.0.1:5173** in your browser.

Other useful commands:

| Command | Purpose |
|---------|---------|
| `npm run preview` | Serve production build at **http://127.0.0.1:4173** |
| `npm run build:pages` | Build the GitHub Pages bundle into `docs/app/` |
| `npx serve docs` | Preview showcase + app at `http://localhost:3000/` |
| `npm run test:all` | Unit + end-to-end tests |
| `npm run tauri:dev` | Native desktop development (requires Rust; see [TAURI.md](./TAURI.md)) |
| `npm run tauri:build` | Production desktop bundle |

No API keys or backend are required — the app runs entirely in the browser (or in the Tauri shell for desktop builds).

See [PUBLISHING.md](./PUBLISHING.md) for GitHub Pages setup and [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow.

### Install as an app (stay local permanently)

**PWA (browser):** install from a production build to your dock, taskbar, or home screen:

```bash
npm run build
npm run preview
```

Open **http://127.0.0.1:4173**, then **View → Install app…** (Chrome/Edge) or **Add to Dock** (Safari on macOS). Offline shell after first load; same local-only editing.

**Native desktop (Tauri):** for Finder **Open With**, file associations, and native save dialogs — see [TAURI.md](./TAURI.md) (`npm run tauri:build`). The React editor is unchanged; only the shell differs from the PWA.
