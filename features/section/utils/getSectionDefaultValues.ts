import { getNewUuid } from "@/utils/getNewUuid";

export function getSectionDefaultValues() {
  return {
    id: getNewUuid(),
    metreNumerator: 0,
    metreDenominator: 0,
    fastestStructuralNotesPerBar: 0,
  };
}
