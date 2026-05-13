import { MMSourceOnPieceVersionsState } from "@/types/formTypes";
import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import upsertEntityInState from "@/utils/upsertEntityInState";

/**
 * Append the given mMSourceOnPieceVersions
 * - if idKey provided, we use it to find the entity in state and update it
 * @param state
 * @param array
 * @param [idKey]
 */
export function upsertManyMMSourceOnPieceVersions(
  state: CollectionPieceVersionsFormState,
  array: MMSourceOnPieceVersionsState[],
  idKey?: string,
): CollectionPieceVersionsFormState {
  let newState = { ...state };

  array.forEach((entity) => {
    const id = idKey || "id";

    newState = upsertEntityInState({
      state: newState,
      entityName: "mMSourceOnPieceVersions",
      entity,
      idKey: id,
    });
  });

  return {
    ...newState,
    mMSourceOnPieceVersions: (newState.mMSourceOnPieceVersions || []).map(
      (mmSourceOnPieceVersion, index) => ({
        ...mmSourceOnPieceVersion,
        rank: index + 1,
      }),
    ),
  };
}
