# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Project

The Metronome Mark Database (MMDB): a database of metronome marks and time signatures for classical music
compositions, for musical research. See `README.md` for the domain overview and `prisma/README.md` for DB
workflows. Specs and architectural decision records live in `specs/` (some are in French).

Stack: Next.js 16 (App Router) · React 19 · TypeScript (strict, `noImplicitAny: false`) · Prisma 7 →
PostgreSQL (Neon) · next-auth v4 · Tailwind 4 + daisyUI · Jest 30 + Testing Library · d3 for charts.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run test           # jest --watch
npm run test:ci        # jest --ci
npx jest path/to/file.test.ts --ci      # single suite
npx jest -t "name substring" --ci       # single test by name
npx eslint .           # lint — see caveat below
```

**`npm run lint` is broken**: it runs `next lint`, which was removed in Next 16. Use `npx eslint .` instead.

Prisma:

```bash
npx prisma migrate dev              # create + apply migration, regenerate client + dbml
npx prisma migrate dev --create-only # edit the SQL before applying (used for partial indexes / raw constraints)
npx prisma generate                 # regenerate client into prisma/client (committed)
npx prisma migrate reset            # drop, re-migrate, re-seed
npx prisma db seed                  # tsx prisma/seedFromXlsx.ts
```

The generated Prisma client lives in `prisma/client/` and **is committed** — regenerate and commit it after any
schema change, along with the migration in `prisma/migrations/` and `prisma/dbml/schema.dbml`.
The seed caches its Excel-parsing output in `prisma/output/parsedDataOutput.js`; delete that file to force a
full re-parse.

Env vars (`.env`): `DATABASE_URL` (pooled, runtime), `DIRECT_URL` (direct, for migrations — bypasses pgBouncer),
`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `JWT_SECRET_KEY`, `RESEND_API_KEY`.

## Layout

| Path | Contents |
|---|---|
| `app/` | App Router. Route groups `(public)`, `(auth)`, `(signedIn)`; API handlers under `app/api/` |
| `features/<entity>/` | Domain UI, one folder per entity (`feed`, `review`, `piece`, `metronomeMark`, …) |
| `context/` | React reducers + providers for the three form states |
| `ui/` | Generic presentational components (`ui/form`, `ui/modal`, `ui/svg`) |
| `utils/` | Pure client-safe helpers |
| `utils/server/` | Server-only helpers (`db.ts`, auth guards, email, DB queries) — never import from client components |
| `types/` | Shared types, all derived from Prisma types where possible |
| `prisma/` | Schema, migrations, generated client, seed |
| `__tests__/` | Most tests; small utils colocate a `*.spec.ts` next to the module |

Path aliases: `@/*` → repo root, `@/prisma/client` → `prisma/client/client`, `@/auth` → `auth.ts`.

## Architecture

### Database

The database is PostgreSQL, with Prisma as the ORM. The schema is in `prisma/schema.prisma`, and the migrations are in `prisma/migrations`. The generated Prisma client is in `prisma/client`. A dbml diagram is in `prisma/dbml/schema.dbml`.

### Domain model

`MMSource` (a manuscript/edition) is the aggregate root of the whole app. It links to many `PieceVersion`s
through `MMSourcesOnPieceVersions` (ranked), and carries `Reference`s, `Contribution`s (person **xor**
organization, enforced only by convention — see the TODO in the schema) and `MetronomeMark`s.
A `PieceVersion` decomposes into `Movement`s → `Section`s; a `MetronomeMark` belongs to a
(`MMSource`, `Section`) pair. `Piece` optionally belongs to a `Collection` (with `collectionRank`).

Several constraints are raw SQL only (partial unique indexes on `Piece` and `Reference`) — read the migration
SQL, not just the schema, when reasoning about uniqueness.

### The three form states (most important thing to understand)

Data entry is a multi-step wizard over `MMSource`, backed by three separate reducer contexts, each persisted
to `localStorage` under its own key:

1. **`FeedFormState`** (`context/feedFormContext.tsx` + `feedFormReducer.ts`) — the global, flat state for the
   whole MM Source. Entities are stored as **flat arrays** (`persons`, `pieces`, `pieceVersions`,
   `collections`, `tempoIndications`, `metronomeMarks`, `mMSourceOnPieceVersions`, …) referencing each other
   by id. Steps are declared in `features/feed/multiStepMMSourceForm/stepsUtils.ts`; each step lists the
   `actionTypes` it may dispatch, and the reducer rejects any action type not declared by some step.
   Generic array actions carry `{ array, reset, deleteIdArray, idKey, next }` and go through
   `utils/upsertEntityInState.ts`.
2. **`SinglePieceVersionFormState`** (`context/singlePieceVersionFormContext.tsx`) — sub-wizard for one
   composer/piece/pieceVersion.
3. **`CollectionPieceVersionsFormState`** (`context/collectionPieceVersionForm/`) — sub-wizard for a collection.

**State isolation rule** (spec: `specs/singlePiece_form_state/20260420_regles_essentielles_singlePiece_form_state.md`,
`specs/collection_form_state/`): while a sub-wizard is open, its own state is the single source of truth.
`FeedFormState` is read **only** to hydrate it at open, and written **only once** at final confirmation via
`utils/commitSinglePieceVersionFormToFeedForm.ts` / `utils/commitCollectionPieceVersionsFormToFeedForm.ts`.
Do not add intermediate writes back into `FeedFormState`, and do not add compensating rollback logic — cancel
must be a no-op on the global state. Sub-form reducers apply dependency invalidation (changing composer
invalidates piece and pieceVersion; changing piece invalidates pieceVersion).

`localStorage` is versioned: `utils/localStorage.ts` wraps every value in
`{ version: LOCAL_STORAGE_SCHEMA_VERSION, payload }` and silently drops incompatible data on read. **Bump
`LOCAL_STORAGE_SCHEMA_VERSION` whenever a persisted form state's shape changes.**

### MM Source data display

When there is a change to the MM Source data structure or fields, the display must be updated to reflect the change.
There are many places where the MM Source data is displayed:
- the form where it is edited
- `features/explore/ComposerPiecesDetails.tsx`
- `features/explore/MMSourceDetails.tsx`
- `features/explore/MMSourceDetailsCompact.tsx`
- `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`
- `features/movement/ui/MovementOverview.tsx`
- `features/section/ui/SectionOverview.tsx`

### state ⇄ DB conversion

State shapes and Prisma input shapes are deliberately different. Conversion is done by a family of pure
helpers in `utils/` with a strict naming convention — follow it when adding one:

- `get<Entity>StateFromInput.ts` — DB row → form state
- `get<Entity>InputFromState.ts` / `get<Entity>NestedDBInputFromState.ts` / `get<Entity>CreateInput.ts` — form
  state → `Prisma.*CreateInput`

`app/api/feedForm/route.ts` is the single persistence entry point: it asserts the state is persistable
(`assertsIsPersistableFeedFormState`), creates persons/organizations/collections first, then the MM Source
and its metronome marks in a transaction.

### Review process

Reviewers (`REVIEWER`/`ADMIN`) validate submitted MM Sources field by field.

- `MMSource.reviewState` (`PENDING` → `IN_REVIEW` → `APPROVED`/`ABORTED`) acts as a lock; `Review`,
  `ReviewedEntity` (entities validated once, never re-reviewed: `doNotReviewTwice`) and `AuditLog`
  (before/after JSON per field change) record the outcome.
- `features/review/reviewChecklistSchema.ts` declares, per entity type, which fields must be checked.
  `reviewAdapters.ts` builds the `ChecklistGraph` from the DB overview, `expandRequiredChecklistItems.ts`
  expands it into concrete rows, `reviewProgress.ts` computes completion, `reviewDiff.ts` diffs the working
  copy against the original to find changed field paths, `auditCompose.ts` turns those into `AuditLog` rows.
- The reviewer edits by **round-tripping through the feed form**: `reviewEditBridge.ts` converts the review
  working copy into a `FeedFormState` boot payload (localStorage key `feedForm:boot`, consumed by
  `FeedFormProvider`), and `rebuildWorkingCopyFromFeedForm` converts it back on return. Any change to the feed
  form state shape must be mirrored here.
- Submission (`app/api/review/[reviewId]/submit/route.ts`) recomputes the diff **server-side** — the client
  payload is not trusted.

### Auth & authorization

next-auth (credentials + JWT) configured in `auth/options.ts`. Roles are ordered:
`USER < EDITOR < REVIEWER < ADMIN` (`utils/constants.ts`).

- **Page routes**: `proxy.ts` at the repo root (Next 16's renamed `middleware.ts`) guards `/feed`, `/explore`,
  `/review`, `/admin` by role and rewrites to `/logout` or `/not-authorized`. New protected route segments
  must be added both to the checks and to `config.matcher`.
- **API routes**: two coexisting mechanisms — older routes use a bearer JWT
  (`utils/server/isReqAuthorized.ts` + `getDecodedTokenFromReq.ts`, with `utils/fetchAPI.ts` sending the
  token), newer review/admin routes use `getServerSession(authOptions)` plus an explicit role check or
  `utils/server/hasMinimalRole.ts`.

## Conventions

- **Types are derived from Prisma**, not hand-written: `Prisma.XGetPayload<...>`, `satisfies Prisma.XSelect`
  (see `types/prismaSelections.ts`, `types/formTypes.ts`). Add to `types/` only what the client actually needs.
- Naming: PascalCase types/enums/components, camelCase functions/variables/files, UPPER_CASE constants,
  camelCase singular directories for entity folders.
- **Log/error messages are prefixed with the source in brackets**: `` `[feedFormReducer] action :` ``,
  `"[review start] Unauthorized"`. Keep this — triage depends on it.
- Use `debug` from `utils/debugLogger.ts` for development logging (no-ops in production); `prodLog` only when
  the message must survive to production.
- Route URLs are centralized in `utils/routes.ts` (`URL_*` constants, `GET_URL_*` builders) — add new ones
  there rather than inlining strings.
- Zod schemas live in `types/zodTypes.ts` and are used with `react-hook-form` + `@hookform/resolvers`.
- Styling is Tailwind 4 + daisyUI; the light/dark themes are defined inline in `styles/globals.css`.
- Jest 30 removed `toThrowError` — use `toThrow`.
- Prefer targeted edits over rewriting whole files; ask before a full rewrite (`.aiassistant/rules/mmdb.md`).
- `git add` newly created files — the generated Prisma client and migrations in particular.
