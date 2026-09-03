# Cadrage — revue d’une MM Source dans le formulaire Feed

**Statut :** décisions fonctionnelles et architecturales validées.  
**But :** remplacer entièrement l’interface de checklist de revue par le formulaire Feed prérempli. Ce document fixe le périmètre et les contrats à respecter ; ce n’est pas une feuille de route d’implémentation.

## 1. Décision centrale

Une revue est désormais une session d’utilisation du formulaire Feed sur une MM Source existante.

- La liste `/review` est conservée, ainsi que sa confirmation de démarrage.
- Le démarrage conserve le verrou transactionnel actuel : création de `Review` en `IN_REVIEW` et passage de `MMSource.reviewState` à `IN_REVIEW`.
- La route active devient `/review/[reviewId]`.
- Cette page reprend l’interface du formulaire `/feed` : étapes, sous-formulaires, aide et récapitulatif. Les données de la source sont préremplies.
- Les modifications restent locales jusqu’à l’approbation finale ; aucune écriture métier intermédiaire n’est autorisée.
- Le bouton final ne crée pas une MM Source : il enregistre et approuve la revue de la MM Source concernée.

La checklist de vérification par champ disparaît complètement. Il n’y a plus de cases à cocher, de tranches (source/collection/pièce), de retour vers une checklist, ni de validation serveur de ces cases.

## 2. Condition d’approbation et progression

L’approbation devient possible lorsque toutes les étapes de saisie du formulaire Feed sont valides selon leurs règles existantes. Elle nécessite ensuite une confirmation explicite dans une modale.

La progression de revue doit rester légère : elle réutilise seulement l’état de complétude des étapes Feed déjà calculé par `stepsUtils.ts`. Elle ne maintient aucun état supplémentaire par champ, entité, section ou marque métronomique.

La zone de contexte de revue peut donc afficher, par exemple, « 3 étapes de saisie validées sur 4 », puis « Prêt à approuver ». Le récapitulatif final fait partie du flux de navigation mais n’est pas une unité de vérification métier supplémentaire.

## 3. Nouvelle interface de revue

### Route et autorisation

`app/(signedIn)/review/[reviewId]/page.tsx` et son layout remplacent la route `/review/[reviewId]/checklist`.

Le layout doit, côté serveur :

- exiger une session avec le rôle `REVIEWER` ou `ADMIN` ;
- charger la revue et exiger l’état `IN_REVIEW` ;
- exiger que l’utilisateur connecté soit le créateur de la revue ;
- charger les données de la MM Source et les données d’état globalement revues nécessaires au formulaire.

La nouvelle interface est réservée au reviewer propriétaire. Un administrateur ne peut ni ouvrir cette interface pour travailler sur la revue d’un autre utilisateur, ni la soumettre à sa place.

Le tableau d’administration conserve son rôle de consultation des revues et des audit logs. Une action explicite d’administration (abandon ou réattribution d’une revue active) est hors périmètre et sera conçue plus tard ; elle ne doit pas être exposée implicitement par la nouvelle page de revue.

### Habillage de contexte

Le formulaire est entouré d’un wrapper de session de revue, intégré à l’habillage Feed. Il doit indiquer clairement :

- qu’une revue est en cours ;
- la progression légère par étapes ;
- l’état de la revue et l’identité ou le titre utile de la source ;
- un accès permanent au commentaire général de revue ;
- l’action d’abandon.

Le commentaire général (`Review.overallComment`) est éditable pendant toute la session, par exemple dans une modale ouverte depuis cette zone. Il est enregistré dans le brouillon local au même titre que le formulaire et n’est écrit en base qu’à l’approbation.

Les personnes, organisations, collections, pièces et versions déjà revues restent modifiables. Le formulaire doit simplement les signaler visuellement comme déjà revues ; ce signal est informatif et ne verrouille aucun champ.

## 4. Contexte générique d’usage du formulaire

Le formulaire Feed doit être structuré autour d’un contexte générique de session, afin de servir sans nouveau branchement majeur les trois usages suivants :

| Mode | Objet | Persistance finale |
| --- | --- | --- |
| `data-entering` | Nouvelle MM Source | Création via `/api/feedForm` |
| `self-source-edit` | Édition future par l’auteur d’une source avant sa revue | Mise à jour dédiée, à définir dans l’étape future |
| `review` | Revue d’une MM Source verrouillée | Approbation via `/api/review/[reviewId]/submit` |

Cette évolution implémente seulement `data-entering` (sans régression) et `review`. `self-source-edit` est un contrat d’architecture, pas une fonctionnalité à livrer maintenant.

Le contexte de session doit contenir les métadonnées qui ne sont pas des données de formulaire : au minimum le mode, l’identifiant de revue dans le mode `review`, l’état de progression dérivable, les identifiants globalement revus et le commentaire général. Le mode choisi pilote l’habillage, les clés de brouillon et le traitement final ; il ne doit pas être déduit de l’URL ou d’un drapeau éphémère dans un ancien bridge.

## 5. Brouillons et hydratation

### Isolation du stockage local

Le brouillon normal de `/feed` reste séparé et intact. Une revue utilise un espace `localStorage` dédié, nommé à partir de son `reviewId`, avec au moins :

- l’état `FeedFormState` de la revue ;
- les éventuels états des sous-formulaires collection et pièce unique ;
- les métadonnées de session, dont le commentaire général.

Toutes ces données sont enveloppées par les helpers versionnés existants de `../utils/localStorage.ts`. Toute modification de leur forme impose une hausse de `LOCAL_STORAGE_SCHEMA_VERSION`.

À l’ouverture d’une revue, un brouillon local valide est prioritaire. En son absence, la page initialise l’état depuis la MM Source chargée côté serveur. Ainsi, un rechargement ou une nouvelle session dans le même navigateur reprend la revue sans toucher au brouillon de saisie normale.

L’ancien mécanisme `FEED_FORM_BOOT_KEY` n’est pas retenu : il répondait à une navigation checklist → Feed → checklist, qui n’existe plus. Il ne doit pas subsister comme canal de transfert de l’état de revue.

### Chargement des données

Un adaptateur explicite doit construire le `FeedFormState` initial à partir du graphe persistant de la source : description, références, contributions, contenus ordonnés, personnes, organisations, collections, pièces, versions, mouvements, sections, indications de tempo et marques métronomiques. Il préserve les identifiants stables et les rangs.

Il ne s’agit pas de conserver le bridge historique : aucun aller-retour entre deux interfaces et aucun état de travail parallèle ne doit exister. Le formulaire est l’unique source de vérité cliente pendant la revue.

## 6. Abandon

L’abandon reste disponible à tout moment depuis la zone de contexte :

1. une modale avertit que les modifications locales et le commentaire non soumis seront perdus ;
2. l’API d’abandon conserve sa transaction de passage de `Review` et `MMSource` à `ABORTED` ;
3. après succès, tous les brouillons locaux associés à cette revue sont supprimés ;
4. l’utilisateur revient à la liste des MM Sources à revoir.

L’abandon ne persiste aucune modification de données métier ni audit log de modifications locales.

## 7. Soumission de revue, audit et persistance

Le traitement final reste distinct de `/api/feedForm`, qui continue de créer de nouvelles sources. Le résumé en mode `review` appelle exclusivement `/api/review/[reviewId]/submit` avec l’état actuel du formulaire et le commentaire général.

La route de soumission doit :

- authentifier le reviewer propriétaire et exiger `IN_REVIEW` ;
- vérifier côté serveur que l’état Feed est complet et structurellement persistant pour une revue, sans réutiliser le garde de création qui interdit actuellement `reviewContext` ;
- recharger la baseline depuis la base de données ;
- normaliser l’état Feed reçu vers le modèle de données utilisé pour comparer et persister, en préservant les IDs ;
- calculer côté serveur les différences entre baseline et état final ;
- composer les `AuditLog` avec les snapshots `before`/`after` et les opérations `CREATE`, `UPDATE` ou `DELETE` ;
- appliquer les mutations dans une unique transaction, dans l’ordre qui respecte les dépendances ;
- recalculer et enregistrer les données dérivées de la source, notamment `sectionCount`, si la structure a changé ;
- créer les `ReviewedEntity` nécessaires pour les personnes, organisations, collections, pièces et versions présentes dans le périmètre ; les marqueurs déjà existants restent valides et ne doivent pas être réattribués ;
- enregistrer `overallComment`, passer `Review.state` et `MMSource.reviewState` à `APPROVED`, puis terminer la session locale seulement après le succès de la transaction.

Les helpers de diff et d’audit restent nécessaires, mais ils ne doivent plus dépendre conceptuellement d’une checklist ni produire une exigence de validation par champ. Le vocabulaire, les types et les tests associés doivent être refactorés vers un snapshot de revue et un diff d’audit.

Après approbation réussie, les brouillons de revue sont supprimés et l’utilisateur revient à la liste des revues.

## 8. Éléments supprimés et éléments conservés

Sont supprimés, sans redirection de compatibilité puisque l’interface n’est pas en production :

- `app/(signedIn)/review/[reviewId]/checklist/` ;
- les composants de checklist, ses slices et sa navigation ;
- `ReviewWorkingCopyContext` et son provider ;
- le bridge checklist/Feed (`reviewEditBridge`), ses clés de retour et `FEED_FORM_BOOT_KEY` ;
- `ReviewEditBanner`, le bouton « Back to review » et le focus par ancres ;
- l’expansion, la persistance et la validation des items de checklist ;
- les tests exclusivement consacrés à ce parcours supprimé.

Sont conservés ou refactorés :

- la liste des sources à revoir, le démarrage et le verrou de revue ;
- le chargement sécurisé de la source et des marqueurs `ReviewedEntity` ;
- l’API d’abandon ;
- la transaction de soumission, ses règles de persistance et l’`AuditLog` ;
- l’affichage administratif des audit logs ;
- le formulaire Feed, ses étapes et ses sous-formulaires, utilisés sans altérer l’usage de saisie initiale.

## 9. Invariants à préserver

- Une seule revue `IN_REVIEW` peut exister par MM Source.
- Le reviewer ne peut pas réviser une source qu’il a créée.
- Un reviewer ne peut avoir qu’une session active à la fois et est redirigé vers elle depuis la liste.
- La source reste inchangée en base jusqu’à l’approbation ; annuler est sans effet sur les données métier.
- Toute modification approuvée est auditée dans la même transaction que sa persistance.
- Les données de revue locales ne contaminent jamais les clés et le comportement de saisie initiale.
- Les règles d’autorisation sont contrôlées côté serveur ; la page cliente et le brouillon local ne sont jamais des preuves d’autorisation ou de validité.

