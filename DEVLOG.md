# Lumen — Development Log

A running record of what was built each day, so progress is easy to track.
Newest entries go at the bottom; one entry per working session, dated.

---

## Day 1 — First build: the private gallery

- Created Lumen: a private, cinematic personal media gallery.
- Sign-in with Google plus email/password; usernames can be used instead of email.
- Collections (no folders) with per-collection favorites.
- PIN-locked collections, hidden/invisible mode, blurred covers.
- Favorites vault revealed by double-clicking the logo.
- Auto-lock after inactivity, reel-style one-item scrolling with title/description overlays.
- Videos play in the gallery; uploads go straight into collections.
- Private storage with row-level security so only you can reach your media.
- Glass-style dark UI, oval LUMEN logo, aurora background.

## Day 2 — Interface polish and basics

- Improved layout, navigation, spacing, typography, buttons and forms.
- Better mobile layout, loading/empty/error states, modal behavior.
- Keyboard navigation and accessibility improvements.
- Light/dark mode toggle with remembered choice.
- Fixed sign-in page flicker; database and existing data untouched.

## Day 3 — Gallery experience

- Better photo/video grid, lazy loading, thumbnail loading, broken-media fallbacks.
- Search, sort by date/name, filter photos/videos/favorites.
- Fullscreen viewer with next/previous, keyboard navigation, mobile swipe.
- Photo zoom and pinch zoom; video playback controls.

## Day 4 — Vault and collections

- Collection search across titles and nicknames, visibility filters, lock indicators, item counts.
- Clearer PIN entry, validation, error messages, and "Lock now" button.
- 15-minute inactivity auto-lock; recently viewed list.
- Better blurred previews and easy back navigation.
- Security hardening: blurred covers are not security — locked media stays locked server-side; verified policies, linter and scan.

## Day 5 — Sign-in and account reliability

- Diagnosed sign-in failures (backend had paused; resumed it).
- PIN recovery ("forget lock"), nicknames, and PIN-change dialog.
- Uploaded videos now visible; blank preview crashes fixed.

## Day 6 — Uploads and reliability

- Email/password login shown alongside Google; sign in with username or email.
- Upload progress bar; up to 80-item batches (was 24/10).
- Per-collection favorites; item counts on cards.
- Download Original (HD) or Compressed; delete individual items.
- Files up to 1 GB supported; faster uploads with 6 parallel uploads (3 for big files).
- Fixes for missing uploads: retries, unrecognized phone formats (HEIC/MOV), failed files kept for retry.

## Day 7 — Agent integrations (MCP)

- Connected AI assistants (Claude, ChatGPT and similar) to the archive:
  read-only tools to list collections, search, and view unlocked media.
- Each assistant user signs in and approves on a consent page; locked collections stay locked.
- On the gallery page, browser assistants can list what's shown and change search/filters.
- Requires a republish before it goes live on the published site.

## Day 8 — Silver Gelatin Archive redesign (began)

- Chose a quiet editorial film-archive identity: Silver Gelatin palette
  (gallery paper, darkroom ink, burgundy, sage), Libre Baskerville + IBM Plex,
  near-square corners, hairline borders, monospaced labels, no glass blur or gradients.
- Reapplied the identity through shared style tokens so all pages inherit it.
- Home page rebuilt as an editorial masthead + contact-sheet grid.
- About page rebuilt as a numbered editorial index.

## Day 9 — 2026-11-03 — Redesign continued + development log

- Completed the Silver Gelatin Archive look on the remaining pages:
  - Sign-in page: bordered archive card, monospaced "Private archive · entry" label, squared inputs and buttons.
  - Collection detail page: monospaced header label ("Collection · N frames"), calmer editorial title size.
  - Landing page: rebuilt as a quiet editorial intro — hairline top bar, numbered 01–03 notes instead of feature cards.
- Created this development log (DEVLOG.md) and the task roadmap so progress is easy to track.
- No database, auth, or stored data changes; all existing features preserved.

## Day 10 — 2026-11-08 — Agent connection

- Connected the published Lumina Vault agent tools to the Lovable workspace.
- Confirmed the published site exposes its protected agent endpoint and OAuth discovery; collection data remains behind sign-in and existing permissions.
- No app code, database, or stored media changed in this session.

## Day 11 — 2026-11-14 — Make hidden collections easier to find

- Found that collections were still present, but Home hides hidden and PIN-protected collections by default.
- Added a visible “Show all” action for every signed-in account; it clears the search and reveals the account’s full collection list without changing stored data or bypassing PIN locks.
- No collections, photos, videos, or account settings were changed.
