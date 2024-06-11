import { SectionInput, SectionState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";

export default function getSectionStateFromInput(
  sectionInput: SectionInput,
  index: number,
): SectionState {
  return {
    ...sectionInput,
    rank: index + 1,
    id: sectionInput.id || uuidv4(),
    tempoIndication: {
      id: sectionInput.tempoIndication.value,
      text: sectionInput.tempoIndication.label,
    },
  };
}
