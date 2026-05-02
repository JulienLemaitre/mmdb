import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import upsertEntityInState from "@/utils/upsertEntityInState";

export function upsertManyEntities<
  EntityName extends
    | "persons"
    | "pieces"
    | "pieceVersions"
    | "tempoIndications",
>(
  state: CollectionPieceVersionsFormState,
  entityName: EntityName,
  entities: NonNullable<CollectionPieceVersionsFormState[EntityName]>,
): CollectionPieceVersionsFormState {
  let newState = state;

  entities.forEach((entity) => {
    newState = upsertEntityInState({
      state: newState,
      entityName,
      entity,
    });
  });

  return newState;
}
