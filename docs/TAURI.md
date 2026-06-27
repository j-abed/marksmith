# Marksmith Desktop (Tauri)

Native desktop wrapper for Marksmith using [Tauri 2](https://v2.tauri.app/). The React editor is unchanged; Tauri adds a native window, file dialogs, and `.md` file associations.

## Prerequisites

1. **Node.js 18+** and npm (same as the web app)
2. **Rust** — install via [rustup](https://rustup.rs/):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. **macOS** — Xcode Command Line Tools (`xcode-select --install`)

Windows and Linux builds use the same `tauri:dev` / `tauri:build` commands; file-association behavior is platform-specific (see [Tauri docs](https://v2.tauri.app/)).

## Development

```bash
npm install
source "$HOME/.cargo/env"   # after first rustup install; or restart your shell
npm run tauri:dev
```

If port 5173 is already in use, stop the other Vite dev server first.

This starts the Vite dev server and opens the Marksmith window. File → Open uses native dialogs; ⌘S saves to the linked path. Untitled documents autosave to **File → Recent** (status bar shows “Draft saved” vs “Saved to …” for linked files).

## Production build

```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/` (`.app` on macOS, `.dmg` when enabled).

## Icons

Regenerate app icons from `public/favicon.svg` (vector source avoids white fringe in raster PWA exports):

```bash
npm run tauri:icon
```

The script renders `public/favicon.svg` at ~80.5% on a 1024×1024 transparent canvas, then writes PNG/ICNS/ICO with Sharp and png2icons (avoids white halos from raster PWA exports and `tauri icon` resampling).

## File associations

Registered extensions (see `src-tauri/tauri.conf.json`):

- `.md`, `.markdown` — Markdown
- `.txt` — plain text
- `.html`, `.htm` — HTML (imported to Markdown)

- Double-clicking or **Open With** opens the file in the running app (or launches Marksmith if it is not running).
- macOS delivers Finder opens via `RunEvent::Opened`; paths are queued in Rust and delivered on the `open-files` event, with a focus-time poll as fallback.
- **Single instance (Windows/Linux):** `tauri-plugin-single-instance` routes a second launch to the running window. On **macOS**, the same `.app` bundle is reused via `RunEvent::Opened` — the plugin is disabled there.

## Troubleshooting (macOS)

### Two dock icons / a second Marksmith opens

Usually you have **two different builds** registered at once, for example:

- `npm run tauri:dev` (debug binary in `src-tauri/target/debug/`)
- **and** an installed `Marksmith.app` from `npm run tauri:build`

Finder’s **Open With** may launch the other build. They share a name but are separate apps, so single-instance does not apply and icons can differ (debug often uses an older or unpadded icon).

**Fix:**

1. Quit every Marksmith (`⌘Q` on each, or Activity Monitor).
2. For **Open With** testing, use **only** the release app:
   ```bash
   npm run tauri:icon && npm run tauri:build
   open src-tauri/target/release/bundle/macos/Marksmith.app
   ```
3. Do not run `tauri:dev` at the same time.
4. Copy the release `.app` to `/Applications` and remove older Marksmith copies if you have them.

### Wrong / oversized dock icon

Regenerate icons (`npm run tauri:icon`) and rebuild. The debug dev binary may still look different from the bundled `.app` — use the release bundle for a true icon check.

## Architecture

| Layer | Role |
|-------|------|
| `src/` | React editor (unchanged for web) |
| `src/documents/desktopFileAccess.ts` | Tauri dialog + fs read/write |
| `src/platform/desktop.ts` | `isTauri()` detection |
| `src/platform/tauriFileOpens.ts` | Cold-start poll + `open-files` listener + focus fallback |
| `src/platform/useTauriOpenFiles.ts` | React hook wiring into `AppProvider` |
| `src-tauri/` | Rust shell, plugins, bundle config |

Web builds ignore Tauri code paths (`isTauri()` is false in the browser). The PWA install prompt is hidden in the desktop shell.
