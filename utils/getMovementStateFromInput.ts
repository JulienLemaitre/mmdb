import { MovementInput, MovementState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";
import getSectionStateFromInput from "@/utils/getSectionStateFromInput";

export default function getMovementStateFromInput(
  movementInput: MovementInput,
): MovementState {
  return {
    id: movementInput.id || uuidv4(),
    rank: movementInput.rank,
    key: movementInput.key.value as MovementState["key"],
    sections: movementInput.sections.map((sectionInput) =>
      getSectionStateFromInput(sectionInput),
    ),
  };
}
