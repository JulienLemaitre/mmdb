import { SectionInput, SectionState } from "@/types/formTypes";
import { v4 as uuidv4 } from "uuid";

export default function getSectionStateFromInput(
  sectionInput: SectionInput,
): SectionState {
  return {
    ...sectionInput,
    id: sectionInput.id || uuidv4(),
    tempoIndication: {
      text: sectionInput.tempoIndication.value,
    },
  };
}
