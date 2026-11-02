# Connect AI assistants to Lumen (MCP)

Let assistants like Claude or ChatGPT connect to Lumen. Each person signs in with their own Lumen account and approves the connection; the assistant only sees that person's own collections. Private collections stay locked under the same rules as the app.

## What gets added
- A connection point at `/mcp` that assistants can connect to.
- An approval page: "Connect <assistant> to Lumen", showing the signed-in account, with Approve and Cancel buttons.
- The sign-in page sends people back to the approval page after they sign in (email/username, sign-up, or Google), instead of the gallery.
- Read-only assistant tools:
  - `list_collections` — your collections with item counts (titles of locked private collections hidden behind "Locked").
  - `list_media` — items in a collection you can open (locked ones refused unless unlocked in the app).
  - `search_collections` — find collections by title or nickname.
- Browser-page tools for the gallery screen: list visible collections, and search/filter the view.

No uploading, deleting, PIN or sharing actions are exposed. No database or data changes.

## Blocker
Your backend is currently paused because Cloud credits ran out. Turning on assistant sign-in needs the backend running, so it has to be woken first (top up Cloud credits, or wait for the monthly Cloud allowance).

## Technical details
- `@lovable.dev/mcp-js` + `zod`, `mcpPlugin()` in vite.config, server in `src/lib/mcp/` (name `lumina-vault`, title "Lumina Vault"), OAuth issuer `https://<ref>.supabase.co/auth/v1`, `supabaseForUser` client so existing RLS applies.
- Consent route `src/routes/[.]lovable.oauth.consent.tsx`; `/auth` gains a validated `next` param (`oauthReturnPath`) used for password login, signup `emailRedirectTo` and Google `redirect_uri`.
- Run `supabase--configure_oauth_server`, then extract the manifest; republish required.
- WebMCP via `use-webmcp-tool` on the collections page with telemetry wrapper.
