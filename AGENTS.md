# AGENTS.md — Portfolio

## Overview
Static portfolio (vanilla HTML/CSS/JS). Tailwind CSS v4 loaded via CDN. No build step, no package manager, no tests.

## Dev commands
- **Preview:** Open `index.html` with Live Server (VS Code extension) — port 5501 (`.vscode/settings.json`)
- No install, lint, typecheck, or test commands exist

## Structure
| Path | Purpose |
|---|---|
| `index.html` | Entire single-page portfolio — 9 sections + modal |
| `data/certificates.json` | Certificate data — loaded dynamically by `index.html` |
| `assets/` | Profile photo, certificate images (PNG/JPEG files) |
| `scripts/sync-certs.py` | Python script — downloads Drive images via gdown and updates certificates.json |
| `.github/workflows/sync-drive.yml` | GitHub Actions — runs sync every 6 hours |
| `.github/workflows/deploy.yml` | GitHub Pages deploy on push to `main` |

## Sections (in order)
1. **Navbar** — Glassmorphism sticky nav with mobile hamburger menu
2. **Hero** — Headline, trust strip (projects/certs/AI/YouTube counts), CTAs
3. **About** — First-person narrative: how Neural Syntax started
4. **Featured Project** — Featured card with description, tech stack, links
5. **Projects Grid** — 3 project cards with descriptions and links
6. **Skills** — Categorized cards (Languages, AI & Data, Web Development, Tools)
7. **Certificate Vault** — Search, sort, filter by category, modal preview, count summary
8. **YouTube** — Neural Syntax channel presentation with topic cards
9. **Timeline** — Vertical timeline: 2023→2024→2025→2026
10. **Achievements** — Statistics grid (projects, certs, channel, automations)
11. **Contact** — Availability badges, FormInit form with subject field
12. **Footer** — Credit line

## Key details
- **Brand positioning:** Young AI Builder, Developer & Tech Educator (not "student portfolio")
- **Contact form** submits to FormInit.com (`https://forminit.com/f/q07fxftnwvs`)
- **Certificates** stored in `data/certificates.json` — auto-synced from Drive via GitHub Actions
- **Scroll animations** use a custom `IntersectionObserver` for `.reveal` elements
- **SEO** includes Open Graph, Twitter Cards, and Schema.org Person markup

## Auto-sync setup (GitHub Actions — no API keys needed)
Drive folder is public, so the sync runs entirely in GitHub Actions:

1. **Script:** `scripts/sync-certs.py` downloads images via `gdown` and updates `certificates.json`
2. **Workflow:** `.github/workflows/sync-drive.yml` runs every 6 hours or on manual trigger
3. New images in the Drive folder are automatically detected, downloaded, and committed
4. The existing deploy workflow `.github/workflows/deploy.yml` redeploys on push

### Manual trigger
Go to repo → Actions → **Sync Certificates from Drive** → **Run workflow**
