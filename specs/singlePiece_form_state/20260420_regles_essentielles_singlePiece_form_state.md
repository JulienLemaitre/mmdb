# SinglePiece form state — Décisions essentielles

Date : 2026-04-20  
Décideur technique : Julien (décision unilatérale)

## Source de référence
Document de base : `specs/20260330_Isolation_state_task_with-original-message.md`.

## Objet
Formaliser, noir sur blanc, les décisions structurantes à conserver pour l’isolation du state du sous-formulaire `SinglePieceVersionForm`.

## Règle d’architecture
Pendant tout le workflow d’édition d’une single piece :

- `SinglePieceVersionFormState` est la **source de vérité unique** des données en cours d’édition.
- `FeedFormState` est utilisé uniquement comme :
  - **source d’initialisation** à l’ouverture,
  - **cible de commit final** à la validation finale.
- Avant la validation finale, **aucune écriture intermédiaire** ne doit être faite dans `FeedFormState`.

## Entités obligatoires dans `SinglePieceVersionFormState`
Le state local doit stocker les **objets complets** (pas seulement des ids) :

- `composer: PersonState`
- `piece: PieceState`
- `pieceVersion: PieceVersionState`

Les `tempoIndications` restent une donnée dérivée de `pieceVersion` :

- elles sont extraites au moment du commit final,
- puis upsertées dans `FeedFormState`.

## Règles du reducer local
Le reducer de `singlePieceVersionFormContext` doit :

- gérer exclusivement le state local,
- ne jamais écrire dans `FeedFormState`,
- appliquer les invalidations de dépendances :
  - changement de `composer` ⇒ invalidation de `piece` et `pieceVersion`,
  - changement de `piece` ⇒ invalidation de `pieceVersion`,
- gérer la navigation (`next`, `goToPrevStep`, `goToStep`) sans logique d’upsert global.

## Règles de flux dans le container
Dans `SinglePieceVersionFormContainer` :

- les actions de création/sélection/annulation (compositeur, pièce, version) modifient seulement `SinglePieceVersionFormState`,
- le summary lit les données locales,
- le commit vers `FeedFormState` est exécuté **une seule fois**, à la confirmation finale.

## Règles de commit final vers `FeedFormState`
Le commit final est un point unique qui doit :

- upserter `composer`, `piece`, `pieceVersion`,
- mettre à jour `mMSourceOnPieceVersions`,
- extraire les `tempoIndications` depuis `pieceVersion.movements[].sections[]`,
- dédupliquer les `tempoIndications` par `id` avant upsert,
- gérer correctement les cas `create` et `update`.

## Règles d’initialisation en mode édition
À l’ouverture d’une single piece existante, le state local doit être **hydraté complètement** avec :

- `composer` complet,
- `piece` complète,
- `pieceVersion` complète.

Le mode édition ne doit pas dépendre d’écritures intermédiaires dans `FeedFormState`.

## Contraintes de robustesse
- Supprimer les logiques de rollback compensatoire dans `FeedFormState` pendant le workflow.
- Prendre en compte l’évolution de forme du state persistant (`localStorage`) via migration tolérante ou invalidation douce.
- Préserver la compatibilité du mode collection (notamment les règles liées à `collectionId` / `collectionRank` quand `SinglePieceVersionForm` est utilisé en sous-flux).

## Validation fonctionnelle minimale
Vérifier au minimum :

- création complète d’une single piece sans pollution préalable du `FeedFormState`,
- annulation à chaque étape sans nettoyage global compensatoire,
- édition d’une single piece existante avec hydratation locale complète,
- commit final unique et cohérent (entités + `mMSourceOnPieceVersions` + `tempoIndications`).

## Portée
Ce document couvre l’essentiel des décisions du plan global défini dans `specs/20260330_Isolation_state_task_with-original-message.md` (et pas uniquement une phase de cadrage).