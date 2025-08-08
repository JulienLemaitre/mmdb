import { SectionStateExtendedForMMForm } from "@/types/formTypes";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import { FeedFormState } from "@/types/feedFormTypes";

type MetronomeMarkDefaultItem =
  | ReturnType<typeof getMetronomeMarkInputFromState>
  | {
      sectionId: string;
      comment: string;
    };

type MetronomeMarkDefaultValues = {
  metronomeMarks: MetronomeMarkDefaultItem[];
};

/**
 * Build the same defaultValues structure as MetronomeMarksForm does.
 * This ensures any validation outside the form matches what the form would build.
 */
export function buildMetronomeMarkDefaultValues(
  sectionList: SectionStateExtendedForMMForm[],
  state: FeedFormState,
): MetronomeMarkDefaultValues {
  return {
    metronomeMarks: sectionList.map((section) => {
      const existing = state.metronomeMarks?.find(
        (mm) => mm.sectionId === section.id,
      );
      if (existing) return getMetronomeMarkInputFromState(existing);
      return {
        sectionId: section.id,
        comment: "",
      };
    }),
  };
}
