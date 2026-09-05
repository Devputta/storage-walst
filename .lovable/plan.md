# Day 3 — Personal vault and collections

## User-facing outcome
- Make the collections home easier to scan with clear search, visibility/security filters, counts, lock states, and recently viewed collections.
- Make locked collection entry clearer with PIN validation, useful error feedback, a visible unlocked state, and a real lock/auto-lock path.
- Keep protected photos and videos inaccessible until the backend says the collection is unlocked; blurred previews will not be treated as protection.
- Preserve existing records and avoid schema/data changes unless an access-policy correction is required.

## Implementation
1. Harden storage authorization for private collection paths so signed URLs and direct storage reads require an active unlock, while preserving owner-only access for public collections and owner delete/write behavior.
2. Improve collection home presentation: searchable title/nickname matching, filter controls for visible/hidden and locked/unlocked states, clearer empty/loading/error states, and a recently viewed section backed by local browser state.
3. Refine collection detail access: record visits, show lock status and media counts, prevent cover URL resolution while locked, provide explicit lock action, and add inactivity auto-lock that revokes the backend unlock rather than only changing local UI state.
4. Strengthen PIN interactions: validate PIN format before submission, distinguish incorrect PIN, missing recovery setup, expired access, and network failures, disable duplicate submissions, and refresh protected queries only after a confirmed unlock.
5. Run the database security linter, inspect the resulting access rules, verify the build, and test the public/locked/unlocked paths in the running preview where authentication is available.

## Out of scope
- No replacement of existing RLS policies unrelated to collections/media.
- No changes to existing media, collection, or profile records.
- No new favorites data model; retain the current per-media favorites behavior.
