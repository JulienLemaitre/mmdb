# Spécifications de refonte du state du sous-formulaire `SinglePieceVersionForm`

## Objectif

Isoler complètement les données en cours de création/édition d’une **single piece** dans le state du sous-formulaire, puis ne les recopier dans le `feedForm` **qu’au moment de la confirmation finale**.

En d’autres termes :

- **avant confirmation finale** : les données de `composer`, `piece` et `pieceVersion` vivent **uniquement** dans `singlePieceVersionForm`
- **après confirmation finale** : ces entités sont projetées dans `feedForm`, puis reliées à `mMSourceOnPieceVersions`

---

# 1. Analyse de l’existant

## 1.1. Rôle actuel des deux states

### `feedForm`
Le `feedForm` est le state global de l’édition de source.  
Il contient :

- les entités métier persistables :
    - `persons`
    - `pieces`
    - `pieceVersions`
    - `tempoIndications`
    - etc.
- la relation d’inclusion dans la source :
    - `mMSourceOnPieceVersions`
- l’état de navigation global

Il est donc à la fois :
- un state d’édition,
- un quasi-agrégat de données prêtes à être sauvegardées.

### `singlePieceVersionForm`
Le sous-formulaire de pièce simple ne contient actuellement que des pointeurs minimaux :

- `composer?: { id?: string; isNew?: boolean }`
- `piece?: { id?: string; isNew?: boolean }`
- `pieceVersion?: { id?: string; isNew?: boolean }`

Il ne transporte pas les objets complets.

---

## 1.2. Comportement actuel problématique

Aujourd’hui, quand l’utilisateur :

- crée un compositeur,
- crée une pièce,
- crée une version de pièce,

les objets complets sont **immédiatement injectés dans `feedForm`**.

Le sous-formulaire ne garde que :
- les ids,
- quelques flags `isNew`.

### Conséquences

1. **Violation de responsabilité**
    - le sous-formulaire n’est pas réellement autonome ;
    - il écrit dans le state global avant validation finale.

2. **Pollution prématurée du `feedForm`**
    - des entités non confirmées apparaissent dans le state global ;
    - il faut gérer des suppressions compensatoires lors des annulations.

3. **Logique de rollback fragile**
    - annuler une création implique de nettoyer `feedForm` ;
    - cette logique dépend de `isNew` et de suppressions à plusieurs endroits.

4. **Mode édition ambigu**
    - l’état d’édition est reconstruit à partir du `feedForm`, mais sans recopier les objets complets dans le sous-formulaire ;
    - le sous-formulaire travaille donc indirectement contre le global state.

5. **Couplage avec les composants d’étape**
    - les composants de sélection/création utilisent `feedForm` comme source pour retrouver les entités nouvellement créées.

---

## 1.3. Point juste dans ton intuition

Tu as raison sur le principe suivant :

> avec React Hook Form, les données n’entrent dans le state qu’à la soumission validée d’une étape ; donc le state du sous-formulaire doit contenir des entités complètes validées, pas des brouillons incomplets.

C’est exactement la bonne frontière :

- **RHF** gère le brouillon local à l’écran ;
- **le reducer du sous-formulaire** ne reçoit que des données validées ;
- **le `feedForm`** ne reçoit que le résultat final confirmé.

---

# 2. Cible fonctionnelle

## 2.1. Nouveau comportement attendu

### Création d’une single piece
- le sous-formulaire démarre vide ;
- à la validation de chaque étape, il stocke localement l’entité complète correspondante ;
- rien n’est ajouté dans `feedForm` tant que l’utilisateur n’a pas confirmé au summary.

### Édition d’une single piece existante
- le state initial du sous-formulaire est construit avec :
    - le compositeur complet,
    - la pièce complète,
    - la version complète,
    - le rang source (`mMSourceOnPieceVersionRank`)
- les modifications restent confinées au sous-formulaire ;
- au summary, on réécrit dans `feedForm` les entités finales puis le lien `mMSourceOnPieceVersions`.

---

# 3. Entités requises dans `singlePieceVersionForm`

## 3.1. Principe général

Le state du sous-formulaire doit contenir les **objets complets nécessaires à la feature**, pas juste leurs ids.

## 3.2. Structure cible recommandée

```typescript
type SinglePieceVersionFormState = {
  formInfo: SinglePieceVersionFormInfo;
  composer?: PersonState;
  piece?: PieceState;
  pieceVersion?: PieceVersionState;
};
```


Avec `SinglePieceVersionFormInfo` conservant :

```typescript
type SinglePieceVersionFormInfo = {
  currentStepRank: number;
  allSourceOnPieceVersionsDone?: boolean;
  mMSourceOnPieceVersionRank?: number;
};
```


---

## 3.3. Pourquoi ces 3 entités suffisent

### `composer: PersonState`
Nécessaire pour :
- afficher le résumé
- éditer un compositeur nouvellement créé
- distinguer une entité existante / nouvelle via `isNew`

### `piece: PieceState`
Nécessaire pour :
- stocker le titre, l’année, `composerId`
- porter éventuellement `collectionId` / `collectionRank` si utilisé en mode collection
- ne plus dépendre du `feedForm` pour retrouver les données sélectionnées

### `pieceVersion: PieceVersionState`
Nécessaire pour :
- stocker toute la structure mouvements / sections
- stocker les `tempoIndications` embarquées dans les sections
- rendre le summary autonome

---

## 3.4. Entités dérivées mais non stockées séparément

### `tempoIndications`
Pour la **single piece**, elles sont déjà embarquées dans `pieceVersion.movements[].sections[].tempoIndication`.

Donc :
- **pas nécessaire** de les dupliquer dans le state du sous-formulaire
- elles seront extraites au moment du commit final vers `feedForm`

C’est préférable pour éviter la divergence :
- une tempo indication dans la section
- une autre dans un tableau séparé local

---

# 4. Modifications requises sur les types

## 4.1. `SinglePieceVersionFormState`

### Remplacement
Actuel :
- objets minimaux `{ id, isNew }`

Cible :
- objets complets `PersonState`, `PieceState`, `PieceVersionState`

## 4.2. `SinglePieceVersionFormAction`

Les actions doivent désormais transporter les objets complets.

### Cible recommandée

```typescript
type SinglePieceVersionFormAction =
  | {
      type: "init";
      payload?: SinglePieceVersionFormState;
    }
  | { type: "goToPrevStep" }
  | { type: "goToStep"; payload: { stepRank: number } }
  | {
      type: "composer";
      payload: { value: PersonState | undefined; next?: boolean };
    }
  | {
      type: "piece";
      payload: { value: PieceState | undefined; next?: boolean };
    }
  | {
      type: "pieceVersion";
      payload: { value: PieceVersionState | undefined; next?: boolean };
    };
```


### Remarque
Permettre `undefined` est utile pour :
- reset d’une étape
- annulation locale
- invalidation des étapes dépendantes

---

# 5. Modifications à apporter au reducer

## 5.1. Rôle cible du reducer

Le reducer doit devenir le **gardien de cohérence locale** du sous-formulaire.

Il doit :

1. stocker les entités complètes validées ;
2. invalider les dépendances en cascade ;
3. gérer la navigation par étapes ;
4. ne jamais écrire dans `feedForm`.

---

## 5.2. Comportement attendu par action

## Action `init`
### Attendu
- remplace entièrement le state local par le state initial fourni
- accepte soit :
    - l’état vide
    - un état d’édition complètement hydraté

### Important
Le payload doit être le state lui-même, pas `{ value }`, pour rester cohérent avec `feedForm`.

---

## Action `composer`
### Attendu
- stocker l’objet `PersonState` complet
- si le compositeur change réellement d’identité, invalider :
    - `piece`
    - `pieceVersion`

### Règle d’invalidation
Comparer l’ancien `composer.id` au nouveau `composer.id`.

Si différent :
- supprimer `piece`
- supprimer `pieceVersion`

---

## Action `piece`
### Attendu
- stocker l’objet `PieceState` complet
- garantir la cohérence avec le compositeur courant :
    - `piece.composerId` doit correspondre à `composer.id`
- si la pièce change réellement d’identité, invalider `pieceVersion`

### Règle d’invalidation
Comparer ancien `piece.id` / nouveau `piece.id`.

Si différent :
- supprimer `pieceVersion`

---

## Action `pieceVersion`
### Attendu
- stocker l’objet `PieceVersionState` complet
- garantir :
    - `pieceVersion.pieceId === piece.id`

---

## Action `goToPrevStep`
### Attendu
- navigation simple vers l’étape précédente
- ne modifie pas les entités

---

## Action `goToStep`
### Attendu
- navigation explicite
- utile notamment pour édition de collection préexistante ou reprise

---

## 5.3. Ce qu’il faut supprimer du reducer actuel

### À retirer
La logique actuelle fondée sur des objets minimaux :
- comparaison par `state[action.type]?.id`
- suppression dynamique sur `newState[entity]` avec mutation

### Pourquoi
Le reducer doit devenir plus explicite et typé.

---

## 5.4. Logique d’invalidation recommandée

Plus robuste en version explicite :

- si action `composer` avec changement d’id :
    - `piece = undefined`
    - `pieceVersion = undefined`

- si action `piece` avec changement d’id :
    - `pieceVersion = undefined`

- si action `pieceVersion` :
    - pas d’invalidation aval

---

## 5.5. Complétude des étapes

Les `isComplete` peuvent rester simples :

- composer complet si `!!state.composer?.id`
- piece complète si `!!state.piece?.id`
- pieceVersion complète si `!!state.pieceVersion?.id`

Mais conceptuellement, l’étape représente maintenant :
- une entité complète validée,
- pas seulement un id.

---

# 6. Impact sur les composants du sous-formulaire

## 6.1. `SinglePieceVersionFormContainer`

C’est le point principal de refonte.

## Aujourd’hui
Il :
- crée/sélectionne des entités
- les injecte dans `feedForm`
- ne garde dans le sous-formulaire que `{ id, isNew }`

## Demain
Il doit :
- créer/sélectionner des entités
- les injecter uniquement dans `singlePieceVersionForm`
- n’écrire dans `feedForm` qu’au `onSubmitSourceOnPieceVersions`

---

## 6.2. Nouveau flux par étape

### Étape compositeur
#### Création
- construire `PersonState`
- dispatcher dans `singlePieceVersionForm` via `composer`
- **ne pas** écrire dans `feedForm`

#### Sélection
- récupérer le compositeur existant
- le stocker tel quel dans `singlePieceVersionForm`

#### Annulation
- simple reset local de `composer`
- plus aucune suppression compensatoire dans `feedForm`

---

### Étape pièce
#### Création
- construire `PieceState`
- lui affecter `composerId` depuis `state.composer.id`
- gérer `collectionId` / `collectionRank` si mode collection
- stocker dans `singlePieceVersionForm`

#### Sélection
- stocker l’objet `PieceState` complet dans `singlePieceVersionForm`

#### Annulation
- reset local uniquement

---

### Étape pieceVersion
#### Création
- construire `PieceVersionState`
- lui affecter `pieceId` depuis `state.piece.id`
- stocker dans `singlePieceVersionForm`

#### Sélection
- stocker l’objet `PieceVersionState` complet

#### Annulation
- reset local puis retour étape précédente si c’est le comportement voulu

---

## 6.3. Summary
Le summary doit lire :
- `composer`, `piece`, `pieceVersion`
  directement depuis `singlePieceVersionForm`.

Il ne doit plus dépendre du `feedForm` pour re-résoudre les ids.

---

# 7. Commit final vers `feedForm`

## 7.1. Moment unique d’écriture globale

Tout doit se faire dans la confirmation finale du sous-formulaire.

### Séquence recommandée
1. valider que `composer`, `piece`, `pieceVersion` existent
2. extraire les `tempoIndications` de `pieceVersion`
3. upsert dans `feedForm` :
    - `persons`
    - `pieces`
    - `pieceVersions`
    - `tempoIndications`
4. upsert / replace `mMSourceOnPieceVersions`
5. fermer le sous-formulaire

---

## 7.2. Détail du commit

### Composer
Toujours upsert le `composer` du sous-formulaire dans `feedForm.persons`.

### Piece
Toujours upsert `piece` dans `feedForm.pieces`.

### PieceVersion
Toujours upsert `pieceVersion` dans `feedForm.pieceVersions`.

### Tempo indications
Extraire les `tempoIndication` depuis toutes les sections de `pieceVersion`.

#### Règle
- dédupliquer par `id`
- les insérer/upserter dans `feedForm.tempoIndications`

---

## 7.3. Cas update

Quand on édite une single piece existante :
- les ids restent les mêmes ;
- l’upsert remplacera les versions précédentes dans `feedForm`.

Le `mMSourceOnPieceVersionRank` existant reste utilisé pour conserver le rang.

---

# 8. Initialisation en mode édition

## 8.1. Problème actuel
L’état d’édition construit dans `onEditMMSourceOnPieceVersion` ne contient que :
- ids du compositeur
- ids de la pièce
- ids de la version

## 8.2. Cible
Il faut construire un `SinglePieceVersionFormState` hydraté :

```typescript
{
  formInfo: {
    currentStepRank: 0,
    mMSourceOnPieceVersionRank: rank,
  },
  composer,
  piece,
  pieceVersion,
}
```


avec les objets complets issus du `feedForm`.

---

# 9. Dépendances techniques à adapter

## 9.1. `SinglePieceVersionFormSummary`
Doit lire localement :
- `state.composer`
- `state.piece`

et non rechercher ces objets dans `feedForm`.

## 9.2. `Summary` de l’étape finale
Doit lire :
- `piece`
- `pieceVersion`
  du sous-formulaire.

## 9.3. `ComposerSelectOrCreate`, `PieceSelectOrCreate`, `PieceVersionSelectOrCreate`
Aujourd’hui, ils détectent les créations récentes via `getNewEntities(feedFormState, ...)`.

Il faudra les réorienter pour qu’ils s’appuient d’abord sur :
- le state local du sous-formulaire,
- puis sur les listes fetchées du serveur,
- éventuellement sur `feedForm` seulement comme source secondaire de lecture si nécessaire.

### Point clé
Pour la single piece, les “new entities” du workflow courant ne seront plus présentes dans `feedForm`.

Donc leur logique actuelle doit être revue.

---

# 10. Décision d’architecture recommandée

## 10.1. Règle simple
### `singlePieceVersionForm` contient :
- l’entité sélectionnée ou validée à chaque étape
- complète et cohérente

### `feedForm` contient :
- seulement les entités confirmées au summary
- plus la relation source/pièce

---

## 10.2. Avantages

1. **isolation forte**
2. **annulation triviale**
3. **édition plus sûre**
4. **moins de nettoyage compensatoire**
5. **meilleure lisibilité métier**
6. **moins de dépendance cachée entre formulaires**

---

# 11. Modifications précises à apporter au reducer du context

## 11.1. Spécification fonctionnelle du reducer

### Entrée
- `state: SinglePieceVersionFormState`
- `action: SinglePieceVersionFormAction`

### Sortie
- nouveau state local cohérent
- persistence localStorage inchangée via wrapper

---

## 11.2. Règles métier à implémenter

### Règle 1 — init
Remplacement complet.

### Règle 2 — set composer
- `composer = payload.value`
- si `composer.id` différent de l’ancien :
    - `piece = undefined`
    - `pieceVersion = undefined`

### Règle 3 — set piece
- `piece = payload.value`
- si `piece.id` différent de l’ancien :
    - `pieceVersion = undefined`

### Règle 4 — set pieceVersion
- `pieceVersion = payload.value`

### Règle 5 — next
Incrémenter `currentStepRank` seulement si l’étape courante est complète après update.

### Règle 6 — goToPrevStep / goToStep
Navigation pure.

---

## 11.3. Règles de robustesse supplémentaires

Le reducer peut aussi protéger la cohérence :

### Quand on stocke `piece`
Si `state.composer?.id` existe et `value.composerId !== state.composer.id` :
- soit corriger `value.composerId` avec `state.composer.id`,
- soit lever un warning.

Je recommande de **corriger avant dispatch dans le container**, et de garder un warning défensif dans le reducer.

### Quand on stocke `pieceVersion`
Si `state.piece?.id` existe et `value.pieceId !== state.piece.id` :
- même logique.

---

# 12. Plan de mise en œuvre détaillé

## Phase 1 — Spécification et types
### Tâches
1. Redéfinir `SinglePieceVersionFormState`
2. Redéfinir `SinglePieceVersionFormAction`
3. Vérifier les helpers liés aux steps
4. Ajuster l’état initial

### Livrables
- types mis à jour
- compilation TypeScript cassée volontairement sur les usages restants à corriger

---

## Phase 2 — Reducer local
### Tâches
1. Réécrire `singlePieceVersionFormReducer`
2. Implémenter l’invalidation explicite des dépendances
3. Conserver la navigation et la persistence localStorage
4. Ajouter des commentaires/JSDoc sur les décisions métier

### Livrables
- reducer autonome, typé, sans dépendance implicite au `feedForm`

---

## Phase 3 — Hydratation du mode édition
### Tâches
1. Modifier la construction du state initial dans l’édition d’une single piece
2. Injecter les objets complets `composer`, `piece`, `pieceVersion`
3. Vérifier la reprise depuis localStorage

### Livrables
- édition ouverte avec sous-formulaire entièrement hydraté

---

## Phase 4 — Refonte du container principal
### Tâches
1. Supprimer les écritures prématurées dans `feedForm`
2. Réécrire :
    - `onComposerCreated`
    - `onComposerSelect`
    - `onCancelComposerCreation`
    - `onPieceCreated`
    - `onPieceSelect`
    - `onCancelPieceCreation`
    - `onPieceVersionCreated`
    - `onPieceVersionSelect`
    - `onCancelPieceVersionCreation`
3. Faire reposer toute la navigation sur le state local

### Livrables
- `SinglePieceVersionFormContainer` n’écrit plus dans `feedForm` avant summary

---

## Phase 5 — Refonte des composants d’étape
### Tâches
1. Adapter `SinglePieceVersionFormSummary`
2. Adapter l’étape `Summary`
3. Adapter les trois composants :
    - `ComposerSelectOrCreate`
    - `PieceSelectOrCreate`
    - `PieceVersionSelectOrCreate`

### Points d’attention
- ils ne doivent plus supposer que les nouvelles entités sont dans `feedForm`
- leur mode “édition/création en cours” doit se baser sur le state local

### Livrables
- UI des étapes cohérente avec le nouveau modèle

---

## Phase 6 — Commit final dans le `feedForm`
### Tâches
1. Implémenter une fonction dédiée de projection :
    - `commitSinglePieceVersionFormToFeedForm(...)`
2. Y centraliser :
    - upsert `persons`
    - upsert `pieces`
    - upsert `pieceVersions`
    - extraction/upsert `tempoIndications`
    - update `mMSourceOnPieceVersions`
3. Réutiliser le rang existant en mode update

### Livrables
- point unique de synchronisation vers le state global

---

## Phase 7 — Nettoyage et simplification
### Tâches
1. Supprimer la logique de suppression compensatoire devenue inutile
2. Nettoyer les props devenues obsolètes
3. Réduire l’usage de `feedFormState` dans le sous-formulaire au strict minimum
4. Vérifier l’absence de dépendance résiduelle à `getNewEntities(feedFormState, ...)`

### Livrables
- code plus simple
- moins de branches conditionnelles liées à `isNew`

---

## Phase 8 — Validation fonctionnelle
### Tâches
Tester manuellement les scénarios :

1. création d’un compositeur + pièce + version puis confirmation
2. création puis annulation à chaque étape
3. sélection d’un compositeur existant, création d’une pièce, puis annulation
4. sélection d’une pièce existante, création d’une version, puis annulation
5. édition d’une single piece existante puis confirmation
6. édition d’une single piece existante puis cancel
7. reprise via localStorage en cours de sous-formulaire
8. impact sur ordre/rank dans `mMSourceOnPieceVersions`

### Livrables
- checklist de validation
- bugs résiduels identifiés

---

# 13. Chronologie recommandée

## J1 — cadrage technique
- mise à jour des types
- spécification du reducer
- définition de la fonction de commit final

## J2 — reducer + init edit mode
- refonte du reducer
- adaptation de l’initialisation en mode édition
- vérification localStorage

## J3 — container principal
- suppression des écritures prématurées dans `feedForm`
- adaptation des handlers create/select/cancel

## J4 — composants d’étape
- adaptation des composants summary/select/create
- correction des dépendances à `feedForm`

## J5 — commit final + extraction tempo indications
- implémentation de la projection vers `feedForm`
- sécurisation du mode update

## J6 — tests et stabilisation
- tests manuels complets
- nettoyage
- documentation technique

---

# 14. Risques et points de vigilance

## 14.1. Dépendance cachée à `feedForm`
C’est le principal risque.  
Plusieurs composants supposent aujourd’hui que les entités nouvellement créées sont déjà dans `feedForm`.

## 14.2. Tempo indications
Comme elles sont embarquées dans les sections, il faudra bien centraliser leur extraction au moment du commit final.

## 14.3. localStorage
Le state persisté du sous-formulaire change de forme.  
Prévoir :
- soit une migration simple tolérante,
- soit une invalidation douce des anciens états stockés.

## 14.4. Mode collection
Le sous-formulaire single est aussi utilisé dans un contexte collection.  
Il faut veiller à ne pas casser :
- l’auto-saut d’étape compositeur
- l’injection de `collectionId` / `collectionRank` dans `piece`

---

# 15. Recommandations d’implémentation

## 15.1. Créer une fonction dédiée de commit
Je recommande fortement une utilité du style :

```typescript
commitSinglePieceVersionFormToFeedForm({
  singlePieceVersionFormState,
  feedFormState,
  feedFormDispatch,
  isUpdateMode,
  isCollectionMode,
  collectionFormState,
})
```


Cela évite que `onSubmitSourceOnPieceVersions` porte trop de logique métier.

---

## 15.2. Créer une utilité d’extraction des tempo indications
Exemple de responsabilité :
- parcourir `pieceVersion.movements[].sections[]`
- extraire `section.tempoIndication`
- dédupliquer par `id`

---

## 15.3. Garder le reducer simple
Le reducer ne doit pas :
- reconstruire des entités,
- parler à `feedForm`,
- faire de l’upsert global.

Il doit seulement :
- stocker localement,
- invalider proprement,
- naviguer.

---

# 16. Résultat attendu après refonte

À la fin du projet :

- le sous-formulaire single devient **un vrai agrégat isolé**
- les annulations ne nécessitent plus de nettoyage du `feedForm`
- le mode édition repose sur un state local complet
- le `feedForm` ne contient plus de données intermédiaires non confirmées
- la logique métier devient plus prévisible

---

# 17. Synthèse exécutable

## Décisions structurantes
1. `SinglePieceVersionFormState` doit stocker les objets complets :
    - `PersonState`
    - `PieceState`
    - `PieceVersionState`

2. Le reducer doit :
    - mettre à jour ces objets complets
    - invalider les dépendances descendantes
    - ne jamais écrire dans `feedForm`

3. Le container du sous-formulaire doit :
    - cesser toute écriture prématurée dans `feedForm`
    - ne faire le commit global qu’au summary

4. Le mode édition doit hydrater le state local complet dès l’ouverture

5. Les `tempoIndications` doivent être extraites depuis `pieceVersion` au commit final

---

Si tu veux, je peux maintenant produire la **version “spécification technique prête à implémenter”** sous forme plus opérationnelle, avec :

- **schéma exact des nouveaux types**
- **pseudo-code détaillé du reducer**
- **liste fichier par fichier des modifications à faire**.