# Chunk 2: Admin Data Queries (Server Utilities)

## Context
- Admin pages need aggregated data from Prisma models.
- Schema definitions are in `prisma/dbml/schema.dbml`.
- Admin should see:
  - Users with counts of total MM Sources, approved MM Sources, and Reviews.
  - MM Sources history with author, piece titles (ordered, include category + rank), sectionCount, metronome mark count.
  - Review history with author, source data, piece titles (ordered, include category + rank), sectionCount, metronome mark count, audit log count.
- Lists require filtering by date range, role, and review state.

## Goal
Implement server-side data helpers that return the required admin datasets with pagination and filters.

## Requirements
- Create server utilities under `utils/server/admin/` (or similar) for:
  - `getAdminUsers`
  - `getAdminMMSources`
  - `getAdminReviews`
- Each function accepts `limit` and `cursor` (optional) and returns `{ items, nextCursor }`.
- Add optional filters:
  - Date range (from/to) for all lists (`createdAt` for users and sources, `startedAt` for reviews).
  - Role filter for users.
  - Review state filter for reviews.
  - Review state filter for MM Sources (optional but recommended, since sources track `reviewState`).
- Sort by newest first (use `createdAt` or `startedAt` where applicable).
- Avoid over-fetching; use `select` and `_count`.
- Piece titles should be ordered by `MMSourcesOnPieceVersions.rank`, and include piece version `category` and rank in the display string.

## Suggested Prisma Shapes
- Users:
  - `db.user.findMany({ select: { id, name, email, createdAt, emailVerified, role, _count: { select: { mMSources: true, reviews: true } } } })`
  - Approved MM Sources count requires filtering by `reviewState = APPROVED` (separate query or aggregate).
- MM Sources:
  - `db.mMSource.findMany({ select: { id, title, createdAt, sectionCount, reviewState, creator: { select: { id, name, email } }, _count: { select: { metronomeMarks: true } }, pieceVersions: { select: { rank, pieceVersion: { select: { category, piece: { select: { title: true } } } } }, orderBy: { rank: "asc" } } } })`
- Reviews:
  - `db.review.findMany({ select: { id, state, startedAt, endedAt, creator: { select: { id, name, email } }, _count: { select: { auditLogs: true } }, mMSource: { select: { id, title, sectionCount, _count: { select: { metronomeMarks: true } }, pieceVersions: { select: { rank, pieceVersion: { select: { category, piece: { select: { title: true } } } } }, orderBy: { rank: "asc" } } } } } })`

## Tasks
1. Create the `utils/server/admin/` folder and add the three helper functions.
2. Implement pagination with `cursor` (use `id` cursor for simplicity) and `limit` clamped (1..100).
3. Add optional filter inputs and map them to Prisma `where` clauses.
4. Build DTOs with derived fields (piece title strings, total/approved counts).

## Acceptance Criteria
- Functions return correct counts and fields with stable ordering.
- Filters work as expected.
- Piece title list is ordered and includes category + rank info.

## Out of Scope
- API routes and UI.
- Audit log viewer.

## Suggested File Touches
- `utils/server/admin/getAdminUsers.ts`
- `utils/server/admin/getAdminMMSources.ts`
- `utils/server/admin/getAdminReviews.ts`

## Notes
- Keep output ASCII-only.
- No UI formatting here; just raw data.
