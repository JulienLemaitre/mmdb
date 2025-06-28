import { Prisma } from "@prisma/client";
import { PieceState } from "@/types/formTypes";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

export default function getPieceNestedDBInputFromState(
  pieceId: string,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.PieceCreateNestedOneWithoutPieceVersionsInput {
  const newPiece: PieceState | undefined = state.pieces.find(
    (piece) => piece.id === pieceId && piece.isNew,
  );

  if (!newPiece) {
    return {
      connect: {
        id: pieceId,
      },
    };
  }

  const newCollection = state.collections.find(
    (collection) => collection.id === newPiece.collectionId && collection.isNew,
  );

  return {
    create: {
      id: newPiece.id,
      nickname: newPiece.nickname,
      yearOfComposition: newPiece.yearOfComposition,
      title: newPiece.title,
      // New composer are persisted before this query, so we just connect to it be it new or not
      composer: {
        connect: {
          id: newPiece.composerId,
        },
      },
      creator: {
        connect: {
          id: creatorId,
        },
      },
      ...(newCollection
        ? {
            // New collection is persisted before this query, so we just need to connect to it
            collection: {
              connect: {
                id: newCollection.id,
              },
            },
            collectionRank: newPiece.collectionRank,
          }
        : {}),
    },
  };
}
