# Chunk 5: Audit Log Viewer

## Context
- Review submissions generate `AuditLog` entries.
- Existing helper `utils/server/getAuditLogs.ts` fetches audit logs with reviewer/admin guard.

## Goal
Allow Admins to open and browse audit logs for each Review in the Admin dashboard.

## Requirements
- Add a UI action "View audit log" from the Reviews table.
- Display audit logs in a modal/drawer with pagination (newest first).
- Show key fields: entityType, operation, authorId (or author name if available), createdAt, before/after JSON (collapsed by default).
- Use a thin Admin API route to fetch logs.

## Tasks
1. Add UI container (modal/drawer) in Admin page or a client component.
2. Create `app/api/admin/audit-logs/route.ts` that proxies to `getAuditLogs` with ADMIN-only guard.
3. Create a client component that fetches audit logs by reviewId and supports paging with `cursor`.
4. Render audit log rows with expandable before/after JSON.

## Acceptance Criteria
- Clicking "View audit log" opens the viewer for that review.
- Logs load and page correctly.
- Non-admin cannot access logs (server guard enforced).

## Out of Scope
- Editing audit logs.
- Advanced filtering by entity type.

## Suggested File Touches
- `app/api/admin/audit-logs/route.ts`
- `features/admin/AuditLogViewer.tsx`

## Notes
- Keep JSON rendering simple (preformatted text or small JSON viewer).
