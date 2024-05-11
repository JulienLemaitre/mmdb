import { Prisma } from "@prisma/client";
import { PersistableFeedFormState } from "@/components/context/feedFormContext";
import getPersonNestedDBInputFromState from "@/utils/getPersonNestedDBInputFromState";

export default function getPieceNestedDBInputFromState(
  pieceId: string,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.PieceCreateNestedOneWithoutPieceVersionsInput {
  const newPiece = state.pieces.find(
    (piece) => piece.id === pieceId && piece.isNew,
  );

  if (!newPiece) {
    return {
      connect: {
        id: pieceId,
      },
    };
  }

  return {
    create: {
      id: newPiece.id,
      nickname: newPiece.nickname,
      yearOfComposition: newPiece.yearOfComposition,
      title: newPiece.title,
      composer: getPersonNestedDBInputFromState(
        newPiece.composerId,
        state,
        creatorId,
      ),
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  };
}
