import { MetronomeMarkInput, MetronomeMarkState } from "@/types/formTypes";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import { NOTE_VALUE } from "@/prisma/client/enums";

export default function getMetronomeMarkInputFromState(
  metronomeMark: MetronomeMarkState,
): MetronomeMarkInput {
  const { sectionId, noMM, id } = metronomeMark;

  return noMM
    ? {
        ...(id ? { id } : {}),
        sectionId,
        noMM: true,
      }
    : {
        ...(id ? { id } : {}),
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
