# Review process specs implementation details

## Executive summary

- Single source of truth: The “current” data is always the result of the latest approved review.
- One active review per MM Source: enforced by a unique partial index and transactional lock.
- Lightweight global “do-not-review-twice” mechanic: a ReviewedEntity registry marks Person/Organization/Collection(description)/Piece(description) as globally reviewed.
- Reuse existing edit forms: reviewers work on a local working copy; only on final submit do we write updates + audit logs in one transaction.
- Audit trail with JSONB snapshots: simple, reliable, sufficient for research-grade provenance.
- Declarative review checklist schema: one TypeScript map enumerates which fields must be checked per entity; UI renders a piece-level checklist view from that single source of truth.

## Data model

- Review (new)
    - id
    - mmSourceId
    - creatorId
    - state: enum { PENDING, IN_REVIEW, APPROVED, ABORTED }
    - startedAt, endedAt
    - overallComment (nullable)
    - createdAt, updatedAt
    - Constraints:
        - unique partial index on (mmSourceId) where state = 'IN_REVIEW' to guarantee one active review per source.
        - FK to User, MMSources.
        - check creatorId != MMSource.creatorId at creation time (enforce via backend validation).
- MMSource.reviewState (denormalized)
    - enum { PENDING, IN_REVIEW, APPROVED, ABORTED }
    - Updated only by backend upon review state transitions, inside the same transaction.
- ReviewedEntity (new)
    - id
    - entityType: enum { PERSON, ORGANIZATION, COLLECTION, PIECE }
    - entityId: string/uuid
    - reviewedAt
    - reviewedById
    - reviewId
    - unique(entityType, entityId)
    - Purpose: globally signals “already reviewed, skip next time” without adding columns to all those tables.
- AuditLog (new)
    - id
    - reviewId
    - entityType
    - entityId
    - operation: enum { CREATE, UPDATE, DELETE }
    - before: jsonb (nullable)
    - after: jsonb (nullable)
    - authorId
    - createdAt
    - comment (nullable)
    - Indexes on (entityType, entityId), (reviewId).
    - Rationale: full snapshots are simplest and robust; a later optimization can store per‑field diffs if needed.
- Optional: ReviewAttachment (future)
    - If you later want to store supporting evidence (e.g., archived PDF references), keep a simple attachment table keyed by reviewId.

## Core lifecycle

- Starting a review
    - Reviewer clicks “Start review” and confirms.
    - Backend transaction:
        - Validate: user has REVIEWER role, user != MMSource.creatorId, MMSource has no IN_REVIEW.
        - Create Review with state IN_REVIEW and startedAt.
        - Set MMSource.reviewState = IN_REVIEW.
    - This acts as a lock; the item disappears from the “to review” list for everyone else.
- Working copy and edits during review
    - Keep it simple: client‑side working copy in React context + localStorage (as you planned).
    - Reuse the existing edit forms bound to that working copy.
    - No writes to the DB until final submission or abort.
- Checklist coverage (exhaustive)
    - Define a single ReviewChecklistSchema map in code:
        - For each entity type in the piece scope (Collection desc, Piece desc, PieceVersion, Movement, Section, TempoIndication, MetronomeMark, MMSource metadata, Reference, Contribution), list the fields that must be checked and label text.
        - The schema drives the UI (checklist rendering) and server validation (all required checks must be present).
    - “Do not review twice” filtering:
        - Before rendering the checklist, filter out Person, Organization, Collection(description), Piece(description) that exist in ReviewedEntity.
        - For these excluded entities, hide edit entry points unless user has ADMIN.
- Submitting the review
    - Client sends:
        - mmSourceId, reviewId
        - workingCopy payload (all entities involved and their final values)
        - checklistState: array/map of { entityType, entityId, fieldPath, checked: true }
        - overallComment (optional)
    - Backend single transaction:
        - Validate: Review.state = IN_REVIEW, Review.creatorId = current user.
        - Validate checklist completeness server‑side:
            - Recompute required fields from ReviewChecklistSchema for the actual entity graph (minus globally reviewed exclusions) and assert every required field was checked.
        - Compute diffs per entity (before/after) by reading current DB and comparing to workingCopy.
        - Apply changes:
            - UPDATE/INSERT/DELETE as needed on all affected entities.
            - Insert AuditLog rows per touched entity (with before/after).
        - Upsert ReviewedEntity entries for:
            - Person, Organization that were reviewed for the first time within this scope.
            - Collection(description), Piece(description) if present and not yet reviewed.
            - Note: Do not create ReviewedEntity for structure elements (PieceVersion/Movement/Section/etc.). They’re scoped to the MM Source review; changes are captured in AuditLog.
        - Mark Review.state = APPROVED, set endedAt.
        - Update MMSource.reviewState = APPROVED.
    - Respond success with a server-generated summary (counts, entities changed).
- Aborting a review
    - Allowed to reviewer and admin.
    - Backend transaction:
        - Set Review.state = ABORTED, endedAt = now.
        - Set MMSource.reviewState = ABORTED.
        - No data changes or audit logs for entities (only the Review row is the record).
    - Client clears localStorage for that review.

Authorization and roles
- Roles: USER < EDITOR < REVIEWER < ADMIN.
- Gate the review UI and endpoints to REVIEWER+.
- Enforce “reviewer cannot review own MM Source” on review start.
- “Do-not-review-twice” entities become read‑only in normal flows after reviewed; only ADMIN can edit them in a separate back‑office flow. Such admin edits do not auto‑reset ReviewedEntity; they are exceptional and still produce AuditLog entries.

## Field‑level checklist strategy

- Keep per-field check marks only client‑side during the review. They’re submitted for server validation but not stored long-term. Why:
    - Avoid schema bloat (no per-field rows).
    - The authoritative proof is the AuditLog and the “Approved” state; checkmarks are a process instrument, not enduring evidence.
- If you later need persistent field‑level proof, add ReviewChecklistItem:
    - reviewId, entityType, entityId, fieldPath, checkedAt.
    - This can be added later without breaking the core model.

## “Do not review twice” resolution

- Use ReviewedEntity to drive:
    - List filtering: exclude already reviewed persons/orgs/collection‑desc/piece‑desc.
    - Checklist rendering: those items are omitted.
    - Form controls: disable editing for those entities unless ADMIN.
- When an entity is first seen as reviewed within any approved review, create the ReviewedEntity row once.

## API design (minimal, clear)

- POST /api/review/start
    - body: { mmSourceId }
    - returns: { reviewId }
- GET /api/review/:reviewId/overview
    - returns the MM Source graph needed for the checklist plus flags for “globally reviewed” exclusions.
- POST /api/review/:reviewId/submit
    - body: { workingCopy, checklistState, overallComment }
    - transactional finalize as described.
- POST /api/review/:reviewId/abort
    - body: { reason? }
- GET /api/mMSource/toReview
    - Returns list with: title, composers, link, enteredBy, sectionsCount, creationDate.
    - Server filters:
        - MMSource.reviewState IN ('PENDING','ABORTED').
        - No active Review IN_REVIEW for that source.
- Optional: GET /api/review/:reviewId/audit
    - Returns paginated AuditLog entries for confirmation UI or admin back-office.

## UI flows and components

- To‑review list: as specified, hide items in IN_REVIEW.
- Start review modal: confirms creation of the lock.
- Piece Review Checklist screen:
    - Driven by ReviewChecklistSchema; show only items required for this MM Source and minus globally reviewed exclusions.
    - For each item:
        - Show field value vs. online score reference link.
        - “Edit” button opens the existing form editing the working copy.
        - After saving the edit, the related field’s check resets and must be rechecked.
    - Filters: show outstanding checks; highlight changed fields.
    - Progress: show percentage complete at piece, collection, and whole source levels.
    - Submit button disabled until 100% required checks are checked.
- Abort review:
    - Clear local storage and return to list.

## Database constraints and transactions

- Use a unique partial index to prevent multiple IN_REVIEW rows for the same mmSourceId.
- All finalize operations run in a single transaction:
    - Update entities
    - Insert AuditLog rows
    - Upsert ReviewedEntity rows
    - Flip review and mmSource states
- Idempotency:
    - Client can include a requestId header; server can keep a short‑lived IdempotencyKey table keyed by requestId + reviewId to ensure retries don’t double‑apply. Optional but easy to add later.

## Implementation sequencing (solo‑dev friendly)

### Phase 1 (MVP, low risk) Goal: end-to-end ability to pick an MM Source from a list, confirm starting a review (locking it), complete the checklist, and finalize or abort.

#### 1. Database and state backbone

- Add Review, ReviewedEntity, AuditLog tables and MMSource.reviewState.
- Unique partial index to enforce one IN_REVIEW per mmSourceId.

#### 2. Minimal APIs

- POST /api/review/start: creates IN_REVIEW lock after validations.
- POST /api/review/:reviewId/abort
- POST /api/review/:reviewId/submit
- GET /api/mMSource/toReview: data for the list (PENDING or ABORTED; exclude sources with an active IN_REVIEW).

#### 3. List + start flow (the missing first step)

- To‑review list page
    - Fetch from GET /api/mMSource/toReview.
    - Show title, composers, link, enteredBy, sectionsCount, creationDate.
    - Empty state when nothing is available.

- Start review confirmation modal
    - Confirm → POST /api/review/start with mmSourceId.
    - If success: navigate to the Review Checklist route for that reviewId; the selected source disappears from other users’ lists.
    - If conflict (someone started it moments before): show a “now locked” message and refresh the list.

- Routing guard
    - If a user has any Review in IN_REVIEW they created, redirect them to that review’s checklist and hide/disable the list route until they finish or abort.

#### 4. Checklist UI foundation

- Rendered from a hard‑coded ReviewChecklistSchema map.
- Load review overview data via GET /api/review/:reviewId/overview.
- Client-side working copy + localStorage.
- Submit disabled until required checks are completed.

#### 5. Finalize endpoint wiring

- POST /api/review/:reviewId/submit performs transactional apply + audit + MMSource.reviewState update to APPROVED.
- On success: clear local state, navigate back to list.

#### 6. Abort flow wiring

- POST /api/review/:reviewId/abort sets ABORTED, releases the lock.
- Client clears local storage and navigates back to list.

#### 7. Acceptance criteria for Phase 1

- A reviewer can see the to‑review list, start a review via confirmation, and be taken to the checklist.
- A source that’s started disappears from all lists until approved/aborted.
- A reviewer with an active review cannot access the list until they finish/abort.
- Finalize writes changes and audit logs atomically; abort leaves no entity changes, only the Review row history.
- “Do not review twice” filtering affects the checklist rendering (omits globally reviewed entities).

#### 8. Edge cases to cover in Phase 1
- Concurrent start: the modal start call must gracefully handle a uniqueness violation and refresh the list.
- Permission guard: reviewer cannot review their own MM Source; surface a friendly error in the modal.
- Deep links: visiting a checklist URL for a review not owned by the user or not IN_REVIEW returns an error and redirects to the list.
- Resilience: if checklist data load fails, allow safe retry; do not create any partial server state until finalize/abort.

This keeps the “pick and confirm to lock” UI as an explicit, testable milestone in Phase 1, ensuring the review lifecycle begins where users expect: the to‑review list and confirmation modal.

### Phase 2 (comfort and quality)

- Checklist QoL: progress indicators, filters (unchecked/changed), show changed vs unchanged.
- Admin panel:
    - View and abort active reviews.
    - Search AuditLog by entity.

- Idempotency for finalize (optional dedicated key table).

### Phase 3 (optional)

- Server-side “draft” storage (ReviewDraft) for long reviews.
- ReviewAttachment support.

## Testing strategy

- Unit tests:
    - Checklist completeness validator (schema → required fields computed for a given graph).
    - Diff computation and AuditLog composition.
    - State transitions and lock creation constraints.
- Integration tests:
    - Start → edit → submit: ensure single transaction applies updates and audit rows.
    - Aborted reviews re‑expose the MM Source in to‑review list.
    - “Do not review twice” exclusions work after a prior review marked entities as reviewed.
- UI tests:
    - Checklist disables submit until 100% checked.
    - Editing a field resets its check.

## Why this meets the requirements
- Reuses your existing forms and “local working copy” approach.
- Keeps the “review” concept centralized and auditable without complicating entity tables.
- Uses a single, declarative TypeScript schema to define required review fields, so both the UI and backend validation stay in sync.
- Scales to future features (admin back office edits, attachments, AI first pass) without changing the core model.
- Enforces simple, robust locking with minimal database machinery.
- Keeps the one‑developer burden small: few tables, clear endpoints, and straightforward UI states.