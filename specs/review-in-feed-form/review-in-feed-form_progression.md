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
