import { z } from "zod";
import { getZodOptionFromEnum, zodPositiveNumber } from "@/types/zodTypes";
import { NOTE_VALUE } from "@prisma/client";

export const MetronomeMarkSchema = z.discriminatedUnion("noMM", [
  z.object({
    noMM: z.literal(true),
    sectionId: z.string(),
    comment: z.string().optional().nullable(),
  }),
  z.object({
    noMM: z.literal(false),
    sectionId: z.string(),
    beatUnit: getZodOptionFromEnum(NOTE_VALUE),
    bpm: zodPositiveNumber,
    comment: z.string().optional().nullable(),
  }),
]);

export const MetronomeMarkListSchema = z.object({
  metronomeMarks: z.array(MetronomeMarkSchema).nonempty(),
});
