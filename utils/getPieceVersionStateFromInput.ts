import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";
import getMovementStateFromInput from "@/utils/getMovementStateFromInput";

export default function getPieceVersionStateFromInput(
  pieceVersionInput: PieceVersionInput,
): PieceVersionState {
  return {
    ...pieceVersionInput,
    id: pieceVersionInput.id || uuidv4(),
    category: pieceVersionInput.category.value as PieceVersionState["category"],
    movements: pieceVersionInput.movements.map((movementInput) =>
      getMovementStateFromInput(movementInput),
    ),
  };
}
