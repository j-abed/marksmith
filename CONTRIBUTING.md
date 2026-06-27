# Contributing to Marksmith

Thank you for helping improve Marksmith. This project is maintained as an open-source, local-first Markdown editor — contributions that preserve **Markdown as canonical state** and **client-side privacy** are especially welcome.

## Getting started

**Requirements:** Node.js 18+ and npm.

```bash
git clone https://github.com/j-abed/marksmith.git
cd marksmith
npm install
npm run dev
```

Open **http://127.0.0.1:5173**.

For the **native desktop** shell, install [Rust](https://rustup.rs/) and run `npm run tauri:dev` — see [docs/TAURI.md](./docs/TAURI.md). Web-only changes do not require Rust.

Run the full test suite before opening a pull request:

```bash
npm run test:all
```

For UI changes that affect the landing page, regenerate showcase screenshots:

```bash
npm run capture:showcase
```

## How to contribute

1. **Check existing issues** — or open one to discuss larger changes before coding.
2. **Fork and branch** — use a descriptive branch name (`fix/compare-scroll`, `docs/publishing`).
3. **Keep changes focused** — one logical change per pull request when possible.
4. **Match project conventions** — read [docs/architecture.md](./docs/architecture.md) for invariants (especially preview vs. canonical Markdown).
5. **Add or update tests** — unit tests for logic; Playwright for user-visible flows when behavior changes.
6. **Update docs** — README, architecture, or TODO when you add features or change workflows.

## Design invariants

Please preserve these unless an issue explicitly proposes changing them:

- **`MarkdownDocument.markdown` is canonical** — preview HTML is derived and sanitized.
- **HTML import converts to Markdown** before entering editor state.
- **No backend required** — features should work offline in the browser after load.
- **Security** — rendered and exported HTML passes through `rehype-sanitize`.

## Pull requests

- Fill out the PR template.
- Ensure `npm run test:all` passes locally.
- CI must pass before merge.
- Maintainers may request changes or squash commits on merge.

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Questions

Open a [GitHub Discussion](https://github.com/j-abed/marksmith/discussions) or an issue if you are unsure whether a change fits the project scope.
