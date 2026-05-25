# AGENTS.md — Portfolio

## Overview
Single-file static portfolio (vanilla HTML/CSS/JS). Tailwind CSS v4 loaded via CDN. No build step, no package manager, no tests, no CI.

## Dev commands
- **Preview:** Open `index.html` with Live Server (VS Code extension) — configured for port 5501 (`.vscode/settings.json`)
- No install, lint, typecheck, or test commands exist

## Structure
| Path | Purpose |
|---|---|
| `index.html` | Entire app — hero, about, skills, projects, certifications, YouTube, contact form |
| `assets/` | Profile photo, certificate images, etc. (11 PNG/JPEG files) |

## Key details
- **Contact form** submits to FormInit.com (`https://forminit.com/f/q07fxftnwvs`)
- **Certificates** are stored as a JS array in `index.html` — add new entries to the `certificates` array and place the image in `assets/`
- **Scroll animations** use a custom `IntersectionObserver` for `.reveal` elements
- All styling is inline Tailwind utility classes or `<style>` block — no CSS files
