import { v4 as uuidv4 } from "uuid";
import { SectionInput } from "@/types/formTypes";

export function getMovementDefaultValues() {
  return {
    id: uuidv4(),
    key: { value: undefined, label: undefined },
    sections: [getSectionDefaultValues()],
  };
}
export function getSectionDefaultValues(): SectionInput {
  return {
    id: uuidv4(),
    metreNumerator: 0,
    metreDenominator: 0,
    fastestStructuralNotesPerBar: 0,
    tempoIndication: { value: "", label: "" },
  };
}
