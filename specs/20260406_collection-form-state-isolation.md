# Original prompt - problem exposition

J'ai implémenté l'isolation du state de mon sous-formulaire @file:SinglePieceVersionFormContainer.tsx avec son contexte @file:singlePieceVersionFormContext.tsx , comme je l'avais planifié dans le document @file:20260330_Isolation_state_task_with-original-message.md .

Parmi les points de vigilance, il y a le mode collection. En effet, l'édition d'une pièce simple peut se faire seule, ou en sein de l'édition d'une collection.

Dans le cas d'un collection, on fait appel au formulaire @file:CollectionPieceVersionsFormContainer.tsx et son contexte @file:collectionPieceVersionsFormContext.tsx .

De la même façon que je l'ai fait dans le formulaire singlePiece, il faut que je m'assure que le formulaire de collection fonctionne en isolation du state général du FeedForm, et ne met à jour celui-ci qu'à la validation du formulaire de collection entier.

Etudie mon formulaire de collection et dis-moi s'il faut l'adapter.
S'il faut l'adapter, détaille-moi tous les éléments à modifier, et organise un plan d'action détaillé des modifications nécessaires.

Réfléchi étape par étape.

## Oui, il faut l’adapter

En l’état, le formulaire **collection** n’est **pas isolé** du state global du `FeedForm`.  
Contrairement à ce que tu viens de mettre en place pour le `singlePiece`, il continue à **écrire dans `feedForm` pendant le workflow**, bien avant la validation finale de la collection.

Donc si ton objectif est :

- **édition locale complète dans le sous-formulaire collection**
- **aucun impact sur le `feedForm` avant validation finale**
- **projection unique vers le `feedForm` au submit final de la collection**

alors **une adaptation est nécessaire**.

---

# Analyse pas à pas

## 1. Le contexte collection possède déjà un state local riche
Le bon point de départ, c’est que `CollectionPieceVersionsFormState` est déjà structuré comme un vrai agrégat local :

- `collection`
- `mMSourceOnPieceVersions`
- `persons`
- `pieces`
- `pieceVersions`
- `tempoIndications`

Donc **le modèle de state cible existe déjà**.  
Autrement dit, sur le plan du type, le formulaire collection est **beaucoup plus proche de la bonne architecture** que ne l’était `singlePiece` avant refonte.

### Conséquence
Le problème n’est pas d’abord le type du state.  
Le problème est surtout :

- **le flux de données réel**
- **les sources de lecture**
- **les handlers du container**
- **la dépendance persistante au `feedForm`**

---

## 2. Le container collection écrit trop tôt dans `feedForm`
C’est le point principal.

Dans le container de collection, plusieurs handlers font des `updateFeedForm(...)` pendant la saisie.

### Cas concernés
#### Étape compositeur
- création compositeur
- sélection compositeur
- annulation création compositeur

Le compositeur est injecté/supprimé dans `feedForm.persons` immédiatement.

#### Étape collection
- création collection
- sélection collection
- annulation création collection

La collection est injectée/supprimée dans `feedForm.collections` immédiatement.

#### Étape pièces / versions
- ajout des pièces
- ajout des pieceVersions

Les pièces et versions sont écrites dans `feedForm` au fil de l’eau.

### Pourquoi c’est incompatible avec l’isolation
Ça recrée exactement le problème que tu viens de corriger côté `singlePiece` :

- pollution prématurée du global state
- logique compensatoire d’annulation
- couplage implicite entre sous-formulaire et `feedForm`
- risque d’état global incohérent si l’utilisateur abandonne

---

## 3. Le sous-formulaire collection lit encore majoritairement dans `feedForm`
Même quand les données devraient vivre localement, plusieurs composants les relisent dans le `feedForm`.

### Exemples fonctionnels
- résumé collection : le compositeur est retrouvé via `feedForm`
- édition des pièces de collection : pièces, compositeur, pieceVersions sont relus dans `feedForm`
- détection “new collection” via `getNewEntities(feedFormState, "collections")`
- sélection de collection : les nouvelles collections sont supposées présentes dans `feedForm`

### Pourquoi c’est problématique
Même si tu commençais à écrire localement, l’UI continuerait à dépendre du global state pour fonctionner.  
Donc l’isolation serait seulement partielle.

---

## 4. Le mode collection utilise encore `SinglePieceVersionFormContainer` de manière non isolée
Le point le plus important ici : le `singlePiece` embarqué dans le mode collection a bien été isolé, **mais son résultat n’est pas encore correctement re-projeté dans le state local collection**.

Dans le composant d’édition des pièces de collection, le callback de soumission du `singlePiece` contient même un `TODO` explicite :

- il ne met à jour que `mMSourceOnPieceVersions`
- il **ne copie pas** les entités complètes (`composer`, `piece`, `pieceVersion`, `tempoIndications`) dans le state local collection

### Conséquence
Aujourd’hui, en mode collection :

- le sous-formulaire `singlePiece` est local
- mais le formulaire parent collection **n’absorbe pas correctement son résultat**
- et continue donc à s’appuyer sur `feedForm`

C’est précisément l’endroit à corriger.

---

## 5. Le reducer collection est déjà orienté “state local”, mais son usage n’est pas aligné
Le reducer du contexte collection sait gérer localement :

- `collection`
- `persons`
- `pieces`
- `pieceVersions`
- `tempoIndications`
- `mMSourceOnPieceVersions`

et il gère aussi des resets de dépendances quand le compositeur ou la collection changent.

### Bon point
Ça veut dire que tu n’as probablement **pas besoin d’une refonte conceptuelle aussi lourde** que pour `singlePiece`.

### Mais
Il faudra tout de même :

- **mieux typer les actions**
- vérifier la cohérence des resets
- supprimer l’hypothèse implicite “les vraies données sont dans `feedForm`”

---

# Conclusion d’analyse

## Verdict
### **Oui, il faut adapter le formulaire collection.**

Mais la nature du travail est différente de celle du `singlePiece` :

- pour `singlePiece`, il fallait surtout **changer le modèle local**
- pour `collection`, le modèle local existe déjà ; il faut surtout **faire en sorte qu’il devienne la vraie source de vérité pendant tout le workflow**

---

# Ce qu’il faut modifier

Je te détaille ça par blocs.

---

## A. Faire du `CollectionPieceVersionsFormState` la source unique pendant le workflow

## Objectif
Pendant toute l’édition de la collection, les données doivent vivre **uniquement** dans :

- `collectionPieceVersionsFormState.collection`
- `collectionPieceVersionsFormState.persons`
- `collectionPieceVersionsFormState.pieces`
- `collectionPieceVersionsFormState.pieceVersions`
- `collectionPieceVersionsFormState.tempoIndications`
- `collectionPieceVersionsFormState.mMSourceOnPieceVersions`

Le `feedForm` ne doit servir qu’à :

- ouvrir un formulaire en mode édition avec un état initial hydraté
- recevoir le commit final

## À changer
Dans `CollectionPieceVersionsFormContainer` :

- supprimer les `updateFeedForm(...)` dans les handlers intermédiaires
- remplacer ces écritures par `updateCollectionPieceVersionsForm(...)`

---

## B. Adapter les handlers du container collection

## 1. Compositeur
### Aujourd’hui
Le compositeur est créé/sélectionné dans le `feedForm`.

### Cible
Le compositeur doit être stocké **dans `state.persons`**, et la collection locale doit référencer son `composerId`.

### À faire
#### `onComposerCreated`
- créer le `PersonState`
- l’ajouter dans `collectionPieceVersionsFormState.persons`
- mettre à jour `collection.composerId`
- ne plus écrire dans `feedForm`

#### `onComposerSelect`
- ajouter/upserter le compositeur sélectionné dans `state.persons`
- mettre à jour `collection.composerId`
- ne plus écrire dans `feedForm`
- supprimer toute logique de suppression compensatoire dans `feedForm`

#### `onCancelComposerCreation`
- reset local uniquement
- pas de suppression dans `feedForm`

---

## 2. Collection
### Aujourd’hui
La collection est créée/sélectionnée dans `feedForm.collections`.

### Cible
La collection doit être stockée **uniquement dans `state.collection`** jusqu’au submit final.

### À faire
#### `onCollectionCreated`
- construire une `CollectionState` locale
- la stocker dans `state.collection`
- ne plus écrire dans `feedForm.collections`

#### `onCollectionSelect`
- stocker la collection dans `state.collection`
- récupérer les pièces existantes côté API si nécessaire
- les injecter dans `state.pieces`
- définir `formInfo.pieceIdsNeedingVersions`
- ne plus écrire dans `feedForm`

#### `onCancelCollectionCreation`
- reset local uniquement

---

## 3. Pièces
### Aujourd’hui
Les pièces sont ajoutées dans `feedForm.pieces`.

### Cible
Les pièces doivent être ajoutées dans `state.pieces`.

### À faire
#### `onAddPieces`
- remplacer `updateFeedForm(..., "pieces", ...)`
- par `updateCollectionPieceVersionsForm(..., "pieces", ...)`

---

## 4. PieceVersions
### Aujourd’hui
Les pieceVersions sont ajoutées dans `feedForm.pieceVersions`.

### Cible
Elles doivent être ajoutées dans `state.pieceVersions`.

### À faire
#### `onAddPieceVersion`
- remplacer l’écriture globale par une écriture locale

---

## C. Corriger l’intégration du `SinglePieceVersionFormContainer` dans le mode collection

C’est le cœur de la suite.

## Aujourd’hui
Le callback `onSinglePieceSubmit(...)` :

- met à jour `mMSourceOnPieceVersions`
- mais ne copie pas les vraies entités dans le state local collection

## Cible
Quand le `singlePiece` est validé dans le mode collection, il faut projeter son state dans le state local collection.

## À faire
Dans `onSinglePieceSubmit(...)` :

### 1. Upsert local des entités
À partir de `singlePieceVersionFormState`, injecter dans le contexte collection :

- `persons`: `[composer]` si présent
- `pieces`: `[piece]` si présent
- `pieceVersions`: `[pieceVersion]` si présent
- `tempoIndications`: extraites depuis `pieceVersion`, dédupliquées par `id`

### 2. Mise à jour locale de `mMSourceOnPieceVersions`
Conserver ta logique de rank, mais dans le contexte collection uniquement.

### 3. Mise à jour cohérente de `piece.collectionRank`
S’assurer que la pièce locale reflète bien le rank final dans la collection.

### 4. Aucune écriture globale
Aucun `updateFeedForm` à ce stade.

---

## D. Faire relire l’UI sur le contexte collection, pas sur `feedForm`

C’est le deuxième gros chantier.

---

## 1. Résumé de collection
Le résumé de collection ne doit pas résoudre le compositeur dans `feedForm`.

### Cible
Il doit lire le compositeur dans :

- `state.persons`
- via `state.collection.composerId`

### À faire
Adapter le résumé pour qu’il soit autonome.

---

## 2. Liste des pièces / éditions dans le formulaire de collection
Le composant d’édition de collection relit actuellement :

- pièces
- pieceVersions
- compositeur

dans le `feedForm`.

### Cible
Il doit les lire dans :

- `collectionPieceVersionsFormState.pieces`
- `collectionPieceVersionsFormState.pieceVersions`
- `collectionPieceVersionsFormState.persons`

### Pourquoi
Sinon le workflow ne peut pas être réellement local.

---

## 3. Détection “new collection”
La logique qui dépend de `getNewEntities(feedFormState, "collections")` doit être revue.

### Cible
Pour savoir si la collection est “nouvelle” dans le workflow courant, il faut utiliser :

- `state.collection?.isNew`

et non un scan du `feedForm`.

---

## 4. Sélection / création de collection
Le composant de sélection/création de collection mélange :

- collections fetchées
- collections “nouvelles” lues dans `feedForm`

### Cible
Il doit fonctionner avec :

- les collections fetchées du serveur
- éventuellement la collection locale en cours dans `state.collection`

Mais plus avec `feedForm` comme dépôt temporaire.

---

## E. Revoir les props passées aux step forms

Actuellement plusieurs step forms reçoivent `feedFormState` comme source principale.

### Cible
Les composants d’étape collection doivent recevoir en priorité :

- `collectionPieceVersionFormState`

et n’utiliser le `feedForm` qu’en lecture externe si vraiment nécessaire.

### Typiquement
- pour les données du workflow courant : **state local**
- pour des listes globales déjà confirmées : éventuellement `feedForm`
- pour des listes du serveur : fetch/API

---

## F. Ajouter une fonction de commit final vers `feedForm`

Comme tu l’as fait pour `singlePiece`, il faut un point unique de projection.

## Objectif
À la validation finale de la collection entière :

1. vérifier la cohérence du state local collection
2. projeter les entités dans `feedForm`
3. projeter `mMSourceOnPieceVersions`
4. fermer le formulaire

## À inclure
Une fonction dédiée du type :

- commit collection
- depuis `CollectionPieceVersionsFormState`
- vers `feedForm`

### Elle devra :
- upserter `persons`
- upserter `collections`
- upserter `pieces`
- upserter `pieceVersions`
- upserter `tempoIndications`
- mettre à jour `mMSourceOnPieceVersions`

### Gestion du mode update
Elle devra aussi gérer le cas :

- création de collection
- update de collection existante
- collection existante à compléter avec des versions manquantes

---

## G. Clarifier les scénarios métier distincts du mode collection

Le mode collection semble recouvrir plusieurs cas différents :

### 1. Création d’une nouvelle collection complète
- nouveau compositeur ou existant
- nouvelle collection
- nouvelles pièces
- nouvelles versions

### 2. Mise à jour d’une collection déjà présente dans le feed
- collection déjà confirmée dans le `feedForm`
- on réédite son contenu

### 3. Sélection d’une collection existante depuis la DB avec pièces déjà connues
- on récupère les pièces
- certaines n’ont pas encore de version
- on complète seulement les versions

Ces trois cas n’ont pas exactement les mêmes besoins, mais **dans tous les cas**, le bon principe reste :

> tout ce qui est modifié pendant le workflow doit vivre dans le state local collection jusqu’au submit final.

---

# Ce qui peut rester tel quel ou presque

## 1. Les types du state collection
Ils sont déjà globalement bien orientés.

Tu peux sans doute conserver :

- `collection`
- `persons`
- `pieces`
- `pieceVersions`
- `tempoIndications`
- `mMSourceOnPieceVersions`

## 2. Le reducer, dans sa philosophie
Le reducer est déjà pensé pour porter des entités locales.

Il faudra surtout :

- le fiabiliser
- mieux typer les payloads
- vérifier les resets
- s’assurer qu’il couvre les nouveaux usages

Mais ce n’est pas une refonte totale comparable à celle de `singlePiece`.

---

# Points précis de vigilance

## 1. `pieceIdsNeedingVersions`
Cette info est bien une donnée de workflow locale.  
Elle a sa place dans `formInfo`.

Mais si les pièces sont désormais locales, alors toutes les vérifications associées doivent aussi se faire **contre `state.pieces` et `state.pieceVersions`**, pas contre `feedForm`.

---

## 2. `tempoIndications`
Pour une collection, tu as un tableau local `tempoIndications`.

C’est cohérent ici, car plusieurs `pieceVersions` peuvent en produire.

### Recommandation
À chaque validation d’un `singlePiece` dans la collection :

- extraire les tempo indications depuis sa `pieceVersion`
- les upserter dans `state.tempoIndications`

Et au commit final seulement :
- projection vers `feedForm.tempoIndications`

---

## 3. localStorage
Le contexte collection persiste déjà dans le localStorage.

Si tu bascules réellement vers une isolation complète, le contenu stocké sera plus riche et plus “vrai”.

### À vérifier
- reprise d’une collection en cours
- reprise d’une édition de pièce dans la collection
- compatibilité éventuelle avec d’anciens états persistés

---

## 4. Édition d’une pièce au sein de la collection
Quand on ouvre l’édition d’une pièce depuis la collection, l’état initial du `singlePiece` doit venir du **state local collection**, pas du `feedForm`, si la pièce a déjà été modifiée dans le workflow courant.

Sinon tu risques de perdre des modifications non encore commit.

C’est un point très important.

---

# Plan d’action détaillé

Voici le plan que je te recommande, dans l’ordre.

---

## Phase 1 — Cadrage des responsabilités

## Objectif
Poser la règle d’architecture claire.

## Décision à formaliser
Pendant le workflow collection :

- `CollectionPieceVersionsFormState` = source de vérité
- `FeedFormState` = source d’initialisation + cible de commit final
- `SinglePieceVersionFormState` = sous-agrégat temporaire d’une pièce au sein de la collection

## Livrable
Une règle simple écrite noir sur blanc avant modification du code.

---

## Phase 2 — Refonte des handlers du container collection

## Objectif
Supprimer toutes les écritures prématurées dans `feedForm`.

## Modifications
### `onComposerCreated`
- écrire dans `collection context`
- plus dans `feedForm`

### `onComposerSelect`
- écrire dans `collection context`
- plus dans `feedForm`

### `onCancelComposerCreation`
- reset local seulement

### `onCollectionCreated`
- écrire dans `state.collection`
- plus dans `feedForm.collections`

### `onCollectionSelect`
- charger les pièces depuis l’API
- écrire dans `state.collection` et `state.pieces`
- plus dans `feedForm`

### `onCancelCollectionCreation`
- reset local seulement

### `onAddPieces`
- écrire dans `state.pieces`

### `onAddPieceVersion`
- écrire dans `state.pieceVersions`

## Livrable
Le workflow collection ne touche plus au `feedForm` en cours d’édition.

---

## Phase 3 — Projection du sous-formulaire single dans le state local collection

## Objectif
Faire du `singlePiece` un vrai sous-flux du formulaire collection.

## Modifications
Dans `onSinglePieceSubmit(...)` :

### Ajouter
- upsert du compositeur dans `state.persons`
- upsert de la pièce dans `state.pieces`
- upsert de la pieceVersion dans `state.pieceVersions`
- extraction/upsert des tempo indications dans `state.tempoIndications`
- mise à jour de `state.mMSourceOnPieceVersions`

### Vérifier
- conservation du rang en update
- affectation correcte de `collectionId`
- affectation correcte de `collectionRank`

## Livrable
Une pièce validée dans la collection est intégralement reflétée dans le state local collection.

---

## Phase 4 — Réécriture des lectures UI vers le contexte collection

## Objectif
Éviter toute dépendance fonctionnelle au `feedForm` pour les données en cours.

## Modifications
### Résumé de collection
- lire compositeur et collection dans `collection context`

### Formulaire d’édition des pièces de collection
- lire pièces, versions, compositeur depuis `collection context`

### Détection “new collection”
- utiliser `state.collection.isNew`

### Sélection/édition de collection
- ne plus dépendre de `getNewEntities(feedFormState, "collections")`

## Livrable
L’UI reste correcte même si aucune donnée intermédiaire n’est injectée dans `feedForm`.

---

## Phase 5 — Réhydratation correcte du mode édition

## Objectif
En édition, le formulaire doit travailler sur sa copie locale.

## Modifications
Quand on ouvre une collection à éditer :

- construire un `CollectionPieceVersionsFormState` hydraté
- y inclure non seulement :
    - `collection`
    - `mMSourceOnPieceVersions`
- mais aussi idéalement :
    - `persons`
    - `pieces`
    - `pieceVersions`
    - `tempoIndications`

### Pourquoi
Sinon dès l’ouverture, le formulaire restera dépendant du `feedForm`.

## Livrable
Le mode édition collection démarre avec un state local complet.

---

## Phase 6 — Fonction de commit final vers `feedForm`

## Objectif
Centraliser la synchronisation finale.

## À créer
Une utilité dédiée, sur le même principe que celle du `singlePiece`.

## Responsabilités
- valider la complétude minimale du state local
- upsert `persons`
- upsert `collections`
- upsert `pieces`
- upsert `pieceVersions`
- upsert `tempoIndications`
- mettre à jour `mMSourceOnPieceVersions`
- gérer create vs update

## Livrable
Point unique de projection globale.

---

## Phase 7 — Nettoyage des logiques compensatoires

## Objectif
Supprimer le code devenu inutile.

## À retirer
- suppressions dans `feedForm` lors des annulations
- dépendances aux “new entities” du `feedForm`
- hypothèse “si c’est nouveau, c’est déjà dans le global state”

## Livrable
Code plus simple, plus robuste, plus lisible.

---

## Phase 8 — Validation fonctionnelle

## Scénarios à tester
### Création
1. nouveau compositeur + nouvelle collection + nouvelles pièces + versions
2. compositeur existant + nouvelle collection
3. collection existante récupérée depuis API + ajout de versions manquantes

### Annulations
4. annulation après création compositeur
5. annulation après création collection
6. annulation après ajout d’une pièce dans la collection
7. fermeture complète du formulaire sans submit final

### Update
8. édition d’une collection déjà présente dans le feed
9. édition d’une pièce au sein de la collection puis cancel
10. édition d’une pièce puis validation collection entière

### Résilience
11. reprise localStorage du formulaire collection
12. reprise localStorage avec sous-formulaire single ouvert/fermé

---

# Priorité des modifications

Si tu veux séquencer proprement, je te conseille cet ordre :

## Priorité 1
**Arrêter les écritures prématurées dans `feedForm`**  
C’est le vrai changement architectural.

## Priorité 2
**Faire absorber au contexte collection le résultat du `singlePiece`**  
C’est indispensable pour que le mode collection fonctionne vraiment.

## Priorité 3
**Réorienter l’UI pour lire le contexte collection**  
Sinon le refactor restera cassant ou incomplet.

## Priorité 4
**Créer le commit final collection -> feedForm**  
Pour finaliser proprement la boucle.

---

# Synthèse finale

## Réponse courte
**Oui, le formulaire collection doit être adapté.**

## Pourquoi
Parce qu’il :

- écrit encore dans `feedForm` pendant l’édition
- lit encore les données de travail dans `feedForm`
- n’intègre pas complètement le résultat local du `singlePiece` dans son propre state
- ne respecte donc pas encore le principe d’isolation que tu vises

## Ce qu’il faut faire
Transformer le formulaire collection pour que :

- son contexte local devienne la **source de vérité unique**
- le `singlePiece` alimente ce contexte local
- le `feedForm` ne soit mis à jour **qu’au submit final de la collection entière**

---

Si tu veux, je peux maintenant te faire la suite sous une forme encore plus opérationnelle :

1. **liste fichier par fichier des changements à faire**,  
   ou 2. **plan d’implémentation technique précis avec pseudo-code des nouveaux handlers et du commit final collection**.