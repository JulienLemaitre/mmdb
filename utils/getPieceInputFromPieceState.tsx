import { PieceInput, PieceState } from "@/types/formTypes";

export default function getPieceInputFromPieceState(
  pieceState: PieceState,
): PieceInput {
  const pieceInput: PieceInput = {
    id: pieceState.id,
    title: pieceState.title,
    nickname: pieceState.nickname,
    ...(pieceState.yearOfComposition
      ? { yearOfComposition: pieceState.yearOfComposition }
      : {}),
  };
  return pieceInput;
}
