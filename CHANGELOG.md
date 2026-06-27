# Changelog

All notable changes to Marksmith are documented here.

## [0.2.0] - 2026-06-26

### Added

- Smarter Compare diff (LCS line alignment + word-level highlights)
- Per-document mode memory and recent-entry mode restore
- Linked save format detection (`.md` vs `.html` for ⌘S)
- Frontmatter panel (YAML title, date, tags) in the document sidebar
- Bidirectional title ↔ frontmatter sync (YAML `title` on open; top bar updates existing YAML)
- Compare mode **Auto-sync HTML to Markdown** toggle (off by default)
- Per-document sidebar restore (outline/frontmatter tab + open state)
- Recent list **YAML metadata** hint

### Fixed

- Sidebar preference migration when renaming documents without a stored mode

[0.2.0]: https://github.com/j-abed/marksmith/compare/v0.1.0...v0.2.0
