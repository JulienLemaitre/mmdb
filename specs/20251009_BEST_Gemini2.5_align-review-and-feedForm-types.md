## Me
Hi Gemini 2.5,

You can see in my attached spec files chat I'm up to: implementing a review process for musical score related data entered by user in a form called feedForm.
I decided recently that in the review process interface, it will only be possible to mark each piece of data as "checked". As soon as something has to be changed, being a value to correct or a whole piece section to add, the user will click a button and will be redirected to the feedForm, initialized with the data being reviewed.
He will be able to make the changes he wants and come back to the review interface when that's done.

I'm thinking about two things now that will probably necessitate some changes:

1. I would like the review process to be presented in a way very close to the feedForm. Right now it shows all the data to review in one page. I prefer to have it displayed with different screen:
- a summary view with the MMSource infos first and the ordered list of pieces it contains
- A collection view that is close to the previous one, with collection info replacing MMSource infos from the previous screen.
- A piece view, where we can see the movements and sections in the selected piece. The Metronome marks should be displayed along side the section it is related to.
  This will ease the review process, getting it done slice per slice.

2. Now that I decided to have a dynamic review interface, with a user getting back and forth between review and feedForm, I'm thinking that the context Types should be as close as possible. I began to use types from @file:feedFormTypes.ts into @file:ReviewChecklistSchema.ts , but I would like your thought on that. Also, the data is more in the form of nested object in feedForm context, which is working well with the step form. I want to adopt the same approach for the review form, but I don't know if I overlook some problem that will arise from this decision.

How do you analyze these reflexions and the directions i'm leaning to now?

## AI Assistant
Of course. It's great that you're thinking ahead about the user experience and data architecture for the review process. Your reflections are spot-on, and the directions you're leaning toward will lead to a more robust, maintainable, and user-friendly feature.

Let's break down your points.

### 1. A Sliced Review Interface

Your idea to move from a single-page checklist to a multi-screen interface that mirrors the `feedForm` is an excellent one.

*   **Improved User Experience**: A long, single-page form for a complex `MMSource` can be overwhelming. Breaking it down into logical slices (Source, Collection, Piece) makes the task much more manageable and less error-prone.
*   **Consistency**: Users are already familiar with the multi-step flow from data entry. Reusing a similar pattern for review creates a consistent and intuitive experience across the application.
*   **Alignment with Specs**: This approach perfectly realizes the vision outlined in your specification documents, which call for "Sequential slices UI: Source → Collections → Pieces → Sections" and showing Metronome Marks alongside their related sections.

This is a clear step forward for the usability of the review feature.

### 2. Aligning Data Structures

This is a very insightful and crucial point. As you've noted, with the user moving back and forth between the review UI and the `feedForm`, having two different data structures is a significant liability. Aligning them is the right move.

The `feedForm`'s nested object structure is ideal for representing the hierarchical nature of the data, and adopting it for the review's working copy (`ChecklistGraph`) has major benefits:

*   **Simplified Data Bridge**: The `reviewEditBridge.ts` file, which translates between `FeedFormState` and the review's `ChecklistGraph`, would become dramatically simpler. The complex and potentially brittle logic in `rebuildWorkingCopyFromFeedForm` could be reduced to a near 1-to-1 mapping, which means fewer bugs and easier maintenance.
*   **Easier UI Development**: The sliced review interface you envision will be much easier to build. You'll be able to pass a self-contained, nested `pieceVersion` object to a `PieceReview` component, which is far cleaner than filtering and stitching together data from multiple flat arrays.

#### Overlooked Problems (which become a To-Do list)

You are right to wonder about potential problems. Adopting a nested structure will require a few updates to your existing logic, but the benefits outweigh the effort.

1.  **Checklist Generation**: The `expandRequiredChecklistItems` function in `utils/ReviewChecklistSchema.ts` is currently written with the assumption that entities like movements and sections exist in top-level flat arrays within the `ChecklistGraph`. This function needs to be updated to traverse the nested structure of `pieceVersions` -> `movements` -> `sections`.

2.  **Diffing Logic**: Any logic you have for detecting changes between the initial data and the working copy (e.g., in `reviewDiff.ts`) will need to be adapted to work with nested objects.

Here are my suggestions to implement this alignment:

#### Update Checklist Expansion Logic

You need to modify `expandRequiredChecklistItems` to walk the nested data structure. The current implementation has commented-out calls for `MOVEMENT` and `SECTION`, which we can replace with proper nested traversal.

```typescript
// ... existing code ...
  addEntityGroup(
    "PIECE",
    graph.pieces as Array<{ id: string } | undefined> as any,
  );

  // Traverse nested structure for piece versions, movements, and sections
  if (graph.pieceVersions) {
    addEntityGroup(
      "PIECE_VERSION",
      graph.pieceVersions as Array<{ id: string } | undefined> as any,
    );
    for (const pv of graph.pieceVersions) {
      const movements = (pv as any).movements;
      if (movements) {
        addEntityGroup(
          "MOVEMENT",
          movements as Array<{ id: string } | undefined> as any,
        );
        for (const m of movements) {
          const sections = (m as any).sections;
          if (sections) {
            addEntityGroup(
              "SECTION",
              sections as Array<{ id: string } | undefined> as any,
            );
          }
        }
      }
    }
  }

  addEntityGroup(
    "TEMPO_INDICATION",
    graph.tempoIndications as Array<{ id: string } | undefined> as any,
  );
// ... existing code ...
  addEntityGroup(
    "METRONOME_MARK",
    graph.metronomeMarks as Array<{ id: string } | undefined> as any,
  );
  // addEntityGroup(
  //   "REFERENCE",
  //   graph.references as Array<{ id: string } | undefined> as any,
  // );
  addEntityGroup(
// ... existing code ...
```


This change correctly traverses the nested `pieceVersions` to find all movements and sections, ensuring all their fields are added to the checklist.

#### Simplify the Data Bridge

With the data structures aligned and the checklist expansion logic updated, you can then refactor the `rebuildWorkingCopyFromFeedForm` function in `utils/reviewEditBridge.ts`. The goal is to remove the complex reconstruction logic and replace it with a simpler mapping. The current implementation already seems to be moving in this direction by preserving the nested `movements` within `pieceVersions`. You can clean it up further to make the data flow more direct and predictable.

### Conclusion

Your instincts are correct. The proposed changes will significantly improve the review feature by:

1.  Creating a more intuitive, less overwhelming user interface.
2.  Simplifying the data architecture, reducing complexity, and making the code easier to maintain.

By making these changes, you are building a solid foundation for the review process.

## Me
I've asked the same question to GPT-5 and Claude 4.5 models.
You have the same analysis in general but I prefer the structure of your answer, and the fact that you are the only model which pointed to the fact that my new directions would improve the alignment to the specs.

Please review both of the others answers @file:20251009_GPT-5_align-review-and-feedForm-types.md and @file:20251009_Claude4.5_align-review-and-feedForm-types.md and provide a road map forward as consolidated as possible.

## AI Assistant
Of course. It's a valuable exercise to synthesize feedback from different models to form the most robust plan. Both GPT-5 and Claude 4.5 provided excellent analyses that strongly align with our initial assessment.

All three of us agree on the fundamental strategy:
1.  **A Sliced UI is Better:** Breaking the review process into screens that mirror the `feedForm` is the right move for user experience.
2.  **Aligning Data Structures is Key:** Making the review's `ChecklistGraph` a nested structure like the `FeedFormState` is critical for simplifying the code and reducing bugs.

By consolidating the insights from all sources, we can create a clear, actionable roadmap. The consensus is strong, and the path forward is well-defined.

Here is a consolidated roadmap that integrates the best points from your attachments and our previous discussion.

---

### Consolidated Roadmap: Aligning Review and FeedForm

This plan is divided into two main phases: first, we'll align the data structures, and second, we'll build the new user interface on that solid foundation.

#### **Phase 1: Data Structure and Backend Alignment**

The goal of this phase is to refactor the `ChecklistGraph` to be a truly nested structure, mirroring `FeedFormState`, and update the code that produces and consumes it.

**Step 1.1: Refactor `ChecklistGraph` and Server-Side Hydration**

As Claude 4.5 astutely pointed out, a nested structure means you no longer need redundant, top-level arrays for `movements` and `sections` in your `ChecklistGraph`. The `getReviewOverview.ts` function currently creates these. We will stop this and rely on the nesting that already exists within `pieceVersions`.

```typescript
// ... existing code ...
export type ChecklistGraph = {
  // Singleton source node for this review context
  source: MMSourceDescriptionState;
  // Arrays of nodes in scope
  collections?: CollectionState[];
  pieces?: PieceState[];
  pieceVersions?: PieceVersionState[];
  // movements and sections will be nested inside pieceVersions, so they are not needed here
  tempoIndications?: TempoIndicationState[];
  metronomeMarks?: MetronomeMarkState[];
  contributions?: ContributionState[];
  persons?: PersonState[];
  organizations?: OrganizationState[];
  // Ordering join rows for the source contents (MMSourcesOnPieceVersions)
  sourceContents?: Array<SourceContent>;
};

export type ApiOverview = {
// ... existing code ...
```


```typescript
// ... existing code ...
    movements: join.pieceVersion?.movements.map((m) => ({
      id: m.id,
      rank: m.rank,
      key: m.key ?? null,
      sections: m.sections,
    })),
  }));

  const tempoIndications = Array.from(tempoIndicationIds).map((tiId) => {
    // find first occurrence with text
// ... existing code ...
// ... existing code ...
    return { id: tiId, text: "" };
  });

  const metronomeMarks = mmSource.metronomeMarks.map((mm) => ({
// ... existing code ...
// ... existing code ...
  const graph: ChecklistGraph = {
    source: {
      id: mmSource.id,
// ... existing code ...
      })),
    },
    collections: collections.map((c) => ({
// ... existing code ...
      composerId: c.composerId ?? null,
    })),
    pieces,
    pieceVersions,
    tempoIndications,
    metronomeMarks,
    // references: mmSource.references.map((r) => ({
    //   id: r.id,
// ... existing code ...
```

## Me

Concerning `expandRequiredChecklistItems`, why do you plan to traverse the nested pieceVersions in order to build 'MOVEMENT' and 'SECTION' entityGroup?
Why not remove thes two entities from the checklistEntities entirely and keep them inside pieceVersions?

## Me

I had two considerations in mind when I asked this question:
- first: why not do the same for 'REFERNCES'?
- second and most important: as I stated this at the beginning of @file:20251009_BEST_Gemini2.5_align-review-and-feedForm-types.md , I want to change how the review interface proceeds and stop showing all in one page with a stack of groups of items of the same entity types. I want now to have data displayed like on the feedForm, with a logic by MMSource, then by Collection, then by Piece and PieceVersion with all the related entities displayed together in a logic much more natural to the user reading a score.

I understand that we need a `RequiredChecklistItem[]` that clearly describes each datum that needs to be checked.
I also think we should probably have the complete path to a section field for example with the ids of the pieceVersion, movement and section it is related to. (or we should be able to easily ebuild this path)

Does that change your advice concerning `RequiredChecklistItem` organization?

## AI

You have asked exactly the right questions. Your insights are spot on, and they reveal the need to refine the plan to perfectly match your new UI goals. My previous advice was based on organizing the data for a single-page, grouped list. For the multi-screen, hierarchical UI you envision, we need a more sophisticated approach.

You are absolutely correct on both counts.

1.  **The 'REFERENCES' Inconsistency:** You are right to call this out. In the nested `ChecklistGraph`, `references` are an array inside the `source` object, just as `movements` are inside `pieceVersions`. For consistency, they should be handled the same way. The current code has `REFERENCE` commented out, but to do this correctly, we should traverse `source.references` and generate checklist items with `entityType: 'REFERENCE'`.

2.  **The Need for Full Context:** This is the most critical point. Your new UI—displaying a "Piece slice" with everything related to that piece—invalidates the idea that a simple `entityType` and `entityId` are enough.

My previous advice to keep `MOVEMENT` and `SECTION` as separate entity types was to help with *grouping* on a single page. In your new design, the primary challenge is no longer grouping, but **filtering** and **contextual display**.

When you render a `PieceSlice` for a specific piece, you need to easily answer the question: "Give me every single checklist item that belongs to this piece." With the current structure, that's difficult. You'd have to reconstruct the entire entity tree every time just to find which sections belong to which pieces.

This means my previous advice needs to be updated. You don't just need the entity's own identity; you need its **full lineage**.

### The New Advice: A Richer `RequiredChecklistItem`

We should not remove `MOVEMENT` and `SECTION` as entity types. Their semantic meaning is vital. Instead, we should enrich the `RequiredChecklistItem` to include the full path of parent IDs.

Let's redefine the `RequiredChecklistItem` to include a `lineage`:

```typescript
export type RequiredChecklistItem = {
  entityType: ChecklistEntityType;
  entityId: string | null;
  fieldPath: string; // The field on the entity itself, e.g., "rank"
  label: string;
  // NEW: The full path of parent IDs
  lineage: {
    collectionId?: string;
    pieceId?: string;
    pieceVersionId?: string;
    movementId?: string;
  };
};
```


**Why is this better?**

*   **Effortless UI Slicing:** To render a `PieceSlice` for `piece_xyz`, you can now simply filter your master list of checklist items:
    `const pieceItems = allItems.filter(item => item.lineage.pieceId === 'piece_xyz');`
    This is incredibly fast and declarative. Your `PieceSlice` component receives a clean, pre-filtered list of exactly what it needs to render.

*   **Complete Context:** Every checklist item is now self-contained and knows its full place in the hierarchy. This is invaluable for debugging, navigation, and building complex UI rules.

*   **Stable `fieldPath`:** The `fieldPath` can remain simple (e.g., `rank` or `title`), referring only to a property on the entity itself. The complex path is now stored structurally in the `lineage`, which is a much cleaner separation of concerns.

### How to Implement This

We need to update `expandRequiredChecklistItems` to pass down the parent context as it traverses the nested `ChecklistGraph`. The logic would look like this:

1.  When you process a `PieceVersion`, you know its `pieceId` and `collectionId`.
2.  When you recurse into its `movements`, you pass down that context (`pieceId`, `collectionId`) and add the current `pieceVersionId`.
3.  When you recurse into a `section`, you pass down the full context, now including the `movementId`.

Here is how you could modify the expansion logic. Instead of a generic `addEntityGroup`, you would have a more contextual traversal.

```typescript
// ... existing code ...
  // Helper to add items per entity array based on schema
  const addEntityGroup = (
    entityType: ChecklistEntityType,
    nodes: Array<{ id: string }> | undefined,
    lineage: RequiredChecklistItem["lineage"] = {}, // Pass down lineage
  ) => {
    if (!nodes || nodes.length === 0) return;
    const schema = REVIEW_CHECKLIST_SCHEMA[entityType];
// ... existing code ...
        if (!isRequiredField(field, ctx)) continue;
        items.push({
          entityType,
          entityId: n.id,
          fieldPath: buildFieldPath(entityType, n.id, field.path),
          label: field.label,
          lineage, // Attach the lineage to each item
        });
      }
    }
  };

  addEntityGroup(
    "COLLECTION",
    graph.collections as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PIECE",
    graph.pieces as Array<{ id: string } | undefined> as any,
  );

  // Traverse nested structure for piece versions, movements, and sections
  if (graph.pieceVersions) {
    addEntityGroup("PIECE_VERSION", graph.pieceVersions);

    for (const pv of graph.pieceVersions) {
      const piece = graph.pieces?.find((p) => p.id === pv.pieceId);
      const pvLineage = {
        collectionId: piece?.collectionId,
        pieceId: pv.pieceId,
        pieceVersionId: pv.id,
      };

      const movements = (pv as any).movements;
      if (movements) {
        addEntityGroup("MOVEMENT", movements, pvLineage);

        for (const m of movements) {
          const movLineage = { ...pvLineage, movementId: m.id };
          const sections = (m as any).sections;
          if (sections) {
            addEntityGroup("SECTION", sections, movLineage);
          }
        }
      }
    }
  }

  addEntityGroup(
    "TEMPO_INDICATION",
    graph.tempoIndications as Array<{ id: string } | undefined> as any,
  );
// ... existing code ...
```


**(Note:** This is a conceptual implementation. You would refine it to correctly associate pieces with collections if needed.)

**This new structure for `RequiredChecklistItem` is the key.** It perfectly supports your vision for a sliced, hierarchical review interface while maintaining the semantic integrity of your data model. Your intuition to question the old structure was entirely correct.

## Me

From that new perspective, write a detailed roadmap to replace @file:20251009_BEST_Gemini2.5_align-review-and-feedForm-types.md from the section "Step 1.2: Update Client-Side Checklist Generation".

## AI

Excellent. Your follow-up questions get to the very heart of the architectural challenge. You have correctly seen the next level of the problem: my previous advice fixed the data *shape* but didn't fully solve the data *context* problem for your new UI.

You are absolutely right. The old model of grouping by `entityType` is obsolete for your new design. For a sliced, hierarchical review process, every single checklist item must know its full "address" within the data tree.

My advice must change to reflect this deeper understanding. Here is a new, detailed roadmap that replaces the previous one from Step 1.2 onwards. This plan is built around your core insight: enriching `RequiredChecklistItem` is the key to enabling the new UI.

---

### **Consolidated Roadmap 2.0: Building the Sliced Review UI**

This roadmap details the refactoring required to create a hierarchical checklist structure, which is the prerequisite for building your desired multi-screen review interface.

#### **Phase 1: Rearchitecting the Checklist for Hierarchical Context**

**Step 1.2 (Revised): Redefine `RequiredChecklistItem` to Include Full `lineage`**

This is the foundational change. We will modify the `RequiredChecklistItem` type in `utils/ReviewChecklistSchema.ts` to include a `lineage` property. This object will hold the IDs of all parent entities, giving every item a complete contextual address.

```typescript
// ... existing code ...
export type RequiredChecklistItem = {
  entityType: ChecklistEntityType;
  entityId?: string | null;
  fieldPath: string;
  label: string;
  // NEW: The full hierarchical path for this item
  lineage: {
    collectionId?: string;
    pieceId?: string;
    pieceVersionId?: string;
    movementId?: string;
  };
};

function isRequiredField(
// ... existing code ...
```


**Step 1.3 (Revised): Implement Context-Aware Checklist Expansion**

We will refactor `expandRequiredChecklistItems` to perform a "context-aware traversal." As it descends into the nested `ChecklistGraph`, it will pass down the accumulating `lineage` of parent IDs. This ensures every generated checklist item has the full context it needs.

This includes properly handling nested `references` and `contributions` as you correctly pointed out.

```typescript
// ... existing code ...
// Helper to add items per entity array based on schema
  const addEntityGroup = (
    entityType: ChecklistEntityType,
    nodes: Array<{ id: string }> | undefined,
    lineage: RequiredChecklistItem["lineage"] = {}, // Pass down lineage
  ) => {
    if (!nodes || nodes.length === 0) return;
    const schema = REVIEW_CHECKLIST_SCHEMA[entityType];
// ... existing code ...
      for (const field of schema.fields) {
        const ctx: RequiredPredicateCtx = {
          graph,
          entityType,
          entityId: n.id,
          fieldRelativePath: field.path,
        };
        if (!isRequiredField(field, ctx)) continue;
        items.push({
          entityType,
          entityId: n.id,
          fieldPath: buildFieldPath(entityType, n.id, field.path),
          label: field.label,
          lineage, // Attach the lineage to each item
        });
      }
    }
  };

  // --- Source Level ---
  addEntityGroup("MM_SOURCE", [graph.source as any]);
  // Handle nested references and contributions within the source
  if (graph.source.references) {
    addEntityGroup(
      "REFERENCE",
      graph.source.references as Array<{ id: string }>,
    );
  }
  if (graph.contributions) {
    addEntityGroup("CONTRIBUTION", graph.contributions);
  }

  // --- Standalone Entities ---
  addEntityGroup(
    "COLLECTION",
    graph.collections as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PIECE",
    graph.pieces as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "PERSON",
    graph.persons as Array<{ id: string } | undefined> as any,
  );
  addEntityGroup(
    "ORGANIZATION",
    graph.organizations as Array<{ id: string } | undefined> as any,
  );
  addEntityGromup(
    "TEMPO_INDICATION",
    graph.tempoIndications as Array<{ id: string } | undefined> as any,
  );

  // --- Nested Traversal for Piece Structure ---
  if (graph.pieceVersions) {
    for (const pv of graph.pieceVersions) {
      const piece = graph.pieces?.find((p) => p.id === pv.pieceId);
      const pvLineage: RequiredChecklistItem["lineage"] = {
        collectionId: piece?.collectionId ?? undefined,
        pieceId: pv.pieceId ?? undefined,
        pieceVersionId: pv.id,
      };
      addEntityGroup("PIECE_VERSION", [pv as any], pvLineage);

      const movements = (pv as any).movements;
      if (movements) {
        for (const m of movements) {
          const movLineage = { ...pvLineage, movementId: m.id };
          addEntityGroup("MOVEMENT", [m as any], movLineage);

          const sections = (m as any).sections;
          if (sections) {
            addEntityGroup("SECTION", sections, movLineage);
          }
        }
      }
    }
  }

  // --- Final Entities ---
  // Metronome Marks need to find their lineage
  if (graph.metronomeMarks) {
    for (const mm of graph.metronomeMarks) {
      if (!mm.sectionId) continue;
      // Find the section to build the lineage
      let mmLineage: RequiredChecklistItem["lineage"] | undefined;
      for (const pv of graph.pieceVersions ?? []) {
        for (const m of (pv as any).movements ?? []) {
          if (m.sections?.some((s: any) => s.id === mm.sectionId)) {
            const piece = graph.pieces?.find((p) => p.id === pv.pieceId);
            mmLineage = {
              collectionId: piece?.collectionId,
              pieceId: pv.pieceId,
              pieceVersionId: pv.id,
              movementId: m.id,
            };
            break;
          }
        }
        if (mmLineage) break;
      }
      addEntityGroup("METRONOME_MARK", [mm as any], mmLineage);
    }
  }

  return items;
}
```


**Step 1.4: Adapt UI and Ancillary Logic**

The component at `app/(signedIn)/review/[reviewId]/checklist/page.tsx` is the primary consumer of the checklist. It must be refactored to manage the new UI state.

*   **Remove Old Grouping:** The `groupedByType` and `SLICE_ORDER` logic is now obsolete and should be removed.
*   **Introduce UI State:** Add a state to manage the current view. This will control which "slice" of the review is visible.
```typescript
type ReviewView =
      | { view: "SUMMARY" }
      | { view: "COLLECTION"; collectionId: string }
      | { view: "PIECE"; pieceId: string };

    const [currentView, setCurrentView] = useState<ReviewView>({ view: "SUMMARY" });
```

*   **Controller Logic:** The main component will now act as a controller, filtering the master `requiredItems` list based on the `currentView` and passing the filtered list to the appropriate slice component.

---

#### **Phase 2: UI Implementation with Sliced Components**

**Step 2.1: Create Reusable Slice Components**

Create a new directory `components/review/slices` and build the components for each view. They will receive the filtered checklist items and the full graph as props.

*   **`SummarySlice.tsx`**:
    *   Displays `MM_SOURCE`, `CONTRIBUTION`, and `REFERENCE` items.
    *   Renders a navigable list of all unique collections and pieces involved in the review, which allows the user to switch the `currentView`.

*   **`CollectionSlice.tsx`**:
    *   Receives a `collectionId`.
    *   Filters items where `item.lineage.collectionId === collectionId`.
    *   Displays checklist items for the `COLLECTION` entity itself, plus a list of pieces within that collection.

*   **`PieceSlice.tsx`**:
    *   Receives a `pieceId`.
    *   Filters items where `item.lineage.pieceId === pieceId`.
    *   This component will contain the most complex rendering logic, displaying the hierarchy of `PieceVersion` -> `Movement` -> `Section`.
    *   For each section, it will find the corresponding `MetronomeMark` from the graph and display its checklist items inline.

**Step 2.2: Update the Main Page to Use Slices**

The main return function of `checklist/page.tsx` will now be a simple switch that renders the correct slice component based on `currentView`.

```textmate
// In checklist/page.tsx
// ...
const allRequiredItems = useMemo(() => expandRequiredChecklistItems(graph), [graph]);

// ...
return (
  // ... outer layout ...
  {currentView.view === 'SUMMARY' && (
    <SummarySlice
      items={allRequiredItems.filter(it => !it.lineage.pieceId && !it.lineage.collectionId)}
      graph={graph}
      onNavigate={setCurrentView}
    />
  )}
  {currentView.view === 'PIECE' && (
    <PieceSlice
      pieceId={currentView.pieceId}
      items={allRequiredItems.filter(it => it.lineage.pieceId === currentView.pieceId)}
      graph={graph}
    />
  )}
  {/* ... other views ... */}
)
```


---

#### **Phase 3: Finalizing the Edit Roundtrip**

**Step 3.1: Enhance the "Edit" Action**

The `openEditForItem` function becomes more robust. When a user clicks "Edit" on an item:
*   The `RequiredChecklistItem` now contains the full `lineage`.
*   This makes creating the `anchors` payload for `reviewEditBridge` trivial and error-proof. For a `SECTION` item, all parent IDs (`pieceVersionId`, `movementId`) are immediately available from `item.lineage`.

**Step 3.2: Refine the "Return from Edit" Logic**

The `returnRoute` payload stored in `localStorage` should be updated to store the `currentView` object. This ensures that when the user returns from the `feedForm`, you can restore them to the *exact same slice* they were on (e.g., viewing `Piece_XYZ`). The scroll restoration can then use the `fieldPath` to pinpoint the exact item within that slice.

This new, detailed roadmap directly incorporates your insights and provides a clear path to building the sophisticated, user-friendly review interface you envision.
