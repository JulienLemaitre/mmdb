import { CollectionPieceVersionsFormState } from "@/types/collectionPieceVersionFormTypes";
import { prodLog } from "@/utils/debugLogger";

export function moveMMSourceOnPieceVersion(
  state: CollectionPieceVersionsFormState,
  movePiece: { pieceVersionId: string; direction: "up" | "down" },
): CollectionPieceVersionsFormState {
  const currentArray = state.mMSourceOnPieceVersions || [];

  const itemToMove = currentArray.find(
    (item) => item.pieceVersionId === movePiece.pieceVersionId,
  );

  if (!itemToMove) {
    prodLog.warn(
      `[collectionPieceVersionsFormReducer] Cannot find mMSourceOnPieceVersion to move for pieceVersionId: ${movePiece.pieceVersionId}`,
    );
    return state;
  }

  const targetRank =
    movePiece.direction === "up" ? itemToMove.rank - 1 : itemToMove.rank + 1;

  const itemAtTargetRank = currentArray.find(
    (item) => item.rank === targetRank,
  );

  if (!itemAtTargetRank) {
    prodLog.warn(
      `[collectionPieceVersionsFormReducer] Cannot find piece version at rank ${targetRank}`,
    );
    return state;
  }

  const nextArray = currentArray
    .map((item) => {
      if (item.pieceVersionId === movePiece.pieceVersionId) {
        return { ...item, rank: itemAtTargetRank.rank };
      }

      if (item.pieceVersionId === itemAtTargetRank.pieceVersionId) {
        return { ...item, rank: itemToMove.rank };
      }

      return item;
    })
    .sort((a, b) => a.rank - b.rank)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return {
    ...state,
    mMSourceOnPieceVersions: nextArray,
  };
}
