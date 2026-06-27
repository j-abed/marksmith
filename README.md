# Marksmith

[![CI](https://github.com/j-abed/marksmith/actions/workflows/ci.yml/badge.svg)](https://github.com/j-abed/marksmith/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A **local-first** Markdown editor where **Markdown is the canonical source of truth**. Edit in Raw, Preview, Split, Hybrid, HTML, or Compare modes — with HTML import for LLM output and paste workflows.

**[Try the live demo](https://j-abed.github.io/marksmith/app/)** · **[Showcase](https://j-abed.github.io/marksmith/)** · **[Contributing](./CONTRIBUTING.md)**

## Why Marksmith

- **Your words stay on your device** — no account, no upload, no backend
- **Markdown is canonical** — preview HTML is derived and sanitized, never authoritative
- **Built for technical writing** — GFM, syntax highlighting, outline, find/replace, export
- **LLM-friendly** — import HTML, compare round-trip drift, sync HTML ↔ Markdown

## Run locally

**Requirements:** Node.js 18+ and npm.

```bash
git clone https://github.com/j-abed/marksmith.git
cd marksmith
npm install
npm run dev
```

Open **http://127.0.0.1:5173** in your browser.

### Install as an app

To keep Marksmith in your dock or home screen (without running `npm run dev` every time):

```bash
npm run build
npm run preview
```

Open **http://127.0.0.1:4173**, then **View → Install app…** (or your browser’s install prompt). The app works offline after the first load.

A full **native** desktop app (double-click `.md` files, system file associations) would need a thin wrapper such as Tauri — tracked in [docs/TODO.md](./docs/TODO.md).

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run preview` | Serve the production build locally (run `npm run build` first) |
| `npm run build` | Production build to `dist/` |
| `npm run build:pages` | Build app into `docs/app/` for GitHub Pages |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run test:all` | Unit + e2e |
| `npm run capture:showcase` | Regenerate landing-page screenshots |

### Preview the GitHub Pages site locally

```bash
npm run build:pages
npx serve docs
```

- Showcase: http://localhost:3000/
- App: http://localhost:3000/app/

## Features

- **Six editor modes:** Raw, Preview, Split, Hybrid, HTML (edit rendered HTML), Compare (Markdown ↔ HTML with diff)
- CodeMirror 6 editing with formatting toolbar, find/replace, undo/redo
- GitHub-Flavored Markdown preview with syntax highlighting and sanitization
- **HTML import:** open `.html`, paste from clipboard, drag-and-drop — converted to Markdown on import
- **Save As HTML:** standalone sanitized HTML page from current Markdown
- File System Access API (where supported) + download fallback; recent documents
- Autosave to `localStorage`, export as Markdown / HTML / plain text / JSON
- Resizable split/compare panes, scroll sync, outline sidebar, zen mode
- Light and dark themes
- **Installable PWA** — add to dock/home screen from a production build

## Docs

- [Architecture & design notes](./docs/architecture.md)
- [TODO / roadmap](./docs/TODO.md)
- [Publishing guide](./docs/PUBLISHING.md)

## Contributing

Marksmith is open source under the [MIT License](./LICENSE). We welcome bug reports, feature ideas, and pull requests.

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/architecture.md](./docs/architecture.md)
2. Fork the repo and create a branch
3. Run `npm run test:all` before opening a PR

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](./SECURITY.md).

## Deployment

The live demo is hosted on **GitHub Pages**. On push to `main`, CI runs tests and deploys the showcase plus app bundle from `docs/`.

See [docs/PUBLISHING.md](./docs/PUBLISHING.md) for the full first-time setup checklist.

## License

MIT © [Jason Abed](https://github.com/j-abed) and contributors. See [LICENSE](./LICENSE).
