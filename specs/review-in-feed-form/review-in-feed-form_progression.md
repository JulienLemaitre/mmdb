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
- **Coût :** 0.13 credits (Gemini 3.7 Flash - High)

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
- **Coût :** 0.32 credits (Gemini 3.7 Flash - High)

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
- **Coût :** 0.52 credits (Gemini 3.7 Flash - High)

## L3 — Baseline serveur et hydratation

- **Fichiers modifiés / créés :**
  - `utils/server/getReviewBaseline.ts` (nouveau) :
    - Implémentation de `getReviewBaseline(reviewId, options?: { requireOwner?: boolean })` extrayant le graphe de la source MMSource et produisant une `FeedFormState` de base (sans `formInfo`), les métadonnées de revue / MMSource et le registre `GloballyReviewedIds`.
    - Resserrement de l'autorisation d'accès au propriétaire (`requireOwner: true` par défaut), avec contrôle de rôle (`REVIEWER`/`ADMIN`) et d'état (`IN_REVIEW`).
    - Implémentation de `buildReviewInitialFeedFormState({ baseline, globallyReviewed })` ajoutant les drapeaux `isNew` sur `persons`, `organizations`, `collections`, `pieces`, `pieceVersions` en fonction de `globallyReviewed` et initialisant `formInfo: { currentStepRank: 0, introDone: false, allSourceOnPieceVersionsDone: true }`.
  - `utils/server/extendBaselineByExistence.ts` (nouveau) :
    - Implémentation de `extendBaselineByExistence(baseline, submittedState, prisma?)` pour charger depuis la base de données toutes les entités existantes présentes dans l'état soumis mais absentes de la baseline (`Person`, `Organization`, `Collection`, `Piece`, `PieceVersion` avec `Movement`/`Section`, `TempoIndication`, `Reference`, `Contribution`, `MetronomeMark`), avec au plus 1 requête groupée `findMany` par type d'entité et aucune requête si aucun ID n'est manquant.
  - `eslint.config.mjs` : mise à jour de la configuration ESLint pour utiliser `testingLibrary.configs["flat/react"]` compatible Flat Config.
  - `__tests__/server/getReviewBaseline.test.ts` (nouveau) : tests de conformité `FeedFormState`, initialisation des drapeaux `isNew` et de `formInfo`, gestion des permissions / rôles / statuts `IN_REVIEW`.
  - `__tests__/server/extendBaselineByExistence.test.ts` (nouveau) : tests d'extension des entités existantes, absence des IDs inexistants, absence de requêtes inutiles et support de transaction Prisma personnalisée.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint utils/server/getReviewBaseline.ts utils/server/extendBaselineByExistence.ts __tests__/server/getReviewBaseline.test.ts __tests__/server/extendBaselineByExistence.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 46 suites passées / 46 total, 193 tests passés / 193 total (0 échec).
- **Statut L3 :** Terminé / Validé.
- **Coût :** 1.09 credits (Gemini 3.7 Flash - High)

## L4 — Nouvelle route `/review/[reviewId]`

- **Fichiers modifiés / créés :**
  - `features/feed/FeedFormShell.tsx` (nouveau) : extraction du shell visuel du formulaire (drawer + `NavBar` + colonne latérale `Steps` + zone principale avec `banner` optionnelle + `FeedFormHelpDrawer`), acceptant `title`, `asideExtra` et `banner`.
  - `app/(signedIn)/feed/layout.tsx` : refactorisé pour consommer `FeedFormShell` avec `ResetAllForms` dans `asideExtra`, et retrait de `ReviewEditBanner`.
  - `utils/routes.ts` : ajout des routes `GET_URL_REVIEW(reviewId)`, `GET_URL_API_REVIEW_SUBMIT(reviewId)`, et `GET_URL_API_REVIEW_ABORT(reviewId)`.
  - `app/(signedIn)/review/page.tsx` et `app/(signedIn)/review/reviewListClient.tsx` : mise à jour des redirections pour router vers `GET_URL_REVIEW(reviewId)`.
  - `context/formSessionContext.tsx` : gestion de l'invalidation locale lors de l'hydratation (purge des brouillons via `purgeReviewLocalDrafts` et notification toast WARNING en anglais `"Local draft reset: session does not match current user."` si le `reviewId` ou le `reviewerId` stocké diverge).
  - `app/(signedIn)/review/[reviewId]/layout.tsx` (nouveau) : composant serveur sécurisé vérifiant l'authentification (`REVIEWER`/`ADMIN`), chargeant la baseline via `getReviewBaseline(reviewId, { requireOwner: true })`, gérant les redirections `?reason=notFound | notOwner | notActive | unauthorized` vers `/review`, et montant `FormSessionProvider` (mode `review`), `FeedFormProvider` (clé `review:<reviewId>:feedForm` et `initialState` de revue) et `FeedFormShell`.
  - `app/(signedIn)/review/[reviewId]/page.tsx` (nouveau) : montage du formulaire `<MMSourceForm />` identique à la page `/feed`.
  - `__tests__/app/reviewLayout.test.tsx` (nouveau) : tests d'intégration du layout de revue (redirections `unauthorized`, `notOwner`, `notActive`, `notFound`, et montage réussi des providers et de `FeedFormShell`).
  - `__tests__/context/formSessionContext.test.tsx` : enrichissement avec le test d'invalidation locale du brouillon et affichage du toast WARNING.
- **Vérifications :**
  - `proxy.ts` : vérification que le matcher `/review/:path*` couvre la route.
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint app/(signedIn)/review/[reviewId]/layout.tsx app/(signedIn)/review/[reviewId]/page.tsx features/feed/FeedFormShell.tsx app/(signedIn)/feed/layout.tsx app/(signedIn)/review/page.tsx app/(signedIn)/review/reviewListClient.tsx utils/routes.ts context/formSessionContext.tsx __tests__/app/reviewLayout.test.tsx __tests__/context/formSessionContext.test.tsx` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 47 suites passées / 47 total, 200 tests passés / 200 total (0 échec).
- **Statut L4 :** Terminé / Validé.
- **Cout :** 0.48 credits (Gemini 3.7 Flash - High)
