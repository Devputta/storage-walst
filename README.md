# Lumen — Cine Vault

A private photo and video archive built around visual collections, protected access, and a calm, editorial gallery experience.

**Live app:** [cine-vault-gallery.lovable.app](https://cine-vault-gallery.lovable.app)  
**Project status:** In active development. Features and service availability may change.

## Project overview

Lumen lets signed-in members organize personal photos and videos into collections, browse them in a gallery, and keep selected collections PIN-protected or hidden from the home view. The application uses Lovable Cloud for account access, collection and media records, and file storage.

The interface supports light and dark themes, desktop and mobile layouts, and an editorial film-archive visual identity. There are collections, not nested folders.

## What it includes

- Sign-in with username or email and password; Google sign-in is also offered where enabled for the project.
- Create, edit, search, hide, and PIN-protect collections.
- Upload photos and videos with progress feedback, retry handling, and common mobile media formats.
- Browse and filter media, open a full-screen viewer, navigate between items, and favorite media.
- View original or compressed downloads where the file and browser support them.
- Open the favorites vault using the app’s logo gesture.
- Read-only assistant tools for collection search/listing and media **metadata**; assistants do not receive media files.
- An inactivity lock for protected viewing sessions.

### Configured upload limits

The current application is configured for up to **1,050 items per collection** and **1 GiB per file**. These are application settings, not a promise of unlimited storage: actual uploads can still be constrained by Lovable Cloud project quotas, available storage, network quality, browser support, or service limits. Confirm current project limits before promising capacity to users.

## Privacy, security, and user responsibilities

- Collection visibility and PIN states are different from account sign-in. Hidden collections are omitted from the normal home listing; use the home view controls to reveal them.
- A blurred cover is only a visual effect, not a security boundary. PIN-protected media must remain subject to backend authorization.
- Assistant integrations are read-only and return metadata only. Users should review and approve each assistant connection before use.
- Keep account credentials private, use a strong password and PIN, and sign out on shared devices.
- Keep a separate backup of important originals. This app and its hosting provider are not a substitute for an independent backup.
- Do not upload content unless you own it or have permission to store it. Account holders are responsible for their uploads and applicable rights.

## Project rules and reminders

These rules help protect personal media and keep future changes safe:

1. **Never delete or alter a person’s collections, photos, videos, or account data without that person’s clear consent.**
2. Do not change the database structure, existing records, sign-in behavior, storage setup, or service interfaces as part of a visual-only task.
3. Preserve existing features when making updates; prefer small, additive changes.
4. Do not use real members’ media as sample or test content. Do not add fake records to real accounts.
5. Never commit passwords, private keys, access tokens, local environment files, or personal media.
6. Do not claim that hidden mode, blurred previews, or a client-side screen alone protects a file.
7. Append one dated, plain-language entry to `DEVLOG.md` for each development session. Keep `roadmap.md` current.
8. Before publishing a change, check sign-in, collection visibility, protected media behavior, uploads, and the production build where possible.

## Technology

| Area | Used in this project |
| --- | --- |
| Application | TanStack Start, TanStack Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 and project design tokens |
| Motion and icons | Motion and Lucide React |
| Data, accounts, and file storage | Lovable Cloud |
| Assistant connection | Model Context Protocol (read-only tools) |
| Development server and bundling | Vite 7 |

## Main pages

| Path | Purpose |
| --- | --- |
| `/auth` | Sign-in and account creation |
| `/app` | Home archive and collection index |
| `/c/:id` | A collection and its media |
| `/vault` | Favorites vault |
| `/profile` | Account-facing profile and collection summary |
| `/about` | App guide and privacy information |

## Local development

### Requirements

- Bun
- Access to this project’s Lovable Cloud configuration for account and media features

### Start the app

```bash
bun install
bun run dev
```

Use the local address printed by the development server. To check the project:

```bash
bun run build
bun run lint
```

Local clones need valid, private project configuration for Cloud features. Do not add secrets to this README or commit local `.env` files. Never put privileged server credentials in browser code.

## Repository map

```text
src/
  components/          Shared gallery, collection, and interface pieces
  integrations/        Lovable and Cloud client integrations
  lib/                 App helpers and server-side functions
  routes/              TanStack Start pages and endpoints
  styles.css           Global design tokens and styles
supabase/              Project configuration and migrations
DEVLOG.md              Dated development history
roadmap.md             Current task list
README.md              Project guide
LICENSE                Project-level rights notice
```

## Disclaimer

This project is provided **as is** and **as available**, without a guarantee that it will always be secure, uninterrupted, error-free, or suitable for a particular purpose. Cloud services, network conditions, browser capabilities, and account configuration can affect access and uploads. Users should maintain independent backups and report problems before relying on the app for safekeeping.

This README and the project are not legal advice. Users are responsible for ensuring they have the rights and permissions required for content they upload. The project owner should obtain legal advice about privacy, data retention, and distribution obligations before offering the app broadly or commercially.

## License

This repository does **not** grant an open-source license. The project-level rights notice is in [`LICENSE`](LICENSE). Third-party packages, fonts, and other external assets retain their own licenses and terms; this project notice does not replace them. The generic “Project owner” label should be replaced with the rights holder’s legal name before public distribution.