## Prompt pour Claude Code Opus 5

Analyse l'échange chat que j'ai eu avec une IA, comparant deux propositions de document de travail pour un refactoring important: @specs/20260806_review-in-feed_synthese.md
JE vais maintenant répondre aux intérrogations soulevés et faire les choix demandés.

**Ta tâche** est de soulever les questions qui restent à éclaircir s'il y en a, et une fois tous les points éclaircis, de rédiger deux documents finaux :
1. Un document de cadrage avec les décisions phares et leur justification, les choix d'architecture, d'organisation et d'autorisations, les parcours et comportements actés. Tu peux y ajouter ce qui te semble important afin de bien définir le projet de refactoring.
2. Une feuille de route bien détaillée, qui servira de document de travail pour l'implémentation tant humaine que par agent IA.

### Mes réponses aux réserves soulevées :
1. Le document de chat avec Sonnet 5 n'était pas complet, je viens d'y ajouter quelques échanges de plus qui apportent des éclaircissements. L'ajout de `isNew` lorsqu'une entité n'a pas déjà été revue entraine le bon comportement du formulaire actuel: isNew = formulaire complet éditable, sinon l'entité est sélectionnée et non éditable.

2. 
- Une pieceVersion est considérée comme modifiée si :
   - Un champ de la pieceVersion est modifié
   - Un movement ou section est ajoutée ou supprimée
   - Un movement ou une section est modifiée :
     - Un champ est renseigné alors qu'il était vide/null
     - Un champ renseigné est rendu vide/null
     - Un champ voit sa valeur modifiée 
   
- Oui, le test d’utilisation par une autre source doit exclure la source actuellement revue
- Dans le cas d'un clonage d'une pieceVersion :
  - Garder les tempoIndicationId dans les sections (pas de clonage de cette entité)
  - Modifier tous les ids de sections qui se trouvent dans les enregistrements de MetronomeMark de la Source revue, afin qu'ils pointent vers les sections de la nouvelle pieceVersion clonée.
- Dans le cas d'un clonage d'une pieceVersion, l'audit doit représenter :
  - la création d’une nouvelle version et de ses enfants
  - la mise à jour de la relation source/version
  - Rien sur la divergence de pieceVersion
- Le nouveau ReviewedEntity doit viser seulement la copie.
- Une contrainte d'unicité (mMSourceId, pieceVersionId) sur MMSourcesOnPieceVersions empêche que deux relations de la même source pointent vers une même pieceVersion.

3. 
- La baseline pour le diff et la persistance doit être récupérée côté serveur au moment de la soumission.
- Le diff compare à l'état réellement présent en base au moment du submit.

4. On ne rejoue pas du tout les prédicats `isComplete` côté serveur. On fait confiance au formulaire de front pour cela, et on réutilise seulement `assertsIsPersistableFeedFormState` avant de déclencher les traitements côté serveur, comme dans la route de persistance du feedForm `app/api/feedForm/route.ts`. Mais sans réutiliser le garde de création qui interdit actuellement `reviewContext`.

5. Je suis d'accord que l'enveloppe (on parle bien de ce qui est stocké en localStorage à côté de la donnée `feedFormState` ici ?) doit contenir le reviewId, le creatorId (id de compte du reviewer), et la version du schema. Les vérifications qui s'imposent doivent être faites à l'hydratation comme proposé. Adopter une clé dérivée du `reviewId` comme proposé ci-dessous (proposition 5).

6. `overallComment` doit vivre dans les métadonnées de session en effet. Est-ce la même chose que ce qui est appelé "enveloppe" ci-dessus ? C'est deux termes ne sont pas assez précis pour moi. Est-ce un état gardé dans le composant autour du FeedForm, et synchronisé avec le localStorage ? En tout cas évitons de mettre dans le `FeedFormState` des données qui lui sont extérieures.

7. Je trouve en fin de compte le décompte proposé inutile, il ne fait que reprendre l'affichage des étapes du formulaire déjà affichées. Donc on abandonne cet affichage de progression.

### Réponse aux propositions

1. OK, répondu ci-dessus au point 3.
2. Les étapes côté serveur de GPT me semblent plutôt bonne. Il faut les reprendre comme base et inclure une description précise de la transaction unique et des mutations :
   - Je pense que c'est après le calcul des diff qu'il faut ajouter une étape spécifique aux pieceVersion : si une pieceVersion a été modifiée, il faut exécuter son fork, les modifications des entités liées MMourceOnPieceVersion et MetronomeMark, et relancer le calcul de diff à partir de là pour avoir les auditLog tels que définis ci-dessus.
   - Pour l'ordre des dépendance, respecter le même ordre que dans `app/api/feedForm/route.ts` .
3. Inclure explicitement le recalcul de `sectionCount` lorsque la structure change. Je ne vois pas d'autres données dérivées, mais il faut les inclure s'il y en a.
4. Clairement établir qu'il n'y a aucune persistance en base de données jusqu’à l’approbation finale, comme c'est le cas pour le feedForm actuel.
5. OK pour la clé dérivée du `reviewId` pour un coût technique faible.
6. Oui, éviter d'inclure dans feedFormState des données de contexte d'utilisation du feedForm. Les mettre de préférence dans un contexte de session.
7. Oui, inclure la normalisation proposée côté serveur.
8. Oui, inclure le renommage systématique de toutes les notions issues du processus actuel de review qui n'existeront plus après le refactoring.
9. J'aprouve : le brouillon ne doit être supprimé qu’après le succès de la transaction.
10. Inclure tous les "Invariants à préserver" du document GPT. Les reformuler et les étendre au besoin pour que le cadrage soit bien exhaustif.

## Claude - Opus (1M) High

I'll start by reading the referenced documents to understand the full context.

I need to read the four source documents and the repo's agent instructions.

I've read the synthesis and both source pairs. Now let me ground myself in the actual code before raising remaining questions.

J'ai lu la synthèse, les quatre documents sources, et vérifié le code concerné (`submit/route.ts`, `reviewDiff.ts`, `auditCompose.ts`, `getReviewOverview.ts`, `reviewEditBridge.ts`, `stepsUtils.ts`, les trois reducers/providers, le schéma Prisma). Vos réponses lèvent l'essentiel. Il me reste **une clarification à vous rendre** (votre question sur « enveloppe ») et **7 points à trancher**, dont 4 sont des problèmes réels que j'ai trouvés dans le code et que ni GPT ni Sonnet n'avaient relevés.

---

## D'abord, votre question du point 6 : « enveloppe » vs « métadonnées de session »

Les deux termes désignaient effectivement deux choses différentes dans la synthèse. Voici la terminologie que je propose de figer dans les documents :

| Terme | Ce que c'est | Où ça vit |
|---|---|---|
| **Enveloppe de version** | Le wrapper `{ version, payload }` déjà existant dans `utils/localStorage.ts`, appliqué à *toute* écriture localStorage. Purement technique (invalidation au bump de `LOCAL_STORAGE_SCHEMA_VERSION`). | `utils/localStorage.ts`, inchangé |
| **Métadonnées de session de revue** | `{ reviewId, reviewerId, mMSourceId, mode, overallComment, globallyReviewed }`. C'est bien **un état React tenu par un provider autour de `FeedFormProvider`**, synchronisé vers localStorage sous **sa propre clé**. | Nouveau `ReviewSessionProvider` + clé `review:<reviewId>:session` |
| **Brouillon** | Le `FeedFormState` lui-même (+ les états des deux sous-wizards). | Clés `review:<reviewId>:feedForm`, `:singlePieceVersionForm`, `:collectionPieceVersionForm` |

Donc : `overallComment` vit dans **les métadonnées de session** (2ᵉ ligne), pas dans l'enveloppe technique, et surtout pas dans `FeedFormState`. Les contrôles d'identité à l'hydratation (`reviewId`, `creatorId`) portent sur l'enregistrement de métadonnées ; s'ils échouent, on purge les 4 clés du préfixe `review:<reviewId>:`.

Conséquence que j'acte, sauf objection : **`reviewContext` disparaît totalement de `FeedFormInfo`**, et `mode`/`reviewId` ne sont **jamais** dans `FeedFormState`. `formInfo` ne garde que ce qui est réellement interne au formulaire (`currentStepRank`, `introDone`, `allSourceOnPieceVersionsDone`, `isSourceOnPieceVersionformOpen`, `formType`).

---

## Questions à trancher

### 1. Périmètre exact de la baseline serveur — *important*

Vous avez tranché : « le diff compare à l'état réellement présent en base au moment du submit ». Or `getReviewOverview` ne charge que le graphe **atteignable depuis la source**. Le reviewer peut attacher une entité qui existe déjà en base mais n'était pas rattachée à cette source (une `Person` existante comme contributeur, une `PieceVersion` existante). Avec une baseline limitée à la source, cette entité apparaît en `CREATE` dans l'audit alors que la ligne préexiste — et si le reviewer la modifie au passage, la modification est enregistrée comme une création.

**Proposition :** au submit, compléter la baseline par une lecture DB de **tout id présent dans l'état soumis et absent du graphe source**. Règle : id absent de la base → `CREATE` ; id présent en base → `UPDATE` (ou aucune entrée si identique). Vous confirmez ?

### 2. Comment auditer la substitution de `pieceVersion` (fork) ?

`AUDIT_ENTITY_TYPE` ne contient **pas** `MM_SOURCE_ON_PIECE_VERSION`. De plus, `reviewDiff.ts` ne compare aujourd'hui que les **rangs** du join, par `joinId` — un changement de `pieceVersionId` n'est donc pas détecté du tout.

- **(a)** Auditer la relation sous `MM_SOURCE`, via le snapshot `contentsOrder` existant étendu à `{ pieceVersionId, rank }` avant/après, et ajouter au diff la détection des ajouts/retraits/substitutions de join. **Aucune migration.** *(ma recommandation)*
- **(b)** Ajouter `MM_SOURCE_ON_PIECE_VERSION` à l'enum `AUDIT_ENTITY_TYPE` (migration) pour une ligne d'audit dédiée par relation.

### 3. Sort de la `pieceVersion` d'origine, et des `pieceVersion` déliées

Deux règles que je déduis de vos réponses mais qui ne sont écrites nulle part, et dont l'omission serait destructrice :

- Après fork, la `PieceVersion` d'origine et son arbre `Movement`/`Section` ne doivent **ni être modifiés, ni être supprimés, ni produire d'entrées d'audit `DELETE`** — alors que le code actuel de `submit` supprime justement les `Movement`/`Section` présents en baseline et absents de la copie de travail. Il faut donc exclure explicitement le sous-arbre forké de la détection de suppression.
- Question ouverte : que faire d'une `PieceVersion` qui, après la revue, n'est plus référencée par **aucune** source ? **Proposition : ne jamais supprimer de ligne `PieceVersion` au submit, seulement délier.** Le nettoyage des orphelines relèverait d'une action d'administration ultérieure. Confirmez-vous ?

### 4. Réordonnancements et contraintes d'unicité — *bug latent*

Le schéma porte `@@unique([pieceVersionId, rank])` sur `Movement`, `@@unique([movementId, rank])` sur `Section`, `@@unique([collectionId, collectionRank])` sur `Piece`, `@@unique([mMSourceId, rank])` sur `MMSourcesOnPieceVersions`. Seul le dernier bénéficie aujourd'hui du passage en deux temps par des rangs temporaires. **Un simple échange de rangs entre deux mouvements ou deux sections pendant la revue lèvera une violation d'unicité.**

**Proposition :** généraliser la mise à jour de rang en deux phases aux quatre cas, avec un test dédié par cas. Vous validez de l'inclure au périmètre ?

### 5. Préservation des ids lors de la ré-édition d'une entité pré-existante non revue

Puisque `isNew: true` ouvre le formulaire de création prérempli, chaque sous-formulaire (`Person`, `Organization`, `Collection`, `Piece`, `PieceVersion`) doit réécrire **le même id** et non en générer un nouveau. Si l'un d'eux régénère l'id, la revue dupliquera silencieusement une entité canonique de référence.

Je n'ai pas audité les cinq chemins. **Voulez-vous que je l'inscrive comme tâche d'audit + tests dans la feuille de route** (mon avis : oui, c'est peu coûteux et le risque est élevé), ou avez-vous déjà la certitude que ça fonctionne ?

### 6. Index unique partiel « une seule revue active par reviewer » ?

Il existe déjà `review_unique_in_review_per_source` (index partiel manuel, cf. `specs/20250811_MIGRATION_NOTE_...`). Le contrôle serveur que vous avez validé dans `start` est *racy* sans son pendant. **Proposition :** ajouter le même type d'index, `ON "Review"("creatorId") WHERE state = 'IN_REVIEW'`, avec sa note de migration manuelle. OK ?

### 7. L'étape « Introduction » dans la colonne de gauche en mode revue

Le tableau `steps` reste statique et `introDone` est posé à `true` au boot — mais `Steps.tsx` continuera d'afficher « Introduction » dans la barre latérale. **Proposition : la masquer en mode revue** (simple filtre sur le rang 0 piloté par le contexte de session). Ou préférez-vous la laisser visible et cochée ?

---

Deux points que je **n'ai pas** transformés en questions parce que vos réponses les tranchent déjà, mais que je signale car ils corrigent des bugs actuels et seront écrits explicitement dans les documents :

- **Marques `noMM`** : aujourd'hui, si un reviewer bascule une marque réelle en `noMM`, elle n'est ni supprimée (elle reste dans `metronomeMarks`, donc hors de `removedMMIds`) ni mise à jour (`if (!mm.noMM)`) — la ligne survit en base. La normalisation serveur que vous avez validée (proposition 7) doit écarter les `noMM: true` **avant** le diff, ce qui produit mécaniquement le `DELETE` attendu.
- **`assertsIsPersistableFeedFormState`** : la ligne `formInfo.reviewContext === undefined` disparaît purement et simplement, puisque `reviewContext` n'existe plus. Le même garde sert alors aux deux routes, sans variante.

Dites-moi vos choix sur les 7 points et je rédige les deux documents.

## Moi

1. Oui je confirme. Il faut vérifier l'existence en base des ids de nouvelles entités. Si une entité existante est sélectionnée dans le formulaire durant la review, il ne faut pas le considérer comme `CREATE` . Normalement, une telle entité pré-existante ne devrait pas pouvoir être modifiée dans le formulaire, mais il vaut mieux vérifier si ses valeurs ont changé, et ne créer un `UPDATE` que dans ce cas-là.
2. Solution (a)
3. - Oui, il faut exclure explicitement le sous-arbre forké de la détection de suppression. Ne surtout pas la supprimer ni enregistrer d'audti la concernant.
- La décision de forker une pieceVersion doit être prise si elle a été modifiée durant la review ET si une autre MMSource y fait référence dans un MMSourceOnPieceVersion. Donc Une pieceVersion ne doit pas se retrouver orpheline après un fork. Cependant, actons qu'aucune suppression de ligne PieceVersion ne doit être déclenché lors d'un submit, il faut suelement délier.
4. Oui, généraliser la mise à jour de rang en deux phases aux quatre cas.
5. Oui, ajoute une tâche d'auti et de tests sur la préservation des ids dans les sous-formulaires. Cela fonctionne bien a priori durant le feedForm actuel, mais des modifications d'ids pourraient exister sans perturber la création d'une MMSource, alros que c'est plus sensible lors de la review.
6. Oui, ajouter cette contrainte d'unicité avec sa note de migration manuelle.
7. Je change d'avis ici. Je veux garder une étape d'Intro sans la sauter. Il faut donc garder `introDone` à `false` au démarrage d'une review. Nous en changerons le contenu pour donner quelques directives aux reviewer. Il faut donc prévoir l'affichage d'un contenu différent dans le contexte de review.

OK pour les deux points explicités en fin de ton message.
Tu peux produire les deux documents maintenant.

## Claude - Opus (1M) High

Tous les points sont tranchés. Je vérifie deux derniers détails d'implémentation avant de rédiger.

Un dernier passage pour cartographier précisément les dépendances à supprimer.

J'ai tout le nécessaire. Je rédige les deux documents.

Les deux documents sont écrits dans `specs/review-in-feed-form/` :

**`20260808_cadrage_review-in-feed-form.md`** — 14 sections. Décision centrale et sa justification (avec ce qu'elle coûte : la perte du suivi de lecture champ par champ), périmètre, architecture (trois modes, terminologie enveloppe/session/brouillon fixée, clés localStorage, étapes), parcours, autorisations en tableau, sémantique `isNew`, contrat complet du fork, soumission serveur (baseline, normalisation, séquence, ordre des mutations en 4 phases), données dérivées, vocabulaire, **21 invariants** numérotés servant de critères d'acceptation, les 4 défauts actuels corrigés au passage, le risque résiduel, et le rappel hors-scope.

**`20260808_feuille-de-route_review-in-feed-form.md`** — 15 lots (L0→L14) avec graphe de dépendances, table de renommage, et pour chaque lot : objectif, fichiers exacts, tâches, tests, critère de sortie. La chaîne serveur (L7→L8→L9→L10), la chaîne client (L1→L2→L4→L5→L6), les gardes (L11) et l'audit d'ids (L13) sont parallélisables après L0.

Trois points où j'ai tranché par déduction plutôt que de vous re-solliciter — signalés ici pour que vous puissiez les corriger :

1. **`abort` reste `propriétaire ou ADMIN`**, contrairement à la page qui devient propriétaire seul. C'est aujourd'hui le seul levier permettant de déverrouiller une source dont le reviewer a disparu, et il n'expose aucune donnée. Justifié explicitement dans le cadrage §5.
2. **Le `joinId` de `MMSourcesOnPieceVersions` disparaît du contrat client.** `FeedFormState` ne le porte pas, et la contrainte `@@unique([mMSourceId, pieceVersionId])` fait de `pieceVersionId` la clé naturelle côté source — le `joinId` est résolu au moment d'écrire. Cela impose de réindexer le diff du join sur `pieceVersionId`, ce qui est de toute façon nécessaire pour rendre visible la substitution du fork.
3. **`permalink` traité comme seconde donnée dérivée**, à recalculer via `getIMSLPPermaLink` quand `link` change. Le code actuel de la revue reprend le `permalink` du client, ce qui laisse la source incohérente si le reviewer corrige le lien. Vous n'aviez identifié que `sectionCount`, mais votre consigne était d'inclure les autres s'il y en avait.

Deux constats de code utiles pour la suite : `features/review/reviewAdapters.ts` n'a **aucun importeur** — c'est déjà du code mort. Et la fusion lodash de `withLocalStorage` fusionne les tableaux par index : inoffensive aujourd'hui parce que l'état initial de `/feed` est vide, elle produirait des états hybrides en revue où l'état initial est une source complète. D'où la stratégie `replace` du lot 2.

# Autre (Hors chat)

Crédit restant au début: 21.20
Après 1ère étape : 18.36
fin: 15.26

Questions :
1. Que se passe-t-il si un reviewer a une review en cours, ferme son navigateur, et reviens plus tard en voulant débuter une création de donnée via le feedForm ?
Réponse: ce qui est souhaitable, c'est que le wrapper du feedForm récupère en base les infos permettant de savoir que l'utilisateur à une review  IN_REVIEW, et l'informe qu'il doit abandonner sa review en cours s'il veut créer une nouvelle MMSource ou en éditer une. Cela me semble compliqué de gérer proprement la possiblité d'un utilisateur d'avoir en même temps un brouillon de création feedForm et un brouillon de review. En même temps les clé de localStorage de review stocke toute les données de feedForm indépendamment des données de localStorage du feedForm stockée avec sa propre clé. Une recommandation ?
2. En review, supprimer le bouton de suppression de toutes les données de formulaire présents dans la colonne de gauche sous les étapes du feedForm.
3. Garder dans l'entête un bouton permettant de visualiser les diff en cours de review.
4. Point 8.1 du cadrage - Une entité person/organisation/pièce/collection/tempoIndication présente dans la baseline, mais absente de l'état soumis ne doit pas supprimer l'entité en base, **seulement** sa liaison comme contribution, MMSourceOnPieceVersion etc.
5. Afficher une alerte quant un contenu localStorage va être effacé, que ce soit pour un changement de version ou pour une incohérence de données de revue d'avec l'utilisateur connecté.