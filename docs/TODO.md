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
- [x] Regenerate showcase screenshots after major UI changes (`npm run capture:showcase`)
- [x] Install as app (PWA) — **View → Install app…** when the browser offers it

## Recently shipped

- [x] Smarter Compare diff (LCS line alignment + word-level inline highlights)
- [x] Mode memory per document (`marksmith:doc-modes` + recent entry `mode`)
- [x] Save linked file format detection (`.md` vs `.html` handle for ⌘S)
- [x] Frontmatter panel (title, tags, date from YAML header)
- [x] Title ↔ frontmatter sync (YAML `title` on open; top bar updates existing YAML)
- [x] Compare mode auto-sync toggle (inspect diffs without silent round-trip)
- [x] Per-document sidebar restore (outline/frontmatter tab + open state)

## Medium term

- [ ] Native desktop wrapper (Tauri or Electron) for `.md` file associations and true dock icon without browser chrome

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

No API keys or backend are required — the app runs entirely in the browser.

See [PUBLISHING.md](./PUBLISHING.md) for GitHub Pages setup and [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow.

### Install as an app (stay local permanently)

You do **not** need a native rewrite to run Marksmith like a desktop app. The production build is a **Progressive Web App (PWA)** you can install to your dock, taskbar, or home screen:

```bash
npm run build
npm run preview
```

Open **http://127.0.0.1:4173**, then use **View → Install app…** (Chrome/Edge) or the browser’s **Install** / **Add to Dock** control (Safari on macOS).

What you get:

- Standalone window without browser tabs
- Offline shell after first load (cached assets)
- Same local-only editing — still no backend

What a PWA does **not** give you (yet): opening `.md` files from Finder by double-click, or a guaranteed menu-bar icon on every OS. For that, a future **[Tauri](https://tauri.app/)** or Electron wrapper is the natural next step — the editor itself stays the same web app.
