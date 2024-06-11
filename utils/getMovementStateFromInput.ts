import { MovementInput, MovementState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";
import getSectionStateFromInput from "@/utils/getSectionStateFromInput";

export default function getMovementStateFromInput(
  movementInput: MovementInput,
  index: number,
): MovementState {
  return {
    id: movementInput.id || uuidv4(),
    rank: index + 1,
    key: movementInput.key.value as MovementState["key"],
    sections: movementInput.sections.map((sectionInput, index) =>
      getSectionStateFromInput(sectionInput, index),
    ),
  };
}
