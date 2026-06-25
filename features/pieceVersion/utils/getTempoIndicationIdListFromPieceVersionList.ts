import { PieceVersion } from "@/types/prismaSelections";

export function getTempoIndicationIdListFromPieceVersionList(
  pieceVersionList: PieceVersion[],
): string[] {
  if (!pieceVersionList) return [];

  const tempoIndicationIdList = new Set<string>();

  pieceVersionList.forEach((pieceVersion) => {
    pieceVersion.movements.forEach((movement) => {
      movement.sections.forEach((section) => {
        tempoIndicationIdList.add(section.tempoIndicationId);
      });
    });
  });

  return Array.from(tempoIndicationIdList);
}
