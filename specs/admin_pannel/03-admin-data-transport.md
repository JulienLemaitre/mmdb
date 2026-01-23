# Chunk 3: Admin Data Transport Layer (API Routes)

## Context
- Admin UI needs paginated and filterable data.
- Server helpers (Chunk 2) return datasets with pagination and filters.
- Guarded page routes are enforced by `proxy.ts`, but API routes must enforce ADMIN role server-side.

## Goal
Expose Admin datasets via API routes with ADMIN-only access and filter support.

## Requirements
- Create API routes under `app/api/admin/*`:
  - `app/api/admin/users/route.ts`
  - `app/api/admin/mm-sources/route.ts`
  - `app/api/admin/reviews/route.ts`
- Enforce ADMIN role server-side.
- Support filters: date range, role, review state.
- Return consistent JSON shapes: `{ items, nextCursor }`.

## Tasks
1. Create the three API routes and guard with `getServerSession(authOptions)` + role check.
2. Parse `cursor`, `limit`, `from`, `to`, `role`, `state` from query params and call the server helpers.
3. Return `NextResponse.json({ items, nextCursor })`.
4. Add minimal error responses (401/403/400) with clear messages.

## Acceptance Criteria
- Non-admin calls are rejected with 401/403.
- Admin calls return valid data and pagination.
- Filters are passed through to the helpers.

## Out of Scope
- UI rendering.
- Audit log viewer.

## Suggested File Touches
- `app/api/admin/users/route.ts`
- `app/api/admin/mm-sources/route.ts`
- `app/api/admin/reviews/route.ts`

## Notes
- Keep the logic server-side; do not rely only on client checks.
