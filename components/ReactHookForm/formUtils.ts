export const SECTION_DEFAULT_VALUE = {
  rank: 1,
  isCutTime: "",
  isCommonTime: "",
  isFastestStructuralNoteBelCanto: "",
};
export const MOVEMENT_DEFAULT_VALUE = {
  rank: 1,
  sections: [SECTION_DEFAULT_VALUE],
};
export function getMovementDefaultValues(index: number) {
  return {
    ...MOVEMENT_DEFAULT_VALUE,
    rank: index + 2,
  };
}
export function getSectionDefaultValues(index: number) {
  return {
    ...SECTION_DEFAULT_VALUE,
    rank: index + 2,
  };
}
