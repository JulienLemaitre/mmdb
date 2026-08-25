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