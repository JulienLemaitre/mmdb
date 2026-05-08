## Complete refactoring spec: step-local drafts + global commit on submit

Below is a **component-by-component contract** you can hand to an AI agent to implement.

---

# 1) Goal of the refactor

Split the contributions step into two layers:

## A. Step-local temporary state
Owned by the contributions step UI while the user is editing.

Contains:
- newly created `PersonState`
- newly created `OrganizationState`
- currently selected contributions
- UI mode state like “create new” vs “select existing”

## B. Global `feedFormContext` state
Contains only finalized form data.

Updated **only when the user submits the full contributions step**:
- final `persons`
- final `organizations`
- final `mMSourceContributions`

---

# 2) Invariants after refactor

1. `NewSourceContributionForm` must **not** dispatch to `feedFormContext`.
2. Draft people / organizations created during the step must be stored **locally** in the step component tree.
3. `SourceContributionSelectForm` must render from merged lists:
    - API-fetched entities
    - local draft entities
4. `feedFormContext` must only receive entities on step submit.
5. Contributions stored in form state should reference entities by **ID only**.
6. The UI must still show newly created names immediately, without waiting for global context updates.

---

# 3) Component contracts

## 3.1 `MMSourceContributions.tsx`
### Responsibility
Acts as the **step orchestrator** and the bridge between local step state and global form state.

### Owns
- API-loaded persons / organizations
- draft persons / organizations created in this step
- submit handler that commits all final data to `feedFormContext`

### Receives from context
- current `state`
- `dispatch`
- `currentStepRank`

### Local state it should own
- `data` from API
- `isLoading`
- `draftPersons: PersonState[]`
- `draftOrganizations: OrganizationState[]`

### It must provide to child
Merged lists:
- `persons = apiPersons + draftPersons`
- `organizations = apiOrganizations + draftOrganizations`

### It must not
- call `getNewEntities()` for UI display
- read temporary draft entities from global state
- allow `NewSourceContributionForm` to write directly into `feedFormContext`

### Submit behavior
When the user saves the step:
1. commit `draftPersons` to `feedFormContext.persons`
2. commit `draftOrganizations` to `feedFormContext.organizations`
3. commit `selectedContributions` to `feedFormContext.mMSourceContributions`
4. then move to next step if requested

### Notes
This component becomes the **single place** where draft entities are promoted into global state.

---

## 3.2 `SourceContributionSelectForm.tsx`
### Responsibility
Manages the contribution list UI and the select/create flow.

### Owns
- current contribution list being edited in this step
- UI open/close state for the selector
- local selected contributions

### Receives as props
- `contributions` from global state
- `persons` merged list from parent
- `organizations` merged list from parent
- callbacks for submit and for draft entity creation

### Local state it should own
- `selectedContributions`
- `isFormOpen`

### It must not
- write persons / organizations to `feedFormContext`
- know how draft entities are stored globally
- depend on `getNewEntities()`

### It should render
- contribution list using `selectedContributions`
- person / organization display names by resolving IDs against the provided `persons` / `organizations`
- select/create UI via `SourceContributionSelect`

### Required new prop contract
It should receive a callback from the parent for draft creation, something like:
- `onCreateDraftPerson(person: PersonState): void`
- `onCreateDraftOrganization(organization: OrganizationState): void`

Or a unified callback:
- `onDraftEntityCreated(entity: PersonState | OrganizationState): void`

### Submit behavior
When the user clicks Save:
- call the parent `onSubmit(selectedContributions, { goToNextStep })`
- do not mutate global state directly

### Important implementation detail
If the user creates a new person / organization, the step must immediately be able to resolve the display name from the local merged list.

That means `SourceContributionSelectForm` should be driven by the merged lists passed from the parent, not by context-derived derived state.

---

## 3.3 `SourceContributionSelect.tsx`
### Responsibility
Acts as the interactive picker inside the form.

### Owns
- selected existing person id
- selected existing organization id
- selected role
- toggle between select-existing and create-new modes

### Receives as props
- `sourceContributionOptions`
- callbacks:
    - `onAddPersonContribution({ personId, role })`
    - `onAddOrganizationContribution({ organizationId, role })`
    - `onCreateDraftPerson(person: PersonState)`
    - `onCreateDraftOrganization(organization: OrganizationState)`
    - `onCancel()`

### It must not
- interact with `feedFormContext`
- store entities globally
- decide when the step is submitted

### Expected behavior
- Existing contributor selected:
    - emit only IDs upward
- New contributor created:
    - render `NewSourceContributionForm`
    - receive the created entity from that form
    - pass it upward to the parent callback
    - then let the parent update local drafts / selected contributions

### UI state
This component can keep its current mode state, but it should remain strictly presentation/interaction-level.

---

## 3.4 `NewSourceContributionForm.tsx`
### Responsibility
Collects data for a new person or organization.

### Owns
- form input state
- validation
- person/organization toggle

### Receives as props
- `onContributionCreated(result)`
- potentially `onCancel` if you want to allow closing creation mode without submit

### It must not
- call `useFeedForm()`
- call `updateFeedForm()`
- write into global state
- decide where the created entity will be stored

### Required behavior change
On submit:
- create the entity object locally
- call `onContributionCreated(entity)` with the full created `PersonState` or `OrganizationState`
- leave persistence to parent components

### Suggested callback shape
A good contract is:

- for person creation:
    - `onContributionCreated({ kind: "person", person })`
- for organization creation:
    - `onContributionCreated({ kind: "organization", organization })`

This is more explicit than returning optional IDs.

### Why this is better
The callback now returns a complete domain object, and the parent decides:
- whether to keep it as a draft
- whether to promote it into global state on submit

---

# 4) Suggested data model for the refactor

## 4.1 Step-local draft model
The parent step component should maintain:

- `draftPersons: PersonState[]`
- `draftOrganizations: OrganizationState[]`

If you want extra clarity, you can store them in a single structure:

```typescript
type DraftContributionEntities = {
  persons: PersonState[];
  organizations: OrganizationState[];
};
```


That is usually easier than separate state variables if there will be more logic later.

---

## 4.2 Contribution selection model
The step-local selected contributions should be **ID-based only**.

Examples:
- `{ personId, role }`
- `{ organizationId, role }`

No nested person/organization objects inside contributions.

---

# 5) End-to-end interaction contract

## 5.1 Create new person
1. User opens create-new UI
2. User fills `NewSourceContributionForm`
3. `NewSourceContributionForm` returns a created `PersonState`
4. `SourceContributionSelect` forwards it to `SourceContributionSelectForm`
5. `SourceContributionSelectForm` adds it to local draft persons
6. Merged `persons` list updates immediately
7. User can now select that person from the list
8. Nothing is written to global context yet

## 5.2 Select existing person
1. User picks existing person
2. `SourceContributionSelect` returns `personId + role`
3. `SourceContributionSelectForm` appends contribution to local selected contributions
4. Nothing is written to global context yet

## 5.3 Save contributions step
1. User clicks Save
2. Parent commits draft persons/orgs to global context
3. Parent commits final contributions to global context
4. Step advances only if requested

---

# 6) What to remove from the current implementation

The refactor should eliminate the following pattern:

- creating a new person
- immediately dispatching it into `feedFormContext`
- then relying on `getNewEntities()` or context reactivity to make it visible

That is exactly the coupling you want to remove.

Also remove any logic where the contribution step assumes:
- global state already contains the draft entity
- context updates happen fast enough for the next callback
- a “new entity” must be “used” before it becomes visible

---

# 7) Required changes outside the 3 main files

Even though you asked for the 3-file contract, the refactor will also require these supporting changes.

## 7.1 `feedFormContext.tsx`
- `getNewEntities()` should no longer be needed for the contributions step UI
- `isEntityUsed()` should be updated if other features still depend on it
- do not rely on it for draft display behavior

## 7.2 `feedFormReducer.ts`
- make sure contribution updates no longer imply automatic upserts of nested person/organization objects
- if contributions become ID-based, reducer logic must align with that

## 7.3 Types
- contribution state types must use IDs only
- form types for UI creation can remain entity-shaped because they are input/output of the creation form, not final persisted state

---

# 8) Suggested implementation order for the AI agent

1. **Change `NewSourceContributionForm`**
    - stop writing to feed context
    - return created entity via callback

2. **Change `SourceContributionSelect`**
    - route created entity upward
    - keep ID-only selection callbacks

3. **Change `SourceContributionSelectForm`**
    - add local draft entities handling
    - merge draft + fetched entity lists
    - remove feed-context writes

4. **Change `MMSourceContributions`**
    - own draft state
    - commit drafts and selected contributions on submit

5. **Update types and reducer/context support**
    - ensure all contribution references are ID-based
    - remove obsolete assumptions

---

# 9) Acceptance criteria

The refactor is correct if all of these are true:

- A newly created person appears immediately in the select list without a global dispatch.
- Canceling the step does not leave half-applied draft data in `feedFormContext`.
- Saving the step commits both draft entities and contributions.
- `mMSourceContributions` stores IDs only.
- The UI no longer depends on `getNewEntities()` to display newly created contributors.
- The flow is understandable by reading only the three step files plus the context boundary.

# 10) ## Task checklist — file-by-file implementation bullets

### `features/feed/multiStepMMSourceForm/stepForms/MMSourceContributions.tsx`
- [ ] Own the temporary step-local draft state for newly created contributors:
    - `draftPersons`
    - `draftOrganizations`
- [ ] Keep fetching the initial persons/organizations list from the API as before.
- [ ] Stop using `getNewEntities()` to enrich the select lists.
- [ ] Build merged lists for the child form:
    - `persons = apiPersons + draftPersons`
    - `organizations = apiOrganizations + draftOrganizations`
- [ ] Pass the merged lists down to `SourceContributionSelectForm`.
- [ ] Add callbacks to receive newly created draft entities from the child flow.
- [ ] On step submit, commit draft persons and draft organizations to `feedFormContext` first.
- [ ] On step submit, commit `selectedContributions` to `feedFormContext` after the entities are available.
- [ ] Keep `feedFormContext` as the final persistence layer only, not a draft store.
- [ ] Preserve existing navigation behavior (`goToNextStep`, save, reset).

### `features/sourceContribution/SourceContributionSelectForm.tsx`
- [ ] Keep `selectedContributions` as local component state.
- [ ] Treat contributions as ID-based only.
- [ ] Remove all direct `feedFormContext` writes from this component.
- [ ] Remove the current “add person/organization to feed form” behavior.
- [ ] Accept merged `persons` and `organizations` arrays as props.
- [ ] Resolve display names by looking up IDs in the provided arrays.
- [ ] When a new contributor is created, forward the created entity upward to the parent callback.
- [ ] Keep the form open/close logic local to this component.
- [ ] Keep the “dirty” state logic based on local `selectedContributions`.
- [ ] Keep the submit/reset UX, but let the parent own final commit to global state.
- [ ] Ensure removing a contribution only updates local state.

### `features/sourceContribution/SourceContributionSelect.tsx`
- [ ] Keep this component focused on selection and creation UI only.
- [ ] Keep existing-role selection behavior for existing persons/organizations.
- [ ] Keep the “create new source contribution” entry point.
- [ ] Forward selected existing contributor IDs upward via callbacks.
- [ ] Forward newly created contributor entities upward via callbacks.
- [ ] Remove any assumption that the selected or created contributor already exists in `feedFormContext`.
- [ ] Do not call `updateFeedForm()` from this component.
- [ ] Do not own persistence logic here.
- [ ] Keep the current role selection UX.

### `features/sourceContribution/NewSourceContributionForm.tsx`
- [ ] Remove all `feedFormContext` access from this component.
- [ ] Remove `useFeedForm()` and `updateFeedForm()` usage.
- [ ] Keep the form validation and input collection logic.
- [ ] Keep generating a new `id` for the created person/organization.
- [ ] Return the full created entity through `onContributionCreated`.
- [ ] Preserve `isNew: true` on created local entities.
- [ ] Keep the person/organization toggle behavior.
- [ ] Keep the current form submit UX and validation errors.
- [ ] Ensure the callback gives the parent enough information to store the draft entity locally.

### Supporting refactor tasks outside these files
- [ ] Update contribution state types so they store `personId` / `organizationId` only.
- [ ] Update reducer logic so contribution updates do not imply nested entity upserts.
- [ ] Update `feedFormContext` helpers so they no longer drive this step’s display logic.
- [ ] Update any conversion utilities that still expect nested person/organization objects.
- [ ] Add or update tests covering:
    - draft entity creation
    - merged display list behavior
    - save/submit commit flow
    - ID-based contribution state shape

