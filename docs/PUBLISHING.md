# Publishing Marksmith

Checklist for first-time open-source publication to GitHub Pages.

## Repository setup

1. **Create the GitHub repository** (if it does not exist yet):

   ```bash
   gh repo create marksmith --public --source=. --remote=origin \
     --description "Local-first Markdown editor — Markdown is canonical"
   ```

   Or create [j-abed/marksmith](https://github.com/new) manually with name `marksmith`.

2. **Initialize git** (if this folder is not already a repo):

   ```bash
   cd marksmith
   git init
   git branch -M main
   git add .
   git commit -m "Initial public release of Marksmith"
   git remote add origin git@github.com:j-abed/marksmith.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**

   - Repository **Settings → Pages**
   - **Build and deployment → Source:** GitHub Actions
   - On push to `main`, the [Deploy GitHub Pages](../.github/workflows/deploy-pages.yml) workflow builds `docs/app/` and publishes `docs/` as the site root.

4. **Enable Discussions** (optional, recommended for OSS)

   - **Settings → General → Features → Discussions**

## Live URLs

After the first successful deploy:

| Page | URL |
|------|-----|
| Showcase (landing) | https://j-abed.github.io/marksmith/ |
| Editor (app) | https://j-abed.github.io/marksmith/app/ |

The editor is installable as a PWA from the production URL (**View → Install app…**).

## Verify locally before pushing

```bash
npm run test:all
npm run build:pages
npx serve docs
```

- Showcase: http://localhost:3000/
- App: http://localhost:3000/app/

Production preview (PWA install testing):

```bash
npm run build
npm run preview
```

Open **http://127.0.0.1:4173** — then **View → Install app…**.

## Regenerate showcase screenshots

After UI changes:

```bash
npm run capture:showcase
git add docs/assets/
git commit -m "Update showcase screenshots"
```

## Ongoing maintenance

- **CI** (`.github/workflows/ci.yml`) — unit + e2e on every PR and push to `main`
- **Pages deploy** — runs tests, builds app, deploys on push to `main`
- **Contributing** — see [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Roadmap** — [docs/TODO.md](./TODO.md)

## Custom domain (optional)

Add a `CNAME` file under `docs/` and configure DNS in GitHub Pages settings. Update `homepage` in `package.json` if you change the public URL.
