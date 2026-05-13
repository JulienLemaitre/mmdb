# Spec — Versioned `localStorage` Persistence

## Goal

Implement a centralized versioned `localStorage` persistence layer.

Chosen strategy:

- Use **one global persistence schema version**
- Store all persisted app state inside **versioned envelopes**
- **Hard-reset incompatible values**
- Keep all version handling centralized in the storage utility layer

This feature protects the app from hydrating incompatible localStorage data after state-shape refactors.

---

## 1. Persistence format

All app-owned persisted values must be stored as a versioned envelope.

```typescript
type LocalStorageEnvelope<T> = {
  version: number;
  payload: T;
};
```


Example stored value:

```json
{
  "version": 2,
  "payload": {
    "formInfo": {
      "currentStepRank": 1
    }
  }
}
```


The app must no longer intentionally persist raw state objects directly.

---

## 2. Global schema version

Create one global version constant in the centralized localStorage utility module.

Recommended location:

```plain text
src/utils/localStorage.ts
```


Add:

```typescript
export const LOCAL_STORAGE_SCHEMA_VERSION = 2;
```


Guidelines:

- Increment this number whenever persisted state shape changes incompatibly.
- Do not create separate versions per form/context unless explicitly required later.
- The version applies to all app-owned persisted localStorage entries.

---

## 3. Centralized storage utility behavior

All version logic must live in `src/utils/localStorage.ts`.

### Required exported functions

The module should expose:

```typescript
export function localStorageSetItem<T>(key: string, value: T): void;
export function localStorageGetItem<T>(key: string): T | null;
export function localStorageRemoveItem(key: string): void;
export function localStorageRemoveItems(keys: string[]): void;
```


Optional but recommended:

```typescript
export function isLocalStorageAvailable(): boolean;
export function isVersionedLocalStorageEnvelope(value: unknown): value is LocalStorageEnvelope<unknown>;
```


---

## 4. Write behavior

`localStorageSetItem` must wrap the given value before storing it.

Implementation requirements:

```typescript
const envelope: LocalStorageEnvelope<T> = {
  version: LOCAL_STORAGE_SCHEMA_VERSION,
  payload: value,
};
```


Then persist:

```typescript
localStorage.setItem(key, JSON.stringify(envelope));
```


Rules:

- Callers pass the raw application state.
- The utility wraps it.
- Callers must not manually create envelopes.
- Callers must not manually `JSON.stringify` persisted app state.

---

## 5. Read behavior

`localStorageGetItem` must:

1. Return `null` when running server-side.
2. Return `null` when localStorage is disabled/unavailable.
3. Read the raw string.
4. Return `null` if the key is missing.
5. Parse JSON.
6. Validate that parsed data is a versioned envelope.
7. Validate that `version === LOCAL_STORAGE_SCHEMA_VERSION`.
8. Return `payload` only if valid and compatible.
9. Hard-reset the key and return `null` if invalid or incompatible.

### Version mismatch behavior

If stored data is a valid envelope but has a different version:

```typescript
localStorage.removeItem(key);
return null;
```


Also log a warning, for example:

```typescript
console.warn(
  `[localStorageGetItem] Removed incompatible localStorage data for key "${key}". Stored version: ${storedVersion}, current version: ${LOCAL_STORAGE_SCHEMA_VERSION}.`,
);
```


### Legacy raw data behavior

If stored data is valid JSON but not a versioned envelope:

```typescript
localStorage.removeItem(key);
return null;
```


This intentionally invalidates pre-versioning localStorage data.

### Corrupted JSON behavior

If JSON parsing fails:

```typescript
localStorage.removeItem(key);
return null;
```


This avoids repeatedly failing on the same broken entry.

---

## 6. Envelope validation rules

A value is a valid envelope only if:

- it is a non-null object,
- it has a numeric `version`,
- it has a `payload` property.

Recommended guard:

```typescript
export function isVersionedLocalStorageEnvelope(
  value: unknown,
): value is LocalStorageEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof (value as { version?: unknown }).version === "number" &&
    "payload" in value
  );
}
```


Do not validate the internal payload shape in this generic utility. Payload validation, if needed, belongs to domain-specific code.

---

## 7. Update reducer persistence wrapper

Update the localStorage reducer wrapper so it relies on the centralized versioned helper.

Relevant file:

```plain text
src/context/utils/localStorageReducerWrapper.ts
```


Expected behavior:

- On first reducer call:
    - call `localStorageGetItem<T>(storageKey)`,
    - if compatible payload exists, merge it into the initial state,
    - if no compatible payload exists, use the current/default state.
- On state change:
    - call `localStorageSetItem(storageKey, newState)`,
    - this will persist the versioned envelope automatically.

Important:

- The wrapper must never inspect envelope versions directly.
- The wrapper must only deal with raw typed state.
- Version mismatch and stale-data removal must happen inside `localStorageGetItem`.

The existing merge behavior may remain:

```typescript
currentState = merge({}, initialState, savedState) as T;
```


This means compatible saved payloads are merged onto the current initial state.

---

## 8. Replace direct `localStorage` access for app-owned persisted state

Search for direct usage of:

```typescript
localStorage.getItem(...)
localStorage.setItem(...)
localStorage.removeItem(...)
```


For app-owned persisted state keys, replace with centralized helpers.

### Required replacements

#### Reads

Replace:

```typescript
const raw = localStorage.getItem(key);
const parsed = JSON.parse(raw);
```


With:

```typescript
const value = localStorageGetItem<Type>(key);
```


#### Writes

Replace:

```typescript
localStorage.setItem(key, JSON.stringify(value));
```


With:

```typescript
localStorageSetItem(key, value);
```


#### Removes

Replace:

```typescript
localStorage.removeItem(key);
```


With:

```typescript
localStorageRemoveItem(key);
```


For multiple removes:

```typescript
localStorageRemoveItems([
  KEY_A,
  KEY_B,
  KEY_C,
]);
```


### Important rule

Do not wrap unrelated browser/user-preference localStorage entries unless they are part of the app-owned persisted form/review state.

---

## 9. Review working copy persistence

The review working copy localStorage flow should also use the centralized helpers if it stores app-owned structured state.

Behavior requirements:

- `getWorkingCopy()` should call `localStorageGetItem<ReviewWorkingCopy>(key)`.
- If the result is `null`, it may return `null` or initialize a fresh fallback depending on existing UX expectations.
- `saveWorkingCopy()` should call `localStorageSetItem(key, payload)`.
- `clearWorkingCopy()` should call `localStorageRemoveItem(key)`.
- Initialization effects should use `localStorageGetItem` to check existence and `localStorageSetItem` to write initial values.

Do not manually parse or stringify review working copy state.

---

## 10. Feed/review boot payload persistence

Any code that persists bootstrapped form state into localStorage must use the centralized setter.

Replace patterns like:

```typescript
localStorage.setItem(KEY, JSON.stringify(state));
```


With:

```typescript
localStorageSetItem(KEY, state);
```


This includes review edit mode bootstrapping if it writes feed form, collection form, or single-piece form state into localStorage.

---

## 11. Reset flows

Manual reset flows must remove app-owned persisted keys using helpers.

For example:

```typescript
localStorageRemoveItems([
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  FEED_FORM_LOCAL_STORAGE_KEY,
]);
```


Guidelines:

- Do not reset by writing initial state unless the UX specifically requires it.
- Prefer removing persisted entries, then dispatching the relevant init action.
- Resetting should not need to know about envelope internals.

---

## 12. Constants and app-owned keys

Identify all app-owned localStorage keys, especially:

- feed form state
- single piece version form state
- collection piece versions form state
- review working copy state
- review boot/edit bridge state, if persisted

If useful, create a centralized list:

```typescript
export const APP_LOCAL_STORAGE_KEYS = [
  FEED_FORM_LOCAL_STORAGE_KEY,
  SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
  COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY,
] as const;
```


Only include static keys here. Dynamic keys, such as keys containing IDs, should be handled at the usage site.

---

## 13. Backward compatibility policy

The implementation intentionally does **not** migrate old localStorage values.

Cases:

| Stored value type | Behavior |
|---|---|
| Missing key | Return `null` |
| Corrupted JSON | Remove key, return `null` |
| Legacy raw object | Remove key, return `null` |
| Versioned envelope with old version | Remove key, return `null` |
| Versioned envelope with current version | Return `payload` |

This is a hard-reset policy.

---

## 14. TypeScript guidelines

Use generics for typed retrieval:

```typescript
const savedState = localStorageGetItem<FeedFormState>(FEED_FORM_LOCAL_STORAGE_KEY);
```


Avoid `any` where possible.

Acceptable generic utility type:

```typescript
export type LocalStorageEnvelope<T> = {
  version: number;
  payload: T;
};
```


The utility cannot guarantee runtime validity of `T`; it only guarantees envelope compatibility.

---

## 15. Error handling and logging

Use warnings for recoverable persistence invalidations:

- parse failure,
- invalid envelope,
- version mismatch.

Use errors only for unexpected failures during writing.

Recommended logging style:

```typescript
console.warn(`[localStorageGetItem] ...`);
console.error(`[localStorageSetItem] ...`);
```


Never throw from storage helpers for normal localStorage failures. The app should continue with default state.

---

## 16. SSR/client safety

Every helper must guard access with:

```typescript
typeof window !== "undefined"
```


Do not access `localStorage` during server-side rendering.

Recommended helper:

```typescript
export function isLocalStorageAvailable() {
  return typeof window !== "undefined" && USE_LOCAL_STORAGE;
}
```


All get/set/remove functions should call this.

---

## 17. Testing checklist

Add or update tests around the storage utility if the project has test coverage for utilities.

Minimum test cases:

### `localStorageSetItem`

- stores a JSON envelope
- stores current `LOCAL_STORAGE_SCHEMA_VERSION`
- stores original value under `payload`

### `localStorageGetItem`

- returns `null` when key does not exist
- returns payload when envelope version matches
- removes and returns `null` when version mismatches
- removes and returns `null` for legacy raw object
- removes and returns `null` for corrupted JSON
- removes and returns `null` for invalid envelope shape

### Integration expectations

- reducer wrapper receives raw state payload, not envelope
- state is persisted as envelope after reducer changes
- reset flows remove persisted keys

---

## 18. Manual QA checklist

After implementation:

1. Open the app with empty localStorage.
2. Fill part of a form.
3. Confirm localStorage entry is shaped like:

```json
{
     "version": 2,
     "payload": {}
   }
```


4. Refresh the page.
5. Confirm form state is restored.
6. Manually change stored `version` to an older number.
7. Refresh the page.
8. Confirm:
    - the stale key is removed,
    - form starts from default state,
    - no crash occurs.
9. Manually replace a stored value with a legacy raw state object.
10. Refresh.
11. Confirm:
- the key is removed,
- form starts from default state.
12. Test reset buttons.
13. Test review edit / working copy flows if they persist structured local state.

---

## 19. Implementation order

Follow this order to minimize breakage.

### Step 1 — Update `src/utils/localStorage.ts`

Implement:

- `LOCAL_STORAGE_SCHEMA_VERSION`
- `LocalStorageEnvelope<T>`
- `isLocalStorageAvailable`
- `isVersionedLocalStorageEnvelope`
- versioned `localStorageSetItem`
- version-aware `localStorageGetItem`
- `localStorageRemoveItem`
- `localStorageRemoveItems`

This is the foundation.

---

### Step 2 — Update reducer persistence wrapper

Update `src/context/utils/localStorageReducerWrapper.ts`.

Ensure:

- it keeps using `localStorageGetItem` and `localStorageSetItem`,
- it receives raw payloads from `localStorageGetItem`,
- it writes raw state to `localStorageSetItem`,
- it does not know about envelopes.

---

### Step 3 — Update all direct app-owned localStorage reads/writes

Replace direct app-owned structured persistence calls with helper calls.

Target patterns:

```typescript
localStorage.getItem(...)
localStorage.setItem(...)
localStorage.removeItem(...)
JSON.parse(...)
JSON.stringify(...)
```


Only replace app-owned persisted state entries.

---

### Step 4 — Update reset flows

Use `localStorageRemoveItem` or `localStorageRemoveItems`.

Ensure reset flows do not manually care about versions.

---

### Step 5 — Update review working copy / review edit boot persistence

Ensure all structured review-related persisted state also goes through helpers.

Dynamic keys are fine; helpers accept any string key.

---

### Step 6 — Run TypeScript and lint checks

Run the project’s normal validation commands.

Recommended:

```shell script
npm run lint
npm run test
npm run build
```


If some scripts do not exist, run the available project validation scripts.

---

### Step 7 — Manual QA

Use the manual QA checklist above, especially:

- valid envelope restore,
- version mismatch reset,
- legacy raw data reset,
- corrupted JSON reset,
- form reset behavior,
- review working copy behavior.

---

## 20. Non-goals

Do not implement data migrations in this task.

Specifically, do not:

- transform old contribution shapes,
- convert old raw localStorage data into new envelopes,
- keep per-key schema versions,
- expose envelope details to reducers/components,
- clear unrelated browser localStorage data.

The only compatibility action is hard reset of incompatible app-owned persisted entries.