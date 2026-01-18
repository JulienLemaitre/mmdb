import { PieceVersionInput, PieceVersionState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";
import getMovementStateFromInput from "@/utils/getMovementStateFromInput";

export default function getPieceVersionStateFromInput({
  pieceVersionInput,
  pieceVersionId,
  pieceId,
}: {
  pieceVersionInput: PieceVersionInput;
  pieceVersionId?: string;
  pieceId: string;
}): PieceVersionState {
  return {
    ...pieceVersionInput,
    pieceId,
    id: pieceVersionInput.id || pieceVersionId || uuidv4(),
    category: pieceVersionInput.category.value as PieceVersionState["category"],
    movements: pieceVersionInput.movements.map((movementInput, index) =>
      getMovementStateFromInput(movementInput, index),
    ),
  };
}
