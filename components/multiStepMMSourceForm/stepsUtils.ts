import { FeedFormStep, SectionStateExtendedForMMForm } from "@/types/formTypes";
import Intro from "@/components/multiStepMMSourceForm/stepForms/Intro";
import MMSourceDescription from "@/components/multiStepMMSourceForm/stepForms/MMSourceDescription";
import MMSourceContributions from "@/components/multiStepMMSourceForm/stepForms/MMSourceContributions";
import MMSourcePieceVersions from "@/components/multiStepMMSourceForm/stepForms/MMSourcePieceVersions";
import MetronomeMarks from "@/components/multiStepMMSourceForm/stepForms/MetronomeMarks";
import FeedSummary from "@/components/multiStepMMSourceForm/stepForms/FeedSummary";
import { getSectionList } from "@/utils/getSectionList";
import getMetronomeMarkInputFromState from "@/utils/getMetronomeMarksInputFromState";
import { FeedFormState } from "@/types/feedFormTypes";
import { MetronomeMarkListSchema } from "@/types/zodTypes";

export const steps: FeedFormStep[] = [
  {
    rank: 0,
    id: "intro",
    actionTypes: ["formInfo"],
    title: "Introduction",
    isComplete: (state) => state?.formInfo?.introDone === true,
    Component: Intro,
  },
  {
    rank: 1,
    id: "mMSourceDescription",
    actionTypes: ["mMSourceDescription"],
    title: "MM Source description",
    isComplete: (state) => !!state?.mMSourceDescription,
    Component: MMSourceDescription,
  },
  {
    rank: 2,
    id: "mMSourceContributions",
    actionTypes: ["mMSourceContributions", "formInfo"],
    title: "MM Source contributors",
    isComplete: (state) => (state?.mMSourceContributions?.length || 0) > 0,
    Component: MMSourceContributions,
  },
  {
    rank: 3,
    id: "mMSourcePieceVersions",
    actionTypes: [
      "collections",
      "editedSourceOnPieceVersions",
      "formInfo",
      "mMSourcePieceVersions",
      "organizations",
      "persons",
      "pieces",
      "pieceVersions",
      "tempoIndications",
    ],
    title: "Pieces and Versions",
    isComplete: (state) =>
      (state?.mMSourcePieceVersions?.length || 0) > 0 &&
      !!state?.formInfo?.allSourcePieceVersionsDone,
    Component: MMSourcePieceVersions,
  },
  {
    rank: 4,
    id: "metronomeMarks",
    actionTypes: ["metronomeMarks", "formInfo"],
    title: "Metronome Marks",
    isComplete: (state) => {
      // Need to build the sectionList and validate marks for each section
      if (!state?.mMSourcePieceVersions?.length) return false;

      // Ensure we have all required pieceVersions in state (isComplete must be sync)
      const neededIds = new Set(
        state.mMSourcePieceVersions.map((s) => s.pieceVersionId),
      );
      const inState = (state.pieceVersions || []).filter((pv) =>
        neededIds.has(pv.id),
      );
      if (inState.length !== neededIds.size) {
        // Missing pieceVersions => cannot assert completion synchronously
        return false;
      }

      const sectionList = getSectionList(state, inState);
      return areMetronomeMarksCompleteForSections(state, sectionList);
    },
    Component: MetronomeMarks,
  },
  {
    rank: 5,
    id: "summary",
    actionTypes: ["formInfo"],
    title: "Summary",
    isComplete: () => false,
    Component: FeedSummary,
  },
];

export function getStepById(stepId: string): FeedFormStep {
  return steps.find((step) => step.id === stepId) || steps[0];
}
export function getStepByRank(rank: number): FeedFormStep {
  return steps.find((step) => step.rank === rank) || steps[0];
}

////////////////////////////////////// Utility functions ////////////////////////////////////

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
  const mmIds = new Set(
    defaultInput.metronomeMarks.map((m: any) => m.sectionId),
  );
  if (sectionIds.size !== mmIds.size) return false;
  for (const id of sectionIds) {
    if (!mmIds.has(id)) return false;
  }

  return true;
}
