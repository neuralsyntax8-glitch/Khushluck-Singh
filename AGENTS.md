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
| `assets/` | Profile photo, certificate images (PNG/JPEG files) |
| `scripts/sync-certs.py` | Python script — downloads Drive images via gdown and updates certificates.json |
| `.github/workflows/sync-drive.yml` | GitHub Actions — runs sync every 6 hours |
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to `main` |

## Key details
- **Contact form** submits to FormInit.com (`https://forminit.com/f/q07fxftnwvs`)
- **Certificates** stored in `data/certificates.json` — auto-synced from Drive via GitHub Actions 
- **Scroll animations** use a custom `IntersectionObserver` for `.reveal` elements
- All styling is inline Tailwind utility classes or `<style>` block — no CSS files

## Auto-sync setup (GitHub Actions — no API keys needed)
Drive folder is public, so the sync runs entirely in GitHub Actions:

1. **Script:** `scripts/sync-certs.py` downloads images via `gdown` and updates `certificates.json`
2. **Workflow:** `.github/workflows/sync-drive.yml` runs every 6 hours or on manual trigger
3. New images in the Drive folder are automatically detected, downloaded, and committed
4. The existing deploy workflow `.github/workflows/deploy.yml` redeploys on push

### Manual trigger
Go to repo → Actions → **Sync Certificates from Drive** → **Run workflow**
