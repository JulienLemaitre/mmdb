import { v4 as uuidv4 } from "uuid";

export function getMovementDefaultValues() {
  return {
    id: uuidv4(),
    sections: [getSectionDefaultValues()],
  };
}
export function getSectionDefaultValues() {
  return {
    id: uuidv4(),
    isCutTime: false,
    isCommonTime: false,
    isFastestStructuralNoteBelCanto: false,
  };
}
