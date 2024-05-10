import { v4 as uuidv4 } from "uuid";

export function getMovementDefaultValues(indexAfterWhichAppend?: number) {
  return {
    id: uuidv4(),
    rank:
      typeof indexAfterWhichAppend === "number" ? indexAfterWhichAppend + 2 : 1,
    sections: [getSectionDefaultValues()],
  };
}
export function getSectionDefaultValues(indexAfterWhichAppend?: number) {
  return {
    id: uuidv4(),
    isCutTime: false,
    isCommonTime: false,
    isFastestStructuralNoteBelCanto: false,
    rank:
      typeof indexAfterWhichAppend === "number" ? indexAfterWhichAppend + 2 : 1,
  };
}
