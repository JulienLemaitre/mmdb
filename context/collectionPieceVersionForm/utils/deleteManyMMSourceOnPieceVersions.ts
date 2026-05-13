import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";

export function deleteManyMMSourceOnPieceVersions(
  state: CollectionPieceVersionsFormState,
  deleteIdArray: string[],
): CollectionPieceVersionsFormState {
  const nextArray = (state.mMSourceOnPieceVersions || []).filter(
    (item) => !deleteIdArray.includes(item.pieceVersionId),
  );

  return {
    ...state,
    mMSourceOnPieceVersions: nextArray.map((item, index) => ({
      ...item,
      rank: index + 1,
    })),
  };
}
