import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";
import getNoteValueLabel from "@/utils/getNoteValueLabel";

export default function getMetronomeMarkInputFromState(
  metronomeMark: MetronomeMarkState,
): MetronomeMarkInput {
  const { sectionId, noMM } = metronomeMark;

  return noMM
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
          label: getNoteValueLabel(metronomeMark.beatUnit),
        },
      };
}
