## Me
`MMSourceContributions` is the parent component of a step in my multi step "feed form" that allow user to register information about musical score.
This step is about registering contributors, being a person or organization having a role in the musical score (editor, metronome mark provider, publisher...)

My main Feed form state has entity array records for `persons` and `organizations` as you can see in the type `FeedFormState` here: @file:feedFormTypes.ts

The problem I have is that the contributor step has been build with a `ContributionState` type that has a whole `person` or `organization` entity instead of having instead a `personId` or `organizationId` referencing e record in the `persons` or `organizations` array.

I want to fix that because these entities being accessed and potentially modified elsewhere, the present situation generate inconsistency in some situations.
The `mMSourceContributions` type in `FeedFormState` has to be change accordingly.

**Your task**
- Analyze the four components of the contributions step : @file:MMSourceContributions.tsx , @file:SourceContributionSelectForm.tsx , @file:SourceContributionSelect.tsx , @file:NewSourceContributionForm.tsx
- In regard to the needed refactoring described above, define a clear and precise strategy and a detailed road map for the implementation.

## AI Assistant
I'll analyze the four components and define a clear refactoring strategy.Now let me check how contributions are used in utilities and other parts:Now let me look at some utilities and adapters to understand how contributions are transformed:Now let me look at the context around the contributions in the review types:Now let me look at how contributions are currently used in these components to understand the full picture.Now let me check how contributions are used in the reducer:Now let me examine the review adapters and other related utilities:Now let me check the entire reviewAdapters file to see ContributionValues:Now I have a comprehensive understanding of the codebase. Let me analyze the four components and define a strategy for the refactoring.

## Analysis and Refactoring Strategy

### Current Problem

The `ContributionState` type currently stores **entire entity objects** (`person` or `organization`), which creates data inconsistency issues when these entities are modified elsewhere in the form:

```typescript
export type ContributionState =
  | ({ id?: string; role: CONTRIBUTION_ROLE; person: PersonState; } & IsNewProp)
  | ({ id?: string; role: CONTRIBUTION_ROLE; organization: OrganizationState; } & IsNewProp);
```


### Desired State

Contributions should store **only IDs** that reference records in the `persons` or `organizations` arrays in `FeedFormState`:

```typescript
export type ContributionState =
  | ({ id?: string; role: CONTRIBUTION_ROLE; personId: string; } & IsNewProp)
  | ({ id?: string; role: CONTRIBUTION_ROLE; organizationId: string; } & IsNewProp);
```


---

## Detailed Refactoring Roadmap

### Phase 1: Type System Updates

#### 1.1 Update Core Types (`types/formTypes.ts`)
- **Update `ContributionState`** to use IDs instead of nested entities
- **Update `ContributionStateWithoutId`** accordingly
- **Update `assertsContributionHasPersonOrOrganization`** function to match new structure
- **Keep `ContributionInput`** as-is (it's already used for form inputs, not state)

### Phase 2: Utility Function Updates

#### 2.1 Update Database Conversion (`utils/getMMSourceContributionDBInputFromState.ts`)
- Modify `getMMSourceContributionDBInputFromState()` to work with IDs
- The function should receive the full state to resolve person/organization entities
- Change signature to: `getMMSourceContributionDBInputFromState(contribution: ContributionState, state: FeedFormState)`

#### 2.2 Update Review System Utilities
- **`utils/server/getReviewOverview.ts`**: Already uses IDs in database layer, but constructs `ContributionState` with nested entities - needs updating to match new type
- **`features/review/reviewEditBridge.ts`**: Update the boot state construction to use IDs

#### 2.3 Update Other Utility Functions
- **`utils/getPersonCreateInput.ts`**: Update to search contributions by `personId` instead of `person.id`
- **`utils/getOrganizationCreateInput.ts`**: Update to search contributions by `organizationId` instead of `organization.id`

### Phase 3: Context Updates

#### 3.1 Update Feed Form Context (`context/feedFormContext.tsx`)
- **`isEntityUsed()` function**: Update the logic for `persons` and `organizations` to check IDs:
```typescript
// Current (wrong):
  return mMSourceContribution.person?.id === entity.id
  
  // New (correct):
  return mMSourceContribution.personId === entity.id
```


#### 3.2 Update Feed Form Reducer (`context/feedFormReducer.ts`)
- **Remove the automatic upsert logic** for `person` and `organization` properties in contributions
- Contributions should no longer trigger automatic insertion of persons/organizations into state

### Phase 4: Component Updates (Main Focus)

#### 4.1 **MMSourceContributions.tsx** (Parent Component)
- **Current**: Passes `state.mMSourceContributions` (with nested entities) to child
- **Change**: No structural change needed, but ensure it passes the correct data structure

#### 4.2 **SourceContributionSelectForm.tsx** (Form Manager)
- **Current**: Manages `selectedContributions` with nested `person`/`organization` entities
- **Changes**:
    - `selectedContributions` state should store IDs only
    - `onAddPersonContribution()` should accept `personId` and create contribution with ID
    - `onAddOrganizationContribution()` should accept `organizationId` and create contribution with ID
    - Display logic needs to **lookup** persons/organizations from the arrays passed as props
    - Remove internal `createdPersons` and `createdOrganizations` states (these are now managed in parent context)

#### 4.3 **SourceContributionSelect.tsx** (Selection Component)
- **Current**: Handles both ID selection (existing) and entity creation (new)
- **Changes**:
    - `onAddPersonContribution()` callback should pass `personId` only
    - `onAddOrganizationContribution()` callback should pass `organizationId` only
    - Remove the temporary state for `newPerson` and `newOrganization`
    - Simplify the `useEffect` that calls `onAddContribution()`

#### 4.4 **NewSourceContributionForm.tsx** (Creation Component)
- **Current**: Creates new person/organization entities and adds them to feed form context
- **Changes**:
    - After creating person/organization and adding to context, should return **only the ID** via `onContributionCreated`
    - Change callback signature: `onContributionCreated({ role, personId })`
    - The `personId` or `organizationId` should reference the newly created entity

### Phase 5: Testing and Validation

#### 5.1 Update Type Guards and Assertions
- Ensure all type guards still work correctly
- Update tests that construct `ContributionState` objects

#### 5.2 Data Migration Considerations
- **LocalStorage**: Existing saved forms will have old structure - need migration strategy
    - Option A: Add migration logic in `feedFormReducer` initialization
    - Option B: Clear localStorage (acceptable for development)
    - Option C: Add version number to localStorage data structure

#### 5.3 Review System Integration
- Ensure review edit mode correctly constructs contribution states with IDs
- Update `ContributionValues` type (already correct with IDs in `reviewAdapters.ts`)
- Verify `ContributionAdapter` still works correctly

---

## Implementation Order

**Priority Order** (to minimize breaking changes):

1. **Phase 1**: Update type definitions
2. **Phase 2**: Update utility functions that convert to/from database
3. **Phase 3**: Update context and reducer
4. **Phase 4.4**: Update `NewSourceContributionForm` (creation)
5. **Phase 4.3**: Update `SourceContributionSelect` (selection)
6. **Phase 4.2**: Update `SourceContributionSelectForm` (form manager)
7. **Phase 4.1**: Verify `MMSourceContributions` (parent)
8. **Phase 5**: Testing and validation

---

## Key Implementation Details

### Display Logic Pattern
After refactoring, components will need to **resolve IDs to entities**:

```typescript
// Example in SourceContributionSelectForm
const displayContribution = (contribution: ContributionState) => {
  if ('personId' in contribution) {
    const person = persons.find(p => p.id === contribution.personId);
    return person ? `${person.firstName} ${person.lastName}` : 'Unknown';
  } else {
    const org = organizations.find(o => o.id === contribution.organizationId);
    return org ? org.name : 'Unknown';
  }
};
```


### Benefits of This Refactoring

1. **Single Source of Truth**: Person and organization data lives only in `persons` and `organizations` arrays
2. **Consistency**: Changes to persons/organizations automatically reflect in contributions
3. **Simpler State Management**: No duplicate entity data
4. **Easier Debugging**: Clearer data flow
5. **Better Type Safety**: Clear separation between entities and references

---

Would you like me to proceed with implementing any specific phase, or would you like clarification on any part of this strategy?
