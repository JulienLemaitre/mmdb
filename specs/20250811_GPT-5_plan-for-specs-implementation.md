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

- POST /api/review/:reviewId/submit performs transactional apply + review update to APPROVED + MMSource.reviewState update to APPROVED + reviewedEntity rows creation
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

### Phase 2 — Edit forms, Checklist UI structure, and AuditLog

#### Phase 2A — Review UI structure (screens, navigation, and state) Goal: Implement the three review screens and their navigation model, driven by the ReviewChecklistSchema and the “do-not-review-twice” filtering.

- Screens and routes
    - Review Overview (source-level)
        - Shows MM Source metadata, references, contributions.
        - Lists collections and single pieces contained in the source.
        - Displays per-item review progress and whether a piece/collection is “complete” (all mandatory checks done).
        - Allows drill-down into Collection view or Piece Review Checklist.

    - Collection Overview
        - Displays collection description block (if not globally marked reviewed) with per-field checkboxes.
        - Lists the pieces in the collection with per-piece progress; drill down into Piece Review Checklist.
        - Rolls up completion state: collection is “complete” when its description block + all its pieces are complete.

    - Piece Review Checklist
        - One-page “exhaustive” list of every field to check for this piece’s scope:
            - Piece description (if not globally reviewed)
            - Piece version, movements, sections, tempo indications, metronome marks
            - Source‑level references/contributions that attach to this piece (if any)
            - Collection description (if applicable and required; appears as first block)

        - Each field shows current value; an Edit button opens the existing data-entry form for that entity (working on the local working copy).
        - Changing a value resets checkmarks for fields affected by that change.
        - Show filters: Unchecked only, Changed only, All.
        - Show progress indicators (piece-level, and a breadcrumb-level summary for collection/source).

- Navigation and guards
    - Route parameters include reviewId and entity anchors (e.g., pieceId, collectionId).
    - Guard:
        - If the review is not IN_REVIEW or not owned by current user (unless ADMIN), redirect to the list with a message.
        - If there’s an active review for the user, block the to-review list route (as in Phase 1).

    - Back navigation preserves scroll/filters in the Overview screens.

- Data loading
    - GET /api/review/:reviewId/overview
        - Returns:
            - MM Source graph trimmed by “do-not-review-twice” rules (persons/orgs/collection-desc/piece-desc filtered when globally reviewed)
            - Flattened index of entity nodes: {entityType, entityId, parentId?, fieldPaths}
            - Display metadata for progress: counts of required checks per node.

        - The client builds the working copy initially from this payload.

- Local state model
    - WorkingCopyContext
        - Holds the editable graph for this reviewId.
        - Tracks per-field check states: { entityKey, fieldPath } → checked:boolean.
        - Tracks derived flags: changed:boolean per field, per entity, and rollups.

    - Persistence
        - LocalStorage: key = review:{reviewId}.
        - Auto-save on changes, restore on mount.

- Acceptance criteria (Phase 2A)
    - The three screens render correctly from the schema and server payload.
    - Progress and completion roll up accurately for piece, collection, and source.
    - Navigation between Overview → Piece Checklist → Overview preserves state.
    - Do-not-review-twice entities are omitted and not editable unless user is ADMIN.

#### Phase 2B — Edit forms wiring (reuse existing forms against the working copy) Goal: Reuse existing data-entry forms to edit the working copy, without touching the DB until submit.

- “Edit” button launch behavior
    - Each field block has an Edit action that:
        - Opens the corresponding edit form (drawer/modal/route section).
        - The form receives initialValues from the working copy slice for that entity.
        - On save:
            - Writes the updated values back into the working copy.
            - Emits a “value changed” event to recompute field diffs and reset checkmarks for touched fields.

- Form adapter layer
    - Implement a small adapter per entity type to map:
        - WorkingCopy slice ⇄ existing form props/DTOs (e.g., normalization for nested relations like movements/sections).
        - Change impact: which fieldPaths to mark as changed/reset.

    - Ensure each form operates purely on props/state; no server calls.

- Change impact rules
    - Maintain a map per entity type:
        - fieldPath → affectedFieldPaths
        - Example:
            - Changing a timeSignature in Section resets:
                - section.timeSignature
                - and derived displays that rely on beats-per-bar if present.

    - Upon successful edit, set changed=true for affected fields and set checked=false for them.

- Validation and constraints
    - Use the same schema/validation as original data-entry forms.
    - In the piece checklist, invalid form state blocks Save with visible inline messages.
    - Optional: highlight invalid entity blocks in the checklist until corrected.

- Admin override
    - Admin can edit globally-reviewed entities in this flow only if explicitly enabled in UI (hidden by default).
    - By default, globally-reviewed entities are non-editable and omitted from the checklist.

- Acceptance criteria (Phase 2B)
    - All relevant entity forms can open from checklist and save back to the working copy.
    - Saving a change resets related checks and marks fields as changed.
    - No network requests are made during editing; all happens in memory until final submission.
    - Attempts to edit a filtered “do-not-review-twice” entity are blocked (unless ADMIN override is active).

#### Phase 2C — Finalize wiring: diffs, server validation, and transactional apply Goal: Compute per-entity diffs, validate checklist completeness server-side, and apply changes atomically.

- Client submit payload
    - POST /api/review/:reviewId/submit
        - { workingCopy, checklistState, overallComment }
        - workingCopy: full graph of edited entities scoped to the review.
        - checklistState: array of checked items { entityType, entityId, fieldPath } only for required fields.

- Server-side validation
    - Recompute required fields from ReviewChecklistSchema based on the actual DB graph and “do-not-review-twice” exclusions for this review.
    - Ensure that for each required field, there is a corresponding checked=true.
    - Reject if any required field is missing from checklistState or if data fails domain validation.

- Diff computation strategy
    - For each submitted entity:
        - Load current DB row(s).
        - Compare fieldPaths present in the ReviewChecklistSchema scope.
        - Classify operation: CREATE (new nested child), UPDATE, DELETE (for removed nested child).
        - Build before/after snapshots for changed entities/nodes only.

- Transactional apply
    - In one transaction:
        - Apply CRUD to all changed entities.
        - Create AuditLog rows for each changed entity (see Phase 2D).
        - Upsert ReviewedEntity rows for newly reviewed Person/Organization/Collection-desc/Piece-desc entities encountered in scope.
        - Set Review.state = APPROVED; set endedAt.
        - Update MMSource.reviewState = APPROVED.

- Acceptance criteria (Phase 2C)
    - Server rejects incomplete checklists even if client shows 100% (covers race or schema drift).
    - All updates are atomic; partial failure rolls back everything.
    - Response returns a summary: counts by operation and list of entity types touched.

#### Phase 2D — AuditLog implementation Goal: Record robust provenance snapshots for every entity touched by a review.

- Table and indexes
    - AuditLog
        - id
        - reviewId
        - entityType
        - entityId
        - operation: CREATE | UPDATE | DELETE
        - before: jsonb (nullable)
        - after: jsonb (nullable)
        - authorId
        - createdAt
        - comment (nullable)

    - Indexes:
        - (reviewId)
        - (entityType, entityId, createdAt desc)

- Snapshot shape
    - Use consistent serialization for before/after:
        - Only persisted fields (no transient/computed props).
        - Include IDs for nested relations only when they are first-class entities; otherwise embed sub-objects as needed.

    - Strip sensitive or irrelevant fields if any (e.g., internal flags).

- Server write policy
    - Only write an AuditLog row if there’s a change or a CREATE/DELETE occurs.
    - For UPDATEs:
        - before: full snapshot of the entity row(s) at read time.
        - after: full snapshot after apply.

    - For CREATE/DELETE:
        - Use null accordingly.

    - Attach authorId = Review.creatorId.
    - Attach comment if the finalize request includes a review-level comment.

- Read API (for Phase 3 admin UX, but implementable now)
    - GET /api/review/:reviewId/audit?cursor=&limit=
        - Returns paginated list of audit entries.

    - GET /api/audit/search?entityType=&entityId=&cursor=&limit=
        - For back-office search.

- Acceptance criteria (Phase 2D)
    - Each changed entity in a finalized review results in one AuditLog row with accurate before/after.
    - CREATE/DELETE are correctly captured with null before/after respectively.
    - Audit rows are written inside the same transaction as the changes.

#### Phase 2E — Checklist schema finalization and cross‑cutting concerns Goal: Lock down the single source of truth for checklist requirements and ensure both UI and server agree.

- ReviewChecklistSchema
    - For each entityType:
        - fields: [{ fieldPath, label, required: boolean | (ctx) => boolean }]
        - Conditions can depend on related data (e.g., a tempo indication may be required only if a section exists).

    - Provide a helper to:
        - Expand required fields for a given graph.
        - Return a flattened list of { entityType, entityId, fieldPath }.

    - This helper is used:
        - Client-side: to render and compute progress.
        - Server-side: to validate completeness against submitted checklistState.

- Do-not-review-twice enforcement
    - Server includes flags for globally reviewed entities in the overview payload.
    - Client removes these blocks from rendering and disables edit buttons (unless ADMIN override).
    - Server re-applies the rule on submit (authoritative).

- Field path convention
    - Adopt a stable naming like:
        - piece.title, piece.nickname
        - pieceVersion[uuid].ordering
        - movement[uuid].title
        - section[uuid].timeSignature
        - tempoIndication[uuid].text
        - metronomeMark[uuid].noteValue and metronomeMark[uuid].bpm

    - Client and server share the same convention for diffing and check mark mapping.

- Acceptance criteria (Phase 2E)
    - Schema changes immediately propagate to UI and server validation without divergence.
    - Conditional requirements work and are test-covered.

#### Phase 2F — QA, tests, and resilience Goal: Ensure correctness and prevent regressions.

- Unit tests
    - Checklist schema expansion:
        - Given a mocked entity graph, compute required fields and verify count/paths.

    - Diff engine:
        - CREATE/UPDATE/DELETE per entity type produce expected before/after.

    - Audit composer:
        - Given diffs, write correct AuditLog rows.

    - ReviewedEntity upserts:
        - Persons/Orgs/Collection-desc/Piece-desc handled; structure-only entities excluded.

- Integration tests
    - Start → edit → submit:
        - Verify one transaction applies CRUD and logs.

    - Abort leaves no entity changes, only review state updated.
    - Do-not-review-twice:
        - If an entity is marked reviewed globally, it is omitted and non-editable; submit still passes completeness.

- UI tests
    - Editing resets checks for impacted fields.
    - Submit disabled until 100% checks complete.
    - Progress rollups show accurate counts.

- Resilience
    - Local storage corruption handling: detect invalid JSON, reset cleanly with a user prompt.
    - Idempotency (optional): allow a requestId header; can be deferred to Phase 3.

#### Phase 2G — Deliverables and sequencing Recommended order of implementation to keep momentum and minimize rework:

1. Schema helper and field path convention (Phase 2E foundation)
2. Review Overview and Collection Overview screens (Phase 2A skeleton)
3. Piece Review Checklist basic rendering from schema (no edit yet)
4. Form adapter wiring and change-impact rules (Phase 2B)
5. Client diff pre-check and submit payload shaping (Phase 2C prep)
6. Server: finalize endpoint with validation → diff → transactional apply (Phase 2C)
7. AuditLog write path and minimal audit read API (Phase 2D)
8. Tests across units/integration/UI (Phase 2F)
9. Polishing: filters, progress accuracy, guard rails, admin override off by default

#### Phase 2 — Acceptance criteria (global)
- The three review screens exist and mirror the structure described in the specs (source overview → collection overview → piece checklist).
- Edit buttons open existing forms and save back to the local working copy; changed fields are tracked and their checks reset.
- Submit enforces server-side completeness and applies changes atomically, writing accurate AuditLog rows and updating ReviewedEntity where applicable.
- “Do-not-review-twice” exclusions are honored and enforced both client-side and server-side.
- Adequate tests cover schema expansion, diffs, audit composition, and critical UX flows.

Notes on scope and risk
- Biggest risk is schema drift between UI and server. Mitigate by centralizing ReviewChecklistSchema and sharing field path helpers.
- Nested updates (movements/sections/MMs) require careful diffing to distinguish UPDATE vs CREATE/DELETE. Write focused unit tests for these.
- Keep admin override out of the initial release to reduce complexity; add in Phase 4 back-office.

### Phase 3 (comfort and quality)

- Checklist QoL: progress indicators, filters (unchecked/changed), show changed vs unchanged.

### Phase 4 back-office

- Admin panel:
    - View and abort active reviews.
    - Search AuditLog by entity.
    - ...

### Phase 5 (optional)

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