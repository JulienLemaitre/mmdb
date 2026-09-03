# Feuille de route — Corrections suite à la recette du module Review in Feed Form

**Date :** 2026-08-26  
**Contexte :** Recette de validation du workflow de révision et du formulaire Feed (`/feed` et `/review/[reviewId]`).  
**Document de cadrage d'origine :** `20260808_cadrage_review-in-feed-form.md`  
**Feuille de route initiale :** `20260808_feuille-de-route_review-in-feed-form.md`  
**Document de progression :** `review-in-feed-form_progression.md`

---

## 1. Mode d'emploi pour l'agent IA (Gemini 3.7 Flash)

1. **Règles générales et conventions du dépôt :**
   - Consulter impérativement `AGENTS.md` à la racine avant toute intervention.
   - Respecter le typage : **Prisma** pour la base de données (`types/prismaSelections.ts`), **Zod** pour les formulaires, schémas de validation runtime et API (`types/zodTypes.ts`).
   - Préfixer systématiquement les messages de log et d'erreur par leur source entre crochets (ex. `` `[FeedSummary] ...` ``, `` `[reviewDiff] ...` ``, `` `[reviewSubmit] ...` ``).
   - Utiliser `getNewUuid` depuis `@/utils/getNewUuid` pour générer tout nouvel identifiant (ne jamais importer `uuid` directement).
   - **Langue de l'UI et du code :** Tous les textes utilisateur (labels, boutons, messages d'erreur, toasts, modales) ainsi que le code et les tests doivent être rédigés en **anglais**. Seules les spécifications et la documentation dans `specs/` sont rédigées en français.

2. **Exécution par lot :**
   - Traiter **un seul lot à la fois**, dans l'ordre séquentiel (R1 → R2 → R3 → R4 → R5).
   - Pour chaque lot, appliquer des modifications ciblées (ne jamais réécrire un fichier complet si une modification locale suffit).
   - Valider chaque lot avec les tests Jest ciblés avant de passer au suivant.

3. **Validation et linter :**
   - Utiliser `npx eslint .` pour vérifier la conformité du code (`npm run lint` est déprécié en Next 16).
   - Lancer les suites de tests ciblées via `npx jest path/to/file.test.ts --ci`.

---

## 2. Synthèse des anomalies relevées lors de la recette

| Scénario | Intitulé de l'anomalie | Symptôme constaté | Impact métier |
|---|---|---|---|
| **Scénario 5** | Erreur de diff sur ajout de contribution | Clic sur "View Changes" lève l'erreur `missing entityId for CONTRIBUTION` et affiche "0 changed fields". | Le réviseur ne peut pas visualiser les contributions ajoutées dans le diff modal. |
| **Scénario 8** | Modale d'erreur lors de l'approbation réussie | La modale de succès bascule visuellement vers une modale d'erreur lors du clic de fermeture. | Fausse impression d'échec pour le réviseur alors que la révision est bien approuvée en base. |
| **Scénario 9** | AuditLog incohérent après édition de source | La source et toutes ses marques métronomiques apparaissent supprimées puis recréées dans l'audit. | Historique d'audit pollué et perte de la traçabilité champ par champ des modifications réelles. |
| **Scénario 16** | Formulaire `/feed` non réinitialisé post-création | Le formulaire conserve le brouillon précédent dans `localStorage` si l'utilisateur quitte sans fermer la modale. | Risque de réécrasement ou de confusion lors de la saisie d'une nouvelle source par l'utilisateur. |

---

## 3. Analyse détaillée des causes racines

### Scénario 5 : UUID manquant sur les contributions et blocage du diff modal
* **Cause racine :** Dans `types/formTypes.ts`, `ContributionState` définit `id?: string` comme facultatif. Dans `features/sourceContribution/SourceContributionSelectForm.tsx` (méthodes `onAddPersonContribution` et `onAddOrganizationContribution`), les nouvelles contributions ajoutées à l'état du formulaire ne se voyaient attribuer aucun `id`.
* **Conséquence :** Lors du calcul du diff (`computeChangedFieldPaths`), `features/review/reviewDiff.ts` appelle `buildFieldPath("CONTRIBUTION", node.id, field.path)`. La fonction `buildFieldPath` dans `features/review/reviewDiffFieldsSchema.ts` lève une exception stricte : `buildFieldPath: missing entityId for CONTRIBUTION (non-singleton)`. Le composant `ReviewDiffModal.tsx` capture l'erreur et affiche un diff vide (0 modifications).

### Scénario 8 : Bascule visuelle vers une modale d'erreur à la fermeture
* **Cause racine :** Dans `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`, l'état `isSaveSuccess` utilise le type `boolean | undefined` avec `undefined` comme valeur initiale et valeur de réinitialisation lors de la fermeture de la modale (`handleModalClose`).
* **Conséquence :** Dans le rendu JSX :
  * `type={isSaveSuccess ? "success" : "error"}` évalue à `"error"` dès que `isSaveSuccess` repasse à `undefined`.
  * `getModalDescription()` bascule sur le message de repli d'erreur `Oops! Something went wrong...`.
  * Pendant le court délai de fermeture de la modale / de transition de route, la modale clignote en rouge avec le message d'erreur.

### Scénario 9 : Perte de l'identifiant de source et désynchronisation de l'audit log
* **Cause racine :** Dans `features/sourceDescription/SourceDescriptionEditForm.tsx`, le schéma Zod `SourceSchema` omettait la déclaration du champ `id: z.string().optional()`. Lors de la soumission du formulaire via `react-hook-form` (`zodResolver(SourceSchema)`), le champ `id` de la source était dépouillé de l'objet de sortie.
* **Conséquence :** Dans `MMSourceDescription.tsx`, `getMMSourceDescriptionStateFromInput` recevait un objet sans `id`. Côté serveur lors de la soumission de révision (`/api/review/[reviewId]/submit`), `normalizeFeedFormStateForPersistence` générait un nouvel UUID aléatoire pour la source. La comparaison de l'audit (`composeAuditEntries`) entre la `baseline` (avec l'ancien ID) et le `normalizedState` (avec le nouvel ID) concluait à la suppression de l'ancienne source (`DELETE`) et à la création d'une nouvelle source (`CREATE`), entraînant la suppression et réinsertion en cascade de toutes les marques métronomiques associées.

### Scénario 16 : Réinitialisation du formulaire liée au clic de modale au lieu du succès API
* **Cause racine :** Dans `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`, la fonction `saveAll` déclenchait `setIsSaveSuccess(true)` après l'appel API `POST /api/feedForm`, mais déléguait le nettoyage (`onReset()`, qui purge le `localStorage` et réinitialise le reducer `feedForm`) au callback `handleModalClose`.
* **Conséquence :** Si l'utilisateur actualisait la page, naviguait via le menu ou fermait l'onglet sans cliquer explicitement sur le bouton de fermeture de la modale, le formulaire `/feed` conservait l'intégralité du brouillon précédent réhydraté à la session suivante.

---

## 4. Feuille de route par lot (Roadmap pour Gemini 3.7 Flash)

```
┌─────────────────────────────────────────────────────────────────┐
│ Lot R1 — Intégrité des identifiants & robustesse du diff modal  │
│ (Scénarios 5 & 9)                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Lot R2 — Préservation de la source & fiabilisation de l'audit   │
│ (Scénario 9)                                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Lot R3 — Cycle de vie & fiabilisation de la modale de succès   │
│ (Scénario 8)                                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Lot R4 — Purge automatique post-sauvegarde dans FeedForm       │
│ (Scénario 16)                                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Lot R5 — Validation globale, non-régression & linting           │
└─────────────────────────────────────────────────────────────────┘
```

---

### Lot R1 — Intégrité des identifiants (UUID) des entités et robustesse du diff

**Objectif :** Garantir que toute entité manipulée dans le formulaire (sources, contributions) conserve ou reçoive un identifiant unique stable, et sécuriser le calcul de diff contre les entités sans identifiant.

**Fichiers concernés :**
- `features/sourceDescription/SourceDescriptionEditForm.tsx`
- `features/sourceContribution/SourceContributionSelectForm.tsx`
- `features/feed/multiStepMMSourceForm/stepForms/MMSourceContributions.tsx`
- `features/review/reviewDiffFieldsSchema.ts`
- `features/review/reviewDiff.ts`

**Tâches à réaliser :**
1. **Source Description ID :**
   - Dans `features/sourceDescription/SourceDescriptionEditForm.tsx`, ajouter `id: z.string().optional()` au schéma `SourceSchema`.
   - Dans `DEFAULT_VALUES`, s'assurer que `id` est initialisé ou transmis depuis `sourceDescription`.
   - Dans `submitForm`, propager `id: data.id ?? sourceDescription?.id` dans le payload de soumission.
2. **Contributions UUID :**
   - Dans `features/sourceContribution/SourceContributionSelectForm.tsx`, lors de l'ajout d'une contribution (`onAddPersonContribution` et `onAddOrganizationContribution`), attribuer systématiquement un nouvel identifiant `id: getNewUuid()` à l'objet contribution créé.
   - Dans `features/feed/multiStepMMSourceForm/stepForms/MMSourceContributions.tsx`, vérifier que les contributions existantes ou nouvellement sélectionnées conservent toujours leur identifiant `id`.
3. **Sécurisation défensive du moteur de diff :**
   - Dans `features/review/reviewDiffFieldsSchema.ts` (`buildFieldPath`), si `entityId` est manquant pour une entité non-singleton, logger un avertissement `[reviewDiffFieldsSchema]` et utiliser un fallback prévisible (ex. index de tableau ou identifiant temporaire) plutôt que de lever une exception fatale.
   - Dans `features/review/reviewDiff.ts` (`diffEntityArray`), s'assurer qu'un nœud sans identifiant ne bloque pas le calcul du diff global.

**Validation du Lot R1 :**
- Exécuter les tests : `npx jest __tests__/features/review/reviewDiff.test.ts --ci`
- Vérifier que l'ajout d'une contribution dans le formulaire de révision ne lève plus d'exception et apparaît clairement dans `computeChangedFieldPaths`.

---

### Lot R2 — Préservation de l'identifiant source & fiabilisation de l'audit log

**Objectif :** Empêcher la régénération intempestive de l'ID de la source lors de la normalisation et garantir un calcul d'audit log strict champ par champ sans opérations `DELETE`/`CREATE` erronées.

**Fichiers concernés :**
- `features/feed/multiStepMMSourceForm/stepForms/MMSourceDescription.tsx`
- `utils/server/normalizeFeedFormStateForPersistence.ts`
- `features/review/utils/auditCompose.ts`
- `app/api/review/[reviewId]/submit/route.ts`

**Tâches à réaliser :**
1. **Préservation dans l'étape `MMSourceDescription` :**
   - Dans `features/feed/multiStepMMSourceForm/stepForms/MMSourceDescription.tsx`, conserver l'`id` et l'état `isNew` (ne pas forcer `isNew = true` si la source existe déjà dans l'état ou provient de la baseline).
2. **Normalisation côté serveur :**
   - Dans `utils/server/normalizeFeedFormStateForPersistence.ts`, s'assurer que si `mMSourceDescription.id` est fourni (notamment en mode révision), celui-ci est conservé scrupuleusement sans appel à `generateIdWithWarning("MMSource")`.
3. **Appariement d'audit :**
   - Dans `features/review/utils/auditCompose.ts`, s'assurer que la source (singleton) est correctement appariée entre la `baseline` et le `normalizedState` même en cas de variation mineure de structure, de sorte que seules les modifications effectives de champs (`UPDATE` sur `title`, `year`, `type`, etc.) soient générées, sans toucher aux marques métronomiques inchangées.

**Validation du Lot R2 :**
- Exécuter les tests : `npx jest __tests__/review/auditCompose.test.ts --ci`
- Vérifier qu'une modification du titre ou de l'année d'une source ne produit qu'une entrée d'audit `UPDATE` ciblée sur la source et 0 modification sur les marques métronomiques.

---

### Lot R3 — Cycle de vie & fiabilisation de la modale de confirmation

**Objectif :** Éliminer le clignotement d'erreur lors de la fermeture de la modale de confirmation de révision et sécuriser les transitions d'état.

**Fichiers concernés :**
- `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`
- `ui/modal/InfoModal.tsx`

**Tâches à réaliser :**
1. **Refonte de l'état de soumission dans `FeedSummary.tsx` :**
   - Remplacer le booléen ambigu `isSaveSuccess` (`boolean | undefined`) par un statut d'état explicite ou un objet d'état dédié :
     ```typescript
     type SubmitStatus = "idle" | "submitting" | "success" | "error";
     ```
   - Maintenir le statut `"success"` actif tant que la modale est visible et pendant la redirection vers `URL_REVIEW_LIST`.
2. **Correction des conditions de rendu :**
   - Dans `FeedSummary.tsx`, s'assurer que le composant `InfoModal` ne reçoit la prop `type="error"` que si une véritable erreur est survenue (`submitStatus === "error"`).
   - Sécuriser `getModalDescription()` pour ne retourner le message d'erreur que lorsque le statut est explicitement en échec.
3. **Fermeture et navigation :**
   - Dans `handleModalClose()`, déclencher la redirection immédiate vers `URL_REVIEW_LIST` en mode révision sans réinitialiser prématurément le type de modale vers `"error"`.

**Validation du Lot R3 :**
- Exécuter les tests de composants liés à `FeedSummary` : `npx jest __tests__/features/feed/FeedSummary.test.tsx --ci` (ou suite équivalente).
- Vérifier manuellement ou via test que la fermeture de la modale de succès ne provoque aucun affichage intempestif de texte ou style d'erreur.

---

### Lot R4 — Purge automatique et réinitialisation post-création dans `/feed`

**Objectif :** Garantir la réinitialisation instantanée et complète du formulaire `/feed` et de son stockage local dès la confirmation serveur de la création, sans dépendre du clic de l'utilisateur.

**Fichiers concernés :**
- `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx`
- `features/feed/ResetAllForms.tsx`
- `context/feedFormContext.tsx`
- `utils/localStorage.ts`

**Tâches à réaliser :**
1. **Purge immédiate lors du succès serveur :**
   - Dans `features/feed/multiStepMMSourceForm/stepForms/FeedSummary.tsx` (`saveAll`) : dès que la réponse `POST /api/feedForm` renvoie un statut de succès (avant même l'interaction utilisateur sur la modale), déclencher la purge de toutes les clés de brouillon dans `localStorage` (`FEED_FORM_LOCAL_STORAGE_KEY`, `SINGLE_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY`, `COLLECTION_PIECE_VERSION_FORM_LOCAL_STORAGE_KEY`).
2. **Réinitialisation du réducteur d'état :**
   - Conserver l'affichage de la modale d'information de succès tout en marquant l'état interne comme sauvegardé et réinitialisé (`initFeedForm(dispatch)`).
3. **Résilience de l'envoi d'email de log :**
   - S'assurer que l'appel d'envoi d'email (`/api/sendEmail`) est exécuté de manière non-bloquante ou isolée dans un bloc `try/catch` afin qu'un échec réseau d'email n'entrave jamais la validation de la création ni la purge du formulaire.

**Validation du Lot R4 :**
- Vérifier que suite à une création réussie, si l'utilisateur quitte la page ou rafraîchit son navigateur, le formulaire `/feed` s'ouvre sur un état vierge à l'étape 1.

---

### Lot R5 — Recette globale, non-régression et contrôle qualité

**Objectif :** Valider l'ensemble des corrections sur la suite complète de tests du projet et s'assurer de l'absence de régression.

**Fichiers concernés :**
- Ensemble du dépôt.

**Tâches à réaliser :**
1. **Exécution du linter :**
   - Lancer `npx eslint .` et corriger tout avertissement ou erreur de linting.
2. **Exécution de la suite de tests automatisés :**
   - Lancer `npm run test:ci` et vérifier que 100% des tests unitaires et d'intégration passent.
3. **Checklist de validation finale de la recette :**
   - [ ] **Scénario 5 :** Ajout d'une contribution en révision → Clic sur "View Changes" → La contribution apparaît dans le diff sans erreur console.
   - [ ] **Scénario 8 :** Approbation d'une révision → Affichage de la modale de succès → Clic sur "Close" → Redirection fluide vers la liste des révisions sans flash d'erreur.
   - [ ] **Scénario 9 :** Modification d'un champ descriptif de la source → Soumission → Consultation de l'AuditLog → Seuls les champs modifiés sont répertoriés en `UPDATE`.
   - [ ] **Scénario 16 :** Création d'une nouvelle MM Source via `/feed` → Succès → Navigation vers une autre page puis retour sur `/feed` → Le formulaire est réinitialisé et prêt pour une nouvelle saisie.

---

## 5. Matrice de dépendances et ordre d'exécution

```
Lot R1 (Identifiants & diff) ───► Lot R2 (Audit & normalisation)
                                          │
Lot R3 (Modale & UX FeedSummary) ◄────────┘
           │
           ▼
Lot R4 (Purge automatique post-save)
           │
           ▼
Lot R5 (Recette globale & tests CI)
```

Chaque lot est conçu pour être pris en charge indépendamment par un agent IA (Gemini 3.7 Flash) avec son propre périmètre de fichiers, ses tâches détaillées et ses critères d'acceptation précis.
