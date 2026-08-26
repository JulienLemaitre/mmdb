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
  - `__tests__/reviewDiff.edgeCases.test.ts`
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

## L5 — Habillage de la session de revue

- **Fichiers modifiés / créés :**
  - `features/review/components/ReviewSessionBanner.tsx` (nouveau) : bandeau supérieur de session de revue indiquant l'état en cours, rappelant que les modifications restent locales, identifiant la source (titre, compositeur, lien permanent), et portant les boutons d'accès aux modales de diff et de commentaire ainsi qu'au bouton d'abandon (aucun indicateur de progression).
  - `features/review/components/OverallCommentModal.tsx` (nouveau) : modale de saisie et d'édition du commentaire général de revue (`overallComment`), synchronisée avec `FormSessionContext` et le stockage local, accessible à tout moment sans requête réseau intermédiaire.
  - `features/review/components/ReviewDiffModal.tsx` (nouveau) : modale affichant en temps réel la liste des différences entre l'état courant (`FeedFormState`) et la `baseline` serveur, consommant `computeChangedFieldPaths(baseline, state)`.
  - `features/review/components/AbortReviewButton.tsx` (nouveau) : bouton et modale de confirmation d'abandon de revue avertissant de la perte définitive des modifications locales, appelant `POST /api/review/[reviewId]/abort`, purgeant les brouillons locaux via `purgeReviewLocalDrafts` uniquement après confirmation de succès, et redirigeant vers `/review` (sans purge en cas d'échec de la requête).
  - `features/review/reviewDiff.ts` : export de `ChangedField` et déclaration de `computeChangedFieldPaths` (implémentation temporaire typée pour L5 avant L7).
  - `app/(signedIn)/review/[reviewId]/layout.tsx` : injection de `ReviewSessionBanner` dans le slot `banner` de `FeedFormShell`.
  - Tests créés :
    - `__tests__/features/review/AbortReviewButton.test.tsx` : tests d'ouverture de modale, annulation, succès avec purge et redirection, et gestion des erreurs d'API/réseau sans purge.
    - `__tests__/features/review/OverallCommentModal.test.tsx` : tests d'ouverture/fermeture, préremplissage, édition, effacement et sauvegarde dans `FormSessionContext`.
    - `__tests__/features/review/ReviewDiffModal.test.tsx` : tests d'affichage sans modification et avec liste détaillée de champs modifiés.
    - `__tests__/features/review/ReviewSessionBanner.test.tsx` : tests de non-rendu hors mode revue, affichage des métadonnées de source, ouverture des modales de diff et de commentaire, et présence du bouton d'abandon.
    - `__tests__/app/reviewLayout.test.tsx` : mise à jour pour valider le rendu du bandeau dans le layout.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint features/review/reviewDiff.ts features/review/components/AbortReviewButton.tsx features/review/components/OverallCommentModal.tsx features/review/components/ReviewDiffModal.tsx features/review/components/ReviewSessionBanner.tsx app/(signedIn)/review/[reviewId]/layout.tsx __tests__/features/review/AbortReviewButton.test.tsx __tests__/features/review/OverallCommentModal.test.tsx __tests__/features/review/ReviewDiffModal.test.tsx __tests__/features/review/ReviewSessionBanner.test.tsx __tests__/app/reviewLayout.test.tsx` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 51 suites passées / 51 total, 219 tests passés / 219 total (0 échec).
- **Statut L5 :** Terminé / Validé.
- **Coût :** 0.64 credits (Gemini 3.7 Flash - High)

## L6 — Étapes polymorphes : `Intro` et `FeedSummary`

- **Fichiers modifiés / créés :**
  - `features/feed/multiStepMMSourceForm/stepForms/Intro.tsx` : conditionnement du contenu affiché sur `useFormSession().mode` (en mode `review` : titre `"Review Process"`, texte descriptif de revue, bouton `"Start Review"` posant `introDone: true` et passant à l'étape suivante ; en mode `data-entering` : comportement et textes de tutoriel existants préservés).
  - `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx` : factorisation et polymorphisme des actions et états :
    - En mode `data-entering` : maintien strict du comportement existant (`POST /api/feedForm`, emails de log, modale d'information, réinitialisation locale des 3 clés et `initFeedForm`).
    - En mode `review` : désactivation du bouton tant que les étapes précédentes ne sont pas complètes selon `lastCompletedStepRank >= 4`, libellé `"Approve and Submit Review"`, modale de confirmation explicite avant soumission, appel à `POST /api/review/[reviewId]/submit` avec payload `{ feedFormState: state, overallComment }`, purge des brouillons locaux via `purgeReviewLocalDrafts(reviewId)` et redirection vers `/review` sur succès, affichage de l'erreur sans purge ni redirection en cas d'échec serveur.
  - Tests créés :
    - `__tests__/features/feed/Intro.test.tsx` : tests du rendu et des interactions en mode `data-entering` et en mode `review`.
    - `__tests__/features/feed/FeedSummary.dataEntering.test.tsx` : tests de non-régression de la soumission de création, envoi d'emails, affichage de modale et réinitialisation du formulaire.
    - `__tests__/features/feed/FeedSummary.review.test.tsx` : tests de désactivation si étape incomplète, activation si étapes complètes, ouverture et annulation de modale de confirmation, soumission réussie avec purge locale et redirection vers `/review`, gestion d'erreur serveur sans purge ni redirection.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint features/feed/multiStepMMSourceForm/stepForms/Intro.tsx features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx __tests__/features/feed/Intro.test.tsx __tests__/features/feed/FeedSummary.dataEntering.test.tsx __tests__/features/feed/FeedSummary.review.test.tsx` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 54 suites passées / 54 total, 229 tests passés / 229 total (0 échec).
- **Statut L6 :** Terminé / Validé.
- **Coût :** 0.83 credits (Gemini 3.7 Flash - High)

## L7 — Moteur de diff sur `FeedFormState`

- **Fichiers modifiés / créés :**
  - `features/review/reviewDiffFieldsSchema.ts` (nouveau) : définition de `REVIEW_DIFF_FIELDS_SCHEMA`, `getDiffFields`, `isDoNotReviewTwice`, `buildFieldPath`, `buildSourceJoinRankPath` et `ENTITY_PREFIX` épurés de tout champ UI (`label`, `meta`), avec avertissement de maintenance en tête.
  - `features/review/reviewChecklistSchema.ts` : re-export pour rétrocompatibilité jusqu'au lot L12.
  - `features/review/reviewDiff.ts` : réécriture complète de `computeChangedFieldPaths(baseline, working)` opérant sur deux `FeedFormState`, comparant récursivement la source, les références, les contributions, les entités de premier niveau (`Person`, `Organization`, `Collection`, `Piece`, `TempoIndication`, `MetronomeMark`), l'arbre des versions de pièces (`PieceVersion` -> `Movement` -> `Section`), et détectant les ajouts, suppressions, substitutions et changements de rang des joins `mMSourceOnPieceVersions` indexés par `pieceVersionId`.
  - `features/review/utils/auditCompose.ts` : adaptation de `findNodeInState` et de `composeAuditEntries` à `FeedFormState` avec table de correspondance exhaustive `AuditEntityType`, calcul systématique de `contentsOrder` trié dans les snapshots `before`/`after` de `MM_SOURCE`, et filtrage des suppressions d'entités protégées via `protectedEntityIds`.
  - `types/reviewTypes.ts` : mise à jour des types (`ReviewEntityType`, `ReviewDiffField`, `ReviewDiffEntitySchema`, `ReviewDiffFieldsSchema`, `ChangedField`, `AuditOperation`, `AuditEntityType`, `AuditEntry`, et alias de compatibilité).
  - `features/review/reviewMock.ts` : export de `buildMockFeedFormState` et enrichissement de `buildMockOverview` retournant `state` (`FeedFormState`), `graph` et `globallyReviewed`.
  - Tests modifiés / créés :
    - `__tests__/reviewDiffFieldsSchema.test.ts` (nouveau) : tests unitaires du schéma de diff, des drapeaux `doNotReviewTwice`, et des formateurs de chemin `buildFieldPath` et `buildSourceJoinRankPath`.
    - `__tests__/reviewDiff.test.ts` : tests exhaustifs de diff à chaque niveau de `FeedFormState` (source, références, contributions, personnes, organisations, collections, pièces, versions, mouvements, sections, marques métronomiques, joins).
    - `__tests__/reviewDiff.edgeCases.test.ts` : tests des cas limites (normalisation `"" ≡ undefined ≡ null`, transitions `null -> valeur` et `valeur -> null`, créations d'entités).
    - `__tests__/reviewDiff.rankChange.test.ts` : tests des permutations de rangs, ajouts, retraits et substitutions de `pieceVersionId` de joins.
    - `__tests__/auditCompose.test.ts` : tests de composition des entrées d'audit, snapshots `contentsOrder`, créations/suppressions et filtrage par `protectedEntityIds`.
    - `__tests__/reviewChecklistSchema.test.ts` & `__tests__/reviewChecklistSchema.expand.test.ts` : adaptation aux nouveaux schémas sans `label`.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint features/review/reviewDiffFieldsSchema.ts features/review/reviewChecklistSchema.ts features/review/reviewDiff.ts features/review/utils/auditCompose.ts types/reviewTypes.ts features/review/reviewMock.ts __tests__/reviewDiffFieldsSchema.test.ts __tests__/reviewDiff.test.ts __tests__/reviewDiff.edgeCases.test.ts __tests__/reviewDiff.rankChange.test.ts __tests__/auditCompose.test.ts __tests__/reviewChecklistSchema.test.ts __tests__/reviewChecklistSchema.expand.test.ts features/review/utils/expandRequiredChecklistItems.ts app/api/review/[reviewId]/submit/route.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 55 suites passées / 55 total, 245 tests passés / 245 total (0 échec).
- **Statut L7 :** Terminé / Validé.
- **Coût :** 0.85 credits (Gemini 3.7 Flash - High)

## L8 — Normalisation serveur

- **Fichiers modifiés / créés :**
  - `utils/server/normalizeFeedFormStateForPersistence.ts` (nouveau) : fonction pure de normalisation de `FeedFormState` pour la persistance et le diff, appliquant dans l'ordre strict :
    1. Retrait des marques métronomiques `noMM: true` pour produire les suppressions en base et les `DELETE` d'audit correspondants (§12.1).
    2. Retrait de l'intégralité des drapeaux UI de formulaire (`isNew`, `isComposerNew`, `isCollectionNew`, `isPieceNew`, `next`, `noDate`, etc.).
    3. Normalisation des valeurs vides (`""` et `undefined` → `null`), partageant l'implémentation de `norm()` du moteur de diff pour prévenir les faux positifs.
    4. Réindexation et garantie de continuité des rangs de `mMSourceOnPieceVersions` à partir de 1.
    5. Attribution d'UUIDs serveur pour les entités sans ID (sans avertissement pour les `Reference`, avec avertissement `prodLog.warn` pour les autres entités).
    6. Vérification de cohérence (présence obligatoire de `tempoIndicationId` sur chaque section, et validation que chaque marque métronomique conservée référence un `sectionId` existant dans l'état).
  - `__tests__/server/normalizeFeedFormStateForPersistence.test.ts` (nouveau) : suite de tests unitaires couvrant exhaustivement chacune des 6 règles, le scénario dédié `noMM`, l'attribution d'IDs avec et sans log d'avertissement, les erreurs de cohérence et l'immutabilité de l'état d'entrée.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint utils/server/normalizeFeedFormStateForPersistence.ts __tests__/server/normalizeFeedFormStateForPersistence.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 56 suites passées / 56 total, 260 tests passés / 260 total (0 échec).
- **Statut L8 :** Terminé / Validé.
- **Coût :** 0.51 credits (Gemini 3.7 Flash - High)

## L9 — Fork de `PieceVersion`

- **Fichiers modifiés / créés :**
  - `utils/server/forkModifiedSharedPieceVersions.ts` (nouveau) : implémentation de l'évaluation et du clonage transactionnel des `PieceVersion` partagées et modifiées :
    - `isPieceVersionModified(baselinePv, statePv)` : détection de modification sur le sous-arbre `PieceVersion` (`category`, `pieceId`, `Movement`s, `Section`s) en réutilisant le moteur de diff du Lot L7 (`computeChangedFieldPaths`).
    - `forkModifiedSharedPieceVersions(tx, { mMSourceId, baseline, state })` :
      - Parcours des versions liées à la source en revue (`state.mMSourceOnPieceVersions`).
      - Détection de partage en base via `tx.mMSourcesOnPieceVersions.count({ where: { pieceVersionId: pv.id, mMSourceId: { not: mMSourceId } } })`.
      - Si modifiée et partagée avec au moins une autre source : clonage complet (`PieceVersion`, `Movement`s, `Section`s avec nouvelles UUIDs et valeurs issues de l'état soumis, `pieceId` et `tempoIndicationId` préservés).
      - Enregistrement de tous les IDs d'origine (baseline et état) dans `protectedEntityIds` pour empêcher toute suppression en base ou dans l'audit lors de la persistance.
      - Remappage strict de l'état soumis (`pieceVersions`, `mMSourceOnPieceVersions`, `metronomeMarks`, `mMSourceDescription.pieceVersions`).
      - Journalisation serveur via `prodLog.info("[forkPieceVersion] <ancien> → <nouveau> (source <id>)")`.
  - `__tests__/server/forkModifiedSharedPieceVersions.test.ts` (nouveau) : suite de tests unitaires couvrant l'ensemble des 10 scénarios et cas limites spécifiés (version modifiée+partagée, modifiée+non partagée, non modifiée+partagée, partagée uniquement avec elle-même, ajout de section seul, suppression de mouvement seule, transitions `null ↔ valeur`, préservation de `tempoIndicationId`, intégrité de `protectedEntityIds`, isolation des marques métronomiques et gestion de multiples versions mixtes).
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint utils/server/forkModifiedSharedPieceVersions.ts __tests__/server/forkModifiedSharedPieceVersions.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 57 suites passées / 57 total, 279 tests passés / 279 total (0 échec).
- **Statut L9 :** Terminé / Validé.
- **Coût :** 0.4 credits (Gemini 3.7 Flash - High)

## L10A — Helpers de soumission et gestion des rangs en deux phases

- **Fichiers modifiés / créés :**
  - `utils/server/computeMMSourceDerivedData.ts` (nouveau) : helper pur extrayant les données dérivées de `FeedFormState` :
    - `sectionCount` : somme du nombre de sections de toutes les `PieceVersion` liées à la source via `mMSourceOnPieceVersions` (après remappage du fork).
    - `permalink` : calcul systématique du permalien canonique via `getIMSLPPermaLink(state.mMSourceDescription.link)` (ou chaîne vide si absent/vide).
  - `utils/server/applyRankUpdatesInTwoPhases.ts` (nouveau) : helper transactionnel Prisma gérant les permutations et réordonnancements de rangs sans collision d'unicité :
    - Algorithme en 2 passes : assignation préalable de rangs temporaires hors plage (`baseOffset + i + 1` avec `baseOffset = Math.max(1000, maxRank + 1000)`) pour libérer les places ordonnées, puis écriture des rangs définitifs cibles.
    - Support des 4 modèles et contraintes d'unicité du schéma : `MMSourcesOnPieceVersions` (`mMSourceId`), `Movement` (`pieceVersionId`), `Section` (`movementId`), `Piece` (`collectionId`, `collectionRank`).
    - Détection et optimisation pour ignorer les éléments dont le rang ne change pas (aucun appel DB inutile si aucun changement).
    - Validation préalable : vérification d'unicité des rangs cibles dans l'entrée, présence des champs de scope et existence des enregistrements ciblés.
  - `__tests__/server/computeMMSourceDerivedData.test.ts` (nouveau) : tests unitaires couvrant les calculs multi-pièces/mouvements/sections, l'exclusion des versions non liées, les états vides/minimaux et les divers formats de liens IMSLP / miroirs / Gallica / vides.
  - `__tests__/server/applyRankUpdatesInTwoPhases.test.ts` (nouveau) : suite de tests unitaires avec mock transactionnel simulant strictement les contraintes d'unicité de PostgreSQL, couvrant le swap 1 ↔ 2 sur les 4 modèles (en PascalCase et camelCase), les inversions complètes et décalages cycliques de listes, la gestion des non-changements et réordonnancements partiels, ainsi que l'ensemble des cas d'erreurs de validation.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint utils/server/computeMMSourceDerivedData.ts utils/server/applyRankUpdatesInTwoPhases.ts __tests__/server/computeMMSourceDerivedData.test.ts __tests__/server/applyRankUpdatesInTwoPhases.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 59 suites passées / 59 total, 300 tests passés / 300 total (0 échec).
- **Statut L10A :** Terminé / Validé.
- **Coût :** 0.39 credits (Gemini 3.7 Flash - High)

## L10B — Route de soumission réécrite et clôture de revue

- **Fichiers modifiés / créés :**
  - `app/api/review/[reviewId]/submit/route.ts` : réécriture intégrale de la route `POST /api/review/[reviewId]/submit` orchestrant :
    1. Authentification (`getServerSession(authOptions)`), vérification des rôles (`REVIEWER`/`ADMIN`), de l'appartenance de la revue (`review.creatorId === session.user.id`) et de l'état actif (`IN_REVIEW`).
    2. Extraction et validation du payload `{ feedFormState, overallComment }`, vérification des champs obligatoires (sur le modèle de `app/api/feedForm/route.ts`) et garde de structure `assertsIsPersistableFeedFormState`.
    3. Chargement de la baseline serveur via `getReviewBaseline(reviewId, { requireOwner: true })` et extension par existence via `extendBaselineByExistence(baseline, state)`.
    4. Normalisation de l'état soumis via `normalizeFeedFormStateForPersistence(state)`.
    5. Calcul du pré-diff et pré-audit, et envoi de l'e-mail de log de pré-transaction (`"Review SUBMIT data"`).
    6. Exécution de la transaction unique Prisma (`db.$transaction`) :
       - **Étape A / Fork :** appel de `forkModifiedSharedPieceVersions(tx, ...)` produisant l'état remappé et l'ensemble `protectedEntityIds`.
       - **Étape B / Recalcul :** recalcul du diff final (`computeChangedFieldPaths`), des entrées d'audit (`composeAuditEntries` avec exclusion des `DELETE` sur `protectedEntityIds`), et des données dérivées (`computeMMSourceDerivedData`).
       - **Phase 1 — Suppressions :** suppression en cascade et nettoyage des marques métronomiques (`noMM`), sections et mouvements (hors `protectedEntityIds`), références, contributions et joins `mMSourcesOnPieceVersions` retirés ou remappés.
       - **Phase 2 — Référentiels et arbre musical :** mutations ordonnées `Person` → `Organization` → `Collection` → `TempoIndication` → `Piece` → `PieceVersion` (copies du fork incluses) → `Movement` → `Section`, fondées sur la baseline étendue (nouveau → `create`, modifié → `update`, inchangé → aucune écriture), avec réordonnancements de rangs en 2 passes via `applyRankUpdatesInTwoPhases` pour `Piece` (`collectionRank`), `Movement` et `Section`.
       - **Phase 3 — Source et enfants directs :** mise à jour de `MMSource` (champs, `permalink` et `sectionCount`), upserts de `Reference`, `Contribution`, création et mise à jour de rangs en 2 passes de `MMSourcesOnPieceVersions`, et upserts de `MetronomeMark`.
       - **Phase 4 — Traçabilité et clôture :** `AuditLog.createMany`, upsert dédupliqué de `ReviewedEntity` (avec exclusion des entités déjà globalement revues), passage de `Review` en `APPROVED` (`endedAt`, `overallComment`), et passage de `MMSource.reviewState` en `APPROVED`.
    7. Envoi de l'e-mail de succès transactionnel (`"Review submit transaction debug"`) avec données DB rechargées, ou e-mail d'erreur (`"Review SUBMIT transaction ERROR"`), avec traduction des conflits d'unicité en `409` et retour JSON synthétique.
  - `__tests__/api.reviewSubmit.test.ts` (nouveau, remplace `__tests__/api.submit.test.ts`) : suite de tests d'intégration avec mock transactionnel Prisma couvrant l'ensemble des 14 scénarios et exigences du lot 10B.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint app/api/review/[reviewId]/submit/route.ts __tests__/api.reviewSubmit.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 59 suites passées / 59 total, 312 tests passés / 312 total (0 échec).
- **Statut L10B :** Terminé / Validé.
- **Coût :** 0.72 credits (Gemini 3.7 Flash - High)

## L11 — Gardes de démarrage et contraintes en base

- **Fichiers modifiés / créés :**
  - `prisma/schema.prisma` : ajout de l'index unique partiel `@@unique([creatorId], map: "review_unique_in_review_per_reviewer", where: raw("state = 'IN_REVIEW'"))` sur le modèle `Review`.
  - `prisma/migrations/20260825182000_review_unique_in_review_per_reviewer/migration.sql` (nouveau) : migration SQL appliquant la création concurrente de l'index unique partiel `review_unique_in_review_per_reviewer`.
  - `specs/20260808_MIGRATION_NOTE_review-unique-in-review-per-reviewer.md` (nouveau) : note de migration d'accompagnement décrivant l'objectif, la déclaration Prisma, le SQL appliqué et les requêtes de vérification en base.
  - `app/api/review/start/route.ts` :
    - Ajout du contrôle préalable vérifiant qu'aucune revue `IN_REVIEW` n'est déjà en cours pour le reviewer (`db.review.findFirst({ where: { creatorId: session.user.id, state: REVIEW_STATE.IN_REVIEW } })`) avec retour d'une erreur 409 explicite.
    - Élargissement de la détection d'erreurs en cas de violation de contrainte d'unicité (bloc `catch`) pour distinguer les conflits d'index `review_unique_in_review_per_reviewer` (revue déjà en cours pour ce reviewer) et `review_unique_in_review_per_source` (source déjà prise par un autre reviewer).
  - `app/(signedIn)/review/reviewListClient.tsx` : affichage du message d'erreur serveur spécifique lors d'un code HTTP 409 lorsque le reviewer a déjà une revue active.
  - `__tests__/api.start.test.ts` : adaptation et enrichissement de la suite de tests pour couvrir le refus si le reviewer a déjà une revue active, le refus si la source est déjà en cours de revue, le refus pour sa propre source, la gestion des conflits sur les deux index uniques partiels et le cas nominal de création.
- **Vérifications :**
  - Migration appliquée avec succès via `npx prisma migrate deploy` et client régénéré via `npx prisma generate`.
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint app/api/review/start/route.ts app/(signedIn)/review/reviewListClient.tsx __tests__/api.start.test.ts` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 59 suites passées / 59 total, 317 tests passés / 317 total (0 échec).
- **Statut L11 :** Terminé / Validé.
- **Coût :** 0.45 credits (Gemini 3.7 Flash - High)

## L12 — Suppressions et nettoyage

- **Fichiers et dossiers supprimés :**
  - **Routes et pages :**
    - `app/(signedIn)/review/[reviewId]/checklist/` (layout + page)
    - `app/api/review/[reviewId]/overview/` (route)
  - **Contexte et bridge :**
    - `features/review/reviewEditBridge.ts`
    - `context/reviewWorkingCopyContext.tsx`
    - `features/review/components/ReviewWorkingCopyClientProvider.tsx`
    - `features/review/components/ReviewEditBanner.tsx`
  - **Logique de checklist et anciens helpers :**
    - `features/review/reviewChecklistSchema.ts`
    - `features/review/reviewAdapters.ts`
    - `features/review/reviewProgress.ts`
    - `features/review/utils/expandRequiredChecklistItems.ts`
    - `features/review/utils/areAllItemsChecked.ts`
    - `features/review/utils/getItemValueDisplay.ts`
    - `features/review/utils/isCollectionCompleteInChecklistGraph.ts`
    - `features/review/utils/processSourceOnPieceVersionsForDisplay.ts`
    - `features/review/slices/` (`CollectionSlice.tsx`, `PieceSlice.tsx`, `SummarySlice.tsx`)
    - `features/review/SliceHeader.tsx`
    - `features/review/components/ChecklistItemRow.tsx`
    - `features/review/components/ChecklistRow.tsx`
    - `utils/server/getReviewOverview.ts`
  - **Anciens tests obsolètes :**
    - `__tests__/ReviewEditBanner.test.tsx`
    - `__tests__/api.overview.test.ts`
    - `__tests__/bridge.inverseMapping.roundtrip.test.ts`
    - `__tests__/reviewChecklistSchema.expand.test.ts`
    - `__tests__/reviewChecklistSchema.test.ts`
    - `__tests__/reviewEditBridge.test.ts`
    - `__tests__/reviewProgress.test.ts`
    - `__tests__/reviewProgress.withChecked.test.ts`
    - `__tests__/review-ui/` (`checklistPage.progress.test.tsx`, `checklistRow.visualHints.test.tsx`, `restoreSliceScroll.test.tsx`, `sliceHeader.sticky.test.tsx`, `submitFlow.integration.test.tsx`, `submitGating.test.tsx`)
    - `__tests__/ui.checklist.disabledSubmit.test.tsx`
- **Fichiers modifiés pour nettoyage des références :**
  - `utils/getEntityByIdOrKey.ts` : suppression de l'union `| ChecklistGraph` et typage exclusif sur `FeedFormState`.
  - `types/reviewTypes.ts` : suppression de `ChecklistGraph`, `RequiredChecklistItem`, `GloballyReviewedEntityArrays`, `RequiredPredicateCtx`, `ExpandOptions`, `NodeLike`, `ApiOverview`, `SourceOnPieceVersion` et des alias de rétrocompatibilité checklist.
  - `utils/constants.ts` : suppression des constantes obsolètes `FEED_FORM_BOOT_KEY` et `feedFormFromWorkingCopyError`.
  - `utils/routes.ts` : suppression des helpers de routes obsolètes `GET_URL_API_REVIEW_OVERVIEW` et `GET_URL_REVIEW_CHECKLIST`.
  - `features/review/reviewMock.ts` : suppression de `ChecklistGraph` et de `buildMockOverview` (seul `buildMockFeedFormState` est conservé).
  - `context/feedFormContext.tsx` : retrait de l'effet de consommation du boot bridge (`consumeBootStateForFeedForm`).
  - `features/review/reviewDiffFieldsSchema.ts` & `features/review/reviewDiff.ts` : retrait des alias de compatibilité temporaires (`getChecklistFields`, `REVIEW_CHECKLIST_SCHEMA`, `ChangedChecklistItem`, `computeChangedChecklistFieldPaths`).
- **Vérifications :**
  - Recherche globale grep de `checklist|Checklist|CHECKLIST|workingCopy|WorkingCopy|reviewContext|BOOT_KEY` dans tous les fichiers `*.ts` et `*.tsx` : 0 occurrence.
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint` sur l'ensemble des fichiers modifiés : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 44 suites passées / 44 total, 282 tests passés / 282 total (0 échec).
- **Statut L12 :** Terminé / Validé.
- **Coût :** 0.61 credits (Gemini 3.7 Flash - High)

## L13 — Audit de préservation des identifiants dans les sous-formulaires

- **Fichiers modifiés / créés :**
  - `types/zodTypes.ts` : ajout de `id: z.string().optional()` au schéma `zodPerson`.
  - `features/composer/form/ComposerEditForm.tsx` : injection d'un champ caché `id` (`{composer?.id && <input type="hidden" {...register("id" as any)} />}`) pour conserver l'identifiant existant lors de la soumission.
  - `features/piece/form/PieceEditForm.tsx` : ajout de `id: z.string().optional()` à `PieceSchema` et injection du champ caché `id` (`{piece?.id && <input type="hidden" {...register("id" as any)} />}`).
  - `features/pieceVersion/PieceVersionEditForm.tsx` : ajout de `id: z.string().optional()` à `PieceVersionSchema` et injection du champ caché `id` (`{pieceVersion?.id && <input type="hidden" {...register("id" as any)} />}`).
  - `features/feed/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer.tsx` :
    - `onComposerCreated` : préservation explicite de `selectedComposerId` lors de la mise à jour du compositeur.
    - `onPieceCreated` : préservation explicite de `selectedPieceId` lors de la mise à jour de la pièce.
    - `onPieceVersionCreated` : conservation de l'identifiant de version existant lors de la validation.
  - `features/feed/multiStepCollectionPieceVersionsForm/CollectionPieceVersionsFormContainer.tsx` :
    - `onComposerCreated` : préservation explicite de `selectedComposerId`.
    - `onCollectionCreated` : préservation explicite de `selectedCollectionId`.
  - `features/sourceContribution/NewSourceContributionForm.tsx` : utilisation de `getNewUuid()` et préservation des identifiants existants si fournis.
  - `__tests__/utils/commitSinglePieceVersionFormToFeedForm.test.ts` : ajout de tests vérifiant la préservation des IDs existants (`isNew: true`) sur `Person`, `Piece` et `PieceVersion` lors du commit vers `FeedFormState`.
  - `__tests__/utils/commitCollectionPieceVersionsFormToFeedForm.test.ts` : ajout de tests vérifiant la préservation des IDs existants (`isNew: true`) sur `Collection`, `Person`, `Piece` et `PieceVersion` lors du commit vers `FeedFormState`.
  - `__tests__/utils/subFormIdPreservation.test.ts` (nouveau) : suite complète de tests validant la préservation d'identifiant sur les 5 entités (`Person`, `Organization`, `Collection`, `Piece`, `PieceVersion` + `Movement`, `Section`, `TempoIndication`), ainsi que l'absence d'élagage d'entités actives dans `cleanFeedFormState`.
- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint` sur l'ensemble des fichiers modifiés et créés : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 45 suites passées / 45 total, 293 tests passés / 293 total (0 échec).
- **Statut L13 :** Terminé / Validé.
- **Coût :** 0.78 credits (Gemini 3.7 Flash - High) + 0.22 pour corriger le tests initialement problématiques

## L14 — Recette et non-régression

- **Fichiers modifiés / créés :**
  - `AGENTS.md` : mise à jour de la documentation pour refléter le nouveau parcours de revue (suppression des références à l'ancienne checklist / bridge / workingCopy, documentation de `/review/[reviewId]`, `FormSessionProvider`, clés de stockage paramétrables `review:<reviewId>:*`, `ReviewSessionBanner`, schéma déclaratif `reviewDiffFieldsSchema.ts`, pipeline de soumission transactionnelle en 4 phases et contrainte d'index partiel `review_unique_in_review_per_reviewer`).
  - `__tests__/reviewInvariants.test.ts` (nouveau) : suite dédiée d'automatisation validant les invariants fondamentaux de l'architecture de revue (§11 du cadrage).
  - `specs/review-in-feed-form/review-in-feed-form_progression.md` : consignation de la table exhaustive de correspondance invariant → test et validation finale du lot 14.

### Table de correspondance exhaustive des 22 Invariants (§11 du Cadrage)

| # | Invariant (§11 Cadrage) | Mécanisme de garantie | Suites de tests & assertions de vérification |
|---|---|---|---|
| **1** | Une seule `Review` `IN_REVIEW` par MM Source | Index unique partiel PostgreSQL `review_unique_in_review_per_source` | `__tests__/api.start.test.ts` (`"should reject start review if source is already in review by someone else"`, `"should handle database unique constraint conflict (race condition) on source"`) |
| **2** | Un reviewer ne peut avoir qu'une seule `Review` `IN_REVIEW` | Index unique partiel PostgreSQL `review_unique_in_review_per_reviewer` | `__tests__/api.start.test.ts` (`"should reject start review if reviewer already has an active review in progress"`, `"should handle database unique constraint conflict (race condition) on reviewer"`) |
| **3** | Un reviewer ne peut pas réviser une MM Source dont il est le créateur | Contrôle d'autorité `start/route.ts` | `__tests__/api.start.test.ts` (`"should reject start review if user is the creator of the MM source"`) |
| **4** | Redirection systématique du reviewer ayant une revue active | Redirection layout/page `/review` | `__tests__/app/reviewLayout.test.tsx` & `app/(signedIn)/review/page.tsx` |
| **5** | Aucune écriture métier en base avant l'approbation finale | Isolation stricte des états de formulaire et commits locaux | `__tests__/utils/commitSinglePieceVersionFormToFeedForm.test.ts`, `__tests__/utils/commitCollectionPieceVersionsFormToFeedForm.test.ts`, `__tests__/utils/subFormIdPreservation.test.ts`, `__tests__/features/review/OverallCommentModal.test.tsx` |
| **6** | L'abandon est sans effet sur les données métier (aucune mutation, aucun AuditLog) | `POST /api/review/[reviewId]/abort` rétablit `PENDING` sans mutations | `__tests__/api.abort.test.ts`, `__tests__/features/review/AbortReviewButton.test.tsx` |
| **7** | Purge du brouillon local uniquement après succès confirmé de la transaction | Handlers de succès/erreur dans `FeedSummary` et `AbortReviewButton` | `__tests__/features/feed/FeedSummary.review.test.tsx` (`"does not purge local draft when submit API fails"`, `"purges local draft on submit success"`), `__tests__/features/review/AbortReviewButton.test.tsx` (`"does not purge local draft on error"`, `"purges local draft on abort success"`), `__tests__/reviewInvariants.test.ts` |
| **8** | Une `PieceVersion` partagée n'est jamais mutée pour le compte de la source en revue | Fork transactionnel automatique (`forkModifiedSharedPieceVersions`) | `__tests__/server/forkModifiedSharedPieceVersions.test.ts` (`"should fork when piece version is modified AND shared with another source"`), `__tests__/api.reviewSubmit.test.ts` |
| **9** | Aucune ligne `PieceVersion` n'est jamais supprimée par une soumission de revue | Phase 1 d'élagage exclut strictement `PieceVersion` et référentiels | `__tests__/api.reviewSubmit.test.ts` (`"never deletes PieceVersion, Piece, Person, Organization, Collection, TempoIndication"`) |
| **10** | Le sous-arbre forké protégé n'est ni supprimé, ni audité en `DELETE` | `protectedEntityIds` injecté dans les suppressions et `composeAuditEntries` | `__tests__/server/forkModifiedSharedPieceVersions.test.ts`, `__tests__/auditCompose.test.ts` (`"should discard DELETE audit entries for protected entity IDs (fork)"`), `__tests__/reviewInvariants.test.ts` |
| **11** | Les `MetronomeMark` des autres sources ne sont jamais remappées | Périmètre de remappage strict limité aux marques de la source en revue | `__tests__/server/forkModifiedSharedPieceVersions.test.ts` (`"should not affect metronome marks of another source pointing to original sections"`) |
| **12** | Atomicité stricte de la persistance et des entrées d'audit | Transaction unique Prisma `db.$transaction` englobant phases 1 à 4 | `__tests__/api.reviewSubmit.test.ts` (`"rolls back entire transaction if any phase fails (atomic)"`) |
| **13** | Le diff et l'audit sont calculés exclusivement côté serveur | Calcul serveur depuis la baseline étendue au moment du submit | `__tests__/api.reviewSubmit.test.ts` (`"recomputes diff and audit on server from baseline ignoring client diff"`), `__tests__/reviewInvariants.test.ts` |
| **14** | Une entité préexistante en base n'est jamais auditée en `CREATE` | Résolution de baseline étendue et comparaison des nœuds | `__tests__/auditCompose.test.ts`, `__tests__/api.reviewSubmit.test.ts`, `__tests__/reviewInvariants.test.ts` |
| **15** | Une entité préexistante inchangée ne produit aucune entrée d'audit | Filtrage strict du diff et `shouldUpsertEntity` | `__tests__/auditCompose.test.ts`, `__tests__/api.reviewSubmit.test.ts`, `__tests__/reviewInvariants.test.ts` |
| **16** | Les marqueurs `ReviewedEntity` existants ne sont jamais réattribués au reviewer courant | Déduplication et exclusion des entités de `globallyReviewed` | `__tests__/api.reviewSubmit.test.ts` (`"does not reassign ReviewedEntity for globally reviewed entities"`) |
| **17** | Isolation totale des stockages locaux entre saisie `/feed` et revues | Clés paramétrables distinctes (`review:<reviewId>:*`) et closures de reducers | `__tests__/context/localStorageReducerWrapper.test.ts` (`"should maintain complete storage isolation between distinct storage keys"`), `__tests__/reviewInvariants.test.ts` |
| **18** | Rejet et purge des brouillons locaux divergents (`reviewId` / `reviewerId`) | Validation de session à l'hydratation et fallback serveur | `__tests__/context/formSessionContext.test.tsx` (`"purges local draft and falls back to server session if stored review session has divergent reviewerId or reviewId"`) |
| **19** | Contrôle exclusif des règles d'autorisation côté serveur | Vérifications de rôle (`REVIEWER`/`ADMIN`) et propriété en layout/API | `__tests__/app/reviewLayout.test.tsx`, `__tests__/server/getReviewBaseline.test.ts`, `__tests__/api.reviewSubmit.test.ts` |
| **20** | `/review/[reviewId]` et sa soumission réservées au reviewer propriétaire | `requireOwner: true` dans `getReviewBaseline` et garde de route `submit` | `__tests__/server/getReviewBaseline.test.ts` (`"rejects access if user is not the creator/owner with requireOwner: true"`), `__tests__/app/reviewLayout.test.tsx`, `__tests__/api.reviewSubmit.test.ts` |
| **21** | Non-régression totale du parcours de saisie initiale `/feed` | Modes et formulaires polymorphes préservant le parcours `data-entering` | `__tests__/features/feed/FeedSummary.dataEntering.test.tsx`, `__tests__/features/feed/Intro.test.tsx`, `__tests__/context/localStorageReducerWrapper.test.ts`, `__tests__/utils/commitSinglePieceVersionFormToFeedForm.test.ts` |
| **22** | Tous les textes et messages affichés à l'utilisateur sont en anglais | Internationalisation et politique stricte d'anglais dans l'UI | `__tests__/features/feed/Intro.test.tsx`, `__tests__/features/feed/FeedSummary.review.test.tsx`, `__tests__/features/review/ReviewSessionBanner.test.tsx`, `__tests__/features/review/AbortReviewButton.test.tsx`, `__tests__/features/review/OverallCommentModal.test.tsx`, `__tests__/features/review/ReviewDiffModal.test.tsx`, `__tests__/context/toastNotificationContext.test.tsx` |

- **Vérifications :**
  - `npx tsc --noEmit` : 0 erreur.
  - `npx eslint .` : 0 erreur, 0 avertissement.
  - `npm run test:ci` : 46 suites passées / 46 total, 298 tests passés / 298 total (0 échec).
- **Statut L14 :** Automatisation terminée ; recette manuelle exécutée avec anomalies (12 PASS / 4 FAIL).
- **Coût :** 0.32 credits (Gemini 3.7 Flash - High) + 0.13 pour la traductio en anglais de parties du fichier de test.

### Recette manuelle — 2026-08-26

Recette exécutée dans un navigateur Chrome réel et visible, sur `http://localhost:3000`, avec les
credentials de `.env.test`. Les données de recette ont été créées, modifiées, approuvées ou
abandonnées dans la base de test selon les scénarios.

| # | Résultat | Observations |
|---:|---|---|
| 1 | PASS | Depuis `/review`, le démarrage d'une revue redirige vers `/review/[reviewId]`. Revue nominale : `c3e4a28f-f28c-4b55-9e18-73d52259f29c`. |
| 2 | PASS | L'Intro affiche le contenu de la revue et peut être validée. |
| 3 | PASS | Les étapes 1 à 4 sont préremplies et complètes. |
| 4 | PASS | Un champ a été modifié à chaque niveau : source, contribution, pièce, section et marque métronomique. |
| 5 | FAIL | « View Changes » affiche `0 changed fields` puis une erreur `missing entityId for CONTRIBUTION`, alors que des modifications ont été effectuées. |
| 6 | PASS | Après rechargement, le brouillon de revue restaure les modifications. |
| 7 | PASS | Le commentaire général est sauvegardé, puis restauré après fermeture et rechargement. |
| 8 | FAIL | Lors de l'approbation, un succès est affiché puis une modale d'erreur apparaît, bien que la transaction soit effectivement réussie en base. |
| 9 | FAIL | La base passe bien la revue et la source à `APPROVED`, mais les `AuditLog` contiennent de nombreuses créations/suppressions de marques et une suppression de source qui ne correspondent pas exactement aux modifications réalisées. |
| 10 | PASS | Une divergence de session déclenche le toast anglais `Local draft reset: session does not match current user.` |
| 11 | PASS | Le brouillon `/feed` reste isolé du brouillon de revue, dans les deux sens. |
| 12 | PASS | Le fork est vérifié en base : source forkée `b6313e88-962d-4a0e-bbd9-0ac610ea96a8`, source originale conservée `44331c51-d784-48a2-ab38-44b98ade1011`, `PieceVersion` originale `c9c9a7c0-2d71-45b1-9146-baf2fde471c5`, forkée `5ae83d80-35db-4857-8b9b-072453fcb2be`. |
| 13 | PASS | Après abandon, la revue `3ff99dca-decc-414a-9276-ae993ba23ee8` revient à `ABORTED`, la source `b9a82c0c-1be7-4e53-8a79-dfd330775140` est `ABORTED`, aucune revue active ne subsiste et les clés localStorage de revue sont purgées. |
| 14 | PASS | Une seconde tentative avec le même compte est refusée/redirigée vers la revue active existante. |
| 15 | PASS adapté | `REVIEWER_2` n'existe pas dans la base de test. Le scénario a été exécuté avec `REVIEWER_1`, puis l'accès à la revue depuis ADMIN a été refusé avec redirection vers `/review?reason=notOwner`. |
| 16 | FAIL | La création complète `/feed` réussit et crée la source `3c404929-c153-4ce2-83dd-9cc4708f7cbb` ainsi que la pièce `0719a6f0-ac5b-4089-89c6-5e84d8c53fb7`, mais la réinitialisation automatique laisse les données saisies dans `feedForm` ; une réinitialisation manuelle est nécessaire. |

**Bilan : 12 PASS, 4 FAIL (scénarios 5, 8, 9 et 16).** Les défauts constatés sont consignés
sans modification du code applicatif : diff de contribution, affichage d'erreur post-approbation,
composition des audits et réinitialisation automatique du formulaire Feed.
