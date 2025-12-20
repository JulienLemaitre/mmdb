# Review submit

## Overview

### Current state of the review interface

At this point, the review interface is ready and allows a reviewer:
- to select the metronome mark source to review from a list of unchecked MM sources, making it locked and unavailable for other reviewers until completion or abortion.
- to check each bit of data from the selected metronome mark source.
- to switch to the Feed form to make any necessary correction on the data being reviewed and come back to the review interface with the corrected data to be reviewed again.
- compute an audit log entries from the changes made compared to the original data entered in the Feed form.
- abort the review, unlocking the MM source for other reviewers.
- submit the review.

the review submit route is already making the following:
- check that it received the review workingCopy, checklistState and overallComment from the client.
- fetch from the database the reviewed MM source data.
- recompute the required item list to be reviewed.
- check that checklistState has all the required items checked.
- compute diffs between original data and review working copy
- compose audit log entries


### Nex step: persist to the database

In the review submit route file `app/api/review/[reviewId]/submit/route.ts`, we need to implement the logic to persist the review to the database, as laid out in the TODO comments:
```typescript
  // TODO: real implementation, here we need:
  //  - Verify Review state and ownership (IN_REVIEW) via Prisma
  //  - single transaction to apply CRUD changes and write audit log rows
  //  - Upsert ReviewedEntity rows as per rules
  //  - Flip Review state and MMSource reviewState to APPROVED
```

## Me to AI

I am implementing a review process for a web app that is aimed at entering data related to the speed of execution from musical scores.
The specs has been laid out in two files: @file:20250921_review-process_specs.md and @file:20251025_GPT-5_plan-for-specs-implementation.md .

the review process is functional, and I need now to tackle the persistence to the database of the data changes that the reviewer made, as well as an audit log that keep track of the before and after for each entity that has been changed.

I began the specification file for this phase, and I need you to complete this spec file with a detailed roadmap and all its implementation details: @file:20251119_review_submit.md

To help grasp the details of the web app structure, I share the database Prisma schema here: @file:schema.prisma . And also the folder with my types is  @folder:types .

I need you to think deeply on this one, this is a critical part because we need to have a proper data review process.

Please ask any question or information if you are missing anything to deliver the best as you can.

## AI response - Gemini 3 Pro

I will now generate the detailed specification file for the review submission process, covering the persistence strategy, transactional logic, and audit logging as requested.

## Roadmap

1.  **Server-Side Validation**: Ensure the user is the owner of the review and the review is currently `IN_REVIEW`.
2.  **Change Detection & Audit Preparation**: Use the existing `composeAuditEntries` to generate the JSON payloads for the `AuditLog` table.
3.  **Data Persistence Strategy (The Transaction)**:
    *   Execute all database mutations within a single `prisma.$transaction`.
    *   **Order of Operations**:
        1.  **Deletes**: Remove entities that exist in the baseline but are missing from the working copy (respecting referential integrity).
        2.  **Upserts (Independents)**: Create or Update "leaf" or shared entities (Person, Organization, TempoIndication).
        3.  **Upserts (Dependents)**: Create or Update hierarchical entities (Collection, Piece, PieceVersion, Movement, Section, MetronomeMark).
        4.  **Associations**: Re-establish relationships (especially `MMSourcesOnPieceVersions` for ordering).
        5.  **Audit Logging**: Bulk insert the computed audit entries.
        6.  **Global Reviewed Flags**: Upsert `ReviewedEntity` records.
        7.  **State Finalization**: Update `Review` and `MMSource` status to `APPROVED`.

## Implementation Details

### 1. Validation & Preparation

Before starting the transaction, we perform checks that don't require a write lock.

*   **Inputs**: `reviewId`, `workingCopy`, `checklistState`, `overallComment`.
*   **Fetch**: Get the `Review` record from DB including `creatorId` and `state`.
*   **Check**:
    *   `Review.state` must be `IN_REVIEW`.
    *   `Review.creatorId` must match `session.user.id`.
*   **Baseline**: Fetch the current DB state (using `getReviewOverview` logic) to serve as the "Before" snapshot.

### 2. Audit Log Generation

We utilize the `composeAuditEntries` function (already implemented) which compares `baselineGraph` and `workingCopy`.

```typescript
const auditEntries = composeAuditEntries(reviewId, baselineGraph, workingCopy);
```


This list provides the payloads for the `AuditLog` table. Note that while `auditEntries` tells us *what* happened, strictly following it to apply DB updates can be complex due to dependencies. It is safer to use `auditEntries` for the log table, and use a graph traversal strategy for the actual data updates.

### 3. The Transactional Logic (`applyChangesToDatabase`)

All operations below must run inside `prisma.$transaction(async (tx) => { ... }, { timeout: 20000 })`.

#### A. Deletion Logic
We must detect entities removed from the graph.
*   **Method**: For each entity list in `baselineGraph` (e.g., `pieces`), check if the ID exists in `workingCopy`. If not, delete.
*   **Order (Cascading)**:
    1.  `MetronomeMark` (orphan removal if section stays but MM is gone).
    2.  `Section` (cascades to MMs).
    3.  `Movement` (cascades to Sections).
    4.  `PieceVersion` (cascades to Movements).
    5.  `Contribution` / `Reference`.
    *   *Note*: `Person`, `Organization`, `Collection`, `Piece` are rarely deleted, but if they are disconnected and orphaned, strict clean-up might be needed. For this phase, focus on removing entities strictly within the scope of the `MMSource` (Contributions, References, MMs) and the piece structure if created specifically for this view.

#### B. Independent Entity Upserts
Iterate through `workingCopy` lists: `persons`, `organizations`, `tempoIndications`.
*   **Logic**:
    *   If `id` exists in DB (check against baseline): Update fields.
    *   If `id` is new (not in baseline): Create.

#### C. Hierarchical Upserts
This requires traversing the graph top-down to ensure parent IDs exist before children are attached.

1.  **MMSource**: Update `title`, `type`, `link`, `permalink`, `year`, `isYearEstimated`, `comment`.
2.  **References**:
    *   Sync the list: Delete missing, Create new, Update existing.
3.  **Contributions**:
    *   Sync the list. Ensure `personId` XOR `organizationId` logic is respected.
4.  **Collections**: Upsert.
5.  **Pieces**: Upsert (link to `collectionId`, `composerId`).
6.  **PieceVersions**:
    *   Upsert `PieceVersion` (link to `pieceId`).
    *   **Movements**:
        *   Sync list for this PV. Upsert `Movement`.
        *   **Sections**:
            *   Sync list for this Movement. Upsert `Section` (link to `tempoIndicationId`).
            *   **MetronomeMarks**:
                *   Sync list for this Section. Upsert `MetronomeMark`.

#### D. Associations (MMSourcesOnPieceVersions)
The ordering of piece versions within the source is critical.
*   **Action**:
    *   Delete all `MMSourcesOnPieceVersions` where `mMSourceId` = current source.
    *   Create new records based on `workingCopy.sourceOnPieceVersions` to reflect the validated rank and structure.

#### E. Audit Logs
Bulk insert the pre-computed entries.
```typescript
await tx.auditLog.createMany({
  data: auditEntries.map(entry => ({
    reviewId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    operation: entry.operation, // Cast string to enum
    before: entry.before ?? Prisma.DbNull,
    after: entry.after ?? Prisma.DbNull,
    authorId: userId,
    // Optional: attach specific comments if we had field-level comments
  }))
});
```


#### F. Global Reviewed Flags (`ReviewedEntity`)
We need to mark entities as "Reviewed" so they don't appear in future checklists (the "Do not review twice" rule).
*   **Scope**: `PERSON`, `ORGANIZATION`, `COLLECTION`, `PIECE`.
*   **Logic**: Iterate through all valid entities of these types in the `workingCopy`.
*   **Action**:
```typescript
await tx.reviewedEntity.upsert({
      where: {
        entityType_entityId: { entityType: '...', entityId: '...' }
      },
      update: {
        reviewedAt: new Date(),
        reviewedById: userId,
        reviewId: reviewId
      },
      create: {
        entityType: '...',
        entityId: '...',
        reviewedById: userId,
        reviewId: reviewId
      }
    });
```


#### G. State Finalization
*   Update `Review`:
```typescript
await tx.review.update({
      where: { id: reviewId },
      data: {
        state: 'APPROVED',
        endedAt: new Date(),
        overallComment: overallComment
      }
    });
```

*   Update `MMSource`:
```typescript
await tx.mMSource.update({
      where: { id: sourceId },
      data: {
        reviewState: 'APPROVED'
        // Optional: update sectionCount denormalization here
      }
    });
```


### 4. Error Handling & Response

*   **Success**: Return `ReviewSubmitSuccess` (ok: true, summary).
*   **Error**:
    *   If transaction fails, return 500 with error message.
    *   Log the specific Prisma error for debugging.

## Data Integrity Considerations

*   **FK Constraints**: The top-down creation order in the transaction prevents FK violations.
*   **Orphans**: The deletion logic must ensure that removing a PieceVersion cleans up its Movements/Sections (Prisma `onDelete: Cascade` handles this in the schema, but we must ensure the root of the deletion is identified).
*   **Concurrency**: The `IN_REVIEW` state acts as a lock. The initial validation ensures only one transaction can finalize the review.

## Dependencies

*   `@/features/review/utils/auditCompose`: `composeAuditEntries`
*   `@/types/reviewTypes`: `AuditEntry`, `AuditOperation`
*   `@/types/formTypes`: `PersistableFeedFormState` (structure reference)
*   `PrismaClient`: for `$transaction`

## Testing Strategy

### Unit Tests
*   **`composeAuditEntries`**: Verify it correctly generates `CREATE`, `UPDATE`, `DELETE` operations for nested structures (e.g., removing a Metronome Mark, adding a Section).
*   **`applyChangesToDatabase` (Mocked)**: Mock Prisma and verify the transaction order:
    *   Deletes happen before Creates.
    *   Parent entities (Piece) are upserted before Children (PieceVersion).
    *   `ReviewedEntity` flags are set for the correct entities.

### Integration Tests (API Route)
*   **Successful Submit**:
    *   Setup: A review in `IN_REVIEW` state with some changes in `workingCopy`.
    *   Action: POST to `/api/review/[id]/submit`.
    *   Assert:
        *   Response is 200 OK.
        *   DB reflects changes (e.g., new BPM value).
        *   `AuditLog` table contains expected entries.
        *   `Review` and `MMSource` states are `APPROVED`.
        *   `ReviewedEntity` rows exist for touched global entities.
*   **Validation Failures**:
    *   **Not Owner**: Attempt submit with different user -> 403/401.
    *   **Wrong State**: Attempt submit on `PENDING` or `APPROVED` review -> 400.
    *   **Incomplete**: Attempt submit with missing required checks (should be caught before DB logic, but good to verify safety net) -> 400.
*   **Concurrency**:
    *   Simulate two concurrent submits (unlikely via UI but possible API usage). The database transaction isolation should handle this, or the first one wins and the second fails on state check.