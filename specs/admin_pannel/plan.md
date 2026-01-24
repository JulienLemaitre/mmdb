# Admin Panel Implementation Plan

This folder defines a chunked implementation plan for the new Admin section of the MM Database webapp. Each chunk is sized to be completed in a single AI agent pass. Chunk prompts live alongside this plan.

## Goals
- Admin-only dashboard for monitoring activity, located under `app/(signedIn)/admin`.
- Access control follows existing guarded-route patterns via `proxy.ts` (same redirects as other routes).
- Data transport will use dedicated Admin API routes for client-side filtering and pagination.
- Three views:
  1) Users list with signup info, role, total MM Sources count, approved MM Sources count, and total Reviews count.
  2) Feed form history (MM Sources) with author, source title, piece titles (ordered, include category + rank), section count, and metronome mark count.
  3) Review history with author, source title, piece titles (ordered, include category + rank), section count, metronome mark count, and access to audit logs.
- Filtering for lists by date range, role, and review state.

## Chunk Overview
1. Admin route + access guard (proxy.ts)
2. Admin data queries (server utilities)
3. Admin data transport layer (API routes)
4. Admin UI (tables/layout + filters)
5. Audit log viewer (via API route)
6. Navigation entry point
7. QA + performance notes

## Notes
- Authentication logic lives in `app/(auth)`; redirects should reuse `/logout` and `/not-authorized` as in `proxy.ts`.
- Use Prisma models from `prisma/dbml/schema.dbml` and existing utilities like `utils/server/getAuditLogs.ts`.
- Keep output ASCII-only unless a file already uses Unicode.
