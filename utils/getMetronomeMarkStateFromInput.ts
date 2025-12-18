import {
  MetronomeMarkInput,
  MetronomeMarkState,
  SectionStateExtendedForMMForm,
} from "@/types/formTypes";

export default function getMetronomeMarkStateFromInput(
  metronomeMarkInput: MetronomeMarkInput[],
  sectionList: SectionStateExtendedForMMForm[],
): MetronomeMarkState[] {
  return metronomeMarkInput.map((mMinput, index) => {
    const sectionInfo = sectionList[index];
    if (!sectionInfo) {
      throw new Error(
        `Could not find section info with index ${index} in sectionList: ${sectionList}`,
      );
    }
    const { pieceVersionId } = sectionInfo.mMSourceOnPieceVersion;
    const { sectionId, noMM } = mMinput;

    const metronomeMarkState: MetronomeMarkState = noMM
      ? {
          sectionId,
          noMM: true,
          pieceVersionId,
        }
      : {
          sectionId,
          bpm: mMinput.bpm,
          comment: mMinput.comment,
          beatUnit: mMinput.beatUnit.value,
          noMM: false,
          pieceVersionId,
        };
    return metronomeMarkState;
  });
}
