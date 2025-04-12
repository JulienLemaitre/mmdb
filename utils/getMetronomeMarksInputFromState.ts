import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import { NOTE_VALUE } from "@prisma/client";

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
        noMM: false,
        sectionId,
        bpm: metronomeMark.bpm,
        comment: metronomeMark.comment,
        beatUnit: {
          value: metronomeMark.beatUnit,
          label: getNoteValueLabel(metronomeMark.beatUnit as NOTE_VALUE),
        },
      };
}
