# Cadrage — Auto-édition d'une MM Source par son auteur (Self-Source-Edit)

**Date :** 2026-08-10  
**Statut :** Décisions actées, prêtes pour implémentation.  
**Portée :** Ce document fixe *ce qui doit être vrai* à l'issue de l'implémentation de la fonctionnalité `self-source-edit`. Le découpage opérationnel et l'ordonnancement des tâches sont consignés dans `20260810_feuille-de-route_self-source-edit.md`.

---

## 1. Contexte & Objectifs

La Metronome Mark Database (MMDB) permet aux chercheurs et musiciens de cataloguer des éditions musicales et leurs indications métronomiques.
Jusqu'à présent, une fois une source soumise via le formulaire de saisie (`/feed`), son auteur ne pouvait plus la modifier, même si aucune revue n'avait encore commencé. Les reviewers bénéficient quant à eux d'un environnement de revue in situ au sein du formulaire Feed (`/review/[reviewId]`).

La fonctionnalité **Self-Source-Edit** ouvre cette capacité aux auteurs pour leurs propres sources. Elle permet à tout utilisateur authentifié de :
1. Consulter son **Dashboard** personnel (`/dashboard`) listant l'ensemble des sources qu'il a créées avec leurs métriques et statuts de revue.
2. Inspecter les détails d'une source directement dans une modale réutilisant le composant d'exploration `MMSourceSummary`.
3. Ré-ouvrir et éditer n'importe laquelle de ses sources dans le formulaire complet `FeedForm` sous un mode de session dédié (`self-source-edit`), à condition que la source soit toujours `PENDING` et qu'aucune revue ne soit en cours.
4. Modifier n'importe quel élément de la source (métadonnées, références, contributions, pièces, mouvements, sections, indications de tempo, marques métronomiques) avec un brouillon local isolé.
5. Sauvegarder les modifications en base de données avec une vérification atomique de concurrence empêchant d'écraser le travail si un reviewer a démarré une revue pendant la session d'édition.
6. Accéder de manière ergonomique à son espace via un menu déroulant de profil utilisateur dans la barre de navigation, épurant au passage les liens redondants de la page d'accueil.

---

## 2. Périmètre

### 2.1 Dans le périmètre
- **Navigation & En-tête (`ui/NavBar.tsx`)** :
  - Remplacement du bouton statique « Sign out » par un menu déroulant de profil en haut à droite.
  - Le déclencheur affiche une icône utilisateur et le nom de l'utilisateur (ou une invitation à se connecter s'il est anonyme).
  - Au survol ou clic, le menu propose : « Dashboard » (`/dashboard`), « Admin » (`/admin`, visible uniquement pour le rôle `ADMIN`) et « Sign Out ».
  - Suppression du bouton d'administration autonome (`<AdminLink />`) au centre de la page d'accueil (`app/(public)/page.tsx`).
- **Espace utilisateur / Dashboard (`app/(signedIn)/dashboard/page.tsx`)** :
  - Nouvelle route protégée sous `app/(signedIn)/dashboard/` accessible à tout utilisateur connecté (`USER`, `EDITOR`, `REVIEWER`, `ADMIN`).
  - Vue « My MM Sources » listant les sources où `creatorId === session.user.id`.
  - Métriques affichées : nombre de pièces, nombre de sections, nombre de marques métronomiques, date de création, badge de statut de revue (`PENDING`, `IN_REVIEW`, `APPROVED`, `ABORTED`).
  - Action « View Details » ouvrant une modale avec le résumé de la source (`MMSourceSummary`).
  - Action « Edit Source » active uniquement si `reviewState === 'PENDING'` et aucune revue active ; ouverture d'une modale de confirmation avant redirection vers l'éditeur.
- **Route & Session Self-Source-Edit (`app/(signedIn)/dashboard/edit/[sourceId]/`)** :
  - Layout serveur vérifiant l'appartenance (`creatorId === session.user.id`), l'état `reviewState === 'PENDING'` et l'absence de revue active.
  - Extraction de la baseline serveur transformant le graphe MM Source en `FeedFormState`.
  - Mode de session dédié `self-source-edit` dans `FormSessionProvider`.
  - Clés `localStorage` isolées par source : `GET_SELF_EDIT_STORAGE_KEYS(sourceId)`.
  - Bandeau supérieur dédié (`SelfEditSessionBanner`) avec rappel du nom de la source, avertissement et bouton « Cancel & Return to Dashboard ».
- **Expérience Formulaire Feed** :
  - Étape Intro adaptée avec explications sur l'auto-édition et bouton de démarrage.
  - Étape Summary adaptée avec bouton « Save Modifications », modale de confirmation finale et soumission.
  - Capacité d'ajouter, modifier ou supprimer pièces, collections, mouvements, sections et marques de tempo.
- **Persistance & Garde de Concurrence (`POST /api/source/[sourceId]/edit`)** :
  - Vérification de l'authentification et de la propriété de la source.
  - Contrôle atomique de concurrence : vérification en transaction que `reviewState === 'PENDING'` et qu'aucune revue n'a le statut `IN_REVIEW`. En cas de conflit, rejet immédiat avec HTTP 409 et message d'explication.
  - Protection des versions de pièces partagées via `forkModifiedSharedPieceVersions`.
  - Mise à jour transactionnelle de l'entité source et de ses enfants, en maintenant `reviewState = 'PENDING'`.
  - Re-calcul des données dérivées (`computeMMSourceDerivedData`).
  - Purge des brouillons locaux (`purgeSelfEditLocalDrafts`) et redirection vers `/dashboard`.
- **Langue de l'interface** :
  - Respect strict de l'anglais pour l'ensemble des textes d'interface (UI, boutons, modales, infobulles, alertes, messages d'erreur).

### 2.2 Hors périmètre
- Édition de sources créées par d'autres utilisateurs (réservé aux reviewers/admins dans `/review/[reviewId]`).
- Édition de sources dont le statut est déjà `APPROVED` ou `ABORTED`.
- Verrouillage pessimiste bloquant un reviewer de démarrer une revue pendant qu'un auteur édite (choix d'architecture : verrouillage optimiste avec rejet 409 à la sauvegarde).
- Écriture d'entrées dans la table `AuditLog` (réservée au processus d'approbation éditoriale / revue).

---

## 3. Décisions d'Architecture

### 3.1 Verrouillage optimiste vs Verrouillage pessimiste
- **Problème :** Que faire si un reviewer démarre une revue pendant qu'un auteur est en train de modifier sa source ?
- **Décision :** Aucun verrou préemptif n'est posé à l'ouverture de la session d'édition. En revanche, au moment de l'enregistrement final (« Save Modifications »), l'API vérifie atomiquement au sein d'une transaction que la source est toujours en `reviewState === 'PENDING'` et qu'aucune ligne `Review` en état `IN_REVIEW` n'a été créée pour cette source.
- **Justification :** Les reviewers sont des éditeurs privilégiés. Poser un verrou bloquant à la simple ouverture d'un formulaire risquerait d'immobiliser des sources indéfiniment si l'auteur ferme son onglet. L'exclusion optimiste au moment de la persistance garantit l'intégrité sans créer de verrous fantômes. En cas de conflit, l'auteur reçoit un HTTP 409 et une explication claire.

### 3.2 Emplacement de la route d'édition
- **Décision :** La route d'édition se situe sous `app/(signedIn)/dashboard/edit/[sourceId]/`.
- **Justification :** Cette route relève de l'espace personnel de l'auteur. Elle est ainsi clairement dissociée de la création publique (`/feed`) et de la revue éditoriale (`/review/[reviewId]`).

### 3.3 Factorisation du chargeur de baseline (`getSourceFeedFormBaseline`)
- **Décision :** Extraire la fonction de conversion DB → `FeedFormState` depuis `utils/server/getReviewBaseline.ts` vers un helper partagé `utils/server/getSourceFeedFormBaseline.ts`.
- **Justification :** Évite la duplication de plus de 400 lignes de mapping complexe d'entités musicales tout en garantissant une cohérence parfaite de l'état initial entre review et self-edit.

### 3.4 Protection des PieceVersions partagées
- **Décision :** Réutiliser `forkModifiedSharedPieceVersions` lors de la persistance d'une auto-édition.
- **Justification :** Si une `PieceVersion` modifiée est partagée avec d'autres sources déjà présentes en base, sa modification sur place corromprait les autres sources. Le clonage (fork) isole la version pour la source éditée.

### 3.5 Absence d'AuditLog pour le Self-Edit
- **Décision :** Ne pas générer de lignes `AuditLog` lors du self-edit.
- **Justification :** Le modèle `AuditLog` de Prisma est obligatoirement lié à une `reviewId` et a pour finalité de tracer les corrections apportées par le comité éditorial. L'auto-édition est une correction par l'auteur avant revue ; la source reste simplement en attente (`PENDING`).

---

## 4. Modèle de Données & Contrats

### 4.1 Extension Zod (`types/zodTypes.ts`)
```ts
export const SelfEditSessionMetaSchema = z.object({
  mMSourceId: z.string(),
  authorId: z.string(),
});
export type SelfEditSessionMeta = z.infer<typeof SelfEditSessionMetaSchema>;

export const FormSessionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("data-entering") }),
  z.object({
    mode: z.literal("self-source-edit"),
    selfEdit: SelfEditSessionMetaSchema,
  }),
  z.object({
    mode: z.literal("review"),
    review: ReviewSessionMetaSchema,
    globallyReviewed: GloballyReviewedIdsSchema,
  }),
]);
```

### 4.2 Clés de Stockage Local (`utils/constants.ts` & `utils/localStorage.ts`)
```ts
export const SELF_EDIT_LOCAL_STORAGE_PREFIX = "selfEdit";
export const GET_SELF_EDIT_STORAGE_KEYS = (mMSourceId: string) => ({
  session: `selfEdit:${mMSourceId}:session`,
  feedForm: `selfEdit:${mMSourceId}:feedForm`,
  singlePieceVersionForm: `selfEdit:${mMSourceId}:singlePieceVersionForm`,
  collectionPieceVersionForm: `selfEdit:${mMSourceId}:collectionPieceVersionForm`,
});

export function purgeSelfEditLocalDrafts(mMSourceId: string): void {
  const keys = GET_SELF_EDIT_STORAGE_KEYS(mMSourceId);
  localStorageRemoveItems([
    keys.session,
    keys.feedForm,
    keys.singlePieceVersionForm,
    keys.collectionPieceVersionForm,
  ]);
}
```

### 4.3 Contrat de l'API de Soumission (`POST /api/source/[sourceId]/edit`)
- **Corps de requête :**
  ```json
  {
    "feedFormState": { ... }
  }
  ```
- **Réponses :**
  - `200 OK` : `{ "success": true, "mMSourceId": "..." }`
  - `401 Unauthorized` : Utilisateur non authentifié.
  - `403 Forbidden` : L'utilisateur n'est pas le créateur de la source (`creatorId !== session.user.id`).
  - `409 Conflict` : `{ "error": "A review has started on this MM Source. Modifications are blocked." }`
  - `400 Bad Request` : État de formulaire invalide ou non persistable.

---

## 5. Règle Linguistique
- **Code et Interface :** Tous les identifiants, types, commentaires de code, tests, libellés de l'interface utilisateur, boutons, messages d'information et d'erreur sont rédigés en **anglais**.
- **Documentation et Spécifications :** Les documents de cadrage et feuilles de route dans `specs/` sont rédigés en **français**.
