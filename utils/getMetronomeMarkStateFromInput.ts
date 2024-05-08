import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";

export default function getMetronomeMarkStateFromInput(
  metronomeMarkInput: MetronomeMarkInput[],
): MetronomeMarkState[] {
  return metronomeMarkInput.map((mMinput) => {
    const { sectionId, noMM } = mMinput;

    const metronomeMarkState: MetronomeMarkState = noMM
      ? {
          sectionId,
          noMM: true,
        }
      : {
          sectionId,
          bpm: mMinput.bpm,
          comment: mMinput.comment,
          beatUnit: mMinput.beatUnit.value,
          noMM: false,
        };
    return metronomeMarkState;
  });
}
