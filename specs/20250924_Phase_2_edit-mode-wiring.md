### Short answer
Yes. We should plan the edit-mode wiring in detail before implementation. This work sits at the seam between two complex UIs (review checklist and the existing multistep feed form), and getting the bridge right avoids subtle state, navigation, and persistence bugs. Below is a precise, implementation-ready plan aligned with your specs.

### Objectives recap (Phase 2, point 1)
- From any checklist row, open the existing multistep feed form “as-is,” with only:
  - A persistent banner indicating “Edit mode within an in‑progress review.”
  - A “Back to review” button.
- On return, restore the exact review slice and scroll, recompute required checklist items for the updated working copy, and reset checkmarks for impacted fields.
- No server writes happen in edit mode; edits update only the local review working copy until final submit.

### High-level architecture
- Introduce a small adapter layer that converts between:
  - Review `workingCopy` (per `reviewId`), and
  - Feed form’s `FeedFormState` (the state the multistep editor restores from localStorage).
- Use localStorage as the single integration channel, per the spec. No special URLs.
- Embed a `reviewContext` object in `FeedFormState.formInfo` to turn on banner/back button and carry anchors.
- Store a `returnRoute` payload on the review side to restore slice + scroll.

### Data contracts
- Review localStorage keys (already present):
  - `review:{reviewId}:workingCopy` → `{ graph, updatedAt }`
  - `review:{reviewId}:checklist` → `string[]` of encoded keys
- Add two transient keys:
  - `review:{reviewId}:returnRoute` → `{ reviewId, sliceKey, scrollY }`
  - `feedForm:boot` → The full `FeedFormState` the feed form should boot with.
- Feed form `formInfo.reviewContext` (new, UI-only):
  ```ts
  type ReviewContext = {
    reviewId: string;
    reviewEdit: true; // toggles banner + back button in feed form
    updatedAt: string; // ISO
    anchors?: { pvId?: string; movId?: string; secId?: string; mmId?: string };
  }
  ```

### Field-paths and anchors (deterministic mapping)
- Checklist `fieldPath` must deterministically imply an anchor:
  - `MM_SOURCE.*` → no anchor
  - `COLLECTION:{collectionId}.*` → opens collection description step
  - `PIECE:{pieceId}.*` → opens piece description step
  - `PIECE_VERSION:{pieceVersionId}.*` → opens structure step at PV
  - `MOVEMENT:{movementId}.*` → opens structure step at that movement
  - `SECTION:{sectionId}.*` or `TEMPO_INDICATION:{tempoIndicationId}.*` → open section step at that section
  - `METRONOME_MARK:{mmId}.*` → open section step scrolled to that MM (via `mmId`)
  - `REFERENCE:{referenceId}.*` and `CONTRIBUTION:{contribId}.*` → open source metadata step
- These anchors become `reviewContext.anchors` for the feed form to focus the right sub-entity.

### Modules and responsibilities
1) `utils/reviewEditBridge.ts` (new)
- `buildFeedFormStateFromWorkingCopy(workingCopy, fieldPath, ctx)`:
  - Input: review `graph`, clicked `fieldPath`, and minimal `ctx` with `reviewId`, `sliceKey`.
  - Output: full `FeedFormState` including `formInfo.reviewContext` and `formInfo.currentStepRank` computed via a step map.
  - Responsibilities:
    - Map review graph to feed form structure, preserving stable ids and ranks.
    - Resolve anchors from `fieldPath`.
    - Set `formInfo` flags for a deterministic boot (e.g., `introDone=true`).
- `rebuildWorkingCopyFromFeedForm(feedFormState)`:
  - The inverse mapping used on return to reconstruct the review `graph` from the feed state.
- `resolveStepForFieldPath(fieldPath)`:
  - Converts a `fieldPath` to the step rank/index used by the feed form. Co-locate a table-driven map beside the checklist schema.

2) Checklist page integration (client)
- On “Edit” for an item:
  - Capture `{ sliceKey, scrollY }`.
  - Read `workingCopy` from `ReviewWorkingCopyProvider.get()`.
  - Call `buildFeedFormStateFromWorkingCopy(workingCopy, fieldPath, { reviewId, sliceKey })`.
  - `localStorage.setItem('feedForm:boot', JSON.stringify(feedFormState))`.
  - `localStorage.setItem('review:{reviewId}:returnRoute', JSON.stringify({ reviewId, sliceKey, scrollY }))`.
  - Navigate to `/feed` (or the feed form route the app uses).

3) Feed form boot logic (client)
- On mount:
  - If `feedForm:boot` exists, parse it and overwrite the feed form’s own storage key, then remove `feedForm:boot`.
  - Check `formInfo.reviewContext?.reviewEdit === true`:
    - Show the banner (copy from spec).
    - Render a persistent “Back to review” button in the form layout header.
  - If `reviewEdit` is true and anchors exist, scroll/focus the targeted node after the step is mounted.

4) “Back to review” behavior (client)
- On click:
  - Persist current `FeedFormState` to its localStorage key.
  - `postMessage` or simply leave it in localStorage; then navigate back to the review route (`/review/{reviewId}/checklist`).
- Checklist page on mount detects feed-form state presence:
  - Read the feed form localStorage key.
  - `rebuildWorkingCopyFromFeedForm(state)` → `nextGraph`.
  - Compute impact-scoped reset:
    - Diff `previousWorkingCopy` vs `nextGraph` to get `impactedPaths`.
    - Re-expand required checklist items from `nextGraph` and globally reviewed rules.
    - Update `checkedMap` as per spec (impacted → false; preserve others; initialize newly added; delete removed).
    - Update `changed` flags against the initial baseline.
  - Save new `workingCopy` via `ReviewWorkingCopyProvider.save(nextGraph)` and persist `checkedMap` to `review:{reviewId}:checklist`.
  - Remove the feed form localStorage key entirely (per spec) to avoid stale context.
  - Restore `{ sliceKey, scrollY }` from `review:{reviewId}:returnRoute` and then delete that key.

### UI/touch points to modify
- Feed form layout component:
  - Adds review banner and a `Back to review` button whenever `formInfo.reviewContext.reviewEdit === true`.
- Checklist item rows:
  - “Edit” button calls the bridge as described.
- Checklist page bootstrap:
  - If it finds feed-form state, runs the return flow and resets impacted checks.

### Step map (draft to confirm)
- Map `fieldPath` entity to feed form step:
  - `MM_SOURCE` → Source metadata step (references, contributions also here)
  - `COLLECTION` → Collection step (description)
  - `PIECE` → Piece description step
  - `PIECE_VERSION`, `MOVEMENT`, `SECTION`, `TEMPO_INDICATION`, `METRONOME_MARK` → Structure step
  - `PERSON`, `ORGANIZATION` (via contributions) → Source metadata step
- Co-locate as a constant in `reviewEditBridge.ts` and reuse in tests.

### Open decisions (please confirm)
- Feed form storage key name. If it’s already defined (e.g., `feedForm:state`), we will reuse it. Otherwise we will introduce a constant and migrate the feed form to read it.
- Exact route of the feed form (`/feed` vs `/feed/[id]`): the bridge will navigate to that route.
- Scroll restore: we’ll store `scrollY` and optionally `sliceKey` to focus the right table section. OK?
- Anchoring inside the feed form: we’ll implement minimal scroll-to-entity if `anchors` include a specific `secId` or `mmId`. Is focusing sufficient (no additional highlight)?

### Risk areas and mitigations
- Mismatch between review graph and feed form state shape:
  - Mitigate via unit tests on both `buildFeedFormStateFromWorkingCopy` and `rebuildWorkingCopyFromFeedForm` for each entity type.
- LocalStorage residue causing ghost banners:
  - Always delete feed form storage on successful return. Add a timeout guard to also clear if a review is not IN_REVIEW.
- Anchors failing due to lazy rendering:
  - Use a small retry with `requestAnimationFrame` or a MutationObserver to scroll once the DOM for the step is ready.

### Testing plan
- Unit
  - Bridge mapping both ways for: Source/Reference/Contribution, Collection, Piece, PV, Movement, Section, TempoIndication, MetronomeMark.
  - Step-resolution from `fieldPath` → `currentStepRank`.
- Integration (jsdom/RTL)
  - Checklist → Edit → Feed form shows banner, navigates to correct step, anchor applied.
  - Back to review → working copy rebuilt, impacted checks reset, globally reviewed rule re-applies, scroll restored.
- Manual flows
  - Edit a globally reviewed entity (e.g., Piece description); verify it reappears in the checklist after return.

### Incremental implementation plan (PR-sized steps)
1) Scaffolding
  - Create `utils/reviewEditBridge.ts` with type stubs, step map, and TODO test list.
  - Add `reviewContext` handling in feed form layout (banner + back button) gated on `formInfo.reviewContext.reviewEdit`.
2) Outbound navigation from checklist
  - Implement building and writing `FeedFormState` to `feedForm:boot` and `returnRoute`.
  - Navigate to feed form route.
3) Feed form boot consumption
  - On mount, consume `feedForm:boot`, persist to its own key, clear `feedForm:boot`, and honor anchors.
4) Back-to-review return path
  - Implement return flow in checklist: rebuild working copy, impact reset, recompute required, clear feed state, restore slice/scroll.
5) Tests and edge cases
  - Unit tests for bridge; RTL tests for round-trip.

### Acceptance criteria
- From any checklist row, clicking “Edit” opens the feed form at the correct step and anchor, with banner/back button.
- Returning to the checklist restores the original slice and scroll.
- Required items and changed hints recompute correctly; impacted fields are unchecked, unaffected checks preserved.
- All state remains local until final submit; abort clears local review storage as before.

### Timeline (rough)
- Planning + scaffolding: 0.5–1 day
- Bridge mapping (two-way) + checklist integration: 1.5–2.5 days
- Feed form UI adjustments + anchors: 0.5–1 day
- Tests + hardening: 1–2 days

If you confirm the open decisions (storage key, feed route, anchor expectations), I can start implementing Step 1 immediately and proceed in small PRs per the plan above.