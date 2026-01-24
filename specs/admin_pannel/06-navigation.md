# Chunk 6: Admin Navigation Entry

## Context
- The app uses `ui/NavBar.tsx` and the home page `app/(public)/page.tsx` for primary entry points.
- Admin link should only appear for ADMIN users.

## Goal
Expose the Admin dashboard entry point to ADMIN users.

## Requirements
- Add an "Admin" link (route `/admin`) to an existing navigation location.
- Link should only render for ADMIN users.
- Keep the UI consistent with existing nav buttons.

## Tasks
1. Decide where the Admin link lives (NavBar or Home page).
2. If NavBar: update `ui/NavBar.tsx` to consume session/role and render the link conditionally.
3. If Home page: update `app/(public)/page.tsx` to include the link for ADMIN users only.

## Acceptance Criteria
- ADMIN users see the link.
- Non-admin users do not see it.
- Link routes to `/admin`.

## Out of Scope
- Role management UI.

## Suggested File Touches
- `ui/NavBar.tsx`
- `app/(public)/page.tsx`
- `utils/routes.ts`
