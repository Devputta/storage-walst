# Lumina Vault

Prompt:

Create a premium personal media website that allows uploading and viewing high-quality photos and videos in a private, secure, and visually rich environment.

The design should feel like a cinematic gallery, not like a file manager or drive.

🔐 PRIVACY SYSTEM (IMPORTANT)

 All content is hidden by default

 Require:

 Login / PIN to access

 Add:

 “Lock” option for each collection

 Hidden mode (blur thumbnails until unlocked)

 Auto-lock after inactivity

📁 FOLDERS → (RENAME AS “COLLECTIONS”)

Instead of boring folders, create:

👉 Collections (visual folders)

 Each collection should look like:

 A cover image/video

 Title (e.g., “Memories”, “Private”, “Favorites”)

 Grid layout with aesthetic cards

Features:

 Create new collection

 Rename / delete

 Drag & drop media into collections

 Each collection opens into a full gallery view

🕶️ HIDDEN CONTENT SYSTEM

 Collections can be:

 Public (visible after login)

 🔒 Private (locked with PIN)

 Private collections:

 Show blurred preview

 Unlock on click with password

 Option:

 “Invisible mode” → completely hidden unless searched or unlocked

🏠 DASHBOARD

 Clean homepage:

 “Your Space”

 Collections grid

 Smooth animations when opening collections

🎥 MEDIA EXPERIENCE

 Fullscreen viewing

 Videos:

 Auto-play

 Speed control (0.5x–2x)

 Quality selector (HD / 4K)

 Download option

 Images:

 Ultra HD zoom

 Swipe navigation

⬆️ UPLOAD SYSTEM

 Drag & drop upload

 Upload directly into a collection

 Preview before upload

 Progress bar animation

Fields:

 Title

 Description

 Select Collection

🎨 DESIGN STYLE

 Dark theme (cinematic 🎬)

 Glassmorphism + blur effects

 Smooth transitions

 No file icons, no folder trees ❌

 Only visual cards and grids ✅

⚡ SMART FEATURES

 Search collections

 Filter by type (video/photo)

 Favorites system ❤️

 Double-click logo → secret hidden page 😄

💻 TECH STACK

 React + Tailwind CSS

 Framer Motion (animations)

 Storage:

 Cloudinary / Firebase / Supabase

💡 IMPORTANT DESIGN ADVICE

Don’t show:

 File names like “IMG_001.jpg” ❌

 Folder tree structure ❌

Instead show:

 “Summer Moments”

 “Private Clips”

 “My Favorites”

👉 This makes it feel personal + premium, not technical.

🔥 EXTRA IDEA (VERY COOL)

👉 Secret Gesture Unlock

 Double-click logo OR type a key

 Opens hidden collection

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cine-vault-gallery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49b31c44-ba4e-491c-8da8-a20b8ea3f949).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
