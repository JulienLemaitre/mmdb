# Chunk 7: QA + Performance Notes

## Context
- Admin views are likely to grow with data volume.
- Prisma queries can become expensive without pagination and indexes.

## Goal
Add lightweight QA steps and performance notes so the admin panel is reliable.

## Requirements
- Verify role guards via `proxy.ts` for `/admin`.
- Confirm API routes enforce ADMIN role server-side.
- Confirm counts and list data match expectations (including approved MM Sources count).
- Ensure filters (date range, role, review state) work and pagination is correct.
- Note any indexes that may be needed for scale (no DB migrations required in this chunk unless requested).

## Tasks
1. Manually validate access:
  - Admin user can view `/admin` and load data.
  - Non-admin is rewritten to `/not-authorized`.
  - No session is rewritten to `/logout`.
2. Validate API auth:
  - Admin gets data.
  - Non-admin gets 401/403.
3. Validate data correctness (spot-check counts and titles).
4. Validate filtering by date range, role, and review state.
5. Add a short README section or code comments on any limitations.
6. If needed, suggest indexes for `MMSource.createdAt` and `Review.startedAt`.

## Acceptance Criteria
- Admin-only access confirmed via proxy and API.
- Filters and pagination behave as expected.
- Notes on potential performance improvements documented.

## Out of Scope
- Implementing DB migrations for new indexes.
- UI redesign.

## Suggested File Touches
- `specs/admin_pannel/plan.md` (optional: add a QA note)
- `specs/admin_pannel/07-qa-performance.md` (this file)
