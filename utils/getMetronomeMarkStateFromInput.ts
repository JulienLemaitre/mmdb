import { MetronomeMarkInput } from "@/types/formTypes";

export default function getMetronomeMarkStateFromInput(
  metronomeMarkInput: MetronomeMarkInput[],
) {
  return metronomeMarkInput.map((mMinput) => ({
    sectionId: mMinput.sectionId,
    bpm: mMinput.bpm,
    comment: mMinput.comment,
    beatUnit: mMinput.beatUnit.value,
  }));
}
