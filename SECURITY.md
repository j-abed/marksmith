# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a vulnerability

If you discover a security issue in Marksmith, please **do not** open a public GitHub issue.

Instead, report it privately:

1. [Open a GitHub Security Advisory](https://github.com/j-abed/marksmith/security/advisories/new) on this repository, or
2. Email the maintainer via GitHub (`j-abed`) with details and steps to reproduce.

We aim to acknowledge reports within a few days and will work with you on a fix and coordinated disclosure when appropriate.

## Scope notes

Marksmith runs entirely in the browser. Typical concerns include:

- **XSS via Markdown/HTML rendering** — preview and export use `rehype-sanitize`; reports about bypasses are in scope.
- **HTML import** — untrusted HTML is converted to Markdown; issues where script or unsafe content reaches the DOM without sanitization are in scope.
- **Local storage** — data stays on the user's device; we do not operate a backend that stores documents.

Out of scope: vulnerabilities in third-party dependencies without a demonstrable impact on Marksmith, or issues that require physical access to an unlocked machine.
