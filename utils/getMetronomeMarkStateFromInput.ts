import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";

export default function getMetronomeMarkStateFromInput(
  metronomeMarkInput: MetronomeMarkInput[],
): MetronomeMarkState[] {
  return metronomeMarkInput.map((mMinput) => ({
    sectionId: mMinput.sectionId,
    bpm: mMinput.bpm,
    comment: mMinput.comment || null,
    beatUnit: mMinput.beatUnit.value,
  }));
}
