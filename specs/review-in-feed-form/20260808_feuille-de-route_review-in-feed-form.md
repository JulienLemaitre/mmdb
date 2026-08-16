# Feuille de route — Review d'une MM Source dans le formulaire Feed

**Date :** 2026-08-08
**Document de cadrage associé :** `20260808_cadrage_review-in-feed-form.md` — **à lire en premier**.
Ce document ne redécide rien : il découpe et ordonne les travaux. En cas d'écart, le cadrage fait foi.
**Document où consigner la progression de l'implémentation :** `review-in-feed-form_progression.md`

---

## Mode d'emploi

### Pour un agent IA

1. Lire `AGENTS.md` à la racine du dépôt, puis le cadrage, puis **le lot qui vous est assigné**.
2. Ne traiter **qu'un lot à la fois**. Vérifier que ses dépendances sont marquées faites.
3. Respecter les conventions du dépôt : préfixe de source entre crochets dans tout log/erreur
   (`` `[reviewSubmit] …` ``), types dérivés de Prisma, `debug` de `utils/debugLogger.ts`, URLs
   centralisées dans `utils/routes.ts`, Zod dans `types/zodTypes.ts`.
4. **Préférer les éditions ciblées aux réécritures de fichier.** Demander avant toute réécriture
   complète.
5. `npx eslint .` — `npm run lint` est cassé (`next lint` retiré en Next 16).
6. `git add` les fichiers créés, y compris le client Prisma régénéré et les migrations.
7. **Langue des textes de l'application :** TOUS les textes affichés dans l'application (UI, boutons,
   titres, libellés de champs, messages d'erreur ou d'alerte, modales, toasts, placeholders,
   infobulles, descriptions) doivent impérativement être rédigés en **anglais**.

### Typage et validation : Zod vs Prisma

Une séparation nette des responsabilités de typage est appliquée dans l'ensemble du projet :

1. **Données de base de données & requêtes ORM (Prisma) :**
   - **Prisma** est la source unique de vérité pour les entités et relations en base de données.
   - Utiliser systématiquement les types dérivés de Prisma (`Prisma.PieceVersionGetPayload<...>`, `Prisma.MMSourceCreateInput`, `Prisma.ContributionUncheckedCreateInput`, etc.). Ne pas réécrire de types manuels pour les entités DB.

2. **Formulaires, sessions, validation runtime & API (Zod) :**
   - **Zod (`types/zodTypes.ts`)** est la source unique de vérité pour toutes les structures de données applicatives, les états de session, les données de formulaire, les charges utiles d'API (requêtes et réponses) et la validation des données stockées (`localStorage`).
   - **Règle absolue :** Tout nouveau type non dérivé de Prisma doit être déclaré sous forme de schéma Zod (`export const XxxSchema = z.object(...)`) et exporter son type TypeScript inféré (`export type Xxx = z.infer<typeof XxxSchema>`) directement depuis `types/zodTypes.ts`.
   - Utiliser systématiquement les schémas Zod (`safeParse`) aux frontières runtime (lecture depuis le `localStorage`, validation des corps de requêtes d'API) pour garantir la sécurité d'exécution face aux données corrompues ou obsolètes.

### Conventions de nommage et langue retenues

**Convention linguistique (UI) :** Tous les libellés et textes visibles dans l'interface utilisateur
(UI, messages de toast, modales, boutons, aides contextuelles, placeholders, alertes d'erreur/succès)
sont impérativement en **anglais**.

Noms proposés, à ajuster à la marge en implémentation si un meilleur se présente — mais **aucun ne
doit contenir « checklist »**.

| Ancien | Nouveau |
|---|---|
| `features/review/reviewChecklistSchema.ts` | `features/review/reviewDiffFieldsSchema.ts` |
| `REVIEW_CHECKLIST_SCHEMA` | `REVIEW_DIFF_FIELDS_SCHEMA` |
| `getChecklistFields()` | `getDiffFields()` |
| `ChecklistEntityType` | `ReviewEntityType` |
| `ChecklistField` | `ReviewDiffField` |
| `ReviewChecklistSchema` | `ReviewDiffFieldsSchema` |
| `ChecklistGraph` | *supprimé* (remplacé par `FeedFormState`) |
| `RequiredChecklistItem` | *supprimé* |
| `computeChangedChecklistFieldPaths()` | `computeChangedFieldPaths()` |
| `ChangedChecklistItem` | `ChangedField` |
| `utils/server/getReviewOverview.ts` | `utils/server/getReviewBaseline.ts` |
| `GET_URL_REVIEW_CHECKLIST` | `GET_URL_REVIEW` |

### Graphe de dépendances entre lots

```
L0 ──┬─> L1 ──┬─> L2 ──┬─> L4 ──> L5 ──> L6 ──┐
     │        │        │                       │
     │        └────────┴─> L3 ─────────────────┤
     │                                          ├─> L12 ──> L14
     ├─> L7 ──> L8 ──> L9 ──> L10 ──────────────┤
     │                                          │
     ├─> L11 ───────────────────────────────────┤
     │                                          │
     └─> L13 ───────────────────────────────────┘
```

**Parallélisables sans conflit :** {L1+L2}, {L7}, {L11}, {L13} peuvent démarrer en même temps après
L0. La chaîne serveur (L7→L8→L9→L10) et la chaîne client (L1→L2→L4→L5→L6) ne se croisent qu'au
lot 12.

---

## Lot 0 — Préparation et filet de sécurité

**Dépendances :** aucune. **Taille :** S.

### Tâches

1. Créer la branche de travail depuis `master`.
2. Exécuter `npm run test:ci` et **consigner l'état de départ** : quels tests passent, lesquels
   échouent déjà. Sans cette référence, impossible de distinguer une régression d'un échec
   préexistant.
3. Consigner l'inventaire des tests qui seront supprimés en L12, pour ne pas les compter comme
   régressions :
   `__tests__/api.overview.test.ts`, `__tests__/api.submit.test.ts`,
   `__tests__/auditCompose.test.ts`, `__tests__/bridge.inverseMapping.roundtrip.test.ts`,
   `__tests__/reviewChecklistSchema.expand.test.ts`, `__tests__/reviewChecklistSchema.test.ts`,
   `__tests__/reviewDiff.degeCases.test.ts`, `__tests__/reviewDiff.rankChange.test.ts`,
   `__tests__/reviewDiff.test.ts`, `__tests__/ReviewEditBanner.test.tsx`,
   `__tests__/reviewEditBridge.test.ts`, `__tests__/reviewProgress.test.ts`,
   `__tests__/reviewProgress.withChecked.test.ts`, `__tests__/review-ui/*`,
   `__tests__/ui.checklist.disabledSubmit.test.tsx`.
4. Vérifier en base de développement la présence de l'index `review_unique_in_review_per_source`
   (cf. `specs/20250811_MIGRATION_NOTE_review-partial-unique-index_manual-SQL.md`). Il conditionne
   le lot 11.

### Critère de sortie

L'état de départ des tests est écrit dans `review-in-feed-form_progression.md`.

---

## Lot 1 — Socle de types et contexte de session

**Dépendances :** L0. **Taille :** M.

### Objectif

Sortir de `FeedFormState` toute donnée de contexte, et introduire le contexte de session générique
qui portera les trois modes.

### Fichiers

- `types/feedFormTypes.ts`
- `types/formTypes.ts`
- `types/zodTypes.ts`
- Nouveau : `context/formSessionContext.tsx`

### Tâches

1. Dans `types/feedFormTypes.ts` :
   - supprimer le type `ReviewContext` et le champ `FeedFormInfo.reviewContext` ;
   - supprimer `FeedFormInfo.allSourceContributionsDone` (déclaré, utilisé nulle part) ;
   - étendre `FeedFormProviderProps` avec `storageKey: string` et
     `initialState?: FeedFormState | null` (préparation du lot 2).
2. Dans `types/zodTypes.ts`, déclarer les schémas Zod et exporter les types TypeScript inférés :
   ```ts
   export const FormModeSchema = z.enum(["data-entering", "self-source-edit", "review"]);
   export type FormMode = z.infer<typeof FormModeSchema>;

   export const GloballyReviewedIdsSchema = z.object({
     personIds: z.array(z.string()),
     organizationIds: z.array(z.string()),
     collectionIds: z.array(z.string()),
     pieceIds: z.array(z.string()),
     pieceVersionIds: z.array(z.string()),
   });
   export type GloballyReviewedIds = z.infer<typeof GloballyReviewedIdsSchema>;

   export const ReviewSessionMetaSchema = z.object({
     reviewId: z.string(),
     reviewerId: z.string(),
     mMSourceId: z.string(),
     overallComment: z.string().nullable(),
   });
   export type ReviewSessionMeta = z.infer<typeof ReviewSessionMetaSchema>;

   export const FormSessionSchema = z.discriminatedUnion("mode", [
     z.object({ mode: z.literal("data-entering") }),
     z.object({
       mode: z.literal("review"),
       review: ReviewSessionMetaSchema,
       globallyReviewed: GloballyReviewedIdsSchema,
     }),
   ]);
   export type FormSession = z.infer<typeof FormSessionSchema>;
   ```
   `self-source-edit` est volontairement absent de l'union `FormSessionSchema` tant qu'il n'est pas implémenté :
   l'ajouter plus tard produira des erreurs de compilation aux points à traiter, ce qui est le
   comportement voulu.
3. Créer `context/formSessionContext.tsx` : provider + `useFormSession()`. En mode revue, il
   expose aussi `setOverallComment()` et synchronise `ReviewSessionMeta` vers la clé
   `review:<reviewId>:session` via `localStorageSetItem`. La lecture initiale depuis `localStorage`
   doit valider la donnée avec `ReviewSessionMetaSchema.safeParse()`.
   `useFormSession()` doit renvoyer `{ mode: "data-entering" }` par défaut si aucun provider n'est
   monté, afin que `/feed` fonctionne sans modification de son layout.
4. Dans `types/formTypes.ts`, retirer de `assertsIsPersistableFeedFormState` la ligne
   `valueToTest["formInfo"]["reviewContext"] === undefined`. **Ne rien changer d'autre à ce garde** :
   il devient commun aux deux routes.

### Tests

- `__tests__/context/formSessionContext.test.tsx` : mode par défaut hors provider ; lecture/écriture
  de `overallComment` ; écriture localStorage sous la bonne clé.
- Adapter tout test existant compilant sur `reviewContext`.

### Critère de sortie

`npx tsc --noEmit` (ou le build) ne signale plus aucune référence à `reviewContext`, hors fichiers
programmés pour suppression en L12.

---

## Lot 2 — Clés de stockage paramétrables

**Dépendances :** L1. **Taille :** M. **Risque de régression : élevé** — touche le cœur de `/feed`.

### Objectif

Permettre à un provider de choisir sa clé localStorage, sans changer le comportement de la saisie
initiale.

### Fichiers

- `context/utils/localStorageReducerWrapper.ts`
- `context/feedFormReducer.ts`, `context/feedFormContext.tsx`
- `context/singlePieceVersionFormReducer.ts`, `context/singlePieceVersionFormContext.tsx`
- `context/collectionPieceVersionForm/collectionPieceVersionFormReducer.ts`,
  `context/collectionPieceVersionForm/collectionPieceVersionsFormContext.tsx`
- `utils/localStorage.ts`
- `utils/constants.ts`

### Tâches

1. **`withLocalStorage`** — ajouter un paramètre d'options `{ hydrationStrategy: "merge" | "replace" }`,
   par défaut `"merge"` (comportement actuel).
   Le mode `"replace"` fait que l'état sauvegardé **remplace** l'état initial au lieu d'être fusionné
   par `merge` de lodash. C'est la correction du défaut §12.4 du cadrage : la fusion de lodash
   fusionne les tableaux par index et produit des états hybrides quand l'état initial n'est pas vide.
2. **Transformer les trois reducers en fabriques.** Exemple pour le feed form :
   ```ts
   export function createFeedFormReducer(
     storageKey: string,
     initialState: FeedFormState,
     options?: { hydrationStrategy?: "merge" | "replace" },
   ) {
     return withLocalStorage(feedFormReducerCore, storageKey, initialState, options);
   }
   ```
   **Attention :** `withLocalStorage` referme sur `isInitialized` et `lastSavedState`. Une fabrique
   par instance de provider est donc obligatoire, et l'instance doit être **stable entre les rendus**
   — utiliser un initialiseur `useState(() => …)` ou un `useRef`, **jamais `useMemo`**, qui peut
   être réexécuté par React.
   Conserver l'export `feedFormReducer` existant en tant qu'appel de la fabrique avec les valeurs
   par défaut, pour ne rien casser tant que L4 n'est pas fait.
3. **Paramétrer les trois providers** : props `storageKey` et `initialState`, avec valeurs par défaut
   égales aux constantes actuelles. `/feed` doit continuer de fonctionner sans qu'aucune prop ne soit
   passée.
   Dans `FeedFormProvider`, l'effet d'initialisation doit lire `storageKey` et non plus la constante
   codée en dur.
4. **Clés de revue** — ajouter dans `utils/constants.ts` :
   ```ts
   export const REVIEW_LOCAL_STORAGE_PREFIX = "review";
   export const GET_REVIEW_STORAGE_KEYS = (reviewId: string) => ({
     session: `review:${reviewId}:session`,
     feedForm: `review:${reviewId}:feedForm`,
     singlePieceVersionForm: `review:${reviewId}:singlePieceVersionForm`,
     collectionPieceVersionForm: `review:${reviewId}:collectionPieceVersionForm`,
   });
   ```
5. **Helper de purge** dans `utils/localStorage.ts` :
   `purgeReviewLocalDrafts(reviewId?: string)` — supprime les quatre clés d'une revue donnée, ou
   toutes les clés préfixées `review:` si l'argument est omis. Nécessaire pour évacuer un brouillon
   résiduel d'une revue antérieure.
6. **Bumper `LOCAL_STORAGE_SCHEMA_VERSION` de 6 à 7.**
7. **Signal d'invalidation locale dans `utils/localStorage.ts` et écouteur Toast global** :
   - Lorsque `localStorageGetItem` supprime un item en raison d'une version obsolète
     (`LOCAL_STORAGE_SCHEMA_VERSION`), d'un JSON corrompu ou d'une enveloppe invalide, émettre un
     événement DOM personnalisé (ex: `window.dispatchEvent(new CustomEvent("mmdb:storage-invalidated", { detail: { key, reason } }))`).
   - Dans `context/toastNotification/toastNotificationContext.tsx` (ou dans `ui/Providers.tsx`), écouter
     cet événement et afficher un toast d'avertissement (`toastNotificationAction.WARNING`) avec un
     message en anglais (ex. : *"Your previous local draft was reset due to an application update."*)
     plutôt que d'échouer silencieusement.

### Tests

- `__tests__/context/localStorageReducerWrapper.test.ts` : stratégie `merge` (comportement actuel
  inchangé) vs `replace` ; deux instances de fabrique n'interfèrent pas (clés distinctes, closures
  indépendantes).
- `__tests__/utils/purgeReviewLocalDrafts.test.ts`.
- `__tests__/utils/localStorage.test.ts` : émission de l'événement `mmdb:storage-invalidated` lors d'une
  suppression pour version obsolète ou JSON corrompu.
- `__tests__/context/toastNotificationContext.test.tsx` (ou test de l'écouteur) : affichage du toast d'avertissement en anglais à la réception de l'événement.
- **Non-régression `/feed`** : le brouillon de saisie initiale se sauvegarde et se restaure comme
  avant.

### Critère de sortie

`/feed` fonctionne à l'identique, brouillon inclus. Deux providers montés avec des clés différentes
n'écrivent pas l'un sur l'autre.

---

## Lot 3 — Baseline serveur et hydratation

**Dépendances :** L1. **Taille :** L.

### Objectif

Remplacer `getReviewOverview` (qui produit un `ChecklistGraph`) par un chargeur produisant un
`FeedFormState`, utilisé à la fois par le layout de la page et par la route de soumission.

### Fichiers

- Nouveau : `utils/server/getReviewBaseline.ts` (remplace `utils/server/getReviewOverview.ts`)
- Nouveau : `utils/server/extendBaselineByExistence.ts`

### Tâches

1. **`getReviewBaseline(reviewId, { requireOwner })`** — reprendre la requête Prisma de
   `getReviewOverview.ts`, qui est correcte et complète, et changer uniquement la **mise en forme du
   résultat** : produire un `FeedFormState` au lieu d'un `ChecklistGraph`.
   Retourne :
   ```ts
   {
     review: { id, creatorId, state, mMSourceId },
     mMSource: { id, title, ... },        // pour l'affichage du bandeau
     baseline: FeedFormState,              // sans formInfo
     globallyReviewed: GloballyReviewedIds, // importé depuis @/types/zodTypes
   }
   ```
   Correspondances de forme à établir :
   - `graph.source` → `baseline.mMSourceDescription` (avec `references`)
   - `graph.contributions` → `baseline.mMSourceContributions`
   - `graph.sourceOnPieceVersions` → `baseline.mMSourceOnPieceVersions`
     ⚠ le `joinId` n'existe pas dans `MMSourceOnPieceVersionsState`. Il n'est plus nécessaire : la
     contrainte `@@unique([mMSourceId, pieceVersionId])` fait de `pieceVersionId` la clé naturelle
     de la relation côté source. Le `joinId` est résolu côté serveur au moment d'écrire.
   - les autres tableaux plats se transposent directement.
2. **Resserrer l'autorisation à `isOwner`** (aujourd'hui `isOwner || isAdmin`). Conserver les
   contrôles de rôle et d'état `IN_REVIEW`.
3. **Construction de l'état initial de formulaire** — une fonction dédiée
   `buildReviewInitialFeedFormState({ baseline, globallyReviewed })` qui ajoute :
   - `isNew = !globallyReviewed.<type>Ids.includes(id)` sur `persons`, `organizations`,
     `collections`, `pieces`, `pieceVersions` ;
   - `formInfo: { currentStepRank: 0, introDone: false, allSourceOnPieceVersionsDone: true }`.
     **`introDone` reste à `false`** : l'étape d'introduction n'est pas sautée en revue.
     `allSourceOnPieceVersionsDone` est posé à `true` pour éviter que l'étape 3 apparaisse incomplète
     alors que les données préremplies sont cohérentes.
4. **`extendBaselineByExistence(baseline, submittedState)`** (serveur, utilisé par L10) : pour chaque
   id présent dans l'état soumis et absent de la baseline, lire la ligne en base et l'ajouter à la
   baseline. Couvrir `Person`, `Organization`, `Collection`, `Piece`, `PieceVersion` (+ `Movement`,
   `Section`), `TempoIndication`, `Reference`, `Contribution`, `MetronomeMark`.
   Une requête groupée par type (`findMany({ where: { id: { in: [...] } } })`), pas de requête par id.
5. Vérifier si `features/review/utils/processSourceOnPieceVersionsForDisplay.ts` et
   `features/review/utils/isCollectionCompleteInChecklistGraph.ts` sont réutilisables sur
   `FeedFormState` (ils opèrent sur `ChecklistGraph`, structurellement proche). Si oui, les adapter
   et les renommer ; sinon les supprimer en L12.

### Tests

- `__tests__/server/getReviewBaseline.test.ts` : la forme produite satisfait `FeedFormState` ;
  les `isNew` sont posés correctement ; un non-propriétaire est refusé ; une revue non `IN_REVIEW`
  est refusée.
- `__tests__/server/extendBaselineByExistence.test.ts` : une entité existante non rattachée est
  ajoutée ; un id inexistant reste absent ; aucune requête n'est émise si rien ne manque.

---

## Lot 4 — Nouvelle route `/review/[reviewId]`

**Dépendances :** L2, L3. **Taille :** M.

### Fichiers

- Nouveau : `app/(signedIn)/review/[reviewId]/layout.tsx`
- Nouveau : `app/(signedIn)/review/[reviewId]/page.tsx`
- Nouveau : `features/feed/FeedFormShell.tsx`
- `app/(signedIn)/feed/layout.tsx`
- `app/(signedIn)/review/page.tsx`, `app/(signedIn)/review/reviewListClient.tsx`
- `utils/routes.ts`

### Tâches

1. **Extraire `FeedFormShell`** depuis `app/(signedIn)/feed/layout.tsx` : la structure drawer +
   `NavBar` + colonne `Steps` + zone principale + `FeedFormHelpDrawer`. Props : `title`,
   `asideExtra?: ReactNode` (reçoit `ResetAllForms` en saisie initiale, rien en revue),
   `banner?: ReactNode`.
   Réécrire `app/(signedIn)/feed/layout.tsx` pour consommer ce shell — comportement strictement
   identique, `ReviewEditBanner` retiré au passage.
2. **`review/[reviewId]/layout.tsx`** (composant serveur) :
   - session + rôle `REVIEWER`/`ADMIN`, sinon redirection ;
   - `getReviewBaseline(reviewId, { requireOwner: true })` ;
   - redirections `?reason=notFound | notOwner | notActive | unauthorized` vers `/review`
     (réutiliser les libellés déjà en place dans `app/(signedIn)/review/page.tsx`) ;
   - monter `FormSessionProvider` (mode `review`) → `FeedFormProvider` avec
     `storageKey = GET_REVIEW_STORAGE_KEYS(reviewId).feedForm` et
     `initialState = buildReviewInitialFeedFormState(...)`, puis `FeedFormShell` avec le bandeau du
     lot 5.
3. **Validation du brouillon à l'hydratation et gestion de l'invalidation locale** (composant client,
   dans le provider de session / `FeedFormShell`) :
   - lire `review:<reviewId>:session` et valider sa structure via `ReviewSessionMetaSchema.safeParse` ;
     si absent ou invalide, l'initialiser depuis les données serveur ; si présent avec un `reviewId`
     ou un `reviewerId` divergent, appeler `purgeReviewLocalDrafts(reviewId)`, déclencher un toast
     d'avertissement en anglais (ex. : *"Local draft reset: session does not match current user."*)
     prévenant l'utilisateur de la réinitialisation de son brouillon de session, et repartir de l'état serveur.
     Journaliser en `debug`.
   - l'écouteur global `mmdb:storage-invalidated` (Lot 2) notifie automatiquement par toast d'avertissement
     en cas d'incompatibilité de version de schéma ou de données corrompues.
4. **`review/[reviewId]/page.tsx`** : `<MMSourceForm />`, comme la page `/feed`.
5. **`utils/routes.ts`** : remplacer `GET_URL_REVIEW_CHECKLIST` par
   `GET_URL_REVIEW = (reviewId) => \`/review/${reviewId}\``, et ajouter
   `GET_URL_API_REVIEW_SUBMIT` / `GET_URL_API_REVIEW_ABORT` si absents. Supprimer
   `GET_URL_API_REVIEW_OVERVIEW`.
6. Mettre à jour la redirection automatique de `app/(signedIn)/review/page.tsx` et la redirection
   après démarrage dans `reviewListClient.tsx`.
7. `proxy.ts` : vérifier que le matcher `/review/:path*` couvre déjà la route — **aucune
   modification attendue**, mais le vérifier explicitement.

### Tests

- Test d'intégration du layout : un non-propriétaire est redirigé avec `reason=notOwner` ; une revue
  `APPROVED` avec `reason=notActive`.
- Test d'hydratation : brouillon avec mauvais `reviewerId` → purgé, état serveur appliqué et toast d'avertissement en anglais affiché.

---

## Lot 5 — Habillage de la session de revue

**Dépendances :** L4. **Taille :** S.

### Fichiers

- Nouveau : `features/review/components/ReviewSessionBanner.tsx`
- Nouveau : `features/review/components/OverallCommentModal.tsx`
- Nouveau : `features/review/components/ReviewDiffModal.tsx`
- Nouveau : `features/review/components/AbortReviewButton.tsx`

### Tâches

1. **`ReviewSessionBanner`** : indique qu'une revue est en cours, rappelle que les modifications
   restent locales jusqu'à l'approbation, identifie la source (titre, compositeur ou lien).
   Porte les boutons d'ouverture de `OverallCommentModal`, de `ReviewDiffModal` et d'`AbortReviewButton`.
   **Aucun affichage de progression** — décision actée.
2. **`OverallCommentModal`** : zone de texte alimentant `overallComment` du contexte de session,
   accessible à tout moment. Aucun appel API : la valeur part avec le payload final.
3. **`ReviewDiffModal`** : modale affichant en direct l'ensemble des modifications apportées par le
   reviewer en comparant l'état courant (`FeedFormState`) à la `baseline` serveur du contexte de session.
   Elle consomme `computeChangedFieldPaths(baseline, state)` (introduit au Lot 7 — si L5 est réalisé en
   amont/parallèle de L7, poser le composant avec un bouchon et brancher la fonction réelle lors de la convergence).
4. **`AbortReviewButton`** : modale de confirmation avertissant de la perte des modifications
   locales et du commentaire → `POST /api/review/[reviewId]/abort` → `purgeReviewLocalDrafts(reviewId)`
   **après succès** → redirection vers `/review`.
   En cas d'échec de l'appel : afficher l'erreur, **ne rien purger**.

### Tests

- `ReviewDiffModal` : affichage des modifications par rapport à la baseline, accessible à tout moment depuis le bandeau.
- `AbortReviewButton` : purge et redirection seulement après réponse en succès ; aucune purge sur
  erreur réseau ou HTTP.

---

## Lot 6 — Étapes polymorphes : `Intro` et `FeedSummary`

**Dépendances :** L5. **Taille :** M.

### Fichiers

- `features/feed/multiStepMMSourceForm/stepForms/Intro.tsx`
- `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`

### Tâches

1. **`Intro`** — conditionner le contenu affiché sur `useFormSession().mode`. En mode revue :
   consignes destinées au reviewer au lieu du tutoriel de saisie initiale, et libellé de bouton
   adapté. Le bouton continue de poser `introDone: true` et d'avancer d'une étape.
   Le contenu rédactionnel définitif du mode revue sera fourni plus tard : poser un texte provisoire
   explicite et signalé comme tel dans le code.
2. **`FeedSummary`** — factoriser en trois parties : le rendu du récapitulatif (commun), l'action
   finale (par mode), la réinitialisation (par mode).
   - Mode `data-entering` : comportement actuel strictement inchangé
     (`POST /api/feedForm`, purge des trois clés de saisie, `initFeedForm`).
   - Mode `review` : bouton **désactivé** tant que les six étapes ne sont pas complètes selon leurs
     prédicats `isComplete` ; modale de confirmation explicite ; puis
     `POST /api/review/[reviewId]/submit` avec `{ feedFormState: state, overallComment }`.
     Sur succès : `purgeReviewLocalDrafts(reviewId)` puis redirection vers `/review`.
     Sur échec : afficher le message d'erreur du serveur, **ne rien purger**, laisser le reviewer
     réessayer.
   - Le libellé du bouton et le texte de la modale de succès diffèrent par mode.
3. Ne pas monter `ResetAllForms` dans le shell en mode revue (déjà traité par `asideExtra` en L4).

### Tests

- `__tests__/features/feed/FeedSummary.review.test.tsx` : bouton désactivé si une étape est
  incomplète ; appel de la bonne route avec le bon payload ; **aucune purge locale sur erreur** ;
  purge et redirection sur succès.
- `__tests__/features/feed/FeedSummary.dataEntering.test.tsx` : non-régression du chemin de création.

---

## Lot 7 — Moteur de diff sur `FeedFormState`

**Dépendances :** L0. **Taille :** L. **Parallélisable avec la chaîne client.**

### Fichiers

- `features/review/reviewChecklistSchema.ts` → `features/review/reviewDiffFieldsSchema.ts`
- `features/review/reviewDiff.ts`
- `features/review/utils/auditCompose.ts`
- `types/reviewTypes.ts`

### Tâches

1. **Schéma de champs** — renommer le fichier et la constante ; retirer les propriétés `label` et
   `meta` de chaque champ ; conserver `doNotReviewTwice` et l'ensemble des chemins de champs à
   l'identique. Conserver `ENTITY_PREFIX`, `buildFieldPath` et `buildSourceJoinRankPath`.
   Ajouter en tête un commentaire rappelant la servitude : **tout nouveau champ de base de données
   édité par le formulaire doit être ajouté ici, faute de quoi sa modification ne sera pas auditée.**
2. **`reviewDiff.ts`** — réécrire `computeChangedChecklistFieldPaths` en `computeChangedFieldPaths`,
   opérant sur deux `FeedFormState` au lieu de deux `ChecklistGraph`. La logique de parcours reste la
   même ; seuls changent les accesseurs :

   | Type d'entité | `ChecklistGraph` | `FeedFormState` |
   |---|---|---|
   | `MM_SOURCE` | `graph.source` | `state.mMSourceDescription` |
   | `REFERENCE` | `graph.source.references` | `state.mMSourceDescription.references` |
   | `CONTRIBUTION` | `graph.contributions` | `state.mMSourceContributions` |
   | join source/version | `graph.sourceOnPieceVersions` (`joinId`) | `state.mMSourceOnPieceVersions` (`pieceVersionId`) |
   | autres | tableaux plats homonymes | tableaux plats homonymes |

3. **Diff du join source/version** — point à ne pas manquer : la version actuelle ne compare que les
   **rangs**, indexés par `joinId`. Elle doit désormais détecter, indexée par `pieceVersionId` :
   les **ajouts**, les **retraits** et les **substitutions** de `pieceVersionId`, en plus des
   changements de rang. C'est ce qui rendra visible la substitution opérée par le fork (L9).
4. **`auditCompose.ts`** — adapter `findNodeInGraph` aux accesseurs `FeedFormState` (la fonction
   actuelle mélange déjà des heuristiques par préfixe de propriété : en profiter pour la remplacer
   par une table de correspondance explicite type → accesseur, plus lisible et moins fragile).
   Étendre `buildSourceOrderingSnapshot` pour produire `{ pieceVersionId, rank }` trié — la forme
   est déjà celle-là, il faut surtout garantir qu'elle est bien émise dans le `before`/`after` de
   `MM_SOURCE` dès qu'un join change, et pas seulement quand un rang change.
5. Ajouter à `composeAuditEntries` un paramètre `protectedEntityIds?: Set<string>` : toute entrée
   `DELETE` dont l'`entityId` y figure est écartée. C'est le point d'accroche du fork (L9).
6. **`types/reviewTypes.ts`** — supprimer `ChecklistGraph` et `RequiredChecklistItem` ; renommer les
   types conservés selon la table de nommage. Conserver `AuditEntry`, `AuditEntityType`,
   `AuditOperation` ; supprimer `GloballyReviewedEntityArrays` (remplacé par `GloballyReviewedIds`
   défini dans `types/zodTypes.ts`).

### Tests

Réécrire à partir des tests existants (`reviewDiff.test.ts`, `reviewDiff.degeCases.test.ts`,
`reviewDiff.rankChange.test.ts`, `auditCompose.test.ts`), en remplaçant les fixtures `ChecklistGraph`
par des `FeedFormState`. Cas à couvrir :

- champ modifié à chaque niveau (source, référence, contribution, personne, pièce, version,
  mouvement, section, marque) ;
- valeur `null → renseignée`, `renseignée → null`, `"" ≡ null` ;
- ajout et suppression de mouvement, de section, de marque, de référence, de contribution ;
- changement de rang de join ; **ajout, retrait et substitution de `pieceVersionId`** ;
- `protectedEntityIds` : les `DELETE` correspondants sont bien écartés ;
- une entité présente à l'identique des deux côtés ne produit **aucune** entrée.

`features/review/reviewMock.ts` doit être réécrit pour produire des `FeedFormState`.

---

## Lot 8 — Normalisation serveur

**Dépendances :** L7. **Taille :** M.

### Fichiers

- Nouveau : `utils/server/normalizeFeedFormStateForPersistence.ts`

### Tâches

Écrire une fonction pure appliquant, dans cet ordre :

1. **Retrait des marques `noMM: true`.** Elles n'ont pas de ligne en base. Ce retrait est ce qui
   produit le `DELETE` attendu quand un reviewer bascule une marque réelle en « pas de marque »
   (défaut §12.1 du cadrage). Écrire un test explicitement dédié à ce scénario.
2. **Retrait des champs UI** : `isNew`, `isComposerNew`, et tout autre drapeau de formulaire présent
   sur les entités.
3. **Normalisation des valeurs vides** : `""` et `undefined` → `null`, de façon cohérente avec la
   fonction `norm()` du moteur de diff (les deux doivent partager la même implémentation, sans quoi
   des faux positifs de diff apparaîtront).
4. **Continuité des rangs** de `mMSourceOnPieceVersions` à partir de 1.
5. **Attribution d'ids manquants** : générer un uuid serveur pour toute entité sans id — cas connu
   et légitime pour les `Reference` créées côté client. Pour tout autre type, générer l'id mais
   journaliser un avertissement `prodLog`, car cela signale probablement un défaut de sous-formulaire.
6. **Vérification de cohérence** : chaque `Section` porte un `tempoIndicationId` ; chaque
   `MetronomeMark` conservée porte un `sectionId` connu de l'état. Lever une erreur explicite sinon
   (elle deviendra un 400).

### Tests

`__tests__/server/normalizeFeedFormStateForPersistence.test.ts`, avec un cas par règle et le
scénario `noMM` traité à part.

---

## Lot 9 — Fork de `PieceVersion`

**Dépendances :** L8. **Taille :** L. **Le lot le plus sensible du projet.**

### Fichiers

- Nouveau : `utils/server/forkModifiedSharedPieceVersions.ts`

### Contrat

```ts
type ForkResult = {
  state: FeedFormState;             // état remappé
  createdPieceVersionIds: string[]; // les copies
  protectedEntityIds: Set<string>;  // sous-arbre d'origine : PV + Movements + Sections
  forkedPairs: Array<{ from: string; to: string }>; // pour la journalisation
};

async function forkModifiedSharedPieceVersions(
  tx: PrismaTx,
  args: { mMSourceId: string; baseline: FeedFormState; state: FeedFormState },
): Promise<ForkResult>;
```

### Algorithme

1. Pour chaque `pieceVersion` de l'état liée à la source :
   - si son id est absent de la base → création normale, **pas de fork** ;
   - sinon, évaluer `isPieceVersionModified(baseline, state, pvId)` :
     - un champ de la `PieceVersion` diffère ; **ou**
     - l'ensemble des `Movement` diffère (ajout/suppression) ; **ou**
     - l'ensemble des `Section` d'un mouvement diffère (ajout/suppression) ; **ou**
     - un champ d'un `Movement` ou d'une `Section` diffère, **y compris** `null → valeur` et
       `valeur → null`.
     Réutiliser le moteur de diff du L7 restreint à ce sous-arbre — surtout ne pas réécrire une
     seconde logique de comparaison, qui divergerait.
   - si modifiée, compter :
     ```ts
     tx.mMSourcesOnPieceVersions.count({
       where: { pieceVersionId: pvId, mMSourceId: { not: mMSourceId } },
     })
     ```
     **Le `not: mMSourceId` est essentiel** : le test exclut la source en cours de revue.
   - fork si et seulement si ce compte est `> 0`.
2. Pour chaque `PieceVersion` à forker :
   - générer un nouvel id pour la `PieceVersion`, chacun de ses `Movement`, chacune de ses
     `Section` ;
   - les **valeurs** des copies sont celles de l'**état soumis** (version éditée), pas de la
     baseline ;
   - `pieceId` inchangé ; `tempoIndicationId` des sections **conservé tel quel** (aucun clonage de
     `TempoIndication`).
3. Remapper dans l'état :
   - `pieceVersions` : l'originale est retirée, remplacée par la copie ;
   - `mMSourceOnPieceVersions` : l'entrée dont `pieceVersionId` correspond passe au nouvel id, rang
     inchangé. La contrainte `@@unique([mMSourceId, pieceVersionId])` garantit l'unicité de l'entrée
     à remapper ;
   - `metronomeMarks` : `sectionId` remappés. **Seules les marques de la source
     en revue existent dans l'état** — celles des autres sources ne sont pas dans le périmètre et ne
     doivent jamais être touchées.
4. Constituer `protectedEntityIds` avec tous les ids d'origine (`PieceVersion`, `Movement`,
   `Section`).
5. Journaliser chaque fork avec `prodLog` : `[forkPieceVersion] <ancien> → <nouveau> (source <id>)`.
   Ce sont des créations de données difficilement réversibles, elles doivent laisser une trace
   serveur.

### Ce que le fork ne fait pas

- Il ne supprime rien.
- Il ne modifie aucune ligne de la `PieceVersion` d'origine ni de ses descendants.
- Il ne produit aucune entrée d'audit lui-même : c'est le **recalcul du diff** sur l'état remappé
  (L10, étape 7) qui produit les `CREATE` des copies et l'`UPDATE` de `MM_SOURCE`.

### Tests

`__tests__/server/forkModifiedSharedPieceVersions.test.ts` :

- version modifiée + partagée → fork, remappage complet du join et des marques ;
- version modifiée + **non** partagée → pas de fork, mise à jour en place ;
- version **non** modifiée + partagée → pas de fork ;
- version partagée uniquement avec **elle-même** (la source en revue) → pas de fork
  (vérifie l'exclusion `not: mMSourceId`) ;
- ajout de section seul → déclenche le fork ;
- suppression de mouvement seul → déclenche le fork ;
- champ passé de `null` à une valeur, et l'inverse → déclenchent le fork ;
- `tempoIndicationId` préservé dans les sections clonées ;
- `protectedEntityIds` contient bien tous les ids d'origine ;
- les marques métronomiques d'une autre source pointant les sections d'origine sont intactes.

---

## Lot 10 — Route de soumission réécrite

**Dépendances :** L3, L9. **Taille :** XL. **À découper si nécessaire.**

### Fichiers

- `app/api/review/[reviewId]/submit/route.ts`
- Nouveau : `utils/server/applyRankUpdatesInTwoPhases.ts`
- Nouveau : `utils/server/computeMMSourceDerivedData.ts`

### 10.1 Séquence hors transaction

```
1. session, rôle, propriétaire, état IN_REVIEW
2. payload { feedFormState, overallComment } (contrôle de structure)
3. contrôle des champs obligatoires (modèle app/api/feedForm/route.ts)
4. assertsIsPersistableFeedFormState(feedFormState)
5. baseline = getReviewBaseline(...) puis extendBaselineByExistence(baseline, state)
6. state = normalizeFeedFormStateForPersistence(state)
7. diff #1 = computeChangedFieldPaths(baseline, state)
8. fork = forkModifiedSharedPieceVersions(...)      → state remappé + protectedEntityIds
9. diff #2 = computeChangedFieldPaths(baseline, fork.state)   ← RECALCUL
10. auditEntries = composeAuditEntries(reviewId, baseline, fork.state, fork.protectedEntityIds)
11. derived = computeMMSourceDerivedData(fork.state)
12. e-mail de journalisation pré-transaction (type "Review SUBMIT data" : baseline, diff, audit, summary)
```

**Ne pas rejouer les prédicats `isComplete` côté serveur** — décision actée : on fait confiance au
formulaire de front pour la complétude métier, le serveur se limite au garde structurel de l'étape 4.

Le fork exige un accès base (le `count`) : soit ouvrir la transaction dès l'étape 8 et y faire les
calculs restants, soit exécuter le `count` hors transaction. **Préférer la première option** : le
comptage doit être cohérent avec les écritures.

### 10.2 Ordre des mutations dans la transaction

**Phase 1 — suppressions** (avant tout upsert, pour libérer les rangs) :

| # | Entité | Règle |
|---|---|---|
| 1 | `MetronomeMark` | présentes en baseline, absentes de l'état (les `noMM` ont été retirées en L8) |
| 2 | `Section` | présentes en baseline, absentes de l'état, **hors `protectedEntityIds`** |
| 3 | `Movement` | idem, **hors `protectedEntityIds`** |
| 4 | `Reference` | présentes en baseline, absentes de l'état |
| 5 | `Contribution` | idem |
| 6 | `MMSourcesOnPieceVersions` | joins de la source absents de l'état (inclut le join remappé par le fork) |

**Jamais de suppression de** `PieceVersion`, `Piece`, `Person`, `Organization`, `Collection`,
`TempoIndication`.

**Phase 2 — référentiels et arbre musical :**
`Person` → `Organization` → `Collection` → `TempoIndication` → `Piece` → `PieceVersion`
(y compris les créations du fork) → `Movement` → `Section`.

**Phase 3 — source et enfants directs :**
`MMSource` (champs + `sectionCount` + `permalink`) → `Reference` → `Contribution` →
`MMSourcesOnPieceVersions` → `MetronomeMark`.

**Phase 4 — traçabilité et clôture :**
`AuditLog.createMany` → `ReviewedEntity` upsert → `Review` en `APPROVED` (`endedAt`,
`overallComment`) → `MMSource.reviewState` en `APPROVED`.

### 10.3 Règle d'écriture par entité

Reprendre le principe existant `shouldUpsertEntity`, mais **fondé sur la baseline étendue** :

- id absent de la baseline étendue → `create`
- id présent, diff non vide → `update`
- id présent, diff vide → **aucune écriture** (préserve `updatedAt`)

`isNew` de l'état client **n'entre jamais** dans cette décision.

### 10.4 Mise à jour des rangs en deux phases

`applyRankUpdatesInTwoPhases(tx, { model, updates, scope })` : écrire d'abord des rangs temporaires
hors plage (`max(rangs) + 1000 + offset`), puis les rangs définitifs. À appliquer aux **quatre**
contraintes :

| Modèle | Contrainte | Statut actuel |
|---|---|---|
| `MMSourcesOnPieceVersions` | `@@unique([mMSourceId, rank])` | déjà traité — à extraire dans le helper |
| `Movement` | `@@unique([pieceVersionId, rank])` | **à ajouter** |
| `Section` | `@@unique([movementId, rank])` | **à ajouter** |
| `Piece` | `@@unique([collectionId, collectionRank])` | **à ajouter** |

### 10.5 Données dérivées

`computeMMSourceDerivedData(state)` retourne `{ sectionCount, permalink }` :

- `sectionCount` : somme des sections de toutes les `PieceVersion` liées à la source, **après**
  remappage du fork. Réutiliser la formule de `app/api/feedForm/route.ts`.
- `permalink` : `getIMSLPPermaLink(state.mMSourceDescription.link)`. Recalculé systématiquement,
  jamais repris du client (défaut §12.3 du cadrage).

### 10.6 `ReviewedEntity`

Conserver la logique actuelle, qui est correcte : déduplication par `type:id`, et **exclusion des
entités déjà globalement revues** pour ne pas réattribuer le marqueur d'origine au reviewer courant.
Ajouter les `PieceVersion` créées par le fork ; ne pas toucher aux marqueurs des originales.

### 10.7 Gestion d'erreur et e-mails de journalisation

Conserver la journalisation par e-mail en deux temps (comportement existant enrichi) :
1. **Avant transaction :** e-mail de données (`"Review SUBMIT data"`) contenant l'état soumis, la baseline, le diff calculé, les entrées `AuditLog` prévues et le résumé des entités touchées.
2. **Après transaction réussie (SUCCESS) :** e-mail de debug transactionnel (`"Review submit transaction debug"`) contenant l'identifiant de la revue, l'objet `txDebug` et les données complètes rechargées depuis la base (`mMSourceFromDb` incluant les `auditLog` liés).
3. **En cas d'échec (ERROR / catch) :** e-mail d'erreur (`"Review SUBMIT transaction ERROR"`) contenant le détail de l'erreur levée et l'état d'avancement de `txDebug`.

Traduire les violations de contrainte d'unicité (`Piece`, `Reference`, `Collection`, index partiels) en réponse `409` avec un message exploitable par le reviewer, plutôt qu'en `500` opaque.

### Tests

`__tests__/api.reviewSubmit.test.ts` (remplace `api.submit.test.ts`) :

- refus : non authentifié, mauvais rôle, non propriétaire, revue non `IN_REVIEW`, payload non
  persistable ;
- une entité préexistante sélectionnée et **inchangée** → aucune écriture, aucun `AuditLog` ;
- une entité préexistante **modifiée** → `UPDATE`, jamais `CREATE` ;
- une entité réellement nouvelle → `CREATE` ;
- marque basculée en `noMM` → la ligne est supprimée ;
- échange de rangs entre deux mouvements → réussit sans violation d'unicité ; idem sections, idem
  `collectionRank`, idem joins ;
- fork : la `PieceVersion` d'origine et son arbre sont **intacts en base** ; aucun `AuditLog`
  `DELETE` ne les concerne ; l'audit contient les `CREATE` des copies et un `UPDATE` de `MM_SOURCE` ;
- `sectionCount` et `permalink` recalculés ;
- atomicité : une erreur en phase 3 laisse la base strictement inchangée, y compris `Review.state`.

---

## Lot 11 — Gardes de démarrage et contraintes en base

**Dépendances :** L0. **Taille :** S. **Parallélisable.**

### Fichiers

- `app/api/review/start/route.ts`
- Nouveau : `specs/20260808_MIGRATION_NOTE_review-unique-in-review-per-reviewer.md`

### Tâches

1. Dans `start/route.ts`, ajouter avant la création : refuser en `409` si
   `db.review.findFirst({ where: { creatorId: session.user.id, state: IN_REVIEW } })` retourne
   quelque chose. Message explicite invitant à terminer ou abandonner la revue en cours.
2. Créer la note de migration manuelle, sur le modèle de
   `specs/20250811_MIGRATION_NOTE_review-partial-unique-index_manual-SQL.md` :
   ```sql
   CREATE UNIQUE INDEX CONCURRENTLY review_unique_in_review_per_reviewer
   ON "Review" ("creatorId")
   WHERE state = 'IN_REVIEW';
   ```
   Le contrôle applicatif seul est sujet aux compétitions ; l'index est la garantie réelle.
3. Élargir la traduction d'erreur du bloc `catch` existant (qui détecte déjà
   `/unique|constraint|duplicate/i`) pour distinguer les deux conflits : source déjà en revue, ou
   reviewer ayant déjà une revue active.

### Tests

Adapter `__tests__/api.start.test.ts` : refus si le reviewer a déjà une revue active sur une **autre**
source ; le refus existant sur la même source reste inchangé ; le refus « reviewer = créateur de la
source » reste inchangé.

---

## Lot 12 — Suppressions et nettoyage

**Dépendances :** L6, L10, L11. **Taille :** M. **À faire en dernier**, sinon la base de code ne
compile plus pendant les lots intermédiaires.

### Fichiers et dossiers à supprimer

**Routes et pages**
- `app/(signedIn)/review/[reviewId]/checklist/` (page + layout) — pas de redirection de compatibilité,
  l'interface n'est pas en production
- `app/api/review/[reviewId]/overview/route.ts`

**Contexte et bridge**
- `features/review/reviewEditBridge.ts`
- `context/reviewWorkingCopyContext.tsx`
- `features/review/components/ReviewWorkingCopyClientProvider.tsx`
- `features/review/components/ReviewEditBanner.tsx`

**Logique de checklist**
- `features/review/reviewAdapters.ts` (**déjà sans importeur — code mort**)
- `features/review/reviewProgress.ts`
- `features/review/utils/expandRequiredChecklistItems.ts`
- `features/review/utils/areAllItemsChecked.ts`
- `features/review/utils/getItemValueDisplay.ts`
- `features/review/slices/` (`CollectionSlice`, `PieceSlice`, `SummarySlice`)
- `features/review/SliceHeader.tsx`
- `features/review/components/ChecklistItemRow.tsx`
- `features/review/components/ChecklistRow.tsx`
- `utils/server/getReviewOverview.ts` (remplacé par `getReviewBaseline.ts`)

**Constantes et types**
- `FEED_FORM_BOOT_KEY` et `feedFormFromWorkingCopyError` dans `utils/constants.ts`
- `GET_URL_REVIEW_CHECKLIST` et `GET_URL_API_REVIEW_OVERVIEW` dans `utils/routes.ts`
- `ChecklistGraph`, `RequiredChecklistItem` dans `types/reviewTypes.ts`

**Tests** — cf. inventaire du lot 0.

### À examiner avant suppression

- `features/review/utils/isCollectionCompleteInChecklistGraph.ts` et
  `features/review/utils/processSourceOnPieceVersionsForDisplay.ts` : réutilisables sur
  `FeedFormState` ? Si oui, adapter et renommer (L3, tâche 5) ; sinon supprimer.
- `features/review/components/ReviewHelpDrawer.tsx` : monté par `app/(signedIn)/review/layout.tsx`.
  Vérifier s'il reste pertinent pour la liste `/review`, ou s'il est remplacé par
  `FeedFormHelpDrawer` sur la page de revue.
- `utils/getEntityByIdOrKey.ts` : typé sur `ChecklistGraph`, mais probablement générique. À
  regénéraliser plutôt qu'à supprimer.
- `app/api/review/[reviewId]/audit/route.ts` et `audit-logs/route.ts`,
  `features/review/ReviewAuditLogPanel.tsx` : **conservés**, hors périmètre.

### Vérification finale

```bash
grep -rn "checklist\|Checklist\|CHECKLIST\|workingCopy\|WorkingCopy\|reviewContext\|BOOT_KEY" \
  --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v '^./prisma/client'
```
Doit ne rien retourner, hors éventuels commentaires historiques assumés.

---

## Lot 13 — Audit de préservation des identifiants dans les sous-formulaires

**Dépendances :** L0. **Taille :** M. **Parallélisable. À ne pas repousser** : c'est le risque
résiduel identifié au cadrage (§13).

### Contexte

`isNew: true` ouvre le formulaire de création prérempli. Chaque sous-formulaire doit réécrire **le
même identifiant** et non en générer un nouveau. En saisie initiale, une régénération d'id passe
inaperçue — tout est créé de toute façon. En revue, elle dupliquerait silencieusement une entité
canonique de référence.

### Tâches

Auditer les cinq chemins de création/édition, en partant de
`features/feed/multiStepSinglePieceVersionForm/SinglePieceVersionFormContainer.tsx` et des
composants `*SelectOrCreate` :

| Entité | Point d'entrée à vérifier |
|---|---|
| `Person` | création/édition de compositeur et de contributeur |
| `Organization` | création/édition de contributeur |
| `Collection` | sous-wizard collection |
| `Piece` | `onPieceCreated` — vérifier que `getPieceStateFromInput` reçoit bien l'id existant |
| `PieceVersion` | `onPieceVersionCreated` — reçoit `pieceVersionId: selectedPieceVersionId`, à confirmer sur tous les chemins |

Le chemin de clonage explicite (`onInitPieceVersionCreationFromSelected`) génère volontairement de
nouveaux ids : **c'est correct, ne pas le modifier.**

Vérifier aussi `context/utils/cleanFeedFormState.ts` : il élague les entités jugées inutilisées. En
revue, l'état initial est complet et le risque d'élagage d'une entité encore référencée doit être
vérifié, notamment pour les `TempoIndication` et les `Collection`.

### Tests

Un test par entité : ouvrir le sous-formulaire sur une entité existante `isNew: true`, modifier un
champ, valider, et **vérifier que l'id est identique** dans `FeedFormState` après commit.
Placer ces tests aux côtés des tests existants
`__tests__/utils/commitSinglePieceVersionFormToFeedForm.test.ts` et
`__tests__/utils/commitCollectionPieceVersionsFormToFeedForm.test.ts`.

### Si un défaut est trouvé

Le corriger dans ce lot et ajouter un test de non-régression. Signaler dans la PR si la correction a
un effet visible sur la saisie initiale.

---

## Lot 14 — Recette et non-régression

**Dépendances :** L12. **Taille :** M.

### Tests automatisés — vérification des invariants

Un test par invariant du §11 du cadrage, ou la démonstration qu'il est couvert par un test d'un lot
précédent. Établir la table de correspondance invariant → test dans la PR.

### Recette manuelle

**Parcours nominal de revue**
1. Depuis `/review`, démarrer une revue → redirection vers `/review/[reviewId]`.
2. L'étape Intro s'affiche avec le contenu de revue ; valider.
3. Les étapes 1 à 4 sont préremplies et marquées complètes sans intervention.
4. Modifier un champ à chaque niveau (source, contribution, pièce, section, marque).
5. Ouvrir la modale de visualisation des modifications (« Voir les modifications » dans le bandeau) → vérifier que l'ensemble des champs modifiés apparaît correctement avec leurs nouvelles valeurs.
6. Recharger la page → tout est restauré.
7. Ouvrir le commentaire général, saisir un texte, fermer, recharger → le texte est restauré.
8. Approuver → confirmation → retour à `/review`, source disparue de la liste.
9. Vérifier en base : `Review.state = APPROVED`, `MMSource.reviewState = APPROVED`, les `AuditLog`
   correspondent exactement aux modifications, les `ReviewedEntity` sont créés, `sectionCount` est
   juste, le brouillon local est vide.

**Visualisation et gestion des alertes**
10. Simuler une invalidation de stockage local (version de schéma obsolète ou session incohérente) → vérifier qu'un toast d'avertissement en anglais apparaît clairement en haut de l'écran sans échec silencieux.

**Isolation des brouillons**
11. Ouvrir `/feed` dans un autre onglet, saisir quelque chose, revenir à la revue → aucune
   contamination dans les deux sens.

**Fork**
12. Sur une source dont une `PieceVersion` est partagée avec une autre source, modifier une section →
    approuver → vérifier que l'autre source pointe toujours l'originale intacte, que la source revue
    pointe la copie, et que les marques métronomiques de chaque source visent les bonnes sections.

**Abandon**
13. Démarrer une revue, modifier, abandonner → la source revient dans la liste, aucune modification
    en base, brouillon local purgé.

**Concurrence**
14. Tenter de démarrer une seconde revue avec le même compte → refusée.
15. Ouvrir `/review/[reviewId]` d'un autre reviewer avec un compte admin → redirigé vers `/review`.

**Non-régression de la saisie initiale**
16. Saisir une MM Source complète via `/feed` et l'enregistrer. Vérifier le brouillon, la
    réinitialisation, et la source créée en base.

### Documentation

- Mettre à jour la section « Review process » de `AGENTS.md` : la checklist, le bridge et le
  `ChecklistGraph` n'existent plus ; décrire le nouveau parcours et les nouvelles clés localStorage.
- Ajouter `features/review/reviewDiffFieldsSchema.ts` dans la liste des endroits à mettre à jour lors
  d'un changement de structure de données MM Source (section « MM Source data display » d'`AGENTS.md`).

---

## Récapitulatif des livrables

| Lot | Objet | Taille | Dépend de |
|---|---|---|---|
| L0 | Préparation, état de départ des tests | S | — |
| L1 | Types et contexte de session | M | L0 |
| L2 | Clés de stockage paramétrables | M | L1 |
| L3 | Baseline serveur et hydratation | L | L1 |
| L4 | Route `/review/[reviewId]` | M | L2, L3 |
| L5 | Habillage de session | S | L4 |
| L6 | `Intro` et `FeedSummary` polymorphes | M | L5 |
| L7 | Moteur de diff sur `FeedFormState` | L | L0 |
| L8 | Normalisation serveur | M | L7 |
| L9 | Fork de `PieceVersion` | L | L8 |
| L10 | Route de soumission | XL | L3, L9 |
| L11 | Gardes de démarrage et index | S | L0 |
| L12 | Suppressions et nettoyage | M | L6, L10, L11 |
| L13 | Audit de préservation des ids | M | L0 |
| L14 | Recette et non-régression | M | L12 |
