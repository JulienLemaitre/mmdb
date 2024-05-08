import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";

export default function getMetronomeMarkInputFromState(
  metronomeMark?: MetronomeMarkState,
): MetronomeMarkInput | undefined {
  if (!metronomeMark) {
    return;
  }

  const { sectionId, noMM } = metronomeMark;

  const metronomeMarkInput: MetronomeMarkInput = noMM
    ? {
        sectionId,
        noMM: true,
      }
    : {
        noMM: !metronomeMark.beatUnit,
        sectionId,
        bpm: metronomeMark.bpm,
        comment: metronomeMark.comment,
        beatUnit: {
          value: metronomeMark.beatUnit,
          label: metronomeMark.beatUnit,
        },
      };

  return metronomeMarkInput;
}
