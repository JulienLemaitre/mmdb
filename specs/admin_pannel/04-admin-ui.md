# Chunk 4: Admin UI (Tables + Layout)

## Context
- Admin page needs three data views: Users, MM Sources, Reviews.
- UI components should be minimal and consistent with current styling (DaisyUI/Tailwind classes seen in `ui/NavBar.tsx`).
- Data is fetched via Admin API routes for filtering and pagination.

## Goal
Build the Admin dashboard UI that renders the three datasets with filters.

## Requirements
- Provide a top-level header (e.g., "Admin Dashboard").
- Three sections or tabs:
  - Users
  - MM Sources
  - Reviews
- Each section shows a table with the required columns:
  - Users: name, email, signup date, email verified status, role, total MM Sources count, approved MM Sources count, total reviews count.
  - MM Sources: author, source title, piece titles (ordered, include category + rank), section count, metronome mark count, review state.
  - Reviews: author, source title, piece titles (ordered, include category + rank), section count, metronome mark count, review state, audit log action.
- Add filter controls:
  - Date range filter (from/to) for all lists.
  - Role filter for Users.
  - Review state filter for MM Sources and Reviews.
- Piece titles should be readable and truncated if too long (e.g., join with ", ", then truncate with " +N" if needed).

## Tasks
1. Create table components in `features/admin/` or `ui/` (pick one location and stay consistent).
2. Implement client-side data fetching from `/api/admin/*` with pagination.
3. Add filter UI and ensure it maps to query params for API calls.
4. Add basic empty/loading states.
5. Add a placeholder "View audit log" action in the Reviews table (actual viewer in Chunk 5).

## Acceptance Criteria
- All columns render with sensible formatting.
- Filters affect the data shown.
- Tables are readable on desktop and mobile.

## Out of Scope
- Audit log modal implementation.
- Advanced filtering beyond date range, role, and review state.

## Suggested File Touches
- `app/(signedIn)/admin/page.tsx`
- `features/admin/UserTable.tsx`
- `features/admin/MMSourceTable.tsx`
- `features/admin/ReviewTable.tsx`

## Notes
- Keep layout and styling consistent with existing patterns; no major design overhaul.
