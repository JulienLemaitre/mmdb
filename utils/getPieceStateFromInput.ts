import { PieceInput, PieceState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";

export default function getPieceStateFromInput(
  pieceInput: PieceInput & { composerId: string },
): PieceState {
  return {
    ...pieceInput,
    yearOfComposition: pieceInput.yearOfComposition
      ? parseInt(pieceInput.yearOfComposition, 10)
      : null,
    id: pieceInput.id || uuidv4(),
  };
}
