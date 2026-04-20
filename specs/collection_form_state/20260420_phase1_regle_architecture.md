# Phase 1 — Règle d’architecture (workflow collection)

Date : 2026-04-20
Décideur technique : Julien (décision unilatérale)

## Contexte
Cette règle formalise la séparation des responsabilités de state pour le workflow d’édition d’une collection.

## Règle
Pendant tout le workflow collection :

- `CollectionPieceVersionsFormState` est la **source de vérité unique** des données en cours d’édition.
- `FeedFormState` est utilisé uniquement comme :
  - **source d’initialisation** à l’ouverture du workflow,
  - **cible de commit final** à la validation finale du formulaire collection.
- `SinglePieceVersionFormState` est un **sous-agrégat temporaire** pour l’édition d’une pièce au sein du workflow collection, puis ses résultats sont projetés dans `CollectionPieceVersionsFormState`.

## Conséquence directe
Avant la validation finale du formulaire collection, aucune écriture intermédiaire ne doit être faite dans `FeedFormState`.

## Portée
Cette règle couvre la Phase 1 du plan défini dans `specs/20260406_collection-form-state-isolation.md`.
