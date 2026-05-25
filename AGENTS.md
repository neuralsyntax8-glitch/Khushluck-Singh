# AGENTS.md — Portfolio

## Overview
Static portfolio (vanilla HTML/CSS/JS). Tailwind CSS v4 loaded via CDN. No build step, no package manager, no tests.

## Dev commands
- **Preview:** Open `index.html` with Live Server (VS Code extension) — port 5501 (`.vscode/settings.json`)
- No install, lint, typecheck, or test commands exist

## Structure
| Path | Purpose |
|---|---|
| `index.html` | Entire app — hero, about, skills, projects, certifications, YouTube, contact form |
| `data/certificates.json` | Certificate data — loaded dynamically by `index.html` |
| `assets/` | Profile photo, certificate images (17 PNG/JPEG files) |
| `scripts/auto-sync.gs` | Google Apps Script for Drive-to-GitHub auto-sync |
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to `main` |

## Key details
- **Contact form** submits to FormInit.com (`https://forminit.com/f/q07fxftnwvs`)
- **Certificates** stored in `data/certificates.json` — add new entries there and place the image in `assets/`
- **Scroll animations** use a custom `IntersectionObserver` for `.reveal` elements
- All styling is inline Tailwind utility classes or `<style>` block — no CSS files

## Auto-sync setup (Google Apps Script)
To enable automatic cert sync from Google Drive:
1. Create a Drive folder for certificates
2. Set `DRIVE_FOLDER_ID` in `scripts/auto-sync.gs`
3. Add `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` to Script Properties
4. Create a time-driven trigger in Apps Script for `checkNewCertificates()`
5. Enable GitHub Pages in repo Settings → Pages (source: GitHub Actions)
