# Review process specs implementation details

## Executive summary

- Single source of truth: The “current” data is always the result of the latest approved review.
- One active review per MM Source: enforced by a unique partial index and transactional lock.
- Lightweight global “do-not-review-twice” mechanic: a ReviewedEntity registry marks Person/Organization/Collection(description)/Piece(description) as globally reviewed (display rule only; can be reintroduced if edited during a review).
- Edit workflow separation: the review UI is check-only; when a change is needed, the user explicitly switches to the standard multistep data‑entry UI (unmodified except for a banner and “Back to review”). Both UIs operate on the same local working copy; server writes happen only on final submit with audit logs in one transaction.
- Audit trail with JSONB snapshots: simple, reliable, sufficient for research-grade provenance.
- Declarative review checklist schema: one TypeScript map enumerates which fields must be checked per entity; UI renders a sequential, check-only view from that single source of truth.
- Review mode is check-only; all edits (including globally reviewed entities) happen in the standard multistep data-entry flow, unmodified except for a banner and a “Back to review” button.

## Architectural decisions

- Do not reuse FeedFormContext and its reducer for the review process.
    - Rationale: different semantics (per-field checks and reviewId scoping), risk of state coupling and localStorage collisions, and clearer debuggability when separated.
- Introduce a dedicated ReviewWorkingCopyContext
    - Scope: per reviewId; holds a local working copy of the entity graph and checklist state (checked/changed).
    - Persistence: localStorage key review:{reviewId}. Abort must clear this key.
    - Progress: derive rollups at piece, collection, and source levels.
- Edit via explicit UI switch to the multistep data-entry flow
    - The multistep flow is used as-is (no conditional rendering) with only:
        - A persistent banner describing edit-in-review context.
        - A “Back to review” button to return to the exact checklist slice and restore scroll.
    - On save within edit mode: merge into working copy; mark changed=true; reset checked=false; recompute rollups.
- “Do-not-review-twice” as a display rule
    - Omit Person/Organization/Collection(description)/Piece(description) in review mode if globally reviewed; BUT edits in edit mode reintroduce them into the current review’s checklist.
- Finalize reviews transactionally
    - Validate required checks from a shared ReviewChecklistSchema, compute diffs, apply changes, write AuditLog, upsert ReviewedEntity, and update states in one transaction.

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
    - Purpose: globally signals “already reviewed, omit by default in review mode.”
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
- MMSourcesOnPieceVersions (tweak)
    - Surrogate primary key id (UUID).
    - unique(mMSourceId, rank) and unique(mMSourceId, pieceVersionId).

## Core lifecycle

- To‑review list (already implemented)
  - as specified, hide items in IN_REVIEW.

- Start review (lock)
    - Reviewer clicks “Start review” and confirms.
    - Validate REVIEWER+ role and creatorId != source.creatorId; enforce single IN_REVIEW per source.
    - Create Review IN_REVIEW; set MMSource.reviewState = IN_REVIEW.
    - This acts as a lock; the item disappears from the “to review” list for everyone else.

- Working copy and edit mode
    - Review mode is check-only; no server writes.
    - Edit mode uses the standard multistep "feed" flow (as-is) with:
        - Banner: “Edit mode: You are editing data within an in-progress review. Changes are saved locally and will only be persisted when you approve the review.”
        - “Back to review” button to return to the exact slice and restore scroll.
    - All edits (including structural and globally-reviewed entities) update the same working copy.

- Checklist coverage (exhaustive)
    - ReviewChecklistSchema defines all required fields per entity.
    - Display rule: omit globally reviewed entities unless they were changed during this review; if changed, include them and require checkmarks.

- Submit review
    - Client sends workingCopy, checklistState (checked items), overallComment.
    - Server transaction:
        - Validate Review ownership/state.
        - Recompute required fields from schema against the actual DB graph (authoritative).
        - Verify every required item is checked; reject otherwise.
        - Compute diffs vs DB; apply CRUD; write AuditLog.
        - Upsert ReviewedEntity for Person/Organization/Collection-desc/Piece-desc encountered as newly reviewed or re-reviewed.
        - Set Review.state = APPROVED; update MMSource.reviewState = APPROVED; set endedAt.

- Abort review
    - Set Review.state = ABORTED, endedAt = now; update MMSource.reviewState = ABORTED; clear client working copy.

Authorization and roles
- Roles: USER < EDITOR < REVIEWER < ADMIN.
- Gate the review UI and endpoints to REVIEWER+.
- Enforce “reviewer cannot review own MM Source” on review start.

## Review mode behavior

- Sequential slices UI: Source → Collections → Pieces → Sections.
- Metronome Marks will be displayed alongside the section it relates to. (these are separated steps in "feed" form, and righlty so. So if changes are needed, we need to know if it is the section or its related Metronome Mark that needs change)
- Each required field has a checkbox; no inline editing; no filters, only visual hints for “unchecked” and “changed.”
- "Changed" definition: any field whose current working-copy value differs from its initial value at review start.
    - Effects: changed fields auto-reset their checkbox to unchecked and show a “changed” visual hint.

- Recompute on return
    - On returning from edit mode, recompute the required checklist from the working copy.
    - Re-apply display rule and reintroduce globally reviewed entities that changed during this review.

## Deep-linking into edit mode (placeholders to be filled)

- Entry step resolution
    - [AUTHOR TO SPECIFY]: mapping from current checklist slice to the initial multistep form step.

- Anchors and focus
    - [AUTHOR TO SPECIFY]: how to pass anchors (e.g., pieceVersionId, movementId, sectionId) to auto-focus/scroll the target sub-entity.

- Return behavior
    - [AUTHOR TO SPECIFY]: how “Back to review” restores the same slice and scroll position.

## API design

- POST /api/review/start { mmSourceId } → { reviewId }
- GET /api/review/:reviewId/overview
    - Returns initial graph for the working copy, globally reviewed flags, and source contents join rows [{ joinId, mMSourceId, pieceVersionId, rank, pieceId, collectionId, collectionRank }].
- POST /api/review/:reviewId/submit { workingCopy, checklistState, overallComment }
    - Server recomputes required items, validates completeness, applies diffs, writes audit logs, upserts ReviewedEntity, flips states atomically.
- POST /api/review/:reviewId/abort { reason? }
- GET /api/mMSource/toReview
    - Returns list with: title, composers, link, enteredBy, sectionsCount, creationDate.
    - List excludes sources with an active IN_REVIEW.

## Server validation and diffs

- Completeness
    - Compute required items from ReviewChecklistSchema based on DB state; ensure each has a checked item in payload.

- Diff strategy
    - For each entity type in scope: load DB rows, compute field-level changes.
    - Classify CREATE/UPDATE/DELETE for nested nodes.
    - For MMSourcesOnPieceVersions rank updates: offset ranks then normalize to avoid unique collisions.

## Working copy and field paths

- Stable addressing
    - Use stable IDs in field paths; never index-based.
    - Non-singleton entity paths must include ids.

- Persistence
    - localStorage key: review:{reviewId}; cleared on abort.

## Locking and access guards

- Redirect when:
    - User tries to access a review they don’t own (unless ADMIN).
    - Review is not IN_REVIEW.
- One IN_REVIEW per source enforced by unique partial index.

## Checklist schema and display rule

- Schema shape
    - fields: [{ fieldPath, label, required: boolean | (ctx) => boolean }].
    - Conditional requirements supported.

- Display rule
    - Omit globally reviewed Person/Organization/Collection-desc/Piece-desc unless changed in this review; if changed, include and require checks.

## UI specifics

- Visual hints only (no interactive filters)
    - Unchecked: highlight style.
    - Changed: badge/color.
- Progress indicators per slice and overall.
- Submit disabled until 100% required items are checked for the current working graph.

## Audit logging

- One row per changed entity with before/after snapshots.
- Operation: CREATE/UPDATE/DELETE accordingly.
- Author = Review.creatorId; optional review-level comment attached.

## Implementation sequencing

- Phase 1
    - DB and endpoints (start, overview, submit, abort).
    - To-review list and confirmation modal.
    - Checklist page skeleton with working copy persistence.
    - Locking and guards.

- Phase 2
    - Wire edit mode to multistep forms (banner + back button).
    - Adapters for existing forms; anchors for nested edits.
    - Changed/checked reset loop; recomputation on return.
    - Diff/submit path; transactional apply; audit logs; ReviewedEntity upserts.

- Phase 3
    - Progress polish and visual hints.
    - Minimal audit read API (optional).
    - Tests across units/integration/UI.

## Testing strategy

- Unit
    - Checklist expansion from schema and working copy.
    - Changed detection vs initial snapshot.
    - Diff composition per entity type.
    - Rank reordering safety.

- Integration
    - Start → edit → return → submit: recomputation and changed reset enforced; transactional apply and audit rows written.
    - Abort clears local working copy and frees the lock.
    - Access guards redirect correctly.

- UI
    - Check-only review mode; changed visual hints shown; submit gating accurate.
    - “Back to review” restores slice and scroll.

## Why this meets the requirements

- Keeps backend unchanged; focuses on simpler, safer UI.
- Strict separation of review (check-only) and edit (multistep) UIs via an explicit switch, avoiding hybrid/embedded editors.
- Strong provenance via AuditLog; consistent rules via centralized schema.
- Future-proof for admin tools and optional persistence of checklist items.