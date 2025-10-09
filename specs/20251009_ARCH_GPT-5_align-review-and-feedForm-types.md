## Me
You can see in my attached spec files chat I'm up to: implementing a review process for muscial score related data entered by user in a form called feedForm.
I decided recently that in the review process interface, it will only be possible to mark each piece of data as "checked". As soon as something has to be changed, being a value to correct or a whole piece section to add, the user will click a button and will be redirected to the feedForm, initialized with the data being reviewed.
He will be able to make the changes he wants and come back to the review interface when that's done.

I'm thinking about two things now that will probably necessitate some changes:

1. I would like the review process to be presented in a way very close to the feedForm. Right now it shows all the data to review in one page. I prefer to have it displayed with different screen:
- a summary view with the MMSource infos first and the ordered list of pieces it contains
- A collection view that is close to the previous one, with collection info replacing MMSource infos from the previous screen.
- A piece view, where we can see the movements and sections in the selected piece. The Metronome marks should be displayed along side the section it is related to.
  This will ease the review process, getting it done slice per slice.

2. Now that I decided to have a dynamic review interface, with a user getting back and forth between review and feedForm, I'm thinking that the context Types should be as close as possible. I began to use types from @file:feedFormTypes.ts into @file:ReviewChecklistSchema.ts , but I would like your thought on that. Also, the data is more in the form of nested object in feedForm context ,which is working well with the step form. I want to adopt the same approach for the review form but I don't know if I overlook some problem that will arise from this decision.

How do you analyze these reflexions and the directions i'm leaning to now?

## AI Assistant
Great directions. Here’s how I’d assess and recommend proceeding.

1) Review UI sliced like feedForm (summary → collection → piece)
- This is a good move. It aligns the reviewer’s mental model with how data was entered and reduces cognitive load.
- Proposed slice structure:
    - Summary slice: MMSource metadata + ordered list of included piece versions (using the same join ordering used in feedForm summary). This is the landing view.
    - Collection slice(s): show collection description when present; omit by default if “do-not-review-twice” applies, but reintroduce when edited in this review.
    - Piece slice(s): structured view showing piece description, piece versions with movements/sections. Display metronome marks inline with their section rows to keep context tight.
- Navigation: previous/next within slices; progress per slice and overall (you already have the rollups).
- This preserves the check-only rule while making edit targets obvious.

2) Converging types and nesting in review context
- Yes: make the review working graph as close as practical to the feedForm state shape. This minimizes adapter friction for the “edit in feedForm and return” loop.
- Strategy:
    - Keep a dedicated review graph type (to avoid tight coupling), but structure it to mirror feedForm slices and ids: same entity arrays, same nested relations (pieceVersions → movements → sections), and stable ids everywhere. This is already how you’re moving with ChecklistGraph.
    - Continue using the centralized ReviewChecklistSchema to expand required items from this nested graph. Your fieldPath convention with stable ids is the right backbone for persistence and diffing.
    - Use feedFormTypes where it makes sense for shared leaf types (e.g., MMSourceDescriptionState, PieceState) to avoid duplication, but keep review-specific types (workingCopy wrapper, checked map, baseline, progress) separate.
- Adapters:
    - One clear adapter in both directions (reviewEditBridge) is the right seam. Keep it thin by aligning shapes, and cover with unit tests for each entity.

Caveats and mitigations
- Drift risk: If feedForm evolves (steps/fields), mismatches can break the bridge. Mitigate by:
    - Co-locating a table-driven “entity → step” map and reusing it in tests.
    - Snap tests for buildFeedFormStateFromWorkingCopy and rebuildWorkingCopyFromFeedForm across all entities.
- “Do-not-review-twice” rule: Ensure it’s display-only at expand time, not encoded into the graph. On return from edit, re-expand checklist so edited globally-reviewed entities reappear automatically.
- Anchors and lazy DOM: Use a retry loop (requestAnimationFrame or MutationObserver) in feedForm to scroll to movement/section/mm anchors.
- Ordering checks: Keep both a logical “contents.order” item and per-join rank checks so reviewers can confirm the ordered list and each rank value.

Concrete next steps
- Implement the sliced checklist pages mirroring feedForm:
    - Summary page (MMSource + ordered contents).
    - Collection page(s): description-only.
    - Piece page(s): piece description + PV/movements/sections; MM inline with sections.
- Finalize the step map and anchors in reviewEditBridge:
    - MM_SOURCE, REFERENCE, CONTRIBUTION, PERSON, ORGANIZATION → source metadata step.
    - COLLECTION, PIECE → description step.
    - PIECE_VERSION, MOVEMENT, SECTION, TEMPO_INDICATION, METRONOME_MARK → structure step (MM anchor at section row).
- Align types:
    - Continue using feedFormTypes for shared slices; keep ReviewWorkingCopy as a wrapper with the nested graph mirroring feedForm’s shape.
    - Ensure field paths always include stable ids for non-singletons.
- Tests:
    - Round-trip adapter tests for all entities.
    - UI tests for sliced navigation and for MM inline with sections.
    - Impact-scoped reset tests when returning from feedForm.

Bottom line
- Your decisions—check-only review, dynamic back-and-forth to feedForm, and converging the data shapes—are sound and will reduce complexity and bugs.
- Keep the separation of concerns (distinct contexts) but align the nested shapes and types where possible, with a small, well-tested bridge layer. This will give you the slicewise review UX you want without duplicating editing logic.
