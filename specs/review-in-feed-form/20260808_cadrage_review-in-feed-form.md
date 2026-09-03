# Cadrage — Review d'une MM Source dans le formulaire Feed

**Date :** 2026-08-08
**Statut :** décisions actées, prêtes pour implémentation.
**Portée :** ce document fixe *ce qui doit être vrai* à la fin du refactoring. Le *comment* et le
découpage des travaux sont dans `20260808_feuille-de-route_review-in-feed-form.md`.

## Documents remplacés

Ce cadrage est la synthèse arbitrée de quatre documents antérieurs, qu'il **remplace intégralement**.
Ils restent consultables comme trace de la réflexion, mais ne font plus autorité :

- `specs/20260804_review-in-feed-form_GPT-5.6.md` (discussion)
- `specs/20260804_review-in-feed-form_Claude-Sonnet-5.md` (discussion)
- `specs/20260805_cadrage-review-dans-feed-form_GPT-5.6.md`
- `specs/20260805_review-in-feed-form_decisions_Claude-Sonnet-5.md`
- `specs/20260806_review-in-feed_synthese.md` (comparaison des deux précédents)

En cas de contradiction entre l'un de ces documents et le présent cadrage, **le présent cadrage
prévaut**.

---

## 1. Décision centrale

**Une revue devient une session d'utilisation du formulaire Feed sur une MM Source existante.**

L'interface de checklist par champ (`/review/[reviewId]/checklist`) disparaît totalement, ainsi que
le pont aller-retour checklist ⇄ formulaire. Le reviewer travaille dans le formulaire de saisie
lui-même, prérempli avec les données de la source verrouillée. Le bouton final n'enregistre pas une
nouvelle MM Source : il approuve la revue.

### Pourquoi

1. **Un seul modèle de données côté client.** Aujourd'hui la revue manipule un `ChecklistGraph`, la
   saisie un `FeedFormState`, et un bridge convertit dans les deux sens à chaque édition. Deux
   modèles à maintenir en parallèle pour représenter la même chose, et un bridge qui doit être mis à
   jour à chaque évolution de forme. Après refactoring, `FeedFormState` est le seul contrat.
2. **Un seul jeu de règles de validation.** Les règles métier de complétude sont déjà exprimées dans
   les prédicats `isComplete` des étapes Feed. La checklist en redéfinissait un second jeu, champ par
   champ, qui pouvait diverger.
3. **Le reviewer voit ce que l'éditeur a vu.** La revue s'effectue dans l'interface qui a produit la
   donnée, avec les mêmes contrôles de saisie, les mêmes aides contextuelles et les mêmes sous-formulaires.
4. **Le mode `self-source-edit` devient quasi gratuit.** L'édition d'une source par son auteur avant
   revue réutilisera exactement la même mécanique, avec un traitement final différent.

### Ce que la décision coûte

Le suivi champ par champ disparaît : on ne saura plus quels champs le reviewer a *regardés*, seulement
lesquels il a *modifiés* (via l'`AuditLog`). C'est un choix assumé — la valeur du suivi de lecture ne
justifiait pas le coût de maintenance de la checklist.

---

## 2. Périmètre

### Dans le périmètre

- Nouvelle page `/review/[reviewId]` (+ layout) portant le formulaire Feed prérempli.
- Suppression complète de la checklist, du bridge et de leurs dépendances.
- Introduction d'un contexte générique de session de formulaire (`mode`).
- Isolation du brouillon de revue par `reviewId`, séparée du brouillon `/feed`.
- Réécriture du moteur de diff/audit sur `FeedFormState`.
- Réécriture de la route de soumission de revue (baseline serveur, normalisation, fork, transaction).
- Bouton dans le bandeau supérieur et modale de visualisation des modifications (`ReviewDiffModal`) accessibles à tout moment en cours de revue.
- Notification par toast d'avertissement en cas d'invalidation ou de purge de données locales (`localStorage`) suite à un changement de version, corruption ou incohérence de session.
- Langue de l'interface : respect strict de la langue anglaise pour l'intégralité des textes affichés (UI, boutons, modales, toasts, libellés, alertes).
- Correction des défauts latents listés en §12.
- Renommage systématique du vocabulaire de checklist.

### Hors périmètre

- Le mode `self-source-edit` : le contrat d'architecture l'accueille, aucune route ni UI n'est créée.
- Toute action d'administration sur une revue active d'autrui (reprise, réattribution) : à concevoir
  plus tard, ne doit pas être exposée implicitement.
- La péremption automatique d'une revue abandonnée sans clic (le verrou `IN_REVIEW` reste indéfini).
- Le nettoyage des `PieceVersion` devenues orphelines (voir §7.6).
- L'évolution du contenu rédactionnel de l'étape Intro en mode revue : la mécanique est prévue,
  le texte définitif sera fourni ultérieurement.

---

## 3. Architecture cible

### 3.1 Trois modes, un formulaire

`FeedFormState` reste le contrat de données du formulaire. Ce qui relève du *contexte d'utilisation*
en sort et vit dans un contexte de session dédié.

| Mode | Objet | Persistance finale |
|---|---|---|
| `data-entering` | Nouvelle MM Source | `POST /api/feedForm` (création) |
| `self-source-edit` | Édition par l'auteur avant revue | *hors périmètre* |
| `review` | Revue d'une MM Source verrouillée | `POST /api/review/[reviewId]/submit` (approbation) |

Le mode est fourni par le layout de la route, **jamais déduit de l'URL ni d'un drapeau éphémère**.

### 3.2 Terminologie — trois choses distinctes

Les documents antérieurs employaient « enveloppe » pour deux notions différentes. La terminologie
suivante fait foi :

| Terme | Définition | Emplacement |
|---|---|---|
| **Enveloppe de version** | Le wrapper technique `{ version, payload }` appliqué à *toute* écriture localStorage, qui invalide les données lors d'un bump de `LOCAL_STORAGE_SCHEMA_VERSION`. L'invalidation n'est plus silencieuse : elle déclenche un toast d'avertissement (en anglais) à l'utilisateur via `ToastNotificationProvider`. | `utils/localStorage.ts` |
| **Métadonnées de session de revue** | `{ reviewId, reviewerId, mMSourceId, mode, overallComment, globallyReviewed }`. Un état React tenu par un provider **autour** de `FeedFormProvider`, synchronisé vers sa propre clé localStorage. | Nouveau `ReviewSessionProvider` |
| **Brouillon** | Le `FeedFormState` lui-même, plus les états des deux sous-wizards. | Clés localStorage dédiées |

**Règle générale :** `FeedFormState` ne contient que des données de formulaire. Aucune métadonnée de
revue n'y transite. Le champ `reviewContext` de `FeedFormInfo` **disparaît** (avec ses `anchors`, qui
n'ont plus d'objet sans deep-link depuis une checklist).

`formInfo` ne conserve que ce qui est réellement interne au formulaire : `currentStepRank`,
`introDone`, `allSourceOnPieceVersionsDone`, `isSourceOnPieceVersionformOpen`, `formType`.

### 3.3 Persistance locale

Quatre clés par revue, toutes préfixées par le `reviewId` :

```
review:<reviewId>:session                      → métadonnées de session (dont overallComment)
review:<reviewId>:feedForm                     → FeedFormState
review:<reviewId>:singlePieceVersionForm       → sous-wizard pièce unique
review:<reviewId>:collectionPieceVersionForm   → sous-wizard collection
```

Les clés de saisie normale (`feedForm`, `singlePieceVersionForm`, `collectionPieceVersionForm`)
restent **strictement inchangées et intactes**. Une session de revue ne les lit ni ne les écrit
jamais.

**Conséquence technique acceptée :** les trois reducers câblent aujourd'hui leur clé de stockage au
chargement du module (`withLocalStorage(reducer, CLÉ, initialState)`). Ils doivent devenir des
fabriques paramétrées, instanciées par le provider. C'est un chantier transverse assumé, pas une
découverte d'implémentation.

**Hydratation** — à l'ouverture de `/review/[reviewId]` :

1. Le layout (composant serveur) charge la revue, la source et les ids globalement revus, et
   construit le `FeedFormState` initial.
2. Si un brouillon local valide existe pour ce `reviewId`, il **remplace intégralement** l'état
   initial. Pas de fusion : une fusion profonde d'arrays par index produirait des états hybrides
   incohérents (voir §12.4).
3. Un brouillon est *valide* si son enregistrement de session porte le bon `reviewId` **et** le bon
   `reviewerId`. Sinon les quatre clés du préfixe sont purgées, l'état serveur s'applique et un
   toast d'avertissement en anglais est affiché à l'utilisateur.
4. `LOCAL_STORAGE_SCHEMA_VERSION` passe de 6 à 7 : la forme de `FeedFormInfo` change.

**Notification lors de l'invalidation locale.** L'effacement silencieux du stockage local est supprimé.
Dès lors que `utils/localStorage.ts` supprime un enregistrement (incompatibilité de version de schéma,
JSON invalide/corrompu) ou que la session locale est incohérente (mauvais `reviewId` ou `reviewerId`),
un signal (événement personnalisé `window.dispatchEvent("mmdb:storage-invalidated", { detail: { key, reason } })`
ou gestionnaire dans le Provider) déclenche l'affichage d'un toast d'avertissement (`ToastNotificationProvider` /
`toastNotificationAction.WARNING`) avec un message explicatif en anglais (ex. : *"Your previous local draft was reset due to an application update."*
ou *"Local draft reset: session does not match current user."*).

**Aucune péremption.** Sans abandon explicite, le verrou `IN_REVIEW` et le brouillon persistent
indéfiniment, et la revue reprend telle quelle au retour sur la page.

### 3.4 Étapes du formulaire

Le tableau `steps` de `stepsUtils.ts` **reste statique et identique dans les trois modes**. Aucune
fonction `getSteps(mode)`, aucun filtrage d'étape. `Steps.tsx`, `MMSourceForm.tsx`, `getStepByRank`
et `getLastCompletedStep` restent inchangés.

Deux composants d'étape seulement deviennent conscients du mode :

- **`Intro` (rang 0)** — l'étape d'introduction **est conservée et n'est pas sautée** en mode revue.
  `introDone` vaut `false` au démarrage d'une revue ; le reviewer valide l'introduction comme un
  éditeur. Le contenu affiché diffère selon le mode : consignes de revue au lieu du tutoriel de
  saisie initiale.
- **`FeedSummary` (rang 5)** — branche son action finale sur le mode : création via `/api/feedForm`,
  ou approbation via `/api/review/[reviewId]/submit`, avec libellé de bouton et message de
  confirmation adaptés.

**Prérremplissage des drapeaux de complétude.** `allSourceOnPieceVersionsDone` n'est pas dérivé des
données : il n'est posé que par le clic « Continuer » de l'étape 3. Il est donc positionné à `true`
dans l'état initial d'une revue dès lors que les données préremplies sont cohérentes. Objectif :
zéro friction — le reviewer ne re-valide jamais une étape qu'il n'a pas touchée.

`allSourceContributionsDone` existe dans le type mais n'est utilisé nulle part : à retirer du type.

### 3.5 Habillage de la session de revue

Un composant léger, monté dans le layout de revue, remplace `ReviewEditBanner`. Il affiche :

- l'indication qu'une revue est en cours et l'identification de la source ;
- un bouton ouvrant la modale de visualisation des différences en cours de revue (`ReviewDiffModal`), accessible à tout moment, calculant et affichant en temps réel les champs modifiés / ajoutés / supprimés par rapport à la baseline de départ via `computeChangedFieldPaths(baseline, state)` ;
- un bouton ouvrant le commentaire général (`overallComment`), éditable à tout moment ;
- un bouton « Abandonner la revue ».

**Pas d'affichage de progression.** Le décompte d'étapes proposé initialement est abandonné : il ne
faisait que redire ce que la colonne d'étapes affiche déjà.

---

## 4. Parcours et comportements actés

### 4.1 Démarrage

La liste `/review` et sa modale de confirmation sont conservées. `POST /api/review/start` conserve sa
transaction (`Review` en `IN_REVIEW`, `MMSource.reviewState` en `IN_REVIEW`) et gagne une garde :
**le reviewer ne peut pas démarrer une revue s'il en a déjà une `IN_REVIEW`**. Après succès,
redirection vers `/review/[reviewId]`.

### 4.2 Session

Le reviewer parcourt les cinq étapes du formulaire plus le récapitulatif. Toute modification reste
locale. Les sous-formulaires pièce unique et collection s'ouvrent depuis l'étape 3 par le mécanisme
existant de ré-ouverture d'une entrée déjà présente — aucune logique de seed spécifique à la revue.
À tout moment de la session, le reviewer peut ouvrir la modale de diff depuis le bandeau supérieur pour
consulter les écarts en cours par rapport à la baseline initiale.

### 4.3 Reprise

`/review` redirige automatiquement le reviewer vers sa revue `IN_REVIEW` active, s'il en a une. Le
retour sur `/review/[reviewId]` restaure le brouillon local.

### 4.4 Abandon

Modale de confirmation avertissant que les modifications locales et le commentaire seront perdus →
`POST /api/review/[reviewId]/abort` (transaction inchangée : `Review` et `MMSource` passent en
`ABORTED`) → purge des quatre clés locales de cette revue → retour à `/review`. La source redevient
disponible à la revue (`getToReviewFromDb` accepte déjà `ABORTED`).

Fermeture d'onglet sans abandon : rien ne se passe, le verrou et le brouillon subsistent.

### 4.5 Approbation

Condition : **les six étapes du formulaire sont valides** selon leurs prédicats `isComplete`
existants, introduction comprise. Le bouton final est désactivé sinon. Une confirmation explicite est
requise. Puis `POST /api/review/[reviewId]/submit` avec `{ feedFormState, overallComment }`.

**Le brouillon local n'est purgé qu'après succès confirmé de la transaction.** Pas de purge au clic,
pas de purge après erreur réseau, pas de purge après refus serveur.

---

## 5. Autorisations

Toutes les règles sont garanties **côté serveur**. La page cliente et le brouillon local ne sont
jamais une preuve d'autorisation ni de validité.

| Surface | Règle |
|---|---|
| `/review` (liste) | session + rôle `REVIEWER` ou `ADMIN` |
| `/review/[reviewId]` (page + layout) | session + rôle + revue existante + état `IN_REVIEW` + **`review.creatorId === session.user.id`** |
| `POST /api/review/start` | rôle + source non créée par le demandeur + aucune revue `IN_REVIEW` sur la source + **aucune revue `IN_REVIEW` du demandeur** |
| `POST /api/review/[reviewId]/submit` | rôle + propriétaire uniquement + état `IN_REVIEW` |
| `POST /api/review/[reviewId]/abort` | rôle + **propriétaire ou ADMIN** (inchangé) |
| Chargement de la baseline serveur | propriétaire uniquement (resserrement : c'était `propriétaire ou ADMIN`) |

**Justification du cas `abort`.** La nouvelle interface est réservée au reviewer propriétaire, mais
la capacité d'abandon reste ouverte à l'administrateur : c'est aujourd'hui le seul levier permettant
de déverrouiller une source dont le reviewer a disparu, et elle n'expose aucune donnée. Une action
d'administration explicite (abandon/réattribution depuis le tableau admin) reste à concevoir hors
périmètre.

**Justification du resserrement de la page.** Un administrateur ouvrant la revue d'autrui obtiendrait
un formulaire pleinement éditable écrivant dans son propre brouillon local — sans jamais pouvoir
soumettre (403). Le brouillon de l'autre reviewer vivant dans son navigateur, l'accès serveur seul
n'aurait aucun sens. L'administrateur conserve la liste des revues et les `AuditLog`.

---

## 6. Entités déjà revues et sémantique de `isNew`

La sémantique actuelle de `isNew` est **conservée sans modification**, et aucun champ distinct
(`alreadyReviewed`) n'est introduit — un second drapeau au comportement voisin risquerait d'entrer en
contradiction avec la logique création/sélection des sous-formulaires.

Au préremplissage d'une revue, pour `Person`, `Organization`, `Collection`, `Piece` et
`PieceVersion` :

```
isNew = ! (id ∈ ReviewedEntity du type correspondant)
```

- `isNew: true` (pas encore globalement revue) → l'entité s'affiche dans le formulaire d'édition
  complet, modifiable. C'est le comportement voulu : une revue sans friction.
- `isNew: false` (déjà revue au moins une fois) → l'entité est sélectionnée et non modifiable en
  place. Pour la corriger, le reviewer doit en créer une copie — mécanisme qui existe pour les
  `PieceVersion` (bouton « Create new piece version from selected »).

**Portée des modifications en place.** Pour `Person`, `Organization`, `Collection` et `Piece`, une
modification s'applique à la ligne existante et se répercute **intentionnellement** sur toutes les MM
Sources qui la référencent : ce sont des référentiels canoniques que l'on corrige. Pour
`PieceVersion`, la structure `Movement`/`Section` est propre à une édition-source et ne doit jamais
être mutée pour le compte d'une autre source — d'où le fork décrit en §7.

**`isNew` n'est jamais une preuve d'inexistence en base.** Une entité préexistante non encore revue
porte `isNew: true`. Le serveur ne doit donc **jamais** s'appuyer sur `isNew` pour décider d'une
création : la décision se prend exclusivement par confrontation à la base (§8.1).

---

## 7. Fork de `PieceVersion` — contrat complet

### 7.1 Condition de déclenchement

Le fork se déclenche pour une `PieceVersion` si et seulement si les **deux** conditions sont réunies :

1. **Elle a été modifiée pendant la revue**, au sens :
   - un champ de la `PieceVersion` a changé ; **ou**
   - un `Movement` ou une `Section` a été ajouté ou supprimé ; **ou**
   - un champ d'un `Movement` ou d'une `Section` a changé, ce qui inclut : une valeur renseignée là
     où il y avait vide/null, une valeur effacée vers vide/null, ou une valeur remplacée.
2. **Une autre MM Source la référence**, c'est-à-dire qu'il existe une ligne
   `MMSourcesOnPieceVersions` avec ce `pieceVersionId` et un `mMSourceId` **différent de la source en
   cours de revue**. Le test exclut explicitement la source revue.

Si la `PieceVersion` est modifiée mais référencée par la seule source en revue : **mise à jour en
place**, pas de fork. Une `PieceVersion` ne peut donc jamais devenir orpheline par l'effet d'un fork.

### 7.2 Ce qui est cloné

- La `PieceVersion` : nouvel id, `pieceId` inchangé (la copie pointe la même `Piece`).
- Ses `Movement` : nouveaux ids.
- Leurs `Section` : nouveaux ids.

Les valeurs écrites dans les lignes clonées sont celles de **l'état soumis** (version éditée par le
reviewer), pas celles de la baseline.

### 7.3 Ce qui n'est pas cloné

- **`TempoIndication`** : les `Section` clonées conservent leur `tempoIndicationId` d'origine.
- `Piece`, `Collection`, `Person`, `Organization` : référentiels canoniques, jamais clonés.

### 7.4 Remappage

Un remappage `{ ancien id → nouvel id }` est construit pour la `PieceVersion`, ses `Movement` et ses
`Section`, puis appliqué à l'état soumis **avant** le recalcul du diff :

- `mMSourceOnPieceVersions` : l'entrée pointant la pieceVersion objet du fork passe au nouveau `pieceVersionId`, rang
  inchangé. La contrainte `@@unique([mMSourceId, pieceVersionId])` garantit qu'il n'existe qu'une
  seule entrée à remapper.
- `metronomeMarks` : tous les `sectionId` des `metronomeMark` **de la source revue** et **pointant vers les sections de la pieceVersion objet du fork**,
  pointent vers les sections clonées. Les `metronomeMark` liés aux autres pièces de la MMSource revue ne sont pas touchées.
- L'ancienne `PieceVersion` est retirée de l'état soumis, remplacée par la copie.

### 7.5 Audit du fork

Après remappage, le diff est **recalculé**, et produit exactement :

- la **création** de la nouvelle `PieceVersion` et de ses `Movement`/`Section` (leurs ids sont absents
  de la base) ;
- la **mise à jour de la relation source/pieceVersion**, enregistrée sous l'entité `MM_SOURCE` via le
  snapshot d'ordonnancement `contentsOrder` étendu à `{ pieceVersionId, rank }` avant/après.
  *Décision : pas de nouvelle valeur `MM_SOURCE_ON_PIECE_VERSION` dans l'enum `AUDIT_ENTITY_TYPE`,
  donc pas de migration.*
- **rien** sur la `PieceVersion` d'origine : ni divergence, ni suppression, ni déliaison.

### 7.6 Protection de l'original — invariant dur

L'ensemble des ids d'origine (`PieceVersion`, ses `Movement`, ses `Section`) est mémorisé comme
**sous-arbre forké protégé**, et à ce titre :

- il est **exclu de la détection de suppression** lors de la persistance. C'est indispensable : la
  logique actuelle supprime les `Movement`/`Section` présents en baseline et absents de l'état soumis
  — sans cette exclusion, le fork détruirait la structure partagée qu'il est censé protéger ;
- toute entrée d'audit `DELETE` portant sur l'un de ces ids est retirée du jeu d'audit.

**Règle générale associée :** aucune soumission de revue ne supprime jamais une ligne `PieceVersion`.
Une `PieceVersion` retirée de la source est **déliée** (suppression de la ligne
`MMSourcesOnPieceVersions`), jamais effacée. Le nettoyage d'éventuelles `PieceVersion` orphelines
relève d'une action d'administration ultérieure, hors périmètre.

### 7.7 Marqueur de revue

Le `ReviewedEntity` de type `PIECE_VERSION` est créé **pour la copie uniquement**. Le marqueur de
l'entité d'origine, s'il existe, n'est pas touché.

---

## 8. Soumission serveur

Aucune écriture métier n'a lieu avant cette étape. Tout est calculé hors transaction, puis appliqué
en une transaction unique.

### 8.1 Baseline — lue en base au moment du submit

**La baseline n'est jamais une copie conservée côté client depuis le démarrage.** Elle est rechargée
depuis la base au moment de la soumission, et le diff compare l'état soumis à l'état réellement
présent en base à cet instant.

La baseline se construit en deux temps :

1. **Le graphe de la source** : description, références, contributions, relations ordonnées vers les
   `PieceVersion`, avec leurs `Movement`/`Section`, les `TempoIndication`, les `MetronomeMark`, et les
   `Person`/`Organization`/`Collection`/`Piece` atteignables.
2. **L'extension par existence** : tout id présent dans l'état soumis mais absent du graphe de la
   source fait l'objet d'une lecture en base. Ce cas se produit dès qu'un reviewer sélectionne une
   entité existante non rattachée jusque-là à cette source (une `Person` comme contributeur, une
   `PieceVersion` existante).

Règle de classification qui en découle :

| Situation | Opération d'audit |
|---|---|
| id absent de la base | `CREATE` |
| id présent en base, valeurs identiques | **aucune entrée** |
| id présent en base, valeurs différentes | `UPDATE` |
| id en baseline, absent de l'état soumis (hors sous-arbre forké protégé) | `DELETE` |

Sans cette extension, une entité préexistante simplement sélectionnée serait auditée comme une
création, et une modification comme une création — deux erreurs de fond dans la trace d'audit.

**Règle de protection des entités existante en base** : une entité person/organisation/pièce/collection/tempoIndication présente dans la baseline, mais absente de l'état soumis ne doit pas supprimer l'entité en base, **seulement** sa liaison comme contribution, MMSourceOnPieceVersion etc.

### 8.2 Validation

**Les prédicats `isComplete` ne sont pas rejoués côté serveur.** On fait confiance au formulaire de
front pour la complétude métier. Le serveur applique, avant tout traitement :

1. le contrôle des champs obligatoires, sur le modèle de `app/api/feedForm/route.ts` ;
2. `assertsIsPersistableFeedFormState` sur l'état reçu.

Ce garde devient **strictement commun aux deux routes** : la clause qui refuse aujourd'hui un état
porteur d'un `reviewContext` disparaît purement et simplement, puisque `reviewContext` n'existe plus.

### 8.3 Normalisation

Une étape de normalisation convertit l'état reçu en une représentation persistable, avant diff et
avant mutations. Elle **ne crée pas un second modèle métier permanent** : c'est une transformation
locale à la soumission. Elle :

- **retire les marques métronomiques `noMM: true`** : elles n'ont pas de ligne en base. C'est ce
  retrait qui produit mécaniquement le `DELETE` attendu lorsqu'un reviewer bascule une marque réelle
  en « pas de marque » (voir §12.1) ;
- retire les champs purement UI des entités (`isNew`, `isComposerNew`, …) ;
- normalise `""` et `undefined` vers `null` ;
- garantit la continuité des rangs de `mMSourceOnPieceVersions` à partir de 1 ;
- attribue un id généré côté serveur à toute entité qui en manque (cas connu : les `Reference` créées
  côté client), et journalise un avertissement pour tout type où cela ne devrait pas se produire.

### 8.4 Séquence de traitement

```
hors transaction
  1. authentification, autorisation, état IN_REVIEW
  2. champs obligatoires + assertsIsPersistableFeedFormState
  3. chargement de la baseline (graphe source + extension par existence)
  4. normalisation de l'état soumis
  5. calcul du diff  →  détection des PieceVersion modifiées
  6. FORK : pour chaque PieceVersion modifiée ET référencée par une autre source
       a. génération des nouveaux ids (PieceVersion, Movement, Section)
       b. remappage dans l'état : mMSourceOnPieceVersions, metronomeMarks
       c. mémorisation du sous-arbre forké protégé
  7. RECALCUL du diff sur l'état remappé
  8. composition des entrées AuditLog, en retirant tout DELETE portant sur le sous-arbre protégé
  9. recalcul des données dérivées (§9)
 10. envoi de l'e-mail de journalisation (comportement actuel conservé)

transaction unique
 [voir §8.5]

après succès
 11. purge des quatre clés locales de la revue
 12. retour à /review
```

### 8.5 Ordre des mutations dans la transaction

L'ordre respecte les dépendances et reprend celui de `app/api/feedForm/route.ts`
(personnes → organisations → collections → source → marques métronomiques), étendu aux besoins
propres à une mise à jour.

**Phase 1 — suppressions** (avant tout upsert, pour libérer les rangs et les références) :
`MetronomeMark` → `Section` → `Movement` → `Reference` → `Contribution` →
`MMSourcesOnPieceVersions`.
Le sous-arbre forké protégé est exclu. Aucune suppression de `PieceVersion`, `Piece`, `Person`,
`Organization`, `Collection`, `TempoIndication`.

**Phase 2 — référentiels et arbre musical** :
`Person` → `Organization` → `Collection` → `TempoIndication` → `Piece` → `PieceVersion`
(y compris les créations issues du fork) → `Movement` → `Section`.

**Phase 3 — source et enfants directs** :
`MMSource` (champs + données dérivées) → `Reference` → `Contribution` →
`MMSourcesOnPieceVersions` (rangs puis créations) → `MetronomeMark` (avec `sectionId` remappé).

**Phase 4 — traçabilité et clôture** :
`AuditLog` → `ReviewedEntity` → `Review` en `APPROVED` (+ `endedAt`, `overallComment`) →
`MMSource.reviewState` en `APPROVED`.

**Réordonnancements.** Quatre contraintes d'unicité portent sur des rangs :
`Movement @@unique([pieceVersionId, rank])`, `Section @@unique([movementId, rank])`,
`Piece @@unique([collectionId, collectionRank])`, `MMSourcesOnPieceVersions @@unique([mMSourceId, rank])`.
**Toute mise à jour de rang passe par deux phases** — écriture de rangs temporaires hors plage, puis
écriture des rangs définitifs — pour les quatre cas. Seul le dernier bénéficie de ce traitement
aujourd'hui (voir §12.2).

### 8.6 Marqueurs `ReviewedEntity`

Les `ReviewedEntity` sont créés pour les `Person`, `Organization`, `Collection`, `Piece` et
`PieceVersion` du périmètre de la source, **à l'exclusion de ceux déjà globalement revus** : leur
enregistrement d'origine ne doit pas être réattribué au reviewer courant.

---

## 9. Données dérivées

Deux données de la MM Source sont dérivées et doivent être recalculées **côté serveur** à chaque
soumission de revue, jamais reprises du client :

- **`MMSource.sectionCount`** — somme des sections de toutes les `PieceVersion` liées à la source,
  calculée après remappage du fork. Même formule que dans `app/api/feedForm/route.ts`.
- **`MMSource.permalink`** — recalculé depuis `link` via `getIMSLPPermaLink` dès que `link` change.
  Le code actuel de la revue reprend le `permalink` envoyé par le client, ce qui laisse la source
  dans un état incohérent si le reviewer corrige le lien.

Aucune autre donnée dérivée n'a été identifiée. `Collection.pieceCount` est un agrégat calculé à la
lecture, pas une colonne.

---

## 10. Vocabulaire et langue de l'interface

### 10.1 Vocabulaire

Le refactoring supprime la notion de checklist. **Aucun nom issu du processus actuel ne doit
survivre** dans les types, les fonctions, les fichiers ou les tests. Les notions cibles sont le
**snapshot de revue** (`FeedFormState` baseline / soumis) et le **diff d'audit**.

Le schéma déclaratif des champs par type d'entité est **conservé** — il reste nécessaire pour savoir
quels champs comparer — mais dépouillé de ses `label` et `meta` (qui ne servaient qu'à l'affichage de
la checklist) et renommé. Il doit continuer d'être maintenu à la main à chaque évolution du schéma
de base de données ; `movement.isVariation`, ajouté récemment, y figure déjà et sert d'exemple de
cette servitude.

### 10.2 Langue des textes de l'application (UI)

Tous les textes visibles par l'utilisateur final dans l'interface applicative doivent impérativement
être rédigés en **anglais**. Cela s'applique sans exception à :
- l'UI des étapes du formulaire et des sous-formulaires (titres, libellés de champs, placeholders, infobulles) ;
- le bandeau de session de revue (`ReviewSessionBanner`) ;
- l'ensemble des boutons d'action et libellés interactifs ;
- les modales de dialogue, de confirmation, de commentaire (`OverallCommentModal`) et de diff (`ReviewDiffModal`) ;
- les notifications et alertes sous forme de toasts (`ToastNotificationProvider`) ;
- les messages d'erreur et d'avertissement renvoyés ou affichés côté client.

---

## 11. Invariants à préserver

Critères d'acceptation transverses, à vérifier par des tests.

**Verrouillage et unicité**
1. Une seule `Review` peut être `IN_REVIEW` pour une MM Source donnée, garanti par index unique
   partiel en base et non par le seul contrôle applicatif.
2. Un reviewer ne peut avoir qu'une seule `Review` `IN_REVIEW`, également garanti par index unique
   partiel — le contrôle applicatif seul est sujet aux compétitions.
3. Un reviewer ne peut pas réviser une MM Source dont il est le créateur.
4. Depuis la liste, un reviewer ayant une revue active y est systématiquement redirigé.

**Absence d'écriture prématurée**
5. **Aucune écriture métier en base avant l'approbation finale.** Cela vaut pour toutes les étapes,
   tous les sous-formulaires et toutes les sélections ou créations effectuées pendant la revue.
   Aucun sous-formulaire réutilisé ne doit persister immédiatement une entité nouvellement créée.
6. Un abandon est sans effet sur les données métier : aucune mutation, aucun `AuditLog`.
7. Le brouillon local n'est supprimé qu'après succès confirmé de la transaction.

**Intégrité des données partagées**
8. Une `PieceVersion` référencée par une autre MM Source n'est jamais mutée pour le compte de la
   source en revue.
9. Aucune ligne `PieceVersion` n'est jamais supprimée par une soumission de revue.
10. Le sous-arbre forké protégé n'est ni supprimé, ni audité en `DELETE`.
11. Les `MetronomeMark` des autres sources ne sont jamais remappées.

**Traçabilité**
12. Toute modification approuvée est auditée dans la même transaction que sa persistance —
    atomicité stricte : soit tout est écrit, soit rien.
13. Le diff est calculé côté serveur, à partir d'une baseline lue en base au moment du submit. Le
    diff ou l'état de complétude envoyés par le client ne sont jamais l'autorité.
14. Une entité préexistante en base n'est jamais auditée en `CREATE`.
15. Une entité préexistante inchangée ne produit aucune entrée d'audit.
16. Les marqueurs `ReviewedEntity` existants ne sont jamais réattribués au reviewer courant.

**Isolation**
17. Les données locales de revue ne contaminent jamais les clés ni le comportement de la saisie
    initiale, et réciproquement.
18. Un brouillon dont le `reviewId` ou le `reviewerId` ne correspond pas à la revue chargée est
    ignoré et purgé.

**Autorisation**
19. Les règles d'autorisation sont contrôlées exclusivement côté serveur. La page cliente et le
    brouillon local ne sont jamais une preuve d'autorisation ni de validité.
20. `/review/[reviewId]` et sa soumission sont réservées au reviewer propriétaire.

**Non-régression**
21. La saisie initiale `/feed` fonctionne exactement comme avant : mêmes clés, mêmes étapes, même
    route de persistance, même comportement de réinitialisation.

**Langue de l'interface**
22. **Tous les textes et messages affichés à l'utilisateur** (boutons, modales, bandeaux,
    notifications toasts, labels de formulaires, retours API destinés à l'UI) sont impérativement
    rédigés en anglais.

---

## 12. Défauts actuels corrigés au passage

Quatre défauts latents ont été identifiés dans le code existant pendant le cadrage. Ils ne sont pas
des régressions introduites par ce projet, mais le refactoring les rend soit visibles, soit
faciles à corriger. Ils font partie du périmètre.

### 12.1 Une marque métronomique basculée en `noMM` survit en base

Si le reviewer bascule une marque réelle en « pas de marque », l'entrée reste dans `metronomeMarks`
avec son id : elle n'apparaît donc pas dans les suppressions (elle n'est pas absente de l'état
soumis), et elle est ignorée à l'écriture par le test `if (!mm.noMM)`. La ligne survit en base.
**Corrigé par** le retrait des `noMM: true` à la normalisation (§8.3), qui la fait apparaître comme
absente et donc supprimée.

### 12.2 Un réordonnancement de mouvements ou de sections lève une violation d'unicité

`Movement` et `Section` portent une contrainte d'unicité sur `(parent, rank)`, et sont écrits un par
un. Un simple échange de rangs entre deux mouvements échoue. Même exposition sur
`Piece.collectionRank`. **Corrigé par** la généralisation de la mise à jour de rang en deux phases
(§8.5).

### 12.3 Le `permalink` n'est pas recalculé quand le lien change

La revue reprend le `permalink` du client au lieu de le dériver de `link`. **Corrigé par** §9.

### 12.4 La fusion du brouillon local peut produire un état hybride

`withLocalStorage` fusionne l'état initial et l'état sauvegardé par `merge` de lodash, qui fusionne
les tableaux **par index**. Si l'état initial contient trois `pieceVersion` et le brouillon deux, la
troisième de l'état initial survit dans le résultat. Inoffensif aujourd'hui (l'état initial de
`/feed` est vide) mais destructeur en revue, où l'état initial est une source complète. **Corrigé
par** la règle « en mode revue, un brouillon valide remplace intégralement l'état initial » (§3.3).

---

## 13. Risque résiduel identifié

**Régénération d'identifiants par les sous-formulaires.** Puisque `isNew: true` ouvre le formulaire de
création prérempli, chaque sous-formulaire (`Person`, `Organization`, `Collection`, `Piece`,
`PieceVersion`) doit réécrire **le même identifiant**, et non en générer un nouveau. En saisie
initiale, une régénération d'id passerait inaperçue — tout est créé de toute façon. En revue, elle
dupliquerait silencieusement une entité canonique de référence.

Les cinq chemins n'ont pas été audités. Un lot d'audit et de tests dédié figure dans la feuille de
route.

---

## 14. Rappel du hors-scope `self-source-edit`

Le mode `self-source-edit` (un éditeur modifie sa propre MM Source avant qu'elle n'entre en revue,
avec la même approche) n'est pas implémenté ici. Le contrat de mode et le contexte de session sont
conçus pour l'accueillir sans nouveau refactor de structure, mais aucune route, aucune API et aucune
UI ne sont créées pour ce cas. La seule exigence portée par ce projet est de **ne rien faire qui
rende ce mode plus coûteux à ajouter** : en particulier, ne pas coder en dur « revue » là où « mode
non-saisie-initiale » suffirait.
