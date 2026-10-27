# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Offline-first PWA for kitchen recipes ("Rezepte"). Vanilla HTML/CSS/ES modules — no framework, no build step, no package.json, no test suite. All UI text, code comments and commit messages are in **German**.

Deployed via GitHub Pages from `main` (repo root): https://kessler-engineering.github.io/rezepte-app/ — every push to `main` goes live within about a minute, so `main` must always be working.

## Commands

```
python -m http.server 8000        # dev server → http://localhost:8000
```

Opening `index.html` via `file://` does not work (ES modules + service worker need http/localhost).

There are no automated tests in the repo. To verify changes in a browser, use Playwright (Python, `channel="chrome"` to use the installed Chrome) from a throwaway venv outside the repo. Plain `chrome --headless --screenshot/--dump-dom` is **not** usable: it snapshots before IndexedDB and module loading finish, so the page always looks empty.

## Architecture

- **Routing** (`js/app.js`): hash router. `#/` list, `#/neu` new, `#/rezept/:id` detail, `#/rezept/:id/bearbeiten` edit. Each view module exports an async `render*()` that returns a fresh DOM node; the router replaces `<main id="app">` contents. To re-render the current view after a data change, views dispatch a synthetic `hashchange` event (`window.dispatchEvent(new HashChangeEvent('hashchange'))`).
- **Back navigation**: use `goBack(fallback)` from `js/util.js`, not `history.back()` directly. The router counts only *trusted* hashchange events in `nav.count`; when it is 0 (app opened directly on a deep link), `goBack` calls `location.replace(fallback)` so "Zurück" never leaves the app. Saving a *new* recipe uses `location.replace` so the form doesn't stay in history.
- **DOM**: built with the `h(tag, attrs, ...children)` helper in `js/util.js` (`on*` attrs become listeners, known properties are set as properties). Icons are inline SVG strings in `icons`.
- **Images**: stored as `Blob` directly in the recipe record. Display them via `blobUrl(blob)`; the router calls `releaseBlobUrls()` on every navigation, so don't keep these URLs across views. New images always go through `pickImage()`/`shrinkImage()` in `js/image.js` (max 1600 px, JPEG 0.85).
- **Storage** (`js/db.js`): IndexedDB database `rezepte`, store `recipes`, keyPath `id`. Record shape: `{ id, title, ingredients: string[], steps, tags: string[], servings, timeMinutes, notes, image: Blob|null, createdAt, updatedAt }`. `exportAll()`/`importAll()` serialize to JSON with images as data URLs (format `{ app: 'rezepte', version: 1, recipes }`). Changing the record shape affects old backups, so keep import tolerant.
- **List & A–Z index** (`js/list.js`): sorting uses `Intl.Collator('de')`; grouping uses `letterOf()` (NFD-normalized first char so Ä/Ö/Ü fall under A/O/U, everything non-A–Z under `#`). Sections have `id="sec-<letter>"`. The index maps pointer Y position proportionally onto the letter array (pointer capture, `touch-action: none`) and jumps to the next existing group when a letter is empty.
- **Service worker** (`sw.js`): precaches an explicit `ASSETS` list, serves cache-first and revalidates in the background. **When adding or renaming a file, add it to `ASSETS` and bump `CACHE`** (`rezepte-v1` → `rezepte-v2`), otherwise the installed app stays offline-broken or stale.
- **Styling** (`styles.css`): mobile-first, colors as CSS custom properties on `:root` with a dark-mode override via `prefers-color-scheme`. Layout depends on `--topbar-h` (sticky group headers, `scroll-margin-top`) and `--index-w` (right padding so content clears the A–Z bar).

## Workflow

Commit every completed change on its own with a descriptive German message (summary line + bullet points) and push to `origin main`. The user wants to be able to revert individual changes. `gh` may not be on the Bash PATH; it is at `C:\Program Files\GitHub CLI\gh.exe`. Git identity is configured repo-locally.
