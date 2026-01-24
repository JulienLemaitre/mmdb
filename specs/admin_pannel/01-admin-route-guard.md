# Chunk 1: Admin Route + Access Guard

## Context
- The Admin dashboard must be accessible to ADMIN users only.
- Guarded routes are enforced in `proxy.ts` using NextAuth middleware.
- Existing patterns for `/review`, `/feed`, `/explore` use `proxy.ts` to redirect to `/logout` or `/not-authorized`.

## Goal
Create the Admin route skeleton and enforce ADMIN-only access via `proxy.ts`.

## Requirements
- Add a new route under `app/(signedIn)/admin`.
- Enforce ADMIN access in `proxy.ts` (same redirect patterns as other guarded routes):
  - If token is missing or expired, rewrite to `/logout`.
  - If role is not ADMIN, rewrite to `/not-authorized`.
- Update `config.matcher` to include `/admin/:path*`.

## Tasks
1. Create `app/(signedIn)/admin/page.tsx` placeholder view (simple header + stub sections).
2. Update `proxy.ts` to guard `/admin` using the same token/role checks as other routes.
3. Update `config.matcher` in `proxy.ts` to include `/admin/:path*`.

## Acceptance Criteria
- Visiting `/admin` as ADMIN renders the Admin page.
- Visiting `/admin` unauthenticated rewrites to `/logout`.
- Visiting `/admin` as non-ADMIN rewrites to `/not-authorized`.

## Out of Scope
- Data fetching.
- UI tables.
- Audit log viewer.

## Suggested File Touches
- `app/(signedIn)/admin/page.tsx`
- `proxy.ts`

## Notes
- Keep the guard centralized in `proxy.ts` to match existing patterns.
