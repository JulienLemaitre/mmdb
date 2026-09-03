# Review in Feed Form — décisions actées

Ce document synthétise les décisions prises pour remplacer l'interface de review dédiée
(`/review/[reviewId]/checklist`) par une réutilisation directe du formulaire de feed
(`/feed`), préremplie avec les données de la MMSource à revoir. Il sert de base pour bâtir
la feuille de route d'implémentation — ce n'est pas la feuille de route elle-même.

## 1. Principe général

- La liste des MMSource à revoir (`/review`) et le mécanisme de lock (`MMSource.reviewState`,
  `Review.state`) sont conservés à l'identique.
- Le clic sur "Start review" mène désormais à `app/(signedIn)/review/[reviewId]/page.tsx`
  (nouvelle page + layout), qui affiche **le même formulaire multi-étapes que `/feed`**,
  préchargé avec les données de la MMSource en cours de revue.
- La sauvegarde finale du formulaire déclenche le traitement spécifique à la review
  (validation, audit, `ReviewedEntity`, passage en `APPROVED`) et non plus la création
  d'une nouvelle MMSource.
- L'ancienne interface checklist et son bridge disparaissent intégralement.

## 2. Mode générique du formulaire de feed

- `FeedFormInfo` gagne un champ `mode: "data-entering" | "self-source-edit" | "review"`,
  qui remplace l'actuel `reviewContext?: ReviewContext` (présence-only). `reviewId` reste
  porté par `formInfo` pour le routage de soumission. Le champ `anchors` (deep-link vers un
  champ précis) disparaît : il n'a plus d'utilité sans checklist field-by-field.
- Seul le mode `review` est implémenté dans ce projet. `self-source-edit` (édition par un
  éditeur de sa propre MMSource avant qu'elle ne soit reviewée) est **hors scope**, mais le
  champ `mode` est conçu dès maintenant pour l'accueillir sans nouveau refactor de structure.
- Le tableau `steps` de `stepsUtils.ts` reste **statique** (un seul tableau, pas de
  `getSteps(mode)`) : les écarts entre modes sont trop peu nombreux pour justifier une
  liste d'étapes différente par mode.
  - L'étape "Intro" (rank 0) est sautée en mode review en initialisant
    `formInfo.introDone = true` et `formInfo.currentStepRank = 1` dans l'état de boot,
    exactement comme le fait le bridge actuel.
  - L'étape finale (`FeedSummary.tsx`, rank 5) devient **polymorphe** : elle branche son
    action de sauvegarde sur `formInfo.mode` (`POST /api/feedForm` en mode data-entering,
    `POST /api/review/[reviewId]/submit` en mode review), avec un texte de bouton et un
    message de confirmation adaptés.
- Les prédicats `isComplete` des steps qui dépendent d'un **flag posé manuellement par un
  clic** (`allSourceOnPieceVersionsDone`, posé uniquement via le bouton "Continuer" de
  `MMSourceOnPieceVersions.tsx`) doivent être positionnés à `true` automatiquement dans
  l'état de boot dès que les données préremplies sont déjà cohérentes. Objectif : zéro
  friction, le reviewer n'a jamais à re-cliquer sur une étape qu'il n'a pas modifiée.
  `allSourceContributionsDone` existe dans le type mais n'est utilisé nulle part : à retirer
  ou ignorer, pas d'action nécessaire.

## 3. Hydratation des données (remplace le bridge)

- `../features/review/reviewEditBridge.ts` disparaît entièrement (`buildFeedFormBootStateFromWorkingCopy`,
  `rebuildWorkingCopyFromFeedForm`, `writeBootStateForFeedForm`/`consumeBootStateForFeedForm`,
  `FEED_FORM_BOOT_KEY`).
- `../utils/server/getReviewOverview.ts` est conservé et adapté : au lieu de produire un
  `ChecklistGraph`, il produit directement un objet compatible `FeedFormState` (les deux
  types sont déjà structurellement alignés — mêmes `*State`, mêmes imbrications
  `pieceVersions[].movements[].sections[]`) plus les `globallyReviewed` (ids Person/
  Organization/Collection/Piece/PieceVersion déjà présents en `ReviewedEntity`).
- La nouvelle `layout.tsx`/`page.tsx` de `/review/[reviewId]` est un composant serveur qui
  appelle cette fonction adaptée et transmet le résultat en prop à `FeedFormProvider`
  comme **état initial de fallback** (utilisé uniquement si aucun brouillon local n'existe
  déjà — cf. §4). Le mécanisme `FEED_FORM_BOOT_KEY` (écriture/consommation via localStorage)
  devient superflu et est supprimé : plus besoin de faire transiter la donnée par un
  localStorage intermédiaire puisqu'il n'y a plus d'aller-retour entre deux interfaces.
- L'édition d'une pièce/collection déjà ajoutée à l'étape 3 (rank 3) réutilise le mécanisme
  existant de ré-ouverture des sous-formulaires single-piece/collection depuis une entrée
  déjà présente dans `FeedFormState` (déjà utilisé en saisie normale) — aucune logique de
  seed spécifique à la review n'est nécessaire pour ces sous-wizards.

## 4. Persistance locale (localStorage)

- Une **seule clé fixe** pour le brouillon de review en cours (pas de templating par
  `reviewId`) : une seule review active possible à la fois pour un reviewer donné (cf. §7).
  Il faut abandonner la review en cours avant d'en commencer une autre.
- `FeedFormProvider` (et les deux providers de sous-wizard single-piece/collection) doivent
  choisir entre **deux clés fixes** selon le mode (ex. `"feedForm"` vs `"reviewDraft"`,
  `"singlePieceVersionForm"` vs `"singlePieceVersionForm:review"`, etc.) plutôt qu'une clé
  unique câblée en dur à la définition du reducer comme aujourd'hui
  (`feedFormReducer.ts` fait `withLocalStorage(reducer, FEED_FORM_LOCAL_STORAGE_KEY, ...)`
  au chargement du module). Nécessite de faire de `withLocalStorage`/les providers des
  fonctions paramétrables par mode plutôt que des constantes figées.
- Pas de péremption du brouillon de review : s'il n'y a pas d'abandon explicite, le lock
  DB (`IN_REVIEW`) et le brouillon local restent indéfiniment, et sont restaurés
  automatiquement au retour sur `/review/[reviewId]` — même comportement que le brouillon
  `/feed` actuel.
- Le vidage lors d'un changement de version de schéma suit le mécanisme existant
  (`LOCAL_STORAGE_SCHEMA_VERSION` dans `../utils/localStorage.ts`) : à bumper puisque la forme
  de `FeedFormState`/`FeedFormInfo` change (ajout de `mode`, suppression d'`anchors`, etc.).

## 5. Wrapper "review en cours"

- Un composant léger (remplace `ReviewEditBanner.tsx`), monté à l'intérieur de
  `FeedFormProvider` (mode review) dans le nouveau layout, affichant :
  - une progression légère dérivée des prédicats `isComplete` déjà existants dans `steps`
    (ex. "3 / 5 étapes complétées"), sans nouveau suivi par champ ou par entité ;
  - un bouton pour ouvrir/éditer le commentaire général de review (`overallComment`) à
    tout moment ;
  - un bouton "Abandonner la review".
- Toute la logique de checklist par champ (`reviewChecklistSchema.ts` en tant que
  checklist, `expandRequiredChecklistItems.ts`, `reviewProgress.ts`,
  `areAllItemsChecked.ts`, `getItemValueDisplay.ts`, les composants `slices/*`,
  `ChecklistItemRow.tsx`, `ChecklistRow.tsx`, `SliceHeader.tsx`) disparaît.

## 6. Diff & Audit

- Le moteur de diff/audit est adapté pour comparer deux `FeedFormState` directement
  (baseline issue de la DB au moment du `start`, working state soumis à la fin) — pas de
  type intermédiaire `ChecklistGraph` conservé côté serveur.
- `reviewChecklistSchema.ts` est conservé mais **renommé et épuré des `label`** (qui ne
  servaient qu'à l'affichage de checklist) : il ne reste que, par type d'entité, la liste
  des champs à comparer pour construire les entrées `AuditLog` avant/après (ex.
  `reviewDiffFieldsSchema.ts` / `REVIEW_DIFF_FIELDS_SCHEMA` — nom à affiner en implémentation).
  Ce schéma doit continuer à être maintenu à la main à chaque évolution du schéma DB
  (rappel : `movement.isVariation` a été ajouté récemment et devrait y figurer).
- `reviewDiff.ts` (`computeChangedChecklistFieldPaths`) et `auditCompose.ts`
  (`composeAuditEntries`) sont réécrits pour opérer sur `FeedFormState` en s'appuyant sur ce
  schéma renommé, en conservant la même logique de regroupement par entité et de
  before/after JSON dans `AuditLog`.
- `app/api/review/[reviewId]/submit/route.ts` reçoit désormais `{ feedFormState,
  overallComment }` au lieu de `{ workingCopy, checklistState, overallComment }`. Toute la
  validation "checklist complète" disparaît : la condition d'approbation devient
  uniquement "toutes les steps Feed sont valides" (vérifié côté client avant d'autoriser le
  clic final, et re-vérifié côté serveur en rejouant les mêmes prédicats `isComplete` sur le
  `feedFormState` reçu, pour ne pas faire confiance au client).
- `ReviewedEntity` continue d'être upserted pour Person/Organization/Collection/Piece/
  PieceVersion présents dans le working state et pas déjà globalement reviewés — logique
  serveur inchangée dans son principe, juste réalimentée depuis `FeedFormState`.

## 7. `isNew` et fork de PieceVersion partagée

- La sémantique actuelle du flag `isNew` porté par les entités du `FeedFormState` est
  **conservée sans changement** pour le mode review : `isNew: true` (= pas encore
  globalement reviewé) rend l'entité éditable dans le formulaire ; `isNew: false` (déjà
  reviewé) la rend sélectionnable mais non éditable en place. Aucun champ distinct n'est
  introduit — cela évite un comportement contradictoire avec le reste des formulaires.
- Cas particulier **PieceVersion uniquement** (pas Person/Organization/Collection/Piece) :
  depuis qu'un éditeur peut sélectionner une PieceVersion existante non encore reviewée
  (`isNew: true`) et donc l'éditer en place, il faut, **au moment de la persistence de la
  review côté serveur**, détecter si cette PieceVersion est référencée par une autre
  MMSource. Si oui et qu'elle a été modifiée durant la review :
  1. cloner la PieceVersion avec un nouvel id, ainsi que ses `Movement`/`Section` (nouveaux
     ids également) ;
  2. faire pointer le `MMSourcesOnPieceVersions` de *cette* review vers le nouvel id de
     PieceVersion ;
  3. reporter le remapping des nouveaux ids de `Section` sur les `MetronomeMark.sectionId`
     de cette même MMSource.
  La PieceVersion partagée d'origine n'est jamais mutée. Pour Person/Organization/
  Collection/Piece, une modification de propriété s'applique en place et se répercute
  intentionnellement sur toutes les MMSource qui les référencent (ce sont des référentiels
  canoniques, contrairement à la structure Movement/Section qui est propre à
  l'édition-source).

## 8. Abandon de review

- Bouton "Abandonner" dans le wrapper (§5) : appelle `POST /api/review/[reviewId]/abort`
  (logique serveur inchangée : `Review.state = ABORTED`, `MMSource.reviewState = ABORTED`),
  puis vide la clé de brouillon "review en cours" et redirige vers `/review`.
- Fermeture d'onglet sans abandon explicite : le lock reste `IN_REVIEW` indéfiniment (pas de
  timeout automatique), le brouillon reste en localStorage et sera restauré à la prochaine
  ouverture de `/review/[reviewId]`.

## 9. Accès et concurrence

- `/review` continue de rediriger automatiquement le reviewer vers sa review `IN_REVIEW`
  active si elle existe (comportement actuel de `app/(signedIn)/review/page.tsx:30-36`,
  pointant vers la nouvelle URL).
- `../app/api/review/start/route.ts` doit désormais vérifier, en plus du verrou existant sur la
  MMSource, que **le reviewer n'a pas déjà une autre review `IN_REVIEW`** (aujourd'hui
  seule la même MMSource est protégée contre le double-lock). Nécessaire dès qu'on adopte
  une clé de brouillon unique sans id (§4) : deux reviews actives en parallèle pour le même
  reviewer écraseraient silencieusement l'une des deux dans le localStorage.
- `/review/[reviewId]` est réservé au reviewer propriétaire (`Review.creatorId`) — pas
  d'accès admin en lecture ou écriture sur la review active de quelqu'un d'autre (à la
  différence de l'ancien `checklist/layout.tsx` qui autorisait `isOwner || isAdmin`). Un
  admin n'aurait de toute façon pas accès au brouillon local, qui vit dans le navigateur du
  reviewer propriétaire — l'autoriser côté serveur sans les données associées n'aurait pas
  de sens. L'admin garde son accès à la liste des reviews et aux `AuditLog` une fois la
  review terminée.

## 10. Commentaire général de review

- `overallComment` reste éditable "à tout moment" dans le wrapper (§5), mais **n'est
  persisté qu'au moment de la soumission finale**, dans le payload de
  `POST /api/review/[reviewId]/submit` — pas d'appel API dédié à chaque modification. Il
  vit dans le `FeedFormState`/brouillon local entre-temps, avec le même risque de perte
  qu'une autre donnée du formulaire en cas de crash avant soumission (accepté).

## 11. Fichiers supprimés / fortement adaptés

**Supprimés :**
- `app/(signedIn)/review/[reviewId]/checklist/` (page + layout)
- `../features/review/reviewEditBridge.ts`
- `../context/reviewWorkingCopyContext.tsx`
- `../features/review/components/ReviewWorkingCopyClientProvider.tsx`
- `../features/review/components/ReviewEditBanner.tsx`
- `../features/review/reviewAdapters.ts`, `reviewProgress.ts`, `utils/expandRequiredChecklistItems.ts`,
  `utils/areAllItemsChecked.ts`, `utils/getItemValueDisplay.ts`
- `features/review/slices/*`, `SliceHeader.tsx`, `components/ChecklistItemRow.tsx`, `components/ChecklistRow.tsx`
- `../utils/constants.ts` : `FEED_FORM_BOOT_KEY`

**Adaptés en profondeur :**
- `../utils/server/getReviewOverview.ts` (retourne un `FeedFormState`-shape au lieu d'un `ChecklistGraph`)
- `../features/review/reviewChecklistSchema.ts` → renommé, débarrassé des `label`
- `../features/review/reviewDiff.ts`, `../features/review/utils/auditCompose.ts` (opèrent sur `FeedFormState`)
- `app/api/review/[reviewId]/submit/route.ts` (payload, validation, fork PieceVersion)
- `../app/api/review/start/route.ts` (garde "une seule review active par reviewer")
- `../types/feedFormTypes.ts` (`mode` généralisé, `anchors` retiré)
- `../context/feedFormContext.tsx`, `../context/feedFormReducer.ts`, `../context/utils/localStorageReducerWrapper.ts`,
  et les deux providers/reducers de sous-wizard (single-piece, collection) : clé de
  localStorage sélectionnée par mode au lieu d'être figée à la définition du module
- `../features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx` (polymorphe par mode)
- `app/(signedIn)/review/reviewListClient.tsx` (route de destination après "Start review")

**Conservés sans changement notable :**
- `app/api/review/[reviewId]/abort/route.ts`
- `app/api/review/[reviewId]/audit/route.ts`, `audit-logs/route.ts`, `ReviewAuditLogPanel.tsx`
- Modèles Prisma `Review`, `ReviewedEntity`, `AuditLog`, enum `REVIEW_STATE`
- `../proxy.ts` (le matcher `/review/:path*` couvre déjà la nouvelle route)

**À l'étude en implémentation (non bloquant pour la feuille de route) :**
- `../features/review/utils/isCollectionCompleteInChecklistGraph.ts` et
  `utils/processSourceOnPieceVersionsForDisplay.ts` : logique probablement réutilisable
  telle quelle dans la fonction d'hydratation adaptée (§3), à vérifier au moment de
  l'implémentation plutôt qu'à trancher ici.
- `app/api/review/[reviewId]/overview/route.ts` : probablement remplacé par un fetch
  serveur direct dans `layout.tsx`/`page.tsx` (composant serveur Next.js) plutôt qu'un GET
  client-side, à confirmer en implémentation.

## 12. Hors scope (rappel)

Le mode `self-source-edit` (un éditeur modifie sa propre MMSource avant qu'elle ne soit
reviewée, en réutilisant la même approche) n'est pas implémenté dans ce projet. Le champ
`mode` (§2) est conçu pour l'accueillir sans nouveau refactor de structure, mais aucune
route, API ni UI ne sont créées pour ce cas ici.
