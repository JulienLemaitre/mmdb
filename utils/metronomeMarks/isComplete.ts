import { MetronomeMarkListSchema } from "./schema";
import { SectionStateExtendedForMMForm } from "@/types/formTypes";
import { buildMetronomeMarkDefaultValues } from "./defaultValues";
import { FeedFormState } from "@/types/feedFormTypes";

/**
 * Returns:
 * - true if we have a valid list covering every section and at least one (beatUnit+bpm) entry
 * - false otherwise
 */
export function areMetronomeMarksCompleteForSections(
  state: FeedFormState,
  sectionList: SectionStateExtendedForMMForm[],
): boolean {
  if (sectionList.length === 0) return false;

  const defaultInput = buildMetronomeMarkDefaultValues(sectionList, state);

  // Validate shape first
  const parse = MetronomeMarkListSchema.safeParse(defaultInput);
  if (!parse.success) return false;

  // Check at least one "real" MM (with beatUnit and bpm)
  const hasAtLeastOneRealMM = defaultInput.metronomeMarks.some(
    (mm: any) => mm && mm.noMM === false && mm.beatUnit?.value && mm.bpm,
  );
  if (!hasAtLeastOneRealMM) return false;

  // Ensure we have one entry per section id
  const sectionIds = new Set(sectionList.map((s) => s.id));
  const mmIds = new Set(defaultInput.metronomeMarks.map((m: any) => m.sectionId));
  if (sectionIds.size !== mmIds.size) return false;
  for (const id of sectionIds) {
    if (!mmIds.has(id)) return false;
  }

  return true;
}
