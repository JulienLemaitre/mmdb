Ce document sert de mémoire persistante pour l'implémentation de la feuille de route "review-in-feedForm".
Document de cadrage qui fait foi : `specs/review-in-feed-form/20260808_cadrage_review-in-feed-form.md`
Feuille de route : `specs/review-in-feed-form/20260808_feuille-de-route_review-in-feed-form.md`

## L0 — Préparation et filet de sécurité

- **Branche de travail :** `review-in-feed-form` (créée depuis `master`)
- **État de référence des tests (`npm run test:ci` — 2026-08-16) :**
  - Test Suites : 39 passées / 39 total (0 échec)
  - Tests : 157 passés / 157 total (0 échec)
  - Snapshots : 0
  - Tous les tests passent. Aucun échec préexistant.
- **Inventaire des tests qui seront supprimés ou remplacés au Lot 12 :**
  - `__tests__/api.overview.test.ts`
  - `__tests__/api.submit.test.ts`
  - `__tests__/auditCompose.test.ts`
  - `__tests__/bridge.inverseMapping.roundtrip.test.ts`
  - `__tests__/reviewChecklistSchema.expand.test.ts`
  - `__tests__/reviewChecklistSchema.test.ts`
  - `__tests__/reviewDiff.degeCases.test.ts`
  - `__tests__/reviewDiff.rankChange.test.ts`
  - `__tests__/reviewDiff.test.ts`
  - `__tests__/ReviewEditBanner.test.tsx`
  - `__tests__/reviewEditBridge.test.ts`
  - `__tests__/reviewProgress.test.ts`
  - `__tests__/reviewProgress.withChecked.test.ts`
  - `__tests__/ui.checklist.disabledSubmit.test.tsx`
  - `__tests__/review-ui/checklistPage.progress.test.tsx`
  - `__tests__/review-ui/checklistRow.visualHints.test.tsx`
  - `__tests__/review-ui/restoreSliceScroll.test.tsx`
  - `__tests__/review-ui/sliceHeader.sticky.test.tsx`
  - `__tests__/review-ui/submitFlow.integration.test.tsx`
  - `__tests__/review-ui/submitGating.test.tsx`
- **Vérification de l'index partiel `review_unique_in_review_per_source` :**
  - Déclaration dans `prisma/schema.prisma` : `@@unique([mMSourceId], map: "review_unique_in_review_per_source", where: raw("state = 'IN_REVIEW'"))`
  - Migration : `prisma/migrations/20260809124656_review_unique_in_review_per_source/migration.sql`
  - Vérification en base PostgreSQL (`pg_indexes`) : index `review_unique_in_review_per_source` présent et actif (`WHERE (state = 'IN_REVIEW'::"REVIEW_STATE")`).
- **Statut L0 :** Terminé / Validé.
- **Cost :** 0.13 credits (Gemini 3.7 Flash - High)

## L1 — Socle de types et contexte de session

- **Fichiers modifiés / créés :**
  - `types/feedFormTypes.ts` : suppression de `ReviewContext`, de `FeedFormInfo.reviewContext` et de `FeedFormInfo.allSourceContributionsDone` ; extension de `FeedFormProviderProps` avec `storageKey?: string` et `initialState?: FeedFormState | null`.
  - `types/zodTypes.ts` : ajout des schémas Zod `FormModeSchema`, `GloballyReviewedIdsSchema`, `ReviewSessionMetaSchema`, `FormSessionSchema` et export des types inférés correspondants (`FormMode`, `GloballyReviewedIds`, `ReviewSessionMeta`, `FormSession`).
  - `context/formSessionContext.tsx` (nouveau) : implémentation de `FormSessionProvider` et du hook `useFormSession()`. Gestion du mode par défaut (`data-entering`) hors provider, synchronisation et validation de `ReviewSessionMeta` via `ReviewSessionMetaSchema.safeParse` vers la clé `review:<reviewId>:session`, exposition de `setOverallComment()` en mode `review`.
  - `types/formTypes.ts` : retrait de la vérification de `reviewContext` dans `assertsIsPersistableFeedFormState`.
  - `__tests__/context/formSessionContext.test.tsx` (nouveau) : couverture complète des cas de test (mode par défaut hors provider, mode data-entering, mode review, lecture/écriture de `overallComment`, persistance et hydratation `localStorage`, repli en cas de données invalides ou divergentes).
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npm run test:ci` : 40 suites passées / 40 total, 163 tests passés / 163 total (0 échec).
- **Statut L1 :** Terminé / Validé.
- **Cost :** 0.32 credits (Gemini 3.7 Flash - High)

## L2 — Clés de stockage paramétrables

- **Fichiers modifiés / créés :**
  - `context/utils/localStorageReducerWrapper.ts` : ajout de l'option `{ hydrationStrategy?: "merge" | "replace" }` dans `withLocalStorage` (par défaut `"merge"` pour préserver le comportement existant, `"replace"` pour remplacer l'état initial sans merge hybride).
  - `context/feedFormReducer.ts` : ajout de la fabrique `createFeedFormReducer(storageKey, initialState, options)` et maintien de l'export `feedFormReducer`.
  - `context/singlePieceVersionFormReducer.ts` : ajout de la fabrique `createSinglePieceVersionFormReducer(storageKey, initialState, options)` et maintien de l'export `singlePieceVersionFormReducer`.
  - `context/collectionPieceVersionForm/collectionPieceVersionFormReducer.ts` : ajout de la fabrique `createCollectionPieceVersionsFormReducer(storageKey, initialState, options)` et maintien de l'export `collectionPieceVersionsFormReducer`.
  - `context/feedFormContext.tsx`, `context/singlePieceVersionFormContext.tsx`, `context/collectionPieceVersionForm/collectionPieceVersionsFormContext.tsx` : paramétrage des trois providers avec les props `storageKey` et `initialState` (valeurs par défaut conformes aux clés et états initiaux existants), création stable d'une instance de reducer par provider via initialiseur `useState(() => ...)`, et lecture de `storageKey` dans les effets d'initialisation.
  - `types/singlePieceVersionFormTypes.ts`, `types/collectionPieceVersionFormTypes.ts` : ajout/mise à jour des types de props `SinglePieceVersionFormProviderProps` et `CollectionPieceVersionsFormProviderProps` avec `storageKey?: string` et `initialState?: ... | null`.
  - `utils/constants.ts` : ajout de `REVIEW_LOCAL_STORAGE_PREFIX` et `GET_REVIEW_STORAGE_KEYS(reviewId)`.
  - `utils/localStorage.ts` :
    - Bump de `LOCAL_STORAGE_SCHEMA_VERSION` de 6 à 7.
    - Émission de l'événement DOM `STORAGE_INVALIDATED_EVENT` (`"mmdb:storage-invalidated"`) avec `{ detail: { key, reason } }` en cas de corruption JSON, d'enveloppe invalide ou de version obsolète.
    - Ajout du helper `purgeReviewLocalDrafts(reviewId?: string)` pour purger les 4 clés d'une revue spécifique ou toutes les clés `review:*`.
  - `context/toastNotification/toastNotificationContext.tsx` : écouteur de l'événement `"mmdb:storage-invalidated"` dans `ToastNotificationProvider` pour afficher un toast d'avertissement en anglais (`"Your previous local draft was reset due to an application update."`).
  - Tests créés :
    - `__tests__/context/localStorageReducerWrapper.test.ts` : tests des stratégies `merge` vs `replace`, isolation des instances de fabrique / closures.
    - `__tests__/utils/purgeReviewLocalDrafts.test.ts` : tests de purge par `reviewId` ou globale pour toutes les clés `review:*`.
    - `__tests__/utils/localStorage.test.ts` : tests d'invalidation, émission d'événement et opérations de base sur le localStorage versionné.
    - `__tests__/context/toastNotificationContext.test.tsx` : test d'affichage du toast WARNING en anglais lors de l'invalidation locale.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npm run test:ci` : 44 suites passées / 44 total, 178 tests passés / 178 total (0 échec).
- **Statut L2 :** Terminé / Validé.
- **Cost :** 0.52 credits (Gemini 3.7 Flash - High)
