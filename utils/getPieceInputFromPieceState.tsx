import { PieceInput, PieceState } from "@/types/editFormTypes";

export default function getPieceInputFromPieceState(
  pieceState: PieceState,
): PieceInput {
  const pieceInput: PieceInput = {
    id: pieceState.id,
    title: pieceState.title,
    nickname: pieceState.nickname,
    yearOfComposition: pieceState.yearOfComposition,
  };
  return pieceInput;
}
