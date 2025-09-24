### Phase 3 implementation plan (scope, PRs, acceptance)

Phase 3 per spec focuses on three areas:
- Progress polish and visual hints in the review UI.
- A minimal read API for audit logs (optional).
- A complete test suite across units, integration, and UI.

Below is the detailed work breakdown, suggested PR slicing, acceptance criteria, and risk/mitigation aligned with the repository’s stack and guidelines.

---

### Workstreams and detailed tasks

#### A) Progress polish and visual hints (Review UI)
Goal: Make the checklist experience crisp, informative, and accurate, without interactive filters.

Scope and tasks:
- Progress computation and display
  - Ensure rollups exist and are derived consistently from the working copy and `ReviewChecklistSchema` across levels:
    - Per-slice (e.g., piece, collection, people, organizations).
    - Overall progress for the review.
  - Display: a compact progress bar/indicator per slice and a global one at the top of the checklist page.
  - Edge cases: conditional required fields; globally reviewed entities omitted unless changed in the review.
  - Disable submit until 100% of required items for the current working graph are checked.

- Visual hints
  - Unchecked: clear highlight style (e.g., tinted left border or background).
  - Changed: badge or color (e.g., a subtle “Changed” pill) derived by comparing working copy against the baseline snapshot from review start.
  - Accessibility: color contrast meets WCAG AA; hints are not color-only (include icon or badge label).

- UX polish
  - Sticky headers per slice to keep context while scrolling.
  - “Back to review” return experience: restore exact slice and scroll position (Phase 2 provided mechanism; Phase 3 confirms smoothing and ensures no layout shifts break restoration).

- Performance
  - Memoize derived rollups with `useMemo` keyed by working copy version and checked map.
  - Avoid O(n^2) passes; compute changed/checked/required in a single traversal where feasible.

- Guards
  - Respect display rule: omit globally reviewed Person/Organization/Collection-desc/Piece-desc unless they changed in this review; if changed, include and require checks.
  - Verify redirect conditions still correct: non-owner/ADMIN and non-`IN_REVIEW` states.

Deliverables:
- New/updated progress components for per-slice and global progress.
- Consistent visuals for Unchecked and Changed.
- Submit button gating wired to computed completeness.

Acceptance tests (UI):
- Visual: an unchecked item is highlighted; a changed item shows a badge; both are announced via accessible text.
- Progress bar increments as items are checked; global progress equals aggregation of slice progress.
- Submit remains disabled until all required fields are checked; becomes enabled immediately when complete.
- Returning from edit restores slice and scroll, with unchanged progress numbers.


#### B) Minimal Audit read API (optional but recommended)
Goal: Read-only access to audit trail for a given review and/or entity for triage and validation.

API design (lightweight):
- GET `/api/audit` with one of the following query modes (validated server-side):
  - `?reviewId=...&cursor=...&limit=...`
  - `?entityType=PERSON|ORGANIZATION|COLLECTION|PIECE&entityId=...&cursor=...&limit=...`
- Response shape:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "reviewId": "uuid",
        "entityType": "PIECE",
        "entityId": "uuid",
        "operation": "CREATE|UPDATE|DELETE",
        "before": {"...": "json"},
        "after": {"...": "json"},
        "authorId": "uuid",
        "createdAt": "ISO",
        "comment": "string|null"
      }
    ],
    "nextCursor": "string|null"
  }
  ```
- Constraints:
  - REVIEWER+ role required.
  - Pagination via simple `createdAt,id` cursor or `id` only if stable ordering by `createdAt DESC, id DESC`.

Server tasks:
- Prisma read-only queries against `AuditLog` with allowed filters, upper-bounded `limit` (e.g., 100).
- Input validation; reject ambiguous or missing filters.

UI (optional minimal view):
- A simple list under the review page (collapsible panel or separate route) to surface audit events for the current `reviewId`.
- No editing; just read.

Acceptance tests (integration):
- 403 for unauthenticated or insufficient role.
- 400 for missing/invalid filters.
- 200 with correctly ordered, paginated items for valid queries.


#### C) Comprehensive testing (unit, integration, UI)
Goal: Codify the Phase 1–2 invariants and complete Phase 3 visuals/gating.

Unit tests (TypeScript):
- Checklist expansion from `ReviewChecklistSchema` and working copy, including conditional requirements.
- Changed detection vs initial snapshot; ensure stable field paths and ID-based addressing.
- Diff composition helpers per entity type (ensuring correctness for CREATE/UPDATE/DELETE classification).
- Rank reordering safety for `MMSourcesOnPieceVersions`: offset-normalize pattern avoids unique collisions.

Integration tests (API):
- `start → edit → return → submit` happy path:
  - Recompute required items server-side, enforce checked completeness, apply diffs, write `AuditLog`, upsert `ReviewedEntity`, transition states atomically.
- Abort path clears local working copy and frees the lock (`IN_REVIEW → ABORTED`).
- Guards: access redirects or 403s when appropriate.
- Audit read API filters and pagination.

UI tests (RTL + user-event):
- Review checklist renders required items, omits globally-reviewed ones unless changed.
- Visual hints appear appropriately; progress indicators update as expected.
- “Back to review” restores slice and scroll position and recomputes changed/checked consistently.
- Submit button gating.

Tooling alignment notes:
- Jest 30: replace any `toThrowError` with `toThrow`.
- Test discovery: `__tests__/` and `*.spec|test.(ts|tsx)`.
- For DOM tests, default `jsdom`; for node-only tests use per-file `@jest-environment node`.

Data seeding for tests:
- Use Prisma seed when Node environment is required or craft lightweight factory helpers for unit/UI tests to avoid DB dependency.
- Prefer `next/jest` setup (dir: './') to respect bundler resolution and path aliases (`@/*`).

---

### Proposed PR breakdown

Each PR should be small, reviewable, and shippable behind existing guards. Order is optimized for parallelism where possible.

1) PR: Checklist progress computation refactor
- Content:
  - Extract selectors/utilities to compute per-slice and global progress from working copy + schema.
  - Memoize computations; add unit tests for edge cases (conditional requirements, omitted globals).
- Acceptance:
  - Deterministic outputs for representative fixtures.

2) PR: Visual hints (Unchecked + Changed) and a11y
- Content:
  - Implement highlight style for unchecked, badge for changed.
  - Add accessible labels and role-friendly markup.
  - Snapshot tests for class changes; RTL tests for accessible labels.
- Acceptance:
  - Meets color contrast; badges visible and announced in accessibility tree.

3) PR: Submit gating and sticky headers
- Content:
  - Wire submit button disabled state to computed completeness.
  - Add sticky slice headers; ensure scroll-to-slice anchor stability.
- Acceptance:
  - RTL test confirming gating; manual check for stickiness across typical viewport sizes.

4) PR: Back-to-review polish (scroll/slice restoration hardening)
- Content:
  - Verify and harden restoration logic; fix any layout-shift issues (e.g., reserve header space).
  - Add UI tests simulating navigation out and back.
- Acceptance:
  - Restoration is reliable; test proves scroll and slice are restored.

5) PR: Minimal Audit read API (server + optional UI)
- Content:
  - API route `GET /api/audit` with filters, pagination, role guard.
  - Integration tests for 400/403/200, pagination correctness.
  - Optional: lightweight panel listing current review’s audit log entries.
- Acceptance:
  - Contract stable and covered by tests.

6) PR: Integration test suite for review lifecycle
- Content:
  - End-to-end-ish tests for start → edit → return → submit; abort; guards.
  - Seed or factories to create minimal graphs.
- Acceptance:
  - All green in CI; flake-free locally.

7) PR: Rank reordering safety tests and diff correctness
- Content:
  - Focused unit/integration tests on reorder diff application and unique index collision avoidance.
- Acceptance:
  - Demonstrates no transient unique violations; correct final ranks.

Optional parallelization:
- PRs 1–3 can be developed in parallel with clear ownership of UI areas.
- PR 5 (audit read) is independent; can run in parallel.

---

### Acceptance criteria (global, Phase 3)
- Visual polish present and accessible: unchecked highlight, changed badge, sticky slice headers.
- Progress indicators accurate at slice and global levels; no staleness or double-counting.
- Submit disabled until completeness is met; enabled instantly when met.
- Back-to-review restores slice and scroll without regressions.
- Audit read API passes validation and pagination tests; restricted to REVIEWER+.
- Test suite covers unit, integration, and UI paths listed; Jest 30 compatible.

---

### Tech notes and file touchpoints
- UI components likely to touch:
  - `app/(signedIn)/review/[reviewId]/checklist/page.tsx` (progress render, gating, sticky headers)
  - `components/review/ReviewEditBanner.tsx` (ensure wording and link targets are stable)
  - New small components: `ProgressBar`, `ChangedBadge`, `SliceHeader` (collocated under `components/review/`)
- Server/API:
  - New route handler: `app/api/audit/route.ts` (Next.js App Router conventions)
  - Possible helpers in `lib/audit.ts` for query validation and Prisma calls
- Types/utilities:
  - `types/review.ts` (progress stats types, field path types)
  - `utils/reviewProgress.ts` (pure functions with unit tests)
- Tests:
  - `__tests__/review/*.test.ts` and `__tests__/review-ui/*.test.tsx`


### Risks and mitigations
- Progress miscounting due to conditional fields
  - Mitigation: golden fixtures and property-like tests for required/checked parity; single traversal deriving all rollups.
- Visual regressions with sticky headers and scroll restoration
  - Mitigation: allocate fixed header height; e2e-style RTL tests with `scrollIntoView` mocks.
- Audit read API data exposure
  - Mitigation: enforce REVIEWER+ role and strict query validation; paginate with capped limits.
- Jest 30 matcher mismatch
  - Mitigation: codemod any `toThrowError` usage → `toThrow`; add lint rule or CI check.


### Estimation (rough)
- PR 1: 1.5–2 days (incl. tests)
- PR 2: 1–1.5 days (incl. a11y checks and tests)
- PR 3: 0.5–1 day
- PR 4: 0.5–1 day
- PR 5: 1–1.5 days (incl. integration tests)
- PR 6: 1.5–2.5 days
- PR 7: 0.5–1 day
Total: ~6.5–10.5 days depending on unknowns.


### Definition of Done (per PR)
- Code compiles, lint passes (`npm run lint`), tests green locally and in CI.
- No `any` unless justified; path aliases `@/*` respected.
- Accessibility basics checked (labels, roles, contrast) for UI PRs.
- Added/updated unit and UI tests; integration tests where applicable.
- Updated documentation (specs/readme or inline docs) if API or behavior changed.


### Rollout and verification
- Ship PRs behind existing auth/route guards; no feature flags required.
- After merging visual PRs, manually verify on a seeded review:
  - Items show changed/uncheck hints, progress updates, submit gating.
  - Back-to-review preserves position.
- For audit API, verify via curl or REST client; confirm pagination and role guard.
- Monitor CI for flakes; stabilize tests before proceeding to the next PR.

This plan keeps Phase 3 tightly scoped, aligns with the existing architecture and guidelines, and produces incremental, reviewable PRs with strong automated test coverage.