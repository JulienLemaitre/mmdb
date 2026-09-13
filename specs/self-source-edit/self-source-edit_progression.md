# Progression — Auto-édition d'une MM Source par son auteur (Self-Source-Edit)

Ce document sert de mémoire persistante pour l'implémentation de la fonctionnalité "self-source-edit".  
Document de cadrage qui fait foi : `specs/self-source-edit/20260810_cadrage_self-source-edit.md`  
Feuille de route : `specs/self-source-edit/20260810_feuille-de-route_self-source-edit.md`  

---

## Lot 0 — Préparation et filet de sécurité

- **Branche de travail :** `edit-own-sources`
- **État de référence des tests (`npm run test:ci` — 2026-09-13) :**
  - Test Suites : 49 passées / 49 total (0 échec)
  - Tests : 330 passés / 330 total (0 échec)
  - Snapshots : 0
  - Tous les tests passent. Aucun échec préexistant.
- **Statut Lot 0 :** Terminé / Validé.

---

## Lot 1 — Menu profil dans l'en-tête et nettoyage de la page d'accueil

- **Statut :** Terminé / Validé.
- **Fichiers concernés :**
  - `ui/svg/UserCircleIcon.tsx` (nouveau)
  - `ui/UserProfileMenu.tsx` (nouveau)
  - `utils/routes.ts`
  - `ui/NavBar.tsx`
  - `app/(public)/page.tsx`
- **Vérifications :**
  - [x] TypeScript (`npx tsc --noEmit`) : 0 erreur
  - [x] Linting (`npx eslint`) : 0 erreur
  - [x] Tests Jest (`npm run test:ci`) : 49 suites passées / 330 tests passés

---

## Lot 2 — Espace Dashboard et liste des sources utilisateur

- **Statut :** Terminé / Validé.
- **Fichiers concernés :**
  - `proxy.ts`
  - `app/(signedIn)/dashboard/page.tsx` (nouveau)
  - `features/dashboard/UserMMSourcesTable.tsx` (nouveau)
- **Vérifications :**
  - [x] TypeScript (`npx tsc --noEmit`) : 0 erreur
  - [x] Linting (`npx eslint`) : 0 erreur
  - [x] Tests Jest (`npm run test:ci`) : 49 suites passées / 330 tests passés

---

## Lot 3 — Contexte de session, clés de stockage et route d'édition

- **Statut :** Terminé / Validé.
- **Fichiers concernés :**
  - `types/zodTypes.ts`
  - `context/formSessionContext.tsx`
  - `utils/constants.ts`
  - `utils/localStorage.ts`
  - `utils/server/getSourceFeedFormBaseline.ts` (nouveau)
  - `utils/server/getReviewBaseline.ts`
  - `app/(signedIn)/dashboard/edit/[sourceId]/layout.tsx` (nouveau)
  - `app/(signedIn)/dashboard/edit/[sourceId]/page.tsx` (nouveau)
  - `features/feed/components/SelfEditSessionBanner.tsx` (nouveau)
  - `features/feed/multiStepMMSourceForm/stepForms/Intro.tsx`
- **Vérifications :**
  - [x] TypeScript (`npx tsc --noEmit`) : 0 erreur
  - [x] Linting (`npx eslint`) : 0 erreur
  - [x] Tests Jest (`npm run test:ci`) : 49 suites passées / 330 tests passés

---

## Lot 4 — Persistance, garde de concurrence et FeedSummary

- **Statut :** Terminé / Validé.
- **Fichiers concernés :**
  - `app/api/source/[sourceId]/edit/route.ts` (nouveau)
  - `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`
  - `__tests__/api.source.edit.test.ts` (nouveau)
  - `__tests__/getSourceFeedFormBaseline.test.ts` (nouveau)
  - `__tests__/purgeSelfEditLocalDrafts.test.ts` (nouveau)
  - `__tests__/features/feed/FeedSummary.selfEdit.test.tsx` (nouveau)
- **Vérifications :**
  - [x] TypeScript (`npx tsc --noEmit`) : 0 erreur
  - [x] Linting (`npx eslint .`) : 0 erreur
  - [x] Tests Jest (`npm run test:ci`) : 53 suites passées / 352 tests passés (0 échec)
