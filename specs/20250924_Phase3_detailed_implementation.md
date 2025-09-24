

---

### Phase 3 verification & completion (2025-09-24)

This section documents the verification performed against the Acceptance criteria and the end-of-spec requirements. All items below are implemented and covered by tests where applicable.

Summary: Phase 3 is Completed.

- Visual hints
  - Unchecked items are highlighted and include a “Needs check” badge; changed items show a “Changed” badge.
  - Accessibility: state is announced via aria-labels; checkboxes and edit actions have descriptive aria-labels.
  - Tests: `__tests__/review-ui/checklistRow.visualHints.test.tsx`.

- Progress indicators and correctness
  - Global progress shows “X / Y required checks (Z%)” and updates live as items are checked.
  - Slice-level progress is computed consistently via `computeOverviewProgress` with attribution to pieces/collections.
  - Tests: unit coverage for rollups in `__tests__/reviewProgress.test.ts` and `__tests__/reviewProgress.withChecked.test.ts`; UI-level increment verified in `__tests__/review-ui/checklistPage.progress.test.tsx`.

- Submit gating
  - Submit button is disabled until all required checks are completed; it enables immediately on completion.
  - Tests: `__tests__/review-ui/submitGating.test.tsx` (component), `__tests__/review-ui/submitFlow.integration.test.tsx` (page-level happy path).

- Back-to-review restoration (slice + scroll) and stability
  - Exact slice row scrolling restored after returning from edit; retry loop mitigates layout shifts.
  - Progress counts remain unchanged by the return action itself when no graph-impacting changes occurred.
  - Tests: `__tests__/review-ui/restoreSliceScroll.test.tsx` (scrollIntoView), `__tests__/review-ui/checklistPage.progress.test.tsx` (progress preserved on return).

- Minimal Audit read API (read-only)
  - Server: `GET /api/audit` supports either `reviewId` or `entityType+entityId` with cursor pagination; REVIEWER+ guard and validation in `utils/server/getAuditLogs.ts`.
  - UI: lightweight AuditPanel embedded in the checklist page for the current review.
  - Tests: `__tests__/api.audit.test.ts` (400 missing filters, 403 Forbidden mapping, 200 happy path) and pagination passthrough `nextCursor` verified; integration panel exercises fetch but remains UI-only.

- Integration suite for review lifecycle
  - Start → overview → submit/abort endpoints: authorization, validation, and state machine behaviors covered with mocks; submit validates completeness and composes audit preview.
  - Tests: `__tests__/api.start.test.ts`, `__tests__/api.overview.test.ts`, `__tests__/api.submit.test.ts`, `__tests__/api.abort.test.ts`.

- Rank reordering safety and diff correctness
  - Two-phase (offset/normalize) plan utility with tests; changed-field emission for rank updates only.
  - Tests: `__tests__/reorderPlan.test.ts`, `__tests__/reviewDiff.rankChange.test.ts`.

- Tooling compliance and Jest 30
  - No usage of removed `toThrowError`; all tests green under Jest 30 with Testing Library.

Result: All acceptance criteria for Phase 3 are satisfied; code is merged with comprehensive unit, integration, and UI coverage. Phase 3 can be declared Completed.
