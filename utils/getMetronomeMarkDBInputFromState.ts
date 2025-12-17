import { Prisma } from "@/prisma/client";
import {
  assertsIsMetronomeMarkWithValue,
  MetronomeMarkState,
} from "@/types/formTypes";

export default function getMetronomeMarkDBInputFromState(
  metronomeMark: MetronomeMarkState,
  mMSourceId: string,
): Prisma.MetronomeMarkCreateManyInput {
  assertsIsMetronomeMarkWithValue(metronomeMark);
  return {
    id: metronomeMark.id,
    sectionId: metronomeMark.sectionId,
    bpm: metronomeMark.bpm,
    comment: metronomeMark.comment,
    beatUnit: metronomeMark.beatUnit,
    mMSourceId,
  };
}
