import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";

export default function getMetronomeMarkInputFromState(
  metronomeMark?: MetronomeMarkState,
): MetronomeMarkInput | undefined {
  if (!metronomeMark) {
    return;
  }

  const { sectionId, bpm, comment, beatUnit } = metronomeMark;

  const metronomeMarkInput: MetronomeMarkInput = {
    sectionId,
    bpm,
    comment,
    beatUnit: { value: beatUnit, label: beatUnit },
  };

  return metronomeMarkInput;
}
