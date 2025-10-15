import { getSectionDefaultValues } from "@/features/section/utils/getSectionDefaultValues";
import { getNewUuid } from "@/utils/getNewUuid";

export function getMovementDefaultValues() {
  return {
    id: getNewUuid(),
    sections: [getSectionDefaultValues()],
  };
}
