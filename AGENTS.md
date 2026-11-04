# AGENTS.md

- Keep DEVLOG.md (project root) as the development log: append one dated, plain-language entry per working session, newest at the bottom — the user tracks progress there.
- Visual identity is the "Silver Gelatin Archive" system defined in src/styles.css tokens (paper/ink/burgundy/sage, Libre Baskerville + IBM Plex, near-square radii, hairline borders, mono labels); apply it through tokens rather than hardcoding colors, so dark mode and shared components inherit it.
- The Cine Vault redesign is frontend-only: never change database schema, records, auth logic, storage structure, or APIs, and never remove working features.
