import { FeedFormState } from "@/types/feedFormTypes";
import { PieceVersionState, SectionStateExtendedForMMForm } from "@/types/formTypes";

/**
 * Build the section list used to collect metronome marks.
 * This mirrors the logic currently used in MetronomeMarks.tsx.
 */
export function getSectionList(
  state: FeedFormState,
  pieceVersions: PieceVersionState[],
): SectionStateExtendedForMMForm[] {
  if (!state.mMSourcePieceVersions || state.mMSourcePieceVersions.length === 0) {
    return [];
  }

  return state.mMSourcePieceVersions.reduce<SectionStateExtendedForMMForm[]>(
    (sectionList, mMSourceOnPieceVersion) => {
      const pieceVersion = pieceVersions.find(
        (pv) => pv.id === mMSourceOnPieceVersion.pieceVersionId,
      );
      if (!pieceVersion) {
        throw new Error(
          `[getSectionList] NO pieceVersion for mMSourceOnPieceVersion.pieceVersionId: ${mMSourceOnPieceVersion.pieceVersionId}`,
        );
      }

      return [
        ...sectionList,
        ...pieceVersion.movements.reduce<SectionStateExtendedForMMForm[]>(
          (acc, movement) => [
            ...acc,
            ...movement.sections.map((section) => ({
              ...section,
              movement: {
                ...movement,
                sections: undefined,
              },
              mMSourceOnPieceVersion,
              pieceId: pieceVersion.pieceId,
            })),
          ],
          [],
        ),
      ];
    },
    [],
  );
}
